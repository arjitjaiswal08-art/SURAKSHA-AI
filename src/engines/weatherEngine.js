/**
 * Weather-Based Driving Advisory Engine
 * Assesses road friction, visibility degradation (smog, monsoon rain, night),
 * and calculates recommended maximum safe speeds.
 */
export function evaluateWeatherAdvisory(input) {
  const {
    weather = 'clear', // 'clear' | 'rain' | 'fog' | 'night' | 'monsoon_storm'
    visibility = 'high', // 'low' | 'medium' | 'high'
    roadCondition = 'dry', // 'dry' | 'wet' | 'slippery' | 'waterlogged'
    currentSpeedLimit = 80,
  } = input;

  let riskLevel = 'LOW';
  let advice = 'Standard driving conditions. Stay alert.';
  let speedPenaltyPercent = 0;
  const issues = [];

  // Weather checks
  if (weather === 'monsoon_storm' || (weather === 'rain' && roadCondition === 'waterlogged')) {
    riskLevel = 'HIGH';
    advice = 'Extreme hydroplaning risk! Turn on wipers & hazards if visibility drops.';
    speedPenaltyPercent = 40;
    issues.push('Heavy downpour with localized waterlogging');
  } else if (weather === 'fog' || visibility === 'low') {
    riskLevel = 'HIGH';
    advice = 'Dense fog / winter smog! Turn on low-beam fog lights, refrain from high beams.';
    speedPenaltyPercent = 35;
    issues.push('Severely restricted sightline (< 50m)');
  } else if (weather === 'rain' || roadCondition === 'wet' || roadCondition === 'slippery') {
    riskLevel = 'MEDIUM';
    advice = 'Wet asphalt: double your braking distance and avoid sudden steering.';
    speedPenaltyPercent = 25;
    issues.push('Reduced tyre grip on wet bitumen');
  } else if (weather === 'night') {
    if (visibility === 'low') {
      riskLevel = 'HIGH';
      advice = 'Pitch-dark unlit corridor. Watch for unlit vehicles, pedestrians & cattle.';
      speedPenaltyPercent = 30;
    } else {
      riskLevel = 'MEDIUM';
      advice = 'Night driving: beware of high-beam glare and unlit obstacles.';
      speedPenaltyPercent = 15;
    }
    issues.push('Impaired night peripheral visibility');
  }

  // Recommended speed
  const recommendedSpeed = Math.max(30, Math.round(currentSpeedLimit * (1 - speedPenaltyPercent / 100)));

  return {
    riskLevel,
    drivingAdvice: advice,
    speedRecommendation: `${recommendedSpeed} km/h (Cap below ${currentSpeedLimit} km/h)`,
    recommendedSpeedValue: recommendedSpeed,
    issues: issues.length > 0 ? issues : ['Optimal weather'],
    environment: {
      weather,
      visibility,
      roadCondition,
    },
  };
}
