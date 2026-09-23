import type { Module } from "@/types/curriculum";

export default {
  id: "devops-networking-tls",
  trackId: "devops",
  name: "Networking, DNS & TLS",
  description:
    "The network as an application engineer meets it at 2am: why a connection hangs instead of failing, what a TTL costs you during a cutover, why curl trusts the certificate and the browser doesn't, and what ten thousand sockets in TIME_WAIT are doing to your connection pool. Protocols and mechanisms, not vendor consoles.",
  refs: [
    { label: "RFC 9293: Transmission Control Protocol", url: "https://datatracker.ietf.org/doc/html/rfc9293", kind: "spec" },
    { label: "RFC 1035: Domain Names — Implementation and Specification", url: "https://datatracker.ietf.org/doc/html/rfc1035", kind: "spec" },
    { label: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", url: "https://datatracker.ietf.org/doc/html/rfc8446", kind: "spec" },
    { label: "High Performance Browser Networking: Building Blocks of TCP", url: "https://hpbn.co/building-blocks-of-tcp/", kind: "article" },
  ],
  topics: [
    {
      id: "net-layers-in-practice",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "The Layers You Actually Debug",
      summary:
        "Nobody ships software because they can recite seven OSI layers. What the layering buys you is a triage order: each layer hides the one below it, so when something breaks you can bisect the stack instead of guessing. What actually runs is the four-layer model of RFC 1122 — link, internet (IP), transport (TCP/UDP), application (HTTP, DNS, anything wrapped in TLS) — and each layer adds a header on the way out and strips it on the way in.\n\nThe practical consequence of that encapsulation is who can see what. A switch reads MAC addresses; a router reads destination IPs; a security group or L4 load balancer reads IP and port; only something that parses the application protocol can read a URL path or a `Host` header, and if that traffic is inside TLS it must terminate the connection first. That is why \"route this to the API pods when the path starts with /api\" is impossible at L4 and trivial at L7, and why an L4 device can balance Postgres or Redis while an L7 one cannot.\n\nThe layer-crossing gotcha that costs the most hours is path MTU. Ethernet's 1500-byte MTU leaves a 1460-byte TCP payload; a VPN or tunnel shrinks it further. A router that has to forward an oversized packet with the Don't Fragment bit set is supposed to reply with ICMP \"fragmentation needed\" (RFC 1191), and a great many firewalls drop all ICMP. The result is a black hole: the handshake and small requests work perfectly, and the first large POST body hangs forever. Any time you hear \"small requests fine, big requests hang\", suspect MTU before you suspect your code.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "RFC 1122: Requirements for Internet Hosts — Communication Layers", url: "https://datatracker.ietf.org/doc/html/rfc1122", kind: "spec" },
        { label: "RFC 1191: Path MTU Discovery", url: "https://datatracker.ietf.org/doc/html/rfc1191", kind: "spec" },
        { label: "High Performance Browser Networking: Building Blocks of TCP", url: "https://hpbn.co/building-blocks-of-tcp/", kind: "article" },
      ],
      video: {
        title: "OSI Model: A Practical Perspective - Networking Fundamentals - Lesson 2a",
        channel: "Practical Networking",
        url: "https://www.youtube.com/watch?v=LkolbURrtTs",
        videoId: "LkolbURrtTs",
        durationLabel: "13:25",
      },
      alternateVideos: [
        {
          title: "The OSI Model by Example - The Backend Engineering Show with Hussein Nasser",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=eNF9z5JNl-A",
          videoId: "eNF9z5JNl-A",
          durationLabel: "31:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-layers-in-practice-q1",
          prompt:
            "Requests to an internal API succeed for small payloads but any POST with a body over about 1 KB hangs until the client times out. Routing, DNS and TLS all check out, and the traffic crosses a VPN. What is the most likely cause?",
          options: [
            "Path MTU discovery is black-holed: the ICMP \"fragmentation needed\" replies are being dropped, so oversized segments vanish",
            "The server's request body size limit is rejecting the payload",
            "TCP slow start has not ramped up yet, so large bodies are throttled to zero",
            "The VPN is downgrading the connection to HTTP/1.0, which cannot send bodies",
          ],
          correctIndex: 0,
          explanation:
            "A tunnel lowers the usable MTU. When a router must drop an oversized DF packet and its ICMP reply is filtered, the sender never learns to send smaller segments and retransmits the same too-big segment forever. A body limit would return a 413 quickly, not hang.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-layers-in-practice-q2",
          prompt: "`ping` to a host succeeds but `curl https://host/` times out on connect. What does that tell you?",
          options: [
            "ICMP is permitted to the host but TCP 443 is not reaching a listener — a filter or a missing listener, not a routing problem",
            "The host is down; ping replies are generated by the last router on the path",
            "DNS is broken, because ping and curl use different resolvers",
            "TLS is misconfigured, because a TLS failure presents as a connect timeout",
          ],
          correctIndex: 0,
          explanation:
            "ICMP echo and TCP are different protocols with different rules in every firewall. A reachable host proves routing works, so the failure sits at layer 4 or above. A TLS problem would happen after the connection opened, not instead of it.",
        },
        {
          id: "net-layers-in-practice-q3",
          prompt: "Which of these are true about how encapsulation constrains what a device can act on? (Select all that apply.)",
          options: [
            "An L4 load balancer can choose a backend by destination port but not by URL path",
            "A device must terminate TLS before it can route on the HTTP `Host` header",
            "A router rewrites the destination MAC address at every hop while the destination IP stays the same",
            "A switch can apply a rule based on the HTTP method of the request it is forwarding",
            "The TLS record layer encrypts the TCP and IP headers as well as the payload",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Each layer sees its own header and an opaque payload above it. Switches never parse HTTP, and TLS protects only the application data it carries — IP and TCP headers travel in the clear, which is exactly why L4 devices still work on encrypted traffic.",
        },
        {
          id: "net-layers-in-practice-q4",
          prompt: "An application calls `write()` twice, sending 100 bytes each time over one TCP connection. What can the receiver expect?",
          options: [
            "Any split it likes — one `read()` of 200 bytes, or three reads of 60, 60 and 80",
            "Exactly two reads of 100 bytes each, because TCP preserves write boundaries",
            "One read of 200 bytes, because TCP always coalesces writes",
            "Two reads, unless Nagle's algorithm is disabled",
          ],
          correctIndex: 0,
          explanation:
            "TCP is an ordered byte stream with no message boundaries, so framing is the application protocol's job (a length prefix, a delimiter, HTTP's `Content-Length`). UDP is the protocol that preserves datagram boundaries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-layers-in-practice-q5",
          prompt: "On a standard 1500-byte Ethernet MTU, what is the largest TCP payload an IPv4 segment can carry without fragmentation?",
          options: ["1460 bytes", "1500 bytes", "1480 bytes", "1420 bytes"],
          correctIndex: 0,
          explanation:
            "1500 minus a 20-byte IPv4 header and a 20-byte TCP header leaves 1460 — the MSS each side advertises in its SYN. Options, tunnels and IPv6's larger header all push the usable payload lower.",
        },
        {
          id: "net-layers-in-practice-q6",
          prompt: "`traceroute` to a working API shows `* * *` for hops 6 through 9 and then normal replies at hop 10. What should you conclude?",
          options: [
            "Probably nothing: many routers rate-limit or suppress the ICMP TTL-exceeded replies traceroute depends on",
            "Packets are being dropped at hop 6, so the request cannot be succeeding",
            "The route is asymmetric, which always means packet loss",
            "Those hops are running at a lower MTU",
          ],
          correctIndex: 0,
          explanation:
            "Traceroute relies on intermediate routers voluntarily sending ICMP time-exceeded messages, and silence there is routine. Only loss visible in the end-to-end connection — retransmissions, timeouts — is evidence of a real problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-layers-in-practice-q7",
          prompt: "Why is the TCP/IP stack described as four layers when the OSI model has seven?",
          options: [
            "RFC 1122 defines the layers that were actually implemented; OSI's session and presentation layers have no separate counterpart in practice",
            "The OSI model is newer and the industry has not adopted the extra layers yet",
            "TCP/IP merges the physical and application layers into one",
            "Three of the OSI layers only apply to wireless networks",
          ],
          correctIndex: 0,
          explanation:
            "OSI is a reference model; the internet was built to RFC 1122's link/internet/transport/application split. What people call \"layer 5/6\" — TLS, serialisation — lives inside the application layer in the model that actually shipped.",
        },
        {
          id: "net-layers-in-practice-q8",
          prompt:
            "You are told \"the network is slow\" for an internal service. Which single observation most cheaply separates a network problem from an application problem?",
          options: [
            "A `curl -w` timing breakdown showing how much time went to DNS, TCP connect, TLS and the first response byte",
            "The average CPU utilisation of the client machine over the last hour",
            "Whether `ping` round-trip times to the host look normal",
            "The number of open file descriptors on the client",
          ],
          correctIndex: 0,
          explanation:
            "The timing breakdown attributes latency to a layer directly: slow connect points at the network or a queue, while a fast connect with a slow `time_starttransfer` points at the application. Ping measures ICMP to the host, which says nothing about the service.",
        },
        {
          id: "net-layers-in-practice-q9",
          prompt: "A colleague proposes putting a Redis instance behind the same load balancer rule that routes HTTP by path. Why does that not work?",
          options: [
            "Path routing requires parsing HTTP; Redis speaks its own protocol, so it needs an L4 rule that forwards by port",
            "Redis cannot be load balanced at all because it is stateful",
            "Load balancers only support TCP on the HTTP and HTTPS ports",
            "Redis traffic is encrypted by default, so the balancer cannot inspect it",
          ],
          correctIndex: 0,
          explanation:
            "There is no path in a RESP command. Anything non-HTTP has to be balanced at layer 4 on the 4-tuple, which is precisely the tradeoff that makes L4 general and L7 clever.",
        },
      ],
    },
    {
      id: "net-ip-cidr",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "IP Addressing, Subnets and CIDR",
      summary:
        "CIDR (RFC 4632) replaced the old class A/B/C carve-up with a single idea: a prefix length says how many leading bits of the address identify the network, and everything after it is host space. `10.0.5.0/24` fixes the first 24 bits, so the block holds 2^(32-24) = 256 addresses, `10.0.5.0` through `10.0.5.255`. Every subnetting question is that one calculation plus bookkeeping, and reading a block correctly is a genuine skill: you use it every time you size a VPC, write a firewall rule, or work out why two networks cannot talk.\n\nTwo facts do most of the work. Block size always doubles or halves — a `/25` is half a `/24`, a `/26` a quarter — and a block must start on a multiple of its own size, so `10.0.5.64/26` is legal and `10.0.5.50/26` is not. On an ordinary broadcast subnet the first address is the network address and the last is the broadcast address, leaving `2^(32-n) - 2` usable hosts; cloud providers reserve more (AWS takes five per subnet), which is why a `/28` gives you eleven usable addresses rather than fourteen.\n\nThe private ranges of RFC 1918 — `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` — are not routable on the internet, and the middle one catches people constantly: `/12` spans `172.16.0.0` through `172.31.255.255`, so `172.32.0.1` is public address space belonging to someone else. Worth recognising alongside them: `127.0.0.0/8` loopback, `169.254.0.0/16` link-local (home of the `169.254.169.254` cloud metadata endpoint), and `100.64.0.0/10` carrier-grade NAT.\n\nThe expensive mistake is overlap. Two networks with overlapping CIDRs can never be peered or routed together without NAT, and Docker's default `172.17.0.0/16` bridge colliding with a corporate VPN route is a recurring outage that looks, from inside the container, like the VPN simply stopped existing.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "RFC 4632: Classless Inter-domain Routing (CIDR)", url: "https://datatracker.ietf.org/doc/html/rfc4632", kind: "spec" },
        { label: "RFC 1918: Address Allocation for Private Internets", url: "https://datatracker.ietf.org/doc/html/rfc1918", kind: "spec" },
        { label: "RFC 6890: Special-Purpose IP Address Registries", url: "https://datatracker.ietf.org/doc/html/rfc6890", kind: "spec" },
      ],
      video: {
        title: "How to solve ANY Subnetting Problems in 60 seconds or less - Subnetting Mastery - Part 3 of 7",
        channel: "Practical Networking",
        url: "https://www.youtube.com/watch?v=5-wlfAdcmFQ",
        videoId: "5-wlfAdcmFQ",
        durationLabel: "6:10",
      },
      alternateVideos: [
        {
          title: "What is Subnetting? - Subnetting Mastery - Part 1 of 7",
          channel: "Practical Networking",
          url: "https://www.youtube.com/watch?v=BWZ-MHIhqjM",
          videoId: "BWZ-MHIhqjM",
          durationLabel: "8:37",
        },
        {
          title: "1️⃣ CIDR, Subnet Mask, and Binary Subnet Mask Are the Exact Same Thing",
          channel: "Practical Networking",
          url: "https://www.youtube.com/watch?v=YPl3UZwvKqo",
          videoId: "YPl3UZwvKqo",
          durationLabel: "3:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-ip-cidr-q1",
          prompt: "How many addresses does `10.20.0.0/26` contain in total, and what is its last address?",
          options: [
            "64 addresses, ending at `10.20.0.63`",
            "26 addresses, ending at `10.20.0.25`",
            "32 addresses, ending at `10.20.0.31`",
            "128 addresses, ending at `10.20.0.127`",
          ],
          correctIndex: 0,
          explanation:
            "2^(32-26) = 64 addresses, so the block runs `.0` to `.63`. On a normal subnet 62 of those are usable hosts once you subtract the network and broadcast addresses.",
        },
        {
          id: "net-ip-cidr-q2",
          prompt: "Is `10.0.5.130` inside `10.0.5.128/25`?",
          options: [
            "Yes — a `/25` starting at `.128` covers `.128` through `.255`",
            "No — a `/25` covers only `.128` through `.191`",
            "No — `/25` blocks must start at `.0`",
            "Only if the router is configured for variable-length subnet masking",
          ],
          correctIndex: 0,
          explanation:
            "A `/25` is 128 addresses. Starting at `.128` it runs to `.255`, so `.130` is inside. The other `/25` in that `/24` is `10.0.5.0/25`, covering `.0`–`.127`.",
        },
        {
          id: "net-ip-cidr-q3",
          prompt: "Which of these addresses is **not** inside the RFC 1918 range `172.16.0.0/12`?",
          options: ["`172.32.0.1`", "`172.16.0.1`", "`172.20.55.9`", "`172.31.255.254`"],
          correctIndex: 0,
          explanation:
            "A `/12` fixes the first 12 bits, so the block spans `172.16.0.0` to `172.31.255.255`. `172.32.0.1` is outside it and is ordinary public address space — assign it internally and you can never reach whoever really owns it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ip-cidr-q4",
          prompt: "Which of these are reserved, non-internet-routable ranges you should recognise on sight? (Select all that apply.)",
          options: [
            "`10.0.0.0/8` — RFC 1918 private",
            "`169.254.0.0/16` — link-local, including the `169.254.169.254` metadata endpoint",
            "`127.0.0.0/8` — loopback",
            "`8.8.0.0/16` — reserved for public DNS resolvers",
            "`192.169.0.0/16` — private, adjacent to `192.168.0.0/16`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`8.8.8.8` is ordinary public space that Google happens to own, and the private range is `192.168.0.0/16` only — `192.169.x.x` belongs to someone else. The registry of record is RFC 6890.",
        },
        {
          id: "net-ip-cidr-q5",
          prompt: "You need to split `192.168.10.0/24` into four equal subnets. What prefix length do you use, and where does the third subnet start?",
          options: [
            "`/26`, third subnet starts at `192.168.10.128`",
            "`/26`, third subnet starts at `192.168.10.192`",
            "`/28`, third subnet starts at `192.168.10.32`",
            "`/22`, third subnet starts at `192.168.10.128`",
          ],
          correctIndex: 0,
          explanation:
            "Each halving adds one bit, so four equal pieces means `/24` + 2 bits = `/26`, 64 addresses each: `.0`, `.64`, `.128`, `.192`. A bigger number is a smaller block — `/22` would be four times larger, not smaller.",
        },
        {
          id: "net-ip-cidr-q6",
          prompt: "Team A runs a VPC on `10.0.0.0/16`. Team B wants to peer their VPC, which uses `10.0.128.0/17`. What happens?",
          options: [
            "It cannot be peered: `10.0.128.0/17` sits entirely inside `10.0.0.0/16`, so the ranges overlap",
            "It works — the more specific prefix always wins, so routing stays unambiguous",
            "It works only if both sides disable NAT",
            "It works but halves the available addresses on both sides",
          ],
          correctIndex: 0,
          explanation:
            "`10.0.0.0/16` covers `10.0.0.0`–`10.0.255.255`, which swallows the `/17`. Overlapping CIDRs make a destination address ambiguous, so peering is rejected outright. Allocate non-overlapping blocks before you build anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ip-cidr-q7",
          prompt: "In a route table or a security group rule, what does `0.0.0.0/0` mean?",
          options: [
            "Every IPv4 address — a prefix of zero bits constrains nothing",
            "Only the unspecified address `0.0.0.0`",
            "Only addresses in the local subnet",
            "No addresses at all; it is used to disable a rule",
          ],
          correctIndex: 0,
          explanation:
            "Zero fixed bits matches the entire address space — the default route, or \"open to the world\" in a firewall rule. Its IPv6 equivalent is `::/0`, and a rule allowing one does not cover the other.",
        },
        {
          id: "net-ip-cidr-q8",
          prompt:
            "Developers on the corporate VPN report that one internal service became unreachable the moment they started Docker, and only for them. The service lives at `172.17.4.20`. What happened?",
          options: [
            "Docker's default bridge is `172.17.0.0/16`, so the host now routes that whole range to the bridge instead of over the VPN",
            "Docker reserves the entire `172.16.0.0/12` range and blocks it at the firewall",
            "The VPN client refuses to run while a virtual bridge interface exists",
            "Docker rewrites `/etc/hosts` to point internal names at containers",
          ],
          correctIndex: 0,
          explanation:
            "A more specific on-link route to the bridge beats the VPN's route for the same addresses, so packets for `172.17.x.x` go to the docker0 bridge and die there. The fix is to move Docker's default address pool off a range your network already uses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ip-cidr-q9",
          prompt: "What does a `/32` prefix identify, and where would you normally see one?",
          options: [
            "Exactly one address — used for host routes and for allow-listing a single IP in a firewall rule",
            "The whole internet, because 32 is the maximum prefix length",
            "A block of 32 addresses starting at the given address",
            "An address that is not yet assigned",
          ],
          correctIndex: 0,
          explanation:
            "All 32 bits are fixed, so the block holds a single address: `203.0.113.7/32` in a security group means that one host. The IPv6 equivalent for a single address is `/128`.",
        },
        {
          id: "net-ip-cidr-q10",
          prompt: "You size a cloud subnet as a `/28` for a small service and are told only 11 addresses are usable. Why not 14?",
          options: [
            "The provider reserves extra addresses in every subnet — AWS takes five, which includes the network and broadcast addresses",
            "A `/28` contains 13 addresses, not 16",
            "The router always consumes half of the block",
            "The provider reserves one address per availability zone",
          ],
          correctIndex: 0,
          explanation:
            "A `/28` is 16 addresses; a plain subnet loses the network and broadcast addresses, leaving 14, and AWS reserves five in total — the first four and the last — leaving 11. Size subnets with that overhead in mind before you run out mid-scale-up.",
        },
      ],
    },
    {
      id: "net-ports-sockets",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "Ports, Sockets and Reading `ss`",
      summary:
        "A port is just a 16-bit number in the TCP or UDP header, but the unit that matters is the socket, and a TCP connection is identified by a 4-tuple: source IP, source port, destination IP, destination port. That is why a server on port 443 is not limited to 65,535 connections — every client contributes a different source IP and port, so the tuple stays unique. The real server-side ceilings are file descriptors (`ulimit -n`), memory per socket, and whatever your accept loop can keep up with.\n\nThe 65k limit is real in the other direction. When *your* process opens connections to one destination IP and port, each needs a distinct local port from the ephemeral range (`net.ipv4.ip_local_port_range`, typically 32768–60999, about 28,000 ports). A service that opens a fresh connection per request to a single upstream will exhaust that range and start failing with `EADDRNOTAVAIL` long before anything else breaks. Connection reuse, not sysctl tuning, is the fix.\n\n`ss` is the tool. `ss -tlnp` lists TCP listeners with the owning process; `ss -tanp` adds every connection and its state; `ss -tan state time-wait | wc -l` counts the thing people panic about. Read the address column carefully: `127.0.0.1:8080` accepts only loopback traffic, `0.0.0.0:8080` accepts on any IPv4 interface, and `[::]:8080` is the IPv6 wildcard, which with the default `bindv6only=0` usually serves IPv4 too. Binding to loopback inside a container is the single most common reason a published port answers nothing.\n\nOn a socket in `LISTEN`, `Recv-Q` is how many completed connections are waiting to be accepted and `Send-Q` is the backlog ceiling. A persistently non-zero `Recv-Q` means your accept loop is behind, and once the queue is full new handshakes are dropped in silence — which the client experiences as a slow timeout rather than a refusal.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "man7: ss(8) — socket statistics", url: "https://man7.org/linux/man-pages/man8/ss.8.html", kind: "docs" },
        { label: "Linux kernel docs: IP sysctl reference", url: "https://docs.kernel.org/networking/ip-sysctl.html", kind: "docs" },
        { label: "Cloudflare: The quantum state of a TCP port", url: "https://blog.cloudflare.com/the-quantum-state-of-a-tcp-port/", kind: "article" },
      ],
      video: {
        title: "Is there a Limit to Number of Connections a Backend can handle?",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=o-EkdZW4zbA",
        videoId: "o-EkdZW4zbA",
        startSeconds: 270,
        chapterLabel: "64K Connection Limit Explained",
        durationLabel: "18:42",
      },
      alternateVideos: [
        {
          title: "How to Use SS to Monitor Listening Ports on Your System",
          channel: "Red Hat Enterprise Linux",
          url: "https://www.youtube.com/watch?v=Qoragb-8Ufs",
          videoId: "Qoragb-8Ufs",
          durationLabel: "2:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-ports-sockets-q1",
          prompt:
            "A container is started with `-p 8080:8080` but requests to the host's port 8080 get \"connection refused\". Inside the container, `ss -tlnp` shows:\n\n```\nState   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process\nLISTEN  0       4096    127.0.0.1:8080       0.0.0.0:*          users:((\"node\",pid=1,fd=20))\n```\n\nWhat is wrong?",
          options: [
            "The process listens only on loopback, so traffic arriving on the container's own interface has nothing to connect to",
            "The published port mapping is backwards and should be `-p 8080:80`",
            "`Send-Q` of 4096 means the backlog is full and new connections are rejected",
            "Port 8080 is privileged and the process lacks permission to receive external traffic",
          ],
          correctIndex: 0,
          explanation:
            "`127.0.0.1` binds the loopback interface only. Port publishing forwards to the container's network interface, which this socket never accepts on. Bind `0.0.0.0` instead — the single most common containerisation bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ports-sockets-q2",
          prompt: "Why is a web server on port 443 not limited to roughly 65,000 simultaneous connections?",
          options: [
            "Connections are identified by the 4-tuple, so each distinct client IP and port is a unique connection to the same local port",
            "The kernel transparently moves accepted connections to unused high ports",
            "TLS multiplexes many logical connections into one socket",
            "Modern kernels use a 32-bit port field",
          ],
          correctIndex: 0,
          explanation:
            "Uniqueness is per 4-tuple, not per port, so the server side scales with descriptors and memory. The 65k ceiling applies to *outbound* connections from one source IP to one destination IP and port.",
        },
        {
          id: "net-ports-sockets-q3",
          prompt:
            "A service opens a new connection to one upstream `10.0.2.7:5432` for every request and starts failing with `EADDRNOTAVAIL` under load. Roughly how many such connections can it have outstanding with a default Linux ephemeral range, and what is the right fix?",
          options: [
            "About 28,000 — limited by `ip_local_port_range`; fix it with a connection pool rather than by widening the range",
            "About 65,000 — limited by the port field; fix it by adding more upstream ports",
            "Unlimited — `EADDRNOTAVAIL` means the upstream refused the connection",
            "About 1,024 — limited by `ulimit -n`; fix it by raising the descriptor limit",
          ],
          correctIndex: 0,
          explanation:
            "The default range 32768–60999 gives roughly 28,200 local ports per (destination IP, destination port) pair. Widening the range or shortening TIME_WAIT buys headroom; reusing connections removes the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ports-sockets-q4",
          prompt: "Which of these are true about `ss`? (Select all that apply.)",
          options: [
            "`-n` stops it resolving port numbers to service names, which makes it much faster",
            "On a `LISTEN` socket, `Recv-Q` is the number of connections waiting to be accepted",
            "`-p` shows the owning process, which usually needs root to see other users' sockets",
            "`ss` only reports TCP; UDP sockets need `netstat`",
            "`-t` restricts the output to sockets in the `ESTAB` state",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`-t` selects the TCP *protocol*, not a state (states are filtered with `state ...`), and `-u` does the same for UDP. `ss` reads socket data over netlink, which is why it stays fast on a host with a hundred thousand sockets.",
        },
        {
          id: "net-ports-sockets-q5",
          prompt: "A process running as a normal user fails to bind port 80 with `EACCES`. What is happening, and what are the usual options?",
          options: [
            "Ports below 1024 are privileged; grant `CAP_NET_BIND_SERVICE`, put a proxy in front, or lower `net.ipv4.ip_unprivileged_port_start`",
            "Port 80 is already in use by the kernel's built-in HTTP handler",
            "`EACCES` always means SELinux, and the only fix is to disable it",
            "Only ports above 32768 can be bound without root",
          ],
          correctIndex: 0,
          explanation:
            "Linux reserves ports below `ip_unprivileged_port_start` (1024 by default) for privileged processes. Running the whole service as root to get port 80 is the option you should reach for last.",
        },
        {
          id: "net-ports-sockets-q6",
          prompt: "You restart a service and it immediately fails with `EADDRINUSE`, even though the old process is gone. What is going on?",
          options: [
            "Connections from the old process are still in `TIME_WAIT` on that local port; `SO_REUSEADDR` lets the new listener bind anyway",
            "The kernel keeps listening sockets alive for 60 seconds after a process exits and nothing can change that",
            "The port became privileged because the process exited uncleanly",
            "Another process on a different interface has claimed the same port number",
          ],
          correctIndex: 0,
          explanation:
            "Lingering `TIME_WAIT` sockets associated with the old listener block a plain bind. `SO_REUSEADDR` — which most servers set for you — permits the rebind. `SO_REUSEPORT` is a different option that lets several processes share one listener to spread load.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ports-sockets-q7",
          prompt: "What does a listening socket shown as `[::]:8080` accept?",
          options: [
            "IPv6 on any interface, and usually IPv4 too via v4-mapped addresses unless `bindv6only` is set",
            "IPv6 loopback only",
            "IPv4 on any interface, but never IPv6",
            "Nothing until an IPv6 address is assigned to at least one interface",
          ],
          correctIndex: 0,
          explanation:
            "`::` is the IPv6 wildcard. With `net.ipv6.bindv6only` at its default of 0 the socket also receives IPv4 connections as `::ffff:a.b.c.d`, which is why you often see one `[::]` line and no `0.0.0.0` line for the same service.",
        },
        {
          id: "net-ports-sockets-q8",
          prompt: "`ss -tln` shows a listener with `Recv-Q 128` and `Send-Q 128` that never drops back to zero under load. What do clients experience?",
          options: [
            "The accept queue is full, so further handshakes are dropped and clients see slow connect timeouts rather than refusals",
            "Clients get an immediate `connection refused` because the queue rejects them",
            "Clients connect normally; that queue only affects outbound traffic",
            "Clients are redirected to another listener on the same port",
          ],
          correctIndex: 0,
          explanation:
            "On a `LISTEN` socket the queue holds completed connections the application has not accepted yet. Overflow is a silent drop by default, so the client retransmits its SYN on TCP's backoff schedule and eventually times out — a \"flaky network\" report caused by a stalled accept loop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-ports-sockets-q9",
          prompt: "Two different services are shown listening on port 8080 on the same host and neither has failed. How is that possible?",
          options: [
            "They are bound to different local addresses, for example `127.0.0.1:8080` and `10.0.1.5:8080`",
            "Ports can be shared freely as long as the processes belong to different users",
            "One is IPv4 and the other is a UDP socket, and UDP has no ports",
            "The second one silently replaced the first when it started",
          ],
          correctIndex: 0,
          explanation:
            "A bind is on an (address, port) pair, so distinct addresses do not conflict — and TCP 8080 and UDP 8080 are separate namespaces entirely. `SO_REUSEPORT` is the other legitimate way several sockets share one address and port.",
        },
      ],
    },
    {
      id: "net-tcp-connections",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "TCP: the Handshake, Connection States and TIME_WAIT",
      summary:
        "TCP's three-way handshake is not ceremony: SYN, SYN-ACK and ACK exist so both sides exchange and acknowledge an initial sequence number, which is what makes ordering, retransmission and duplicate rejection possible. The kernel keeps two queues behind a listener — half-open connections waiting for the final ACK, and completed connections waiting for your `accept()` — and both can overflow. Overflow is a silent drop, so the client retransmits its SYN on an exponential schedule and reports a timeout, never a refusal.\n\nShutdown is where the state machine earns its keep. Each direction is closed separately with a FIN, and the side that sends the *first* FIN — the active closer — ends up in `TIME_WAIT` for twice the maximum segment lifetime (a fixed 60 seconds on Linux) after the exchange completes. That state exists to absorb delayed duplicates from the old connection and to keep enough state around to re-send the final ACK if it is lost. Thousands of `TIME_WAIT` sockets on your application server therefore mean your application is the one closing connections — almost always because it opens a fresh connection per request instead of keeping them alive. The fix is connection reuse. It is not `tcp_tw_recycle`, which broke NAT'd clients and was removed in Linux 4.12; `tcp_tw_reuse` is the surviving, outbound-only option.\n\n`CLOSE_WAIT` is the state worth being frightened of. It means the peer sent a FIN, the kernel acknowledged it, and *your application never called `close()`*. Nothing times it out. A growing `CLOSE_WAIT` count is a file-descriptor leak in your code, not a network problem.\n\nThe last trap is silence. TCP keepalive is off by default in most runtimes and, when enabled, waits two hours before the first probe, so a connection whose peer vanished without a FIN can sit in `ESTABLISHED` indefinitely. Application-level timeouts and keepalives set below every idle timeout on the path are what keep pools honest.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "RFC 9293: Transmission Control Protocol", url: "https://datatracker.ietf.org/doc/html/rfc9293", kind: "spec" },
        { label: "Vincent Bernat: Coping with the TCP TIME-WAIT state on busy Linux servers", url: "https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux", kind: "article" },
        { label: "Linux kernel docs: IP sysctl reference", url: "https://docs.kernel.org/networking/ip-sysctl.html", kind: "docs" },
      ],
      video: {
        title: "TCP connection walkthrough | Networking tutorial (13 of 13)",
        channel: "Ben Eater",
        url: "https://www.youtube.com/watch?v=F27PLin3TV0",
        videoId: "F27PLin3TV0",
        durationLabel: "9:30",
      },
      alternateVideos: [
        {
          title: "Lec-71: TCP connection Establishment and connection Termination | Transport layer",
          channel: "Gate Smashers",
          url: "https://www.youtube.com/watch?v=qIEHUUt2Wfc",
          videoId: "qIEHUUt2Wfc",
          durationLabel: "15:11",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-tcp-connections-q1",
          prompt:
            "On an API server you run `ss -tan state time-wait | wc -l` and get 26,000, while the database it talks to shows almost none. What does that tell you?",
          options: [
            "The API server is the active closer — it closes connections to the database instead of reusing them",
            "The database is dropping connections abruptly without sending a FIN",
            "The kernel is leaking sockets and needs a reboot",
            "The API server is under a SYN flood from the database",
          ],
          correctIndex: 0,
          explanation:
            "Only the side that sends the first FIN enters `TIME_WAIT`. A pile of them locally means your process opens and closes connections per request; a connection pool or HTTP keep-alive moves the closing — and the state — elsewhere, or removes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tcp-connections-q2",
          prompt: "Someone proposes fixing that by setting `net.ipv4.tcp_fin_timeout = 10`. What will actually change?",
          options: [
            "Nothing for `TIME_WAIT`: that sysctl controls how long an orphaned socket stays in `FIN_WAIT_2`",
            "`TIME_WAIT` drops from 60 seconds to 10, resolving the problem",
            "It disables `TIME_WAIT` entirely for outbound connections",
            "It shortens the handshake timeout, so failures surface faster",
          ],
          correctIndex: 0,
          explanation:
            "`tcp_fin_timeout` is the `FIN_WAIT_2` timeout. Linux hardcodes `TIME_WAIT` at 60 seconds and gives you no sysctl for it — which is the point of the state, and the reason reuse is the only real fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tcp-connections-q3",
          prompt: "A long-running service accumulates sockets in `CLOSE_WAIT` that never disappear. What does that indicate?",
          options: [
            "The peer closed its side and the application never called `close()` on the socket — a descriptor leak in your code",
            "The kernel is waiting out 2×MSL before releasing the socket",
            "The peer is refusing to acknowledge your FIN",
            "The socket is waiting for the TCP keepalive timer to expire",
          ],
          correctIndex: 0,
          explanation:
            "`CLOSE_WAIT` means \"the remote is done, the local application has not finished\". There is no timeout on it, so the count only grows until you run out of file descriptors. `TIME_WAIT`, by contrast, clears itself after 60 seconds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tcp-connections-q4",
          prompt: "What does the three-way handshake actually establish?",
          options: [
            "Both sides' initial sequence numbers, each acknowledged by the other, plus negotiated options such as MSS and window scaling",
            "The encryption keys used for the rest of the connection",
            "A route through the network that all subsequent packets will follow",
            "The application protocol that will be spoken, via ALPN",
          ],
          correctIndex: 0,
          explanation:
            "Sequence numbers are the foundation of ordering and retransmission, and the SYNs carry the options. Encryption is TLS's job, routing is per-packet, and ALPN happens inside the TLS handshake.",
        },
        {
          id: "net-tcp-connections-q5",
          prompt:
            "Your service opens connections to a single upstream `10.0.2.7:443` and closes each one. With the default ephemeral range and Linux's `TIME_WAIT` duration, roughly what sustained connection rate can it reach before it runs out of local ports?",
          options: [
            "About 470 new connections per second (≈28,000 ports ÷ 60 seconds)",
            "About 28,000 per second, because ports are released immediately after close",
            "About 65,000 per second, the size of the port space",
            "There is no limit; the kernel reuses ports as soon as the FIN is sent",
          ],
          correctIndex: 0,
          explanation:
            "Every closed connection holds its local port for the 60-second `TIME_WAIT`, so the sustainable rate is the port count divided by that window. It is a startlingly low number, and it is why per-request connections quietly cap throughput.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tcp-connections-q6",
          prompt: "Which of these genuinely help with ephemeral port exhaustion caused by `TIME_WAIT`? (Select all that apply.)",
          options: [
            "Reusing connections with a pool or HTTP keep-alive so far fewer are opened",
            "Widening `net.ipv4.ip_local_port_range`",
            "Spreading traffic across more destination addresses or ports, which changes the 4-tuple",
            "Enabling `net.ipv4.tcp_tw_recycle`",
            "Raising `ulimit -n` on the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reuse is the real fix, and the other two buy headroom by enlarging the tuple space. `tcp_tw_recycle` mangled connections from NAT'd clients and was removed in Linux 4.12; descriptor limits are a different ceiling entirely.",
        },
        {
          id: "net-tcp-connections-q7",
          prompt: "A client's connection attempt hangs for seconds and then fails, with no RST anywhere. Which explanations fit?",
          options: [
            "The SYN was dropped — by a filter, or by a full accept queue on the server",
            "The server sent a RST because nothing was listening",
            "The server's TLS certificate expired",
            "The client's DNS lookup returned NXDOMAIN",
          ],
          correctIndex: 0,
          explanation:
            "Silence means a packet was discarded without notification, so the client works through its SYN retransmission schedule before giving up. A RST would have produced an immediate \"connection refused\", and both DNS and TLS failures give distinct, faster errors.",
        },
        {
          id: "net-tcp-connections-q8",
          prompt: "TCP keepalive is enabled on a socket with Linux defaults. How long can a connection whose peer disappeared stay in `ESTABLISHED`?",
          options: [
            "Over two hours: the first probe is only sent after `tcp_keepalive_time`, which defaults to 7200 seconds",
            "60 seconds, the same as `TIME_WAIT`",
            "It is detected immediately, because the kernel polls the peer every second",
            "Until the next data is sent, at which point the connection is dropped instantly",
          ],
          correctIndex: 0,
          explanation:
            "The default keepalive idle time is two hours, and only then do the probes start. That is why applications set their own timeouts, and why pools configure keepalive well below any NAT or load-balancer idle timeout on the path.",
        },
        {
          id: "net-tcp-connections-q9",
          prompt: "What is a SYN flood exploiting, and what is syncookies' answer to it?",
          options: [
            "It fills the half-open queue with SYNs that never complete; syncookies encode the connection state in the sequence number so no queue entry is needed",
            "It exhausts the server's bandwidth; syncookies compress the handshake packets",
            "It exhausts file descriptors; syncookies close idle sockets sooner",
            "It abuses keepalive probes; syncookies disable keepalive during an attack",
          ],
          correctIndex: 0,
          explanation:
            "Half-open connections cost kernel memory, so spoofed SYNs that never send the third packet can fill the queue. Syncookies make the server stateless until the ACK returns, at the cost of dropping some TCP options.",
        },
        {
          id: "net-tcp-connections-q10",
          prompt:
            "A request/response protocol over TCP shows a consistent ~40 ms pause on small writes. What classic interaction explains it, and what turns it off?",
          options: [
            "Nagle's algorithm holding a small segment while the peer's delayed ACK waits for more data — disable it with `TCP_NODELAY`",
            "Slow start limiting the congestion window — disable it with `TCP_QUICKACK`",
            "The 40 ms retransmission timer firing on every small write — raise `tcp_fin_timeout`",
            "The receive window closing, which requires larger socket buffers",
          ],
          correctIndex: 0,
          explanation:
            "Nagle waits for an outstanding ACK before sending another small segment, while delayed ACK waits for data to piggyback on — a deadlock broken only by the delayed-ACK timer. `TCP_NODELAY` is why nearly every RPC library sets it by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tcp-connections-q11",
          prompt: "Why does closing a connection take four segments (FIN, ACK, FIN, ACK) rather than three?",
          options: [
            "Each direction is shut down independently, so one side can keep sending after the other has finished",
            "The extra segment carries the final checksum of the stream",
            "TCP always mirrors the handshake, which is also four segments",
            "The fourth segment tells the router to release the NAT mapping",
          ],
          correctIndex: 0,
          explanation:
            "TCP connections are full-duplex and half-close is legal, so each side closes its own direction. The two middle segments are often combined when the peer has nothing left to send, which is why you frequently see three.",
        },
      ],
    },
    {
      id: "net-udp",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "UDP and When Losing Packets Is Fine",
      summary:
        "UDP (RFC 768) is an eight-byte header over IP: source port, destination port, length, checksum. No handshake, no ordering, no retransmission, no congestion control, no connection state. What it does give you — and TCP does not — is message boundaries: one `sendto` is one `recvfrom`, whole or not at all. That single property is why DNS, syslog, StatsD, mDNS, RTP and QUIC all sit on UDP.\n\nReach for it when a late packet is worthless or when a round trip costs more than a loss. A DNS query and its answer fit in one exchange, so a handshake would triple the latency for no benefit; in real-time audio, retransmitting a frame you should have played 200 ms ago is worse than concealing the gap; for metrics, a lost sample is cheaper than back-pressuring the application that emitted it. Reach for TCP whenever you would otherwise end up reimplementing acknowledgements, ordering and congestion control — badly. That is the honest reading of RFC 8085: if you need reliability, you need congestion control too, and that is a large piece of engineering.\n\nThe gotchas are all about silence. Send faster than the receiver drains its socket buffer and the kernel discards datagrams without telling anyone, which is why metrics \"go missing\" precisely when a system is busiest. A datagram larger than the path MTU gets fragmented at the IP layer, and losing any one fragment loses the whole datagram — the reason DNS keeps responses small, sets the truncated bit and retries over TCP, and the reason EDNS(0) buffer sizes are tuned down rather than up. And NAT devices invent connection state for UDP that TCP would have made explicit: a mapping idle for as little as 30 seconds may be reclaimed, so a long-quiet UDP flow simply stops working with no error anywhere.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "RFC 768: User Datagram Protocol", url: "https://datatracker.ietf.org/doc/html/rfc768", kind: "spec" },
        { label: "RFC 8085: UDP Usage Guidelines", url: "https://datatracker.ietf.org/doc/html/rfc8085", kind: "spec" },
        { label: "High Performance Browser Networking: Building Blocks of UDP", url: "https://hpbn.co/building-blocks-of-udp/", kind: "article" },
      ],
      video: {
        title: "TCP vs UDP Crash Course",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=qqRYkcta6IE",
        videoId: "qqRYkcta6IE",
        startSeconds: 1465,
        chapterLabel: "UDP pros cons",
        durationLabel: "40:29",
      },
      alternateVideos: [
        {
          title: "TCP vs UDP Comparison",
          channel: "PowerCert Animated Videos",
          url: "https://www.youtube.com/watch?v=uwoD5YsGACg",
          videoId: "uwoD5YsGACg",
          durationLabel: "4:37",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-udp-q1",
          prompt: "An application sends two 100-byte datagrams over UDP. What does the receiver get?",
          options: [
            "Two reads of 100 bytes each, in either order, or possibly only one of them",
            "One read of 200 bytes, because UDP coalesces small sends",
            "Two reads of 100 bytes each, guaranteed in order",
            "Whatever split the kernel chooses, exactly as with TCP",
          ],
          correctIndex: 0,
          explanation:
            "UDP preserves message boundaries, so a datagram arrives whole or not at all — but it guarantees neither delivery nor ordering. TCP is the opposite on both counts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-udp-q2",
          prompt: "Which of these are genuinely good reasons to choose UDP? (Select all that apply.)",
          options: [
            "A single query and reply fit in one exchange, so a handshake would only add a round trip",
            "Late data is worthless, as in live audio or video",
            "You want to build your own reliability and flow control, as QUIC does",
            "You want guaranteed delivery with lower overhead than TCP",
            "Your payloads are large and you want the kernel to reassemble them reliably",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "UDP does not offer guaranteed delivery at any overhead, and IP fragmentation makes large datagrams *less* reliable, not more — one lost fragment discards the whole thing.",
        },
        {
          id: "net-udp-q3",
          prompt:
            "A DNS response is too large for the client's advertised UDP buffer. What does the server do, and what does a well-behaved client do next?",
          options: [
            "The server sets the truncated (TC) bit and the client retries the same query over TCP",
            "The server splits the answer across several UDP datagrams that the client reassembles",
            "The server returns SERVFAIL and the client tries a different resolver",
            "The server drops the response silently and waits for a retry",
          ],
          correctIndex: 0,
          explanation:
            "The TC bit is DNS's explicit \"ask me again over TCP\" signal. It is why blocking TCP port 53 at a firewall breaks DNSSEC and large answers while leaving ordinary lookups working — a very confusing partial failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-udp-q4",
          prompt: "A StatsD agent sends metrics over UDP. During traffic spikes, dashboards show gaps. What is the most likely mechanism?",
          options: [
            "The receiver's socket buffer overflows and the kernel discards datagrams with no error to the sender",
            "The sender blocks until the receiver catches up, delaying the metrics",
            "UDP retransmits the datagrams, which arrive too late to be graphed",
            "The metrics are rejected because UDP checksums fail under load",
          ],
          correctIndex: 0,
          explanation:
            "UDP has no back-pressure: an over-full receive buffer drops datagrams silently, and the counter for it lives in `netstat -su`, not in your application. It is a deliberate tradeoff — metrics must never slow down the service they measure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-udp-q5",
          prompt: "Why was QUIC built on UDP rather than as a new protocol number alongside TCP?",
          options: [
            "Middleboxes and NATs across the internet only reliably pass TCP and UDP, and UDP lets the transport live in userspace so it can be updated with the application",
            "UDP is the only protocol that supports encryption",
            "IP has no free protocol numbers left",
            "UDP guarantees lower latency than any other transport at the IP layer",
          ],
          correctIndex: 0,
          explanation:
            "Ossification is the real constraint: anything that is not TCP or UDP gets dropped somewhere. Shipping the transport in userspace also means QUIC improvements roll out with browser releases rather than kernel upgrades.",
        },
        {
          id: "net-udp-q6",
          prompt: "What is the status of the UDP checksum in IPv4 and IPv6?",
          options: [
            "Optional in IPv4 (zero means \"not computed\") and mandatory in IPv6",
            "Mandatory in both, since it is the only integrity check UDP has",
            "Optional in both; the IP header checksum covers the payload anyway",
            "Mandatory in IPv4 and optional in IPv6, where the link layer handles it",
          ],
          correctIndex: 0,
          explanation:
            "IPv6 removed the IP header checksum, so UDP's became mandatory to keep some end-to-end integrity check. Either way it detects corruption, not loss — nothing in UDP tells you a datagram never arrived.",
        },
        {
          id: "net-udp-q7",
          prompt:
            "A UDP-based service behind a NAT works fine while traffic flows but stops receiving after a quiet period, with no error on either side. Why?",
          options: [
            "The NAT reclaimed the port mapping after an idle timeout, which for UDP can be as short as 30 seconds",
            "The socket was closed by the kernel because UDP connections expire",
            "The client's ephemeral port was reassigned to another process",
            "The server stopped because it never received a keepalive FIN",
          ],
          correctIndex: 0,
          explanation:
            "UDP has no connection, so the NAT invents one and guesses when it is over. Protocols that need long-lived UDP paths — VoIP, VPNs, QUIC — send periodic keepalives purely to hold the mapping open.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-udp-q8",
          prompt: "How large is the UDP header compared with a minimal TCP header, and why does that matter in practice?",
          options: [
            "8 bytes versus 20 — it matters far less than the absence of handshakes and retransmission timers",
            "8 bytes versus 20 — the saved bytes are the main reason UDP is faster",
            "20 bytes versus 20 — the headers are the same size",
            "4 bytes versus 40 — UDP omits the port numbers",
          ],
          correctIndex: 0,
          explanation:
            "Twelve bytes per packet is noise. UDP is \"faster\" because it does less work — no handshake, no ordering, no congestion control — and you often pay for that at the application layer instead.",
        },
        {
          id: "net-udp-q9",
          prompt: "Which statement about UDP and congestion is correct?",
          options: [
            "UDP has no congestion control, so an application that floods a link can starve TCP flows sharing it — RFC 8085 makes managing that the application's job",
            "UDP uses the same congestion window algorithm as TCP, applied per datagram",
            "Routers apply congestion control to UDP on the sender's behalf",
            "UDP cannot cause congestion because datagrams are dropped rather than queued",
          ],
          correctIndex: 0,
          explanation:
            "TCP backs off when it sees loss; a naive UDP sender does not, so it takes an unfair share of a congested link. Anything sending bulk data over UDP — QUIC included — has to implement congestion control itself.",
        },
      ],
    },
    {
      id: "net-http-versions-quic",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "HTTP/1.1 vs HTTP/2 vs HTTP/3 and Head-of-Line Blocking",
      summary:
        "The semantics of HTTP — methods, status codes, headers, caching — are defined once, in RFC 9110, and are identical across versions. What changes between 1.1, 2 and 3 is framing and transport, and every difference traces back to one problem: head-of-line blocking.\n\nHTTP/1.1 sends one response at a time per connection, so a slow response blocks everything queued behind it on that connection. Browsers worked around it by opening about six connections per origin, and pipelining — the official fix — failed in practice because responses still had to come back in order and intermediaries mangled it. HTTP/2 replaced the text protocol with binary framing: many streams multiplexed over one connection, headers compressed with HPACK, and no six-connection ceiling. It removed application-level head-of-line blocking, but not the transport kind. All those streams ride one TCP connection, and TCP delivers bytes strictly in order, so a single lost packet stalls *every* stream until it is retransmitted. On a clean datacentre link HTTP/2 is a clear win; over a lossy mobile link it can be slower than HTTP/1.1's six independent connections.\n\nHTTP/3 fixes that by changing transport. QUIC (RFC 9000) runs over UDP, implements its own per-stream reliability so a loss only stalls the stream that lost a packet, folds TLS 1.3 into the transport handshake (one round trip for a new connection, zero with resumption), and identifies connections by a connection ID rather than the 4-tuple — so a phone moving from Wi-Fi to cellular keeps the same connection instead of reconnecting. QPACK replaces HPACK so header compression does not reintroduce ordering dependencies.\n\nThe tradeoffs are real. QUIC lives in userspace and costs noticeably more CPU per byte than kernel TCP; some networks throttle or block UDP entirely, so clients need a fallback path; and a browser only learns HTTP/3 is available from an `Alt-Svc` header or an HTTPS DNS record after connecting over TCP the first time. Meanwhile the classic HTTP/1.1 optimisations — domain sharding, sprite sheets, inlining — become counterproductive once you are multiplexing over a single connection.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "RFC 9114: HTTP/3", url: "https://datatracker.ietf.org/doc/html/rfc9114", kind: "spec" },
        { label: "RFC 9000: QUIC — A UDP-Based Multiplexed and Secure Transport", url: "https://datatracker.ietf.org/doc/html/rfc9000", kind: "spec" },
        { label: "Cloudflare: HTTP/3 vs HTTP/2", url: "https://blog.cloudflare.com/http-3-vs-http-2/", kind: "article" },
        { label: "High Performance Browser Networking: HTTP/2", url: "https://hpbn.co/http2/", kind: "article" },
      ],
      video: {
        title: "HTTP/2 Critical Limitation that led to HTTP/3 & QUIC (Explained by Example)",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=GriONb4EfPY",
        videoId: "GriONb4EfPY",
        durationLabel: "9:51",
      },
      alternateVideos: [
        {
          title: "Everything You Need to Know About QUIC and HTTP3",
          channel: "NGINX",
          url: "https://www.youtube.com/watch?v=_QQX0Ezpq8U",
          videoId: "_QQX0Ezpq8U",
          durationLabel: "29:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-http-versions-quic-q1",
          prompt: "HTTP/2 multiplexes many streams over one connection. Where can head-of-line blocking still occur, and why?",
          options: [
            "In TCP: a single lost segment stalls delivery of every stream on that connection until it is retransmitted",
            "Nowhere — multiplexing removes head-of-line blocking at every layer",
            "In HPACK, which forces headers to be decoded in request order regardless of transport",
            "In the browser's six-connections-per-origin limit, which HTTP/2 keeps",
          ],
          correctIndex: 0,
          explanation:
            "TCP delivers an in-order byte stream, so the kernel holds back everything after a gap even if it belongs to a different HTTP/2 stream. HTTP/3 solves it by moving reliability into QUIC, per stream.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-http-versions-quic-q2",
          prompt: "Which of these changed between HTTP/1.1 and HTTP/2? (Select all that apply.)",
          options: [
            "Messages are framed in binary rather than as text",
            "Many requests can be in flight concurrently on one connection",
            "Headers are compressed with a shared dynamic table (HPACK)",
            "The set of status codes and their meanings",
            "The default port for HTTPS traffic",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "HTTP/2 changed only the wire format; semantics are shared across all versions by RFC 9110, and both still use 443. That separation is what lets a proxy speak HTTP/2 to the client and HTTP/1.1 to the origin.",
        },
        {
          id: "net-http-versions-quic-q3",
          prompt:
            "A browser first connects to your site over HTTPS and TCP. How does it discover that HTTP/3 is available?",
          options: [
            "From an `Alt-Svc` response header (or an HTTPS DNS record) advertising `h3`, which it uses on a later connection",
            "It always tries QUIC first and falls back to TCP after a timeout",
            "From an ALPN entry in the TCP-based TLS handshake",
            "From a 426 Upgrade Required response",
          ],
          correctIndex: 0,
          explanation:
            "`Alt-Svc: h3=\":443\"; ma=86400` is the standard advertisement, and an HTTPS/SVCB DNS record can carry it before the first connection. ALPN negotiates within a connection, so it cannot advertise a different transport.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-http-versions-quic-q4",
          prompt: "How many round trips does a *new* QUIC connection need before the client can send its first HTTP request?",
          options: [
            "One, because QUIC's transport and TLS 1.3 handshakes are combined",
            "Two, one for the transport handshake and one for TLS",
            "Three, matching TCP plus TLS 1.2",
            "Zero, always — QUIC connections are stateless",
          ],
          correctIndex: 0,
          explanation:
            "QUIC carries the TLS 1.3 handshake inside its own, so a fresh connection costs one round trip versus two for TCP + TLS 1.3. Zero-RTT is only possible when resuming a previous session.",
        },
        {
          id: "net-http-versions-quic-q5",
          prompt: "Why must 0-RTT data be restricted to certain requests?",
          options: [
            "0-RTT data can be captured and replayed by an attacker, so it must only carry idempotent requests",
            "0-RTT data is sent unencrypted until the handshake completes",
            "0-RTT only supports requests smaller than one packet",
            "0-RTT disables certificate validation for the first request",
          ],
          correctIndex: 0,
          explanation:
            "Early data has no forward-secrecy guarantee against replay, because the server cannot yet prove freshness. Sending a GET twice is harmless; sending a payment POST twice is not, which is why servers restrict what 0-RTT may carry.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-http-versions-quic-q6",
          prompt: "A phone on a QUIC connection moves from Wi-Fi to cellular, changing its IP address. What happens?",
          options: [
            "The connection survives: QUIC identifies it by a connection ID rather than by the 4-tuple",
            "The connection drops and the client must redo the handshake",
            "The connection survives only if both networks are behind the same NAT",
            "The server sends a redirect to the new address",
          ],
          correctIndex: 0,
          explanation:
            "Connection migration is a headline QUIC feature and impossible in TCP, where the 4-tuple *is* the connection. It matters most on mobile, where address changes are routine.",
        },
        {
          id: "net-http-versions-quic-q7",
          prompt:
            "You run `curl -v https://api.example.com/` and the trace includes:\n\n```\n* ALPN: offers h2,http/1.1\n* ALPN: server accepted h2\n* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256\n```\n\nWhat does this tell you?",
          options: [
            "The protocol was negotiated inside the TLS handshake via ALPN, and this connection speaks HTTP/2",
            "The server redirected the request to an HTTP/2 endpoint after the TLS handshake",
            "The client sent an `Upgrade: h2c` header that the server accepted",
            "HTTP/3 was attempted first and fell back to HTTP/2",
          ],
          correctIndex: 0,
          explanation:
            "ALPN (RFC 7301) carries the protocol list in the ClientHello so no extra round trip is needed. `h2c` — HTTP/2 without TLS via Upgrade — exists in the spec but no major browser implements it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-http-versions-quic-q8",
          prompt: "Why is domain sharding — splitting assets across `img1.`, `img2.`, `img3.` — an anti-pattern under HTTP/2?",
          options: [
            "It forces extra DNS lookups, connections and TLS handshakes to work around a connection limit that no longer exists",
            "HTTP/2 refuses to load subresources from more than one hostname",
            "Sharding breaks HPACK, which requires all requests to share one hostname",
            "Browsers cache sharded assets for a shorter time",
          ],
          correctIndex: 0,
          explanation:
            "Sharding existed to beat the six-connections-per-origin limit. With multiplexing you want fewer connections, not more, so the workaround becomes pure overhead — the same reason bundling everything into one file became less useful.",
        },
        {
          id: "net-http-versions-quic-q9",
          prompt: "Under what conditions can HTTP/2 perform *worse* than HTTP/1.1?",
          options: [
            "On a lossy link, where one connection's retransmissions stall all streams while HTTP/1.1's six connections fail independently",
            "Whenever responses are larger than 1 MB, because binary framing adds overhead per frame",
            "When the server supports more than 100 concurrent streams",
            "When the client requests fewer than six resources",
          ],
          correctIndex: 0,
          explanation:
            "Concentrating everything on one TCP connection concentrates the cost of loss. Independent connections degrade gracefully; a single multiplexed one degrades all at once. This is exactly the problem QUIC was designed to remove.",
        },
        {
          id: "net-http-versions-quic-q10",
          prompt: "Your CDN reports a meaningful share of clients never using HTTP/3 despite it being enabled. What is the most likely explanation?",
          options: [
            "Their networks block or throttle UDP, so clients fall back to TCP",
            "Those clients do not support TLS 1.3",
            "HTTP/3 requires a dedicated port that those clients cannot reach",
            "Their DNS resolvers strip the `Alt-Svc` header",
          ],
          correctIndex: 0,
          explanation:
            "Corporate firewalls frequently permit only TCP 80 and 443, and some carriers deprioritise UDP. Clients therefore probe QUIC and quietly fall back, which is why you always keep the TCP path healthy. `Alt-Svc` is an HTTP header, not something DNS touches.",
        },
      ],
    },
    {
      id: "net-nat-private-ranges",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "NAT, Private Ranges and Why Your Container Can't Reach That",
      summary:
        "NAT rewrites addresses in flight and remembers the mapping so replies can be translated back (RFC 3022). Because almost all deployments also rewrite the port, one public address can front thousands of private hosts. Three consequences follow, and all three cause incidents.\n\nFirst, direction becomes asymmetric. An outbound connection creates a mapping, so replies find their way home; an inbound connection has no mapping and is simply dropped. Clients connect, servers listen — and a service that needs to be reachable needs an explicit port forward, a load balancer or a reverse tunnel. Second, the mapping is *state with a timeout*. A flow idle longer than the timeout is silently reclaimed, so the next packet on a \"live\" connection goes nowhere: this is why a database pool behind an AWS NAT gateway, whose idle timeout is 350 seconds, starts throwing read timeouts on connections it has held open for hours. TCP keepalives set below the shortest timeout on the path are the fix. Third, the server sees one address for everyone behind the NAT, so IP-based rate limiting and allow-listing become blunt instruments.\n\nContainers make all of this local. Docker's default bridge puts each container in its own network namespace with an address in `172.17.0.0/16` and masquerades outbound traffic behind the host. `localhost` inside the container therefore means *the container*, which is why pointing an app at `localhost:5432` to reach Postgres on the host produces an instant connection refused; use the service name on a user-defined network, or `host.docker.internal`. Containers on the *default* bridge cannot resolve each other by name at all — only user-defined networks get Docker's embedded DNS. And publishing a port with `-p 8080:8080` does nothing if the process inside bound `127.0.0.1`, because the forwarded traffic arrives on the container's interface, not its loopback.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "RFC 3022: Traditional IP Network Address Translator", url: "https://datatracker.ietf.org/doc/html/rfc3022", kind: "spec" },
        { label: "Docker docs: Networking overview", url: "https://docs.docker.com/engine/network/", kind: "docs" },
        { label: "Tailscale: How NAT traversal works", url: "https://tailscale.com/blog/how-nat-traversal-works", kind: "article" },
      ],
      video: {
        title: "NAT vs PAT, Static vs Dynamic -- demystified! -- Network Address Translation",
        channel: "Practical Networking",
        url: "https://www.youtube.com/watch?v=KA56kj23RPU",
        videoId: "KA56kj23RPU",
        durationLabel: "7:06",
      },
      alternateVideos: [
        {
          title: "Network Address Translation - NAT Explained",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=RG97rvw1eUo",
          videoId: "RG97rvw1eUo",
          durationLabel: "21:27",
        },
        {
          title: "docker: connecting to localhost outside the container (intermediate) anthony explains #555",
          channel: "anthonywritescode",
          url: "https://www.youtube.com/watch?v=NZGu-9KQVsE",
          videoId: "NZGu-9KQVsE",
          durationLabel: "7:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-nat-private-ranges-q1",
          prompt:
            "An app in a container is configured with `DATABASE_URL=postgres://localhost:5432/app`, while Postgres runs on the host. It fails instantly with \"connection refused\". Why?",
          options: [
            "`localhost` inside the container is the container's own loopback, and nothing is listening there",
            "The container's DNS cannot resolve `localhost`",
            "Postgres refuses connections that arrive through NAT",
            "Port 5432 is privileged inside a container",
          ],
          correctIndex: 0,
          explanation:
            "Each container has its own network namespace and its own loopback. Use the service name on a user-defined network, `host.docker.internal` on Docker Desktop, or the host's bridge address. A refusal — rather than a timeout — is the clue that something answered immediately: the container's own stack.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-nat-private-ranges-q2",
          prompt:
            "A container is run with `-p 8080:8080`, `ss` inside shows `LISTEN 127.0.0.1:8080`, and requests to the host time out or are refused. What is the fix?",
          options: [
            "Bind the server to `0.0.0.0` so it accepts on the container's network interface, not just its loopback",
            "Change the mapping to `-p 0.0.0.0:8080:8080`",
            "Add `--network host` so the loopback is shared",
            "Publish a second port so the proxy has somewhere to forward to",
          ],
          correctIndex: 0,
          explanation:
            "Published ports forward to the container's interface address. `--network host` does make it work, by removing the namespace boundary entirely, but that is a sledgehammer that also removes the isolation you wanted.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-nat-private-ranges-q3",
          prompt:
            "Workers in a private subnet reach a database through a NAT gateway. Connections that have been idle for several minutes fail with read timeouts, while fresh connections work. What is happening and what fixes it?",
          options: [
            "The NAT dropped the idle translation (350 seconds on an AWS NAT gateway); set TCP keepalives shorter than that idle timeout",
            "The database is closing idle connections; increase its `idle_in_transaction_session_timeout`",
            "The pool is leaking connections; reduce its maximum size",
            "DNS for the database expired; shorten the resolver cache",
          ],
          correctIndex: 0,
          explanation:
            "Once the mapping is gone the NAT drops packets for that flow without an RST, so the client waits for its read timeout. Keepalives below the shortest idle timeout on the path keep the mapping alive; a database-side timeout would normally produce a clean connection reset instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-nat-private-ranges-q4",
          prompt: "Which of these are consequences of NAT that affect application design? (Select all that apply.)",
          options: [
            "Unsolicited inbound connections fail unless an explicit mapping exists",
            "Many clients appear to the server with one source address, so IP rate limiting is coarse",
            "Idle flows can be reclaimed, so long-lived connections need keepalives",
            "The TCP sequence numbers are rewritten, so end-to-end retransmission is impossible",
            "TLS cannot be used through a NAT because the certificate is bound to the client IP",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "NAT rewrites addresses and ports and fixes up checksums; sequence numbers and the TLS session are untouched. Certificates bind to names, not client addresses.",
        },
        {
          id: "net-nat-private-ranges-q5",
          prompt: "Two containers are started on Docker's *default* bridge network. Can one reach the other by container name?",
          options: [
            "No — name resolution between containers only works on a user-defined network, which gets Docker's embedded DNS",
            "Yes — Docker always injects every container name into `/etc/hosts`",
            "Yes, but only if both containers publish a port",
            "No — containers can never resolve each other, on any network",
          ],
          correctIndex: 0,
          explanation:
            "The default bridge deliberately has no service discovery. Creating a user-defined bridge (which is what Compose does for you) turns on DNS resolution by container and service name, and is the reason Compose files \"just work\".",
        },
        {
          id: "net-nat-private-ranges-q6",
          prompt: "A host logs `nf_conntrack: table full, dropping packet` and new connections start timing out while existing ones continue. What is the cause?",
          options: [
            "The connection-tracking table that stateful NAT and firewalling depend on is full, so new flows have nowhere to be recorded",
            "The routing table ran out of entries for the destination subnet",
            "The ARP cache overflowed and neighbours can no longer be resolved",
            "The listening socket's accept queue overflowed",
          ],
          correctIndex: 0,
          explanation:
            "Every tracked flow occupies a conntrack entry; short-lived connections at high rate, or long timeouts, fill the table. Established flows already have entries and keep working — which is exactly the pattern that makes it confusing to diagnose.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-nat-private-ranges-q7",
          prompt: "Why does a home or office router allow your laptop to open connections outward but not accept connections inward?",
          options: [
            "Outbound traffic creates a translation entry the replies can match; inbound packets match nothing, so there is no private address to send them to",
            "The router runs a firewall rule that blocks TCP but allows UDP inbound",
            "Private addresses cannot appear in an IP header at all",
            "The ISP filters all inbound traffic before it reaches the router",
          ],
          correctIndex: 0,
          explanation:
            "NAT is not primarily a security feature, but this asymmetry is a side effect people rely on. Port forwarding, UPnP or a relay creates the missing mapping deliberately.",
        },
        {
          id: "net-nat-private-ranges-q8",
          prompt: "Your application needs the real client IP, but behind a NAT it sees one address for everyone. Which approach actually recovers it?",
          options: [
            "Have the L7 proxy add `X-Forwarded-For` (or use the PROXY protocol at L4) and trust it only from known proxy addresses",
            "Read the source port, which encodes the original client address",
            "Enable TCP timestamps, which carry the pre-NAT address",
            "Query the NAT device over ICMP for the translation table",
          ],
          correctIndex: 0,
          explanation:
            "The original address has to be carried at a layer the NAT does not rewrite — an HTTP header or the PROXY protocol preamble. Trusting such a header from arbitrary sources lets anyone spoof their IP for your rate limiter.",
        },
        {
          id: "net-nat-private-ranges-q9",
          prompt: "Why can't two networks that both use `10.1.0.0/16` simply be connected with a route?",
          options: [
            "The destination address would be ambiguous — a packet for `10.1.2.3` could belong to either side, so routing cannot decide",
            "The `10.0.0.0/8` range may only be used by one network at a time globally",
            "Routers refuse to forward RFC 1918 addresses",
            "The subnet mask would have to be recalculated on every packet",
          ],
          correctIndex: 0,
          explanation:
            "Overlap makes forwarding undecidable, which is why peering is rejected outright. The workarounds — NAT on one side, or renumbering — are both painful, so address allocation is worth planning before the second VPC exists.",
        },
        {
          id: "net-nat-private-ranges-q10",
          prompt: "A container can reach the internet but cannot reach a service on the host's private network. Where should you look first?",
          options: [
            "Whether the container's bridge subnet overlaps a route the host uses for that network, or whether outbound traffic is masqueraded to an address the target denies",
            "Whether the container image includes a DNS client",
            "Whether the host has IPv6 enabled",
            "Whether the container was started with a TTY attached",
          ],
          correctIndex: 0,
          explanation:
            "Internet access proves the default route and NAT work, so the failure is specific to that destination: an overlapping bridge range hijacking the route, or a firewall on the target that only allows the host's address, not the masqueraded one.",
        },
      ],
    },
    {
      id: "net-dns-resolution",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "DNS: the Resolution Path, Record Types and TTLs",
      summary:
        "DNS is the most common cause of mysterious outages, and almost always for the same reason: it is a distributed cache with no invalidation. A lookup starts at a stub resolver in your host, goes to a recursive resolver, and from there walks the hierarchy — root servers, then the TLD's servers, then the authoritative servers for the zone — caching every referral and answer for the TTL it was given. Nothing pushes updates. \"Propagation\" is not a process that happens to your change; it is other people's caches expiring on their own schedule.\n\nThat makes a cutover a planning problem. Lower the TTL to 60–300 seconds *at least one full old-TTL period before* the change, so every cache has picked up the short TTL; make the change; verify against the authoritative servers and a couple of public resolvers; then raise the TTL again. Get the order wrong — lower the TTL an hour before a change that had a 24-hour TTL — and resolvers that cached earlier still hold the old answer for the rest of the day. Negative answers are cached too, governed by the SOA record's minimum field (RFC 2308), so querying a name *before* you create it can poison caches against yourself for an hour.\n\nThe record types carry their own traps. A CNAME is an alias for an entire name, so it cannot coexist with other records at that name and therefore cannot live at the zone apex — which is why providers invented ALIAS/ANAME records and CNAME flattening for `example.com`. MX records take a priority where lower means preferred. TXT carries SPF, DKIM and domain-verification strings. CAA restricts which certificate authorities may issue for the domain. NS records delegate, and if the delegation at the registrar disagrees with the NS records in the zone you get intermittent resolution that looks like packet loss. And a CNAME still pointing at a decommissioned cloud resource is a subdomain-takeover vulnerability: whoever claims that resource next answers for your name.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "RFC 1035: Domain Names — Implementation and Specification", url: "https://datatracker.ietf.org/doc/html/rfc1035", kind: "spec" },
        { label: "RFC 2308: Negative Caching of DNS Queries (DNS NCACHE)", url: "https://datatracker.ietf.org/doc/html/rfc2308", kind: "spec" },
        { label: "Julia Evans: How updating your DNS records works", url: "https://jvns.ca/blog/how-updating-dns-works/", kind: "article" },
      ],
      video: {
        title: "What is DNS? (and how it makes the Internet work)",
        channel: "NetworkChuck",
        url: "https://www.youtube.com/watch?v=NiQTs9DbtW4",
        videoId: "NiQTs9DbtW4",
        durationLabel: "24:21",
      },
      alternateVideos: [
        {
          title: "DNS Records Explained",
          channel: "PowerCert Animated Videos",
          url: "https://www.youtube.com/watch?v=HnUDtycXSNE",
          videoId: "HnUDtycXSNE",
          durationLabel: "14:14",
        },
        {
          title: "DNS is beautiful",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=tgWx81_NGcg",
          videoId: "tgWx81_NGcg",
          durationLabel: "41:01",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-dns-resolution-q1",
          prompt:
            "An A record has had a TTL of 86400 for months. One hour before a migration you lower the TTL to 60, then change the address. How long can resolvers keep serving the old address?",
          options: [
            "Up to 24 more hours: caches that fetched the record before the TTL change still hold it with the old 86400-second TTL",
            "At most 60 seconds, because the new TTL applies retroactively to cached copies",
            "Exactly one hour, the time between the TTL change and the migration",
            "Until each resolver is manually flushed; TTLs only affect browsers",
          ],
          correctIndex: 0,
          explanation:
            "A TTL is attached to the answer a resolver already holds; lowering it only affects copies fetched afterwards. To be safe, lower the TTL a full old-TTL period ahead of the change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-resolution-q2",
          prompt:
            "You need `example.com` (no subdomain) to point at a load balancer that only publishes a hostname. Why can't you just add a CNAME at the apex, and what do you use instead?",
          options: [
            "A CNAME must be the only record at its name, and the apex must hold SOA and NS records — so use a provider ALIAS/ANAME record or CNAME flattening",
            "CNAMEs are only valid for subdomains because they are limited to four labels",
            "You can, but only if you also delete the MX records",
            "You must use an A record with the load balancer's current IP and update it manually",
          ],
          correctIndex: 0,
          explanation:
            "RFC 1034's rule is that a CNAME excludes all other data at that name, and every zone apex necessarily carries SOA and NS. Providers work around it by resolving the target themselves and serving A records — which is why ALIAS records are provider-specific rather than standard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-resolution-q3",
          prompt:
            "A deploy script queries `new-api.example.com` before the record exists and gets NXDOMAIN. The record is created seconds later, but lookups keep failing for the next hour. Why?",
          options: [
            "Negative answers are cached too, for a duration derived from the zone's SOA record (RFC 2308)",
            "NXDOMAIN answers are cached permanently until the resolver restarts",
            "The authoritative server rate-limited the script after the failed query",
            "Creating a record requires a full zone transfer, which takes an hour to complete",
          ],
          correctIndex: 0,
          explanation:
            "Negative caching is what stops typos hammering the root servers, and the SOA minimum (capped by the SOA record's own TTL) sets its length. Create records before anything queries them, and keep the SOA minimum modest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-resolution-q4",
          prompt: "Which statements about DNS record types are correct? (Select all that apply.)",
          options: [
            "In an MX record, a lower preference number means a more preferred mail server",
            "A CAA record restricts which certificate authorities may issue certificates for the domain",
            "NS records delegate a zone to a set of authoritative servers",
            "An AAAA record is a signed version of an A record",
            "A TXT record can only contain a single SPF policy",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "AAAA is simply the IPv6 address record — signing is DNSSEC's RRSIG — and TXT records hold arbitrary strings, which is why a name typically carries several of them for SPF, DKIM selectors and vendor verification.",
        },
        {
          id: "net-dns-resolution-q5",
          prompt:
            "`status.example.com` is a CNAME to a hosting provider's domain. The team deletes the hosted site but leaves the CNAME. What is the risk?",
          options: [
            "Subdomain takeover: someone else can claim that provider resource and serve content, and obtain certificates, under your name",
            "Nothing — a CNAME to a non-existent target simply returns NXDOMAIN forever",
            "Your other subdomains stop resolving because the zone is inconsistent",
            "Mail delivery for the apex domain fails",
          ],
          correctIndex: 0,
          explanation:
            "A dangling CNAME delegates your name to whoever controls the target next, which is enough to pass an HTTP-01 ACME challenge and get a valid certificate for the subdomain. Deleting DNS records is part of decommissioning.",
        },
        {
          id: "net-dns-resolution-q6",
          prompt: "A domain resolves correctly most of the time but fails intermittently, seemingly at random. Which DNS-specific cause fits that pattern best?",
          options: [
            "The NS delegation at the registrar and the NS records inside the zone disagree, so answers depend on which server a resolver happens to ask",
            "The A record's TTL is too low, so some resolvers give up",
            "The zone uses both A and AAAA records",
            "The registrar's WHOIS data is out of date",
          ],
          correctIndex: 0,
          explanation:
            "Resolvers pick among the delegated name servers, so a stale or partial delegation succeeds or fails depending on the choice. Intermittency proportional to the number of correct servers is the signature of a lame delegation.",
        },
        {
          id: "net-dns-resolution-q7",
          prompt:
            "A name has three A records with equal TTLs. What should you expect clients to do?",
          options: [
            "Behaviour varies: servers may rotate the order, and clients may reorder, pin or race them — so it is a crude load-spreading mechanism, not load balancing",
            "Every client connects to the numerically lowest address",
            "Clients query all three and use the one that replies fastest, always",
            "The resolver picks one at random and discards the other two before answering",
          ],
          correctIndex: 0,
          explanation:
            "Round-robin DNS spreads traffic statistically at best. It has no health awareness — a dead address stays in the answer until someone removes it, and clients cache it for the TTL — which is why real balancing lives in a load balancer.",
        },
        {
          id: "net-dns-resolution-q8",
          prompt: "Which server actually holds the A record you edit in your DNS provider's console?",
          options: [
            "The authoritative name servers for the zone, which the registrar's NS delegation points to",
            "The root name servers, which store every record on the internet",
            "The `.com` TLD servers, which store all records for `.com` domains",
            "Your ISP's recursive resolver, which is where changes are published",
          ],
          correctIndex: 0,
          explanation:
            "Roots and TLDs only hold delegations — they tell a resolver where to ask next. That is also why registrar and DNS hosting can be different companies, and why moving one without the other breaks resolution.",
        },
        {
          id: "net-dns-resolution-q9",
          prompt:
            "During a cutover you want to confirm the change is live at the source, ignoring every cache. What do you query?",
          options: [
            "The zone's authoritative name servers directly, for example `dig @ns1.example-dns.net api.example.com A`",
            "A public resolver such as `dig @8.8.8.8`, which never caches",
            "Your own machine with `dig`, which always bypasses caches",
            "The `.com` TLD servers, which hold the current record",
          ],
          correctIndex: 0,
          explanation:
            "Only the authoritative servers can answer without a cache in the way, and their replies carry the `aa` (authoritative answer) flag. Public resolvers cache like any other, and your local `dig` goes to whatever recursive resolver is configured.",
        },
        {
          id: "net-dns-resolution-q10",
          prompt: "What is the order of a full recursive resolution for `api.eu.example.com` from a cold cache?",
          options: [
            "Root servers → `.com` TLD servers → `example.com` authoritative servers → possibly a further delegation for `eu.example.com`",
            "`example.com` servers → `.com` servers → root servers, narrowing upward",
            "The registrar → the DNS host → the CDN edge",
            "All name servers in parallel, with the first answer winning",
          ],
          correctIndex: 0,
          explanation:
            "Each step returns a referral one level down, and every referral is cached — so the next lookup under `.com` skips the root. A zone can also delegate a subdomain to different servers, adding another hop.",
        },
        {
          id: "net-dns-resolution-q11",
          prompt:
            "Your team wants zero-downtime failover between two regions and proposes dropping the TTL to 1 second so DNS can redirect traffic instantly. What is wrong with that plan?",
          options: [
            "Clients, stub resolvers and runtimes ignore or clamp very low TTLs, and the extra query volume is significant — DNS is a poor failover mechanism on its own",
            "TTLs below 30 seconds are rejected by the DNS protocol",
            "A 1-second TTL forces every resolver to do a full recursive walk from the root each time",
            "Nothing is wrong; 1-second TTLs are the standard approach to regional failover",
          ],
          correctIndex: 0,
          explanation:
            "Some resolvers enforce a minimum TTL, browsers and JVMs keep their own caches, and long-lived connections do not re-resolve at all. DNS failover is a coarse tool; anycast or a load balancer in front of both regions reacts in seconds instead of minutes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "net-dns-caching-dig",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "DNS Caching Layers and Reading `dig`",
      summary:
        "When `dig` shows the new address and your application still connects to the old one, neither is lying — they are reading different caches. Between your code and the authoritative server there are usually five: the runtime's own cache (the JVM caches positive lookups for 30 seconds by default, and historically forever under a security manager), the OS stub resolver (`systemd-resolved`, `nscd`), the local router, the recursive resolver your network hands out, and finally the authoritative servers. `dig` talks straight to the configured recursive resolver over the network and ignores the stub cache, `/etc/hosts` and NSS entirely — which is exactly why it can disagree with `ping`, `curl` and your service.\n\nSo the diagnostic move is to query each layer deliberately. `dig @1.1.1.1 name` and `dig @<authoritative-ns> name` bracket the problem: if the authoritative answer is right and the public resolver's is stale, you are waiting out a TTL; if both are right and the app is wrong, the staleness is inside your host or your process. `dig +trace` walks the delegation from the root and shows you where a broken delegation sits. `getent hosts name` goes through NSS the way most applications actually resolve, so it is the one that catches an `/etc/hosts` override or an nsswitch quirk.\n\nRead the output properly. `status: NOERROR` with an empty ANSWER section means the name exists but has no record of that type — a very different bug from `NXDOMAIN`. `SERVFAIL` usually means DNSSEC validation failed or no authoritative server could be reached, not that the name is missing. The `aa` flag marks a genuinely authoritative answer; its absence means you are looking at a cache. And on a caching resolver the TTL counts *down* between repeated queries, which is the quickest way to prove an answer is cached and see exactly how long you have to wait.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "BIND 9 documentation: dig and the other DNS utilities", url: "https://bind9.readthedocs.io/en/latest/manpages.html", kind: "docs" },
        { label: "RFC 8484: DNS Queries over HTTPS (DoH)", url: "https://datatracker.ietf.org/doc/html/rfc8484", kind: "spec" },
        { label: "Julia Evans: Implement DNS in a weekend", url: "https://implement-dns.wizardzines.com/", kind: "article" },
      ],
      video: {
        title: "How to Use the dig Command in Linux | DNS Lookup Tutorial",
        channel: "Learn Linux TV",
        url: "https://www.youtube.com/watch?v=_6aL4m8aDjc",
        videoId: "_6aL4m8aDjc",
        durationLabel: "14:16",
      },
      alternateVideos: [
        {
          title: "We now know why the DNS failed",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=LZm9nTwsGi8",
          videoId: "LZm9nTwsGi8",
          durationLabel: "23:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-dns-caching-dig-q1",
          prompt:
            "Read this output:\n\n```\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41231\n;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1\n\n;; ANSWER SECTION:\napi.example.com.        38  IN  CNAME  lb-eu.example.net.\nlb-eu.example.net.      38  IN  A      203.0.113.10\n```\n\nWhat can you conclude?",
          options: [
            "It is a cached answer (no `aa` flag) with 38 seconds left, and `api.example.com` currently resolves to `203.0.113.10` via a CNAME",
            "It is an authoritative answer straight from the zone's name servers",
            "The record has a TTL of 38 seconds configured at the authoritative server",
            "The CNAME is broken because two records were returned for one question",
          ],
          correctIndex: 0,
          explanation:
            "`ra` means recursion was available, not authoritative — the `aa` flag is absent, so this came from a cache with 38 seconds of its TTL remaining. The configured TTL is whatever the authoritative server returns, which will be higher.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-caching-dig-q2",
          prompt: "`dig api.example.com` on the app server returns the new address, but the running application still connects to the old one. Which layers could explain it? (Select all that apply.)",
          options: [
            "The application runtime's own DNS cache, which `dig` does not touch",
            "An `/etc/hosts` entry, which `dig` ignores but the application's resolver honours",
            "An already-open connection pool that resolved the name once at startup and never re-resolves",
            "The authoritative name servers, which must be serving two different answers",
            "The TTL on the new record, which prevents clients from using it until it expires",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`dig` queries a resolver over the network and skips the stub resolver, NSS and the process's cache — the three places staleness usually hides. A TTL bounds how long an *old* answer survives; it never delays adopting a new one.",
        },
        {
          id: "net-dns-caching-dig-q3",
          prompt: "A lookup returns `status: SERVFAIL`. What does that most often mean?",
          options: [
            "The resolver could not produce an answer — commonly DNSSEC validation failure or no reachable authoritative server",
            "The name definitively does not exist",
            "The name exists but has no record of the requested type",
            "The query was rejected because it was sent over UDP",
          ],
          correctIndex: 0,
          explanation:
            "`NXDOMAIN` is \"no such name\" and `NOERROR` with an empty answer is \"no such record type at this name\". `SERVFAIL` is the resolver saying it failed, which is why the same query against the authoritative server often succeeds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-caching-dig-q4",
          prompt: "You run the same `dig` twice, ten seconds apart, and the TTL in the answer drops from 271 to 261. What does that prove?",
          options: [
            "The answer is being served from a cache, and the underlying record has about 261 seconds left before it is refetched",
            "The authoritative server is lowering the TTL in real time",
            "The record is about to be deleted",
            "Your resolver is rate-limiting you and degrading the TTL",
          ],
          correctIndex: 0,
          explanation:
            "A caching resolver returns the remaining lifetime, so the countdown is proof of caching and a precise estimate of how long a stale answer will linger. An authoritative answer returns the full configured TTL every time.",
        },
        {
          id: "net-dns-caching-dig-q5",
          prompt: "What does `dig +trace name` do differently from a plain `dig name`?",
          options: [
            "It performs the recursion itself, starting at the root servers and following each delegation, so you can see exactly which level is wrong",
            "It enables verbose logging on your configured resolver",
            "It queries every public resolver in turn and compares the answers",
            "It follows CNAME chains, which a plain `dig` does not",
          ],
          correctIndex: 0,
          explanation:
            "`+trace` is how you find a broken delegation: you watch the referrals from root to TLD to the zone. A plain `dig` asks one recursive resolver and shows you only its conclusion — and it follows CNAMEs too.",
        },
        {
          id: "net-dns-caching-dig-q6",
          prompt: "Why can `ping api.example.com` and `dig api.example.com` disagree on a host?",
          options: [
            "`ping` resolves through NSS, which consults `/etc/hosts` and the stub resolver, while `dig` sends its own query to a resolver",
            "`ping` uses IPv6 and `dig` uses IPv4 by default",
            "`ping` caches results for an hour while `dig` never caches",
            "`ping` queries the authoritative server directly",
          ],
          correctIndex: 0,
          explanation:
            "This is the classic false alarm. Use `getent hosts api.example.com` to see what the system resolver — and therefore most applications — will actually return.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-caching-dig-q7",
          prompt:
            "A company runs split-horizon DNS so internal names resolve only inside the network. Some laptops suddenly cannot resolve them, though the VPN is connected. What is a likely modern cause?",
          options: [
            "The browser is using DNS over HTTPS, bypassing the OS resolver and the internal servers entirely",
            "The internal zone's TTL expired and was not renewed",
            "The VPN blocks UDP port 53 but allows TCP",
            "The laptops are using IPv6, which does not support split horizon",
          ],
          correctIndex: 0,
          explanation:
            "DoH (RFC 8484) sends queries to a resolver of the browser's choosing over HTTPS, so internal-only names stop resolving in the browser while `dig` and the rest of the OS still work. Enterprise policy or a canary domain is the usual mitigation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-dns-caching-dig-q8",
          prompt: "`dig example.com AAAA` returns `status: NOERROR` with an empty ANSWER section. What does that mean?",
          options: [
            "The name exists but has no AAAA record — the domain is IPv4-only",
            "The name does not exist at all",
            "The resolver timed out contacting the authoritative servers",
            "The AAAA record exists but is hidden by DNSSEC",
          ],
          correctIndex: 0,
          explanation:
            "This is a NODATA response: the name is present in the zone, just not with that record type. Confusing it with `NXDOMAIN` sends people hunting for a missing domain when the real gap is a missing record.",
        },
        {
          id: "net-dns-caching-dig-q9",
          prompt: "Your application is a long-running JVM service. What DNS behaviour should you check when addresses change?",
          options: [
            "The JVM's own address cache (`networkaddress.cache.ttl`), which by default holds positive lookups for a fixed period regardless of the record's TTL",
            "Whether the JVM uses TCP for DNS, which would bypass caching",
            "Whether the JVM re-reads `/etc/resolv.conf` on every query",
            "Whether the JVM ignores CNAME records",
          ],
          correctIndex: 0,
          explanation:
            "Runtimes cache independently of DNS TTLs, and older configurations cached forever — a failover can then leave a healthy service pointed at a dead address indefinitely. Setting that property explicitly is standard hardening for long-lived services.",
        },
      ],
    },
    {
      id: "net-tls-handshake",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "TLS: the Handshake and the Chain of Trust",
      summary:
        "A TLS handshake settles four things: which protocol version and cipher suite both sides support, who the server is, a shared secret neither side transmitted, and proof that both sides derived the same keys over a transcript an attacker could not have tampered with. TLS 1.3 (RFC 8446) reduced that to a single round trip, deleted static RSA key exchange so every session has forward secrecy, and encrypts the server's certificate — only the ClientHello, including the server name, still travels in the clear.\n\nWhat a certificate asserts is narrower than people assume: that whoever holds the corresponding private key demonstrated control of these *names*, and that a CA your client already trusts vouched for it. A domain-validated certificate says nothing about the company behind the domain. Names are matched against the subjectAltName extension — the Common Name has been ignored by browsers since 2017 — and a wildcard covers exactly one label, so `*.example.com` matches `api.example.com` but neither `example.com` nor `a.b.example.com`.\n\nTrust is a *path*, and that is where the outages live. The server sends its leaf plus, ideally, the intermediates; the client must build a chain from the leaf to a root in its own trust store. Browsers quietly paper over a missing intermediate by fetching it from the URL in the certificate's Authority Information Access extension and by caching intermediates they have seen before. `curl`, Java, Go and Python usually do not. That asymmetry is the explanation for the most confusing TLS report of all — \"it works in Chrome but our service gets `unable to get local issuer certificate`\" — and the fix is always to fix the server's chain, not the client.\n\nThe rest of the trouble is mundane and worth recognising instantly: clock skew making a valid certificate look not-yet-valid, an expired *intermediate* while the leaf is fine, a corporate TLS-inspecting proxy whose root is in the OS store but not in Node's bundled one (`NODE_EXTRA_CA_CERTS`), and revocation being effectively soft-fail almost everywhere — which is why short certificate lifetimes have replaced revocation as the real containment strategy.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", url: "https://datatracker.ietf.org/doc/html/rfc8446", kind: "spec" },
        { label: "RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile", url: "https://datatracker.ietf.org/doc/html/rfc5280", kind: "spec" },
        { label: "The Illustrated TLS 1.3 Connection: every byte explained", url: "https://tls13.xargs.org/", kind: "article" },
        { label: "badssl.com: deliberately broken TLS configurations to test against", url: "https://badssl.com/", kind: "repo" },
      ],
      video: {
        title: "TLS Handshake - EVERYTHING that happens when you visit an HTTPS website",
        channel: "Practical Networking",
        url: "https://www.youtube.com/watch?v=ZkL10eoG1PY",
        videoId: "ZkL10eoG1PY",
        durationLabel: "27:58",
      },
      alternateVideos: [
        {
          title: "TLS 1.3 Handshake - many CHANGES from prior versions!",
          channel: "Practical Networking",
          url: "https://www.youtube.com/watch?v=JA0vaIb4158",
          videoId: "JA0vaIb4158",
          durationLabel: "17:38",
        },
        {
          title: "Digital Certificates: Chain of Trust",
          channel: "Dave Crabbe",
          url: "https://www.youtube.com/watch?v=heacxYUnFHA",
          videoId: "heacxYUnFHA",
          durationLabel: "16:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-tls-handshake-q1",
          prompt:
            "The site loads fine in Chrome, but a backend service calling the same URL fails:\n\n```\n* SSL certificate problem: unable to get local issuer certificate\ncurl: (60) SSL certificate problem: unable to get local issuer certificate\n```\n\nWhat is the most likely cause?",
          options: [
            "The server is not sending the intermediate certificate; browsers fetch or cache it, curl does not",
            "The certificate has expired, and only curl checks expiry",
            "The server's certificate is for a different hostname",
            "curl does not support TLS 1.3, so it cannot complete the handshake",
          ],
          correctIndex: 0,
          explanation:
            "\"Local issuer\" means the client could not build a path to a trusted root. Browsers hide an incomplete chain via AIA fetching and cached intermediates; most runtimes do not. Fix the chain the server serves.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tls-handshake-q2",
          prompt: "What does a domain-validated (DV) certificate actually assert?",
          options: [
            "That the key holder demonstrated control of the listed names, and a CA in the client's trust store vouched for that",
            "That the organisation named in the certificate is a legally registered business",
            "That the site's content has been scanned and found safe",
            "That the connection cannot be intercepted by any party, including the site's own proxies",
          ],
          correctIndex: 0,
          explanation:
            "DV proves control of a name, nothing more. Organisation identity is what OV and EV attempted, and browsers stopped surfacing EV in the UI because users did not act on it.",
        },
        {
          id: "net-tls-handshake-q3",
          prompt: "A certificate has `subjectAltName: DNS:*.example.com`. Which of these hosts does it validly cover? (Select all that apply.)",
          options: [
            "`api.example.com`",
            "`staging.example.com`",
            "`example.com`",
            "`a.b.example.com`",
            "`example.com.evil.net`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A wildcard replaces exactly one label. The apex needs its own SAN entry, `a.b.example.com` needs `*.b.example.com`, and suffix tricks match nothing — name comparison is label by label from the right.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tls-handshake-q4",
          prompt: "In TLS 1.3, which of these is still sent in the clear?",
          options: [
            "The server name in the ClientHello's SNI extension",
            "The server's certificate",
            "The negotiated cipher suite's session keys",
            "The HTTP request line",
          ],
          correctIndex: 0,
          explanation:
            "TLS 1.3 encrypts everything after the ServerHello, including the certificate — but the ClientHello has to be readable to route and select a certificate, so SNI is visible until Encrypted Client Hello is deployed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tls-handshake-q5",
          prompt: "Why did TLS 1.3 remove static RSA key exchange?",
          options: [
            "It had no forward secrecy: anyone who later obtained the server's private key could decrypt recorded past sessions",
            "RSA keys are too large to fit in a ClientHello",
            "RSA is no longer considered secure at any key size",
            "It required an extra round trip that ECDHE avoids",
          ],
          correctIndex: 0,
          explanation:
            "With static RSA the client encrypted the premaster secret to the server's long-term key, so that key unlocked every session ever captured. Ephemeral Diffie-Hellman gives each session its own keys, so a later compromise does not decrypt the past.",
        },
        {
          id: "net-tls-handshake-q6",
          prompt:
            "`openssl s_client -connect api.example.com:443 -servername api.example.com` prints:\n\n```\nCertificate chain\n 0 s:CN = api.example.com\n   i:C = US, O = Let's Encrypt, CN = R11\n 1 s:C = US, O = Let's Encrypt, CN = R11\n   i:C = US, O = Internet Security Research Group, CN = ISRG Root X1\n```\n\nWhat is the server sending, and is anything missing?",
          options: [
            "The leaf and its issuing intermediate; the root is not sent because the client must already trust it from its own store",
            "The leaf only; both the intermediate and the root are missing",
            "Leaf, intermediate and root — a complete but wasteful chain",
            "An invalid chain, because the issuer of entry 0 should be the root",
          ],
          correctIndex: 0,
          explanation:
            "Each entry's issuer (`i:`) is the next entry's subject (`s:`). Servers send leaf plus intermediates; sending the root is harmless but pointless, because a root you do not already trust proves nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tls-handshake-q7",
          prompt: "A freshly provisioned VM rejects every TLS connection with \"certificate is not yet valid\". What should you check first?",
          options: [
            "The system clock — validation compares the certificate's notBefore and notAfter against local time",
            "Whether the CA bundle has been updated in the last 90 days",
            "Whether the certificate uses ECDSA rather than RSA",
            "Whether the server supports TLS 1.3",
          ],
          correctIndex: 0,
          explanation:
            "Validity is a time-window check against the client's clock, so a machine whose clock is behind sees valid certificates as premature. It is a routine failure on VMs and embedded devices booting without NTP.",
        },
        {
          id: "net-tls-handshake-q8",
          prompt: "Which of these are true about certificate revocation as deployed today? (Select all that apply.)",
          options: [
            "Browsers largely fail *open* when a revocation check cannot be completed",
            "OCSP stapling lets the server present a recent signed status so the client need not contact the CA",
            "Shorter certificate lifetimes have become the practical answer to revocation's weaknesses",
            "A revoked certificate stops working immediately for every client",
            "CRLs are downloaded by clients before every handshake",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Hard-failing on an unreachable OCSP responder would make the CA a single point of failure for the whole web, so clients soft-fail — which is exactly why revocation is weak and why 90-day (and shorter) certificates matter.",
        },
        {
          id: "net-tls-handshake-q9",
          prompt: "A Node.js service inside a corporate network gets `SELF_SIGNED_CERT_IN_CHAIN` for public HTTPS endpoints, while browsers on the same machine are fine. What is happening?",
          options: [
            "A TLS-inspecting proxy re-signs traffic with a private root that is in the OS trust store but not in Node's bundled CA list; point `NODE_EXTRA_CA_CERTS` at it",
            "Node does not support TLS 1.3 and falls back to a self-signed handshake",
            "The endpoints really are using self-signed certificates",
            "Node requires the certificate's Common Name to match, which browsers do not",
          ],
          correctIndex: 0,
          explanation:
            "Node ships its own root store rather than using the OS one, so anything added to the system store is invisible to it. Disabling verification with `NODE_TLS_REJECT_UNAUTHORIZED=0` \"fixes\" it by removing all authentication — never do that outside a scratch shell.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-tls-handshake-q10",
          prompt: "What is the client's `Finished` message for?",
          options: [
            "It proves the client derived the same keys and that no one altered the handshake messages, by sending a MAC over the whole transcript",
            "It acknowledges the server's certificate so the server can delete it from memory",
            "It signals that the client has no more data to send in this session",
            "It carries the session ticket used for resumption",
          ],
          correctIndex: 0,
          explanation:
            "Without a transcript check, an attacker could strip extensions or downgrade the cipher list in flight. Because `Finished` is computed over everything exchanged, tampering breaks it and the handshake aborts.",
        },
        {
          id: "net-tls-handshake-q11",
          prompt: "Why does `curl https://203.0.113.10/` fail with a name-mismatch error even though that address serves your site correctly?",
          options: [
            "Certificates assert names, not addresses, so unless the SAN includes that IP the host being verified does not match",
            "curl cannot use TLS with a bare IP address",
            "The server rejects connections that do not carry a `Host` header",
            "TLS requires a reverse DNS record for the address",
          ],
          correctIndex: 0,
          explanation:
            "Verification compares the host you asked for against the certificate's SANs — and it is also the wrong way to test one origin. `curl --resolve host:443:203.0.113.10` keeps the name (and the SNI) while forcing the address.",
        },
      ],
    },
    {
      id: "net-cert-lifecycle-acme",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "Certificate Lifecycle, ACME and Let's Encrypt",
      summary:
        "ACME (RFC 8555) replaced a manual purchase-and-paste ritual with a protocol. A client asks a CA for a certificate covering some names, the CA issues challenges, the client proves control of each name, and the CA signs the client's CSR. Three challenge types matter. HTTP-01 serves a token at `http://<name>/.well-known/acme-challenge/<token>`, which needs port 80 reachable from the internet and cannot produce wildcards. DNS-01 publishes a TXT record at `_acme-challenge.<name>`, which is the only way to get a wildcard and the only way to certify a host that is not publicly reachable — at the price of giving the client API access to your DNS. TLS-ALPN-01 proves control over port 443 alone, which suits environments where port 80 is closed.\n\nThe private key never leaves your server; the CSR carries only the public key and the requested names. What the CA returns is a leaf plus the intermediates you must serve with it.\n\nLet's Encrypt certificates are valid for 90 days, with an opt-in six-day short-lived profile, and no exceptions — clients renew at 60 days (or every three for the short ones). That shortness is deliberate: it forces automation, and automation is what makes revocation's weakness survivable. Rate limits are the other operational constraint, notably 50 new certificates per registered domain per week, which is why you test against the staging environment and why renewals coordinated through ACME Renewal Information (ARI) are exempt.\n\nThe failure mode to design against is not issuance, it is renewal that stops working quietly. Let's Encrypt no longer emails expiry warnings, so you need your own alert — and it must measure days remaining on the certificate *actually being served*, not the one on disk, because the classic outage is a renewal that succeeded while the web server kept the old certificate in memory because nothing reloaded it. Add a CAA record so only your chosen CA can issue for the domain, and remember that every certificate appears in public Certificate Transparency logs, so internal hostnames certified this way become public knowledge.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "RFC 8555: Automatic Certificate Management Environment (ACME)", url: "https://datatracker.ietf.org/doc/html/rfc8555", kind: "spec" },
        { label: "Let's Encrypt: Challenge Types", url: "https://letsencrypt.org/docs/challenge-types/", kind: "docs" },
        { label: "Let's Encrypt: Rate Limits", url: "https://letsencrypt.org/docs/rate-limits/", kind: "docs" },
        { label: "Certificate Transparency", url: "https://certificate.transparency.dev/", kind: "docs" },
      ],
      video: {
        title: "Let's Encrypt Explained: Free SSL",
        channel: "That DevOps Guy",
        url: "https://www.youtube.com/watch?v=jrR_WfgmWEw",
        videoId: "jrR_WfgmWEw",
        durationLabel: "15:03",
      },
      alternateVideos: [
        {
          title: "How to Setup Auto-Renew for Letsencrypt WILDCARD Certificate with DNS challenge? acme-dns | certbot",
          channel: "Anton Putra",
          url: "https://www.youtube.com/watch?v=7jEzioFsyNo",
          videoId: "7jEzioFsyNo",
          durationLabel: "19:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-cert-lifecycle-acme-q1",
          prompt: "You need a certificate for `*.internal.example.com`, and those hosts are not reachable from the internet. Which ACME challenge can do it?",
          options: [
            "DNS-01, which proves control by publishing a TXT record and is the only challenge that issues wildcards",
            "HTTP-01, using a public jump host to serve the token",
            "TLS-ALPN-01, which works over port 443 from inside the network",
            "None — wildcards for private hosts are not possible with ACME",
          ],
          correctIndex: 0,
          explanation:
            "Wildcards require DNS-01, and DNS validation is the only one that does not need the host itself to be reachable. The cost is handing the ACME client credentials for your DNS zone, which is why teams often delegate `_acme-challenge` to a restricted zone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-cert-lifecycle-acme-q2",
          prompt: "A team closes inbound port 80 for security. Sixty days later, HTTPS breaks. What happened?",
          options: [
            "Renewal used HTTP-01, which requires the CA to reach port 80, so renewals silently failed until the certificate expired",
            "Browsers require port 80 to be open in order to trust a certificate",
            "The CA revoked the certificate because the redirect from HTTP was missing",
            "TLS handshakes fall back to port 80 when the session ticket expires",
          ],
          correctIndex: 0,
          explanation:
            "HTTP-01 validation starts on port 80 — it will follow a redirect to HTTPS, but the initial request must arrive. Closing the port breaks renewal, not serving, so the failure surfaces weeks later. Switch to DNS-01 or TLS-ALPN-01 if port 80 must stay shut.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-cert-lifecycle-acme-q3",
          prompt: "How long is a standard Let's Encrypt certificate valid, and when should a client renew?",
          options: [
            "90 days, renewing at around 60 days so there is a month of margin for retries",
            "90 days, renewing on the last day to maximise the certificate's use",
            "One year, renewing at 11 months",
            "30 days, renewing every 29 days",
          ],
          correctIndex: 0,
          explanation:
            "Short lifetimes force automation and limit the damage from a compromised key. Renewing 30 days early means a broken renewal has a month of alerts before it becomes an outage — which only helps if you are alerting on it.",
        },
        {
          id: "net-cert-lifecycle-acme-q4",
          prompt: "Which of these are true about ACME issuance? (Select all that apply.)",
          options: [
            "The private key stays on your server; the CSR sent to the CA contains only the public key and the requested names",
            "A CAA record lets you restrict which CAs are allowed to issue for your domain",
            "Every issued certificate is published to public Certificate Transparency logs",
            "The CA emails you a warning before each certificate expires",
            "Wildcard certificates can be issued through HTTP-01 if you own every subdomain",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Let's Encrypt stopped sending expiry notification emails in 2025 — monitoring is your responsibility — and wildcards require DNS-01 regardless of what you own.",
        },
        {
          id: "net-cert-lifecycle-acme-q5",
          prompt:
            "A CI pipeline requests certificates on every run while a developer debugs it, and issuance starts being refused. What went wrong and what is the right practice?",
          options: [
            "It hit a rate limit (50 new certificates per registered domain per week); test against the ACME staging environment instead",
            "The CA blocked the account for suspected abuse and it must be recreated",
            "The domain's CAA record was exhausted and needs to be reissued",
            "The account key rotated, invalidating previous authorizations",
          ],
          correctIndex: 0,
          explanation:
            "Rate limits are per registered domain and refill slowly, so a debugging loop can lock out production issuance for days. Staging issues untrusted certificates under far looser limits — exactly what a pipeline test needs.",
        },
        {
          id: "net-cert-lifecycle-acme-q6",
          prompt: "Certbot logs a successful renewal, but browsers still see the old, now-expired certificate. What is the most likely cause?",
          options: [
            "The web server was never reloaded, so it is still serving the certificate it loaded into memory at startup",
            "The CA issued the certificate but has not published it to CT logs yet",
            "The renewal produced a new private key that browsers must be told to trust",
            "The OCSP responder is caching the old status",
          ],
          correctIndex: 0,
          explanation:
            "New files on disk change nothing until the process re-reads them, which is what the deploy hook is for. It is also why expiry monitoring must check the certificate served over the network, not the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-cert-lifecycle-acme-q7",
          prompt: "What does a CAA record do, and what does it not do?",
          options: [
            "It tells CAs which of them may issue for the domain; it does not affect clients validating an already-issued certificate",
            "It pins a specific certificate so clients reject any other",
            "It publishes the domain's public key for clients to verify against",
            "It revokes all certificates issued before it was created",
          ],
          correctIndex: 0,
          explanation:
            "CAA is checked by the CA at issuance time, not by browsers at connection time. It is cheap defence-in-depth against mis-issuance, and it works alongside — not instead of — Certificate Transparency monitoring.",
        },
        {
          id: "net-cert-lifecycle-acme-q8",
          prompt: "Why might a team deliberately avoid certifying internal hostnames through a public CA?",
          options: [
            "Certificate Transparency makes every issued name public, so internal hostnames become a free map for attackers",
            "Public CAs refuse to issue for hosts that are not internet-reachable under any challenge",
            "Certificates for internal hosts have shorter lifetimes",
            "Internal hosts cannot use TLS 1.3",
          ],
          correctIndex: 0,
          explanation:
            "CT logs are searchable, and `billing-db-prod.internal.example.com` in a log entry is useful reconnaissance. A wildcard, DNS-01 with a generic name, or a private CA for internal services all avoid publishing the inventory.",
        },
        {
          id: "net-cert-lifecycle-acme-q9",
          prompt: "What is the single most valuable alert to have on certificates?",
          options: [
            "Days remaining on the certificate actually served by each endpoint, alerting well before expiry",
            "A daily count of successful renewals in the ACME client's log",
            "An alert when the certificate file on disk changes",
            "An alert when the CA publishes a new intermediate",
          ],
          correctIndex: 0,
          explanation:
            "Probing the live endpoint catches every failure mode at once: renewal that did not run, renewal that ran but was not reloaded, and the load balancer still holding an old certificate. Log-based checks catch only the first.",
        },
      ],
    },
    {
      id: "net-sni-mtls",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "SNI, Virtual Hosting and Mutual TLS",
      summary:
        "A server has to choose a certificate before it can decrypt anything, but the HTTP `Host` header arrives *inside* the encrypted session. Server Name Indication (RFC 6066) resolves the chicken-and-egg by putting the requested hostname in the ClientHello, in the clear. That one extension is what lets thousands of HTTPS sites share a single IP address, and it is why every debugging command has to set it correctly: `curl --resolve host:443:1.2.3.4` keeps the name — and therefore the SNI — while forcing the address, whereas `curl -H 'Host: host' https://1.2.3.4/` sends the wrong SNI and gets the server's default certificate with a name mismatch. A client that sends no SNI at all — an old Java version, a naive health check, a raw `openssl s_client` without `-servername` — gets the same treatment.\n\nBecause SNI is cleartext, an observer learns which site you are visiting even though the content is private. Encrypted Client Hello closes that gap by encrypting the inner ClientHello to a public key published in the domain's HTTPS DNS record, which is why deploying it is as much a DNS problem as a TLS one.\n\nMutual TLS turns the same machinery around: the server sends a CertificateRequest, the client presents its own certificate, and the server validates it against its own trust store. The gain is real cryptographic identity rather than a bearer token that works for anyone who steals it, which is why service meshes and zero-trust architectures build on it. The cost is that every client now has a certificate lifecycle — issuance, rotation, revocation — which is only tractable with automation such as a private CA, SPIFFE/SPIRE or a mesh's own control plane.\n\nTwo gotchas recur. An mTLS handshake failure surfaces in application logs as a vague connection error, because the failure is a TLS alert rather than an HTTP status — the real cause is almost always that the server's trust store lacks the client's issuing CA, or the client never sent a certificate at all. And terminating TLS at an L7 proxy destroys the client's identity unless the proxy forwards it explicitly, typically as an `X-Forwarded-Client-Cert` header that the backend must be configured to trust.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "RFC 6066: TLS Extensions — Server Name Indication", url: "https://datatracker.ietf.org/doc/html/rfc6066", kind: "spec" },
        { label: "Cloudflare: Encrypted Client Hello — the last puzzle piece to privacy", url: "https://blog.cloudflare.com/encrypted-client-hello/", kind: "article" },
        { label: "MDN: 421 Misdirected Request", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/421", kind: "docs" },
      ],
      video: {
        title: "Server Name Indication (SNI) TLS Extension Explained",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=manTiXESYG0",
        videoId: "manTiXESYG0",
        durationLabel: "12:55",
      },
      alternateVideos: [
        {
          title: "What is mTLS? Secure Your Microservices from MITM Attacks",
          channel: "ByteMonk",
          url: "https://www.youtube.com/watch?v=uWmZZyaHFEY",
          videoId: "uWmZZyaHFEY",
          durationLabel: "5:49",
        },
        {
          title: "Mutual TLS  | The Backend Engineering Show",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=KwpV-ICpkc4",
          videoId: "KwpV-ICpkc4",
          durationLabel: "50:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-sni-mtls-q1",
          prompt: "Why is SNI necessary at all, given that HTTP already carries a `Host` header?",
          options: [
            "The `Host` header is inside the encrypted session, but the server must pick a certificate before encryption is established",
            "The `Host` header is optional in HTTP/1.1, so it cannot be relied on",
            "SNI carries the port as well as the hostname, which `Host` does not",
            "Proxies strip the `Host` header, so it never reaches the origin",
          ],
          correctIndex: 0,
          explanation:
            "Certificate selection happens in the first flight of the handshake, long before any HTTP is readable. That ordering is the whole reason the extension exists, and the reason name-based HTTPS virtual hosting was impossible before it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-sni-mtls-q2",
          prompt:
            "You want to test `api.example.com` against one specific origin at `10.0.3.9`. Which command tests it correctly?",
          options: [
            "`curl -v --resolve api.example.com:443:10.0.3.9 https://api.example.com/`",
            "`curl -v -H 'Host: api.example.com' https://10.0.3.9/`",
            "`curl -v --insecure https://10.0.3.9/`",
            "`curl -v https://10.0.3.9/api.example.com`",
          ],
          correctIndex: 0,
          explanation:
            "`--resolve` overrides only the address lookup, so the URL's hostname still drives SNI, certificate verification and the `Host` header. Connecting to the IP with a `Host` header sends the IP as SNI (or none) and usually yields the default certificate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-sni-mtls-q3",
          prompt: "An old client reports a certificate name mismatch against a host that serves dozens of sites from one address. What is the likely cause?",
          options: [
            "The client does not send SNI, so the server falls back to its default certificate, which is for a different name",
            "The server has stopped supporting that client's TLS version",
            "The certificate's wildcard does not cover the apex domain",
            "The client's clock is wrong",
          ],
          correctIndex: 0,
          explanation:
            "Without SNI the server has no way to know which virtual host was wanted and serves whichever certificate is configured first. The same thing happens with `openssl s_client` unless you pass `-servername`.",
        },
        {
          id: "net-sni-mtls-q4",
          prompt: "Which of these are true about mutual TLS? (Select all that apply.)",
          options: [
            "The server sends a CertificateRequest and validates the client certificate against its own trust store",
            "It gives each client a cryptographic identity rather than a bearer credential that can be replayed if stolen",
            "It requires a certificate lifecycle for every client, which is why it is usually paired with automated issuance",
            "It removes the need for the server to present a certificate",
            "It encrypts the connection more strongly than ordinary TLS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "mTLS adds client authentication on top of the ordinary handshake; the server still authenticates itself, and the cipher suite and key exchange are unchanged. What improves is authentication, not confidentiality.",
        },
        {
          id: "net-sni-mtls-q5",
          prompt:
            "A service enabling mTLS sees clients fail with an opaque \"connection reset\" in their logs, before any HTTP status. What should you check first?",
          options: [
            "Whether the server's trust store contains the CA that issued the client certificates, and whether the client is sending one at all",
            "Whether the clients support HTTP/2",
            "Whether the server's own certificate has expired",
            "Whether the client's request body exceeds the server's limit",
          ],
          correctIndex: 0,
          explanation:
            "Client authentication fails as a TLS alert during the handshake, so no HTTP response exists to carry a 401 — applications just see a broken connection. `openssl s_client -cert client.pem -key client.key` shows the real alert.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-sni-mtls-q6",
          prompt: "Is the hostname in SNI protected from an observer on the network path?",
          options: [
            "No — the ClientHello is sent before encryption, so SNI is visible; Encrypted Client Hello is the fix and depends on a DNS HTTPS record",
            "Yes — SNI is encrypted with the server's public key from its certificate",
            "Yes in TLS 1.3, which encrypts the whole ClientHello",
            "No, but DNS over HTTPS hides it as a side effect",
          ],
          correctIndex: 0,
          explanation:
            "TLS 1.3 encrypts from the ServerHello onward, leaving the ClientHello in the clear. ECH wraps an inner ClientHello using a key published in DNS — so DoH and ECH complement each other, and neither alone hides the destination.",
        },
        {
          id: "net-sni-mtls-q7",
          prompt:
            "A browser reuses one HTTP/2 connection for `a.example.com` and `b.example.com` because both are on the same certificate and IP, and the server answers `421 Misdirected Request`. What does that mean?",
          options: [
            "The server is not willing to serve that authority on this connection and is telling the client to open a new one",
            "The client sent a request for a host that does not exist",
            "The certificate does not cover the second hostname",
            "The connection was migrated to a different server mid-request",
          ],
          correctIndex: 0,
          explanation:
            "HTTP/2 connection coalescing reuses a connection for any authority the certificate covers. `421` is the defined escape hatch when the backend behind that connection cannot serve the requested host.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-sni-mtls-q8",
          prompt: "An L7 proxy terminates mTLS in front of a service. What does the backend see, and what does it need?",
          options: [
            "A plain connection from the proxy with no client certificate; the proxy must forward the verified identity, for example in `X-Forwarded-Client-Cert`, and the backend must trust that header only from the proxy",
            "The original client certificate, because the proxy tunnels the TLS session unchanged",
            "Nothing at all; mTLS cannot be used behind a proxy",
            "The client's IP address, which is sufficient to identify it",
          ],
          correctIndex: 0,
          explanation:
            "Termination ends the client's TLS session at the proxy, so identity has to be re-asserted at the application layer — and a header carrying identity is only as trustworthy as your ability to stop anyone else setting it.",
        },
        {
          id: "net-sni-mtls-q9",
          prompt: "When does an L4 (passthrough) proxy make more sense than terminating TLS at L7?",
          options: [
            "When the backend must perform its own mTLS or see the raw TLS session, since termination would destroy it",
            "Whenever the traffic is HTTP/2, which cannot be terminated",
            "When you need routing by URL path",
            "When you want the proxy to compress responses",
          ],
          correctIndex: 0,
          explanation:
            "Passthrough keeps one end-to-end TLS session, which is exactly what mTLS to the backend requires. The price is that the proxy can route only on SNI and the 4-tuple — no paths, no headers, no retries.",
        },
        {
          id: "net-sni-mtls-q10",
          prompt: "What is the main operational argument against mTLS for service-to-service authentication?",
          options: [
            "Every client needs issuance, rotation and revocation, so without automation the certificate lifecycle becomes the outage source",
            "It cannot work across different organisations",
            "It is incompatible with HTTP/2 and HTTP/3",
            "It requires a public CA to issue every client certificate",
          ],
          correctIndex: 0,
          explanation:
            "The cryptography is the easy part. A private CA plus automated short-lived certificates — what SPIFFE/SPIRE and service meshes provide — is what makes mTLS sustainable; hand-managed client certificates expire at the worst possible moment.",
        },
      ],
    },
    {
      id: "net-firewalls-drop-vs-reject",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "Firewalls, Security Groups and Dropped vs Refused",
      summary:
        "A TCP connection attempt has exactly three outcomes, and knowing which one you got is the fastest triage signal in networking. A SYN-ACK means something is listening. A RST means the packet reached a host that had nothing on that port — **connection refused**, arriving in milliseconds. Silence means something discarded the packet and told nobody — **connection timed out**, arriving after the client works through its SYN retransmission schedule. Refused points at the application: crashed, not started, bound to the wrong interface, listening on a different port. Timed out points at the path: a security group, a NACL, a host firewall, a missing route, the wrong subnet. Learning to read the difference before opening any console saves more time than any tool.\n\nThat distinction is exactly what `DROP` and `REJECT` choose between in iptables or nftables. `DROP` is silence — it hides the host from casual scanning at the cost of making every legitimate misconfiguration take thirty seconds to diagnose. `REJECT` sends an ICMP unreachable or a TCP RST, so clients fail immediately and humans learn something. Internet-facing edges usually `DROP`; internal networks are usually better served by `REJECT`.\n\nThe other axis is state. A stateful firewall — Linux conntrack, an AWS security group — records outbound flows and automatically permits their return traffic, so you write one rule per direction of *intent*. A stateless one, such as an AWS network ACL, evaluates every packet independently, so an inbound allow on port 443 without a matching outbound allow for the ephemeral port range silently kills every response. Security groups are allow-only and deny by default; NACLs have ordered allow *and* deny rules and are evaluated in number order. On a cloud instance both the cloud-level filter and any host firewall must permit the traffic, and `nmap`'s vocabulary maps onto this directly: `open` means a SYN-ACK, `closed` means a RST, and `filtered` means nothing came back at all.\n\nThe overlooked half is egress. Locked-down outbound rules are the usual reason a build cannot reach a package registry or an application cannot reach the metadata service — and because a blocked egress packet is dropped rather than refused, it presents as a timeout that looks nothing like a permissions problem.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Nmap: port scanning basics — open, closed and filtered", url: "https://nmap.org/book/man-port-scanning-basics.html", kind: "docs" },
        { label: "nftables wiki: the Linux packet filter", url: "https://wiki.nftables.org/wiki-nftables/index.php/Main_Page", kind: "docs" },
        { label: "RFC 792: Internet Control Message Protocol", url: "https://datatracker.ietf.org/doc/html/rfc792", kind: "spec" },
        { label: "AWS docs: security groups for your VPC", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html", kind: "docs" },
      ],
      video: {
        title: "Stateful vs Stateless Firewalls - You NEED to know the difference",
        channel: "LearnCantrill",
        url: "https://www.youtube.com/watch?v=rL4-vbsN35w",
        videoId: "rL4-vbsN35w",
        durationLabel: "14:04",
      },
      alternateVideos: [
        {
          title: "How To Use nmap To Scan For Open Ports",
          channel: "Tony Teaches Tech",
          url: "https://www.youtube.com/watch?v=ifbwTt3_oCg",
          videoId: "ifbwTt3_oCg",
          durationLabel: "6:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-firewalls-drop-vs-reject-q1",
          prompt:
            "Two failures from the same client:\n\n```\ncurl: (7) Failed to connect to a.internal port 8080 after 3 ms: Connection refused\ncurl: (28) Failed to connect to b.internal port 8080 after 130000 ms: Connection timed out\n```\n\nWhat should you investigate for each?",
          options: [
            "`a.internal`: the packet reached the host and nothing was listening — look at the service. `b.internal`: a packet was dropped — look at firewall rules and routing",
            "Both are firewall problems; the difference is only how quickly the firewall responded",
            "`a.internal` is a DNS failure and `b.internal` is a TLS failure",
            "Both mean the service is down; the timeout host is simply slower to fail",
          ],
          correctIndex: 0,
          explanation:
            "A RST is proof the packet was delivered to a host's TCP stack. Silence is proof only that something discarded it. This single distinction routes you to the right team before you open anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-firewalls-drop-vs-reject-q2",
          prompt:
            "An inbound NACL rule allows TCP 443 from `0.0.0.0/0`, and the security group is correct, but requests still time out. What is missing?",
          options: [
            "An outbound NACL rule for the ephemeral port range — NACLs are stateless, so return traffic needs its own allow",
            "An inbound NACL rule for port 80 so the connection can be upgraded",
            "A security group rule referencing the NACL",
            "An outbound security group rule for port 443",
          ],
          correctIndex: 0,
          explanation:
            "Responses go back to the client's ephemeral source port, and a stateless filter sees them as unrelated packets. Security groups are stateful, which is why they look correct and the NACL is the culprit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-firewalls-drop-vs-reject-q3",
          prompt: "What is the practical difference between `DROP` and `REJECT` in a Linux firewall rule?",
          options: [
            "`REJECT` sends an ICMP unreachable or a TCP RST so the client fails immediately; `DROP` stays silent so the client waits out its timeout",
            "`DROP` discards the packet and logs it, while `REJECT` discards it silently",
            "`REJECT` applies only to established connections while `DROP` applies to new ones",
            "They are identical; `REJECT` is an alias kept for compatibility",
          ],
          correctIndex: 0,
          explanation:
            "The choice is between hiding from scanners and being debuggable. Internal services almost always want `REJECT` so a misconfiguration fails in milliseconds instead of looking like a network outage.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q4",
          prompt: "An `nmap` scan reports port 8080 as `filtered` rather than `closed`. What does that mean?",
          options: [
            "No response came back at all, so a firewall is dropping the probes — `closed` would mean a RST was received",
            "The port is open but the service refused the connection",
            "The port is open on IPv6 but not on IPv4",
            "The scan was rate-limited and the result is unreliable",
          ],
          correctIndex: 0,
          explanation:
            "`open` means SYN-ACK, `closed` means RST, `filtered` means silence. `closed` is actually useful news: the host is reachable and a firewall is not in the way, so the problem is the service.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-firewalls-drop-vs-reject-q5",
          prompt: "Which of these would produce a connect *timeout* rather than a refusal? (Select all that apply.)",
          options: [
            "A security group that does not allow the port",
            "A route sending the traffic to a subnet with no path back",
            "An egress rule blocking the outbound connection",
            "The service having crashed while the host stays up",
            "The client resolving the name to an address that does not exist in DNS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that silently discards a packet produces a timeout. A crashed service on a live host yields an immediate RST, and a DNS failure never reaches the connect stage at all — it fails with a resolution error.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q6",
          prompt: "A container build in a locked-down subnet hangs for minutes fetching dependencies, then fails. What is the likely mechanism?",
          options: [
            "Egress filtering is dropping the outbound connections, so the client waits out its timeout rather than being refused",
            "The registry is rate-limiting and is deliberately delaying responses",
            "DNS is resolving the registry to an internal mirror that is down",
            "The build is running out of memory and swapping",
          ],
          correctIndex: 0,
          explanation:
            "Outbound rules are where people forget to look, because \"the firewall\" is mentally an inbound thing. The timeout signature — rather than a refusal or an HTTP 403 — is the giveaway that packets are being dropped on the way out.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q7",
          prompt: "Why do stateful firewalls need only one rule where stateless ones need two?",
          options: [
            "A stateful firewall records each accepted flow and matches the return packets against it automatically",
            "A stateful firewall rewrites the return packets to match the inbound rule",
            "A stateless firewall processes rules twice per packet, so two rules are needed for symmetry",
            "Stateful firewalls only work on TCP, where the handshake makes direction unambiguous",
          ],
          correctIndex: 0,
          explanation:
            "Connection tracking is what makes \"allow inbound 443\" complete. It also means the tracking table is a finite resource — a full conntrack table drops new flows even when every rule is correct.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q8",
          prompt: "A cloud security group allows port 5432, but connections still time out. What is worth checking next?",
          options: [
            "A host firewall on the instance, and whether both the source's outbound rules and the destination's inbound rules allow it",
            "Whether the database supports the client's TLS version",
            "Whether the instance has a public IP address",
            "Whether the security group has been attached for at least five minutes",
          ],
          correctIndex: 0,
          explanation:
            "Cloud filters and host filters are independent layers and both must permit the traffic, in both directions of the policy. A TLS mismatch would fail after connecting, not on connect.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q9",
          prompt: "Blocking all ICMP at a firewall is a common hardening step. What does it break?",
          options: [
            "Path MTU discovery and useful diagnostics — the \"fragmentation needed\" message is ICMP, so blocking it creates MTU black holes",
            "TCP retransmission, which relies on ICMP to signal loss",
            "DNS, which uses ICMP for truncated responses",
            "TLS session resumption, which is negotiated over ICMP",
          ],
          correctIndex: 0,
          explanation:
            "ICMP is control signalling, not just `ping`. Dropping type 3 code 4 in particular is how you get the classic \"small requests work, large ones hang\" failure that costs days to find.",
        },
        {
          id: "net-firewalls-drop-vs-reject-q10",
          prompt: "How do security groups and network ACLs differ in how rules are evaluated?",
          options: [
            "Security groups are stateful, allow-only and evaluated as a set; NACLs are stateless with ordered allow and deny rules",
            "Security groups are stateless and NACLs are stateful",
            "Both are stateful, but NACLs apply only to outbound traffic",
            "Security groups support deny rules and NACLs do not",
          ],
          correctIndex: 0,
          explanation:
            "The two layers answer different questions: a security group says who may talk to this resource, a NACL is a coarse subnet-level filter with explicit denies. Only the NACL can block a specific address, and only it needs ephemeral-port rules.",
        },
      ],
    },
    {
      id: "net-load-balancers-l4-l7",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "Load Balancers: L4 vs L7",
      summary:
        "An L4 load balancer forwards on the 4-tuple. It cannot see a URL, cannot retry a request, cannot add a header — and in exchange it is fast, protocol-agnostic and can pass TLS straight through, so Postgres, Redis, raw gRPC and anything else over TCP all work, and backends can do their own mTLS. An L7 load balancer terminates the connection and parses HTTP, which unlocks routing by host and path, retries on idempotent methods, sticky sessions by cookie, header rewriting, response compression and per-route rate limits. The price is that it becomes the place certificates live, the place client identity is lost unless deliberately forwarded, and a component that understands only HTTP-shaped traffic.\n\nTwo consequences dominate real incidents. First, client identity: with L7 the backend reads `X-Forwarded-For` (or `Forwarded`, RFC 7239); with L4 it sees the balancer's address unless the PROXY protocol is enabled. Either way, trusting a forwarding header from anything other than a known proxy means anyone can spoof their address past your rate limiter — the trusted-proxy list is the security control, not the header.\n\nSecond, long-lived connections defeat L4 balancing. A balancer only makes a decision when a connection is established, so with HTTP/2, gRPC or WebSockets every subsequent request on that pinned connection goes to the same backend. Scaling out then changes nothing until clients reconnect — the \"we added instances and nothing improved\" incident. The fixes are an L7 balancer that balances per request, client-side load balancing, or forcing periodic reconnection with a maximum connection age.\n\nHealth checks deserve the same scepticism. An L4 check that only completes a handshake will happily keep routing to a process that is up and returning 500s to everything; an HTTP check against a real readiness endpoint is what you want. And when the balancer itself generates an error, read it precisely: a 502 means the upstream replied with something invalid or reset the connection, a 503 usually means no healthy backend existed, and a 504 means the upstream accepted the request and did not answer in time.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "RFC 7239: Forwarded HTTP Extension", url: "https://datatracker.ietf.org/doc/html/rfc7239", kind: "spec" },
        { label: "HAProxy: the PROXY protocol specification", url: "https://www.haproxy.org/download/2.8/doc/proxy-protocol.txt", kind: "spec" },
        { label: "MDN: X-Forwarded-For", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For", kind: "docs" },
      ],
      video: {
        title: "Load balancing in Layer 4 vs Layer 7 with HAPROXY Examples",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=aKMLgFVxZYk",
        videoId: "aKMLgFVxZYk",
        startSeconds: 360,
        chapterLabel: "L4 Load balancer",
        durationLabel: "37:32",
      },
      alternateVideos: [
        {
          title: "What are L4 Load Balancers and how do they work?",
          channel: "Arpit Bhayani",
          url: "https://www.youtube.com/watch?v=RcarDmgWezY",
          videoId: "RcarDmgWezY",
          durationLabel: "18:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-load-balancers-l4-l7-q1",
          prompt: "You need `/api/*` to go to one backend pool and everything else to another. Which layer can do this, and why?",
          options: [
            "L7 only — the path exists in the HTTP request, which requires parsing (and therefore terminating) the connection",
            "L4 only, because paths are matched before the connection is established",
            "Either, since paths are visible in the TCP header",
            "Neither; path routing requires a separate reverse proxy behind the balancer",
          ],
          correctIndex: 0,
          explanation:
            "An L4 device sees addresses and ports. Reading a path means decrypting and parsing HTTP, which is exactly what \"layer 7\" means — and exactly why it costs you the end-to-end TLS session.",
        },
        {
          id: "net-load-balancers-l4-l7-q2",
          prompt:
            "A gRPC service behind an L4 balancer shows one backend at 90% CPU while the others idle, even though clients are spread evenly. What is happening?",
          options: [
            "gRPC multiplexes many calls over one long-lived HTTP/2 connection, and an L4 balancer only chooses a backend once per connection",
            "The balancing algorithm is least-connections, which always prefers the busiest backend",
            "gRPC ignores the balancer and connects to backends directly",
            "HTTP/2 requires all traffic from one client to reach a single backend",
          ],
          correctIndex: 0,
          explanation:
            "Connection-level balancing plus connection-level multiplexing equals no balancing at all. The answers are an L7 balancer that routes per request, client-side balancing, or capping connection age so clients periodically redistribute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-load-balancers-l4-l7-q3",
          prompt: "All requests appear in the backend's logs with the balancer's IP as the client address. What recovers the real one?",
          options: [
            "`X-Forwarded-For` from an L7 balancer, or the PROXY protocol on an L4 one — both must be enabled on the balancer and trusted only from it",
            "Reverse DNS on the balancer's address",
            "Enabling TCP timestamps, which carry the original address",
            "Reading the TLS SNI, which contains the client's address",
          ],
          correctIndex: 0,
          explanation:
            "The address must be carried at a layer the balancer does not rewrite. PROXY protocol prepends a small header to the TCP stream before any application bytes, which is why it works for non-HTTP protocols too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-load-balancers-l4-l7-q4",
          prompt: "Which of these become possible only when the balancer terminates TLS and parses HTTP? (Select all that apply.)",
          options: [
            "Retrying a failed request on another backend",
            "Routing by `Host` header or URL path",
            "Adding or rewriting request headers such as `X-Request-Id`",
            "Distributing new TCP connections across a backend pool",
            "Passing a client certificate through to the backend unchanged",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Spreading connections is the L4 baseline, and passing a client certificate through is something only *passthrough* preserves — terminating TLS is precisely what destroys it.",
        },
        {
          id: "net-load-balancers-l4-l7-q5",
          prompt: "A backend's health check is a TCP connect on port 8080. The process is up but every request returns 500. What does the balancer do?",
          options: [
            "Keeps sending it traffic, because a completed handshake is all the check requires",
            "Removes it, because a 500 response fails the check",
            "Halves its share of traffic until the errors stop",
            "Marks it unhealthy only after the connection is closed",
          ],
          correctIndex: 0,
          explanation:
            "A TCP check proves a socket accepts connections, nothing more. A readiness endpoint that exercises dependencies and returns a real status code is what actually takes a broken instance out of rotation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-load-balancers-l4-l7-q6",
          prompt: "Your rate limiter keys on `X-Forwarded-For` and is being bypassed. What is the flaw?",
          options: [
            "The header is accepted from any source, so a client can set it themselves; only the value appended by a trusted proxy is meaningful",
            "`X-Forwarded-For` is deprecated and always empty in modern browsers",
            "The header contains only the proxy's address, never the client's",
            "Rate limiting must key on the TLS session id instead",
          ],
          correctIndex: 0,
          explanation:
            "`X-Forwarded-For` is a comma-separated list that anyone can prepend to. You must parse from the right, discarding entries contributed by hops you trust, and never trust the header at all from an untrusted source.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-load-balancers-l4-l7-q7",
          prompt: "Which requests can a load balancer safely retry on another backend after a failure?",
          options: [
            "Idempotent ones — GET, HEAD, PUT, DELETE — unless the application supplies an idempotency key for the rest",
            "Any request, because the first attempt failed by definition",
            "Only GET, because it is the sole method with no body",
            "None; retries always belong in the client",
          ],
          correctIndex: 0,
          explanation:
            "A failed POST may still have been processed — a reset connection does not prove the write did not land. That is why payment APIs accept an `Idempotency-Key` header, which makes retrying a POST safe by making it deduplicable.",
        },
        {
          id: "net-load-balancers-l4-l7-q8",
          prompt: "Sticky sessions can be implemented by source-IP hashing or by a cookie. What breaks the source-IP approach?",
          options: [
            "NAT and mobile networks — many clients share one address, and one client's address can change mid-session",
            "HTTPS, because the source address is encrypted",
            "IPv6, which has no stable source address",
            "HTTP/2, which sends each request from a different port",
          ],
          correctIndex: 0,
          explanation:
            "Hashing an address assumes it identifies a user, and NAT makes that false in both directions: thousands of users on one address, and one user changing address on a network switch. A cookie survives both but requires L7.",
        },
        {
          id: "net-load-balancers-l4-l7-q9",
          prompt: "A balancer returns 502 for some requests and 504 for others. What does each indicate?",
          options: [
            "502: the upstream returned an invalid response or reset the connection. 504: the upstream accepted the request but did not respond within the timeout",
            "502: no healthy backends. 504: the client's request was malformed",
            "502: TLS failed to the backend. 504: TLS failed to the client",
            "They are interchangeable; balancers pick one arbitrarily",
          ],
          correctIndex: 0,
          explanation:
            "502 means the upstream misbehaved — often a crash mid-response or a connection reset — and 504 means it was too slow. 503 is the third member of the family, generally meaning no healthy backend was available at all.",
        },
        {
          id: "net-load-balancers-l4-l7-q10",
          prompt: "When is a passthrough (L4) balancer the right choice despite losing HTTP features?",
          options: [
            "When backends need to perform their own TLS or mTLS, or when the protocol is not HTTP at all",
            "Whenever traffic exceeds a few thousand requests per second",
            "When you need per-request retries and header injection",
            "When you want the balancer to handle certificate renewal centrally",
          ],
          correctIndex: 0,
          explanation:
            "Passthrough keeps one end-to-end TLS session, which is what backend-terminated mTLS requires, and it works for any TCP protocol. The other three options are precisely the reasons to terminate at L7 instead.",
        },
      ],
    },
    {
      id: "net-debugging-toolkit",
      moduleId: "devops-networking-tls",
      trackId: "devops",
      title: "Debugging \"It Works Locally\" Systematically",
      summary:
        "Everything in this camp converges here. The skill is not knowing more tools; it is working the path in order and stopping at the first layer that disagrees with what you expect, instead of forming a theory and hunting for evidence.\n\nThe order is fixed. **Does the name resolve, and to what?** `dig +short name`, then `getent hosts name` (which goes through NSS the way your application does), then the authoritative server for comparison. **Is the host reachable and is there a route?** `ping` and `traceroute`, remembering that filtered ICMP proves nothing either way. **Does the TCP connection open?** `nc -vz host port` or `curl -v --connect-timeout 3`, and read refused versus timed out: refused means a host answered and nothing was listening, timed out means a packet was discarded. **Does TLS complete, and with which certificate?** `openssl s_client -connect host:443 -servername host` or `curl -v`, checking the negotiated version, the ALPN result and the chain. **Does HTTP behave?** Status, redirects, and `curl -sS -o /dev/null -w '%{http_code} dns=%{time_namelookup} conn=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer}\\n'`, which turns \"it's slow\" into a number attached to a layer. **Only then, packets.** `ss -tanp` to see socket state, `tcpdump -nn -i any 'tcp port 443 and host X'` to see whether the SYN even left the machine.\n\nThe second habit is bisecting the boundary. Run the identical request from inside the container, from the host, and from a third machine; the first place the result changes is where the problem lives. \"It works locally\" is not a complaint, it is a bisection result you have not finished using.\n\nAnd know what your tools do not share with your application. `curl` uses its own CA bundle and honours `HTTP_PROXY`/`NO_PROXY`; your runtime may use neither. `dig` skips `/etc/hosts`, NSS and every in-process cache. `tcpdump -i any` inside a network namespace sees only that namespace. Each of those gaps has produced an outage where the tool said everything was fine.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "curl manual: options and exit codes", url: "https://curl.se/docs/manpage.html", kind: "docs" },
        { label: "Everything curl: verbose mode", url: "https://everything.curl.dev/usingcurl/verbose/", kind: "article" },
        { label: "man7: tcpdump(8)", url: "https://man7.org/linux/man-pages/man8/tcpdump.8.html", kind: "docs" },
        { label: "man7: traceroute(8)", url: "https://man7.org/linux/man-pages/man8/traceroute.8.html", kind: "docs" },
      ],
      video: {
        title: "cURL Verbose Mode Explained (and how I use it to Troubleshoot my Backend)",
        channel: "Hussein Nasser",
        url: "https://www.youtube.com/watch?v=PVm0YEEuS8s",
        videoId: "PVm0YEEuS8s",
        durationLabel: "16:12",
      },
      alternateVideos: [
        {
          title: "Using Wireshark to analyze TCP SYN/ACKs to find TCP connection failures and latency issues.",
          channel: "Mike Pennacchi",
          url: "https://www.youtube.com/watch?v=RTJLbXEqBhM",
          videoId: "RTJLbXEqBhM",
          durationLabel: "6:11",
        },
        {
          title: "tcpdump - Traffic Capture & Analysis",
          channel: "HackerSploit",
          url: "https://www.youtube.com/watch?v=1lDfCRM6dWk",
          videoId: "1lDfCRM6dWk",
          durationLabel: "23:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "net-debugging-toolkit-q1",
          prompt:
            "A `curl -v` run produces only this before hanging:\n\n```\n* Host api.internal:443 was resolved.\n* IPv4: 10.0.4.19\n*   Trying 10.0.4.19:443...\n```\n\nWhat has been proved, and what is the next check?",
          options: [
            "DNS works and the address is known; the TCP handshake is getting no answer, so check firewall rules, routing and whether anything is listening",
            "TLS negotiation failed; check the certificate chain",
            "The server returned an empty response; check application logs",
            "The name resolved to the wrong address; check the DNS records",
          ],
          correctIndex: 0,
          explanation:
            "curl prints each stage as it completes, so stopping at `Trying` means the SYN went unanswered. A TLS problem would appear after a successful connect, with handshake lines.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-debugging-toolkit-q2",
          prompt:
            "A timing breakdown reports `dns=0.004 conn=0.021 tls=0.812 ttfb=0.840`. Where is the time going?",
          options: [
            "The TLS handshake — roughly 790 ms between connect and app-level connect, which points at handshake round trips, an OCSP fetch or a slow key exchange",
            "DNS resolution, which dominates the total",
            "The application, since TTFB is the largest number",
            "The TCP connection, which took 21 ms longer than it should",
          ],
          correctIndex: 0,
          explanation:
            "These counters are cumulative, so each stage costs the difference from the previous one. `ttfb - tls` is only 28 ms, so the server responded promptly once the session existed: the handshake is the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-debugging-toolkit-q3",
          prompt: "What is the correct order to check when a service cannot reach a dependency?",
          options: [
            "Name resolution, then routing/reachability, then TCP connect, then TLS, then HTTP, then packet capture",
            "Packet capture first, since it shows everything at once",
            "HTTP status codes first, then work downward if they look wrong",
            "TLS first, because most modern failures are certificate problems",
          ],
          correctIndex: 0,
          explanation:
            "Each layer depends on the one below, so a failure low down makes every observation above it meaningless. Packet capture is powerful and slow to read — it is the last resort, not the first move.",
        },
        {
          id: "net-debugging-toolkit-q4",
          prompt: "Which of these does `curl -v` tell you directly? (Select all that apply.)",
          options: [
            "Which IP address the name resolved to and which one it connected to",
            "The negotiated TLS version and the ALPN protocol",
            "The certificate's subject, issuer and validity dates",
            "Which backend instance served the request",
            "Whether the server's accept queue is full",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Verbose output covers resolution, connection, the handshake and headers. Identifying a specific backend needs something the application exposes, and queue depth is visible only on the server with `ss`.",
        },
        {
          id: "net-debugging-toolkit-q5",
          prompt:
            "`tcpdump -nn -i any 'tcp port 5432 and host 10.0.9.4'` on the client shows repeated `Flags [S]` packets and nothing coming back. What does that establish?",
          options: [
            "The SYNs are leaving this host, so the loss or the block is somewhere on the path or at the destination — not in the client's own stack",
            "The destination is refusing the connection",
            "The client's routing table is missing an entry for that host",
            "The server is responding but the replies are being dropped by the client's application",
          ],
          correctIndex: 0,
          explanation:
            "Seeing your own SYNs on the wire rules out the local socket layer and local filtering on egress. Repeated SYNs with no RST and no SYN-ACK is the packet-level signature of a drop, and moves the investigation to the path.",
        },
        {
          id: "net-debugging-toolkit-q6",
          prompt: "A request works from the host but fails from inside a container on that host. What should you compare first?",
          options: [
            "Name resolution and the bind address: the container has its own resolver configuration, its own loopback and its own routes",
            "The container's CPU limit, which throttles the network stack",
            "Whether the image is based on Alpine, which cannot do TLS",
            "The container's restart policy",
          ],
          correctIndex: 0,
          explanation:
            "The boundary is the network namespace. Different `/etc/resolv.conf`, different loopback, possibly a bridge subnet that hijacks the route — all reasons the same command behaves differently one layer in.",
        },
        {
          id: "net-debugging-toolkit-q7",
          prompt: "`curl` succeeds against an endpoint but the browser shows a certificate warning for the same URL. Which explanations fit?",
          options: [
            "The chain is incomplete and curl's CA bundle happens to contain the intermediate, or the browser applies HSTS or stricter policy that curl does not",
            "curl always skips certificate validation unless `-k` is passed",
            "The browser is using HTTP/3 while curl is using HTTP/1.1, and only HTTP/3 validates certificates",
            "The browser resolves the name over DoH and therefore reaches a different server",
          ],
          correctIndex: 0,
          explanation:
            "curl validates by default — `-k` disables it. The two clients differ in trust stores, in AIA fetching and in policies such as HSTS and Certificate Transparency enforcement, so either can be the stricter one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "net-debugging-toolkit-q8",
          prompt: "`dig api.internal` returns the expected address, but the application resolves something else. Which tool settles it?",
          options: [
            "`getent hosts api.internal`, which goes through NSS — `/etc/hosts`, the stub resolver, then DNS — exactly as most applications do",
            "`nslookup`, which queries the authoritative server directly",
            "`ping`, whose output prints the resolver that was used",
            "`traceroute`, which shows which resolver answered",
          ],
          correctIndex: 0,
          explanation:
            "`dig` sends its own DNS query and ignores `/etc/hosts` and NSS entirely. `getent` is the one that reproduces what `getaddrinfo` — and therefore your service — will see.",
        },
        {
          id: "net-debugging-toolkit-q9",
          prompt: "A request from a build agent fails while the same request from your laptop works, and the agent has `HTTPS_PROXY` set. What is worth checking?",
          options: [
            "Whether the target should be in `NO_PROXY`, and whether the application honours the proxy variables at all — curl does, many runtimes do not",
            "Whether the agent has IPv6 disabled",
            "Whether the proxy supports HTTP/3",
            "Whether the agent's clock is synchronised",
          ],
          correctIndex: 0,
          explanation:
            "Proxy environment variables are honoured inconsistently: curl, Go and Python's requests read them, while other runtimes and SDKs ignore them or use different names. That mismatch is why a tool and an application can behave differently on the same host.",
        },
        {
          id: "net-debugging-toolkit-q10",
          prompt: "`ss -tanp` on the client shows a socket stuck in `SYN-SENT` to the upstream. What does that tell you?",
          options: [
            "The client sent a SYN and has had no reply — the same evidence as a connect timeout, confirmed at the socket layer",
            "The connection was refused and is waiting to be cleaned up",
            "The TLS handshake is in progress",
            "The server's accept queue is full and has queued the connection",
          ],
          correctIndex: 0,
          explanation:
            "`SYN-SENT` is the state between sending a SYN and receiving a SYN-ACK. A refusal would tear the socket down immediately, and TLS happens after the socket reaches `ESTAB`.",
        },
        {
          id: "net-debugging-toolkit-q11",
          prompt: "What is the fastest way to decide whether a problem is the client, the network or the server?",
          options: [
            "Run the identical request from three vantage points — inside the container, on the host, and from another machine — and find where the result changes",
            "Restart the service and see whether the problem recurs",
            "Increase every timeout and see whether the request eventually succeeds",
            "Check the server's CPU and memory graphs for the period in question",
          ],
          correctIndex: 0,
          explanation:
            "Bisecting by vantage point isolates the boundary in minutes and needs no privileged access. Restarting destroys the evidence, and raising timeouts hides the symptom without identifying the layer.",
        },
        {
          id: "net-debugging-toolkit-q12",
          prompt:
            "You need to reproduce a browser request from a server, hitting one specific origin behind a load balancer. Which command is right?",
          options: [
            "`curl -v --resolve api.example.com:443:10.0.3.9 https://api.example.com/health`",
            "`curl -v -k https://10.0.3.9/health`",
            "`curl -v https://api.example.com/health --http1.1 --no-keepalive`",
            "`nc -vz 10.0.3.9 443`",
          ],
          correctIndex: 0,
          explanation:
            "`--resolve` pins the address while keeping the hostname for SNI, certificate verification and the `Host` header — the only way to test one origin exactly as a real client would reach it. `-k` would hide precisely the certificate problems you might be hunting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
