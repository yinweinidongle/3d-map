import './style.css';

import {
  AmbientLight,
  BufferGeometry,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const GLOBE_RADIUS = 5;
const PILLAR_BASE_HEIGHT = 0.9;
const PILLAR_HEIGHT_SCALE = 0.35;
const DEG2RAD = Math.PI / 180;

const container = document.getElementById('app');

if (!container) {
  throw new Error('Missing #app container');
}

const scene = new Scene();
scene.background = new Color('#02030c');

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 14);

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

container.innerHTML = '';
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.4;
controls.minDistance = 8;
controls.maxDistance = 24;

const ambientLight = new AmbientLight('#3d4b6a', 0.6);
scene.add(ambientLight);

const sunLight = new DirectionalLight('#8fb5ff', 1.2);
sunLight.position.set(6, 8, 3);
scene.add(sunLight);

// Globe material with gradient shading and subtle emissive pulse
type PulseUniform = { value: number };

let globePulseUniform: PulseUniform | null = null;

const pillarPulseUniforms: Array<{
  material: MeshStandardMaterial;
  uniform: PulseUniform;
  amplitude: number;
  speed: number;
}> = [];

const clock = new Clock();

function configureGlobeMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.0
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.gradientTopColor = { value: new Color('#1d4c8f') };
    shader.uniforms.gradientBottomColor = { value: new Color('#0b1b3a') };
    shader.uniforms.gradientPulse = { value: 0 };

    if (!shader.vertexShader.includes('vGradientUv')) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nvarying vec2 vGradientUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvGradientUv = uv;');
    }

    if (!shader.fragmentShader.includes('gradientTopColor')) {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <uv_pars_fragment>',
          '#include <uv_pars_fragment>\nvarying vec2 vGradientUv;\nuniform vec3 gradientTopColor;\nuniform vec3 gradientBottomColor;\nuniform float gradientPulse;'
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        diffuseColor.rgb = mix(gradientBottomColor, gradientTopColor, vGradientUv.y);
      `
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        vec3 emissiveGradient = mix(gradientBottomColor, gradientTopColor, vGradientUv.y);
        totalEmissiveRadiance += emissiveGradient * (1.0 + gradientPulse);
      `
        );
    }

    globePulseUniform = shader.uniforms.gradientPulse as PulseUniform;
  };

  material.needsUpdate = true;

  return material;
}

function configurePillarMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.gradientTopColor = { value: new Color('#9bf6ff') };
    shader.uniforms.gradientBottomColor = { value: new Color('#31c6ff') };
    shader.uniforms.gradientPulse = { value: 0 };

    if (!shader.vertexShader.includes('vGradientUv')) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nvarying vec2 vGradientUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvGradientUv = uv;');
    }

    if (!shader.fragmentShader.includes('gradientTopColor')) {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <uv_pars_fragment>',
          '#include <uv_pars_fragment>\nvarying vec2 vGradientUv;\nuniform vec3 gradientTopColor;\nuniform vec3 gradientBottomColor;\nuniform float gradientPulse;'
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        diffuseColor.rgb = mix(gradientBottomColor, gradientTopColor, vGradientUv.y);
      `
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        vec3 emissiveGradient = mix(gradientBottomColor, gradientTopColor, vGradientUv.y);
        totalEmissiveRadiance += emissiveGradient * (0.6 + gradientPulse);
      `
        );
    }

    const pulseUniform = shader.uniforms.gradientPulse as PulseUniform;
    const existing = pillarPulseUniforms.find((entry) => entry.material === material);

    if (existing) {
      existing.uniform = pulseUniform;
    } else {
      pillarPulseUniforms.push({ material, uniform: pulseUniform, amplitude: 0.4, speed: 0.8 });
    }
  };

  material.needsUpdate = true;

  return material;
}

const globeMaterial = configureGlobeMaterial();

const globeGeometry = new SphereGeometry(GLOBE_RADIUS, 128, 128);
const globeMesh = new Mesh(globeGeometry, globeMaterial);
scene.add(globeMesh);

const boundaryGroup = new Group();
boundaryGroup.name = 'Province Boundaries';
scene.add(boundaryGroup);

const pillarGroup = new Group();
pillarGroup.name = 'Province Pillars';
scene.add(pillarGroup);

const boundaryMaterial = new LineBasicMaterial({ color: '#7ec8ff', transparent: true, opacity: 0.75 });

interface ProvinceFeature {
  type: 'Feature';
  properties: {
    name: string;
    center: [number, number];
    radius: number;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: ProvinceFeature[];
}

async function loadGeoJSON(): Promise<FeatureCollection> {
  const response = await fetch(new URL('./assets/china-provinces.geojson', import.meta.url));
  if (!response.ok) {
    throw new Error(`Failed to load provinces GeoJSON: ${response.status}`);
  }
  return response.json();
}

function lonLatToVector3(lon: number, lat: number, radius: number): Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon + 180) * DEG2RAD;
  const sinPhi = Math.sin(phi);

  const x = -radius * sinPhi * Math.cos(theta);
  const z = radius * sinPhi * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new Vector3(x, y, z);
}

function addProvinceBoundaries(feature: ProvinceFeature): void {
  const { coordinates } = feature.geometry;
  coordinates.forEach((ring) => {
    const points = ring.map(([lon, lat]) => lonLatToVector3(lon, lat, GLOBE_RADIUS + 0.02));
    const geometry = new BufferGeometry().setFromPoints(points);
    const line = new Line(geometry, boundaryMaterial);
    boundaryGroup.add(line);
  });
}

function addProvincePillar(feature: ProvinceFeature): void {
  const [lon, lat] = feature.properties.center;
  const radius = feature.properties.radius;
  const height = PILLAR_BASE_HEIGHT + radius * PILLAR_HEIGHT_SCALE;

  const pillarMaterial = configurePillarMaterial();

  const geometry = new CylinderGeometry(0.08, 0.12, height, 24, 1, true);
  geometry.translate(0, height / 2, 0);

  const normal = lonLatToVector3(lon, lat, 1).normalize();
  const position = lonLatToVector3(lon, lat, GLOBE_RADIUS + 0.05);
  position.addScaledVector(normal, height / 2);

  const quaternion = new Quaternion();
  quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal);

  const pillarMesh = new Mesh(geometry, pillarMaterial);
  pillarMesh.position.copy(position);
  pillarMesh.quaternion.copy(quaternion);

  pillarGroup.add(pillarMesh);
}

(async function init() {
  try {
    const geojson = await loadGeoJSON();
    geojson.features.forEach((feature) => {
      addProvinceBoundaries(feature);
      addProvincePillar(feature);
    });
  } catch (error) {
    console.error(error);
  }
})();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (globePulseUniform) {
    globePulseUniform.value = Math.sin(elapsed * 0.2) * 0.08;
  }

  pillarPulseUniforms.forEach((entry) => {
    entry.uniform.value = Math.sin(elapsed * entry.speed) * entry.amplitude;
  });

  boundaryGroup.rotation.y += 0.0006;
  pillarGroup.rotation.y += 0.0006;
  globeMesh.rotation.y += 0.0004;
  controls.update();
  renderer.render(scene, camera);
}

animate();
