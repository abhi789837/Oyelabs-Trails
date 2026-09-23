# Kubernetes in Depth research notes (2026-09-23)

Sixth camp of the v3 DevOps & Cloud track. Scope decision: this camp starts where the Backend
track's `docker-kubernetes-intro` (in `src/content/backend/be-docker.ts`) stops. That topic already
covers Pods/Services/Deployments at an introductory level, plus one question each on probes,
Secrets-are-base64, rollout arithmetic and requests-vs-usage. Every topic here therefore goes a
layer deeper and no quiz question is reused: where the same concept reappears (rollout maths,
Secrets, probes, QoS) the questions attack a different aspect — `maxSurge` rounding on a replica
count where 25% is an exact integer, selector immutability, `subPath` config mounts, the
OOMKill-versus-eviction distinction, `ReadWriteOnce`-is-per-node.

Also out of scope by assignment, and deliberately not touched: Linux fundamentals, networking /
DNS / TLS internals, reverse proxies, AWS, Terraform and observability tooling. Cluster
observability appears only as the last third of `k8s-debugging` (node conditions, `kubectl top`,
event retention), because the brief pairs it with debugging.

## Scope judgement: 17 topics, not 13–16

The brief asked for 13–16 topics and then enumerated 17 distinct subjects. I wrote 17 rather than
merge two of them. The two merge candidates were "namespaces, labels and selectors" with either
RBAC or network policies; both merges produced a topic with no single video that matched it and a
quiz that read as a grab bag. Splitting them keeps each topic's video specific to its subject,
which §3 of the authoring guide asks for. Net effect: one topic over the suggested range.

## Topic list

1. `k8s-control-plane` — The Control Plane & the Reconciliation Loop (advanced)
2. `k8s-pods` — Pods, and Why You Rarely Create One (advanced)
3. `k8s-deployments-rollouts` — Deployments, ReplicaSets & Rollout Strategy (advanced)
4. `k8s-services` — Services and the Four Types (advanced)
5. `k8s-ingress-gateway` — Ingress and the Gateway API (advanced)
6. `k8s-config-secrets` — ConfigMaps and Secrets (intermediate)
7. `k8s-resources-qos` — Requests, Limits & QoS Classes (**expert, milestone**)
8. `k8s-probes` — Liveness, Readiness & Startup Probes (advanced)
9. `k8s-statefulsets-storage` — StatefulSets, PersistentVolumes & Storage Classes (advanced)
10. `k8s-daemonsets-jobs` — DaemonSets, Jobs & CronJobs (intermediate)
11. `k8s-namespaces-labels` — Namespaces, Labels & Selectors (intermediate)
12. `k8s-rbac` — RBAC & Service Accounts (advanced)
13. `k8s-scheduling` — The Scheduler: Taints, Tolerations & Affinity (advanced)
14. `k8s-autoscaling` — Autoscaling: HPA, VPA & the Cluster Autoscaler (advanced)
15. `k8s-helm-kustomize` — Helm and Kustomize (intermediate)
16. `k8s-network-policies` — Network Policies (advanced)
17. `k8s-debugging` — Debugging a Failing Pod Systematically (**expert, milestone**)

## Videos

Every id below came from `yt.mjs search` and was confirmed with `yt.mjs info` (all
`embeddable: true`). No search-URL fallbacks; `content:check` reports 0 warnings.

Two long courses act as spines with chapter deep-links, both recent enough to post-date the
dockershim removal:

- **`_4uQI4ihGVU`** — "Learn Kubernetes in 6 Hours – Full Course with Real-World Project"
  (**freeCodeCamp.org**, 5:53:25, published 2026-02-26). The most current free full course found,
  and the only one whose chapter list includes Gateway API and CRI/CNI/CSI. Chapters used:
  **9146 Pods** (`k8s-pods`), **12939 Deployments** (`k8s-deployments-rollouts`), **14565 ConfigMap
  and Secrets** (`k8s-config-secrets`). As alternates: 5063 Kubernetes Architecture
  (`k8s-control-plane`), 8241 RBAC (`k8s-rbac`), 10942 Scheduler (`k8s-scheduling`), 20091 Gateway
  API (`k8s-ingress-gateway`). Other markers noted but unused: 5804 CRI, 6153 CNI, 7108 CSI,
  7407 Kube-Proxy, 7974 CoreDNS, 15970 DaemonSet, 16131/17393 Services, 16498 StatefulSet,
  18931 CloudNativePG & Volumes, 20863 Basic monitoring demo.
