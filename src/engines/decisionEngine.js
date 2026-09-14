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
    biggestThreat,
    immediateAction,
    voiceAlertMessage,
    summaryIssues: summaryIssues.length > 0 ? summaryIssues : ['All systems normal'],
    timestamp: new Date().toLocaleTimeString(),
  };
}
