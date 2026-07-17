# AGENTS.md

## Scope

This file applies to the entire repository.

This project is a Russian-language browser Tamagotchi built with Vite, React, and TypeScript. The user-facing experience is the illustrated cozy root sanctuary.

Legacy retro-mode components and styles remain in the repository but are intentionally hidden from users. Ignore retro mode during normal feature work: do not expose, update, preserve, or verify it unless a task explicitly asks to restore or change it. New features only need a cozy-mode presentation.

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
│       ├── root-cradle-shell-v2.webp
│       ├── root-button-caps-v2.webp
│       ├── ritual-token-atlas-v2.webp
│       ├── pet-atlas-mandrake.png
│       ├── pet-atlas-mandrake-sleep.png
│       ├── pet-idle-mandrake-young-v1.webp
│       ├── pet-idle-mandrake-mature-v1.webp
│       └── favicon-mandrake.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── persistence.ts
│   │   └── tabPresentation.ts
│   ├── components/
│   │   ├── device/
│   │   │   ├── screens/
│   │   │   ├── DeviceScreen.tsx
│   │   │   ├── RetroDevice.tsx
│   │   │   └── types.ts
│   │   ├── layout/
│   │   └── visuals/
│   ├── hooks/
│   │   ├── useAppDialog.ts
│   │   ├── useGameActions.ts
│   │   └── usePetRuntime.ts
│   ├── game.ts
│   ├── mandrakeCopy.ts
│   ├── styles.css
│   └── vite-env.d.ts
├── tsconfig*.json
└── vite.config.ts
```

### File responsibilities

- `src/game.ts` owns serializable simulation types, constants, default state, evolution, one-second simulation, offline progress, and stable game metadata.
- `src/App.tsx` is the thin application composition layer that connects runtime, actions, layouts, devices, and dialogs.
- `src/app/` owns persistence keys and migration/loading helpers plus browser-tab title/favicon presentation.
- `src/hooks/` owns the pet runtime lifecycle, persistence wiring, audio feedback, the central A/B/C input mapping, gameplay actions, and dialog orchestration.
- `src/components/device/` owns the screen router and individual device screens. `RetroDevice.tsx` is dormant legacy code outside normal maintenance scope.
- `src/components/layout/` owns the top bar, cozy three-column layout, and accessible application dialog.
- `src/components/visuals/` owns meters, cozy atlas rendering, and ritual icons. Retro pixel matrices/rendering are dormant legacy code.
- `src/mandrakeCopy.ts` owns the Russian character voice, action labels, care status text, and caretaker hints.
- `src/styles.css` owns the active cozy visual system, device geometry, responsive behavior, animation, and interaction states. Imported retro styles are dormant legacy code.
- `public/assets/` contains the cozy-mode raster assets.
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
4. Add player actions in `src/hooks/useGameActions.ts`.
5. Add the cozy-mode display treatment.
6. Verify old saves still load through the default-state merge.

### Persistence boundary

Current keys:

```ts
const SAVE_KEY = 'lumi-pocket-pet-v3';
const ONBOARDING_KEY = 'lumi-onboarding-seen-v1';
```

Important invariants:

- The legacy `lumi-visual-mode` preference is ignored; the application always renders the cozy sanctuary.
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

Screen-specific behavior belongs in the central `press()` mapping in `src/hooks/useGameActions.ts`. Avoid scattering global key listeners across components.

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

Optional awake idle atlases use an exact 4×3 grid. Columns are the four successive idle frames. `young` rows are baby, child, and teen; `mature` rows are good adult, grumpy adult, and elder. The runtime uses `background-size: 400% 300%` while an idle gesture is active. Egg, hatchling, sleeping, and ghost/dead presentation continue to use the main or sleep 3×3 atlas.

The runtime uses `background-size: 300% 300%` and column/row background positions. Changing atlas dimensions, padding, or order requires updating the renderer and testing every stage.

The selection screen intentionally zooms previews with `background-size: 340% 340%`. This is presentation-only and must not change the main pet crop.

### Adding a species

When adding another family:

1. Extend `SpeciesId`.
2. Append an entry to `SPECIES`; do not reorder existing entries casually.
3. Add a project-local 3×3 cozy atlas under `public/assets/`.
4. Check egg, baby, adult, elder, and ghost crops.
5. Verify A/B selection, direct click, and save/reload in the cozy sanctuary.
6. Update `README.md` and this file if the registry or atlas contract changes.

## Visual contract

### Cozy sanctuary

Cozy mode is a root sanctuary composed from generated WebP art and flexible DOM interaction:

- `cozy-room-root-burrow.webp` is the page background; `cozy-room-grunewalda.webp` is the preserved previous background;
- `root-cradle-shell-v2.webp` is the transparent illustrated root cradle around the live screen;
- `root-button-caps-v2.webp` and `ritual-token-atlas-v2.webp` are calibrated sprite atlases for physical controls and care rituals;
- the header and both side panels are CSS surfaces so their DOM content remains correctly inset at every aspect ratio;
- `.device-screen` is the real interactive living hollow inside the cradle;
- A/B/C are real bone-and-amber DOM buttons on the lower root branch;
- the left panel is the living-root atlas and the right panel is a rack of care rituals;
- panels move below the cradle on narrow layouts.

All labels and gameplay information remain DOM content. CSS owns the header, side panels, responsive geometry, focus, and lightweight atmosphere, but must not redraw the main cozy cradle or replace its calibrated WebP art with generic gradients. `device.webp` and `action-atlas.webp` are retained as legacy project assets but are not used by the current cozy shell.

### Cozy cradle calibration

The illustrated cradle uses proportional hotspots matched to `root-cradle-shell-v2.webp`. Treat these values as calibrated:

```css
.device-screen {
  left: 21.8%;
  top: 25%;
  width: 56.2%;
  height: 37.2%;
}

