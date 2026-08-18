import './style.css'
import * as THREE from 'three'

const researchNotes = [
  {
    title: 'Ernst Haeckel — Kunstformen der Natur',
    url: 'https://www.biodiversitylibrary.org/item/84529',
    note: 'Public-domain plates made radiolaria famous for porous silica shells, spines, and repeating radial ornament.'
  },
  {
    title: 'Ernst Haeckel — Report on Radiolaria (1887)',
    url: 'https://www.biodiversitylibrary.org/bibliography/15774',
    note: 'Foundational taxonomy describing medullary shells, cortical shells, and spine systems that translate well into lamp geometry.'
  },
  {
    title: 'Radiolaria.org morphological atlas',
    url: 'https://www.radiolaria.org/',
    note: 'A living morphology reference for spherical Spumellaria, elongated Nassellaria, and spine-heavy radiolarian silhouettes.'
  }
]

const projectNotes = [
  {
    title: 'palletorsson/AdaResearch radiolaria generator',
    url: 'https://github.com/palletorsson/AdaResearch/tree/main/algorithms/computationalbiology/radiolaria',
    note: 'A procedural Godot study with concentric shell layers, spines, and multiple radiolarian archetypes.'
  },
  {
    title: 'merrypranxter/botanical_illustration',
    url: 'https://github.com/merrypranxter/botanical_illustration',
    note: 'A Three.js shader gallery that recreates Haeckel-inspired radiolaria plate compositions with live controls.'
  },
  {
    title: 'Bernotat & Co — Radiolaria Lamp',
    url: 'https://www.arch2o.com/radiolaria-lamp-bernotat-co-design-studio/',
    note: 'A published lamp precedent that validates radiolaria shell language at architectural lighting scale.'
  }
]

const morphologyDescriptions = {
  spumellaria: 'More spherical, evenly distributed shell growth with balanced pores.',
  nassellaria: 'Axially stretched, lantern-like bodies inspired by conical radiolaria.',
  acantharia: 'More spine-driven silhouettes with stronger radial protrusions.'
}

const parameterDefinitions = [
  {
    key: 'morphology',
    label: 'Morphology family',
    type: 'select',
    options: [
      ['spumellaria', 'Spumellaria'],
      ['nassellaria', 'Nassellaria'],
      ['acantharia', 'Acantharia']
    ]
  },
  {
    key: 'seed',
    label: 'Seed',
    type: 'range',
    min: 1,
    max: 99,
    step: 1
  },
  {
    key: 'bodyRadius',
    label: 'Body radius (mm)',
    type: 'range',
    min: 70,
    max: 170,
    step: 1
  },
  {
    key: 'shellThickness',
    label: 'Shell thickness (mm)',
    type: 'range',
    min: 1.2,
    max: 4.5,
    step: 0.1
  },
  {
    key: 'axialStretch',
    label: 'Axial stretch',
    type: 'range',
    min: 0.8,
    max: 1.8,
    step: 0.01
  },
  {
    key: 'symmetry',
    label: 'Symmetry order',
    type: 'range',
    min: 3,
    max: 12,
    step: 1
  },
  {
    key: 'spikeCount',
    label: 'Spike bands',
    type: 'range',
    min: 4,
    max: 18,
    step: 1
  },
  {
    key: 'spikeLength',
    label: 'Spike length',
    type: 'range',
    min: 0,
    max: 0.55,
    step: 0.01
  },
  {
    key: 'poreScale',
    label: 'Pore frequency',
    type: 'range',
    min: 4,
    max: 24,
    step: 1
  },
  {
    key: 'poreDepth',
    label: 'Pore depth',
    type: 'range',
    min: 0,
    max: 0.28,
    step: 0.01
  }
]

const state = {
  morphology: 'spumellaria',
  seed: 19,
  bodyRadius: 108,
  shellThickness: 2.4,
  axialStretch: 1.12,
  symmetry: 7,
  spikeCount: 11,
  spikeLength: 0.18,
  poreScale: 12,
  poreDepth: 0.1
}

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <aside class="panel controls-panel">
      <div class="panel-header">
        <p class="eyebrow">Radiolaria lamp lab</p>
        <h1>Procedural lamp shell generator</h1>
        <p class="lede">A Three.js single-page study that turns radiolaria shell traits into printable lamp parameters.</p>
      </div>
      <form id="controls" class="controls"></form>
      <div class="hint-card">
        <h2>Fabrication heuristic</h2>
        <p id="fabricationHint"></p>
      </div>
    </aside>
    <main class="viewer-panel">
      <section class="viewer-card">
        <div class="viewer-heading">
          <div>
            <p class="eyebrow">Live preview</p>
            <h2 id="morphologyTitle"></h2>
          </div>
          <div class="stat-grid" id="summaryStats"></div>
        </div>
        <div id="viewer" class="viewer"></div>
      </section>
    </main>
    <aside class="panel notes-panel">
      <section class="note-section">
        <p class="eyebrow">Research inputs</p>
        <h2>Radiolaria cues</h2>
        <div id="researchList" class="card-list"></div>
      </section>
      <section class="note-section">
        <p class="eyebrow">Existing projects</p>
        <h2>Useful precedents</h2>
        <div id="projectList" class="card-list"></div>
      </section>
    </aside>
  </div>
