/**
 * Remove the 'applications' key from the manifest because Chrome cant handle foreign keys in the manifest
 */

const fs = require('fs');
const path = require('path');

const pathToManifest = path.resolve(`dist-chrome/manifest.json`);

console.log('=====================================')
console.log('Running manifest chromifier')

fs.access(pathToManifest, (err) => {
  if (err) {
    console.log('Manifest does not exist in Chrome build folder');
  } else {
    let manifest = fs.readFileSync(pathToManifest, 'utf-8');
    manifest = JSON.parse(manifest);
    delete manifest.applications;
    fs.writeFileSync(pathToManifest, JSON.stringify(manifest, null, 4));
    console.log('Removed applications key from manifest');
  }
  console.log('=====================================');
});
