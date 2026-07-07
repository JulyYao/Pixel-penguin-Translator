# Pixel Penguin Translator

Pixel Penguin is a lightweight bilingual conversation translation frontend built for project-based dialogue records. It displays translated content as chat bubbles and can store records locally or sync them through GitHub Gist / a custom sync service.

## Features

- Project-based bilingual conversation management
- Automatic input language detection and translation to the opposite language
- Chat-style left / right message bubbles
- Project pinning, archive folder, deletion, language editing, and language direction swapping
- Message copy, edit, delete, and pin actions
- Quick temporary translation direction swap in the composer
- Multilingual UI language selector, with English as the default interface language
- Localized display names for project languages, such as `Chinese ⇄ French` in English UI
- Adaptive menu text sizing for multilingual labels
- API provider settings for OpenAI-compatible services
- Qwen, DeepSeek, Gemini, and custom OpenAI-compatible model configuration
- Primary API and backup API support
- Token usage display
- Optional GitHub Gist or custom sync service
- PWA support for adding the app to a mobile home screen
- Local Markdown record import / export
- Mobile-friendly layout
- API keys and Gist tokens are no longer stored as plain text in local browser storage

## Quick Start

This is a static frontend project. No dependency installation is required.

Open the file directly in a browser:

```text
index.html
```

Or start a local static server:

```bash
python -m http.server 8765
```

Then visit:

```text
http://127.0.0.1:8765
```

## API Setup

Before translating, open Settings and fill in your own API information:

- Provider
- API Key
- Base URL
- Model

This repository does not include any API keys. Do not commit your own keys to GitHub.

Qwen compatible API example:

```text
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-mt-plus or qwen-mt-turbo
```

## PWA / Mobile Use

After deploying the project to an HTTPS static site, you can add it to your mobile home screen from the browser.

Main PWA files:

- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`
- `pixel_penguin_export.png`

## Deployment

Pixel Penguin can be deployed to any static hosting service:

- GitHub Pages
- Tencent EdgeOne Pages
- Cloudflare Pages
- Netlify
- Vercel Static
- Any Nginx / static file server

Make sure these files are available at the site root:

```text
index.html
app-config.js
app-utils.js
language-detector.js
app.js
styles.css
manifest.webmanifest
service-worker.js
icon.svg
pixel_penguin_export.png
_headers
```

## Sync

Project sync is optional and requires your own configuration:

- GitHub Gist Token
- Or a custom sync service endpoint

## Security Notes

Pixel Penguin is a frontend-only app. Secrets are stored in the current browser's local storage and are protected from plain-text storage where supported, but this is still local browser storage. For public or shared deployments, a server-side proxy is recommended instead of exposing API keys to end users.

## License

See `LICENSE`.
