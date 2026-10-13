let arcadeActive = false;   // só aceita teclas quando o jogo da defesa está na tela
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');

// ---------- Configuração ----------
const FRAME_MS = 1000/60;
const numLanes = 7, winScore = 1000, maxMisses = 12, maxLevel = missionPhases.length;
const shotCooldown = 300;
const shipSize = 25;
const cloudSpeed = 3.5, spySpeed = 3.5;
const cloudGapMin = 60, cloudGapMax = 200;

// Os parâmetros e conceitos de cada fase estão em phases.js.
const qberLimit = 11, qberMaxView = 16;
const cloudQber = 3.5, spyQber = 7, qberDecayPerSec = 0.8;
const regenDuration = 2000, regenCooldown = 10000;
const compromisedDuration = 4000, invulDuration = 1000;

// Cenário
const earthVisible = 80;             // altura da Terra visível na base da tela (px)
const earthGlow = 34;                // folga acima da Terra para o brilho da atmosfera
const hatchFlashMs = 450;            // tempo que a escotilha da nave-mãe brilha ao lançar algo

// Final com o canhão de energia (tempos em milissegundos)
const T_MOVE = 1200;                 // nave desliza até o canto esquerdo
const T_BEAM = 3800;                 // o canhão dispara
const T_BOOM = 4600;                 // o feixe atinge e a nave-mãe explode
const T_END  = 7600;                 // aparece a tela de vitória

// ---------- Estado ----------
let width, height, laneWidth, shipY, earthTop, earthSprite = null;
let isPlaying = false, rafId = null, lastTs = 0, gameTime = 0;
let score, missed, level, currentLane, qber;
let isRegen, regenEnd, keyReadyAt, isCompromised, compEnd, invulUntil;
let nextAsteroidAt, nextCloudAt, nextSpyAt, lastShotTime, bannerUntil;
let lasers = [], asteroids = [], clouds = [], spies = [], stars = [];
let hatchFlash = [], impacts = [];
let finale = null;                   // diferente de null enquanto o final está rodando

function resizeCanvas() {
  const previousWidth = width, previousHeight = height;
  width = Math.min(window.innerWidth, 1100); height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  laneWidth = width / numLanes;
  if (previousWidth && previousHeight) {
    const xScale = width/previousWidth, yScale = height/previousHeight;
    const speedScale = Math.max(.5,Math.min(1.3,height/800))/Math.max(.5,Math.min(1.3,previousHeight/800));
    for (const entity of [...lasers,...asteroids,...clouds,...spies,...pickups]) {
      entity.x *= xScale; entity.y *= yScale;
      if (entity.baseX !== undefined) entity.baseX *= xScale;
      if (entity.speed !== undefined) entity.speed *= speedScale;
    }
    asteroids.forEach(a => {a.radius=Math.min(32,laneWidth*.3)});
    clouds.forEach(c => {c.radius=Math.min(38,laneWidth*.35)});
    spies.forEach(p => {p.radius=laneWidth*.22});
    impacts.forEach(i => {i.x*=xScale});
    if (interferenceFront) interferenceFront.y*=yScale;
    if (finale) {finale.fromX*=xScale;finale.parts.forEach(p=>{p.x*=xScale;p.y*=yScale})}
  }
  earthTop = height - earthVisible; shipY = height - 140;
  stars = Array.from({length:65}, () => ({ x:Math.random()*width, y:Math.random()*height, size:.3+Math.random()*.9, speed:.08+Math.random()*.25 }));
  spaceBackdrop = makeSpaceBackdrop(width,height);
  $('qberMark').style.left = (qberLimit/qberMaxView*100) + '%';
  buildEarth();
  if (arcadeActive && !isPlaying && !finale) drawBackground(0);
}
window.addEventListener('resize', resizeCanvas);