.device-key {
  top: 72.2%;
  width: 14.4%;
}
.key-a {
  left: 19.9%;
}
.key-b {
  left: 42.8%;
}
.key-c {
  left: 65.1%;
}
```

A/B/C labels are centered with `display: grid; place-items: center`. Small action descriptions stay in the external `.key-hint` row. At widths up to 760px the cradle uses `min(100%, 530px)`; at widths up to 520px it fills its safe content width without intentional viewport overflow.

### Species selection spacing

The cozy atlas has generous transparent padding inside each cell. Selection previews therefore use a zoomed background and a negative top margin. Preserve a visible gap between the creature and its text label. Any change to `.species-grid .pet-sprite` must be checked at 609×721 and 390×844.

## Styling conventions

- Use the existing CSS variables before inventing isolated colors.
- Cozy UI uses Manrope and Press Start 2P.
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

CSS is appropriate for layout, panels, borders, and meters. Cozy illustrative subjects should remain image assets.

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
- `1100×850`: transitional cozy layout;
- `609×721`: narrow cozy device calibration and species selection;
- `390×844`: mobile layout, header wrapping, and cozy controls.

### Core smoke flow

Use `?fast=1` where appropriate:

1. Open a fresh session and confirm species selection appears.
2. Cycle selection with A and confirm with B.
3. Reload and confirm the selected species/name persists.
4. Wait for hatching in fast mode.
5. Open menu with A.
6. Feed with B and confirm hunger changes.
7. Open and cancel the mini-game.
8. Toggle pause and confirm stats stop changing.
9. Verify no browser console or page errors.

### Visual assertions

- Cozy A/B/C labels remain centered inside their bone-and-amber buttons.
- Cozy cradle remains horizontally centered without creating viewport overflow.
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

### Stale closure input bugs

Keyboard actions depend on current screen and selection state. Review callback dependencies whenever `press()` changes.

### Offline performance

Offline simulation iterates seconds. Preserve the 72-hour cap and avoid unnecessary work while paused, dead, or selecting a species.

## Documentation expectations

Update `README.md` when changing:

- install or run commands;
- controls;
- visual presentation;
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

- the requested behavior works in the cozy sanctuary; dormant retro mode is ignored unless explicitly requested;
- A/B/C keyboard behavior still works;
- save/reload behavior is correct;
- `npm run build` succeeds;
- relevant desktop and mobile layouts were visually checked;
- there are no browser console/page errors in the tested flow;
- new raster assets live in `public/assets/` and were inspected after transparency processing;
- documentation reflects any changed contract;
- the final response states what changed and what was verified.
