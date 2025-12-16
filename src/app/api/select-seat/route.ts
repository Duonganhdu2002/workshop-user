import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Sử dụng service role key nếu có, nếu không dùng anon key
const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seat_number, session_id, old_seat_number } = body

    if (!seat_number || !session_id) {
      return NextResponse.json(
        { error: 'Thiếu thông tin seat_number hoặc session_id' },
        { status: 400 }
      )
    }

    // Release ghế cũ nếu có
    if (old_seat_number && old_seat_number !== seat_number) {
      await supabase
        .from('seats')
        .update({
          status: 'available',
          selected_by: null,
          selected_at: null,
          expires_at: null
        })
        .eq('seat_number', old_seat_number)
        .eq('selected_by', session_id)
        .eq('status', 'selected')
    }

    // Kiểm tra ghế hiện tại có available không
    const { data: currentSeat, error: checkError } = await supabase
      .from('seats')
      .select('status, selected_by')
      .eq('seat_number', seat_number)
      .single()

    if (checkError || !currentSeat) {
      return NextResponse.json(
        { error: 'Không tìm thấy ghế' },
        { status: 404 }
      )
    }

    // Kiểm tra trạng thái ghế
    if (currentSeat.status === 'booked') {
      return NextResponse.json(
        { error: 'Ghế này đã được đặt. Vui lòng chọn ghế khác.', code: 'SEAT_BOOKED' },
        { status: 409 }
      )
    }

    if (currentSeat.status === 'selected' && currentSeat.selected_by !== session_id) {
      return NextResponse.json(
        { error: 'Ghế này đang được chọn bởi người khác. Vui lòng chọn ghế khác.', code: 'SEAT_SELECTED' },
        { status: 409 }
      )
    }

    // Tính toán thời gian hết hạn (5 phút)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Update ghế với điều kiện status phải là 'available'
    // Điều này đảm bảo atomic operation - chỉ 1 người có thể chọn được
    // Nếu status đã là 'selected' bởi cùng session, cho phép refresh thời gian
    let updateQuery = supabase
      .from('seats')
      .update({
        status: 'selected',
        selected_by: session_id,
        selected_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('seat_number', seat_number)

    // Nếu ghế đang available, chỉ update khi status = 'available'
    // Nếu ghế đã được chọn bởi cùng session, cho phép refresh
    if (currentSeat.status === 'available') {
      updateQuery = updateQuery.eq('status', 'available')
    } else if (currentSeat.status === 'selected' && currentSeat.selected_by === session_id) {
      updateQuery = updateQuery.eq('status', 'selected').eq('selected_by', session_id)
    } else {
      return NextResponse.json(
        { error: 'Ghế này đang được chọn bởi người khác. Vui lòng chọn ghế khác.', code: 'SEAT_SELECTED' },
        { status: 409 }
      )
    }

    // Đảm bảo select đầy đủ các field cần thiết
    const { data, error } = await updateQuery.select('seat_number, status, selected_by, selected_at, expires_at')

    // Kiểm tra xem có update được không
    if (error) {
      console.error('Error selecting seat:', error)
      return NextResponse.json(
        { error: 'Lỗi khi chọn ghế: ' + error.message },
        { status: 500 }
      )
    }

    // Nếu không có data trả về, có nghĩa là không update được (ghế đã bị chọn bởi người khác)
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Ghế này đã được chọn bởi người khác. Vui lòng chọn ghế khác.', code: 'SEAT_ALREADY_SELECTED' },
        { status: 409 }
      )
    }

    const updatedSeat = data[0]
    console.log('Seat selected successfully:', {
      seat_number: updatedSeat.seat_number,
      status: updatedSeat.status,
      selected_by: updatedSeat.selected_by
    })

    return NextResponse.json({ 
      success: true, 
      seat: {
        seat_number: updatedSeat.seat_number,
        status: updatedSeat.status,
        selected_by: updatedSeat.selected_by
      },
      message: `Đã xác nhận ghế số ${seat_number}` 
    })
  } catch (error: any) {
    console.error('Error in select-seat API:', error)
    return NextResponse.json(
      { error: 'Lỗi server: ' + error.message },
      { status: 500 }
    )
  }
}

