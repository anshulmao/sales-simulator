# Navigation Completion Design

## Goal

Make every focused flow provide an obvious route back without adding the full
dashboard navigation to screens where it would distract from the task.

## Navigation behavior

- The setup screen shows a prominent `Back to home` control at the top while
  retaining its existing bottom `Cancel` link.
- The onboarding walkthrough shows `Back to settings` at the top.
- The call screen shows `Back to setup` while idle or after an error.
- While a call is connecting or live, selecting `Leave call` opens an accessible
  confirmation dialog. The dialog warns that the transcript and progress will
  not be saved, and offers `Stay on call` and `Leave call`.
- Confirming the exit stops the realtime session and returns to setup without
  saving a report.
- The report keeps its existing `Back to home` control.
- Dashboard screens keep the existing desktop sidebar and mobile navigation.

## Components

Create a reusable focused-flow back link so its icon, typography, hover state,
and focus treatment stay consistent across setup, onboarding, and call screens.
Keep the call-exit dialog local to the call page because it depends on realtime
session status and cleanup.

## Accessibility and safety

- Back controls use descriptive text instead of an icon alone.
- The confirmation uses a labelled modal dialog with an explicit warning.
- Escape and the non-destructive action close the dialog.
- The destructive action is visually distinct.
- Browser unload protection covers accidental refresh, tab close, or external
  navigation during a connecting or live call.

## Verification

- Run a production build to catch type and rendering errors.
- Check all focused routes for the expected back destination.
- Check that idle/error exits do not prompt.
- Check that connecting/live exits prompt and only leave after confirmation.
- Check that leaving an active call invokes realtime cleanup without persisting
  a session.
