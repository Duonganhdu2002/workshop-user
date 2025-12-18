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

    // If payment is successful, update registration payment status and send QR code
    if (paymentStatus === 'paid') {
      const registration = payosPayment.registrations as any
      
      // Update registration payment status
      const { error: updateRegError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', payosPayment.registration_id)

      if (updateRegError) {
        console.error('Error updating registration:', updateRegError)
        // Don't fail the webhook, payment was recorded
      } else {
        console.log('Registration payment status updated to verified')
      }

      // Automatically send QR code email to customer
      try {
        console.log('Sending QR code email to customer for registration:', payosPayment.registration_id)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        
        const qrResponse = await fetch(`${baseUrl}/api/send-qr-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: payosPayment.registration_id
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

      // Send notification to staff - chỉ khi thanh toán thành công
      try {
        // Lấy thông tin đầy đủ của registration để gửi email
        const { data: registrationData, error: regDataError } = await supabase
          .from('registrations')
          .select('name, email, phone, seat_number, created_at')
          .eq('id', payosPayment.registration_id)
          .single()

        if (!regDataError && registrationData) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          
          console.log('Sending payment success notification to staff for registration:', payosPayment.registration_id)
          await fetch(`${baseUrl}/api/notify-staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registration_id: payosPayment.registration_id,
              name: registrationData.name,
              email: registrationData.email,
              phone: registrationData.phone,
              seat_number: registrationData.seat_number,
              payment_method: 'payos',
              payos_code: code?.toString() || orderCode.toString()
            })
          }).catch(err => console.error('Failed to notify staff:', err))
        } else {
          console.error('Error fetching registration data for staff notification:', regDataError)
        }
      } catch (err) {
        console.error('Error notifying staff:', err)
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

