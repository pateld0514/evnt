import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { business_name, category, contact_email, location, years_in_business, average_price, willing_to_travel } = payload;

    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    if (!adminEmail) {
      return Response.json({ error: 'ADMIN_EMAIL not configured' }, { status: 500 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'EVNT System',
      subject: '🔔 New Vendor Registration - Approval Required',
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .info-box { background: #fff; border: 2px solid #000; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>New Vendor Registration</h1></div>
    <div class="content">
      <p>A new vendor has registered and requires your approval:</p>
      <div class="info-box">
        <strong>Business:</strong> ${business_name}<br/>
        <strong>Category:</strong> ${category}<br/>
        <strong>Email:</strong> ${contact_email}<br/>
        <strong>Location:</strong> ${location}<br/>
        <strong>Experience:</strong> ${years_in_business} years<br/>
        <strong>Average Price:</strong> $${average_price}<br/>
        <strong>Willing to Travel:</strong> ${willing_to_travel ? 'Yes' : 'No'}
      </div>
      <p>Please log in to the admin dashboard to review and approve/reject this vendor.</p>
    </div>
  </div>
</body>
</html>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});