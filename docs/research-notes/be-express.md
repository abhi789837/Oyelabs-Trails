# Express.js research notes (2026-09-21)

## Videos

Main source, verified with `yt.mjs info Oe421EPjeBE --chapters`: "Node.js and Express.js - Full Course" (freeCodeCamp.org, John Smilga, 8:16:47, published 2021-04-01, embeddable). The Node.js Core module uses its Node chapters (up to "Http Basics" at 4:03:25). This module uses the Express chapters from 4:48:02 on. Chapter titles in the description start with a zero-width space and `)`, so the `chapterLabel`s use the clean titles.

- express-routing-fundamentals: Smilga full course, from "Express Basics" at 4:51:50 (17510). It covers `app.get/all/use/listen` and the 404 fallback. Alternate: Web Dev Simplified, "Learn Express JS In 35 Minutes" (36:03), from "Routers" at 11:04 (664).
- express-middleware-pipeline: Smilga full course, from "Middleware - Setup" at 6:10:46 (22246). Alternate: Web Dev Simplified, "Learn Express Middleware In 14 Minutes" (14:48).
- express-app-use-ordering: Smilga full course, from "APP.USE" at 6:21:27 (22887).
- express-params-query: Smilga full course, from "Route Params" at 5:39:13 (20353). The chapter runs on through "Query String". Alternate: Traversy Media, "Express Crash Course" (1:46:10, 2024), from "Request Params (req.params)" at 26:30 (1590).
- express-http-methods: Smilga full course, from "Methods - GET" at 6:43:26 (24206). GET, POST, PUT and DELETE follow as consecutive chapters.
- express-error-handling: Traversy Media, "Express Crash Course" (1:46:10, 2024), from "Custom Error Handler" at 1:00:24 (3624). The Smilga full course has no error-middleware chapter. Alternate: Academind, "Express.js 5 is here" (9:58, Oct 2024), from "Promise support" at 4:47 (287), for the Express 5 async-error change.
- express-static-templating: Smilga full course, from "Express - All Static" at 5:14:31 (18871). Alternate: Traversy "Express Crash Course", from "EJS Template Engine Setup" at 1:36:00 (5760), because the Smilga course doesn't cover templating.
- express-file-uploads-multer: Chai aur Code (Hitesh Choudhary), "How to upload file in backend | Multer" (38:20, 2023). The brief suggested Hitesh for uploads. The video is in Hindi. Alternates: Piyush Garg, "Uploading Files with NodeJS and Multer" (14:11, also Hindi), and James Q Quick, "How to Upload Files in Node.js Using Express and Multer" (6:51, English).
- express-crud-rest-api (milestone): freeCodeCamp, "Node.js / Express Course - Build 4 Projects" (Smilga, 10:00:07, verified id `qwfE7fSVaZM`), from "Project 1: Task Manager" at 2:59 (179). That's a full CRUD REST API project (Express + MongoDB). Alternates: the Smilga full course from "Express Router - Setup" at 7:50:05 (28205), and Piyush Garg, "Building REST API's using Node and Express.js" (20:27).
- No search-URL fallbacks.
- The Smilga course is Express 4 era. The summaries and quizzes point out where Express 5 differs (async errors, path syntax, `req.body`, the query parser).

## References

- The expressjs.com site was rebuilt. Every `*.html` URL redirects to a trailing-slash URL (for example `/en/guide/routing.html` goes to `/en/guide/routing/`), so the final URLs are used. The versionless `/en/guide/...` pages are the v5 docs, and the API reference is at `/en/5x/api/{application,request,response,router}/`.
- These refuse iframe previews: MDN (`X-Frame-Options: DENY`), GitHub repos (`frame-ancestors 'none'`), stripe.com (CSP). expressjs.com, rfc-editor.org, OWASP cheat sheets, ejs.co and opensource.zalando.com allow framing.
- The OWASP WSTG HTTP Parameter Pollution page returned 404, so it's not used. nvd.nist.gov blocks scripted requests, so CVE-2022-29078 was checked through the MITRE CVE API instead.
- RFC 9110 deep links use the RFC HTML's own anchors (`#name-method-definitions`, `#name-conditional-requests`), confirmed in the page source.

## Facts verified

