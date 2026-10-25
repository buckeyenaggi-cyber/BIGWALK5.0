/* 空间定位与游戏分开：WebXR 地面命中或实体图案坐标，均不使用 GPS 摆放模型。 */
(function (root) {
  'use strict';
  const choose = ({ practice = false, marker = false, immersive = false } = {}) =>
    practice ? 'practice' : marker || !immersive ? 'marker' : 'webxr';
  class SpatialAR {
    constructor({ scene, field, mode, onTracking, onError, onEnd }) {
      this.scene = scene; this.field = field; this.mode = mode;
      this.onTracking = onTracking; this.onError = onError; this.onEnd = onEnd;
      this.T = root.AFRAME.THREE; this.listeners = []; this.disposed = false;
      this.placed = mode === 'practice'; this.tracked = this.placed; this.pose = null;
      if (mode === 'practice') return;
      field.visible = false;
      if (mode === 'marker') {
        this.marker = scene.querySelector('#world-marker');
        this.listen(this.marker, 'markerFound', () => this.setTracking(true));
        this.listen(this.marker, 'markerLost', () => this.setTracking(false));
      } else {
        const T = this.T;
        this.reticle = new T.Mesh(new T.RingGeometry(.12, .15, 40).rotateX(-Math.PI / 2),
          new T.MeshBasicMaterial({ color: 0xf3d7a3, side: T.DoubleSide, depthTest: false }));
        this.reticle.visible = false; this.reticle.renderOrder = 8; scene.object3D.add(this.reticle);
        this.listen(scene.renderer.xr, 'sessionstart', () => this.setupSession());
      }
    }
    listen(target, event, fn) { target.addEventListener(event, fn); this.listeners.push(() => target.removeEventListener(event, fn)); }
    setTracking(tracked) {
      this.tracked = tracked; if (tracked) this.placed = true;
      this.field.visible = tracked; this.onTracking?.(tracked, this.placed);
    }
    async setupSession() {
      const session = this.scene.renderer.xr.getSession(); this.session = session;
      this.listen(session, 'end', () => { this.hitSource?.cancel(); this.hitSource = null; if (!this.disposed) this.onEnd?.(); });
      this.listen(session, 'visibilitychange', () => { if (session.visibilityState !== 'visible') this.setTracking(false); });
      // DOM overlay carries the real touchscreen gestures; never substitute a noninteractive model viewer.
      if (!session.domOverlayState) { this.onError?.('This browser cannot show the touch controls in AR. Use the printed marker instead.'); await session.end(); return; }
      try {
        const viewer = await session.requestReferenceSpace('viewer');
        const source = await session.requestHitTestSource({ space: viewer });
        if (this.disposed || session !== this.session) { source.cancel(); return; }
        this.hitSource = source;
      } catch (_) { if (!this.disposed) this.onError?.('Ground tracking could not start. Close and reopen AR, or use the printed marker.'); }
    }
    tick(frame) {
      if(this.disposed)return;
      if(this.mode==='marker'){if(this.marker.object3D.visible!==this.tracked)this.setTracking(this.marker.object3D.visible);return;}
      if (this.mode !== 'webxr' || !frame) return;
      const space = this.scene.renderer.xr.getReferenceSpace(); if (!space) return;
      const viewer = frame.getViewerPose(space);
      if (this.placed) {
        if (!!viewer !== this.tracked) this.setTracking(!!viewer);
        return;
      }
      this.pose = null; this.reticle.visible = false;
      if (!viewer || !this.hitSource) return;
      for (const hit of frame.getHitTestResults(this.hitSource)) {
        const pose = hit.getPose(space); if (!pose) continue;
        const matrix = new this.T.Matrix4().fromArray(pose.transform.matrix);
        // Reject walls: the hit's local up vector must point approximately upwards.
        if (new this.T.Vector3(0, 1, 0).transformDirection(matrix).y < .9) continue;
        this.pose = pose; this.reticle.position.setFromMatrixPosition(matrix); this.reticle.visible = true; break;
      }
    }
    place(camera) {
      if (this.mode !== 'webxr' || this.placed || !this.pose) return false;
      const matrix = new this.T.Matrix4().fromArray(this.pose.transform.matrix);
      this.field.position.setFromMatrixPosition(matrix);
      const c = camera.getWorldPosition(new this.T.Vector3());
      this.field.rotation.set(0, Math.atan2(c.x - this.field.position.x, c.z - this.field.position.z), 0);
      this.field.updateWorldMatrix(true, true); this.reticle.visible = false;
      this.hitSource?.cancel(); this.hitSource = null;
      this.setTracking(true); return true;
    }
    dispose() {
      if (this.disposed) return; this.disposed = true;
      this.listeners.splice(0).forEach(remove => remove()); this.hitSource?.cancel(); this.hitSource = null;
      if (this.reticle) { this.scene.object3D.remove(this.reticle); this.reticle.geometry.dispose(); this.reticle.material.dispose(); }
      this.session?.end().catch(() => {}); this.session = null;
    }
  }
  const api = { choose, SpatialAR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BeaconSpatialAR = api;
})(typeof window !== 'undefined' ? window : globalThis);
