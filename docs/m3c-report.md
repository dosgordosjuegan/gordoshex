# M3C completion evidence

PR #7 was verified at reviewed head
`5db5561de3ded70aea06107cbc3ba411cb3c6bd7`, with both CI checks successful,
and merged under this task's authorization. Local main was synchronized to the
merge, the merged branch cleaned up, and `feature/release-polish` created.
This milestone's new PR remains open for review; it must not be merged yet.

## Implementation decisions

- **278 keys in each language**, with exact English/Spanish key and placeholder
  parity. Spanish resources cover controls, palettes, supported entities, errors,
  resource feedback, semantic arguments/evidence, accessibility and disclaimers.
  Browser preferences choose the first supported language unless a valid explicit
  preference exists. Only `gordoshex.language` is persisted; no scenario data is.
- Language changes update existing shell text/attribute nodes and reformat dynamic
  panels. Board data, selections, registry IDs/configuration, complete result maps,
  evaluation count and camera are unchanged. The document title and language update.
  Storage denial is handled without disabling language switching.
- The board has one sequential tab stop. Exact identities remain available through
  Home/End, Page Up/Down, Ctrl + axial arrows, the coordinate form and Enter/Space.
  Bare arrows retain panning. Stable control identities restore focus across
  rendering; reordering an element to a boundary moves focus to an enabled action
  for that same element when its previous action becomes disabled.
- Native controls/disclosures, a skip link, separate start/completion announcements,
  explicit progress and alert errors support keyboard/assistive use. Status symbols,
  exact cell descriptions, outlines and affiliation letters accompany color.
- The board comes first in document order and on mobile; CSS preserves desktop
  columns. Desktop controls scroll independently. Mobile has sticky workspace
  shortcuts, a collapsible generation group and 44-pixel control targets. Portrait
  360 × 740 / 390 × 844 and landscape 844 × 390 are exercised without page overflow.
- The original terrain/installation graphics are preserved. An original geometric
  favicon, restrained spacing, bilingual project attribution and links identify
  GordosHex as an independent open-source project by Dos Gordos Juegan.
- The browser evaluates immutable snapshots in bounded **8-target / 8-ms** chunks,
  yielding with a native timer. Synchronous and cooperative paths share resource
  preflight and per-target work. Every query still invokes the public visibility
  API and its ordinary validation. Maps stay private until complete; revision
  guards discard superseded progress, results and errors. Debouncing remains 150 ms.

No production file under `src/` changes. There is no new dependency, ruleset,
mathematical predicate, scenario feature, validated-snapshot API, cache, worker,
frontend framework or deployment configuration. Independent range/physical LOS,
engine visibility, Memoir's artillery presentation and every accepted resource
limit remain unchanged.

## Verification

Pinned Node 22.13.1 / npm 10.9.2 and existing locked tooling:

- `npm run check`: **236 tests / 17 files** pass, including all retained geometry,
  board, ruleset, independent oracle, property and UI tests; strict type checking,
  ESLint, Prettier and standalone ESM/declaration build pass.
- `npm run build:app`: production browser build passes.
- `npm run test:browser`: **61 tests pass; 2 explicitly unsupported Firefox touch
  cases skipped**. Chromium runs every retained workflow plus bilingual release
  coverage. Firefox and WebKit run the bilingual release cases. The stack-boundary
  focus regression is verified in all three engines.
- Both languages verify exact board/result/camera preservation on switching,
  explicit preference persistence, localized obstruction/error text, generic and
  Memoir editing, complete blocker evidence, artillery presentation, keyboard
  navigation/focus, responsive layouts, cancellation and atomic latest-map
  publication during a real 468-cell evaluation.
- Visible HTML text and legend contrast is measured against computed backgrounds
  with a 4.5:1 threshold. Touch contexts verify single activation per tap in
  Chromium/WebKit; retained Chromium tests cover safe drag/capture/cancellation.
  These checks do not constitute WCAG compliance or physical-device certification.
- Cooperative unit comparisons preserve the complete exact result maps. The
  performance protocols additionally compare full-map hashes against the accepted
  pre-M3C workloads, including the separately instrumented validation runs.
- Existing and new performance protocols are run sequentially, retaining inputs,
  complete-work hashes, samples, source identities and runtime/hardware details.
  Documentation links and source fingerprints are verified before commit.

Actual browser versions are pinned by Playwright 1.65.1: Chromium 159.0.8154.6,
Firefox 159.0, WebKit 27.2. WebKit needed host libraries on this machine; the missing
Ubuntu packages were extracted under `/tmp` and explicitly loaded for verification
because its bundled launcher replaces the normal search path. No system package
or application dependency was changed. The temporary packages were
`libevent-2.1-7t64`, `libmanette-0.2-0` and its `libhidapi-hidraw0` dependency. CI uses Playwright's normal
`install --with-deps chromium firefox webkit` prerequisite installation.

## Performance evidence

The [M3C comparison and validation profile](m3c-performance.md) distinguishes
quiescent completion cost from continuous 16-ms pan/zoom stress. It reports
117/468-cell full populated workloads, total completion, input opportunities and
repeated full-board validation. This distinction matters: handling pan/zoom during
calculation adds real rendering work that synchronous calculation postpones.
Stress timings must not be presented as isolated scheduling overhead.

Quiescent 117-cell completion was **186.6 → 278.6 ms** median; 468 cells were
**877.7 → 1614.0 ms**. Under continuous interaction, the median maximum evaluation
probe gap fell **126.5 → 38.0 ms** and **718.5 → 60.9 ms**, respectively. Stress
completion includes the extra pan/zoom rendering work (468-cell cooperative median
2529.9 ms, p95 5382.2 ms). Full-board validation contributed **28.4% / 45.0%** of
profiled query time at 117/468 cells. These are observations on the recorded host,
not latency guarantees or isolated hardware-input measurements.

All exact mathematical maps remain identical. Cooperative scheduling improves
opportunities to process input; it does not reduce mathematical work or validation.
Individual queries and atomic SVG/inspection rendering remain synchronous, and the
larger workloads remain noticeable. No new resource limit or unreviewed
optimization is recommended on the basis of these measurements.

## Documentation and limitations

[Release guide in English and Spanish](release-polish.md),
[current application architecture](interactive-app.md),
[Memoir editor](memoir-editor.md), and README are updated. The guide records the
publisher-hosted Spanish terminology source and user-preferred Latin American
choices for Erizo antitanque, Alambre de púas and Sacos de arena. Those wording
choices are available for user review; they do not change game rules.

Actual polished Chromium screenshots: [English desktop](screenshots/m3c-en-desktop.png),
[English mobile](screenshots/m3c-en-mobile.png),
[Spanish desktop](screenshots/m3c-es-desktop.png),
[Spanish mobile](screenshots/m3c-es-mobile.png).

No substantive mathematical or architectural deviation was needed. Remaining
limits: supported 2025 subset only; in-memory boards; individual-query/final-render
pauses; no memory-ceiling claim; unverified physical devices, manual screen-reader
sessions and broader browser/OS/assistive combinations. Firefox touch emulation is
unavailable in Playwright. WebKit verification is not exhaustive Safari/iOS
coverage. There is no WCAG compliance, official endorsement or attack-legality
claim. Expansions, legacy rules, scenario UI, backend and deployment remain outside
this milestone.
