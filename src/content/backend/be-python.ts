import type { Module } from "@/types/curriculum";

// Plain-data fixtures for the py-django-orm challenge.
const ormData = {
  authors: [
    { id: 1, name: "Ann" },
    { id: 2, name: "Bo" },
  ],
  tags: [
    { id: 1, name: "py" },
    { id: 2, name: "db" },
  ],
  books: [
    { id: 1, title: "A", year: 2020, authorId: 1 },
    { id: 2, title: "B", year: 2021, authorId: 2 },
    { id: 3, title: "C", year: 2020, authorId: null },
  ],
  bookTags: [
    [1, 1],
    [1, 2],
    [2, 2],
  ],
};
const ormBigData = {
  authors: Array.from({ length: 150 }, (_, i) => ({ id: i + 1, name: `W${i + 1}` })),
  tags: [],
  books: Array.from({ length: 150 }, (_, i) => ({ id: i + 1, title: `T${i + 1}`, year: 2000, authorId: i + 1 })),
  bookTags: [],
};
const ormBigNames = ormBigData.authors.map((a) => a.name).join(",");

export default {
  id: "be-python",
  trackId: "backend",
  name: "Python Backend",
  description:
    "Python on the server for engineers from any stack: the language mechanics that bite in production (typing, mutability, generators, the GIL, asyncio), FastAPI with Pydantic v2, Django's ORM, views and REST framework, Celery for background work, and how to choose between FastAPI and Django. Written against Python 3.14, current FastAPI and Django 6.1.",
  refs: [
    { label: "FastAPI: Documentation", url: "https://fastapi.tiangolo.com/", kind: "docs" },
    { label: "Django: Documentation (6.1)", url: "https://docs.djangoproject.com/en/6.1/", kind: "docs" },
    { label: "Django REST framework: Documentation", url: "https://www.django-rest-framework.org/", kind: "docs" },
  ],
  topics: [
    {
      id: "py-essentials",
      moduleId: "be-python",
      trackId: "backend",
      title: "Python Essentials for Backend Engineers",
      summary:
        "Backend Python rewards knowing a handful of language mechanics precisely. Type hints aren't enforced by the interpreter; they're read by type checkers (mypy, pyright) and, crucially, by libraries: Pydantic and FastAPI turn annotations into runtime validation and OpenAPI schemas. Since Python 3.14 annotations are evaluated lazily (PEP 649), so forward references no longer need quotes. `dataclasses` generate `__init__`, `__repr__` and `__eq__` for data holders but validate nothing, and a mutable default must be `field(default_factory=list)`; a bare `[]` raises `ValueError`. Plain functions have the same trap without the error: `def add(item, bucket=[])` evaluates the default once, when the function is defined, so every call shares one list.\n\nContext managers (`with`, `contextlib.contextmanager`) guarantee cleanup of connections, transactions, locks and files, and FastAPI's yield dependencies and lifespan handlers are built on them. Generators produce values lazily and can be consumed only once, which makes them ideal for streaming large results and the cause of \"empty the second time\" bugs. For environments, `uv` has largely replaced pip, venv and pip-tools: `uv add` records the dependency and updates `uv.lock`, and `uv run` locks and syncs the environment before running a command.\n\nConcurrency is where experienced engineers get caught. The GIL lets only one thread run Python bytecode at a time, so threads help I/O-bound work but not CPU-bound work; use processes, or the free-threaded build, officially supported since 3.14 (PEP 779) at roughly a 5–10% single-thread cost. `asyncio` runs coroutines cooperatively on one thread and only switches tasks at an `await`, so a blocking call such as `time.sleep()`, `requests.get()` or a synchronous database driver inside `async def` freezes everything on that loop; push it to a thread with `asyncio.to_thread()`. `asyncio.gather()` returns results in argument order, and when one awaitable fails the others keep running, whereas a `TaskGroup` cancels them.",
      level: "intermediate",
      estMinutes: 90,
      webRefs: [
        { label: "Python docs: Coroutines and Tasks (asyncio)", url: "https://docs.python.org/3/library/asyncio-task.html", kind: "docs" },
        { label: "Python docs: Python support for free threading", url: "https://docs.python.org/3/howto/free-threading-python.html", kind: "docs" },
        { label: "Python docs: dataclasses", url: "https://docs.python.org/3/library/dataclasses.html", kind: "docs" },
        { label: "James Bennett: Understanding async Python for the web", url: "https://www.b-list.org/weblog/2022/aug/16/async/", kind: "article" },
      ],
      video: {
        title: "Python Tutorial: AsyncIO - Complete Guide to Asynchronous Programming with Animations",
        channel: "Corey Schafer",
        url: "https://www.youtube.com/watch?v=oAkLSJNr5zY",
        videoId: "oAkLSJNr5zY",
        durationLabel: "1:42:41",
      },
      alternateVideos: [
        {
          title: "Asyncio Finally Explained: What the Event Loop Really Does",
          channel: "ArjanCodes",
          url: "https://www.youtube.com/watch?v=RIVcqT2OGPA",
          videoId: "RIVcqT2OGPA",
          durationLabel: "13:33",
        },
        {
          title: "How Much FASTER Is Python 3.13 Without the GIL?",
          channel: "ArjanCodes",
          url: "https://www.youtube.com/watch?v=zWPe_CUR4yU",
          videoId: "zWPe_CUR4yU",
          durationLabel: "10:00",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-essentials-q1",
          prompt: "What does this print?\n\n```python\ndef add_tag(tag, tags=[]):\n    tags.append(tag)\n    return tags\n\nprint(add_tag(\"a\"), add_tag(\"b\"))\n```",
          options: ["`['a', 'b'] ['a', 'b']`", "`['a'] ['b']`", "`['a'] ['a', 'b']`", "It raises `ValueError` for a mutable default"],
          correctIndex: 0,
          explanation:
            "The default list is created once, when `def` runs, so both calls append to and return the same object; `print` shows it twice after both calls. Use `tags=None` and create the list inside. It isn't `['a'] ['a', 'b']` because both arguments are the same list, printed after both calls.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-essentials-q2",
          prompt: "What happens when Python executes this class definition?\n\n```python\nfrom dataclasses import dataclass\n\n@dataclass\nclass Order:\n    id: int\n    tags: list = []\n```",
          options: [
            "It raises `ValueError`: mutable defaults aren't allowed, use `field(default_factory=list)`",
            "It works, and every `Order` shares one `tags` list",
            "It works, and each `Order` gets its own empty list",
            "It raises `TypeError` the first time an `Order` is created",
          ],
          correctIndex: 0,
          explanation:
            "`dataclass` rejects `list`, `dict` and `set` defaults at class-creation time precisely because of the shared-default bug. Plain functions don't get this protection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-essentials-q3",
          prompt: "What does `double(\"ab\")` return?\n\n```python\ndef double(x: int) -> int:\n    return x * 2\n```",
          options: ["`'abab'`", "It raises `TypeError` because `x` must be an `int`", "`None`", "It raises `ValueError` when converting `'ab'` to `int`"],
          correctIndex: 0,
          explanation:
            "The interpreter doesn't enforce annotations; a type checker would flag the call, and libraries such as Pydantic validate only where they're applied. Here `str * 2` is simply repetition.",
        },
        {
          id: "py-essentials-q4",
          prompt: "What does this print?\n\n```python\nsquares = (x * x for x in range(3))\nprint(sum(squares), sum(squares))\n```",
          options: ["`5 0`", "`5 5`", "`0 5`", "It raises `StopIteration`"],
          correctIndex: 0,
          explanation:
            "A generator can be iterated once. The first `sum` consumes it (0 + 1 + 4), and the second sees an exhausted iterator and returns 0 without raising. Use a list, or recreate the generator, if you need two passes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-essentials-q5",
          prompt:
            "What is printed before the `ValueError` reaches the caller?\n\n```python\nfrom contextlib import contextmanager\n\n@contextmanager\ndef transaction():\n    print(\"begin\")\n    try:\n        yield\n        print(\"commit\")\n    except Exception:\n        print(\"rollback\")\n        raise\n\nwith transaction():\n    raise ValueError(\"boom\")\n```",
          options: ["`begin`, then `rollback`", "`begin`, then `commit`", "`begin`, `rollback`, then `commit`", "Only `begin`; the exception bypasses the generator"],
          correctIndex: 0,
          explanation:
            "An exception inside the `with` block is thrown into the generator at the `yield`, so the `except` branch runs, and the bare `raise` re-raises it. Without the re-raise the exception would be swallowed, which is how FastAPI yield dependencies can hide errors.",
        },
        {
          id: "py-essentials-q6",
          prompt: "On a standard CPython build (with the GIL), which workloads get faster with a thread pool? (Select all that apply.)",
          options: [
            "Downloading 50 URLs with the synchronous `requests` library",
            "Running many slow queries through a synchronous database driver",
            "Scoring a large dataset in a pure-Python loop",
            "Resizing images with a pixel-by-pixel pure-Python loop",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Threads release the GIL while blocked on I/O, so waiting overlaps. Pure-Python CPU work holds the GIL, so threads take turns and gain nothing; use processes, C extensions that release the GIL, or the free-threaded build.",
        },
        {
          id: "py-essentials-q7",
          prompt: "Which statements about free-threaded CPython are true as of Python 3.14? (Select all that apply.)",
          options: [
            "It's officially supported (PEP 779) but still a separate build, not the default interpreter",
            "Single-threaded code runs roughly 5–10% slower than on the default build",
            "Importing a C extension that isn't marked as free-threading safe can re-enable the GIL, with a warning",
            "It makes every existing library thread-safe automatically",
            "The default `python.org` build has had no GIL since 3.13",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "3.13 introduced the free-threaded build as experimental; 3.14 made it officially supported, with a smaller single-thread penalty. It's opt-in (e.g. `python3.14t`), and removing the GIL exposes, rather than fixes, thread-safety bugs.",
        },
        {
          id: "py-essentials-q8",
          prompt:
            "Ten requests hit this endpoint at the same time on one Uvicorn worker. Roughly how long until the last one finishes?\n\n```python\n@app.get(\"/report\")\nasync def report():\n    time.sleep(2)  # stands in for a blocking call\n    return {\"ok\": True}\n```",
          options: ["About 20 seconds", "About 2 seconds", "About 4 seconds, because Uvicorn runs two at a time", "It fails because `time.sleep` is not allowed in coroutines"],
          correctIndex: 0,
          explanation:
            "`time.sleep` blocks the event loop thread, and nothing else runs until it returns, so the requests are served one after another. `await asyncio.sleep(2)`, or `await asyncio.to_thread(blocking_call)`, lets them overlap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-essentials-q9",
          prompt:
            "What does `main()` return, and roughly how long does it take?\n\n```python\nasync def work(name, delay):\n    await asyncio.sleep(delay)\n    return name\n\nasync def main():\n    return await asyncio.gather(\n        work(\"a\", 0.3), work(\"b\", 0.1), work(\"c\", 0.2)\n    )\n```",
          options: [
            "`['a', 'b', 'c']` after about 0.3 s",
            "`['b', 'c', 'a']` after about 0.3 s",
            "`['a', 'b', 'c']` after about 0.6 s",
            "`['b', 'c', 'a']` after about 0.6 s",
          ],
          correctIndex: 0,
          explanation:
            "`gather` runs the coroutines concurrently, so the total is the longest delay, and it returns results in the order the awaitables were passed, not completion order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-essentials-q10",
          prompt:
            "`asyncio.gather(slow(), boom())` is awaited with default arguments, and `boom()` raises after 50 ms while `slow()` needs 200 ms. What happens to `slow()`?",
          options: [
            "The exception propagates to the caller immediately, and `slow()` keeps running in the background",
            "`slow()` is cancelled as soon as `boom()` raises",
            "`gather` waits for `slow()` to finish before raising",
            "`gather` returns `[result, RuntimeError(...)]`",
          ],
          correctIndex: 0,
          explanation:
            "With `return_exceptions=False`, the first exception propagates but the other awaitables aren't cancelled. `asyncio.TaskGroup` (3.11+) cancels the remaining tasks and raises an `ExceptionGroup`; `return_exceptions=True` would return the exception in the results list.",
        },
        {
          id: "py-essentials-q11",
          prompt: "In a `uv`-managed project, which statements are true? (Select all that apply.)",
          options: [
            "`uv run` locks and syncs the project environment before running the command",
            "`uv sync --locked` fails instead of updating a lockfile that's out of date, which suits CI",
            "`uv.lock` isn't updated automatically just because a newer version of a dependency is released",
            "`uv add` installs into the global interpreter and leaves `pyproject.toml` alone",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "uv keeps `pyproject.toml`, `uv.lock` and the project's `.venv` in step: `uv add` records the dependency, `uv run` syncs before executing, `--locked` turns drift into an error, and upgrades are explicit (`uv lock --upgrade`).",
        },
      ],
    },
    {
      id: "py-fastapi-pydantic",
      moduleId: "be-python",
      trackId: "backend",
      title: "FastAPI Basics & Pydantic Validation",
      summary:
        "FastAPI is a thin layer that turns type annotations into an HTTP API. Starlette handles ASGI, routing and requests; Pydantic v2, whose core is written in Rust, validates input and serializes output; and the same annotations generate the OpenAPI schema behind `/docs`. Where a parameter is declared decides where its value comes from: a name in the path template is a path parameter, other simple-typed parameters are query parameters, and a Pydantic model parameter is the JSON body. `Annotated[int, Query(le=100)]` attaches constraints and metadata while keeping the plain type. Invalid input never reaches your function: FastAPI answers 422 with a `detail` list whose entries carry a `type`, a `loc` such as `[\"body\", \"password\"]`, and a message.\n\nOutput deserves the same care. `response_model=UserOut`, or a return annotation `-> UserOut`, filters the response down to that model's fields, which is how you avoid leaking a `password_hash` when the handler returns a database object. Status codes are explicit: FastAPI returns 200 for every successful method, POST included, unless you set `status_code=201`. Separate `UserCreate`, `UserUpdate` and `UserOut` models beat one model for everything.\n\nPydantic validates in lax mode by default: `\"42\"` becomes `42` and `\"yes\"` becomes `True`, but `\"4.2\"` and `4.5` are rejected for an `int` (`int_parsing`, `int_from_float`), and numbers are not coerced to strings. Strict mode (`ConfigDict(strict=True)` or `Field(strict=True)`) accepts only exact types. Two v2 gotchas catch people migrating from v1: `Optional[int]` without a default is still required (it only allows `null`), and defaults aren't validated unless you opt in. `extra=\"forbid\"` rejects unknown fields instead of silently dropping them. Current FastAPI requires Pydantic v2 and Python 3.10+.",
      level: "intermediate",
      estMinutes: 75,
      webRefs: [
        { label: "FastAPI: Request Body", url: "https://fastapi.tiangolo.com/tutorial/body/", kind: "docs" },
        { label: "Pydantic: Conversion Table", url: "https://pydantic.dev/docs/validation/latest/concepts/conversion_table/", kind: "docs" },
        { label: "Pydantic: Strict Mode", url: "https://pydantic.dev/docs/validation/latest/concepts/strict_mode/", kind: "docs" },
        { label: "FastAPI: Response Model - Return Type", url: "https://fastapi.tiangolo.com/tutorial/response-model/", kind: "docs" },
      ],
      video: {
        title: "Python FastAPI Tutorial: Full Course for Beginners - Build a Full-Stack Web App",
        channel: "Corey Schafer",
        url: "https://www.youtube.com/watch?v=iukOehU5aF4",
        videoId: "iukOehU5aF4",
        durationLabel: "14:23:36",
        startSeconds: 5769,
        chapterLabel: "Pydantic Schemas - Request and Response Validation",
      },
      alternateVideos: [
        {
          title: "FastAPI Crash Course - Modern Python API Development",
          channel: "Traversy Media",
          url: "https://www.youtube.com/watch?v=8TMQcRcBnW8",
          videoId: "8TMQcRcBnW8",
          durationLabel: "1:00:21",
          startSeconds: 1719,
          chapterLabel: "Pydantic Schemas",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `validateModel(fields, data, config)`, a small model of how Pydantic v2 validates a request body.\n\n- `fields` lists the model's fields in order as `{ name, type, default?, nullable?, strict? }`, where `type` is `\"int\"`, `\"float\"`, `\"str\"` or `\"bool\"`. A field is required unless it has a `default` key. `nullable: true` means the annotation is `int | None`: it accepts `null` but doesn't make the field optional. `strict` overrides the model's mode for that one field.\n- `config` may set `strict` (default `false`, which is lax mode) and `extra`: `\"ignore\"` (default), `\"forbid\"` or `\"allow\"`.\n- `data` is parsed JSON. If it isn't a plain object, return the single error `{ loc: [], type: \"model_type\" }`.\n\nFor each field, in order:\n\n- Missing key: use the default as-is (Pydantic doesn't validate defaults), otherwise record `missing`.\n- `null`: accepted for a nullable field; otherwise it goes through the type rules below and fails.\n- Anything else is converted according to the mode and type.\n\nLax mode:\n\n- `int`: `true`/`false` become `1`/`0`; an integer number passes and any other number fails with `int_from_float`. A string is trimmed and must be an optional sign, digits (single underscores allowed between digits) and optionally a fraction made only of zeros, such as `\" 42 \"`, `\"1_000\"` or `\"7.00\"`; otherwise `int_parsing`. Anything else is `int_type`.\n- `float`: booleans become `1`/`0` and numbers pass. A string is trimmed and must be a decimal number with an optional exponent (`\"19.99\"`, `\".5\"`, `\"1e3\"`), otherwise `float_parsing`. Anything else is `float_type`. (Pydantic also accepts `inf`, `nan` and underscores in floats; you don't need to.)\n- `str`: only strings pass. Numbers are not converted: `12345` fails with `string_type`.\n- `bool`: booleans pass. The number `1` is `true` and `0` is `false`; other integers fail with `bool_parsing` and other numbers with `bool_type`. A string (not trimmed) equal, ignoring case, to one of `true yes on 1 t y` or `false no off 0 f n` converts; other strings fail with `bool_parsing`. Anything else is `bool_type`.\n\nStrict mode accepts only the exact type: `int` needs an integer number (a boolean isn't one), `float` any number (not a boolean), `str` a string and `bool` a boolean; otherwise `int_type`, `float_type`, `string_type` or `bool_type`. JavaScript can't tell `4.0` from `4`, so any number for which `Number.isInteger` is true counts as an int.\n\nExtra keys, in `data` order, are dropped by default, copied into the result with `\"allow\"`, and reported as `extra_forbidden` with `\"forbid\"`.\n\nCollect every error as `{ loc: [fieldName], type }`: field errors in field order, then extra-key errors. Return `{ ok: true, value }` or `{ ok: false, errors }`.",
        starterCode: "/**\n * Validate `data` against a Pydantic-style field list.\n * @param {Array<{ name: string, type: \"int\" | \"float\" | \"str\" | \"bool\", default?: unknown, nullable?: boolean, strict?: boolean }>} fields\n * @param {unknown} data\n * @param {{ strict?: boolean, extra?: \"ignore\" | \"forbid\" | \"allow\" }} [config]\n * @returns {{ ok: true, value: object } | { ok: false, errors: { loc: string[], type: string }[] }}\n */\nfunction validateModel(fields, data, config = {}) {\n  // Your code here\n}\n",
        functionName: "validateModel",
        testCases: [
          {
            description: "lax mode converts numeric and boolean-like strings",
            args: [
              [
                { name: "id", type: "int" },
                { name: "price", type: "float" },
                { name: "active", type: "bool" },
                { name: "name", type: "str" },
              ],
              { id: "42", price: "19.99", active: "yes", name: "Mug" },
              {},
            ],
            expected: { ok: true, value: { id: 42, price: 19.99, active: true, name: "Mug" } },
          },
          {
            description: "a decimal string or a fractional number is not an int",
            args: [
              [
                { name: "a", type: "int" },
                { name: "b", type: "int" },
              ],
              { a: "4.2", b: 4.5 },
              {},
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["a"], type: "int_parsing" },
                { loc: ["b"], type: "int_from_float" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "whitespace, underscores and an all-zero fraction are accepted for int",
            args: [
              [
                { name: "a", type: "int" },
                { name: "b", type: "int" },
                { name: "c", type: "int" },
                { name: "d", type: "int" },
              ],
              { a: " 42 ", b: "1_000", c: "7.00", d: true },
              {},
            ],
            expected: { ok: true, value: { a: 42, b: 1000, c: 7, d: 1 } },
            isEdgeCase: true,
          },
          {
            description: "malformed int strings fail with int_parsing",
            args: [
              [
                { name: "a", type: "int" },
                { name: "b", type: "int" },
                { name: "c", type: "int" },
                { name: "d", type: "int" },
              ],
              { a: "1e3", b: "0x10", c: "4.", d: "" },
              {},
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["a"], type: "int_parsing" },
                { loc: ["b"], type: "int_parsing" },
                { loc: ["c"], type: "int_parsing" },
                { loc: ["d"], type: "int_parsing" },
              ],
            },
          },
          {
            description: "numbers are never coerced to strings",
            args: [[{ name: "sku", type: "str" }], { sku: 12345 }, {}],
            expected: { ok: false, errors: [{ loc: ["sku"], type: "string_type" }] },
            isEdgeCase: true,
          },
          {
            description: "bool accepts 0/1 and a fixed set of words, ignoring case",
            args: [
              [
                { name: "a", type: "bool" },
                { name: "b", type: "bool" },
                { name: "c", type: "bool" },
                { name: "d", type: "bool" },
              ],
              { a: "OFF", b: 1, c: "t", d: "N" },
              {},
            ],
            expected: { ok: true, value: { a: false, b: true, c: true, d: false } },
          },
          {
            description: "bool rejects other integers, padded words and fractions with different error types",
            args: [
              [
                { name: "x", type: "bool" },
                { name: "y", type: "bool" },
                { name: "z", type: "bool" },
              ],
              { x: 2, y: " true ", z: 0.5 },
              {},
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["x"], type: "bool_parsing" },
                { loc: ["y"], type: "bool_parsing" },
                { loc: ["z"], type: "bool_type" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "float parses exponents and trims, and accepts ints",
            args: [
              [
                { name: "x", type: "float" },
                { name: "y", type: "float" },
                { name: "z", type: "float" },
                { name: "w", type: "float" },
                { name: "v", type: "float" },
              ],
              { x: "1e3", y: 3, z: " 2.5 ", w: "abc", v: [1] },
              {},
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["w"], type: "float_parsing" },
                { loc: ["v"], type: "float_type" },
              ],
            },
          },
          {
            description: "strict mode accepts only exact types, though an int is still a valid float",
            args: [
              [
                { name: "id", type: "int" },
                { name: "price", type: "float" },
                { name: "active", type: "bool" },
                { name: "name", type: "str" },
                { name: "count", type: "int" },
              ],
              { id: "42", price: 3, active: "true", name: "Mug", count: true },
              { strict: true },
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["id"], type: "int_type" },
                { loc: ["active"], type: "bool_type" },
                { loc: ["count"], type: "int_type" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "a field-level strict flag overrides a lax model",
            args: [
              [
                { name: "a", type: "int", strict: true },
                { name: "b", type: "int" },
              ],
              { a: "1", b: "2" },
              {},
            ],
            expected: { ok: false, errors: [{ loc: ["a"], type: "int_type" }] },
          },
          {
            description: "a field-level strict: false relaxes a strict model",
            args: [
              [
                { name: "a", type: "int", strict: false },
                { name: "b", type: "int" },
              ],
              { a: "5", b: 6 },
              { strict: true },
            ],
            expected: { ok: true, value: { a: 5, b: 6 } },
          },
          {
            description: "defaults fill missing fields and aren't validated",
            args: [
              [
                { name: "a", type: "int" },
                { name: "b", type: "str", default: "x" },
                { name: "c", type: "int", default: "not an int" },
              ],
              { a: 1 },
              {},
            ],
            expected: { ok: true, value: { a: 1, b: "x", c: "not an int" } },
            isEdgeCase: true,
          },
          {
            description: "a nullable field without a default is still required",
            args: [[{ name: "note", type: "str", nullable: true }], {}, {}],
            expected: { ok: false, errors: [{ loc: ["note"], type: "missing" }] },
            isEdgeCase: true,
          },
          {
            description: "null is accepted for a nullable field and is a type error otherwise",
            args: [
              [
                { name: "note", type: "str", nullable: true },
                { name: "a", type: "int" },
                { name: "b", type: "bool" },
              ],
              { note: null, a: null, b: null },
              {},
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["a"], type: "int_type" },
                { loc: ["b"], type: "bool_type" },
              ],
            },
          },
          {
            description: "extra: forbid reports unknown keys after the field errors, in input order",
            args: [
              [
                { name: "a", type: "int" },
                { name: "b", type: "str" },
              ],
              { z: 1, b: 3, y: 2 },
              { extra: "forbid" },
            ],
            expected: {
              ok: false,
              errors: [
                { loc: ["a"], type: "missing" },
                { loc: ["b"], type: "string_type" },
                { loc: ["z"], type: "extra_forbidden" },
                { loc: ["y"], type: "extra_forbidden" },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "extra: allow keeps unknown keys as they are",
            args: [[{ name: "a", type: "int" }], { q: 1, a: "2", r: [1] }, { extra: "allow" }],
            expected: { ok: true, value: { a: 2, q: 1, r: [1] } },
          },
          {
            description: "unknown keys are dropped by default",
            args: [[{ name: "a", type: "int" }], { a: 1, zzz: 2 }, {}],
            expected: { ok: true, value: { a: 1 } },
          },
          {
            description: "input that isn't an object fails with model_type",
            args: [[{ name: "a", type: "int" }], [1], {}],
            expected: { ok: false, errors: [{ loc: [], type: "model_type" }] },
            isEdgeCase: true,
          },
          {
            description: "a 1,000-field model converts every numeric string",
            args: [
              Array.from({ length: 1000 }, (_, i) => ({ name: `f${i}`, type: "int" })),
              Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`f${i}`, String(i)])),
              {},
            ],
            expected: { ok: true, value: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`f${i}`, i])) },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "py-fastapi-di-async",
      moduleId: "be-python",
      trackId: "backend",
      title: "FastAPI Dependency Injection & Async Routes",
      summary:
        "`Depends()` is FastAPI's dependency injection: a dependency is any callable whose own parameters are resolved from the request or from other dependencies, so authentication, pagination, database sessions and settings become small, reusable, testable functions. Dependencies form a tree, and within one request each one runs once and its result is cached even when several sub-dependencies ask for it (`use_cache=False` opts out). Declare them as `Annotated[Session, Depends(get_session)]` aliases, and swap them in tests with `app.dependency_overrides[get_session] = fake_session`. There's no container with singletons or scopes as in NestJS: app-wide resources such as connection pools belong in the lifespan handler, an async context manager passed as `FastAPI(lifespan=...)` that replaced the deprecated `on_event` hooks.\n\nA dependency that uses `yield` wraps the request with setup and teardown. By default (`scope=\"request\"`) the code after `yield` runs after the response has been sent; `Depends(scope=\"function\")` closes it as soon as the endpoint returns. If it catches an exception and doesn't re-raise, the client still gets a 500, but nothing is logged.\n\nAsync is where FastAPI services actually break. An `async def` endpoint runs on the event loop, so any blocking call inside it (a synchronous database driver, `requests`, `time.sleep`, heavy CPU work) stalls every request on that worker. A plain `def` endpoint or dependency runs in a threadpool instead: safe for blocking I/O, but AnyIO's default limiter runs at most 40 of them at once. The rule is to use `async def` only when everything it waits on is awaited; otherwise use `def`, or push the blocking call to a thread with `run_in_threadpool` or `asyncio.to_thread`. `BackgroundTasks` run in the same process after the response: fine for a quick notification, wrong for work that must survive a restart or that burns CPU, which is Celery's job.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "FastAPI: Concurrency and async / await", url: "https://fastapi.tiangolo.com/async/", kind: "docs" },
        { label: "FastAPI: Dependencies with yield", url: "https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/", kind: "docs" },
        { label: "FastAPI: Lifespan Events", url: "https://fastapi.tiangolo.com/advanced/events/", kind: "docs" },
        { label: "Starlette: Thread Pool", url: "https://starlette.dev/threadpool/", kind: "article" },
      ],
      video: {
        title: "Python FastAPI Tutorial: Full Course for Beginners - Build a Full-Stack Web App",
        channel: "Corey Schafer",
        url: "https://www.youtube.com/watch?v=iukOehU5aF4",
        videoId: "iukOehU5aF4",
        durationLabel: "14:23:36",
        startSeconds: 13055,
        chapterLabel: "Sync vs Async - Converting Your App to Asynchronous",
      },
      alternateVideos: [
        {
          title: "Dependency Injection Explained Like You’re 5 (with FastAPI Examples)",
          channel: "Eric Roby",
          url: "https://www.youtube.com/watch?v=f270BoTicMA",
          videoId: "f270BoTicMA",
          durationLabel: "13:22",
        },
        {
          title: "Performance tips by the FastAPI Expert — Marcelo Trylesinski",
          channel: "EuroPython Conference",
          url: "https://www.youtube.com/watch?v=7jtzjovKQ8A",
          videoId: "7jtzjovKQ8A",
          durationLabel: "24:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-fastapi-di-async-q1",
          prompt:
            "How many times does `get_settings` run for one request to `/report`?\n\n```python\ndef get_settings():\n    return load_settings()\n\ndef get_db(settings: Annotated[Settings, Depends(get_settings)]): ...\ndef get_mailer(settings: Annotated[Settings, Depends(get_settings)]): ...\n\n@app.get(\"/report\")\ndef report(db: Annotated[DB, Depends(get_db)],\n           mailer: Annotated[Mailer, Depends(get_mailer)]): ...\n```",
          options: ["Once", "Twice, once per sub-dependency", "Three times, including the endpoint itself", "Once per application, at startup"],
          correctIndex: 0,
          explanation:
            "FastAPI caches each dependency's result for the duration of a request, so both sub-dependencies receive the same value. It isn't app-wide: the next request calls it again (wrap it in `lru_cache` or use the lifespan for true singletons).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-di-async-q2",
          prompt:
            "An `async def` endpoint calls a synchronous SQLAlchemy `Session` and p99 latency explodes under load. Which changes fix the blocking? (Select all that apply.)",
          options: [
            "Declare the endpoint (and the session dependency) with plain `def`, so FastAPI runs them in the threadpool",
            "Switch to an async driver and `AsyncSession`, and `await` every query",
            "Keep `async def` but run the blocking work with `await run_in_threadpool(...)` or `await asyncio.to_thread(...)`",
            "Add `await asyncio.sleep(0)` before each query",
            "Pass `use_cache=False` to the session dependency",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The problem is blocking the event loop. Moving the call to a thread, or making it genuinely async, both fix it. Yielding once before a blocking call doesn't help, and dependency caching is unrelated.",
        },
        {
          id: "py-fastapi-di-async-q3",
          prompt:
            "100 requests arrive at once at a plain `def` endpoint that blocks for 1 second, on one Uvicorn worker with default settings. Roughly when does the last one finish?",
          options: ["After about 3 seconds", "After about 1 second", "After about 100 seconds", "After about 25 seconds"],
          correctIndex: 0,
          explanation:
            "Sync endpoints run in AnyIO's threadpool, whose default limiter allows 40 concurrent threads, so the requests run in waves of 40, 40 and 20. If the endpoint were `async def` with the same blocking call, they'd run one at a time (about 100 seconds).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-di-async-q4",
          prompt:
            "With default settings in current FastAPI, when does the line after `yield` run?\n\n```python\nasync def get_session():\n    session = Session()\n    try:\n        yield session\n    finally:\n        session.close()  # <- this line\n```",
          options: [
            "After the response has been sent to the client",
            "Right after the endpoint returns, before the response is sent",
            "When the application shuts down",
            "Before the endpoint runs, as soon as the session is created",
          ],
          correctIndex: 0,
          explanation:
            "The default `scope=\"request\"` runs exit code after the response (FastAPI 0.118 restored this so streaming responses can still use the session). `Depends(get_session, scope=\"function\")` closes it when the endpoint returns instead.",
        },
        {
          id: "py-fastapi-di-async-q5",
          prompt:
            "What does the client see, and what shows up in the server logs, when the endpoint raises a `KeyError`?\n\n```python\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    except Exception:\n        db.rollback()\n    finally:\n        db.close()\n```",
          options: [
            "A 500 response, and no traceback in the logs because the exception was swallowed",
            "A 200 response, because the dependency handled the exception",
            "A 500 response with the `KeyError` traceback logged as usual",
            "A 422 response describing the error",
          ],
          correctIndex: 0,
          explanation:
            "FastAPI's docs warn about exactly this: catching in a yield dependency without re-raising hides the error. Add a bare `raise` after the rollback so the exception reaches the handlers and the logs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-di-async-q6",
          prompt: "How do you test an endpoint that depends on `get_current_user` without a real token?",
          options: [
            "Set `app.dependency_overrides[get_current_user] = lambda: fake_user` in the test (and clear it afterwards)",
            "Monkeypatch the `Depends` function globally",
            "Pass `current_user=` as a query parameter from the test client",
            "Mark the dependency `use_cache=False` so it's skipped in tests",
          ],
          correctIndex: 0,
          explanation:
            "`dependency_overrides` maps the original dependency callable to a replacement for every endpoint and sub-dependency that uses it, which is one of the main payoffs of expressing auth and sessions as dependencies.",
        },
        {
          id: "py-fastapi-di-async-q7",
          prompt: "An app passes `lifespan=lifespan` to `FastAPI()` and also defines `@app.on_event(\"startup\")` to warm a cache. What happens to the `on_event` handler?",
          options: [
            "It never runs: when a lifespan is provided, startup and shutdown events aren't called",
            "It runs before the lifespan's startup code",
            "It runs after the lifespan's startup code",
            "FastAPI raises an error at startup",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit: it's all lifespan or all events. `on_event` is deprecated; put the warm-up in the lifespan before `yield` and the cleanup after it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-di-async-q8",
          prompt: "Which statements about FastAPI's `BackgroundTasks` are true? (Select all that apply.)",
          options: [
            "They run after the response is sent, in the same process as the app",
            "If the process restarts before a task runs or finishes, that work is lost",
            "A CPU-heavy `async def` background task still blocks the event loop for other requests",
            "They're persisted to a queue and retried automatically on failure",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Background tasks are an in-process convenience with no durability or retries. For work that must survive restarts, be retried, or run on other machines, use a task queue such as Celery.",
        },
        {
          id: "py-fastapi-di-async-q9",
          prompt:
            "What does this dependency add to every endpoint that uses it?\n\n```python\ndef pagination(skip: int = 0, limit: Annotated[int, Query(le=100)] = 20):\n    return {\"skip\": skip, \"limit\": limit}\n\n@app.get(\"/items\")\ndef items(page: Annotated[dict, Depends(pagination)]): ...\n```",
          options: [
            "Validated `skip` and `limit` query parameters, documented in the OpenAPI schema",
            "Nothing visible to clients; dependency parameters are internal",
            "Two required body fields named `skip` and `limit`",
            "Path parameters `/items/{skip}/{limit}`",
          ],
          correctIndex: 0,
          explanation:
            "A dependency's parameters are resolved exactly like an endpoint's, so they become query parameters with the same validation (`limit=500` gets a 422) and appear in `/docs`.",
        },
        {
          id: "py-fastapi-di-async-q10",
          prompt: "Where should a process-wide HTTP client or database engine be created in a FastAPI app?",
          options: [
            "In the lifespan handler, stored on `app.state` (or in a module-level object) and handed to endpoints through a dependency",
            "In a dependency without `yield`, which FastAPI caches for the life of the app",
            "Inside each endpoint, so every request gets a fresh client",
            "In a background task started with the first request",
          ],
          correctIndex: 0,
          explanation:
            "Dependencies are cached per request, not per app, so creating a client there builds one per request and loses connection reuse. The lifespan opens shared resources before serving traffic and closes them on shutdown.",
        },
      ],
    },
    {
      id: "py-django-orm",
      moduleId: "be-python",
      trackId: "backend",
      title: "Django Models & the ORM",
      summary:
        "Django's ORM maps each model class to a table and each instance to a row, and migrations (`makemigrations`, then `migrate`) turn model changes into versioned schema changes you review and commit. The central abstraction is the `QuerySet`, and its defining property is laziness: `Book.objects.filter(...).exclude(...).order_by(...)` builds SQL without touching the database. It runs when you evaluate it (iteration, `list()`, `len()`, `bool()` including `if qs:`, slicing with a step, `repr()`), and the rows are then cached on that QuerySet, so iterating it again is free. Every chained call, `.all()` included, returns a new, unevaluated QuerySet. `count()` and `exists()` issue cheap queries unless the results are already cached.\n\nThe N+1 problem hides in attribute access. `book.author.name` in a loop, or in a template, runs one query per book. `select_related(\"author\")` fixes it with a SQL join and works for forward foreign keys and one-to-one relations. Many-to-many and reverse relations (`book.tags.all()`, `author.book_set.all()`) need `prefetch_related`, which runs one extra query per relation and stitches the results together in Python; filtering the related manager afterwards (`book.tags.filter(...)`) ignores the prefetch and queries again unless you use a `Prefetch` object. Django 6.1 adds fetch modes: `.fetch_mode(models.FETCH_PEERS)` loads a lazily accessed field for every instance from the same QuerySet at once, and `FETCH_RAISE` turns an accidental lazy load into an exception, which is useful in tests.\n\nWrites have their own traps. `update(stock=F(\"stock\") - 1)` does the arithmetic in SQL and avoids the read-modify-write race, and `Q` objects express OR and NOT. Wrap multi-step writes in `transaction.atomic()`, and use `transaction.on_commit()` to send emails or enqueue tasks only once the data is committed. `QuerySet.update()`, `bulk_create()` and raw SQL skip `save()` and don't send `pre_save`/`post_save`, one reason to keep business rules out of signals.",
      level: "advanced",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "Django: Making queries", url: "https://docs.djangoproject.com/en/6.1/topics/db/queries/", kind: "docs" },
        { label: "Django: Database access optimization", url: "https://docs.djangoproject.com/en/6.1/topics/db/optimization/", kind: "docs" },
        { label: "Django: Fetch modes", url: "https://docs.djangoproject.com/en/6.1/topics/db/fetch-modes/", kind: "docs" },
        { label: "Haki Benita: Handling Concurrency Without Locks", url: "https://hakibenita.com/django-concurrency", kind: "article" },
      ],
      video: {
        title: "Django Query Optimization / select_related & prefetch_related / django-debug-toolbar / N+1 Problem",
        channel: "BugBytes",
        url: "https://www.youtube.com/watch?v=a3dTy8RO5Ho",
        videoId: "a3dTy8RO5Ho",
        durationLabel: "30:32",
      },
      alternateVideos: [
        {
          title: "Python Django Full Course for Beginners | Complete All-in-One Tutorial | 3 Hours",
          channel: "Dave Gray",
          url: "https://www.youtube.com/watch?v=Rp5vd34d-z4",
          videoId: "Rp5vd34d-z4",
          durationLabel: "3:19:48",
          startSeconds: 3017,
          chapterLabel: "Chapter 3: Models & Migrations",
        },
        {
          title: "How to Use Select Related and Prefetch Related in Django",
          channel: "Pretty Printed",
          url: "https://www.youtube.com/watch?v=TzgZBg7oXNA",
          videoId: "TzgZBg7oXNA",
          durationLabel: "9:34",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `BookQuerySet`, a lazy, Django-style QuerySet over an in-memory database, so the tests can count queries the way `django-debug-toolbar` would.\n\n`db.tables` holds `authors` (`{ id, name }`), `books` (`{ id, title, year, authorId }`, where `authorId` may be `null`), `tags` (`{ id, name }`) and `bookTags` (`[bookId, tagId]` pairs). Calling `db.query(label)` stands for one SQL query; after calling it, read what you need from `db.tables`. The labels are `\"books\"`, `\"count\"`, `\"author\"` and `\"tags\"`.\n\nRules:\n\n- `filter(where)`, `exclude(where)`, `orderBy(...fields)`, `selectRelated(...relations)`, `prefetchRelated(...relations)` and `all()` return a new `BookQuerySet`, never query, and leave the original unchanged.\n- `filter` keeps books where every key strictly equals (`===`) the given value; `exclude` drops books where every pair matches (NOT (a AND b)). Several calls combine with AND.\n- `orderBy` replaces any earlier ordering; `\"-year\"` sorts descending and later fields break ties. Without `orderBy`, rows are ordered by `id`.\n- `toArray()` evaluates: the first call runs `db.query(\"books\")` (a `selectRelated(\"author\")` join is part of that same query) and, if `prefetchRelated(\"tags\")` was requested and at least one book matched, a single `db.query(\"tags\")` for all of them. Cache the rows: later calls on the same QuerySet return the same row objects without querying.\n- `count()` returns the cached length if the QuerySet was evaluated; otherwise it runs `db.query(\"count\")` and doesn't fill the cache.\n- `all()` is a fresh, unevaluated copy that queries again when evaluated.\n- Each row is a copy of the book's fields plus two methods. `getAuthor()` returns `null` without a query when `authorId` is `null`; returns the author loaded with the books when `selectRelated(\"author\")` was used; otherwise its first call on that row runs `db.query(\"author\")`, and the `{ id, name }` result is cached on the row. `getTags()` returns the tag names ordered by tag id: the prefetched names without a query when `prefetchRelated(\"tags\")` was used, otherwise a fresh `db.query(\"tags\")` on every call, just like `book.tags.all()`.\n\nThe tests call `runOrmScenario`, which replays chain and evaluation steps and logs, for each evaluation, the queries it ran in brackets. Leave the driver as it is.",
        starterCode: "class BookQuerySet {\n  /**\n   * @param {{ tables: { authors: object[], books: object[], tags: object[], bookTags: number[][] }, query(label: string): void }} db\n   */\n  constructor(db) {\n    this.db = db;\n    // Your code here: keep filters, ordering, related lookups and a result cache\n  }\n\n  filter(where) {}\n\n  exclude(where) {}\n\n  orderBy(...fields) {}\n\n  selectRelated(...relations) {}\n\n  prefetchRelated(...relations) {}\n\n  all() {}\n\n  count() {}\n\n  toArray() {}\n}\n\n// ---- Test driver (leave as is) ----\n// steps: [\"qs\", name] creates a QuerySet; [\"filter\" | \"exclude\" | \"orderBy\" | \"selectRelated\" |\n// \"prefetchRelated\" | \"all\", target, source, ...args] chains; [\"titles\" | \"count\" | \"authors\" |\n// \"authorsTwice\" | \"tags\", name] evaluates. Each evaluating step logs the queries it ran in [brackets].\nfunction runOrmScenario(data, steps) {\n  const labels = [];\n  const db = {\n    tables: data,\n    query(label) {\n      labels.push(label);\n    },\n  };\n  const nameOf = (author) => (author ? author.name : \"-\");\n  const chainOps = new Set([\"filter\", \"exclude\", \"orderBy\", \"selectRelated\", \"prefetchRelated\", \"all\"]);\n  const vars = {};\n  const log = [];\n  for (const [op, target, source, ...rest] of steps) {\n    const before = labels.length;\n    let line = null;\n    if (op === \"qs\") vars[target] = new BookQuerySet(db);\n    else if (chainOps.has(op)) vars[target] = vars[source][op](...rest);\n    else {\n      const qs = vars[target];\n      if (op === \"titles\") line = \"titles:\" + qs.toArray().map((b) => b.title).join(\",\");\n      else if (op === \"count\") line = \"count:\" + qs.count();\n      else if (op === \"authors\") line = \"authors:\" + qs.toArray().map((b) => nameOf(b.getAuthor())).join(\",\");\n      else if (op === \"authorsTwice\")\n        line = \"authorsTwice:\" + qs.toArray().map((b) => nameOf(b.getAuthor()) + \"/\" + nameOf(b.getAuthor())).join(\",\");\n      else if (op === \"tags\") line = \"tags:\" + qs.toArray().map((b) => b.title + \"=\" + b.getTags().join(\"|\")).join(\";\");\n    }\n    const ran = labels.slice(before);\n    if (line !== null) log.push(line + \" [\" + ran.join(\",\") + \"]\");\n    else if (ran.length) log.push(\"unexpected queries during \" + op + \" [\" + ran.join(\",\") + \"]\");\n  }\n  log.push(\"total queries: \" + labels.length);\n  return log;\n}\n",
        functionName: "runOrmScenario",
        testCases: [
          {
            description: "building a chain runs no queries; evaluating runs one",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 2020 }],
                ["exclude", "e", "f", { title: "Z" }],
                ["orderBy", "o", "e", "-year", "title"],
                ["titles", "o"],
              ],
            ],
            expected: ["titles:A,C [books]", "total queries: 1"],
          },
          {
            description: "an evaluated QuerySet caches its rows, and count() uses the cache",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 2020 }],
                ["titles", "f"],
                ["titles", "f"],
                ["count", "f"],
              ],
            ],
            expected: ["titles:A,C [books]", "titles:A,C []", "count:2 []", "total queries: 1"],
          },
          {
            description: "chaining on an evaluated QuerySet, even .all(), builds a new one that queries again",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 2020 }],
                ["titles", "f"],
                ["filter", "g", "f", { title: "A" }],
                ["titles", "g"],
                ["all", "h", "f"],
                ["titles", "h"],
              ],
            ],
            expected: ["titles:A,C [books]", "titles:A [books]", "titles:A,C [books]", "total queries: 3"],
            isEdgeCase: true,
          },
          {
            description: "count() on an unevaluated QuerySet is a COUNT query and doesn't fill the cache",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 2020 }],
                ["count", "f"],
                ["titles", "f"],
              ],
            ],
            expected: ["count:2 [count]", "titles:A,C [books]", "total queries: 2"],
          },
          {
            description: "reading a foreign key per row is N+1 (a null key costs nothing)",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["authors", "q"],
              ],
            ],
            expected: ["authors:Ann,Bo,- [books,author,author]", "total queries: 3"],
            isEdgeCase: true,
          },
          {
            description: "selectRelated joins the author into the main query",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["selectRelated", "s", "q", "author"],
                ["authors", "s"],
              ],
            ],
            expected: ["authors:Ann,Bo,- [books]", "total queries: 1"],
          },
          {
            description: "a loaded author is cached on its row, across iterations of the same QuerySet",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["authorsTwice", "q"],
                ["authors", "q"],
              ],
            ],
            expected: ["authorsTwice:Ann/Ann,Bo/Bo,-/- [books,author,author]", "authors:Ann,Bo,- []", "total queries: 3"],
            isEdgeCase: true,
          },
          {
            description: "many-to-many access without a prefetch queries for every row, on every call",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["tags", "q"],
                ["tags", "q"],
              ],
            ],
            expected: ["tags:A=py|db;B=db;C= [books,tags,tags,tags]", "tags:A=py|db;B=db;C= [tags,tags,tags]", "total queries: 7"],
            isEdgeCase: true,
          },
          {
            description: "prefetchRelated loads every row's tags with one extra query",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["prefetchRelated", "p", "q", "tags"],
                ["tags", "p"],
                ["tags", "p"],
              ],
            ],
            expected: ["tags:A=py|db;B=db;C= [books,tags]", "tags:A=py|db;B=db;C= []", "total queries: 2"],
          },
          {
            description: "the prefetch query is skipped when no rows match",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 1999 }],
                ["prefetchRelated", "p", "f", "tags"],
                ["titles", "p"],
              ],
            ],
            expected: ["titles: [books]", "total queries: 1"],
            isEdgeCase: true,
          },
          {
            description: "selectRelated and prefetchRelated together: two queries in total",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["selectRelated", "s", "q", "author"],
                ["prefetchRelated", "p", "s", "tags"],
                ["authors", "p"],
                ["tags", "p"],
              ],
            ],
            expected: ["authors:Ann,Bo,- [books,tags]", "tags:A=py|db;B=db;C= []", "total queries: 2"],
          },
          {
            description: "exclude drops only rows that match every condition",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["exclude", "e", "q", { year: 2020, title: "A" }],
                ["titles", "e"],
              ],
            ],
            expected: ["titles:B,C [books]", "total queries: 1"],
            isEdgeCase: true,
          },
          {
            description: "orderBy replaces earlier ordering, and later fields break ties",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["orderBy", "o", "q", "title"],
                ["orderBy", "o2", "o", "-year", "-title"],
                ["orderBy", "o3", "q", "-year", "title"],
                ["titles", "o2"],
                ["titles", "o3"],
              ],
            ],
            expected: ["titles:B,C,A [books]", "titles:B,A,C [books]", "total queries: 2"],
          },
          {
            description: "filters combine with AND, null matches null, and the original QuerySet is unchanged",
            args: [
              ormData,
              [
                ["qs", "q"],
                ["filter", "f", "q", { year: 2020 }],
                ["filter", "g", "f", { authorId: null }],
                ["titles", "g"],
                ["titles", "f"],
                ["titles", "q"],
              ],
            ],
            expected: ["titles:C [books]", "titles:A,C [books]", "titles:A,B,C [books]", "total queries: 3"],
            isEdgeCase: true,
          },
          {
            description: "an empty table still costs one query to find out",
            args: [
              { authors: [], tags: [], books: [], bookTags: [] },
              [
                ["qs", "q"],
                ["count", "q"],
                ["titles", "q"],
                ["authors", "q"],
              ],
            ],
            expected: ["count:0 [count]", "titles: [books]", "authors: []", "total queries: 2"],
            isEdgeCase: true,
          },
          {
            description: "150 books: selectRelated costs 1 query, the naive loop costs 151",
            args: [
              ormBigData,
              [
                ["qs", "q"],
                ["selectRelated", "s", "q", "author"],
                ["authors", "s"],
                ["qs", "r"],
                ["authors", "r"],
              ],
            ],
            expected: [
              `authors:${ormBigNames} [books]`,
              `authors:${ormBigNames} [${["books", ...Array.from({ length: 150 }, () => "author")].join(",")}]`,
              "total queries: 152",
            ],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "py-django-views-templates",
      moduleId: "be-python",
      trackId: "backend",
      title: "Django Views & Templates",
      summary:
        "Django calls its pattern MTV: models hold data, views hold request logic, templates render output, and the URLconf maps paths to views. A view is just a callable that takes an `HttpRequest` and returns an `HttpResponse`. Function-based views are explicit and easy to follow; class-based views (`ListView`, `DetailView`, `CreateView`, `UpdateView`) trade that for reuse through inheritance and mixins. `as_view()` builds a fresh instance for every request and dispatches on the HTTP method, so instance attributes are per request, but a mutable class attribute is shared by every request. Generic CBVs shine for standard CRUD and get hard to follow once you override half a dozen hooks (`get_queryset`, `get_context_data`, `form_valid`).\n\nTemplates are deliberately limited: variables, filters and tags, no arbitrary Python. A dotted lookup tries a dictionary key, then an attribute (calling methods without arguments), then a list index, and a missing variable silently renders as an empty string. That convenience hides queries: `{{ book.author.name }}` inside `{% for book in books %}` runs one query per iteration, so the view has to pass a QuerySet with `select_related` or `prefetch_related`. Output is auto-escaped by default, Django's main XSS defence; `|safe`, `mark_safe()` and `{% autoescape off %}` disable it and belong only on content you have sanitised. Django 6.0 added template partials (`{% partialdef %}`) for htmx-style fragments and built-in Content Security Policy support.\n\n`CsrfViewMiddleware` answers 403 to POST, PUT, PATCH and DELETE requests without a valid token, so every POST form needs `{% csrf_token %}` and JavaScript clients send the `X-CSRFToken` header; reserve `@csrf_exempt` for endpoints that authenticate another way, such as signed webhooks. The admin generates a working back office from your models in minutes. It's meant for trusted staff, and on large tables it needs `list_select_related`, `raw_id_fields` or `autocomplete_fields` to stay fast.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Django: Introduction to class-based views", url: "https://docs.djangoproject.com/en/6.1/topics/class-based-views/", kind: "docs" },
        { label: "Django: The Django template language", url: "https://docs.djangoproject.com/en/6.1/ref/templates/language/", kind: "docs" },
        { label: "Django: How to use Django's CSRF protection", url: "https://docs.djangoproject.com/en/6.1/howto/csrf/", kind: "docs" },
        { label: "Luke Plant: Django Views — The Right Way", url: "https://spookylukey.github.io/django-views-the-right-way/", kind: "article" },
      ],
      video: {
        title: "Django Crash Course – Python Web Framework",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=0roB7wZMLqI",
        videoId: "0roB7wZMLqI",
        durationLabel: "1:09:07",
        startSeconds: 456,
        chapterLabel: "Views",
      },
      alternateVideos: [
        {
          title: "Python Django Full Course for Beginners | Complete All-in-One Tutorial | 3 Hours",
          channel: "Dave Gray",
          url: "https://www.youtube.com/watch?v=Rp5vd34d-z4",
          videoId: "Rp5vd34d-z4",
          durationLabel: "3:19:48",
          startSeconds: 1673,
          chapterLabel: "Chapter 2: Apps & Templates",
        },
        {
          title: "Easily Convert Django Function Based Views To Class Based Views",
          channel: "Dennis Ivy",
          url: "https://www.youtube.com/watch?v=-3BN-JMLE0A",
          videoId: "-3BN-JMLE0A",
          durationLabel: "11:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-django-views-templates-q1",
          prompt:
            "The view passes `books = Book.objects.all()` (50 books) to this template. How many queries does rendering it run, and what's the fix?\n\n```django\n{% for book in books %}\n  <li>{{ book.title }} by {{ book.author.name }}</li>\n{% endfor %}\n```",
          options: [
            "51; pass `Book.objects.select_related(\"author\")` from the view",
            "1; templates batch related lookups automatically",
            "2; one for the books and one for all authors",
            "51; add `{% cache %}` around the loop to remove the extra queries",
          ],
          correctIndex: 0,
          explanation:
            "Each `book.author` access lazily loads that author, so the loop costs 1 + 50 queries. The fix belongs in the view's QuerySet; template caching only hides the cost on repeated renders.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-django-views-templates-q2",
          prompt: "A comment body is `<script>alert(1)</script>` and the template renders `{{ comment.body }}`. What reaches the browser?",
          options: [
            "`&lt;script&gt;alert(1)&lt;/script&gt;`, displayed as text",
            "`<script>alert(1)</script>`, which executes",
            "An empty string, because Django strips HTML tags",
            "A `TemplateSyntaxError`",
          ],
          correctIndex: 0,
          explanation:
            "Auto-escaping converts `<`, `>`, `&` and quotes into entities. Only `|safe`, `mark_safe()` or `{% autoescape off %}` would emit the raw tag, which is why they should never touch unsanitised user input.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-django-views-templates-q3",
          prompt: "With `CsrfViewMiddleware` enabled, a hand-written HTML form posts to a Django view but omits `{% csrf_token %}`. What happens?",
          options: [
            "Django responds 403 (CSRF verification failed) and the view never runs",
            "The view runs, and `request.POST` is empty",
            "Django logs a warning and processes the request",
            "Django redirects to the login page",
          ],
          correctIndex: 0,
          explanation:
            "Unsafe methods need a valid token that matches the CSRF cookie; without it the middleware rejects the request before the view. GET requests aren't checked, which is one more reason GET handlers must never change state.",
        },
        {
          id: "py-django-views-templates-q4",
          prompt: "The context is `{\"d\": {\"items\": \"dict value\"}, \"xs\": [\"a\", \"b\"]}`. Which statements about these lookups are true? (Select all that apply.)",
          options: [
            "`{{ d.items }}` renders `dict value`, because a dictionary key is tried before an attribute",
            "`{{ xs.1 }}` renders `b`",
            "`{{ nope.x }}` renders an empty string rather than raising",
            "`{{ d.items }}` always calls the dict's `.items()` method",
            "`{{ xs[1] }}` is valid template syntax",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Dotted lookups try key, then attribute or method, then index, and invalid variables render as `string_if_invalid` (empty by default), so typos fail silently. Square-bracket indexing isn't template syntax.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-django-views-templates-q5",
          prompt:
            "What do two consecutive requests to this view return?\n\n```python\nclass HitView(View):\n    hits = []\n\n    def get(self, request):\n        self.hits.append(1)\n        return HttpResponse(str(len(self.hits)))\n```",
          options: ["`1`, then `2`", "`1`, then `1`", "`0`, then `1`", "An error, because class-based views can't define attributes"],
          correctIndex: 0,
          explanation:
            "`as_view()` creates a new instance per request, but `self.hits` resolves to the class attribute, one list shared by every request (and thread). Set per-request state in methods (`self.hits = []`) or keep shared state somewhere designed for it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-django-views-templates-q6",
          prompt: "A `ListView` must show only the logged-in user's orders. Which hook should you override?",
          options: [
            "`get_queryset()`, returning `Order.objects.filter(owner=self.request.user)`",
            "`get_context_data()`, deleting other users' orders from the context",
            "`get_template_names()`, choosing a template that hides other orders",
            "`dispatch()`, raising `PermissionDenied` for every other order",
          ],
          correctIndex: 0,
          explanation:
            "Filtering at the QuerySet keeps the restriction in the database query, and pagination and counts stay correct. Filtering later loads other users' data and is easy to bypass.",
        },
        {
          id: "py-django-views-templates-q7",
          prompt: "Which endpoints are reasonable candidates for `@csrf_exempt`? (Select all that apply.)",
          options: [
            "A payment provider's webhook that verifies an HMAC signature on each request",
            "A machine-to-machine endpoint authenticated only by an API key in a header, never by cookies",
            "The login form, because users aren't authenticated yet",
            "A profile-update form, to fix a 403 seen in the browser",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "CSRF exploits a browser's ambient cookies, so endpoints authenticated by signatures or headers don't need the token. Login forms are a classic CSRF target (login CSRF), and a 403 on a browser form means the token is missing, not that protection should go.",
        },
        {
          id: "py-django-views-templates-q8",
          prompt: "In `MIDDLEWARE`, why must `AuthenticationMiddleware` come after `SessionMiddleware`?",
          options: [
            "It reads the user id from the session, which `SessionMiddleware` must have attached to the request first",
            "Middleware runs bottom-up, so the later entry actually runs first",
            "`SessionMiddleware` sets the CSRF cookie that authentication checks",
            "It's only a convention; the order doesn't matter",
          ],
          correctIndex: 0,
          explanation:
            "Request processing runs top-down through `MIDDLEWARE` (and responses bottom-up), and `request.user` is resolved lazily from `request.session`. With the wrong order, `AuthenticationMiddleware` raises `ImproperlyConfigured` asking you to put `SessionMiddleware` before it.",
        },
        {
          id: "py-django-views-templates-q9",
          prompt:
            "The admin changelist for `Book` shows an `author` column and takes seconds to load on a large table. What's the targeted fix on Django 6.1?",
          options: [
            "Set `list_select_related = [\"author\"]` on the `ModelAdmin` so the list query joins the author",
            "Set `list_select_related = True`",
            "Disable the admin for `Book`",
            "Add `ordering = [\"author\"]`",
          ],
          correctIndex: 0,
          explanation:
            "Each row's `author` otherwise costs a query. Naming the relations is precise, and Django 6.1 deprecates `list_select_related = True` (as it does calling `select_related()` with no arguments).",
        },
        {
          id: "py-django-views-templates-q10",
          prompt: "Which of these arrived in Django 6.0? (Select all that apply.)",
          options: [
            "Built-in Content Security Policy support, with `ContentSecurityPolicyMiddleware`",
            "Template partials with `{% partialdef %}` and `template_name#partial` references",
            "A built-in background tasks framework (`django.tasks`) that queues work but doesn't ship a worker",
            "Class-based views, as an alternative to function-based views",
            "Automatic `select_related` whenever a template reads a foreign key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Django 6.0 (December 2025) added CSP, template partials and the Tasks framework; executing tasks still needs external workers. Class-based views date back to Django 1.3, and nothing selects related objects automatically.",
        },
      ],
    },
    {
      id: "py-drf",
      moduleId: "be-python",
      trackId: "backend",
      title: "Django REST Framework for APIs",
      summary:
        "Django REST framework (DRF) adds the API layer Django lacks: parsing and content negotiation, serializers, generic views and viewsets, authentication, permissions, throttling, pagination and a browsable API. Serializers work in both directions. Reading, they turn model instances into primitive data (`serializer.data`). Writing, `is_valid()` runs field validation, `validate_<field>()` and object-level `validate()`, exposes `validated_data`, and `save()` calls your `create()` or `update()`; calling `save()` before `is_valid()` is an assertion error. `ModelSerializer` derives fields and validators (unique constraints included) from the model, but nested writes still need explicit code, and `fields = \"__all__\"` exposes every column you add later, so list fields explicitly.\n\n`ModelViewSet` plus a router gives you list, create, retrieve, update, partial update and destroy on two URL patterns, and `@action(detail=True)` adds endpoints like `/books/{pk}/publish/`. The speed has a hidden cost: nested serializers and `SerializerMethodField`s run a query per object unless `get_queryset()` adds `select_related`/`prefetch_related`, and serialization itself is slow on large responses.\n\nThe defaults that matter for security surprise people. `DEFAULT_PERMISSION_CLASSES` is `AllowAny` until you change it. Permissions run before the handler, but `has_object_permission()` only runs when the view calls `get_object()`, so a list endpoint must filter its queryset or it will list objects the user couldn't retrieve. Throttling lives in Django's cache and uses non-atomic operations, and the docs say not to treat it as protection against brute force; with the default per-process `LocMemCache` the limits don't hold across workers. Pagination is off by default and only applies automatically to generic views and viewsets. `CursorPagination` stays fast and consistent on large, changing tables, but needs a unique, unchanging ordering.",
      level: "intermediate",
      estMinutes: 75,
      webRefs: [
        { label: "DRF: Serializers", url: "https://www.django-rest-framework.org/api-guide/serializers/", kind: "docs" },
        { label: "DRF: Permissions", url: "https://www.django-rest-framework.org/api-guide/permissions/", kind: "docs" },
        { label: "DRF: Throttling", url: "https://www.django-rest-framework.org/api-guide/throttling/", kind: "docs" },
        { label: "Haki Benita: Improve Serialization Performance in Django Rest Framework", url: "https://hakibenita.com/django-rest-framework-slow", kind: "article" },
      ],
      video: {
        title: "Django REST Framework Course – Build Web APIs with Python",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=tujhGdn1EMI",
        videoId: "tujhGdn1EMI",
        durationLabel: "1:26:49",
        startSeconds: 1502,
        chapterLabel: "Module 3: Create first API endpoint",
      },
      alternateVideos: [
        {
          title: "Django REST Framework - Serializers & Response objects | Browsable API",
          channel: "BugBytes",
          url: "https://www.youtube.com/watch?v=BMym71Dwox0",
          videoId: "BMym71Dwox0",
          durationLabel: "24:54",
        },
        {
          title: "API Throttling with Django REST Framework",
          channel: "BugBytes",
          url: "https://www.youtube.com/watch?v=95ndK3P9YLI",
          videoId: "95ndK3P9YLI",
          durationLabel: "15:34",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-drf-q1",
          prompt:
            "A project registers `ModelViewSet` for `Invoice` and never touches `DEFAULT_PERMISSION_CLASSES` or `permission_classes`. What can an anonymous client do?",
          options: [
            "List, create, update and delete invoices, because the default permission class is `AllowAny`",
            "Only list and retrieve, because unsafe methods require authentication by default",
            "Nothing, because DRF denies unauthenticated requests by default",
            "Only access the browsable API",
          ],
          correctIndex: 0,
          explanation:
            "DRF's default is permissive. Set a project-wide default such as `IsAuthenticated` and loosen it per view, rather than the other way round.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-drf-q2",
          prompt:
            "`IsOwner` implements only `has_object_permission()` (returning `obj.owner == request.user`) and is applied to a `ModelViewSet` whose queryset is `Document.objects.all()`. What does `GET /documents/` return to Alice?",
          options: [
            "Every user's documents: object permissions aren't checked for list views",
            "Only Alice's documents, because the permission filters each object",
            "A 403, because at least one object fails the check",
            "An empty list until she requests a specific document",
          ],
          correctIndex: 0,
          explanation:
            "`has_object_permission()` runs only when `get_object()` is called (retrieve, update, destroy). The fix is `get_queryset()` returning `Document.objects.filter(owner=self.request.user)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-drf-q3",
          prompt:
            "What happens?\n\n```python\nserializer = BookSerializer(data=request.data)\nbook = serializer.save()\n```",
          options: [
            "An `AssertionError`: you must call `.is_valid()` before calling `.save()`",
            "The book is saved without validation",
            "`save()` validates implicitly and raises `ValidationError` on bad input",
            "It returns `None` because the data wasn't validated",
          ],
          correctIndex: 0,
          explanation:
            "`validated_data` only exists after `is_valid()`. The idiomatic form is `serializer.is_valid(raise_exception=True)`, which turns validation errors into a 400 response.",
        },
        {
          id: "py-drf-q4",
          prompt:
            "`router = DefaultRouter(); router.register(\"books\", BookViewSet)`, where `BookViewSet` is a `ModelViewSet` with `@action(detail=True, methods=[\"post\"]) def publish(...)` and `@action(detail=False) def recent(...)`. Which routes exist? (Select all that apply.)",
          options: [
            "`/books/` (list and create)",
            "`/books/{pk}/` (retrieve, update, partial update, destroy)",
            "`/books/{pk}/publish/`",
            "`/books/recent/`",
            "`/books/{pk}/recent/`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`detail=True` actions hang off the detail route and `detail=False` actions off the list route, so there's no `/books/{pk}/recent/`. `DefaultRouter` also adds an API root view and format-suffix variants.",
        },
        {
          id: "py-drf-q5",
          prompt:
            "A list endpoint returns 100 books, each serialized with a nested `AuthorSerializer` and a `tags = TagSerializer(many=True)` field. The viewset's queryset is `Book.objects.all()`. What does the query log show, and what's the fix?",
          options: [
            "About 201 queries; override `get_queryset()` to use `select_related(\"author\").prefetch_related(\"tags\")`",
            "1 query, because DRF joins nested serializers automatically",
            "3 queries, because DRF prefetches each nested field once",
            "About 201 queries; switch to `HyperlinkedModelSerializer` to fix it",
          ],
          correctIndex: 0,
          explanation:
            "Each nested serializer reads a relation per object: one query for the books, 100 for authors and 100 for tags. Serializers never optimise querysets for you; the view must.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-drf-q6",
          prompt: "Which statements about DRF's built-in throttling are true? (Select all that apply.)",
          options: [
            "The docs say it shouldn't be treated as a security measure against brute-force or denial-of-service attacks",
            "It uses non-atomic cache operations, so concurrent requests can slightly exceed the limit",
            "With the default local-memory cache, each worker process keeps its own counters",
            "It's enforced by the database with row locks, so limits are exact",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Throttling is for business rules and fair usage. For login protection use a shared cache such as Redis with atomic counters, or a gateway-level rate limiter, and configure `NUM_PROXIES` correctly so client IPs are right.",
        },
        {
          id: "py-drf-q7",
          prompt: "A team adds `PageNumberPagination` as `DEFAULT_PAGINATION_CLASS` but forgets `PAGE_SIZE`, and one custom `APIView` returns all rows. Which statements explain what they see? (Select all that apply.)",
          options: [
            "Pagination is off unless both a pagination class and a page size are configured (both default to `None`)",
            "Plain `APIView`s aren't paginated automatically; they have to call the paginator themselves",
            "Generic views and viewsets apply the pagination class automatically once it's configured",
            "`APIView` paginates automatically, but only for GET requests",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Automatic pagination is a feature of the generic views (`ListAPIView`, `ModelViewSet`, ...). With `PAGE_SIZE` unset the page-number paginator has nothing to page by, and a hand-written `APIView` must use `paginate_queryset()` explicitly.",
        },
        {
          id: "py-drf-q8",
          prompt: "Why choose `CursorPagination` for an activity feed with millions of rows and constant inserts?",
          options: [
            "It seeks from an opaque position instead of `OFFSET`, so pages stay fast and items don't repeat or vanish as rows are inserted, given a unique, unchanging ordering",
            "It returns total counts faster than page-number pagination",
            "It lets clients jump directly to page 5,000",
            "It works with any ordering, including by `title`",
          ],
          correctIndex: 0,
          explanation:
            "Offsets get slower as they grow and shift when rows are inserted. Cursor pagination trades random access and totals for stability; it needs an ordering such as `-created` (the default, which assumes a `created` field) that uniquely identifies positions.",
        },
        {
          id: "py-drf-q9",
          prompt: "What's the risk of `fields = \"__all__\"` on a `ModelSerializer` used by a public endpoint?",
          options: [
            "Every column added to the model later, such as `is_staff` or `internal_notes`, is automatically exposed, and possibly writable",
            "It disables validation for all fields",
            "It makes every field read-only",
            "It triggers one query per field",
          ],
          correctIndex: 0,
          explanation:
            "The serializer's shape follows the model silently. Explicit `fields` (and `read_only_fields`) make the API contract a deliberate decision that shows up in code review.",
        },
        {
          id: "py-drf-q10",
          prompt:
            "`BookSerializer` declares `author = AuthorSerializer()` and a client POSTs `{\"title\": \"X\", \"year\": 2020, \"author\": {\"name\": \"Ann\"}}`. What happens on `serializer.save()` if you haven't written `create()`?",
          options: [
            "An `AssertionError` saying `.create()` doesn't support writable nested fields by default",
            "DRF creates the author and the book in one transaction",
            "DRF saves the book and silently ignores the nested author",
            "`is_valid()` fails because nested data isn't accepted",
          ],
          correctIndex: 0,
          explanation:
            "Validation passes, but `ModelSerializer.create()` refuses nested writes because DRF can't guess whether to create, update or link the related object. Write `create()` explicitly, or accept an `author_id` with a `PrimaryKeyRelatedField`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "py-celery-redis",
      moduleId: "be-python",
      trackId: "backend",
      title: "Background Jobs with Celery & Redis",
      summary:
        "Celery moves work out of the request cycle: the web process sends a message describing a task to a broker, and separate worker processes consume and run it. The broker (Redis or RabbitMQ) carries messages; the result backend stores states and return values and is optional, so tasks whose results nobody reads should set `ignore_result=True`. By default a task is acknowledged just before it runs, so a worker killed mid-task loses it. With `acks_late=True` the acknowledgement comes after the task finishes and a crash means redelivery, so the task may run twice. That's the real choice, at-most-once or at-least-once; exactly-once doesn't exist, so tasks must be idempotent (a conditional status update, an idempotency key, an upsert). Workers also prefetch messages (`worker_prefetch_multiplier` defaults to 4), which starves fairness when tasks are long.\n\nThe Redis broker has a sharp edge, the visibility timeout (one hour by default). A message that isn't acknowledged in time is redelivered to another worker, so a task with a countdown or ETA beyond it, or a long `acks_late` task, can run again and again. Keep the timeout above your longest ETA and runtime.\n\nRetries should back off. `autoretry_for=(ConnectionError,)` with `retry_backoff=True` waits 1 s, 2 s, 4 s and so on, capped by `retry_backoff_max` (600 s), with full jitter on by default (a random delay between zero and the computed backoff) so failing tasks don't retry in lockstep; `max_retries` defaults to 3. `self.retry()` raises, so code after it never runs. Pass IDs rather than ORM objects and re-read the row in the task, and enqueue from Django with `transaction.on_commit()` or Celery's `delay_on_commit()` so a worker never looks for a row that hasn't been committed. Celery beat schedules periodic tasks, and only one beat process may run for a schedule, or every job fires twice.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Celery: Tasks (retries, acks_late, idempotence)", url: "https://docs.celeryq.dev/en/stable/userguide/tasks.html", kind: "docs" },
        { label: "Celery: Using Redis (visibility timeout)", url: "https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html", kind: "docs" },
        { label: "Celery: Periodic Tasks", url: "https://docs.celeryq.dev/en/stable/userguide/periodic-tasks.html", kind: "docs" },
        {
          label: "Adam Johnson: Common Issues Using Celery (And Other Task Queues)",
          url: "https://adamj.eu/tech/2020/02/03/common-celery-issues-on-django-projects/",
          kind: "article",
        },
      ],
      video: {
        title: "Professional Task Queues in Python with Celery, RabbitMQ & Redis",
        channel: "NeuralNine",
        url: "https://www.youtube.com/watch?v=0gtdUkEzzn4",
        videoId: "0gtdUkEzzn4",
        durationLabel: "26:48",
      },
      alternateVideos: [
        {
          title: "Getting Started With Celery: Asynchronous Tasks in Python",
          channel: "Pretty Printed",
          url: "https://www.youtube.com/watch?v=VRHVEporra0",
          videoId: "VRHVEporra0",
          durationLabel: "11:34",
        },
        {
          title: "Celery tasks with Django REST Framework!",
          channel: "BugBytes",
          url: "https://www.youtube.com/watch?v=E6HPMk0bKPY",
          videoId: "E6HPMk0bKPY",
          durationLabel: "17:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-celery-redis-q1",
          prompt: "Which statements about Celery's broker and result backend are true? (Select all that apply.)",
          options: [
            "The broker transports task messages from producers to workers",
            "The result backend stores task states and return values, and is only needed if something reads them",
            "Redis can serve as both the broker and the result backend",
            "Workers can't run tasks unless a result backend is configured",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "They're separate roles that one Redis instance can fill. Fire-and-forget tasks don't need a backend at all; storing results nobody reads just wastes memory, hence `ignore_result=True`.",
        },
        {
          id: "py-celery-redis-q2",
          prompt:
            "A worker is killed with SIGKILL halfway through `generate_invoice(42)`. Which statement is accurate?",
          options: [
            "With default settings the message was already acknowledged, so the task is lost; with `acks_late=True` it's redelivered and may run a second time",
            "With default settings the task is redelivered automatically; `acks_late` makes no difference",
            "Celery guarantees exactly-once execution, so the task resumes where it stopped",
            "The result backend replays the task from its stored state",
          ],
          correctIndex: 0,
          explanation:
            "Early acknowledgement means at-most-once; late acknowledgement means at-least-once. Neither resumes partial work, which is why tasks should be idempotent, and why `task_reject_on_worker_lost` exists for the late-ack case.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-celery-redis-q3",
          prompt:
            "With Redis as the broker and default settings, a reminder is scheduled with `send_reminder.apply_async(args=[user_id], countdown=2 * 60 * 60)`. What can happen?",
          options: [
            "The reminder can be sent more than once, because the unacknowledged message outlives the one-hour visibility timeout and is redelivered",
            "Nothing unusual; countdowns are stored in the result backend",
            "Redis rejects countdowns longer than one hour",
            "The task runs after exactly two hours on the worker that scheduled it",
          ],
          correctIndex: 0,
          explanation:
            "Workers hold ETA and countdown tasks unacknowledged until they're due, so Redis redelivers them after the visibility timeout. Raise `visibility_timeout` above your longest ETA, or schedule far-future work differently (e.g. a periodic task that scans a table).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-celery-redis-q4",
          prompt:
            "`charge_order(order_id)` runs with `acks_late=True`, so it can be delivered twice. Which implementations stay correct if it runs twice? (Select all that apply.)",
          options: [
            "`UPDATE orders SET status='charging' WHERE id=%s AND status='pending'` and proceed only if one row changed",
            "Send the payment provider an idempotency key derived from the order id",
            "Record the charge with an insert that has a unique constraint on `order_id`, treating a duplicate as already done",
            "`order.charge_count += 1; order.save()` after calling the provider",
            "Check `order.status == 'pending'` in Python, call the provider, then save `status='paid'`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Idempotency needs an atomic guard: a conditional update, a unique constraint, or the provider's own idempotency key. A read-then-write check in Python races with a concurrent duplicate, and incrementing a counter is the opposite of idempotent.",
        },
        {
          id: "py-celery-redis-q5",
          prompt:
            "This task always raises `TimeoutError`. With otherwise default options, what happens?\n\n```python\n@app.task(autoretry_for=(TimeoutError,), retry_backoff=True, retry_jitter=False)\ndef sync_crm(contact_id):\n    crm.push(contact_id)\n```",
          options: [
            "It's retried 3 times, after 1 s, 2 s and 4 s, then fails permanently",
            "It's retried forever with the delay doubling up to 600 s",
            "It's retried 3 times, each after the default 180 s delay",
            "It's retried 5 times, after 2 s, 4 s, 8 s, 16 s and 32 s",
          ],
          correctIndex: 0,
          explanation:
            "`max_retries` defaults to 3, and `retry_backoff=True` uses a factor of 1, so the delays are 1 × 2^retries: 1, 2 and 4 seconds (capped by `retry_backoff_max`, 600 s). The 180 s `default_retry_delay` applies only when no backoff or countdown is given.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-celery-redis-q6",
          prompt: "`retry_jitter` is left at its default and the computed exponential backoff for a retry is 8 seconds. What delay does Celery use?",
          options: [
            "A random whole number of seconds from 0 to 8 (full jitter)",
            "Exactly 8 seconds; jitter is off by default",
            "8 seconds plus a random 0–1 second",
            "A random delay between 8 and 16 seconds",
          ],
          correctIndex: 0,
          explanation:
            "Jitter defaults to `True`, and Celery applies full jitter, `randrange(countdown + 1)`, so thousands of tasks failing together don't retry in synchronized waves.",
        },
        {
          id: "py-celery-redis-q7",
          prompt:
            "What does this task log when the API call fails?\n\n```python\n@app.task(bind=True, max_retries=5)\ndef fetch_rates(self):\n    try:\n        return api.get_rates()\n    except ApiError as exc:\n        self.retry(exc=exc, countdown=30)\n        logger.warning(\"retry scheduled\")\n```",
          options: [
            "Nothing: `self.retry()` raises a `Retry` exception, so the warning line never runs",
            "\"retry scheduled\", once per failure",
            "\"retry scheduled\", then the task returns `None` as success",
            "It raises `ApiError` immediately and never retries",
          ],
          correctIndex: 0,
          explanation:
            "`retry()` sends a new message with the same task id and then raises `Retry` so the worker records the retry state. The idiom is `raise self.retry(exc=exc, countdown=30)`, which makes the control flow obvious.",
        },
        {
          id: "py-celery-redis-q8",
          prompt:
            "A Django view does this, and workers intermittently fail with `Order.DoesNotExist`. Why, and what's the fix?\n\n```python\nwith transaction.atomic():\n    order = Order.objects.create(**data)\n    send_confirmation.delay(order.id)\n```",
          options: [
            "The worker can run before the transaction commits, so the row isn't visible yet; enqueue with `transaction.on_commit(...)` or `send_confirmation.delay_on_commit(order.id)`",
            "Celery serializes the id as a string, so the lookup fails; pass the whole `Order` object instead",
            "The worker uses a different database by default; configure `CELERY_DATABASE`",
            "`delay()` can't be called inside `atomic()`; it raises and the order is never created",
          ],
          correctIndex: 0,
          explanation:
            "The message is published immediately, but the row only becomes visible at commit, and if the transaction rolls back the task shouldn't run at all. Passing the model instance would make things worse: stale data plus pickling concerns.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-celery-redis-q9",
          prompt: "A deployment runs every worker with `celery worker -B` (embedded beat) and scales to 4 worker containers. What happens to a nightly report scheduled with beat?",
          options: [
            "It's sent 4 times, because each container runs its own beat scheduler",
            "It's sent once; beat instances elect a leader automatically",
            "It's sent once, by whichever worker finishes first",
            "Beat refuses to start when more than one worker exists",
          ],
          correctIndex: 0,
          explanation:
            "The Celery docs say only one scheduler may run for a schedule, and describe `-B` as unsuitable for production. Run a single, separate beat process (or a scheduler with locking) alongside the workers.",
        },
        {
          id: "py-celery-redis-q10",
          prompt:
            "Workers run 10-minute video transcodes with `--concurrency=4` and the default prefetch multiplier. Some jobs sit waiting while other workers are idle. What's the usual fix?",
          options: [
            "Set `worker_prefetch_multiplier = 1`, typically with `acks_late=True`, so each worker reserves only what it's running",
            "Raise the prefetch multiplier so idle workers grab more tasks from the queue in each round trip",
            "Switch the result backend from Redis to a database so task states are distributed more evenly",
            "Lower `retry_backoff_max` so waiting jobs are retried on another worker sooner",
          ],
          correctIndex: 0,
          explanation:
            "With the default multiplier of 4, each worker process can reserve several long tasks ahead of time, stranding them behind a busy worker. Prefetching one at a time spreads long tasks evenly; it matters less for short tasks.",
        },
      ],
    },
    {
      id: "py-fastapi-vs-django",
      moduleId: "be-python",
      trackId: "backend",
      title: "FastAPI vs Django: When to Use Which",
      summary:
        "This is a decision about what you want the framework to own. Django is batteries-included: ORM and migrations, admin, auth and sessions, forms, templates, CSRF and XSS protections and i18n, designed together and stable across releases, with DRF as a mature API toolkit on top. It shines for data-heavy products with a relational core, back-office needs and server-rendered pages. FastAPI is a thin, typed API layer: validation, dependency injection and OpenAPI generated from annotations, ASGI-native async, and little else. You pick the ORM (SQLAlchemy or SQLModel), migrations (Alembic), auth, admin and task queue yourself. It shines for API-only services, typed contracts shared with clients, heavy I/O fan-out (other services, LLM APIs, websockets) and model serving next to Python data tooling.\n\nThe performance argument is weaker than benchmarks suggest. Framework overhead is rarely the bottleneck next to queries, N+1s and serialization, and async only helps if the whole path is async: a FastAPI app full of blocking calls inside `async def` is slower than a plain synchronous Django app. Django has async views and `a`-prefixed ORM methods, but in 6.1 those methods still run the synchronous query in a thread via `sync_to_async`, and transactions don't work in async mode. For many concurrent I/O-bound calls, FastAPI's async-first design is a genuine advantage.\n\nThink in total cost of ownership. Django's conventions make a codebase navigable for new hires, and the admin alone can save months; FastAPI's freedom means designing and maintaining your own conventions for layout, sessions, auth and migrations. Mixed estates are common: Django for the core product and admin, FastAPI services for specific high-concurrency or ML endpoints, with one clear owner of the database schema. Background work needs a real queue in both; Django 6.0's Tasks framework standardizes the API but doesn't ship a worker.",
      level: "advanced",
      estMinutes: 40,
      isMilestone: true,
      webRefs: [
        { label: "Django: Asynchronous support", url: "https://docs.djangoproject.com/en/6.1/topics/async/", kind: "docs" },
        { label: "FastAPI: Alternatives, Inspiration and Comparisons", url: "https://fastapi.tiangolo.com/alternatives/", kind: "docs" },
        { label: "Django: Tasks framework", url: "https://docs.djangoproject.com/en/6.1/topics/tasks/", kind: "docs" },
        { label: "Armin Ronacher: I'm not feeling the async pressure", url: "https://lucumr.pocoo.org/2020/1/1/async-pressure/", kind: "article" },
      ],
      video: {
        title: "FastAPI, Flask or Django - Which Should You Use?",
        channel: "Tech With Tim",
        url: "https://www.youtube.com/watch?v=cNlJCQHSmbE",
        videoId: "cNlJCQHSmbE",
        durationLabel: "9:49",
      },
      alternateVideos: [
        {
          title: "FastAPI vs. Django REST Framework: Which One Should You Choose?",
          channel: "Eric Roby",
          url: "https://www.youtube.com/watch?v=bGw9An9rI18",
          videoId: "bGw9An9rI18",
          durationLabel: "5:57",
        },
        {
          title: "DjangoCon 2022 | Async Django: The practical guide you've been **awaiting** for.",
          channel: "DjangoCon Europe",
          url: "https://www.youtube.com/watch?v=B5uQPwX4VLo",
          videoId: "B5uQPwX4VLo",
          durationLabel: "42:43",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "py-fastapi-vs-django-q1",
          prompt:
            "A four-person team is building a B2B inventory product: a relational core, staff who need a back office on day one, server-rendered pages plus a few JSON endpoints, and a codebase that must stay maintainable for years. Which is the stronger default?",
          options: [
            "Django (with DRF for the API parts): ORM, migrations, admin, auth and forms come integrated",
            "FastAPI, because async makes every request faster",
            "FastAPI, because Django can't serve JSON",
            "Either, since the two frameworks provide the same built-in features",
          ],
          correctIndex: 0,
          explanation:
            "The admin, auth, forms and migrations are exactly what this team would otherwise assemble by hand. Django serves JSON fine (DRF or plain `JsonResponse`), and nothing here is concurrency-bound.",
        },
        {
          id: "py-fastapi-vs-django-q2",
          prompt:
            "A service has no UI; each request calls five external HTTP APIs (including an LLM API) and aggregates the results, traffic is spiky and highly concurrent, and TypeScript and mobile clients want a typed OpenAPI contract. Which is the stronger default?",
          options: [
            "FastAPI with an async HTTP client such as `httpx.AsyncClient`, fanning out with `asyncio.gather`",
            "Django with synchronous views and `requests`, one thread per call",
            "Django admin with a custom action",
            "Either; concurrency model doesn't matter for I/O-bound work",
          ],
          correctIndex: 0,
          explanation:
            "Concurrent outbound I/O is where an async-first stack pays off, and the OpenAPI schema falls out of the Pydantic models. Synchronous views would tie up a worker thread per in-flight request.",
        },
        {
          id: "py-fastapi-vs-django-q3",
          prompt:
            "A team ports a Django API to FastAPI \"for performance\", converting every view to `async def` but keeping synchronous SQLAlchemy sessions and `requests`. Under load it's slower than before. Why?",
          options: [
            "Every blocking call now runs on the event loop and serializes requests on each worker, whereas Django's sync views ran on separate threads or processes",
            "Pydantic validation is much slower than Django forms, so every request pays a large parsing overhead",
            "SQLAlchemy sessions can't be shared with FastAPI dependencies, so each query opens a new connection",
            "ASGI servers process one request per worker at a time, while WSGI servers handle many in parallel",
          ],
          correctIndex: 0,
          explanation:
            "Async only helps when the whole path awaits non-blocking I/O. Here the fix is either plain `def` endpoints (threadpool) or genuinely async drivers; the framework itself was never the bottleneck.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-vs-django-q4",
          prompt: "Which statements about async in Django 6.1 are accurate? (Select all that apply.)",
          options: [
            "`await Book.objects.aget(pk=1)` still runs the synchronous query in a thread via `sync_to_async`",
            "Transactions don't work in async mode; wrap transactional code in a sync function called with `sync_to_async`",
            "Async views deployed under WSGI run in a one-off event loop and don't get the benefits of an async stack",
            "Django's ORM talks to PostgreSQL through a native async driver, so async views never touch threads",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Django has async views and an async QuerySet API, but the database layer is still synchronous underneath. That's fine for typical request/response views and a reason Django's sweet spot remains sync views unless you need high in-process concurrency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-vs-django-q5",
          prompt: "Starting a FastAPI project from scratch, which of these must you choose and wire up yourself? (Select all that apply.)",
          options: [
            "An ORM and a migration tool (e.g. SQLAlchemy or SQLModel plus Alembic)",
            "A back-office admin interface",
            "User accounts, sessions and permission models",
            "Request validation from type hints",
            "Interactive OpenAPI documentation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Validation and `/docs` come built in; persistence, admin and auth are your choices. That freedom is a feature for focused services and a recurring cost for full products.",
        },
        {
          id: "py-fastapi-vs-django-q6",
          prompt:
            "An endpoint spends about 45 ms in three database queries and about 1 ms in framework code. What would switching from Django to FastAPI do to its latency?",
          options: [
            "Almost nothing; the time is in the database, so fix queries, indexes and N+1s first",
            "Cut it roughly in half, because FastAPI benchmarks higher",
            "Cut it by 90%, because async removes database wait time",
            "Double it, because FastAPI adds validation overhead",
          ],
          correctIndex: 0,
          explanation:
            "Framework benchmarks measure empty endpoints. Awaiting a query doesn't make it faster; async lets the worker serve other requests while waiting, which improves throughput under concurrency, not single-request latency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "py-fastapi-vs-django-q7",
          prompt:
            "A company runs Django for its core product and adds a FastAPI service that reads and writes the same PostgreSQL tables through SQLAlchemy models. What's the main risk, and the usual mitigation?",
          options: [
            "Two sets of models and migrations drifting apart; make one codebase the single owner of schema migrations, or have the new service go through the core's API",
            "PostgreSQL can't accept connections from two frameworks at once",
            "SQLAlchemy locks tables that Django is using",
            "Django's admin stops working when another service writes to its tables",
          ],
          correctIndex: 0,
          explanation:
            "The database happily serves both; the danger is two definitions of the schema and business rules. One migration owner (often Django) plus narrow, documented access for the other service keeps them consistent.",
        },
        {
          id: "py-fastapi-vs-django-q8",
          prompt: "Which statement about background work is accurate for both stacks?",
          options: [
            "Durable, retryable background jobs need a task queue such as Celery; FastAPI's `BackgroundTasks` are in-process, and Django 6.0's Tasks framework queues work but ships no worker",
            "FastAPI's `BackgroundTasks` are durable and retried, so FastAPI apps don't need Celery",
            "Django 6.0's Tasks framework replaces Celery with a built-in production worker",
            "Background work should run inside the request with `await` so failures reach the client",
          ],
          correctIndex: 0,
          explanation:
            "`BackgroundTasks` die with the process, and Django's Tasks framework standardizes the enqueueing API while leaving execution to external infrastructure. Either way, production jobs run on a separate worker fleet.",
        },
        {
          id: "py-fastapi-vs-django-q9",
          prompt: "An API-only product needs object-level permissions, rate limiting, pagination, a browsable API and a staff admin. Which statements are fair? (Select all that apply.)",
          options: [
            "Django with DRF provides permissions, throttling, pagination and a browsable API, and Django's admin covers the staff UI",
            "With FastAPI you'd build or assemble those pieces from separate libraries",
            "DRF's built-in OpenAPI generation is deprecated in favour of drf-spectacular, while FastAPI generates OpenAPI natively",
            "FastAPI includes an admin interface generated from Pydantic models",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Feature coverage often decides this: DRF's generic machinery covers most of the list out of the box, whereas FastAPI's native strength is typed contracts. FastAPI has no built-in admin.",
        },
        {
          id: "py-fastapi-vs-django-q10",
          prompt: "Why do teams pick FastAPI for serving an ML model next to their data-science code?",
          options: [
            "It's a thin, typed layer over the Python stack they already use, with Pydantic request/response schemas and OpenAPI for consumers, and no ORM or template system they don't need",
            "Django can't import NumPy or PyTorch inside views, because its settings module isolates third-party packages",
            "FastAPI detects PyTorch models and moves inference onto the GPU automatically",
            "FastAPI runs `async def` endpoints without the GIL, so CPU-bound inference scales across cores",
          ],
          correctIndex: 0,
          explanation:
            "It's about fit, not capability: a small typed service wrapping a model is FastAPI's sweet spot. CPU-heavy inference still shouldn't run on the event loop; use `def` endpoints, a process pool, or a dedicated inference server.",
        },
      ],
    },
  ],
} satisfies Module;
