# M3C release candidate

GordosHex is an independent, MIT-licensed project by
[Dos Gordos Juegan](https://www.youtube.com/@DosGordosJuegan), with
[source on GitHub](https://github.com/dosgordosjuegan/gordoshex). The browser uses
native TypeScript, SVG, HTML and CSS; no framework or runtime dependency is added.
The original hexagonal favicon and battlefield graphics are project assets,
without publisher artwork, logos or endorsement. The Memoir editor supports the
accepted refreshed-2025 subset; it never certifies attack legality.

## English quick start

```sh
nvm use
npm ci
npm run dev -- --host 127.0.0.1
```

Open Vite's local URL. Choose English or Español in the header. Select a contact
policy or the Memoir '44 2025 supported subset. Each mode retains its separate
session board. Generate a board, choose an editing mode and place/select an
observer. Memoir requires a supported observing unit. Click/tap to edit or inspect;
drag to pan. Pick a target to inspect independent range, physical LOS, all blockers
and exact evidence. Green Memoir checks mean range and LOS requirements are met,
including artillery's marked exemption; physical LOS and engine visibility stay
separate. No green check certifies a legal attack.

On phones, the board appears first. The sticky shortcuts reach the board, palette,
inspection and tools; board generation is a native collapsible group (initially
closed on a mobile-sized first load). Palette tools remain available without hover.
Use Fit board, +/− or the wheel for framing; coordinate labels are optional.
Reloading discards boards. Only an explicit language preference is stored locally.

## Instrucciones rápidas en español

Ejecuta los comandos anteriores y abre la dirección local que muestra Vite.
Selecciona **Español** en el encabezado. Elige una política genérica o el subconjunto
compatible de **Memoir '44 2025**; cada modo conserva su propio tablero durante la
sesión. Genera el tablero, elige un modo de edición y coloca o selecciona un
observador. En Memoir, el observador debe tener una unidad compatible.

Haz clic o toca para editar e inspeccionar; arrastra para desplazar. Selecciona un
objetivo para consultar el alcance, la línea de visión física, las obstrucciones y
la evidencia exacta. La marca verde de Memoir indica que se cumplen los requisitos
de alcance y línea de visión, incluida la exención de Artillería señalada con A.
La línea de visión física y la visibilidad del motor se conservan por separado.
**Ninguna marca certifica un ataque legal.**

En el celular, los accesos superiores llevan al tablero, la paleta, la inspección y
las herramientas. Abre el grupo **Tablero** en Herramientas para generar otro.
Usa **Ajustar tablero**, +/− o la rueda para cambiar la vista. Las coordenadas son
opcionales. Recargar borra los tableros; solo se guarda la preferencia de idioma.

## Language architecture and terminology

`web/messages/en.ts`, `es.ts`, `memoir-en.ts` and `memoir-es.ts` have exact key and
placeholder parity. Spanish dictionaries are checked against English keys by
TypeScript and tests. Dynamic entity, contact, status, error and semantic keys are
covered. Identifiers, canonical integer coordinates, rational parameters and raw
records in explicitly technical details remain unchanged.

`web/i18n.ts` chooses the first supported `navigator.languages` entry, falling back
to English. A valid explicit `gordoshex.language` localStorage value takes priority.
Only `en` or `es` is stored; there are no saved boards, accounts or scenario data.
Storage denial does not prevent language switching. The document `lang` and title,
normal prose, controls, accessibility labels and dynamic evidence are localized.
Application-owned shell markers are bound to existing text/attribute nodes once;
switches replace their text without reconstructing forms or the SVG root. Dynamic
panels reformat the existing exact result. The mathematical snapshot, camera,
selections and evaluation count are unchanged, including during an active batch.

Terminology was checked against the publisher-hosted
[Spanish refreshed rulebook, M44_REFRESH_RULES_ES_LD.pdf](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2024/09/M44_REFRESH_RULES_ES_LD.pdf),
accessed 2026-11-27: printed p. 8 (line of sight), pp. 12–13 (units), pp. 14–20
(terrain/installations). The document's publication date is not stated; the URL
folder is not treated as a publication date. No game semantics are changed here.

User-review vocabulary choices:

| Engine entity                | Interface Spanish                   | Publisher terminology / rationale                                        |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| LOS                          | Línea de visión                     | Publisher wording                                                        |
| Infantry / Armor / Artillery | Infantería / Blindados / Artillería | Publisher wording                                                        |
| Allies / Axis                | Aliados / Eje                       | Publisher wording; original A/X glyphs retained and explained            |
| Hedgerow / Bunker            | Setos / Búnker                      | Publisher wording                                                        |
| Hedgehog                     | Erizo antitanque                    | User-preferred Latin American wording; publisher uses Defensas anticarro |
| Wire                         | Alambre de púas                     | User-preferred wording; publisher uses Alambradas                        |
| Sandbags                     | Sacos de arena                      | User-preferred wording; publisher uses Sacos terreros                    |
| Sea wall                     | Malecón                             | Publisher wording                                                        |
| Town / cell                  | Pueblo / casilla                    | Concise UI terms; the exact hexagonal/axial model is unchanged           |

These are terminology choices for review, not unresolved rule decisions. The
approved adapter specification remains authoritative. Geometry and ruleset modules
do not import language resources.

## Keyboard, focus and accessibility

- One sequential board tab stop: the SVG root. Hundreds of cell/edge buttons use
  `tabindex=-1` and remain programmatically focusable with exact identities.
- **Home/End** select the first/last rendered identity; **Page Down/Page Up** move
  through existing cells, absent frontier cells and displayed shared edges.
  **Ctrl + arrows** move to axial neighbors when rendered. **Enter/Space** activate
  the focused identity using the current mode. **Tab** leaves the board.
- Bare arrows retain panning; +/− zoom. Keyboard navigation brings offscreen
  identities into the camera. The coordinate form directly accesses exact signed
  coordinates, including disconnected regions.
- A skip link and native navigation links provide direct workspace access. Board
  controls precede editing controls in document order; CSS retains the desktop
  three-column layout and board-first mobile presentation.
- Dynamic rendering restores logical board/edge, palette and content-control focus.
  Stable entity keys survive ordering; deleted identities fall back to the board.
  Native forms and disclosure groups retain their nodes/values. Expanded inspection
  details remain open across formatting updates such as language switches.
- Start/completion use a separate polite live status. Visual progress is not spoken
  on every chunk. Errors remain alerts; diagnostic states are never ordinary
  blocked/visible verdicts. Cell labels name exact coordinates, states and contents.
- Status symbols, outlined blockers, affiliation letters and accessible descriptions
  accompany color. Focus indicators use dark amber on light surfaces and a lighter
  header outline. Browser checks measure text/legend contrast against backgrounds;
  terrain illustrations are not used as the sole status signal.
- Mobile toolbar, palette and form controls target at least 44 CSS pixels in height.
  Board-cell hit areas follow zoom; zoom in or use the coordinate form for precise
  editing on a small screen. Native touch taps need
  no hover; the existing drag threshold/capture/cancellation safeguards remain.
  Desktop side controls scroll independently so painting does not move the board
  out of view. The board remains responsive in portrait and landscape.

This is verified behavior, **not a claim of WCAG compliance**. Manual screen-reader
sessions, all assistive technologies, physical touch devices, low-vision workflows
and every browser/OS combination remain unverified. Playwright WebKit is not a
claim of exhaustive Safari/iOS testing. Firefox touch emulation is unavailable in
Playwright; its keyboard/mouse/mobile-layout workflows are still tested.

## Cooperative evaluation and limits

The browser retains 150 ms rapid-edit debouncing and exact aggregate admission.
`web/evaluation.ts` shares the same generator of admitted per-target work between
its synchronous reference function and the cooperative browser path. Every target
still calls the public visibility API with normal board/ruleset validation.
No validated-snapshot shortcut, worker, result cache or geometry optimization exists.

Each chunk runs until **8 targets or 8 ms**, whichever comes first, then yields
through a native zero-delay timer. A single exact query is indivisible and may
exceed 8 ms; this is not a hard frame deadline. The UI copies/freezes its input
snapshot and range, retaining the immutable board. Every target/yield/progress
boundary checks its revision. Superseded work returns no result and cannot publish
an error, progress update or completed map over newer state.

The result map stays private until all targets finish. While pending/running,
previous verdicts are removed and progress is explicit. Only a complete current
map is published. Range, geometry failures and ruleset-invalid sightlines retain
all accepted distinctions. Language, target, hover and camera changes do not
restart evaluation; new mathematical inputs cancel and debounce a fresh pass.

All existing limits remain: 512 cells/targets, dimensions ≤64, aggregate candidates
≤100,000, 1000n per sightline, 16 elements/cell, 8 shared-edge features, 128-character
integer inputs and safe relative display spans. Limits are admission bounds, not
latency guarantees. Atomic SVG/inspection rendering and an individual sightline
can still pause interaction. See the [performance comparison](m3c-performance.md)
for complete-work checksums, validation profiling and responsiveness measurements.

## Verification and screenshots

```sh
npm run check
npm run build:app
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

Chromium runs all retained tests. Firefox and WebKit run the new bilingual release
workflows. Resource/error propagation, cancellation, exact map equivalence,
translation parity, preference handling, state-preserving language switches,
keyboard/focus, mobile layouts, contrast and supported touch contexts are tested.
No cross-machine performance gates are introduced.

Actual Chromium captures: [English desktop](screenshots/m3c-en-desktop.png),
[English mobile](screenshots/m3c-en-mobile.png),
[Spanish desktop](screenshots/m3c-es-desktop.png),
[Spanish mobile](screenshots/m3c-es-mobile.png). Screenshots supplement functional
checks. Boards remain session-only, and there is no import/export UI, backend,
deployment configuration, new game mechanic, legacy edition or expansion support.
