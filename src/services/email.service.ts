import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  fromName: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null

  private initializeTransporter() {
    if (this.transporter) {
      return this.transporter
    }

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || '',
      fromName: process.env.EMAIL_FROM_NAME || 'Tay Nguyen Food Workshop',
    }

    // Validate config
    if (!config.user || !config.pass || !config.from) {
      const missing = []
      if (!config.user) missing.push('SMTP_USER')
      if (!config.pass) missing.push('SMTP_PASS')
      if (!config.from) missing.push('EMAIL_FROM')
      throw new Error(`Missing email configuration: ${missing.join(', ')}`)
    }

    console.log('Initializing email transporter with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from: config.from,
      fromName: config.fromName,
    })

    this.config = config

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    return this.transporter
  }

  /**
   * Gửi email thông báo đăng ký mới cho staff
   */
  async sendRegistrationNotificationToStaff(
    staffEmails: string[],
    registrationData: {
      name: string
      email: string
      phone: string
      seat_number: number | null
      registration_id: string
      created_at?: string
    }
  ): Promise<void> {
    if (!staffEmails || staffEmails.length === 0) {
      console.warn('No staff emails provided, skipping notification')
      return
    }

    const transporter = this.initializeTransporter()

    if (!this.config) {
      throw new Error('Email configuration not initialized')
    }

    // Format thời gian đăng ký
    const registrationTime = registrationData.created_at 
      ? new Date(registrationData.created_at).toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })

    // Link đến trang quản lý với ID đăng ký
    const manageUrl = `https://workshop-staff.vercel.app/?id=${registrationData.registration_id}`

    const subject = `Thông báo đăng ký mới - ${registrationData.name} - Ghế ${registrationData.seat_number || 'N/A'}`
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #171717;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 28px 20px;
              text-align: center;
            }
            .header h1 {
              font-size: 22px;
              font-weight: 600;
              margin: 0;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .content {
              padding: 24px 20px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 16px;
              color: #171717;
              margin-bottom: 20px;
            }
            .info-card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
            }
            .info-row {
              display: table;
              width: 100%;
              table-layout: fixed;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              display: table-cell;
              font-weight: 600;
              color: #666666;
              font-size: 14px;
              width: 40%;
              vertical-align: top;
              padding-right: 16px;
            }
            .info-value {
              display: table-cell;
              color: #000000;
              font-size: 14px;
              text-align: left;
              width: 60%;
              vertical-align: top;
              word-break: break-word;
            }
            .info-value a {
              color: #000000;
              text-decoration: none;
            }
            .info-value a:hover {
              text-decoration: underline;
            }
            .highlight-box {
              background-color: #fff;
              border-left: 4px solid #000000;
              padding: 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .action-buttons {
              margin: 32px 0 24px 0;
              text-align: center;
            }
            .btn {
              display: inline-block;
              padding: 14px 28px;
              text-align: center;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.2s;
              border: none;
              cursor: pointer;
            }
            .btn-primary {
              background-color: #000000;
              color: #ffffff;
            }
            .btn-primary:hover {
              background-color: #1a1a1a;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              color: #666666;
              font-size: 12px;
              line-height: 1.6;
            }
            .footer-link {
              color: #000000;
              text-decoration: none;
              font-weight: 500;
            }
            .footer-link:hover {
              text-decoration: underline;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              background-color: #fef3c7;
              color: #92400e;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px;
              }
              .content {
                padding: 20px 16px;
              }
              .info-row {
                display: block;
                padding: 10px 0;
              }
              .info-label {
                display: block;
                width: 100%;
                margin-bottom: 4px;
                padding-right: 0;
              }
              .info-value {
                display: block;
                width: 100%;
                text-align: left;
              }
              .btn {
                width: 100%;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Thông báo đăng ký mới</h1>
            </div>
            <div class="content">
              <div class="greeting">
                <p style="margin-bottom: 4px;">Xin chào,</p>
                <p style="margin-top: 0; color: #666;">Có một đăng ký mới cho <strong style="color: #000;">Workshop Tây Nguyên Food</strong>. Vui lòng kiểm tra và xác nhận thanh toán.</p>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Họ và tên:</span>
                  <span class="info-value"><strong>${registrationData.name}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value"><a href="mailto:${registrationData.email}">${registrationData.email}</a></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Số điện thoại:</span>
                  <span class="info-value"><a href="tel:${registrationData.phone}">${registrationData.phone}</a></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Số ghế:</span>
                  <span class="info-value"><strong style="font-size: 18px;">${registrationData.seat_number || 'Chưa chọn'}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mã đăng ký:</span>
                  <span class="info-value" style="font-family: monospace; font-size: 12px;">${registrationData.registration_id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Thời gian đăng ký:</span>
                  <span class="info-value">${registrationTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Trạng thái:</span>
                  <span class="info-value"><span class="status-badge">Đang chờ xác nhận</span></span>
                </div>
              </div>

              <div class="highlight-box">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>Lưu ý:</strong> Sau khi xác nhận thanh toán, hệ thống sẽ tự động gửi mã QR check-in đến email của người đăng ký.
                </p>
              </div>

              <div class="action-buttons">
                <a href="${manageUrl}" class="btn btn-primary" style="color: #ffffff !important;">
                  Xác nhận thanh toán
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 8px 0;">Email này được gửi tự động từ hệ thống <strong style="color: #000;">${this.config.fromName}</strong></p>
              <p style="margin: 0;">
                <a href="${manageUrl}" class="footer-link">Truy cập trang quản lý</a> để xem tất cả đăng ký
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
THÔNG BÁO ĐĂNG KÝ MỚI

Xin chào,

Có một đăng ký mới cho Workshop Tây Nguyên Food. Vui lòng kiểm tra và xác nhận thanh toán.

THÔNG TIN CHI TIẾT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Họ và tên: ${registrationData.name}
Email: ${registrationData.email}
Số điện thoại: ${registrationData.phone}
Số ghế: ${registrationData.seat_number || 'Chưa chọn'}
Mã đăng ký: ${registrationData.registration_id}
Thời gian đăng ký: ${registrationTime}
Trạng thái: Đang chờ xác nhận
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XÁC NHẬN THANH TOÁN:
${manageUrl}

Lưu ý: Sau khi xác nhận thanh toán, hệ thống sẽ tự động gửi mã QR check-in đến email của người đăng ký.

---
Email này được gửi tự động từ hệ thống ${this.config.fromName}
    `

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: staffEmails.join(', '),
        subject: subject,
        text: textContent,
        html: htmlContent,
      }

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        recipientCount: staffEmails.length,
      })

      const info = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      })
    } catch (error: any) {
      console.error('Error sending email:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      })
      throw error
    }
  }
}

export const emailService = new EmailService()

