# PRD — “Agent Host” MVP

**Owner:** Tural
**Date:** Oct 9, 2025
**Goal:** A single app that lets you create/edit/delete agents (each mapped to an OpenAI Agent Builder workflow ID) and instantly get an **iframe embed link** for each. Public users can load embeds; no end-user auth.

---

## 1) Scope (MVP)

* **Agents Registry:** minimal CRUD over agents (name, slug, workflow_id).
* **Public Embeds:** route `GET /embed/[slug]` renders ChatKit UI for that agent.
* **Session Creation:** reuse your existing **Edge** API route that mints a ChatKit **client_secret** (secure; server-only API key). 
* **Admin Access:** simple admin screen in the same app (Firebase Auth) to manage agents.
* **No tenants, no SSO, no docs ingestion** (OpenAI handles agent behavior/workflows).

Why this is easy: your starter already has ChatKit wiring, Edge route for session creation, and env config patterns. We’ll just resolve the **workflow_id by agent slug** instead of env-only. 

---

## 2) User Stories

1. **Create agent**: As an admin, I can add an agent by giving it a name, slug, and workflow ID; I immediately get an **iframe snippet**.
2. **Update agent**: As an admin, I can change the agent’s workflow ID (e.g., point to a new Agent Builder workflow).
3. **Delete agent**: As an admin, I can remove an agent; the embed link becomes invalid.
4. **Use embed**: As a public user on a district site, the iframe shows the ChatKit chat for that agent and works without login.

---

## 3) Data Model (Supabase)

**Table: `agents`**

| column      | type    | notes                               |
| ----------- | ------- | ----------------------------------- |
| id          | uuid PK |                                     |
| name        | text    | display name                        |
| slug        | text    | unique; used in URL `/embed/[slug]` |
| workflow_id | text    | OpenAI Agent Builder workflow ID    |
| created_at  | timest. | default now()                       |
| updated_at  | timest. | on update                           |

> (Optional later) `status` enum(`active`,`disabled`) for soft-offline.

---

## 4) Routes & API

### Public

* `GET /embed/[slug]`
  **SSR/Server Component** loads `agent` by `slug` and renders your `ChatKitPanel` with that agent’s `workflow_id`. The panel still calls **`/api/create-session`** to obtain client_secret. 

* `POST /api/create-session` (Edge; **exists already**)
  Extend it to accept `workflowId` in the request body (or resolve by slug beforehand). It already sets secure cookies and calls OpenAI to mint a client secret. **Do not expose server key.** 

### Admin (Firebase Auth-protected)

* `GET /admin` – dashboard list of agents with “New / Edit / Delete” actions.
* `POST /api/admin/agents` – create `{ name, slug, workflow_id }`.
* `PATCH /api/admin/agents/:id` – update `{ name?, slug?, workflow_id? }`.
* `DELETE /api/admin/agents/:id` – remove.

> Keep admin in the same Next.js app as requested.

---

## 5) Embed Contract

**Generated snippet (displayed in Admin after create):**

```html
<iframe
  src="https://YOUR_DOMAIN/embed/AGENT_SLUG"
  width="100%"
  height="700"
  style="border:none; border-radius:12px; overflow:hidden">
</iframe>
```

* Works on public pages (no end-user auth).
* The iframe page initializes ChatKit → calls your Edge route → receives `client_secret` → loads the workflow. 

---

## 6) App Structure (stays close to your starter)

```
app/
  admin/page.tsx                # agents table + form (Firebase Auth guard)
  embed/[slug]/page.tsx         # loads agent by slug, renders ChatKitPanel
  api/create-session/route.ts   # already exists (Edge); accept workflowId
components/
  ChatKitPanel.tsx              # reuse; accept workflowId as prop
lib/
  supabase.ts                   # client
  config.ts                     # keep existing ChatKit config points
```

* Keep **ChatKitPanel** mostly intact; add prop `workflowId` and use it in the call to `create-session` rather than env-only. 

---

## 7) Minimal UX

**Admin**

* List of agents (name, slug, workflow_id, created_at).
* “+ New Agent” modal with fields.
* After save: show **embed snippet** and a “Copy” button.
* Edit/Delete inline actions.

**Embed**

* Use your existing theming + error overlay patterns. 

---

## 8) Config & Secrets

Add to existing envs (alongside `OPENAI_API_KEY`, etc.):

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Keep existing ChatKit env handling as described in the guide; we’ll prefer **runtime `workflowId`** over `NEXT_PUBLIC_CHATKIT_WORKFLOW_ID` if provided. 

---

## 9) Security Notes

* **Edge route** remains the only place that touches the OpenAI API key; continue using **HttpOnly** cookie + **SameSite=Lax** + **Secure** in prod. 
* Admin APIs must check Firebase ID token server-side; public embed stays unauthenticated.

---

## 10) Acceptance Criteria

* **Create agent** in Admin → see it in list with **copyable iframe**.
* Visiting `/embed/[slug]` renders ChatKit for the correct `workflow_id`.
* Chat session initializes via **Edge `create-session`** without console errors.
* Update `workflow_id` → reload embed reflects the new workflow.
* Delete agent → `/embed/[slug]` returns 404/not found page.

---

## 11) Build Checklist (dev-ready)

* [ ] Supabase: create `agents` table and service role for server mutations.
* [ ] `embed/[slug]/page.tsx`: server-fetch agent by slug; pass `workflowId` to `ChatKitPanel`.
* [ ] `ChatKitPanel.tsx`: if `workflowId` prop provided, send it to `create-session` payload.
* [ ] `create-session/route.ts`: accept body `{ workflowId }`; fall back to env only if missing. 
* [ ] Admin UI with Firebase Auth (client-side guard + server verification on admin APIs).
* [ ] Generate and display iframe snippet after agent create/update.
* [ ] Vercel project envs configured (OpenAI key, Supabase keys).
* [ ] Basic 404 for unknown slugs.
