# Memoir '44 — researched rules and approved refreshed-2025 specification

Status: **M2B.2 implemented for review, 2026-11-26.** The selected profile is
`memoir44.refresh2025`, version `"1"`, configuration `{}`. Only the supported
base-core subset below is implemented. See the [adapter API](memoir44-refresh2025.md).
The accepted exact geometry and board contracts remain unchanged.

## Reading the evidence

- **O — official:** explicitly stated or illustrated in a verified publisher source.
- **D — deduction:** a logical or mathematical consequence with stated reasoning.
- **U — unresolved:** authoritative material inspected does not settle the case.
- **C — convention:** user-approved GordosHex modeling or calculator behavior,
  explicitly distinct from a publisher ruling.

Historical legacy findings are retained for edition comparison, not as active rules.
Approval of a convention does not resolve the corresponding official-rule ambiguity.

## Sources, editions and access record

All sources were checked on **2026-11-26**. Page references below are **printed page
numbers**, not necessarily the PDF viewer index. Sources are linked directly as well
as from the [publisher's official game/download page](https://www.daysofwonder.com/game/memoir44/).
No community discussion is used as authority for an expected rule outcome.

| ID  | Source and exact URL                                                                                                                                                                                                     | Version/date and inspected locations                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L   | [Original English rules, part 1](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2024/10/mm_rules_part1_en.pdf)                                                                                              | Publisher foreword May 2004; no numbered revision identified. Printed pp. 8–9 combat/LOS/range; 12–13 special units; 13–16 terrain/obstacles. 17 PDF pages, printed pages 1–17.                                                                                                                                                                                   |
| A   | [Publisher “Old Rules” archive](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2024/09/m44_old_rules.zip)                                                                                                   | Linked under Old Rules on the official page. Downloaded and inspected; its `mm_rules_part1_en.pdf` is byte-identical to L. Archive timestamps are not rule publication dates.                                                                                                                                                                                     |
| F   | [Official FAQ](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2025/04/M44_FAQ_v2_compressed.pdf)                                                                                                            | **v2.0, May 2013**, printed in the footer; 77 PDF pages. Contents states answers are official and checked by Richard Borg. Printed p. 2 LOS/half-hexes; pp. 5–10 base terrain; p. 7 hills; p. 8 bridges; p. 29 standard units; pp. 50–57 command-card topics. PDF page for printed p. n is n+3 in this copy, for Arabic-numbered pages.                           |
| R   | [Refreshed English rulebook](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2024/09/M44_REFRESH_RULES_EN_LD.pdf)                                                                                            | Copyright **2025**, no separately printed numbered revision identified; PDF creation metadata 2025-09-02. Printed pp. 7–9 attacks/LOS/range; 12–13 units; 14–20 terrain; **15 and 18 elevation**. 13 PDF pages, mostly facing-page spreads. Printed pp. 8–9 are PDF page 5; pp. 18–19 are PDF page 10.                                                            |
| Y   | [Asmodee USA, Memoir '44 Refresh](https://store.asmodee.com/collections/days-of-wonder/products/memoir-44-refresh)                                                                                                       | Official product listing explicitly identifies the **2025 edition**. Used to identify edition, not as a rules substitute.                                                                                                                                                                                                                                         |
| E   | [Spielworxx German-edition errata](https://www.spielworxx.de/app/download/14934867527/Memoir44_Errata_DE_2026_03_09.pdf?t=1793617572), via [publisher downloads](https://www.spielworxx.de/downloads-a-k/downloads-l-s/) | One page, dated **2026-03-09**. Sections: rulebook “Boden gewinnen und Vorrücken” p. 10; “Sandsäcke” p. 20; summary card “Truppen 1 – Standardeinheiten”. It addresses optional taking ground, sandbag protection and the artillery card's movement/attack wording. No LOS correction appears. Localized errata is not assumed to revise unrelated English rules. |
| X   | [Official Equipment Pack English/French rules](https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2024/06/730021-M44EP-Rules-ENFR.pdf)                                                                             | Layout dated 2012-06-08; PDF modification metadata in 2015 is not asserted as a rules revision. Printed p. 2, Artillery pieces / Heavy Anti-Tank Gun; p. 9, Specialists / Sniper. Downloaded and inspected locally; excluded expansion context only.                                                                                                              |

The current official download page links **both R and the older F**. This does not
make F's legacy elevation answer an amendment to R. R p. 18 expressly distinguishes
its terrain-height rule from the previous edition. The `/2024/09/` and `/2025/04/`
URL path components are hosting paths, not evidence of rule publication dates.
Likewise, F's compression/modification metadata in 2025 does not make it a 2025 FAQ.

Verification used PDF text extraction plus visual inspection of L p. 9, R pp. 8–9
and 18–19, and F p. 7. This matters because LOS examples and version footers are
visual evidence. Publisher PDFs and artwork are not copied into this repository.
Downloaded bytes had these SHA-256 fingerprints:

| Source                      | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| L, also English member of A | `2967cd0d2b248041d2857ba4bfa922f259974d1c539691d88565ee6ca35d85a8` |
| R                           | `12af03e45c15e160c546bbd2e783e3003d9beea349dd691310f080cab51be160` |
| F                           | `73dacc5079a36edc0ff016103ff2b70160af09c894c79a57cac676d951d34684` |
| A                           | `87cea55106e1d01b408f115ec385a802b923691360f576767e7aea0625daa8ff` |
| E                           | `75f8128b8116562d5507726b946e58922c7d167425e0201d5368758231bb5bc4` |
| X                           | `9751fe23605f8e939a667185919c12ae03567ded99f051b2de93c1e6caeeacc6` |

**Access limitations:** the old [official hills example, scenario 1096](https://www.daysofwonder.com/memoir44/en/editor/view/?id=1096),
linked by F p. 7, could not be retrieved through the research browser; the
`dowlegacy.daysofwonder.com` equivalent also failed. Old [FAQ](https://www.daysofwonder.com/memoir44/en/content/faq/)
and [card-compendium](https://dowlegacy.daysofwonder.com/memoir44/en/content/cards_compendium/)
endpoints were not retrievable either. This is an access limitation, not proof that
the material no longer exists. E was inaccessible through browser redirects but
was successfully downloaded and inspected from the publisher link. The official
English product downloads and targeted official-site errata searches did not yield
a separately verifiable English errata sheet. That is not a claim none exists.
The indexed [2015 Equipment Pack URL](https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2023/09/mm_equipment_rules_2015_en.pdf)
returned an HTML placeholder rather than the indexed PDF. X is the verified
alternative; the browser size limit required a local download. Card-specific
attack exceptions and the inaccessible hill diagrams need a separate verified
source pass before those cases are supported.

## Researched rules

### R01 — definition and intervening units

**O [L p. 9; R p. 8, Line of Sight]:** use hex centers. Intervening friendly and
enemy units obstruct, as do designated terrain/obstacles. **D:** affiliation does
not make an intervening unit transparent. Figure placement within a hex is not
an alternative ray endpoint.

**D:** a qualifying obstruction with a strict-interior cell intersection blocks
without needing another obstruction on the opposite side. This follows from the
general obstruction rule; the hexside exception addresses boundary-aligned rays.
A nonzero determinant side alone therefore says nothing about blocking.

### R02 — base terrain and obstacles

**O [L pp. 13–16, named terrain/obstacle entries]:** forests, hedgerows, towns and
bunkers obstruct; rivers, oceans, beaches, hedgehogs, wire and sandbags do not.
Hills require R07. **O [F p. 8, Bridges]:** bridges are normally transparent;
scenario instructions can override that. **O [R pp. 15–20]:** corresponding entries
remain, with R's elevation qualifications. R additionally catalogs churches, lakes
and named hill variations; do not assume its full terrain catalogue applies to L.
**O/D [F p. 9; R pp. 16–17, 20]:** base bluffs/cliffs use hill LOS, churches inherit
town LOS, and sea walls are LOS-transparent. **O [R p. 18, Lakes]:** multiple
contiguous lake cells have a distinct blocking condition; a river-tile appearance
is not enough to select their rule.

**D:** no movement prohibition, defense bonus or physical miniature silhouette
is by itself a LOS obstruction. In particular, impassable water need not be opaque.
**C:** open terrain is the implicit value of an existing cell without a terrain
entry; this is a storage convention, not permission to treat absent cells as open.

### R03 — origin and target

**O [L p. 9]:** target terrain is exempt. **O [R p. 8]:** both endpoint hexes'
terrain/obstacles are exempt. **D [L p. 13, forest turn example]:** the illustrated
unit can attack out of its forest after the entry-turn restriction has passed;
ordinary origin forest cannot make its outgoing line automatically blocked.

**C:** exclude the selected origin/target units from intervening-unit tests, while
still reading their terrain for elevation. Do not delete all endpoint metadata:
LOS exemptions do not remove other attack restrictions. Empty-target previews and
self-queries are approved calculator conventions under D08, not official attacks.

### R04 — positive-length hexside overlap

**O [L p. 9; R p. 9, text and three boundary diagrams]:** one obstructed side permits
LOS; obstructions on both sides can deny it. **D:** this cannot be implemented by
any of the three demonstration policies alone. “Interior plus edge” blocks a
single obstructed side; “interior only” misses the paired case.

**D:** use only otherwise eligible blockers when applying this rule: first apply
endpoint and edition/elevation exceptions, then classify their contacts. Closed
intervals and shared-edge IDs retain the evidence; no epsilon or side selection
is allowed.

### R05 — opposite sides at different positions

**O [L p. 9 and R p. 9, final town/forest boundary diagram]:** the separated opposite-
side example is blocked. **D:** eligible positive-length boundary obstructions need
not share the same edge or overlap in parameter t. Requiring `max(entry)<=min(exit)`
for an opposite-side pair would wrongly clear that example. Preserve all positive-
and negative-side candidates and their intervals; do not select one first blocker.

This conclusion is restricted to boundary-overlap obstructions. It does not settle
R06 or turn every left/right cell pair into a blocker.

### R06 — isolated vertex contact

**U:** neither the inspected LOS text nor the illustrated cases explicitly defines
a zero-length corner-only contact. The general “part of a hex” language suggests
inclusion, while the boundary exception does not precisely define singleton
incidence. No inspected official ruling names the mathematical vertex case.

**C, D02:** eligible isolated vertex contacts count as sided boundary obstructions.
A single side is clear; opposite sides block globally, even at different parameters.
This is the approved GordosHex convention, **not an official publisher ruling**.
Geometry and all exact singleton incidences remain unchanged.

### R07 — hills and elevation: incompatible edition profiles

**O [L p. 14; F p. 7, Hills]:** legacy play distinguishes a shared hill/plateau from
separate hill groups; ordinary obstructing terrain and units are not bypassed just
because both endpoints are on hills. **O [R p. 15, Hills; p. 18, Terrain Height and
Line of Sight, examples 1–3]:** refreshed play permits sight over lower obstructions
between elevated endpoints. A hill itself has an endpoint-height exception.

**D, refreshed only:** for an ordinary non-hill blocker on height `h`, the height
filter described in R is `h >= min(hA,hB)`, **not** `h >= max(hA,hB)`. Separately,
the hill-terrain exception means an intervening bare hill does not obstruct two
height-1 endpoints. An occupying unit at height 1 can still obstruct that same
query. Applying the height filter to hill terrain without its explicit exception
would be incorrect. These are categorical 2D rules, not a sloping 3D sight ray.

**U, legacy plateau:** F describes contiguity but the unavailable scenario 1096
prevents checking its visual explanation. Do not silently equate “same hill” with
an arbitrary connected component joined far outside the ray, or with continuous
hill cover only along the ray. Straight unbroken plateaus and an intervening first
rank of a separate hill group supply ordinary cases; detour-connected groups and
gaps require D04 resolution. Full board access already permits either approved
interpretation without changing geometry.

### R08 — artillery and other exceptions

**O [L p. 9; R p. 8]:** standard artillery does not need LOS to attack.
**D:** an artillery exemption does not prove the physical line is unobstructed.
**C, D06:** retain physical LOS, range and the exemption as separate facts; see the
API mapping below. Do not silently return `clear` to mean “LOS not required”.

**U / excluded pending separate verification:** base command-card attacks and
special scenario instructions can require a different eligibility context. The
inaccessible card compendium is not replaced with community recollection about
Barrage, Air Power or Behind Enemy Lines. Their complete targeting/range exceptions
are not specified here. Expansion artillery-shaped pieces must not inherit the
standard artillery exemption merely from their sculpt or name. **O, expansion
context only [X p. 2]:** the Heavy Anti-Tank Gun requires LOS despite being treated
as artillery in other respects. It is excluded from this supported profile.

### R09 — unit range

**O [L p. 9, Battle Range; R p. 8, Attack Range]:** standard infantry and armor reach
3 hexes; standard artillery reaches 6. **D [L pp. 12–13; R pp. 12–13, variant-unit
inheritance]:** the listed base elite/Resistance variants retain their corresponding
standard range/LOS unless an explicit special rule changes it. Mobility changes
are not range increases. Exact unrestricted lattice distance supplies these checks;
a blocked line or river does not lengthen that distance.

**C, D07:** derive intrinsic maximum from the observer's unit class. If a user range
is additionally supported, treat a finite radius as a voluntary cap and unlimited
as “no extra cap”, not as unlimited infantry fire. The effective upper bound is
`min(unitMaximum,userCap)` when a cap exists. This approved interpretation differs
from the demonstrations' unlimited-range semantics.

### R10 — visibility, range and legal attack

**O [L p. 8; R pp. 7–9, Attack / Terrain Protection]:** ordering, movement/terrain
conditions, nearby enemies and combat modifiers affect attack permission separately
from range/LOS. **D:** a visible, in-range coordinate is not a certified legal attack.
A base example with armor attacking out of a town toward protected terrain can
have clear LOS but no attack dice; no dice calculator is proposed here.

**C:** the first release reports LOS/range inspection, not an attack-eligibility
verdict. Do not imply eligibility for friendly/empty targets, self-targeting,
artillery behind obstructions, unordered units or units that have already attacked.
These restrictions are recorded to prevent a misleading claim, not to introduce
turn, movement, dice, retreat or scenario-management mechanics.

### R11 — battlefield membership and half-hexes

**O [F p. 2, Line of Sight; R p. 8]:** the printed side half-hexes cannot provide an
off-board LOS route. **U:** that rule does not define arbitrary holes/disconnected
boards, nor precisely settle a singleton touch of the printed boundary.

**C, D05:** origin and target must exist. An absent intermediate cell with a
positive-length interior or edge contact invalidates LOS. An absent singleton
contact is ignored, but retained as coordinate-only evidence. Membership invalidity
precedes blocking in LOS status; physical blocker evidence is retained without an
applicable visibility verdict. These are arbitrary-board calculator conventions,
not official rulings about holes. Generic rectangles are not certified encodings
of the official battlefield or its half-hex boundary.

## Supported first-release scope and data model

**C, D01/D09–D11:** the implemented identity is `memoir44.refresh2025`, version
`"1"`, with exactly empty configuration `{}`. There is no legacy fallback or
scenario override. This is physical LOS/range inspection, not attack eligibility.

| Entity kind         | Required properties                                               | Constraint                                           |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `memoir44.terrain`  | `{ "type": "forest" }`                                            | At most one base terrain; implicit open if omitted.  |
| `memoir44.obstacle` | `{ "type": "bunker" }`                                            | Unique installation types per cell; cell-associated. |
| `memoir44.unit`     | `{ "type": "infantry", "side": "allies", "variant": "standard" }` | At most one unit; side is `allies` or `axis`.        |

Supported terrain: **open, forest, hedgerow, town, church, hill, river, ocean,
beach, bridge**. Supported installations: **bunker, hedgehog, sandbags, wire,
sea-wall**. Standard **infantry, armor and artillery** are the only supported units.
R pp. 14–20 supplies the named terrain/installation semantics; R p. 8 supplies
standard unit range and LOS behavior. Church inherits town (p. 16), sea wall inherits
sandbag LOS (p. 20). Open is the implicit storage convention.

The schema is strict: unknown kinds, types, variants, fields, duplicate terrain,
duplicate units, duplicate installation types and all stored shared-edge features
are rejected. IDs remain globally unique. Roles are independent of stack order;
list order and every matching obstruction are preserved. Unique supported
installations can coexist with the one base terrain/unit and inherit its height.
This compositional LOS schema does not certify legal deployment or movement.
A bridge represents a transparent base cell; a river+bridge stack with two base
terrains is rejected. No overlay priority or hidden scenario override is inferred.

Hill derives categorical height 1; all other supported bases derive 0. There is no
geometric z coordinate. In particular, forest-on-hill variants cannot be encoded
by stacking two bases or adding an elevation field. Hill+bunker is supported.

Deferred: legacy plateau interpretations, lakes (M31), hill variants, bluffs/cliffs,
composite terrain, elite/Resistance/special units, expansion content, command-card
exceptions and scenario overrides. Some deferred content belongs to the base box;
this is **not exhaustive 2025 base-game compatibility**. Figure counts, movement,
dice, turn state, legal deployment and attack resolution are outside this adapter.

## Mapping to the accepted engine

The following maps the approved rules to the implemented adapter.

| Existing facility            | Implemented use and limits                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact cell contact classes   | Eligible `interior` contacts are decisive; positive `edge-overlap` contacts enter the R04/R05 side policy. `isolated-vertex` enters the same sided policy under C/D02; `degenerate-point` is self inspection under C/D08.                                                                                                               |
| Rational entry/exit          | Preserve exact evidence intervals. Distinguish positive length from singleton equality; do not require opposite-side intervals to overlap. No approximate samples, perturbations or traversal replacement.                                                                                                                              |
| Determinant side             | Classify eligible boundary contacts as left/right relative to A→B. It is not blocker priority. Reversal exchanges signs without changing a symmetric physical LOS decision.                                                                                                                                                             |
| Shared edges                 | Match the overlapping pair and retain all finite-edge incidences for explanation. A geometric edge is not itself an obstacle. No base rule found requires an arbitrary stored shared-edge feature to block; stored shared-edge features are rejected explicitly.                                                                        |
| Simultaneous events          | Retain every cause at a vertex or overlap endpoint. Multiple stacked/pair causes must survive. For separated opposite-side blockers, keep their **different** event parameters; do not invent a simultaneous blocking time.                                                                                                             |
| Board membership             | Preserve absent contacts independently of geometry. Apply the approved positive-length absence policy under D05; generic transparent absence is not an official Memoir rule.                                                                                                                                                            |
| Ordered stacks / full board  | Read each semantic layer and all occupying units. Validate supported combinations. Full board access can support an approved legacy plateau interpretation or inspect adjacent units if a later eligibility feature is separately approved. No board redesign is needed.                                                                |
| Ruleset configuration        | Identity pins the edition; configuration is empty and scenario overrides are rejected. Do not mix F's legacy hill answer with R's replacement elevation rule.                                                                                                                                                                           |
| Independent range and LOS    | Range comes from the selected unit class plus any approved user cap. Always complete both decisions for supported queries, even when one fails. Resource failures remain failures without a verdict.                                                                                                                                    |
| Semantic messages / evidence | Use stable reasons such as `memoir44.interior-obstruction`, `memoir44.opposite-boundary-obstructions`, `memoir44.lower-obstruction-exempt`, `memoir44.artillery-los-not-required` and `memoir44.absent-positive-contact`. Codes are stable semantic messages. Preserve actual element/coordinate references, sides and exact intervals. |

A conceptual sequence is: validate the profile and board payloads; obtain the
complete existing `traceSightline` result; identify endpoint elevation and roles;
apply source-profile obstruction exceptions; interpret contact classes; retain all
blocking/ignored/exempt facts; evaluate intrinsic range independently. This keeps
game predicates in the ruleset and every exact geometric fact in M1.

For an opposite-side decision, a semantic explanation can reference both source
IDs and interval strings while individual evidence entries refer to the original
contact records. `evidenceEvents` can continue reporting closed incidences at their
actual t values. A game-rule pair with disjoint intervals is not a new geometric
intersection event.

### Representability and genuine limits

No demonstrated base-core **physical LOS/range** rule requires a geometry or board
architecture change. Categorical elevation, occupancy, sided overlap pairing,
nonlocal hill data and coordinate-only absence evidence fit the current context.

There are nevertheless important result-contract limits:

- `LosDecision` has no first-class “not required” state. The existing P8
  `visibility.visible` means in-range **and** clear LOS; it is not attack permission.
  Under approved D06, artillery can have a blocked physical line and in-range
  result, plus a semantic LOS-exemption message. `visible=false` then must not be
  explained as “artillery cannot attack”. This preserves facts without changing
  P8; later presentation must preserve this distinction.
- The API has no certified legal-attack result or turn/movement/command state.
  R10 supplies concrete counterexamples: adjacency restrictions and a zero-dice
  attack can matter despite clear, in-range LOS. Complete eligibility cannot be
  truthfully derived from the current LOS/range boolean alone. It is outside this
  release slice; no new result type or turn system is proposed in this milestone.
- Exact printed-board half-hex mapping and unresolved legacy plateau/vertex
  interpretations are specification/data gaps, not evidence that clipping or
  arbitrary finite membership must be redesigned.

If the intended product is instead a complete attack-eligibility checker, that is
a scope decision requiring approval and a separate concrete contract. Do not
smuggle it into this adapter by redefining `clear`, `visible` or lattice distance.

## Reference fixtures

All 31 applicable refreshed fixtures are implemented in `tests/memoir44/fixtures.ts`.
M31 and legacy-only outcomes are explicitly deferred.
Coordinates are axial. Unless stated otherwise, A has standard infantry, B has an
enemy infantry unit, all intersected lattice cells exist, unspecified terrain is
open and there are no other units/obstacles. Report physical LOS and intrinsic
range separately, not attack eligibility. Different occupancy sides are varied
only where stated. No command-card or scenario override is assumed.

All listed intervals and determinant signs were checked using the unchanged M1
geometry API. A game outcome is source-backed only to the extent labeled O/D.
C outcomes below implement approved conventions; U legacy cases remain deferred. These are our axial instantiations of rule patterns, not claims that
publisher diagrams supplied axial coordinates.

| ID  | Explicit configuration                                                                           | Expected outcome and basis                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 | A `(0,0)`, B `(2,0)`, empty intermediate `(1,0)`                                                 | Clear LOS, distance 2 in range. O/D, R01/R09; L p. 9, R p. 8.                                                                                                                                 |
| M02 | M01 with forest `(1,0)`                                                                          | Blocked by interior `[1/4,3/4]`, side 0; range unchanged. O/D, R01/R02. Replace forest with hedgerow, town or bunker for corresponding base cases.                                            |
| M03 | M01 with an intervening unit `(1,0)`                                                             | Blocked whether that unit is friendly or enemy, any standard unit class. O/D, R01; retain its actual unit ID.                                                                                 |
| M04 | M01 with forest only at B, then only at A                                                        | Clear; target exemption O in L/R, origin case O in R and D from L's forest example. Endpoint elevation remains available. R03.                                                                |
| M05 | M01 with unoccupied river/ocean/beach/wire/sandbags/hedgehog at `(1,0)`; bridge without override | Clear for each ordinary level-ground case. O/D, R02; L pp. 15–16, F p. 8. No movement or defense verdict follows.                                                                             |
| M06 | A `(0,0)`, B `(2,-1)`, forest `(1,0)` only                                                       | Clear; one positive-side overlap `[1/3,2/3]`. O/D, R04; L/R boundary examples.                                                                                                                |
| M07 | M06 plus obstruction `(1,-1)`                                                                    | Blocked; negative and positive overlaps both `[1/3,2/3]`; retain both IDs. Use town/forest and unit/terrain pairs. O/D, R04.                                                                  |
| M08 | A `(0,0)`, B `(4,-2)`, obstructions `(1,0)` and `(3,-1)` only                                    | Clear LOS: both positive side, intervals `[1/6,1/3]` and `[2/3,5/6]`. Distance 4 is out of infantry range. D from R04/R09.                                                                    |
| M09 | A `(0,0)`, B `(4,-2)`, town `(1,0)` and forest `(3,-2)`                                          | Blocked LOS despite disjoint intervals `[1/6,1/3]` side + and `[2/3,5/6]` side −; distance 4 out of infantry range. O diagram / D exact instantiation, R05; L/R final boundary example.       |
| M10 | A `(0,0)`, B `(4,1)`, forest `(1,1)` only                                                        | **C D02:** clear; singleton `[1/3,1/3]`, side +. Distance 5 out of infantry range. No publisher ruling on singleton semantics.                                                                |
| M11 | M10 plus forest `(3,0)`                                                                          | **C D02/D03:** blocked; singleton `[2/3,2/3]`, side − pairs globally with M10. Disjoint intervals are intentional.                                                                            |
| M12 | A `(0,0)`, B `(4,1)`, forest `(2,0)` only                                                        | Blocked: interior `[1/3,1/2]`, side −; no opposite-side obstacle required. D, R01; illustrates why side alone is not the policy.                                                              |
| M13 | A `(0,0)`, B `(2,0)`, hills at `(0,0),(1,0),(2,0)`; no intermediate unit                         | Clear in the ordinary unbroken plateau case under both profiles. O/D, R07; L p. 14/F p. 7; R p. 15.                                                                                           |
| M14 | A/B as M13 on hills, but `(1,0)` is ground-level town                                            | Legacy blocked; refreshed clear. O/D, R07; F p. 7 versus R p. 18 example 1. This is an edition discriminator.                                                                                 |
| M15 | A/B on hills, `(1,0)` open ground with intervening unit                                          | Legacy blocked; refreshed clear. O/D, F p. 7 versus R p. 18 example 2.                                                                                                                        |
| M16 | A on hill `(0,0)`, B on ground `(2,0)`, ground-level forest `(1,0)`                              | Blocked under both profiles. D, R07; R p. 18 example 3 supports the minimum-endpoint-height interpretation.                                                                                   |
| M17 | Hills as M13, add unit at `(1,0)`                                                                | Blocked under both profiles: unit is not exempt just because bare hill terrain is. O/D, R01/R07.                                                                                              |
| M18 | A hill `(0,0)`, B hill `(3,0)`, intervening hill `(1,0)`, open gap `(2,0)`                       | Legacy blocked in the separate-group first-rank case; refreshed clear. O/D, F p. 7 and R pp. 15/18.                                                                                           |
| M19 | M18 plus off-ray hill chain `(0,1),(1,1),(2,1)` connecting to B                                  | **U for legacy:** now one graph-connected group but the ray still crosses a gap. Refreshed remains clear. D04 must settle whether an off-ray detour changes the legacy case.                  |
| M20 | A artillery `(0,0)`, B `(4,0)`, forest `(2,0)`                                                   | O: artillery LOS exemption, maximum 6. **C D06:** physical LOS remains blocked at `[3/8,5/8]`, with separate exemption message; no legal-attack verdict.                                      |
| M21 | Open line A `(0,0)`, B `(3,0)` then `(4,0)`; infantry and armor separately                       | Intrinsic range passes at 3, fails at 4; LOS clear for both. O/D, R09; L/R range sections.                                                                                                    |
| M22 | Open line A artillery `(0,0)`, B `(6,0)` then `(7,0)`                                            | Intrinsic range passes at 6, fails at 7. O/D, R09. LOS exemption does not extend range.                                                                                                       |
| M23 | A infantry `(0,0)`, B `(4,0)`, query range unlimited                                             | **C D07:** out of intrinsic infantry range despite unlimited user cap; physical LOS clear.                                                                                                    |
| M24 | A/B both `(0,0)`                                                                                 | **C D08:** self inspection clear and in range, with required supported observer. Degenerate contact `[0,1]`; not an attack.                                                                   |
| M25 | M01 with `(1,0)` absent                                                                          | **C D05:** invalid-under-ruleset, coordinate-only absent evidence `[1/4,3/4]`; not an official hole ruling.                                                                                   |
| M26 | M06 with `(1,0)` absent, no forest                                                               | **C D05:** invalid-under-ruleset for absent positive edge overlap `[1/3,2/3]`. Absent singleton contacts are ignored under the same convention.                                               |
| M27 | A armor `(0,0)` in town, B `(2,0)` on hill; `(1,0)` open                                         | Clear and within range; does **not** certify an attack. R p. 9 gives the cumulative-penalty example that can leave no attack dice. O/D, R03/R10.                                              |
| M28 | M01 with an enemy at `(0,1)` as well as B                                                        | Clear LOS to B, distance 2 in range; the off-ray adjacent enemy nevertheless constrains attack selection. O/D, R10; `(0,1)` is the M1 G1 no-hit probe.                                        |
| M29 | M13, with bunker plus hill at `(1,0)`                                                            | Blocked, including refreshed play: the hill exception does not exempt an equal-height bunker. D, R02/R07; R p. 19 explicitly uses bunker-on-hill as a supported terrain/obstacle combination. |
| M30 | M02 with a church instead of forest, refreshed profile only                                      | Blocked by the same interior interval: D from R p. 16's inheritance of town rules. It is not automatically a legacy base terrain.                                                             |
| M31 | A `(0,0)`, B `(3,0)`, adjacent lake cells `(1,0),(2,0)`, all ground level, refreshed profile     | **Deferred unsupported terrain:** researched O/D lake example (R p. 18), not implemented or accepted by this adapter.                                                                         |
| M32 | M01 with a sea wall at `(1,0)` and no occupying unit                                             | Clear: O/D, F p. 9 and R p. 20. A sea-wall depiction must not be converted into an opaque shared edge.                                                                                        |

For each accepted fixture, later adapter tests should vary stack ordering while
retaining all facts, reverse A/B for physical LOS where the source rule is symmetric,
translate by `(9007199254740993,-9007199254740993)`, and rotate/reflect the whole
configuration. Use sufficient candidate budgets for every transformed query.
Preserve exact fractions/sides and all simultaneous incidences. M09's paired
causes occur at different parameters; M07's causes share intervals. Do not replace
these tests with a count-only or a boolean-only comparison.

## Decision register — approved M2B.2

| ID  | Resolution                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| D01 | Refreshed 2025 edition only; `memoir44.refresh2025` version `"1"`.                                                  |
| D02 | C: sided isolated vertex contacts; not a publisher ruling.                                                          |
| D03 | D: opposite-side boundary obstructions need not overlap in parameter.                                               |
| D04 | Legacy plateau rules deferred; no connected-component algorithm.                                                    |
| D05 | C: absent positive-length intermediate contacts invalidate; absent singleton ignored.                               |
| D06 | C: physical LOS and official artillery exemption preserved separately.                                              |
| D07 | C: intrinsic unit maximum optionally reduced by user cap; unlimited removes only cap.                               |
| D08 | C: supported observer required; empty targets and self inspection permitted. Self is clear/in range, not an attack. |
| D09 | Supported 2025 base-core subset only, as enumerated above.                                                          |
| D10 | Strict terrain/installation/unit vocabulary and semantic stack validation above.                                    |
| D11 | Scenario-specific overrides deferred; unknown configuration rejected.                                               |
| D12 | Stable semantic codes, structured arguments and complete exact evidence.                                            |

### Mixed boundary contact impossibility (D, mathematical)

A center-to-center sightline cannot simultaneously have a positive-length edge
overlap and an isolated vertex cell contact. An overlap makes its supporting line
parallel to a polygon edge. Rotate the lattice to make that edge vertical in the
approved affine embedding. Relative vertex X coordinates of every hex are 0 or
±1: a vertical line through its top/bottom vertex (X=0) enters the interior;
a vertical line through any other vertex (X=±1) contains a whole vertical edge.
Neither produces an isolated contact. Segment clipping cannot create an endpoint
singleton in another cell, because a lattice center is strictly interior to its
own hex and lies on no other hex boundary. Rotation covers all three edge
orientations. Thus mixed edge/singleton fixtures in this domain are impossible.
The 169-displacement bounded geometry check is supporting verification, not the proof.
Same-type singleton and edge pairs, including separated intervals, are tested.

### Implementation architecture

An optional `Ruleset.validateQuery` hook checks selected observer requirements
before geometry. Board validation cannot know the selected origin; scenario
validation has no selected query and can therefore still accept an empty board.
The hook supplies an immutable query and returns semantic input issues. Exceptions
remain evaluation failures. Generic rulesets need no hook and keep their behavior.
No geometry, board, evidence or visibility-result schema was changed.

## Deferred M2A findings — record only

The following findings are outside M2B.1 fixes. No source, API or existing M2A
wording is modified to resolve them in this PR.

| ID      | Future consideration                                  | Evidence / work still needed                                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2A-F01 | Board-generation and scenario-import resource budgets | `src/board/generators.ts` and `src/serialization/scenario.ts` have no independent size/depth cap. Measure and specify limits separately from per-sightline candidate limits; include controlled failure semantics.                                                                |
| M2A-F02 | Whole-board performance and repeated validation       | `evaluateVisibility` resolves/validates board data on each query. A board-wide pass may repeat that work. Measure complete orchestration before deciding on a validated-batch contract or optimization; M1 geometry timings do not measure it.                                    |
| M2A-F03 | Invalidating evidence alongside a blocked decision    | `src/visibility/evidence.ts` requires blocking evidence for blocked LOS but does not reject a concurrent invalidating fact. Clarify whether such combinations are permitted and how adapters choose the LOS status; do not invent precedence here.                                |
| M2A-F04 | Repository privacy versus npm publication status      | `docs/board-and-visibility.md` calls this a private repository. `package.json`'s `private: true` controls npm publication and does not establish GitHub visibility. Verify repository visibility separately and correct that wording in a later task; no correction is made here. |

## Implementation verification

See the [M2B.2 completion report](../m2b2-report.md) for commands, test results,
source checks and remaining limitations. The M2B.1 source access record and legacy
findings above are retained; only refreshed outcomes and approved conventions
are executable. Official vertex clarification, exact printed-board mapping,
legacy plateau ambiguity and deferred terrain remain unresolved outside this subset.
