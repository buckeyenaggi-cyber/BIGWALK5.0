const test=require('node:test'),assert=require('node:assert/strict'),N=require('../navigation.js');
const origin={lat:40,lon:-83};
test('navigation uses true north bearings and metre distances',()=>{
 for(const heading of [0,90,180,270]){const point=N.offset(origin,heading,70);assert.ok(Math.abs(N.distance(origin,point)-70)<.001);assert.ok(Math.abs(N.angle(N.bearing(origin,point)-heading))<.001)}
});
test('sound gets louder as the same direction gets closer',()=>{
 for(const direction of [-70,0,70]){const far=N.levels(80,direction),near=N.levels(9,direction);near.forEach((v,i)=>assert.ok(v>far[i]));assert.ok(Math.max(...near)<=1)}
});
test('left, ahead and right probes give different directional clues',()=>{
 for(const [bearing,index] of [[-70,0],[0,1],[70,2]]){const levels=N.levels(30,bearing);assert.equal(levels.indexOf(Math.max(...levels)),index)}
 const behind=N.levels(30,180);assert.ok(behind[1]<N.levels(30,0)[1]);assert.equal(N.angle(350),-10);
});
test('a trail ends at the landmark without forcing detours near it',()=>{
 const target=N.offset(origin,0,72),route=N.trail(origin,target);assert.equal(route.length,3);assert.deepEqual(route.at(-1),target);assert.ok(Math.abs(N.distance(origin,route[0])-24)<.001);assert.equal(N.trail(N.offset(target,180,10),target).length,1);
});
test('discovery rejects noisy or too-rapid GPS confirmations',()=>{
 const target=N.offset(origin,0,4);assert.equal(N.reached(origin,target,45,null,1000),false);assert.equal(N.reached(origin,target,5,900,1000),false);assert.equal(N.reached(origin,target,5,1000,1800),true);assert.equal(N.reached(origin,N.offset(origin,0,50),5,null,1000),false);
});
