export const memoirEn = Object.freeze({
  'memoir44.refresh2025': "Memoir '44 2025 · supported subset",
  'memoir.profile-note':
    "Memoir '44 refreshed 2025 supported subset · separate working board · inspection only, not attack legality. No official endorsement.",
  'memoir.no-cap': 'No additional range cap',
  'memoir.range-cap': 'Additional range cap (inclusive)',
  'memoir.palette': 'Memoir editing palette',
  'memoir.tab.terrain': 'Terrain palette',
  'memoir.tab.unit': 'Unit palette',
  'memoir.tab.installation': 'Installation palette',
  'memoir.affiliation': 'Unit affiliation',
  'memoir.side.allies': 'Allies',
  'memoir.side.axis': 'Axis',
  'memoir.unit.infantry': 'Infantry',
  'memoir.unit.armor': 'Armor',
  'memoir.unit.artillery': 'Artillery',
  'memoir.terrain.open': 'Open',
  'memoir.terrain.forest': 'Forest',
  'memoir.terrain.hedgerow': 'Hedgerow',
  'memoir.terrain.town': 'Town',
  'memoir.terrain.church': 'Church',
  'memoir.terrain.hill': 'Hill',
  'memoir.terrain.river': 'River',
  'memoir.terrain.ocean': 'Ocean',
  'memoir.terrain.beach': 'Beach',
  'memoir.terrain.bridge': 'Bridge',
  'memoir.installation.bunker': 'Bunker',
  'memoir.installation.hedgehog': 'Hedgehog',
  'memoir.installation.sandbags': 'Sandbags',
  'memoir.installation.wire': 'Wire',
  'memoir.installation.sea-wall': 'Sea wall',
  'memoir.paint': 'Paint',
  'memoir.place': 'Place',
  'memoir.erase': 'Erase',
  'memoir.clear-terrain': 'Clear terrain to implicit Open',
  'memoir.remove-unit': 'Remove unit only',
  'memoir.paint-hint':
    'Choose a tool, then click cells to paint. Dragging always pans. Replacing terrain or a unit preserves the other layers.',
  'memoir.use-observer': 'Use this unit as observer',
  'memoir.observer-hint':
    'Place a supported unit here before using this cell as an observer. Empty and friendly targets remain valid for inspection.',
  'memoir.implicit-open': 'Implicit Open terrain',
  'memoir.invalid-cell':
    'Unsupported or invalid cell data; no valid visibility verdict.',
  'memoir.unsupported-entity': 'Unsupported entity',
  'memoir.legend':
    'A/X = Allies/Axis. Unit boxes: crossed lines = Infantry, oval = Armor, dot = Artillery. Green check = range and LOS requirements satisfied, including the artillery LOS exemption marked A. Gray = out of range. Physical LOS and engine visibility remain separate in inspection. Neither green nor A certifies a legal attack.',
  'memoir.legend.visible': 'Range and LOS requirements satisfied',
  'memoir.status.requirements-met': 'Range and LOS requirements satisfied',
  'memoir.legend.blocked': 'LOS required and physically blocked',
  'memoir.legend.out-of-range': 'Outside effective weapon range',
  'memoir.unit-label': 'Observer unit',
  'memoir.intrinsic': 'Intrinsic maximum range',
  'memoir.effective': 'Effective maximum range',
  'memoir.los-required': 'LOS required for ordinary attacks',
  'memoir.required': 'Yes',
  'memoir.exempt': 'No — artillery LOS exemption',
  'memoir.exemption-badge': 'A',
  'memoir.artillery-note':
    'Artillery LOS exemption: physical LOS remains blocked. Being in range does not certify a legal attack.',
  'memoir.summary': 'Obstruction explanations',
  'memoir.exact': 'Exact evidence and semantic data',
  'memoir.raw': 'Semantic records (technical details)',
  'memoir44.intrinsic-range':
    'The {unitType} observer has intrinsic range {intrinsicMaximum}; user cap: {userCap}; effective maximum: {effectiveMaximum}.',
  'memoir44.inspection-not-attack':
    'This is visibility/range inspection, not an attack-legality assessment.',
  'memoir44.artillery-los-not-required':
    'Standard artillery does not require LOS for ordinary attacks. Physical LOS is preserved separately.',
  'memoir44.self-inspection':
    'Self-inspection is clear and in range; it is not an attack.',
  'memoir44.endpoint-exempt':
    'Origin and target elements are exempt from intervening-obstruction checks.',
  'memoir44.nonblocking-element':
    'This element is transparent for physical LOS.',
  'memoir44.bare-hill-exempt':
    'Bare hill terrain is exempt between two elevated endpoints; units or bunkers on that hill are evaluated separately.',
  'memoir44.lower-obstruction-exempt':
    'This obstruction is below both endpoints and is ignored by the 2025 elevation rule.',
  'memoir44.interior-obstruction':
    'An eligible obstruction intersects the strict interior of its cell and blocks physical LOS.',
  'memoir44.one-sided-boundary':
    'Only one side has eligible boundary obstructions; this contact does not block by itself.',
  'memoir44.sided-vertex-obstruction':
    'This isolated vertex pairs with an eligible obstruction on the opposite side and blocks physical LOS.',
  'memoir44.sided-edge-obstruction':
    'This edge overlap pairs with an eligible obstruction on the opposite side and blocks physical LOS.',
  'memoir44.opposite-boundary-obstructions':
    'Eligible boundary obstructions occur on both sides anywhere along the sightline. Their intervals need not overlap. Positive side: {positiveIds}. Negative side: {negativeIds}.',
  'memoir44.vertex-modeling-convention':
    'Isolated vertices use the GordosHex sided-obstruction modeling convention, not an official publisher ruling.',
  'memoir44.physical-los':
    'Physical obstructions: {blocked}. Invalid board membership: {invalidatingMembership}.',
  'memoir44.absent-positive-contact':
    'The sightline has positive-length contact with an absent intermediate cell. It is invalid under the GordosHex arbitrary-board convention.',
  'memoir44.absent-vertex-ignored':
    'An absent singleton vertex contact is ignored under the GordosHex arbitrary-board convention.',
  'memoir44.observer-unit-required':
    'The observer cell needs a supported standard unit. Place one here or choose an occupied cell as observer.',
  'memoir44.unsupported-configuration':
    'This supported subset accepts no scenario overrides or configuration options.',
  'memoir44.unsupported-terrain':
    'Unsupported terrain; only the listed 2025 base-core subset is accepted.',
  'memoir44.multiple-base-terrains':
    'Invalid stack: a cell may have only one base terrain.',
  'memoir44.unsupported-installation':
    'Unsupported installation; only the listed installations are accepted.',
  'memoir44.duplicate-installation':
    'Invalid stack: duplicate installation type.',
  'memoir44.unsupported-unit':
    'Unsupported unit or variant; only standard Infantry, Armor and Artillery are accepted.',
  'memoir44.invalid-unit-side': 'Unit affiliation must be Allies or Axis.',
  'memoir44.multiple-units': 'Invalid stack: a cell may contain only one unit.',
  'memoir44.unsupported-entity-kind':
    'Unsupported entity kind for this Memoir subset.',
  'memoir44.invalid-payload':
    'Invalid entity payload for the supported Memoir schema.',
  'memoir44.unsupported-edge-features':
    'Shared-edge features are unsupported in Memoir mode; the generic workspace retains its own features.',
  'input.memoir-mode': 'Memoir painting requires the Memoir workspace.',
  'input.generic-mode': 'Generic elements require the generic workspace.',
  'input.switch-workspace':
    'Switch using the ruleset selector to restore a separate compatible working board.',
  'memoir.message-unavailable':
    'An additional ruleset explanation is unavailable. See exact semantic details.',
  'memoir.yes': 'Yes',
  'memoir.no': 'No',
});
