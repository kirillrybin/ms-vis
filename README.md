# ms-vis

An audio-reactive visualizer for the Elektron Model:Samples in a single HTML file. Built with Three.js and the native Web MIDI API, in the aesthetic of Keijiro Takahashi: black background, procedural geometry, monochrome palette with rare orange accents (`#FF5500`).

**Live demo:** https://kirillrybin.github.io/ms-vis/

## Getting started

1. Open the live demo in Google Chrome, or run a local server with `python3 -m http.server 8000` in the project folder and open http://localhost:8000. Opening `index.html` via `file://` also works, but Chrome does not remember the microphone permission there, so you have to grant it again on every load.
2. Allow MIDI access.
3. The visualizer connects to the first available MIDI input (it prefers devices with "Model" or "Elektron" in the name). You can switch the device in the selector in the top-left corner. It fades out after 3 seconds and reappears on hover.

An internet connection is required: Three.js r160 and its addons are loaded from a CDN (jsdelivr).

No synth at hand? Press the hidden **Test Beat** button in the bottom-right corner (it appears on hover). It plays a simulated groove through the same handlers as real MIDI.

## Projector mode

| Key | Action |
|-----|--------|
| **F** | Fullscreen. All UI is hidden, only the picture remains |
| **R** | Start / stop video recording. A `.webm` file is downloaded when you stop |
| **T** | Toggle Test Beat when the button is hidden |

The cursor disappears after 2 seconds without mouse movement. While recording, a small orange dot blinks at the top center. Audio is included in the recording if you pick an audio input in the settings panel (**H**, "Audio input" field). The Model:Samples shows up there as a USB audio device. Choose the input before you start recording; Chrome will ask for microphone permission. By default the recording is silent.

## Settings

Press **H** to show or hide the panel in the top-right corner. It lets you adjust:

- kick and snare sensitivity and decay speed;
- camera zoom on kick;
- maximum RGB shift on snare;
- number of hi-hat particles;
- bloom base level and range;
- particle density, size and brightness;
- rotation speed.

Values are saved in the browser's `localStorage`. The **Reset** button restores the defaults.

## MIDI mapping

Channels 1–6 are used, which are the Model:Samples tracks by default.

| Channel | Role | Reaction |
|---------|------|----------|
| 1 | Kick | Geometry expansion pulse, light camera zoom with smooth decay |
| 2 | Snare | Chromatic aberration (RGB Shift) and color inversion for 100 ms |
| 3 | Hi-Hat | Burst of small particles around the center |
| 4–6 | Rings | Rotation and pulsing of thin wireframe rings, driven by the note number |

Note On velocity is taken into account.

| CC | Parameter | Effect |
|----|-----------|--------|
| 74 | Filter Cutoff | Noise frequency and amplitude: from a smooth sphere (0) to a chaotic hedgehog (127) |
| 12, 13 | Delay / Reverb | Bloom intensity |

CC messages are accepted from any of channels 1–6.

## Under the hood

- **Core:** 36,000 particles (`Points`) on a Fibonacci sphere plus a wireframe icosphere (`LineSegments`). Both are deformed in the vertex shader by 3D simplex noise.
- **Hi-hats:** a pool of 900 particles whose motion is computed entirely in the vertex shader. The CPU only writes spawn data when a hat is hit.
- **Auto quality:** if FPS stays below 45, particle density is lowered (and, as a last resort, the pixel ratio drops to 1); it recovers slowly when FPS is stable. The current FPS and quality level are shown in the settings panel title. It can be switched off with the "Auto quality" slider.
- **Post-processing:** `EffectComposer` with `UnrealBloomPass`, `RGBShiftShader` and a custom inversion pass.
- **All code** (HTML, CSS, JS, GLSL) lives in a single `index.html` file.
