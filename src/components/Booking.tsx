'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import Image from 'next/image'
import SeatSelector from './SeatSelector'

export default function Booking() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    })
    const [formErrors, setFormErrors] = useState({
        name: '',
        email: '',
        phone: '',
    })
    const [submitted, setSubmitted] = useState(false)
    const [registrationId, setRegistrationId] = useState<string | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verified' | 'sent'>('pending')
    const [payosPaymentLink, setPayosPaymentLink] = useState<string | null>(null)
    const [creatingPayosLink, setCreatingPayosLink] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
    const [confirmedSeat, setConfirmedSeat] = useState<number | null>(null)
    const [confirmingSeat, setConfirmingSeat] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showFormModal, setShowFormModal] = useState(false)
    const [showQRModal, setShowQRModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [sessionId] = useState(() => {
        if (typeof window !== 'undefined') {
            let sid = sessionStorage.getItem('sessionId')
            if (!sid) {
                sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                sessionStorage.setItem('sessionId', sid)
            }
            return sid
        }
        return Math.random().toString(36).substring(2, 15)
    })

    const isConfigured = isSupabaseConfigured()
    const eventDate = process.env.NEXT_PUBLIC_EVENT_DATE || '2025-12-28'
    const eventStartTime = process.env.NEXT_PUBLIC_EVENT_START_TIME || '14:00'
    const eventEndTime = process.env.NEXT_PUBLIC_EVENT_END_TIME || '17:00'
    const eventLocation = process.env.NEXT_PUBLIC_EVENT_LOCATION || 'Vibas Coffee - Tân Bình'
    const eventLocationLink = process.env.NEXT_PUBLIC_EVENT_LOCATION_LINK || 'https://maps.app.goo.gl/ePbt2TnvQocTdVs5A'
    
    // Format ngày giờ sự kiện
    const formatEventDateTime = () => {
        try {
            const date = new Date(`${eventDate}T${eventStartTime}`)
            const options: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }
            const formattedDate = date.toLocaleDateString('vi-VN', options)
            return `${formattedDate}, ${eventStartTime} - ${eventEndTime}`
        } catch {
            return `Ngày ${eventDate}, ${eventStartTime} - ${eventEndTime}`
        }
    }

    useEffect(() => {
        // Kiểm tra URL params khi component mount
        if (typeof window === 'undefined') return
        
        const urlParams = new URLSearchParams(window.location.search)
        const paymentParam = urlParams.get('payment')
        const idParam = urlParams.get('id')
        
        // Nếu có payment=cancelled trong URL, xử lý hủy thanh toán
        if (paymentParam === 'cancelled' && idParam) {
            handlePaymentCancelled(idParam)
            // Xóa query params khỏi URL
            window.history.replaceState({}, '', window.location.pathname)
            return
        }
        
        // Nếu có payment=success trong URL, kiểm tra lại trạng thái
        if (paymentParam === 'success' && idParam) {
            checkPaymentStatus(idParam)
            // Xóa query params khỏi URL
            window.history.replaceState({}, '', window.location.pathname)
            return
        }
        
        // Load registrationId từ localStorage nếu không có URL params
        const savedId = localStorage.getItem('registrationId')
        if (savedId) {
            setRegistrationId(savedId)
            setSubmitted(true)
            checkPaymentStatus(savedId)
        }
    }, [])

    // Theo dõi khi registrationId bị xóa khỏi localStorage
    useEffect(() => {
        if (!registrationId) return

        const handleAutoCancelRegistration = async () => {
            const currentId = registrationId
            if (!currentId) return

            try {
                const { data: registrationData, error: regError } = await supabase
                    .from('registrations')
                    .select('seat_number')
                    .eq('id', currentId)
                    .single()

                if (!regError && registrationData?.seat_number) {
                    // Giải phóng ghế: reset về available và xóa tất cả thông tin liên quan
                    const { error: seatError } = await supabase
                        .from('seats')
                        .update({
                            status: 'available',
                            registration_id: null,
                            selected_by: null,
                            selected_at: null,
                            expires_at: null
                        })
                        .eq('seat_number', registrationData.seat_number)
                        .eq('registration_id', currentId) // Đảm bảo chỉ update ghế của registration này

                    if (seatError) {
                        console.error('Error releasing seat in auto-cancel:', seatError)
                        // Thử lại không có điều kiện registration_id nếu lần đầu fail
                        await supabase
                            .from('seats')
                            .update({
                                status: 'available',
                                registration_id: null,
                                selected_by: null,
                                selected_at: null,
                                expires_at: null
                            })
                            .eq('seat_number', registrationData.seat_number)
                    }

                    await supabase
                        .from('registrations')
                        .delete()
                        .eq('id', currentId)
                    
                    // Trigger reload seats để cập nhật UI
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('reload-seats'))
                    }, 100)
                }

                setRegistrationId(null)
                setSubmitted(false)
                setPaymentStatus('pending')
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                })
                setSelectedSeat(null)
                setConfirmedSeat(null)
                setShowQRModal(false)
                setShowFormModal(false)
            } catch (error: any) {
                console.error('Error auto-canceling registration:', error)
            }
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'registrationId') {
                if (!e.newValue && registrationId) {
                    handleAutoCancelRegistration()
                } else if (e.newValue && e.newValue !== registrationId) {
                    setRegistrationId(e.newValue)
                    setSubmitted(true)
                    checkPaymentStatus(e.newValue)
                }
            }
        }

        const checkInterval = setInterval(() => {
            const currentId = localStorage.getItem('registrationId')
            if (!currentId && registrationId) {
                handleAutoCancelRegistration()
            }
        }, 1000)

        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            clearInterval(checkInterval)
        }
    }, [registrationId])

    useEffect(() => {
        const releaseConfirmedSeat = async () => {
            if (confirmedSeat && !submitted) {
                try {
                    await fetch('/api/release-seat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            seat_number: confirmedSeat,
                            session_id: sessionId
                        }),
                        keepalive: true
                    }).catch(() => { })
                } catch (err) {
                    console.error('Error releasing seat:', err)
                }
            }
        }

        const handleBeforeUnload = () => {
            if (confirmedSeat && !submitted) {
                releaseConfirmedSeat()
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            if (confirmedSeat && !submitted) {
                releaseConfirmedSeat()
            }
        }
    }, [confirmedSeat, submitted, sessionId])

    const handlePaymentCancelled = async (registrationId: string) => {
        try {
            // Kiểm tra payment status từ PayOS payments table
            const { data: registrationData, error: regError } = await supabase
                .from('registrations')
                .select('payos_payment_id, seat_number')
                .eq('id', registrationId)
                .single()

            if (!regError && registrationData) {
                const regData = registrationData as any
                if (regData.payos_payment_id) {
                    const { data: payosData } = await (supabase as any)
                        .from('payos_payments')
                        .select('status')
                        .eq('id', regData.payos_payment_id)
                        .single()

                    // Nếu payment đã cancelled hoặc expired, reset trạng thái
                    if (payosData && (payosData.status === 'cancelled' || payosData.status === 'expired')) {
                        setPaymentStatus('pending')
                        setErrorMessage('Bạn đã hủy thanh toán. Vui lòng thanh toán để hoàn tất đăng ký.')
                        setTimeout(() => setErrorMessage(null), 8000)
                    }
                }
            }
        } catch (error) {
            console.error('Error handling payment cancellation:', error)
        }
    }

    const checkPaymentStatus = async (id: string) => {
        const { data, error } = await supabase
            .from('registrations')
            .select('payment_status, payment_method, payos_payment_id')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching payment status:', error)
            return
        }

        if (data) {
            const registrationData = data as any
            
            // Kiểm tra trạng thái từ PayOS payments table để đảm bảo chính xác
            if (registrationData.payos_payment_id) {
                try {
                    const { data: payosData, error: payosError } = await (supabase as any)
                        .from('payos_payments')
                        .select('payment_link, status')
                        .eq('id', registrationData.payos_payment_id)
                        .single()
                    
                    if (!payosError && payosData) {
                        // Nếu payment đã cancelled hoặc expired, không hiển thị thành công
                        if (payosData.status === 'cancelled' || payosData.status === 'expired') {
                            setPaymentStatus('pending')
                            setPayosPaymentLink(payosData.payment_link || null)
                            return
                        }
                        
                        // Nếu payment đã paid, kiểm tra registration payment_status
                        if (payosData.status === 'paid' && registrationData.payment_status) {
                            const newPaymentStatus = registrationData.payment_status as 'pending' | 'verified' | 'sent'
                            setPaymentStatus(newPaymentStatus)
                            
                            // Xóa localStorage khi thanh toán thành công
                            if (newPaymentStatus === 'verified' || newPaymentStatus === 'sent') {
                                localStorage.removeItem('registrationId')
                                console.log('Payment successful, cleared localStorage')
                            }
                        } else {
                            // Payment vẫn pending
                            setPaymentStatus('pending')
                        }
                        
                        if (payosData.payment_link) {
                            setPayosPaymentLink(payosData.payment_link)
                        }
                    }
                } catch (err) {
                    console.error('Error fetching PayOS payment:', err)
                    // Fallback về payment_status từ registration
                    if (registrationData.payment_status) {
                        const newPaymentStatus = registrationData.payment_status as 'pending' | 'verified' | 'sent'
                        setPaymentStatus(newPaymentStatus)
                    }
                }
            } else {
                // Không có PayOS payment, dùng payment_status từ registration
                if (registrationData.payment_status) {
                    const newPaymentStatus = registrationData.payment_status as 'pending' | 'verified' | 'sent'
                    setPaymentStatus(newPaymentStatus)
                    
                    // Xóa localStorage khi thanh toán thành công
                    if (newPaymentStatus === 'verified' || newPaymentStatus === 'sent') {
                        localStorage.removeItem('registrationId')
                        console.log('Payment successful, cleared localStorage')
                    }
                }
            }
        }
    }

    const handleConfirmSeat = async () => {
        if (!selectedSeat) {
            setErrorMessage('Vui lòng chọn ghế trước')
            setTimeout(() => setErrorMessage(null), 5000)
            return
        }

        setConfirmingSeat(true)
        setErrorMessage(null)
        try {
            // Sử dụng API route để đảm bảo atomic operation
            const response = await fetch('/api/select-seat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seat_number: selectedSeat,
                    session_id: sessionId,
                    old_seat_number: confirmedSeat && confirmedSeat !== selectedSeat ? confirmedSeat : null
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                // Xử lý các lỗi cụ thể
                if (result.code === 'SEAT_BOOKED' || result.code === 'SEAT_SELECTED' || result.code === 'SEAT_ALREADY_SELECTED') {
                    setErrorMessage(result.error)
                    setSelectedSeat(null)
                } else {
                    throw new Error(result.error || 'Lỗi khi chọn ghế')
                }
            } else {
                // Thành công
                setConfirmedSeat(selectedSeat)
                setSuccessMessage(result.message || `Đã xác nhận ghế số ${selectedSeat}. Vui lòng điền thông tin.`)
                setShowFormModal(true)
                
                // Force reload seats sau khi chọn thành công để đảm bảo sync
                // Điều này giúp các tab khác cập nhật ngay lập tức
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('reload-seats'))
                }, 500)
            }
        } catch (error: any) {
            setErrorMessage('Lỗi khi xác nhận ghế: ' + error.message)
        } finally {
            setConfirmingSeat(false)
            setTimeout(() => setErrorMessage(null), 5000)
            setTimeout(() => setSuccessMessage(null), 5000)
        }
    }

    const handleCancelRegistration = () => {
        setShowCancelModal(true)
    }

    const handleCloseQRModal = () => {
        setShowQRModal(false)
    }

    const handleCancelFromQR = () => {
        setShowCancelModal(true)
    }

    const confirmCancelRegistration = async () => {
        if (!registrationId) return

        setLoading(true)
        setShowCancelModal(false)
        try {
            const { data: registrationData, error: regError } = await supabase
                .from('registrations')
                .select('seat_number')
                .eq('id', registrationId)
                .single()

            if (regError) {
                throw new Error('Không tìm thấy đăng ký')
            }

            if (registrationData?.seat_number) {
                // Giải phóng ghế: reset về available và xóa tất cả thông tin liên quan
                // Đảm bảo giải phóng cả khi status là 'selected' hoặc 'booked'
                const { error: seatError } = await supabase
                    .from('seats')
                    .update({
                        status: 'available',
                        registration_id: null,
                        selected_by: null,
                        selected_at: null,
                        expires_at: null
                    })
                    .eq('seat_number', registrationData.seat_number)
                    .eq('registration_id', registrationId) // Đảm bảo chỉ update ghế của registration này

                if (seatError) {
                    console.error('Error releasing seat:', seatError)
                    // Thử lại không có điều kiện registration_id nếu lần đầu fail
                    const { error: retryError } = await supabase
                        .from('seats')
                        .update({
                            status: 'available',
                            registration_id: null,
                            selected_by: null,
                            selected_at: null,
                            expires_at: null
                        })
                        .eq('seat_number', registrationData.seat_number)
                    
                    if (retryError) {
                        console.error('Error releasing seat (retry):', retryError)
                    }
                } else {
                    // Trigger reload seats để cập nhật UI ngay lập tức
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('reload-seats'))
                    }, 100)
                }
            }

            const { error: deleteError } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registrationId)

            if (deleteError) {
                throw deleteError
            }

            setRegistrationId(null)
            setSubmitted(false)
            setPaymentStatus('pending')
            setFormData({
                name: '',
                email: '',
                phone: '',
            })
            setSelectedSeat(null)
            setConfirmedSeat(null)
            
            localStorage.removeItem('registrationId')

            setSuccessMessage('Đã hủy vé thành công. Ghế đã được giải phóng.')
        } catch (error: any) {
            setErrorMessage('Có lỗi xảy ra khi hủy vé: ' + error.message)
        } finally {
            setLoading(false)
            setShowFormModal(false)
            setShowQRModal(false)
            setTimeout(() => setErrorMessage(null), 5000)
            setTimeout(() => setSuccessMessage(null), 5000)
        }
    }

    const validateForm = () => {
        const errors = {
            name: '',
            email: '',
            phone: '',
        }
        let isValid = true

        if (!formData.name.trim()) {
            errors.name = 'Vui lòng điền vào trường này.'
            isValid = false
        }

        if (!formData.email.trim()) {
            errors.email = 'Vui lòng điền vào trường này.'
            isValid = false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ.'
            isValid = false
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Vui lòng điền vào trường này.'
            isValid = false
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            errors.phone = 'Số điện thoại không hợp lệ.'
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            setErrorMessage('Vui lòng điền đầy đủ thông tin hợp lệ.')
            setTimeout(() => setErrorMessage(null), 5000)
            return
        }

        if (!confirmedSeat) {
            setErrorMessage('Vui lòng xác nhận ghế trước khi đăng ký')
            setTimeout(() => setErrorMessage(null), 5000)
            return
        }

        setLoading(true)
        setErrorMessage(null)

        try {
            const { data: seatData, error: seatCheckError } = await supabase
                .from('seats')
                .select('status, selected_by')
                .eq('seat_number', confirmedSeat)
                .single()

            if (seatCheckError || !seatData) {
                throw new Error('Không tìm thấy ghế')
            }

            if (seatData.status === 'booked') {
                setErrorMessage('Ghế này đã được đặt. Vui lòng chọn ghế khác.')
                setConfirmedSeat(null)
                setSelectedSeat(null)
                setLoading(false)
                setTimeout(() => setErrorMessage(null), 5000)
                return
            }

            if (seatData.status !== 'selected' || seatData.selected_by !== sessionId) {
                setErrorMessage('Ghế này không còn thuộc về bạn. Vui lòng chọn ghế khác.')
                setConfirmedSeat(null)
                setSelectedSeat(null)
                setLoading(false)
                setTimeout(() => setErrorMessage(null), 5000)
                return
            }

            // Kiểm tra xem email hoặc số điện thoại đã được sử dụng để đăng ký chưa (chỉ kiểm tra đã thanh toán)
            const { data: existingRegistrations, error: checkError } = await supabase
                .from('registrations')
                .select('id, email, phone, seat_number, payment_status')
                .or(`email.eq.${formData.email},phone.eq.${formData.phone}`)
                .in('payment_status', ['verified', 'sent']) // Chỉ kiểm tra đã thanh toán
                .limit(1)

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError
            }

            if (existingRegistrations && existingRegistrations.length > 0) {
                const existing = existingRegistrations[0]
                const usedField = existing.email === formData.email ? 'email' : 'số điện thoại'
                setErrorMessage(`Bạn đã đăng ký với ${usedField} này rồi. Mỗi người chỉ được đặt một vé.`)
                setLoading(false)
                setTimeout(() => setErrorMessage(null), 8000)
                return
            }

            // KHÔNG tạo registration ngay, chỉ tạo payment link với thông tin đăng ký
            // Registration sẽ được tạo khi thanh toán thành công trong webhook
            // Giữ ghế ở trạng thái 'selected' với sessionId để tránh người khác chọn
            const { error: seatError } = await supabase
                .from('seats')
                .update({
                    status: 'selected', // Giữ selected, không đánh dấu booked cho đến khi thanh toán
                    selected_by: sessionId, // Giữ selected_by để biết ai đang giữ ghế
                    expires_at: null // Xóa expires_at để ghế không bị tự động giải phóng
                })
                .eq('seat_number', confirmedSeat)

            if (seatError) {
                console.error('Error updating seat:', seatError)
                throw new Error('Không thể giữ ghế. Vui lòng thử lại.')
            }

            // Lưu thông tin tạm vào localStorage để có thể khôi phục nếu cần
            const tempRegistrationData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                seat_number: confirmedSeat,
                session_id: sessionId,
                created_at: new Date().toISOString()
            }
            localStorage.setItem('tempRegistration', JSON.stringify(tempRegistrationData))
            
            // Tạo payment link với thông tin đăng ký (không có registrationId)
            setSubmitted(true) // Đánh dấu đã submit để hiển thị UI thanh toán
            
            // Tạo link thanh toán PayOS với thông tin đăng ký (không có registrationId)
            setCreatingPayosLink(true)
            try {
                const payosResponse = await fetch('/api/payos/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        // Không có registrationId, chỉ gửi thông tin đăng ký
                        customerName: formData.name,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        seatNumber: confirmedSeat,
                        sessionId: sessionId,
                        amount: 399000, // 399K VND
                        description: `Workshop - Ghế ${confirmedSeat}` // Max 25 characters for PayOS
                    })
                })
                
                const payosResult = await payosResponse.json()
                
                if (!payosResponse.ok) {
                    throw new Error(payosResult.error || 'Không thể tạo link thanh toán PayOS')
                }
                
                // Lưu payosPaymentId vào localStorage để có thể kiểm tra trạng thái sau này
                if (payosResult.payosPaymentId) {
                    localStorage.setItem('payosPaymentId', payosResult.payosPaymentId)
                }
                
                // Chuyển hướng trực tiếp đến trang thanh toán PayOS
                if (payosResult.paymentLink) {
                    setShowFormModal(false)
                    window.location.href = payosResult.paymentLink
                    return // Dừng xử lý để tránh set state sau khi redirect
                } else {
                    throw new Error('Không nhận được link thanh toán từ PayOS')
                }
            } catch (err: any) {
                console.error('Error creating PayOS payment:', err)
                setErrorMessage('Không thể tạo link thanh toán PayOS: ' + err.message)
                setTimeout(() => setErrorMessage(null), 5000)
                setCreatingPayosLink(false)
            }
        } catch (error: any) {
            setErrorMessage('Có lỗi xảy ra: ' + error.message)
        } finally {
            setLoading(false)
            setTimeout(() => setErrorMessage(null), 5000)
        }
    }

    if (!isConfigured) {
        return (
            <section className="w-full min-h-screen bg-stripes md:bg-stripes-desktop text-black px-6 pt-20 pb-10 relative overflow-hidden flex flex-col justify-center items-center">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-black mb-4">Cấu hình thiếu</h1>
                            <p className="text-gray-600 mb-6">
                                Ứng dụng chưa được cấu hình đầy đủ. Vui lòng tạo file <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> với các biến môi trường sau:
                            </p>
                            <div className="bg-gray-100 rounded-lg p-4 text-left mb-6">
                                <pre className="text-sm text-gray-800">
                                    {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <>
            <section className="w-full min-h-screen bg-stripes md:bg-stripes-desktop text-black px-4 md:px-6 pt-20 pb-10 relative overflow-hidden flex flex-col justify-center items-center">
                <div className="max-w-2xl mx-auto w-full">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 lg:p-8 w-full">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 tracking-tight">Đăng ký Workshop</h1>
                            <p className="text-gray-600 mb-3">Chọn ghế ngồi để bắt đầu đăng ký</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm md:text-base font-medium">{formatEventDateTime()}</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-gray-700 flex-wrap">
                                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-sm md:text-base font-medium">
                                        <span className="font-semibold">Địa điểm:</span>{' '}
                                        <a 
                                            href={eventLocationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-black hover:text-gray-800 underline transition-colors"
                                        >
                                            {eventLocation}
                                        </a>
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm md:text-base font-medium">
                                        <span className="font-semibold">Giá vé:</span> 399K
                                    </p>
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm text-red-800">{errorMessage}</p>
                                </div>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="ml-3 text-red-600 hover:text-red-800"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                                <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm text-green-800">{successMessage}</p>
                                </div>
                                <button
                                    onClick={() => setSuccessMessage(null)}
                                    className="ml-3 text-green-600 hover:text-green-800"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <SeatSelector
                                selectedSeat={selectedSeat}
                                confirmedSeat={confirmedSeat}
                                onSeatSelect={setSelectedSeat}
                                sessionId={sessionId}
                            />
                        </div>

                        {selectedSeat && !confirmedSeat && (
                            <button
                                type="button"
                                onClick={handleConfirmSeat}
                                disabled={confirmingSeat}
                                className="w-full bg-gray-600 text-white py-3 rounded-md font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {confirmingSeat ? 'Đang xác nhận...' : `Xác nhận ghế số ${selectedSeat}`}
                            </button>
                        )}

                        {confirmedSeat && !showFormModal && !submitted && (
                            <div className="bg-green-600 text-white rounded-md p-4 mt-6">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-white mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm">
                                            <strong>Đã xác nhận ghế số {confirmedSeat}</strong> - Bấm để điền thông tin
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSeat(null)
                                            setConfirmedSeat(null)
                                        }}
                                        className="text-xs text-green-200 hover:text-white underline whitespace-nowrap"
                                    >
                                        Đổi ghế
                                    </button>
                                </div>
                            </div>
                        )}

                        {submitted && registrationId && !showQRModal && (
                            <>
                                {paymentStatus === 'verified' || paymentStatus === 'sent' ? (
                                    <div className="mt-6 rounded-md p-4 bg-green-50 border-2 border-green-400">
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-green-800">
                                                        ✓ Thanh toán đã được xác nhận!
                                                    </p>
                                                    <p className="text-xs text-green-700 font-medium">
                                                        {paymentStatus === 'verified' 
                                                            ? 'Mã QR check-in đang được gửi đến email của bạn' 
                                                            : 'Mã QR check-in đã được gửi! Vui lòng kiểm tra email'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 rounded-md p-4 bg-green-50 border border-green-200">
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-green-800">
                                                        Bạn đã đăng ký thành công
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Vui lòng thanh toán để hoàn tất đăng ký
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQRModal(true)
                                                    checkPaymentStatus(registrationId)
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap flex-shrink-0"
                                            >
                                                Thanh toán
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-black">Điền thông tin</h2>
                            <button
                                onClick={async () => {
                                    if (confirmedSeat && !submitted) {
                                        try {
                                            await fetch('/api/release-seat', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    seat_number: confirmedSeat,
                                                    session_id: sessionId
                                                }),
                                            })
                                            setSelectedSeat(null)
                                            setConfirmedSeat(null)
                                        } catch (err) {
                                            console.error('Error releasing seat:', err)
                                        }
                                    }
                                    setShowFormModal(false)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                                </div>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="ml-3 text-red-600 hover:text-red-800"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="modal-name" className="block text-sm font-medium text-black mb-2">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    id="modal-name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value })
                                        if (formErrors.name) {
                                            setFormErrors({ ...formErrors, name: '' })
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!formData.name.trim()) {
                                            setFormErrors({ ...formErrors, name: 'Vui lòng điền vào trường này.' })
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black ${
                                        formErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập họ và tên"
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="modal-email" className="block text-sm font-medium text-black mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="modal-email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value })
                                        if (formErrors.email) {
                                            setFormErrors({ ...formErrors, email: '' })
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!formData.email.trim()) {
                                            setFormErrors({ ...formErrors, email: 'Vui lòng điền vào trường này.' })
                                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                                            setFormErrors({ ...formErrors, email: 'Email không hợp lệ.' })
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black ${
                                        formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập email"
                                />
                                {formErrors.email && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="modal-phone" className="block text-sm font-medium text-black mb-2">
                                    Số điện thoại *
                                </label>
                                <input
                                    type="tel"
                                    id="modal-phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value })
                                        if (formErrors.phone) {
                                            setFormErrors({ ...formErrors, phone: '' })
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!formData.phone.trim()) {
                                            setFormErrors({ ...formErrors, phone: 'Vui lòng điền vào trường này.' })
                                        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
                                            setFormErrors({ ...formErrors, phone: 'Số điện thoại không hợp lệ.' })
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black ${
                                        formErrors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập số điện thoại"
                                />
                                {formErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formErrors.phone}
                                    </p>
                                )}
                            </div>


                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Payment Modal */}
            {showQRModal && submitted && registrationId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-black">Thanh toán</h2>
                            <button
                                onClick={handleCloseQRModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {paymentStatus !== 'verified' && (
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-2">Xác nhận thanh toán</h3>
                                <p className="text-gray-600">Vui lòng thanh toán qua PayOS</p>
                            </div>
                        )}

                        {creatingPayosLink && (
                            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-blue-800">Đang tạo link thanh toán PayOS...</p>
                                </div>
                            </div>
                        )}

                        {paymentStatus === 'verified' ? (
                            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-5 mb-6">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-green-800 font-semibold text-base mb-1">
                                            ✓ Thanh toán đã được xác nhận!
                                        </p>
                                        <p className="text-green-700 text-sm">
                                            Mã QR check-in đang được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến và spam.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {payosPaymentLink ? (
                                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-black mb-4">Thanh toán qua PayOS</h4>
                                        <div className="space-y-4">
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <p className="text-sm text-gray-600 mb-2">Nhấn vào nút bên dưới để thanh toán:</p>
                                                <a
                                                    href={payosPaymentLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors text-center"
                                                >
                                                    Thanh toán
                                                </a>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-sm text-yellow-800">
                                                    <strong>Lưu ý:</strong> Sau khi thanh toán thành công, hệ thống sẽ tự động cập nhật trạng thái và gửi mã QR check-in qua email.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 text-sm">
                                            Không thể tạo link thanh toán PayOS. Vui lòng thử lại sau.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            {paymentStatus !== 'verified' ? (
                                <button
                                    onClick={handleCancelFromQR}
                                    className="w-full bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 transition-colors"
                                >
                                    Hủy vé
                                </button>
                            ) : (
                                <button
                                    onClick={handleCloseQRModal}
                                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Đóng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-black mb-4">Xác nhận hủy vé</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn hủy vé? Ghế sẽ được giải phóng và bạn sẽ cần đăng ký lại.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmCancelRegistration}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

