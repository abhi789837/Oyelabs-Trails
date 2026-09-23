# Infrastructure as Code research notes (2026-09-23)

`devops-terraform`, DevOps & Cloud track, prefix `tf-`. 15 topics, 169 quiz questions, no code
challenges (see **Assessment shape** below).

**Scope decision.** The brief lists 16 distinct subjects but asks for 12–15 topics, so two merges
were made: expressions/functions folded into the HCL topic (the brief lists them in one bullet),
and provisioners folded in with data sources as "reaching outside the configuration". That lands
on 15. The licence question is a clearly-marked final section of `tf-why-iac` plus two quiz
questions, not a separate topic and not a running theme.

Everything is taught through Terraform but aimed at the person who *inherits* Terraform: reading
a plan you did not write, finding `# forces replacement` before approving, discovering that
someone clicked in the console, and finding a module pinned to a tag that no longer exists. The
edge-case questions are built from those four situations.

Kubernetes, AWS services, Linux, networking and observability are deliberately absent — AWS
resources appear in examples only.

## Topics

1. `tf-why-iac` — Why Infrastructure as Code, and What Declarative Costs You (intermediate)
2. `tf-hcl-language` — HCL: Resources, Variables, Outputs, Locals and Expressions (intermediate)
3. `tf-providers-versions` — Providers, Version Constraints and the Lock File (intermediate)
4. `tf-state` — State: What It Is and Why It Is the Whole Ballgame (advanced, **milestone**)
5. `tf-remote-state-locking` — Remote State, Locking, and a Lost State File (expert, **milestone**)
6. `tf-plan-apply` — The Plan/Apply Cycle: Reading a Plan Properly (advanced)
7. `tf-dependencies` — Dependencies: Implicit, Explicit and the Graph (advanced)
8. `tf-modules` — Modules: Writing, Composing and Versioning (advanced)
9. `tf-count-for-each` — count vs for_each and the Index-Shift Trap (advanced)
10. `tf-data-sources-provisioners` — Data Sources, and Provisioners as a Last Resort (intermediate)
11. `tf-environments` — Environments: Workspaces, Directories and Terragrunt (advanced)
12. `tf-import-drift` — Importing Existing Infrastructure and Handling Drift (advanced)
13. `tf-secrets` — Secrets, and Why State Holds Them in Plaintext (advanced)
14. `tf-testing-policy` — Testing and Policy as Code (advanced)
15. `tf-cicd` — Terraform in CI/CD: Plan on PR, Apply on Merge (advanced, **milestone**)

## Videos

27 distinct ids, every one confirmed with `yt.mjs info` (title, channel, duration, `embeddable:
true`). No search-URL fallbacks.

Two long courses carry the chapter deep-links:

- **`7xngnjfIlK4`** — "Complete Terraform Course - From BEGINNER to PRO!" (**DevOps Directive**,
  2:38:04). Chapters read off the watch page: 251s IaC evolution, 876s Terraform overview, **1712s
  Part 3: Basic Terraform Usage**, 3503s Variables and Outputs, 4280s Additional Language Features,
  4802s Project Organization + Modules, 5766s Managing Multiple Environments, **6965s Part 8:
  Testing Terraform Code**, **7984s Part 9: Developer Workflows and Automation**. Used at 1712s
  for `tf-plan-apply`, 6965s for `tf-testing-policy` and 7984s for `tf-cicd`.
- **`YcJ9IeukJL8`** — "Terraform Tutorial for Beginners + Labs" (**KodeKloud**, 1:55:06). Chapters:
  533s What is IaC, 1367s What is HCL, 2428s Using Providers, **4201s Resource Dependencies**,
  4332s Output Variables, **4468s Purpose of State**, 4835s State Considerations, 5678s Lifecycle
  Rules, 6026s Data Sources, 6381s for_each, **6573s Version Constraints**. Used at 6573s for
  `tf-providers-versions`, 4468s for `tf-state` and 4201s for `tf-dependencies`.

Primary videos per topic:

- `tf-why-iac` → `POPP2WTJ8es` "What is Infrastructure as Code?" (TechWorld with Nana, 8:03).
  Alternates `zWw2wuiKd5o` (IBM Technology, 8:51) and `HzBA6FIn_Bo` "The ruthless forking of
  Terraform" (Fireship, 3:19) for the licence section.
- `tf-hcl-language` → `weLkaZgyaOI` "Day 5/28 - Terraform Variables" (Tech Tutorials with Piyush,
  20:29). Alternate `7S94oUTy2z4` "Terraform Tips & Tricks: loops, if-statements" (Anton Putra).
