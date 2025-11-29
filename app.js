
(function(){
  const size = 6; const total = size*size; // 36 cells
  function indexToRC(idx){ const row = Math.floor(idx/size); const colInRow = idx % size; const col = (row % 2 === 0) ? colInRow : (size-1 - colInRow); return {r: row, c: col}; }
  function findIdxByRC(targetR, targetC){ for(let i=0;i<total;i++){ const rc = indexToRC(i); if(rc.r===targetR && rc.c===targetC) return i; } return 0; }

  const types = { START: 'start', FINISH: 'finish', GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze', GPAIR: 'gpair', THIEF_NET: 'thief-net', THIEF_SWORD: 'thief-sword', THIEF_HOOK: 'thief-hook', EMPTY: 'empty' };

  const GOLD = [3,7,12,18,27];
  const SILVER = [5,10,16,22,30];
  const BRONZE = [2,9,14,20,25];
  const GPAIR = [13,24];
  const THIEF_NET = [4,15,23,32];
  const THIEF_SWORD = [11,19,28,34];
  const THIEF_HOOK = [21,26];

  const HIDE_RC = [{r:0,c:0},{r:0,c:1}];
  const HIDE_IDX = HIDE_RC.map(p=> findIdxByRC(p.r,p.c));
  const START_IDX = findIdxByRC(0,2);

  // ---- SVG coin helpers (properly encoded to avoid AttValue errors) ----
  function makeDataUrl(svg){ return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg); }
  const SILVER_COIN = makeDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><radialGradient id="g" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#e9eef5"/><stop offset="100%" stop-color="#bfc9d8"/></radialGradient></defs><circle cx="48" cy="48" r="40" fill="url(#g)" stroke="#a9b4c2" stroke-width="4"/><circle cx="48" cy="48" r="30" fill="none" stroke="#dce2ea" stroke-width="4"/></svg>`);
  const BRONZE_COIN = makeDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><radialGradient id="g" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="#fff1e4"/><stop offset="40%" stop-color="#f0c39a"/><stop offset="100%" stop-color="#bf7a3a"/></radialGradient></defs><circle cx="48" cy="48" r="40" fill="url(#g)" stroke="#a0622e" stroke-width="4"/><circle cx="48" cy="48" r="30" fill="none" stroke="#f3d6b8" stroke-width="4"/></svg>`);

  const gridEl = document.getElementById('grid');
  const validIndices = []; for(let i=0;i<total;i++){ if(HIDE_IDX.includes(i)) continue; validIndices.push(i); }

  const board = validIndices.map(idx => {
    let type = types.EMPTY; let icon = '•';
    if(idx === START_IDX){ type = types.START; icon = '\uD83D\uDEA2'; }
    else if(idx === total-1){ type = types.FINISH; icon = '\uD83C\uDFC1'; }
    else if(GOLD.includes(idx)){ type = types.GOLD; icon = '\uD83E\uDE99'; }
    else if(SILVER.includes(idx)){ type = types.SILVER; icon = SILVER_COIN; }
    else if(BRONZE.includes(idx)){ type = types.BRONZE; icon = BRONZE_COIN; }
    else if(GPAIR.includes(idx)){ type = types.GPAIR; icon = '\uD83D\uDC51'; }
    else if(THIEF_NET.includes(idx)){ type = types.THIEF_NET; icon = '\uD83C\uDFA3'; }
    else if(THIEF_SWORD.includes(idx)){ type = types.THIEF_SWORD; icon = '\uD83D\uDDE1\uFE0F'; }
    else if(THIEF_HOOK.includes(idx)){ type = types.THIEF_HOOK; icon = '\uD83E\uDE9D'; }
    return { idx, type, icon };
  });

  gridEl.style.setProperty('--size', size);
  board.forEach(b => {
    const rc = indexToRC(b.idx);
    const cell = document.createElement('div');
    const rowClass = (rc.r % 2 === 0) ? 'path-even' : 'path-odd';
    cell.className = `cell ${rowClass} ${b.type}`;
    cell.dataset.idx = b.idx;
    cell.style.gridRowStart = rc.r + 1;
    cell.style.gridColumnStart = rc.c + 1;

    if(b.type === types.START){
      const icon = document.createElement('div'); icon.textContent = b.icon; icon.style.fontSize = '1em';
      const caption = document.createElement('div'); caption.className = 'caption'; caption.textContent = 'Start';
      cell.appendChild(icon); cell.appendChild(caption);
    } else {
      const icon = document.createElement('div');
      if (typeof b.icon === 'string' && b.icon.startsWith('data:image')) {
        const img = document.createElement('img'); img.src = b.icon; img.alt = 'coin'; img.style.width = '60%'; img.style.height = '60%'; img.style.objectFit = 'contain'; icon.appendChild(img);
      } else { icon.textContent = b.icon; }
      cell.appendChild(icon);
    }

    const currentIndexPos = validIndices.indexOf(b.idx);
    if(currentIndexPos !== -1 && currentIndexPos < validIndices.length - 1){
      const nextIdx = validIndices[currentIndexPos + 1];
      const nextRC = indexToRC(nextIdx);
      const dr = nextRC.r - rc.r, dc = nextRC.c - rc.c;
      const arrowEl = document.createElement('div'); arrowEl.className = 'arrow';
      let arrow = '➡️';
      if(dr === 0 && dc === 1) arrow = '➡️'; else if(dr === 0 && dc === -1) arrow = '⬅️'; else if(dr === 1 && dc === 0) arrow = '⬇️'; else if(dr === -1 && dc === 0) arrow = '⬆️';
      arrowEl.textContent = arrow; cell.appendChild(arrowEl);
    }

    gridEl.appendChild(cell);
  });

  let player = { name: '', pos: START_IDX, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: '', photoThumb: '' };
  const token = document.createElement('div'); token.className = 'token fallback';

  const nameIn = document.getElementById('playerName');
  const photoIn = document.getElementById('photoInput');
  const camStartBtn = document.getElementById('camStartBtn');
  const camSnapBtn = document.getElementById('camSnapBtn');
  const camVideo = document.getElementById('cam');
  const camCanvas = document.getElementById('camCanvas');
  const avatarImg = document.getElementById('avatarImg');
  const avatarSmall = document.getElementById('avatarSmall');
  const startBtn = document.getElementById('startBtn');
  const rollBtn = document.getElementById('rollBtn');
  const resetBtn = document.getElementById('resetBtn');
  const diceEl = document.getElementById('dice');
  const nameOut = document.getElementById('nameOut');
  const pointsOut = document.getElementById('points');
  const movesOut = document.getElementById('moves');
  const totalScoreOut = document.getElementById('totalScore');
  const gpairOut = document.getElementById('gpair');
  const posOut = document.getElementById('pos');
  const logEl = document.getElementById('log');
  const turnLogCard = document.getElementById('turnLogCard');
  const toggleLogBtn = document.getElementById('toggleLog');
  const winnerBox = document.getElementById('winner');
  const winName = document.getElementById('winName');
  const finalTotal = document.getElementById('finalTotal');
  const finalPoints = document.getElementById('finalPoints');
  const finalMoves = document.getElementById('finalMoves');
  const musicToggle = document.getElementById('musicToggle');
  const musicVol = document.getElementById('musicVol');
  const sfxVol = document.getElementById('sfxVol');
  const muteBtn = document.getElementById('muteBtn');
  const musicTheme = document.getElementById('musicTheme');

  class AudioManager {
    constructor(){ this.ctx = null; this.master = null; this.sfxGain = null; this.musicGain = null; this.musicInterval = null; this.victoryInterval = null; this.muted = false; this.theme = 'calm'; }
    ensure(){ if(this.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.sfxGain = this.ctx.createGain(); this.musicGain = this.ctx.createGain(); this.master.gain.value = 1.0; this.sfxGain.gain.value = 0.5; this.musicGain.gain.value = 0.75; this.sfxGain.connect(this.master); this.musicGain.connect(this.master); this.master.connect(this.ctx.destination); }
    setSfxVolume(v){ this.ensure(); this.sfxGain.gain.value = v; }
    setMusicVolume(v){ this.ensure(); this.musicGain.gain.value = v; }
    muteToggle(){ this.ensure(); this.muted = !this.muted; this.master.gain.value = this.muted ? 0 : 1; }
    setTheme(t){ this.theme = t; if(this.musicInterval){ this.stopMusic(); this.startMusic(); } }
    tone({freq=440, type='sine', time=0, duration=0.2, gain=0.3}){ this.ensure(); const ctx = this.ctx; const osc = ctx.createOscillator(); const g = this.ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + time); g.gain.setValueAtTime(0, ctx.currentTime + time); g.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration); osc.connect(g).connect(this.sfxGain); osc.start(ctx.currentTime + time); osc.stop(ctx.currentTime + time + duration + 0.05); }
    noise({time=0, duration=0.3, gain=0.2}){ this.ensure(); const ctx = this.ctx; const bufferSize = Math.max(1, Math.floor(duration * ctx.sampleRate)); const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const data = buffer.getChannelData(0); for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2 - 1) * 0.7; } const src = ctx.createBufferSource(); src.buffer = buffer; const g = this.ctx.createGain(); g.gain.value = gain; src.connect(g).connect(this.sfxGain); src.start(ctx.currentTime + time); }
    sfxStart(){ this.tone({freq: 660, duration: 0.12, gain: 0.32}); this.tone({freq: 880, time: 0.12, duration: 0.12, gain: 0.26}); }
    sfxDice(){ this.noise({duration: 0.22, gain: 0.18}); this.tone({freq: 220, type:'triangle', duration:0.08, gain:0.15}); }
sfxBronze(){ this.tone({freq: 740, duration: 0.12, gain: 0.25}); }
    sfxSilver(){ this.tone({freq: 880, duration: 0.14, gain: 0.28}); this.tone({freq: 1100, time:0.08, duration: 0.1, gain: 0.22}); }
    sfxGold(){ this.tone({freq: 988, duration: 0.16, gain: 0.3}); this.tone({freq: 1319, time:0.1, duration: 0.16, gain: 0.28}); }
    sfxGoldPair(){ this.tone({freq: 523, type:'square', duration: 0.18, gain:0.3}); this.tone({freq: 659, type:'square', time:0.1, duration: 0.18, gain:0.28}); this.tone({freq: 784, type:'square', time:0.2, duration: 0.18, gain:0.26}); }
    sfxThiefNet(){ this.tone({freq: 350, type:'sawtooth', duration: 0.2, gain: 0.22}); this.noise({duration: 0.2, gain:0.18}); }
    sfxThiefSword(){ this.noise({duration: 0.2, gain:0.2}); this.tone({freq: 180, type:'sawtooth', duration: 0.22, gain: 0.25}); }
    sfxThiefHook(){ this.tone({freq: 120, type:'sawtooth', duration: 0.28, gain: 0.28}); this.noise({duration: 0.28, gain:0.22}); }
    sfxWin(){ this.tone({freq: 659, duration:0.18, gain:0.3}); this.tone({freq: 784, time:0.12, duration:0.18, gain:0.3}); this.tone({freq: 987, time:0.24, duration:0.22, gain:0.3}); }
    startMusic(){ this.ensure(); if(this.musicInterval) return; let pattern; if(this.theme === 'adventure'){ pattern = [ {f:392,d:0.18},{f:494,d:0.18},{f:523,d:0.18},{f:659,d:0.22},{f:523,d:0.18},{f:494,d:0.18},{f:392,d:0.24} ]; } else if(this.theme === 'space'){ pattern = [ {f:261,d:0.24},{f:392,d:0.24},{f:523,d:0.28},{f:392,d:0.24},{f:261,d:0.28} ]; } else { pattern = [ {f:392,d:0.18},{f:440,d:0.18},{f:494,d:0.18},{f:587,d:0.22},{f:494,d:0.18},{f:440,d:0.18},{f:392,d:0.24} ]; } let i = 0; this.musicInterval = setInterval(()=>{ const ctx = this.ctx; const osc = ctx.createOscillator(); const g = this.ctx.createGain(); const step = pattern[i % pattern.length]; osc.type = 'sine'; osc.frequency.value = step.f; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + step.d); osc.connect(g).connect(this.musicGain); osc.start(); osc.stop(ctx.currentTime + step.d + 0.01); i++; }, 250); }
    stopMusic(){ if(this.musicInterval){ clearInterval(this.musicInterval); this.musicInterval = null; } }
    startVictoryMusic(){ this.ensure(); if(this.victoryInterval) return; this.stopMusic(); const pattern = [ {f:523,d:0.20,type:'square'},{f:659,d:0.20,type:'square'},{f:784,d:0.24,type:'square'},{f:659,d:0.20,type:'square'},{f:523,d:0.24,type:'square'} ]; let i = 0; this.victoryInterval = setInterval(()=>{ const ctx = this.ctx; const osc = this.ctx.createOscillator(); const g = this.ctx.createGain(); const step = pattern[i % pattern.length]; osc.type = step.type || 'sine'; osc.frequency.value = step.f; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + step.d); osc.connect(g).connect(this.musicGain); osc.start(); osc.stop(ctx.currentTime + step.d + 0.01); i++; }, 260); }
    stopVictoryMusic(){ if(this.victoryInterval){ clearInterval(this.victoryInterval); this.victoryInterval = null; } }
  }
  const audio = new AudioManager();

  function writeLog(msg){ const p = document.createElement('div'); p.textContent = msg; logEl.prepend(p); }
  function updateHUD(){ nameOut.textContent = player.name || '—'; pointsOut.textContent = player.points; movesOut.textContent = player.moves; totalScoreOut.textContent = (player.points + player.moves); gpairOut.textContent = player.hasGoldPair ? '✅' : '❌'; posOut.textContent = player.pos; }
  function moveTokenTo(idx){ const cell = document.querySelector(`.cell[data-idx='${idx}']`); if(cell){ cell.appendChild(token); token.style.transform = 'scale(1.0)'; } }

  function applyCellEffect(idx){ const b = board.find(x=>x.idx===idx); if(!b) return; switch(b.type){
      case types.GOLD: player.points += 3; audio.sfxGold(); writeLog(`🪙 Gold! +3 (points ${player.points})`); break;
      case types.SILVER: player.points += 2; audio.sfxSilver(); writeLog(`Silver coin! +2 (points ${player.points})`); break;
      case types.BRONZE: player.points += 1; audio.sfxBronze(); writeLog(`Bronze coin! +1 (points ${player.points})`); break;
      case types.GPAIR: player.points += 6; player.hasGoldPair = true; audio.sfxGoldPair(); writeLog(`👑 Gold Pair! +6 and you now hold a Gold Pair`); break;
      case types.THIEF_NET: player.points -= 2; audio.sfxThiefNet(); writeLog(`🎣 Net Thief! −2 (points ${player.points})`); break;
      case types.THIEF_SWORD: player.points -= 3; audio.sfxThiefSword(); writeLog(`🗡️ Sword Thief! −3 (points ${player.points})`); break;
      case types.THIEF_HOOK: player.points -= 16; audio.sfxThiefHook(); writeLog(`🪝 Hook Thief! −16 (points ${player.points})`); break;
      case types.FINISH:
        if(player.hasGoldPair){ player.finished = true; audio.sfxWin(); audio.startVictoryMusic(); const total = player.points + player.moves; writeLog(`🏆 ${player.name || 'Player'} wins! Final total: ${total}`); winName.textContent = player.name || 'Player'; finalPoints.textContent = player.points; finalMoves.textContent = player.moves; finalTotal.textContent = total; winnerBox.classList.remove('hidden'); saveScore(); renderScores(); }
        else { writeLog('🏁 Finish reached, but no Gold Pair yet—keep going!'); }
        break;
    }
    if(player.points < 0){ writeLog('🔁 Points below 0! Back to START and reset to 0.'); player.points = 0; player.pos = START_IDX; moveTokenTo(START_IDX); }
  }

  function rollDice(){ audio.ensure(); diceEl.classList.add('roll'); audio.sfxDice(); const roll = 1 + Math.floor(Math.random()*6); const faces = ['⚀','⚁','⚂','⚃','⚄','⚅']; setTimeout(()=>{ diceEl.textContent = faces[roll-1]; diceEl.classList.remove('roll'); }, 500); return roll; }

 
  let stepMs = 1100; const speedSel = document.getElementById('speedSel'); if(speedSel){ stepMs = parseInt(speedSel.value, 10); speedSel.addEventListener('change', (e)=>{ stepMs = parseInt(e.target.value, 10); }); }

  function animateMove(from, steps, onDone){ let current = from; let remaining = steps; const timer = setInterval(()=>{ if(current < total-1){ current = current + 1; } player.pos = current; moveTokenTo(current); remaining--; if(remaining <= 0){ clearInterval(timer); onDone && onDone(); } }, stepMs); }

  function makeThumb(dataUrl, size=64){ return new Promise((resolve)=>{ const img = new Image(); img.onload = ()=>{ const c = document.createElement('canvas'); const ctx = c.getContext('2d'); c.width = size; c.height = size; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size); const minSide = Math.min(img.width, img.height); const sx = (img.width - minSide)/2; const sy = (img.height - minSide)/2; ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size); resolve(c.toDataURL('image/jpeg', 0.7)); }; img.src = dataUrl; }); }

  const defaultAvatar = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="46" fill="#FFE082" stroke="#FBC02D" stroke-width="4"/><circle cx="34" cy="40" r="6" fill="#5D4037"/><circle cx="62" cy="40" r="6" fill="#5D4037"/><path d="M28 60 C38 74,58 74,68 60" fill="none" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/></svg>`);

  // File upload → avatar + token
  if(photoIn){ photoIn.addEventListener('change', async (evt)=>{ const file = evt.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = async (e)=>{ const url = e.target.result; player.photo = url; player.photoThumb = await makeThumb(url, 64); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); }; reader.readAsDataURL(file); }); }

  // Camera capture (front camera)
  if(camStartBtn){ camStartBtn.addEventListener('click', async ()=>{ try{ const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false }); camVideo.srcObject = stream; camVideo.style.display = 'block'; camSnapBtn.style.display = 'inline-block'; } catch(err){ writeLog('⚠️ Camera access failed: ' + err.message); } }); }
  if(camSnapBtn){ camSnapBtn.addEventListener('click', async ()=>{ const w = camCanvas.width, h = camCanvas.height; const ctx = camCanvas.getContext('2d'); ctx.drawImage(camVideo, 0, 0, w, h); const url = camCanvas.toDataURL('image/jpeg', 0.9); player.photo = url; player.photoThumb = await makeThumb(url, 64); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); writeLog('📸 Photo captured from camera.'); }); }

  const scoresBody = document.getElementById('scoresBody'); const clearScoresBtn = document.getElementById('clearScores'); const copyScoresBtn = document.getElementById('copyScores');
  function saveScore(){ const score = { name: player.name || 'Player', points: player.points, rolls: player.moves, total: (player.points + player.moves), goldPair: player.hasGoldPair, photo: (player.photoThumb || defaultAvatar), date: new Date().toLocaleString() }; const key = 'th_scores'; const arr = JSON.parse(localStorage.getItem(key) || '[]'); arr.push(score); arr.sort((a,b)=> b.total - a.total); localStorage.setItem(key, JSON.stringify(arr.slice(0, 20))); }
  function renderScores(){ const key = 'th_scores'; const arr = JSON.parse(localStorage.getItem(key) || '[]'); if(scoresBody){ scoresBody.innerHTML = ''; arr.forEach((s)=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td class='photo-cell'>${s.photo ? `<img src='${s.photo}' class='avatar sm' alt='photo'/>` : ''}</td><td>${s.name}</td><td>${s.points}</td><td>${s.rolls}</td><td>${s.total}</td><td>${s.goldPair?'✅':'❌'}</td><td>${s.date}</td>`; scoresBody.appendChild(tr); }); } }

  function placeStart(){ moveTokenTo(START_IDX); }
  placeStart();

  if(startBtn){ startBtn.addEventListener('click', ()=>{ audio.ensure(); audio.stopVictoryMusic(); player = { name: (nameIn && nameIn.value.trim()) || 'Player', pos: START_IDX, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: player.photo || '', photoThumb: player.photoThumb || '' }; localStorage.setItem('th_player', player.name); document.getElementById('nameOut').textContent = player.name; winnerBox.classList.add('hidden'); rollBtn.disabled = false; updateHUD(); logEl.innerHTML = ''; writeLog(`👋 Welcome, ${player.name}!`); audio.sfxStart(); if(player.photoThumb){ token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; } else { token.style.backgroundImage = `url('${defaultAvatar}')`; token.classList.remove('fallback'); avatarImg.src = defaultAvatar; avatarSmall.src = defaultAvatar; } placeStart(); audio.setTheme(musicTheme.value); audio.startMusic(); musicToggle.textContent = 'Pause Music'; }); }

  if(rollBtn){ rollBtn.addEventListener('click', ()=>{ if(player.finished) return; rollBtn.disabled = true; const r = rollDice(); writeLog(`🎲 Rolled a ${r}`); const spacesLeft = (total - 1) - player.pos; if(r > spacesLeft){ writeLog(`🎯 Need exact ${spacesLeft} to finish. No move—try again next roll!`); rollBtn.disabled = false; return; } const from = player.pos; player.moves++; animateMove(from, r, ()=>{ applyCellEffect(player.pos); updateHUD(); rollBtn.disabled = false; }); }); }

  if(resetBtn){ resetBtn.addEventListener('click', ()=>{ player = { name: localStorage.getItem('th_player') || 'Player', pos: START_IDX, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: player.photo || '', photoThumb: player.photoThumb || '' }; placeStart(); logEl.innerHTML = ''; diceEl.textContent = '⚄'; winnerBox.classList.add('hidden'); updateHUD(); writeLog('🔄 Game reset.'); rollBtn.disabled = false; audio.stopVictoryMusic(); audio.startMusic(); }); }

  if(musicToggle){ musicToggle.addEventListener('click', ()=>{ audio.ensure(); audio.setTheme(musicTheme.value); if(audio.musicInterval){ audio.stopMusic(); musicToggle.textContent = 'Play Music'; } else { audio.startMusic(); musicToggle.textContent = 'Pause Music'; } }); }
  const playAgainBtn = document.getElementById('playAgainMusic'); if(playAgainBtn){ playAgainBtn.addEventListener('click', ()=>{ audio.stopVictoryMusic(); audio.startMusic(); }); }
  if(musicVol){ musicVol.addEventListener('input', (e)=> audio.setMusicVolume(parseFloat(e.target.value)) ); }
  if(sfxVol){ sfxVol.addEventListener('input', (e)=> audio.setSfxVolume(parseFloat(e.target.value)) ); }
  if(muteBtn){ muteBtn.addEventListener('click', ()=> audio.muteToggle() ); }
  if(musicTheme){ musicTheme.addEventListener('change', (e)=> audio.setTheme(e.target.value)); }

  // Attempt autoplay music on load; fallback to first gesture
  function tryAutoPlay(){ try { audio.ensure(); if (audio.ctx && audio.ctx.state === 'suspended') { audio.ctx.resume().catch(()=>{}); } audio.setTheme((musicTheme && musicTheme.value) || 'calm'); audio.startMusic(); if(musicToggle) musicToggle.textContent = 'Pause Music'; } catch(e){} }
  document.addEventListener('DOMContentLoaded', tryAutoPlay);
  const startOnGesture = ()=>{ if(!audio.musicInterval){ tryAutoPlay(); } window.removeEventListener('pointerdown', startOnGesture); window.removeEventListener('keydown', startOnGesture); };
  window.addEventListener('pointerdown', startOnGesture, { once: true });
  window.addEventListener('keydown', startOnGesture, { once: true });

  const last = localStorage.getItem('th_player'); if(last){ if(nameIn) nameIn.value = last; }
  renderScores();
})();
