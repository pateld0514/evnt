import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneNumber, code } = await req.json();
    if (!phoneNumber || !code) {
      return Response.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    const digits = String(phoneNumber).replace(/\D/g, '');
    const formattedNumber = `+1${digits}`;

    const records = await base44.asServiceRole.entities.PhoneVerification.filter({ phone_number: formattedNumber });
    if (!records || records.length === 0) {
      return Response.json({ error: 'No verification code found. Please request a new code.' }, { status: 400 });
    }

    const record = records[0];

    // Check expiry
    if (new Date() > new Date(record.expiry_date)) {
      await base44.asServiceRole.entities.PhoneVerification.delete(record.id);
      return Response.json({ error: 'Code has expired. Please request a new code.' }, { status: 400 });
    }

    // Check code match
    if (record.code !== String(code).trim()) {
      return Response.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Mark phone as verified on the user's profile
    await base44.auth.updateMe({ phone_verified: true });

    // Cleanup the verification record
    await base44.asServiceRole.entities.PhoneVerification.delete(record.id);

    console.log(`Phone ${formattedNumber} verified for user ${user.email}`);
    return Response.json({ success: true, message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('verifyPhoneNumber error:', error?.message || String(error));
    return Response.json({ error: error?.message || 'Failed to verify code' }, { status: 500 });
  }
});