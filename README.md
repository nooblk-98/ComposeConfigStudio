# Compose Config Studio

Compose Config Studio is a Next.js application that helps teams design, review, and share Docker Compose stacks (and matching `docker run` commands) with live previews, guardrails, and quick copy. It keeps your service templates versioned, consistent, and easy to extend.

---

## Why it exists
- Make Docker stacks approachable: guide users through ports, env, volumes, labels, and networks.
- Keep templates in code: app definitions live in `src/data`, so changes are reviewable.
- Reduce copy/paste drift: live Compose/CLI previews stay in sync with form inputs.
- Support variants: switch databases or service flavors without rebuilding everything.

---

## What you can do
- Browse app presets and tweak settings with a form-first UI.
- Watch Compose YAML and `docker run` output update instantly.
- Edit YAML inline with Monaco, then sync changes back to the form.
- Add your own app templates by dropping lightweight config files into `src/data`.
- Package and share ready-made Compose bundles in `docker/` or `.github/docker/`.

---

## How it works (flow)
1. Select an app preset from the sidebar.
2. Adjust env, ports, volumes, labels, networks, and variants in the config panel.
3. Preview output in the right panel (tabs: Compose YAML, `docker run`).
4. Optionally edit YAML directly; save to sync with form fields.
5. Copy the output and run with Docker/Compose.

---

## Tech stack
- Next.js 14 (App Router), TypeScript, TailwindCSS
- Monaco Editor for code-like editing
- Custom generators/parsers in `src/utils` (Compose and CLI)

---

## Quick start (dev)
```bash
npm install
npm run dev
# open http://localhost:3000
```

---

## Adding app templates and Compose bundles
- Catalog lives in `src/data`:
  - Register base entries in `src/data/index.js` (`appsList` and dynamic loaders).
  - Provide per-app configs in `src/data/<app>/app.js` or `main.js` for multi-variant apps.
- Types live in `src/types/app.ts`; add optional fields there before using them in configs.
- Ready-made Compose bundles:
  - Place reusable files in `docker/` or `.github/docker/`.
  - Name descriptively (for example, `docker/stack-wordpress.yml`) and link them in your docs or automation.

---

## Data model (essentials)
- `AppDefinition` (see `src/types/app.ts`): describes name, logo, default ports, env, volumes, services, variants, networks, etc.
- `appsList` (in `src/data/index.js`): registers available apps and handles dynamic loading of per-app configs.
- Per-app config files: contain service definitions, images, ports, env defaults, volumes, and variant details.

---

## Project layout
```
src/
  app/          # Routes (UI + APIs)
  components/   # UI pieces
  data/         # App definitions
  types/        # Shared typings
  utils/        # Generators/parsers
.github/
  workflows/    # CI/CD and release
  docker/       # Example compose bundles
docker/         # Additional compose bundles (user-owned)
```

---

## Release and CI notes
- `.github/workflows/release.yml`: auto-bumps tags (SemVer) and publishes GitHub Releases with notes.
- `.github/workflows/ci-cd.yml`: lint/build, multi-arch image build+push, and remote sync/deploy steps.
Make sure required secrets (for example, `PRIVATE_KEY`) are configured if you use the provided workflows.

---

## Contributing
1. Fork and branch.
2. Run `npm run lint` and `npm run build`.
3. Open a PR with a concise summary (and screenshots for UI changes).

### Help wanted
- I’m actively accepting pull requests—especially for UI polish, UX tweaks, new app templates, and CI/release improvements.
- I’m not a full‑stack expert; if you spot a better pattern, add it with a brief note in the PR.
- If you’re unsure where to start, open an issue outlining your idea and we can scope it together.

---

## Purpose and license
- Purpose: make Docker stacks easy to author, review, and reuse with a guided UI plus versioned templates.
- License: MIT — use it, ship it.
