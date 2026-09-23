# Linux & the Shell research notes (2026-09-23)

First camp written for the v3 **DevOps & Cloud** track, so `src/content/devops/` was created here.

## Scope decision

The brief lists 18 subject bullets but asks for 12–15 topics, so four merges were made. Each pairs
things a learner meets together at 2am rather than splitting a single question across two camps:

- **Package management folded into the filesystem topic** (`lin-filesystem-hierarchy`). The FHS
  explains *why* `apt` puts binaries in `/usr/bin` and why your own build belongs in
  `/usr/local/bin` or `/opt`; `dpkg -S` / `rpm -qf` is the same "where did this come from" question.
- **cron folded into `lin-systemd-units`** as "systemd: Units, Services and Timers". Choosing
  between a timer and a crontab is one decision, and the cron-environment gotcha is a quiz question
  there rather than a topic.
- **journalctl and logrotate merged** into `lin-logs-journalctl`, because the operational question
  is "where did the logs go", and the answer spans journald storage, `/var/log` and rotation.
- **Networking tools and SSH merged** into `lin-network-ssh`. Both are the same triage ladder:
  get to the box, then ask whether it is listening, resolving, reachable or routed. Protocol depth
  (DNS/TLS) is deliberately left to `devops-networking-tls`.

Not covered on purpose: reverse proxies, Docker (an existing Backend camp), Kubernetes, AWS,
Terraform, observability tooling. `lsof` and `ss` appear as *tools*, not as an observability story.

**Final 15 topics**, in order: `lin-filesystem-hierarchy`, `lin-permissions`,
`lin-users-groups-sudo`, `lin-processes-signals`, `lin-streams-redirection`, `lin-text-toolkit`,
`lin-find-xargs`, `lin-shell-scripting` (milestone), `lin-strict-mode`, `lin-systemd-units`,
`lin-logs-journalctl`, `lin-disk-inodes`, `lin-memory-oom` (milestone),
`lin-network-ssh`, `lin-debug-wont-start` (milestone).

## Videos

Every id below came from `yt.mjs search` and was confirmed with `yt.mjs info --chapters`
(`embeddable: true` in all 36 slots). **No search-URL fallbacks.**

**Learn Linux TV is the spine.** Its "Linux Crash Course" series is one video per command at
15–35 minutes, which maps almost one-to-one onto this camp. NetworkChuck and Fireship cover the
two broad-orientation topics, and one long-form bash course is chapter-split across the scripting
topics.

| Topic | Video | Deep link |
| --- | --- | --- |
| `lin-filesystem-hierarchy` | `A3G-3hp88mo` NetworkChuck, "the Linux File System explained in 1,233 seconds" (20:33) | 148s "the ROOT of the File System" |
| `lin-permissions` | `4e669hSjaX8` Learn Linux TV, "Understanding File & Directory Permissions" (35:48) | no chapters, from 0 |
| `lin-users-groups-sudo` | `07JOqKOBRnU` Learn Linux TV, "sudo" (26:11) | 164s "sudo overview" |
| `lin-processes-signals` | `LfC6pv8VISk` NetworkChuck, "KILL Linux processes!!" (21:51) | 143s "recap: What is a Linux Process?" |
| `lin-streams-redirection` | `zMKacHGuIHI` Learn Linux TV, "Data Streams (stdin, stdout & stderr)" (17:12) | 77s "The three data streams" |
| `lin-text-toolkit` | `Tc_jntovCM0` Learn Linux TV, "The grep Command" (14:57) | 118s "What is grep?" |
| `lin-find-xargs` | `skTiK_6DdqU` Learn Linux TV, "The find command" (25:56) | from 0 |
| `lin-shell-scripting` | `Sx9zG7wa4FA` You Suck at Programming, "The Complete Bash Scripting Course" (7:21:53) | 4195s "03-00 Finally Scripting" |
| `lin-strict-mode` | `Sx9zG7wa4FA` (same course) | 13890s "06-01 Pipe Status" |
| `lin-systemd-units` | `Kzpm-rGAXos` Learn Linux TV, "Systemd Explained" (47:40) | 286s "What are Units in terms of Systemd?" |
| `lin-logs-journalctl` | `0dG3vUYt7Uk` Learn Linux TV, "journalctl Basics" (19:34) | 75s "What is the journalctl command?" |
| `lin-disk-inodes` | `ZRs5zVv_1UU` Learn Linux TV, "The df and du Commands" (20:27) | 134s "Basic usage of the df command" |
| `lin-memory-oom` | `XTMyJ5l0GLg` Learn Linux TV, "Understanding Memory and Swap Usage" (20:55) | 220s "The free command" |
| `lin-network-ssh` | `kjFz7Lp8Qjk` Learn Linux TV, "Connecting to Linux Servers via SSH" (15:54) | 197s "Some basic information regarding SSH" |
| `lin-debug-wont-start` | `3kl62YSU9XA` Akamai Developers, "How To Manage Linux Services with systemctl and journalctl" (14:00) | 110s "Check the status of services" |

