const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const response = await ai\.models\.generateContent\(\{[\s\S]*?responseMimeType: "application\/json"[\s\S]*?\}\);/g;

code = code.replace(regex, `const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });`);

fs.writeFileSync('server.ts', code);
