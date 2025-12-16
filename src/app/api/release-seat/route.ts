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

    // Chỉ release ghế nếu nó đang được chọn bởi session này
    const { error } = await supabase
      .from('seats')
      .update({
        status: 'available',
        selected_by: null,
        selected_at: null,
        expires_at: null
      })
      .eq('seat_number', seat_number)
      .eq('selected_by', session_id)
      .eq('status', 'selected')

    if (error) {
      console.error('Error releasing seat:', error)
      return NextResponse.json(
        { error: 'Không thể giải phóng ghế' },
        { status: 500 }
      )
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


