# Contributing

Use Node.js 24 and `npm ci`. Run `npm run check` before opening a pull request (install Playwright Chromium first). Commit the rebuilt `dist/` files together with source changes.

Keep runtime code self-contained. Do not depend on private Home Assistant frontend components, Browser Mod or a CDN. Treat entity names, attributes and configuration as untrusted input. Missing and unavailable measurements must not become zero.

Add model tests for entity-resolution or calculation changes and browser tests for interactions. Check desktop/mobile, light/dark themes, Italian/English and optional sensor families. Use fictional demo data only; never commit Home Assistant credentials, configuration exports or personal energy history.

Describe changes and verification in your pull request. Update README and CHANGELOG for user-visible behavior.
