# AGENTS.md

## Scope

This file applies to the entire repository.

Lumi is a Russian-language browser Tamagotchi built with Vite, React, and TypeScript. It has two deliberately different visual modes that share one simulation:

- **Retro mode** is the default. It is a low-chrome, code-drawn handheld. Pets and action icons are rendered from pixel matrices; the game surface must not depend on illustrated raster sprites.
- **Cozy mode** uses generated PNG artwork: a room background, an illustrated device shell, pet evolution atlases, and an action icon atlas.

Future changes must preserve both modes unless the task explicitly removes one.

## Product intent

The central fantasy is caring for a small persistent companion over several real days. The first screen should feel like a toy, not a dashboard. Keep the live pet and the physical A/B/C interaction as the primary experience.

Current core features:

- one living mandrake family inhabited by an alraune spirit;
- root-cocoon selection and awakening;
- baby, child, teen, adult, and elder progression;
- care-dependent adult forms;
- hunger, happiness, health, energy, hygiene, discipline, weight, sickness, sleep, waste, and attention calls;
- feeding, play, cleaning, medicine, light, status, discipline, and clock actions;
- a five-round direction mini-game;
- automatic save and up to 72 hours of offline simulation;
- mouse, touch, and A/B/C keyboard input;
- responsive desktop and mobile layouts;
- reduced-motion support.

UI copy is Russian. Keep new player-facing text in natural Russian unless the task explicitly requests localization.

## Quick start

```bash
npm install
npm run dev
```

Normal development URL:

```text
http://localhost:5173/
```

Accelerated mechanics URL:

```text
http://localhost:5173/?fast=1
```

Required production check:

```bash
npm run build
```

There is currently no lint or unit-test script. Do not claim those checks passed unless they are added and run.

## Repository map

```text
.
├── index.html
├── package.json
├── package-lock.json
├── public/
│   └── assets/
│       ├── cozy-room-root-burrow.webp
│       ├── cozy-room-grunewalda.webp
│       ├── device.webp
│       ├── action-atlas.webp
│       ├── pet-atlas-mandrake.png
│       ├── pet-atlas-mandrake-sleep.png
│       └── favicon-mandrake.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── game.ts
│   ├── styles.css
│   └── vite-env.d.ts
├── tsconfig*.json
└── vite.config.ts
```

### File responsibilities

- `src/game.ts` owns serializable simulation types, constants, default state, evolution, one-second simulation, offline progress, and stable game metadata.
- `src/App.tsx` owns React state orchestration, persistence wiring, input mapping, audio feedback, screen components, the illustrated atlas renderer, and the retro pixel renderer.
- `src/styles.css` owns both visual systems, device geometry, responsive behavior, animation, and interaction states.
- `public/assets/` contains cozy-mode raster assets only. Retro mode must remain functional without using these pet and icon images.
- `README.md` is player/developer-facing overview documentation. Update it when visible features or setup commands change.

Do not move simulation rules into CSS or render callbacks. Do not make the renderer the source of truth for saveable state.

## Architecture rules

### Simulation boundary

`PetState` in `src/game.ts` is the save boundary. It must stay JSON-serializable. Never place any of the following in it:

- React nodes or component references;
- DOM, canvas, audio, image, or timer objects;
- functions or class instances;
- derived browser-only objects.

`advanceSecond(previous)` is the canonical real-time update. `simulateOffline(state)` must reuse the same rules so offline behavior does not diverge from live behavior.

When adding a stat or mechanic:

1. Add a serializable field to `PetState`.
2. Add a default in `createPet()`.
3. Update live/offline simulation in `src/game.ts`.
4. Add player actions in `App.tsx`.
5. Add display treatment for both visual modes.
6. Verify old saves still load through the default-state merge.

### Persistence boundary

Current keys:

```ts
const SAVE_KEY = 'lumi-pocket-pet-v3';
const VISUAL_MODE_KEY = 'lumi-visual-mode';
const ONBOARDING_KEY = 'lumi-onboarding-seen-v1';
```

Important invariants:

