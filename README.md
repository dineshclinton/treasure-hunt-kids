# Treasure Hunt (Kids Edition)

A simple, kid‑friendly board game built for the browser. Designed to celebrate **National STEAM Day** and to make learning playful.

> **Dedication**: This project is lovingly dedicated to **Jonita Dinesh** — for whom this game was created to support her school’s National STEAM Day. 💛

## ✨ Features
- **Auto‑play background music** on Start (browser requires one click first).
- **Victory music** triggers on win and **stops** automatically when starting a **new game** or on **Reset**.
- **5× slower** token movement so kids can see each step clearly.
- Row‑wise **serpentine path** with arrow hints.
- **Icons‑only tiles** (no numeric labels). Specials include:
  - 🪙 **Gold** (+3)
  - 🥈 **Silver** (+2)
  - 🥉 **Bronze** (+1)
  - 👑 **Gold Pair** (+6) — required to win
  - 🎣 **Net Thief** (−2)
  - 🗡️ **Sword Thief** (−3)
  - 🪝 **Hook Thief** (−16) — new
- **Exact finish** rule: roll the exact number to land on **Finish**.
- **Photo token & avatar**: capture from **Camera** or **Choose File**. Your photo appears on the moving token and in the **High Scores** table.
- **High Scores** (local browser storage): keeps up to 20 entries and supports **CSV copy**.

## 📂 Project structure
```
├─ index.html       # HTML UI
├─ styles.css       # CSS styles
├─ app.js           # Game logic + audio + camera
└─ README.md        # This file
```

## 🚀 Getting started
1. Clone or download the repository.
2. Open `index.html` in **Chrome/Edge/Firefox**.
3. Enter a player name.
4. (Optional) **Use Camera** or **Choose File** to set your photo.
5. Click **Start Game** to begin — background music starts.
6. Click **Roll Dice** and follow the arrows.

> **Tip:** Most browsers block audio until you interact once. Click **Start Game** to enable audio.

## 🛠️ Tech notes
- Pure **HTML/CSS/JS**; no external libraries.
- Camera access uses `getUserMedia` (requires HTTPS or `localhost`).
- Photos are stored as small **64×64 JPEG thumbnails** in `localStorage` for the scoreboard.
- All game sounds (SFX & music) are generated with the **Web Audio API**.

## 🧒 Target audience
Built for **primary/elementary school kids**. Icons are large, movement is slowed, and rules are simple and visual.

## 📜 License
MIT — feel free to fork, modify, and share.
