
(function(){
  const size = 6; const total = size*size; // 36 cells
  function indexToRC(idx){ const row = Math.floor(idx/size); const colInRow = idx % size; const col = (row % 2 === 0) ? colInRow : (size-1 - colInRow); return {r: row, c: col}; }
  const types = { START: 'start', FINISH: 'finish', GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze', GPAIR: 'gpair', THIEF_NET: 'thief-net', THIEF_SWORD: 'thief-sword', THIEF_HOOK: 'thief-hook', EMPTY: 'empty' };

  const GOLD = [3,7,12,18,27];
  const SILVER = [5,10,16,22,30];
  const BRONZE = [2,9,14,20,25];
  const GPAIR = [13,24];
  const THIEF_NET = [4,15,23,32];
  const THIEF_SWORD = [11,19,28,34];
  const THIEF_HOOK = [21,26];

  const gridEl = document.getElementById('grid');

  const board = Array.from({length: total}, (_, idx) => {
    let type = types.EMPTY; let icon = '•';
    if(idx === 0){ type = types.START; icon = '🏁'; }
    else if(idx === total-1){ type = types.FINISH; icon = '🏁'; }
    else if(GOLD.includes(idx)){ type = types.GOLD; icon = '🪙'; }
    else if(SILVER.includes(idx)){ type = types.SILVER; icon = '🥈'; }
    else if(BRONZE.includes(idx)){ type = types.BRONZE; icon = '🥉'; }
    else if(GPAIR.includes(idx)){ type = types.GPAIR; icon = '👑'; }
    else if(THIEF_NET.includes(idx)){ type = types.THIEF_NET; icon = '🎣'; }
    else if(THIEF_SWORD.includes(idx)){ type = types.THIEF_SWORD; icon = '🗡️'; }
    else if(THIEF_HOOK.includes(idx)){ type = types.THIEF_HOOK; icon = '🪝'; }
    return { idx, type, icon };
  });

  gridEl.style.setProperty('--size', size);
  for(let i=0;i<total;i++){
    const rc = indexToRC(i);
    const cell = document.createElement('div');
    const b = board[i];
    cell.className = `cell ${b.type}`;
    cell.dataset.idx = i;
    cell.style.gridRowStart = rc.r + 1;
    cell.style.gridColumnStart = rc.c + 1;

    const idxLabel = document.createElement('div'); idxLabel.className = 'idx'; idxLabel.textContent = i;
    const icon = document.createElement('div'); icon.textContent = b.icon; // icon only

    if(i < total-1){
      const nextRC = indexToRC(i+1);
      const dr = nextRC.r - rc.r, dc = nextRC.c - rc.c;
      const arrowEl = document.createElement('div'); arrowEl.className = 'arrow';
      let arrow = '➡️';
      if(dr === 0 && dc === 1) arrow = '➡️';
      else if(dr === 0 && dc === -1) arrow = '⬅️';
      else if(dr === 1 && dc === 0) arrow = '⬇️';
      else if(dr === -1 && dc === 0) arrow = '⬆️';
      arrowEl.textContent = arrow; cell.appendChild(arrowEl);
    }

    cell.appendChild(idxLabel); cell.appendChild(icon); gridEl.appendChild(cell);
  }

  // ---------- AUDIO MANAGER ----------
  class AudioManager {
    constructor(){ this.ctx = null; this.master = null; this.sfxGain = null; this.musicGain = null; this.musicInterval = null; this.victoryInterval = null; this.muted = false; this.theme = 'calm'; }
    ensure(){ if(this.ctx) return; this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.sfxGain = this.ctx.createGain(); this.musicGain = this.ctx.createGain(); this.master.gain.value = 1.0; this.sfxGain.gain.value = parseFloat(sfxVol.value); this.musicGain.gain.value = parseFloat(musicVol.value); this.sfxGain.connect(this.master); this.musicGain.connect(this.master); this.master.connect(this.ctx.destination); }
    setSfxVolume(v){ this.ensure(); this.sfxGain.gain.value = v; }
    setMusicVolume(v){ this.ensure(); this.musicGain.gain.value = v; }
    muteToggle(){ this.ensure(); this.muted = !this.muted; this.master.gain.value = this.muted ? 0 : 1; }
    setTheme(t){ this.theme = t; if(this.musicInterval){ this.stopMusic(); this.startMusic(); } }

    tone({freq=440, type='sine', time=0, duration=0.2, gain=0.3}){
      this.ensure(); const ctx = this.ctx; const osc = ctx.createOscillator(); const g = this.ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + time); g.gain.setValueAtTime(0, ctx.currentTime + time); g.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration); osc.connect(g).connect(this.sfxGain); osc.start(ctx.currentTime + time); osc.stop(ctx.currentTime + time + duration + 0.05);
    }
    noise({time=0, duration=0.3, gain=0.2}){
      this.ensure(); const ctx = this.ctx; const bufferSize = Math.max(1, Math.floor(duration * ctx.sampleRate)); const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const data = buffer.getChannelData(0); for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2 - 1) * 0.7; } const src = ctx.createBufferSource(); src.buffer = buffer; const g = this.ctx.createGain(); g.gain.value = gain; src.connect(g).connect(this.sfxGain); src.start(ctx.currentTime + time);
    }

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

    startMusic(){
      this.ensure(); if(this.musicInterval) return;
      let pattern;
      if(this.theme === 'adventure'){
        pattern = [ {f:392,d:0.18},{f:494,d:0.18},{f:523,d:0.18},{f:659,d:0.22},{f:523,d:0.18},{f:494,d:0.18},{f:392,d:0.24} ];
      } else if(this.theme === 'space'){
        pattern = [ {f:261,d:0.24},{f:392,d:0.24},{f:523,d:0.28},{f:392,d:0.24},{f:261,d:0.28} ];
      } else {
        pattern = [ {f:392,d:0.18},{f:440,d:0.18},{f:494,d:0.18},{f:587,d:0.22},{f:494,d:0.18},{f:440,d:0.18},{f:392,d:0.24} ];
      }
      let i = 0;
      this.musicInterval = setInterval(()=>{
        const ctx = this.ctx; const osc = ctx.createOscillator(); const g = ctx.createGain(); const step = pattern[i % pattern.length]; osc.type = 'sine'; osc.frequency.value = step.f; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + step.d); osc.connect(g).connect(this.musicGain); osc.start(); osc.stop(ctx.currentTime + step.d + 0.01); i++; }, 250);
    }
    stopMusic(){ if(this.musicInterval){ clearInterval(this.musicInterval); this.musicInterval = null; } }

    startVictoryMusic(){
      this.ensure(); if(this.victoryInterval) return; this.stopMusic();
      const pattern = [ {f:523,d:0.20,type:'square'},{f:659,d:0.20,type:'square'},{f:784,d:0.24,type:'square'},{f:659,d:0.20,type:'square'},{f:523,d:0.24,type:'square'} ];
      let i = 0;
      this.victoryInterval = setInterval(()=>{
        const ctx = this.ctx; const osc = ctx.createOscillator(); const g = ctx.createGain(); const step = pattern[i % pattern.length]; osc.type = step.type || 'sine'; osc.frequency.value = step.f; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + step.d); osc.connect(g).connect(this.musicGain); osc.start(); osc.stop(ctx.currentTime + step.d + 0.01); i++; }, 260);
    }
    stopVictoryMusic(){ if(this.victoryInterval){ clearInterval(this.victoryInterval); this.victoryInterval = null; } }
  }

  let player = { name: '', pos: 0, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: '', photoThumb: '' };
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
  const autoMusic = document.getElementById('autoMusic');
  const playAgainMusicBtn = document.getElementById('playAgainMusic');
  const audio = new AudioManager();

  const scoresBody = document.getElementById('scoresBody');
  const clearScoresBtn = document.getElementById('clearScores');
  const copyScoresBtn = document.getElementById('copyScores');

  function writeLog(msg){ const p = document.createElement('div'); p.textContent = msg; logEl.prepend(p); }
  function updateHUD(){ nameOut.textContent = player.name || '—'; pointsOut.textContent = player.points; movesOut.textContent = player.moves; totalScoreOut.textContent = (player.points + player.moves); gpairOut.textContent = player.hasGoldPair ? '✅' : '❌'; posOut.textContent = player.pos; }
  function moveTokenTo(idx){ const cell = document.querySelector(`.cell[data-idx='${idx}']`); if(cell){ cell.appendChild(token); token.style.transform = 'scale(1.0)'; } }

  function applyCellEffect(idx){ const b = board[idx]; switch(b.type){
      case types.GOLD: player.points += 3; audio.sfxGold(); writeLog(`🪙 Gold! +3 (points ${player.points})`); break;
      case types.SILVER: player.points += 2; audio.sfxSilver(); writeLog(`🥈 Silver! +2 (points ${player.points})`); break;
      case types.BRONZE: player.points += 1; audio.sfxBronze(); writeLog(`🥉 Bronze! +1 (points ${player.points})`); break;
      case types.GPAIR: player.points += 6; player.hasGoldPair = true; audio.sfxGoldPair(); writeLog(`👑 Gold Pair! +6 and you now hold a Gold Pair`); break;
      case types.THIEF_NET: player.points -= 2; audio.sfxThiefNet(); writeLog(`🎣 Net Thief! −2 (points ${player.points})`); break;
      case types.THIEF_SWORD: player.points -= 3; audio.sfxThiefSword(); writeLog(`🗡️ Sword Thief! −3 (points ${player.points})`); break;
      case types.THIEF_HOOK: player.points -= 16; audio.sfxThiefHook(); writeLog(`🪝 Hook Thief! −16 (points ${player.points})`); break;
      case types.FINISH:
        if(player.hasGoldPair){
          player.finished = true; audio.sfxWin(); audio.startVictoryMusic();
          const total = player.points + player.moves; writeLog(`🏆 ${player.name || 'Player'} wins! Final total: ${total}`);
          winName.textContent = player.name || 'Player';
          finalPoints.textContent = player.points; finalMoves.textContent = player.moves; finalTotal.textContent = total;
          winnerBox.classList.remove('hidden'); saveScore(); renderScores();
        } else { writeLog('🏁 Finish reached, but no Gold Pair yet—keep going!'); }
        break;
    }
    if(player.points < 0){ writeLog('🔁 Points below 0! Back to START and reset to 0.'); player.points = 0; player.pos = 0; moveTokenTo(0); }
  }

  function rollDice(){ audio.ensure(); diceEl.classList.add('roll'); audio.sfxDice(); const roll = 1 + Math.floor(Math.random()*6); const faces = ['⚀','⚁','⚂','⚃','⚄','⚅']; setTimeout(()=>{ diceEl.textContent = faces[roll-1]; diceEl.classList.remove('roll'); }, 500); return roll; }

  // 5× slower movement
  function animateMove(from, steps, onDone){ let current = from; let remaining = steps; const timer = setInterval(()=>{ if(current < total-1){ current = current + 1; } player.pos = current; moveTokenTo(current); remaining--; if(remaining <= 0){ clearInterval(timer); onDone && onDone(); } }, 1100); }

  function makeThumb(dataUrl, size=64){ return new Promise((resolve)=>{ const img = new Image(); img.onload = ()=>{ const c = document.createElement('canvas'); const ctx = c.getContext('2d'); c.width = size; c.height = size; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,size,size); const minSide = Math.min(img.width, img.height); const sx = (img.width - minSide)/2; const sy = (img.height - minSide)/2; ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size); resolve(c.toDataURL('image/jpeg', 0.7)); }; img.src = dataUrl; }); }

  photoIn.addEventListener('change', async (evt)=>{ const file = evt.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = async (e)=>{ const url = e.target.result; player.photo = url; player.photoThumb = await makeThumb(url, 64); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); }; reader.readAsDataURL(file); });

  camStartBtn.addEventListener('click', async ()=>{ try{ const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); camVideo.srcObject = stream; camVideo.style.display = 'block'; camSnapBtn.style.display = 'inline-block'; } catch(err){ writeLog('⚠️ Camera access failed: ' + err.message); } });
  camSnapBtn.addEventListener('click', async ()=>{ const w = camCanvas.width, h = camCanvas.height; const ctx = camCanvas.getContext('2d'); ctx.drawImage(camVideo, 0, 0, w, h); const url = camCanvas.toDataURL('image/jpeg', 0.9); player.photo = url; player.photoThumb = await makeThumb(url, 64); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); writeLog('📸 Photo captured from camera.'); });

  function saveScore(){ const score = { name: player.name || 'Player', points: player.points, rolls: player.moves, total: (player.points + player.moves), goldPair: player.hasGoldPair, photo: player.photoThumb || '', date: new Date().toLocaleString() }; const key = 'th_scores'; const arr = JSON.parse(localStorage.getItem(key) || '[]'); arr.push(score); arr.sort((a,b)=> b.total - a.total); localStorage.setItem(key, JSON.stringify(arr.slice(0, 20))); }
  function renderScores(){ const key = 'th_scores'; const arr = JSON.parse(localStorage.getItem(key) || '[]'); scoresBody.innerHTML = ''; arr.forEach((s, i)=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td class='photo-cell'>${s.photo ? `<img src='${s.photo}' class='avatar sm' alt='photo'/>` : ''}</td><td>${s.name}</td><td>${s.points}</td><td>${s.rolls}</td><td>${s.total}</td><td>${s.goldPair?'✅':'❌'}</td><td>${s.date}</td>`; scoresBody.appendChild(tr); }); }
  function copyScoresCSV(){ const key = 'th_scores'; const arr = JSON.parse(localStorage.getItem(key) || '[]'); const lines = ['Rank,Player,Points,Rolls,Total,GoldPair,Date']; arr.forEach((s,i)=>{ lines.push(`${i+1},${s.name},${s.points},${s.rolls},${s.total},${s.goldPair?'Yes':'No'},${s.date}`); }); const csv = lines.join('\n'); navigator.clipboard.writeText(csv).then(()=>{ writeLog('📋 High scores copied as CSV!'); }).catch(()=>{ writeLog('⚠️ Unable to copy. Your browser may block clipboard access.'); }); }

  startBtn.addEventListener('click', ()=>{ audio.ensure(); audio.stopVictoryMusic();
    player = { name: nameIn.value.trim() || 'Player', pos: 0, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: player.photo || '', photoThumb: player.photoThumb || '' };
    localStorage.setItem('th_player', player.name); nameOut.textContent = player.name; winnerBox.classList.add('hidden'); rollBtn.disabled = false; updateHUD(); logEl.innerHTML = ''; writeLog(`👋 Welcome, ${player.name}!`); audio.sfxStart();
    if(player.photoThumb){ token.style.backgroundImage = `url('${player.photoThumb}')`; token.classList.remove('fallback'); avatarImg.src = player.photoThumb; avatarSmall.src = player.photoThumb; } else { token.style.backgroundImage = ''; token.classList.add('fallback'); avatarImg.src = ''; avatarSmall.src = ''; }
    moveTokenTo(0);
    // Auto-play music
    audio.setTheme(musicTheme.value); audio.startMusic(); musicToggle.textContent = 'Pause Music';
  });

  rollBtn.addEventListener('click', ()=>{ if(player.finished) return; rollBtn.disabled = true; const r = rollDice(); writeLog(`🎲 Rolled a ${r}`); const spacesLeft = (total - 1) - player.pos; if(r > spacesLeft){ writeLog(`🎯 Need exact ${spacesLeft} to finish. No move—try again next roll!`); rollBtn.disabled = false; return; } const from = player.pos; player.moves++; animateMove(from, r, ()=>{ applyCellEffect(player.pos); updateHUD(); rollBtn.disabled = false; }); });

  resetBtn.addEventListener('click', ()=>{ player = { name: localStorage.getItem('th_player') || 'Player', pos: 0, points: 0, hasGoldPair: false, finished: false, moves: 0, photo: player.photo || '', photoThumb: player.photoThumb || '' }; moveTokenTo(0); logEl.innerHTML = ''; diceEl.textContent = '⚄'; winnerBox.classList.add('hidden'); updateHUD(); writeLog('🔄 Game reset.'); rollBtn.disabled = false; audio.stopVictoryMusic(); audio.startMusic(); });

  musicToggle.addEventListener('click', ()=>{ audio.ensure(); audio.setTheme(musicTheme.value); if(audio.musicInterval){ audio.stopMusic(); musicToggle.textContent = 'Play Music'; } else { audio.startMusic(); musicToggle.textContent = 'Pause Music'; } });
  playAgainMusicBtn.addEventListener('click', ()=>{ audio.stopVictoryMusic(); audio.startMusic(); });
  musicVol.addEventListener('input', (e)=> audio.setMusicVolume(parseFloat(e.target.value)) );
  sfxVol.addEventListener('input', (e)=> audio.setSfxVolume(parseFloat(e.target.value)) );
  muteBtn.addEventListener('click', ()=> audio.muteToggle() );
  musicTheme.addEventListener('change', (e)=> audio.setTheme(e.target.value));

  const last = localStorage.getItem('th_player'); if(last){ nameIn.value = last; }
  renderScores();
  clearScoresBtn.addEventListener('click', ()=>{ localStorage.removeItem('th_scores'); renderScores(); writeLog('🧹 High scores cleared.'); });
  copyScoresBtn.addEventListener('click', copyScoresCSV);
})();