`

const controlsForm = document.querySelector('#controls')
const summaryStats = document.querySelector('#summaryStats')
const fabricationHint = document.querySelector('#fabricationHint')
const morphologyTitle = document.querySelector('#morphologyTitle')
const viewerElement = document.querySelector('#viewer')

const rangeValueTargets = new Map()

for (const definition of parameterDefinitions) {
  const field = document.createElement('label')
  field.className = 'control'

  const labelRow = document.createElement('div')
  labelRow.className = 'control-label'

  const label = document.createElement('span')
  label.textContent = definition.label
  labelRow.appendChild(label)

  if (definition.type === 'range') {
    const value = document.createElement('output')
    value.id = `${definition.key}Value`
    labelRow.appendChild(value)
    rangeValueTargets.set(definition.key, value)
  }

  field.appendChild(labelRow)

  let input

  if (definition.type === 'select') {
    input = document.createElement('select')
    input.name = definition.key

    for (const [optionValue, optionLabel] of definition.options) {
      const option = document.createElement('option')
      option.value = optionValue
      option.textContent = optionLabel
      input.appendChild(option)
    }
  } else {
    input = document.createElement('input')
    input.type = 'range'
    input.name = definition.key
    input.min = definition.min
    input.max = definition.max
    input.step = definition.step
  }

  input.value = state[definition.key]
  input.addEventListener('input', handleControlChange)
  field.appendChild(input)
  controlsForm.appendChild(field)
}

function renderLinkCards(target, items) {
  target.innerHTML = items
    .map(
      (item) => `
        <article class="note-card">
          <h3><a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a></h3>
          <p>${item.note}</p>
        </article>
      `
    )
    .join('')
}

renderLinkCards(document.querySelector('#researchList'), researchNotes)
renderLinkCards(document.querySelector('#projectList'), projectNotes)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
viewerElement.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x081018)

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
camera.position.set(0, 0.25, 7)

const shellGroup = new THREE.Group()
scene.add(shellGroup)

scene.add(new THREE.AmbientLight(0xf6f2e8, 1.2))

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
keyLight.position.set(4, 5, 6)
scene.add(keyLight)

const rimLight = new THREE.DirectionalLight(0x7fd3ff, 1.25)
rimLight.position.set(-5, -2, -4)
scene.add(rimLight)

const bulb = new THREE.PointLight(0xffd6a5, 12, 15, 1.2)
scene.add(bulb)

let shellMesh
let edgeLines
let glowMesh

function hashWave(seed, value) {
  return Math.sin(value * 1.341 + seed * 3.173) + Math.cos(value * 0.727 - seed * 2.411)
}

function buildGeometry(params) {
  const geometry = new THREE.SphereGeometry(1, 144, 96)
  const positions = geometry.attributes.position
  const seed = params.seed * 0.137
  const familySpikeBoost = params.morphology === 'acantharia' ? 1.35 : 1
  const shellScale = params.bodyRadius / 100
  const stretch = params.morphology === 'nassellaria' ? params.axialStretch : 1 + (params.axialStretch - 1) * 0.35

  for (let index = 0; index < positions.count; index += 1) {
    const vector = new THREE.Vector3().fromBufferAttribute(positions, index).normalize()
    const polar = Math.acos(THREE.MathUtils.clamp(vector.y, -1, 1))
    const azimuth = Math.atan2(vector.z, vector.x)

    const lobeField =
      0.08 * Math.sin(params.symmetry * azimuth + seed) * Math.sin((params.symmetry - 1) * polar - seed * 0.7) +
      0.035 * Math.cos((params.symmetry + 2) * polar + hashWave(seed, azimuth))

    const spikeField =
      0.5 +
      0.5 *
        Math.sin(params.spikeCount * azimuth - seed * 1.2) *
        Math.cos((params.spikeCount * 0.55 + 1.5) * polar + seed * 2.1)

    const poreField =
      0.5 +
      0.5 *
        Math.sin(params.poreScale * azimuth + seed * 2.6) *
        Math.sin((params.poreScale + 1) * polar - seed * 1.3)

    const crownBias =
      params.morphology === 'nassellaria'
        ? THREE.MathUtils.mapLinear(vector.y, -1, 1, 0.82, 1.24)
        : params.morphology === 'acantharia'
          ? 1 + 0.06 * Math.cos((params.symmetry + 1) * azimuth + seed)
          : 1

    const spikes = params.spikeLength * familySpikeBoost * Math.pow(Math.max(0, spikeField), 3.4)
    const pores = params.poreDepth * Math.pow(Math.max(0, poreField), 1.9)
    const radius = (1 + lobeField + spikes - pores) * crownBias

    positions.setXYZ(
      index,
      vector.x * radius * shellScale,
      vector.y * radius * shellScale * stretch,
      vector.z * radius * shellScale
    )
  }

  geometry.computeVertexNormals()
  return geometry
}

function disposeObject(object) {
  if (!object) {
    return
  }

  shellGroup.remove(object)
  object.geometry?.dispose()
  object.material?.dispose()
}

function estimatePorosity(params) {
  const raw = 18 + params.poreScale * 1.55 + params.poreDepth * 110 - params.shellThickness * 4.5 - params.spikeLength * 14
  return Math.max(12, Math.min(72, raw))
}

function updateSummary(params) {
  for (const [key, output] of rangeValueTargets) {
    const value = Number(params[key])
    output.value = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, '')
  }

  morphologyTitle.textContent = `${params.morphology[0].toUpperCase()}${params.morphology.slice(1)} shell`

  const overallHeight = Math.round(params.bodyRadius * params.axialStretch * 2.05)
  const opening = Math.max(18, Math.round(params.bodyRadius * 0.32 - params.shellThickness * 4))
  const porosity = Math.round(estimatePorosity(params))

  summaryStats.innerHTML = `
    <div class="stat"><span>Height</span><strong>${overallHeight} mm</strong></div>
    <div class="stat"><span>Opening</span><strong>${opening} mm</strong></div>
    <div class="stat"><span>Porosity</span><strong>${porosity}%</strong></div>
    <div class="stat"><span>Shell</span><strong>${params.shellThickness.toFixed(1)} mm</strong></div>
  `

  const warnings = []
  if (params.shellThickness < 1.8) {
    warnings.push('Increase shell thickness for FDM printing or larger spans.')
  }
  if (params.spikeLength > 0.3) {
    warnings.push('Long spines may need to be softened for post-processing durability.')
  }
  if (porosity > 58) {
    warnings.push('High porosity improves glow but may reduce rigidity near the equator.')
  }
  if (warnings.length === 0) {
    warnings.push('This configuration balances light transmission and structural continuity for a first prototype.')
  }

  fabricationHint.textContent = `${morphologyDescriptions[params.morphology]} ${warnings.join(' ')}`
}

function updateScene() {
  const geometry = buildGeometry(state)

  disposeObject(shellMesh)
  disposeObject(edgeLines)
  disposeObject(glowMesh)

  shellMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xd8d3c6,
      roughness: 0.6,
      metalness: 0.05,
      transmission: 0.12,
      thickness: state.shellThickness / 10,
      clearcoat: 0.2
    })
  )

  edgeLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 30),
    new THREE.LineBasicMaterial({ color: 0x7f97a8, transparent: true, opacity: 0.35 })
  )

  glowMesh = new THREE.Mesh(
    new THREE.SphereGeometry((state.bodyRadius / 100) * 0.55, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd8ac,
      transparent: true,
      opacity: Math.max(0.18, 0.44 - state.shellThickness * 0.05)
    })
  )

  shellGroup.add(shellMesh)
  shellGroup.add(edgeLines)
  shellGroup.add(glowMesh)
  bulb.intensity = 8 + estimatePorosity(state) * 0.12

  updateSummary(state)
}

function handleControlChange(event) {
  const { name, value } = event.target
  const definition = parameterDefinitions.find((entry) => entry.key === name)
  state[name] = definition.type === 'select' ? value : Number(value)
  updateScene()
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = viewerElement
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resizeRenderer)

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()
  shellGroup.rotation.y = elapsed * 0.25
  shellGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.12
  renderer.render(scene, camera)
}

resizeRenderer()
updateScene()
animate()
