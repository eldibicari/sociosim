# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Interview Grid Parser:** Add `parseInterviewGrid` to convert raw `interview_guide` text into a structured `InterviewGrid` object (themes, questions, follow-ups) with a full test suite (7 tests).
- **Dedicated Grid Page:** Add `/personnas/[id]/grille` as a standalone page for viewing and editing the interview grid, fully separated from the prompt editor.
- **Grid API Route:** Add `PATCH /api/agents/[id]/guide` to save the interview guide without touching the prompt, and protect the existing agent PATCH from silently overwriting the guide.
- **Grid Panel in Interview:** Add an `InterviewGridPanel` button in the interview sidebar that opens the persona's grid in a Dialog panel on demand, without cluttering the sidebar.
- **Analysis Enriched with Grid:** `analyzeInterviewMessages` now accepts the persona's real grid themes and uses them for theme-coverage scoring instead of hardcoded generic keywords. Falls back to generic keywords when no grid is defined.
- **Persona Architecture:** Add structured schemas for `PersonaConfig`, prompt blueprints, interview grids, grid coverage, method analysis, and export payloads as the base for the advanced persona flow.
- **Persona Prompt Composer:** Add a pure prompt composer that turns visible `PersonaConfig` parameters into a modular internal system prompt while keeping the interview grid separate.
- **Test Coverage:** Add comprehensive test suite for main interview page (`/interview`) with 16 tests covering authentication, session creation, agent loading, and chat interaction.
- **Interview Analysis Tests:** Add focused unit tests for interview analysis heuristics, including the distinction between interviewer prompts and student persona material.
- **Interview Analysis V1:** Add `/api/interviews/analysis` with heuristic material-quality feedback (`insuffisant` / `partiel` / `exploitable`) based on interview messages and token usage.
- **Google Docs Export:** Add OAuth flow and export pipeline to create interview documents in Google Docs.
- **Auth Flow Tests:** Add tests for registration, login, password reset, and logout with invalid input coverage.
- **Guide Page:** Add `/guide-entretien` rendered from `public/docs/guide_entretien.md` and link it in the header.
- **Auth Emails:** Send signup confirmations and password reset emails via Supabase Auth (Inbucket in local dev).
- **Auth Email Template:** Add a custom HTML template for password reset emails.
- **User Management:** Add `/manage-users` page with a user list and API endpoint.
- **User Invites:** Add email-based invitations from `/manage-users`.
- **User Status:** Allow banning/unbanning users from the manage users list.
- **User Roles:** Allow toggling user roles directly from the manage users list.
- **Interview Export:** Add server-side PDF exports with the system prompt included.
- **Personnas:** Add a creation flow with a prefilled prompt template and redirect to the editor.
- **Personnas Admin Controls:** Add agent activation toggle on personna cards with admin-only access, icon-based status, and toast feedback.
- **Personnas List:** Split active and inactive agents into separate sections and hide interview actions for inactive agents.
- **Dashboard Filters:** Only show interviews for active agents.
- **Auth Admin Flag:** Expose `user_admin` in auth context and gate the manage users link + redirect non-admins.
- **Footer:** Add Université Gustave Eiffel footer with logo and legal/contact links.
- **Agents:** Add `is_public` flag to `public.agents`.
- **Agent Policy Module:** Centralize all agent visibility, toggle, and interview-start rules in `src/lib/agentPolicy.ts`, replacing duplicated `isAdminLike()` checks across 3 API routes.