I installed express 5.2.1 (router 2.2.0, path-to-regexp 8.4.2, body-parser 2.3.0, serve-static 2.2.1), multer 2.4.0, ejs and supertest in a scratch project and ran each behaviour below through Supertest.
- Rejected promises and sync throws reach 4-arg error middleware. `throw 'string'` passes the string itself. `Promise.reject()` with no reason becomes `Error('Rejected promise')` (router `layer.js`).
- Error handlers are detected by `fn.length === 4`, and regular handlers need `fn.length <= 3`. A 3-arg "error handler" falls through to the default HTML 500. An error handler registered before the routes is never reached.
- Express's default handler uses `err.status`/`err.statusCode`, and a 302 becomes 500. In production the body is only the status text, but the stack is still logged unless `env === 'test'`. `next(err)` after `res.write()` makes the default handler close the socket (the client sees ECONNRESET).
- Path syntax: `/*splat` gives `req.params.splat` as an array of segments and doesn't match `/`. `/{*splat}` matches `/`. Braces make a group optional. `?`, `(`, `+`, an unnamed `*` and an unbalanced `{` all throw at registration. Unmatched optional params are omitted. Matching is case-insensitive and allows one trailing slash. Malformed escapes produce a 400 "Failed to decode param '...'". The challenge's reference matcher was diffed against the real path-to-regexp 8.4.2 `match()` (with router 2's options) over ~80 pattern/path pairs, all identical, including every test case.
- `req.body` is `undefined` without a parser, or when the Content-Type doesn't match (for example `text/plain`). `express.json()` is strict: a primitive `"hello"` is a 400 `entity.parse.failed`. `express.urlencoded()` has `extended: false` by default. The body-parser default `limit` is 100kb.
- `req.query` uses the "simple" parser (`node:querystring`), so brackets stay literal and duplicate keys become arrays. It's a getter that re-parses on every access: a mutation is lost, and assigning `req.query = ...` throws a TypeError in ESM. The challenge test cases were cross-checked against Node's `querystring.parse`, including the `maxKeys` counting.
- `app.use('/api')` matches `/api`, `/api/`, `/api/users` and `/API/users`, but not `/apiv2`. Inside it, `req.baseUrl` is `/api`, `req.path` is `/users` and `req.originalUrl` is the full URL. `app.all('/x')` doesn't match `/x/sub`. `mergeParams` is needed for parent params, and `req.baseUrl` is the concrete matched prefix. `next('router')` falls back to app-level routes. `router.param` runs once per request.
- `res.send(404)` sends body `404` as JSON with status 200. `res.status(1000)` and `res.status("200")` throw, while `res.status(999)` is accepted. `app.del`, `req.param` and `res.sendfile` are undefined. `req.host` includes the port.
- A missing `return` after `res.json()` followed by `res.sendStatus(204)` throws ERR_HTTP_HEADERS_SENT into the error handler. A second `res.end()` is silently ignored.
- HEAD runs the GET handler. OPTIONS gets an automatic 200 with `Allow: GET, HEAD, POST`. An unknown method gets 404, not 405.
- `express.static` resolves the root with `path.resolve` (the cwd). `dotfiles` defaults to 'ignore', including `/.well-known`. The default is `Cache-Control: public, max-age=0`. `fallthrough: false` produces a 404 error whose message contains the absolute path, and gives 405 with `Allow: GET, HEAD` for POST. A directory without its trailing slash gets a 301. `sendFile` with `root` returns 403 for `..`, while `path.join` plus `sendFile` leaks the file.
- The `view cache` is enabled when `NODE_ENV=production` (application.js). The locals merge order is app.locals, then res.locals, then the render options. EJS `<%=` escapes and `<%-` doesn't. CVE-2022-29078 (EJS 3.1.6, `settings[view options][outputFunctionName]`) was confirmed via the MITRE API.
- Multer 2.4.0: `mimetype` and `originalname` are client-supplied, so a spoofed PHP file labelled `image/png` passed a mimetype filter. `originalname` is the basename unless `preservePath` is set. A `fileFilter` returning false leaves `req.file` undefined without an error. `LIMIT_FILE_SIZE` and `LIMIT_UNEXPECTED_FILE` are MulterErrors. `dest` gives random extension-less names. A multipart request without Multer leaves `req.body` undefined.
- RFC 9110: which DELETE status codes are allowed (202/204/200), strong comparison for `If-Match`, `*` semantics, and precondition evaluation after other 4xx checks but before content processing. The CRUD challenge follows that order.
