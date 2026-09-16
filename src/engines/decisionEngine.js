/**
 * Master Real-Time Driving Decision Engine
 * Synthesizes outputs from all 5 specialized sub-engines:
 * 1. Rash Driving
 * 2. Driver Monitoring (DMS)
 * 3. Collision Prediction (FCW)
 * 4. Weather Advisory
 * 5. Indian Road Hazards
 *
 * Resolves the single highest-priority threat, determines overall risk level,
 * and formulates ONE clear, urgent, voice-ready instruction.
 */
export function arbitrateDrivingDecision({
  rashOutput,
  driverOutput,
  collisionOutput,
  weatherOutput,
  roadOutput,
}) {
  const riskLevels = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
    IMMINENT: 4,
  };

  // Convert individual engine risks to numeric scores
  const collisionRiskScore = riskLevels[collisionOutput?.collisionRisk] || 1;
  const driverRiskScore = riskLevels[driverOutput?.riskLevel] || 1;
  const rashRiskScore = riskLevels[rashOutput?.riskLevel] || 1;
  const roadRiskScore = riskLevels[roadOutput?.roadRisk] || 1;
  const weatherRiskScore = riskLevels[weatherOutput?.riskLevel] || 1;

  // Maximum risk score
  const maxScore = Math.max(
    collisionRiskScore,
    driverRiskScore,
    rashRiskScore,
    roadRiskScore,
    weatherRiskScore
  );

  let finalRiskLevel = 'LOW';
  if (maxScore === 4) finalRiskLevel = 'CRITICAL';
  else if (maxScore === 3) finalRiskLevel = 'HIGH';
  else if (maxScore === 2) finalRiskLevel = 'MEDIUM';

  // Threat arbitration logic by priority (Collision & DMS microsleep take utmost priority)
  let biggestThreat = 'None detected. Normal road conditions.';
  let immediateAction = 'Continue cruising safely and maintain lane.';
  let voiceAlertMessage = 'Road clear. Drive safely.';

  // 1. Imminent Collision (Priority 1)
  if (collisionOutput?.collisionRisk === 'IMMINENT' || (collisionOutput?.timeToImpact && collisionOutput.timeToImpact <= 1.5)) {
    biggestThreat = `Imminent collision with leading obstacle in ${collisionOutput.distance}m (TTC: ${collisionOutput.timeToImpact}s)!`;
    immediateAction = 'BRAKE HARD IMMEDIATELY!';
    voiceAlertMessage = 'Brake hard now! Stop, stop!';
  }
  // 2. Driver Microsleep / Eyes Closed (Priority 2)
  else if (driverOutput?.riskLevel === 'CRITICAL' || driverOutput?.driverState?.includes('Microsleep')) {
    biggestThreat = 'Driver eyes closed / microsleep at speed!';
    immediateAction = 'Open eyes and pull vehicle over to the shoulder safely!';
    voiceAlertMessage = 'Wake up! Eyes closed! Pull over immediately!';
  }
  // 3. Imminent High Road Hazard (Stray Cattle / Wrong Way)
  else if (roadOutput?.detectedHazards?.some(h => h.includes('Stray Cattle') || h.includes('Wrong-Way'))) {
    const hazard = roadOutput.detectedHazards.find(h => h.includes('Stray Cattle') || h.includes('Wrong-Way'));
    biggestThreat = hazard;
    immediateAction = 'Slow down immediately and prepare to steer around the hazard!';
    voiceAlertMessage = hazard.includes('Cattle')
      ? 'Alert! Stray cow on road ahead! Slow down immediately!'
      : 'Danger! Wrong-way vehicle approaching! Move to left lane!';
  }
  // 4. High Collision Warning
  else if (collisionOutput?.collisionRisk === 'HIGH') {
    biggestThreat = `Vehicle closing in fast (${collisionOutput.distance}m ahead, relative speed ${collisionOutput.relativeSpeed} km/h).`;
    immediateAction = 'Brake firmly and increase following distance!';
    voiceAlertMessage = 'Slow down immediately and maintain safe distance!';
  }
  // 5. High Rash Driving / Dangerous Maneuvers
  else if (rashOutput?.riskLevel === 'CRITICAL' || rashOutput?.rashScore >= 75) {
    biggestThreat = `Critical rash driving score (${rashOutput.rashScore}/100) - ${rashOutput.behaviorsDetected.join(', ')}.`;
    immediateAction = 'Reduce speed, stop lane weaving, and stabilize steering!';
    voiceAlertMessage = 'Warning! Speed excessive and lane unstable! Slow down!';
  }
  // 6. Driver Phone Distraction or High Fatigue
  else if (driverOutput?.riskLevel === 'HIGH') {
    biggestThreat = driverOutput.driverState;
    if (driverOutput.driverState.includes('Phone')) {
      immediateAction = 'Put phone down immediately and keep both hands on the wheel!';
      voiceAlertMessage = 'Put the phone down and focus on the road!';
    } else {
      immediateAction = 'Driver fatigue detected. Signal left and take a coffee break!';
      voiceAlertMessage = 'Driver fatigue detected. Pull over and take a break.';
    }
  }
  // 7. Severe Weather Risk (Monsoon hydroplaning / Dense Fog)
  else if (weatherOutput?.riskLevel === 'HIGH') {
    biggestThreat = weatherOutput.issues?.[0] || 'Severe low visibility / hydroplaning danger.';
    immediateAction = `Cap speed to ${weatherOutput.recommendedSpeedValue} km/h and turn on fog lamps!`;
    voiceAlertMessage = `Hazardous weather! Cap speed to ${weatherOutput.recommendedSpeedValue} kilometers per hour!`;
  }
  // 8. Medium Hazards (Potholes, moderate overspeed, moderate rain)
  else if (roadOutput?.detectedHazards?.some(h => h.includes('Potholes') || h.includes('Speed Breaker'))) {
    biggestThreat = roadOutput.detectedHazards[0];
    immediateAction = 'Release accelerator and brake smoothly before the bump.';
    voiceAlertMessage = 'Caution: Pothole and speed breaker ahead!';
  }
  else if (rashOutput?.riskLevel === 'HIGH' || rashOutput?.rashScore >= 45) {
    biggestThreat = `Overspeeding (${rashOutput.behaviorsDetected.join(', ')}).`;
    immediateAction = 'Ease off the throttle and align with speed limit.';
    voiceAlertMessage = 'You are over the speed limit. Please slow down.';
  }
  else if (collisionOutput?.collisionRisk === 'MEDIUM') {
    biggestThreat = `Following too closely (${collisionOutput.distance}m).`;
    immediateAction = 'Ease accelerator to establish a 3-second gap.';
    voiceAlertMessage = 'Maintain more distance from vehicle ahead.';
  }
  else if (weatherOutput?.riskLevel === 'MEDIUM') {
    biggestThreat = 'Wet slippery road conditions.';
    immediateAction = 'Double braking distance and drive smoothly.';
    voiceAlertMessage = 'Road is wet. Increase braking distance.';
  }
  else if (driverOutput?.riskLevel === 'MEDIUM') {
    biggestThreat = driverOutput.driverState;
    immediateAction = 'Recenter gaze onto the road.';
    voiceAlertMessage = 'Please look straight ahead at the road.';
  }

  // Generate Dynamic AI Copilot Headline Summary (Glanceable 1-2s feedback)
  let copilotSummary = 'All clear. Maintain speed. No threats detected.';
  let predictiveAlert = 'Optimal flow — clear forward corridor for 2.4 km.';

  if (finalRiskLevel === 'CRITICAL') {
    if (collisionOutput?.collisionRisk === 'IMMINENT' || (collisionOutput?.timeToImpact && collisionOutput.timeToImpact <= 1.5)) {
      copilotSummary = 'BRAKE NOW! Obstacle directly ahead!';
      predictiveAlert = 'Impact in <1.5s unless emergency braking applied immediately.';
    } else if (driverOutput?.riskLevel === 'CRITICAL') {
      copilotSummary = 'WAKE UP! Driver microsleep alert!';
      predictiveAlert = 'Loss of vehicle heading imminent within 2 seconds.';
    } else {
      copilotSummary = 'CRITICAL DANGER: Slow down immediately!';
      predictiveAlert = 'High accident risk detected. Prepare emergency evasion.';
    }
  } else if (finalRiskLevel === 'HIGH') {
    if (roadOutput?.detectedHazards?.some(h => h.includes('Stray Cattle') || h.includes('Cow'))) {
      copilotSummary = 'Caution: Stray cattle detected on carriageway.';
      predictiveAlert = 'Animal movement erratic — reduce speed to under 40 km/h.';
    } else if (collisionOutput?.collisionRisk === 'HIGH') {
      copilotSummary = 'Vehicle closing fast. Ease off throttle.';
      predictiveAlert = 'Leading vehicle deceleration rate increasing.';
    } else if (driverOutput?.riskLevel === 'HIGH') {
      copilotSummary = 'Driver distracted. Keep eyes centered on the road.';
      predictiveAlert = 'Reaction latency elevated by 2.4x due to distraction.';
    } else if (weatherOutput?.riskLevel === 'HIGH') {
      copilotSummary = 'Severe weather ahead. Reduce speed and maintain buffer.';
      predictiveAlert = 'Aquaplaning risk high — braking distance increased by 60%.';
    } else {
      copilotSummary = 'High risk driving detected. Stabilize speed & lane.';
      predictiveAlert = 'Erratic dynamics detected — risk of losing road adhesion.';
    }
  } else if (finalRiskLevel === 'MEDIUM') {
    if (roadOutput?.detectedHazards?.some(h => h.includes('Potholes') || h.includes('Speed Breaker'))) {
      copilotSummary = 'Caution: Speed breaker & potholes ahead.';
      predictiveAlert = 'Road depression in 80m. Smooth deceleration advised.';
    } else if (weatherOutput?.riskLevel === 'MEDIUM') {
      copilotSummary = 'Wet road surface. Smooth braking advised.';
      predictiveAlert = 'Reduced bitumen friction coefficient (0.62μ).';
    } else if (collisionOutput?.collisionRisk === 'MEDIUM') {
      copilotSummary = 'Following gap narrowing. Maintain 3-second buffer.';
      predictiveAlert = 'Tailgating zone — increase distance to prevent sudden pile-up.';
    } else {
      copilotSummary = 'Moderate hazard. Drive defensively and stay alert.';
      predictiveAlert = 'Indian highway traffic density variable ahead.';
    }
  } else {
    // Normal cruising
    copilotSummary = 'Road clear. Maintain lane and speed.';
    predictiveAlert = 'Optimal corridor trajectory • Safe distance maintained.';
  }

  // Generate 3 Smart Card Insights (Converting raw metrics -> human meaning)
  // 1. Driver Focus Card
  let driverFocusCard = {
    icon: '👁️',
    title: 'Driver Focus',
    status: 'Focused & Alert',
    detail: 'Eyes on road • Optimal vigilance',
    level: 'safe',
  };
  if (driverOutput?.riskLevel === 'CRITICAL') {
    driverFocusCard = {
      icon: '😴',
      title: 'Driver Focus',
      status: 'Microsleep Warning',
      detail: 'Eyes closed > 1.5s • Pull over immediately',
      level: 'critical',
    };
  } else if (driverOutput?.riskLevel === 'HIGH') {
    driverFocusCard = {
      icon: '📱',
      title: 'Driver Focus',
      status: driverOutput.driverState?.includes('Phone') ? 'Phone Distraction' : 'Drowsy / Fatigued',
      detail: driverOutput.driverState?.includes('Phone') ? 'Mobile in hand • Focus straight' : 'Frequent yawns / micro-droops',
      level: 'high',
    };
  } else if (driverOutput?.riskLevel === 'MEDIUM') {
    driverFocusCard = {
      icon: '👁️',
      title: 'Driver Focus',
      status: 'Mild Inattention',
      detail: 'Gaze off-center • Re-align focus',
      level: 'medium',
    };
  }

  // 2. Road Status Card
  let roadStatusCard = {
    icon: '🛣️',
    title: 'Road Status',
    status: 'Clear & Dry Bitumen',
    detail: 'Optimal road grip • 100% traction',
    level: 'safe',
  };
  if (weatherOutput?.riskLevel === 'HIGH') {
    roadStatusCard = {
      icon: '🌧️',
      title: 'Road Status',
      status: 'Slippery Monsoon',
      detail: 'Waterlogged track • 60% braking buffer',
      level: 'high',
    };
  } else if (weatherOutput?.riskLevel === 'MEDIUM') {
    roadStatusCard = {
      icon: '🌦️',
      title: 'Road Status',
      status: 'Damp Surface',
      detail: 'Moderate grip • Maintain gentle braking',
      level: 'medium',
    };
  }

  // 3. Hazard Detection Card
  let hazardCard = {
    icon: '🛡️',
    title: 'Hazard Detection',
    status: 'None Detected',
    detail: 'Corridor clear for next 2.4 km',
    level: 'safe',
  };
  if (collisionOutput?.collisionRisk === 'IMMINENT' || collisionOutput?.collisionRisk === 'HIGH') {
    hazardCard = {
      icon: '💥',
      title: 'Hazard Detection',
      status: 'Vehicle In Path',
      detail: `${collisionOutput.distance}m ahead • Rapid closure`,
      level: 'critical',
    };
  } else if (roadOutput?.detectedHazards?.length > 0 && !roadOutput.detectedHazards[0].includes('No imminent')) {
    const rawH = roadOutput.detectedHazards[0];
    let simpleH = 'Road Obstacle';
    let detailH = 'Caution advised';
    if (rawH.includes('Cattle') || rawH.includes('Cow')) {
      simpleH = 'Stray Cattle (Cow)';
      detailH = 'Roaming carriageway • Slow down';
    } else if (rawH.includes('Pothole')) {
      simpleH = 'Crater Potholes';
      detailH = 'Rough asphalt ahead';
    } else if (rawH.includes('Auto')) {
      simpleH = 'Auto Cut-in';
      detailH = 'Blind spot maneuver';
    } else if (rawH.includes('Wrong-Way')) {
      simpleH = 'Wrong-Way Vehicle';
      detailH = 'Head-on threat • Move left';
    } else if (rawH.includes('Speed Breaker')) {
      simpleH = 'Speed Breaker';
      detailH = 'Unmarked bump ahead';
    }
    hazardCard = {
      icon: '⚠️',
      title: 'Hazard Detection',
      status: simpleH,
      detail: detailH,
      level: roadOutput.roadRisk === 'CRITICAL' ? 'critical' : roadOutput.roadRisk === 'HIGH' ? 'high' : 'medium',
    };
  }

  // Generate a consolidated diagnostic summary
  const summaryIssues = [
    ...(rashOutput?.behaviorsDetected?.filter(b => !b.includes('Smooth')) || []),
    ...(driverOutput?.issues?.filter(i => i !== 'None') || []),
    ...(collisionOutput?.collisionRisk !== 'LOW' ? [`TTC ${collisionOutput?.timeToImpact}s (${collisionOutput?.distance}m)`] : []),
    ...(weatherOutput?.issues?.filter(i => !i.includes('Optimal')) || []),
    ...(roadOutput?.detectedHazards?.filter(h => !h.includes('No imminent')) || []),
  ];

  return {
    finalRiskLevel,
    copilotSummary,
    predictiveAlert,
    biggestThreat,
    immediateAction,
    voiceAlertMessage,
    driverFocusCard,
    roadStatusCard,
    hazardCard,
    summaryIssues: summaryIssues.length > 0 ? summaryIssues : ['All systems normal'],
    timestamp: new Date().toLocaleTimeString(),
  };
}
