import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        ,
              
            
        config: {
          responseMimeType: "application/json"
        }
      });`;

const replacement = `      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
