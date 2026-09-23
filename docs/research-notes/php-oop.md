# PHP OOP research notes (2026-09-23)

Second camp of the v3 PHP & Laravel track, sitting between `php-foundations` (the language) and
`php-modern` (the 8.x feature tour). Scope decision: this camp owns the object model itself —
classes, visibility, construction, statics, inheritance, interfaces, traits, enums, magic methods,
cloning, and the composition/SOLID framing. `readonly` and enums live **here**, as OOP constructs,
rather than in `php-modern`, per the module brief. Namespaces, autoloading and PSR go to
`php-composer-psr`; exceptions and type juggling stayed in `php-foundations`.

Eleven topics, all `quiz`, 114 questions.

## Videos

**Program With Gio's "Full PHP 8 Tutorial" OOP series is the spine.** It is five years old (PHP 8.0
era) but it is the only free series that covers this camp at one-video-per-concept granularity, and
the core object model has not changed underneath it. Everything post-8.0 that the videos predate —
readonly, enums, 8.3 trait statics, 8.4 asymmetric visibility, 8.5 `clone` as a function — is
carried by the summaries and the quizzes instead, which is where the difficulty lives anyway.

All ids below confirmed with `yt.mjs info` (`embeddable: true`, titles as written):

- `php-oop-classes-objects` → **`6FW72q5fIx8`** "PHP Classes & Objects - Typed Properties -
  Constructors & Destructors" (Program With Gio, 21:14). Alternate: **`EX3qQqdm16I`** "PHP
  Fundamentals [FULL COURSE]" (Laravel, 1:14:03) at **1875s "Classes"** — the chapter
  `php-foundations` deliberately left unused. Full marker list re-read from the watch page: 0s Why
  PHP?, 101s Setup, 230s Variables & Types, 533s Arrays, 948s Functions, 1270s Loops, **1875s
  Classes**, 2615s Modern PHP, 3399s Composer, 3750s Your First PHP Application.
- `php-oop-visibility-encapsulation` → **`kA9BTNPFObo`** "PHP - Encapsulation & Abstraction" (15:22).
- `php-oop-constructors-promotion` → **`35QmeoPLPOQ`** "Data Transfer Objects - What Are DTOs"
  (13:03). Chosen over the dedicated 2–4 minute "constructor promotion" clips (all under 600 views)
  because promotion + readonly only make sense together, and the DTO framing is exactly how a
  Laravel developer meets them. Alternate: **`2cyJq08q6xE`** "Readonly classes in PHP 8.2"
  (PHP Annotated, 3:15) for the 8.2 half.
- `php-oop-static-late-binding` → **`6VVN-2SCx7Q`** "Static Properties & Methods In Object Oriented
  PHP" (12:58), with **`4W5t8g3Rp_0`** "What Is Late Static Binding & How It Works In PHP" (9:57) as
  the alternate. Deliberately two short videos rather than one: the learner needs statics before LSB
  makes sense, and 23 minutes total is still less than most single course chapters.
- `php-oop-inheritance-abstract` → **`LyyzeYOoH5s`** "PHP - Inheritance Explained - Is Inheritance
  Good?" (25:09), alternate **`UnwaW13xJuw`** "PHP Abstract Classes & Methods" (9:35).
- `php-oop-interfaces-polymorphism` → **`-AJic0FjuAA`** "PHP Interfaces & Polymorphism - Interfaces
  Explained" (18:02).
- `php-oop-traits` → **`PMruqUC4Qpc`** "PHP Traits - How They Work & Drawbacks" (31:40). The
  "drawbacks" half is why this one and not a shorter explainer.
- `php-oop-enums` → **`5Cgio2OfOYk`** "PHP Enums With Practical Examples" (28:13), alternate
  **`pS9FbYKbHVs`** "PHP Enums Explained: How to Use Enums in PHP 8.1+" (Dani Krossing, 14:17,
  published 3 months ago) — kept as the fresh, shorter option.
- `php-oop-magic-methods` → **`nCxnzj83poQ`** "What Are PHP Magic Methods & How They Work" (16:55).
- `php-oop-cloning` → **`vLmIoy6Bnog`** "PHP - Object Cloning & Clone Magic Method" (4:43), alternate
  **`HW4o1K2us2E`** "Cloning Readonly Classes in PHP 8.2" (PHP Annotated, 8:30). The primary is very
  short, which is why the alternate carries the modern half.
