import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seat_number, session_id } = body

    if (!seat_number || !session_id) {
      return NextResponse.json(
        { error: 'Thiếu thông tin seat_number hoặc session_id' },
        { status: 400 }
      )
    }

    // Release ghế nếu nó đang được chọn bởi session này
    // Cần giải phóng cả khi có registration_id (đã đăng ký nhưng chưa thanh toán)
    const { error } = await supabase
      .from('seats')
      .update({
        status: 'available',
        registration_id: null, // Xóa registration_id nếu có
        selected_by: null,
        selected_at: null,
        expires_at: null
      })
      .eq('seat_number', seat_number)
      .eq('selected_by', session_id)
      .in('status', ['selected', 'booked']) // Cho phép giải phóng cả selected và booked

    if (error) {
      console.error('Error releasing seat:', error)
      // Thử lại không có điều kiện status nếu lần đầu fail
      const { error: retryError } = await supabase
        .from('seats')
        .update({
          status: 'available',
          registration_id: null,
          selected_by: null,
          selected_at: null,
          expires_at: null
        })
        .eq('seat_number', seat_number)
        .eq('selected_by', session_id)
      
      if (retryError) {
        console.error('Error releasing seat (retry):', retryError)
        return NextResponse.json(
          { error: 'Không thể giải phóng ghế' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in release-seat API:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}