- Cozy/retro selection is presentation preference, not pet simulation state.
- `loadPet()` merges persisted state over `createPet()` so newly introduced fields receive safe defaults.
- Existing saves should not be silently discarded.
- If a breaking state change is unavoidable, bump the save version/key and implement an intentional migration or explain the reset in the task handoff.
- The selection screen pauses simulation and offline catch-up. A new egg must not hatch while the player is still choosing a family.
- Offline progress is capped at 72 hours.
- Transient UI such as mini-game results and temporary messages should not become long-lived renderer objects in the save. The one-time welcome dialog may use its separate localStorage flag, not `PetState`.

### Time model

The query parameter `?fast=1` changes gameplay constants for verification:

- normal pet hour: 15 real minutes;
- fast pet hour: 50 real seconds;
- normal hatch: 45 seconds;
- fast hatch: 12 seconds.

Do not tune normal and fast behavior independently without checking both paths. Fast mode should accelerate verification, not define separate game balance.

## Input contract

The physical action map is intentionally stable:

- `A` or `ArrowLeft`: open/cycle/move selection;
- `B`, `Enter`, or `Space`: confirm/select;
- `C`, `Escape`, or `Backspace`: back/cancel.

Every new device screen must work through A/B/C before it is considered complete. Pointer/touch buttons may provide direct access, but they are not a replacement for physical-key navigation.

Screen-specific behavior belongs in the central `press()` mapping in `App.tsx`. Avoid scattering global key listeners across components.

## Pet families and evolution atlases

`SpeciesId` and `SPECIES` in `src/game.ts` are the canonical species registry.

Current registry order is significant because the selection cursor stores an index:

1. `mandrake`

Each cozy-mode pet atlas is an exact 3×3 grid:

```text
egg        hatchling   baby
child      teen        good adult
grumpy     elder       ghost/dead
```

A species may also provide a sleep atlas through `sleepAtlas`. It must use the same exact 3×3 cell order as the main atlas so the renderer can switch atlases without changing simulation state.

The runtime uses `background-size: 300% 300%` and column/row background positions. Changing atlas dimensions, padding, or order requires updating the renderer and testing every stage.

The selection screen intentionally zooms previews with `background-size: 340% 340%`. This is presentation-only and must not change the main pet crop.

### Adding a species

When adding another family:

1. Extend `SpeciesId`.
2. Append an entry to `SPECIES`; do not reorder existing entries casually.
3. Add a project-local 3×3 cozy atlas under `public/assets/`.
4. Add a recognizably different retro form in `retroPetPixels()` or provide dedicated code-drawn matrices.
5. Check egg, baby, adult, elder, and ghost crops.
6. Verify A/B selection, direct click, save/reload, and both visual modes.
7. Update `README.md` and this file if the registry or atlas contract changes.

## Visual-mode contract

### Retro mode

Retro mode is intentionally asset-light and focused:

- no cozy side panels;
- one code-drawn handheld centered in the viewport;
- pet sprites rendered through `PixelArt` from `PET_PIXELS` plus species-specific pixel modifications;
- action icons rendered from `ICON_PIXELS`;
- hard edges, bitmap type, LCD palette, and restrained stepped motion;
- no use of `.pet-sprite`, `.icon-asset`, or illustrated `<img>` content inside `.retro-zone`.

Do not replace retro pets with PNGs for convenience. If a shape is simple, edit the pixel matrices or code-drawn modifiers.

Cozy mode is the default when `lumi-visual-mode` has not been set. The mode toggle must remain readable in normal, hover, focus, and active states. In particular, preserve the explicit `.retro-mode .mode-toggle:hover` contrast override.

### Cozy mode

Cozy mode uses generated art but DOM UI:

- `cozy-room-root-burrow.webp` is the page background; `cozy-room-grunewalda.webp` is the preserved previous background;
- `device.webp` is a transparent illustrated shell;
- `.device-screen` is a real interactive DOM surface positioned over the empty screen opening;
- A/B/C are transparent DOM buttons positioned over the illustrated physical buttons;
- side panels show expanded state and quick actions on wide layouts;
- panels move below the device on narrow layouts.

Do not draw text into the device image. All labels and gameplay information must remain DOM content.

### Cozy device calibration

The current illustrated asset has fixed proportional hotspots. Treat these values as calibrated:

