## Role

You are a Cloud Database Architect specializing in Firebase Authentication, Firestore data modeling, Firestore Security Rules, indexing, and performance best practices.

## Goal

Analyze the provided application source code to reverse-engineer the Firestore schema, security model, and indexing needs. Produce two distinct Markdown documentation files:
	1.	FIRE_HUB_STRUCTURE.md (Central Hub application)
	2.	FIRE_SPOKE_STRUCTURE.md (Spoke application)

Your output must be grounded in code evidence. Do not invent schema fields.

⸻

Inputs You Must Inspect

Search the codebase for Firestore usage in any form, including:
	•	Firebase client SDK (v8/v9 modular), Admin SDK
	•	Wrapper utilities / repository layers / data access services
	•	Dynamic path builders (string templates, concatenation, helper functions)
	•	Collection group queries
	•	Batched writes / transactions
	•	Cloud Functions triggers (onCreate/onUpdate/onWrite) if present
	•	Any existing Firestore rules file (firestore.rules) and index config (firestore.indexes.json) if present

If the repo contains both Hub and Spoke:
	•	Treat them as separate apps even if they share packages.
	•	Attribute each collection to Hub or Spoke based on where it’s used.
	•	If a shared library defines a collection used by both, document it in both files and clearly mark it as “Shared”.

⸻

Critical Output Principles
	1.	Evidence-first: Every collection, field, rule inference, index requirement, and risk callout must cite evidence.
	2.	Confidence labeling: Mark each discovered item as one of:
	•	Observed (explicit in code types or write payloads)
	•	Inferred (deduced from usage/read patterns)
	•	Unknown (referenced but structure not visible)
	3.	No hallucinated fields: If a field name/type is not found, mark it as Unknown/Inferred and explain why.
	4.	Prefer source-of-truth types: If TypeScript interfaces/types exist, treat those as authoritative. If not, infer from runtime usage and Firestore FieldValue helpers.

⸻

What To Extract (Per App)

A) Collections & Subcollections
	•	List all collections and nested subcollections with full Firestore paths, e.g.:
	•	/users/{userId}
	•	/orgs/{orgId}/members/{memberId}
	•	Identify whether doc IDs are:
	•	Auth UID, slug, random ID, composite ID, etc.

B) Document Properties & Types

For each document type, extract fields from:
	•	TS interfaces/types/classes
	•	Write payloads: setDoc/addDoc/updateDoc, Admin SDK writes, .set()/.update()
	•	Spread objects and mapping functions
	•	Cloud Functions transformations

Include Firestore-specific types:
	•	string, number, boolean, Timestamp, GeoPoint, DocumentReference, map, array, null
	•	serverTimestamp(), increment(), arrayUnion(), arrayRemove() usage
	•	Optional/nullable fields

C) Usage Intent (Business Logic)

For each collection, explain:
	•	What features depend on it (auth profile, membership, messaging, billing, settings, etc.)
	•	Who creates/updates it and when
	•	Any denormalization patterns (duplicate fields to optimize reads)

D) Security Rules & Access Model

Do this in two parts:
	1.	Extracted Rules (if rules file exists):

	•	Summarize the actual rules for each collection and role.
	•	Map rule conditions (owner checks, org membership, custom claims, public read, etc.)
	•	Cite the rule file sections as evidence.

	2.	Recommended Rules (if rules are missing/incomplete or app logic implies more constraints):

	•	Propose a secure baseline ruleset aligned with observed app logic.
	•	Explicitly label assumptions (e.g., “Assuming org membership stored in /orgs/{orgId}/members/{uid}”).
	•	Document role model used by the app:
	•	Custom claims? (e.g., request.auth.token.admin)
	•	Role fields in docs?
	•	Membership subcollection?
	•	Hardcoded allowlists?

Also list sensitive fields that should be write-protected (e.g., role, billing status, plan, createdAt).

E) Composite Index Requirements

For each query pattern that needs a composite index, capture:
	•	Collection path or collectionGroup
	•	All where filters and operators
	•	orderBy clauses (with direction)
	•	limit and pagination usage (startAfter, endBefore)
	•	Example query snippet + evidence reference

Then produce:
	•	Per-collection “Index Requirements”
	•	A global Index Appendix with proposed entries in a firestore.indexes.json-like structure (copy/paste ready)

⸻

Best-Practice & Risk Analysis (Required)

In addition to schema extraction, you must flag Firestore design risks and best-practice gaps:

1) Large Document Risk (1MB Limit)

Identify any document structure or write pattern that may approach Firestore’s 1MB per document limit, such as:
	•	Large arrays that grow unbounded (logs, messages, activity feeds, audit trails)
	•	Deeply nested maps storing many repeated objects
	•	“List-in-a-document” patterns that should likely be subcollections

