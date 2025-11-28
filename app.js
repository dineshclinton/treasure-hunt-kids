
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
  
