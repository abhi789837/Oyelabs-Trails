import type { Module } from "@/types/curriculum";

export default {
  id: "devops-kubernetes",
  trackId: "devops",
  name: "Kubernetes in Depth",
  description:
    "Kubernetes for the engineer who carries the pager for it. Starts where the Backend track's Kubernetes introduction stops: the reconciliation loop everything else follows from, then workloads, traffic, config, storage, scheduling, access control and autoscaling — each one framed around the way it actually fails in production. Written against Kubernetes 1.37 (containerd runtime, Gateway API 1.6).",
  refs: [
    { label: "Kubernetes: Concepts", url: "https://kubernetes.io/docs/concepts/", kind: "docs" },
    { label: "Kubernetes: Cluster Architecture", url: "https://kubernetes.io/docs/concepts/architecture/", kind: "docs" },
    { label: "Kubernetes: API Reference", url: "https://kubernetes.io/docs/reference/kubernetes-api/", kind: "docs" },
    { label: "Kubernetes: kubectl Quick Reference", url: "https://kubernetes.io/docs/reference/kubectl/quick-reference/", kind: "docs" },
  ],
  topics: [
    {
      id: "k8s-control-plane",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "The Control Plane & the Reconciliation Loop",
      summary:
        "Kubernetes is not a program that runs your containers. It is a database of objects plus a crowd of processes that keep arguing with reality until reality matches. Every object carries a `spec` (what you asked for) and a `status` (what is). The API server is the only component that reads or writes etcd; every other component watches the API server and acts on what it sees. A controller's loop is always the same three steps: observe actual state, compare with `spec`, take one step towards it — then run again.\n\nThat loop is *level-triggered*, not edge-triggered. Controllers do not consume a queue of events that must each be handled exactly once; they periodically re-derive the world from scratch, so a missed or duplicated watch event is self-healing rather than a corruption bug. It also means nothing is transactional and nothing is instant. `kubectl apply -f deploy.yaml` does not create Pods: it persists a Deployment. The Deployment controller then creates a ReplicaSet, the ReplicaSet controller creates Pods, the scheduler writes `spec.nodeName` on each one, and only then does the kubelet on that node ask containerd to start containers. A write travels authentication, then authorization (RBAC), then mutating admission, then validating admission and schema validation, and only then reaches etcd.\n\nThe gotchas all follow. A 201 from the API server means \"persisted\", not \"running\" — when something did not happen, a controller is stuck or refused, and the object's `status.conditions` and its events say which. Anything you change behind the API's back gets reverted, which is why hand-editing a ReplicaSet that a Deployment owns does nothing. Deletion is asynchronous as well: finalizers hold an object in `Terminating` until the controller that registered them removes them, which is the usual reason a namespace hangs forever.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Kubernetes: Cluster Architecture", url: "https://kubernetes.io/docs/concepts/architecture/", kind: "docs" },
        { label: "Kubernetes: Controllers", url: "https://kubernetes.io/docs/concepts/architecture/controller/", kind: "docs" },
        { label: "Kubernetes: The Kubernetes API", url: "https://kubernetes.io/docs/concepts/overview/kubernetes-api/", kind: "docs" },
        { label: "Kubernetes: API Concepts (watch, resourceVersion, server-side apply)", url: "https://kubernetes.io/docs/reference/using-api/api-concepts/", kind: "docs" },
      ],
      video: {
        title: "Kubernetes Controllers Deep Dive: How They Really Work",
        channel: "DevOps & AI Toolkit",
        url: "https://www.youtube.com/watch?v=kss081c8EqY",
        videoId: "kss081c8EqY",
        durationLabel: "27:30",
      },
      alternateVideos: [
        {
          title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
          videoId: "_4uQI4ihGVU",
          durationLabel: "5:53:25",
          startSeconds: 5063,
          chapterLabel: "Kubernetes Architecture",
        },
        {
          title: "Kubernetes Architecture explained | Kubernetes Tutorial 15",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=umXEmn3cMWY",
          videoId: "umXEmn3cMWY",
          durationLabel: "13:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-control-plane-q1",
          prompt: "Which control-plane component reads and writes etcd directly?",
          options: [
            "Only the API server; everything else goes through it",
            "The API server and the scheduler, so scheduling decisions are fast",
            "Every control-plane component, each with its own etcd client",
            "The controller manager, which then serves the API server",
          ],
          correctIndex: 0,
          explanation:
            "etcd is reached exclusively through kube-apiserver, which is what makes authentication, authorization, admission and validation unavoidable. The scheduler and controller manager are ordinary API clients that watch and patch objects.",
        },
        {
          id: "k8s-control-plane-q2",
          prompt:
            "A Deployment declares `replicas: 3`. You run `kubectl scale replicaset web-7d9f --replicas=5` on the ReplicaSet the Deployment owns. What do you see a few seconds later?",
          options: [
            "3 Pods: the Deployment controller reconciles its ReplicaSet back to the replica count in the Deployment's spec",
            "5 Pods: the ReplicaSet is the object that owns the Pods, so its spec wins",
            "5 Pods, and the Deployment's `replicas` field is updated to 5 to match",
            "An error: ReplicaSets owned by a Deployment reject scale requests",
          ],
          correctIndex: 0,
          explanation:
            "The edit is accepted — it just does not survive, because the Deployment controller keeps reconciling the ReplicaSet towards the Deployment's spec. Scale the Deployment, or an HPA that targets it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-control-plane-q3",
          prompt: "Which statements about the reconciliation loop are true? (Select all that apply.)",
          options: [
            "It is level-triggered: controllers re-derive desired versus actual state rather than relying on each event being delivered once",
            "A controller that misses a watch event recovers on its next resync",
            "Controllers act on the API server's objects, not on each other directly",
            "Each reconcile runs inside a transaction that rolls back on failure",
            "A controller must process events strictly in the order they occurred or the cluster becomes inconsistent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Level-triggered reconciliation is why Kubernetes tolerates dropped events, restarts and partial failures. There is no cross-object transaction: each controller makes small, independently retried changes through the API.",
        },
        {
          id: "k8s-control-plane-q4",
          prompt: "In what order does the API server process an incoming `POST /apis/apps/v1/namespaces/prod/deployments`?",
          options: [
            "Authentication, authorization, mutating admission, validating admission and schema validation, persist to etcd",
            "Schema validation, authentication, authorization, persist to etcd, admission",
            "Authorization, authentication, persist to etcd, mutating admission, validating admission",
            "Authentication, schema validation, persist to etcd, then admission asynchronously",
          ],
          correctIndex: 0,
          explanation:
            "Identity first, then permission, then mutation (defaulting, sidecar injection), then the final yes/no checks, and only then storage. Admission never runs after the write, which is why a webhook can block a create outright.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-control-plane-q5",
          prompt:
            "A validating admission webhook is registered with `failurePolicy: Fail` and a broad rule. Its backing Deployment is scaled to zero. What is the effect?",
          options: [
            "Every API write matching the webhook's rules is rejected, because an unreachable webhook with `failurePolicy: Fail` counts as a denial",
            "Writes are allowed through, because Kubernetes skips webhooks it cannot reach",
            "Only writes in the webhook's own namespace are affected",
            "Reads fail as well, since admission runs on every request",
          ],
          correctIndex: 0,
          explanation:
            "This is a classic self-inflicted outage, and it can lock you out of fixing it if the rule also matches the webhook's own workload. `failurePolicy: Ignore`, tight `rules`, and a `namespaceSelector` that exempts `kube-system` are the usual guards. Admission only runs on writes, so reads keep working.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-control-plane-q6",
          prompt: "A namespace has been `Terminating` for two hours and nothing is left in it that `kubectl get all` can see. What is the most likely cause?",
          options: [
            "Some object in it still carries a finalizer whose controller is gone or failing, so the delete cannot complete",
            "etcd compaction has not run yet, so the namespace object is still cached",
            "`kubectl delete namespace` only marks the namespace and needs a second confirmation",
            "The namespace has an active RoleBinding, which blocks deletion until it is removed",
          ],
          correctIndex: 0,
          explanation:
            "Finalizers make deletion a two-phase, controller-driven process. `kubectl get namespace <ns> -o json` shows the remaining finalizers, and `kubectl api-resources --namespaced -o name` plus a sweep finds the object holding it — often a custom resource whose operator was uninstalled first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-control-plane-q7",
          prompt: "What does the scheduler actually do when it picks a node for a Pod?",
          options: [
            "It writes `spec.nodeName` on the Pod object; the kubelet on that node notices and starts the containers",
            "It connects to the chosen node's container runtime and starts the containers itself",
            "It tells the kubelet over gRPC which Pod to run next",
            "It creates a copy of the Pod object inside the node's local store",
          ],
          correctIndex: 0,
          explanation:
            "Scheduling is a single field write, which is why a Pod that already has `spec.nodeName` set bypasses the scheduler entirely. Everything downstream is the kubelet watching for Pods bound to its own node.",
        },
        {
          id: "k8s-control-plane-q8",
          prompt: "The entire control plane is down for ten minutes. What happens to a healthy three-replica Deployment already running on worker nodes?",
          options: [
            "The Pods keep running and keep serving; nothing is rescheduled, scaled or replaced until the control plane returns",
            "All Pods are terminated, because the kubelet stops when it loses the API server",
            "Pods keep running but stop receiving traffic, because Services need the API server on the data path",
            "The kubelet promotes itself and continues to reconcile the Deployment locally",
          ],
          correctIndex: 0,
          explanation:
            "The data plane is deliberately decoupled: kubelets keep their containers alive and kube-proxy's existing rules keep forwarding. What you lose is *change* — no scheduling, no self-healing, no rollouts, and no endpoint updates for Pods that die meanwhile.",
        },
        {
          id: "k8s-control-plane-q9",
          prompt:
            "`kubectl apply` returned success for an updated Deployment, but the new image is nowhere to be seen. Where do you look first for the reason?",
          options: [
            "The Deployment's `status.conditions` and its events, then the new ReplicaSet and its Pods",
            "The API server's audit log, since a successful apply means the rollout finished",
            "etcd's data directory, to confirm the object was persisted",
            "The kubelet's configuration on each node, since it owns image pulls",
          ],
          correctIndex: 0,
          explanation:
            "A successful apply only means the object was stored. The rollout is a separate, asynchronous controller job, and conditions such as `Progressing=False/ProgressDeadlineExceeded` or `ReplicaFailure=True` name the reason. Only after that does it make sense to descend to Pods and nodes.",
        },
        {
          id: "k8s-control-plane-q10",
          prompt: "What do `metadata.generation` and `status.observedGeneration` tell you about a Deployment?",
          options: [
            "`generation` counts spec changes; `observedGeneration` is the newest one the controller has acted on, so a lag means the controller has not caught up",
            "`generation` counts every write including status updates; `observedGeneration` counts successful rollouts",
            "`generation` is the ReplicaSet revision number and `observedGeneration` is the previous one",
            "Both are informational annotations set by `kubectl apply` for diff purposes",
          ],
          correctIndex: 0,
          explanation:
            "`generation` only increments on spec changes, so the pair is the honest way to ask \"has the controller even seen my edit yet?\" — distinct from \"did the rollout succeed?\", which the conditions answer.",
        },
        {
          id: "k8s-control-plane-q11",
          prompt: "How would you teach the cluster to manage a new kind of object, such as a `PostgresCluster`?",
          options: [
            "Register a CustomResourceDefinition for the kind and run a controller that reconciles it — the operator pattern",
            "Patch kube-apiserver to add the type, then restart the control plane",
            "Add the type to the kubelet's configuration on every node",
            "Store the manifests in a ConfigMap and have a CronJob apply them",
          ],
          correctIndex: 0,
          explanation:
            "A CRD gives you storage, validation, RBAC and watch semantics for free; the controller supplies the reconciliation. That is precisely why every operator looks structurally like the built-in controllers.",
        },
        {
          id: "k8s-control-plane-q12",
          prompt:
            "Two CI jobs `kubectl apply` the same Deployment a second apart, changing different fields. Which mechanism decides the outcome, and what does each job see?",
          options: [
            "Optimistic concurrency on `metadata.resourceVersion`: a stale update is rejected with a conflict, and the client re-reads and retries",
            "Last write wins silently, so one job's change is lost without any error",
            "The API server locks the object for the first writer until its request completes and blocks the second",
            "etcd merges the two requests field by field, so both changes always land",
          ],
          correctIndex: 0,
          explanation:
            "Every update carries the `resourceVersion` it was based on, and a mismatch returns 409 Conflict. Server-side apply goes further, tracking field ownership so two managers editing different fields do not fight; a client-side apply that drops a field another manager owns is where surprise deletions come from.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "k8s-pods",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Pods, and Why You Rarely Create One",
      summary:
        "A Pod is the unit Kubernetes schedules: one or more containers that share a network namespace (one IP, `localhost` between them), share IPC, and can share volumes, placed together on one node and living and dying together. The shape exists because some processes genuinely need to be co-located at the address level — a log shipper reading the same `emptyDir`, a proxy terminating mTLS on `127.0.0.1`, a config reloader watching the same file. Anything that only needs to *talk* to your app does not belong in the Pod; that is what Services are for.\n\nYou rarely write one yourself because a bare Pod is scheduled exactly once and then forgotten. Its node dies, it is evicted under memory pressure, someone drains the node for an upgrade — nothing recreates it, because no controller owns it. Deployments, StatefulSets, DaemonSets and Jobs exist to be that owner. The `kubectl run` habit from tutorials is fine for a debug shell and wrong for anything you expect to still be there tomorrow.\n\nThe lifecycle is where on-call knowledge lives. `phase` is a coarse summary (`Pending`, `Running`, `Succeeded`, `Failed`, `Unknown`) and hides everything useful; the per-container statuses and the Pod conditions carry the truth. Init containers run to completion, in order, before app containers start — one that keeps failing pins the Pod in `Init:CrashLoopBackOff` and no app container ever starts. A container in `initContainers` with `restartPolicy: Always` is a *sidecar*: stable since Kubernetes 1.33, it starts before the app containers, keeps running alongside them, and is shut down only after they stop, which finally fixed sidecars stopping too early and Jobs that never completed because the proxy kept running. On termination the kubelet fires `preStop`, sends SIGTERM, waits `terminationGracePeriodSeconds` (30 by default) and then SIGKILLs. Endpoint removal and SIGTERM are concurrent, not ordered, so a Pod that exits instantly on SIGTERM drops in-flight requests; a short `preStop` sleep is the usual fix.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kubernetes: Pods", url: "https://kubernetes.io/docs/concepts/workloads/pods/", kind: "docs" },
        { label: "Kubernetes: Pod Lifecycle", url: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/", kind: "docs" },
        { label: "Kubernetes: Sidecar Containers", url: "https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/", kind: "docs" },
        { label: "Kubernetes: Init Containers", url: "https://kubernetes.io/docs/concepts/workloads/pods/init-containers/", kind: "docs" },
      ],
      video: {
        title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
        videoId: "_4uQI4ihGVU",
        durationLabel: "5:53:25",
        startSeconds: 9146,
        chapterLabel: "Pods",
      },
      alternateVideos: [
        {
          title: "Day 11/40 - Multi Container Pod Kubernetes - Sidecar vs Init Container",
          channel: "Tech Tutorials with Piyush",
          url: "https://www.youtube.com/watch?v=yRiFq1ykBxc",
          videoId: "yRiFq1ykBxc",
          durationLabel: "25:13",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-pods-q1",
          prompt: "Two containers in one Pod both try to listen on port 8080. What happens?",
          options: [
            "The second one fails to bind, because containers in a Pod share one network namespace and therefore one port space",
            "Both bind successfully; Kubernetes maps them to different host ports automatically",
            "Both bind successfully, and the Service decides which one receives traffic",
            "The Pod is rejected at admission time with a port conflict error",
          ],
          correctIndex: 0,
          explanation:
            "One Pod means one IP and one set of ports. Nothing validates this at admission, so you find out from a crash loop and an `address already in use` in the logs.",
        },
        {
          id: "k8s-pods-q2",
          prompt: "Which workloads genuinely belong in the same Pod as the application container? (Select all that apply.)",
          options: [
            "A log-shipping agent reading the app's log directory from a shared `emptyDir`",
            "A service-mesh proxy the app reaches on `127.0.0.1`",
            "A config watcher that rewrites a file the app reloads from the shared volume",
            "A Redis cache the app connects to over the network",
            "A second copy of the app to double throughput",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Co-location is justified by shared filesystem, shared loopback or a shared lifecycle. A cache is a separate concern with its own scaling profile, and extra capacity is what `replicas` is for — packing a second copy in makes the two share limits and scale in lockstep.",
        },
        {
          id: "k8s-pods-q3",
          prompt:
            "A Pod's only init container exits with status 1 on every attempt. What does `kubectl get pod` show, and are the app containers running?",
          options: [
            "`Init:CrashLoopBackOff`, and no app container has started — init containers must all succeed first",
            "`Running`, because the app containers start in parallel with init containers",
            "`Pending`, because the scheduler retries placement after an init failure",
            "`Error`, and the app containers start anyway with a warning event",
          ],
          correctIndex: 0,
          explanation:
            "Init containers run to completion, one at a time, before any app container starts. The usual cause is a dependency check (\"wait for the database\") that never passes, so the fix is upstream of the Pod, not in it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-pods-q4",
          prompt:
            "What distinguishes a native sidecar from a plain second container in `spec.containers`? (Select all that apply.)",
          options: [
            "It is declared in `initContainers` with `restartPolicy: Always`",
            "It is started, and reaches readiness, before the app containers start",
            "It is terminated only after the app containers have stopped",
            "It does not stop a Job from completing when the main container finishes",
            "It gets its own IP address separate from the Pod's",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Native sidecars (stable since Kubernetes 1.33) fixed the ordering problems of the old pattern: proxies ready before the app needs them, shut down last, and no longer keeping Jobs alive forever. They still share the Pod's single IP like any other container.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-pods-q5",
          prompt:
            "During a rolling update, a small fraction of requests fail with connection resets. The app exits immediately on SIGTERM and takes about 40 ms to do so. What is happening?",
          options: [
            "Endpoint removal and SIGTERM happen concurrently, so the app dies before every proxy has stopped sending it traffic",
            "The Service load balances to terminating Pods on purpose until the grace period ends",
            "`terminationGracePeriodSeconds` is too long, so the Pod lingers and collects requests",
            "The readiness probe failed, which resets open connections",
          ],
          correctIndex: 0,
          explanation:
            "Removing the Pod from EndpointSlices and signalling the container are parallel, and every kube-proxy/ingress/mesh dataplane needs a moment to notice. A `preStop` hook that sleeps a few seconds, plus an app that drains rather than exits on SIGTERM, closes the window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-pods-q6",
          prompt: "A container ignores SIGTERM entirely. With default settings, how long until it is forcibly killed, and with what signal?",
          options: [
            "About 30 seconds, then SIGKILL — `terminationGracePeriodSeconds` defaults to 30",
            "Immediately with SIGKILL, since ignoring SIGTERM is treated as a failure",
            "About 10 seconds, then SIGQUIT",
            "Never; the Pod stays `Terminating` until an operator deletes it with `--force`",
          ],
          correctIndex: 0,
          explanation:
            "The kubelet runs `preStop`, sends SIGTERM, waits out the grace period and then sends SIGKILL. A worker that needs longer to finish in-flight jobs needs a longer grace period *and* a signal handler — raising one without the other changes nothing.",
        },
        {
          id: "k8s-pods-q7",
          prompt: "Why is a bare Pod a bad way to run a long-lived service?",
          options: [
            "Nothing owns it, so nothing recreates it after a node failure, eviction or drain",
            "Bare Pods cannot be selected by a Service",
            "Bare Pods are denied by default admission policy in recent versions",
            "Bare Pods cannot mount volumes or read ConfigMaps",
          ],
          correctIndex: 0,
          explanation:
            "Self-healing comes entirely from a controller comparing desired and actual state. A bare Pod is scheduled once; when the node goes away, so does the Pod, permanently.",
        },
        {
          id: "k8s-pods-q8",
          prompt: "What does a Pod `phase` of `Running` guarantee?",
          options: [
            "The Pod is bound to a node and at least one container is running — it says nothing about readiness or whether containers are crash-looping",
            "Every container has passed its readiness probe and is receiving traffic",
            "Every container in the Pod is up and has not restarted",
            "The Pod has completed its init containers and all probes are configured",
          ],
          correctIndex: 0,
          explanation:
            "`phase` is deliberately coarse. A Pod restarting a container every 40 seconds is still `Running`; the `Ready` condition, `READY n/m` and the restart count are what you actually read.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-pods-q9",
          prompt: "Two containers in one Pod need to exchange a large temporary file. What is the idiomatic mechanism?",
          options: [
            "An `emptyDir` volume mounted into both containers, which lives and dies with the Pod",
            "A PersistentVolumeClaim, since containers cannot otherwise share files",
            "A ConfigMap written by the first container and read by the second",
            "The container runtime's image layer, shared because both come from the same image",
          ],
          correctIndex: 0,
          explanation:
            "`emptyDir` is created empty when the Pod is assigned to a node and deleted with the Pod — exactly the scratch-space semantics wanted here. ConfigMaps are API objects with a size limit, not a filesystem, and a PVC is overkill for data that must not outlive the Pod.",
        },
        {
          id: "k8s-pods-q10",
          prompt:
            "A Pod's app container terminates with `Reason: Error`, `Exit Code: 1`, and the Pod's `restartPolicy` is the default. What does the kubelet do?",
          options: [
            "Restarts the container in place with exponential back-off, keeping the same Pod, IP and node",
            "Deletes the Pod and lets its controller schedule a replacement elsewhere",
            "Leaves the Pod in `Failed` until a controller notices",
            "Restarts it immediately and indefinitely with no back-off",
          ],
          correctIndex: 0,
          explanation:
            "`restartPolicy: Always` restarts containers *within* the existing Pod; the Pod object, its IP and its node do not change. The back-off caps at five minutes, which is what `CrashLoopBackOff` is reporting.",
        },
      ],
    },
    {
      id: "k8s-deployments-rollouts",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Deployments, ReplicaSets & Rollout Strategy",
      summary:
        "A Deployment is a controller over ReplicaSets, and a ReplicaSet is a controller over Pods. That two-level split exists so a rollout can be expressed as data rather than as a script: change `spec.template`, and the Deployment controller creates a new ReplicaSet, scales it up and the old one down in step, and keeps both around so `kubectl rollout undo` is just \"scale the previous ReplicaSet back up\". Scaling, by contrast, does not create a revision — only template changes do.\n\nThe pace is set by two numbers, both 25% by default. `maxSurge` rounds *up* and is how many Pods above `replicas` may exist; `maxUnavailable` rounds *down* and is how many below `replicas` may be unavailable. The asymmetry errs towards keeping capacity. Set `maxUnavailable: 0` when you can afford the extra capacity and cannot afford to lose any. `strategy: Recreate` kills everything before starting the new version, which you want exactly when two versions must never run at once — a schema migration that is not backward compatible, or a single-writer process.\n\nThe thing that catches people is that \"available\" means *ready*, not *started*. Every gate in a rollout runs through the readiness probe, so a new version whose readiness never passes does not fail loudly: the rollout simply stalls at `maxUnavailable`, old Pods keep serving, and after `progressDeadlineSeconds` (600 by default) the Deployment sets `Progressing=False` with reason `ProgressDeadlineExceeded` — and then does nothing. Kubernetes never rolls back on its own; your CD pipeline has to watch for that condition. Two more sharp edges: `spec.selector` is immutable in `apps/v1`, so changing labels means deleting and recreating the Deployment, and a rollout only starts if the Pod template actually changed, which is why editing a ConfigMap alone rolls nothing and `kubectl rollout restart` (which stamps an annotation on the template) is the tool for that.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kubernetes: Deployments", url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/", kind: "docs" },
        { label: "Kubernetes: ReplicaSet", url: "https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/", kind: "docs" },
        { label: "Kubernetes: Disruptions and PodDisruptionBudgets", url: "https://kubernetes.io/docs/concepts/workloads/pods/disruptions/", kind: "docs" },
      ],
      video: {
        title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
        videoId: "_4uQI4ihGVU",
        durationLabel: "5:53:25",
        startSeconds: 12939,
        chapterLabel: "Deployments",
      },
      alternateVideos: [
        {
          title: "ReplicaSets and Deployments | Self Healing, High Availability, Rollout, and Rollback in Kubernetes",
          channel: "Pavan Elthepu",
          url: "https://www.youtube.com/watch?v=mEnCFazQ8BM",
          videoId: "mEnCFazQ8BM",
          durationLabel: "22:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-deployments-rollouts-q1",
          prompt:
            "A Deployment has `replicas: 4`, `maxSurge: 25%` and `maxUnavailable: 25%`. During a rollout, what is the maximum number of Pods and the minimum available?",
          options: ["5 total, at least 3 available", "5 total, at least 2 available", "4 total, at least 3 available", "6 total, at least 3 available"],
          correctIndex: 0,
          explanation:
            "25% of 4 is 1 exactly, so both round to 1: up to 4 + 1 = 5 Pods, and never fewer than 4 − 1 = 3 available. With non-integer results `maxSurge` rounds up and `maxUnavailable` rounds down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-deployments-rollouts-q2",
          prompt:
            "You roll out v2. Its containers start fine but the readiness probe never passes. Fifteen minutes later, what is the state of the Deployment?",
          options: [
            "Stalled: enough v1 Pods still serve, `Progressing` is `False` with reason `ProgressDeadlineExceeded`, and nothing has rolled back",
            "Automatically rolled back to v1 once the progress deadline elapsed",
            "Fully rolled out to v2, since readiness only affects Service traffic and not the rollout",
            "All Pods deleted, because the controller gives up and scales both ReplicaSets to zero",
          ],
          correctIndex: 0,
          explanation:
            "The controller cannot remove more old Pods while new ones are unavailable, so the rollout freezes at `maxUnavailable`. Kubernetes only reports the condition — rolling back is your CD pipeline's job, via `kubectl rollout undo`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-deployments-rollouts-q3",
          prompt: "Which changes to a Deployment create a new revision and trigger a rollout? (Select all that apply.)",
          options: [
            "Changing the container image tag",
            "Adding an environment variable to the Pod template",
            "Running `kubectl rollout restart`, which stamps an annotation on the Pod template",
            "Changing `replicas` from 3 to 6",
            "Editing a ConfigMap that the Pods consume via `envFrom`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only a change to `spec.template` makes a revision. Scaling deliberately does not, so autoscaling never pollutes rollout history; and a ConfigMap edit is invisible to the Deployment, which is why `rollout restart` (or a template annotation containing the config's hash) exists.",
        },
        {
          id: "k8s-deployments-rollouts-q4",
          prompt: "When is `strategy: Recreate` the right choice over `RollingUpdate`?",
          options: [
            "When two versions must never run simultaneously — a non-backward-compatible schema migration, or a single-writer process",
            "Whenever you want the rollout to finish faster",
            "When the Deployment has only one replica",
            "When the application is stateless and can tolerate restarts",
          ],
          correctIndex: 0,
          explanation:
            "`Recreate` buys mutual exclusion at the cost of downtime. Speed and replica count are not reasons: a single-replica RollingUpdate with `maxSurge: 1` can still avoid a gap, while `Recreate` guarantees one.",
        },
        {
          id: "k8s-deployments-rollouts-q5",
          prompt: "You change a Deployment's `spec.selector.matchLabels` and apply. What happens?",
          options: [
            "The API server rejects it: `spec.selector` is immutable in `apps/v1`, so you must delete and recreate the Deployment",
            "It is accepted and the Deployment adopts whichever Pods now match",
            "It is accepted, and the old ReplicaSet's Pods are orphaned and deleted",
            "It is accepted but silently ignored until the next rollout",
          ],
          correctIndex: 0,
          explanation:
            "Mutable selectors would let a Deployment orphan or steal Pods, so `apps/v1` froze the field. Planning a label change means planning a replacement Deployment, which is a migration with traffic implications — not an edit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-deployments-rollouts-q6",
          prompt: "How does a ReplicaSet tell its own Pods apart from those of the previous ReplicaSet, given both match the Deployment's selector?",
          options: [
            "The Deployment adds a `pod-template-hash` label, derived from the template, to each ReplicaSet and its Pods",
            "By creation timestamp, newest first",
            "By the `revision` annotation the controller writes on each Pod",
            "Pods record their owning ReplicaSet's UID in `spec.replicaSetName`",
          ],
          correctIndex: 0,
          explanation:
            "`pod-template-hash` is added to the ReplicaSet's selector and to its Pods, which is what makes overlapping selectors safe. Never add that label to a selector by hand.",
        },
        {
          id: "k8s-deployments-rollouts-q7",
          prompt:
            "You run `kubectl rollout undo deployment/api`. Mechanically, what does the controller do?",
          options: [
            "Scales the previous ReplicaSet back up and the current one down, following the same rolling-update rules",
            "Re-pulls the previous image tag into the existing Pods without recreating them",
            "Restores the previous manifest from etcd's history and re-applies it",
            "Deletes the current ReplicaSet and lets the scheduler pick up the old Pods again",
          ],
          correctIndex: 0,
          explanation:
            "Old ReplicaSets are kept (up to `revisionHistoryLimit`) scaled to zero exactly so rollback is a scale operation. Setting `revisionHistoryLimit: 0` therefore disables rollback entirely.",
        },
        {
          id: "k8s-deployments-rollouts-q8",
          prompt:
            "A node is drained for maintenance. A three-replica Deployment has a PodDisruptionBudget with `minAvailable: 3`. What happens?",
          options: [
            "The drain blocks on evicting that Deployment's Pod, because evicting it would drop below the budget",
            "The drain proceeds; PDBs only apply to involuntary disruptions such as node failure",
            "Kubernetes scales the Deployment to 4 so the budget is satisfied, then drains",
            "The PDB is ignored, since `kubectl drain` uses the delete API",
          ],
          correctIndex: 0,
          explanation:
            "`kubectl drain` uses the eviction API, which honours PDBs. A budget equal to the replica count means no voluntary disruption is ever allowed — it blocks upgrades forever rather than protecting anything. Use `minAvailable: 2` or `maxUnavailable: 1`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-deployments-rollouts-q9",
          prompt: "What does `minReadySeconds: 20` change about a rolling update?",
          options: [
            "A new Pod counts as available only after it has been ready for 20 continuous seconds, slowing the rollout and catching crashes that appear shortly after startup",
            "It delays the readiness probe's first check by 20 seconds",
            "It waits 20 seconds between deleting old Pods, independently of readiness",
            "It gives each Pod 20 seconds to terminate before SIGKILL",
          ],
          correctIndex: 0,
          explanation:
            "It is a soak window: a process that passes readiness and then dies at second 5 never accumulates availability, so the rollout stops instead of replacing every replica with a broken one. `initialDelaySeconds` and `terminationGracePeriodSeconds` are different knobs.",
        },
        {
          id: "k8s-deployments-rollouts-q10",
          prompt:
            "A 10-replica Deployment is mid-rollout (4 new Pods ready) when you push a third version. What does the controller do with the in-flight ReplicaSet?",
          options: [
            "It creates a third ReplicaSet and scales the second one down immediately, without waiting for it to finish",
            "It queues the new revision and applies it once the current rollout completes",
            "It rejects the update while `Progressing` is `True`",
            "It merges the two templates into the existing ReplicaSet",
          ],
          correctIndex: 0,
          explanation:
            "Rollovers are not queued: the controller always drives towards the newest template, which is what makes \"push a fix on top of a bad rollout\" work. It does mean three ReplicaSets can briefly be non-zero, still bounded by surge and unavailability.",
        },
        {
          id: "k8s-deployments-rollouts-q11",
          prompt: "Which is the most reliable way to make a Deployment pick up a changed ConfigMap consumed through `envFrom`?",
          options: [
            "Put a hash of the ConfigMap's contents in a Pod-template annotation, so any change becomes a template change and rolls automatically",
            "Wait for the kubelet's sync period; environment variables refresh within about a minute",
            "Mark the ConfigMap immutable, which forces subscribers to restart",
            "Delete and recreate the ConfigMap, which notifies consuming Pods",
          ],
          correctIndex: 0,
          explanation:
            "Environment variables are fixed at container start and never refresh. The config-hash annotation is what Helm charts do; `kubectl rollout restart` is the manual equivalent. Mounted ConfigMap *files* do update eventually, but the app still has to reread them.",
        },
      ],
    },
    {
      id: "k8s-services",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Services and the Four Types",
      summary:
        "A Service is a stable name in front of a moving set of Pods. The Pods behind it are replaced constantly and get new IPs every time; the Service's ClusterIP and DNS name do not change. What matters for debugging is that a Service is not a process. Nothing listens on a ClusterIP: the address is virtual, and kube-proxy (or an eBPF dataplane such as Cilium) programs the node's iptables, IPVS or nftables rules to rewrite packets addressed to it towards one of the ready Pod IPs. You cannot SSH to a node and `tcpdump` the ClusterIP, and a Service with no endpoints fails with connection refused rather than a timeout.\n\nThe four types are layers, not alternatives. `ClusterIP` is the default and internal only. `NodePort` builds on it by opening the same port (30000–32767 by default) on every node. `LoadBalancer` builds on NodePort by asking the environment for an external load balancer — which is why it does nothing on a bare-metal cluster without MetalLB or similar. `ExternalName` is the odd one out: it is a DNS CNAME with no proxying, no selector and no endpoints at all. Alongside them, setting `clusterIP: None` makes a *headless* Service, whose DNS name resolves to the Pod IPs directly — how StatefulSets get per-Pod addresses, and how gRPC and database clients do their own load balancing.\n\nMembership is by label selector only, resolved into EndpointSlices, which replaced the single Endpoints object so that a 5,000-Pod Service does not rewrite one giant object on every change. Only *ready* Pods are included, so readiness is the switch that puts a Pod in or out of rotation.\n\nTwo things reliably surprise people. Load balancing is per *connection*, not per request, so anything that holds a long-lived HTTP/2 or gRPC connection pins itself to one Pod and stays there through your next scale-up — headless Services with client-side balancing, or a mesh, is the fix. And `externalTrafficPolicy: Local` preserves the real client IP by refusing to hop between nodes, which also means a node with no local Pod blackholes traffic unless the external load balancer's health checks take it out of rotation.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kubernetes: Service", url: "https://kubernetes.io/docs/concepts/services-networking/service/", kind: "docs" },
        { label: "Kubernetes: EndpointSlices", url: "https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/", kind: "docs" },
        { label: "Kubernetes: Virtual IPs and Service Proxies", url: "https://kubernetes.io/docs/reference/networking/virtual-ips/", kind: "docs" },
        { label: "Kubernetes: DNS for Services and Pods", url: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/", kind: "docs" },
      ],
      video: {
        title: "Kubernetes Services explained | ClusterIP vs NodePort vs LoadBalancer vs Headless Service",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=T4Z7visMM4E",
        videoId: "T4Z7visMM4E",
        durationLabel: "24:13",
      },
      alternateVideos: [
        {
          title: "Kubernetes Networking: NodePort, LoadBalancer, Ingress, or Gateway API?",
          channel: "SystemBlueprint",
          url: "https://www.youtube.com/watch?v=sjaOsHoF6KY",
          videoId: "sjaOsHoF6KY",
          durationLabel: "13:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-services-q1",
          prompt: "You ping a Service's ClusterIP from a node and get nothing, yet the Service works from inside Pods. Why?",
          options: [
            "A ClusterIP is a virtual address with no interface behind it; kube-proxy's rules rewrite matching packets, and they only match traffic that passes through them",
            "The Service is down and the Pods are reaching a cached endpoint",
            "ICMP is blocked by a default NetworkPolicy in every cluster",
            "ClusterIPs only answer requests coming from the same node as a backing Pod",
          ],
          correctIndex: 0,
          explanation:
            "Nothing binds the ClusterIP. It exists only as a match rule in iptables/IPVS/nftables (or an eBPF map), so `ping` and `tcpdump` on that address are misleading tools. Check EndpointSlices and connect to the port instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-services-q2",
          prompt:
            "A gRPC client holds one long-lived connection to a `ClusterIP` Service. You scale the backend from 3 to 12 Pods. What happens to the client's traffic?",
          options: [
            "It keeps going to the single Pod it is already connected to; the new Pods receive nothing from that client",
            "It is redistributed across all 12 Pods within a few seconds",
            "New requests are balanced across all Pods, since balancing is per request",
            "The connection is reset so the client can rebalance",
          ],
          correctIndex: 0,
          explanation:
            "kube-proxy balances at connection setup. Multiplexed HTTP/2 and gRPC set up one connection and reuse it, so they pin. Use a headless Service with client-side round-robin, a proxy that speaks HTTP/2, or a service mesh.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-services-q3",
          prompt: "Which statements about a headless Service (`clusterIP: None`) are true? (Select all that apply.)",
          options: [
            "Its DNS name resolves to the individual Pod IPs rather than to one virtual IP",
            "kube-proxy programs no forwarding rules for it",
            "It is how a StatefulSet gives each Pod a stable DNS name",
            "It still load balances connections across its Pods in round-robin",
            "It requires `type: LoadBalancer` to be reachable at all",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Headless means \"give me the addresses and get out of the way\": DNS returns the endpoints and the client decides. There is no virtual IP to balance across, which is the whole point for databases and gRPC clients.",
        },
        {
          id: "k8s-services-q4",
          prompt:
            "A Service is defined with `port: 80` and `targetPort: 8080`, but the container actually listens on 3000. What do callers see?",
          options: [
            "Connection refused: the Service forwards to port 8080 on the Pod IP, where nothing is listening",
            "It works, because `containerPort` in the Pod spec is what actually opens the port",
            "The Service has no endpoints, because `targetPort` must match a declared `containerPort`",
            "Requests hang until they time out, because the packet is dropped",
          ],
          correctIndex: 0,
          explanation:
            "`targetPort` is where traffic is sent on the Pod; `containerPort` is documentation and does not open or restrict anything. The endpoints exist and look healthy, which is why this one is so often misdiagnosed as a DNS problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-services-q5",
          prompt: "Why did EndpointSlices replace the single Endpoints object?",
          options: [
            "One object listing every endpoint had to be rewritten and re-sent to every watcher on each Pod change, which does not scale to thousands of endpoints",
            "Endpoints could not store Pod readiness",
            "EndpointSlices are required for DNS resolution to work",
            "Endpoints were namespaced and EndpointSlices are cluster-scoped",
          ],
          correctIndex: 0,
          explanation:
            "Sharding endpoints into slices of about 100 turns a large-Service rollout from an O(endpoints) broadcast per change into a small one. They also carry topology and per-address-family data the old API could not.",
        },
        {
          id: "k8s-services-q6",
          prompt: "What does `type: ExternalName` do?",
          options: [
            "It makes the cluster's DNS return a CNAME to an external hostname; no proxying, no endpoints and no selector are involved",
            "It creates a ClusterIP that forwards to a fixed external IP address",
            "It publishes an internal Service under an external DNS name",
            "It resolves an external name once at creation and pins the resulting IP",
          ],
          correctIndex: 0,
          explanation:
            "It is purely a DNS alias, useful for pointing `payments.prod.svc.cluster.local` at a managed database while you migrate. Because nothing proxies, TLS certificate names and client-side host headers follow the *external* name.",
        },
        {
          id: "k8s-services-q7",
          prompt:
            "You set `externalTrafficPolicy: Local` on a `LoadBalancer` Service to see real client IPs. What is the trade-off?",
          options: [
            "Traffic is only served by nodes that host a backing Pod, so a node without one drops it, and balancing becomes uneven across nodes",
            "Client IPs are preserved but TLS termination stops working",
            "The Service can only be reached from inside the cluster",
            "Each node must run kube-proxy in IPVS mode",
          ],
          correctIndex: 0,
          explanation:
            "The default `Cluster` policy SNATs and may hop to another node, which hides the client IP but spreads load evenly. `Local` removes the second hop, so correctness now depends on the load balancer's health checks pulling Pod-less nodes out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-services-q8",
          prompt: "A Pod in namespace `prod` resolves `payments`. Which name does the cluster DNS ultimately answer for?",
          options: [
            "`payments.prod.svc.cluster.local`, via the Pod's DNS search list",
            "`payments.default.svc.cluster.local`, since short names always resolve in `default`",
            "`payments.cluster.local`, because the namespace is only used for RBAC",
            "Nothing: cross-component calls require the fully qualified name",
          ],
          correctIndex: 0,
          explanation:
            "`/etc/resolv.conf` in a Pod lists `<ns>.svc.cluster.local`, `svc.cluster.local` and `cluster.local` as search domains, so the local namespace wins first. The same file's `ndots:5` is why an external name like `api.stripe.com` costs several failed lookups before the real one.",
        },
        {
          id: "k8s-services-q9",
          prompt: "A Service's Pods are running but none pass their readiness probe. What do callers of the Service get?",
          options: [
            "Connection refused, because unready Pods are excluded from EndpointSlices and the Service has no endpoints",
            "Requests are still forwarded, since readiness only affects rollouts",
            "Requests queue at kube-proxy until a Pod becomes ready",
            "The Service falls back to any Pod matching the selector, ready or not",
          ],
          correctIndex: 0,
          explanation:
            "Readiness is exactly the in-or-out switch for Service membership. `kubectl get endpointslices -l kubernetes.io/service-name=<svc>` returning nothing is the fastest confirmation.",
        },
        {
          id: "k8s-services-q10",
          prompt: "Which are true about `NodePort` Services? (Select all that apply.)",
          options: [
            "The port is opened on every node, not only those running a backing Pod",
            "The default allocation range is 30000–32767",
            "A `LoadBalancer` Service also allocates a node port by default",
            "The node port number is the port your container listens on",
            "NodePort traffic bypasses the ClusterIP entirely",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "NodePort is a layer on top of ClusterIP, and LoadBalancer is a layer on top of NodePort — which is why cloud load balancers target node ports. The container's own port is `targetPort`, unrelated to the node port.",
        },
        {
          id: "k8s-services-q11",
          prompt:
            "A StatefulSet's Pods must reach each other individually to form a quorum, before any of them is ready. Which Service configuration supports that?",
          options: [
            "A headless Service with `publishNotReadyAddresses: true`, so each Pod gets a DNS name even while it is unready",
            "A ClusterIP Service, because the virtual IP is available before the Pods are",
            "A NodePort Service, so peers can use node addresses that do not depend on readiness",
            "No Service is needed; Pod DNS names exist independently of any Service",
          ],
          correctIndex: 0,
          explanation:
            "Per-Pod DNS records (`pod-0.svc.ns.svc.cluster.local`) come from the governing headless Service, and readiness would otherwise hide peers during exactly the bootstrap window that needs them. This is the standard pattern for etcd, Kafka and Cassandra charts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "k8s-ingress-gateway",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Ingress and the Gateway API",
      summary:
        "Services stop at layer 4. Ingress was the first attempt at HTTP routing as an API object: host and path rules that an *Ingress controller* — nginx, HAProxy, Traefik, a cloud load balancer — watches and turns into real proxy configuration. The API object on its own does nothing. On a cluster with no controller installed, `kubectl apply -f ingress.yaml` succeeds and nothing ever routes.\n\nIngress's problem is that the spec only ever covered host, path and TLS. Everything real — rewrites, timeouts, canary weights, rate limits, mTLS, authentication — moved into controller-specific annotations, which are unvalidated strings with no portability between controllers, and there is no way to let an application team own its routes while a platform team owns the load balancer. The Kubernetes project's answer was to declare the Ingress API **frozen**: it stays generally available and supported, but no new features land in it.\n\nThe successor is the **Gateway API** (`gateway.networking.k8s.io/v1`), and it is the right choice for new work; Ingress is still what most existing clusters run, so you will read and maintain both for years. It splits one object into three roles: a `GatewayClass` names an implementation (like a StorageClass), a `Gateway` is the actual listener the cluster operator provisions, and an `HTTPRoute` — owned by the application team, often in its own namespace — attaches to that Gateway. Header matching, traffic splitting by weight, redirects, rewrites and timeouts are typed fields, not annotations, and `GRPCRoute`, `TCPRoute` and `TLSRoute` cover what Ingress never could.\n\nTwo practical notes. Gateway API CRDs are not shipped with Kubernetes: you install them (1.6 is current) plus an implementation, which is why `kubectl get gateways` returns \"no matches for kind\" on a fresh cluster. And cross-namespace attachment is deny-by-default in both directions — the Gateway's `allowedRoutes` must permit the route's namespace, and a route pointing at a backend Service in another namespace needs a `ReferenceGrant` in the *target* namespace.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Kubernetes: Ingress", url: "https://kubernetes.io/docs/concepts/services-networking/ingress/", kind: "docs" },
        { label: "Kubernetes: Gateway API", url: "https://kubernetes.io/docs/concepts/services-networking/gateway/", kind: "docs" },
        { label: "Gateway API: Introduction", url: "https://gateway-api.sigs.k8s.io/docs/introduction/", kind: "docs" },
        { label: "Gateway API: Migrating from Ingress", url: "https://gateway-api.sigs.k8s.io/guides/getting-started/migrating-from-ingress/", kind: "article" },
      ],
      video: {
        title: "Gateway API Explained: The Future of Kubernetes Networking",
        channel: "KodeKloud",
        url: "https://www.youtube.com/watch?v=xaZ87iSvMAI",
        videoId: "xaZ87iSvMAI",
        durationLabel: "45:13",
      },
      alternateVideos: [
        {
          title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
          videoId: "_4uQI4ihGVU",
          durationLabel: "5:53:25",
          startSeconds: 20091,
          chapterLabel: "Gateway API",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-ingress-gateway-q1",
          prompt: "You apply a valid Ingress on a cluster with no Ingress controller installed. What happens?",
          options: [
            "The object is stored and nothing routes; it never gets an address, because Ingress is a declaration that a controller must act on",
            "The API server rejects it, since an IngressClass must exist first",
            "kube-proxy programs the rules itself, so basic host routing works",
            "The cluster provisions a cloud load balancer automatically",
          ],
          correctIndex: 0,
          explanation:
            "Ingress, Gateway, NetworkPolicy and PersistentVolumeClaims all share this shape: the API accepts the object, and an out-of-tree implementation decides whether anything happens. An empty `status.loadBalancer` is the tell.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-ingress-gateway-q2",
          prompt: "What does it mean that the Ingress API is frozen?",
          options: [
            "It stays generally available and supported, but no new features are added; new capability lands in the Gateway API instead",
            "It is deprecated and will be removed in the next minor release",
            "Existing Ingress objects are read-only and cannot be updated",
            "Only cloud providers may add features to it, through annotations",
          ],
          correctIndex: 0,
          explanation:
            "Frozen is a commitment not to grow the API, not a removal notice — which is why running Ingress in production is still perfectly reasonable. The practical consequence is that any new requirement is met by an annotation or by moving to Gateway API.",
        },
        {
          id: "k8s-ingress-gateway-q3",
          prompt: "Which problems with Ingress motivated the Gateway API? (Select all that apply.)",
          options: [
            "Everything beyond host, path and TLS had to be expressed as controller-specific annotations",
            "There was no way to split ownership between a platform team owning the listener and app teams owning routes",
            "Header-based matching and weighted traffic splitting were not part of the spec",
            "Ingress could not do TLS termination at all",
            "Ingress objects could not be namespaced",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Annotations, the single-object ownership model and the thin feature set are the three real complaints. Ingress does terminate TLS (via `spec.tls` and a Secret) and is namespaced.",
        },
        {
          id: "k8s-ingress-gateway-q4",
          prompt: "On a freshly installed Kubernetes 1.37 cluster, `kubectl get gateways` reports that the server has no resource type \"gateways\". Why?",
          options: [
            "Gateway API ships as CRDs maintained out of tree, so they must be installed before any Gateway object exists",
            "Gateway API is still alpha and needs a feature gate on the API server",
            "Gateways are cluster-scoped and need `--all-namespaces`",
            "The kind is `GatewayClass`; `Gateway` does not exist on its own",
          ],
          correctIndex: 0,
          explanation:
            "You install the Gateway API CRDs (1.6 is current) and then an implementation such as Envoy Gateway, Istio, NGINX Gateway Fabric or a cloud controller. Being out of tree is what lets the API iterate faster than the Kubernetes release cycle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-ingress-gateway-q5",
          prompt: "Match the Gateway API kinds to their owners in the usual three-role split.",
          options: [
            "`GatewayClass` names an implementation (infrastructure provider), `Gateway` is the listener (cluster operator), `HTTPRoute` attaches routes (application team)",
            "`GatewayClass` is per application, `Gateway` is per route, `HTTPRoute` is per cluster",
            "`Gateway` names the implementation, `GatewayClass` is the listener, `HTTPRoute` is a backend alias",
            "All three are created together by the application team for each service",
          ],
          correctIndex: 0,
          explanation:
            "The role separation is the design's main point: it is the same shape as StorageClass / PersistentVolume / PersistentVolumeClaim, and it is what Ingress could not express.",
        },
        {
          id: "k8s-ingress-gateway-q6",
          prompt: "An `HTTPRoute` in namespace `team-a` references a backend Service in namespace `team-b`. What must exist for it to work?",
          options: [
            "A `ReferenceGrant` in `team-b` permitting HTTPRoutes from `team-a` to reference its Services",
            "Nothing extra; cross-namespace backends are allowed by default",
            "A RoleBinding granting `team-a`'s service account `get` on Services in `team-b`",
            "A NetworkPolicy in `team-b` allowing ingress from `team-a`",
          ],
          correctIndex: 0,
          explanation:
            "Cross-namespace references are deny-by-default and must be granted *by the target* namespace, so a team cannot route traffic at someone else's Service unilaterally. RBAC governs API access, not data-plane references; a NetworkPolicy may also be needed, but it is a separate control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-ingress-gateway-q7",
          prompt: "Two Ingress objects in different namespaces claim the same host and path on the same controller. What should you expect?",
          options: [
            "Behaviour is controller-specific — commonly the older object wins and the other is ignored, sometimes with a warning event",
            "The API server rejects the second object as a duplicate",
            "Traffic is split 50/50 between the two backends",
            "Both are served, with the request going to whichever backend responds first",
          ],
          correctIndex: 0,
          explanation:
            "Nothing in the Ingress spec arbitrates conflicts, so it falls to the controller, and the usual resolution (oldest creation timestamp wins) is silent enough to look like a routing bug. Gateway API defines conflict resolution explicitly and reports it in route status.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-ingress-gateway-q8",
          prompt: "Which `pathType` values does the Ingress spec define?",
          options: [
            "`Exact`, `Prefix` and `ImplementationSpecific`",
            "`Exact`, `Regex` and `Wildcard`",
            "`Strict`, `Loose` and `Default`",
            "`Prefix` and `Regex` only",
          ],
          correctIndex: 0,
          explanation:
            "`pathType` is required, and `ImplementationSpecific` is the honest escape hatch that hands matching semantics (including regex) to the controller — which is also exactly the portability problem Gateway API set out to solve.",
        },
        {
          id: "k8s-ingress-gateway-q9",
          prompt: "You want to send 5% of production traffic to a new version for an hour. What does each API offer?",
          options: [
            "Gateway API has weighted `backendRefs` as a typed field; with Ingress you depend on controller-specific canary annotations",
            "Both support weights natively via `spec.rules[].weight`",
            "Neither supports weighting; you must scale replicas to approximate the split",
            "Ingress supports weights; Gateway API delegates splitting to a service mesh",
          ],
          correctIndex: 0,
          explanation:
            "An `HTTPRoute` rule can list several `backendRefs` with weights, validated by the API. The nginx Ingress controller can do the same thing, but through `nginx.ingress.kubernetes.io/canary-*` annotations that no other controller understands.",
        },
        {
          id: "k8s-ingress-gateway-q10",
          prompt: "A team is starting a new platform today and asks whether to standardise on Ingress or Gateway API. What is the honest answer?",
          options: [
            "Gateway API for new work — it is the successor and where features land — while expecting to keep reading Ingress, which is still what most existing clusters run",
            "Ingress, because Gateway API is not generally available yet",
            "Gateway API, and migrate every existing Ingress immediately since Ingress is being removed",
            "Neither; expose Services with `type: LoadBalancer` per service instead",
          ],
          correctIndex: 0,
          explanation:
            "Gateway API's core kinds are stable and it is where investment goes, so new work should start there. Ingress is frozen, not removed, and a load balancer per service costs a public IP and loses shared TLS and routing.",
        },
      ],
    },
    {
      id: "k8s-config-secrets",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "ConfigMaps and Secrets",
      summary:
        "ConfigMaps and Secrets exist so an image can be built once and configured per environment. Both are small key–value objects (about 1 MiB, since they live in etcd and are held in the API server's memory) that a Pod consumes either as environment variables or as files in a mounted volume. Secrets are a separate kind mainly so you can point tighter RBAC, audit rules and encryption at them — not because the data is protected on its own.\n\nThat last point is the one to internalise: **a Secret is base64-encoded, not encrypted.** `kubectl get secret db -o yaml | base64 -d` is the whole attack. By default the values are also stored unencrypted in etcd, so an etcd backup on a laptop is a credential leak; encryption at rest is an API-server configuration you opt into, and anyone who can create a Pod in the namespace can mount a Secret and read it regardless. Teams that need more use an external manager (Vault, a cloud secret store) through the Secrets Store CSI driver or External Secrets Operator, keeping the source of truth outside the cluster.\n\nThe delivery mechanism matters more than people expect. Environment variables are read once when the container starts and never change, so editing a ConfigMap does nothing until the Pods are recreated — `kubectl rollout restart`, or a config hash in the Pod template. Values mounted as a volume *do* update (on the order of a minute, via the kubelet's sync), except when mounted with `subPath`, which pins the file forever; even then the application still has to notice and reread. Marking a ConfigMap or Secret `immutable: true` gives up in-place edits and in return lets the kubelet stop watching it, which is a real API-server saving at scale.\n\nOne failure mode to recognise on sight: a Pod referencing a ConfigMap or Secret key that does not exist sits in `CreateContainerConfigError`, not `CrashLoopBackOff`, because the container never started.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Kubernetes: ConfigMaps", url: "https://kubernetes.io/docs/concepts/configuration/configmap/", kind: "docs" },
        { label: "Kubernetes: Secrets", url: "https://kubernetes.io/docs/concepts/configuration/secret/", kind: "docs" },
        { label: "Kubernetes: Encrypting Confidential Data at Rest", url: "https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/", kind: "docs" },
        { label: "Kubernetes: Good practices for Secrets", url: "https://kubernetes.io/docs/concepts/security/secrets-good-practices/", kind: "article" },
      ],
      video: {
        title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
        videoId: "_4uQI4ihGVU",
        durationLabel: "5:53:25",
        startSeconds: 14565,
        chapterLabel: "ConfigMap and Secrets",
      },
      alternateVideos: [
        {
          title: "Sealed Secrets: Safeguarding Your Kubernetes Secrets | Step By Step Tutorial | KodeKloud",
          channel: "KodeKloud",
          url: "https://www.youtube.com/watch?v=wWMJCY2E0d4",
          videoId: "wWMJCY2E0d4",
          durationLabel: "13:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-config-secrets-q1",
          prompt: "Which statements about Kubernetes Secrets are true with default cluster settings? (Select all that apply.)",
          options: [
            "The stored values are base64-encoded, which is an encoding, not encryption",
            "They are written to etcd unencrypted unless encryption at rest is configured",
            "Anyone who can create a Pod in the namespace can read them by mounting them",
            "The API server encrypts them with the cluster CA key before storing them",
            "`kubectl get secret -o yaml` redacts the values",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The separate kind buys you a target for RBAC, auditing and encryption — nothing more by itself. Treat \"can create Pods here\" as equivalent to \"can read every Secret here\" when you design namespaces.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-config-secrets-q2",
          prompt:
            "You edit a ConfigMap consumed through `envFrom` and wait ten minutes. The running Pods still report the old value. Why?",
          options: [
            "Environment variables are materialised when the container starts and are never refreshed; the Pods must be recreated",
            "The kubelet caches ConfigMaps for an hour by default",
            "`envFrom` only reads keys that existed when the Deployment was created",
            "The ConfigMap needs `immutable: false` set explicitly to allow propagation",
          ],
          correctIndex: 0,
          explanation:
            "`kubectl rollout restart deployment/<name>` is the manual fix; putting a hash of the ConfigMap in a Pod-template annotation makes it automatic. Mounted files are the alternative if you want live updates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-config-secrets-q3",
          prompt: "A ConfigMap is mounted as a volume. An operator edits it. When does the file inside the container change?",
          options: [
            "Within about a minute, when the kubelet syncs — unless the file was mounted with `subPath`, which never updates",
            "Immediately, in the same API transaction as the edit",
            "Never; volume mounts are snapshotted at Pod creation",
            "Only after the container restarts, exactly like environment variables",
          ],
          correctIndex: 0,
          explanation:
            "The kubelet swaps an atomically updated symlink directory. `subPath` mounts a single file path and misses the swap entirely — a very common \"why is my config not reloading\" cause. The app still has to watch the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-config-secrets-q4",
          prompt: "A Pod references `secretKeyRef` for a key that does not exist. What state does the Pod settle into?",
          options: [
            "`CreateContainerConfigError` — the container never started, so there is nothing to crash-loop",
            "`CrashLoopBackOff`, after the process exits because the variable is empty",
            "`Pending`, because the scheduler will not place a Pod with unresolved references",
            "`Running`, with the variable set to an empty string",
          ],
          correctIndex: 0,
          explanation:
            "Recognising the state saves a debugging cycle: `CreateContainerConfigError` always points at a missing or misnamed ConfigMap/Secret key, and `kubectl describe pod` names it exactly.",
        },
        {
          id: "k8s-config-secrets-q5",
          prompt: "Why is there a size limit of roughly 1 MiB on ConfigMaps and Secrets?",
          options: [
            "They are ordinary API objects stored in etcd and cached in the API server, so large ones hurt the whole control plane",
            "The kubelet writes them to a tmpfs whose size is fixed at 1 MiB",
            "base64 encoding expands the data and the API server caps the encoded form",
            "It is a client-side limit in `kubectl` that can be raised with a flag",
          ],
          correctIndex: 0,
          explanation:
            "Anything bigger — a TLS bundle chain, a dataset, a binary — belongs in a volume, an image layer or object storage. etcd is a small, highly replicated database, not a file store.",
        },
        {
          id: "k8s-config-secrets-q6",
          prompt: "What does setting `immutable: true` on a ConfigMap or Secret achieve?",
          options: [
            "The data can no longer be changed, and the kubelet stops watching it, which measurably reduces API-server load at scale",
            "It encrypts the contents at rest automatically",
            "It prevents Pods from mounting it without explicit RBAC",
            "It makes updates propagate instantly to mounted volumes",
          ],
          correctIndex: 0,
          explanation:
            "It is a performance and safety trade: you now roll out config by creating a new, versioned object and updating the reference, which also makes rollbacks explicit. It has nothing to do with encryption.",
        },
        {
          id: "k8s-config-secrets-q7",
          prompt: "What is the practical benefit of the Secrets Store CSI driver or External Secrets Operator over plain Secrets?",
          options: [
            "The source of truth and rotation live in an external manager, so credentials are not stored long-term in etcd or in Git",
            "They encrypt Kubernetes Secrets with a stronger cipher than the API server uses",
            "They remove the need for RBAC on secret access",
            "They allow Secrets larger than the 1 MiB object limit",
          ],
          correctIndex: 0,
          explanation:
            "The value is moving custody, rotation and audit to a system built for it. RBAC still governs who can read whatever lands in the cluster, and the size limit is unchanged.",
        },
        {
          id: "k8s-config-secrets-q8",
          prompt: "What is the difference between a Secret's `data` and `stringData` fields?",
          options: [
            "`stringData` accepts plain text that the API server base64-encodes into `data` on write; reads only ever return `data`",
            "`stringData` is stored as plain text and `data` is encrypted",
            "`data` is for files and `stringData` is for environment variables",
            "`stringData` is a deprecated alias kept for compatibility with older manifests",
          ],
          correctIndex: 0,
          explanation:
            "It is a write-only convenience so you do not hand-encode values in manifests. Nothing about the storage or protection differs afterwards.",
        },
        {
          id: "k8s-config-secrets-q9",
          prompt: "Which of these belong in a Secret rather than a ConfigMap? (Select all that apply.)",
          options: [
            "A database password",
            "A TLS private key",
            "An API token for a third-party service",
            "A log level such as `info`",
            "A feature-flag list read at startup",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The split is about what deserves restricted RBAC, audit and encryption, not about sensitivity of tone. Putting non-secret config in Secrets just makes it harder for the people who legitimately need to read it.",
        },
        {
          id: "k8s-config-secrets-q10",
          prompt: "Your cluster enables encryption at rest for Secrets. What threat does this actually address?",
          options: [
            "Someone reading etcd's data files or a backup directly, without going through the API server",
            "A user with `get secrets` RBAC permission reading a Secret",
            "A compromised Pod reading the Secret it already mounts",
            "A Secret being committed to Git in a manifest",
          ],
          correctIndex: 0,
          explanation:
            "Encryption at rest protects the storage layer only; the API server decrypts on read, so authorised callers see plain text. RBAC, workload isolation and keeping manifests out of Git are separate controls for the other three.",
        },
      ],
    },
    {
      id: "k8s-resources-qos",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Requests, Limits & QoS Classes",
      summary:
        "Requests and limits look like one setting with two numbers. They are two unrelated mechanisms. A **request** is scheduling currency: the scheduler subtracts it from a node's allocatable capacity and will not place the Pod anywhere the sum no longer fits. It is a reservation, and it is compared against other Pods' *requests*, never against real usage. A **limit** is a cgroup ceiling the kernel enforces on the node, and nothing about it is visible to the scheduler.\n\nWhat happens at the ceiling depends on the resource, because CPU is compressible and memory is not. Exceeding a CPU limit gets you **throttled**: the kernel's CFS quota hands the cgroup its share each 100 ms period and then stops scheduling it until the next one. Nothing dies, nothing is logged by Kubernetes, and your p99 latency quietly doubles — visible only as `container_cpu_cfs_throttled_seconds_total`. This is why a 16-thread runtime with `limits.cpu: 1` can be throttled hard at 30% average utilisation: it burns the whole quota in the first 20 ms of each period and then idles. Exceeding a memory limit gets you **OOMKilled**: the kernel kills the process, the container's last state shows `Reason: OOMKilled` with exit code 137 (128 + 9), and the kubelet restarts it in place — repeatedly, which is why so many memory leaks present as `CrashLoopBackOff`.\n\nThe combination of the two decides the Pod's **QoS class**, which is derived, not declared. *Guaranteed* requires every container to set CPU and memory requests and limits, both non-zero and equal. *BestEffort* means no container sets any request or limit at all. Everything in between is *Burstable*. Under node pressure the kubelet evicts BestEffort first, then Burstable, then Guaranteed, and only Pods using more than their requests are candidates — so a Pod that stays inside its request is nearly untouchable.\n\nDistinguish the two deaths when you are on call. An **eviction** is the kubelet acting gracefully on node pressure: the Pod object ends in `Failed` with reason `Evicted` and its controller schedules a replacement elsewhere. An **OOMKill** is the kernel acting on one cgroup: the Pod stays where it is and the container restarts. Since Kubernetes 1.35 you can also change a running Pod's CPU and memory through the `resize` subresource without recreating it, which is what makes in-place vertical scaling practical.",
      level: "expert",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "Kubernetes: Resource Management for Pods and Containers", url: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/", kind: "docs" },
        { label: "Kubernetes: Pod Quality of Service Classes", url: "https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/", kind: "docs" },
        { label: "Kubernetes: Node-pressure Eviction", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/", kind: "docs" },
        { label: "Robusta: For the Love of God, Stop Using CPU Limits on Kubernetes", url: "https://home.robusta.dev/blog/stop-using-cpu-limits", kind: "article" },
      ],
      video: {
        title: "All You Need to Know in 12 Minutes: Pods' Requests and Limits in Kubernetes",
        channel: "The Good Guy",
        url: "https://www.youtube.com/watch?v=lKH1K5R3kqg",
        videoId: "lKH1K5R3kqg",
        durationLabel: "12:40",
      },
      alternateVideos: [
        {
          title: "Kubernetes Quality of Service (QoS) Classes for Pods (Guaranteed, Burstable, BestEffort)",
          channel: "Anton Putra",
          url: "https://www.youtube.com/watch?v=ka-HItczp2I",
          videoId: "ka-HItczp2I",
          durationLabel: "2:58",
        },
        {
          title: "Common Kubernetes Mistakes - CPU and Memory Requests (part 1)",
          channel: "Robusta",
          url: "https://www.youtube.com/watch?v=_nknHwTKlh8",
          videoId: "_nknHwTKlh8",
          durationLabel: "6:33",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-resources-qos-q1",
          prompt:
            "A Pod has two containers. Container A sets `cpu: 200m` and `memory: 256Mi` for both requests and limits. Container B sets only `memory: 128Mi` as a request. What QoS class does the Pod get?",
          options: [
            "Burstable — Guaranteed requires *every* container to set equal, non-zero CPU and memory requests and limits",
            "Guaranteed, because at least one container fully specifies both",
            "BestEffort, because container B has no limits",
            "It is split per container: A is Guaranteed and B is Burstable",
          ],
          correctIndex: 0,
          explanation:
            "QoS is a property of the Pod and the weakest container decides it. One under-specified sidecar is enough to drop a carefully tuned Pod out of Guaranteed and change how it is treated under node pressure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-resources-qos-q2",
          prompt: "How are CPU and memory limits enforced differently, and what does each look like from outside?",
          options: [
            "CPU over the limit is throttled by the CFS quota, silently and with no Kubernetes event; memory over the limit is an OOMKill with exit code 137 and a container restart",
            "Both terminate the container, but CPU pressure is reported as `Evicted` and memory as `OOMKilled`",
            "Both throttle: memory allocations simply block until space is free",
            "CPU over the limit kills the container; memory over the limit causes the Pod to be rescheduled",
          ],
          correctIndex: 0,
          explanation:
            "CPU is compressible so the kernel can simply give you less. Memory is not, so the only enforcement available is killing something. The asymmetry is why CPU problems hide in latency metrics and memory problems show up in restart counts.",
        },
        {
          id: "k8s-resources-qos-q3",
          prompt:
            "A Go service with `GOMAXPROCS` left at the node's core count runs with `limits.cpu: \"1\"`. Average CPU usage is 30%, but p99 latency is terrible and throttling metrics are high. What is happening?",
          options: [
            "It uses many threads in parallel, exhausting its 100 ms CFS quota early in each period, then stalls until the next one — average utilisation hides the stalls",
            "The limit is being applied per thread, so each thread gets a fraction of a core",
            "The node is oversubscribed, so the scheduler is preempting the Pod",
            "Average usage above 25% always triggers throttling regardless of the limit",
          ],
          correctIndex: 0,
          explanation:
            "Quota is granted per period, not smoothed over a minute. Bursty parallel work exhausts it in a fraction of the period and then waits — the classic reason for raising the limit, dropping it entirely, or setting `GOMAXPROCS` (or the JVM's `-XX:ActiveProcessorCount`) to match.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-resources-qos-q4",
          prompt: "Which statements about requests and limits are true? (Select all that apply.)",
          options: [
            "The scheduler places Pods using requests, never observed usage",
            "A container may use more than its CPU request when the node has spare capacity",
            "Omitting a memory limit means the container can grow until the node comes under pressure",
            "The scheduler refuses to place a Pod whose limits exceed the node's free memory",
            "Setting a limit without a request means the request defaults to zero",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Limits are invisible to the scheduler — only requests are. And when only a limit is given, Kubernetes defaults the request *to the limit*, not to zero, which is a common way Pods accidentally become Guaranteed and reserve far more than they need.",
        },
        {
          id: "k8s-resources-qos-q5",
          prompt:
            "A node is under memory pressure. Which Pod does the kubelet evict first, all else being equal?",
          options: [
            "A BestEffort Pod, then Burstable Pods exceeding their requests, and Guaranteed Pods last",
            "The Pod using the most absolute memory, regardless of QoS class",
            "The newest Pod on the node, since it caused the pressure",
            "Guaranteed Pods first, because they have reserved capacity that can be reclaimed",
          ],
          correctIndex: 0,
          explanation:
            "Eviction order follows QoS, and under resource pressure only Pods *exceeding their requests* are candidates at all. Setting an honest memory request is therefore the cheapest protection a workload can buy.",
        },
        {
          id: "k8s-resources-qos-q6",
          prompt:
            "`kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`, and the Pod is `Running` with 6 restarts. Which statements are correct? (Select all that apply.)",
          options: [
            "The kernel killed the process because its cgroup exceeded the memory limit",
            "137 is 128 + 9, that is, terminated by SIGKILL",
            "The Pod stayed on the same node and the kubelet restarted the container in place",
            "The Pod was evicted by the kubelet and rescheduled elsewhere",
            "The node itself ran out of memory, which is why the container was killed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A cgroup OOMKill is local to one container and does not move the Pod. Node-level pressure produces an *eviction* instead: a `Failed` Pod with reason `Evicted` and a replacement created by its controller. Confusing the two sends you debugging the wrong layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-resources-qos-q7",
          prompt:
            "Every node has 4 CPU cores, and a Pod requesting `cpu: \"4\"` stays `Pending` with `Insufficient cpu` even on a completely idle node. Why?",
          options: [
            "Schedulable capacity is `allocatable`, which is capacity minus kube-reserved, system-reserved and eviction thresholds — always less than the node's raw core count",
            "The scheduler reserves one full core per node for kube-proxy by policy",
            "CPU requests above 2 cores require the static CPU manager policy to be enabled",
            "Requests must be expressed in millicores, so `\"4\"` is parsed as 4m and rejected",
          ],
          correctIndex: 0,
          explanation:
            "`kubectl describe node` prints Capacity and Allocatable separately, and the gap is where the kubelet, runtime and OS live. A Pod sized to the node's full capacity can never be scheduled anywhere.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-resources-qos-q8",
          prompt: "A namespace has a ResourceQuota limiting total `requests.cpu` and `limits.memory`. What changes for Pods created there?",
          options: [
            "Every new Pod must specify the constrained resources, or creation is rejected — a LimitRange is the usual way to supply defaults",
            "Pods without requests are accepted and simply counted as zero against the quota",
            "The quota only applies to Deployments, not to bare Pods",
            "Existing Pods over the quota are evicted immediately when it is applied",
          ],
          correctIndex: 0,
          explanation:
            "A quota on a resource makes that resource mandatory, which is an abrupt change for teams used to omitting it. A LimitRange in the same namespace supplies defaults so existing manifests keep working. Quotas apply to new admissions, not retroactively.",
        },
        {
          id: "k8s-resources-qos-q9",
          prompt: "What changed with in-place Pod resize, stable since Kubernetes 1.35?",
          options: [
            "CPU and memory for a running Pod can be changed through its `resize` subresource, with per-resource `resizePolicy` deciding whether a restart is needed",
            "The scheduler now rebalances Pods automatically when node usage changes",
            "Limits became mutable but requests stayed immutable",
            "Pods now grow their memory limit automatically when they approach it",
          ],
          correctIndex: 0,
          explanation:
            "Previously any resource change meant a new Pod, which is why vertical autoscaling was disruptive. With `resizePolicy: NotRequired` for CPU, a resize is applied to the cgroup live; memory decreases are still the awkward case.",
        },
        {
          id: "k8s-resources-qos-q10",
          prompt: "A Guaranteed Pod's container allocates past its memory limit. What happens?",
          options: [
            "It is OOMKilled like any other container — Guaranteed protects against *eviction*, not against exceeding your own limit",
            "Nothing: Guaranteed Pods are permitted to exceed their limits when the node has free memory",
            "The kubelet raises the limit automatically to the node's available memory",
            "The Pod is evicted and rescheduled on a larger node",
          ],
          correctIndex: 0,
          explanation:
            "The QoS class only orders eviction candidates under node pressure. Your own cgroup ceiling is enforced unconditionally, so Guaranteed changes nothing about how the kernel treats a leak.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-resources-qos-q11",
          prompt:
            "A platform team is deciding whether to set CPU limits on latency-sensitive services. What is the strongest argument for leaving CPU limits off while keeping requests?",
          options: [
            "Requests already guarantee a floor under contention, while a limit throttles the workload even when the node is idle",
            "Without limits, the scheduler packs Pods more densely and improves utilisation",
            "CPU limits are ignored unless the static CPU manager policy is enabled",
            "Omitting limits moves the Pod into the Guaranteed QoS class",
          ],
          correctIndex: 0,
          explanation:
            "CFS shares derived from requests already arbitrate contention fairly; the limit only adds a hard stop that fires during idle periods too. The counter-argument is real — no limit means one runaway process can starve co-tenants — which is why memory limits are far less controversial than CPU limits.",
        },
        {
          id: "k8s-resources-qos-q12",
          prompt: "Which Pod is BestEffort?",
          options: [
            "One where no container sets any CPU or memory request or limit",
            "One where containers set requests but no limits",
            "One where containers set limits but no requests",
            "One where only the sidecar sets requests and limits",
          ],
          correctIndex: 0,
          explanation:
            "BestEffort means the Pod asked for nothing at all: it is scheduled anywhere, can use whatever is spare, and is first out under pressure. Any request or limit on any container makes it Burstable.",
        },
      ],
    },
    {
      id: "k8s-probes",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Liveness, Readiness & Startup Probes",
      summary:
        "The three probes answer three different questions, and confusing them is one of the most reliable ways to turn a small incident into a large one. **Readiness** asks \"should this Pod receive traffic right now?\" — failing it removes the Pod from the Service's EndpointSlices and nothing else. **Liveness** asks \"is this process wedged beyond recovery?\" — failing it restarts the container. **Startup** asks \"has it finished booting?\" — while it is failing, liveness and readiness are suspended entirely, which is the correct way to support a slow starter without loosening the steady-state checks.\n\nEach probe has a handler (`httpGet`, `tcpSocket`, `exec`, or `grpc`) and a timing budget: `initialDelaySeconds`, `periodSeconds` (10 by default), `failureThreshold` (3), and `timeoutSeconds` — which defaults to **1 second**. That default is the single most common source of mysterious restarts: a health endpoint that usually answers in 20 ms but takes 1.2 s under load starts failing exactly when the service is busiest, and the restart makes it busier.\n\nA wrong liveness probe is worse than no liveness probe. If it starts checking before the app can answer — no startup probe, `initialDelaySeconds` shorter than boot time — the container is killed mid-boot, forever, and the Pod sits in `CrashLoopBackOff` having never once served a request. If it checks a shared dependency such as the database, then the moment that dependency blips, every replica fails liveness simultaneously and restarts in unison, amplifying a 30-second failover into an outage with cold caches. Dependency health belongs in readiness, and even there it is a judgement call: readiness failing on every replica at once empties the Service and turns a degraded service into a completely unreachable one.\n\nPractical guidance: make liveness cheap, local and process-only; use a startup probe rather than a long `initialDelaySeconds`; `exec` probes fork a process on every check, which is expensive at scale; and if you cannot name the deadlock a liveness probe is meant to break, it is reasonable not to have one.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Kubernetes: Liveness, Readiness, and Startup Probes", url: "https://kubernetes.io/docs/concepts/workloads/pods/probes/", kind: "docs" },
        { label: "Kubernetes: Configure Liveness, Readiness and Startup Probes", url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/", kind: "docs" },
        { label: "Henning Jacobs: Liveness Probes are Dangerous", url: "https://srcco.de/posts/kubernetes-liveness-probes-are-dangerous.html", kind: "article" },
      ],
      video: {
        title: "Day 18/40 - Kubernetes Health Probes Explained | Liveness vs Readiness Probes",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=x2e6pIBLKzw",
        videoId: "x2e6pIBLKzw",
        durationLabel: "28:52",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-probes-q1",
          prompt:
            "A service needs about 90 seconds to warm its caches. Its only probe is a liveness probe with `initialDelaySeconds: 10`, `periodSeconds: 10`, `failureThreshold: 3`. What happens?",
          options: [
            "The container is killed at about 40 seconds and restarted forever; it never finishes starting",
            "The Pod waits in `Pending` until the probe passes for the first time",
            "The container runs but receives no traffic until the probe passes",
            "Kubernetes extends the delay automatically when a container is still starting",
          ],
          correctIndex: 0,
          explanation:
            "Liveness starts judging as soon as `initialDelaySeconds` elapses, and three failures ten seconds apart is a kill. A startup probe with `failureThreshold: 30, periodSeconds: 5` gives a 150-second budget and suspends liveness until it passes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-probes-q2",
          prompt:
            "Every replica's liveness probe calls `/health`, which runs `SELECT 1` against the primary database. The database fails over for 30 seconds. What is the likely outcome?",
          options: [
            "Every replica fails liveness at once and restarts together, turning a brief blip into a much longer outage with cold caches",
            "Kubernetes suspends liveness probes while a dependency is unreachable",
            "One replica restarts; the others are spared because probes are staggered",
            "Nothing happens: liveness failures only produce warning events",
          ],
          correctIndex: 0,
          explanation:
            "Restarting a healthy process cannot fix someone else's database. Liveness should test only what a restart could repair; dependency state belongs in readiness, and even that needs care.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-probes-q3",
          prompt: "Which statements about probe effects are true? (Select all that apply.)",
          options: [
            "A failing readiness probe removes the Pod from its Service's endpoints without restarting anything",
            "A failing liveness probe restarts the container, keeping the same Pod, IP and node",
            "While a startup probe is still failing, liveness and readiness probes are not evaluated",
            "A failing readiness probe eventually triggers a container restart",
            "A failing liveness probe causes the Pod to be rescheduled onto a different node",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Readiness gates traffic; liveness restarts the container in place; startup suspends the other two. Neither readiness nor liveness ever moves a Pod between nodes — that requires the Pod object itself to be deleted.",
        },
        {
          id: "k8s-probes-q4",
          prompt:
            "A health endpoint normally responds in 20 ms but takes 1.2 s under peak load. The liveness probe leaves `timeoutSeconds` at its default. What do you observe?",
          options: [
            "Restarts that cluster at peak traffic, because the default `timeoutSeconds` is 1 and a slow response counts as a failure",
            "Nothing: probe timeouts are only advisory and are logged, not acted on",
            "Probes are skipped when the container is busy, so load has no effect",
            "The probe waits for the response indefinitely, since `periodSeconds` bounds the interval, not the request",
          ],
          correctIndex: 0,
          explanation:
            "The one-second default is far tighter than most people assume, and it fails precisely when the service is least able to absorb a restart. Raise `timeoutSeconds`, keep `/health` off the hot path, and make sure it does not queue behind application work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-probes-q5",
          prompt:
            "A startup probe uses `periodSeconds: 5` and `failureThreshold: 60`. How long may the container take to start before it is killed?",
          options: [
            "About 300 seconds — `periodSeconds` multiplied by `failureThreshold`",
            "60 seconds, since `failureThreshold` is a timeout in seconds",
            "5 seconds, because the first failure is fatal for a startup probe",
            "Indefinitely; startup probes never fail the container",
          ],
          correctIndex: 0,
          explanation:
            "The pair is deliberately a budget: raise `failureThreshold` for slow starters rather than lengthening the interval, so a container that becomes healthy early is detected promptly.",
        },
        {
          id: "k8s-probes-q6",
          prompt: "What is the practical cost of an `exec` probe compared with `httpGet`?",
          options: [
            "It forks a process inside the container on every check, which is significant across thousands of Pods and can itself be starved under CPU pressure",
            "It cannot be used with `failureThreshold`",
            "It runs on the control plane rather than on the node, adding API-server load",
            "It requires a shell in the image and therefore a non-distroless base",
          ],
          correctIndex: 0,
          explanation:
            "Cheap-looking `exec` probes add up: process creation is not free, and a throttled container makes the probe slow, which fails the probe, which restarts the container. Prefer `httpGet`, `tcpSocket` or the native `grpc` handler where possible.",
        },
        {
          id: "k8s-probes-q7",
          prompt: "Why is it risky for a readiness probe to check a shared downstream dependency?",
          options: [
            "If that dependency degrades, every replica goes unready simultaneously and the Service has no endpoints, so callers get connection refused instead of degraded responses",
            "Readiness probes cannot make outbound network calls",
            "Readiness failures escalate to liveness failures after three attempts",
            "It doubles the load on the dependency, because probes bypass connection pooling",
          ],
          correctIndex: 0,
          explanation:
            "There is a real trade here: marking yourself unready is right if you truly cannot serve, but it converts partial degradation into total unavailability. Many teams serve reduced functionality and report it in metrics instead.",
        },
        {
          id: "k8s-probes-q8",
          prompt: "A container is in `CrashLoopBackOff` and its restart count climbs every few minutes. Which single command most directly shows why the previous run died?",
          options: [
            "`kubectl logs <pod> -c <container> --previous`",
            "`kubectl logs <pod> -f`",
            "`kubectl get pod <pod> -o wide`",
            "`kubectl top pod <pod>`",
          ],
          correctIndex: 0,
          explanation:
            "`--previous` reads the terminated container's log, which holds the actual failure; tailing the current one shows only the new attempt starting. Pair it with `kubectl describe` for the `Last State` reason and exit code.",
        },
        {
          id: "k8s-probes-q9",
          prompt:
            "During a rolling update, new Pods start, briefly pass readiness, then fail it again and flap. What is the effect on the rollout and on traffic?",
          options: [
            "The rollout stalls or crawls, and traffic is repeatedly routed to Pods that then drop out, producing intermittent errors",
            "The rollout completes normally, because the readiness flap only affects metrics",
            "Kubernetes rolls back automatically once readiness flaps three times",
            "Traffic is held back until the flapping stops, so users see no errors",
          ],
          correctIndex: 0,
          explanation:
            "Readiness gates both traffic and rollout progress, so a flapping probe hurts twice. `minReadySeconds` makes the rollout demand a stable window before counting a Pod as available.",
        },
        {
          id: "k8s-probes-q10",
          prompt:
            "Your team cannot name a specific deadlock that a restart would fix, but policy requires a liveness probe on every service. What is the least harmful configuration?",
          options: [
            "A cheap, local check with generous `failureThreshold` and `timeoutSeconds`, touching no downstream dependency, behind a startup probe",
            "The same endpoint as readiness, so the two always agree",
            "An `exec` probe that greps the process table every second for fast detection",
            "`initialDelaySeconds: 600` so the probe effectively never fires",
          ],
          correctIndex: 0,
          explanation:
            "Make it hard to trip and impossible to trip for someone else's reasons. Reusing the readiness endpoint is the trap: the dependency checks that belong in readiness then become restart triggers.",
        },
        {
          id: "k8s-probes-q11",
          prompt: "A Pod shows `READY 0/1` but `STATUS Running`, with no restarts. What does that combination tell you?",
          options: [
            "The container is up but its readiness probe is failing, so it is excluded from Service endpoints",
            "The container has crashed and is waiting to restart",
            "The Pod is still being scheduled onto a node",
            "The image pull has not finished yet",
          ],
          correctIndex: 0,
          explanation:
            "Zero restarts rules out crashing, and `Running` means the container started, so the gap is readiness. `kubectl describe pod` prints the failing probe and its last message.",
        },
      ],
    },
    {
      id: "k8s-statefulsets-storage",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "StatefulSets, PersistentVolumes & Storage Classes",
      summary:
        "Deployments treat Pods as interchangeable. Some workloads cannot be: a database replica that owns a specific data directory, a broker that other brokers address by name, anything where replica 0 and replica 2 are genuinely different. A StatefulSet gives each Pod a stable ordinal identity — `db-0`, `db-1` — a stable DNS name through a governing headless Service, and its own PersistentVolumeClaim generated from `volumeClaimTemplates`. Pods are created in order and terminated in reverse order, and a rolling update walks the ordinals backwards, with `partition` available to hold the update at a canary boundary.\n\nStorage underneath is a three-object chain. A **StorageClass** names a provisioner and its parameters; a **PersistentVolumeClaim** is the request a workload writes; a **PersistentVolume** is the actual volume, created dynamically by the CSI driver to satisfy the claim. Two StorageClass fields decide most of the operational behaviour. `reclaimPolicy` (`Delete` or `Retain`) says whether deleting the PVC destroys the data — the default from dynamic provisioning is `Delete`, which is exactly as dangerous as it sounds. `volumeBindingMode: WaitForFirstConsumer` delays provisioning until a Pod is scheduled, so a zonal disk is created in the zone the Pod actually landed in; with the default `Immediate` binding the volume is created first and then pins the Pod to that zone, which is a frequent cause of unschedulable Pods in multi-zone clusters. `allowVolumeExpansion: true` lets you grow a PVC later; shrinking is never supported.\n\nThe access mode is the classic trap. `ReadWriteOnce` means one *node*, not one Pod: two Pods on the same node can both mount an RWO volume, which quietly permits the concurrent-writer corruption people assume is impossible. `ReadWriteOncePod` is the mode that actually means one Pod. `ReadWriteMany` needs a filesystem backend such as NFS or EFS; most block storage cannot provide it.\n\nFinally, StatefulSet PVCs deliberately outlive their Pods. Scaling down or deleting the StatefulSet keeps the claims so the data survives a mistake — which also means a scale-down leaves paid-for volumes behind until someone deletes them. `persistentVolumeClaimRetentionPolicy` (stable since 1.32) lets you choose `Delete` or `Retain` separately for the scale-down and delete cases.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Kubernetes: StatefulSets", url: "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/", kind: "docs" },
        { label: "Kubernetes: Persistent Volumes", url: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/", kind: "docs" },
        { label: "Kubernetes: Storage Classes", url: "https://kubernetes.io/docs/concepts/storage/storage-classes/", kind: "docs" },
        { label: "Kubernetes: Volumes", url: "https://kubernetes.io/docs/concepts/storage/volumes/", kind: "docs" },
      ],
      video: {
        title: "Kubernetes StatefulSet simply explained | Deployment vs StatefulSet",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=pPQKAR1pA9U",
        videoId: "pPQKAR1pA9U",
        durationLabel: "15:59",
      },
      alternateVideos: [
        {
          title: "Kubernetes Volumes explained | Persistent Volume, Persistent Volume Claim & Storage Class",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=0swOh5C3OVM",
          videoId: "0swOh5C3OVM",
          durationLabel: "21:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-statefulsets-storage-q1",
          prompt:
            "Two Pods of the same Deployment happen to be scheduled onto the same node and both mount a `ReadWriteOnce` PVC. What happens?",
          options: [
            "Both mount it successfully, because `ReadWriteOnce` restricts to one *node*, not one Pod — risking concurrent-writer corruption",
            "The second Pod stays `ContainerCreating` with a multi-attach error",
            "The volume is mounted read-only for the second Pod",
            "The API server rejects the second Pod at admission",
          ],
          correctIndex: 0,
          explanation:
            "This is the mode people misread most often. `ReadWriteOncePod` is the access mode that genuinely allows a single Pod; plain RWO only blocks a second *node* from attaching, which is what produces the multi-attach error people expect here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-statefulsets-storage-q2",
          prompt: "You scale a StatefulSet from 5 replicas to 3. What happens to `db-3` and `db-4`, and to their PVCs?",
          options: [
            "The Pods are deleted highest-ordinal first; their PVCs remain by default, so the data (and the cloud disks) are still there",
            "The Pods and their PVCs are deleted together, as with a Deployment's ephemeral volumes",
            "The lowest ordinals are removed first to keep the newest data",
            "Scaling down is rejected until the PVCs are deleted manually",
          ],
          correctIndex: 0,
          explanation:
            "Retaining claims makes scale-down reversible — scaling back to 5 reattaches the same data. The cost is orphaned volumes you keep paying for, which is what `persistentVolumeClaimRetentionPolicy` (stable since 1.32) exists to automate.",
        },
        {
          id: "k8s-statefulsets-storage-q3",
          prompt: "Which of these are genuine reasons to choose a StatefulSet over a Deployment? (Select all that apply.)",
          options: [
            "Each replica needs its own persistent volume that follows it across restarts",
            "Peers must address each other by stable, predictable DNS names",
            "Startup and shutdown must happen in a defined order",
            "The application writes to a shared ReadWriteMany volume",
            "The workload is important and must not lose data",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Per-Pod identity, per-Pod storage and ordering are the three things a StatefulSet adds. A shared RWX volume works fine with a Deployment, and importance is not a technical requirement — a StatefulSet does not make an application durable.",
        },
        {
          id: "k8s-statefulsets-storage-q4",
          prompt:
            "In a three-zone cluster, a PVC is bound immediately at creation and provisions a disk in zone `a`. Its Pod cannot be scheduled because zone `a` has no room. What setting prevents this?",
          options: [
            "`volumeBindingMode: WaitForFirstConsumer` on the StorageClass, so provisioning waits until the scheduler has chosen a node",
            "`allowVolumeExpansion: true`, so the volume can be moved to another zone",
            "`reclaimPolicy: Retain`, so the volume survives rescheduling",
            "Setting `accessModes: [ReadWriteMany]` so any zone can attach it",
          ],
          correctIndex: 0,
          explanation:
            "With `Immediate` binding the storage decides placement and the scheduler has to follow; `WaitForFirstConsumer` inverts that. Zonal block storage cannot be moved or attached across zones, whatever the access mode says.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-statefulsets-storage-q5",
          prompt: "A dynamically provisioned PVC is deleted by mistake. With a default StorageClass, what happened to the data?",
          options: [
            "The `Delete` reclaim policy destroyed the underlying volume along with the PV",
            "The PV moves to `Released` and keeps the data until an administrator reclaims it",
            "The data is retained for 24 hours before deletion",
            "Nothing: PVCs are just references and deleting one never touches storage",
          ],
          correctIndex: 0,
          explanation:
            "`Delete` is the default reclaim policy for dynamic provisioning, so the destructive path is the easy one. Use `Retain` for anything irreplaceable, and treat backups as the real answer — reclaim policy is a guard rail, not a backup.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-statefulsets-storage-q6",
          prompt: "What does the `serviceName` field on a StatefulSet provide?",
          options: [
            "The governing headless Service that gives each Pod a stable DNS name like `db-0.db.prod.svc.cluster.local`",
            "A ClusterIP Service that load balances across the replicas",
            "The name used for the StatefulSet's rolling-update strategy",
            "The external DNS name published for the cluster's clients",
          ],
          correctIndex: 0,
          explanation:
            "Per-Pod DNS records come from that headless Service. Without it, peers have no stable way to find each other, which is precisely what distinguishes a StatefulSet's networking from a Deployment's.",
        },
        {
          id: "k8s-statefulsets-storage-q7",
          prompt: "How does a StatefulSet's rolling update proceed, and what does `spec.updateStrategy.rollingUpdate.partition: 3` do?",
          options: [
            "It updates Pods in reverse ordinal order, and `partition: 3` updates only ordinals 3 and above — a canary you promote by lowering the number",
            "It updates all Pods in parallel, and `partition` sets how many may be unavailable",
            "It updates in ascending ordinal order, and `partition` sets where to stop",
            "It recreates the whole set at once, and `partition` splits it into batches of 3",
          ],
          correctIndex: 0,
          explanation:
            "Reverse order means the highest ordinal — usually the least critical replica — is disturbed first. `partition` freezes everything below the threshold, giving you a staged rollout with an explicit promotion step.",
        },
        {
          id: "k8s-statefulsets-storage-q8",
          prompt: "A PVC needs to grow from 100 Gi to 500 Gi. What must be true, and what is never possible?",
          options: [
            "The StorageClass must set `allowVolumeExpansion: true`; shrinking a PVC is never supported",
            "The PVC must be unbound first; both growing and shrinking then work",
            "Expansion requires `reclaimPolicy: Retain`; shrinking requires a snapshot",
            "Any PVC can be resized in either direction as long as the Pod is restarted",
          ],
          correctIndex: 0,
          explanation:
            "Expansion is opt-in per StorageClass, and depending on the driver the filesystem may only be resized on the next mount. There is no shrink path at all: you provision a smaller volume and copy the data.",
        },
        {
          id: "k8s-statefulsets-storage-q9",
          prompt: "A PVC sits in `Pending` and `kubectl describe` shows no provisioner activity. Which causes are plausible? (Select all that apply.)",
          options: [
            "The named StorageClass does not exist, or there is no default StorageClass and the PVC names none",
            "`volumeBindingMode: WaitForFirstConsumer` is set and no Pod is using the claim yet",
            "The requested access mode is not supported by the driver, so nothing can satisfy the claim",
            "The PVC's namespace has no NetworkPolicy allowing storage traffic",
            "The PVC is larger than the total free space reported by `kubectl top nodes`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pending almost always means \"nothing has claimed responsibility for provisioning this\". `WaitForFirstConsumer` pending is *normal* and resolves the moment a Pod mounts it. NetworkPolicies do not govern volume attachment, and `kubectl top` reports compute, not storage.",
        },
        {
          id: "k8s-statefulsets-storage-q10",
          prompt: "Why does a StatefulSet on its own not make a database highly available?",
          options: [
            "It only provides identity, ordering and per-Pod storage; replication, failover and quorum are the application's job",
            "It restarts all replicas together during an update, so there is always downtime",
            "Its PVCs are ephemeral, so data is lost when Pods move",
            "It cannot run more than one replica per node",
          ],
          correctIndex: 0,
          explanation:
            "Kubernetes places and names the processes; it does not know what a leader is. That gap is why database operators exist — they encode promotion, backup and topology as controllers on top of the StatefulSet.",
        },
      ],
    },
    {
      id: "k8s-daemonsets-jobs",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "DaemonSets, Jobs & CronJobs",
      summary:
        "Not every workload is a pool of interchangeable replicas. A **DaemonSet** runs exactly one Pod per matching node and creates another whenever a node joins — the shape for anything node-local: CNI plugins, CSI node drivers, log collectors, node exporters. It is scheduled by the normal scheduler through node affinity, but the DaemonSet controller adds a set of tolerations automatically, for `not-ready`, `unreachable`, the three pressure taints and `unschedulable`. That last one is why `kubectl cordon` stops new application Pods but leaves your log shipper running, which is exactly what you want while draining a node.\n\nA **Job** runs Pods until a number of them succeed, then stops. `completions` is how many successes you need and `parallelism` how many may run at once; `restartPolicy` must be `OnFailure` or `Never`, because `Always` would contradict the idea of finishing. Failures are retried up to `backoffLimit` (6 by default) with exponential back-off starting at 10 s and capped at six minutes, after which the Job is marked failed and stays that way until a human intervenes. Completed Pods are kept so their logs survive; `ttlSecondsAfterFinished` is what stops finished Jobs accumulating in a busy cluster.\n\nA **CronJob** is a controller that creates Jobs on a schedule, and its semantics are at-least-once, not exactly-once. Write the work to be idempotent and you will never care; assume exactly-once and you will eventually double-charge someone. `concurrencyPolicy` chooses between `Allow` (the default, overlapping runs), `Forbid` (skip if the previous run is still going) and `Replace` (kill the old one). `startingDeadlineSeconds` bounds how late a missed run may start.\n\nThe classic CronJob failure is a cluster or controller outage: on recovery the controller counts missed schedules since the last run, and if there are more than 100 it refuses to start anything and logs `too many missed start times`, leaving a job that looks scheduled and simply never runs again until someone notices. Setting a very small `startingDeadlineSeconds` has its own trap — below about 10 seconds the controller's own check interval can miss the window entirely.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Kubernetes: DaemonSet", url: "https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/", kind: "docs" },
        { label: "Kubernetes: Jobs", url: "https://kubernetes.io/docs/concepts/workloads/controllers/job/", kind: "docs" },
        { label: "Kubernetes: CronJob", url: "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/", kind: "docs" },
      ],
      video: {
        title: "Day 12/40 - Kubernetes Daemonset Explained - Daemonsets, Job and Cronjob in Kubernetes",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=kvITrySpy_k",
        videoId: "kvITrySpy_k",
        durationLabel: "19:30",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-daemonsets-jobs-q1",
          prompt: "You run `kubectl cordon node-7`. What happens to the DaemonSet Pod already running there, and to new application Pods?",
          options: [
            "The DaemonSet Pod keeps running — the controller adds a toleration for `node.kubernetes.io/unschedulable:NoSchedule` — while new application Pods go elsewhere",
            "Both are evicted immediately, since cordon marks the node unusable",
            "The DaemonSet Pod is evicted but application Pods stay until you drain",
            "Nothing changes for either; cordon only affects the scheduler's scoring",
          ],
          correctIndex: 0,
          explanation:
            "Node-local agents must keep working precisely while a node is being taken out of service — you still want logs and metrics during the drain. Cordon adds a `NoSchedule` taint, which DaemonSets tolerate by default and ordinary Pods do not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-daemonsets-jobs-q2",
          prompt: "Which workloads are a good fit for a DaemonSet? (Select all that apply.)",
          options: [
            "A log collector that reads `/var/log/containers` on each node",
            "A node metrics exporter",
            "A CSI node plugin that attaches volumes for Pods on that node",
            "A web API that should scale with traffic",
            "A nightly report generator",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The test is \"does this need to exist once per node, because it works on that node's resources?\" Traffic-driven capacity belongs to a Deployment plus an HPA, and scheduled work belongs to a CronJob.",
        },
        {
          id: "k8s-daemonsets-jobs-q3",
          prompt: "A Job is created with `restartPolicy: Always` in its Pod template. What happens?",
          options: [
            "The API server rejects it: a Job's Pod template must use `OnFailure` or `Never`",
            "It is accepted, and the Job never completes because Pods keep restarting",
            "It is accepted and silently coerced to `OnFailure`",
            "It is accepted but `backoffLimit` is ignored",
          ],
          correctIndex: 0,
          explanation:
            "`Always` means \"this should run forever\", which is incompatible with a workload defined by finishing. The validation is worth knowing because the error message is the fastest explanation of the conceptual difference.",
        },
        {
          id: "k8s-daemonsets-jobs-q4",
          prompt: "A Job's container exits non-zero every time. With default settings, how many attempts are made and what is the final state?",
          options: [
            "The initial attempt plus six retries (`backoffLimit` defaults to 6) with exponential back-off, then the Job is marked failed and stops retrying",
            "Unlimited retries with a ten-second back-off, until the Job is deleted",
            "One attempt; Jobs do not retry unless `backoffLimit` is set explicitly",
            "Six attempts, after which the Job is deleted automatically along with its Pods",
          ],
          correctIndex: 0,
          explanation:
            "Back-off starts at 10 s and doubles to a six-minute cap. A failed Job is left in place — with its Pods, so the logs survive — because giving up silently would hide the failure.",
        },
        {
          id: "k8s-daemonsets-jobs-q5",
          prompt:
            "A nightly CronJob normally takes 20 minutes. One night the source system is slow and the run takes 26 hours. With the default `concurrencyPolicy`, what happens at the next scheduled time?",
          options: [
            "A second Job starts while the first is still running, because the default is `Allow`",
            "The run is skipped, because overlapping executions are forbidden by default",
            "The first Job is killed and replaced by the new one",
            "The CronJob is suspended until an operator resumes it",
          ],
          correctIndex: 0,
          explanation:
            "`Allow` is the default and overlapping runs are the norm, which is fine for idempotent work and catastrophic for anything that mutates shared state. `Forbid` skips the new run; `Replace` kills the old one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-daemonsets-jobs-q6",
          prompt:
            "A CronJob controller was down for a week. On recovery the CronJob never runs again and the controller logs `too many missed start times`. What is going on, and what fixes it?",
          options: [
            "More than 100 schedules were missed, so the controller refuses to start any; setting `startingDeadlineSeconds` bounds how far back it looks and prevents the state",
            "The CronJob was automatically suspended and needs `spec.suspend: false`",
            "The schedule expression became invalid after the outage and must be rewritten",
            "Missed runs are queued and will drain once the backlog is processed",
          ],
          correctIndex: 0,
          explanation:
            "The controller counts unstarted schedules since the last run and gives up past 100, which turns a temporary outage into a permanently dead job. `startingDeadlineSeconds` caps the look-back window — but keep it above about 10 seconds, or the controller's own poll interval can miss the window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-daemonsets-jobs-q7",
          prompt: "Why should a CronJob's work be idempotent?",
          options: [
            "CronJob execution is at-least-once: retries, overlapping runs and controller restarts can all produce a duplicate execution",
            "Because Kubernetes runs each schedule on every node for redundancy",
            "Because Jobs always execute twice and keep the first successful result",
            "Because the scheduler may run the Job early as well as late",
          ],
          correctIndex: 0,
          explanation:
            "Nothing in the design promises exactly-once, and there is no cluster-wide lock. Systems that truly cannot tolerate a duplicate need their own idempotency key or lease.",
        },
        {
          id: "k8s-daemonsets-jobs-q8",
          prompt: "What does `ttlSecondsAfterFinished` do on a Job, and why does it matter?",
          options: [
            "It deletes the Job (and its Pods) that many seconds after it completes or fails, stopping finished objects from accumulating in etcd",
            "It sets how long a Job may run before being terminated",
            "It caps how long completed Pods keep their logs before rotation",
            "It delays the start of the Job by that many seconds",
          ],
          correctIndex: 0,
          explanation:
            "A cluster running thousands of Jobs a day otherwise carries thousands of completed objects the API server must list and watch. `activeDeadlineSeconds` is the separate knob that bounds the running time.",
        },
        {
          id: "k8s-daemonsets-jobs-q9",
          prompt:
            "You need to process 500 independent work items, each Pod taking exactly one item and knowing which one. Which Job configuration fits?",
          options: [
            "`completionMode: Indexed` with `completions: 500` and a suitable `parallelism`, so each Pod gets a unique index",
            "A single Pod with a loop over 500 items and `backoffLimit: 500`",
            "A CronJob scheduled 500 times in a minute",
            "500 separate Jobs, one per item, created by a script",
          ],
          correctIndex: 0,
          explanation:
            "Indexed completion exposes the index as an annotation and in `JOB_COMPLETION_INDEX`, which is what lets a Pod derive its own shard with no external queue. The alternatives lose parallelism, retry granularity, or both.",
        },
        {
          id: "k8s-daemonsets-jobs-q10",
          prompt: "How does a DaemonSet decide which nodes to run on when `spec.template.spec.nodeSelector` is set?",
          options: [
            "The controller creates Pods with node affinity for the matching nodes, and the normal scheduler binds them",
            "The DaemonSet controller binds Pods to nodes itself, bypassing the scheduler",
            "Every node runs a Pod, and non-matching nodes keep it in `Pending`",
            "The kubelet on each node decides whether the selector matches it",
          ],
          correctIndex: 0,
          explanation:
            "DaemonSet Pods stopped being self-scheduled years ago, which is why priority, preemption and other scheduler features apply to them normally. A node that does not match simply never gets a Pod.",
        },
      ],
    },
    {
      id: "k8s-namespaces-labels",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Namespaces, Labels & Selectors",
      summary:
        "A namespace is a name scope. It makes `api` in `staging` a different object from `api` in `prod`, and it is the unit that ResourceQuotas, LimitRanges, RBAC Roles and NetworkPolicies attach to. What it is *not*, by itself, is a security or network boundary: cluster DNS is flat, so a Pod in `staging` can resolve and connect to `api.prod.svc.cluster.local` unless a NetworkPolicy stops it. Namespaces become a boundary only when you add the policies that make them one.\n\nNot every object is namespaced. Nodes, PersistentVolumes, StorageClasses, ClusterRoles, CustomResourceDefinitions and namespaces themselves are cluster-scoped — `kubectl api-resources --namespaced=false` is the authoritative list, and it explains why a quota can never cap a team's PersistentVolumes directly. Deleting a namespace cascades to everything in it, which makes it the cleanest way to tear down an environment and the most dangerous single command in a shared cluster.\n\n**Labels** are the only coupling mechanism Kubernetes has. A Service finds Pods by label, a ReplicaSet owns Pods by label, a NetworkPolicy selects by label, the scheduler places by node label. Nothing references anything by name. Selectors come in two flavours: equality-based (`env=prod`, `tier!=cache`) and set-based (`env in (staging, prod)`, `!canary`), and in workload specs `matchLabels` and `matchExpressions` express the same pair. **Annotations** look similar and are the opposite: arbitrary, potentially large, never selectable, and meant for tools rather than for the platform — the last-applied configuration, an ingress controller's options, a checksum that forces a rollout.\n\nThe gotcha worth knowing is a debugging trick as well as a hazard. Ownership is re-evaluated continuously, so if you *remove* the matching label from a misbehaving Pod, its ReplicaSet notices it is one short and creates a replacement, while the labelled-out Pod keeps running — detached from the Service, out of rotation, and available for you to inspect at leisure. The same mechanism means a careless label edit can silently orphan Pods or make one controller adopt another's.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Kubernetes: Namespaces", url: "https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/", kind: "docs" },
        { label: "Kubernetes: Labels and Selectors", url: "https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/", kind: "docs" },
        { label: "Kubernetes: Annotations", url: "https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/", kind: "docs" },
        { label: "Kubernetes: Resource Quotas", url: "https://kubernetes.io/docs/concepts/policy/resource-quotas/", kind: "docs" },
      ],
      video: {
        title: "Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=X48VuDVv0do",
        videoId: "X48VuDVv0do",
        durationLabel: "3:36:55",
        startSeconds: 6376,
        chapterLabel: "Organizing your components with K8s Namespaces",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-namespaces-labels-q1",
          prompt: "A Pod in namespace `staging` connects to `api.prod.svc.cluster.local` on a cluster with no NetworkPolicies. What happens?",
          options: [
            "The connection succeeds — namespaces scope names and policy, not network reachability",
            "DNS resolution fails, because cross-namespace lookups need the fully qualified external name",
            "The connection is refused by kube-proxy, which enforces namespace isolation",
            "It succeeds only if a RoleBinding grants `staging` access to `prod`",
          ],
          correctIndex: 0,
          explanation:
            "Cluster DNS and the Pod network are flat by default. Isolation comes from adding NetworkPolicies (for traffic) and RBAC (for API access) — namespaces just give you something to attach them to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-namespaces-labels-q2",
          prompt: "Which of these are cluster-scoped rather than namespaced? (Select all that apply.)",
          options: [
            "Node",
            "PersistentVolume",
            "StorageClass",
            "ConfigMap",
            "RoleBinding",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`kubectl api-resources --namespaced=false` is the reliable list. PersistentVolumes being cluster-scoped while PersistentVolumeClaims are namespaced is the split that trips people up most often.",
        },
        {
          id: "k8s-namespaces-labels-q3",
          prompt: "What is the practical difference between a label and an annotation?",
          options: [
            "Labels are identifying metadata that selectors can query and are size-limited; annotations are arbitrary non-selectable metadata for tools",
            "Labels are set by users and annotations only by controllers",
            "Annotations are indexed for fast lookup; labels are stored as free text",
            "Labels are mutable and annotations are immutable after creation",
          ],
          correctIndex: 0,
          explanation:
            "If something needs to be *found* by it, it is a label. If it is configuration for a tool, a checksum or a long note, it is an annotation — which is also why annotations may hold values far larger than a label's 63-character limit.",
        },
        {
          id: "k8s-namespaces-labels-q4",
          prompt:
            "A Pod owned by a three-replica ReplicaSet is behaving oddly. You edit that one Pod to remove the label the ReplicaSet selects on. What happens?",
          options: [
            "The ReplicaSet sees two matching Pods and creates a third; the edited Pod keeps running, detached from the controller and out of the Service",
            "The Pod is deleted immediately, since it no longer matches its owner",
            "Nothing changes: ownership is recorded in `metadata.ownerReferences`, not by labels",
            "The ReplicaSet re-adds the label to restore its desired state",
          ],
          correctIndex: 0,
          explanation:
            "This is the standard way to quarantine a Pod for live debugging without losing capacity. It is also the hazard: a bulk label edit can orphan Pods that then run forever with nothing managing them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-namespaces-labels-q5",
          prompt: "Which selector expression matches Pods in staging or production that are not canaries?",
          options: [
            "`env in (staging, prod), !canary`",
            "`env=staging|prod && canary=false`",
            "`env ~ (staging, prod) NOT canary`",
            "`env=(staging,prod), canary!=true`",
          ],
          correctIndex: 0,
          explanation:
            "Set-based selectors support `in`, `notin` and existence (`key` / `!key`), and comma means AND. `canary!=true` is subtly different: it also matches Pods where the label is absent, which may or may not be what you meant.",
        },
        {
          id: "k8s-namespaces-labels-q6",
          prompt: "You delete a namespace containing Deployments, Services, Secrets and PersistentVolumeClaims. What is removed?",
          options: [
            "All namespaced objects in it, including the PVCs — and whether the underlying volumes survive depends on each StorageClass's reclaim policy",
            "Only the namespace object; its contents are moved to `default`",
            "Everything except Secrets, which require explicit deletion",
            "Nothing until the namespace is empty; deletion is rejected otherwise",
          ],
          correctIndex: 0,
          explanation:
            "The cascade is what makes namespaces good environment boundaries and terrifying to delete by hand. With the default `Delete` reclaim policy, the data goes with the PVCs.",
        },
        {
          id: "k8s-namespaces-labels-q7",
          prompt: "How can a NetworkPolicy or a Gateway select a namespace by name without relying on a label someone remembered to add?",
          options: [
            "Every namespace carries an automatic `kubernetes.io/metadata.name` label equal to its name",
            "Selectors accept a `namespaceName` field alongside `namespaceSelector`",
            "Namespaces can be referenced by UID in a selector",
            "It cannot be done; a custom label must always be applied first",
          ],
          correctIndex: 0,
          explanation:
            "The API server sets that label on every namespace, which is precisely why a `namespaceSelector` on it is reliable. Hand-applied labels are not, because a namespace created by someone else may not have them.",
        },
        {
          id: "k8s-namespaces-labels-q8",
          prompt: "Why do the `app.kubernetes.io/*` recommended labels exist?",
          options: [
            "So tools and people can identify an application's parts consistently across charts and teams — name, instance, version, component, part-of, managed-by",
            "Because the scheduler requires them to place Pods",
            "Because Services can only select on labels in that prefix",
            "Because they are the only labels that survive a `kubectl apply`",
          ],
          correctIndex: 0,
          explanation:
            "They are a convention, not an enforcement: nothing in the control plane reads them. Their value is that dashboards, cost tooling and other teams' queries work without a per-team glossary.",
        },
        {
          id: "k8s-namespaces-labels-q9",
          prompt:
            "A team asks for a namespace per microservice, in one cluster, as an isolation strategy. What is the accurate caveat?",
          options: [
            "Namespaces give naming, quota and RBAC scope, but not network or node isolation — that needs NetworkPolicies, Pod Security Admission and possibly separate node pools",
            "Namespaces isolate network traffic by default, so no additional controls are needed",
            "A cluster supports a limited number of namespaces, so one per service will not scale",
            "Namespaces prevent Pods from consuming other namespaces' CPU, so quotas are redundant",
          ],
          correctIndex: 0,
          explanation:
            "The honest framing is \"a namespace is where you attach isolation\", not \"a namespace is isolation\". Nodes and the network are shared until you say otherwise, and a hostile or buggy Pod is still a co-tenant.",
        },
        {
          id: "k8s-namespaces-labels-q10",
          prompt:
            "A Service with `selector: {app: web, tier: frontend}` has no endpoints, though Pods labelled `app=web` are running and ready. What is wrong?",
          options: [
            "A Service selector is an AND of all its labels, so Pods missing `tier=frontend` do not match",
            "Selectors match on any one label, so the Service should be matching them already; the problem is elsewhere",
            "The Service needs `matchExpressions` to combine two labels",
            "Ready Pods are only added to endpoints after `minReadySeconds` has elapsed",
          ],
          correctIndex: 0,
          explanation:
            "Every key–value pair must be present. `kubectl get pods -l app=web,tier=frontend` reproduces the Service's exact view in one command and is the fastest way to confirm it.",
        },
      ],
    },
    {
      id: "k8s-rbac",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "RBAC & Service Accounts",
      summary:
        "RBAC answers one question: may this identity perform this verb on this resource, here? A **Role** grants verbs on resources within one namespace; a **ClusterRole** does the same cluster-wide or for cluster-scoped resources. A **RoleBinding** grants a Role or ClusterRole to subjects *within its own namespace*; a **ClusterRoleBinding** grants a ClusterRole everywhere. The combination people forget is the useful one: a RoleBinding referencing a ClusterRole gives those permissions only inside that namespace, which is how one `edit`-style ClusterRole serves fifty teams.\n\nPermissions are **purely additive — there are no deny rules.** You cannot carve an exception out of a broad grant; you grant less. That makes wildcards (`resources: [\"*\"]`, `verbs: [\"*\"]`) genuinely irreversible in effect, and it makes `kubectl auth can-i --list --as=system:serviceaccount:prod:api` the only honest way to know what an identity can do.\n\nWorkloads authenticate as **ServiceAccounts**. Every namespace has a `default` one, and unless you set `automountServiceAccountToken: false` every Pod gets a projected token mounted at a well-known path — short-lived, audience-bound and rotated by the kubelet, rather than the permanent Secret-based tokens of older clusters. Giving each workload its own ServiceAccount with a minimal Role is the whole game; leaving everything on `default` means one compromised Pod inherits whatever anyone ever granted `default`.\n\nTwo things are easy to get wrong. First, RBAC governs the *API*, not the container: a Pod with no API permissions at all can still read files, open sockets and, if it is privileged or mounts a hostPath, own the node — that is Pod Security Admission's job, not RBAC's. Second, several verbs are escalation primitives in disguise. `create pods` in a namespace effectively grants read access to every Secret in it (mount them) and often a path to the node; `escalate` and `bind` bypass the rule that you cannot grant permissions you do not hold; `impersonate` lets you act as anyone. Audit those specifically rather than counting ClusterRoleBindings.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kubernetes: Using RBAC Authorization", url: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/", kind: "docs" },
        { label: "Kubernetes: Service Accounts", url: "https://kubernetes.io/docs/concepts/security/service-accounts/", kind: "docs" },
        { label: "Kubernetes: Role Based Access Control Good Practices", url: "https://kubernetes.io/docs/concepts/security/rbac-good-practices/", kind: "article" },
      ],
      video: {
        title: "Kubernetes RBAC Explained",
        channel: "Anton Putra",
        url: "https://www.youtube.com/watch?v=iE9Qb8dHqWI",
        videoId: "iE9Qb8dHqWI",
        durationLabel: "23:17",
      },
      alternateVideos: [
        {
          title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
          videoId: "_4uQI4ihGVU",
          durationLabel: "5:53:25",
          startSeconds: 8241,
          chapterLabel: "RBAC",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-rbac-q1",
          prompt:
            "A ServiceAccount holds a ClusterRole granting `get` on Secrets cluster-wide. You add a Role in `prod` that grants `get` only on one Secret. What can it read in `prod` now?",
          options: [
            "Every Secret in `prod` — RBAC is purely additive and the narrower Role cannot subtract from the broader grant",
            "Only the one Secret named in the Role, because the more specific rule wins",
            "Nothing, because the two rules conflict and the request is denied",
            "Every Secret except the one named, since the Role overrides for that object",
          ],
          correctIndex: 0,
          explanation:
            "There are no deny rules and no specificity ordering: the union of every applicable rule is the answer. Narrowing access means removing the broad binding, not adding a narrow one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-rbac-q2",
          prompt: "What does a RoleBinding in namespace `team-a` that references a ClusterRole grant?",
          options: [
            "The ClusterRole's permissions, but only for resources in `team-a`",
            "The ClusterRole's permissions cluster-wide, since ClusterRoles are cluster-scoped",
            "Nothing; a RoleBinding may only reference a Role",
            "The permissions in `team-a` plus read access everywhere else",
          ],
          correctIndex: 0,
          explanation:
            "This is the main reuse pattern in Kubernetes: define `view`, `edit` and `admin` once as ClusterRoles, then bind them per namespace. A ClusterRoleBinding is what grants them everywhere.",
        },
        {
          id: "k8s-rbac-q3",
          prompt: "Which permissions amount to a privilege escalation in practice? (Select all that apply.)",
          options: [
            "`create` on `pods` in a namespace that holds Secrets",
            "`escalate` on `roles`",
            "`impersonate` on `users` or `groups`",
            "`get` on `configmaps` in one namespace",
            "`list` on `nodes`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Creating a Pod lets you mount any Secret in that namespace and, with the right pod spec, reach the node. `escalate` removes the guard that you cannot grant what you do not hold, and `impersonate` lets you simply become someone who can. Reading ConfigMaps and listing nodes are ordinary read grants.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-rbac-q4",
          prompt:
            "An engineer with namespace-admin rights in `team-a` tries to create a Role there granting `create` on `clusterrolebindings`. What happens?",
          options: [
            "It is rejected: you cannot grant permissions you do not hold yourself, unless you have `escalate`",
            "It succeeds, because Role creation is unrestricted inside your own namespace",
            "It succeeds but the rule is silently dropped from the stored object",
            "It succeeds and applies only to bindings created in `team-a`",
          ],
          correctIndex: 0,
          explanation:
            "Privilege-escalation prevention is built into RBAC's own admission checks. Without it, any namespace admin could write themselves a cluster-admin Role, which would make namespace delegation meaningless.",
        },
        {
          id: "k8s-rbac-q5",
          prompt: "How do you check what a workload's identity can actually do, rather than reading manifests?",
          options: [
            "`kubectl auth can-i --list --as=system:serviceaccount:<ns>:<name> -n <ns>`",
            "`kubectl describe serviceaccount <name> -n <ns>`",
            "`kubectl get rolebindings -A | grep <name>`",
            "`kubectl get clusterrole <name> -o yaml`",
          ],
          correctIndex: 0,
          explanation:
            "Only the authorizer can sum up every Role, ClusterRole and binding that applies, including group memberships and aggregated roles. Grepping bindings misses aggregation and indirect grants.",
        },
        {
          id: "k8s-rbac-q6",
          prompt: "What does a Pod get by default if you do not specify a `serviceAccountName`?",
          options: [
            "The namespace's `default` ServiceAccount, with a projected, short-lived token mounted unless `automountServiceAccountToken: false` is set",
            "No identity at all; API calls from the Pod are anonymous",
            "The identity of the user who created the Deployment",
            "A cluster-admin token, restricted by the node's own credentials",
          ],
          correctIndex: 0,
          explanation:
            "Modern clusters project bound, audience-scoped, auto-rotating tokens rather than mounting a long-lived Secret. The risk is not the token itself but everything that has accumulated on `default` over the years.",
        },
        {
          id: "k8s-rbac-q7",
          prompt: "Which rule grants the ability to read a Pod's logs?",
          options: [
            "`resources: [\"pods/log\"], verbs: [\"get\"]` — logs are a subresource with their own permission",
            "`resources: [\"pods\"], verbs: [\"get\"]` — reading a Pod includes its logs",
            "`resources: [\"logs\"], verbs: [\"list\"]`",
            "`resources: [\"pods\"], verbs: [\"watch\"]`",
          ],
          correctIndex: 0,
          explanation:
            "Subresources are addressed as `resource/subresource`, which is exactly why `pods/exec` and `pods/portforward` can be withheld from people who can otherwise read Pods — a deliberate and important separation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-rbac-q8",
          prompt: "What problem do aggregated ClusterRoles solve?",
          options: [
            "A ClusterRole can collect rules from every ClusterRole matching a label selector, so adding a CRD's permissions extends `view`/`edit`/`admin` without editing them",
            "They merge duplicate RoleBindings into one object to reduce API load",
            "They let a ClusterRole inherit from a Role in a specific namespace",
            "They cache authorization decisions across the control plane",
          ],
          correctIndex: 0,
          explanation:
            "An operator ships a small ClusterRole labelled for aggregation, and the built-in roles pick it up. Writing `rules` directly on an aggregated ClusterRole does not work — the controller keeps overwriting them.",
        },
        {
          id: "k8s-rbac-q9",
          prompt: "A container is compromised. Its ServiceAccount has no API permissions at all. What does RBAC guarantee about the blast radius?",
          options: [
            "Only that it cannot act through the Kubernetes API; it can still use the network, read its own filesystem and mounted Secrets, and attack the node if the Pod is privileged",
            "That it cannot reach any other Pod on the network",
            "That it cannot read the Secrets already mounted into it",
            "That it cannot escape the container under any configuration",
          ],
          correctIndex: 0,
          explanation:
            "RBAC is API authorization and nothing more. Containment of the workload itself is Pod Security Admission, seccomp/AppArmor, dropped capabilities, a read-only root filesystem and NetworkPolicies.",
        },
        {
          id: "k8s-rbac-q10",
          prompt: "A CI pipeline needs to deploy to `staging` only. Which grant follows least privilege?",
          options: [
            "A dedicated ServiceAccount in `staging`, bound with a RoleBinding to a Role listing only the verbs and resources it deploys",
            "A ClusterRoleBinding to `cluster-admin`, with the pipeline restricted to `staging` by convention",
            "A ClusterRoleBinding to `edit`, so it can also create namespaces when needed",
            "Reuse of the `default` ServiceAccount in `staging` with `edit` bound cluster-wide",
          ],
          correctIndex: 0,
          explanation:
            "Scope the identity, the namespace and the verb list together. Anything relying on convention rather than on the binding is one misconfigured pipeline variable from touching production.",
        },
        {
          id: "k8s-rbac-q11",
          prompt: "Why is `automountServiceAccountToken: false` worth setting on workloads that never call the API?",
          options: [
            "It removes a credential from the container filesystem entirely, so an application vulnerability cannot leak or use it",
            "It reduces the Pod's memory footprint measurably",
            "It is required before a Pod may use a NetworkPolicy",
            "It prevents the Pod from being scheduled on control-plane nodes",
          ],
          correctIndex: 0,
          explanation:
            "Most application Pods never talk to the API server, so the token is pure attack surface — a target for SSRF and path-traversal bugs. It can be disabled on the ServiceAccount or per Pod.",
        },
      ],
    },
    {
      id: "k8s-scheduling",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "The Scheduler: Taints, Tolerations & Affinity",
      summary:
        "The scheduler runs a two-phase cycle per Pod: **filter** nodes that cannot host it (insufficient allocatable resources, unmatched node selectors, untolerated taints, unavailable volumes) and then **score** the survivors to pick one. If filtering leaves nothing, the Pod stays `Pending`, and the event on it names each rule that rejected each node — the single most informative line in Kubernetes troubleshooting.\n\nThe controls come in two directions, and mixing them up is the classic mistake. **Node affinity** and `nodeSelector` are *Pod-side attraction*: the Pod asks for nodes with certain labels, either `requiredDuringSchedulingIgnoredDuringExecution` (a hard filter) or `preferred...` (a scoring weight). **Taints** are *node-side repulsion*: a taint keeps Pods off unless they carry a matching toleration. A toleration does not attract — it only removes an objection. To dedicate GPU nodes to GPU work you need both: a taint so ordinary Pods stay away, and affinity or a selector so GPU Pods actually go there.\n\nTaint effects differ in severity. `NoSchedule` blocks new Pods, `PreferNoSchedule` is a soft version, and `NoExecute` also evicts Pods already running that do not tolerate it. Kubernetes uses this itself: when a node goes unreachable, the node controller applies `node.kubernetes.io/unreachable:NoExecute`, and the default toleration added to every Pod has `tolerationSeconds: 300`. That five-minute default is why Pods on a dead node take five minutes to be rescheduled, and it is tunable per workload.\n\n**Pod affinity and anti-affinity** schedule relative to other Pods within a `topologyKey` — \"not two of these on the same node\", \"near the cache\". They are powerful and expensive: evaluation is roughly quadratic in Pod count, and `requiredDuringScheduling` anti-affinity with `topologyKey: kubernetes.io/hostname` caps your replicas at the node count, so the moment you scale past it the extras sit `Pending` forever. **Topology spread constraints** express the same intent with `maxSkew`, scale far better, and let you choose between `DoNotSchedule` and `ScheduleAnyway` — prefer them for spreading, and keep anti-affinity for genuine hard exclusions.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kubernetes: Kubernetes Scheduler", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/", kind: "docs" },
        { label: "Kubernetes: Assigning Pods to Nodes", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/", kind: "docs" },
        { label: "Kubernetes: Taints and Tolerations", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/", kind: "docs" },
        { label: "Kubernetes: Pod Topology Spread Constraints", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/", kind: "docs" },
      ],
      video: {
        title: "Kubernetes Node Selector vs Node Affinity vs Pod Affinity vs Tains & Tolerations",
        channel: "Anton Putra",
        url: "https://www.youtube.com/watch?v=rX4v_L0k4Hc",
        videoId: "rX4v_L0k4Hc",
        durationLabel: "11:17",
      },
      alternateVideos: [
        {
          title: "Learn Kubernetes in 6 Hours – Full Course with Real-World Project",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=_4uQI4ihGVU",
          videoId: "_4uQI4ihGVU",
          durationLabel: "5:53:25",
          startSeconds: 10942,
          chapterLabel: "Scheduler",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-scheduling-q1",
          prompt:
            "You taint your GPU nodes with `gpu=true:NoSchedule` and add the matching toleration to the GPU workload. The GPU Pods land on ordinary CPU nodes instead. Why?",
          options: [
            "A toleration only removes an objection; it does not attract. You also need `nodeSelector` or node affinity on a GPU node label",
            "The taint's effect should be `NoExecute` for the toleration to take effect at scheduling time",
            "Tolerations are ignored unless the taint value matches the Pod's namespace",
            "The scheduler prefers tainted nodes last, so it fills untainted ones first by design",
          ],
          correctIndex: 0,
          explanation:
            "Repulsion and attraction are separate mechanisms. Dedicating hardware always takes a pair: taint the nodes so nothing else drifts in, and select or require the label so the intended workload goes there.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-scheduling-q2",
          prompt: "What is the difference between the three taint effects?",
          options: [
            "`NoSchedule` blocks new Pods, `PreferNoSchedule` discourages them during scoring, and `NoExecute` also evicts running Pods that do not tolerate it",
            "`NoSchedule` and `NoExecute` are equivalent; `PreferNoSchedule` applies only to DaemonSets",
            "`NoExecute` blocks new Pods and `NoSchedule` evicts existing ones",
            "All three block scheduling; they differ only in the events they emit",
          ],
          correctIndex: 0,
          explanation:
            "Only `NoExecute` acts on Pods that are already running, which is what makes it suitable for node-controller signals like `unreachable` and for draining a class of workload off a node.",
        },
        {
          id: "k8s-scheduling-q3",
          prompt:
            "A node loses network connectivity. Its Pods are not recreated elsewhere for about five minutes. Why, and how would you change it for one latency-critical workload?",
          options: [
            "The node controller applies `node.kubernetes.io/unreachable:NoExecute` and every Pod has a default toleration with `tolerationSeconds: 300`; set a shorter `tolerationSeconds` on that workload",
            "The scheduler's resync period is five minutes and cannot be changed per workload",
            "The kubelet's lease must expire twice before Pods are evicted; shorten the node lease duration",
            "It is the Deployment's `progressDeadlineSeconds`; lower it on that workload",
          ],
          correctIndex: 0,
          explanation:
            "The default trades failover speed for stability, so a brief network blip does not stampede every Pod in the cluster. Lowering `tolerationSeconds` speeds up failover for one workload and accepts more churn for it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-scheduling-q4",
          prompt:
            "A Deployment has 10 replicas and required pod anti-affinity with `topologyKey: kubernetes.io/hostname`. The cluster has 6 nodes. What happens?",
          options: [
            "Six Pods schedule and four stay `Pending` indefinitely, because the hard constraint permits at most one per node",
            "All ten schedule; anti-affinity is a preference the scheduler relaxes under pressure",
            "The Deployment is rejected at admission for an unsatisfiable constraint",
            "The cluster autoscaler is required to act, and without it Pods are placed two per node",
          ],
          correctIndex: 0,
          explanation:
            "`requiredDuringScheduling` is a hard filter with no fallback. Topology spread constraints with `maxSkew: 1` and `whenUnsatisfiable: ScheduleAnyway` express \"spread out, but do not block the rollout\", which is usually the real intent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-scheduling-q5",
          prompt: "Which statements about the scheduling cycle are true? (Select all that apply.)",
          options: [
            "Filtering discards nodes that cannot run the Pod, then scoring ranks the rest",
            "A Pod that passes no filter stays `Pending`, with an event naming why each node was rejected",
            "Filtering compares the Pod's requests against each node's allocatable capacity, not its current usage",
            "The scheduler reschedules running Pods when a better node appears",
            "Scoring guarantees the Pod lands on the least loaded node by actual CPU usage",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Scheduling is a one-shot decision per Pod: nothing moves a running Pod because the fit improved — that is what the Descheduler project exists for. Scoring uses requests and plugin weights, not live utilisation.",
        },
        {
          id: "k8s-scheduling-q6",
          prompt: "What does `topologyKey` mean in a pod anti-affinity rule?",
          options: [
            "The node label whose value defines the domain within which the rule applies — `kubernetes.io/hostname` for per-node, `topology.kubernetes.io/zone` for per-zone",
            "The label on the Pod being scheduled that the rule matches against",
            "The maximum number of Pods allowed in each failure domain",
            "The name of the scheduler plugin that evaluates the rule",
          ],
          correctIndex: 0,
          explanation:
            "Nodes sharing a value for that label form one domain. Choosing `zone` instead of `hostname` is the difference between \"never two in a zone\" and \"never two on a machine\", and it changes how many replicas can ever be placed.",
        },
        {
          id: "k8s-scheduling-q7",
          prompt: "How do required and preferred node affinity differ once a Pod is already running?",
          options: [
            "Neither affects a running Pod — both are `IgnoredDuringExecution`, so a node label change does not move anything",
            "Required affinity evicts Pods whose node stops matching; preferred does not",
            "Both re-evaluate every scheduling cycle and may trigger a move",
            "Preferred affinity re-evaluates on node label changes; required is evaluated once",
          ],
          correctIndex: 0,
          explanation:
            "The long field names are documentation: only `...IgnoredDuringExecution` variants exist today. Removing a node label leaves existing Pods exactly where they are, and only new scheduling decisions see the change.",
        },
        {
          id: "k8s-scheduling-q8",
          prompt:
            "A high-priority Pod cannot be scheduled because every node is full of lower-priority Pods. With a PriorityClass and default settings, what does the scheduler do?",
          options: [
            "It preempts — evicts — enough lower-priority Pods on a node to make room, and their controllers reschedule them elsewhere",
            "It waits until capacity frees up naturally; preemption must be triggered manually",
            "It schedules the Pod anyway, overcommitting the node",
            "It evicts Pods across the whole cluster in priority order until the Pod fits",
          ],
          correctIndex: 0,
          explanation:
            "Preemption is targeted at one candidate node, uses the eviction path so PodDisruptionBudgets are considered on a best-effort basis, and can be disabled per class with `preemptionPolicy: Never` — which gives scheduling priority without displacing anyone.",
        },
        {
          id: "k8s-scheduling-q9",
          prompt: "Which is the better tool for \"spread my replicas evenly across three zones, but never block a rollout\"?",
          options: [
            "A topology spread constraint with `topologyKey: topology.kubernetes.io/zone`, `maxSkew: 1` and `whenUnsatisfiable: ScheduleAnyway`",
            "Required pod anti-affinity with `topologyKey: topology.kubernetes.io/zone`",
            "A `nodeSelector` listing all three zone labels",
            "Three separate Deployments, one pinned per zone",
          ],
          correctIndex: 0,
          explanation:
            "`maxSkew` expresses evenness directly rather than as a blanket exclusion, and `ScheduleAnyway` degrades to best-effort when a zone is unavailable instead of leaving Pods `Pending`. Three Deployments make every rollout and scale operation three operations.",
        },
        {
          id: "k8s-scheduling-q10",
          prompt: "A Pod is `Pending`. Which command gives the most direct explanation?",
          options: [
            "`kubectl describe pod <name>` and read the `FailedScheduling` event, which lists the count of nodes rejected by each predicate",
            "`kubectl logs <name>`, since the scheduler writes its reasoning to the Pod's log",
            "`kubectl get nodes -o wide` and compare capacity by hand",
            "`kubectl top nodes` to find which node has spare usage headroom",
          ],
          correctIndex: 0,
          explanation:
            "The event reads like `0/12 nodes are available: 6 Insufficient cpu, 4 node(s) had untolerated taint..., 2 node(s) didn't match Pod's node affinity` — an itemised answer. A Pending Pod has no containers and therefore no logs.",
        },
        {
          id: "k8s-scheduling-q11",
          prompt: "Why is `requiredDuringScheduling` pod anti-affinity considered expensive in large clusters?",
          options: [
            "Each candidate node must be checked against every existing Pod matching the selector, so cost grows roughly with Pod count times node count",
            "It forces the scheduler to fall back to a single-threaded scheduling cycle",
            "It requires an extra API call per node to read labels",
            "It disables the scheduler's node-score cache for the whole cluster",
          ],
          correctIndex: 0,
          explanation:
            "The Kubernetes docs warn against it in clusters of several hundred nodes for exactly this reason. Topology spread constraints compute a skew per domain instead, which is dramatically cheaper.",
        },
      ],
    },
    {
      id: "k8s-autoscaling",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Autoscaling: HPA, VPA & the Cluster Autoscaler",
      summary:
        "Three autoscalers operate on three different axes, and using them together requires knowing which axis each one owns. The **HorizontalPodAutoscaler** (`autoscaling/v2`) changes `replicas` on a workload from a metric. The **VerticalPodAutoscaler** changes a Pod's requests and limits. The **Cluster Autoscaler** (or Karpenter) changes the number of nodes. They form a chain: the HPA adds Pods, the extra Pods do not fit and go `Pending`, and `Pending` Pods are the Cluster Autoscaler's trigger to add a node.\n\nThe HPA's arithmetic is worth memorising, because it explains most surprises: `desired = ceil(current × currentMetric / targetMetric)`, evaluated roughly every 15 seconds, with a ~10% tolerance band so small deviations do nothing. Critically, `averageUtilization` for CPU is a percentage **of the Pod's CPU request**, not of the node or of the limit. A Pod requesting `100m` and using `180m` is at 180% — so a target of 70% with a badly sized request makes the HPA thrash or never fire at all. Scaling up is immediate; scaling down waits out a stabilisation window that defaults to 300 seconds, so the autoscaler keeps capacity through a dip rather than oscillating.\n\nThe VPA solves the other half — nobody sizes requests well by hand — but historically had to evict and recreate a Pod to change them, which made it awkward for anything singleton. In-place Pod resize being stable since Kubernetes 1.35 removes much of that objection. What has not changed is the rule that VPA and HPA must not both drive the same metric: one raises the request while the other divides by it, and they chase each other.\n\nCluster autoscaling adds its own constraints, and they are all about what makes a node *un*removable. A node holding a Pod with no controller, a Pod using local storage, or a Pod whose PodDisruptionBudget would be violated will not be scaled down — which is how a single bare debug Pod keeps an expensive node alive for a month. For queue-driven work, CPU is the wrong signal entirely: scale on queue depth with KEDA or a custom metric, because a worker blocked on I/O looks idle exactly when you need more of it.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Kubernetes: Horizontal Pod Autoscaling", url: "https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/", kind: "docs" },
        { label: "Kubernetes: Autoscaling Workloads", url: "https://kubernetes.io/docs/concepts/workloads/autoscaling/", kind: "docs" },
        { label: "kubernetes/autoscaler: Cluster Autoscaler", url: "https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler", kind: "repo" },
        { label: "kubernetes/autoscaler: Vertical Pod Autoscaler", url: "https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler", kind: "repo" },
      ],
      video: {
        title: "Kubernetes Autoscaling: HPA vs. VPA vs. Keda vs. CA vs. Karpenter vs. Fargate",
        channel: "Anton Putra",
        url: "https://www.youtube.com/watch?v=hsJ2qtwoWZw",
        videoId: "hsJ2qtwoWZw",
        durationLabel: "14:37",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-autoscaling-q1",
          prompt:
            "An HPA targets `averageUtilization: 70` on CPU. Pods request `100m` and each is steadily using `180m` of CPU on nodes that are only 20% busy. What does the HPA compute?",
          options: [
            "180% utilisation, because CPU utilisation is measured against the Pod's *request* — so it scales up aggressively",
            "About 20%, matching node utilisation, so it does nothing",
            "180% of the limit, so it scales only if a limit is set",
            "It cannot compute a value without a CPU limit and reports `unknown`",
          ],
          correctIndex: 0,
          explanation:
            "The request is the denominator. This is why an undersized request makes an HPA scale to its maximum at low real load, and an oversized one prevents it from ever firing — the request is effectively an HPA tuning parameter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-autoscaling-q2",
          prompt: "An HPA manages a Deployment, and your GitOps pipeline also applies a manifest containing `replicas: 3`. What happens?",
          options: [
            "Each sync resets the replica count to 3 and the HPA scales it back up, producing a visible sawtooth",
            "The HPA takes ownership of the field and the manifest value is ignored after the first reconcile",
            "The API server rejects the apply because the field is managed by the HPA",
            "The HPA is disabled automatically when a manifest sets `replicas` explicitly",
          ],
          correctIndex: 0,
          explanation:
            "Two controllers writing one field is always a fight. Remove `replicas` from the manifest (Argo CD's `ignoreDifferences`, Flux's equivalent, or just omitting it), so the HPA owns it outright.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-autoscaling-q3",
          prompt: "Which statements about the HPA's behaviour are true? (Select all that apply.)",
          options: [
            "Scale-down is damped by a stabilisation window that defaults to 300 seconds; scale-up has none by default",
            "A small deviation inside the tolerance band (about 10%) produces no change",
            "Pods that are not yet ready are excluded from the metric average",
            "The HPA scales the ReplicaSet directly, bypassing the Deployment",
            "It requires CPU limits to be set on every container",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The asymmetry is deliberate: react fast to load, retreat slowly. The HPA scales whatever implements the `scale` subresource — the Deployment — and needs *requests*, not limits, since requests are its denominator.",
        },
        {
          id: "k8s-autoscaling-q4",
          prompt: "An HPA reports `unknown` for its CPU metric and never scales. What is the usual cause?",
          options: [
            "metrics-server is not installed or not serving, so the resource metrics API has no data",
            "The Deployment has no `maxReplicas` set",
            "Prometheus is not scraping the Pods",
            "The Pods are in a namespace with a ResourceQuota",
          ],
          correctIndex: 0,
          explanation:
            "Resource metrics come from the `metrics.k8s.io` API that metrics-server provides; without it `kubectl top` fails too, which is the quickest confirmation. Prometheus only matters for custom or external metrics via an adapter.",
        },
        {
          id: "k8s-autoscaling-q5",
          prompt: "Why should you avoid running an HPA and a VPA on the same workload and the same resource?",
          options: [
            "The VPA changes the CPU request that the HPA divides by, so each one's action changes the other's input and they oscillate",
            "Only one autoscaler may target a workload; the API server rejects the second",
            "The VPA deletes the HPA object when it takes ownership of the workload",
            "The HPA overrides the VPA's recommendations, making the VPA useless but harmless",
          ],
          correctIndex: 0,
          explanation:
            "They share a denominator. The supported combination is VPA on memory with HPA on CPU, or VPA in recommendation-only mode so a human applies the sizing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-autoscaling-q6",
          prompt: "What triggers the Cluster Autoscaler to add a node?",
          options: [
            "Pods that are `Pending` because no existing node can satisfy their requests",
            "Average node CPU utilisation crossing a configured threshold",
            "An HPA reaching its `maxReplicas`",
            "Memory pressure conditions reported by the kubelet",
          ],
          correctIndex: 0,
          explanation:
            "It reacts to unschedulable Pods, which is why the whole chain depends on honest requests: Pods that request too little never go Pending, so nodes are never added even as they saturate.",
        },
        {
          id: "k8s-autoscaling-q7",
          prompt: "A node sits at 8% utilisation for days and the Cluster Autoscaler never removes it. Which explanations are plausible? (Select all that apply.)",
          options: [
            "It hosts a Pod with no owning controller, such as one created by `kubectl run`",
            "A Pod on it uses local storage that cannot be moved",
            "Evicting one of its Pods would violate a PodDisruptionBudget",
            "It runs a DaemonSet Pod, which always blocks scale-down",
            "Its CPU requests sum to less than the scale-down threshold, which blocks removal",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Scale-down requires every Pod on the node to be safely relocatable. DaemonSet Pods are explicitly ignored — they are expected to disappear with the node — and low requests are the trigger for scale-down, not a blocker.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-autoscaling-q8",
          prompt: "A queue worker spends most of its time blocked on I/O. Why is CPU a poor autoscaling signal for it?",
          options: [
            "CPU stays low precisely when the backlog is growing, so the HPA scales down exactly when more workers are needed",
            "CPU metrics are not collected for Pods without a Service",
            "The HPA cannot scale workloads that have no readiness probe",
            "Blocked processes report negative CPU deltas, which the HPA discards",
          ],
          correctIndex: 0,
          explanation:
            "Scale on the thing that represents demand — queue depth or messages per second — using KEDA or a custom-metrics adapter. KEDA also scales to zero, which CPU-based HPAs cannot do.",
        },
        {
          id: "k8s-autoscaling-q9",
          prompt: "What did in-place Pod resize (stable in Kubernetes 1.35) change for vertical autoscaling?",
          options: [
            "Requests and limits can be updated on a running Pod, so applying a VPA recommendation no longer always means evicting and recreating it",
            "The VPA can now scale replica counts as well as resources",
            "Pods automatically grow their limits when they approach them",
            "The scheduler now moves Pods to larger nodes when their usage grows",
          ],
          correctIndex: 0,
          explanation:
            "Disruption was the main practical objection to the VPA, especially for singletons and stateful Pods. Memory decreases remain the awkward case, since memory already in use cannot simply be taken back.",
        },
        {
          id: "k8s-autoscaling-q10",
          prompt: "A traffic spike arrives. In what order do the autoscalers respond, and what is the slow step?",
          options: [
            "The HPA adds Pods within seconds; any that do not fit go `Pending`; the Cluster Autoscaler then provisions a node, which takes minutes",
            "The Cluster Autoscaler adds nodes first, then the HPA fills them",
            "The VPA grows the existing Pods first, and the HPA only acts if that is insufficient",
            "All three act simultaneously and independently of each other",
          ],
          correctIndex: 0,
          explanation:
            "Node provisioning — boot, join, image pull — is the multi-minute step, which is why bursty workloads keep headroom or run low-priority placeholder Pods that real work can preempt.",
        },
      ],
    },
    {
      id: "k8s-helm-kustomize",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Helm and Kustomize",
      summary:
        "Raw manifests stop working the moment you need the same application in three environments. The two mainstream answers take opposite approaches. **Helm** templates: a chart is Go templates over YAML, rendered with a `values.yaml` you override per environment, packaged and versioned so other people can install it. **Kustomize** patches: a plain-YAML base is overlaid with strategic-merge or JSON patches per environment, with no templating language at all, and it is built into `kubectl` (`kubectl apply -k`).\n\nHelm's real differentiator is not templating but **release lifecycle**. It records each release's rendered state in the cluster, so `helm upgrade`, `helm rollback`, `helm history` and `helm uninstall` operate on a known previous state. That is what makes it the distribution format for third-party software — you will install Prometheus, cert-manager and ingress controllers as charts whatever you use for your own code. The cost is that Go templates over a whitespace-sensitive format is genuinely unpleasant at scale: quoting, indentation helpers, deeply nested `values.yaml` files nobody can fully enumerate, and conditionals that make the rendered output hard to predict without running `helm template`.\n\nKustomize's differentiator is that what you read is what you get: every file is a valid manifest, diffs are meaningful, and `kubectl kustomize` shows the exact output. Its `configMapGenerator` and `secretGenerator` append a content hash to the object's name and rewrite every reference, which means a config change automatically becomes a new object and therefore a new Pod template and therefore a rollout — the hand-rolled annotation trick, built in. The cost is no packaging, no distribution, no release history, and patches into deeply nested lists that are fiddly and position-sensitive.\n\nIn practice they compose rather than compete. A common arrangement is Helm for third-party software and Kustomize for your own; both Argo CD and Flux render either, and Helm supports a post-renderer so a Kustomize patch can fix what a chart does not expose. One sharp edge to remember either way: files in a chart's `crds/` directory are installed on first install but **not** upgraded by `helm upgrade`, which is why CRD version bumps need a deliberate step.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Helm: Documentation", url: "https://helm.sh/docs/", kind: "docs" },
        { label: "Helm: Charts", url: "https://helm.sh/docs/topics/charts/", kind: "docs" },
        { label: "Kubernetes: Declarative Management using Kustomize", url: "https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/", kind: "docs" },
        { label: "Kustomize: Reference", url: "https://kubectl.docs.kubernetes.io/references/kustomize/", kind: "docs" },
      ],
      video: {
        title: "Helm vs. Kustomize: When, Why, and How?",
        channel: "Ahmed Elfakharany",
        url: "https://www.youtube.com/watch?v=s1-dnYet5f8",
        videoId: "s1-dnYet5f8",
        durationLabel: "15:42",
      },
      alternateVideos: [
        {
          title: "Complete Kubernetes Course - From BEGINNER to PRO",
          channel: "DevOps Directive",
          url: "https://www.youtube.com/watch?v=2T86xAtR6Fo",
          videoId: "2T86xAtR6Fo",
          durationLabel: "6:14:41",
          startSeconds: 17184,
          chapterLabel: "Deploying to Multiple Environments (Kustomize, Helm, and Kluctl)",
        },
        {
          title: "What is Helm in Kubernetes? Helm and Helm Charts explained  | Kubernetes Tutorial 23",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=-ykwb1d0DXU",
          videoId: "-ykwb1d0DXU",
          durationLabel: "14:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-helm-kustomize-q1",
          prompt: "What does Helm provide that Kustomize does not?",
          options: [
            "A release lifecycle — versioned installs with `upgrade`, `rollback` and `history` stored in the cluster — plus a packaging and distribution format",
            "The ability to change values per environment",
            "Validation of manifests against the cluster's API schemas",
            "Support for CustomResourceDefinitions",
          ],
          correctIndex: 0,
          explanation:
            "Both handle per-environment variation; only Helm remembers what it deployed, which is what makes `helm rollback` and installing someone else's software from a repository possible.",
        },
        {
          id: "k8s-helm-kustomize-q2",
          prompt: "What is the practical effect of Kustomize's `configMapGenerator` appending a content hash to the ConfigMap's name?",
          options: [
            "A config change produces a new object name, which changes the Pod template's reference and therefore triggers a rollout automatically",
            "It prevents two teams from creating ConfigMaps with the same name",
            "It compresses the ConfigMap so it fits within the 1 MiB object limit",
            "It marks the ConfigMap immutable so the kubelet stops watching it",
          ],
          correctIndex: 0,
          explanation:
            "It is the built-in version of stamping a config hash on the Pod template. Without it, editing a ConfigMap changes nothing in running Pods — the failure mode this mechanism exists to prevent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-helm-kustomize-q3",
          prompt: "You run `helm upgrade` on a chart whose new version ships updated CRDs in its `crds/` directory. What happens to the CRDs?",
          options: [
            "Nothing: Helm installs files in `crds/` on first install only and never upgrades or deletes them; you apply the new CRDs yourself",
            "They are upgraded along with the rest of the chart's templates",
            "They are deleted and recreated, which also deletes the custom resources using them",
            "The upgrade is rejected until the CRDs are removed manually",
          ],
          correctIndex: 0,
          explanation:
            "Helm deliberately refuses to touch CRDs on upgrade, because a CRD change can destroy data across the cluster. The consequence is a silent mismatch between a new controller and old CRDs — a surprisingly common source of broken operator upgrades.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-helm-kustomize-q4",
          prompt: "Which are genuine drawbacks of Helm's templating approach? (Select all that apply.)",
          options: [
            "Go templates over whitespace-sensitive YAML make quoting and indentation error-prone",
            "The rendered output is hard to predict without running `helm template`",
            "A chart's full configuration surface lives in `values.yaml` and can grow beyond what anyone can enumerate",
            "Charts cannot express environment-specific differences",
            "Helm cannot install third-party software",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The complaints are about templating text rather than editing structure. Per-environment values and third-party distribution are exactly what Helm is good at.",
        },
        {
          id: "k8s-helm-kustomize-q5",
          prompt: "In a Kustomize layout, what is the relationship between `base/` and `overlays/prod/`?",
          options: [
            "The overlay references the base as a resource and applies patches, name prefixes and image overrides on top of it",
            "The overlay is a full copy of the base with edits applied by hand",
            "The base inherits defaults from the overlay at build time",
            "They are rendered independently and the results are concatenated",
          ],
          correctIndex: 0,
          explanation:
            "Composition over copying is the whole idea: the base holds what every environment shares, and each overlay is a small, readable diff. Copying it defeats the purpose and guarantees drift.",
        },
        {
          id: "k8s-helm-kustomize-q6",
          prompt: "How do you review exactly what will be applied before it reaches the cluster?",
          options: [
            "`helm template` for a chart, `kubectl kustomize` (or `kubectl apply -k --dry-run=server`) for an overlay",
            "`helm install --debug` and `kubectl apply -k --force`, which print the result after applying",
            "`helm lint` and `kustomize validate`, which both render and check the output",
            "There is no way to see the final YAML; you diff after applying",
          ],
          correctIndex: 0,
          explanation:
            "Rendering locally is what makes template-heavy tooling reviewable at all. `--dry-run=server` goes further by running the output through admission, catching webhook and quota rejections before they matter.",
        },
        {
          id: "k8s-helm-kustomize-q7",
          prompt: "A third-party chart hard-codes a setting with no value to override it. What is the idiomatic fix?",
          options: [
            "Use a post-renderer, such as Kustomize, to patch the chart's rendered output without forking it",
            "Fork the chart and maintain your own copy of every template",
            "Edit the running objects with `kubectl edit` after each install",
            "Set the value as an annotation, which Helm merges into templates automatically",
          ],
          correctIndex: 0,
          explanation:
            "Post-rendering keeps you on the upstream chart, so upgrades stay cheap, while patching the one field you need. `kubectl edit` is worse than either: the next `helm upgrade` reverts it.",
        },
        {
          id: "k8s-helm-kustomize-q8",
          prompt: "Why is `helm rollback` able to go back to a previous release, and what is the caveat?",
          options: [
            "Helm stores each release's rendered manifests in the cluster; the caveat is that it restores objects, not data — a migration or a deleted PVC does not roll back",
            "It re-downloads the previous chart version from the repository, so it fails if the version has been removed",
            "It relies on the Deployment's own revision history, so it only works for Deployments",
            "It restores from an etcd snapshot, so it needs cluster-admin rights",
          ],
          correctIndex: 0,
          explanation:
            "Release state is Helm's own record, independent of the chart repository. What it cannot undo is anything outside the API objects — which is why schema migrations need their own forward-compatible plan.",
        },
        {
          id: "k8s-helm-kustomize-q9",
          prompt: "A team runs Argo CD and asks whether adopting Kustomize means giving up Helm charts. What is accurate?",
          options: [
            "No — Argo CD and Flux both render Helm charts and Kustomize overlays, and a common split is Helm for third-party software and Kustomize for in-house manifests",
            "Yes; a GitOps controller can only reconcile one rendering tool per cluster",
            "Yes, unless every chart is converted to plain manifests first",
            "No, because Kustomize can install charts directly from a Helm repository with full release history",
          ],
          correctIndex: 0,
          explanation:
            "The tools are complementary and GitOps controllers treat both as renderers. Kustomize does have a `helmCharts` inflation feature, but it renders the chart — it does not give you Helm's release history.",
        },
        {
          id: "k8s-helm-kustomize-q10",
          prompt: "Which task is genuinely awkward in Kustomize and easier in Helm?",
          options: [
            "Generating a variable number of similar objects, or including a resource only when a flag is set — Kustomize has no loops or conditionals",
            "Changing the image tag per environment",
            "Adding a common label to every object",
            "Setting a namespace for all resources in an overlay",
          ],
          correctIndex: 0,
          explanation:
            "Kustomize deliberately has no logic: patches transform structure, they do not generate it. The other three are first-class `kustomization.yaml` fields (`images`, `commonLabels`/`labels`, `namespace`).",
        },
      ],
    },
    {
      id: "k8s-network-policies",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Network Policies",
      summary:
        "By default every Pod in a cluster can reach every other Pod, in any namespace. A NetworkPolicy is how you take that away selectively — a namespaced, label-selected firewall at layer 3/4. The mental model has one twist worth internalising: a Pod is *non-isolated* until some policy selects it. The moment any policy selects a Pod and lists `Ingress` in its `policyTypes`, that Pod becomes isolated for ingress and only the traffic explicitly allowed by policies selecting it gets through. Egress is decided independently the same way.\n\nWithin that model, policies are **additive with no deny rules**: the result is the union of every allowance from every policy that selects the Pod. There is no precedence, no ordering and no way to carve an exception out of a broader allow — you express restrictions by granting less. The default-deny idiom is a policy with `podSelector: {}` (every Pod in the namespace) and an empty rule list for the direction you want closed.\n\nEnforcement is not in Kubernetes. The NetworkPolicy API is implemented by the CNI plugin, so on a cluster running a plugin without policy support the object is accepted, shows up in `kubectl get netpol`, and does nothing whatsoever. Verifying that your CNI enforces policy is step zero of any zero-trust plan, and testing an actual denial from a Pod is the only trustworthy confirmation.\n\nTwo details cause most real outages. First, the selector shape: within a single `from` entry, `namespaceSelector` and `podSelector` are ANDed (\"Pods with this label, in namespaces with that label\"), whereas listing them as two separate entries is an OR — the same YAML nesting difference produces wildly different policies. Second, once you apply a default-deny **egress** policy, you have also blocked DNS, because CoreDNS is just another Pod. Every symptom becomes \"name resolution failed\" until you explicitly allow UDP and TCP port 53 to the DNS Pods. Finally, remember the layer: NetworkPolicy matches IPs, ports and protocols, so HTTP methods, paths and identity-based rules need a service mesh or the newer AdminNetworkPolicy work instead.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Kubernetes: Network Policies", url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/", kind: "docs" },
        { label: "Kubernetes: Declare Network Policy", url: "https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/", kind: "docs" },
        { label: "ahmetb: Kubernetes Network Policy Recipes", url: "https://github.com/ahmetb/kubernetes-network-policy-recipes", kind: "repo" },
      ],
      video: {
        title: "Day 26/40 - Kubernetes Network Policies Explained",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=eVtnevr3Rao",
        videoId: "eVtnevr3Rao",
        durationLabel: "45:47",
      },
      alternateVideos: [
        {
          title: "Kubernetes Network Policy Deep Dive",
          channel: "Kubesimplify",
          url: "https://www.youtube.com/watch?v=Fr-6oDHbobM",
          videoId: "Fr-6oDHbobM",
          durationLabel: "17:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-network-policies-q1",
          prompt:
            "You apply a carefully written default-deny NetworkPolicy. `kubectl get netpol` shows it, but every Pod can still reach every other Pod. What should you check first?",
          options: [
            "Whether the cluster's CNI plugin implements NetworkPolicy at all — the API accepts the object regardless",
            "Whether the policy is in the same namespace as the Pods it selects",
            "Whether kube-proxy is running in IPVS mode, which is required for policy enforcement",
            "Whether the Pods were restarted after the policy was applied",
          ],
          correctIndex: 0,
          explanation:
            "NetworkPolicy is an API with no built-in implementation; plugins such as Calico, Cilium and Antrea enforce it and some others do not. A silently unenforced policy is the worst outcome, so prove a denial with an actual connection test.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-network-policies-q2",
          prompt:
            "You apply a default-deny egress policy to a namespace and every application immediately fails with name-resolution errors. Why?",
          options: [
            "CoreDNS is an ordinary Pod, so denying all egress blocks DNS queries; you must explicitly allow UDP and TCP port 53 to it",
            "Denying egress disables the Pod's `/etc/resolv.conf` configuration",
            "The policy also blocks the kubelet from configuring the Pod's DNS",
            "DNS uses the host network, which NetworkPolicies cannot exempt",
          ],
          correctIndex: 0,
          explanation:
            "This is the single most common default-deny outage. Every default-deny-egress rollout needs a companion rule allowing port 53 to the `kube-system` DNS Pods before anything else will work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-network-policies-q3",
          prompt:
            "Consider these two ingress rules. What is the difference?\n\n```yaml\n# A\nfrom:\n  - namespaceSelector:\n      matchLabels: { team: web }\n    podSelector:\n      matchLabels: { app: api }\n# B\nfrom:\n  - namespaceSelector:\n      matchLabels: { team: web }\n  - podSelector:\n      matchLabels: { app: api }\n```",
          options: [
            "A allows only `app=api` Pods *in* `team=web` namespaces; B allows every Pod in `team=web` namespaces OR any `app=api` Pod in this namespace",
            "They are equivalent; YAML list nesting does not change selector semantics",
            "A is invalid, because a single `from` entry may contain only one selector",
            "B is stricter, because listing selectors separately requires both to match",
          ],
          correctIndex: 0,
          explanation:
            "Selectors inside one list entry are ANDed; separate entries are ORed. One extra dash turns a tight rule into a much broader one, and nothing in the API warns you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-network-policies-q4",
          prompt: "Which statements about NetworkPolicy semantics are true? (Select all that apply.)",
          options: [
            "A Pod is unrestricted for a direction until some policy selects it and names that direction in `policyTypes`",
            "Policies are additive: the allowed traffic is the union of all policies selecting the Pod",
            "There is no way to express a deny rule; you restrict by allowing less",
            "A later policy can override an earlier one's allowances",
            "Ingress and egress isolation for a Pod are always enabled together",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Union-of-allows with per-direction isolation is the whole model. There is no ordering or precedence, and the two directions are independent — a Pod can be isolated for ingress and wide open for egress.",
        },
        {
          id: "k8s-network-policies-q5",
          prompt: "How do you express \"no Pod in this namespace accepts any inbound connection\"?",
          options: [
            "A policy with `podSelector: {}`, `policyTypes: [Ingress]` and no `ingress` rules",
            "A policy with `podSelector: {}` and `ingress: [{}]`",
            "A policy with `policyTypes: [Ingress]` and `ingress: [{from: []}]`",
            "Delete all policies in the namespace, since the default is deny",
          ],
          correctIndex: 0,
          explanation:
            "An empty `podSelector` selects everything in the namespace, and omitting rules means nothing is allowed. `ingress: [{}]` is the opposite — an empty rule that allows *all* traffic — which is an easy and expensive typo.",
        },
        {
          id: "k8s-network-policies-q6",
          prompt: "Which requirement cannot be expressed with a standard NetworkPolicy?",
          options: [
            "Allow `GET /health` but deny `POST /admin` from the same client",
            "Allow ingress only from Pods labelled `role=frontend`",
            "Allow egress only to TCP port 5432 in another namespace",
            "Allow egress to an external CIDR while excluding a subnet inside it",
          ],
          correctIndex: 0,
          explanation:
            "NetworkPolicy operates at layer 3/4 — addresses, ports and protocols. HTTP-aware rules need a service mesh or an API gateway; `ipBlock` with `except` covers the CIDR case.",
        },
        {
          id: "k8s-network-policies-q7",
          prompt:
            "Team A's policy allows ingress from `app=frontend`. Team B adds a second policy on the same Pods allowing ingress from `app=monitoring`. What is now allowed?",
          options: [
            "Traffic from either `app=frontend` or `app=monitoring` — the allowances combine",
            "Only traffic matching both labels, since both policies apply",
            "Only Team B's rule, since the most recent policy wins",
            "Nothing, because two policies selecting the same Pods conflict",
          ],
          correctIndex: 0,
          explanation:
            "Union is the only combination rule. The operational consequence is that any team able to create policies in a namespace can widen access there, so policy creation rights are a security control in themselves.",
        },
        {
          id: "k8s-network-policies-q8",
          prompt: "How should a NetworkPolicy refer to a specific other namespace reliably?",
          options: [
            "With a `namespaceSelector` on the automatic `kubernetes.io/metadata.name` label",
            "With a `namespace` field inside the `from` entry",
            "By listing the namespace's Pod CIDR in an `ipBlock`",
            "With a `podSelector` that includes the namespace as a label prefix",
          ],
          correctIndex: 0,
          explanation:
            "There is no `namespace` field in a policy peer — only selectors — and the API server guarantees the metadata-name label exists on every namespace. Pod CIDRs are dynamic and per-node, so an `ipBlock` is the wrong tool for in-cluster traffic.",
        },
        {
          id: "k8s-network-policies-q9",
          prompt: "A service's Pods are selected by a default-deny ingress policy. Traffic still arrives through an Ingress controller. Is that a bug?",
          options: [
            "No, if a policy also allows ingress from the controller's Pods or namespace — the controller is just another client that must be permitted",
            "Yes: default-deny should block all external traffic regardless of other policies",
            "No: NetworkPolicies never apply to traffic that arrives through an Ingress",
            "Yes, unless the controller runs with `hostNetwork: true`",
          ],
          correctIndex: 0,
          explanation:
            "Everything is peer-to-peer at this layer, so the ingress controller needs an explicit allow like anyone else. Controllers running with `hostNetwork` complicate this, because the source is then a node IP rather than a Pod IP.",
        },
        {
          id: "k8s-network-policies-q10",
          prompt: "What is a sound rollout order for network policies in a busy namespace?",
          options: [
            "Add explicit allow policies for known flows first, observe with flow logs, then introduce default-deny once nothing legitimate is left unmatched",
            "Apply default-deny first so everything is safe, then add allows as complaints arrive",
            "Apply everything at once during a maintenance window to avoid a partial state",
            "Apply policies only in staging; production traffic patterns are too complex to model",
          ],
          correctIndex: 0,
          explanation:
            "Because policies are additive, allows are harmless until the deny lands — so you can stage the whole design safely and flip the switch last. Leading with default-deny discovers your dependency graph through incidents instead.",
        },
      ],
    },
    {
      id: "k8s-debugging",
      moduleId: "devops-kubernetes",
      trackId: "devops",
      title: "Debugging a Failing Pod Systematically",
      summary:
        "Most Kubernetes debugging goes wrong the same way: someone jumps straight to `kubectl logs` for a Pod whose container never started, sees nothing, and starts guessing. The system publishes its reasoning at every step, so the skill is reading the state machine in order rather than searching harder.\n\nThe sequence is always the same. **`kubectl get pod -o wide`** gives status, restart count, age and node. **`kubectl describe pod`** gives the events, the conditions, and `Last State` with a reason and exit code — the single most informative command in the toolkit. **`kubectl logs --previous`** reads the *terminated* container, which is where a crash loop's actual error lives; tailing the current one only shows a fresh start. **`kubectl get events --sort-by=.lastTimestamp`** widens to the namespace when the cause is elsewhere (quota, scheduling, volume attach). Then, and only then, `kubectl exec` into the container — or `kubectl debug pod/x --image=busybox --target=app` to attach an ephemeral container when the image is distroless and has no shell, and `kubectl debug node/x` when the question is about the node.\n\nThe status is a diagnosis, not a symptom, and each one points at a different layer. `Pending` is scheduling: read the `FailedScheduling` event. `ImagePullBackOff` is the registry: a wrong tag, a missing pull secret, a rate limit. `CreateContainerConfigError` is a missing ConfigMap or Secret key — the container never started. `CrashLoopBackOff` is your application exiting; `--previous` plus the exit code says why, and exit 137 with `Reason: OOMKilled` means the memory limit, not a bug in the shutdown path. `ContainerCreating` that persists is almost always a volume that will not attach or a CNI failure. `Terminating` that persists is a finalizer or a process ignoring SIGTERM.\n\nTwo cluster-level habits complete the picture. Events are ordinary API objects with a one-hour default retention, so they are a live debugging aid and never a post-mortem record — ship them somewhere if you want history. And `kubectl top` plus the node conditions (`Ready`, `MemoryPressure`, `DiskPressure`, `PIDPressure`) answer \"is this Pod the victim rather than the cause?\", which is the question that separates a five-minute fix from an afternoon.",
      level: "expert",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "Kubernetes: Troubleshooting Applications", url: "https://kubernetes.io/docs/tasks/debug/debug-application/", kind: "docs" },
        { label: "Kubernetes: Debug Running Pods (ephemeral containers, kubectl debug)", url: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/", kind: "docs" },
        { label: "Kubernetes: Determine the Reason for Pod Failure", url: "https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/", kind: "docs" },
        { label: "Kubernetes: kubectl Quick Reference", url: "https://kubernetes.io/docs/reference/kubectl/quick-reference/", kind: "docs" },
      ],
      video: {
        title: "Complete Kubernetes Course - From BEGINNER to PRO",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=2T86xAtR6Fo",
        videoId: "2T86xAtR6Fo",
        durationLabel: "6:14:41",
        startSeconds: 16542,
        chapterLabel: "Debugging Applications in Kubernetes",
      },
      alternateVideos: [
        {
          title: "Kubernetes Course – Certified Kubernetes Administrator Exam Preparation (2026 Update)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=l57xKN6OBhY",
          videoId: "l57xKN6OBhY",
          durationLabel: "2:06:25",
          startSeconds: 6931,
          chapterLabel: "Troubleshooting",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "k8s-debugging-q1",
          prompt:
            "`kubectl describe pod api-7f9` includes the following. What is the diagnosis?\n\n```text\nState:          Waiting\n  Reason:       CrashLoopBackOff\nLast State:     Terminated\n  Reason:       OOMKilled\n  Exit Code:    137\nRestart Count:  9\nLimits:\n  memory:       256Mi\n```",
          options: [
            "The container repeatedly exceeds its 256Mi memory limit and is killed by the kernel; raise the limit or fix the memory usage",
            "The application is exiting with an error on startup; read `kubectl logs` for the stack trace",
            "The node is out of memory and evicting the Pod; move it to a larger node",
            "The liveness probe is failing and restarting the container",
          ],
          correctIndex: 0,
          explanation:
            "`OOMKilled` with exit 137 is the cgroup limit, not the node: an eviction would show the Pod as `Failed` with reason `Evicted` instead. A probe failure shows `Reason: Error` with the probe's message in the events.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-debugging-q2",
          prompt: "A container has restarted eleven times. Which command shows the error that actually killed it?",
          options: [
            "`kubectl logs api-7f9 -c api --previous`",
            "`kubectl logs api-7f9 -f`",
            "`kubectl describe pod api-7f9 | tail -20`",
            "`kubectl get pod api-7f9 -o yaml`",
          ],
          correctIndex: 0,
          explanation:
            "`--previous` reads the terminated instance's log; the live one only shows the new attempt starting up. `describe` gives the reason and exit code but not the application's own output.",
        },
        {
          id: "k8s-debugging-q3",
          prompt: "Match each Pod status to the layer it points at.",
          options: [
            "`Pending` → scheduling; `ImagePullBackOff` → registry or image reference; `CreateContainerConfigError` → missing ConfigMap/Secret key; `CrashLoopBackOff` → the application itself",
            "`Pending` → the application; `ImagePullBackOff` → scheduling; `CreateContainerConfigError` → the registry; `CrashLoopBackOff` → volumes",
            "All four indicate the container failed to start and are diagnosed the same way",
            "`Pending` → the node's disk; `ImagePullBackOff` → RBAC; `CreateContainerConfigError` → networking; `CrashLoopBackOff` → the scheduler",
          ],
          correctIndex: 0,
          explanation:
            "The status names the failing stage, which is what makes triage fast: three of the four mean your application never ran, so reading its logs is a waste of a step.",
        },
        {
          id: "k8s-debugging-q4",
          prompt:
            "A Pod has been `ContainerCreating` for eight minutes. Which causes are plausible? (Select all that apply.)",
          options: [
            "A PersistentVolume that cannot be attached — already attached to another node, or the CSI driver is failing",
            "The CNI plugin failing to allocate a Pod IP",
            "A very large image still being pulled",
            "The application entering an infinite loop at startup",
            "A readiness probe that has not yet passed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`ContainerCreating` is everything the kubelet does *before* your process exists: mounts, network, image. Application behaviour and probes only matter once the container is running.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-debugging-q5",
          prompt: "The image is distroless with no shell, and you need to inspect the container's filesystem and network namespace. What works?",
          options: [
            "`kubectl debug -it pod/api-7f9 --image=busybox --target=api`, which attaches an ephemeral container sharing the target's namespaces",
            "`kubectl exec -it pod/api-7f9 -- sh`, which falls back to a built-in shell when the image has none",
            "`kubectl cp` the busybox binary into the container and run it",
            "Rebuild the image with a shell and redeploy, since there is no other option",
          ],
          correctIndex: 0,
          explanation:
            "Ephemeral containers exist for exactly this: the debug container joins the Pod and, with `--target`, shares the process namespace so you can see the application's processes and files. Nothing about the running Pod's spec is changed.",
        },
        {
          id: "k8s-debugging-q6",
          prompt: "Why is `kubectl get events` unreliable for investigating something that happened yesterday?",
          options: [
            "Events are API objects with a default retention of about one hour, so older ones are gone unless exported",
            "Events are only visible to cluster-admin after the first hour",
            "Events are stored on the node and are lost when the Pod moves",
            "Events are sampled, so only a subset is ever recorded",
          ],
          correctIndex: 0,
          explanation:
            "The one-hour `--event-ttl` keeps etcd from filling with churn. Post-mortems need events shipped to a log or event-exporter pipeline; the API is a live view only.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-debugging-q7",
          prompt:
            "A Service returns connection refused. The Deployment's Pods are `Running`. What is the fastest sequence to isolate the cause?",
          options: [
            "Check the Service's EndpointSlices; if empty, compare the Service selector with the Pod labels and check whether the Pods are `Ready`",
            "Restart kube-proxy on every node, then retry",
            "Delete and recreate the Service so it re-resolves its selector",
            "Exec into a Pod and curl the ClusterIP, then escalate to the network team",
          ],
          correctIndex: 0,
          explanation:
            "Empty endpoints has exactly two causes — a selector that matches nothing, or Pods that are not ready — and both are one command away. The Pods being `Running` says nothing about readiness.",
        },
        {
          id: "k8s-debugging-q8",
          prompt: "A Pod has been `Terminating` for twenty minutes. What are the realistic explanations?",
          options: [
            "The container ignores SIGTERM and has a long `terminationGracePeriodSeconds`, or a finalizer on the Pod has not been cleared",
            "The scheduler is waiting for a replacement Pod to become ready first",
            "The node has been cordoned, which pauses deletion",
            "The Service still lists it as an endpoint, which blocks deletion",
          ],
          correctIndex: 0,
          explanation:
            "Deletion waits on the grace period and on finalizers, and nothing else. `kubectl get pod -o yaml` shows both; force deletion removes the API object but can leave the container running on the node, so it is a last resort.",
        },
        {
          id: "k8s-debugging-q9",
          prompt:
            "Several unrelated Pods on one node have restarted in the last hour, while the same workloads are healthy elsewhere. What should you check?",
          options: [
            "The node's conditions and capacity — `MemoryPressure`, `DiskPressure`, `PIDPressure`, `Ready` — and whether the kubelet is evicting or the kernel is OOM-killing",
            "Each application's logs individually, since the workloads are unrelated",
            "The Deployment rollout history for each workload",
            "The cluster's RBAC configuration for the node's service account",
          ],
          correctIndex: 0,
          explanation:
            "\"Same node, different workloads\" means the node is the variable. Node conditions and `kubectl describe node` (which lists evictions and allocated requests) answer it directly; reading application logs assumes the applications are at fault.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "k8s-debugging-q10",
          prompt:
            "`kubectl describe pod` shows `Failed to pull image \"registry.internal/api:v2.4\": unauthorized`. Which causes fit? (Select all that apply.)",
          options: [
            "The Pod's `imagePullSecrets` is missing or references a Secret in the wrong namespace",
            "The ServiceAccount the Pod runs as has no image pull secret attached",
            "The registry credentials have expired or been rotated",
            "The image tag does not exist in the registry",
            "The node has no route to the registry",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`unauthorized` is specifically an authentication failure. A missing tag reports `manifest unknown` or `not found`, and a network problem shows a timeout or dial error — read the exact message rather than the status.",
        },
        {
          id: "k8s-debugging-q11",
          prompt: "What does `kubectl top pod` require, and what does it tell you that `kubectl describe` does not?",
          options: [
            "It needs metrics-server, and it reports actual CPU and memory usage, whereas `describe` shows only the configured requests and limits",
            "It needs Prometheus, and it reports historical usage over the last hour",
            "It needs no extra component, and it reports the same numbers `describe` shows",
            "It needs the VPA installed, and it reports recommended resource values",
          ],
          correctIndex: 0,
          explanation:
            "Comparing real usage against requests is how you tell an under-provisioned Pod from a badly sized one. It is a point-in-time reading, not a time series — that is what a monitoring stack is for.",
        },
        {
          id: "k8s-debugging-q12",
          prompt:
            "You suspect an admission webhook is rejecting a Deployment's Pods. The Deployment exists but no Pods appear at all. Where does the evidence live?",
          options: [
            "On the ReplicaSet: `kubectl describe replicaset` shows `FailedCreate` events with the webhook's rejection message",
            "On the Deployment's Pods, which are created in a `Failed` state with the message",
            "In the scheduler's logs, since the Pods were never bound to a node",
            "In `kubectl get events -n kube-system`, since webhooks run on the control plane",
          ],
          correctIndex: 0,
          explanation:
            "The ReplicaSet is the thing attempting the create, so the rejection lands in its events and in the Deployment's `ReplicaFailure` condition. No Pod object exists, which is why looking for Pods finds nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
