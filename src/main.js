import { evaluateRashDriving } from './engines/rashEngine.js';
import { evaluateDriverState } from './engines/dmsEngine.js';
import { evaluateCollisionRisk } from './engines/collisionEngine.js';
import { evaluateWeatherAdvisory } from './engines/weatherEngine.js';
import { evaluateIndianRoadHazards } from './engines/indianRoadEngine.js';
import { arbitrateDrivingDecision } from './engines/decisionEngine.js';
import { HabitLearningEngine } from './engines/habitLearningEngine.js';
import { audioEffects } from './services/audioEffects.js';
import { voiceAssistant } from './services/voiceAssistant.js';
import { CameraHudVisualizer } from './components/cameraHud.js';
import { DmsTrackerVisualizer } from './components/dmsTracker.js';
import { GpsMapComponent } from './components/gpsMap.js';
import { InstrumentCluster } from './components/instrumentCluster.js';
import { BlackboxRecorder } from './components/blackboxRecorder.js';

// Application State
const state = {
  speed: 72,
  speedLimit: 80,
  suddenAccel: false,
  suddenBraking: false,
  laneChanges: 'stable',
  turningPattern: 'smooth',
  distance: 65,
  relativeSpeed: 0,
  obstacleDetected: false,
  brakingResponse: 'normal',
  weather: 'clear',
  visibility: 'high',
  roadCondition: 'dry',
  roadType: 'highway',
  obstacles: [],
  traffic: 'medium',
  eyeState: 'open',
  headMovement: 'stable',
  phoneUsage: false,
  attentionLevel: 'focused',
  eyeClosedSeconds: 0,
};

// Services & Components
const habitEngine = new HabitLearningEngine();
const blackbox = new BlackboxRecorder();
let instrumentCluster = null;
let cameraHud = null;
let dmsTracker = null;
let gpsMap = null;
let fullGpsMap = null;
let lastRiskLevel = 'LOW';
let lastDecision = null;
let lastAlertMessage = '';
let voiceEnabled = false; // Muted by default to prevent annoyance
let soundEnabled = false; // Muted by default to prevent annoyance

// DOM Elements
const dom = {
  masterBanner: document.getElementById('master-banner'),
  riskVal: document.getElementById('risk-val'),
  biggestThreat: document.getElementById('biggest-threat'),
  immediateAction: document.getElementById('immediate-action'),
  voiceMessage: document.getElementById('voice-message'),

  metricSpeed: document.getElementById('metric-speed'),
  metricSpeedLimit: document.getElementById('metric-speed-limit'),
  metricDistance: document.getElementById('metric-distance'),
  metricTtc: document.getElementById('metric-ttc'),
  telemetryClock: document.getElementById('telemetry-clock'),

  engRashDetail: document.getElementById('eng-rash-detail'),
  engRashTag: document.getElementById('eng-rash-tag'),
  engDmsDetail: document.getElementById('eng-dms-detail'),
  engDmsTag: document.getElementById('eng-dms-tag'),
  engCollisionDetail: document.getElementById('eng-collision-detail'),
  engCollisionTag: document.getElementById('eng-collision-tag'),
  engWeatherDetail: document.getElementById('eng-weather-detail'),
  engWeatherTag: document.getElementById('eng-weather-tag'),
  engIndianDetail: document.getElementById('eng-indian-detail'),
  engIndianTag: document.getElementById('eng-indian-tag'),

  detectedIssuesList: document.getElementById('detected-issues-list'),

  dmsAttentionVal: document.getElementById('dms-attention-val'),
  dmsAttentionBar: document.getElementById('dms-attention-bar'),
  dmsEyeVal: document.getElementById('dms-eye-val'),
  dmsEyeBar: document.getElementById('dms-eye-bar'),
  dmsPhoneVal: document.getElementById('dms-phone-val'),

  habitScore: document.getElementById('habit-score'),
  driverPersona: document.getElementById('driver-persona'),
  coachingTip: document.getElementById('coaching-tip'),
  tripKm: document.getElementById('trip-km'),
  incidentLog: document.getElementById('incident-log'),
  habitInsurancePill: document.getElementById('habit-insurance-pill'),
  radarDataPolygon: document.getElementById('radar-data-polygon'),
  bioValSmooth: document.getElementById('bio-val-smooth'),
  bioValAnticipate: document.getElementById('bio-val-anticipate'),
  bioValSpeed: document.getElementById('bio-val-speed'),
  bioValFocus: document.getElementById('bio-val-focus'),
  bioValLane: document.getElementById('bio-val-lane'),
  bioValHazard: document.getElementById('bio-val-hazard'),

  sliderSpeed: document.getElementById('slider-speed'),
  ctrlValSpeed: document.getElementById('ctrl-val-speed'),
  sliderSpeedLimit: document.getElementById('slider-speed-limit'),
  ctrlValLimit: document.getElementById('ctrl-val-limit'),
  sliderDistance: document.getElementById('slider-distance'),
  ctrlValDistance: document.getElementById('ctrl-val-distance'),
  selectWeather: document.getElementById('select-weather'),
  selectObstacle: document.getElementById('select-obstacle'),

  btnToggleVoice: document.getElementById('btn-toggle-voice'),
  btnToggleAudio: document.getElementById('btn-toggle-audio'),
  btnVoiceCommand: document.getElementById('btn-voice-command'),
  btnToggleLanguage: document.getElementById('btn-toggle-language'),
  langBtnText: document.getElementById('lang-btn-text'),
  voiceAssistantOrb: document.getElementById('voice-assistant-orb'),
  btnToggleWebcam: document.getElementById('btn-toggle-webcam'),
  btnToggleDashcam: document.getElementById('btn-toggle-dashcam'),
  dashcamBtnText: document.getElementById('dashcam-btn-text'),

  // Navigation & Map Elements
  navManeuverBanner: document.getElementById('nav-maneuver-banner'),
  navManeuverIcon: document.getElementById('nav-maneuver-icon'),
  navManeuverDist: document.getElementById('nav-maneuver-dist'),
  navManeuverText: document.getElementById('nav-maneuver-text'),
  navEta: document.getElementById('nav-eta'),
  navKmLeft: document.getElementById('nav-km-left'),
  navRadarAlert: document.getElementById('nav-radar-alert'),
  navRadarText: document.getElementById('nav-radar-text'),
  mapWrapperElement: document.getElementById('map-wrapper-element'),
  btnFollowCar: document.getElementById('btn-follow-car'),
  btnReportHazard: document.getElementById('btn-report-hazard'),
  btnExpandMap: document.getElementById('btn-expand-map'),
  quickHazardMenu: document.getElementById('quick-hazard-menu'),

  // Live GPS Location Detection Elements
  btnDetectGps: document.getElementById('btn-detect-gps'),
  btnDetectGpsText: document.getElementById('btn-detect-gps-text'),
  gpsStatusDot: document.getElementById('gps-status-dot'),
  gpsFixTitle: document.getElementById('gps-fix-title'),
  gpsAccuracyBadge: document.getElementById('gps-accuracy-badge'),
  gpsLocationName: document.getElementById('gps-location-name'),
  gpsCoords: document.getElementById('gps-coords'),

  // Satellite GNSS Telemetry Terminal
  satDetectedSpeed: document.getElementById('sat-detected-speed'),
  satSpeedMode: document.getElementById('sat-speed-mode'),
  satAltitudeVal: document.getElementById('sat-altitude-val'),
  satHdopVal: document.getElementById('sat-hdop-val'),
  satLockedCount: document.getElementById('sat-locked-count'),
  satConstellationBadge: document.getElementById('sat-constellation-badge'),

  // Google Maps Authentic Controls
  gmapSearchInput: document.getElementById('gmap-search-input'),
  gmapSearchSuggestions: document.getElementById('gmap-search-suggestions'),
  btnGmapSearch: document.getElementById('btn-gmap-search'),
  btnGmapDirections: document.getElementById('btn-gmap-directions'),
  btnGmapLayers: document.getElementById('btn-gmap-layers'),
  gmapLayersMenu: document.getElementById('gmap-layers-menu'),
  btnGmapZoomin: document.getElementById('btn-gmap-zoomin'),
  btnGmapZoomout: document.getElementById('btn-gmap-zoomout'),
  btnGmapRecenter: document.getElementById('btn-gmap-recenter'),
  btnGmapPegman: document.getElementById('btn-gmap-pegman'),
  gmapHudSpeed: document.getElementById('gmap-hud-speed'),
  gmapHudLimit: document.getElementById('gmap-hud-limit'),

  // Pegman Modal
  pegmanModal: document.getElementById('pegman-modal'),
  btnClosePegman: document.getElementById('btn-close-pegman'),
  pegmanLocationText: document.getElementById('pegman-location-text'),
  pegmanCoordsDisplay: document.getElementById('pegman-coords-display'),
  pegmanExternalLink: document.getElementById('pegman-external-link'),

  // Dedicated Full-screen Google Maps Tab Elements
  gmapFvSearchInput: document.getElementById('gmap-fv-search-input'),
  btnGmapFvSearch: document.getElementById('btn-gmap-fv-search'),
  btnGmapFvDir: document.getElementById('btn-gmap-fv-dir'),
  gmapFvSpeedNum: document.getElementById('gmap-fv-speed-num'),
  gmapFvRoadTitle: document.getElementById('gmap-fv-road-title'),
  gmapFvRoadSub: document.getElementById('gmap-fv-road-sub'),
};

