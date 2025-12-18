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
  try {
    const body = await request.json()
    
    // Verify webhook signature
    const webhookData = await payOS.webhooks.verify(body)

    if (!webhookData) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Extract data from webhook
    const orderCode = webhookData.orderCode
    const code = webhookData.code || orderCode.toString()
    const desc = webhookData.desc

    // Find the payment record
    const { data: payosPayment, error: paymentError } = await supabase
      .from('payos_payments')
      .select('*, registrations(*)')
      .eq('payos_code', orderCode.toString())
      .single()

    if (paymentError || !payosPayment) {
      console.error('PayOS payment not found:', code)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status based on webhook data
    let paymentStatus = 'pending'
    if (desc === 'success') {
      paymentStatus = 'paid'
    } else if (desc === 'cancelled') {
      paymentStatus = 'cancelled'
    } else if (desc === 'expired') {
      paymentStatus = 'expired'
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
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      )
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
      }

      // Automatically send QR code email to customer
      try {
        console.log('Sending QR code email to customer for registration:', payosPayment.registration_id)
        const qrResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-qr-code`, {
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

      // Send notification to staff
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_id: payosPayment.registration_id,
            payment_method: 'payos',
            payos_code: code.toString()
          })
        }).catch(err => console.error('Failed to notify staff:', err))
      } catch (err) {
        console.error('Error notifying staff:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    })
  } catch (error: any) {
    console.error('Error processing PayOS webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

