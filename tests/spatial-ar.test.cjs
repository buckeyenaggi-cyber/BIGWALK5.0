const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
// Sensor/session fakes, not a claim of hardware tracking validation.
class Events{constructor(){this.events={}}addEventListener(n,f){(this.events[n]??=new Set()).add(f)}removeEventListener(n,f){this.events[n]?.delete(f)}emit(n){this.events[n]?.forEach(f=>f())}}
class Vector3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}set(x,y,z){Object.assign(this,{x,y,z});return this}setFromMatrixPosition(m){return this.set(m.e[12],m.e[13],m.e[14])}transformDirection(m){const a=m.e;return this.set(a[4],a[5],a[6])}}
class Matrix4{fromArray(e){this.e=e;return this}}
class Resource{rotateX(){return this}dispose(){this.disposed=true}}
class Mesh{constructor(geometry,material){Object.assign(this,{geometry,material,position:new Vector3()})}}
function setup(mode='webxr'){
 const context={window:{AFRAME:{THREE:{Vector3,Matrix4,Mesh,RingGeometry:Resource,MeshBasicMaterial:Resource,DoubleSide:2}}},module:{exports:{}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../spatial-ar.js'),'utf8'),context);
 const marker=new Events();marker.object3D={visible:false};
 const xr=new Events(),session=new Events(),tracking=[],errors=[];
 session.domOverlayState={type:'screen'};session.visibilityState='visible';session.requestReferenceSpace=async()=>({});session.end=async()=>{session.ended=true};
 const source={cancels:0,cancel(){this.cancels++}};session.requestHitTestSource=async()=>source;
 xr.getSession=()=>session;xr.getReferenceSpace=()=>({});
 const objects=new Set(),scene={renderer:{xr},querySelector:()=>marker,object3D:{add:o=>objects.add(o),remove:o=>objects.delete(o)}};
 const field={visible:true,position:new Vector3(),rotation:{set(x,y,z){Object.assign(this,{x,y,z})}},updateWorldMatrix(){}};
 const controller=new context.module.exports.SpatialAR({scene,field,mode,onTracking:(...v)=>tracking.push(v),onError:e=>errors.push(e)});
 const matrix=(x=0,y=0,z=0,up=1)=>[1,0,0,0,0,up,0,0,0,0,1,0,x,y,z,1];
 const hit=m=>({getPose:()=>({transform:{matrix:m}})});
 return{api:context.module.exports,controller,field,marker,xr,session,tracking,errors,source,objects,matrix,hit};
}
test('real AR is the default on every device; practice requires explicit selection',()=>{
 const {api}=setup();assert.equal(api.choose(),'marker');assert.equal(api.choose({immersive:true}),'webxr');assert.equal(api.choose({immersive:true,marker:true}),'marker');assert.equal(api.choose({practice:true,immersive:true}),'practice');
});
test('marker loss hides objects and reacquisition never moves the field origin',()=>{
 const {controller:c,marker,field,tracking}=setup('marker');assert.equal(field.visible,false);
 field.position.set(1,0,2);marker.object3D.visible=true;c.tick();assert.equal(field.visible,true);assert.equal(c.placed,true);
 marker.object3D.visible=false;c.tick();assert.equal(field.visible,false);assert.equal(c.tracked,false);
 marker.object3D.visible=true;c.tick();assert.equal(c.tracked,true);assert.deepEqual({...field.position},{x:1,y:0,z:2});assert.equal(tracking.length,3);
 c.dispose();marker.emit('markerLost');assert.equal(tracking.length,3);
});
test('floor placement rejects walls and stale hits, then stays fixed while the viewer moves',async()=>{
 const {controller:c,field,session,hit,matrix,source}=setup();await c.setupSession();
 const frame={getViewerPose:()=>({}),getHitTestResults:()=>[hit(matrix(8,0,9,0))]};c.tick(frame);assert.equal(c.pose,null);assert.equal(c.place({}),false);
 frame.getHitTestResults=()=>[hit(matrix(1,.2,-3))];c.tick(frame);assert.equal(c.reticle.visible,true);
 frame.getHitTestResults=()=>[];c.tick(frame);assert.equal(c.pose,null);assert.equal(c.reticle.visible,false);
 frame.getHitTestResults=()=>[hit(matrix(1,.2,-3))];c.tick(frame);
 assert.equal(c.place({getWorldPosition:v=>v.set(1,1.6,0)}),true);assert.equal(field.visible,true);assert.equal(source.cancels,1);
 frame.getHitTestResults=()=>[hit(matrix(100,100,100))];c.tick(frame);assert.deepEqual({...field.position},{x:1,y:.2,z:-3});assert.equal(c.place({}),false);
 frame.getViewerPose=()=>null;c.tick(frame);assert.equal(field.visible,false);frame.getViewerPose=()=>({});c.tick(frame);assert.equal(field.visible,true);
 c.dispose();assert.equal(session.ended,true);
});
test('closing while hit-test permission is pending cancels the late source',async()=>{
 const {controller:c,session,source}=setup();let resolve,requested;const started=new Promise(r=>requested=r);
 session.requestHitTestSource=()=>{requested();return new Promise(r=>resolve=r)};const opening=c.setupSession();await started;c.dispose();resolve(source);await opening;
 assert.equal(source.cancels,1);assert.equal(c.hitSource,null);
});
test('an AR session without touchscreen overlay does not become a noninteractive viewer',async()=>{
 const {controller:c,session,errors}=setup();session.domOverlayState=null;await c.setupSession();assert.equal(session.ended,true);assert.equal(errors.length,1);assert.equal(c.tracked,false);
});
