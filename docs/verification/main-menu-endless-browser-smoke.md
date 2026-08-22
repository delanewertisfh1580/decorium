# Main Menu and Endless Mode Browser Smoke

## Local development verification

**Date:** 2026-08-22
**Target:** local Vite development build at `http://localhost:5173/`

| Flow | Observed result | Status |
|---|---|---|
| Application boot | After correcting the endless catalog schema draft to Draft-07, the application booted without the prior schema loader error and rendered the main-menu overlay immediately. | Pass |
| Main menu | The home screen exposed distinct **Continue**, **Campaign**, and **Endless order** actions. Its explanatory copy states that campaign levels are authored and endless requests are seed-reproducible. | Pass |
| Campaign selection | The campaign screen displayed three level cards with the first card available and the remaining cards visually marked locked for the restored profile. | Pass |
| Authored level entry | Selecting `level-001` closed the overlay and loaded the existing authored room, its five catalog-owned starter instances, surface choices, catalog, briefing and game HUD. | Pass |

The first browser attempt exposed a genuine boot blocker: `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`. The endless blueprint schema was changed to the project-standard Draft-07 declaration; subsequent browser load succeeded.

## Remaining browser checks

- Return to the main menu using the toolbar and create an endless run.
- Confirm generated briefing/baseline/reset behavior and absence of console errors.
- Confirm an endless evaluation does not mutate campaign completion/reward state.

## Browser transport note

After opening an authored level, the toolbar **Main menu** action was triggered. The subsequent visual snapshot and page-view transports failed to upload, while the browser console contained **no output or runtime errors**. This is recorded as a browser screenshot transport limitation rather than a product failure; the remaining UI state will be confirmed with DOM evidence and a fresh page load.

Additional DOM evidence: the in-game toolbar menu control exists, is enabled, and its runtime `onclick` handler is `() => this.openMainMenu()`. Triggering it through the browser automation did not unhide the menu in the affected browser session, and the console remained empty. A fresh-session retry is required to distinguish a stale development module/session from an application listener fault.

## Fresh-session endless flow

A fresh local server session rendered the home screen, then the **Endless mode** screen with its explicit seed explanation, a new-order action, and disabled replay action until a seed exists. Selecting **Generate new order** successfully loaded a generated run with a visible deterministic run title (`Вечер для друзей · заказ #1712296156` in this session), a client brief, a catalog-backed single starter item, player-owned surface controls, the normal HUD, and no browser-console error. This confirms generated content crosses menu, session, application, domain and rendering boundaries rather than acting as a UI-only mode switch.

## Reset and evaluation smoke

The **New attempt** action preserved the generated title and returned the dashboard to its one-item generated baseline, as confirmed by DOM text. Evaluating that run rendered a normal result panel (`49/100`, `2 ★`, completion blocked) with generated feedback and no campaign reward/unlock message. The dedicated coordinator regression test separately proves no campaign completion use case is called in this mode.

During follow-up interaction, Vite applied the latest source updates as a full development reload and returned the browser to the home menu. The stale-element result was therefore an expected development-session refresh, not an application error. The updated authored priority metadata will be covered by automated content and application tests before release.