- `php-oop-composition-solid` → **`djd9zdlzyuA`** "Composition vs Inheritance in PHP With Practical
  Examples" (19:11), alternate **`kF7rQmSRlq0`** "SOLID Principles: Do You Really Understand Them?"
  (Alex Hyett, 7:04, 472k views) — language-agnostic but the sharpest short take on SOLID available.

No search-URL fallbacks. Nothing in this camp needed one.

Considered and rejected:

- **`l4_Vn-sTBL8`** (Dani Krossing, "PHP Full Course 2025", 9:46:42). Re-ran `info --chapters`: its
  29 markers go straight from constants and loops to MySQL, sessions and a login project. **There is
  no OOP chapter at all**, so despite being the other `php-foundations` spine it is unusable here.
- **`fw5ObX8P6as`** (Laracasts, "PHP For Beginners", 10:44:11). Chapter list read in full; it is a
  project build (router, PDO, sessions, middleware) with no chapter on classes, interfaces or
  traits. Its "Extract a Simple Validator Class" / "Make Your First Service Containers" chapters
  would suit a `php-web` or Laravel camp better.
- Gary Clarke's "Object Oriented PHP" series (`yhPl-y-shS8` et al.) — correct and modern, but the
  individual episodes run 2–6 minutes with a few hundred views each.
- **`1SujQeVK4MU`** (Gio, "Intro to Object Oriented Programming", 4:19) — pure motivation, no
  content to assess against.

## References

- **php.net manual pages used** (all 200): `language.oop5.basic`, `language.oop5.decon`,
  `language.oop5.properties`, `language.oop5.visibility`, `language.oop5.constants`,
  `language.oop5.static`, `language.oop5.late-static-bindings`, `function.get-called-class`,
  `language.oop5.inheritance`, `language.oop5.abstract`, `language.oop5.variance`, `class.override`,
  `language.oop5.interfaces`, `reserved.interfaces`, `language.operators.type`,
  `language.oop5.traits`, `language.enumerations`, `language.enumerations.backed`,
  `language.oop5.magic`, `language.oop5.overloading`, `class.stringable`, `language.oop5.cloning`,
  `language.oop5.object-comparison`.
- **wiki.php.net RFCs** used as `spec` refs (all 200, and notably the only reference domain in this
  camp that **does** allow iframe previews — no `X-Frame-Options`): `deprecate_dynamic_properties`,
  `asymmetric-visibility-v2`, `constructor_promotion`, `static_variable_inheritance`,
  `readonly_amendments`, `clone_with_v2`. `readonly_classes`, `property_hooks`, `enumerations`,
  `horizontalreuse` and `marking_overriden_methods` were also verified and used or read.
- **Iframe previews:** `php.net`, `php.watch`, `stitcher.io`, `laravel.com`, `refactoring.guru` all
  send `X-Frame-Options: SAMEORIGIN` and fall back to link cards. `wiki.php.net` and
  `phptherightway.com` preview inline.
- **Laravel docs redirect:** `laravel.com/docs/13.x/<page>` resolves to
  `laravel.com/framework/docs/13.x/<page>`. The final URL is what is shipped, per CONTENT_GUIDE §4.
  Pages used: `contracts`, `eloquent`, `eloquent-mutators`, `facades`, `container`.
- **404s found while searching for refs** (recorded so nobody re-tries them):
  `php.watch/versions/8.4/asymmetric-property-visibility`, `.../8.4/asymmetric-visibility`,
  `.../8.4/property-hooks`, `.../8.3/readonly-amendments`, `.../8.3/typed-class-constants`,
  `.../8.2/traits-constants`, `.../8.3/static-properties-in-traits`, `php.watch/articles/php-enum`,
  `php.net/manual/en/language.oop5.typehinting.php`,
  `matthiasnoback.nl/2022/08/my-rules-for-object-design/`. php.watch does not have a per-feature page
  for the 8.4 property features; the RFCs were used instead.
- **No interview-prep ref.** Same finding as `php-foundations`: there is no PHP equivalent of
  `lydiahallie/javascript-questions` worth shipping. The edge-case questions carry that weight.

## Facts verified

Every version-sensitive claim below was read off php.net or the relevant RFC on 2026-09-23, not
recalled. PHP 8.5 is current stable, 8.4 in active support.

**Classes and properties**
- A typed property with no default is *uninitialized*, not `null`: reading throws `Error`, `isset()`
  is `false`, `var_dump()` prints `uninitialized`. Typed properties are checked on **every write**,
  so weak mode coerces `'5'` to `5` and strict mode rejects it.
