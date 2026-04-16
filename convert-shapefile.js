const fs = require('fs');

// Install shapefile package and run conversion
const { execSync } = require('child_process');

execSync('npm install shapefile', { stdio: 'inherit' });

const shapefile = require('shapefile');

const TARGET_CITIES = [
  'Mesa', 'Gilbert', 'Chandler', 'Tempe',
  'Apache Junction', 'Queen Creek', 'San Tan Valley', 'Gold Canyon'
];

async function convert() {
  const features = [];

  const source = await shapefile.open('tl_2023_04_place.shp', 'tl_2023_04_place.dbf');

  let result = await source.read();
  while (!result.done) {
    const name = result.value.properties.NAME;
    if (TARGET_CITIES.includes(name)) {
      features.push({
        type: 'Feature',
        properties: { name: name, service: true },
        geometry: result.value.geometry
      });
      console.log('Found:', name);
    }
    result = await source.read();
  }

  const geojson = {
    type: 'FeatureCollection',
    features: features
  };

  fs.writeFileSync('service-area.geojson', JSON.stringify(geojson, null, 2));
  console.log('Done. Found', features.length, 'cities.');
  console.log('Cities found:', features.map(f => f.properties.name).join(', '));
}

convert().catch(console.error);