// Preset Scenarios Definition
const scenarios = {
  normal: {
    speed: 72,
    speedLimit: 80,
    distance: 65,
    relativeSpeed: 0,
    obstacleDetected: false,
    weather: 'clear',
    roadCondition: 'dry',
    visibility: 'high',
    obstacles: [],
    eyeState: 'open',
    headMovement: 'stable',
    phoneUsage: false,
    attentionLevel: 'focused',
    suddenAccel: false,
    suddenBraking: false,
    laneChanges: 'stable',
    turningPattern: 'smooth',
  },
  monsoon: {
    speed: 92,
    speedLimit: 80,
    distance: 24,
    weather: 'rain',
    roadCondition: 'wet',
    visibility: 'medium',
    obstacles: ['pothole'],
    eyeState: 'open',
    headMovement: 'stable',
    phoneUsage: false,
    attentionLevel: 'focused',
    suddenAccel: false,
    suddenBraking: true,
    laneChanges: 'stable',
    turningPattern: 'smooth',
  },
  cow: {
    speed: 86,
    speedLimit: 100,
    distance: 28,
    weather: 'night',
    roadCondition: 'dry',
    visibility: 'medium',
    obstacles: ['cattle'],
    eyeState: 'open',
    headMovement: 'stable',
    phoneUsage: false,
    attentionLevel: 'focused',
    suddenAccel: false,
    suddenBraking: false,
    laneChanges: 'frequent',
    turningPattern: 'sharp',
  },
  auto: {
    speed: 58,
    speedLimit: 60,
    distance: 12,
    weather: 'clear',
    roadCondition: 'dry',
    visibility: 'high',
    obstacles: ['auto'],
    eyeState: 'open',
    headMovement: 'stable',
    phoneUsage: false,
    attentionLevel: 'focused',
    suddenAccel: false,
    suddenBraking: true,
    laneChanges: 'frequent',
    turningPattern: 'smooth',
  },
  drowsy: {
    speed: 88,
    speedLimit: 100,
    distance: 42,
    weather: 'night',
    roadCondition: 'dry',
    visibility: 'high',
    obstacles: [],
    eyeState: 'closed',
    headMovement: 'dropping',
    phoneUsage: false,
    attentionLevel: 'distracted',
    eyeClosedSeconds: 2.5,
    suddenAccel: false,
    suddenBraking: false,
    laneChanges: 'frequent',
    turningPattern: 'smooth',
  },
  rash: {
    speed: 122,
    speedLimit: 80,
    distance: 18,
    weather: 'clear',
    roadCondition: 'dry',
    visibility: 'high',
    obstacles: [],
    eyeState: 'open',
    headMovement: 'stable',
    phoneUsage: true,
    attentionLevel: 'distracted',
    suddenAccel: true,
    suddenBraking: false,
    laneChanges: 'aggressive',
    turningPattern: 'sharp',
  },
};

// Initialize Application
function init() {
  // Visualizers
  const cameraCanvas = document.getElementById('camera-canvas');
  const dmsCanvas = document.getElementById('dms-canvas');
  const webcamVideo = document.getElementById('webcam-video');

  cameraHud = new CameraHudVisualizer(cameraCanvas);
  dmsTracker = new DmsTrackerVisualizer(dmsCanvas, webcamVideo);
  gpsMap = new GpsMapComponent('gps-map');
  instrumentCluster = new InstrumentCluster('digital-instrument-cluster');

  // Ensure sound and voice are muted on startup (Quiet Mode)
  voiceAssistant.setMuted(true);
  audioEffects.setMuted(true);

  // Sync floating voice orb with voice assistant speaking/listening states
  voiceAssistant.onStateChangeCallback = ({ isSpeaking, isListening }) => {
    if (dom.voiceAssistantOrb) {
      dom.voiceAssistantOrb.classList.toggle('speaking', isSpeaking);
      dom.voiceAssistantOrb.classList.toggle('listening', isListening);
    }
  };

  window.addEventListener('resize', () => {
    cameraHud.resize();
    dmsTracker.resize();
  });
  cameraHud.resize();
  dmsTracker.resize();

  setupEventListeners();

  // Initial blackbox seed
  blackbox.logEvent({
    speed: state.speed,
    speedLimit: state.speedLimit,
    riskLevel: 'LOW',
    biggestThreat: 'System Diagnostics OK',
    immediateAction: 'Autonomous Safety Shield Active',
    location: 'Kalamboli, Navi Mumbai',
    gpsCoords: '18.9902° N, 73.1277° E',
    latG: 0.04,
    lonG: 0.02,
    driverState: 'Alert & Focused',
  });

  // Start continuous RAF rendering & periodic telemetry loop
  requestAnimationFrame(renderLoop);
  setInterval(telemetryTick, 400); // 2.5 Hz AI reasoning tick
}

