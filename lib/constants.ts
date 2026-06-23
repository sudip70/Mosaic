// AsyncStorage keys — kept in one place to avoid typos and collisions.
export const ONBOARDING_KEY = 'mosaic_onboarded';

// DEV/TEST ONLY. Skips the email OTP round-trip in the account-upgrade flow so it
// can be exercised without hitting Supabase's email rate limit (no SMTP set up).
// When true the email step goes straight to the profile step and details are
// saved to user_metadata — no email is sent and the session stays anonymous.
// MUST be false in production, where real verification creates the account.
export const BYPASS_OTP = true;
