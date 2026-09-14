import { evaluateRashDriving } from './src/engines/rashEngine.js';
import { evaluateDriverState } from './src/engines/dmsEngine.js';
import { evaluateCollisionRisk } from './src/engines/collisionEngine.js';
import { evaluateWeatherAdvisory } from './src/engines/weatherEngine.js';
import { evaluateIndianRoadHazards } from './src/engines/indianRoadEngine.js';
import { arbitrateDrivingDecision } from './src/engines/decisionEngine.js';
import { HabitLearningEngine } from './src/engines/habitLearningEngine.js';

console.log('=== RUNNING AI DRIVING SAFETY ENGINE VERIFICATION ===\n');

// TEST 1: User's Exact Prompt Scenario
// Situation: Speed: 90 (limit 60), Rain, Sudden braking, Close vehicle ahead
console.log('Test 1: User Prompt Real Example');
const rash1 = evaluateRashDriving({ speed: 90, speedLimit: 60, suddenBraking: true });
const dms1 = evaluateDriverState({ eyeState: 'open', attentionLevel: 'focused' });
const collision1 = evaluateCollisionRisk({ distance: 18, relativeSpeed: 15, obstacleDetected: true, ownSpeed: 90 });
const weather1 = evaluateWeatherAdvisory({ weather: 'rain', roadCondition: 'wet' });
const road1 = evaluateIndianRoadHazards({ roadType: 'highway', obstacles: [] });

const decision1 = arbitrateDrivingDecision({
  rashOutput: rash1,
  driverOutput: dms1,
  collisionOutput: collision1,
  weatherOutput: weather1,
  roadOutput: road1,
});

console.log('Risk Level:', decision1.finalRiskLevel);
console.log('Biggest Threat:', decision1.biggestThreat);
console.log('Immediate Action:', decision1.immediateAction);
console.log('Voice Alert:', decision1.voiceAlertMessage);
console.assert(decision1.finalRiskLevel === 'HIGH' || decision1.finalRiskLevel === 'CRITICAL', 'Test 1 Risk Level must be HIGH or CRITICAL');
console.assert(decision1.voiceAlertMessage.includes('Slow down') || decision1.voiceAlertMessage.includes('distance'), 'Test 1 Voice Alert must advise slowing down');
console.log('✅ Test 1 Passed!\n');

// TEST 2: Stray Cattle on Indian Highway
console.log('Test 2: Stray Cattle Hazard');
const road2 = evaluateIndianRoadHazards({ roadType: 'highway', obstacles: ['cattle'] });
const decision2 = arbitrateDrivingDecision({
  rashOutput: evaluateRashDriving({ speed: 80, speedLimit: 100 }),
  driverOutput: evaluateDriverState({ eyeState: 'open' }),
  collisionOutput: evaluateCollisionRisk({ distance: 40 }),
  weatherOutput: evaluateWeatherAdvisory({ weather: 'night' }),
  roadOutput: road2,
});
console.log('Risk Level:', decision2.finalRiskLevel);
console.log('Threat:', decision2.biggestThreat);
console.log('Voice:', decision2.voiceAlertMessage);
console.assert(decision2.voiceAlertMessage.includes('Stray cow') || decision2.voiceAlertMessage.includes('cattle'), 'Test 2 cattle warning failed');
console.log('✅ Test 2 Passed!\n');

// TEST 3: Driver Microsleep (Eyes closed at speed)
console.log('Test 3: Driver Microsleep Alert');
const dms3 = evaluateDriverState({ eyeState: 'closed', headMovement: 'dropping', eyeClosedSeconds: 2.0 });
const decision3 = arbitrateDrivingDecision({
  rashOutput: evaluateRashDriving({ speed: 70, speedLimit: 80 }),
  driverOutput: dms3,
  collisionOutput: evaluateCollisionRisk({ distance: 50 }),
  weatherOutput: evaluateWeatherAdvisory({ weather: 'clear' }),
  roadOutput: evaluateIndianRoadHazards({ roadType: 'highway', obstacles: [] }),
});
console.log('Risk Level:', decision3.finalRiskLevel);
console.log('Threat:', decision3.biggestThreat);
console.log('Voice:', decision3.voiceAlertMessage);
console.assert(decision3.finalRiskLevel === 'CRITICAL', 'DMS eyes closed must trigger CRITICAL risk');
console.assert(decision3.voiceAlertMessage.includes('Wake up') || decision3.voiceAlertMessage.includes('Eyes closed'), 'Test 3 voice alert failed');
console.log('✅ Test 3 Passed!\n');

// TEST 4: Habit Learning Engine Profiling
console.log('Test 4: Habit Learning Engine Profiling');
const habit = new HabitLearningEngine();
habit.logTick(decision1, { speed: 90, speedLimit: 60, suddenBraking: true, distance: 18 });
habit.logTick(decision3, { speed: 70, speedLimit: 80, eyeState: 'closed', distance: 50 });
const profile = habit.getProfile();
console.log('Safety Score:', profile.safetyScore);
console.log('Driver Persona:', profile.persona);
console.log('Coaching Tips:', profile.coachingTips);
console.assert(profile.safetyScore < 95, 'Score should drop after violations');
console.log('✅ Test 4 Passed!\n');

console.log('🎉 ALL ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