// Main AI Reasoning & Arbitration Tick
function telemetryTick() {
  // 1. Evaluate Rash Driving
  const rashOutput = evaluateRashDriving({
    speed: state.speed,
    speedLimit: state.speedLimit,
    suddenAccel: state.suddenAccel,
    suddenBraking: state.suddenBraking,
    laneChanges: state.laneChanges,
    turningPattern: state.turningPattern,
  });

  // 2. Evaluate Driver State (DMS)
  const driverOutput = evaluateDriverState({
    eyeState: state.eyeState,
    headMovement: state.headMovement,
    phoneUsage: state.phoneUsage,
    attentionLevel: state.attentionLevel,
    eyeClosedSeconds: state.eyeClosedSeconds,
  });

  // 3. Evaluate Collision Prediction (FCW)
  const collisionOutput = evaluateCollisionRisk({
    distance: state.distance,
    relativeSpeed: state.relativeSpeed,
    obstacleDetected: state.obstacleDetected,
    brakingResponse: state.brakingResponse,
    ownSpeed: state.speed,
  });

  // 4. Evaluate Weather Advisory
  const weatherOutput = evaluateWeatherAdvisory({
    weather: state.weather,
    visibility: state.visibility,
    roadCondition: state.roadCondition,
    currentSpeedLimit: state.speedLimit,
  });

  // 5. Evaluate Indian Road Hazards
  const roadOutput = evaluateIndianRoadHazards({
    roadType: state.roadType,
    obstacles: state.obstacles,
    traffic: state.traffic,
  });

  // 6. Master Decision Engine
  const decision = arbitrateDrivingDecision({
    rashOutput,
    driverOutput,
    collisionOutput,
    weatherOutput,
    roadOutput,
  });

  lastDecision = decision;

  // 7. Update UI
  updateDashboardUI({
    rashOutput,
    driverOutput,
    collisionOutput,
    weatherOutput,
    roadOutput,
    decision,
  });

  // 8. Trigger Sound & Voice Alerts
  handleSoundAndVoice(decision);

  // 9. Habit Learning Engine Update
  habitEngine.logTick(decision, state);
  updateHabitProfileUI();

  // 10. Step GPS vehicle along Indian corridor & update Turn-by-Turn Navigation
  const navInfo = gpsMap.stepVehicle(state.speed);
  if (fullGpsMap) {
    fullGpsMap.stepVehicle(state.speed);
  }

  // Update Google Maps Live Navigation HUD Speed and Speed Limit
  if (dom.gmapHudSpeed) dom.gmapHudSpeed.textContent = state.speed;
  if (dom.gmapHudLimit) dom.gmapHudLimit.textContent = state.speedLimit;
  if (dom.gmapFvSpeedNum) dom.gmapFvSpeedNum.textContent = state.speed;

  if (navInfo) {
    if (navInfo.nextManeuver && dom.navManeuverText) {
      dom.navManeuverIcon.textContent = navInfo.nextManeuver.icon;
      dom.navManeuverDist.textContent = `In ${navInfo.nextManeuver.distance}`;
      dom.navManeuverText.textContent = navInfo.nextManeuver.text;
    }
    if (dom.navEta) dom.navEta.textContent = `ETA: ${navInfo.etaMins}m`;
    if (dom.navKmLeft) dom.navKmLeft.textContent = `${navInfo.kmRemaining} km left`;

    // Destination Arrival Announcement
    if (navInfo.isCustomNav && navInfo.arrived && !gpsMap._announcedArrival) {
      gpsMap._announcedArrival = true;
      audioEffects.playChime();
      voiceAssistant.speakAlert(`You have arrived at your destination: ${navInfo.destinationName}.`, 'LOW');
    }

    // Radar Proximity Alert Pill
    if (dom.navRadarAlert) {
      if (navInfo.activeHazardNearby) {
        dom.navRadarAlert.style.display = 'flex';
        dom.navRadarText.textContent = `Radar: ${navInfo.activeHazardNearby.title} (${navInfo.activeHazardNearby.distanceMeters}m ahead)`;
      } else {
        dom.navRadarAlert.style.display = 'none';
      }
    }

    // Update Live Satellite GNSS Telemetry Terminal
    const satTelem = gpsMap.getSatelliteTelemetry();
    if (satTelem) {
      if (dom.satDetectedSpeed) {
        const dispSpeed = satTelem.speed !== null && satTelem.speed > 0 ? satTelem.speed : state.speed;
        dom.satDetectedSpeed.textContent = dispSpeed;
      }
      if (dom.satSpeedMode) {
        dom.satSpeedMode.textContent = satTelem.isLive ? 'LIVE GNSS FIX' : 'DOPPLER FIX';
      }
      if (dom.satAltitudeVal) {
        dom.satAltitudeVal.textContent = satTelem.altitude;
      }
      if (dom.satHdopVal) {
        dom.satHdopVal.textContent = satTelem.hdop;
      }
      if (dom.satLockedCount) {
        dom.satLockedCount.textContent = `${satTelem.satellitesLocked}/${satTelem.satellitesInView}`;
      }
      if (dom.satConstellationBadge) {
        dom.satConstellationBadge.textContent = 'NavIC 🇮🇳 + GPS';
      }
      if (dom.gpsAccuracyBadge) {
        dom.gpsAccuracyBadge.textContent = `±${satTelem.accuracy}m WGS-84`;
      }
      if (dom.gpsLocationName) {
        dom.gpsLocationName.textContent = `📍 ${satTelem.roadName}`;
      }
      if (dom.gpsCoords) {
        dom.gpsCoords.textContent = `${typeof satTelem.lat === 'number' ? satTelem.lat.toFixed(5) : satTelem.lat}° N, ${typeof satTelem.lng === 'number' ? satTelem.lng.toFixed(5) : satTelem.lng}° E`;
      }
      if (dom.gmapFvRoadTitle) {
        dom.gmapFvRoadTitle.textContent = `${satTelem.roadName}`;
      }
      if (dom.gmapFvRoadSub) {
        dom.gmapFvRoadSub.textContent = `Speed Limit: ${state.speedLimit} km/h • NavIC 🇮🇳 + GPS Locked (${satTelem.satellitesLocked} Sats) • HDOP: ${satTelem.hdop}`;
      }
    }
  }

  // 11. Render Professional Digital Instrument Cluster
  if (instrumentCluster) {
    instrumentCluster.render(state);
  }

  // 12. Update Professional ADAS Status Pills
  updateAdasStatus(decision);

  // 13. Update Vehicle Kinematics Diagnostics
  updateDiagnosticsTab(decision);

  // 14. Blackbox Event Logging
  if (decision.finalRiskLevel === 'HIGH' || decision.finalRiskLevel === 'CRITICAL' || state.suddenBraking || state.speed > state.speedLimit + 20) {
    if (Math.random() < 0.2) { // sample rolling events
      blackbox.logEvent({
        speed: state.speed,
        speedLimit: state.speedLimit,
        riskLevel: decision.finalRiskLevel,
        biggestThreat: decision.biggestThreat,
        immediateAction: decision.immediateAction,
        location: dom.gpsLocationName?.textContent || 'Indian Highway',
        gpsCoords: dom.gpsCoords?.textContent || '',
        latG: state.turningPattern === 'sharp' ? 0.45 : 0.05,
        lonG: state.suddenBraking ? -0.75 : 0.05,
        driverState: driverOutput.driverState,
      });
      renderBlackboxTable();
    }
  }
}

// 60 FPS Render Loop for Canvas HUD
function renderLoop() {
  if (cameraHud && lastDecision) {
    cameraHud.render(state, lastDecision);
  }
  if (dmsTracker) {
    dmsTracker.render(state);
  }
  requestAnimationFrame(renderLoop);
}

// Sound and Voice Dispatcher (Throttled & Non-Irritating)
function handleSoundAndVoice(decision) {
  const currentRisk = decision.finalRiskLevel;
  const isRiskEscalation =
    (currentRisk === 'CRITICAL' && lastRiskLevel !== 'CRITICAL') ||
    (currentRisk === 'HIGH' && lastRiskLevel !== 'HIGH' && lastRiskLevel !== 'CRITICAL') ||
    (currentRisk === 'MEDIUM' && lastRiskLevel === 'LOW');
  const isNewThreat = decision.voiceAlertMessage && decision.voiceAlertMessage !== lastAlertMessage;

  // Sound effects - ONLY on genuine risk escalation or new critical hazard
  if (soundEnabled) {
    if (isRiskEscalation || (currentRisk === 'CRITICAL' && isNewThreat)) {
      if (currentRisk === 'CRITICAL') {
        audioEffects.playCriticalEmergencyAlarm();
      } else if (currentRisk === 'HIGH') {
        audioEffects.playCollisionWarningBeep(state.distance < 20 ? 1.2 : 2.2);
      } else if (currentRisk === 'MEDIUM') {
        audioEffects.playChime();
      }
    }
  }

  // Voice alert synthesis (Web Speech API) - ONLY on escalation or distinct new warning
  if (voiceEnabled && decision.voiceAlertMessage) {
    if (isRiskEscalation || (isNewThreat && (currentRisk === 'CRITICAL' || currentRisk === 'HIGH'))) {
      voiceAssistant.speakAlert(decision.voiceAlertMessage, currentRisk);
      lastAlertMessage = decision.voiceAlertMessage;
    }
  }

  lastRiskLevel = currentRisk;
}

