// ---------- sound + haptics ----------
let actx=null,lastTick=0;
function ac(){
  if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){actx=null}}
  if(actx&&actx.state==='suspended'){try{actx.resume()}catch(e){}}
  return actx;
}
function beep(freq,dur,type,vol,when){
  if(!soundOn)return;const a=ac();if(!a)return;
  try{
    const t=a.currentTime+(when||0);const o=a.createOscillator(),g=a.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(vol||0.04,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+0.02);
  }catch(e){}
}
function tick(heavy){const n=performance.now();if(n-lastTick<28)return;lastTick=n;beep(heavy?700:1500,heavy?0.06:0.025,'square',heavy?0.05:0.025);}
function landSound(q){
  if(q>=3)[523,659,784,1047].forEach((f,i)=>beep(f,0.18,'triangle',0.06,i*0.08));
  else if(q===0)[392,330,262].forEach((f,i)=>beep(f,0.22,'sawtooth',0.035,i*0.14));
  else [660,880].forEach((f,i)=>beep(f,0.12,'triangle',0.05,i*0.07));
}
const thud=big=>{beep(big?90:140,big?0.22:0.12,'square',0.06);};
function buzz(p){try{if(DB.haptics===false)return;if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}

// ---------- wheel drawing ----------
const QC=[['#525B6E','#465062'],['#5B4BB7','#4E40A3'],['#0E9F8E','#0B8A7B'],['#E8A93A','#D99A2B']];
const FONT='"Atkinson Hyperlegible",system-ui,sans-serif';
function drawWheel(cv,items,hi){
  const S=Math.round(cv.clientWidth)||300;
  const dpr=Math.min(3,window.devicePixelRatio||1);
  cv.width=S*dpr;cv.height=S*dpr;
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const R=S/2,rIn=R-11,TAU=Math.PI*2;
  const tot=items.reduce((a,b)=>a+b.w,0);
  c.clearRect(0,0,S,S);
  // brushed-gold rim
  const rim=c.createLinearGradient(0,0,S,S);rim.addColorStop(0,'#FBE3A6');rim.addColorStop(.45,'#C98F2E');rim.addColorStop(.55,'#F5D27A');rim.addColorStop(1,'#8C5E14');
  c.beginPath();c.arc(R,R,R-1,0,TAU);c.fillStyle=rim;c.fill();
  c.lineWidth=1.5;c.strokeStyle='#1A1328';c.stroke();
  const segs=[];let a=0;
  items.forEach((it,i)=>{
    const span=it.w/tot*TAU,a0=a,a1=a+span;segs.push([a0,a1]);
    c.beginPath();c.moveTo(R,R);c.arc(R,R,rIn,a0-Math.PI/2,a1-Math.PI/2);c.closePath();
    c.fillStyle=QC[it.q==null?1:it.q][i%2];c.fill();
    c.strokeStyle='rgba(255,246,234,.75)';c.lineWidth=1.5;c.stroke();
    a=a1;
  });
  items.forEach((it,i)=>{
    const [a0,a1]=segs[i],span=a1-a0,mid=(a0+a1)/2;
    const arc=span*rIn*0.6;if(arc<9)return;
    let fs=Math.min(15,Math.max(9,S/25),arc*0.8);
    const maxW=rIn*0.68;
    c.save();c.translate(R,R);c.rotate(mid-Math.PI/2);
    c.textAlign='right';c.textBaseline='middle';c.fillStyle=it.q===3?'#2A1A05':'#FFFFFF';
    const mk=it.mark==='up'?'▲ ':it.mark==='down'?'▼ ':'';
    let label=mk+(it.e?it.e+' ':'')+it.n;
    if(arc<fs*1.7&&it.e)label=mk+it.e;
    c.font=`700 ${fs}px ${FONT}`;
    while(c.measureText(label).width>maxW&&fs>10){fs-=1;c.font=`700 ${fs}px ${FONT}`;}
    while(c.measureText(label).width>maxW&&label.length>3){label=label.slice(0,-2)+'…';}
    c.fillText(label,rIn-9,0.5);
    c.restore();
  });
  if(hi!=null&&segs[hi]){
    const [h0,h1]=segs[hi];
    c.beginPath();c.moveTo(R,R);c.arc(R,R,rIn,h0-Math.PI/2,h1-Math.PI/2);c.closePath();
    c.fillStyle='rgba(255,255,255,.28)';c.fill();
    c.lineWidth=4;c.strokeStyle='#FFB627';c.stroke();
  }
  // a soft inner shadow gives the slices depth
  const sh=c.createRadialGradient(R,R,rIn*0.35,R,R,rIn);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.28)');
  c.beginPath();c.arc(R,R,rIn,0,TAU);c.fillStyle=sh;c.fill();
  const nb=28;
  for(let k=0;k<nb;k++){const ang=k/nb*TAU;c.beginPath();c.arc(R+Math.cos(ang)*(R-5.5),R+Math.sin(ang)*(R-5.5),2.6,0,TAU);c.fillStyle=k%2?'#FFB627':'#FF4F8B';c.fill();}
  // glossy dome: a soft highlight across the upper left
  const gl=c.createRadialGradient(R*0.6,R*0.45,R*0.05,R*0.7,R*0.6,R*1.05);gl.addColorStop(0,'rgba(255,255,255,.26)');gl.addColorStop(.45,'rgba(255,255,255,.06)');gl.addColorStop(1,'rgba(255,255,255,0)');
  c.beginPath();c.arc(R,R,rIn,0,TAU);c.fillStyle=gl;c.fill();
  return segs;
}

