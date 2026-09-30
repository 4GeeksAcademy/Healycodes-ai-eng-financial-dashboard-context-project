# Memory bank

Project memory for the next person or coding agent. Everything here is tied to files in this repo; claims were checked in `verification.md`.

| File | Contents |
|---|---|
| [productContext.md](productContext.md) | What the product is, who it's for, what it shows — and what it does not do |
| [techContext.md](techContext.md) | Languages, frameworks, versions, how the pieces connect, how to run and test |
| [progress.md](progress.md) | Current status: what works, known gaps, next priorities, change log |

Rules for making changes are in `.agents/rules/`. Evidence behind both is in `docs/engineering-findings.md`.

**Keep this current:** when a change alters behavior or fixes/finds a gap, update `progress.md` in the same commit (`.agents/rules/repo-hygiene.md`). If something here stops matching the code, the code wins — fix this file.