// UI State Updates
function updateDashboardUI({ rashOutput, driverOutput, collisionOutput, weatherOutput, roadOutput, decision }) {
  // Clock
  dom.telemetryClock.textContent = new Date().toLocaleTimeString();

  // Master Banner
  dom.masterBanner.className = `master-banner risk-${decision.finalRiskLevel}`;
  dom.riskVal.textContent = decision.finalRiskLevel;
  dom.biggestThreat.textContent = decision.biggestThreat;
  dom.immediateAction.textContent = decision.immediateAction;
  dom.voiceMessage.textContent = `“${decision.voiceAlertMessage}”`;

  // Gauges
  dom.metricSpeed.textContent = Math.round(state.speed);
  dom.metricSpeedLimit.textContent = state.speedLimit;
  dom.metricDistance.textContent = Math.round(state.distance);
  dom.metricTtc.textContent = collisionOutput.timeToImpact || '9.9';

  // 1. Rash Driving Card
  dom.engRashDetail.textContent = `Score: ${rashOutput.rashScore}/100 • ${rashOutput.behaviorsDetected.join(', ')}`;
  dom.engRashTag.textContent = rashOutput.riskLevel;
  dom.engRashTag.className = `risk-tag ${rashOutput.riskLevel.toLowerCase()}`;

  // 2. DMS Card
  dom.engDmsDetail.textContent = `${driverOutput.driverState} • ${driverOutput.alert}`;
  dom.engDmsTag.textContent = driverOutput.riskLevel;
  dom.engDmsTag.className = `risk-tag ${driverOutput.riskLevel.toLowerCase()}`;

  // 3. Collision Card
  dom.engCollisionDetail.textContent = `${collisionOutput.immediateAction} (TTC: ${collisionOutput.timeToImpact}s)`;
  dom.engCollisionTag.textContent = collisionOutput.collisionRisk;
  dom.engCollisionTag.className = `risk-tag ${collisionOutput.collisionRisk.toLowerCase()}`;

  // 4. Weather Card
  dom.engWeatherDetail.textContent = `${weatherOutput.drivingAdvice} • Safe Max: ${weatherOutput.speedRecommendation}`;
  dom.engWeatherTag.textContent = weatherOutput.riskLevel;
  dom.engWeatherTag.className = `risk-tag ${weatherOutput.riskLevel.toLowerCase()}`;

  // 5. Indian Hazards Card
  dom.engIndianDetail.textContent = `${roadOutput.detectedHazards.join(', ')}`;
  dom.engIndianTag.textContent = roadOutput.roadRisk;
  dom.engIndianTag.className = `risk-tag ${roadOutput.roadRisk.toLowerCase()}`;

  // Diagnostics list
  dom.detectedIssuesList.textContent = decision.summaryIssues.join('  •  ');

  // DMS Progress Bars
  const isEyeClosed = state.eyeState === 'closed';
  const isEyeDroopy = state.eyeState === 'droopy';
  const earScore = isEyeClosed ? 0 : (isEyeDroopy ? 45 : 90);
  dom.dmsEyeVal.textContent = isEyeClosed ? 'Closed 😴 (0.05)' : (isEyeDroopy ? 'Droopy 🥱 (0.18)' : 'Open 👀 (0.34)');
  dom.dmsEyeBar.style.width = `${earScore}%`;
  dom.dmsEyeBar.style.background = isEyeClosed ? 'var(--accent-crimson)' : (isEyeDroopy ? 'var(--accent-amber)' : 'var(--accent-cyan)');

  const isDistracted = state.attentionLevel === 'distracted';
  dom.dmsAttentionVal.textContent = isDistracted ? 'Distracted ⚠️ (42%)' : 'Focused 🎯 (98%)';
  dom.dmsAttentionBar.style.width = isDistracted ? '42%' : '98%';
  dom.dmsAttentionBar.style.background = isDistracted ? 'var(--accent-rose)' : 'var(--accent-emerald)';

  dom.dmsPhoneVal.textContent = state.phoneUsage ? 'DETECTED IN HAND 📱' : 'None Detected';
  dom.dmsPhoneVal.style.color = state.phoneUsage ? 'var(--accent-crimson)' : 'var(--accent-emerald)';
}

function updateHabitProfileUI() {
  const profile = habitEngine.getProfile();
  if (dom.habitScore) dom.habitScore.textContent = profile.safetyScore;
  if (dom.driverPersona) dom.driverPersona.textContent = profile.persona;
  if (dom.tripKm) dom.tripKm.textContent = `${profile.kmDriven} km`;
  if (dom.coachingTip) dom.coachingTip.textContent = profile.coachingTips[0] || 'Keep driving safely.';

  // Telemetry Insurance Discount Pill
  if (dom.habitInsurancePill) {
    dom.habitInsurancePill.textContent = `${profile.insuranceTier} • ${profile.insuranceDiscount}% Premium Discount`;
  }

  // 6-Axis Biometrics Readouts
  const bio = profile.biometrics || {
    smoothness: 94,
    anticipation: 90,
    speedDiscipline: 88,
    focus: 95,
    laneDiscipline: 92,
    hazardReflex: 93,
  };

  if (dom.bioValSmooth) dom.bioValSmooth.textContent = `${bio.smoothness}%`;
  if (dom.bioValAnticipate) dom.bioValAnticipate.textContent = `${bio.anticipation}%`;
  if (dom.bioValSpeed) dom.bioValSpeed.textContent = `${bio.speedDiscipline}%`;
  if (dom.bioValFocus) dom.bioValFocus.textContent = `${bio.focus}%`;
  if (dom.bioValLane) dom.bioValLane.textContent = `${bio.laneDiscipline}%`;
  if (dom.bioValHazard) dom.bioValHazard.textContent = `${bio.hazardReflex}%`;

  // Dynamic 6-Axis Radar SVG Polygon
  if (dom.radarDataPolygon) {
    const r0 = (Math.max(10, Math.min(100, bio.smoothness)) / 100) * 50;
    const r1 = (Math.max(10, Math.min(100, bio.anticipation)) / 100) * 50;
    const r2 = (Math.max(10, Math.min(100, bio.speedDiscipline)) / 100) * 50;
    const r3 = (Math.max(10, Math.min(100, bio.focus)) / 100) * 50;
    const r4 = (Math.max(10, Math.min(100, bio.laneDiscipline)) / 100) * 50;
    const r5 = (Math.max(10, Math.min(100, bio.hazardReflex)) / 100) * 50;

    const p0 = `65,${Math.round(65 - r0)}`;
    const p1 = `${Math.round(65 + r1 * 0.866)},${Math.round(65 - r1 * 0.5)}`;
    const p2 = `${Math.round(65 + r2 * 0.866)},${Math.round(65 + r2 * 0.5)}`;
    const p3 = `65,${Math.round(65 + r3)}`;
    const p4 = `${Math.round(65 - r4 * 0.866)},${Math.round(65 + r4 * 0.5)}`;
    const p5 = `${Math.round(65 - r5 * 0.866)},${Math.round(65 - r5 * 0.5)}`;

    dom.radarDataPolygon.setAttribute('points', `${p0} ${p1} ${p2} ${p3} ${p4} ${p5}`);
  }

  // Incident log pills
  if (profile.recentIncidents.length > 0 && dom.incidentLog) {
    dom.incidentLog.innerHTML = profile.recentIncidents.map(inc => `
      <div class="incident-row">
        <span>${inc.type}: ${inc.detail}</span>
        <span style="color:var(--text-muted); font-size:10px;">${inc.time}</span>
      </div>
    `).join('');
  }
}

