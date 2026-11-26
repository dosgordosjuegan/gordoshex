# Exact lattice geometry — M0 contract

## Status and scope

The axial distance, affine embedding, closed sightline and exactness requirements are **Agreed**. P4–P7 are **Approved**, with P6 subject to the resource-limit contract incorporated below. The [decision register](specification.md#decision-register-and-m1-gate) records approval scope and remaining details. The existing fixtures in [testing.md](testing.md) remain unchanged in mathematical meaning. This is a mathematical specification, not application code.

Geometry concerns the infinite two-dimensional lattice. Board membership, obstacles, stacks, elevation, range limits and game interpretation are external. In this document axial cells use lowercase `(q,r)`; embedded centers use uppercase `A,B,H`. `det((x,y),(u,v))=xv-yu`. The mathematical plane has positive Y upward.

## Coordinates, adjacency and distance

**Agreed.** Coordinates are integers, `s=-q-r`. The six axial neighbor displacements are:

| Direction index | `(dq,dr)` | Embedded displacement |
| --- | --- | --- |
| 0 | `(1,0)` | `(2,0)` |
| 1 | `(0,1)` | `(1,3)` |
| 2 | `(-1,1)` | `(-1,3)` |
| 3 | `(-1,0)` | `(-2,0)` |
| 4 | `(0,-1)` | `(-1,-3)` |
| 5 | `(1,-1)` | `(1,-3)` |

Opposite direction is `(i+3) mod 6`. These indices are an **approved** stable convention, not a game-facing compass system.

For axial difference `(dq,dr)`, unrestricted lattice distance is

`d=max(|dq|,|dr|,|dq+dr|)=(|dq|+|dr|+|dq+dr|)/2`.

The equality follows because the cube differences sum to zero: the sum of positive differences equals minus the sum of negative differences and equals the maximum absolute coordinate in three dimensions. Each neighbor step changes each cube coordinate by at most one, giving a lower bound of `d` steps. Repeatedly decreasing a positive cube difference and increasing a negative one reaches zero in `d` neighbor steps. Thus this is the graph metric on the unrestricted lattice. Obstacles, holes and disconnected board components do not change it. Two distinct cells are adjacent exactly when `d=1`.

## Exact affine embedding

**Agreed.** For pointy-top unit-circumradius Euclidean hexagons:

`x=sqrt(3)(q+r/2)`, `y=3r/2`.

Under `X=2x/sqrt(3)`, `Y=2y`, a center is

`C(q,r)=(2q+r,3r)`.

The six relative vertices, in cyclic order, are

`v0=(0,2), v1=(1,1), v2=(1,-1), v3=(0,-2), v4=(-1,-1), v5=(-1,1)`.

For local coordinates `p=(X-Hx,Y-Hy)`, the closed hexagon is

`|pX|<=1`, `|pX+pY|<=2`, `|pX-pY|<=2`.

Feasible intersections of supporting-line pairs give exactly the six listed vertices: intersections violating any other half-plane are excluded. Each listed vertex satisfies every inequality. Neighbor centers share full edges under this embedding. The inverse is `x=sqrt(3)X/2`, `y=Y/2`; the transform is invertible with positive determinant. It preserves incidence, collinearity, convexity, segment parameters, intersections and determinant signs. It does **not** preserve Euclidean angles or lengths; embedded polygons must not be rendered directly as regular hexagons without the inverse/display transform. Lattice distance is not embedded Euclidean distance.

Flat-top display can rotate the conventional Euclidean layout by 30 degrees. It does not introduce another visibility lattice. SVG normally uses downward screen Y; a screen reflection changes visual left/right but must not change the model's determinant signs.

## Exact arithmetic and value semantics — P4

**Approved.** All axial coordinates, embedded coordinates, differences, products, determinants, bounds and distance results use TypeScript `bigint`. Rational values use pairs of bigints. A safe input `number` is insufficient protection: even `(2^53-1)^2` exceeds exact safe-integer multiplication.

ECMAScript defines BigInt as an integer numeric type; division truncates toward zero, and division by zero throws. Number has a bounded safe-integer range. These facts motivate integer arithmetic and explicit signed floor/ceil helpers rather than number products or native division as floor. See [ECMAScript numeric types and BigInt operations](https://tc39.es/ecma262/2025/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types).

A rational `n/d` has:

- `d>0`; reject `d=0`.
- `gcd(|n|,d)=1`; move any denominator sign into `n` before reducing.
- Unique zero `0/1`. Negative zero has no separate value.
- Equality by normalized numerator/denominator values, never object identity. Comparison uses the sign of `n1*d2-n2*d1` exactly.

Use exact rational addition/subtraction/multiplication and division as needed, rejecting division by zero. Reduce public values and cached/event keys to canonical form. Equal values such as `2/6`, `-1/-3` and `1/3` share one parameter/event identity. No floating-point conversion occurs before comparisons. For positive integer `b`, define `floorDiv(a,b)` by mathematical floor and `ceilDiv(a,b)=-floorDiv(-a,b)`; native bigint division needs correction for a negative nonzero remainder. For example `floorDiv(-1,3)=-1`, `ceilDiv(-1,3)=0`.

Core input is bigint, not a union of number and bigint. Boundary adapters may accept canonical decimal strings or explicitly validated safe integer numbers, converting before *any* geometric operation. Reject unsafe numbers, fractions, NaN and infinities; converting an already rounded number to bigint cannot recover the intended integer. Canonical external integer spelling is `0` or an optional minus followed by nonzero-leading digits; reject `+1`, `01`, `-0` and whitespace in the approved strict format.

TypeScript distinguishes bigint from number and does not transparently downlevel bigint arithmetic for old runtimes. The intended M1 baseline requires strict TypeScript, a stable ES2020-or-later target with native BigInt and a supported Node.js LTS release. Select exact compatible compiler/runtime/test versions during M1; the M3 browser support matrix remains open. See [TypeScript BigInt notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-2.html#bigint) and [target configuration](https://www.typescriptlang.org/tsconfig/target.html).

Default JSON serialization of BigInt throws unless explicitly adapted. P10 approves in principle decimal strings for serialized integers and `{numerator,denominator}` decimal strings for persisted rational evidence; never cast to number for serialization. Scenario schema details remain P10. See [ECMAScript JSON serialization](https://tc39.es/ecma262/2025/multipage/structured-data.html#sec-serializejsonproperty).

Bigint is exact within available resources, not a promise of unbounded memory/time. Huge output sets may be impractical even for short input strings. Resource exhaustion must be distinguishable from a complete empty intersection result.

## Sightline and exact convex clipping — P5

**Agreed.** For distinct lattice endpoints, use the closed segment

`L(t)=A+tD`, `D=B-A`, `0<=t<=1`.

For each candidate cell center H, its six outward half-plane normals/bounds are:

| Normal n | Bound c |
| --- | --- |
| `(1,0)`, `(-1,0)` | `1` |
| `(1,1)`, `(-1,-1)` | `2` |
| `(1,-1)`, `(-1,1)` | `2` |

Each constraint is `n·(L(t)-H)<=c`, or `k*t<=z`, with integer `k=n·D`, `z=c-n·(A-H)`.

Start with `lo=0/1`, `hi=1/1`. For each constraint:

1. If `k=0` and `z<0`, the intersection is empty.
2. If `k=0` and `z>=0`, it adds no parameter bound. Record a supporting-line coincidence when `z=0`.
3. If `k>0`, replace `hi` by `min(hi,z/k)`.
4. If `k<0`, replace `lo` by `max(lo,z/k)`; normalize the negative denominator.
5. If `lo>hi`, the intersection is empty.

Every update intersects the current exact closed interval with precisely the permitted parameters of one half-plane. By induction, the final interval is exactly the preimage of the closed polygon. Convexity implies there is no second disjoint interval. `lo=hi` is retained, never rounded away. Closed inequalities preserve both cells incident to an overlapped edge and every cell incident to a touched vertex.

**Approved classification for `D!=0`:**

| Class | Exact definition | Parameters |
| --- | --- | --- |
| No intersection | Clipped interval empty | No entry/exit |
| Interior intersection | Some segment point lies in the strict polygon interior | `[lo,hi]`, with `lo<hi` |
| Positive-length edge overlap | Nonempty positive-length interval contained in one polygon edge, with no strict interior point | `[lo,hi]`, with `lo<hi` |
| Isolated vertex contact | A singleton intersection at one polygon vertex | `[t,t]` |

For a nonempty positive-length interval, evaluate the rational midpoint `m=(lo+hi)/2`. All six strict inequalities hold there exactly iff the segment intersects the strict interior. Otherwise at least one inequality is equality throughout the interval, yielding an edge overlap. To justify this test: a nonnegative affine slack on an interval can vanish at an interior parameter only if it vanishes identically. No tolerance is needed. Class priority is interior first, then overlap, then vertex; boundary endpoints of an interior crossing are additional metadata, not additional cell classifications.

**Scope caveat:** an arbitrary segment endpoint could touch just the relative interior of an edge, requiring an extra isolated-edge-point class. For the agreed center-to-center lattice segment this cannot occur: each endpoint is strictly inside its own cell and in no other closed cell. An isolated contact at an interior parameter on the relative interior of an edge is also impossible: a transverse line enters the polygon on one side, while a collinear line overlaps the edge. Therefore all isolated contacts in the agreed domain are vertices. A future arbitrary-point API must extend the classification rather than force such contacts into “vertex”.

For every hit report coordinate, class, exact `entry=lo`, `exit=hi`, and

`side=sign(det(D,H-A))` in `{-1,0,+1}`.

Positive means left in the mathematical plane, negative right, zero collinear with the **infinite** sightline. Zero does not imply intersection. Side must not break ties or discard one side of an edge. Report the active polygon edges/vertices at entry and exit, and any edge supporting the entire overlap. Points may be reconstructed as rational coordinate pairs from `L(t)`.

For direct single-cell classification, no-hit results have no interval; side can still be computed. A full query returns hit records only, declaring completion separately from an error or unfinished enumeration. Board membership is attached by the caller, never used to filter geometry.

## Degenerate center-to-center sightline — P5

**Reviewed ambiguity and approved resolution:** when `A=B`, `D=0` and every `t` maps to the same point. The spatial segment has zero length, but its preimage in the owning closed hexagon is the **whole** `[0,1]`, not `[0,0]`.

**Approved.** Return a top-level degenerate flag and one distinct `degenerate-point` cell record for that coordinate, with strict-interior location, `entry=0`, `exit=1` and `side=0`. There are no edge intersections. Every other lattice cell is a no-hit. The owning cell is included even if absent from a board. Do not call this positive-length interior intersection or assign it an arbitrary vertex parameter. Rulesets determine self-visibility; P9 specifies clear self-visibility with distance zero. Empty event output is sufficient for this degenerate query because the point record is explicit. Reversal keeps the record unchanged. Preflight still applies: the reference candidate count is exactly one; a limit of zero returns resource-limit failure instead of this record, while a limit of one permits it.

## Complete finite candidate enumeration — P6

**Agreed.** The reference algorithm enumerates a conservative finite part of the infinite lattice and clips each candidate. It includes absent cells. **Approved bounds:** let the embedded sightline endpoint extrema be `Xmin,Xmax,Ymin,Ymax`.

Every polygon has local extents `|pX|<=1` and `|pY|<=2`. If a polygon centered at `(2q+r,3r)` meets the sightline, then necessarily

`Xmin-1 <= 2q+r <= Xmax+1`,

`Ymin-2 <= 3r <= Ymax+2`.

Enumerate all integers

`ceilDiv(Ymin-2,3) <= r <= floorDiv(Ymax+2,3)`,

and, for each such r,

`ceilDiv(Xmin-1-r,2) <= q <= floorDiv(Xmax+1-r,2)`.

Bounds are inclusive. Test each candidate with clipping; discard no-hits only afterward. Signed mathematical division is essential. Do not enumerate all integer `(X,Y)` and assume they are lattice centers: they must satisfy the axial embedding's congruences.

**Completeness proof.** If P is an intersection point, its X and Y lie between the respective endpoint extrema. Write `P=C(q,r)+v` for a point v in the hexagon. Since `|vX|<=1` and `|vY|<=2`, the necessary bounds above hold. Taking exact ceil/floor retains every integer solution, including equality on supporting boundaries. Thus every intersected cell is enumerated. The intervals are bounded, so enumeration terminates mathematically and produces no duplicate coordinates. No board-connectivity or occupancy assumption enters the proof.

A second useful necessary bound supports independent tests. Inverting the center map on an arbitrary point gives axial real coordinates `r=Y/3`, `q=(3X-Y)/6`. At all six polygon vertices each local axial component lies in `[-2/3,2/3]`; by convexity this holds throughout the polygon. The sightline's axial real coordinates are convex combinations of endpoint axial coordinates. Consequently any intersected integer cell lies within the endpoint axial q/r bounds expanded by one. This larger axial rectangle is a simple independent completeness oracle; it need not equal the reference candidate set.

The row enumeration tests at most a quantity proportional to `(abs(DY)+1)*(abs(DX)+1)` candidates (a coarse upper bound), plus bigint arithmetic cost. It can be quadratic in lattice distance. M1 must retain this reference method; do not introduce an optimized lattice traversal. A later optimization must reproduce every exact hit/event, especially grazing cells and absent cells.

### Exact bounded-cost candidate count

Count the **candidate region**, including no-hit candidates and absent cells, rather than predicting the number of actual intersections. Define these exact integers from the same approved bounds:

`Rlo=ceilDiv(Ymin-2,3)`, `Rhi=floorDiv(Ymax+2,3)`,

`L=Xmin-1`, `U=Xmax+1`, `W=U-L+1=Xmax-Xmin+3`,

`n=Rhi-Rlo+1`, `h=floorDiv(W,2)`, `e=W-2h`,

`p=L-2*floorDiv(L,2)` (the Euclidean residue of L modulo 2),

`E=floorDiv(Rhi-p,2)-floorDiv(Rlo-1-p,2)`.

Then the exact candidate count is

**`N=n*h+e*E`.**

Here `e` and `p` are 0 or 1, including for negative L. Use mathematical floor, not truncation or an uncorrected signed remainder. All quantities, products and comparisons use bigint. Center-to-center endpoints imply `Ymin,Ymax` are multiples of 3, so `Rlo=min(rA,rB)`, `Rhi=max(rA,rB)`, `n=|rB-rA|+1>=1`, and `W>=3`. No empty-row correction is needed in this domain.

**Derivation.** For a fixed r, mapping `q` to `x=2q+r` is a bijection from that row's q candidates to integers x in `[L,U]` congruent to r modulo 2. The W consecutive integers in this interval contain h of each parity, and, if `e=1`, one additional integer of parity p. Thus row r contains `h+e*[r congruent to p mod 2]` candidates. Such extra rows have `r=2k+p` for integer k, so `ceilDiv(Rlo-p,2)<=k<=floorDiv(Rhi-p,2)`. Their count is `floorDiv(Rhi-p,2)-ceilDiv(Rlo-p,2)+1`, equivalently E above because `ceilDiv(a,2)-1=floorDiv(a-1,2)` for every signed integer a. Summing the constant h contribution and these E extra candidates gives `N=n*h+e*E`, without actually summing over rows.

This is a fixed number of bigint operations with a fixed number of intermediate integers: no candidate or row iteration and no allocation proportional to endpoint separation. The bit cost of bigint arithmetic still depends on input magnitude; “bounded-cost” here means bounded operation count, not constant time independent of integer bit length. Reversal and any integer lattice translation leave N unchanged: translating changes x by `2*dq+dr` and row parity by dr, preserving their parity match.

| Endpoints (axial) | n | W | E | N |
| --- | --- | --- | --- | --- |
| `(0,0)` to `(2,0)` — G1 | 1 | 7 | 0 | 3 |
| `(0,0)` to `(2,-1)` — G2 | 2 | 6 | 1 | 6 |
| `(0,0)` to `(4,1)` — G3 | 2 | 12 | 1 | 12 |
| `(0,0)` to `(3,1)` — G4 | 2 | 10 | 1 | 10 |
| `(0,0)` to `(0,0)` — G5 | 1 | 3 | 0 | 1 |
| `(0,0)` to `(0,2)` — rotated G1 | 3 | 5 | 1 | 7 |

### Resource-limit contract and symmetry boundary

Require a configurable **nonnegative bigint** `maxCandidates` per sightline (zero is valid and denies every lattice sightline). Validate the limit as query/configuration input. Compute N by the closed form before enumerating rows/candidates, allocating a candidate collection or clipping. If `N>maxCandidates`, return an explicit `resource-limit` failure with N and the configured limit; if `N<=maxCandidates`, admit reference enumeration. Count equality is inclusive. Even degenerate sightlines have N=1 and obey this comparison before their point-record shortcut.

A rejected query returns no complete geometric result, no partial hit set presented as complete, and no valid visibility verdict. The visibility layer maps resource rejection to `evaluation-failure`, never to blocked, clear or ruleset-invalid LOS. A limit does not guarantee that all other resources suffice: cancellation, allocation or other evaluation failures also cannot masquerade as visibility answers. Numeric defaults will be selected after reproducible M1 measurements; cancellation details remain O2.

**Newly identified interaction, without changing geometry:** conservative candidates are axis-aligned, so candidate counts and budget admission are not rotation invariants. G1 counts 3, whereas its 60-degree rotation to `(0,2)` counts 7; a limit of 3 admits the former and rejects the latter. Mathematical contact/class/parameter invariance still holds for completed evaluations. Test symmetry with limits sufficient for both shapes, and test budget admission separately. This avoids incorrectly requiring a resource failure to have the geometric hit records of a successful query. No optimized traversal or rotation-dependent geometric tie-breaking is introduced.

## Canonical shared edges — P7

**Agreed.** One shared geometric edge must have one identity regardless of the referencing cell, even at board boundaries.

**Approved.** Represent the edge between adjacent axial cells h and k by `EdgeId=(minLex(h,k),maxLex(h,k))`, with numeric lexicographic ordering first q then r. Validate distance one; identical or nonadjacent pairs are invalid. This is an unordered-pair identity with a canonical storage order, not lexicographic sorting of decimal strings. For a local reference `(h,i)`, let `k=h+direction[i]` and normalize the pair. Then `(h,i)` and `(k,(i+3) mod 6)` have identical IDs.

The approved text key is `q1,r1|q2,r2`, using canonical decimal integers. The restricted grammar makes it unambiguous, including negatives. Numeric tuples remain the semantic identity. Canonical sorting is for identity/serialization only, never a geometric event priority. Under lattice symmetries normalize the transformed pair again.

The corresponding local closed edges are:

| Neighbor direction | Local supporting line | Local endpoints |
| --- | --- | --- |
| 0 | `pX=1` | `v1,v2` |
| 1 | `pX+pY=2` | `v0,v1` |
| 2 | `pX-pY=-2` | `v5,v0` |
| 3 | `pX=-1` | `v4,v5` |
| 4 | `pX+pY=-2` | `v3,v4` |
| 5 | `pX-pY=2` | `v2,v3` |

Add H to get integer global endpoints. Recovering the edge from either adjacent cell must give the same unordered endpoint set. Geometry has these edges even when both incident cells are absent. Board feature storage is a separate P2 constraint. Vertices can later use exact embedded integer coordinate pairs as identities, without picking an owning cell.

## Exact sightline–edge intersections — P7

Deduplicate the six edges of every hit hexagon by EdgeId, then test each finite closed edge segment. This includes every relevant edge: if an edge meets the sightline, each incident closed hexagon does too, so the complete cell enumeration contains both. All three edges incident to a contacted vertex must survive deduplication as three distinct IDs. Edge-feature presence does not determine which geometric records exist.

For nondegenerate sightline D and edge from integer U to V, set `E=V-U`, `W=U-A`, `K=det(D,E)`.

- If `K!=0`, solve `t=det(W,E)/K`, `u=det(W,D)/K`. There is a point intersection iff both are in `[0,1]`, exactly.
- If `K=0` and `det(W,D)!=0`, the segments are parallel and disjoint.
- If both vanish, the segments are collinear. Choose a nonzero component `Dj`, compute `tU=(Uj-Aj)/Dj` and `tV=(Vj-Aj)/Dj`, and intersect `[min(tU,tV),max(tU,tV)]` with `[0,1]`. Empty means disjoint; positive length means overlap; equality means point touch. Component choice must not change the answer.

Use canonical numeric lexicographic order of the two embedded endpoints to orient E when reporting edge-relative quantities. Record:

| Information | Purpose |
| --- | --- |
| EdgeId, both incident coordinates, U and V | Feature lookup and unique geometric identity |
| `none`, `point` or `overlap`; exact t interval | Finite-segment contact, preserving length-zero cases |
| Exact u at point contact, or u at each overlap endpoint | Distinguish edge-relative interior from an endpoint vertex |
| `sign(det(E,A-U))`, `sign(det(E,B-U))` | Supporting-line side before/after the query |
| Whether t is 0/1, whether u is 0/1; vertex identity when applicable | Separate sightline endpoints and edge endpoints |
| Related cell-contact references | Consistent explanations without duplicate features |

Define **proper edge crossing** as a point with `0<t<1` and `0<u<1` (necessarily transverse). Define **edge touch** as any other singleton intersection, retaining endpoint/vertex flags. Define **edge overlap** as a positive-length interval. Opposite nonzero endpoint signs indicate crossing the infinite supporting line; at an edge vertex this must not be mislabeled a proper crossing of the finite edge interior. An edge overlap can coexist with an interior intersection of a different cell. These terms are geometric facts, not automatic blocking decisions.

## Simultaneous event contract — P7

Collect rational parameters of every cell entry/exit and edge point/overlap endpoint, adding query endpoints 0 and 1 for a nondegenerate query. Normalize values, sort distinct parameter values exactly, and group **all** incidences at equal t into one event. An event carries entering/exiting cell sets, isolated-vertex contacts, edge point records and overlap starts/ends. A singleton cell belongs to both its entry and exit sets and retains its singleton class; do not erase it through set subtraction. Overlap intervals remain first-class records; a list of point events alone loses them.

Open intervals between distinct event parameters have constant active cell/edge-overlap sets. If needed, evaluate a rational midpoint to reconstruct those sets. At an event, closed membership includes every cell whose `[entry,exit]` contains t, including ending, starting and singleton contacts simultaneously. No sequential update or ID sort can choose which cell “wins”. Deterministic storage order within a group is permissible only as presentation, never as an interpretation priority.

## Symmetries and reversal

Translations by an axial integer vector preserve classification, parameter intervals and side. A 60-degree Euclidean rotation about the origin is `R(q,r)=(-r,q+r)`; `R^6` is identity. Horizontal reflection is `F(q,r)=(q+r,-r)`; `F^2` is identity. Apply these to **all** cell/edge identities, not as a naive Euclidean rotation of the anisotropic integer embedding. In embedded coordinates rotation is `((X-Y)/2,(3X+Y)/2)` on lattice centers/vertices; it has determinant +1. Reflection is `(X,-Y)` with determinant -1.

Rotation preserves determinant side; reflection negates it. Both preserve contact classes and rational parameters, after canonicalizing transformed edges. Reversal of origin/target preserves spatial contacts and changes every interval `[a,b]` to `[1-b,1-a]`; determinant side negates. Event t becomes `1-t`, entries/exits and overlap starts/ends exchange. Ruleset outputs need not obey these symmetries unless that ruleset promises them. For a reversed query, edge-support signs at A and B swap; fixed-edge u values stay associated with the same spatial points.
