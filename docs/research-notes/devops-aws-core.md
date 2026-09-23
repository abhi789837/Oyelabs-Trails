# AWS Core research notes (2026-09-23)

Fourth camp of the DevOps & Cloud track. 16 topics, all `quiz` — the sandbox runs JavaScript only
and there is no AWS to grade against, so difficulty is carried by read-this-policy and
read-this-configuration questions (IAM policy documents, a security-group pair, a bucket policy,
a route table) per the `## v3 decisions` precedent in `docs/PROGRESS.md`. 169 questions total.

## Scope decisions

- **16 topics, three merges.** The brief lists ~20 discrete services; three were folded to stay in
  the 13–16 range without dropping anything named:
  - **IAM Identity Center folded into `aws-iam-roles`.** Identity Center provisions and assumes
    roles, so "trust policies + STS + Identity Center" is one coherent topic: workload access and
    human access, both as role assumption. The Cybr Identity Center video is the alternate.
  - **ElastiCache folded into `aws-rds-aurora`** as "the managed data tier" (cache-aside, stampede,
    Redis/Valkey vs Memcached get four of the eleven questions).
  - **EBS and `gp3` folded into `aws-ec2`**, where instance store vs EBS is the decision that
    actually gets made.
  - **Route 53 + CloudFront + ALB + API Gateway merged into `aws-front-door`**, framed as the
    request path from DNS to the app. This makes the ALB-vs-API-Gateway comparison the quiz's
    centrepiece rather than a separate topic, and it has four videos (one primary, three alternates)
    because no single video covers all four services.
- **Milestones:** `aws-iam-policies` (expert), `aws-vpc-subnets` (advanced), `aws-cost` (advanced).
  The first two are named in the brief; cost is the third because it is the material most likely to
  be missing from an engineer's AWS model and the one with the largest real-world consequence.
- **No numbers as answers.** Per the brief's constraint, no correct option in this camp is a price,
  a free-tier limit, a quota or an instance-type spec. The cost topic asks about *mechanisms*:
  that NAT Gateway bills per GB processed, that cross-AZ is billed on both sides, that S3 requests
  are a separate meter from storage, that a Budget alerts rather than stops, that allocated-but-idle
  resources bill at full rate. The one structural constant used (five reserved IPs per subnet) is a
  protocol fact, not a price.
- **Out of scope, left to siblings:** Linux, DNS/TLS protocol detail, nginx/Caddy, Terraform
  (mentioned once, in `aws-secrets`, as a place plaintext secrets leak — not taught), Kubernetes
  (EKS named only in passing in the ECS topic), observability tooling beyond CloudWatch itself.

## Videos

All 16 primary and 17 alternate videos were found with `yt.mjs search` and confirmed with
`yt.mjs info` (`embeddable: true`, title/channel/duration read from the response). No search-URL
fallbacks.

- `aws-mental-model`: "AWS Certified Cloud Practitioner Certification Course 2026 (CLF-C02)"
  (freeCodeCamp.org, 13:46:27) at **5214s, "AWS Global Infrastructure"**. Chosen for recency —
  published May 2026, so the console and service set are current. Alternate: AWS's own
  "Simplify the AWS Shared Responsibility Model" (6:41).
- `aws-iam-policies`: **AWS's own** "IAM Policy Evaluation Series: AWS IAM policy language
  explained" (38:34) with "policy evaluation chains" (43:02) as the alternate. These two are the
  best free explanation of the evaluation algorithm anywhere, and they are first-party.
- `aws-iam-roles`: "AWS Assume IAM Role - Step by Step tutorial" (Rahul Wagh, 17:23). Alternate:
  "Enable Identity Center (SSO) - AWS SCS-C03" (Cybr, 11:45, **Feb 2026** — the most recent
  Identity Center walkthrough found, which matters because that console changed).
- `aws-vpc-subnets`: "Introduction to Amazon VPC (with Console Tutorial)" (Be A Better Dev,
  1:09:59, May 2024) at **375s, "How do VPCs work?"**. Alternate: Sam Meech-Ward's concise
  "AWS VPC & Subnets For Beginners" (16:39).
- `aws-security-groups-nacls`: "AWS VPC Beginner to Pro" (freeCodeCamp.org, 2:11:41) at **2725s,
  "Security Groups and Network ACL"**. Deliberately a *different* course from the VPC topic so the
  two camps' videos do not overlap. Alternate: Anthony Sequeira's 4-minute comparison.
- `aws-ec2`: the CLF-C02 course at **24619s, "EC2"**. Alternate: StratusGrid's "Understanding
  Amazon EC2 Instance Metadata Service v2 Hop Limit" (25:10) — low view count (about 1.2k) but it
  is the only video found that covers the hop-limit trap properly, which is the IMDSv2 issue teams
  actually hit.
