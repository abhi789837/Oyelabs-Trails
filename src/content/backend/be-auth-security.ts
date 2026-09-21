import type { Module } from "@/types/curriculum";

// ---- Test data for the JWT claim-validation challenge ----
const JWT_NOW = 1790000000;
const jwtOptions = {
  now: JWT_NOW,
  algorithms: ["RS256", "ES256"],
  issuer: "https://auth.oyelabs.dev",
  audience: "orders-api",
  clockToleranceSec: 0,
};
const jwtGood = { iss: "https://auth.oyelabs.dev", sub: "user_42", aud: "orders-api", iat: JWT_NOW - 60, exp: JWT_NOW + 600 };

// ---- Test data for the RBAC/ABAC policy evaluator challenge ----
const invoicePolicies = [
  { effect: "allow", roles: ["admin"], actions: ["*"], resources: ["*"] },
  { effect: "allow", roles: ["accountant"], actions: ["invoice:*"], resources: ["invoice/*"] },
  { effect: "allow", roles: ["viewer"], actions: ["invoice:read"], resources: ["invoice/*"] },
  { effect: "allow", roles: ["*"], actions: ["invoice:read", "invoice:pay"], resources: ["invoice/*"], conditions: { ownerOnly: true } },
  { effect: "allow", roles: ["manager"], actions: ["invoice:approve"], resources: ["invoice/*"], conditions: { sameDepartment: true, maxAmount: 10000 } },
  { effect: "deny", roles: ["*"], actions: ["invoice:approve"], resources: ["invoice/*"], conditions: { ownerOnly: true } },
  { effect: "deny", roles: ["*"], actions: ["invoice:delete"], resources: ["invoice/*"] },
];
const invoice42 = { type: "invoice", id: "42", ownerId: "u_alice", department: "sales", amount: 2500 };
const alice = { id: "u_alice", roles: [] };
const bobViewer = { id: "u_bob", roles: ["viewer"] };
const accountant = { id: "u_acc", roles: ["accountant"] };
const salesManager = { id: "u_mgr", roles: ["manager"], department: "sales" };
const admin = { id: "u_root", roles: ["admin"] };

