import type { Module } from "@/types/curriculum";

export default {
  id: "devops-terraform",
  trackId: "devops",
  name: "Infrastructure as Code",
  description:
    "Terraform as the vehicle for infrastructure as code, written for the engineer who inherits someone else's configuration: reading a plan you did not write, working out why a change wants to destroy a database, and repairing state that stopped matching reality.",
  refs: [
    { label: "Terraform: Configuration Language", url: "https://developer.hashicorp.com/terraform/language", kind: "docs" },
    { label: "Terraform: What is Terraform", url: "https://developer.hashicorp.com/terraform/intro", kind: "docs" },
    { label: "Terraform Best Practices", url: "https://www.terraform-best-practices.com/", kind: "article" },
    { label: "OpenTofu: Getting started", url: "https://opentofu.org/docs/intro/", kind: "docs" },
  ],
  topics: [
    {
      id: "tf-why-iac",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Why Infrastructure as Code, and What Declarative Costs You",
      summary:
        "Infrastructure as code exists because the alternative — a wiki page, a console, and whoever remembers the click order — does not survive contact with a second engineer or a second environment. Writing it down makes it reviewable, diffable, repeatable and destroyable — and the last matters most: an environment you can rebuild in twenty minutes is one you are willing to throw away.\n\nTerraform is *declarative*: you describe the end state and it works out the steps. That buys you idempotence and a dependency graph you did not have to write. It costs you three things people rarely warn you about. First, you cannot express sequencing directly — order comes only from data dependencies between resources, which is why `depends_on` exists and why reaching for it is a smell. Second, *how* a change is applied is the provider's decision, not yours: the same one-line edit can be an in-place update on one attribute and a destroy-and-recreate on another. Third, Terraform only knows about what is in its state, so anything created by hand is invisible until you import it, and anything changed by hand is quietly reverted on the next apply.\n\nThe gotcha that catches people a year in: the configuration is intent, the state is Terraform's belief, and the provider API is truth. All three can disagree, so \"it's in Git, so it's what's deployed\" is wrong in both directions.\n\n**A note on licensing, because it affects what a team can adopt.** Terraform 1.6.0 (October 2023) and every release since ship under the Business Source License 1.1 rather than the MPL 2.0 the project used before; the licensor named in the file is now IBM, which acquired HashiCorp. BUSL is source-available, not OSI open source. Its Additional Use Grant permits production use, including internal use across an organisation and its affiliates; what it forbids is offering Terraform to third parties on a hosted or embedded basis as a competing paid product. Each release converts to MPL 2.0 four years after publication. OpenTofu is a fork of Terraform 1.5.x under the Linux Foundation, licensed MPL 2.0; the two still share HCL and the provider protocol but have been developed independently for years and each has features the other lacks. For a team managing only its own infrastructure the licence changes nothing legally; it matters if you sell an infrastructure product, or a policy requires an OSI-approved licence.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Terraform: What is Terraform", url: "https://developer.hashicorp.com/terraform/intro", kind: "docs" },
        { label: "Martin Fowler: Infrastructure As Code", url: "https://martinfowler.com/bliki/InfrastructureAsCode.html", kind: "article" },
        { label: "OpenTofu: Manifesto", url: "https://opentofu.org/manifesto/", kind: "article" },
        { label: "hashicorp/terraform: LICENSE (BUSL 1.1)", url: "https://github.com/hashicorp/terraform/blob/main/LICENSE", kind: "repo" },
      ],
      video: {
        title: "What is Infrastructure as Code? Difference of Infrastructure as Code Tools",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=POPP2WTJ8es",
        videoId: "POPP2WTJ8es",
        durationLabel: "8:03",
      },
      alternateVideos: [
        {
          title: "What is Infrastructure as Code?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=zWw2wuiKd5o",
          videoId: "zWw2wuiKd5o",
          durationLabel: "8:51",
        },
        {
          title: "The ruthless forking of Terraform",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=HzBA6FIn_Bo",
          videoId: "HzBA6FIn_Bo",
          durationLabel: "3:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-why-iac-q1",
          prompt:
            "A file declares `aws_instance.web` above the `aws_subnet` it references. What decides the order Terraform creates them?",
          options: [
            "The dependency graph Terraform builds from references between the resources",
            "The order the blocks appear in the file",
            "Alphabetical order of the resource addresses",
            "The order the provider's API documentation lists them",
          ],
          correctIndex: 0,
          explanation:
            "HCL files are unordered sets of blocks; Terraform builds a graph from the references between them and walks it. File order has no effect at all — which is why `depends_on` exists for the dependencies the graph cannot see.",
        },
        {
          id: "tf-why-iac-q2",
          prompt: "Which of these are genuine costs of the declarative model rather than complaints about tooling? (Select all that apply.)",
          options: [
            "You cannot say \"do X, wait, then do Y\" — ordering comes only from data dependencies between resources",
            "Whether a change is applied in place or by destroying and recreating is the provider's decision, not yours",
            "Anything created outside Terraform is invisible to it until it is imported",
            "Declarative tools cannot manage stateful resources such as databases",
            "Declarative tools cannot express conditional logic at all",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are inherent to describing an end state rather than a procedure. Databases are managed declaratively all the time, and conditionals exist via `count`, `for_each` and ternaries — awkward, but present.",
        },
        {
          id: "tf-why-iac-q3",
          prompt: "What changed about Terraform's licence at version 1.6.0?",
          options: [
            "It moved from MPL 2.0 to the Business Source License 1.1, which is source-available rather than OSI open source",
            "It moved from a proprietary licence to Apache 2.0",
            "Production use began to require a paid licence",
            "The source code stopped being published",
          ],
          correctIndex: 0,
          explanation:
            "BUSL 1.1 keeps the source public and permits production use; what it restricts is offering Terraform to third parties as a competing paid hosted or embedded product. Nothing about it makes ordinary production use paid, and the source is still on GitHub.",
        },
        {
          id: "tf-why-iac-q4",
          prompt: "Which statements about BUSL-licensed Terraform and about OpenTofu are accurate? (Select all that apply.)",
          options: [
            "Using Terraform internally to manage your own organisation's infrastructure is permitted by the Additional Use Grant",
            "Each Terraform release converts to MPL 2.0 four years after it is published",
            "OpenTofu is a fork of Terraform maintained under the Linux Foundation and licensed MPL 2.0",
            "BUSL forbids reading or modifying the Terraform source",
            "OpenTofu and Terraform are contractually kept feature-identical",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The grant covers internal use across an organisation and its affiliates, and the Change Date is four years with a Change License of MPL 2.0. OpenTofu is an MPL 2.0 Linux Foundation project. The source stays readable and modifiable under BUSL, and nothing obliges the two projects to stay in step — they have diverged.",
        },
        {
          id: "tf-why-iac-q5",
          prompt:
            "During an incident someone resizes an RDS instance in the AWS console. The Terraform configuration is untouched. What does the next `terraform plan` show?",
          options: [
            "A change proposing to set the instance size back to what the configuration says",
            "Nothing, because the configuration has not changed",
            "An error, because state no longer matches reality",
            "The new size, silently adopted into the configuration",
          ],
          correctIndex: 0,
          explanation:
            "Plan refreshes state against the live API, sees the drift, and proposes to make reality match the configuration — so the emergency fix gets reverted by the next person who applies. Terraform never edits your configuration to match the world.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-why-iac-q6",
          prompt: "What does idempotence mean for `terraform apply` in practice?",
          options: [
            "Applying an unchanged configuration against unchanged infrastructure produces an empty plan",
            "Every apply recreates all resources so the result is always identical",
            "Terraform retries failed API calls until they succeed",
            "Terraform refuses to run twice against the same state file",
          ],
          correctIndex: 0,
          explanation:
            "The second run has nothing to do, because the desired state already matches. Recreating everything would be the opposite of idempotent, and retry behaviour is a provider concern, not what the word means.",
        },
        {
          id: "tf-why-iac-q7",
          prompt:
            "A team manages VPCs and instances in Terraform but creates DNS records with a hand-written script. Beyond untidiness, what is the concrete risk?",
          options: [
            "The DNS records are in no dependency graph, so Terraform can destroy or replace what they point at without knowing they exist",
            "Terraform will delete the DNS records on the next apply",
            "The script cannot authenticate against the same cloud account",
            "Terraform refuses to plan until every resource in the account is managed",
          ],
          correctIndex: 0,
          explanation:
            "Terraform only orders and protects what it knows about. Unmanaged records are not deleted — they are simply left pointing at something that may no longer exist. Terraform never requires an account to be fully managed.",
        },
        {
          id: "tf-why-iac-q8",
          prompt: "Which description of the tool landscape is accurate?",
          options: [
            "Terraform and CloudFormation are declarative with their own configuration formats; Pulumi is declarative but authored in general-purpose languages; Ansible is primarily procedural and configuration-management focused",
            "All four are declarative and use the same underlying configuration language",
            "Terraform is the only one of the four that can manage more than one cloud",
            "Ansible and Terraform share the same graph-based execution model and differ only in syntax",
          ],
          correctIndex: 0,
          explanation:
            "Pulumi builds the same kind of desired-state graph, just expressed in TypeScript, Go or Python. Ansible runs tasks in order against hosts, which is a different model — it can provision cloud resources, but it is not graph-driven. Pulumi and Ansible are multi-cloud too.",
        },
        {
          id: "tf-why-iac-q9",
          prompt:
            "A colleague argues that because the configuration is in Git, the Git history is an accurate record of what is deployed. Where exactly does that break down?",
          options: [
            "Configuration records intent, state records what Terraform believes exists, and only the provider API knows what actually exists — all three can disagree",
            "Git cannot reliably store HCL files",
            "Terraform rewrites the configuration during apply, so the file in Git is stale",
            "The configuration is stored encrypted, so it cannot be read back",
          ],
          correctIndex: 0,
          explanation:
            "A merged commit that was never applied, a half-failed apply, and a console change all put Git out of step with reality. Terraform never writes back to your `.tf` files.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-why-iac-q10",
          prompt: "What does immutable infrastructure actually buy a team?",
          options: [
            "Changes produce a new object rather than mutating a long-lived one, so a running fleet always corresponds to a known build and drift has nowhere to accumulate",
            "It prevents anyone from deleting resources",
            "It makes applies faster, because nothing is ever destroyed",
            "It removes the need to track state",
          ],
          correctIndex: 0,
          explanation:
            "The value is that no server carries an untracked history of ad-hoc fixes. It is usually slower, not faster, because replacing costs more than patching — and it makes state more important, not less.",
        },
      ],
    },
    {
      id: "tf-hcl-language",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "HCL: Resources, Variables, Outputs, Locals and Expressions",
      summary:
        "HCL is a typed configuration language, not a programming language, and reading inherited Terraform is mostly a matter of knowing which of its four value-producing constructs you are looking at. A `resource` declares something Terraform should own. A `variable` is an input the caller supplies, with a type constraint, an optional `default` and optional `validation` blocks. A `local` is a named expression evaluated once and reused — it cannot be set from outside. An `output` is the only channel through which a caller sees anything a module produced.\n\nThe distinction people blur is variable versus local. If a value should differ between environments, it is a variable; if it is derived from other values, it is a local. Configurations that expose forty variables, most of which are `\"${var.project}-${var.env}-db\"`, have turned locals into an API by mistake, and every caller now has to know the naming convention.\n\nType constraints are worth more effort than they get. `type = string` catches nothing; `type = object({ cidr = string, azs = list(string), nat = optional(bool, true) })` documents the module, rejects bad input at plan time rather than at the API, and gives `optional()` defaults for attributes the caller omits. A `validation` block turns a business rule (\"environment must be one of dev/stage/prod\") into a plan-time error with a message someone can act on.\n\nThe gotcha that bites in CI: variable precedence. From highest to lowest, `-var` and `-var-file` on the command line (in the order given), then `*.auto.tfvars` files in lexical order, then `terraform.tfvars.json`, then `terraform.tfvars`, then `TF_VAR_` environment variables, and only last the `default`. A pipeline that exports `TF_VAR_region` and also has a committed `terraform.tfvars` is not using the environment variable, and the failure is silent.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Terraform: resource block reference", url: "https://developer.hashicorp.com/terraform/language/block/resource", kind: "docs" },
        { label: "Terraform: Input variables", url: "https://developer.hashicorp.com/terraform/language/values/variables", kind: "docs" },
        { label: "Terraform: Expressions", url: "https://developer.hashicorp.com/terraform/language/expressions", kind: "docs" },
        { label: "Terraform Best Practices: naming and structure", url: "https://www.terraform-best-practices.com/", kind: "article" },
      ],
      video: {
        title: "Day 5/28 - Terraform Variables - Input vs Output vs Local Variables",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=weLkaZgyaOI",
        videoId: "weLkaZgyaOI",
        durationLabel: "20:29",
      },
      alternateVideos: [
        {
          title: "Terraform Tips & Tricks: loops, if-statements, and more",
          channel: "Anton Putra",
          url: "https://www.youtube.com/watch?v=7S94oUTy2z4",
          videoId: "7S94oUTy2z4",
          durationLabel: "27:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-hcl-language-q1",
          prompt:
            "The root module gets a value for `region` from four places at once:\n\n- the `variable` block's `default = \"us-east-1\"`\n- `TF_VAR_region=eu-west-1` exported in CI\n- `region = \"ap-south-1\"` in a committed `terraform.tfvars`\n- `-var region=us-west-2` on the command line\n\nWhich value does Terraform use?",
          options: ["`us-west-2`", "`ap-south-1`", "`eu-west-1`", "`us-east-1`"],
          correctIndex: 0,
          explanation:
            "Precedence from highest: `-var`/`-var-file`, then `*.auto.tfvars`, then `terraform.tfvars.json`, then `terraform.tfvars`, then `TF_VAR_` environment variables, then the `default`. Note that the committed tfvars file silently beats the environment variable, which is the usual CI surprise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-hcl-language-q2",
          prompt: "What can a `local` do that an input `variable` cannot?",
          options: [
            "Hold an expression computed from other values, including resource attributes",
            "Be assigned from the command line with `-var`",
            "Be declared without any value at all",
            "Be read directly by a calling module",
          ],
          correctIndex: 0,
          explanation:
            "Locals are derived; variables are supplied. A variable cannot be computed from a resource attribute, and a local cannot be overridden by the caller — reading a value out of a module is what `output` is for.",
        },
        {
          id: "tf-hcl-language-q3",
          prompt: "Which of these are true of `output` blocks? (Select all that apply.)",
          options: [
            "An output is the only way a calling module can read a value produced inside a child module",
            "`sensitive = true` stops Terraform printing the value in CLI output but the value is still stored in plaintext in state",
            "Root module outputs are printed after `terraform apply` and can be read later with `terraform output`",
            "Outputs are evaluated before resources are created, so they cannot reference resource attributes",
            "An output can be given a value on the command line with `-var`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Outputs are the module's public surface and are evaluated after the resources they reference. `sensitive` is a display control only — state is not encrypted by it. `-var` sets variables, never outputs.",
        },
        {
          id: "tf-hcl-language-q4",
          prompt:
            "What does this variable accept?\n\n```hcl\nvariable \"tags\" {\n  type = map(string)\n}\n```",
          options: [
            "A map whose values are all strings, converting values of other primitive types where a conversion is possible",
            "Any object, since maps and objects are interchangeable",
            "A list of strings",
            "Only a map with string keys and exactly one entry",
          ],
          correctIndex: 0,
          explanation:
            "`map(string)` requires every value to be a string, though HCL will convert a number or bool to its string form. An object type with named attributes is a different constraint, and there is no restriction on the number of keys.",
        },
        {
          id: "tf-hcl-language-q5",
          prompt: "What does `try(local.settings.timeout, 30)` evaluate to?",
          options: [
            "The first argument, or `30` if evaluating it produces an error such as the attribute not existing",
            "`30` only when `local.settings.timeout` is `null`",
            "`30` only when `local.settings.timeout` is an empty string",
            "An error, because `try` accepts exactly one argument",
          ],
          correctIndex: 0,
          explanation:
            "`try` evaluates each argument in turn and returns the first that succeeds. A present-but-null value is returned as `null`, not replaced — use `coalesce` or the `??`-style `a != null ? a : b` for that.",
        },
        {
          id: "tf-hcl-language-q6",
          prompt:
            "Given `local.name = \"web\"` and `local.env = \"prod\"`, which expression produces the string `web-prod`?",
          options: [
            "`\"${local.name}-${local.env}\"`",
            "`local.name + \"-\" + local.env`",
            "`'${local.name}-${local.env}'`",
            "`\"{local.name}-{local.env}\"`",
          ],
          correctIndex: 0,
          explanation:
            "HCL interpolates with `${ }` inside double quotes. `+` is arithmetic only — it will not concatenate strings — and single quotes are not string delimiters in HCL at all.",
        },
        {
          id: "tf-hcl-language-q7",
          prompt:
            "`aws_instance.web` is declared with `count = 3`. What does `aws_instance.web[*].id` produce, and what happens if the resource is switched to `for_each` instead?",
          options: [
            "A list of the three ids in index order; with `for_each` the resource becomes a map, so the splat no longer applies and you need `values(...)` or a `for` expression",
            "A list of the three ids; the same splat works unchanged with `for_each`",
            "A map keyed by index; with `for_each` it becomes a list",
            "An error — splat expressions only work with `for_each`",
          ],
          correctIndex: 0,
          explanation:
            "Splat projects an attribute across a list, set or tuple. A `for_each` resource appears as a map of objects, which splat does not accept — this is one of the concrete edits needed when migrating a resource from `count` to `for_each`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-hcl-language-q8",
          prompt: "What does a `validation` block inside a `variable` do?",
          options: [
            "Rejects the value at plan time with your own error message when its `condition` is false",
            "Converts the supplied value to the declared type",
            "Runs after apply and checks the created resource",
            "Marks the variable as required",
          ],
          correctIndex: 0,
          explanation:
            "It is a plan-time guard with a human-readable message, which is far better than the provider rejecting the value mid-apply. Type conversion is the `type` constraint's job, and a variable is required simply by having no `default`.",
        },
        {
          id: "tf-hcl-language-q9",
          prompt: "Which are real ways to make a block conditional in HCL? (Select all that apply.)",
          options: [
            "`count = var.enabled ? 1 : 0` on the resource",
            "A `dynamic` block whose `for_each` is an empty collection when the feature is off",
            "An `if` statement wrapping the block at the top level of the file",
            "An `enabled = false` meta-argument that Terraform understands on any resource",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "HCL has no statements, so conditionals are expressed through the count/for_each meta-arguments and the ternary operator. There is no generic `enabled` meta-argument, though many community modules define an input with that name and implement it with `count`.",
        },
        {
          id: "tf-hcl-language-q10",
          prompt: "Why is `jsonencode({ ... })` usually preferred over a heredoc JSON string for an IAM policy document?",
          options: [
            "The object is checked by HCL's type system and formatted by `terraform fmt`, so a stray comma is a parse error instead of an API rejection halfway through an apply",
            "It is the only way to produce JSON from HCL",
            "It encrypts the policy before it is written to state",
            "It sends the policy to the provider as HCL rather than JSON",
          ],
          correctIndex: 0,
          explanation:
            "A heredoc is an opaque string to Terraform — interpolation works, but nothing checks the structure until AWS rejects it. `jsonencode` also lets you build policy statements with `for` expressions.",
        },
        {
          id: "tf-hcl-language-q11",
          prompt:
            "What does `optional(string, \"gp3\")` do inside an `object({ ... })` type constraint?",
          options: [
            "Lets the caller omit the attribute, substituting `\"gp3\"` when it is missing",
            "Allows the attribute to be set to `null`",
            "Makes the entire object optional",
            "Documents a suggested value without enforcing anything",
          ],
          correctIndex: 0,
          explanation:
            "`optional(type, default)` fills the attribute in when the caller leaves it out, which is how a module offers sensible defaults inside a structured input rather than exposing a flat variable per field.",
        },
      ],
    },
    {
      id: "tf-providers-versions",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Providers, Version Constraints and the Lock File",
      summary:
        "A provider is a separate binary that translates Terraform's plan/apply protocol into API calls. Terraform core knows nothing about EC2 or Route 53; it knows about resources, graphs and state. That separation is why a provider upgrade can change your plan without a single line of your configuration changing — the schema, the defaults and the decision about what forces replacement all live in the provider.\n\nSo pinning matters, and the two places to do it behave differently. `required_providers` inside the `terraform` block declares a *constraint* (a range); `.terraform.lock.hcl` records the exact version and its checksums and is committed to Git. The constraint says what is acceptable; the lock file says what is actually being used. Only `terraform init -upgrade` moves the lock within the constraint, which is what makes provider upgrades a deliberate, reviewable commit rather than a surprise.\n\nThe constraint syntax that gets misread is `~>`: it allows only the right-most component to increment. `~> 5.1.2` permits 5.1.3 but not 5.2.0; `~> 5.1` permits 5.9 but not 6.0. The convention that works is `~>` in root modules and open `>=` ranges in shared modules, because a shared module that pins `= 5.1.2` makes the whole dependency graph unsatisfiable the moment any other module needs something newer.\n\nThe gotcha that shows up only in CI: the lock file records checksums per platform. When providers come from the public registry with a signed checksum document, Terraform records hashes for every platform and a macOS developer's lock file works fine on a Linux runner. When they come from a filesystem or network mirror, Terraform can only verify the platform it ran on, so the lock file records that one and init fails everywhere else. `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64` pre-populates the rest.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Terraform: Provider Requirements", url: "https://developer.hashicorp.com/terraform/language/providers/requirements", kind: "docs" },
        { label: "Terraform: Version Constraints", url: "https://developer.hashicorp.com/terraform/language/expressions/version-constraints", kind: "docs" },
        { label: "Terraform: Dependency Lock File", url: "https://developer.hashicorp.com/terraform/language/files/dependency-lock", kind: "docs" },
      ],
      video: {
        title: "Terraform Tutorial for Beginners + Labs: Complete Step by Step Guide!",
        channel: "KodeKloud",
        url: "https://www.youtube.com/watch?v=YcJ9IeukJL8",
        videoId: "YcJ9IeukJL8",
        startSeconds: 6573,
        chapterLabel: "Version Constraints in Terraform",
        durationLabel: "1:55:06",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-providers-versions-q1",
          prompt: "Which versions does the constraint `~> 4.16` allow?",
          options: [
            "4.16 and any later 4.x, but not 5.0",
            "4.16 and 4.16.x only",
            "Exactly 4.16",
            "4.16 and anything newer, including 5.0",
          ],
          correctIndex: 0,
          explanation:
            "`~>` lets only the right-most stated component increment. With two components stated, the minor may move but the major may not. `~> 4.16.0` would be the form that pins to patch releases of 4.16.",
        },
        {
          id: "tf-providers-versions-q2",
          prompt: "What is the difference between `required_providers` and `.terraform.lock.hcl`?",
          options: [
            "`required_providers` states an acceptable range; the lock file records the exact version and checksums actually selected",
            "`required_providers` is for Terraform core; the lock file is for providers",
            "The lock file states the range and `required_providers` records what was installed",
            "They are two formats for the same information and only one is needed",
          ],
          correctIndex: 0,
          explanation:
            "The range lives in configuration and is reviewed as code; the resolved selection lives in the lock file and is also committed. Terraform core's own version is constrained separately by `required_version`.",
        },
        {
          id: "tf-providers-versions-q3",
          prompt: "Which actions can change `.terraform.lock.hcl`? (Select all that apply.)",
          options: [
            "`terraform init -upgrade`",
            "`terraform init` when a provider appears in the configuration for the first time",
            "`terraform providers lock -platform=linux_amd64`",
            "`terraform apply` whenever a newer provider version has been published",
            "`terraform plan` on a machine with a different OS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Ordinary `init`, `plan` and `apply` honour the lock and will not silently move it; they only add entries for providers not yet recorded. Upgrading is an explicit action, which is the whole point.",
        },
        {
          id: "tf-providers-versions-q4",
          prompt:
            "CI installs providers from an internal network mirror. The committed lock file was generated on a developer's macOS machine, and the Linux runner fails `init` with a checksum error. Why?",
          options: [
            "A mirror cannot supply the registry's signed multi-platform checksum document, so only the platform where `init` first ran was recorded",
            "The lock file is machine-specific and should never be committed",
            "The runner is using a different Terraform CLI version",
            "The provider version was removed from the mirror",
          ],
          correctIndex: 0,
          explanation:
            "From the public registry Terraform records hashes for every platform in the signed document, so this never comes up. From a mirror it can only verify what it downloaded. `terraform providers lock -platform=...` pre-populates the missing entries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-providers-versions-q5",
          prompt:
            "A shared module you depend on declares `version = \"= 4.10.0\"` for the AWS provider. Your root module needs `~> 5.0`. What happens at `terraform init`?",
          options: [
            "Init fails: no single provider version satisfies both constraints, and Terraform installs exactly one version per provider per configuration",
            "Terraform installs both versions and gives each module the one it asked for",
            "Terraform installs 5.x and warns that the module's constraint was ignored",
            "Terraform installs 4.10.0 because the more specific constraint wins",
          ],
          correctIndex: 0,
          explanation:
            "Provider constraints from every module in the configuration are intersected and one version is chosen. This is exactly why shared modules should state open lower bounds such as `>= 4.10` and leave pinning to the root.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-providers-versions-q6",
          prompt: "What does the source address `hashicorp/aws` resolve to?",
          options: [
            "`registry.terraform.io/hashicorp/aws` — the default registry host is implied",
            "A GitHub repository at `github.com/hashicorp/aws`",
            "A local directory called `hashicorp/aws`",
            "Nothing — the full host must always be written out",
          ],
          correctIndex: 0,
          explanation:
            "A two-part address is shorthand for the public registry. A third part names a different host, which is how private registries and mirrors are addressed.",
        },
        {
          id: "tf-providers-versions-q7",
          prompt: "You need to create buckets in two AWS regions from one configuration. What is the mechanism?",
          options: [
            "Declare a second `provider \"aws\"` block with an `alias`, then set `provider = aws.<alias>` on the resources that belong to it",
            "Set the `region` argument on each resource",
            "Run Terraform twice with different `AWS_REGION` values and merge the state files",
            "Declare the AWS provider twice in `required_providers` with different versions",
          ],
          correctIndex: 0,
          explanation:
            "Provider configuration is per provider instance, not per resource; aliases give you more than one instance. Modules receive aliased providers explicitly through the `providers` argument, declared on their side with `configuration_aliases`.",
        },
        {
          id: "tf-providers-versions-q8",
          prompt: "What is `required_version` inside the `terraform` block for?",
          options: [
            "Constraining the version of the Terraform CLI itself, so an older or newer binary refuses to run the configuration",
            "Constraining the provider versions",
            "Recording which version last wrote the state file",
            "Selecting which Terraform version CI should download",
          ],
          correctIndex: 0,
          explanation:
            "It is a guard, not an installer — it makes the wrong binary fail loudly instead of writing a state file the rest of the team cannot read. State does separately record the version that wrote it, but that is not what this setting controls.",
        },
        {
          id: "tf-providers-versions-q9",
          prompt:
            "Nobody touched the configuration, but after a colleague ran `terraform init -upgrade` the plan now wants to replace a security group. What is the most likely cause?",
          options: [
            "The newer provider changed a schema default or changed which attribute forces replacement",
            "Terraform core changed its diffing algorithm",
            "The state file was corrupted by the upgrade",
            "The lock file no longer matches, so Terraform recreates everything",
          ],
          correctIndex: 0,
          explanation:
            "Defaults, computed-attribute handling and ForceNew flags all live in the provider schema, so a provider bump is a behaviour change even with identical HCL. Read the provider's changelog and its upgrade guide before merging the lock-file diff.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-providers-versions-q10",
          prompt: "Why do shared modules usually state `>= 4.10` rather than `~> 4.10` for a provider?",
          options: [
            "A narrow constraint in a widely used module makes the intersection with other modules unsatisfiable and blocks the whole configuration from upgrading",
            "`~>` is not valid syntax inside a module",
            "Modules cannot declare provider requirements at all",
            "The root module's constraint is ignored when a child module declares one",
          ],
          correctIndex: 0,
          explanation:
            "The module author cannot know what else will be in the graph; the root module can, and it also owns the lock file. Modules state the minimum they need and leave the ceiling to the consumer.",
        },
      ],
    },
    {
      id: "tf-state",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "State: What It Is and Why It Is the Whole Ballgame",
      summary:
        "State is the binding between an address in your configuration (`aws_instance.web`) and a real object at a provider (`i-0abc123`). Terraform needs it because that mapping cannot be recovered reliably by asking the cloud: not every resource type supports tags, not every provider supports them at all, and even where they do, a tag-based lookup is ambiguous the moment two objects carry the same tag. HashiCorp tried it; it did not work.\n\nState carries two more things people forget. It records dependency metadata captured when resources were created, which is how Terraform knows the right destroy order *after* you have deleted the resources from the configuration and there is nothing left to build a graph from. And it caches every attribute of every managed resource, which is purely a performance optimisation — it is why a plan can show you a diff quickly, and why `-refresh=false` is meaningful at all.\n\nThat design has hard consequences. State is a JSON document with a `serial` that increments on every write and a `lineage` that identifies the state's ancestry. It contains every attribute the provider returned, including database passwords and private keys, in plaintext. And a resource's identity is its *address*, not its name in the cloud: rename the block from `aws_instance.web` to `aws_instance.api` and Terraform sees one resource gone and one appeared, and plans a destroy and a create — unless you tell it otherwise with a `moved` block or `terraform state mv`.\n\nThe distinction to get right before you are under pressure: `terraform state rm` deletes the binding and leaves the real object running, unmanaged and still billing. `terraform destroy` deletes the real object. Reaching for the wrong one at 2 a.m. is how teams end up with orphaned NAT gateways — or with no production database.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Terraform: Purpose of Terraform State", url: "https://developer.hashicorp.com/terraform/language/state/purpose", kind: "docs" },
        { label: "Terraform: Update state manually (state CLI)", url: "https://developer.hashicorp.com/terraform/cli/state", kind: "docs" },
        { label: "Gruntwork: How to Manage Terraform State", url: "https://www.gruntwork.io/blog/how-to-manage-terraform-state", kind: "article" },
      ],
      video: {
        title: "Terraform Tutorial for Beginners + Labs: Complete Step by Step Guide!",
        channel: "KodeKloud",
        url: "https://www.youtube.com/watch?v=YcJ9IeukJL8",
        videoId: "YcJ9IeukJL8",
        startSeconds: 4468,
        chapterLabel: "Purpose of State in Terraform",
        durationLabel: "1:55:06",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-state-q1",
          prompt: "Why does Terraform keep its own state file instead of querying the provider for everything on each run?",
          options: [
            "There is no reliable, universal way to map a configuration address to a specific remote object, and a full discovery pass on every run would be slow",
            "Provider APIs do not expose enough information to build a plan",
            "State exists only to make `terraform destroy` possible",
            "Cloud APIs rate-limit reads too aggressively to be used during a plan",
          ],
          correctIndex: 0,
          explanation:
            "Tags were the obvious answer and they fail: not every resource type or provider supports them, and duplicates make the mapping ambiguous. Refresh does read from the API, so the APIs certainly expose enough — the problem is identity, plus the cost of discovering everything every time.",
        },
        {
          id: "tf-state-q2",
          prompt: "You run `terraform state rm aws_db_instance.main`. What happens to the database?",
          options: [
            "Nothing — it keeps running and keeps billing, but Terraform no longer manages it",
            "It is deleted, the same as `terraform destroy -target`",
            "It is deleted at the end of the next apply",
            "It is marked for replacement on the next plan",
          ],
          correctIndex: 0,
          explanation:
            "`state rm` removes the binding only. The object becomes an orphan. `terraform destroy` is the command that deletes things — and if the block is still in the configuration, the next plan will simply propose creating a second database.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-state-q3",
          prompt:
            "Someone renames a block from `aws_instance.web` to `aws_instance.api` with no other change. What does the plan show, and what is the safe fix?",
          options: [
            "One destroy and one create; add a `moved` block (or run `terraform state mv`) so Terraform rebinds the existing object to the new address",
            "No changes, because the resource arguments are identical",
            "An in-place update of the resource's name tag",
            "An error, because the address in state no longer exists in the configuration",
          ],
          correctIndex: 0,
          explanation:
            "Identity in state is the address. A `moved` block records the rename in code so every consumer of the configuration gets the rebinding automatically, which `terraform state mv` — a local, manual, one-off operation — does not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-state-q4",
          prompt: "Which of these are stored in a Terraform state file? (Select all that apply.)",
          options: [
            "The mapping from each resource address to the remote object's id",
            "A cached copy of every attribute the provider returned, including sensitive ones, in plaintext",
            "Dependency metadata recorded at create time, used to order destroys after a resource leaves the configuration",
            "The `.tf` configuration files themselves, so state can be replayed without them",
            "The provider binaries needed to apply the configuration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "State is a record of what Terraform believes exists and how it got there. It never contains the configuration or the plugins — those come from your repository and from `terraform init`.",
        },
        {
          id: "tf-state-q5",
          prompt: "What are `serial` and `lineage` in a state file for?",
          options: [
            "`serial` increments on every write so a backend can detect a stale or out-of-order update; `lineage` identifies the state's ancestry so an unrelated state cannot be pushed over it",
            "`serial` is the Terraform version and `lineage` is the provider version",
            "They are checksums of the configuration files",
            "They record the number of resources and the number of modules",
          ],
          correctIndex: 0,
          explanation:
            "Together they are the safety check behind `terraform state push`: pushing a state with a lower serial or a different lineage is refused unless you force it, which stops you overwriting a colleague's work with an old copy.",
        },
        {
          id: "tf-state-q6",
          prompt:
            "Through a botched import, two resource addresses end up bound to the same EC2 instance id. What is the practical consequence?",
          options: [
            "Terraform's one-object-per-instance assumption is broken, so plans and applies behave unpredictably — one address may destroy the object the other still believes it manages",
            "Terraform detects the duplicate at plan time and refuses to continue",
            "Nothing, as long as both blocks have identical arguments",
            "Terraform automatically deduplicates the bindings on the next refresh",
          ],
          correctIndex: 0,
          explanation:
            "Terraform expects a one-to-one mapping and does not check for violations. It is one of the few situations where the tool will not warn you, and the only fix is to `state rm` one of the two addresses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-state-q7",
          prompt: "A colleague marks a variable and an output `sensitive = true`. What does that do to the value in state?",
          options: [
            "Nothing — it only suppresses the value in CLI output and in the plan; state still holds it in plaintext",
            "It encrypts the value inside the state file",
            "It removes the value from state entirely",
            "It hashes the value so only a digest is stored",
          ],
          correctIndex: 0,
          explanation:
            "Sensitivity is a display marking. Protecting the value means protecting the state file: a private backend, encryption at rest, and tight read permissions.",
        },
        {
          id: "tf-state-q8",
          prompt: "Which command shows the current attributes Terraform has recorded for a single resource?",
          options: [
            "`terraform state show aws_instance.web`",
            "`terraform show aws_instance.web`",
            "`terraform state list aws_instance.web`",
            "`terraform output aws_instance.web`",
          ],
          correctIndex: 0,
          explanation:
            "`state list` enumerates addresses, `state show` prints one resource's recorded attributes, and plain `terraform show` renders the whole state or a saved plan. `terraform output` only reads root module outputs.",
        },
        {
          id: "tf-state-q9",
          prompt:
            "The state file is deleted and there is no backup. The configuration and the real infrastructure are both intact. What does the next `terraform apply` do?",
          options: [
            "It treats every resource as new and tries to create a second copy of the whole stack, failing on anything with a globally unique name",
            "It rebuilds state by discovering the existing resources",
            "It refuses to run until state is restored",
            "It adopts the existing resources because their names match the configuration",
          ],
          correctIndex: 0,
          explanation:
            "With no state there is no binding, so everything looks absent. Recovery means importing every resource one address at a time — which is why bucket versioning on the state object is not optional.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-state-q10",
          prompt:
            "Why does Terraform need to record dependency information in state at all, when it can build a graph from the configuration?",
          options: [
            "When a resource is deleted from the configuration there is nothing left to build a graph from, so the recorded edges are what orders the destroy",
            "The configuration graph is too slow to build on every run",
            "Providers do not expose enough schema information to infer dependencies",
            "It is needed to detect drift",
          ],
          correctIndex: 0,
          explanation:
            "Destroy ordering is the case the configuration cannot cover. Terraform also records which provider configuration last managed each object, for the same reason.",
        },
        {
          id: "tf-state-q11",
          prompt: "What does `terraform plan -refresh=false` actually change?",
          options: [
            "Terraform skips reading the current state of each object from the provider and diffs the configuration against the cached attributes in state",
            "Terraform skips reading the state file entirely",
            "Terraform refreshes but does not write the refreshed values back",
            "Terraform reads state but ignores the configuration",
          ],
          correctIndex: 0,
          explanation:
            "It is a speed and API-quota tradeoff: faster plans, but any drift since the last refresh is invisible, so the plan can be wrong. Useful on a huge configuration you have just refreshed; risky as a default.",
        },
      ],
    },
    {
      id: "tf-remote-state-locking",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Remote State, Locking, and a Lost State File",
      summary:
        "A state file on a laptop is a single point of failure and a race condition waiting to happen. A remote backend fixes both: the state lives in shared storage that every engineer and the CI runner read from, and the backend takes a lock for the duration of any operation that may write, so two applies cannot interleave. The failure mode locking prevents is not \"conflicting edits\" — it is two processes each reading serial 41, each doing half the work, and each writing serial 42 over the other. The result is state that describes neither run.\n\nOn AWS the current shape is an S3 bucket with versioning and encryption enabled and `use_lockfile = true`, which puts the lock in S3 itself. S3-native locking became generally available in Terraform 1.11, and the `dynamodb_table` argument is deprecated and slated for removal — inherited configurations will still have it, and you can run both during a migration. Backends themselves are not all equal: only some support multiple named workspaces, and the backend block cannot use variables or interpolation, which is the constraint that pushes most teams toward `-backend-config` files per environment.\n\nRecovery is where this topic earns its place. If an operation dies mid-run the lock survives it, and `terraform force-unlock <LOCK_ID>` clears it — but only ever after you have confirmed no process still holds it, because unlocking a live apply reintroduces exactly the corruption locking existed to prevent. If state is lost or corrupted, S3 object versioning is the difference between restoring the previous version in a minute and importing every resource by hand for a day. Never hand-edit state in place: `terraform state pull > backup.json`, edit a copy, `terraform state push`, and let the `serial` and `lineage` checks do their job.\n\nThe gotcha when moving or changing backends: `terraform init -migrate-state` copies the existing state into the new backend, and `terraform init -reconfigure` does not — it starts fresh against the new backend and abandons what was there. On a live stack, picking the second one looks identical right up to the point the next plan proposes to create everything.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Terraform: State — Remote Storage", url: "https://developer.hashicorp.com/terraform/language/state/remote", kind: "docs" },
        { label: "Terraform: State — Locking", url: "https://developer.hashicorp.com/terraform/language/state/locking", kind: "docs" },
        { label: "Terraform: Backend Type s3", url: "https://developer.hashicorp.com/terraform/language/backend/s3", kind: "docs" },
        { label: "Terraform: terraform force-unlock", url: "https://developer.hashicorp.com/terraform/cli/commands/force-unlock", kind: "docs" },
      ],
      video: {
        title: "4/30 - Terraform State file management with AWS S3 | Remote Backend",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=YsEdrl9O5os",
        videoId: "YsEdrl9O5os",
        durationLabel: "17:25",
      },
      alternateVideos: [
        {
          title: "Terraform state locking with new use_lockfile native AWS S3 bucket locking mechanism",
          channel: "Automation Avenue",
          url: "https://www.youtube.com/watch?v=AmWnWfuSTfQ",
          videoId: "AmWnWfuSTfQ",
          durationLabel: "8:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-remote-state-locking-q1",
          prompt: "What exactly does state locking prevent?",
          options: [
            "Two operations reading the same state, each applying part of a plan, and each writing a new state that ignores the other's work",
            "Two engineers editing the same `.tf` file at once",
            "A plan being applied after the configuration has changed",
            "The state file being read while an apply is running",
          ],
          correctIndex: 0,
          explanation:
            "It is a write-write race on the state object, not a source-control problem. Git handles concurrent edits to configuration; nothing but the lock handles concurrent writes to state.",
        },
        {
          id: "tf-remote-state-locking-q2",
          prompt: "What is the current recommended way to enable state locking with the S3 backend?",
          options: [
            "Set `use_lockfile = true` so the lock is held in S3 itself",
            "Set `dynamodb_table` to a table with a `LockID` string partition key",
            "Enable S3 Object Lock on the bucket",
            "Nothing — the S3 backend locks by default",
          ],
          correctIndex: 0,
          explanation:
            "S3-native locking went generally available in Terraform 1.11 and the DynamoDB arguments are now deprecated and will be removed. Both can be configured together during a migration. S3 Object Lock is WORM retention and unrelated.",
        },
        {
          id: "tf-remote-state-locking-q3",
          prompt:
            "A CI job was killed mid-apply. Every subsequent run fails with `Error acquiring the state lock`. What is the correct sequence?",
          options: [
            "Confirm no process still holds the lock, note the `LOCK_ID` from the error, then run `terraform force-unlock <LOCK_ID>`",
            "Run `terraform force-unlock` immediately — it is safe because Terraform verifies the holder first",
            "Delete the lock entry or lock file directly from the backend storage",
            "Run the next apply with `-lock=false` and let the stale lock expire",
          ],
          correctIndex: 0,
          explanation:
            "`force-unlock` does no liveness check — that is what \"force\" means. Confirming the holder is dead is the whole job. `-lock=false` does not clear anything; it just runs unprotected, which is worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-remote-state-locking-q4",
          prompt:
            "A truncated state object is uploaded after a network failure and plans now fail to parse it. Which recovery path is both fastest and safest, assuming the bucket was set up properly?",
          options: [
            "Restore the previous version of the state object from S3 bucket versioning",
            "Run `terraform apply -refresh-only` to rebuild state from the live infrastructure",
            "Delete the state object and re-import every resource",
            "Hand-edit the JSON to repair the truncation",
          ],
          correctIndex: 0,
          explanation:
            "Versioning is why the bucket setup insists on it. Refresh-only can only update state Terraform can already read, and it cannot invent bindings. Re-importing works but costs hours; hand-editing risks a state that parses but is wrong.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-remote-state-locking-q5",
          prompt: "Which of these are genuine benefits of a remote backend over local state? (Select all that apply.)",
          options: [
            "The state is shared, so CI and every engineer act on the same record",
            "Locking becomes possible, preventing concurrent writes",
            "The state file is not sitting unencrypted in someone's home directory or, worse, committed to Git",
            "The state file stops containing sensitive attribute values",
            "Terraform no longer needs to refresh against the provider",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Remote storage changes where state lives and who can write it. It does not change what state contains — secrets are still in there — and it has nothing to do with refresh.",
        },
        {
          id: "tf-remote-state-locking-q6",
          prompt:
            "You are moving a live stack's state from local files to an S3 backend. Which `init` flag actually carries the existing state across?",
          options: [
            "`terraform init -migrate-state`",
            "`terraform init -reconfigure`",
            "`terraform init -upgrade`",
            "`terraform init -backend=false`",
          ],
          correctIndex: 0,
          explanation:
            "`-migrate-state` copies state into the new backend and prompts for confirmation. `-reconfigure` discards the existing backend association and starts empty — on a live stack the next plan then proposes to create everything, which is the point at which people notice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-remote-state-locking-q7",
          prompt: "Why can't the `backend` block reference variables or locals?",
          options: [
            "The backend must be resolved before Terraform evaluates any configuration, so no variable values exist yet — per-environment values are supplied with `-backend-config` instead",
            "Backends are implemented in a different language that has no expression support",
            "It is an arbitrary restriction left over from Terraform 0.11",
            "Variables can be used, but only ones with a `default`",
          ],
          correctIndex: 0,
          explanation:
            "Terraform has to know where state is before it can read state or evaluate anything that depends on it — a chicken-and-egg problem. `-backend-config=env/prod.hcl` or repeated `-backend-config=key=value` flags fill the gap.",
        },
        {
          id: "tf-remote-state-locking-q8",
          prompt:
            "A networking stack exposes `vpc_id` as an output, and an application stack reads it with the `terraform_remote_state` data source. What is the design cost?",
          options: [
            "The application stack is coupled to the other stack's state file and its output names, and needs read access to that state — which also exposes every secret in it",
            "The data source cannot read outputs from a different backend type",
            "The application stack acquires a lock on the networking state on every plan",
            "Outputs read this way are always one apply out of date",
          ],
          correctIndex: 0,
          explanation:
            "Reading someone else's state means read permission on the whole file, secrets included. A provider data source (`aws_vpc` with a filter) or an SSM parameter gives the same value with a narrower contract.",
        },
        {
          id: "tf-remote-state-locking-q9",
          prompt:
            "Terraform refuses to run with `state snapshot was created by Terraform vX, which is newer than current vY`. What happened and what is the fix?",
          options: [
            "Someone applied with a newer CLI and the state format moved forward; upgrade your CLI to at least that version rather than downgrading the state",
            "The state file is corrupt and must be restored from a backup",
            "The provider versions differ between machines; run `terraform init -upgrade`",
            "The lock file is out of date; delete `.terraform.lock.hcl` and re-init",
          ],
          correctIndex: 0,
          explanation:
            "State records the version that wrote it and Terraform refuses to read a format from the future. This is exactly what `required_version` is meant to prevent, by making the mismatched binary fail before it writes anything.",
        },
        {
          id: "tf-remote-state-locking-q10",
          prompt: "What safety check does `terraform state push` apply by default?",
          options: [
            "It refuses a state whose `lineage` differs or whose `serial` is not newer than the one already stored",
            "It refuses any push while a lock is held by anyone, including yourself",
            "It validates every resource against the provider's schema first",
            "It requires the configuration to produce an empty plan first",
          ],
          correctIndex: 0,
          explanation:
            "Lineage and serial stop you pasting an unrelated or stale state over a live one. `-force` skips the checks, which should be a deliberate, backed-up decision.",
        },
        {
          id: "tf-remote-state-locking-q11",
          prompt:
            "A team keeps `terraform.tfstate` in Git and two engineers apply on the same afternoon. Beyond a merge conflict, what is the specific danger?",
          options: [
            "Whoever merges second overwrites the other's bindings, and the resources recorded only in the discarded state become orphans nobody manages",
            "Git corrupts the JSON encoding of the state file",
            "Terraform refuses to read a state file that has been through a merge",
            "The resources are destroyed when the conflicting commit is reverted",
          ],
          correctIndex: 0,
          explanation:
            "A text merge of two state files produces something structurally plausible and semantically wrong, and nothing in Terraform will tell you. State in Git also means secrets in Git, permanently, in the history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-remote-state-locking-q12",
          prompt: "Which statements about `-lock=false` are accurate? (Select all that apply.)",
          options: [
            "It is legitimate for a read-only operation on a backend you know nobody else is writing to",
            "It does not remove an existing lock — it only skips taking one",
            "It makes concurrent applies safe because Terraform falls back to optimistic concurrency",
            "Using it during an apply can produce state that reflects neither of two concurrent runs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "There is no optimistic-concurrency fallback: skipping the lock simply removes the protection. Its narrow legitimate use is working around a broken locking backend for a read, never for an apply on a shared stack.",
        },
      ],
    },
    {
      id: "tf-plan-apply",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "The Plan/Apply Cycle: Reading a Plan Properly",
      summary:
        "A plan is produced in three steps: read the configuration, refresh each managed object against the provider, then diff desired against actual and emit a list of actions. Reading one properly is the single most valuable Terraform skill, because the plan is the last point at which a destructive change is cheap to stop.\n\nThe symbols are fixed and worth memorising: `+` create, `~` update in place, `-` destroy, and `-/+` destroy and then create a replacement (with `create_before_destroy` set, it prints as `+/-` — create, then destroy). The header comment above each block is where the real information is: `will be updated in-place`, `must be replaced`, or `will be destroyed` followed by a parenthetical reason such as `(because aws_s3_bucket.old is not in configuration)`. Inside a replacement, the attribute responsible is annotated `# forces replacement` — that one line is what you are looking for before you approve anything touching a database, a volume or a stateful service.\n\nThe summary line is the least informative part of the output. \"Plan: 3 to add, 0 to change, 1 to destroy\" does not say which resource is being destroyed or why; on a large configuration it is entirely possible to approve the destruction of a production RDS instance by reading only that line. `(known after apply)` is the other thing to watch: an unknown value propagates, so one genuinely unknown attribute can make a dozen downstream attributes unknown and turn a small change into a page of churn.\n\nIf what gets applied must be exactly what was reviewed, you need a saved plan: `terraform plan -out=tfplan` then `terraform apply tfplan`. A bare `terraform apply` re-plans against whatever the world looks like at that moment, and will happily do something different from what you read ten minutes earlier. `-detailed-exitcode` makes plans scriptable — 0 for no changes, 1 for error, 2 for changes — and is how a pipeline decides whether there is anything to approve. `-target` exists, produces a deliberately partial plan, and should feel uncomfortable every time.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Terraform: terraform plan command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/plan", kind: "docs" },
        { label: "Terraform: terraform apply command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/apply", kind: "docs" },
        { label: "Terraform: lifecycle meta-argument", url: "https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle", kind: "docs" },
        { label: "Terraform: JSON output format", url: "https://developer.hashicorp.com/terraform/internals/json-format", kind: "docs" },
      ],
      video: {
        title: "Complete Terraform Course - From BEGINNER to PRO! (Learn Infrastructure as Code)",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=7xngnjfIlK4",
        videoId: "7xngnjfIlK4",
        startSeconds: 1712,
        chapterLabel: "Part 3: Basic Terraform Usage",
        durationLabel: "2:38:04",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-plan-apply-q1",
          prompt:
            "What is this plan telling you?\n\n```text\n  # aws_db_instance.main must be replaced\n-/+ resource \"aws_db_instance\" \"main\" {\n      ~ engine_version = \"15.4\" -> \"16.2\" # forces replacement\n      ~ id             = \"db-ABCD\" -> (known after apply)\n    }\n\nPlan: 1 to add, 0 to change, 1 to destroy.\n```",
          options: [
            "The existing database will be destroyed and a new one created, because `engine_version` cannot be changed in place for this resource",
            "The database will be upgraded in place to engine version 16.2",
            "A second database will be created alongside the existing one",
            "The database will be destroyed and not recreated",
          ],
          correctIndex: 0,
          explanation:
            "`-/+` plus `must be replaced` plus `# forces replacement` on `engine_version` is the destroy-then-create signature. The summary line — \"1 to add, 1 to destroy\" — is the same shape you would see for two unrelated resources, which is why the summary alone is not enough.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-plan-apply-q2",
          prompt: "Match the symbols. Which mapping is correct?",
          options: [
            "`+` create, `~` update in place, `-` destroy, `-/+` destroy then create",
            "`+` create, `~` replace, `-` destroy, `-/+` update in place",
            "`+` create, `~` update in place, `-` replace, `-/+` destroy",
            "`+` add to state, `~` refresh, `-` remove from state, `-/+` re-import",
          ],
          correctIndex: 0,
          explanation:
            "These are the four actions Terraform prints in its own legend. When `create_before_destroy` is set the replacement prints as `+/-` instead, reflecting the reversed order.",
        },
        {
          id: "tf-plan-apply-q3",
          prompt:
            "Why does `terraform plan -out=tfplan` followed by `terraform apply tfplan` matter in a pipeline?",
          options: [
            "Applying a saved plan executes exactly the actions that were reviewed; a bare `terraform apply` re-plans and may do something different",
            "It is faster, because apply skips the refresh step",
            "It is the only way to apply without an interactive prompt",
            "It locks the state for the whole window between plan and apply",
          ],
          correctIndex: 0,
          explanation:
            "The saved plan is the artefact the approval refers to. A bare apply is auto-approved against a fresh plan of whatever the world looks like then — `-auto-approve` is a separate flag and does not give you that guarantee. The lock is released between the two commands.",
        },
        {
          id: "tf-plan-apply-q4",
          prompt: "What do the exit codes of `terraform plan -detailed-exitcode` mean?",
          options: [
            "0 = no changes, 1 = error, 2 = changes present",
            "0 = success, 1 = changes present, 2 = error",
            "0 = no changes, 1 = changes present, 2 = error",
            "0 = plan written, 1 = plan empty, 2 = plan rejected",
          ],
          correctIndex: 0,
          explanation:
            "This is what lets a pipeline branch: skip the approval step on 0, fail the build on 1, and request approval on 2. Note that 2 is a success, so a naive `set -e` script treats a plan with changes as a failure.",
        },
        {
          id: "tf-plan-apply-q5",
          prompt:
            "A one-line tag change produces a plan full of `(known after apply)` on resources you did not touch. What is the usual cause?",
          options: [
            "An unknown value propagates: something upstream is unknown until apply, so every attribute derived from it is unknown too",
            "The state file is stale and needs `terraform refresh`",
            "The provider cannot read the current values and is guessing",
            "Terraform always recomputes every attribute on every plan",
          ],
          correctIndex: 0,
          explanation:
            "Unknowns cascade down the graph. A resource being replaced, a `depends_on` that widens the uncertainty, or a value computed at apply time all trigger it. The changes are usually not real — but you cannot tell from the plan, which is the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-plan-apply-q6",
          prompt: "Which `lifecycle` settings change what a plan does? (Select all that apply.)",
          options: [
            "`prevent_destroy = true` makes the plan fail rather than propose destroying the resource",
            "`ignore_changes = [tags]` stops drift in that attribute from producing a diff",
            "`create_before_destroy = true` reverses the order of a replacement, so the new object exists before the old one is removed",
            "`replace_triggered_by` forces replacement when a referenced value changes",
            "`skip_refresh = true` excludes the resource from the refresh step",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Those four are real `lifecycle` arguments. There is no `skip_refresh` — refreshing is controlled globally with `-refresh=false` or per-resource by not managing the attribute at all.",
        },
        {
          id: "tf-plan-apply-q7",
          prompt:
            "You need a degraded instance rebuilt without changing any configuration. What is the current mechanism?",
          options: [
            "`terraform apply -replace=aws_instance.web`",
            "`terraform taint aws_instance.web` followed by an apply",
            "Delete the resource from state and re-apply",
            "`terraform apply -refresh-only`",
          ],
          correctIndex: 0,
          explanation:
            "`-replace` (available since 0.15.2) plans the replacement so you can review it before approving. `terraform taint` is the older command that mutated state first and asked questions later; it still exists but is documented as deprecated in favour of `-replace`.",
        },
        {
          id: "tf-plan-apply-q8",
          prompt:
            "Read this fragment. What is happening, and is it safe?\n\n```text\n  # aws_s3_bucket.logs will be destroyed\n  # (because aws_s3_bucket.logs is not in configuration)\n- resource \"aws_s3_bucket\" \"logs\" {\n    - bucket = \"acme-prod-logs\" -> null\n  }\n```",
          options: [
            "The block was deleted from the configuration, so Terraform proposes to delete the bucket — deleting the block does not mean \"stop managing it\"",
            "The bucket already no longer exists and Terraform is cleaning up state",
            "The bucket is being replaced; the create half is elsewhere in the plan",
            "Terraform lost the binding and will re-import the bucket",
          ],
          correctIndex: 0,
          explanation:
            "Removing a resource from configuration is a request to destroy it. To stop managing something without deleting it, use a `removed` block with `destroy = false`, or `terraform state rm`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-plan-apply-q9",
          prompt: "What is `terraform plan -refresh-only` for?",
          options: [
            "Reconciling state with changes that were made outside Terraform, without proposing to undo them",
            "Refreshing the provider plugins to their latest versions",
            "Planning without reading the state file",
            "Showing only the resources whose configuration changed",
          ],
          correctIndex: 0,
          explanation:
            "It is the mode for after an out-of-band change: you review the drift and accept it into state, instead of a normal plan proposing to revert it. Applying a refresh-only plan writes no infrastructure changes.",
        },
        {
          id: "tf-plan-apply-q10",
          prompt: "Why should `-target` feel uncomfortable?",
          options: [
            "It produces a deliberately partial plan that ignores parts of the graph, so the resulting state can be internally inconsistent and the next full plan can surprise you",
            "It is not supported on remote backends",
            "It silently ignores `depends_on`",
            "It applies without taking a state lock",
          ],
          correctIndex: 0,
          explanation:
            "Terraform itself prints a warning describing it as an exceptional recovery tool. It still respects dependencies of the targeted resource and still locks — the problem is everything it leaves out.",
        },
        {
          id: "tf-plan-apply-q11",
          prompt:
            "A pipeline needs to decide automatically whether a plan is destructive. What is the robust way to do it?",
          options: [
            "`terraform show -json tfplan` and inspect each `resource_changes[*].change.actions` array for `delete`",
            "Grep the human-readable plan output for the word \"destroy\"",
            "Count the lines beginning with `-` in the plan output",
            "Compare the plan file's size against the previous run's",
          ],
          correctIndex: 0,
          explanation:
            "The JSON plan format is a documented, stable interface; actions come through as arrays such as `[\"delete\"]` or `[\"delete\",\"create\"]`. Text parsing breaks on the first formatting change and on any resource whose name contains the word.",
        },
        {
          id: "tf-plan-apply-q12",
          prompt:
            "The plan shows `~ update in-place` on a security group, but the apply destroys and recreates it. How is that possible?",
          options: [
            "The apply re-planned against current reality — the object changed, or was deleted, between plan and apply, which is exactly what a saved plan prevents",
            "Terraform's plan output is only an estimate and the provider decides during apply",
            "Security groups are always replaced regardless of the plan",
            "The state file was locked, so Terraform fell back to replacement",
          ],
          correctIndex: 0,
          explanation:
            "Without `-out`, apply computes a fresh plan. If someone deleted the group in the console in the meantime the fresh plan is a create, and if a referenced attribute changed it can become a replacement. A saved plan refuses to apply once the state has moved on, which turns a silent difference into a loud failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "tf-dependencies",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Dependencies: Implicit, Explicit and the Graph",
      summary:
        "Terraform builds a directed acyclic graph from the references between resources and walks it, creating independent nodes in parallel (ten at a time by default) and ordering dependent ones. Writing `subnet_id = aws_subnet.private.id` is an *implicit* dependency: the reference is the edge. This is the normal, correct way to express ordering, and it is self-maintaining — delete the reference and the edge disappears with it.\n\n`depends_on` exists for the edges a reference cannot express: an instance that needs an IAM policy attached before its user-data script runs, a Lambda that needs a bucket policy in place before its first invocation, an API that must exist before something that talks to it over the network rather than through an argument. The documentation calls it a last resort, and the reason is not stylistic. Because Terraform cannot see *what* the upstream resource will change, an explicit dependency forces it to treat more downstream values as unknown, so plans become more conservative and show more `(known after apply)` churn than they need to. A `depends_on` on a module call applies to every resource inside it, which can turn a whole subtree unknown.\n\nData sources deserve their own note. A data source with no dependency on a managed resource is read during the plan. One that does depend on a managed resource — directly or through `depends_on` — is deferred until apply, and everything derived from it becomes unknown at plan time. That is the usual explanation for a plan that is far vaguer than the change deserves.\n\nDestroy order comes from the same graph, reversed, using the dependency metadata recorded in state — which is why that metadata exists. The classic failure is a cycle: `Error: Cycle: ...` almost always means two resources reference each other's attributes, or somebody added a `depends_on` to \"make sure\" of an ordering that a reference already guaranteed, and closed a loop. `terraform graph` renders the graph in DOT format; since 1.7 the default is a simplified resource-only view, with `-type=plan` for the fuller approximation.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Terraform: depends_on meta-argument", url: "https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on", kind: "docs" },
        { label: "Terraform: Resource Dependency Graph", url: "https://developer.hashicorp.com/terraform/internals/graph", kind: "docs" },
        { label: "Terraform: terraform graph command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/graph", kind: "docs" },
      ],
      video: {
        title: "Terraform Tutorial for Beginners + Labs: Complete Step by Step Guide!",
        channel: "KodeKloud",
        url: "https://www.youtube.com/watch?v=YcJ9IeukJL8",
        videoId: "YcJ9IeukJL8",
        startSeconds: 4201,
        chapterLabel: "Resource Dependencies in Terraform",
        durationLabel: "1:55:06",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-dependencies-q1",
          prompt: "What creates an implicit dependency between two resources?",
          options: [
            "One resource's arguments referencing an attribute of the other",
            "The two resources appearing in the same file",
            "The two resources sharing a provider configuration",
            "The two resources having similar names",
          ],
          correctIndex: 0,
          explanation:
            "The reference is the edge. Sharing a file or a provider creates no ordering at all, which is why a resource that must come second but references nothing needs `depends_on`.",
        },
        {
          id: "tf-dependencies-q2",
          prompt:
            "Why does the documentation describe `depends_on` as a last resort rather than a matter of taste?",
          options: [
            "Terraform cannot tell what the upstream resource will change, so it treats more downstream values as unknown and produces a more conservative plan than necessary",
            "It is slower, because Terraform disables parallelism for the whole graph",
            "It is ignored during destroy, so ordering is only half-enforced",
            "It prevents the resource from ever being replaced",
          ],
          correctIndex: 0,
          explanation:
            "An implicit dependency tells Terraform exactly which value matters; `depends_on` only says \"something over there might matter\". The result is extra `(known after apply)` markers and sometimes extra replacements. Destroy ordering does honour it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-dependencies-q3",
          prompt: "What does `depends_on` on a `module` block do?",
          options: [
            "Every resource and data source inside that module waits for the listed dependencies",
            "Only the module's outputs are deferred; its resources are unaffected",
            "It is ignored — `depends_on` is only valid on resources",
            "Only the first resource declared in the module waits",
          ],
          correctIndex: 0,
          explanation:
            "It applies to the whole subtree, which is powerful and blunt: the conservatism penalty applies to every resource in the module, so a `depends_on` on a large module can make a plan very vague.",
        },
        {
          id: "tf-dependencies-q4",
          prompt: "Which of these genuinely need `depends_on`? (Select all that apply.)",
          options: [
            "An EC2 instance whose user-data calls an API that only works once an IAM policy attachment exists",
            "A Lambda function that writes to a bucket at runtime and needs the bucket policy applied first",
            "A subnet that is created inside a VPC and already sets `vpc_id = aws_vpc.main.id`",
            "An instance whose `ami` comes from a data source",
            "A security group rule that references its security group's id",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The first two are runtime relationships invisible to the graph — nothing in the configuration references the policy. The last three already carry references, and adding `depends_on` on top only makes the plan worse.",
        },
        {
          id: "tf-dependencies-q5",
          prompt:
            "A plan fails with `Error: Cycle: aws_security_group.app, aws_security_group.db`. What is the usual cause and the usual fix?",
          options: [
            "The two groups reference each other's ids; break the loop by moving the rules into separate `aws_security_group_rule` (or `vpc_security_group_ingress_rule`) resources",
            "Terraform needs `-parallelism=1` so it can order them one at a time",
            "One of the groups needs `depends_on` pointing at the other",
            "The state file has a stale dependency edge; run `terraform refresh`",
          ],
          correctIndex: 0,
          explanation:
            "Mutual references are a genuine cycle and no ordering flag can resolve it. Separating the rules from the group breaks the loop, because a rule can reference both groups without either group referencing the other. Adding `depends_on` would only tighten the cycle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-dependencies-q6",
          prompt:
            "A `data \"aws_ami\"` block is read during plan, but after adding `depends_on = [aws_instance.builder]` the plan shows its result as `(known after apply)`. Why?",
          options: [
            "A data source that depends on a managed resource is deferred to apply, so nothing derived from it can be known at plan time",
            "`depends_on` is not valid on data sources and is silently ignored",
            "The AMI id genuinely changes on every plan",
            "Data sources are always read at apply time",
          ],
          correctIndex: 0,
          explanation:
            "Terraform cannot read the data source until the thing it depends on has been created, so the read moves to apply. A data source with no such dependency is read during the plan and its values are known.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-dependencies-q7",
          prompt: "How does Terraform decide the order in which to destroy resources?",
          options: [
            "It reverses the dependency edges, using the metadata recorded in state so the order is known even for resources no longer in the configuration",
            "It destroys resources in the reverse of the order they appear in the files",
            "It destroys everything in parallel and retries whatever fails",
            "It asks the provider for a destruction order",
          ],
          correctIndex: 0,
          explanation:
            "Reverse-dependency order is why a subnet is removed before its VPC. The state metadata matters because by the time you destroy, the configuration may be empty.",
        },
        {
          id: "tf-dependencies-q8",
          prompt: "What does `-parallelism=n` control, and what is the default?",
          options: [
            "The number of concurrent operations Terraform performs while walking the graph; the default is 10",
            "The number of provider plugin processes started; the default is 1 per provider",
            "The number of resources refreshed in a single API call; the default is 25",
            "The number of retries for a failed API call; the default is 3",
          ],
          correctIndex: 0,
          explanation:
            "Lowering it is the standard mitigation for provider API rate limiting. It never changes the order — dependencies are always respected, parallelism only affects how many independent nodes run at once.",
        },
        {
          id: "tf-dependencies-q9",
          prompt: "Which value is valid for `depends_on`?",
          options: [
            "A static list of references such as `[aws_iam_role_policy.example, module.network]`",
            "A conditional expression such as `var.enabled ? [aws_iam_role.a] : []`",
            "A string containing a resource address",
            "Any expression that evaluates to a list of ids",
          ],
          correctIndex: 0,
          explanation:
            "`depends_on` is resolved while building the graph, before any expression is evaluated, so it has to be a literal list of references to resources, modules, data sources or variables — not a computed value and not a string.",
        },
        {
          id: "tf-dependencies-q10",
          prompt: "You inherit a configuration where nearly every resource has a `depends_on`. What is the concrete harm?",
          options: [
            "Plans are noisier and more conservative than the changes warrant, so real destructive changes are harder to spot in the noise",
            "Applies become non-deterministic",
            "Terraform refuses to parallelise anything, so applies take much longer",
            "The dependency metadata in state is not written, so destroys are unordered",
          ],
          correctIndex: 0,
          explanation:
            "The cost lands on review. A plan full of unnecessary unknowns is a plan people stop reading carefully, which is precisely when the `must be replaced` line gets missed.",
        },
        {
          id: "tf-dependencies-q11",
          prompt: "What does `terraform graph` emit?",
          options: [
            "A DOT-format description of the graph, which you pipe to Graphviz to render — by default a simplified resource-only view, with `-type=plan` for the fuller one",
            "A PNG image of the dependency graph",
            "An ASCII tree printed to the terminal",
            "A JSON document matching the plan's JSON output format",
          ],
          correctIndex: 0,
          explanation:
            "It prints DOT and nothing else; rendering is up to you. The default was simplified to resource-level relationships in 1.7, because the raw internal graph exposes implementation detail that is rarely what you wanted to see.",
        },
      ],
    },
    {
      id: "tf-modules",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Modules: Writing, Composing and Versioning",
      summary:
        "Every configuration is already a module — the root module. A child module is just a directory of `.tf` files called with a `module` block, where `variable` blocks are its parameters and `output` blocks are its return values. Nothing else is visible from outside: no resource inside a module can be referenced from its caller, which is the property that makes a module a contract rather than an include.\n\nThe common mistake is treating modules as deduplication. A module that wraps one resource and exposes every one of its arguments as a variable is a worse API than the provider, because it adds a layer, a version and a place for the passthrough to fall behind the provider's schema. Modules earn their keep when they encode a decision: \"a service at this company means an ECS task, a target group, a log group with 30-day retention, and these tags\". If you cannot say what decision a module makes, it probably should not exist.\n\nSources determine versioning, and they do not all behave the same way. A registry source (`terraform-aws-modules/vpc/aws`) accepts a `version` constraint. A Git source pins with a URL fragment — `git::https://github.com/acme/tf-modules.git//vpc?ref=v1.4.0` — and `version` is not allowed. A local path (`./modules/vpc`) takes no version at all, which is correct: the repository commit is the version.\n\nTwo things reliably catch the person who inherits the repository. First, **module versions are not locked**: `.terraform.lock.hcl` tracks providers only, and Terraform explicitly does not remember which module version it chose, so a constraint like `~> 3.0` resolves to the newest matching release every time someone runs `init` — two engineers can legitimately be running different module versions from the same commit. Second, a Git `?ref=` that points at a deleted tag or a moved branch fails at `init` with a checkout error, and if it points at a *branch* rather than a tag it is not pinned at all. Pin tags or commit SHAs, and pin exactly in root modules.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Terraform: Creating Modules", url: "https://developer.hashicorp.com/terraform/language/modules/develop", kind: "docs" },
        { label: "Terraform: Use modules in your configuration", url: "https://developer.hashicorp.com/terraform/language/modules/configuration", kind: "docs" },
        { label: "Terraform: Standard Module Structure", url: "https://developer.hashicorp.com/terraform/language/modules/develop/structure", kind: "docs" },
        { label: "Terraform Best Practices: module design", url: "https://www.terraform-best-practices.com/", kind: "article" },
      ],
      video: {
        title: "Terraform Basics: Modules",
        channel: "Ned in the Cloud",
        url: "https://www.youtube.com/watch?v=GSXx8AZjKK4",
        videoId: "GSXx8AZjKK4",
        durationLabel: "15:23",
      },
      alternateVideos: [
        {
          title: "20/30 - Terraform Custom Modules for EKS - From Zero to Production",
          channel: "Tech Tutorials with Piyush",
          url: "https://www.youtube.com/watch?v=a_j6Gq-KtxE",
          videoId: "a_j6Gq-KtxE",
          durationLabel: "32:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-modules-q1",
          prompt: "Which `module` blocks are valid? (Select all that apply.)",
          options: [
            "`source = \"terraform-aws-modules/vpc/aws\"` with `version = \"~> 5.0\"`",
            "`source = \"git::https://github.com/acme/mods.git//vpc?ref=v1.4.0\"` with no `version` argument",
            "`source = \"./modules/vpc\"` with no `version` argument",
            "`source = \"git::https://github.com/acme/mods.git//vpc\"` with `version = \"1.4.0\"`",
            "`source = \"./modules/vpc\"` with `version = \"~> 2.0\"`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`version` is only meaningful for registry sources, because only a registry can enumerate releases. Git sources pin with `?ref=`, and a local path is versioned by the repository it lives in.",
        },
        {
          id: "tf-modules-q2",
          prompt:
            "Two engineers check out the same commit and run `terraform init`. The configuration calls a registry module with `version = \"~> 3.0\"`. Can they end up with different module versions?",
          options: [
            "Yes — the dependency lock file tracks providers only, so Terraform resolves the newest matching module release each time",
            "No — `.terraform.lock.hcl` records module versions alongside provider versions",
            "No — the module version is written into state after the first apply",
            "Only if one of them passes `-upgrade`",
          ],
          correctIndex: 0,
          explanation:
            "Terraform's own documentation states that it does not remember version selections for remote modules. If you need module versions reproducible across machines, pin them exactly or vendor them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-modules-q3",
          prompt:
            "You inherit a repository where `terraform init` fails with a Git checkout error on a module source ending `?ref=v2.3.0`. What is the most likely cause?",
          options: [
            "The tag was deleted or renamed in the source repository, so there is nothing to check out",
            "The module was removed from the Terraform Registry",
            "The provider lock file no longer matches the module",
            "The module requires a newer Terraform CLI",
          ],
          correctIndex: 0,
          explanation:
            "Git refs are resolved at `init` time against whatever the repository currently contains, and there is no cache or lock protecting you. A commit SHA cannot be moved or deleted this way, which is the argument for pinning to SHAs in anything long-lived.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-modules-q4",
          prompt: "How does a caller read a value produced inside a child module?",
          options: [
            "Through an `output` in the child, referenced as `module.<name>.<output>`",
            "Directly, as `module.<name>.aws_instance.web.id`",
            "By declaring the same resource in the root module",
            "Through `terraform_remote_state` pointed at the module directory",
          ],
          correctIndex: 0,
          explanation:
            "A module's resources are not addressable from outside; outputs are the entire public surface. That encapsulation is what lets a module change its internals without breaking callers.",
        },
        {
          id: "tf-modules-q5",
          prompt: "Why should a reusable module normally avoid declaring its own `provider` block?",
          options: [
            "A module with its own provider configuration cannot be used with `count` or `for_each` and cannot be given an aliased provider by the caller, so it stops composing",
            "Provider blocks are not valid syntax inside a module",
            "It would force every caller onto the same provider version",
            "The provider would be initialised twice, doubling API calls",
          ],
          correctIndex: 0,
          explanation:
            "Terraform requires provider configuration to be resolvable before instance expansion. A module that declares `configuration_aliases` in `required_providers` and receives providers through the `providers` argument stays usable in every context.",
        },
        {
          id: "tf-modules-q6",
          prompt: "Which layout does the standard module structure describe for a publishable module?",
          options: [
            "`main.tf`, `variables.tf` and `outputs.tf` at the root, a `README.md`, and optional `examples/` and nested `modules/` directories",
            "A single `module.tf` containing everything",
            "A `src/` directory with the `.tf` files and a `dist/` directory with rendered JSON",
            "One file per resource, named after the resource type",
          ],
          correctIndex: 0,
          explanation:
            "The convention matters because the registry and the documentation tooling both rely on it — `examples/` is what gets rendered as usage, and the variable and output descriptions become the module's reference page.",
        },
        {
          id: "tf-modules-q7",
          prompt:
            "A module needs to be instantiated once per environment from a map. Which is correct?",
          options: [
            "`for_each` on the `module` block, with instances addressed as `module.env[\"prod\"]`",
            "A `for` expression wrapping the `module` block",
            "Copy the `module` block once per environment — modules do not support `for_each`",
            "`count` only; `for_each` is not valid on modules",
          ],
          correctIndex: 0,
          explanation:
            "Modules accept `count`, `for_each`, `depends_on` and `providers` as meta-arguments, and the instance addresses follow the same indexing rules as resources.",
        },
        {
          id: "tf-modules-q8",
          prompt:
            "A module wraps a single `aws_s3_bucket` and exposes 31 variables, one per provider argument. What is the argument against it?",
          options: [
            "It adds a version, a layer and a maintenance burden without encoding any decision — and it will fall behind the provider's schema",
            "Modules are not allowed to contain fewer than three resources",
            "Provider arguments cannot be passed through variables",
            "It will make plans significantly slower",
          ],
          correctIndex: 0,
          explanation:
            "A passthrough module is strictly worse than using the resource, because every new provider argument is now a feature request. Modules should encode an opinion; if there is no opinion, use the resource.",
        },
        {
          id: "tf-modules-q9",
          prompt: "What does the `//` in `git::https://github.com/acme/mods.git//vpc?ref=v1.4.0` mean?",
          options: [
            "The subdirectory within the repository that contains the module",
            "A comment marker, as in many programming languages",
            "A branch separator",
            "An escape for the protocol prefix",
          ],
          correctIndex: 0,
          explanation:
            "It is the sub-path separator, which is how a monorepo of modules is consumed. `?ref=` selects the branch, tag or commit.",
        },
        {
          id: "tf-modules-q10",
          prompt: "You need to make a breaking change to a shared module. What does semantic versioning ask of you, and what does Terraform enforce?",
          options: [
            "Bump the major version and publish; Terraform enforces nothing beyond whatever constraint each caller wrote, so callers on `~> 2.0` simply stay on 2.x",
            "Terraform refuses to install a major version bump unless every caller is updated first",
            "Terraform automatically migrates state when a module's major version changes",
            "Breaking changes require a new module name; major versions are advisory only",
          ],
          correctIndex: 0,
          explanation:
            "The constraint is the only mechanism. This is why renaming a resource inside a module is a breaking change unless you ship a `moved` block with it — otherwise every caller who upgrades gets a destroy and a create.",
        },
        {
          id: "tf-modules-q11",
          prompt:
            "Upgrading a shared module from 2.x to 3.x renames a resource inside it. Callers upgrade and see destroys. What should the module author have shipped?",
          options: [
            "A `moved` block inside the module recording the old address and the new one, so every caller's state is rebound automatically",
            "A migration script that each caller runs with `terraform state mv`",
            "An `import` block for the renamed resource",
            "Nothing — renaming inside a module is invisible to callers",
          ],
          correctIndex: 0,
          explanation:
            "`moved` blocks travel with the module, so the rebinding happens for everyone on upgrade. Asking every caller to run `state mv` by hand is how one of them ends up destroying a database instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "tf-count-for-each",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "count vs for_each and the Index-Shift Trap",
      summary:
        "Both meta-arguments turn one block into many instances; the difference is how the instances are *addressed*, and since the address is the identity in state, that difference decides what happens when the collection changes. `count` addresses by integer position — `aws_instance.web[0]`. `for_each` addresses by map key or set member — `aws_instance.web[\"api\"]`.\n\nThe trap is what happens in the middle. Take `count = length(var.users)` over `[\"alice\", \"bob\", \"carol\"]` and remove `\"bob\"`. Index 0 is still alice. Index 1 was bob and is now carol, so Terraform plans to change instance 1 from bob to carol — which for most resources means a replacement. Index 2 no longer exists, so it is destroyed. You asked to delete one user and the plan touches two resources. With `for_each = toset(var.users)` the addresses are `[\"alice\"]`, `[\"bob\"]` and `[\"carol\"]`, nothing shifts, and only `[\"bob\"]` is destroyed. That is the whole argument, and it is why `for_each` is the default choice for anything keyed by a meaningful identity.\n\n`count` is still right in two cases: a boolean toggle (`count = var.enabled ? 1 : 0`, the idiomatic conditional resource), and genuinely interchangeable instances where the index carries no meaning — three identical workers, say. Reach for `count` deliberately, not by habit.\n\nThe real constraint on `for_each` is that its keys must be known at plan time. Deriving keys from something a provider only produces at apply — a generated bucket id, an ARN — fails with a message about the `for_each` value depending on resource attributes that cannot be determined until apply. Key on your own inputs instead. Two smaller consequences follow from `for_each` producing a map: splat expressions do not work on it (use `values()` or a `for` expression), and a sensitive value cannot be used as a key, because keys appear in resource addresses and in plan output.\n\nMigrating an existing `count` resource to `for_each` is not a free edit — every address changes. Ship `moved` blocks (one per instance, from `[0]` to `[\"alice\"]`) so the rebinding is in code, or do it manually with `terraform state mv` and accept that everyone else has to as well.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Terraform: count meta-argument", url: "https://developer.hashicorp.com/terraform/language/meta-arguments/count", kind: "docs" },
        { label: "Terraform: for_each meta-argument", url: "https://developer.hashicorp.com/terraform/language/meta-arguments/for_each", kind: "docs" },
        { label: "Terraform: For Expressions", url: "https://developer.hashicorp.com/terraform/language/expressions/for", kind: "docs" },
        { label: "Terraform: terraform state mv command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/state/mv", kind: "docs" },
      ],
      video: {
        title: "8/30 - AWS Terraform Meta Arguments Made EASY | Count, depends_on , for_each",
        channel: "Tech Tutorials with Piyush",
        url: "https://www.youtube.com/watch?v=XMMsnkovNX4",
        videoId: "XMMsnkovNX4",
        durationLabel: "29:24",
      },
      alternateVideos: [
        {
          title: "Terraform For_Each vs Count: The Ultimate Comparison",
          channel: "DevOps with Flavius",
          url: "https://www.youtube.com/watch?v=MrL-QeIjK60",
          videoId: "MrL-QeIjK60",
          durationLabel: "9:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-count-for-each-q1",
          prompt:
            "`var.users` is `[\"alice\", \"bob\", \"carol\"]` and the resource uses `count = length(var.users)` with `name = var.users[count.index]`. You remove `\"bob\"`. What does the plan show?",
          options: [
            "Instance `[1]` changes from bob to carol, and instance `[2]` is destroyed — two resources touched to remove one user",
            "Only instance `[1]` is destroyed",
            "Instances `[1]` and `[2]` are both destroyed and one is recreated as carol",
            "No change, because the same number of distinct names still exists minus one",
          ],
          correctIndex: 0,
          explanation:
            "Removing from the middle shifts every later element down one index, and the index is the identity. For a resource where `name` forces replacement, `[1]` is destroyed and recreated as carol while the real carol at `[2]` is destroyed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-count-for-each-q2",
          prompt: "The same resource uses `for_each = toset(var.users)` instead. You remove `\"bob\"`. Now what?",
          options: [
            "Only `aws_iam_user.this[\"bob\"]` is destroyed; alice and carol are untouched",
            "All three are destroyed and two are recreated",
            "Carol's instance is renamed",
            "Terraform errors, because removing an element from a set is not supported",
          ],
          correctIndex: 0,
          explanation:
            "Keys are stable, so the address of each surviving instance is unchanged and Terraform sees exactly one removal. This is the whole reason `for_each` is the default advice.",
        },
        {
          id: "tf-count-for-each-q3",
          prompt:
            "This fails at plan time. Why?\n\n```hcl\nresource \"aws_s3_bucket\" \"b\" {\n  for_each = toset([for i in aws_instance.node : i.id])\n  bucket   = \"logs-${each.key}\"\n}\n```",
          options: [
            "`for_each` keys must be known before apply, and instance ids are only produced when the instances are created",
            "`toset` cannot be applied to the result of a `for` expression",
            "`each.key` is not available when `for_each` is a set",
            "Bucket names cannot contain interpolations",
          ],
          correctIndex: 0,
          explanation:
            "Terraform must know the full set of instance addresses before it plans anything, so a key derived from an apply-time attribute is impossible. Key on your own input — the instance names or a map you control — and look the id up inside the body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-count-for-each-q4",
          prompt: "In which situations is `count` still the better choice? (Select all that apply.)",
          options: [
            "A conditional resource: `count = var.create_bastion ? 1 : 0`",
            "Three genuinely interchangeable workers where the index means nothing",
            "One S3 bucket per team, driven by a list of team names",
            "One subnet per availability zone, driven by a list of AZ names",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Where an element carries identity — a team, an AZ — you want a stable key. Where the collection is a toggle or a homogeneous count, `count` is simpler and nothing shifts meaningfully.",
        },
        {
          id: "tf-count-for-each-q5",
          prompt: "With `for_each = toset([\"a\", \"b\"])`, what are `each.key` and `each.value`?",
          options: [
            "Both are the set member — for a set they are identical",
            "`each.key` is the numeric index and `each.value` is the member",
            "`each.key` is the member and `each.value` is `null`",
            "Sets cannot be used with `for_each`; only maps can",
          ],
          correctIndex: 0,
          explanation:
            "For a set of strings, key and value are the same string. With a map, `each.key` is the map key and `each.value` is the corresponding value — which is how you attach per-instance configuration.",
        },
        {
          id: "tf-count-for-each-q6",
          prompt:
            "`for_each` is a map of objects. You change one object's `instance_type` but leave the keys alone. What does the plan show?",
          options: [
            "Only the instance whose value changed is affected; the others are untouched because their keys and values are unchanged",
            "Every instance is replaced, because the map as a whole changed",
            "Nothing, because `for_each` only reacts to key changes",
            "The map is re-sorted and every address shifts",
          ],
          correctIndex: 0,
          explanation:
            "Keys determine addresses; values determine each instance's arguments. Changing a value produces an ordinary diff on that one instance, in place or as a replacement depending on the attribute.",
        },
        {
          id: "tf-count-for-each-q7",
          prompt: "Can a single resource block use both `count` and `for_each`?",
          options: [
            "No — they are mutually exclusive on the same block",
            "Yes, and Terraform produces the cartesian product of the two",
            "Yes, but only when `count` is 0 or 1",
            "Yes on modules, no on resources",
          ],
          correctIndex: 0,
          explanation:
            "Instances have exactly one addressing scheme. Nesting behaviour is built instead by flattening a nested structure into a single map with `flatten` or a nested `for` expression and using `for_each` on the result.",
        },
        {
          id: "tf-count-for-each-q8",
          prompt:
            "You are converting an existing `count`-based resource to `for_each`. What should ship with the change?",
          options: [
            "`moved` blocks mapping each old index to its new key, so every consumer's state is rebound on apply",
            "Nothing — Terraform matches instances by their arguments",
            "A `terraform import` for each new address",
            "`lifecycle { ignore_changes = all }` during the transition",
          ],
          correctIndex: 0,
          explanation:
            "Without `moved`, the plan is a full destroy of the indexed instances and a full create of the keyed ones. `terraform state mv 'x[0]' 'x[\"alice\"]'` does the same thing manually, but only on the machine you run it on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-count-for-each-q9",
          prompt: "Which are true of a `for_each` resource compared with a `count` resource? (Select all that apply.)",
          options: [
            "It appears in expressions as a map of objects rather than a list",
            "Splat expressions such as `aws_instance.web[*].id` do not work on it",
            "Its keys must be strings and must be known at plan time",
            "It can use a sensitive value as a key, because keys are hidden in plan output",
            "It supports `count.index` for numbering the instances",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Keys appear in resource addresses and therefore in plan output and state, so sensitive values are rejected as keys. `count.index` only exists for `count`; with `for_each` you have `each.key` and `each.value`.",
        },
        {
          id: "tf-count-for-each-q10",
          prompt:
            "`count = var.enabled ? 1 : 0` is used on a bastion host. How do other resources reference its id safely?",
          options: [
            "Through an index, as `aws_instance.bastion[0].id`, and only where the resource is guaranteed to exist — otherwise via `one(aws_instance.bastion[*].id)` which yields `null` when the list is empty",
            "As `aws_instance.bastion.id`, since with `count = 1` the index is optional",
            "Only through an output, because counted resources cannot be referenced directly",
            "Through `each.value`",
          ],
          correctIndex: 0,
          explanation:
            "A resource with `count` is always a list, even at length 1, so the bare address is invalid. `one()` collapses a zero-or-one list to a value or `null`, which is what makes the toggle composable.",
        },
        {
          id: "tf-count-for-each-q11",
          prompt: "What does `toset([\"b\", \"a\", \"b\"])` produce, and why does it matter for `for_each`?",
          options: [
            "A set containing `\"a\"` and `\"b\"` — duplicates collapse, so two identical entries in a list silently become one instance",
            "A list `[\"b\", \"a\", \"b\"]` with the type changed but the contents preserved",
            "An error, because sets cannot contain duplicates in the source literal",
            "A map `{ 0 = \"b\", 1 = \"a\", 2 = \"b\" }`",
          ],
          correctIndex: 0,
          explanation:
            "Sets deduplicate. That is usually what you want, but it means a list with an accidental duplicate produces fewer resources than entries — with `count = length(...)` you would have got two.",
        },
        {
          id: "tf-count-for-each-q12",
          prompt:
            "A module is called with `for_each` over a map of environments. How is one instance's output referenced?",
          options: [
            "`module.env[\"prod\"].vpc_id`",
            "`module.env.prod.vpc_id`",
            "`module.env[0].vpc_id`",
            "`module.env.vpc_id[\"prod\"]`",
          ],
          correctIndex: 0,
          explanation:
            "Module instances are indexed exactly like resource instances: bracket notation with the key. The last option looks plausible but inverts the structure — the index belongs to the module, not the output.",
        },
      ],
    },
    {
      id: "tf-data-sources-provisioners",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Data Sources, and Provisioners as a Last Resort",
      summary:
        "A data source reads something Terraform does not own: an AMI selected by a filter, a VPC the networking team manages in another state, the account id you are running against, the list of availability zones in a region. It is the seam between your configuration and everything outside it, and it is how you avoid hard-coding identifiers that differ per account. A data source with no dependency on a managed resource is read during the plan, so its values are known; one that depends on a managed resource is deferred to apply, and everything derived from it shows as `(known after apply)`.\n\nThe hazard with data sources is non-determinism. `data \"aws_ami\"` with `most_recent = true` re-evaluates on every plan, so the day a new image is published your plan proposes to replace every instance that uses it. Sometimes that is exactly what you want; more often the team wanted a specific image and got a rolling one. Pin the query, or pin the id in a variable and change it deliberately.\n\nProvisioners (`local-exec`, `remote-exec`, `file`) run scripts as part of creating or destroying a resource, and HashiCorp's own documentation calls them a last resort. The reasons are concrete, not stylistic. Terraform cannot plan what a script will do, so a provisioner is invisible in the plan. It runs once, at create time, and never again — editing the script changes nothing until the resource is replaced. If a creation-time provisioner fails, Terraform marks the resource *tainted*, so the next apply destroys and recreates it, which on a stateful resource is a genuinely bad afternoon. Destroy-time provisioners (`when = destroy`) run before the object goes away, and if one fails the destroy fails with it.\n\nThe alternatives are almost always better: `user_data` or cloud-init for bootstrapping, a pre-baked image, a configuration-management tool run as its own step, or a provider resource that does the job properly. When you genuinely need \"run this local command when X changes\", the modern shape is `terraform_data` with `triggers_replace`, which is built into Terraform and replaces the old `null_resource` pattern that required the `null` provider.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Terraform: Query data from external sources", url: "https://developer.hashicorp.com/terraform/language/data-sources", kind: "docs" },
        { label: "Terraform: Provisioners", url: "https://developer.hashicorp.com/terraform/language/provisioners", kind: "docs" },
        { label: "Terraform: terraform_data resource reference", url: "https://developer.hashicorp.com/terraform/language/resources/terraform-data", kind: "docs" },
      ],
      video: {
        title: "Terraform Data Sources | How to Use Data Sources? - Part 12",
        channel: "Rahul Wagh",
        url: "https://www.youtube.com/watch?v=vCUdKKD3Kfk",
        videoId: "vCUdKKD3Kfk",
        durationLabel: "13:47",
      },
      alternateVideos: [
        {
          title: "19/30 - Terraform Provisioners (with demo) - local vs remote vs file",
          channel: "Tech Tutorials with Piyush",
          url: "https://www.youtube.com/watch?v=DkhAgYa0448",
          videoId: "DkhAgYa0448",
          durationLabel: "24:32",
        },
        {
          title: "What are terraform Provisioners? - Part 7",
          channel: "Rahul Wagh",
          url: "https://www.youtube.com/watch?v=xZGO7gYGlQY",
          videoId: "xZGO7gYGlQY",
          durationLabel: "22:00",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-data-sources-provisioners-q1",
          prompt: "What is a data source for?",
          options: [
            "Reading information about something Terraform does not manage, so the configuration can reference it without hard-coding identifiers",
            "Storing values that should persist between applies",
            "Declaring a resource that Terraform creates but does not destroy",
            "Importing an existing resource into state",
          ],
          correctIndex: 0,
          explanation:
            "Data sources are read-only queries against a provider. They never create, change or adopt anything — importing is a separate mechanism, and nothing about a data source makes a value persist.",
        },
        {
          id: "tf-data-sources-provisioners-q2",
          prompt:
            "A configuration uses `data \"aws_ami\" \"al2\"` with `most_recent = true` for the launch template's image. Six weeks later a plan nobody expected wants to replace the whole autoscaling group's instances. What happened?",
          options: [
            "AWS published a newer matching image, the data source re-evaluated, and the new id forces replacement",
            "The data source's state entry expired and had to be recreated",
            "The provider was upgraded and changed the filter semantics",
            "The instances drifted and Terraform is restoring them",
          ],
          correctIndex: 0,
          explanation:
            "`most_recent` is a live query, so the configuration's meaning changes without the configuration changing. If you want a controlled image rollout, put the AMI id in a variable and bump it in a reviewed commit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-data-sources-provisioners-q3",
          prompt: "When is a data source read during the plan, and when is it deferred to apply?",
          options: [
            "Read during the plan when nothing it depends on is a pending managed resource; deferred to apply when it depends on one",
            "Always read during the plan",
            "Always read at apply, since the provider may need credentials",
            "Read during the plan only if it has been read before and cached in state",
          ],
          correctIndex: 0,
          explanation:
            "Deferral is why a `depends_on` added to a data source turns its results, and everything downstream, into `(known after apply)`. It is the most common cause of a surprisingly vague plan.",
        },
        {
          id: "tf-data-sources-provisioners-q4",
          prompt:
            "A `remote-exec` provisioner on an instance fails halfway through, after the instance was created. What is the state of things?",
          options: [
            "The instance exists but is marked tainted, so the next apply destroys and recreates it",
            "The instance is rolled back and deleted immediately",
            "Terraform records the resource as created and moves on, leaving the script half-run",
            "The apply fails and nothing is written to state",
          ],
          correctIndex: 0,
          explanation:
            "Terraform taints on creation-time provisioner failure precisely because it cannot know what the half-run script left behind. `on_failure = continue` overrides this, which is often worse — it records success over an unknown state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-data-sources-provisioners-q5",
          prompt: "Which are real reasons the documentation treats provisioners as a last resort? (Select all that apply.)",
          options: [
            "Terraform cannot plan what a script will do, so the provisioner is invisible in the plan",
            "A creation-time provisioner runs once and never again, so editing the script has no effect until the resource is replaced",
            "A failed creation-time provisioner taints the resource, turning a script bug into a replacement",
            "Provisioners are not supported on any cloud provider's resources",
            "Provisioners cannot access variables or resource attributes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Provisioners work fine technically and can reference `self`, variables and `each` — the objection is that they sit outside the plan/apply model and make the plan untrustworthy.",
        },
        {
          id: "tf-data-sources-provisioners-q6",
          prompt: "What is the difference between `local-exec` and `remote-exec`?",
          options: [
            "`local-exec` runs on the machine running Terraform; `remote-exec` runs on the created resource over an SSH or WinRM `connection`",
            "`local-exec` runs before create and `remote-exec` runs after",
            "`local-exec` runs synchronously and `remote-exec` runs in the background",
            "They are aliases; `remote-exec` is the newer name",
          ],
          correctIndex: 0,
          explanation:
            "The distinction matters operationally: `remote-exec` needs network reachability and credentials from wherever Terraform runs, which is often the reason it works on a laptop and fails in CI.",
        },
        {
          id: "tf-data-sources-provisioners-q7",
          prompt: "What replaced the `null_resource` + `triggers` pattern, and why?",
          options: [
            "`terraform_data` with `triggers_replace` — it is built into Terraform, so it needs no extra provider",
            "`local_file` from the `local` provider",
            "A `check` block with an `assert`",
            "Nothing — `null_resource` is still the only way",
          ],
          correctIndex: 0,
          explanation:
            "`terraform_data` is a built-in resource that does what `null_resource` did — hold a value, and be replaced when a trigger changes — without depending on the `null` provider. `null_resource` still works in inherited configurations.",
        },
        {
          id: "tf-data-sources-provisioners-q8",
          prompt: "A `data \"aws_vpc\"` filter matches no VPC. What happens?",
          options: [
            "The plan fails with an error from the provider — a data source that finds nothing is an error, not an empty result",
            "The data source returns `null` and the plan continues",
            "The data source returns an empty object and downstream references become empty strings",
            "Terraform creates the VPC",
          ],
          correctIndex: 0,
          explanation:
            "Singular data sources are assertions that exactly one thing matches; zero and many are both errors. Plural forms such as `aws_vpcs` return lists and are the ones that can legitimately be empty.",
        },
        {
          id: "tf-data-sources-provisioners-q9",
          prompt: "Which are better alternatives to a `remote-exec` provisioner for bootstrapping an instance? (Select all that apply.)",
          options: [
            "`user_data` / cloud-init, executed by the instance itself at first boot",
            "A machine image baked in advance with the software already installed",
            "A configuration-management run triggered as a separate pipeline step after the apply",
            "A destroy-time provisioner that installs the software before the instance is removed",
            "Increasing `-parallelism` so the provisioner has time to finish",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three move the work somewhere it can be retried, versioned and observed independently of the apply. Destroy-time provisioners run before destruction, and parallelism has nothing to do with it.",
        },
        {
          id: "tf-data-sources-provisioners-q10",
          prompt:
            "A destroy-time provisioner (`when = destroy`) fails during `terraform destroy`. What is the consequence?",
          options: [
            "The destroy errors, the resource is not removed, and Terraform reruns the provisioners on the next apply",
            "Terraform logs the failure and removes the resource anyway",
            "The resource is removed from state but not from the provider",
            "The provisioner is skipped after three retries",
          ],
          correctIndex: 0,
          explanation:
            "Destroy provisioners run before the object is destroyed, so a failing one blocks the destroy entirely — which makes a teardown dependent on a script and a connection still working. It is a common reason an environment cannot be torn down cleanly.",
        },
        {
          id: "tf-data-sources-provisioners-q11",
          prompt:
            "Your application stack needs the networking team's VPC id. Which option couples the two stacks least?",
          options: [
            "A `data \"aws_vpc\"` lookup by a stable tag, so the contract is the tag rather than another team's state file",
            "A `terraform_remote_state` data source pointed at the networking state",
            "Copying the id into a variable and updating it by hand when it changes",
            "Importing the VPC into the application stack's state as well",
          ],
          correctIndex: 0,
          explanation:
            "A provider data source needs read permission on one resource and no knowledge of how the other team stores state. Remote state needs read access to the whole file, secrets included, and importing the same object twice breaks Terraform's one-object-per-instance assumption outright.",
        },
      ],
    },
    {
      id: "tf-environments",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Environments: Workspaces, Directories and Terragrunt",
      summary:
        "\"How do dev, staging and prod share the same code?\" has three mainstream answers, and inheriting a repository means recognising which one you are looking at.\n\n**Workspaces** give one configuration and one backend several named states — the S3 backend, for instance, stores non-default workspaces under `env:/<workspace>/<key>`. They are cheap and they are a real feature, but everything except the state is shared: the same backend, the same provider credentials, the same code path. Environment differences end up as `terraform.workspace == \"prod\" ? ... : ...` conditionals scattered through the configuration, which is the worst place for them. And because prod usually wants a *different cloud account* with different credentials, the single backend block that makes workspaces convenient is also what makes them unsuitable for it. The operational objection is blunter: nothing on screen tells you which workspace is selected, so \"I thought I was in dev\" is a real, recurring production incident.\n\n**Directory per environment** — `environments/prod/` with its own backend configuration, its own `.tfvars` and its own credentials, calling shared modules — is the default for a reason. Differences are visible in the tree, blast radius is bounded by the directory, CI can scope a job to one path, and reviewing `environments/prod/main.tf` tells you what prod is. The cost is duplicated root-module glue: the same module calls and the same backend boilerplate, several times.\n\n**Terragrunt** is a third-party wrapper that removes that duplication. A small `terragrunt.hcl` per environment points at a shared module, generates the backend block, and declares dependencies between stacks so `run-all` can order them. It buys DRY backends and cross-stack ordering; it costs a dependency, a second DSL, and a layer between you and Terraform's error messages.\n\nThe honest split: workspaces are a good fit for ephemeral, identical, same-account copies — a preview environment per branch. Directories are the default for dev/stage/prod. Terragrunt earns its place once the number of directories exceeds what one person can hold in their head. One more distinction worth knowing, because it causes confusion in documentation: CLI workspaces and HCP Terraform workspaces are different things with the same name.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Terraform: State — Workspaces", url: "https://developer.hashicorp.com/terraform/language/state/workspaces", kind: "docs" },
        { label: "Terraform: Manage workspaces (CLI)", url: "https://developer.hashicorp.com/terraform/cli/workspaces", kind: "docs" },
        { label: "Terragrunt: Quick Start", url: "https://docs.terragrunt.com/getting-started/quick-start/", kind: "docs" },
        { label: "Terraform: Backend block configuration", url: "https://developer.hashicorp.com/terraform/language/backend", kind: "docs" },
      ],
      video: {
        title: "Terraform Workspaces Are Bad Actually, And Here's Why.",
        channel: "Ned in the Cloud",
        url: "https://www.youtube.com/watch?v=6QgHLncP5VA",
        videoId: "6QgHLncP5VA",
        durationLabel: "20:32",
      },
      alternateVideos: [
        {
          title: "How To Structure Terraform Project (3 Levels)",
          channel: "Anton Putra",
          url: "https://www.youtube.com/watch?v=nMVXs8VnrF4",
          videoId: "nMVXs8VnrF4",
          durationLabel: "41:20",
        },
        {
          title: "Terragrunt Tutorial: Create VPC, EKS from Scratch!",
          channel: "Anton Putra",
          url: "https://www.youtube.com/watch?v=yduHaOj3XMg",
          videoId: "yduHaOj3XMg",
          durationLabel: "1:01:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-environments-q1",
          prompt: "What does creating a second CLI workspace actually give you?",
          options: [
            "A second, separate state within the same backend, for the same configuration",
            "A copy of the configuration you can edit independently",
            "A second backend with its own credentials",
            "A separate provider plugin cache",
          ],
          correctIndex: 0,
          explanation:
            "Workspaces multiply state and nothing else. Same configuration, same backend, same credentials — which is why they cannot express \"prod lives in a different AWS account\".",
        },
        {
          id: "tf-environments-q2",
          prompt: "Which of these do workspaces *not* isolate? (Select all that apply.)",
          options: [
            "The backend configuration and therefore the storage account or bucket",
            "The provider credentials the run uses",
            "The configuration code itself — every workspace runs the same `.tf` files",
            "The state file",
            "The resource addresses recorded in state",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "State is the only thing that differs. Everything else is shared, which is the source of both their convenience and their unsuitability for cross-account production isolation.",
        },
        {
          id: "tf-environments-q3",
          prompt:
            "A configuration is full of `instance_type = terraform.workspace == \"prod\" ? \"m6i.2xlarge\" : \"t3.micro\"`. What is the specific problem, beyond aesthetics?",
          options: [
            "The environment's shape is scattered across the codebase instead of living in one reviewable place, so nobody can answer \"what is prod?\" without reading everything",
            "`terraform.workspace` is not available during plan",
            "Ternaries are evaluated at apply time, so the plan is wrong",
            "Terraform disallows more than one `terraform.workspace` reference per file",
          ],
          correctIndex: 0,
          explanation:
            "The value is available and the ternary works fine — that is exactly why the pattern spreads. The cost is that a `prod.tfvars` file or a `environments/prod/` directory would have answered the question in one place.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-environments-q4",
          prompt: "Where does the S3 backend store the state for a workspace named `staging`?",
          options: [
            "Under `env:/staging/<key>` in the same bucket",
            "In a separate bucket named after the workspace",
            "Under `<key>.staging` in the same bucket",
            "In the same object, as a second top-level entry in the JSON",
          ],
          correctIndex: 0,
          explanation:
            "The prefix is configurable with `workspace_key_prefix`. The `default` workspace is the exception: it is stored at the bare `key`, which is why migrating an existing stack into a named workspace is not a no-op.",
        },
        {
          id: "tf-environments-q5",
          prompt:
            "Someone runs `terraform apply` intending to change dev, but the selected workspace is `prod`. What in the workflow would have caught it?",
          options: [
            "Environment-per-directory with separate credentials, so the prod directory is a different path with a different role and CI job",
            "Adding `prevent_destroy` to every production resource",
            "Running `terraform plan` first — the plan output states the workspace prominently",
            "Enabling state locking on the backend",
          ],
          correctIndex: 0,
          explanation:
            "Locking prevents concurrent writes, not wrong-target writes, and `prevent_destroy` only guards deletions. Separation by path and by credential is the control that actually makes the mistake impossible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-environments-q6",
          prompt: "Why do per-environment backends usually end up as `-backend-config` files rather than as differences in the `backend` block?",
          options: [
            "The `backend` block cannot use variables or interpolation, because it is resolved before any configuration is evaluated",
            "Terraform allows only one `backend` block per repository",
            "Variables are allowed but ignored in the backend block",
            "The backend block is parsed by the provider, not by Terraform core",
          ],
          correctIndex: 0,
          explanation:
            "Terraform must know where state lives before it can read anything that could parameterise it. `terraform init -backend-config=env/prod.hcl` supplies the differences from outside the language.",
        },
        {
          id: "tf-environments-q7",
          prompt: "What does Terragrunt add on top of Terraform?",
          options: [
            "Generated backend and provider blocks per environment, explicit dependencies between stacks, and `run-all` to apply several stacks in order",
            "A replacement for HCL with a Python-like syntax",
            "Its own state format that does not need a backend",
            "A policy engine that blocks non-compliant plans",
          ],
          correctIndex: 0,
          explanation:
            "It is a wrapper, not a fork: it generates configuration and orchestrates `terraform` invocations. Policy enforcement is a separate concern handled by OPA, Sentinel or Checkov.",
        },
        {
          id: "tf-environments-q8",
          prompt: "What is the main cost of the directory-per-environment layout?",
          options: [
            "Duplicated root-module glue — the same module calls, backend boilerplate and variable wiring repeated per environment",
            "Environments cannot share modules",
            "Each environment needs its own provider version",
            "State cannot be stored remotely",
          ],
          correctIndex: 0,
          explanation:
            "Sharing modules is exactly how the layout works; what repeats is the thin root that calls them. Reducing that repetition is Terragrunt's entire pitch.",
        },
        {
          id: "tf-environments-q9",
          prompt: "Which situation genuinely suits CLI workspaces?",
          options: [
            "Short-lived, identical preview environments in one account, created and destroyed per branch",
            "Production and staging in separate cloud accounts with separate credentials",
            "A configuration where prod needs different resources, not just different sizes",
            "Any case where you want the environment name visible in code review",
          ],
          correctIndex: 0,
          explanation:
            "Workspaces are good when the environments really are the same shape in the same account. As soon as accounts, credentials or resource sets differ, the single shared backend and code path stop being an advantage.",
        },
        {
          id: "tf-environments-q10",
          prompt: "Which statements about the `default` workspace are true? (Select all that apply.)",
          options: [
            "It always exists and cannot be deleted",
            "Its state is stored at the backend's bare `key`, not under the workspace prefix",
            "`terraform.workspace` evaluates to `\"default\"` in it",
            "It is automatically selected whenever you run `terraform init`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The selected workspace persists locally in `.terraform/`, so `init` does not reset it — which is part of why the \"I thought I was in dev\" failure happens.",
        },
        {
          id: "tf-environments-q11",
          prompt: "CLI workspaces and HCP Terraform workspaces — what is the relationship?",
          options: [
            "They are different concepts that share a name: a CLI workspace is an extra state in one backend, while an HCP Terraform workspace is a managed unit with its own variables, credentials and run history",
            "They are the same thing; HCP Terraform simply hosts the CLI workspaces",
            "HCP Terraform workspaces are CLI workspaces with locking added",
            "CLI workspaces are deprecated in favour of HCP Terraform workspaces",
          ],
          correctIndex: 0,
          explanation:
            "An HCP Terraform workspace is much closer to the directory-per-environment idea: its own variables, its own credentials, its own runs. Reading documentation without knowing which one is meant is a reliable source of confusion.",
        },
      ],
    },
    {
      id: "tf-import-drift",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Importing Existing Infrastructure and Handling Drift",
      summary:
        "Importing binds an object that already exists to an address in your configuration. There are two mechanisms and the difference matters. The old `terraform import ADDRESS ID` command mutates state immediately and is not part of any plan: you write the configuration first, run the import, then plan repeatedly and edit until the diff is empty. The `import` block, added in 1.5, is config-driven and plannable — you declare `import { to = aws_s3_bucket.logs, id = \"acme-logs\" }`, the plan shows the import alongside every other change, and nothing is written until you apply. `terraform plan -generate-config-out=generated.tf` will even write a first draft of the resource block for you. Since 1.16 `import` blocks may also appear inside modules.\n\nThe work is not the import, it is closing the diff afterwards. Generated configuration contains every attribute the provider returned, including defaults and read-only fields, and needs pruning. The target is a plan with **no changes at all**: any remaining diff means your configuration disagrees with the live object, and the first apply after the import will alter production. Reviewing that first post-import plan line by line is the entire safety mechanism.\n\nDrift is the same problem arriving from the other direction: state says one thing, the provider reports another, because somebody changed it outside Terraform. A normal plan refreshes, sees the difference, and proposes changes that *undo* it. `terraform plan -refresh-only` presents the same difference as changes to *accept*, and applying a refresh-only plan updates state without touching any infrastructure. (`terraform refresh` still exists and is deprecated in favour of this.) A scheduled refresh-only plan in CI that opens a ticket when it finds drift is how a team learns about console changes before a release does.\n\nTwo tools that cut both ways. `lifecycle { ignore_changes = [...] }` is right when something else legitimately owns an attribute — an autoscaler's desired count, tags applied by a policy engine — and wrong as a way to silence a diff you do not understand, because it hides real drift permanently. And to stop managing a resource without destroying it, use a `removed` block with `destroy = false` (1.7+), which is reviewable and travels with the code, rather than `terraform state rm`, which happens on one machine and leaves no trace in the repository.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Terraform: Import resources overview", url: "https://developer.hashicorp.com/terraform/language/import", kind: "docs" },
        { label: "Terraform: import block reference", url: "https://developer.hashicorp.com/terraform/language/block/import", kind: "docs" },
        { label: "Terraform: Use refresh-only mode to sync state", url: "https://developer.hashicorp.com/terraform/tutorials/state/refresh", kind: "docs" },
        { label: "Terraform: removed block reference", url: "https://developer.hashicorp.com/terraform/language/block/removed", kind: "docs" },
      ],
      video: {
        title: "Importing Existing Resources Into Terraform",
        channel: "Bryan Krausen",
        url: "https://www.youtube.com/watch?v=Qzk1M2r9VM8",
        videoId: "Qzk1M2r9VM8",
        durationLabel: "15:23",
      },
      alternateVideos: [
        {
          title: "Terraform Config-driven Import | Safely and securely import multiple resources to Terraform at once",
          channel: "HashiCorp, an IBM Company",
          url: "https://www.youtube.com/watch?v=y8_5Ud29W8o",
          videoId: "y8_5Ud29W8o",
          durationLabel: "3:02",
        },
        {
          title: "30/30 - Drift Detection and Remediation Using Terraform and GitHub Actions | Real Time Project",
          channel: "Tech Tutorials with Piyush",
          url: "https://www.youtube.com/watch?v=nRgNIy-SDEw",
          videoId: "nRgNIy-SDEw",
          durationLabel: "55:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-import-drift-q1",
          prompt: "What is the practical difference between an `import` block and the `terraform import` CLI command?",
          options: [
            "The block is part of the plan, so the import is reviewable and nothing is written until apply; the command mutates state immediately",
            "The block works only for resources in the root module; the command works anywhere",
            "The command can import several resources at once; the block imports one",
            "They are the same thing with different syntax",
          ],
          correctIndex: 0,
          explanation:
            "Plannability is the whole point of the block, and it composes: several `import` blocks can be reviewed and applied together. Since 1.16 blocks can live inside modules as well.",
        },
        {
          id: "tf-import-drift-q2",
          prompt: "What does `terraform plan -generate-config-out=generated.tf` do?",
          options: [
            "Writes draft resource blocks for any address named by an `import` block that has no configuration yet",
            "Exports the whole state as HCL",
            "Rewrites the existing configuration to match the live infrastructure",
            "Generates a module wrapping the imported resources",
          ],
          correctIndex: 0,
          explanation:
            "It is a starting point, not a finished file: it includes defaults and read-only attributes that need pruning, and it never touches configuration you already wrote.",
        },
        {
          id: "tf-import-drift-q3",
          prompt:
            "You import an existing RDS instance and the resulting plan shows `~ update in-place` on four attributes. What does that mean and what should you do?",
          options: [
            "Your configuration disagrees with the live database on those attributes; fix the configuration until the plan is empty, because applying would change production",
            "It is normal after an import and can be applied safely",
            "The import failed and should be retried",
            "The provider is out of date and needs upgrading",
          ],
          correctIndex: 0,
          explanation:
            "An import binds the object; it does not make your configuration correct. A non-empty plan immediately after an import is the configuration proposing to reshape a live resource — the only safe target is no changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-import-drift-q4",
          prompt: "Someone changed a security group rule in the console. Which command accepts that change into state instead of reverting it?",
          options: [
            "`terraform apply -refresh-only`",
            "`terraform apply -target=aws_security_group.web`",
            "`terraform import aws_security_group.web sg-0abc`",
            "`terraform state rm aws_security_group.web` followed by a re-import",
          ],
          correctIndex: 0,
          explanation:
            "Refresh-only presents drift as changes to accept and writes them to state without touching infrastructure. A normal apply would do the opposite and put the rule back. Note this makes state agree with reality, not your configuration — that still needs updating in code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-import-drift-q5",
          prompt: "Which statements about drift are accurate? (Select all that apply.)",
          options: [
            "A normal `terraform plan` detects it, because plan refreshes each managed object against the provider first",
            "A scheduled refresh-only plan in CI is a practical way to find it before a release does",
            "`-refresh=false` hides it, which is why the flag is a speed/accuracy tradeoff rather than a free optimisation",
            "Drift only affects attributes Terraform explicitly set; provider-side defaults are never reported",
            "Adding `ignore_changes` removes the drift from the infrastructure",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`ignore_changes` hides a difference from the plan — the infrastructure is unchanged. And drift can absolutely appear in attributes the provider computes, which is one reason `ignore_changes` on noisy computed fields is sometimes legitimate.",
        },
        {
          id: "tf-import-drift-q6",
          prompt:
            "An ECS service's `desired_count` is managed by application autoscaling, so every plan proposes to reset it. What is the correct fix?",
          options: [
            "`lifecycle { ignore_changes = [desired_count] }` on the service, so Terraform sets it once and then leaves it to the autoscaler",
            "Remove the service from state so Terraform stops tracking it",
            "Run every plan with `-refresh=false`",
            "Set `desired_count` to `null` so Terraform ignores it",
          ],
          correctIndex: 0,
          explanation:
            "This is the case `ignore_changes` exists for: another system legitimately owns the attribute. `-refresh=false` would hide every other kind of drift too, and `null` is not an opt-out.",
        },
        {
          id: "tf-import-drift-q7",
          prompt: "You want Terraform to stop managing a bucket without deleting it, in a way a reviewer can see. What do you write?",
          options: [
            "A `removed` block naming the address with `lifecycle { destroy = false }`, alongside deleting the resource block",
            "Just delete the resource block — Terraform leaves unmanaged resources alone",
            "`lifecycle { prevent_destroy = true }` on the resource, then delete the block",
            "An `import` block with `destroy = false`",
          ],
          correctIndex: 0,
          explanation:
            "Deleting the block alone is a request to destroy. `prevent_destroy` makes the plan *fail* rather than forget, which blocks you instead of helping. `terraform state rm` achieves the same result but only on the machine where it is run.",
        },
        {
          id: "tf-import-drift-q8",
          prompt:
            "You run an `import` block against an address that already has a binding in state. What happens?",
          options: [
            "Terraform reports an error rather than silently rebinding, because one address can hold only one object",
            "The new object replaces the old binding and the old object becomes an orphan",
            "Terraform creates an indexed second instance at that address",
            "Terraform destroys the currently bound object and imports the new one",
          ],
          correctIndex: 0,
          explanation:
            "The one-object-per-address rule is enforced here. To rebind you must `state rm` the existing entry first, and knowing what becomes of the released object is your problem, not Terraform's.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-import-drift-q9",
          prompt: "What form does the `id` in an `import` block take?",
          options: [
            "Whatever import id that resource type documents — often the cloud id, but sometimes a composite such as `bucket/key` or `vpc-123/sg-456`",
            "Always the resource's ARN",
            "Always the value of the resource's `name` argument",
            "A UUID that Terraform generates when the resource is first seen",
          ],
          correctIndex: 0,
          explanation:
            "Import ids are defined per resource type by the provider, and composite ids for sub-resources such as rules and attachments are extremely common. The provider's documentation page for the resource is the only reliable source.",
        },
        {
          id: "tf-import-drift-q10",
          prompt:
            "You inherit an account with 300 hand-created resources and are asked to bring it under Terraform. What ordering makes the first weeks survivable?",
          options: [
            "Import the stable foundations first — networking, IAM, DNS — closing each plan to zero changes before moving on, leaving volatile workloads until last",
            "Import everything in one apply so state is complete as early as possible",
            "Recreate everything with Terraform and delete the originals",
            "Import only the resources that already match a module's shape and ignore the rest",
          ],
          correctIndex: 0,
          explanation:
            "Imports are cheap; closing the diff is not. Working outward from stable, low-churn resources means each batch can reach an empty plan before the next one starts, and no batch leaves a half-matched production workload behind.",
        },
        {
          id: "tf-import-drift-q11",
          prompt: "What is the status of the `terraform refresh` command?",
          options: [
            "Deprecated — use `-refresh-only` with `terraform plan` and `terraform apply` instead, which lets you review the state update before writing it",
            "Current and recommended for drift detection",
            "Removed in Terraform 1.0",
            "An alias for `terraform plan -refresh=false`",
          ],
          correctIndex: 0,
          explanation:
            "The old command wrote state immediately with no review step. Refresh-only mode makes the same operation plannable — you see what will be recorded before it is recorded.",
        },
        {
          id: "tf-import-drift-q12",
          prompt:
            "A drift-detection job runs `terraform plan -detailed-exitcode` nightly on production and now exits 2 every night. What should the team conclude first?",
          options: [
            "Something — code merged but not applied, or a change made outside Terraform — has put configuration, state and reality out of step, and the plan needs reading before anything is applied",
            "The job is misconfigured, because exit code 2 means a failure",
            "Someone must run `terraform apply -auto-approve` to bring production back in line",
            "The state file is corrupt",
          ],
          correctIndex: 0,
          explanation:
            "Exit 2 means \"there are changes\", which is a success code. A persistent non-empty plan on production is a signal to investigate, not to auto-apply — auto-applying it would reverse whatever the out-of-band change was.",
        },
      ],
    },
    {
      id: "tf-secrets",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Secrets, and Why State Holds Them in Plaintext",
      summary:
        "State contains every attribute the provider returned for every managed resource, in plaintext JSON. That includes an RDS master password, a generated TLS private key, an IAM access key secret and anything else a resource happens to expose. This is not an oversight waiting for a flag — it follows from how planning works. To decide whether an attribute changed, Terraform has to know what it was, so it has to have stored it.\n\nThe consequences run in order of usefulness. First, the state file *is* a secret: a private bucket, encryption at rest, tight read permissions, and never in Git. \"Who can read the state bucket\" is the same question as \"who knows the production database password\". Second, prefer designs where the secret never enters Terraform's value graph — reference a Secrets Manager secret by ARN and let the consuming service resolve it at runtime. A `data` source that reads a secret *value* puts it in state like anything else.\n\nThird, `sensitive = true` is real but narrow. It stops Terraform printing a value in plan output, apply output and error messages, and it propagates: anything derived from a sensitive value is also sensitive, which is why a sensitive string cannot be used as a `for_each` key — keys appear in resource addresses. It does nothing to state. `nonsensitive()` removes the marking and is a loaded gun; `terraform output -json` prints sensitive outputs in full.\n\nFourth, and newest, Terraform has an actual answer for the narrow case of a value that must reach a provider but must not be persisted. **Ephemeral** values and resources (1.10) are evaluated fresh in each phase and never written to plan or state, and **write-only arguments** (1.11) are resource arguments that accept an ephemeral value and are not stored. Between them a password can be fetched at apply time and set on a database without ever landing in state — provided the provider implements the write-only variant of the argument, which not all do. One divergence worth knowing: OpenTofu shipped client-side state encryption; Terraform relies on the backend encrypting at rest.\n\nThe operational gotcha: if a secret has ever been written to state, it is in the state history — every version in the versioned bucket, every CI artefact, every laptop that ran a plan. Deleting the current state object does not help. Rotate the secret.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Terraform: Manage sensitive data", url: "https://developer.hashicorp.com/terraform/language/manage-sensitive-data", kind: "docs" },
        { label: "Terraform: Ephemeral values in resources", url: "https://developer.hashicorp.com/terraform/language/manage-sensitive-data/ephemeral", kind: "docs" },
        { label: "Terraform: variable block reference", url: "https://developer.hashicorp.com/terraform/language/block/variable", kind: "docs" },
      ],
      video: {
        title: "How to Manage Secrets in Terraform?",
        channel: "Anton Putra",
        url: "https://www.youtube.com/watch?v=3N0tGKwvBdA",
        videoId: "3N0tGKwvBdA",
        durationLabel: "15:53",
      },
      alternateVideos: [
        {
          title: "No More Secrets in State! Write-Only Args in Terraform 1.11 | Terraform Tuesday",
          channel: "Ned in the Cloud",
          url: "https://www.youtube.com/watch?v=x92u3nn3eLA",
          videoId: "x92u3nn3eLA",
          durationLabel: "13:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-secrets-q1",
          prompt: "Why does Terraform store resource attribute values — including secrets — in state at all?",
          options: [
            "Planning is a diff: to decide whether an attribute changed, Terraform must know its previous value",
            "The provider requires the previous values to authenticate",
            "It is a legacy of Terraform 0.11 and is being removed",
            "State caches them only when `sensitive` is not set",
          ],
          correctIndex: 0,
          explanation:
            "It falls straight out of the plan model, which is why no flag disables it. The ephemeral and write-only features work by keeping certain values out of the diff entirely, not by encrypting what is in it.",
        },
        {
          id: "tf-secrets-q2",
          prompt:
            "A variable holding a database password is marked `sensitive = true`. Where does the password appear afterwards? (Select all that apply.)",
          options: [
            "In the state file, in plaintext",
            "In the saved plan file, if the value is used by a resource argument",
            "In the plan output printed to the terminal",
            "In `terraform output -json`, if it is also exposed as an output",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "`sensitive` suppresses the terminal rendering and nothing else. State and the plan file both hold the real value, and the JSON output format deliberately does not redact.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-secrets-q3",
          prompt: "What do ephemeral values and write-only arguments actually achieve?",
          options: [
            "A value can be fetched at apply time and passed to a provider without ever being written to the plan file or to state",
            "They encrypt the value inside the state file",
            "They delete the value from state after the apply completes",
            "They move the value into a separate secrets state file",
          ],
          correctIndex: 0,
          explanation:
            "Ephemeral values (1.10) are re-evaluated in each phase and never persisted; write-only arguments (1.11) accept them on resources. The catch is provider support — the resource must offer a write-only variant of the argument.",
        },
        {
          id: "tf-secrets-q4",
          prompt:
            "A configuration reads a secret with `data \"aws_secretsmanager_secret_version\"` and passes `.secret_string` into an RDS instance's password. Is the secret now protected?",
          options: [
            "No — the data source's result is stored in state like any other attribute, so the secret is in the state file",
            "Yes — data sources are not persisted to state",
            "Yes, as long as the data source is marked `sensitive`",
            "Only if the state backend has encryption at rest enabled",
          ],
          correctIndex: 0,
          explanation:
            "Reading a secret into Terraform puts it in Terraform's value graph, and everything in that graph lands in state. Backend encryption protects the file from someone reading the bucket's storage, not from everyone with `s3:GetObject`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-secrets-q5",
          prompt:
            "A sensitive variable is used to build a map, and that map is passed to `for_each`. Terraform errors. Why?",
          options: [
            "Sensitivity propagates through expressions, and `for_each` keys appear in resource addresses and plan output, so a sensitive key is rejected",
            "`for_each` does not accept maps built from variables",
            "Sensitive values cannot be used in any expression",
            "The map's size is unknown at plan time",
          ],
          correctIndex: 0,
          explanation:
            "The address of every instance would leak the value. The usual fix is to key on something non-sensitive — a name or an id — and look the secret up inside the resource body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-secrets-q6",
          prompt: "Which of these are genuine controls for secrets in a Terraform codebase? (Select all that apply.)",
          options: [
            "Treating the state file as a secret: private backend, encryption at rest, and read permissions limited to the people and roles that need them",
            "Referencing a managed secret by ARN and letting the running service resolve it, so the value never enters Terraform",
            "Using ephemeral values with write-only arguments where the provider supports them",
            "Marking every variable `sensitive = true`, which keeps the values out of state",
            "Committing state to a private repository, since private repositories are access-controlled",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`sensitive` is display-only, and a private repository still means the secret is in Git history forever, readable by everyone with repository access and by every clone.",
        },
        {
          id: "tf-secrets-q7",
          prompt: "What does `random_password` give you, and what does it cost?",
          options: [
            "A generated password that is stable across applies because it is stored in state — which means the password is in state",
            "A password generated fresh on every apply, so nothing is persisted",
            "A password stored in the cloud provider's secret manager automatically",
            "A password that Terraform can verify but never read",
          ],
          correctIndex: 0,
          explanation:
            "Stability is the feature and the price is storage — the value has to persist somewhere or every plan would want to change it. It is a reasonable pattern when state is well protected, and a poor one when it is not.",
        },
        {
          id: "tf-secrets-q8",
          prompt:
            "A secret was accidentally committed into a Terraform state file six months ago. The state object has since been overwritten many times. What must be done?",
          options: [
            "Rotate the secret — it exists in every retained state version, in CI artefacts and in local copies, and deleting the current object changes none of that",
            "Delete the current state object and re-import the resources",
            "Run `terraform state rm` on the resource that held it",
            "Enable encryption at rest on the bucket so the old versions become unreadable",
          ],
          correctIndex: 0,
          explanation:
            "Bucket versioning — the thing that saves you in a recovery — also means old state versions persist. Enabling encryption now does nothing retroactively for anyone who already had read access.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-secrets-q9",
          prompt: "What does `nonsensitive()` do, and when is it defensible?",
          options: [
            "It strips the sensitive marking from a value, and it is defensible only when you can show the specific value is not actually secret — for example a non-secret field extracted from a sensitive object",
            "It decrypts a value that was encrypted in state",
            "It permanently marks the variable as non-sensitive for the rest of the configuration",
            "It is deprecated and has no effect",
          ],
          correctIndex: 0,
          explanation:
            "Sensitivity propagates aggressively, so extracting one harmless field from a sensitive object legitimately needs it. Reaching for it to silence an error about a `for_each` key is how a secret ends up in plan output.",
        },
        {
          id: "tf-secrets-q10",
          prompt: "How do Terraform and OpenTofu differ on protecting state contents?",
          options: [
            "OpenTofu added client-side state encryption; Terraform relies on the backend's encryption at rest",
            "Terraform encrypts state by default since 1.10; OpenTofu does not",
            "Neither has any mechanism; both rely entirely on backend permissions",
            "Both encrypt state client-side using the same key format",
          ],
          correctIndex: 0,
          explanation:
            "This is one of the concrete places the two projects have diverged, and it is worth knowing if state-at-rest requirements are being driven by a compliance regime rather than by preference.",
        },
        {
          id: "tf-secrets-q11",
          prompt:
            "A pipeline passes secrets with `TF_VAR_db_password`. What is the risk specific to that mechanism?",
          options: [
            "Environment variables are visible to child processes and are easy to leak into logs through debug output or a `set -x`",
            "`TF_VAR_` variables are written to `.terraform/` on disk",
            "`TF_VAR_` variables override `-var` on the command line, so they cannot be scoped per run",
            "Terraform prints every `TF_VAR_` value at the start of a run",
          ],
          correctIndex: 0,
          explanation:
            "It is a reasonable mechanism handled carefully, but the failure modes are mundane and common. `TF_VAR_` is in fact near the bottom of the precedence order, below `-var` and every tfvars file.",
        },
      ],
    },
    {
      id: "tf-testing-policy",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Testing and Policy as Code",
      summary:
        "There is a ladder here, and most teams stop two rungs too early. `terraform fmt -check` settles formatting arguments for free. `terraform validate` checks syntax and internal consistency — that references resolve, that types line up, that required arguments are present. It needs no credentials and no state, which makes it the cheapest CI gate there is, and it also means it cannot possibly know that your instance type does not exist or that AWS will reject your IAM policy.\n\nThat gap is what linters and scanners fill. **tflint** understands the providers: deprecated syntax, invalid instance types and AMI formats, unused declarations, naming conventions. **Checkov**, **tfsec** and **Trivy** scan for security and compliance problems — public buckets, unencrypted volumes, security groups open to `0.0.0.0/0` — and can read either the configuration or the JSON plan.\n\nAbove that sits `terraform test`, generally available since 1.6. Tests live in `.tftest.hcl` files as a series of `run` blocks; each one plans or applies the configuration under test and asserts on the resulting plan and state. `command = plan` is the fast tier; `command = apply` creates real infrastructure and destroys it afterwards, which costs real money and real minutes. Since 1.7, `mock_provider`, `override_resource`, `override_data` and `override_module` let a test run without a cloud account at all, which is what makes unit-testing a module practical.\n\nThe top rung is policy as code — Rego evaluated by OPA, or Sentinel on HCP Terraform — and it is qualitatively different from everything below it, because it evaluates the **plan**, not the configuration. Only the plan knows what will actually change, so only a plan-based policy can express \"no apply may delete an RDS instance\", \"no resource may be created without a cost-centre tag\", or \"changes to the production account require two approvals\". A configuration scanner cannot see a deletion; there is nothing in the configuration to look at.\n\nThe gotcha worth internalising when you inherit a pipeline: a green `terraform validate` proves almost nothing about whether an apply will succeed or be safe. Teams that treat it as \"tests passed\" have a gate that fails only on typos.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Terraform: Tests", url: "https://developer.hashicorp.com/terraform/language/tests", kind: "docs" },
        { label: "Terraform: terraform validate command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/validate", kind: "docs" },
        { label: "terraform-linters/tflint", url: "https://github.com/terraform-linters/tflint", kind: "repo" },
        { label: "Open Policy Agent: Terraform", url: "https://www.openpolicyagent.org/docs/terraform", kind: "docs" },
      ],
      video: {
        title: "Complete Terraform Course - From BEGINNER to PRO! (Learn Infrastructure as Code)",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=7xngnjfIlK4",
        videoId: "7xngnjfIlK4",
        startSeconds: 6965,
        chapterLabel: "Part 8: Testing Terraform Code",
        durationLabel: "2:38:04",
      },
      alternateVideos: [
        {
          title: "Using the Terraform Test Framework",
          channel: "Ned in the Cloud",
          url: "https://www.youtube.com/watch?v=4U2S6sXcuac",
          videoId: "4U2S6sXcuac",
          durationLabel: "28:04",
        },
        {
          title: "How to Use Open Policy Agent with Terraform for Better Infrastructure Management",
          channel: "Ned in the Cloud",
          url: "https://www.youtube.com/watch?v=FDghIoMS9nU",
          videoId: "FDghIoMS9nU",
          durationLabel: "14:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-testing-policy-q1",
          prompt: "What does `terraform validate` actually check?",
          options: [
            "Syntax and internal consistency — that references resolve, types line up and required arguments are present — without contacting any provider",
            "That the configuration will apply successfully against the target cloud account",
            "That the configuration complies with your organisation's security policies",
            "That state matches the live infrastructure",
          ],
          correctIndex: 0,
          explanation:
            "It needs neither credentials nor state, which is what makes it cheap and what limits it. It cannot tell you that `t9.enormous` is not a real instance type, because it never asks AWS.",
        },
        {
          id: "tf-testing-policy-q2",
          prompt: "Which of these can `terraform validate` catch? (Select all that apply.)",
          options: [
            "A reference to a resource attribute that does not exist in the provider's schema",
            "A required argument that has been left out",
            "A type mismatch between a variable's declared type and the value it is given",
            "An IAM policy document that AWS will reject as malformed",
            "A security group that allows ingress from `0.0.0.0/0`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Validate works from the provider schema, so it knows what attributes and arguments exist. It has no opinion about the *content* of a policy document or the risk of a rule — that is a scanner's job.",
        },
        {
          id: "tf-testing-policy-q3",
          prompt: "What does tflint add over `terraform validate`?",
          options: [
            "Provider-aware rules — invalid instance types, deprecated syntax, unused declarations, naming conventions — from plugins that know the cloud's own constraints",
            "It applies the configuration to a sandbox account to see whether it works",
            "It rewrites the configuration to follow best practice",
            "It checks state against live infrastructure",
          ],
          correctIndex: 0,
          explanation:
            "tflint's provider plugins encode knowledge the core validator does not have. It is static analysis, so it still never calls the API or looks at state.",
        },
        {
          id: "tf-testing-policy-q4",
          prompt: "Where do Terraform's native tests live, and what is in them?",
          options: [
            "`.tftest.hcl` files containing `run` blocks that plan or apply the configuration and assert on the result",
            "`_test.tf` files containing `test` resources",
            "Go test files using the `terratest` library",
            "A `tests` block inside the main configuration",
          ],
          correctIndex: 0,
          explanation:
            "`terraform test` went generally available in 1.6 with this file format. Terratest is a real and widely used alternative, but it is a third-party Go library, not the native framework.",
        },
        {
          id: "tf-testing-policy-q5",
          prompt:
            "A `run` block with `command = apply` in a test suite is added to a pull-request pipeline. What is the consequence?",
          options: [
            "Every PR creates real infrastructure and destroys it afterwards — real cost, real minutes, and real credentials in the PR pipeline",
            "Nothing, because test runs are always executed against mocks",
            "The test is skipped unless a `-real` flag is passed",
            "Terraform creates the resources but never destroys them",
          ],
          correctIndex: 0,
          explanation:
            "`command = apply` means apply. Terraform does tear down what a test created, but the cost, the runtime and — most importantly — the need for write credentials in a pipeline triggered by outside contributors are all real.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-testing-policy-q6",
          prompt: "What do `mock_provider` and the `override_*` blocks make possible?",
          options: [
            "Running tests without a real cloud account, by returning fake values for resources, data sources or whole modules",
            "Replacing the provider binary with a newer version at test time",
            "Skipping the plan phase so tests run faster",
            "Testing against a recorded snapshot of a previous apply",
          ],
          correctIndex: 0,
          explanation:
            "Introduced in 1.7, they are what turns `terraform test` into something you can run on every commit. Without them, testing a module meant credentials and cloud resources.",
        },
        {
          id: "tf-testing-policy-q7",
          prompt:
            "Which of these rules can only be enforced against a plan, not against the configuration? (Select all that apply.)",
          options: [
            "\"No apply may destroy an `aws_db_instance`\"",
            "\"No apply may replace a resource tagged `protected = true`\"",
            "\"Every resource must carry a `cost_centre` tag\"",
            "\"No `aws_s3_bucket` may set `acl = \\\"public-read\\\"`\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Destruction and replacement are actions, and actions exist only in a plan. Required tags and forbidden argument values are properties of the configuration and can be caught by a static scanner before a plan is ever produced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-testing-policy-q8",
          prompt: "How does an OPA policy normally consume a Terraform plan?",
          options: [
            "`terraform show -json tfplan` is fed to OPA, which evaluates Rego rules against `resource_changes` and friends",
            "OPA parses the `.tf` files directly using its own HCL parser",
            "OPA runs as a Terraform provider and evaluates rules during apply",
            "OPA reads the state file after the apply and reports violations",
          ],
          correctIndex: 0,
          explanation:
            "The JSON plan format is the documented interface, which is why it is worth knowing. Evaluating after apply would be an audit, not a gate.",
        },
        {
          id: "tf-testing-policy-q9",
          prompt: "What is the relationship between Sentinel and OPA in this space?",
          options: [
            "Both are policy-as-code engines evaluated against plans; Sentinel is HashiCorp's, tied to the paid HCP Terraform and Enterprise tiers, while OPA is an open CNCF project you run yourself",
            "Sentinel is the open-source engine and OPA is the commercial one",
            "Sentinel replaced OPA as the recommended engine for open-source Terraform",
            "They are the same engine under two names",
          ],
          correctIndex: 0,
          explanation:
            "Which one a team can use is usually decided by whether they are on HCP Terraform. OPA plus `terraform show -json` works on any pipeline, including plain GitHub Actions.",
        },
        {
          id: "tf-testing-policy-q10",
          prompt: "You inherit a pipeline whose only Terraform gate is `terraform validate`. What is the honest assessment?",
          options: [
            "It catches typos and little else — it cannot see security problems, invalid cloud-specific values, or that the plan destroys production",
            "It is sufficient for most teams, since it checks the provider schema",
            "It is redundant, because `terraform plan` performs the same validation",
            "It is dangerous and should be removed",
          ],
          correctIndex: 0,
          explanation:
            "Validate is worth keeping — it fails fast and costs nothing — but calling it \"tests\" is where the harm lies, because it suggests a level of assurance nobody has.",
        },
        {
          id: "tf-testing-policy-q11",
          prompt: "What does `terraform fmt -check` do in CI, and what does `-diff` add?",
          options: [
            "`-check` exits non-zero if any file is not canonically formatted without changing anything; `-diff` also prints what would change",
            "`-check` reformats the files and fails only if the result is invalid",
            "`-check` validates the configuration as well as formatting it",
            "`-check` only inspects files changed in the current commit",
          ],
          correctIndex: 0,
          explanation:
            "It is the cheapest possible gate and it removes an entire category of review comment. It checks every file it is pointed at, recursively with `-recursive`.",
        },
        {
          id: "tf-testing-policy-q12",
          prompt:
            "Checkov flags 40 findings on an inherited configuration, most of them on resources the team deliberately configured that way. What is the sustainable response?",
          options: [
            "Triage once, suppress the accepted ones inline with a documented reason, and fail the build on anything new — a permanently noisy gate is an ignored gate",
            "Lower the severity threshold until the build passes",
            "Remove Checkov and rely on code review",
            "Fix all 40 before merging anything else",
          ],
          correctIndex: 0,
          explanation:
            "Checkov supports inline skip comments with a justification, which keeps the decision next to the code and reviewable. A threshold change hides new findings too, and a blocked repository just gets the gate deleted.",
        },
      ],
    },
    {
      id: "tf-cicd",
      moduleId: "devops-terraform",
      trackId: "devops",
      title: "Terraform in CI/CD: Plan on PR, Apply on Merge",
      summary:
        "The shape that works is small and specific. On a pull request: `terraform fmt -check`, `terraform init`, `terraform validate`, then `terraform plan -out=tfplan -detailed-exitcode`. Post the rendered plan as a PR comment so the review is about the change to infrastructure rather than the change to HCL. Keep `tfplan` as a build artefact. On merge: `terraform apply tfplan` — *that* file, not a fresh plan. An approval that refers to a plan nobody saved is an approval of a guess, and the two most common Terraform pipeline bugs are both versions of that: `apply -auto-approve` straight from a push, and a merge job that re-plans and applies whatever it finds.\n\nCredentials are the other half. Long-lived cloud access keys in repository secrets are the default in inherited pipelines and the first thing to remove: OIDC federation from the CI provider to a cloud role gives short-lived credentials with no secret to leak. Splitting them further — a read-only role for plan, a write role for apply, with the write role only assumable from the protected branch — means a pull request from a fork cannot do anything interesting even if someone smuggles a `local-exec` into it.\n\nConcurrency needs a decision. The state lock will prevent corruption, but a pipeline that discovers this by timing out on a lock gives a confusing failure; a pipeline-level queue (a GitHub Actions `concurrency` group keyed on the environment, or simply a non-parallel job) fails clearly instead. And plans go stale: main can move between the plan and the merge. Either re-plan on merge and require it to match, accept that applying a saved plan fails loudly when state has moved, or adopt an Atlantis-style flow where the apply happens on the PR before the merge, so the plan and the apply see the same world.\n\nTwo details that catch people reading someone else's pipeline. `terraform init -reconfigure` in a CI script is a red flag — it abandons existing state rather than migrating it. And plan output posted to a PR can contain values from your configuration, so a public repository plus a chatty plan is a disclosure channel; posting the JSON plan's action summary rather than the full rendered text is the usual mitigation.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Terraform: Running Terraform in automation", url: "https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform", kind: "docs" },
        { label: "Terraform: terraform plan command reference", url: "https://developer.hashicorp.com/terraform/cli/commands/plan", kind: "docs" },
        { label: "hashicorp/setup-terraform (GitHub Action)", url: "https://github.com/hashicorp/setup-terraform", kind: "repo" },
        { label: "Atlantis: Terraform pull request automation", url: "https://www.runatlantis.io/", kind: "article" },
      ],
      video: {
        title: "Complete Terraform Course - From BEGINNER to PRO! (Learn Infrastructure as Code)",
        channel: "DevOps Directive",
        url: "https://www.youtube.com/watch?v=7xngnjfIlK4",
        videoId: "7xngnjfIlK4",
        startSeconds: 7984,
        chapterLabel: "Part 9: Developer Workflows and Automation",
        durationLabel: "2:38:04",
      },
      alternateVideos: [
        {
          title: "27/30 - Automate AWS Infra Using Terraform and GitHub Actions | Realtime Project",
          channel: "Tech Tutorials with Piyush",
          url: "https://www.youtube.com/watch?v=cRnmyzT9gtU",
          videoId: "cRnmyzT9gtU",
          durationLabel: "48:43",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tf-cicd-q1",
          prompt: "Why must the merge job apply the saved `tfplan` rather than running `terraform apply` afresh?",
          options: [
            "Only the saved plan guarantees that what is applied is what was reviewed and approved",
            "A fresh apply would not take a state lock",
            "A fresh apply cannot read remote state",
            "Applying a saved plan is significantly faster",
          ],
          correctIndex: 0,
          explanation:
            "A bare apply computes a new plan against whatever the world looks like at that moment and applies it without showing you. The saved plan is the artefact the approval refers to.",
        },
        {
          id: "tf-cicd-q2",
          prompt:
            "A PR pipeline runs `terraform plan -detailed-exitcode` and the job is marked failed. The plan output looks correct. What is wrong?",
          options: [
            "Exit code 2 means \"changes present\", which is a success — the script is treating any non-zero exit as a failure",
            "`-detailed-exitcode` is not supported in non-interactive mode",
            "The plan failed to acquire a lock and returned 2",
            "`-detailed-exitcode` requires `-out` and is erroring without it",
          ],
          correctIndex: 0,
          explanation:
            "0 is no changes, 1 is an error, 2 is changes. A naive `set -e` turns a perfectly good plan into a red build, which is why this flag is almost always paired with explicit exit-code handling.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-cicd-q3",
          prompt: "Which of these are real improvements to an inherited pipeline that uses long-lived AWS access keys? (Select all that apply.)",
          options: [
            "OIDC federation from the CI provider to a cloud role, so credentials are short-lived and there is no stored secret",
            "A read-only role for plan and a separate write role for apply",
            "Restricting the write role so it can only be assumed from the protected branch's workflow",
            "Rotating the access keys on a monthly schedule and storing the new ones in repository secrets",
            "Base64-encoding the keys before storing them in repository secrets",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rotation reduces the window but the secret still exists and is still exfiltratable; encoding is not encryption. Federation removes the secret entirely, and role splitting removes the reason to want it.",
        },
        {
          id: "tf-cicd-q4",
          prompt:
            "Two pull requests touching the same stack are merged within a minute of each other. What happens, and what would have been better?",
          options: [
            "The second apply blocks or fails on the state lock; a pipeline-level concurrency group keyed on the environment would queue it with a clear message instead",
            "Both applies proceed and the state is corrupted, because locks apply only to plans",
            "Terraform merges the two plans automatically",
            "The second apply silently overwrites the first's changes",
          ],
          correctIndex: 0,
          explanation:
            "The lock does protect state — that is its job — but a lock timeout is a poor user experience and can leave a half-finished job. Queueing at the pipeline level makes the serialisation explicit.",
        },
        {
          id: "tf-cicd-q5",
          prompt:
            "A saved plan is approved on Monday. On Wednesday, after another stack's apply changed shared state, the merge job runs `terraform apply tfplan`. What happens?",
          options: [
            "Terraform refuses the stale plan, because the state has moved since it was created",
            "The plan is applied as recorded, overwriting the other stack's changes",
            "Terraform silently re-plans and applies the new result",
            "The apply succeeds but writes a state file with the Monday serial",
          ],
          correctIndex: 0,
          explanation:
            "This is the mechanism working as intended: a loud failure rather than a silent difference. The remedy is to re-plan, re-review and merge, which is why long-lived approved plans are a smell.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-cicd-q6",
          prompt: "What is Atlantis's core proposition?",
          options: [
            "Plan and apply both happen on the pull request — you comment `atlantis apply` and merge after the apply — so the plan and the apply see the same state",
            "It replaces Terraform's own plan engine with a faster one",
            "It stores state in its own database instead of a backend",
            "It is a policy engine that blocks non-compliant plans",
          ],
          correctIndex: 0,
          explanation:
            "Applying before merge inverts the usual order and removes the staleness window between approval and apply. The tradeoff is that main can briefly describe something that is not yet merged.",
        },
        {
          id: "tf-cicd-q7",
          prompt: "You find `terraform init -reconfigure` in a CI script for a live stack. Why is that a red flag?",
          options: [
            "`-reconfigure` discards the existing backend association rather than migrating state, so a misconfigured run can start from an empty state and plan to create everything",
            "`-reconfigure` re-downloads all providers on every run, making the pipeline slow",
            "`-reconfigure` is deprecated in favour of `-migrate-state`",
            "`-reconfigure` disables state locking for that run",
          ],
          correctIndex: 0,
          explanation:
            "It has legitimate uses — switching between backend configurations where you know state is already where it should be — but in a pipeline it is usually there because someone hit a prompt and picked the flag that made it go away.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-cicd-q8",
          prompt: "What is the safest way to post a plan summary to a pull request in a public repository?",
          options: [
            "Post a summary derived from `terraform show -json`, listing addresses and actions rather than the full rendered diff of attribute values",
            "Post the full plan output — `sensitive` already redacts anything secret",
            "Post the saved `tfplan` file as an attachment so reviewers can inspect it locally",
            "Post nothing, and require reviewers to run the plan themselves",
          ],
          correctIndex: 0,
          explanation:
            "`sensitive` only covers what has been marked, and plenty of non-secret values are still information you would rather not publish. Attaching the plan file is worse — it contains the real values, redaction or not.",
        },
        {
          id: "tf-cicd-q9",
          prompt: "In what order should a pull-request job run its checks, and why?",
          options: [
            "`fmt -check`, then `init`, then `validate`, then `plan` — cheapest and most local first, so obvious problems fail in seconds without cloud credentials",
            "`plan` first, since it catches everything the others do",
            "`init`, then `plan`, then `validate` on the resulting plan file",
            "`validate` first, since it does not need `init`",
          ],
          correctIndex: 0,
          explanation:
            "`terraform validate` requires an initialised working directory because it needs the provider schemas, so it has to come after `init`. `fmt` needs nothing and should be first.",
        },
        {
          id: "tf-cicd-q10",
          prompt: "Which claims about running Terraform in automation are true? (Select all that apply.)",
          options: [
            "`-input=false` should be set so a missing variable fails rather than hanging on a prompt",
            "`TF_IN_AUTOMATION` suppresses suggestions in the output that assume an interactive user",
            "The plan and apply steps need the same working directory contents, so `.terraform/` and the plan file must be carried between jobs or `init` re-run",
            "A saved plan file can be applied without running `terraform init` first",
            "`-auto-approve` is required when applying a saved plan file",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Applying a saved plan still needs an initialised directory with the provider plugins. It also does not prompt, so `-auto-approve` is neither required nor meaningful there.",
        },
        {
          id: "tf-cicd-q11",
          prompt:
            "A contributor opens a pull request from a fork that adds a `local-exec` provisioner running `curl` against an attacker-controlled host. What in the pipeline design decides whether this matters?",
          options: [
            "Whether the PR job holds write credentials and whether it applies — a read-only plan job on a fork with no secrets exposed makes it uninteresting",
            "Whether `terraform validate` runs before the plan",
            "Whether the provisioner is marked `when = destroy`",
            "Whether the repository has branch protection enabled",
          ],
          correctIndex: 0,
          explanation:
            "Provisioners and even plan-time data sources execute code and make calls, so a PR pipeline is an execution environment for untrusted input. Secrets scoped away from fork PRs and a plan-only role are the controls; branch protection governs merging, not what the PR job can do.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tf-cicd-q12",
          prompt:
            "Your team wants an audit trail answering \"who changed production infrastructure, when, and what did they change\". What produces it?",
          options: [
            "The merge commit and its approved plan artefact, tied to the apply job's logs and to the cloud provider's own audit log",
            "The state file's `serial`, which increments once per change",
            "`terraform show` run after the fact against current state",
            "The `.terraform.lock.hcl` history in Git",
          ],
          correctIndex: 0,
          explanation:
            "The plan artefact is what makes the trail meaningful: it records the intended change, the review, and the identity that approved it. A serial counts writes without saying what they were, and current state cannot tell you what it used to be.",
        },
      ],
    },
  ],
} satisfies Module;
