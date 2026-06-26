import type { NextRequest } from 'next/server';

/**
 * True when the request carries a valid admin session cookie. The cookie value
 * is the ADMIN_PASSWORD (set by /api/admin/auth and gated by middleware for
 * /admin pages — but API routes must check it themselves).
 */
export function isAdminRequest(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return req.cookies.get('admin_session')?.value === password;
}
