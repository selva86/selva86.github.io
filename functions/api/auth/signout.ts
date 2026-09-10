// POST /api/auth/signout
//
// Clears the server-signed identity cookie (`rsc-id`). auth-hydrate.js calls
// this from its sign-out path before clearing the Supabase session locally;
// without it a shared computer would keep serving full Pro lesson pages to
// the next person for the rest of the cookie's life. Clearing needs no auth:
// the only effect is on the caller's own browser.

import { idCookieClearHeader } from "../../_lib/idcookie";

export const onRequestPost: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": idCookieClearHeader(),
      "Cache-Control": "private, no-store",
    },
  });
};
