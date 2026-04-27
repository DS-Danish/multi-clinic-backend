import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly senderEmail: string;
  private readonly senderDisplay: string;
  private readonly webAppUrl: string;
  private readonly mobileVerifyUrl: string;

  constructor(private configService: ConfigService) {
    this.senderEmail =
      this.configService.get<string>('EMAIL_USER') || 'dsohail402@gmail.com';
    this.senderDisplay =
      this.configService.get<string>('EMAIL_FROM') ||
      `Multi-Clinic System <${this.senderEmail}>`;
    this.webAppUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    this.mobileVerifyUrl =
      this.configService.get<string>('MOBILE_VERIFY_URL') ||
      'clinicconnect://verify-email';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.senderEmail,
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  private buildVerificationUrl(
    baseUrl: string,
    params: Record<string, string>,
  ) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const query = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');

    return `${baseUrl}${separator}${query}`;
  }

  async sendVerificationEmail(email: string, token: string, name: string) {
    const webVerificationUrl = this.buildVerificationUrl(
      `${this.webAppUrl}/verify-email`,
      { token, email },
    );
    const mobileVerificationUrl = this.buildVerificationUrl(
      this.mobileVerifyUrl,
      { token, email },
    );

    const mailOptions = {
      from: this.senderDisplay,
      to: email,
      subject: 'Verify Your Email - Multi-Clinic System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #4CAF50; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with Multi-Clinic System!</p>
              <p>Please verify your email address before you sign in.</p>
              <div style="text-align: center;">
                <a href="${webVerificationUrl}" class="button">Verify on Web</a>
              </div>
              <p style="margin-top: 24px;">If you registered from the mobile app, use this deep link instead:</p>
              <div style="text-align: center;">
                <a href="${mobileVerificationUrl}" class="button" style="background: #2563eb;">Verify in App</a>
              </div>
              <p>Web verification link:</p>
              <p style="word-break: break-all; color: #666;">${webVerificationUrl}</p>
              <p>Mobile app verification link:</p>
              <p style="word-break: break-all; color: #666;">${mobileVerificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Multi-Clinic System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    const mailOptions = {
      from: this.senderDisplay,
      to: email,
      subject: 'Welcome to Multi-Clinic System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your email has been verified successfully!</p>
              <p>You can now access all features of the Multi-Clinic System.</p>
              <p>Thank you for joining us!</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Multi-Clinic System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
    }
  }

  async sendClinicAdminInvitation(email: string, name: string, clinicName: string, temporaryPassword: string) {
    const loginUrl = `${this.webAppUrl}/login`;

    const mailOptions = {
      from: this.senderDisplay,
      to: email,
      subject: `Invitation: Clinic Admin - ${clinicName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #673AB7; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .credentials { 
              background: white; 
              padding: 15px; 
              border-left: 4px solid #673AB7; 
              margin: 20px 0; 
            }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #673AB7; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { color: #ff5722; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Clinic Admin Invitation</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You have been appointed as the <strong>Clinic Administrator</strong> for:</p>
              <h3 style="color: #673AB7;">${clinicName}</h3>
              
              <p>Your account has been created and verified. You can now log in using the credentials below:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
                <p><strong>Role:</strong> Clinic Admin</p>
              </div>

              <p class="warning">⚠️ Please change your password after your first login for security purposes.</p>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Login Now</a>
              </div>

              <p>As a Clinic Admin, you will have access to:</p>
              <ul>
                <li>Manage clinic information</li>
                <li>Add and manage doctors and receptionists</li>
                <li>View appointments and schedules</li>
                <li>Generate reports</li>
              </ul>

              <p>If you have any questions, please contact the system administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Multi-Clinic System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Clinic admin invitation sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send clinic admin invitation to ${email}:`, error);
      throw error;
    }
  }
}
