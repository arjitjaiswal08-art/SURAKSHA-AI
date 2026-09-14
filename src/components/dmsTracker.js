/**
 * Driver Monitoring System (DMS) Visualizer
 * Renders an AI face mesh simulation / webcam overlay, displaying eye aspect ratio (EAR),
 * head tilt orientation, gaze tracking vector, and phone detection flags.
 */
export class DmsTrackerVisualizer {
  constructor(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.video = videoElement;
    this.ctx = canvasElement.getContext('2d');
    this.webcamStream = null;
    this.isWebcamActive = false;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
    }
  }

  async toggleWebcam() {
    if (this.isWebcamActive) {
      this.stopWebcam();
      return false;
    } else {
      return await this.startWebcam();
    }
  }

  async startWebcam() {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      if (this.video) {
        this.video.srcObject = this.webcamStream;
        await this.video.play();
        this.isWebcamActive = true;
        return true;
      }
    } catch (e) {
      console.warn('Webcam permission denied or unavailable:', e);
      alert('Webcam could not be opened. Using simulated high-fidelity DMS neural feed.');
      this.isWebcamActive = false;
      return false;
    }
    return false;
  }

  stopWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isWebcamActive = false;
  }

  render(dmsState) {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // If webcam active, draw video frame
    if (this.isWebcamActive && this.video && this.video.readyState >= 2) {
      ctx.save();
      // Mirror webcam
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.restore();
    } else {
      // Simulated Face Sensor Canvas Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw stylized 3D Face Wireframe
      this._renderSimulatedFace(ctx, w, h, dmsState);
    }

    // Overlay DMS HUD Metrics
    this._renderDmsOverlay(ctx, w, h, dmsState);
  }

  _renderSimulatedFace(ctx, w, h, dmsState) {
    const cx = w * 0.5;
    let cy = h * 0.48;

    // Shift head pose if nodding/dropping or turned away
    if (dmsState.headMovement === 'dropping') {
      cy += 25 * window.devicePixelRatio;
    } else if (dmsState.headMovement === 'turned_away') {
      // shifted gaze
    }

    const faceW = 75 * window.devicePixelRatio;
    const faceH = 95 * window.devicePixelRatio;

    // Face Bounding Box
    const isCritical = dmsState.riskLevel === 'CRITICAL';
    const isHigh = dmsState.riskLevel === 'HIGH';
    const boxColor = isCritical ? '#ef4444' : (isHigh ? '#f59e0b' : '#38bdf8');

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.strokeRect(cx - faceW * 0.5, cy - faceH * 0.5, faceW, faceH);

    // Subtle face oval
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, faceW * 0.4, faceH * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    const eyeSpacing = 22 * window.devicePixelRatio;
    const eyeY = cy - 10 * window.devicePixelRatio;
    const isClosed = dmsState.eyeState === 'closed';
    const isDroopy = dmsState.eyeState === 'droopy';

    // Left & Right eye rendering
    [-1, 1].forEach(side => {
      const ex = cx + side * eyeSpacing;
      ctx.strokeStyle = isClosed ? '#ef4444' : (isDroopy ? '#fbbf24' : '#10b981');
      ctx.lineWidth = 2.5 * window.devicePixelRatio;

      if (isClosed) {
        // Flat closed eye line
        ctx.beginPath();
        ctx.moveTo(ex - 8 * window.devicePixelRatio, eyeY);
        ctx.lineTo(ex + 8 * window.devicePixelRatio, eyeY);
        ctx.stroke();
      } else {
        // Open or droopy almond eye
        const eyeHeight = isDroopy ? 3.5 * window.devicePixelRatio : 7 * window.devicePixelRatio;
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 8 * window.devicePixelRatio, eyeHeight, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pupil / Gaze Vector
        ctx.fillStyle = ctx.strokeStyle;
        const gazeOffsetX = dmsState.attentionLevel === 'distracted' ? (side * 4) : 0;
        ctx.beginPath();
        ctx.arc(ex + gazeOffsetX, eyeY, 2.5 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Mouth
    const mouthY = cy + 22 * window.devicePixelRatio;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, mouthY, 12 * window.devicePixelRatio, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Phone Overlay if in use
    if (dmsState.phoneUsage) {
      const px = cx + faceW * 0.4;
      const py = cy + 10 * window.devicePixelRatio;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2 * window.devicePixelRatio;
      ctx.fillRect(px, py, 26 * window.devicePixelRatio, 44 * window.devicePixelRatio);
      ctx.strokeRect(px, py, 26 * window.devicePixelRatio, 44 * window.devicePixelRatio);

      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${8 * window.devicePixelRatio}px sans-serif`;
      ctx.fillText('PHONE', px + 2, py + 12 * window.devicePixelRatio);
    }
  }

  _renderDmsOverlay(ctx, w, h, dmsState) {
    // Top banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, 0, w, 24 * window.devicePixelRatio);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${10 * window.devicePixelRatio}px 'JetBrains Mono', monospace`;
    ctx.fillText('CAM-02 [DMS] • IR EYE TRACKER', 8 * window.devicePixelRatio, 16 * window.devicePixelRatio);

    // Bottom telemetry pills
    const pillY = h - 22 * window.devicePixelRatio;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, pillY - 4, w, 26 * window.devicePixelRatio);

    const eyeStatus = dmsState.eyeState?.toUpperCase() || 'OPEN';
    const isClosed = dmsState.eyeState === 'closed';

    ctx.fillStyle = isClosed ? '#ef4444' : '#10b981';
    ctx.font = `bold ${10 * window.devicePixelRatio}px 'JetBrains Mono', monospace`;
    ctx.fillText(`EYES: ${eyeStatus}`, 10 * window.devicePixelRatio, pillY + 12 * window.devicePixelRatio);

    ctx.fillStyle = dmsState.phoneUsage ? '#ef4444' : '#10b981';
    ctx.fillText(`PHONE: ${dmsState.phoneUsage ? 'DETECTED' : 'CLEAR'}`, w * 0.48, pillY + 12 * window.devicePixelRatio);
  }
}
