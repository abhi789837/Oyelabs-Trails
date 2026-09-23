import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-foundations",
  trackId: "mobile",
  name: "Mobile Foundations",
  description:
    "The model every mobile engineer needs before picking a framework: how shipping to a store differs from shipping to a URL, what the two platforms actually guarantee, and how lifecycle, permissions, connectivity and review gates shape the architecture. Written for engineers who know the web and have never shipped an app.",
  refs: [
    { label: "Android Developers: Application fundamentals", url: "https://developer.android.com/guide/components/fundamentals", kind: "docs" },
    { label: "Apple HIG: Designing for iOS", url: "https://developer.apple.com/design/human-interface-guidelines/designing-for-ios", kind: "docs" },
    { label: "Apple: App Store Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "docs" },
    { label: "Google Play: Developer Policy Center", url: "https://play.google/developer-content-policy/", kind: "docs" },
  ],
  topics: [
    {
      id: "mob-not-the-web",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Why Mobile Is Not the Web",
      summary:
        "On the web the deployed artefact and the running artefact are the same thing: you push, the next request serves new bytes, and a bad release is one revert away. Mobile breaks that identity. You compile a binary, hand it to a store, wait for a reviewer, and then wait again for each user's device to decide to install it. Nothing you do reaches a user who does not update, and a meaningful share of your install base never will. The practical consequence is that every mobile release is a distributed-systems change: the client you shipped eighteen months ago is still calling your API today, so backward compatibility is not a courtesy, it is the contract.\n\nThat single fact reshapes the architecture. Anything you might need to change quickly belongs on the server — feature flags, kill switches, endpoint URLs, copy, limits, minimum-supported-version checks — because the client is the one component you cannot redeploy. Both stores give you a controlled rollout (Apple's phased release ramps over seven days and can be paused; Google Play's staged rollout is a percentage you set), so the real incident response for a bad build is \"halt the rollout and flip a server flag\", not \"push a fix\".\n\nThe second difference is the host. A browser tab is a cooperative environment; a phone is not. The OS suspends your process, kills it to reclaim memory, revokes permissions, defers your background work to save battery, and hands the user to another app mid-flow. Users are also physically moving, so the network disappears for seconds at a time rather than failing cleanly.\n\nThe gotcha that catches strong web engineers is planning with a web-sized blast radius. \"We'll fix it in the next deploy\" quietly becomes \"some users will run this bug for a year\". Budget for that up front with staged rollouts, remote config, and a forced-update path you have actually tested.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Android Developers: Application fundamentals", url: "https://developer.android.com/guide/components/fundamentals", kind: "docs" },
        { label: "Apple HIG: Designing for iOS", url: "https://developer.apple.com/design/human-interface-guidelines/designing-for-ios", kind: "docs" },
        { label: "Apple: Release a version update in phases", url: "https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/", kind: "docs" },
        { label: "Android Developers: In-app updates", url: "https://developer.android.com/guide/playcore/in-app-updates", kind: "docs" },
      ],
      video: {
        title: "iOS Dev Vs. Web Dev — My Thoughts After Building My First iOS App",
        channel: "Your Average Tech Bro",
        url: "https://www.youtube.com/watch?v=yr2Ccr7rUNM",
        videoId: "yr2Ccr7rUNM",
        durationLabel: "3:54",
      },
      alternateVideos: [
        {
          title: "Mobile developer Roadmap | Android iOS Flutter React Native",
          channel: "Chai aur Code",
          url: "https://www.youtube.com/watch?v=z8j0nZDo8WQ",
          videoId: "z8j0nZDo8WQ",
          durationLabel: "24:17",
        },
        {
          title: "We Need To Talk About Mobile Dev...",
          channel: "CodeHead",
          url: "https://www.youtube.com/watch?v=obwQC7WPkTs",
          videoId: "obwQC7WPkTs",
          durationLabel: "4:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-not-the-web-q1",
          prompt:
            "Ten minutes after your iOS release goes live, crash reports spike on a new checkout screen. Which action actually reduces the number of affected users fastest?",
          options: [
            "Pause the phased release and disable the screen with a server-side feature flag",
            "Revert the commit and redeploy the app the way you would a web build",
            "Submit a fixed build and mark it as an expedited review request",
            "Remove the app from sale until the fix is approved",
          ],
          correctIndex: 0,
          explanation:
            "Only the two levers you control at runtime help within minutes: stop new installs and turn the feature off remotely. A new build still has to be reviewed and then installed by each user, and pulling the app punishes everyone including users on the healthy previous version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-not-the-web-q2",
          prompt: "Why does a mobile backend have to keep supporting clients released years ago?",
          options: [
            "Because a store cannot force an installed app to update, so old binaries keep calling your API indefinitely",
            "Because app stores require every API to remain unchanged for five years after publication",
            "Because mobile clients cache API responses permanently and never revalidate",
            "Because both stores replay old client traffic against new server builds during review",
          ],
          correctIndex: 0,
          explanation:
            "Updates are the user's choice (or their auto-update setting); there is no equivalent of a browser fetching new JS on reload. Neither store mandates API stability, and nobody replays your traffic — the old clients are simply still out there.",
        },
        {
          id: "mob-not-the-web-q3",
          prompt: "Which statements about a mobile release are true but false for a web deploy? (Select all that apply.)",
          options: [
            "A third party can reject the change before any user sees it",
            "Users on the previous version keep running it until they choose to update",
            "The version mix of your install base is something you have to design for permanently",
            "Rolling back means the old version is live for everyone within seconds",
            "Changing copy that your server sends requires a new binary",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Review, non-updating users and a permanent long tail of versions are all mobile-specific. Rollback is not instant — you stop the rollout, but installed copies stay installed — and server-sent copy is still server-controlled on mobile.",
        },
        {
          id: "mob-not-the-web-q4",
          prompt: "You enable Apple's phased release for an update. Which statement about it is accurate?",
          options: [
            "It ramps automatic updates over 7 days, and anyone can still download the new version manually from the App Store at any time",
            "It hides the new version from the App Store entirely until the ramp finishes",
            "It rolls the update back automatically if your crash rate rises",
            "It applies to first installs as well as to updates",
          ],
          correctIndex: 0,
          explanation:
            "Phased release only throttles automatic updates (1%, 2%, 5% … to 100% over seven days) and can be paused for up to 30 days in total; the version is publicly downloadable throughout. There is no automatic crash-triggered rollback, and new installs always get the latest version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-not-the-web-q5",
          prompt: "What is the closest mobile equivalent of a browser hard refresh picking up your new deployment?",
          options: [
            "Nothing: force-quitting and relaunching restarts the same installed binary",
            "Force-quitting the app from the app switcher",
            "Clearing the app's cache from system settings",
            "Toggling airplane mode so the app re-fetches its bundle",
          ],
          correctIndex: 0,
          explanation:
            "Relaunching re-runs the code that is already on disk. The only way new code arrives is an install from the store — which is exactly why the interesting fixes have to live on the server.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-not-the-web-q6",
          prompt:
            "Your product needs a hard cutoff: clients older than 4.2 must stop working because the auth scheme changed. What is the reliable way to build that?",
          options: [
            "Have the server reject old clients with a machine-readable error and have every shipped version already know how to show an update wall",
            "Rely on the stores to uninstall versions below 4.2",
            "Ship the update and wait: auto-update means everyone will be on 4.2 within a day",
            "Delete the old API endpoints and let old clients crash",
          ],
          correctIndex: 0,
          explanation:
            "A forced-update path has to be present in the version you are cutting off, which means shipping it long before you need it. Stores never uninstall old versions, auto-update is neither universal nor instant, and crashing old clients is an outage from the user's point of view.",
        },
        {
          id: "mob-not-the-web-q7",
          prompt: "Google Play's in-app update API offers a flexible flow and an immediate flow. What is the difference?",
          options: [
            "Flexible downloads in the background while the user keeps using the app; immediate blocks the app full-screen until the update installs and the app restarts",
            "Flexible installs silently with no user consent; immediate asks the user first",
            "Flexible works on Wi-Fi only; immediate also works on cellular",
            "Flexible updates the app's assets; immediate replaces the whole binary",
          ],
          correctIndex: 0,
          explanation:
            "Both prompt the user; they differ in whether the app stays usable during the download. Immediate is the flow to reach for when the old version is genuinely broken, which is why it pairs with a server-side minimum-version check.",
        },
        {
          id: "mob-not-the-web-q8",
          prompt: "A user has your app open in the foreground at the moment your new version becomes available in the store. What happens?",
          options: [
            "Nothing: the running process keeps executing the installed binary until the user installs the update and relaunches",
            "The OS swaps the binary underneath the running process at the next screen transition",
            "The app is killed immediately and relaunched on the new version",
            "The app keeps running but new API calls are routed to the new version's endpoints",
          ],
          correctIndex: 0,
          explanation:
            "An app update is an install, not a live patch; the process running now is unaffected. Compare with the web, where the very next navigation can be served by the new deployment — which is why web engineers underestimate how long two versions coexist.",
        },
        {
          id: "mob-not-the-web-q9",
          prompt: "Which of these belong on the server rather than baked into the mobile binary? (Select all that apply.)",
          options: [
            "Feature flags and kill switches for risky screens",
            "The minimum client version your API will accept",
            "Remote config for limits, copy and experiment assignment",
            "The rendering code for the app's main list screen",
            "The user's locally cached draft of an unsent message",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything you might need to change faster than a release cycle has to be remote. Rendering belongs in the client for latency and offline reasons, and an unsent draft is precisely the state that must survive with no network at all.",
        },
      ],
    },
    {
      id: "mob-platform-models",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "iOS and Android: Two Different Contracts",
      summary:
        "Both platforms run your code in a sandbox, but they sell very different deals. Apple controls the hardware, the OS, the toolchain and — in most markets — the only way to install software. That vertical control buys you a narrow device matrix and fast OS adoption, and it costs you a human reviewer with opinions, entitlements you have to be granted, and a privacy manifest declaring which data you collect and why you call certain \"required reason\" APIs. In some markets Apple now also permits notarized distribution through alternative marketplaces and the web, an exception that proves how much the default is a single gate.\n\nAndroid's deal is the mirror image. The sandbox is enforced by giving each app its own Linux user ID, so isolation is a kernel property rather than a store policy, and distribution is genuinely plural: Play, other stores, and sideloading. You pay for that openness with a device matrix nobody can fully enumerate — OEM skins, aggressive battery managers, screen shapes, chipsets — and with a moving floor: Google Play requires new apps and updates to target a recent API level (as of this writing, Android 16 / API 36, with existing apps needing API 35 to stay available), so behaviour changes land on Google's schedule, not yours.\n\nThe framing that matters for architecture: on iOS your risk is concentrated at submission time, on Android it is spread across the fleet at runtime. An iOS bug tends to be your bug; an Android bug is often \"this vendor's power manager killed our sync\".\n\nThe gotcha is treating `targetSdkVersion` as a build setting. It is a behaviour contract — raise it and the OS starts applying newer rules to your app (edge-to-edge drawing, stricter background limits, new permission flows) all at once. Teams that only bump it when Play forces them end up shipping a year of platform behaviour changes in a single release.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Android Open Source Project: Application Sandbox", url: "https://source.android.com/docs/security/app-sandbox", kind: "docs" },
        { label: "Google Play: Target API level requirement", url: "https://developer.android.com/google/play/requirements/target-sdk", kind: "docs" },
        { label: "Apple: App Store Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "docs" },
        { label: "Apple: Privacy manifest files", url: "https://developer.apple.com/documentation/bundleresources/privacy-manifest-files", kind: "docs" },
      ],
      video: {
        title: "✅ The Full Android 16 Migration Checklist - Your Todos For API Level 36",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=UoywDs3YXOM",
        videoId: "UoywDs3YXOM",
        durationLabel: "8:26",
      },
      alternateVideos: [
        {
          title: "WWDC23: Get started with privacy manifests | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=OQMF4LDqscc",
          videoId: "OQMF4LDqscc",
          durationLabel: "12:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-platform-models-q1",
          prompt: "What actually enforces the Android application sandbox?",
          options: [
            "The kernel: each app gets its own Linux user ID, so the OS isolates app data and processes",
            "Google Play's review process, which scans for apps that read other apps' files",
            "The Java language's access modifiers, applied across app boundaries",
            "A signed policy file that each app ships in its manifest",
          ],
          correctIndex: 0,
          explanation:
            "Android reuses Linux's user-based protection: distinct UIDs mean one app cannot read another's files by default, whether it came from Play or a sideload. Store review is a policy layer on top, not the isolation mechanism.",
        },
        {
          id: "mob-platform-models-q2",
          prompt:
            "Your Android app has shipped for two years with `targetSdkVersion 33` and you now raise it to the level Google Play requires. What should you expect?",
          options: [
            "A batch of behaviour changes activates at once — background limits, permission flows, edge-to-edge drawing — and each needs testing",
            "Nothing changes at runtime; `targetSdkVersion` only affects which devices can install the app",
            "Only devices running exactly that API level change behaviour; older devices are unaffected in every way",
            "The Play Store recompiles your app against the new SDK automatically",
          ],
          correctIndex: 0,
          explanation:
            "`targetSdkVersion` is the app's declaration of which behaviour contract it has been tested against; the OS keeps applying older compatibility behaviour until you raise it. Bumping several levels at once is how a year of platform changes lands in one release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-platform-models-q3",
          prompt: "An app that targets an API level below Google Play's current floor is still installed on millions of devices. What happens?",
          options: [
            "It keeps working for existing users, but it can't be updated on Play and stops being available to users on newer Android versions",
            "Google Play silently uninstalls it from all devices",
            "It remains fully distributable; the requirement only applies to brand-new apps",
            "The OS refuses to launch it once the deadline passes",
          ],
          correctIndex: 0,
          explanation:
            "The requirement gates publishing and discoverability, not execution: installed copies keep running, which is exactly why version fragmentation is permanent. New submissions and updates are blocked, and the app disappears for users whose OS is newer than your target.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-platform-models-q4",
          prompt: "Which of these are genuine structural differences between the two platforms? (Select all that apply.)",
          options: [
            "Android permits installation from sources other than the default store; iOS does so only under specific market-driven exceptions",
            "Apple reviews every submission with human reviewers as part of the default distribution path",
            "Android's device and OEM-skin matrix is far wider, so runtime behaviour varies more in the field",
            "Only iOS isolates apps from each other's data",
            "Only Android requires developers to declare what user data their app collects",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Distribution plurality, review as a default gate, and device-matrix width are the real differences. Both platforms sandbox app data, and both require data-collection declarations (App Store privacy details and privacy manifests; Play's Data safety section).",
        },
        {
          id: "mob-platform-models-q5",
          prompt: "What is an Apple privacy manifest for?",
          options: [
            "Declaring the data types your app or an included SDK collects, and the approved reasons you call certain APIs",
            "Encrypting user data at rest inside the app container",
            "Requesting runtime permissions without showing a system alert",
            "Listing the entitlements the app needs from its provisioning profile",
          ],
          correctIndex: 0,
          explanation:
            "It is a declaration file, read at submission time, covering collected data types, tracking domains and \"required reason\" API usage — including for third-party SDKs you bundle. Encryption, permissions and entitlements are separate mechanisms.",
        },
        {
          id: "mob-platform-models-q6",
          prompt:
            "Your Android app schedules a nightly sync. It works on your Pixel and fails silently on several popular OEM devices. What is the most likely explanation?",
          options: [
            "OEM battery managers apply restrictions beyond stock Android's Doze and App Standby, and they vary by vendor",
            "Those devices run an older API level than your `minSdkVersion`",
            "The Play Store strips scheduled work from apps that target a recent API level",
            "Scheduled work is only delivered to apps installed from the Play Store",
          ],
          correctIndex: 0,
          explanation:
            "Vendor power management layered on top of stock Doze is the classic Android fragmentation tax, and it is invisible on a Pixel. It is why deferred work must be written to tolerate arbitrary delay rather than assumed to fire on time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-platform-models-q7",
          prompt: "Why does iOS typically reach a high share of devices on the newest OS version faster than Android does?",
          options: [
            "Apple builds and ships the OS to its own hardware directly, with no carrier or OEM in the update path",
            "iOS devices are forcibly updated with no user choice",
            "Apple removes older iOS versions from devices after each release",
            "Android devices cannot receive OS upgrades after launch",
          ],
          correctIndex: 0,
          explanation:
            "Vertical integration removes the OEM-and-carrier hop that slows Android updates. Users still choose when to update on iOS, and Android devices do receive upgrades — just through more intermediaries and for a shorter window.",
        },
        {
          id: "mob-platform-models-q8",
          prompt:
            "Your iOS app needs a capability it is not allowed to use by default, such as a restricted background mode. How is that normally granted?",
          options: [
            "Through an entitlement, requested and approved where necessary, then baked into the signed app",
            "Through a runtime permission dialog shown the first time the API is called",
            "By raising the deployment target to the latest iOS version",
            "By listing the capability in the App Store description",
          ],
          correctIndex: 0,
          explanation:
            "Entitlements are build-time and signing-time grants, some of which require Apple's approval; runtime alerts cover user-owned data like photos or location. Deployment targets and store metadata grant nothing.",
        },
        {
          id: "mob-platform-models-q9",
          prompt:
            "A team argues: \"we should ship on Android first because there's no review, so we can iterate faster.\" What is wrong with that reasoning?",
          options: [
            "Google Play also reviews submissions against policy, and Android's wider device matrix usually costs more iteration time than review does",
            "Nothing is wrong: Android publishes instantly with no checks at all",
            "Android forbids staged rollouts, so each release reaches everyone at once",
            "Android apps cannot use server-side feature flags",
          ],
          correctIndex: 0,
          explanation:
            "Play applies policy review and can reject or suspend apps; the speed difference is real but smaller than the folklore. Meanwhile the variance you must test against is far larger. Staged rollout and remote config work on both platforms.",
        },
      ],
    },
    {
      id: "mob-app-lifecycle",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "The App Lifecycle: Foreground, Background, Suspended, Killed",
      summary:
        "A browser tab lives until the user closes it. A mobile app lives at the OS's discretion. Both platforms model roughly the same states — running and interactive, running but not interactive, in the background doing limited work, suspended in memory executing nothing, and gone — and both reserve the right to move you down that ladder at any moment to give memory, CPU and battery to whatever the user is actually looking at. Apple's documentation is blunt about it: UIKit can disconnect a background or suspended scene at any time to reclaim its resources.\n\nThe consequence web habits miss is that termination is usually *silent*. On iOS, `applicationWillTerminate` is generally **not** called when the system kills a suspended app; you get no callback at all. On Android, `onStop` runs when your UI goes away, but `onDestroy` is not guaranteed if the process is killed, while saved instance state is preserved — which is why Android splits state into a ViewModel (survives configuration changes, dies with the process) and saved state (survives process death, but only small serializable values). Picking the wrong one is the most common Android state bug there is.\n\nSo you design for two different resumes. A *warm* resume from suspension should look instantaneous and keep scroll position, in-flight drafts and the auth session. A resume after process death has to rebuild from persisted state, and the user must not be able to tell the difference. That means \"save as you go\" rather than \"save on exit\", and it means never holding unsaved user input only in memory.\n\nThe gotcha: process death is rare on a developer's device — fast phone, debugger attached, one app in use — and common on a two-year-old mid-range phone with a camera app fighting for memory. Reproduce it deliberately (Android's \"Don't keep activities\", or killing the process from the shell) or you will ship a state-loss path you have never once executed.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Android Developers: The activity lifecycle", url: "https://developer.android.com/guide/components/activities/activity-lifecycle", kind: "docs" },
        { label: "Apple: Managing your app's life cycle", url: "https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle", kind: "docs" },
        { label: "Android Developers: Processes and app lifecycle", url: "https://developer.android.com/guide/components/activities/process-lifecycle", kind: "docs" },
        { label: "Android Developers: Save UI states", url: "https://developer.android.com/topic/libraries/architecture/saving-states", kind: "docs" },
      ],
      video: {
        title: "Learn Android Process Death in 6min",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=xGcZI4oDCtc",
        videoId: "xGcZI4oDCtc",
        durationLabel: "6:26",
      },
      alternateVideos: [
        {
          title: "WWDC25: Finish tasks in the background | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=0aaan-dQN0g",
          videoId: "0aaan-dQN0g",
          durationLabel: "18:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-app-lifecycle-q1",
          prompt: "An iOS app is suspended in the background. The system needs memory and terminates it. Which of your code runs?",
          options: [
            "None of it: a suspended app executes no code, so there is no termination callback",
            "`applicationWillTerminate`, giving you about five seconds to save",
            "The background-task expiration handler you registered earlier",
            "`applicationDidEnterBackground` runs a second time just before the kill",
          ],
          correctIndex: 0,
          explanation:
            "Suspended means \"in memory, running nothing\". Apple's docs state `applicationWillTerminate` is generally not called when the app has moved to the background and the system reclaims it — your last chance to persist was on the way in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-app-lifecycle-q2",
          prompt:
            "An Android app holds a half-typed form in a ViewModel. The user switches to the camera for two minutes; the system kills the process. They return via the app switcher. What do they see?",
          options: [
            "An empty form: the ViewModel died with the process, and only saved state survives",
            "The half-typed form, because ViewModels are persisted to disk automatically",
            "A crash, because the ViewModel can no longer be resolved",
            "The app relaunched at its home screen with no back stack at all",
          ],
          correctIndex: 0,
          explanation:
            "A ViewModel survives configuration changes, not process death. Persisting through a kill requires saved instance state (or a `SavedStateHandle`, or your own storage) — and the system does restore the task's back stack, so the user expects to land back on the form.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-app-lifecycle-q3",
          prompt: "Why is Android's saved instance state limited to small, serializable values rather than arbitrary objects?",
          options: [
            "It is marshalled to the system across a process boundary, so large payloads are slow and can fail outright",
            "It is stored in the app's SQLite database, which has a row size limit",
            "The system encrypts it, and encryption only supports primitives",
            "It is uploaded to the store backend as part of crash reporting",
          ],
          correctIndex: 0,
          explanation:
            "The bundle is handed to the system process so it can outlive yours, and that transaction has a hard size ceiling — stuffing a list of bitmaps into it is a classic production crash. Large data belongs in a database or file, with only an identifier in the bundle.",
        },
        {
          id: "mob-app-lifecycle-q4",
          prompt: "Which events can make an Android screen's UI state disappear if you rely only on in-memory fields? (Select all that apply.)",
          options: [
            "A device rotation",
            "The system killing the app's process while it is in the background",
            "The user changing the system font size or switching to dark mode",
            "The user scrolling a list",
            "A push notification arriving while the app is in the foreground",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rotation and system-setting changes are configuration changes that recreate the screen; process death destroys everything in memory. Scrolling and receiving a notification recreate nothing.",
        },
        {
          id: "mob-app-lifecycle-q5",
          prompt: "Where should an app persist an in-progress user draft so that it survives every plausible interruption?",
          options: [
            "To durable local storage as the user types, debounced, not in a lifecycle exit callback",
            "In a module-level variable, since the process is only killed when the user force-quits",
            "In saved instance state, flushed once from the terminate callback",
            "On the server only, so it is available on the user's other devices",
          ],
          correctIndex: 0,
          explanation:
            "Exit callbacks are exactly what you do not get when the OS kills a suspended app, so \"save as you go\" is the only reliable pattern. A server-only draft fails the moment the user is offline, which on mobile is routine.",
        },
        {
          id: "mob-app-lifecycle-q6",
          prompt: "What is the practical difference between a user force-quitting your app and the system killing it to reclaim memory?",
          options: [
            "Force-quit is an explicit user signal that suppresses some background relaunch behaviour; a system kill is transparent and the app may be relaunched later",
            "There is no difference; both look identical to the OS and to your app",
            "A force-quit clears the app's local storage, a system kill does not",
            "A system kill always produces a crash report, a force-quit never does",
          ],
          correctIndex: 0,
          explanation:
            "The OS reads a force-quit as \"stop doing things for me\" and treats the app more conservatively afterwards; a memory kill is routine housekeeping. Neither touches on-disk data, and neither is a crash — which is why rising background terminations never show up on your crash dashboard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-app-lifecycle-q7",
          prompt: "Your app is backgrounded and needs about 20 seconds to finish uploading a photo the user just posted. What is the correct approach?",
          options: [
            "Ask the system for a short, explicitly bounded window to finish the task, and handle its expiration",
            "Keep a normal thread running and assume backgrounded code continues at full speed",
            "Post a silent notification so the OS grants unlimited background time",
            "Hold a wake lock for the duration of the upload",
          ],
          correctIndex: 0,
          explanation:
            "Both platforms give you a bounded, requestable grace period for finishing work, with an expiration handler you must implement. Nothing about being in the background grants unlimited time, and a notification is not a permit.",
        },
        {
          id: "mob-app-lifecycle-q8",
          prompt: "A team reports \"we can't reproduce the state loss\". What is the most likely reason, and the fix?",
          options: [
            "Their devices are fast and lightly loaded, so process death rarely happens; force it with a developer setting or by killing the process from the shell",
            "It only happens on cellular, so they must test off Wi-Fi",
            "It only reproduces in release builds, so they must detach the debugger",
            "The reports are wrong: the OS never kills a recently used app",
          ],
          correctIndex: 0,
          explanation:
            "Process death is a memory-pressure event, and a developer's phone rarely has memory pressure. Both platforms give you a way to simulate it, and until you do you are shipping a code path you have never executed.",
        },
        {
          id: "mob-app-lifecycle-q9",
          prompt: "Your app writes an analytics event from the callback that fires when a screen is no longer visible. What is the risk?",
          options: [
            "On process death that callback may never run, so screen-exit events are systematically under-counted",
            "The callback fires twice on rotation, so events are double-counted",
            "The event is queued but the OS strips analytics traffic in the background",
            "None: that callback is guaranteed on every platform",
          ],
          correctIndex: 0,
          explanation:
            "Only the \"leaving the foreground\" transitions are dependable; the later ones are best-effort. Analytics that models sessions from exit callbacks quietly loses the worst-behaving sessions — precisely the ones you want to see.",
        },
      ],
    },
    {
      id: "mob-native-vs-cross-platform",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Native vs Cross-Platform vs Web",
      summary:
        "This is the decision the rest of the track hangs off, and it is an organisational decision at least as much as a technical one. Fully native means two codebases — Swift/SwiftUI and Kotlin/Compose — each idiomatic, each getting new OS features the day they ship, each needing its own engineers and release train. Cross-platform (React Native with the New Architecture, Flutter with its own rendering engine, Kotlin Multiplatform sharing logic but not UI) trades some of that for one team and one feature implementation. A web app or PWA trades far more: no store gatekeeper and instant deploys, but weaker platform integration, install friction, and a store guideline (Apple's 4.2, Minimum Functionality) that explicitly rejects apps which are merely a repackaged website.\n\nThe axis that actually decides it is rarely \"performance\". Modern cross-platform stacks are fast enough for the overwhelming majority of product work. What decides it is where your risk concentrates. If your product's value is a deep platform integration — widgets, background location, camera pipelines, health data, watch apps — every one of those is a bridge you will write and maintain yourself, and you will hit the new-API lag on every OS release. If your product is screens over an API, sharing them is close to free and the calculus flips.\n\nThe cost that teams consistently underestimate is that cross-platform saves you UI work, not platform knowledge. You still need someone who understands App Review, entitlements, Doze, runtime permissions, the two notification systems and two signing stories. Choosing Flutter does not delete the last three quarters of this camp; it just means you meet it through a plugin.\n\nThe gotcha is the escape hatch tax. The first 80% of a cross-platform app is faster than native. The last 10% — one screen that needs a native gesture, one SDK with no maintained binding, one OS release that breaks a plugin — costs disproportionately, and it lands late, when the schedule has no slack. Decide with your eyes open on which 10% that will be.",
      level: "expert",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "React Native: Architecture overview", url: "https://reactnative.dev/architecture/landing-page", kind: "docs" },
        { label: "Flutter: Architectural overview", url: "https://docs.flutter.dev/resources/architectural-overview", kind: "docs" },
        { label: "Kotlin: Kotlin Multiplatform", url: "https://kotlinlang.org/docs/multiplatform.html", kind: "docs" },
        { label: "web.dev: Progressive Web Apps", url: "https://web.dev/explore/progressive-web-apps", kind: "article" },
      ],
      video: {
        title: "I Built the Same App with 6 Different Frameworks",
        channel: "Tastemaker Design",
        url: "https://www.youtube.com/watch?v=bdFVDId2rFs",
        videoId: "bdFVDId2rFs",
        durationLabel: "19:28",
      },
      alternateVideos: [
        {
          title: "My honest opinion about SwiftUI vs Flutter vs React Native to build iOS apps",
          channel: "Mykola Harmash",
          url: "https://www.youtube.com/watch?v=OCwcedYTKDc",
          videoId: "OCwcedYTKDc",
          durationLabel: "13:30",
        },
        {
          title: "Is Kotlin Multiplatform Right for Your App?",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=N4h3K73TyZI",
          videoId: "N4h3K73TyZI",
          durationLabel: "8:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-native-vs-cross-platform-q1",
          prompt: "Which work does a cross-platform UI framework genuinely remove, and which does it not? (Select all that apply.)",
          options: [
            "It removes writing the same screen twice",
            "It does not remove understanding App Review, permissions and background execution limits",
            "It does not remove maintaining two signing, provisioning and release pipelines",
            "It removes the need to test on both platforms",
            "It removes the store review gate for both platforms",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sharing the UI layer is the real saving. Everything below it — policy, permissions, power management, signing, store submission — is unchanged, and you still have to test on both because the shared layer sits on two different operating systems.",
        },
        {
          id: "mob-native-vs-cross-platform-q2",
          prompt: "Flutter draws its own widgets with its own rendering engine rather than instantiating platform UI components. What follows from that?",
          options: [
            "Pixel-identical UI across platforms, but platform conventions and accessibility integration must be deliberately reproduced rather than inherited",
            "Flutter apps cannot use platform accessibility services at all",
            "Flutter apps automatically match each platform's native look with no extra work",
            "Flutter apps are rendered on the server and streamed to the device",
          ],
          correctIndex: 0,
          explanation:
            "Owning the pixels buys consistency and removes a class of platform-widget surprises; it also means conventions like the iOS interactive back swipe or the platform's own control metrics are your responsibility. Accessibility is bridged to the platform services, not absent — but it is bridged, which is a thing that can be got wrong.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-native-vs-cross-platform-q3",
          prompt: "Apple announces a new OS capability at WWDC and you want to ship it in your next release. Which approach is structurally fastest?",
          options: [
            "A native iOS app, which can call the new API as soon as the SDK is available",
            "A cross-platform app, because the framework exposes new APIs before Apple ships the SDK",
            "A PWA, because web APIs track OS features immediately",
            "All three are equivalent, since OS APIs are exposed through the same public interface",
          ],
          correctIndex: 0,
          explanation:
            "Native has no intermediary. Cross-platform frameworks need a binding — from the framework team, a plugin author, or you — so there is always a lag, and it is worst for exactly the flashy features you want on day one.",
        },
        {
          id: "mob-native-vs-cross-platform-q4",
          prompt: "What does Kotlin Multiplatform share, and what does it deliberately not share?",
          options: [
            "It shares business logic, networking and data layers while leaving the UI native on each platform",
            "It shares the UI and leaves business logic to be written twice",
            "It compiles Kotlin to JavaScript and runs the whole app in a web view",
            "It shares everything, replacing both SwiftUI and Compose",
          ],
          correctIndex: 0,
          explanation:
            "KMP's default proposition is shared logic with idiomatic native UI, which is why it appeals to teams that already have native apps and want to stop writing the same models twice. (Compose Multiplatform can share UI too, but that is an additional choice, not the base model.)",
        },
        {
          id: "mob-native-vs-cross-platform-q5",
          prompt:
            "Your team wants to wrap the existing responsive web app in a thin native shell and ship it to the App Store. What is the most likely outcome?",
          options: [
            "Rejection under the Minimum Functionality guideline, which explicitly targets apps that are little more than a repackaged website",
            "Approval, since Apple treats web views as a first-class app technology",
            "Approval, but the app is limited to a 10 MB download size",
            "Rejection, because web views are banned from the App Store entirely",
          ],
          correctIndex: 0,
          explanation:
            "Guideline 4.2 asks for features, content and UI that elevate the app beyond a repackaged website. Web views are entirely legal as part of an app — the objection is to an app that is nothing else.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-native-vs-cross-platform-q6",
          prompt: "Which product characteristics push the decision towards fully native? (Select all that apply.)",
          options: [
            "Deep OS integration is the product: widgets, background location, watch apps, camera pipelines",
            "You must adopt brand-new OS APIs in the release where they ship",
            "The app is largely forms and lists over a REST API",
            "You have one small team and a short runway",
            "Design requires each platform to feel unmistakably like itself",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Native earns its cost where the platform itself is the product surface. Screens over an API, and a small team optimising for reach per engineer, are the canonical cross-platform case.",
        },
        {
          id: "mob-native-vs-cross-platform-q7",
          prompt: "React Native's New Architecture replaced the old asynchronous bridge. What problem was the bridge causing?",
          options: [
            "Every call between JavaScript and native was asynchronous and serialised, so layout- and gesture-sensitive work could lag a frame or more",
            "The bridge prevented React Native apps from being published to the App Store",
            "The bridge made JavaScript run on the UI thread, blocking rendering",
            "The bridge limited apps to a single native module",
          ],
          correctIndex: 0,
          explanation:
            "Batched, serialised, async message passing is fine for most updates and bad for anything that must stay in sync with a finger on the screen. The newer design allows direct, synchronous invocation across the boundary and a renderer that can commit on the native side.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-native-vs-cross-platform-q8",
          prompt: "Why does shipping a framework runtime inside your app matter beyond the download number on the store page?",
          options: [
            "Bigger binaries hurt install conversion on slow or metered connections and can add to startup work before your first screen appears",
            "Stores charge developers per megabyte of app size",
            "Larger apps are reviewed more slowly by policy",
            "The OS refuses to keep large apps in memory, so they are always cold-started",
          ],
          correctIndex: 0,
          explanation:
            "Size is a funnel problem in markets with expensive data, and runtime initialisation is real work on the cold-start path. It is not a billing or review issue, and memory eviction is driven by pressure, not by binary size.",
        },
        {
          id: "mob-native-vs-cross-platform-q9",
          prompt:
            "A team adopts a cross-platform stack and is well ahead of schedule at the 80% mark, then slips badly near launch. What is the usual cause?",
          options: [
            "The remaining work is the platform-specific tail: native modules, an unmaintained plugin, and OS behaviours the abstraction does not cover",
            "The framework's performance collapses once the app exceeds a certain number of screens",
            "Store review takes longer for cross-platform apps",
            "Cross-platform apps cannot be profiled, so the slowdown is invisible until the end",
          ],
          correctIndex: 0,
          explanation:
            "The shared layer covers the common cases beautifully and the leftovers are, by definition, the ones it does not cover. Planning for that tail early — by identifying which integrations will need native code — is the difference between a good bet and a bad one.",
        },
      ],
    },
    {
      id: "mob-navigation-patterns",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Navigation Patterns: Stacks, Tabs and Modals",
      summary:
        "Mobile navigation looks like a small set of components — a push stack, a tab bar, a modal sheet — but they are conventions, not choices. The OS itself uses them, every other app on the device uses them, and users navigate by muscle memory rather than by reading your UI. Inventing a new pattern does not read as innovative; it reads as broken. Each pattern also carries a promise: a push means \"deeper into the same thing, and Back returns you\"; a tab means \"a peer section, and switching preserves where I was\"; a modal means \"a self-contained task you will finish or cancel, and then you'll be back exactly here\".\n\nThe structural difference from the web is that navigation state is a real stack the system participates in. Android has a hardware-level Back that you do not own: within your app's task, Up and Back behave identically, Up never exits the app, and Back at the start destination returns the user to the launcher. Deep links do not append — following a deep link replaces the existing back stack with a synthetic one, so a user who lands three levels deep can still walk back up. iOS has no system Back button, so the navigation bar's back button plus the interactive edge-swipe pop *is* the back affordance, and replacing it with a custom button is what silently kills the swipe.\n\nTabs are for peer destinations that a user switches between repeatedly, not for a wizard and not for a hierarchy; on larger screens the same information architecture should adapt to a rail or a two-pane layout rather than staying a phone-shaped tab bar.\n\nThe gotcha is treating navigation as a rendering concern. Push and modal are not just different animations: a modal takes the user out of the current stack, so a link inside it that navigates \"back\" to a tab has to dismiss first, and a modal that pushes four screens is a stack wearing a sheet's clothing. Get the semantics right and the animations follow for free.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Android Developers: Principles of navigation", url: "https://developer.android.com/guide/navigation/principles", kind: "docs" },
        { label: "Apple HIG: Tab bars", url: "https://developer.apple.com/design/human-interface-guidelines/tab-bars", kind: "docs" },
        { label: "Apple HIG: Sheets", url: "https://developer.apple.com/design/human-interface-guidelines/sheets", kind: "docs" },
        { label: "Material 3: Navigation bar guidelines", url: "https://m3.material.io/components/navigation-bar/guidelines", kind: "docs" },
      ],
      video: {
        title: "WWDC22: Explore navigation design for iOS | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=Kd02qR_LyA0",
        videoId: "Kd02qR_LyA0",
        durationLabel: "25:34",
      },
      alternateVideos: [
        {
          title: "Basics for System Back",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=Elpqr5xpLxQ",
          videoId: "Elpqr5xpLxQ",
          durationLabel: "14:10",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-navigation-patterns-q1",
          prompt: "Within your own app's task on Android, how do the Up button and the system Back button relate?",
          options: [
            "They behave identically, except that Up never exits the app while Back at the start destination returns to the launcher",
            "Up always goes to the app's start destination in one step; Back goes one screen",
            "Up is a visual affordance only and performs no navigation",
            "Back navigates the hierarchy; Up navigates chronologically",
          ],
          correctIndex: 0,
          explanation:
            "Android's navigation principles state that Up and Back are identical inside your task, and that Up is simply not shown at the start destination because it never leaves the app. Back is always shown and does leave.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-navigation-patterns-q2",
          prompt:
            "A user opens a notification that deep-links straight into an order detail screen on Android, with your app previously backgrounded on an unrelated screen. What should the back stack look like?",
          options: [
            "A synthetic stack that replaces the previous one, so Back and Up walk up to the app's start destination",
            "Just the order detail screen, so Back immediately exits to the launcher",
            "The previous stack with the order detail screen pushed on top of it",
            "The previous stack, untouched, with the detail screen shown as a modal",
          ],
          correctIndex: 0,
          explanation:
            "Following a deep link replaces the existing back stack with a synthesised one, so the user can navigate up through the hierarchy as if they had arrived manually. Leaving them one Back press from the launcher is the classic deep-link trap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-navigation-patterns-q3",
          prompt: "On iOS, a developer replaces the navigation bar's back button with a custom button to match the brand. What commonly breaks?",
          options: [
            "The interactive swipe-from-the-left-edge gesture that pops the view controller",
            "Deep linking into the screen",
            "The ability to push any further screens onto the stack",
            "VoiceOver's ability to read the screen title",
          ],
          correctIndex: 0,
          explanation:
            "The interactive pop gesture is wired to the standard back item; swapping it out disables the gesture unless you re-enable it deliberately. Since there is no system Back button on iOS, you have just removed one of the user's two ways out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-navigation-patterns-q4",
          prompt: "Which statements about tab bars are true? (Select all that apply.)",
          options: [
            "Tabs represent peer sections of the app, not steps in a sequence",
            "Each tab keeps its own navigation stack, so switching away and back preserves where the user was",
            "Tapping the already-selected tab conventionally returns that tab to its root",
            "Tabs are the right container for a multi-step checkout flow",
            "A tab bar should be hidden while the user is inside a modal task",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "Tabs are for parallel, repeatedly visited sections, each with independent history; re-tapping pops to root. A sequential flow belongs in a stack or modal, and a modal task covers the tab bar precisely because the user is temporarily out of that structure.",
        },
        {
          id: "mob-navigation-patterns-q5",
          prompt: "When is a modal sheet the right container rather than pushing onto the current stack?",
          options: [
            "For a short, self-contained task with a clear finish or cancel, after which the user returns exactly where they were",
            "Whenever the new screen shows different data than the current one",
            "Whenever you want a nicer animation than a push",
            "For the deepest level of a hierarchy, to save a navigation level",
          ],
          correctIndex: 0,
          explanation:
            "Modality is a promise about the user's return path: it interrupts the current context on purpose and hands it back intact. Using it for ordinary hierarchical drill-down strands the user without an Up path.",
        },
        {
          id: "mob-navigation-patterns-q6",
          prompt: "Your app shows a modal sheet on Android. The user presses the system Back button. What should happen?",
          options: [
            "The sheet dismisses, returning the user to the screen underneath",
            "The whole app moves to the background",
            "Nothing: modals are exempt from the Back button",
            "The underlying screen pops while the sheet stays on top",
          ],
          correctIndex: 0,
          explanation:
            "Back consumes the topmost dismissible thing. Swallowing Back inside a modal, or letting it pop the screen behind, are both ways to strand the user in a state they cannot leave.",
        },
        {
          id: "mob-navigation-patterns-q7",
          prompt:
            "The same app runs on a phone and a tablet. What should happen to a five-item bottom tab bar on the larger screen?",
          options: [
            "The information architecture stays the same but the container adapts — a navigation rail or a two-pane layout instead of a bottom bar",
            "Nothing: a bottom tab bar is the correct control at every size",
            "The tabs collapse into a hamburger menu on every screen size above a phone",
            "Each tab opens in its own window",
          ],
          correctIndex: 0,
          explanation:
            "Sections do not change with screen size; the control that exposes them does. Stretching a phone-width bottom bar across a tablet wastes the extra space and puts controls far from the hands holding the device.",
        },
        {
          id: "mob-navigation-patterns-q8",
          prompt: "Why is intercepting the Android Back button to implement your own history a risky pattern?",
          options: [
            "You are overriding a system-wide gesture users trust, and mishandling it breaks predictive back and can trap the user",
            "The platform forbids handling Back in application code",
            "Intercepting Back disables deep links for the whole app",
            "Back handlers are not called when the app was launched from a notification",
          ],
          correctIndex: 0,
          explanation:
            "Handling Back is legitimate and sometimes necessary, but it is a system affordance with an animation contract attached; ad-hoc interception is how apps end up with a Back press that does nothing. Report what you will consume rather than swallowing events reactively.",
        },
        {
          id: "mob-navigation-patterns-q9",
          prompt: "A designer proposes a persistent left drawer as the app's only top-level navigation, copied from the web app. What is the strongest objection?",
          options: [
            "It hides the app's top-level structure behind a tap and puts it out of thumb reach, which is why phones converged on visible bottom-level navigation",
            "Drawers are not implementable on iOS",
            "Drawers cannot be made accessible to screen readers",
            "Drawers prevent deep linking into sections",
          ],
          correctIndex: 0,
          explanation:
            "The objection is discoverability and reachability, not feasibility. A drawer is fine as a secondary container for rarely used destinations; as the only way to see that your app has five sections, it buries them.",
        },
      ],
    },
    {
      id: "mob-touch-and-screen",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Touch, Gestures and the Shape of the Screen",
      summary:
        "A mouse cursor is one pixel; a fingertip is roughly a centimetre of soft tissue that also hides what it is pressing. That is why both platforms specify control sizes in physical-ish units rather than pixels — Apple's guidance is a 44×44 pt default control size for iOS (with 28×28 pt as an absolute minimum), Material's equivalent is a 48 dp touch target — and why the visible artwork and the touch region are separate things: a 20 pt icon can and should carry a 44 pt hit area. You also lose hover entirely, so any affordance that relied on hover to be discoverable has to be redesigned, and long-press is a poor substitute because nothing advertises it.\n\nThe screen is not a rectangle you own. Rounded corners, camera cutouts, the home indicator, the status bar and the software keyboard all take bites out of it, and their sizes differ per device and per orientation. Both platforms expose this as insets: safe-area insets on iOS, `WindowInsets` on Android with separate types for system bars, display cutout and the IME. On Android, once your app targets SDK 35 and runs on Android 15 or newer, edge-to-edge is enforced — your content draws behind the system bars by default, and if you never consumed insets, your header ends up under the status bar. Hard-coded padding that happened to look right on the reviewer's device is the bug this produces.\n\nSize is a runtime property, not a build-time one. Rotation, split-screen, a foldable unfolding and a desktop-style window resize are all the same event class, and on Android they recreate your screen. Design against size *classes* (compact / medium / expanded) rather than device names, and test at the extremes plus with the system font scale turned up, which is where fixed-height rows collapse.\n\nThe gotcha is gesture collision. The edges of the screen belong to the system — back swipe, home, control panels — so a horizontally scrolling carousel or a drag handle placed at the very edge will fight the OS and lose, intermittently, in a way that is almost impossible to reproduce on demand.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Apple HIG: Layout", url: "https://developer.apple.com/design/human-interface-guidelines/layout", kind: "docs" },
        { label: "Android Developers: Display content edge-to-edge", url: "https://developer.android.com/develop/ui/views/layout/edge-to-edge", kind: "docs" },
        { label: "Android Developers: Support different display sizes", url: "https://developer.android.com/develop/ui/compose/layouts/adaptive/support-different-display-sizes", kind: "docs" },
        { label: "LukeW: Touch Target Sizes", url: "https://www.lukew.com/ff/entry.asp?1085", kind: "article" },
      ],
      video: {
        title: "Building adaptive apps for Android",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=cjagE2Ivaro",
        videoId: "cjagE2Ivaro",
        durationLabel: "12:05",
      },
      alternateVideos: [
        {
          title: "Fixing touch target size in PLR",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=2ae-5TlKL8U",
          videoId: "2ae-5TlKL8U",
          durationLabel: "4:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-touch-and-screen-q1",
          prompt:
            "A design calls for a 20 pt close icon in a dialog. What is the correct implementation on iOS?",
          options: [
            "Draw the 20 pt icon but give the control a hit area of around 44×44 pt",
            "Scale the icon up to 44 pt so the visual and the target match",
            "Leave the target at 20 pt: Apple's guidance applies only to text buttons",
            "Place two identical 20 pt controls side by side to widen the target",
          ],
          correctIndex: 0,
          explanation:
            "Apple's guidance is about the control's size, not the artwork's: the default control size for iOS is 44×44 pt with 28×28 pt as an absolute minimum. Expanding the hit region keeps the design and makes the control usable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-touch-and-screen-q2",
          prompt:
            "Your Android app looks fine in testing, then after you raise `targetSdkVersion` to 35 the app bar renders underneath the status bar on Android 15 devices. What happened?",
          options: [
            "Edge-to-edge is enforced once you target SDK 35, so your content now draws behind the system bars and you must apply window insets",
            "Android 15 removed the status bar, so the space is no longer reserved",
            "The status bar height changed, so your hard-coded padding is a few pixels short",
            "The app is being rendered in a compatibility window because it targets a new SDK",
          ],
          correctIndex: 0,
          explanation:
            "Targeting SDK 35 opts you into edge-to-edge on Android 15 and higher. The fix is to consume the system-bar and cutout insets as padding, not to guess a new constant — bar heights vary per device and orientation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-touch-and-screen-q3",
          prompt: "What is the safe area (iOS) / the set of window insets (Android) actually telling you?",
          options: [
            "Which parts of your window are obscured or reserved by system UI — bars, cutouts, the home indicator, the keyboard — so you can keep interactive content clear of them",
            "The maximum size your app's window is allowed to occupy",
            "The area the OS will not render your pixels into at all",
            "The region where the GPU can composite without a copy",
            "The part of the screen visible to screen recording",
          ],
          correctIndex: 0,
          explanation:
            "You may draw into these regions — a background image should extend under the status bar — but you must not put a button under the home indicator or a title under a camera cutout. Insets describe obstruction, not a clipping boundary.",
        },
        {
          id: "mob-touch-and-screen-q4",
          prompt: "Which of these change your app's available size at runtime and should be handled as a layout event rather than a device type? (Select all that apply.)",
          options: [
            "Rotating the device",
            "Entering split-screen or multi-window mode",
            "Unfolding a foldable device",
            "The user increasing the system font size",
            "Connecting a Bluetooth keyboard",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rotation, multi-window and folding all resize the window (and on Android recreate the screen by default). A larger font scale changes content size, not window size — it deserves its own handling — and a keyboard changes input, not layout bounds.",
        },
        {
          id: "mob-touch-and-screen-q5",
          prompt: "A text field near the bottom of a form is hidden by the software keyboard when it opens. What is the correct fix?",
          options: [
            "React to the keyboard inset and scroll or resize the content so the focused field stays visible",
            "Add fixed bottom padding roughly the height of the keyboard",
            "Move the field to the top of the form",
            "Disable scrolling while the keyboard is open so the layout cannot shift",
          ],
          correctIndex: 0,
          explanation:
            "Keyboard height varies by language, by third-party keyboards, by whether a suggestion bar or a hardware keyboard is present, and it animates. Both platforms report it as an inset you can observe; a constant is guaranteed to be wrong somewhere.",
        },
        {
          id: "mob-touch-and-screen-q6",
          prompt:
            "Why do `pt` on iOS and `dp` on Android exist instead of specifying sizes in pixels?",
          options: [
            "They are density-independent units, so one unit is roughly the same physical size on screens with different pixel densities",
            "They are pixel units that only apply to text, while images use raw pixels",
            "They make layout arithmetic integer-only, which is faster to compute",
            "They are a legacy of print typography with no effect on modern devices",
          ],
          correctIndex: 0,
          explanation:
            "The whole point is that a 44 pt control stays a thumb-sized control on a 2× or 3× display. Raw pixels would make the same layout shrink physically as densities rise, which is exactly what you do not want for touch.",
        },
        {
          id: "mob-touch-and-screen-q7",
          prompt:
            "Your horizontally swipeable image carousel spans the full screen width. Users report that swiping sometimes navigates back instead. What is going on?",
          options: [
            "The screen edges are reserved for system gestures, so a horizontal drag starting there is claimed by the OS",
            "Carousels are not supported on touch devices and must be replaced with buttons",
            "The gesture recogniser is registered on the wrong thread",
            "The carousel is intercepting the gesture and the OS is retrying it",
          ],
          correctIndex: 0,
          explanation:
            "Edge-originating horizontal drags mean \"back\" (iOS) or \"back\" in Android's gesture navigation. Inset the carousel from the edges, or opt into the platform's mechanism for excluding a region, rather than fighting for the gesture.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-touch-and-screen-q8",
          prompt:
            "A web team ports a UI where secondary actions appear on hover. What is the right mobile translation?",
          options: [
            "Make the actions visible, or reachable through an explicit affordance such as an overflow button or a swipe with a visible cue",
            "Map hover to long-press and leave the actions otherwise invisible",
            "Show the actions after the user taps once, using the first tap as a hover",
            "Keep hover: touch devices synthesise hover events before the tap",
          ],
          correctIndex: 0,
          explanation:
            "Hidden actions with no affordance are undiscoverable on touch. Long-press is a fine accelerator once a user knows about it, but it cannot be the only path, and a tap-to-reveal first tap breaks the meaning of tapping.",
        },
        {
          id: "mob-touch-and-screen-q9",
          prompt:
            "Rather than branching on \"phone or tablet\", what is the recommended way to make layout decisions?",
          options: [
            "Use size classes derived from the current window size, so split-screen and foldables are handled by the same code path",
            "Branch on the device model string returned by the OS",
            "Branch on the physical screen diagonal in inches",
            "Branch on whether a touch screen is present",
          ],
          correctIndex: 0,
          explanation:
            "Your app gets a window, not a device: a phone-sized window can exist on a tablet in split view, and a tablet-sized one on an unfolded phone. Reasoning about the window's current size class covers every case with one rule.",
        },
      ],
    },
    {
      id: "mob-permissions",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Permissions and the Runtime Permission Flow",
      summary:
        "Permissions are where mobile stops resembling the web most sharply, because the answer is durable and often one-shot. On iOS the authorization prompt is a single interruption: Apple's own documentation says that after the initial prompt the system stores the status and does not prompt again. Call the request API a second time and nothing visible happens — your only remaining move is to explain the situation and deep-link the user into Settings. On Android the model is more forgiving and then abruptly is not: you may ask again, but if the user taps Deny more than once for a given permission over the app's lifetime on that device, the system records a permanent denial (`USER_FIXED`) and stops showing the dialog at all.\n\nSo the request itself is a scarce, non-renewable resource, and the design work happens before you spend it. Ask in context, at the moment the user has expressed intent, never at launch as a wall of dialogs. Both platforms support an in-app explanation screen first — and Apple's guidance is specific that such a screen must have exactly one button which opens the system alert, and must not be labelled \"Allow\", because dressing your button up as the system's is manipulation. Android exposes `shouldShowRequestPermissionRationale()` to tell you whether the user has already declined once, which is the signal to explain rather than re-ask blindly.\n\nAndroid also splits permissions three ways: install-time (normal and signature), runtime (the dangerous ones, with a dialog), and special (`appop`) permissions such as drawing over other apps or managing all files, which are granted on a full Settings screen rather than in a dialog. Notifications joined the runtime set in Android 13, and on a fresh install notifications are off until you ask.\n\nThe gotcha that reaches production: a permission can be revoked at any time from Settings, and unused apps can have permissions auto-reset. Check the status every time you are about to use the capability, not once at startup and never again — and on iOS make sure the usage-description key is in `Info.plist` before the first call, because the system terminates an app that touches a protected capture API without one.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Android Developers: Permissions on Android", url: "https://developer.android.com/guide/topics/permissions/overview", kind: "docs" },
        { label: "Android Developers: Request runtime permissions", url: "https://developer.android.com/training/permissions/requesting", kind: "docs" },
        { label: "Apple HIG: Privacy", url: "https://developer.apple.com/design/human-interface-guidelines/privacy", kind: "docs" },
        { label: "Apple: Requesting authorization to use location services", url: "https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services", kind: "docs" },
      ],
      video: {
        title: "Permissions in Android",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=zCAx4WZ98rs",
        videoId: "zCAx4WZ98rs",
        durationLabel: "3:17",
      },
      alternateVideos: [
        {
          title: "The ULTIMATE Permission Handling Guide (Showing rationale + Permanently Declined)",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=D3JCtaK8LSU",
          videoId: "D3JCtaK8LSU",
          durationLabel: "34:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-permissions-q1",
          prompt:
            "On iOS, a user taps \"Don't Allow\" on your location prompt. Later they tap a button that calls the request API again. What happens?",
          options: [
            "Nothing visible: the system has stored the decision and won't prompt again, so you must guide the user to Settings",
            "The system alert is shown again, since each request is independent",
            "The system shows a different alert offering a one-time allowance",
            "The app crashes, because requesting a denied permission is an error",
          ],
          correctIndex: 0,
          explanation:
            "Apple documents the authorization flow as a one-time interruption; after it, the status is stored and the system does not prompt again. Handling denial therefore means explaining the consequence in your UI and offering a route into Settings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-permissions-q2",
          prompt:
            "On Android, your app asks for the camera permission at launch. The user denies it. Two screens later, when they actually tap \"Take photo\", you ask again and they deny again. What is the state now?",
          options: [
            "Permanently denied: after more than one Deny, the system stops showing the dialog for that permission until the app is reinstalled or the user changes it in Settings",
            "Still askable: Android allows three denials before it stops prompting",
            "Granted for a single use, because the second request came from a user action",
            "Reset, because the second request came from a different screen",
          ],
          correctIndex: 0,
          explanation:
            "Android treats a second Deny as \"don't ask again\" and flags the permission `USER_FIXED`. Spending the first request on a launch-time prompt the user had no reason to accept is exactly how a team burns the ability to ever ask properly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-permissions-q3",
          prompt: "What is `shouldShowRequestPermissionRationale()` for on Android?",
          options: [
            "It tells you the user has already declined once, so you should explain why you need the permission before asking again",
            "It shows the system's own rationale dialog on your behalf",
            "It returns whether the permission is currently granted",
            "It reports whether the permission is a runtime permission or an install-time one",
          ],
          correctIndex: 0,
          explanation:
            "It is a signal about the user's history, not a UI call and not a status check. Note the asymmetry: it also returns false when you have never asked, so it cannot be used on its own to distinguish \"fresh\" from \"permanently denied\".",
        },
        {
          id: "mob-permissions-q4",
          prompt: "Which statements about permission state are true on current Android and iOS? (Select all that apply.)",
          options: [
            "A user can revoke a granted permission at any time from system Settings",
            "You must check the current status immediately before using the capability, not only at startup",
            "A permission the app has not used for a long time can be reset automatically",
            "Once granted, a permission is guaranteed for the lifetime of the installation",
            "Granting a permission on one device grants it on the user's other devices",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Permissions are revocable and, for unused apps, automatically resettable, so treating a grant as permanent is a bug waiting for a support ticket. Nothing about a grant syncs across devices.",
        },
        {
          id: "mob-permissions-q5",
          prompt:
            "Your iOS app calls a camera capture API but `NSCameraUsageDescription` is missing from `Info.plist`. What happens?",
          options: [
            "The system terminates the app",
            "The request silently returns denied and the app continues",
            "The system substitutes a generic explanation in the alert",
            "The app builds but is rejected at submission and never runs",
          ],
          correctIndex: 0,
          explanation:
            "Apple's capture documentation is explicit: the key must be present before you request authorization or touch a capture device, otherwise the system terminates your app. It is caught at runtime, not at build time, which is why it so often ships.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-permissions-q6",
          prompt:
            "You want to show an explanation screen before the system location alert on iOS. Which design does Apple's guidance call for?",
          options: [
            "A single button that opens the system alert, labelled something neutral like \"Continue\"",
            "Two buttons, \"Allow\" and \"Not now\", matching the system alert's wording",
            "A button labelled \"Allow\" styled like the system's, so the flow feels continuous",
            "No button: dismiss the screen automatically after a few seconds and show the alert",
          ],
          correctIndex: 0,
          explanation:
            "The HIG asks for exactly one button that leads to the alert, and warns against titling it \"Allow\": a custom button that looks like the system's makes people tap the real Allow without meaning to. An extra dismissal path also diverts users from making the actual choice.",
        },
        {
          id: "mob-permissions-q7",
          prompt: "Android groups permissions into install-time, runtime and special permissions. What characterises a special permission?",
          options: [
            "It guards a powerful app operation such as drawing over other apps or managing all files, and is granted on a dedicated Settings screen rather than in a dialog",
            "It is granted automatically to apps signed with the platform key",
            "It is requested with the same dialog as runtime permissions but never expires",
            "It is declared in the manifest and granted silently at install time",
          ],
          correctIndex: 0,
          explanation:
            "Special (`appop`) permissions are defined by the platform and OEMs and deliberately have higher friction — you send the user to a system settings screen and then re-check. Install-time permissions are the silent ones; runtime permissions are the dialog ones.",
        },
        {
          id: "mob-permissions-q8",
          prompt: "A user installs your app fresh on a device running Android 13 or later. What is the state of notifications?",
          options: [
            "Off: `POST_NOTIFICATIONS` is a runtime permission, so you must ask before anything appears in the notification drawer",
            "On: notifications are enabled by default and the user can turn them off in Settings",
            "On for the first 30 days, then automatically revoked if unused",
            "Off, but push messages still display because remote notifications bypass the permission",
          ],
          correctIndex: 0,
          explanation:
            "Since Android 13 notifications are opt-in for new installs, and a denial blocks your notification channels regardless of where the message came from. Existing apps upgraded from older OS versions can be pre-granted, which is why this often looks fine until you test a clean install.",
        },
        {
          id: "mob-permissions-q9",
          prompt: "What is the strongest argument for requesting a permission in context rather than during onboarding?",
          options: [
            "The user has just expressed intent, so the request is self-explanatory and far more likely to be granted — and requests are effectively non-renewable",
            "Onboarding requests are blocked by both platforms",
            "In-context requests can be repeated as often as you like",
            "In-context requests do not require a usage description string",
          ],
          correctIndex: 0,
          explanation:
            "You get roughly one good ask; spending it on a stranger at launch wastes it, and a denial is durable on both platforms. Onboarding requests are permitted, just usually a bad trade.",
        },
      ],
    },
    {
      id: "mob-offline-storage",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Offline-First and Local Storage",
      summary:
        "On the web, \"offline\" is an error state. On mobile it is a normal operating condition: lifts, trains, basements, aeroplanes, a phone that has wandered off Wi-Fi onto a weak cellular signal. Offline-first inverts the usual data flow — the local store becomes the source of truth the UI reads from, and the network becomes a background process that reconciles it with the server. The screen renders instantly from disk, a write is applied locally and queued, and sync is an implementation detail the user never sees. Android's own architecture guidance is built on exactly this shape.\n\nThe hard part is never reads; it is writes. Two devices edit the same record offline and you must choose a conflict policy with your eyes open: last-write-wins is trivial and silently destroys data, server-authoritative is predictable but throws away the user's work, per-field merge is better and more code, and CRDTs give you automatic convergence at the cost of a data model most teams are not ready to adopt. Whatever you choose, every queued mutation needs a client-generated idempotency key, because \"did that request reach the server before the connection died?\" is unanswerable from the client.\n\nWhere data lives matters too. Small flags go in key-value preferences, structured data in a local database, blobs on the file system with only a path in the database, and secrets — tokens, refresh tokens, keys — in the Keychain or the Android Keystore, never in plain preferences. Caches belong in a directory the OS is allowed to purge, so treat anything there as disposable.\n\nThe gotcha is schema migration. The local database is on the user's device, and you cannot run a migration script against it from your server. A user can skip five versions, so migration code has to carry every path you have ever shipped, and \"drop and recreate\" means destroying unsynced writes. Design the local schema as a public interface with a long support window, exactly like your API.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Android Developers: Build an offline-first app", url: "https://developer.android.com/topic/architecture/data-layer/offline-first", kind: "docs" },
        { label: "Ink & Switch: Local-first software", url: "https://www.inkandswitch.com/local-first/", kind: "article" },
        { label: "Apple: Keychain services", url: "https://developer.apple.com/documentation/security/keychain-services", kind: "docs" },
        { label: "Android Developers: Security checklist", url: "https://developer.android.com/privacy-and-security/security-tips", kind: "docs" },
      ],
      video: {
        title: "Create offline-first apps",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=jaZ2gLMGUsM",
        videoId: "jaZ2gLMGUsM",
        durationLabel: "5:59",
      },
      alternateVideos: [
        {
          title: "Local-first vs Offline-first in 100 Seconds",
          channel: "PowerSync",
          url: "https://www.youtube.com/watch?v=kjOx-Le5gB8",
          videoId: "kjOx-Le5gB8",
          durationLabel: "2:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-offline-storage-q1",
          prompt: "In an offline-first architecture, what does the UI read from?",
          options: [
            "The local store, always; the network updates the local store in the background",
            "The network, falling back to a cache when a request fails",
            "Whichever responds first, the cache or the network",
            "The network on foreground, the cache only while the device reports being offline",
          ],
          correctIndex: 0,
          explanation:
            "A single, always-available read path is the whole point: the screen never has a loading-or-error fork, and \"offline\" stops being a special case. Race-the-network patterns reintroduce two sources of truth and the inconsistencies that come with them.",
        },
        {
          id: "mob-offline-storage-q2",
          prompt:
            "A queued \"create order\" request is sent, the connection drops before the response arrives, and the client retries on reconnect. Without further measures, what can happen?",
          options: [
            "Two orders are created, because the first request may well have succeeded server-side",
            "Nothing: an interrupted request is always rolled back by the server",
            "The retry is rejected automatically because the payload is identical",
            "The order is created but marked as a duplicate by the transport layer",
          ],
          correctIndex: 0,
          explanation:
            "A dropped connection tells you nothing about what the server did. A client-generated idempotency key sent with the original request and every retry lets the server recognise and deduplicate it — this is why the key must be generated when the mutation is queued, not when it is sent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-offline-storage-q3",
          prompt: "Which items belong in the Keychain / Android Keystore rather than ordinary local storage? (Select all that apply.)",
          options: [
            "The user's refresh token",
            "An API key the app uses to authenticate itself",
            "A symmetric key the app uses to encrypt local data",
            "The user's chosen theme and language",
            "The last-synced timestamp for a list",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Secrets and key material go in the secure store, which is backed by OS protections and (on Android) can be hardware-backed. Preferences and sync bookkeeping are not secrets, and putting them there buys nothing but latency.",
        },
        {
          id: "mob-offline-storage-q4",
          prompt:
            "Your app ships a local database migration for v5. Analytics show users updating from v2 directly to v5. What must your migration code handle?",
          options: [
            "Every path from every version you have shipped, because you cannot run a script on the user's device from your server",
            "Only the v4-to-v5 step, since the stores apply intermediate updates in order",
            "Nothing: the OS migrates app databases automatically between versions",
            "Only the paths from versions still available in the store",
          ],
          correctIndex: 0,
          explanation:
            "Users skip versions routinely, and the store installs the latest build directly. Migrations are code you ship and must test as a chain — and a \"just recreate the table\" shortcut deletes any writes that had not synced yet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-offline-storage-q5",
          prompt: "What is the main practical objection to last-write-wins as a conflict resolution strategy?",
          options: [
            "It silently discards one side's changes, and the loser is chosen by clock ordering the user cannot see or reason about",
            "It requires a CRDT library on both client and server",
            "It cannot be implemented without server-side transactions",
            "It only works when all clients are online simultaneously",
          ],
          correctIndex: 0,
          explanation:
            "LWW is cheap and usually fine for single-user, single-device data; it becomes a data-loss bug the moment two devices or two people touch a record. Per-field merge or an explicit conflict UI costs more code and loses nothing silently.",
        },
        {
          id: "mob-offline-storage-q6",
          prompt: "Where should a 6 MB image the user just attached be stored while it waits to upload?",
          options: [
            "On the file system in a directory the OS won't purge, with its path and upload state recorded in the database",
            "As a blob column in the local database, so it is covered by the same transaction",
            "In key-value preferences, base64-encoded",
            "In the cache directory, since it is temporary until the upload finishes",
          ],
          correctIndex: 0,
          explanation:
            "Databases and preferences are the wrong shape for large binaries, and the cache directory is explicitly reclaimable by the OS — a pending upload that the system deletes under storage pressure is silent data loss. Keep the bytes as a file and the bookkeeping in the database.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-offline-storage-q7",
          prompt: "A user deletes a record on device A while device B is offline. When B reconnects and syncs, what stops the record reappearing?",
          options: [
            "The server records the deletion as a tombstone that sync can propagate, rather than the row simply vanishing",
            "The client compares row counts and drops the extra record",
            "Nothing is needed: sync always takes the server's state wholesale",
            "Device B's local record expires on its own after a timeout",
          ],
          correctIndex: 0,
          explanation:
            "Deletion is the one change that is invisible in a diff of what exists, so it has to be represented explicitly. Without tombstones, an offline client re-uploads its still-present copy and the record resurrects — a classic sync bug.",
        },
        {
          id: "mob-offline-storage-q8",
          prompt: "An offline-capable app applies a write locally and shows it immediately. What does that oblige the UI to handle?",
          options: [
            "A visible pending state, and a recoverable path when the server ultimately rejects the write",
            "Nothing extra: a local write that succeeded will always succeed remotely",
            "Blocking further edits to that record until it syncs",
            "A full reload of the screen once the sync completes",
          ],
          correctIndex: 0,
          explanation:
            "Optimistic UI is a promise you might have to break: the server can reject on validation, permissions or a conflict. Users tolerate that well if the item was visibly pending and they can retry or edit; they do not tolerate work disappearing.",
        },
        {
          id: "mob-offline-storage-q9",
          prompt: "What does \"local-first\" add to \"offline-first\" as usually practised?",
          options: [
            "It treats the local copy as the primary, durable artefact — the app stays fully usable and the data remains the user's even if the service disappears",
            "It means the app has no server component at all",
            "It means data is encrypted on the device rather than in transit",
            "It is the same idea with a different name",
          ],
          correctIndex: 0,
          explanation:
            "Offline-first is mostly an availability technique; local-first is a stronger ownership claim about where the canonical data lives and what happens when the vendor goes away. The engineering overlaps heavily, but the design goals differ.",
        },
      ],
    },
    {
      id: "mob-networking",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Networking on a Flaky Connection",
      summary:
        "Server-to-server networking fails cleanly: a connection refused, a 500, a timeout. Mobile networking fails *ambiguously*. The radio cycles between power states, so the first request after an idle period pays an extra setup cost; a train tunnel gives you a TCP connection that neither delivers nor errors; a captive portal answers every request with a login page and 200 OK. \"The device reports connectivity\" and \"this request will succeed\" are different statements, which is why reachability checks are a hint for UI copy and never a gate on whether to attempt a request.\n\nThe defence is a small set of well-worn mechanisms. Every request gets an explicit deadline, and the deadline for the whole operation is not the same thing as a socket read timeout. Retries are bounded, exponentially backed off, and **jittered** — without randomisation, every client that failed during an outage retries at the same instant and re-creates the outage the moment the server recovers. Retry only what is safe to retry: idempotent methods, or non-idempotent ones carrying an idempotency key. A 4xx other than 408 or 429 is a bug in the request; retrying it just burns battery.\n\nLong transfers should not live in your process at all. Both platforms will run a download or upload on your behalf, surviving app suspension and even process death, and will apply constraints such as \"unmetered network only\" and \"device charging\" — that is what background sessions on iOS and persistent work on Android are for. Android's Doze compounds this: when the device is idle, network access is suspended and jobs, syncs and alarms are deferred to periodic maintenance windows, so deferred work must tolerate arbitrary delay rather than assume a schedule.\n\nThe gotcha is chattiness. Each wake of the radio costs battery for seconds after the bytes stop, so twenty small polls scattered across a minute cost far more than one batched request — and on a high-latency link, round trips, not bandwidth, are what the user experiences as slowness.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Apple: Downloading files in the background", url: "https://developer.apple.com/documentation/foundation/downloading-files-in-the-background", kind: "docs" },
        { label: "Android Developers: Task scheduling and persistent work", url: "https://developer.android.com/develop/background-work/background-tasks/persistent", kind: "docs" },
        { label: "AWS Builders' Library: Timeouts, retries and backoff with jitter", url: "https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter", kind: "article" },
        { label: "Android Developers: Optimize for Doze and App Standby", url: "https://developer.android.com/training/monitoring-device-state/doze-standby", kind: "docs" },
      ],
      video: {
        title: "WWDC23: Build robust and resumable file transfers | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=pBBKkppW9kw",
        videoId: "pBBKkppW9kw",
        durationLabel: "20:39",
      },
      alternateVideos: [
        {
          title: "WorkManager - Android Basics 2023",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=A2JetouoNSc",
          videoId: "A2JetouoNSc",
          durationLabel: "34:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-networking-q1",
          prompt: "Why add random jitter to an exponential backoff schedule?",
          options: [
            "To spread retries out, so clients that failed together don't all retry at the same instant and knock the service over again",
            "To make the retry interval longer on average, reducing total load",
            "To make retries unpredictable so the server cannot rate-limit them",
            "Because exponential backoff alone overflows after a few attempts",
          ],
          correctIndex: 0,
          explanation:
            "Backoff fixes the rate per client; jitter fixes the correlation between clients. Without it, an outage synchronises the whole fleet and recovery triggers a thundering herd at 1 s, 2 s, 4 s and so on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-networking-q2",
          prompt: "Which responses are worth retrying automatically? (Select all that apply.)",
          options: [
            "A request that timed out with no response at all",
            "`503 Service Unavailable`",
            "`429 Too Many Requests`, respecting any `Retry-After`",
            "`401 Unauthorized` on a request with an expired-looking token, retried with the same token",
            "`422 Unprocessable Entity` from a validation failure",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Retry transient, server-side or rate-limit conditions. Re-sending the same rejected credentials or the same invalid body will fail identically every time — the 401 case deserves a token refresh, which is a different action, not a retry.",
        },
        {
          id: "mob-networking-q3",
          prompt:
            "Your app checks a reachability API, sees \"connected to Wi-Fi\", and enables the Submit button. Users on hotel and airport Wi-Fi report that submitting hangs. What is wrong with the design?",
          options: [
            "Connectivity is not reachability of your server; a captive portal can accept the connection and answer everything with a login page",
            "Reachability APIs don't work on Wi-Fi, only on cellular",
            "The app should poll reachability more frequently",
            "Wi-Fi requires an explicit permission the app has not requested",
          ],
          correctIndex: 0,
          explanation:
            "Interface state says a network exists, not that your API is reachable through it. Attempt the request with a deadline and treat the result as the truth; use connectivity signals only to word the error message.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-networking-q4",
          prompt:
            "A user starts a 200 MB video upload and immediately switches to another app; a few minutes later the OS terminates your process. What design makes the upload still complete?",
          options: [
            "Hand the transfer to the platform's background transfer service, which continues outside your process and relaunches the app to report completion",
            "Start a long-running thread before backgrounding and keep it alive",
            "Ask for a short background execution window and extend it repeatedly",
            "Show a persistent progress notification, which prevents termination",
          ],
          correctIndex: 0,
          explanation:
            "Only work the system owns survives your process dying. Threads die with the process, the finish-my-task grace period is measured in tens of seconds, and a notification is not a lifetime guarantee.",
        },
        {
          id: "mob-networking-q5",
          prompt: "An Android device has been sitting on a desk, unplugged and screen-off, for an hour. What happens to your app's scheduled sync?",
          options: [
            "Doze suspends network access and defers jobs, syncs and standard alarms to the next maintenance window, which recurs less often the longer the device stays idle",
            "It runs on schedule; Doze only affects foreground services",
            "It is cancelled permanently and must be rescheduled by the user",
            "It runs but is limited to a few kilobytes of traffic",
          ],
          correctIndex: 0,
          explanation:
            "Doze batches deferred work into periodic maintenance windows and spaces those windows out over time. Deferred means deferred — code that assumes \"every 15 minutes\" is a schedule rather than a hint will behave very differently in the field than on a plugged-in test device.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-networking-q6",
          prompt: "Why is a socket read timeout insufficient on its own as a request deadline?",
          options: [
            "It only bounds the gap between bytes, so a connection that trickles data can hold the request open indefinitely",
            "It is ignored on cellular networks",
            "It applies only to the response headers, not the body",
            "It cannot be configured on mobile HTTP clients",
          ],
          correctIndex: 0,
          explanation:
            "A stalled-but-not-dead connection is the characteristic mobile failure, and an inter-byte timer never fires against a slow trickle. Set an overall deadline for the operation as well, so the user sees a definite outcome.",
        },
        {
          id: "mob-networking-q7",
          prompt:
            "An app polls three small endpoints every 20 seconds while in the foreground. What is the cheapest correct fix for the battery complaints?",
          options: [
            "Batch the calls into one request and lengthen or event-drive the interval, so the radio wakes far less often",
            "Move the polling to a background thread",
            "Compress each response with gzip",
            "Switch the three calls from HTTP/1.1 to HTTP/2",
          ],
          correctIndex: 0,
          explanation:
            "The radio stays in a high-power state for seconds after each transfer, so the number of wakes dominates the number of bytes. Threading changes nothing about the radio, and compression or multiplexing help bytes and round trips, not wake frequency.",
        },
        {
          id: "mob-networking-q8",
          prompt: "Which of these are genuine differences between a mobile client's network and a server's? (Select all that apply.)",
          options: [
            "Latency and bandwidth vary by an order of magnitude within a single session",
            "The connection can stall without failing, so requests hang rather than erroring",
            "The process making the request can be suspended or killed mid-flight",
            "TLS handshakes are not required on cellular networks",
            "DNS resolution is handled by the app rather than the OS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Variance, ambiguous stalls and a host that can disappear are what make mobile networking its own discipline. TLS and DNS work the same way they do anywhere else.",
        },
        {
          id: "mob-networking-q9",
          prompt:
            "You are resuming a large download that was interrupted at 60%. What lets you continue instead of starting over?",
          options: [
            "A ranged request for the remaining bytes, validated against a strong validator such as an `ETag` so you don't splice two different versions together",
            "Sending the same request again and letting the server deduplicate it",
            "Keeping the original connection object alive across the interruption",
            "Requesting the file with `Accept-Encoding: identity` so it can be resumed",
          ],
          correctIndex: 0,
          explanation:
            "Resumption is a range request plus a check that the resource has not changed underneath you; without the validator you can end up with a file made of two different versions. The connection itself is long gone.",
        },
      ],
    },
    {
      id: "mob-push-notifications",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Push Notifications on Both Platforms",
      summary:
        "Your server never talks to the device. It talks to Apple Push Notification service or Firebase Cloud Messaging, which maintain a single multiplexed connection per device on behalf of every app — that shared connection is the whole reason push is cheaper than every app holding its own socket open. Your side of the contract is: the app registers, receives a token, sends it to your backend, and your backend addresses messages to that token through the provider.\n\nTokens are the first thing teams get wrong. A token identifies an app installation on a device, not a user; it can change, it becomes stale when an app is uninstalled or a device sits unused, and one user can have several. So the token table is many-to-one with users, is written on every launch, and is pruned using the provider's feedback about unregistered or inactive tokens — otherwise your delivery statistics slowly fill with ghosts.\n\nDelivery is best-effort by design, and both providers give you knobs that trade immediacy for battery. A time-to-live lets a message expire rather than arrive stale; a collapse key means that while a device is offline only the last message in that group survives, which is perfect for \"you have 3 unread\" and catastrophic for a chat transcript. Doze defers normal-priority messages to maintenance windows on Android, and iOS throttles silent background pushes hard. Payloads are small — APNs refuses anything over 4 KB (5 KB for VoIP) — and on Android 13 and later a user who has not granted the notification permission sees nothing at all.\n\nThe design rule that falls out of all this: treat a push as a *hint*, never as a transport. It tells the app that something may have changed; the app then fetches authoritative state over your normal API. An app that reconstructs data from notification payloads is broken for every user whose device was asleep, out of coverage, or simply collapsed a message you assumed would arrive.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Apple: Setting up a remote notification server", url: "https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server", kind: "docs" },
        { label: "Firebase: Understand message delivery", url: "https://firebase.google.com/docs/cloud-messaging/understand-delivery", kind: "docs" },
        { label: "Android Developers: Notification runtime permission", url: "https://developer.android.com/develop/ui/compose/notifications/notification-permission", kind: "docs" },
        { label: "Apple: Pushing background updates to your app", url: "https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app", kind: "docs" },
      ],
      video: {
        title: "How Push Notifications Work on iOS and Android",
        channel: "Jimmy Cook",
        url: "https://www.youtube.com/watch?v=4BFRAQuuEfc",
        videoId: "4BFRAQuuEfc",
        durationLabel: "7:08",
      },
      alternateVideos: [
        {
          title: "How Do Push Notifications Work?",
          channel: "Gerald Versluis",
          url: "https://www.youtube.com/watch?v=AKYebqOCAzY",
          videoId: "AKYebqOCAzY",
          durationLabel: "8:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-push-notifications-q1",
          prompt: "What maintains the connection that delivers a push notification to a device?",
          options: [
            "A single persistent connection per device to the platform's push service, shared by every app on it",
            "One persistent connection per app, opened by the app at launch",
            "A polling loop in each app, woken by the OS every few minutes",
            "A direct connection from your backend to the device's IP address",
          ],
          correctIndex: 0,
          explanation:
            "Multiplexing one connection across all apps is why push is battery-viable at all. Your backend never reaches the device directly — it hands messages to APNs or FCM, which is also why delivery guarantees are theirs, not yours.",
        },
        {
          id: "mob-push-notifications-q2",
          prompt: "What does a push token identify?",
          options: [
            "One installation of your app on one device — it can change, and a single user may have several",
            "The user account, stable across their devices and reinstalls",
            "The device, shared by every app installed on it",
            "The current session, expiring when the app is backgrounded",
          ],
          correctIndex: 0,
          explanation:
            "Tokens are per app-install and can be reissued, so your schema needs many tokens per user, refreshed on launch and pruned when the provider reports them unregistered. Treating a token as a user id is how people get notifications meant for someone else after a device is resold.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-push-notifications-q3",
          prompt:
            "Your backend sends 40 chat messages to a device that is offline, all with the same collapse key. The device comes back online. What arrives?",
          options: [
            "One message: the last one sent with that collapse key",
            "All 40, in order",
            "The first message only; the rest are rejected at send time",
            "A summary message generated by the push service",
          ],
          correctIndex: 0,
          explanation:
            "A collapse key explicitly means \"only the newest of this group matters\", which is right for a badge count or a status update and wrong for a transcript. This is the concrete reason a push is a hint to re-sync rather than a delivery channel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-push-notifications-q4",
          prompt: "You want to include a 60 KB JSON object in a notification so the app can render a rich screen without a network call. What happens?",
          options: [
            "APNs rejects the notification: the payload limit is 4 KB (5 KB for VoIP)",
            "It is delivered but truncated to the first 4 KB",
            "It is delivered only over Wi-Fi",
            "It is accepted, but only if the app has a notification service extension",
          ],
          correctIndex: 0,
          explanation:
            "Apple's documentation states APNs refuses a notification whose total payload exceeds 4 KB, or 5 KB for VoIP. Send an identifier and let the app fetch the content — which it needs to be able to do anyway, since the notification may never arrive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-push-notifications-q5",
          prompt: "Which of these can cause a sent notification never to appear on the user's device? (Select all that apply.)",
          options: [
            "The user has not granted the notification permission",
            "The message's time-to-live expired while the device was offline",
            "A later message with the same collapse key superseded it",
            "The message payload was valid JSON but not pretty-printed",
            "The app was in the foreground at the time",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Permission, TTL expiry and collapsing are all ordinary, documented outcomes. Formatting is irrelevant, and a foreground app still receives the message — it just gets to decide how to present it.",
        },
        {
          id: "mob-push-notifications-q6",
          prompt: "Your feature depends on a silent background push waking the app to pre-fetch data every time content changes. What is the flaw?",
          options: [
            "Background pushes are throttled and best-effort, so the feature must degrade gracefully when they are delayed or dropped",
            "Silent pushes are not supported on either platform",
            "Silent pushes require the user to grant a separate permission",
            "Silent pushes can only be sent once per day per device",
          ],
          correctIndex: 0,
          explanation:
            "Both platforms deliberately ration background wakeups to protect battery, and low-priority messages get deferred under Doze or throttled by the system. Design for eventual freshness — fetch on foreground too — rather than assuming the wake-up.",
        },
        {
          id: "mob-push-notifications-q7",
          prompt: "A user installs your Android app fresh, and your server immediately sends a notification. They see nothing. What is the most likely cause?",
          options: [
            "On Android 13 and later notifications are off until the user grants the runtime permission, and the app had not asked",
            "FCM requires the app to have been opened at least three times",
            "The message needs a collapse key to be displayed",
            "Notifications are blocked for the first 24 hours after install",
          ],
          correctIndex: 0,
          explanation:
            "A denial or an unasked permission blocks the notification channels entirely, regardless of who sent the message. This bites teams whose test devices were upgraded from older OS versions and therefore had the permission pre-granted.",
        },
        {
          id: "mob-push-notifications-q8",
          prompt:
            "What is the right architecture for \"tell the user there's a new message, and show the message when they tap\"?",
          options: [
            "Send a small push containing an identifier and display text; on tap, open the app and fetch the authoritative content from your API",
            "Put the full message body in the push payload and render it from local state only",
            "Send the push, then poll from the app every 30 seconds until the content is found",
            "Send one push per recipient device with the complete conversation attached",
          ],
          correctIndex: 0,
          explanation:
            "The push carries enough to render a useful banner and to identify what changed; everything authoritative comes from your API, which works whether the push arrived, arrived late, or never arrived at all.",
        },
        {
          id: "mob-push-notifications-q9",
          prompt: "Why should your backend act on the provider's feedback about unregistered or inactive tokens?",
          options: [
            "Stale tokens inflate send volume and skew delivery metrics, and they can accumulate toward provider quotas",
            "Providers charge per stale token retained",
            "Retaining stale tokens causes notifications to be delivered to the wrong user",
            "Tokens are limited to 100 per app and stale ones consume the quota",
          ],
          correctIndex: 0,
          explanation:
            "Uninstalled apps and inactive devices leave tokens that can never be delivered to; keeping them makes every delivery-rate dashboard lie and wastes send capacity, especially on topic fan-outs.",
        },
      ],
    },
    {
      id: "mob-store-review",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "App Store Submission and Review",
      summary:
        "Both stores are gatekeepers with published opinions, and reading those opinions before you design is cheaper than discovering them at submission. Apple's App Store Review Guidelines are the more prescriptive document and they are enforced by human reviewers: the guidelines open by saying every app is reviewed by experts. Google Play's Developer Policy Center covers similar ground — content, data safety, permissions, monetisation — alongside technical requirements like the target API level floor.\n\nMost rejections are boring and avoidable. Guideline 2.1 (App Completeness) asks for a final build, working URLs, a live backend during review and a demo account (or a built-in demo mode) if the app has a login; a reviewer who cannot get past your sign-in screen rejects the submission, every time. Guideline 2.3.1 requires new features and non-obvious functionality to be described specifically in the Notes for Review, and forbids hidden or undocumented behaviour. Guideline 4.2 rejects apps that are little more than a repackaged website. Guideline 2.5.2 says apps must be self-contained and may not download, install or execute code that introduces or changes features — the rule that constrains how far over-the-air bundle updates can go. Monetisation is where teams are most often surprised: digital content unlocked inside the app must use in-app purchase (3.1.1), while physical goods and services consumed outside the app **must not** (3.1.3(e)).\n\nA rejection is a conversation, not a verdict. You reply, you fix, you can appeal, and Apple's own guidelines carve out bug-fix submissions for apps already on the store, which are not held up over guideline issues except legal or safety ones.\n\nThe gotcha is treating approval as the release. Approval is permission; release is a separate decision, and every sane launch plan approves the build days early, holds it for manual release, and then ramps it through a staged rollout rather than betting a marketing date on a reviewer's queue.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Apple: App Store Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "docs" },
        { label: "Apple: App Review", url: "https://developer.apple.com/distribute/app-review/", kind: "docs" },
        { label: "Google Play: Developer Policy Center", url: "https://play.google/developer-content-policy/", kind: "docs" },
        { label: "Play Console Help: Prepare and roll out a release", url: "https://support.google.com/googleplay/android-developer/answer/9859348", kind: "docs" },
      ],
      video: {
        title: "Why Apps Get Rejected from the App Store - Common Reasons & How to Avoid Them (2026)",
        channel: "Noah Does Coding",
        url: "https://www.youtube.com/watch?v=CGW3_eRM1G0",
        videoId: "CGW3_eRM1G0",
        durationLabel: "17:59",
      },
      alternateVideos: [
        {
          title: "How to Publish Your App to the Play Store (Step by Step, 2026)",
          channel: "Code with Beto",
          url: "https://www.youtube.com/watch?v=wcexBIANCCk",
          videoId: "wcexBIANCCk",
          durationLabel: "24:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-store-review-q1",
          prompt: "Your app requires a login and your staging backend is the only environment with test data. You submit to App Review. What is the likely outcome?",
          options: [
            "Rejection under App Completeness: the reviewer needs working credentials or a demo mode, and a backend that is live during review",
            "Approval: reviewers have a bypass that skips authentication screens",
            "Approval, with a note asking you to provide credentials for the next submission",
            "Rejection because staging backends are prohibited by the guidelines",
          ],
          correctIndex: 0,
          explanation:
            "Guideline 2.1 asks explicitly for demo account details or an approved built-in demo mode, plus back-end services that are live and accessible during review. A reviewer who cannot use the app cannot approve it, and this is one of the most common self-inflicted rejections.",
        },
        {
          id: "mob-store-review-q2",
          prompt:
            "Your React Native app uses over-the-air bundle updates. The team proposes shipping a whole new feature this way, bypassing review. What does the guideline actually say?",
          options: [
            "Apps must be self-contained and may not download, install or execute code that introduces or changes features or functionality",
            "Over-the-air updates are forbidden entirely, including bug fixes",
            "Over-the-air updates are unrestricted as long as the code is JavaScript",
            "Over-the-air updates require a separate entitlement but are otherwise unrestricted",
          ],
          correctIndex: 0,
          explanation:
            "Guideline 2.5.2's text is about introducing or changing features, which is why teams use OTA for fixes and configuration rather than for shipping around review. Reading the rule as a blanket ban, or as a blanket permission, are both ways to get this wrong.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-store-review-q3",
          prompt:
            "Your iOS app sells two things: a premium subscription that unlocks features in the app, and physical merchandise shipped to the user. How must each be paid for?",
          options: [
            "The subscription must use in-app purchase; the merchandise must use a payment method other than in-app purchase",
            "Both must use in-app purchase",
            "Neither may use in-app purchase, since the app has a web equivalent",
            "The subscription may use either method; the merchandise must use in-app purchase",
          ],
          correctIndex: 0,
          explanation:
            "Guideline 3.1.1 requires IAP for unlocking features or content inside the app, and 3.1.3(e) requires physical goods and services consumed outside the app to use something else, such as Apple Pay or a card form. The rule surprises people because it runs in both directions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-store-review-q4",
          prompt: "Which of these are likely to cause an App Store rejection? (Select all that apply.)",
          options: [
            "An app that is essentially a wrapper around the company's responsive website",
            "A feature that is hidden from the reviewer and enabled remotely after approval",
            "A login-gated app submitted with no demo account and no demo mode",
            "Using a web view for the help and terms screens",
            "Shipping a build that supports older OS versions than the current one",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Minimum functionality, hidden or undocumented behaviour, and an app a reviewer cannot use are all named problems. Web views as part of a real app are fine, and supporting older OS versions is normal and expected.",
        },
        {
          id: "mob-store-review-q5",
          prompt: "Your app is already live and you need to ship a fix for a crash, but a separate feature in the same build touches a guideline you are still negotiating. What does Apple's stated process allow?",
          options: [
            "Bug-fix submissions for apps already on the store are not delayed over guideline violations, other than legal or safety ones — you can raise this with App Review",
            "Nothing: every submission is blocked until all open guideline issues are resolved",
            "Crash fixes are auto-approved with no review at all",
            "You must remove the app from sale and resubmit it as a new app",
          ],
          correctIndex: 0,
          explanation:
            "The guidelines describe a bug-fix path precisely so that live users are not held hostage to an unrelated policy discussion, excluding legal and safety matters. You still have to ask for it through App Store Connect rather than assume it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-store-review-q6",
          prompt: "Marketing has committed to a launch date three weeks out. What is the release plan that actually de-risks it?",
          options: [
            "Submit well ahead of the date, choose manual release so approval doesn't publish the build, then release and ramp it with a staged rollout",
            "Submit the day before and request expedited review",
            "Submit on the launch date and rely on automatic release after approval",
            "Publish to a public beta track on the launch date instead",
          ],
          correctIndex: 0,
          explanation:
            "Review duration is not something you control, so the only reliable plan decouples approval from publication. Expedited review exists but is a favour, not a schedule.",
        },
        {
          id: "mob-store-review-q7",
          prompt: "What is the role of Play's testing tracks (internal, closed, open) in a release process?",
          options: [
            "They let you distribute a build to defined groups through the store's own pipeline before it reaches production, exercising signing, billing and the update path",
            "They bypass Play's policy review entirely",
            "They are the only way to ship to devices that don't have Google Play services",
            "They replace staged rollout, which applies only to the production track",
          ],
          correctIndex: 0,
          explanation:
            "The value is testing the real artefact through the real distribution channel, which is where signing and billing problems surface. Policy still applies, and staged rollout is a separate control on the production track.",
        },
        {
          id: "mob-store-review-q8",
          prompt: "Beyond the binary, what else is reviewed and can cause a rejection?",
          options: [
            "Metadata: screenshots, description, age rating, privacy policy link and data-collection declarations",
            "Only the binary; metadata changes are published without review",
            "Only the privacy policy, which is checked automatically",
            "Nothing else: metadata is the developer's responsibility and is never checked",
          ],
          correctIndex: 0,
          explanation:
            "Store listings are part of the product and are reviewed alongside it — misleading screenshots and a missing privacy policy link are ordinary rejection reasons. It also means a metadata-only change can be shipped without a new binary.",
        },
        {
          id: "mob-store-review-q9",
          prompt: "You bundle a third-party analytics SDK. Whose responsibility is its behaviour under the guidelines?",
          options: [
            "Yours: the guidelines make you responsible for everything in your app, including ad networks, analytics and third-party SDKs",
            "The SDK vendor's, since they publish it separately",
            "Nobody's, as long as the SDK is popular and widely used",
            "The store's, which pre-approves SDKs before developers may include them",
          ],
          correctIndex: 0,
          explanation:
            "The guidelines state it directly — choose your SDKs carefully, because their data collection, their required-reason API calls and their policy compliance become yours the moment you ship them.",
        },
      ],
    },
    {
      id: "mob-performance-constraints",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "App Size, Cold Start and Battery",
      summary:
        "Mobile has three budgets that a web app either does not have or does not feel as sharply. The first is **download size**, which is a funnel metric: in markets where data is metered or connections are slow, every extra tens of megabytes costs installs. Android app bundles help by having Play generate per-device artefacts rather than shipping every architecture and density to everyone, and both ecosystems reward pruning unused assets and dependencies.\n\nThe second is **startup**. Android's documentation splits it into cold (process created from scratch), warm (process alive, screen recreated) and hot (everything still resident), and measures two things: time to initial display, when the first frame appears, and time to full display, when the app is actually usable. Optimising only for the first is the classic mistake — a skeleton screen that renders in 200 ms and stays useless for four seconds scores beautifully on TTID and feels terrible. Cold start is the case to optimise for, because it is the worst one and improving it improves the others.\n\nThe third is **battery**, which is where mobile diverges most from server thinking. Energy is dominated by hardware that is expensive to wake: the radio stays in a high-power state for seconds after a transfer, GPS is costly, the screen is costly, and the CPU is usually not the villain. So the lever is batching and deferring — one sync instead of twenty polls, work scheduled with constraints such as \"unmetered network\" or \"charging\", and no wake locks held longer than necessary. Doze and App Standby exist precisely to enforce this on apps that do not do it themselves.\n\nThe gotcha is measuring on the wrong device. A flagship phone with a warm cache, a debugger attached and a fast office network hides every one of these problems. Budget against a mid-range device, a cold start, and a slow network, and hold the numbers in CI, because startup regressions arrive one innocuous dependency at a time.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Android Developers: App startup time", url: "https://developer.android.com/topic/performance/issues/launch-time", kind: "docs" },
        { label: "Apple: Improving your app's performance", url: "https://developer.apple.com/documentation/xcode/improving-your-app-s-performance", kind: "docs" },
        { label: "Android Developers: Reduce your app size", url: "https://developer.android.com/topic/performance/reduce-apk-size", kind: "docs" },
        { label: "Android Developers: Power management resource limits", url: "https://developer.android.com/topic/performance/power/power-details", kind: "docs" },
      ],
      video: {
        title: "How Google made their Android app start faster",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=UiJXe5ipSYA",
        videoId: "UiJXe5ipSYA",
        durationLabel: "12:12",
      },
      alternateVideos: [
        {
          title: "App Performance Analysis with the Android Studio Profiler",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=CQc-QDTmCoQ",
          videoId: "CQc-QDTmCoQ",
          durationLabel: "14:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-performance-constraints-q1",
          prompt: "What distinguishes a cold start from a warm start?",
          options: [
            "A cold start creates the app's process from scratch; a warm start reuses a live process and recreates the screen",
            "A cold start happens after a reboot only; a warm start is every other launch",
            "A cold start shows a splash screen; a warm start does not",
            "A cold start loads from flash storage; a warm start loads from the network",
          ],
          correctIndex: 0,
          explanation:
            "The dividing line is whether the process has to be created, which is the expensive part. It is the case to optimise against, because everything you remove from it also helps warm and hot starts.",
        },
        {
          id: "mob-performance-constraints-q2",
          prompt:
            "Your app renders a skeleton screen 250 ms after launch and finishes loading real content 3.5 s later. How do the two startup metrics read, and what does it mean?",
          options: [
            "Time to initial display looks excellent and time to full display is poor — the app looks fast and is not usable",
            "Both metrics are excellent, because the first frame is what users perceive",
            "Both are poor, because a skeleton frame is not counted as a display",
            "Time to initial display is poor because the skeleton is not the final UI",
          ],
          correctIndex: 0,
          explanation:
            "TTID measures the first frame; TTFD measures when the app is actually usable. Reporting only TTID is how a team congratulates itself while users stare at grey rectangles.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-performance-constraints-q3",
          prompt: "Which of these typically lengthen a cold start? (Select all that apply.)",
          options: [
            "Third-party SDKs that initialise eagerly at process creation",
            "Synchronous disk or database reads on the main thread before the first frame",
            "A blocking network request needed to decide which screen to show",
            "The size of the app's icon asset",
            "The number of screens the app contains in total",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cold start is dominated by work done before the first usable frame, and eager SDK initialisation is the most common accumulated cost. Asset size and total screen count only matter for whatever is actually loaded on that path.",
        },
        {
          id: "mob-performance-constraints-q4",
          prompt: "A team adds a two-second branded splash screen to \"cover\" a slow launch. What have they changed?",
          options: [
            "Nothing measurable: the app is not faster, and they have added time the user has to wait before anything useful appears",
            "The cold-start metric improves because the first frame now renders immediately",
            "Time to full display improves because loading overlaps the splash",
            "Both metrics improve, since the platform excludes splash screens from measurement",
          ],
          correctIndex: 0,
          explanation:
            "A fixed-duration splash is added latency dressed as branding. The platform's own launch screen — which is shown while the process starts and dismissed as soon as you have content — is the legitimate version of the idea.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-performance-constraints-q5",
          prompt: "Why does an Android app bundle usually reduce what a user downloads compared to a single universal APK?",
          options: [
            "The store generates an artefact for the specific device — its architecture, screen density and language — instead of shipping every variant to everyone",
            "The bundle format uses a better compression algorithm",
            "Bundles stream assets on demand at runtime rather than including them",
            "Bundles exclude debug symbols, which universal APKs must include",
          ],
          correctIndex: 0,
          explanation:
            "You upload every variant once and the store assembles the subset each device needs. On-demand delivery of large features is a separate, optional mechanism layered on top.",
        },
        {
          id: "mob-performance-constraints-q6",
          prompt: "Your app's battery usage is reported as high, but CPU profiling shows very little computation. What is the most likely cause?",
          options: [
            "Frequent short network requests and location updates keeping the radio and GPS in high-power states",
            "Excessive memory allocation triggering garbage collection",
            "Too many classes loaded at startup",
            "A large app binary occupying flash storage",
          ],
          correctIndex: 0,
          explanation:
            "On a phone, energy follows the expensive peripherals rather than the CPU, and the radio in particular stays powered for seconds after the last byte. Batching transfers and reducing location accuracy or frequency is usually the whole fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-performance-constraints-q7",
          prompt: "You need to upload analytics batches and refresh cached content periodically. What is the battery-friendly design?",
          options: [
            "Schedule deferred work with constraints such as an unmetered network or a charging device, and let the system batch it with other apps' work",
            "Run a foreground service with a persistent notification so the work is never deferred",
            "Use a repeating exact alarm every ten minutes so the timing is predictable",
            "Hold a partial wake lock and poll on a background thread",
          ],
          correctIndex: 0,
          explanation:
            "Deferrable work should tell the system what it needs and let the system choose when — that is what lets the OS coalesce wakeups across apps. Foreground services, exact alarms and wake locks are for work that genuinely cannot wait, and abusing them is what gets apps restricted.",
        },
        {
          id: "mob-performance-constraints-q8",
          prompt: "A list scrolls smoothly on the team's flagship devices and janks on mid-range hardware. What is the useful way to reason about it?",
          options: [
            "Each frame has a fixed budget set by the refresh rate — roughly 16 ms at 60 Hz — and main-thread work that overruns it drops frames on slower hardware first",
            "Jank is caused by insufficient memory and is fixed by reducing the app's heap usage",
            "Mid-range devices cap the frame rate, so the jank is a platform limitation",
            "Scrolling performance is a GPU concern only and cannot be affected by application code",
          ],
          correctIndex: 0,
          explanation:
            "Everything on the main thread between frames — layout, decoding, allocation, synchronous reads — competes for the same budget, and a faster CPU merely hides the overrun. Higher refresh rates make the budget smaller, not larger.",
        },
        {
          id: "mob-performance-constraints-q9",
          prompt: "What is the right way to keep startup performance from regressing over time?",
          options: [
            "Measure cold start on a representative mid-range device as part of CI, with a budget that fails the build when it is exceeded",
            "Review the dependency list manually before each release",
            "Profile once before launch and re-profile when users complain",
            "Rely on store dashboards, which report startup time per release",
          ],
          correctIndex: 0,
          explanation:
            "Startup regresses by 30 ms at a time, so nothing but an automated budget catches it. Store vitals are valuable but they tell you after real users have already felt it.",
        },
      ],
    },
    {
      id: "mob-accessibility",
      moduleId: "mobile-foundations",
      trackId: "mobile",
      title: "Accessibility on Mobile",
      summary:
        "Mobile accessibility is not a smaller version of web accessibility; the assistive technologies are different and the platform gives you far more for free if you use standard controls. VoiceOver and TalkBack are screen readers driven entirely by gestures — swipe to move focus, double-tap to activate — so the app is experienced as a linear sequence of elements, each of which needs a label, a role, a value and a state. Standard controls supply all four automatically. A custom view built from a coloured rectangle and a tap handler supplies none of them, which is why \"we built our own button component\" and \"our app is unusable with a screen reader\" are usually the same sentence.\n\nDynamic Type is the second pillar and the one most often broken by visual design. Users routinely run text several steps larger than the default, and Apple's guidance is to support enlarging text by at least 200 percent. Fixed-height rows, `maxLines: 1` and layouts measured in hard-coded points all fail at that scale — text truncates, buttons overlap, controls fall off the screen. Sizes that scale and containers that grow are the fix, and it costs nothing if you do it from the start.\n\nThen there are the quieter ones: never signalling state by colour alone (a red border needs an icon or text beside it), respecting reduce-motion, keeping touch targets at the platform's guidance (iOS's default control size is 44×44 pt, with 28×28 pt the absolute minimum), and ordering focus to match the visual reading order rather than the order you happened to add views. Apple now surfaces several of these on the store itself through Accessibility Nutrition Labels, where you declare support for VoiceOver, Voice Control, Larger Text, sufficient contrast, reduced motion, captions and more — an accessibility claim your product page makes in public.\n\nThe gotcha is trusting automated checks. A scanner finds missing labels and low contrast; it cannot tell you that your focus order jumps backwards, that your \"button\" announces itself as an image, or that a toast disappears before a screen reader user hears it. Turn the screen reader on and complete a real task without looking. Ten minutes of that finds more than any audit tool.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Apple HIG: Accessibility", url: "https://developer.apple.com/design/human-interface-guidelines/accessibility", kind: "docs" },
        { label: "Android Developers: Principles for improving app accessibility", url: "https://developer.android.com/guide/topics/ui/accessibility/principles", kind: "docs" },
        { label: "Material 3: Accessible design", url: "https://m3.material.io/foundations/accessible-design/overview", kind: "docs" },
        { label: "Apple: Overview of Accessibility Nutrition Labels", url: "https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels", kind: "docs" },
      ],
      video: {
        title: "Prepare your app for Accessibility Nutrition Labels | Apple Developer",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=-4FD6zhHKKM",
        videoId: "-4FD6zhHKKM",
        durationLabel: "34:50",
      },
      alternateVideos: [
        {
          title: "TalkBack - Accessibility on Android",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=_1yRVwhEv5I",
          videoId: "_1yRVwhEv5I",
          durationLabel: "4:11",
        },
        {
          title: "Making Android accessibility easy (Android Dev Summit '18)",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=R2NftUX7rDM",
          videoId: "R2NftUX7rDM",
          durationLabel: "31:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-accessibility-q1",
          prompt: "An icon-only button shows a trash can and has no accessibility label. What does a screen reader user hear?",
          options: [
            "Something unhelpful — the image asset's name, or just \"button\" — with no indication of what it does",
            "\"Delete\", inferred from the icon by the platform",
            "Nothing at all; unlabelled controls are skipped entirely",
            "The name of the function the tap handler calls",
          ],
          correctIndex: 0,
          explanation:
            "The platform has no idea what your artwork depicts; it falls back to whatever identifier it can find. An icon-only control always needs an explicit label, and a tooltip or visual-only caption does not supply one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-accessibility-q2",
          prompt:
            "A user sets the system text size several steps above default. Your list rows are fixed at 56 pt with single-line labels. What happens, and what is the fix?",
          options: [
            "Labels truncate or clip; rows must grow with the content and text must use scalable type",
            "The OS scales the whole UI proportionally, so nothing breaks",
            "The text stays at its designed size, because app text ignores the system setting",
            "The row scrolls horizontally to fit the longer text",
          ],
          correctIndex: 0,
          explanation:
            "Text scaling changes content size, not the container you hard-coded, so the content outgrows the box. Apple asks for support up to at least 200 percent enlargement, which fixed-height rows cannot survive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-accessibility-q3",
          prompt: "What does a custom, non-standard control need to expose to be usable with a screen reader? (Select all that apply.)",
          options: [
            "A label describing what it is or does",
            "A role or trait, so it is announced as a button, toggle, header and so on",
            "Its current value and state, such as selected, expanded or disabled",
            "A tooltip shown on long-press",
            "A unique numeric identifier in the view hierarchy",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Label, role and state are what standard controls provide automatically and what your custom view must supply by hand. Tooltips are visual, and internal identifiers are not announced.",
        },
        {
          id: "mob-accessibility-q4",
          prompt: "A form marks invalid fields by turning their border red. Why is that insufficient?",
          options: [
            "Colour alone is not perceivable by everyone, and it carries nothing to a screen reader — the error needs text or an icon and an announcement",
            "Red is reserved by both platforms for system errors",
            "Borders are not rendered when high-contrast mode is on",
            "It is sufficient as long as the red meets contrast requirements",
          ],
          correctIndex: 0,
          explanation:
            "Colour-blind users may not distinguish the border at all, and a screen reader never mentions it. Pair the colour with an icon and an error message associated with the field, and announce the change when it happens.",
        },
        {
          id: "mob-accessibility-q5",
          prompt: "What is the recommended default control size on iOS, and how does it relate to your artwork?",
          options: [
            "44×44 pt as the default control size (28×28 pt minimum), independent of how large the visible icon or label is",
            "44×44 pt, which the visible artwork must also fill",
            "24×24 pt, matching the web's target-size guidance",
            "There is no size guidance; it is left to each app's design system",
          ],
          correctIndex: 0,
          explanation:
            "Apple's accessibility guidance gives a default and a minimum control size for each platform, and it is about the touchable control, not the glyph. Expanding the hit region keeps a compact design usable.",
        },
        {
          id: "mob-accessibility-q6",
          prompt: "Screen-reader focus on one of your screens jumps from the header to a footer button and then back up to the body. Why does this happen?",
          options: [
            "Focus order follows the accessibility tree, which reflects the view hierarchy rather than the visual layout, unless you group or order elements explicitly",
            "Screen readers always traverse elements in the order they were added to the layout file",
            "The screen has too many elements, so the reader samples them randomly",
            "It only happens when animations are in progress",
          ],
          correctIndex: 0,
          explanation:
            "Absolute or overlay positioning easily makes the visual order and the hierarchy order disagree. The fix is to group related elements and set the traversal order deliberately, not to rearrange the visual design around the reader.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-accessibility-q7",
          prompt: "Your app confirms an action with a toast that disappears after two seconds. What is the accessibility problem?",
          options: [
            "A screen reader user may never hear it, and a user reading slowly may never see it — important state changes need an announcement and a persistent representation",
            "Toasts cannot be rendered when a screen reader is active",
            "Toasts always steal focus, interrupting the user's current task",
            "There is no problem: the platform automatically reads every toast aloud twice",
          ],
          correctIndex: 0,
          explanation:
            "Transient feedback that is the only evidence something happened excludes anyone who is slower to reach it. Announce the change through the accessibility layer and reflect it somewhere durable in the UI.",
        },
        {
          id: "mob-accessibility-q8",
          prompt: "An automated accessibility scanner reports zero issues. What can you still not conclude?",
          options: [
            "That the app is usable: scanners find missing labels and contrast problems, not wrong labels, bad focus order or unreachable flows",
            "That contrast ratios are adequate",
            "That interactive elements have labels of some kind",
            "That touch targets meet the minimum size",
          ],
          correctIndex: 0,
          explanation:
            "Tools check properties; they cannot judge meaning or sequence. The only way to know whether a task can be completed is to complete it with the screen reader on and the screen unviewed.",
        },
        {
          id: "mob-accessibility-q9",
          prompt: "What are Apple's Accessibility Nutrition Labels?",
          options: [
            "A declaration on the App Store product page of which accessibility features an app supports, such as VoiceOver, Larger Text, sufficient contrast and reduced motion",
            "An automated audit Apple runs on every submitted binary",
            "A required entitlement for apps that integrate with assistive technologies",
            "A per-screen accessibility score shown to users inside the app",
          ],
          correctIndex: 0,
          explanation:
            "They are developer declarations, made in App Store Connect against published evaluation criteria per feature, and shown to users before they download. They move accessibility from an internal quality bar to a public product claim.",
        },
      ],
    },
  ],
} satisfies Module;
