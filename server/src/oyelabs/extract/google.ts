import type { DocLinkKind } from "../../../../shared/videoSources";
import type { DocFormat } from "./formats";

/**
 * Where to read a linked document's text from (PLAN §4.3). Public share links only: nothing here
 * signs in, so a private file answers with a sign-in page, which `docs.ts` reports in plain words.
 *
 *   Google Docs    /document/d/<id>/export?format=txt
 *   Google Sheets  /spreadsheets/d/<id>/export?format=csv[&gid=<sheet>]
 *   Google Slides  /presentation/d/<id>/export?format=pdf  (then the PDF path: a page per slide)
 *   Drive file     https://drive.google.com/uc?export=download&id=<id>
 *   Dropbox        ?dl=0 → ?raw=1
 *   OneDrive       adds download=1
 *   anything else  the page itself, through Readability
 *
 * B's resolver stores the same answer in `course_docs.fetch_url`; this is the fallback when it is
 * empty, and the single source of truth for the Google export endpoints in tests.
 */

export interface FetchPlan {
  kind: DocLinkKind;
  fetchUrl: string;
  /** What the response should be read as; null = decide from the response. */
  expect: DocFormat | null;
  /** For a Sheets export: the sheet the link pointed at. */
  sheetName?: string;
}

const GOOGLE_DOC = /^https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{10,})/;
const DRIVE_FILE = /^https?:\/\/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]{10,})|open\?(?:.*&)?id=([a-zA-Z0-9_-]{10,}))/;

export function googleExportUrl(url: string): FetchPlan | null {
  const doc = GOOGLE_DOC.exec(url.trim());
  if (doc) {
    const [, type, id] = doc;
    const base = `https://docs.google.com/${type}/d/${id}`;
    if (type === "document") return { kind: "gdoc", fetchUrl: `${base}/export?format=txt`, expect: "txt" };
    if (type === "presentation") return { kind: "gslides", fetchUrl: `${base}/export?format=pdf`, expect: "pdf" };
    const gid = /[#?&]gid=(\d+)/.exec(url)?.[1];
    return { kind: "gsheet", fetchUrl: `${base}/export?format=csv${gid ? `&gid=${gid}` : ""}`, expect: "csv", sheetName: gid ? `Sheet ${gid}` : "Sheet 1" };
  }
  const drive = DRIVE_FILE.exec(url.trim());
  if (drive) {
    const id = drive[1] ?? drive[2];
    return { kind: "gdrive", fetchUrl: `https://drive.google.com/uc?export=download&id=${id}`, expect: null };
  }
  return null;
}

export function docFetchPlan(input: string): FetchPlan {
  const google = googleExportUrl(input);
  if (google) return google;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { kind: "web", fetchUrl: input.trim(), expect: null };
  }
  const host = url.hostname.toLowerCase();
  if (host === "www.dropbox.com" || host === "dropbox.com") {
    url.searchParams.delete("dl");
    url.searchParams.set("raw", "1");
    return { kind: "dropbox", fetchUrl: url.toString(), expect: null };
  }
  if (host === "1drv.ms" || host.endsWith("onedrive.live.com")) {
    url.searchParams.set("download", "1");
    return { kind: "onedrive", fetchUrl: url.toString(), expect: null };
  }
  if (host.endsWith(".sharepoint.com")) {
    url.searchParams.set("download", "1");
    return { kind: "sharepoint", fetchUrl: url.toString(), expect: null };
  }
  if (host.endsWith("notion.site") || host.endsWith("notion.so")) return { kind: "notion", fetchUrl: url.toString(), expect: "html" };
  if (host.endsWith("atlassian.net")) return { kind: "confluence", fetchUrl: url.toString(), expect: "html" };
  return { kind: "web", fetchUrl: url.toString(), expect: null };
}

/** A Google or Microsoft sign-in page where a file was expected: the file isn't shared publicly. */
export function looksLikeSignIn(finalUrl: string, body: Uint8Array, contentType: string): boolean {
  if (/accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com/.test(finalUrl)) return true;
  if (!/html/.test(contentType)) return false;
  const head = Buffer.from(body.subarray(0, 20_000)).toString("utf8");
  return /<title>[^<]*(Sign in|Sign-in|Google Drive: Sign-in|Log in)[^<]*<\/title>/i.test(head) || /ServiceLogin|accounts\.google\.com\/v3\/signin/.test(head);
}
