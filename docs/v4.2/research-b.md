## Course B: White-label lifecycle (`pmp-b01` … `pmp-b12`), research key `b`

Researched 2026-10-02. The machine-readable sources are in `docs/v4.2/sources-b.json`: 21 topics, 81 ref slots (78 unique URLs, 3 to 4 per topic) and 60 video slots (58 unique ids).
- **Extra cited URLs.** Some URLs cited below are not in the JSON, for example the Play App Signing, transfer-criteria and Account Holder pages. They passed the same check and can be swapped into the JSON if needed.

How it was verified:
- **Links.** Each link was fetched with curl using full Chrome headers, `--http2`, a cookie jar and up to 3 retries. A link was kept only if it returned a final 200 and its `<title>` was the real page.
  - developer.android.com 302-loops to an OAuth auto-sign-in unless cookies are kept, so the cookie jar is required.
- **Videos.** Every video passed YouTube oEmbed with a 200, and each id came from YouTube's own search page.
- **Facts.** The facts below were read from the official pages (WebFetch, or a curl text dump) on the same day.
- **No Oyelabs facts.** Nothing below is an Oyelabs fact. "Typical" marks industry norms, not company policy.

### pmp-b01: What white-label means

**b01-core-vs-instance**
- **Definition.** A white-label product is made by one company and rebranded by another, so it appears to be the rebrander's own. ([Wikipedia](https://en.wikipedia.org/wiki/White-label_product))
- **Private label vs white label.** "Private label" is the retail term: goods made by one party and sold under a retailer's brand. ([Wikipedia](https://en.wikipedia.org/wiki/Private_label))
  - In everyday agency usage, "white label" means one generic product sold to many brands, and "private label" means the product is made for one brand only.
  - This is a usage convention, not a standard. Agencies use the two terms loosely.
