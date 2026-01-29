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
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('❌ Failed to create email transporter:', {
        message: transporterError.message,
        stack: transporterError.stack,
      });
      return null;
    }

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
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('❌ Failed to create email transporter:', {
        message: transporterError.message,
        stack: transporterError.stack,
      });
      return null;
    }

    // Find superadmin role and get superadmin users
    const Role = require('../models/role.model');
    const User = require('../models/user.model');
    
    console.log('Looking for superadmin role...');
    // Try case-insensitive search for superadmin role
    let superadminRole = await Role.findOne({ name: 'superadmin' });
    if (!superadminRole) {
      // Try case-insensitive search
      superadminRole = await Role.findOne({ 
        name: { $regex: /^superadmin$/i } 
      });
    }
    if (!superadminRole) {
      console.error('❌ Superadmin role not found. Skipping order notification email.');
      try {
        const allRoles = await Role.find({}).select('name').lean();
        console.error('Available roles in database:', allRoles.map(r => r.name));
      } catch (roleError) {
        console.error('Could not fetch roles:', roleError.message);
      }
      return null;
    }
    console.log('✅ Superadmin role found:', {
      id: superadminRole._id.toString(),
      name: superadminRole.name,
    });

    console.log('Looking for superadmin users...');
    // Find users with superadmin role (try both ObjectId and string matching)
    let superadmins = await User.find({ role: superadminRole._id }).select('email name role');
    
    // If no users found, try alternative query
    if (!superadmins || superadmins.length === 0) {
      console.log('Trying alternative query to find superadmin users...');
      try {
        // Try finding users and then filtering by populated role
        const allUsers = await User.find({}).select('email name role').populate('role', 'name');
        superadmins = allUsers.filter(user => {
          const roleName = typeof user.role === 'object' && user.role?.name 
            ? user.role.name.toLowerCase() 
            : '';
          return roleName === 'superadmin';
        });
      } catch (queryError) {
        console.error('Error in alternative query:', queryError.message);
      }
    }
    
    if (!superadmins || superadmins.length === 0) {
      console.error('❌ No superadmin users found. Skipping order notification email.');
      console.error('To fix: Create a user with superadmin role in the database.');
      try {
        const totalUsers = await User.countDocuments({});
        console.error('Total users in database:', totalUsers);
      } catch (countError) {
        console.error('Could not count users:', countError.message);
      }
      return null;
    }
    
    // Filter out users without email
    superadmins = superadmins.filter(s => s.email);
    
    if (superadmins.length === 0) {
      console.error('❌ No superadmin users with email addresses found.');
      return null;
    }
    
    console.log(`✅ Found ${superadmins.length} superadmin user(s) with email:`, 
      superadmins.map(s => ({ email: s.email, name: s.name, id: s._id.toString() }))
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
          accepted: result.accepted,
          rejected: result.rejected,
        });
        return result;
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${superadmin.email}:`, {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response,
          command: emailError.command,
          responseCode: emailError.responseCode,
          stack: emailError.stack,
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

// Send order confirmation email to customer
const sendOrderConfirmationEmail = async (order, customer, products) => {
  console.log('=== Order Confirmation Email (Customer) - Starting ===');
  console.log('Attempting to send order confirmation email to customer:', {
    orderNumber: order.orderNumber,
    customerEmail: customer?.email,
    customerName: customer?.name,
    orderId: order._id?.toString(),
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate input data
    if (!order || !order.orderNumber) {
      console.error('❌ Invalid order data. Cannot send order confirmation email.');
      return null;
    }

    if (!customer || !customer.email) {
      console.error('❌ Invalid customer data. Cannot send order confirmation email.');
      return null;
    }

    // Verify SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP configuration missing. Cannot send order confirmation email.');
      return null;
    }

    console.log('✅ Input validation passed. Creating transporter...');
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('❌ Failed to create email transporter:', {
        message: transporterError.message,
        stack: transporterError.stack,
      });
      return null;
    }

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

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const orderUrl = `${frontendUrl}/orders/${order._id}`;

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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Hello ${customer.name || 'Customer'},</p>
            <p>Thank you for your order! We have received your order and it is being processed.</p>
            
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
              <h3 style="margin-top: 0;">Shipping Address</h3>
              <table>
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

            <div style="text-align: center; margin-top: 20px;">
              <a href="${orderUrl}" class="button">View Order Details</a>
            </div>

            <p style="margin-top: 20px;">We will send you another email once your order has been shipped.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Preparing email for customer: ${customer.email}`);
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Soft Chilli'}" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: htmlContent,
      text: `
        Order Confirmation - ${order.orderNumber}
        
        Hello ${customer.name || 'Customer'},
        
        Thank you for your order! We have received your order and it is being processed.
        
        Order Number: ${order.orderNumber}
        Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}
        Total Amount: ₹${order.total.toFixed(2)}
        
        View your order: ${orderUrl}
        
        We will send you another email once your order has been shipped.
        
        If you have any questions, please contact our support team.
      `,
    };

    console.log(`Sending email to ${customer.email}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent successfully to ${customer.email}:`, {
      messageId: result.messageId,
      response: result.response,
    });
    console.log('=== Order Confirmation Email (Customer) - Completed ===');
    return result;
  } catch (error) {
    console.error('❌ Error sending order confirmation email to customer:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      orderNumber: order.orderNumber,
      customerEmail: customer?.email,
      errorDetails: {
        name: error.name,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      },
    });
    // Don't throw error - order creation should not fail if email fails
    return null;
  }
};

