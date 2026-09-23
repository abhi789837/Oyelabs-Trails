import type { Module } from "@/types/curriculum";

export default {
  id: "devops-linux-shell",
  trackId: "devops",
  name: "Linux & the Shell",
  description:
    "The Linux an application engineer needs when something is broken on a server at 2am: where files live, who is allowed to touch them, what a process is doing, where the logs went, and why the disk is full of nothing.",
  refs: [
    { label: "man7.org: Linux man-pages online", url: "https://man7.org/linux/man-pages/man7/man-pages.7.html", kind: "docs" },
    { label: "GNU Bash Reference Manual", url: "https://www.gnu.org/software/bash/manual/bash.html", kind: "docs" },
    { label: "Greg's Wiki: BashPitfalls", url: "https://mywiki.wooledge.org/BashPitfalls", kind: "article" },
    { label: "The Art of Command Line", url: "https://github.com/jlevy/the-art-of-command-line", kind: "repo" },
  ],
  topics: [
    {
      id: "lin-filesystem-hierarchy",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "The Filesystem Hierarchy and Where Software Lives",
      summary:
        "Linux has one tree, no drive letters, and a convention — the Filesystem Hierarchy Standard — about what belongs where. The split that matters operationally is by *who owns the bytes and how long they live*: `/usr` is distro-owned and reproducible from packages, `/etc` is host-specific configuration you edit, `/var` is mutable state the machine generates (logs, spool, caches, database files), `/usr/local` and `/opt` are for software the package manager didn't install, and `/tmp` is scratch that nothing may depend on surviving.\n\nGetting this wrong is what turns a deploy into an incident. Dropping a binary into `/usr/bin` puts you in a fight with the next `apt upgrade`; writing application state into `/tmp` loses it on reboot and, under a systemd unit with `PrivateTmp=yes`, hides it from every other process; putting logs somewhere logrotate doesn't know about is how `/var` fills up and the database stops accepting writes. `/proc` and `/sys` look like directories but are kernel interfaces generated on read — `/proc/<pid>/fd` and `/proc/<pid>/environ` are two of the most useful debugging tools on the box, and `du` over them is meaningless.\n\nPackage managers are the other half of the answer to \"where did this come from\". Debian and Ubuntu use `apt` over `dpkg`; RHEL, Fedora and Amazon Linux use `dnf` (the successor to `yum`) over `rpm`. Both record every file they install, so `dpkg -S /usr/bin/curl` or `rpm -qf /usr/bin/curl` answers \"which package owns this\" in one command — the question a `curl … | sudo bash` install makes permanently unanswerable, along with upgrade and uninstall.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "man7: hier(7) — description of the filesystem hierarchy", url: "https://man7.org/linux/man-pages/man7/hier.7.html", kind: "docs" },
        { label: "Linux Foundation: Filesystem Hierarchy Standard 3.0", url: "https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html", kind: "spec" },
        { label: "Debian manpages: apt(8)", url: "https://manpages.debian.org/trixie/apt/apt.8.en.html", kind: "docs" },
        { label: "DNF command reference", url: "https://dnf.readthedocs.io/en/latest/command_ref.html", kind: "docs" },
      ],
      video: {
        title: "the Linux File System explained in 1,233 seconds // Linux for Hackers // EP 2",
        channel: "NetworkChuck",
        url: "https://www.youtube.com/watch?v=A3G-3hp88mo",
        videoId: "A3G-3hp88mo",
        startSeconds: 148,
        chapterLabel: "the ROOT of the File System",
        durationLabel: "20:33",
      },
      alternateVideos: [
        {
          title: "Linux Directories Explained in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=42iQKuQodW4",
          videoId: "42iQKuQodW4",
          durationLabel: "2:52",
        },
        {
          title: "Linux Crash Course - The apt Command",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=1kicKTbK768",
          videoId: "1kicKTbK768",
          startSeconds: 136,
          chapterLabel: "Understanding APT",
          durationLabel: "16:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-filesystem-hierarchy-q1",
          prompt: "You ship a self-built binary to a Debian server by hand, outside the package manager. Which directory is the conventional home for it?",
          options: ["`/usr/local/bin`", "`/usr/bin`", "`/bin`", "`/var/bin`"],
          correctIndex: 0,
          explanation:
            "`/usr/local` is reserved for software the local administrator installs; the distro's packages never write there, so upgrades can't clobber you. `/usr/bin` and `/bin` are owned by the package manager, and `/var/bin` is not a thing.",
        },
        {
          id: "lin-filesystem-hierarchy-q2",
          prompt: "Which statements about `/tmp` are true? (Select all that apply.)",
          options: [
            "A systemd service with `PrivateTmp=yes` gets its own `/tmp`, invisible to other processes and destroyed when the service stops",
            "`/var/tmp` is the place for temporary files that need to survive a reboot",
            "On distributions that mount `/tmp` as a tmpfs, its contents live in RAM and count against memory rather than disk",
            "Files written to `/tmp` are readable only by the user who created them",
            "Every distribution guarantees `/tmp` is emptied on every boot",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`PrivateTmp` is a mount namespace, `/var/tmp` is the reboot-surviving variant, and a tmpfs `/tmp` is memory-backed. But `/tmp` is mode 1777 and files in it default to 0644 — world-readable — and cleanup policy is configurable, not guaranteed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-filesystem-hierarchy-q3",
          prompt: "You edited `/etc/nginx/nginx.conf` on a server where nginx came from `apt`. What happens to your edit on the next `apt upgrade` of nginx?",
          options: [
            "dpkg recognises it as a modified conffile and keeps your version, offering the packaged one alongside it",
            "dpkg silently overwrites it with the packaged version",
            "The upgrade aborts and the package is left half-installed",
            "dpkg merges the two files line by line",
          ],
          correctIndex: 0,
          explanation:
            "Files registered as conffiles are checksummed at install time, so a locally modified one is preserved: interactively you are prompted, non-interactively the default keeps your copy and writes the new one as `.dpkg-dist`. dpkg never merges.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-filesystem-hierarchy-q4",
          prompt: "Which statements about `/proc` are true? (Select all that apply.)",
          options: [
            "It is a virtual filesystem whose contents the kernel generates when you read them",
            "`/proc/<pid>/fd/` lists the file descriptors a process currently has open",
            "`/proc/<pid>/cwd` is a symlink to that process's working directory",
            "Its files consume disk space, so a busy machine's `/proc` should be pruned",
            "`du -sh /proc` is a reliable way to size it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "procfs is a kernel interface, not storage — nothing is on disk and most entries report size 0, which is exactly why `du` over it tells you nothing. The `fd` and `cwd` entries are among the most useful handles you have on a live process.",
        },
        {
          id: "lin-filesystem-hierarchy-q5",
          prompt: "On Ubuntu, which command tells you which installed package owns `/usr/bin/curl`?",
          options: ["`dpkg -S /usr/bin/curl`", "`apt show curl`", "`rpm -qf /usr/bin/curl`", "`which curl`"],
          correctIndex: 0,
          explanation:
            "`dpkg -S` searches the file lists of installed packages (the reverse of `dpkg -L`). `apt show` describes a package you already named, `rpm -qf` is the RPM-world equivalent, and `which` only resolves the name through `PATH`.",
        },
        {
          id: "lin-filesystem-hierarchy-q6",
          prompt: "What is the difference between `apt update` and `apt upgrade`?",
          options: [
            "`update` refreshes the local package index from the repositories; `upgrade` installs newer versions of installed packages",
            "`update` upgrades packages; `upgrade` upgrades the whole distribution release",
            "They are aliases for the same operation",
            "`update` upgrades only security packages; `upgrade` upgrades everything",
          ],
          correctIndex: 0,
          explanation:
            "`update` downloads metadata only and changes no installed software, which is why `apt install` against a stale index fails with a 404 on a version that no longer exists. Release upgrades are a separate operation.",
        },
        {
          id: "lin-filesystem-hierarchy-q7",
          prompt: "Compared with installing from the distribution's repository, what do you actually give up with `curl -fsSL https://example.com/install.sh | sudo bash`?",
          options: [
            "A record of which files were installed, signature verification against a trusted repo, dependency tracking, and a supported way to remove or upgrade it",
            "Nothing, as long as the script is served over HTTPS",
            "Only the ability to pin a version",
            "Only offline installation",
          ],
          correctIndex: 0,
          explanation:
            "HTTPS authenticates the server, not the payload's provenance over time; repository packages are signed and their file lists stay queryable forever. Piping straight into root also means the code runs before anyone has read it.",
        },
        {
          id: "lin-filesystem-hierarchy-q8",
          prompt: "A vendor ships an application as a single self-contained tree with its own bundled libraries. Per the FHS, where does it belong?",
          options: ["`/opt/<vendor-or-package>`", "`/usr/share/<package>`", "`/var/lib/<package>`", "`/etc/<package>`"],
          correctIndex: 0,
          explanation:
            "`/opt` exists precisely for add-on packages that keep their whole tree in one directory. `/usr/share` is architecture-independent data belonging to distro packages, `/var/lib` is state the program generates, and `/etc` is configuration only.",
        },
        {
          id: "lin-filesystem-hierarchy-q9",
          prompt: "Which directory does the FHS say must hold no binaries, only host-specific configuration?",
          options: ["`/etc`", "`/var`", "`/usr/share`", "`/srv`"],
          correctIndex: 0,
          explanation:
            "`/etc` is static host configuration and explicitly excludes executables, which is why a shell script dropped in `/etc` is a smell. `/srv` holds data served by the system and `/var` holds variable state.",
        },
        {
          id: "lin-filesystem-hierarchy-q10",
          prompt: "Your application writes uploads to `/var/lib/myapp/uploads` and logs to `/var/log/myapp`, on the same filesystem as the database. What is the operational risk?",
          options: [
            "Unbounded growth in either directory fills the filesystem and the database stops being able to write",
            "None — `/var` is designed to expand automatically",
            "Logs under `/var/log` are rotated automatically regardless of configuration",
            "The kernel reserves space for the database, so it is unaffected",
          ],
          correctIndex: 0,
          explanation:
            "`/var` is where everything mutable accumulates, and a full filesystem is a hard failure for anything that needs to write. Rotation only applies to logs logrotate has been configured for, and nothing rotates an uploads directory for you.",
        },
      ],
    },

    {
      id: "lin-permissions",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Permissions, Ownership and the Special Bits",
      summary:
        "Every file carries an owning user, an owning group and nine mode bits — read, write and execute for user, group and other. The rule people get wrong is that the kernel picks exactly *one* class and stops: if you are the owner, only the owner bits apply, even if you are also in the owning group and the group bits are more generous. `-r--rw-r--` owned by you is a file you cannot write.\n\nDirectories reuse the same three bits for different meanings, and that is where most \"but I have permission\" confusion comes from. Read on a directory lets you list the names in it; execute (traverse) lets you resolve a path *through* it; write lets you create and remove entries. Deleting a file therefore needs write and execute on the containing directory and nothing at all on the file — which is why `/tmp` carries the sticky bit, so that a world-writable directory doesn't let anyone delete anyone else's files.\n\nThe special bits are worth knowing because they explain otherwise mysterious behaviour. Setuid on an executable makes it run with the file owner's identity (`passwd` needs it); Linux ignores setuid on interpreted scripts and on filesystems mounted `nosuid`. Setgid on a *directory* makes new entries inherit that directory's group, which is the clean way to let a deploy user and a web server share a tree. `umask` subtracts permissions from what a program asks for — with the usual `022`, a program requesting 0666 gets 0644 — which is why freshly uploaded files come out world-readable, and why the fix for \"nginx gets 403 on my uploads\" is almost never `chmod -R 777`.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "man7: chmod(1)", url: "https://man7.org/linux/man-pages/man1/chmod.1.html", kind: "docs" },
        { label: "man7: inode(7) — file types and mode bits", url: "https://man7.org/linux/man-pages/man7/inode.7.html", kind: "docs" },
        { label: "man7: umask(2)", url: "https://man7.org/linux/man-pages/man2/umask.2.html", kind: "docs" },
        { label: "Red Hat: Linux permissions — SUID, SGID and the sticky bit", url: "https://www.redhat.com/en/blog/suid-sgid-sticky-bit", kind: "article" },
      ],
      video: {
        title: "Linux Crash Course - Understanding File & Directory Permissions",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=4e669hSjaX8",
        videoId: "4e669hSjaX8",
        durationLabel: "35:48",
      },
      alternateVideos: [
        {
          title: "Umask and Special File Permissions - Linux Tutorial 23",
          channel: "Caleb Curry",
          url: "https://www.youtube.com/watch?v=0m4lTBJJe4k",
          videoId: "0m4lTBJJe4k",
          startSeconds: 382,
          chapterLabel: "Special File Permissions",
          durationLabel: "10:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-permissions-q1",
          prompt:
            "`report.csv` is owned by `alice:devs` with mode `-r--rw-r--`. Alice is a member of `devs`. Can Alice write to the file?\n\n```bash\n$ ls -l report.csv\n-r--rw-r-- 1 alice devs 812 Sep 23 02:14 report.csv\n```",
          options: [
            "No — she is the owner, so only the owner bits apply and they are read-only",
            "Yes — she is in `devs`, and the group bits grant write",
            "Yes — the kernel takes the union of the owner and group bits",
            "Only if she opens the file with `sudo`",
          ],
          correctIndex: 0,
          explanation:
            "The kernel checks owner, then group, then other, and uses the *first* class that matches. Being the owner means the group bits are never consulted, no matter how permissive they are.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-permissions-q2",
          prompt: "A file is `-rw-r--r--` inside a directory you own with mode `drwxr-xr-x`, but the file is owned by root. Can you delete it?",
          options: [
            "Yes — deleting needs write and execute on the directory, not on the file",
            "No — you need write permission on the file itself",
            "No — only root can remove a root-owned file",
            "Only if the directory has the sticky bit set",
          ],
          correctIndex: 0,
          explanation:
            "Removing a file edits the *directory entry*, so the directory's permissions decide. The sticky bit is what would stop you: it restricts deletion in a shared directory to the file's owner.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-permissions-q3",
          prompt: "What does the execute bit mean on a directory?",
          options: [
            "Permission to traverse it — to resolve a path through it and access entries by name",
            "Permission to run the files inside it",
            "Permission to list its contents",
            "Nothing; it is ignored on directories",
          ],
          correctIndex: 0,
          explanation:
            "Execute on a directory is search permission. A directory with `r` but not `x` lets you see names via `ls` but `stat` on any of them fails; `x` without `r` lets you open a known path but not enumerate it.",
        },
        {
          id: "lin-permissions-q4",
          prompt: "With the common default `umask 022`, a program calls `open()` requesting mode `0666` and `mkdir()` requesting `0777`. What modes result?",
          options: ["File `0644`, directory `0755`", "File `0666`, directory `0777`", "File `0622`, directory `0755`", "File `0644`, directory `0777`"],
          correctIndex: 0,
          explanation:
            "The umask clears the bits it names from the requested mode: `0666 & ~022 = 0644` and `0777 & ~022 = 0755`. The umask can only remove permissions, never add them.",
        },
        {
          id: "lin-permissions-q5",
          prompt: "Which statements about the setuid bit are true? (Select all that apply.)",
          options: [
            "On an executable, it makes the process run with the file owner's effective UID",
            "Linux ignores it on interpreted scripts",
            "It has no effect on a filesystem mounted with `nosuid`",
            "On a directory, it makes new files inherit the directory's owner",
            "It lets any user edit the file",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Setuid changes identity at exec time, which is why `passwd` can write `/etc/shadow`. Linux deliberately ignores it on scripts (the race between reading the shebang and opening the file was unfixable) and on `nosuid` mounts. On directories the analogous behaviour is setgid, for the group.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-permissions-q6",
          prompt: "What does setgid on a *directory* do?",
          options: [
            "New files and subdirectories created in it inherit the directory's group",
            "New files are created owned by root",
            "Only the group owner may delete files in it",
            "Executables in it run with the directory's group",
          ],
          correctIndex: 0,
          explanation:
            "Setgid on a directory (`chmod g+s`) makes group ownership inherited rather than taken from the creating process's primary group — the standard way to let a deploy user and a web server share a tree without chowning after every write.",
        },
        {
          id: "lin-permissions-q7",
          prompt: "`/tmp` is mode `1777`. What does the leading `1` do?",
          options: [
            "It is the sticky bit: in this directory only a file's owner, the directory's owner or root may delete or rename it",
            "It makes the directory read-only for non-root users",
            "It keeps the directory's contents in memory",
            "It marks the directory as a mount point",
          ],
          correctIndex: 0,
          explanation:
            "Without it, `777` would let any user delete any other user's files, since deletion is governed by directory permissions. The historical \"keep the text segment in swap\" meaning of the bit is long gone.",
        },
        {
          id: "lin-permissions-q8",
          prompt:
            "nginx runs as `www-data` and returns 403 for files under `/var/lib/myapp/uploads`, owned `myapp:myapp` mode `0750`. Which are legitimate fixes? (Select all that apply.)",
          options: [
            "Add `www-data` to the `myapp` group and confirm every parent directory is traversable by that group",
            "Set the group on the uploads tree to a shared group and mark the directory setgid so new uploads inherit it",
            "Grant `www-data` access with a POSIX ACL (`setfacl -m u:www-data:rx`)",
            "`chmod -R 777 /var/lib/myapp`",
            "Run nginx as root so permissions stop mattering",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three of the first options grant exactly the access needed and survive new files. `777` makes every uploaded file world-writable, and running a network-facing daemon as root turns a file-read bug into a root compromise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-permissions-q9",
          prompt: "Which command sets directories to `755` and files to `644` under `./public` without making files executable?",
          options: [
            "`find ./public -type d -exec chmod 755 {} + && find ./public -type f -exec chmod 644 {} +`",
            "`chmod -R 755 ./public`",
            "`chmod -R 644 ./public`",
            "`chmod -R a+rX ./public`",
          ],
          correctIndex: 0,
          explanation:
            "`chmod -R 755` marks every file executable and `chmod -R 644` makes every directory untraversable. Splitting by type is the reliable form; `chmod -R a+rX` (capital X) is the neat shorthand for the same idea but it only adds bits, it does not normalise existing ones.",
        },
        {
          id: "lin-permissions-q10",
          prompt: "In `ls -l` output, what does the first character of `crw-rw-rw- 1 root root 1, 3 Sep 23 02:14 /dev/null` mean?",
          options: [
            "It is a character device, not a regular file",
            "It is a compressed file",
            "It is a copy-on-write file",
            "It is a file with a POSIX ACL attached",
          ],
          correctIndex: 0,
          explanation:
            "The first column is the file type: `-` regular, `d` directory, `l` symlink, `c` character device, `b` block device, `s` socket, `p` FIFO. A trailing `+` on the mode string is what indicates an ACL.",
        },
        {
          id: "lin-permissions-q11",
          prompt: "What is the practical difference between `chown app:app file` and `chgrp app file`?",
          options: [
            "`chown` with a colon sets both owner and group; `chgrp` sets only the group",
            "They are identical",
            "`chgrp` also clears the setuid bit while `chown` does not",
            "`chgrp` works without root while `chown` always needs it",
          ],
          correctIndex: 0,
          explanation:
            "Changing the *owner* of a file is a root-only operation on Linux either way. A non-root user may change a file's group only to a group they belong to, and both calls clear setuid/setgid bits on executables as a security measure.",
        },
      ],
    },

    {
      id: "lin-users-groups-sudo",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Users, Groups and sudo",
      summary:
        "To the kernel a user is a number. `alice` is a label that `/etc/passwd` maps to UID 1001, and every permission check compares integers; root is privileged because its UID is 0, not because of its name. Services run as *system* users — conventionally UID below 1000, with `/usr/sbin/nologin` as the shell and no password — so that a compromised web process is not a compromised machine.\n\nGroups come in two flavours that behave differently at exactly the wrong moment. Your primary group (the GID in `/etc/passwd`) is what new files get; supplementary groups (listed in `/etc/group`) are resolved when a session is created and copied into the process's credentials. That is why adding yourself to `docker` or to the app's group does nothing until you start a new login session — the running shell's credentials were fixed when it started. It is also why `usermod -G` without `-a` is a genuine outage: it *replaces* your supplementary groups rather than adding to them.\n\n`sudo` exists so that privilege is granted per command and logged, rather than by handing out the root password. Two behaviours catch application engineers. First, `sudo` deliberately sanitises the environment: `env_reset` drops most variables and `secure_path` replaces `PATH`, so `sudo npm run …` can fail with \"command not found\" for a binary that works fine without `sudo`. Second, membership of groups like `docker` or `lxd` is effectively root, because those daemons will happily run a container that mounts the host filesystem — a group grant that bypasses everything `sudoers` was written to control.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "man7: credentials(7) — process UIDs, GIDs and groups", url: "https://man7.org/linux/man-pages/man7/credentials.7.html", kind: "docs" },
        { label: "man7: sudoers(5)", url: "https://man7.org/linux/man-pages/man5/sudoers.5.html", kind: "docs" },
        { label: "man7: passwd(5)", url: "https://man7.org/linux/man-pages/man5/passwd.5.html", kind: "docs" },
        { label: "Sudo project: sudoers manual", url: "https://www.sudo.ws/docs/man/sudoers.man/", kind: "article" },
      ],
      video: {
        title: "Linux Crash Course - sudo",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=07JOqKOBRnU",
        videoId: "07JOqKOBRnU",
        startSeconds: 164,
        chapterLabel: "sudo overview",
        durationLabel: "26:11",
      },
      alternateVideos: [
        {
          title: "Linux Crash Course -  Managing Users",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=19WOD84JFxA",
          videoId: "19WOD84JFxA",
          startSeconds: 245,
          chapterLabel: "Understanding Users",
          durationLabel: "32:58",
        },
        {
          title: "Linux Crash Course - Managing Groups",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=GnlgAD8-GhE",
          videoId: "GnlgAD8-GhE",
          durationLabel: "23:43",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-users-groups-sudo-q1",
          prompt:
            "You run `sudo usermod -aG docker deploy` in the `deploy` user's own shell, then immediately run `docker ps`. It still fails with a permission error on the socket. Why?",
          options: [
            "Supplementary group membership is baked into a process's credentials when the session starts; the running shell still has the old set",
            "`usermod -aG` only takes effect after a reboot of the machine",
            "The `docker` group has to be re-created before membership counts",
            "`docker ps` always requires root regardless of group membership",
          ],
          correctIndex: 0,
          explanation:
            "`id` reads the files and will already show the new group, but the shell's own credentials were copied at login. Log out and back in (or use `newgrp docker` / `sg`) — nothing needs rebooting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-users-groups-sudo-q2",
          prompt: "What does `usermod -G docker deploy` do, without the `-a`?",
          options: [
            "Replaces every supplementary group the user had with just `docker`",
            "Adds `docker` to the user's supplementary groups",
            "Changes the user's primary group to `docker`",
            "Nothing — `-G` requires `-a`",
          ],
          correctIndex: 0,
          explanation:
            "`-G` sets the complete list. Without `-a` you silently drop memberships like `sudo`, `adm` or an app group, which usually surfaces as a locked-out account or a broken deploy minutes later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-users-groups-sudo-q3",
          prompt: "`node -v` works, but `sudo node -v` reports `sudo: node: command not found`. What is going on?",
          options: [
            "`sudo` replaces `PATH` with `secure_path` from `/etc/sudoers`, which does not include the directory holding `node`",
            "`node` is a shell alias, and aliases are not inherited",
            "Root is not allowed to execute binaries under `/usr/local`",
            "`sudo` requires the absolute path for every command",
          ],
          correctIndex: 0,
          explanation:
            "`env_reset` plus `secure_path` are deliberate: they stop a user's `PATH` from steering a privileged command. Use the absolute path, or `sudo env \"PATH=$PATH\" node -v` if you understand what you are relaxing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-users-groups-sudo-q4",
          prompt: "Which statements about membership of the `docker` group are true? (Select all that apply.)",
          options: [
            "It is effectively equivalent to root, because a container can bind-mount the host filesystem",
            "It lets you talk to the Docker daemon socket without `sudo`",
            "Commands run through it are not recorded in the sudo log",
            "It grants only container-level privileges, safely isolated from the host",
            "It requires a password for each `docker` command, like sudo does",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The daemon runs as root and will do what you ask it, including `-v /:/host`, so the group is a privilege escalation path with none of sudo's auditing or per-command restriction. That is the argument for rootless Docker or a sudo rule instead.",
        },
        {
          id: "lin-users-groups-sudo-q5",
          prompt: "Why edit `/etc/sudoers` with `visudo` rather than your editor directly?",
          options: [
            "`visudo` parses the file before installing it, so a syntax error can't lock everyone out of sudo",
            "`visudo` is the only program allowed to write the file",
            "`visudo` encrypts the file",
            "Direct edits are silently discarded on the next reboot",
          ],
          correctIndex: 0,
          explanation:
            "A malformed sudoers file makes sudo refuse to run at all, and on a box where you only have sudo access that is an unrecoverable mistake. `visudo -c` checks an existing file, and drop-ins under `/etc/sudoers.d/` are the tidy way to add rules.",
        },
        {
          id: "lin-users-groups-sudo-q6",
          prompt: "You rename the root account to `admin` in `/etc/passwd` but leave its UID at 0. What changes?",
          options: [
            "Nothing meaningful — privilege comes from UID 0, and the account is still fully privileged",
            "The account loses root privileges until the name is restored",
            "The kernel refuses to boot",
            "Only `sudo` stops working; everything else is unaffected",
          ],
          correctIndex: 0,
          explanation:
            "Permission checks compare UID 0, not the string \"root\". Names exist for humans, which is also why two names sharing UID 0 are two names for the same all-powerful identity.",
        },
        {
          id: "lin-users-groups-sudo-q7",
          prompt: "What does `sudo -u postgres psql` do?",
          options: [
            "Runs `psql` as the `postgres` user rather than as root",
            "Runs `psql` as root and passes `postgres` as an argument",
            "Switches your login shell to `postgres` permanently",
            "Asks the `postgres` user for their password",
          ],
          correctIndex: 0,
          explanation:
            "`-u` picks the target identity; without it the target is root. This is how you reproduce a service's behaviour as the service user without knowing (or setting) that account's password.",
        },
        {
          id: "lin-users-groups-sudo-q8",
          prompt: "Why are password hashes in `/etc/shadow` (mode `0640`, group `shadow`) rather than in `/etc/passwd`?",
          options: [
            "`/etc/passwd` must stay world-readable so that any process can map UIDs to names, which would expose the hashes to offline cracking",
            "`/etc/shadow` is encrypted at rest and `/etc/passwd` is not",
            "`/etc/passwd` has no field capable of holding a hash",
            "It is purely historical and has no security effect today",
          ],
          correctIndex: 0,
          explanation:
            "`ls -l` and anything else that prints owner names needs to read `/etc/passwd`, so it cannot be restricted. Splitting the hashes out keeps them readable only by root and the `shadow` group.",
        },
        {
          id: "lin-users-groups-sudo-q9",
          prompt: "A service account is created with `/usr/sbin/nologin` as its shell. What does that achieve?",
          options: [
            "Interactive and SSH logins as that account are refused, while services can still run under its identity",
            "The account cannot own files",
            "The account cannot be used by `sudo -u`",
            "The account is deleted automatically when the service stops",
          ],
          correctIndex: 0,
          explanation:
            "The shell is only what gets executed for a login; setting it to `nologin` removes the interactive path while `setuid()` by an init system or `sudo -u … command` still works. The identity, its files and its group memberships are unaffected.",
        },
        {
          id: "lin-users-groups-sudo-q10",
          prompt: "What is the difference between `sudo -s` and `sudo -i`?",
          options: [
            "`-i` simulates a full login as the target user (login shell, their environment, their home); `-s` starts a shell while largely keeping the current environment",
            "`-i` is interactive and `-s` is silent",
            "`-s` requires a password and `-i` does not",
            "They are aliases for the same behaviour",
          ],
          correctIndex: 0,
          explanation:
            "`-i` reads the target's profile files and starts in their home directory, which is what you want when reproducing what a service or another user sees. `-s` keeps more of your own environment, which is occasionally convenient and occasionally the reason a command behaves differently.",
        },
      ],
    },

    {
      id: "lin-processes-signals",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Processes, Signals and the Process Tree",
      summary:
        "Processes on Linux form a tree: every process but PID 1 has a parent, created by `fork()` and then usually replaced by `exec()`. When a parent dies first its children are reparented to PID 1, and when a child exits before its parent reads the status it becomes a zombie — an entry in the process table holding an exit code and nothing else. A zombie uses no memory and no CPU; thousands of them mean a parent that never calls `wait()`, and the fix is to that parent, not to the zombies.\n\nSignals are the control channel. `kill` sends SIGTERM (15) by default: a polite request the process can catch, which is how servers finish in-flight requests, flush buffers and remove their PID file. `kill -9` sends SIGKILL, which cannot be caught, blocked or ignored — the process is removed with no chance to clean up, so lock files, temp files and half-written state stay behind. That is why supervisors send TERM, wait, then KILL: systemd uses `TimeoutStopSec` (90 s by default) and `docker stop` gives 10 s before escalating.\n\nTwo behaviours look like bugs and aren't. A process in state `D` — uninterruptible sleep, usually blocked in a storage or network filesystem syscall — will not die even to SIGKILL, because signals are only delivered on the way back to user space; the cure is the I/O, not a bigger hammer. And in a container, an application started through a shell (`sh -c \"node server.js\"`) is not PID 1: the shell is, it does not forward signals, and PID 1 has no default signal dispositions, so SIGTERM is simply discarded and every deploy takes the full grace period before a SIGKILL.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "man7: signal(7) — overview of signals", url: "https://man7.org/linux/man-pages/man7/signal.7.html", kind: "docs" },
        { label: "man7: ps(1)", url: "https://man7.org/linux/man-pages/man1/ps.1.html", kind: "docs" },
        { label: "man7: proc(5) — /proc and per-process state", url: "https://man7.org/linux/man-pages/man5/proc.5.html", kind: "docs" },
        { label: "Greg's Wiki: Process Management", url: "https://mywiki.wooledge.org/ProcessManagement", kind: "article" },
      ],
      video: {
        title: "KILL Linux processes!! (also manage them) // Linux for Hackers // EP 7",
        channel: "NetworkChuck",
        url: "https://www.youtube.com/watch?v=LfC6pv8VISk",
        videoId: "LfC6pv8VISk",
        startSeconds: 143,
        chapterLabel: "recap: What is a Linux Process?",
        durationLabel: "21:51",
      },
      alternateVideos: [
        {
          title: "Linux Crash Course - The ps Command",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=wYwGNgsfN3I",
          videoId: "wYwGNgsfN3I",
          startSeconds: 503,
          chapterLabel: "Process relationship",
          durationLabel: "15:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-processes-signals-q1",
          prompt: "Which signal does plain `kill 4821` send, and what is the contract?",
          options: [
            "SIGTERM (15) — a request to terminate that the process may catch and handle",
            "SIGKILL (9) — immediate, uncatchable termination",
            "SIGHUP (1) — a request to reload configuration",
            "SIGINT (2) — the same signal Ctrl-C sends",
          ],
          correctIndex: 0,
          explanation:
            "SIGTERM is the default precisely because it is catchable: it is how a process gets to close connections and flush state. `kill -9` is the escalation when a process ignores it.",
        },
        {
          id: "lin-processes-signals-q2",
          prompt: "Which signals can a process *not* catch, block or ignore? (Select all that apply.)",
          options: ["SIGKILL", "SIGSTOP", "SIGTERM", "SIGINT", "SIGHUP"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "SIGKILL and SIGSTOP are handled entirely by the kernel, which is why they are the reliable last resort. Everything else, including SIGTERM and SIGINT, can be installed with a handler or masked out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-processes-signals-q3",
          prompt:
            "`ps` shows a process in state `D` and `kill -9` has no effect on it.\n\n```bash\n$ ps -o pid,stat,wchan:20,comm -p 9134\n  PID STAT WCHAN                COMMAND\n 9134 D    wait_on_page_bit     rsync\n```\n\nWhat is happening?",
          options: [
            "It is in uninterruptible sleep inside a syscall; signals are only delivered when it returns to user space, so it can't die until the I/O completes or fails",
            "SIGKILL was blocked by the process's signal mask",
            "The process is already a zombie and has no handler left",
            "You need to send SIGKILL twice for it to register",
          ],
          correctIndex: 0,
          explanation:
            "`D` almost always means blocked on storage or a network filesystem. The kill is recorded and takes effect the instant the syscall returns — the thing to investigate is the device or the NFS mount, not the signal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-processes-signals-q4",
          prompt: "A `ps` listing shows dozens of processes with state `Z` and `<defunct>` in the command. What resources are they consuming?",
          options: [
            "Only a process-table entry holding the exit status — no memory, no CPU",
            "Their full resident memory, until they are killed",
            "One CPU core each, spinning",
            "Their open file descriptors and network sockets, which stay bound",
          ],
          correctIndex: 0,
          explanation:
            "A zombie has already released its memory and descriptors; it is a slot waiting for the parent to call `wait()`. `kill -9` on a zombie does nothing — you fix (or restart) the parent, or let it die so init reaps the children.",
        },
        {
          id: "lin-processes-signals-q5",
          prompt:
            "A container's app takes the full 10-second grace period on every `docker stop`, then dies hard. Its Dockerfile ends with:\n\n```dockerfile\nCMD npm run start\n```\n\nWhat is the most likely cause?",
          options: [
            "The shell form makes `/bin/sh` PID 1; it does not forward SIGTERM to the app, and PID 1 has no default signal handling",
            "`docker stop` always sends SIGKILL, so a handler could never run",
            "Node.js cannot install a SIGTERM handler",
            "The grace period is fixed at 10 seconds and cannot be shortened",
          ],
          correctIndex: 0,
          explanation:
            "The shell form runs `sh -c \"npm run start\"`, so the signal reaches the shell (and npm), not your server. Use the exec form (`CMD [\"node\", \"server.js\"]`) or an init like `tini` so the process that handles SIGTERM is the one that receives it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-processes-signals-q6",
          prompt: "What problem do `nohup`, `setsid` and `disown` address?",
          options: [
            "A process being sent SIGHUP and dying when the terminal that started it goes away",
            "A process consuming too much CPU",
            "A process writing to a full disk",
            "A process being started before its dependencies are ready",
          ],
          correctIndex: 0,
          explanation:
            "Closing an SSH session hangs up the terminal, and SIGHUP goes to the foreground job. They are stopgaps, though — anything meant to outlive your session belongs in a systemd unit, not behind `nohup`.",
        },
        {
          id: "lin-processes-signals-q7",
          prompt: "You `kill` a parent process. What happens to its still-running children?",
          options: [
            "They keep running and are reparented to PID 1 (or the nearest subreaper)",
            "They are killed automatically along with the parent",
            "They become zombies immediately",
            "They are suspended until a new parent adopts them",
          ],
          correctIndex: 0,
          explanation:
            "Signals go to processes, not to subtrees. To take out a whole job, target the process *group* — `kill -TERM -- -<pgid>` — or let the supervisor do it, which is what systemd's cgroup-based `KillMode=control-group` is for.",
        },
        {
          id: "lin-processes-signals-q8",
          prompt: "What is the risk of `pkill -f myapp` on a busy server?",
          options: [
            "`-f` matches against the full command line, so it can match unrelated processes — including the shell or script that contains the string",
            "`-f` forces SIGKILL instead of SIGTERM",
            "`-f` only matches processes owned by root",
            "`-f` kills the process group rather than the process",
          ],
          correctIndex: 0,
          explanation:
            "Any `tail -f /var/log/myapp.log` or editor session with the string in its command line is a candidate, and so is the deploy script itself. Prefer a PID file, `systemctl stop`, or `pgrep -af` first to see what would match.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-processes-signals-q9",
          prompt: "A systemd service has a SIGTERM handler that drains connections for up to 5 minutes. The unit leaves `TimeoutStopSec` at the default. What happens on `systemctl restart`?",
          options: [
            "systemd sends SIGTERM, waits the default 90 seconds, then sends SIGKILL — cutting the drain short",
            "systemd waits indefinitely for the handler to finish",
            "systemd sends SIGKILL immediately because a restart was requested",
            "systemd sends SIGTERM repeatedly until the process exits",
          ],
          correctIndex: 0,
          explanation:
            "The grace period is a unit setting, not a property of your handler. If a drain genuinely needs longer, raise `TimeoutStopSec` explicitly — otherwise the deploy silently kills connections it promised to finish.",
        },
        {
          id: "lin-processes-signals-q10",
          prompt: "Why do servers like nginx use SIGUSR1 and SIGHUP rather than being restarted?",
          options: [
            "Those signals are application-defined: the daemon uses them to reopen log files or reload configuration without dropping connections",
            "They are the only signals that root may send",
            "They bypass the process's signal handlers",
            "They restart the process faster than `systemctl restart`",
          ],
          correctIndex: 0,
          explanation:
            "SIGUSR1 and SIGUSR2 carry no kernel meaning, so daemons assign their own — nginx reopens logs on USR1 (which is what logrotate's `postrotate` uses) and reloads config on HUP. The semantics are per-program; read its documentation.",
        },
        {
          id: "lin-processes-signals-q11",
          prompt: "After `kill -9` on an application that holds a lock file and a Unix socket, what state is left behind?",
          options: [
            "Its PID file, lock file and socket file remain on disk, because no cleanup code ran",
            "Nothing — the kernel deletes files a process created",
            "Only the socket remains; regular files are cleaned up",
            "The filesystem is marked dirty and needs `fsck`",
          ],
          correctIndex: 0,
          explanation:
            "SIGKILL gives no opportunity to run an exit path, so anything the program would have removed stays. The kernel *does* release file descriptors and memory, but files in the namespace are not its business.",
        },
      ],
    },

    {
      id: "lin-streams-redirection",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Standard Streams, Pipes and Redirection",
      summary:
        "Every process starts with three file descriptors already open: 0 (stdin), 1 (stdout) and 2 (stderr). The shell's job, before it execs anything, is to point those numbers wherever you asked. That is the whole idea the command line rests on — programs don't know or care whether fd 1 is a terminal, a file, a pipe or a socket, which is why arbitrary tools compose.\n\nThe operators are mechanical once you read them as \"make fd N point at this\". `> f` truncates `f` and points fd 1 at it; `>> f` appends; `2> f` does the same for fd 2; `2>&1` makes fd 2 a *duplicate of whatever fd 1 points at right now*. Order therefore matters, and gets people constantly: `cmd > f 2>&1` sends both streams to the file, while `cmd 2>&1 > f` sends stderr to the terminal (where fd 1 still pointed when the duplication happened) and only stdout to the file. A `|` connects fd 1 of the left process to fd 0 of the right one and leaves stderr alone, which is why error output sails past `grep` in a pipeline.\n\nTwo consequences bite in production. Redirection is performed by *your* shell before the command runs, so `sudo echo x > /etc/thing` fails with permission denied — the shell, not sudo, opens the file; `… | sudo tee /etc/thing` is the fix. And the C library line-buffers stdout when it is a terminal but switches to 4 KB block buffering when it is a pipe or a file, which is why an application's logs appear instantly on your screen and then seem to stop dead when you pipe them through `tee` or into a file (`stdbuf -oL`, `PYTHONUNBUFFERED=1`, or just log to stderr, which is unbuffered).",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "GNU Bash Manual: Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html", kind: "docs" },
        { label: "man7: pipe(7)", url: "https://man7.org/linux/man-pages/man7/pipe.7.html", kind: "docs" },
        { label: "Greg's Wiki: BashGuide — Input and Output", url: "https://mywiki.wooledge.org/BashGuide/InputAndOutput", kind: "article" },
        { label: "man7: tee(1)", url: "https://man7.org/linux/man-pages/man1/tee.1.html", kind: "docs" },
      ],
      video: {
        title: "Linux Crash Course - Data Streams (stdin, stdout & stderr)",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=zMKacHGuIHI",
        videoId: "zMKacHGuIHI",
        startSeconds: 77,
        chapterLabel: "The three data streams (standard input, standard output, and standard error)",
        durationLabel: "17:12",
      },
      alternateVideos: [
        {
          title: "The Complete Bash Scripting Course - Full Length Guide to learning the Bash Shell",
          channel: "You Suck at Programming",
          url: "https://www.youtube.com/watch?v=Sx9zG7wa4FA",
          videoId: "Sx9zG7wa4FA",
          startSeconds: 6130,
          chapterLabel: "03-05 Input / Output",
          durationLabel: "7:21:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-streams-redirection-q1",
          prompt:
            "Where does each stream end up?\n\n```bash\nmycmd 2>&1 > out.log\n```",
          options: [
            "stdout goes to `out.log`; stderr goes to the terminal",
            "Both go to `out.log`",
            "stderr goes to `out.log`; stdout goes to the terminal",
            "Both go to the terminal and `out.log` is left empty",
          ],
          correctIndex: 0,
          explanation:
            "Redirections are applied left to right. `2>&1` copies fd 1 *as it is then* — still the terminal — so stderr stays there; only the later `> out.log` moves stdout. The both-to-file form is `mycmd > out.log 2>&1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-streams-redirection-q2",
          prompt: "What does `> report.txt` do to an existing `report.txt` before the command even starts?",
          options: [
            "Truncates it to zero length",
            "Appends to it",
            "Renames it to `report.txt.bak`",
            "Refuses to run and prints an error",
          ],
          correctIndex: 0,
          explanation:
            "The shell opens the target with `O_TRUNC`, so the old contents are gone even if the command then fails. `>>` appends, and `set -o noclobber` makes `>` refuse to overwrite (with `>|` as the explicit override).",
        },
        {
          id: "lin-streams-redirection-q3",
          prompt:
            "What does this print in bash?\n\n```bash\necho hello | read x\necho \"[$x]\"\n```",
          options: ["`[]`", "`[hello]`", "`[hello ]`", "It hangs waiting for input"],
          correctIndex: 0,
          explanation:
            "Each stage of a pipeline runs in its own subshell, so `read` assigns `x` in a child that exits immediately. Use `read x <<< \"$(echo hello)\"`, a here-string, or `shopt -s lastpipe` if you need the assignment to survive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-streams-redirection-q4",
          prompt: "Which of these send **both** stdout and stderr to `log.txt`? (Select all that apply.)",
          options: [
            "`cmd > log.txt 2>&1`",
            "`cmd &> log.txt`",
            "`cmd 2>&1 > log.txt`",
            "`cmd | tee log.txt`",
            "`cmd > log.txt 2> log.txt`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`&>` is bash shorthand for the first form. `2>&1 > log.txt` has the wrong order, `tee` only ever sees stdout, and opening the same file twice gives two independent descriptors with independent offsets that overwrite each other's output.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-streams-redirection-q5",
          prompt: "`find / -name foo 2>/dev/null` — what does the redirection accomplish?",
          options: [
            "It discards the \"Permission denied\" messages, which go to stderr, while keeping the results on stdout",
            "It discards the results and keeps only the errors",
            "It speeds up `find` by skipping unreadable directories",
            "It suppresses all output from the command",
          ],
          correctIndex: 0,
          explanation:
            "Diagnostics go to fd 2 by convention precisely so they can be separated from data on fd 1. Note it only silences the noise — `find` still tries and fails to descend into those directories.",
        },
        {
          id: "lin-streams-redirection-q6",
          prompt:
            "Your service prints a log line per request. Run in the foreground you see them immediately; run as `myapp | tee app.log` output appears in large bursts, minutes late. Why?",
          options: [
            "The C library line-buffers stdout when it is a terminal and switches to block buffering when it is a pipe",
            "`tee` batches writes on purpose to reduce disk I/O",
            "The kernel throttles pipes to a fixed number of writes per second",
            "The log lines are being reordered by the pipe",
          ],
          correctIndex: 0,
          explanation:
            "`isatty()` decides the buffering mode at startup, so the same binary behaves differently in a pipeline. `stdbuf -oL myapp | tee app.log`, an app-level flush, or logging to stderr all restore prompt output.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-streams-redirection-q7",
          prompt:
            "What is the difference between these two here-documents?\n\n```bash\ncat <<EOF\nHome is $HOME\nEOF\n\ncat <<'EOF'\nHome is $HOME\nEOF\n```",
          options: [
            "The first expands `$HOME`; quoting the delimiter in the second makes the body completely literal",
            "The second expands variables and the first does not",
            "The second strips leading tabs",
            "There is no difference; the quotes are decorative",
          ],
          correctIndex: 0,
          explanation:
            "An unquoted delimiter means the body goes through parameter, command and arithmetic expansion — a real hazard when generating config files or scripts. `<<-EOF` is the variant that strips leading tabs.",
        },
        {
          id: "lin-streams-redirection-q8",
          prompt: "In `myapp | grep ERROR`, why do some error messages still reach your terminal instead of being filtered?",
          options: [
            "A pipe connects stdout only; stderr is untouched and goes straight to the terminal",
            "`grep` passes through anything it cannot parse",
            "The pipe buffer overflowed and spilled to the terminal",
            "`grep` writes non-matching lines to stderr",
          ],
          correctIndex: 0,
          explanation:
            "To filter diagnostics too, merge first: `myapp 2>&1 | grep ERROR` (or bash's `myapp |& grep ERROR`). Keeping them separate is usually what you want, which is the point of two descriptors.",
        },
        {
          id: "lin-streams-redirection-q9",
          prompt: "Why does `sudo echo 'net.core.somaxconn=1024' > /etc/sysctl.d/99-tuning.conf` fail with \"Permission denied\"?",
          options: [
            "Your shell performs the redirection, as your user, before `sudo` ever runs",
            "`echo` cannot write to files in `/etc`",
            "`sudo` refuses to run builtins like `echo`",
            "`/etc/sysctl.d` is read-only even to root",
          ],
          correctIndex: 0,
          explanation:
            "Only the command after `sudo` is privileged; the `>` was already evaluated by your unprivileged shell. Use `echo … | sudo tee /etc/sysctl.d/99-tuning.conf` or `sudo sh -c 'echo … > …'`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-streams-redirection-q10",
          prompt: "What does `tee` do, and when is `tee -a` the right choice?",
          options: [
            "It copies stdin to stdout *and* to the named files; `-a` appends instead of truncating them",
            "It duplicates stderr into stdout",
            "It splits stdin evenly across several commands",
            "It buffers output until the command exits",
          ],
          correctIndex: 0,
          explanation:
            "`tee` is how you watch output live while also recording it, and how you write to a privileged path via `sudo`. Without `-a` it truncates, which quietly wipes a log you meant to extend.",
        },
        {
          id: "lin-streams-redirection-q11",
          prompt: "What does `diff <(sort a.txt) <(sort b.txt)` rely on?",
          options: [
            "Process substitution: each `<(...)` runs a command and hands `diff` a file-like path (a `/dev/fd/N` descriptor) to read",
            "Bash writing both outputs to temporary files in `/tmp` and deleting them afterwards",
            "`diff` accepting commands instead of filenames",
            "A pipe, which `diff` reads twice",
          ],
          correctIndex: 0,
          explanation:
            "Process substitution gives you a readable path backed by a pipe, so tools that insist on filenames can consume command output — and it lets a command take two streams, which a single `|` cannot.",
        },
      ],
    },

    {
      id: "lin-text-toolkit",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "The Text Toolkit: grep, sed, awk, cut, sort, uniq",
      summary:
        "These are not six commands to memorise but one composable model: line-oriented filters that read stdin and write stdout, so they can be chained into an answer. `grep` selects lines, `cut` and `awk` select fields, `sed` edits, `sort` orders, `uniq` collapses adjacent duplicates. The canonical incident-response one-liner — `awk '{print $1}' access.log | sort | uniq -c | sort -rn | head` — is nothing more than those pieces in the right order, and it will answer \"who is hammering us\" faster than any dashboard you can load at 2am.\n\nKnowing which tool to reach for saves you from the classic failures. `cut -d' '` treats *every single space* as a delimiter, so it falls apart on column-aligned output like `ps` or `df`; `awk` splits on runs of whitespace by default and is what you want there. `uniq` only collapses *adjacent* duplicates, so it is useless without a preceding `sort` (or `sort -u`, which does both). `sort` compares lexicographically unless you pass `-n`, so `10` sorts before `9`. And `sed -i` edits in place, but GNU and BSD/macOS disagree about whether `-i` takes a mandatory suffix argument — a script that works on your Mac can corrupt files on the server.\n\nThe operational gotcha that bridges into scripting: `grep` exits 1 when it matches nothing, which is a *successful* search with no results but looks like failure to `set -e` and to CI. Wrap it (`grep … || true`) when \"no matches\" is a legitimate outcome, and use `grep -q` when you only care about the answer, since it stops reading at the first match.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "man7: grep(1)", url: "https://man7.org/linux/man-pages/man1/grep.1.html", kind: "docs" },
        { label: "GNU Awk User's Guide", url: "https://www.gnu.org/software/gawk/manual/gawk.html", kind: "docs" },
        { label: "man7: sed(1)", url: "https://man7.org/linux/man-pages/man1/sed.1.html", kind: "docs" },
        { label: "explainshell: break a command line down flag by flag", url: "https://explainshell.com/", kind: "article" },
      ],
      video: {
        title: "Linux Crash Course - The grep Command",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=Tc_jntovCM0",
        videoId: "Tc_jntovCM0",
        startSeconds: 118,
        chapterLabel: "What is \"grep\"?",
        durationLabel: "14:57",
      },
      alternateVideos: [
        {
          title: "Linux Crash Course - awk",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=oPEnvuj9QrI",
          videoId: "oPEnvuj9QrI",
          startSeconds: 129,
          chapterLabel: "How awk works",
          durationLabel: "16:07",
        },
        {
          title: "Linux Crash Course - The sed Command",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=nXLnx8ncZyE",
          videoId: "nXLnx8ncZyE",
          startSeconds: 84,
          chapterLabel: "What is the sed command",
          durationLabel: "15:25",
        },
        {
          title: "The Complete Bash Scripting Course - Full Length Guide to learning the Bash Shell",
          channel: "You Suck at Programming",
          url: "https://www.youtube.com/watch?v=Sx9zG7wa4FA",
          videoId: "Sx9zG7wa4FA",
          startSeconds: 11624,
          chapterLabel: "05-00 cut and tr",
          durationLabel: "7:21:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-text-toolkit-q1",
          prompt:
            "What does this print?\n\n```bash\nprintf 'b\\na\\nb\\nc\\nb\\n' | sort | uniq -c | sort -rn | head -1\n```",
          options: ["`      3 b`", "`      1 a`", "`      3 c`", "`      5 b`"],
          correctIndex: 0,
          explanation:
            "`sort` groups equal lines, `uniq -c` prefixes each group with its count, `sort -rn` orders by that count descending. This is the top-N idiom; `b` occurs three times.",
        },
        {
          id: "lin-text-toolkit-q2",
          prompt:
            "How many lines does this print?\n\n```bash\nprintf 'a\\nb\\na\\n' | uniq | wc -l\n```",
          options: ["`3`", "`2`", "`1`", "`0`"],
          correctIndex: 0,
          explanation:
            "`uniq` only collapses *adjacent* duplicate lines, and the two `a` lines are not adjacent. Sort first (`sort | uniq`) or use `sort -u`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-text-toolkit-q3",
          prompt:
            "What is the output order?\n\n```bash\nprintf '10\\n9\\n100\\n' | sort\n```",
          options: ["`10`, `100`, `9`", "`9`, `10`, `100`", "`100`, `10`, `9`", "`9`, `100`, `10`"],
          correctIndex: 0,
          explanation:
            "`sort` compares strings by default, so `1` sorts before `9`. `sort -n` treats the lines as numbers; `sort -h` handles `1K`/`2M` suffixes, which is what you want on `du -h` output.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-text-toolkit-q4",
          prompt: "Why does `ps aux | cut -d' ' -f2` usually fail to print the PID column while `ps aux | awk '{print $2}'` works?",
          options: [
            "`cut` treats each single space as a delimiter, so runs of padding spaces create empty fields; `awk` splits on runs of whitespace by default",
            "`cut` cannot read from a pipe",
            "`awk` re-sorts the columns before printing",
            "`ps` writes columns to stderr, which `cut` does not see",
          ],
          correctIndex: 0,
          explanation:
            "Column-aligned output is padded, so field 2 by single-space counting is usually empty. `cut` is the right tool for a real delimiter like `/etc/passwd`'s colon; `awk` is the right tool for whitespace-aligned tables.",
        },
        {
          id: "lin-text-toolkit-q5",
          prompt: "Which statements about `grep` are true? (Select all that apply.)",
          options: [
            "It exits 1 when no line matched and 2 on an error such as an unreadable file",
            "`grep -q` stops at the first match and prints nothing",
            "`grep -F` treats the pattern as a fixed string, so regex metacharacters are literal",
            "`grep -c` prints the matching lines as well as the count",
            "`grep -v` shows only the matching lines",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Exit 1 for \"no matches\" is what makes `grep` usable in an `if`, and what breaks scripts running under `set -e`. `-c` prints only a count and `-v` *inverts* the match.",
        },
        {
          id: "lin-text-toolkit-q6",
          prompt:
            "A line reads `host=a host=b host=c`. What does this produce?\n\n```bash\nsed 's/host/node/' line.txt\n```",
          options: [
            "`node=a host=b host=c`",
            "`node=a node=b node=c`",
            "`host=a host=b host=c`",
            "An error, because no `g` flag was given",
          ],
          correctIndex: 0,
          explanation:
            "`s///` replaces the first match per line; `s///g` replaces all of them. `s///2` replaces just the second, and `s///gi` adds case-insensitivity.",
        },
        {
          id: "lin-text-toolkit-q7",
          prompt:
            "What does this print?\n\n```bash\necho 'alice:x:1001:1001::/home/alice:/bin/bash' | cut -d: -f1,7\n```",
          options: ["`alice:/bin/bash`", "`alice /bin/bash`", "`alice`", "`x:/bin/bash`"],
          correctIndex: 0,
          explanation:
            "`cut` keeps the input delimiter between the selected fields unless `--output-delimiter` says otherwise, and it always emits fields in file order regardless of how you list them.",
        },
        {
          id: "lin-text-toolkit-q8",
          prompt:
            "Why the `+0` here?\n\n```bash\nawk '$9 == 500 { c++ } END { print c+0 }' access.log\n```",
          options: [
            "If no line matched, `c` was never assigned and prints as an empty string; adding 0 forces a numeric `0`",
            "It converts the count from octal to decimal",
            "It skips the header line",
            "It is required syntax for `END` blocks",
          ],
          correctIndex: 0,
          explanation:
            "Awk variables are uninitialised until used and coerce to \"\" in string context. `c+0` (or `printf \"%d\"`) makes the empty case print `0`, which matters when the output feeds a monitoring check.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-text-toolkit-q9",
          prompt: "You want lines containing the literal text `1.2.3.4` and nothing that merely resembles it. Which is correct?",
          options: [
            "`grep -F '1.2.3.4' access.log`",
            "`grep '1.2.3.4' access.log`",
            "`grep -E '1.2.3.4' access.log`",
            "`grep -i '1.2.3.4' access.log`",
          ],
          correctIndex: 0,
          explanation:
            "Unescaped `.` is \"any character\", so a plain `grep` also matches `192.3.4` inside a longer string. `-F` disables regex entirely (and is faster); the alternative is escaping every dot.",
        },
        {
          id: "lin-text-toolkit-q10",
          prompt: "A colleague's `sed -i 's/old/new/' config.yml` works on their Mac but the CI runner rewrites files wrongly with `sed -i 's/old/new/'` too. What is the portability trap?",
          options: [
            "BSD/macOS `sed -i` requires a backup-suffix argument (even an empty one), while GNU `sed -i` treats the next word as the suffix if you supply one",
            "GNU `sed` cannot edit in place at all",
            "macOS `sed` does not support the `s` command",
            "`-i` is silently ignored on Linux",
          ],
          correctIndex: 0,
          explanation:
            "`sed -i '' 's/…/…/' f` is the BSD form and `sed -i 's/…/…/' f` is the GNU form; each misreads the other's arguments. Write a temp file and `mv` it, or standardise on one platform in scripts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-text-toolkit-q11",
          prompt: "What does `awk -F: '$3 >= 1000 { print $1 }' /etc/passwd` list?",
          options: [
            "The names of accounts whose UID is 1000 or higher — conventionally the human users",
            "Every account in the file",
            "Accounts with at least 1000 bytes in their record",
            "Accounts whose primary group ID is 1000 or higher",
          ],
          correctIndex: 0,
          explanation:
            "`-F:` sets the field separator, field 3 is the UID and field 1 the name. Sub-1000 UIDs are the system accounts services run as; the exact boundary is a distro convention, set in `/etc/login.defs`.",
        },
      ],
    },

    {
      id: "lin-find-xargs",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Finding Things: find, locate and xargs",
      summary:
        "`find` is not a search command with flags; it is a tiny expression language. You give it a starting directory and an expression of *tests* (`-name`, `-type`, `-mtime`, `-size`, `-user`, `-perm`), *operators* (implicit and, `-o`, `!`, escaped parentheses) and *actions* (`-print`, `-delete`, `-exec`), and it evaluates that expression against every entry it walks. Once you read it that way, `find /var/log -type f -name '*.gz' -mtime +30 -delete` stops being an incantation.\n\nThe traps are consistent. `-name` takes a glob that `find` matches against the basename, so it must be quoted — unquoted, your shell expands it against the *current* directory first and `find` gets something else entirely. `-mtime +7` means strictly more than seven 24-hour periods, with fractions discarded, so it excludes files between 7 and 8 days old; `-mmin` is the honest choice for anything under a day. And `-exec cmd {} \\;` forks once per file while `-exec cmd {} +` batches arguments like `xargs` does, which is the difference between minutes and seconds across a large tree.\n\n`locate` answers instantly because it doesn't walk anything: it queries a database rebuilt periodically by a timer or cron job. That makes it perfect for \"where does this distro put that config\" and useless at 2am, because it will not know about the file you created five minutes ago and will happily list files you deleted yesterday. When piping into `xargs`, remember it splits on whitespace by default — so filenames with spaces break it — and that GNU `xargs` runs the command *once even with empty input* unless you pass `-r`. `find … -print0 | xargs -0 -r` is the form that survives real filenames.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "man7: find(1)", url: "https://man7.org/linux/man-pages/man1/find.1.html", kind: "docs" },
        { label: "man7: xargs(1)", url: "https://man7.org/linux/man-pages/man1/xargs.1.html", kind: "docs" },
        { label: "Greg's Wiki: UsingFind", url: "https://mywiki.wooledge.org/UsingFind", kind: "article" },
        { label: "man7: locate(1)", url: "https://man7.org/linux/man-pages/man1/locate.1.html", kind: "docs" },
      ],
      video: {
        title: "Linux Crash Course - The find command",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=skTiK_6DdqU",
        videoId: "skTiK_6DdqU",
        durationLabel: "25:56",
      },
      alternateVideos: [
        {
          title: "Xargs Should Be In Your Command Line Toolbag",
          channel: "DistroTube",
          url: "https://www.youtube.com/watch?v=rp7jLi_kgPg",
          videoId: "rp7jLi_kgPg",
          durationLabel: "16:24",
        },
        {
          title: "Quickly Find Any File in Linux with the locate Command",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=xg9GcuxeRwk",
          videoId: "xg9GcuxeRwk",
          durationLabel: "10:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-find-xargs-q1",
          prompt:
            "You run this in a directory that contains exactly one file, `app.log`:\n\n```bash\nfind . -name *.log\n```\n\nWhat does `find` actually receive?",
          options: [
            "`find . -name app.log` — the shell expanded the glob before `find` ran, so only that one name is searched for",
            "`find . -name *.log` — `find` does its own globbing, so the shell leaves it alone",
            "An error, because `-name` requires quotes",
            "`find . -name ''` — the glob expands to nothing",
          ],
          correctIndex: 0,
          explanation:
            "The shell expands unquoted globs against the current directory first. With two matching files you would instead get a syntax error (`paths must precede expression`), which at least tells you something is wrong — the single-match case fails silently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-find-xargs-q2",
          prompt: "What exactly does `-mtime +7` select?",
          options: [
            "Files whose modification time is more than 7 full 24-hour periods ago — effectively 8 days or older",
            "Files modified in the last 7 days",
            "Files modified exactly 7 days ago",
            "Files modified more than 7 calendar days ago, aligned to midnight",
          ],
          correctIndex: 0,
          explanation:
            "`find` divides the age by 24 hours and discards the fraction, so `+7` means the quotient is at least 8. Nothing is aligned to midnight; for sub-day precision use `-mmin`, and for \"newer than this file\" use `-newer`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-find-xargs-q3",
          prompt: "Which commands safely delete every `.tmp` file under the current tree, including files whose names contain spaces? (Select all that apply.)",
          options: [
            "`find . -name '*.tmp' -delete`",
            "`find . -name '*.tmp' -exec rm -- {} +`",
            "`find . -name '*.tmp' -print0 | xargs -0 -r rm --`",
            "`rm $(find . -name '*.tmp')`",
            "`find . -name '*.tmp' | xargs rm`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`-delete` and `-exec … +` pass names as arguments with no re-parsing, and `-print0`/`-0` uses NUL as the separator. The last two split on whitespace, so `my file.tmp` becomes two arguments — and command substitution also glob-expands the result.",
        },
        {
          id: "lin-find-xargs-q4",
          prompt: "What is the difference between `-exec cmd {} \\;` and `-exec cmd {} +`?",
          options: [
            "`\\;` runs the command once per file; `+` batches as many paths as fit onto one command line",
            "`+` runs the command in the background",
            "`\\;` passes the path on stdin; `+` passes it as an argument",
            "`+` only works with `-type f`",
          ],
          correctIndex: 0,
          explanation:
            "On a tree of 50,000 files that is 50,000 forks versus a handful, which is usually the whole difference in runtime. Use `\\;` when the command genuinely takes one path at a time (for example `mv {} {}.bak`).",
        },
        {
          id: "lin-find-xargs-q5",
          prompt: "You create `/var/log/myapp/debug.log`, then `locate debug.log` finds nothing. Why?",
          options: [
            "`locate` queries a database rebuilt on a schedule by `updatedb`, so it is always as stale as the last run",
            "`locate` only indexes files under `/home`",
            "`locate` skips files smaller than 4 KB",
            "`locate` needs root privileges to see files under `/var`",
          ],
          correctIndex: 0,
          explanation:
            "That is also why `locate` can list files that no longer exist (`locate -e` filters those out). It is excellent for \"where does this distro keep X\" and wrong for anything about the last few minutes — use `find` for live questions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-find-xargs-q6",
          prompt: "Which command lists regular files over 100 MB under `/var/log`?",
          options: [
            "`find /var/log -type f -size +100M`",
            "`find /var/log -size +100M -type d`",
            "`find /var/log -type f -size 100M`",
            "`find /var/log -type f -size +100`",
          ],
          correctIndex: 0,
          explanation:
            "`+` means \"greater than\" and `M` means mebibytes. Bare `-size 100M` matches files that round to exactly 100 MiB, and `-size +100` with no suffix means 512-byte blocks — a factor-of-2048 mistake.",
        },
        {
          id: "lin-find-xargs-q7",
          prompt:
            "What does this match?\n\n```bash\nfind . \\( -name '*.js' -o -name '*.ts' \\) -type f -newermt '-1 hour'\n```",
          options: [
            "Regular files ending in `.js` or `.ts` that were modified within the last hour",
            "Every `.js` file, plus `.ts` files modified within the last hour",
            "Directories named `*.js` or `*.ts`",
            "Nothing, because `-o` cannot be combined with `-type`",
          ],
          correctIndex: 0,
          explanation:
            "Tests are joined by an implicit `and`, which binds tighter than `-o`, so the parentheses are what keep the alternation from swallowing the rest. Drop them and `-type f -newermt` applies only to the `.ts` branch.",
        },
        {
          id: "lin-find-xargs-q8",
          prompt:
            "There are no matching files. What does GNU `xargs` do here?\n\n```bash\nfind . -name '*.nomatch' | xargs ls -l\n```",
          options: [
            "Runs `ls -l` once with no arguments, listing the current directory",
            "Runs nothing at all",
            "Exits with status 1 and prints an error",
            "Waits on stdin until interrupted",
          ],
          correctIndex: 0,
          explanation:
            "GNU `xargs` runs the command once even with empty input unless you pass `-r`/`--no-run-if-empty`. Harmless with `ls`, considerably less so with a command that has destructive defaults.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-find-xargs-q9",
          prompt: "How do you stop `find` from descending into `node_modules`?",
          options: [
            "`find . -name node_modules -prune -o -type f -print`",
            "`find . -type f ! -name node_modules -print`",
            "`find . -type f -print | grep -v node_modules`",
            "`find . --exclude node_modules -type f -print`",
          ],
          correctIndex: 0,
          explanation:
            "`-prune` tells `find` not to descend into a matched directory, which is the only option that avoids the traversal cost; the `-o … -print` is needed because `-prune` itself is true and would otherwise print the directory. Filtering with `grep` still walks everything, and `--exclude` is not a `find` option.",
        },
        {
          id: "lin-find-xargs-q10",
          prompt: "What does `-P 4 -n 1` do in `find . -name '*.png' -print0 | xargs -0 -P 4 -n 1 optipng`?",
          options: [
            "Runs up to 4 `optipng` processes concurrently, each given exactly one filename",
            "Retries each file up to 4 times, 1 second apart",
            "Passes 4 filenames per invocation, one process at a time",
            "Limits `optipng` to 4% CPU and 1 thread",
          ],
          correctIndex: 0,
          explanation:
            "`-P` is xargs' parallelism and `-n` the number of arguments per invocation — the cheapest way to use several cores from a shell. Note that parallel processes interleave their output, so redirect per job if you need readable logs.",
        },
      ],
    },

    {
      id: "lin-shell-scripting",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Shell Scripting: Variables, Quoting and Control Flow",
      summary:
        "Shell scripts are glue, and the shell's data model is deliberately thin: everything is a string, and the interesting behaviour lives in *expansion*. When you write `$var` unquoted, bash substitutes its value and then performs word splitting on the characters in `IFS` and pathname expansion on the result. `rm $file` with `file=\"my report.pdf\"` therefore tries to remove two files. This one rule, and its fix — quote every expansion unless you have a specific reason not to — accounts for more broken deploy scripts than any other single cause.\n\nThe rest follows from taking that seriously. `\"$@\"` preserves argument boundaries where `$*` and `\"$*\"` flatten them. `[[ … ]]` is a bash keyword that doesn't word-split its operands, so `[[ $x = \"\" ]]` is safe where `[ $x = \"\" ]` becomes a syntax error when `x` is empty; `[[ ]]` also gives you `=~` and `&&`. Arrays (`\"${files[@]}\"`) exist precisely so a list of paths survives spaces, and command substitution `$(…)` nests and is readable where backticks are neither. Functions don't return values — they return an exit status of 0–255 — so a function that produces data echoes it and the caller captures it.\n\nTwo portability notes that turn into incidents. On Debian and Ubuntu `/bin/sh` is dash, not bash, so a `#!/bin/sh` script using arrays, `[[`, `local` or `$'…'` breaks only on the server. And iterating over command output (`for f in $(ls)`) re-splits and re-globs the names; iterate over a glob (`for f in *.log`) or read NUL-delimited input. Run ShellCheck: it catches almost every issue in this topic before a human does.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "GNU Bash Manual: Quoting", url: "https://www.gnu.org/software/bash/manual/html_node/Quoting.html", kind: "docs" },
        { label: "Greg's Wiki: Quotes", url: "https://mywiki.wooledge.org/Quotes", kind: "article" },
        { label: "Greg's Wiki: BashPitfalls", url: "https://mywiki.wooledge.org/BashPitfalls", kind: "article" },
        { label: "ShellCheck wiki: SC2086 — double quote to prevent globbing and word splitting", url: "https://github.com/koalaman/shellcheck/wiki/SC2086", kind: "repo" },
      ],
      video: {
        title: "The Complete Bash Scripting Course - Full Length Guide to learning the Bash Shell",
        channel: "You Suck at Programming",
        url: "https://www.youtube.com/watch?v=Sx9zG7wa4FA",
        videoId: "Sx9zG7wa4FA",
        startSeconds: 4195,
        chapterLabel: "03-00 Finally Scripting",
        durationLabel: "7:21:53",
      },
      alternateVideos: [
        {
          title: "bash quoting is really not that difficult!  (beginner - intermediate) anthony explains #426",
          channel: "anthonywritescode",
          url: "https://www.youtube.com/watch?v=VIUoHnFwEH4",
          videoId: "VIUoHnFwEH4",
          startSeconds: 30,
          chapterLabel: "Types of quotes",
          durationLabel: "8:04",
        },
        {
          title: "How To Write Bash Scripts In Linux - Complete Guide (Part 3 - Variables)",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=uQE_4Q-HZZw",
          videoId: "uQE_4Q-HZZw",
          startSeconds: 105,
          chapterLabel: "How to reference a variable in Bash",
          durationLabel: "24:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-shell-scripting-q1",
          prompt:
            "What does the shell actually try to do?\n\n```bash\nf='quarterly report.pdf'\nrm $f\n```",
          options: [
            "Remove two files, `quarterly` and `report.pdf`",
            "Remove one file called `quarterly report.pdf`",
            "Fail with a syntax error",
            "Remove every file in the directory",
          ],
          correctIndex: 0,
          explanation:
            "Unquoted expansion is followed by word splitting on `IFS`, so the value becomes two arguments. `rm \"$f\"` passes exactly one. This is the single most common shell bug in deploy scripts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-shell-scripting-q2",
          prompt:
            "How many lines does each loop print?\n\n```bash\nfiles=(a.txt 'b c.txt')\nfor f in \"${files[@]}\"; do echo \"$f\"; done\nfor f in ${files[*]};  do echo \"$f\"; done\n```",
          options: [
            "2 then 3",
            "2 then 2",
            "3 then 3",
            "1 then 2",
          ],
          correctIndex: 0,
          explanation:
            "`\"${arr[@]}\"` expands to one word per element, preserving `b c.txt`. Unquoted `${arr[*]}` joins with a space and is then word-split, turning that element into two.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-shell-scripting-q3",
          prompt:
            "`x` is unset. What happens?\n\n```bash\nif [ $x = \"\" ]; then echo empty; fi\n```",
          options: [
            "bash prints `[: =: unary operator expected` because the test sees only two words",
            "It prints `empty`",
            "It prints nothing and succeeds silently",
            "bash refuses to parse the script at all",
          ],
          correctIndex: 0,
          explanation:
            "`[` is an ordinary command; the unquoted empty expansion disappears entirely, so it receives `= \"\" ]`. `[ \"$x\" = \"\" ]` or `[[ $x = \"\" ]]` both work — inside `[[ ]]` no word splitting happens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-shell-scripting-q4",
          prompt: "Which statements about `[[ … ]]` versus `[ … ]` in bash are true? (Select all that apply.)",
          options: [
            "`[[` is a shell keyword, so unquoted expansions inside it are not word-split or glob-expanded",
            "`=~` regex matching is only available in `[[ … ]]`",
            "`&&` and `||` can be used directly inside `[[ … ]]`",
            "`[[ … ]]` is specified by POSIX and works in dash",
            "`[ … ]` is a bash keyword with no external equivalent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`[[` is a bash (and ksh/zsh) extension with friendlier parsing. `[` is a builtin that also exists as `/usr/bin/[`, and it is the POSIX-portable one — which is exactly why it has the sharper edges.",
        },
        {
          id: "lin-shell-scripting-q5",
          prompt: "A script starting `#!/bin/sh` works on your machine and fails on an Ubuntu server with `Syntax error: \"(\" unexpected`. Why?",
          options: [
            "On Debian and Ubuntu `/bin/sh` is dash, which has no arrays, `[[`, `local` or `$'…'`",
            "Ubuntu ships an older bash that lacks arrays",
            "The script has Windows line endings",
            "`/bin/sh` on Ubuntu requires an absolute path for every command",
          ],
          correctIndex: 0,
          explanation:
            "`/bin/sh` is a POSIX shell, not a promise of bash; Debian points it at dash for boot speed. If you use bash features, say `#!/usr/bin/env bash` — and ShellCheck will flag bashisms under a `sh` shebang for you.",
        },
        {
          id: "lin-shell-scripting-q6",
          prompt:
            "The script is called as `./run.sh alpha 'two words'`. What does each line print?\n\n```bash\nprintf '%s\\n' \"$@\"\nprintf '%s\\n' \"$*\"\n```",
          options: [
            "First: two lines, `alpha` and `two words`. Second: one line, `alpha two words`",
            "Both print two lines",
            "Both print one line",
            "First prints three lines, second prints one",
          ],
          correctIndex: 0,
          explanation:
            "`\"$@\"` expands to one quoted word per positional parameter — the only correct way to forward arguments. `\"$*\"` joins them into a single string using the first character of `IFS`.",
        },
        {
          id: "lin-shell-scripting-q7",
          prompt: "What does command substitution do to trailing newlines in `v=$(cat version.txt)`?",
          options: [
            "It strips all trailing newlines from the captured output",
            "It preserves the output byte for byte",
            "It converts them to spaces",
            "It fails if the file does not end with a newline",
          ],
          correctIndex: 0,
          explanation:
            "Stripping trailing newlines is almost always what you want for a value like a version string, and occasionally exactly what you don't — capturing binary or whitespace-significant output needs a different approach (for example appending a sentinel character and removing it).",
        },
        {
          id: "lin-shell-scripting-q8",
          prompt: "Why is `for f in $(ls *.log)` a bug, and what should replace it?",
          options: [
            "Command substitution re-splits and re-globs the names; use `for f in *.log` and quote `\"$f\"`",
            "`ls` is slower than a glob; the behaviour is otherwise identical",
            "`ls` sorts differently from a glob, which changes the order",
            "There is no bug; it is the idiomatic form",
          ],
          correctIndex: 0,
          explanation:
            "A name with a space becomes two iterations, and a name containing `*` or `?` can be glob-expanded a second time. A glob expands directly to correct words — and when it matches nothing it yields the literal pattern, which is what `shopt -s nullglob` exists for.",
        },
        {
          id: "lin-shell-scripting-q9",
          prompt: "How does a shell function \"return\" a computed value to its caller?",
          options: [
            "It writes the value to stdout and the caller captures it with `$(…)`; `return` only sets an exit status of 0–255",
            "`return` can return any string, which the caller reads from `$?`",
            "It assigns to a global variable; there is no other mechanism",
            "It uses `exit`, which passes the value up one level",
          ],
          correctIndex: 0,
          explanation:
            "`return 300` wraps to 44, because the status is a single byte. Echo the data and let the caller decide, or (in bash) write into a variable whose name the caller passed in via `printf -v`.",
        },
        {
          id: "lin-shell-scripting-q10",
          prompt: "What is the difference between `${PORT:-8080}` and `${PORT:=8080}`?",
          options: [
            "`:-` substitutes the default for this expansion only; `:=` also assigns it to `PORT`",
            "`:-` assigns and `:=` substitutes; the symbols are the other way round",
            "`:=` errors out if `PORT` is unset",
            "They are identical; `:=` is the older spelling",
          ],
          correctIndex: 0,
          explanation:
            "Both treat unset *and* empty as \"absent\" (drop the colon for unset-only). `${PORT:?must be set}` is the third form — it aborts with your message, which is a good way to fail a script at the top rather than three steps in.",
        },
        {
          id: "lin-shell-scripting-q11",
          prompt: "Why is `while IFS= read -r line` the correct way to read lines, rather than `while read line`?",
          options: [
            "`IFS=` stops leading and trailing whitespace from being stripped, and `-r` stops backslashes from being interpreted as escapes",
            "`IFS=` makes the loop faster on large files",
            "`-r` makes `read` return raw bytes rather than UTF-8",
            "`IFS=` is required for the loop to terminate at EOF",
          ],
          correctIndex: 0,
          explanation:
            "Without them a path like `C:\\temp\\file` loses its backslashes and indented lines silently lose their indentation. `-d ''` plus `find -print0` is the fully safe variant for filenames.",
        },
        {
          id: "lin-shell-scripting-q12",
          prompt:
            "What does this print?\n\n```bash\nx=1\necho hi | { x=2; }\necho \"$x\"\n```",
          options: ["`1`", "`2`", "`hi`", "Nothing — `x` is unset"],
          correctIndex: 0,
          explanation:
            "Every element of a pipeline runs in a subshell, so the assignment happens in a child and is lost. This is the same mechanism that makes `cmd | while read …; do count=$((count+1)); done` report zero afterwards.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lin-strict-mode",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Exit Codes, set -euo pipefail and Failing Loudly",
      summary:
        "A shell's only universal return type is a byte: 0 for success, non-zero for failure. Some of those numbers are conventions worth recognising on sight — 126 means \"found it but couldn't execute it\", 127 means \"command not found\", and 128+N means \"killed by signal N\", which is why a container that exits 137 was SIGKILLed (usually by the OOM killer or a stop timeout) and 143 was asked politely with SIGTERM.\n\nBy default a shell script ignores all of that: a failing command prints an error and the script marches on to the next line, frequently doing something destructive with the results of a step that didn't happen. `set -e` aborts on an unchecked non-zero status, `set -u` makes referencing an unset variable an error (so a typo'd `$DEPLOY_DIR` can't expand to nothing and turn `rm -rf \"$DEPLOY_DIR/\"*` into a very bad afternoon), and `set -o pipefail` makes a pipeline fail if *any* stage failed rather than only the last — without it, `curl -f https://…/app.tar.gz | tar xz` reports success when the download 404s.\n\nTreat the trio as a strong safety net, not a guarantee. `set -e` deliberately does not fire for a command whose status is being tested: the left side of `&&` or `||`, anything in an `if` or `while` condition, or an operand of `!`. It also doesn't see through `local x=$(failing_cmd)`, because the exit status you get is `local`'s, not the command's — a genuine interview question and a real bug. Pair the options with `trap 'cleanup' EXIT` so temporary files and locks are released on every exit path, check `${PIPESTATUS[@]}` when you need per-stage detail, and reach for `set -x` (or `bash -x script.sh`) when a script misbehaves only in CI.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "GNU Bash Manual: The Set Builtin", url: "https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html", kind: "docs" },
        { label: "Greg's Wiki: BashFAQ/105 — why doesn't set -e do what I expected?", url: "https://mywiki.wooledge.org/BashFAQ/105", kind: "article" },
        { label: "MIT SIPB: Safe ways to do things in bash", url: "https://sipb.mit.edu/doc/safe-shell/", kind: "article" },
        { label: "Advanced Bash-Scripting Guide: exit codes with special meanings", url: "https://tldp.org/LDP/abs/html/exitcodes.html", kind: "docs" },
      ],
      video: {
        title: "The Complete Bash Scripting Course - Full Length Guide to learning the Bash Shell",
        channel: "You Suck at Programming",
        url: "https://www.youtube.com/watch?v=Sx9zG7wa4FA",
        videoId: "Sx9zG7wa4FA",
        startSeconds: 13890,
        chapterLabel: "06-01 Pipe Status",
        durationLabel: "7:21:53",
      },
      alternateVideos: [
        {
          title: "The Complete Bash Scripting Course - Full Length Guide to learning the Bash Shell",
          channel: "You Suck at Programming",
          url: "https://www.youtube.com/watch?v=Sx9zG7wa4FA",
          videoId: "Sx9zG7wa4FA",
          startSeconds: 21127,
          chapterLabel: "13-00 Trap Signals",
          durationLabel: "7:21:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-strict-mode-q1",
          prompt:
            "What does each line print?\n\n```bash\nfalse | true; echo $?\nset -o pipefail\nfalse | true; echo $?\n```",
          options: ["`0` then `1`", "`1` then `1`", "`0` then `0`", "`1` then `0`"],
          correctIndex: 0,
          explanation:
            "A pipeline's status is the status of its *last* command unless `pipefail` is on, in which case it is the rightmost non-zero status. This is why `curl … | tar xz` silently \"succeeds\" on a failed download.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-strict-mode-q2",
          prompt: "A container exits with code 137. What does that tell you?",
          options: [
            "It was killed by signal 9 (SIGKILL) — 128 + 9 — most often the OOM killer or a stop-timeout escalation",
            "The application exited with its own error code 137",
            "The image failed to pull",
            "The entrypoint was not executable",
          ],
          correctIndex: 0,
          explanation:
            "Shells and container runtimes report a signal death as 128+N, so 143 is SIGTERM and 137 is SIGKILL. The next step is the kernel log: an OOM kill leaves a message there and nothing at all in the application's own log.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-strict-mode-q3",
          prompt: "What do exit codes 126 and 127 conventionally mean?",
          options: [
            "126: the file was found but could not be executed. 127: the command was not found at all",
            "126: permission denied on a file the command opened. 127: the command timed out",
            "126: the command was killed. 127: the command segfaulted",
            "Both simply mean \"generic failure\"",
          ],
          correctIndex: 0,
          explanation:
            "127 usually means a `PATH` problem or a missing binary in a slim container image; 126 usually means a missing execute bit or a script whose interpreter line is wrong.",
        },
        {
          id: "lin-strict-mode-q4",
          prompt:
            "What does this script output?\n\n```bash\nset -e\nf() { false; echo \"still here\"; }\nif f; then echo \"ok\"; fi\necho \"end\"\n```",
          options: [
            "`still here`, `ok`, `end`",
            "Nothing — it exits at `false`",
            "`still here`, `end`",
            "`ok`, `end`",
          ],
          correctIndex: 0,
          explanation:
            "`set -e` is suspended for any command whose status is being tested, and that suspension applies inside functions called from such a context. So `false` doesn't abort, the function returns the status of its last command (`echo`, which is 0), and the `if` takes the true branch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-strict-mode-q5",
          prompt: "Under `set -e`, in which of these contexts does a failing command **not** abort the script? (Select all that apply.)",
          options: [
            "As the left operand of `&&` or `||`",
            "In the condition of an `if` statement",
            "In the condition of a `while` loop",
            "As an operand of `!`",
            "As a plain command on its own line at the top level",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Anywhere the status is already being inspected, errexit stands down — otherwise `if grep …` could never work. The only case that aborts is the last one: an unchecked command whose status nobody consumes.",
        },
        {
          id: "lin-strict-mode-q6",
          prompt:
            "What does this print, and why does it matter under `set -e`?\n\n```bash\nf() { local out=$(false); echo \"status=$?\"; }\nf\n```",
          options: [
            "`status=0` — the status you see is `local`'s, not the command's, so `set -e` never sees the failure",
            "`status=1` — command substitution propagates the failure",
            "`status=127` — `false` is not found inside a function",
            "Nothing — the script aborts at `local`",
          ],
          correctIndex: 0,
          explanation:
            "`local` (like `export` and `declare`) is a command with its own exit status, and it succeeds. Split it: `local out; out=$(false)` — then the assignment's status is the command's and errexit works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-strict-mode-q7",
          prompt: "A script with `set -u` fails at `echo \"deploying to ${TARGET}\"` on a host where `TARGET` is not exported. What is the recommended fix when the variable is genuinely optional?",
          options: [
            "Write `${TARGET:-}` to supply an explicit empty default, or `${TARGET:?TARGET must be set}` to fail with a clear message",
            "Remove `set -u`, since it breaks on any optional variable",
            "Initialise it with `TARGET=$TARGET` earlier in the script",
            "Quote the expansion as `\"$TARGET\"`, which suppresses the nounset error",
          ],
          correctIndex: 0,
          explanation:
            "`:-` makes \"may be absent\" explicit at the point of use and keeps the check for everything else. Quoting does not affect nounset, and disabling `-u` gives up the protection that stops a typo'd path expanding to nothing.",
        },
        {
          id: "lin-strict-mode-q8",
          prompt: "Why put `trap 'rm -rf \"$tmpdir\"' EXIT` near the top of a script?",
          options: [
            "The EXIT trap runs on every way out — normal end, `exit`, or an errexit abort — so the temporary directory is always cleaned up",
            "It prevents the script from ever exiting with a non-zero status",
            "It deletes the directory immediately, before the script body runs",
            "It only runs if the script is interrupted with Ctrl-C",
          ],
          correctIndex: 0,
          explanation:
            "EXIT is the one hook that covers all the ordinary paths, which is why cleanup belongs there rather than duplicated at every `exit`. It does not run on SIGKILL, so trap `INT TERM` too if you also want to handle interruption explicitly.",
        },
        {
          id: "lin-strict-mode-q9",
          prompt:
            "Under `set -euo pipefail`, a health check greps a log for errors and \"no matches\" is the good outcome:\n\n```bash\ngrep ERROR app.log\necho \"check complete\"\n```\n\nWhat happens on a clean log?",
          options: [
            "The script exits at the `grep` line, because grep returns 1 when nothing matched",
            "It prints `check complete`, since grep succeeded",
            "It hangs waiting for input",
            "It prints an error but continues to the next line",
          ],
          correctIndex: 0,
          explanation:
            "Exit 1 means \"no lines selected\", not \"error\". Write `grep ERROR app.log || true` when empty is acceptable, or branch on it with `if grep -q ERROR app.log; then …; fi`.",
        },
        {
          id: "lin-strict-mode-q10",
          prompt: "What does `${PIPESTATUS[0]}` give you after running `curl -sf \"$url\" | tar xz -C /opt/app`?",
          options: [
            "The exit status of `curl` specifically, so you can tell a failed download from a failed extraction",
            "The number of stages in the pipeline",
            "The combined status, identical to `$?`",
            "The status of `tar`, since arrays are indexed from the right",
          ],
          correctIndex: 0,
          explanation:
            "`PIPESTATUS` is a bash array holding one status per stage, left to right, valid only until the next command runs — so copy it (`local st=(\"${PIPESTATUS[@]}\")`) before doing anything else with it.",
        },
        {
          id: "lin-strict-mode-q11",
          prompt: "Why should a script use `exit 1` rather than `exit -1` to signal failure?",
          options: [
            "Exit statuses are a single byte, so `-1` is delivered to the parent as 255",
            "`exit -1` is a syntax error in bash",
            "`exit -1` is interpreted as \"exit with the status of the previous command\"",
            "Negative statuses terminate the parent shell as well",
          ],
          correctIndex: 0,
          explanation:
            "The wait status only carries 0–255, so negative and >255 values wrap. 255 is not wrong, just less clear than an intentional small code — and CI systems often treat particular codes specially.",
        },
        {
          id: "lin-strict-mode-q12",
          prompt: "A deploy script works locally and fails only in CI. What does `set -x` (or `bash -x deploy.sh`) give you?",
          options: [
            "Each expanded command is printed to stderr before it runs, prefixed by `PS4` (`+` by default) — so you see the actual values after expansion",
            "A stack trace when a command fails",
            "The exit status of every command, appended to its output",
            "A dry run that prints commands without executing them",
          ],
          correctIndex: 0,
          explanation:
            "Seeing the post-expansion command is usually the whole answer, because the difference is almost always an environment variable. Setting `PS4='+${BASH_SOURCE}:${LINENO}: '` adds file and line numbers; `set +x` turns it back off around anything secret.",
        },
      ],
    },

    {
      id: "lin-systemd-units",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "systemd: Units, Services and Timers",
      summary:
        "systemd is PID 1 on essentially every current mainstream distribution, and it is best understood as a dependency-resolving supervisor: you describe *what* should exist as units (`.service`, `.socket`, `.timer`, `.mount`, `.target`) and it decides how and when to get there. A service unit is a small INI file naming an `ExecStart`, the `User` to run as, a `WorkingDirectory`, an `EnvironmentFile` for secrets, and a restart policy. Getting a supervisor for free — restart on failure, resource limits, log capture, ordering — is why you write one instead of a `nohup` line in `rc.local`.\n\nThe details that cost people an outage are procedural. Vendor units live under `/usr/lib/systemd/system` and your overrides under `/etc/systemd/system`, where `systemctl edit` writes a drop-in that survives package upgrades; after any edit you must `systemctl daemon-reload` or systemd keeps running the old definition. `enable` and `start` are different verbs — `start` runs it now, `enable` creates the symlink that starts it at boot — which is why services mysteriously vanish after the first reboot. `ExecStart` is executed directly, not through a shell, so `>`, `|`, `*` and `$VARS` are passed as literal arguments unless you wrap the command in `/bin/sh -c`. And `Type=` must match reality: declare `forking` for a process that stays in the foreground and systemd waits for a fork that never comes.\n\nTimers are systemd's answer to cron and are usually the better one on a systemd host: they are units, so they log to the journal, inherit `User=`, resource limits and dependencies, support `Persistent=true` to catch up a run missed while the machine was off, and `RandomizedDelaySec` to avoid a thundering herd. cron is still everywhere and still fine for simple jobs — just remember it runs with a minimal environment and no login profile, which is why \"it works when I run it by hand\" is the single most common cron bug, and that an unescaped `%` in a crontab line is turned into a newline.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "man7: systemd.service(5)", url: "https://man7.org/linux/man-pages/man5/systemd.service.5.html", kind: "docs" },
        { label: "man7: systemd.unit(5)", url: "https://man7.org/linux/man-pages/man5/systemd.unit.5.html", kind: "docs" },
        { label: "man7: systemd.timer(5)", url: "https://man7.org/linux/man-pages/man5/systemd.timer.5.html", kind: "docs" },
        { label: "man7: crontab(5)", url: "https://man7.org/linux/man-pages/man5/crontab.5.html", kind: "docs" },
      ],
      video: {
        title: "Systemd Explained: How to Manage Linux Services Easily",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=Kzpm-rGAXos",
        videoId: "Kzpm-rGAXos",
        startSeconds: 286,
        chapterLabel: "What are Units in terms of Systemd?",
        durationLabel: "47:40",
      },
      alternateVideos: [
        {
          title: "Automate Your Tasks with systemd Timers: A Step-by-Step Guide",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=n6BuUgkZ5T0",
          videoId: "n6BuUgkZ5T0",
          startSeconds: 150,
          chapterLabel: "High level overview of systemd timers",
          durationLabel: "33:01",
        },
        {
          title: "Linux Crash Course - Scheduling Tasks with Cron",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=7cbP7fzn0D8",
          videoId: "7cbP7fzn0D8",
          startSeconds: 60,
          chapterLabel: "Setting Up Cron Jobs",
          durationLabel: "19:25",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-systemd-units-q1",
          prompt: "You created `myapp.service` and ran `systemctl start myapp`. It runs perfectly — until the server reboots, after which it is not running. What did you miss?",
          options: [
            "`systemctl enable myapp`, which creates the symlink that makes the unit start at boot",
            "`systemctl daemon-reload`, without which the unit is forgotten on reboot",
            "A `Restart=always` line in the unit",
            "Copying the unit into `/usr/lib/systemd/system`",
          ],
          correctIndex: 0,
          explanation:
            "`start` is a one-off; `enable` links the unit into its `WantedBy` target's `.wants` directory so boot pulls it in. `systemctl enable --now myapp` does both, and `is-enabled` tells you the current state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-systemd-units-q2",
          prompt: "You edit `/etc/systemd/system/myapp.service` and run `systemctl restart myapp`. The old settings are still in effect. Why?",
          options: [
            "systemd runs from an in-memory copy of the unit; you must `systemctl daemon-reload` after editing a unit file",
            "Restart reuses the previous process, so unit changes only apply on `stop` then `start`",
            "Unit files under `/etc` are ignored in favour of `/usr/lib`",
            "The unit must be disabled and re-enabled after every edit",
          ],
          correctIndex: 0,
          explanation:
            "systemd even warns about this on the next `systemctl status`. `systemctl edit myapp` reloads for you, which is one reason to prefer it over editing files by hand.",
        },
        {
          id: "lin-systemd-units-q3",
          prompt:
            "A unit contains:\n\n```ini\nExecStart=/usr/bin/node /opt/app/server.js > /var/log/app.log 2>&1\n```\n\nWhat happens?",
          options: [
            "`>`, `/var/log/app.log` and `2>&1` are passed to node as ordinary arguments — there is no shell to interpret them",
            "The output is redirected to the file as it would be in a shell",
            "systemd refuses to load the unit with a syntax error",
            "systemd redirects the output but ignores `2>&1`",
          ],
          correctIndex: 0,
          explanation:
            "`ExecStart` is executed with `execve()`, not by a shell. Either drop the redirection and let stdout go to the journal (the usual answer), or write `ExecStart=/bin/sh -c 'node … > …'`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-systemd-units-q4",
          prompt: "Which statements about unit files and overrides are true? (Select all that apply.)",
          options: [
            "A unit of the same name in `/etc/systemd/system` takes precedence over one in `/usr/lib/systemd/system`",
            "`systemctl edit myapp` creates a drop-in at `/etc/systemd/system/myapp.service.d/override.conf`",
            "To change a list-valued setting like `ExecStart` in a drop-in you must first clear it with an empty `ExecStart=`",
            "Package upgrades overwrite files you placed in `/etc/systemd/system`",
            "`systemctl cat myapp` shows only the vendor file, never the drop-ins",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `/etc` over `/usr/lib` split is exactly the FHS idea applied to units, and drop-ins are additive — for list settings you have to reset before you set. `systemctl cat` prints the vendor file *and* every drop-in, which is the quickest way to see what is actually in effect.",
        },
        {
          id: "lin-systemd-units-q5",
          prompt: "A unit declares `Type=forking`, but the program stays in the foreground and never forks. What does systemd do?",
          options: [
            "It waits for the parent to exit, eventually times out, and reports the unit as failed even though the process is running fine",
            "It detects the mismatch and switches to `Type=simple`",
            "It starts the service normally; `Type` only affects ordering",
            "It kills the process immediately with SIGKILL",
          ],
          correctIndex: 0,
          explanation:
            "`Type=` tells systemd how to know the service is up. `simple` (the default) means \"the process I started is the service\", `forking` means \"wait for the parent to exit\", `notify` means \"the process will tell me via sd_notify\", and `oneshot` means \"it runs and exits\".",
        },
        {
          id: "lin-systemd-units-q6",
          prompt: "What is the difference between `After=network.target` and `After=network-online.target`?",
          options: [
            "`network.target` only means the networking stack is being brought up; `network-online.target` means a configured, usable connection exists",
            "They are aliases; the second is the modern spelling",
            "`network-online.target` orders the unit before networking rather than after",
            "`network.target` applies to IPv4 and `network-online.target` to IPv6",
          ],
          correctIndex: 0,
          explanation:
            "A service that must reach a remote host at startup wants `network-online.target`, plus a matching `Wants=`, and even then the honest answer is to make the service retry — ordering is not readiness.",
        },
        {
          id: "lin-systemd-units-q7",
          prompt: "A cron entry runs a script that works perfectly when you run it by hand, but fails from cron with \"command not found\". What is the usual cause?",
          options: [
            "cron runs jobs with a minimal environment and does not source any login or profile files, so `PATH` and other variables differ",
            "cron refuses to execute scripts that are not owned by root",
            "cron truncates command lines at 80 characters",
            "cron runs jobs in a chroot without `/usr/bin`",
          ],
          correctIndex: 0,
          explanation:
            "Use absolute paths, or set `PATH=` at the top of the crontab, or have the script source the environment it needs. The same reasoning applies to systemd units, which also start from a near-empty environment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-systemd-units-q8",
          prompt:
            "What is wrong with this crontab line?\n\n```\n0 2 * * * /usr/bin/pg_dump app > /backups/app-$(date +%Y%m%d).sql\n```",
          options: [
            "Unescaped `%` is special in crontab: the first one is turned into a newline and everything after it is fed to the command as stdin",
            "`$(…)` is not supported in crontab at all",
            "Five time fields is one too few; crontab needs six",
            "Output redirection is not allowed in a crontab entry",
          ],
          correctIndex: 0,
          explanation:
            "You must write `\\%Y\\%m\\%d`, or move the whole thing into a script and call that — which is the better habit anyway, because it is testable. The six-field form with a user column is `/etc/crontab` and `/etc/cron.d`, not `crontab -e`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-systemd-units-q9",
          prompt: "What does `Persistent=true` on a systemd timer do?",
          options: [
            "If the machine was off when the timer should have fired, the job runs shortly after the next boot",
            "It keeps the timer's service running continuously",
            "It stores the timer's state in the journal for auditing",
            "It prevents the timer from being disabled",
          ],
          correctIndex: 0,
          explanation:
            "systemd records the last trigger time on disk and catches up, which plain cron cannot do (anacron exists for that reason). It applies to `OnCalendar=` timers; pair it with `RandomizedDelaySec` so a fleet doesn't all run at once at boot.",
        },
        {
          id: "lin-systemd-units-q10",
          prompt: "A unit with `Restart=always` has a configuration error, so it dies a second after each start. Eventually `systemctl status` shows `Active: failed (Result: start-limit-hit)`. What does that mean?",
          options: [
            "systemd gave up after too many starts within `StartLimitIntervalSec`; the real error is earlier in the journal, and `systemctl reset-failed` clears the counter",
            "The service exceeded its memory limit",
            "The unit file hit the maximum number of `ExecStart` lines",
            "systemd detected a fork bomb and blocked the unit permanently",
          ],
          correctIndex: 0,
          explanation:
            "Rate limiting stops a broken unit from spinning the machine, but it also hides the cause: the last few lines of `systemctl status` are about the limit, not the bug. Scroll back with `journalctl -u <unit>` to the first failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-systemd-units-q11",
          prompt: "Which command lists every unit that is currently in a failed state?",
          options: [
            "`systemctl list-units --failed`",
            "`systemctl list-unit-files --state=disabled`",
            "`journalctl -p err`",
            "`systemctl status --all`",
          ],
          correctIndex: 0,
          explanation:
            "It is the first command to run on a box that is \"behaving oddly\". `journalctl -p err` shows error-priority *messages*, which overlaps but is not the same question, and `list-unit-files` reports enablement, not runtime state.",
        },
        {
          id: "lin-systemd-units-q12",
          prompt: "What does `WantedBy=multi-user.target` in the `[Install]` section actually cause when you run `systemctl enable`?",
          options: [
            "A symlink to the unit is created in `/etc/systemd/system/multi-user.target.wants/`, so reaching that target pulls the unit in",
            "The unit is started immediately",
            "The unit is granted permission to run as multiple users",
            "The unit is copied into the target's directory",
          ],
          correctIndex: 0,
          explanation:
            "`[Install]` is instructions for `enable`/`disable` only and is ignored at runtime — which is why a unit with no `[Install]` section can be started but not enabled. `multi-user.target` is roughly the old runlevel 3.",
        },
      ],
    },

    {
      id: "lin-logs-journalctl",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Logs: journalctl, /var/log and Rotation",
      summary:
        "On a systemd host there are two log worlds and you need both. Anything a service writes to stdout or stderr is captured by journald into a structured, indexed binary store, queryable with `journalctl -u myapp -f --since '10 min ago' -p err`. That is why the twelve-factor advice to log to stdout works so well: you get per-unit filtering, timestamps, priorities and the PID for free, without your application owning a file. Separately, daemons that manage their own files — nginx, MySQL, anything older than systemd — write plain text under `/var/log`, where `tail`, `grep` and logrotate apply.\n\nTwo journald behaviours cause \"the logs are missing\" incidents. Storage is `auto` by default, which means persistent only if `/var/log/journal` exists; otherwise the journal lives in `/run` and is gone after a reboot — exactly when you want to read about the crash that caused it. And journald rate-limits: past `RateLimitBurst` messages in `RateLimitIntervalSec`, it drops the rest and logs \"Suppressed N messages\", so a chatty failure loop can erase its own evidence.\n\nlogrotate is the other half. It renames or copies a log, compresses old generations and keeps N of them — but the process holding the file has an open descriptor pointing at an *inode*, not a name, so after a plain rename it keeps writing to the rotated file. Hence `postrotate` scripts that signal the daemon to reopen (nginx uses SIGUSR1), and hence `copytruncate` as the fallback for programs that can't be told: it copies then truncates in place, which is simple and can lose whatever was written between the two steps. The same mechanic explains the worst version of this problem: `rm` a live log file and the space is not freed at all until the process lets go.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "man7: journalctl(1)", url: "https://man7.org/linux/man-pages/man1/journalctl.1.html", kind: "docs" },
        { label: "man7: journald.conf(5)", url: "https://man7.org/linux/man-pages/man5/journald.conf.5.html", kind: "docs" },
        { label: "man7: logrotate(8)", url: "https://man7.org/linux/man-pages/man8/logrotate.8.html", kind: "docs" },
        { label: "DigitalOcean: how to use journalctl to view and manipulate systemd logs", url: "https://www.digitalocean.com/community/tutorials/how-to-use-journalctl-to-view-and-manipulate-systemd-logs", kind: "article" },
      ],
      video: {
        title: "journalctl Basics: How to Easily Check Your Linux Logs",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=0dG3vUYt7Uk",
        videoId: "0dG3vUYt7Uk",
        startSeconds: 75,
        chapterLabel: "What is the \"journalctl\" command?",
        durationLabel: "19:34",
      },
      alternateVideos: [
        {
          title: "Linux Crash Course - Understanding Logging",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=6uP_f_z3CbM",
          videoId: "6uP_f_z3CbM",
          startSeconds: 141,
          chapterLabel: "Log file examples from a Fedora instance",
          durationLabel: "29:09",
        },
        {
          title: "Logrotate - Log Management on Linux Servers",
          channel: "Better Stack",
          url: "https://www.youtube.com/watch?v=-tM6DsYam0c",
          videoId: "-tM6DsYam0c",
          durationLabel: "27:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-logs-journalctl-q1",
          prompt: "Which command follows only `myapp`'s error-priority messages from the last ten minutes?",
          options: [
            "`journalctl -u myapp -p err --since '10 min ago' -f`",
            "`journalctl -f myapp --level error --last 10m`",
            "`tail -f /var/log/journal/myapp.log | grep ERROR`",
            "`systemctl log myapp --errors --follow`",
          ],
          correctIndex: 0,
          explanation:
            "`-u` selects the unit, `-p` filters by syslog priority (0 emerg … 7 debug, and `err` means 3 and below), `--since` accepts human phrasing, `-f` follows. The journal is a binary store, so there is no per-unit text file to tail.",
        },
        {
          id: "lin-logs-journalctl-q2",
          prompt: "After a reboot, `journalctl -b -1` reports \"Specified boot ID or offset does not exist\" and no older logs are available. What is the most likely cause?",
          options: [
            "The journal is volatile: `/var/log/journal` does not exist, so logs live in `/run` and are lost at reboot",
            "`journalctl` can only ever show the current boot",
            "The journal was rotated by logrotate during shutdown",
            "The system clock moved backwards, invalidating the index",
          ],
          correctIndex: 0,
          explanation:
            "With the default `Storage=auto`, persistence is decided by whether that directory exists. Create it (or set `Storage=persistent` and restart `systemd-journald`) — ideally before the incident, not during it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-logs-journalctl-q3",
          prompt: "Which of these end up in the journal without any extra configuration? (Select all that apply.)",
          options: [
            "Whatever a systemd service writes to stdout",
            "Whatever a systemd service writes to stderr",
            "Messages sent with the `logger` command",
            "Kernel messages (the ones `dmesg` shows)",
            "Lines an application writes directly to a file it opened under `/var/log`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "journald collects the standard streams of units, the syslog socket and the kernel ring buffer. A file the application opens itself is invisible to it — that log needs its own rotation and its own tooling.",
        },
        {
          id: "lin-logs-journalctl-q4",
          prompt: "Your log shows `Suppressed 1834 messages from myapp.service`. What happened?",
          options: [
            "journald's rate limiter dropped messages after the burst threshold was exceeded within the interval",
            "logrotate compressed those lines into the previous generation",
            "The application's own logger deduplicated repeated lines",
            "The messages were below the configured `MaxLevelStore` priority",
          ],
          correctIndex: 0,
          explanation:
            "`RateLimitIntervalSec` and `RateLimitBurst` in `journald.conf` (overridable per unit with `LogRateLimitBurst=`) exist to stop one process filling the disk — but a crash loop is exactly when you need every line, so raise it for that unit if needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-logs-journalctl-q5",
          prompt: "What is the difference between logrotate's `create` and `copytruncate` strategies?",
          options: [
            "`create` renames the file and makes a new one, so the daemon must be told to reopen; `copytruncate` copies the contents and truncates the original in place, losing anything written between the two steps",
            "`create` compresses the rotated file and `copytruncate` does not",
            "`copytruncate` is faster because it avoids copying data",
            "`create` works only for text logs and `copytruncate` for binary ones",
          ],
          correctIndex: 0,
          explanation:
            "The daemon's descriptor follows the inode, not the name, so after a rename it keeps writing to the rotated file — hence `postrotate` plus a reopen signal. `copytruncate` is the pragmatic fallback for programs that can't reopen, with a small, real window of loss.",
        },
        {
          id: "lin-logs-journalctl-q6",
          prompt: "logrotate's nginx config ends with a `postrotate` block that sends `USR1` to the nginx master. Why is that necessary?",
          options: [
            "nginx holds an open descriptor to the old inode after the rename, so it must be told to reopen its log files",
            "nginx refuses to serve requests while a rotation is in progress",
            "It is how logrotate learns that the rotation succeeded",
            "It forces nginx to flush its in-memory buffer to disk before the compression step",
          ],
          correctIndex: 0,
          explanation:
            "Without it, `access.log.1` keeps growing and the new `access.log` stays empty — a confusing symptom that looks like traffic has stopped. The signal is per-daemon: nginx uses USR1, many others use HUP.",
        },
        {
          id: "lin-logs-journalctl-q7",
          prompt: "A colleague frees space by running `rm /var/log/myapp/app.log` while the app is running. What actually happens?",
          options: [
            "The name is removed but the app still holds the inode open, so no space is freed and it keeps writing to a file you can no longer see",
            "The space is freed and the app creates a new file on its next write",
            "The app crashes immediately with an I/O error",
            "The kernel refuses the unlink because the file is in use",
          ],
          correctIndex: 0,
          explanation:
            "Unlink removes a directory entry; the blocks are released only when the last descriptor closes. Truncating instead (`: > app.log`) frees the space immediately and keeps the app writing to the same inode.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-logs-journalctl-q8",
          prompt: "The journal has grown to several gigabytes. Which command trims it immediately?",
          options: [
            "`journalctl --vacuum-size=500M`",
            "`journalctl --clear`",
            "`rm -rf /var/log/journal/*`",
            "`logrotate -f /etc/logrotate.d/journald`",
          ],
          correctIndex: 0,
          explanation:
            "`--vacuum-size`, `--vacuum-time` and `--vacuum-files` remove old journal files under the limit you give; `--disk-usage` shows the current total. Long term, set `SystemMaxUse=` in `journald.conf` so it never gets there. logrotate does not manage the journal.",
        },
        {
          id: "lin-logs-journalctl-q9",
          prompt: "What does `journalctl -b -1` show?",
          options: [
            "Messages from the previous boot",
            "The last line of the current boot's journal",
            "Messages from one hour ago",
            "Messages with priority 1 (alert)",
          ],
          correctIndex: 0,
          explanation:
            "`-b` selects a boot: `-b` or `-b 0` is the current one, `-b -1` the one before, and `journalctl --list-boots` enumerates them. It only works if the journal is persistent.",
        },
        {
          id: "lin-logs-journalctl-q10",
          prompt: "Beyond `-u`, which journal field is useful for narrowing down a noisy log to one process?",
          options: [
            "`_PID=` — for example `journalctl _PID=4821`, since journald records trusted metadata per message",
            "`--pid` is the only supported form, and it must come before `-u`",
            "There is none; the journal stores plain text only",
            "`_TAG=`, which stores the program name from the syslog header",
          ],
          correctIndex: 0,
          explanation:
            "Every entry carries trusted fields such as `_PID`, `_UID`, `_COMM`, `_SYSTEMD_UNIT` and `_BOOT_ID`, which you can filter on directly and list with `journalctl -o json-pretty` or `-N`. That structure is the main practical advantage over text files.",
        },
      ],
    },

    {
      id: "lin-disk-inodes",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Disk, Inodes and the Disk That Is Full of Nothing",
      summary:
        "`df` and `du` answer different questions, and the gap between them is where a 2am disk incident lives. `df` asks the filesystem itself how many blocks are allocated; `du` walks the directory tree and adds up the files it can reach. They disagree whenever allocated blocks are not reachable by name — most often because a process still holds an open descriptor to a file someone deleted. Until that descriptor closes, the space stays gone, and no amount of `du` will show you where. `lsof +L1` lists exactly those files; the fix is to restart or signal the holder, not to delete more.\n\nThe other classic mismatches are worth knowing before you need them. Files can be hidden *underneath* a mount point: written before the mount, they still occupy blocks that `du` can no longer see. ext4 reserves 5% of the filesystem for root by default, so unprivileged writes start failing at what looks like 95%. `du` counts a hardlinked inode once, while `df` counts its blocks once too — but a sparse file reports its apparent size to some tools and its allocated size to others.\n\nInodes are a separate, exhaustible resource. On ext4 the inode count is fixed at `mkfs` time, so a directory of millions of tiny session or cache files can produce `No space left on device` while `df -h` sits at 40% — `df -i` is the command that tells you. XFS allocates inodes dynamically and mostly sidesteps this, which is one practical reason it is the default on RHEL. When hunting, `du -xh --max-depth=1 /` (the `-x` keeps it on one filesystem, away from `/proc` and network mounts) narrows the problem one level at a time, and `ncdu` does the same interactively.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "man7: df(1)", url: "https://man7.org/linux/man-pages/man1/df.1.html", kind: "docs" },
        { label: "man7: du(1)", url: "https://man7.org/linux/man-pages/man1/du.1.html", kind: "docs" },
        { label: "man7: inode(7)", url: "https://man7.org/linux/man-pages/man7/inode.7.html", kind: "docs" },
        { label: "man7: lsof(8)", url: "https://man7.org/linux/man-pages/man8/lsof.8.html", kind: "docs" },
      ],
      video: {
        title: "Linux Crash Course - The df and du Commands",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=ZRs5zVv_1UU",
        videoId: "ZRs5zVv_1UU",
        startSeconds: 134,
        chapterLabel: "Basic usage of the df command",
        durationLabel: "20:27",
      },
      alternateVideos: [
        {
          title: "10 Common Linux Issues and How to Fix Them",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=xsdFNpThetE",
          videoId: "xsdFNpThetE",
          startSeconds: 409,
          chapterLabel: "Problem 3: The disk is full (but it isn't)",
          durationLabel: "23:44",
        },
        {
          title: "Linux Crash Course - The lsof Command",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=n9nZ1ellaV0",
          videoId: "n9nZ1ellaV0",
          startSeconds: 979,
          chapterLabel: "Using the lsof command to find processes by process ID",
          durationLabel: "23:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-disk-inodes-q1",
          prompt:
            "```bash\n$ df -h /\nFilesystem  Size  Used Avail Use% Mounted on\n/dev/sda1   100G   99G  0.5G  99% /\n$ du -sxh /\n21G\t/\n```\n\nWhat is the most likely explanation?",
          options: [
            "Files were deleted while processes still had them open, so the blocks are allocated but unreachable by name",
            "`du` is inaccurate on large filesystems and needs `--apparent-size`",
            "The filesystem needs `fsck` to reclaim lost blocks",
            "`df` is counting the page cache as used space",
          ],
          correctIndex: 0,
          explanation:
            "Unlinked-but-open files are the overwhelmingly common cause, usually a log a script deleted instead of truncating. `lsof +L1` or `lsof -nP | grep deleted` names the holder; restarting or signalling it releases the space instantly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-disk-inodes-q2",
          prompt: "Which command lists open files whose link count has dropped to zero — that is, deleted files still holding disk space?",
          options: ["`lsof +L1`", "`lsof -d deleted`", "`find / -type f -links 0`", "`du --deleted /`"],
          correctIndex: 0,
          explanation:
            "`+L1` filters to files with fewer than 1 link. `find` cannot help: an unlinked file has no name to find. The output's PID column is what you act on.",
        },
        {
          id: "lin-disk-inodes-q3",
          prompt:
            "An application fails with `No space left on device`, but:\n\n```bash\n$ df -h /var\nFilesystem  Size  Used Avail Use% Mounted on\n/dev/sdb1   200G   88G  112G  45% /var\n```\n\nWhat should you check next?",
          options: [
            "`df -i /var` — the filesystem may have run out of inodes even though blocks are free",
            "`dmesg` for disk errors, since the filesystem is clearly healthy",
            "The application's own disk quota, which `df` never reflects",
            "`du -sh /var` to find which directory is lying",
          ],
          correctIndex: 0,
          explanation:
            "ENOSPC covers both blocks and inodes. Millions of tiny session, cache or mail-queue files exhaust a fixed ext4 inode table long before they fill the disk; the fix is deleting or consolidating the small files.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-disk-inodes-q4",
          prompt: "Which of these genuinely cause `df` and `du` to report different totals? (Select all that apply.)",
          options: [
            "Deleted files that a running process still holds open",
            "Files written to a directory before a filesystem was mounted over it",
            "Root-reserved blocks, which `df` counts as used capacity but no file occupies",
            "`du` counting a hardlinked file only once",
            "`du` being faster than `df` on large filesystems",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "All four are real sources of divergence, and the first is by far the most common in production. Speed has nothing to do with it — `du` is in fact much slower, because it walks every directory.",
        },
        {
          id: "lin-disk-inodes-q5",
          prompt: "Why does `du -sh /` often take minutes and descend into places you don't care about, and what fixes it?",
          options: [
            "`du` crosses filesystem boundaries by default; `-x` keeps it on one filesystem, skipping `/proc`, `/sys` and network mounts",
            "`du` follows symlinks by default; `-P` stops it",
            "`du` recomputes checksums; `--no-hash` skips them",
            "`du` reads file contents; `--metadata-only` avoids that",
          ],
          correctIndex: 0,
          explanation:
            "`du -xh --max-depth=1 /` then descending into the biggest entry is the standard hunt. `du` never reads file contents — it stats them — but crossing into a slow NFS mount can still stall it for a long time.",
        },
        {
          id: "lin-disk-inodes-q6",
          prompt: "A 40 GB log file is filling the disk and its process must not be restarted. Which action frees the space immediately?",
          options: [
            "`: > /var/log/app.log` — truncating the file in place, which the process keeps writing to",
            "`rm /var/log/app.log` — removing the name releases the blocks",
            "`mv /var/log/app.log /tmp/` — moving it off the filesystem",
            "`gzip /var/log/app.log` — compressing it in place",
          ],
          correctIndex: 0,
          explanation:
            "Truncation frees the blocks while leaving the inode (and the process's descriptor) valid. `rm` frees nothing until the process exits, and `mv` within the same filesystem only renames — across filesystems it copies, which needs space you do not have.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-disk-inodes-q7",
          prompt: "Why does an ext4 filesystem start rejecting writes from an ordinary user at around 95% full?",
          options: [
            "ext4 reserves 5% of blocks for root by default, so that system processes and logging keep working when users fill the disk",
            "ext4 needs 5% free to defragment itself",
            "The journal permanently occupies the last 5%",
            "The kernel refuses writes above 95% on any filesystem",
          ],
          correctIndex: 0,
          explanation:
            "`tune2fs -m 1 /dev/sdb1` lowers the reservation, which is sensible on a large data volume with no system files. `df` shows the difference between `Avail` and `Size - Used` for exactly this reason.",
        },
        {
          id: "lin-disk-inodes-q8",
          prompt: "What does an inode actually store?",
          options: [
            "The file's metadata and pointers to its data blocks — but not its name, which lives in the directory entry",
            "The file's name, metadata and data blocks",
            "Only the file's name and size",
            "A compressed copy of the file's first block",
          ],
          correctIndex: 0,
          explanation:
            "Names are directory entries pointing at inode numbers, which is why a hard link is just a second name for one inode and why renaming a file within a filesystem is instant and costs nothing.",
        },
        {
          id: "lin-disk-inodes-q9",
          prompt: "`df -h` with no arguments lists many `tmpfs` entries. What are they?",
          options: [
            "RAM-backed filesystems such as `/run` and `/dev/shm`; their usage counts against memory, not disk",
            "Temporary snapshots the kernel takes before each write",
            "Filesystems that are mounted read-only",
            "Network mounts that have not finished connecting",
          ],
          correctIndex: 0,
          explanation:
            "They clutter the output but occasionally matter: a container writing gigabytes into `/dev/shm` consumes memory and can trigger the OOM killer. `df -h -x tmpfs` (or `-t ext4`) filters the noise.",
        },
        {
          id: "lin-disk-inodes-q10",
          prompt: "You run `df -h .` inside `/var/lib/postgresql` and get a different filesystem than `df -h /`. What does that tell you?",
          options: [
            "`/var` (or a deeper path) is a separate mount, so its capacity is independent of the root filesystem",
            "`df` is reporting a cached value for `/`",
            "The directory is a symlink to another machine",
            "The database is using a loopback file rather than a real filesystem",
          ],
          correctIndex: 0,
          explanation:
            "`df <path>` reports the filesystem that contains that path, which is why \"the disk is full\" is always a question about *which* filesystem. `findmnt` or `df -h` with no arguments shows the whole mount layout.",
        },
        {
          id: "lin-disk-inodes-q11",
          prompt: "A 10 GB sparse file shows as 10 GB in `ls -l` but almost nothing in `du`. Who is right?",
          options: [
            "Both: `ls` reports the apparent size while `du` reports blocks actually allocated, and a sparse file has holes that occupy none",
            "`ls`, because `du` cannot measure files over 4 GB",
            "`du`, because `ls -l` shows the size rounded up to the nearest block",
            "Neither; the file is corrupt and needs `fsck`",
          ],
          correctIndex: 0,
          explanation:
            "`du --apparent-size` switches to the `ls` view. Sparse files are common for VM images and pre-allocated database files, and copying one without `--sparse=always` can materialise every hole and fill your disk.",
        },
      ],
    },

    {
      id: "lin-memory-oom",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Memory, Load Average and the OOM Killer",
      summary:
        "The most confusing production failure an application engineer meets is the one with no stack trace: the process is simply gone, the application log ends mid-request, and the container's exit code is 137. That is the OOM killer, and the evidence is never in your log — it is in the kernel's, via `dmesg -T` or `journalctl -k`, as a line reading `Out of memory: Killed process 1234 (node) total-vm:… anon-rss:…`.\n\nTo read a memory situation you need three ideas. First, free memory is wasted memory: Linux fills the rest of RAM with page cache, so the `free` column on a healthy server is near zero and the number that matters is `available`, which counts what could be reclaimed. Second, the kernel overcommits — it hands out more address space than it has, because most allocations are never touched — so `malloc` almost never fails and the reckoning is deferred to the moment memory is actually needed. Third, when that moment arrives the OOM killer scores processes roughly by footprint (adjustable per process with `oom_score_adj`) and kills the biggest, which is frequently the database rather than the leaking worker that caused it. Under cgroup v2 the same thing happens within a container's `memory.max` while the host still shows tens of gigabytes free.\n\nLoad average is the other number people misread. On Linux it is a 1-, 5- and 15-minute exponentially damped average of tasks that are runnable *or* in uninterruptible sleep — so a machine blocked on a slow disk or a hung NFS mount can show a load of 30 with an idle CPU. Compare it against `nproc`, and use the trend across the three values (rising or falling) rather than the instantaneous number.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "man7: free(1)", url: "https://man7.org/linux/man-pages/man1/free.1.html", kind: "docs" },
        { label: "Kernel docs: concepts overview of memory management", url: "https://docs.kernel.org/admin-guide/mm/concepts.html", kind: "docs" },
        { label: "Kernel docs: overcommit accounting", url: "https://docs.kernel.org/mm/overcommit-accounting.html", kind: "docs" },
        { label: "Brendan Gregg: Linux load averages — solving the mystery", url: "https://www.brendangregg.com/blog/2017-08-08/linux-load-averages.html", kind: "article" },
      ],
      video: {
        title: "Linux Crash Course - Understanding Memory and Swap Usage",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=XTMyJ5l0GLg",
        videoId: "XTMyJ5l0GLg",
        startSeconds: 220,
        chapterLabel: "The free command",
        durationLabel: "20:55",
      },
      alternateVideos: [
        {
          title: "How to Interpret Load Average in Linux (Linux Crash Course Series)",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=4bJmzHh4pg0",
          videoId: "4bJmzHh4pg0",
          startSeconds: 250,
          chapterLabel: "Understanding what the three load average values represent",
          durationLabel: "15:22",
        },
        {
          title: "What Happens When Linux Runs Out of Memory?",
          channel: "Nir Lichtman",
          url: "https://www.youtube.com/watch?v=Cm3-6cOwICU",
          videoId: "Cm3-6cOwICU",
          durationLabel: "2:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-memory-oom-q1",
          prompt: "A Node service disappears overnight. Its own log ends mid-request with no error, and the container's exit code is 137. Where do you look first?",
          options: [
            "The kernel log — `dmesg -T` or `journalctl -k` — for an `Out of memory: Killed process` line",
            "The application log at a lower log level, since the error must be there",
            "The web server's access log for the last request handled",
            "The filesystem, since an ENOSPC would also produce a silent exit",
          ],
          correctIndex: 0,
          explanation:
            "137 is 128+9, so something sent SIGKILL — which is uncatchable, hence the missing shutdown message. The OOM killer records its decision and the victim's RSS in the kernel log, along with a table of candidates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-memory-oom-q2",
          prompt:
            "```bash\n$ free -h\n               total   used   free  shared  buff/cache  available\nMem:            15Gi  4.2Gi  260Mi   120Mi       10Gi       10Gi\n```\n\nHow much memory can a new process realistically get?",
          options: [
            "About 10 GiB — the `available` column, which accounts for reclaimable page cache",
            "About 260 MiB — the `free` column",
            "About 4.2 GiB — total minus used",
            "About 120 MiB — the `shared` column",
          ],
          correctIndex: 0,
          explanation:
            "`free` counts only untouched pages; the kernel deliberately spends the rest on cache and gives it back on demand. Alerting on low `free` produces constant false alarms on healthy machines.",
        },
        {
          id: "lin-memory-oom-q3",
          prompt: "Which statements about the page cache are true? (Select all that apply.)",
          options: [
            "It is reclaimable, so it is not a leak and not a problem",
            "It is why `free` memory is near zero on a healthy long-running server",
            "`echo 3 > /proc/sys/vm/drop_caches` is a diagnostic trick, not a fix for a memory problem",
            "It counts toward the `available` estimate",
            "It must be flushed manually before large allocations can succeed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The kernel evicts cache automatically when something needs the memory, so dropping caches only makes the next reads slower. The one case it is useful for is measuring cold-cache performance.",
        },
        {
          id: "lin-memory-oom-q4",
          prompt: "An 8-core server shows a load average of `8.5 8.1 7.9` while `top` reports 95% idle CPU. What is happening?",
          options: [
            "Tasks in uninterruptible sleep — typically blocked on disk or a network filesystem — count toward Linux's load average",
            "The load average is broken and should be ignored",
            "The load includes processes in other containers on the same host",
            "The CPU is throttled, so idle time is reported while work is queued",
          ],
          correctIndex: 0,
          explanation:
            "Linux's load is not \"CPU demand\" like it is on other Unixes; it counts runnable plus `D`-state tasks. Sustained high load with idle CPU points at I/O — check `iostat`, the `D`-state processes in `ps`, and any NFS mounts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-memory-oom-q5",
          prompt: "A JVM shows `VSZ` of 20 GB and `RSS` of 600 MB on a 4 GB machine. Is that a problem?",
          options: [
            "No — `VSZ` is reserved address space, much of it never touched; `RSS` is the physical memory actually resident",
            "Yes — the process has already allocated 20 GB and will be killed imminently",
            "Yes — `VSZ` above physical RAM always means swapping",
            "No, because `VSZ` counts shared libraries only",
          ],
          correctIndex: 0,
          explanation:
            "Runtimes routinely reserve large regions up front. Watch `RSS` (and, for containers, the cgroup's `memory.current`); `VSZ` is mostly noise on 64-bit systems.",
        },
        {
          id: "lin-memory-oom-q6",
          prompt: "A container is OOM-killed while `free -h` on the host shows 30 GiB available. How is that possible?",
          options: [
            "The container has a cgroup memory limit; exceeding `memory.max` triggers an OOM kill scoped to that cgroup regardless of host memory",
            "The host's memory is fragmented, so a large contiguous allocation failed",
            "Docker reserves memory per container and refuses to release it",
            "The kernel counts the container's page cache as host memory",
          ],
          correctIndex: 0,
          explanation:
            "Container limits are enforced per cgroup, and the kill happens inside it. `memory.events` in the cgroup (or `docker inspect`'s `OOMKilled` flag) confirms it; the fix is either the limit or the application's footprint.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-memory-oom-q7",
          prompt: "What does setting `oom_score_adj` to -1000 for a process do?",
          options: [
            "It makes the process effectively exempt from the OOM killer, which will pick another victim instead",
            "It guarantees the process a fixed memory reservation",
            "It makes the process the first one killed",
            "It disables the OOM killer system-wide",
          ],
          correctIndex: 0,
          explanation:
            "The adjustment runs from -1000 to 1000 and is added to the badness score; -1000 removes the process from consideration, which is how you protect sshd or a monitoring agent. Exempting the wrong thing just moves the outage.",
        },
        {
          id: "lin-memory-oom-q8",
          prompt: "Why does `malloc()` almost always succeed on Linux even when the requested memory exceeds free RAM plus swap?",
          options: [
            "The kernel overcommits: it grants address space optimistically, since most allocations are never fully touched, and only commits pages on first write",
            "`malloc` transparently falls back to allocating on disk",
            "glibc rounds huge requests down to the largest available block",
            "The kernel compresses existing pages to make room before returning",
          ],
          correctIndex: 0,
          explanation:
            "That optimism is why failures surface as a kill rather than a `NULL` return. `vm.overcommit_memory=2` enables strict accounting so allocations fail honestly, at the cost of refusing many workloads that would have been fine.",
        },
        {
          id: "lin-memory-oom-q9",
          prompt: "A team disables swap entirely on their application servers. What is the real tradeoff?",
          options: [
            "Without swap the machine hits the OOM killer sooner and more predictably, instead of thrashing; with swap it degrades slowly and stays alive longer",
            "Disabling swap frees the equivalent amount of RAM for applications",
            "Without swap the kernel cannot reclaim any memory at all",
            "Swap only affects hibernation and has no runtime effect",
          ],
          correctIndex: 0,
          explanation:
            "Neither choice is universally right: a fast crash is often preferable behind a load balancer, while a slow degradation buys a human time to intervene. `vm.swappiness` tunes how eagerly anonymous pages are swapped rather than cache being dropped.",
        },
        {
          id: "lin-memory-oom-q10",
          prompt: "Which command ranks running processes by resident memory?",
          options: [
            "`ps aux --sort=-rss | head`",
            "`ps aux --sort=vsz | head`",
            "`free -h --by-process`",
            "`top -o MEM -b -n1`",
          ],
          correctIndex: 0,
          explanation:
            "The leading minus makes it descending, and `rss` is the physical footprint. `top` sorts by memory with `-o %MEM` (not `MEM`), and `free` has no per-process view at all.",
        },
        {
          id: "lin-memory-oom-q11",
          prompt: "Why does adding up the `RSS` of every process usually exceed the machine's total memory?",
          options: [
            "`RSS` counts shared pages — shared libraries, copy-on-write pages after a fork — in full for every process that maps them",
            "`RSS` includes swapped-out pages as well as resident ones",
            "`ps` reports `RSS` in kilobytes on some systems and bytes on others",
            "The kernel double-counts page cache in each process's `RSS`",
          ],
          correctIndex: 0,
          explanation:
            "`PSS` in `/proc/<pid>/smaps_rollup` divides shared pages among the processes mapping them, which is the number to use when apportioning memory between services on one box.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-memory-oom-q12",
          prompt: "What does the OOM killer's log line `anon-rss:3821044kB, file-rss:12288kB` tell you about the victim?",
          options: [
            "Roughly 3.8 GB was anonymous memory — heap and stack the process itself allocated — and only a few MB was file-backed",
            "The process wrote 3.8 GB to disk before being killed",
            "3.8 GB of the process's memory was shared with other processes",
            "The process had 3.8 GB of its memory swapped out",
          ],
          correctIndex: 0,
          explanation:
            "Anonymous memory is the part that cannot be reclaimed by dropping cache — it can only be swapped or freed — so a large `anon-rss` points squarely at the application's own heap rather than at file caching.",
        },
      ],
    },

    {
      id: "lin-network-ssh",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "The Network from the Shell: ss, dig, curl and SSH",
      summary:
        "\"It works locally but not from outside\" is answered by a fixed ladder of four questions, each with one command. Is the process listening, and on which address? `ss -ltnp`. Does the name resolve, and to what? `dig +short`, cross-checked with `getent hosts`. Can anything reach the port? `curl -v` or `nc -vz`. Is it a routing or firewall problem? `ip route` and `traceroute`. Running them in that order beats guessing, and usually stops at the first rung.\n\nThe single most common answer is the bind address. A server listening on `127.0.0.1:3000` is reachable by `curl localhost:3000` on the box and by nothing else, ever — `ss -ltnp` shows it immediately, and the fix is in the application's config, not the firewall. The second most common is the difference between *refused* and *timed out*: a connection refused means a packet came back saying nobody is there (so the route works and the port is closed), while a timeout means packets are being dropped in silence, which is what a firewall or security group does. Those two symptoms point at opposite ends of the stack.\n\nDNS has its own trap: `dig` talks straight to a resolver, while your application goes through the name service switch, so it also reads `/etc/hosts` and whatever else `/etc/nsswitch.conf` lists. `dig` working while the app fails to resolve — or vice versa — is usually `/etc/hosts`; `getent hosts name` is the check that follows the same path the application does. SSH is the way in to run any of this: use `ed25519` keys rather than passwords, keep per-host settings in `~/.ssh/config` (including `ProxyJump` for bastions), and remember that `sshd` runs `StrictModes` by default and will silently refuse key authentication if your home directory, `~/.ssh` or `authorized_keys` is writable by group or other — the reason for a \"my key stopped working\" mystery whose only evidence is in the server's auth log.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "man7: ss(8) — socket statistics", url: "https://man7.org/linux/man-pages/man8/ss.8.html", kind: "docs" },
        { label: "man7: ssh_config(5)", url: "https://man7.org/linux/man-pages/man5/ssh_config.5.html", kind: "docs" },
        { label: "Debian manpages: dig(1)", url: "https://manpages.debian.org/trixie/bind9-dnsutils/dig.1.en.html", kind: "docs" },
        { label: "man7: curl(1)", url: "https://man7.org/linux/man-pages/man1/curl.1.html", kind: "docs" },
      ],
      video: {
        title: "Linux Crash Course - Connecting to Linux Servers via SSH",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=kjFz7Lp8Qjk",
        videoId: "kjFz7Lp8Qjk",
        startSeconds: 197,
        chapterLabel: "Some basic information regarding SSH",
        durationLabel: "15:54",
      },
      alternateVideos: [
        {
          title: "Linux Crash Course - Public Key Authentication",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=bfwfRCCFTVI",
          videoId: "bfwfRCCFTVI",
          startSeconds: 312,
          chapterLabel: "Generating an SSH keypair (Linux and macOS)",
          durationLabel: "19:05",
        },
        {
          title: "How to Use the dig Command in Linux | DNS Lookup Tutorial",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=_6aL4m8aDjc",
          videoId: "_6aL4m8aDjc",
          startSeconds: 223,
          chapterLabel: "Fetching A Records with the dig command",
          durationLabel: "14:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-network-ssh-q1",
          prompt:
            "On the server `curl http://localhost:3000/health` returns 200, but the same request from your laptop times out. `ss -ltnp` shows:\n\n```\nLISTEN  0  511  127.0.0.1:3000  0.0.0.0:*  users:((\"node\",pid=812,fd=20))\n```\n\nWhat is wrong?",
          options: [
            "The process is bound to the loopback address only, so it can never accept a connection from another host",
            "The firewall is dropping port 3000",
            "The listen backlog of 511 is too small for external traffic",
            "Node cannot serve external traffic without a reverse proxy",
          ],
          correctIndex: 0,
          explanation:
            "`127.0.0.1:3000` is the giveaway; `0.0.0.0:3000` (or `[::]:3000`) would accept from anywhere. Fix it in the application's bind configuration — opening a firewall port for a loopback listener changes nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-network-ssh-q2",
          prompt: "What does each letter in `ss -ltnp` ask for?",
          options: [
            "listening sockets, TCP only, numeric ports (no name lookup), and the owning process",
            "live sockets, transport summary, no DNS, and packet counts",
            "local sockets, TLS only, named services, and protocol details",
            "listening sockets, UDP only, numeric addresses, and peer information",
          ],
          correctIndex: 0,
          explanation:
            "`-u` would be UDP and `-a` adds non-listening sockets. `-p` needs root (or `CAP_NET_ADMIN`) to show process names for sockets you do not own, which is why the `users:` column is often empty otherwise.",
        },
        {
          id: "lin-network-ssh-q3",
          prompt: "Key-based SSH login suddenly fails and falls back to asking for a password. Which server-side conditions would cause that? (Select all that apply.)",
          options: [
            "The user's home directory is group-writable, so `sshd`'s `StrictModes` rejects the key",
            "`~/.ssh` is mode 0777",
            "`~/.ssh/authorized_keys` contains the private key instead of the public key",
            "`~/.ssh/authorized_keys` is mode 0600",
            "The server has `PubkeyAuthentication yes` set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`StrictModes` refuses anything writable by group or other, on the theory that someone else could add a key. Mode 0600 on `authorized_keys` is correct, and `PubkeyAuthentication yes` is what enables the method. The client says nothing useful — the reason is in the server's auth log, or `ssh -vvv`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-network-ssh-q4",
          prompt: "`dig +short api.internal` returns the right address, but the application says the host is unknown. What is the likely difference?",
          options: [
            "`dig` queries DNS directly, while the application goes through the name service switch, which also consults `/etc/hosts` and other sources listed in `/etc/nsswitch.conf`",
            "`dig` caches results that the application cannot see",
            "The application only supports IPv6 lookups",
            "`dig` uses TCP and the application uses UDP",
          ],
          correctIndex: 0,
          explanation:
            "`getent hosts api.internal` follows the same path the application does, so a disagreement between the two points at `/etc/hosts`, a search-domain setting in `/etc/resolv.conf`, or a local stub resolver.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-network-ssh-q5",
          prompt: "`curl` reports `Connection refused` for one host and hangs until `Connection timed out` for another. What does each tell you?",
          options: [
            "Refused means a packet came back saying nothing is listening on that port; timed out means packets are being dropped silently, typically by a firewall or security group",
            "Refused means DNS failed; timed out means the server is overloaded",
            "Refused means TLS was rejected; timed out means the route is missing",
            "They mean the same thing with different timings",
          ],
          correctIndex: 0,
          explanation:
            "A refusal proves the route and the host are fine and moves you to \"is the service listening\". A timeout means something in between chose not to answer, which is a network-policy question, not an application one.",
        },
        {
          id: "lin-network-ssh-q6",
          prompt:
            "What does this `~/.ssh/config` entry let you do?\n\n```\nHost db-prod\n  HostName 10.0.4.21\n  User deploy\n  IdentityFile ~/.ssh/id_ed25519_prod\n  ProxyJump bastion.example.com\n```",
          options: [
            "`ssh db-prod` connects to the private-network host through the bastion, as `deploy`, with the named key — and `scp`/`rsync` use the same settings",
            "It opens a permanent tunnel from the bastion to the database",
            "It forwards your SSH agent to the database host automatically",
            "It only applies to interactive sessions, not to `scp`",
          ],
          correctIndex: 0,
          explanation:
            "Every OpenSSH-based tool reads this file, which is why putting host details here beats memorising flags. `ProxyJump` replaced the old `ProxyCommand ssh -W` incantation; agent forwarding is a separate, riskier option (`ForwardAgent`).",
        },
        {
          id: "lin-network-ssh-q7",
          prompt: "`traceroute example.com` shows `* * *` for several intermediate hops but the final hop replies. What does that mean?",
          options: [
            "Those routers are not replying to the probes — often deliberately — which says nothing about whether traffic is passing through them",
            "The route is broken at the first starred hop and packets are being dropped",
            "Those hops are dropping only ICMP but forwarding everything else, so traffic is degraded",
            "The DNS for those hops failed, so traceroute could not continue",
          ],
          correctIndex: 0,
          explanation:
            "traceroute relies on routers sending back TTL-exceeded messages, which many are configured or rate-limited not to do. Stars in the middle with a successful final hop mean the path works; stars all the way to the end are the interesting case.",
        },
        {
          id: "lin-network-ssh-q8",
          prompt: "SSH refuses to connect with `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`. What does that actually mean, and what is the right response?",
          options: [
            "The server presented a different host key than the one recorded in `known_hosts`; verify out of band why it changed before removing the old entry",
            "Your private key expired and must be regenerated",
            "The server's TLS certificate is untrusted; add it to the system CA store",
            "Your `known_hosts` file is corrupt and should be deleted",
          ],
          correctIndex: 0,
          explanation:
            "It is usually benign — a rebuilt or re-imaged host — but it is exactly the signal a man-in-the-middle would produce, so confirm the new fingerprint from the provider or console first. `ssh-keygen -R hostname` removes just that entry.",
        },
        {
          id: "lin-network-ssh-q9",
          prompt: "Why prefer `ssh-agent` plus `ssh-add` over an unencrypted private key file?",
          options: [
            "The key stays encrypted on disk; the agent holds the decrypted key in memory so you type the passphrase once per session",
            "The agent rotates the key pair automatically",
            "The agent encrypts the network traffic, which plain keys do not",
            "The agent is required for `ProxyJump` to work",
          ],
          correctIndex: 0,
          explanation:
            "It makes a passphrase practical rather than annoying, which is the whole point. Agent *forwarding* is different and should be used sparingly: root on the jump host can then use your agent to authenticate as you.",
        },
        {
          id: "lin-network-ssh-q10",
          prompt: "What does `curl -I https://api.example.com/health` do that `curl https://api.example.com/health` does not?",
          options: [
            "It sends a HEAD request and prints only the response headers, so you see the status and headers without downloading the body",
            "It ignores TLS certificate errors",
            "It prints the request headers curl sent",
            "It follows redirects automatically",
          ],
          correctIndex: 0,
          explanation:
            "`-I` is the fast way to check a status code or a cache header — but note some servers handle HEAD differently from GET. `-v` shows both sides of the exchange, `-L` follows redirects and `-k` is the (rarely justified) certificate override.",
        },
        {
          id: "lin-network-ssh-q11",
          prompt: "You need to test a new backend before DNS is switched over. Which curl option sends the request to a specific IP while keeping the original hostname in the TLS handshake and `Host` header?",
          options: [
            "`curl --resolve api.example.com:443:10.0.4.21 https://api.example.com/health`",
            "`curl -H 'Host: api.example.com' https://10.0.4.21/health`",
            "`curl --interface 10.0.4.21 https://api.example.com/health`",
            "`curl --dns-servers 10.0.4.21 https://api.example.com/health`",
          ],
          correctIndex: 0,
          explanation:
            "`--resolve` overrides name resolution for that host and port only, so SNI and the `Host` header stay correct and TLS validates. The `-H 'Host:'` trick breaks certificate validation because the URL's hostname is the IP.",
        },
      ],
    },

    {
      id: "lin-debug-wont-start",
      moduleId: "devops-linux-shell",
      trackId: "devops",
      title: "Debugging a Process That Will Not Start",
      summary:
        "This is the camp's capstone because it uses everything else: a service that runs on your laptop refuses to come up on the server, and the useful skill is a ladder you climb the same way every time rather than a pile of guesses.\n\nStart with what the supervisor knows. `systemctl status myapp --no-pager -l` gives the headline, and `journalctl -u myapp -n 200 --no-pager` gives the actual error — usually somewhere above the noise, because a restart loop pushes it off the screen. Then classify the failure from the exit status, because each class has a different next step. `status=203/EXEC` means systemd could not execute the binary at all: wrong path, missing execute bit, a missing interpreter, or a shebang mangled by CRLF line endings. `status=217/USER` means the configured user does not exist. `status=127` is \"command not found\" from a shell. A plain `status=1/FAILURE` means your program started and chose to exit, so the reason is in its own output. `signal=KILL` with code 137 sends you to the OOM killer.\n\nThe rest is narrowing. Reproduce outside the supervisor — `sudo -u app /usr/bin/node /opt/app/server.js` — because the difference is nearly always environment: `PATH`, `HOME`, a missing `EnvironmentFile`, or a relative path that only resolves from your shell's working directory. Check the port with `ss -ltnp`, the filesystem with `df -h` and `df -i`, the config with the program's own validator (`nginx -t`), and, on RHEL-family systems, `dmesg | grep -i denied` or `ausearch -m avc` for the SELinux denial that makes a mode-0755 file unreadable anyway. And when `systemctl status` says `Result: start-limit-hit`, remember it is describing the rate limiter, not the bug: scroll back to the first failure, fix that, then `systemctl reset-failed`.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "man7: systemctl(1)", url: "https://man7.org/linux/man-pages/man1/systemctl.1.html", kind: "docs" },
        { label: "man7: systemd.exec(5) — process exit status codes", url: "https://man7.org/linux/man-pages/man5/systemd.exec.5.html", kind: "docs" },
        { label: "man7: journalctl(1)", url: "https://man7.org/linux/man-pages/man1/journalctl.1.html", kind: "docs" },
        { label: "man7: systemd-analyze(1) — verify unit files", url: "https://man7.org/linux/man-pages/man1/systemd-analyze.1.html", kind: "docs" },
      ],
      video: {
        title: "How To Manage Linux Services with systemctl and journalctl | Sysadmin Basics",
        channel: "Akamai Developers",
        url: "https://www.youtube.com/watch?v=3kl62YSU9XA",
        videoId: "3kl62YSU9XA",
        startSeconds: 110,
        chapterLabel: "Check the status of services",
        durationLabel: "14:00",
      },
      alternateVideos: [
        {
          title: "journalctl Basics: How to Easily Check Your Linux Logs",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=0dG3vUYt7Uk",
          videoId: "0dG3vUYt7Uk",
          startSeconds: 326,
          chapterLabel: "Inspecting a service with journalctl",
          durationLabel: "19:34",
        },
        {
          title: "Systemd Explained: How to Manage Linux Services Easily",
          channel: "Learn Linux TV",
          url: "https://www.youtube.com/watch?v=Kzpm-rGAXos",
          videoId: "Kzpm-rGAXos",
          startSeconds: 471,
          chapterLabel: "Checking the status of a Systemd Unit",
          durationLabel: "47:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lin-debug-wont-start-q1",
          prompt:
            "```\n$ systemctl status myapp\n   Loaded: loaded (/etc/systemd/system/myapp.service; enabled)\n   Active: failed (Result: exit-code)\n  Process: 4102 ExecStart=/opt/app/run.sh (code=exited, status=203/EXEC)\n```\n\nWhat does `203/EXEC` tell you?",
          options: [
            "systemd could not execute the program at all — bad path, missing execute bit, or a missing/mangled interpreter line",
            "The program started and exited with its own error code 203",
            "The service exceeded its memory limit",
            "The configured `User=` does not exist on this host",
          ],
          correctIndex: 0,
          explanation:
            "203 is systemd's own code for a failed `execve()`, so the application never ran and there will be nothing in its log. 217/USER is the missing-user case and 200/CHDIR is a bad `WorkingDirectory`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-debug-wont-start-q2",
          prompt: "How do you read the difference between `code=exited, status=1/FAILURE` and `code=killed, signal=KILL`?",
          options: [
            "The first means your program ran and chose to exit, so the reason is in its own output; the second means something terminated it, so look at the OOM killer and stop timeouts",
            "Both mean the binary could not be found",
            "The first means a configuration error and the second a permission error",
            "The first is a systemd internal error and the second an application error",
          ],
          correctIndex: 0,
          explanation:
            "Splitting \"never started\" from \"started and quit\" from \"was killed\" is the single most valuable triage step, because each sends you to a different log.",
        },
        {
          id: "lin-debug-wont-start-q3",
          prompt: "`systemctl status` reports `Active: failed (Result: start-limit-hit)` and the journal's last lines are all about the limit. What now?",
          options: [
            "Scroll back in `journalctl -u myapp` to the first failure — the limit is a symptom — then fix it and run `systemctl reset-failed myapp`",
            "Raise `StartLimitBurst` so the service keeps retrying until it succeeds",
            "Reboot the machine to clear the counter",
            "Switch `Restart=always` to `Restart=no`, which is the actual cause",
          ],
          correctIndex: 0,
          explanation:
            "The rate limiter is protecting the machine from a restart loop and hiding the original error behind dozens of repetitions. Raising the burst just means more log noise before the same failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-debug-wont-start-q4",
          prompt: "Which of these are worth running *before* you restart a failing service? (Select all that apply.)",
          options: [
            "`journalctl -u myapp -n 200 --no-pager` to capture the error text",
            "`ss -ltnp | grep :3000` to see whether the port is already held",
            "`df -h` and `df -i` on the filesystems it writes to",
            "`systemctl cat myapp` to see the unit plus every drop-in actually in effect",
            "`systemctl restart myapp`, because a restart often clears transient state",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "A restart destroys the evidence — open descriptors, the held port, the process's environment — and the failure usually comes straight back. Capture state first; restarting is the last step, not the first.",
        },
        {
          id: "lin-debug-wont-start-q5",
          prompt: "The service runs fine when you launch it by hand as root, and fails under systemd with `User=app`. What reproduces the failure most faithfully?",
          options: [
            "Run the exact `ExecStart` line as that user with a cleaned environment: `sudo -u app env -i /usr/bin/node /opt/app/server.js`",
            "Run it as root again but with `nice -n 19`",
            "Add `Restart=always` and watch the journal for more detail",
            "Copy the unit to `/usr/lib/systemd/system` and reload",
          ],
          correctIndex: 0,
          explanation:
            "The two differences between your shell and the unit are identity and environment, and `sudo -u … env -i …` removes both. Then add back one variable at a time until it works — that variable is your missing `Environment=` or `EnvironmentFile=`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-debug-wont-start-q6",
          prompt: "The application log shows `EADDRINUSE: address already in use :::3000`. What is the sequence that actually resolves it?",
          options: [
            "Find the holder with `ss -ltnp | grep :3000` or `lsof -i :3000`, decide whether it is a stale instance or a second service, and stop the right one",
            "Kill every process owned by the service user and start again",
            "Change the port in the unit file, since the old one is now permanently reserved",
            "Wait for the TCP TIME_WAIT state to expire, which always clears it",
          ],
          correctIndex: 0,
          explanation:
            "Usually it is a previous instance that outlived a bad restart, or a second copy of the unit. `TIME_WAIT` only blocks a re-bind when the server does not set `SO_REUSEADDR`, and it would not produce a listening socket in `ss` output.",
        },
        {
          id: "lin-debug-wont-start-q7",
          prompt: "Running a deploy script copied from Windows gives `bad interpreter: /bin/bash^M: No such file or directory`. What is wrong?",
          options: [
            "The file has CRLF line endings, so the carriage return became part of the interpreter path",
            "bash is not installed at `/bin/bash` on this distribution",
            "The script is missing the execute bit",
            "The shebang must not have a space after `#!`",
          ],
          correctIndex: 0,
          explanation:
            "`^M` in an error message is the giveaway. Fix it with `dos2unix`, `sed -i 's/\\r$//'`, or a `.gitattributes` rule — and note the same corruption silently breaks here-documents and quoted strings further down the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lin-debug-wont-start-q8",
          prompt: "Why run `nginx -t` before `systemctl reload nginx` on a production host?",
          options: [
            "It validates the configuration without touching the running server, so a syntax error is caught before it can take the service down",
            "It reloads only the changed parts of the configuration",
            "It clears nginx's cache so the reload is clean",
            "It is required — `systemctl reload` refuses to run without it",
          ],
          correctIndex: 0,
          explanation:
            "A reload with a broken config can leave you with a stopped server and an incident. Most serious daemons have an equivalent check, and it belongs in the deploy pipeline as well as in your fingers.",
        },
        {
          id: "lin-debug-wont-start-q9",
          prompt: "On a RHEL host, a service cannot read `/opt/app/config.yml` even though it is mode 0644 and owned by the service user. `ls -l` shows a trailing `.` on the mode string. What should you check?",
          options: [
            "SELinux: check `getenforce`, then `ausearch -m avc -ts recent` or `dmesg | grep -i denied` for the denial and fix the file's context",
            "The filesystem is mounted read-only",
            "An ACL is overriding the mode bits",
            "The file has the immutable attribute set",
          ],
          correctIndex: 0,
          explanation:
            "The trailing `.` means an SELinux context is present, and a denial produces an ordinary EACCES with nothing wrong in the mode bits — the invisible failure on RHEL-family systems. `restorecon` or a `semanage fcontext` rule is the fix, not `chmod 777`.",
        },
        {
          id: "lin-debug-wont-start-q10",
          prompt: "A unit fails immediately with exit status 127 logged from its `ExecStart=/bin/sh -c 'myapp --serve'`. What is the most likely cause?",
          options: [
            "The shell could not find `myapp` — systemd starts services with a minimal `PATH` that does not include where it is installed",
            "The `-c` argument must be quoted differently for systemd",
            "127 always means the unit file has a syntax error",
            "The service user lacks permission to run `/bin/sh`",
          ],
          correctIndex: 0,
          explanation:
            "127 is the shell's \"command not found\". Use an absolute path in `ExecStart`, or set `Environment=PATH=…` explicitly — relying on the interactive `PATH` you happen to have is the mistake.",
        },
        {
          id: "lin-debug-wont-start-q11",
          prompt: "A machine crashed and rebooted overnight. How do you read the logs from before the reboot?",
          options: [
            "`journalctl -b -1 -u myapp` — provided the journal is persistent, which requires `/var/log/journal` to exist",
            "`journalctl --before-reboot`, which systemd keeps separately",
            "`dmesg` always retains the previous boot's kernel ring buffer",
            "`systemctl status --previous myapp`",
          ],
          correctIndex: 0,
          explanation:
            "`-b -1` selects the previous boot and `--list-boots` enumerates what is available. With a volatile journal there is nothing to read, which is why persistence is worth turning on before you need it; `dmesg` shows only the current boot's ring buffer.",
        },
        {
          id: "lin-debug-wont-start-q12",
          prompt: "You wrote a new unit file and want to check it for mistakes before enabling it. Which command does that?",
          options: [
            "`systemd-analyze verify /etc/systemd/system/myapp.service`",
            "`systemctl check myapp.service`",
            "`systemctl daemon-reload --dry-run`",
            "`journalctl --verify-unit myapp.service`",
          ],
          correctIndex: 0,
          explanation:
            "It loads the unit and reports unknown directives, missing dependencies and bad paths without starting anything. Pair it with `systemctl cat` to confirm which files and drop-ins are actually being merged.",
        },
      ],
    },
  ],
} satisfies Module;