- `tf-remote-state-locking` → `YsEdrl9O5os` "4/30 - State file management with AWS S3"
  (Piyush, 17:25). Alternate `AmWnWfuSTfQ` (Automation Avenue, 8:46) — the only reasonable video
  found that covers `use_lockfile` specifically.
- `tf-modules` → `GSXx8AZjKK4` "Terraform Basics: Modules" (Ned in the Cloud, 15:23).
  Alternate `a_j6Gq-KtxE` (Piyush, 32:32).
- `tf-count-for-each` → `XMMsnkovNX4` "8/30 - Meta Arguments" (Piyush, 29:24).
  Alternate `MrL-QeIjK60` (DevOps with Flavius, 9:46).
- `tf-data-sources-provisioners` → `vCUdKKD3Kfk` (Rahul Wagh, 13:47), with `DkhAgYa0448` (Piyush)
  and `xZGO7gYGlQY` (Rahul Wagh) as the provisioner halves.
- `tf-environments` → `6QgHLncP5VA` "Terraform Workspaces Are Bad Actually" (Ned in the Cloud,
  20:32) — it frames the topic exactly as the camp does. Alternates `nMVXs8VnrF4` (Anton Putra,
  project structure) and `yduHaOj3XMg` (Anton Putra, Terragrunt).
