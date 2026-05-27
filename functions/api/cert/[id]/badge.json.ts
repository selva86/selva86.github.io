// GET /api/cert/<public_id>/badge.json
//
// Returns the certificate as an Open Badges 3.0 / Verifiable Credentials
// JSON-LD document. Spec: https://www.imsglobal.org/spec/ob/v3p0/
//
// v1 ships UNSIGNED (no proof block). Resume parsers, badge wallets like
// Credly, and AI tools can still ingest the structured metadata. v1.1 adds
// did:web signing with /.well-known/did.json publishing the public key.
//
// Public endpoint — no auth — same accessibility model as the verify HTML
// page at /cert/<public_id>. Returns 404 if status != 'active'.

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError } from "../../../_lib/errors";
import { getCertificateByPublicId } from "../../../_lib/db";
import {
  getTrack, getIssuer, isValidPublicId,
} from "../../../_lib/tracks";

interface OBSkill {
  type: "Skill";
  name: string;
  proficiency?: string;
}

export const onRequestGet: PagesFunction<Env, "id", RequestData> = async (context) => {
  const publicId = decodeURIComponent(context.params.id as string);
  if (!isValidPublicId(publicId)) return jsonError(404, "not_found", "Certificate not found");

  const cert = await getCertificateByPublicId(context.env.DB, publicId);
  if (!cert) return jsonError(404, "not_found", "Certificate not found");
  if (cert.status !== "active") {
    return jsonError(404, "not_found", "Certificate not found");
  }

  const issuer = getIssuer();
  const track = getTrack(cert.track);
  const origin = new URL(context.request.url).origin;
  const verifyUrl = `${origin}/cert/${cert.public_id}`;
  const issuedAtIso = new Date(cert.issued_at * 1000).toISOString();

  const skills: OBSkill[] = (() => {
    try {
      const parsed = cert.skills_json ? JSON.parse(cert.skills_json) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: { name?: string; level?: string }) => ({
        type: "Skill" as const,
        name: s?.name || "",
        ...(s?.level ? { proficiency: s.level } : {}),
      }));
    } catch { return []; }
  })();

  const evidence: Array<{ id: string; type: string; name: string }> =
    (() => {
      try {
        const arr = cert.evidence_json ? JSON.parse(cert.evidence_json) : [];
        if (!Array.isArray(arr)) return [];
        return arr.map((url: string) => ({
          id: url.startsWith("http") ? url : `${origin}${url}`,
          type: "Evidence",
          name: "Exercise hub completed as part of this certification",
        }));
      } catch { return []; }
    })();

  const credential = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: verifyUrl,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: issuer.id,
      type: ["Profile"],
      name: issuer.name,
      url: issuer.url,
      email: issuer.email,
      image: { id: issuer.image, type: "Image" },
      description: issuer.description,
    },
    validFrom: issuedAtIso,
    name: `${cert.track_name} Certificate`,
    credentialSubject: {
      type: ["AchievementSubject"],
      // No globally-resolvable DID for the learner; use the verify URL as a
      // stable identifier instead. Avoids leaking the internal user UUID.
      id: verifyUrl + "#subject",
      name: cert.recipient_name || "Learner",
      achievement: {
        id: `${issuer.url}/certifications#${cert.track}`,
        type: ["Achievement"],
        name: cert.track_name,
        description: track?.description || "",
        criteria: {
          narrative:
            `Recipient solved at least ${Math.ceil((track?.threshold || 0.8) * 100)}% of ` +
            `the exercises across the curated set of hubs that define the ` +
            `${cert.track_name} track on r-statistics.co.`,
        },
        ...(skills.length ? {
          tag: skills.map(s => s.name),
          relatedSkill: skills,
        } : {}),
      },
      ...(evidence.length ? { evidence } : {}),
    },
    // Verifiability v1: certificate identity + content hash (public_id +
    // issuedAt) acts as integrity check. Full cryptographic proof block
    // (Ed25519 over JCS-normalised JSON) ships in v1.1 once did:web is set
    // up at /.well-known/did.json.
  };

  return json(credential);
};
