"use client";

import { useEffect, useRef, useState } from "react";

// A soundscape under the instructor's voice, generated in the browser with the Web Audio API
// (no audio files to host or license): soft rain from filtered noise, or a singing bowl struck
// every few seconds, tuned to 432 Hz. It plays only while the practice plays.

export const ambiences = ["voice", "rain", "bowls"] as const;
export type Ambience = (typeof ambiences)[number];

const FADE = 0.8; // seconds

class AmbientEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private bus: GainNode | null = null;
  private stops: (() => void)[] = [];
  private timer: number | undefined;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  setLevel(level: number) {
    this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.1);
  }

  start(kind: Exclude<Ambience, "voice">) {
    this.stop();
    void this.ctx.resume();
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0, this.ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, this.ctx.currentTime + FADE);
    bus.connect(this.master);
    this.bus = bus;
    if (kind === "rain") this.rain(bus);
    else this.bowls(bus);
  }

  /** Fades the current soundscape out, then releases its nodes. */
  stop() {
    window.clearTimeout(this.timer);
    const { bus, stops } = this;
    this.bus = null;
    this.stops = [];
    if (!bus) return;
    const now = this.ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + FADE);
    window.setTimeout(() => {
      stops.forEach((stopNode) => stopNode());
      bus.disconnect();
    }, FADE * 1000 + 50);
  }

  close() {
    this.stop();
    void this.ctx.close();
  }

  /** Pink noise (Paul Kellet's filter), banded and slowly swelling like rain on a roof. */
  private rain(out: AudioNode) {
    const { ctx } = this;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const high = new BiquadFilterNode(ctx, { type: "highpass", frequency: 350 });
    const low = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2600 });
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    const lfo = new OscillatorNode(ctx, { frequency: 0.12 });
    const depth = ctx.createGain();
    depth.gain.value = 0.12;
    lfo.connect(depth).connect(swell.gain);
    noise.connect(high).connect(low).connect(swell).connect(out);
    noise.start();
    lfo.start();
    this.stops.push(() => noise.stop(), () => lfo.stop());
  }

  /** A struck bowl: inharmonic partials over a 432 Hz fundamental, each slightly detuned so it beats. */
  private bowls(out: AudioNode) {
    const partials = [
      { ratio: 1, gain: 0.32, decay: 11 },
      { ratio: 2.76, gain: 0.14, decay: 7 },
      { ratio: 5.4, gain: 0.07, decay: 4.5 },
      { ratio: 8.93, gain: 0.03, decay: 3 },
    ];
    const strike = () => {
      const { ctx } = this;
      const now = ctx.currentTime;
      // Alternate between the root and the fifth below, so the strikes don't drone on one note.
      const root = Math.random() < 0.7 ? 432 : 288;
      for (const p of partials) {
        for (const detune of [-0.6, 0.6]) {
          const osc = new OscillatorNode(ctx, { frequency: root * p.ratio + detune });
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, now);
          env.gain.linearRampToValueAtTime(p.gain, now + 0.015);
          env.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
          osc.connect(env).connect(out);
          osc.start(now);
          osc.stop(now + p.decay + 0.1);
        }
      }
      this.timer = window.setTimeout(strike, 9000 + Math.random() * 5000);
    };
    strike();
  }
}

/**
 * The chosen soundscape and its level (0–1), running only while `playing`. The audio context is
 * created on first use, after the visitor has pressed play, so browsers allow it to sound.
 */
export function useAmbience(playing: boolean, level: number) {
  const [ambience, setAmbience] = useState<Ambience>("voice");
  const engine = useRef<AmbientEngine | null>(null);

  useEffect(() => {
    if (ambience === "voice" || !playing) {
      engine.current?.stop();
      return;
    }
    engine.current ??= new AmbientEngine();
    engine.current.setLevel(level);
    engine.current.start(ambience);
    // Level changes are applied below without restarting the soundscape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambience, playing]);

  useEffect(() => {
    engine.current?.setLevel(level);
  }, [level]);

  useEffect(() => () => engine.current?.close(), []);

  return { ambience, setAmbience };
}
