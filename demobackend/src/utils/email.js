const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Log configuration (without sensitive data)
  console.log('SMTP Configuration:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET',
    pass: smtpPass ? '***SET***' : 'NOT SET',
  });

  // Validate required fields
  if (!smtpUser || !smtpPass) {
    const error = new Error('SMTP_USER and SMTP_PASS environment variables are required');
    console.error('SMTP Configuration Error:', error.message);
    throw error;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Add connection timeout and retry options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  console.log('Attempting to send password reset email:', {
    to: email,
    resetUrl: resetUrl.substring(0, 50) + '...',
    timestamp: new Date().toISOString(),
  });

  try {
    const transporter = createTransporter();

    // Verify connection before sending
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Soft Chilli'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #28a745;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your password for your Soft Chilli account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Soft Chilli. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        You have requested to reset your password for your Soft Chilli account.
        
        Click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
        
        This is an automated email, please do not reply.
      `,
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    console.error('Error sending password reset email - Full Details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET',
      },
    });
    
    // Create a more descriptive error
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check SMTP_USER and SMTP_PASS.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'SMTP connection failed. Please check SMTP_HOST and SMTP_PORT.';
    } else if (error.message) {
      errorMessage = `Email sending failed: ${error.message}`;
    }
    
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    throw enhancedError;
  }
};

module.exports = {
  sendPasswordResetEmail,
  createTransporter,
};

