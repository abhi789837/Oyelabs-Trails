/*
 * v4.5 Phase 0: read-only check of the web search set-up, run INSIDE the app container.
 *
 *   docker compose exec -T oyelearn node - < scripts/deploy/research-check.cjs
 *
 * Prints (never a key, only its last four characters):
 *   1. what is saved under Admin → AI connection → Research (provider, which keys exist);
 *   2. the newest `course.generate` jobs and why they wait;
 *   3. one real search with the saved key, decrypted with this container's APP_MASTER_KEY, and one
 *      YouTube lookup when a YouTube key is saved, with the HTTP status of each.
 * It writes nothing.
 */
const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const dataDir = process.env.DATA_DIR || "/data";
const db = new Database(`${dataDir}/oyelearn.db`, { readonly: true, fileMustExist: true });

function key() {
  const raw = process.env.APP_MASTER_KEY || "";
  const buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("APP_MASTER_KEY is missing or not 32 bytes in this container");
  return buf;
}

function open(ciphertext, iv, tag) {
  if (!ciphertext || !iv || !tag) return null;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

async function main() {
  const row = db.prepare("select * from research_settings where id = 'singleton'").get();
  console.log("\n1. Saved research settings");
  if (!row) {
    console.log("   none saved at all -> 'not set up'");
  } else {
    console.table([
      {
        provider: row.provider,
        search_key: row.search_ciphertext ? `saved (${row.search_hint})` : "MISSING",
        youtube_key: row.youtube_ciphertext ? `saved (${row.youtube_hint})` : "MISSING",
        saved_at: new Date(row.updated_at).toISOString(),
      },
    ]);
    if (!row.youtube_ciphertext) console.log("   -> before v4.5 a missing YouTube key alone made every new course wait on \"the web search isn't connected\".");
    if (!row.provider) console.log("   -> no search service picked: before v4.5 this also read as \"the web search isn't connected\".");
  }

  console.log("\n2. Newest course.generate jobs");
  const jobs = db
    .prepare(
      "select id, status, attempts, max_attempts, last_error, json_extract(payload, '$.skill') as skill, json_extract(payload, '$.userId') as user_id, created_at from jobs where type = 'course.generate' order by created_at desc limit 20",
    )
    .all()
    .map((j) => ({ ...j, created_at: new Date(j.created_at).toISOString() }));
  console.table(jobs);
  const meta = db.prepare("select value from app_meta where key = 'research.last_check'").get();
  if (meta) console.log("   last Test / re-check:", meta.value);

  if (!row || !row.search_ciphertext) return;
  console.log("\n3. A real search from this container with the saved key");
  let searchKey;
  try {
    searchKey = open(row.search_ciphertext, row.search_iv, row.search_tag);
  } catch (error) {
    console.log("   CANNOT DECRYPT the saved key with this container's APP_MASTER_KEY:", error.message, "-> re-enter the key on Admin → AI connection.");
    return;
  }
  const provider = row.provider || (searchKey.startsWith("tvly-") ? "tavily" : null);
  const query = "JavaScript closures explained";
  const signal = AbortSignal.timeout(15000);
  let response;
  try {
    if (provider === "tavily") {
      response = await fetch("https://api.tavily.com/search", { method: "POST", signal, headers: { "content-type": "application/json", authorization: `Bearer ${searchKey}` }, body: JSON.stringify({ query, max_results: 5 }) });
    } else if (provider === "brave") {
      response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, { signal, headers: { "X-Subscription-Token": searchKey, accept: "application/json" } });
    } else if (provider === "serper") {
      response = await fetch("https://google.serper.dev/search", { method: "POST", signal, headers: { "content-type": "application/json", "X-API-KEY": searchKey }, body: JSON.stringify({ q: query, num: 5 }) });
    } else {
      console.log("   no provider picked and the key is not a Tavily key: pick the service on Admin → AI connection.");
      return;
    }
  } catch (error) {
    console.log(`   ${provider}: CAN'T REACH IT from this container:`, error.cause?.code || error.name, error.message);
    return;
  }
  const body = await response.text();
  let count = null;
  try {
    const json = JSON.parse(body);
    count = (json.results || json.web?.results || json.organic || []).length;
  } catch {
    /* not JSON */
  }
  console.log(`   ${provider}: HTTP ${response.status}${count !== null ? `, ${count} results` : ""}${response.ok ? "" : ` — ${body.slice(0, 200)}`}`);

  if (row.youtube_ciphertext) {
    try {
      const yt = open(row.youtube_ciphertext, row.youtube_iv, row.youtube_tag);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=8zKuNo4ay8E&key=${yt}`, { signal: AbortSignal.timeout(15000) });
      console.log(`   YouTube: HTTP ${res.status}${res.ok ? "" : ` — ${(await res.text()).slice(0, 200)}`}`);
    } catch (error) {
      console.log("   YouTube check failed:", error.message);
    }
  }
}

main()
  .catch((error) => console.error("check failed:", error.message))
  .finally(() => db.close());
