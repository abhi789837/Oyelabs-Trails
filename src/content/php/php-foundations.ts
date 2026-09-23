import type { Module } from "@/types/curriculum";

export default {
  id: "php-foundations",
  trackId: "php",
  name: "PHP Foundations",
  description:
    "The language itself, at the level a Laravel developer needs when the framework stops helping. Types, comparison, arrays, functions and error handling — with the behaviours that catch people who learned PHP inside a framework.",
  refs: [
    { label: "PHP Manual: Language Reference", url: "https://www.php.net/manual/en/langref.php", kind: "docs" },
    { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
    { label: "PHP Watch: version-by-version changes", url: "https://php.watch/versions/8.4", kind: "article" },
  ],
  topics: [
    {
      id: "php-syntax-variables",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Syntax, Variables and Data Types",
      summary:
        "PHP is dynamically typed with a small set of scalar types (`bool`, `int`, `float`, `string`), two composite types (`array`, `object`), and two special ones (`null`, `resource`). Variables are not declared, they spring into existence on assignment, and nothing stops the same variable holding an `int` and then an array. That flexibility is why PHP is fast to write and why large PHP codebases eventually add type declarations everywhere.\n\nThe part worth internalising early is that PHP has no reference semantics for scalars and copy-on-write for everything else. Assigning an array copies it — logically, at least; the engine defers the actual copy until one side is written to, so passing a large array to a function is cheap until that function modifies it. Objects are the exception: `$b = $a` on an object copies the *handle*, not the object, which is why two variables can point at the same object and why `clone` exists.\n\nThe gotcha that bites everyone once: an undefined variable is a warning and evaluates to `null`, not an error. Before PHP 8 it was a notice most projects suppressed, so typos silently produced `null` and the bug surfaced three layers away. It is still only a warning — which is one of the strongest arguments for running with a static analyser.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Types", url: "https://www.php.net/manual/en/language.types.php", kind: "docs" },
        { label: "PHP Manual: Variable basics", url: "https://www.php.net/manual/en/language.variables.basics.php", kind: "docs" },
        { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
      ],
      video: {
        title: "PHP Fundamentals [FULL COURSE]",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=EX3qQqdm16I",
        videoId: "EX3qQqdm16I",
        startSeconds: 230,
        chapterLabel: "Variables & Types",
        durationLabel: "1:14:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-syntax-variables-q1",
          prompt: "What does this output?\n\n```php\n$a = [1, 2, 3];\n$b = $a;\n$b[] = 4;\necho count($a);\n```",
          options: ["`3`", "`4`", "`0`", "It raises a warning"],
          correctIndex: 0,
          explanation:
            "Arrays are value types in PHP: `$b = $a` is a copy. The engine defers the physical copy until a write happens, but the semantics are a copy either way, so `$a` still has three elements.",
        },
        {
          id: "php-syntax-variables-q2",
          prompt: "And this?\n\n```php\nclass Box { public int $n = 1; }\n$a = new Box();\n$b = $a;\n$b->n = 5;\necho $a->n;\n```",
          options: ["`5`", "`1`", "`0`", "It raises a warning"],
          correctIndex: 0,
          explanation:
            "Objects are the exception to PHP's copy semantics: `$b = $a` copies the handle, so both variables refer to the same object. `clone $a` is what makes a second object.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-syntax-variables-q3",
          prompt: "What happens when you read a variable that was never assigned?",
          options: [
            "A warning is raised and the expression evaluates to `null`",
            "A `TypeError` is thrown",
            "A fatal error stops the script",
            "It evaluates to an empty string with no diagnostic",
          ],
          correctIndex: 0,
          explanation:
            "It is a warning — raised from a notice in PHP 8.0 — and the value is `null`. Because it does not stop execution, a typo can travel a long way before it causes a visible failure, which is why static analysis earns its keep in PHP.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-syntax-variables-q4",
          prompt: "Which of these are true of PHP's scalar types? (Select all that apply.)",
          options: [
            "`int` and `float` are distinct types, and `1` is not identical to `1.0`",
            "There is no separate character type — a single character is a one-character string",
            "`PHP_INT_MAX + 1` becomes a float rather than overflowing",
            "`bool` is stored as a one-byte integer and can be compared with `===` to `1`",
            "Strings are immutable, so `$s[0] = 'x'` throws",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`1 === 1.0` is false because the types differ. PHP has no char type. Integer overflow promotes to float rather than wrapping. But `true === 1` is false — `bool` is its own type — and strings are mutable by offset, so `$s[0] = 'x'` works.",
        },
        {
          id: "php-syntax-variables-q5",
          prompt: "What does `var_dump(0.1 + 0.2 == 0.3);` print?",
          options: ["`bool(false)`", "`bool(true)`", "`float(0.3)`", "It raises a warning about float comparison"],
          correctIndex: 0,
          explanation:
            "PHP floats are IEEE-754 doubles, so 0.1 + 0.2 is very slightly more than 0.3. Compare floats with a tolerance, or use integers (paise, cents) for money.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-syntax-variables-q6",
          prompt:
            "What is printed?\n\n```php\n$name = 'world';\necho \"Hello $name\\n\";\necho 'Hello $name\\n';\n```",
          options: [
            "`Hello world` on one line, then the literal `Hello $name\\n`",
            "`Hello world` twice, on two lines",
            "The literal `Hello $name\\n` twice",
            "A parse error on the second line",
          ],
          correctIndex: 0,
          explanation:
            "Double quotes interpolate variables and interpret escape sequences; single quotes do neither, except for `\\'` and `\\\\`. The single-quoted line prints the dollar sign and a literal backslash-n.",
        },
        {
          id: "php-syntax-variables-q7",
          prompt: "What does `gettype(null)` return, and what is `null` used for in PHP?",
          options: [
            "`\"NULL\"` — it is its own type with exactly one value, meaning \"no value\"",
            "`\"boolean\"` — `null` is an alias for `false`",
            "`\"string\"` — `null` is the empty string",
            "`\"unknown type\"` — `null` has no type",
          ],
          correctIndex: 0,
          explanation:
            "`null` is a distinct type whose only value is `null`. It compares loosely equal to `false`, `0` and `\"\"`, which is a separate matter from being the same type as them.",
        },
        {
          id: "php-syntax-variables-q8",
          prompt:
            "A function takes a large array and only reads it. Is passing it by value expensive?\n\n```php\nfunction total(array $rows): int { /* only reads $rows */ }\n```",
          options: [
            "No — copy-on-write means no copy happens until something writes to it",
            "Yes — the whole array is duplicated on every call",
            "Yes, but only if the array has more than 1,000 elements",
            "No, because array parameters are always passed by reference",
          ],
          correctIndex: 0,
          explanation:
            "The engine shares the underlying storage and refcounts it; a copy only materialises when one side writes. Adding `&` to force a reference would allow the function to mutate the caller's array, which is a different decision from a performance one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-syntax-variables-q9",
          prompt: "Which are valid ways to define a constant that is visible everywhere? (Select all that apply.)",
          options: [
            "`define('MAX', 10);`",
            "`const MAX = 10;` at the top level of a file",
            "`$MAX = 10;` at the top level of a file",
            "`static MAX = 10;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`define()` runs at runtime and can take a computed value; `const` is compile-time, cannot be conditional, and is namespaced. A top-level variable is not global inside a function without `global` or `$GLOBALS`, and `static` is not a constant declaration.",
        },
        {
          id: "php-syntax-variables-q10",
          prompt: "What is `PHP_EOL` for, and why does it exist?",
          options: [
            "The platform's line terminator, so CLI output is correct on both Unix and Windows",
            "The end-of-file marker PHP appends to every script",
            "A constant that terminates the script when echoed",
            "The maximum line length PHP will output",
          ],
          correctIndex: 0,
          explanation:
            "It is `\\n` on Unix and `\\r\\n` on Windows. It matters for CLI tools and generated files; for HTML output the browser does not care, so plain `\\n` is fine there.",
        },
      ],
    },

    {
      id: "php-operators-comparison",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Operators, Comparison and Type Juggling",
      summary:
        "PHP's loose comparison (`==`) converts operands before comparing, and the rules for what converts to what are the single largest source of surprising PHP behaviour. PHP 8 fixed the worst of it: comparing a number with a non-numeric string now converts the *number* to a string rather than the string to a number, so `0 == \"foo\"` is `false` where it used to be `true`. That one change quietly fixed a class of authentication bugs.\n\nWhat did not change is that two numeric strings are still compared numerically, so `\"10\" == \"1e1\"` and `\"01\" == \"1\"` are both true — which matters the moment you compare identifiers that happen to look like numbers. And `null`, `false`, `0`, `\"\"` and `[]` are all loosely equal to each other in most pairings, but `null == \"0\"` is false because `\"0\"` is a non-empty string compared against `null` as a string.\n\nThe practical rule is to use `===` unless you have a specific reason not to, and to be deliberate about functions whose comparison mode is loose by default — `in_array()` and `array_search()` take a third `strict` argument that almost every codebase should be passing `true`.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Type juggling", url: "https://www.php.net/manual/en/language.types.type-juggling.php", kind: "docs" },
        { label: "PHP Manual: Comparison tables", url: "https://www.php.net/manual/en/types.comparisons.php", kind: "docs" },
        { label: "PHP Watch: Saner string-to-number comparison", url: "https://php.watch/versions/8.0/string-number-comparison", kind: "article" },
      ],
      video: {
        title: "🔥 PHP Full Course 2025 - Learn PHP from Scratch | PHP Tutorial for Beginners 🚀",
        channel: "Dani Krossing",
        url: "https://www.youtube.com/watch?v=l4_Vn-sTBL8",
        videoId: "l4_Vn-sTBL8",
        startSeconds: 5055,
        chapterLabel: "7. Operators in PHP",
        durationLabel: "9:46:42",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-operators-comparison-q1",
          prompt: "On PHP 8, what does this output?\n\n```php\nvar_dump(0 == \"foo\");\n```",
          options: ["`bool(false)`", "`bool(true)`", "`bool(null)`", "A TypeError"],
          correctIndex: 0,
          explanation:
            "PHP 8 compares a number with a non-numeric string by converting the number to a string, so this is `\"0\" == \"foo\"`, which is false. On PHP 7 it was true, because `\"foo\"` was converted to `0`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-operators-comparison-q2",
          prompt: "What does this output on PHP 8?\n\n```php\nvar_dump(\"10\" == \"1e1\");\nvar_dump(\"abc\" == 0);\n```",
          options: [
            "`bool(true)` then `bool(false)`",
            "`bool(false)` then `bool(false)`",
            "`bool(true)` then `bool(true)`",
            "`bool(false)` then `bool(true)`",
          ],
          correctIndex: 0,
          explanation:
            "Two *numeric* strings are still compared numerically, and `\"1e1\"` is numeric, so the first is true. The second is the PHP 8 change: a non-numeric string against a number compares as strings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-operators-comparison-q3",
          prompt: "Which of these evaluate to `true` on PHP 8? (Select all that apply.)",
          options: [
            "`null == false`",
            "`[] == false`",
            "`\"0\" == false`",
            "`null == \"0\"`",
            "`\"0.0\" == false`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`null`, an empty array and the string `\"0\"` are all falsy and compare equal to `false`. But `null == \"0\"` is false — `null` is compared with a string as `\"\"`, and `\"\" == \"0\"` is false. `\"0.0\"` is a non-empty string that is not `\"0\"`, so it is truthy.",
        },
        {
          id: "php-operators-comparison-q4",
          prompt: "What does this print on PHP 8?\n\n```php\n$roles = ['admin', 'editor'];\nvar_dump(in_array(0, $roles));\n```",
          options: [
            "`bool(false)`",
            "`bool(true)`",
            "`int(0)`",
            "A warning, then `bool(false)`",
          ],
          correctIndex: 0,
          explanation:
            "`in_array` defaults to loose comparison, so this is `0 == 'admin'` — false on PHP 8, but **true on PHP 7**, where it was a real authorisation-bypass pattern. Passing `true` as the third argument makes the intent explicit regardless of version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-operators-comparison-q5",
          prompt: "What is the difference between `==` and `===` for two objects?",
          options: [
            "`==` compares class and property values; `===` requires the same instance",
            "`==` compares only the class; `===` compares property values",
            "They behave identically for objects",
            "`===` is not defined for objects and raises a warning",
          ],
          correctIndex: 0,
          explanation:
            "Two distinct objects of the same class with equal properties are `==` but not `===`. `===` is identity — the same object in memory.",
        },
        {
          id: "php-operators-comparison-q6",
          prompt: "What does the spaceship operator return?\n\n```php\necho 3 <=> 5;\n```",
          options: ["`-1`", "`1`", "`0`", "`false`"],
          correctIndex: 0,
          explanation:
            "`<=>` returns a negative integer, zero, or a positive integer depending on order — exactly what `usort`'s comparator needs, which is what it was introduced for.",
        },
        {
          id: "php-operators-comparison-q7",
          prompt:
            "What is the value of `$result`?\n\n```php\n$config = ['timeout' => 0];\n$result = $config['timeout'] ?: 30;\n```",
          options: [
            "`30`, because `0` is falsy",
            "`0`, because the key exists",
            "`null`",
            "A warning, then `30`",
          ],
          correctIndex: 0,
          explanation:
            "`?:` tests truthiness, and `0` is falsy — a classic way to lose a legitimate zero. `??` tests only for null and would have returned `0`; `array_key_exists` is more explicit still.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-operators-comparison-q8",
          prompt: "Which statements about `??` and `?->` are true? (Select all that apply.)",
          options: [
            "`??` returns the right operand only when the left is null or undefined",
            "`?->` short-circuits the whole chain and evaluates to null if the left is null",
            "`??` suppresses the undefined-index warning that `isset` would otherwise be needed for",
            "`?->` also suppresses errors thrown by the method it calls",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The null-coalescing operator is null-aware, not truthiness-aware, and is isset-safe. The nullsafe operator short-circuits the rest of the chain — but only on a null receiver; an exception from inside the method still propagates.",
        },
        {
          id: "php-operators-comparison-q9",
          prompt: "What does `\"5\" + \"5\"` evaluate to, and what does `\"5\" . \"5\"` evaluate to?",
          options: [
            "`10` (int) and `\"55\"` (string)",
            "`\"55\"` (string) and `\"55\"` (string)",
            "`10` (int) and `10` (int)",
            "A TypeError on the first",
          ],
          correctIndex: 0,
          explanation:
            "`+` is arithmetic only — PHP has no string `+`, which is why `.` exists for concatenation. Numeric strings are coerced for arithmetic; a non-numeric string in `+` is a `TypeError` on PHP 8.",
        },
        {
          id: "php-operators-comparison-q10",
          prompt: "On PHP 8, what does `\"abc\" + 1` do?",
          options: [
            "Throws a `TypeError`",
            "Evaluates to `1` with a warning",
            "Evaluates to `0`",
            "Evaluates to the string `\"abc1\"`",
          ],
          correctIndex: 0,
          explanation:
            "Arithmetic on a wholly non-numeric string is a `TypeError` from PHP 8. A *leading*-numeric string like `\"5 apples\"` is still allowed with a warning, which is a separate case worth knowing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "php-arrays",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Arrays: PHP's One Data Structure",
      summary:
        "A PHP array is an ordered hash map. It is a list, a dictionary, a set, a stack and a queue, and the language leans on it for everything — which is why `array_*` has over eighty functions and why knowing a dozen of them well is most of what day-to-day PHP looks like.\n\nThe behaviour to internalise is key handling. Integer keys and string keys coexist, insertion order is preserved, and numeric-looking string keys are silently converted to integers: `$a[\"1\"]` and `$a[1]` are the same slot. `array_merge()` renumbers integer keys and appends; the `+` operator keeps the left operand's keys and ignores duplicates from the right. Choosing the wrong one silently drops or reorders data, and it is a common source of bugs in configuration merging.\n\nThe classic trap is `foreach ($items as &$item)`. The reference survives the loop, so a second `foreach` over the same variable name overwrites the last element. As of PHP 8.0 all sort functions are stable, which removes an older class of surprise — but `usort` still takes a comparator returning an integer, not a boolean, and returning `true`/`false` from it produces subtly wrong orderings.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Arrays", url: "https://www.php.net/manual/en/language.types.array.php", kind: "docs" },
        { label: "PHP Manual: Array functions", url: "https://www.php.net/manual/en/ref.array.php", kind: "docs" },
        { label: "PHP Manual: foreach", url: "https://www.php.net/manual/en/control-structures.foreach.php", kind: "docs" },
      ],
      video: {
        title: "PHP Fundamentals [FULL COURSE]",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=EX3qQqdm16I",
        videoId: "EX3qQqdm16I",
        startSeconds: 533,
        chapterLabel: "Arrays",
        durationLabel: "1:14:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-arrays-q1",
          prompt: "What does this print?\n\n```php\n$a = [];\n$a[\"1\"] = 'x';\n$a[1] = 'y';\necho count($a);\n```",
          options: ["`1`", "`2`", "`0`", "It raises a warning"],
          correctIndex: 0,
          explanation:
            "A string key that is a canonical decimal integer is converted to an integer, so both writes hit the same slot. `\"01\"` and `\"1.0\"` are *not* canonical and would stay strings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q2",
          prompt:
            "What is `$result`?\n\n```php\n$defaults = ['a' => 1, 'b' => 2];\n$user     = ['b' => 9, 'c' => 3];\n$result   = $defaults + $user;\n```",
          options: [
            "`['a' => 1, 'b' => 2, 'c' => 3]`",
            "`['a' => 1, 'b' => 9, 'c' => 3]`",
            "`['b' => 9, 'c' => 3, 'a' => 1]`",
            "`['a' => 1, 'b' => 2]`",
          ],
          correctIndex: 0,
          explanation:
            "The `+` operator keeps the **left** operand's value for any duplicate key, so `b` stays 2. `array_merge($defaults, $user)` is the other way round and would give `b => 9` — which is usually what people actually want.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q3",
          prompt:
            "What does this output?\n\n```php\n$a = ['x', 'y', 'z'];\nforeach ($a as &$v) {}\nforeach ($a as $v) {}\nprint_r($a);\n```",
          options: [
            "`['x', 'y', 'y']`",
            "`['x', 'y', 'z']`",
            "`['z', 'z', 'z']`",
            "`['x', 'x', 'x']`",
          ],
          correctIndex: 0,
          explanation:
            "After the first loop `$v` is still a reference to the last element. The second loop assigns each value to `$v` in turn, overwriting element 2: it becomes 'x', then 'y', then itself. `unset($v)` after a by-reference foreach avoids this entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q4",
          prompt: "Which are true of `array_merge` and `+`? (Select all that apply.)",
          options: [
            "`array_merge` renumbers integer keys sequentially from zero",
            "`+` preserves the left operand's keys and never overwrites them",
            "`array_merge` lets later arrays overwrite earlier ones for string keys",
            "`+` renumbers integer keys the same way `array_merge` does",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "That difference in integer-key handling is the whole reason both exist. `+` never renumbers — it is a union that keeps the left side.",
        },
        {
          id: "php-arrays-q5",
          prompt: "What should a `usort` comparator return?",
          options: [
            "A negative integer, zero, or a positive integer",
            "`true` if the first argument should come first, `false` otherwise",
            "The element that should come first",
            "A float between -1 and 1",
          ],
          correctIndex: 0,
          explanation:
            "Returning a boolean is a common bug: `false` becomes 0 (\"equal\") and `true` becomes 1, so the sort loses the \"comes before\" case entirely and the result is subtly wrong rather than obviously broken. `<=>` returns exactly the right shape.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q6",
          prompt: "What does `array_filter` do with keys, by default?",
          options: [
            "It preserves the original keys, leaving gaps in a list",
            "It renumbers the result from zero",
            "It drops string keys and keeps integer keys",
            "It sorts the keys before returning",
          ],
          correctIndex: 0,
          explanation:
            "Filtering a list leaves holes — `[0 => 'a', 2 => 'c']` — which then serialises to a JSON *object* rather than an array. `array_values()` on the result is the usual fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q7",
          prompt: "Which call sums the `amount` field of every row?\n\n```php\n$rows = [['amount' => 5], ['amount' => 7]];\n```",
          options: [
            "`array_sum(array_column($rows, 'amount'))`",
            "`array_sum($rows, 'amount')`",
            "`array_reduce($rows, 'amount')`",
            "`array_map($rows, 'amount')`",
          ],
          correctIndex: 0,
          explanation:
            "`array_column` pulls one field out of a list of rows — it also works on arrays of objects. `array_sum` takes only the array.",
        },
        {
          id: "php-arrays-q8",
          prompt: "As of PHP 8.0, are PHP's sort functions stable?",
          options: [
            "Yes — equal elements keep their original relative order",
            "No — equal elements may be reordered arbitrarily",
            "Only `usort` is stable; `sort` is not",
            "Only when the array has fewer than 16 elements",
          ],
          correctIndex: 0,
          explanation:
            "PHP 8.0 made every sort stable. Before that, sorting by one field could scramble rows that tied on it, so code that sorted twice to get a secondary ordering was unreliable.",
        },
        {
          id: "php-arrays-q9",
          prompt: "What is the difference between `isset($a['k'])` and `array_key_exists('k', $a)`?",
          options: [
            "`isset` returns false when the value is null; `array_key_exists` returns true",
            "They are identical",
            "`array_key_exists` is faster but does not work on string keys",
            "`isset` throws if the key is missing",
          ],
          correctIndex: 0,
          explanation:
            "`isset` answers \"is there a non-null value here\", which is usually what you want and is faster. When null is a meaningful stored value, only `array_key_exists` can tell it apart from absence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-arrays-q10",
          prompt: "What does the spread operator do with string keys?\n\n```php\n$a = ['x' => 1];\n$b = [...$a, 'y' => 2];\n```",
          options: [
            "It works, and `$b` is `['x' => 1, 'y' => 2]` — string keys are supported from PHP 8.1",
            "It throws a fatal error: string keys cannot be unpacked",
            "It silently drops the string key",
            "It converts `'x'` to `0`",
          ],
          correctIndex: 0,
          explanation:
            "String-key unpacking arrived in PHP 8.1. Before that, `...` on an array with string keys was a fatal error, which is worth remembering when reading older code.",
        },
      ],
    },

    {
      id: "php-strings-functions",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Strings and the Built-in Function Library",
      summary:
        "PHP's string functions are byte-oriented by default. `strlen()` returns bytes, not characters, and `substr()` can cut a multi-byte character in half and produce invalid UTF-8. For anything that might hold a name, an address or user input — which is almost everything — the `mb_*` family is the correct choice, and treating that as the default rather than the exception saves a whole category of bug.\n\nThe library is also famously inconsistent: `strpos($haystack, $needle)` but `in_array($needle, $haystack)`; `str_replace` with search first but `preg_replace` with pattern first. There is no rule to derive it from, so the practical advice is to check the signature rather than trust memory, and to prefer the newer `str_contains()`, `str_starts_with()` and `str_ends_with()` (PHP 8.0) over the `strpos() !== false` idiom they replaced.\n\nThat idiom is worth understanding even so, because it is everywhere in older code and it has a real trap: `strpos()` returns `0` when the needle is at the start, and `0` is falsy, so `if (strpos($s, $n))` is wrong in exactly the case you would least expect to be wrong.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: String functions", url: "https://www.php.net/manual/en/ref.strings.php", kind: "docs" },
        { label: "PHP Manual: String operators", url: "https://www.php.net/manual/en/language.operators.string.php", kind: "docs" },
        { label: "PHP: The Right Way — UTF-8", url: "https://phptherightway.com/", kind: "article" },
      ],
      video: {
        title: "🔥 PHP Full Course 2025 - Learn PHP from Scratch | PHP Tutorial for Beginners 🚀",
        channel: "Dani Krossing",
        url: "https://www.youtube.com/watch?v=l4_Vn-sTBL8",
        videoId: "l4_Vn-sTBL8",
        startSeconds: 10974,
        chapterLabel: "11. Built-in functions in PHP",
        durationLabel: "9:46:42",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-strings-functions-q1",
          prompt: "What is the bug here?\n\n```php\nif (strpos($path, '/admin')) {\n    denyAccess();\n}\n```",
          options: [
            "`strpos` returns `0` when the match is at position zero, and `0` is falsy",
            "`strpos` returns `null` when there is no match",
            "The arguments are in the wrong order",
            "`strpos` is case-insensitive, so it matches too much",
          ],
          correctIndex: 0,
          explanation:
            "A path that *starts* with `/admin` returns 0, which is falsy, so access is allowed — the exact opposite of the intent. `str_starts_with($path, '/admin')` says what is meant and has no such trap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-strings-functions-q2",
          prompt: "What does `strlen('café')` return, assuming the file is UTF-8?",
          options: ["`5`", "`4`", "`3`", "It depends on the locale"],
          correctIndex: 0,
          explanation:
            "`strlen` counts bytes, and `é` is two bytes in UTF-8. `mb_strlen('café')` returns 4. This is why a \"max 20 characters\" check with `strlen` rejects shorter names than intended.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-strings-functions-q3",
          prompt: "Which of these are safe on multi-byte text? (Select all that apply.)",
          options: [
            "`mb_substr()`",
            "`mb_strtoupper()`",
            "`str_replace()` when both needle and replacement are valid UTF-8",
            "`ucfirst()`",
            "`strrev()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`str_replace` is byte-based but safe here, because UTF-8 is self-synchronising: a valid sequence cannot appear inside another. `ucfirst` and `strrev` operate on single bytes and will corrupt multi-byte characters.",
        },
        {
          id: "php-strings-functions-q4",
          prompt: "What is the difference between `echo` and `print`?",
          options: [
            "`echo` takes multiple arguments and returns nothing; `print` takes one and returns `1`",
            "`print` is faster because it is a function",
            "`echo` escapes HTML; `print` does not",
            "They are aliases with identical behaviour",
          ],
          correctIndex: 0,
          explanation:
            "Because `print` returns a value it can be used in an expression, which is the only practical difference. Neither escapes anything — that is what `htmlspecialchars()` is for.",
        },
        {
          id: "php-strings-functions-q5",
          prompt: "What does this output?\n\n```php\nprintf('%05.2f', 3.14159);\n```",
          options: ["`03.14`", "`3.14`", "`3.14159`", "`00003`"],
          correctIndex: 0,
          explanation:
            "`%05.2f` means: pad with zeros to a total width of 5, with 2 decimal places. `sprintf` is the same thing returning a string, which is what you usually want.",
        },
        {
          id: "php-strings-functions-q6",
          prompt: "Which is the correct way to build a string safely for HTML output?",
          options: [
            "`htmlspecialchars($value, ENT_QUOTES, 'UTF-8')`",
            "`strip_tags($value)`",
            "`addslashes($value)`",
            "`urlencode($value)`",
          ],
          correctIndex: 0,
          explanation:
            "`htmlspecialchars` with `ENT_QUOTES` escapes both quote styles, which matters inside an attribute. `strip_tags` removes markup rather than escaping it and is not an XSS defence; `addslashes` is for a different context entirely, and not a safe one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-strings-functions-q7",
          prompt: "What does heredoc syntax give you that a double-quoted string does not?",
          options: [
            "Multi-line text with interpolation and no need to escape quotes",
            "Automatic HTML escaping",
            "Compile-time constant folding",
            "Protection against SQL injection",
          ],
          correctIndex: 0,
          explanation:
            "Heredoc (`<<<EOT`) interpolates like double quotes; nowdoc (`<<<'EOT'`) is the single-quoted equivalent and interpolates nothing. Neither escapes anything.",
        },
        {
          id: "php-strings-functions-q8",
          prompt: "What does `trim()` remove by default?",
          options: [
            "Spaces, tabs, newlines, carriage returns, null bytes and vertical tabs, from both ends",
            "Only spaces, from both ends",
            "All whitespace anywhere in the string",
            "Only trailing whitespace",
          ],
          correctIndex: 0,
          explanation:
            "The default character list is `\" \\t\\n\\r\\0\\x0B\"`. Note what is *not* in it: a non-breaking space, which is what you get when someone pastes from a word processor and the trim appears not to work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-strings-functions-q9",
          prompt: "Which PHP 8.0 functions replace the `strpos() !== false` idiom? (Select all that apply.)",
          options: ["`str_contains()`", "`str_starts_with()`", "`str_ends_with()`", "`str_includes()`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Those three landed in PHP 8.0. There is no `str_includes` — that is the JavaScript name, and mixing the two up is a common slip when moving between the languages.",
        },
        {
          id: "php-strings-functions-q10",
          prompt: "Why prefer `implode()` over repeated concatenation in a loop?",
          options: [
            "It expresses the intent, and avoids building and discarding intermediate strings",
            "Concatenation in a loop is a syntax error in PHP 8",
            "`implode` is the only way to join an array",
            "Concatenation cannot handle more than 255 operations",
          ],
          correctIndex: 0,
          explanation:
            "PHP's strings are mutable internally so repeated concatenation is not as catastrophic as in some languages, but `implode` still reads better and avoids the trailing-separator dance. Clarity is the main argument, not speed.",
        },
      ],
    },

    {
      id: "php-functions",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Functions, Arguments and Scope",
      summary:
        "PHP functions do not close over the enclosing scope. A function body cannot see `$x` from the file that defined it unless `$x` is passed in, declared `global`, or captured with `use` in a closure. That is the opposite of JavaScript and it surprises people moving between the two — and it is a deliberate design choice, because it makes a function's inputs explicit.\n\nClosures capture by value with `use ($x)` and by reference with `use (&$x)`. The by-value capture happens at the moment the closure is *created*, not when it is called, so a closure created in a loop captures the value at that iteration. Arrow functions (`fn() => …`, PHP 7.4) capture the enclosing scope automatically and by value, which makes short callbacks much less noisy but also means they cannot mutate an outer variable.\n\nThe subtlety worth knowing is `static` inside a function: a static local keeps its value between calls, which is occasionally exactly right for memoisation and more often a hidden global that makes the function untestable. First-class callable syntax (`strlen(...)`, PHP 8.1) replaced the string and array callable forms, and is both faster and checkable by static analysis.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Functions", url: "https://www.php.net/manual/en/language.functions.php", kind: "docs" },
        { label: "PHP Manual: Function arguments", url: "https://www.php.net/manual/en/functions.arguments.php", kind: "docs" },
        { label: "PHP Manual: Anonymous functions", url: "https://www.php.net/manual/en/functions.anonymous.php", kind: "docs" },
      ],
      video: {
        title: "PHP Fundamentals [FULL COURSE]",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=EX3qQqdm16I",
        videoId: "EX3qQqdm16I",
        startSeconds: 948,
        chapterLabel: "Functions",
        durationLabel: "1:14:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-functions-q1",
          prompt: "What does this output?\n\n```php\n$name = 'Priya';\nfunction greet() {\n    echo $name ?? 'nobody';\n}\ngreet();\n```",
          options: [
            "`nobody`, because functions do not see the enclosing scope",
            "`Priya`, because top-level variables are global",
            "A fatal error: undefined variable",
            "An empty string",
          ],
          correctIndex: 0,
          explanation:
            "PHP functions have their own scope and do not close over the file they are defined in. `global $name;` or passing it as a parameter would work — the second being the one worth reaching for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-functions-q2",
          prompt: "What does this print?\n\n```php\n$n = 1;\n$f = function () use ($n) { return $n; };\n$n = 99;\necho $f();\n```",
          options: ["`1`", "`99`", "`0`", "A notice, then nothing"],
          correctIndex: 0,
          explanation:
            "`use ($n)` captures by value at the moment the closure is created. `use (&$n)` would capture by reference and print 99.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-functions-q3",
          prompt: "Which are true of arrow functions (`fn`)? (Select all that apply.)",
          options: [
            "They capture the enclosing scope automatically, by value",
            "They are limited to a single expression, which is implicitly returned",
            "They cannot modify an outer variable",
            "They capture by reference, so an outer variable can be mutated",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Automatic by-value capture is what makes them terse. When you need a block body or by-reference capture, a full closure is the tool.",
        },
        {
          id: "php-functions-q4",
          prompt: "What does this print?\n\n```php\nfunction counter(): int {\n    static $n = 0;\n    return ++$n;\n}\necho counter() . counter() . counter();\n```",
          options: ["`123`", "`111`", "`000`", "`321`"],
          correctIndex: 0,
          explanation:
            "A `static` local is initialised once and keeps its value across calls. Useful for memoisation, but it is hidden state: the function is no longer a pure function of its arguments, and it is awkward to reset in a test.",
        },
        {
          id: "php-functions-q5",
          prompt: "What happens with this call?\n\n```php\nfunction f(int $a, int $b = 2, int $c = 3) {}\nf(1, c: 9);\n```",
          options: [
            "It works — `$b` keeps its default of 2",
            "A fatal error: named arguments cannot follow positional ones",
            "A fatal error: `$b` has no value",
            "`$c` is ignored",
          ],
          correctIndex: 0,
          explanation:
            "Named arguments (PHP 8.0) may follow positional ones and let you skip optional parameters. The reverse — a positional argument after a named one — is a compile-time error.",
        },
        {
          id: "php-functions-q6",
          prompt: "What does the variadic `...` do here?\n\n```php\nfunction total(int ...$amounts): int {\n    return array_sum($amounts);\n}\n```",
          options: [
            "It collects any number of trailing arguments into an array, each type-checked as `int`",
            "It makes the function accept exactly one array argument",
            "It spreads an array into separate parameters",
            "It marks the function as accepting no arguments",
          ],
          correctIndex: 0,
          explanation:
            "In a declaration `...` collects; at a call site it spreads. The type applies to each collected element, so `total(1, 'x')` is a `TypeError`.",
        },
        {
          id: "php-functions-q7",
          prompt: "What does `strlen(...)` mean in PHP 8.1?",
          options: [
            "First-class callable syntax — it creates a `Closure` wrapping `strlen`",
            "A call to `strlen` with the spread of an undefined array",
            "A syntax error",
            "A forward declaration of `strlen`",
          ],
          correctIndex: 0,
          explanation:
            "It replaces `'strlen'` and `[$obj, 'method']` callables with something static analysis and an IDE can actually check, and it respects visibility at the point of creation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-functions-q8",
          prompt: "What is the effect of `&` here?\n\n```php\nfunction addOne(array &$items): void {\n    $items[] = 1;\n}\n```",
          options: [
            "The caller's array is modified, because the parameter is bound by reference",
            "Nothing — arrays are already passed by reference",
            "The function receives a copy and the `&` is ignored",
            "It makes the parameter optional",
          ],
          correctIndex: 0,
          explanation:
            "Arrays are passed by value (with copy-on-write). `&` opts into mutating the caller's variable — powerful, and worth avoiding unless the mutation is the point of the function, because it makes call sites harder to read.",
        },
        {
          id: "php-functions-q9",
          prompt: "What does a `never` return type mean?",
          options: [
            "The function always throws or exits, and never returns to its caller",
            "The function returns null",
            "The function must not be called more than once",
            "The function has no side effects",
          ],
          correctIndex: 0,
          explanation:
            "`never` (PHP 8.1) is stronger than `void`: it tells the reader and the analyser that control does not come back, so code after the call is unreachable. `void` returns, just with no value.",
        },
        {
          id: "php-functions-q10",
          prompt:
            "What is printed?\n\n```php\n$fns = [];\nforeach ([1, 2, 3] as $n) {\n    $fns[] = fn() => $n;\n}\necho $fns[0]() . $fns[1]() . $fns[2]();\n```",
          options: ["`123`", "`333`", "`111`", "`000`"],
          correctIndex: 0,
          explanation:
            "Each arrow function captures `$n` by value at creation, so each keeps its own iteration's value. This is where PHP differs from the classic JavaScript `var`-in-a-loop trap, which produces `333`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "php-control-flow-match",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Control Flow and `match`",
      summary:
        "`match` (PHP 8.0) is not a tidier `switch`. It differs in three ways that each remove a real bug class: it compares with `===` rather than `==`, it does not fall through so there is no `break` to forget, and it throws `\\UnhandledMatchError` when nothing matches instead of silently doing nothing.\n\nIt is also an *expression*, which is the change that alters how code gets written. `$label = match($status) { … };` assigns directly, so the variable is assigned exactly once and can be `readonly` or a constant-like local. The `switch` equivalent needs a mutable variable initialised before the block, which is how default-case bugs get in.\n\nThe remaining reason to reach for `switch` is fall-through when you genuinely want several cases to share a body — though `match` handles that more clearly with a comma-separated condition list, `match($x) { 1, 2, 3 => 'low', default => 'high' }`. The real trap when converting old code is the strictness: `switch (\"1\")` matched `case 1`, and the `match` equivalent does not.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PHP Manual: match", url: "https://www.php.net/manual/en/control-structures.match.php", kind: "docs" },
        { label: "PHP Manual: switch", url: "https://www.php.net/manual/en/control-structures.switch.php", kind: "docs" },
        { label: "PHP Watch: Match expression", url: "https://php.watch/versions/8.0/match-expression", kind: "article" },
      ],
      video: {
        title: "PHP Match Expression - Match vs Switch - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=jCUyvHUKSmE",
        videoId: "jCUyvHUKSmE",
        durationLabel: "5:08",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-control-flow-match-q1",
          prompt: "What happens here?\n\n```php\n$code = \"1\";\necho match ($code) {\n    1 => 'one',\n    2 => 'two',\n};\n```",
          options: [
            "An `\\UnhandledMatchError` is thrown",
            "It echoes `one`",
            "It echoes nothing",
            "A TypeError is thrown",
          ],
          correctIndex: 0,
          explanation:
            "`match` compares with `===`, and `\"1\" === 1` is false. A `switch` would have matched. This is the single most common surprise when converting a `switch` to a `match`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-control-flow-match-q2",
          prompt: "Which are true of `match` compared with `switch`? (Select all that apply.)",
          options: [
            "It uses strict comparison",
            "It is an expression, so its result can be assigned",
            "It throws when no arm matches and there is no `default`",
            "It falls through to the next arm unless you `break`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "There is no fall-through in `match`, which is why there is no `break`. The throw-on-no-match is the feature that turns \"we forgot a case\" from a silent no-op into a loud failure.",
        },
        {
          id: "php-control-flow-match-q3",
          prompt: "What does this print?\n\n```php\n$n = 2;\nswitch ($n) {\n    case 1:\n    case 2:\n        echo 'low';\n    case 3:\n        echo 'mid';\n        break;\n    default:\n        echo 'high';\n}\n```",
          options: ["`lowmid`", "`low`", "`mid`", "`lowmidhigh`"],
          correctIndex: 0,
          explanation:
            "Case 2 has no `break`, so execution falls through into case 3. The stacked `case 1: case 2:` is intentional fall-through; the missing `break` after `echo 'low'` almost certainly is not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-control-flow-match-q4",
          prompt: "How do you make several values share one result in `match`?",
          options: [
            "Comma-separate the conditions: `1, 2, 3 => 'low'`",
            "Stack the arms with no result, as `switch` does",
            "Use `case 1: case 2:` inside the match",
            "It is not possible; write one arm per value",
          ],
          correctIndex: 0,
          explanation:
            "A comma-separated condition list reads better than stacked cases and cannot be mistaken for accidental fall-through.",
        },
        {
          id: "php-control-flow-match-q5",
          prompt: "What does `match (true)` let you do?",
          options: [
            "Write a chain of arbitrary boolean conditions as an expression",
            "Match any value at all, like a wildcard",
            "Force loose comparison",
            "Nothing — it always throws",
          ],
          correctIndex: 0,
          explanation:
            "Each arm's condition is compared `=== true`, so `match (true) { $n < 10 => 'small', default => 'big' }` is an if/elseif chain that assigns. Useful, and easy to overuse into something less readable than the `if` it replaced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-control-flow-match-q6",
          prompt: "In PHP, which values are falsy? (Select all that apply.)",
          options: ["`\"0\"`", "`[]`", "`0.0`", "`\"false\"`", "`\"0.0\"`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The falsy set is: `false`, `0`, `0.0`, `\"\"`, `\"0\"`, `[]` and `null`. Every other non-empty string — including `\"false\"` and `\"0.0\"` — is truthy, which catches people parsing configuration values.",
        },
        {
          id: "php-control-flow-match-q7",
          prompt: "What is the difference between `continue` and `continue 2` inside nested loops?",
          options: [
            "`continue 2` skips to the next iteration of the outer loop",
            "`continue 2` skips two iterations of the current loop",
            "`continue 2` is a syntax error",
            "They are identical",
          ],
          correctIndex: 0,
          explanation:
            "The number is how many enclosing structures to apply it to, and `break 2` works the same way. Inside a `switch` within a loop, `continue` targets the switch and PHP warns about it — `continue 2` is what people usually mean there.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-control-flow-match-q8",
          prompt: "Why is the alternative syntax (`if: … endif;`) used in templates?",
          options: [
            "It reads better when interleaved with HTML, where a closing brace is easy to lose",
            "It is faster to parse",
            "It is the only syntax allowed outside `<?php ?>` blocks",
            "It automatically escapes output",
          ],
          correctIndex: 0,
          explanation:
            "`<?php endforeach; ?>` names what is ending, which a `}` fifty lines of markup later does not. Blade and Twig exist partly because even this gets unwieldy.",
        },
      ],
    },

    {
      id: "php-named-arguments",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Named Arguments, Defaults and the Nullsafe Operator",
      summary:
        "Named arguments (PHP 8.0) let a call site say which parameter it is filling, which turns `createUser('Priya', true, false, true)` into something readable and removes the need for a parameter object whose only job was to name four booleans. They also let you skip optional parameters in the middle, which previously meant repeating every default up to the one you wanted.\n\nThe cost is that **parameter names become part of your public API**. Renaming a parameter is now a breaking change for any caller using it by name, which matters for library authors and for anything shared across an organisation. Some codebases mark that boundary explicitly with a `@no-named-arguments` annotation.\n\nThe nullsafe operator `?->` short-circuits the *rest of the chain* when the receiver is null — `$order?->customer->address` returns null if `$order` is null, without evaluating anything further. What it does not do is make the call itself safe: an exception thrown inside the method still propagates. It is also only for null receivers, not for missing array keys, which is what `??` is for.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Named arguments", url: "https://www.php.net/manual/en/functions.arguments.php", kind: "docs" },
        { label: "PHP Watch: Named parameters", url: "https://php.watch/versions/8.0/named-parameters", kind: "article" },
        { label: "PHP Manual: Nullsafe operator", url: "https://www.php.net/manual/en/language.oop5.basic.php", kind: "docs" },
      ],
      video: {
        title: "What's new in PHP 8.0 | Learn how to use PHP 8.0's new features with real-world examples",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=ve9bKHZG47c",
        videoId: "ve9bKHZG47c",
        startSeconds: 27,
        chapterLabel: "Named Arguments",
        durationLabel: "21:44",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-named-arguments-q1",
          prompt: "Which call is invalid?\n\n```php\nfunction f(int $a, int $b = 2, int $c = 3) {}\n```",
          options: [
            "`f(a: 1, 5)`",
            "`f(1, c: 9)`",
            "`f(a: 1, c: 9)`",
            "`f(c: 9, a: 1)`",
          ],
          correctIndex: 0,
          explanation:
            "A positional argument may not follow a named one — once you start naming, everything after must be named. Named arguments themselves can be in any order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-named-arguments-q2",
          prompt: "Why is renaming a parameter now a breaking change?",
          options: [
            "Because a caller may be passing it by name",
            "Because PHP stores parameter names in the opcode cache",
            "Because reflection would throw",
            "It is not — parameter names have never been part of the API",
          ],
          correctIndex: 0,
          explanation:
            "Before named arguments, parameter names were documentation. Now they are an interface. For a library this is a real versioning concern, and it is the main argument people raise against the feature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-named-arguments-q3",
          prompt:
            "What does this evaluate to when `$order` is null?\n\n```php\n$city = $order?->customer->address->city;\n```",
          options: [
            "`null`, with nothing after `?->` evaluated",
            "A fatal error on `->customer`",
            "A fatal error on `->address`",
            "An empty string",
          ],
          correctIndex: 0,
          explanation:
            "`?->` short-circuits the whole remaining chain, so the later `->` operators never run. Note that if `$order` is non-null but `customer` is, the plain `->` after it still fails — each link needs its own `?->` if it can be null.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-named-arguments-q4",
          prompt: "Which are true of `?->`? (Select all that apply.)",
          options: [
            "It returns null when the receiver is null",
            "It short-circuits the rest of the chain",
            "It works for method calls as well as property access",
            "It suppresses exceptions thrown inside the method it calls",
            "It works on array access, like `$a?['k']`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is null-receiver handling, not error handling: an exception from inside the method propagates normally. There is no nullsafe array access — `??` covers that case.",
        },
        {
          id: "php-named-arguments-q5",
          prompt: "Can named arguments be used with a variadic parameter?",
          options: [
            "Yes — unmatched named arguments are collected into the variadic with string keys",
            "No — a variadic and named arguments are mutually exclusive",
            "Yes, but the names are discarded",
            "Only if the variadic is the first parameter",
          ],
          correctIndex: 0,
          explanation:
            "`function f(...$rest)` called as `f(a: 1, b: 2)` gives `$rest === ['a' => 1, 'b' => 2]`. It is how some libraries accept arbitrary named options.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-named-arguments-q6",
          prompt: "What is the value of a parameter default evaluated at?",
          options: [
            "Each call, for expressions like `new Foo()`; constants are resolved at compile time",
            "Once, when the file is first parsed",
            "Once per process",
            "Defaults must be literals, so the question does not arise",
          ],
          correctIndex: 0,
          explanation:
            "PHP 8.1 allows `new` in initialisers, and those are evaluated per call — so a default of `new DateTime()` is a fresh object each time, not a shared one. That is the behaviour you want, and it is not what people expect from languages where defaults are evaluated once.",
        },
        {
          id: "php-named-arguments-q7",
          prompt: "What is the practical advantage of named arguments over an options array?",
          options: [
            "The parameters are type-checked and visible to static analysis and IDEs",
            "They are faster at runtime",
            "They allow more than 16 parameters",
            "They make the function callable from JavaScript",
          ],
          correctIndex: 0,
          explanation:
            "An `array $options` bag has no types, no autocompletion and no protection against a typo'd key. Named arguments keep the readability of a bag while the signature stays checkable.",
        },
        {
          id: "php-named-arguments-q8",
          prompt: "Can you use a named argument with a parameter that is passed by reference?",
          options: [
            "Yes, and the reference behaviour is unchanged",
            "No — by-reference parameters must be positional",
            "Yes, but the argument is silently passed by value",
            "Only for the first parameter",
          ],
          correctIndex: 0,
          explanation:
            "Naming an argument does not change how it is bound. The usual by-reference restriction still applies: the argument has to be something referenceable, not a literal or an expression.",
        },
      ],
    },

    {
      id: "php-type-declarations",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Type Declarations and `strict_types`",
      summary:
        "PHP's type declarations are checked at runtime, not compile time, and by default they *coerce*: passing `\"5\"` to an `int $n` parameter silently converts it. `declare(strict_types=1)` turns that off, and a mismatched type becomes a `TypeError` instead. Most serious PHP codebases put it at the top of every file.\n\nThe detail that trips people up is what the declaration actually governs. `strict_types` is **per file, and it applies to calls made *from* that file**, not to calls made *into* it. A strict file calling a non-strict library gets strict checking; a non-strict file calling into a strict library gets coercion. This is deliberate — it lets a codebase adopt strict types file by file without the whole dependency tree having to agree — but it means \"we use strict types\" is a claim about your call sites, not about your functions.\n\nThe type system itself got substantially better: union types (`int|string`) in 8.0, `never` and intersection types (`Countable&ArrayAccess`) in 8.1, and DNF types in 8.2. What it still lacks is generics, which is why array shapes live in docblocks and why PHPStan and Psalm have become effectively part of the language for large projects.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Type declarations", url: "https://www.php.net/manual/en/language.types.declarations.php", kind: "docs" },
        { label: "PHP Manual: Types", url: "https://www.php.net/manual/en/language.types.php", kind: "docs" },
        { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
      ],
      video: {
        title: "PHP Type Declarations: make your PHP code easier to read, and simpler to use",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=Ig0NbYTStxo",
        videoId: "Ig0NbYTStxo",
        durationLabel: "10:53",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-type-declarations-q1",
          prompt:
            "Without `strict_types`, what happens?\n\n```php\nfunction double(int $n): int { return $n * 2; }\necho double(\"5\");\n```",
          options: [
            "It echoes `10` — the string is coerced to an int",
            "A `TypeError` is thrown",
            "It echoes `55`",
            "A warning, then `0`",
          ],
          correctIndex: 0,
          explanation:
            "Coercive mode is the default: a numeric string is converted. With `declare(strict_types=1)` at the top of the *calling* file, this is a `TypeError`.",
        },
        {
          id: "php-type-declarations-q2",
          prompt:
            "`a.php` has `declare(strict_types=1);` and calls a function declared in `b.php`, which does not. Which mode applies?",
          options: [
            "Strict — the setting follows the file making the call",
            "Coercive — the setting follows the file declaring the function",
            "Strict, but only for the return type",
            "It is a fatal error to mix the two",
          ],
          correctIndex: 0,
          explanation:
            "`strict_types` governs the call site. That is what lets a project adopt it file by file — but it also means a library cannot force strictness on its callers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-type-declarations-q3",
          prompt: "Which are true about `declare(strict_types=1)`? (Select all that apply.)",
          options: [
            "It must be the very first statement in the file",
            "It affects calls made from that file",
            "`int` to `float` widening is still allowed even in strict mode",
            "It applies to every file in the project once declared anywhere",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is per file and must come first. The one coercion strict mode keeps is int→float, because refusing it would make arithmetic unusable. There is no project-wide switch.",
        },
        {
          id: "php-type-declarations-q4",
          prompt: "What does a `?int` parameter type mean?",
          options: [
            "`int|null` — it accepts an int or null",
            "The parameter is optional",
            "The type is checked only if a value is passed",
            "It accepts any scalar that can be cast to int",
          ],
          correctIndex: 0,
          explanation:
            "`?T` is nullable, which is about the type, not about optionality. A parameter is optional when it has a default — and `?int $n` with no default still has to be passed, explicitly as null if that is what you mean.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-type-declarations-q5",
          prompt: "Which of these are valid PHP 8.1+ type declarations? (Select all that apply.)",
          options: [
            "`int|string`",
            "`Countable&ArrayAccess`",
            "`never`",
            "`array<int, string>`",
            "`int|null|false`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "Unions, intersections, `never` and the standalone `false`/`null` types are all real. Generic array shapes are not — `array<int, string>` is a docblock convention that PHPStan and Psalm understand but the engine ignores.",
        },
        {
          id: "php-type-declarations-q6",
          prompt: "What is the difference between `void` and `never` as return types?",
          options: [
            "`void` returns with no value; `never` does not return at all",
            "They are synonyms",
            "`never` means the return value must be ignored",
            "`void` is for methods, `never` for functions",
          ],
          correctIndex: 0,
          explanation:
            "A `never` function always throws or exits, so anything after the call is dead code — which static analysis can then prove. `void` is an ordinary return.",
        },
        {
          id: "php-type-declarations-q7",
          prompt: "What does this do?\n\n```php\nclass User {\n    public function __construct(\n        public readonly string $email,\n    ) {}\n}\n```",
          options: [
            "Declares and assigns a public property that can only be written once, from inside the class",
            "Declares a constant named `email`",
            "Declares a private property with a public getter",
            "Declares a property that cannot be read outside the class",
          ],
          correctIndex: 0,
          explanation:
            "Constructor property promotion plus `readonly` (PHP 8.1). It can be initialised once from inside the declaring class; any later write, inside or out, is an `Error`.",
        },
        {
          id: "php-type-declarations-q8",
          prompt:
            "With `strict_types=1`, what happens?\n\n```php\nfunction half(float $n): float { return $n / 2; }\necho half(5);\n```",
          options: [
            "It echoes `2.5` — int to float is the one widening strict mode allows",
            "A `TypeError`, because 5 is an int",
            "It echoes `2`",
            "A warning, then `2.5`",
          ],
          correctIndex: 0,
          explanation:
            "This is the deliberate exception. Every other coercion is refused, but rejecting int where float is expected would make ordinary arithmetic painful for no safety gain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-type-declarations-q9",
          prompt: "Why do PHP projects use PHPStan or Psalm on top of the language's own types?",
          options: [
            "For generics, array shapes and nullability analysis the engine does not check",
            "Because PHP's runtime type checks can be disabled in production",
            "Because they compile PHP to a faster bytecode",
            "Because the engine only checks parameter types, never return types",
          ],
          correctIndex: 0,
          explanation:
            "The engine checks what it can at runtime; it has no concept of `list<User>` or of whether a property can be null at a given point. Static analysers fill that gap, which is why they are effectively standard on serious PHP projects.",
        },
        {
          id: "php-type-declarations-q10",
          prompt: "What happens if a function declared `: int` returns a string in coercive mode?",
          options: [
            "A numeric string is coerced; a non-numeric one is a `TypeError`",
            "Any string is coerced, non-numeric ones becoming 0",
            "Return types are not checked at all in coercive mode",
            "It is always a `TypeError`",
          ],
          correctIndex: 0,
          explanation:
            "Return types are checked with the same rules as parameters. Coercion is not a free pass — `\"abc\"` from an `: int` function still throws.",
        },
      ],
    },

    {
      id: "php-errors-exceptions",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Errors, Exceptions and Error Handling",
      summary:
        "PHP has two parallel hierarchies and they do not overlap. `Exception` is for conditions your code raises and expects to handle; `Error` — including `TypeError`, `ValueError`, `ArgumentCountError` and `DivisionByZeroError` — is for engine-level failures that used to be fatal. Both implement `Throwable`, and neither extends the other.\n\nThat is the fact that catches people: `catch (Exception $e)` does **not** catch a `TypeError`. A well-meaning top-level handler written before PHP 7 will silently let every engine error through. `catch (Throwable $e)` is what catches everything, and it is what a framework's last-resort handler uses.\n\nSeparately, PHP still has its old non-exception error system — warnings and notices routed through `set_error_handler()`. That handler does not see fatal errors, so the standard way to log a fatal is `register_shutdown_function()` plus `error_get_last()`. And `finally` has a sharp edge worth knowing: a `return` inside it overrides a `return` in the `try`, and swallows an in-flight exception entirely.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "PHP Manual: Exceptions", url: "https://www.php.net/manual/en/language.exceptions.php", kind: "docs" },
        { label: "PHP Manual: Errors in PHP 7+", url: "https://www.php.net/manual/en/language.errors.php7.php", kind: "docs" },
        { label: "PHP Manual: Throwable", url: "https://www.php.net/manual/en/class.throwable.php", kind: "docs" },
      ],
      video: {
        title: "OOP Error Handling In PHP - Exceptions & Try Catch Finally Blocks - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=XQ5Pd-6Hnjk",
        videoId: "XQ5Pd-6Hnjk",
        durationLabel: "21:17",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-errors-exceptions-q1",
          prompt:
            "Does this catch the error?\n\n```php\nfunction f(int $n) {}\ntry {\n    f('abc');\n} catch (Exception $e) {\n    echo 'caught';\n}\n```\n\n(Assume `strict_types=1`.)",
          options: [
            "No — a `TypeError` is an `Error`, not an `Exception`, so it is uncaught",
            "Yes — every throwable extends `Exception`",
            "Yes, but only in coercive mode",
            "No, because `f` has no return type",
          ],
          correctIndex: 0,
          explanation:
            "`Error` and `Exception` are siblings under `Throwable`. `catch (Throwable $e)` catches both, and is what a top-level handler should use.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-errors-exceptions-q2",
          prompt: "What does this return?\n\n```php\nfunction f(): string {\n    try {\n        return 'try';\n    } finally {\n        return 'finally';\n    }\n}\n```",
          options: ["`finally`", "`try`", "A fatal error", "`tryfinally`"],
          correctIndex: 0,
          explanation:
            "A `return` in `finally` overrides the one in `try` — and would also discard an in-flight exception. It is legal and almost always a bug, which is why analysers flag it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-errors-exceptions-q3",
          prompt: "Which of these are `Error` subclasses rather than `Exception` subclasses? (Select all that apply.)",
          options: [
            "`TypeError`",
            "`ValueError`",
            "`DivisionByZeroError`",
            "`RuntimeException`",
            "`InvalidArgumentException`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `*Error` classes come from the engine. `RuntimeException` and `InvalidArgumentException` are SPL exceptions your own code throws — the naming is a genuine trap, because `InvalidArgumentException` and `ValueError` sound like the same idea.",
        },
        {
          id: "php-errors-exceptions-q4",
          prompt: "What does `intdiv(1, 0)` do in PHP 8?",
          options: [
            "Throws `DivisionByZeroError`",
            "Returns `INF`",
            "Emits a warning and returns `false`",
            "Returns `0`",
          ],
          correctIndex: 0,
          explanation:
            "`1 / 0` also throws `DivisionByZeroError` from PHP 8 — it was a warning returning `false` before. `fdiv(1, 0)` is the one that gives `INF`, following IEEE-754.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-errors-exceptions-q5",
          prompt: "Why is `register_shutdown_function()` used for error logging?",
          options: [
            "It is the only way to see a fatal error, which `set_error_handler` does not receive",
            "It runs before any output is sent",
            "It catches exceptions that were never thrown",
            "It is faster than a try/catch",
          ],
          correctIndex: 0,
          explanation:
            "Pair it with `error_get_last()` to inspect what killed the request. `set_error_handler` only sees the non-fatal levels.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-errors-exceptions-q6",
          prompt: "What does PHP 8's non-capturing catch let you write?",
          options: [
            "`catch (ValueError) { … }` without naming a variable",
            "`catch { … }` with no type at all",
            "A catch block that does not stop propagation",
            "A catch that runs before the try block",
          ],
          correctIndex: 0,
          explanation:
            "When you do not use the exception object, omitting the variable says so — and stops static analysis reporting an unused variable.",
        },
        {
          id: "php-errors-exceptions-q7",
          prompt: "What is the purpose of the `$previous` argument in an exception constructor?",
          options: [
            "To chain the original exception so the root cause survives re-wrapping",
            "To retry the operation that failed",
            "To set the exception's HTTP status code",
            "To suppress the original exception",
          ],
          correctIndex: 0,
          explanation:
            "Wrapping a low-level `PDOException` in a domain exception without passing `$previous` throws away the stack trace that says what actually went wrong — and that is usually the only part worth having.",
        },
        {
          id: "php-errors-exceptions-q8",
          prompt: "What does the `@` error-suppression operator do?",
          options: [
            "Suppresses diagnostics from that one expression, but not thrown exceptions or fatal errors",
            "Catches every error, including fatal ones",
            "Redirects errors to the error log",
            "Converts errors into exceptions",
          ],
          correctIndex: 0,
          explanation:
            "It hides the symptom and not the problem, and it makes a custom error handler's job harder. Almost every use is better expressed as a check before the call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-errors-exceptions-q9",
          prompt: "Multiple catch blocks are evaluated in what order?",
          options: [
            "Top to bottom, first match wins — so the most specific type must come first",
            "Most specific type first, automatically",
            "In declaration order of the exception classes",
            "All matching blocks run",
          ],
          correctIndex: 0,
          explanation:
            "Putting `catch (Throwable)` first makes every later block unreachable. PHP will not warn about it, so it is worth checking by eye.",
        },
        {
          id: "php-errors-exceptions-q10",
          prompt: "When should you define a custom exception class rather than throwing `RuntimeException`?",
          options: [
            "When a caller needs to catch that specific failure and react differently to it",
            "Always — built-in exceptions should never be thrown directly",
            "Never — custom exceptions make stack traces harder to read",
            "Only when the exception carries no message",
          ],
          correctIndex: 0,
          explanation:
            "The test is whether anyone will `catch` it specifically. An exception type nobody branches on is a message with extra ceremony; one that lets a caller retry a `RateLimitedException` but not a `ValidationException` earns its place.",
        },
      ],
    },

    {
      id: "php-loops-iteration",
      moduleId: "php-foundations",
      trackId: "php",
      title: "Loops, Iteration and Generators",
      summary:
        "`foreach` is the loop that matters in PHP, because arrays are the data structure that matters. It iterates a *copy* of the array by default, so adding to the array inside the loop does not extend the iteration — which is the opposite of what a `for` loop over `count()` would do, and one of the few places where PHP's copy semantics are helpful rather than surprising.\n\nGenerators (`yield`) are the feature worth reaching for when data does not fit in memory. A generator function returns a `Generator` that produces values lazily, so reading a million-row CSV becomes a constant-memory operation rather than an array that exhausts `memory_limit`. The cost is that a generator is forward-only and single-use: you cannot `count()` it, cannot index it, and cannot iterate it twice.\n\nThe interface worth knowing is `IteratorAggregate`, which lets your own collection class be used in `foreach` by returning a generator from `getIterator()`. That is usually a better fit than implementing `Iterator`'s five methods by hand, and it is what most framework collection classes do.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: foreach", url: "https://www.php.net/manual/en/control-structures.foreach.php", kind: "docs" },
        { label: "PHP Manual: Generators", url: "https://www.php.net/manual/en/language.generators.overview.php", kind: "docs" },
        { label: "PHP Manual: IteratorAggregate", url: "https://www.php.net/manual/en/class.iteratoraggregate.php", kind: "docs" },
      ],
      video: {
        title: "PHP Fundamentals [FULL COURSE]",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=EX3qQqdm16I",
        videoId: "EX3qQqdm16I",
        startSeconds: 1270,
        chapterLabel: "Loops",
        durationLabel: "1:14:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-loops-iteration-q1",
          prompt:
            "How many times does this loop run?\n\n```php\n$a = [1, 2, 3];\nforeach ($a as $v) {\n    $a[] = $v;\n}\n```",
          options: ["3", "6", "Forever", "0"],
          correctIndex: 0,
          explanation:
            "`foreach` iterates over a copy, so appending inside the loop does not extend it. A `for ($i = 0; $i < count($a); $i++)` over the same array would never terminate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-loops-iteration-q2",
          prompt: "What does a function containing `yield` return when called?",
          options: [
            "A `Generator` object — no code in the body has run yet",
            "The first yielded value",
            "An array of all yielded values",
            "`null`, with the values sent to the caller directly",
          ],
          correctIndex: 0,
          explanation:
            "Calling it does nothing but build the generator; the body runs on the first `current()` or the first `foreach` iteration. That laziness is the whole point.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-loops-iteration-q3",
          prompt: "Which are true of generators? (Select all that apply.)",
          options: [
            "They use constant memory regardless of how many values they produce",
            "They are forward-only and cannot be rewound once started",
            "They can be iterated only once",
            "`count()` works on them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`count()` needs `Countable` or an array, and a generator is neither — it does not know how many values it will produce. `iterator_to_array()` materialises one, which gives up the memory advantage.",
        },
        {
          id: "php-loops-iteration-q4",
          prompt: "What does this print?\n\n```php\nfunction gen() {\n    yield 1;\n    yield 2;\n    return 3;\n}\n$g = gen();\nforeach ($g as $v) { echo $v; }\necho $g->getReturn();\n```",
          options: ["`123`", "`12`", "`3`", "A fatal error on the return"],
          correctIndex: 0,
          explanation:
            "A generator can both yield and return. The return value is not part of the iteration and is retrieved with `getReturn()` after the generator finishes — calling it before then is an exception.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-loops-iteration-q5",
          prompt: "Why prefer `IteratorAggregate` over implementing `Iterator` directly?",
          options: [
            "You write one method returning a generator instead of five stateful ones",
            "`Iterator` is deprecated in PHP 8",
            "`IteratorAggregate` supports `count()` automatically",
            "Only `IteratorAggregate` works with `foreach`",
          ],
          correctIndex: 0,
          explanation:
            "`Iterator` needs `current`, `key`, `next`, `rewind` and `valid`, all hand-managed. `getIterator()` returning a generator is shorter and much harder to get wrong.",
        },
        {
          id: "php-loops-iteration-q6",
          prompt: "What does `yield from` do?",
          options: [
            "Delegates to another iterable, yielding all of its values in place",
            "Yields a value and immediately returns",
            "Converts an array to a generator",
            "Yields only the keys of an iterable",
          ],
          correctIndex: 0,
          explanation:
            "It composes generators — a recursive directory walker is the classic case. Note that it preserves the inner keys, which can produce duplicates when delegating to several arrays.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-loops-iteration-q7",
          prompt: "What is the practical difference between `while` and `do…while`?",
          options: [
            "`do…while` always runs the body at least once",
            "`do…while` cannot use `break`",
            "`while` is evaluated at compile time",
            "There is none; `do…while` is an alias",
          ],
          correctIndex: 0,
          explanation:
            "The condition is checked after the body. It is rare in PHP, but it is exactly right for \"attempt, then decide whether to retry\".",
        },
        {
          id: "php-loops-iteration-q8",
          prompt:
            "What is the memory difference between these?\n\n```php\nforeach (file('big.csv') as $line) {}\nforeach (readLines('big.csv') as $line) {}   // a generator using fgets\n```",
          options: [
            "The first loads the whole file into an array; the second holds one line at a time",
            "They are equivalent — PHP streams both",
            "The second is slower but uses the same memory",
            "The first is lazy; the second is eager",
          ],
          correctIndex: 0,
          explanation:
            "`file()` returns an array of every line, so a 2 GB file needs 2 GB plus overhead. A generator over `fgets` is constant-memory, which is the difference between a job that runs and one that hits `memory_limit`.",
        },
      ],
    },
  ],
} satisfies Module;
