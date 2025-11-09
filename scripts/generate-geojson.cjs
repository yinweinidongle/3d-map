const fs = require('fs');

const provinces = [
  { name: 'Beijing', center: [116.4074, 39.9042], radius: 1.0 },
  { name: 'Tianjin', center: [117.3616, 39.3434], radius: 0.8 },
  { name: 'Shanghai', center: [121.4737, 31.2304], radius: 0.9 },
  { name: 'Chongqing', center: [106.5516, 29.563], radius: 2.2 },
  { name: 'Hebei', center: [114.4698, 38.0371], radius: 2.6 },
  { name: 'Henan', center: [113.6654, 34.7579], radius: 2.4 },
  { name: 'Anhui', center: [117.283, 31.8612], radius: 2.0 },
  { name: 'Fujian', center: [119.2965, 26.0745], radius: 1.8 },
  { name: 'Gansu', center: [103.8343, 36.0611], radius: 3.2 },
  { name: 'Guangdong', center: [113.2644, 23.1291], radius: 2.3 },
  { name: 'Guangxi', center: [108.3275, 22.815], radius: 2.5 },
  { name: 'Guizhou', center: [106.7135, 26.5783], radius: 2.0 },
  { name: 'Hainan', center: [110.1999, 20.044], radius: 1.0 },
  { name: 'Heilongjiang', center: [126.5349, 45.8038], radius: 3.6 },
  { name: 'Hubei', center: [114.3055, 30.5928], radius: 2.3 },
  { name: 'Hunan', center: [112.9823, 28.1941], radius: 2.4 },
  { name: 'Jiangsu', center: [118.7969, 32.0603], radius: 2.0 },
  { name: 'Jiangxi', center: [115.8922, 28.6765], radius: 2.2 },
  { name: 'Jilin', center: [125.3257, 43.8965], radius: 2.8 },
  { name: 'Liaoning', center: [123.4315, 41.8057], radius: 2.4 },
  { name: 'Qinghai', center: [101.7782, 36.6171], radius: 3.0 },
  { name: 'Shaanxi', center: [108.9398, 34.3416], radius: 2.5 },
  { name: 'Shandong', center: [117.0009, 36.6758], radius: 2.4 },
  { name: 'Shanxi', center: [112.5489, 37.8706], radius: 2.2 },
  { name: 'Sichuan', center: [104.0668, 30.5728], radius: 3.0 },
  { name: 'Yunnan', center: [102.7103, 25.0453], radius: 2.8 },
  { name: 'Zhejiang', center: [120.1551, 30.2741], radius: 1.9 },
  { name: 'Inner Mongolia', center: [111.7492, 40.8426], radius: 3.4 },
  { name: 'Ningxia', center: [106.2309, 38.4872], radius: 1.8 },
  { name: 'Xinjiang', center: [87.6271, 43.793], radius: 5.0 },
  { name: 'Tibet', center: [91.1175, 29.6473], radius: 4.2 },
  { name: 'Hong Kong', center: [114.1694, 22.3193], radius: 0.6 },
  { name: 'Macau', center: [113.5439, 22.1987], radius: 0.4 },
  { name: 'Taiwan', center: [121.5654, 25.033], radius: 1.8 }
];

const steps = 64;

const features = provinces.map(({ name, center: [lon, lat], radius }) => {
  const coordinates = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const x = lon + Math.cos(theta) * radius;
    const y = lat + Math.sin(theta) * radius * 0.8;
    coordinates.push([x, y]);
  }
  return {
    type: 'Feature',
    properties: {
      name,
      center: [lon, lat],
      radius
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };
});

const collection = {
  type: 'FeatureCollection',
  features
};

fs.writeFileSync(
  require('path').join(__dirname, '..', 'src', 'assets', 'china-provinces.geojson'),
  JSON.stringify(collection, null, 2)
);
