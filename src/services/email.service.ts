import AWS from 'aws-sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

AWS.config.update({
  region: config.ses.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

export class EmailService {
  async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      const params: AWS.SES.SendEmailRequest = {
        Source: `${config.ses.fromName} <${config.ses.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            Text: text
              ? {
                  Data: text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      };

      const result = await ses.sendEmail(params).promise();

      logger.info('Email sent', {
        to,
        subject,
        messageId: result.MessageId,
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to,
        subject,
      });
      throw error;
    }
  }

  async sendReceiptEmail(
    to: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    paidAt: Date,
    pdfUrl?: string
  ) {
    const subject = `Receipt for Invoice ${invoiceNumber}`;
    const formattedAmount = (amount / 100).toFixed(2);
    const formattedDate = paidAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .invoice-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .amount { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Receipt</h1>
            </div>
            <div class="content">
              <p>Thank you for your payment!</p>
              <div class="invoice-details">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> <span class="amount">${currency.toUpperCase()} ${formattedAmount}</span></p>
                <p><strong>Payment Date:</strong> ${formattedDate}</p>
              </div>
              ${
                pdfUrl
                  ? `<p style="text-align: center;">
                       <a href="${pdfUrl}" class="button">Download Receipt PDF</a>
                     </p>`
                  : ''
              }
              <p>If you have any questions about this receipt, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Checklist App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Payment Receipt

Thank you for your payment!

Invoice Number: ${invoiceNumber}
Amount Paid: ${currency.toUpperCase()} ${formattedAmount}
Payment Date: ${formattedDate}

${pdfUrl ? `Download Receipt: ${pdfUrl}` : ''}

If you have any questions about this receipt, please contact our support team.
    `;

    return this.sendEmail(to, subject, html, text);
  }

  async sendInviteEmail(
    to: string,
    organizationName: string,
    inviterName: string,
    inviteUrl: string
  ) {
    const subject = `You've been invited to join ${organizationName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Checklist App.</p>
              <p>Click the button below to accept the invitation and get started:</p>
              <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Checklist App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
You're Invited!

${inviterName} has invited you to join ${organizationName} on Checklist App.

Accept the invitation: ${inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.
    `;

    return this.sendEmail(to, subject, html, text);
  }

  async sendSubscriptionConfirmation(
    to: string,
    organizationName: string,
    planName: string,
    amount: number,
    currency: string
  ) {
    const subject = `Subscription Confirmed: ${planName}`;
    const formattedAmount = (amount / 100).toFixed(2);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .plan-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Confirmed!</h1>
            </div>
            <div class="content">
              <p>Great news! Your subscription has been successfully activated.</p>
              <div class="plan-details">
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Monthly Charge:</strong> ${currency.toUpperCase()} ${formattedAmount}</p>
              </div>
              <p>You now have access to all the features included in your plan.</p>
              <p>Thank you for choosing Checklist App!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Checklist App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Subscription Confirmed!

Great news! Your subscription has been successfully activated.

Organization: ${organizationName}
Plan: ${planName}
Monthly Charge: ${currency.toUpperCase()} ${formattedAmount}

You now have access to all the features included in your plan.

Thank you for choosing Checklist App!
    `;

    return this.sendEmail(to, subject, html, text);
  }
}

export const emailService = new EmailService();
