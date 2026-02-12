const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream("c:\\Users\\Admin\\Desktop\\Antidepresivos\\appantidepresivos\\antidepresivos\\web_app\\public\\src\\vendor\\ogl.mjs");
const request = https.get("https://unpkg.com/ogl@1.0.11/dist/ogl.mjs", function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => console.log('Download completed.'));
    });
}).on('error', function (err) {
    fs.unlink("c:\\Users\\Admin\\Desktop\\Antidepresivos\\appantidepresivos\\antidepresivos\\web_app\\public\\src\\vendor\\ogl.mjs", () => { }); // Delete the file async. (But we don't check the result)
    console.error('Error downloading:', err.message);
});