Alternates (21 more slots, all verified): `42iQKuQodW4` Fireship "Linux Directories Explained in
100 Seconds"; `1kicKTbK768` apt @136s; `0m4lTBJJe4k` Caleb Curry umask @382s "Special File
Permissions"; `19WOD84JFxA` Managing Users @245s; `GnlgAD8-GhE` Managing Groups; `wYwGNgsfN3I`
"The ps Command" @503s "Process relationship"; `oPEnvuj9QrI` awk @129s; `nXLnx8ncZyE` sed @84s;
`rp7jLi_kgPg` DistroTube xargs; `xg9GcuxeRwk` locate; `VIUoHnFwEH4` anthonywritescode "bash
quoting" @30s; `uQE_4Q-HZZw` Learn Linux TV bash variables @105s; `n6BuUgkZ5T0` systemd timers
@150s; `7cbP7fzn0D8` cron @60s; `6uP_f_z3CbM` "Understanding Logging" @141s; `-tM6DsYam0c` Better
Stack logrotate; `xsdFNpThetE` "10 Common Linux Issues" @409s "The disk is full (but it isn't)";
`n9nZ1ellaV0` lsof @979s; `4bJmzHh4pg0` load average @250s; `Cm3-6cOwICU` Nir Lichtman OOM (2:54);
`bfwfRCCFTVI` public key auth @312s; `_6aL4m8aDjc` dig @223s; `Kzpm-rGAXos` @471s and
`0dG3vUYt7Uk` @326s as milestone alternates; `Sx9zG7wa4FA` @6130s, @11624s and @21127s.

**Chapter-splitting.** `Sx9zG7wa4FA` is used at five distinct offsets (4195 / 6130 / 11624 / 13890
/ 21127) and `Kzpm-rGAXos` and `0dG3vUYt7Uk` at two each — always different chapters, never the
same video+offset twice.

**Rejected.** `sWbUDq4S6Y8` / `ZtqBQ68cfJc` / `ROjZy1WbCIA` (freeCodeCamp's big Linux courses,
2.8–3.4M views) — all 3–6 hours with no usable chapter markers for these topics, so a dedicated
15-minute Learn Linux TV episode beats them every time. Searches for a dedicated "systemd service
won't start" video returned nothing above ~800 views; the milestone therefore uses the Akamai
systemctl/journalctl walkthrough plus two Learn Linux TV chapters rather than a weak dedicated
video. Searches for a focused `ss`/`dig`/`curl` triage video likewise found nothing with real
views that wasn't Hindi-language or under 500 views; `lin-network-ssh` leads with SSH and carries
`dig` as an alternate.

## References

All URLs checked with `check-urls.mjs`; every one returns 200 and the **final** URL is what ships.

- **`man7.org` is the backbone** and is the only major source here that allows iframe embedding
  (no `X-Frame-Options`, no CSP) — so most reference cards in this camp will preview inline, unlike
  the PHP camps. `docs.kernel.org`, `mywiki.wooledge.org`, `sipb.mit.edu`, `brendangregg.com`,
  `explainshell.com` and `dnf.readthedocs.io` also allow framing.
- **Blocked from framing** (link-preview fallback): `gnu.org` (`X-Frame-Options: sameorigin`, so
  every Bash-manual and gawk-manual ref falls back), `refspecs.linuxfoundation.org`,
  `manpages.debian.org`, `github.com` (`frame-ancestors 'none'`), `redhat.com`
  (`frame-ancestors 'self' tracks.redhat.com`), `digitalocean.com` (`frame-ancestors 'self'`),
  `sudo.ws` (`frame-ancestors 'self'`), `curl.se`, `lwn.net`, `redsymbol.net`.
