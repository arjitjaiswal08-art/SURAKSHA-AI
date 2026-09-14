/**
 * Professional Digital Instrument Cluster & Telemetry Gauges
 * Renders high-precision digital speedometer dial, G-force accelerometer,
 * stopping distance physics calculator, and ADAS telemetry bars.
 */
export class InstrumentCluster {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(telemetry) {
    if (!this.container) return;

    const {
      speed = 0,
      speedLimit = 80,
      distance = 50,
      suddenBraking = false,
      suddenAccel = false,
      turningPattern = 'smooth',
      roadCondition = 'dry',
    } = telemetry;

    // Physics-based Stopping Distance Calculation
    // Reaction time: ~1.2s for alert driver, 2.0s for distracted
    const reactionTime = telemetry.attentionLevel === 'distracted' ? 2.0 : 1.2;
    const speedMs = (speed * 1000) / 3600;
    const reactionDistance = speedMs * reactionTime;

    // Friction coefficient mu
    let mu = 0.75; // dry asphalt
    if (roadCondition === 'wet') mu = 0.5;
    else if (roadCondition === 'slippery') mu = 0.35;
    const g = 9.81;
    const brakingDistance = Math.pow(speedMs, 2) / (2 * mu * g);
    const totalStoppingDistance = Math.round(reactionDistance + brakingDistance);

    // G-force calculation
    let latG = 0; // Lateral G (cornering)
    if (turningPattern === 'sharp') latG = 0.45;
    else if (turningPattern === 'erratic') latG = 0.65;
    else latG = (Math.sin(Date.now() / 800) * 0.08);

    let lonG = 0; // Longitudinal G (accel/brake)
    if (suddenBraking) lonG = -0.75;
    else if (suddenAccel) lonG = 0.45;
    else lonG = (speed > 5 ? 0.05 : 0);

    // Speed Dial Arc math (0 to 180 km/h mapped to 240 degrees)
    const maxSpeed = 180;
    const clampedSpeed = Math.min(maxSpeed, Math.max(0, speed));
    const speedPercent = clampedSpeed / maxSpeed;
    const strokeDashoffset = 314 - (314 * speedPercent);
    const isOverspeed = speed > speedLimit;

    // Safety buffer comparison
    const hasSafeGap = distance >= totalStoppingDistance;
    const gapRatio = Math.min(100, Math.round((distance / Math.max(1, totalStoppingDistance)) * 100));

    this.container.innerHTML = `
      <div class="cluster-grid">
        
        <!-- Left: G-Force Accelerometer & Throttle/Brake -->
        <div class="cluster-card cluster-dynamics">
          <div class="cluster-card-title">G-FORCE ACCELEROMETER</div>
          <div class="g-force-meter">
            <div class="g-grid-crosshair"></div>
            <div class="g-ball" style="transform: translate(${latG * 45}px, ${-lonG * 45}px);"></div>
          </div>
          <div class="g-readout">
            <span>LAT: <strong>${latG >= 0 ? '+' : ''}${latG.toFixed(2)}G</strong></span>
            <span>LON: <strong>${lonG >= 0 ? '+' : ''}${lonG.toFixed(2)}G</strong></span>
          </div>
          
          <div class="pedal-bars">
            <div class="pedal-row">
              <span>PWR</span>
              <div class="pedal-track">
                <div class="pedal-fill throttle" style="width: ${suddenAccel ? 95 : (speed > 5 ? 45 : 0)}%;"></div>
              </div>
            </div>
            <div class="pedal-row">
              <span>BRK</span>
              <div class="pedal-track">
                <div class="pedal-fill brake" style="width: ${suddenBraking ? 90 : 0}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Circular Digital Speedometer Dial -->
        <div class="cluster-card cluster-dial-card">
          <div class="speed-dial-wrapper">
            <svg class="speed-svg" viewBox="0 0 140 140">
              <!-- Background dial track -->
              <circle cx="70" cy="70" r="50" class="dial-bg" />
              <!-- Active illuminated speed arc -->
              <circle cx="70" cy="70" r="50" class="dial-val ${isOverspeed ? 'overspeed' : ''}" 
                style="stroke-dasharray: 314; stroke-dashoffset: ${strokeDashoffset};" />
            </svg>
            <div class="speed-dial-content">
              <div class="speed-number ${isOverspeed ? 'danger-glow' : ''}">${Math.round(speed)}</div>
              <div class="speed-unit">KM/H</div>
              <div class="speed-limit-badge ${isOverspeed ? 'exceeded' : ''}">
                <span>LIMIT</span>
                <strong>${speedLimit}</strong>
              </div>
            </div>
          </div>
          <div class="speed-status-sub">
            ${isOverspeed 
              ? `<span style="color:#ef4444; font-weight:700;">⚠️ +${Math.round(speed - speedLimit)} KM/H OVERSPEED</span>`
              : `<span style="color:#10b981; font-weight:600;">✓ WITHIN POSTED SPEED LIMIT</span>`}
          </div>
        </div>

        <!-- Right: Physics Stopping Distance & Safe Gap Analyzer -->
        <div class="cluster-card cluster-stopping">
          <div class="cluster-card-title">STOPPING DISTANCE PHYSICS</div>
          <div class="stopping-metrics">
            <div class="metric-line">
              <span>Reaction Distance (${reactionTime}s):</span>
              <strong>${Math.round(reactionDistance)} m</strong>
            </div>
            <div class="metric-line">
              <span>Braking Skid Distance (μ=${mu}):</span>
              <strong>${Math.round(brakingDistance)} m</strong>
            </div>
            <div class="metric-line total">
              <span>Required Safe Stop Distance:</span>
              <strong style="color: ${hasSafeGap ? '#38bdf8' : '#ef4444'};">${totalStoppingDistance} m</strong>
            </div>
            <div class="metric-line actual">
              <span>Actual Obstacle Gap:</span>
              <strong style="color: ${hasSafeGap ? '#10b981' : '#f59e0b'};">${Math.round(distance)} m</strong>
            </div>
          </div>

          <div class="buffer-bar-wrapper">
            <div class="buffer-label">
              <span>Gap Adequacy Ratio</span>
              <strong style="color: ${gapRatio >= 100 ? '#10b981' : (gapRatio >= 70 ? '#f59e0b' : '#ef4444')};">${gapRatio}%</strong>
            </div>
            <div class="buffer-track">
              <div class="buffer-fill ${gapRatio < 100 ? 'warning' : ''}" style="width: ${Math.min(100, gapRatio)}%;"></div>
            </div>
          </div>
        </div>

      </div>
    `;
  }
}
