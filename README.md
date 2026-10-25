# Bounce & Echo

DESIGN 4106 · Found on the Oval · classroom prototype

A sound trail leads to three simple objects standing together: a throwing ring, a swinging weight and three note beacons. The interface has one Start button. Interaction happens on the objects, with a small return arrow and close button. There are no help/settings menus, reset/replay buttons, activity-selector buttons or completion dialogs.

## Run

Open the published HTTPS website on a phone and press **Start**. The normal URL starts the sound quest over the real rear-camera feed, then opens spatial AR on arrival. Device type never silently switches to practice. Use `?camera` to test the installations immediately without the quest.

- **WebXR ground AR:** after loading, press **Open AR**, scan a textured horizontal surface, then tap the ring to place the field. It stays in the session's tracked physical coordinates while the phone moves. The browser must support immersive AR, hit-test, and DOM overlay for touch input.
- **Marker AR:** browsers without immersive AR use the bundled Hiro pattern. Open `marker.html` on another screen to try it; print it at 100% and place it flat on the floor for the installation. The black square is approximately 18 cm. Keep the complete marker and white margin visible. The field is scaled to 0.32 for this mode, making a small floor installation around the physical marker. Loss of tracking hides the field and pauses interaction.

Explicit links:

- `?trail`: the same GPS sound quest as the normal URL, now over a live rear-camera view. TARGET is configured to the user-marked ant location: latitude 40.000126, longitude -83.013214 (the supplied GPS capture reported approximately ±5 m accuracy). All three stations share this destination. Arrival enters spatial AR.
- `?marker`: force the physical-marker backend.
- `?camera`: immediate spatial AR test at the current physical space, bypassing the quest.
- `?scout`: capture the actual destination and copy its TARGET line into `app.js`.
- `?preview`: practice sound quest; use this explicitly for file/desktop practice.
- `?toy`: isolated 3D practice area.

## Play

Tap the physical object to approach/select it. The small names are plain labels, not buttons. Picking includes a forgiving screen-space area around each object for phones.

- Toss: drag the orange ball and release through the ring three times. A green marker predicts a clear pass. A miss returns the ball automatically.
- Swing: pull the orange weight sideways and release. Gravity carries it through the three bells. Hit bells remain lit.
- Echo: watch/listen, then repeat the notes. Three short tunes complete this object; afterwards the notes can be played freely.

A completed object remains lit. The view returns to the area without interrupting with a dialog. All three complete together with a shared melody and local streamers. Reload to start fresh. The small arrow returns to all objects; × leaves the scene.

Audio uses the device volume. Reduced motion follows the operating system preference. The gestures use touch/mouse, not camera hand tracking.

## AR placement

`spatial-ar.js` separates spatial tracking from toy mechanics. WebXR uses actual horizontal surface hit-test results in a local reference space. It places once; later taps and station selection cannot recenter the field or teleport the camera. Tracking loss pauses play until a valid viewer pose returns. This is session-local world tracking, without cross-session persistence or real-world depth occlusion.

Marker mode uses AR.js camera calibration and `markers/hiro.patt`, loaded locally. The physical marker is the coordinate frame; the camera remains at its calibrated origin and the marker pose updates the parent of the field. All physics remains in each model's local coordinates. A 0.32 scale makes the marker-based installation compact. Tracking is conditional on the marker remaining visible; it is not markerless room tracking.

GPS only guides the optional sound quest; it does not place objects in either spatial backend. `CAMERA_HEIGHT` is now only the desktop practice camera height. No synthetic floor or scenery is generated. `tools/patch_arjs.py` documents small changes to the pinned runtime for camera-source lifecycle access and safe disposal/resizing. The game no longer loads location-based AR camera components.

## Models

Four editable GLB mesh files are actually loaded through A-Frame `gltf-model`:

- `models/toss-station.glb`
- `models/swing-station.glb`
- `models/echo-station.glb`
- `models/throw-ball.glb`

`tools/build_models.py` is the original procedural modelling source. The files contain meshes, normals, PBR materials and named transform nodes, and can be imported into Blender. No hand-modelling history or native `.blend` project is claimed. Keep node names, origins and hierarchy when re-exporting. See `模型使用说明.txt`.

Hosted pages load external GLBs. Local file previews use identical embedded bytes in `models/model-data.js`. Use Live Server to check GLBs edited in Blender. Re-running the generator overwrites the supplied models; do not run it over your own edits.

## Publish yourself

Upload the extracted contents so `index.html`, `models/`, and `vendor/` sit at the repository root. Enable GitHub Pages from main / root. Nothing in this delivery publishes or pushes the project. Detailed steps are in `手机运行步骤.txt`.

