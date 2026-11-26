import * as g from '../../src/index.js';
export const fixtureRows: readonly (readonly [
  bigint,
  bigint,
  string,
  string,
  string,
  number,
])[][] = [
  [
    [0n, 0n, 'interior', '0/1', '1/4', 0],
    [1n, 0n, 'interior', '1/4', '3/4', 0],
    [2n, 0n, 'interior', '3/4', '1/1', 0],
  ],
  [
    [0n, 0n, 'interior', '0/1', '1/3', 0],
    [1n, -1n, 'edge-overlap', '1/3', '2/3', -1],
    [1n, 0n, 'edge-overlap', '1/3', '2/3', 1],
    [2n, -1n, 'interior', '2/3', '1/1', 0],
  ],
  [
    [0n, 0n, 'interior', '0/1', '1/9', 0],
    [1n, 0n, 'interior', '1/9', '1/3', -1],
    [1n, 1n, 'isolated-vertex', '1/3', '1/3', 1],
    [2n, 0n, 'interior', '1/3', '1/2', -1],
    [2n, 1n, 'interior', '1/2', '2/3', 1],
    [3n, 0n, 'isolated-vertex', '2/3', '2/3', -1],
    [3n, 1n, 'interior', '2/3', '8/9', 1],
    [4n, 1n, 'interior', '8/9', '1/1', 0],
  ],
  [
    [0n, 0n, 'interior', '0/1', '1/7', 0],
    [1n, 0n, 'interior', '1/7', '2/5', -1],
    [1n, 1n, 'interior', '2/5', '1/2', 1],
    [2n, 0n, 'interior', '1/2', '3/5', -1],
    [2n, 1n, 'interior', '3/5', '6/7', 1],
    [3n, 1n, 'interior', '6/7', '1/1', 0],
  ],
];
export const fixtureTargets = [
  g.axial(2n, 0n),
  g.axial(2n, -1n),
  g.axial(4n, 1n),
  g.axial(3n, 1n),
];