- `aws-s3`: "AWS S3 Tutorial For Beginners" (Be A Better Dev, 27:18), alternate "AWS S3 Lifecycle
  Rules" (12:01).
- `aws-s3-access`: "Amazon S3 Access Control - IAM Policies, Bucket Policies and ACLs"
  (Digital Cloud Training, 19:44, 2021). **Predates the April 2023 defaults change** (BPA on and
  ACLs disabled for new buckets); the summary and questions state the current defaults explicitly
  so the topic does not inherit the video's age. Alternate: Milan Jovanović's presigned URL
  tutorial (14:46, Aug 2025).
- `aws-rds-aurora`: the CLF-C02 course at **21167s, "Databases"** (covers RDS, Aurora and
  ElastiCache, which matches the merged scope). Alternates: "Multi-AZ vs Read Replicas"
  (BeSA Cloud Academy, 7:26) and Arpit Bhayani's "Storage-Compute Separation | Aurora Paper Deep
  Dive" (17:09) for the architectural *why*.
- `aws-lambda`: "AWS Lambda Function Execution and Cold Start" (Be A Better Dev, 13:16).
  Alternates: "AWS Lambda Concurrency: The Complete Mental Model" (System Design Lab, Jun 2026)
  and AWS's own "How do I provide internet access to a Lambda function that's connected to an
  Amazon VPC?" — the VPC trap, straight from the source.
- `aws-ecs-fargate`: "Containers on AWS Overview: ECS | EKS | Fargate | ECR" (TechWorld with Nana,
  25:10). Alternates: Be A Better Dev's "ECS vs Fargate" and KodeKloud's full ECS tutorial.
- `aws-front-door`: "AWS ALB - Step By Step Tutorial" (Rahul Wagh, 25:24) plus three alternates:
  Route 53 basics (Tiny Technical Tutorials), CloudFront caching and behaviors (Digital Cloud
  Training), REST vs HTTP APIs in API Gateway (Be A Better Dev). Four videos for a four-service
  topic.
- `aws-cloudwatch`: "AWS Cloudwatch Logs Core Concepts" (Be A Better Dev, 13:33, Nov 2024),
  alternate "AWS Cloudwatch Alarm Setup Tutorial" (16:53).
- `aws-sqs-sns`: "AWS SQS vs SNS vs EventBridge - When to Use What?" (Be A Better Dev, 22:37),
  alternate "AWS SQS Overview For Beginners" (28:48).
- `aws-secrets`: "AWS Secrets Manager Deep Dive" (DheerajTechInsight, 21:35, Nov 2025), alternate
  "Secrets Manager vs Parameter Store" (Cloudmancer, 5:57).
- `aws-cost`: "Networking in the Cloud Fundamentals: Data Transfer Pricing" (**Last Week in AWS**,
  16:41, Nov 2024) — Corey Quinn's channel is the canonical source on AWS bill shock, and the video
  is about the *shape* of transfer pricing rather than rates. View count on that upload is very low
  but the channel and content are genuine. Alternate: knowledgeindia's 21-minute FinOps data
  transfer breakdown.

### Channel finding worth recording

**Every `Abhishek.Veeramalla` video checked returns `embeddable: false`** — `TtlKFgfN3PU` (Day-5
Security Group and NACL, 375k views), `P8g7Z4NYk3Q` (Day-4 VPC, 452k views) and `FllcHYsBm78`
(Day-23 Secret Management, 88k views) were all strong topical matches and all unusable. That
channel is popular in AWS/DevOps search results, so future camps in this track should check
embeddability before planning around it — same situation as Vandad Nahavandipoor in the mobile
track.

## References

All URLs checked with `check-urls.mjs`; every one returns 200 and none came back `unverifiable`
(`docs.aws.amazon.com` serves distinct content per path, so the SPA false-positive problem does not
arise there). `docs.aws.amazon.com` is first in every topic's list.

Redirects followed and final URLs used:

- `IAM/.../id_roles_terms-and-concepts.html` → `id_roles.html` (used the target; a different page
  was chosen for the second ref).
- `lambda/.../foundation-networking.html` → `lambda/.../configuration-vpc.html`.
- `AmazonCloudWatch/.../AlarmThatSendsEmail.html` → `.../CloudWatch_Alarms.html`.
- `AmazonECS/.../networking-connecting-services.html` → `.../interconnecting-services.html`
  (not used in the end).
