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
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #0056b3;
              color: #ffffff !important;
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

// Send order notification email to superadmin
const sendOrderNotificationEmail = async (order, customer, products) => {
  console.log('=== Order Notification Email - Starting ===');
  console.log('Attempting to send order notification email:', {
    orderNumber: order.orderNumber,
    customerEmail: customer?.email,
    customerName: customer?.name,
    orderId: order._id?.toString(),
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate input data
    if (!order || !order.orderNumber) {
      console.error('❌ Invalid order data. Cannot send order notification email.');
      return null;
    }

    if (!customer || !customer.email) {
      console.error('❌ Invalid customer data. Cannot send order notification email.');
      return null;
    }

    if (!products || products.length === 0) {
      console.warn('⚠️ No products found in order. Email will be sent without product details.');
    }

    // Verify SMTP configuration first
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP configuration missing. Cannot send order notification email.');
      console.error('Required environment variables: SMTP_USER, SMTP_PASS');
      return null;
    }

    console.log('✅ Input validation passed.');

    console.log('SMTP configuration verified. Creating transporter...');
    const transporter = createTransporter();

    // Find superadmin role and get superadmin users
    const Role = require('../models/role.model');
    const User = require('../models/user.model');
    
    console.log('Looking for superadmin role...');
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    if (!superadminRole) {
      console.error('❌ Superadmin role not found. Skipping order notification email.');
      return null;
    }
    console.log('✅ Superadmin role found:', superadminRole._id.toString());

    console.log('Looking for superadmin users...');
    const superadmins = await User.find({ role: superadminRole._id }).select('email name');
    if (!superadmins || superadmins.length === 0) {
      console.error('❌ No superadmin users found. Skipping order notification email.');
      console.log('To fix: Create a user with superadmin role in the database.');
      return null;
    }
    console.log(`✅ Found ${superadmins.length} superadmin user(s):`, 
      superadmins.map(s => ({ email: s.email, name: s.name }))
    );

    // Build product details HTML
    const productDetailsHtml = order.items.map((item, index) => {
      const product = products.find(p => p._id.toString() === item.product.toString());
      const productImage = product?.images?.[0] 
        ? (product.images[0].startsWith('data:image/') 
            ? product.images[0] 
            : `data:image/jpeg;base64,${product.images[0]}`)
        : null;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${index + 1}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${productImage ? `<img src="${productImage}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 'No Image'}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            <strong>${item.name}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
            ₹${item.price.toFixed(2)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
            <strong>₹${item.total.toFixed(2)}</strong>
          </td>
        </tr>
      `;
    }).join('');

    // Build customer details HTML
    const customerDetailsHtml = `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td>
        <td style="padding: 8px;">${customer.name || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold;">Email:</td>
        <td style="padding: 8px;">${customer.email || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold;">Phone:</td>
        <td style="padding: 8px;">${customer.phone || 'N/A'}</td>
      </tr>
      ${customer.address ? `
      <tr>
        <td style="padding: 8px; font-weight: bold;">Address:</td>
        <td style="padding: 8px;">
          ${customer.address.line1 || ''}${customer.address.line2 ? `, ${customer.address.line2}` : ''}<br>
          ${customer.address.city || ''}${customer.address.state ? `, ${customer.address.state}` : ''}<br>
          ${customer.address.postalCode || ''}${customer.address.country ? `, ${customer.address.country}` : ''}
        </td>
      </tr>
      ` : ''}
    `;

    // Build shipping address HTML
    const shippingAddressHtml = order.shippingAddress ? `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 150px;">Shipping Address:</td>
        <td style="padding: 8px;">
          ${order.shippingAddress.line1 || ''}${order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br>
          ${order.shippingAddress.city || ''}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}<br>
          ${order.shippingAddress.postalCode || ''}${order.shippingAddress.country ? `, ${order.shippingAddress.country}` : ''}
        </td>
      </tr>
    ` : '';

    const htmlContent = `
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
            max-width: 800px;
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
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: white;
          }
          th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-weight: bold;
          }
          .order-summary {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: 1.1em;
            background-color: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Order Placed</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>A new order has been placed on your Soft Chilli platform.</p>
            
            <div class="order-summary">
              <h3 style="margin-top: 0;">Order Information</h3>
              <table>
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order Number:</td>
                  <td style="padding: 8px;"><strong>${order.orderNumber}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Order Date:</td>
                  <td style="padding: 8px;">${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Payment Method:</td>
                  <td style="padding: 8px;">${order.paymentMethod || 'Cash'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px;"><strong style="color: #ffc107;">${order.status || 'Pending'}</strong></td>
                </tr>
              </table>
            </div>

            <div class="order-summary">
              <h3 style="margin-top: 0;">Customer Details</h3>
              <table>
                ${customerDetailsHtml}
                ${shippingAddressHtml}
              </table>
            </div>

            <div class="order-summary">
              <h3 style="margin-top: 0;">Product Details</h3>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: center; width: 50px;">#</th>
                    <th style="text-align: center; width: 80px;">Image</th>
                    <th>Product Name</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productDetailsHtml}
                </tbody>
              </table>
            </div>

            <div class="order-summary">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <table>
                <tr>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 10px; text-align: right;">₹${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
                  <td style="padding: 10px; text-align: right;">₹${(order.tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                  <td style="padding: 10px; text-align: right;">₹${(order.shipping || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td style="padding: 10px; text-align: right;">Total Amount:</td>
                  <td style="padding: 10px; text-align: right;">₹${order.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${order.notes ? `
            <div class="order-summary">
              <h3 style="margin-top: 0;">Order Notes</h3>
              <p>${order.notes}</p>
            </div>
            ` : ''}

            <p style="margin-top: 20px;">Please review and process this order accordingly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all superadmins
    console.log('Preparing email content...');
    const emailPromises = superadmins.map(async (superadmin) => {
      if (!superadmin.email) {
        console.warn(`⚠️ Superadmin ${superadmin.name || superadmin._id} has no email address. Skipping.`);
        return null;
      }

      console.log(`Preparing email for superadmin: ${superadmin.email}`);
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Soft Chilli'}" <${process.env.SMTP_USER}>`,
        to: superadmin.email,
        subject: `New Order Placed - ${order.orderNumber}`,
        html: htmlContent,
        text: `
          New Order Placed - ${order.orderNumber}
          
          A new order has been placed on your Soft Chilli platform.
          
          Order Number: ${order.orderNumber}
          Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}
          Customer: ${customer.name} (${customer.email})
          Total Amount: ₹${order.total.toFixed(2)}
          
          Please log in to your admin panel to view full order details.
        `,
      };

      console.log(`Sending email to ${superadmin.email}...`);
      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${superadmin.email}:`, {
          messageId: result.messageId,
          response: result.response,
        });
        return result;
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${superadmin.email}:`, {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response,
        });
        throw emailError; // Re-throw to be caught by Promise.allSettled
      }
    });

    console.log('Sending emails to all superadmins...');
    const results = await Promise.allSettled(emailPromises.filter(p => p !== null));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('=== Order Notification Email - Summary ===');
    console.log('Order notification emails sent:', {
      total: superadmins.length,
      successful,
      failed,
      orderNumber: order.orderNumber,
    });

    if (failed > 0) {
      console.error('❌ Some order notification emails failed to send:', {
        failedCount: failed,
        errors: results
          .filter(r => r.status === 'rejected')
          .map((r, index) => ({
            superadmin: superadmins[index]?.email || 'Unknown',
            error: r.reason?.message || 'Unknown error',
            code: r.reason?.code,
            response: r.reason?.response,
          })),
      });
    }

    if (successful > 0) {
      console.log('✅ Order notification emails sent successfully!');
    }

    return results;
  } catch (error) {
    console.error('❌ Error sending order notification email:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      orderNumber: order.orderNumber,
      errorDetails: {
        name: error.name,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      },
    });
    // Don't throw error - order creation should not fail if email fails
    return null;
  } finally {
    console.log('=== Order Notification Email - Completed ===');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderNotificationEmail,
  createTransporter,
};

