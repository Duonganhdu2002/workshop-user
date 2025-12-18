'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type SeatStatus = 'available' | 'selected' | 'booked'

interface Seat {
  seat_number: number
  status: SeatStatus
  selected_by?: string | null
  registration_id?: string | null
}

export default function SeatSelector({ 
  selectedSeat,
  confirmedSeat,
  onSeatSelect,
  sessionId 
}: { 
  selectedSeat: number | null
  confirmedSeat: number | null
  onSeatSelect: (seatNumber: number | null) => void
  sessionId: string
}) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('connected')

  useEffect(() => {
    loadSeats()
    const unsubscribe = setupRealtimeSubscription()
    
    // Lắng nghe custom event để reload seats khi có người chọn ghế
    const handleReloadSeats = () => {
      console.log('🔄 Custom event: Reloading seats...')
      loadSeats()
    }
    
    window.addEventListener('reload-seats', handleReloadSeats)
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      window.removeEventListener('reload-seats', handleReloadSeats)
    }
  }, [])

  // Thêm useEffect để reload seats định kỳ để đảm bảo sync (fallback nếu realtime không hoạt động)
  useEffect(() => {
    const interval = setInterval(() => {
      // Reload để đảm bảo sync, đặc biệt nếu realtime không hoạt động
      if (!loading) {
        console.log('🔄 Polling: Reloading seats to ensure sync...')
        loadSeats()
      }
    }, 3000) // Reload mỗi 3 giây để đảm bảo sync nhanh

    return () => clearInterval(interval)
  }, [loading])

  const loadSeats = async () => {
    try {
      // Đảm bảo lấy đầy đủ các field cần thiết, bao gồm registration_id để biết ghế đã được đăng ký chưa
      const { data, error } = await supabase
        .from('seats')
        .select('seat_number, status, selected_by, registration_id')
        .order('seat_number', { ascending: true })

      if (error) throw error

      const seatData = data || []
      if (seatData.length === 0) {
        const newSeats = Array.from({ length: 43 }, (_, i) => ({
          seat_number: i + 1,
          status: 'available' as SeatStatus,
          selected_by: null,
          registration_id: null
        }))
        setSeats(newSeats)
      } else {
        // Đảm bảo format đúng với selected_by và registration_id
        const formattedSeats: Seat[] = seatData.map((seat: any) => ({
          seat_number: seat.seat_number,
          status: seat.status,
          selected_by: seat.selected_by || null,
          registration_id: seat.registration_id || null
        }))
        setSeats(formattedSeats)
      }
    } catch (err: any) {
      setError('Không thể tải danh sách ghế: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('seats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats'
        },
        (payload) => {
          // Debug log để kiểm tra payload
          const newData = payload.new as any
          const oldData = payload.old as any
          console.log('🔴 Realtime update received:', {
            eventType: payload.eventType,
            seat_number: newData?.seat_number || oldData?.seat_number,
            status: newData?.status,
            selected_by: newData?.selected_by,
            fullPayload: payload
          })
          
          // FALLBACK: Nếu realtime không hoạt động đúng, reload toàn bộ seats
          // Điều này đảm bảo màu sắc luôn được cập nhật
          loadSeats()
          
          // Xử lý các sự kiện INSERT, UPDATE, DELETE
          setSeats((prevSeats) => {
            const newSeats = [...prevSeats]
            
            if (payload.eventType === 'DELETE') {
              // Nếu là DELETE, xóa ghế khỏi danh sách
              const seatNumber = (payload.old as any)?.seat_number
              if (seatNumber) {
                return newSeats.filter(s => s.seat_number !== seatNumber)
              }
              return newSeats
            }
            
            // Xử lý INSERT và UPDATE
            if (payload.new) {
              const updatedSeat = payload.new as any
              // Đảm bảo lấy đầy đủ các field từ payload - lấy trực tiếp từ payload.new
              const fullSeat: Seat = {
                seat_number: updatedSeat.seat_number,
                status: updatedSeat.status || 'available',
                selected_by: updatedSeat.selected_by !== undefined ? updatedSeat.selected_by : null,
                registration_id: updatedSeat.registration_id !== undefined ? updatedSeat.registration_id : null
              }
              
              console.log('🟢 Updating seat in state:', fullSeat)
              
              const seatIndex = newSeats.findIndex(
                (s) => s.seat_number === fullSeat.seat_number
              )
              
              if (seatIndex !== -1) {
                // Update ghế hiện có - tạo object mới hoàn toàn để force re-render
                // So sánh để đảm bảo có thay đổi thực sự
                const oldSeat = newSeats[seatIndex]
                if (
                  oldSeat.status !== fullSeat.status ||
                  oldSeat.selected_by !== fullSeat.selected_by ||
                  oldSeat.registration_id !== fullSeat.registration_id
                ) {
                  console.log('🟡 Seat changed:', {
                    old: oldSeat,
                    new: fullSeat
                  })
                  newSeats[seatIndex] = { ...fullSeat }
                }
              } else {
                // Thêm ghế mới (nếu là INSERT)
                newSeats.push(fullSeat)
              }
            }
            
            // Sort và return array mới để trigger re-render với màu sắc mới
            return [...newSeats.sort((a, b) => a.seat_number - b.seat_number)]
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active for seats - màu sắc sẽ được cập nhật realtime')
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error')
          setRealtimeStatus('disconnected')
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime subscription timed out, reconnecting...')
          setRealtimeStatus('disconnected')
        } else {
          console.log('📡 Realtime status:', status)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const selectSeat = (seatNumber: number) => {
    if (selectedSeat === seatNumber) {
      onSeatSelect(null)
      setError(null)
      return
    }

    const seat = seats.find(s => s.seat_number === seatNumber)
    if (!seat) {
      setError('Không tìm thấy ghế')
      return
    }

    // Ghế đã được đặt (booked) hoặc đã có registration_id (đã đăng ký) - không thể chọn
    if (seat.status === 'booked' || seat.registration_id) {
      setError('Ghế này đã được đặt. Vui lòng chọn ghế khác.')
      return
    }

    if (seat.status === 'selected' && seat.selected_by !== sessionId) {
      setError('Ghế này đang được chọn bởi người khác. Vui lòng chọn ghế khác.')
      return
    }

    onSeatSelect(seatNumber)
    setError(null)
  }

  const getSeatColor = (seat: Seat) => {
    // Ưu tiên 1: Ghế đã được đặt (booked) hoặc đã có registration_id (đã đăng ký) - màu đỏ thẩm, không thể chọn
    if (seat.status === 'booked' || seat.registration_id) {
      return 'bg-red-800 cursor-not-allowed text-white'
    }
    
    // Ưu tiên 2: Ghế đang được người khác chọn (selected bởi session khác) - màu vàng, nhấp nháy
    // QUAN TRỌNG: Kiểm tra này phải được ưu tiên cao để người khác thấy màu vàng
    if (seat.status === 'selected' && seat.selected_by && seat.selected_by !== sessionId) {
      return 'bg-yellow-200 cursor-not-allowed animate-pulse border-2 border-yellow-400 text-gray-800'
    }
    
    // Ưu tiên 3: Ghế đã được bạn chọn và confirm trong DB (selected bởi session của bạn) - màu xanh lá
    // Điều này để bạn thấy ghế của mình là màu xanh lá
    if (seat.status === 'selected' && seat.selected_by === sessionId) {
      // Nếu đây là confirmedSeat, thêm ring
      if (confirmedSeat === seat.seat_number) {
        return 'bg-green-600 hover:bg-green-700 cursor-pointer ring-2 ring-green-400 ring-offset-1 text-white'
      }
      return 'bg-green-600 hover:bg-green-700 cursor-pointer text-white'
    }
    
    // Ưu tiên 4: Ghế đang được bạn highlight (selectedSeat nhưng chưa confirm) - màu xám đậm
    if (selectedSeat === seat.seat_number) {
      return 'bg-gray-600 hover:bg-gray-700 cursor-pointer ring-2 ring-gray-400 text-white'
    }
    
    // Mặc định: Ghế trống (available) - màu trắng
    return 'bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer text-black'
  }

  const renderSeats = () => {
    const rows = []
    let seatIndex = 0

    // Sắp xếp lại: 6 hàng đầu mỗi hàng 6 ghế, hàng cuối 7 ghế
    // Đưa hàng ít ghế lên trên, không để ghế lẻ loi
    const rowSizes = [6, 6, 6, 6, 6, 6, 7] // 6 hàng 6 ghế, 1 hàng 7 ghế

    for (let row = 0; row < rowSizes.length; row++) {
      const rowSeats = []
      const seatsInRow = rowSizes[row]
      
      for (let col = 0; col < seatsInRow; col++) {
        if (seatIndex < seats.length) {
          const seat = seats[seatIndex]
          rowSeats.push(
            <button
              key={seat.seat_number}
              onClick={() => seat.status !== 'booked' && selectSeat(seat.seat_number)}
              disabled={seat.status === 'booked' || (seat.status === 'selected' && seat.selected_by !== sessionId)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-md font-semibold text-xs md:text-sm transition-all duration-200 ${getSeatColor(seat)}`}
              title={`Ghế ${seat.seat_number} - ${
                seat.status === 'available' 
                  ? 'Trống' 
                  : seat.status === 'selected' 
                    ? seat.selected_by === sessionId 
                      ? 'Bạn đang giữ chỗ' 
                      : 'Người khác đang giữ chỗ' 
                    : 'Đã đặt'
              }`}
            >
              {seat.seat_number}
            </button>
          )
          seatIndex++
        }
      }
      rows.push(
        <div key={row} className="flex gap-1.5 md:gap-2 justify-center">
          {rowSeats}
        </div>
      )
    }

    return rows
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="mt-4 text-gray-600">Đang tải danh sách ghế...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-black rounded-md p-3 md:p-4 mb-6 text-center w-full">
        <p className="text-white text-xs md:text-sm font-medium">SÂN KHẤU</p>
      </div>

      <div className="w-full overflow-x-auto px-1 mb-6">
        <div className="flex justify-center min-w-max mx-auto">
          <div className="space-y-1.5 md:space-y-2">
            {renderSeats()}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center text-xs mt-6 mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded"></div>
          <span className="text-gray-600">Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-600 rounded ring-2 ring-gray-400"></div>
          <span className="text-gray-600">Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-600 rounded ring-2 ring-green-400 ring-offset-1"></div>
          <span className="text-gray-600">Đã xác nhận</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-200 rounded border-2 border-yellow-400 animate-pulse"></div>
          <span className="text-gray-600">Người khác đang giữ chỗ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-800 rounded"></div>
          <span className="text-gray-600">Đã đặt</span>
        </div>
      </div>

      {selectedSeat && !confirmedSeat && (
        <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-center mt-4">
          <p className="text-sm text-black">
            <strong>Bạn đang chọn ghế số {selectedSeat}</strong>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Bấm "Xác nhận ghế" để giữ ghế này
          </p>
        </div>
      )}

      {confirmedSeat && (
        <div className="bg-green-600 text-white rounded-md p-3 text-center mt-4">
          <p className="text-sm">
            <strong>✓ Đã xác nhận ghế số {confirmedSeat}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

