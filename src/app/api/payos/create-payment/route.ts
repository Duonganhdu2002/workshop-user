import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PayOS } from '@payos/node'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

// Initialize PayOS client
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, amount, description } = body

    if (!registrationId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: registrationId and amount' },
        { status: 400 }
      )
    }

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check if PayOS payment already exists for this registration
    if (registration.payos_payment_id) {
      const { data: existingPayment, error: paymentError } = await supabase
        .from('payos_payments')
        .select('*')
        .eq('id', registration.payos_payment_id)
        .single()

      if (!paymentError && existingPayment) {
        // If payment link is still valid (not expired or cancelled), return existing link
        if (existingPayment.status === 'pending' && existingPayment.payment_link) {
          return NextResponse.json({
            paymentLink: existingPayment.payment_link,
            paymentLinkId: existingPayment.payment_link_id,
            payosCode: existingPayment.payos_code,
            payosPaymentId: existingPayment.id
          })
        }
      }
    }

    // Create payment link with PayOS
    const orderCode = Date.now() // Use timestamp as order code
    const paymentData = {
      orderCode: orderCode,
      amount: parseInt(amount),
      description: description || `Thanh toán đăng ký workshop - Ghế số ${registration.seat_number}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/?payment=cancelled&id=${registrationId}`,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/?payment=success&id=${registrationId}`
    }

    const paymentLinkResponse = await payOS.paymentRequests.create(paymentData)

    if (!paymentLinkResponse || !paymentLinkResponse.checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    // Save payment information to database
    const { data: payosPayment, error: insertError } = await supabase
      .from('payos_payments')
      .insert({
        registration_id: registrationId,
        payos_code: paymentLinkResponse.orderCode.toString(),
        amount: parseInt(amount),
        description: paymentData.description,
        payment_link_id: paymentLinkResponse.paymentLinkId,
        payment_link: paymentLinkResponse.checkoutUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving PayOS payment:', insertError)
      return NextResponse.json(
        { error: 'Failed to save payment information' },
        { status: 500 }
      )
    }

    // Update registration with payos_payment_id and payment_method
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payos_payment_id: payosPayment.id,
        payment_method: 'payos'
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('Error updating registration:', updateError)
      // Don't fail the request, payment link was created successfully
    }

    return NextResponse.json({
      paymentLink: paymentLinkResponse.checkoutUrl,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
      payosCode: paymentLinkResponse.orderCode.toString(),
      payosPaymentId: payosPayment.id
    })
  } catch (error: any) {
    console.error('Error creating PayOS payment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

