/**
 * AI Driver Habit Learning & Profiling Engine
 * Continuously monitors driver habits across trips, calculates an adaptive
 * driver safety score, identifies behavioral tendencies, and provides AI coaching.
 */
export class HabitLearningEngine {
  constructor() {
    this.stats = {
      totalTicks: 0,
      safetyScore: 92,
      overspeedEvents: 0,
      harshBrakeEvents: 0,
      distractionEvents: 0,
      drowsinessEvents: 0,
      closeCallEvents: 0,
      smoothKmDriven: 14.2,
      // 6-Axis AI Behavioral Driver Biometrics (0 - 100)
      smoothness: 94,
      anticipation: 90,
      speedDiscipline: 88,
      focus: 95,
      laneDiscipline: 92,
      hazardReflex: 93,
    };

    this.incidentLog = [];
    this.driverPersona = 'Defensive Navigator 🛡️';
  }

  logTick(decision, rawState) {
    this.stats.totalTicks++;
    this.stats.smoothKmDriven += (rawState.speed / 3600);

    let tickPenalty = 0;

    // 1. Smoothness Metric (Sudden Accel / Sudden Braking)
    if (rawState.suddenBraking || rawState.suddenAccel) {
      this.stats.smoothness = Math.max(30, this.stats.smoothness - 0.4);
    } else {
      this.stats.smoothness = Math.min(99, this.stats.smoothness + 0.05);
    }

    // 2. Anticipation Metric (Following Distance & TTC)
    if (rawState.distance <= 18 && rawState.speed > 40) {
      this.stats.anticipation = Math.max(25, this.stats.anticipation - 0.6);
    } else if (rawState.distance > 35) {
      this.stats.anticipation = Math.min(98, this.stats.anticipation + 0.06);
    }

    // 3. Speed Discipline Metric
    if (rawState.speed > rawState.speedLimit + 10) {
      this.stats.speedDiscipline = Math.max(30, this.stats.speedDiscipline - 0.5);
      tickPenalty += 0.4;
      if (this.stats.totalTicks % 40 === 0) {
        this.stats.overspeedEvents++;
        this._addIncident('Overspeeding', `Exceeded limit (${rawState.speed} km/h vs ${rawState.speedLimit} limit)`);
      }
    } else {
      this.stats.speedDiscipline = Math.min(99, this.stats.speedDiscipline + 0.05);
    }

    // 4. Focus Metric (Phone Usage & Eye State)
    if (rawState.phoneUsage || rawState.eyeState === 'closed' || rawState.attentionLevel === 'distracted') {
      this.stats.focus = Math.max(20, this.stats.focus - 1.2);
      if (rawState.phoneUsage) {
        tickPenalty += 2.0;
        if (this.stats.totalTicks % 25 === 0) {
          this.stats.distractionEvents++;
          this._addIncident('Distracted Driving', 'Phone interaction while vehicle in motion');
        }
      }
      if (rawState.eyeState === 'closed' || rawState.headMovement === 'dropping') {
        tickPenalty += 2.5;
        if (this.stats.totalTicks % 20 === 0) {
          this.stats.drowsinessEvents++;
          this._addIncident('Drowsiness Alert', 'Microsleep / fatigue pattern flagged');
        }
      }
    } else {
      this.stats.focus = Math.min(100, this.stats.focus + 0.08);
    }

    // 5. Lane Discipline Metric
    if (rawState.laneChanges === 'aggressive') {
      this.stats.laneDiscipline = Math.max(25, this.stats.laneDiscipline - 0.8);
      tickPenalty += 1.0;
    } else if (rawState.laneChanges === 'frequent') {
      this.stats.laneDiscipline = Math.max(45, this.stats.laneDiscipline - 0.3);
    } else {
      this.stats.laneDiscipline = Math.min(99, this.stats.laneDiscipline + 0.05);
    }

    // 6. Harsh Braking & Proximity Events
    if (rawState.suddenBraking) {
      tickPenalty += 1.5;
      if (this.stats.totalTicks % 20 === 0) {
        this.stats.harshBrakeEvents++;
        this._addIncident('Harsh Braking', 'Emergency decelerations recorded');
      }
    }
    if (rawState.distance <= 15 && rawState.speed > 40) {
      tickPenalty += 1.2;
      if (this.stats.totalTicks % 30 === 0) {
        this.stats.closeCallEvents++;
        this._addIncident('Close Proximity', `Tailgating obstacle at ${rawState.distance}m`);
      }
    }

    // Composite Safety Score
    const compositeScore = (
      this.stats.smoothness * 0.18 +
      this.stats.anticipation * 0.22 +
      this.stats.speedDiscipline * 0.20 +
      this.stats.focus * 0.22 +
      this.stats.laneDiscipline * 0.18
    );

    this.stats.safetyScore = Math.round(compositeScore);
    this._updatePersona();
  }

