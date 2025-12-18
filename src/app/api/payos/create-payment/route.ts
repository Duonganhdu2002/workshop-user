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
    // Support both old format (registrationId) and new format (registration data)
    const { registrationId, name, email, phone, seat_number, amount, description } = body

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

    let registration: any = null
    let payosPaymentId: string | null = null

    // If registrationId is provided (old flow), get registration
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

      // KHÔNG reuse payment link cũ - LUÔN tạo payment mới
      // Mark cancelled các payment pending cũ với cùng registration_id để cleanup
      const { data: oldRegPayments, error: oldRegPaymentsError } = await supabase
        .from('payos_payments')
        .select('id, status, temp_seat_number, registration_id')
        .eq('registration_id', registrationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!oldRegPaymentsError && oldRegPayments && oldRegPayments.length > 0) {
        console.log(`Found ${oldRegPayments.length} old pending payment(s) for registration ${registrationId}, marking as cancelled`)
        
        // Mark all old pending payments as cancelled
        const oldPaymentIds = oldRegPayments.map(p => p.id)
        await supabase
          .from('payos_payments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', oldPaymentIds)
        
        // Release seats associated with old payments
        for (const oldPayment of oldRegPayments) {
          const seatNum = oldPayment.temp_seat_number || registration?.seat_number
          if (seatNum) {
            await supabase
              .from('seats')
              .update({
                status: 'available',
                registration_id: null,
                selected_by: null,
                selected_at: null,
                expires_at: null
              })
              .eq('seat_number', seatNum)
          }
        }
      }
    } else {
      // New flow: registration data provided directly
      if (!name || !email || !phone || !seat_number) {
        return NextResponse.json(
          { error: 'Missing required fields: name, email, phone, and seat_number' },
          { status: 400 }
        )
      }

      // Check for duplicate registrations (already paid)
      const { data: existingRegistrations, error: checkError } = await supabase
        .from('registrations')
        .select('id, email, phone')
        .or(`email.eq.${email},phone.eq.${phone}`)
        .limit(1)

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing registrations:', checkError)
      }

      if (existingRegistrations && existingRegistrations.length > 0) {
        return NextResponse.json(
          { error: 'Email hoặc số điện thoại này đã được sử dụng để đăng ký' },
          { status: 400 }
        )
      }

      // KHÔNG reuse payment link cũ - LUÔN tạo payment mới để tránh lỗi "đơn hàng không tồn tại"
      // Mark cancelled các payment pending cũ với cùng email/phone để cleanup
      const { data: oldPendingPayments, error: oldPaymentsError } = await supabase
        .from('payos_payments')
        .select('id, status, payos_code, temp_seat_number')
        .or(`temp_email.eq.${email},temp_phone.eq.${phone}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!oldPaymentsError && oldPendingPayments && oldPendingPayments.length > 0) {
        console.log(`Found ${oldPendingPayments.length} old pending payment(s) for this email/phone, marking as cancelled`)
        
        // Mark all old pending payments as cancelled
        const oldPaymentIds = oldPendingPayments.map(p => p.id)
        await supabase
          .from('payos_payments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', oldPaymentIds)
        
        // Release seats associated with old payments
        for (const oldPayment of oldPendingPayments) {
          if ((oldPayment as any).temp_seat_number) {
            await supabase
              .from('seats')
              .update({
                status: 'available',
                registration_id: null,
                selected_by: null,
                selected_at: null,
                expires_at: null
              })
              .eq('seat_number', (oldPayment as any).temp_seat_number)
          }
        }
      }
    }

    // Create payment link with PayOS
    // Use a unique order code (timestamp + large random number to ensure uniqueness)
    // This ensures each payment has a completely unique orderCode, even if user cancels and retries
    const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000000)
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    // PayOS requires description to be max 25 characters
    // Create a short description
    const seatNum = registration?.seat_number || seat_number
    const defaultDescription = `Workshop - Ghế ${seatNum}`
    let paymentDescription = description || defaultDescription
    
    // Truncate to 25 characters if too long
    if (paymentDescription.length > 25) {
      paymentDescription = paymentDescription.substring(0, 22) + '...'
    }
    
    // Use payosPaymentId for URLs if we have one, otherwise use a placeholder that will be updated
    const paymentData = {
      orderCode: orderCode,
      amount: amountNum,
      description: paymentDescription,
      cancelUrl: `${baseUrl}/?payment=cancelled&payosId=PLACEHOLDER`,
      returnUrl: `${baseUrl}/?payment=success&payosId=PLACEHOLDER`
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

    // Save payment information to database
    const paymentInsertData: any = {
      registration_id: registrationId || null, // null if using new flow
      payos_code: paymentLinkResponse.orderCode.toString(),
      amount: amountNum,
      description: paymentData.description,
      payment_link_id: paymentLinkResponse.paymentLinkId,
      payment_link: paymentLinkResponse.checkoutUrl,
      status: 'pending'
    }

    // If using new flow (no registrationId), store temp data
    if (!registrationId && name && email && phone && seat_number) {
      paymentInsertData.temp_name = name
      paymentInsertData.temp_email = email
      paymentInsertData.temp_phone = phone
      paymentInsertData.temp_seat_number = seat_number
    }

    const { data: payosPayment, error: insertError } = await supabase
      .from('payos_payments')
      .insert(paymentInsertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error saving PayOS payment:', insertError)
      return NextResponse.json(
        { error: 'Failed to save payment information' },
        { status: 500 }
      )
    }

    // Update payment URLs with actual payosPaymentId
    const updatedCancelUrl = `${baseUrl}/?payment=cancelled&payosId=${payosPayment.id}`
    const updatedReturnUrl = `${baseUrl}/?payment=success&payosId=${payosPayment.id}`
    
    // Note: We can't update PayOS URLs after creation, but we'll handle it in the frontend/webhook

    // Update registration with payos_payment_id and payment_method (only if registrationId exists)
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