// Event Listeners for Sandbox & Controls
function setupEventListeners() {
  // Speed Slider
  dom.sliderSpeed.addEventListener('input', (e) => {
    state.speed = Number(e.target.value);
    dom.ctrlValSpeed.textContent = state.speed;
  });

  // Speed Limit Slider
  dom.sliderSpeedLimit.addEventListener('input', (e) => {
    state.speedLimit = Number(e.target.value);
    dom.ctrlValLimit.textContent = state.speedLimit;
  });

  // Distance Slider
  dom.sliderDistance.addEventListener('input', (e) => {
    state.distance = Number(e.target.value);
    dom.ctrlValDistance.textContent = state.distance;
  });

  // Weather Select
  dom.selectWeather.addEventListener('change', (e) => {
    const val = e.target.value;
    state.weather = val;
    state.roadCondition = (val === 'rain') ? 'wet' : 'dry';
    state.visibility = (val === 'fog') ? 'low' : ((val === 'night') ? 'medium' : 'high');
  });

  // Obstacle Select
  dom.selectObstacle.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'none') {
      state.obstacles = [];
    } else {
      state.obstacles = [val];
    }
  });

  // Eye State Chips
  const eyeChips = [
    document.getElementById('chip-eye-open'),
    document.getElementById('chip-eye-droopy'),
    document.getElementById('chip-eye-closed'),
  ];
  eyeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      eyeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const eye = chip.dataset.eye;
      state.eyeState = eye;
      state.eyeClosedSeconds = eye === 'closed' ? 2.5 : (eye === 'droopy' ? 1.0 : 0);
      if (eye === 'closed') {
        state.headMovement = 'dropping';
      } else {
        state.headMovement = 'stable';
      }
    });
  });

  // Phone Chips
  const chipPhoneNo = document.getElementById('chip-phone-no');
  const chipPhoneYes = document.getElementById('chip-phone-yes');
  chipPhoneNo.addEventListener('click', () => {
    chipPhoneNo.classList.add('active');
    chipPhoneYes.classList.remove('active');
    state.phoneUsage = false;
    state.attentionLevel = 'focused';
  });
  chipPhoneYes.addEventListener('click', () => {
    chipPhoneYes.classList.add('active');
    chipPhoneNo.classList.remove('active');
    state.phoneUsage = true;
    state.attentionLevel = 'distracted';
  });

  // Dynamics Chips (Sudden accel / brake)
  const chipAccel = document.getElementById('chip-sudden-accel');
  const chipBrake = document.getElementById('chip-sudden-brake');
  chipAccel.addEventListener('click', () => {
    state.suddenAccel = !state.suddenAccel;
    chipAccel.classList.toggle('active', state.suddenAccel);
  });
  chipBrake.addEventListener('click', () => {
    state.suddenBraking = !state.suddenBraking;
    chipBrake.classList.toggle('active', state.suddenBraking);
  });

  // Scenario Buttons
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const scKey = btn.dataset.scenario;
      applyScenario(scKey);
    });
  });

  // Corridor Selector Buttons
  const corridorBtns = document.querySelectorAll('.btn-corridor');
  corridorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      corridorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const corKey = btn.dataset.corridor;
      gpsMap.loadCorridor(corKey);
      if (fullGpsMap) {
        fullGpsMap.loadCorridor(corKey);
      }
      const badgeText = btn.textContent.split(' ')[0] + ' ' + (btn.textContent.split(' ')[1] || '');
      document.getElementById('corridor-badge').textContent = badgeText;
      
      const cor = gpsMap.corridors[corKey];
      if (cor) {
        state.speedLimit = cor.defaultSpeedLimit;
        dom.sliderSpeedLimit.value = cor.defaultSpeedLimit;
        dom.ctrlValLimit.textContent = cor.defaultSpeedLimit;
        voiceAssistant.speakAlert(`Corridor changed to ${cor.name}. Speed limit ${cor.defaultSpeedLimit} km/h.`, 'LOW');
      }
    });
  });

  // Map Layer Switcher Buttons
  const layerBtns = document.querySelectorAll('.btn-layer');
  layerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      layerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layerKey = btn.dataset.layer;
      gpsMap.setLayer(layerKey);
    });
  });

  // Follow Car Button
  dom.btnFollowCar?.addEventListener('click', () => {
    const isFollow = gpsMap.toggleFollowCar();
    dom.btnFollowCar.classList.toggle('active', isFollow);
    dom.btnFollowCar.querySelector('span').textContent = isFollow ? '🎯 Center Car' : '🗺️ Free Roam';
  });

  // Report Hazard Toggle Button
  dom.btnReportHazard?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dom.quickHazardMenu.style.display === 'none';
    dom.quickHazardMenu.style.display = isHidden ? 'flex' : 'none';
  });

  document.addEventListener('click', () => {
    if (dom.quickHazardMenu) {
      dom.quickHazardMenu.style.display = 'none';
    }
  });

  // Quick Hazard Item Buttons
  document.querySelectorAll('.btn-hazard-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const title = btn.textContent.trim();
      const carLatLng = gpsMap.vehicleMarker.getLatLng();
      gpsMap.addCustomHazard(carLatLng.lat, carLatLng.lng, type, title);
      dom.quickHazardMenu.style.display = 'none';
      audioEffects.playChime();
      voiceAssistant.speakAlert(`Hazard reported: ${title} pinned to Suraksha Network.`, 'LOW');
    });
  });

  // Live Device GPS Location Detection Button
  dom.btnDetectGps?.addEventListener('click', async () => {
    if (gpsMap.isLiveGpsActive) {
      // Toggle off live GPS and restore corridor simulation
      gpsMap.stopLiveLocationTracking();
      dom.btnDetectGps.classList.remove('active');
      dom.btnDetectGpsText.textContent = '📍 Detect My Location';
      dom.gpsStatusDot.className = 'lls-status-dot simulated';
      const curCorridor = gpsMap.corridors[gpsMap.currentCorridor];
      dom.gpsFixTitle.textContent = `GPS: Simulated Corridor (${curCorridor.name})`;
      dom.gpsAccuracyBadge.textContent = 'Simulated Feed';
      audioEffects.playChime();
      voiceAssistant.speakAlert('Switched back to simulated highway corridor navigation.', 'LOW');
    } else {
      dom.btnDetectGpsText.textContent = '📡 Locking Satellite...';
      const loc = await gpsMap.detectCurrentLocation();
      if (loc) {
        dom.btnDetectGps.classList.add('active');
        dom.btnDetectGpsText.textContent = '📍 Live GNSS: Active';
        dom.gpsStatusDot.className = 'lls-status-dot';
        dom.gpsFixTitle.textContent = 'GNSS: Satellite 3D Doppler Fix';
        dom.gpsAccuracyBadge.textContent = `±${loc.accuracy}m WGS-84`;
        dom.gpsLocationName.textContent = `📍 ${loc.locationName}`;
        dom.gpsCoords.textContent = `${loc.lat.toFixed(5)}° N, ${loc.lng.toFixed(5)}° E`;

        if (loc.speed !== null && loc.speed > 0) {
          state.speed = loc.speed;
          dom.sliderSpeed.value = loc.speed;
          dom.ctrlValSpeed.textContent = loc.speed;
        }

        // Start continuous background watching
        gpsMap.startLiveLocationTracking((updatedLoc) => {
          dom.gpsLocationName.textContent = `📍 ${updatedLoc.locationName}`;
          dom.gpsCoords.textContent = `${updatedLoc.lat.toFixed(5)}° N, ${updatedLoc.lng.toFixed(5)}° E`;
          dom.gpsAccuracyBadge.textContent = `±${updatedLoc.accuracy}m WGS-84`;
          if (updatedLoc.speed !== null && updatedLoc.speed > 0) {
            state.speed = updatedLoc.speed;
            dom.sliderSpeed.value = updatedLoc.speed;
            dom.ctrlValSpeed.textContent = updatedLoc.speed;
          }
        });

        audioEffects.playChime();
        voiceAssistant.speakAlert(`Satellite 3D fix locked at ${loc.city || loc.locationName}. Ground speed tracking active.`, 'LOW');
      } else {
        dom.btnDetectGpsText.textContent = '📍 Detect My Location';
      }
    }
  });

  // Expand / Fullscreen Map Button
  dom.btnExpandMap?.addEventListener('click', () => {
    const isFull = dom.mapWrapperElement.classList.toggle('fullscreen-map');
    dom.btnExpandMap.querySelector('span').textContent = isFull ? '✕ Minimize' : '⛶ Maximize';
    setTimeout(() => {
      gpsMap.map.invalidateSize();
    }, 200);
  });

  // Google Maps Autocomplete Suggestions & Place Search
  const showSearchSuggestions = (query) => {
    if (!dom.gmapSearchSuggestions || !gpsMap) return;
    const suggestions = gpsMap.getSearchSuggestions(query);
    if (!suggestions || suggestions.length === 0) {
      dom.gmapSearchSuggestions.style.display = 'none';
      return;
    }
    dom.gmapSearchSuggestions.innerHTML = suggestions.map(s => `
      <div class="gmap-suggestion-item" data-name="${s.name.replace(/"/g, '&quot;')}" data-lat="${s.lat}" data-lng="${s.lng}">
        <span class="sug-icon">${s.icon || '📍'}</span>
        <div class="sug-info">
          <span class="sug-title">${s.name}</span>
          <span class="sug-desc">${s.desc}</span>
        </div>
      </div>
    `).join('');
    dom.gmapSearchSuggestions.style.display = 'flex';

    dom.gmapSearchSuggestions.querySelectorAll('.gmap-suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = item.dataset.name;
        if (dom.gmapSearchInput) dom.gmapSearchInput.value = name;
        dom.gmapSearchSuggestions.style.display = 'none';
        handlePlaceSearch(dom.gmapSearchInput);
      });
    });
  };

  dom.gmapSearchInput?.addEventListener('input', (e) => {
    showSearchSuggestions(e.target.value);
  });
  dom.gmapSearchInput?.addEventListener('focus', (e) => {
    showSearchSuggestions(e.target.value);
  });

  document.addEventListener('click', (e) => {
    if (dom.gmapSearchSuggestions && !dom.gmapSearchInput?.contains(e.target) && !dom.gmapSearchSuggestions.contains(e.target)) {
      dom.gmapSearchSuggestions.style.display = 'none';
    }
  });

  const handlePlaceSearch = async (inputEl) => {
    if (!inputEl) return;
    if (dom.gmapSearchSuggestions) dom.gmapSearchSuggestions.style.display = 'none';
    const q = inputEl.value.trim();
    if (!q) return;
    let res = null;
    if (gpsMap) res = await gpsMap.searchPlace(q);
    if (fullGpsMap) await fullGpsMap.searchPlace(q);
    if (res) {
      voiceAssistant.speakAlert(`Found ${res.name} on Google Maps Satellite.`, 'LOW');
      audioEffects.playChime();
    } else {
      voiceAssistant.speakAlert(`Location searched: ${q}. Satellite viewport centered.`, 'LOW');
      audioEffects.playChime();
    }
  };

  dom.btnGmapSearch?.addEventListener('click', () => handlePlaceSearch(dom.gmapSearchInput));
  dom.gmapSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePlaceSearch(dom.gmapSearchInput);
  });

  dom.btnGmapFvSearch?.addEventListener('click', () => handlePlaceSearch(dom.gmapFvSearchInput));
  dom.gmapFvSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePlaceSearch(dom.gmapFvSearchInput);
  });

  // Directions buttons
  dom.btnGmapDirections?.addEventListener('click', () => {
    gpsMap?.recenterOnCar();
    audioEffects.playChime();
    voiceAssistant.speakAlert('Turn-by-turn satellite route active towards destination.', 'LOW');
  });
  dom.btnGmapFvDir?.addEventListener('click', () => {
    fullGpsMap?.recenterOnCar();
    gpsMap?.recenterOnCar();
    audioEffects.playChime();
    voiceAssistant.speakAlert('Turn-by-turn satellite route active towards destination.', 'LOW');
  });

  // Global Real-Time Navigation Execution
  window.startNavigationTo = async (lat, lng, name) => {
    if (!gpsMap) return;
    gpsMap._announcedArrival = false;
    const navResult = await gpsMap.startNavigationTo(lat, lng, name);
    if (fullGpsMap) {
      fullGpsMap._announcedArrival = false;
      await fullGpsMap.startNavigationTo(lat, lng, name);
    }

    if (dom.navManeuverIcon) dom.navManeuverIcon.textContent = '↗️';
    if (dom.navManeuverDist) dom.navManeuverDist.textContent = 'In 200 m';
    if (dom.navManeuverText) dom.navManeuverText.textContent = `Head towards ${name}`;
    if (dom.navEta && navResult) dom.navEta.textContent = `ETA: ${navResult.estimatedMins}m`;
    if (dom.navKmLeft && navResult) dom.navKmLeft.textContent = `${navResult.distanceKm} km left`;

    const btnStopNav = document.getElementById('btn-stop-nav');
    if (btnStopNav) btnStopNav.style.display = 'inline-flex';

    audioEffects.playChime();
    voiceAssistant.speakAlert(`Starting navigation to ${name}. Route calculated. Drive safely.`, 'LOW');
  };

  window.stopNavigation = () => {
    if (gpsMap) gpsMap.stopNavigation();
    if (fullGpsMap) fullGpsMap.stopNavigation();
    const btnStopNav = document.getElementById('btn-stop-nav');
    if (btnStopNav) btnStopNav.style.display = 'none';
    audioEffects.playChime();
    voiceAssistant.speakAlert('Navigation ended. Returned to standard highway corridor mode.', 'LOW');
  };

  document.getElementById('btn-stop-nav')?.addEventListener('click', () => {
    window.stopNavigation();
  });

  // Google Maps Category Chips Filtering
  document.querySelectorAll('.gmap-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      // Sync all matching chips
      document.querySelectorAll('.gmap-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.cat === cat);
      });
      gpsMap?.filterCategory(cat);
      fullGpsMap?.filterCategory(cat);
      audioEffects.playChime();
    });
  });

  // Google Maps Layers Dropdown
  dom.btnGmapLayers?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dom.gmapLayersMenu) {
      const isHidden = dom.gmapLayersMenu.style.display === 'none' || !dom.gmapLayersMenu.style.display;
      dom.gmapLayersMenu.style.display = isHidden ? 'flex' : 'none';
    }
  });

  document.addEventListener('click', () => {
    if (dom.gmapLayersMenu) dom.gmapLayersMenu.style.display = 'none';
  });

  document.querySelectorAll('.gmap-layer-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.gmap-layer-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const layerKey = item.dataset.layer;
      gpsMap?.setLayer(layerKey);
      fullGpsMap?.setLayer(layerKey);
      if (dom.gmapLayersMenu) dom.gmapLayersMenu.style.display = 'none';
      audioEffects.playChime();
      voiceAssistant.speakAlert(`Google Maps layer set to ${item.querySelector('span')?.textContent || layerKey}.`, 'LOW');
    });
  });

  // Bottom-Right Control Cluster (Zoom & Recenter)
  dom.btnGmapZoomin?.addEventListener('click', () => {
    gpsMap?.zoomIn();
    fullGpsMap?.zoomIn();
  });
  dom.btnGmapZoomout?.addEventListener('click', () => {
    gpsMap?.zoomOut();
    fullGpsMap?.zoomOut();
  });
  dom.btnGmapRecenter?.addEventListener('click', () => {
    gpsMap?.recenterOnCar();
    fullGpsMap?.recenterOnCar();
    audioEffects.playChime();
  });

  // Street View Pegman Modal
  dom.btnGmapPegman?.addEventListener('click', () => {
    if (dom.pegmanModal) {
      const coords = gpsMap?.vehicleMarker ? gpsMap.vehicleMarker.getLatLng() : { lat: 12.98289, lng: 80.23586 };
      const latStr = coords.lat.toFixed(5);
      const lngStr = coords.lng.toFixed(5);
      if (dom.pegmanCoordsDisplay) dom.pegmanCoordsDisplay.textContent = `${latStr}° N, ${lngStr}° E`;
      if (dom.pegmanLocationText) {
        const cor = gpsMap?.corridors[gpsMap.currentCorridor];
        dom.pegmanLocationText.textContent = `${cor?.name || 'Chennai OMR'} (Lat: ${latStr}, Lng: ${lngStr})`;
      }
      if (dom.pegmanExternalLink) {
        dom.pegmanExternalLink.href = `https://www.google.com/maps/@${coords.lat},${coords.lng},19z/data=!3m1!1e3`;
      }
      dom.pegmanModal.style.display = 'flex';
      audioEffects.playChime();
    }
  });

  dom.btnClosePegman?.addEventListener('click', () => {
    if (dom.pegmanModal) dom.pegmanModal.style.display = 'none';
  });

  // Voice Toggle
  dom.btnToggleVoice.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceAssistant.setMuted(!voiceEnabled);
    dom.btnToggleVoice.classList.toggle('active', voiceEnabled);
    dom.btnToggleVoice.querySelector('.btn-text').textContent = `Voice: ${voiceEnabled ? 'ON' : 'OFF'}`;
    const iconSpan = dom.btnToggleVoice.querySelector('.icon');
    if (iconSpan) iconSpan.textContent = voiceEnabled ? '🔊' : '🔈';
    const cfgQuiet = document.getElementById('cfg-quiet-mode');
    if (cfgQuiet) cfgQuiet.checked = !voiceEnabled && !soundEnabled;
    if (voiceEnabled) {
      voiceAssistant.speakAlert('Voice safety alerts enabled.', 'LOW');
    }
  });

  // Audio Sound Toggle
  dom.btnToggleAudio.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audioEffects.setMuted(!soundEnabled);
    dom.btnToggleAudio.classList.toggle('active', soundEnabled);
    dom.btnToggleAudio.querySelector('.btn-text').textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
    const iconSpan = dom.btnToggleAudio.querySelector('.icon');
    if (iconSpan) iconSpan.textContent = soundEnabled ? '🔔' : '🔕';
    const cfgQuiet = document.getElementById('cfg-quiet-mode');
    if (cfgQuiet) cfgQuiet.checked = !voiceEnabled && !soundEnabled;
    if (soundEnabled) {
      audioEffects.playChime();
    }
  });

  // Voice Query Assistant Button
  dom.btnVoiceCommand?.addEventListener('click', () => {
    if (voiceAssistant.isListening) {
      voiceAssistant.stopListening();
      dom.btnVoiceCommand.classList.remove('active');
      dom.btnVoiceCommand.querySelector('.btn-text').textContent = 'Voice Query';
    } else {
      dom.btnVoiceCommand.classList.add('active');
      dom.btnVoiceCommand.querySelector('.btn-text').textContent = 'Listening...';
      voiceAssistant.startListening((command) => {
        handleVoiceCommand(command);
        dom.btnVoiceCommand.classList.remove('active');
        dom.btnVoiceCommand.querySelector('.btn-text').textContent = 'Voice Query';
      });
    }
  });

  // Floating Neural Voice Orb Click Trigger
  dom.voiceAssistantOrb?.addEventListener('click', () => {
    if (voiceAssistant.isListening) {
      voiceAssistant.stopListening();
    } else {
      audioEffects.playChime();
      voiceAssistant.startListening((command) => {
        handleVoiceCommand(command);
      });
    }
  });

  // Copilot Language Toggle (English <-> Hinglish)
  dom.btnToggleLanguage?.addEventListener('click', () => {
    const nextMode = voiceAssistant.languageMode === 'hinglish' ? 'en' : 'hinglish';
    voiceAssistant.setLanguageMode(nextMode);
    if (dom.langBtnText) {
      dom.langBtnText.textContent = nextMode === 'hinglish' ? 'Hinglish 🇮🇳' : 'English 🇬🇧';
    }
    audioEffects.playChime();
    voiceAssistant.speakAlert(
      nextMode === 'hinglish' ? 'Hinglish bhasha copilot active. Suraksha alert shuru.' : 'English safety copilot active.',
      'LOW'
    );
  });

  // Live Dashcam Road Vision Toggle
  dom.btnToggleDashcam?.addEventListener('click', async () => {
    if (!cameraHud) return;
    const active = await cameraHud.toggleLiveDashcam();
    dom.btnToggleDashcam.classList.toggle('active', active);
    if (dom.dashcamBtnText) {
      dom.dashcamBtnText.textContent = active ? '🔴 Stop Dashcam' : '📹 Live Dashcam';
    }
    audioEffects.playChime();
    voiceAssistant.speakAlert(
      active ? 'Forward dashcam online with live AI lane tracking.' : 'Simulated road vision restored.',
      'LOW'
    );
  });

  // Webcam Toggle (DMS Eye Tracker)
  dom.btnToggleWebcam?.addEventListener('click', async () => {
    const active = await dmsTracker.toggleWebcam();
    dom.btnToggleWebcam.classList.toggle('active', active);
    dom.btnToggleWebcam.querySelector('span').textContent = active ? '🔴 Stop Webcam' : '📹 Test Webcam';
  });

  // Workspace Navigation Tabs
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.workspace-view').forEach(view => view.classList.remove('active'));
      const activeView = document.getElementById(`view-${targetTab}`);
      if (activeView) activeView.classList.add('active');

      if (targetTab === 'cockpit' && gpsMap) {
        setTimeout(() => gpsMap.map.invalidateSize(), 150);
      }
      if (targetTab === 'gmap') {
        if (!fullGpsMap && document.getElementById('gps-full-map')) {
          fullGpsMap = new GpsMapComponent('gps-full-map');
          fullGpsMap.loadCorridor(gpsMap ? gpsMap.currentCorridor : 'chennai_omr');
        }
        setTimeout(() => {
          if (fullGpsMap) fullGpsMap.map.invalidateSize();
        }, 150);
      }
      if (targetTab === 'blackbox') {
        renderBlackboxTable();
      }
    });
  });

  // Export Blackbox JSON
  document.getElementById('btn-export-blackbox')?.addEventListener('click', () => {
    blackbox.exportJson();
    voiceAssistant.speakAlert('Blackbox telemetry flight record exported as JSON.', 'LOW');
  });

  // Emergency SOS 112 Trigger Simulation
  document.getElementById('btn-trigger-sos')?.addEventListener('click', () => {
    const payload = blackbox.generateSosPayload();
    const modal = document.getElementById('sos-modal');
    const textElem = document.getElementById('sos-payload-text');
    if (modal && textElem) {
      textElem.textContent = JSON.stringify(payload, null, 2);
      modal.style.display = 'flex';
      audioEffects.playCriticalEmergencyAlarm();
      voiceAssistant.speakAlert('Emergency 112 SOS dispatched with GPS coordinates and vehicle impact metrics.', 'CRITICAL');
    }
  });

  document.getElementById('btn-close-sos')?.addEventListener('click', () => {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.style.display = 'none';
  });

  // Settings & Sensitivity Inputs (Anti-Annoyance Controls)
  const cfgQuietMode = document.getElementById('cfg-quiet-mode');
  if (cfgQuietMode) {
    cfgQuietMode.addEventListener('change', (e) => {
      const quiet = e.target.checked;
      voiceEnabled = !quiet;
      soundEnabled = !quiet;
      voiceAssistant.setMuted(quiet);
      audioEffects.setMuted(quiet);

      dom.btnToggleVoice.classList.toggle('active', voiceEnabled);
      dom.btnToggleVoice.querySelector('.btn-text').textContent = `Voice: ${voiceEnabled ? 'ON' : 'OFF'}`;
      dom.btnToggleVoice.querySelector('.icon').textContent = voiceEnabled ? '🔊' : '🔈';

      dom.btnToggleAudio.classList.toggle('active', soundEnabled);
      dom.btnToggleAudio.querySelector('.btn-text').textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
      dom.btnToggleAudio.querySelector('.icon').textContent = soundEnabled ? '🔔' : '🔕';
    });
  }

  document.getElementById('cfg-audio-vol')?.addEventListener('input', (e) => {
    audioEffects.setVolume(e.target.value);
  });

  document.getElementById('cfg-voice-vol')?.addEventListener('input', (e) => {
    voiceAssistant.setVolume(e.target.value);
  });

  document.getElementById('cfg-voice-rate')?.addEventListener('input', (e) => {
    voiceAssistant.setRate(e.target.value);
  });
}

