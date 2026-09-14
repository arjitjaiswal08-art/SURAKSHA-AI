/**
 * Driver Monitoring System (DMS) Engine
 * Evaluates drowsiness (eye closure / microsleeps), head drop (fatigue),
 * phone usage, and general attentiveness.
 */
export function evaluateDriverState(input) {
  const {
    eyeState = 'open', // 'open' | 'blink' | 'droopy' | 'closed'
    headMovement = 'stable', // 'stable' | 'nodding' | 'dropping' | 'turned_away'
    phoneUsage = false, // boolean or 'yes'/'no'
    attentionLevel = 'focused', // 'focused' | 'inattentive' | 'distracted'
    eyeClosedSeconds = 0, // continuous duration of eye closure in seconds
  } = input;

  const isPhone = phoneUsage === true || phoneUsage === 'yes';
  const isEyeClosed = eyeState === 'closed' || eyeClosedSeconds >= 1.5;
  const isEyeDroopy = eyeState === 'droopy' || eyeClosedSeconds >= 0.8;
  const isHeadDropping = headMovement === 'dropping' || headMovement === 'nodding';
  const isHeadTurned = headMovement === 'turned_away';

  let driverState = 'Alert & Focused';
  let riskLevel = 'LOW';
  let alert = 'Driver attention optimal.';
  const issues = [];

  // Drowsiness evaluation (Critical priority)
  if (isEyeClosed || (isEyeDroopy && isHeadDropping)) {
    driverState = 'Severe Microsleep / Drowsy';
    riskLevel = 'CRITICAL';
    alert = 'Emergency: Eyes closed! Wake up and pull over!';
    issues.push('Microsleep / Prolonged eye closure');
  } else if (isEyeDroopy || isHeadDropping) {
    driverState = 'Fatigued / Drowsy';
    riskLevel = 'HIGH';
    alert = 'Fatigue detected: Take a break at the next stop!';
    issues.push('Drowsy blinking / Head drooping');
  }
  // Phone distraction evaluation
  else if (isPhone) {
    driverState = 'Distracted (Phone in Use)';
    riskLevel = 'HIGH';
    alert = 'Put your phone away! Focus on the road!';
    issues.push('Mobile phone usage while driving');
  }
  // Head turned or inattentive
  else if (isHeadTurned || attentionLevel === 'distracted') {
    driverState = 'Distracted (Gaze Diverted)';
    riskLevel = 'MEDIUM';
    alert = 'Eyes off the road! Look straight ahead!';
    issues.push('Looking away from road trajectory');
  } else if (attentionLevel === 'inattentive') {
    driverState = 'Mild Inattention';
    riskLevel = 'MEDIUM';
    alert = 'Stay attentive to Indian road conditions!';
    issues.push('Lax attention pattern');
  }

  return {
    driverState,
    riskLevel,
    alert,
    issues: issues.length > 0 ? issues : ['None'],
    metrics: {
      eyeState,
      headMovement,
      phoneUsage: isPhone,
      attentionLevel,
      eyeClosedSeconds,
    },
  };
}
