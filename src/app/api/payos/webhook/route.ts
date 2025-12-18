import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PayOS } from '@payos/node'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

// Initialize PayOS client for webhook verification
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
})

// Handle GET request for webhook URL verification (PayOS sends GET to verify endpoint)
export async function GET(request: NextRequest) {
  // PayOS may send GET request to verify webhook URL is accessible
  // Return 200 OK to confirm endpoint exists
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    endpoint: '/api/payos/webhook'
  }, { status: 200 })
}

// Handle POST request for actual webhook notifications
export async function POST(request: NextRequest) {
  // Always return 200 OK to PayOS to prevent retries
  // Log errors but don't fail the webhook
  try {
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError)
      // Return 200 even if parsing fails to prevent PayOS retries
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON body',
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 200 })
    }

    console.log('Received PayOS webhook:', JSON.stringify(body, null, 2))
    
    // Verify webhook signature
    let webhookData: any = null
    try {
      webhookData = await payOS.webhooks.verify(body)
    } catch (verifyError) {
      console.error('Error verifying webhook signature:', verifyError)
      // Return 200 but log the error
      return NextResponse.json({
        success: false,
        message: 'Webhook verification failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 200 })
    }

    if (!webhookData) {
      console.error('Webhook verification returned null/undefined')
      return NextResponse.json({
        success: false,
        message: 'Invalid webhook signature'
      }, { status: 200 })
    }

    // Extract data from webhook - PayOS may send data in different formats
    // Try multiple possible locations for orderCode
    const orderCode = webhookData.orderCode || 
                     webhookData.data?.orderCode || 
                     webhookData.order_code ||
                     body.orderCode ||
                     body.data?.orderCode ||
                     body.order_code
    
    const code = webhookData.code || 
                 webhookData.data?.code || 
                 body.code ||
                 orderCode?.toString()
    
    const desc = webhookData.desc || 
                 webhookData.data?.desc || 
                 webhookData.description ||
                 body.desc ||
                 body.description

    if (!orderCode) {
      console.error('Missing orderCode in webhook data. Full webhook data:', JSON.stringify({
        webhookData,
        body
      }, null, 2))
      return NextResponse.json({
        success: false,
        message: 'Missing orderCode in webhook data'
      }, { status: 200 })
    }

    console.log(`Processing webhook for orderCode: ${orderCode}, desc: ${desc}`)

    // Find the payment record
    const { data: payosPayment, error: paymentError } = await supabase
      .from('payos_payments')
      .select('*, registrations(*)')
      .eq('payos_code', orderCode.toString())
      .single()

    if (paymentError || !payosPayment) {
      console.error('PayOS payment not found:', {
        orderCode: orderCode.toString(),
        error: paymentError,
        code
      })
      // Return 200 but log the error
      return NextResponse.json({
        success: false,
        message: 'Payment not found',
        orderCode: orderCode.toString()
      }, { status: 200 })
    }

    // If payment doesn't have registration_id but has temp data, create registration when payment succeeds
    let registrationId = payosPayment.registration_id
    const tempData = (payosPayment as any).temp_name && (payosPayment as any).temp_email && (payosPayment as any).temp_phone && (payosPayment as any).temp_seat_number
      ? {
          name: (payosPayment as any).temp_name,
          email: (payosPayment as any).temp_email,
          phone: (payosPayment as any).temp_phone,
          seat_number: (payosPayment as any).temp_seat_number
        }
      : null

    // Update payment status based on webhook data
    let paymentStatus = 'pending'
    if (desc === 'success' || desc === 'SUCCESS') {
      paymentStatus = 'paid'
    } else if (desc === 'cancelled' || desc === 'CANCELLED') {
      paymentStatus = 'cancelled'
    } else if (desc === 'expired' || desc === 'EXPIRED') {
      paymentStatus = 'expired'
    }

    console.log(`Updating payment status to: ${paymentStatus}`)

    // If payment is cancelled or expired, release the seat
    if (paymentStatus === 'cancelled' || paymentStatus === 'expired') {
      const registration = payosPayment.registrations as any
      const seatNum = registration?.seat_number || (payosPayment as any).temp_seat_number
      
      if (seatNum) {
        const seatReleaseQuery = supabase
          .from('seats')
          .update({
            status: 'available',
            registration_id: null,
            selected_by: null,
            selected_at: null,
            expires_at: null
          })
          .eq('seat_number', seatNum)

        // If we have registration_id, add that condition
        if (payosPayment.registration_id) {
          seatReleaseQuery.eq('registration_id', payosPayment.registration_id)
        }

        const { error: seatReleaseError } = await seatReleaseQuery

        if (seatReleaseError) {
          console.error('Error releasing seat after payment cancellation:', seatReleaseError)
        } else {
          console.log(`Seat ${seatNum} released after payment ${paymentStatus}`)
        }
      }
    }

    // Update payment record
    const { error: updatePaymentError } = await supabase
      .from('payos_payments')
      .update({
        status: paymentStatus,
        webhook_data: body,
        updated_at: new Date().toISOString()
      })
      .eq('id', payosPayment.id)

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError)
      // Return 200 but log the error
      return NextResponse.json({
        success: false,
        message: 'Failed to update payment',
        error: updatePaymentError.message
      }, { status: 200 })
    }

    // If payment is successful, create registration if needed and update payment status
    if (paymentStatus === 'paid') {
      // If no registration exists but we have temp data, create registration now
      if (!registrationId && tempData) {
        console.log('Creating registration from temp data:', tempData)
        
        // Check for duplicates one more time before creating
        const { data: existingRegistrations, error: checkError } = await supabase
          .from('registrations')
          .select('id, email, phone')
          .or(`email.eq.${tempData.email},phone.eq.${tempData.phone}`)
          .limit(1)

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing registrations:', checkError)
        }

        if (existingRegistrations && existingRegistrations.length > 0) {
          console.error('Duplicate registration found, cannot create:', tempData)
          // Don't fail webhook, but log the issue
        } else {
          // Create registration
          const { data: newRegistration, error: createRegError } = await supabase
            .from('registrations')
            .insert({
              name: tempData.name,
              email: tempData.email,
              phone: tempData.phone,
              seat_number: tempData.seat_number,
              payment_status: 'verified',
              payment_method: 'payos'
            })
            .select()
            .single()

          if (createRegError) {
            console.error('Error creating registration:', createRegError)
            // Don't fail webhook, payment was successful
          } else {
            registrationId = newRegistration.id
            console.log('Registration created successfully:', registrationId)

            // Update payos_payment with registration_id
            await supabase
              .from('payos_payments')
              .update({
                registration_id: registrationId
              })
              .eq('id', payosPayment.id)

            // Update seat status to 'booked'
            const { error: seatUpdateError } = await supabase
              .from('seats')
              .update({
                status: 'booked',
                registration_id: registrationId,
                selected_by: null,
                selected_at: null,
                expires_at: null
              })
              .eq('seat_number', tempData.seat_number)

            if (seatUpdateError) {
              console.error('Error updating seat to booked status:', seatUpdateError)
            } else {
              console.log(`Seat ${tempData.seat_number} marked as booked after successful payment`)
            }
          }
        }
      }

      // Update registration payment status if registration exists
      if (registrationId) {
        const { error: updateRegError } = await supabase
          .from('registrations')
          .update({
            payment_status: 'verified',
            payos_payment_id: payosPayment.id,
            payment_method: 'payos',
            updated_at: new Date().toISOString()
          })
          .eq('id', registrationId)

        if (updateRegError) {
          console.error('Error updating registration:', updateRegError)
          // Don't fail the webhook, payment was recorded
        } else {
          console.log('Registration payment status updated to verified')
        }

        // Update seat status to 'booked' when payment is successful (if not already done)
        const registration = payosPayment.registrations as any
        const seatNum = registration?.seat_number || tempData?.seat_number
        
        if (seatNum) {
          const { error: seatUpdateError } = await supabase
            .from('seats')
            .update({
              status: 'booked',
              registration_id: registrationId,
              selected_by: null,
              selected_at: null,
              expires_at: null
            })
            .eq('seat_number', seatNum)

          if (seatUpdateError) {
            console.error('Error updating seat to booked status:', seatUpdateError)
            // Don't fail the webhook, payment was successful
          } else {
            console.log(`Seat ${seatNum} marked as booked after successful payment`)
          }
        }
      }

      // Automatically send QR code email to customer (only if registration exists)
      if (registrationId) {
        try {
          console.log('Sending QR code email to customer for registration:', registrationId)
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          
          const qrResponse = await fetch(`${baseUrl}/api/send-qr-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId: registrationId
            })
          })

          if (!qrResponse.ok) {
            const qrError = await qrResponse.json().catch(() => ({}))
            console.error('Failed to send QR code email:', qrError)
            // Don't fail webhook, payment was successful
          } else {
            console.log('QR code email sent successfully to customer')
          }
        } catch (err) {
          console.error('Error sending QR code email:', err)
          // Don't fail webhook, payment was successful
        }

        // Send notification to staff
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          
          await fetch(`${baseUrl}/api/notify-staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registration_id: registrationId,
              payment_method: 'payos',
              payos_code: code?.toString() || orderCode.toString()
            })
          }).catch(err => console.error('Failed to notify staff:', err))
        } catch (err) {
          console.error('Error notifying staff:', err)
        }
      }
    }

    console.log('Webhook processed successfully')
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      orderCode: orderCode.toString(),
      status: paymentStatus
    }, { status: 200 })
  } catch (error: any) {
    console.error('Unexpected error processing PayOS webhook:', error)
    // Always return 200 to prevent PayOS retries
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown error'
    }, { status: 200 })
  }
}