  _addIncident(type, detail) {
    this.incidentLog.unshift({
      id: Date.now() + Math.random(),
      type,
      detail,
      time: new Date().toLocaleTimeString(),
    });
    if (this.incidentLog.length > 20) {
      this.incidentLog.pop();
    }
  }

  _updatePersona() {
    const score = this.stats.safetyScore;
    if (score >= 88) {
      this.driverPersona = 'Defensive Navigator 🛡️';
    } else if (score >= 74) {
      this.driverPersona = 'Balanced Urban Pilot 🚗';
    } else if (score >= 58) {
      this.driverPersona = 'Aggressive Commuter ⚡';
    } else {
      this.driverPersona = 'High-Risk Hazard ⚠️';
    }
  }

  getProfile() {
    const score = Math.round(this.stats.safetyScore);

    // AI Coaching recommendations based on habit telemetry
    const coachingTips = [];
    if (this.stats.overspeedEvents > 1 || this.stats.speedDiscipline < 75) {
      coachingTips.push('Adopt cruise control on expressways to prevent speed creep and avoid AI camera challans.');
    }
    if (this.stats.harshBrakeEvents > 1 || this.stats.anticipation < 75) {
      coachingTips.push('Increase your 3-second buffer to anticipate sudden auto rickshaw and bus halts.');
    }
    if (this.stats.distractionEvents > 0 || this.stats.focus < 75) {
      coachingTips.push('Enable "Do Not Disturb While Driving" mode on your smartphone.');
    }
    if (this.stats.drowsinessEvents > 0) {
      coachingTips.push('Schedule mandatory 15-minute rest breaks every 2 hours of highway driving.');
    }
    if (this.stats.laneDiscipline < 75) {
      coachingTips.push('Avoid rapid lane weaving; maintain consistent lane positioning on multilane highways.');
    }
    if (coachingTips.length === 0) {
      coachingTips.push('Exemplary safety discipline! You are in the top 5% of safe drivers on Indian roads.');
    }

    // Insurance Telemetry Discount Calculation
    let insuranceDiscount = '0%';
    let insuranceTier = 'Standard';
    if (score >= 90) {
      insuranceDiscount = '30%';
      insuranceTier = 'Platinum Shield (Max Discount)';
    } else if (score >= 80) {
      insuranceDiscount = '20%';
      insuranceTier = 'Gold Safe Driver Tier';
    } else if (score >= 70) {
      insuranceDiscount = '10%';
      insuranceTier = 'Silver Moderate Tier';
    } else {
      insuranceDiscount = '0%';
      insuranceTier = 'Standard Risk Tier';
    }

    return {
      safetyScore: score,
      persona: this.driverPersona,
      kmDriven: this.stats.smoothKmDriven.toFixed(1),
      overspeedCount: this.stats.overspeedEvents,
      harshBrakeCount: this.stats.harshBrakeEvents,
      distractionCount: this.stats.distractionEvents,
      drowsinessCount: this.stats.drowsinessEvents,
      recentIncidents: this.incidentLog.slice(0, 6),
      coachingTips,
      insuranceDiscount,
      insuranceTier,
      biometrics: {
        smoothness: Math.round(this.stats.smoothness),
        anticipation: Math.round(this.stats.anticipation),
        speedDiscipline: Math.round(this.stats.speedDiscipline),
        focus: Math.round(this.stats.focus),
        laneDiscipline: Math.round(this.stats.laneDiscipline),
        hazardReflex: Math.round(this.stats.hazardReflex),
      },
    };
  }

  resetStats() {
    this.stats.safetyScore = 92;
    this.stats.overspeedEvents = 0;
    this.stats.harshBrakeEvents = 0;
    this.stats.distractionEvents = 0;
    this.stats.drowsinessEvents = 0;
    this.stats.closeCallEvents = 0;
    this.stats.smoothness = 94;
    this.stats.anticipation = 90;
    this.stats.speedDiscipline = 88;
    this.stats.focus = 95;
    this.stats.laneDiscipline = 92;
    this.stats.hazardReflex = 93;
    this.incidentLog = [];
    this._updatePersona();
  }
}
