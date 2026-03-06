import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Utility function to check if user is admin
// Can be invoked from frontend or other backend functions
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        isAdmin: false,
        authenticated: false
      });
    }

    // Check admin status: either hardcoded admin email OR admin role
    const isAdmin = user.role === "admin";

    return Response.json({
      isAdmin,
      authenticated: true,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    return Response.json({ 
      isAdmin: false,
      authenticated: false,
      error: error.message 
    }, { status: 500 });
  }
});