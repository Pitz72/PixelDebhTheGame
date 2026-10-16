#!/usr/bin/env python3
"""
Prepares the game's music tracks from generated audio files (see docs/MUSIC_BRIEF.md).

For every <track>.(mp3|wav|flac|ogg|m4a) found in --src it:
  1. decodes it with ffmpeg to 48 kHz stereo and trims digital silence at both ends;
  2. loops tracks: estimates tempo and beat grid, picks the loop start/end on the beat grid
     (a whole number of bars apart) where the music before the two points sounds most alike,
     aligns the waveform at the seam and bakes a short crossfade into the end of the loop;
     one-shot tracks (victory, game over): adds a short fade-out if the file stops abruptly;
  3. normalises the loudness to -18 LUFS (BS.1770, gated) without exceeding -1.5 dBFS peak;
  4. encodes Ogg Vorbis, decodes it again and re-measures length, loudness and the loop seam;
  5. updates manifest.json in --out (loop points in seconds, plus the measurements).

The seam check is numeric: the spectral jump across the loop point is ranked against the
jumps everywhere else in the track, and the sample-to-sample step at the seam is compared
with the steps elsewhere (to catch clicks). It cannot replace listening: do that before
keeping a track.

Needs numpy, scipy and ffmpeg (with libvorbis) on PATH, or FFMPEG=<path to ffmpeg>.

  python tools/audio/prepare_music.py --src C:/path/to/generated [--only title,boss-frog]
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter, stft

SR = 48000
TARGET_LUFS = -18.0
PEAK_CEILING_DB = -1.5
FADE_S = 0.030  # crossfade baked into the loop seam

LOOPING = ['title', 'world-adventure', 'world-industrial', 'world-ethereal',
           'boss-frog', 'boss-chicken-eye', 'boss-shadow-head', 'highscore']
ONE_SHOT = ['victory', 'gameover']
EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']

# BS.1770 K-weighting, coefficients for 48 kHz.
K_STAGES = [
    ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]),
    ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]),
]


def find_ffmpeg():
    exe = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    if not exe:
        sys.exit('ffmpeg not found: put it on PATH or set FFMPEG=<path to ffmpeg>')
    return exe


def db(x):
    return 20 * np.log10(max(float(x), 1e-9))


def decode(ffmpeg, path):
    """Any audio file -> float32 array (n, 2) at 48 kHz."""
    out = subprocess.run(
        [ffmpeg, '-v', 'error', '-i', str(path), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
        capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).reshape(-1, 2).copy()


def trim_silence(x, floor_db=-60.0):
    peak = np.abs(x).max(axis=1)
    loud = np.nonzero(peak > 10 ** (floor_db / 20))[0]
    if len(loud) == 0:
        sys.exit('the file is silent')
    return x[loud[0]:loud[-1] + 1]


def lufs(x):
    """Integrated loudness with the BS.1770 absolute and relative gates."""
    y = x.astype(np.float64)
    for b, a in K_STAGES:
        y = lfilter(b, a, y, axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if len(y) < blk:
        return -0.691 + 10 * np.log10(max((y ** 2).sum(axis=1).mean(), 1e-12))
    cs = np.concatenate([np.zeros((1, y.shape[1])), np.cumsum(y ** 2, axis=0)])
    ms = ((cs[blk:] - cs[:-blk]) / blk)[::hop].sum(axis=1)
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    gated = lk > -70
    if not gated.any():
        return -70.0
    relative = -0.691 + 10 * np.log10(ms[gated].mean()) - 10
    keep = gated & (lk > relative)
    return -0.691 + 10 * np.log10(ms[keep].mean())


# --- spectral features ------------------------------------------------------------------

N_FFT, HOP = 2048, 256


def mel_bank(n_mels=40, fmin=40.0, fmax=12000.0):
    mel = lambda f: 2595 * np.log10(1 + f / 700)
    inv = lambda m: 700 * (10 ** (m / 2595) - 1)
    pts = inv(np.linspace(mel(fmin), mel(fmax), n_mels + 2))
    bins = np.floor((N_FFT + 1) * pts / SR).astype(int)
    fb = np.zeros((n_mels, N_FFT // 2 + 1))
    for i in range(n_mels):
        lo, mid, hi = bins[i], bins[i + 1], bins[i + 2]
        for k in range(lo, mid):
            fb[i, k] = (k - lo) / max(mid - lo, 1)
        for k in range(mid, hi):
            fb[i, k] = (hi - k) / max(hi - mid, 1)
    return fb


MEL = mel_bank()


def log_mel(mono):
    _, _, z = stft(mono, fs=SR, nperseg=N_FFT, noverlap=N_FFT - HOP, boundary=None, padded=False)
    return 10 * np.log10(np.maximum(MEL @ (np.abs(z) ** 2), 1e-10))  # (mels, frames)


FRAME_S = HOP / SR


def onset_strength(lm):
    o = np.maximum(0, np.diff(lm, axis=1)).sum(axis=0)
    return o / max(o.std(), 1e-9)


def estimate_beat(o):
    """Beat period in seconds and the time of the first beat, from the onset envelope."""
    o = o - o.mean()
    n = len(o)
    ac = np.fft.irfft(np.abs(np.fft.rfft(o, 2 * n)) ** 2)[:n]
    lags = np.arange(1, n)
    bpm = 60 / (lags * FRAME_S)
    weight = np.exp(-0.5 * (np.log2(bpm / 120) / 0.8) ** 2) * ((bpm >= 70) & (bpm <= 180))
    best = int(lags[np.argmax(ac[1:] * weight)])
    period = best * FRAME_S

    # refine the period (and find the phase) by sliding a comb of beats over the whole track
    t = np.arange(n) * FRAME_S
    best_score, best_period, best_phase = -1e18, period, 0.0
    for p in period * (1 + np.linspace(-0.015, 0.015, 301)):
        phases = np.linspace(0, p, 48, endpoint=False)
        for ph in phases:
            idx = np.round((np.arange(ph, t[-1], p)) / FRAME_S).astype(int)
            idx = idx[idx < n]
            s = o[idx].mean()
            if s > best_score:
                best_score, best_period, best_phase = s, p, ph
    return best_period, best_phase


def window_features(lm, centre_s, beat_s):
    """The bar before `centre_s` as 4 beat-averages of the log-mel spectrum, flattened."""
    parts = []
    for k in range(4):
        a = int(round((centre_s - (4 - k) * beat_s) / FRAME_S))
        b = int(round((centre_s - (3 - k) * beat_s) / FRAME_S))
        a, b = max(a, 0), max(b, a + 1)
        parts.append(lm[:, a:b].mean(axis=1))
    return np.concatenate(parts)


def rms_db(x):
    return db(np.sqrt(np.mean(np.square(x))) if len(x) else 0)


# --- loop search ------------------------------------------------------------------------

def find_loop(x, lm, beat_s, phase):
    dur = len(x) / SR
    mono = x.mean(axis=1)
    # the last stretch to consider: before the outro fades out
    env = np.array([rms_db(mono[i:i + SR // 4]) for i in range(0, len(mono) - SR // 4, SR // 4)])
    steady = np.median(env[len(env) // 4:])
    quiet = np.nonzero(env < steady - 12)[0]
    quiet = quiet[quiet > len(env) // 2]
    end_limit = min(dur - 0.5, (quiet[0] * 0.25) if len(quiet) else dur - 0.5)

    grid = np.arange(phase, dur, beat_s)
    starts = [t for t in grid if FADE_S + 0.02 <= t <= min(0.35 * dur, 25.0)]
    ends = [t for t in grid if t >= 0.4 * dur and t <= end_limit]
    if not starts or not ends:
        sys.exit('track too short or too irregular to loop (need 20 s or more with a steady beat)')

    feat = {round(t, 4): window_features(lm, t, beat_s) for t in starts + ends}
    level = {round(t, 4): rms_db(mono[max(0, int((t - 1.0) * SR)):int(t * SR)]) for t in starts + ends}
    scale = np.sqrt(len(next(iter(feat.values()))))

    best = None
    for s in starts:
        for e in ends:
            beats = (e - s) / beat_s
            if abs(beats - round(beats)) > 0.1 or int(round(beats)) % 4 != 0:
                continue
            if abs(level[round(s, 4)] - level[round(e, 4)]) > 2.5:
                continue
            dist = np.linalg.norm(feat[round(s, 4)] - feat[round(e, 4)]) / scale
            score = dist * (1 + 0.5 * (1 - (e - s) / dur))
            if best is None or score < best[0]:
                best = (score, s, e, dist)
    if best is None:
        sys.exit('no loop point pair found: the music changes too much between start and end')
    return best[1], best[2], best[3]


def align_end(mono, ls, le, search_s=0.003, win_s=0.010):
    """Moves the loop end by a few milliseconds so the waveform lines up with the one before the start."""
    n = int(win_s * SR)
    ref = mono[ls - n:ls]
    best, best_c = le, -2.0
    for d in range(-int(search_s * SR), int(search_s * SR) + 1):
        seg = mono[le + d - n:le + d]
        c = float(np.dot(ref, seg) / (np.linalg.norm(ref) * np.linalg.norm(seg) + 1e-12))
        if c > best_c:
            best, best_c = le + d, c
    return best, best_c


def bake_crossfade(x, ls, le, corr):
    """Fades the last FADE_S before the loop end into the audio that precedes the loop start."""
    n = int(FADE_S * SR)
    t = np.linspace(0, 1, n, endpoint=False)[:, None]
    if corr > 0.7:  # coherent signals: equal gain
        fo, fi = 1 - t, t
    else:  # unrelated signals: equal power
        fo, fi = np.cos(t * np.pi / 2), np.sin(t * np.pi / 2)
    y = x[:le].copy()
    y[le - n:le] = x[le - n:le] * fo + x[ls - n:ls] * fi
    return y


def seam_check(y, ls, le):
    """
    Two numbers about the loop point of the finished audio:
      rank:  how the spectral jump across the seam ranks among the jumps in every other
             16-frame stretch of the track (0.5 = typical, above 0.97 = the roughest spot);
      click: the sample-to-sample step at the seam over the largest step within 5 ms of it
             (1 or less = the seam hides in the signal, well above 1 = an audible click).
    """
    span = int(1.5 * SR)
    a = y[max(0, le - span):le]
    joined = np.concatenate([a, y[ls:ls + span]]).mean(axis=1)

    jumps = np.linalg.norm(np.diff(log_mel(joined), axis=1), axis=0)
    centre = int(len(a) / HOP)
    seam = jumps[max(0, centre - 8):centre + 8].max()
    whole = np.linalg.norm(np.diff(log_mel(y.mean(axis=1)), axis=1), axis=0)
    windows = np.array([whole[i:i + 16].max() for i in range(0, len(whole) - 16)])
    rank = float((windows < seam).mean())

    steps = np.abs(np.diff(joined))
    m = len(a)
    near = int(0.005 * SR)
    at_seam = steps[m - 2:m + 1].max()
    around = np.concatenate([steps[max(0, m - near):m - 4], steps[m + 3:m + near]])
    return rank, float(at_seam / max(around.max(), 1e-9))


# --- per-track pipeline -------------------------------------------------------------------

def normalise(y):
    gain_db = TARGET_LUFS - lufs(y)
    peak_db = db(np.abs(y).max()) + gain_db
    limited = peak_db > PEAK_CEILING_DB
    if limited:
        gain_db -= peak_db - PEAK_CEILING_DB
    return y * 10 ** (gain_db / 20), gain_db, limited


def encode(ffmpeg, y, out_path):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'in.wav'
        wavfile.write(wav, SR, y.astype(np.float32))
        subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libvorbis', '-q:a', '4', str(out_path)], check=True)


def process(ffmpeg, key, src, out_dir):
    looping = key in LOOPING
    x = trim_silence(decode(ffmpeg, src))
    info = {'file': f'{key}.ogg'}
    notes = []

    if looping:
        lm = log_mel(x.mean(axis=1))
        beat_s, phase = estimate_beat(onset_strength(lm))
        ls_s, le_s, dist = find_loop(x, lm, beat_s, phase)
        ls = int(round(ls_s * SR))
        le, corr = align_end(x.mean(axis=1), ls, int(round(le_s * SR)))
        y = bake_crossfade(x, ls, le, corr)
        info.update({'loopStart': round(ls / SR, 6), 'loopEnd': round(le / SR, 6), 'gainDb': 0,
                     'bpm': round(60 / beat_s, 2), 'loopBars': int(round((le - ls) / SR / beat_s / 4))})
        notes.append(f"{info['bpm']} BPM, loop {ls / SR:.3f} -> {le / SR:.3f} s ({info['loopBars']} bars), "
                     f"feature distance {dist:.2f}, waveform correlation {corr:.2f}")
    else:
        y = x.copy()
        tail = int(0.05 * SR)
        if rms_db(y[-tail:]) > -50:
            fade = int(0.12 * SR)
            y[-fade:] *= np.linspace(1, 0, fade)[:, None]
            notes.append('abrupt end: added a 120 ms fade-out')
        info.update({'loopStart': 0, 'loopEnd': 0, 'gainDb': 0})

    y, gain_db, limited = normalise(y)
    notes.append(f'gain {gain_db:+.1f} dB' + (' (limited by the peak ceiling, quieter than target)' if limited else ''))

    out_path = out_dir / f'{key}.ogg'
    encode(ffmpeg, y, out_path)

    # measure what the game will actually decode
    back = decode(ffmpeg, out_path)
    info['durationS'] = round(len(back) / SR, 3)
    info['lufs'] = round(float(lufs(back)), 1)
    info['peakDb'] = round(db(np.abs(back).max()), 1)
    if looping:
        rank, click = seam_check(back, int(info['loopStart'] * SR), int(info['loopEnd'] * SR))
        info['seamRank'], info['clickRatio'] = round(rank, 2), round(click, 2)
        if rank > 0.97:
            notes.append('WARNING: the loop seam is a bigger spectral jump than almost anywhere else in the track, listen to it')
        if click > 1.5:
            notes.append('WARNING: the loop seam has a click')
    if abs(len(back) - len(y)) > 2 * 1024:
        notes.append(f'WARNING: decoded length differs from the source by {len(back) - len(y)} samples')
    return info, notes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help='folder with <track>.mp3|wav|flac|ogg|m4a')
    ap.add_argument('--out', default=str(Path(__file__).resolve().parents[2] / 'public' / 'audio' / 'music'))
    ap.add_argument('--only', help='comma separated track names')
    args = ap.parse_args()

    ffmpeg = find_ffmpeg()
    src_dir, out_dir = Path(args.src), Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / 'manifest.json'
    manifest = json.loads(manifest_path.read_text('utf-8')) if manifest_path.exists() else {'tracks': {}}
    manifest.setdefault('tracks', {})

    wanted = args.only.split(',') if args.only else LOOPING + ONE_SHOT
    found = 0
    for key in wanted:
        if key not in LOOPING + ONE_SHOT:
            print(f'unknown track "{key}"; known: {", ".join(LOOPING + ONE_SHOT)}')
            continue
        src = next((src_dir / f'{key}{e}' for e in EXTENSIONS if (src_dir / f'{key}{e}').exists()), None)
        if not src:
            print(f'{key:18} (no file)')
            continue
        found += 1
        print(f'{key:18} {src.name}')
        info, notes = process(ffmpeg, key, src, out_dir)
        manifest['tracks'][key] = info
        for n in notes:
            print(f'{"":18}   {n}')
        print(f'{"":18}   -> {info["file"]}: {info["durationS"]} s, {info["lufs"]} LUFS, peak {info["peakDb"]} dB'
              + (f', seam rank {info["seamRank"]}, click {info["clickRatio"]}' if 'seamRank' in info else ''))

    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', 'utf-8')
    print(f'\n{found} track(s) processed, manifest: {manifest_path}')


if __name__ == '__main__':
    main()
