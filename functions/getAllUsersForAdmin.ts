import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (user?.email !== "pateld0514@gmail.com") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL users using service role
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    console.log(`[Admin] Fetched ${users.length} users`);

    return Response.json(users);

  } catch (error) {
    console.error('Get users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});