const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/tools: \[\s*\{\s*googleMaps: \{\}\s*\}\s*\],\s*config: \{/g, 'config: {\n          tools: [{ googleSearch: {} }],\n');

fs.writeFileSync('server.ts', code);
