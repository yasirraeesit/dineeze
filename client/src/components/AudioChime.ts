// Web Audio API chime generator with interaction unlock
class AudioChime {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    const savedMute = localStorage.getItem("dineeze_kds_muted");
    this.isMuted = savedMute === "true";
  }

  public unlock(): void {
    if (this.isUnlocked && this.ctx && this.ctx.state === "running") return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.ctx) {
          this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn("Could not unlock Web Audio API:", e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem("dineeze_kds_muted", String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playNewOrderChime(): void {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Note 1: High crisp chime (880 Hz - A5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: Harmonic resolution (1174.66 Hz - D6)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn("Audio chime error:", err);
    }
  }

  public playOrderReadyChime(): void {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: 880 Hz (A5)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      // Note 3: 1318.51 Hz (E6) - Celebratory harmonic peak
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1318.51, now + 0.25);
      gain3.gain.setValueAtTime(0.3, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.85);
    } catch (err) {
      console.warn("Order ready chime error:", err);
    }
  }
}

export const audioChime = new AudioChime();
export default audioChime;

