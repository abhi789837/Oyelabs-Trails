# Oyelearn v4 — research

Full findings, every claim linked:

- `RESEARCH_SANDBOX_AI.md` — code sandbox (Piston vs Judge0, tested locally) and Anthropic cost
  controls (prices, model ids, caching, Message Batches, structured output, SDK surface).
- `RESEARCH_PM_BD.md` + `sources-pm-bd.json` — verified reading links and oEmbed-checked videos for
  the Project Management and Business Development curricula (Phase 7).

## Decisions taken from the research

1. **Sandbox: Piston**, self-hosted, one container on an internal Docker network, no published port.
   Judge0's last release (v1.13.1, 2024-04) needs Postgres + Redis and cgroup **v1**, which would mean
   changing kernel boot flags on a VPS shared with other apps. Piston needs `privileged: true` and
   cgroup v2. Tested here on Docker 29.6.2 / cgroup v2: python 3.12, php 8.2, java 15, dart 3.0,
   sqlite3 3.36, typescript 5.0, node 20 all run; network blocked; infinite loop killed at the run
   timeout; 256 MB memory cap enforced; fork bomb contained. Output cap raised to 64 KB.
   **Accepted risk:** a privileged container; a Piston escape is a host escape. Mitigations: internal
   network only, only our server can call it, pinned image digest, resource limits.
2. **Models (verified from the pricing page, 2026-10-02):** Haiku 4.5 $1/$5, Sonnet 5.5 $2/$10,
   Opus 5.5 $4/$20 per MTok; batches 50% off; cache reads 0.1× input. Haiku 4.5 may retire from
   2026-10-15, so the router reads the live model list at boot and falls back to Sonnet 5.5 for any
   task whose configured model is not offered.
3. **Structured output:** keep `output_config.format` json_schema (GA, already used).
4. **Caching:** `cache_control: {type: "ephemeral"}` on the static system prompt + schema block.
   Minimum cacheable length is 512 tokens on 5.x and 4,096 on Haiku 4.5, so short Haiku prompts
   simply won't cache — expected and harmless.
5. **Batches:** `client.messages.batches` (SDK 0.128.0 has it) for bank gap-filling and queued
   course generation; results polled by a job.
