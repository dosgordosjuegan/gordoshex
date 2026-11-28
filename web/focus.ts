const scopes = [
  'memoir-palette',
  'contents',
  'edge-features',
  'target-inspection',
];
const focusable = 'button,input,select,summary,a[href]';
/** Restore logical controls across dynamic rendering, including language changes. */
export function preserveFocus(): () => void {
  const active = document.activeElement;
  const identity =
    active instanceof Element
      ? active.closest('[data-cell],[data-edge]')
      : null;
  const attribute = identity?.hasAttribute('data-edge')
    ? 'data-edge'
    : 'data-cell';
  const key = identity?.getAttribute(attribute);
  const scope = scopes
    .map((id) => document.getElementById(id))
    .find((node) => node?.contains(active));
  const members = scope
    ? [...scope.querySelectorAll<HTMLElement>(focusable)]
    : [];
  const index = members.findIndex((node) => node === active);
  const focusKey =
    active instanceof HTMLElement ? active.dataset.focusKey : undefined;
  const disclosures = [
    ...document.querySelectorAll<HTMLDetailsElement>(
      '#target-inspection details',
    ),
  ].map((node) => node.open);
  return () => {
    [
      ...document.querySelectorAll<HTMLDetailsElement>(
        '#target-inspection details',
      ),
    ].forEach((node, index) => {
      node.open = disclosures[index] ?? false;
    });
    if (active?.isConnected) return;
    if (key) {
      const node =
        [...document.querySelectorAll<SVGElement>(`[${attribute}]`)].find(
          (node) => node.getAttribute(attribute) === key,
        ) ?? document.getElementById('board');
      if (node instanceof SVGElement) node.focus({ preventScroll: true });
      return;
    }
    if (scope && index >= 0) {
      const next = [...scope.querySelectorAll<HTMLElement>(focusable)];
      const enabled = next.filter((node) => !node.matches(':disabled'));
      const entityPrefix = focusKey?.startsWith('element:')
        ? focusKey.slice(0, focusKey.lastIndexOf(':') + 1)
        : null;
      const chosen =
        (focusKey
          ? enabled.find((node) => node.dataset.focusKey === focusKey)
          : undefined) ??
        (entityPrefix
          ? enabled.find((node) =>
              node.dataset.focusKey?.startsWith(entityPrefix),
            )
          : undefined) ??
        enabled[Math.min(index, enabled.length - 1)];
      chosen?.focus({ preventScroll: true });
    }
  };
}
