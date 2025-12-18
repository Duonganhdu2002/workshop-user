import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

// Generate QR code as base64
async function generateQRCodeBase64(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Không thể tạo QR code')
  }
}

// Generate QR code as buffer
async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 2,
    })
    return qrCodeBuffer
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Không thể tạo QR code')
  }
}

// Generate email HTML template
function generateEmailHTML(name: string, qrCodeImageSrc: string, qrData: string, logoBase64: string = ''): string {
  let seatNumber: string | null = null
  let workshopDate: Date | null = null
  let formattedDate: string = '28/12/2025'
  let formattedTime: string = '14:00 - 17:00'
  
  try {
    const parsed = JSON.parse(qrData)
    if (parsed.seat_number) {
      seatNumber = parsed.seat_number.toString()
    }
    if (parsed.workshop_date) {
      workshopDate = new Date(parsed.workshop_date)
      if (!isNaN(workshopDate.getTime()) && workshopDate.getFullYear() > 1970) {
        const day = String(workshopDate.getDate()).padStart(2, '0')
        const month = String(workshopDate.getMonth() + 1).padStart(2, '0')
        const year = workshopDate.getFullYear()
        formattedDate = `${day}/${month}/${year}`
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  const workshopLocation = process.env.NEXT_PUBLIC_EVENT_LOCATION || 'Vibas Coffee - Tân Bình'
  const workshopTime = process.env.NEXT_PUBLIC_EVENT_START_TIME || '14:00'
  const workshopEndTime = process.env.NEXT_PUBLIC_EVENT_END_TIME || '17:00'
  const googleMapsLink = process.env.NEXT_PUBLIC_EVENT_LOCATION_LINK || 'https://maps.app.goo.gl/ePbt2TnvQocTdVs5A'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đăng ký Workshop</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #000000; letter-spacing: -0.5px;">
                Xác nhận đăng ký thành công
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280; font-weight: 400;">
                Workshop "Người Việt Healthy Theo Kiểu Việt"
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #111827; font-weight: 600;">
                Xin chào <strong style="color: #000000;">${name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                Cảm ơn bạn đã đăng ký tham gia workshop của chúng tôi! Đây là mã QR code để check-in tại sự kiện.
              </p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
                  Mã QR Code Check-in
                </p>
                <img src="${qrCodeImageSrc}" alt="QR Code" style="max-width: 300px; width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px;" />
                ${seatNumber ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: #374151;">Ghế số: <strong>${seatNumber}</strong></p>` : ''}
              </div>
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">
                  📅 Ngày: ${formattedDate}<br>
                  ⏰ Thời gian: ${workshopTime} - ${workshopEndTime}<br>
                  📍 Địa điểm: <a href="${googleMapsLink}" style="color: #166534; text-decoration: underline;">${workshopLocation}</a>
                </p>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280;">
                Vui lòng mang mã QR code này đến sự kiện để check-in. Chúng tôi rất mong được gặp bạn!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Email này được gửi tự động từ hệ thống đăng ký workshop.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Send email using SMTP
async function sendEmailWithSMTP(to: string, subject: string, html: string, qrCodeBuffer: Buffer): Promise<void> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Cấu hình SMTP chưa đầy đủ')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER
  const fromName = process.env.EMAIL_FROM_NAME || 'Workshop'

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        cid: 'qrcode@workshop',
      },
    ],
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing registrationId' },
        { status: 400 }
      )
    }

    // Get registration data
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

    // Use registration data directly (workshop-user may not have encryption)
    const decryptedReg = registration

    // Validate email
    if (!decryptedReg.email || !decryptedReg.email.trim()) {
      return NextResponse.json(
        { error: 'Email not found in registration' },
        { status: 400 }
      )
    }

    const email = decryptedReg.email.trim()
    const name = decryptedReg.name || 'Khách hàng'

    // Generate QR code data
    const workshopDate = decryptedReg.workshop_date || process.env.NEXT_PUBLIC_EVENT_DATE || '2025-12-28'
    const qrData = JSON.stringify({
      id: decryptedReg.id,
      name: name,
      email: email,
      phone: decryptedReg.phone || '',
      workshop_date: workshopDate,
      seat_number: decryptedReg.seat_number
    })

    // Generate QR code
    const qrCodeBuffer = await generateQRCodeBuffer(qrData)
    const qrCodeBase64 = await generateQRCodeBase64(qrData)

    // Generate email HTML
    const emailHTML = generateEmailHTML(name, qrCodeBase64, qrData)

    // Send email
    const emailSubject = process.env.EMAIL_SUBJECT || '[TÂY NGUYÊN FOOD - VIỆT NAM] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG WORKSHOP "NGƯỜI VIỆT HEALTHY THEO KIỂU VIỆT"'
    
    await sendEmailWithSMTP(email, emailSubject, emailHTML, qrCodeBuffer)

    // Update registration status and save QR code
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_status: 'sent',
        qr_code: qrData
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('Error updating registration:', updateError)
      // Don't fail, email was sent
    }

    return NextResponse.json({
      success: true,
      message: 'QR code email sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending QR code email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send QR code email' },
      { status: 500 }
    )
  }
}

