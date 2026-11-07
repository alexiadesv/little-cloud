/** Shared Web Audio graph: one context, a master gain, a voice channel and an SFX bus. */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voiceBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private voice: AudioBufferSourceNode | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();
  private muted = false;

  /** Must be called from a user gesture (tap / click) before sound can play. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.voiceBus = this.ctx.createGain();
      this.voiceBus.gain.value = 1;
      this.voiceBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get context() {
    return this.ctx;
  }

  get sfx() {
    return this.sfxBus;
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    if (muted) this.stopVoice();
  }

  /** Fetches and decodes a clip once; resolves null if it is missing or undecodable. */
  load(url: string): Promise<AudioBuffer | null> {
    let job = this.buffers.get(url);
    if (!job) {
      job = (async () => {
        if (!this.ctx) return null;
        const res = await fetch(url);
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html') || type.includes('json')) return null;
        return await this.ctx.decodeAudioData(await res.arrayBuffer());
      })().catch(() => null);
      job.then((buf) => {
        if (!buf) this.buffers.delete(url);
      });
      this.buffers.set(url, job);
    }
    return job;
  }

  /** Plays a clip on the voice channel (stopping any previous voice). Resolves when it ends. */
  playVoice(buffer: AudioBuffer): Promise<void> {
    if (!this.ctx || !this.voiceBus) return Promise.resolve();
    this.stopVoice();
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.voiceBus);
    this.voice = src;
    return new Promise((resolve) => {
      src.onended = () => {
        if (this.voice === src) this.voice = null;
        resolve();
      };
      src.start();
    });
  }

  stopVoice() {
    if (this.voice) {
      this.voice.onended?.(new Event('ended'));
      try {
        this.voice.stop();
      } catch {
        /* already stopped */
      }
      this.voice = null;
    }
  }
}

export const audio = new AudioEngine();
