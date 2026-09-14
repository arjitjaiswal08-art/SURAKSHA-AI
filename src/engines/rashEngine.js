/**
 * Rash Driving Evaluation Engine
 * Evaluates overspeeding, harsh acceleration, sudden braking, weaving & sharp turns.
 */
export function evaluateRashDriving(input) {
  const {
    speed = 0,
    speedLimit = 60,
    suddenAccel = false,
    suddenBraking = false,
    laneChanges = 'stable', // 'stable' | 'frequent' | 'aggressive'
    turningPattern = 'smooth', // 'smooth' | 'sharp' | 'erratic'
  } = input;

  let score = 0;
  const behaviors = [];

  // 1. Overspeed calculation
  const speedDiff = speed - speedLimit;
  if (speedDiff > 35) {
    score += 45;
    behaviors.push('Extreme Overspeeding (+' + Math.round(speedDiff) + ' km/h)');
  } else if (speedDiff > 20) {
    score += 30;
    behaviors.push('High Overspeeding (+' + Math.round(speedDiff) + ' km/h)');
  } else if (speedDiff > 5) {
    score += 15;
    behaviors.push('Overspeeding (+' + Math.round(speedDiff) + ' km/h)');
  } else if (speedDiff < -30 && speed > 0 && speedLimit > 50) {
    score += 10;
    behaviors.push('Hazardously Slow Driving');
  }

  // 2. Sudden acceleration
  if (suddenAccel) {
    score += 20;
    behaviors.push('Aggressive Sudden Acceleration');
  }

  // 3. Sudden braking
  if (suddenBraking) {
    score += 25;
    behaviors.push('Harsh Emergency Braking');
  }

  // 4. Lane change behavior
  if (laneChanges === 'frequent' || laneChanges === 'aggressive') {
    score += laneChanges === 'aggressive' ? 30 : 20;
    behaviors.push('Zig-Zag Lane Weaving');
  }

  // 5. Turning pattern
  if (turningPattern === 'sharp' || turningPattern === 'erratic') {
    score += turningPattern === 'erratic' ? 25 : 15;
    behaviors.push('Sharp Dangerous Turning');
  }

  // Clamp score
  const rashScore = Math.min(100, Math.max(0, score));

  // Determine Risk Level
  let riskLevel = 'LOW';
  let warningMessage = 'Driving pattern within safe boundaries.';

  if (rashScore >= 75) {
    riskLevel = 'CRITICAL';
    warningMessage = 'Extreme rash driving! Immediate risk of loss of control!';
  } else if (rashScore >= 50) {
    riskLevel = 'HIGH';
    warningMessage = 'Aggressive maneuvers detected! Stabilize vehicle immediately.';
  } else if (rashScore >= 25) {
    riskLevel = 'MEDIUM';
    warningMessage = 'Moderate rashness. Maintain speed and steady lane discipline.';
  }

  return {
    rashScore,
    behaviorsDetected: behaviors.length > 0 ? behaviors : ['Smooth driving'],
    riskLevel,
    warningMessage,
  };
}
