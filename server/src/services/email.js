// Minimal, provider-agnostic email sender. Uses Resend's HTTP API (no SDK
// needed — it's a plain POST) because it's the simplest to wire up, but
// swapping to Postmark/SES only means changing this one function; nothing
// else in the codebase depends on the provider.
//
// IMPORTANT — this cannot be tested from the sandbox this was built in:
// outbound network access there is restricted to package registries, not
// third-party APIs like api.resend.com. The token-generation, expiry, and
// consumption logic (the actual security-sensitive part) IS tested — see
// server/README.md. Real delivery needs to be verified once deployed with
// a real RESEND_API_KEY.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Openchess <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[email:DEV MODE - no RESEND_API_KEY set] Would send to ${to}: "${subject}"`);
    console.log(html);
    return { delivered: false, devMode: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Email send failed: ${res.status} ${body}`);
  }
  return { delivered: true, devMode: false };
}

export function passwordResetEmail(resetUrl) {
  return {
    subject: 'Reset your Openchess password',
    html: `<p>Someone requested a password reset for your Openchess account.</p>
<p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
  };
}

export function verificationEmail(verifyUrl) {
  return {
    subject: 'Verify your Openchess email',
    html: `<p>Welcome to Openchess! Confirm your email to finish setting up your account.</p>
<p><a href="${verifyUrl}">Click here to verify your email</a>. This link expires in 24 hours.</p>`,
  };
}
