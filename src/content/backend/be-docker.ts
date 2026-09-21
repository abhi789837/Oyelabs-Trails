import type { Module } from "@/types/curriculum";

export default {
  id: "be-docker",
  trackId: "backend",
  name: "Docker & Containers",
  description:
    "Containers from the kernel up: namespaces and cgroups, content-addressed image layers, Dockerfiles that cache well, lean multi-stage production images, Compose for local stacks, storage and networking, images as CI artifacts, and a first serious look at Kubernetes. Written for BuildKit and Compose v2 (`docker compose`, `compose.yaml`).",
  refs: [
    { label: "Docker Docs: Get started", url: "https://docs.docker.com/get-started/", kind: "docs" },
    { label: "Docker Docs: Building best practices", url: "https://docs.docker.com/build/building/best-practices/", kind: "docs" },
    { label: "Kubernetes Docs: Concepts", url: "https://kubernetes.io/docs/concepts/", kind: "docs" },
  ],
  topics: [
    {
      id: "docker-why-containers",
      moduleId: "be-docker",
      trackId: "backend",
      title: "What Problem Containers Solve",
      summary:
        "\"Works on my machine\" comes from drift: a different glibc, OpenSSL, Python or Node build, and config scattered across hosts. Virtual machines fixed it by shipping a whole OS with its own kernel on a hypervisor, which isolates strongly but costs gigabytes of disk and seconds to minutes of boot. A container ships only the user-space filesystem an app needs and runs it as an ordinary process on the host's kernel. The isolation is made of Linux kernel features: namespaces give the process its own view of PIDs, mounts, network interfaces, hostname, IPC and optionally user IDs, and cgroups limit and account for its CPU, memory, I/O and process count. The image is that filesystem, packaged as immutable layers.\n\nThat design explains the tradeoffs. Nothing boots, so containers start in milliseconds and pack densely. They're portable across hosts with a compatible kernel and CPU architecture, not across kernels: a Linux image needs a Linux kernel, which is why Docker Desktop on macOS and Windows runs one inside a lightweight VM, and an arm64 image fails on an amd64 server with `exec format error`. A shared kernel is also a weaker boundary than a hypervisor: one kernel exploit escapes every container on the host, so multi-tenant platforms add gVisor, Kata Containers or Firecracker microVMs.\n\nTwo gotchas catch experienced people. Inside its PID namespace your app is PID 1, and the kernel doesn't apply default signal actions to PID 1: a process with no SIGTERM handler ignores `docker stop` and is SIGKILLed after the 10-second grace period, skipping graceful shutdown (`docker run --init` puts a tiny init in front of it). And `/proc/meminfo` isn't namespaced, so `free` or `os.cpus()` inside a container report the host's memory and CPUs, not the cgroup limits that will actually kill or throttle you.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Docker Docs: What is Docker?", url: "https://docs.docker.com/get-started/docker-overview/", kind: "docs" },
        { label: "man7: namespaces(7)", url: "https://man7.org/linux/man-pages/man7/namespaces.7.html", kind: "docs" },
        { label: "man7: cgroups(7)", url: "https://man7.org/linux/man-pages/man7/cgroups.7.html", kind: "docs" },
        { label: "Julia Evans: What even is a container (namespaces and cgroups)", url: "https://jvns.ca/blog/2016/10/10/what-even-is-a-container/", kind: "article" },
      ],
      video: {
        title: "Docker Crash Course for Absolute Beginners [NEW]",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=pg19Z8LL06w",
        videoId: "pg19Z8LL06w",
        durationLabel: "1:07:39",
        startSeconds: 174,
        chapterLabel: "What is Docker?",
      },
      alternateVideos: [
        {
          title: "Complete Docker Course - From BEGINNER to PRO! (Learn Containers)",
          channel: "DevOps Directive",
          url: "https://www.youtube.com/watch?v=RqTEHSBrYFw",
          videoId: "RqTEHSBrYFw",
          durationLabel: "4:44:20",
          startSeconds: 1827,
          chapterLabel: "Technology overview",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-why-containers-q1",
          prompt: "Which pair of Linux kernel features does a container runtime combine, and what does each one do?",
          options: [
            "Namespaces limit what a process can see; cgroups limit and account for what it can use",
            "cgroups limit what a process can see; namespaces cap its CPU and memory",
            "A hypervisor isolates the process; seccomp gives it its own filesystem",
            "`chroot` isolates the process; `ulimit` enforces its memory limit",
          ],
          correctIndex: 0,
          explanation:
            "PID, mount, network, UTS, IPC and user namespaces give the process its own view of the system; cgroups enforce CPU, memory, I/O and PID limits. `chroot` only changes the root directory, and no hypervisor is involved.",
        },
        {
          id: "docker-why-containers-q2",
          prompt: "On a Linux host running kernel 6.8, what does this print?\n\n```bash\ndocker run --rm ubuntu:24.04 uname -r\n```",
          options: [
            "The host's kernel version (6.8.x)",
            "The kernel version Ubuntu 24.04 ships by default",
            "An error, because containers don't have a kernel to report",
            "The version of the Docker Engine",
          ],
          correctIndex: 0,
          explanation:
            "The container is just a process on the host's kernel; the image only provides Ubuntu's user-space files. There's no guest kernel to report.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-why-containers-q3",
          prompt:
            "A developer builds an image on an Apple Silicon Mac and pushes it. On the amd64 production server the container dies immediately with `exec format error`. What's the cause?",
          options: [
            "The image contains arm64 binaries, and containers run on the host's own CPU architecture and kernel",
            "Docker Desktop images are encrypted and only run on macOS",
            "The server's Docker Engine is older than the Mac's",
            "The image was built without a `CMD`",
          ],
          correctIndex: 0,
          explanation:
            "Nothing emulates the CPU by default, so an arm64 binary can't execute on amd64. Build multi-platform images with `docker buildx build --platform linux/amd64,linux/arm64`, or at least for the platform you deploy to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-why-containers-q4",
          prompt: "Which statements about a Linux container running on a Linux host are true? (Select all that apply.)",
          options: [
            "It shares the host's kernel",
            "Its processes are visible in `ps` on the host, with host PIDs",
            "It can load a kernel module its app needs without affecting other containers",
            "It boots its own init system before your app starts",
            "Its memory limit is enforced by a cgroup",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Container processes are ordinary host processes in their own namespaces, so the host sees them with different PIDs, and cgroups enforce their limits. Kernel modules are host-wide, and nothing boots: the runtime just starts your process.",
        },
        {
          id: "docker-why-containers-q5",
          prompt:
            "A Node service that never registers a SIGTERM handler runs as PID 1. `docker stop` takes about 10 seconds and the container exits with code 137. Why?",
          options: [
            "The kernel ignores signals with the default action for PID 1, so SIGTERM does nothing and Docker sends SIGKILL after the grace period",
            "Docker sends SIGINT, which Node ignores by default",
            "Node always delays shutdown by 10 seconds to drain the event loop",
            "Exit code 137 means the image's healthcheck failed during shutdown",
          ],
          correctIndex: 0,
          explanation:
            "PID 1 only receives signals it has installed a handler for; SIGKILL and SIGSTOP sent from the host are the exceptions. 137 is 128 + 9, SIGKILL. Handle SIGTERM, or run with `--init` so tini is PID 1 and forwards signals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-why-containers-q6",
          prompt: "A container started with `--memory=512m` runs `free -m` and reports 64 GB of total memory. What's going on?",
          options: [
            "`free` reads `/proc/meminfo`, which shows the host's memory; the 512 MB limit is enforced separately by the memory cgroup",
            "The limit only applies to the JavaScript heap, not to the process",
            "The limit hasn't been applied because the container isn't under pressure yet",
            "Docker ignores `--memory` unless swap is disabled",
          ],
          correctIndex: 0,
          explanation:
            "`/proc/meminfo` isn't namespaced, so tools that size themselves from it (thread pools, caches, some runtimes) can overcommit and get OOM-killed. Read the cgroup's limit (`/sys/fs/cgroup/memory.max` on cgroup v2) instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-why-containers-q7",
          prompt: "Why does Docker Desktop on macOS run a virtual machine?",
          options: [
            "Linux containers need Linux kernel features such as namespaces and cgroups, which macOS's kernel doesn't provide",
            "The VM encrypts container traffic before it leaves the Mac",
            "macOS forbids running more than one process per application",
            "The VM makes containers start faster than they do on Linux",
          ],
          correctIndex: 0,
          explanation:
            "Docker Desktop runs the Docker daemon inside a small Linux VM, and every container shares that VM's kernel. It's also why bind mounts from the Mac's filesystem are slower than volumes that live inside the VM.",
        },
        {
          id: "docker-why-containers-q8",
          prompt: "When is a VM or microVM a better fit than a plain container? (Select all that apply.)",
          options: [
            "Running untrusted code from many customers on shared hosts",
            "Workloads that need a different kernel or their own kernel modules",
            "Running a Windows application on a Linux host",
            "Packaging a Node API together with its exact dependencies",
            "Running 50 replicas of a stateless web service",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A shared kernel is the attack surface in multi-tenant setups, and containers can't change the kernel or OS family. Packaging dependencies and running many identical replicas are exactly what containers are good at.",
        },
        {
          id: "docker-why-containers-q9",
          prompt: "A container's PID 1 is a shell script that starts a background worker and then the main server. The server crashes and the script exits. What happens to the worker?",
          options: [
            "The kernel kills every remaining process in the PID namespace, so the worker dies with the container",
            "The worker is reparented to the host's init and keeps running",
            "The worker becomes PID 1 and the container keeps running",
            "Docker restarts the script and the worker is left untouched",
          ],
          correctIndex: 0,
          explanation:
            "When a PID namespace's init exits, the kernel sends SIGKILL to every other process in it, so the container's lifetime is PID 1's lifetime. Run one main process per container, or a proper init if you truly need several.",
        },
        {
          id: "docker-why-containers-q10",
          prompt: "What does `docker run --init` change?",
          options: [
            "A tiny init process (tini) becomes PID 1, forwards signals to your app and reaps zombie processes",
            "It runs the image's healthcheck once before starting the app",
            "It runs the container's entrypoint as root even if the image sets `USER`",
            "It re-initialises the container's writable layer on every start",
          ],
          correctIndex: 0,
          explanation:
            "Your app then runs as a normal child that receives the SIGTERM tini forwards, and orphaned children get reaped. It doesn't change the user, healthchecks or the filesystem.",
        },
      ],
    },
    {
      id: "docker-images-containers",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Images vs Containers",
      summary:
        "An image is a read-only, content-addressed bundle: an ordered stack of filesystem layers, each a tarball of changes identified by the SHA-256 digest of its content, plus a config and a manifest that ties them together, all defined by the OCI image spec. Because layers are addressed by content, an identical layer is stored and pulled once and shared by every image and container that uses it, and nothing in an image can change: a new version is a new digest. A container is an instance of an image: its layers mounted read-only through a union filesystem such as overlay2, a thin writable layer on top, and runtime configuration (ports, mounts, environment, limits) around a main process.\n\nTags are mutable pointers; digests aren't. `node:24-alpine` resolves to a new digest whenever the maintainers rebuild it for a security patch, which keeps you patched and makes builds irreproducible. Pin `image@sha256:…` where you need exact bytes, such as production manifests or regulated base images, and automate the bumps. `latest` is just the default tag name, not \"the newest\".\n\nThe gotchas are all about layers being permanent and containers being disposable. Writes go to the writable layer by copy-on-write, and overlay2 copies a file up whole the first time it's modified; everything there vanishes with `docker rm`, so state belongs in volumes. Deleting a file in a later layer only hides it: `COPY id_rsa` followed by `RUN rm id_rsa` still ships the key in the earlier layer, recoverable by anyone who can pull the image. Never `docker commit` a hand-patched container as a release; build from a Dockerfile in CI. And the container lives exactly as long as its main process: `docker stop` sends SIGTERM (or the image's `STOPSIGNAL`) to PID 1, waits 10 seconds by default, then sends SIGKILL.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Docker Docs: What is an image?", url: "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/", kind: "docs" },
        {
          label: "Docker Docs: Understanding the image layers",
          url: "https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/",
          kind: "docs",
        },
        { label: "Docker Docs: OverlayFS storage driver (copy-on-write)", url: "https://docs.docker.com/engine/storage/drivers/overlayfs-driver/", kind: "docs" },
        { label: "OCI Image Format Specification", url: "https://github.com/opencontainers/image-spec/blob/main/spec.md", kind: "spec" },
      ],
      video: {
        title: "Docker Crash Course for Absolute Beginners [NEW]",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=pg19Z8LL06w",
        videoId: "pg19Z8LL06w",
        durationLabel: "1:07:39",
        startSeconds: 1296,
        chapterLabel: "Docker Images vs Containers",
      },
      alternateVideos: [
        {
          title: "Docker and Kubernetes - Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=Wf2eSG3owoA",
          videoId: "Wf2eSG3owoA",
          durationLabel: "4:17:59",
          startSeconds: 936,
          chapterLabel: "Images & Containers",
        },
        {
          title: "What Are Docker Layers Anyway?",
          channel: "Depot",
          url: "https://www.youtube.com/watch?v=tQgpBRfr5EY",
          videoId: "tQgpBRfr5EY",
          durationLabel: "6:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-images-containers-q1",
          prompt: "What best describes the relationship between an image and a container?",
          options: [
            "A container is the image's read-only layers plus its own writable layer, runtime config and a running main process",
            "A container is a copy of the image's files made when you run `docker run`",
            "An image is a stopped container that has been saved to the registry",
            "An image and a container are the same object in different states",
          ],
          correctIndex: 0,
          explanation:
            "Starting a container copies nothing: it mounts the shared read-only layers and adds a thin writable layer on top. Images are built, not saved from containers (`docker commit` exists, but it's an anti-pattern for releases).",
        },
        {
          id: "docker-images-containers-q2",
          prompt:
            "Is the private key in the final image?\n\n```dockerfile\nFROM alpine:3.22\nCOPY id_rsa /root/.ssh/id_rsa\nRUN apk add --no-cache git openssh \\\n && git clone git@github.com:acme/private.git /src\nRUN rm /root/.ssh/id_rsa\n```",
          options: [
            "Yes: it lives in the layer created by `COPY`; the later `rm` only adds a whiteout that hides it",
            "No: `rm` in a later layer removes it from the image",
            "No: files under `/root` are never included in pushed images",
            "Only if the image is built without BuildKit",
          ],
          correctIndex: 0,
          explanation:
            "Layers are immutable, so deletion is recorded as a whiteout in a new layer and the original bytes stay in the earlier one. Use a BuildKit SSH or secret mount (`RUN --mount=type=ssh …`) so the key never enters a layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-images-containers-q3",
          prompt: "Ten different images on one host are all built `FROM node:24-alpine`. How much disk do the shared base layers use?",
          options: [
            "One copy: layers are content-addressed, so identical layers are stored once and shared",
            "Ten copies, one per image",
            "One copy per running container",
            "Nothing: base layers are streamed from the registry on demand",
          ],
          correctIndex: 0,
          explanation:
            "A layer is identified by the digest of its content, so the second image referencing it reuses the stored copy. That's also why pulls of related images are fast: only the missing layers download.",
        },
        {
          id: "docker-images-containers-q4",
          prompt:
            "Is `x.html` served after these commands?\n\n```bash\ndocker run -d --name web nginx:1.27\ndocker exec web sh -c 'echo hi > /usr/share/nginx/html/x.html'\ndocker rm -f web\ndocker run -d --name web -p 8080:80 nginx:1.27\ncurl localhost:8080/x.html\n```",
          options: [
            "No: the file was written to the first container's writable layer, which was deleted with it",
            "Yes: `docker exec` changes are written back to the image",
            "Yes: containers with the same name share a writable layer",
            "Only if the image was pulled by digest",
          ],
          correctIndex: 0,
          explanation:
            "Each container gets a fresh writable layer on top of the unchanged image. Persist data with a volume, and bake content into the image with a Dockerfile.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-images-containers-q5",
          prompt: "Which statements about image references are true? (Select all that apply.)",
          options: [
            "`node:24-alpine` can point to different image content next month",
            "`node@sha256:<digest>` always resolves to exactly the same content",
            "Two different tags can point to the same digest",
            "`latest` is automatically the most recently pushed tag",
            "Changing an image's tag changes its digest",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tags are movable names; the digest is a hash of the content. `latest` is only the tag used when you don't specify one, and retagging doesn't touch the content, so the digest stays the same.",
        },
        {
          id: "docker-images-containers-q6",
          prompt: "What does `docker stop web` do by default?",
          options: [
            "Sends SIGTERM (or the image's `STOPSIGNAL`) to the container's PID 1, waits 10 seconds, then sends SIGKILL",
            "Sends SIGKILL to every process in the container immediately",
            "Sends SIGINT to every process and waits until they all exit",
            "Pauses the container's processes with the freezer cgroup",
          ],
          correctIndex: 0,
          explanation:
            "Only the main process gets the first signal, so an app hidden behind a shell that doesn't forward signals never sees it. `docker pause` is the one that freezes processes, and `-t` or `--stop-timeout` changes the grace period.",
        },
        {
          id: "docker-images-containers-q7",
          prompt: "A container appends one line to a 2 GB file that came from the image. What happens on overlay2?",
          options: [
            "The whole 2 GB file is copied up into the container's writable layer first, then modified",
            "Only the modified block is written to the writable layer",
            "The write fails because image files are read-only",
            "The image layer is modified in place for every container",
          ],
          correctIndex: 0,
          explanation:
            "OverlayFS copy-up works at the file level, so the first write to a large file is slow and doubles its disk use. Write-heavy data such as database files belongs in a volume, which bypasses the storage driver.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-images-containers-q8",
          prompt: "A container exits with code 137. What's the most likely explanation?",
          options: [
            "It was killed by SIGKILL, typically an out-of-memory kill or a stop that outlived the grace period",
            "It exited normally after handling SIGTERM",
            "Its image couldn't be pulled",
            "Its entrypoint file wasn't executable",
          ],
          correctIndex: 0,
          explanation:
            "Exit codes above 128 mean \"killed by signal (code − 128)\": 137 is signal 9, SIGKILL; 143 is SIGTERM. `docker inspect` shows `OOMKilled: true` when the memory cgroup did it. A non-executable entrypoint gives 126.",
        },
        {
          id: "docker-images-containers-q9",
          prompt: "Why is `docker commit` on a hand-patched container a poor way to produce a release image?",
          options: [
            "The result isn't reproducible or reviewable: nobody can rebuild it or see what changed, and it carries whatever else was in the container",
            "`docker commit` produces images that can't be pushed to a registry",
            "Committed images can't be used as a base image",
            "`docker commit` discards every layer except the last one",
          ],
          correctIndex: 0,
          explanation:
            "A Dockerfile in version control is the reviewable, rebuildable record of how the image was made. Committed images push and layer like any other; that's what makes the hidden drift dangerous.",
        },
        {
          id: "docker-images-containers-q10",
          prompt: "Your team pins `FROM node:24-alpine`. Which consequences follow? (Select all that apply.)",
          options: [
            "Rebuilding the same commit next week may produce an image with different OS packages",
            "Base-image security patches are picked up whenever a build pulls the tag again (a fresh CI runner, or `--pull`)",
            "The resulting image can't be pulled by digest",
            "Every build is guaranteed to be byte-for-byte identical",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A floating tag trades reproducibility for automatic patching (a local builder keeps using its cached copy until it pulls again). Any pushed image has a digest you can pull by; pinning `@sha256:` plus an automated bump PR (Renovate, Dependabot) gets you both properties.",
        },
      ],
    },
    {
      id: "docker-dockerfiles",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Writing Dockerfiles",
      summary:
        "A Dockerfile is a build recipe, and BuildKit caches the result of each instruction as a layer. On a rebuild it walks the instructions in order and reuses a cached layer only if the instruction and its inputs are unchanged: for `COPY` and `ADD` that's a checksum of the copied files' contents and metadata (not their mtime), for `RUN` just the command string. The first miss invalidates everything after it in that stage. So order instructions from least to most frequently changing: base image, system packages, dependency manifests (`COPY package.json package-lock.json ./`), `RUN npm ci`, then the source. Put `COPY . .` before the install and every one-line code change reinstalls every dependency.\n\nThe build context is what the client sends to the builder, and `.dockerignore` trims it: exclude `node_modules`, `.git`, `.env`, build output and logs to speed up builds, stop local junk from busting the cache, and keep secrets out of images. Patterns match from the context root (`*.md` doesn't match `docs/a.md`; `**/*.md` does), and the last matching line wins, so a `!` exception must come after the rule it carves out of.\n\nPrefer `COPY`; `ADD` also downloads URLs and auto-extracts local tar archives, which surprises reviewers. Write `CMD` and `ENTRYPOINT` in exec (JSON array) form: shell form runs your program under `/bin/sh -c`, so the shell is PID 1 and your app never receives `docker stop`'s SIGTERM. `ENTRYPOINT` fixes the executable and `CMD` supplies default arguments, which `docker run image arg…` replaces. Build args affect the cache too: a changed `ARG` causes a miss at its first use, and every `RUN` after its declaration counts as a use because args are part of its environment. Declare a `GIT_SHA` arg at the top and every commit reinstalls your dependencies; declare it just before the `LABEL` that needs it.",
      level: "advanced",
      estMinutes: 90,
      webRefs: [
        { label: "Docker Docs: Dockerfile reference", url: "https://docs.docker.com/reference/dockerfile/", kind: "docs" },
        { label: "Docker Docs: Build cache invalidation", url: "https://docs.docker.com/build/cache/invalidation/", kind: "docs" },
        { label: "Docker Docs: Build context and .dockerignore files", url: "https://docs.docker.com/build/concepts/context/", kind: "docs" },
        {
          label: "Snyk: 10 best practices to containerize Node.js web applications with Docker",
          url: "https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/",
          kind: "article",
        },
      ],
      video: {
        title: "Complete Docker Course - From BEGINNER to PRO! (Learn Containers)",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=RqTEHSBrYFw",
        videoId: "RqTEHSBrYFw",
        durationLabel: "4:44:20",
        startSeconds: 5317,
        chapterLabel: "Building container images",
      },
      alternateVideos: [
        {
          title: "Docker and Kubernetes - Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=Wf2eSG3owoA",
          videoId: "Wf2eSG3owoA",
          durationLabel: "4:17:59",
          startSeconds: 6017,
          chapterLabel: "Caching and Layers",
        },
        {
          title: "Top 8 Docker Best Practices for using Docker in Production",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=8vXoMqWgbQQ",
          videoId: "8vXoMqWgbQQ",
          durationLabel: "18:26",
          startSeconds: 275,
          chapterLabel: "BP 4: Optimize Caching Image Layers",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `simulateBuild(dockerfile, changes)`, which predicts what BuildKit does when you rebuild an image that was built before from the same Dockerfile. Return an array with one status per line: `\"cached\"`, `\"rebuilt\"` or `\"skipped\"`.\n\n`dockerfile` is an array of instruction lines; the keyword is the first word, in any letter case. `changes` may contain `files` (context-relative paths such as `src/server.ts` whose contents changed), `dockerignore` (the lines of `.dockerignore`), `args` (names of build args whose values changed), `images` (image references, exactly as written after `FROM` or `--from=`, whose digest changed) and `target` (the stage name to build; the default is the last stage).\n\nStages and cascading:\n\n- `FROM <image> [AS <name>]` starts a stage. `ARG` lines before the first `FROM` are global and always `\"cached\"`.\n- Within a stage, once an instruction is rebuilt, every later instruction in that stage is rebuilt.\n- Only the target stage and the stages it depends on (through `FROM <stage>` or `COPY --from=<stage>`, transitively) are built. Every line of any other stage is `\"skipped\"`.\n- A stage \"changed\" if any of its lines was rebuilt. Assume a rebuilt stage always produces different output.\n\nWhen a line is rebuilt on its own:\n\n- `FROM`: its image is an earlier stage that changed, or it's listed in `images`, or it references a changed global arg as `$NAME` or `${NAME}`.\n- `COPY`/`ADD` without `--from`: ignoring `--flags`, the last argument is the destination and the rest are sources. It's rebuilt if a changed file that isn't excluded by `.dockerignore` matches a source. `.` matches every file. Otherwise strip a leading `./` and any trailing `/`; the source matches a file if it matches the file's path or one of its parent directories, where `*` matches any run of characters except `/` and `?` matches one such character. So `src` matches `src/a.ts` but not `srcs/a.ts`.\n- `COPY --from=<ref>`: if `<ref>` names an earlier stage (by its `AS` name, or its 0-based index), it's rebuilt when that stage changed; otherwise `<ref>` is an external image, rebuilt only if listed in `images`.\n- `ARG NAME` (optionally `=default`) inside a stage is never rebuilt on its own. After it, every `RUN` in that stage is rebuilt if `NAME` changed, and any other instruction is rebuilt if its text references the changed arg as `$NAME` or `${NAME}`.\n- Every other instruction (`WORKDIR`, `ENV`, `USER`, `CMD`, …) is only rebuilt by the cascade or by an arg reference.\n\n`.dockerignore` rules: skip blank lines and lines starting with `#`; strip leading and trailing `/`; `*` and `?` work as above and `**` matches any number of directories, including none; a pattern matches a path or any of its parent directories; the last matching line decides, and a line starting with `!` re-includes what it matches. Ignored files never cause a rebuild.\n\nStage names are compared exactly. The inputs are always well formed.",
        starterCode: "/**\n * Predict which Dockerfile steps BuildKit reuses from its cache when you rebuild.\n * @param {string[]} dockerfile one instruction per element, e.g. \"COPY . .\"\n * @param {{ files?: string[], dockerignore?: string[], args?: string[], images?: string[], target?: string }} changes\n * @returns {string[]} \"cached\", \"rebuilt\" or \"skipped\" for each line\n */\nfunction simulateBuild(dockerfile, changes) {\n  // Your code here\n}\n",
        functionName: "simulateBuild",
        testCases: [
          {
            description: "a source change rebuilds from `COPY . .` onwards",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["src/server.ts"] }],
            expected: ["cached", "cached", "cached", "cached", "rebuilt", "rebuilt", "rebuilt"],
          },
          {
            description: "a lockfile change rebuilds from the dependency COPY onwards",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["package-lock.json"] }],
            expected: ["cached", "cached", "rebuilt", "rebuilt", "rebuilt", "rebuilt", "rebuilt"],
          },
          {
            description: "`COPY . .` before `npm ci`: any source change reinstalls dependencies",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY . .", "RUN npm ci", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["src/server.ts"] }],
            expected: ["cached", "cached", "rebuilt", "rebuilt", "rebuilt", "rebuilt"],
          },
          {
            description: "files excluded by .dockerignore never invalidate the cache",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["README.md", "node_modules/.cache/x.json"], dockerignore: ["node_modules", "*.md"] }],
            expected: ["cached", "cached", "cached", "cached", "cached", "cached", "cached"],
            isEdgeCase: true,
          },
          {
            description: "`*.md` only matches the root of the context, so docs/setup.md still counts",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["docs/setup.md"], dockerignore: ["*.md"] }],
            expected: ["cached", "cached", "cached", "cached", "rebuilt", "rebuilt", "rebuilt"],
            isEdgeCase: true,
          },
          {
            description: "a later `!` exception re-includes a file",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], { files: ["README.md"], dockerignore: ["*.md", "!README.md"] }],
            expected: ["cached", "cached", "cached", "cached", "rebuilt", "rebuilt", "rebuilt"],
          },
          {
            description: "a changed ARG misses at its first use: every RUN after it, not the ARG line",
            args: [["FROM node:24-alpine", "ARG GIT_SHA", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "LABEL org.opencontainers.image.revision=$GIT_SHA", "COPY . ."], { args: ["GIT_SHA"] }],
            expected: ["cached", "cached", "cached", "cached", "rebuilt", "rebuilt", "rebuilt"],
            isEdgeCase: true,
          },
          {
            description: "declaring the ARG late keeps the expensive steps cached",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "ARG GIT_SHA", "LABEL org.opencontainers.image.revision=${GIT_SHA}"], { args: ["GIT_SHA"] }],
            expected: ["cached", "cached", "cached", "cached", "cached", "cached", "cached", "rebuilt"],
          },
          {
            description: "multi-stage: unneeded stages are skipped and only dependent COPY --from steps rebuild",
            args: [["FROM node:24-alpine AS deps", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "FROM deps AS build", "COPY . .", "RUN npm run build", "FROM deps AS test", "COPY . .", "RUN npm test", "FROM gcr.io/distroless/nodejs24-debian13 AS runtime", "WORKDIR /app", "COPY --from=deps /app/node_modules ./node_modules", "COPY --from=build /app/dist ./dist", "CMD [\"dist/server.js\"]"], { files: ["src/server.ts"] }],
            expected: ["cached", "cached", "cached", "cached", "cached", "rebuilt", "rebuilt", "skipped", "skipped", "skipped", "cached", "cached", "cached", "rebuilt", "rebuilt"],
          },
          {
            description: "`target` builds only that stage and its dependencies",
            args: [["FROM node:24-alpine AS deps", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "FROM deps AS build", "COPY . .", "RUN npm run build", "FROM deps AS test", "COPY . .", "RUN npm test", "FROM gcr.io/distroless/nodejs24-debian13 AS runtime", "WORKDIR /app", "COPY --from=deps /app/node_modules ./node_modules", "COPY --from=build /app/dist ./dist", "CMD [\"dist/server.js\"]"], { files: ["src/server.ts"], target: "test" }],
            expected: ["cached", "cached", "cached", "cached", "skipped", "skipped", "skipped", "cached", "rebuilt", "rebuilt", "skipped", "skipped", "skipped", "skipped", "skipped"],
          },
          {
            description: "a new base image digest rebuilds every stage that depends on it",
            args: [["FROM node:24-alpine AS deps", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "FROM deps AS build", "COPY . .", "RUN npm run build", "FROM deps AS test", "COPY . .", "RUN npm test", "FROM gcr.io/distroless/nodejs24-debian13 AS runtime", "WORKDIR /app", "COPY --from=deps /app/node_modules ./node_modules", "COPY --from=build /app/dist ./dist", "CMD [\"dist/server.js\"]"], { images: ["node:24-alpine"] }],
            expected: ["rebuilt", "rebuilt", "rebuilt", "rebuilt", "rebuilt", "rebuilt", "rebuilt", "skipped", "skipped", "skipped", "cached", "cached", "rebuilt", "rebuilt", "rebuilt"],
          },
          {
            description: "a global ARG used in FROM changes the base image",
            args: [["ARG NODE_VERSION=24", "FROM node:${NODE_VERSION}-alpine", "WORKDIR /app", "COPY . ."], { args: ["NODE_VERSION"] }],
            expected: ["cached", "rebuilt", "rebuilt", "rebuilt"],
            isEdgeCase: true,
          },
          {
            description: "lower-case keywords, `COPY --from=0` and an unchanged external image",
            args: [["from node:24-alpine as build", "workdir /app", "copy . .", "run npm run build", "from nginx:1.27-alpine", "copy --from=busybox:1.37-musl /bin/busybox /bin/busybox", "copy --from=0 /app/dist /usr/share/nginx/html"], { files: ["src/App.tsx"] }],
            expected: ["cached", "cached", "rebuilt", "rebuilt", "cached", "cached", "rebuilt"],
          },
          {
            description: "nothing changed: everything is cached",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY package.json package-lock.json ./", "RUN npm ci", "COPY . .", "RUN npm run build", "CMD [\"node\", \"dist/server.js\"]"], {}],
            expected: ["cached", "cached", "cached", "cached", "cached", "cached", "cached"],
            isEdgeCase: true,
          },
          {
            description: "a directory source only matches at a path boundary (`src` doesn't match `srcs/`)",
            args: [["FROM node:24-alpine", "WORKDIR /app", "COPY --chown=node:node package.json ./", "COPY --chown=node:node src ./src", "USER node"], { files: ["srcs/old.js"] }],
            expected: ["cached", "cached", "cached", "cached", "cached"],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "docker-multi-stage-builds",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Multi-Stage Builds",
      summary:
        "A multi-stage Dockerfile has several `FROM` stages: compile in a fat stage that has compilers, dev dependencies and caches, then `COPY --from=build` only the artifacts into a small runtime stage. The final image drops the toolchain, the source and the dev dependencies, which cuts its size, pull time and attack surface (fewer packages means fewer CVEs to triage). BuildKit treats stages as a graph: independent stages build in parallel and stages the target doesn't depend on are skipped, so `docker build --target test .` runs the test stage without touching the runtime one.\n\nPicking the runtime base is a real tradeoff. Debian `-slim` images use glibc and rarely surprise anyone. Alpine is tiny but uses musl libc: native binaries prebuilt for glibc won't load, new threads get a 128 KB default stack instead of glibc's several megabytes, and packages without musl builds compile from source, which slows builds. Distroless images contain the runtime and its libraries but no shell or package manager, so `CMD` and `HEALTHCHECK` must use exec form, `docker exec … sh` fails, and debugging means the `:debug` variant or an ephemeral debug container. `scratch` suits statically linked Go or Rust binaries, as long as you copy in CA certificates and time zone data if you need them.\n\nHarden the final stage. Run as a non-root `USER` (the official Node images include a `node` user, and distroless has `nonroot` tags), and `COPY --chown` anything the app must write. Keep secrets out of layers and metadata: `ARG` and `ENV` values show up in `docker history`, while `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci` exposes a token to that one step only. `RUN --mount=type=cache,target=/root/.npm npm ci` keeps npm's download cache between builds on the same builder without baking it into a layer.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Docker Docs: Multi-stage builds", url: "https://docs.docker.com/build/building/multi-stage/", kind: "docs" },
        { label: "Docker Docs: Build secrets", url: "https://docs.docker.com/build/building/secrets/", kind: "docs" },
        { label: "musl libc: Functional differences from glibc", url: "https://wiki.musl-libc.org/functional-differences-from-glibc.html", kind: "article" },
        { label: "GoogleContainerTools/distroless", url: "https://github.com/GoogleContainerTools/distroless", kind: "repo" },
      ],
      video: {
        title: "Docker Image BEST Practices - From 1.2GB to 10MB",
        channel: "Better Stack",
        url: "https://www.youtube.com/watch?v=t779DVjCKCs",
        videoId: "t779DVjCKCs",
        durationLabel: "7:15",
      },
      alternateVideos: [
        {
          title: "Top 8 Docker Best Practices for using Docker in Production",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=8vXoMqWgbQQ",
          videoId: "8vXoMqWgbQQ",
          durationLabel: "18:26",
          startSeconds: 655,
          chapterLabel: "BP 6: Make use of Multi-Stage Builds",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-multi-stage-builds-q1",
          prompt:
            "With BuildKit, which stages does `docker build .` build?\n\n```dockerfile\nFROM node:24-alpine AS deps\nCOPY package.json package-lock.json ./\nRUN npm ci\n\nFROM deps AS build\nCOPY . .\nRUN npm run build\n\nFROM deps AS test\nCOPY . .\nRUN npm test\n\nFROM gcr.io/distroless/nodejs24-debian13\nCOPY --from=build /dist /app/dist\nCMD [\"/app/dist/server.js\"]\n```",
          options: [
            "`deps`, `build` and the final stage; `test` is skipped because the final stage doesn't depend on it",
            "All four stages, in order",
            "Only the final stage",
            "`deps` and the final stage; `build` only runs with `--target build`",
          ],
          correctIndex: 0,
          explanation:
            "BuildKit builds only the stages the target (by default the last one) depends on, here through `COPY --from=build`, which in turn depends on `deps`. The legacy builder ran every stage up to the target.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-multi-stage-builds-q2",
          prompt:
            "The final stage is `FROM gcr.io/distroless/nodejs24-debian13` with `CMD node dist/server.js`. The container fails immediately saying it can't find `/bin/sh`. Why?",
          options: [
            "Shell-form `CMD` is run through `/bin/sh -c`, and distroless images have no shell; use exec form such as `CMD [\"dist/server.js\"]`",
            "Distroless images can't run Node.js",
            "`CMD` is ignored in distroless images, so Docker falls back to a shell",
            "The image needs `USER root` to start a process",
          ],
          correctIndex: 0,
          explanation:
            "Shell form always prepends a shell. The distroless Node image's entrypoint is already `node`, so the exec-form `CMD` just names the script.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-multi-stage-builds-q3",
          prompt: "Which surprises are specific to Alpine-based images? (Select all that apply.)",
          options: [
            "Native binaries prebuilt against glibc may fail to load, because Alpine uses musl libc",
            "New threads get a much smaller default stack (128 KB) than on glibc",
            "Python packages without musl wheels compile from source, which can make builds much slower",
            "Alpine has no package manager, so nothing can be installed",
            "Alpine images can't run as a non-root user",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "musl differs from glibc in ABI and defaults, which breaks prebuilt binaries and deep native recursion, and older ecosystems lacked musl builds. Alpine has `apk`, and `USER` works like anywhere else.",
        },
        {
          id: "docker-multi-stage-builds-q4",
          prompt: "`npm ci` needs a private registry token. Which approach keeps the token out of the image and its metadata?",
          options: [
            "`RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci`, passing the file with `--secret id=npmrc,src=.npmrc`",
            "`ARG NPM_TOKEN`, then write `.npmrc`, run `npm ci` and delete `.npmrc` in the same `RUN`",
            "`COPY .npmrc .`, `RUN npm ci`, then `RUN rm .npmrc`",
            "`ENV NPM_TOKEN=...` in the build stage only, since stages aren't shipped",
          ],
          correctIndex: 0,
          explanation:
            "A secret mount exists only while that `RUN` executes and isn't recorded in layers or history. Build args are visible in `docker history` and max-mode provenance, `rm` in a later layer doesn't remove the copied file, and a literal `ENV` value puts the token in the Dockerfile, in git and in that stage's image config.",
        },
        {
          id: "docker-multi-stage-builds-q5",
          prompt:
            "Why is this final image still almost as big as the build image?\n\n```dockerfile\nFROM node:24 AS build\nWORKDIR /app\nCOPY . .\nRUN npm ci && npm run build\n\nFROM node:24-slim\nCOPY --from=build /app /app\nCMD [\"node\", \"/app/dist/server.js\"]\n```",
          options: [
            "It copies all of `/app`: source, dev dependencies and caches, not just `dist` and production dependencies",
            "Multi-stage builds only shrink images when the stages use the same base",
            "`COPY --from` copies every layer of the build stage",
            "`node:24-slim` is larger than `node:24`",
          ],
          correctIndex: 0,
          explanation:
            "The final image gets exactly what you copy into it. Install production dependencies separately (`npm ci --omit=dev` in their own stage) and copy only `dist` and that `node_modules`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-multi-stage-builds-q6",
          prompt: "What does `RUN --mount=type=cache,target=/root/.npm npm ci` give you?",
          options: [
            "npm's download cache persists across builds on the same builder without being stored in any image layer",
            "The installed `node_modules` are shared between every image on the host",
            "The layer is always reused, even when `package-lock.json` changes",
            "The cache travels with the image when you push it",
          ],
          correctIndex: 0,
          explanation:
            "Cache mounts speed up the step when it does rerun; they don't change whether it reruns. They live on the builder, so fresh CI runners start without them unless you persist the builder's state.",
        },
        {
          id: "docker-multi-stage-builds-q7",
          prompt:
            "A Dockerfile ends with `COPY . .` (as root) and then `USER node`. At runtime the app gets `EACCES` writing to `/app/uploads`. What's the fix?",
          options: [
            "Copy with `--chown=node:node`, or create the writable directory owned by `node` before switching users",
            "Remove `USER node`: containers are already isolated, so root is fine",
            "Add `EXPOSE` for the uploads directory",
            "Run the container with `--init`",
          ],
          correctIndex: 0,
          explanation:
            "Files copied as root stay root-owned, so the non-root user can't write to them. Going back to root throws away a cheap layer of defence if the app is compromised.",
        },
        {
          id: "docker-multi-stage-builds-q8",
          prompt: "What does `docker build --target test -t app:test .` do?",
          options: [
            "Builds the `test` stage and the stages it depends on, and tags that stage's result as `app:test`",
            "Builds every stage, then runs the `test` stage's `CMD`",
            "Builds only the lines inside the `test` stage, without its base stage",
            "Builds the final stage and copies the `test` stage into it",
          ],
          correctIndex: 0,
          explanation:
            "`--target` makes a stage the build's endpoint, which is how one Dockerfile can produce test, dev and production images.",
        },
        {
          id: "docker-multi-stage-builds-q9",
          prompt:
            "A Go service built with `CGO_ENABLED=0` runs from `FROM scratch`. Its outbound HTTPS calls fail with `x509: certificate signed by unknown authority`. Why?",
          options: [
            "`scratch` is empty, so there's no CA certificate bundle; copy `/etc/ssl/certs/ca-certificates.crt` from the build stage",
            "Static binaries can't make TLS connections",
            "`scratch` blocks outbound network traffic",
            "The binary needs glibc to verify certificates",
          ],
          correctIndex: 0,
          explanation:
            "Go's TLS client looks for the system CA bundle, which an empty image doesn't have. The same goes for time zone data and `/etc/passwd` entries if you need a named user.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-multi-stage-builds-q10",
          prompt: "What does moving the build into a separate stage remove from the final image? (Select all that apply.)",
          options: [
            "Compilers and other build tooling",
            "Source code and dev dependencies",
            "Packages that vulnerability scanners would otherwise flag",
            "The app's memory usage at runtime",
            "The need for a base image in the final stage",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only what you copy reaches the final stage, so the toolchain and its CVEs stay behind. Runtime memory is the app's business, and the final stage still needs a base, even if it's `scratch`.",
        },
      ],
    },
    {
      id: "docker-compose",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Docker Compose for Multi-Container Apps",
      summary:
        "Compose describes a multi-container application in one declarative `compose.yaml`: services (an image or a build, environment, ports, volumes, healthchecks) plus the networks and volumes they share. `docker compose up` creates a project-scoped network, so services reach each other by service name through Docker's embedded DNS (`postgres://db:5432`), named volumes keep data across `down` and `up`, and the same file reproduces the stack on every laptop and CI runner. It's the right tool for local development, integration tests and small single-host deployments. It doesn't schedule across machines, reschedule containers when a host dies or roll out gradually; that's where Kubernetes or a managed platform takes over.\n\nCompose v2 is the `docker compose` CLI plugin. The standalone Python `docker-compose` (v1) is retired, and the top-level `version:` key is obsolete: Compose always validates against the latest specification and warns if the key is present. Many tutorials, including parts of this module's videos, still show both, so read them with that in mind.\n\nThe classic bug is assuming `depends_on` means \"ready\". By default Compose only waits until the dependency's container is running, not until Postgres accepts connections, so the API crashes on its first query. Give the database a `healthcheck` and depend on it with `condition: service_healthy`, and gate the app on a one-shot migration job with `condition: service_completed_successfully`. `required: false` (Compose 2.20+) makes a dependency optional. Profiles keep tools such as `adminer` or a seed job out of a plain `up`; naming a service on the command line enables its own profiles, but not those of its dependencies. Your app should still retry connections, because Compose's ordering applies only at startup and a healthy database can restart later.",
      level: "intermediate",
      estMinutes: 90,
      webRefs: [
        { label: "Docker Docs: Control startup and shutdown order in Compose", url: "https://docs.docker.com/compose/how-tos/startup-order/", kind: "docs" },
        { label: "Compose file reference: services (depends_on, healthcheck, profiles)", url: "https://docs.docker.com/reference/compose-file/services/", kind: "docs" },
        { label: "Docker Docs: Using profiles with Compose", url: "https://docs.docker.com/compose/how-tos/profiles/", kind: "docs" },
        { label: "Compose file reference: Version and name (obsolete `version`)", url: "https://docs.docker.com/reference/compose-file/version-and-name/", kind: "docs" },
      ],
      video: {
        title: "Ultimate Docker Compose Tutorial",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=SXwC9fSwct8",
        videoId: "SXwC9fSwct8",
        durationLabel: "1:03:14",
      },
      alternateVideos: [
        {
          title: "Complete Docker Course - From BEGINNER to PRO! (Learn Containers)",
          channel: "DevOps Directive",
          url: "https://www.youtube.com/watch?v=RqTEHSBrYFw",
          videoId: "RqTEHSBrYFw",
          durationLabel: "4:44:20",
          startSeconds: 9225,
          chapterLabel: "Running containers",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `planStartup(services, targets, profiles)`, a simplified model of how `docker compose up` decides what to start and in which order.\n\n`services` mirrors the `services:` section of `compose.yaml`. A service may have:\n\n- `depends_on`: either a list of names (short syntax) or an object mapping names to `{ condition, required }` (long syntax). `condition` is `\"service_started\"` (the default), `\"service_healthy\"` or `\"service_completed_successfully\"`; `required` defaults to `true`.\n- `profiles`: a list of profile names.\n- `healthcheck`: any object; only its presence matters.\n\n`targets` are the services named on the command line (an empty array means every enabled service) and `profiles` are the ones enabled with `--profile`.\n\n1. If a target isn't defined, return `{ error: 'unknown service \"<name>\"' }`.\n2. The active profiles are `profiles` plus every profile of every target. A service is enabled if it has no profiles or at least one active profile.\n3. Start from the targets (or every enabled service when there are none) and add dependencies transitively. For each dependency of a selected service:\n\n- not defined: return `{ error: 'service \"<svc>\" depends on undefined service \"<dep>\"' }`\n- not enabled and required: return `{ error: 'service \"<svc>\" depends on \"<dep>\", which is not enabled by the active profiles' }`\n- not enabled and `required: false`: leave it out and add the warning `'optional dependency \"<dep>\" of \"<svc>\" is not enabled; skipping'`\n- `condition: \"service_healthy\"` on a dependency with no `healthcheck`: return `{ error: '\"<svc>\" waits for \"<dep>\" to be healthy, but \"<dep>\" has no healthcheck' }`\n\n4. If the selected services contain a dependency cycle, return `{ error: \"dependency cycle: a -> b -> a\" }`, listing the services around the cycle in dependency order (`a` depends on `b`) and starting and ending with the alphabetically smallest one.\n5. Otherwise return `{ waves, warnings }`. A service with no selected dependencies is in wave 0; any other service is in wave 1 + the highest wave of its dependencies. Sort the names in each wave, and sort `warnings`.\n\nEach test has at most one problem, so you don't need to decide which error wins.",
        starterCode: "/**\n * Work out what `docker compose up` starts, and in which order.\n * @param {Record<string, { depends_on?: string[] | Record<string, { condition?: string, required?: boolean }>, profiles?: string[], healthcheck?: object }>} services\n * @param {string[]} targets services named on the command line (empty = every enabled service)\n * @param {string[]} profiles profiles enabled with --profile\n * @returns {{ waves: string[][], warnings: string[] } | { error: string }}\n */\nfunction planStartup(services, targets, profiles) {\n  // Your code here\n}\n",
        functionName: "planStartup",
        testCases: [
          {
            description: "dependencies start first; independent services share a wave",
            args: [{ web: { depends_on: ["api"] }, api: { depends_on: { db: { condition: "service_healthy" }, redis: { condition: "service_started" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, redis: {} }, [], []],
            expected: { waves: [["db", "redis"], ["api"], ["web"]], warnings: [] },
          },
          {
            description: "a one-shot migration job gates the API with service_completed_successfully",
            args: [{ api: { depends_on: { db: { condition: "service_healthy" }, migrate: { condition: "service_completed_successfully" } } }, migrate: { depends_on: { db: { condition: "service_healthy" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } } }, [], []],
            expected: { waves: [["db"], ["migrate"], ["api"]], warnings: [] },
          },
          {
            description: "naming a target starts only it and its dependencies",
            args: [{ web: { depends_on: ["api"] }, api: { depends_on: { db: { condition: "service_healthy" }, redis: { condition: "service_started" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, redis: {} }, ["api"], []],
            expected: { waves: [["db", "redis"], ["api"]], warnings: [] },
          },
          {
            description: "a diamond: each service starts one wave after its deepest dependency",
            args: [{ web: { depends_on: ["api", "auth"] }, api: { depends_on: ["db"] }, auth: { depends_on: ["db", "cache"] }, db: {}, cache: {} }, [], []],
            expected: { waves: [["cache", "db"], ["api", "auth"], ["web"]], warnings: [] },
          },
          {
            description: "services behind an inactive profile don't start",
            args: [{ web: { depends_on: ["api"] }, api: { depends_on: { db: { condition: "service_healthy" }, redis: { condition: "service_started" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, redis: {}, adminer: { profiles: ["debug"], depends_on: ["db"] } }, [], []],
            expected: { waves: [["db", "redis"], ["api"], ["web"]], warnings: [] },
          },
          {
            description: "--profile debug enables them",
            args: [{ web: { depends_on: ["api"] }, api: { depends_on: { db: { condition: "service_healthy" }, redis: { condition: "service_started" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, redis: {}, adminer: { profiles: ["debug"], depends_on: ["db"] } }, [], ["debug"]],
            expected: { waves: [["db", "redis"], ["adminer", "api"], ["web"]], warnings: [] },
          },
          {
            description: "targeting a profiled service enables its profile automatically",
            args: [{ db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, migrate: { profiles: ["tools"], depends_on: { db: { condition: "service_healthy" } } }, api: { depends_on: ["db"] } }, ["migrate"], []],
            expected: { waves: [["db"], ["migrate"]], warnings: [] },
          },
          {
            description: "...but not the profile of a dependency in another profile",
            args: [{ web: {}, db: { profiles: ["dev"] }, phpmyadmin: { profiles: ["debug"], depends_on: ["db"] } }, ["phpmyadmin"], []],
            expected: { error: "service \"phpmyadmin\" depends on \"db\", which is not enabled by the active profiles" },
            isEdgeCase: true,
          },
          {
            description: "`required: false` skips a disabled dependency with a warning",
            args: [{ api: { depends_on: { db: { condition: "service_started" }, tracing: { condition: "service_started", required: false } } }, db: {}, tracing: { profiles: ["observability"] } }, [], []],
            expected: { waves: [["db"], ["api"]], warnings: ["optional dependency \"tracing\" of \"api\" is not enabled; skipping"] },
            isEdgeCase: true,
          },
          {
            description: "service_healthy on a dependency without a healthcheck is an error",
            args: [{ api: { depends_on: { db: { condition: "service_healthy" } } }, db: {} }, [], []],
            expected: { error: "\"api\" waits for \"db\" to be healthy, but \"db\" has no healthcheck" },
            isEdgeCase: true,
          },
          {
            description: "a dependency cycle is reported, starting at its alphabetically first service",
            args: [{ worker: { depends_on: ["queue"] }, queue: { depends_on: ["api"] }, api: { depends_on: ["worker"] }, web: { depends_on: ["api"] } }, [], []],
            expected: { error: "dependency cycle: api -> worker -> queue -> api" },
            isEdgeCase: true,
          },
          {
            description: "a service that depends on itself is a cycle",
            args: [{ api: { depends_on: ["api"] } }, [], []],
            expected: { error: "dependency cycle: api -> api" },
            isEdgeCase: true,
          },
          {
            description: "a dependency on an undefined service is an error",
            args: [{ api: { depends_on: ["postgres"] }, db: {} }, [], []],
            expected: { error: "service \"api\" depends on undefined service \"postgres\"" },
            isEdgeCase: true,
          },
          {
            description: "an unknown target is an error",
            args: [{ web: { depends_on: ["api"] }, api: { depends_on: { db: { condition: "service_healthy" }, redis: { condition: "service_started" } } }, db: { healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "5s", retries: 5 } }, redis: {} }, ["worker"], []],
            expected: { error: "unknown service \"worker\"" },
            isEdgeCase: true,
          },
          {
            description: "an empty project starts nothing",
            args: [{}, [], []],
            expected: { waves: [], warnings: [] },
            isEdgeCase: true,
          },
          {
            description: "a 200-service chain produces 200 waves",
            args: [Object.fromEntries(Array.from({ length: 200 }, (_, i) => ["svc" + String(i).padStart(3, "0"), i === 0 ? {} : { depends_on: ["svc" + String(i - 1).padStart(3, "0")] }])), [], []],
            expected: { waves: Array.from({ length: 200 }, (_, i) => ["svc" + String(i).padStart(3, "0")]), warnings: [] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "docker-volumes-networking",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Volumes & Networking",
      summary:
        "A container's writable layer dies with the container and is slow for heavy writes, so state goes in a mount. Named volumes are created and managed by Docker, outlive containers, skip the storage driver's overhead and are the default for databases; an empty named volume is pre-populated with whatever the image has at the mount path. Bind mounts map a host path into the container, ideal for live-reloading source in development and fragile in production, because the container now depends on the host's directory layout and on numeric UIDs lining up inside and outside. tmpfs mounts live in memory, count against the memory limit and vanish on stop: use them for scratch space and secrets that must never touch disk. Any mount hides whatever the image had at that path.\n\nThose two rules cause mirror-image bugs. Bind-mount your project over `/app` and the image's `/app/node_modules`, built for Linux, disappears; the usual fix is an extra volume at `/app/node_modules`. Conversely, a named volume filled from the image on first run is never refreshed, so the new static files in a rebuilt image don't appear until you remove the volume.\n\nOn a user-defined bridge network, such as a Compose project's, containers resolve each other by name through Docker's embedded DNS server at `127.0.0.11`; the legacy default `bridge` network has no name resolution. Containers on a network talk to each other's container ports directly, and `EXPOSE` is only documentation. Publishing (`-p 8080:80`) is what opens a port to the outside: it adds NAT rules on the host and binds every interface by default, so `-p 5432:5432` puts your database on the network, and on Linux those rules are evaluated before ufw's, so ufw won't block them. Publish to `127.0.0.1:5432:5432` when only the host needs access, and never publish ports only other containers use.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Docker Docs: Volumes", url: "https://docs.docker.com/engine/storage/volumes/", kind: "docs" },
        { label: "Docker Docs: Bridge network driver", url: "https://docs.docker.com/engine/network/drivers/bridge/", kind: "docs" },
        { label: "Docker Docs: Port publishing and mapping", url: "https://docs.docker.com/engine/network/port-publishing/", kind: "docs" },
        { label: "Docker Docs: Packet filtering and firewalls (Docker and ufw)", url: "https://docs.docker.com/engine/network/packet-filtering-firewalls/", kind: "docs" },
      ],
      video: {
        title: "Complete Docker Course - From BEGINNER to PRO! (Learn Containers)",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=RqTEHSBrYFw",
        videoId: "RqTEHSBrYFw",
        durationLabel: "4:44:20",
        startSeconds: 2886,
        chapterLabel: "Understanding container data and docker volumes",
      },
      alternateVideos: [
        {
          title: "Docker networking is CRAZY!! (you NEED to learn it)",
          channel: "NetworkChuck",
          url: "https://www.youtube.com/watch?v=bKFMS5C4CG0",
          videoId: "bKFMS5C4CG0",
          durationLabel: "39:12",
          startSeconds: 213,
          chapterLabel: "The first network: The Default Bridge",
        },
        {
          title: "Docker Volumes explained in 6 minutes",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=p2PH_YPCsis",
          videoId: "p2PH_YPCsis",
          durationLabel: "6:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-volumes-networking-q1",
          prompt:
            "The image runs `npm ci` into `/app/node_modules`. In development you add this, and the app crashes with `Cannot find module 'express'`. Why?\n\n```yaml\nservices:\n  api:\n    build: .\n    volumes:\n      - ./:/app\n```",
          options: [
            "The bind mount hides everything the image had under `/app`, including `node_modules`, and the host folder has no `node_modules` of its own",
            "Bind mounts are read-only by default, so Node can't load modules",
            "`npm ci` output is deleted whenever a volume is attached",
            "Compose ignores the Dockerfile when `volumes` is set",
          ],
          correctIndex: 0,
          explanation:
            "A mount obscures the image's content at that path. Add a volume at `/app/node_modules` so the container keeps its own Linux-built dependencies, or install inside the container on start.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-volumes-networking-q2",
          prompt:
            "An nginx service mounts the named volume `static` at `/usr/share/nginx/html`. You rebuild the image with new files there and recreate the container, but the old files are still served. Why?",
          options: [
            "Docker copies image content into a named volume only when the volume is empty; after the first run the volume keeps its own data",
            "nginx caches files in memory until the host reboots",
            "Named volumes are read-only after creation",
            "Recreating a container reuses its old image unless you pass `--pull always`",
          ],
          correctIndex: 0,
          explanation:
            "Pre-population is a one-time copy. Don't use a volume for content that belongs to the image, or remove the volume (`docker compose down -v`) when you intend to reset it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-volumes-networking-q3",
          prompt:
            "On an Ubuntu server whose ufw policy denies port 5432, you run `docker run -d -p 5432:5432 postgres:18`. Which statements are true? (Select all that apply.)",
          options: [
            "The port is published on all host interfaces (`0.0.0.0` and `::`) by default",
            "Docker's forwarding rules handle the traffic before ufw's rules see it, so ufw doesn't block it",
            "`-p 127.0.0.1:5432:5432` would limit access to the host itself",
            "`EXPOSE 5432` in the image already made it reachable from other machines",
            "Other containers on the same network can only reach Postgres through the published port",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Publishing is insecure by default and bypasses ufw, which is how many databases end up on the internet. `EXPOSE` publishes nothing, and containers on a shared network use the container port directly.",
        },
        {
          id: "docker-volumes-networking-q4",
          prompt: "In a Compose project, the `api` service connects to Postgres at `localhost:5432` and gets `ECONNREFUSED`, even though the `db` service is healthy. What's wrong?",
          options: [
            "Inside the `api` container, `localhost` is the `api` container itself; connect to `db:5432`",
            "Postgres refuses connections from other containers until you publish its port",
            "Compose services can only talk over the host's network",
            "The connection needs the host's IP address instead of a name",
          ],
          correctIndex: 0,
          explanation:
            "Each container has its own network namespace and loopback interface. Compose's network gives every service a DNS name equal to its service name.",
        },
        {
          id: "docker-volumes-networking-q5",
          prompt: "Two containers started with plain `docker run` (no `--network`) can ping each other's IP but not each other's name. Why?",
          options: [
            "They're on the default `bridge` network, which has no automatic name resolution; user-defined networks do",
            "Container names are never resolvable; you must use IP addresses",
            "DNS only works for containers in the same Compose file",
            "Name resolution requires publishing a port",
          ],
          correctIndex: 0,
          explanation:
            "The default bridge is a legacy detail kept for compatibility. Create a network (`docker network create app`) and attach both containers to get Docker's embedded DNS.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-volumes-networking-q6",
          prompt: "A service has `ports: [\"8080:3000\"]`. Which address does another container on the same Compose network use to reach it?",
          options: ["`api:3000`", "`api:8080`", "`localhost:8080`", "`host.docker.internal:3000`"],
          correctIndex: 0,
          explanation:
            "`8080:3000` maps host port 8080 to container port 3000 for traffic from outside. Container-to-container traffic goes straight to the container's port.",
        },
        {
          id: "docker-volumes-networking-q7",
          prompt: "Which statements about a tmpfs mount are true? (Select all that apply.)",
          options: [
            "Its contents live in memory and disappear when the container stops",
            "Its usage counts against the container's memory limit",
            "It can be shared between containers like a named volume",
            "It's the right place for a database's data directory",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "tmpfs suits scratch data and secrets that should never touch disk. Filling it can OOM the container, it can't be shared, and a database would lose everything on restart.",
        },
        {
          id: "docker-volumes-networking-q8",
          prompt: "What happens to a project's named volumes on `docker compose down`, and on `docker compose down -v`?",
          options: [
            "`down` keeps named volumes; `down -v` removes them",
            "Both remove named volumes",
            "Neither removes them; you must use `docker volume rm`",
            "`down` removes them unless the service has `restart: always`",
          ],
          correctIndex: 0,
          explanation:
            "Volumes outlive containers by design, which is why your database survives a `down`. `-v` also removes named volumes declared in the file, so treat it as destructive.",
        },
        {
          id: "docker-volumes-networking-q9",
          prompt:
            "A container running as UID 1000 gets `EACCES` writing into a bind-mounted host directory owned by `root`, even though the container's `node` user \"owns\" the path inside the image. Why?",
          options: [
            "Permissions are checked by numeric UID and GID against the host files; names inside the image don't matter",
            "Bind mounts are always read-only for non-root users",
            "The image's `chown` is reapplied to the host directory at startup",
            "SELinux always blocks writes from containers",
          ],
          correctIndex: 0,
          explanation:
            "A bind mount exposes the host's files as they are, including ownership. Match the UID, adjust the host directory's ownership, or use a named volume, which Docker creates for you.",
        },
        {
          id: "docker-volumes-networking-q10",
          prompt: "What does `EXPOSE 3000` in a Dockerfile actually do?",
          options: [
            "It records the port in image metadata; nothing is published unless you use `-p` (or `-P` to publish exposed ports to random host ports)",
            "It opens port 3000 on the host",
            "It lets other containers connect to port 3000, which is otherwise blocked",
            "It makes the app listen on port 3000",
          ],
          correctIndex: 0,
          explanation:
            "`EXPOSE` is documentation that tooling can read. Containers on a shared network can reach any listening port, and the app still chooses its own port.",
        },
      ],
    },
    {
      id: "docker-ci-cd",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Docker in CI/CD Pipelines",
      summary:
        "In CI the image is the release artifact: build once, test that exact image, push it, and promote the same digest through staging and production instead of rebuilding per environment, since a rebuild can pull a moved base tag or resolve different packages. Tag it with something traceable, such as the git SHA (`api:3f9c2e1`) or a semver release, and deploy by tag or digest. `latest` is a moving pointer: it makes deploys irreproducible and rollbacks guesswork, and in Kubernetes an unchanged `image: api:latest` in the manifest doesn't even trigger a rollout. Turn on tag immutability in your registry so nobody can overwrite a release tag.\n\nCI runners are usually ephemeral, so BuildKit's local cache starts empty on every run. Export and import it: `cache-to`/`cache-from` with the `gha` backend on GitHub Actions, or a `registry` cache image elsewhere. The default `mode=min` exports only the layers of the final image, so in a multi-stage build the expensive `npm ci` in a builder stage is never cached; `mode=max` caches every stage at the cost of a bigger cache.\n\nThe supply chain is now part of the pipeline (OWASP's 2025 Top 10 lists Software Supply Chain Failures third). Scan images for known CVEs with Docker Scout, Trivy or Grype and fail on fixable high-severity findings rather than on everything, then keep rescanning what's in the registry, because new CVEs are published after you build. BuildKit attaches minimal provenance attestations by default and generates an SBOM with `--sbom=true`: an inventory of every package in the image, so \"are we affected?\" becomes a query instead of a rebuild. Sign images (cosign) and verify signatures at deploy time. Build multi-arch images with `buildx` (`--platform linux/amd64,linux/arm64`), pass build secrets as secrets rather than build args, and pin third-party actions to commit SHAs.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Docker Docs: Docker Build GitHub Actions", url: "https://docs.docker.com/build/ci/github-actions/", kind: "docs" },
        { label: "Docker Docs: Cache storage backends (min vs max mode)", url: "https://docs.docker.com/build/cache/backends/", kind: "docs" },
        { label: "Docker Docs: Build attestations (SBOM and provenance)", url: "https://docs.docker.com/build/metadata/attestations/", kind: "docs" },
        { label: "docker/metadata-action: generate tags from git refs", url: "https://github.com/docker/metadata-action", kind: "repo" },
      ],
      video: {
        title: "Complete GitHub Actions Course - From BEGINNER to PRO",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=Xwpi0ITkL3U",
        videoId: "Xwpi0ITkL3U",
        durationLabel: "3:42:35",
        startSeconds: 9770,
        chapterLabel: "Capstone: Build/Push Workflow",
      },
      alternateVideos: [
        {
          title: "GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=R8_veQiYBjI",
          videoId: "R8_veQiYBjI",
          durationLabel: "32:30",
          startSeconds: 1475,
          chapterLabel: "Build Docker Image and push to private Docker Repo",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-ci-cd-q1",
          prompt:
            "A Deployment uses `image: registry.example.com/api:latest`. CI builds and pushes a new `api:latest`, then runs `kubectl apply -f deploy.yaml` with the file unchanged. What happens?",
          options: [
            "Nothing rolls out: the Pod template didn't change, so the running Pods keep the old image",
            "Kubernetes detects the new digest and performs a rolling update",
            "Every Pod restarts immediately and pulls the new image",
            "The apply fails because the tag already exists",
          ],
          correctIndex: 0,
          explanation:
            "A Deployment rolls out only when `.spec.template` changes. Deploy immutable tags (the git SHA) or digests, so each release is a template change you can also roll back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-ci-cd-q2",
          prompt: "Which are sound image practices for a CI/CD pipeline? (Select all that apply.)",
          options: [
            "Tag each build with the git commit SHA",
            "Promote the same digest from staging to production",
            "Enable tag immutability in the registry",
            "Rebuild the image from the same commit for each environment",
            "Deploy `latest` to production so it always gets the newest build",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Traceable, immutable references mean the artifact you tested is the artifact you run. Rebuilding per environment can produce different bytes, and `latest` hides which build is actually running.",
        },
        {
          id: "docker-ci-cd-q3",
          prompt:
            "CI uses `cache-from: type=gha` and `cache-to: type=gha`. The Dockerfile has a `deps` stage that runs `npm ci` and a slim final stage. Every run reinstalls dependencies even when `package-lock.json` hasn't changed. Why?",
          options: [
            "The default `mode=min` exports only the final image's layers, so the `deps` stage is never cached; use `mode=max`",
            "The GitHub Actions cache can't store Docker layers",
            "`npm ci` always invalidates the cache because it deletes `node_modules`",
            "Multi-stage builds disable BuildKit's cache",
          ],
          correctIndex: 0,
          explanation:
            "`min` is the default for every backend that supports modes. `mode=max` exports intermediate stages too, trading a larger cache for more hits.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-ci-cd-q4",
          prompt: "Why does a well-ordered Dockerfile still rebuild every layer on a hosted CI runner unless you configure a cache backend?",
          options: [
            "Each job gets a fresh runner whose BuildKit cache is empty",
            "CI builds always pass `--no-cache`",
            "Registries strip layer metadata, so layers can't be matched",
            "BuildKit only caches builds run by the same user",
          ],
          correctIndex: 0,
          explanation:
            "The layer cache is local to the builder. Exporting it (`gha`, `registry`, `s3`, …) and importing it on the next run is what makes CI builds incremental.",
        },
        {
          id: "docker-ci-cd-q5",
          prompt: "What does an SBOM attached to an image give you?",
          options: [
            "An inventory of the packages and versions in the image, so you can check exposure to a new CVE without rebuilding",
            "A guarantee that the image has no known vulnerabilities",
            "A cryptographic signature proving who built the image",
            "A compressed copy of the image's layers for faster pulls",
          ],
          correctIndex: 0,
          explanation:
            "An SBOM is data, not a verdict: scanners and policy engines match it against vulnerability databases. Signing and provenance answer who built it and how.",
        },
        {
          id: "docker-ci-cd-q6",
          prompt: "An image passed its vulnerability scan when it was built three months ago. Why rescan it in the registry?",
          options: [
            "New CVEs are published every day against packages that were already in the image",
            "Images degrade in registries and pick up new packages",
            "Scanners only check the top layer the first time",
            "Registries require a rescan before every pull",
          ],
          correctIndex: 0,
          explanation:
            "The bytes don't change, but what's known about them does. Continuous scanning of deployed images (and a fast rebuild path) is how you respond to the next Log4Shell-scale CVE.",
        },
        {
          id: "docker-ci-cd-q7",
          prompt: "Your team develops on Apple Silicon and deploys to amd64 and Graviton (arm64) nodes. What should CI publish?",
          options: [
            "A multi-platform image (an image index) built with `docker buildx build --platform linux/amd64,linux/arm64`",
            "Two unrelated tags, and each cluster pulls the one it needs by name",
            "An amd64 image only, since arm64 nodes can emulate amd64 transparently",
            "The image built on a developer's laptop, which already matches production",
          ],
          correctIndex: 0,
          explanation:
            "An image index maps one tag to per-platform manifests, and each node pulls the variant for its architecture. Emulation isn't transparent or free on servers, and laptop builds aren't reproducible artifacts.",
        },
        {
          id: "docker-ci-cd-q8",
          prompt: "A workflow runs `docker build --build-arg NPM_TOKEN=${{ secrets.NPM_TOKEN }} .`. What's the problem?",
          options: [
            "Build args are recorded in the image history and in max-mode provenance, so the token can leak with the image",
            "GitHub Actions masks the value, so there's no problem",
            "Build args are limited to 64 characters",
            "Build args aren't visible to `RUN` instructions, so `npm ci` can't authenticate",
          ],
          correctIndex: 0,
          explanation:
            "Log masking protects CI output, not the image. Pass it as a BuildKit secret (`secrets:` in `docker/build-push-action`, `--secret` on the CLI) and read it with `RUN --mount=type=secret`.",
        },
        {
          id: "docker-ci-cd-q9",
          prompt: "Why pin third-party GitHub Actions to a full commit SHA instead of a tag like `@v4`?",
          options: [
            "Tags are mutable, so a compromised maintainer account can repoint `@v4` at malicious code that then runs with your secrets",
            "Tags stop working after a year",
            "SHAs make workflows run faster",
            "GitHub requires SHAs for any action that builds images",
          ],
          correctIndex: 0,
          explanation:
            "A commit SHA is immutable, like an image digest. Pair pinning with automated update PRs so you still get fixes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-ci-cd-q10",
          prompt: "What does a vulnerability-scan policy that fails the build on every finding, of any severity, usually lead to?",
          options: [
            "Alert fatigue and blanket ignores; gating on fixable high and critical findings keeps the gate meaningful",
            "Images with zero vulnerabilities after a week or two",
            "Faster builds, because scanners cache their results",
            "Nothing: scanners never report findings in official base images",
          ],
          correctIndex: 0,
          explanation:
            "Most images carry low-severity or unfixable findings, so an all-or-nothing gate gets bypassed. Gate on what you can act on, track the rest, and rebuild when fixes land.",
        },
      ],
    },
    {
      id: "docker-kubernetes-intro",
      moduleId: "be-docker",
      trackId: "backend",
      title: "Intro to Kubernetes (Pods, Services, Deployments)",
      summary:
        "Kubernetes runs containers across a cluster by reconciling declared state: you submit objects to the API server, and controllers keep changing reality until it matches. A Pod is the smallest unit, one or more containers that share a network namespace (one IP, `localhost` between them) and volumes, scheduled onto a node together. Pods are disposable and get new IPs when replaced, so you rarely create them directly. A Deployment owns ReplicaSets, which keep N identical Pods running; changing the Pod template creates a new ReplicaSet and rolls over gradually, bounded by `maxSurge` (default 25%, rounded up) and `maxUnavailable` (default 25%, rounded down), and `kubectl rollout undo` goes back. A Service gives the matching Pods a stable virtual IP and DNS name (`api.default.svc.cluster.local`) and balances across the ready ones: `ClusterIP` (the default, internal only), `NodePort` (a port from 30000–32767 on every node) or `LoadBalancer` (a cloud load balancer in front).\n\nProbes decide traffic and restarts. A failing readiness probe removes the Pod from the Service's endpoints; a failing liveness probe restarts the container; a startup probe holds both off for slow starters. Checking the database in a liveness probe is a classic outage amplifier: the database blips and every Pod restarts at once.\n\nResources: `requests` are what the scheduler reserves on a node, `limits` are enforced by cgroups. Going over the CPU limit throttles the container; going over the memory limit gets it OOMKilled (exit 137) and restarted, often into `CrashLoopBackOff`. ConfigMaps hold configuration and Secrets hold credentials, but Secret values are only base64-encoded and, by default, stored unencrypted in etcd, and anyone who can create a Pod in the namespace can read them. Enable encryption at rest, lock down RBAC and consider an external secret manager. Environment variables from a ConfigMap never update in running Pods: restart the rollout.",
      level: "advanced",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "Kubernetes: Deployments", url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/", kind: "docs" },
        { label: "Kubernetes: Service", url: "https://kubernetes.io/docs/concepts/services-networking/service/", kind: "docs" },
        { label: "Kubernetes: Liveness, Readiness, and Startup Probes", url: "https://kubernetes.io/docs/concepts/workloads/pods/probes/", kind: "docs" },
        { label: "Kubernetes: Good practices for Kubernetes Secrets", url: "https://kubernetes.io/docs/concepts/security/secrets-good-practices/", kind: "article" },
      ],
      video: {
        title: "Kubernetes Crash Course for Absolute Beginners [NEW]",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=s_o8dwzRlu4",
        videoId: "s_o8dwzRlu4",
        durationLabel: "1:12:03",
      },
      alternateVideos: [
        {
          title: "Docker and Kubernetes - Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=Wf2eSG3owoA",
          videoId: "Wf2eSG3owoA",
          durationLabel: "4:17:59",
          startSeconds: 10650,
          chapterLabel: "Kubernetes",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-kubernetes-intro-q1",
          prompt:
            "An API needs about 90 seconds to warm its caches before it can serve. It has a liveness probe with `initialDelaySeconds: 10`, `periodSeconds: 10` and `failureThreshold: 3`, and no other probes. What happens?",
          options: [
            "The kubelet keeps killing the container before it finishes starting, so it never becomes ready",
            "The Pod waits in `Pending` until the liveness probe passes",
            "Kubernetes automatically extends the delay for slow containers",
            "Traffic is sent to the Pod while it warms up, and it's restarted once afterwards",
          ],
          correctIndex: 0,
          explanation:
            "Liveness probes don't wait for readiness. Probes at roughly 10, 20 and 30 seconds fail, the third failure triggers a restart, and the cycle repeats. Add a startup probe (which suspends liveness and readiness until it passes) and a readiness probe for traffic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-kubernetes-intro-q2",
          prompt:
            "Every replica's liveness probe calls `/health`, which runs `SELECT 1` against the primary database. The database fails over, which takes 30 seconds. What's the likely result?",
          options: [
            "Every Pod fails liveness and is restarted at the same time, turning a 30-second blip into a longer outage",
            "Kubernetes pauses liveness probes while the database is down",
            "Only one Pod restarts because probes are staggered",
            "Nothing: liveness failures only log a warning",
          ],
          correctIndex: 0,
          explanation:
            "Liveness should answer \"is this process wedged?\", which a restart can fix. Dependency health belongs, carefully, in readiness, and restarting healthy processes because a shared dependency is down amplifies the outage.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-kubernetes-intro-q3",
          prompt: "Which statements about Kubernetes Secrets are true by default? (Select all that apply.)",
          options: [
            "The values in the manifest are base64-encoded, which is encoding, not encryption",
            "They're stored unencrypted in etcd unless encryption at rest is configured",
            "Anyone allowed to create Pods in the namespace can read them by mounting them",
            "They're encrypted with the cluster's CA certificate automatically",
            "`kubectl get secret -o yaml` masks the values",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Secrets are a separate object type so you can apply tighter RBAC and encryption, not because they're protected on their own. `kubectl get -o yaml` prints the base64 values, which anyone can decode.",
        },
        {
          id: "docker-kubernetes-intro-q4",
          prompt:
            "A Deployment has `replicas: 10` and the default rolling update strategy (`maxSurge: 25%`, `maxUnavailable: 25%`). During a rollout, what are the most Pods that can exist, and the fewest that must stay available?",
          options: ["13 total, at least 8 available", "12 total, at least 8 available", "13 total, at least 7 available", "12 total, at least 7 available"],
          correctIndex: 0,
          explanation:
            "`maxSurge` rounds up (2.5 → 3, so 10 + 3 = 13) and `maxUnavailable` rounds down (2.5 → 2, so 10 − 2 = 8). The asymmetry errs towards keeping capacity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-kubernetes-intro-q5",
          prompt: "How are CPU and memory limits enforced differently?",
          options: [
            "Exceeding the CPU limit throttles the container; exceeding the memory limit can get it OOM-killed and restarted",
            "Both are enforced by killing the container",
            "Both are enforced by throttling",
            "CPU limits kill the container; memory limits only slow it down",
          ],
          correctIndex: 0,
          explanation:
            "CPU is compressible, so the kernel just gives the container less time. Memory isn't: the container shows `Reason: OOMKilled` and exit code 137, and repeated kills lead to `CrashLoopBackOff`.",
        },
        {
          id: "docker-kubernetes-intro-q6",
          prompt:
            "A new Pod stays `Pending` with `0/3 nodes are available: 3 Insufficient cpu`, yet monitoring shows every node at 20% CPU usage. What explains it?",
          options: [
            "Scheduling uses the sum of the Pods' CPU requests, not actual usage, and the nodes' requests are already allocated",
            "The metrics are delayed by a few minutes, so the nodes are actually full",
            "The Pod's CPU limit is higher than any node's total CPU",
            "Pending Pods are waiting for their image to download",
          ],
          correctIndex: 0,
          explanation:
            "The scheduler places Pods by requests. Oversized requests strand capacity; undersized ones overload nodes. Right-size them from real usage.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-kubernetes-intro-q7",
          prompt: "Which statements about Service types are true? (Select all that apply.)",
          options: [
            "`ClusterIP` is the default and is reachable only from inside the cluster",
            "`NodePort` opens the same port, from 30000–32767 by default, on every node",
            "`LoadBalancer` asks the environment for an external load balancer and, by default, also allocates node ports",
            "`ClusterIP` Services are reachable from the internet unless a NetworkPolicy blocks them",
            "`ExternalName` proxies traffic through kube-proxy to an external host",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The types build on each other: LoadBalancer on NodePort on ClusterIP. `ExternalName` is just a DNS CNAME record, with no proxying at all.",
        },
        {
          id: "docker-kubernetes-intro-q8",
          prompt: "A Service has `selector: { app: web }`, but the Deployment's Pod template is labeled `app: website`. What do clients of the Service see?",
          options: [
            "Connection failures: the Service selects no Pods, so it has no endpoints",
            "Traffic reaches the Pods anyway because the Service and Deployment share a name",
            "Kubernetes rejects the Service when it's applied",
            "Requests are load-balanced to every Pod in the namespace",
          ],
          correctIndex: 0,
          explanation:
            "Services find Pods only by label selector. `kubectl get endpointslices` (or `kubectl describe svc`) showing no endpoints is the first thing to check.",
        },
        {
          id: "docker-kubernetes-intro-q9",
          prompt: "Two containers in the same Pod need to talk to each other. How?",
          options: [
            "Over `localhost`, because they share one network namespace and IP (so they can't both listen on the same port)",
            "Through a Service that selects the Pod",
            "Through the node's IP address and a NodePort",
            "They can't; each container needs its own Pod",
          ],
          correctIndex: 0,
          explanation:
            "Containers in a Pod share networking and can share volumes, which is what sidecars rely on. Separate Pods talk through Services.",
        },
        {
          id: "docker-kubernetes-intro-q10",
          prompt: "Why do teams run a Deployment instead of creating bare Pods?",
          options: [
            "Nothing recreates a bare Pod when its node fails or it's evicted; a Deployment's ReplicaSet does, and the Deployment adds rolling updates and rollback",
            "Bare Pods can't run more than one container",
            "Bare Pods don't get an IP address",
            "Deployments make containers start faster",
          ],
          correctIndex: 0,
          explanation:
            "Controllers are what make the system self-healing: they compare desired and actual state and act. A bare Pod is scheduled once and forgotten.",
        },
        {
          id: "docker-kubernetes-intro-q11",
          prompt: "You change a value in a ConfigMap that a Deployment consumes through `envFrom`. When do the running Pods see the new value?",
          options: [
            "Not until the Pods are recreated, for example with `kubectl rollout restart deployment/api`",
            "Within about a minute, when the kubelet syncs the ConfigMap",
            "Immediately, because environment variables are read on every access",
            "At the next liveness probe",
          ],
          correctIndex: 0,
          explanation:
            "Environment variables are fixed when the container starts. ConfigMaps mounted as volumes update eventually (except through `subPath`), but the app still has to reread the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "docker-kubernetes-intro-q12",
          prompt:
            "You roll out v2 to a 4-replica Deployment (default strategy), and v2's Pods never pass their readiness probe. What happens?",
          options: [
            "The rollout stalls: at least 3 old Pods keep serving, v2 gets no traffic, and after `progressDeadlineSeconds` the Deployment reports `ProgressDeadlineExceeded` without rolling back",
            "Kubernetes rolls back to v1 automatically after the deadline",
            "All old Pods are replaced and the Service goes down",
            "The new Pods receive traffic until they fail liveness",
          ],
          correctIndex: 0,
          explanation:
            "With 4 replicas, `maxUnavailable` is 1, so the controller can't remove more old Pods while new ones aren't ready. Kubernetes only reports the stalled rollout; you (or your CD tool) run `kubectl rollout undo`.",
        },
      ],
    },
  ],
} satisfies Module;
