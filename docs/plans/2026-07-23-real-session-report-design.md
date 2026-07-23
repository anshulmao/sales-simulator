# Real Session Report Design

## Goal

Render the report produced for the selected saved session and provide a safe
recovery path when scoring did not complete.

## Data flow

1. A completed call is saved with its config and transcript.
2. The save-time evaluator produces a `Report` and the database stores it.
3. The report page loads the selected session by id and renders only its stored
   report values.
4. If a report is missing, the page keeps the real session metadata and
   transcript visible, explicitly marks the session as unscored, and offers a
   retry.
5. A retry scores the stored transcript and persists the resulting report. For
   local fallback sessions, the client sends its stored config/transcript and
   stores the returned report locally.

## Report presentation

- Overall and scenario scores are labelled on their native 0–10 scale.
- Ring and meter percentages multiply the 0–10 values by ten only for visual
  width.
- Voice values of `-1` render as `Not measured`; no fabricated voice values are
  shown.
- Headline, summary, strengths, improvements, key moments, and next step come
  directly from `session.report`.
- A missing session has a distinct not-found state.
- A scoring failure has a distinct error state and a retry action.

## Reliability

- Scoring failure never discards the completed call or transcript.
- Retrying a database-backed session updates the existing row.
- Retrying a local fallback session updates its local stored copy.
- Existing scored reports are returned without paying for duplicate scoring.
- API errors return safe, actionable messages.

## Verification

- Type-check the full application.
- Verify no illustrative report constants remain.
- Verify database and local retry paths use the same `Report` contract.
- Build the production application.
