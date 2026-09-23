import type { Module } from "@/types/curriculum";

export default {
  id: "php-wordpress",
  trackId: "php",
  name: "WordPress Development",
  description:
    "WordPress as a professional PHP developer meets it in agency work: how it boots, why the hook system looks the way it does, what its schema costs you, block themes alongside the classic themes you will inherit, and the security and performance habits that separate a maintainable build from a liability.",
  refs: [
    { label: "WordPress: Developer Resources — Common APIs", url: "https://developer.wordpress.org/apis/", kind: "docs" },
    { label: "WordPress: Block Editor Handbook", url: "https://developer.wordpress.org/block-editor/getting-started/", kind: "docs" },
    { label: "10up: Engineering Best Practices", url: "https://10up.github.io/Engineering-Best-Practices/", kind: "article" },
  ],
  topics: [
    {
      id: "wp-bootstrap-template-hierarchy",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "How WordPress Boots and the Template Hierarchy",
      summary:
        "Every uncached request runs the entire program from the top: `index.php` pulls in `wp-blog-header.php`, which loads `wp-config.php` and then `wp-settings.php`, which includes mu-plugins, then the active plugins listed in the `active_plugins` option, then the theme's `functions.php`, fires `init`, and only then calls `wp()` to turn the URL into query vars and run one main `WP_Query`. The template loader picks a file afterwards. There is no router, no container and no compiled config — the program is assembled at runtime from whatever files happen to be on disk.\n\nThat ordering explains most of WordPress's character. Plugins always load before the theme, which is why a theme can rely on a plugin's post types but not the reverse. `after_setup_theme` is the first hook a theme can use and `init` is where almost all registration belongs, because `init` is the earliest point at which the whole system exists. Conditional tags like `is_page()` read `$wp_query`, which does not exist until `wp()` runs, so calling them on `init` returns `false` and logs a `_doing_it_wrong()` notice — a bug that looks like working code.\n\nThe template hierarchy is then a deterministic ordered list of candidate filenames, narrowest first, ending at `index.php`: `single-{post_type}-{slug}.php` before `single-{post_type}.php` before `single.php` before `singular.php`. Block themes keep the same names and resolve to HTML files in `templates/` instead. The performance consequence of all this is that the bootstrap happens before routing, which is why a page cache in front of PHP wins so much more than anything you can do inside it.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: Template Hierarchy", url: "https://developer.wordpress.org/themes/templates/template-hierarchy/", kind: "docs" },
        { label: "WordPress: Action Reference (order of a typical request)", url: "https://developer.wordpress.org/apis/hooks/action-reference/", kind: "docs" },
        { label: "Carl Alexander: WordPress for the adventurous — Loading", url: "https://carlalexander.ca/wordpress-adventurous-loading/", kind: "article" },
      ],
      video: {
        title: "#3 Understanding WordPress Core | How Plugins Are Loaded In WordPress | Make Sense Of WP Core",
        channel: "Imran Sayed - Codeytek Academy",
        url: "https://www.youtube.com/watch?v=AWYp3rNKmvU",
        videoId: "AWYp3rNKmvU",
        durationLabel: "10:02",
      },
      alternateVideos: [
        {
          title: "A Guide to the WordPress Template Hierarchy (2021 Edition)",
          channel: "Kinsta",
          url: "https://www.youtube.com/watch?v=ssqyrXoH7LI",
          videoId: "ssqyrXoH7LI",
          durationLabel: "12:25",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-bootstrap-template-hierarchy-q1",
          prompt:
            "Put these in the order they happen during a normal front-end request.\n\n- The active theme's `functions.php` is included\n- Active plugins are included\n- The main `WP_Query` runs\n- `wp-config.php` is read",
          options: [
            "`wp-config.php`, plugins, `functions.php`, the main query",
            "`wp-config.php`, `functions.php`, plugins, the main query",
            "plugins, `wp-config.php`, the main query, `functions.php`",
            "`wp-config.php`, the main query, plugins, `functions.php`",
          ],
          correctIndex: 0,
          explanation:
            "`wp-settings.php` loads mu-plugins, then active plugins, then the theme, fires `init`, and only then does `wp()` parse the URL and run the main query. The theme always loads after plugins, which is why a theme may depend on a plugin's registrations but not the other way round.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q2",
          prompt:
            "A request resolves to a single post of the custom post type `book`, slug `dune`. The theme contains `single.php`, `single-book.php`, `singular.php` and `index.php`. Which file renders it?",
          options: ["`single-book.php`", "`single.php`", "`singular.php`", "`index.php`"],
          correctIndex: 0,
          explanation:
            "The hierarchy tries `single-book-dune.php`, then `single-book.php`, then `single.php`, then `singular.php`, then `index.php`, and stops at the first file that exists. `index.php` is the guaranteed fallback, which is why every classic theme must ship one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-bootstrap-template-hierarchy-q3",
          prompt: "Where does `add_theme_support( 'post-thumbnails' )` belong?",
          options: [
            "On `after_setup_theme` — the first hook available to a theme, and early enough for supports that are read before `init`",
            "On `init`, because that is where all registration belongs",
            "On `wp_loaded`, once plugins and the theme have both finished loading",
            "On `template_redirect`, just before the theme renders anything",
          ],
          correctIndex: 0,
          explanation:
            "`after_setup_theme` fires immediately after `functions.php` is included and before `init`. Some supports are consumed during the theme setup phase, so registering on `init` or later is simply too late for them.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q4",
          prompt: "Which are true of the main query on a front-end request? (Select all that apply.)",
          options: [
            "It is built from the query vars WordPress parses out of the URL",
            "It is exposed as the `$wp_query` global and is what `have_posts()` iterates by default",
            "`pre_get_posts` can change it before it runs",
            "It runs before plugins are loaded",
            "It is skipped for single posts, which are fetched directly by ID",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`wp()` turns the URL into query vars and runs exactly one `WP_Query`, exposed as `$wp_query`, and `pre_get_posts` is the supported place to change it. It runs long after plugins load, and a single post is just another main query.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q5",
          prompt: "What is `template_redirect` for?",
          options: [
            "The last hook before WordPress chooses a template file — the right place to redirect or take over the response entirely",
            "It fires after the template has rendered, so you can rewrite the finished HTML",
            "It maps a URL to a template file and must return a filename",
            "It runs only when WordPress has decided the request is a 404",
          ],
          correctIndex: 0,
          explanation:
            "By then the query has run, so conditional tags work, but nothing has been sent. Returning a filename is `template_include`'s job, and rewriting finished HTML needs output buffering.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q6",
          prompt: "What happens if you call `is_page()` from a callback on `init`?",
          options: [
            "It returns `false` and WordPress logs a `_doing_it_wrong()` notice, because the query has not run yet",
            "It works — conditional tags inspect the URL directly",
            "It throws a fatal error",
            "It returns `null` until the theme has loaded",
          ],
          correctIndex: 0,
          explanation:
            "Conditional tags read `$wp_query`, which does not exist until `wp()` runs, well after `init`. Returning `false` is the dangerous part: the code looks like it works and silently takes the wrong branch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-bootstrap-template-hierarchy-q7",
          prompt: "Why does a full-page cache in front of PHP help a WordPress site far more than any cache inside it?",
          options: [
            "Because every uncached request reboots the whole of WordPress before it knows what was asked for",
            "Because PHP cannot keep anything in memory between requests",
            "Because WordPress disables its own caches when a page cache is present",
            "Because the database is always the bottleneck",
          ],
          correctIndex: 0,
          explanation:
            "Config, mu-plugins, plugins, the theme and the hook registry are all assembled before routing, on every request. A page cache skips all of it; an internal cache still pays the bootstrap, and OPcache removes the compile cost but not the execution.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q8",
          prompt: "In a block theme, what does the template hierarchy resolve to?",
          options: [
            "An HTML file of block markup in `templates/`, matched by the same hierarchy names",
            "A PHP file in the theme root, exactly as in a classic theme",
            "A row in `wp_posts` only — block themes ship no template files",
            "An entry in `theme.json` under `customTemplates`",
          ],
          correctIndex: 0,
          explanation:
            "Block themes keep the hierarchy but resolve to `templates/single.html`, `templates/archive.html` and so on. Once a user edits one in the Site Editor, a `wp_template` post overrides the file; `customTemplates` in `theme.json` only supplies metadata.",
        },
        {
          id: "wp-bootstrap-template-hierarchy-q9",
          prompt:
            "A page has the slug `about` and ID 12, with no custom page template selected. The theme contains `page.php`, `page-about.php` and `page-12.php`. Which one renders it?",
          options: ["`page-about.php`", "`page-12.php`", "`page.php`", "Whichever file was modified most recently"],
          correctIndex: 0,
          explanation:
            "The page order is: the selected custom template, then `page-{slug}.php`, then `page-{id}.php`, then `page.php`, then `singular.php`, then `index.php`. Slug beats ID, which surprises people who assume the numeric file is the more specific one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-bootstrap-template-hierarchy-q10",
          prompt: "A plugin calls `register_post_type()` at the top of its main file instead of on `init`. What is the problem?",
          options: [
            "The plugin file is included before `init`, so translations, taxonomies and other registrations it depends on may not exist yet",
            "Nothing — registering earlier is strictly faster",
            "It registers twice: once at include time and once on `init`",
            "`register_post_type()` may only be called from a theme",
          ],
          correctIndex: 0,
          explanation:
            "Plugin files are included during the plugin-loading phase. `init` exists precisely so that everything registers at a point where the rest of the system is present; code that works today because nothing else happened to be needed is a bug waiting for a load-order change.",
        },
      ],
    },
    {
      id: "wp-hooks",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Actions, Filters and the Hook System",
      summary:
        "Hooks are WordPress's answer to having no dependency injection and no way to know, at build time, what code will be present. A global registry — `$wp_filter`, an array of `WP_Hook` objects keyed by hook name — collects callbacks that core, plugins and themes all add by string name. `add_action()` is literally a one-line wrapper around `add_filter()`; an action is just a filter whose return value is discarded. Callbacks run in ascending priority order (default 10), ties break by registration order, and `$accepted_args` (default 1) decides how many of the hook's arguments your callback actually receives.\n\nThe trade is extreme late binding for zero compile-time safety. Any plugin can change any filtered value without the author's knowledge, which is the whole reason the ecosystem works; the cost is that you cannot read a file and know what a value will be, hook names are unchecked strings where a typo simply never fires, and there is no type contract on a filtered value. A filter that forgets to `return` silently replaces the value with `null`.\n\nThe traps are about identity and timing. `remove_action()` needs the identical callable and the identical priority, so a closure or a method on an instance you did not keep is effectively unremovable. Adding a callback to a hook that has already fired does nothing — hooks are never replayed, which is what `did_action()` is for. And nothing prevents re-entry: a `save_post` callback that calls `wp_update_post()` will re-enter itself until you unhook around the write or guard with a static flag.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "WordPress: Hooks (Plugin Handbook)", url: "https://developer.wordpress.org/plugins/hooks/", kind: "docs" },
        { label: "WordPress: Filters", url: "https://developer.wordpress.org/plugins/hooks/filters/", kind: "docs" },
        { label: "WordPress: add_action()", url: "https://developer.wordpress.org/reference/functions/add_action/", kind: "docs" },
        { label: "Carl Alexander: Designing a class around WordPress hooks", url: "https://carlalexander.ca/designing-class-wordpress-hooks/", kind: "article" },
      ],
      video: {
        title: "Understanding WordPress Hooks: Actions, Filters, and Callbacks Explained",
        channel: "Crocoblock",
        url: "https://www.youtube.com/watch?v=VPpqajczp3A",
        videoId: "VPpqajczp3A",
        durationLabel: "16:52",
      },
      alternateVideos: [
        {
          title: "WordPress Hooks",
          channel: "WordPress",
          url: "https://www.youtube.com/watch?v=MW-evyl4nQU",
          videoId: "MW-evyl4nQU",
          durationLabel: "3:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-hooks-q1",
          prompt: "What is the relationship between `add_action()` and `add_filter()` in core?",
          options: [
            "`add_action()` calls `add_filter()` — an action is a filter whose return value is discarded",
            "They write to two separate registries with different lookup rules",
            "`add_filter()` calls `add_action()` and then captures the output buffer",
            "They are unrelated: actions use `$wp_actions`, filters use `$wp_filter`",
          ],
          correctIndex: 0,
          explanation:
            "`add_action()` is a one-line wrapper, and both land in the same `$wp_filter` registry of `WP_Hook` objects. `$wp_actions` does exist, but only as a counter of how many times each action has fired.",
        },
        {
          id: "wp-hooks-q2",
          prompt:
            "What does this do to post titles?\n\n```php\nadd_filter( 'the_title', function ( $title ) {\n    strtoupper( $title );\n} );\n```",
          options: [
            "Every title renders empty, because the callback returns `null`",
            "Every title is uppercased — `strtoupper()` modifies its argument in place",
            "Nothing: a filter with no return value is skipped",
            "It raises a `TypeError` on the first post",
          ],
          correctIndex: 0,
          explanation:
            "A filter's return value replaces the filtered value, and a PHP function with no `return` returns `null`. `strtoupper()` returns a new string rather than mutating its argument, so the work is thrown away and every title comes out blank.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-hooks-q3",
          prompt:
            "What happens on the next post save?\n\n```php\nadd_action( 'save_post', function ( $post_id, $post ) {\n    // ...\n} );\n```",
          options: [
            "A fatal `ArgumentCountError`: `$accepted_args` defaults to 1 and the closure requires two parameters",
            "It runs, and `$post` is `null`",
            "It runs, and `$post` is the global `$post`",
            "WordPress skips the callback and logs a notice",
          ],
          correctIndex: 0,
          explanation:
            "WordPress slices the hook's arguments down to `$accepted_args`, which defaults to 1, and PHP 8 raises `ArgumentCountError` when a required parameter is missing. Pass `10, 2` — or give the second parameter a default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-hooks-q4",
          prompt: "Three callbacks are added to one action: A at priority 20, B at the default priority, C at priority 5. In what order do they run?",
          options: ["C, B, A", "A, B, C", "B, C, A", "In registration order, regardless of priority"],
          correctIndex: 0,
          explanation:
            "Lower numbers run first and the default is 10, giving C (5), B (10), A (20). Callbacks that share a priority run in the order they were added.",
        },
        {
          id: "wp-hooks-q5",
          prompt: "A plugin runs `add_action( 'wp_head', function () { echo '<meta ...>'; } );`. How do you remove it from a child theme?",
          options: [
            "You cannot remove it cleanly — `remove_action()` needs the identical callable, and the closure was never stored anywhere you can reach",
            "`remove_action( 'wp_head', 'closure' )`",
            "`remove_all_actions( 'wp_head' )`, which is the standard fix",
            "Register a closure with the same body: WordPress deduplicates by source",
          ],
          correctIndex: 0,
          explanation:
            "Hook identity for closures and object methods comes from the object instance, so you need that exact instance. This is the practical argument for hooking named functions or methods on a singleton you can fetch back. `remove_all_actions()` removes everyone else's output too.",
        },
        {
          id: "wp-hooks-q6",
          prompt: "Code running on `wp_loaded` calls `add_action( 'init', 'acme_setup' )`. When does `acme_setup()` run?",
          options: [
            "Never on that request — `init` has already fired, and hooks are not replayed",
            "Immediately, because WordPress replays hooks that have already fired",
            "On the next request",
            "At the end of `wp_loaded`",
          ],
          correctIndex: 0,
          explanation:
            "`did_action( 'init' )` is how you detect this; if you need to support both orderings, check it and call the function directly. Silently doing nothing is exactly the failure mode that makes load-order bugs hard to find.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-hooks-q7",
          prompt: "What does `do_action()` return?",
          options: [
            "Nothing — actions run callbacks for their side effects; `apply_filters()` is the one that returns a value",
            "The value returned by the last callback",
            "The number of callbacks that ran",
            "`true` if at least one callback was registered",
          ],
          correctIndex: 0,
          explanation:
            "That is the only real difference between the two APIs: same registry, same dispatch, but `do_action()` discards each return value while `apply_filters()` threads the value through the chain.",
        },
        {
          id: "wp-hooks-q8",
          prompt: "Which are true of WordPress's hook system? (Select all that apply.)",
          options: [
            "Hook names are plain strings with no registration step, so a typo simply never fires",
            "A callback can be added to a hook that no code ever fires",
            "You create a hook in your own plugin just by calling `do_action()` or `apply_filters()`",
            "Core checks that a filter callback returns the same type it was given",
            "Adding the same named function twice to one hook at one priority registers it twice",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Hooks are late-bound strings with no schema: nothing to typo-check and no type contract on filtered values. The registry is keyed by callback identity and priority, so adding the same named function at the same priority is idempotent.",
        },
        {
          id: "wp-hooks-q9",
          prompt: "A `save_post` callback calls `wp_update_post()` on the same post. What goes wrong, and what is the conventional guard?",
          options: [
            "It re-enters `save_post` recursively — unhook the callback around the inner update, or guard with a static flag",
            "Nothing: core detects the loop and breaks it",
            "The update fails silently because the post is locked during `save_post`",
            "It only loops when the post type is public",
          ],
          correctIndex: 0,
          explanation:
            "Nothing in the dispatcher prevents re-entry. `remove_action()` before the write and `add_action()` after is the usual fix; `wp_is_post_revision()` and a static guard are the other two you will see.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-hooks-q10",
          prompt: "You register a filter at `PHP_INT_MAX` so it runs after everyone else's. What can still beat you?",
          options: [
            "Another callback registered at `PHP_INT_MAX` after yours, and any hook further downstream that filters the value again",
            "Nothing — `PHP_INT_MAX` is the documented way to guarantee running last",
            "Callbacks at priority 0, which run after everything else",
            "Only callbacks registered from an mu-plugin",
          ],
          correctIndex: 0,
          explanation:
            "Ties break by registration order, so a later registration at the same priority wins, and the value may pass through other hooks afterwards anyway. A priority arms race is a symptom: the fix is usually to filter at the right hook, not the loudest one.",
        },
        {
          id: "wp-hooks-q11",
          prompt: "A callback on `init` makes an HTTP request to a third-party API. Why is that worse in WordPress than in a typical framework?",
          options: [
            "`init` fires on every request — front end, admin, AJAX, REST and cron — so the call is made on requests that never needed it",
            "`init` runs before the database connection is available",
            "WordPress runs `init` callbacks in parallel, so the call is made several times",
            "Outbound HTTP requests are blocked during `init`",
          ],
          correctIndex: 0,
          explanation:
            "There is no routing before `init`: the same callback fires for a page view, a `wp-admin` screen, `admin-ajax.php` and a REST call. Gate the work on the request type, cache the response in a transient, or move it to a scheduled event.",
        },
      ],
    },
    {
      id: "wp-loop-wp-query",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "The Loop, WP_Query and What Queries Cost",
      summary:
        "The Loop is a `while ( have_posts() ) : the_post();` iteration over the main query, and `the_post()` is what makes template tags work: it advances the pointer and sets the `$post` global, which is the implicit argument every `the_title()` and `the_content()` reads. That global is also the reason a nested loop needs `wp_reset_postdata()` — nothing restores it for you, so everything after an unclosed secondary loop sees the wrong post.\n\n`WP_Query` is a SQL builder with a large surface, and the expensive parts are not obvious from the array literal. Counting the total rows so you can render page numbers is separate work you turn off with `'no_found_rows' => true` when you are not paginating. Each `meta_query` clause adds another join against `wp_postmeta`, whose value column is `longtext` with no useful index, so filtering and `'orderby' => 'meta_value'` degrade badly as the client adds content. `'posts_per_page' => -1` is fine on twelve rows and fatal on forty thousand, with nothing warning you in between.\n\nThe main query is a different thing from a secondary one, and mixing them up causes most WordPress query bugs. To change what an archive shows, use `pre_get_posts` — but guard it, because it fires for *every* `WP_Query` including admin list tables, menus and REST. To add an extra list to a page, use `new WP_Query` and reset afterwards. `query_posts()` does neither: it throws away and re-runs the main query, breaking pagination and conditional tags, which is why it survives only in tutorials.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: WP_Query", url: "https://developer.wordpress.org/reference/classes/wp_query/", kind: "docs" },
        { label: "WordPress: pre_get_posts", url: "https://developer.wordpress.org/reference/hooks/pre_get_posts/", kind: "docs" },
        { label: "WordPress: The Loop", url: "https://developer.wordpress.org/themes/classic-themes/basics/the-loop/", kind: "docs" },
        { label: "10up: Engineering Best Practices — PHP performance", url: "https://10up.github.io/Engineering-Best-Practices/php/", kind: "article" },
      ],
      video: {
        title: "3 simple steps to make WP_Query faster 🚀",
        channel: "pragmatedev",
        url: "https://www.youtube.com/watch?v=QBRdOq0Fvbo",
        videoId: "QBRdOq0Fvbo",
        durationLabel: "13:43",
      },
      alternateVideos: [
        {
          title: "Become a WordPress Developer: Unlocking Power with Code",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=FVqzKAUsM68",
          videoId: "FVqzKAUsM68",
          startSeconds: 4903,
          chapterLabel: "The Loop",
          durationLabel: "3:18:32",
        },
        {
          title: "The Most Powerful Block Type in WordPress (Query Loop)",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=ECFplH5J-Aw",
          videoId: "ECFplH5J-Aw",
          durationLabel: "22:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-loop-wp-query-q1",
          prompt: "What does `the_post()` do inside The Loop?",
          options: [
            "Advances the query's pointer and sets the `$post` global, which every template tag reads implicitly",
            "Prints the current post's content",
            "Returns the current post object without changing any state",
            "Runs a fresh database query for the next post",
          ],
          correctIndex: 0,
          explanation:
            "`the_title()` takes no arguments because its argument is the `$post` global, and `the_post()` is what sets it. That shared global is also why a nested loop has to be reset afterwards.",
        },
        {
          id: "wp-loop-wp-query-q2",
          prompt: "A template runs a secondary `new WP_Query` loop in the sidebar and never calls `wp_reset_postdata()`. What breaks?",
          options: [
            "Everything after the sidebar that relies on `$post` — comments, next/previous links, the title — uses the last post of the secondary loop",
            "Nothing: each `WP_Query` keeps its own state",
            "The main query runs a second time, doubling the queries on the page",
            "The secondary loop returns no posts at all",
          ],
          correctIndex: 0,
          explanation:
            "`the_post()` overwrites the shared `$post` global and nothing restores it. `wp_reset_postdata()` puts the main query's current post back; `wp_reset_query()` is the heavier one you only need after `query_posts()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-loop-wp-query-q3",
          prompt: "Why is `query_posts()` the wrong tool for changing which posts an archive shows?",
          options: [
            "It discards and re-runs the main query, leaving pagination, conditional tags and `$wp_query` inconsistent",
            "It is deprecated and removed from current WordPress",
            "It cannot accept the same arguments as `WP_Query`",
            "It only works inside `functions.php`",
          ],
          correctIndex: 0,
          explanation:
            "`pre_get_posts` changes the main query before it runs — no second query, no broken pagination. `new WP_Query` is right for an *additional* loop. `query_posts()` still exists, which is why it keeps resurfacing.",
        },
        {
          id: "wp-loop-wp-query-q4",
          prompt: "What does `'no_found_rows' => true` do, and when is it safe?",
          options: [
            "It skips counting the total matching rows, so `found_posts` and pagination are unavailable — safe for a fixed list like 'latest five posts'",
            "It skips the query entirely and returns a cached result",
            "It limits the query to the first page but keeps the total count",
            "It disables the post, meta and term caches",
          ],
          correctIndex: 0,
          explanation:
            "The total is extra work the database does purely so you can render page numbers. Any loop that does not paginate should turn it off. The caches are separate switches: `cache_results`, `update_post_meta_cache`, `update_post_term_cache`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-loop-wp-query-q5",
          prompt: "A `WP_Query` has a `meta_query` with three clauses on three different meta keys. What does that cost at the SQL level?",
          options: [
            "Three separate joins against `wp_postmeta`, an EAV table whose value column is `longtext`",
            "One join — `meta_query` compiles into a single `IN` clause",
            "No join: WordPress filters the results in PHP",
            "A join against `wp_posts` only, because meta is denormalised into it",
          ],
          correctIndex: 0,
          explanation:
            "Each clause needs its own alias of `wp_postmeta` to match a different `meta_key`, and the value column has no usable index for range or comparison work. That is the argument for a taxonomy or a custom table when you need to *query* by something rather than just display it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-loop-wp-query-q6",
          prompt: "Which of these genuinely reduce the cost of a 'related posts' query that only needs IDs and titles? (Select all that apply.)",
          options: [
            "`'no_found_rows' => true`",
            "`'update_post_meta_cache' => false`",
            "`'update_post_term_cache' => false`",
            "`'posts_per_page' => -1`",
            "`'orderby' => 'meta_value'`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Those three each remove work the query would otherwise do: the count, the meta priming query and the term priming query. `-1` removes the limit, and `orderby => meta_value` adds a join plus a filesort — both make it worse.",
        },
        {
          id: "wp-loop-wp-query-q7",
          prompt: "Why is `'posts_per_page' => -1` a liability in client code even when it works today?",
          options: [
            "It asks for every matching row, so query cost and page memory grow with whatever content the client adds",
            "It is ignored on the front end and silently becomes 10",
            "It disables the object cache for that query",
            "It always forces a full table scan regardless of content volume",
          ],
          correctIndex: 0,
          explanation:
            "Nothing warns you as the row count climbs; the page simply gets slower and then falls over. Ask for a bounded number, or paginate.",
        },
        {
          id: "wp-loop-wp-query-q8",
          prompt:
            "What is wrong with this?\n\n```php\nadd_action( 'pre_get_posts', function ( $q ) {\n    $q->set( 'posts_per_page', 24 );\n} );\n```",
          options: [
            "It applies to every query on every request, including admin list tables, menus, REST and secondary loops",
            "`$q->set()` has no effect on `pre_get_posts`",
            "It runs too late to change `posts_per_page`",
            "It must return `$q` to take effect",
          ],
          correctIndex: 0,
          explanation:
            "`pre_get_posts` fires for every `WP_Query`, not just the main one. Start with `if ( is_admin() || ! $q->is_main_query() ) { return; }` and then narrow further to the specific archive you meant.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-loop-wp-query-q9",
          prompt: "What does `'fields' => 'ids'` return?",
          options: [
            "An array of post IDs instead of an array of `WP_Post` objects",
            "The IDs of the posts together with their titles",
            "A single ID — the first match",
            "An associative array of ID to post object",
          ],
          correctIndex: 0,
          explanation:
            "Useful when you only need identity — to build an `IN` list, to count, to compare — because it avoids hydrating full post objects. `'id=>parent'` is the other non-default option.",
        },
        {
          id: "wp-loop-wp-query-q10",
          prompt: "What is the correct way to handle 'nothing matched' in a template?",
          options: [
            "Test `have_posts()` before the loop and render the empty state in the `else` branch",
            "Check whether `$wp_query->post_count` is `null`",
            "Catch the exception `WP_Query` throws when nothing matches",
            "Compare `get_the_ID()` to `false` after the loop",
          ],
          correctIndex: 0,
          explanation:
            "`have_posts()` is false when the query matched nothing; there is no exception and no null count. The familiar `if ( have_posts() ) : while ( have_posts() ) : the_post(); ... else : ... endif;` shape exists for exactly this.",
        },
        {
          id: "wp-loop-wp-query-q11",
          prompt: "A loop over 20 posts calls `get_post_meta()` three times per post. How many meta queries does that normally cost?",
          options: [
            "One — `WP_Query` primes the meta cache for all 20 posts in a single query before the loop starts",
            "Sixty, one per call",
            "Twenty, one per post",
            "None: meta is joined into the post query",
          ],
          correctIndex: 0,
          explanation:
            "`update_post_meta_cache` defaults to true and runs one `update_meta_cache()` for the whole result set, after which `get_post_meta()` reads the object cache. Turn it off, or fetch posts by hand with `$wpdb`, and the 60 queries come back with no warning at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "wp-content-model",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Custom Post Types, Taxonomies and Post Meta",
      summary:
        "WordPress has one content table and one key-value side table, and everything you model has to fit that. A custom post type is not a new table: it is a string in `wp_posts.post_type` plus a registration describing how WordPress should route, query, permission and render it. Taxonomies, by contrast, are a properly normalised many-to-many across `wp_terms` (the name), `wp_term_taxonomy` (the name within a taxonomy) and `wp_term_relationships` (the link to objects), with `wp_termmeta` alongside.\n\nThe decision that actually matters in a build is taxonomy versus meta. A taxonomy is narrow, indexed and designed for filtering, counting and archive URLs. Post meta is an EAV table whose value column is `longtext` with no useful index, and whose `meta_key` index is a prefix index, so it is excellent for values you only ever display and poor for values you query, sort or aggregate by. Getting this wrong is cheap during the build and expensive two years later, when the client has 40,000 rows and the shop filter times out.\n\nRegistration has its own rules. Both `register_post_type()` and `register_taxonomy()` belong on `init` — earlier and their dependencies do not exist, later and the rewrite rules and main query were already built without them. Flush rewrite rules from the activation hook, never on every request. `'show_in_rest' => true` is what makes a type editable in the block editor and visible at `/wp-json/`, and `register_meta()` with `show_in_rest` plus `sanitize_callback` is how a meta key gets a declared type rather than being an untyped string in a shared table.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "WordPress: register_post_type()", url: "https://developer.wordpress.org/reference/functions/register_post_type/", kind: "docs" },
        { label: "WordPress: Taxonomies (Plugin Handbook)", url: "https://developer.wordpress.org/plugins/taxonomies/", kind: "docs" },
        { label: "WordPress: Metadata (Plugin Handbook)", url: "https://developer.wordpress.org/plugins/metadata/", kind: "docs" },
        { label: "Delicious Brains: The Ultimate Developer's Guide to the WordPress Database", url: "https://deliciousbrains.com/tour-wordpress-database/", kind: "article" },
      ],
      video: {
        title: "WordPress Custom Post Type & Field Tutorial",
        channel: "LearnWebCode",
        url: "https://www.youtube.com/watch?v=4W36IbaE-As",
        videoId: "4W36IbaE-As",
        durationLabel: "28:11",
      },
      alternateVideos: [
        {
          title: "WordPress Plugin Development: Gutenberg Blocks, React & More",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=hbJiwm5YL5Q",
          videoId: "hbJiwm5YL5Q",
          startSeconds: 12241,
          chapterLabel: "Pros & Cons of Custom Post Types",
          durationLabel: "3:44:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-content-model-q1",
          prompt: "Where does a custom post type's content live?",
          options: [
            "In `wp_posts`, with the type name in the `post_type` column — no new table is created",
            "In a new table named after the post type",
            "In `wp_posts` for the fields WordPress knows, plus a generated table for the rest",
            "In `wp_postmeta` only, keyed by a synthetic post ID",
          ],
          correctIndex: 0,
          explanation:
            "`register_post_type()` registers behaviour — labels, rewrites, capabilities, REST visibility — not storage. Everything shares one table, which is why `wp_posts` on a busy site holds posts, pages, revisions, menu items, attachments and every CPT together.",
        },
        {
          id: "wp-content-model-q2",
          prompt: "When must `register_post_type()` be called?",
          options: [
            "On `init` — earlier and its dependencies are not ready, later and the rewrite rules and main query were already built",
            "On `after_setup_theme`, so themes can override it",
            "On `plugins_loaded`, before any theme code runs",
            "Anywhere in the plugin file; the hook is irrelevant",
          ],
          correctIndex: 0,
          explanation:
            "The handbook is explicit about `init`. Registering later means the rewrite rules and query were built without your type; registering at file-include time runs before translations and other registrations exist.",
        },
        {
          id: "wp-content-model-q3",
          prompt: "A plugin calls `flush_rewrite_rules()` on `init` right after registering its post type, so that permalinks always work. What is wrong?",
          options: [
            "It regenerates and re-saves the entire rewrite rule set on every request — an expensive write on a read path",
            "Nothing: it is the documented way to keep permalinks current",
            "It only works in the admin, so front-end permalinks stay broken",
            "It deletes the rules without regenerating them",
          ],
          correctIndex: 0,
          explanation:
            "Flushing is a one-off. Call it from the activation hook, after registering the type, and from deactivation. On `init` it turns every page view into a rule regeneration plus an option write.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-content-model-q4",
          prompt: "A new custom post type opens in the classic editor and does not appear under `/wp-json/wp/v2/`. What is missing?",
          options: [
            "`'show_in_rest' => true` in the registration arguments",
            "`'public' => true`",
            "`'supports' => array( 'editor' )`",
            "A `rest_api_init` callback registering the route by hand",
          ],
          correctIndex: 0,
          explanation:
            "The block editor is a REST client, so a type not exposed to REST falls back to the classic editor. `show_in_rest` also generates the `wp/v2/<rest_base>` route; `public` controls front-end queryability, not the API.",
        },
        {
          id: "wp-content-model-q5",
          prompt:
            "You need to filter a `product` archive by 'material'. Which statements argue for modelling it as a taxonomy rather than post meta? (Select all that apply.)",
          options: [
            "Term relationships live in narrow, indexed tables built for exactly this lookup",
            "A taxonomy gives you archive URLs and a term-query API for free",
            "`wp_postmeta` stores values in a `longtext` column that cannot be usefully indexed for filtering",
            "Post meta cannot store the same key twice for one post",
            "Taxonomies are the right home for per-post values such as a price or a serial number",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Taxonomies are the query-optimised half of the content model. Post meta *can* hold repeated keys, and it is the right home for per-post values you only display — which is precisely what a taxonomy is bad at.",
        },
        {
          id: "wp-content-model-q6",
          prompt: "Which tables does a taxonomy term use?",
          options: [
            "`wp_terms` (the name), `wp_term_taxonomy` (the term within a taxonomy) and `wp_term_relationships` (the link to objects)",
            "`wp_terms` alone, with a `taxonomy` column",
            "`wp_terms` and `wp_postmeta`",
            "`wp_term_taxonomy` and `wp_posts`",
          ],
          correctIndex: 0,
          explanation:
            "The split lets one name appear in several taxonomies, and `wp_termmeta` adds per-term metadata. It is a real many-to-many — the one properly normalised corner of the schema.",
        },
        {
          id: "wp-content-model-q7",
          prompt: "What does `get_post_meta( $id, 'subtitle' )` return, and how does passing `true` as the third argument change it?",
          options: [
            "Without `true` it returns an array of every value for the key; with `true` it returns the single value itself",
            "They are identical for single-valued keys",
            "Without `true` it returns the value; with `true` it returns an array",
            "Without `true` it returns `false` unless the key was registered",
          ],
          correctIndex: 0,
          explanation:
            "The default is the multi-value form, because a meta key may legitimately have many rows. Forgetting `true` is why `Array to string conversion` shows up in templates.",
        },
        {
          id: "wp-content-model-q8",
          prompt: "`update_post_meta( $id, 'views', 42 )` is called when the stored value is already `42`. What does it return?",
          options: [
            "`false` — the value is unchanged, so nothing was written",
            "`true` — the call succeeded",
            "The meta ID of the existing row",
            "`0`",
          ],
          correctIndex: 0,
          explanation:
            "It returns the new meta ID when it creates the row, `true` when it changes one, and `false` both on failure *and* when the value was already identical. Treating `false` as an error produces a bug that only appears when a user saves without changing anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-content-model-q9",
          prompt: "Why do the WordPress coding standards ask for short, consistent meta keys?",
          options: [
            "The index on `meta_key` is a prefix index of limited length, so keys that differ only past that prefix are not distinguishable to it",
            "MySQL rejects `meta_key` values longer than the index length",
            "Long meta keys are silently truncated on write",
            "Long keys break the REST API's JSON serialisation",
          ],
          correctIndex: 0,
          explanation:
            "The prefix index is sized to fit `utf8mb4` row limits. Values are not truncated and JSON does not care — the cost is purely that lookups stop being selective once the distinguishing part falls outside the indexed prefix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-content-model-q10",
          prompt: "You add `'has_archive' => true` to an existing post type and `/books/` returns a 404. Why?",
          options: [
            "The rewrite rules are cached in the database and have not been regenerated — re-save permalinks, or flush on activation",
            "`has_archive` requires a matching `archive-book.php` or the URL 404s",
            "Archives only work for post types registered in a theme",
            "`has_archive` must be a string, never `true`",
          ],
          correctIndex: 0,
          explanation:
            "Rewrite rules live in the `rewrite_rules` option and only change when something flushes them. A missing `archive-book.php` would fall through to `archive.php` and then `index.php`, not 404.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-content-model-q11",
          prompt: "What does `register_meta()` with `'show_in_rest' => true` buy you?",
          options: [
            "A declared type plus sanitisation and authorisation callbacks for that key, and exposure in the REST response so the block editor can read and write it",
            "A dedicated database column for that key",
            "An index on that key in `wp_postmeta`",
            "Validation of the value against a JSON schema on direct `update_post_meta()` calls",
          ],
          correctIndex: 0,
          explanation:
            "It is a registration, not a storage change: type, single or multiple, `sanitize_callback`, `auth_callback`, REST exposure. The callbacks apply wherever the meta is written, but the REST schema only guards requests that come through the API.",
        },
      ],
    },
    {
      id: "wp-block-themes",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Block Themes, theme.json and the Classic Themes You Will Inherit",
      summary:
        "There are two theme models in the same product, and agency work means knowing both. A **classic theme** is PHP template files plus `functions.php`: the hierarchy resolves to `single.php`, you write the markup, and you style it with a stylesheet you enqueue. A **block theme** — the current path — is HTML template files of block markup in `templates/` and `parts/`, with `theme.json` as the single declarative source for design tokens, per-block style defaults and which editor controls exist. WordPress compiles `theme.json` into CSS custom properties and preset classes, so the editor and the front end are generated from the same file. The minimum marker of a block theme is `templates/index.html`.\n\n`theme.json` exists because the same palette used to be declared three times — in CSS, in `add_theme_support( 'editor-color-palette' )`, and in Customizer controls — and they drifted. Version 3 of the schema is the current generation and works with WordPress 6.6 and later. Block themes hand real structural control to the client, which is the point and also the risk: they are a poor fit for tightly art-directed work or a content team who should not be able to rearrange pages. A **hybrid theme** — PHP templates plus `theme.json` — is a legitimate and common middle ground.\n\nTwo things catch people. `theme.json` output is deliberately low-specificity so user and block settings can override it, which means a single inherited `!important` in a legacy stylesheet silently beats it and looks like `theme.json` 'not working'. And templates are file-first but database-overridable: once a client edits one in the Site Editor it becomes a `wp_template` post that wins over your deployed file until the customisation is cleared.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "WordPress: Global Settings and Styles (theme.json)", url: "https://developer.wordpress.org/themes/global-settings-and-styles/", kind: "docs" },
        { label: "WordPress: theme.json Version 3 Reference", url: "https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/", kind: "docs" },
        { label: "WordPress: Classic Theme Template Files", url: "https://developer.wordpress.org/themes/classic-themes/basics/template-files/", kind: "docs" },
        { label: "WordPress: Child Themes", url: "https://developer.wordpress.org/themes/advanced-topics/child-themes/", kind: "docs" },
      ],
      video: {
        title: "WordPress Block Theme Development Tutorial",
        channel: "LearnWebCode",
        url: "https://www.youtube.com/watch?v=KBF359_ZYZ0",
        videoId: "KBF359_ZYZ0",
        durationLabel: "20:58",
      },
      alternateVideos: [
        {
          title: "When To Create a Block Theme vs Traditional Theme in WordPress?",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=fr14H3x0m1M",
          videoId: "fr14H3x0m1M",
          durationLabel: "8:01",
        },
        {
          title: "WordPress Theme Development Tutorial (Classic Theme)",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=wUz69qRjN2s",
          videoId: "wUz69qRjN2s",
          durationLabel: "27:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-block-themes-q1",
          prompt: "What makes WordPress treat a theme as a block theme?",
          options: [
            "The presence of `templates/index.html` — block themes resolve the hierarchy to HTML files of block markup",
            "A `blockTheme` flag set to `true` in `theme.json`",
            "The absence of `functions.php`",
            "Calling `add_theme_support( 'block-templates' )`",
          ],
          correctIndex: 0,
          explanation:
            "`templates/index.html` alongside `style.css` is the minimum. A block theme can still have `functions.php`, and usually does: enqueuing, block registration and custom post types all remain PHP.",
        },
        {
          id: "wp-block-themes-q2",
          prompt: "What problem does `theme.json` solve that a stylesheet plus a Customizer panel did not?",
          options: [
            "One declarative source the editor, the front end and the Site Editor UI all read, instead of three parallel definitions of the same design tokens",
            "It replaces CSS entirely — block themes ship no stylesheet",
            "It compiles the theme's Sass at build time",
            "It stores the client's layout so a theme switch preserves it",
          ],
          correctIndex: 0,
          explanation:
            "Before it, a theme declared its palette in CSS, again in `add_theme_support( 'editor-color-palette' )`, and again in Customizer controls, and the three drifted. `theme.json` generates custom properties and presets and drives which controls appear. You still write CSS for anything bespoke.",
        },
        {
          id: "wp-block-themes-q3",
          prompt: "You set `settings.color.custom` to `false` in `theme.json` on a live site. What happens?",
          options: [
            "The custom-colour picker disappears from the editor, and content that already used a custom colour keeps its inline style",
            "Existing custom colours are stripped from the content on the next save",
            "Nothing visible — `settings` only affects the Site Editor, not the post editor",
            "Every colour control disappears, including the palette",
          ],
          correctIndex: 0,
          explanation:
            "`settings` gates the UI and the generated presets, not existing content: block markup already carries the inline style. Locking colour down after launch therefore hides the control without cleaning up what it produced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-block-themes-q4",
          prompt: "Which are true of classic themes in current WordPress? (Select all that apply.)",
          options: [
            "They still work, and they are still the majority of what exists in client codebases",
            "They render through PHP template files resolved by the template hierarchy",
            "They can adopt `theme.json` without becoming block themes",
            "They can no longer receive block editor support",
            "They are removed in WordPress 7",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Classic themes are a supported path, not a deprecated one, and `theme.json` works in them — that is the hybrid theme most agencies converge on. Nothing has been removed, and classic themes can register and style blocks.",
        },
        {
          id: "wp-block-themes-q5",
          prompt: "What is a hybrid theme?",
          options: [
            "A classic theme with PHP templates that also ships `theme.json`, and optionally opts into block template parts",
            "A theme that ships both HTML and PHP templates for the same routes and lets the user pick",
            "A block theme with a classic child theme",
            "A theme built with a page-builder plugin instead of core templates",
          ],
          correctIndex: 0,
          explanation:
            "It is the pragmatic middle: keep PHP control over markup, take the design-token and editor-settings benefits of `theme.json`. It is common precisely because full site editing is a large change to hand a client mid-contract.",
        },
        {
          id: "wp-block-themes-q6",
          prompt: "A client edits the header in the Site Editor. Where does that edit live, and what happens when you next deploy a change to `parts/header.html`?",
          options: [
            "The edit becomes a `wp_template_part` post in the database and keeps overriding the theme file until the customisation is cleared",
            "The edit is written back into `parts/header.html` on the server",
            "The edit is stored in `theme.json` under `templateParts`",
            "The theme file always wins on the next page load",
          ],
          correctIndex: 0,
          explanation:
            "Templates and parts are file-first but database-overridable. This is why a deploy can appear to do nothing on a site the client has been editing, and why 'Clear customisations' exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-block-themes-q7",
          prompt: "What does the `version` property at the top of `theme.json` do?",
          options: [
            "It selects which generation of the schema WordPress interprets the file as, so defaults and property names stay stable as the format evolves",
            "It is the theme's own version number, mirroring `style.css`",
            "It pins the minimum WordPress version the theme supports",
            "It sets the prefix used for generated CSS custom properties",
          ],
          correctIndex: 0,
          explanation:
            "Version 3 is the current generation and works with WordPress 6.6 and later. Bumping it opts into that generation's defaults, so you change it deliberately rather than to look current.",
        },
        {
          id: "wp-block-themes-q8",
          prompt: "A stylesheet inherited from the previous agency contains `.entry-content p { color: #333 !important; }`. What happens to the text colour you set in `theme.json`?",
          options: [
            "It loses — `theme.json` output is deliberately low-specificity CSS, and an `!important` declaration beats it",
            "It wins, because core styles are injected after the theme stylesheet",
            "It wins, because `theme.json` output is also marked `!important`",
            "Both are discarded and the browser default applies",
          ],
          correctIndex: 0,
          explanation:
            "Low specificity is a feature: it lets user and block-level settings override theme defaults without a fight. It also means one inherited `!important` silently disables a `theme.json` style, and the symptom looks like `theme.json` not working at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-block-themes-q9",
          prompt: "How does a child theme of a block theme override a template?",
          options: [
            "Place a file of the same name in the child's `templates/` folder — the child is searched before the parent",
            "Child themes are not supported for block themes",
            "Declare the override in `theme.json` under `customTemplates`",
            "Copy the parent's entire `templates/` folder or none of it",
          ],
          correctIndex: 0,
          explanation:
            "The stylesheet directory is searched before the template directory, exactly as with classic themes. `theme.json` merges too: the child's values layer over the parent's.",
        },
        {
          id: "wp-block-themes-q10",
          prompt: "In a block theme, what still belongs in `functions.php`?",
          options: [
            "Enqueuing assets, registering custom blocks and patterns, filters — anything that is behaviour rather than layout",
            "Nothing: block themes have no PHP",
            "Only `add_theme_support()` calls that `theme.json` cannot express",
            "Only translation loading",
          ],
          correctIndex: 0,
          explanation:
            "Block themes move *layout* out of PHP, not logic. Several `add_theme_support()` calls are implied by `theme.json` — editor styles, the palette, spacing — but registration and filtering are unchanged.",
        },
        {
          id: "wp-block-themes-q11",
          prompt: "When is a classic or hybrid theme the better recommendation for a client build?",
          options: [
            "When the design is tightly art-directed and the content team should not be able to restructure pages",
            "Whenever the site has more than a few hundred pages",
            "Whenever WooCommerce is involved, because block themes cannot run it",
            "Whenever the client wants to edit their own content",
          ],
          correctIndex: 0,
          explanation:
            "The real axis is how much structural control you are handing over. Block themes are a good answer when the client genuinely wants to compose pages; they are a bad one when 'the client moved the header' becomes a support ticket you pay for.",
        },
      ],
    },
    {
      id: "wp-blocks",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Building a Block for the Block Editor",
      summary:
        "A block is a registered type described by `block.json` and, usually, a React component for the editor. `block.json` is the canonical metadata because both sides read it: PHP registers the block with `register_block_type( __DIR__ . '/build' )`, JavaScript registers the same name and attributes, and core generates the script and style handles, versions and dependencies from the asset fields. Declaring assets there is how you get dependency handling and cache busting without writing a single `wp_enqueue_script()` call.\n\nThe architectural decision is static versus dynamic. A static block's `save()` serialises HTML into `post_content` between block delimiter comments, so it is fast, cacheable and completely frozen — the markup in every existing post is whatever `save()` produced on the day it was saved. A dynamic block returns `null` from `save()` and renders through a PHP `render` file or `render_callback` on every request: slower per view, but the output, and any query behind it, can change later without touching stored content. Anything whose markup or data will evolve, or that needs a live query, should be dynamic.\n\nThe gotcha that follows is block validation. On load the editor re-runs `save()` and compares the result to the stored markup; any mismatch marks the block invalid and shows the client a scary warning across their site. This is why you cannot simply edit a static block's `save()` in an update — you add a `deprecated` entry describing the old shape, with a `migrate()` if the attributes changed. Teams that expect to iterate often choose dynamic blocks specifically to avoid this whole class of problem.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: Block Metadata (block.json)", url: "https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/", kind: "docs" },
        { label: "WordPress: Block Registration reference", url: "https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/", kind: "docs" },
        { label: "WordPress: Block Development Quick Start Guide", url: "https://developer.wordpress.org/block-editor/getting-started/quick-start-guide/", kind: "docs" },
        { label: "WordPress: Interactivity API reference", url: "https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/", kind: "docs" },
      ],
      video: {
        title: "How to Create New Blocks In WordPress (@wordpress/create-block)",
        channel: "LearnWebCode",
        url: "https://www.youtube.com/watch?v=zDxyfgtVedY",
        videoId: "zDxyfgtVedY",
        durationLabel: "11:19",
      },
      alternateVideos: [
        {
          title: "React JS in WordPress (Add Options to Block Type)",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=qaetjPBm5x4",
          videoId: "qaetjPBm5x4",
          durationLabel: "21:35",
        },
        {
          title: "WordPress Plugin Development: Gutenberg Blocks, React & More",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=hbJiwm5YL5Q",
          videoId: "hbJiwm5YL5Q",
          startSeconds: 9703,
          chapterLabel: "Block Attributes",
          durationLabel: "3:44:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-blocks-q1",
          prompt: "What is `block.json` for?",
          options: [
            "A single metadata file read by both PHP and JavaScript, so registration, attributes, supports and asset handles are declared once",
            "A build artefact generated by `@wordpress/scripts` that you should not edit",
            "The place a block's saved content is stored",
            "A manifest of which blocks the editor is allowed to insert",
          ],
          correctIndex: 0,
          explanation:
            "`register_block_type( __DIR__ . '/build' )` reads it in PHP and `registerBlockType` reads the same data in JS. Declaring assets there also gets you core's handle generation, versioning and dependency handling for free.",
        },
        {
          id: "wp-blocks-q2",
          prompt: "What is the practical difference between a block whose `save()` returns markup and one whose `save()` returns `null`?",
          options: [
            "Static markup is serialised into `post_content` at save time and frozen there; a `null` save means PHP renders the block on every request, so its output can change later",
            "A `null` save makes the block invisible on the front end",
            "Static blocks cannot have attributes; dynamic blocks can",
            "Dynamic blocks are stored in a separate table",
          ],
          correctIndex: 0,
          explanation:
            "That is the whole decision. Static is fast and trivially cacheable but means every existing post keeps the old markup; dynamic costs PHP per render and lets you change the output — and the query behind it — without touching stored content.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-blocks-q3",
          prompt: "You ship an update that changes a static block's `save()` output. What do editors see on existing posts?",
          options: [
            "'This block contains unexpected or invalid content' — the editor re-runs `save()`, compares it to the stored markup and flags the mismatch",
            "Nothing: the new markup is applied silently on the next load",
            "A fatal error in the editor",
            "The block renders correctly but can no longer be edited",
          ],
          correctIndex: 0,
          explanation:
            "Block validation compares regenerated output with what is in `post_content`. The supported way to change a static block is to add a `deprecated` entry describing the old shape so the editor can migrate it — which is one reason many teams reach for a dynamic block instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-blocks-q4",
          prompt: "Which of these are declared in `block.json`? (Select all that apply.)",
          options: [
            "`attributes` — the block's data shape and where each value is sourced from",
            "`supports` — which core features such as colour, spacing and anchors the block opts into",
            "`viewScript` — a front-end script tied to the block rather than to the whole theme",
            "The block's rendered HTML for the front end",
            "A list of the posts that currently use the block",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`block.json` is metadata: shape, capabilities and asset handles. Markup comes from `save()` or a `render` file, and nothing in core indexes which posts contain which block.",
        },
        {
          id: "wp-blocks-q5",
          prompt: "An attribute declared with a `source` of `html` and a selector is read from where?",
          options: [
            "Parsed out of the block's saved markup at load time, rather than stored in the block's delimiter comment",
            "From post meta with the same name",
            "From the REST response for the post",
            "From `theme.json`",
          ],
          correctIndex: 0,
          explanation:
            "Attributes with no `source` live in the block delimiter comment; sourced attributes are extracted from the markup so the content stays editable as HTML. Sourcing is also why changing a `save()` selector counts as a breaking change.",
        },
        {
          id: "wp-blocks-q6",
          prompt: "What does `register_block_type( __DIR__ . '/build' )` do?",
          options: [
            "Reads `build/block.json` and registers the block server-side, including its script and style handles",
            "Compiles the block's JSX at request time",
            "Registers every block found anywhere under the plugin directory",
            "Registers the block for the editor only; the front end needs a second call",
          ],
          correctIndex: 0,
          explanation:
            "Passing a directory is the current idiom: one call, metadata-driven, reading the same file the JS build consumes. Registering server-side is also what makes the block known to `render_block` and to the REST API.",
        },
        {
          id: "wp-blocks-q7",
          prompt: "What is a block `deprecated` entry?",
          options: [
            "A description of a previous version of the block's `save()` and attributes, so the editor recognises old markup and can migrate it",
            "A flag that hides the block from the inserter",
            "A notice shown to editors that the block will be removed",
            "A `block.json` field listing WordPress versions the block no longer supports",
          ],
          correctIndex: 0,
          explanation:
            "Each entry describes an older shape plus an optional `migrate()`. It is the supported answer to 'I need to change this markup without breaking four thousand existing posts'.",
        },
        {
          id: "wp-blocks-q8",
          prompt: "What does `apiVersion` in `block.json` control?",
          options: [
            "Which generation of the Block API the block is written against — notably whether it uses `useBlockProps` and renders correctly in the iframed editor canvas",
            "The minimum WordPress version required",
            "The REST namespace the block is exposed under",
            "The version string used to cache-bust the block's assets",
          ],
          correctIndex: 0,
          explanation:
            "It is a contract version, not a release number. Blocks on the current API get `useBlockProps` and `useInnerBlocksProps` and behave correctly in the iframed canvas; older ones fall back to legacy rendering.",
        },
        {
          id: "wp-blocks-q9",
          prompt: "In a dynamic block, what does the `render` field in `block.json` point at?",
          options: [
            "A PHP file that outputs the block's front-end markup, with `$attributes`, `$content` and the block instance in scope",
            "The file containing the JavaScript `save()` function",
            "A template part in the active theme",
            "A REST endpoint that returns the rendered HTML",
          ],
          correctIndex: 0,
          explanation:
            "It is the metadata-driven alternative to passing a `render_callback`, and it keeps the PHP rendering next to the block rather than in a plugin's bootstrap file.",
        },
        {
          id: "wp-blocks-q10",
          prompt: "Which asset field loads a script in the editor only?",
          options: ["`editorScript`", "`viewScript`", "`script`", "`style`"],
          correctIndex: 0,
          explanation:
            "`editorScript` is editor-only, `viewScript` is front-end-only, and `script` loads in both. Confusing them is how a block's editor React bundle ends up shipped to every visitor.",
        },
        {
          id: "wp-blocks-q11",
          prompt: "Why reach for the Interactivity API rather than enqueueing your own front-end script for a dynamic block?",
          options: [
            "Interactivity is declared with directives in the server-rendered markup and shares one small runtime, so several interactive blocks on a page do not each ship their own framework",
            "It is the only way to make a block respond to clicks",
            "It replaces the block's `render` file",
            "It is the only way to run React on the front end",
          ],
          correctIndex: 0,
          explanation:
            "The point is composition and payload: directives on server-rendered HTML plus a shared runtime, instead of every plugin bundling its own. Plain scripts still work — they just do not compose, and they duplicate weight.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "wp-plugins",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Plugins, mu-plugins and Where Code Belongs",
      summary:
        "WordPress gives you three homes for code, and choosing between them is an architecture decision rather than a preference. The rule that survives contact with real projects is: functionality belongs in a plugin, presentation belongs in a theme. Anything that must outlive a redesign — post types, taxonomies, shortcodes, integrations, business rules — goes in a plugin, because `functions.php` stops being loaded the moment the client switches themes, taking its registrations with it and leaving the data orphaned in `wp_posts` with a `post_type` nothing renders.\n\nMust-use plugins are the third home and behave differently in ways that matter. They load before regular plugins, in alphabetical order, cannot be deactivated from the admin, and never appear in update notifications — so you own their maintenance entirely. Activation and deactivation hooks never fire for them, and the loader only scans PHP files sitting directly in `mu-plugins/`, not subdirectories, so a folder-structured mu-plugin needs a small top-level loader stub. That combination makes them right for host-level and infrastructure code and wrong for anything a client might reasonably need to switch off.\n\nThe plumbing is cheap and worth doing properly: a header comment is the entire registration mechanism, `register_activation_hook()` runs before `init` on that request (so call your own registration function directly there, then flush rewrite rules), and `uninstall.php` is where destructive clean-up goes. Deactivation should be reversible; uninstall is the step that removes data. WordPress will never clean up after a deleted plugin on its own, which is why old sites carry options and tables from plugins removed years ago.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "WordPress: Plugin Basics", url: "https://developer.wordpress.org/plugins/plugin-basics/", kind: "docs" },
        { label: "WordPress: Must Use Plugins", url: "https://developer.wordpress.org/advanced-administration/plugins/mu-plugins/", kind: "docs" },
        { label: "WordPress: Plugin Best Practices", url: "https://developer.wordpress.org/plugins/plugin-basics/best-practices/", kind: "docs" },
        { label: "10up: Engineering Best Practices", url: "https://10up.github.io/Engineering-Best-Practices/", kind: "article" },
      ],
      video: {
        title: "Create Your Own WordPress Plugin (Coding Tutorial)",
        channel: "LearnWebCode",
        url: "https://www.youtube.com/watch?v=syRi9p9aWYA",
        videoId: "syRi9p9aWYA",
        durationLabel: "18:47",
      },
      alternateVideos: [
        {
          title: "WordPress Plugin Development: Gutenberg Blocks, React & More",
          channel: "LearnWebCode",
          url: "https://www.youtube.com/watch?v=hbJiwm5YL5Q",
          videoId: "hbJiwm5YL5Q",
          startSeconds: 992,
          chapterLabel: "Our First Plugin",
          durationLabel: "3:44:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-plugins-q1",
          prompt: "A client site needs a `testimonial` post type. Where does the registration belong?",
          options: [
            "In a plugin, so it survives a theme switch or a redesign",
            "In the theme's `functions.php`, because the theme is what displays testimonials",
            "In an mu-plugin, so the client cannot deactivate it",
            "In `wp-config.php`, so it loads as early as possible",
          ],
          correctIndex: 0,
          explanation:
            "Content is not presentation. `functions.php` stops running the moment the theme changes, and taking the content model with it turns a redesign into a data incident. An mu-plugin is overkill here and removes the client's ability to stage the change.",
        },
        {
          id: "wp-plugins-q2",
          prompt: "Which are true of must-use plugins? (Select all that apply.)",
          options: [
            "They load before regular plugins, in alphabetical order",
            "They cannot be deactivated from the admin",
            "They never show update notifications",
            "Their activation and deactivation hooks fire as usual",
            "They are only available on multisite",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Always on, first, and invisible to the update system — which is exactly why their maintenance is yours. Activation hooks never fire for them, and despite the WPMU origin they work on any install.",
        },
        {
          id: "wp-plugins-q3",
          prompt: "You place your mu-plugin at `wp-content/mu-plugins/acme-core/acme-core.php` and nothing loads. Why?",
          options: [
            "WordPress only loads PHP files directly inside `mu-plugins/`, not in subdirectories — add a small loader file at the top level",
            "mu-plugins must be named `mu-plugin.php`",
            "The directory has to be registered in `wp-config.php`",
            "mu-plugins are skipped when `WP_DEBUG` is false",
          ],
          correctIndex: 0,
          explanation:
            "The loader does a flat scan. The documented workaround is a one-line `load.php` at the top level that `require`s the real entry point, which also gives you somewhere to control ordering.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-plugins-q4",
          prompt: "Your mu-plugin registers a post type and calls `register_activation_hook()` to flush rewrite rules. What happens?",
          options: [
            "The activation hook never fires, so permalinks stay broken until something else flushes the rules",
            "It fires on every request instead of once",
            "It fires the first time the file appears in the directory",
            "WordPress raises a fatal error, because activation hooks are unavailable to mu-plugins",
          ],
          correctIndex: 0,
          explanation:
            "There is no activation event for a file that is simply present. Code needing an install step either does not belong in an mu-plugin, or has to detect its own state — a version option compared on `init`, for example.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-plugins-q5",
          prompt: "What is the minimum for WordPress to recognise a directory as a plugin?",
          options: [
            "A PHP file containing a header comment with at least a `Plugin Name:` line",
            "A `plugin.json` manifest",
            "A file named after the directory containing a `register_plugin()` call",
            "An entry added to the `active_plugins` option",
          ],
          correctIndex: 0,
          explanation:
            "The header comment is the whole registration mechanism — WordPress scans plugin files for it. `active_plugins` records what is switched *on*, and it is written by the activation process, not by you.",
        },
        {
          id: "wp-plugins-q6",
          prompt: "What can you rely on inside a `register_activation_hook()` callback?",
          options: [
            "The database and core APIs, but not your own `init` registrations — activation runs before `init` on that request",
            "Everything, including post types your plugin registers on `init`",
            "Nothing but `$wpdb`; no other WordPress functions are loaded yet",
            "The active theme's `functions.php`, which always loads first",
          ],
          correctIndex: 0,
          explanation:
            "This is why the standard pattern is to call your registration function directly inside the activation callback and *then* flush rewrite rules, rather than assuming `init` has already run.",
        },
        {
          id: "wp-plugins-q7",
          prompt: "Where does a plugin's clean-up code belong?",
          options: [
            "An `uninstall.php` in the plugin root, or a callback registered with `register_uninstall_hook()` — deactivation is not deletion",
            "The deactivation hook, which is the only point WordPress guarantees",
            "Nowhere: WordPress removes a plugin's options and tables automatically",
            "A `--uninstall` WP-CLI command the plugin must supply",
          ],
          correctIndex: 0,
          explanation:
            "Deactivation is reversible and should leave data alone; uninstall is the destructive step. WordPress removes nothing by itself, which is why old sites carry options and tables from plugins deleted years ago.",
        },
        {
          id: "wp-plugins-q8",
          prompt: "What exactly happens to code in `functions.php` when the client switches themes?",
          options: [
            "It stops being loaded entirely — whatever it registered disappears, while data it wrote to the database remains orphaned",
            "It keeps running until the new theme defines a conflicting function",
            "WordPress copies it into the new theme",
            "Its hooks survive but its function definitions do not",
          ],
          correctIndex: 0,
          explanation:
            "`functions.php` is included from the active theme and nowhere else. The orphaned-data half is the nastier one: post types vanish while their rows sit in `wp_posts` under a `post_type` nothing renders.",
        },
        {
          id: "wp-plugins-q9",
          prompt: "In what order does WordPress load plugin code?",
          options: [
            "mu-plugins alphabetically, then active plugins in the order stored in the `active_plugins` option, then the theme",
            "Active plugins alphabetically, then mu-plugins, then the theme",
            "Alphabetically across mu-plugins and plugins together",
            "In the order the plugins were installed",
          ],
          correctIndex: 0,
          explanation:
            "`active_plugins` is a serialised array whose order determines plugin load order — which is why 'load my plugin last' hacks that re-sort that option exist, and why relying on them is fragile. Hook priorities are the supported way to control ordering.",
        },
      ],
    },
    {
      id: "wp-enqueue",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Enqueuing Scripts and Styles Properly",
      summary:
        "The enqueue system exists because a CMS assembles one page from code written by people who have never met. If a theme prints its own `<script src=\"jquery.js\">`, it loads a second jQuery and breaks every plugin that registered against the first. `wp_enqueue_script()` instead registers a *handle* with dependencies, a version and a loading strategy; WordPress resolves the graph once and prints each handle at most once, in dependency order. That is also what makes `wp_dequeue_script()` and `wp_script_add_data()` possible — you cannot dequeue a hand-written tag.\n\nSince WordPress 6.3 the fifth argument is an `$args` array, so `array( 'in_footer' => true, 'strategy' => 'defer' )` replaces the old boolean. `defer` preserves execution order and is the safe default for anything with dependencies; `async` gives no ordering guarantee and suits standalone scripts only. Data belongs on the handle too: `wp_add_inline_script()` for arbitrary JavaScript (it prints immediately before or after the handle wherever that ends up), and `wp_localize_script()` for the simple string-keyed object it was designed for.\n\nThree things catch people repeatedly. Enqueue on the right hook — `wp_enqueue_scripts` for the front end, `admin_enqueue_scripts` for admin screens, `enqueue_block_editor_assets` for the editor — never on `init` and never by echoing into `wp_head`. In a child theme use `get_stylesheet_directory_uri()`, because `get_template_directory_uri()` always points at the *parent* and the bug only appears once someone adds a child theme. And pass a real `$ver`, such as `filemtime()` in development or a build hash in production, or clients will see stale CSS indefinitely.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "WordPress: wp_enqueue_script()", url: "https://developer.wordpress.org/reference/functions/wp_enqueue_script/", kind: "docs" },
        { label: "WordPress: Including CSS & JavaScript", url: "https://developer.wordpress.org/themes/classic-themes/basics/including-css-javascript/", kind: "docs" },
        { label: "WordPress: wp_add_inline_script()", url: "https://developer.wordpress.org/reference/functions/wp_add_inline_script/", kind: "docs" },
        { label: "WordPress: wp_localize_script()", url: "https://developer.wordpress.org/reference/functions/wp_localize_script/", kind: "docs" },
      ],
      video: {
        title: "Enqueuing CSS and JavaScript",
        channel: "WordPress",
        url: "https://www.youtube.com/watch?v=a7ZRFA2s-pM",
        videoId: "a7ZRFA2s-pM",
        durationLabel: "7:08",
      },
      alternateVideos: [
        {
          title: "How to use Script Localization in WordPress? | wp_localize_script() | WordPress Tutorial",
          channel: "BuntyWP",
          url: "https://www.youtube.com/watch?v=Sqs2ogGrvTU",
          videoId: "Sqs2ogGrvTU",
          durationLabel: "19:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-enqueue-q1",
          prompt: "Why enqueue a script instead of printing a `<script>` tag in the template?",
          options: [
            "So WordPress can resolve dependencies, print each handle once, and let other code depend on, reorder or dequeue it",
            "Because printing tags in a template is blocked by WordPress",
            "Because enqueued scripts are automatically minified and concatenated",
            "Because only enqueued scripts can use `defer`",
          ],
          correctIndex: 0,
          explanation:
            "The registry is what stops a site assembled from unrelated code loading jQuery three times. Nothing is minified for you, and a hand-written tag can carry `defer` — it just cannot participate in the graph or be removed.",
        },
        {
          id: "wp-enqueue-q2",
          prompt: "Since WordPress 6.3, what does the fifth argument of `wp_enqueue_script()` accept?",
          options: [
            "An array such as `array( 'in_footer' => true, 'strategy' => 'defer' )`, overloading the old boolean",
            "Only the boolean `$in_footer`, as before",
            "A priority integer",
            "A media query string",
          ],
          correctIndex: 0,
          explanation:
            "The boolean still works for compatibility, but the array is how you express `defer` or `async` without filtering `script_loader_tag` and rewriting the markup yourself.",
        },
        {
          id: "wp-enqueue-q3",
          prompt: "A script enqueued with `'strategy' => 'async'` depends on another enqueued script. What is the problem?",
          options: [
            "`async` gives no execution-order guarantee, so the dependency may not have run yet — `defer` preserves order and is the right choice",
            "Nothing: WordPress rewrites `async` to `defer` whenever dependencies exist",
            "`async` scripts are never printed in the footer",
            "Dependencies are ignored for any script that declares a loading strategy",
          ],
          correctIndex: 0,
          explanation:
            "`defer` scripts execute in document order before `DOMContentLoaded`; `async` executes as soon as the file arrives, so a dependent can run first. Core will fall back to blocking rather than honour a strategy that would break a chain, but the rule to remember is that `async` suits standalone scripts only.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-enqueue-q4",
          prompt: "Which hooks are the right places to enqueue assets? (Select all that apply.)",
          options: [
            "`wp_enqueue_scripts` for the front end",
            "`admin_enqueue_scripts` for admin screens",
            "`enqueue_block_editor_assets` for the block editor",
            "`init`, which runs earliest and therefore always works",
            "`wp_head`, so the tag is printed in the right place",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Each hook fires exactly when the corresponding queue is being built. `init` is too early for conditional tags to decide *whether* to load something, and echoing from `wp_head` bypasses the registry entirely.",
        },
        {
          id: "wp-enqueue-q5",
          prompt: "A child theme enqueues its script from `get_template_directory_uri() . '/js/app.js'`. What happens?",
          options: [
            "It loads the parent theme's file, because `get_template_directory_uri()` always points at the parent — use `get_stylesheet_directory_uri()`",
            "It 404s, because the parent has no `js/` folder",
            "It works; the two functions are aliases",
            "It loads both the parent's and the child's copies",
          ],
          correctIndex: 0,
          explanation:
            "'Template' means the parent and 'stylesheet' means the active theme, which is the child when one is active. With no child theme the two are identical, so the bug only surfaces once someone adds one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-enqueue-q6",
          prompt: "What does the `$ver` argument actually do?",
          options: [
            "It is appended as a query string, so browsers and CDNs treat a changed file as a new URL",
            "It selects which registered version of the handle to load",
            "It tells WordPress to refuse the script if the site is older than that version",
            "It sets the `integrity` attribute on the tag",
          ],
          correctIndex: 0,
          explanation:
            "Passing `null` removes the query string; passing nothing uses the WordPress version, which does not change when your file does. `filemtime()` is the usual development answer and a build hash the usual production one.",
        },
        {
          id: "wp-enqueue-q7",
          prompt: "You need to pass an API URL and a nonce to a front-end script. What is the current idiom?",
          options: [
            "`wp_add_inline_script( $handle, ..., 'before' )` for arbitrary data, or `wp_localize_script()` for the simple string-keyed object it was built for",
            "Echo a `<script>` block into `wp_head` before the script is printed",
            "Put the values in a `data-` attribute by filtering `script_loader_tag`",
            "Append them as query parameters on the script's `$src`",
          ],
          correctIndex: 0,
          explanation:
            "Both attach the data to the handle, so it prints immediately next to the script wherever that ends up. `wp_localize_script()` was designed for translation strings and coerces values to strings, which is why `wp_add_inline_script()` is the better general tool.",
        },
        {
          id: "wp-enqueue-q8",
          prompt: "What does the third argument of `wp_enqueue_script()` do?",
          options: [
            "Names other registered handles that must print first, and WordPress loads them whether or not anything else enqueued them",
            "Lists files to concatenate with this one",
            "Declares which pages the script may load on",
            "Sets an integer ordering within the footer",
          ],
          correctIndex: 0,
          explanation:
            "Declaring `array( 'jquery' )` both orders the output and guarantees jQuery is present. It is also how you depend on a handle core generated from a `block.json`.",
        },
        {
          id: "wp-enqueue-q9",
          prompt: "A performance plugin deregisters core's jQuery and registers a CDN copy under the same `jquery` handle. What is the risk?",
          options: [
            "Every plugin that depends on the `jquery` handle now runs against a version core never tested, without core's jQuery Migrate shim",
            "None — the handle is what matters, so the swap is transparent",
            "WordPress restores the core copy on the next update",
            "The admin breaks, because the admin ignores the `jquery` handle",
          ],
          correctIndex: 0,
          explanation:
            "The handle is a contract other code relies on. Swapping the implementation behind it is the classic reason a calendar widget in an unrelated plugin breaks three weeks after someone enabled a speed plugin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "wp-wpdb",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "The Database Schema and $wpdb",
      summary:
        "The core schema is about a dozen tables and it is worth knowing by heart, because every performance conversation ends up there. `wp_posts` holds *all* content — posts, pages, custom post types, revisions, nav menu items, attachments — discriminated by `post_type`, which is why a site with 2,000 pages and revisions on can carry 60,000 rows. `wp_postmeta` is its EAV side table. Terms take three tables plus `wp_termmeta`. `wp_options` holds configuration and, through the `autoload` column, is read almost in its entirety on every request. Users, comments and links round it out.\n\n`$wpdb` is a thin database wrapper, not an ORM: `get_var`, `get_row`, `get_col`, `get_results`, `query`, and the `insert`/`update`/`delete` helpers that build and escape the statement for you. The important subtlety is that `$wpdb->prepare()` is *not* a protocol-level prepared statement like PDO's. It is sprintf with escaping and quoting, interpolating the finished SQL before it is sent. That is why you must never wrap `%s` in your own quotes, why every value must go through a placeholder, and why identifiers need the `%i` placeholder added in WordPress 6.2 — you cannot parameterise a table name.\n\nThe habits that matter: use `$wpdb->posts` and `$wpdb->prefix` rather than literal table names, since the prefix is configurable and numbered per site on multisite (`base_prefix` is the network-wide one). Reach for `dbDelta()` when a plugin genuinely needs its own table — it diffs your `CREATE TABLE` against the live schema, and it is famously fussy about formatting. And remember that a hand-written query is invisible to the object cache and to every filter other plugins use, so it is sometimes right and never accidental.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: wpdb class reference", url: "https://developer.wordpress.org/reference/classes/wpdb/", kind: "docs" },
        { label: "WordPress: wpdb::prepare()", url: "https://developer.wordpress.org/reference/classes/wpdb/prepare/", kind: "docs" },
        { label: "WordPress: Database API", url: "https://developer.wordpress.org/apis/database/", kind: "docs" },
        { label: "Delicious Brains: The Ultimate Developer's Guide to the WordPress Database", url: "https://deliciousbrains.com/tour-wordpress-database/", kind: "article" },
      ],
      video: {
        title: "WordPress Database High-Level Tour",
        channel: "WPCasts",
        url: "https://www.youtube.com/watch?v=D5BcyVA7WZE",
        videoId: "D5BcyVA7WZE",
        durationLabel: "15:26",
      },
      alternateVideos: [
        {
          title: "How To Interact With The WordPress Database | WPDB Development Tutorial",
          channel: "WPCasts",
          url: "https://www.youtube.com/watch?v=gNnf2rRDWEw",
          videoId: "gNnf2rRDWEw",
          durationLabel: "8:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-wpdb-q1",
          prompt: "Which of these live in `wp_posts`?",
          options: [
            "Posts, pages, custom post types, revisions, nav menu items and attachments — all discriminated by `post_type`",
            "Only published posts and pages; everything else has its own table",
            "Posts and pages; custom post types get generated tables",
            "Everything except attachments, which live in a media table",
          ],
          correctIndex: 0,
          explanation:
            "One table, one discriminator column. It is why `wp_posts` grows faster than people expect, and why a `post_type` condition belongs in almost every hand-written query against it.",
        },
        {
          id: "wp-wpdb-q2",
          prompt: "On a multisite install, what is the difference between `$wpdb->prefix` and `$wpdb->base_prefix`?",
          options: [
            "`prefix` is the current site's prefix, such as `wp_3_`; `base_prefix` is the network's `wp_`, where users and network tables live",
            "They are always identical; `base_prefix` is a deprecated alias",
            "`base_prefix` is the prefix before `wp-config.php` overrides it",
            "`prefix` includes the table name and `base_prefix` does not",
          ],
          correctIndex: 0,
          explanation:
            "Per-site tables are numbered; network-wide tables such as `users` and `usermeta` are not. Hard-coding `wp_` is the bug that only appears when someone turns on multisite, and it appears as reading another site's data.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-wpdb-q3",
          prompt: "Is `$wpdb->prepare()` a prepared statement in the sense PDO's `prepare()` is?",
          options: [
            "No — it interpolates escaped values into the SQL string before sending it, so the safety comes from escaping, not from separating query and data",
            "Yes — it sends the query and the parameters separately, exactly like PDO",
            "Yes, but only for `%d` and `%f`; `%s` is interpolated",
            "No — it does nothing beyond checking the placeholder count",
          ],
          correctIndex: 0,
          explanation:
            "It is sprintf with escaping and quoting. That is why you must not add your own quotes around `%s`, why every value has to go through a placeholder, and why an identifier needs `%i` rather than string interpolation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-wpdb-q4",
          prompt: "A table name has to come from a variable. What is correct?",
          options: [
            "Use the `%i` identifier placeholder (WordPress 6.2 and later), or build the name from `$wpdb->prefix` and never from user input",
            "Use `%s`, which quotes the value — which is what an identifier needs",
            "Concatenate it: identifiers cannot be injected",
            "Run the name through `esc_sql()` first",
          ],
          correctIndex: 0,
          explanation:
            "`%s` wraps the value in string quotes, producing invalid SQL for an identifier — the usual reason people give up and concatenate. `%i` quotes it as an identifier instead. `esc_sql()` escapes for a value context, not an identifier one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-wpdb-q5",
          prompt: "Which `$wpdb` calls escape their data for you without a `prepare()` call? (Select all that apply.)",
          options: [
            "`$wpdb->insert( $table, $data, $format )`",
            "`$wpdb->update( $table, $data, $where )`",
            "`$wpdb->delete( $table, $where )`",
            "`$wpdb->query( $sql )`",
            "`$wpdb->get_results( $sql )`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The CRUD helpers build the statement themselves and escape each value. `query()` and `get_results()` execute whatever string you hand them, which is exactly why those are the ones that need `prepare()`.",
        },
        {
          id: "wp-wpdb-q6",
          prompt: "Which method do you use for a single scalar result such as a `COUNT(*)`?",
          options: ["`$wpdb->get_var()`", "`$wpdb->get_row()`", "`$wpdb->get_col()`", "`$wpdb->get_results()`"],
          correctIndex: 0,
          explanation:
            "`get_var()` returns one cell, `get_row()` one row, `get_col()` one column across rows, `get_results()` the whole set. Picking the narrow one is not just tidier — it avoids hydrating rows you then discard.",
        },
        {
          id: "wp-wpdb-q7",
          prompt: "What do you give up by fetching posts with a hand-written `$wpdb->get_results()` instead of `WP_Query`?",
          options: [
            "The object cache, the primed meta and term caches, and every filter other plugins use to modify queries — your query is invisible to all of them",
            "Nothing: `WP_Query` runs the same SQL",
            "Only the ability to paginate",
            "Access to custom post types, which `$wpdb` cannot see",
          ],
          correctIndex: 0,
          explanation:
            "It is sometimes the right call — a reporting query has no business going through `WP_Query` — but it has to be a decision. The usual accident is a 'quick' raw query in a template that then runs uncached on every page view.",
        },
        {
          id: "wp-wpdb-q8",
          prompt: "What is the `autoload` column in `wp_options` for?",
          options: [
            "Every row marked for autoload is fetched in one query on each request and kept in memory for the rest of it",
            "It marks options that may be loaded lazily and cached on disk",
            "It marks options that survive a plugin uninstall",
            "It controls whether the option is exposed to the REST API",
          ],
          correctIndex: 0,
          explanation:
            "One query, one large array, every request. Cheap for a few kilobytes of settings and expensive when a plugin autoloads a megabyte of serialised cache — which is why auditing autoloaded size is a standard first step on a slow site.",
        },
        {
          id: "wp-wpdb-q9",
          prompt: "When is a custom table the right answer instead of post meta?",
          options: [
            "When the data has a fixed shape you will query, sort or aggregate by — an events log, order lines, analytics rows",
            "Whenever there are more than a few hundred rows",
            "Whenever the data does not belong to a post",
            "Never: custom tables break core's caching and should be avoided",
          ],
          correctIndex: 0,
          explanation:
            "Post meta buys you the editor, the REST API and core's cache priming; you trade those for real columns, indexes and joins. The trade only pays when you query by the data — which is exactly the move WooCommerce made for orders.",
        },
        {
          id: "wp-wpdb-q10",
          prompt: "What does `dbDelta()` do?",
          options: [
            "Compares a `CREATE TABLE` statement with the current schema and issues the ALTERs needed to match it",
            "Exports the difference between two databases",
            "Runs the SQL in a transaction and rolls back on error",
            "Migrates data between `wp_posts` and a custom table",
          ],
          correctIndex: 0,
          explanation:
            "It parses your SQL to diff it, which is why it is fussy about formatting — one field per line, two spaces after `PRIMARY KEY`, lowercase types. It also never drops columns, so removing a field needs its own migration.",
        },
        {
          id: "wp-wpdb-q11",
          prompt: "Why write `$wpdb->posts` rather than the literal table name?",
          options: [
            "The prefix is configurable per install and numbered per site on multisite, so the property is the only name correct everywhere",
            "The property is escaped and the literal is not",
            "The literal is deprecated and raises a notice",
            "`$wpdb->posts` is cached while the literal forces a fresh query",
          ],
          correctIndex: 0,
          explanation:
            "`$wpdb` exposes an already-prefixed property for every core table. Hard-coded names are the most common reason a plugin breaks on a hardened install that changed its prefix.",
        },
      ],
    },
    {
      id: "wp-rest-headless",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "The REST API and Headless WordPress",
      summary:
        "`/wp-json/` is not an add-on. The block editor is a REST client: it reads and writes posts, meta, taxonomies and templates over the API, which is why 'disable the REST API' plugins break editing. The content endpoints have been in core since WordPress 4.7, and `register_rest_route()` gives you a namespace (`acme/v1` — collision avoidance plus a versioning seam), a route with typed parameters, and per-method `callback`, `permission_callback` and `args` with `validate_callback` and `sanitize_callback`.\n\n`permission_callback` is the one to internalise. Omitting it logs a `_doing_it_wrong()` notice and leaves the route open, which is the single most common way a plugin ships an unauthenticated write endpoint — and `'permission_callback' => '__return_true'` copied off a blog post is the same bug with a tidier face. Validation is not authorisation: `sanitize_callback` cleans a value, it does not decide who may send it. Cookie-authenticated requests additionally need an `X-WP-Nonce` header carrying a `wp_rest` nonce, because cookies alone would make every route forgeable cross-site; external clients use Application Passwords, or JWT/OAuth through a plugin.\n\nHeadless is a genuine architectural decision rather than a modernisation. You gain a front-end stack and a clean client/server split; you lose preview, the block editor's own rendering, the front-end output of most plugins, and every page-caching assumption the ecosystem is built on. WPGraphQL is the common alternative to REST when the client is a React or Next front end, because a meta-heavy content model pushes REST toward either large fixed payloads or an accumulating pile of bespoke routes — at the cost of harder HTTP caching and a new surface to secure.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: Adding Custom Endpoints", url: "https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/", kind: "docs" },
        { label: "WordPress: REST API Authentication", url: "https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/", kind: "docs" },
        { label: "WordPress: REST API Handbook", url: "https://developer.wordpress.org/rest-api/", kind: "docs" },
        { label: "WPGraphQL: Introduction", url: "https://www.wpgraphql.com/docs/introduction", kind: "docs" },
      ],
      video: {
        title: "WordPress REST API – custom routes and endpoints",
        channel: "WordPress",
        url: "https://www.youtube.com/watch?v=v1CRoQVwuOU",
        videoId: "v1CRoQVwuOU",
        durationLabel: "17:19",
      },
      alternateVideos: [
        {
          title: "Headless WordPress Overview | Real World Headless WordPress Example",
          channel: "WPCasts",
          url: "https://www.youtube.com/watch?v=kU5dUnKav4A",
          videoId: "kU5dUnKav4A",
          durationLabel: "28:50",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-rest-headless-q1",
          prompt: "What inside WordPress itself depends on the REST API?",
          options: [
            "The block editor — it reads and writes posts, meta, taxonomies and templates over `/wp-json/`",
            "Nothing in core; the REST API exists only for external clients",
            "Only the Site Health screen",
            "The admin list tables",
          ],
          correctIndex: 0,
          explanation:
            "It is the admin's own transport, which is why blanket 'disable REST' advice breaks editing. The content endpoints have been in core since WordPress 4.7.",
        },
        {
          id: "wp-rest-headless-q2",
          prompt: "You register a `POST` route and omit `permission_callback`. What happens?",
          options: [
            "WordPress logs a `_doing_it_wrong()` notice and treats the route as having no permission check — anyone can call it",
            "The route is not registered at all",
            "WordPress defaults to requiring `manage_options`",
            "The route works, but only for logged-in users",
          ],
          correctIndex: 0,
          explanation:
            "Core will not invent a permission for you, and the notice only appears with debugging enabled. This is the single most common way a plugin ships an unauthenticated write endpoint.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-rest-headless-q3",
          prompt: "A read-only route uses `'permission_callback' => '__return_true'`. Is that acceptable?",
          options: [
            "Yes, if the data really is public — but it must be a deliberate decision to make the endpoint anonymous, not a placeholder",
            "No — `__return_true` is only valid on core routes",
            "No — core rejects `__return_true` and logs a notice",
            "Yes, and it is also fine for writes, because the `args` callbacks still validate the input",
          ],
          correctIndex: 0,
          explanation:
            "Public data is a legitimate case; the problem is the same line copied onto a route that writes. Validation is not authorisation — `sanitize_callback` cleans a value, it does not decide who may send it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-rest-headless-q4",
          prompt: "Which of these does `register_rest_route()` let you declare per method? (Select all that apply.)",
          options: [
            "`callback` — the handler",
            "`permission_callback` — the authorisation check",
            "`args` with `required`, `validate_callback` and `sanitize_callback` per parameter",
            "A cache TTL for the response",
            "A rate limit for the route",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Handler, authorisation and a parameter schema are what the API gives you. Caching and rate limiting are entirely yours — which matters, because a custom route runs PHP and is normally excluded from the page cache.",
        },
        {
          id: "wp-rest-headless-q5",
          prompt: "A logged-in visitor's script calls a custom route with `fetch()` and gets a 401 despite a valid session cookie. What is missing?",
          options: [
            "The `X-WP-Nonce` header carrying a `wp_rest` nonce, which cookie authentication requires",
            "An `Authorization: Bearer` header",
            "`credentials: 'include'`, which WordPress never honours",
            "A `methods` value written as a comma-separated string",
          ],
          correctIndex: 0,
          explanation:
            "Cookies alone would make every REST route forgeable cross-site, so core requires the nonce for cookie-authenticated requests. Passing `wp_create_nonce( 'wp_rest' )` into your script is the standard pattern, and `apiFetch` does it for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-rest-headless-q6",
          prompt: "An external service needs to create posts on a client's site. What does core offer without a plugin?",
          options: [
            "Application Passwords — per-user, revocable credentials sent as HTTP Basic auth over HTTPS",
            "The user's normal password over Basic auth",
            "A site-wide API key generated in Settings",
            "Nothing: external write access always needs OAuth via a plugin",
          ],
          correctIndex: 0,
          explanation:
            "They are per-application and revocable without changing the user's own password, and they are disabled over plain HTTP. OAuth2 and JWT still need a plugin, and earn their keep when you need scopes rather than 'everything this user can do'.",
        },
        {
          id: "wp-rest-headless-q7",
          prompt: "Custom meta you registered is not appearing in the REST response for a post. Why?",
          options: [
            "`register_meta()` needs `'show_in_rest' => true` and a declared type before the key is exposed",
            "Meta is never exposed over REST; you must add a field to the response yourself",
            "The post type needs `'supports' => array( 'custom-fields' )` and nothing else",
            "REST only exposes meta keys beginning with an underscore",
          ],
          correctIndex: 0,
          explanation:
            "Exposure is opt-in per key, because `wp_postmeta` is full of private plugin state nobody should publish. Keys beginning with an underscore are the *protected* ones and need explicit handling rather than being the default.",
        },
        {
          id: "wp-rest-headless-q8",
          prompt: "What is the structural argument for WPGraphQL over the REST API on a headless build?",
          options: [
            "The client asks for exactly the fields it needs in one request, instead of over-fetching fixed responses or accumulating bespoke endpoints",
            "GraphQL queries are cached by the page cache and REST calls are not",
            "REST cannot expose custom post types",
            "GraphQL removes the need for authentication",
          ],
          correctIndex: 0,
          explanation:
            "With a meta-heavy content model, REST pushes you toward large fixed payloads or a growing set of one-off routes. The cost is that query flexibility makes HTTP caching harder and gives you a new surface to secure.",
        },
        {
          id: "wp-rest-headless-q9",
          prompt: "What do you give up by going headless?",
          options: [
            "Preview, the editor's own front-end rendering, most plugins' front-end output, and the page-caching assumptions the ecosystem is built on",
            "Nothing — the admin is unchanged, so everything else keeps working",
            "Custom post types and taxonomies",
            "The REST API, which is disabled in headless mode",
          ],
          correctIndex: 0,
          explanation:
            "Everything that renders on the front end — SEO plugins, forms, galleries, WooCommerce templates — assumes it owns the output. Headless is a good trade when you are building an application and a poor one for a site whose value is the plugin ecosystem.",
        },
        {
          id: "wp-rest-headless-q10",
          prompt: "Why does `register_rest_route()` take a namespace such as `acme/v1`?",
          options: [
            "It prevents route collisions between plugins and gives you a versioning seam when a response shape has to change",
            "It maps to a PHP namespace and must match the plugin's",
            "It selects which database prefix the route reads from",
            "It is used only by the autogenerated documentation",
          ],
          correctIndex: 0,
          explanation:
            "Core's own routes live under `wp/v2` for the same reason. Once you have external consumers, shipping `v2` alongside `v1` is how you change a payload without breaking them.",
        },
        {
          id: "wp-rest-headless-q11",
          prompt: "A client's security auditor asks you to 'disable the REST API'. What is the defensible response?",
          options: [
            "Restrict it rather than disable it: core and the editor depend on it, so require authentication where appropriate and review your custom routes",
            "Disable it with a filter — nothing in core needs it",
            "Block `/wp-json/` at the web server, which is the recommended hardening step",
            "Disable it for logged-out users only, which core supports with a setting",
          ],
          correctIndex: 0,
          explanation:
            "Turning it off breaks the block editor and anything using `apiFetch`. The real risks are unauthenticated custom routes and user enumeration through `wp/v2/users`, and both have targeted fixes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "wp-security",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Nonces, Capabilities, Sanitising and Escaping",
      summary:
        "WordPress splits request security into three orthogonal questions, and every state-changing request needs all three answered. *Was this request intended?* — a nonce, via `wp_nonce_field()`, `check_admin_referer()` or `wp_verify_nonce()`. *Is this user allowed?* — a capability check, `current_user_can( 'edit_post', $id )`, never a role check, because roles are just reassignable bundles of capabilities. *Is this data shaped correctly?* — `sanitize_*` on the way in, and the context-matched `esc_*` on the way out.\n\nNonces are the most misunderstood piece. Despite the name they are not used once: a WordPress nonce is a hash of an action, the user ID, the session token and a time tick, valid for between 12 and 24 hours (`wp_verify_nonce()` returns `1` in the first window and `2` in the second). It proves a request came from your own UI recently. It proves nothing about permission — a subscriber gets a perfectly valid nonce for any form you render to them — and because it varies per user it cannot live inside a full-page-cached response.\n\nThe escaping rule is the one people get backwards. Escape *late*, at output, with the function that matches the context: `esc_html()` in element text, `esc_attr()` in attributes, `esc_url()` in `href` (it also enforces an allowed protocol list, which is what stops `javascript:`), `esc_textarea()`, `wp_kses_post()` when you must preserve HTML. Filtering on input destroys data irreversibly and still leaves every other context unprotected — the same string is harmless in a `<p>` and dangerous in an `href` or a `<script>` block. The plain-PHP argument for this is in *XSS and CSRF in Plain PHP*; what WordPress adds is a named function per context, plus `$wpdb->prepare()` for the SQL one.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "WordPress: Escaping Data", url: "https://developer.wordpress.org/apis/security/escaping/", kind: "docs" },
        { label: "WordPress: Nonces", url: "https://developer.wordpress.org/apis/security/nonces/", kind: "docs" },
        { label: "WordPress: Checking User Capabilities", url: "https://developer.wordpress.org/plugins/security/checking-user-capabilities/", kind: "docs" },
        { label: "WordPress: Sanitizing Data", url: "https://developer.wordpress.org/apis/security/sanitizing/", kind: "docs" },
      ],
      video: {
        title: "Escaping, Sanitizing and Data Validation in WordPress",
        channel: "SmallTownDev",
        url: "https://www.youtube.com/watch?v=p80LAxOhFd4",
        videoId: "p80LAxOhFd4",
        durationLabel: "36:38",
      },
      alternateVideos: [
        {
          title: "Let’s code: WordPress plugin security",
          channel: "WordPress",
          url: "https://www.youtube.com/watch?v=b44-svgheAU",
          videoId: "b44-svgheAU",
          durationLabel: "1:16:40",
        },
        {
          title: "Sanitize Data BEFORE You Save It! | WordPress Data Security Tutorial",
          channel: "WPCasts",
          url: "https://www.youtube.com/watch?v=7p9TWoqvmp4",
          videoId: "7p9TWoqvmp4",
          durationLabel: "13:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-security-q1",
          prompt: "A plugin adds an admin form that deletes a post. Which checks does the handler need?",
          options: [
            "A nonce (was this intended?), a capability check (is this user allowed?) and sanitising/escaping of the data — three separate questions",
            "A nonce, which covers both intent and permission",
            "A capability check only; nonces are for front-end forms",
            "`is_admin()`, which proves the request came from the dashboard",
          ],
          correctIndex: 0,
          explanation:
            "They are orthogonal and all three are required. `is_admin()` is the trap: it only reports which side of the site the request was routed to, and anyone can request `wp-admin`.",
        },
        {
          id: "wp-security-q2",
          prompt: "What does `wp_verify_nonce()` return, and what does that tell you about nonce lifetime?",
          options: [
            "`1` if generated within the last 12 hours, `2` if in the 12–24 hour window, `false` otherwise — so a nonce is valid for between 12 and 24 hours",
            "`true` or `false`; a nonce is valid for exactly one use",
            "`true` or `false`; a nonce lasts as long as the session",
            "The number of seconds remaining before it expires",
          ],
          correctIndex: 0,
          explanation:
            "Despite the name, a WordPress nonce is not single-use: it is a hash of the action, user, session and a time tick, replayable within its window. It shows the request came from your UI recently; it does not enforce one use.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-security-q3",
          prompt: "A subscriber submits a valid nonce to an endpoint that deletes any post. Is the request safe to honour?",
          options: [
            "No — the nonce only shows the request came from your own UI; you still need `current_user_can( 'delete_post', $id )`",
            "Yes — a valid nonce can only be generated for a user who has permission",
            "Yes, provided the nonce action string includes the post ID",
            "No, but adding `check_admin_referer()` is sufficient",
          ],
          correctIndex: 0,
          explanation:
            "Nonces are generated for whoever is looking at the page, including low-privileged users, and `check_admin_referer()` is itself just a nonce check plus a referer test. Intent and authorisation are different questions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-security-q4",
          prompt: "What is the difference between `current_user_can( 'edit_posts' )` and `current_user_can( 'edit_post', $post_id )`?",
          options: [
            "The first asks whether the user can edit posts at all; the second is a meta capability mapped to *that* post, taking ownership and status into account",
            "They are equivalent; the plural is a convenience alias",
            "The first is for the admin and the second for the front end",
            "The second only works for custom post types",
          ],
          correctIndex: 0,
          explanation:
            "`map_meta_cap()` turns `edit_post` into whichever primitive capability applies — `edit_published_posts`, `edit_others_posts`, and so on. Checking only `edit_posts` lets a contributor edit somebody else's draft, which is the bug this pair exists to prevent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-security-q5",
          prompt: "Why check capabilities rather than roles?",
          options: [
            "Roles are named bundles of capabilities that plugins and site owners reassign freely, so a role name is not a reliable statement about what a user may do",
            "Role checks are slower because they query the database",
            "Roles are unavailable on the front end",
            "`current_user_can()` cannot accept a role name, so role checks need raw SQL",
          ],
          correctIndex: 0,
          explanation:
            "Membership plugins, multisite and custom roles all move capabilities around. `current_user_can( 'administrator' )` happens to work today because a role is stored much like a capability — which makes it a trap rather than a feature.",
        },
        {
          id: "wp-security-q6",
          prompt: "Why does WordPress tell you to escape at output rather than filter at input? (Select all that apply.)",
          options: [
            "Safety depends on the context the value lands in, which the input handler cannot know",
            "Filtering on input destroys data you may need in another context, irreversibly",
            "A value can reach output by paths that never passed your input handler — an import, another plugin, a direct database write",
            "Output escaping removes the need to validate input at all",
            "`esc_html()` is faster than `sanitize_text_field()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The same string is harmless in a `<p>` and dangerous in an `href` or a `<script>`. Escaping late puts the decision where the context is known — it does not replace input validation, because you still want a URL to be a URL before you store it.",
        },
        {
          id: "wp-security-q7",
          prompt: "Which function escapes a user-supplied value used in an `href`?",
          options: ["`esc_url()`", "`esc_attr()`", "`esc_html()`", "`sanitize_text_field()`"],
          correctIndex: 0,
          explanation:
            "`esc_url()` also enforces an allowed-protocol list, which is what stops a `javascript:` URL. `esc_attr()` would make the attribute well-formed but leave the scheme alone; `esc_url_raw()` is the variant for storing rather than displaying.",
        },
        {
          id: "wp-security-q8",
          prompt:
            "Is this safe?\n\n```php\n<script>const user = '<?php echo esc_html( $name ); ?>';</script>\n```",
          options: [
            "No — inside a script block the parser is reading JavaScript, so HTML entities do not help; use `wp_json_encode()` or `esc_js()`",
            "Yes — `esc_html()` neutralises every character that matters",
            "Yes, provided `$name` was sanitised on input",
            "No, but only because the value should be double-quoted",
          ],
          correctIndex: 0,
          explanation:
            "Sequences such as a closing script tag or a line separator break out of the block regardless of HTML escaping. It is the same context rule as in plain PHP; WordPress simply gives it different function names.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-security-q9",
          prompt: "You must let editors submit some formatted HTML. What is the right tool?",
          options: [
            "`wp_kses_post()` at output — or `wp_kses()` with your own allowlist — which preserves permitted tags and strips the rest",
            "`esc_html()`, which will render the tags as text",
            "`strip_tags()` on the way in",
            "Trust the value, since editors are logged-in users",
          ],
          correctIndex: 0,
          explanation:
            "`esc_html()` is correct but wrong here: it shows the user their own markup as literal text. `strip_tags()` is an input filter with no attribute awareness, so an `onclick` attribute survives it.",
        },
        {
          id: "wp-security-q10",
          prompt: "What does `check_admin_referer( 'acme_save' )` do that `wp_verify_nonce()` does not?",
          options: [
            "It pulls the nonce out of the request, verifies it, checks the referer, and halts the request with `wp_nonce_ays()` on failure",
            "It checks the user's capabilities as well",
            "It regenerates the nonce for the next request",
            "It works for AJAX requests, which `wp_verify_nonce()` cannot handle",
          ],
          correctIndex: 0,
          explanation:
            "It is the batteries-included version for form posts, and it dies rather than returning false — which is what you want, since a failed nonce check should never quietly fall through. `check_ajax_referer()` is its AJAX and REST counterpart.",
        },
        {
          id: "wp-security-q11",
          prompt: "A settings screen filters rows in a custom table by a user-supplied status. Which is correct?",
          options: [
            "`$wpdb->prepare()` with the SQL containing a bare `%s` placeholder, passing `$status` as the argument",
            "String concatenation with `esc_sql( $status )` and your own surrounding quotes",
            "`$wpdb->prepare()` with the `%s` placeholder already wrapped in quotes inside the SQL",
            "String concatenation with `sanitize_text_field( $status )`",
          ],
          correctIndex: 0,
          explanation:
            "`prepare()` adds the quotes around `%s` itself, so pre-quoting the placeholder double-quotes the value. `esc_sql()` works but leaves the quoting to you, and `sanitize_text_field()` is not an SQL escape at all.",
        },
        {
          id: "wp-security-q12",
          prompt: "A form on a public page embeds a nonce, and the site sits behind a full-page cache. What goes wrong?",
          options: [
            "The nonce is cached with the HTML, so later visitors receive one generated for a different user or session and submission fails",
            "Nothing — nonces are not user-specific",
            "The page cache refuses to cache any page containing a nonce",
            "The nonce expires immediately, because cached pages have no session",
          ],
          correctIndex: 0,
          explanation:
            "Nonces are tied to the user and session, so they cannot be part of a shared cached response. The usual answers are to fetch the nonce over an uncached REST or AJAX call at submit time, or to exclude the page from the cache.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "wp-caching-performance",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "Options, Transients and the Caching Layers",
      summary:
        "Four caches sit between a WordPress request and the database, and knowing which one you are in decides every optimisation. The **object cache** (`wp_cache_get`/`wp_cache_set`) is, by default, a plain in-memory array that dies at the end of the request; it only survives between requests when the host installs a drop-in at `wp-content/object-cache.php` backed by Redis or Memcached. **Transients** are the same idea with an expiry — but with no persistent object cache they land in `wp_options` as `_transient_*` rows, and with one they go to the object cache and never touch MySQL. Same API, two completely different performance profiles.\n\nThe **options table** is a cache of a different kind: every row marked `autoload` is fetched in one query and unserialised on every request, before WordPress knows which page was asked for. A plugin that autoloads a megabyte of serialised data taxes the home page, an AJAX call and a cron ping equally. Since WordPress 6.6, passing `null` as `$autoload` to `add_option()`/`update_option()` lets core apply a size heuristic instead of trusting the caller. The **page cache** in front of PHP is the only layer that stops the bootstrap running at all, and also the one that breaks anything per-visitor: logged-in views, carts, nonces.\n\nThe N+1 shape is the WordPress-specific trap. `WP_Query` primes the post, meta and term caches for its whole result set — one extra query each — so a loop calling `get_post_meta()` twenty times costs one query, not twenty. Break that priming with `'update_post_meta_cache' => false`, or fetch posts by hand with `$wpdb`, and the N+1 returns silently: the template code looks identical. Two cache rules follow. A transient can vanish before its expiry, so every read must be able to regenerate. And `wp_cache_get()` takes a `$found` reference because a cached value can legitimately be falsey — a cache that stores `0` and treats it as a miss costs you the lookup *and* the work.",
      level: "expert",
      estMinutes: 55,
      webRefs: [
        { label: "WordPress: Transients API", url: "https://developer.wordpress.org/apis/transients/", kind: "docs" },
        { label: "WordPress: Options API", url: "https://developer.wordpress.org/apis/options/", kind: "docs" },
        { label: "WordPress: WP_Object_Cache", url: "https://developer.wordpress.org/reference/classes/wp_object_cache/", kind: "docs" },
        { label: "WordPress VIP: Caching", url: "https://docs.wpvip.com/caching/", kind: "article" },
      ],
      video: {
        title: "Micah Wood: The WordPress Developer’s Guide to Caching",
        channel: "WordPress",
        url: "https://www.youtube.com/watch?v=XNJr8eVqvV8",
        videoId: "XNJr8eVqvV8",
        durationLabel: "53:51",
      },
      alternateVideos: [
        {
          title: "#19 How Does Caching Work In WordPress? | Transient Cache | WP_Object Cache Class | Persistent Cache",
          channel: "Imran Sayed - Codeytek Academy",
          url: "https://www.youtube.com/watch?v=VO4MozDqL90",
          videoId: "VO4MozDqL90",
          durationLabel: "6:37",
        },
        {
          title: "How To Fix A Slow WordPress Site - WordPress Speed Optimization Tutorial",
          channel: "WPCasts",
          url: "https://www.youtube.com/watch?v=zDix8THVpA8",
          videoId: "zDix8THVpA8",
          durationLabel: "35:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-caching-performance-q1",
          prompt: "By default, what is WordPress's object cache?",
          options: [
            "A plain in-memory array that lives for one request and is discarded at the end of it",
            "A Redis-backed store configured in `wp-config.php`",
            "A table in the database",
            "Files under `wp-content/cache/`",
          ],
          correctIndex: 0,
          explanation:
            "`WP_Object_Cache` is non-persistent unless a drop-in at `wp-content/object-cache.php` replaces it with Redis or Memcached. That single fact changes the behaviour of transients, `wp_cache_*` and every 'why is this still slow' investigation.",
        },
        {
          id: "wp-caching-performance-q2",
          prompt: "Where does `set_transient( 'acme_feed', $data, HOUR_IN_SECONDS )` store the value?",
          options: [
            "In `wp_options` as `_transient_acme_feed` plus a timeout row — unless a persistent object cache is installed, in which case it goes there and never touches the database",
            "Always in `wp_options`",
            "Always in the object cache",
            "In a dedicated transients table",
          ],
          correctIndex: 0,
          explanation:
            "Same API, two completely different performance profiles. Without a persistent object cache a heavily used transient is a database write on a read path; with one, the identical code never touches MySQL.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-caching-performance-q3",
          prompt: "Your code stores a computed report in a transient with a one-week expiry and reads it back with no fallback. What is wrong?",
          options: [
            "A transient can be evicted before its expiry, so every read must be able to regenerate the value",
            "Nothing — the expiry is a guarantee",
            "One week exceeds the maximum transient lifetime",
            "Transients cannot store arrays",
          ],
          correctIndex: 0,
          explanation:
            "With a persistent object cache the backend can evict under memory pressure; without one, a `wp_options` row can be removed by any cleanup plugin. A transient is a cache with an upper bound on staleness, never a store.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-caching-performance-q4",
          prompt: "A site is slow on every page, and `wp_options` contains a 4 MB autoloaded row. Why does that hurt so much?",
          options: [
            "Autoloaded options are fetched and unserialised in one query on every request, before WordPress knows which page was asked for",
            "Large options are excluded from the object cache",
            "MySQL cannot index rows that large, so the query becomes a full table scan",
            "It only affects admin requests",
          ],
          correctIndex: 0,
          explanation:
            "The cost is paid on the home page, on an AJAX call and on a cron ping alike. Since WordPress 6.6, `add_option()` and `update_option()` with `$autoload` set to `null` let core apply a size heuristic rather than trusting the caller.",
        },
        {
          id: "wp-caching-performance-q5",
          prompt: "Which of these reduce work on a cache-miss page view? (Select all that apply.)",
          options: [
            "A persistent object cache, so post, meta, term and option lookups survive between requests",
            "Reducing the autoloaded options payload",
            "Replacing a `meta_query`-driven archive filter with a taxonomy query",
            "Raising PHP's `memory_limit`",
            "Setting a longer nonce lifetime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three each remove queries or make them cheaper. More memory lets a slow page finish rather than making it fast, and nonce lifetime has nothing to do with performance.",
        },
        {
          id: "wp-caching-performance-q6",
          prompt: "What does a full-page cache in front of PHP buy you, and what does it break?",
          options: [
            "It serves HTML without running WordPress at all — and it must be bypassed for logged-in users, carts, nonces and anything else that varies per visitor",
            "It caches the database queries, so PHP still runs but faster",
            "It replaces the object cache",
            "It caches only static assets",
          ],
          correctIndex: 0,
          explanation:
            "It is by far the biggest win and by far the easiest thing to get subtly wrong: a cached page served to the wrong visitor is a data-leak class of bug, which is why the cookie-based bypass rules matter as much as the cache itself.",
        },
        {
          id: "wp-caching-performance-q7",
          prompt: "A loop over 50 posts calls `get_post_meta()` and `get_the_terms()` on each. Which change turns that into an N+1?",
          options: [
            "Running the query with `'update_post_meta_cache' => false` and `'update_post_term_cache' => false`",
            "Running the query with `'no_found_rows' => true`",
            "Using `the_post()` instead of a `foreach`",
            "Nothing — those functions always query per post",
          ],
          correctIndex: 0,
          explanation:
            "`WP_Query` primes both caches with one query each for the whole result set, so 50 posts cost two extra queries rather than a hundred. Disabling the priming — or fetching posts by hand — restores the N+1 silently, because the template code looks identical.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-caching-performance-q8",
          prompt: "You cache an expensive query with `wp_cache_set( $key, $value, 'acme' )`. What is the hard part?",
          options: [
            "Knowing every event that makes the value wrong and deleting the key there — WordPress gives you hooks, not automatic invalidation",
            "Choosing a group name, which must be registered in advance",
            "Serialising the value, which `wp_cache_set()` does not do",
            "Setting an expiry, which is mandatory",
          ],
          correctIndex: 0,
          explanation:
            "The usual patterns are to delete on the relevant `save_post` or `edited_term` hooks, or to embed a version number in the key and bump it. Group registration only matters for global groups on multisite.",
        },
        {
          id: "wp-caching-performance-q9",
          prompt: "What does an expiry of `0` mean in `set_transient()`?",
          options: [
            "No expiry — the transient persists until something deletes it or the cache evicts it",
            "Expire immediately, making the call a no-op",
            "Expire at the end of the request",
            "It is invalid and returns `false`",
          ],
          correctIndex: 0,
          explanation:
            "Zero means no timeout row is written. It is still a cache and can still disappear, so the same rule applies: always be able to regenerate.",
        },
        {
          id: "wp-caching-performance-q10",
          prompt: "What does PHP's OPcache do for a WordPress site, and what does it not do?",
          options: [
            "It caches compiled bytecode so files are not re-parsed — it does nothing about the queries or the work the code performs",
            "It caches the rendered output of each page",
            "It replaces the object cache",
            "It caches database query results between requests",
          ],
          correctIndex: 0,
          explanation:
            "Compilation is a real cost when a request includes several hundred files, so OPcache matters. It is orthogonal to the object cache and the page cache — a site can run all three, and each missing layer needs a different fix.",
        },
        {
          id: "wp-caching-performance-q11",
          prompt: "Why does `wp_cache_get()` take a `$found` reference parameter?",
          options: [
            "Because a cached value can legitimately be `false` or `0`, and without it you cannot tell a miss from a cached falsey value",
            "Because it reports whether the object cache is persistent",
            "Because it returns the number of keys in the group",
            "Because it signals a value that expired but is still present",
          ],
          correctIndex: 0,
          explanation:
            "The classic bug is caching a `0` or an empty array, reading it as falsey, and re-running the expensive work every request — a cache that never hits and costs you an extra lookup on top. Check `$found`, or store a sentinel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-caching-performance-q12",
          prompt: "A page feels slow. What actually tells you where the time goes?",
          options: [
            "Query Monitor, or `SAVEQUERIES` plus `$wpdb->queries`, to see each query, its caller and the hook timings",
            "The number of plugins installed",
            "The size of `wp_posts`",
            "The PageSpeed score, which reports server-side hook costs",
          ],
          correctIndex: 0,
          explanation:
            "`SAVEQUERIES` records every query with a backtrace, which is how you find the plugin behind four hundred meta lookups. Plugin count and table size are correlates at best, and PageSpeed measures the browser's experience, not PHP's.",
        },
      ],
    },
    {
      id: "wp-woocommerce",
      moduleId: "php-wordpress",
      trackId: "php",
      title: "WooCommerce at a Glance",
      summary:
        "WooCommerce is the largest thing you will ever customise inside WordPress, and it is assembled from the same primitives. A product is a `product` post in `wp_posts`, with categories and tags as taxonomies, attributes as taxonomies, and price and stock as post meta; variations are child posts of type `product_variation`. That is also why a large catalogue makes `wp_postmeta` the hottest table on the site.\n\nOrders were the same until they were not. High-Performance Order Storage moved them into dedicated `wc_orders`, `wc_order_addresses`, `wc_order_operational_data` and `wc_orders_meta` tables, because an order has a fixed, known shape and modelling it as EAV rows was costing busy shops real query time. HPOS has been the default for new installations since WooCommerce 8.2, with a compatibility mode that keeps the legacy rows in sync for stores mid-migration. The practical consequence for your code: use the CRUD objects (`wc_get_order()`, `$order->get_total()`, `$order->save()`) and never `get_post_meta()` on an order ID, or the code silently breaks the day synchronisation is switched off. Plugins that touch orders must declare HPOS compatibility on `before_woocommerce_init` or they show as incompatible.\n\nCustomisation has two paths with very different long-run costs. Copying a file from `woocommerce/templates/` into `your-theme/woocommerce/` works and is what most tutorials show — but it is a fork of one file that you own forever, and WooCommerce bumps a `@version` header in each template so Status → Templates can tell you your copy is stale. Hooks (`woocommerce_before_single_product`, `woocommerce_checkout_fields`, and several hundred more) survive updates. Override a template only when a hook genuinely cannot express the change, and write down why.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "WooCommerce: Getting Started with Development", url: "https://developer.woocommerce.com/docs/getting-started-with-woocommerce-development/", kind: "docs" },
        { label: "WooCommerce: High-Performance Order Storage", url: "https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/", kind: "docs" },
        { label: "WooCommerce: Classic Theme Developer Handbook", url: "https://developer.woocommerce.com/docs/theming/theme-development/classic-theme-developer-handbook/", kind: "docs" },
        { label: "WooCommerce: HPOS Database Schema", url: "https://developer.woocommerce.com/2022/09/15/high-performance-order-storage-database-schema/", kind: "article" },
      ],
      video: {
        title: "Joshua Michaels - Customizing WooCommerce the Right Way Using Action and Filter Hooks",
        channel: "Chicagoland WordPress Meetups",
        url: "https://www.youtube.com/watch?v=NdlYa0P_VlA",
        videoId: "NdlYa0P_VlA",
        durationLabel: "1:00:07",
      },
      alternateVideos: [
        {
          title: "Customizing WooCommerce with Confidence",
          channel: "WooCommerce",
          url: "https://www.youtube.com/watch?v=8ed8_bqcZW4",
          videoId: "8ed8_bqcZW4",
          startSeconds: 2304,
          chapterLabel: "WooCommerce Hooks",
          durationLabel: "1:10:12",
        },
        {
          title: "Clean-up your old WooCommerce database with HPOS",
          channel: "WordPress",
          url: "https://www.youtube.com/watch?v=O4cedT4sm2c",
          videoId: "O4cedT4sm2c",
          durationLabel: "22:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "wp-woocommerce-q1",
          prompt: "How is a WooCommerce product stored?",
          options: [
            "As a `product` post in `wp_posts`, with categories and attributes as taxonomies and price and stock as post meta",
            "In a dedicated products table",
            "As a taxonomy term with term meta",
            "In `wp_posts` with a fully normalised set of product columns",
          ],
          correctIndex: 0,
          explanation:
            "Products are ordinary WordPress content carrying a lot of meta, which is why a large catalogue makes `wp_postmeta` the hottest table on the site. Variations are child posts of type `product_variation`.",
        },
        {
          id: "wp-woocommerce-q2",
          prompt: "What changed with High-Performance Order Storage?",
          options: [
            "Orders moved out of `wp_posts`/`wp_postmeta` into dedicated `wc_orders`, `wc_order_addresses`, `wc_order_operational_data` and `wc_orders_meta` tables",
            "Orders moved into a separate database",
            "Order meta was compressed into a single JSON column on `wp_posts`",
            "Orders became terms in a custom taxonomy",
          ],
          correctIndex: 0,
          explanation:
            "An order has a known, fixed shape — status, totals, customer, addresses — and modelling it as EAV rows cost real query time on busy stores. HPOS has been the default for new installations since WooCommerce 8.2; older stores may still run the legacy tables or a synchronised compatibility mode.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-woocommerce-q3",
          prompt: "Legacy code reads an order total with `get_post_meta( $order_id, '_order_total', true )`. What happens on an HPOS store?",
          options: [
            "It returns nothing, because the order is not a post — use `wc_get_order( $order_id )` and `$order->get_total()`",
            "It works unchanged; WooCommerce shims the post meta functions",
            "It throws a fatal error",
            "It works, but only inside the admin",
          ],
          correctIndex: 0,
          explanation:
            "The CRUD objects exist precisely so the storage can change underneath you. Compatibility mode keeps the legacy rows in sync on stores that enable it, which is why this bug often hides until synchronisation is switched off.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "wp-woocommerce-q4",
          prompt: "Which are true of overriding a WooCommerce template by copying it into `your-theme/woocommerce/`? (Select all that apply.)",
          options: [
            "You now own that file and must reconcile it with every upstream change",
            "WooCommerce records a version in each template's header and flags outdated overrides under Status → Templates",
            "It is the right tool when a hook genuinely cannot express the change",
            "Overrides are merged with the upstream file, so you only include what you changed",
            "Overrides are updated automatically when WooCommerce updates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A template override is a fork of one whole file: permanent, and silent when upstream changes the markup around your edit. The version header is the only warning you get.",
        },
        {
          id: "wp-woocommerce-q5",
          prompt: "Why prefer `remove_action()` and `add_action()` on WooCommerce's hooks over a template override?",
          options: [
            "Hook-based changes keep working across updates, because you are not pinning a copy of markup that upstream will change",
            "Hooks run before the page cache, so they are faster",
            "Template overrides are deprecated and will stop working",
            "Only hooks can reach the `$product` object",
          ],
          correctIndex: 0,
          explanation:
            "WooCommerce exposes dense hook coverage — `woocommerce_before_single_product`, `woocommerce_after_shop_loop_item`, `woocommerce_checkout_fields` — for exactly this reason. Reach for an override only when the change is structural, and record why.",
        },
        {
          id: "wp-woocommerce-q6",
          prompt: "Status → Templates warns that one of your overrides is out of date. What does that mean?",
          options: [
            "Upstream changed that template and bumped its version, so your copy is missing whatever changed — you have to diff and merge it yourself",
            "The override is ignored until you update it",
            "WooCommerce will replace it automatically on the next update",
            "The template is no longer used by the current WooCommerce version",
          ],
          correctIndex: 0,
          explanation:
            "Nothing is replaced and nothing is ignored; you simply carry a stale fork. Every release that touches a template you own is maintenance work you agreed to when you copied it.",
        },
        {
          id: "wp-woocommerce-q7",
          prompt: "A client needs a 'lead time in days' value on every product, shown on the product page and filterable in the shop. Where does it belong?",
          options: [
            "Product meta for display, with the filterable part modelled as a taxonomy or a dedicated lookup if the shop must filter on it at scale",
            "A product attribute only, since attributes are the only supported custom data",
            "The order tables, so it travels with purchases",
            "A transient keyed by product ID",
          ],
          correctIndex: 0,
          explanation:
            "Display and filtering have different storage requirements — the same taxonomy-versus-meta decision as in plain WordPress. WooCommerce just makes the consequences expensive, because catalogue pages run on every visit.",
        },
        {
          id: "wp-woocommerce-q8",
          prompt: "Your plugin touches orders. What does WooCommerce expect you to declare?",
          options: [
            "HPOS compatibility, on `before_woocommerce_init` — undeclared plugins are shown as incompatible",
            "A minimum WooCommerce version in the plugin header, which is checked automatically",
            "Nothing: compatibility is detected by scanning your code",
            "A manifest file in the plugin root",
          ],
          correctIndex: 0,
          explanation:
            "The declaration is how a store admin knows whether it is safe to turn HPOS on. It is a promise you make about your code, not something WooCommerce can verify.",
        },
        {
          id: "wp-woocommerce-q9",
          prompt: "Where does a logged-out shopper's cart live?",
          options: [
            "In WooCommerce's own session store, keyed by a cookie — not in `wp_posts`",
            "In user meta against a guest user record",
            "In a transient keyed by IP address",
            "In the PHP session, via `session_start()`",
          ],
          correctIndex: 0,
          explanation:
            "WooCommerce runs its own session handler rather than PHP sessions, because PHP's file-based sessions serialise concurrent requests and do not survive a load-balanced setup. It is also why cart and checkout pages must bypass the page cache.",
        },
      ],
    },
  ],
} satisfies Module;
