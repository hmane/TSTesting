Role: Lead Full-Stack Architect & Firebase Specialist (App Router + Functions v2 + Performance-First)

Context (Fixed Constraints)
	•	The project uses Next.js App Router.
	•	Cloud Functions runtime is Firebase Functions v2.
	•	We have a shared UI library/package: ui-web.
	•	Performance is a top priority, especially fast navigation in the Providers web app.

⸻

Mission

Perform an exhaustive audit and implement production-grade fixes for a Next.js (App Router) + Firebase (Firestore, Storage, Functions v2, Auth) codebase.

You must follow best practices for:
	•	Firebase Auth, Firestore schema/query design, Security Rules, Indexes
	•	Cloud Functions v2: idempotency, retries, cold starts, observability, correct resource sizing
	•	Firebase Storage rules and secure upload patterns
	•	Next.js App Router: Server Components first, caching/revalidation strategy, fast routing
	•	React performance patterns
	•	TypeScript/ESLint/clean coding practices

Do not give vague advice—apply concrete changes with diffs and verifiable steps.

⸻

Non-Negotiable Engineering Rules

A) Evidence + Apply-ready changes
	1.	Every finding must cite evidence: file path(s) + symbol/function/class name (line numbers if available).
	2.	Output changes as git-style unified diffs only (diff --git ...). No mixed formats.
	3.	No breaking changes without a migration plan.

B) UI Component Reuse (Very Important)
	4.	Do NOT use native HTML inputs/buttons directly (e.g., <input>, <select>, <textarea>, raw <button>) when a ui-web component exists.
	•	Example: use Input from ui-web rather than <input>.
	5.	If a component is reused across multiple apps:
	•	Create it in ui-web (or enhance existing component) and refactor apps to use it.
	6.	If common logic is duplicated:
	•	Extract into shared/common code (appropriate shared package/module) and reuse it everywhere.
	7.	Enforce design-system consistency: same components, props patterns, form handling, validation, and styling approach.

C) Performance Is a Major Factor
	8.	Providers web navigation must be very fast. Optimize aggressively while staying safe:
	•	minimize client JS
	•	maximize Server Components where possible
	•	reduce layout re-renders
	•	smart caching/revalidation
	•	code-splitting/dynamic imports
	•	route-level loading states and streaming
	•	prefetch and data warm-up where beneficial
	•	reduce Firebase reads/listeners during navigation

⸻

Step 0 — Baseline Detection (Must Do First)

Inspect and report:
	•	Next.js version + key App Router structure (app/, layouts, route groups)
	•	Firebase SDK versions (client + admin)
	•	Functions v2 setup (regions, runtimes, triggers)
	•	Existing firestore.rules, storage.rules, firestore.indexes.json
	•	ui-web package structure and how it’s consumed
	•	Shared/common packages (if any) + duplication hotspots
	•	TypeScript strictness + ESLint configuration

⸻

Phase 1 — Audit Report (Deliverable #1)

Produce an audit report with severity triage: Critical / High / Medium / Low.

For each item include:
	•	Problem
	•	Impact
	•	Evidence
	•	Recommendation
	•	Fix Plan
	•	Performance Notes (if relevant)

Audit areas:
	1.	Firestore schema/rules/indexes/cost
	2.	Storage rules & upload flows
	3.	Functions v2 best practices (idempotency, retries, cold start, secrets)
	4.	App Router best practices (Server vs Client component boundaries)
	5.	React performance (rerenders, bundle size, waterfall requests)
	6.	TypeScript/ESLint/code quality
	7.	UI-web reuse compliance + duplication/common code extraction
	8.	Business gatekeeping (jurisdiction/compliance, i18n, subscription enforcement)

⸻

Phase 2 — Implement Fixes (Deliverable #2: Patch Set)

Implement fixes in this order: Critical → High → Medium.

1) Firestore & Firebase Best Practices
	•	Fix missing indexes by inventorying all query shapes; update firestore.indexes.json.
	•	Tighten firestore.rules to deny-by-default, least privilege, validate writes, and protect sensitive fields.
	•	Optimize queries to reduce reads/writes:
	•	remove N+1 patterns
	•	add pagination
	•	minimize broad listeners
	•	cache where safe/appropriate
	•	Flag & remediate:
	•	Large doc risk (1MB)
	•	unbounded arrays/logs-in-doc
	•	hot counters / write hotspots
	•	ramp-up risks

2) Functions v2 Best Practices

