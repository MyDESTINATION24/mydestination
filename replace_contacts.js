const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/9111384541/g, '8006787878');
  content = content.replace(/9111384535/g, '8006787878');
  content = content.replace(/9876543210/g, '8006787878');
  content = content.replace(/6232314147/g, '8006787878');
  content = content.replace(/9685974247/g, '8006787878');
  content = content.replace(/9424100424/g, '8006787878');
  content = content.replace(/91113\s84541/g, '80 06 787878');
  content = content.replace(/91113\s84535/g, '80 06 787878');
  content = content.replace(/rajnishpanchal\.fr@gmail\.com/g, 'care@mydestination.in');
  content = content.replace(/support@mydestination\.com/g, 'care@mydestination.in');
  content = content.replace(/mydestinationhub@gmail\.com/g, 'care@mydestination.in');
  content = content.replace(/partners@rokkooin\.com/g, 'care@mydestination.in');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
