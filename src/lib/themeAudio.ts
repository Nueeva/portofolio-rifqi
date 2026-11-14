let audioCtx: AudioContext | undefined;

export function primeThemeAudio() {
    if (typeof window === "undefined") return;
    try {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioClass) return;
        if (!audioCtx) audioCtx = new AudioClass();
        if (audioCtx.state === "suspended") {
            void audioCtx.resume();
        }
    } catch {
        // audio priming ignored
    }
}

export function playThemeInkSound(toDark: boolean) {
    if (typeof window === "undefined") return;
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
        primeThemeAudio();
        if (!audioCtx || audioCtx.state !== "running") return;

        const now = audioCtx.currentTime;

        // Layer 1: Fluid droplet pop (damped sine wave)
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        const startFreq = toDark ? 280 : 360;
        const endFreq = toDark ? 160 : 480;

        osc.type = "sine";
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

        oscGain.gain.setValueAtTime(0.045, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.11);

        // Layer 2: Subtle paper texture whisper (filtered white noise)
        const sampleCount = Math.floor(audioCtx.sampleRate * 0.12);
        const noiseBuffer = audioCtx.createBuffer(1, sampleCount, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(2.5, now);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.018, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        noiseSource.start(now);
        noiseSource.stop(now + 0.12);

        // Layer 3: Subtle mobile haptic feedback
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate([8, 12, 10]);
        }
    } catch {
        // audio gracefully silent
    }
}