### Changed
- **Personnas List UX:** Rework `/personnas` with a stronger pedagogical page intro, visible search, filter pills, clearer grouped sections, and richer cards with more explicit interview/history/prompt actions.
- **Persona Fiche V1:** Add a first `/personnas/[id]` persona sheet that connects interview start, prompt visibility, pedagogical interview guidance, posture tips, and persona-specific history from a single page.
- **Personnas Creation Guidance:** Make the create/edit flow more pedagogical with clearer side guidance, stronger field framing, a prompt editor subtitle, and a more explicit prompt validation sidebar.
- **Persona Interview Guide:** Add a dedicated editable `interview_guide` to personnas, expose it in create/edit flows, and show it in the persona sheet before falling back to a derived guide.
- **Personnas Block Closure:** Align persona creation/editing with the fiche flow and document the future home-page persona examples inspired by Character.AI.
- **Interview Analysis V2:** Rework interview analysis to evaluate the persona's answers as the real student material, add clearer metrics, a simple score breakdown, and a more pedagogical summary/coaching structure.
- **Interview Analysis V3 Schema:** Prepare optional pedagogical sections for interview conduct, material reading, theme coverage, concrete examples, and alerts without breaking the current V2 response.
- **Interview Analysis V3 Logic:** Start enriching analysis with interviewer-conduct signals, noise/test-message detection, first theme coverage hints, concrete examples, and pedagogical alerts.
- **Interview Feedback Panel:** Redesign `Retour sur l'entretien` with clearer badges, key metrics, pedagogical reading blocks, and a concrete coaching tip for the next interview move.
- **Interview Feedback V3 Sections:** Display pedagogical sections for interview conduct, material reading, theme coverage, chat-derived examples, and alerts inside the interview feedback panel.
- **Interview Analysis Complete Page:** Add a dedicated `/interview/[id]/analysis` page and a shared analysis renderer so the chat keeps a short feedback panel while full pedagogical analysis lives on its own page.
- **Interview Analysis PDF Export:** Add a dedicated pedagogical PDF export for complete interview analysis, separate from the transcript export.
- **Interview Streaming UX:** Make persona replies render progressively with a live cursor so the SSE chat feels closer to a real AI typing experience.
- **Interview Chat Resilience:** Surface SSE chat errors in the UI and show a clear recovery message when the ADK session is no longer available.
- **Interview Sidebar Focus Mode:** Add a conversation-focus toggle that collapses the persona summary card and frees more vertical space for chat history browsing.
- **Interview Sidebar:** Add a per-chat actions menu (`...`) with rename, pin, and delete actions, plus a more scrollable history layout with clearer current/pinned/recent sections.
- **Interview UI Polish:** Refine the interview sidebar cards, persona summary card, empty-state suggestions, and collapsible feedback panel for a cleaner demo-ready experience.
- **Interviews Route:** Rename `/dashboard` to `/interviews`.
- **Admin Interviews:** Admins can view all interviews without resuming someone else’s session.
- **Tests:** Auth flow tests now pass with bad input assertions and coverage reporting.
- **Interview Layout:** Extract shared interview layout and hooks to reduce duplication across interview pages.
- **Interview Intro:** Render the new interview intro from `public/docs/guide_entretien_court.md`.
- **Interview Intro:** Replace the collapsible guide with a header help link that opens a dialog.
- **Interview Intro:** Allow font size settings to scale the intro text.
- **Auth Redirects:** Update local Supabase SMTP host and redirect allowlist to support email-based flows.
- **Dashboard:** Split the dashboard into dedicated Personnas and Mes entretiens pages.
- **Agents:** Add `public.agent_prompts` for versioned system prompts and seed a template persona in Supabase.
- **Personnas:** Replace the prompt textarea with a TipTap editor that saves markdown.
- **ADK Contract:** Send `agent_id` (instead of `agent_name`) in ADK session/run requests and accept `agent_id` in `/api/sessions`.
- **Personnas:** Add prompt history selector on `/personnas/[id]/edit` to load and edit previous versions.
- **Users:** Allow authenticated reads of user profiles for prompt history labels.
- **Personnas:** Filter the list to `active` agents and track prompt availability on each card.
- **Personnas:** Switch filtering to `is_template=false` for listing agents.
- **Interview Sidebar:** Refresh the header layout with icon-only actions and agent details in the sidebar.
- **Interview History:** Use agent IDs for history filters and links across personnas and interviews.
- **Interview Tokens:** Rely exclusively on ADK `usageMetadata` (`promptTokenCount`/`candidatesTokenCount`) for token usage storage.
- **Icon Buttons:** Add tooltips across icon-only actions for clearer affordances.
- **Personnas Actions:** Align card actions with the interview sidebar styling and update prompt/admin controls.
- **Personnas Validation:** Add Cauldron prompt review with sidebar feedback on create/edit and block publishing when invalid.
### Fixed
- **Persona Fiche:** Keep persona summary points readable without truncating lines and clarify that prompt validation only checks the persona prompt, not the interview guide.
- **Chakra Buttons:** Replace invalid `variant="link"` usage with Chakra v3-compatible variants.
- **Next Config:** Move `outputFileTracingIncludes` to the top-level Next.js config.
- **Auth Resilience:** Add shared timeout handling for auth and registration flows to prevent infinite spinners.
- **Auth Concurrency:** Centralize client auth calls behind a serialized auth service to avoid Supabase auth deadlocks.
- **Client DB Calls:** Move personna edits/creation and interview agent lookups to API routes to avoid auth-client hangs.
- **Registration Guard:** Block banned users from re-registering via email aliases.
- **Interview History:** Stabilize history visibility by using server-computed message counts and chunked queries to avoid URI length errors.
- **Interview Summary:** Include agent descriptions in interview summaries for sidebar context.

### Changed
- **Agents Data Source:** Load agent_name and description from `public.agents` instead of static in-code definitions.
- **Theme System:** Move to Chakra semantic tokens with light/dark mode support and header color-mode toggle.
- **Interview Input Layout:** Keep chat input pinned and full-width during resume and new interview flows.

---

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

### Categories
- **Added:** New features and test coverage
- **Changed:** Changes to existing functionality
- **Fixed:** Bug fixes
- **Deprecated:** Soon-to-be removed features
- **Removed:** Removed features
- **Security:** Security improvements and fixes
- fix auth recovery edge cases on personnas by deriving role and history from authenticated server user
- relax local auth timeouts and improve login timeout feedback for slow recovery environments