```css
.device-screen {
  left: 27.6%;
  top: 31.55%;
  width: 45.1%;
  height: 31.4%;
}

.device-key { top: 66.65%; width: 12.5%; }
.key-a { left: 25.45%; }
.key-b { left: 43.55%; }
.key-c { left: 61.55%; }
```

A/B/C labels are centered with `display: grid; place-items: center`. Do not return to browser-default button alignment. Do not place the small action descriptions inside the image; they belong in the external `.key-hint` row.

At widths up to 760px, the cozy device intentionally uses `min(112vw, 690px)` and a centered flex container. The controlled oversize makes the small generated screen readable. Preserve horizontal centering and ensure the page does not introduce unwanted horizontal scrolling.

### Species selection spacing

The cozy atlas has generous transparent padding inside each cell. Selection previews therefore use a zoomed background and a negative top margin. Preserve a visible gap between the creature and its text label. Any change to `.species-grid .pet-sprite` must be checked at 609×721 and 390×844.

## Styling conventions

- Use the existing CSS variables before inventing isolated colors.
- Cozy UI uses Manrope and Press Start 2P; retro UI uses Press Start 2P for device-facing text.
- Keep the live device centered and visually dominant.
- Respect `prefers-reduced-motion`.
- New hover styles must maintain readable foreground/background contrast.
- Do not turn the game into a generic card dashboard.
- Avoid permanent overlays over the center of the pet screen.
- Use a few meaningful animations for calls, pet idle motion, selection, rewards, and danger.
- Maintain visible focus treatment for keyboard users.
- Use real `<button>` elements for interactions.

## Raster asset rules

Existing cozy assets were made specifically for this project. Do not replace them with hotlinked remote images.

When adding generated raster assets:

- save final assets inside `public/assets/` before referencing them;
- use stable descriptive filenames;
- never reference files under a temporary or model-output directory;
- preserve transparency for atlases and device shells;
- inspect the actual post-processed PNG, not only the generation preview;
- validate transparent corners and subject coverage;
- avoid colored chroma fringes;
- keep pet atlas cells equal and free of labels or grid lines;
- do not overwrite an existing family atlas unless replacement is explicitly intended.

For chroma-keyed pixel art, a hard key is often safer than an aggressive soft matte because soft removal can punch transparent holes into pastel details. Inspect cream, pink, lavender, wings, whiskers, gills, and star decorations carefully.

CSS is appropriate for layout, panels, borders, meters, and the retro device. Cozy illustrative subjects should remain image assets; retro pets/icons should remain code-drawn pixels.

## Gameplay rules to preserve

- The egg selection screen freezes time.
- Eggs hatch only after selection.
- Care mistakes influence later forms.
- Discipline and care quality affect adult evolution.
- Sleep follows pet time and energy.
- Turning off the light while sleeping is beneficial; darkness while awake is unpleasant.
- Waste reduces hygiene and health until cleaned.
- Sickness risk depends on hygiene, waste, and health.
- Medicine should help only when sick and cause a small happiness penalty when unnecessary.
- Mini-game rewards happiness, costs energy, and adjusts weight.
- Death returns the device to the home screen and allows a new egg.
- Creating a new pet resets simulation state but keeps the sound preference.

If changing balance, state the intended player impact in the final handoff.

## Code conventions

- TypeScript strict mode is enabled; do not weaken it to avoid fixing types.
- Prefer pure helpers for simulation changes.
- Use functional React state updates whenever the next value depends on the current state.
- Keep callbacks stable where they are dependencies of effects or input handlers.
- Clean up intervals, timeouts, audio contexts, and event listeners.
- Keep components focused, but avoid premature file splitting that obscures the small application.
- Reuse `SPECIES`, `MENU`, `STAGE_LABELS`, and `NEED_LABELS` instead of duplicating registries.
- Keep atlas lookup data in `SPECIES`, not in conditional JSX scattered through screens.
- Avoid adding a state library unless complexity genuinely exceeds the current reducer-like structure.
- Avoid adding large dependencies for behavior that can be implemented with the current stack.

## Dependency policy

