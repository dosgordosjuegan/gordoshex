import type { VisibilityResult, BoardEntity } from '../src/application.js';
import { t } from './format.js';
import { hasTranslation } from './i18n.js';
import { presentation, type CellStyle } from './evaluation.js';
const label = (key: string): string =>
  hasTranslation(key) ? t(key) : t('memoir.unsupported-entity');
export function entityLabel(entity: BoardEntity): string {
  const type = entity.properties.type;
  if (entity.kind === 'memoir44.unit')
    return `${label(`memoir.side.${String(entity.properties.side)}`)} ${label(`memoir.unit.${String(type)}`)}`;
  if (entity.kind === 'memoir44.terrain')
    return label(`memoir.terrain.${String(type)}`);
  if (entity.kind === 'memoir44.obstacle')
    return label(`memoir.installation.${String(type)}`);
  return t(`element.${entity.kind}`);
}
export function memoirFacts(result: VisibilityResult | undefined): {
  unitType: string;
  intrinsic: string;
  cap: string;
  effective: string;
  losRequired: boolean;
} | null {
  if (
    result?.status !== 'evaluated' ||
    result.context.ruleset.id !== 'memoir44.refresh2025'
  )
    return null;
  const args = result.range.explanations.find(
    (m) => m.code === 'memoir44.intrinsic-range',
  )?.arguments;
  if (
    !args ||
    typeof args.unitType !== 'string' ||
    typeof args.intrinsicMaximum !== 'string' ||
    typeof args.userCap !== 'string' ||
    typeof args.effectiveMaximum !== 'string'
  )
    return null;
  return {
    unitType: args.unitType,
    intrinsic: args.intrinsicMaximum,
    cap: args.userCap,
    effective: args.effectiveMaximum,
    losRequired: !result.los.explanations.some(
      (m) => m.code === 'memoir44.artillery-los-not-required',
    ),
  };
}
/** An extra presentation annotation; it never changes LOS, range or visible. */
export function artilleryAnnotation(
  result: VisibilityResult | undefined,
): boolean {
  return (
    result?.status === 'evaluated' &&
    result.los.status === 'blocked' &&
    memoirFacts(result)?.losRequired === false
  );
}

/** Memoir board colors project range/LOS requirements, never attack legality or physical visibility. */
export function memoirPresentation(
  result: VisibilityResult | undefined,
): CellStyle | 'requirements-met' {
  const ordinary = presentation(result);
  if (
    result?.status !== 'evaluated' ||
    result.context.ruleset.id !== 'memoir44.refresh2025'
  )
    return ordinary;
  if (
    ordinary === 'visible' ||
    (ordinary === 'blocked' && memoirFacts(result)?.losRequired === false)
  )
    return 'requirements-met';
  return ordinary;
}
export function showArtilleryBadge(
  result: VisibilityResult | undefined,
): boolean {
  return (
    memoirPresentation(result) === 'requirements-met' &&
    artilleryAnnotation(result)
  );
}