function updateAdasStatus(decision) {
  const isCritical = decision.finalRiskLevel === 'CRITICAL';
  const isHigh = decision.finalRiskLevel === 'HIGH';

  const fcwPill = document.getElementById('adas-fcw');
  const aebPill = document.getElementById('adas-aeb');
  const lkaPill = document.getElementById('adas-lka');
  const dmsPill = document.getElementById('adas-dms');
  const tsrPill = document.getElementById('adas-tsr');

  if (fcwPill) {
    fcwPill.className = `adas-pill ${isCritical ? 'critical' : (isHigh ? 'warning' : '')}`;
    fcwPill.innerHTML = `<span class="adas-dot"></span> FCW: ${isCritical ? 'ALERT!' : (isHigh ? 'CAUTION' : 'READY')}`;
  }
  if (aebPill) {
    aebPill.className = `adas-pill ${isCritical ? 'critical' : ''}`;
    aebPill.innerHTML = `<span class="adas-dot"></span> AEB: ${isCritical ? 'ACTIVE!' : 'ARMED'}`;
  }
  if (lkaPill) {
    const isWeaving = state.laneChanges !== 'stable';
    lkaPill.className = `adas-pill ${isWeaving ? 'warning' : ''}`;
    lkaPill.innerHTML = `<span class="adas-dot"></span> LKA: ${isWeaving ? 'LANE DRIFT' : 'ACTIVE'}`;
  }
  if (dmsPill) {
    const isDrowsy = state.eyeState === 'closed' || state.phoneUsage;
    dmsPill.className = `adas-pill ${isDrowsy ? 'critical' : ''}`;
    dmsPill.innerHTML = `<span class="adas-dot"></span> DMS: ${state.eyeState === 'closed' ? 'DROWSY!' : (state.phoneUsage ? 'PHONE!' : 'IR 60FPS')}`;
  }
  if (tsrPill) {
    tsrPill.innerHTML = `<span class="adas-dot"></span> TSR: ${state.speedLimit} KM/H`;
  }
}

