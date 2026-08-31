# dsh-plugin-splash

A mobile/PWA-first UI redesign for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) web GUI, delivered as one Cordis plugin with a host half and a browser half. minimal, app-like: the sidebar gets out of your way, the reading area wins, and the app installs as a proper standalone window.

Everything visual is scoped to app windows and touch devices (`display-mode: standalone/fullscreen/minimal-ui`, or `hover:none` + `pointer:coarse`). **Desktop browser tabs are untouched** and render the stock UI.

## Features

**Sidebar (app-style)**
- Collapsing the sidebar hides the 56px icon rail entirely — the chat area spans the full screen width
- A floating whale launcher (the DSH whale mark, theme-following) appears centered in the first column's header band; click to expand
- Expanding opens the sidebar as a **fullscreen overlay** covering the chat instead of pushing it
- Opening a session from the list **auto-collapses** the sidebar (workspace group rows and row menus are ignored)

**Top bar**
- Title row spans the full width; tab row (Chat / Trajectory) gains two right-aligned controls: the agent-preset mode chip (abbreviated to `STD` / `PTC` / `MIN` / `CTR`, en+zh) and the session-log export as a bare icon-only button

**Settings**
- The settings sheet fills the entire screen (no margins, no radius)
- Section nav collapses to an icon-only rail (labels stay in the accessibility tree)
- Picker rows (Permission / Agent preset / Enter behavior): selector on top full-width, description filling the area below

**Chat area**
- Side padding reduced (32px → 12px left / 6px right), reserved scrollbar gutter removed
- User bubbles: fit-content size, right-anchored, uncapped width (extend all the way left when long), square right corners, overflow-safe

**PWA**
- Host route serves a standalone-window manifest (`display: standalone` + `display_override`), so the GUI installs as a real app window — the Android notification bar stays visible (the shipped manifest uses `fullscreen`, which hides it)

## Install

**One command** (installs into the default `web` profile; pass another profile name as the first argument if yours differs):

```bash
curl -fsSL https://raw.githubusercontent.com/Canary-Builds/dsh-splash/main/install.sh | bash
```

Then restart DSH. The installer is idempotent — safe to re-run. Updates: re-run the installer (it installs the latest published version), then restart.

<details><summary>Manual install</summary>

In your DSH profile (e.g. `~/.dsh/profiles/web/`):

1. Install the package: `dsh plugin --profile web add dsh-plugin-splash`
   (the profile is a pnpm workspace — use the `dsh plugin` wrapper, not raw npm)

2. Add the composition row to the profile's `cordis.patch.yml`:

   ```yaml
   - insert:
       - id: splash
         name: dsh-plugin-splash
       ```

3. Restart the profile. No other wiring — the host half registers its route, the browser half is discovered through the standard `dsh.client` scan.

</details>

## Compatibility

The redesign is implemented as scoped CSS keyed off the shipped UI's DOM: stable public attributes (`data-sidebar-collapsed`, `data-details-collapsed`, slot wrappers) wherever possible, plus CSS-module class hashes for elements that expose nothing else. **Those hashes are build-specific** — the plugin targets the `0.1.1-rc.x` DSH web frontend and may silently no-op (never break) on a version whose bundles re-hash. If a feature stops applying after a DSH upgrade, update the hashes in `lib/client.js` (serve `/plugins/@deepseek-ai/dsh-client-ui-*/client.js` on your install and grep the new prefixes).

## Behavior notes

- The manifest override takes precedence over the dist fallback server; disabling the plugin row restores the shipped manifest on restart
- All effects are fiber-owned: removing the plugin row cleanly reverts every style, slot entry, listener, and route
- The floating launcher and auto-collapse never run in desktop browser tabs

## License

MIT
