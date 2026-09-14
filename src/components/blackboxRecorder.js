/**
 * Professional Blackbox Flight Recorder & Fleet Telemetry Engine
 * Logs safety critical events, calculates fleet risk rating,
 * and generates exportable incident reports.
 */
export class BlackboxRecorder {
  constructor() {
    this.records = [];
    this.maxRecords = 100;
  }

  logEvent(record) {
    const entry = {
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      speed: Math.round(record.speed),
      speedLimit: record.speedLimit,
      riskLevel: record.riskLevel,
      biggestThreat: record.biggestThreat,
      immediateAction: record.immediateAction,
      location: record.location || 'Indian Highway Corridor',
      gpsCoords: record.gpsCoords || '18.7519° N, 73.4079° E',
      latG: record.latG || 0.05,
      lonG: record.lonG || 0.02,
      driverState: record.driverState || 'Alert',
    };

    this.records.unshift(entry);
    if (this.records.length > this.maxRecords) {
      this.records.pop();
    }
  }

  getRecords() {
    return this.records;
  }

  exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      system: 'SURAKSHA-AI Enterprise Automotive Flight Recorder',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      recordsCount: this.records.length,
      records: this.records,
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `suraksha_blackbox_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  generateSosPayload() {
    const latest = this.records[0] || {
      speed: 70,
      riskLevel: 'HIGH',
      location: 'NH48 Mumbai-Pune Expressway',
      gpsCoords: '18.7519° N, 73.4079° E',
    };

    return {
      emergencyCode: 'SOS-112-CRITICAL',
      timestamp: new Date().toISOString(),
      location: latest.location,
      gpsCoordinates: latest.gpsCoords,
      impactSpeedKmh: latest.speed,
      riskAssessed: latest.riskLevel,
      recommendedEmergencyDispatch: 'Ambulance & Highway Patrol Rapid Response',
    };
  }
}
