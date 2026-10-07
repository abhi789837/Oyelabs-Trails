# Rebrand progress

Resume from the first unticked item. Decisions: `DECISIONS.md`. The rulebook is `Oyelearn-Brand-Kit/Oyelearn-Brand-Guidelines.pdf` (it wins over the prompt).
Runs alongside v4.5 (`docs/v4.5/PROGRESS.md`); phases that touch the same files wait for the v4.5 commits.

## Step 0
- [x] Kit copied to `./Oyelearn-Brand-Kit/`; tag `pre-rebrand`
- [x] 0.1 Read README + full PDF; brand rules summary in DECISIONS.md

## Phase 1: Foundation
- [x] 1.1 Assets in `public/brand/` (logo, mark, app, social, loader)
- [x] 1.2 Colour tokens (kit tokens.css → global CSS/Tailwind/shadcn; brand + accent scales; no hard-coded hex; contrast 4.5:1)
- [x] 1.3 Outfit (600/400/500), JetBrains Mono for code; Sora and old fonts removed; type scale
- [x] 1.4 `src/components/brand/`: Logo, Mark, BrandLoader, ProgressRing
- [x] 1.5 `/design` updated (variants on correct backgrounds, colours, type, components, don'ts)
- [ ] 1.6 Gates + commit `feat(brand-p1)`

## Phase 2: Favicons, PWA, metadata
- [x] 2.1 Favicon set + PWA icons + manifest + head links + theme-color
- [x] 2.2 Titles "<Page> · Oyelearn", meta description, OG/Twitter (og-image-blue)
- [ ] 2.3 Gates + commit `feat(brand-p2)`

## Phase 3: Auth screens
- [x] 3.1 Sign-in split screen (desktop), mobile single column, dark mode
- [x] 3.2 Forgot/reset, first password, consent/proctoring header, error/404, logout; BrandLoader for full-page loading
- [ ] 3.3 Gates + commit `feat(brand-p3)`

## Phase 4: Shells and every screen (after v4.5 lands)
- [x] 4.1 Learner + admin shells (Logo/Mark, Admin label, tokens)
- [x] 4.2 Every old logo/"Trails"/text-logo reference replaced
- [x] 4.3 Progress visuals: ProgressRing, amber progress, trail "you are here" amber dot, summit celebration
- [x] 4.4 Empty states with the ring device; buttons/links/focus; charts
- [x] 4.5 Every page checked light/dark at 390/768/1440
- [ ] 4.6 Gates + commit `feat(brand-p4)`

## Phase 5: Certificates
- [x] 5.1 A4 landscape template exactly per kit; fit long names/titles
- [x] 5.2 Server PDF (Outfit embedded) + PNG 2×; record (unguessable id, hash, revoked); idempotent, regenerate on name change
- [x] 5.3 Learner: celebration → preview card (PDF, image, share, LinkedIn "Oyelearn – <Course>"); Me → Certificates
- [x] 5.4 Public /verify/:id branded (valid / not found / revoked)
- [x] 5.5 Admin: see, regenerate, revoke; signature name/title setting (placeholder until set)
- [x] 5.6 Report PDFs share the branded header/footer
- [ ] 5.7 Gates + commit `feat(brand-p5)`

## Phase 6: Emails, notifications, sharing
- [x] 6.1 Email template (header image, colours, footer) on every email
- [x] 6.2 Toasts/notifications with tokens; amber for certificate/level-up
- [x] 6.3 OG per page type (certificates use the certificate PNG)
- [ ] 6.4 Gates + commit `feat(brand-p6)`

## Phase 7: Clean-up, checks, deploy
- [x] 7.1 Old assets, fonts, colours and "Trails" strings removed
- [x] 7.2 Logo-rule test, certificate tests, favicon/manifest 200s, axe both themes, Playwright snapshots
- [ ] 7.3 Deploy (Abhishek runs it) + production checks (steps: `DEPLOY.md`)
- [x] 7.4 RESULTS.md + chat summary (tag `brand-v1.0` not yet: on the deployed commit)

## Needs Abhishek
- Confirm the email From name: `MAIL_FROM` decides it (docs/v5: "Email is off unless set up"); we suggest `Oyelearn <learning@oyelabs.com>` so the From name matches the header and footer. (Phase 6)
- Signature name/title for certificates: set it in Admin → Reports → Certificates → "Signature on certificates" (e.g. your name and job title). Until then certificates print "Oyelabs" over "Issued by".
- Names in non-Latin scripts: the certificate font (Outfit) covers Latin only and the image has no fallback, so such names print as missing glyphs; adding a fallback font (e.g. Noto Sans) is the fix if needed. (Phase 5/7)
- The deploy: `DEPLOY.md` (no migration; roll back to `v4.5.0`, not `pre-rebrand`), then tag `brand-v1.0` and tick 7.3. (Phase 7)