- **Dead or wrong URLs found and replaced:**
  - `https://www.freedesktop.org/software/systemd/man/latest/…` returns **418** to a scripted
    client. All systemd man pages therefore point at `man7.org/linux/man-pages/man5/systemd.*`,
    which mirrors them and returns 200.
  - `https://man7.org/linux/man-pages/man1/dig.1.html` is a **404** (dig is not in the Linux
    man-pages project) — used `manpages.debian.org/trixie/bind9-dnsutils/dig.1.en.html` instead.
  - `https://man7.org/linux/man-pages/man8/apt.8.html` is a **404** — used
    `manpages.debian.org/trixie/apt/apt.8.en.html`.
  - `https://docs.kernel.org/admin-guide/mm/overcommit-accounting.html` is a **404**; the page is
    `https://docs.kernel.org/mm/overcommit-accounting.html`.
  - `manpages.debian.org/stable/…` redirects to `/trixie/…`; the final URL is what is stored.
  - `https://www.openssh.com/manual.html` redirects to `openssh.org` — not used in the end.
- **No interview-prep repo.** There is no Linux equivalent of `lydiahallie/javascript-questions`
  worth shipping; `jlevy/the-art-of-command-line` is cited once at module level with `kind: "repo"`,
  and the ShellCheck wiki page for SC2086 is cited the same way on `lin-shell-scripting`. The
  interview weight is carried by the predict-the-output questions instead.

## Facts verified

Checked against the man pages and kernel docs listed above on 2026-09-23, not from memory.
Per the brief, the camp prefers mechanisms to version numbers, and names the distro family wherever
Debian/Ubuntu and RHEL/Fedora differ (`apt`/`dpkg` vs `dnf`/`rpm`, `/bin/sh` = dash, ext4 vs XFS
inode allocation, SELinux on RHEL).

- **Permission class selection is first-match-wins** (owner, then group, then other), so a
  more-permissive group bit never helps the owner. `inode(7)`.
- **Deleting a file needs write+execute on the containing directory**, nothing on the file; the
  sticky bit (`1777`) is what restricts that in a shared directory.
- **setuid is ignored on scripts and on `nosuid` mounts**; setuid on a directory is meaningless on
  Linux, while setgid on a directory makes group ownership inherited.
- **`umask 022`**: requested `0666` → `0644`, `0777` → `0755`. The umask can only clear bits.
- **`chown`/`chgrp` clear S_ISUID/S_ISGID on executables** — and since Linux 2.2.13 root is treated
  like any other user for this. `chown(2)`.
- **Supplementary group membership is fixed at session creation**, so `usermod -aG` needs a new
  login; `usermod -G` without `-a` replaces the whole list. `credentials(7)`.
- **sudo's `env_reset` + `secure_path`** replace `PATH`, which is why `sudo node` can be "command
  not found". `sudoers(5)`.
- **SIGKILL and SIGSTOP cannot be caught, blocked or ignored**; a `D`-state (uninterruptible sleep)
  process does not die even to SIGKILL until the syscall returns. `signal(7)`.
- **systemd's default `TimeoutStopSec` is 90 s**, and `docker stop`'s grace period is 10 s.
- **A zombie holds only a process-table entry**, no memory and no descriptors.
- **Redirections apply left to right**, so `cmd 2>&1 > f` leaves stderr on the terminal. Each stage
  of a pipeline runs in a subshell in bash (absent `lastpipe`), so `echo hi | read x` loses `x`.
- **libc switches stdout from line to block buffering when it is not a TTY** — the "logs stop when
  I pipe them" symptom.
- **`grep` exits 1 on no match and 2 on error**; `uniq` collapses only *adjacent* duplicates;
  `sort` is lexicographic without `-n`; `cut -d' '` does not collapse runs of spaces while awk's
  default `FS` does.
- **GNU vs BSD `sed -i`** disagree about the mandatory backup suffix.
- **`find -mtime +7`** discards the fractional day, so it means 8 days or older; `-name` must be
  quoted or the shell expands it first; **GNU `xargs` runs the command once even on empty input**
  unless `-r`. `find(1)`, `xargs(1)`.
- **`local x=$(false)` yields exit status 0**, because `local`'s own status wins — so `set -e`
  never sees it. Split the declaration from the assignment.
