/* 声音寻路用的纯计算：米、真北角度；浏览器和 Node 测试共用。 */
(function(root) {
  'use strict';
  const RAD = Math.PI / 180, EARTH = 6371000;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const wrap = a => ((a % 360) + 360) % 360;
  const angle = a => wrap(a + 180) - 180;
  function distance(a, b) {
    const h = Math.sin((b.lat-a.lat)*RAD/2)**2 + Math.cos(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.sin((b.lon-a.lon)*RAD/2)**2;
    return 2*EARTH*Math.asin(Math.sqrt(clamp(h,0,1)));
  }
  function bearing(a,b) {
    const dl=(b.lon-a.lon)*RAD, p=a.lat*RAD, q=b.lat*RAD;
    return wrap(Math.atan2(Math.sin(dl)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(dl))/RAD);
  }
  function offset(point,heading,metres) {
    const d=metres/EARTH, h=heading*RAD, p=point.lat*RAD, l=point.lon*RAD;
    const q=Math.asin(Math.sin(p)*Math.cos(d)+Math.cos(p)*Math.sin(d)*Math.cos(h));
    return {lat:q/RAD,lon:(l+Math.atan2(Math.sin(h)*Math.sin(d)*Math.cos(p),Math.cos(d)-Math.sin(p)*Math.sin(q)))/RAD};
  }
  function trail(start,target) {
    const d=distance(start,target), heading=bearing(start,target);
    const count=d>50?3:d>25?2:1;
    return Array.from({length:count},(_,i)=>i===count-1?{...target}:offset(start,heading,d*(i+1)/count));
  }
  function levels(metres,relativeHeading) {
    const proximity=.18+.72/(1+Math.pow(Math.max(0,metres)/18,1.2));
    return [-70,0,70].map(direction=>{
      const alignment=Math.max(0,Math.cos(angle(relativeHeading-direction)*RAD));
      return .025+proximity*(.07+.93*Math.pow(alignment,4));
    });
  }
  function reached(point,goal,accuracy,previousAt,now) {
    return accuracy<=25 && distance(point,goal)<=12 && (previousAt===null || now-previousAt>=650);
  }
  const api={distance,bearing,offset,trail,levels,wrap,angle,reached};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.BeaconNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:window);
