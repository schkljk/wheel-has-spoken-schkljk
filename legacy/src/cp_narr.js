// ---------- Claude narration (only where the viewer supports it) ----------
let sampleP=null;
function getSample(){
  if(!sampleP){
    sampleP=(window.claude&&typeof window.claude.use==='function')?Promise.resolve(window.claude.use('sample')).catch(()=>null):Promise.resolve(null);
  }
  return sampleP;
}
function buildSummary(f){
  const parts=[`${fullName(f)}: ${f.size.n} ${f.race.n}${f.rsub?' ('+f.rsub.n+')':''}, ${f.arch.n}${f.asub?' ('+f.asub.n+')':''}.`,`Backstory: ${f.back.n}${f.reinc?', reincarnation of '+f.reinc.n:''}.`,`Strength ${f.str.n}, speed ${f.spd.n}, durability ${f.dur.n}, IQ ${f.iq.n}.`,`Weapon: ${f.weapon.n} (${f.wm.n}). Power: ${f.power.n}${f.power.k!=='none'?' ('+f.pm.n+')':''}. Enchantment: ${f.ench.n}. Weakness: ${f.weak.n}. Chaos factor: ${f.chaos.n}. Signature move: ${ULTS[f.arch.k]}.`];
  const s=synOf(f);if(s.length)parts.push('Synergies: '+s.map(x=>x.n).join(', ')+'.');
  return parts.join(' ');
}
function plain(html){const d=document.createElement('div');d.innerHTML=html;return d.textContent;}
async function narrate(btn){
  const s=await getSample();if(!s){btn.remove();return;}
  btn.disabled=true;
  const {A:FA,B:FB,w,ev}=lastFight;
  let lines=ev.map(e=>plain(e.html)+(e.d!=null&&e.cls!=='heal'?` (${e.d} dmg)`:'')+(e.pills.length?` [${e.pills.join(', ')}]`:''));
  if(lines.length>30)lines=lines.slice(0,10).concat(['…'],lines.slice(-16));
  const prompt=`You narrate fights for a chaotic, meme-heavy fantasy "spin the wheel" battle game. Write a punchy recap of this fight in 3 or 4 short sentences. Be funny and dramatic, roast the loser a little, and call out the turning point. Use at most two emoji, chosen from 💀 👹 😭 🔥. Plain text only: no lists, no headings, no quotation marks around the recap.

Fighter 1 (the player): ${buildSummary(FA)}
Fighter 2: ${buildSummary(FB)}

What happened, in order:
${lines.map(l=>'- '+l).join('\n')}

Winner: ${w===0?FA.name:FB.name}.`;
  const box=$('#narr');box.innerHTML='<span class="muted">Claude is watching the replay…</span>';
  try{
    const out=await s(prompt,{modelTier:'quick',onText:({text})=>{box.textContent=text;}});
    box.textContent=out&&out.text?out.text:box.textContent;
    btn.remove();
  }catch(e){
    const code=e&&e.code;
    if(code==='not_granted'){box.innerHTML='<span class="muted">Narration needs permission to ask Claude. You can allow it from this page\'s permissions menu.</span>';btn.remove();}
    else if(code==='rate_limited'){box.innerHTML='<span class="muted">The narrator needs a breather. Try again in a minute.</span>';btn.disabled=false;}
    else{box.innerHTML='<span class="muted">The narration didn\'t come through. Try again.</span>';btn.disabled=false;}
  }
}

