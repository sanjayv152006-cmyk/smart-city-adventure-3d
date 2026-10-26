# 🏙️ Quiz to Build — Smart City Adventure

> An interactive 3D educational city-building web game where players solve curated curriculum quizzes to construct and evolve a thriving smart metropolis across 50 unique global cities and 500 interactive rounds!

[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 Key Features

### 🎮 3D Miniature Metropolis Experience
- **High-Fidelity Procedural 3D Environment:** Built using Three.js with calibrated PBR materials, tone mapping exposure, and realistic architectural depth.
- **10 Unique City Zones:** Residential Area, School Zone, Hospital Medical Center, Shopping District, Central Park, Police Station, Fire Station, Sports Stadium, International Airport, and the Smart City Center.
- **Dynamic Living City:** Animated road traffic (sedans, taxis, delivery vans, city transit buses, police cruisers, ambulances) and an aerodynamic passenger jet circling the airport with real-time forward flight kinematics and bank roll.
- **Day / Night Lighting:** Real-time lighting rig toggle between vibrant daylight and cinematic neon night mode with window illumination.
- **Responsive Camera Controls:** 
  - **Desktop:** Left-click drag to rotate, right-click to pan, scroll wheel to zoom.
  - **Mobile:** One-finger touch drag to orbit around the city, two-finger pinch gesture to zoom in/out with sensible boundary limits.

### 🧠 Progression & Curriculum System
- **50 Unique World Cities:** From *Green Valley* and *Modern Town* to *Alpine Ridge*, *Cyberport*, and *Omega Smart Capital*.
- **500 Total Rounds (10 Rounds per City):** Each round unlocks an architectural zone upon scoring $\ge 4 / 5$.
- **Dual Learning Modes:**
  - 🧒 **Child Mode:** Visual, friendly questions covering animals, plants, healthy habits, recycling, community helpers, and earth sciences.
  - 🎓 **Student Mode:** Advanced questions exploring renewable energy, smart infrastructure, climate science, AI & IoT sensors, transportation, and urban planning.
- **Anti-Exploit Scoring & Rewards:** Duplicate rewards prevention ensures coins are only awarded once per round, while preserving high scores.
- **Device-Specific Persistence:** LocalStorage service automatically saves completed rounds, scores, unlocked cities, and coin balances.

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x, 20.x, or 22.x recommended)
- `npm` (comes bundled with Node.js)

### 1. Clone or Download Repository
```bash
git clone https://github.com/<your-username>/quiz-to-build---smart-city-adventure.git
cd quiz-to-build---smart-city-adventure
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server on port 3000 (`0.0.0.0`) |
| `npm run build` | Compiles TypeScript and builds production-ready bundle to `/dist` and `/assets` |
| `npm run preview` | Locally previews the production build on port 3000 |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm test` or `npx tsx scripts/test_progression.ts` | Runs automated verification of all 50 cities and 500 rounds |

---

## 🧪 Automated Testing

The project includes an automated test suite validating the complete progression lifecycle, question banks, scoring thresholds, and storage serialization:

```bash
npx tsx scripts/test_progression.ts
```

**Verified Test Coverage (60 Tests, 0 Failures):**
- ✅ All 50 cities data schemas, themes, colors, and reward balances.
- ✅ All 10 zone models and camera coordinate targets.
- ✅ All 500 rounds (2,500 questions across Child & Student modes).
- ✅ Scoring pass threshold ($\ge 4/5$) and fail enforcement ($< 4$).
- ✅ Duplicate reward prevention on replay.
- ✅ City completion logic and unlocking of subsequent cities.
- ✅ Locked city access guard.
- ✅ `localStorage` serialization & schema sanitization.

---

## 📁 Project Directory Structure

```
├── assets/                     # Pre-bundled static production assets for fallback
├── dist/                       # Production build output
├── public/                     # Static public assets
├── scripts/
│   └── test_progression.ts     # Automated 50-city & 500-round test suite
├── src/
│   ├── components/             # React UI & 3D canvas components
│   │   ├── City3DCanvas.tsx    # Three.js 3D engine, PBR materials, vehicles & airplane
│   │   ├── GameDashboard.tsx   # In-game HUD, Back and Home buttons, progress pill
│   │   ├── QuizModal.tsx       # MCQ quiz engine, timer, and score evaluation
│   │   ├── SettingsModal.tsx   # Audio sliders, mode switcher, night mode, reset
│   │   ├── WelcomeScreen.tsx   # Landing screen & level selection entry point
│   │   └── ...                 # Modals for world map, achievements, and rewards
│   ├── data/
│   │   ├── cities.ts           # All 50 cities data definitions & calibrated colors
│   │   ├── locations.ts        # 10 zone landmarks & camera focal targets
│   │   └── questions.ts        # Comprehensive Child & Student question banks
│   ├── services/
│   │   ├── sound.ts            # Web Audio API procedural sound synthesizer
│   │   └── storage.ts          # Safe localStorage serialization & schema migration
│   ├── types/
│   │   └── game.ts             # TypeScript interfaces for game models & state
│   ├── App.tsx                 # Core game state & navigation coordinator
│   └── main.tsx                # React root entry point
├── index.html                  # HTML entry point with responsive viewport
├── package.json                # Project dependencies and build scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration with React & Tailwind plugins
```

---

## 🚢 Deployment Guide

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

### Deploy to Netlify
1. Connect your GitHub repository to [Netlify](https://www.netlify.com/).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy Site**.

### Deploy to GitHub Pages
1. In `vite.config.ts`, ensure `base: './'` is set (already configured for relative asset loading).
2. Run `npm run build`.
3. Push the contents of the `dist/` directory to the `gh-pages` branch.

---

## 📄 License
This project is licensed under the MIT License.
