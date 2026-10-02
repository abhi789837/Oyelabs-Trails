import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b04",
  trackId: "pm",
  name: "White-label lifecycle: Collecting the brand kit",
  description:
    "Getting every brand asset a rebranded instance needs, in the right formats and sizes, checked before builds start, so that rebranding is a day of work and not three weeks of chasing logos.",
  topics: [
    {
      id: "pmp-b04-brand-kit",
      moduleId: "pmp-b04",
      trackId: "pm",
      title: "The brand kit checklist",
      summary:
        "[[term:rebranding]] a white-label app is quick when the assets are right and painfully slow when they are not. The [[term:brand-kit]] is the set of files and facts the team needs to turn the core product into the client's app: logo, app icon, colours, fonts, splash screen, app name and tone of voice.\n\nWhy it matters at an agency: the brand kit is a [[term:client-dependency]], and it sits on the critical path. The designer cannot theme, the developers cannot produce branded builds, and the [[term:store-listing-assets]] cannot be made until it arrives. A low-resolution logo found after builds start means redoing icons, splash screens and screenshots.\n\nHow to do it. Send a written checklist as soon as scope and price are approved, with formats and sizes stated, an owner on the client side and a due date. Ask for source files, not screenshots: the logo as a vector file plus a transparent PNG, an app icon master at 1024 × 1024 pixels, colours as hex codes, and the font files with proof the client holds the font licence. When assets arrive, the designer checks them against the checklist before anyone builds, and the PM records what is received and what is missing.\n\nThe common mistake is accepting \"we'll send the logo\" and a JPEG pulled from a website. Those files cannot be scaled to app icons. Ask for the source files once, early, and in writing.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Apple HIG: App icons", url: "https://developer.apple.com/design/human-interface-guidelines/app-icons", kind: "docs", verifiedAt: "2026-10-02T11:46:19Z" },
        { label: "Android Developers: Google Play icon design specifications", url: "https://developer.android.com/distribute/google-play/resources/icon-design-specifications", kind: "docs", verifiedAt: "2026-10-02T11:48:46Z" },
        { label: "Android Developers: Adaptive icons", url: "https://developer.android.com/develop/ui/views/launch/icon_design_adaptive", kind: "docs", verifiedAt: "2026-10-02T11:48:47Z" },
        { label: "Material Design 3: Color system overview", url: "https://m3.material.io/styles/color/system/overview", kind: "docs", verifiedAt: "2026-10-02T11:48:48Z" },
      ],
      video: {
        title: "The Ultimate Brand Guidelines Design Tutorial for Beginners",
        channel: "HubSpot Marketing",
        url: "https://www.youtube.com/watch?v=AjgQBC_XyS4",
        videoId: "AjgQBC_XyS4",
        verifiedAt: "2026-10-02T12:00:33Z",
      },
      alternateVideos: [
        {
          title: "What Is Branding? 4 Minute Crash Course.",
          channel: "The Futur",
          url: "https://www.youtube.com/watch?v=sO4te2QNsHY",
          videoId: "sO4te2QNsHY",
          verifiedAt: "2026-10-02T12:00:34Z",
        },
      ],
      handbook: { stages: ["wl-brand-kit"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "The checklist and why each item matters",
          body:
            "This is typical agency practice, not a standard. Adjust it to your product.\n\n- **Logo as a vector file (SVG, AI or PDF) plus a PNG on a transparent background.** Vector scales to any size without blurring.\n- **App icon master at 1024 × 1024 px.** Apple's App Store icon is 1024 × 1024. Smaller sizes are made from it.\n- **Icon layers for Android.** Android launcher icons are adaptive: a foreground and a background layer. A flat square logo often needs the designer to separate them.\n- **Colours as hex codes:** primary, secondary and neutral at least. Material 3 builds its colour roles from a few source colours, so these are what the designer needs.\n- **Font files, plus proof of the licence.** A font on the client's website is not necessarily licensed for an app.\n- **Splash screen**, or approval to build one from the logo and colours.\n- **App name and short name.** The short name must fit under the icon on a phone.\n- **Tone of voice** for notifications and store texts.\n- **Any existing brand guidelines PDF.**\n\nThe store listing assets (screenshots, feature graphic, descriptions) come later in the store-listing stage, but they are made from this kit.",
        },
        {
          heading: "Store icon facts worth knowing",
          body:
            "- **Google Play store icon:** 512 × 512 px, 32-bit PNG with alpha, up to 1024 KB.\n- **Google Play feature graphic:** 1024 × 500 px, JPEG or 24-bit PNG with no alpha. It is made in the listing stage but needs the brand kit.\n- **Apple:** a 1024 × 1024 App Store icon; current Apple guidance also covers dark and tinted icon variants, so ask whether the client wants to approve those.\n- **Android adaptive icons:** separate foreground and background layers, which the system masks into different shapes.\n\nYou do not need to make the files. You need to ask for sources good enough that the designer can.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label laundry pickup app rebranded for a client in Jordan.**\n\nThe day the client approves the quote, the PM sends the brand-kit checklist from the onboarding template, with a due date five working days out and the client's marketing lead as owner.\n\nOn day three the client sends a ZIP. The designer checks it the same afternoon:\n\n- Logo: SVG and transparent PNG. Received.\n- App icon: a 300 px JPEG. **Rejected:** too small, and JPEG has no transparency. The designer offers to build the 1024 px icon from the SVG logo, and the client approves a mock-up.\n- Colours: hex codes for primary and secondary. No neutral. The designer proposes one; the client approves.\n- Font: a commercial Arabic font from their website. **Open:** the client must confirm the licence covers apps. Meanwhile the designer prepares a free alternative in case.\n- App name: the full name is 24 characters. Short name agreed for the home screen.\n\nThe PM updates the onboarding sheet: three received, two open with owners and dates. Builds start on the planned day.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Low-resolution logos.** Recover: ask for the source file from whoever designed the brand, or quote the designer's time to redraw it.\n- **Missing icon or dark-mode variants.** Recover: the designer prepares them from the vector logo and the client approves a mock-up.\n- **Assets arriving after builds start.** Recover: freeze the brand kit by a date, and treat later brand changes as a [[term:change-request]] if they cause rework.\n- **Unlicensed fonts.** Recover: use a free alternative until the client proves the licence.\n- **Brand assets sent by several people over chat.** Recover: one shared folder, one owner on each side.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Checklist sent in writing on the day scope was approved, with an owner and a due date.\n2. Formats and sizes stated: vector logo, 1024 px icon, hex colours, font files.\n3. Designer checked every asset before builds start.\n4. Font licence confirmed, or an alternative agreed.\n5. App name and short name confirmed.\n6. Onboarding sheet updated: received, rejected, open, each with an owner.",
        },
      ],
      sop: [
        {
          title: "Brand asset storage",
          prompt: "[Oyelabs SOP – admin to fill] Where client brand assets are stored, how the folder is named per instance, and who can access it.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b04-brand-kit-q1",
          prompt: "Why is the brand kit on the critical path of a white-label project?",
          options: [
            "Theming, branded builds and store assets all depend on it, so a late or poor kit delays everything after it",
            "Because developers cannot write code without a logo",
            "Because the stores review the brand kit first",
            "It is not on the critical path",
          ],
          correctIndex: 0,
          explanation: "The product already works. What turns it into the client's app is the kit, so it gates builds and listings.",
        },
        {
          id: "pmp-b04-brand-kit-q2",
          prompt: "Which logo files should you ask for? (Select all that apply.)",
          options: [
            "A vector file such as SVG, AI or PDF",
            "A PNG on a transparent background",
            "A screenshot of the client's website header",
            "A JPEG copied from their social media",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Vector files scale cleanly and transparent PNGs fit any background. Screenshots and social images are low resolution.",
        },
        {
          id: "pmp-b04-brand-kit-q3",
          prompt: "The client sends a 300 px JPEG as their app icon. What is the problem?",
          options: [
            "It is too small for a 1024 × 1024 App Store icon and has no transparency",
            "JPEG files are banned by the stores for all images",
            "Icons must be sent as Word documents",
            "Nothing; the developers can stretch it",
          ],
          correctIndex: 0,
          explanation: "Stretching a small image makes it blurry. The icon master should be 1024 px, built from a vector logo if needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b04-brand-kit-q4",
          prompt: "Why ask the client to confirm their font licence?",
          options: [
            "A font licensed for their website may not cover use inside an app",
            "Because fonts expire every year",
            "Because the stores check font licences during review",
            "It is not needed; all fonts are free",
          ],
          correctIndex: 0,
          explanation: "Font licences often distinguish web, desktop and app use. Using an unlicensed font is a legal risk for the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b04-brand-kit-q5",
          prompt: "What makes Android launcher icons different from a single flat image?",
          options: [
            "They are adaptive: a foreground and a background layer that the system masks into different shapes",
            "They must be animated",
            "They must be black and white",
            "They are generated automatically from the app name",
          ],
          correctIndex: 0,
          explanation: "Adaptive icons need two layers. A flat logo often has to be separated by the designer.",
        },
        {
          id: "pmp-b04-brand-kit-q6",
          prompt: "Which colour information should the brand kit include?",
          options: [
            "Primary, secondary and neutral colours as hex codes",
            "\"Blue, like our website\"",
            "A photo of the office walls",
            "Only the logo; the designer guesses the rest",
          ],
          correctIndex: 0,
          explanation: "Exact hex codes avoid guesswork. Material 3 derives its colour roles from a few source colours like these.",
        },
        {
          id: "pmp-b04-brand-kit-q7",
          prompt: "Builds have started. The client sends a new logo with different colours. What do you do?",
          options: [
            "Assess the rework and, if it causes real rework past the agreed brand-kit date, handle it as a change request",
            "Silently redo all assets",
            "Refuse any brand change forever",
            "Ship with the old logo without telling them",
          ],
          correctIndex: 0,
          explanation: "A frozen brand kit protects the plan. Late changes are possible, but their rework is a change with time and cost.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b04-brand-kit-q8",
          prompt: "Which of these show the brand-kit stage is complete? (Select all that apply.)",
          options: [
            "All brand assets received and checked by the designer",
            "App names and listing texts confirmed",
            "The app approved in both stores",
            "The client paid the final invoice",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "The stage ends when assets are checked and names confirmed. Store approval and final payment come later.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "The designer's intake note for a white-label pharmacy app's brand kit is below. Mark every line that should stop builds from starting or needs action before the kit can be accepted.",
        segments: [
          { id: "b1", text: "Logo: SVG and transparent PNG received from the client's design agency.", issue: null },
          { id: "b2", text: "App icon: 256 × 256 JPEG taken from the website favicon; accepted as is.", issue: "Too small and no transparency. The icon master should be 1024 px, built from the vector logo." },
          { id: "b3", text: "Primary colour #0B6E4F and secondary #F2A541 received as hex codes.", issue: null },
          { id: "b4", text: "Neutral colour: designer proposed #F5F5F2; client approved in writing.", issue: null },
          { id: "b5", text: "Font: commercial font copied from the client's website files; licence not discussed.", issue: "A website font licence may not cover apps. The client must confirm the licence or an alternative is used." },
          { id: "b6", text: "Splash screen: client approved a mock-up built from the logo and primary colour.", issue: null },
          { id: "b7", text: "App name: 'Al Noor Pharmacy & Wellness Delivery'; no short name agreed.", issue: "The full name will not fit under the icon. A short name must be agreed." },
          { id: "b8", text: "Tone of voice: friendly and formal, notifications in Arabic and English.", issue: null },
          { id: "b9", text: "Brand guidelines PDF received.", issue: null },
          { id: "b10", text: "Assets received in one shared folder owned by the client's marketing lead.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