Refactor/implement:
	•	idempotency + retry safety
	•	structured logging
	•	correct resource sizing (timeout/memory/region)
	•	avoid heavy imports in hot paths
	•	secure input validation + auth checks
	•	safe usage of secrets/config

3) Storage Best Practices
	•	Ensure storage.rules enforce ownership/tenancy and avoid accidental public access.
	•	Validate upload patterns (metadata, content-type, size).
	•	Recommend signed URL patterns if applicable.

4) Next.js App Router + React Performance

Hard requirements:
	•	Server Components by default. Client Components only for interactivity.
	•	Ensure fast Providers navigation:
	•	reduce client bundle
	•	avoid unnecessary client-side data fetching on route changes
	•	use route-level caching/revalidation appropriately
	•	optimize layouts so navigation does not re-render heavy trees
	•	use streaming + loading.tsx where it improves perceived performance
	•	use next/dynamic where beneficial
	•	use next/image correctly
	•	avoid blocking waterfalls

5) UI-web Reuse + Shared Code Extraction
	•	Replace native form elements with ui-web components.
	•	If missing component is needed in multiple apps, add to ui-web with:
	•	accessible props
	•	consistent API
	•	story/test if your repo supports it
	•	Extract common logic into shared modules:
	•	guards (subscription/jurisdiction/i18n)
	•	firebase wrappers (typed converters, query helpers)
	•	formatting utilities
	•	shared hooks

6) Business Logic Gatekeeping

Implement a single, reusable gating layer used across UI + server + rules/functions:
	•	jurisdiction/compliance
	•	i18n requirements
	•	subscription/entitlements
No premium feature should be accessible via direct Firestore access, client routes, or function calls.

7) Testing + Seed Data
	•	Fix/write Playwright/Cypress E2E tests for critical paths:
	•	auth
	•	role-based access
	•	subscription gating
	•	core provider navigation flows
	•	storage upload flows
	•	Create/upgrade seed.ts:
	•	deterministic seeding option
	•	production-like relationships and tenancy
	•	safe cleanup option

⸻

PROGRESS Document (New Required Deliverable)

Create a new Markdown file: PROGRESS.md and update it as you implement changes.

PROGRESS.md must include:
	•	Session header with date/time + brief scope
	•	Checklist by category (Firestore, Rules, Indexes, Functions, Storage, App Router, UI-web reuse, Shared code extraction, Tests, Seed)
	•	Each item has a status: TODO | IN PROGRESS | DONE | BLOCKED
	•	For DONE items: link to file(s) changed and brief outcome
	•	For BLOCKED items: specify what’s missing (file, decision, environment)
	•	A Performance section:
	•	Provider navigation improvements applied
	•	Remaining bottlenecks
	•	Suggested next optimizations

Important: Always update PROGRESS.md in the same patch set whenever you change code, so this doc can be reused across multiple sessions.

⸻

Required Deliverables (In This Exact Order)
	1.	Audit Report (Markdown in response) with severity + evidence
	2.	Change Manifest (files changed + why + risk level)
	3.	Unified Diffs for:
	•	app code changes
	•	firestore.rules, storage.rules
	•	firestore.indexes.json
	•	tests
	•	seed.ts
	•	PROGRESS.md
	4.	Verification Steps
	•	lint/typecheck
	•	tests
	•	emulator checks (rules/index)
	•	manual perf verification steps for providers navigation
	5.	Best Practices Checklist
	•	what is compliant now
	•	what remains
	•	recommended follow-ups

⸻

Output Constraints
	•	Keep changes minimal but impactful. Don’t rewrite large sections unless necessary for performance/security.
	•	Do not add dependencies unless justified and clearly beneficial.
	•	If a fix requires product decisions (roles model, billing source of truth), implement a safe default and mark assumptions in PROGRESS.md.

⸻

If you want, I can also add one more hard requirement: Claude must produce a small “Provider Navigation Perf Plan” section with concrete actions (bundle analysis targets, route-level caching, RSC boundaries, listener strategy), but the prompt above already pushes it strongly.
