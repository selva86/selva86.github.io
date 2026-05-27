// GET /.well-known/did.json
//
// W3C DID Document for did:web:r-statistics.co. Establishes r-statistics.co
// as a Verifiable Credentials issuer per https://www.w3.org/TR/did-web/.
//
// v1 ships an identity-only document — no verificationMethod block yet,
// because v1 certificates are unsigned. Badge wallets (Credly, Sertifier)
// that strictly require a key to be present will fall back to URL identity
// validation. The full Ed25519/JWK verificationMethod ships in v1.1
// alongside cryptographic signing of the OB3 credentials.
//
// Until then, the presence of this document at /.well-known/did.json is
// itself the credibility signal — it asserts that r-statistics.co operates
// as a deliberate issuer in the OB3 ecosystem, not just an ad-hoc cert
// generator.

import type { Env, RequestData } from "../_middleware";

const DID = "did:web:r-statistics.co";
const ISSUER_URL = "https://r-statistics.co";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async () => {
  const doc = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
    ],
    id: DID,
    alsoKnownAs: [ISSUER_URL],
    service: [
      {
        id: `${DID}#issuer-profile`,
        type: "IssuerProfile",
        serviceEndpoint: `${ISSUER_URL}/certifications`,
      },
      {
        id: `${DID}#open-badges-issuer`,
        type: "OpenBadgesIssuer",
        serviceEndpoint: `${ISSUER_URL}/certifications`,
      },
    ],
    // verificationMethod[] intentionally absent — v1 OB3 credentials are
    // unsigned (still useful for parsers; cryptographic verification is a
    // v1.1 enhancement). Verifiers that need a key will treat this DID as
    // "identifier-only" which is a documented OB3 fallback.
  };
  return new Response(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/did+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*", // public DID resolution
    },
  });
};