function updateDiagnosticsTab(decision) {
  const speedMs = (state.speed * 1000) / 3600;
  const ke = Math.round((0.5 * 1450 * Math.pow(speedMs, 2)) / 1000); // kJ
  const keElem = document.getElementById('diag-ke');
  if (keElem) keElem.innerHTML = `${ke} <span class="tp-unit">kJ</span>`;

  const gElem = document.getElementById('diag-g');
  if (gElem) {
    const gVal = state.suddenBraking ? -0.75 : (state.suddenAccel ? 0.45 : -0.05);
    gElem.innerHTML = `${gVal >= 0 ? '+' : ''}${gVal.toFixed(2)} <span class="tp-unit">G</span>`;
  }

  const reactionElem = document.getElementById('diag-reaction');
  if (reactionElem) {
    reactionElem.innerHTML = `${state.attentionLevel === 'distracted' ? '2.1' : '1.2'} <span class="tp-unit">sec</span>`;
  }
}

function renderBlackboxTable() {
  const tbody = document.getElementById('blackbox-table-body');
  if (!tbody) return;

  const records = blackbox.getRecords();
  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Monitoring road dynamics... Incident records will automatically log here.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.slice(0, 15).map(r => `
    <tr>
      <td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan);">${r.id}</td>
      <td style="color:var(--text-secondary); font-size:11px;">${r.timeFormatted}</td>
      <td><strong>${r.speed}</strong> <small style="color:var(--text-muted)">(${r.speedLimit})</small></td>
      <td><span class="risk-tag ${r.riskLevel.toLowerCase()}">${r.riskLevel}</span></td>
      <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis;">${r.biggestThreat}</td>
      <td style="color:#f1f5f9;">${r.immediateAction}</td>
      <td style="font-family:var(--font-mono);">${r.latG.toFixed(2)}G</td>
      <td style="color:var(--text-secondary); font-size:11px;">${r.location}</td>
    </tr>
  `).join('');
}

