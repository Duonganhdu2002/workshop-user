import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('id')
    const action = searchParams.get('action') || 'verify'

    if (!registrationId) {
      return NextResponse.redirect(new URL('/?error=missing_id', request.url))
    }

    // Lấy thông tin đăng ký
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.redirect(new URL('/?error=not_found', request.url))
    }

    // Nếu action là verify, cập nhật trạng thái thanh toán
    if (action === 'verify') {
      if (registration.payment_status === 'verified' || registration.payment_status === 'sent') {
        // Đã xác nhận rồi, redirect đến trang quản lý
        return NextResponse.redirect(
          new URL(`https://workshop-staff.vercel.app/?verified=${registrationId}`, request.url)
        )
      }

      // Cập nhật trạng thái thanh toán thành verified
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registrationId)

      if (updateError) {
        console.error('Error updating payment status:', updateError)
        return NextResponse.redirect(
          new URL(`https://workshop-staff.vercel.app/?error=update_failed&id=${registrationId}`, request.url)
        )
      }

      // Redirect đến trang quản lý với thông báo thành công
      return NextResponse.redirect(
        new URL(`https://workshop-staff.vercel.app/?verified=${registrationId}&name=${encodeURIComponent(registration.name)}`, request.url)
      )
    }

    // Nếu không phải verify, chỉ redirect đến trang quản lý
    return NextResponse.redirect(
      new URL(`https://workshop-staff.vercel.app/?id=${registrationId}`, request.url)
    )
  } catch (error: any) {
    console.error('Error in verify-payment API:', error)
    return NextResponse.redirect(new URL('/?error=server_error', request.url))
  }
}





