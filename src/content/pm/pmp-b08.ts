import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b08",
  trackId: "pm",
  name: "Store listing preparation",
  description:
    "Getting each white-label client's App Store and Google Play listing ready: the assets and text limits, the identifiers you can never change, the privacy policy and data declarations, and the review notes that keep a reviewer from rejecting a working app.",
  topics: [
    {
      id: "pmp-b08-listing-assets",
      moduleId: "pmp-b08",
      trackId: "pm",
      title: "Store listing assets and identifiers",
      summary:
        "The store listing is the first thing the client's customers see, and the first thing the store reviewer checks. For a [[term:white-label]] app it is also where copy-paste does the most damage. A description lifted from the demo listing, screenshots that show another brand, or a support URL on Oyelabs' domain all tell the reviewer that this is a template app, and they tell the client that we did not care.\n\nThe listing has three kinds of input. **Identity**: the app name, the [[term:bundle-id]] and the [[term:package-name]], which are permanent once used. **Assets**: icons, screenshots, the Google Play feature graphic and optional preview videos, each with exact size rules. **Text and links**: subtitle, descriptions, keywords, the support contact and the [[term:privacy-policy-url]]. Together these are the [[term:store-listing-assets]].\n\nThe client owns the words and the brand. Oyelabs' designer usually produces the screenshots and graphics, and the PM completes the store forms in the [[term:client-owned-accounts]]. Ask for the listing text early, in the brand-kit stage, because it is the item clients most often deliver late.\n\nThe common mistake is treating the listing as a last-day task. Screenshots need final rebranded builds, the iPhone and iPad sizes are strict, and a missing demo account for the reviewer can cost a full review cycle. Start the listing as soon as UAT builds are stable.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "App Store Connect Help: Screenshot specifications", url: "https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications", kind: "docs", verifiedAt: "2026-10-02T11:46:15Z" },
        { label: "App Store Connect Help: App information (name, subtitle, bundle ID, SKU)", url: "https://developer.apple.com/help/app-store-connect/reference/app-information", kind: "docs", verifiedAt: "2026-10-02T11:46:23Z" },
        { label: "Play Console Help: Add preview assets to showcase your app", url: "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:29Z" },
        { label: "Android Developers: Configure the app module (applicationId)", url: "https://developer.android.com/build/configure-app-module", kind: "docs", verifiedAt: "2026-10-02T11:48:46Z" },
      ],
      video: {
        title: "How to Create App Store Screenshots - Fast & Easy",
        channel: "Sean Allen",
        url: "https://www.youtube.com/watch?v=-7YHPpqaVFY",
        videoId: "-7YHPpqaVFY",
        verifiedAt: "2026-10-02T12:00:45Z",
      },
      alternateVideos: [
        {
          title: "App icon design specifications for Store Listing. Design and upload an app icon in Play Console.",
          channel: "iRekha Tech Solutions",
          url: "https://www.youtube.com/watch?v=CFhw7qFSpKI",
          videoId: "CFhw7qFSpKI",
          verifiedAt: "2026-10-02T12:00:46Z",
        },
        {
          title: "How To Create Android App Feature Graphic For Google Play Store | Google Play Console",
          channel: "SHAAD DEV STUDIO",
          url: "https://www.youtube.com/watch?v=YpRtH2eaaBg",
          videoId: "YpRtH2eaaBg",
          verifiedAt: "2026-10-02T12:00:47Z",
        },
      ],
      handbook: {
        stages: ["wl-store-listing"],
        rules: ["client-owned-store-accounts"],
      },
      sections: [
        {
          heading: "Identifiers you can never change",
          body:
            "Three values are permanent, so they must be right before anything is uploaded:\n\n- **Apple bundle ID.** It cannot change after a build has been uploaded for the app record.\n- **Apple SKU.** An internal reference that cannot change after the app is added.\n- **Google package name** (the `applicationId`). Package names cannot be deleted or reused, and Google says never to change it after publishing: an upload with a new one is treated as a completely different app, with no users, ratings or reviews.\n\nFor white-label, use the client's own reverse domain, for example `com.clientbrand.app`, not a name that contains Oyelabs or the demo product. A bundle ID with the agency's name tells the reviewer this is a template app, and it is awkward forever after.",
        },
        {
          heading: "Apple: the assets and limits",
          body:
            "- **Screenshots:** 1 to 10 per device size, JPEG or PNG with no transparency. The 6.9\" iPhone size is required (for example 1320×2868 portrait); 6.5\" screenshots (for example 1284×2778) are the fallback. If the app runs on iPad, 13\" iPad screenshots are required too (for example 2064×2752).\n- **App previews:** optional videos, up to 3 per localisation per device size.\n- **Name:** 2 to 30 characters. **Subtitle:** up to 30.\n- **Description:** up to 4000 characters. **Keywords:** 100 bytes. **Promotional text:** up to 170 characters, and it can change without a new version.\n- **App Review information:** notes up to 4000 bytes, contact details, and a demo account if the app has a sign-in.\n\nThe iPad rule catches white-label teams out. If the core project allows iPad, the rebranded app does too, and the listing needs iPad screenshots even if the client never thought about tablets.",
        },
        {
          heading: "Google Play: the assets and limits",
          body:
            "- **App name:** up to 30 characters. **Short description:** up to 80. **Full description:** up to 4000.\n- **App icon:** 512×512.\n- **Feature graphic:** 1024×500. It appears at the top of the listing, so it should carry the client's brand, not a generic phone mock-up.\n- **Screenshots:** at least 2, each side between 320 and 3840 pixels, and the long side no more than twice the short side. For the larger \"high-quality\" placements you need 4 or more at 1080 pixels or above.\n- **Preview video:** a YouTube URL, not an uploaded file.\n\nMetadata that differs per client but follows the same shape is a good candidate for templates and automation once you run several clients (see the portfolio module).",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label grocery app rebranded for a client in Oman.*\n\n1. **Day 1 of the brand-kit stage.** The PM sends the client a listing-content request: app name (max 30), subtitle, short and full description, keywords, support email, marketing URL, privacy policy URL on the client's domain. Deadline: before UAT ends.\n2. **During UAT.** The designer captures screenshots from the final rebranded build in English and Arabic, at 6.9\" iPhone and 13\" iPad sizes (the core supports iPad), plus Play screenshots at 1080×1920 and a 1024×500 feature graphic in the client's colours.\n3. **Text review.** The client's draft description mentions \"same-day delivery across the GCC\". The client only delivers in Muscat. The PM flags it: a claim the app cannot back up is a reviewer and customer risk.\n4. **Store forms.** The PM fills the listing in the client's App Store Connect and Play Console (Oyelabs has App Manager and admin-level access), adds review notes explaining the OTP login, and creates a demo account with a fixed test OTP for the reviewer.\n5. **Final check.** The PM compares every field against the brand kit and searches the text for \"FreshCart\", the demo brand. None found. The listing is ready the day UAT is signed.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Text copied from the demo or another client.** Rewrite it with the client. Near-identical listings across clients add to the \"spam\" risk covered in the rejections topic.\n- **Wrong identifier already used.** On Apple, create a new app record with the right bundle ID before submission; on Google, create a new app with the right package name. Do it before launch: afterwards it means losing users and reviews.\n- **No iPad screenshots for an app that supports iPad.** Either produce them or have the developers turn off iPad support for this client's build, a product decision to agree with the tech lead.\n- **No demo account for the reviewer.** Expect a rejection under the completeness guideline. Always supply one, with any OTP or two-factor step explained.\n- **The listing text arrives on launch day.** Ask for it at the brand-kit stage and log it as a [[term:client-dependency]] with a date in the [[term:raid-log]].",
        },
        {
          heading: "Your checklist",
          body:
            "- Bundle ID, package name and SKU are the client's and agreed before the first upload.\n- iPhone 6.9\" (or 6.5\") screenshots, and 13\" iPad screenshots if the app runs on iPad.\n- Play icon 512×512, feature graphic 1024×500, at least 2 screenshots within the size rules (4+ at 1080 px or more for high-quality placements).\n- Names and descriptions within the limits, written or approved by the client.\n- No demo-brand or other-client text or images anywhere.\n- Support contact and privacy policy URL on the client's own domain.\n- Review notes and a working demo account for any login.",
        },
      ],
      sop: [
        {
          title: "Our listing-content request and screenshot process",
          prompt:
            "[Oyelabs SOP – admin to fill] The listing-content request sent to white-label clients (fields, languages, deadline), who designs screenshots and graphics, the screenshot device list per product, and where final listing assets are stored per client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b08-listing-assets-q1",
          prompt: "Which of these cannot be changed once used? (Select all that apply.)",
          options: [
            "The Apple bundle ID, after a build has been uploaded",
            "The Google Play package name, after the app is published",
            "The Apple promotional text",
            "The Apple SKU, after the app is added",
            "The Google Play full description",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Bundle ID, SKU and package name are permanent. Promotional text and descriptions can be edited (promotional text even without a new version).",
        },
        {
          id: "pmp-b08-listing-assets-q2",
          prompt: "The core app supports iPad. The client says, \"We only care about phones, skip the iPad screenshots.\" What happens?",
          options: [
            "Nothing: iPad screenshots are always optional",
            "If the app runs on iPad, 13\" iPad screenshots are required, so either produce them or agree with the tech lead to turn off iPad support for this build",
            "Apple automatically scales the iPhone screenshots",
            "The app will only be listed in the iPhone store",
          ],
          correctIndex: 1,
          explanation: "iPad screenshots are required when the app runs on iPad. Turning off iPad support is a product decision, so involve the tech lead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-listing-assets-q3",
          prompt: "Which Google Play graphic must be exactly 1024×500?",
          options: ["The app icon", "The feature graphic", "Each phone screenshot", "The preview video thumbnail"],
          correctIndex: 1,
          explanation: "The feature graphic is 1024×500. The icon is 512×512. Screenshots have a range of sizes.",
        },
        {
          id: "pmp-b08-listing-assets-q4",
          prompt: "The client's app has an OTP login. What must the App Review information include?",
          options: [
            "Nothing: reviewers can sign up themselves",
            "A demo account the reviewer can use, with how to get past the OTP step explained in the review notes",
            "The client's own admin password",
            "A link to the TestFlight build",
          ],
          correctIndex: 1,
          explanation: "A demo account is required when the app has a sign-in. If the login uses OTP, explain how the reviewer gets in (for example a test number with a fixed code).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-listing-assets-q5",
          prompt: "Which bundle ID is best for a white-label app for a client whose domain is zahrafresh.om?",
          options: ["com.oyelabs.grocery.zahra", "com.freshcart.demo2", "com.zahrafresh.app", "com.grocery.whitelabel.client7"],
          correctIndex: 2,
          explanation: "Use the client's own reverse domain. Agency or demo names are permanent and signal a template app to reviewers.",
        },
        {
          id: "pmp-b08-listing-assets-q6",
          prompt: "Google Play screenshots of 1080×2400 are rejected by the upload form. Why?",
          options: [
            "They are too small",
            "The long side is more than twice the short side",
            "Play only accepts 1024×500",
            "Screenshots must be JPEG",
          ],
          correctIndex: 1,
          explanation: "Each side must be 320–3840 px and the long side no more than twice the short side. 2400 is more than 2 × 1080.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-listing-assets-q7",
          prompt: "Which listing items should the client, not Oyelabs, own and approve? (Select all that apply.)",
          options: [
            "The app description and claims about the service",
            "The privacy policy published on their domain",
            "The support email shown on the listing",
            "The internal build number",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The client is the publisher: their words, legal pages and contact details. Build numbers are an internal engineering detail.",
        },
        {
          id: "pmp-b08-listing-assets-q8",
          prompt: "The client's draft description says \"delivery across the GCC\", but they only deliver in one city. What do you do?",
          options: [
            "Publish it: marketing text is the client's responsibility",
            "Flag it and ask for wording the app can back up, because inaccurate claims are a review and customer risk",
            "Delete the description and leave it blank",
            "Rewrite it yourself without telling the client",
          ],
          correctIndex: 1,
          explanation: "The client owns the text, but the PM should flag claims the app cannot support and agree a correction with them.",
        },
        {
          id: "pmp-b08-listing-assets-q9",
          prompt: "What is the best time to request listing text from a white-label client?",
          options: ["On submission day", "After go-live", "At the brand-kit stage, with a deadline before UAT ends", "Only if the reviewer asks"],
          correctIndex: 2,
          explanation: "Listing text is the item clients most often deliver late. Asking early and logging it as a dependency keeps it off the critical path.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This is the draft store listing for a white-label grocery app rebranded for a client in Oman (domain zahrafresh.om). The core app supports iPad and has an OTP login. Mark every line that would cause a rejection, a permanent problem or a client complaint.",
        segments: [
          { id: "s1", text: "App name (both stores): Zahra Fresh: Groceries", issue: null },
          { id: "s2", text: "Apple subtitle: Groceries to your door", issue: null },
          { id: "s3", text: "Apple bundle ID: com.oyelabs.grocerydemo", issue: "The bundle ID carries the agency and demo name and is permanent once a build is uploaded. Use the client's reverse domain, e.g. com.zahrafresh.app." },
          { id: "s4", text: "Google package name: com.zahrafresh.app", issue: null },
          { id: "s5", text: "Full description: \"FreshCart brings fresh vegetables, dairy and bakery to your door in Muscat in under 60 minutes.\"", issue: "The description still uses the demo brand name FreshCart. It must be the client's brand." },
          { id: "s6", text: "iPhone screenshots: 6 images at 1320×2868, PNG, no transparency", issue: null },
          { id: "s7", text: "iPad screenshots: none (the client only cares about phones)", issue: "The app runs on iPad, so 13-inch iPad screenshots are required, or iPad support must be turned off for this build." },
          { id: "s8", text: "Play screenshots: 4 images at 1080×1920", issue: null },
          { id: "s9", text: "Play feature graphic: 1024×500 in the client's green", issue: null },
          { id: "s10", text: "Play icon: 512×512", issue: null },
          { id: "s11", text: "Privacy policy URL: https://demo.oyelabs-products.com/privacy", issue: "The privacy policy must be the client's own, published on the client's domain, because the client is the publisher and data controller." },
          { id: "s12", text: "Support email: support@zahrafresh.om", issue: null },
          { id: "s13", text: "Review notes: \"Login is by OTP. No demo account: reviewers can sign up with their own number.\"", issue: "Apps with a login need a demo account for the reviewer, with the OTP step explained (e.g. a test number with a fixed code)." },
          { id: "s14", text: "Keywords (Apple): grocery,delivery,muscat,vegetables,dairy", issue: null },
          { id: "s15", text: "Play preview video: a YouTube URL of the client's launch video", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-b08-privacy-review-guidelines",
      moduleId: "pmp-b08",
      trackId: "pm",
      title: "Privacy declarations and review guidelines",
      summary:
        "Both stores make the publisher declare what data the app collects and why. For a [[term:white-label]] app the publisher is the client, not Oyelabs, so the client needs its own privacy policy and its own declarations. That sounds like the client's problem until a submission is rejected or an update is blocked, and the launch date the PM promised slips.\n\nThere are four pieces. A **privacy policy** on the client's domain, linked in the store and inside the app. Apple's **App Privacy details** (the \"nutrition label\"), which must include data collected by third-party SDKs. Apple **privacy manifests**, which the app and its SDKs ship to declare data use and certain sensitive APIs. Google's **Data safety** form, required for every published app, even on testing tracks and even if it collects nothing.\n\nThe PM does not write the legal text. The client publishes the policy; the tech lead tells you exactly which data the build and its SDKs collect; you complete the forms with the client's approval. The [[term:privacy-policy-url]] belongs in the [[term:store-listing-assets]] checklist from the brand-kit stage onward.\n\nThe common mistake is copying the previous client's declarations. Two rebrands of the same core can differ: one client adds a different analytics or marketing SDK, or turns on location tracking. Declarations that do not match the build lead to rejected submissions, blocked updates or removal, and Google states its review is not designed to verify them, so the responsibility is fully on the publisher.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Apple: App Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "spec", verifiedAt: "2026-10-02T11:46:13Z" },
        { label: "Apple: App Privacy Details", url: "https://developer.apple.com/app-store/app-privacy-details/", kind: "docs", verifiedAt: "2026-10-02T11:46:16Z" },
        { label: "Play Console Help: Data safety section", url: "https://support.google.com/googleplay/android-developer/answer/10787469?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:29Z" },
        { label: "Apple Developer: Privacy manifest files", url: "https://developer.apple.com/documentation/bundleresources/privacy-manifest-files", kind: "docs", verifiedAt: "2026-10-02T11:46:22Z" },
      ],
      video: {
        title: "How to use Google Play's Data safety section",
        channel: "Google Help",
        url: "https://www.youtube.com/watch?v=62T6agNWpRI",
        videoId: "62T6agNWpRI",
        verifiedAt: "2026-10-02T12:00:47Z",
      },
      alternateVideos: [
        {
          title: "Your App Will Get Rejected | New Privacy Rules - 2024",
          channel: "Sean Allen",
          url: "https://www.youtube.com/watch?v=T6IvImk66m8",
          videoId: "T6IvImk66m8",
          verifiedAt: "2026-10-02T12:00:48Z",
        },
        {
          title: "Understand and Navigate App Store Privacy Labels",
          channel: "Jacob's QuickTips",
          url: "https://www.youtube.com/watch?v=bjYUkDjyctE",
          videoId: "bjYUkDjyctE",
          verifiedAt: "2026-10-02T12:00:49Z",
        },
      ],
      handbook: {
        stages: ["wl-store-listing"],
        rules: ["store-rejection-fixes"],
      },
      sections: [
        {
          heading: "What Apple requires",
          body:
            "- **Privacy policy (guideline 5.1.1(i)).** Every app must link a privacy policy both in App Store Connect and inside the app. It must say what data is collected and how it is used, confirm that third parties who receive the data protect it equally, and explain retention, deletion and how users can revoke consent.\n- **App Privacy details.** Required for new apps and updates. They must cover data collected by third-party SDKs, not only by your own code. Disclosure is optional only when all of Apple's optional-disclosure criteria are met. They can be updated without a new build, and keeping them accurate is the developer's responsibility.\n- **Privacy manifests.** Files inside the app and its SDKs that declare data use and the reasons for using certain APIs. When a core release adds or updates an SDK, the manifests change with it.\n\nNone of this is a one-time task. Every update that adds an SDK or a data use needs the declarations reviewed again.",
        },
        {
          heading: "What Google requires",
          body:
            "- **Data safety form.** Required for *all* published apps, including those only on closed or open testing tracks, and even apps that collect no user data.\n- **Privacy policy.** Mandatory, linked in Play Console.\n- **Third-party SDKs.** The developer is responsible for the data they collect.\n- **Accuracy.** Google says its review is not designed to verify the declarations. Inaccurate declarations can lead to blocked updates or removal, so a wrong form can pass review today and cause a problem months later.\n\nThe wider User Data policy sits behind the form. If the core collects location, contacts or similar sensitive data, check with the tech lead which permissions and disclosures the client's build needs.",
        },
        {
          heading: "Who does what in a white-label launch",
          body:
            "- **Client:** owns and publishes the privacy policy on its own domain; approves the declarations, because it is the publisher and usually the data controller.\n- **Tech lead:** lists exactly what the client's build collects, including each SDK (analytics, crash reporting, push, payments, maps, marketing), and which ones are switched on by configuration.\n- **PM:** sends the client the data list in plain language, completes the App Privacy and Data safety forms in the [[term:client-owned-accounts]], and records what was declared and when.\n\nOyelabs does not write legal text for the client. If the client has no privacy policy, that is a [[term:client-dependency]] that blocks submission, logged with an owner and a date.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label grocery app rebranded for a second client, in Bahrain.* The first client (Oman) launched three months ago.\n\n1. **The shortcut.** A team member suggests copying the Oman client's Data safety answers and App Privacy details, \"same app\".\n2. **The check.** The PM asks the tech lead for the Bahrain build's data list. It differs: the Bahrain client switched on precise location for delivery tracking and added its own marketing SDK. The Oman declarations do not mention either.\n3. **The client's part.** The PM sends the client a plain-language table: data type, why it is collected, which SDK, shared with whom. The client's lawyer updates the privacy policy on the client's domain.\n4. **The forms.** The PM completes both stores' declarations from that table, gets the client's written approval, and saves a copy with the build version in the client's folder.\n5. **Later.** Two months on, a core upgrade adds a crash-reporting SDK. Because the declarations are tied to a build version, the PM knows to review them before the update is submitted.\n\nCopying would have produced declarations that were wrong on day one, for a client whose name is on the listing.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"We collect no data, so skip the form.\"** Google still requires the Data safety form, and a privacy policy. Complete it accurately.\n- **Declarations copied from another client.** Rebuild them from this build's data list. If a copied form is already live and wrong, correct it now (Apple's details can be updated without a new build).\n- **Privacy policy on Oyelabs' domain.** Replace it with the client's own page and update both stores and the in-app link.\n- **A rejection for privacy.** Reply in App Store Connect with what you changed. Whether fixing it is billable depends on the cause: follow the Oyelabs rule in the handbook card below.\n- **An SDK added in an update without a review of the declarations.** Add a privacy check to every release that changes SDKs.\n\nNot legal advice: the client's own lawyer decides what its privacy policy says.",
        },
        {
          heading: "Your checklist",
          body:
            "- Tech lead's data list for this client's build, including every SDK and configuration-dependent data use.\n- Client's privacy policy live on the client's domain, and linked in the app and both stores.\n- Apple App Privacy details completed and approved by the client.\n- Google Data safety form completed, even if the answer is \"no data collected\".\n- Privacy manifests checked when SDKs change.\n- A record of what was declared, against which build version, and who approved it.\n- A privacy review step on every future release that adds or changes SDKs.",
        },
      ],
      sop: [
        {
          title: "Our per-product data list and privacy hand-off",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the data list for each white-label product (SDKs, data types, purposes) is kept, who keeps it current when the core changes, and the plain-language table sent to clients for their privacy policy and declarations.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b08-privacy-review-guidelines-q1",
          prompt: "The client says: \"Our app collects no personal data, so we don't need the Google Data safety form.\" What is right?",
          options: [
            "Correct, the form is only for apps that collect data",
            "Wrong: the form is required for all published apps, including those that collect no data, and a privacy policy is mandatory",
            "Correct, as long as the app is only on a closed testing track",
            "The form is optional if the Apple App Privacy details are complete",
          ],
          correctIndex: 1,
          explanation: "Google requires the Data safety form for every published app, including testing tracks and apps that collect nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q2",
          prompt: "What must Apple's App Privacy details include? (Select all that apply.)",
          options: [
            "Data collected by your own code",
            "Data collected by third-party SDKs in the app",
            "Only data the client's marketing team uses",
            "Data collected by analytics and crash-reporting tools bundled in the app",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "The declarations cover everything the app collects, including what third-party SDKs collect.",
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q3",
          prompt: "A second client of the same white-label product wants to launch next week. A colleague proposes copying the first client's privacy declarations. When is that risky?",
          options: [
            "Never: same core, same declarations",
            "When the second client's build has different SDKs or configuration that changes what data is collected",
            "Only if the clients are in different countries",
            "Only on Google Play",
          ],
          correctIndex: 1,
          explanation: "Configuration and SDKs can differ per client. Declarations must match the actual build.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q4",
          prompt: "Under Apple's guideline 5.1.1(i), where must the privacy policy be linked?",
          options: [
            "Only in App Store Connect",
            "Only inside the app",
            "Both in App Store Connect and inside the app",
            "On the developer's website only",
          ],
          correctIndex: 2,
          explanation: "The policy must be linked in the store metadata and accessible within the app.",
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q5",
          prompt: "Google's documentation says its review is not designed to verify Data safety declarations. What does this mean for a PM?",
          options: [
            "The declarations do not matter",
            "A wrong declaration can pass review and still lead to blocked updates or removal later, so accuracy is the publisher's responsibility",
            "Google will correct mistakes automatically",
            "Only Apple checks declarations",
          ],
          correctIndex: 1,
          explanation: "Passing review is not proof of accuracy. Enforcement can come later, against the client's app.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q6",
          prompt: "Why should each white-label client have its own privacy policy on its own domain? (Select all that apply.)",
          options: [
            "The client is the publisher and usually the data controller",
            "Data collection can differ per client",
            "It is cheaper for Oyelabs to host it",
            "The listing and the in-app link should point to the client's own legal pages",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "The policy belongs to the publisher and must describe this client's app. Hosting cost is not the reason.",
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q7",
          prompt: "Who should write the text of the client's privacy policy?",
          options: [
            "The Oyelabs PM, from a template",
            "The client, with its own legal advice, using the data list the tech lead provides",
            "The store reviewer",
            "The QA team",
          ],
          correctIndex: 1,
          explanation: "Oyelabs supplies accurate facts about the data; the client owns and publishes the legal text.",
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q8",
          prompt: "Apple App Privacy details for a live app turn out to be incomplete. What can you do?",
          options: [
            "Nothing until the next major version",
            "Update them in App Store Connect; they can be changed without a new build",
            "Remove the app from sale first",
            "Ask Apple to edit them",
          ],
          correctIndex: 1,
          explanation: "App Privacy details can be updated without a new build. Correct them as soon as you find the gap.",
        },
        {
          id: "pmp-b08-privacy-review-guidelines-q9",
          prompt: "A core upgrade adds a new crash-reporting SDK. Which steps belong before the client's update is submitted? (Select all that apply.)",
          options: [
            "Review the App Privacy details and Data safety form against the new SDK",
            "Check the privacy manifests that ship with the SDK",
            "Tell the client so its privacy policy can be updated if needed",
            "Skip it: crash data is never personal",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Any SDK change can change what is collected. Review the declarations, manifests and policy with the client.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are launching a white-label grocery app for a second client, in Bahrain. The first client (Oman) launched three months ago on the same core. The Bahrain client has turned on precise location for delivery tracking and added its own marketing SDK.",
        steps: [
          {
            id: "copy",
            question: "A colleague says: \"Same core, just copy Oman's Data safety and App Privacy answers.\" What do you do?",
            options: [
              "Copy them: the core is identical",
              "Ask the tech lead for the Bahrain build's data list, including every SDK and the location setting, and build the declarations from that",
              "Copy them and fix any problems if a reviewer complains",
              "Ask the store reviewer which answers to use",
            ],
            correctIndex: 1,
            explanation: "This build collects location and has an extra SDK. Declarations must match the actual build, and stores may not catch the error until later.",
          },
          {
            id: "policy",
            question: "The Bahrain client has no privacy policy yet and asks you to \"use the one on your demo site\". What do you do?",
            options: [
              "Link the Oyelabs demo policy for now",
              "Write a policy for them and publish it on Oyelabs' domain",
              "Explain the policy must be theirs, on their domain, send them the plain-language data list for their lawyer, and log it as a client dependency that blocks submission",
              "Submit without a policy and add it later",
            ],
            correctIndex: 2,
            explanation: "The client is the publisher and data controller. Oyelabs supplies the facts; the client owns the legal text.",
          },
          {
            id: "update",
            question: "Two months after launch, a core upgrade adds a crash-reporting SDK. What do you do before submitting the client's update?",
            options: [
              "Nothing: privacy forms are a one-time task",
              "Review the declarations and privacy manifests against the new SDK, tell the client so its policy can be updated, then submit",
              "Remove the SDK from the client's build without telling the core team",
              "Wait for the store to flag it",
            ],
            correctIndex: 1,
            explanation: "Every release that changes SDKs needs a privacy check. The client must know because its name is on the declarations.",
          },
        ],
      },
    },
  ],
} satisfies Module;
