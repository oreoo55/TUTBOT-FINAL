const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'mockData.ts'), 'utf8');
const start = src.indexOf('const rawPlaces: RawPlace[] = [');
const startBracket = src.indexOf('[', start);
const end = src.indexOf('];', startBracket);
let dataStr = src.substring(startBracket, end + 1);

const lines = dataStr.split('\n');
let php = '<?php\n\nreturn [\n';

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('//')) continue;

  // Array open/close
  if (line === '[') { php += "    [\n"; continue; }
  if (line === ']') { php += "];\n"; continue; }
  if (line === '],') { php += "    ],\n"; continue; }

  // Object open
  if (line === '{') { php += "        [\n"; continue; }

  // Object close (with or without trailing comma)
  if (line === '}' || line === '},') { php += "        ],\n"; continue; }

  // Object close fused with array close (last entry)
  if (line === '}]') { php += "        ],\n];\n"; continue; }

  // Property with trailing comma
  const m1 = line.match(/^(\w+):\s*(.+),$/);
  if (m1) {
    let key = m1[1], val = m1[2].trim();
    val = val.replace(/\s*as\s+\w+/, '');
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
    if (key === 'Is_Outdoor') val = val === 'Yes' ? 'true' : 'false';
    else if (val !== 'true' && val !== 'false' && val !== 'null' && isNaN(val)) val = "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    php += `            '${key}' => ${val},\n`;
    continue;
  }

  // Property without trailing comma
  const m2 = line.match(/^(\w+):\s*(.+)$/);
  if (m2) {
    let key = m2[1], val = m2[2].trim();
    val = val.replace(/\s*as\s+\w+/, '');
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
    if (key === 'Is_Outdoor') val = val === 'Yes' ? 'true' : 'false';
    else if (val !== 'true' && val !== 'false' && val !== 'null' && isNaN(val)) val = "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    php += `            '${key}' => ${val},\n`;
    continue;
  }
}

fs.writeFileSync(path.join(__dirname, 'rawPlaces.php'), php);
console.log('Wrote rawPlaces.php');
