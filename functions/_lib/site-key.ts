// This site's key in the Supabase project it shares with machinelearningplus.com
// (site key "mlplus"). Magic-link signups carry it as user_metadata.site, the
// auth webhook mirrors and notifies only this tag, and an untagged account
// (Google, GitHub, one-tap) is claimed with it on its first authenticated
// request here (functions/_lib/signup-site.ts). Also written to
// users.signup_site. The browser copies live in www/signin-modal.js and
// signin.html. Never change it: it is stored in Supabase and in D1.
export const SITE_KEY = "rstatistics";
