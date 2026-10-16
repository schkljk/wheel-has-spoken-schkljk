// ---------- juicier effects ----------
const TINT_COL={fire:'#FF7A2F',ice:'#8FE7FF',lightning:'#FFE14D',water:'#3D8BFF',shadow:'#6A1B9A',light:'#FFF3B0',poison:'#76FF03',gravity:'#9C6BFF',mind:'#FF4FD8',wind:'#CFF4FF',plant:'#66BB6A',sonic:'#FFD180',time:'#CFD8DC',reality:'#FF4F8B',arcane:'#B388FF',ult:'#FFFFFF'};
// small dots that burst outward and fall
function particles(x,y,color,n,spread){
  if(RM)return;const layer=document.getElementById('fxl');if(!layer)return;
  for(let i=0;i<n;i++){
    const p=document.createElement('i');p.className='pt';p.style.left=x+'px';p.style.top=y+'px';
    const sz=3+Math.random()*5;p.style.width=p.style.height=sz+'px';p.style.background=Array.isArray(color)?pick(color):color;
    layer.appendChild(p);
    const ang=Math.random()*Math.PI*2,dist=(spread||40)*(0.5+Math.random()),dx=Math.cos(ang)*dist,dy=Math.sin(ang)*dist-10;
    A(p,[{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.9)`,opacity:1,offset:.6},{transform:`translate(calc(-50% + ${dx*1.15}px),calc(-50% + ${dy+26}px)) scale(.3)`,opacity:0}],{duration:520+Math.random()*260,easing:'cubic-bezier(.2,.7,.4,1)'}).then(()=>p.remove());
  }
}
// an expanding shock ring
function ring(x,y,color,size){
  if(RM)return;const r=spawn('ringfx','',x,y);r.style.borderColor=color||'#fff';
  A(r,[{transform:'translate(-50%,-50%) scale(.2)',opacity:.9},{transform:`translate(-50%,-50%) scale(${size||1.6})`,opacity:0}],{duration:420,easing:'ease-out'}).then(()=>r.remove());
}
// freeze-frame on big hits so they land harder
function hitStop(ms){return RM?Promise.resolve():wait(ms);}
// squash before a move (anticipation)
function windUp(i,sp){return A(bodyEl(i),[{transform:'scale(1,1)'},{transform:'scale(1.08,.88)'},{transform:'scale(1,1)'}],{duration:180*sp,easing:'ease-in-out'});}
function knockback(i,amt,sp){const dir=i===0?-1:1;return A(ftrEl(i),[{transform:'translateX(0)'},{transform:`translateX(${dir*amt}px)`,offset:.35},{transform:'translateX(0)'}],{duration:360*sp,easing:'cubic-bezier(.2,.8,.3,1)'});}
function confetti(x,y,n){particles(x,y,['#FFB627','#FF4F8B','#3DD6C6','#B388FF','#FFFFFF'],n||26,90);}
// ---------- battle animations ----------
function impact(e,a){
  const sp=SPF(),t=a.to,big=a.crit||a.t==='ult';
  applySnap(e);
  knockback(t,big?26:12,sp);
  if(big&&!RM)A(stageEl(),[{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:320*sp,easing:'cubic-bezier(.2,.8,.3,1)'});
  A(bodyEl(t),[{filter:'brightness(1)',transform:'scale(1,1)'},{filter:'brightness(2.4)',transform:'scale(.9,1.08)'},{filter:'brightness(1)',transform:'scale(1,1)'}],{duration:280*sp});
  const c=ctr(t);
  const col=TINT_COL[a.tint]||(a.kind==='melee'?'#FFE082':'#FFFFFF');
  particles(c.x,c.y-6,[col,'#FFFFFF'],big?20:10,big?70:44);
  ring(c.x,c.y-6,col,big?2.4:1.5);
  const burst=spawn('fxe',a.kind==='power'||a.kind==='ult'?a.fx:'💥',c.x+(a.by===0?-8:8),c.y-6,a.t==='ult'?64:40);
  A(burst,[{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:.5},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:380*sp}).then(()=>burst.remove());
  let dy=0;
  if(e.d!=null){floatAt(t,'−'+e.d,big?'crit':'',dy);dy+=26;}
  if(a.crit){floatAt(t,'Crit!','crit',dy);dy+=26;}
  if(a.weak){floatAt(t,'Weak spot!','weak',dy);dy+=22;}
  if(a.combo){floatAt(t,a.combo+'!','crit',dy);dy+=26;}
  if(a.broke){floatAt(t,'Guard broken','info',dy);dy+=22;}
  if(a.guarded)floatAt(t,'Guarded','info',dy);
  if(a.tint)tintFlash(a.tint,440*sp);
  if(big)shakeEl(stageEl(),a.t==='ult'?10:6,380*sp);
  thud(big);if(big)buzz(30);
}
async function animMelee(e,a){
  const sp=SPF(),dir=a.by===0?1:-1,A0=ctr(a.by),B0=ctr(a.to);
  const dist=Math.max(0,Math.abs(B0.x-A0.x)-80);
  await windUp(a.by,sp);
  const lunge=A(ftrEl(a.by),[{transform:'translateX(0)'},{transform:`translateX(${dir*dist}px)`,offset:.45},{transform:`translateX(${dir*dist}px)`,offset:.6},{transform:'translateX(0)'}],{duration:600*sp,easing:'ease-in-out'});
  armTo(a.by,[0,-85,60,0],600*sp);
  await wait(300*sp);
  impact(e,a);
  if(a.crit)await hitStop(110);
  await lunge;await wait(150*sp);
}
async function animRanged(e,a){
  const sp=SPF(),pw=a.kind==='power';
  armTo(a.by,pw?[0,-125,-125,0]:[0,-25,-25,0],(pw?640:440)*sp);
  if(pw)A(bodyEl(a.by),[{filter:'brightness(1)'},{filter:'brightness(1.7)'},{filter:'brightness(1)'}],{duration:340*sp});
  await windUp(a.by,sp);
  if(pw){const c=ctr(a.by);particles(c.x,c.y,TINT_COL[a.tint]||'#FFFFFF',8,26);}
  await projectile(a.by,a.to,a.fx,(pw?460:340)*sp,{size:pw?40:28,arc:pw?26:10,spin:a.spin,trail:TINT_COL[a.tint]||'#FFFFFF'});
  impact(e,a);if(a.crit)await hitStop(110);await wait(320*sp);
}
async function animUlt(e,a){
  const sp=SPF();
  showBanner(a.name,1200*sp,false);
  armTo(a.by,[0,-150,-150,70,0],1100*sp);
  A(bodyEl(a.by),[{transform:'scale(1)'},{transform:'scale(1.25)',offset:.6},{transform:'scale(1)'}],{duration:720*sp});
  tintFlash('ult',520*sp);
  [392,523,659,880].forEach((f,i)=>beep(f,0.14,'sawtooth',0.04,i*0.06));
  await wait(640*sp);
  {const c=ctr(a.by);particles(c.x,c.y,['#FFFFFF',TINT_COL[a.tint]||'#FFB627'],18,60);}
  await projectile(a.by,a.to,a.fx,380*sp,{size:64,arc:34,trail:TINT_COL[a.tint]||'#FFB627'});
  impact(e,a);await hitStop(160);await wait(480*sp);
}
async function animMiss(e,a){
  const sp=SPF(),dir=a.by===0?1:-1;
  if(a.kind==='melee'){
    const A0=ctr(a.by),B0=ctr(a.to);const dist=Math.max(0,Math.abs(B0.x-A0.x)-100);
    A(ftrEl(a.by),[{transform:'translateX(0)'},{transform:`translateX(${dir*dist}px)`,offset:.5},{transform:'translateX(0)'}],{duration:540*sp,easing:'ease-in-out'});
    armTo(a.by,[0,-85,60,0],540*sp);
    await wait(230*sp);
  }else{armTo(a.by,[0,-60,0],440*sp);projectile(a.by,a.to,a.fx,340*sp,{size:a.kind==='power'?40:28,arc:20});await wait(230*sp);}
  A(ftrEl(a.to),[{transform:'translate(0,0)'},{transform:`translate(${dir*30}px,-32px)`,offset:.4},{transform:'translate(0,0)'}],{duration:440*sp,easing:'ease-out'});
  applySnap(e);floatAt(a.to,'Miss','info');beep(700,0.05,'triangle',0.02);
  await wait(520*sp);
}
async function animGuard(e,a){
  const sp=SPF();
  armTo(a.on,[0,-50,-50,0],760*sp);
  popEmoji(a.on,'🛡️',0,760*sp,a.on===0?44:-44);
  applySnap(e);floatAt(a.on,'Guard','info');beep(520,0.1,'triangle',0.04);
  await wait(640*sp);
}
async function animSkip(e,a){
  const sp=SPF();
  popEmoji(a.on,a.fx||'💤','top',900*sp);
  A(bodyEl(a.on),[{transform:'rotate(0deg)'},{transform:'rotate(-8deg)'},{transform:'rotate(8deg)'},{transform:'rotate(0deg)'}],{duration:600*sp});
  applySnap(e);beep(300,0.12,'triangle',0.03);
  await wait(760*sp);
}
async function animSelf(e,a){
  const sp=SPF();
  popEmoji(a.on,a.fx,'top',720*sp);
  await wait(200*sp);
  applySnap(e);shakeEl(ftrEl(a.on),8,320*sp);
  A(bodyEl(a.on),[{filter:'brightness(1)'},{filter:'brightness(2.2)'},{filter:'brightness(1)'}],{duration:260*sp});
  if(a.tint)tintFlash(a.tint,420*sp);
  if(e.d!=null)floatAt(a.on,'−'+e.d,'');
  thud(false);await wait(560*sp);
}
async function animUno(e,a){
  const sp=SPF(),c=ctr(a.by);
  const card=spawn('fxe','🃏',c.x+(a.by===0?44:-44),c.y,40);
  await A(card,[{transform:'translate(-50%,-50%) rotateY(0deg) scale(.5)'},{transform:'translate(-50%,-50%) rotateY(360deg) scale(1.3)'}],{duration:460*sp});
  card.remove();floatAt(a.by,'Uno reverse!','info');
  await projectile(a.by,a.to,'💥',300*sp,{size:36});
  impact(e,Object.assign({},a,{kind:'power',fx:'🃏'}));await wait(360*sp);
}
async function animHeal(e,a){
  const sp=SPF();
  applySnap(e);
  A(bodyEl(a.on),[{filter:'brightness(1)'},{filter:'brightness(1.4) drop-shadow(0 0 12px #3DD6C6)'},{filter:'brightness(1)'}],{duration:620*sp});
  if(e.d!=null)floatAt(a.on,'+'+e.d,'heal');
  beep(660,0.1,'triangle',0.04);beep(990,0.12,'triangle',0.04,0.08);
  await wait(580*sp);
}
async function animDot(e,a){
  const sp=SPF();
  popEmoji(a.on,'🫧',30,640*sp);
  applySnap(e);tintFlash('poison',360*sp);
  if(e.d!=null)floatAt(a.on,'−'+e.d,'');
  await wait(560*sp);
}
async function animStatus(e,a){
  const sp=SPF();
  popEmoji(a.on,a.fx,'top',900*sp);
  if(a.tint)tintFlash(a.tint,460*sp);
  applySnap(e);beep(440,0.12,'triangle',0.04);
  await wait(760*sp);
}
async function animPet(e,a){
  const sp=SPF();
  await projectile(a.by,a.to,a.fx,520*sp,{size:38,arc:14});
  impact(e,Object.assign({},a,{kind:'melee'}));await wait(300*sp);
}
async function animTime(e,a){
  const sp=SPF(),st=stageEl(),r=st.getBoundingClientRect();
  const el=spawn('fxe','⏱️',r.width/2,r.height/2-14,64);
  A(el,[{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-50%) scale(1.2)',opacity:1,offset:.3},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.8},{transform:'translate(-50%,-50%) scale(1.4)',opacity:0}],{duration:900*sp}).then(()=>el.remove());
  A(st,[{filter:'grayscale(0)'},{filter:'grayscale(1) contrast(1.25)',offset:.2},{filter:'grayscale(1) contrast(1.25)',offset:.85},{filter:'grayscale(0)'}],{duration:1000*sp});
  armTo(a.by,[0,-140,-140,0],900*sp);
  applySnap(e);beep(1200,0.3,'sine',0.04);
  await wait(820*sp);
}
async function animRevive(e,a){
  const sp=SPF(),b=bodyEl(a.on);
  b.classList.remove('down');
  popEmoji(a.on,a.fx||'✨','top',820*sp);
  A(b,[{transform:'translateY(0) scale(1)'},{transform:'translateY(-18px) scale(1.12)'},{transform:'translateY(0) scale(1)'}],{duration:620*sp});
  applySnap(e);floatAt(a.on,'Back up!','info');
  [330,440,660].forEach((f,i)=>beep(f,0.12,'triangle',0.04,i*0.07));
  await wait(760*sp);
}
async function animKO(e,a){
  const sp=SPF();
  applySnap(e);
  await hitStop(180);
  bodyEl(a.on).classList.add('down');
  {const c=ctr(a.on);setTimeout(()=>particles(c.x,c.y+40,['#B0A49C','#D7CCC8','#8D6E63'],14,50),380*sp);}
  await wait(300*sp);
  showBanner('K.O.',700*sp,true);
  {const c=ctr(a.win);setTimeout(()=>confetti(c.x,c.y-30,30),200*sp);}
  armTo(a.win,[0,-160],500*sp);
  A(bodyEl(a.win),[{transform:'translateY(0)'},{transform:'translateY(-22px)'},{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}],{duration:800*sp});
  thud(true);
  await wait(900*sp);
}
async function animWin(e,a){
  const sp=SPF();
  applySnap(e);
  showBanner('Decision',700*sp,true);
  armTo(a.on,[0,-160],500*sp);
  A(bodyEl(a.on),[{transform:'translateY(0)'},{transform:'translateY(-22px)'},{transform:'translateY(0)'}],{duration:600*sp});
  await wait(800*sp);
}
async function animRead(e,a){
  const sp=SPF();
  applySnap(e);
  popEmoji(a.on,'🎯','top',700*sp);
  floatAt(a.on,'Read it!','weak');
  beep(880,0.08,'triangle',0.04);beep(1320,0.1,'triangle',0.04,0.07);
  await wait(560*sp);
}
async function playOne(e){
  const sp=SPF(),a=e.a;
  if(!a||RM){
    applySnap(e);
    if(a&&a.t==='ko')bodyEl(a.on).classList.add('down');
    if(a&&a.t==='revive')bodyEl(a.on).classList.remove('down');
    await wait((e.cls==='special'?650:420)*sp);return;
  }
  try{
    switch(a.t){
      case 'hit':if(a.kind==='melee')await animMelee(e,a);else await animRanged(e,a);break;
      case 'ult':await animUlt(e,a);break;
      case 'miss':await animMiss(e,a);break;
      case 'guard':await animGuard(e,a);break;
      case 'skip':await animSkip(e,a);break;
      case 'self':await animSelf(e,a);break;
      case 'uno':await animUno(e,a);break;
      case 'heal':await animHeal(e,a);break;
      case 'dot':await animDot(e,a);break;
      case 'status':await animStatus(e,a);break;
      case 'pet':await animPet(e,a);break;
      case 'timestop':await animTime(e,a);break;
      case 'revive':await animRevive(e,a);break;
      case 'ko':await animKO(e,a);break;
      case 'win':await animWin(e,a);break;
      case 'read':await animRead(e,a);break;
      case 'banner':applySnap(e);showBanner(a.text,1300*sp,false);await wait(1000*sp);break;
      case 'phase':{applySnap(e);const st=stageEl();st.classList.remove('phase2');void st.offsetWidth;st.classList.add('phase2');
        shakeEl(st,16,600*sp);const c=ctr(a.on);particles(c.x,c.y-10,['#FF5A5F','#F2B544','#FFFFFF'],30,90);ring(c.x,c.y-10,'#FF5A5F',3);
        A(bodyEl(a.on),[{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:600*sp});
        beep(110,0.5,'sawtooth',0.07);buzz([80,60,120]);
        showBanner(a.text||'Phase two',1500*sp,true);await wait(1300*sp);break;}
      default:applySnap(e);await wait(420*sp);
    }
  }catch(err){applySnap(e);}
}