- **Dynamic properties deprecated in 8.2**, slated to be an `Error` in PHP 9.
  `#[\AllowDynamicProperties]` opts a class back in; a class declaring `__set()` never reaches the
  dynamic-property path.
- Calling a non-static method statically is an `Error` in PHP 8 (was `E_DEPRECATED` in PHP 7).
- Reading a property on `null` is a **warning** yielding `null`; calling a *method* on `null` is a
  fatal `Error`.
- Class constants: visibility since 7.1, `final` since 8.1, **types since 8.3**. `new` in
  initialisers (8.1) covers parameter defaults, static variables, global constants and attribute
  arguments — **not** class constants or property defaults.

**Visibility**
- `private` is scoped to the **class**, not the instance, so `Money::add(Money $other)` can read
  `$other->amount`.
- Private methods are not overridden: the docs' own `Bar`/`Foo` example prints `Bar::testPrivate`
  then `Foo::testPublic`. A child redeclaring a parent's private property gets a separate,
  name-mangled slot.
- Visibility may be relaxed on override, never restricted — **except constructors**, which may be
  restricted. Overriding a read-write property with a `readonly` one (or vice versa) is illegal.
- **Asymmetric visibility, 8.4**: only typed properties; set visibility must be the same or narrower
  than get; `private(set)` is implicitly `final`; no spaces inside `private(set)`; taking a reference
  to the property, or writing to an array element of it, follows the **set** visibility. **8.5**
  extends `set` visibility to static properties.

**Constructors, promotion, readonly**
- Parent constructors are **never** called implicitly, and `__construct()` is **exempt from
  signature compatibility rules** (stated verbatim in the manual).
- Promotion: any single modifier promotes, including `readonly` alone; promoted parameters may not
  be typed `callable`; attributes are copied to both property and parameter, defaults only to the
  parameter.
- `readonly` (8.1) requires a type, forbids a default, is unsupported on `static`, cannot be
  initialised by reference, and cannot be `unset()` once initialised (unsetting *before*
  initialisation is allowed from the declaring scope). **Interior mutability is explicitly allowed** —
  a readonly `ArrayObject` can still be pushed into, while a readonly `array` cannot.
- **Prior to 8.4 readonly was implicitly private-set; as of 8.4 it is implicitly `protected(set)`**,
  so child classes may initialise it.
- **`readonly class`, 8.2**: implicitly readonly instance properties, no dynamic properties
  (`#[\AllowDynamicProperties]` on one is a compile error), no untyped or static properties, and it
  may only extend / be extended by another readonly class.

**Statics and LSB**
- `self::` / `__CLASS__` resolve to the defining class; `static::` to the called class. `self::`,
  `parent::` and `static::` are **forwarding** calls that preserve the existing late static binding —
  `B::forward()` calling `self::name()` still sees `static::class === 'B'`.
- An inherited static property is **shared** unless the child redeclares it.
- **PHP 8.1** made a method's `static $i` shared with inheriting classes; before 8.1 each got its own
  (RFC `static_variable_inheritance` — `A,A,B` prints `1,2,3` now and `1,2,1` before).
- Static properties may be typed (7.4) but **never `readonly`**.

**Inheritance**
- Return types covariant, parameter types contravariant, both since 7.4. `abstract private` is a
  fatal error in a class (allowed in traits since 8.0). Abstract *properties* are 8.4.
- `#[\Override]` (8.3) is engine-enforced, not just a hint.
- Internal classes declare tentative return types since 8.1; omitting a return type when overriding
  one is a deprecation unless `#[\ReturnTypeWillChange]` is applied.

**Interfaces**
- All interface methods are implicitly public; interfaces may extend several interfaces; a class may
  implement several. Constructors in interfaces are legal but "strongly discouraged".
- **Interface constants could not be overridden prior to 8.1**; they can now.
- **Interface properties are 8.4** (`public string $name { get; }`), satisfiable by a plain public
  property, a get-hook virtual property, or — for a read-only requirement — a `readonly` property. A
  *settable* interface property may **not** be satisfied by a readonly one.
- Parameter names are not checked for compatibility, but named arguments make them API surface, so
  the manual recommends keeping them identical.
- `instanceof` never throws: non-object operands and non-existent class names both give `false`.
  Arbitrary parenthesised expressions on the right are 8.0.
- `Serializable` is deprecated since 8.1 in favour of `__serialize()`/`__unserialize()`.