- **`2T86xAtR6Fo`** — "Complete Kubernetes Course - From BEGINNER to PRO" (**DevOps Directive**,
  6:14:41, 2024-08). Used at **16542 "Debugging Applications in Kubernetes"** (`k8s-debugging`,
  primary) and **17184 "Deploying to Multiple Environments (Kustomize, Helm, and Kluctl)"**
  (`k8s-helm-kustomize`, alternate). Same channel already used for a Docker alternate in
  `be-docker`, which is fine — different course, different topics.

Dedicated videos where one beat a chapter:

| Topic | Video | Why |
| --- | --- | --- |
| `k8s-control-plane` | `kss081c8EqY` "Kubernetes Controllers Deep Dive: How They Really Work" (DevOps & AI Toolkit, 27:30, 2025-10) | The only recent video found that is about reconciliation as an idea rather than a component diagram, which is what this topic is for. |
| `k8s-services` | `T4Z7visMM4E` "Kubernetes Services explained \| ClusterIP vs NodePort vs LoadBalancer vs Headless" (TechWorld with Nana, 24:13) | Exactly the topic's title, including headless. 682k views; Service semantics have not changed since it was made. |
| `k8s-ingress-gateway` | `xaZ87iSvMAI` "Gateway API Explained: The Future of Kubernetes Networking" (KodeKloud, 45:13, 2025-04) | Recent, covers the role split and migration framing rather than a single vendor's controller. |
| `k8s-resources-qos` | `lKH1K5R3kqg` "All You Need to Know in 12 Minutes: Pods' Requests and Limits" (The Good Guy, 12:40) | See the caveat below. |
| `k8s-probes` | `x2e6pIBLKzw` "Day 18/40 - Kubernetes Health Probes Explained" (Tech Tutorials with Piyush, 28:52, 2024-07) | Covers all three probe types with demos of each handler. |
| `k8s-statefulsets-storage` | `pPQKAR1pA9U` "Kubernetes StatefulSet simply explained" (TechWorld with Nana, 15:59) + `0swOh5C3OVM` "Kubernetes Volumes explained" (21:14) as alternate | The two canonical explainers, 287k and 451k views. |
| `k8s-daemonsets-jobs` | `kvITrySpy_k` "Day 12/40 - Kubernetes Daemonset Explained - Daemonsets, Job and Cronjob" (Tech Tutorials with Piyush, 19:30) | One video covering exactly the three kinds this topic merges. |
| `k8s-namespaces-labels` | `X48VuDVv0do` @6376 "Organizing your components with K8s Namespaces" (TechWorld with Nana, chapter ≈15 min) | See the caveat below. |
| `k8s-rbac` | `iE9Qb8dHqWI` "Kubernetes RBAC Explained" (Anton Putra, 23:17, 2024-04) | |
| `k8s-scheduling` | `rX4v_L0k4Hc` "Node Selector vs Node Affinity vs Pod Affinity vs Taints & Tolerations" (Anton Putra, 11:17) | Title is the topic. Makes the attraction-vs-repulsion distinction explicitly. |
| `k8s-autoscaling` | `hsJ2qtwoWZw` "Kubernetes Autoscaling: HPA vs. VPA vs. Keda vs. CA vs. Karpenter vs. Fargate" (Anton Putra, 14:37) | Covers all three axes plus the event-driven option in one pass. |
| `k8s-helm-kustomize` | `s1-dnYet5f8` "Helm vs. Kustomize: When, Why, and How?" (Ahmed Elfakharany, 15:42) | The comparison framing this topic needs; Nana's Helm explainer (`-ykwb1d0DXU`, 1.0M views) is an alternate. |
| `k8s-network-policies` | `eVtnevr3Rao` "Day 26/40 - Kubernetes Network Policies Explained" (Tech Tutorials with Piyush, 45:47) | Longest and most thorough of the options; `Fr-6oDHbobM` (Kubesimplify, 17:45) is the shorter alternate. |