// ---------- Terra (desenhada uma vez numa imagem e reaproveitada a cada quadro) ----------
function buildEarth() {
  const R = width * 2.5, cx = width / 2, top = earthGlow, cy = top + R;
  const c = document.createElement('canvas'); c.width = width; c.height = earthVisible + earthGlow;
  const g = c.getContext('2d'), rnd = seededRandom(11);
  const halo = g.createRadialGradient(cx,cy,R-4,cx,cy,R+earthGlow);
  halo.addColorStop(0,'rgba(120,235,218,.42)'); halo.addColorStop(.25,'rgba(64,155,180,.12)'); halo.addColorStop(1,'rgba(30,100,160,0)');
  g.fillStyle=halo; g.beginPath();g.arc(cx,cy,R+earthGlow,0,Math.PI*2);g.fill();
  g.save();g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.clip();
  const ocean=g.createLinearGradient(0,top,0,c.height);ocean.addColorStop(0,'#215068');ocean.addColorStop(.3,'#112e43');ocean.addColorStop(1,'#071423');g.fillStyle=ocean;g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<17;i++){const x=rnd()*width,y=top+15+rnd()*earthVisible,rx=25+rnd()*95,ry=6+rnd()*12;g.fillStyle='#477b762a';g.beginPath();for(let j=0;j<12;j++){const a=j/12*Math.PI*2,r=.55+rnd()*.45;const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;j?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.fill();for(let j=0;j<8;j++){g.fillStyle='rgba(221,195,144,'+(.1+rnd()*.45)+')';g.fillRect(x+(rnd()-.5)*rx,y+(rnd()-.5)*ry,.7+rnd(),.6+rnd())}}
  g.strokeStyle='#bbdce619';g.lineWidth=2;for(let i=0;i<10;i++){const x=rnd()*width,y=top+rnd()*earthVisible;g.beginPath();g.ellipse(x,y,30+rnd()*130,2+rnd()*6,-.08,0,Math.PI);g.stroke()}
  g.restore();g.strokeStyle='#88d8d285';g.lineWidth=1.2;g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.stroke();earthSprite=c;
}

resizeCanvas();

