import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email || 'onboarding@resend.dev'
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #8B3FFF; margin: 0; font-size: 28px;">Storia</h1>
              <p style="color: #6b7280; margin-top: 8px;">AI Video Creator Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Verify your email address</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
              Thanks for signing up! Use the verification code below to complete your registration:
            </p>
            
            <div style="background: linear-gradient(135deg, #8B3FFF 0%, #C944E6 100%); border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${code}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
              This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Storia. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Verify your Storia account',
      html
    });

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #8B3FFF; margin: 0; font-size: 28px;">Storia</h1>
              <p style="color: #6b7280; margin-top: 8px;">AI Video Creator Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Reset your password</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
              We received a request to reset your password. Use the code below to set a new password:
            </p>
            
            <div style="background: linear-gradient(135deg, #8B3FFF 0%, #C944E6 100%); border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${code}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
              This code expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Storia. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Reset your Storia password',
      html
    });

    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #8B3FFF; margin: 0; font-size: 28px;">Storia</h1>
              <p style="color: #6b7280; margin-top: 8px;">AI Video Creator Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Welcome to Storia, ${name}!</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
              Your account has been verified and you're all set to start creating amazing AI-powered videos and stories.
            </p>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">Get started:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Create your first video project</li>
                <li>Generate AI scripts and storyboards</li>
                <li>Publish directly to social media</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Storia. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Welcome to Storia!',
      html
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
