# v5 parity with the previous design

The admin reported that options were missing in the v5 design, Sign out among them. This table
compares every user-facing action and page in the previous design (src/components/layout/**,
src/features/admin/AdminLayout.tsx, the route trees in src/LegacyRoutes.tsx and AppShell.tsx, and
the old command palette) with v5 (src/v5/app/V5App.tsx, the learner shell in src/v5/app/shells.tsx,
the admin frame in src/v5/admin/shell/**, Me, and the motivation bell).

"Account menu" means the new avatar button at the top right of both v5 shells
(src/v5/app/UserMenu.tsx, with the menu body in UserMenuImpl.tsx, which loads lazily).

## Account (everyone)

| Previous design | Where it is in v5 | Fix |
|---|---|---|
| User menu: name, username, role | Was MISSING | Account menu, learner and admin: name, username and role (Learner, Admin or Superadmin). |
| Sign out | Was MISSING everywhere | Account menu (every screen size, both shells); Me → Settings → Your account; the admin Menu sheet on phones; the admin palette ("Sign out"). Lands on /login with "You're signed out". |
| Change password (the /change-password route; the previous design had no menu item, only the forced first sign-in) | Was MISSING | Account menu; Me → Settings → Your account; the admin Menu sheet; the admin palette. |
| Theme (light / dark) | Learner sidebar and admin sidebar (one-press toggle); Me → Settings (light, dark, match my device) | Account menu now has all three (light, dark, match my device), as the previous design's user menu did. The learner sidebar toggle moved into the menu (it cost the lesson route's budget twice). The admin sidebar toggle stays and follows changes made anywhere; the admin Menu sheet on phones has it too. |
| "Your plan" / "Admin console" in the user menu | Learner nav (My plan), learner sidebar (Admin, staff) | Account menu: Me (learner shell), Admin (staff in the learner shell), Learner view (admin shell). |
| "Try the new design" | Not needed in v5 | The reverse, "Use previous design": account menu (both shells), Me → Settings (as before), admin Menu sheet, admin palette. The standalone admin top-bar button was folded into the account menu. |
| Keyboard shortcuts (admin `?` dialog) | Admin top bar icon and `?` | Also in the account menu and the admin Menu sheet, and in the palette. The top-bar icon now shows from 640 px (the menu covers phones). The learner shell has no shortcuts dialog (the lesson has its own), so its menu leaves the item out. |
| Help | No help page exists in either design | "Help: how Oyelearn works" (replays the welcome, /learn?welcome=1) in the account menu, the admin Menu sheet and the palette. Me → Settings keeps "Replay the welcome". |
| Notification centre (top bar bell) | v5 motivation bell (learner top bar) | No change. The bell and XP now sit just left of the account menu (HostImpl placement). |

## Learner pages

| Previous design | Where it is in v5 | Fix |
|---|---|---|
| Dashboard, My plan, Library, Courses, trails, camps, topics | Today, My plan, Library, course pages, lessons (old URLs redirect) | None needed. |
| Glossary (Handbook) | Learner sidebar; Me on phones | No change. |
| Flashcards (/glossary/practice) | Route existed, only linked from inside the Glossary page | Learner sidebar "More" list; Me's link grid on phones; admin palette. |
| Classify a request (/tools/classify) | Route existed, no link | Same as Flashcards. |
| Client role-play (/practice/roleplay) | Route existed, no link | Same as Flashcards. |
| Goals and capstones (dashboard "Your goals" card, /goals/:goalId) | Was MISSING (route existed, nothing linked to it) | Me → Progress → "Your goals": each goal, done or not, and "Do the capstone" (the v5 lesson for a topic capstone, else /goals/:id). |
| Trail certificates (/report/:trackId) | Was MISSING (route existed, nothing linked to it) | Me → Progress → Certificates → "Trail certificates": one link per finished trail. v5 certificates stay listed above it. |
| Command palette (Ctrl+K: pages, trails, topics) | No learner palette in v5 | Not added: every destination is now in the nav or on Me, and Library has instant search over courses and lessons. |

## Staff pages (admin and superadmin)

| Previous design | Where it is in v5 | Fix |
|---|---|---|
| Overview, People, Onboard learner | Inbox, Overview, People, Onboard (main nav) | None needed. |
| Departments | Older pages; Menu sheet | Now also proven reachable in the palette ("Departments") by the e2e. |
| Live, Integrity events, Review requests | Older pages ("Tests happening now", "Test warnings", "Answer reviews"); Menu sheet; palette | None needed. |
| AI connection (superadmin) | More (superadmin only); Menu sheet; palette | None needed (kept from the main session's change). |
| AI usage | More; Menu sheet; palette | None needed. |
| Audit log | Older pages as "Activity log"; Menu sheet; palette | None needed. |
| Curriculum, Skill graph, Skill groups, Question library, Courses, Company SOPs, Handbook, Generated | Older pages; Menu sheet; palette | None needed. |
| "Go to learner…" (palette people mode) | Palette "People" group (search by name) | None needed. |
| Handbook, Flashcards, Classify, Role-play in the staff palette | Was MISSING | Admin palette: "Handbook and practice" group. |
| Learner view (top bar and user menu) | Top bar link from 640 px; palette | Also the account menu and the Menu sheet, so phones have it. |

## Bundle

The menu body (Radix DropdownMenu) loads 2.5 s after the shell, or at once on hover, focus or a
press. Lesson route: 198.75 KB before, 199.1 KB after (budget 200 KB).

## Files

- src/v5/app/UserMenu.tsx, src/v5/app/UserMenuImpl.tsx (new): the account menu. Radix DropdownMenu,
  keyboard accessible (arrows, Enter, Escape returns focus, type-ahead). The body loads lazily, so the
  learner routes stay inside their budget.
- src/v5/app/account.ts (new): `useSignOut`, `roleLabel`, the change-password and help paths, and the
  practice links shared by the shell, Me and the palette.
- src/v5/app/shells.tsx: the account menu in the learner header; the practice links in the sidebar
  (src/v5/app/practiceLinks.ts); the theme toggle moved into the menu; the unused Phase 0 admin shell
  removed.
- src/v5/app/userMenuLoader.ts (new): one lazy hop, so the menu's chunk list stays out of the learner
  routes' first download.
- src/v5/motivation/HostImpl.tsx: XP and bell moved left of the account menu (placement only).
- src/v5/admin/shell/AdminShell.tsx, AdminFrame.tsx: the account menu in the top bar, the "Your account"
  section at the end of the phone's Menu sheet, the "Your account" and "Handbook and practice" palette
  groups.
- src/v5/app/ThemeToggle.tsx: reads the theme from uiStore, so it follows changes made in the menu.
- src/v5/learner/me/MePage.tsx, MoreCards.tsx (new): the phone link grid with the practice pages,
  "Your account" (Change password, Sign out) in Settings, "Your goals" and "Trail certificates" in
  Progress.
- Checks: src/v5/app/account.test.ts; scripts/e2e/v5-learner-pages.ts and scripts/e2e/v5-admin.ts
  open the account menu and sign out at 390 and 1440.
