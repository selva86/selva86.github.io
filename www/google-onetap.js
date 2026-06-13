// Google Identity Services (GIS) + Supabase signInWithIdToken — white-label
// Google sign-in. Google's own rendered button issues an ID token client-side,
// which we exchange via supabase.auth.signInWithIdToken. The consent screen
// shows r-statistics.co with NO "supabase.co" redirect line (the win over the
// hosted signInWithOAuth flow).
//
// Progressive enhancement: the caller keeps its existing signInWithOAuth button
// visible by default and only hides it if mount() resolves true (GIS actually
// rendered). Any failure — GIS blocked, origin not an authorized JS origin in
// the Google Cloud OAuth client, no WebCrypto, offline — resolves false and the
// OAuth button stays. So Google sign-in can never be WORSE than before.
//
// Nonce: GIS is initialized with sha256(rawNonce); Google embeds that hash in
// the ID token; Supabase re-hashes the rawNonce we pass to signInWithIdToken and
// compares. (The Google provider has "Skip nonce checks" off, so this is
// required.)
//
// Load with <script defer src="/www/google-onetap.js?v=1"></script>. Bump ?v=N
// when editing (/www/* is immutable-cached at the edge).
(function () {
  'use strict';

  var GIS_SRC = 'https://accounts.google.com/gsi/client';
  var gisLoading = null;

  function gisReady() {
    return !!(window.google && window.google.accounts && window.google.accounts.id);
  }

  function loadGis() {
    if (gisReady()) return Promise.resolve();
    if (gisLoading) return gisLoading;
    gisLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('gis_load_failed')); };
      document.head.appendChild(s);
    });
    return gisLoading;
  }

  function toHex(bytes) {
    return Array.prototype.map.call(bytes, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  function randomNonce() {
    var a = new Uint8Array(32);
    window.crypto.getRandomValues(a);
    return toHex(a);
  }

  function sha256Hex(str) {
    return window.crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(str))
      .then(function (buf) { return toHex(new Uint8Array(buf)); });
  }

  // mount(opts) -> Promise<boolean>
  // opts:
  //   clientId       : Google OAuth web client id
  //   container      : HTMLElement to render the GIS button into
  //   getSupabase    : () => Promise<SupabaseClient>  (lazy is fine)
  //   onSuccess      : (session) => void   (called after a successful exchange)
  //   onError        : (message) => void
  //   onBeforeSignIn : () => void          (optional; e.g. record newsletter opt-in)
  //   buttonWidth    : number (px, optional)
  function mount(opts) {
    if (!opts || !opts.clientId || !opts.container || typeof opts.getSupabase !== 'function') {
      return Promise.resolve(false);
    }
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.resolve(false); // WebCrypto required for the nonce
    }

    var rawNonce = randomNonce();

    return sha256Hex(rawNonce)
      .then(function (hashedNonce) {
        return loadGis().then(function () {
          if (!gisReady()) return false;

          var handled = false;
          window.google.accounts.id.initialize({
            client_id: opts.clientId,
            nonce: hashedNonce,
            use_fedcm_for_prompt: true,
            callback: function (resp) {
              if (handled) return;
              handled = true;
              if (!resp || !resp.credential) {
                if (opts.onError) opts.onError('No Google credential received. Try again.');
                return;
              }
              if (opts.onBeforeSignIn) { try { opts.onBeforeSignIn(); } catch (_) {} }
              Promise.resolve(opts.getSupabase())
                .then(function (supa) {
                  return supa.auth.signInWithIdToken({
                    provider: 'google',
                    token: resp.credential,
                    nonce: rawNonce,
                  });
                })
                .then(function (r) {
                  if (r && r.error) {
                    handled = false; // allow another attempt
                    if (opts.onError) opts.onError(r.error.message || 'Google sign-in failed.');
                  } else if (opts.onSuccess) {
                    opts.onSuccess(r && r.data ? r.data.session : null);
                  }
                })
                .catch(function (e) {
                  handled = false;
                  if (opts.onError) opts.onError((e && e.message) || 'Google sign-in failed.');
                });
            },
          });

          opts.container.innerHTML = '';
          window.google.accounts.id.renderButton(opts.container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: opts.buttonWidth || undefined,
          });
          return true;
        });
      })
      .catch(function () { return false; });
  }

  window.rsGoogleOneTap = { mount: mount };
})();
