/**
 * Public portfolio demo. When `DEMO_MODE=1`, the login wall is lifted: `/`
 * becomes a landing page with a "Try the calculator" button, and every
 * account route (login, signup, konto) redirects away. Set only on the demo
 * Vercel project — the production deployment keeps per-person login.
 */
export const DEMO_MODE = process.env.DEMO_MODE === '1';
