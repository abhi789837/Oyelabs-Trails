import type { Module } from "@/types/curriculum";

export default {
  id: "devops-aws-core",
  trackId: "devops",
  name: "AWS Core",
  description:
    "The AWS an application team actually uses: identity, networking, compute, storage, data and the bill. Written for the engineer who has just been handed an account and asked to deploy something — so the emphasis is on the traps, not the service catalogue.",
  refs: [
    { label: "AWS Documentation", url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/welcome.html", kind: "docs" },
    { label: "AWS: Shared Responsibility Model", url: "https://aws.amazon.com/compliance/shared-responsibility-model/", kind: "docs" },
    { label: "The Open Guide to AWS", url: "https://github.com/open-guides/og-aws", kind: "repo" },
    { label: "devops-exercises: AWS questions", url: "https://github.com/bregman-arie/devops-exercises/tree/master/topics/aws", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "aws-mental-model",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Regions, Availability Zones and What Managed Buys You",
      summary:
        "AWS is not one computer, it is a few dozen independent installations that share an API. A **Region** is a geographic installation with its own control plane; an **Availability Zone** is one or more physically separate data centres inside that Region with independent power, cooling and networking, connected to the other AZs by low-latency private links. Almost everything about AWS architecture follows from that shape: you spread across AZs to survive a building-scale failure, and you spread across Regions to survive a Region-scale one — which is far more work, because most services do not replicate across Regions for you.\n\nServices sit at one of three scopes and confusing them causes real outages. Zonal resources (an EC2 instance, an EBS volume, a subnet) die with their AZ. Regional resources (an S3 bucket, an SQS queue, a DynamoDB table) survive the loss of one AZ because AWS already spreads them. Global services (IAM, Route 53, CloudFront, Organizations) have a single control plane, and that control plane is largely hosted in `us-east-1` — which is why a bad day in Northern Virginia can be felt by accounts that run nothing there.\n\nWhat \"managed\" buys you is operational work you no longer do: patching, backup, failover, capacity. What it costs you is access and control. RDS gives you Postgres without a pager for failover, but you never get a root shell, you can only install the extensions AWS has approved, and you debug through metrics and logs rather than `strace`. That trade is usually worth it, and the honest way to evaluate it is to ask which of the operations you currently do by hand the managed service will now do differently — not better, differently.\n\nTwo gotchas worth carrying: AZ *names* like `us-east-1a` are mapped independently per AWS account, so your `us-east-1a` and a colleague's may be different physical zones (the AZ **ID**, `use1-az1`, is the stable one), and traffic between AZs is billed, in both directions, which quietly makes \"spread everything across three AZs\" a cost decision as well as a reliability one.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "AWS: Global infrastructure (Overview of AWS)", url: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/global-infrastructure.html", kind: "docs" },
        { label: "AWS EC2: Regions and Zones", url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html", kind: "docs" },
        { label: "AWS: Shared Responsibility Model", url: "https://aws.amazon.com/compliance/shared-responsibility-model/", kind: "article" },
        { label: "AWS Well-Architected: Reliability Pillar", url: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html", kind: "docs" },
      ],
      video: {
        title: "AWS Certified Cloud Practitioner Certification Course 2026 (CLF-C02) - Pass the Exam!",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=7HKot-brXFE",
        videoId: "7HKot-brXFE",
        startSeconds: 5214,
        chapterLabel: "AWS Global Infrastructure",
        durationLabel: "13:46:27",
      },
      alternateVideos: [
        {
          title: "Simplify the AWS Shared Responsibility Model | Amazon Web Services",
          channel: "Amazon Web Services",
          url: "https://www.youtube.com/watch?v=o13js0hIO_o",
          videoId: "o13js0hIO_o",
          durationLabel: "6:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-mental-model-q1",
          prompt: "What is an Availability Zone?",
          options: [
            "One or more discrete data centres in a Region with independent power, cooling and networking",
            "A single physical server rack inside an AWS data centre",
            "A logical grouping of accounts that share a billing relationship",
            "A copy of a Region kept in another country for disaster recovery",
          ],
          correctIndex: 0,
          explanation:
            "An AZ is an isolated failure domain inside a Region — one or more buildings with independent infrastructure, linked to the other AZs by fast private networking. A Region copy in another country is just another Region, and nothing replicates between them automatically.",
        },
        {
          id: "aws-mental-model-q2",
          prompt:
            "You and a colleague in another AWS account both launch instances in `us-east-1a`. Are they in the same physical zone?",
          options: [
            "Not necessarily — AZ names are mapped independently per account, and only the AZ ID is stable",
            "Yes — AZ names are global identifiers for the same physical building",
            "Yes, provided both accounts are in the same AWS Organization",
            "No — AZ names are never reused between accounts",
          ],
          correctIndex: 0,
          explanation:
            "AWS randomises the name-to-zone mapping per account to stop everyone piling into `…-1a`. The AZ ID (`use1-az1`) is the account-independent identifier, which is why cross-account VPC and capacity planning is done with IDs, not names.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-mental-model-q3",
          prompt: "Which of these keep working normally when a single Availability Zone fails? (Select all that apply.)",
          options: [
            "An S3 bucket in that Region",
            "An SQS queue in that Region",
            "An EC2 instance running in that AZ",
            "An EBS volume attached to that instance",
            "A subnet defined in that AZ",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "S3 and SQS are regional services that already spread data across AZs. EC2 instances, EBS volumes and subnets are zonal — they live in exactly one AZ and go down with it.",
        },
        {
          id: "aws-mental-model-q4",
          prompt:
            "An application is spread over three AZs, with app servers in every AZ talking to a database in one of them. The team is surprised by data transfer charges. What is happening?",
          options: [
            "Traffic that crosses an AZ boundary is billed, and it is billed on both sides of the transfer",
            "Traffic inside a VPC is always free, so the charge must come from something else",
            "Only traffic leaving the Region is billed, so the charge is a billing error",
            "The charge comes from the Elastic IPs attached to the app servers",
          ],
          correctIndex: 0,
          explanation:
            "Cross-AZ traffic inside a VPC is charged for data in and data out, so a chatty app-to-database path across zones is billed twice per byte. Only same-AZ, same-VPC traffic between private addresses avoids it — which is exactly the tension with AZ-spread for reliability.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-mental-model-q5",
          prompt: "Under the shared responsibility model, who patches what? (Select all that apply.)",
          options: [
            "You patch the guest operating system on an EC2 instance",
            "AWS patches the runtime underneath a Lambda function",
            "AWS patches the database engine on RDS during your maintenance window",
            "AWS patches the application dependencies inside your container image",
            "AWS patches the guest operating system on an EC2 instance",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The line moves with the service: on EC2 you own everything above the hypervisor; on RDS AWS owns the engine and OS; on Lambda AWS owns everything below your handler. Your container image is your code, so its dependencies are always yours.",
        },
        {
          id: "aws-mental-model-q6",
          prompt: "Which statement about AWS Regions is true?",
          options: [
            "Not every service, instance family or feature is available in every Region",
            "Every Region offers every AWS service within 30 days of launch",
            "Regions replicate S3 buckets to each other automatically for durability",
            "A Region is a single data centre with redundant power",
          ],
          correctIndex: 0,
          explanation:
            "Service and feature availability varies by Region, which is a real constraint when you pick one — check before you design. Cross-Region replication for S3 exists but is something you configure and pay for, not a default.",
        },
        {
          id: "aws-mental-model-q7",
          prompt:
            "Your account runs entirely in `ap-south-1`. A major incident hits `us-east-1`. Why might you still be affected?",
          options: [
            "Several global control planes, including IAM and Route 53 management, are hosted in `us-east-1`",
            "All AWS API calls are routed through `us-east-1` before reaching their Region",
            "Data in other Regions is replicated to `us-east-1` for backup",
            "You would not be affected at all; Regions are fully independent in every respect",
          ],
          correctIndex: 0,
          explanation:
            "Regional data planes are independent, but some global services have their control plane in `us-east-1`, so creating IAM roles or changing DNS can fail while your running workload keeps serving. Regular API calls to `ap-south-1` are not proxied through Virginia.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-mental-model-q8",
          prompt: "What do you give up by running Postgres on RDS instead of on an EC2 instance you manage?",
          options: [
            "OS-level access and the freedom to install any extension or patch version you like",
            "Automated backups, which you would have to implement yourself on RDS",
            "The ability to run more than one database on the same host",
            "Point-in-time recovery, which is only available on self-managed instances",
          ],
          correctIndex: 0,
          explanation:
            "Managed means AWS owns the host: no shell, a curated extension list, and engine upgrades on AWS's schedule of supported versions. Backups and PITR are things RDS gives you, not things it takes away.",
        },
        {
          id: "aws-mental-model-q9",
          prompt: "An AZ hosting your EC2 instance becomes unavailable. What happens to the EBS volume attached to it?",
          options: [
            "It is unavailable too, because an EBS volume lives in a single AZ",
            "It automatically fails over to another AZ and reattaches",
            "It stays available and can be attached to an instance in a different AZ",
            "It is deleted, and only a snapshot can recover the data",
          ],
          correctIndex: 0,
          explanation:
            "EBS volumes are zonal and can only attach to an instance in the same AZ. Snapshots are the regional artefact: they are stored durably across the Region and can be restored into any AZ, which is why snapshot cadence is a real recovery decision.",
        },
        {
          id: "aws-mental-model-q10",
          prompt: "Your users are in India and a regulator requires customer data to stay in the country. What does that constrain?",
          options: [
            "The Region you deploy in, and any cross-Region replication or backup you configure",
            "Only the Availability Zone you choose inside your existing Region",
            "Nothing — AWS keeps data in the Region of the account's billing address",
            "Only the edge locations CloudFront is allowed to use",
          ],
          correctIndex: 0,
          explanation:
            "Data residency is a Region-level decision, plus a discipline about anything that copies data out: cross-Region snapshots, replication rules, and logs shipped elsewhere. The account's billing address has no bearing on where resources live.",
        },
      ],
    },

    {
      id: "aws-iam-policies",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "IAM: Principals, Policies and Policy Evaluation",
      summary:
        "IAM is the part of AWS most likely to be misunderstood and most expensive to get wrong, because it is not a permission list — it is an evaluation engine. Every API call arrives as a *request context*: a principal (who), an action (`s3:GetObject`), a resource (an ARN), and condition keys (source IP, MFA, tags, time). AWS then collects every policy that could apply — identity policies on the principal, the resource policy on the target, permissions boundaries, Service Control Policies from the Organization, and any session policy — and runs them through one algorithm.\n\nThe algorithm is worth memorising because it explains almost every \"why can't I do this\" ticket. Deny wins: a single explicit `Deny` anywhere ends the evaluation. Otherwise the request must be allowed *and* survive every restriction: an SCP that doesn't allow the action denies it even if your IAM policy does; a permissions boundary caps what an identity policy can grant; and if nothing allows it, the implicit deny applies. Within one account, an identity policy or a resource policy allowing the action is enough. Across accounts, both sides must allow it — the resource policy in the owning account *and* the identity policy in the caller's account.\n\nThe practical failure modes are boringly consistent. `s3:ListBucket` is a bucket-level action, so an ARN ending in `/*` does not cover it and listing fails while `GetObject` works. `NotAction` and `NotResource` read as \"everything except\", which is a far wider grant than people intend. `\"Resource\": \"*\"` on an `iam:*` or `iam:PassRole` action is a privilege-escalation path: a principal that can pass any role to a service can generally reach that role's permissions. And the `\"Version\": \"2012-10-17\"` field is the policy *language* version, not a date — changing it breaks variables and silently changes behaviour.\n\nThe habit that keeps teams out of trouble is to grant narrowly, then widen with evidence: start from the specific actions and ARNs, use IAM Access Analyzer's generated policies and the last-accessed data rather than guessing, and reserve wildcards for resources you genuinely cannot enumerate.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "AWS IAM: Policy evaluation logic", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html", kind: "docs" },
        { label: "AWS IAM: JSON policy element reference", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html", kind: "docs" },
        { label: "AWS Security Blog: IAM policy types, how and when to use them", url: "https://aws.amazon.com/blogs/security/iam-policy-types-how-and-when-to-use-them/", kind: "article" },
        { label: "devops-exercises: AWS questions", url: "https://github.com/bregman-arie/devops-exercises/tree/master/topics/aws", kind: "interview-prep" },
      ],
      video: {
        title: "IAM Policy Evaluation Series: AWS IAM policy language explained | Amazon Web Services",
        channel: "Amazon Web Services",
        url: "https://www.youtube.com/watch?v=qsF6Kauh2J4",
        videoId: "qsF6Kauh2J4",
        durationLabel: "38:34",
      },
      alternateVideos: [
        {
          title: "IAM Policy Evaluation Series: policy evaluation chains | Amazon Web Services",
          channel: "Amazon Web Services",
          url: "https://www.youtube.com/watch?v=71-Gjo6a5Cs",
          videoId: "71-Gjo6a5Cs",
          durationLabel: "43:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-iam-policies-q1",
          prompt: `A user has exactly this identity policy and no other. They can download objects, but \`aws s3 ls s3://reports-prod\` fails with AccessDenied. Why?

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": "arn:aws:s3:::reports-prod/*"
  }]
}
\`\`\``,
          options: [
            "`s3:ListBucket` acts on the bucket, so it needs `arn:aws:s3:::reports-prod` — the `/*` ARN only covers objects",
            "`s3:ListBucket` must be in its own statement; two actions cannot share one statement",
            "Listing also requires `s3:GetBucketLocation`, which is missing",
            "The policy needs `\"Version\": \"2025-01-01\"` for bucket-level actions to work",
          ],
          correctIndex: 0,
          explanation:
            "Object actions take the `bucket/*` ARN; bucket actions take the bucket ARN. The usual fix is two statements, one per ARN shape. The version string is the policy language version and has nothing to do with this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-policies-q2",
          prompt:
            "A user's identity policy allows `s3:*` on a bucket. The bucket policy contains an explicit `Deny` for that user's ARN. What happens on `GetObject`?",
          options: [
            "Denied — an explicit deny anywhere in the evaluation ends it",
            "Allowed — identity policies take precedence over resource policies",
            "Allowed — the two cancel out and the more permissive wins",
            "Denied only if the user is in a different account from the bucket",
          ],
          correctIndex: 0,
          explanation:
            "Explicit deny is absolute and is checked before any allow. There is no precedence ladder between identity and resource policies; both are inputs to the same evaluation.",
        },
        {
          id: "aws-iam-policies-q3",
          prompt:
            "Account A's role needs to read a bucket in account B. B's bucket policy allows the role's ARN. The call still fails. What is missing?",
          options: [
            "An identity policy in account A allowing `s3:GetObject` on that bucket",
            "A VPC endpoint in account A for S3",
            "A second bucket policy statement naming account A's account ID as well as the role",
            "Nothing — cross-account access always requires the bucket to be public",
          ],
          correctIndex: 0,
          explanation:
            "Cross-account access needs both sides to allow: the resource policy in the owning account and an identity policy in the caller's account. Inside one account, either alone is sufficient — which is why people are surprised the first time they go cross-account.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-policies-q4",
          prompt: `What does this statement actually grant?

\`\`\`json
{
  "Effect": "Allow",
  "NotAction": "s3:DeleteObject",
  "Resource": "*"
}
\`\`\``,
          options: [
            "Every action in every service except `s3:DeleteObject`",
            "Only S3 actions other than `s3:DeleteObject`",
            "Nothing — `NotAction` with `Allow` is invalid",
            "Only the actions explicitly denied elsewhere",
          ],
          correctIndex: 0,
          explanation:
            "`NotAction` means \"all actions except these\", across every service — a near-administrator grant. That is why `NotAction` belongs in `Deny` statements far more often than in `Allow` ones.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-policies-q5",
          prompt: "Which statements about Service Control Policies are true? (Select all that apply.)",
          options: [
            "An SCP never grants permissions; it sets the maximum available to accounts in the Organization",
            "If an SCP does not allow an action, no principal in that account can perform it, whatever their IAM policy says",
            "SCPs do not restrict principals in the Organization's management account",
            "An SCP can grant a user permissions their IAM policy lacks",
            "SCPs apply only to IAM users, not to roles",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "SCPs are a filter over the whole account — including the root user — and they cap rather than grant, so a principal still needs an IAM allow. The management account is deliberately exempt, which is one reason not to run workloads in it.",
        },
        {
          id: "aws-iam-policies-q6",
          prompt: "What does attaching a permissions boundary to a role do?",
          options: [
            "It caps the role's effective permissions to the intersection of the boundary and its identity policies",
            "It grants the role everything in the boundary policy",
            "It replaces the role's identity policies entirely",
            "It denies any action not explicitly denied in the boundary",
          ],
          correctIndex: 0,
          explanation:
            "A boundary is a ceiling, not a grant: an action must appear in both the boundary and an identity policy. Teams use it to let developers create roles safely — they can grant anything they like, but never above the boundary.",
        },
        {
          id: "aws-iam-policies-q7",
          prompt:
            "A developer has `iam:PassRole` with `\"Resource\": \"*\"` and permission to create Lambda functions. Why is that combination dangerous?",
          options: [
            "They can attach any role in the account to a function they write, and run code with that role's permissions",
            "It lets them read the credentials of every role directly through the IAM API",
            "It automatically grants them the union of all roles' permissions on every API call",
            "It is harmless, because Lambda validates that the role is intended for Lambda",
          ],
          correctIndex: 0,
          explanation:
            "`PassRole` is the hinge of most AWS privilege escalation: handing an admin role to a compute service you control is equivalent to becoming admin. Scope `PassRole` to specific role ARNs and constrain it with `iam:PassedToService`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-policies-q8",
          prompt: "In what order does IAM evaluate a request?",
          options: [
            "Explicit deny first; then organization and boundary restrictions; then an explicit allow; otherwise implicit deny",
            "Explicit allow first; explicit deny only applies if no allow was found",
            "Resource policies first; identity policies are only consulted if the resource policy is silent",
            "Whichever policy was attached most recently wins",
          ],
          correctIndex: 0,
          explanation:
            "Deny short-circuits, restrictions are applied, and then an allow must exist somewhere. \"Most recently attached\" is not a concept in IAM — policies are unordered inputs.",
        },
        {
          id: "aws-iam-policies-q9",
          prompt: `An engineer wants to allow uploads only from the office network. Which condition block does what they intend?

\`\`\`json
"Condition": { "IpAddress": { "aws:SourceIp": "203.0.113.0/24" } }
\`\`\``,
          options: [
            "It allows the action only when the request's public source IP falls in that range",
            "It allows the action only for instances whose private IP is in that range",
            "It allows the action from anywhere but logs requests from that range",
            "It has no effect unless a matching `Deny` statement also exists",
          ],
          correctIndex: 0,
          explanation:
            "`aws:SourceIp` matches the public IP AWS sees, so a request arriving through a VPC endpoint has no public source IP and will not match — that case needs `aws:SourceVpce` or `aws:SourceVpc` instead.",
        },
        {
          id: "aws-iam-policies-q10",
          prompt: "Which of these are valid ways to give an application running on EC2 access to a bucket? (Select all that apply.)",
          options: [
            "Attach a role to the instance and grant the role `s3:GetObject`",
            "Allow the role's ARN as a principal in the bucket policy",
            "Bake an IAM user's access key into the AMI",
            "Make the bucket public so the instance does not need credentials",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Instance roles and bucket policies are the two supported mechanisms, and either alone works within one account. Baked-in long-lived keys and public buckets are the two anti-patterns this module exists to prevent.",
        },
        {
          id: "aws-iam-policies-q11",
          prompt: "What is the `\"Version\": \"2012-10-17\"` field in a policy document?",
          options: [
            "The version of the IAM policy language, which enables features such as policy variables",
            "The date the policy was last edited, used for audit history",
            "The API version the policy applies to, which must match the service",
            "An arbitrary label with no meaning to IAM",
          ],
          correctIndex: 0,
          explanation:
            "It selects the policy language version; `2012-10-17` is the current one and is what you should always write. Setting the older `2008-10-17` silently disables policy variables — a subtle bug when copying old examples.",
        },
        {
          id: "aws-iam-policies-q12",
          prompt:
            "A policy allows `ec2:*` on `\"Resource\": \"*\"`. A colleague argues it is safe because \"the user can only touch our resources anyway\". What is wrong with that?",
          options: [
            "It permits every EC2 action on every resource in the account, including deleting other teams' instances and VPCs",
            "Nothing — `\"Resource\": \"*\"` is scoped to resources the principal created",
            "Nothing — EC2 actions are automatically limited to the principal's own VPC",
            "It only affects the Region the user is signed in to",
          ],
          correctIndex: 0,
          explanation:
            "IAM has no concept of ownership by creator: `*` really means every resource in the account, in every Region. Many EC2 actions do not support resource-level ARNs, so narrowing usually means condition keys on tags, VPC or Region.",
        },
      ],
    },

    {
      id: "aws-iam-roles",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Roles, Trust Policies and IAM Identity Center",
      summary:
        "A role is an identity with permissions and no credentials. You cannot log in as one; you *assume* it, and STS hands you a key, a secret and a session token that expire. That is the whole reason roles beat users: a leaked access key from an IAM user is valid until someone notices and rotates it, while a leaked session credential is valid for the rest of an hour. Every serious AWS access pattern — EC2 instance profiles, ECS task roles, Lambda execution roles, GitHub Actions via OIDC, cross-account access — is a role assumption underneath.\n\nA role has two policies and confusing them produces the single most common IAM error message. The **trust policy** (the role's `AssumeRolePolicyDocument`) says *who may assume it* — a service principal like `ec2.amazonaws.com`, another account, an OIDC provider. The **permissions policy** says *what the role may do once assumed*. `User: … is not authorized to perform: sts:AssumeRole on resource: …` is almost always the trust policy's fault, not the permissions policy's — and it is deliberately unhelpful, because telling an unauthorised caller why they failed would leak information.\n\nFor human access, IAM users are no longer the recommended path: **IAM Identity Center** is. You connect an identity source (its own directory, Entra ID, Okta), define permission sets, and assign them to accounts. A permission set materialises as a role in each target account, and `aws sso login` hands the engineer a short-lived session for that role. The payoff is that there are no long-lived keys on laptops to leak, access is removed centrally when someone leaves, and a single person can move between accounts without a credentials file per environment. The remaining IAM users in most accounts should be a deliberate, audited list, not an accident.\n\nTwo traps: an EC2 instance takes an **instance profile**, which is a container around the role with (usually) the same name, so tools that ask for one and are given the other fail confusingly. And role chaining — assuming a role from an already-assumed role — is capped at one hour regardless of the role's `MaxSessionDuration`, which breaks long-running jobs that were fine when run directly.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "AWS IAM: Roles", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html", kind: "docs" },
        { label: "AWS IAM: Use instance profiles", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html", kind: "docs" },
        { label: "AWS: What is IAM Identity Center?", url: "https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html", kind: "docs" },
        { label: "AWS Security Blog: How to use trust policies with IAM roles", url: "https://aws.amazon.com/blogs/security/how-to-use-trust-policies-with-iam-roles/", kind: "article" },
      ],
      video: {
        title: "AWS Assume IAM Role - Step by Step tutorial (Part-3)",
        channel: "Rahul Wagh",
        url: "https://www.youtube.com/watch?v=MkiWa31iV6U",
        videoId: "MkiWa31iV6U",
        durationLabel: "17:23",
      },
      alternateVideos: [
        {
          title: "Enable Identity Center (SSO) - AWS SCS-C03",
          channel: "Cybr",
          url: "https://www.youtube.com/watch?v=YZUtFc3oQ9s",
          videoId: "YZUtFc3oQ9s",
          durationLabel: "11:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-iam-roles-q1",
          prompt:
            "A deployment role exists with the right permissions, but the CI job fails with `is not authorized to perform: sts:AssumeRole`. Which document do you check first?",
          options: [
            "The role's trust policy — it decides who is allowed to assume it",
            "The role's permissions policy — it must include `sts:AssumeRole`",
            "The bucket policy of the artifact bucket",
            "The SCP on the account, which always blocks `sts:AssumeRole` by default",
          ],
          correctIndex: 0,
          explanation:
            "Assumption is governed by the trust policy on the target role plus an `sts:AssumeRole` allow on the caller. The role's own permissions policy describes what it can do afterwards and is irrelevant to whether assumption succeeds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-roles-q2",
          prompt: `What does this trust policy permit?

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
\`\`\``,
          options: [
            "The EC2 service can assume the role on behalf of an instance it is attached to",
            "Any IAM user in the account can assume the role from the console",
            "Any EC2 instance in any AWS account can assume the role",
            "Nothing — a trust policy must name an account, not a service",
          ],
          correctIndex: 0,
          explanation:
            "A service principal lets that service assume the role for resources you attach it to. It does not open the role to other accounts' instances, and human users are not covered by this trust policy at all.",
        },
        {
          id: "aws-iam-roles-q3",
          prompt: "Why is a role generally safer than an IAM user for an application?",
          options: [
            "Its credentials are short-lived and rotated automatically, so a leak has a time limit",
            "Its credentials are encrypted at rest on the instance, unlike a user's",
            "Roles cannot be granted administrator permissions",
            "Role credentials only work from inside the VPC where the role was created",
          ],
          correctIndex: 0,
          explanation:
            "The security property is expiry plus automatic rotation, not encryption or a permission ceiling. A role can absolutely be over-permissioned — it just cannot leak a credential that works forever.",
        },
        {
          id: "aws-iam-roles-q4",
          prompt: "How does an application on EC2 get credentials from its attached role?",
          options: [
            "It reads them from the Instance Metadata Service, and the SDK refreshes them before expiry",
            "They are written to `~/.aws/credentials` when the instance boots",
            "They are passed as environment variables set by the AWS console",
            "The application must call `sts:AssumeRole` with a bootstrap access key",
          ],
          correctIndex: 0,
          explanation:
            "IMDS serves rotating credentials at a link-local address and the SDK's default provider chain picks them up automatically. Nothing is written to disk, which is exactly the point — there is no file to exfiltrate.",
        },
        {
          id: "aws-iam-roles-q5",
          prompt: "Which are true of IAM Identity Center? (Select all that apply.)",
          options: [
            "A permission set becomes a role in each account it is assigned to",
            "Engineers get short-lived credentials for a session rather than long-lived access keys",
            "Access can be revoked centrally by removing an assignment, without touching each account",
            "It replaces IAM policies — permission sets are written in a separate policy language",
            "It removes the need for roles entirely, because it uses users in each account",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Identity Center is a front end that provisions and assumes roles for you, using ordinary IAM policies inside permission sets. It is the current recommendation for human access precisely because it removes long-lived keys from laptops.",
        },
        {
          id: "aws-iam-roles-q6",
          prompt:
            "A CI pipeline on GitHub Actions currently stores an IAM user's access key as a repository secret. What is the recommended replacement?",
          options: [
            "An OIDC identity provider plus a role whose trust policy matches the repository and branch claims",
            "An IAM user with a shorter password rotation policy",
            "The same access key, stored encrypted in the repository instead of in secrets",
            "A root account access key with a restrictive SCP",
          ],
          correctIndex: 0,
          explanation:
            "OIDC federation lets the workflow exchange a signed token for a short-lived role session, with the trust policy's `sub` condition pinning it to a repo and ref. Root keys should not exist at all.",
        },
        {
          id: "aws-iam-roles-q7",
          prompt: "A job assumes role A, and from that session assumes role B. Role B has `MaxSessionDuration` of 12 hours. How long does the chained session last?",
          options: [
            "One hour — role chaining caps the session at an hour regardless of `MaxSessionDuration`",
            "Twelve hours, as configured on role B",
            "It inherits whatever remains of role A's session",
            "It fails: role chaining is not permitted",
          ],
          correctIndex: 0,
          explanation:
            "Chained sessions are capped at one hour and the duration parameter is ignored if longer. Long-running jobs either re-assume periodically or avoid the chain by assuming the target role directly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-roles-q8",
          prompt: "You are giving a third-party SaaS vendor cross-account access. What does `sts:ExternalId` protect against?",
          options: [
            "The confused deputy problem, where the vendor is tricked into using its access on the wrong customer's account",
            "Credential theft, by encrypting the session token",
            "Replay attacks against the STS endpoint",
            "A vendor employee assuming the role from outside the vendor's network",
          ],
          correctIndex: 0,
          explanation:
            "ExternalId is a shared secret your trust policy requires, so the vendor must know which customer it is acting for. It is not an encryption or network control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-iam-roles-q9",
          prompt: "What is an instance profile?",
          options: [
            "A container for a role that EC2 uses to pass the role to an instance",
            "A saved set of instance type and AMI defaults",
            "An alternative to a role with longer-lived credentials",
            "The metadata document describing an instance's tags and network",
          ],
          correctIndex: 0,
          explanation:
            "The console creates an instance profile with the same name as the role, which hides the distinction until you use the API or Terraform and are asked for one specifically. Only EC2 uses profiles; ECS and Lambda take role ARNs directly.",
        },
        {
          id: "aws-iam-roles-q10",
          prompt: "An engineer leaves the company. Which action actually removes their AWS access most reliably?",
          options: [
            "Removing their user from the identity source that Identity Center is connected to",
            "Deleting the EC2 instances they launched",
            "Rotating the account's root password",
            "Changing the permission sets they had been assigned",
          ],
          correctIndex: 0,
          explanation:
            "Centralising human access on an identity source is what makes offboarding a single reliable action. Editing permission sets changes what everyone assigned to them can do, and root credentials are unrelated to their sessions.",
        },
      ],
    },

    {
      id: "aws-vpc-subnets",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "VPCs, Subnets and Route Tables",
      summary:
        "A VPC is a private IP address space you carve into subnets, each pinned to exactly one Availability Zone. Nothing about a subnet is inherently public or private: a subnet is **public** if its route table sends `0.0.0.0/0` to an Internet Gateway, and **private** if it does not. That one sentence answers most of the \"why can't my thing reach my other thing\" questions people bring to a senior engineer, and it is worth being able to recite.\n\nThe pieces fit together in a fixed pattern. An Internet Gateway is attached to the VPC and is highly available by itself. Instances in a public subnet also need a public IP to be reachable from the internet — the route alone is not enough. Private subnets reach *out* through a **NAT Gateway**, which lives in a public subnet and is per-AZ: one NAT serving three AZs works, but every byte from the other two zones crosses an AZ boundary and is billed twice over, and the NAT becomes a single-AZ dependency for the whole VPC. Traffic to AWS services can skip the NAT entirely with **VPC endpoints** — a gateway endpoint for S3 and DynamoDB, interface endpoints (PrivateLink) for most others.\n\nAddressing details bite. AWS reserves five addresses in every subnet (network, VPC router, DNS, a future use, broadcast), so a `/28` gives you eleven usable addresses, not sixteen. A VPC's primary CIDR cannot be changed after creation, though secondary blocks can be added. Routing is longest-prefix-match, so a specific `/24` route beats the `0.0.0.0/0` default. VPC peering is not transitive — A↔B and B↔C does not give you A↔C — which is why multi-VPC estates end up on Transit Gateway.\n\nThe classic production mistakes are all placement mistakes: an RDS instance created in a public subnet with \"publicly accessible\" left on, and a Lambda attached to a VPC with no NAT route, which can suddenly reach the database and no longer reach the payment API. Both are one route table away from correct, and both are invisible until traffic hits them.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "AWS: What is Amazon VPC?", url: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html", kind: "docs" },
        { label: "AWS VPC: Configure route tables", url: "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html", kind: "docs" },
        { label: "AWS VPC: NAT gateways", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html", kind: "docs" },
        { label: "AWS Architecture Blog: One to Many — Evolving VPC Design", url: "https://aws.amazon.com/blogs/architecture/one-to-many-evolving-vpc-design/", kind: "article" },
      ],
      video: {
        title: "Introduction to Amazon VPC (with Console Tutorial)",
        channel: "Be A Better Dev",
        url: "https://www.youtube.com/watch?v=3FumWkHSusY",
        videoId: "3FumWkHSusY",
        startSeconds: 375,
        chapterLabel: "How do VPCs work?",
        durationLabel: "1:09:59",
      },
      alternateVideos: [
        {
          title: "AWS VPC & Subnets For Beginners",
          channel: "Sam Meech-Ward",
          url: "https://www.youtube.com/watch?v=TUTqYEZZUdc",
          videoId: "TUTqYEZZUdc",
          durationLabel: "16:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-vpc-subnets-q1",
          prompt: "What makes a subnet a *public* subnet?",
          options: [
            "Its route table has a route for `0.0.0.0/0` pointing at an Internet Gateway",
            "It has a name or tag containing \"public\"",
            "It was created with the auto-assign public IP setting enabled",
            "It uses a CIDR block from a publicly routable range",
          ],
          correctIndex: 0,
          explanation:
            "Public and private are properties of the route table, nothing else. Auto-assign public IP matters for reachability *in* a public subnet, but an instance with a public IP in a subnet with no IGW route still has no internet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-vpc-subnets-q2",
          prompt: "How many usable IP addresses does a `/28` subnet give you?",
          options: [
            "Eleven — AWS reserves five addresses in every subnet",
            "Sixteen — the full range is usable",
            "Fourteen — only the network and broadcast addresses are reserved",
            "Thirteen — AWS reserves the first three addresses",
          ],
          correctIndex: 0,
          explanation:
            "AWS reserves the first four addresses and the last one in every subnet, for the network address, the VPC router, DNS, a future use and broadcast. This matters when a small subnet runs out of IPs and ENI creation starts failing.",
        },
        {
          id: "aws-vpc-subnets-q3",
          prompt:
            "An EC2 instance sits in a subnet whose route table sends `0.0.0.0/0` to an Internet Gateway, but it has no public IP. What can it do?",
          options: [
            "Nothing outbound to the internet — a public IP is required for the IGW to translate its traffic",
            "Reach the internet outbound but not receive inbound connections",
            "Reach the internet both ways, using the IGW's shared address",
            "Reach the internet only over IPv6",
          ],
          correctIndex: 0,
          explanation:
            "An Internet Gateway performs one-to-one NAT between a private address and the instance's own public or Elastic IP; with no public address there is nothing to translate. Outbound-only access for private instances is what a NAT Gateway is for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-vpc-subnets-q4",
          prompt: "Where does a NAT Gateway live, and what do private subnets do with it?",
          options: [
            "In a public subnet; private subnets route `0.0.0.0/0` to the NAT Gateway",
            "In a private subnet; public subnets route return traffic to it",
            "Outside the VPC; it is attached like an Internet Gateway",
            "In any subnet; the route table is created automatically",
          ],
          correctIndex: 0,
          explanation:
            "The NAT needs its own path to the IGW, so it sits in a public subnet, and each private subnet's route table points its default route at it. Putting the NAT in a private subnet is a common first-attempt mistake that produces no internet at all.",
        },
        {
          id: "aws-vpc-subnets-q5",
          prompt: "A team runs one NAT Gateway in `az-a` and serves private subnets in three AZs from it. What are the consequences? (Select all that apply.)",
          options: [
            "Traffic from the other two AZs crosses an AZ boundary and is charged for it",
            "Losing `az-a` removes outbound internet for all three AZs",
            "The NAT Gateway bills for data it processes, on top of its hourly charge",
            "Instances in the other two AZs cannot use the NAT at all",
            "The NAT Gateway automatically creates a standby in the other AZs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A NAT Gateway is a zonal resource that other AZs can route to, so it works — it is just a shared failure domain and a cross-AZ bill. A NAT per AZ is the standard fix and is itself one of the biggest line items in a small account.",
        },
        {
          id: "aws-vpc-subnets-q6",
          prompt:
            "Your route table has `10.0.0.0/16 → local`, `0.0.0.0/0 → nat-abc` and `10.0.5.0/24 → pcx-xyz`. Where does traffic to `10.0.5.10` go?",
          options: [
            "To the peering connection, because the most specific matching route wins",
            "To the local route, because local always takes precedence",
            "To the NAT Gateway, because the default route is evaluated first",
            "Nowhere — overlapping routes make the table invalid",
          ],
          correctIndex: 0,
          explanation:
            "Routing is longest-prefix match, so the `/24` beats the `/16`. AWS does forbid routes more specific than the local VPC CIDR in some cases, but where such a route is accepted, specificity decides.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-vpc-subnets-q7",
          prompt: "VPC A is peered with B, and B is peered with C. Can resources in A reach C?",
          options: [
            "No — VPC peering is not transitive; A and C need their own connection or a Transit Gateway",
            "Yes, as long as the route tables in B forward the traffic",
            "Yes, automatically, because peering connections form a mesh",
            "Only if all three VPCs are in the same Availability Zone",
          ],
          correctIndex: 0,
          explanation:
            "Peering connects exactly two VPCs and never forwards through a middle VPC. Once you need more than a handful of connections, Transit Gateway is the intended answer.",
        },
        {
          id: "aws-vpc-subnets-q8",
          prompt: "A Lambda function is attached to private subnets in your VPC. It reaches RDS fine but every call to an external payment API times out. Why?",
          options: [
            "The subnets have no route to a NAT Gateway, so the function has no outbound internet access",
            "Lambda functions in a VPC cannot make outbound HTTPS calls at all",
            "The function needs an Elastic IP attached to reach the internet",
            "The security group on the function is missing an inbound rule for the API",
          ],
          correctIndex: 0,
          explanation:
            "Attaching a Lambda to a VPC removes its default internet access; it gets exactly what the subnet's routing provides. A NAT Gateway, or a VPC endpoint for the destination service, restores it — and security groups here govern outbound, not inbound.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-vpc-subnets-q9",
          prompt: "What does a gateway VPC endpoint for S3 change?",
          options: [
            "Traffic to S3 leaves via a route table entry instead of the NAT Gateway, and stays on the AWS network",
            "It makes the bucket private by blocking all non-VPC access",
            "It gives the bucket a private IP address inside your subnets",
            "It replaces the bucket policy with a VPC-scoped one",
          ],
          correctIndex: 0,
          explanation:
            "A gateway endpoint adds a prefix-list route so S3 and DynamoDB traffic bypasses the NAT — often the single biggest NAT saving in an account. Restricting the bucket to that endpoint is a separate bucket-policy condition you can then add.",
        },
        {
          id: "aws-vpc-subnets-q10",
          prompt: "Which statements about VPC addressing are true? (Select all that apply.)",
          options: [
            "A subnet exists in exactly one Availability Zone",
            "A VPC's primary CIDR block cannot be changed after creation",
            "Secondary CIDR blocks can be added to an existing VPC",
            "A subnet can be stretched across two AZs for redundancy",
            "Changing a subnet's CIDR in place is a supported operation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Subnets are zonal by definition and their CIDR is fixed at creation, as is the VPC's primary range — you add secondary ranges or build a new subnet and migrate. Planning address space generously up front is cheaper than any of the workarounds.",
        },
        {
          id: "aws-vpc-subnets-q11",
          prompt: "An RDS instance was created in a public subnet with \"publicly accessible\" enabled. What is the real exposure?",
          options: [
            "It has a public DNS name resolvable from the internet, so only its security group stands between it and the world",
            "None — RDS instances always refuse connections from outside the VPC",
            "It is exposed only if the master password is weak",
            "It is exposed only to other AWS accounts, not the public internet",
          ],
          correctIndex: 0,
          explanation:
            "Public accessibility plus a public subnet means the endpoint resolves publicly and a single over-broad security group rule opens the database to the internet. Databases belong in private subnets with no public accessibility, reached through the app tier or a bastion.",
        },
        {
          id: "aws-vpc-subnets-q12",
          prompt: "Two instances in different subnets of the same VPC cannot reach each other. Which of these could be the cause? (Select all that apply.)",
          options: [
            "The security group on the destination does not allow the source",
            "A network ACL on one of the subnets is blocking the traffic or its return path",
            "The destination's operating system firewall is dropping the packets",
            "The route table is missing a route between the subnets",
            "The two subnets are in different Availability Zones",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Within one VPC the `local` route already connects every subnet, and crossing AZs is normal, so routing is rarely the culprit. The usual suspects are the two AWS firewalls and the guest OS one — check them in that order.",
        },
      ],
    },

    {
      id: "aws-security-groups-nacls",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Security Groups vs Network ACLs",
      summary:
        "AWS gives you two packet filters with deliberately different shapes. A **security group** attaches to an elastic network interface, allows only (there is no deny rule), and is **stateful**: if a request is allowed out, the reply is allowed back regardless of inbound rules. A **network ACL** attaches to a subnet, has numbered allow *and* deny rules evaluated lowest-number-first, and is **stateless**: the return traffic needs its own rule, which in practice means opening the ephemeral port range.\n\nThat difference decides how they are used. Security groups are the day-to-day tool because they can reference *each other*: the database's security group allows port 5432 from the app's security group, not from a CIDR. That rule keeps working as instances are replaced and IPs change, and it expresses the intent — \"the app tier may reach the database tier\" — instead of an address range that drifts out of date. NACLs are the blunt instrument: a subnet-wide deny for a hostile CIDR, or a compliance requirement for a second, independent layer.\n\nWhen traffic does not flow, the mental checklist is: all security groups attached to the interface are unioned, so if *any* of them allows the traffic it is allowed inbound; then the subnet's NACL must permit both directions; then the guest OS firewall. The stateless NACL is where people get stuck — an inbound allow on 443 with no outbound rule for the high ports silently kills every response.\n\nTwo details worth knowing: the *default* security group allows all outbound traffic and allows inbound from members of itself, while a security group you create starts with no inbound rules and all outbound allowed. And security-group references work across a VPC peering connection only when the VPCs are in the same Region — inter-Region peering forces you back to CIDRs.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "AWS VPC: Control traffic using security groups", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html", kind: "docs" },
        { label: "AWS VPC: Network access control lists", url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html", kind: "docs" },
        { label: "AWS VPC: Security group rules", url: "https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html", kind: "docs" },
        { label: "devops-exercises: AWS questions", url: "https://github.com/bregman-arie/devops-exercises/tree/master/topics/aws", kind: "interview-prep" },
      ],
      video: {
        title: "AWS VPC Beginner to Pro - Virtual Private Cloud Tutorial",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=g2JOHLHh4rI",
        videoId: "g2JOHLHh4rI",
        startSeconds: 2725,
        chapterLabel: "Security Groups and Network ACL",
        durationLabel: "2:11:41",
      },
      alternateVideos: [
        {
          title: "AWS Security Groups vs Network ACLs",
          channel: "Anthony Sequeira",
          url: "https://www.youtube.com/watch?v=ttc0b2NZTV0",
          videoId: "ttc0b2NZTV0",
          durationLabel: "4:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-security-groups-nacls-q1",
          prompt:
            "An instance's security group allows outbound HTTPS to the internet but has no inbound rules at all. Can it fetch a web page?",
          options: [
            "Yes — security groups are stateful, so the response to an allowed outbound request is allowed back",
            "No — the response arrives inbound and would need a matching inbound rule",
            "Only if the subnet's NACL has an inbound rule for the ephemeral ports",
            "Only for HTTP; HTTPS responses need an explicit inbound rule",
          ],
          correctIndex: 0,
          explanation:
            "Statefulness is the defining property of a security group: connection tracking lets replies through automatically. A NACL, being stateless, *would* need that ephemeral-port rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-security-groups-nacls-q2",
          prompt:
            "A subnet's NACL has an inbound allow for TCP 443 from `0.0.0.0/0` and outbound allows only TCP 443 to `0.0.0.0/0`. A browser connects to a web server in that subnet. What happens?",
          options: [
            "The connection hangs — responses leave from port 443 to the client's high port, which outbound does not allow",
            "It works — the NACL tracks the connection and permits the response",
            "It works, because outbound rules only apply to traffic the instance originates",
            "It fails immediately with a connection refused",
          ],
          correctIndex: 0,
          explanation:
            "NACLs are stateless and evaluate each packet independently. The response's destination is the client's *ephemeral* port, so the outbound rule has to cover that range — the single most common NACL mistake.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-security-groups-nacls-q3",
          prompt: "Why is it better for the database security group to allow the app's security group rather than the app subnet's CIDR?",
          options: [
            "The rule follows the instances, so replacing or scaling the app tier does not require editing rules",
            "Security group references are evaluated faster than CIDR rules",
            "CIDR rules are not supported for database ports",
            "A CIDR rule would also allow the NAT Gateway, which a reference does not",
          ],
          correctIndex: 0,
          explanation:
            "A reference expresses the intent — this tier may talk to that tier — and survives autoscaling and IP churn. A subnet CIDR also grants access to anything else that happens to be in that subnet.",
        },
        {
          id: "aws-security-groups-nacls-q4",
          prompt: "How do you write a rule in a security group that blocks a specific IP address?",
          options: [
            "You cannot — security groups only express allows; use a network ACL to deny",
            "Add a rule with the action set to Deny and the IP as the source",
            "Add the IP with a `!` prefix in the source field",
            "Set the rule's priority to 0, which inverts it",
          ],
          correctIndex: 0,
          explanation:
            "Security groups have no deny. Blocking a specific address is precisely the job NACLs exist for, and it is one of the few times you should reach for one.",
        },
        {
          id: "aws-security-groups-nacls-q5",
          prompt: "An interface has three security groups attached. How are their rules combined?",
          options: [
            "They are unioned — traffic matching any allow in any of them is permitted",
            "They are intersected — traffic must be allowed by all three",
            "Only the first one attached is evaluated",
            "The most restrictive group wins",
          ],
          correctIndex: 0,
          explanation:
            "Security groups are additive, which is why an over-broad group attached \"temporarily\" quietly widens everything. There is no intersection semantics — that is what a NACL or a permissions boundary style control would give you.",
        },
        {
          id: "aws-security-groups-nacls-q6",
          prompt: "A NACL has rule 100 allowing TCP 22 from `10.0.0.0/8` and rule 50 denying TCP 22 from `10.0.1.0/24`. What happens to SSH from `10.0.1.5`?",
          options: [
            "Denied — rules are evaluated in ascending number order and the first match wins",
            "Allowed — allow rules always take precedence over deny rules",
            "Denied — deny always wins regardless of rule numbers",
            "Allowed — the more specific CIDR is evaluated last",
          ],
          correctIndex: 0,
          explanation:
            "NACL evaluation is first-match by rule number, not by specificity and not deny-wins. Renumbering rules changes behaviour, which is why teams leave gaps between numbers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-security-groups-nacls-q7",
          prompt: "Which statements about the *default* security group in a VPC are true? (Select all that apply.)",
          options: [
            "It allows all outbound traffic",
            "It allows inbound traffic from other resources that are also in that same security group",
            "It allows all inbound traffic from the VPC CIDR",
            "It cannot be modified",
            "A newly created security group has the same inbound rules as the default one",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The default group's inbound rule is a self-reference, not the VPC CIDR, and it is editable. A group you create starts with no inbound rules and all outbound allowed — so \"it worked on the default group\" is not a guide to what a new one does.",
        },
        {
          id: "aws-security-groups-nacls-q8",
          prompt:
            "An ALB in public subnets forwards to ECS tasks in private subnets. The tasks' security group allows port 8080 from the VPC CIDR. What would you change?",
          options: [
            "Allow port 8080 from the ALB's security group instead of the whole VPC CIDR",
            "Move the tasks into the public subnets so the ALB can reach them",
            "Add an inbound rule on the ALB's security group for port 8080",
            "Nothing — a VPC CIDR rule is the recommended pattern for load balancer targets",
          ],
          correctIndex: 0,
          explanation:
            "Referencing the load balancer's group means only the ALB can reach the tasks, while the VPC CIDR lets anything in the VPC — including a compromised bastion — hit the application port directly.",
        },
        {
          id: "aws-security-groups-nacls-q9",
          prompt: "Which of these will stop traffic between two instances even when the security groups allow it? (Select all that apply.)",
          options: [
            "A subnet NACL that denies the traffic in either direction",
            "An operating system firewall such as `iptables` or Windows Firewall on the destination",
            "The application not listening on the port",
            "The instances being in different Availability Zones",
            "The instances having different instance types",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Three independent layers must all cooperate: the subnet NACL, the interface's security groups and the guest OS — plus something actually bound to the port. AZ and instance type have nothing to do with reachability inside a VPC.",
        },
        {
          id: "aws-security-groups-nacls-q10",
          prompt: "When is a NACL the right tool rather than a security group?",
          options: [
            "When you need an explicit deny for an address range across a whole subnet",
            "When you want a rule that follows instances as they are replaced",
            "When you need to allow traffic between two application tiers",
            "When you need stateful connection tracking",
          ],
          correctIndex: 0,
          explanation:
            "Subnet-wide denies and defence in depth are the NACL's job. Tier-to-tier allows belong in security groups, which are stateful and can reference other groups.",
        },
      ],
    },

    {
      id: "aws-ec2",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "EC2: AMIs, Instance Families, IMDSv2 and EBS",
      summary:
        "EC2 is a virtual machine with three decisions attached: what image it boots (the AMI), what hardware shape it gets (the instance type), and what disk it uses (EBS or instance store). Instance families encode the shape — `m` balanced, `c` compute-heavy, `r` memory-heavy, `t` burstable, `g`/`p` accelerated — and the generation number plus suffix tell you the silicon: `g` on modern families means Graviton, which is arm64, so the AMI and every container image must match the architecture or the instance will not boot your software.\n\nThe `t` family is the one that surprises people. Burstable instances earn CPU credits while idle and spend them under load; when credits run out the instance is throttled to its baseline, which looks exactly like a mysterious performance cliff. `unlimited` mode removes the cliff by charging for surplus CPU instead — fine for spiky web traffic, quietly expensive for something that is permanently busy, where a non-burstable family is both faster and cheaper.\n\nStorage splits the same way. EBS is network-attached, persists independently of the instance, lives in one AZ, and is snapshotted to a regional store. `gp3` is the current general-purpose default and its point is that throughput and IOPS are provisioned *separately from capacity* — with `gp2` you bought performance by over-provisioning size. Instance store is physically attached NVMe: very fast, and erased whenever the instance stops or is replaced, which makes it a cache, never a database.\n\nThe security item that matters most is **IMDSv2**. The metadata service hands out the instance role's credentials, and under IMDSv1 a plain `GET` was enough — so any SSRF bug in your application could read them. IMDSv2 requires a `PUT` to obtain a session token first and honours a hop limit, which defeats the naive SSRF path. It is required on new instances, and the hop limit is the trap: the default of one means a container in bridge networking is already one hop away and cannot reach the metadata service until you raise it.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "AWS EC2: Instance types", url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html", kind: "docs" },
        { label: "AWS EC2: Use the Instance Metadata Service", url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html", kind: "docs" },
        { label: "AWS EBS: General Purpose SSD volumes", url: "https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html", kind: "docs" },
        { label: "AWS Security Blog: Defense in depth against SSRF and the instance metadata service", url: "https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/", kind: "article" },
      ],
      video: {
        title: "AWS Certified Cloud Practitioner Certification Course 2026 (CLF-C02) - Pass the Exam!",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=7HKot-brXFE",
        videoId: "7HKot-brXFE",
        startSeconds: 24619,
        chapterLabel: "EC2",
        durationLabel: "13:46:27",
      },
      alternateVideos: [
        {
          title: "Understanding Amazon EC2 Instance Metadata Service v2 Hop Limit",
          channel: "StratusGrid",
          url: "https://www.youtube.com/watch?v=4oCezO4AaqA",
          videoId: "4oCezO4AaqA",
          durationLabel: "25:10",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-ec2-q1",
          prompt: "An instance has an instance store volume holding a build cache. You stop the instance and start it again. What happened to the cache?",
          options: [
            "It is gone — instance store data does not survive a stop, or a move to different hardware",
            "It is intact, because stopping is not the same as terminating",
            "It is intact, because instance store is snapshotted automatically",
            "It is gone only if the instance restarted in a different Availability Zone",
          ],
          correctIndex: 0,
          explanation:
            "Instance store is local disk on the host; stopping releases the host, so the data goes with it. Only EBS volumes survive a stop/start, which is why anything you would miss belongs on EBS or S3.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-ec2-q2",
          prompt:
            "A `t`-family instance runs a steadily busy API. It performs well for a few hours after each deploy, then gets slow. What is happening?",
          options: [
            "It has exhausted its CPU credits and is being throttled to its baseline rate",
            "The AMI is being re-downloaded periodically, consuming CPU",
            "EBS bandwidth is being throttled because the volume is too small",
            "The instance is being live-migrated to busier hardware",
          ],
          correctIndex: 0,
          explanation:
            "Burstable instances accrue credits while under baseline and spend them above it; a deploy resets nothing but the accrued balance buys a few good hours. A sustained workload wants a non-burstable family, or `unlimited` mode and the surplus charges that come with it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-ec2-q3",
          prompt: "What does IMDSv2 require that IMDSv1 did not?",
          options: [
            "A `PUT` request to obtain a session token, which is then sent as a header on subsequent requests",
            "IAM credentials signed with SigV4 before metadata can be read",
            "TLS between the instance and the metadata endpoint",
            "A security group rule allowing the link-local metadata address",
          ],
          correctIndex: 0,
          explanation:
            "The token exchange is what makes a naive SSRF fail: a vulnerable app tricked into issuing a `GET` to the metadata address gets nothing without first making a `PUT` with the right header. Security groups never applied to the link-local address.",
        },
        {
          id: "aws-ec2-q4",
          prompt:
            "A containerised app on EC2 in bridge networking cannot read instance metadata after IMDSv2 was enforced. What is the likely cause?",
          options: [
            "The metadata hop limit is 1, and traffic from the container is already one hop away",
            "Containers are never permitted to reach the metadata service",
            "The container needs its own instance profile attached",
            "IMDSv2 is not supported for Linux containers",
          ],
          correctIndex: 0,
          explanation:
            "The response TTL (hop limit) defaults to 1 to stop metadata responses leaving the instance; a NAT hop inside the container network consumes it. Raising the hop limit to 2 fixes it — at the cost of a slightly wider blast radius, which is exactly the trade the setting exists to express.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-ec2-q5",
          prompt: "What is the practical advantage of `gp3` over `gp2`?",
          options: [
            "IOPS and throughput are provisioned independently of volume size",
            "It is the only volume type that can be snapshotted",
            "It can be attached to instances in multiple Availability Zones at once",
            "It stores data on the instance host, removing network latency",
          ],
          correctIndex: 0,
          explanation:
            "With `gp2`, performance scaled with size, so teams bought terabytes they did not need to get IOPS they did. `gp3` decouples them, which usually means a smaller volume and a cheaper bill for the same performance.",
        },
        {
          id: "aws-ec2-q6",
          prompt: "Which statements about AMIs are true? (Select all that apply.)",
          options: [
            "An AMI is regional — using it in another Region means copying it, which produces a new AMI ID",
            "An AMI has an architecture, so an arm64 image will not launch on an x86 instance type",
            "An AMI can include a snapshot of the root volume and the block device mapping",
            "An AMI is automatically updated when AWS patches the underlying operating system",
            "An AMI can be attached to a running instance to update its software",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "AMIs are immutable, regional and architecture-specific. Patching means building a new image (or patching in place on the running instance) — nothing about an AMI updates itself.",
        },
        {
          id: "aws-ec2-q7",
          prompt: "You want to move to Graviton instances for price and performance. What must you check first?",
          options: [
            "That your AMI and every container image and native dependency are built for arm64",
            "That your account has been allow-listed for Graviton",
            "That your VPC supports 64-bit addressing",
            "That the EBS volumes are re-created, because they are architecture-specific",
          ],
          correctIndex: 0,
          explanation:
            "Graviton is an arm64 CPU, so the whole software stack must have arm64 builds — usually fine for interpreted languages, less so for a native library pinned to an x86 wheel. EBS volumes are architecture-neutral block storage.",
        },
        {
          id: "aws-ec2-q8",
          prompt: "By default, when does user data run on an instance?",
          options: [
            "Once, on the first boot",
            "On every boot, including after a stop/start",
            "Only when the instance is launched from the console, not the API",
            "Continuously, as a background agent",
          ],
          correctIndex: 0,
          explanation:
            "cloud-init runs user data once per instance unless you configure it otherwise. That is why a configuration change in user data appears to do nothing until you launch a replacement instance.",
        },
        {
          id: "aws-ec2-q9",
          prompt: "What happens to the root EBS volume when you terminate an instance launched with console defaults?",
          options: [
            "It is deleted, because the root volume's delete-on-termination flag defaults to true",
            "It is kept and must be deleted manually",
            "It is converted into a snapshot automatically",
            "It is detached and reattached to the next instance you launch",
          ],
          correctIndex: 0,
          explanation:
            "Root volumes are deleted on termination by default, while additional volumes you attach usually are not — which is how accounts accumulate unattached volumes that quietly bill forever.",
        },
        {
          id: "aws-ec2-q10",
          prompt: "Which factors should drive the instance family you choose? (Select all that apply.)",
          options: [
            "Whether the workload is CPU-bound, memory-bound or needs an accelerator",
            "Whether the load is spiky enough for burstable credits to work in your favour",
            "Whether your software stack has arm64 builds available",
            "Which family has the most letters in its name",
            "Whether the instance will be in a public or private subnet",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Shape of the workload, burstiness and CPU architecture are the real inputs. Subnet placement is a networking decision and has no bearing on instance type.",
        },
      ],
    },

    {
      id: "aws-s3",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "S3: Buckets, Storage Classes and Lifecycle",
      summary:
        "S3 is an object store, not a filesystem, and most S3 confusion comes from forgetting that. There are no directories: the key `logs/2026/09/app.log` is one flat string, and \"folders\" are a console rendering of shared prefixes. There is no partial write and no append — you replace an object or you do not. Since December 2020 every read is strongly consistent after a write, so the old \"wait a moment before reading your own PUT\" folklore is dead.\n\nStorage classes are a bet on access patterns, and the bet has three dimensions, not one: storage price per GB, retrieval price and retrieval *latency*, and minimum billable duration. Standard has no minimum and no retrieval fee. Infrequent Access costs less to store but charges per GB retrieved and bills a minimum duration, so a lifecycle rule that pushes hot objects into IA can *raise* the bill. Glacier tiers go further in both directions, with restore times from milliseconds to hours depending on the tier. Intelligent-Tiering exists so you do not have to predict, and charges a small monitoring fee per object for the privilege — which stops making sense when the objects are tiny and numerous.\n\nLifecycle rules are how you operationalise any of that: transition current versions after N days, expire noncurrent versions, and — the one everybody forgets — **abort incomplete multipart uploads**. A failed large upload leaves parts behind that are invisible in the console's object list and bill as storage indefinitely. In a versioned bucket, deleting an object does not free anything either; it writes a delete marker and keeps every previous version until a rule expires them.\n\nThe cost mental model to carry: you pay for stored bytes, for requests, and for bytes leaving the Region. Request charges are the part people miss — a job that lists a million keys or does a million tiny `GET`s can cost more in requests than the data ever cost to store.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "AWS S3: Understanding and managing storage classes", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html", kind: "docs" },
        { label: "AWS S3: Managing the lifecycle of objects", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html", kind: "docs" },
        { label: "AWS S3: What is Amazon S3?", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html", kind: "docs" },
        { label: "The Open Guide to AWS", url: "https://github.com/open-guides/og-aws", kind: "repo" },
      ],
      video: {
        title: "AWS S3 Tutorial For Beginners",
        channel: "Be A Better Dev",
        url: "https://www.youtube.com/watch?v=tfU0JEZjcsg",
        videoId: "tfU0JEZjcsg",
        durationLabel: "27:18",
      },
      alternateVideos: [
        {
          title: "AWS S3 Lifecycle Rules | Save money on your S3 bill!",
          channel: "Be A Better Dev",
          url: "https://www.youtube.com/watch?v=iDYWAasynzQ",
          videoId: "iDYWAasynzQ",
          durationLabel: "12:01",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-s3-q1",
          prompt: "What is the key `reports/2026/q3.csv` in a bucket?",
          options: [
            "A single flat string; the slashes are a convention the console renders as folders",
            "A file inside two real directories that S3 creates automatically",
            "An invalid key — slashes must be escaped",
            "A symlink to an object stored at the bucket root",
          ],
          correctIndex: 0,
          explanation:
            "S3's namespace is flat and the delimiter is just a listing convention. That is why \"renaming a folder\" means copying every object under a prefix and deleting the originals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-q2",
          prompt: "You `PUT` an object and immediately `GET` the same key from another process. What do you see?",
          options: [
            "The new object — S3 has been strongly read-after-write consistent for all operations since 2020",
            "Possibly the old object, for up to a few seconds",
            "A 404 until the object replicates across AZs",
            "The new object only if both calls use the same S3 endpoint",
          ],
          correctIndex: 0,
          explanation:
            "Strong consistency applies to PUTs, overwrites, deletes and listings. Code that sleeps before reading its own write is copying advice that expired years ago.",
        },
        {
          id: "aws-s3-q3",
          prompt: "A lifecycle rule moves log objects to an infrequent-access class after a week. The bill goes up. What is the most likely reason?",
          options: [
            "The objects are still being read regularly, so per-GB retrieval charges now apply on top of storage",
            "Transitions are irreversible and priced as deletions",
            "Infrequent access classes always cost more to store than Standard",
            "Lifecycle rules duplicate objects rather than moving them",
          ],
          correctIndex: 0,
          explanation:
            "IA trades a lower storage rate for a retrieval charge and a minimum billable duration. Moving genuinely hot data there, or objects that will be deleted before the minimum duration elapses, makes it more expensive, not less.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-q4",
          prompt: "Which of these are billed in S3? (Select all that apply.)",
          options: [
            "Bytes stored, per GB per month",
            "API requests, priced separately by request type",
            "Data transferred out of the Region to the internet",
            "Data transferred into the bucket from the internet",
            "The number of buckets in the account",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Storage, requests and egress are the three meters. Inbound transfer is generally free and buckets themselves cost nothing — which is why an idle bucket full of forgotten data is a pure storage bill.",
        },
        {
          id: "aws-s3-q5",
          prompt:
            "A nightly job uploads large files with multipart upload. Some runs fail midway. Months later, storage cost is far higher than the object listing suggests. Why?",
          options: [
            "Incomplete multipart uploads leave parts that bill as storage but do not appear as objects",
            "Failed uploads are retried automatically and duplicate the data",
            "S3 keeps a hidden backup of every failed upload for 90 days",
            "The bucket's versioning keeps a version for each failed part",
          ],
          correctIndex: 0,
          explanation:
            "Orphaned parts persist until you abort the upload, and an object listing does not show them. The standard hygiene rule is a lifecycle rule that aborts incomplete multipart uploads after a few days.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-q6",
          prompt: "In a versioning-enabled bucket, what does a plain `DeleteObject` do?",
          options: [
            "Adds a delete marker as the current version while keeping the previous versions and their storage cost",
            "Permanently removes the object and all of its versions",
            "Removes the current version only and promotes the previous one",
            "Fails, because versioned objects need a version ID to delete",
          ],
          correctIndex: 0,
          explanation:
            "Deleting hides the object without freeing anything. Space is only reclaimed by deleting specific version IDs or by a lifecycle rule that expires noncurrent versions.",
        },
        {
          id: "aws-s3-q7",
          prompt: "Which storage class fits objects that must be available in milliseconds but are read a few times a year?",
          options: [
            "An infrequent-access class, which keeps millisecond access and charges per GB retrieved",
            "A deep archive class, since the objects are rarely read",
            "Standard, since anything else adds latency",
            "Reduced redundancy, which is the current low-cost tier",
          ],
          correctIndex: 0,
          explanation:
            "IA is the millisecond-latency, low-storage-cost, pay-to-retrieve option. Deep archive means hours to restore, and Reduced Redundancy is a legacy class AWS no longer recommends.",
        },
        {
          id: "aws-s3-q8",
          prompt: "What does Intelligent-Tiering do, and what is its cost?",
          options: [
            "It moves objects between access tiers based on observed access, charging a small per-object monitoring fee",
            "It compresses objects automatically to reduce stored bytes",
            "It replicates objects to a second Region for durability",
            "It caches frequently read objects at CloudFront edge locations",
          ],
          correctIndex: 0,
          explanation:
            "It is insurance against guessing wrong about access patterns. The per-object fee makes it a poor fit for very large numbers of very small objects, where the monitoring can outweigh the savings.",
        },
        {
          id: "aws-s3-q9",
          prompt: "A bucket lives in `ap-south-1`. What does that determine?",
          options: [
            "Where the data physically resides, and that requests from other Regions cross Region boundaries",
            "Nothing — bucket names are global, so data is served from the nearest Region",
            "That only principals in `ap-south-1` can access it",
            "That the bucket can only be reached over a VPC endpoint in that Region",
          ],
          correctIndex: 0,
          explanation:
            "The *name* is globally unique but the data is regional. Cross-Region access works and is simply slower and charged as inter-Region transfer; replication is what puts a copy elsewhere.",
        },
        {
          id: "aws-s3-q10",
          prompt: "A data pipeline lists a bucket with millions of keys on every run and the S3 line on the bill is dominated by something other than storage. What is it?",
          options: [
            "Request charges — `LIST` and `GET` operations are priced per request",
            "A minimum object size charge applied to small files",
            "Cross-AZ data transfer inside the Region",
            "The cost of maintaining the bucket's index",
          ],
          correctIndex: 0,
          explanation:
            "Requests are their own meter, and listing is one of the pricier request types. Keeping an external index, or partitioning by prefix so you list less, is how pipelines avoid it.",
        },
      ],
    },

    {
      id: "aws-s3-access",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "S3 Access: Bucket Policies, Block Public Access and Presigned URLs",
      summary:
        "The public-S3-bucket headline has been written so many times that AWS changed the defaults: since April 2023, new buckets have Block Public Access enabled and object ACLs disabled, with the bucket owner owning every object. That removed the two historic footguns — an uploader granting `public-read` on an object, and a bucket that was public because nobody turned the setting on. It did not remove the third: a bucket policy you wrote yourself.\n\nThere are three access mechanisms and they answer different questions. **IAM identity policies** say what a principal in your account may do. **Bucket policies** are resource policies attached to the bucket and are the only way to grant access to principals outside the account — and the only way to make something genuinely public, via `\"Principal\": \"*\"`. **ACLs** are the legacy per-object mechanism, now disabled by default and best left that way. **Block Public Access** sits above all of them as an override: with it on, a policy granting `*` is simply not honoured, which is why it should stay on at the account level and be switched off only for a bucket that is deliberately a website.\n\n**Presigned URLs** are how you let a browser upload or download directly without proxying bytes through your servers or handing out credentials. The signature encodes the signer's identity, the exact operation, and an expiry — so a presigned URL carries the *signer's* permissions, not the recipient's, and anyone holding the link can use it until it expires. Two consequences catch people: if you sign with temporary role credentials, the URL dies when that session expires no matter what expiry you asked for, and a presigned `PUT` whose content type or key prefix you did not constrain lets a client write whatever it likes wherever it likes.\n\nFor public web content the right answer is usually not a public bucket at all. CloudFront with Origin Access Control keeps the bucket private and lets only the distribution read it, which gives you caching, TLS on your own domain, and one place to attach WAF rules.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "AWS S3: Blocking public access to your storage", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html", kind: "docs" },
        { label: "AWS S3: Object Ownership and disabling ACLs", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html", kind: "docs" },
        { label: "AWS S3: Sharing objects with presigned URLs", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html", kind: "docs" },
        { label: "AWS News Blog: S3 Block Public Access", url: "https://aws.amazon.com/blogs/aws/amazon-s3-block-public-access-another-layer-of-protection-for-your-accounts-and-buckets/", kind: "article" },
      ],
      video: {
        title: "Amazon S3 Access Control - IAM Policies, Bucket Policies and ACLs",
        channel: "Digital Cloud Training",
        url: "https://www.youtube.com/watch?v=xFzJw6wJ8eY",
        videoId: "xFzJw6wJ8eY",
        durationLabel: "19:44",
      },
      alternateVideos: [
        {
          title: "Amazon S3 Presigned URLs Uploads and Downloads Tutorial",
          channel: "Milan Jovanović",
          url: "https://www.youtube.com/watch?v=V2arOZ72d6M",
          videoId: "V2arOZ72d6M",
          durationLabel: "14:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-s3-access-q1",
          prompt: `Which part of this bucket policy makes the bucket public?

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::assets-prod/*"
  }]
}
\`\`\``,
          options: [
            "`\"Principal\": \"*\"` — it grants to every identity on the internet, authenticated or not",
            "`\"Resource\"` ending in `/*`, which exposes every object",
            "`\"Action\": \"s3:GetObject\"`, which is inherently public",
            "The missing `Condition` block, which defaults to public",
          ],
          correctIndex: 0,
          explanation:
            "The principal is what makes a policy public; the resource wildcard only decides *how much* is exposed. A policy limited to specific account or role ARNs with the same action and resource is not public at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-access-q2",
          prompt: "A colleague applies exactly that policy but objects are still not readable anonymously. What is the most likely reason?",
          options: [
            "Block Public Access is enabled, and it overrides policies that grant public access",
            "The policy needs to be attached to each object, not the bucket",
            "`s3:GetObject` also requires `s3:ListBucket` for anonymous reads",
            "Bucket policies take up to 24 hours to take effect",
          ],
          correctIndex: 0,
          explanation:
            "BPA is a guardrail above policy evaluation: while it is on, public grants are not honoured at all. That is the intended behaviour — it forces someone to make exposure an explicit, auditable decision.",
        },
        {
          id: "aws-s3-access-q3",
          prompt: "What is true about object ACLs on a bucket created today?",
          options: [
            "They are disabled by default, and the bucket owner owns every uploaded object",
            "They are the recommended way to grant per-object access",
            "They are enabled by default but ignored unless Block Public Access is off",
            "They apply only to objects uploaded from another account",
          ],
          correctIndex: 0,
          explanation:
            "Object Ownership defaults to \"bucket owner enforced\", which disables ACLs entirely and removes the historic problem of cross-account uploads that the bucket owner could not read. Policies are the supported mechanism now.",
        },
        {
          id: "aws-s3-access-q4",
          prompt: "Your API generates a presigned `GET` URL and emails it to a customer. Who can use it?",
          options: [
            "Anyone who has the link, until it expires — the signature carries the signer's permissions",
            "Only the customer, because their email address is part of the signature",
            "Only principals in your AWS account",
            "Anyone with the link, but only once",
          ],
          correctIndex: 0,
          explanation:
            "A presigned URL is a bearer token: possession is authorisation. That is what makes them useful and also why expiry should be short and the URL should not end up in logs, referrers or chat history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-access-q5",
          prompt:
            "A Lambda function signs URLs valid for 24 hours, using its execution role. Customers report links breaking after about an hour. Why?",
          options: [
            "The URL cannot outlive the temporary credentials that signed it, and the role session is shorter",
            "Presigned URLs are capped at one hour by S3",
            "The Lambda execution environment was recycled, invalidating the signature",
            "The clock skew between Lambda and S3 shortens the expiry",
          ],
          correctIndex: 0,
          explanation:
            "Signatures made with STS credentials die with the session, so the requested expiry is an upper bound, not a guarantee. Long-lived links need credentials with a longer session, or a short link that your API re-issues on demand.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-s3-access-q6",
          prompt: "Which of these are ways a bucket ends up readable by the internet? (Select all that apply.)",
          options: [
            "A bucket policy with `\"Principal\": \"*\"` and Block Public Access turned off",
            "Object ACLs re-enabled and an uploader setting `public-read` on objects",
            "Static website hosting turned on together with a public read policy",
            "A presigned URL shared with one customer",
            "An IAM policy in your account granting `s3:GetObject` on the bucket",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Public means anonymous callers succeed, which takes a grant to `*` that BPA is not blocking. A presigned URL is scoped and expiring, and an IAM policy only affects principals inside your account.",
        },
        {
          id: "aws-s3-access-q7",
          prompt: "You want a bucket readable only through your CloudFront distribution. What is the current mechanism?",
          options: [
            "Origin Access Control, with a bucket policy allowing the distribution's service principal",
            "A public bucket policy plus a CloudFront geo restriction",
            "Static website hosting with the distribution's IP ranges allow-listed",
            "A presigned URL generated for each viewer request",
          ],
          correctIndex: 0,
          explanation:
            "OAC lets CloudFront sign its origin requests so the bucket can stay fully private, and it supersedes the older Origin Access Identity. Allow-listing edge IPs is unworkable — they change constantly.",
        },
        {
          id: "aws-s3-access-q8",
          prompt: "A role in account A needs to read a bucket owned by account B. What is required?",
          options: [
            "A bucket policy in B allowing the role, and an identity policy in A allowing the S3 action",
            "Only a bucket policy in B allowing the role's ARN",
            "Only an identity policy in A, since S3 is a global service",
            "A cross-account IAM user in B with access keys shared to A",
          ],
          correctIndex: 0,
          explanation:
            "Cross-account access always needs both accounts to agree. Shared access keys are exactly the pattern roles and bucket policies exist to eliminate.",
        },
        {
          id: "aws-s3-access-q9",
          prompt: "Your web app issues presigned `PUT` URLs so browsers can upload directly. What should the signature constrain?",
          options: [
            "The exact object key (or a tightly scoped prefix) and a short expiry",
            "Only the expiry — the key can be chosen by the client for flexibility",
            "The client's IP address, which is included in the signature automatically",
            "Nothing extra; a presigned `PUT` can only write to an empty key",
          ],
          correctIndex: 0,
          explanation:
            "Whatever the signature leaves open, the holder chooses — including overwriting an existing key. Signing a specific key generated server-side, with a short window, is the safe pattern; conditions on size and content type can be added with a POST policy.",
        },
        {
          id: "aws-s3-access-q10",
          prompt: "What does the `aws:PrincipalOrgID` condition key let a bucket policy express?",
          options: [
            "That access is allowed only to principals belonging to a specific AWS Organization",
            "That access is allowed only from a specific VPC",
            "That the principal must have MFA enabled",
            "That the bucket is owned by the Organization's management account",
          ],
          correctIndex: 0,
          explanation:
            "It is the concise way to share a bucket with every account in your Organization without listing account IDs. Restricting by network is `aws:SourceVpce` or `aws:SourceIp`, and MFA is `aws:MultiFactorAuthPresent`.",
        },
        {
          id: "aws-s3-access-q11",
          prompt: "Block Public Access can be set at two levels. Which is the stronger guardrail?",
          options: [
            "The account level, because it applies to every bucket including ones created later",
            "The bucket level, because it is evaluated last",
            "They are equivalent; the setting is stored once",
            "Neither — BPA is advisory and only produces console warnings",
          ],
          correctIndex: 0,
          explanation:
            "Account-level BPA covers buckets that do not exist yet, which is the failure mode that matters: someone creating a bucket in a hurry. Bucket-level settings are for the rare deliberate exception.",
        },
      ],
    },

    {
      id: "aws-rds-aurora",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "RDS, Aurora and ElastiCache",
      summary:
        "RDS is your database engine with AWS holding the pager for the boring parts: provisioning, patching, backups, failover. The two features people conflate are **Multi-AZ** and **read replicas**, and they solve different problems. A Multi-AZ *instance* deployment keeps a synchronous standby in another AZ that serves no traffic at all — it exists so that a failure flips the endpoint's DNS to the standby in a couple of minutes. A read replica is asynchronous, readable, and lags; it scales reads and can be promoted to a standalone instance, but promotion breaks replication and is a one-way door. Multi-AZ buys availability, replicas buy read throughput, and needing both means having both.\n\nAurora changes the shape underneath. Instead of replicating an engine's writes to a standby, Aurora separates compute from storage: a cluster volume spread over three AZs with six copies, and replicas that read the *same* storage rather than their own copy. That is why Aurora replicas lag in milliseconds rather than seconds, why adding one does not double your storage, and why failover is faster — the new writer attaches to storage that is already current. The price is a proprietary storage layer you cannot inspect and a cost model that meters I/O as well as compute.\n\nBackups come in two flavours that behave differently at deletion time. Automated backups plus transaction logs give you point-in-time recovery inside the retention window, and they are **deleted with the instance** unless you take a final snapshot. Manual snapshots persist until you remove them. Storage autoscaling grows but never shrinks, so a one-off data load permanently raises the floor of your bill.\n\nElastiCache sits in front of all of this. The common pattern is cache-aside: read the cache, fall through to the database, write the result back with a TTL. The failure modes are the interesting part — a stampede when a popular key expires and every request goes to the database at once, and stale reads when an update invalidates nothing. Redis/Valkey gives you persistence, replication and richer data types; Memcached is a simpler multi-threaded cache with no replication. Neither is a database, and treating one as durable storage is how teams lose data during a node replacement.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "AWS RDS: Multi-AZ deployments", url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html", kind: "docs" },
        { label: "AWS RDS: Working with read replicas", url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html", kind: "docs" },
        { label: "AWS Aurora: Storage architecture", url: "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html", kind: "docs" },
        { label: "AWS: What is Amazon ElastiCache?", url: "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html", kind: "docs" },
      ],
      video: {
        title: "AWS Certified Cloud Practitioner Certification Course 2026 (CLF-C02) - Pass the Exam!",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=7HKot-brXFE",
        videoId: "7HKot-brXFE",
        startSeconds: 21167,
        chapterLabel: "Databases",
        durationLabel: "13:46:27",
      },
      alternateVideos: [
        {
          title: "Multi-AZ vs Read Replicas | Amazon RDS Tutorial for Beginners (2025)",
          channel: "BeSA Cloud Academy",
          url: "https://www.youtube.com/watch?v=fW_prKJR79Y",
          videoId: "fW_prKJR79Y",
          durationLabel: "7:26",
        },
        {
          title: "What the heck is Storage-Compute Separation? | Aurora Paper Deep Dive - Section 1",
          channel: "Arpit Bhayani",
          url: "https://www.youtube.com/watch?v=DA5W8tO_7Nw",
          videoId: "DA5W8tO_7Nw",
          durationLabel: "17:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-rds-aurora-q1",
          prompt: "A team enables Multi-AZ on an RDS instance hoping to spread read load. What do they get?",
          options: [
            "Faster recovery from an AZ or instance failure, and no extra read capacity — the standby serves no traffic",
            "Double the read throughput, because both instances answer queries",
            "Read capacity only for queries that opt in with a read-only transaction",
            "Nothing, unless the application uses a separate reader endpoint",
          ],
          correctIndex: 0,
          explanation:
            "In a Multi-AZ instance deployment the standby is invisible to clients and exists purely for failover. Scaling reads is what read replicas (or an Aurora cluster's reader endpoint) are for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-rds-aurora-q2",
          prompt: "What actually happens during an RDS Multi-AZ failover, from the application's point of view?",
          options: [
            "The endpoint's DNS record is repointed at the standby, so clients must reconnect and should not cache the IP",
            "Existing TCP connections are transparently moved to the standby",
            "The instance keeps the same IP address, so nothing reconnects",
            "Clients must be manually reconfigured with the standby's hostname",
          ],
          correctIndex: 0,
          explanation:
            "Failover is a DNS change behind a stable endpoint name. Connection pools that resolve once at startup, or JVMs caching DNS forever, are the usual reason an app stays broken after AWS has finished failing over.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-rds-aurora-q3",
          prompt:
            "An app writes a record and immediately reads it back through a read replica, and sometimes gets nothing. What is the cause and the fix?",
          options: [
            "Replication lag — route reads that must see the write to the writer, or wait for the replica to catch up",
            "The replica is corrupt and should be rebuilt",
            "The write was not committed; the replica reads only committed data",
            "Read replicas do not support the table's storage engine",
          ],
          correctIndex: 0,
          explanation:
            "Replicas are asynchronous, so read-your-writes is not guaranteed. The routine fix is to send that path to the writer; a blanket \"all reads go to replicas\" rule is what creates the bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-rds-aurora-q4",
          prompt: "You delete an RDS instance without taking a final snapshot. What happens to the automated backups?",
          options: [
            "They are deleted with the instance, so point-in-time recovery is no longer possible",
            "They are retained for the configured retention period regardless",
            "They are converted into manual snapshots automatically",
            "They remain but can only be restored by AWS Support",
          ],
          correctIndex: 0,
          explanation:
            "Automated backups are tied to the instance's lifecycle; manual snapshots are not. That asymmetry is why the final-snapshot prompt on deletion is the most consequential checkbox in the RDS console.",
        },
        {
          id: "aws-rds-aurora-q5",
          prompt: "Which are true of Aurora compared with a standard RDS engine? (Select all that apply.)",
          options: [
            "Replicas read from the same shared cluster storage rather than their own copy",
            "The cluster volume is replicated across three Availability Zones",
            "Replica lag is typically far lower than asynchronous RDS replication",
            "Adding a replica doubles the storage you pay for",
            "Aurora removes the need to choose an instance size for the writer",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Shared storage is the whole design: it is why lag is small and why replicas do not multiply storage. You still size the writer — unless you choose Aurora Serverless, which is a different deployment option.",
        },
        {
          id: "aws-rds-aurora-q6",
          prompt: "You promote a read replica to a standalone instance. What is the consequence?",
          options: [
            "Replication from the source stops permanently; the promoted instance is now independent",
            "The replica keeps replicating and also accepts writes",
            "The source instance becomes a replica of the promoted one",
            "The promotion can be undone by demoting it again",
          ],
          correctIndex: 0,
          explanation:
            "Promotion is one-way and the two databases diverge from that moment. It is a fine disaster-recovery or migration tool and a bad accident.",
        },
        {
          id: "aws-rds-aurora-q7",
          prompt: "RDS storage autoscaling grew your volume during a bulk import. You then delete the imported rows. What happens to storage cost?",
          options: [
            "It stays at the grown size — allocated storage never shrinks automatically",
            "It shrinks back once the free space threshold is crossed",
            "It shrinks at the next maintenance window",
            "It shrinks only for Aurora, not for RDS",
          ],
          correctIndex: 0,
          explanation:
            "Allocated storage is a ratchet: reclaiming it means dumping and restoring into a smaller instance. Aurora's cluster volume does reclaim space as data is removed, which is one genuine operational difference.",
        },
        {
          id: "aws-rds-aurora-q8",
          prompt: "Describe the cache-aside pattern with ElastiCache.",
          options: [
            "Read the cache; on a miss, read the database and write the value back with a TTL",
            "Write to the cache first and let it flush to the database asynchronously",
            "Keep the cache in sync by replicating the database's write-ahead log into it",
            "Query both the cache and the database and return whichever answers first",
          ],
          correctIndex: 0,
          explanation:
            "Cache-aside keeps the database authoritative and the cache disposable, which is why it survives a cold cache. Write-through and write-behind are the other patterns, and write-behind is where you can lose data.",
        },
        {
          id: "aws-rds-aurora-q9",
          prompt: "A very popular cache key expires and the database briefly falls over. What is this, and how is it usually handled?",
          options: [
            "A cache stampede — mitigate with a short lock, staggered TTLs, or serving stale while one request refreshes",
            "A replication loop — mitigate by adding a read replica",
            "A memory fragmentation failure — mitigate by restarting the cache nodes",
            "A connection leak — mitigate by lowering the pool size",
          ],
          correctIndex: 0,
          explanation:
            "Simultaneous expiry sends every concurrent request to the database at once. Jittering TTLs and letting a single refresher repopulate while others serve the stale value are the standard defences.",
        },
        {
          id: "aws-rds-aurora-q10",
          prompt: "When is Memcached a reasonable choice over Redis or Valkey on ElastiCache?",
          options: [
            "A simple, horizontally scaled key-value cache with no need for replication, persistence or rich data types",
            "When you need sorted sets and pub/sub",
            "When you need the cache to survive a node failure without losing data",
            "When you need cross-Region replication of cached data",
          ],
          correctIndex: 0,
          explanation:
            "Memcached is multi-threaded and simple, with no replication or persistence. Everything on the list beyond \"plain cache\" is a reason to pick Redis or Valkey instead.",
        },
        {
          id: "aws-rds-aurora-q11",
          prompt: "Which configuration should you object to in a design review?",
          options: [
            "An RDS instance in a public subnet with public accessibility enabled, reachable on its database port",
            "An RDS instance in private subnets, reached only from the application's security group",
            "An RDS instance with automated backups and a seven-day retention window",
            "An RDS instance with Multi-AZ enabled and a read replica for reporting queries",
          ],
          correctIndex: 0,
          explanation:
            "A publicly accessible database has only its security group between it and the internet — one over-broad rule from an incident. Everything else on the list is normal practice.",
        },
      ],
    },

    {
      id: "aws-lambda",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Lambda: Cold Starts, Concurrency and the VPC Trap",
      summary:
        "Lambda's model is one *execution environment* per concurrent request. When a request arrives and no warm environment is free, AWS creates one: download the code, start the runtime, run your initialisation, then invoke the handler. That creation is the **cold start**; everything after it is a warm invoke where only the handler runs. So the lever on cold-start cost is what happens at module scope — a fat dependency tree, a connection pool built eagerly, an SDK client constructed per invoke instead of once.\n\nBecause the environment is reused, anything you leave outside the handler survives between invocations on that environment: globals, `/tmp` files, open connections. That is the intended optimisation — build the SDK client once — and it is also a real correctness hazard, because request state accidentally stored in a module-level variable leaks to the next caller, and `/tmp` fills up. The reuse is never guaranteed, though, so you cannot rely on it for caching correctness either.\n\nConcurrency is the other half. Every in-flight invocation occupies one environment, and one environment handles exactly one request at a time — there is no thread pool serving several events. The account has a shared concurrency limit, and **reserved concurrency** both guarantees a function a slice of it *and* caps that function at the reserved number, which surprises people who set it as a guarantee and got a throttle. **Provisioned concurrency** pre-initialises environments so there is no cold start up to that number — beyond it, you are back to cold starts. Memory is the other dial: CPU is allocated in proportion to memory, so raising memory often shortens duration enough to cost the same or less.\n\nThe classic production trap is the VPC. Attaching a function to private subnets gives it access to RDS and takes away its internet access: no NAT route, no calls to a third-party API, and the failure looks like a timeout rather than an error. The modern networking implementation removed the old per-cold-start ENI penalty, so the remaining cost of VPC attachment is routing design, not latency.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "AWS Lambda: Execution environment lifecycle", url: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html", kind: "docs" },
        { label: "AWS Lambda: Understanding function scaling", url: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html", kind: "docs" },
        { label: "AWS Lambda: Access to resources in a VPC", url: "https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html", kind: "docs" },
        { label: "AWS Compute Blog: Operating Lambda — performance optimization", url: "https://aws.amazon.com/blogs/compute/operating-lambda-performance-optimization-part-1/", kind: "article" },
      ],
      video: {
        title: "AWS Lambda Function Execution and Cold Start",
        channel: "Be A Better Dev",
        url: "https://www.youtube.com/watch?v=BhQh9QZdiKQ",
        videoId: "BhQh9QZdiKQ",
        durationLabel: "13:16",
      },
      alternateVideos: [
        {
          title: "AWS Lambda Concurrency: The Complete Mental Model",
          channel: "System Design Lab",
          url: "https://www.youtube.com/watch?v=_aiZx5G5LS0",
          videoId: "_aiZx5G5LS0",
          durationLabel: "16:55",
        },
        {
          title: "How do I provide internet access to a Lambda function that’s connected to an Amazon VPC?",
          channel: "Amazon Web Services",
          url: "https://www.youtube.com/watch?v=vANJzXzh6cU",
          videoId: "vANJzXzh6cU",
          durationLabel: "6:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-lambda-q1",
          prompt: "What exactly is a cold start?",
          options: [
            "Creating a new execution environment — downloading the code, starting the runtime and running initialisation — before the handler runs",
            "The first invocation after a deployment, regardless of environment reuse",
            "The delay while Lambda waits for a free slot under the account concurrency limit",
            "The time spent establishing the network path to the function's VPC",
          ],
          correctIndex: 0,
          explanation:
            "A cold start is environment creation plus your init code. Throttling under the concurrency limit is a different failure that returns an error rather than a slow success.",
        },
        {
          id: "aws-lambda-q2",
          prompt:
            "A handler appends the current user's ID to a module-level array declared outside the handler. What goes wrong?",
          options: [
            "The array persists across invocations in the same environment, so it accumulates other users' data",
            "Nothing — each invocation gets a fresh copy of module scope",
            "The function fails to start, because module-level mutable state is rejected",
            "The array is cleared between invocations but not between deployments",
          ],
          correctIndex: 0,
          explanation:
            "Environment reuse is what makes warm invokes fast, and it means module scope is shared state across requests on that environment. Put per-request state inside the handler and keep only reusable clients outside it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-lambda-q3",
          prompt:
            "A function attached to private subnets can query RDS but every outbound HTTPS call to a partner API times out. What is the fix?",
          options: [
            "Route the subnets through a NAT Gateway, or add a VPC endpoint for the destination if AWS offers one",
            "Attach an Elastic IP to the function",
            "Remove the function from the VPC and use a security group rule for RDS instead",
            "Increase the function's timeout so the call has time to complete",
          ],
          correctIndex: 0,
          explanation:
            "A VPC-attached function only has the connectivity its subnets provide. Detaching from the VPC would restore internet access but lose private access to RDS, which is why NAT or endpoints is the real answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-lambda-q4",
          prompt: "You set reserved concurrency to 10 on a function to guarantee it capacity. What else have you done?",
          options: [
            "Capped it at 10 concurrent executions — requests beyond that are throttled",
            "Nothing else; reserved concurrency is only a floor",
            "Pre-initialised 10 environments, removing cold starts for the first 10 requests",
            "Reserved 10 environments per Availability Zone",
          ],
          correctIndex: 0,
          explanation:
            "Reserved concurrency is simultaneously a guarantee and a ceiling — it carves the number out of the account pool and refuses to exceed it. Pre-initialising environments is provisioned concurrency, a separate setting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-lambda-q5",
          prompt: "Provisioned concurrency is set to 5 and 20 concurrent requests arrive. What happens?",
          options: [
            "Five are served by pre-initialised environments and the rest cold-start as usual",
            "All twenty are served without cold starts, because provisioning scales automatically",
            "Fifteen are throttled with a 429",
            "The function scales to 20 provisioned environments and bills for them",
          ],
          correctIndex: 0,
          explanation:
            "Provisioned concurrency removes cold starts only up to the number you paid for; beyond it the function behaves normally. Autoscaling of the provisioned number is something you configure separately.",
        },
        {
          id: "aws-lambda-q6",
          prompt: "Why can increasing a function's memory setting sometimes reduce its cost?",
          options: [
            "CPU is allocated in proportion to memory, so a CPU-bound function finishes in less billed time",
            "Higher memory tiers have a lower per-GB-second price",
            "Memory above a threshold disables cold-start billing",
            "It does not — cost always scales linearly with memory",
          ],
          correctIndex: 0,
          explanation:
            "Cost is roughly memory multiplied by duration, so if doubling memory more than halves duration you win. This only helps CPU-bound work; a function that spends its life waiting on the network gets slower per rupee.",
        },
        {
          id: "aws-lambda-q7",
          prompt: "How many events does one Lambda execution environment process at a time?",
          options: [
            "One — concurrency is achieved by running more environments, not more threads per environment",
            "As many as the runtime's thread pool allows",
            "One per CPU core allocated to the function",
            "Unlimited, subject to the memory limit",
          ],
          correctIndex: 0,
          explanation:
            "This single fact explains Lambda's scaling and its database-connection problem: 500 concurrent invocations mean up to 500 environments, each with its own connections — which is why RDS Proxy exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-lambda-q8",
          prompt: "Which of these reduce cold-start impact? (Select all that apply.)",
          options: [
            "Moving SDK client construction and config loading to module scope so it runs once per environment",
            "Trimming the deployment package and dependency tree",
            "Configuring provisioned concurrency for the function's baseline traffic",
            "Increasing the function timeout",
            "Attaching the function to a VPC",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Smaller packages, work done once at init, and pre-warmed environments all attack initialisation time. A longer timeout only changes when you give up, and VPC attachment adds constraints rather than removing them.",
        },
        {
          id: "aws-lambda-q9",
          prompt: "What does Lambda do by default when an *asynchronous* invocation fails?",
          options: [
            "Retries the event twice with delays, then sends it to a dead-letter queue or on-failure destination if configured",
            "Returns the error to the caller, which decides whether to retry",
            "Retries indefinitely until the event succeeds",
            "Discards the event immediately and records a metric",
          ],
          correctIndex: 0,
          explanation:
            "Async invocations are retried by the service, which is why handlers for them must be idempotent. Synchronous callers get the error and own the retry decision themselves.",
        },
        {
          id: "aws-lambda-q10",
          prompt: "A function's concurrency hits the account limit. What does a *synchronous* caller see?",
          options: [
            "A throttling error, which the caller must handle or retry",
            "A queued request that eventually runs",
            "A cold start with extra latency but a successful response",
            "A partial response containing the throttle metric",
          ],
          correctIndex: 0,
          explanation:
            "Sync invocations fail fast when throttled; async ones are retried by the service for a while. Knowing which mode you are in decides whether throttling shows up as a 5xx to users or as delayed processing.",
        },
        {
          id: "aws-lambda-q11",
          prompt: "Which is a reasonable use of `/tmp` in a Lambda function?",
          options: [
            "A scratch area for a file being processed during this invocation, with no assumption it will still be there next time",
            "A durable cache of user sessions between invocations",
            "A shared directory that all concurrent invocations can read and write",
            "A location for the function's deployment package to be updated at runtime",
          ],
          correctIndex: 0,
          explanation:
            "`/tmp` is local to one execution environment and survives only as long as that environment does — useful as scratch space, useless as shared or durable storage. It also fills up, so clean it up on reuse.",
        },
      ],
    },

    {
      id: "aws-ecs-fargate",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "ECS and Fargate: the Container Path",
      summary:
        "ECS is AWS's container orchestrator, and the path most application teams should take before considering Kubernetes. The vocabulary is small: a **task definition** is the immutable spec (image, CPU, memory, ports, environment, roles), a **task** is a running instance of it, and a **service** keeps a desired number of tasks alive and registered with a load balancer. **Fargate** is a launch type where AWS runs the host — you never see an EC2 instance, you never patch one, and you pay for the CPU and memory the task requests rather than for a partly idle fleet.\n\nThe two roles are the most common source of confusion, and the error messages are unhelpful. The **task execution role** is used by the ECS agent *before your code runs*: pulling the image from ECR, fetching secrets, writing to CloudWatch Logs. The **task role** is what your application code's SDK calls use. A task that cannot start usually has an execution-role or networking problem; a task that starts and then gets AccessDenied usually has a task-role problem.\n\nNetworking on Fargate is always `awsvpc` mode: every task gets its own elastic network interface, its own private IP and its own security groups — so you can write a rule that says \"the database accepts connections from this service\" and mean it. Containers in the same task share a network namespace and reach each other on `localhost`, which is how sidecars work.\n\nThe trap that catches every team once: a Fargate task in a private subnet with no NAT Gateway cannot pull its own image. The pull happens over the network from ECR, so the task fails before your code ever runs, with an error about the image rather than about routing. The fix is a NAT Gateway or — cheaper and tighter — interface endpoints for ECR API and ECR Docker, a gateway endpoint for S3 (where layers live) and an endpoint for CloudWatch Logs. And since there is no host to log into, debugging a running container means ECS Exec, which itself needs the right task-role permissions configured in advance.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "AWS: What is Amazon ECS?", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html", kind: "docs" },
        { label: "AWS ECS: Task IAM role", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html", kind: "docs" },
        { label: "AWS ECS: Task definitions", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html", kind: "docs" },
        { label: "AWS Containers Blog: Under the hood — ECS and Fargate task launch rates", url: "https://aws.amazon.com/blogs/containers/under-the-hood-amazon-elastic-container-service-and-aws-fargate-increase-task-launch-rates/", kind: "article" },
      ],
      video: {
        title: "Containers on AWS Overview: ECS | EKS | Fargate | ECR",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=AYAh6YDXuho",
        videoId: "AYAh6YDXuho",
        durationLabel: "25:10",
      },
      alternateVideos: [
        {
          title: "AWS EC2 on ECS vs Fargate | Whats the Difference and When To Use What?",
          channel: "Be A Better Dev",
          url: "https://www.youtube.com/watch?v=DVrGXjjkpig",
          videoId: "DVrGXjjkpig",
          durationLabel: "14:53",
        },
        {
          title: "AWS ECS Full Tutorial | Learn EC2, EKS, Fargate, Load Balancers and Docker Deployment with Demo",
          channel: "KodeKloud",
          url: "https://www.youtube.com/watch?v=esISkPlnxL0",
          videoId: "esISkPlnxL0",
          durationLabel: "1:06:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-ecs-fargate-q1",
          prompt:
            "A Fargate task in a private subnet fails to start with an error about pulling the image from ECR. The task role has full ECR permissions. What is wrong?",
          options: [
            "The subnet has no route to the internet and no ECR/S3 VPC endpoints, so the image pull cannot reach ECR",
            "The task role needs to be replaced with an execution role that has the same permissions and nothing else",
            "Fargate cannot pull from private ECR repositories",
            "The image must be copied to the task's EBS volume before it can start",
          ],
          correctIndex: 0,
          explanation:
            "The pull is a network operation performed before your container runs, so routing must exist: NAT, or endpoints for ECR API, ECR Docker, S3 and Logs. Permissions here belong to the *execution* role, not the task role — a second reason this error is confusing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-ecs-fargate-q2",
          prompt: "Your application code calls `s3:GetObject` and gets AccessDenied, but the task starts fine. Which role do you fix?",
          options: [
            "The task role, which supplies credentials to the application's SDK",
            "The task execution role, which supplies credentials to everything in the task",
            "The instance profile on the underlying host",
            "The ECS service-linked role",
          ],
          correctIndex: 0,
          explanation:
            "Starting fine means the execution role did its job; the failure is in your code's own credentials, which come from the task role. On Fargate there is no host instance profile to fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-ecs-fargate-q3",
          prompt: "What does `awsvpc` network mode give a task?",
          options: [
            "Its own elastic network interface, private IP and security groups",
            "A shared IP with the other tasks on the same host, distinguished by port",
            "A public IP by default, so it can be reached from the internet",
            "A dedicated subnet created automatically for each task",
          ],
          correctIndex: 0,
          explanation:
            "Per-task ENIs are what let you write security-group rules per service instead of per host — and they are why subnet IP capacity planning matters when you scale to many tasks.",
        },
        {
          id: "aws-ecs-fargate-q4",
          prompt: "Two containers are defined in the same task. How do they communicate?",
          options: [
            "Over `localhost`, because containers in a task share a network namespace",
            "Through the service discovery namespace, using DNS",
            "Through a shared volume only; network traffic between them is blocked",
            "Through the load balancer, which routes between them",
          ],
          correctIndex: 0,
          explanation:
            "Sharing the namespace is what makes the sidecar pattern work — a log shipper or proxy next to the app. Talking to a *different* service needs service discovery or a load balancer.",
        },
        {
          id: "aws-ecs-fargate-q5",
          prompt: "Which does Fargate remove compared with the EC2 launch type? (Select all that apply.)",
          options: [
            "Patching and scaling the container host fleet",
            "Choosing an instance type and worrying about task bin-packing",
            "Paying for idle capacity between tasks",
            "The need to define CPU and memory for your task",
            "The need for a task execution role",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fargate removes the host, not the task's own configuration: you still size CPU and memory and still need both roles. What you stop doing is capacity management.",
        },
        {
          id: "aws-ecs-fargate-q6",
          prompt: "An ECS service is behind an ALB. Tasks are started and killed in a loop. Where do you look first?",
          options: [
            "The target group health check — a wrong path or port makes the ALB mark healthy tasks as failed",
            "The task definition's CPU units, which must match the instance type",
            "The cluster's capacity provider, which restarts tasks periodically",
            "The ALB listener rule priority, which controls task lifetime",
          ],
          correctIndex: 0,
          explanation:
            "A failing health check makes the service replace tasks that are actually fine, producing an endless deploy loop. The other classic cause is the app taking longer to start than the health check grace period allows.",
        },
        {
          id: "aws-ecs-fargate-q7",
          prompt: "How do you get a shell inside a running Fargate container to debug it?",
          options: [
            "ECS Exec, which must be enabled on the service and needs SSM permissions on the task role",
            "SSH to the underlying host and use `docker exec`",
            "Attach an EBS volume containing a debug shell",
            "You cannot — Fargate containers are not accessible once running",
          ],
          correctIndex: 0,
          explanation:
            "There is no host to SSH to, so ECS Exec tunnels through SSM. It has to be enabled in advance, which is worth doing before the incident rather than during it.",
        },
        {
          id: "aws-ecs-fargate-q8",
          prompt: "What does registering a new task definition revision and updating the service do?",
          options: [
            "Starts tasks from the new revision and drains the old ones according to the deployment configuration",
            "Restarts the existing tasks in place with the new image",
            "Modifies the running tasks' environment variables without a restart",
            "Requires the service to be deleted and recreated",
          ],
          correctIndex: 0,
          explanation:
            "Task definitions are immutable, so deployment means new tasks and drained old ones — a rolling replacement. Nothing is edited in place, which is also why a rotated secret does not reach running tasks.",
        },
        {
          id: "aws-ecs-fargate-q9",
          prompt: "Which is the more accurate description of an ECS *service*?",
          options: [
            "A controller that maintains a desired count of tasks and keeps them registered with a load balancer",
            "A long-lived container that other tasks connect to",
            "A DNS name that resolves to the tasks in a cluster",
            "A billing grouping for tasks that share a task definition",
          ],
          correctIndex: 0,
          explanation:
            "The service is the reconciliation loop: desired count, placement, deployments and load balancer registration. DNS-based discovery is a separate feature you can attach to it.",
        },
        {
          id: "aws-ecs-fargate-q10",
          prompt: "When would you still pick the EC2 launch type over Fargate?",
          options: [
            "When you need GPUs, privileged containers, custom kernel settings, or very dense bin-packing for cost",
            "When you want AWS to manage the host operating system",
            "When your workload is stateless and HTTP-based",
            "When you want per-task security groups",
          ],
          correctIndex: 0,
          explanation:
            "Fargate trades control for convenience, so the reasons to keep EC2 are the ones Fargate does not support or prices poorly. Per-task security groups come from `awsvpc` mode and are available either way.",
        },
      ],
    },

    {
      id: "aws-front-door",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "The Front Door: Route 53, CloudFront, ALB and API Gateway",
      summary:
        "Every request to your application takes the same four-step path, and knowing which layer owns which behaviour is what makes production debugging tractable. **Route 53** answers the DNS question — but only if the domain's registrar delegates to your hosted zone's name servers, which is why \"I created the record and nothing happened\" is usually a delegation problem, not a record problem. Route 53's **alias** record is the AWS-specific one: unlike a CNAME it can exist at the zone apex (`example.com`, not just `www`) and it resolves to the current addresses of an AWS target.\n\n**CloudFront** is the edge cache, and its behaviour is decided by the **cache key**. By default a cache policy includes the host and path but *not* query strings, headers or cookies — so if your origin varies its response by `Accept-Language` or a `?locale=` parameter that is not in the key, the first visitor's response is served to everyone. The opposite mistake is including a per-user cookie, which makes the cache key unique per user and the hit rate zero. Invalidations exist for mistakes; TTLs and versioned asset filenames are how you avoid needing them.\n\n**ALB** is the layer-7 load balancer: listeners on a port, rules that route by host and path, target groups that health-check their members. It is a DNS name whose IPs change, so nothing may ever hard-code them. **API Gateway** overlaps it and is priced per request rather than per hour, which changes the calculus: it earns its keep when you want authorizers, per-client throttling and usage plans, request validation, or a managed WebSocket API — and it is expensive for high-volume traffic that an ALB would forward for a flat hourly rate. The HTTP API flavour is the cheaper, faster subset; REST APIs carry the older feature set.\n\nOne composition detail that is easy to miss: putting CloudFront in front of an ALB does nothing for security by itself, because the ALB's DNS name is still public. Restricting the ALB to CloudFront's managed prefix list, or requiring a secret header the distribution adds, is what stops someone bypassing your cache and WAF entirely.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "AWS: What is an Application Load Balancer?", url: "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html", kind: "docs" },
        { label: "AWS Route 53: Choosing between alias and non-alias records", url: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html", kind: "docs" },
        { label: "AWS CloudFront: Control the cache key with a policy", url: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html", kind: "docs" },
        { label: "AWS API Gateway: Choose between REST APIs and HTTP APIs", url: "https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html", kind: "docs" },
      ],
      video: {
        title: "AWS ALB (Application Load Balancer) - Step By Step Tutorial (Part -9)",
        channel: "Rahul Wagh",
        url: "https://www.youtube.com/watch?v=cuJTmBvFCS0",
        videoId: "cuJTmBvFCS0",
        durationLabel: "25:24",
      },
      alternateVideos: [
        {
          title: "Amazon Route 53 Basics Tutorial | Domain Registration, A Records, CNAME Records, Aliases, Subdomains",
          channel: "Tiny Technical Tutorials",
          url: "https://www.youtube.com/watch?v=JRZiQFVWpi8",
          videoId: "JRZiQFVWpi8",
          durationLabel: "8:32",
        },
        {
          title: "AWS CloudFront Caching and Behaviors",
          channel: "Digital Cloud Training",
          url: "https://www.youtube.com/watch?v=h2o3a2YhQa0",
          videoId: "h2o3a2YhQa0",
          durationLabel: "11:29",
        },
        {
          title: "REST vs HTTP APIs in API Gateway (1/2)",
          channel: "Be A Better Dev",
          url: "https://www.youtube.com/watch?v=5VikkwAxr-E",
          videoId: "5VikkwAxr-E",
          durationLabel: "11:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-front-door-q1",
          prompt: "You need `example.com` (no subdomain) to point at an Application Load Balancer. What do you create?",
          options: [
            "An alias A record at the zone apex targeting the load balancer",
            "A CNAME at the zone apex targeting the load balancer's DNS name",
            "An A record with the load balancer's current IP addresses",
            "An NS record delegating the apex to the load balancer",
          ],
          correctIndex: 0,
          explanation:
            "DNS forbids a CNAME at the apex alongside the zone's SOA and NS records; Route 53's alias is the AWS answer. Hard-coding the ALB's IPs is worse — they change without notice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-front-door-q2",
          prompt:
            "A team creates a hosted zone for a domain registered elsewhere and adds records. Nothing resolves. What is missing?",
          options: [
            "The registrar still delegates to different name servers; it must point at this zone's NS records",
            "The records need to propagate for 48 hours before they resolve",
            "The hosted zone must be marked public after creation",
            "An A record for the zone apex is mandatory before any record resolves",
          ],
          correctIndex: 0,
          explanation:
            "A hosted zone is only authoritative if the parent delegates to it. Until the registrar's NS records match, you are editing a zone nobody is asking.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-front-door-q3",
          prompt:
            "A site behind CloudFront serves localised pages based on `?lang=`. Users report seeing the wrong language. What is the likely cause?",
          options: [
            "The query string is not part of the cache key, so one cached response is served for every value",
            "CloudFront strips query strings before forwarding to the origin, so the origin cannot see `lang`",
            "The TTL is too short, so the cache never warms",
            "Localisation requires Lambda@Edge; CloudFront cannot vary responses at all",
          ],
          correctIndex: 0,
          explanation:
            "Anything that changes the response must be in the cache key. The mirror-image mistake is putting a per-user cookie in the key, which makes every request a miss.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-front-door-q4",
          prompt: "Which are good reasons to choose API Gateway over an ALB? (Select all that apply.)",
          options: [
            "You need built-in request authorizers and per-client throttling with usage plans",
            "You need request/response validation and transformation at the edge of your API",
            "You want to pay per request rather than for an always-on hourly resource",
            "You need to route high-volume traffic as cheaply as possible",
            "You need layer-7 routing by host and path",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "API Gateway's value is the API-management features and the per-request model for spiky or low-volume APIs. For sustained high volume the per-request price is exactly what makes it expensive, and host/path routing is bread-and-butter ALB.",
        },
        {
          id: "aws-front-door-q5",
          prompt: "Why must an application never cache the IP address an ALB's DNS name resolves to?",
          options: [
            "The ALB's node addresses change as it scales and is repaired",
            "The addresses are only valid for requests originating inside the VPC",
            "Each address serves a different target group",
            "The addresses are rotated hourly to prevent scraping",
          ],
          correctIndex: 0,
          explanation:
            "ALB nodes come and go, and DNS is the contract. Clients or JVMs that resolve once and cache forever eventually send traffic to addresses that no longer answer.",
        },
        {
          id: "aws-front-door-q6",
          prompt: "What decides whether a target in an ALB target group receives traffic?",
          options: [
            "The target group's health check — path, port, expected codes and thresholds",
            "The order targets were registered",
            "The instance's CPU utilisation, measured by the ALB",
            "The listener rule priority assigned to each target",
          ],
          correctIndex: 0,
          explanation:
            "Health checks govern membership; listener rules decide which target *group* a request goes to. A health check pointed at a path requiring authentication is a classic way to make every target unhealthy.",
        },
        {
          id: "aws-front-door-q7",
          prompt: "You put CloudFront in front of an ALB and add WAF rules on the distribution. Why might attackers still bypass them?",
          options: [
            "The ALB's DNS name is still publicly reachable, so requests can skip CloudFront entirely",
            "WAF rules on a distribution apply only to cached responses",
            "CloudFront forwards the attacker's IP, which WAF then trusts",
            "WAF cannot inspect HTTPS traffic at the edge",
          ],
          correctIndex: 0,
          explanation:
            "The origin stays reachable unless you lock it down — by restricting the ALB security group to CloudFront's managed prefix list, or requiring a secret header that only the distribution adds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-front-door-q8",
          prompt: "What is the practical difference between lowering a TTL and issuing an invalidation?",
          options: [
            "TTL governs how long objects stay cached going forward; invalidation forcibly evicts already-cached objects and is charged beyond a free allowance",
            "They are equivalent; invalidation just applies the new TTL immediately",
            "Invalidation deletes objects from the origin as well as the cache",
            "TTL only applies to HTML; invalidation applies to everything",
          ],
          correctIndex: 0,
          explanation:
            "Invalidation is the emergency lever. Steady-state practice is short TTLs for HTML and long TTLs for assets whose filenames change on every build, which makes invalidations unnecessary.",
        },
        {
          id: "aws-front-door-q9",
          prompt: "A Route 53 failover routing policy needs what in order to work?",
          options: [
            "A health check attached to the primary record, so Route 53 knows when to serve the secondary",
            "Two hosted zones, one per Region",
            "A CloudFront distribution in front of both endpoints",
            "Identical TTLs on both records, otherwise failover is ignored",
          ],
          correctIndex: 0,
          explanation:
            "Failover is driven by health checks; without one Route 53 has no signal. TTL still matters for how quickly resolvers notice, but it is not what triggers the switch.",
        },
        {
          id: "aws-front-door-q10",
          prompt: "Where does TLS terminate in a typical CloudFront → ALB → container setup?",
          options: [
            "At CloudFront, which then makes its own connection to the ALB — which can itself terminate a second TLS connection",
            "Only at the container, which must hold the certificate",
            "Only at the ALB; CloudFront passes TLS through untouched",
            "At Route 53, which holds the ACM certificate",
          ],
          correctIndex: 0,
          explanation:
            "Each hop is its own connection, so each can terminate TLS with its own certificate. Route 53 is DNS and never sees the request payload at all.",
        },
        {
          id: "aws-front-door-q11",
          prompt: "What does an ALB listener rule let you express?",
          options: [
            "Route to a target group based on host header, path pattern, header values or query strings",
            "Cache responses for a configurable TTL",
            "Rewrite the response body before returning it",
            "Throttle individual API clients by API key",
          ],
          correctIndex: 0,
          explanation:
            "ALB rules do layer-7 routing plus fixed responses and redirects. Caching is CloudFront's job and per-client throttling with keys is API Gateway's.",
        },
      ],
    },

    {
      id: "aws-cloudwatch",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "CloudWatch: Logs, Metrics and Alarms",
      summary:
        "CloudWatch is three products behind one name and mixing them up wastes a lot of time. **Logs** are text, organised into log groups (usually one per application) and log streams (one per instance, container or function). **Metrics** are numeric time series with dimensions, published by AWS services and by you. **Alarms** watch a *metric* — never a log directly — and change state based on a number of evaluation periods.\n\nTwo defaults cost real money. A log group's retention defaults to **Never expire**, so every debug line you have ever emitted is still billed years later; setting a retention policy on creation is the single highest-value hygiene habit in this camp. And the other direction: EC2 publishes CPU, network and disk *I/O* by default but not memory or disk *usage*, because those live inside the guest — collecting them means installing the CloudWatch agent. Teams discover this mid-incident when they go looking for a memory graph that was never being recorded.\n\nThe alarm subtlety that catches experienced engineers is missing data. An alarm on a metric that stops being published does not fire; it goes to `INSUFFICIENT_DATA`, or whatever your `treat missing data` setting says. So an alarm on \"error count > 10\" is silent when the application is so broken it emits nothing at all. The robust pattern pairs it with an alarm on a metric that should always be present — request count, heartbeats — and treats missing data as breaching where that makes sense.\n\nGetting from logs to metrics is done in two ways: **metric filters**, which match a pattern as logs arrive and increment a metric you can alarm on, and **Logs Insights**, an ad-hoc query language for investigation after the fact. Custom metrics are billed per metric *and* per dimension combination, so a dimension with high cardinality — a user ID, a request ID — turns a monitoring idea into a surprising bill.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "AWS: What is Amazon CloudWatch?", url: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html", kind: "docs" },
        { label: "AWS CloudWatch: Using alarms", url: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html", kind: "docs" },
        { label: "AWS CloudWatch Logs: Log groups and log streams", url: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html", kind: "docs" },
        { label: "AWS News Blog: CloudWatch Logs Insights", url: "https://aws.amazon.com/blogs/aws/new-amazon-cloudwatch-logs-insights-fast-interactive-log-analytics/", kind: "article" },
      ],
      video: {
        title: "AWS Cloudwatch Logs Core Concepts (for beginners)",
        channel: "Be A Better Dev",
        url: "https://www.youtube.com/watch?v=HRJnhzSSFtk",
        videoId: "HRJnhzSSFtk",
        durationLabel: "13:33",
      },
      alternateVideos: [
        {
          title: "AWS Cloudwatch Alarm Setup Tutorial | Step by Step",
          channel: "Be A Better Dev",
          url: "https://www.youtube.com/watch?v=lHWrAAzoxJA",
          videoId: "lHWrAAzoxJA",
          durationLabel: "16:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-cloudwatch-q1",
          prompt: "A new log group is created by a Lambda function. How long are its logs kept by default?",
          options: [
            "Forever — retention defaults to \"Never expire\" and must be set explicitly",
            "Thirty days, after which they are deleted",
            "Until the function is deleted",
            "Seven days for Lambda, fourteen for everything else",
          ],
          correctIndex: 0,
          explanation:
            "Indefinite retention is the default and it silently accumulates cost. Setting retention when the log group is created — ideally in your IaC — is the fix, and an account-wide audit usually finds years of forgotten logs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cloudwatch-q2",
          prompt: "An alarm on `ErrorCount > 10` is configured. The application crashes so hard it stops logging entirely. What does the alarm do?",
          options: [
            "Goes to `INSUFFICIENT_DATA` (or whatever the missing-data setting says) rather than alarming",
            "Fires immediately, because zero is less than the threshold",
            "Stays in OK state and fires once data returns",
            "Fires after three evaluation periods regardless of data",
          ],
          correctIndex: 0,
          explanation:
            "No data is not a breach unless you configure `treatMissingData` as breaching. Pairing error alarms with a \"traffic has stopped\" alarm is how teams avoid a silent total outage.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cloudwatch-q3",
          prompt: "You need a graph of memory usage on an EC2 instance. What must be in place?",
          options: [
            "The CloudWatch agent, configured to publish memory as a custom metric",
            "Detailed monitoring enabled on the instance",
            "Nothing — memory is a default EC2 metric",
            "A metric filter on the instance's system log",
          ],
          correctIndex: 0,
          explanation:
            "The hypervisor can see CPU and network but not what the guest OS does with its memory, so memory and disk usage need an agent inside. Detailed monitoring only changes the *frequency* of the metrics EC2 already publishes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cloudwatch-q4",
          prompt: "What is the difference between a metric filter and a Logs Insights query?",
          options: [
            "A metric filter runs continuously as logs arrive and produces a metric you can alarm on; Insights queries stored logs on demand",
            "A metric filter is a saved Insights query with a schedule",
            "Insights produces metrics; metric filters only highlight text in the console",
            "They are the same feature under two names",
          ],
          correctIndex: 0,
          explanation:
            "If you want to alarm on something in the logs, you need a metric filter, because alarms only watch metrics. Insights is the investigation tool for questions you did not anticipate.",
        },
        {
          id: "aws-cloudwatch-q5",
          prompt: "Which of these increase CloudWatch cost? (Select all that apply.)",
          options: [
            "Log data ingested and stored, especially with no retention policy",
            "Custom metrics, billed per metric and per dimension combination",
            "Logs Insights queries, billed by the volume of data scanned",
            "The number of dashboards' viewers",
            "Alarms in the OK state, which are billed per evaluation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Ingestion, storage, custom metrics and query scanning are the meters. Alarm pricing is per alarm rather than per evaluation, and nobody is billed for looking at a dashboard.",
        },
        {
          id: "aws-cloudwatch-q6",
          prompt: "Why is a user ID a poor choice of metric dimension?",
          options: [
            "Each distinct dimension value creates a separate custom metric, so high cardinality multiplies cost",
            "Dimensions must be numeric",
            "CloudWatch rejects dimension values longer than eight characters",
            "Dimensions are only supported on AWS-published metrics",
          ],
          correctIndex: 0,
          explanation:
            "Metrics are keyed by their full dimension set, so a high-cardinality dimension explodes the metric count. Per-user detail belongs in logs or traces, where you query it rather than pre-aggregate it.",
        },
        {
          id: "aws-cloudwatch-q7",
          prompt: "What do a CloudWatch alarm's `period` and `evaluation periods` control?",
          options: [
            "How wide each data window is, and how many consecutive windows must breach before the state changes",
            "How often the alarm sends a notification, and how long it waits between sends",
            "How long data is retained, and how far back the alarm looks",
            "The delay before the alarm evaluates, and the maximum number of evaluations per day",
          ],
          correctIndex: 0,
          explanation:
            "Together they set how quickly the alarm reacts and how tolerant it is of a single noisy datapoint. Widening them is the usual cure for a flapping alarm.",
        },
        {
          id: "aws-cloudwatch-q8",
          prompt: "A log group holds one stream per container. What is the right way to search across all of them for a request ID?",
          options: [
            "A Logs Insights query over the log group, filtering on the field",
            "Opening each stream in the console and using the browser's find",
            "A metric filter, which returns the matching lines",
            "Downloading the streams and grepping locally",
          ],
          correctIndex: 0,
          explanation:
            "Insights queries the whole group (or several groups) at once and understands structured JSON fields. Metric filters produce numbers, not lines.",
        },
        {
          id: "aws-cloudwatch-q9",
          prompt: "Your alarm should page someone when it fires. What does the alarm itself do?",
          options: [
            "Changes state and publishes to the SNS topics or actions you configured; delivery is SNS's job",
            "Sends the email directly using the account's contact address",
            "Calls a webhook you define in the alarm",
            "Creates a ticket in AWS Support",
          ],
          correctIndex: 0,
          explanation:
            "An alarm's output is an action, almost always an SNS topic that fans out to email, chat or a paging service. Attaching nothing to an alarm is the most common reason an incident is noticed by a customer first.",
        },
        {
          id: "aws-cloudwatch-q10",
          prompt: "What is a composite alarm for?",
          options: [
            "Combining several alarms with boolean logic so you page only when a meaningful combination breaches",
            "Alarming on more than one metric in a single mathematical expression",
            "Grouping alarms on one dashboard",
            "Duplicating an alarm across Regions",
          ],
          correctIndex: 0,
          explanation:
            "Composite alarms suppress noise: \"errors high AND traffic normal\" pages, while either alone does not. Combining metrics in one expression is metric math, which is a different feature.",
        },
      ],
    },

    {
      id: "aws-sqs-sns",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "SQS and SNS: Decoupling with Queues and Topics",
      summary:
        "SQS is a pull-based queue; SNS is a push-based topic. A queue holds work until a consumer asks for it, and exactly one consumer processes each message. A topic delivers a copy of every message to every subscriber and keeps nothing — if a subscriber is down, that delivery is retried and then lost. The standard composition, fan-out, puts an SQS queue behind each SNS subscription so every consumer gets its own durable copy.\n\nThe mechanics that determine correctness are the **visibility timeout** and the **receive count**. Receiving a message does not delete it; it hides it for the visibility timeout while you work. Deleting it is what removes it. If your handler takes longer than the timeout, the message reappears and a second consumer starts processing the same work — the single most common cause of duplicate side effects in production. After `maxReceiveCount` failed attempts the message moves to the **dead-letter queue**, which is where you go looking when messages \"disappear\".\n\nStandard queues are at-least-once with best-effort ordering; you must design idempotent consumers, full stop. FIFO queues give ordering and deduplication, but scoped: ordering holds *within a message group*, so throughput comes from having many groups, and deduplication applies within a time window based on a dedup ID. Choosing FIFO because \"ordering sounds safer\" usually buys a throughput ceiling you did not need.\n\nTwo operational notes. Short polling returns immediately and often empty, and each of those empty receives is a billed request — long polling waits for a message and is cheaper and quieter. And payloads above the message size limit need the extended client library, which stores the body in S3 and sends a pointer, which in turn means your consumers need S3 permissions and a cleanup story.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "AWS: What is Amazon SQS?", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html", kind: "docs" },
        { label: "AWS SQS: Visibility timeout", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html", kind: "docs" },
        { label: "AWS SQS: Dead-letter queues", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html", kind: "docs" },
        { label: "AWS Compute Blog: Choosing between messaging services", url: "https://aws.amazon.com/blogs/compute/choosing-between-messaging-services-for-serverless-applications/", kind: "article" },
      ],
      video: {
        title: "AWS SQS vs SNS vs EventBridge - When to Use What?",
        channel: "Be A Better Dev",
        url: "https://www.youtube.com/watch?v=RoKAEzdcr7k",
        videoId: "RoKAEzdcr7k",
        durationLabel: "22:37",
      },
      alternateVideos: [
        {
          title: "AWS SQS Overview For Beginners",
          channel: "Be A Better Dev",
          url: "https://www.youtube.com/watch?v=CyYZ3adwboc",
          videoId: "CyYZ3adwboc",
          durationLabel: "28:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-sqs-sns-q1",
          prompt:
            "A consumer takes about 90 seconds to process a message; the queue's visibility timeout is 30 seconds. What happens?",
          options: [
            "The message becomes visible again mid-processing and another consumer picks it up, duplicating the work",
            "The message is deleted automatically when the timeout expires",
            "Processing is aborted by SQS after 30 seconds",
            "Nothing — the timeout only applies to the first receive",
          ],
          correctIndex: 0,
          explanation:
            "Visibility timeout must exceed worst-case processing time, or be extended with a heartbeat while work continues. This mismatch is the classic source of double-charged payments and duplicate emails.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-sqs-sns-q2",
          prompt: "What actually removes a message from an SQS queue?",
          options: [
            "An explicit `DeleteMessage` call using the receipt handle from that receive",
            "Successfully receiving it",
            "The visibility timeout expiring without an error",
            "The consumer closing its connection cleanly",
          ],
          correctIndex: 0,
          explanation:
            "Receive-then-delete is what makes SQS at-least-once: a consumer that crashes before deleting lets the message reappear. Deleting before processing turns it into at-most-once and loses work on failure.",
        },
        {
          id: "aws-sqs-sns-q3",
          prompt: "Messages are \"vanishing\" from a queue and never processed successfully. Where do you look?",
          options: [
            "The dead-letter queue — after `maxReceiveCount` failed attempts, messages are moved there",
            "The SNS topic's delivery log",
            "The queue's archive, which keeps deleted messages",
            "CloudTrail, which stores message bodies for audit",
          ],
          correctIndex: 0,
          explanation:
            "A redrive policy quietly moves poison messages to the DLQ, which is the intended behaviour and also why an unmonitored DLQ is a silent data-loss sink. Alarm on its depth.",
        },
        {
          id: "aws-sqs-sns-q4",
          prompt: "Which guarantees does a *standard* SQS queue provide? (Select all that apply.)",
          options: [
            "At-least-once delivery",
            "Best-effort ordering, which may not match send order",
            "Nearly unlimited throughput",
            "Exactly-once processing",
            "Strict FIFO ordering across the whole queue",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Standard queues trade ordering and deduplication for throughput, so consumers must be idempotent. Exactly-once processing and strict ordering are FIFO features, and FIFO has a throughput ceiling in return.",
        },
        {
          id: "aws-sqs-sns-q5",
          prompt: "In a FIFO queue, what is the scope of ordering?",
          options: [
            "Within a message group ID — different groups are processed independently and in parallel",
            "Across the entire queue, with only one consumer at a time",
            "Within a five-minute window, after which order is best-effort",
            "Within a single consumer's batch",
          ],
          correctIndex: 0,
          explanation:
            "Message group ID is both the ordering key and the unit of parallelism, so choosing it well (per customer, per aggregate) is how you get ordering without serialising everything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-sqs-sns-q6",
          prompt: "Why prefer long polling over short polling?",
          options: [
            "It waits for messages instead of returning empty immediately, cutting billed empty receives and reducing latency",
            "It guarantees ordering of returned messages",
            "It allows a larger batch size per receive",
            "It bypasses the visibility timeout",
          ],
          correctIndex: 0,
          explanation:
            "Short polling returns almost instantly, so a tight consumer loop generates a huge number of billed empty responses. Long polling is both cheaper and lower-latency for the message that does arrive.",
        },
        {
          id: "aws-sqs-sns-q7",
          prompt: "Three services each need to react to an `OrderPlaced` event. What is the standard shape?",
          options: [
            "An SNS topic with three SQS queues subscribed, one per consumer",
            "One SQS queue that all three services poll",
            "Three SNS topics, one per service, published to in a loop",
            "One SQS FIFO queue with three message groups",
          ],
          correctIndex: 0,
          explanation:
            "Fan-out gives each consumer its own durable buffer, so a slow or broken consumer neither loses events nor blocks the others. A shared queue means whichever service polls first consumes the message.",
        },
        {
          id: "aws-sqs-sns-q8",
          prompt: "What happens to an SNS message if a subscriber's HTTP endpoint is down?",
          options: [
            "SNS retries according to its delivery policy and then drops it unless a dead-letter queue is configured",
            "SNS stores the message until the endpoint returns",
            "The publish call fails, so the producer can retry",
            "SNS automatically switches the subscription to email",
          ],
          correctIndex: 0,
          explanation:
            "SNS is a delivery service, not a store: durability for a subscriber means an SQS queue in front of it, or a subscription DLQ. The publish itself succeeded the moment SNS accepted the message.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-sqs-sns-q9",
          prompt: "Your payload exceeds the SQS message size limit. What is the supported approach?",
          options: [
            "Store the payload in S3 and send a pointer, which the extended client library does for you",
            "Split it across several messages and reassemble by sequence number",
            "Compress it, which raises the limit automatically",
            "Switch to a FIFO queue, which has no size limit",
          ],
          correctIndex: 0,
          explanation:
            "The claim-check pattern keeps the queue for coordination and S3 for bytes. Splitting means reimplementing ordering and reassembly on a queue that does not promise either.",
        },
        {
          id: "aws-sqs-sns-q10",
          prompt: "You want subscribers to receive only events matching certain attributes. What do you use?",
          options: [
            "An SNS subscription filter policy, so SNS only delivers matching messages",
            "A consumer-side `if` statement, because SNS delivers everything",
            "A FIFO queue with one message group per event type",
            "A separate topic per event type, which is the only option",
          ],
          correctIndex: 0,
          explanation:
            "Filter policies move the decision to the broker, so subscribers stop paying to receive and discard. EventBridge takes the same idea further with content-based rules over the message body.",
        },
        {
          id: "aws-sqs-sns-q11",
          prompt: "A queue's depth is growing steadily while consumers run without errors. What does that tell you?",
          options: [
            "Consumer throughput is below the arrival rate — add consumers or make processing faster",
            "The visibility timeout is too long, so messages are hidden",
            "The DLQ is full and pushing messages back",
            "SQS is throttling the producers",
          ],
          correctIndex: 0,
          explanation:
            "Queue depth is the arrival-minus-service-rate integral, so a steady climb is a capacity problem, not an error problem. It is also the right metric to autoscale consumers on.",
        },
      ],
    },

    {
      id: "aws-secrets",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Secrets Manager and Parameter Store",
      summary:
        "AWS gives you two places to keep configuration and credentials, and the choice is mostly about rotation and money. **SSM Parameter Store** is a hierarchical key-value store with three types — `String`, `StringList` and `SecureString` (encrypted with KMS) — and a standard tier that is free to store. It has no built-in rotation. **Secrets Manager** charges per secret per month plus API calls, and buys you managed rotation (with ready-made Lambda rotation for RDS and friends), staged versions, cross-account resource policies and cross-Region replication.\n\nThe rule of thumb: configuration that is not a credential goes in Parameter Store; credentials that must rotate — database passwords, third-party API keys with a rotation story — go in Secrets Manager. Both encrypt with KMS, and that is where the first trap lives: a principal reading a `SecureString` or a secret needs permission on the *secret* **and** `kms:Decrypt` on the key. AccessDenied with the right secret policy is nearly always the key.\n\nThe second trap is that fetching a secret at runtime does not keep it secret if you then put it somewhere visible. A plaintext value in an ECS task definition's `environment` block, a Lambda environment variable or a Terraform state file is readable by anyone with describe permissions on that resource — the ECS `secrets` block and Lambda's extension exist so the value is resolved at start time and never stored in the definition. Injected values are also resolved *once*, at task start, so a rotated secret does not reach a running task until it is replaced.\n\nFinally, the rotation dance that trips teams up: rotation creates a new version labelled `AWSCURRENT` and moves the old one to `AWSPREVIOUS`, so an application must be able to work with either for a window. And a deleted secret is not gone — it enters a recovery window and the name stays reserved, which is why \"delete and recreate with the same name\" fails until you force it.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "AWS: What is AWS Secrets Manager?", url: "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html", kind: "docs" },
        { label: "AWS Systems Manager: Parameter Store", url: "https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html", kind: "docs" },
        { label: "AWS Secrets Manager: Rotate secrets", url: "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html", kind: "docs" },
        { label: "AWS ECS: Pass sensitive data to a container", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html", kind: "docs" },
      ],
      video: {
        title: "AWS Secrets Manager Deep Dive | Secure Passwords, API Keys & Rotation Explained",
        channel: "DheerajTechInsight",
        url: "https://www.youtube.com/watch?v=aFEbqpuvHOw",
        videoId: "aFEbqpuvHOw",
        durationLabel: "21:35",
      },
      alternateVideos: [
        {
          title: "Secrets Manager vs  Parameter Store: Which Should You Use?",
          channel: "Cloudmancer",
          url: "https://www.youtube.com/watch?v=ULU2cRQI4hY",
          videoId: "ULU2cRQI4hY",
          durationLabel: "5:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-secrets-q1",
          prompt:
            "A task role has `secretsmanager:GetSecretValue` on the right secret, but the call fails with AccessDenied. What is the usual missing permission?",
          options: [
            "`kms:Decrypt` on the KMS key the secret is encrypted with",
            "`secretsmanager:ListSecrets` on the account",
            "`ssm:GetParameter`, which Secrets Manager calls internally",
            "`iam:PassRole` for the secret's resource policy",
          ],
          correctIndex: 0,
          explanation:
            "Encryption and access are two separate authorisations, and a customer-managed key's policy is a third place a deny can hide. The same applies to `SecureString` parameters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-secrets-q2",
          prompt: "Where does a value end up in plaintext if you put it in an ECS task definition's `environment` block?",
          options: [
            "In the task definition itself, readable by anyone who can describe it, and in your IaC state",
            "Nowhere — ECS encrypts environment variables automatically",
            "Only in the container's memory at runtime",
            "In CloudWatch Logs, but nowhere else",
          ],
          correctIndex: 0,
          explanation:
            "Task definitions are plain API objects. The `secrets` block references a Secrets Manager or Parameter Store ARN so the value is resolved at start time and never persisted in the definition.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-secrets-q3",
          prompt: "Which is the main capability Secrets Manager has that Parameter Store does not?",
          options: [
            "Built-in, scheduled rotation with managed rotation functions for supported services",
            "KMS encryption of stored values",
            "Hierarchical paths for organising values",
            "IAM-based access control",
          ],
          correctIndex: 0,
          explanation:
            "Both encrypt with KMS and both use IAM; rotation (plus staged versions and cross-Region replication) is what you are paying for. Hierarchical paths are actually a Parameter Store strength.",
        },
        {
          id: "aws-secrets-q4",
          prompt: "A database password is rotated in Secrets Manager. A long-running ECS task keeps using the old one. Why?",
          options: [
            "Secrets injected through the task definition are resolved once at task start, so the task needs replacing",
            "Rotation only applies to new secrets, not existing ones",
            "The task's execution role lost permission when the version changed",
            "Secrets Manager caches the old value for 24 hours",
          ],
          correctIndex: 0,
          explanation:
            "Injection is a start-time operation, so rotation must be paired with a deployment or with code that fetches the secret at runtime and refreshes it. This is exactly why rotation keeps the previous version working for a window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-secrets-q5",
          prompt: "What do the staging labels `AWSCURRENT` and `AWSPREVIOUS` mean during rotation?",
          options: [
            "`AWSCURRENT` points at the new version and `AWSPREVIOUS` at the one before, so clients mid-rotation can still succeed",
            "They mark which Region a replicated secret came from",
            "They distinguish encrypted from plaintext versions",
            "They indicate whether rotation succeeded or failed",
          ],
          correctIndex: 0,
          explanation:
            "Keeping the previous version valid is what makes zero-downtime rotation possible: the old credential works until every client has picked up the new one.",
        },
        {
          id: "aws-secrets-q6",
          prompt: "Which of these belong in Parameter Store rather than Secrets Manager? (Select all that apply.)",
          options: [
            "A feature flag value",
            "The URL of an internal service",
            "An AMI ID used by your deployment pipeline",
            "A database password with a monthly rotation requirement",
            "A third-party API key that must be rotated automatically",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Non-secret configuration is exactly what Parameter Store's free standard tier is for. Anything with a rotation requirement is what you pay Secrets Manager for.",
        },
        {
          id: "aws-secrets-q7",
          prompt: "You delete a secret and immediately try to create a new one with the same name. It fails. Why?",
          options: [
            "Deletion schedules removal after a recovery window, and the name stays reserved until then",
            "Secret names can never be reused in an account",
            "The name is still cached by IAM for up to an hour",
            "A replica in another Region is holding the name",
          ],
          correctIndex: 0,
          explanation:
            "The recovery window is a deliberate safety net against accidental deletion; forcing immediate deletion is an explicit flag. This regularly breaks teardown-and-rebuild scripts in CI.",
        },
        {
          id: "aws-secrets-q8",
          prompt: "A high-traffic Lambda fetches its secret on every invocation and starts hitting throttling. What is the fix?",
          options: [
            "Cache the value in the execution environment (or use the parameters and secrets extension) and refresh periodically",
            "Move the secret into an environment variable in plaintext",
            "Request a quota increase for the function's concurrency",
            "Switch the secret to a `String` parameter to avoid KMS calls",
          ],
          correctIndex: 0,
          explanation:
            "Fetch once per environment, not once per request — that is what module scope and the caching extension are for. Putting the value in a plaintext variable solves throttling by removing the protection.",
        },
        {
          id: "aws-secrets-q9",
          prompt: "Who should be able to read a production database secret?",
          options: [
            "The workload's role, plus a narrow break-glass role that is audited",
            "Every developer, so they can debug quickly",
            "Anyone with console access, since the value is encrypted at rest",
            "Only the account root user",
          ],
          correctIndex: 0,
          explanation:
            "Encryption at rest protects the storage, not the API call — read access is an IAM decision. Restricting it to the workload plus an audited break-glass path is the pattern worth defending in review.",
        },
      ],
    },

    {
      id: "aws-cost",
      moduleId: "devops-aws-core",
      trackId: "devops",
      title: "Cost: Where the Surprise Bill Comes From",
      summary:
        "AWS bills are surprising for a structural reason: the expensive things are rarely the things you think you bought. Compute and storage are visible and roughly predictable. What catches teams is the *connective tissue* — data movement, idle-but-allocated resources, and per-request charges on services that felt free in development. None of the specific rates in this topic are worth memorising (they change, and \"as of this writing\" is the only honest framing), but the *shapes* are stable and that is what you should carry.\n\nThe usual suspects, in roughly the order they appear in a small account's bill. **NAT Gateway** charges an hourly rate *and* a per-GB processing fee on everything that passes through it — including traffic to S3 in the same Region, which a gateway endpoint would have carried for nothing. **Cross-AZ traffic** is billed in both directions, so a chatty service spread over three AZs pays twice per byte for the privilege. **Data transfer out to the internet** is the one everyone knows about; transfer *in* generally is not charged, which is why egress-heavy products are the ones that feel the bill. **Public IPv4 addresses** are charged whether attached or unused. And idle resources — unattached EBS volumes, old snapshots, a load balancer with no targets, a forgotten dev NAT — bill at full rate forever.\n\nPer-request meters are the second category. S3 charges for requests separately from storage, so a job listing millions of keys costs money the storage graph never shows. CloudWatch charges for ingestion, storage and Insights scanning, with log retention defaulting to forever. Lambda and API Gateway are per-invocation and per-request, which is cheap until a retry storm makes it not.\n\nSeeing it before it arrives takes three habits: **cost allocation tags** activated and enforced so Cost Explorer can attribute spend to a team or service; **AWS Budgets** with alerts — remembering that a budget alerts rather than stops, unless you explicitly configure budget actions; and a monthly skim of Cost Explorer grouped by service and by usage type, which is where an unfamiliar line like `NatGateway-Bytes` announces itself. Cost data is refreshed on a schedule rather than in real time, so a runaway cost is visible in hours, not seconds — which is an argument for guardrails rather than vigilance.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "AWS: Analyzing costs with Cost Explorer", url: "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html", kind: "docs" },
        { label: "AWS: Managing costs with AWS Budgets", url: "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html", kind: "docs" },
        { label: "AWS Architecture Blog: Data transfer costs for common architectures", url: "https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/", kind: "article" },
        { label: "AWS Well-Architected: Cost Optimization Pillar", url: "https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html", kind: "docs" },
      ],
      video: {
        title: "Networking in the Cloud Fundamentals: Data Transfer Pricing",
        channel: "Last Week in AWS",
        url: "https://www.youtube.com/watch?v=qgMhKlapNIs",
        videoId: "qgMhKlapNIs",
        durationLabel: "16:41",
      },
      alternateVideos: [
        {
          title: "CLOUD FINOPS - Understand AWS Data TRANSFER Charges in DETAIL | @knowledgeindia",
          channel: "knowledgeindia - LearnCloud",
          url: "https://www.youtube.com/watch?v=vX7KsC8oM2w",
          videoId: "vX7KsC8oM2w",
          durationLabel: "21:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aws-cost-q1",
          prompt:
            "A data pipeline in private subnets reads terabytes from S3 in the same Region, through a NAT Gateway. What is the cheapest structural change?",
          options: [
            "Add a gateway VPC endpoint for S3 so the traffic bypasses the NAT Gateway entirely",
            "Move the pipeline to a larger instance type to finish faster",
            "Enable S3 Transfer Acceleration",
            "Move the bucket to another Region closer to the subnets",
          ],
          correctIndex: 0,
          explanation:
            "A NAT Gateway bills per GB processed, and same-Region S3 traffic does not need to go through it at all. A gateway endpoint costs nothing for the endpoint itself and removes the per-GB charge.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cost-q2",
          prompt: "Why is chatty traffic between services in different Availability Zones more expensive than it looks?",
          options: [
            "Cross-AZ transfer is charged on both the sending and receiving side",
            "It is routed through a NAT Gateway automatically",
            "It leaves the Region and is charged as internet egress",
            "It forces both services onto larger instance types",
          ],
          correctIndex: 0,
          explanation:
            "You pay for data out of the source AZ and into the destination AZ. AZ-aware routing — keeping a request's whole path inside one zone where reliability allows — is a real optimisation at scale.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cost-q3",
          prompt: "You stop an EC2 instance for a month to save money. What keeps billing?",
          options: [
            "Its EBS volumes, its snapshots, and any allocated public IPv4 address",
            "Nothing — a stopped instance costs nothing at all",
            "Only the AMI it was launched from",
            "The instance itself, at a reduced stopped-instance rate",
          ],
          correctIndex: 0,
          explanation:
            "Stopping releases the compute, not the storage or the address. This is why a \"we turned it off\" dev environment still shows up on the bill every month.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cost-q4",
          prompt: "Which of these generate charges even when nobody is using them? (Select all that apply.)",
          options: [
            "An unattached EBS volume",
            "A NAT Gateway with no traffic",
            "An allocated public IPv4 address that is not in use",
            "An S3 bucket with no objects",
            "An IAM role that is never assumed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything *allocated* bills, whether used or not — which is why an idle-resource sweep is usually the fastest saving available. Empty buckets and IAM objects are free.",
        },
        {
          id: "aws-cost-q5",
          prompt: "A Budget is configured with an alert threshold. Spend blows past it. What happens?",
          options: [
            "You get a notification; nothing stops unless you configured budget actions explicitly",
            "AWS stops creating new resources in the account",
            "Running resources are throttled until the next billing period",
            "The account is suspended and requires support to reinstate",
          ],
          correctIndex: 0,
          explanation:
            "Budgets are a smoke alarm, not a sprinkler. Budget actions can apply a restrictive policy or stop instances, but they are opt-in and need setting up before the incident.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aws-cost-q6",
          prompt: "The S3 line on the bill is far larger than the stored-bytes graph suggests. What is the most likely explanation?",
          options: [
            "Request charges from a job doing very large numbers of `LIST` or `GET` operations",
            "A minimum monthly charge applied per bucket",
            "Cross-AZ replication inside the Region",
            "Charges for objects that were deleted during the month",
          ],
          correctIndex: 0,
          explanation:
            "Requests are their own meter and a chatty pipeline can out-bill the data itself. Early-deletion charges on IA and archive classes are the other S3 surprise worth knowing about.",
        },
        {
          id: "aws-cost-q7",
          prompt: "Which direction of internet data transfer is generally free?",
          options: [
            "Inbound to AWS; outbound to the internet is what is charged",
            "Outbound to the internet; inbound is charged per GB",
            "Both directions are charged at the same rate",
            "Neither — all internet transfer is free within a Region",
          ],
          correctIndex: 0,
          explanation:
            "Ingress being free and egress being charged is the shape that makes AWS cheap to fill and expensive to leave, and it is why media-heavy products care so much about CDN hit rates.",
        },
        {
          id: "aws-cost-q8",
          prompt: "How do you make Cost Explorer show spend per team or per service?",
          options: [
            "Tag resources consistently and activate those tags as cost allocation tags",
            "Create a separate Budget per team",
            "Group by Region, which maps to teams",
            "Nothing is needed; Cost Explorer infers ownership from who created the resource",
          ],
          correctIndex: 0,
          explanation:
            "Attribution needs tags, and tags only appear in reports once activated — and only from the point of activation forward, which is why doing it early matters. Separate accounts per environment are the stronger version of the same idea.",
        },
        {
          id: "aws-cost-q9",
          prompt: "A team runs one NAT Gateway per AZ across three AZs in a lightly used development VPC. What is the sensible review comment?",
          options: [
            "In a dev VPC, one NAT (or VPC endpoints and no NAT) is usually enough — three hourly charges buy availability nobody needs there",
            "Three NAT Gateways is always correct; availability should not vary by environment",
            "Replace them with an Internet Gateway per AZ, which is cheaper",
            "NAT Gateways are free below a usage threshold, so it does not matter",
          ],
          correctIndex: 0,
          explanation:
            "NAT-per-AZ is right in production, where cross-AZ charges and failure isolation justify it, and hard to justify in a dev account that nobody is paged for. Internet Gateways are not a substitute — they only work for resources with public IPs.",
        },
        {
          id: "aws-cost-q10",
          prompt: "What is the mechanism behind a Savings Plan or Reserved Instance?",
          options: [
            "A commitment to a level of spend or usage over a term, in exchange for a lower rate",
            "A discount applied automatically once your bill passes a threshold",
            "A refund of unused capacity at the end of each month",
            "A cap that prevents spend from exceeding the committed amount",
          ],
          correctIndex: 0,
          explanation:
            "You are pre-buying usage, so under-using a commitment means paying for capacity you did not consume. That makes them a good fit for a stable baseline and a bad fit for a workload you might re-architect next quarter.",
        },
        {
          id: "aws-cost-q11",
          prompt: "How quickly will a runaway cost appear in Cost Explorer?",
          options: [
            "Within hours, because cost data is refreshed on a schedule rather than in real time",
            "Within seconds, as the resource is created",
            "Only at the end of the billing month",
            "Only after the invoice is finalised",
          ],
          correctIndex: 0,
          explanation:
            "The lag is why detection alone is a weak control: by the time a misconfigured job shows up, it has been running for hours. Guardrails — SCPs, budget actions, quotas — are what actually bound the damage.",
        },
      ],
    },
  ],
} satisfies Module;
