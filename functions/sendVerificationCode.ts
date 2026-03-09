import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import twilio from 'npm:twilio@4.23.0';

const RATE_LIMIT_SECONDS = 60;
const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber } = await req.json();
    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const digits = String(phoneNumber).replace(/\D/g, '');
    if (digits.length !== 10) {
      return Response.json({ error: 'Please enter a valid 10-digit US phone number' }, { status: 400 });
    }

    const formattedNumber = `+1${digits}`;

    // Rate limiting — check if a code was sent recently
    const existing = await base44.asServiceRole.entities.PhoneVerification.filter({ phone_number: formattedNumber });
    if (existing && existing.length > 0) {
      const rec = existing[0];
      const createdAt = new Date(rec.created_date).getTime();
      const secondsAgo = (Date.now() - createdAt) / 1000;

      if (secondsAgo < RATE_LIMIT_SECONDS) {
        const wait = Math.ceil(RATE_LIMIT_SECONDS - secondsAgo);
        return Response.json({
          error: `Please wait ${wait} second${wait !== 1 ? 's' : ''} before requesting another code.`,
          retryAfter: wait
        }, { status: 429 });
      }

      // Clean up old code
      await base44.asServiceRole.entities.PhoneVerification.delete(rec.id);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.PhoneVerification.create({
      phone_number: formattedNumber,
      code,
      expiry_date: expiryDate,
      verified: false,
      attempts: 0
    });

    // Send professional branded SMS
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    console.log(`[sendVerificationCode] Using FROM: ${fromNumber} | ACCOUNT: ${accountSid?.substring(0,10)}...`);
    
    if (!accountSid || !authToken || !fromNumber) {
      console.error('[sendVerificationCode] MISSING Twilio credentials!', { accountSid: !!accountSid, authToken: !!authToken, fromNumber: !!fromNumber });
      return Response.json({ error: 'SMS service not configured' }, { status: 500 });
    }
    
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: `EVNT Security Code: ${code}\n\nUse this code to verify your phone number. It expires in 10 minutes.\n\nDo not share this code with anyone. EVNT will never ask for it.`,
      from: fromNumber,
      to: formattedNumber
    });

    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || 'NOT_SET';
    console.log(`[sendVerificationCode] Twilio SID: ${message.sid} | Status: ${message.status} | To: ${formattedNumber} | From: ${fromNumber} | User: ${user.email}`);
    return Response.json({ success: true, message: 'Verification code sent' });

  } catch (error) {
    console.error('[sendVerificationCode] Error:', error?.message || String(error));
    return Response.json({ error: error?.message || 'Failed to send verification code' }, { status: 500 });
  }
});