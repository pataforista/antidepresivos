const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Montserrat:ital,wght@0,600..900;1,600..900&display=swap";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
const OUTPUT_DIR = path.join(__dirname, 'appantidepresivos', 'antidepresivos', 'web_app', 'public', 'assets', 'fonts');
const CSS_FILE = path.join(OUTPUT_DIR, 'fonts.css');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

https.get(FONTS_URL, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
    let css_content = '';
    res.on('data', chunk => css_content += chunk);
    res.on('end', async () => {
        const regex = /url\((https:\/\/[^\)]+\.woff2)\)/g;
        let match;
        const urls = new Set();
        while ((match = regex.exec(css_content)) !== null) {
            urls.add(match[1]);
        }
        
        let counter = 1;
        for (const url of urls) {
            const filename = `font_${counter}.woff2`;
            const dest = path.join(OUTPUT_DIR, filename);
            console.log(`Downloading ${url} to ${filename}...`);
            await download(url, dest);
            css_content = css_content.split(url).join(`../assets/fonts/${filename}`);
            counter++;
        }
        
        fs.writeFileSync(CSS_FILE, css_content, 'utf8');
        console.log(`Successfully downloaded ${urls.size} font files and generated fonts.css.`);
    });
}).on('error', console.error);
