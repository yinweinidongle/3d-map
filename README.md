# 3D China Globe Visualization

This project renders a 3D globe using [Three.js](https://threejs.org/) with the new Three Shader Language (TSL). It loads simplified vector boundaries for each province-level region of China and places glowing light pillars at the centroid of every region, oriented perpendicular to the sphere.

## Features

- 🌐 Interactive 3D globe with orbit controls and smooth camera damping
- 🗺️ Simplified province boundary lines projected from latitude/longitude data onto the globe surface
- 🔆 Animated TSL-powered glow for the globe shading and the province light pillars
- 📦 TypeScript + Vite project structure ready for local development

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open the printed URL (defaults to `http://localhost:5173`) to explore the visualization.

4. Build for production:

   ```bash
   npm run build
   ```

## Data

The repository ships with a generated `china-provinces.geojson` file under `src/assets/`. It contains simplified circular polygon approximations for every province-level region, along with centroid metadata used to position the light pillars. You can regenerate or replace this file with higher-fidelity boundaries if desired.

To regenerate the bundled GeoJSON (for example after adjusting province metadata) run:

```bash
node scripts/generate-geojson.cjs
```

## Notes

- The visualization relies on the latest Three.js node-based materials (TSL). Ensure the installed `three` package version matches the one declared in `package.json`.
- The light pillars are oriented via spherical normals so that each one stands perpendicular to the globe surface at the provincial centroid.
- Feel free to customize colors, animation speeds, or replace the simplified dataset with a detailed GeoJSON source to achieve production-quality visuals.
