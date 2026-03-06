import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bugData = await req.json();

    // Validate required fields
    if (!bugData.description || !bugData.reporter_email) {
      return Response.json({ 
        error: 'Description and reporter email are required' 
      }, { status: 400 });
    }

    // Store bug report in database
    const bugReport = await base44.asServiceRole.entities.BugReport.create({
      reporter_email: bugData.reporter_email,
      reporter_name: bugData.reporter_name || bugData.reporter_email,
      user_type: bugData.user_type || 'client',
      description: bugData.description,
      current_page_url: bugData.current_page_url || 'Unknown',
      browser_info: bugData.browser_info || 'Unknown',
      screenshot_url: bugData.screenshot_url || null,
      status: 'open',
    });

    // Send email notification to support team
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000; border-bottom: 3px solid #000; padding-bottom: 10px;">
          🐛 New Bug Report Submitted
        </h2>
        
        <div style="background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #000;">Reporter Information</h3>
          <p><strong>Name:</strong> ${bugData.reporter_name || 'Unknown'}</p>
          <p><strong>Email:</strong> ${bugData.reporter_email}</p>
          <p><strong>User Type:</strong> ${bugData.user_type || 'client'}</p>
          <p><strong>Report ID:</strong> ${bugReport.id}</p>
        </div>

        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Issue Description</h3>
          <p style="white-space: pre-wrap;">${bugData.description}</p>
        </div>

        <div style="background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #000;">Technical Details</h3>
          <p><strong>Page URL:</strong> ${bugData.current_page_url || 'Unknown'}</p>
          <p><strong>Browser Info:</strong> ${bugData.browser_info || 'Unknown'}</p>
          ${bugData.screenshot_url ? `<p><strong>Screenshot:</strong> <a href="${bugData.screenshot_url}" target="_blank">View Screenshot</a></p>` : ''}
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
          </p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com',
      from_name: 'EVNT Bug Reports',
      subject: `🐛 Bug Report from ${bugData.reporter_name || bugData.reporter_email} [${bugReport.id.substring(0, 8)}]`,
      body: emailContent
    });

    return Response.json({ 
      success: true, 
      bug_report_id: bugReport.id,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Submit bug report error:', error);
    return Response.json({ 
      error: error.message || 'Failed to submit bug report' 
    }, { status: 500 });
  }
});