function applyScenario(scenarioKey) {
  const sc = scenarios[scenarioKey];
  if (!sc) return;

  Object.assign(state, sc);

  // Sync inputs
  dom.sliderSpeed.value = state.speed;
  dom.ctrlValSpeed.textContent = state.speed;
  dom.sliderSpeedLimit.value = state.speedLimit;
  dom.ctrlValLimit.textContent = state.speedLimit;
  dom.sliderDistance.value = state.distance;
  dom.ctrlValDistance.textContent = state.distance;
  dom.selectWeather.value = state.weather;
  dom.selectObstacle.value = state.obstacles[0] || 'none';

  // Sync chips
  document.querySelectorAll('.toggle-chip-group button').forEach(b => b.classList.remove('active'));
  document.getElementById(`chip-eye-${state.eyeState}`)?.classList.add('active');
  document.getElementById(state.phoneUsage ? 'chip-phone-yes' : 'chip-phone-no')?.classList.add('active');
  document.getElementById('chip-sudden-accel')?.classList.toggle('active', state.suddenAccel);
  document.getElementById('chip-sudden-brake')?.classList.toggle('active', state.suddenBraking);
}

function handleVoiceCommand(cmd) {
  const lower = cmd.toLowerCase().trim();

  // 1. Speed Query
  if (lower.includes('speed') || lower.includes('fast')) {
    const text = `Current vehicle speed is ${Math.round(state.speed)} kilometers per hour. Road speed limit is ${state.speedLimit} km/h.`;
    voiceAssistant.speakAlert(text, 'LOW');
  } 
  // 2. Navigation Commands
  else if (lower.includes('navigate') || lower.includes('directions') || lower.includes('drive to') || lower.includes('route to')) {
    let destName = 'TIDEL Park';
    let lat = 12.9892;
    let lng = 80.2475;

    if (lower.includes('ascendas') || lower.includes('pinnacle')) {
      destName = 'Ascendas IT Park';
      lat = 12.9750;
      lng = 80.2485;
    } else if (lower.includes('iit') || lower.includes('madras')) {
      destName = 'IIT Madras Campus';
      lat = 12.98289;
      lng = 80.23586;
    } else if (lower.includes('velachery') || lower.includes('phoenix')) {
      destName = 'Velachery Phoenix Marketcity';
      lat = 12.9925;
      lng = 80.2170;
    } else if (lower.includes('mumbai') || lower.includes('marine')) {
      destName = 'Marine Drive, Mumbai';
      lat = 18.9438;
      lng = 72.8232;
    }

    if (window.startNavigationTo) {
      window.startNavigationTo(lat, lng, destName);
    }
  }
  // 3. Stop Navigation
  else if (lower.includes('stop nav') || lower.includes('cancel route') || lower.includes('end nav')) {
    if (window.stopNavigation) window.stopNavigation();
  }
  // 4. Driver Habits & Insurance Discount
  else if (lower.includes('score') || lower.includes('habit') || lower.includes('insurance') || lower.includes('discount')) {
    const prof = habitEngine.getProfile();
    const text = `Safety score is ${prof.safetyScore} points out of 100. Driver persona: ${prof.persona}. You qualify for ${prof.insuranceTier} with ${prof.insuranceDiscount}% insurance discount.`;
    voiceAssistant.speakAlert(text, 'LOW');
  }
  // 5. Camera & Lane Departure
  else if (lower.includes('camera') || lower.includes('dashcam') || lower.includes('lane')) {
    const offset = cameraHud ? cameraHud.lateralOffsetCm : 0;
    const text = `AI lane tracking active. Lateral offset is ${Math.abs(offset)} centimeters ${offset >= 0 ? 'right' : 'left'} of lane center.`;
    voiceAssistant.speakAlert(text, 'LOW');
  }
  // 6. Language Switch
  else if (lower.includes('hinglish') || lower.includes('hindi') || lower.includes('english') || lower.includes('language')) {
    const newMode = (lower.includes('english')) ? 'en' : 'hinglish';
    voiceAssistant.setLanguageMode(newMode);
    if (dom.langBtnText) {
      dom.langBtnText.textContent = newMode === 'hinglish' ? 'Hinglish 🇮🇳' : 'English 🇬🇧';
    }
    voiceAssistant.speakAlert(
      newMode === 'hinglish' ? 'Hinglish copilot active. Suraksha monitoring shuru.' : 'English safety copilot active.',
      'LOW'
    );
  }
  // 7. Hazard Reporting
  else if (lower.includes('pothole') || lower.includes('cow') || lower.includes('hazard') || lower.includes('accident')) {
    const text = `Hazard acknowledged and pinned to Indian road safety radar. Caution advised.`;
    voiceAssistant.speakAlert(text, 'MEDIUM');
    if (gpsMap) {
      gpsMap.pinUserReportedHazard('Pothole / Road Obstacle Reported via Voice');
    }
  }
  // 8. Emergency
  else if (lower.includes('emergency') || lower.includes('112') || lower.includes('sos') || lower.includes('help')) {
    const text = `Emergency protocol initiated. Transmitting GNSS coordinates to Indian Emergency 112 hotline.`;
    voiceAssistant.speakAlert(text, 'CRITICAL');
  }
  // 9. Mute
  else if (lower.includes('mute') || lower.includes('quiet')) {
    voiceEnabled = false;
    voiceAssistant.setMuted(true);
    dom.btnToggleVoice.classList.remove('active');
    dom.btnToggleVoice.querySelector('.btn-text').textContent = 'Voice: OFF';
  }
  // 10. Status / General
  else if (lower.includes('status') || lower.includes('report')) {
    const text = `Current risk level is ${lastDecision?.finalRiskLevel}. Speed is ${Math.round(state.speed)} kilometers per hour. All safety shields armed.`;
    voiceAssistant.speakAlert(text, 'LOW');
  } 
  else {
    voiceAssistant.speakAlert(`Command recognized: ${cmd}. Safety systems monitoring road conditions.`, 'LOW');
  }
}

// Boot
window.addEventListener('DOMContentLoaded', init);
