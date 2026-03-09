import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import twilio from 'npm:twilio@4.23.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber } = await req.json();
    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const digits = String(phoneNumber).replace(/\D/g, '');
    if (digits.length !== 10) {
      return Response.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    }

    const formattedNumber = `+1${digits}`;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Clean up any existing codes for this phone number
    const existing = await base44.asServiceRole.entities.PhoneVerification.filter({ phone_number: formattedNumber });
    for (const rec of existing) {
      await base44.asServiceRole.entities.PhoneVerification.delete(rec.id);
    }

    // Store the new code
    await base44.asServiceRole.entities.PhoneVerification.create({
      phone_number: formattedNumber,
      code,
      expiry_date: expiryDate,
      verified: false
    });

    // Send SMS via Twilio
    const client = twilio(Deno.env.get('TWILIO_ACCOUNT_SID'), Deno.env.get('TWILIO_AUTH_TOKEN'));
    await client.messages.create({
      body: `Your EVNT verification code is: ${code}. Valid for 10 minutes.`,
      from: Deno.env.get('TWILIO_PHONE_NUMBER'),
      to: formattedNumber
    });

    console.log(`Verification code sent to ${formattedNumber} for user ${user.email}`);
    return Response.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('sendVerificationCode error:', error?.message || String(error));
    return Response.json({ error: error?.message || 'Failed to send verification code' }, { status: 500 });
  }
});