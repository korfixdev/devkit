---
name: korfix-test-guide
description: Use after deploying a Korfix miniapp to verify it works correctly in the browser. Provides manual testing procedures by frame type (main, widget, install). Static validator cannot replace this — run it every deploy.
---

# korfix-test-guide

Manual miniapp testing procedure in the browser after deploy. The static validator (`korfix-miniapp-validate`) checks files — this guide checks live behavior.

## Preparation

1. Open the instance in the browser (log in)
2. Verify the app is installed: `/db/installed_apps` → find the app
3. Open DevTools → Console (F12) — keep it open throughout the check

---

## Checking the `main` frame (main screen)

- [ ] Frame opens without a white screen and without 404
- [ ] No red errors in console on load
- [ ] Data loads (no infinite spinner)
- [ ] iframe height adjusts to content (no extra page scroll)
- [ ] Buttons / forms work — perform the basic scenario
- [ ] After an action (save, delete) UI updates correctly
- [ ] No XHR/fetch errors in the Network tab (no 403, no 500)

## Checking the `widget` frame (dashboard widget)

- [ ] Add the widget to the dashboard (if not added automatically by the installer)
- [ ] Widget loads without errors
- [ ] Data in the widget is current (not cached from a previous session)
- [ ] Widget size is correct — not clipped, not overflowing
- [ ] If the widget is clickable — click navigates to the correct destination

## Checking the `install` frame (installer)

- [ ] On repeated install — installer does not crash, completes correctly
- [ ] `App.done()` is called — platform moves to the next setup step
- [ ] If installer creates a catalog — verify the catalog was created (`/db/custom_xxx.json`)
- [ ] Repeated installer run is idempotent (no duplicate data)

## Data isolation check

- [ ] Log in as a different user — storage data from another user is not visible
- [ ] Catalog data is filtered by `from_group` correctly

## Mobile view check

- [ ] Switch DevTools to mobile mode (iPhone / Android)
- [ ] Content does not overflow the screen
- [ ] Buttons are large enough for touch

## What to do when a bug is found

1. Record: which step, what was expected, what happened, the message from console
2. Open the `korfix-miniapp-dev` agent, pass the bug description
3. After the fix — repeat only the affected items of this guide
4. Do not skip re-deployment through `korfix-pre-deploy`