// ---------- Entrada ----------
window.addEventListener('keydown', e => {
  if (!arcadeActive) return;
  if (['ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  // ENTER inicia / reinicia o jogo quando o menu está aberto (e não durante o final)
  if (e.code === 'Enter' && !isPlaying && !finale) {
    e.preventDefault();
    if (!$('btnStart').disabled) startGame();
    return;
  }
  if (isStageBriefing) { if (e.code === 'Enter') { e.preventDefault(); continuePhase(); } return; }
  if (!isPlaying || isPaused) return;
  if (e.code === 'KeyR') tryRegen();
  if (isRegen) return;
  const dir = isCompromised ? -1 : 1;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA')  currentLane = Math.max(0, Math.min(numLanes-1, currentLane - dir));
  if (e.code === 'ArrowRight' || e.code === 'KeyD') currentLane = Math.max(0, Math.min(numLanes-1, currentLane + dir));
});

function tryRegen() {
  if (isRegen || isCompromised || gameTime < keyReadyAt) return;
  isRegen = true; regenEnd = gameTime + regenDuration; keyReadyAt = gameTime + regenCooldown;
}

// ---------- Fluxo ----------
function startGame() {
  if (isPlaying || !arcadeActive) return; // evita dois loops ao mesmo tempo
  cancelAnimationFrame(rafId);
  finale = null;
  $('ui').style.display = 'none'; $('warning').style.display = 'none';
  isPlaying = true; isPaused = false; $('pauseOverlay').hidden = true; particles = []; $('pauseBtn').disabled = false; $('pauseBtn').innerHTML = 'Ⅱ <span>PAUSAR</span>';
  score = 0; missed = 0; level = 1; currentLane = Math.floor(numLanes/2); qber = 0;
  isRegen = false; isCompromised = false; regenEnd = 0; compEnd = 0; keyReadyAt = 0; invulUntil = 0;
  gameTime = 0; lastTs = 0; lastShotTime = -1000;
  nextAsteroidAt = 1500; nextCloudAt = 3500; nextSpyAt = 12000; bannerUntil = 2000;
  lasers = []; asteroids = []; clouds = []; spies = [];
  hatchFlash = Array(numLanes).fill(null); impacts = [];
  resetQuantumMission();
  updateHUD(); updateQberUI();
  rafId = requestAnimationFrame(update);
}

function updateHUD() {
  $('scoreVal').innerText = score; $('missesVal').innerText = missed; $('levelVal').innerText = level;
  $('winVal').innerText = winScore;
  $('cannonVal').innerText = Math.min(100, Math.round(score/winScore*100));
  $('chargeFill').style.width = Math.min(100, score/winScore*100) + '%';
  updatePhaseHUD();
}

function updateQberUI() {
  const r = Math.min(1, qber/qberMaxView);
  $('qberVal').innerText = qber.toFixed(1);
  $('qberFill').style.width = (r*100) + '%';
  $('qberFill').style.background = isCompromised ? '#ef7976' : (qber > qberLimit*0.7 ? '#e6c491' : '#6ce8cd');
  const ls = $('linkStatus');
  if (isCompromised) { ls.innerText = 'Canal quântico: COMPROMETIDO'; ls.style.color = '#ff5555'; }
  else if (isRegen)  { ls.innerText = 'Canal quântico: regenerando chave...'; ls.style.color = '#88bbff'; }
  else if (qber > qberLimit*0.7) { ls.innerText = 'Canal quântico: ATENÇÃO'; ls.style.color = '#ffaa00'; }
  else { ls.innerText = 'Canal quântico: seguro'; ls.style.color = '#6ce8cd'; }
  const wait = Math.max(0, (keyReadyAt - gameTime)/1000);
  $('keyStatus').innerHTML = '<kbd>R</kbd> ' + ((wait <= 0 && !isRegen && !isCompromised) ? 'Regenerar chave: pronta' : `Recarga: ${isCompromised ? '—' : wait.toFixed(1) + 's'}`);
}

function showWarning(html, bg, border) {
  const w = $('warning'); w.innerHTML = html; w.style.background = bg; w.style.borderColor = border;
  w.style.boxShadow = `0 0 20px ${border}`; w.style.display = 'block';
}

// Tela final: sempre oferece "Jogar Novamente" (vitória ou derrota).
// O botão fica bloqueado por 0,8 s para ninguém reiniciar sem querer ao morrer atirando.
function endGame(title, color, html) {
  finale = null; isStageBriefing = false; $('phaseOverlay').hidden = true;
  isPlaying = false; isPaused = false; $('pauseOverlay').hidden = true; cancelAnimationFrame(rafId); $('warning').style.display = 'none';
  const t = $('uiTitle'); t.innerText = title; t.style.color = color; t.style.textShadow = `0 0 10px ${color}`;
  $('uiDesc').innerHTML = html;
  $('uiScience').innerHTML =
    `<b>O que você viu:</b> a Terra e a nave compartilham uma chave gerada com partículas <b>entrelaçadas</b>. ` +
    `A <b>espionagem</b> (pulsos amarelos) perturba as correlações e aumenta a taxa de erro (QBER); o <b>ruído</b> (nuvens) também causa erros, e por isso é difícil separar um do outro. ` +
    `Acima do limite, a chave é descartada e refeita. As fases também exploram <b>H, estados de Bell, decoerência, síndromes e interferência</b> por meio de mecânicas fictícias. O entrelaçamento real não transmite informação mais rápido que a luz.`;
  const b = $('btnStart');
  b.innerText = "Jogar Novamente"; b.disabled = true; b.blur();
  setTimeout(() => { b.disabled = false; }, 800);
  $('missionInstructions').hidden = true; $('pauseBtn').disabled = true;
  $('ui').style.display = 'flex';
}
function gameOver(reason) {
  endGame("FALHA NA DEFESA", "#ff5555",
    `${reason}<br><br>Pontuação: <b>${score} / ${winScore}</b> · Fase <b>${level} / ${maxLevel}: ${phaseConfig().name}</b><br>Impactos na Terra: <b>${missed} / ${maxMisses}</b>`);
}
// Quando o jogador chega a 1000 pontos, começa o final com o canhão
function gameWin() { startFinale(); }

// Tela de vitória mostrada depois do final
function showVictory() {
  endGame("A TERRA ESTÁ SALVA! 🎉", "#55ff55",
    `<b>O canhão disparou!</b><br><br>Você protegeu a Terra, manteve o canal quântico sob seu controle até a carga completa e a nave-mãe foi destruída.<br><br>Fases concluídas: <b>${maxLevel}</b> · Cápsulas coletadas: <b>${quantumCollected}</b><br>Pontuação: <b>${score}</b> · Impactos: <b>${missed} de ${maxMisses} permitidos</b>`);
}

// ---------- Final: canhão de energia da Terra ----------
function startFinale() {
  isPlaying = false; cancelAnimationFrame(rafId); $('pauseBtn').disabled = true;
  $('warning').style.display = 'none';
  lasers = []; asteroids = []; clouds = []; spies = []; pickups = []; interferenceFront = null; superpositionUntil = 0;
  $('quantumStatus').textContent = 'CANHÃO ORBITAL · CARGA COMPLETA';
  isRegen = false; isCompromised = false; qber = 0; updateQberUI();
  finale = { t: 0, fromX: currentLane*laneWidth + laneWidth/2, boomed: false, parts: [] };
  lastTs = 0;
  rafId = requestAnimationFrame(finaleLoop);
}

function finaleLoop(ts) {
  if (!finale) return;
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs)/FRAME_MS, 3); lastTs = ts;
  gameTime += dt*FRAME_MS; finale.t += dt*FRAME_MS;
  const t = finale.t, cx = width/2, tipY = baseTipY(), top = hullBottom(cx);

  // a nave desliza até o canto esquerdo e fica fixa lá
  const k = Math.min(1, t/T_MOVE), ease = k*k*(3-2*k);
  const shipX = finale.fromX + (shipSize*2.2 - finale.fromX)*ease;

  // explosão da nave-mãe
  if (t >= T_BOOM && !finale.boomed) {
    finale.boomed = true;
    for (let i = 0; i < 120; i++) {
      const a = Math.random()*Math.PI*2, v = 1 + Math.random()*6;
      finale.parts.push({ x: cx + (Math.random()-.5)*width*0.5, y: top - 10,
        vx: Math.cos(a)*v, vy: Math.abs(Math.sin(a))*v*0.6, life: 1, hue: Math.random()*50 });
    }
  }

  ctx.save();
  if (t > T_BEAM && t < T_BOOM + 1500) ctx.translate((Math.random()-.5)*7, (Math.random()-.5)*7);  // tremor
  drawBackground(dt);
  drawLink(shipX);
  drawShip(shipX, "#00ffff", false);

  // carga do canhão
  if (t > T_MOVE && t < T_BEAM) {
    const c = (t - T_MOVE)/(T_BEAM - T_MOVE), r = 4 + 30*c;
    ctx.save(); ctx.shadowBlur = 20 + 40*c; ctx.shadowColor = "#0ff"; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, tipY, r*(0.9 + 0.1*Math.random()), 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#7ff";
    for (let i = 0; i < 8; i++) {                       // faíscas sendo sugadas para o canhão
      const a = i*Math.PI/4 + t/200, d = 90*(1 - ((t/500 + i/8) % 1));
      ctx.beginPath(); ctx.arc(cx + Math.cos(a)*d, tipY + Math.sin(a)*d, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // feixe de energia
  if (t >= T_BEAM && t < T_BOOM + 1400) {
    const g = Math.min(1, (t - T_BEAM)/500);
    const fade = t > T_BOOM + 800 ? Math.max(0, 1 - (t - T_BOOM - 800)/600) : 1;
    const frontY = tipY - (tipY - top)*g, w = laneWidth*1.1*g*fade*(0.9 + 0.1*Math.random());
    ctx.save(); ctx.shadowBlur = 40; ctx.shadowColor = "#0ff";
    ctx.fillStyle = "rgba(0,255,255,.55)"; ctx.fillRect(cx - w/2, frontY, w, tipY - frontY);
    ctx.fillStyle = "#fff"; ctx.fillRect(cx - w*0.25, frontY, w*0.5, tipY - frontY);
    ctx.restore();
  }

  // nave-mãe (pisca ao ser atingida e some após a explosão)
  if (!finale.boomed && (t < T_BEAM + 500 || Math.random() < 0.7)) drawMothership();

  // fragmentos da explosão
  for (const p of finale.parts) {
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 0.05*dt; p.life -= 0.012*dt;
    if (p.life > 0) {
      ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 + 4*p.life, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();

  // clarão branco da explosão
  if (t >= T_BOOM && t < T_BOOM + 600) {
    ctx.fillStyle = `rgba(255,255,255,${1 - (t - T_BOOM)/600})`; ctx.fillRect(0, 0, width, height);
  }

  // textos
  ctx.save(); ctx.textAlign = "center"; ctx.font = "500 " + Math.min(28,width/22) + "px Segoe UI, sans-serif";
  if (t > T_MOVE && t < T_BEAM) {
    const pct = Math.round((t - T_MOVE)/(T_BEAM - T_MOVE)*100);
    ctx.fillStyle = "#0ff"; ctx.fillText(`⚡ CANHÃO CARREGANDO... ${pct}%`, width/2, height/3);
  } else if (t >= T_BEAM && t < T_BOOM + 800) {
    ctx.fillStyle = "#fff"; ctx.fillText("🔥 FOGO!", width/2, height/3);
  } else if (t >= T_BOOM + 800) {
    ctx.fillStyle = "#55ff55"; ctx.fillText("NAVE-MÃE DESTRUÍDA!", width/2, height/3);
  }
  ctx.restore();

  if (t >= T_END) { showVictory(); return; }
  rafId = requestAnimationFrame(finaleLoop);
}

// ---------- Ruído e espionagem ----------
function addQber(v) {
  qber += v;
  if (qber > qberLimit) { isCompromised = true; compEnd = gameTime + compromisedDuration; clouds = []; spies = []; }
}
const noImpact = () => isRegen || isCompromised || gameTime < invulUntil;

// ---------- Criação de entidades ----------
const laneOf = e => Math.floor(e.x / laneWidth);
const blockedByHazard = lane => [...clouds, ...spies].some(e => laneOf(e) === lane && e.y < 150);
const blockedByAsteroid = lane => asteroids.some(e => laneOf(e) === lane && e.y < 150);
const flashHatch = (lane, color) => { hatchFlash[lane] = { color, until: gameTime + hatchFlashMs }; };

function shuffled(arr) {
  for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
  return arr;
}

function spawnAsteroids() {
  if (gameTime < nextAsteroidAt) return;
  const free = shuffled([...Array(numLanes).keys()].filter(i => !blockedByHazard(i)));
  if (!free.length) return;
  let count = phaseConfig().entangled && phaseWaveCount === 0 ? 2 : (Math.random() < phaseConfig().pair) ? 2 : 1;
  count = Math.max(1, Math.min(count, free.length - 1));   // sempre sobra uma trilha livre
  const entangledWave = count === 2 && phaseConfig().entangled && (phaseWaveCount === 0 || Math.random() < .55);
  for (let k = 0; k < count; k++) {
    const armored = !entangledWave && ((phaseWaveCount === 1 && phaseConfig().armor > 0) || Math.random() < phaseConfig().armor);
    asteroids.push({ id: ++asteroidSerial, x: free[k]*laneWidth + laneWidth/2, y: -30 - k*40, radius: Math.min(32, laneWidth*0.3), speed: flightSpeed(phaseConfig().speed), hp: armored ? 2 : 1, armored, group: null });
    flashHatch(free[k], "#ff9a3c");
  }
  if (entangledWave) {
    const pair = asteroids.slice(-2), group = pair[0].id;
    pair.forEach(a => { a.group = group; a.y = -30; a.hp = 1; a.armored = false; });
  }
  phaseWaveCount++;
  nextAsteroidAt = gameTime + phaseConfig().interval * (0.9 + Math.random()*0.2);
}

function spawnClouds() {
  if (clouds.length > 0 || noImpact() || gameTime < nextCloudAt) return;
  const free = shuffled([...Array(numLanes).keys()].filter(i => !blockedByAsteroid(i)));
  if (free.length < 2) return;
  const gap = cloudGapMin + Math.random()*(cloudGapMax - cloudGapMin);
  clouds.push(makeCloud(free[0], -50), makeCloud(free[1], -50-gap));
  flashHatch(free[0], "#b04dff"); flashHatch(free[1], "#b04dff");
  nextCloudAt = gameTime + phaseConfig().cloudInterval * (.9 + Math.random()*.2);
}

function spawnSpies() {            // pulsos espiões: a partir da fase 2
  if (level < 2 || spies.length > 0 || noImpact() || gameTime < nextSpyAt) return;
  const free = [...Array(numLanes).keys()].filter(i => !blockedByHazard(i) && !blockedByAsteroid(i));
  if (!free.length) return;
  const l = free[Math.floor(Math.random()*free.length)];
  spies.push({ x: l*laneWidth + laneWidth/2, y: -40, radius: laneWidth*0.22, speed: flightSpeed(spySpeed + (level-2)*.12) });
  flashHatch(l, "#ffd21f");
  nextSpyAt = gameTime + phaseConfig().spyInterval * (.9 + Math.random()*.2);
}

function fireLaser(x) {
  if (gameTime - lastShotTime < shotCooldown) return;
  lasers.push({ x, y: shipY - shipSize, radius: 4 });
  if (gameTime < superpositionUntil) {
    for (const lane of [currentLane-1, currentLane+1]) if (lane >= 0 && lane < numLanes) lasers.push({ x: (lane+.5)*laneWidth, y: shipY-shipSize, radius: 4, quantum: true });
  }
  lastShotTime = gameTime;
}

// ---------- Desenho: cenário ----------
function drawBackground(dt) {
  if(spaceBackdrop)ctx.drawImage(spaceBackdrop,0,0);else{ctx.fillStyle='#070d17';ctx.fillRect(0,0,width,height)}
  stars.forEach(s=>{s.y+=s.speed*dt;if(s.y>height)s.y=0;ctx.fillStyle='rgba(204,231,235,.45)';ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill()});
  ctx.lineWidth=1;ctx.strokeStyle='rgba(145,202,210,.045)';ctx.setLineDash([3,12]);
  for(let i=1;i<numLanes;i++){ctx.beginPath();ctx.moveTo(i*laneWidth,210);ctx.lineTo(i*laneWidth,earthTop);ctx.stroke()}ctx.setLineDash([]);
  if(isPlaying&&!finale){const x=currentLane*laneWidth;const lane=ctx.createLinearGradient(0,shipY-180,0,earthTop);lane.addColorStop(0,'rgba(108,232,205,0)');lane.addColorStop(1,'rgba(108,232,205,.035)');ctx.fillStyle=lane;ctx.fillRect(x,shipY-180,laneWidth,earthTop-shipY+180)}
  ctx.drawImage(earthSprite,0,earthTop-earthGlow);drawImpacts();drawBase();drawDebris(dt);
}

// Clarão laranja na Terra quando um asteroide passa e atinge a superfície
function drawImpacts() {
  impacts = impacts.filter(i => gameTime - i.t < 600);
  for (const i of impacts) {
    const k = 1 - (gameTime - i.t)/600, r = 40 + 50*(1-k), y = earthTop + 8;
    const g = ctx.createRadialGradient(i.x, y, 2, i.x, y, r);
    g.addColorStop(0, `rgba(255,210,90,${0.9*k})`); g.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(i.x, y, r, 0, Math.PI*2); ctx.fill();
  }
}

// Base de comando na Terra: de onde parte o canal quântico
const baseTipY = () => earthTop - 32;
function drawBase() {
  const cx=width/2,y=earthTop;ctx.save();drawGlow(ctx,cx,y-14,50,'rgba(108,232,205,.12)');
  const metal=ctx.createLinearGradient(0,y-6,0,y+13);metal.addColorStop(0,'#8ba5af');metal.addColorStop(1,'#1d3444');ctx.fillStyle=metal;ctx.strokeStyle='#8dc2c45a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-42,y+13);ctx.lineTo(cx-28,y-7);ctx.lineTo(cx+28,y-7);ctx.lineTo(cx+42,y+13);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#143542';ctx.beginPath();ctx.arc(cx,y-7,15,Math.PI,0);ctx.fill();ctx.stroke();ctx.strokeStyle='#83c9c4';ctx.beginPath();ctx.moveTo(cx,y-19);ctx.lineTo(cx,baseTipY());ctx.stroke();ctx.fillStyle='#bceee0';ctx.beginPath();ctx.arc(cx,baseTipY(),2.6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6ce8cd';for(let i=-2;i<=2;i++)ctx.fillRect(cx+i*12-2,y+3,4,2);ctx.restore();ctx.fillStyle='#799cab';ctx.font='7px Consolas,monospace';ctx.textAlign='center';ctx.fillText('COMANDO / E91',cx,y+29);
}

// Parte de baixo do casco da nave-mãe (y) em cada posição x. O resto da nave fica fora da tela.
const hullCy = -58, hullRy = 130;
const hullBottom = x => {
  const dx = (x - width/2) / (width*0.58);
  return hullCy + hullRy*Math.sqrt(Math.max(0, 1 - dx*dx));
};

// Nave-mãe alienígena no topo: as escotilhas (uma por trilha) brilham quando lançam algo
function drawMothership() {
  const cx = width/2, rx = width*0.58;
  ctx.save();

  // casco
  const hull = ctx.createLinearGradient(0, 0, 0, 74);
  hull.addColorStop(0, "#394958"); hull.addColorStop(.5, "#233244"); hull.addColorStop(1, "#0e1b2a");
  ctx.shadowBlur = 18; ctx.shadowColor = "rgba(236,115,128,.2)"; ctx.fillStyle = hull;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx, hullRy, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(226,143,149,.45)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx, hullRy, 0, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, hullCy, rx*0.96, hullRy*0.9, 0, 0, Math.PI*2); ctx.stroke();

  ctx.save();ctx.beginPath();ctx.ellipse(cx,hullCy,rx,hullRy,0,0,Math.PI*2);ctx.clip();
  for(let i=0;i<28;i++){const px=i*width/27,py=18+Math.sin(i*.7)*6;ctx.fillStyle=i%2?'#9db6c50b':'#020c162a';ctx.fillRect(px,0,width/29,py+19);ctx.strokeStyle='#829aac18';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px+8,py+25);ctx.lineTo(px+25,py+25);ctx.stroke();ctx.fillStyle='#c6878d66';ctx.fillRect(px+5,py+10,8,1)}ctx.restore();
  // divisões do casco entre as escotilhas
  for (let i = 1; i < numLanes; i++) {
    const x = i*laneWidth, y = hullBottom(x);
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    ctx.beginPath(); ctx.moveTo(x, y-26); ctx.lineTo(x, y-2); ctx.stroke();
  }

  // escotilhas de lançamento (uma por trilha)
  const w = laneWidth*0.46;
  for (let i = 0; i < numLanes; i++) {
    const x = i*laneWidth + laneWidth/2, y = hullBottom(x);
    ctx.fillStyle = "#06070d"; ctx.fillRect(x - w/2, y - 14, w, 12);
    ctx.strokeStyle = "#587382"; ctx.strokeRect(x - w/2, y - 14, w, 12);
    const f = hatchFlash[i];
    if (f && gameTime < f.until) {
      const k = (f.until - gameTime)/hatchFlashMs;
      ctx.save(); ctx.shadowBlur = 24; ctx.shadowColor = f.color; ctx.fillStyle = f.color; ctx.globalAlpha = 0.35 + 0.65*k;
      ctx.fillRect(x - w/2 + 2, y - 12, w - 4, 8); ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,70,100,.35)"; ctx.fillRect(x - w/4, y - 9, w/2, 3);
    }
  }

  // luzes piscando na borda
  for (let i = 0; i <= numLanes; i++) {
    const x = i*laneWidth, y = hullBottom(x) - 9, on = Math.sin(gameTime/180 + i*1.7) > 0;
    ctx.save();
    if (on) { ctx.shadowBlur = 8; ctx.shadowColor = "#cf7c8a"; }
    ctx.fillStyle = on ? "#ff5b83" : "#552233";
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }

  // núcleo (pulsa mais rápido quando o canal está comprometido)
  const pulse = 0.5 + 0.5*Math.sin(gameTime/(isCompromised ? 120 : 400)), cy = hullBottom(cx) - 34;
  const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
  core.addColorStop(0, "#ffd0dc"); core.addColorStop(.5, "#ff3b6b"); core.addColorStop(1, "#7a0f2e");
  ctx.shadowBlur = 10 + 14*pulse; ctx.shadowColor = "#ff3b6b"; ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// Canal quântico: liga a antena da base na Terra à nave
function drawLink(shipX) {
  const r = Math.min(1, qber/qberLimit);
  ctx.save(); ctx.lineWidth = 1;
  if (isCompromised) { ctx.strokeStyle = "rgba(255,60,60,.6)"; ctx.setLineDash([3,16]); ctx.lineDashOffset = Math.random()*20; }
  else if (isRegen)  { ctx.strokeStyle = `rgba(150,200,255,${0.6 + 0.4*Math.sin(gameTime/60)})`; }
  else {
    ctx.strokeStyle = `hsla(${165 - 165*r},65%,65%,${0.3 + 0.15*Math.sin(gameTime/200)})`;
    ctx.setLineDash([10,6]); ctx.lineDashOffset = (r > 0.6 ? Math.random()*6 : -gameTime/40);
  }
  ctx.beginPath(); ctx.moveTo(width/2, baseTipY());
  ctx.quadraticCurveTo(shipX, baseTipY() - 6, shipX, shipY + shipSize + 6);
  ctx.stroke(); ctx.restore();
}

// ---------- Desenho: nave do jogador (caça com asas, canhões e dois motores) ----------
function drawShip(x,color,flicker) {
  if(flicker&&Math.floor(gameTime/150)%2===0)return;
  const shipColor=isRegen?'#99bbef':flicker?'#ef7976':'#6ce8cd';
  drawInterceptor(ctx,x,shipY,shipSize,shipColor,gameTime,flicker);
  if(isRegen){ctx.save();ctx.strokeStyle='#99bbef77';ctx.lineWidth=1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(x,shipY,shipSize*1.8,gameTime/350,gameTime/350+Math.PI*1.7);ctx.stroke();ctx.restore()}
  if(gameTime-lastShotTime<80)drawGlow(ctx,x,shipY-shipSize*1.3,14,'rgba(166,255,232,.5)');
}

// ---------- Desenho: ameaças ----------
// Pulso espião: estrela amarela giratória (parece uma mina, não uma nave)
function drawSpy(p) { drawSpyPulse(p); }

function drawCloud(c) { drawQuantumCloud(c); }

function drawBanner() {
  if(gameTime>bannerUntil)return;
  const bannerY = Math.max(height*.42, Math.min(355, height*.6));
  ctx.save();ctx.globalAlpha=Math.min(1,(bannerUntil-gameTime)/500);
  ctx.textAlign='center';ctx.fillStyle='#829eae';ctx.font='9px Consolas,monospace';ctx.fillText(phaseConfig().concept.toUpperCase(),width/2,bannerY);
  ctx.fillStyle='#deeee9';ctx.font='300 '+Math.min(32,width/15)+'px Segoe UI,sans-serif';ctx.fillText('FASE 0'+level+' · '+phaseConfig().name,width/2,bannerY+36);
  ctx.strokeStyle='#6ce8cd66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(width/2-25,bannerY+52);ctx.lineTo(width/2+25,bannerY+52);ctx.stroke();ctx.restore();
}

// ---------- Loop ----------
function update(ts) {
  if (!isPlaying || isPaused || isStageBriefing) return;
  const newLevel = phaseForScore(score);
  if (newLevel !== level) { enterPhase(newLevel); return; }
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs)/FRAME_MS, 3);
  lastTs = ts; gameTime += dt*FRAME_MS;

  if (isRegen && gameTime >= regenEnd) { isRegen = false; qber = 0; }
  if (isCompromised && gameTime >= compEnd) {
    isCompromised = false; qber = 2; invulUntil = gameTime + invulDuration;
    nextCloudAt = Math.max(nextCloudAt, gameTime + 2500); nextSpyAt = Math.max(nextSpyAt, gameTime + 4000);
  }
  if (isCompromised) showWarning(`⚠️ CANAL COMPROMETIDO!<br>ALIENS NO CONTROLE: COMANDOS INVERTIDOS ${((compEnd-gameTime)/1000).toFixed(1)}s`, 'rgba(255,0,0,.8)', '#f33');
  else if (isRegen)  showWarning(`🔑 REGENERANDO CHAVE...<br>NAVE PARADA ${((regenEnd-gameTime)/1000).toFixed(1)}s`, 'rgba(30,80,200,.8)', '#8bf');
  else $('warning').style.display = 'none';

  if (!isCompromised && !isRegen) {
    const decay = level >= 5 ? .2 : qberDecayPerSec;
    qber = Math.max(0, qber - decay*dt*FRAME_MS/1000);
    if (phaseConfig().drift) addQber(phaseConfig().drift*dt*FRAME_MS/1000);
  }
  updateQberUI();

  spawnAsteroids(); spawnClouds(); spawnSpies(); spawnQuantumPickup();
  drawBackground(dt);

  const shipX = currentLane*laneWidth + laneWidth/2;
  updateInterference(dt);
  drawEntangledLinks();
  const protectedNow = noImpact();
  if (!isRegen) fireLaser(shipX);

  updateQuantumPickups(dt, shipX);
  updateQuantumStatus();
  drawSuperposition(shipX);
  drawLink(shipX);
  ctx.globalAlpha = (protectedNow && !isCompromised) ? 0.65 : 1;
  drawShip(shipX, isRegen ? "#88bbff" : "#00ffff", isCompromised);
  ctx.globalAlpha = 1;

  // Lasers (somem ao bater no casco da nave-mãe)
  for (let i = lasers.length-1; i >= 0; i--) {
    const l = lasers[i]; l.y -= flightSpeed(10)*dt;
    drawEnergyBolt(l);
    if (l.y < hullBottom(l.x)) lasers.splice(i, 1);
  }

  // Nuvens (ruído)
  for (let i = clouds.length-1; i >= 0; i--) {
    const c = clouds[i]; c.y += c.speed*dt;
    if (c.sway) c.x = Math.max(c.radius, Math.min(width-c.radius, c.baseX + Math.sin((gameTime-c.born)/900)*laneWidth*.65));
    drawCloud(c);
    if (!noImpact() && Math.hypot(shipX - c.x, shipY - c.y) < c.radius + shipSize*0.7) {
      clouds.splice(i, 1); addQber(cloudQber); if (isCompromised) break; continue;
    }
    if (c.y > height + 50) clouds.splice(i, 1);
  }

  // Pulsos espiões (espionagem)
  for (let i = spies.length-1; i >= 0; i--) {
    const p = spies[i]; p.y += p.speed*dt; drawSpy(p);
    if (!noImpact() && Math.hypot(shipX - p.x, shipY - p.y) < p.radius*1.6 + shipSize*0.7) {
      spies.splice(i, 1); addQber(spyQber); if (isCompromised) break; continue;
    }
    if (p.y > height + 50) spies.splice(i, 1);
  }

  // Snapshot: destruir um par conectado não invalida a iteração das outras rochas.
  for (const a of [...asteroids].reverse()) {
    if (!asteroids.includes(a)) continue;
    a.y += a.speed*dt; drawAsteroid(a); drawAsteroidQuantum(a);
    if (Math.hypot(shipX-a.x, shipY-a.y) < a.radius+shipSize*.7) { gameOver('A nave defensora foi destruída por um impacto direto!'); return; }
    let destroyed = false;
    for (let j = lasers.length-1; j >= 0; j--) {
      const l = lasers[j];
      if (Math.hypot(l.x-a.x, l.y-a.y) < a.radius+l.radius) {
        lasers.splice(j,1); a.hp--;
        if (a.hp <= 0) { destroyQuantumAsteroid(a); destroyed = true; }
        else a.hitUntil = gameTime+160;
        if (score >= winScore) { gameWin(); return; }
        if (destroyed && phaseForScore(score) !== level) { enterPhase(phaseForScore(score)); return; }
        break;
      }
    }
    if (destroyed) continue;
    if (a.y-a.radius*.5 > earthTop) {
      asteroids.splice(asteroids.indexOf(a),1); impacts.push({x:a.x,t:gameTime});
      missed++; updateHUD();
      if (missed >= maxMisses) { gameOver('Defesa falhou! '+maxMisses+' asteroides atingiram a Terra.'); return; }
    }
  }

  drawMothership();   // por último: asteroides, nuvens e pulsos saem de baixo do casco
  drawBanner();
  rafId = requestAnimationFrame(update);
}

// Chamado pelo botão "Iniciar Defesa Planetária" do briefing
function startDefense() {
  introActive = false;
  document.getElementById('intro').style.display = 'none';
  document.getElementById('arcade').style.display = 'flex';
  arcadeActive = true;
  resizeCanvas(); drawBackground(0); drawMothership();
  $('pauseBtn').disabled = true;
}
