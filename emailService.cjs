const nodemailer = require('nodemailer');

// Email configuration - HOSTINGER SMTP CONFIGURED
const emailConfig = {
  host: 'smtp.hostinger.com',    // Hostinger SMTP server
  port: 465,                     // SSL port
  secure: true,                  // true for 465 (SSL)
  auth: {
    user: 'info@gandhibaideaddictioncenter.com', // Your Hostinger email
    pass: 'Aedentek@123#'                        // Your email password
  },
  tls: {
    rejectUnauthorized: false    // Allow self-signed certificates
  }
};

// Check if email is configured
const isEmailConfigured = emailConfig.auth.user === 'info@gandhibaideaddictioncenter.com' && 
                          emailConfig.auth.pass === 'Aedentek@123#';

let transporter = null;

// Create transporter only if email is configured
if (isEmailConfigured) {
  try {
    transporter = nodemailer.createTransport(emailConfig);
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
  }
}

// Function to send OTP email
async function sendOTPEmail(recipientEmail, otp, userEmail) {
  try {
    // If email is not configured, log to console instead
    if (!isEmailConfigured || !transporter) {
      console.log('\n📧 EMAIL NOT CONFIGURED - OTP LOGGED TO CONSOLE');
      console.log('=' .repeat(50));
      console.log(`📧 To: ${recipientEmail}`);
      console.log(`👤 For User: ${userEmail}`);
      console.log(`🔐 OTP Code: ${otp}`);
      console.log(`⏰ Valid for: 5 minutes`);
      console.log('=' .repeat(50));
      console.log('💡 To enable email: Update credentials in emailService.cjs');
      console.log('💡 Use Hostinger SMTP - see HOSTINGER_SMTP_SETUP.md for details\n');
      
      // Return success for demo purposes
      return { 
        success: true, 
        messageId: 'console-logged',
        fallbackMode: true
      };
    }

    const mailOptions = {
      from: emailConfig.auth.user,
      to: recipientEmail, // aedentek@gmail.com
      subject: 'Password Reset OTP - Gandhi Bai CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Gandhi Bai CRM</h1>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
              A password reset request has been initiated for the user account:
            </p>
            <p style="color: #1f2937; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
              📧 User Email: ${userEmail}
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Please use the following OTP to verify and reset the password:
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="background: #2563eb; color: white; font-size: 32px; font-weight: bold; 
                          padding: 15px 25px; border-radius: 8px; display: inline-block; 
                          letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; font-weight: bold; margin: 0 0 5px 0;">⚠️ Important:</p>
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                This OTP is valid for <strong>5 minutes only</strong>. 
                Do not share this code with anyone.
              </p>
            </div>
          </div>
          
          <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> If you did not request this password reset, 
              please ignore this email and contact your system administrator immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from Gandhi Bai CRM System<br>
              Generated on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email sent successfully to:', recipientEmail);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}

// Test email configuration
async function testEmailConnection() {
  if (!isEmailConfigured || !transporter) {
    console.log('⚠️  Email credentials not configured');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  testEmailConnection,
  isEmailConfigured
};