- **`set -e` stands down** on the left of `&&`/`||`, in `if`/`while` conditions and under `!`;
  pipeline status is the last stage's unless `pipefail`. `The Set Builtin`, BashFAQ/105.
- **Exit codes**: 126 found-but-not-executable, 127 command-not-found, 128+N killed by signal N
  (137 = SIGKILL, 143 = SIGTERM); statuses are one byte, so `exit -1` arrives as 255.
- **systemd exit statuses confirmed from `systemd.exec(5)`**: 200 EXIT_CHDIR, 203 EXIT_EXEC,
  208 EXIT_STDIN, 216 EXIT_GROUP, 217 EXIT_USER.
- **`ExecStart` is `execve`d, not run through a shell**, so `>`, `|` and `$VAR` are literal
  arguments. `/etc/systemd/system` overrides `/usr/lib/systemd/system`; drop-ins must reset a
  list-valued directive (`ExecStart=`) before setting it; `enable` creates a `.wants` symlink.
- **`Persistent=true`** on a timer catches up a run missed while the machine was off — cron cannot.
  An unescaped `%` in a crontab is turned into a newline and the remainder becomes stdin.
- **journald `Storage=auto`** is persistent only if `/var/log/journal` exists; rate limiting
  (`RateLimitIntervalSec`/`RateLimitBurst`) emits "Suppressed N messages".
- **logrotate `create` vs `copytruncate`**: descriptors follow the inode, so a renamed log keeps
  receiving writes until the daemon reopens (nginx: SIGUSR1); `copytruncate` loses whatever is
  written between the copy and the truncate.
- **`df` vs `du`** diverge on deleted-but-open files (`lsof +L1`), files hidden under a mount
  point, root-reserved blocks (**ext4 reserves 5% by default**) and hardlink counting. **ext4's
  inode count is fixed at mkfs**, so `df -i` can be full at 40% blocks; XFS allocates dynamically.
  Truncating (`: > file`) frees space where `rm` does not.
- **`free`'s `available` column**, not `free`, is what can be allocated; page cache is reclaimable.
  Linux **overcommits**, so `malloc` rarely fails and the failure surfaces as an OOM kill; the
  kernel logs `Out of memory: Killed process … anon-rss:…`. `oom_score_adj` runs -1000..1000.
  Container kills are scoped to the cgroup's `memory.max`, so the host can look healthy.
- **Linux load average counts runnable *and* uninterruptible (`D`) tasks** — Brendan Gregg's
  article is the primary source — so high load with idle CPU means I/O.
- **Summing `RSS` over-counts shared pages**; `PSS` in `/proc/<pid>/smaps_rollup` is the
  apportioned figure.
- **`ss -ltnp` needs root to name processes it does not own**; a `127.0.0.1` bind is unreachable
  externally; *refused* means an RST came back while *timed out* means silent drops.
- **`dig` bypasses NSS**, so it ignores `/etc/hosts`; `getent hosts` follows the same path the
  application does.
- **sshd `StrictModes`** refuses key auth when the home directory, `~/.ssh` or `authorized_keys` is
  group- or other-writable, and says nothing useful to the client.
- **`curl --resolve host:port:addr`** keeps SNI and the `Host` header correct, unlike
  `-H 'Host: …'` against a bare IP.
- **SELinux** contexts show as a trailing `.` in `ls -l`; a denial is an ordinary EACCES with
  correct-looking mode bits (`ausearch -m avc`, `dmesg | grep -i denied`).

## Assessment shape

All 15 topics are **quiz**, 166 questions, no code challenges: the sandbox runs JavaScript only
(`## v3 decisions` in `docs/PROGRESS.md`), so shell cannot be graded. Difficulty is carried by
predict-the-output questions on real snippets — `cmd 2>&1 > f`, `echo hi | read x`, `false | true`,
`local x=$(false)`, `sort` on `10/9/100`, `uniq` without `sort`, `find . -name *.log` unquoted,
`df` vs `du` output, a `203/EXEC` unit status. Every topic has at least two
`isEdgeCaseOrInterviewQuestion` (most have three or four) and at least one multi-select.

`content:check --module devops-linux-shell`: **0 errors, 0 warnings**. `content:types` is clean for
this file (the only error in the repo-wide run is an unused constant in
`src/content/frontend/fe-svelte.ts`, another camp being written in parallel).
