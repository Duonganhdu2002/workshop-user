import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PayOS } from '@payos/node'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

// Validate PayOS environment variables
const payosClientId = process.env.PAYOS_CLIENT_ID
const payosApiKey = process.env.PAYOS_API_KEY
const payosChecksumKey = process.env.PAYOS_CHECKSUM_KEY

if (!payosClientId || !payosApiKey || !payosChecksumKey) {
  console.error('Missing PayOS environment variables:', {
    hasClientId: !!payosClientId,
    hasApiKey: !!payosApiKey,
    hasChecksumKey: !!payosChecksumKey
  })
}

// Initialize PayOS client
let payOS: PayOS | null = null
try {
  if (payosClientId && payosApiKey && payosChecksumKey) {
    payOS = new PayOS({
      clientId: payosClientId,
      apiKey: payosApiKey,
      checksumKey: payosChecksumKey
    })
  }
} catch (error) {
  console.error('Error initializing PayOS client:', error)
}

export async function POST(request: NextRequest) {
  try {
    // Check if PayOS is configured
    if (!payOS) {
      console.error('PayOS client not initialized. Missing environment variables.')
      return NextResponse.json(
        { 
          error: 'PayOS is not configured. Please check environment variables: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY' 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      registrationId, // Optional - chỉ có khi đã có registration
      customerName, 
      customerEmail, 
      customerPhone, 
      seatNumber, 
      sessionId,
      amount, 
      description 
    } = body

    // Nếu không có registrationId, phải có đầy đủ thông tin customer
    if (!registrationId && (!customerName || !customerEmail || !customerPhone || !seatNumber)) {
      return NextResponse.json(
        { error: 'Missing required fields: either registrationId or (customerName, customerEmail, customerPhone, seatNumber)' },
        { status: 400 }
      )
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Get registration details nếu có registrationId
    let registration: any = null
    if (registrationId) {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .single()

      if (regError || !regData) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        )
      }
      registration = regData
    }

    // Check if PayOS payment already exists
    if (registrationId) {
      // Check by registration.payos_payment_id
      if (registration.payos_payment_id) {
        const { data: existingPayment, error: paymentError } = await supabase
          .from('payos_payments')
          .select('*')
          .eq('id', registration.payos_payment_id)
          .single()

        if (!paymentError && existingPayment) {
          // If payment link is still valid (not expired or cancelled), return existing link
          if (existingPayment.status === 'pending' && existingPayment.payment_link) {
            console.log('Returning existing PayOS payment link:', existingPayment.id)
            return NextResponse.json({
              paymentLink: existingPayment.payment_link,
              paymentLinkId: existingPayment.payment_link_id,
              payosCode: existingPayment.payos_code,
              payosPaymentId: existingPayment.id
            })
          }
        }
      }

      // Also check by registration_id directly
      const { data: existingPaymentByRegId, error: paymentByRegError } = await supabase
        .from('payos_payments')
        .select('*')
        .eq('registration_id', registrationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!paymentByRegError && existingPaymentByRegId && existingPaymentByRegId.payment_link) {
        console.log('Found existing pending PayOS payment by registration_id:', existingPaymentByRegId.id)
        // Update registration with payos_payment_id if not set
        if (!registration.payos_payment_id) {
          await supabase
            .from('registrations')
            .update({
              payos_payment_id: existingPaymentByRegId.id,
              payment_method: 'payos'
            })
            .eq('id', registrationId)
        }
        return NextResponse.json({
          paymentLink: existingPaymentByRegId.payment_link,
          paymentLinkId: existingPaymentByRegId.payment_link_id,
          payosCode: existingPaymentByRegId.payos_code,
          payosPaymentId: existingPaymentByRegId.id
        })
      }
    } else {
      // Check by sessionId và seatNumber nếu không có registrationId
      const { data: existingPaymentBySession, error: paymentBySessionError } = await supabase
        .from('payos_payments')
        .select('*')
        .eq('customer_email', customerEmail)
        .eq('seat_number', seatNumber)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!paymentBySessionError && existingPaymentBySession && existingPaymentBySession.payment_link) {
        console.log('Found existing pending PayOS payment by customer info:', existingPaymentBySession.id)
        return NextResponse.json({
          paymentLink: existingPaymentBySession.payment_link,
          paymentLinkId: existingPaymentBySession.payment_link_id,
          payosCode: existingPaymentBySession.payos_code,
          payosPaymentId: existingPaymentBySession.id
        })
      }
    }

    // Create payment link with PayOS
    // Use a unique order code (timestamp + random number to avoid collisions)
    const orderCode = Date.now() + Math.floor(Math.random() * 1000)
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    // PayOS requires description to be max 25 characters
    // Create a short description
    const seatNum = registration?.seat_number || seatNumber
    const defaultDescription = `Workshop - Ghế ${seatNum}`
    let paymentDescription = description || defaultDescription
    
    // Truncate to 25 characters if too long
    if (paymentDescription.length > 25) {
      paymentDescription = paymentDescription.substring(0, 22) + '...'
    }
    
    // Tạo paymentId tạm để track payment nếu không có registrationId
    const tempPaymentId = registrationId || `temp_${orderCode}`
    
    const paymentData = {
      orderCode: orderCode,
      amount: amountNum,
      description: paymentDescription,
      cancelUrl: `${baseUrl}/?payment=cancelled&paymentId=${tempPaymentId}`,
      returnUrl: `${baseUrl}/?payment=success&paymentId=${tempPaymentId}`
    }

    console.log('Creating PayOS payment link with data:', {
      orderCode: paymentData.orderCode,
      amount: paymentData.amount,
      description: paymentData.description,
      hasClientId: !!payosClientId,
      hasApiKey: !!payosApiKey,
      hasChecksumKey: !!payosChecksumKey
    })

    let paymentLinkResponse
    try {
      paymentLinkResponse = await payOS.paymentRequests.create(paymentData)
    } catch (payosError: any) {
      console.error('PayOS API error:', {
        message: payosError?.message,
        error: payosError,
        paymentData: {
          orderCode: paymentData.orderCode,
          amount: paymentData.amount
        }
      })
      
      // Provide more specific error messages
      if (payosError?.message?.includes('signature') || payosError?.message?.includes('checksum')) {
        return NextResponse.json(
          { 
            error: 'PayOS signature error. Please check PAYOS_CHECKSUM_KEY environment variable.',
            details: payosError.message
          },
          { status: 500 }
        )
      }
      
      if (payosError?.message?.includes('authentication') || payosError?.message?.includes('unauthorized')) {
        return NextResponse.json(
          { 
            error: 'PayOS authentication error. Please check PAYOS_CLIENT_ID and PAYOS_API_KEY environment variables.',
            details: payosError.message
          },
          { status: 500 }
        )
      }
      
      // Handle description length error
      if (payosError?.message?.includes('25') || payosError?.message?.includes('Mô tả tối đa')) {
        return NextResponse.json(
          { 
            error: 'Description quá dài. PayOS chỉ cho phép tối đa 25 ký tự.',
            details: payosError.message
          },
          { status: 400 }
        )
      }
      
      throw payosError
    }

    if (!paymentLinkResponse || !paymentLinkResponse.checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    // Save payment information to database với thông tin customer
    const paymentInsertData: any = {
      registration_id: registrationId || null, // null nếu chưa có registration
      payos_code: paymentLinkResponse.orderCode.toString(),
      amount: amountNum,
      description: paymentData.description,
      payment_link_id: paymentLinkResponse.paymentLinkId,
      payment_link: paymentLinkResponse.checkoutUrl,
      status: 'pending'
    }

    // Thêm thông tin customer nếu không có registrationId (lưu tạm để tạo registration sau)
    if (!registrationId && customerName && customerEmail && customerPhone && seatNumber) {
      paymentInsertData.customer_name = customerName
      paymentInsertData.customer_email = customerEmail
      paymentInsertData.customer_phone = customerPhone
      paymentInsertData.seat_number = seatNumber
      paymentInsertData.session_id = sessionId || null
    }

    const { data: payosPayment, error: insertError } = await supabase
      .from('payos_payments')
      .insert(paymentInsertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error saving PayOS payment:', insertError)
      // Nếu lỗi do column không tồn tại, thử insert không có customer fields
      if (insertError.message?.includes('column') && !registrationId) {
        const { data: retryPayment, error: retryError } = await supabase
          .from('payos_payments')
          .insert({
            registration_id: null,
            payos_code: paymentLinkResponse.orderCode.toString(),
            amount: amountNum,
            description: paymentData.description,
            payment_link_id: paymentLinkResponse.paymentLinkId,
            payment_link: paymentLinkResponse.checkoutUrl,
            status: 'pending',
            webhook_data: {
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              seat_number: seatNumber,
              session_id: sessionId
            }
          })
          .select()
          .single()
        
        if (retryError) {
          console.error('Error saving PayOS payment (retry):', retryError)
          return NextResponse.json(
            { error: 'Failed to save payment information' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          paymentLink: paymentLinkResponse.checkoutUrl,
          paymentLinkId: paymentLinkResponse.paymentLinkId,
          payosCode: paymentLinkResponse.orderCode.toString(),
          payosPaymentId: retryPayment.id
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to save payment information' },
        { status: 500 }
      )
    }

    // Update registration with payos_payment_id nếu có registrationId
    if (registrationId) {
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
    }

    return NextResponse.json({
      paymentLink: paymentLinkResponse.checkoutUrl,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
      payosCode: paymentLinkResponse.orderCode.toString(),
      payosPaymentId: payosPayment.id
    })
  } catch (error: any) {
    console.error('Error creating PayOS payment:', {
      message: error?.message,
      stack: error?.stack,
      error: error
    })
    
    // Provide more helpful error messages
    let errorMessage = error?.message || 'Internal server error'
    let statusCode = 500
    
    if (error?.message?.includes('signature') || error?.message?.includes('checksum')) {
      errorMessage = 'PayOS signature error. Please check PAYOS_CHECKSUM_KEY environment variable.'
    } else if (error?.message?.includes('authentication') || error?.message?.includes('unauthorized')) {
      errorMessage = 'PayOS authentication error. Please check PAYOS_CLIENT_ID and PAYOS_API_KEY environment variables.'
    } else if (error?.message?.includes('25') || error?.message?.includes('Mô tả tối đa')) {
      errorMessage = 'Description quá dài. PayOS chỉ cho phép tối đa 25 ký tự.'
      statusCode = 400
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error connecting to PayOS. Please try again later.'
      statusCode = 503
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: statusCode }
    )
  }
}