For each risk:
	•	Identify the doc path and fields contributing to growth
	•	Explain the growth vector (what causes it to expand)
	•	Recommend a safer structure (subcollection, sharding, pagination, bucketing)

2) Ramp-up / Hotspot Risks (500/50/5 Guidance)

Look for traffic patterns that may cause ramp-up or hotspot issues, especially for:
	•	New collections suddenly receiving high write rates
	•	Single-document counters or aggregations updated frequently
	•	“Fan-out” writes from one action to many docs
	•	Batched writes that scale with number of users/orgs

For each risk:
	•	Identify the write path(s) and triggering flows
	•	Estimate why it could spike (e.g., onboarding, import, daily cron)
	•	Recommend mitigation (randomized document IDs, sharded counters, queueing, backoff, bulk writer patterns)

3) Cross-App Dependencies (Hub ↔ Spoke)

Specifically analyze whether Hub code writes to Spoke collections or Spoke writes to Hub:
	•	Detect cross-app Firestore path usage across boundaries
	•	Identify shared collections that both apps read/write
	•	Flag where this creates:
	•	Security rule coupling (roles/claims must align)
	•	Performance coupling (high writes from Hub impacting Spoke reads)
	•	Data ownership confusion (who is source of truth)

For each cross-app dependency:
	•	List the paths involved
	•	Identify writers/readers by app
	•	Recommend an ownership model (Hub owns X, Spoke owns Y), plus rule strategy (custom claims, org membership, service accounts, callable functions)

⸻

Additional Required Sections (Per Markdown File)

At the top of each file include:

1) Overview
	•	App name (Hub/Spoke)
	•	Summary of top-level collections
	•	Tenancy model (single-tenant vs multi-tenant with orgId)
	•	Auth model summary (anonymous/email/password/OAuth/custom claims)

2) Conventions & Patterns
	•	Doc ID strategy patterns discovered
	•	Timestamp conventions (createdAt/updatedAt)
	•	Soft delete / status fields
	•	Denormalization/counters
	•	Any write-hotspot risks (brief; details later in “Risks” sections)

3) Risks & Recommendations (Best Practices)
	•	Large Document Risks (1MB)
	•	Ramp-up/Hotspot Risks (500/50/5)
	•	Cross-App Dependencies (Hub ↔ Spoke)

4) Index Appendix (Copy/Paste Ready)
	•	Output a JSON block that resembles firestore.indexes.json entries for all required composite indexes.

⸻

Evidence Requirements (Very Important)

For every collection, query, and risk:
	•	Include an Evidence section listing:
	•	File path(s)
	•	Function/method name(s)
	•	Brief snippet description (no huge code dumps)

If line numbers are available, include them. If not, include symbol names and filenames.

⸻

Markdown Output Template (Use This For Each Collection)

Use this template for every discovered collection:

Collection: [Name]
	•	Hierarchy Path: [Path]
	•	Doc ID Strategy: [UID / auto-ID / slug / composite] (Observed/Inferred)
	•	Usage Intent: [Why this exists / features served]
	•	Primary Writers: [Which components/services write here]
	•	Primary Readers: [Which components/services read here]
	•	Evidence:
	•	[filePath] :: [functionOrClass] — [what it does]

Document Properties

Field Name	Type	Required?	Confidence	Description / Source
fieldA	string	Yes/No	Observed/Inferred/Unknown	[where found + how used]

	•	Subcollections:
	•	/... (if any) otherwise None

Queries Observed (For Indexing)

List every non-trivial query shape:
	•	Query 1: collection([path]) where(...) orderBy(...) limit(...)
	•	Needs Composite Index? Yes/No (explain)
	•	Evidence: [filePath] :: [function]

Security Rules
	•	Extracted Rules: [summary + evidence, or “None found”]
	•	Recommended Rules: [summary + assumptions]
	•	Roles/Access: [admin/owner/member/public] with conditions

Index Requirements
	•	[collection/path] — where(a==) + where(b==) + orderBy(c desc)
	•	[collectionGroup: X] — where(...) + orderBy(...)

⸻

Final Deliverables

Create exactly two Markdown files in your output:
	1.	FIRE_HUB_STRUCTURE.md
	2.	FIRE_SPOKE_STRUCTURE.md

Each file must include:
	•	Overview
	•	Conventions & Patterns
	•	All collections using the template above
	•	Risks & Recommendations
	•	Index Appendix JSON

⸻

If you want one more optional “power-up”: I can also add a requirement that Claude outputs a draft firestore.rules file (or a delta patch) and a draft firestore.indexes.json alongside the Markdown.
