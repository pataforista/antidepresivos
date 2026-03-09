const fs = require('fs');

// Base64 for 1x1 transparent pixel (or any small valid png)
// minimal 1x1 red pixel
const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwOqAAAAABJRU5ErkJggg==";
const buffer = Buffer.from(base64, 'base64');

fs.writeFileSync("c:\\Users\\Admin\\Desktop\\Antidepresivos\\appantidepresivos\\antidepresivos\\web_app\\public\\assets\\icon_dr_mario_8bit.png", buffer);
console.log("Icon created.");
