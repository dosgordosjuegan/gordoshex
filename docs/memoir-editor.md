# M3B Memoir '44 refreshed 2025 graphical editor

Choose **Memoir '44 2025 · supported subset** in the ruleset selector. The three
generic policies remain available. This editor exposes `memoir44.refresh2025`,
version `"1"`, through the existing public registry and visibility API. It does
not add game rules, attack legality, legacy rules, expansions or scenario overrides.
The [accepted adapter specification](rulesets/memoir44-refresh2025.md) remains
authoritative. There is no official endorsement or copied game artwork.

## Working boards and editing

Generic policies share one working board. Memoir uses a separate working board.
Switching modes restores the corresponding immutable snapshot, observer, target,
last valid range, editing mode and palette choice. It never converts generic
obstacles into game entities, removes incompatible data, or treats Memoir elements
as generic obstacles. Visibility is invalidated and recalculated after switching.
Zoom/pan framing fits the restored board; it is not a saved camera. Invalid in-progress
range text is replaced with that workspace's last valid range. All state is session
memory; reloading discards edits. There is no import/export UI.

The first Memoir board is a generic 13 × 9 staggered-row example, with Allied
Infantry at `(0,0)`, Forest at `(1,0)` and target `(2,0)`. It is not a reproduction
of the official battlefield. Regenerating a board creates empty cells; place a unit
at the observer or choose an occupied cell before evaluating a valid Memoir query.

Use the three palette tabs:

- **Terrain:** Open, Forest, Hedgerow, Town, Church, Hill, River, Ocean, Beach, Bridge.
  Choose **Paint …**, then click cells. Terrain replaces only the base-terrain role.
  **Clear terrain to implicit Open** removes that role; units/installations remain.
- **Units:** standard Infantry, Armor, Artillery; choose Allies or Axis. Placement
  replaces only the unit role. **Remove unit only** preserves other layers.
- **Installations:** Bunker, Hedgehog, Sandbags, Wire, Sea wall. Each has a placement
  and individual erase tool; installing one never removes another type.

The contents panel lists ordered entities with stable IDs and individual removal
buttons. Repainting an identical role is a no-op. A changed role gets a new ID at
its existing stack position; unchanged entities keep their IDs/order. All edits
use the public immutable board APIs and adapter schema validation. One terrain,
one unit and unique installation types per cell remain required. Bridge is the
supported transparent base-cell representation; it is not a second base layered
over River. This composition does not validate legal deployment or movement.

**Use this unit as observer** is available for a supported unit in the inspected
cell. The observer interaction mode also selects cells directly. Removing the
observing unit retains the selected coordinate and shows the adapter's missing-unit
error until a unit is placed or another observer is selected. Removing the cell
clears the coordinate using the existing selection-cleanup contract. Replacing the
unit automatically updates intrinsic range and LOS-requirement presentation.
Empty, friendly and self targets are inspection choices, not certified attacks.

Shared-edge editing is hidden and rejected in Memoir mode. The generic workspace's
edge features remain intact. No unsupported payload/terrain/unit editor is exposed.
An invalid or unsupported result remains an explicit error, not a visibility verdict.

## Original graphics and interaction

Terrain uses original paths: trees, hedge rows, roofs/church steeple, hill contours,
water waves, shore marks and bridge planks. Installations have simple independent
symbols sized to the available cell area: a lone installation is large;
layered installations occupy separate positions around the unit. All five types
remain separate even in a fully stacked cell. Open terrain has no decorative grass. Units use conventional rectangular military
symbols: crossed lines for Infantry, oval for Armor, dot for Artillery. Affiliations
have blue/rust styling plus **A/X** labels, with complete accessible cell labels.
These are generic original symbols, not official tiles, badges or publisher assets.

Terrain fill and shapes remain beneath status discs and outlines; unit and
installation symbols remain separate. Observer/target/blocker outlines, coordinate
labels and status symbols remain available. **Coordinate labels** toggles exact
coordinate text without recalculating. Labels default off in Memoir and on in
generic mode; each workspace retains its preference. Cell identities and accessible
descriptions remain exact when labels are hidden. Units are larger in sparse cells;
dense stacks reduce their size to keep installations and status indicators separate. Both orientations use the accepted exact
rebase/display boundary. Pointing/gestures still resolve exact lattice identities.

All M3A usability corrections remain: drag anywhere with left/middle button,
Space + drag or touch; a sticky 5-pixel threshold prevents editing on drag. Wheel
zoom, arrow panning, Enter/Space activation, capture loss/cancellation and blur
handling are retained. Palette changes, target selection and display changes do
not recalculate; mathematical edits use the same 150 ms debounce/revision guards.

## Range, physical LOS and artillery

The inspector reads the existing adapter's structured semantic facts to show:
exact lattice distance, observing unit, intrinsic maximum, additional user cap,
effective maximum, independent range/physical LOS and whether LOS is required for
ordinary attacks. The frontend does not derive unit maxima, filter blockers,
compare elevation, classify contacts or pair sides.