export default {
  id: "be-auth-security",
  trackId: "backend",
  name: "Authentication & Security",
  description:
    "How backends prove who is calling and decide what they may do: password storage, sessions and JWTs, OAuth 2.0 and OpenID Connect, refresh token rotation, access-control models, CORS, rate limiting and the OWASP API Security Top 10. Written against current guidance (RFC 9700, the OAuth 2.1 draft, NIST SP 800-63B-4, OWASP 2023/2025) for engineers who have shipped auth and want to know where it breaks.",
  refs: [
    { label: "OWASP: Top Ten project", url: "https://owasp.org/projects/top-ten", kind: "docs" },
    { label: "OWASP: API Security Top 10 (2023)", url: "https://api-security.owasp.org/editions/2023/en/0x11-t10/", kind: "spec" },
    { label: "OWASP: Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/", kind: "docs" },
    { label: "RFC 9700: Best Current Practice for OAuth 2.0 Security", url: "https://www.rfc-editor.org/rfc/rfc9700.html", kind: "spec" },
  ],
  topics: [
    {
      id: "auth-password-hashing",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "Password Hashing with bcrypt & Argon2",
      summary:
        "Password hashing is for the day your database leaks. Encryption is the wrong tool, because whoever steals the key decrypts every password, and fast hashes like SHA-256 are wrong too: one GPU tries billions of guesses per second, so most human-chosen passwords fall within hours. Password hashes are deliberately slow and tunable, and each embeds a unique random salt, so identical passwords hash differently and every account must be cracked separately.\n\nOWASP's current order is Argon2id (at least 19 MiB of memory, 2 iterations, parallelism 1), then scrypt, then bcrypt for legacy systems only (cost 10 or more), with PBKDF2-HMAC-SHA256 at 600,000 iterations when FIPS-140 compliance is required. Memory-hardness is the point of Argon2id and scrypt: GPUs and ASICs have plenty of compute but little fast memory per parallel lane, so making each guess touch megabytes of RAM cuts an attacker's parallelism. The encoded hash records its parameters (`$argon2id$v=19$m=19456,t=2,p=1$...`), so you can rehash at the next successful login when you raise the cost.\n\nThe edges are where teams get hurt. Classic bcrypt, including Node's `bcrypt` package, silently ignores everything after 72 bytes (Go's and pyca/bcrypt 5 reject longer input), and multibyte UTF-8 reaches that sooner. The naive fix, `bcrypt(sha256(pw))` with a raw digest, can hit a null byte and enables password shucking; OWASP suggests bcrypt over a base64-encoded HMAC keyed with a pepper. A pepper is a secret shared by all hashes and kept outside the database (a vault or HSM), so a SQL-injection dump alone can't be cracked. In Node, native `bcrypt` and `argon2` run on libuv's four-thread pool, so a login burst also stalls file and DNS work. NIST SP 800-63B-4 sets policy: 15+ characters for single-factor passwords, blocklist checks, and no composition rules or forced rotation.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", kind: "docs" },
        { label: "RFC 9106: Argon2 Memory-Hard Function for Password Hashing", url: "https://www.rfc-editor.org/rfc/rfc9106.html", kind: "spec" },
        { label: "NIST SP 800-63B-4: Authentication and Authenticator Management", url: "https://pages.nist.gov/800-63-4/sp800-63b.html", kind: "spec" },
      ],
      video: {
        title: "Password Storage Tier List: encryption, hashing, salting, bcrypt, and beyond",
        channel: "Studying With Alex",
        url: "https://www.youtube.com/watch?v=qgpsIBLvrGY",
        videoId: "qgpsIBLvrGY",
        durationLabel: "10:16",
      },
      alternateVideos: [
        {
          title: "20. Backend Security: Everything You Need to Know",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=xB1C1xZZW4k",
          videoId: "xB1C1xZZW4k",
          durationLabel: "2:50:02",
          startSeconds: 2725,
          chapterLabel: "Authentication Security & Password Storage",
        },
        {
          title: "Adding Salt to Hashing: A Better Way to Store Passwords",
          channel: "OktaDev",
          url: "https://www.youtube.com/watch?v=aXHmUHPXwb4",
          videoId: "aXHmUHPXwb4",
          durationLabel: "18:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-password-hashing-q1",
          prompt: "A service stores `sha256(salt + password)` with a unique random salt per user. Why is that still considered weak password storage?",
          options: [
            "SHA-256 is fast, so an attacker with the dump can test billions of guesses per second against each hash",
            "SHA-256 has practical collisions, so two passwords can produce the same hash",
            "The salts are stored next to the hashes, which makes the salting pointless",
            "SHA-256 output can be reversed with enough compute to recover the password",
          ],
          correctIndex: 0,
          explanation:
            "Salts stop precomputed tables and force per-account work, but they don't slow down a single guess. Password hashing needs a deliberately expensive function (Argon2id, scrypt, bcrypt, PBKDF2). Salts aren't secret, and SHA-256 has no practical collisions or inversion.",
        },
        {
          id: "auth-password-hashing-q2",
          prompt:
            "Two users pick 80-character ASCII passphrases whose first 72 characters are identical and whose endings differ. Both are hashed with Node's `bcrypt` package. What happens at login?",
          options: [
            "Each user can log in with the other's passphrase, because only the first 72 bytes are used",
            "The hashes differ because each has its own salt, so each passphrase only works for its own account",
            "The package hashes long inputs with SHA-512 first, so all 80 characters count",
            "The second user can't sign up, because the two passwords produce identical hashes",
          ],
          correctIndex: 0,
          explanation:
            "Node's `bcrypt`, like the original OpenBSD implementation, silently ignores bytes after the 72nd. The salts make the stored hashes differ, but verifying against either account's salt uses the same 72 bytes, so both passphrases work. Newer libraries such as Go's `x/crypto/bcrypt` and pyca/bcrypt 5 reject longer input instead; either way, enforce a byte limit or use Argon2id.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-password-hashing-q3",
          prompt: "Which statements about password salts are true? (Select all that apply.)",
          options: [
            "Each password gets its own random salt",
            "The salt is stored alongside the hash (usually inside the encoded hash string)",
            "Salts make precomputed rainbow tables useless",
            "Salts must be kept secret, like an encryption key",
            "A salt makes a single guess against one hash slower",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A salt only has to be unique, so it's stored in the clear with the hash and forces attackers to attack each hash separately. It adds no cost per guess (that's the work factor's job), and a secret shared value is a pepper, not a salt.",
        },
        {
          id: "auth-password-hashing-q4",
          prompt: "Which attack does a pepper defend against that per-user salts don't?",
          options: [
            "An attacker who dumped the users table through SQL injection but can't read the application's secrets vault",
            "An attacker running an online brute-force attack against the login form",
            "A phishing page that captures passwords as users type them",
            "An attacker with root access to the application servers",
          ],
          correctIndex: 0,
          explanation:
            "The pepper lives outside the database, so hashes from a database-only leak can't be tested offline without it. It does nothing against online guessing or phishing, and an attacker on the app servers can read the pepper too.",
        },
        {
          id: "auth-password-hashing-q5",
          prompt: "Why do Argon2id and scrypt make offline cracking more expensive than PBKDF2 at a similar CPU cost?",
          options: [
            "Each guess must fill and read megabytes of memory, and GPUs and ASICs have far less fast memory per parallel lane than compute",
            "They mix secret internal constants into each hash, and attackers can't obtain those constants",
            "They produce much longer hashes, and comparing long hashes is what slows attackers down",
            "Their reference implementations detect GPUs and refuse to run on them",
          ],
          correctIndex: 0,
          explanation:
            "Memory-hardness caps how many guesses an attacker can run in parallel on specialized hardware. PBKDF2 only costs CPU iterations, which GPUs parallelize cheaply; nothing about the output length or the algorithm's constants is secret.",
        },
        {
          id: "auth-password-hashing-q6",
          prompt: "You raise bcrypt's cost from 10 to 12. How do existing users end up with cost-12 hashes?",
          options: [
            "On each successful login, verify against the stored hash (its cost is encoded in it), then rehash the password at cost 12 and save it",
            "Change the cost in config; existing hashes are verified at cost 12 from then on",
            "Force every user to reset their password, because cost-10 hashes stop verifying",
            "Decrypt the old hashes with the old cost and re-encrypt them with the new one",
          ],
          correctIndex: 0,
          explanation:
            "Verification always uses the cost stored in the hash, so old hashes keep working, and the plaintext is only available at login. Hashes can't be decrypted; accounts that never log in can be expired or wrapped in a stronger hash.",
        },
        {
          id: "auth-password-hashing-q7",
          prompt:
            "Your login endpoint answers \"invalid credentials\" in about 2 ms for unknown emails and about 250 ms for known emails with a wrong password. What's the problem?",
          options: [
            "The timing difference lets attackers enumerate which emails have accounts; run the hash against a dummy hash for unknown users so both paths cost the same",
            "Nothing: the error message is identical, so nothing leaks",
            "The hash is too slow and should be replaced with SHA-256 to make both paths fast",
            "Unknown emails should return 404 so clients can tell the difference honestly",
          ],
          correctIndex: 0,
          explanation:
            "Identical messages don't help when the response time reveals whether a password hash was computed. Equalize the work (hash against a fixed dummy hash) and keep the generic message; weakening the hash trades one problem for a worse one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-password-hashing-q8",
          prompt: "Which requirements come from NIST SP 800-63B-4 for passwords? (Select all that apply.)",
          options: [
            "Passwords used as a single factor must be at least 15 characters",
            "New passwords must be checked against a blocklist of common or compromised values",
            "Verifiers must not force users to change passwords periodically without evidence of compromise",
            "Passwords must mix upper case, lower case, digits and symbols",
            "Passwords must be no longer than 16 characters",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Revision 4 sets 15 characters for single-factor passwords (8 when part of MFA), requires blocklist checks and bans both composition rules and scheduled rotation. It says verifiers should permit at least 64 characters, the opposite of a low maximum.",
        },
        {
          id: "auth-password-hashing-q9",
          prompt:
            "To get around bcrypt's 72-byte limit, a team stores `bcrypt(sha256(password))`, passing the raw 32-byte digest to bcrypt. What's wrong with it?",
          options: [
            "A raw digest can contain a `0x00` byte, and C-style bcrypt stops at the first null, so some passwords hash as a short or empty string",
            "A SHA-256 digest is longer than 72 bytes, so it's truncated anyway",
            "Pre-hashing replaces bcrypt's salt, so identical passwords get identical hashes",
            "bcrypt rejects binary input with an error, so every login fails",
          ],
          correctIndex: 0,
          explanation:
            "OWASP warns about exactly this: null bytes collapse the effective input, and a plain unkeyed pre-hash also enables password shucking with hashes leaked elsewhere. Its recommended form is bcrypt over a base64-encoded HMAC-SHA384 keyed with a pepper. A SHA-256 digest is 32 bytes, well under the limit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-password-hashing-q10",
          prompt:
            "A Node service uses the native `argon2` package's async `hash()` and `verify()`. During a login spike, unrelated `fs.readFile` calls and outbound HTTP requests to hostnames slow down. Why?",
          options: [
            "The hashes run on libuv's threadpool (4 threads by default), which file system calls and `dns.lookup()` share",
            "Argon2 blocks the main thread, so every callback waits",
            "Argon2 allocates memory from the same heap as `fs`, which runs out",
            "HTTP requests are serialized behind any in-flight crypto operation by design",
          ],
          correctIndex: 0,
          explanation:
            "Native async hashing libraries queue work on the libuv threadpool, where it competes with fs and hostname resolution. The main thread stays free, which is why CPU on the event loop looks fine. Size `UV_THREADPOOL_SIZE` at startup or move hashing to a dedicated service.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "auth-sessions-vs-jwt",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "Sessions vs JWTs: The Real Tradeoffs",
      summary:
        "A server-side session is an opaque random ID in a cookie, pointing at state you keep in Redis or a database. A JWT is the state itself: base64url-encoded claims plus a signature that any service holding the key can verify without a lookup. Sessions revoke instantly (delete the row) and stay tiny, but need a shared store. JWTs verify locally, which suits distributed systems and third-party access tokens, but you can't un-issue one: logout, a password change or a ban all wait for `exp` unless you add a denylist, which is a session store by another name. The usual compromise is a 5 to 15 minute access token plus a revocable refresh token. Either way, issue a fresh session ID or token at login to prevent session fixation.\n\nWhere the credential lives matters more than its format. A token in `localStorage` is readable by any script, so one XSS bug ships it to an attacker who replays it from anywhere until it expires. An `HttpOnly; Secure; SameSite` cookie can't be read by script: XSS can still act while the victim's tab is open, but can't steal the credential. Cookies bring CSRF back into scope, which `SameSite` and anti-CSRF tokens handle. JWT payloads are signed, not encrypted, so never put secrets or sensitive personal data in them.\n\nMost JWT breaches are validation bugs, not crypto breaks. RFC 8725 has the verifier, not the token, choose the algorithm: accepting `alg: none`, or letting an attacker switch RS256 to HS256 so the server uses its RSA public key as an HMAC secret, lets anyone forge tokens. Check `exp` and `nbf` with a small clock-skew leeway, match `iss` exactly, and require `aud` (a string or an array) to name your service, so a token minted for another API can't be replayed against yours.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "RFC 8725: JSON Web Token Best Current Practices", url: "https://www.rfc-editor.org/rfc/rfc8725.html", kind: "spec" },
        { label: "OWASP: JSON Web Token Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", kind: "docs" },
        { label: "OWASP: Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", kind: "docs" },
        { label: "PortSwigger: JWT algorithm confusion attacks", url: "https://portswigger.net/web-security/jwt/algorithm-confusion", kind: "article" },
      ],
      video: {
        title: "Session Vs JWT: The Differences You May Not Know!",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=fyTxwIa-1U0",
        videoId: "fyTxwIa-1U0",
        durationLabel: "6:59",
      },
      alternateVideos: [
        {
          title: "20. Backend Security: Everything You Need to Know",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=xB1C1xZZW4k",
          videoId: "xB1C1xZZW4k",
          durationLabel: "2:50:02",
          startSeconds: 4037,
          chapterLabel: "Session Management & Cookie Security",
        },
        {
          title: "JWT - JSON Web Token Crash Course (NodeJS & Postgres)",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=T0k-3Ze4NLo",
          videoId: "T0k-3Ze4NLo",
          durationLabel: "57:01",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `validateJwtClaims(header, payload, options)`: the checks a resource server must run on a JWT after decoding it. Assume the signature has already been verified with the key registered for `header.alg`; your job is the part libraries leave to configuration and teams forget.\n\nReturn `{ valid: true }`, or `{ valid: false, error }` for the first failing check, in this order:\n\n- `alg_not_allowed`: `header.alg` must be a string listed in `options.algorithms` (exact, case-sensitive). `none` is refused in any casing, even if someone put it in the list.\n- `malformed`: `payload` must be a non-null object that isn't an array.\n- `missing_exp`: `payload.exp` must be present.\n- `malformed`: `exp`, and `nbf` when present, must be finite numbers (NumericDate, seconds since the epoch). A numeric string such as `\"1790000600\"` is malformed.\n- `expired`: reject when `options.now >= exp + tolerance`, where the tolerance is `options.clockToleranceSec` (0 when absent). RFC 7519 says the current time must be before `exp`.\n- `not_yet_valid`: when `nbf` is present, reject when `options.now + tolerance < nbf`.\n- `invalid_issuer`: `payload.iss` must equal `options.issuer` exactly.\n- `invalid_audience`: `payload.aud` must be a string equal to `options.audience`, or an array containing it. A missing `aud` is invalid.\n\n`options.now` is in seconds. Don't mutate the inputs.",
        starterCode: "/**\n * Validate the header and claims of a JWT whose signature has already been checked.\n * @param {{ alg?: string, typ?: string }} header decoded JOSE header\n * @param {Record<string, unknown>} payload decoded claims\n * @param {{ now: number, algorithms: string[], issuer: string, audience: string, clockToleranceSec?: number }} options\n * @returns {{ valid: true } | { valid: false, error: string }}\n */\nfunction validateJwtClaims(header, payload, options) {\n  // Your code here\n}\n",
        functionName: "validateJwtClaims",
        testCases: [
          { description: "a well-formed token for this API is valid", args: [{ alg: "RS256", typ: "JWT" }, jwtGood, jwtOptions], expected: { valid: true } },
          { description: "`alg: none` is rejected", args: [{ alg: "none" }, jwtGood, jwtOptions], expected: { valid: false, error: "alg_not_allowed" }, isEdgeCase: true },
          {
            description: "`none` is rejected in any casing, even when it's in the allow-list",
            args: [{ alg: "NoNe" }, jwtGood, { ...jwtOptions, algorithms: ["RS256", "NoNe"] }],
            expected: { valid: false, error: "alg_not_allowed" },
            isEdgeCase: true,
          },
          {
            description: "HS256 is rejected when only RS256 and ES256 are allowed (algorithm confusion)",
            args: [{ alg: "HS256" }, jwtGood, jwtOptions],
            expected: { valid: false, error: "alg_not_allowed" },
            isEdgeCase: true,
          },
          { description: "a missing `alg` is rejected", args: [{ typ: "JWT" }, jwtGood, jwtOptions], expected: { valid: false, error: "alg_not_allowed" } },
          {
            description: "`exp` equal to `now` is already expired",
            args: [{ alg: "RS256" }, { ...jwtGood, exp: JWT_NOW }, jwtOptions],
            expected: { valid: false, error: "expired" },
            isEdgeCase: true,
          },
          {
            description: "expired 30 s ago is still accepted with 60 s of leeway",
            args: [{ alg: "RS256" }, { ...jwtGood, exp: JWT_NOW - 30 }, { ...jwtOptions, clockToleranceSec: 60 }],
            expected: { valid: true },
          },
          {
            description: "expired exactly 60 s ago is rejected with 60 s of leeway",
            args: [{ alg: "RS256" }, { ...jwtGood, exp: JWT_NOW - 60 }, { ...jwtOptions, clockToleranceSec: 60 }],
            expected: { valid: false, error: "expired" },
            isEdgeCase: true,
          },
          {
            description: "`nbf` 30 s in the future is accepted with 60 s of leeway",
            args: [{ alg: "ES256" }, { ...jwtGood, nbf: JWT_NOW + 30 }, { ...jwtOptions, clockToleranceSec: 60 }],
            expected: { valid: true },
          },
          {
            description: "`nbf` 61 s in the future isn't valid yet with 60 s of leeway",
            args: [{ alg: "ES256" }, { ...jwtGood, nbf: JWT_NOW + 61 }, { ...jwtOptions, clockToleranceSec: 60 }],
            expected: { valid: false, error: "not_yet_valid" },
          },
          {
            description: "`aud` as an array that includes this API is valid",
            args: [{ alg: "RS256" }, { ...jwtGood, aud: ["billing-api", "orders-api"] }, jwtOptions],
            expected: { valid: true },
          },
          {
            description: "a token minted for another API is rejected",
            args: [{ alg: "RS256" }, { ...jwtGood, aud: ["billing-api"] }, jwtOptions],
            expected: { valid: false, error: "invalid_audience" },
          },
          {
            description: "a missing `aud` is rejected",
            args: [{ alg: "RS256" }, { iss: "https://auth.oyelabs.dev", sub: "user_42", exp: JWT_NOW + 600 }, jwtOptions],
            expected: { valid: false, error: "invalid_audience" },
            isEdgeCase: true,
          },
          {
            description: "issuer comparison is exact: a trailing slash doesn't match",
            args: [{ alg: "RS256" }, { ...jwtGood, iss: "https://auth.oyelabs.dev/" }, jwtOptions],
            expected: { valid: false, error: "invalid_issuer" },
            isEdgeCase: true,
          },
          {
            description: "a token without `exp` is rejected",
            args: [{ alg: "RS256" }, { iss: "https://auth.oyelabs.dev", aud: "orders-api", sub: "user_42" }, jwtOptions],
            expected: { valid: false, error: "missing_exp" },
          },
          {
            description: "`exp` as a numeric string is malformed",
            args: [{ alg: "RS256" }, { ...jwtGood, exp: String(JWT_NOW + 600) }, jwtOptions],
            expected: { valid: false, error: "malformed" },
            isEdgeCase: true,
          },
          { description: "a null payload is malformed", args: [{ alg: "RS256" }, null, jwtOptions], expected: { valid: false, error: "malformed" }, isEdgeCase: true },
          {
            description: "checks run in order: an expired token with the wrong issuer reports `expired`",
            args: [{ alg: "RS256" }, { ...jwtGood, exp: JWT_NOW - 5, iss: "https://evil.example" }, jwtOptions],
            expected: { valid: false, error: "expired" },
          },
        ],
      },
    },
    {
      id: "auth-oauth2-oidc",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "OAuth 2.0 & OpenID Connect Flows",
      summary:
        "OAuth 2.0 is delegated authorization: a client gets an access token from an authorization server and calls an API on a user's behalf without ever seeing the user's password. It says nothing about who the user is. OpenID Connect adds that: the same flow with the `openid` scope also returns an ID token, a signed JWT addressed to the client whose claims (`iss`, `sub`, `nonce`, `auth_time`) say who logged in. Mixing them up causes real bugs: the access token is for the API and opaque to the client, while the ID token is for the client and must never be sent to an API as a bearer credential.\n\nRFC 9700 (the OAuth 2.0 Security Best Current Practice, January 2025) and the still-draft OAuth 2.1 shrink the menu of grants. Use the authorization code grant with PKCE for every client: the client sends a hash (`S256`) of a one-time `code_verifier` with the authorization request and the verifier itself when redeeming the code, so a code intercepted by a malicious app or leaked in logs is useless. The implicit grant is deprecated and the password grant must not be used; OAuth 2.1 drops both. Machine-to-machine calls use client credentials, and TVs and CLIs use the device flow. Redirect URIs must match exactly, since prefix matching or an open redirector hands codes to attackers.\n\n`state` ties the callback to the browser session that started the flow (CSRF protection, which PKCE also provides); `nonce` ties the ID token to that login so it can't be replayed or injected. Scopes limit what the client may do for the user; they don't replace your API's object-level checks. For browser apps handling business or personal data, RFC 10017 (August 2026) strongly recommends a backend-for-frontend that keeps tokens server-side.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "RFC 9700: Best Current Practice for OAuth 2.0 Security", url: "https://www.rfc-editor.org/rfc/rfc9700.html", kind: "spec" },
        { label: "IETF draft: The OAuth 2.1 Authorization Framework", url: "https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/", kind: "spec" },
        { label: "OpenID Connect Core 1.0", url: "https://openid.net/specs/openid-connect-core-1_0.html", kind: "spec" },
        { label: "OAuth.com: PKCE (Proof Key for Code Exchange)", url: "https://www.oauth.com/oauth2-servers/pkce/", kind: "article" },
      ],
      video: {
        title: "An Illustrated Guide to OAuth and OpenID Connect",
        channel: "OktaDev",
        url: "https://www.youtube.com/watch?v=t18YB3xDfXI",
        videoId: "t18YB3xDfXI",
        durationLabel: "16:35",
      },
      alternateVideos: [
        {
          title: "OAuth is Broken Without This | Meet PKCE",
          channel: "ByteMonk",
          url: "https://www.youtube.com/watch?v=5FrA0UzV1Aw",
          videoId: "5FrA0UzV1Aw",
          durationLabel: "10:00",
        },
        {
          title: "ID Tokens vs Access Tokens  - Do you know the difference?!",
          channel: "Auth0",
          url: "https://www.youtube.com/watch?v=M4JIvUIE17c",
          videoId: "M4JIvUIE17c",
          durationLabel: "8:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-oauth2-oidc-q1",
          prompt: "What attack does PKCE stop in the authorization code flow?",
          options: [
            "Whoever intercepts the authorization code (a malicious app, a leaked log) can't redeem it without the `code_verifier`",
            "A script injected into the page (XSS) can no longer read the access token",
            "The authorization code is encrypted, so it can travel over plain HTTP",
            "Users can no longer be phished, because the login page must prove its identity",
          ],
          correctIndex: 0,
          explanation:
            "PKCE binds the code to the client instance that started the flow: only the holder of the original verifier can exchange it. It doesn't protect tokens already in the page from XSS, doesn't replace TLS and does nothing about phishing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-oauth2-oidc-q2",
          prompt: "Why should clients use the `S256` code challenge method instead of `plain`?",
          options: [
            "With `plain`, anyone who can read the authorization request (proxy logs, browser history) sees the verifier itself",
            "`S256` produces a shorter challenge, which keeps authorization URLs under length limits",
            "`plain` is only allowed for confidential clients, which can keep the verifier secret",
            "`S256` encrypts the authorization code, so it can't be read in the redirect",
          ],
          correctIndex: 0,
          explanation:
            "With `S256` the request carries only a SHA-256 hash of the verifier, so observing it doesn't let an attacker redeem a stolen code. RFC 9700 says to use methods that don't expose the verifier, and the OAuth 2.1 draft removes `plain`.",
        },
        {
          id: "auth-oauth2-oidc-q3",
          prompt: "Which statements about ID tokens and access tokens are true? (Select all that apply.)",
          options: [
            "An ID token's `aud` claim contains the client's `client_id`",
            "An API should reject an ID token presented as a bearer token",
            "A client should treat the access token as opaque, even if it happens to be a JWT",
            "ID tokens are meant to be sent to APIs to prove who the user is",
            "Access tokens are always JWTs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The ID token is addressed to the client, so an API seeing one is seeing a token minted for someone else. Access tokens are for the resource server; they may be opaque reference tokens, and clients shouldn't depend on their format.",
        },
        {
          id: "auth-oauth2-oidc-q4",
          prompt: "Why is the implicit grant (`response_type=token`) deprecated?",
          options: [
            "Access tokens returned in the URL can leak (history, referrers, extensions), can be injected, and can't be sender-constrained",
            "It requires a client secret in the browser, where any user can read it",
            "It can't request scopes, so every token it issues has the user's full access",
            "It only works with SAML identity providers, not with OpenID Connect",
          ],
          correctIndex: 0,
          explanation:
            "RFC 9700 says clients should not use it because tokens in the authorization response are exposed and replayable. The code flow with PKCE returns tokens from the token endpoint instead. Implicit never used a client secret, which is part of why it was chosen for SPAs in the first place.",
        },
        {
          id: "auth-oauth2-oidc-q5",
          prompt:
            "A mobile app implements \"Sign in with a provider\" by sending the provider's access token to your backend. The backend calls the provider's userinfo endpoint with it and logs in whoever it names. What's the flaw?",
          options: [
            "An access token issued to any other app works too, so a malicious app can sign in as its users; validate an ID token whose `aud` is your client ID",
            "Nothing: the provider signed the access token, so it proves who the user is",
            "The userinfo endpoint is rate-limited, so logins will fail under heavy load",
            "Access tokens expire within minutes, which is too short to back a login session",
          ],
          correctIndex: 0,
          explanation:
            "An access token proves the bearer may call the provider's API, not that it was issued to your app. This substitution attack is why OpenID Connect exists: the ID token names its audience, and your backend must check it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-oauth2-oidc-q6",
          prompt: "Which pairing of parameter and purpose is correct?",
          options: [
            "`state` binds the callback to the browser session that started the flow; `nonce` binds the ID token to that authentication request",
            "`state` carries the user's ID; `nonce` carries the access token's expiry",
            "`state` prevents ID token replay; `nonce` prevents CSRF on the redirect",
            "`state` and `nonce` are interchangeable names for the same value",
          ],
          correctIndex: 0,
          explanation:
            "`state` is round-tripped through the redirect so the client can reject callbacks it didn't initiate (CSRF). The provider copies `nonce` into the ID token so the client can reject tokens minted for a different login. The third option swaps them.",
        },
        {
          id: "auth-oauth2-oidc-q7",
          prompt: "An authorization server accepts any `redirect_uri` that starts with `https://app.example.com`. How can an attacker abuse it?",
          options: [
            "Register `https://app.example.com.attacker.net` or chain an open redirect on the app's domain, and receive victims' authorization codes",
            "They can't: the prefix guarantees the domain belongs to the app",
            "They can only change which page of the app the user lands on",
            "They can read the client secret, which is sent along with the redirect",
          ],
          correctIndex: 0,
          explanation:
            "String-prefix matching accepts attacker-controlled hosts and paths, and codes travel in the redirect's query string. RFC 9700 requires exact string matching (with a port exception for native apps' localhost redirects).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-oauth2-oidc-q8",
          prompt: "A nightly job calls your billing API with no user involved. Which grant fits?",
          options: ["Client credentials", "Authorization code with PKCE", "Resource owner password credentials", "Implicit"],
          correctIndex: 0,
          explanation:
            "Client credentials authenticates the client itself for machine-to-machine access. The code flow needs a user at a browser, the password grant is forbidden by RFC 9700, and implicit is deprecated.",
        },
        {
          id: "auth-oauth2-oidc-q9",
          prompt: "Why does RFC 10017 (OAuth 2.0 for Browser-Based Applications) favor the backend-for-frontend (BFF) pattern?",
          options: [
            "The BFF is a confidential client that keeps tokens server-side, and the browser holds only an `HttpOnly` session cookie that scripts can't read",
            "It lets the SPA keep using the implicit grant, since the BFF hides the tokens in the URL fragment",
            "It removes the need for CORS and CSRF protection, since all requests become same-origin",
            "Browsers can't make cross-origin requests to token endpoints, so a server has to do it",
          ],
          correctIndex: 0,
          explanation:
            "With a BFF, XSS can still act through the user's session while the page is open, but it can't exfiltrate tokens to use elsewhere. The cookie-based session still needs CSRF defenses, and the implicit grant stays deprecated.",
        },
        {
          id: "auth-oauth2-oidc-q10",
          prompt: "An access token with scope `invoices:read` arrives at `GET /invoices/981`. Is the API's authorization check done once it confirms the scope?",
          options: [
            "No: the scope limits what the client may do for the user, but the API must still check that this user may read invoice 981",
            "Yes: the authorization server already approved the request",
            "Yes, as long as the token's signature and expiry are valid",
            "No: the API must also ask the authorization server to re-approve each request",
          ],
          correctIndex: 0,
          explanation:
            "Scopes are coarse, client-level consent. Skipping the per-object check is exactly broken object level authorization (API1:2023). The API doesn't need a round trip per request, just its own ownership check.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-oauth2-oidc-q11",
          prompt: "Which checks are part of validating an OpenID Connect ID token? (Select all that apply.)",
          options: [
            "Verify the signature with the provider's published key",
            "Check that `iss` is the expected provider",
            "Check that `aud` contains its own `client_id`",
            "Check that `nonce` matches the value it sent in the authentication request",
            "Check that `scope` includes `admin`",
            "Check that the token contains the user's password hash",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "OIDC Core's validation steps cover issuer, audience, expiry, nonce and the signature (a code-flow client that got the token straight from the token endpoint over TLS may rely on TLS instead of checking the signature). ID tokens carry no scope claim for authorization and certainly no password material.",
        },
        {
          id: "auth-oauth2-oidc-q12",
          prompt:
            "A first-party mobile app wants its own native login form that posts the username and password to the token endpoint (the password grant). What's the current guidance?",
          options: [
            "RFC 9700 says the password grant must not be used; use the authorization code flow with PKCE in the system browser",
            "It's acceptable for first-party apps because the app is trusted",
            "It's acceptable as long as the request uses HTTPS",
            "It's acceptable if refresh tokens are disabled",
          ],
          correctIndex: 0,
          explanation:
            "The password grant exposes credentials to the client, trains users to type passwords into apps, and can't support MFA or passkeys. Being first-party doesn't change that, and OAuth 2.1 omits the grant entirely.",
        },
      ],
    },
    {
      id: "auth-refresh-token-rotation",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "Refresh Token Rotation & Reuse Detection",
      summary:
        "Short-lived access tokens limit the damage of a leak, but nobody wants to log in every ten minutes. Refresh tokens bridge the gap: a long-lived credential, sent only to the authorization server, that mints new access tokens, which makes it the most valuable thing to steal. RFC 9700 requires refresh tokens issued to public clients (SPAs, mobile apps) to be either sender-constrained (bound to a key with DPoP or mutual TLS) or rotated.\n\nRotation means every refresh returns a new refresh token and invalidates the old one, while the server remembers the lineage, often called a token family. Its real value is reuse detection. If a thief and the legitimate client hold the same token, whoever uses it second presents an already-used token. The server can't tell which party is which, so it revokes the whole family: the attacker's copy dies, and the real user signs in again. Rotation without family tracking just hands the attacker a fresh token whenever they refresh first.\n\nImplementations break in predictable places. Two tabs, or a retry after a timeout, can legitimately replay the previous token, so providers offer a short grace (reuse) interval, a deliberate hole to keep small, and clients should share a single in-flight refresh. The swap must be atomic: claim the old token with a conditional update (`UPDATE ... WHERE used_at IS NULL`) and proceed only if a row changed, or two concurrent refreshes both succeed. Store tokens hashed; they're random and high-entropy, so a fast hash suffices. Give each family an absolute lifetime and an idle timeout, revoke it on logout and password change, and in browsers keep the token in an `HttpOnly`, `Secure` cookie scoped to the refresh path, or server-side behind a backend-for-frontend.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "RFC 9700: Refresh Token Protection (Section 4.14)", url: "https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14", kind: "spec" },
        { label: "Auth0 Docs: Refresh Token Rotation", url: "https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation", kind: "docs" },
        { label: "OWASP: OAuth 2.0 Protocol Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html", kind: "docs" },
        { label: "RFC 10017: OAuth 2.0 for Browser-Based Applications", url: "https://www.rfc-editor.org/rfc/rfc10017.html", kind: "spec" },
      ],
      video: {
        title: "Refresh Token Rotation and Reuse Detection in Node.js JWT Authentication",
        channel: "Dave Gray",
        url: "https://www.youtube.com/watch?v=s-4k5TcGKHg",
        videoId: "s-4k5TcGKHg",
        durationLabel: "35:07",
      },
      alternateVideos: [
        {
          title: "What are Refresh Tokens?! and...How to Use Them Securely",
          channel: "Auth0",
          url: "https://www.youtube.com/watch?v=EIYCJKR0I_g",
          videoId: "EIYCJKR0I_g",
          durationLabel: "19:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-refresh-token-rotation-q1",
          prompt:
            "Refresh token R1 is stolen. The attacker refreshes first and receives R2. Later the legitimate client presents R1. With rotation and reuse detection, what happens?",
          options: [
            "The server sees R1 was already used, revokes the whole family including R2, and both parties must re-authenticate",
            "The server issues the legitimate client R3, and the attacker keeps R2",
            "The server rejects R1 but leaves R2 working, because R2 is the newest token",
            "The server can tell the attacker used R1 first and revokes only the attacker's tokens",
          ],
          correctIndex: 0,
          explanation:
            "Reuse of an invalidated token proves the family is compromised, but the server can't tell who is legitimate, so it kills every descendant. That's the trade: the real user logs in again, and the attacker's R2 dies with the family.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-refresh-token-rotation-q2",
          prompt: "In the same scenario, what does rotation achieve if the server does NOT track token families?",
          options: [
            "Very little: R1 is rejected, but nothing revokes R2, so the attacker keeps refreshing while the real user just gets errors",
            "It still stops the attacker, because R2 expires as soon as R1 is presented again",
            "It prevents the theft itself, since a rotated token is useless once it has been copied",
            "It makes R1 valid again for both parties until the next rotation",
          ],
          correctIndex: 0,
          explanation:
            "Without lineage, the server only knows R1 is used, not which live tokens descend from it. Reuse detection needs the relationship that RFC 9700 says the server must retain.",
        },
        {
          id: "auth-refresh-token-rotation-q3",
          prompt:
            "Two browser tabs notice an expired access token and both call the refresh endpoint with the same refresh token at the same moment. Rotation is strict, with no grace period. What happens?",
          options: [
            "One refresh succeeds, the other looks like reuse, the family is revoked and the user is logged out",
            "Both tabs get new tokens, because they asked at the same time",
            "The server queues the second request until the first completes, then returns the same new token",
            "Nothing: tabs share one refresh token, so only one request is ever sent",
          ],
          correctIndex: 0,
          explanation:
            "Legitimate concurrency is indistinguishable from theft under strict one-time use. The fixes are client-side (a single shared in-flight refresh, for example with a lock or BroadcastChannel) and a short server-side reuse interval.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-refresh-token-rotation-q4",
          prompt:
            "What's wrong with this refresh handler?\n\n```js\nconst row = await db.refreshTokens.findOne({ hash: sha256(token) });\nif (!row || row.usedAt) return reuseDetected(row);\nconst next = await issueTokens(row.familyId);\nawait db.refreshTokens.update({ id: row.id }, { usedAt: new Date() });\nreturn next;\n```",
          options: [
            "Two concurrent requests can both read `usedAt` as empty and both get new tokens; mark it used with a conditional update and continue only if exactly one row changed",
            "SHA-256 is too fast for refresh tokens; the lookup should use bcrypt, like passwords do",
            "It should delete the old row instead of setting `usedAt`, to keep the table small",
            "`issueTokens` should run after the update, purely to save a database round trip",
          ],
          correctIndex: 0,
          explanation:
            "Check-then-act across two statements is a race, so rotation silently becomes \"two valid tokens\". `UPDATE ... SET used_at = now() WHERE id = $1 AND used_at IS NULL` makes the claim atomic. Deleting the row would also destroy the lineage needed for reuse detection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-refresh-token-rotation-q5",
          prompt: "Which are sound places to keep a refresh token in a browser-based app? (Select all that apply.)",
          options: [
            "An `HttpOnly`, `Secure`, `SameSite` cookie whose `Path` is limited to the refresh endpoint",
            "Server-side in a backend-for-frontend, with the browser holding only a session cookie",
            "`localStorage`, namespaced per user so other scripts on the domain can't find it",
            "`sessionStorage`, which is wiped as soon as the tab is closed",
            "A cookie without `HttpOnly`, so the SPA can attach it to requests itself",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Both good options keep the token out of reach of page scripts. Web Storage and non-`HttpOnly` cookies are readable by any script, so a single XSS exfiltrates a long-lived credential.",
        },
        {
          id: "auth-refresh-token-rotation-q6",
          prompt: "Why store refresh tokens hashed, and why is SHA-256 acceptable here when it isn't for passwords?",
          options: [
            "A database leak would otherwise hand out live credentials; tokens are random with 128+ bits of entropy, so brute-forcing even a fast hash is infeasible",
            "Hashing makes tokens shorter; SHA-256 is fine because tokens expire",
            "Hashing is required by the JWT specification; SHA-256 is the only allowed algorithm",
            "Hashing lets the server read the user ID from the token; SHA-256 is reversible",
          ],
          correctIndex: 0,
          explanation:
            "Slow hashes exist to protect low-entropy human secrets. A server-generated random token can't be guessed, so a fast hash protects it just as well without burning CPU on every refresh.",
        },
        {
          id: "auth-refresh-token-rotation-q7",
          prompt: "What does RFC 9700 require for refresh tokens issued to public clients?",
          options: [
            "They must be sender-constrained (for example with DPoP or mTLS) or use refresh token rotation",
            "They must be JWTs signed with an asymmetric algorithm such as RS256",
            "They must expire within 24 hours of being issued, whatever else happens",
            "Public clients must never be issued refresh tokens at all",
          ],
          correctIndex: 0,
          explanation:
            "Section 2.2.2 gives exactly those two options, because a public client has no secret to prove the token is being used by the right party. It sets no format or fixed lifetime, and it doesn't forbid refresh tokens for public clients.",
        },
        {
          id: "auth-refresh-token-rotation-q8",
          prompt: "You cut access-token lifetime from 60 minutes to 5. What gets better, and what gets worse?",
          options: [
            "A stolen access token is useful for at most 5 minutes, but refresh traffic and dependence on the authorization server's availability grow",
            "Nothing changes security-wise, because access tokens are validated on every request",
            "Revocation becomes instant, and nothing gets worse",
            "Logout stops working, because tokens expire before the user clicks it",
          ],
          correctIndex: 0,
          explanation:
            "Short lifetimes bound the replay window of an unrevocable token but move load and availability risk to the refresh path. It's still not instant revocation: a stolen token works until it expires.",
        },
        {
          id: "auth-refresh-token-rotation-q9",
          prompt: "A user clicks \"log out\" in an app that uses JWT access tokens. The client deletes both tokens locally. Which statement is still true?",
          options: [
            "A stolen copy of the access token stays valid until `exp` unless the API checks a denylist, so the server should also revoke the refresh family",
            "Every copy of the access token is now invalid, because the client deleted it",
            "The refresh token stays usable, but only from the browser that logged out",
            "Deleting the tokens locally also revokes them at the authorization server",
          ],
          correctIndex: 0,
          explanation:
            "Self-contained tokens can't be recalled by deleting the client's copy. Logout should call the revocation endpoint (RFC 7009) or an equivalent, killing the refresh family, and accept that outstanding access tokens live until they expire.",
        },
        {
          id: "auth-refresh-token-rotation-q10",
          prompt: "Which limits belong on a refresh token family? (Select all that apply.)",
          options: [
            "An absolute maximum lifetime after which the user must re-authenticate",
            "An idle timeout if the family hasn't been used for a while",
            "Revocation when the user changes their password",
            "No expiry at all, as long as it keeps rotating",
            "Extending the absolute lifetime on every rotation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rotation limits replay, not lifetime: a family that renews forever keeps a stolen session alive forever. RFC 9700 suggests expiry after inactivity and revocation on security events such as password change or logout.",
        },
      ],
    },
    {
      id: "auth-rbac-abac",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "Role-Based & Attribute-Based Access Control",
      summary:
        "Authentication tells you who is calling; authorization decides what they may do, and it's where most API breaches live: broken object level and function level authorization are API1 and API5 in OWASP's API Security Top 10. The models are ways of writing the rules down. RBAC grants permissions to roles and roles to users (`accountant` may `invoice:read`), which is easy to audit and matches how organizations think, but it only answers \"can this kind of user do this kind of thing?\". It can't say \"only their own invoices\" or \"only in their department\", so teams either explode into roles like `sales-emea-manager` or scatter `if (invoice.ownerId === user.id)` through handlers, and the one handler that forgets is your BOLA.\n\nABAC evaluates policies over attributes of the subject, the resource, the action and the context (owner, department, amount, time, network), so ownership and limits become policy instead of ad hoc code; NIST SP 800-162 is the reference model. ReBAC, popularized by Google's Zanzibar paper and implemented by OpenFGA and SpiceDB, derives access from relationships in a graph (editor of a folder that contains this document), which fits sharing-heavy products. Real systems mix them: roles for coarse permissions, attributes and relationships for object-level checks.\n\nThe engineering rules matter more than the acronym. Deny by default: no matching allow means no access. Let an explicit deny override any allow, as AWS IAM does, so separation-of-duties rules (\"managers can't approve their own expenses\") can't be bypassed by some other grant. Fail closed on anything the evaluator doesn't understand. Enforce on the server for every request and every object, ideally in one policy layer rather than per handler, and never infer permission from what the UI hides. Watch the attribute pitfalls: `undefined === undefined` is `true`, so a missing department can \"match\" another missing department.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "OWASP: Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", kind: "docs" },
        {
          label: "AWS IAM: Policy evaluation logic",
          url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
          kind: "docs",
        },
        { label: "NIST SP 800-162: Guide to Attribute Based Access Control", url: "https://csrc.nist.gov/pubs/sp/800/162/upd2/final", kind: "spec" },
        {
          label: "Google Research: Zanzibar, Google's Consistent, Global Authorization System",
          url: "https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/",
          kind: "article",
        },
      ],
      video: {
        title: "Role-based access control (RBAC) vs. Attribute-based access control (ABAC)",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=rvZ35YW4t5k",
        videoId: "rvZ35YW4t5k",
        durationLabel: "7:39",
      },
      alternateVideos: [
        {
          title: "How To Handle Permissions Like A Senior Dev",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=5GG-VUvruzE",
          videoId: "5GG-VUvruzE",
          durationLabel: "36:39",
        },
        {
          title: "OWASP API Security Top 10 Course – Secure Your Web Apps",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=YYe0FdfdgDU",
          videoId: "YYe0FdfdgDU",
          durationLabel: "1:27:00",
          startSeconds: 2574,
          chapterLabel: "API5:2023 - Broken Function Level Authorization",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `authorize(policies, request)`: a small policy engine that combines role-based statements with attribute conditions and evaluates them the way AWS IAM does. Deny by default, and an explicit deny beats any allow.\n\n`request` is `{ user, action, resource }`. `user` is `{ id, roles, department? }`, `action` is a string such as `invoice:approve`, and `resource` is `{ type, id, ownerId?, department?, amount? }`. A resource's name is `type/id`, for example `invoice/42`.\n\nEach policy statement is `{ effect, roles, actions, resources, conditions? }` with `effect` either `\"allow\"` or `\"deny\"`. A statement applies when all four parts match:\n\n- Roles: `roles` contains `\"*\"` (any authenticated user) or at least one of `user.roles`, which may be empty or missing.\n- Actions: some pattern in `actions` matches. `\"*\"` matches everything; a pattern ending in `:*` matches actions that start with everything before the `*`, so `invoice:*` matches `invoice:read` but not `invoices:read`; any other pattern must match exactly.\n- Resources: some pattern in `resources` matches the resource name. `\"*\"` matches everything; a pattern ending in `/*` matches every resource of that type; any other pattern must match exactly, so `invoice/42` doesn't match `invoice/420`.\n- Conditions: every entry in `conditions` (if present) holds, as defined below.\n\nConditions:\n\n- `ownerOnly: true` holds when `resource.ownerId` is defined and equals `user.id`.\n- `sameDepartment: true` holds when `user.department` is defined and equals `resource.department`.\n- `maxAmount: n` holds when `resource.amount` is a number no greater than `n`.\n- Any other condition name never holds (fail closed).\n\nReturn `{ allowed: false, reason: \"unauthenticated\" }` when `user` is missing or its `id` isn't a non-empty string (that's a 401, not a 403). Otherwise return `{ allowed: false, reason: \"explicit_deny\" }` if any applicable statement is a deny, `{ allowed: true, reason: \"allow\" }` if at least one applicable statement is an allow, and `{ allowed: false, reason: \"no_match\" }` if nothing applies. Statement order doesn't matter.",
        starterCode: "/**\n * Evaluate RBAC + ABAC policy statements for one request.\n * @param {Array<{ effect: \"allow\" | \"deny\", roles: string[], actions: string[], resources: string[], conditions?: Record<string, unknown> }>} policies\n * @param {{ user?: { id?: string, roles?: string[], department?: string }, action: string, resource: { type: string, id: string, ownerId?: string, department?: string, amount?: number } }} request\n * @returns {{ allowed: boolean, reason: \"allow\" | \"explicit_deny\" | \"no_match\" | \"unauthenticated\" }}\n */\nfunction authorize(policies, request) {\n  // Your code here\n}\n",
        functionName: "authorize",
        testCases: [
          {
            description: "an admin's wildcard grant allows exporting a report",
            args: [invoicePolicies, { user: admin, action: "report:export", resource: { type: "report", id: "q3" } }],
            expected: { allowed: true, reason: "allow" },
          },
          {
            description: "a viewer can read any invoice",
            args: [invoicePolicies, { user: bobViewer, action: "invoice:read", resource: invoice42 }],
            expected: { allowed: true, reason: "allow" },
          },
          {
            description: "a viewer can't pay someone else's invoice: nothing applies, so deny by default",
            args: [invoicePolicies, { user: bobViewer, action: "invoice:pay", resource: invoice42 }],
            expected: { allowed: false, reason: "no_match" },
          },
          {
            description: "a customer with no roles can pay their own invoice",
            args: [invoicePolicies, { user: alice, action: "invoice:pay", resource: invoice42 }],
            expected: { allowed: true, reason: "allow" },
          },
          {
            description: "a customer can't read another customer's invoice (the BOLA check)",
            args: [invoicePolicies, { user: alice, action: "invoice:read", resource: { ...invoice42, ownerId: "u_carol" } }],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "an explicit deny beats the accountant's `invoice:*` allow",
            args: [invoicePolicies, { user: accountant, action: "invoice:delete", resource: invoice42 }],
            expected: { allowed: false, reason: "explicit_deny" },
            isEdgeCase: true,
          },
          {
            description: "`invoice:*` doesn't match `invoices:read`",
            args: [
              [{ effect: "allow", roles: ["accountant"], actions: ["invoice:*"], resources: ["*"] }],
              { user: accountant, action: "invoices:read", resource: invoice42 },
            ],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "`invoice/42` doesn't match `invoice/420`",
            args: [
              [{ effect: "allow", roles: ["viewer"], actions: ["invoice:read"], resources: ["invoice/42"] }],
              { user: bobViewer, action: "invoice:read", resource: { ...invoice42, id: "420" } },
            ],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "a manager can approve a same-department invoice at exactly the limit",
            args: [invoicePolicies, { user: salesManager, action: "invoice:approve", resource: { ...invoice42, amount: 10000 } }],
            expected: { allowed: true, reason: "allow" },
          },
          {
            description: "one unit over the limit isn't approvable",
            args: [invoicePolicies, { user: salesManager, action: "invoice:approve", resource: { ...invoice42, amount: 10001 } }],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "separation of duties: a manager can't approve their own invoice",
            args: [invoicePolicies, { user: salesManager, action: "invoice:approve", resource: { ...invoice42, ownerId: "u_mgr" } }],
            expected: { allowed: false, reason: "explicit_deny" },
            isEdgeCase: true,
          },
          {
            description: "a manager with no department never matches an invoice with no department",
            args: [
              invoicePolicies,
              {
                user: { id: "u_mgr2", roles: ["manager"] },
                action: "invoice:approve",
                resource: { type: "invoice", id: "43", ownerId: "u_alice", amount: 100 },
              },
            ],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "an unknown condition fails closed",
            args: [
              [{ effect: "allow", roles: ["viewer"], actions: ["invoice:read"], resources: ["invoice/*"], conditions: { businessHoursOnly: true } }],
              { user: bobViewer, action: "invoice:read", resource: invoice42 },
            ],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "a deny whose condition doesn't hold doesn't apply",
            args: [
              [
                { effect: "allow", roles: ["viewer"], actions: ["invoice:read"], resources: ["*"] },
                { effect: "deny", roles: ["*"], actions: ["*"], resources: ["*"], conditions: { ownerOnly: true } },
              ],
              { user: bobViewer, action: "invoice:read", resource: invoice42 },
            ],
            expected: { allowed: true, reason: "allow" },
          },
          {
            description: "no policies means deny",
            args: [[], { user: admin, action: "invoice:read", resource: invoice42 }],
            expected: { allowed: false, reason: "no_match" },
            isEdgeCase: true,
          },
          {
            description: "a request without a user is unauthenticated, not forbidden",
            args: [invoicePolicies, { action: "invoice:read", resource: invoice42 }],
            expected: { allowed: false, reason: "unauthenticated" },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "auth-cors",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "CORS Deep Dive",
      summary:
        "The same-origin policy stops a script on one origin (scheme, host and port) from reading responses from another. CORS is the controlled opt-out: response headers through which a server tells the browser which other origins may read its responses. The most important fact is that the browser enforces it, on the user's behalf, not your server. curl, Postman and server-to-server calls ignore it completely, so CORS is no substitute for authentication or authorization, and a CORS error means the browser withheld the response, not that the server refused the request.\n\nBrowsers split cross-origin requests in two. A \"simple\" request (GET, HEAD or POST with only CORS-safelisted headers, and a `Content-Type` of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`) is sent immediately, so its side effects happen even when the browser then hides the response. Anything else, such as `PUT`, `DELETE`, an `Authorization` header or a JSON body, triggers a preflight: an `OPTIONS` request carrying `Access-Control-Request-Method` and `Access-Control-Request-Headers`, which must get a 2xx answer with matching `Access-Control-Allow-*` headers before the real request goes out. `Access-Control-Max-Age` caches that answer; the default is 5 seconds, and browsers cap it (2 hours in Chromium, 24 hours in Firefox). Preflights carry no credentials, so auth middleware that runs first and returns 401 breaks them.\n\nCredentials are where configurations go wrong. With `credentials: \"include\"`, the browser rejects `Access-Control-Allow-Origin: *`, treats `*` in the allow-headers and allow-methods lists literally, and requires `Access-Control-Allow-Credentials: true`. Reflecting whatever `Origin` arrives, trusting `null`, or matching with `endsWith(\"example.com\")` lets hostile sites read your users' authenticated data. Echo only origins on an exact allow-list, send `Vary: Origin` so shared caches don't serve one origin's headers to another, and list custom response headers in `Access-Control-Expose-Headers` if the frontend must read them.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", kind: "docs" },
        { label: "WHATWG Fetch Standard: CORS protocol", url: "https://fetch.spec.whatwg.org/#http-cors-protocol", kind: "spec" },
        { label: "PortSwigger: Cross-origin resource sharing (CORS) vulnerabilities", url: "https://portswigger.net/web-security/cors", kind: "article" },
      ],
      video: {
        title: "CORS, Preflight Request, OPTIONS Method | Access Control Allow Origin Error Explained",
        channel: "Akshay Saini",
        url: "https://www.youtube.com/watch?v=tcLW5d0KAYE",
        videoId: "tcLW5d0KAYE",
        durationLabel: "12:35",
      },
      alternateVideos: [
        {
          title: "5. Understanding HTTP for backend engineers, where it all starts",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=a3C1DMswClQ",
          videoId: "a3C1DMswClQ",
          durationLabel: "1:18:13",
          startSeconds: 1207,
          chapterLabel: "OPTIONS method and CORS workflow",
        },
        {
          title: "Cross Origin Resource Sharing (Explained by Example)",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=Ka8vG5miErk",
          videoId: "Ka8vG5miErk",
          durationLabel: "23:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-cors-q1",
          prompt:
            "A page on `https://evil.example` runs `fetch(\"https://bank.example/transfer\", { method: \"POST\", body: formData, credentials: \"include\" })` with a `FormData` body. The bank's API sends no CORS headers at all. What happens?",
          options: [
            "The request reaches the server with the user's cookies (subject to `SameSite`) and executes; the browser only stops the page from reading the response",
            "The browser sends a preflight, gets no CORS headers, and never sends the POST",
            "The browser blocks the request before it leaves the machine",
            "The server rejects it automatically because the `Origin` doesn't match",
          ],
          correctIndex: 0,
          explanation:
            "A POST with a `multipart/form-data` body is a simple request, so there's no preflight: it's sent, and any side effects happen. CORS only governs reading the response, which is why state-changing endpoints need CSRF defenses rather than CORS.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-cors-q2",
          prompt:
            "The frontend at `https://app.oyelabs.dev` calls the API with `credentials: \"include\"`. Which response header sets let the page read the response? (Select all that apply.)",
          options: [
            "`Access-Control-Allow-Origin: https://app.oyelabs.dev` and `Access-Control-Allow-Credentials: true`",
            "`Access-Control-Allow-Origin: https://app.oyelabs.dev`, `Access-Control-Allow-Credentials: true` and `Vary: Origin`",
            "`Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true`",
            "`Access-Control-Allow-Origin: https://app.oyelabs.dev` without `Access-Control-Allow-Credentials`",
            "`Access-Control-Allow-Origin: https://*.oyelabs.dev` and `Access-Control-Allow-Credentials: true`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Credentialed responses need an explicit origin plus `Allow-Credentials: true`; `Vary: Origin` doesn't affect the check but is correct when the value is chosen per request. The wildcard is refused with credentials, and CORS has no subdomain wildcard syntax at all.",
        },
        {
          id: "auth-cors-q3",
          prompt:
            "A middleware copies the request's `Origin` header into `Access-Control-Allow-Origin` and always adds `Access-Control-Allow-Credentials: true`. Why is this dangerous?",
          options: [
            "Any website a logged-in user visits can make requests with the user's cookies and read the responses, such as their profile or API keys",
            "It isn't: echoing the origin is the recommended way to support several frontends",
            "It breaks preflight caching but has no security impact",
            "It only matters for non-browser clients, which send fake origins",
          ],
          correctIndex: 0,
          explanation:
            "Reflection turns the allow-list into \"everyone\", with credentials. Echoing is fine only after checking the origin against an exact allow-list. Non-browser clients can fake `Origin` but gain nothing, since they don't hold the victim's cookies.",
        },
        {
          id: "auth-cors-q4",
          prompt: "What's wrong with this origin check?\n\n```js\nconst allowed = origin && origin.endsWith(\"oyelabs.dev\");\n```",
          options: [
            "It also accepts `https://evil-oyelabs.dev` and any other domain an attacker registers that ends with those characters",
            "Nothing: only Oyelabs can own domains ending in `oyelabs.dev`",
            "It rejects `https://app.oyelabs.dev` because of the scheme",
            "`endsWith` is case-sensitive, which makes it too strict to be useful",
          ],
          correctIndex: 0,
          explanation:
            "Suffix matching without a dot boundary accepts look-alike registrable domains, and even with one it trusts every subdomain, including forgotten or user-content ones. Compare full origins against an exact set.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-cors-q5",
          prompt:
            "A CDN caches `GET /api/catalog`. Your server echoes the caller's origin in `Access-Control-Allow-Origin` when it's on the allow-list, but doesn't send `Vary: Origin`. What goes wrong?",
          options: [
            "The CDN can serve a response cached for one origin to another, whose CORS check then fails, or pass a permissive header to an origin that shouldn't get it",
            "Nothing: CDNs strip CORS headers from cached responses and recompute them per request",
            "The CDN refuses to cache responses that carry any `Access-Control-*` header",
            "Browsers start sending a preflight before every GET to a CDN-cached URL",
          ],
          correctIndex: 0,
          explanation:
            "Without `Vary: Origin` the cache key ignores the origin, so one origin's header value is replayed to everyone. MDN recommends `Vary: Origin` whenever the allowed origin is chosen per request.",
        },
        {
          id: "auth-cors-q6",
          prompt: "Your browser console shows a CORS error, but `curl` against the same URL returns the data. Why?",
          options: [
            "CORS is enforced by browsers for web pages; curl isn't a browser and doesn't apply the same-origin policy",
            "curl sends a trusted `Origin` header that the server always allows",
            "The server detects curl's user agent and turns CORS off for it",
            "curl uses HTTP/1.1, and CORS only exists in HTTP/2",
          ],
          correctIndex: 0,
          explanation:
            "The server answered in both cases; only the browser refused to expose the response to the page. That's also why CORS can't be your access control.",
        },
        {
          id: "auth-cors-q7",
          prompt:
            "An API authenticates with a session cookie and accepts form POSTs. The team sets a strict CORS allow-list. Does that protect the POST endpoints from CSRF?",
          options: [
            "No: a cross-site form POST is a simple request sent without a preflight, and CORS only controls whether the response can be read",
            "Yes: requests from origins that aren't on the allow-list are blocked by the browser before they're sent",
            "Yes, as long as `Access-Control-Allow-Credentials` is false, since cookies then aren't attached",
            "No, but only because CORS applies to GET requests and never to POST",
          ],
          correctIndex: 0,
          explanation:
            "CSRF doesn't need to read the response, only to cause the request. Defend with `SameSite` cookies, anti-CSRF tokens, or requiring a custom header or JSON content type that forces a preflight.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-cors-q8",
          prompt: "Why shouldn't an origin allow-list contain the value `null`?",
          options: [
            "Sandboxed iframes, `data:` URLs and some redirects send `Origin: null`, so any attacker can produce it",
            "`null` means the request came from the server itself",
            "Browsers never send `null`, so the entry is just dead config",
            "`null` is only sent by curl and Postman",
          ],
          correctIndex: 0,
          explanation:
            "An attacker can host a sandboxed iframe that sends `Origin: null`, so allowing `null` (especially with credentials) is as good as allowing everyone.",
        },
        {
          id: "auth-cors-q9",
          prompt:
            "A credentialed preflight asks for `DELETE` with headers `authorization, content-type`. The server answers `Access-Control-Allow-Origin: https://app.oyelabs.dev`, `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Methods: GET, POST, DELETE` and `Access-Control-Allow-Headers: *`. What does the browser do?",
          options: [
            "Blocks the request: with credentials, `*` in `Access-Control-Allow-Headers` is treated as a literal header name, so `authorization` isn't allowed",
            "Sends the DELETE, because `*` in the allow-headers list covers every request header",
            "Sends the DELETE but strips the `Authorization` header, since it wasn't listed by name",
            "Retries the preflight without credentials, where the wildcard would apply",
          ],
          correctIndex: 0,
          explanation:
            "Wildcards in the allow-lists only work for non-credentialed requests, and even then `Authorization` must always be listed explicitly. List the headers: `Access-Control-Allow-Headers: Authorization, Content-Type`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-cors-q10",
          prompt: "You set `Access-Control-Max-Age: 86400`, but Chrome still sends a preflight roughly every two hours. Why?",
          options: [
            "Chromium caps the preflight cache at 7,200 seconds regardless of the header",
            "Max-Age is measured in minutes, so 86400 is ignored as invalid",
            "Chrome ignores Max-Age for credentialed requests",
            "The server must also send `Cache-Control: max-age` on the preflight",
          ],
          correctIndex: 0,
          explanation:
            "Browsers apply their own ceiling (Chromium 2 hours, Firefox 24 hours). The value is in seconds and applies to credentialed preflights too; `Cache-Control` doesn't govern the preflight cache.",
        },
        {
          id: "auth-cors-q11",
          prompt: "A CORS request succeeds, but the frontend reads `null` from `response.headers.get(\"X-Request-Id\")` and `response.headers.get(\"Link\")`. What's the fix?",
          options: [
            "Add them to `Access-Control-Expose-Headers`; by default only CORS-safelisted response headers are exposed to the page",
            "Add them to `Access-Control-Allow-Headers` in the preflight response",
            "Send the header names in lowercase, as HTTP/2 requires for custom headers",
            "Use `credentials: \"include\"`, which exposes every response header to the page",
          ],
          correctIndex: 0,
          explanation:
            "`Allow-Headers` is about request headers in the preflight. Response headers beyond the safelisted few (`Content-Type`, `Content-Length`, `Cache-Control` and so on) stay hidden unless exposed.",
        },
        {
          id: "auth-cors-q12",
          prompt:
            "An Express app registers its JWT auth middleware globally, before the CORS middleware. Browser calls from the SPA that send an `Authorization` header all fail, while curl works. What's happening?",
          options: [
            "The preflight `OPTIONS` request carries no credentials, the auth middleware answers it with 401, and after a non-2xx preflight the browser never sends the real request",
            "The CORS middleware strips the `Authorization` header before the auth middleware can read it",
            "Browsers never send `Authorization` headers on cross-origin requests, only cookies",
            "curl uses HTTP/1.1 while browsers use HTTP/2, which rejects the auth middleware's headers",
          ],
          correctIndex: 0,
          explanation:
            "Preflights never include credentials, and the Fetch standard requires a 2xx preflight response. Handle `OPTIONS` (the CORS middleware) before authentication.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "auth-rate-limiting",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "Rate Limiting & Brute-Force Protection",
      summary:
        "Rate limiting caps how much work one client can make you do. It blunts brute force and credential stuffing, scraping and runaway integrations, and it's how you enforce fair use and pricing tiers. OWASP files missing limits under API4:2023 Unrestricted Resource Consumption, which also covers payload and page sizes and calls that cost you money per request (SMS, email, LLM tokens).\n\nThe algorithms trade accuracy for memory. A fixed window counter (N requests per clock minute) is one integer per key but allows 2N in a burst straddling the boundary. A sliding log stores every timestamp: exact, but memory grows with traffic. A sliding window counter weights the previous window's count by how much of it still overlaps the current one, the cheap approximation Cloudflare described running at scale. A token bucket refills at a steady rate up to a capacity, so it permits short bursts while enforcing an average; a leaky bucket drains a queue at a constant rate, smoothing output instead of rejecting. Neither bucket needs timers: store the tokens and the last refill time per key, and top up lazily on each request. Across several instances, keep that state in Redis and update it atomically (a Lua script, or `INCR` with an expiry), or each instance enforces its own separate limit.\n\nLogin endpoints need more than one limit. A per-IP limit alone fails against credential stuffing spread across thousands of residential IPs, and a hard per-account lockout lets anyone lock a victim out by guessing wrong on purpose. Combine per-IP and per-account throttling with growing delays, CAPTCHA or step-up challenges after repeated failures, breached-password checks and MFA; NIST SP 800-63B-4 caps consecutive failures at 100 per account. Tell clients the rules: `429 Too Many Requests` with `Retry-After`, and optionally the IETF draft `RateLimit` and `RateLimit-Policy` headers.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        {
          label: "OWASP: API4:2023 Unrestricted Resource Consumption",
          url: "https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/",
          kind: "docs",
        },
        {
          label: "OWASP: Credential Stuffing Prevention Cheat Sheet",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html",
          kind: "docs",
        },
        { label: "Cloudflare: How we built rate limiting capable of scaling to millions of domains", url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/", kind: "article" },
        { label: "IETF draft: RateLimit header fields for HTTP", url: "https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/", kind: "spec" },
      ],
      video: {
        title: "Rate Limiter System Design: Token Bucket, Leaky Bucket, Scaling",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=YXkOdWBwqaA",
        videoId: "YXkOdWBwqaA",
        durationLabel: "7:46",
      },
      alternateVideos: [
        {
          title: "20. Backend Security: Everything You Need to Know",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=xB1C1xZZW4k",
          videoId: "xB1C1xZZW4k",
          durationLabel: "2:50:02",
          startSeconds: 5561,
          chapterLabel: "Rate Limiting Strategies",
        },
        {
          title: "OWASP API Security Top 10 Course – Secure Your Web Apps",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=YYe0FdfdgDU",
          videoId: "YYe0FdfdgDU",
          durationLabel: "1:27:00",
          startSeconds: 2348,
          chapterLabel: "API4:2023 - Unrestricted Resource Consumption",
        },
        {
          title: "Five Rate Limiting Algorithms ~ Key Concepts in System Design",
          channel: "Hello Byte",
          url: "https://www.youtube.com/watch?v=mQCJJqUfn9Y",
          videoId: "mQCJJqUfn9Y",
          durationLabel: "17:22",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createTokenBucketLimiter({ capacity, refillPerSec })`. It returns an object with `tryRemove(key, nowMs, cost = 1)`, which is called once per request with the client's key (an IP, user ID or API key), the current time in milliseconds on the tests' fake clock, and the request's cost in tokens.\n\n- Each key has its own bucket, created full (`capacity` tokens) on that key's first request.\n- Refill lazily, without timers: before deciding, add `(nowMs - lastRefill) * refillPerSec / 1000` tokens, capped at `capacity`, and remember `nowMs` as the last refill time. If `nowMs` is earlier than the last refill time (servers' clocks disagree), add nothing and keep the later time.\n- If `cost` is greater than `capacity`, the request can never succeed: return `{ allowed: false, remaining, retryAfterMs: null }`.\n- If the bucket holds at least `cost` tokens, remove them and return `{ allowed: true, remaining, retryAfterMs: 0 }`.\n- Otherwise leave the tokens alone and return `{ allowed: false, remaining, retryAfterMs }`, where `retryAfterMs` is the wait until enough tokens exist: `Math.ceil((cost - tokens) * 1000 / refillPerSec)`.\n- `remaining` is always `Math.floor` of the tokens left after the decision.\n\nTokens can be fractional; plain floating point is fine for these tests. The tests call `runLimiterScenario(config, requests)`, which creates one limiter and feeds it `[key, atMs, cost?]` tuples in order. Leave the driver as it is.",
        starterCode: "/**\n * A per-key token bucket with lazy refill (no timers).\n * @param {{ capacity: number, refillPerSec: number }} config\n * @returns {{ tryRemove(key: string, nowMs: number, cost?: number): { allowed: boolean, remaining: number, retryAfterMs: number | null } }}\n */\nfunction createTokenBucketLimiter({ capacity, refillPerSec }) {\n  // Your code here: keep per-key state in a Map\n  return {\n    tryRemove(key, nowMs, cost = 1) {\n      // Your code here\n    },\n  };\n}\n\n// ---- Test driver (leave as is) ----\nfunction runLimiterScenario(config, requests) {\n  const limiter = createTokenBucketLimiter(config);\n  return requests.map(([key, atMs, cost]) => limiter.tryRemove(key, atMs, cost === undefined ? 1 : cost));\n}\n",
        functionName: "runLimiterScenario",
        testCases: [
          {
            description: "a burst up to capacity is allowed; the next request is rejected",
            args: [{ capacity: 3, refillPerSec: 1 }, [["ip:1", 0], ["ip:1", 0], ["ip:1", 0], ["ip:1", 0]]],
            expected: [
              { allowed: true, remaining: 2, retryAfterMs: 0 },
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 1000 },
            ],
          },
          {
            description: "one token comes back after 1 s at 1 token/s",
            args: [{ capacity: 3, refillPerSec: 1 }, [["ip:1", 0], ["ip:1", 0], ["ip:1", 0], ["ip:1", 1000], ["ip:1", 1000]]],
            expected: [
              { allowed: true, remaining: 2, retryAfterMs: 0 },
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 1000 },
            ],
          },
          {
            description: "half a token isn't enough: retry in the remaining 500 ms",
            args: [{ capacity: 1, refillPerSec: 1 }, [["u", 0], ["u", 500], ["u", 1000]]],
            expected: [
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 500 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
            ],
            isEdgeCase: true,
          },
          {
            description: "refill is capped at capacity, however long the bucket sat idle",
            args: [{ capacity: 2, refillPerSec: 10 }, [["u", 0], ["u", 0], ["u", 3600000], ["u", 3600000], ["u", 3600000]]],
            expected: [
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 100 },
            ],
            isEdgeCase: true,
          },
          {
            description: "each key has its own bucket",
            args: [{ capacity: 1, refillPerSec: 1 }, [["alice", 0], ["bob", 0], ["alice", 10], ["bob", 10]]],
            expected: [
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 990 },
              { allowed: false, remaining: 0, retryAfterMs: 990 },
            ],
          },
          {
            description: "a weighted request needs `cost` tokens",
            args: [{ capacity: 5, refillPerSec: 2 }, [["k", 0, 4], ["k", 0, 2], ["k", 500, 2]]],
            expected: [
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: false, remaining: 1, retryAfterMs: 500 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
            ],
          },
          {
            description: "a cost above capacity can never succeed, so `retryAfterMs` is null",
            args: [{ capacity: 5, refillPerSec: 2 }, [["k", 0, 6], ["k", 0, 5]]],
            expected: [
              { allowed: false, remaining: 5, retryAfterMs: null },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
            ],
            isEdgeCase: true,
          },
          {
            description: "a timestamp earlier than the last one adds no tokens",
            args: [{ capacity: 2, refillPerSec: 1 }, [["k", 5000], ["k", 5000], ["k", 3000], ["k", 6000]]],
            expected: [
              { allowed: true, remaining: 1, retryAfterMs: 0 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 1000 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
            ],
            isEdgeCase: true,
          },
          {
            description: "fractional refill rates work (0.5 tokens/s)",
            args: [{ capacity: 1, refillPerSec: 0.5 }, [["k", 0], ["k", 1000], ["k", 2000]]],
            expected: [
              { allowed: true, remaining: 0, retryAfterMs: 0 },
              { allowed: false, remaining: 0, retryAfterMs: 1000 },
              { allowed: true, remaining: 0, retryAfterMs: 0 },
            ],
          },
          {
            description: "500 different keys each get their first request through",
            args: [{ capacity: 1, refillPerSec: 1 }, Array.from({ length: 500 }, (_, i) => [`ip:${i}`, i])],
            expected: Array.from({ length: 500 }, () => ({ allowed: true, remaining: 0, retryAfterMs: 0 })),
            isEdgeCase: true,
          },
          {
            description: "a steady stream at exactly the refill rate is never rejected",
            args: [{ capacity: 1, refillPerSec: 10 }, Array.from({ length: 50 }, (_, i) => ["k", i * 100])],
            expected: Array.from({ length: 50 }, () => ({ allowed: true, remaining: 0, retryAfterMs: 0 })),
          },
        ],
      },
    },
    {
      id: "auth-owasp-api-top10",
      moduleId: "be-auth-security",
      trackId: "backend",
      title: "The OWASP API Security Top 10 In Depth",
      summary:
        "The OWASP API Security Top 10 exists because APIs fail differently from server-rendered web apps. Its 2023 edition, still the current one in 2026 and separate from the general OWASP Top 10:2025, is dominated by authorization. API1 Broken Object Level Authorization (BOLA, the API name for IDOR) is changing `/accounts/123` to `/accounts/124` and getting someone else's data, because the handler checked the token but not ownership. API3 Broken Object Property Level Authorization merges 2019's excessive data exposure and mass assignment: returning fields the caller shouldn't see, or binding request fields such as `role` or `balance` straight onto a model. API5 Broken Function Level Authorization is a regular user calling `DELETE /admin/users/7` because only the UI hid the button.\n\nThe rest: API2 Broken Authentication (weak token validation, credential stuffing, unprotected password reset), API4 Unrestricted Resource Consumption (no limits on rate, payload size, page size or paid side effects), API6 Unrestricted Access to Sensitive Business Flows (bots buying a whole product drop or farming referral credit through perfectly valid calls), API7 Server Side Request Forgery (fetching a user-supplied URL that reaches `169.254.169.254` or internal services), API8 Security Misconfiguration (verbose errors, permissive CORS, missing TLS), API9 Improper Inventory Management (forgotten `v1`, staging and undocumented endpoints) and API10 Unsafe Consumption of APIs (trusting third-party API responses more than user input).\n\nThe senior lesson is where the checks live. Scanners find misconfigurations but rarely BOLA or business-flow abuse, because the malicious requests are well formed: only your code knows who owns what. Push object-level checks into the data-access layer so every query is scoped by tenant and owner, use explicit response and request schemas (allow-lists in both directions), keep an inventory generated from your OpenAPI documents, and write tests that call every endpoint as the wrong user.",
      level: "expert",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "OWASP: API Security Top 10 2023", url: "https://api-security.owasp.org/editions/2023/en/0x11-t10/", kind: "spec" },
        {
          label: "OWASP: API1:2023 Broken Object Level Authorization",
          url: "https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/",
          kind: "docs",
        },
        { label: "OWASP: REST Security Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html", kind: "docs" },
        { label: "PortSwigger Web Security Academy: API testing", url: "https://portswigger.net/web-security/api-testing", kind: "article" },
      ],
      video: {
        title: "OWASP API Security Top 10 Course – Secure Your Web Apps",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=YYe0FdfdgDU",
        videoId: "YYe0FdfdgDU",
        durationLabel: "1:27:00",
        startSeconds: 810,
        chapterLabel: "Updates to the OWASP API Security Top 10",
      },
      alternateVideos: [
        {
          title: "20. Backend Security: Everything You Need to Know",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=xB1C1xZZW4k",
          videoId: "xB1C1xZZW4k",
          durationLabel: "2:50:02",
          startSeconds: 5851,
          chapterLabel: "Authorization Vulnerabilities (BOLA/BFLA)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-owasp-api-top10-q1",
          prompt:
            "Which OWASP API Security risk does this handler have?\n\n```js\napp.get(\"/api/orders/:id\", requireAuth, async (req, res) => {\n  const order = await Order.findById(req.params.id);\n  if (!order) return res.sendStatus(404);\n  res.json(order);\n});\n```",
          options: [
            "API1:2023 Broken Object Level Authorization",
            "API2:2023 Broken Authentication",
            "API5:2023 Broken Function Level Authorization",
            "API8:2023 Security Misconfiguration",
          ],
          correctIndex: 0,
          explanation:
            "The caller is authenticated, but nothing checks that the order belongs to them, so any logged-in user can read any order by changing the ID. Scope the query: `Order.findOne({ _id: req.params.id, customerId: req.user.id })`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-owasp-api-top10-q2",
          prompt:
            "Which risk is this?\n\n```js\napp.patch(\"/api/me\", requireAuth, async (req, res) => {\n  const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });\n  res.json(user);\n});\n```",
          options: [
            "API3:2023 Broken Object Property Level Authorization",
            "API1:2023 Broken Object Level Authorization",
            "API4:2023 Unrestricted Resource Consumption",
            "API10:2023 Unsafe Consumption of APIs",
          ],
          correctIndex: 0,
          explanation:
            "The object is the caller's own, so it isn't BOLA, but any property in the body is written (`role: \"admin\"`, `emailVerified: true`) and the full document, perhaps including a password hash, goes back. Allow-list writable fields and serialize through a response schema.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-owasp-api-top10-q3",
          prompt: "Regular users can call `POST /api/admin/invitations`, because the route only checks for a valid JWT and the admin UI simply isn't shown to them. Which risk is this?",
          options: [
            "API5:2023 Broken Function Level Authorization",
            "API1:2023 Broken Object Level Authorization",
            "API9:2023 Improper Inventory Management",
            "API2:2023 Broken Authentication",
          ],
          correctIndex: 0,
          explanation:
            "Function-level authorization is about which operations a role may invoke; hiding a button isn't a control. BOLA is about which objects, and authentication here works as designed.",
        },
        {
          id: "auth-owasp-api-top10-q4",
          prompt: "Bots use your valid, authenticated, rate-limited checkout API to buy an entire limited sneaker drop within seconds of release. Which risk category fits best?",
          options: [
            "API6:2023 Unrestricted Access to Sensitive Business Flows",
            "API4:2023 Unrestricted Resource Consumption",
            "API2:2023 Broken Authentication",
            "API8:2023 Security Misconfiguration",
          ],
          correctIndex: 0,
          explanation:
            "Every request is legitimate on its own; the harm is automated use of a business flow. Defenses are flow-specific: device fingerprinting, human checks, purchase limits per identity, and detecting non-human timing.",
        },
        {
          id: "auth-owasp-api-top10-q5",
          prompt:
            "Your \"link preview\" endpoint fetches a URL supplied by the user. Which targets must the server refuse to fetch? (Select all that apply.)",
          options: [
            "`http://169.254.169.254/latest/meta-data/`",
            "`http://localhost:6379/`",
            "`http://10.0.0.12/admin`",
            "A public hostname whose DNS record resolves to `127.0.0.1`",
            "`https://example.com/blog/post`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "SSRF (API7:2023, and part of A01 Broken Access Control in the OWASP Top 10:2025) reaches cloud metadata, local services and the private network. Check the resolved IP address, not the hostname string, and re-check after redirects.",
        },
        {
          id: "auth-owasp-api-top10-q6",
          prompt:
            "The mobile app moved to `/v3`, but `/v1/users/search` still responds, without v3's field filtering and rate limits, and it isn't in any current documentation. Which risk is this?",
          options: [
            "API9:2023 Improper Inventory Management",
            "API3:2023 Broken Object Property Level Authorization",
            "API6:2023 Unrestricted Access to Sensitive Business Flows",
            "API10:2023 Unsafe Consumption of APIs",
          ],
          correctIndex: 0,
          explanation:
            "Forgotten versions and hosts keep old weaknesses alive outside anyone's view. Inventory every deployed API version and environment, and retire old ones deliberately.",
        },
        {
          id: "auth-owasp-api-top10-q7",
          prompt: "Your service reads a shipping address from a partner's API and interpolates it into a SQL query without validation. Which category does OWASP put this in?",
          options: [
            "API10:2023 Unsafe Consumption of APIs",
            "API8:2023 Security Misconfiguration",
            "API1:2023 Broken Object Level Authorization",
            "API7:2023 Server Side Request Forgery",
          ],
          correctIndex: 0,
          explanation:
            "Data from integrated services is untrusted input too, and attackers increasingly target the weaker partner. Injection itself was dropped as a standalone API category in 2023, and this is its most common API-shaped form.",
        },
        {
          id: "auth-owasp-api-top10-q8",
          prompt: "What changed between the 2019 and 2023 editions of the API Security Top 10? (Select all that apply.)",
          options: [
            "Excessive Data Exposure and Mass Assignment were merged into Broken Object Property Level Authorization",
            "Server Side Request Forgery was added",
            "Unsafe Consumption of APIs was added",
            "Injection moved up to API1",
            "Insufficient Logging & Monitoring kept its API10 spot",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The 2023 release notes describe the merge and the new business-flow and unsafe-consumption categories, and SSRF became API7. Injection and Insufficient Logging & Monitoring left the list; BOLA stayed at API1.",
        },
        {
          id: "auth-owasp-api-top10-q9",
          prompt: "User A requests user B's invoice. Which response is appropriate?",
          options: [
            "`404 Not Found` (or `403 Forbidden`); 404 avoids confirming that the invoice exists, which RFC 9110 explicitly allows",
            "`401 Unauthorized`, because A isn't authorized for this invoice",
            "`200 OK` with an empty body, so the response leaks nothing about the invoice",
            "`200 OK` with only the invoice's non-sensitive fields, such as its date",
          ],
          correctIndex: 0,
          explanation:
            "A is authenticated, so 401 (missing or invalid credentials) is wrong. Returning 404 for objects the caller may not see stops ID enumeration from confirming which IDs exist; partial data is still a leak.",
        },
        {
          id: "auth-owasp-api-top10-q10",
          prompt: "To fix BOLA, a team replaces sequential integer IDs with random UUIDs. Is the vulnerability fixed?",
          options: [
            "No: IDs leak through URLs, logs, shared links, emails and other endpoints, so the ownership check is still required; random IDs only slow enumeration",
            "Yes: UUIDs can't be guessed, so attackers can't reach other users' objects",
            "Yes, provided they're version 4 UUIDs with 122 random bits",
            "No, because most databases generate UUIDs sequentially, so they're easy to guess",
          ],
          correctIndex: 0,
          explanation:
            "Unguessable identifiers are defense in depth, not authorization. OWASP's BOLA guidance is to check that the logged-in user may access the object on every request. (Only some UUID versions, like v7, are time-ordered.)",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "auth-owasp-api-top10-q11",
          prompt: "What's the most robust structural defense against BOLA across a codebase with 200 endpoints?",
          options: [
            "Data-access methods that require the authenticated principal and scope every query by tenant and owner, plus tests that call each endpoint as a different user",
            "A WAF rule that blocks requests whose IDs differ from the ones in the user's last response",
            "Code review checklists that ask every author to remember the ownership check",
            "Encrypting every ID in URLs so users can't read or change them",
          ],
          correctIndex: 0,
          explanation:
            "Making the safe path the only path (you can't fetch an order without passing the user) removes the per-handler memory test that BOLA exploits. WAFs can't know ownership, and encrypted IDs still leak and still need checks.",
        },
        {
          id: "auth-owasp-api-top10-q12",
          prompt: "Why do automated DAST scanners rarely find API1 (BOLA) and API6 (business-flow abuse)?",
          options: [
            "The malicious requests are syntactically valid; spotting them requires knowing who owns which object and what the business flow should allow",
            "Scanners can't authenticate, so they never reach the endpoints that sit behind a login",
            "Both risks only occur in GraphQL APIs, which most scanners don't support",
            "They're client-side flaws in the SPA, so server-side scanners never observe them",
          ],
          correctIndex: 0,
          explanation:
            "No payload signature marks a BOLA request: it's a valid call with someone else's ID. Finding it needs two test users and knowledge of the data model, which is why authorization tests belong in your own test suite.",
        },
      ],
    },
  ],
} satisfies Module;