### Weak video picks, flagged

- **`k8s-resources-qos`** is the weakest match in the camp. Searches for requests/limits/QoS/CPU
  throttling returned almost nothing with both recency and real viewership: the best candidates
  were `lKH1K5R3kqg` (12.9k views, 2023), Anton Putra's `ka-HItczp2I` (2:58 — accurate but far too
  short to carry a milestone) and Robusta's `_nknHwTKlh8` (6:33, failure-mode framing). I used the
  first as primary and the other two as alternates, so the three together cover the topic. Worth
  replacing if a better long-form video appears. Rejected: `W8d28GFIoCo`, `kSFZYbrr3q0`,
  `DKe86LnaVc4` — all under 500 views and unvetted.
- **`k8s-namespaces-labels`** has no good dedicated video either; everything found was either a
  Hindi-language lecture, a sub-5k-view short, or a 1.5-hour tutorial. Nana's namespace chapter is
  from the 2020 full course (`X48VuDVv0do`), which is the oldest source in the camp, but nothing
  about namespaces, labels or selectors has changed since. Flagged rather than hidden.
- **`k8s-debugging`** had no strong dedicated video: the top search results were all under 1k
  views. Using two chaptered course segments (DevOps Directive 569k views; freeCodeCamp's 2026 CKA
  update as alternate) was better than any standalone option found.

Considered and rejected overall: `MTHGoGUFpvE` (Alta3, 2:50:08 — good but no chapter granularity
for this camp), `W04brGNgxN4` (TrainWithShubham, 11:42:52 — chapter list is project-oriented),
`JoHUi9KvnOA` (Abhishek.Veeramalla, 7:00:14, 2022 — predates several facts used here),
`_LH5HdczZNc` (43-hour CKA course, 2 weeks old, 42k views — unvetted and unusably long).

## References

