const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/([ \t]*)source: "meteorological-engine"/g, '$1],\n$1source: "meteorological-engine"');
code = code.replace(/([ \t]*)source: "gemini-3.8-flash"/g, '$1],\n$1source: "gemini-3.8-flash"');
code = code.replace(/([ \t]*)source: "meteorological-fallback"/g, '$1],\n$1source: "meteorological-fallback"');

// And we still have 163,9 error: Property assignment expected in server.ts
// Wait, I already fixed 160-170 earlier right? Let's check what happened to it.
fs.writeFileSync('server.ts', code);
