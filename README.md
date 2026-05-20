# Codenames — ARN Edition

Real-time multiplayer Codenames with two custom boards.

## Run Locally

```bash
cd codenames
npm install
npm start
```

Open http://localhost:3000 in your browser.

## Share with Other Players

### Option A — Same Wi-Fi Network
Find your local IP (e.g. `192.168.1.x`) and share `http://192.168.1.x:3000`.

### Option B — ngrok (anywhere)
```bash
# In a second terminal:
npx ngrok http 3000
# Share the https://xxx.ngrok.io URL
```

### Option C — Deploy to Render.com (permanent URL)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect the repo
4. Set:
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Environment**: Node
5. Deploy → share the `https://your-app.onrender.com` URL

## How to Play

1. Share the URL with all players.
2. Everyone picks Board 1 or Board 2 (all players must pick the same board).
3. Each team's **spymaster** taps **Spymaster Mode** on *their device only* — this shows hidden card colors to that device without sharing them elsewhere.
4. Spymasters give one-word clues + a number. Operatives click cards to reveal them.
5. The team that finds all their agents wins. Reveal the assassin and you lose instantly.