All URLs checked with `check-urls.mjs`; every one returns 200 and none block framing
(`kubernetes.io`, `gateway-api.sigs.k8s.io`, `helm.sh`, `kubectl.docs.kubernetes.io`,
`github.com`, `srcco.de` and `home.robusta.dev` all report "no framing restrictions", so this
camp's reference cards should preview inline — unusually good compared with the PHP camp).

Notes on specific URLs:

- **`gateway-api.sigs.k8s.io` restructured its docs.** The obvious-looking `/concepts/api-overview/`
  and `/api-types/gateway/` are both 404. The real paths are `/docs/introduction/`,
  `/reference/api-types/gateway/`, `/reference/api-types/httproute/` and
  `/guides/getting-started/migrating-from-ingress/`. Found by reading the site's own
  `sitemap.xml`, not by guessing.
- **`kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/` redirects** to
  `/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/`. The final URL is used.
- No interview-prep repo exists for Kubernetes at a quality worth shipping (the JS/React repos in
  the guide have no equivalent here). `ahmetb/kubernetes-network-policy-recipes` is used as a
  `repo` reference in `k8s-network-policies` because it is genuinely the standard reference for
  writing policies, and the two `kubernetes/autoscaler` subdirectories are the canonical homes of
  the Cluster Autoscaler and VPA, which have no docs page on kubernetes.io.
- Two external articles carry real weight and both resolve: Henning Jacobs,
  "Liveness Probes are Dangerous" (`srcco.de`) and Robusta, "For the Love of God, Stop Using CPU
  Limits on Kubernetes" (`home.robusta.dev`). Both are cited in topics that present the debate as
  a debate rather than as settled.

## Facts verified

Checked against each project's own endpoint or docs page on 2026-09-23, not from memory.

- **Kubernetes 1.37.0 is current stable** (`curl -s https://dl.k8s.io/release/stable.txt` →
  `v1.37.0`; `latest.txt` → `v1.38.0-alpha.0`). kubernetes.io's version switcher lists
  v1.37/1.36/1.35/1.34/1.33, which confirms it independently. Matches `CONTENT_GUIDE.md` §10b.
- **Gateway API v1.6.2** (released 2026-09-03, from the GitHub releases API). The stable API group
  is `gateway.networking.k8s.io/v1`, and kubernetes.io states "Gateway API has four stable API
  kinds": GatewayClass, Gateway, HTTPRoute, GRPCRoute. CRDs are **not** shipped with Kubernetes.
- **"The Ingress API has been frozen"** — stated verbatim on
  `kubernetes.io/docs/concepts/services-networking/ingress/`. Ingress is `networking.k8s.io/v1`,
  `pathType` is required, and its values are `Exact`, `Prefix` and `ImplementationSpecific`.
- **Sidecar containers: stable since v1.33**, first available in v1.28, on by default since v1.29.
  A sidecar is an entry in `initContainers` with `restartPolicy: Always`; the kubelet postpones
  terminating it until the main containers have stopped, and it does not block Job completion.
- **In-place Pod resize: stable since v1.35** (`/resize` subresource, `resizePolicy`,
  `PodResizePending`/`PodResizeInProgress` conditions). Resizing memory-backed `emptyDir` is
  **alpha in 1.37, disabled by default** — mentioned nowhere in the content, deliberately.
- **StatefulSet `persistentVolumeClaimRetentionPolicy`: stable since v1.32**, enabled by default
  (`whenDeleted` / `whenScaled`). Other StatefulSet feature states read off the same page: minimum
  ready seconds stable 1.25, start ordinal stable 1.31, pod index label stable 1.32; the
  `Recreate` update strategy is still alpha (not used in content).
- **QoS criteria, from the Pod QoS page.** *Guaranteed*: every container has a memory request and
  limit, both > 0 and equal, **and** a CPU request and limit, both > 0 and equal. *BestEffort*: no
  container has any CPU or memory request or limit. *Burstable*: everything else. Eviction order
  under node pressure is BestEffort → Burstable → Guaranteed, and "only Pods exceeding resource
  requests are candidates for eviction". Pod-level resources are **beta since 1.34, on by default**.
- **Deployment.** `.spec.selector` is "immutable after creation of the Deployment in apps/v1".
  A revision is created "if and only if the Deployment's Pod template is changed", so scaling does
  not make one. On a stalled rollout, "Kubernetes takes no action … other than to report a status
  condition with reason `ProgressDeadlineExceeded`" — no automatic rollback. `pod-template-hash`
  is the label that keeps overlapping ReplicaSets apart.
- **Job.** `backoffLimit` "is set by default to 6"; back-off is "10s, 20s, 40s …" capped at six
  minutes. `restartPolicy` must be `OnFailure` or `Never`. Indexed completion exposes
  `JOB_COMPLETION_INDEX`.
- **CronJob.** `concurrencyPolicy` is `Allow` (default) / `Forbid` / `Replace`. If more than 100
  schedules are missed the controller "does not start the Job and logs the error … too many missed
  start times". A `startingDeadlineSeconds` below 10 seconds "may not be scheduled", because the
  controller checks every 10 seconds. `.spec.timeZone` is supported; `CRON_TZ`/`TZ` inside
  `.spec.schedule` is not. Jobs "should be idempotent".
- **DaemonSet tolerations are added automatically** by the controller:
  `node.kubernetes.io/not-ready` and `unreachable` (NoExecute), `disk-pressure`,
  `memory-pressure`, `pid-pressure` and `unschedulable` (NoSchedule), plus `network-unavailable`
  for `hostNetwork` Pods. The `unschedulable` toleration is why `kubectl cordon` does not stop
  DaemonSet Pods. DaemonSet Pods are placed by the default scheduler via node affinity.
- **RBAC.** "Permissions are purely additive (there are no 'deny' rules)."
  `rbac.authorization.k8s.io/v1`; aggregated ClusterRoles collect rules by label selector and the
  `rules` field must be omitted on them; privilege-escalation prevention blocks granting
  permissions you do not hold, bypassed only by `escalate`/`bind`.
- **NetworkPolicy.** "Network policies are implemented by the network plugin. Creating a
  NetworkPolicy resource without a controller that implements it will have no effect." Isolation
  is per-direction and only exists once a policy selects the Pod with that `policyType`; "Network
  policies do not conflict; they are additive." If `policyTypes` is omitted, `Ingress` is always
  set. Verified the `from` list semantics (selectors within one entry AND, separate entries OR)
  against the same page's "Behavior of to and from selectors" section.
- **HPA.** API is `autoscaling/v2`. `--horizontal-pod-autoscaler-downscale-stabilization` and the
  `stabilizationWindowSeconds` examples confirm the **300-second** scale-down default and 0 for
  scale-up; `--horizontal-pod-autoscaler-tolerance` and the docs' "tolerance of 10%" confirm the
  default tolerance; `--horizontal-pod-autoscaler-sync-period` is 15s. `averageUtilization` is a
  percentage of the **request** — this is the topic's headline edge case.
- **PersistentVolumes.** Current reclaim policies are `Retain` and `Delete`; dynamic provisioning
  defaults to `Delete`. `allowVolumeExpansion` is opt-in per StorageClass and shrinking is never
  supported. `ReadWriteOncePod` exists as the genuinely single-Pod access mode, which is what makes
  plain `ReadWriteOnce` (single *node*) the trap it is.
- **Admission.** ValidatingAdmissionPolicy is **stable since v1.30**; MutatingAdmissionPolicy is
  **stable since v1.36**. Neither version is asserted in a quiz answer — only the request
  pipeline's ordering (authn → authz → mutating → validating → etcd), which does not churn.
- **Event retention**: `kube-apiserver --event-ttl` defaults to `1h0m0s`. Used as the basis for
  "events are a live aid, never a post-mortem record".
- Not verified and therefore not asserted anywhere: exact CFS period tunables beyond the standard
  100 ms, Karpenter version specifics, and any cloud-provider load-balancer behaviour.

## Assessment shape

All 17 topics are **quiz**, no code challenges, per the brief and `## v3 decisions` in
`docs/PROGRESS.md`: the sandbox runs JavaScript only, so YAML and `kubectl` cannot be graded.
Difficulty is carried by read-this-manifest and read-this-`kubectl describe`-output questions —
`k8s-debugging-q1` reads a real `describe` block, `k8s-network-policies-q3` reads two nearly
identical YAML fragments whose single extra dash changes the policy's meaning.

181 questions across 17 topics. Every topic has at least two `isEdgeCaseOrInterviewQuestion` and
at least one multi-select. The edge-case questions are built from on-call failure modes as the
brief asked: a Pod `Pending` because allocatable is less than capacity, a rollout stalled because
readiness never passes, an OOMKill that looks like a crash, a Secret everyone assumes is
encrypted, a liveness probe restarting a healthy-but-slow container forever, a default-deny egress
policy that breaks DNS, a CronJob permanently dead after 100 missed schedules, a webhook with
`failurePolicy: Fail` that locks out its own fix, a node that never scales down because of one
`kubectl run` Pod, and `ReadWriteOnce` allowing two writers on one node.

## Validation

- `npm run content:check -- --module devops-kubernetes` → **0 errors, 0 warnings**
  (17 topics, 181 quiz questions).
- `npm run content:types` → no errors in this file. It does report one pre-existing, unrelated
  error in `src/content/frontend/fe-svelte.ts` (`'LOAD_STARTER' is declared but its value is never
  read`), which is another camp's file and was not touched.
