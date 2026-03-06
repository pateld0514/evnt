import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const demoEmails = [
      { email: 'evnttestblank@gmail.com', role: 'user' },
      { email: 'evnttestvendor@gmail.com', role: 'user' },
      { email: 'evnttestclient@gmail.com', role: 'user' },
    ];

    const results = [];
    for (const { email, role } of demoEmails) {
      try {
        await base44.users.inviteUser(email, role);
        results.push({ email, status: 'invited' });
      } catch (e) {
        results.push({ email, status: 'already exists or failed', error: e.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});