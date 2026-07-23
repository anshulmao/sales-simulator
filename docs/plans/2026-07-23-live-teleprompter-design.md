# Live Teleprompter Design

## Goal

Add an optional live teleprompter to the sales call screen. It sits at the top
center of the main call panel, near the user's camera and eye line, and shows one
short, ready-to-say sentence generated from the current conversation.

The feature is coaching-only. It must not alter the simulated buyer's prompt,
voice, or behavior.

## Session preference

- Add a "Live teleprompter" toggle to the setup screen.
- Enable it by default for new sessions.
- Persist the preference for the current session separately from the locked
  `SessionConfig` contract.
- Let the user hide or restore the teleprompter during the call.
- A change made during the call lasts for the remainder of that session.
- Disabling the feature cancels any pending coaching request.

## Call-screen experience

- Place the teleprompter at the top center of the main call panel, near eye
  level.
- Show exactly one concise, natural sentence that the user can say verbatim.
- Use large, high-contrast type and a narrow measure that is easy to scan
  without obvious eye movement.
- Request an opening line when the call becomes live.
- Refresh guidance after each completed buyer turn, not on transcript deltas.
- Keep the current sentence stable while the user is speaking.
- While a replacement is loading, keep the current sentence visible and show a
  subtle updating state.
- Keep the component top-center and unobtrusive on narrow viewports without
  covering status or call controls.

## Architecture

The existing OpenAI Realtime connection remains dedicated to the simulated
buyer. Coaching uses a separate request-response path:

1. `useRealtimeSession` exposes a signal when a buyer transcript turn has
   completed.
2. A dedicated client coaching hook observes the live call status, completed
   buyer turns, transcript, and teleprompter preference.
3. When the call first becomes live, the hook requests an opening line.
4. After each completed buyer turn, the hook sends a bounded recent transcript
   window and the session context to `POST /api/coach`.
5. The route validates and bounds the input, constructs a server-side coaching
   prompt, and requests one short sentence from a text model.
6. The newest valid response replaces the displayed suggestion. Abort handling
   and request sequencing prevent stale responses from overwriting newer ones.

The endpoint returns a small stable response:

```ts
{ suggestion: string }
```

The OpenAI API key, model instructions, and coaching prompt remain server-side.
The coaching route is rate-limited independently of session creation.

## Guidance rules

The coach receives the buyer persona, sales stage, rep goal, and recent
conversation. Its response must:

- contain one sentence only;
- be brief enough to read naturally at eye level;
- sound like spoken language rather than written advice;
- give the rep words to say, not commentary about sales technique;
- respond to the buyer's most recent concern or advance the current sales
  objective;
- avoid inventing product facts, customer evidence, pricing, or commitments;
- avoid repeating a line the rep has already used.

## Failure behavior

There is deliberately no local or predefined coaching fallback.

- While a request is pending, keep the previous AI suggestion visible.
- If a refresh fails, keep the previous suggestion and show a subtle
  "Couldn't refresh" state.
- If the initial request fails before any suggestion exists, show "Guidance
  unavailable" with a Retry control.
- Retry automatically after the next completed buyer turn.
- Do not show errors for requests that were intentionally aborted because a
  newer turn arrived, the feature was disabled, the call ended, or the page
  unmounted.

Likely genuine failures include temporary network loss, an upstream timeout or
service interruption, rate limiting, and an empty or invalid model response.

## Verification

Verify that:

- the setup preference persists into the call;
- requests occur only when coaching is enabled and the call is live;
- an opening suggestion is requested once;
- completed buyer turns cause one refresh while transcript deltas do not;
- suggestions remain stable while the rep is speaking;
- stale responses cannot replace newer guidance;
- disabling the teleprompter cancels pending work;
- request inputs are validated and bounded server-side;
- secrets and coaching instructions do not reach the browser;
- empty, oversized, rate-limited, and failed requests are handled safely;
- no local fallback suggestion is ever shown;
- the existing buyer call, transcript capture, end-call handoff, mock mode, and
  production build continue to work.
