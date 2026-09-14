/**
 * Real-Time Camera HUD & Lane/Obstacle Detection Visualizer
 * High-performance HTML5 canvas rendering realistic Indian highway driving perspective,
 * dynamic curved lane detection lines, AI neural bounding boxes with distance & hazard tags,
 * and environmental weather shaders (monsoon rain, night headlight cone, winter fog).
 */
export class CameraHudVisualizer {
  constructor(canvasElement, videoElement = null) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.videoElement = videoElement;
    this.animId = null;
    this.roadOffset = 0;
    this.rainDrops = [];
    this.isLiveDashcam = false;
    this.cameraStream = null;
    this.lateralOffsetCm = 0; // -15 to +15 cm
    this.roadCurvatureRadius = 950; // meters

    this._initRain();
  }

  async toggleLiveDashcam() {
    if (this.isLiveDashcam) {
      this.stopLiveDashcam();
      return false;
    }

    try {
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
      }

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.videoElement.srcObject = this.cameraStream;
      await this.videoElement.play();
      this.isLiveDashcam = true;
      return true;
    } catch (err) {
      console.warn('Dashcam video stream unavailable or denied:', err);
      this.isLiveDashcam = false;
      return false;
    }
  }

  stopLiveDashcam() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }
    this.isLiveDashcam = false;
  }

  _initRain() {
    for (let i = 0; i < 70; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        len: 15 + Math.random() * 20,
        speed: 0.03 + Math.random() * 0.05,
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
    }
  }

  render(state, decision) {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const speed = state.speed || 0;
    const speedFactor = Math.max(0.1, speed / 60);
    this.roadOffset = (this.roadOffset + speedFactor * 0.08) % 1;

    // Compute dynamic lateral offset (Lane Departure Metric)
    if (state.laneChanges === 'aggressive') {
      this.lateralOffsetCm = Math.sin(Date.now() / 300) * 38; // >25cm triggers departure
    } else if (state.laneChanges === 'frequent') {
      this.lateralOffsetCm = Math.sin(Date.now() / 600) * 22;
    } else {
      this.lateralOffsetCm = Math.sin(Date.now() / 1500) * 4.5; // normal minor road sway
    }

    const horizonY = h * 0.46;
    const curveOffset = state.turningPattern === 'sharp' ? -w * 0.12 : (state.laneChanges === 'aggressive' ? Math.sin(Date.now() / 250) * w * 0.08 : 0);
    const vpX = w * 0.5 + curveOffset;

    // 1. If Live Dashcam is active, draw live camera frames as background
    if (this.isLiveDashcam && this.videoElement && this.videoElement.readyState >= 2) {
      ctx.drawImage(this.videoElement, 0, 0, w, h);
      // Darkened tint overlay to make neural HUD lines pop with high contrast
      ctx.fillStyle = 'rgba(10, 15, 25, 0.45)';
      ctx.fillRect(0, 0, w, h);
    } else {
      // 1b. Environmental Sky & Terrain simulation
      this._renderSkyAndTerrain(ctx, w, h, horizonY, state);
    }

    // 2. Road Asphalt & 3D Curved Polynomial Lane Detection Lines
    this._renderRoadAndLanes(ctx, w, h, horizonY, vpX, state);

    // 3. AI Bounding Boxes & Obstacles
    this._renderObstacles(ctx, w, h, horizonY, vpX, state, decision);

    // 4. Weather Shaders (Rain, Fog, Headlight Beam)
    if (!this.isLiveDashcam) {
      this._renderWeatherEffects(ctx, w, h, horizonY, vpX, state);
    }

    // 5. Neural HUD Overlays (Lane Departure Warning, Lateral Offset, Crosshair)
    this._renderHudOverlay(ctx, w, h, state, decision);
  }

  _renderSkyAndTerrain(ctx, w, h, horizonY, state) {
    const isNight = state.weather === 'night';
    const isRain = state.weather === 'rain' || state.weather === 'monsoon_storm';
    const isFog = state.weather === 'fog';

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (isNight) {
      skyGrad.addColorStop(0, '#040711');
      skyGrad.addColorStop(1, '#0c1427');
    } else if (isFog) {
      skyGrad.addColorStop(0, '#3a4454');
      skyGrad.addColorStop(1, '#6b7280');
    } else if (isRain) {
      skyGrad.addColorStop(0, '#1a2233');
      skyGrad.addColorStop(1, '#334155');
    } else {
      skyGrad.addColorStop(0, '#0f2b48');
      skyGrad.addColorStop(0.7, '#1e40af');
      skyGrad.addColorStop(1, '#38bdf8');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Distant Indian landscape horizon (trees, hills, highway light poles)
    ctx.fillStyle = isNight ? '#060d1a' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= w; x += 40) {
      const hillH = Math.sin(x * 0.01) * 12 + Math.cos(x * 0.02) * 8;
      ctx.lineTo(x, horizonY - hillH - 8);
    }
    ctx.lineTo(w, horizonY);
    ctx.fill();

    // Road side shoulder terrain
    const terrainGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    if (isNight) {
      terrainGrad.addColorStop(0, '#0a101d');
      terrainGrad.addColorStop(1, '#050810');
    } else {
      terrainGrad.addColorStop(0, '#2d3748');
      terrainGrad.addColorStop(1, '#1a202c');
    }
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);
  }

  _renderRoadAndLanes(ctx, w, h, horizonY, vpX, state) {
    const roadBottomLeft = w * 0.08;
    const roadBottomRight = w * 0.92;
    const roadTopLeft = vpX - w * 0.07;
    const roadTopRight = vpX + w * 0.07;

    // If not in live dashcam mode, render synthetic asphalt surface
    if (!this.isLiveDashcam) {
      ctx.fillStyle = state.roadCondition === 'wet' ? '#141820' : '#1f242d';
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, h);
      ctx.lineTo(roadBottomLeft, h);
      ctx.closePath();
      ctx.fill();

      // Road Edge Solid White Borders
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * window.devicePixelRatio;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadBottomLeft, h);
      ctx.moveTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, h);
      ctx.stroke();
    }

    // 3D Drive Path Ribbon (Tesla Vision style predicted vehicle trajectory)
    const isDeparting = Math.abs(this.lateralOffsetCm) > 26;
    const isDrifting = Math.abs(this.lateralOffsetCm) > 15;
    const pathColor = isDeparting ? 'rgba(239, 68, 68, 0.35)' : (isDrifting ? 'rgba(245, 158, 11, 0.28)' : 'rgba(56, 189, 248, 0.22)');
    const pathBorderColor = isDeparting ? '#ef4444' : (isDrifting ? '#f59e0b' : '#38bdf8');

    // Draw drive path corridor
    ctx.fillStyle = pathColor;
    ctx.beginPath();
    const ribbonTopW = w * 0.045;
    const ribbonBottomW = w * 0.26;
    const offsetPx = (this.lateralOffsetCm / 100) * (w * 0.18);

    ctx.moveTo(vpX - ribbonTopW * 0.5, horizonY);
    ctx.lineTo(vpX + ribbonTopW * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + offsetPx + ribbonBottomW * 0.5, h);
    ctx.lineTo(w * 0.5 + offsetPx - ribbonBottomW * 0.5, h);
    ctx.closePath();
    ctx.fill();

    // Trajectory Corridor Boundary Lines
    ctx.strokeStyle = pathBorderColor;
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(vpX - ribbonTopW * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + offsetPx - ribbonBottomW * 0.5, h);
    ctx.moveTo(vpX + ribbonTopW * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + offsetPx + ribbonBottomW * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dynamic Curved Lane Dividers
    const laneStable = state.laneChanges === 'stable';
    ctx.strokeStyle = isDeparting ? '#ef4444' : (isDrifting ? '#f59e0b' : (laneStable ? '#38bdf8' : '#fbbf24'));
    ctx.lineWidth = 3 * window.devicePixelRatio;

    const numDashes = 10;
    for (let i = 0; i < numDashes; i++) {
      const tStart = (i / numDashes + this.roadOffset / numDashes) % 1;
      const tEnd = tStart + 0.05;
      if (tStart >= 0.95) continue;

      const y1 = horizonY + (h - horizonY) * Math.pow(tStart, 2);
      const y2 = horizonY + (h - horizonY) * Math.pow(tEnd, 2);

      // Center dashed lane divider with road curvature
      const x1 = vpX + (w * 0.5 - vpX) * Math.pow(tStart, 2);
      const x2 = vpX + (w * 0.5 - vpX) * Math.pow(tEnd, 2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Left lane divider
      const x1L = (roadTopLeft + (roadTopRight - roadTopLeft) * 0.25) +
                  ((roadBottomLeft + (roadBottomRight - roadBottomLeft) * 0.25) - (roadTopLeft + (roadTopRight - roadTopLeft) * 0.25)) * Math.pow(tStart, 1.8);
      const x2L = (roadTopLeft + (roadTopRight - roadTopLeft) * 0.25) +
                  ((roadBottomLeft + (roadBottomRight - roadBottomLeft) * 0.25) - (roadTopLeft + (roadTopRight - roadTopLeft) * 0.25)) * Math.pow(tEnd, 1.8);

      ctx.beginPath();
      ctx.moveTo(x1L, y1);
      ctx.lineTo(x2L, y2);
      ctx.stroke();

      // Right lane divider
      const x1R = (roadTopLeft + (roadTopRight - roadTopLeft) * 0.75) +
                  ((roadBottomLeft + (roadBottomRight - roadBottomLeft) * 0.75) - (roadTopLeft + (roadTopRight - roadTopLeft) * 0.75)) * Math.pow(tStart, 1.8);
      const x2R = (roadTopLeft + (roadTopRight - roadTopLeft) * 0.75) +
                  ((roadBottomLeft + (roadBottomRight - roadBottomLeft) * 0.75) - (roadTopLeft + (roadTopRight - roadTopLeft) * 0.75)) * Math.pow(tEnd, 1.8);

      ctx.beginPath();
      ctx.moveTo(x1R, y1);
      ctx.lineTo(x2R, y2);
      ctx.stroke();
    }
  }

  _renderObstacles(ctx, w, h, horizonY, vpX, state, decision) {
    const dist = Math.max(4, Math.min(100, state.distance || 45));
    const distT = 1 - (dist / 105);
    const obsY = horizonY + (h - horizonY) * Math.pow(distT, 1.8);
    const obsScale = 0.2 + distT * 0.9;

    const obstacles = Array.isArray(state.obstacles) ? state.obstacles : [state.obstacles];
    const isCritical = decision?.finalRiskLevel === 'CRITICAL' || state.collisionRisk === 'IMMINENT';
    const isHigh = decision?.finalRiskLevel === 'HIGH' || state.collisionRisk === 'HIGH';

    const boxColor = isCritical ? '#ef4444' : (isHigh ? '#f59e0b' : '#10b981');

    const primaryObs = obstacles[0] || 'vehicle';
    let label = 'LEAD TRUCK: TATA PRIMA';
    let emoji = '🚛';
    let boxW = 130 * obsScale * window.devicePixelRatio;
    let boxH = 95 * obsScale * window.devicePixelRatio;
    let obsX = vpX - boxW * 0.5;

    if (primaryObs.includes('cattle') || primaryObs.includes('cow')) {
      label = 'STRAY CATTLE (DESI COW)';
      emoji = '🐄';
      obsX = vpX + (w * 0.12 * distT);
      boxW = 110 * obsScale * window.devicePixelRatio;
      boxH = 80 * obsScale * window.devicePixelRatio;
    } else if (primaryObs.includes('auto') || primaryObs.includes('autorickshaw')) {
      label = 'AUTO: BAJAJ RE COMPACT';
      emoji = '🛺';
      obsX = vpX - (w * 0.14 * distT);
      boxW = 95 * obsScale * window.devicePixelRatio;
      boxH = 88 * obsScale * window.devicePixelRatio;
    } else if (primaryObs.includes('bike') || primaryObs.includes('motorcycle')) {
      label = 'TWO-WHEELER: HERO SPLENDOR';
      emoji = '🏍️';
      obsX = vpX + (w * 0.16 * distT);
      boxW = 75 * obsScale * window.devicePixelRatio;
      boxH = 85 * obsScale * window.devicePixelRatio;
    } else if (primaryObs.includes('pothole')) {
      label = 'CRATER POTHOLE (GRADE-4)';
      emoji = '🕳️';
      boxH = 30 * obsScale * window.devicePixelRatio;
      boxW = 100 * obsScale * window.devicePixelRatio;
    } else if (primaryObs.includes('wrong_way')) {
      label = 'WRONG-WAY MOTORIST';
      emoji = '⚠️';
      obsX = vpX - (w * 0.08 * distT);
      boxW = 120 * obsScale * window.devicePixelRatio;
      boxH = 90 * obsScale * window.devicePixelRatio;
    }

    const obsTop = obsY - boxH;

    // Draw AI Bounding Box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5 * window.devicePixelRatio;
    ctx.strokeRect(obsX, obsTop, boxW, boxH);

    // Corner brackets styling
    this._drawTargetCornerBrackets(ctx, obsX, obsTop, boxW, boxH, boxColor);

    // Tag Label Banner
    ctx.fillStyle = boxColor;
    const tagH = 22 * window.devicePixelRatio;
    ctx.fillRect(obsX, obsTop - tagH, boxW, tagH);

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${10 * window.devicePixelRatio}px 'Outfit', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${emoji} ${label}`, obsX + 4, obsTop - 6 * window.devicePixelRatio);

    // Distance & TTC telemetry badge under box
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(obsX, obsTop + boxH + 4, boxW, 18 * window.devicePixelRatio);
    ctx.fillStyle = boxColor;
    ctx.font = `${9.5 * window.devicePixelRatio}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    const ttc = state.timeToImpact || ((dist / Math.max(1, (state.speed * 1000) / 3600)).toFixed(1));
    ctx.fillText(`DIST: ${Math.round(dist)}m | TTC: ${ttc}s`, obsX + boxW * 0.5, obsTop + boxH + 16 * window.devicePixelRatio);
  }

  _drawTargetCornerBrackets(ctx, x, y, w, h, color) {
    const len = Math.min(15 * window.devicePixelRatio, w * 0.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * window.devicePixelRatio;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  }

  _renderWeatherEffects(ctx, w, h, horizonY, vpX, state) {
    const isNight = state.weather === 'night';
    const isRain = state.weather === 'rain' || state.weather === 'monsoon_storm';
    const isFog = state.weather === 'fog';

    // Night Headlight Cone
    if (isNight) {
      const beamGrad = ctx.createRadialGradient(w * 0.5, h, 20, w * 0.5, h * 0.7, w * 0.5);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h);
      ctx.lineTo(vpX, horizonY + 20);
      ctx.lineTo(w * 0.9, h);
      ctx.closePath();
      ctx.fill();
    }

    // Fog / Smog Shader
    if (isFog) {
      const fogGrad = ctx.createLinearGradient(0, horizonY - 40, 0, h);
      fogGrad.addColorStop(0, 'rgba(203, 213, 225, 0.85)');
      fogGrad.addColorStop(0.5, 'rgba(148, 163, 184, 0.45)');
      fogGrad.addColorStop(1, 'rgba(148, 163, 184, 0.1)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Raindrops
    if (isRain) {
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.6)';
      ctx.lineWidth = 1.5 * window.devicePixelRatio;
      ctx.beginPath();
      this.rainDrops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > 1) {
          drop.y = 0;
          drop.x = Math.random();
        }
        const rx = drop.x * w;
        const ry = drop.y * h;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + drop.len);
      });
      ctx.stroke();
    }
  }

  _renderHudOverlay(ctx, w, h, state, decision) {
    // Center Vision Target Reticle
    const cx = w * 0.5;
    const cy = h * 0.55;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5 * window.devicePixelRatio;

    // Crosshair circle
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * window.devicePixelRatio, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal & vertical indicator notches
    ctx.beginPath();
    ctx.moveTo(cx - 45 * window.devicePixelRatio, cy);
    ctx.lineTo(cx - 36 * window.devicePixelRatio, cy);
    ctx.moveTo(cx + 36 * window.devicePixelRatio, cy);
    ctx.lineTo(cx + 45 * window.devicePixelRatio, cy);
    ctx.moveTo(cx, cy - 45 * window.devicePixelRatio);
    ctx.lineTo(cx, cy - 36 * window.devicePixelRatio);
    ctx.stroke();

    // Top HUD Status Bar on Canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, 0, w, 32 * window.devicePixelRatio);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${10.5 * window.devicePixelRatio}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    const modeLabel = this.isLiveDashcam ? 'LIVE DASHCAM • WEBCAM 30FPS' : 'AI NEURAL ROAD SIMULATION';
    ctx.fillText(`CAM-01 [FRONT] • ${modeLabel}`, 12 * window.devicePixelRatio, 20 * window.devicePixelRatio);

    ctx.textAlign = 'right';
    const riskColor = decision?.finalRiskLevel === 'CRITICAL' ? '#ef4444' : (decision?.finalRiskLevel === 'HIGH' ? '#f59e0b' : '#10b981');
    ctx.fillStyle = riskColor;
    ctx.fillText(`ADAS LDW: ACTIVE • RISK: ${decision?.finalRiskLevel || 'NORMAL'}`, w - 12 * window.devicePixelRatio, 20 * window.devicePixelRatio);

    // Bottom Lane Departure Warning (LDW) Banner
    const ldwY = h - 28 * window.devicePixelRatio;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, ldwY, w, 28 * window.devicePixelRatio);

    const isDeparting = Math.abs(this.lateralOffsetCm) > 26;
    const isDrifting = Math.abs(this.lateralOffsetCm) > 15;
    const ldwColor = isDeparting ? '#ef4444' : (isDrifting ? '#f59e0b' : '#34d399');
    const ldwStatus = isDeparting
      ? `🚨 LANE DEPARTURE: ${this.lateralOffsetCm > 0 ? 'RIGHT' : 'LEFT'}!`
      : (isDrifting ? `⚠️ DRIFTING ${this.lateralOffsetCm > 0 ? 'RIGHT' : 'LEFT'}` : '🟢 LANE CENTERED');

    ctx.fillStyle = ldwColor;
    ctx.font = `bold ${11 * window.devicePixelRatio}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`LDW: ${ldwStatus} (Offset: ${this.lateralOffsetCm > 0 ? '+' : ''}${this.lateralOffsetCm.toFixed(1)} cm)`, 12 * window.devicePixelRatio, ldwY + 18 * window.devicePixelRatio);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ROAD CURVATURE: R=920m (STRAIGHT)`, w - 12 * window.devicePixelRatio, ldwY + 18 * window.devicePixelRatio);
  }
}
