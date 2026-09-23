import type { Module } from "@/types/curriculum";

export default {
  id: "php-oop",
  trackId: "php",
  name: "PHP OOP",
  description:
    "The object model a Laravel codebase is built on. Classes, visibility, inheritance, interfaces, traits, enums, magic methods and cloning — taught around the decisions and the gotchas that show up in real application code rather than in a shapes-and-animals tutorial.",
  refs: [
    { label: "PHP Manual: Classes and Objects", url: "https://www.php.net/manual/en/language.oop5.basic.php", kind: "docs" },
    { label: "PHP Manual: Enumerations", url: "https://www.php.net/manual/en/language.enumerations.php", kind: "docs" },
    { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
  ],
  topics: [
    {
      id: "php-oop-classes-objects",
      moduleId: "php-oop",
      trackId: "php",
      title: "Classes, Objects and Typed Properties",
      summary:
        "A class in PHP is compiled once into a class entry: a property table, a method table and a constant table. `new` allocates an object with slots for the declared properties and hands you a handle to it. Everything that feels dynamic about PHP objects — magic methods, dynamic properties, `__get()` — is a fallback path the engine takes when that static lookup misses, and it is measurably slower than the declared path.\n\nTyped properties, added in PHP 7.4, are what turned a PHP class from a bag of values into a schema the engine enforces. A typed property is checked on every write, not just at construction, which catches the bug where a nullable database column quietly makes `$user->age` a string three layers down. The price is a third state you did not have before: a typed property with no default is *uninitialized*, which is not `null`. Reading it throws an `Error`, `isset()` returns `false`, and `var_dump()` prints `uninitialized` — so a half-built object fails loudly at the point of the mistake instead of poisoning something later.\n\nThe modern posture is to declare everything. PHP 8.2 deprecated dynamic properties precisely because `$user->emial = ...` silently creating a new property was a typo detector that never fired. Declare your properties, type them, and let the deprecation — an `Error` in PHP 9 — do work a static analyser used to have to do alone.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: The Basics of classes and objects", url: "https://www.php.net/manual/en/language.oop5.basic.php", kind: "docs" },
        { label: "PHP Manual: Constructors and Destructors", url: "https://www.php.net/manual/en/language.oop5.decon.php", kind: "docs" },
        { label: "PHP RFC: Deprecate dynamic properties", url: "https://wiki.php.net/rfc/deprecate_dynamic_properties", kind: "spec" },
        { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
      ],
      video: {
        title: "PHP Classes & Objects - Typed Properties - Constructors & Destructors - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=6FW72q5fIx8",
        videoId: "6FW72q5fIx8",
        durationLabel: "21:14",
      },
      alternateVideos: [
        {
          title: "PHP Fundamentals [FULL COURSE]",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=EX3qQqdm16I",
          videoId: "EX3qQqdm16I",
          startSeconds: 1875,
          chapterLabel: "Classes",
          durationLabel: "1:14:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-classes-objects-q1",
          prompt: "What happens here?\n\n```php\nclass User { public string $name; }\n$u = new User();\necho $u->name;\n```",
          options: [
            "An `Error`: the typed property must not be accessed before initialization",
            "It prints an empty string",
            "It prints nothing and raises an \"undefined property\" warning",
            "A `TypeError` is thrown when the object is constructed",
          ],
          correctIndex: 0,
          explanation:
            "A typed property with no default is *uninitialized*, a distinct state from `null`, so reading it throws an `Error`. It is not an \"undefined property\" warning, because the engine knows the property exists — it simply has no value yet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-classes-objects-q2",
          prompt: "Which are true of `public string $name;` on a freshly constructed object, before anything assigns to it? (Select all that apply.)",
          options: [
            "Reading it throws an `Error`",
            "`isset($u->name)` returns `false`",
            "`var_dump($u)` shows the property as `uninitialized`",
            "It holds `null` until something assigns to it",
            "`$u->name = null;` is a valid way to initialise it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Uninitialized is its own state: no value, so reading throws and `isset()` is false. It is not `null`, and assigning `null` to a non-nullable `string` property is a `TypeError` — that would need `?string`.",
        },
        {
          id: "php-oop-classes-objects-q3",
          prompt: "On PHP 8.2 and later, what does this do?\n\n```php\nclass Point { public int $x = 0; }\n$p = new Point();\n$p->y = 5;\n```",
          options: [
            "Raises a deprecation notice and still creates the property",
            "Throws an `Error` immediately",
            "Nothing unusual — dynamic properties are ordinary PHP",
            "Throws a `TypeError` because `y` has no declared type",
          ],
          correctIndex: 0,
          explanation:
            "Dynamic properties were deprecated in 8.2 and are slated to become an `Error` in PHP 9. `#[\\AllowDynamicProperties]` opts a class back in, and a class that declares `__set()` never reaches this path because the write goes to the magic method instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-classes-objects-q4",
          prompt: "`$obj` is an instance of `Admin`, which extends `User`. Which of these evaluate to `\"Admin\"`? (Select all that apply.)",
          options: [
            "`$obj::class`",
            "`get_class($obj)`",
            "`static::class` inside a method that `Admin` inherited from `User`",
            "`self::class` inside a method that `Admin` inherited from `User`",
            "`$obj->class`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`$obj::class` (PHP 8.0) and `get_class()` both report the runtime class, and `static::` is late-bound to it. `self::` resolves to the class the method was written in — `User` — and `$obj->class` is just a property read.",
        },
        {
          id: "php-oop-classes-objects-q5",
          prompt: "What does this do on PHP 8?\n\n```php\nclass A { public function hello(): string { return 'hi'; } }\necho A::hello();\n```",
          options: [
            "Throws `Error: Non-static method A::hello() cannot be called statically`",
            "Prints `hi` with a deprecation notice",
            "Prints `hi` with no diagnostic",
            "Throws a `TypeError`",
          ],
          correctIndex: 0,
          explanation:
            "Calling a non-static method statically was deprecated in PHP 7 and became an `Error` in PHP 8. There is no `$this` to bind, so there is nothing sensible the engine could do with the call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-classes-objects-q6",
          prompt: "Without `strict_types`, what does `$c->n` hold after this runs?\n\n```php\nclass C { public int $n = 0; }\n$c = new C();\n$c->n = '5';\n```",
          options: ["`int(5)`", "`string(1) \"5\"`", "Nothing — it throws a `TypeError`", "`int(0)`, because the write is ignored"],
          correctIndex: 0,
          explanation:
            "Typed properties are checked on every write. In weak mode a numeric string is coerced to `int`, so the property holds `5`. `'abc'` would throw a `TypeError`, and under `declare(strict_types=1)` so would `'5'`.",
        },
        {
          id: "php-oop-classes-objects-q7",
          prompt: "When does `__destruct()` run?",
          options: [
            "When the last reference to the object goes away, or at the end of the request if it never does",
            "Immediately after the constructor returns",
            "Only when `unset()` is called on the object",
            "On a fixed schedule, whenever the cycle collector runs",
          ],
          correctIndex: 0,
          explanation:
            "PHP is refcounted, so destruction is deterministic in the common case; the cycle collector only matters for objects that reference each other. That is why releasing a connection in a destructor can behave unpredictably at shutdown if a cycle is involved.",
        },
        {
          id: "php-oop-classes-objects-q8",
          prompt: "Which are true of class constants in current PHP? (Select all that apply.)",
          options: [
            "They can carry a visibility modifier such as `private const`, since PHP 7.1",
            "They can be typed, e.g. `const string STATUS = 'draft';`, since PHP 8.3",
            "They can be declared `final`, since PHP 8.1",
            "They can hold an object instance, e.g. `const LOG = new NullLogger();`",
            "They are read with `->`, like properties",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Visibility (7.1), `final` (8.1) and types (8.3) all landed. `new` in initialisers (8.1) covers parameter defaults, static variables and attribute arguments — not class constants or property defaults. Constants are read with `::`.",
        },
        {
          id: "php-oop-classes-objects-q9",
          prompt: "`$user->profile` is `null`. What is the difference between evaluating `$user->profile->name` and `$user->profile->getName()`?",
          options: [
            "The property read raises a warning and evaluates to `null`; the method call throws an `Error`",
            "Both throw an `Error`",
            "Both evaluate to `null` with a warning",
            "The property read throws; the method call returns `null`",
          ],
          correctIndex: 0,
          explanation:
            "Reading a property on `null` is \"Attempt to read property … on null\", a warning that yields `null`. Calling a method on `null` is a fatal `Error`, because there is no object to dispatch on. The `?->` operator short-circuits both.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "php-oop-visibility-encapsulation",
      moduleId: "php-oop",
      trackId: "php",
      title: "Visibility, Encapsulation and Asymmetric Visibility",
      summary:
        "Visibility in PHP is enforced per *class*, not per object. Two instances of the same class can read each other's `private` members, which is what makes `Money::add(Money $other)` possible without accessors and what surprises people coming from languages with instance-level privacy. `protected` widens that to the inheritance chain, and `private` in a parent is genuinely invisible to a child — to the point that a child redeclaring the same name gets a separate property under a different internal name, while the parent's methods keep seeing their own.\n\nThe common failure is treating encapsulation as a naming exercise. A private property wrapped in a no-logic `getX()`/`setX()` pair is a public property with extra steps; it protects nothing, because any caller can still push the object into an invalid state. Real encapsulation is about invariants: a `Money` that cannot go negative, an `Order` that cannot ship before it is paid. Visibility is how you defend those rules, not a style rule to apply uniformly.\n\nPHP 8.4 split the keyword in two. `public private(set) string $title` is publicly readable and writable only inside the class, which removes most of the getter boilerplate that existed purely to make a property read-only. The caveats matter: only typed properties can use it, the set visibility may never be wider than the get visibility, `private(set)` makes the property implicitly `final`, and taking a reference to the property — or appending to it when it holds an array — follows the *set* visibility, because both involve a write.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Visibility", url: "https://www.php.net/manual/en/language.oop5.visibility.php", kind: "docs" },
        { label: "PHP Manual: Class Constants", url: "https://www.php.net/manual/en/language.oop5.constants.php", kind: "docs" },
        { label: "PHP RFC: Asymmetric Visibility v2", url: "https://wiki.php.net/rfc/asymmetric-visibility-v2", kind: "spec" },
        { label: "stitcher.io: What's new in PHP 8.4", url: "https://stitcher.io/blog/new-in-php-84", kind: "article" },
      ],
      video: {
        title: "PHP - Encapsulation & Abstraction -  Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=kA9BTNPFObo",
        videoId: "kA9BTNPFObo",
        durationLabel: "15:22",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-visibility-encapsulation-q1",
          prompt:
            "Does `$other->amount` compile here?\n\n```php\nfinal class Money {\n    public function __construct(private int $amount) {}\n\n    public function add(Money $other): Money {\n        return new Money($this->amount + $other->amount);\n    }\n}\n```",
          options: [
            "Yes — `private` is scoped to the class, so any `Money` can read another `Money`'s private members",
            "No — `private` means private to this particular object",
            "Only if `amount` is declared `protected`",
            "Only inside a `static` method of `Money`",
          ],
          correctIndex: 0,
          explanation:
            "PHP checks visibility against the calling *scope*, which is the class. That is why value objects can implement arithmetic and equality without exposing accessors. A language with per-instance privacy would reject this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-visibility-encapsulation-q2",
          prompt:
            "What does this print?\n\n```php\nclass Bar {\n    public function test() { $this->testPrivate(); $this->testPublic(); }\n    public function testPublic() { echo 'Bar::public '; }\n    private function testPrivate() { echo 'Bar::private '; }\n}\nclass Foo extends Bar {\n    public function testPublic() { echo 'Foo::public '; }\n    private function testPrivate() { echo 'Foo::private '; }\n}\n(new Foo)->test();\n```",
          options: [
            "`Bar::private Foo::public`",
            "`Foo::private Foo::public`",
            "`Bar::private Bar::public`",
            "A fatal error about redeclaring a private method",
          ],
          correctIndex: 0,
          explanation:
            "Private methods are not part of the inheritance contract: `Bar::test()` resolves `testPrivate()` in its own scope and never sees `Foo`'s. The public method does dispatch on the runtime class, which is why the two halves of the line disagree.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-visibility-encapsulation-q3",
          prompt: "A parent declares `public function save(): void`. The child declares `protected function save(): void`. What happens?",
          options: [
            "A fatal error: the access level cannot be made more restrictive",
            "It works, and `save()` is protected on the child",
            "A deprecation notice, and the method behaves as public",
            "It works, but only code inside the child can call it",
          ],
          correctIndex: 0,
          explanation:
            "Visibility may be relaxed on override, never tightened — otherwise a variable typed as the parent could hold a child whose contract is narrower. Constructors are the documented exception: a public constructor may be made private in a child.",
        },
        {
          id: "php-oop-visibility-encapsulation-q4",
          prompt:
            "Given PHP 8.4's `class Book { public function __construct(public private(set) string $title) {} }`, which are true? (Select all that apply.)",
          options: [
            "`echo $book->title;` works from anywhere",
            "Assigning to `$book->title` from outside the class is a fatal error",
            "The property is implicitly `final` and may not be redeclared in a child class",
            "The set visibility may be wider than the get visibility, e.g. `protected public(set)`",
            "Untyped properties may also use asymmetric visibility",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Asymmetric visibility requires a type, the set scope must be the same or narrower than the get scope (`protected public(set)` is a syntax error), and `private(set)` implies `final`. Reading stays public throughout.",
        },
        {
          id: "php-oop-visibility-encapsulation-q5",
          prompt:
            "A property is declared `public protected(set) array $tags;`. From outside the class, what does `$obj->tags[] = 'php';` do?",
          options: [
            "Fatal error — appending to an array property needs set access, not just get access",
            "Appends, because the array is read first and then written back",
            "Silently does nothing",
            "Appends, but raises a notice",
          ],
          correctIndex: 0,
          explanation:
            "Writing to an array element is internally a get followed by a set, so PHP applies the stricter of the two visibilities. Taking a reference to the property follows the set visibility for the same reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-visibility-encapsulation-q6",
          prompt: "Which statement about class constant visibility is correct?",
          options: [
            "Since PHP 7.1 a class constant can be declared `private` or `protected`",
            "Class constants are always public and cannot be restricted",
            "Visibility on constants is allowed only inside interfaces",
            "Visibility on constants affects static analysers but not the runtime",
          ],
          correctIndex: 0,
          explanation:
            "`private const` is enforced at runtime like any other member. Interfaces are the opposite case: their constants must be public, because the point of an interface is that implementers and callers can see them.",
        },
        {
          id: "php-oop-visibility-encapsulation-q7",
          prompt:
            "What does this print?\n\n```php\nclass A {\n    private $v = 'A';\n    public function get() { return $this->v; }\n}\nclass B extends A {\n    private $v = 'B';\n}\necho (new B)->get();\n```",
          options: ["`A`", "`B`", "`null`, with a warning", "A fatal error about redeclaring a private property"],
          correctIndex: 0,
          explanation:
            "A private property is stored under a name mangled with its declaring class, so `B::$v` is a genuinely different slot. `A::get()` runs in `A`'s scope and reads `A`'s copy. This is one of the more expensive surprises in deep hierarchies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-visibility-encapsulation-q8",
          prompt: "A class has a private property plus a getter and setter that contain no logic at all. What has that bought you?",
          options: [
            "Almost nothing — the property is still effectively public, with more code and an extra call",
            "Type safety that a public typed property would not provide",
            "Protection from other instances of the same class reading it",
            "The ability to change the property's type without touching callers",
          ],
          correctIndex: 0,
          explanation:
            "Encapsulation is about protecting invariants, not about the shape of the accessors. A typed public property already enforces the type, and since 8.4 `public private(set)` expresses \"read anywhere, write here\" with no getter at all.",
        },
        {
          id: "php-oop-visibility-encapsulation-q9",
          prompt: "From where can a `protected` member be accessed?",
          options: [
            "The declaring class, its subclasses, and its parent classes",
            "Only the declaring class",
            "Anywhere within the same namespace",
            "Anywhere within the same file",
          ],
          correctIndex: 0,
          explanation:
            "`protected` follows the inheritance chain in both directions, which is why a parent method can touch a member a child declared. Namespaces and files have no bearing on visibility in PHP.",
        },
        {
          id: "php-oop-visibility-encapsulation-q10",
          prompt: "Which of these does PHP allow when a child class redeclares an inherited member? (Select all that apply.)",
          options: [
            "Widening a `protected` method to `public`",
            "Making an inherited `public` constructor `private`",
            "Widening a `protected(set)` property to `public(set)`, when it is not final",
            "Narrowing a `public` property to `protected`",
            "Overriding a read-write property with a `readonly` one",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Visibility may be widened, never narrowed — except for constructors, which may be restricted (the usual trick for forcing a static factory). Swapping a read-write property for a `readonly` one, or the reverse, is explicitly illegal.",
        },
      ],
    },

    {
      id: "php-oop-constructors-promotion",
      moduleId: "php-oop",
      trackId: "php",
      title: "Constructors, Property Promotion and readonly",
      summary:
        "Constructor property promotion (PHP 8.0) collapsed the three-line ceremony of declare, parameter, assign into one. It is more than sugar: because the promoted parameter and the property share a name, the parameter name becomes part of the public API the moment anyone uses named arguments, so renaming it is a breaking change for a published package.\n\n`readonly` (8.1) makes a typed property writable exactly once, and the combination `public function __construct(public readonly string $id)` is the canonical PHP value object or DTO. It must be typed, it may not have a default (that would just be a constant), it cannot be `static`, and it cannot be initialised by reference. Before PHP 8.4 a readonly property could only be written from the declaring class; as of 8.4 it is implicitly `protected(set)`, so a child class can initialise it too. PHP 8.2 added `readonly class`, which makes every declared property readonly and bans dynamic properties outright.\n\nThe gotcha everyone hits once is that `readonly` is shallow. It freezes the *binding*, not the graph: `$order->lines` cannot be reassigned, but if it holds an `ArrayObject` you can still push into it, because that is a method call on a different object. If the property holds a plain `array`, `$order->lines[] = $x` is an `Error`, because that really is a property write. Two properties that look equally immutable behave differently depending on what is behind them — which is why genuinely immutable objects hold only scalars, other immutable objects, or defensively copied arrays.\n\nConstructors also sit outside PHP's usual inheritance rules: `__construct()` is exempt from signature compatibility checks, so a child may take completely different arguments. Convenient for dependency injection, dangerous for any base-class factory that does `new static(...)`.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Properties (readonly)", url: "https://www.php.net/manual/en/language.oop5.properties.php", kind: "docs" },
        { label: "PHP RFC: Constructor Property Promotion", url: "https://wiki.php.net/rfc/constructor_promotion", kind: "spec" },
        { label: "PHP Watch: readonly properties (8.1)", url: "https://php.watch/versions/8.1/readonly", kind: "article" },
        { label: "PHP Watch: readonly classes (8.2)", url: "https://php.watch/versions/8.2/readonly-classes", kind: "article" },
      ],
      video: {
        title: "Data Transfer Objects - What Are DTOs - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=35QmeoPLPOQ",
        videoId: "35QmeoPLPOQ",
        durationLabel: "13:03",
      },
      alternateVideos: [
        {
          title: "Readonly classes in PHP 8.2",
          channel: "PHP Annotated",
          url: "https://www.youtube.com/watch?v=2cyJq08q6xE",
          videoId: "2cyJq08q6xE",
          durationLabel: "3:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-constructors-promotion-q1",
          prompt:
            "Is `Model::__construct()` executed by `new User('a@b.c')`?\n\n```php\nclass Model {\n    public function __construct() { $this->boot(); }\n    protected function boot(): void {}\n}\nclass User extends Model {\n    public function __construct(private string $email) {}\n}\n```",
          options: [
            "No — a child constructor must call `parent::__construct()` explicitly",
            "Yes, immediately before the child's body runs",
            "Yes, immediately after the child's body runs",
            "Only when the parent constructor has no required parameters",
          ],
          correctIndex: 0,
          explanation:
            "PHP never chains constructors implicitly. If the child does not define one at all it inherits the parent's; the moment it defines one, the parent's setup is skipped unless you call it. A silently un-booted base class is a classic bug in framework subclasses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-constructors-promotion-q2",
          prompt:
            "A parent declares `__construct(string $name)`. The child declares `__construct(int $id, LoggerInterface $log)`. What does PHP say?",
          options: [
            "Nothing — `__construct()` is exempt from the usual signature compatibility rules",
            "A fatal error about an incompatible declaration",
            "A deprecation notice",
            "It is an error only if the parent constructor is `final`",
          ],
          correctIndex: 0,
          explanation:
            "The manual states the exemption explicitly. It is what makes constructor injection painless across a hierarchy — and what makes a base-class `new static(...)` factory fragile, because a subclass may need entirely different arguments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-constructors-promotion-q3",
          prompt: "Which of these promote a constructor parameter into a property? (Select all that apply.)",
          options: [
            "`public function __construct(private string $a) {}`",
            "`public function __construct(readonly string $a) {}`",
            "`public function __construct(protected int $a = 0) {}`",
            "`public function __construct(string $a) {}`",
            "`public function __construct(private callable $a) {}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Any single modifier triggers promotion, including `readonly` on its own. A bare typed parameter is just a parameter, and `callable` is not a legal property type, so the last one is a fatal error rather than a promotion.",
        },
        {
          id: "php-oop-constructors-promotion-q4",
          prompt: "Which are true of `readonly` properties? (Select all that apply.)",
          options: [
            "They must have a type declaration, though `mixed` counts",
            "They may not declare a default value",
            "`static readonly` properties are not supported",
            "They can be assigned once from any scope",
            "They may be initialised by reference, e.g. `preg_match($re, $s, $this->matches)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A readonly property with a default would just be a constant, and readonly statics are not implemented. Initialisation must be a direct assignment from an allowed scope — by-reference initialisation throws \"Cannot indirectly modify readonly property\".",
        },
        {
          id: "php-oop-constructors-promotion-q5",
          prompt:
            "What happens on each of the last two lines?\n\n```php\nfinal class Order {\n    public function __construct(public readonly ArrayObject $lines) {}\n}\n$o = new Order(new ArrayObject());\n$o->lines[] = 'item';\n$o->lines = new ArrayObject();\n```",
          options: [
            "The first works; the second throws `Error: Cannot modify readonly property`",
            "Both throw",
            "Both work",
            "The first throws; the second works",
          ],
          correctIndex: 0,
          explanation:
            "`readonly` freezes the reference, not the object behind it — interior mutability is explicitly allowed. `$o->lines[] =` on an `ArrayObject` is `offsetSet()`, a method call. Had the property been a plain `array`, that same line *would* be a property write and would throw.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-constructors-promotion-q6",
          prompt: "Before PHP 8.4 a `readonly` property could be initialised only from the class that declared it. What changed in 8.4?",
          options: [
            "readonly properties are implicitly `protected(set)`, so a child class may initialise them",
            "readonly properties became writable once from any scope",
            "`readonly` was superseded by `private(set)`",
            "Nothing — the rule is unchanged",
          ],
          correctIndex: 0,
          explanation:
            "8.4 relaxed the implicit set scope from private to protected, which finally makes readonly usable in an abstract base class whose children populate the values. You can still tighten it back with an explicit `private(set)`.",
        },
        {
          id: "php-oop-constructors-promotion-q7",
          prompt:
            "What does the last line do?\n\n```php\nclass T {\n    public function __construct(public readonly array $ary = []) {}\n}\n$t = new T();\n$t->ary[] = 1;\n```",
          options: [
            "Throws `Error: Cannot modify readonly property`",
            "Appends `1` to the array",
            "Silently does nothing",
            "Raises a deprecation notice and appends",
          ],
          correctIndex: 0,
          explanation:
            "Arrays are values in PHP, so appending is a write to the property itself. The same is true of `$t->ary[0][] = 1`, `unset($t->ary[0])` and `$t->i++` on a readonly int.",
        },
        {
          id: "php-oop-constructors-promotion-q8",
          prompt: "What does `readonly class Dto { … }` (PHP 8.2) mean?",
          options: [
            "Every declared property is implicitly readonly, untyped properties are forbidden, and dynamic properties are not allowed",
            "The class cannot be extended",
            "Every method becomes `final`",
            "Instances of it cannot be cloned",
          ],
          correctIndex: 0,
          explanation:
            "It is a shorthand for marking each property readonly, plus a ban on untyped and dynamic properties (so `#[\\AllowDynamicProperties]` on one is a compile error). It can still be extended — but only by another readonly class.",
        },
        {
          id: "php-oop-constructors-promotion-q9",
          prompt: "Can you `unset()` a readonly property?",
          options: [
            "Only before it has been initialised, and only from a scope allowed to write it",
            "Yes, at any time",
            "Never, under any circumstances",
            "Only from inside `__destruct()`",
          ],
          correctIndex: 0,
          explanation:
            "Unsetting an initialised readonly property throws. Unsetting it beforehand is allowed and is occasionally used to force lazy initialisation through `__get()` — a trick Doctrine-style proxies rely on.",
        },
        {
          id: "php-oop-constructors-promotion-q10",
          prompt: "Which of these is legal as of PHP 8.1?",
          options: [
            "A parameter default: `function __construct(private Logger $log = new NullLogger()) {}`",
            "A class constant: `const LOG = new NullLogger();`",
            "A property default: `private Logger $log = new NullLogger();`",
            "An interface constant: `const LOG = new NullLogger();`",
          ],
          correctIndex: 0,
          explanation:
            "\"New in initializers\" covers parameter defaults, static variables, global constants and attribute arguments — not class or interface constants and not property defaults, where evaluation order would be undefined. The default is evaluated per call, not once.",
        },
        {
          id: "php-oop-constructors-promotion-q11",
          prompt: "Why is renaming a promoted constructor parameter a breaking change for a published package?",
          options: [
            "Callers may be passing it by name, and the promoted property takes the parameter's name too",
            "It changes the class hash Composer's autoloader uses",
            "Opcache stores parameter names and mismatches throw at runtime",
            "It only breaks when the class is declared `final`",
          ],
          correctIndex: 0,
          explanation:
            "Named arguments made every public parameter name part of the API surface, and promotion ties the property name to it. Libraries that want to opt out document `@no-named-arguments`.",
        },
      ],
    },

    {
      id: "php-oop-static-late-binding",
      moduleId: "php-oop",
      trackId: "php",
      title: "Static Members and Late Static Binding",
      summary:
        "`self::` is resolved when the file is compiled, against the class the code is physically written in. `static::` is resolved at runtime, against the class the call actually started from. That single distinction is late static binding, and it is the machinery behind every `Model::query()`, `Model::create()` and `new static()` factory in Laravel: a base class can build instances of whichever subclass was called without knowing any of their names.\n\nThe binding is stored per call and *forwarded*. `self::`, `parent::` and `static::` are forwarding calls: they preserve whatever class the outer call established, so `B::forward()` calling `self::name()` still sees `static::class === 'B'`. Only a non-forwarding call such as `A::name()` resets it. Getting this wrong produces a factory that silently returns the base class in production and the right class in the one test that called it directly.\n\nStatic state is where this gets expensive. A static property declared in a parent and not redeclared in a child is *one* slot shared by both, so `Child::$count++` increments the parent's counter. Since PHP 8.1, a `static $i` variable inside an inherited method is shared with the inheriting class too — before 8.1 each got its own. Both are fine as long as you meant them.\n\nThe wider tradeoff is testability. A static method cannot be injected, doubled or swapped, so every caller is welded to that one implementation and any state it holds leaks between tests in the same process. Laravel's facades look static precisely so they do not have to be: `Cache::get()` resolves an instance out of the container, which is what makes `Cache::fake()` possible. A genuinely static helper offers no such escape hatch.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Late Static Bindings", url: "https://www.php.net/manual/en/language.oop5.late-static-bindings.php", kind: "docs" },
        { label: "PHP Manual: The static keyword", url: "https://www.php.net/manual/en/language.oop5.static.php", kind: "docs" },
        { label: "PHP RFC: Static variables in inherited methods", url: "https://wiki.php.net/rfc/static_variable_inheritance", kind: "spec" },
        { label: "PHP Manual: get_called_class()", url: "https://www.php.net/manual/en/function.get-called-class.php", kind: "docs" },
      ],
      video: {
        title: "Static Properties & Methods In Object Oriented PHP -  Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=6VVN-2SCx7Q",
        videoId: "6VVN-2SCx7Q",
        durationLabel: "12:58",
      },
      alternateVideos: [
        {
          title: "What Is Late Static Binding & How It Works In PHP - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=4W5t8g3Rp_0",
          videoId: "4W5t8g3Rp_0",
          durationLabel: "9:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-static-late-binding-q1",
          prompt:
            "What does this print?\n\n```php\nclass A {\n    public static function who() { echo __CLASS__; }\n    public static function test() { self::who(); }\n}\nclass B extends A {\n    public static function who() { echo __CLASS__; }\n}\nB::test();\n```",
          options: ["`A`", "`B`", "`AB`", "A fatal error"],
          correctIndex: 0,
          explanation:
            "`self::who()` is resolved at compile time against the class `test()` is written in, so it calls `A::who()`. Changing it to `static::who()` prints `B` — that is the entire point of late static binding.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-static-late-binding-q2",
          prompt:
            "What does this print?\n\n```php\nclass Counter { public static int $n = 0; }\nclass SubCounter extends Counter {}\nCounter::$n++;\nSubCounter::$n++;\necho Counter::$n;\n```",
          options: ["`2`", "`1`", "`0`", "A fatal error"],
          correctIndex: 0,
          explanation:
            "A child that does not redeclare a static property shares the parent's single storage slot, so both increments land on the same counter. Redeclaring `public static int $n = 0;` in the child would give it its own.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-static-late-binding-q3",
          prompt:
            "On PHP 8.1 and later, what does this print?\n\n```php\nclass A {\n    public static function counter(): int { static $i = 0; return ++$i; }\n}\nclass B extends A {}\necho A::counter(), A::counter(), B::counter();\n```",
          options: ["`123`", "`121`", "`111`", "`122`"],
          correctIndex: 0,
          explanation:
            "PHP 8.1 made a method's `static` variable shared with every class that inherits the method, matching how static properties already behaved. On PHP 8.0 and earlier the inherited copy had its own `$i`, so it printed `121`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-static-late-binding-q4",
          prompt:
            "What do `User::make()` and `User::makeSelf()` return?\n\n```php\nclass Model {\n    public static function make(): static { return new static(); }\n    public static function makeSelf(): self { return new self(); }\n}\nclass User extends Model {}\n```",
          options: ["A `User` and a `Model`", "Two `User` instances", "Two `Model` instances", "A `Model` and a `User`"],
          correctIndex: 0,
          explanation:
            "`new static()` uses the late-bound called class; `new self()` is fixed to the class the code lives in. Every framework base model uses the former, which is why `User::create()` gives you a `User` and not the base class.",
        },
        {
          id: "php-oop-static-late-binding-q5",
          prompt: "What does a `static` return type declare?",
          options: [
            "That the method returns an instance of the class it was called on",
            "That the method itself is static",
            "That the method returns the class name as a string",
            "That the method returns a shared singleton",
          ],
          correctIndex: 0,
          explanation:
            "`static` as a return type arrived in PHP 8.0 and is the late-bound \"this type\". It is what lets a fluent base class declare `withX(): static` and have subclasses keep their own type through the chain.",
        },
        {
          id: "php-oop-static-late-binding-q6",
          prompt:
            "What does this print?\n\n```php\nclass A {\n    public static function name(): string { return static::class; }\n    public static function forward(): string { return self::name(); }\n}\nclass B extends A {}\necho B::forward();\n```",
          options: ["`B`", "`A`", "A fatal error", "An empty string"],
          correctIndex: 0,
          explanation:
            "`self::` is a *forwarding* call: it preserves the late static binding that `B::forward()` established. Only a non-forwarding call like `A::name()` would reset the binding to `A`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-static-late-binding-q7",
          prompt: "Which of these are affected by late static binding? (Select all that apply.)",
          options: [
            "`static::` inside a method",
            "`new static()`",
            "The `static` return type",
            "`self::`",
            "`parent::`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only the `static` keyword is late-bound. `self::` and `parent::` resolve against the defining class at compile time — they forward the existing binding for any nested `static::`, but they do not themselves change based on the caller.",
        },
        {
          id: "php-oop-static-late-binding-q8",
          prompt: "Inside a non-static method, why can `$this->foo()` and `static::foo()` behave differently when `foo()` is private?",
          options: [
            "`$this->foo()` can reach a private method in the current scope, while `static::foo()` resolves against the runtime class and will not",
            "`static::` always resolves to the parent class",
            "`static::` cannot call non-static methods at all",
            "There is no difference; they compile to the same opcode",
          ],
          correctIndex: 0,
          explanation:
            "The manual calls this out directly. `$this->` consults the calling scope first, which can see its own private methods; `static::` goes to the called class, where that private method is invisible.",
        },
        {
          id: "php-oop-static-late-binding-q9",
          prompt: "Which statement about static properties is correct?",
          options: [
            "A static property may be typed, but it cannot be `readonly`",
            "Static properties have been allowed to be `readonly` since PHP 8.1",
            "Static properties cannot carry type declarations",
            "Each class in a hierarchy always gets its own copy of an inherited static property",
          ],
          correctIndex: 0,
          explanation:
            "Typed statics arrived with typed properties in 7.4; readonly statics are explicitly unsupported. And an inherited static property is shared unless the child redeclares it.",
        },
        {
          id: "php-oop-static-late-binding-q10",
          prompt: "What is the main practical cost of making a service method `static`?",
          options: [
            "It cannot be injected or doubled, so every caller is welded to that one implementation",
            "Static methods dispatch more slowly than instance methods",
            "Static methods cannot declare parameter or return types",
            "Static methods are skipped by Composer's autoloader",
          ],
          correctIndex: 0,
          explanation:
            "Testability, not performance, is the real cost — plus any static state surviving between tests in the same process. Laravel's facades look static but resolve an instance from the container, which is exactly what makes `Cache::fake()` work.",
        },
      ],
    },

    {
      id: "php-oop-inheritance-abstract",
      moduleId: "php-oop",
      trackId: "php",
      title: "Inheritance, Abstract Classes and final",
      summary:
        "PHP has single inheritance, so `extends` spends the one slot a class has. Use it when the subtype genuinely *is* the supertype and the base is small and stable — a framework base controller, an abstract test case, a `Model`. Use it to share three convenient methods and you will be paying for it in two years, when changing the base breaks children you have never read.\n\nPHP enforces the Liskov rules mechanically. Return types are covariant (a child may narrow `Animal` to `Dog`), parameter types are contravariant (a child may widen `Dog` to `Animal` but never narrow), and visibility may only be relaxed. Everything except `__construct()`, which the manual exempts from signature compatibility, and private methods, which are not part of the contract at all and so are never really overridden. PHP 8.3's `#[\\Override]` attribute closes the remaining hole: it turns \"I thought I was overriding this\" into a compile-time error when the parent method does not exist or gets renamed.\n\nAbstract classes buy you what interfaces cannot: concrete method bodies and shared state, at the cost of the inheritance slot. A class with any abstract member must itself be abstract, abstract methods may be public or protected but not private, and as of 8.4 an abstract class may declare abstract *properties* with `get`/`set` requirements. `final` is the opposite lever — it says \"this is not an extension point\", which is a kindness to future readers and the only way to keep a value object's invariants from being subclassed away.\n\nThe subtle trap is dynamic dispatch from the base. A parent method calling `$this->load()` runs the *child's* `load()`, which is the template-method pattern when you meant it and a bug when a constructor calls an overridable method before the child has finished initialising.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Object Inheritance", url: "https://www.php.net/manual/en/language.oop5.inheritance.php", kind: "docs" },
        { label: "PHP Manual: Class Abstraction", url: "https://www.php.net/manual/en/language.oop5.abstract.php", kind: "docs" },
        { label: "PHP Manual: Covariance and Contravariance", url: "https://www.php.net/manual/en/language.oop5.variance.php", kind: "docs" },
        { label: "PHP Manual: The #[\\Override] attribute", url: "https://www.php.net/manual/en/class.override.php", kind: "docs" },
      ],
      video: {
        title: "PHP - Inheritance Explained - Is Inheritance Good? -  Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=LyyzeYOoH5s",
        videoId: "LyyzeYOoH5s",
        durationLabel: "25:09",
      },
      alternateVideos: [
        {
          title: "PHP Abstract Classes & Methods - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=UnwaW13xJuw",
          videoId: "UnwaW13xJuw",
          durationLabel: "9:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-inheritance-abstract-q1",
          prompt: "Which are true of abstract classes in PHP? (Select all that apply.)",
          options: [
            "A class containing at least one abstract member must itself be declared `abstract`",
            "An abstract class may have a constructor and fully implemented methods",
            "An abstract method may be declared `protected`",
            "An abstract method may be declared `private`",
            "An abstract class can be instantiated if every abstract method has a default body",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Abstract methods declare only a signature and public or protected visibility — `abstract private` is a fatal error in a class (traits are the one exception, since PHP 8.0). And an abstract method by definition has no body.",
        },
        {
          id: "php-oop-inheritance-abstract-q2",
          prompt:
            "Is `DogShelter` legal?\n\n```php\nclass Animal {}\nclass Dog extends Animal {}\nclass Shelter { public function adopt(): Animal { return new Animal(); } }\nclass DogShelter extends Shelter { public function adopt(): Dog { return new Dog(); } }\n```",
          options: [
            "Yes — return types are covariant, so a child may narrow the return type",
            "No — an overriding method's return type must match exactly",
            "Only if `adopt()` is declared `abstract` in `Shelter`",
            "Only with `#[\\ReturnTypeWillChange]`",
          ],
          correctIndex: 0,
          explanation:
            "Full variance landed in PHP 7.4. Narrowing a return type is safe because every caller expecting an `Animal` still gets one. Widening it would not be, and is rejected.",
        },
        {
          id: "php-oop-inheritance-abstract-q3",
          prompt:
            "A parent declares `public function feed(Dog $d): void`, with `class Puppy extends Dog`. Which child signatures does PHP accept? (Select all that apply.)",
          options: [
            "`public function feed(Animal $d): void`",
            "`public function feed(mixed $d): void`",
            "`public function feed(Dog $d): void`",
            "`public function feed(Puppy $d): void`",
            "`public function feed(Dog $d, int $portions): void`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Parameters are contravariant: a child may accept more than the parent promised, never less. Narrowing to `Puppy` would break a caller passing any other `Dog`, and adding a *required* parameter breaks every existing call — an optional one would be fine.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-inheritance-abstract-q4",
          prompt: "Which statement about `final` is correct?",
          options: [
            "`final class` cannot be extended and `final function` cannot be overridden; class constants can also be `final` since 8.1",
            "`final` properties cannot be reassigned after construction",
            "`final` implicitly makes a method static",
            "`final` prevents a class from being instantiated",
          ],
          correctIndex: 0,
          explanation:
            "`final` is about extension, not mutation — `readonly` is the keyword for values. Preventing instantiation is what `abstract`, or a private constructor, is for.",
        },
        {
          id: "php-oop-inheritance-abstract-q5",
          prompt: "What does PHP 8.3's `#[\\Override]` attribute do?",
          options: [
            "Raises a compile-time error when the marked method does not actually override a parent or interface method",
            "Forces the parent implementation to run before the child's body",
            "Marks the method as final so no further class can override it",
            "Nothing at runtime — only static analysers read it",
          ],
          correctIndex: 0,
          explanation:
            "It catches the case where a parent method is renamed or a typo silently creates a brand-new method that nothing ever calls. The engine enforces it, unlike a docblock annotation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-inheritance-abstract-q6",
          prompt: "A parent method calls `$this->serialize()`. A child overrides `serialize()`. Which implementation runs when the parent's method executes on a child instance?",
          options: [
            "The child's — method calls on `$this` dispatch on the runtime class",
            "The parent's, because the call is written inside the parent",
            "The child's, but only when the parent declares `serialize()` abstract",
            "Neither; PHP raises an ambiguity error",
          ],
          correctIndex: 0,
          explanation:
            "That is the template-method pattern when it is deliberate, and a footgun when a *constructor* calls an overridable method before the child has finished initialising. A `private` parent method is the one case that does not dispatch to the child.",
        },
        {
          id: "php-oop-inheritance-abstract-q7",
          prompt: "You need to share a default implementation of three of five methods across several implementations. What does an abstract class give you that an interface does not?",
          options: [
            "Concrete method bodies and shared state, at the cost of the single inheritance slot",
            "Multiple inheritance",
            "Type checking with `instanceof`",
            "The ability to declare constants",
          ],
          correctIndex: 0,
          explanation:
            "Interfaces already give you `instanceof` and constants, and you may implement as many as you like. What they cannot give you is a body or a property — which is exactly the trade an abstract class makes.",
        },
        {
          id: "php-oop-inheritance-abstract-q8",
          prompt: "A parent declares `public int $count;`. The child declares `public readonly int $count;`. What happens?",
          options: [
            "A fatal error — a read-write property may not be overridden with a readonly one",
            "It works, and the property is readonly on the child",
            "A deprecation notice, and readonly is ignored",
            "It works only when the parent is abstract",
          ],
          correctIndex: 0,
          explanation:
            "The manual forbids it in both directions. Code holding the parent type may legitimately assign to `$count`, so a child cannot quietly remove that capability.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-inheritance-abstract-q9",
          prompt: "You extend `DateTime` and override `modify(string $modifier)` without declaring a return type. On PHP 8.1+, what happens?",
          options: [
            "A deprecation notice, unless you add a compatible return type or `#[\\ReturnTypeWillChange]`",
            "A fatal error",
            "Nothing — internal classes are exempt from signature checks",
            "A `TypeError` the first time the method is called",
          ],
          correctIndex: 0,
          explanation:
            "Internal methods started declaring tentative return types in 8.1. Omitting a return type counts as a mismatch, which is why long-lived codebases suddenly filled up with this notice on upgrade.",
        },
        {
          id: "php-oop-inheritance-abstract-q10",
          prompt: "Why do experienced teams cap inheritance depth at two or three levels?",
          options: [
            "Because behaviour stops being local: reading one class no longer tells you what a method does",
            "Because the engine refuses to resolve hierarchies deeper than three levels",
            "Because Composer's autoloader slows down with depth",
            "Because each level adds a runtime lookup on every method call",
          ],
          correctIndex: 0,
          explanation:
            "Method tables are flattened into the class entry when it is linked, so depth costs nothing at runtime. It costs comprehension — and it makes every change to a base class a change to code you did not open.",
        },
      ],
    },

    {
      id: "php-oop-interfaces-polymorphism",
      moduleId: "php-oop",
      trackId: "php",
      title: "Interfaces, instanceof and Polymorphism",
      summary:
        "An interface is a type without an implementation, and the reason to reach for one is substitution: the caller depends on a promise, not on a class, so the implementation behind it can change without the caller noticing. Three payment gateways, two cache backends, a real mailer and a fake one in tests — all the same shape. A class may implement as many interfaces as it likes, which is what makes interfaces the right tool when inheritance's single slot is already spent.\n\nPHP's rules have loosened over time. Interface constants existed from the start, but before 8.1 an implementing class could not override one; now it can, and `final const` is how a library opts back out. As of 8.4 an interface may declare *properties* — `public string $name { get; }` — satisfiable by a plain public property, a `readonly` property (for a read-only requirement), or a virtual property with only the matching hook. Implementations may narrow return types, widen parameter types, and must satisfy every interface they claim simultaneously; a class implementing two interfaces that declare the same method with incompatible return types simply cannot be written.\n\nTwo practical notes. First, since named arguments arrived in 8.0 the parameter *names* in an interface are part of its contract, so implementations should keep them identical. Second, `instanceof` never throws: a non-object left operand and a class name that does not exist both evaluate to `false`, which means a typo in a class name produces a silently-false check rather than an error.\n\nThe smell to watch for is a `match` or `switch` on the concrete type behind an interface. If callers still have to know which implementation they got, the interface has not bought you anything.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Object Interfaces", url: "https://www.php.net/manual/en/language.oop5.interfaces.php", kind: "docs" },
        { label: "PHP Manual: Predefined Interfaces and Classes", url: "https://www.php.net/manual/en/reserved.interfaces.php", kind: "docs" },
        { label: "PHP Manual: Type Operators (instanceof)", url: "https://www.php.net/manual/en/language.operators.type.php", kind: "docs" },
        { label: "Laravel: Contracts", url: "https://laravel.com/framework/docs/13.x/contracts", kind: "docs" },
      ],
      video: {
        title: "PHP Interfaces & Polymorphism - Interfaces Explained - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=-AJic0FjuAA",
        videoId: "-AJic0FjuAA",
        durationLabel: "18:02",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-interfaces-polymorphism-q1",
          prompt: "Which are true of interfaces in current PHP? (Select all that apply.)",
          options: [
            "Every method declared in an interface is implicitly public",
            "An interface may extend more than one interface",
            "A class may implement more than one interface",
            "An interface may provide a default method body with the `default` keyword",
            "Declaring a constructor in an interface is recommended practice",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "PHP has no default methods — that is what abstract classes and traits are for. Constructors in interfaces are legal but the manual explicitly discourages them, because constructors are exempt from inheritance signature rules.",
        },
        {
          id: "php-oop-interfaces-polymorphism-q2",
          prompt: "Before PHP 8.1, what happened when an implementing class redeclared a constant it inherited from an interface?",
          options: [
            "A fatal error — interface constants could not be overridden",
            "Nothing; overriding always worked",
            "A deprecation notice, and the class's value won",
            "The interface's value silently won",
          ],
          correctIndex: 0,
          explanation:
            "8.1 lifted the restriction and added `final const` so a library can explicitly forbid overriding again. It is a small change that matters when a base contract declares a default that implementations legitimately need to vary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-interfaces-polymorphism-q3",
          prompt: "As of PHP 8.4 an interface can declare `public string $name { get; }`. Which class members satisfy that requirement? (Select all that apply.)",
          options: [
            "A plain `public string $name;` property",
            "A virtual property implementing only a `get` hook",
            "A `public readonly string $name;`",
            "A `public function getName(): string` method",
            "A `private string $name;` with a public getter",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The interface requires a publicly readable *property*, so anything that reads as `$obj->name` qualifies — including a readonly one, since only readability was demanded. A getter method is a different member entirely. A settable interface property could not be satisfied by a readonly one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-interfaces-polymorphism-q4",
          prompt:
            "What does this output?\n\n```php\n$a = 1;\n$b = null;\nvar_dump($a instanceof stdClass, $b instanceof stdClass);\n```",
          options: [
            "`bool(false)` twice",
            "`bool(false)` then a `TypeError`",
            "Two `TypeError`s",
            "`bool(false)` then `bool(true)`",
          ],
          correctIndex: 0,
          explanation:
            "`instanceof` never throws for a non-object operand. It also returns `false` for a class name that does not exist, which is why a misspelled class in an `instanceof` check fails silently instead of blowing up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-interfaces-polymorphism-q5",
          prompt: "A `PaymentGateway` interface has three implementations. Where does a `match` on which gateway you got belong?",
          options: [
            "Nowhere — the point of the interface is that the caller does not branch on the concrete type",
            "In every method that accepts a `PaymentGateway`",
            "In the interface itself, as a shared default",
            "In a static helper hanging off the interface",
          ],
          correctIndex: 0,
          explanation:
            "A type check behind an interface means the abstraction is leaking: either the behaviour belongs on the interface, or the implementations are not actually interchangeable and the contract is wrong.",
        },
        {
          id: "php-oop-interfaces-polymorphism-q6",
          prompt: "Why does the manual recommend that an implementing class keep the same parameter names as the interface?",
          options: [
            "Because callers may pass arguments by name, and named arguments bind to the implementation's parameter names",
            "Because PHP includes parameter names in its signature compatibility check",
            "Because reflection cannot read renamed parameters",
            "Because opcache keys compiled methods by parameter name",
          ],
          correctIndex: 0,
          explanation:
            "Named arguments (8.0) turned every public parameter name into API surface. PHP does *not* enforce matching names, so a renamed parameter breaks only the callers that use named arguments — quietly, and only for one implementation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-interfaces-polymorphism-q7",
          prompt: "Which of these predefined interfaces change how built-in syntax or functions behave on your object? (Select all that apply.)",
          options: [
            "`ArrayAccess` — `$obj['key']` starts working",
            "`IteratorAggregate` — `foreach ($obj as $k => $v)` starts working",
            "`JsonSerializable` — `json_encode($obj)` uses the value you return",
            "`Countable` — `$obj->count` works without declaring a property",
            "`Serializable` — the recommended way to control `serialize()` in current PHP",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Countable` makes `count($obj)` work, not a `count` property. `Serializable` has been deprecated since 8.1 — `__serialize()` and `__unserialize()` replaced it.",
        },
        {
          id: "php-oop-interfaces-polymorphism-q8",
          prompt: "When is an interface a better fit than an abstract class?",
          options: [
            "When implementations come from unrelated hierarchies, or one class must satisfy several contracts at once",
            "When you want to share a default implementation",
            "When implementations need to share protected state",
            "When you want to prevent instantiation",
          ],
          correctIndex: 0,
          explanation:
            "Interfaces cost nothing structurally — a class can implement any number of them. An abstract class spends the single inheritance slot, which is only worth it when there is real shared implementation or state.",
        },
        {
          id: "php-oop-interfaces-polymorphism-q9",
          prompt: "In Laravel, what does `$this->app->bind(PaymentGateway::class, StripeGateway::class)` mean?",
          options: [
            "Anything type-hinting `PaymentGateway` is resolved with a `StripeGateway`, so swapping providers is a one-line change",
            "`StripeGateway` is registered as a shared singleton",
            "`PaymentGateway` must be an abstract class rather than an interface",
            "Laravel generates a `StripeGateway` stub implementing the interface",
          ],
          correctIndex: 0,
          explanation:
            "This is the container doing dependency inversion for you. `singleton()` would be the shared variant; `bind()` builds a fresh instance each time it resolves.",
        },
        {
          id: "php-oop-interfaces-polymorphism-q10",
          prompt:
            "Class `C` implements interface `A`, declaring `find(int $id): ?Model`, and interface `B`, declaring `find(int $id): ?Record`, where `Model` and `Record` are unrelated classes. Can `C` satisfy both?",
          options: [
            "No — the one implementation would have to be compatible with both return types, and no type is",
            "Yes — PHP uses whichever interface is listed first",
            "Yes — PHP keeps two separate method entries",
            "Yes, provided the method omits its return type",
          ],
          correctIndex: 0,
          explanation:
            "A class has one method table, so a single `find()` must be compatible with every interface that declares it. Omitting the return type would be widening, which is illegal for return types.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-interfaces-polymorphism-q11",
          prompt: "An interface declares `getIterator(): Traversable`. May an implementation declare `getIterator(): ArrayIterator`?",
          options: [
            "Yes — return types are covariant, and `ArrayIterator` is a `Traversable`",
            "No — an interface signature must be reproduced exactly",
            "Only when the interface method is declared abstract",
            "Only with `#[\\ReturnTypeWillChange]`",
          ],
          correctIndex: 0,
          explanation:
            "Narrowing the return type keeps every caller's expectation intact. It is also why `IteratorAggregate` implementations can advertise the concrete iterator they hand back.",
        },
      ],
    },

    {
      id: "php-oop-traits",
      moduleId: "php-oop",
      trackId: "php",
      title: "Traits and Conflict Resolution",
      summary:
        "A trait is compile-time copy-and-paste with conflict detection. The engine flattens the trait's members into the using class when the class is linked, which explains everything else about them: you cannot instantiate a trait, you cannot type-hint against one, and a trait's static property or `static` variable belongs to each using class separately rather than being shared.\n\nPrecedence is the rule to memorise: the using class wins over the trait, and the trait wins over the inherited parent. That ordering is why `use SoftDeletes;` can override a base `Model` method, and why a method you define in the class quietly shadows the trait's version without any diagnostic. When two traits provide the same method the engine refuses to guess — a fatal error, resolved with `insteadof` to pick one and `as` to alias (and optionally re-scope) the other. Aliasing an excluded method is allowed, so you can keep both under different names.\n\nTwo version-sensitive details. PHP 8.3 changed static properties in traits: a child class that uses the same trait as its parent now gets its own copy rather than sharing the parent's. PHP 8.5 changed the binding order so traits bind *before* the parent class, which means a trait property or constant colliding with an inherited one now wins instead of producing a fatal error; method resolution is unchanged.\n\nThe cost of traits is the thing they do not give you: a type. Behaviour pulled in with `use` cannot be swapped, decorated or doubled at a boundary, because nothing can point at it. That makes traits a good fit for genuinely mechanical mixins — `HasFactory`, `HasUuids` — and a poor fit for anything that has a policy in it or that you will one day want to vary per environment.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Traits", url: "https://www.php.net/manual/en/language.oop5.traits.php", kind: "docs" },
        { label: "PHP RFC: Horizontal Reuse for PHP (traits)", url: "https://wiki.php.net/rfc/horizontalreuse", kind: "spec" },
        { label: "Laravel: Eloquent (SoftDeletes, HasFactory and friends)", url: "https://laravel.com/framework/docs/13.x/eloquent", kind: "docs" },
      ],
      video: {
        title: "PHP Traits - How They Work & Drawbacks - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=PMruqUC4Qpc",
        videoId: "PMruqUC4Qpc",
        durationLabel: "31:40",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-traits-q1",
          prompt:
            "What does this print?\n\n```php\nclass Base { public function hello() { return 'base'; } }\ntrait T { public function hello() { return 'trait'; } }\nclass C extends Base {\n    use T;\n    public function hello() { return 'class'; }\n}\necho (new C)->hello();\n```",
          options: ["`class`", "`trait`", "`base`", "A fatal error about a conflicting method"],
          correctIndex: 0,
          explanation:
            "Precedence runs current class, then trait, then inherited. Note there is no warning when the class shadows the trait — which is how a trait method silently stops being used after a refactor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-traits-q2",
          prompt:
            "And with the class's own `hello()` deleted?\n\n```php\nclass Base { public function hello() { return 'base'; } }\ntrait T { public function hello() { return 'trait'; } }\nclass C extends Base { use T; }\necho (new C)->hello();\n```",
          options: ["`trait`", "`base`", "A fatal error", "`basetrait`"],
          correctIndex: 0,
          explanation:
            "The trait is flattened into `C` itself, so it overrides the inherited method exactly as a method written in `C` would. This is how `SoftDeletes` replaces `Model::delete()`.",
        },
        {
          id: "php-oop-traits-q3",
          prompt: "Traits `A` and `B` both define `log()`. Which `use` blocks compile? (Select all that apply.)",
          options: [
            "`use A, B { A::log insteadof B; }`",
            "`use A, B { A::log insteadof B; B::log as errorLog; }`",
            "`use A, B { B::log insteadof A; A::log as protected aLog; }`",
            "`use A, B;`",
            "`use A, B { A::log, B::log; }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`insteadof` excludes one side, and `as` can still alias the excluded method — optionally with a new visibility. An unresolved collision is a fatal error, and the last line is not valid syntax.",
        },
        {
          id: "php-oop-traits-q4",
          prompt:
            "On PHP 8.3 and later, what does this print?\n\n```php\ntrait T { public static int $counter = 1; }\nclass A {\n    use T;\n    public static function inc(): void { static::$counter++; }\n}\nclass B extends A { use T; }\nA::inc();\necho A::$counter, B::$counter;\n```",
          options: ["`21`", "`22`", "`11`", "A fatal error"],
          correctIndex: 0,
          explanation:
            "Before 8.3 a trait's static property was shared across the whole hierarchy, so both printed `2`. Since 8.3 a child that uses the trait itself gets a distinct property, so `B` still reads `1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-traits-q5",
          prompt:
            "What does this print?\n\n```php\ntrait Counter { public function inc(): int { static $c = 0; return ++$c; } }\nclass C1 { use Counter; }\nclass C2 { use Counter; }\necho (new C1)->inc(), (new C2)->inc();\n```",
          options: ["`11`", "`12`", "`22`", "`10`"],
          correctIndex: 0,
          explanation:
            "The trait is copied into each class, so each gets its own `static $c`. Contrast an *inherited* method, where PHP 8.1 made the static variable shared between parent and child.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-traits-q6",
          prompt: "What does `abstract public function getWorld();` inside a trait achieve?",
          options: [
            "It requires the using class to supply that method, so the trait's own methods can call it",
            "It forces the using class to be declared abstract",
            "It is ignored unless an abstract class uses the trait",
            "It is a syntax error — traits cannot declare abstract methods",
          ],
          correctIndex: 0,
          explanation:
            "It is how a trait states its dependencies. Since PHP 8.0 the abstract member may also be private, and the concrete implementation must be signature-compatible — earlier versions did not check.",
        },
        {
          id: "php-oop-traits-q7",
          prompt: "Which of these may a trait contain in current PHP? (Select all that apply.)",
          options: [
            "Static methods and static properties",
            "Constants, as of PHP 8.2",
            "Abstract methods the using class must implement",
            "An `extends` clause naming a parent class",
            "Instantiation with `new MyTrait()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A trait may `use` other traits but never `extends` anything, and it is not a type, so it cannot be instantiated. Constants in traits arrived in 8.2; before that they were a parse error.",
        },
        {
          id: "php-oop-traits-q8",
          prompt: "A trait gives you code reuse but not a type. What does that cost you in practice?",
          options: [
            "You cannot type-hint against a trait, so behaviour pulled in with `use` cannot be substituted or doubled at a boundary",
            "Trait methods dispatch more slowly than class methods",
            "A class using a trait cannot also implement interfaces",
            "Traits are resolved at runtime, so static analysers cannot see them",
          ],
          correctIndex: 0,
          explanation:
            "Flattening happens at compile time, so performance and analysis are both fine. What is missing is the seam: an injected collaborator can be swapped per environment, a trait cannot.",
        },
        {
          id: "php-oop-traits-q9",
          prompt: "As of PHP 8.5 a trait is bound to a class *before* its parent. What changed as a result?",
          options: [
            "When a trait and the parent declare a property or constant of the same name, the trait's definition now wins instead of causing a fatal error",
            "Trait methods now override methods declared in the using class",
            "Traits are now resolved at runtime rather than at link time",
            "A trait may now be used before it has been declared",
          ],
          correctIndex: 0,
          explanation:
            "The change makes property and constant handling match the copy-and-paste mental model that method resolution already followed. Method precedence — class over trait over parent — is unaffected.",
        },
        {
          id: "php-oop-traits-q10",
          prompt:
            "Laravel's `SoftDeletes` trait adds a global scope, a `trashed()` method and a boot hook to a model. What is the cost of that convenience?",
          options: [
            "The behaviour is flattened into the class at link time, so it cannot be swapped off per environment and a second trait touching the same method collides loudly",
            "It costs an extra database query for every model that is instantiated",
            "It forces the model class to be declared `final`",
            "It prevents the model from implementing any interface",
          ],
          correctIndex: 0,
          explanation:
            "That is the right trade for a mechanical mixin. It stops being the right trade the moment the behaviour has a policy in it that you will want to vary — that belongs behind an injected interface.",
        },
      ],
    },

    {
      id: "php-oop-enums",
      moduleId: "php-oop",
      trackId: "php",
      title: "Enums: Pure, Backed and Behavioural",
      summary:
        "Enums (PHP 8.1) replace the class-constant-and-hope pattern with a real type. `function ship(Status $s)` cannot be handed `'shipped '` with a trailing space, because the only values that exist are the cases you declared. Each case is a singleton object of the enum type, so `===` works, `instanceof` works, and there is exactly one instance per case for the life of the request.\n\nA *pure* enum has cases with names only. A *backed* enum attaches one `int` or `string` to each case — never both, never a float, never auto-assigned — which is what makes it persistable. Backed enums get `from()`, which throws a `ValueError` on an unknown value, and `tryFrom()`, which returns `null`: use `from()` for data you trust, `tryFrom()` for anything coming off the wire. Both follow the usual typing rules, so under `strict_types` passing an `int` to a string-backed enum's `tryFrom()` is a `TypeError`, not a miss.\n\nThe thing that makes enums worth more than a constant is that they carry behaviour. Methods, static methods, constants, interfaces and traits are all allowed; state is not. No properties, no constructor, no inheritance, no cloning. Putting `label()` or `canTransitionTo()` on the enum keeps the mapping next to the cases, so adding a case has exactly one place to be handled — and a `match` with no `default` fails loudly with `UnhandledMatchError` instead of silently returning a fallback.\n\nTwo details that bite. Enum cases are objects, so they cannot be used as array keys — use `->value` or `->name`. And `json_encode()` on a backed enum emits its scalar value, while a pure enum throws unless it implements `JsonSerializable`.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "PHP Manual: Enumerations", url: "https://www.php.net/manual/en/language.enumerations.php", kind: "docs" },
        { label: "PHP Manual: Backed enumerations", url: "https://www.php.net/manual/en/language.enumerations.backed.php", kind: "docs" },
        { label: "PHP Watch: Enums in PHP 8.1", url: "https://php.watch/versions/8.1/enums", kind: "article" },
        { label: "Laravel: Enum casting", url: "https://laravel.com/framework/docs/13.x/eloquent-mutators", kind: "docs" },
      ],
      video: {
        title: "PHP Enums With Practical Examples - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=5Cgio2OfOYk",
        videoId: "5Cgio2OfOYk",
        durationLabel: "28:13",
      },
      alternateVideos: [
        {
          title: "PHP Enums Explained: How to Use Enums in PHP 8.1+",
          channel: "Dani Krossing",
          url: "https://www.youtube.com/watch?v=pS9FbYKbHVs",
          videoId: "pS9FbYKbHVs",
          durationLabel: "14:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-enums-q1",
          prompt: "Which are true of PHP enums? (Select all that apply.)",
          options: [
            "A backed enum may be backed by `int` or `string`, but not a union of both",
            "Every case of a backed enum must declare its own unique scalar value explicitly",
            "A pure enum case has a `name` but no `value`",
            "Backing values are auto-assigned as sequential integers when omitted",
            "An enum may be backed by `float`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "There is no auto-numbering and no float backing — a deliberate choice, because an implicit ordinal is exactly the thing that breaks when someone reorders the cases.",
        },
        {
          id: "php-oop-enums-q2",
          prompt:
            "What happens on each line?\n\n```php\nenum Status: string { case Draft = 'draft'; case Live = 'live'; }\nvar_dump(Status::tryFrom('archived'));\nStatus::from('archived');\n```",
          options: [
            "`NULL`, then a `ValueError`",
            "`NULL`, then `NULL`",
            "A `ValueError` on both lines",
            "`bool(false)`, then a `TypeError`",
          ],
          correctIndex: 0,
          explanation:
            "`tryFrom()` is for untrusted input and returns `null`; `from()` treats a miss as an application-stopping error. `Status::tryFrom($input) ?? Status::Draft` is the idiomatic defaulting pattern.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-enums-q3",
          prompt: "Which of these are forbidden in an enum? (Select all that apply.)",
          options: [
            "Instance properties",
            "A constructor",
            "Cloning a case",
            "Static methods",
            "Implementing an interface",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cases must stay singletons, so anything that would give them per-instance state or a second instance is banned. Methods, static methods, constants, interfaces and traits are all fine.",
        },
        {
          id: "php-oop-enums-q4",
          prompt:
            "What does this do?\n\n```php\nenum Role { case Admin; case Editor; }\n$labels = [Role::Admin => 'Administrator'];\n```",
          options: [
            "A `TypeError` about an illegal offset type — enum cases are objects",
            "It works; PHP uses the case name as the key",
            "It works; PHP uses the case's declaration order as the key",
            "A fatal error at compile time",
          ],
          correctIndex: 0,
          explanation:
            "Array keys may only be `int` or `string`. Key by `$case->value` on a backed enum, or by `$case->name`, or better: put `label()` on the enum so the mapping travels with the cases.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-enums-q5",
          prompt:
            "What does `json_encode()` produce for `Status::Live` (from `enum Status: string { case Live = 'live'; }`) and for `Role::Admin` (from a pure `enum Role { case Admin; }`)?",
          options: [
            "`\"live\"` for the backed case; an error for the pure one",
            "`{\"name\":\"Live\",\"value\":\"live\"}` and `{\"name\":\"Admin\"}`",
            "`\"Live\"` and `\"Admin\"`",
            "`null` for both",
          ],
          correctIndex: 0,
          explanation:
            "A backed enum serialises to its scalar value in the appropriate type. A pure enum has nothing sensible to emit, so it throws unless the enum implements `JsonSerializable` — the usual reason to back an enum you will put in an API response.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-enums-q6",
          prompt: "Why put a `label(): string` method on the enum instead of writing a `match` inside a view helper?",
          options: [
            "The mapping lives next to the cases, so a new case has exactly one place to be handled and a `match` with no `default` fails loudly instead of returning a fallback",
            "Methods on enums are faster than a `match` in a function",
            "Enum cases cannot be passed to functions",
            "A helper would break `===` comparison between cases",
          ],
          correctIndex: 0,
          explanation:
            "`match` with no `default` throws `UnhandledMatchError`, which turns \"we forgot the new case\" into a failing test rather than a blank label in production. Scatter the mapping across helpers and you lose that.",
        },
        {
          id: "php-oop-enums-q7",
          prompt: "What does `Status::cases()` return, and which enums have it?",
          options: [
            "A packed array of every case in declaration order, on both pure and backed enums via `UnitEnum`",
            "An array of the backing values, on backed enums only",
            "An array keyed by case name",
            "A generator that yields the cases lazily",
          ],
          correctIndex: 0,
          explanation:
            "`UnitEnum::cases()` is the interface both kinds implement; `BackedEnum` adds `from()` and `tryFrom()` on top. Defining your own `cases()` is a fatal error.",
        },
        {
          id: "php-oop-enums-q8",
          prompt:
            "What does this output?\n\n```php\nenum Suit { case Hearts; }\n$a = Suit::Hearts;\n$b = Suit::Hearts;\nvar_dump($a === $b, $a instanceof Suit, $a > $b);\n```",
          options: [
            "`bool(true) bool(true) bool(false)`",
            "`bool(false) bool(true) bool(false)`",
            "`bool(true) bool(true) bool(true)`",
            "`bool(true) bool(false) bool(false)`",
          ],
          correctIndex: 0,
          explanation:
            "Each case is a singleton, so identity comparison is the right way to compare enums. Relational operators on objects are not meaningful, so `>` is always `false` — if you need ordering, put a method on the enum.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-enums-q9",
          prompt: "Is `unserialize(serialize(Suit::Hearts)) === Suit::Hearts` true?",
          options: [
            "Yes — enums use a dedicated serialization code that restores the existing singleton",
            "No — `unserialize()` always constructs a new object",
            "It is a fatal error to serialize an enum",
            "Yes, but only for backed enums",
          ],
          correctIndex: 0,
          explanation:
            "Enums serialize with the `E` code, which records the case name and resolves back to the singleton. If the enum or case no longer exists on the way back, you get a warning and `false`.",
        },
        {
          id: "php-oop-enums-q10",
          prompt: "Which of these are legal on an enum? (Select all that apply.)",
          options: [
            "`implements HasLabel`",
            "`const DEFAULT = self::Draft;`",
            "`use SomeTrait;`",
            "`extends BaseStatus`",
            "`public readonly string $slug;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Enums are implicitly final and cannot extend or be extended, and no property declaration is allowed — `name` and `value` are the only ones, and they are supplied by the engine. A constant may alias a case.",
        },
        {
          id: "php-oop-enums-q11",
          prompt: "In Laravel, casting a model attribute to a backed enum class means what?",
          options: [
            "The stored scalar is hydrated into the enum instance on read, and the case's backing value is written back to the column on save",
            "The attribute is stored as a serialized PHP object in the column",
            "Only validation uses the enum; the attribute itself stays a string",
            "Laravel creates a database `ENUM` column to match the cases",
          ],
          correctIndex: 0,
          explanation:
            "The cast is a boundary translation, nothing more — the column stays a normal varchar or int. That is the point: the database keeps a portable scalar and your code works with a type.",
        },
        {
          id: "php-oop-enums-q12",
          prompt: "Under `declare(strict_types=1)`, what does `Status::tryFrom(1)` do for a *string*-backed enum?",
          options: [
            "Throws a `TypeError`",
            "Returns `null`",
            "Coerces `1` to `\"1\"` and returns `null`",
            "Returns the first declared case",
          ],
          correctIndex: 0,
          explanation:
            "`from()` and `tryFrom()` follow the normal weak/strict typing rules. In weak mode the `int` would be coerced and you would get `null`; in strict mode it is a type error, and a `float` is a type error either way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "php-oop-magic-methods",
      moduleId: "php-oop",
      trackId: "php",
      title: "Magic Methods and Property Overloading",
      summary:
        "Magic methods are the engine's fallback path. `__get()` and `__set()` run only when a property is *inaccessible or non-existent* from the calling scope — a declared, visible property never reaches them, which is why adding a real property to a magic-backed class silently changes behaviour for every caller. `__call()` and `__callStatic()` do the same for methods, `__invoke()` makes an object callable, and `__toString()` defines what `echo $obj` prints (and, since PHP 8.0, implicitly implements `Stringable`).\n\nThis is the machinery behind most of Laravel's ergonomics. Eloquent attributes are `__get()`/`__set()` over an internal array; query scopes and macros are `__call()`; facades are `__callStatic()` forwarding to a container-resolved instance. It works, and it is why `$user->name` does not need a declared property for every column — but it is also why your IDE cannot complete it, PHPStan needs generated stubs to understand it, and the lookup is slower than a real property.\n\nThe traps are specific. PHP will not re-enter an overload method from inside itself, so `return $this->missing;` inside `__get()` yields `null` plus a warning instead of recursing. `isset()` and `empty()` on a magic property go through `__isset()`, so a class defining only `__get()` reports `false` for data it can clearly return. `$obj->list[] = 'a'` on a magic property raises \"indirect modification of overloaded property\" and throws the write away, because `__get()` returned a copy — only a by-reference `&__get()` avoids that. And since 8.0 the engine validates magic method signatures: a wrong type declaration is a fatal error, and any magic method other than `__construct`, `__destruct` and `__clone` must be public.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Magic Methods", url: "https://www.php.net/manual/en/language.oop5.magic.php", kind: "docs" },
        { label: "PHP Manual: Overloading", url: "https://www.php.net/manual/en/language.oop5.overloading.php", kind: "docs" },
        { label: "PHP Manual: The Stringable interface", url: "https://www.php.net/manual/en/class.stringable.php", kind: "docs" },
        { label: "Laravel: Facades", url: "https://laravel.com/framework/docs/13.x/facades", kind: "docs" },
      ],
      video: {
        title: "What Are PHP Magic Methods & How They Work - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=nCxnzj83poQ",
        videoId: "nCxnzj83poQ",
        durationLabel: "16:55",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-magic-methods-q1",
          prompt: "Which property reads trigger `__get()` when made from outside the class?",
          options: [
            "Reads of properties that are undeclared **or** not visible in the calling scope",
            "Every property read on the object",
            "Only reads of properties that were never declared",
            "Only reads of `private` properties",
          ],
          correctIndex: 0,
          explanation:
            "The manual calls these \"inaccessible properties\": undeclared, or declared but `private`/`protected` relative to the caller. A declared public property is read directly and never reaches `__get()`.",
        },
        {
          id: "php-oop-magic-methods-q2",
          prompt: "A class defines `__get()` and has a declared `public $name`. Something calls `unset($obj->name)` and then reads `$obj->name`. What happens?",
          options: [
            "`__get()` is called, because `unset()` removed the property from that object",
            "It returns `null` with an \"undefined property\" warning",
            "The property is restored to its declared default",
            "A fatal error",
          ],
          correctIndex: 0,
          explanation:
            "`unset()` deletes the slot on that instance, so the property becomes non-existent and the magic path takes over. Lazy-loading proxies deliberately exploit this; it is also how an innocent `unset()` can change a class's behaviour from then on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-magic-methods-q3",
          prompt:
            "What does this produce?\n\n```php\nclass A {\n    public function __get($name) { return $this->missing; }\n}\necho (new A)->foo;\n```",
          options: [
            "`null`, with a warning — PHP will not re-enter `__get()` from inside itself",
            "Infinite recursion until the stack overflows",
            "The string `missing`",
            "A fatal error about recursive overloading",
          ],
          correctIndex: 0,
          explanation:
            "The engine suppresses re-entry into the same overload method, so the inner read is treated as an ordinary undefined property. It can still trigger a *different* overload method — `__set()` may trigger `__get()`, for example.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-magic-methods-q4",
          prompt: "A class keeps overloaded data in a private array and defines only `__get()`. What does `isset($obj->someKey)` return for a key that array definitely contains?",
          options: [
            "`false` — `isset()` on an inaccessible property routes to `__isset()`, which is not defined",
            "`true`, because `__get()` returns a value",
            "It calls `__get()` and evaluates the result",
            "`null`, with a warning",
          ],
          correctIndex: 0,
          explanation:
            "`isset()` and `empty()` both go through `__isset()`. Implementing `__get()` without its three siblings is the single most common magic-method bug, and `empty()` silently gets it wrong too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-magic-methods-q5",
          prompt: "Which are true of `__call()` and `__callStatic()`? (Select all that apply.)",
          options: [
            "`__call()` handles undefined *or* inaccessible instance method calls",
            "`__callStatic()` does the same for static calls",
            "Both receive the method name and an array of the arguments",
            "Their arguments may be declared by reference",
            "`__call()` also fires for a method that exists and is public",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "No magic method may take arguments by reference. And an existing, accessible method is always called directly — the magic path is only a fallback.",
        },
        {
          id: "php-oop-magic-methods-q6",
          prompt: "What does defining `__invoke()` give you?",
          options: [
            "The object becomes callable: `$obj($x)` works and `is_callable($obj)` is `true`",
            "The object can be indexed like an array",
            "The method runs automatically when the object is constructed",
            "The object can be passed where a `string` parameter is expected",
          ],
          correctIndex: 0,
          explanation:
            "It is what makes single-action controllers, invokable jobs and `array_map($formatter, $rows)` with an object formatter work. `ArrayAccess` is the interface for array syntax; `__toString()` is for string contexts.",
        },
        {
          id: "php-oop-magic-methods-q7",
          prompt: "Which are true of `__toString()` as of PHP 8? (Select all that apply.)",
          options: [
            "A class defining `__toString()` implicitly implements `Stringable`",
            "`__toString()` may throw an exception",
            "The return value is coerced to `string` under weak typing",
            "Under `declare(strict_types=1)`, a `Stringable` object is accepted by a plain `string` parameter type",
            "`__toString()` may be declared `protected`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Throwing from `__toString()` became legal in 7.4. Under strict types you need `string|Stringable` to accept the object, and every magic method except `__construct`, `__destruct` and `__clone` must be public.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-magic-methods-q8",
          prompt:
            "What happens on the last line?\n\n```php\nclass Bag {\n    private array $data = ['list' => []];\n    public function __get($name) { return $this->data[$name]; }\n}\n$b = new Bag();\n$b->list[] = 'a';\n```",
          options: [
            "A notice about indirect modification of an overloaded property, and the append is discarded",
            "`'a'` is appended to the internal array",
            "A fatal error",
            "The internal array is replaced with `['a']`",
          ],
          correctIndex: 0,
          explanation:
            "`__get()` returned a copy of the array, so there is nothing for the append to write back to. Declaring `public function &__get($name)` and returning a reference is the only way to make it stick — which is why most magic containers expose explicit `set()` methods instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-magic-methods-q9",
          prompt: "Can `__get()` or `__set()` be triggered by static property access such as `Foo::$bar`?",
          options: [
            "No — property overloading works only in object context, and declaring these methods `static` raises a warning",
            "Yes, if they are declared `static`",
            "Yes — PHP routes it through `__callStatic()`",
            "Yes, but only for private static properties",
          ],
          correctIndex: 0,
          explanation:
            "There is no static counterpart to property overloading. `__callStatic()` covers static *method* calls only.",
        },
        {
          id: "php-oop-magic-methods-q10",
          prompt: "What is the real cost of building a model on `__get()`/`__set()`?",
          options: [
            "No IDE completion, no static analysis of property names or types, and a slower path than a declared property",
            "Magic methods break `instanceof` checks",
            "Objects using magic methods cannot be serialized",
            "The class is forced to be `final`",
          ],
          correctIndex: 0,
          explanation:
            "Eloquent pays exactly this price, which is why the ecosystem grew IDE-helper packages and PHPStan extensions to generate the property list that the code itself never declares.",
        },
        {
          id: "php-oop-magic-methods-q11",
          prompt: "As of PHP 8.0, what happens if you declare `public function __get(int $name): mixed`?",
          options: [
            "A fatal error — a magic method that declares types must match the documented signature exactly",
            "Nothing; the types are advisory",
            "A deprecation notice",
            "It compiles, but `__get()` is never invoked",
          ],
          correctIndex: 0,
          explanation:
            "8.0 started validating magic method signatures. It catches real bugs — a `__set(string $name)` with the value parameter missing, say — that used to fail only at call time.",
        },
      ],
    },

    {
      id: "php-oop-cloning",
      moduleId: "php-oop",
      trackId: "php",
      title: "Object Cloning, __clone and Deep Copies",
      summary:
        "`$b = $a` on an object copies the handle, not the object. `clone $a` copies the object — but shallowly. Every property is copied by the engine's normal rules, which means scalars and arrays are genuinely independent (arrays are values, with copy-on-write behind the scenes) while any property holding an object still points at the *same* object. That asymmetry is the entire subject: two properties that look equally copied behave differently depending on what is behind them.\n\n`__clone()` runs on the new copy after the properties have been copied — never on the original, and the constructor is not called. It is the one place to fix the shallow copy: re-clone the object-typed properties you need to be independent, or deliberately keep sharing the ones you don't (a logger, a connection). `unserialize(serialize($obj))` is the blunt alternative that deep-copies the whole graph, at the cost of requiring everything in it to be serializable and of being far slower.\n\nCloning got two upgrades worth knowing. PHP 8.3 allows `readonly` properties to be reinitialised inside `__clone()`, which is what finally made `withStatus()`-style immutable updates ergonomic. PHP 8.5 goes further and exposes `clone` as a *function*: `clone($this, ['x' => 5])` copies the object, runs `__clone()`, then applies the listed overrides — readonly ones included — so a whole family of `withX()` methods collapses into one line each.\n\nOne comparison detail people get wrong in interviews: `==` on two objects compares class and property values, so an object and its clone are loosely equal; `===` compares identity, so they are not identical.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "PHP Manual: Object Cloning", url: "https://www.php.net/manual/en/language.oop5.cloning.php", kind: "docs" },
        { label: "PHP Manual: Comparing Objects", url: "https://www.php.net/manual/en/language.oop5.object-comparison.php", kind: "docs" },
        { label: "PHP RFC: Readonly amendments (8.3)", url: "https://wiki.php.net/rfc/readonly_amendments", kind: "spec" },
        { label: "PHP RFC: Clone with v2 (8.5)", url: "https://wiki.php.net/rfc/clone_with_v2", kind: "spec" },
      ],
      video: {
        title: "PHP - Object Cloning & Clone Magic Method - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=vLmIoy6Bnog",
        videoId: "vLmIoy6Bnog",
        durationLabel: "4:43",
      },
      alternateVideos: [
        {
          title: "Cloning Readonly Classes in PHP 8.2",
          channel: "PHP Annotated",
          url: "https://www.youtube.com/watch?v=HW4o1K2us2E",
          videoId: "HW4o1K2us2E",
          durationLabel: "8:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-cloning-q1",
          prompt:
            "What does this print?\n\n```php\nclass Address { public function __construct(public string $city) {} }\nclass User { public function __construct(public Address $address) {} }\n$a = new User(new Address('Pune'));\n$b = clone $a;\n$b->address->city = 'Delhi';\necho $a->address->city;\n```",
          options: ["`Delhi`", "`Pune`", "An `Error`", "An empty string"],
          correctIndex: 0,
          explanation:
            "`clone` is shallow: `$b->address` is the same `Address` object as `$a->address`, so mutating it is visible through both. `__clone()` re-cloning the address is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-cloning-q2",
          prompt: "If `User` held `public array $tags` instead, would `$b->tags[] = 'x'` after a clone affect `$a`?",
          options: [
            "No — arrays are values, so the clone gets its own copy",
            "Yes — `clone` is shallow, and that applies to arrays too",
            "Only when the array contains objects",
            "Only under `declare(strict_types=1)`",
          ],
          correctIndex: 0,
          explanation:
            "\"Shallow\" bites on object-typed properties and on properties that are references. A plain array property is copied by value (lazily, via copy-on-write). An array *of objects* still shares the objects inside it.",
        },
        {
          id: "php-oop-cloning-q3",
          prompt: "When is `__clone()` called, and on which object?",
          options: [
            "On the new copy, after every property has been copied",
            "On the original, before the copy is made",
            "On the new copy, instead of copying the properties",
            "On both objects, original first",
          ],
          correctIndex: 0,
          explanation:
            "It is a post-processing hook, not a copy constructor: the shallow copy has already happened and `__clone()`'s job is to repair it. `__construct()` is not called at any point.",
        },
        {
          id: "php-oop-cloning-q4",
          prompt: "Which of these produce a genuine deep copy of an object graph? (Select all that apply.)",
          options: [
            "A `__clone()` that recursively re-clones every object-typed property",
            "`unserialize(serialize($obj))`, for a graph where everything is serializable",
            "`clone $obj` on its own",
            "`(object) (array) $obj`",
            "`new static(...get_object_vars($obj))`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The cast round-trip and the constructor call both hand the *same* object handles to the new instance. Serialization genuinely rebuilds the graph, but it is slow and chokes on closures, connections and other unserializable state.",
        },
        {
          id: "php-oop-cloning-q5",
          prompt: "Before PHP 8.3, a `withStatus()` method could not `clone` an object and then change a `readonly` property on the copy. What changed?",
          options: [
            "As of 8.3, readonly properties may be reinitialised inside `__clone()`",
            "As of 8.3, readonly properties can be written once from any scope",
            "As of 8.3, `clone` skips readonly properties entirely",
            "Nothing — it still requires constructing a whole new object",
          ],
          correctIndex: 0,
          explanation:
            "Reinitialisation is scoped to `__clone()`, so immutability is preserved everywhere else. PHP 8.4 additionally closed the loophole of taking a reference to a readonly property inside `__clone()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-cloning-q6",
          prompt: "PHP 8.5 makes `clone` available as a function taking a second argument. What does `clone($this, ['x' => 10])` do?",
          options: [
            "Copies the object, runs `__clone()`, then applies the listed overrides to the copy — readonly properties included",
            "Applies the overrides to the original object and returns it",
            "Copies only the listed properties and leaves the rest uninitialised",
            "Replaces `__clone()` for that class",
          ],
          correctIndex: 0,
          explanation:
            "The overrides are applied after `__clone()` and respect each property's visibility. It is aimed squarely at `withX()` methods on immutable objects, which previously needed a full constructor call or an 8.3 `__clone()` dance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-cloning-q7",
          prompt:
            "What does this output?\n\n```php\nclass P { public function __construct(public int $x) {} }\n$a = new P(1);\n$b = clone $a;\nvar_dump($a == $b, $a === $b);\n```",
          options: [
            "`bool(true) bool(false)`",
            "`bool(true) bool(true)`",
            "`bool(false) bool(false)`",
            "`bool(false) bool(true)`",
          ],
          correctIndex: 0,
          explanation:
            "`==` on objects compares the class and then the properties with loose comparison; `===` is identity, true only for the same instance. This is the standard way to check \"same value\" versus \"same object\".",
        },
        {
          id: "php-oop-cloning-q8",
          prompt: "A class holds an open PDO connection in a property. What does `clone` do with it?",
          options: [
            "The copy points at the same connection object; `__clone()` is where you decide to reconnect or keep sharing",
            "PHP transparently opens a second connection",
            "The property is reset to `null` on the copy",
            "`clone` throws, because a connection cannot be copied",
          ],
          correctIndex: 0,
          explanation:
            "Sharing is usually what you want for a connection or a logger and usually wrong for mutable domain state. That decision is exactly what `__clone()` exists to express.",
        },
        {
          id: "php-oop-cloning-q9",
          prompt: "What happens if you `clone` an enum case?",
          options: [
            "An `Error` — enum cases are singletons and cannot be cloned",
            "You get a second instance carrying the same name",
            "It silently returns the same case",
            "A deprecation notice, then a copy",
          ],
          correctIndex: 0,
          explanation:
            "A second instance would break `===` comparison between cases, which is the property everything else about enums depends on, so the engine forbids it outright.",
        },
      ],
    },

    {
      id: "php-oop-composition-solid",
      moduleId: "php-oop",
      trackId: "php",
      title: "Composition over Inheritance and SOLID in Practice",
      summary:
        "Inheritance couples a subclass to the *implementation* of its parent, which can change underneath it without warning. Composition couples a class only to a contract its collaborator promised to keep. That is the whole argument, and it is why the default answer to \"we need to share this behaviour\" should be constructor injection behind an interface, with `extends` reserved for the cases where the subtype genuinely *is* the supertype and the base is small and stable.\n\nThe SOLID principles are five ways of saying the same thing more precisely. Single responsibility is about *one reason to change* — one stakeholder or policy that can force an edit — not about line counts. Open/closed means you add a behaviour by adding a class, not by editing the dispatcher. Liskov is enforced partly by PHP's variance rules and violated by anything else that narrows a promise: the `Square extends Rectangle` where setting the width also sets the height, or the override that throws \"not supported\". Interface segregation says a fat contract that half its implementations cannot honour should be split. Dependency inversion is what Laravel's container does for you: type-hint the interface, bind the implementation in a service provider, and the consumer never learns which one it got.\n\nThe smells are concrete. A subclass that overrides a method to throw. A base class accumulating `protected` flags that switch behaviour per child. Needing behaviour from two unrelated bases at once. A trait pulled in to \"share\" something that has a policy in it. And service location — `app(Gateway::class)` inside a method instead of a constructor parameter — which hides the dependency from the signature and makes the class impossible to build without a live container.\n\nNone of this means never use inheritance. A framework base controller, an abstract test case, an abstract template method with one hook: all fine. The question to ask is whether you are sharing a *type* or just some code.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Service Container", url: "https://laravel.com/framework/docs/13.x/container", kind: "docs" },
        { label: "PHP: The Right Way — Design Patterns", url: "https://phptherightway.com/pages/Design-Patterns.html", kind: "article" },
        { label: "Refactoring Guru: Design Patterns in PHP", url: "https://refactoring.guru/design-patterns/php", kind: "article" },
      ],
      video: {
        title: "Composition vs Inheritance in PHP With Practical Examples - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=djd9zdlzyuA",
        videoId: "djd9zdlzyuA",
        durationLabel: "19:11",
      },
      alternateVideos: [
        {
          title: "SOLID Principles: Do You Really Understand Them?",
          channel: "Alex Hyett",
          url: "https://www.youtube.com/watch?v=kF7rQmSRlq0",
          videoId: "kF7rQmSRlq0",
          durationLabel: "7:04",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-oop-composition-solid-q1",
          prompt: "What is the core argument for composition over inheritance?",
          options: [
            "Inheritance couples a subclass to the parent's implementation, which can change under it; composition couples only to a contract the collaborator promised to keep",
            "Composition dispatches faster at runtime",
            "Static analysers cannot follow inheritance chains",
            "Composition removes the need for interfaces",
          ],
          correctIndex: 0,
          explanation:
            "It is about which changes can break you. A parent's private refactor can break every child; a collaborator behind an interface can only break you by breaking the interface.",
        },
        {
          id: "php-oop-composition-solid-q2",
          prompt: "Which of these are signs that an inheritance hierarchy should have been composition? (Select all that apply.)",
          options: [
            "A subclass overrides a method purely to throw \"not supported\"",
            "The base class has grown `protected` flags that switch behaviour per child",
            "You need behaviour from two unrelated base classes at once",
            "The base class declares a constructor",
            "Subclasses add public methods of their own",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are all the hierarchy telling you the subtypes are not really subtypes. A constructor and extra public methods on a subclass are perfectly normal.",
        },
        {
          id: "php-oop-composition-solid-q3",
          prompt: "`Square extends Rectangle` overrides `setWidth()` so that it also sets the height. Which principle does that break, and why?",
          options: [
            "Liskov substitution — code written against `Rectangle` can no longer set width and height independently",
            "Single responsibility — `Square` now does two things",
            "Interface segregation — `Rectangle` exposes too many methods",
            "None; it is a legitimate specialisation",
          ],
          correctIndex: 0,
          explanation:
            "A `Square` is a square mathematically but not a substitutable `Rectangle` behaviourally, because it silently narrows a promise callers rely on. Substitutability is about behaviour, not about taxonomy.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-composition-solid-q4",
          prompt: "What does \"depend on abstractions, not concretions\" look like in a Laravel application?",
          options: [
            "Type-hint an interface in the constructor and let the container resolve the binding, so the implementation can change without touching the consumer",
            "Use facades everywhere so nothing needs injecting",
            "Declare every class `final`",
            "Call `app()` inside methods instead of taking constructor parameters",
          ],
          correctIndex: 0,
          explanation:
            "The container's job is to be the one place that knows which concrete class satisfies which contract. Consumers stay ignorant, which is what makes swapping and faking cheap.",
        },
        {
          id: "php-oop-composition-solid-q5",
          prompt:
            "A `NotificationChannel` interface declares `send()`, `sendBulk()`, `schedule()` and `cancel()`. Two of the four implementations throw from `schedule()` and `cancel()`. What does interface segregation suggest?",
          options: [
            "Split it: a small contract everyone implements, plus a `Schedulable` contract only some do",
            "Move `schedule()` and `cancel()` into an abstract base class with empty default bodies",
            "Add a `supportsScheduling(): bool` that callers must check first",
            "Mark the two limited implementations `final` so nobody extends them",
          ],
          correctIndex: 0,
          explanation:
            "Splitting lets the type system say which channels can be scheduled. A capability boolean pushes the same branch back onto every caller, and empty default bodies just hide the failure instead of throwing it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-oop-composition-solid-q6",
          prompt: "Single responsibility is usually quoted as \"a class should do one thing\". What is the more useful formulation?",
          options: [
            "A class should have one reason to change — one stakeholder or policy that can force an edit",
            "A class should expose at most one public method",
            "A class should stay under about a hundred lines",
            "A class should depend on at most one other class",
          ],
          correctIndex: 0,
          explanation:
            "\"One thing\" is unfalsifiable at any level of zoom. \"One reason to change\" is testable: if the finance team and the marketing team can both force you to edit the same class, it has two responsibilities.",
        },
        {
          id: "php-oop-composition-solid-q7",
          prompt: "Which of these are composition rather than inheritance-style reuse? (Select all that apply.)",
          options: [
            "Constructor-injecting a `LoggerInterface` and calling `$this->logger->info(...)`",
            "Holding a collection of `Rule` objects and running each in turn",
            "Wrapping a `Cache` in a `LoggingCache` that implements the same interface",
            "`use SoftDeletes;` in an Eloquent model",
            "`class InvoicePdf extends Pdf`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A trait is horizontal reuse flattened at link time — closer to inheritance than composition, because there is no object to swap and no type to point at. The decorator in the third option is composition at its most literal.",
        },
        {
          id: "php-oop-composition-solid-q8",
          prompt: "What does open/closed mean in day-to-day terms?",
          options: [
            "You can add a behaviour by adding a class, without editing the code that dispatches to it",
            "Classes should be `final` and never edited again",
            "Every property should be `readonly`",
            "Every class should have a matching interface",
          ],
          correctIndex: 0,
          explanation:
            "The test is whether adding the fourth payment gateway means touching the three files that already handle gateways. If it does, the dispatch point is not closed.",
        },
        {
          id: "php-oop-composition-solid-q9",
          prompt: "When is inheritance still the right tool?",
          options: [
            "When the subtype genuinely *is* the supertype and the shared base is small and stable — a framework base controller, an abstract test case",
            "Whenever two classes share any code at all",
            "Whenever you need a type to check with `instanceof`",
            "Never — traits and interfaces cover every case",
          ],
          correctIndex: 0,
          explanation:
            "Interfaces already give you `instanceof`, and shared code alone is a terrible reason to bind two classes together. A small, stable base that every subtype truly satisfies is the case inheritance was designed for.",
        },
        {
          id: "php-oop-composition-solid-q10",
          prompt: "What do you lose by calling `app(PaymentGateway::class)` inside a method instead of injecting it?",
          options: [
            "The dependency disappears from the constructor signature, so the class no longer declares what it needs and cannot be built without a live container",
            "The ability to bind an interface to a concrete class",
            "Autoloading, because `app()` bypasses Composer's class map",
            "Type declarations, because the container cannot resolve typed parameters",
          ],
          correctIndex: 0,
          explanation:
            "This is the service locator anti-pattern: the container still resolves the same class, but the dependency is now invisible to readers, to static analysis and to any test that wants to construct the object directly.",
        },
        {
          id: "php-oop-composition-solid-q11",
          prompt:
            "A `Report` base class has six subclasses. Three override `render()` completely, two call `parent::render()` and post-process the result, one uses the base version — and new report types keep arriving. What is the most defensible refactor?",
          options: [
            "Extract a `Renderer` interface, inject a renderer into a single concrete `Report`, and delete the hierarchy",
            "Declare `render()` abstract in the base so every subclass must implement it",
            "Move the base `render()` into a trait that the three full-overriders do not use",
            "Mark the base class `final` and duplicate it per report type",
          ],
          correctIndex: 0,
          explanation:
            "Making it abstract fixes the symptom while keeping six classes coupled to one base, and a trait moves the same code with no type to swap. Rendering is a strategy varying independently of what a report *is* — which is the textbook signal to compose it in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
