# Backend Fix for Login

**Login connection failed** because frontend API calls need server.ts running.

**Updated:**
- package.json: "build": "tsc && vite build", "start": "tsx dist/server.js", tsx in deps.
- tsconfig.json: compile server.ts to dist/.
- vite.config.ts: already fixed host/port.

**GitHub दोनों files update करें & push Test.**

**Render Dashboard:**
- Environment var add: `GEMINI_API_KEY` = your key.
- Service type "Web Service".

**Admin login:** key = "BERLIN786"

Now fullstack deploys! Login काम करेगा।
