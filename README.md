# ColorReactor – WebApp + Arduino Control

## Project Manifest

### Web App
- **Framework:** React 18.2.0  
- **Routing:** react-router-dom 6.26.1  
- **UI / Icons:**  
  - framer-motion 11.3.31  
  - lucide-react 0.446.0  
- **Build system:** Vite 5.4.3  
- **Plugins:**  
  - @vitejs/plugin-react 4.3.1  
- **Deployment tools:**  
  - gh-pages 6.3.0 (GitHub Pages deployment)  
- **Desktop packaging (optional):**  
  - @tauri-apps/cli 2.8.3  

#### Project Structure Highlights
- `src/Layout.jsx` → Main layout, top bar, navigation, footer  
- `src/pages/Control.jsx` → Manual light control (with STOP + WASH button)  
- `src/pages/Hardware.jsx` → Serial connection & command console  
- `src/pages/Recipes.jsx` → Recipe storage (localStorage)  
- `src/pages/Chart.jsx` → Visualization page  
- `src/lib/arduino.js` → Communication logic (BLE → Web Serial)  
- `src/lib/colors.js` → Wavelength→gradient conversion  

#### Build & Deploy
- `.gitignore` excludes `node_modules/` (not pushed to GitHub)  
- GitHub Actions Workflow builds with `npm ci && npm run build`  
- Deploys `/dist` to GitHub Pages  

---

### Arduino / ESP32 Code

#### ESP32 (NimBLE + GPIO Scheduler)
- **Library:** NimBLE-Arduino 2.3.4  
- Handles commands:  
  - `LED <label> ON <ms>`  
  - `GPIO <pin> HIGH|LOW`  
  - `MAP <label> <pin>`  
  - `ALL OFF`  
  - `STOP` (clears pulses + queue, all LEDs OFF)  
- Non-blocking scheduler for timed LED pulses  
- Advertising with custom name `ColorReactor-ESP32`  

#### Arduino UNO (Serial + Pulse Scheduler)
- **Board:** Arduino Uno  
- **Baud rate:** 115200  
- Same command set as ESP32, but via **Serial**  
- Label → Pin mapping:  
  - 727nm → Pin 4  
  - 657nm → Pin 5  
  - 632nm → Pin 6  
  - 522nm → Pin 7  
  - 450nm → Pin 8  
  - 367nm → Pin 10  
  - 265nm → Pin 11  
- Special case:  
  - `LED wash ON <ms>` lights **632nm, 522nm, 450nm** simultaneously for `<ms>` duration  

---

### Versions Reference
- **Node.js:** v18+ (recommended for Vite 5)  
- **npm:** v9+  
- **Vite:** 5.4.3  
- **React:** 18.2.0  
- **NimBLE-Arduino:** 2.3.4  
- **Arduino IDE:** 2.x or later  

---

## Quickstart

### Prerequisites
- Install [Node.js](https://nodejs.org/) (v18 or later)  
- Install [Git](https://git-scm.com/)  
- Install [Arduino IDE](https://www.arduino.cc/en/software) for flashing the microcontrollers  

### Clone & Run Locally
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Start development server
npm run dev
```

App will be available at: **http://localhost:5173**

### Build for Production
```bash
npm run build
```

This outputs static files in `/dist`.

### Deploy to GitHub Pages
```bash
npm run deploy
```

---

✅ With this manifest, setup, and quickstart guide, anyone can reproduce the ColorReactor project and run it locally or on GitHub Pages.
