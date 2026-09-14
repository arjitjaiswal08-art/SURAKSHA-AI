/**
 * Indian Road Conditions & Hazard Engine
 * Specifically handles Indian driving quirks:
 * - Stray cows / buffaloes / dogs crossing unexpectedly
 * - Potholes, open drains, unscientific road cuts
 * - Autorickshaws & two-wheelers cutting across blind spots
 * - Unmarked speed breakers (rumble strips)
 * - Wrong-way motorists ("Ulta direction chalne wale")
 * - Overloaded trucks with unlit rear reflectors
 */
export function evaluateIndianRoadHazards(input) {
  const {
    roadType = 'highway', // 'highway' | 'city' | 'village' | 'ghat'
    obstacles = [], // array or string e.g. ['cattle', 'pothole', 'autorickshaw', 'wrong_way', 'speed_breaker', 'pedestrian']
    traffic = 'medium', // 'low' | 'medium' | 'high' | 'bumper_to_bumper'
    laneDiscipline = 'poor', // 'good' | 'moderate' | 'poor'
  } = input;

  const obstacleList = Array.isArray(obstacles) ? obstacles : (obstacles ? [obstacles] : []);
  const detectedHazards = [];
  let roadRisk = 'LOW';
  let advice = 'Maintain general road vigilance and lane discipline.';

  // Check specific Indian road obstacles
  obstacleList.forEach((obs) => {
    switch (obs.toLowerCase()) {
      case 'cattle':
      case 'animals':
      case 'cow':
        detectedHazards.push('Stray Cattle on Carriageway (Unpredictable Movement)');
        break;
      case 'potholes':
      case 'pothole':
        detectedHazards.push('Severe Crater Potholes / Damaged Bitumen');
        break;
      case 'autorickshaws':
      case 'autorickshaw':
      case 'auto':
        detectedHazards.push('Erratic Autorickshaw Cut-in from Left Blindspot');
        break;
      case 'wrong_way':
      case 'wrong_way_vehicle':
        detectedHazards.push('Wrong-Way Vehicle Head-on ("Ulta Direction")');
        break;
      case 'speed_breakers':
      case 'speed_breaker':
        detectedHazards.push('Unmarked Non-Standard Speed Breaker Ahead');
        break;
      case 'pedestrians':
      case 'pedestrian':
        detectedHazards.push('Jaywalking Pedestrian Crossing Road Median');
        break;
      case 'unlit_truck':
        detectedHazards.push('Stationary / Slow Unlit Heavy Vehicle in Right Lane');
        break;
    }
  });

  // Evaluate risk level based on hazards and road type
  if (detectedHazards.some(h => h.includes('Wrong-Way') || h.includes('Stray Cattle'))) {
    roadRisk = 'HIGH';
    advice = 'Extreme caution: Slow down, do not flash brights at cattle, steer around slowly.';
  } else if (detectedHazards.some(h => h.includes('Potholes') || h.includes('Speed Breaker'))) {
    roadRisk = 'MEDIUM';
    advice = 'Brake early before the obstacle. Avoid sudden swerving into adjacent lanes.';
  } else if (roadType === 'ghat') {
    roadRisk = traffic === 'high' ? 'HIGH' : 'MEDIUM';
    advice = 'Mountain Ghat Section: Stay strictly in low gear, honk on blind hairpin bends.';
  } else if (roadType === 'village') {
    roadRisk = 'MEDIUM';
    advice = 'Rural road: Expect sudden children, tractors & unpaved shoulders. Cap speed at 40 km/h.';
  } else if (traffic === 'high' || traffic === 'bumper_to_bumper') {
    roadRisk = 'MEDIUM';
    advice = 'Heavy urban congestion: Watch for 2-wheelers lane-splitting closely.';
  }

  return {
    roadRisk,
    roadType,
    traffic,
    detectedHazards: detectedHazards.length > 0 ? detectedHazards : ['No imminent road hazards detected'],
    safeDrivingAdvice: advice,
  };
}