**Traits**
- Precedence: **current class > trait > inherited**. Unresolved collisions between two traits are a
  fatal error; `insteadof` excludes, `as` aliases (and may re-scope), and aliasing an *excluded*
  method is legal (the manual's own `Aliased_Talker` example).
- A `static $c` inside a trait method is **per using class** (`C1` and `C2` both print 1).
- **PHP 8.3**: a child using the same trait as its parent gets a **distinct** static property —
  previously shared across the hierarchy. The manual's example prints `2` / `1` on 8.3.
- **PHP 8.5**: traits bind **before** the parent class, so a trait property or constant colliding
  with an inherited one now wins instead of raising a fatal error. Method resolution unchanged.
- Trait constants are **8.2**. Accessing a trait's statics directly on the trait is deprecated since
  8.1. `abstract private` in a trait is 8.0, and concrete implementations must be
  signature-compatible from 8.0.

**Enums**
- Pure vs backed; backing type `int` **or** `string` only, never a union, never `float`, never
  auto-assigned, and all values must be unique. Backing values may be constant expressions since 8.2.
- `cases()` comes from `UnitEnum` and exists on both kinds; `from()`/`tryFrom()` come from
  `BackedEnum`. `from()` throws `ValueError`, `tryFrom()` returns `null`. Both follow weak/strict
  typing rules — **under `strict_types` an `int` passed to a string-backed enum's `tryFrom()` is a
  `TypeError`**, and a `float` is a `TypeError` in both modes. Defining your own `cases()`,
  `from()` or `tryFrom()` is a fatal error.
- Forbidden: instance/static properties, constructors and destructors, inheritance, `clone`, `new`,
  `ReflectionClass::newInstanceWithoutConstructor()`. Allowed: methods, static methods, constants,
  interfaces, traits, attributes, and `__call`/`__callStatic`/`__invoke`.
- Cases are singletons, so `===` works and `<`/`>` always return `false`.
- **`json_encode()`**: a backed enum emits its scalar value; a **pure enum throws** unless it
  implements `JsonSerializable`. `serialize()` uses a dedicated `E` code that restores the singleton,
  so `unserialize(serialize($case)) === $case`.
- Enum cases are objects, so using one as an array key is an illegal-offset `TypeError`.

**Magic methods**
- `__get`/`__set`/`__isset`/`__unset` fire for **inaccessible or non-existent** properties only, work
  in object context only (declaring them `static` warns), must be public, and cannot take arguments
  by reference.
- **PHP will not re-enter the same overload method**, so `return $this->missing;` inside `__get()`
  returns `null` plus a warning rather than recursing. Different overload methods may chain.
- `isset()`/`empty()` route to `__isset()`, so a class defining only `__get()` reports `false` for
  data it can return. `unset($obj->declared)` removes the slot, after which reads take the magic path.
- `$obj->arr[] = x` through a non-reference `__get()` raises the "indirect modification of overloaded
  property" notice and discards the write.
- `__toString()`: may throw since 7.4; implicitly implements `Stringable` since 8.0; under
  `strict_types` a `Stringable` object is **not** accepted by a plain `string` type (needs
  `string|Stringable`).
- Since 8.0 magic method signatures are validated — a non-matching type declaration is a fatal error.

**Cloning**
- `clone` is a shallow copy; properties that are references stay references. `__clone()` runs on the
  **new** object **after** copying, and `__construct()` is not called.
- `==` on objects compares class + property values loosely; `===` is identity, so a clone is `==` but
  not `===`.
- **PHP 8.3**: readonly properties may be reinitialised inside `__clone()`. **PHP 8.4**: indirect
  modification (taking a reference) of a readonly property inside `__clone()` is no longer allowed.
- **PHP 8.5**: `clone` is also available as a **function** — `clone($obj, ['x' => 10])`. Overrides
  are applied **after** `__clone()`, honour property visibility, and may update readonly properties
  even when already set. (Note this is the function form, not a `clone … with` syntax.)
- `__sleep()`/`__wakeup()` are soft-deprecated as of 8.5 in favour of
  `__serialize()`/`__unserialize()`.

## Assessment shape

All eleven topics are **quiz** — the sandbox is a JS worker and cannot grade PHP, matching the
decision recorded in `php-foundations`. Difficulty is carried by predict-the-output questions on
real snippets: 114 questions, every topic with at least two `isEdgeCaseOrInterviewQuestion` and at
least one multi-select. Several questions deliberately pair with each other across topics (the
static-variable-in-an-inherited-method question in `php-oop-static-late-binding` versus the
static-variable-in-a-trait question in `php-oop-traits`; the readonly interior-mutability question
versus the readonly-array question) so the distinction has to be understood rather than memorised.
