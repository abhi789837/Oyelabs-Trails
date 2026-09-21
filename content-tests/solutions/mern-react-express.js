/**
 * Predict what the browser does with one fetch() from the React app to the API.
 *
 * @param {{
 *   browser: "chrome" | "safari",
 *   pageUrl: string,
 *   publicSuffixes: string[],
 *   request: { url: string, method: string, headers?: Record<string, string>, credentials?: "omit" | "same-origin" | "include" },
 *   cookie: null | { name: string, domain: string, hostOnly: boolean, path: string, secure: boolean, sameSite: "Strict" | "Lax" | "None" | null },
 *   server: null | { origin: "*" | string | string[] | null, credentials?: boolean, methods?: string[], allowedHeaders?: string[] },
 * }} scenario
 * @returns {{ crossOrigin: boolean, crossSite: boolean, preflight: boolean, cookieSent: boolean, readable: boolean, blockedBy: null | "preflight" | "cors" }}
 */
function analyzeRequest(scenario) {
  const { browser, pageUrl, publicSuffixes, request, cookie, server } = scenario;
  const page = new URL(pageUrl);
  const target = new URL(request.url);
  const credentials = request.credentials ?? "same-origin";
  const method = request.method.toUpperCase();
  const headers = request.headers ?? {};

  const crossOrigin = page.origin !== target.origin;
  const siteOf = (u) => u.protocol + "//" + registrableDomain(u.hostname, publicSuffixes);
  const crossSite = siteOf(page) !== siteOf(target);

  const SAFE_METHODS = ["GET", "HEAD", "POST"];
  const SAFE_HEADERS = ["accept", "accept-language", "content-language", "content-type"];
  const SAFE_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
  const unsafeHeaders = Object.keys(headers)
    .map((name) => name.toLowerCase())
    .filter((name) => {
      if (!SAFE_HEADERS.includes(name)) return true;
      if (name !== "content-type") return false;
      const value = Object.entries(headers).find(([k]) => k.toLowerCase() === "content-type")[1];
      return !SAFE_TYPES.includes(String(value).split(";")[0].trim().toLowerCase());
    });
  const preflight = crossOrigin && (!SAFE_METHODS.includes(method) || unsafeHeaders.length > 0);

  const corsOk = () => {
    if (!server || server.origin === null || server.origin === undefined) return false;
    let allowOrigin = null;
    if (server.origin === "*") allowOrigin = "*";
    else if (Array.isArray(server.origin)) allowOrigin = server.origin.includes(page.origin) ? page.origin : null;
    else allowOrigin = server.origin;
    if (allowOrigin === null) return false;
    if (allowOrigin === "*") return credentials !== "include";
    if (allowOrigin !== page.origin) return false;
    return credentials !== "include" || server.credentials === true;
  };

  if (preflight) {
    let ok = corsOk();
    if (ok && !SAFE_METHODS.includes(method)) {
      const methods = (server.methods ?? ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]).map((m) => m.toUpperCase());
      ok = methods.includes(method) || (methods.includes("*") && credentials !== "include");
    }
    if (ok && server.allowedHeaders !== undefined) {
      const allowed = server.allowedHeaders.map((h) => h.toLowerCase());
      ok = unsafeHeaders.every(
        (h) => allowed.includes(h) || (allowed.includes("*") && credentials !== "include" && h !== "authorization"),
      );
    }
    if (!ok) return { crossOrigin, crossSite, preflight, cookieSent: false, readable: false, blockedBy: "preflight" };
  }

  const cookieSent = sendsCookie();
  const readable = !crossOrigin || corsOk();
  return { crossOrigin, crossSite, preflight, cookieSent, readable, blockedBy: readable ? null : "cors" };

  function sendsCookie() {
    if (!cookie) return false;
    if (credentials === "omit") return false;
    if (credentials === "same-origin" && crossOrigin) return false;
    if (cookie.sameSite === "None" && !cookie.secure) return false; // rejected when it was set
    const host = target.hostname;
    const domainOk = cookie.hostOnly ? host === cookie.domain : host === cookie.domain || host.endsWith("." + cookie.domain);
    if (!domainOk) return false;
    if (!pathMatches(target.pathname, cookie.path ?? "/")) return false;
    if (cookie.secure && target.protocol !== "https:" && host !== "localhost") return false;
    if (crossSite) {
      if ((cookie.sameSite ?? "Lax") !== "None") return false;
      if (browser === "safari") return false;
    }
    return true;
  }
}

function registrableDomain(host, suffixes) {
  if (host === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
  let best = null;
  for (const s of suffixes) {
    if ((host === s || host.endsWith("." + s)) && (best === null || s.length > best.length)) best = s;
  }
  if (best === null || host === best) return host;
  const rest = host.slice(0, host.length - best.length - 1).split(".");
  return rest[rest.length - 1] + "." + best;
}

function pathMatches(requestPath, cookiePath) {
  if (requestPath === cookiePath) return true;
  if (!requestPath.startsWith(cookiePath)) return false;
  return cookiePath.endsWith("/") || requestPath[cookiePath.length] === "/";
}
