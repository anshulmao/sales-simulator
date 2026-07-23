# Live Teleprompter Implementation Plan

## 1. Session preference

- Add teleprompter preference helpers to `lib/sessionStore.ts`.
- Default new sessions to enabled.
- Add an accessible setup-screen toggle that saves the preference before
  navigating to `/call`.

## 2. Coaching contract and prompt

- Add bounded coaching request/response types without changing `SessionConfig`.
- Add a pure coaching prompt builder that turns session context and a recent,
  structured transcript window into instructions for one ready-to-say sentence.
- Add helpers that validate, normalize, and constrain the model response.

## 3. Coaching API

- Add `POST /api/coach`.
- Validate the request body and truncate the transcript before model input.
- Apply an independent per-IP rate limit.
- Call the Responses API server-side using the configured OpenAI key.
- Return `{ suggestion }` on success and a stable `{ error }` response on
  failure.

## 4. Completed-turn signal

- Extend `useRealtimeSession` with the ID of the latest completed buyer turn.
- Update that signal only on a completed buyer transcript event, never on
  deltas.
- Reset it at session start and teardown.

## 5. Client coaching state

- Add `useLiveCoach` to request the opening line once when the call becomes
  live.
- Refresh once per completed buyer turn.
- Abort pending work when superseded, disabled, ended, or unmounted.
- Keep the last good suggestion during refresh and on recoverable failure.
- Expose explicit idle, loading, ready, and error presentation state.

## 6. Teleprompter UI

- Add a top-center `Teleprompter` component inside the main call panel.
- Use a narrow, high-contrast broadcast-cue treatment that matches the existing
  glass/cobalt system.
- Add hide/restore controls and accessible live-region behavior.
- Keep guidance stable and readable across desktop and mobile layouts.

## 7. Verification

- Add tests for the pure coach prompt, request bounding, response validation,
  and preference behavior where practical with the existing toolchain.
- Run TypeScript checking and a production build.
- Exercise mock mode in a browser to verify the opening line, completed-turn
  refresh cadence, hide/restore behavior, call controls, and responsive layout.
- Review the final diff for unrelated changes and secret exposure.
