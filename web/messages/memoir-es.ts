import type { memoirEn } from './memoir-en.js';
export const memoirEs = Object.freeze({
  'memoir44.refresh2025': "Memoir '44 2025 · subconjunto compatible",
  'memoir.profile-note':
    "Memoir '44, edición renovada de 2025: subconjunto compatible · tablero independiente · solo inspección, no legalidad de ataques. Sin respaldo oficial.",
  'memoir.no-cap': 'Sin límite adicional de alcance',
  'memoir.range-cap': 'Límite adicional de alcance (inclusivo)',
  'memoir.palette': 'Paleta de edición de Memoir',
  'memoir.tab.terrain': 'Paleta de terreno',
  'memoir.tab.unit': 'Paleta de unidades',
  'memoir.tab.installation': 'Paleta de instalaciones',
  'memoir.affiliation': 'Bando de la unidad',
  'memoir.side.allies': 'Aliados',
  'memoir.side.axis': 'Eje',
  'memoir.unit.infantry': 'Infantería',
  'memoir.unit.armor': 'Blindados',
  'memoir.unit.artillery': 'Artillería',
  'memoir.terrain.open': 'Campo abierto',
  'memoir.terrain.forest': 'Bosque',
  'memoir.terrain.hedgerow': 'Setos',
  'memoir.terrain.town': 'Pueblo',
  'memoir.terrain.church': 'Iglesia',
  'memoir.terrain.hill': 'Colina',
  'memoir.terrain.river': 'Río',
  'memoir.terrain.ocean': 'Océano',
  'memoir.terrain.beach': 'Playa',
  'memoir.terrain.bridge': 'Puente',
  'memoir.installation.bunker': 'Búnker',
  'memoir.installation.hedgehog': 'Erizo antitanque',
  'memoir.installation.sandbags': 'Sacos de arena',
  'memoir.installation.wire': 'Alambre de púas',
  'memoir.installation.sea-wall': 'Malecón',
  'memoir.paint': 'Pintar',
  'memoir.place': 'Colocar',
  'memoir.erase': 'Quitar',
  'memoir.clear-terrain': 'Quitar terreno: dejar campo abierto implícito',
  'memoir.remove-unit': 'Quitar solo la unidad',
  'memoir.paint-hint':
    'Elige una herramienta y haz clic en las casillas para pintar. Arrastrar siempre desplaza. Reemplazar terreno o unidades conserva las otras capas.',
  'memoir.use-observer': 'Usar esta unidad como observador',
  'memoir.observer-hint':
    'Coloca aquí una unidad compatible antes de usar la casilla como observador. Los objetivos vacíos y aliados siguen siendo válidos para inspección.',
  'memoir.implicit-open': 'Campo abierto implícito',
  'memoir.invalid-cell':
    'Datos de casilla no válidos o no compatibles; no hay un resultado de visibilidad válido.',
  'memoir.unsupported-entity': 'Elemento no compatible',
  'memoir.legend':
    'A/X = Aliados/Eje. Símbolos de unidad: cruz = Infantería, óvalo = Blindados, punto = Artillería. Marca verde = se cumplen los requisitos de alcance y línea de visión, incluida la exención de Artillería señalada con A. Gris = fuera de alcance. La inspección separa la línea de visión física de la visibilidad del motor. Ni el verde ni la A certifican un ataque legal.',
  'memoir.legend.visible': 'Cumple alcance y línea de visión',
  'memoir.status.requirements-met': 'Cumple alcance y línea de visión',
  'memoir.legend.blocked': 'Requiere línea de visión y está bloqueada',
  'memoir.legend.out-of-range': 'Fuera del alcance efectivo del arma',
  'memoir.unit-label': 'Unidad observadora',
  'memoir.intrinsic': 'Alcance máximo propio',
  'memoir.effective': 'Alcance máximo efectivo',
  'memoir.los-required': '¿Requiere línea de visión para ataques ordinarios?',
  'memoir.required': 'Sí',
  'memoir.exempt': 'No: exención de línea de visión de Artillería',
  'memoir.exemption-badge': 'A',
  'memoir.artillery-note':
    'Exención de Artillería: la línea de visión física sigue bloqueada. Estar dentro del alcance no certifica un ataque legal.',
  'memoir.summary': 'Explicaciones de las obstrucciones',
  'memoir.exact': 'Evidencia exacta y datos semánticos',
  'memoir.raw': 'Registros semánticos (detalles técnicos)',
  'memoir44.intrinsic-range':
    'La unidad observadora de {unitType} tiene alcance propio {intrinsicMaximum}; límite del usuario: {userCap}; máximo efectivo: {effectiveMaximum}.',
  'memoir44.inspection-not-attack':
    'Esta es una inspección de visibilidad y alcance, no una evaluación de legalidad de ataques.',
  'memoir44.artillery-los-not-required':
    'La Artillería estándar no necesita línea de visión para ataques ordinarios. La línea de visión física se conserva por separado.',
  'memoir44.self-inspection':
    'La inspección de la propia casilla está despejada y dentro del alcance; no es un ataque.',
  'memoir44.endpoint-exempt':
    'Los elementos del origen y del objetivo se excluyen al comprobar las obstrucciones intermedias.',
  'memoir44.nonblocking-element':
    'Este elemento es transparente para la línea de visión física.',
  'memoir44.bare-hill-exempt':
    'Una colina sin otros elementos queda exenta entre dos extremos elevados; sus unidades y búnkeres se evalúan por separado.',
  'memoir44.lower-obstruction-exempt':
    'Esta obstrucción está por debajo de ambos extremos y se ignora según la regla de elevación de 2025.',
  'memoir44.interior-obstruction':
    'Una obstrucción aplicable intersecta el interior estricto de su casilla y bloquea la línea de visión física.',
  'memoir44.one-sided-boundary':
    'Solo un lado tiene obstrucciones aplicables en el borde; este contacto no bloquea por sí solo.',
  'memoir44.sided-vertex-obstruction':
    'Este vértice aislado se combina con una obstrucción aplicable del lado opuesto y bloquea la línea de visión física.',
  'memoir44.sided-edge-obstruction':
    'Este contacto con un lado se combina con una obstrucción aplicable del lado opuesto y bloquea la línea de visión física.',
  'memoir44.opposite-boundary-obstructions':
    'Hay obstrucciones aplicables en ambos lados de la línea de visión, en cualquier punto. Sus intervalos no tienen que coincidir. Lado positivo: {positiveIds}. Lado negativo: {negativeIds}.',
  'memoir44.vertex-modeling-convention':
    'Los vértices aislados usan la convención de obstrucción por lados de GordosHex; no es una resolución oficial de la editorial.',
  'memoir44.physical-los':
    'Obstrucciones físicas: {blocked}. Pertenencia no válida al tablero: {invalidatingMembership}.',
  'memoir44.absent-positive-contact':
    'La línea de visión tiene contacto de longitud positiva con una casilla intermedia ausente. No es válida según la convención de GordosHex para tableros arbitrarios.',
  'memoir44.absent-vertex-ignored':
    'Se ignora el contacto con un único vértice ausente según la convención de GordosHex para tableros arbitrarios.',
  'memoir44.observer-unit-required':
    'La casilla observadora necesita una unidad estándar compatible. Coloca una aquí o elige una casilla ocupada como observador.',
  'memoir44.unsupported-configuration':
    'Este subconjunto no admite ajustes de escenario ni opciones de configuración.',
  'memoir44.unsupported-terrain':
    'Terreno no compatible; solo se admite el subconjunto básico de 2025 indicado.',
  'memoir44.multiple-base-terrains':
    'Pila no válida: cada casilla solo puede tener un terreno base.',
  'memoir44.unsupported-installation':
    'Instalación no compatible; solo se admiten las indicadas.',
  'memoir44.duplicate-installation':
    'Pila no válida: tipo de instalación duplicado.',
  'memoir44.unsupported-unit':
    'Unidad o variante no compatible; solo se admiten Infantería, Blindados y Artillería estándar.',
  'memoir44.invalid-unit-side': 'El bando de la unidad debe ser Aliados o Eje.',
  'memoir44.multiple-units':
    'Pila no válida: cada casilla solo puede tener una unidad.',
  'memoir44.unsupported-entity-kind':
    'Tipo de elemento no compatible con este subconjunto de Memoir.',
  'memoir44.invalid-payload':
    'Datos del elemento no válidos para el esquema de Memoir compatible.',
  'memoir44.unsupported-edge-features':
    'Los elementos de lados compartidos no son compatibles con Memoir; el espacio genérico conserva los suyos.',
  'input.memoir-mode': 'Para pintar Memoir se requiere su espacio de trabajo.',
  'input.generic-mode':
    'Los elementos genéricos requieren el espacio de trabajo genérico.',
  'input.switch-workspace':
    'Usa el selector de reglas para recuperar el tablero independiente compatible.',
  'memoir.message-unavailable':
    'No está disponible una explicación adicional de las reglas. Consulta los detalles semánticos exactos.',
  'memoir.yes': 'Sí',
  'memoir.no': 'No',
}) satisfies Record<keyof typeof memoirEn, string>;