- `aws.amazon.com/builders-library/...` now redirects to `builder.aws.com/content/...` — the
  Builders' Library articles considered for the SQS topic were dropped in favour of the AWS Compute
  Blog messaging-services comparison, which is stable at its original URL.

Dead or blocked, so not used:

- `https://www.lastweekinaws.com/blog/the-aws-managed-nat-gateway-is-unpleasant-and-not-recommended/`
  — **403 (Cloudflare challenge)**. Would have been the ideal NAT-cost reference; the AWS
  Architecture Blog's "Overview of Data Transfer Costs for Common Architectures" is used instead.
- `https://www.allthingsdistributed.com/files/p1041-verbitski.pdf` (the Aurora SIGMOD paper) —
  **403**. Replaced with the Aurora storage architecture docs page; Arpit Bhayani's paper walkthrough
  covers the same ground as an alternate video.
- `aws.amazon.com/blogs/networking-and-content-delivery/overview-of-data-transfer-costs-...` — 404;
  the article lives under `/blogs/architecture/`.
- `docs.aws.amazon.com/whitepapers/latest/how-aws-pricing-works/welcome.html` and
  `AmazonCloudWatch/.../CloudWatch-Embedded-Metric-Format.html` are **meta-refresh stubs**; neither
  was needed, so no substitute was cited.

Interview-prep / repo references used: `github.com/bregman-arie/devops-exercises/tree/master/topics/aws`
(`aws-iam-policies`, `aws-security-groups-nacls`) and `github.com/open-guides/og-aws`
(`aws-s3`, module-level). There is no AWS equivalent of `lydiahallie/javascript-questions`; og-aws
is dated in places, so it is cited for orientation rather than for current-facts.

Iframe previews: every `docs.aws.amazon.com` and `aws.amazon.com` URL reports
`embeddable: false` (X-Frame-Options), so the app's link-preview fallback will be used for all of
them. `github.com` blocks framing too. No reference in this camp will render inline.

## Facts verified

Checked against AWS documentation at the URLs cited above, on 2026-09-23. All three facts from
`CONTENT_GUIDE.md` §10b were re-confirmed rather than assumed.

- **IAM Identity Center is the recommended path for human access**, with IAM users reserved for
  specific workloads (`IAM/latest/UserGuide/best-practices.html`, `singlesignon/latest/userguide/what-is.html`).
- **IMDSv2 is required on new instances**; IMDSv2 uses a `PUT` token exchange and a response hop
  limit that defaults to 1 (`AWSEC2/.../configuring-instance-metadata-service.html`). The
  container-hop-limit trap is built from this.
- **`gp3` is the current general-purpose EBS default**, and its distinguishing property is that
  IOPS and throughput are provisioned independently of capacity
  (`ebs/latest/userguide/general-purpose.html`).
- **S3 defaults since April 2023**: new buckets have Block Public Access on and Object Ownership
  set to "bucket owner enforced", which disables ACLs
  (`AmazonS3/.../access-control-block-public-access.html`, `.../about-object-ownership.html`).
- **S3 strong read-after-write consistency** for all operations including LIST
  (`AmazonS3/latest/userguide/Welcome.html`).
- **Five IP addresses reserved per subnet**, minimum `/28`
  (`vpc/latest/userguide/configure-subnets.html`).
- **Security group references do not work across inter-Region VPC peering**
  (`vpc/latest/userguide/vpc-security-groups.html`).
- **Role chaining caps a session at one hour** regardless of `MaxSessionDuration`
  (`STS/latest/APIReference/API_AssumeRole.html`).
- **Reserved concurrency is both a guarantee and a cap**; provisioned concurrency only removes cold
  starts up to the configured number (`lambda/latest/dg/lambda-concurrency.html`,
  `.../provisioned-concurrency.html`).
- **RDS automated backups are deleted with the instance** unless a final snapshot is taken
  (`AmazonRDS/.../USER_WorkingWithAutomatedBackups.html`); a Multi-AZ *instance* standby serves no
  read traffic (`.../Concepts.MultiAZ.html`) — the question is worded to say "instance deployment"
  because Multi-AZ DB *clusters* do have readable standbys.
- **CloudWatch log group retention defaults to "Never expire"**
  (`AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html`), and memory/disk-usage
  metrics require the CloudWatch agent.
- **SCPs do not apply to the Organization's management account** and never grant permissions
  (`organizations/latest/userguide/orgs_manage_policies_scps.html`).

Deliberately *not* asserted anywhere: any price, free-tier allowance, service quota, default
visibility timeout value, maximum message size, Lambda memory ceiling, or the vCPU-per-MB ratio.
Where those mattered to a question, the question asks about the relationship instead of the number.
