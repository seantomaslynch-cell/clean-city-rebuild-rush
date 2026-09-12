(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const ui = {
    hud: $('hud'), timer: $('timer'), runScore: $('runScore'), cargoFill: $('cargoFill'), cargoCount: $('cargoCount'),
    contractBar: $('contractBar'), contractText: $('contractText'), contractFill: $('contractFill'), magnetButton: $('magnetButton'),
    recoveryButton: $('recoveryButton'), comboChip: $('comboChip'), comboValue: $('comboValue'), bonusButton: $('bonusButton'), supplyButton: $('supplyButton'),
    guideBar: $('guideBar'), guideIcon: $('guideIcon'), guideText: $('guideText'),
    start: $('startScreen'), tutorial: $('tutorialScreen'), brief: $('briefScreen'), result: $('resultScreen'), rebuild: $('rebuildScreen'), rewards: $('rewardsScreen'), toast: $('toast'),
    earned: $('earnedSalvage'), sorted: $('itemsSorted'), combo: $('bestCombo'), tier: $('cargoTier'), wallet: $('walletValue'),
    projectList: $('projectList'), homeProgressText: $('homeProgressText'), homeProgressFill: $('homeProgressFill'), bestScore: $('bestScoreValue'), resultHeading: $('resultHeading'),
    homeAreaLabel: $('homeAreaLabel'), missionName: $('missionName'), missionSub: $('missionSub'), briefAreaStep: $('briefAreaStep'), briefTitle: $('briefTitle'), briefGoal: $('briefGoal'),
    resultAreaLabel: $('resultAreaLabel'), rebuildAreaLabel: $('rebuildAreaLabel'), briefPaper: $('briefPaper'), briefPlastic: $('briefPlastic'), briefMetal: $('briefMetal'),
    dailyBadge: $('dailyBadge'), dailyStreak: $('dailyStreak'), dailyRewardValue: $('dailyRewardValue'), streakTrack: $('streakTrack'), dailyClaimButton: $('dailyClaimButton'),
    dailyDoubleButton: $('dailyDoubleButton'), dailyChallenges: $('dailyChallenges'), seasonTitle: $('seasonTitle'), seasonXpText: $('seasonXpText'), seasonFill: $('seasonFill'),
    seasonTrack: $('seasonTrack'), seasonBoostButton: $('seasonBoostButton')
  };

  const TYPES = {
    paper: { color: '#5bbcff', dark: '#136fb7', label: 'PAPER' },
    plastic: { color: '#ffd447', dark: '#b97700', label: 'PLASTIC' },
    metal: { color: '#c2d1dc', dark: '#5c7182', label: 'METAL' }
  };
  const LEVELS = [
    { name: 'Green Park', mission: 'Park Picnic Rescue', title: 'PARK PICNIC<br>RESCUE', contractType: 'plastic', goal: 8, target: 'yellow plastic bottles', hazard: 'MUD', world: 'park' },
    { name: 'Main Street', mission: 'Downtown Sweep', title: 'DOWNTOWN<br>SWEEP', contractType: 'paper', goal: 10, target: 'blue paper flyers', hazard: 'OIL', world: 'street' },
    { name: 'Happy Dog Park', mission: 'Paws & Paths Cleanup', title: 'PAWS & PATHS<br>CLEANUP', contractType: 'metal', goal: 10, target: 'silver metal cans', hazard: 'MUD', world: 'dog' },
    { name: 'River Habitat', mission: 'River Rescue', title: 'RIVER HABITAT<br>RESCUE', contractType: 'plastic', goal: 12, target: 'yellow plastic waste', hazard: 'SLUDGE', world: 'river' }
  ];
  const projects = [
    { id: 'park', name: 'Restore Green Park', icon: '🌳', cost: 140, note: 'Unlocks the Main Street cleanup' },
    { id: 'market', name: 'Revive Main Street', icon: '🏙️', cost: 240, note: 'Unlocks the Happy Dog Park' },
    { id: 'fountain', name: 'Build Happy Dog Park', icon: '🐕', cost: 380, note: 'Unlocks the River Habitat' },
    { id: 'habitat', name: 'Protect River Habitat', icon: '🦆', cost: 520, note: 'Completes the world restoration' }
  ];
  const DAILY_REWARDS = [30, 40, 50, 60, 80, 100, 150];
  const SEASON_REWARDS = [25, 30, 40, 50, 60, 70, 80, 90, 110, 150];
  const SEASON_TIER_XP = 350;

  const state = {
    mode: 'start', width: 0, height: 0, dpr: 1, last: performance.now(), runLeft: 60,
    score: 0, earned: 0, sorted: 0, combo: 0, bestCombo: 0, comboExpires: 0, contractCount: 0, contractAwarded: false,
    wallet: 0, built: [], bestScore: 0, totalRuns: 0, doubled: false, magnetUntil: 0, keys: new Set(), pointerDown: false,
    paused: false, saveLoaded: false, firstFrameSent: false, gameReadySent: false, adBusy: false, lastRewardAt: 0,
    vipContract: false, tutorialSeen: false, guideUntil: 0, deposits: 0, levelIndex: 0, contractType: 'plastic', contractGoal: 8, rewardUsed: { bonus: false, magnet: false, recovery: false, supply: false },
    daily: { lastClaim: '', streak: 0, lastAmount: 0, doubleDate: '', freezeUsed: false, cycleClaims: 0, progress: { date: '', sorted: 0, runs: 0, contracts: 0, bestCombo: 0, score: 0 }, claimed: [] },
    season: { id: '', xp: 0, claimed: [], boostDate: '' },
    cosmetics: { unlocked: ['antenna-none', 'wheels-blue', 'trail-white'], equipped: { antenna: 'antenna-none', wheels: 'wheels-blue', trail: 'trail-white' } },
    prestige: { unlocked: false, enabled: false, activeRun: false, runs: 0 },
    lostCargo: [], recoveryUntil: 0, lastHazardHit: 0, shakeUntil: 0, audioEnabled: true, audioContext: null, trailTick: 0, frameId: 0,
    player: { x: .5, y: .7, tx: .5, ty: .7, r: 22, tier: 1, cargo: [], speed: .31 },
    trash: [], floaters: [], hazards: [], stations: [], nextSpawn: 0
  };

  const PHASE3 = (() => {
    const SAVE_VERSION = 6;
    const SEASON_TOTAL_XP = 3500;
    const DEFAULTS = { antenna: 'antenna-none', wheels: 'wheels-blue', trail: 'trail-white' };
    const COSMETICS = [
      { id: 'antenna-none', slot: 'antenna', name: 'Standard Bot', description: 'No antenna topper', cost: 0, color: '#5be7ef', kind: 'none' },
      { id: 'antenna-orb', slot: 'antenna', name: 'Eco Energy Orb', description: 'Soft green energy glow', cost: 450, color: '#9cff57', kind: 'orb' },
      { id: 'antenna-radar', slot: 'antenna', name: 'Sweeping Radar', description: 'Active green scanning cone', cost: 950, color: '#5be7ef', kind: 'radar' },
      { id: 'antenna-flag', slot: 'antenna', name: 'Cleanup Champion Flag', description: 'Fluttering restoration flag', cost: 1100, color: '#ffd447', kind: 'flag' },
      { id: 'wheels-blue', slot: 'wheels', name: 'City Blue Wheels', description: 'Original wheel finish', cost: 0, color: '#1f8cff', kind: 'wheel' },
      { id: 'wheels-coral', slot: 'wheels', name: 'Coral Rush Wheels', description: 'Bright coral wheel hubs', cost: 550, color: '#ff6e5b', kind: 'wheel' },
      { id: 'wheels-hover', slot: 'wheels', name: 'Sci-Fi Hover Pads', description: 'Anti-gravity levitation', cost: 1200, color: '#5be7ef', kind: 'hover' },
      { id: 'wheels-gold', slot: 'wheels', name: 'Golden Recycler Wheels', description: 'Prestige gold wheel hubs', cost: 1400, color: '#ffd447', kind: 'wheel' },
      { id: 'trail-white', slot: 'trail', name: 'Clean Air Trail', description: 'Original white trail', cost: 0, color: '#ffffff', kind: 'trail' },
      { id: 'trail-mint', slot: 'trail', name: 'Mint Spark Trail', description: 'Fresh green wheel sparks', cost: 700, color: '#63f5bb', kind: 'trail' },
      { id: 'trail-violet', slot: 'trail', name: 'Violet Comet Trail', description: 'Vivid prestige trail', cost: 1700, color: '#b58cff', kind: 'trail' }
    ];
    const byId = Object.fromEntries(COSMETICS.map((item) => [item.id, item]));

    function whole(value, max = Number.MAX_SAFE_INTEGER) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(max, Math.max(0, Math.floor(number))) : 0;
    }

    function restored() { return projects.every((project) => state.built.includes(project.id)); }

    function normalizeCosmetics(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const supplied = Array.isArray(source.unlocked) ? source.unlocked : [];
      const unlocked = [...new Set([...Object.values(DEFAULTS), ...supplied])].filter((id) => byId[id]);
      const requested = source.equipped && typeof source.equipped === 'object' ? source.equipped : {};
      const equipped = {};
      Object.keys(DEFAULTS).forEach((slot) => {
        const item = byId[requested[slot]];
        equipped[slot] = item && item.slot === slot && unlocked.includes(item.id) ? item.id : DEFAULTS[slot];
      });
      return { unlocked, equipped };
    }

    function ensureState() {
      state.daily.freezeUsed = state.daily.freezeUsed === true;
      state.daily.cycleClaims = Number.isFinite(Number(state.daily.cycleClaims)) ? Math.min(6, whole(state.daily.cycleClaims)) : whole(state.daily.streak) % 7;
      state.cosmetics = normalizeCosmetics(state.cosmetics);
      state.prestige = state.prestige && typeof state.prestige === 'object' ? state.prestige : {};
      state.prestige.unlocked = restored();
      state.prestige.enabled = state.prestige.unlocked && state.prestige.enabled === true;
      state.prestige.activeRun = state.prestige.activeRun === true;
      state.prestige.runs = whole(state.prestige.runs);
    }

    function importSave(saved) {
      const source = saved && typeof saved === 'object' ? saved : {};
      const daily = source.daily || {};
      state.daily.freezeUsed = daily.freezeUsed === true;
      state.daily.cycleClaims = Number.isFinite(Number(daily.cycleClaims)) ? Math.min(6, whole(daily.cycleClaims)) : whole(daily.streak) % 7;
      let xp = whole(state.season.xp);
      if (whole(source.version) < SAVE_VERSION) xp = Math.round(xp * .7);
      const highestClaimed = state.season.claimed.length ? Math.max(...state.season.claimed) : 0;
      state.season.xp = Math.min(SEASON_TOTAL_XP, Math.max(xp, highestClaimed * SEASON_TIER_XP));
      state.cosmetics = normalizeCosmetics(source.cosmetics);
      const prestige = source.prestige || {};
      state.prestige = { unlocked: restored(), enabled: restored() && prestige.enabled === true, activeRun: false, runs: whole(prestige.runs) };
      ensureState();
    }

    function exportSave() {
      ensureState();
      return {
        cosmetics: { unlocked: [...state.cosmetics.unlocked], equipped: { ...state.cosmetics.equipped } },
        prestige: { unlocked: state.prestige.unlocked, enabled: state.prestige.enabled, runs: state.prestige.runs }
      };
    }

    function previewCheckin() {
      const today = todayKey();
      const current = dayNumber(today);
      const previous = dayNumber(state.daily.lastClaim);
      const rewardFor = (streak) => DAILY_REWARDS[(Math.max(1, streak) - 1) % DAILY_REWARDS.length];
      if (state.daily.lastClaim === today) return { claimed: true, streak: Math.max(1, state.daily.streak), reward: state.daily.lastAmount || rewardFor(state.daily.streak), usesFreeze: false, reset: false, cycleClaims: state.daily.cycleClaims, freezeUsed: state.daily.freezeUsed };
      const gap = previous >= 0 ? current - previous : Infinity;
      let streak = 1, cycleClaims = state.daily.cycleClaims, freezeUsed = state.daily.freezeUsed, usesFreeze = false, reset = false;
      if (gap === 1 && state.daily.streak) streak = state.daily.streak + 1;
      else if (gap === 2 && state.daily.streak && !freezeUsed) { streak = state.daily.streak + 1; usesFreeze = true; freezeUsed = true; }
      else { cycleClaims = 0; freezeUsed = false; reset = Boolean(state.daily.lastClaim); }
      cycleClaims = (cycleClaims + 1) % 7;
      if (!cycleClaims) freezeUsed = false;
      return { claimed: false, streak, reward: rewardFor(streak), usesFreeze, reset, cycleClaims, freezeUsed };
    }

    function claimCheckin() {
      const preview = previewCheckin();
      if (preview.claimed) return null;
      Object.assign(state.daily, { lastClaim: todayKey(), streak: preview.streak, lastAmount: preview.reward, cycleClaims: preview.cycleClaims, freezeUsed: preview.freezeUsed });
      return preview;
    }

    function freezeLabel() {
      const preview = previewCheckin();
      if (preview.usesFreeze) return 'FREEZE SAVES TODAY';
      if (preview.reset) return 'NEW STREAK TODAY';
      return state.daily.freezeUsed ? 'FREEZE USED' : '1 FREEZE READY';
    }

    function challengeXp(index) { return [40, 60, 80][index] || 80; }
    function addSeasonXp(amount) { state.season.xp = Math.min(SEASON_TOTAL_XP, state.season.xp + whole(amount)); }
    function awardRunXp() { const amount = state.daily.progress.runs === 0 ? 75 : 25; addSeasonXp(amount); return amount; }
    function beginRun() { ensureState(); state.prestige.activeRun = state.prestige.enabled && state.prestige.unlocked; }
    function completeRun() { if (state.prestige.activeRun) state.prestige.runs += 1; state.prestige.activeRun = false; }
    function multiplier() { return state.prestige.activeRun ? 1.5 : 1; }
    function scoreGain(base) { return Math.round(base * multiplier()); }
    function salvage(score, extras) { return Math.round(score + extras * multiplier()); }
    function comboWindow(base) { return state.prestige.activeRun ? Math.max(2300, Math.round(base * .75)) : base; }
    function hazardSpeed() { return state.prestige.activeRun ? 1.2 : 1; }
    function nextLevel(normal) { return state.prestige.enabled && state.prestige.unlocked ? state.prestige.runs % LEVELS.length : normal; }
    function selected(slot) { ensureState(); return byId[state.cosmetics.equipped[slot]] || byId[DEFAULTS[slot]]; }
    function trailColor() { return selected('trail').color; }

    function unlockOrEquip(id) {
      const item = byId[id];
      if (!item || !restored() || state.paused) return;
      if (!state.cosmetics.unlocked.includes(id)) {
        if (state.wallet < item.cost) return;
        state.wallet -= item.cost;
        state.cosmetics.unlocked.push(id);
        showToast(`${item.name} unlocked!`);
        sfx('build');
      } else {
        showToast(`${item.name} equipped`);
      }
      state.cosmetics.equipped[item.slot] = id;
      saveProgress();
      renderProjects();
    }

    function togglePrestige() {
      ensureState();
      if (!state.prestige.unlocked) return;
      state.prestige.enabled = !state.prestige.enabled;
      saveProgress();
      renderProjects();
      showToast(state.prestige.enabled ? 'Prestige ready: 1.5× rewards!' : 'Prestige turned off');
    }

    function renderProgression(container) {
      ensureState();
      const section = document.createElement('section');
      section.className = 'bot-workshop';
      section.innerHTML = `<div class="workshop-title"><small>PERMANENT UPGRADES</small><strong>BOT WORKSHOP</strong></div>`;
      if (!restored()) {
        section.innerHTML += `<article class="workshop-locked"><strong>🔒 RESTORE ALL 4 AREAS</strong><small>Prestige Mode and cosmetic upgrades unlock when the world is clean.</small></article>`;
        container.appendChild(section);
        return;
      }
      const prestige = document.createElement('article');
      prestige.className = `prestige-card${state.prestige.enabled ? ' active' : ''}`;
      prestige.innerHTML = `<div><strong>PRESTIGE CLEANUP</strong><small>1.5× rewards · hazards +20% · faster chains · ${state.prestige.runs} runs</small></div><button type="button">${state.prestige.enabled ? 'ON ✓' : 'TURN ON'}</button>`;
      prestige.querySelector('button').addEventListener('click', togglePrestige);
      section.appendChild(prestige);
      ['antenna', 'wheels', 'trail'].forEach((slot) => {
        const label = document.createElement('h3');
        label.textContent = { antenna: 'ANTENNA TOPPERS', wheels: 'WHEELS & HOVER PADS', trail: 'PARTICLE TRAILS' }[slot];
        const grid = document.createElement('div');
        grid.className = 'cosmetic-grid';
        COSMETICS.filter((item) => item.slot === slot).forEach((item) => {
          const owned = state.cosmetics.unlocked.includes(item.id);
          const equipped = state.cosmetics.equipped[slot] === item.id;
          const card = document.createElement('article');
          card.className = `cosmetic-card${equipped ? ' equipped' : ''}`;
          card.innerHTML = `<i class="cosmetic-swatch ${item.kind}" style="--cosmetic:${item.color}"></i><div><strong>${item.name}</strong><small>${item.description}</small></div><button type="button" ${equipped || (!owned && state.wallet < item.cost) ? 'disabled' : ''}>${equipped ? 'EQUIPPED ✓' : owned ? 'EQUIP' : `♻ ${item.cost}`}</button>`;
          card.querySelector('button').addEventListener('click', () => unlockOrEquip(item.id));
          grid.appendChild(card);
        });
        section.append(label, grid);
      });
      container.appendChild(section);
    }

    function canvasRoundedRect(context, x, y, width, height, radius) {
      context.beginPath();
      if (context.roundRect) { context.roundRect(x, y, width, height, radius); return; }
      const r = Math.min(radius, width / 2, height / 2);
      context.moveTo(x + r, y); context.arcTo(x + width, y, x + width, y + height, r); context.arcTo(x + width, y + height, x, y + height, r); context.arcTo(x, y + height, x, y, r); context.arcTo(x, y, x + width, y, r); context.closePath();
    }

    function drawRobotBack(context, x, y, base, now) {
      const wheel = selected('wheels');
      context.save();
      [-1, 1].forEach((side) => {
        const wheelX = x + side * base * .87, wheelY = y + base * .35;
        if (wheel.kind === 'hover') {
          const pulse = 1 + Math.sin(now / 120) * .15, padY = wheelY - base * .15;
          const thrust = context.createLinearGradient(0, padY, 0, padY + base * .7);
          thrust.addColorStop(0, wheel.color); thrust.addColorStop(1, 'rgba(91,231,239,0)');
          context.fillStyle = thrust; canvasRoundedRect(context, wheelX - base * .2, padY, base * .4, base * .8, base * .2); context.fill();
          context.fillStyle = '#10253b'; context.beginPath(); context.ellipse(wheelX, padY, base * .28, base * .12, 0, 0, Math.PI * 2); context.fill();
          context.fillStyle = '#fff'; context.beginPath(); context.ellipse(wheelX, padY, base * .15 * pulse, base * .06 * pulse, 0, 0, Math.PI * 2); context.fill();
        } else {
          context.fillStyle = '#10253b'; canvasRoundedRect(context, wheelX - base * .24, wheelY - base * .42, base * .48, base * .84, base * .2); context.fill();
          context.fillStyle = wheel.color; canvasRoundedRect(context, wheelX - base * .14, wheelY - base * .29, base * .28, base * .58, base * .12); context.fill();
          context.fillStyle = 'rgba(255,255,255,.42)'; canvasRoundedRect(context, wheelX - base * .07, wheelY - base * .21, base * .08, base * .23, base * .04); context.fill();
        }
      });
      context.restore();
    }

    function drawRobotFront(context, x, y, base, now) {
      const antenna = selected('antenna');
      if (antenna.kind === 'none') return;
      const mastTop = y - base * 1.62;
      context.save(); context.strokeStyle = '#10253b'; context.lineWidth = Math.max(2, base * .1); context.lineCap = 'round'; context.beginPath(); context.moveTo(x, y - base * 1.03); context.lineTo(x, mastTop); context.stroke();
      if (antenna.kind === 'orb') {
        const radius = base * .22 * (1 + Math.sin(now / 180) * .08), glow = context.createRadialGradient(x, mastTop, 0, x, mastTop, radius * 2.3);
        glow.addColorStop(0, '#fff'); glow.addColorStop(.3, antenna.color); glow.addColorStop(1, 'rgba(156,255,87,0)'); context.fillStyle = glow; context.beginPath(); context.arc(x, mastTop, radius * 2.3, 0, Math.PI * 2); context.fill();
        context.fillStyle = antenna.color; context.strokeStyle = '#10253b'; context.lineWidth = 2; context.beginPath(); context.arc(x, mastTop, radius, 0, Math.PI * 2); context.fill(); context.stroke();
      }
      if (antenna.kind === 'flag') {
        const flutter = Math.sin(now / 130) * base * .05; context.fillStyle = antenna.color; context.strokeStyle = '#10253b'; context.lineWidth = 2; context.beginPath(); context.moveTo(x, mastTop); context.lineTo(x + base * .62, mastTop + base * .12 + flutter); context.lineTo(x, mastTop + base * .33); context.closePath(); context.fill(); context.stroke();
      }
      if (antenna.kind === 'radar') {
        const sweep = Math.sin(now / 350) * Math.PI / 3;
        context.save(); context.translate(x, mastTop); context.rotate(sweep - Math.PI / 2); context.fillStyle = 'rgba(91,231,239,.3)'; context.beginPath(); context.moveTo(0, 0); context.arc(0, 0, base * 1.2, -Math.PI / 5, Math.PI / 5); context.closePath(); context.fill(); context.restore();
        context.save(); context.translate(x, mastTop); context.rotate(sweep); context.fillStyle = '#10253b'; context.beginPath(); context.arc(0, 0, base * .25, 0, Math.PI, true); context.fill(); context.restore();
        context.fillStyle = Math.sin(now / 120) > 0 ? '#ff6e5b' : '#10253b'; context.beginPath(); context.arc(x, mastTop, base * .08, 0, Math.PI * 2); context.fill();
      }
      context.restore();
    }

    return { SAVE_VERSION, SEASON_TOTAL_XP, importSave, exportSave, previewCheckin, claimCheckin, freezeLabel, challengeXp, addSeasonXp, awardRunXp, beginRun, completeRun, scoreGain, salvage, comboWindow, hazardSpeed, nextLevel, renderProgression, trailColor, drawRobotBack, drawRobotFront };
  })();

  const PARTICLE_POOL = (() => {
    const particles = Array.from({ length: 80 }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, color: '#fff', life: 0
    }));
    let cursor = 0;

    function acquire() {
      for (let offset = 0; offset < particles.length; offset += 1) {
        const index = (cursor + offset) % particles.length;
        if (!particles[index].active) {
          cursor = (index + 1) % particles.length;
          return particles[index];
        }
      }
      const particle = particles[cursor];
      cursor = (cursor + 1) % particles.length;
      return particle;
    }

    function spawn(x, y, vx, vy, color, life) {
      const particle = acquire();
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
      particle.color = color;
      particle.life = life;
    }

    function reset() {
      for (let index = 0; index < particles.length; index += 1) particles[index].active = false;
      cursor = 0;
    }

    function update(dt) {
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (!particle.active) continue;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        if (particle.life <= 0) particle.active = false;
      }
    }

    function draw(context, width, height) {
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (!particle.active) continue;
        context.globalAlpha = Math.min(1, particle.life * 2);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x * width, particle.y * height, 4 + particle.life * 4, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    return { capacity: particles.length, draw, reset, spawn, update };
  })();

  const LOCAL_SAVE_KEY = 'clean-city-save';
  const MAX_CLOUD_SAVE_BYTES = 3000000;
  const resumeQueue = [];
  let cloudLoadSucceeded = false;
  let saveSequence = Promise.resolve(false);

  function isPlayables() { return window.ytgame?.IN_PLAYABLES_ENV === true; }

  function getLevelIndex() {
    const firstUnrestored = projects.findIndex((project) => !state.built.includes(project.id));
    const normal = firstUnrestored === -1 ? LEVELS.length - 1 : Math.min(firstUnrestored, LEVELS.length - 1);
    return PHASE3.nextLevel(normal);
  }

  function currentLevel() { return LEVELS[state.levelIndex] || LEVELS[0]; }

  function updateLevelCopy() {
    state.levelIndex = getLevelIndex();
    const level = currentLevel();
    const step = `AREA ${state.levelIndex + 1} OF ${LEVELS.length}`;
    ui.homeAreaLabel.textContent = `${step} · ${level.name.toUpperCase()}`;
    ui.missionName.textContent = level.mission;
    ui.missionSub.textContent = `60-second ${level.name.toLowerCase()} cleanup`;
    ui.briefAreaStep.textContent = `${step} · CLEANUP CONTRACT`;
    ui.briefTitle.innerHTML = level.title;
    ui.briefGoal.innerHTML = `<strong>GOAL:</strong> Sort ${level.goal} ${level.target}. Collect any bright junk, then deliver it to the same-color depot.`;
    ['paper', 'plastic', 'metal'].forEach((type) => ui[`brief${type[0].toUpperCase()}${type.slice(1)}`].classList.toggle('contract-target', type === level.contractType));
    ui.resultAreaLabel.textContent = `${level.name.toUpperCase()} · SHIFT COMPLETE`;
    ui.rebuildAreaLabel.textContent = state.built.length === projects.length ? 'WORLD RESTORED' : 'WORLD RESTORATION';
    if (state.prestige.enabled && state.prestige.unlocked) {
      ui.homeAreaLabel.textContent = `PRESTIGE · ${level.name.toUpperCase()}`;
      ui.missionSub.textContent = '1.5× rewards · faster hazards · tighter chains';
      ui.briefAreaStep.textContent = `PRESTIGE CLEANUP · ${level.name.toUpperCase()}`;
    }
  }

  function suspendAudio() {
    if (state.audioContext?.state === 'running') state.audioContext.suspend().catch(() => {});
  }

  const AUDIO_DEBUG = typeof window.location?.search === 'string' && window.location.search.includes('audio-debug=1');

  function audioDebug(event, details = {}) {
    if (!AUDIO_DEBUG) return;
    try { console.info(`[audio-debug] ${event} ${JSON.stringify(details)}`); } catch (_) {}
  }

  function resumeAudio() {
    if (state.audioEnabled && !state.paused && state.audioContext?.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
  }

  function runAfterResume(callback) {
    if (state.paused) resumeQueue.push(callback);
    else callback();
  }

  function setupAudio() {
    if (window.ytgame?.system?.isAudioEnabled) {
      try { state.audioEnabled = window.ytgame.system.isAudioEnabled() !== false; } catch (_) { state.audioEnabled = true; }
    }
    audioDebug('setup', {
      inPlayables: window.ytgame?.IN_PLAYABLES_ENV === true,
      enabled: state.audioEnabled,
      constructor: !!(window.AudioContext || window.webkitAudioContext)
    });
    if (window.ytgame?.system?.onAudioEnabledChange) {
      window.ytgame.system.onAudioEnabledChange((enabled) => {
        if (enabled !== true && enabled !== false) {
          audioDebug('audio-change-ignored', { value: String(enabled) });
          return;
        }
        state.audioEnabled = enabled;
        if (state.audioEnabled) resumeAudio();
        else suspendAudio();
      });
    }
  }

  function unlockAudio() {
    if (!state.audioEnabled) { audioDebug('unlock-blocked', { reason: 'disabled' }); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { audioDebug('unlock-blocked', { reason: 'unsupported' }); return; }
    if (!state.audioContext) {
      try { state.audioContext = new AudioContext(); }
      catch (error) { audioDebug('context-error', { message: String(error?.message || error) }); return; }
    }
    BACKGROUND_MUSIC.attach(state.audioContext);
    audioDebug('context-ready', { state: state.audioContext.state });
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume()
        .then(() => audioDebug('context-resumed', { state: state.audioContext.state }))
        .catch((error) => audioDebug('resume-error', { message: String(error?.message || error) }));
    }
  }

  function sfx(name) {
    const audio = state.audioContext;
    if (!state.audioEnabled || state.paused || !audio || audio.state !== 'running') {
      if (name === 'start') audioDebug('sfx-blocked', { name, enabled: state.audioEnabled, paused: state.paused, context: audio?.state || 'missing' });
      return;
    }
    const notes = {
      start: [330, 494], pickup: [520], rare: [660, 990], sort: [390, 585],
      contract: [440, 660, 880], spill: [180, 120], reward: [523, 784, 1047],
      finish: [392, 523, 659], build: [330, 494, 659]
    }[name] || [440];
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * .065;
      oscillator.type = name === 'spill' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(name === 'spill' ? .11 : .08, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .12);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + .13);
    });
  }

  // Original procedural score: oscillator synthesis only, with no samples or external music assets.
  const BACKGROUND_MUSIC = (() => {
    const CHORDS = [
      { root: 130.81, tones: [0, 4, 7, 12] },
      { root: 110.00, tones: [0, 3, 7, 12] },
      { root: 87.31, tones: [0, 4, 7, 12] },
      { root: 98.00, tones: [0, 4, 7, 12] }
    ];
    const ARP = [0, 2, 1, 3, 2, 1, 3, 1];
    const activeNodes = new Set();
    let audio = null;
    let musicBus = null;
    let active = false;
    let nextStepAt = 0;
    let step = 0;
    let currentVolume = .0001;

    function attach(context) {
      if (!context || audio === context) return;
      stopVoices();
      audio = context;
      musicBus = audio.createGain();
      musicBus.gain.setValueAtTime(.0001, audio.currentTime);
      musicBus.connect(audio.destination);
      nextStepAt = 0;
      step = 0;
      currentVolume = .0001;
    }

    function frequency(root, semitones, octave = 0) {
      return root * Math.pow(2, semitones / 12 + octave);
    }

    function voice(freq, when, duration, type, volume, attack = .012) {
      if (!audio || !musicBus) return;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, when);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + attack);
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(gain).connect(musicBus);
      activeNodes.add(oscillator);
      oscillator.onended = () => {
        activeNodes.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(when);
      oscillator.stop(when + duration + .02);
    }

    function scheduleStep(when, index, rush) {
      const chord = CHORDS[Math.floor(index / 8) % CHORDS.length];
      const chordStep = index % 8;
      const stepLength = 60 / (rush ? 124 : 112) / 2;
      const arpTone = chord.tones[ARP[chordStep]];

      voice(frequency(chord.root, arpTone, 1), when, stepLength * .68, 'triangle', rush ? .022 : .018);
      if (chordStep % 2 === 0) voice(chord.root / 2, when, stepLength * 1.45, 'sine', .022, .02);
      if (chordStep === 3 || chordStep === 7) {
        voice(frequency(chord.root, chord.tones[(chordStep + 1) % 4], 2), when, stepLength * .42, 'sine', rush ? .012 : .008);
      }
      if (chordStep === 0) {
        chord.tones.slice(0, 3).forEach((tone, toneIndex) => {
          voice(frequency(chord.root, tone), when + toneIndex * .012, stepLength * 6.6, 'sine', .0055, .16);
        });
      }
      return stepLength;
    }

    function start() {
      active = true;
      if (audio) nextStepAt = Math.max(nextStepAt, audio.currentTime + .05);
    }

    function stopVoices() {
      activeNodes.forEach((node) => {
        try { node.stop(); } catch (_) {}
      });
      activeNodes.clear();
    }

    function stop() {
      active = false;
      stopVoices();
      if (audio && musicBus) {
        musicBus.gain.cancelScheduledValues(audio.currentTime);
        musicBus.gain.setValueAtTime(.0001, audio.currentTime);
        currentVolume = .0001;
      }
      nextStepAt = 0;
      step = 0;
    }

    function update(runLeft) {
      if (!active || !audio || !musicBus || !state.audioEnabled || state.paused || audio.state !== 'running') return;
      const rush = runLeft <= 15;
      const now = audio.currentTime;
      if (!nextStepAt || nextStepAt < now - .1) nextStepAt = now + .05;
      const targetVolume = rush ? .075 : .058;
      if (targetVolume !== currentVolume) {
        musicBus.gain.cancelScheduledValues(now);
        musicBus.gain.setTargetAtTime(targetVolume, now, .18);
        currentVolume = targetVolume;
      }
      while (nextStepAt < now + .35) {
        nextStepAt += scheduleStep(nextStepAt, step, rush);
        step = (step + 1) % 32;
      }
    }

    return { attach, start, stop, update };
  })();

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function monthKey() { return todayKey().slice(0, 7); }

  function dayNumber(key) {
    const parts = String(key || '').split('-').map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000) : -1;
  }

  function ensureRetentionState() {
    const today = todayKey();
    if (!state.daily.progress || state.daily.progress.date !== today) {
      state.daily.progress = { date: today, sorted: 0, runs: 0, contracts: 0, bestCombo: 0, score: 0 };
      state.daily.claimed = [];
    }
    if (state.season.id !== monthKey()) state.season = { id: monthKey(), xp: 0, claimed: [], boostDate: '' };
  }

  function projectedStreak() {
    return PHASE3.previewCheckin().streak;
  }

  function checkinReward() {
    return PHASE3.previewCheckin().reward;
  }

  function dailyChallenges() {
    const seed = Math.max(0, dayNumber(todayKey()));
    const sortedTarget = [12, 15, 18][seed % 3];
    const rotating = [
      { id: 'contract', icon: '🏆', title: 'Finish a color contract', key: 'contracts', target: 1, reward: 70 },
      { id: 'combo', icon: '⚡', title: `Reach a ×${3 + (seed % 2)} chain`, key: 'bestCombo', target: 3 + (seed % 2), reward: 70 },
      { id: 'score', icon: '⭐', title: `Earn ${180 + (seed % 3) * 20} points`, key: 'score', target: 180 + (seed % 3) * 20, reward: 70 }
    ][seed % 3];
    return [
      { id: 'sort', icon: '♻', title: `Sort ${sortedTarget} pieces of junk`, key: 'sorted', target: sortedTarget, reward: 50, xp: PHASE3.challengeXp(0), difficulty: 'EASY' },
      { id: 'runs', icon: '🤖', title: 'Complete 2 cleanup runs', key: 'runs', target: 2, reward: 60, xp: PHASE3.challengeXp(1), difficulty: 'MEDIUM' },
      { ...rotating, xp: PHASE3.challengeXp(2), difficulty: 'HARD' }
    ];
  }

  function challengeValue(challenge) { return Math.max(0, Number(state.daily.progress[challenge.key]) || 0); }

  function addSeasonXp(amount) { PHASE3.addSeasonXp(amount); }

  function seasonName() {
    const date = new Date(`${state.season.id || monthKey()}-01T00:00:00Z`);
    return `${date.toLocaleString('en', { month: 'long', timeZone: 'UTC' }).toUpperCase()} GREEN SEASON`;
  }

  function updateDailyBadge() {
    ensureRetentionState();
    const freeClaims = (state.daily.lastClaim === todayKey() ? 0 : 1)
      + dailyChallenges().filter((challenge) => challengeValue(challenge) >= challenge.target && !state.daily.claimed.includes(challenge.id)).length
      + SEASON_REWARDS.filter((_, index) => state.season.xp >= (index + 1) * SEASON_TIER_XP && !state.season.claimed.includes(index + 1)).length;
    ui.dailyBadge.textContent = freeClaims ? String(Math.min(9, freeClaims)) : '✓';
    ui.dailyBadge.classList.toggle('quiet', freeClaims === 0);
  }

  function renderRewards() {
    ensureRetentionState();
    const today = todayKey();
    const claimedToday = state.daily.lastClaim === today;
    const streak = projectedStreak();
    const activeDay = (Math.max(1, streak) - 1) % DAILY_REWARDS.length;
    ui.dailyStreak.textContent = `DAY ${streak} STREAK · ${PHASE3.freezeLabel()}`;
    ui.dailyRewardValue.textContent = checkinReward();
    ui.streakTrack.innerHTML = '';
    DAILY_REWARDS.forEach((reward, index) => {
      const day = document.createElement('div');
      const completedInCycle = claimedToday && index <= activeDay;
      day.className = `streak-day${completedInCycle ? ' done' : ''}${index === activeDay ? ' current' : ''}`;
      day.innerHTML = `<span>DAY ${index + 1}</span><strong>♻ ${reward}</strong>`;
      ui.streakTrack.appendChild(day);
    });
    ui.dailyClaimButton.disabled = claimedToday;
    ui.dailyClaimButton.textContent = claimedToday ? 'CLAIMED TODAY ✓' : `CLAIM ♻ ${checkinReward()} + 20 XP`;
    ui.dailyDoubleButton.disabled = !claimedToday || state.daily.doubleDate === today;
    ui.dailyDoubleButton.querySelector('strong').textContent = state.daily.doubleDate === today ? 'DAILY BONUS CLAIMED ✓' : "DOUBLE TODAY'S REWARD";

    ui.dailyChallenges.innerHTML = '';
    dailyChallenges().forEach((challenge) => {
      const value = Math.min(challenge.target, challengeValue(challenge));
      const complete = value >= challenge.target;
      const claimed = state.daily.claimed.includes(challenge.id);
      const card = document.createElement('article');
      card.className = `challenge-card${complete ? ' complete' : ''}`;
      card.innerHTML = `<span class="challenge-icon" aria-hidden="true">${challenge.icon}</span><div><strong>${challenge.title}</strong><small>${challenge.difficulty} · ${value}/${challenge.target} · reward ♻ ${challenge.reward} + ${challenge.xp} XP</small></div><button class="challenge-claim" type="button" ${(!complete || claimed) ? 'disabled' : ''}>${claimed ? 'CLAIMED ✓' : complete ? 'CLAIM' : 'IN PROGRESS'}</button>`;
      card.querySelector('button').addEventListener('click', () => claimChallenge(challenge.id));
      ui.dailyChallenges.appendChild(card);
    });

    ui.seasonTitle.textContent = seasonName();
    ui.seasonXpText.textContent = `${state.season.xp} / ${SEASON_REWARDS.length * SEASON_TIER_XP} XP`;
    ui.seasonFill.style.width = `${Math.min(100, state.season.xp / (SEASON_REWARDS.length * SEASON_TIER_XP) * 100)}%`;
    ui.seasonTrack.innerHTML = '';
    SEASON_REWARDS.forEach((reward, index) => {
      const tier = index + 1;
      const unlocked = state.season.xp >= tier * SEASON_TIER_XP;
      const claimed = state.season.claimed.includes(tier);
      const node = document.createElement('div');
      node.className = `season-tier${unlocked ? '' : ' locked'}${claimed ? ' claimed' : ''}`;
      node.innerHTML = `<span>TIER ${tier}</span><strong>♻ ${reward}</strong><button type="button" ${(!unlocked || claimed) ? 'disabled' : ''}>${claimed ? '✓' : unlocked ? 'CLAIM' : `${tier * SEASON_TIER_XP} XP`}</button>`;
      node.querySelector('button').addEventListener('click', () => claimSeasonTier(tier));
      ui.seasonTrack.appendChild(node);
    });
    ui.seasonBoostButton.disabled = state.season.boostDate === today || state.season.xp >= SEASON_REWARDS.length * SEASON_TIER_XP;
    ui.seasonBoostButton.querySelector('strong').textContent = state.season.boostDate === today ? 'TODAY\'S XP BOOST CLAIMED ✓' : 'SEASON XP BOOST';
    updateDailyBadge();
  }

  function openRewards() {
    if (state.paused) return;
    renderRewards();
    showScreen('rewards');
  }

  function closeRewards() { if (!state.paused) showScreen('start'); }

  function claimDaily() {
    ensureRetentionState();
    const claim = PHASE3.claimCheckin();
    if (!claim) return;
    state.wallet += claim.reward;
    addSeasonXp(20);
    sfx('reward');
    showToast(claim.usesFreeze ? `Streak saved! +${claim.reward} salvage` : `Daily reward: +${claim.reward} salvage`);
    saveProgress();
    renderRewards();
  }

  function doubleDaily() {
    const today = todayKey();
    if (state.daily.lastClaim !== today || state.daily.doubleDate === today) return;
    requestReward('double-daily-check-in', () => {
      state.daily.doubleDate = today;
      state.wallet += Math.max(0, state.daily.lastAmount || checkinReward());
      renderRewards();
    }, ui.dailyDoubleButton);
  }

  function claimChallenge(id) {
    ensureRetentionState();
    const challenge = dailyChallenges().find((item) => item.id === id);
    if (!challenge || state.daily.claimed.includes(id) || challengeValue(challenge) < challenge.target) return;
    state.daily.claimed.push(id);
    state.wallet += challenge.reward;
    addSeasonXp(challenge.xp);
    sfx('reward');
    showToast(`Challenge complete: +${challenge.reward} salvage`);
    saveProgress();
    renderRewards();
  }

  function claimSeasonTier(tier) {
    ensureRetentionState();
    const reward = SEASON_REWARDS[tier - 1];
    if (!reward || state.season.xp < tier * SEASON_TIER_XP || state.season.claimed.includes(tier)) return;
    state.season.claimed.push(tier);
    state.wallet += reward;
    sfx('reward');
    showToast(`Green Season tier ${tier}: +${reward} salvage`);
    saveProgress();
    renderRewards();
  }

  function boostSeason() {
    ensureRetentionState();
    const today = todayKey();
    if (state.season.boostDate === today || state.season.xp >= SEASON_REWARDS.length * SEASON_TIER_XP) return;
    requestReward('green-season-xp-boost-100', () => {
      state.season.boostDate = today;
      addSeasonXp(100);
      renderRewards();
    }, ui.seasonBoostButton);
  }

  function applySave(saved) {
    state.wallet = Math.max(0, Number(saved?.wallet) || 0);
    state.built = Array.isArray(saved?.built) ? saved.built.filter((id) => projects.some((p) => p.id === id)) : [];
    state.bestScore = Math.max(0, Number(saved?.bestScore) || 0);
    state.totalRuns = Math.max(0, Number(saved?.totalRuns) || 0);
    state.tutorialSeen = saved?.tutorialSeen === true;
    const daily = saved?.daily || {};
    state.daily = {
      lastClaim: typeof daily.lastClaim === 'string' ? daily.lastClaim : '',
      streak: Math.max(0, Number(daily.streak) || 0),
      lastAmount: Math.max(0, Number(daily.lastAmount) || 0),
      doubleDate: typeof daily.doubleDate === 'string' ? daily.doubleDate : '',
      progress: daily.progress && typeof daily.progress === 'object' ? { ...daily.progress } : state.daily.progress,
      claimed: Array.isArray(daily.claimed) ? daily.claimed.filter((id) => typeof id === 'string') : []
    };
    const season = saved?.season || {};
    state.season = {
      id: typeof season.id === 'string' ? season.id : '',
      xp: Math.max(0, Number(season.xp) || 0),
      claimed: Array.isArray(season.claimed) ? season.claimed.map(Number).filter((tier) => tier >= 1 && tier <= SEASON_REWARDS.length) : [],
      boostDate: typeof season.boostDate === 'string' ? season.boostDate : ''
    };
    PHASE3.importSave(saved);
    ensureRetentionState();
  }

  function defaultSaveData() {
    return {
      version: PHASE3.SAVE_VERSION,
      wallet: 0,
      built: [],
      bestScore: 0,
      totalRuns: 0,
      tutorialSeen: false,
      daily: {},
      season: {},
      cosmetics: {},
      prestige: {}
    };
  }

  function parseSaveString(raw) {
    if (raw == null || raw === '') return defaultSaveData();
    if (typeof raw !== 'string') throw new TypeError('Save payload must be a string');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Save payload must be an object');
    return parsed;
  }

  function currentSaveData() {
    return {
      version: PHASE3.SAVE_VERSION,
      wallet: state.wallet,
      built: state.built,
      bestScore: state.bestScore,
      totalRuns: state.totalRuns,
      tutorialSeen: state.tutorialSeen,
      daily: state.daily,
      season: state.season,
      ...PHASE3.exportSave()
    };
  }

  async function loadProgress() {
    let saved = defaultSaveData();
    if (isPlayables()) {
      if (window.ytgame?.game?.loadData) {
        let remote = '';
        try {
          remote = await window.ytgame.game.loadData();
          cloudLoadSucceeded = true;
        } catch (_) {
          cloudLoadSucceeded = false;
          window.ytgame?.health?.logWarning?.();
        }
        if (cloudLoadSucceeded) {
          try { saved = parseSaveString(remote); }
          catch (_) { saved = defaultSaveData(); window.ytgame?.health?.logWarning?.(); }
        }
      }
    } else {
      try { saved = parseSaveString(localStorage.getItem(LOCAL_SAVE_KEY)); }
      catch (_) { saved = defaultSaveData(); }
    }
    try { applySave(saved); }
    catch (_) { applySave(defaultSaveData()); window.ytgame?.health?.logWarning?.(); }
    state.saveLoaded = true;
    updateHomeProgress();
    ui.bestScore.textContent = state.bestScore.toLocaleString();
  }

  function saveProgress() {
    if (!state.saveLoaded) return Promise.resolve(false);
    let payload = '';
    try {
      payload = JSON.stringify(currentSaveData());
      const wellFormed = typeof payload.isWellFormed !== 'function' || payload.isWellFormed();
      if (!wellFormed || payload.length * 2 > MAX_CLOUD_SAVE_BYTES) throw new RangeError('Save payload is invalid or too large');
    } catch (_) {
      window.ytgame?.health?.logError?.();
      return Promise.resolve(false);
    }

    if (isPlayables()) {
      if (!cloudLoadSucceeded || !window.ytgame?.game?.saveData) return Promise.resolve(false);
      saveSequence = saveSequence.catch(() => false).then(async () => {
        try { await window.ytgame.game.saveData(payload); return true; }
        catch (_) { window.ytgame?.health?.logWarning?.(); return false; }
      });
      return saveSequence;
    }

    try { localStorage.setItem(LOCAL_SAVE_KEY, payload); return Promise.resolve(true); }
    catch (_) { return Promise.resolve(false); }
  }

  function updateHomeProgress() {
    const progress = Math.round((state.built.length / projects.length) * 100);
    ui.homeProgressText.textContent = `${progress}%`;
    ui.homeProgressFill.style.width = `${progress}%`;
    ui.bestScore.textContent = state.bestScore.toLocaleString();
    updateLevelCopy();
    updateDailyBadge();
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = innerWidth;
    state.height = innerHeight;
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    setStations();
  }

  function setStations() {
    const landscape = state.width > state.height;
    if (landscape) {
      state.stations = [
        { type: 'paper', x: .06, y: .28, w: .1, h: .24 },
        { type: 'plastic', x: .06, y: .57, w: .1, h: .24 },
        { type: 'metal', x: .84, y: .42, w: .1, h: .24 }
      ];
    } else {
      state.stations = [
        { type: 'paper', x: .08, y: .29, w: .24, h: .085 },
        { type: 'plastic', x: .38, y: .29, w: .24, h: .085 },
        { type: 'metal', x: .68, y: .29, w: .24, h: .085 }
      ];
    }
  }

  function showScreen(name) {
    ['start', 'tutorial', 'brief', 'result', 'rebuild', 'rewards'].forEach((key) => ui[key].classList.toggle('hidden', key !== name));
    const playing = name === 'playing';
    ui.hud.classList.toggle('hidden', !playing);
    ui.contractBar.classList.toggle('hidden', !playing);
    ui.magnetButton.classList.toggle('hidden', !playing);
    ui.recoveryButton.classList.add('hidden');
    ui.guideBar.classList.add('hidden');
    state.mode = name;
    if (playing) BACKGROUND_MUSIC.start();
    else BACKGROUND_MUSIC.stop();
  }

  function openTutorial() {
    if (state.paused) return;
    showScreen('tutorial');
  }

  function finishTutorial() {
    state.tutorialSeen = true;
    saveProgress();
    prepareBrief();
  }

  function prepareBrief() {
    updateLevelCopy();
    state.vipContract = false;
    state.rewardUsed.bonus = false;
    ui.bonusButton.disabled = false;
    ui.bonusButton.classList.remove('claimed');
    ui.bonusButton.querySelector('strong').textContent = 'VIP CLEANUP CONTRACT';
    ui.bonusButton.querySelector('small').textContent = '+60 salvage if you finish · rewarded ad';
    showScreen('brief');
  }

  function prepareRun() {
    updateLevelCopy();
    const level = currentLevel();
    state.contractType = level.contractType;
    state.contractGoal = level.goal;
    state.runLeft = 60;
    state.score = 0;
    state.earned = 0;
    state.sorted = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.comboExpires = 0;
    state.guideUntil = performance.now() + 18000;
    state.deposits = 0;
    state.contractCount = 0;
    state.contractAwarded = false;
    state.doubled = false;
    state.magnetUntil = 0;
    state.rewardUsed.magnet = false;
    state.rewardUsed.recovery = false;
    state.rewardUsed.supply = false;
    state.lostCargo = [];
    state.recoveryUntil = 0;
    state.lastHazardHit = 0;
    state.shakeUntil = 0;
    state.player = { x: .5, y: .72, tx: .5, ty: .72, r: 22, tier: 1, cargo: [], speed: .31 };
    state.trash = [];
    PARTICLE_POOL.reset();
    state.floaters = [];
    state.hazards = [
      { x: .27, y: .48, ox: .27, oy: .48, r: .065, phase: 0, label: level.hazard },
      { x: .72, y: .68, ox: .72, oy: .68, r: .07, phase: 2.1, label: level.hazard },
      { x: .54, y: state.width > state.height ? .34 : .54, ox: .54, oy: state.width > state.height ? .34 : .54, r: .052, phase: 4.4, label: level.hazard }
    ];
    for (let i = 0; i < 34; i++) spawnTrash();
    updateHud();
  }

  function startRun() {
    if (state.paused) return;
    prepareRun();
    PHASE3.beginRun();
    showScreen('playing');
    state.last = performance.now();
    unlockAudio();
    sfx('start');
  }

  function capacity() { return [0, 8, 12, 16][state.player.tier]; }

  function spawnTrash() {
    const values = Object.keys(TYPES);
    const type = Math.random() < .45 ? state.contractType : values[Math.floor(Math.random() * values.length)];
    let x, y;
    const minY = state.width > state.height ? .28 : .40;
    do {
      x = .12 + Math.random() * .76;
      y = minY + Math.random() * (.91 - minY);
    } while (Math.hypot(x - state.player.x, y - state.player.y) < .15);
    const size = Math.random() < .16 ? 2 : 1;
    const rare = Math.random() < .07;
    state.trash.push({ type, x, y, size, rare, rot: Math.random() * Math.PI * 2, bob: Math.random() * 6.28 });
  }

  async function requestReward(id, grant, sourceButton) {
    if (state.adBusy || state.paused) return false;
    const wasDisabled = sourceButton?.disabled === true;
    state.adBusy = true;
    if (sourceButton) {
      sourceButton.disabled = true;
      sourceButton.setAttribute('aria-busy', 'true');
    }
    let authorized = false;
    try {
      let earned = false;
      if (isPlayables() && window.ytgame?.ads?.requestRewardedAd) {
        earned = await window.ytgame.ads.requestRewardedAd(id) === true;
      } else {
        showToast('Demo ad · reward incoming');
        await new Promise((resolve) => setTimeout(resolve, 420));
        earned = true;
      }
      if (earned) {
        authorized = true;
        runAfterResume(() => {
          try {
            grant();
            state.lastRewardAt = Date.now();
            sfx('reward');
            showToast('Reward unlocked!');
            void saveProgress();
          } catch (_) {
            if (sourceButton) sourceButton.disabled = wasDisabled;
            window.ytgame?.health?.logError?.();
            showToast('Reward could not be applied — please try again');
          }
        });
        return true;
      }
      runAfterResume(() => showToast('Reward not completed'));
      return false;
    } catch (_) {
      runAfterResume(() => showToast('Ad unavailable — keep playing!'));
      return false;
    } finally {
      state.adBusy = false;
      if (sourceButton) {
        sourceButton.removeAttribute('aria-busy');
        if (!authorized) sourceButton.disabled = wasDisabled;
      }
    }
  }

  function activateBonusContract() {
    if (state.paused || state.rewardUsed.bonus) return;
    requestReward('vip-cleanup-contract-60-salvage', () => {
      state.rewardUsed.bonus = true;
      state.vipContract = true;
      ui.bonusButton.disabled = true;
      ui.bonusButton.classList.add('claimed');
      ui.bonusButton.querySelector('strong').textContent = 'VIP CONTRACT ACTIVE ✓';
      ui.bonusButton.querySelector('small').textContent = `Finish the ${currentLevel().name} goal for +60 salvage`;
    }, ui.bonusButton);
  }

  function activateMagnet() {
    if (state.paused || state.rewardUsed.magnet || performance.now() < state.magnetUntil) return;
    requestReward('super-magnet-12-seconds', () => {
      state.rewardUsed.magnet = true;
      state.magnetUntil = performance.now() + 12000;
      ui.magnetButton.disabled = true;
    }, ui.magnetButton);
  }

  function recoverCargo() {
    if (state.paused || state.rewardUsed.recovery || !state.lostCargo.length || performance.now() > state.recoveryUntil) return;
    requestReward('recover-spilled-cargo', () => {
      const room = capacity() - state.player.cargo.length;
      state.player.cargo.push(...state.lostCargo.slice(0, room));
      state.lostCargo = [];
      state.rewardUsed.recovery = true;
      ui.recoveryButton.classList.add('hidden');
      burst(state.player.x, state.player.y, '#ff6e5b', 18);
    }, ui.recoveryButton);
  }

  function endRun() {
    const contractBonus = state.contractAwarded ? 45 + (state.vipContract ? 60 : 0) : 0;
    const prestigeRun = state.prestige.activeRun;
    state.earned = PHASE3.salvage(state.score, Math.floor(state.sorted * 2) + contractBonus);
    state.wallet += state.earned;
    state.totalRuns += 1;
    ensureRetentionState();
    const runXp = PHASE3.awardRunXp();
    state.daily.progress.runs += 1;
    state.daily.progress.sorted += state.sorted;
    state.daily.progress.score += state.score;
    state.daily.progress.contracts += state.contractAwarded ? 1 : 0;
    state.daily.progress.bestCombo = Math.max(state.daily.progress.bestCombo, state.bestCombo);
    if (state.score > state.bestScore) state.bestScore = state.score;
    ui.earned.textContent = state.earned;
    ui.sorted.textContent = state.sorted;
    ui.combo.textContent = state.bestCombo;
    ui.tier.textContent = state.player.tier;
    $('doubleButton').disabled = false;
    $('doubleButton').style.opacity = '1';
    $('doubleButton').classList.toggle('hidden', state.earned <= 0);
    ui.resultHeading.innerHTML = state.sorted > 0 ? `${currentLevel().name.toUpperCase()}<br>IS CLEANER!` : 'NO JUNK<br>SORTED YET';
    ui.resultAreaLabel.textContent = `${prestigeRun ? 'PRESTIGE · ' : ''}${currentLevel().name.toUpperCase()} · +${runXp} SEASON XP`;
    ui.bestScore.textContent = state.bestScore.toLocaleString();
    if (isPlayables() && window.ytgame?.engagement?.sendScore) {
      window.ytgame.engagement.sendScore({ value: state.bestScore }).catch(() => {});
    }
    PHASE3.completeRun();
    saveProgress();
    showScreen('result');
    sfx('finish');
  }

  function doubleSalvage() {
    if (state.paused || state.doubled || state.earned <= 0) return;
    requestReward('double-run-salvage', () => {
      if (state.doubled || state.earned <= 0) return;
      state.doubled = true;
      state.wallet += state.earned;
      ui.earned.textContent = state.earned * 2;
      $('doubleButton').disabled = true;
      $('doubleButton').style.opacity = '.55';
    }, $('doubleButton'));
  }

  function renderProjects() {
    updateLevelCopy();
    ui.wallet.textContent = state.wallet;
    ui.supplyButton.disabled = state.rewardUsed.supply;
    ui.supplyButton.style.opacity = state.rewardUsed.supply ? '.55' : '1';
    ui.projectList.innerHTML = '';
    projects.forEach((project, index) => {
      const complete = state.built.includes(project.id);
      const locked = index > 0 && !state.built.includes(projects[index - 1].id);
      const current = !complete && !locked && index === getLevelIndex();
      const card = document.createElement('article');
      card.className = `project-card${complete ? ' complete' : ''}${locked ? ' locked' : ''}${current ? ' current' : ''}`;
      const buttonLabel = complete ? 'RESTORED ✓' : locked ? '🔒 LOCKED' : `♻ ${project.cost}`;
      card.innerHTML = `<div class="project-visual" aria-hidden="true">${project.icon}</div><div><small>AREA ${index + 1}</small><strong>${project.name}</strong><small>${project.note}</small></div><button class="build-button" type="button" ${(locked || complete || state.wallet < project.cost) ? 'disabled' : ''}>${buttonLabel}</button>`;
      card.querySelector('button').addEventListener('click', () => buildProject(project));
      ui.projectList.appendChild(card);
    });
    PHASE3.renderProgression(ui.projectList);
  }

  function buildProject(project) {
    if (state.paused) return;
    if (state.built.includes(project.id)) { showToast('Already restored!'); return; }
    const projectIndex = projects.findIndex((item) => item.id === project.id);
    if (projectIndex > 0 && !state.built.includes(projects[projectIndex - 1].id)) return;
    if (state.wallet < project.cost) return;
    state.wallet -= project.cost;
    state.built.push(project.id);
    const prestigeUnlocked = state.built.length === projects.length;
    state.prestige.unlocked = prestigeUnlocked;
    saveProgress();
    updateHomeProgress();
    renderProjects();
    burst(.5, .42, '#39d98a', 28);
    sfx('build');
    const nextLevel = LEVELS[projectIndex + 1];
    showToast(prestigeUnlocked ? 'World restored! Prestige and the Bot Workshop are unlocked!' : `${nextLevel.name} unlocked!`);
  }

  function activateSupplyDrop() {
    if (state.paused || state.rewardUsed.supply) return;
    requestReward('recycled-supply-drop-50-salvage', () => {
      state.rewardUsed.supply = true;
      state.wallet += 50;
      renderProjects();
    }, ui.supplyButton);
  }

  function maybeInterstitial() {
    if (!isPlayables() || !window.ytgame?.ads?.requestInterstitialAd) return;
    if (state.totalRuns < 3 || state.totalRuns % 3 !== 0 || Date.now() - state.lastRewardAt < 60000) return;
    window.ytgame.ads.requestInterstitialAd().catch(() => {});
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.add('hidden'), 1800);
  }

  function updateHud() {
    ui.timer.textContent = Math.max(0, Math.ceil(state.runLeft));
    ui.runScore.textContent = state.score;
    ui.cargoCount.textContent = `${state.player.cargo.length}/${capacity()}`;
    ui.cargoFill.style.width = `${Math.min(100, state.player.cargo.length / capacity() * 100)}%`;
    const contract = TYPES[state.contractType];
    ui.contractText.textContent = `Sort ${state.contractGoal} ${contract.label} · ${Math.min(state.contractGoal, state.contractCount)}/${state.contractGoal}${state.vipContract ? ' · VIP' : ''}`;
    ui.contractFill.style.width = `${Math.min(100, state.contractCount / state.contractGoal * 100)}%`;
    ui.comboValue.textContent = `×${Math.max(1, state.combo)}`;
    ui.comboChip.classList.toggle('hot', state.combo > 1);
    const active = performance.now() < state.magnetUntil;
    ui.magnetButton.querySelector('strong').textContent = active ? 'MAGNET ACTIVE' : 'SUPER MAGNET';
    ui.magnetButton.querySelector('small').textContent = active ? `${Math.max(1, Math.ceil((state.magnetUntil - performance.now()) / 1000))} SECONDS` : state.rewardUsed.magnet ? 'USED THIS RUN' : 'WATCH AD';
    ui.magnetButton.disabled = active || state.rewardUsed.magnet || state.adBusy;
    const canRecover = state.lostCargo.length && performance.now() < state.recoveryUntil && !state.rewardUsed.recovery;
    ui.recoveryButton.classList.toggle('hidden', !canRecover);
    updateGuide(performance.now());
  }

  function updateGuide(now) {
    const visible = state.mode === 'playing' && now < state.guideUntil;
    ui.guideBar.classList.toggle('hidden', !visible);
    if (!visible) return;
    ui.guideBar.classList.remove('sort', 'danger');
    ui.guideIcon.style.background = '';
    if (state.lostCargo.length && now < state.recoveryUntil) {
      ui.guideBar.classList.add('danger');
      ui.guideIcon.textContent = '!';
      ui.guideText.textContent = `${currentLevel().hazard} SPILL — steer around dark hazards`;
      return;
    }
    if (state.player.cargo.length) {
      const cargoType = state.player.cargo[0].type;
      ui.guideBar.classList.add('sort');
      ui.guideIcon.style.background = TYPES[cargoType].color;
      ui.guideIcon.textContent = '2';
      ui.guideText.textContent = `SORT ${TYPES[cargoType].label} → ${TYPES[cargoType].label} DEPOT`;
      return;
    }
    ui.guideIcon.textContent = '1';
    ui.guideText.textContent = 'COLLECT → drive over any bright junk';
  }

  function update(dt, now) {
    if (state.mode !== 'playing' || state.paused) return;
    state.runLeft -= dt;
    if (state.runLeft <= 0) { state.runLeft = 0; updateHud(); endRun(); return; }

    const p = state.player;
    let dx = 0, dy = 0;
    if (state.keys.has('arrowleft') || state.keys.has('a')) dx--;
    if (state.keys.has('arrowright') || state.keys.has('d')) dx++;
    if (state.keys.has('arrowup') || state.keys.has('w')) dy--;
    if (state.keys.has('arrowdown') || state.keys.has('s')) dy++;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      p.tx = p.x + dx / len * .1;
      p.ty = p.y + dy / len * .1;
    }
    const hazardMotion = PHASE3.hazardSpeed();
    state.hazards.forEach((movingHazard, index) => {
      const motionTime = now * .00055 * hazardMotion;
      movingHazard.x = movingHazard.ox + Math.sin(motionTime + movingHazard.phase) * (.018 + index * .004);
      movingHazard.y = movingHazard.oy + Math.cos(motionTime * .78 + movingHazard.phase) * (.012 + index * .003);
    });
    const hazard = state.hazards.find((h) => Math.hypot(p.x - h.x, p.y - h.y) < h.r);
    const slow = hazard ? .45 : 1;
    if (hazard && now - state.lastHazardHit > 4500 && p.cargo.length >= 4) spillCargo(now);
    const speed = p.speed * slow * dt;
    const tx = p.tx - p.x, ty = p.ty - p.y, dist = Math.hypot(tx, ty);
    if (dist > .006) {
      const step = Math.min(dist, speed);
      p.x += tx / dist * step;
      p.y += ty / dist * step;
    }
    p.x = Math.max(.065, Math.min(.935, p.x));
    p.y = Math.max(.23, Math.min(.94, p.y));

    const magnetRange = now < state.magnetUntil ? .22 : .072 + p.tier * .006;
    for (let i = state.trash.length - 1; i >= 0; i--) {
      const item = state.trash[i];
      const d = Math.hypot(p.x - item.x, p.y - item.y);
      if (now < state.magnetUntil && d < magnetRange && d > .02) {
        item.x += (p.x - item.x) * Math.min(1, dt * 5);
        item.y += (p.y - item.y) * Math.min(1, dt * 5);
      }
      if (d < .035 && p.cargo.length + item.size <= capacity()) {
        for (let unit = 0; unit < item.size; unit++) p.cargo.push({ type: item.type, value: item.rare ? 2 : 1 });
        state.trash.splice(i, 1);
        burst(item.x, item.y, TYPES[item.type].color, 5);
        floater(item.x, item.y, item.rare ? 'RARE ×2' : `+${item.size}`, item.rare ? '#9b6700' : TYPES[item.type].dark);
        sfx(item.rare ? 'rare' : 'pickup');
        if (p.cargo.length >= 6 && p.tier === 1) p.tier = 2;
        if (p.cargo.length >= 10 && p.tier === 2) p.tier = 3;
      }
    }

    state.stations.forEach((station) => {
      if (insideStation(p, station)) deposit(station.type);
    });
    if (state.trash.length < 27 && now > state.nextSpawn) {
      spawnTrash();
      state.nextSpawn = now + 180;
    }
    PARTICLE_POOL.update(dt);
    state.floaters.forEach((f) => { f.y -= dt * .035; f.life -= dt; });
    state.floaters = state.floaters.filter((f) => f.life > 0);
    if (state.combo && now > state.comboExpires) state.combo = 0;
    if (state.lostCargo.length && now > state.recoveryUntil) { state.lostCargo = []; ui.recoveryButton.classList.add('hidden'); }
    state.trailTick -= dt;
    if (dist > .02 && state.trailTick <= 0) {
      state.trailTick = .055;
      PARTICLE_POOL.spawn(p.x, p.y + .018, (Math.random() - .5) * .015, .025, PHASE3.trailColor(), .28);
    }
    updateHud();
  }

  function spillCargo(now) {
    const amount = Math.max(2, Math.floor(state.player.cargo.length / 2));
    state.lostCargo = state.player.cargo.splice(-amount);
    state.recoveryUntil = now + 6500;
    state.lastHazardHit = now;
    state.combo = 0;
    state.shakeUntil = now + 350;
    state.guideUntil = Math.max(state.guideUntil, now + 6500);
    burst(state.player.x, state.player.y, '#ff6e5b', 16);
    floater(state.player.x, state.player.y, `SPILL! −${amount}`, '#d83f35');
    sfx('spill');
    showToast(`${currentLevel().hazard} spill! Recover cargo or keep cleaning.`);
  }

  function insideStation(p, station) {
    return p.x > station.x && p.x < station.x + station.w && p.y > station.y && p.y < station.y + station.h;
  }

  function deposit(type) {
    const p = state.player;
    const matchingCargo = p.cargo.filter((item) => item.type === type);
    const matching = matchingCargo.length;
    if (!matching) return;
    const value = matchingCargo.reduce((total, item) => total + item.value, 0);
    p.cargo = p.cargo.filter((item) => item.type !== type);
    state.sorted += matching;
    state.deposits += 1;
    state.combo += 1;
    state.comboExpires = performance.now() + PHASE3.comboWindow(4200);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const gain = PHASE3.scoreGain(Math.round(value * 5 * (1 + Math.min(4, state.combo - 1) * .25)));
    state.score += gain;
    if (type === state.contractType) state.contractCount += matching;
    const station = state.stations.find((s) => s.type === type);
    burst(station.x + station.w / 2, station.y + station.h / 2, TYPES[type].color, 10);
    floater(station.x + station.w / 2, station.y + station.h / 2, `SORTED +${gain}`, TYPES[type].dark);
    sfx('sort');
    if (state.deposits === 1) state.guideUntil = Math.min(state.guideUntil, performance.now() + 3500);
    if (state.contractCount >= state.contractGoal && !state.contractAwarded) {
      state.contractAwarded = true;
      burst(.5, .3, '#ffd447', 34);
      floater(.5, .32, `CONTRACT COMPLETE +${45 + (state.vipContract ? 60 : 0)}`, '#8a5b00');
      sfx('contract');
    }
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = .05 + Math.random() * .08;
      PARTICLE_POOL.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, .45 + Math.random() * .3);
    }
  }

  function floater(x, y, text, color) { state.floaters.push({ x, y, text, color, life: .8 }); }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rr);
      return;
    }
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function draw(now) {
    const w = state.width, h = state.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (now < state.shakeUntil) ctx.translate((Math.random() - .5) * 9, (Math.random() - .5) * 7);
    drawWorld(now);
    if (state.mode === 'playing') {
      drawStations();
      drawHazards(now);
      state.trash.forEach((item) => drawTrash(item, now));
      drawParticles();
      drawRobot(now);
      drawFloaters();
    } else {
      drawCityBackdrop(now);
    }
    ctx.restore();
  }

  function drawWorld(now) {
    const level = currentLevel();
    if (level.world === 'park') drawParkWorld(now);
    if (level.world === 'street') drawStreetWorld(now);
    if (level.world === 'dog') drawDogParkWorld(now);
    if (level.world === 'river') drawRiverWorld(now);
  }

  function drawMapBase(now, colors) {
    const w = state.width, h = state.height;
    const header = ctx.createLinearGradient(0, 0, 0, h * .24);
    header.addColorStop(0, colors.top); header.addColorStop(1, colors.bottom);
    ctx.fillStyle = header; ctx.fillRect(0, 0, w, h * .25);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 5; i++) {
      const x = ((i * .29 + now / 110000) % 1.3 - .15) * w;
      ctx.beginPath(); ctx.ellipse(x, h * (.08 + (i % 2) * .04), 33, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = colors.ground; ctx.fillRect(0, h * .19, w, h * .81);
    ctx.fillStyle = colors.arena; roundedRect(w * .06, h * .25, w * .88, h * .69, 28); ctx.fill();
    ctx.strokeStyle = colors.edge; ctx.lineWidth = 5; ctx.stroke();
  }

  function clipArena() {
    const w = state.width, h = state.height;
    roundedRect(w * .06, h * .25, w * .88, h * .69, 28); ctx.clip();
  }

  function drawTree(x, y, radius) {
    ctx.fillStyle = '#795c3b'; roundedRect(x - radius * .18, y, radius * .36, radius * .75, radius * .12); ctx.fill();
    ctx.fillStyle = '#2f9e5e'; ctx.strokeStyle = '#176943'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#65c96f'; ctx.beginPath(); ctx.arc(x - radius * .28, y - radius * .2, radius * .42, 0, Math.PI * 2); ctx.fill();
  }

  function drawParkWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#64d9ed', bottom: '#c7f7ed', ground: '#b9e98a', arena: '#8bd06b', edge: '#4f9c58' });
    ctx.save(); clipArena();
    ctx.strokeStyle = '#efd7a1'; ctx.lineWidth = Math.max(38, w * .075); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w * .1, h * .86); ctx.bezierCurveTo(w * .28, h * .7, w * .27, h * .48, w * .48, h * .44); ctx.bezierCurveTo(w * .66, h * .4, w * .72, h * .72, w * .91, h * .79); ctx.stroke();
    ctx.strokeStyle = 'rgba(129,93,53,.22)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 28; i++) { ctx.beginPath(); ctx.arc(w * (.1 + ((i * 37) % 80) / 100), h * (.33 + ((i * 53) % 56) / 100), 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    [0.035, .965].forEach((x) => [0.31, .52, .76, .91].forEach((y, i) => drawTree(w * x, h * y, 13 + (i % 2) * 3)));
    ctx.fillStyle = '#b67a45'; ctx.strokeStyle = '#62472f'; ctx.lineWidth = 3;
    [[.14,.91],[.82,.92]].forEach(([x,y]) => { roundedRect(w*x,h*y,w*.1,12,4); ctx.fill(); ctx.stroke(); });
  }

  function drawStreetWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#71cce8', bottom: '#d8f3f7', ground: '#d8dfe4', arena: '#536b78', edge: '#2e4654' });
    ctx.save(); clipArena();
    ctx.fillStyle = '#d9d3c7'; ctx.fillRect(w * .06, h * .25, w * .88, h * .12); ctx.fillRect(w * .06, h * .85, w * .88, h * .09);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.setLineDash([20, 24]);
    ctx.beginPath(); ctx.moveTo(w * .08, h * .61); ctx.lineTo(w * .92, h * .61); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.86)';
    for (let i = 0; i < 6; i++) ctx.fillRect(w * (.43 + i * .024), h * .51, w * .013, h * .2);
    ctx.restore();
    const buildingColors = ['#ff826d', '#ffd55a', '#54c6d8', '#879cf4'];
    for (let i = 0; i < 7; i++) {
      const bw = w * .12, x = i * w * .145;
      ctx.fillStyle = buildingColors[i % buildingColors.length]; ctx.fillRect(x, h * .19, bw, h * .06);
      ctx.strokeStyle = '#314858'; ctx.lineWidth = 2; ctx.strokeRect(x, h * .19, bw, h * .06);
    }
  }

  function drawPaw(x, y, size) {
    ctx.beginPath(); ctx.ellipse(x, y + size * .22, size * .42, size * .34, 0, 0, Math.PI * 2); ctx.fill();
    [[-.38,-.2],[-.12,-.42],[.16,-.42],[.4,-.18]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(x + dx * size, y + dy * size, size * .14, 0, Math.PI * 2); ctx.fill(); });
  }

  function drawDogParkWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#7adced', bottom: '#d9f8ee', ground: '#d7e99b', arena: '#a0d673', edge: '#577e43' });
    ctx.save(); clipArena(); ctx.fillStyle = 'rgba(72,112,52,.13)';
    for (let i = 0; i < 12; i++) drawPaw(w * (.12 + ((i * 31) % 76) / 100), h * (.37 + ((i * 43) % 5) * .12), 14);
    ctx.strokeStyle = '#ff7c62'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(w * .14, h * .76, 24, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#278eea'; ctx.beginPath(); ctx.arc(w * .84, h * .78, 24, Math.PI, 0); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#f2e6c9'; ctx.strokeStyle = '#765e42'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = w * (.075 + i * .077); roundedRect(x, h * .925, 6, 22, 2); ctx.fill(); ctx.stroke(); }
  }

  function drawRiverWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#5fc8e7', bottom: '#c5f0ed', ground: '#62bcd6', arena: '#d8bd83', edge: '#795f3d' });
    ctx.save(); clipArena();
    ctx.fillStyle = '#d8bd83'; ctx.fillRect(w * .06, h * .25, w * .88, h * .69);
    ctx.strokeStyle = 'rgba(112,77,43,.24)'; ctx.lineWidth = 2;
    for (let i = 0; i < 13; i++) { const y = h * (.28 + i * .052); ctx.beginPath(); ctx.moveTo(w*.06,y); ctx.lineTo(w*.94,y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(w * (.14 + i * .11), h * (.46 + (i%3)*.15), 34, 7, 0, 0, Math.PI*2); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = h * (.3 + i*.11); ctx.beginPath(); ctx.arc(w*.975,y,16,0,Math.PI); ctx.stroke(); }
    ctx.strokeStyle = '#3f8f5b'; ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) { const y = h * (.3 + i*.085); ctx.beginPath(); ctx.moveTo(w*.025,y+16); ctx.lineTo(w*(.015 + (i%2)*.018),y); ctx.stroke(); }
  }

  function drawCityBackdrop(now) {
    const w = state.width, h = state.height;
    ctx.globalAlpha = .18;
    for (let i = 0; i < 9; i++) {
      const bw = 50 + (i % 3) * 22;
      const bh = 80 + (i % 4) * 34;
      ctx.fillStyle = ['#1f8cff','#39d98a','#ff6e5b'][i % 3];
      ctx.fillRect(i * w / 8 - 20, h - bh + Math.sin(now / 900 + i) * 3, bw, bh);
    }
    ctx.globalAlpha = 1;
  }

  function drawStations() {
    const w = state.width, h = state.height;
    state.stations.forEach((s) => {
      const x = s.x * w, y = s.y * h, sw = s.w * w, sh = s.h * h;
      ctx.fillStyle = TYPES[s.type].color; roundedRect(x, y, sw, sh, 14); ctx.fill();
      ctx.strokeStyle = '#10253b'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#10253b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `1000 ${Math.max(11, Math.min(15, sw / 6))}px system-ui`;
      ctx.fillText(TYPES[s.type].label, x + sw / 2, y + sh / 2 - 6);
      ctx.font = `900 ${Math.max(9, Math.min(11, sw / 8))}px system-ui`;
      ctx.fillText('DEPOT', x + sw / 2, y + sh / 2 + 9);
    });
  }

  function drawHazards(now) {
    const w = state.width, h = state.height;
    state.hazards.forEach((puddle) => {
      const x = puddle.x * w, y = puddle.y * h, r = puddle.r * Math.min(w, h);
      ctx.fillStyle = 'rgba(16,27,40,.82)';
      ctx.beginPath(); ctx.ellipse(x, y, r * (1 + Math.sin(now / 500 + puddle.phase) * .06), r * .55, .2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd447'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = `1000 ${Math.max(8, r * .25)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`! ${puddle.label}`, x, y);
    });
  }

  function drawTrash(item, now) {
    const w = state.width, h = state.height, scale = Math.min(w, h);
    const x = item.x * w, y = item.y * h + Math.sin(now / 330 + item.bob) * 2;
    const size = (item.size === 2 ? 15 : 11) + Math.min(5, scale / 150);
    ctx.save(); ctx.translate(x, y); ctx.rotate(item.rot);
    ctx.globalAlpha = .26 + Math.sin(now / 190 + item.bob) * .08;
    ctx.fillStyle = TYPES[item.type].color; ctx.beginPath(); ctx.arc(0, 0, size * 1.65, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (item.rare) {
      ctx.save(); ctx.rotate(-item.rot + now / 420); ctx.globalAlpha = .38;
      ctx.fillStyle = '#fff7a8'; ctx.strokeStyle = '#8a5b00'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const radius = i % 2 ? size * .84 : size * 1.34;
        const angle = i * Math.PI / 4;
        i ? ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius) : ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = TYPES[item.type].color; ctx.strokeStyle = '#10253b'; ctx.lineWidth = 2.5;
    if (item.type === 'paper') { roundedRect(-size, -size * .65, size * 2, size * 1.3, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-size * .55,-2); ctx.lineTo(size * .55,-2); ctx.stroke(); }
    if (item.type === 'plastic') { ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-size*.5,-size*.6); ctx.lineTo(size*.45,size*.55); ctx.stroke(); }
    if (item.type === 'metal') { ctx.beginPath(); for (let i=0;i<6;i++){ const a=i*Math.PI/3; const px=Math.cos(a)*size, py=Math.sin(a)*size; i?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  function drawRobot(now) {
    const p = state.player, w = state.width, h = state.height;
    const x = p.x * w, y = p.y * h, base = Math.max(22, Math.min(34, Math.min(w,h) * .047));
    const active = now < state.magnetUntil;
    if (active) {
      ctx.strokeStyle = `rgba(255,212,71,${.35 + Math.sin(now/90)*.18})`; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(x, y, base * 2.4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(16,37,59,.22)'; ctx.beginPath(); ctx.ellipse(x, y + base*.85, base*.85, base*.32, 0, 0, Math.PI*2); ctx.fill();
    PHASE3.drawRobotBack(ctx, x, y, base, now);
    p.cargo.slice(-5).forEach((cargo, index) => {
      const cargoX = x - base * .72 + (index % 3) * base * .72;
      const cargoY = y + base * .77 - Math.floor(index / 3) * base * .42;
      ctx.fillStyle = TYPES[cargo.type].color;
      roundedRect(cargoX - base * .22, cargoY - base * .2, base * .44, base * .4, 4); ctx.fill();
      ctx.strokeStyle = '#10253b'; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.fillStyle = '#5be7ef'; roundedRect(x-base, y-base*.82, base*2, base*1.68, base*.46); ctx.fill();
    ctx.strokeStyle = '#10253b'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#10253b'; ctx.beginPath(); ctx.arc(x-base*.36,y-base*.08,base*.09,0,Math.PI*2); ctx.arc(x+base*.36,y-base*.08,base*.09,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#10253b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x,y+base*.08,base*.27,.15,Math.PI-.15); ctx.stroke();
    ctx.fillStyle = '#1f8cff'; roundedRect(x-base*.68,y-base*1.08,base*1.36,base*.38,base*.16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `1000 ${base*.42}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`T${p.tier}`,x,y-base*.89);
    PHASE3.drawRobotFront(ctx, x, y, base, now);
  }

  function drawParticles() {
    PARTICLE_POOL.draw(ctx, state.width, state.height);
  }

  function drawFloaters() {
    const w = state.width, h = state.height;
    state.floaters.forEach((f) => { ctx.globalAlpha=Math.min(1,f.life*2); ctx.fillStyle=f.color; ctx.font='1000 15px system-ui'; ctx.textAlign='center'; ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeText(f.text,f.x*w,f.y*h); ctx.fillText(f.text,f.x*w,f.y*h); }); ctx.globalAlpha=1;
  }

  function frame(now) {
    state.frameId = 0;
    if (state.paused) return;
    const dt = Math.min(.05, (now - state.last) / 1000);
    state.last = now;
    update(dt, now);
    BACKGROUND_MUSIC.update(state.runLeft);
    draw(now);
    if (!state.firstFrameSent && window.ytgame?.game?.firstFrameReady) {
      state.firstFrameSent = true;
      window.ytgame.game.firstFrameReady();
    }
    if (!state.gameReadySent && state.saveLoaded && window.ytgame?.game?.gameReady) {
      state.gameReadySent = true;
      window.ytgame.game.gameReady();
    }
    state.frameId = requestAnimationFrame(frame);
  }

  function pointerToTarget(event) {
    const rect = canvas.getBoundingClientRect();
    state.player.tx = (event.clientX - rect.left) / rect.width;
    state.player.ty = (event.clientY - rect.top) / rect.height;
  }

  canvas.addEventListener('pointerdown', (event) => { if (!state.paused && state.mode === 'playing') { unlockAudio(); state.pointerDown = true; canvas.setPointerCapture(event.pointerId); pointerToTarget(event); } });
  canvas.addEventListener('pointermove', (event) => { if (!state.paused && state.pointerDown && state.mode === 'playing') pointerToTarget(event); });
  canvas.addEventListener('pointerup', () => { state.pointerDown = false; });
  window.addEventListener('keydown', (event) => { if (!state.paused) { unlockAudio(); state.keys.add(event.key.toLowerCase()); } });
  window.addEventListener('keyup', (event) => { state.keys.delete(event.key.toLowerCase()); });
  window.addEventListener('resize', resize);

  $('playButton').addEventListener('click', () => { unlockAudio(); state.tutorialSeen ? prepareBrief() : openTutorial(); });
  $('dailyButton').addEventListener('click', () => { unlockAudio(); openRewards(); });
  $('rewardsBackButton').addEventListener('click', closeRewards);
  $('rewardsHomeButton').addEventListener('click', closeRewards);
  $('dailyClaimButton').addEventListener('click', claimDaily);
  $('dailyDoubleButton').addEventListener('click', doubleDaily);
  $('seasonBoostButton').addEventListener('click', boostSeason);
  $('helpButton').addEventListener('click', openTutorial);
  $('tutorialButton').addEventListener('click', finishTutorial);
  $('goButton').addEventListener('click', startRun);
  $('bonusButton').addEventListener('click', activateBonusContract);
  $('magnetButton').addEventListener('click', activateMagnet);
  $('recoveryButton').addEventListener('click', recoverCargo);
  $('doubleButton').addEventListener('click', doubleSalvage);
  $('rebuildButton').addEventListener('click', () => { if (state.paused) return; maybeInterstitial(); renderProjects(); showScreen('rebuild'); });
  $('supplyButton').addEventListener('click', activateSupplyDrop);
  $('nextRunButton').addEventListener('click', prepareBrief);

  function registerWebMcpTools() {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;
    const options = { signal: new AbortController().signal };
    Promise.resolve(modelContext.registerTool({
      name: 'start_cleanup_run',
      title: 'Start cleanup run',
      description: 'Start a new 60-second cleanup run in the currently unlocked environment.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        startRun();
        return { status: 'started', district: currentLevel().name, seconds: 60 };
      }
    }, options)).catch(() => {});
    Promise.resolve(modelContext.registerTool({
      name: 'read_cleanup_progress',
      title: 'Read cleanup progress',
      description: 'Read the current salvage wallet and neighborhood restoration progress.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return { wallet: state.wallet, restoredProjects: [...state.built], totalProjects: projects.length };
      }
    }, options)).catch(() => {});
  }

  function setupYoutubeLifecycle() {
    setupAudio();
    if (window.ytgame?.system?.onPause) {
      window.ytgame.system.onPause(() => {
        state.paused = true;
        state.pointerDown = false;
        state.keys.clear();
        if (state.frameId) cancelAnimationFrame(state.frameId);
        state.frameId = 0;
        clearTimeout(showToast.timer);
        ui.toast.classList.add('hidden');
        suspendAudio();
        void saveProgress();
      });
    }
    if (window.ytgame?.system?.onResume) {
      window.ytgame.system.onResume(() => {
        state.paused = false;
        state.last = performance.now();
        resumeAudio();
        const queued = resumeQueue.splice(0, resumeQueue.length);
        queued.forEach((callback) => {
          try { callback(); } catch (_) { window.ytgame?.health?.logError?.(); }
        });
        if (!state.frameId) state.frameId = requestAnimationFrame(frame);
      });
    }
  }

  async function initialize() {
    resize();
    showScreen('start');
    setupYoutubeLifecycle();
    await loadProgress();
    registerWebMcpTools();
    state.last = performance.now();
    state.frameId = requestAnimationFrame(frame);
  }

  initialize().catch(() => {
    state.saveLoaded = true;
    state.frameId = requestAnimationFrame(frame);
    window.ytgame?.health?.logError?.();
  });
})();