- **Resellers and VARs.** A reseller resells without changing the product. A value-added reseller (VAR) adds features or services and resells it as a bundle. ([Wikipedia VAR](https://en.wikipedia.org/wiki/Value-added_reseller))
- **Tenancy models.** Microsoft describes three:
  - fully multitenant, where everything is shared;
  - vertically partitioned;
  - and single-tenant, with automated deployment of a separate stack per tenant.
  - The trade-offs are isolation, cost per tenant, operational load and how easily you can update. ([MS Learn tenancy models](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models))
  - AWS calls these "silo" (dedicated) and "pool" (shared). ([AWS SaaS Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/full-stack-silo-and-pool.html))
- **Mapping to client apps.** In a white-label mobile app business, the shared **core product** (one codebase) produces a separate **client instance** for each customer: its own branded binary, store listing, backend config and often its own database or tenant.
- **Where agencies differ.**
  - Some run one multitenant backend with a branded app per client.
  - Others deploy a full single-tenant stack per client. Isolation is higher, but so is the per-client update cost.

**b01-what-can-change**
- **Typical layers of change.**
  - Branding (name, icon, colours, fonts, splash screen).
  - Configuration (feature toggles, content, languages, currencies, payment gateway keys, domains).
  - Customisation (new code). This one changes the scope.
- **Feature toggles.** Martin Fowler classifies them as release, ops, experiment and permission toggles.
  - Per-client feature enablement is a "permission toggle", and those are long-lived.
  - Every toggle adds code paths that must be tested, so toggles are inventory with a carrying cost. ([Fowler](https://martinfowler.com/articles/feature-toggles.html))
- **Per-tenant configuration.** Microsoft's guidance covers per-tenant configuration and deployment approaches: resource-based vs config-based, and the automation each needs. ([MS Learn deployment and configuration](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/deployment-configuration))

### pmp-b02: Demo & requirement call

**b02-demo-call**
- **Discovery.** Microsoft's solution-architect training frames discovery as understanding the customer's business needs, current processes and success criteria before proposing a solution. ([MS Learn](https://learn.microsoft.com/en-us/training/modules/discover-customer-needs/))
- **GOV.UK on discovery.** It is about understanding the problem and the users, not about committing to a solution. ([GOV.UK](https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works))
- **Typical white-label demo.**
  - The PM shows the existing core product as it is.
  - They then note every request as fits out of the box, configurable, or a gap.
  - They promise nothing in the call that is not out of the box.

**b02-requirement-capture**
- **Requirements gathering.** Asana's six steps are: identify stakeholders, elicit, document, confirm, prioritise and monitor. ([Asana](https://asana.com/resources/requirements-gathering))
- **Format.** Write requirements as user stories with acceptance criteria. ([GOV.UK user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories), [Atlassian PRD](https://www.atlassian.com/agile/product-management/requirements))
- **White-label specifics to capture.** Writers should frame these as a checklist, not as a standard:
  - brand assets;
  - legal entity name and store accounts;
  - domains;
  - languages and currencies;
  - payment gateway and its keys;
  - SMS and email providers;
  - map API keys;
  - feature toggles on or off;
  - the gap list.

### pmp-b03: Gap analysis

**b03-ootb-config-custom**
- **Microsoft's two methods.** ([MS Learn fit-to-standard and fit-gap](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis))
  - **Fit-to-standard** comes first. It maps the client's processes onto the standard product and meets needs "through configuration rather than creating detailed requirements based on your legacy system". Its motto is "adopt wherever possible, adapt only where justified".
  - **Fit-gap** comes second. It identifies the remaining gaps and decides how to fill each one: customise or extend, buy a partner or ISV solution, or change the process.
- **Costs of customising.** Before customising, weigh:
  - the cost of development and maintenance;
  - the impact on usability and performance;
  - the risk that a future standard release makes the customisation **redundant**.
- **Three tiers.**
  - **OOTB:** used as is.
  - **Configuration:** settings, toggles and content, with no code. It survives upgrades.
  - **Customisation:** code changes or new modules. It carries upgrade cost.
- **Where agencies differ.** The labels vary (configuration vs extension vs customisation), but the three-tier idea is universal.

**b03-estimating-billing-gaps**
- **Course outcomes.** Microsoft's "Perform fit gap analysis" module covers:
  - determining the feasibility of requirements;
  - categorising requirements;
  - refining them from proof-of-concept insights. ([MS Learn training](https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/))
- **Typical agency practice.**
  - Each gap gets its own line item: estimate, price, and whether it goes into the core roadmap or stays client-only.
  - Gaps are billed as a fixed-price change request or as time and materials, on top of the licence or setup fee.
  - Some agencies give the gap away free if it goes into the core product and other clients will benefit. This is a commercial choice, so writers must not state an Oyelabs rule.

**b03-avoiding-custom-creep**
- **Microsoft's pitfalls list.**
  - Recreating legacy processes "leads to costly and unnecessary customizations that require more design, coding, testing, training, and documentation".
  - Heavy customisation also reduces your access to standard documentation and support. (Same MS Learn page as above.)
- **Scope creep.** Uncontrolled growth in scope after the project starts. ([Atlassian](https://www.atlassian.com/work-management/project-management/scope-creep), [Wikipedia](https://en.wikipedia.org/wiki/Scope_creep))

### pmp-b04: Collecting the brand kit

The official asset specs are below. The full listing specs are in b08.
- **Apple app icon.** Apple's HIG covers the icon, including the 1024×1024 App Store icon and layered or dark/tinted variants. ([Apple HIG app icons](https://developer.apple.com/design/human-interface-guidelines/app-icons))
- **Google Play icon.** 512×512, 32-bit PNG with alpha, 1024 KB maximum. ([Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), [Google Play icon spec](https://developer.android.com/distribute/google-play/resources/icon-design-specifications))
- **Android launcher icon.** Uses adaptive icons, built from foreground and background layers. ([Adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive))
- **Feature graphic.** 1024×500, JPEG or 24-bit PNG with no alpha. ([Play](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en))
- **Colour.** Material 3 builds colour roles from source colours, so ask for primary, secondary and neutral, with hex values. ([M3 colour](https://m3.material.io/styles/color/system/overview))
- **Brand Kit tools.** Canva's Brand Kit holds logos, colours and fonts in one place. ([Canva help](https://www.canva.com/help/brand-kit/))
- **Typical brand-kit checklist.** This is agency practice, not a standard:
  - the logo as vector (SVG, AI or PDF) plus a PNG on a transparent background;
  - the app icon master at 1024 px;
  - hex colours;
  - font files and proof the client holds the font licence;
  - splash screen;
  - the app name and its short name;
  - the tone of voice;
  - any existing brand guidelines PDF.

### pmp-b05: Client-owned accounts

**b05-accounts-ownership**
- **Apple organisation enrolment.** ([Apple enrol](https://developer.apple.com/programs/enroll/))
  - The applicant must be a legal entity. DBAs, trade names and branches are not accepted.
  - The enrolling person needs legal binding authority.
  - You need a work email on the organisation's domain and a public, working website on that domain.
  - The **organisation's legal name becomes the seller name on the App Store**.
  - The fee is US$99 a year (local prices vary). Waivers are possible for nonprofits, education and government.
- **Domains (ICANN).**
  - The **Registered Name Holder** (the registrant) and the admin contact are the only parties who can approve a transfer. The registrant's authority wins.
  - Registrars must hand over the AuthInfo code within 5 calendar days of the registrant's request.
  - A 60-day transfer lock applies after a change of registrant, unless the registrant opted out beforehand.
  - Registrars may deny a transfer within 60 days of creation.
  - ([ICANN Transfer Policy](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en), [Registrant benefits](https://www.icann.org/resources/pages/benefits-2013-09-16-en))
  - **Teaching point.** Registering the client's domain in the agency's name creates a dispute and lock risk later.
- **Signing keys (Play App Signing).** ([Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en))
  - Google holds the **app signing key**. The developer holds the **upload key**.
  - A lost upload key can be reset through Play Console.
  - A *self-managed* app signing key that is lost cannot be recovered.
  - Play App Signing has been required for new apps (AAB) since August 2021.

**b05-store-developer-accounts**
- **Apple D-U-N-S.** ([Apple D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/))
  - Required for companies. Optional for government. Not used for individuals.
  - It is free from Dun & Bradstreet.
  - D&B takes **up to 5 business days**, then Apple takes **up to 2 business days** to receive it. Typically about a week before the client can enrol.
- **Apple roles.** ([Role permissions](https://developer.apple.com/help/app-store-connect/reference/role-permissions))
  - Account Holder is the only role that can sign agreements, renew the membership or request API access.
  - Admin manages users and, on organisation teams, certificates.
  - App Manager runs app metadata, pricing and submission.
  - Other roles are Developer, Marketing, Sales, Finance and Customer Support.
  - **Typical agency setup:** the client is Account Holder, and the agency is invited as Admin or App Manager.
  - Writers should check the role table for exactly which roles may submit for review.
- **Apple Account Holder transfer.** Only the current Account Holder can transfer the role. It goes to an existing team member with legal authority, who must have 2FA and pass ID verification. ([Apple](https://developer.apple.com/help/account/access/transfer-the-account-holder-role/))
- **Google Play accounts.** ([Play account info](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en))
  - Organisation accounts need a D-U-N-S number, which Google says "can take up to 30 days" to get.
  - They also need an organisation website, a verified email and a verified phone number.
  - Personal accounts created after 13 Nov 2023 must run a closed test with **at least 12 testers opted in for 14 consecutive days** before they can apply for production access. ([Play testing requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en))
  - **Teaching point:** clients should open an *organisation* account.
- **Play users and permissions.** ([Play users and permissions](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en))
  - The account owner is the first registered account, and only the owner controls the Payments settings.
  - Admin has all permissions.
  - Permissions can be set for the whole account or per app, for example "Release to production", "Manage store presence" and "View financial data".
- **App transfer, Apple.** ([criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria))
  - At least one version must have been released.
  - The app must not be in review or in pending states, and must not be on pre-order.
  - Both parties must have accepted the latest agreements.
  - In-app purchase product IDs must not clash with any in the recipient's account.
- **App transfer, Google Play.** ([Play transfer](https://support.google.com/googleplay/android-developer/answer/6230247?hl=en))
  - You need the registration transaction IDs of both accounts.
  - Users, ratings, reviews, subscriptions and the store listing all move across.
  - Test groups, promotions and reports do not move. Download the reports first.
  - Google support replies within 2 business days.
- **Typical recommendation.** Publish under the client's own accounts from day one. That avoids a transfer later, and it is also what Apple's guideline 4.2.6 expects (see b09).

### pmp-b06: Configuration & custom modules

**b06-configuration-setup**
- **Config outside the code.** Twelve-Factor says to store config in the environment, kept strictly apart from code. ([12factor](https://12factor.net/config))
- **Android product flavors.** ([Build variants](https://developer.android.com/build/build-variants))
  - Flavors build different versions of one app.
  - Each flavor can set its own `applicationId`, plus source sets for its own resources: logos, strings, colours.
  - The flavor's source set overrides `main`.
- **iOS.** Use `.xcconfig` build configuration files and separate targets or schemes. ([Apple xcconfig](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project), [Apple targets](https://developer.apple.com/documentation/xcode/configuring-a-new-target-in-your-project))
- **Feature flags.** OpenFeature is a vendor-neutral standard for feature flag APIs. ([OpenFeature](https://openfeature.dev/docs/reference/intro))

**b06-custom-modules-as-crs**
- **Change control.** A change request goes through: submission, impact assessment (scope, time, cost), approval or rejection, then implementation and records. ([Asana change control](https://asana.com/resources/change-control-process), [Wikipedia Change request](https://en.wikipedia.org/wiki/Change_request))
- **Teaching point.** In a white-label project, each custom module should be a separately estimated and approved CR. The CR should state:
  - whether the module merges into the core;
  - who owns the code;
  - its upgrade cost.
  Microsoft's "extend without compromising performance" guidance supports this. ([MS Learn](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution))

### pmp-b07: Rebranded builds, QA & UAT

- **TestFlight.** ([TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview))
  - Up to **100 internal testers**, who must be App Store Connect users.
  - Up to **10,000 external testers**.
  - Builds are testable for **90 days**.
  - The first build sent to external testers goes through **beta app review**.
- **Google Play testing tracks.** Internal, closed and open testing are set up in Play Console. ([Play testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en))
- **UAT.** ISTQB defines user acceptance testing as acceptance testing by the intended users, to decide whether to accept the system. ([ISTQB](https://glossary.istqb.org/en_US/term/user-acceptance-testing))
- **Typical rebrand QA checklist.**
  - App name, icon and splash.
  - Colours on every screen.
  - Bundle ID or applicationId.
  - Deep links and associated domains.
  - Push credentials per client.
  - Payment keys in live mode.
  - Legal URLs (privacy policy and terms).
  - The support email.
  - No other client's or the demo brand's strings or assets left in.

### pmp-b08: Store listing preparation

**b08-listing-assets**
- **Apple screenshots.** ([Screenshot specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications))
  - 1 to 10 per device size, in JPEG or PNG with no alpha.
  - The **6.9" iPhone size is required**, for example 1320×2868 portrait. 6.5" screenshots are the fallback, for example 1284×2778.
  - **13" iPad** screenshots are required if the app runs on iPad, for example 2064×2752.
- **Apple text fields.**
  - Name is 2 to 30 characters. Subtitle is up to 30.
  - **Bundle ID cannot change after a build is uploaded.**
  - SKU cannot change after the app is added.
  - ([App information](https://developer.apple.com/help/app-store-connect/reference/app-information))
  - Description is up to 4000 characters. Keywords are 100 bytes. Promotional text is up to 170 characters.
  - App previews: up to 3 per localisation per device size.
  - App Review notes are up to 4000 bytes.
  - A sign-in demo account is required if the app has a login.
  - ([Platform version info](https://developer.apple.com/help/app-store-connect/reference/platform-version-information))
- **Google Play listing.** ([Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en))
  - App name up to 30 characters, short description up to 80, full description up to 4000. ([Play create app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en))
  - Screenshots: at least 2, between 320 and 3840 px, with the long side no more than 2× the short side.
  - For "high-quality" eligibility you need 4 or more at 1080 px or above.
  - Feature graphic 1024×500. Icon 512×512.
  - The preview video is a YouTube URL.
- **Package names are permanent.** "Package names can't be deleted or re-used." (Same Play create-app page.)
- **Changing the applicationId.** Google says to never change it after publishing. "Google Play Store treats the upload as a completely different app." ([Configure app module](https://developer.android.com/build/configure-app-module))
- **Teaching point.** Fix each client's bundle ID and package name, using the client's reverse domain (`com.clientbrand.app`), *before* the first upload.

**b08-privacy-review-guidelines**
- **Apple 5.1.1(i).** Every app must link its privacy policy both in App Store Connect and inside the app. The policy must:
  - list the data collected and how it is used;
  - confirm that third parties give equal protection;
  - explain retention, deletion and how users revoke consent.
  ([Guidelines](https://developer.apple.com/app-store/review/guidelines/))
- **Apple App Privacy details.** ([App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/))
  - Required for new apps and updates.
  - They must include data collected by **third-party SDKs**.
  - Disclosure is optional only if all four of Apple's optional-disclosure criteria are met.
  - They can be updated without a new build, and the developer is responsible for keeping them accurate.
- **Apple privacy manifests.** These declare required-reason APIs and SDK data use. ([Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files))
- **Google Data safety form.** ([Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en))
  - Required for *all* published apps, including those on closed and open tracks, and even apps that collect no data.
  - A privacy policy is mandatory.
  - The developer is responsible for third-party SDK data.
  - Google's review "is not designed to verify" the declarations. Inaccuracy can lead to blocked updates or removal.
  - Related: the [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).
- **White-label point.** The client is the data controller and publisher, so each client needs its own privacy policy URL and its own declarations. Copying another client's declarations is risky if the SDKs differ.

### pmp-b09: Submission, rejection & resubmission

**b09-submission**
- **Apple review time.** "On average, 90% of submissions are reviewed in less than 24 hours." ([Apple App Review](https://developer.apple.com/distribute/app-review/))
  - Complex apps or repeat violations take longer.
  - An **expedited review** can be requested for critical bug fixes or event-tied launches.
  - Once released, an app can take **up to 24 hours** to appear on all storefronts. (Guidelines, "After You Submit".)
  - **Typical:** plan for 1 to 3 days, including one possible rejection cycle.
- **Google review time.** "For certain developer accounts… review times of up to seven days or longer in exceptional cases." ([Publish your app](https://support.google.com/googleplay/android-developer/answer/9859751?hl=en))
  - Managed publishing lets you control when approved changes go live.
  - Provide app access instructions (up to 5 sets) for any login-gated parts. ([Prepare for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en))
  - **Typical:** a few days. New accounts and first releases take longer.
- **Guideline 2.1(a).** Submit final builds with no placeholder content. Include demo account details and "turn on your back-end service". (Guidelines.)

**b09-rejections** (this matters a lot for white-label)
- **Apple 4.2.6, quoted.** "Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content. These services should not submit apps on behalf of their clients and should offer tools that let their clients create customized, innovative apps that provide unique customer experiences. Another acceptable option for template providers is to create a single binary to host all client content in an aggregated or 'picker' model…" ([Guidelines](https://developer.apple.com/app-store/review/guidelines/))
  - **Practical consequence:** each white-label app should be submitted from the *client's own* developer account, as the content provider, and should be meaningfully customised.
- **Apple 4.3(a) Spam.** Don't create multiple Bundle IDs of the same app. Consider a single app with variations instead.
- **Apple 4.3(b) Spam.** Don't submit apps that are indistinguishable from apps already widely available. (Guidelines.)
  - These are the usual rejections for near-identical white-label clones.
- **Apple 5.2.** Apps must be submitted by the person or legal entity that owns or has licensed the IP. (Guidelines.)
- **Google Play Spam policy, Repetitive Content.** It disallows "creating multiple apps with highly similar functionality, content, and user experience". It suggests aggregating small apps into one. Webview apps of a site are not allowed without the site owner's permission. ([Play Spam](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en))
- **Handling a rejection, Apple.** ("After You Submit" in the guidelines, plus [Reply to App Review messages](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages) and [statuses](https://developer.apple.com/help/app-store-connect/reference/app-and-submission-statuses))
  - Reply to App Review in App Store Connect. This is the old "Resolution Center".
  - If you disagree, submit an appeal.
  - **Bug-fix submissions** for apps already live are not delayed over guideline issues, except legal or safety issues. Ask for this in your reply and fix the issue in the next submission.
  - Repeated rejections for the same guideline make later reviews longer.
- **Google policy status.** Check it in Play Console. ([Policy status](https://support.google.com/googleplay/android-developer/answer/9842754?hl=en))

### pmp-b10: Go-live, licence & support plan

- **Apple phased release (updates only).**
  - The schedule is day 1 1%, day 2 2%, day 3 5%, day 4 10%, day 5 20%, day 6 50%, day 7 100%.
  - You can pause for up to 30 days in total.
  - Anyone can still download the update manually. ([Phased release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases))
- **Google staged rollout.**
  - You set a percentage, and it does not increase on its own.
  - You can increase or halt the rollout.
  - It is **not available for the first release**. ([Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en))
- **Pricing models.** Microsoft lists:
  - consumption;
  - per-user;
  - per-active-user (MAU);
  - per-unit (for example per store or device);
  - feature or service-level tiers, where tiers can carry different SLAs such as 99.9% vs 99.99%;
  - freemium;
  - cost of goods sold;
  - flat-rate, which is easy to sell but becomes unprofitable with heavy users.
  - It also recommends usage limits and discounted non-production environments, and warns about "bill shock" when changing models. ([MS Learn pricing models](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/pricing-models), [Stripe](https://stripe.com/resources/more/saas-pricing-models-101))
- **Typical white-label commercial shapes.** Agencies differ widely here. Writers should present these as options, not as Oyelabs policy:
  - a one-time setup or licence fee plus an annual or monthly licence or subscription;
  - a perpetual licence plus an annual maintenance contract (AMC);
  - a revenue share;
  - or source-code purchase, where a source-code escrow may protect a client on a non-source licence. ([Escrow](https://en.wikipedia.org/wiki/Source_code_escrow))
- **SLAs** define response and resolution targets per severity. ([Atlassian SLA](https://www.atlassian.com/itsm/service-request-management/slas))

### pmp-b11: Core product upgrades

**b11-version-sync**
- **Microsoft on updating tenants.** ([MS Learn updates](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/updates))
  - Decide "how many versions… can you reasonably maintain". A hotfix may have to be applied to every version in use.
  - If tenants may defer updates, allow a temporary opt-out but not a permanent one, with a deadline.
  - Roll out with deployment stamps, feature flags and **deployment rings** (canary, early adopter, users).
  - Support teams must know which version each tenant is running.
- **Forks.** GitHub's fork-sync docs show the mechanics of pulling upstream changes into a fork. ([Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork))
- **SemVer.** MAJOR means breaking, MINOR means compatible features, PATCH means fixes. Use it to tell clients what an upgrade means. ([semver.org](https://semver.org/))

**b11-customisation-debt**
- **How conflicts arise.** Merge conflicts happen when the same lines, or a deleted file, are changed on both sides. ([GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts))
  - The longer a client fork diverges from the core, the more conflicts each core release brings.
- **Mitigations.**
  - Branch by Abstraction, to keep changes behind interfaces. ([Fowler](https://martinfowler.com/bliki/BranchByAbstraction.html))
  - `git rerere`, to reuse recorded conflict resolutions. ([git-rerere](https://git-scm.com/docs/git-rerere))
  - Configuration and flags instead of forks.
  - ([Fowler branching patterns](https://martinfowler.com/articles/branching-patterns.html), [Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html))
- **Microsoft's warning.** Customisations can become redundant once a standard release covers the need. (MS Learn fit-gap page.)
- **Teaching point.** Every per-client code fork multiplies the cost of each core upgrade, so it is a debt to be priced in the CR.

### pmp-b12: Running many white-label clients

- **fastlane.**
  - `match` shares code-signing certificates and profiles across a team through a private repo or storage.
  - `deliver` uploads App Store metadata and screenshots.
  - `supply` uploads Google Play metadata, binaries and screenshots.
  - Together they make per-client listings repeatable. ([match](https://docs.fastlane.tools/actions/match/), [deliver](https://docs.fastlane.tools/actions/deliver/), [supply](https://docs.fastlane.tools/actions/supply/))
- **CI matrix builds.** One workflow can build every client flavor. ([GitHub Actions matrix](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations))
- **Tenant life cycle.** Covers onboarding, updates, moving between tiers and offboarding, including data retention when a client leaves. ([MS Learn tenant life cycle](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenant-life-cycle))
- **Typical portfolio artefacts.** These are agency practice:
  - a client register: accounts and owners, bundle IDs, versions, licence renewal dates, flags on or off, and custom modules;
  - a per-client config repo or folder;
  - standard listing and privacy templates;
  - a release calendar using rings.

### Thin spots and blockers
- **Thin topics.**
  - b03-estimating-billing-gaps has 2 videos, and both are ERP fit-gap videos.
  - b05-accounts-ownership has 2 videos.
  - b06-configuration-setup has 2 videos.
- **Gaps in official coverage.**
  - No official source on "demo call" technique was found. That topic uses MS Learn discovery, GOV.UK discovery and Gong.
  - No video specifically on guideline 4.2.6 was found. b09 uses 4.3 spam-rejection videos.
- **Blocked sites.**
  - w3.org WAI and indeed.com were behind a Cloudflare challenge (403).
  - pmi.org returned an empty or challenge title, so it was dropped.
  - ServiceNow docs is an SPA where every path returns 200, so it was unverifiable and dropped.
  - developer.android.com needs a cookie jar to get past an OAuth redirect loop.
  - Two video ids had embedding disabled (oEmbed 401) and were dropped: `p-EtEFTRqgQ`, `VsyTdasKINE`.
