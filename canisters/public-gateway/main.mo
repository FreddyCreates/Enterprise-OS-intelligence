// ───────────────────────────────────────────────────────────────────────────
// PUBLIC GATEWAY CANISTER — stub
//
// Substrate phase B: when the journal is ready to migrate off Cloudflare
// Pages onto the Internet Computer, this canister is the SPINOR target.
//
// Responsibilities (when activated):
//   • Serve the static journal site via certified HTTPS (`http_request`).
//   • Read sanitised content from stable memory.
//   • Anchor every served version to a CHRONO hash for tamper-evidence.
//   • Carry the same doctrine block as the Cloudflare Pages phase —
//     no override, no admin bypass.
//
// This file is intentionally a STUB. It compiles, it returns the doctrine
// block, and it does not yet host the journal. The migration is a SPINOR
// from the Pages substrate to here, executed when the journal is stable.
//
// Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas
// ───────────────────────────────────────────────────────────────────────────

import Time   "mo:base/Time";
import Text   "mo:base/Text";
import Blob   "mo:base/Blob";
import Result "mo:base/Result";

actor PublicGateway {

  // ── DOCTRINE BLOCK ────────────────────────────────────────────────────
  // Read first on every call. Frozen at deployment. Cannot be mutated by
  // any update method in this actor. Mirrors PUBLIC-VIEW-PLAN.md § 3.

  let CREATOR     : Text = "Alfredo Medina Hernandez";
  let AFFILIATION : Text = "Medina Tech · Chaos Lab · Dallas, Texas";
  let MOTTO       : Text = "VIVIT · MEMINIT · DONAT";
  let PRIOR_ART   : Text = "April 2026";
  let SCOPE       : Text =
    "The Journal — papers, mathematics, lexicon, free tools, public schools. " #
    "Not MERIDIAN. Not ORO live feed. Sanitizer-gated. No override.";

  // ── STATE (stable across upgrades) ────────────────────────────────────

  stable var deployedAt : Int = Time.now();
  stable var version    : Text = "0.0.0-stub";

  // ── QUERIES (read-only) ───────────────────────────────────────────────

  public query func doctrine() : async {
    creator       : Text;
    affiliation   : Text;
    motto         : Text;
    priorArt      : Text;
    scope         : Text;
    deployedAt    : Int;
    version       : Text;
  } {
    {
      creator     = CREATOR;
      affiliation = AFFILIATION;
      motto       = MOTTO;
      priorArt    = PRIOR_ART;
      scope       = SCOPE;
      deployedAt  = deployedAt;
      version     = version;
    }
  };

  // Heartbeat readout — matches the 873 ms organism beat shape.
  // Returned as a derived value, never as a faked count.
  public query func heartbeatMs() : async Nat { 873 };

  // ── HTTP gateway (stub) ───────────────────────────────────────────────
  // The full implementation will:
  //   • Stream sanitised HTML/CSS/JS pages from stable memory.
  //   • Return certified responses (ICP HTTP gateway certification).
  //   • Refuse any path that has not been verified by Mundator Cognitus.
  //
  // For now, every HTTP request returns the doctrine block as plain text.

  type HttpRequest = {
    method  : Text;
    url     : Text;
    headers : [(Text, Text)];
    body    : Blob;
  };

  type HttpResponse = {
    status_code : Nat16;
    headers     : [(Text, Text)];
    body        : Blob;
  };

  public query func http_request(_req : HttpRequest) : async HttpResponse {
    let body = Text.encodeUtf8(
      "THE JOURNAL — Public Gateway canister stub\n" #
      "Substrate phase B target. Not yet active.\n\n" #
      "Doctrine:\n" #
      "  Creator:     " # CREATOR     # "\n" #
      "  Affiliation: " # AFFILIATION # "\n" #
      "  Motto:       " # MOTTO       # "\n" #
      "  Prior art:   " # PRIOR_ART   # "\n" #
      "  Scope:       " # SCOPE       # "\n\n" #
      "Live journal currently served at the Cloudflare Pages substrate.\n" #
      "Migration to this canister is a SPINOR — same doctrine, new substrate.\n"
    );
    {
      status_code = 200;
      headers     = [("content-type", "text/plain; charset=utf-8")];
      body        = body;
    }
  };

  // ── UPGRADE HOOKS ─────────────────────────────────────────────────────
  // The doctrine block is constant-folded into the WASM. Upgrades cannot
  // change it without recompiling the actor (which would be visible in the
  // upgrade proposal payload).

  system func preupgrade()  { /* nothing to flush — state is stable */ };
  system func postupgrade() { /* doctrine block is intact by construction */ };
};
