/**
 * Collision Prediction Engine (Forward Collision Warning / AEB)
 * Calculates Time to Collision (TTC) based on distance, closing speed, and braking state.
 */
export function evaluateCollisionRisk(input) {
  const {
    distance = 50, // meters to lead vehicle or obstacle
    relativeSpeed = 0, // km/h (positive means closing in faster)
    obstacleDetected = false, // boolean or 'yes'/'no'
    brakingResponse = 'normal', // 'normal' | 'delayed' | 'none'
    ownSpeed = 60, // km/h
  } = input;

  const hasObstacle = obstacleDetected === true || obstacleDetected === 'yes';
  const effectiveDistance = Math.max(0.5, Number(distance));
  
  // Convert closing speed from km/h to m/s.
  // If relativeSpeed is 0 or negative (moving away), closing speed depends on own speed if approaching stationary obstacle
  let closingSpeedKmh = Number(relativeSpeed);
  if (hasObstacle && closingSpeedKmh <= 0) {
    closingSpeedKmh = ownSpeed; // obstacle is stationary
  }

  const closingSpeedMs = Math.max(0.1, (closingSpeedKmh * 1000) / 3600);

  // Time To Collision (TTC) in seconds
  let ttc = effectiveDistance / closingSpeedMs;
  if (closingSpeedKmh <= 0 && !hasObstacle) {
    ttc = 99.9; // safe, lead vehicle is pulling away
  }

  // Adjusted TTC factor if driver's braking response is delayed
  const delayedPenalty = brakingResponse === 'delayed' ? 0.6 : (brakingResponse === 'none' ? 0.4 : 1.0);
  const adjustedTtc = Math.max(0.1, ttc * delayedPenalty);

  let collisionRisk = 'LOW';
  let immediateAction = 'Maintain safe following distance.';

  if (effectiveDistance <= 8 || adjustedTtc <= 1.2) {
    collisionRisk = 'IMMINENT';
    immediateAction = 'HARD EMERGENCY BRAKE NOW!';
  } else if (effectiveDistance <= 18 || adjustedTtc <= 2.5) {
    collisionRisk = 'HIGH';
    immediateAction = 'Brake hard and prepare to steer clear!';
  } else if (effectiveDistance <= 35 || adjustedTtc <= 4.5) {
    collisionRisk = 'MEDIUM';
    immediateAction = 'Slow down and increase following distance.';
  } else {
    collisionRisk = 'LOW';
    immediateAction = 'Safe buffer. Cruise normally.';
  }

  return {
    collisionRisk,
    timeToImpact: Number(adjustedTtc.toFixed(1)),
    distance: Math.round(effectiveDistance),
    relativeSpeed: Math.round(closingSpeedKmh),
    immediateAction,
    obstacleDetected: hasObstacle,
  };
}