In Memoir mode, the unlimited checkbox reads **No additional range cap**. It never
means unlimited weapon range. The adapter still supplies standard maxima 3/3/6
and applies any inclusive additional cap. Memoir board colors show satisfaction of
**range and LOS requirements**, separately from physical visibility:

- Green check: in range, with clear physical LOS or the adapter's official LOS exemption.
- Red cross: in range, physically blocked, and LOS required.
- Gray: out of range, without a prominent exemption badge.
- Invalid/failed/unsupported results: distinct diagnostic states, never green/red verdicts.

In-range, physically blocked artillery targets carry a purple **A** exemption
annotation alongside the green check. The inspector still identifies intervening
units/terrain, reports blocked physical LOS, and explains the exemption separately,
including when out of range. These facts come from adapter-owned semantic data;
the frontend does not hardcode unit ranges or game predicates. The physical LOS verdict and `visibility.visible` remain
unchanged: blocked artillery is still physically blocked and has `visible: false`.
A green check or exemption is not a legal-attack verdict. This user-approved
Memoir presentation refines the original physical-visibility color projection;
generic colors and every engine result contract remain unchanged.

Normal explanations cover strict interior blockers, global opposite-side boundary
pairs, isolated-vertex modeling convention, endpoint/elevation/bare-hill exemptions,
absent-cell invalidity and artillery. Vertex and arbitrary-board absence behavior
are labeled as GordosHex conventions, not publisher rulings. Blocker descriptions
identify terrain, unit or installation and coordinate. Exact rational intervals,
side, full evidence and simultaneous events remain in expandable sections. Raw
semantic codes are only in explicitly labeled technical details, not normal prose.
English strings are in `web/messages/memoir-en.ts`, ready for M3C translation.

## Implementation boundary

`web/workspaces.ts` owns the two session snapshots. `web/memoir-editing.ts` handles
role replacement with public board edits and `memoir44Cell`/board validation.
`web/memoir-controls.ts` owns palettes and profile control labels.
`web/memoir-svg.ts` and `web/svg.ts` draw original glyphs.
`web/memoir-presentation.ts` projects adapter explanation data, including the
artillery annotation and requirement-status projection. `web/memoir-layout.ts`
keeps visual glyph placements separate from mathematical geometry. Existing state, evaluation, rendering, formatting and main
wiring select these UI capabilities. No production file under `src/` is changed.
No runtime/build dependency, cache, worker or optimized geometry traversal is added.

## Verification, performance and limits

All previous library and browser tests are retained. New tests cover safe mode
switching, every supported palette type, independent immutable layers, no-op/stable
identity, removal, observer/range behavior, invalid/unsupported results, human
explanations, artillery and real browser workflows/gestures. The manual fixture
uses observer `(7,2)`, Forest `(7,3)`, Town `(5,5)` and targets `(5,6)` / `(4,8)`.
Physical LOS is blocked for both. Distances are **4 and 6**: both exceed Infantry's
maximum; both fit Artillery's uncapped inclusive maximum of 6.

Existing limits remain 512 cells/targets, dimensions ≤64, aggregate candidates
≤100,000, 1000n per sightline, 16 elements/cell, 8 edge features in generic mode,
128-character integer input and safe relative display spans. Resource failures
retain explicit diagnostics. The full synchronous pass can still pause interaction;
see [M3B performance](m3b-performance.md) for populated 117/468-cell measurements.
Repeated full-board schema validation remains inside the accepted API; no speculative
validation cache is introduced. Cooperative yielding is the smallest next UI
improvement to measure if the pause is unacceptable; reducing validation cost
requires a separately reviewed validated-snapshot contract.

Screenshots: [desktop](screenshots/m3b-desktop.png), [mobile](screenshots/m3b-mobile.png),
[artillery regression](screenshots/m3b-artillery-acceptance.png),
[populated pointy](screenshots/m3b-acceptance-pointy.png),
[populated flat](screenshots/m3b-acceptance-flat.png),
[populated mobile](screenshots/m3b-acceptance-mobile.png).
These are actual Chromium application captures, not substitutes for functional tests.
Chromium desktop/mobile viewport is verified; full physical-device and broader
browser/assistive-technology coverage remains M3C. Lakes, terrain variants, special
units, legacy rules, expansions, scenario UI, legal attacks and deployment remain
unsupported. This is not exhaustive Memoir '44 base-game compatibility.

## Manual acceptance regression

Artillery observer `(2,4)`, intervening Axis Armor `(1,4)`, target `(0,4)`,
all cells present, no additional cap: distance **2**, range satisfied, physical LOS
**blocked**, LOS not required. The board shows a green check plus **A** while the
engine keeps `visible: false`. Replacing the observer with Infantry shows red.
Tests also cover terrain obstruction, intrinsic/user-cap boundaries, invalidity,
resource failures, unchanged generic projections, label toggling without evaluation,
and glyph containment/separation in both orientations.
