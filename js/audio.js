/**
 * Smart Parking System - Audio Synthesis Module
 * Simulates physical ESP32 piezo buzzer indicators via Web Audio API
 * Compliant with PRD Section 5.6 (FR-BUZ-001)
 */

class BuzzerAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastSoundPlayed = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playTone(freq, type = 'square', duration = 0.1, startTime = 0, gainVal = 0.15) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      // Envelope to prevent loud clicks
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(gainVal, this.ctx.currentTime + startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration + 0.02);
    } catch (e) {
      console.warn('Buzzer WebAudio not permitted without user gesture yet:', e);
    }
  }

  /**
   * Sound 1: Short detection beep
   * Triggered when a vehicle enters a parking slot
   */
  beepDetection() {
    this.lastSoundPlayed = 'Deteksi Kendaraan (Short Beep)';
    this.playTone(1800, 'square', 0.08, 0, 0.2);
    this.notifyVisualBuzzer('Short Beep (1800Hz)');
    if (window.smartParkingStore && window.smartParkingStore.triggerPhysicalBuzzer) {
      window.smartParkingStore.triggerPhysicalBuzzer('beep');
    }
  }

  /**
   * Sound 2: Unauthorized alert warning
   * 3 rapid high-pitch beeps
   */
  beepAlert() {
    this.lastSoundPlayed = 'Peringatan Slot Ilegal (Warning Alert)';
    this.playTone(2400, 'square', 0.07, 0.00, 0.25);
    this.playTone(2400, 'square', 0.07, 0.11, 0.25);
    this.playTone(2400, 'square', 0.07, 0.22, 0.25);
    this.notifyVisualBuzzer('Alert Warning (3x Pulse 2400Hz)');
    if (window.smartParkingStore && window.smartParkingStore.triggerPhysicalBuzzer) {
      window.smartParkingStore.triggerPhysicalBuzzer('alert');
    }
  }

  /**
   * Sound 3: Arrival Confirmation chime
   * Rising melodic 2-tone chime
   */
  beepSuccess() {
    this.lastSoundPlayed = 'Autentikasi Kedatangan Berhasil';
    this.playTone(1200, 'sine', 0.10, 0.00, 0.25);
    this.playTone(1800, 'sine', 0.20, 0.11, 0.25);
    this.notifyVisualBuzzer('Confirmation Chime (1200Hz -> 1800Hz)');
    if (window.smartParkingStore && window.smartParkingStore.triggerPhysicalBuzzer) {
      window.smartParkingStore.triggerPhysicalBuzzer('success');
    }
  }

  /**
   * Sound 4: Low buzz for error/rejection
   */
  beepError() {
    this.lastSoundPlayed = 'Kesalahan / Penolakan';
    this.playTone(380, 'sawtooth', 0.22, 0.00, 0.2);
    this.notifyVisualBuzzer('Error Tone (380Hz)');
  }

  notifyVisualBuzzer(label) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('buzzer-triggered', {
        detail: {
          label: label,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false })
        }
      }));
    }
  }
}

// Global instance
window.buzzerAudio = new BuzzerAudioSystem();

