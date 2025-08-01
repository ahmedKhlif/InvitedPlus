import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('Email service not configured. Email features will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log('Email service initialized successfully');
  }

  async testEmailConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Email service not configured. Please check SMTP settings.'
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email service is working correctly!'
      };
    } catch (error) {
      this.logger.error('Email service test failed:', error);
      return {
        success: false,
        message: `Email service test failed: ${error.message}`
      };
    }
  }

  async sendTestEmail(email: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping test email.');
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: 'Test Email - Invited+ Platform',
      html: this.getTestEmailTemplate(),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Test email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send test email to ${email}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping verification email.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'https://invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app');
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: 'Verify Your Email - Invited+',
      html: this.getVerificationEmailTemplate(verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendVerificationCodeEmail(email: string, name: string, code: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping verification code email.');
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: 'Your Verification Code - Invited+',
      html: this.getVerificationCodeEmailTemplate(name, code),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification code email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification code email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping password reset email.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'https://invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: 'Reset Your Password - Invited+',
      html: this.getPasswordResetEmailTemplate(resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendEventInvitation(email: string, eventTitle: string, inviteCode: string, organizerName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping event invitation email.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'https://invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app');
    const inviteUrl = `${appUrl}/invite/${inviteCode}`;

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: `You're Invited: ${eventTitle}`,
      html: this.getEventInvitationTemplate(eventTitle, inviteUrl, organizerName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Event invitation sent to ${email} for event: ${eventTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send event invitation to ${email}:`, error);
      throw error;
    }
  }

  async sendTaskAssignmentNotification(email: string, taskTitle: string, eventTitle: string, assignerName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping task assignment notification.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'https://invited-plus-2aeamn7kp-ahmed-khlifs-projects.vercel.app');
    const dashboardUrl = `${appUrl}/dashboard`;

    const mailOptions = {
      from: this.configService.get<string>('FROM_EMAIL', 'noreply@invitedplus.com'),
      to: email,
      subject: `New Task Assigned: ${taskTitle}`,
      html: this.getTaskAssignmentTemplate(taskTitle, eventTitle, assignerName, dashboardUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Task assignment notification sent to ${email} for task: ${taskTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send task assignment notification to ${email}:`, error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Invited+!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for Invited+. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with Invited+, you can safely ignore this email.</p>
            <p>&copy; 2025 Invited+. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Invited+ account. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This password reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Invited+. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getEventInvitationTemplate(eventTitle: string, inviteUrl: string, organizerName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
          </div>
          <div class="content">
            <h2>${eventTitle}</h2>
            <p>Hi there!</p>
            <p>${organizerName} has invited you to join <strong>${eventTitle}</strong> on Invited+.</p>
            <p>Click the button below to view the event details and RSVP:</p>
            <a href="${inviteUrl}" class="button">View Event & RSVP</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          </div>
          <div class="footer">
            <p>Powered by Invited+ - Smart Event Management</p>
            <p>&copy; 2025 Invited+. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTaskAssignmentTemplate(taskTitle: string, eventTitle: string, assignerName: string, dashboardUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Task Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assignment</h1>
          </div>
          <div class="content">
            <h2>${taskTitle}</h2>
            <p>Hi there!</p>
            <p>${assignerName} has assigned you a new task for the event <strong>${eventTitle}</strong>.</p>
            <p><strong>Task:</strong> ${taskTitle}</p>
            <p>Click the button below to view the task details and manage your assignments:</p>
            <a href="${dashboardUrl}" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>Powered by Invited+ - Smart Event Management</p>
            <p>&copy; 2025 Invited+. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTestEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email - Invited+</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Service Test</h1>
          </div>
          <div class="content">
            <div class="success">
              <strong>✅ Success!</strong> Your email service is working correctly.
            </div>
            <h2>Invited+ Email Service</h2>
            <p>This is a test email to verify that your SMTP configuration is working properly.</p>
            <p><strong>Email service features:</strong></p>
            <ul>
              <li>✅ Email verification for new users</li>
              <li>✅ Password reset functionality</li>
              <li>✅ Event invitations</li>
              <li>✅ Task assignment notifications</li>
              <li>✅ System announcements</li>
            </ul>
            <p>If you received this email, your email service is configured correctly and ready for production use!</p>
          </div>
          <div class="footer">
            <p>Powered by Invited+ - Smart Event Management</p>
            <p>&copy; 2025 Invited+. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationCodeEmailTemplate(name: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification Code - Invited+</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .code-container { background: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .verification-code { font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .code-label { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
          .footer { text-align: center; padding: 30px; background: #f8f9fa; color: #666; font-size: 14px; }
          .highlight { color: #007bff; font-weight: bold; }
          .steps { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps ol { margin: 0; padding-left: 20px; }
          .steps li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
            <p style="margin: 0; opacity: 0.9;">Welcome to Invited+</p>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Thank you for signing up for <strong>Invited+</strong>! To complete your registration and secure your account, please verify your email address using the code below:</p>

            <div class="code-container">
              <div class="code-label">Your Verification Code</div>
              <div class="verification-code">${code}</div>
            </div>

            <div class="steps">
              <h3>How to verify your email:</h3>
              <ol>
                <li>Go back to the verification page</li>
                <li>Enter the <span class="highlight">6-digit code</span> above</li>
                <li>Click "Verify Email" to complete your registration</li>
              </ol>
            </div>

            <div class="warning">
              <strong>⏰ Important:</strong> This verification code will expire in <strong>15 minutes</strong> for security reasons. If it expires, you can request a new code.
            </div>

            <p><strong>Why verify your email?</strong></p>
            <ul>
              <li>🔒 Secure your account</li>
              <li>📧 Receive important notifications</li>
              <li>🎫 Get event invitations</li>
              <li>📋 Receive task assignments</li>
              <li>🔄 Enable password recovery</li>
            </ul>

            <p>If you didn't create an account with Invited+, please ignore this email.</p>
          </div>
          <div class="footer">
            <p><strong>Invited+</strong> - Smart Event Management Platform</p>
            <p>&copy; 2025 Invited+. All rights reserved.</p>
            <p style="font-size: 12px; margin-top: 15px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
