# 🛡️ SURAKSHA-AI (सुरक्षा AI)
### Advanced Automotive ADAS, Telemetry & Intelligent Driving Safety Copilot for Indian Roads
> **Designed & Developed by Arjit Jaiswal**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green.svg)](https://leafletjs.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-orange.svg)]()
[![Web Speech API](https://img.shields.io/badge/Voice-Web_Speech_API-red.svg)]()

SURAKSHA-AI is a next-generation automotive AI safety assistant engineered specifically by **Arjit Jaiswal** to address the unpredictable driving dynamics and hazards of Indian road conditions.

---

## ⚡ Flagship Capabilities

### 1. 📷 Real-Time Camera & Computer Vision (Lane Detection)
- **Live Dashcam Integration**: Mount any smartphone or webcam to stream live forward road vision via `navigator.mediaDevices.getUserMedia`.
- **Tesla Vision 3D Dynamic Drive Path**: Dynamic curved 3D highway corridor ribbon conforming to road perspective.
- **Lane Departure Warning (LDW)**:
  - Real-time lateral offset computation in centimeters ($\Delta x$, e.g. `+4.3 cm`).
  - Road curvature radius calculation ($R$ in meters).
  - Status states: `LANE CENTERED`, `⚠️ DRIFTING RIGHT / LEFT`, and `🚨 LANE DEPARTURE ALERT`.
- **Indian Vehicle & Obstacle 3D Bounding Boxes**: Real-time Distance & Time-to-Collision ($TTC$) tracking for:
  - *Tata Prima Heavy Trucks*
  - *Bajaj Auto-Rickshaws*
  - *Hero Commuter Motorcycles*
  - *Desi Cattle on Carriageway*
  - *Crater Potholes & Speed Breakers*

### 2. 🎤 Natural Voice Assistant & Bilingual Copilot
- **Floating Siri / Jarvis Neural Audio Orb**: Pulsing header orb with concentric aura rings that respond dynamically when speaking (magenta) or listening (emerald).
- **Hinglish 🇮🇳 / English 🇬🇧 Bilingual Modes**: Instant toggle translating alerts into natural Indian driving directives (*"Dhyaan se! Aage bada pothole hai, gaadi dheeri karein!"*).
- **Interactive Voice Queries**:
  - *"What's my speed?"*
  - *"Navigate to Kashi Vishwanath / Assi Ghat / Gorakhpur / Ayodhya"*
  - *"Stop navigation"*
  - *"What is my driver score?"*
  - *"Report pothole / cow"*
  - *"Emergency 112"*

### 3. 📍 Google Maps Satellite Integration
- **Photorealistic Satellite Hybrid View**: Official high-resolution Google Satellite tiles (`mt.google.com/vt/lyrs=y`).
- **Live Search Autocomplete Dropdown**: Instant search suggestions for tech parks, landmarks, transit, fuel/EV stations, and speed radar gantries.
- **Turn-by-Turn Navigation Engine**: Maneuver banner, countdown distances, ETA calculation, and automated arrival announcements.
- **GNSS Satellite Speed & Location Terminal**: Doppler-calculated ground speed, MSL altitude, HDOP, and multi-constellation telemetry (**NavIC 🇮🇳**, **GPS 🛰️**, **GLONASS 📡**).

### 4. 🤖 AI Learning Driver Habits & Biometric Fingerprint
- **6-Axis Behavioral Biometrics**:
  1. *Smoothness* (Linear throttle and steering control)
  2. *Anticipation* (Forward braking distance cushion)
  3. *Speed Discipline* (Adherence to corridor limits)
  4. *Driver Focus* (Gaze stability and lack of phone distraction)
  5. *Lane Stability* (Low lateral weaving and drift)
  6. *Hazard Reflex* (Response time to sudden road anomalies)
- **Live SVG Hexagon Spider / Radar Chart**: Real-time telemetry polygon that morphs dynamically with driver behavior.
- **Telemetry Insurance Discount Tier**: Evaluates trip safety into tiered discounts (`🏆 Platinum Shield • 30%`, `🥇 Gold Shield • 20%`, `🥈 Silver Shield • 10%`).

---

## 🏗️ Architecture & Engines

```
src/
├── engines/
│   ├── rashEngine.js          # Rash driving, sudden accel/braking & weaving detection
│   ├── dmsEngine.js           # Driver Monitoring System (microsleep, EAR, distraction)
│   ├── collisionEngine.js     # Time-to-Collision (TTC) & forward collision warning
│   ├── weatherEngine.js       # Indian monsoon downpours, winter fog & stopping distance
│   ├── indianRoadEngine.js    # Cattle, auto cut-ins, potholes, wrong-way vehicles
│   ├── decisionEngine.js      # Master decision arbitration & priority threat resolution
│   └── habitLearningEngine.js # 6-axis biometric learning & insurance discount tiers
├── components/
│   ├── cameraHud.js           # 60 FPS HTML5 Canvas lane detection & live dashcam
│   ├── dmsTracker.js          # IR eye-tracker & facial mesh visualizer
│   ├── gpsMap.js              # Leaflet Google Maps Satellite hybrid navigation & radar
│   ├── instrumentCluster.js   # Digital automotive speedometer & tachometer
│   └── blackboxRecorder.js    # Telemetry logging & JSON crash blackbox export
├── services/
│   ├── voiceAssistant.js      # Web Speech API bilingual copilot (English + Hinglish)
│   └── audioEffects.js        # Acoustic luxury automotive sine chimes (anti-annoyance)
├── styles/
│   └── main.css               # Cyber-cockpit dark glassmorphism design system
└── main.js                    # Core event orchestration & 60Hz rendering loop
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm

### Installation
```bash
# Clone the repository
git clone https://github.com/arjitjaiswal08-art/SURAKSHA-AI.git

# Enter project directory
cd SURAKSHA-AI

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
```

### Running Automated Engine Tests
```bash
node test_engines.js
```

---

## 🛡️ License
MIT License. Developed for Indian Road Safety.
