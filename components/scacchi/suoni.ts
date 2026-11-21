'use client';
// Suoni brevi generati con WebAudio (nessun file audio esterno).
let ctx: AudioContext | null = null;

function tono(freq: number, durata: number, volume = 0.15) {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durata);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + durata);
  } catch {
    // audio non disponibile
  }
}

export function suonoMossa(san?: string | null) {
  if (!san) return;
  if (san.includes('#')) {
    tono(520, 0.12);
    setTimeout(() => tono(390, 0.3), 120);
  } else if (san.includes('+')) tono(660, 0.12, 0.18);
  else if (san.includes('x')) tono(300, 0.09, 0.22);
  else if (san.startsWith('O-O')) {
    tono(420, 0.06);
    setTimeout(() => tono(420, 0.06), 90);
  } else tono(440, 0.06);
}
