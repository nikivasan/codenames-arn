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

### Option A — Localhost (same machine)
Open http://localhost:3000 after running `npm start`.

### Option B — Official Game (deployed)
Play online at: **https://codenames-arn.onrender.com/**

### Option C — Same Wi-Fi Network
Find your local IP (e.g. `192.168.1.x`) and share `http://192.168.1.x:3000`.

### Option D — ngrok (anywhere)
```bash
# In a second terminal:
npx ngrok http 3000
# Share the https://xxx.ngrok.io URL
```

## How to Play

1. Share the URL with all players.
2. Everyone picks Board 1 or Board 2 (all players must pick the same board).
3. Each team's **spymaster** taps **Spymaster Mode** on *their device only* — this shows hidden card colors to that device without sharing them elsewhere.
4. Spymasters give one-word clues + a number. Operatives click cards to reveal them.
5. The team that finds all their agents wins. Reveal the assassin and you lose instantly.
