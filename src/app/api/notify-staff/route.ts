import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '@/services/email.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registration_id, name, email, phone, seat_number } = body

    console.log('Notify staff API called with:', { registration_id, name, email, phone, seat_number })

    if (!registration_id || !name || !email || !phone) {
      console.error('Missing registration data:', { registration_id, name, email, phone })
      return NextResponse.json(
        { error: 'Thiếu thông tin đăng ký' },
        { status: 400 }
      )
    }

    // Lấy danh sách email của tất cả staff có email (không filter active để đảm bảo gửi cho tất cả)
    console.log('Fetching staff list from database...')
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('email, name')
      .not('email', 'is', null)

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      console.error('Staff error details:', JSON.stringify(staffError, null, 2))
      // Nếu không có bảng staff hoặc lỗi, vẫn trả về success để không block đăng ký
      return NextResponse.json(
        { 
          success: true, 
          message: 'Không thể lấy danh sách staff, nhưng đăng ký đã được lưu',
          warning: 'Staff notification skipped',
          error: staffError.message
        },
        { status: 200 }
      )
    }

    console.log('Staff list fetched:', staffList?.length || 0, 'staff members')

    if (!staffList || staffList.length === 0) {
      console.warn('No staff with email found in database')
      return NextResponse.json(
        { 
          success: true, 
          message: 'Đăng ký thành công, nhưng không có staff nào có email để gửi thông báo',
          warning: 'No staff to notify'
        },
        { status: 200 }
      )
    }

    // Lấy danh sách email từ staff
    const staffEmails = staffList
      .map(staff => staff.email)
      .filter((email): email is string => Boolean(email))

    console.log('Staff emails to notify:', staffEmails)

    if (staffEmails.length === 0) {
      console.warn('No valid email addresses found in staff list')
      return NextResponse.json(
        { 
          success: true, 
          message: 'Đăng ký thành công, nhưng không có email staff hợp lệ',
          warning: 'No valid staff emails'
        },
        { status: 200 }
      )
    }

    // Gửi email thông báo cho tất cả staff
    try {
      console.log('Attempting to send emails to', staffEmails.length, 'staff members')
      console.log('Email config check:', {
        hasSMTP_HOST: !!process.env.SMTP_HOST,
        hasSMTP_USER: !!process.env.SMTP_USER,
        hasSMTP_PASS: !!process.env.SMTP_PASS,
        hasEMAIL_FROM: !!process.env.EMAIL_FROM,
      })

      // Lấy thêm thông tin created_at từ registration
      const { data: registrationInfo } = await supabase
        .from('registrations')
        .select('created_at')
        .eq('id', registration_id)
        .single()

      await emailService.sendRegistrationNotificationToStaff(
        staffEmails,
        {
          name,
          email,
          phone,
          seat_number: seat_number || null,
          registration_id,
          created_at: registrationInfo?.created_at || new Date().toISOString(),
        }
      )

      console.log('Emails sent successfully to all staff')
      return NextResponse.json({
        success: true,
        message: 'Đã gửi thông báo cho staff thành công',
        staffCount: staffEmails.length,
        staffEmails: staffEmails,
      })
    } catch (emailError: any) {
      console.error('Error sending email to staff:', emailError)
      console.error('Email error stack:', emailError.stack)
      // Vẫn trả về success để không block đăng ký, nhưng log lỗi
      return NextResponse.json(
        {
          success: true,
          message: 'Đăng ký thành công, nhưng không thể gửi email thông báo',
          warning: 'Email notification failed',
          error: emailError.message,
          stack: process.env.NODE_ENV === 'development' ? emailError.stack : undefined,
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error('Error in notify-staff API:', error)
    return NextResponse.json(
      { error: 'Lỗi server: ' + error.message },
      { status: 500 }
    )
  }
}