The repository currently uses a small Vite/React/TypeScript stack with a committed `package-lock.json`.

- Use `npm` unless the user explicitly changes package managers.
- Keep `package-lock.json` in sync with `package.json`.
- Do not commit `node_modules/`, `dist/`, `*.tsbuildinfo`, or generated Vite config JS/DTS files.
- Do not upgrade all packages as a side effect of an unrelated feature.

## Required verification

At minimum, run:

```bash
npm run build
```

For UI or gameplay work, also run the app and verify the affected flow in a real browser.

### Viewport matrix

Check these representative sizes:

- `1440×900`: full cozy three-column layout;
- `1100×850`: transitional layout and retro desktop;
- `609×721`: narrow cozy device calibration and species selection;
- `390×844`: mobile layout, header wrapping, and retro controls.

### Core smoke flow

Use `?fast=1` where appropriate:

1. Open a fresh session and confirm species selection appears.
2. Cycle selection with A and confirm with B.
3. Reload and confirm the selected species/name persists.
4. Switch visual modes and confirm the same species is shown.
5. Wait for hatching in fast mode.
6. Open menu with A.
7. Feed with B and confirm hunger changes.
8. Open and cancel the mini-game.
9. Toggle pause and confirm stats stop changing.
10. Verify no browser console or page errors.

### Visual assertions

- Retro mode contains no cozy pet/icon raster elements inside `.retro-zone`.
- The retro mode toggle text remains visible on hover and keyboard focus.
- Cozy A/B/C label centers align with the physical button centers. At 609×721 the text center should match its button center within about one pixel.
- Cozy device remains horizontally centered when intentionally wider than the viewport content column.
- Species previews do not overlap their names.
- The screen overlay stays inside the illustrated pink bezel.
- Mobile layouts do not create accidental horizontal page scrolling.
- Focus rings are visible and not clipped.

Do not rely only on a successful TypeScript build for visual changes.

## Common pitfalls

### Save regression

Adding a required `PetState` field without a `createPet()` default can break old saves. Always update both.

### Selection-time hatching

If `advanceSecond()` or `simulateOffline()` ignores `screen === 'select'`, an egg can age or hatch before the player chooses a family.

### Atlas damage

Aggressive chroma-key soft mattes can remove pastel parts of a sprite. Inspect final alpha output visually.

### Wrong atlas crop

Changing background size or atlas order can make one stage display another. Test multiple stages, not only the baby preview.

### Device drift

The cozy PNG contains transparent padding. Center the wrapper, not the visible egg silhouette by eye. Oversized grid items can drift; the current narrow layout uses flex centering intentionally.

### Button-label drift

Transparent hotspot coordinates and browser-default button baselines are unreliable. Keep explicit proportional positions and grid centering.

### Invisible retro toggle

The generic `.topbar-actions button:hover` rule can override retro colors. Keep the more specific retro hover/focus rule.

### Stale closure input bugs

Keyboard actions depend on current screen and selection state. Review callback dependencies whenever `press()` changes.

### Offline performance

Offline simulation iterates seconds. Preserve the 72-hour cap and avoid unnecessary work while paused, dead, or selecting a species.

## Documentation expectations

Update `README.md` when changing:

- install or run commands;
- controls;
- visual modes;
- available species;
- player-visible mechanics;
- asset organization.

Update this `AGENTS.md` when changing architectural contracts, save keys, atlas layout, calibrated device geometry, or verification requirements.

## Git and workspace hygiene

- Preserve unrelated user changes.
- Inspect `git status` before and after work.
- Do not use destructive reset/checkout commands to clean the workspace.
- Do not commit, stage, push, or create branches unless requested.
- Generated build output is verification material, not source; remove it if it is ignored and not needed for handoff.

## Definition of done

A change is complete only when:

- the requested behavior works in both visual modes or the task explicitly scopes one mode;
- A/B/C keyboard behavior still works;
- save/reload behavior is correct;
- `npm run build` succeeds;
- relevant desktop and mobile layouts were visually checked;
- there are no browser console/page errors in the tested flow;
- new raster assets live in `public/assets/` and were inspected after transparency processing;
- documentation reflects any changed contract;
- the final response states what changed and what was verified.
