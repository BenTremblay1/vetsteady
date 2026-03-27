/**
 * Resend email integration
 *
 * Thin wrapper around Resend API for sending appointment reminder emails.
 * We keep it simple — plain text with inline HTML for now.
 * Future: HTML templates with practice branding.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reminders@vetsteady.com';

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailReminder(
  options: SendEmailOptions
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        text: options.body,
        // Simple HTML version: line breaks preserved
        html: `<pre style="font-family: sans-serif; white-space: pre-wrap; font-size:15px; line-height:1.6;">${options.body}</pre>`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as any)?.message ?? `Resend API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown Resend error' };
  }
}