- `tf-import-drift` → `Qzk1M2r9VM8` (Bryan Krausen, 15:23, Mar 2025). Alternates `y8_5Ud29W8o`
  (HashiCorp's own channel, config-driven import) and `nRgNIy-SDEw` (Piyush, drift detection).
- `tf-secrets` → `3N0tGKwvBdA` (Anton Putra, 15:53). Alternate `x92u3nn3eLA` "Write-Only Args in
  Terraform 1.11" (Ned in the Cloud) — the only current video found on the 1.10/1.11 story.
- `tf-testing-policy` → DevOps Directive @6965. Alternates `4U2S6sXcuac` (Ned, test framework) and
  `FDghIoMS9nU` (Ned, OPA).
- `tf-cicd` → DevOps Directive @7984. Alternate `cRnmyzT9gtU` (Piyush, GitHub Actions).

**Rejected, and why it matters:** **every Abhishek.Veeramalla video is `embeddable: false`** —
checked `UhNpn7lVRBY` ("Day-4 Terraform State DeepDive", 175k views) and `xBWmBPVTums` ("Day-3
Terraform Modules", 247k views). Both were the strongest search results for state and for modules
and both had to be replaced. Worth recording alongside the Vandad Nahavandipoor note from the
mobile camps.

Also considered and not used: `SLB_c_ayRMo` (freeCodeCamp, 2:20:58, 2019 — pre-1.0 and shows
0.12-era workflows), `V4waklkBC38` (freeCodeCamp cert course, 13:10:04 — exam-shaped, poor chapter
mapping), `l5k1ai_GBDE` (TechWorld with Nana "Terraform in 15 mins" — fine but overlaps
`POPP2WTJ8es`), `o04xfWEouKM` (Cloud Champ remote backend — teaches the deprecated DynamoDB
locking as the current approach).

## References

55 distinct URLs, all 200, none flagged `unverifiable`.

- **`developer.hashicorp.com` is verifiable**, contrary to the warning in the brief: a deliberately
  bogus path (`/terraform/language/nonsense-does-not-exist-xyz`) returns a real 404 with a 5.5 KB
  body, so the checker's probe distinguishes good paths from bad ones. No page needed a second
  verification route.
- **It blocks framing** (`X-Frame-Options: SAMEORIGIN`), so almost every reference card in this camp
  falls back to a link preview. Same for `martinfowler.com`, `gruntwork.io`, `github.com` and
  `runatlantis.io`. The four that *do* preview inline are `opentofu.org`, `docs.terragrunt.com`,
  `openpolicyagent.org` and `terraform-best-practices.com`.
- **Redirects followed and the final URL used**: `/language/resources/syntax` →
  `/language/block/resource`; `/language/modules/syntax` → `/language/block/module`;
  `/language/modules/sources` → `/language/modules/configuration`; `/language/resources/behavior`
  → `/language/resources`; `/language/resources/provisioners/syntax` → `/language/provisioners`;
  `/language/state/sensitive-data` → `/language/manage-sensitive-data`;
  `/language/resources/ephemeral` → `/language/manage-sensitive-data/ephemeral`;
  `/language/checks` → `/language/validate`;
  `terragrunt.gruntwork.io/docs/getting-started/quick-start/` → `docs.terragrunt.com/getting-started/quick-start/`;
  `blog.gruntwork.io/how-to-manage-terraform-state-28f5697e68fa` →
  `www.gruntwork.io/blog/how-to-manage-terraform-state`.
- **Dropped:** `https://www.hashicorp.com/license-faq` returns **429** (a Vercel bot checkpoint) on
  every attempt, so it is not shipped even though it is the canonical BUSL FAQ. The licence facts
  are sourced from the LICENSE file in the repository instead.
  `https://registry.terraform.io/providers/hashicorp/aws/latest/docs` is flagged `unverifiable`
  (the registry is an SPA that answers every path identically), so it is not used.
  `https://mariadb.com/bsl11/` returns 403 behind Cloudflare.
- No interview-prep repo. There is no Terraform equivalent of `lydiahallie/javascript-questions`
  worth shipping; the edge-case questions carry that weight, as in the PHP camps.

## Facts verified

Checked on 2026-09-23 against HashiCorp's own release endpoints, the repository's LICENSE and
CHANGELOG files at the relevant tags, and the current documentation — not from memory.

- **Terraform 1.16.3** is the current stable release (published 2026-09-16); 1.16.0 was
  2026-08-26 and **1.17.0-beta1** exists. `curl -s https://checkpoint-api.hashicorp.com/v1/check/terraform`
  returns `current_version: 1.16.3`, and the docs version selector reads "v1.16.x (latest),
  Terraform v1.17.x (beta)". This matches CONTENT_GUIDE §10b's "Terraform 1.16". **OpenTofu**
  stable is **1.12.6**, with 1.13.0-rc1 in prerelease.
  The content states no patch version; versions are named only where a mechanism depends on one.
- **Licence.** `hashicorp/terraform` v1.16.3 `LICENSE` is Business Source License 1.1. Verbatim
  parameters: *Licensor:* International Business Machines Corporation (IBM); *Licensed Work:*
  "Terraform Version 1.6.0 or later … (c) 2024 IBM Corp."; *Change Date:* four years from
  publication; *Change License:* MPL 2.0. The Additional Use Grant permits production use except
  where the work is offered to third parties on a paid hosted or embedded basis competing with
  IBM's paid versions, and states that "hosting or using the Licensed Work(s) for internal purposes
  within an organization is not considered a competitive offering", including affiliates under
  common control. **OpenTofu**'s `LICENSE` is Mozilla Public License 2.0 ("Copyright (c) The
  OpenTofu Authors / Copyright (c) 2014 HashiCorp, Inc."), and the Linux Foundation launch
  announcement resolves 200.
- **Feature introductions**, each read from the CHANGELOG at that release's tag:
  - **1.1.0** (2021-12-08) — `moved` blocks.
  - **1.5.0** (2023-06-12) — `import` blocks, `check` blocks, `terraform plan -generate-config-out=PATH`.
  - **1.6.0** (2023-10-04) — `terraform test` generally available, `.tftest.hcl` files with `run` blocks.
  - **1.7.0** (2024-01-17) — `removed` blocks; test mocking (`mock_provider`, `override_resource`,
    `override_data`, `override_module`); `terraform graph` default changed to a simplified
    resource-only graph, with `-type=plan` for the fuller one.
  - **1.10.0** (2024-11-27) — ephemeral resources and ephemeral input variables/outputs,
    `ephemeralasnull`.
  - **1.11.0** (2025-02-27) — write-only resource attributes; **S3 native state locking GA via
    `use_lockfile`, with the DynamoDB arguments deprecated**.
  - **1.16.0** (2026-08-26) — `import` blocks are now supported inside modules.
  - `-replace=ADDRESS` is v0.15.2+, `-refresh-only` is v0.15.4+ (both stated on the plan page).
- **S3 backend, current docs:** "State locking is an opt-in feature of the S3 backend … DynamoDB-based
  locking is deprecated and will be removed in a future minor version." `use_lockfile` is the
  S3-native argument; `dynamodb_table` and `dynamodb_endpoint` are marked Deprecated. Non-default
  workspaces store state at `env:/<workspace>/<key>`, configurable with `workspace_key_prefix`.
- **Plan symbols**, quoted from the plan command page's own example: `+ create`, `~ update
  in-place`, `- destroy`, `-/+ destroy and then create replacement`, with `# forces replacement`
  annotating the responsible attribute and headers reading `will be updated in-place`,
  `must be replaced`, `will be destroyed # (because … is not in configuration)`.
- **`-detailed-exitcode`:** "0 = Succeeded with empty diff (no changes), 1 = Error, 2 = Succeeded
  with non-empty diff (changes present)."
- **`-parallelism=n`** "Limit the number of concurrent operations as Terraform walks the graph.
  Defaults to 10."
- **Variable precedence**, highest to lowest, from the variables page: `-var`/`-var-file` on the
  command line in the order given (and HCP Terraform variables) → `*.auto.tfvars(.json)` in lexical
  order → `terraform.tfvars.json` → `terraform.tfvars` → environment variables (`TF_VAR_`) → the
  `default` argument.
- **`~>` semantics**, from the version-constraints page: "Allows only the right-most version
  component to increment. `~> 1.0.4` allows 1.0.5 and 1.0.10 but not 1.1.0. `~> 1.1` allows 1.2 and
  1.10 but not 2.0." Pre-release versions are not matched by `>`, `>=`, `<`, `<=` or `~>`.
- **Lock file scope**, quoted: "At present, the dependency lock file tracks only provider
  dependencies. Terraform does not remember version selections for remote modules, and so Terraform
  will always select the newest available module version that meets the specified version
  constraint." This is the basis of the `tf-modules` edge-case question. The same page explains the
  platform-checksum problem: installing from a filesystem or network mirror records checksums only
  for the platform that ran `init`, which `terraform providers lock -platform=…` fixes.
- **Module `version`** is only supported for registry sources; Git sources pin with `?ref=` (branch,
  tag or SHA) and `//` selects a subdirectory.
- **`for_each` limits:** accepts a map or a set of strings; "All values that the `for_each` argument
  iterates over must be known before Terraform performs any remote resource operations"; sensitive
  values cannot be used as keys. **Splat** expressions "apply only to lists, sets, and tuples …
  Resources that use the `for_each` argument will appear in expressions as a map of objects, so you
  can't use splat expressions with those resources."
- **`depends_on`**, quoted: "You should only use `depends_on` as a last resort because it can cause
  Terraform to create more conservative plans that replace more resources than necessary. For
  example, Terraform may treat more values as unknown `(known after apply)` …"
- **Provisioners:** "If a provisioner that runs during resource creation fails, Terraform marks the
  resource as tainted so that it can destroy and recreate the tainted resource on the next
  `terraform apply`", overridable with `on_failure = continue`. "Destroy provisioners run before the
  resource is destroyed. If the provisioner fails, Terraform returns an error and reruns the
  provisioners on the next `terraform apply`."
- **`terraform taint`:** "This command is deprecated. Instead, add the `-replace` option to your
  `terraform apply` command." **`terraform refresh`:** "This command is deprecated. Instead, add the
  `-refresh-only` flag to `terraform apply` and `terraform plan` commands."
- **`terraform state rm`:** "removes the binding to an existing remote object without first
  destroying it. The remote object continues to exist but is no longer managed by Terraform."
- **State purpose**, from the docs: mapping config to real objects (tags were tried and rejected
  because not all resources or providers support them and the mapping is ambiguous), metadata
  including dependency ordering needed *after* a resource leaves the configuration and a pointer to
  the provider configuration last used, and an attribute cache as a performance optimisation.
  Terraform "expects that each remote object is bound to only one resource instance".
- **Automation:** `TF_IN_AUTOMATION` (any non-empty value) de-emphasises interactive suggestions;
  the documented sequence is `terraform init -input=false`, `terraform plan -out=tfplan
  -input=false`, `terraform apply -input=false tfplan`.
- **`optional(type, default)`** in an object type constraint inserts the default when the caller
  omits the attribute. **`one()`** exists as a function (used in the `count = 0 or 1` question).
- **Workspaces:** the backends supporting multiple named workspaces are AzureRM, Consul, COS, GCS,
  Kubernetes, Local, OSS, Postgres, Remote and S3. CLI workspaces and HCP Terraform workspaces are
  documented as different concepts.

## Assessment shape

All 15 topics are **quiz**, no code challenges — the sandbox runs JavaScript only and HCL cannot be
graded, which is the established pattern for non-JS material (`## v3 decisions` in
`docs/PROGRESS.md`, and the PHP and mobile-language camps). The difficulty is carried by
read-this-plan and read-this-config questions: the RDS replacement plan with `# forces
replacement`, the `# (because … is not in configuration)` destroy, the `count` index shift on
removing a middle element, the `for_each` key that cannot be known until apply, the stale saved
plan, the Git tag that no longer exists, and the module version that is not in the lock file.

169 questions across 15 topics (10–12 each). Every topic has at least two
`isEdgeCaseOrInterviewQuestion` entries and at least one multi-select.

## Validation

- `npm run content:check -- --module devops-terraform` — 0 errors, 0 warnings.
- `npm run content:types` — clean.
- All 55 reference URLs re-checked with `check-urls.mjs`: all 200, none `unverifiable`.
- All 27 video ids re-checked with `yt.mjs info`: all `embeddable: true`, titles/durations match.
