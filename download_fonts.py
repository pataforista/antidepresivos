import os
import urllib.request
import re

FONTS_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Montserrat:ital,wght@0,600..900;1,600..900&display=swap"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"

OUTPUT_DIR = r"appantidepresivos\antidepresivos\web_app\public\assets\fonts"
CSS_FILE = os.path.join(OUTPUT_DIR, "fonts.css")

os.makedirs(OUTPUT_DIR, exist_ok=True)

req = urllib.request.Request(FONTS_URL, headers={'User-Agent': USER_AGENT})
with urllib.request.urlopen(req) as response:
    css_content = response.read().decode('utf-8')

# Extract url() links
urls = re.findall(r'url\((https://[^)]+\.woff2)\)', css_content)

downloaded = {}
font_counter = 1

for url in set(urls):
    filename = f"font_{font_counter}.woff2"
    filepath = os.path.join(OUTPUT_DIR, filename)
    print(f"Downloading {url} to {filename}...")
    urllib.request.urlretrieve(url, filepath)
    downloaded[url] = f"../assets/fonts/{filename}"
    font_counter += 1

# Replace URLs in CSS
for url, local_path in downloaded.items():
    css_content = css_content.replace(url, local_path)

with open(CSS_FILE, "w", encoding="utf-8") as f:
    f.write(css_content)

print(f"Successfully downloaded {len(downloaded)} font files and generated {CSS_FILE}.")
