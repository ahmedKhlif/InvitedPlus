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

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping verification email.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
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

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping password reset email.');
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
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

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
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

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
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
}