## Design and open-source references

- [Big Walk — official game page](https://bigwalk.game/) and [official Steam description](https://store.steampowered.com/app/1478500/Big_Walk/) — exploring noticeable objects, experimenting with tools/toys, gestures, and sound that changes with space. Bounce & Echo is a small single-device adaptation of those design ideas; it does not use Big Walk art, audio, or code.
- [Three.js r169 XR dragging](https://github.com/mrdoob/three.js/blob/r169/examples/webxr_xr_dragging.html) — reference for highlighting a grabbed object and restoring it on release. Our touchscreen input uses screen-space picking, not a tracked XR controller.
- [Three.js r169 AR hit-test](https://github.com/mrdoob/three.js/blob/r169/examples/webxr_ar_hittest.html) — reference for a clear ring-shaped aim marker. The trajectory marker predicts ball clearance. The separate spatial backend now also uses the WebXR hit-test API for actual ground placement.
- [Three.js r169 PositionalAudio](https://github.com/mrdoob/three.js/blob/r169/src/audio/PositionalAudio.js) and [orientation example](https://github.com/mrdoob/three.js/blob/r169/examples/webaudio_orientation.html) — reference for HRTF panning and distance attenuation. Our synthesized chirps use native Web Audio nodes in camera-relative coordinates. Sources inspected at commit `37d6f280a5cd642e801469bb048f52300d31258e` (MIT).
- [Enva-XR LightProbe](https://github.com/tentone/enva-xr/blob/main/src/object/LightProbe.ts) — reviewed light matching as a way to make a model sit more naturally in camera AR. Our version uses bounded camera-luminance matching, while Enva-XR uses WebXR light estimates. Source blob inspected: `03adc149a31ef1e30d74edc6ebc06ce7f55fadf2`.
- [pinball-xr TableAudio](https://github.com/patrick-s-young/pinball-xr/blob/main/src/audio/TableAudio.js) — reviewed position-, speed-, and event-dependent collision audio. Our sounds remain synthesized and use the existing native Web Audio panners. Source blob inspected: `ec8fcb197743a071fd555499e783d03d15f4d318`.
- [A-Frame Physics spring example](https://github.com/c-frame/aframe-physics-system/blob/master/examples/cannon/spring.html) and [grab component](https://github.com/c-frame/aframe-physics-system/blob/master/examples/components/grab.js) — reviewed damping/stiffness and distinct grab/release states. The ring uses a small analytic damped spring in `physics.js`, rather than an added physics-engine dependency. Source blobs inspected: `b4038fb1f3d2f57b721e15929fab513be0a391e4` and `9f12d774c610cb6be9bbb1f25d2631ef0cf7ab1f`.
- [AR.js GPS click example](https://github.com/AR-js-org/AR.js/blob/master/aframe/examples/location-based/click-places/index.html) — location-based entities and screen interaction.
- [fcor/arjs-gestures](https://github.com/fcor/arjs-gestures) — reference for translating touch start/move/end into AR object manipulation. The throw controls here use custom Pointer Events and a Three.js raycaster.
- [A-Frame raycaster documentation](https://aframe.io/docs/1.6.0/components/raycaster.html) — picking 3D objects from a screen position.
- [Device orientation reference](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent) and [geolocation heading reference](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/heading) — compass/motion and true-north walking-direction inputs for the sound trail.
- [AR.js location documentation](https://ar-js-org.github.io/AR.js-Docs/location-based/) — GPS placement, device orientation, and sensor limitations.

The sound trail, toy physics, reward instrument, generated streamers, and synthesized calls are implemented for this project. Upstream runtime sources and licenses are listed in `vendor/NOTICE.txt`.

## Verification

Run `node --test tests/*.test.cjs`. Tests cover navigation, ball and pendulum physics, model buffers, camera races, backend selection, floor-vs-wall hits, stable placement while the viewer moves, tracking loss, and late session cleanup. Sensor/session tests use mocks; they do not verify physical tracking accuracy.

Earlier browser checks verified the three game mechanics before the spatial backend change. Current cloud browser QA is limited: WebGL is disabled in that browser, and the provided preview URL is HTTP, so actual camera/WebXR rendering cannot be verified there. Real phone testing on the HTTPS Pages URL is required for the revised spatial integration, ground alignment, tracking recovery, and touch operation in an immersive session.

Spatial references: [WebXR Hit Test](https://immersive-web.github.io/hit-test/), [DOM Overlays](https://immersive-web.github.io/dom-overlays/), [A-Frame WebXR](https://aframe.io/docs/1.6.0/components/webxr.html), and [AR.js marker tracking](https://ar-js-org.github.io/AR.js-Docs/marker-based/).