// Send welcome email to new customer after signup
const sendWelcomeEmail = async (customer) => {
  console.log('=== Welcome Email - Starting ===');
  console.log('Attempting to send welcome email to new customer:', {
    customerEmail: customer?.email,
    customerName: customer?.name,
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate input data
    if (!customer || !customer.email) {
      console.error('❌ Invalid customer data. Cannot send welcome email.');
      return null;
    }

    // Verify SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP configuration missing. Cannot send welcome email.');
      return null;
    }

    console.log('✅ Input validation passed. Creating transporter...');
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('❌ Failed to create email transporter:', {
        message: transporterError.message,
        stack: transporterError.stack,
      });
      return null;
    }

    // Get featured products
    const Product = require('../models/product.model');
    const featuredProducts = await Product.find({ 
      featured: true, 
      status: 'active' 
    })
    .limit(6)
    .select('name images price compareAtPrice description')
    .lean();

    console.log(`Found ${featuredProducts.length} featured products for welcome email`);

    // Build featured products HTML
    const featuredProductsHtml = featuredProducts.length > 0 ? `
      <div class="order-summary" style="margin-top: 30px;">
        <h3 style="margin-top: 0; text-align: center; color: #28a745;">Featured Products</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
          ${featuredProducts.map((product) => {
            const productImage = product.images?.[0] 
              ? (product.images[0].startsWith('data:image/') 
                  ? product.images[0] 
                  : `data:image/jpeg;base64,${product.images[0]}`)
              : null;
            const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
            const productUrl = `${frontendUrl}/products/${product._id}`;
            
            return `
              <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; background: white;">
                ${productImage ? `
                  <a href="${productUrl}" style="text-decoration: none; color: inherit;">
                    <img src="${productImage}" alt="${product.name}" style="width: 100%; max-width: 150px; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                  </a>
                ` : ''}
                <h4 style="margin: 10px 0; font-size: 16px;">
                  <a href="${productUrl}" style="text-decoration: none; color: #007bff;">${product.name}</a>
                </h4>
                <div style="margin: 10px 0;">
                  <strong style="color: #28a745; font-size: 18px;">₹${product.price.toFixed(2)}</strong>
                  ${product.compareAtPrice && product.compareAtPrice > product.price ? `
                    <span style="text-decoration: line-through; color: #999; margin-left: 10px;">₹${product.compareAtPrice.toFixed(2)}</span>
                  ` : ''}
                </div>
                <a href="${productUrl}" class="button" style="display: inline-block; padding: 8px 20px; background-color: #007bff; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin-top: 10px; font-size: 14px;">View Product</a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const shopUrl = `${frontendUrl}/`;

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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
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
          .welcome-message {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
          }
          .feature-icon {
            font-size: 40px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to Soft Chilli!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">We're thrilled to have you with us!</p>
          </div>
          <div class="content">
            <div class="welcome-message">
              <h2 style="color: #28a745; margin-top: 0;">Hello ${customer.name || 'Valued Customer'}!</h2>
              <p style="font-size: 16px; line-height: 1.8;">
                Thank you for joining Soft Chilli! We're excited to have you as part of our community.
              </p>
              <p style="font-size: 16px; line-height: 1.8;">
                You've successfully created your account and we're ready to help you discover amazing products at great prices.
              </p>
              <p style="font-size: 16px; line-height: 1.8; color: #28a745; font-weight: bold;">
                Happy Shopping! 🛍️
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${shopUrl}" class="button">Start Shopping Now</a>
            </div>

            <div class="features">
              <div class="feature-box">
                <div class="feature-icon">🚚</div>
                <h3 style="margin: 10px 0;">Fast Delivery</h3>
                <p>Quick and reliable shipping to your doorstep</p>
              </div>
              <div class="feature-box">
                <div class="feature-icon">💳</div>
                <h3 style="margin: 10px 0;">Secure Payment</h3>
                <p>Safe and secure payment options</p>
              </div>
              <div class="feature-box">
                <div class="feature-icon">🎁</div>
                <h3 style="margin: 10px 0;">Best Prices</h3>
                <p>Competitive prices on all products</p>
              </div>
              <div class="feature-box">
                <div class="feature-icon">⭐</div>
                <h3 style="margin: 10px 0;">Quality Products</h3>
                <p>Only the best quality products</p>
              </div>
            </div>

            ${featuredProductsHtml}

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
              <p style="color: #666; margin: 10px 0;">
                Need help? Contact our support team anytime!
              </p>
              <p style="color: #666; margin: 10px 0; font-size: 14px;">
                &copy; ${new Date().getFullYear()} Soft Chilli. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Preparing welcome email for customer: ${customer.email}`);
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Soft Chilli'}" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: 'Welcome to Soft Chilli! 🎉',
      html: htmlContent,
      text: `
        Welcome to Soft Chilli!
        
        Hello ${customer.name || 'Valued Customer'}!
        
        Thank you for joining Soft Chilli! We're excited to have you as part of our community.
        
        You've successfully created your account and we're ready to help you discover amazing products at great prices.
        
        Happy Shopping!
        
        Start shopping now: ${shopUrl}
        
        Need help? Contact our support team anytime!
        
        © ${new Date().getFullYear()} Soft Chilli. All rights reserved.
      `,
    };

    console.log(`Sending welcome email to ${customer.email}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${customer.email}:`, {
      messageId: result.messageId,
      response: result.response,
    });
    console.log('=== Welcome Email - Completed ===');
    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      customerEmail: customer?.email,
      errorDetails: {
        name: error.name,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      },
    });
    // Don't throw error - signup should not fail if email fails
    return null;
  }
};

// Send support request email to superadmin
const sendSupportRequestEmail = async (supportData) => {
  console.log('=== Support Request Email - Starting ===');
  console.log('Attempting to send support request email:', {
    customerName: supportData?.name,
    customerEmail: supportData?.email,
    subject: supportData?.subject,
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate input data
    if (!supportData || !supportData.name || !supportData.email || !supportData.message) {
      console.error('❌ Invalid support data. Cannot send support request email.');
      return null;
    }

    // Verify SMTP configuration first
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP configuration missing. Cannot send support request email.');
      console.error('Required environment variables: SMTP_USER, SMTP_PASS');
      return null;
    }

    console.log('✅ Input validation passed.');

    console.log('SMTP configuration verified. Creating transporter...');
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('❌ Failed to create email transporter:', {
        message: transporterError.message,
        stack: transporterError.stack,
      });
      return null;
    }

    // Find superadmin role and get superadmin users
    const Role = require('../models/role.model');
    const User = require('../models/user.model');
    
    console.log('Looking for superadmin role...');
    // Try case-insensitive search for superadmin role
    let superadminRole = await Role.findOne({ name: 'superadmin' });
    if (!superadminRole) {
      // Try case-insensitive search
      superadminRole = await Role.findOne({ 
        name: { $regex: /^superadmin$/i } 
      });
    }
    if (!superadminRole) {
      console.error('❌ Superadmin role not found. Skipping support request email.');
      try {
        const allRoles = await Role.find({}).select('name').lean();
        console.error('Available roles in database:', allRoles.map(r => r.name));
      } catch (roleError) {
        console.error('Could not fetch roles:', roleError.message);
      }
      return null;
    }
    console.log('✅ Superadmin role found:', {
      id: superadminRole._id.toString(),
      name: superadminRole.name,
    });

    console.log('Looking for superadmin users...');
    // Find users with superadmin role (try both ObjectId and string matching)
    let superadmins = await User.find({ role: superadminRole._id }).select('email name role');
    
    // If no users found, try alternative query
    if (!superadmins || superadmins.length === 0) {
      console.log('Trying alternative query to find superadmin users...');
      try {
        // Try finding users and then filtering by populated role
        const allUsers = await User.find({}).select('email name role').populate('role', 'name');
        superadmins = allUsers.filter(user => {
          const roleName = typeof user.role === 'object' && user.role?.name 
            ? user.role.name.toLowerCase() 
            : '';
          return roleName === 'superadmin';
        });
      } catch (queryError) {
        console.error('Error in alternative query:', queryError.message);
      }
    }
    
    if (!superadmins || superadmins.length === 0) {
      console.error('❌ No superadmin users found. Skipping support request email.');
      console.error('To fix: Create a user with superadmin role in the database.');
      try {
        const totalUsers = await User.countDocuments({});
        console.error('Total users in database:', totalUsers);
      } catch (countError) {
        console.error('Could not count users:', countError.message);
      }
      return null;
    }
    
    // Filter out users without email
    superadmins = superadmins.filter(s => s.email);
    
    if (superadmins.length === 0) {
      console.error('❌ No superadmin users with email addresses found.');
      return null;
    }
    
    console.log(`✅ Found ${superadmins.length} superadmin user(s) with email:`, 
      superadmins.map(s => ({ email: s.email, name: s.name, id: s._id.toString() }))
    );

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
            background-color: #007bff;
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
          .info-box {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #007bff;
          }
          .message-box {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin: 15px 0;
            border: 1px solid #dee2e6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: white;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
          }
          td:first-child {
            font-weight: bold;
            width: 150px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Support Request</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>A new support request has been submitted through the website contact form.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #007bff;">Customer Information</h3>
              <table>
                <tr>
                  <td>Name:</td>
                  <td>${supportData.name}</td>
                </tr>
                <tr>
                  <td>Email:</td>
                  <td><a href="mailto:${supportData.email}">${supportData.email}</a></td>
                </tr>
                <tr>
                  <td>Subject:</td>
                  <td><strong>${supportData.subject || 'No Subject'}</strong></td>
                </tr>
                <tr>
                  <td>Submitted:</td>
                  <td>${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
              </table>
            </div>

            <div class="message-box">
              <h3 style="margin-top: 0; color: #007bff;">Message</h3>
              <p style="white-space: pre-wrap; line-height: 1.8;">${supportData.message}</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 5px; border-left: 4px solid #007bff;">
              <p style="margin: 0; color: #004085;">
                <strong>Action Required:</strong> Please respond to this support request as soon as possible.
                You can reply directly to: <a href="mailto:${supportData.email}">${supportData.email}</a>
              </p>
            </div>
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
        replyTo: supportData.email, // Allow replying directly to customer
        subject: `Support Request: ${supportData.subject || 'No Subject'}`,
        html: htmlContent,
        text: `
          New Support Request
          
          A new support request has been submitted through the website contact form.
          
          Customer Information:
          Name: ${supportData.name}
          Email: ${supportData.email}
          Subject: ${supportData.subject || 'No Subject'}
          Submitted: ${new Date().toLocaleString('en-IN')}
          
          Message:
          ${supportData.message}
          
          Please respond to this support request as soon as possible.
          Reply to: ${supportData.email}
        `,
      };

      console.log(`Sending email to ${superadmin.email}...`);
      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${superadmin.email}:`, {
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
        });
        return result;
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${superadmin.email}:`, {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response,
          command: emailError.command,
          responseCode: emailError.responseCode,
          stack: emailError.stack,
        });
        throw emailError; // Re-throw to be caught by Promise.allSettled
      }
    });

    console.log('Sending emails to all superadmins...');
    const results = await Promise.allSettled(emailPromises.filter(p => p !== null));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('=== Support Request Email - Summary ===');
    console.log('Support request emails sent:', {
      total: superadmins.length,
      successful,
      failed,
      customerEmail: supportData.email,
    });

    if (failed > 0) {
      console.error('❌ Some support request emails failed to send:', {
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
      console.log('✅ Support request emails sent successfully!');
    }

    return results;
  } catch (error) {
    console.error('❌ Error sending support request email:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      customerEmail: supportData?.email,
      errorDetails: {
        name: error.name,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      },
    });
    // Don't throw error - support form submission should not fail if email fails
    return null;
  } finally {
    console.log('=== Support Request Email - Completed ===');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderNotificationEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendSupportRequestEmail,
  createTransporter,
};

