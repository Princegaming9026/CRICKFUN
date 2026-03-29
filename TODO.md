# Render Deployment Fix - TODO

## Steps:
- [x] 1. Edit package.json: Add "start": "vite preview" script.
- [ ] 2. Test locally: `npm run build &amp;&amp; npm start`
- [ ] 3. Git commit &amp; push to Test branch: `git add . &amp;&amp; git commit -m "Fix Render deploy: add start script" &amp;&amp; git push`
- [ ] 4. Check Render dashboard for successful deploy.
- [ ] 5. Update TODO.md: Mark complete and delete if done.

Current status: Step 1 complete (package.json updated). Step 2: Local test requires `npx vite build && npx vite preview` on Windows. Git push next for Render.

