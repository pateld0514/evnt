/**
 * Centralized admin authorization check
 * This is the SINGLE SOURCE OF TRUTH for admin access
 * Never use direct email checks or inline role checks
 */
export function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return true;
}

export function isAdmin(user) {
  return user && user.role === 'admin';
}