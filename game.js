(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const ui = {
    hud: $('hud'), timer: $('timer'), runScore: $('runScore'), cargoChip: $('cargoChip'), cargoFill: $('cargoFill'), cargoCount: $('cargoCount'),
    contractBar: $('contractBar'), contractText: $('contractText'), contractFill: $('contractFill'), magnetButton: $('magnetButton'),
    recoveryButton: $('recoveryButton'), comboChip: $('comboChip'), comboValue: $('comboValue'), bonusButton: $('bonusButton'), supplyButton: $('supplyButton'),
    guideBar: $('guideBar'), guideIcon: $('guideIcon'), guideText: $('guideText'),
    start: $('startScreen'), tutorial: $('tutorialScreen'), brief: $('briefScreen'), result: $('resultScreen'), rebuild: $('rebuildScreen'), rewards: $('rewardsScreen'), toast: $('toast'),
    earned: $('earnedSalvage'), sorted: $('itemsSorted'), combo: $('bestCombo'), tier: $('cargoTier'), wallet: $('walletValue'),
    projectList: $('projectList'), homeProgressText: $('homeProgressText'), homeProgressFill: $('homeProgressFill'), bestScore: $('bestScoreValue'), resultHeading: $('resultHeading'),
    restorationCanvas: $('restorationCanvas'), cityStageLabel: $('cityStageLabel'), cityPercentLabel: $('cityPercentLabel'), cityVisualFill: $('cityVisualFill'),
    resultProjectText: $('resultProjectText'), resultProjectValue: $('resultProjectValue'), resultProjectFill: $('resultProjectFill'), difficultyBadge: $('difficultyBadge'),
    homeAreaLabel: $('homeAreaLabel'), missionName: $('missionName'), missionSub: $('missionSub'), briefAreaStep: $('briefAreaStep'), briefTitle: $('briefTitle'), briefGoal: $('briefGoal'),
    resultAreaLabel: $('resultAreaLabel'), rebuildAreaLabel: $('rebuildAreaLabel'), briefPaper: $('briefPaper'), briefPlastic: $('briefPlastic'), briefMetal: $('briefMetal'),
    dailyBadge: $('dailyBadge'), dailyStreak: $('dailyStreak'), dailyRewardValue: $('dailyRewardValue'), streakTrack: $('streakTrack'), dailyClaimButton: $('dailyClaimButton'),
    dailyDoubleButton: $('dailyDoubleButton'), dailyChallenges: $('dailyChallenges'), seasonTitle: $('seasonTitle'), seasonXpText: $('seasonXpText'), seasonFill: $('seasonFill'),
    seasonTrack: $('seasonTrack'), seasonBoostButton: $('seasonBoostButton'), weeklyProgressText: $('weeklyProgressText'), weeklyProgressFill: $('weeklyProgressFill'),
    weeklyClaimButton: $('weeklyClaimButton'), weeklyBoostButton: $('weeklyBoostButton'), dailySetBonus: $('dailySetBonus')
  };

  const TYPES = {
    paper: { color: '#5bbcff', dark: '#136fb7', label: 'PAPER' },
    plastic: { color: '#ffd447', dark: '#b97700', label: 'PLASTIC' },
    metal: { color: '#c2d1dc', dark: '#5c7182', label: 'METAL' }
  };
  const JUNK_CATALOG = {
    park: {
      paper: ['paper-cup', 'snack-carton', 'newspaper'],
      plastic: ['water-bottle', 'picnic-tub', 'drink-cup'],
      metal: ['drink-can', 'food-tin']
    },
    street: {
      paper: ['flyer', 'cardboard-box', 'coffee-cup'],
      plastic: ['water-bottle', 'takeout-tub', 'cleaner-bottle'],
      metal: ['drink-can', 'food-tin']
    },
    dog: {
      paper: ['paper-bag', 'treat-box', 'paper-cup'],
      plastic: ['water-bottle', 'shampoo-bottle', 'takeout-tub'],
      metal: ['pet-food-can', 'drink-can']
    },
    river: {
      paper: ['drink-carton', 'paper-cup', 'cardboard-box'],
      plastic: ['water-bottle', 'detergent-jug', 'takeout-tub'],
      metal: ['drink-can', 'food-tin']
    }
  };
  const JUNK_LABELS = {
    'paper-cup': 'PAPER CUP', 'coffee-cup': 'COFFEE CUP', 'snack-carton': 'SNACK BOX', newspaper: 'NEWSPAPER',
    flyer: 'FLYER', 'cardboard-box': 'CARDBOARD', 'paper-bag': 'PAPER BAG', 'treat-box': 'TREAT BOX', 'drink-carton': 'CARTON',
    'water-bottle': 'BOTTLE', 'picnic-tub': 'FOOD TUB', 'drink-cup': 'DRINK CUP', 'takeout-tub': 'TAKEOUT TUB',
    'cleaner-bottle': 'CLEANER BOTTLE', 'shampoo-bottle': 'SHAMPOO BOTTLE', 'detergent-jug': 'DETERGENT JUG',
    'drink-can': 'DRINK CAN', 'food-tin': 'FOOD TIN', 'pet-food-can': 'PET FOOD CAN'
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
    { id: 'habitat', name: 'Protect River Habitat', icon: '🦆', cost: 520, note: 'Opens rotating cleanup assignments' },
    { id: 'gardens', name: 'Plant Community Gardens', icon: '🌻', cost: 680, note: 'Adds flowers and food gardens to the city' },
    { id: 'solar', name: 'Install Solar Streetlights', icon: '☀️', cost: 820, note: 'Lights restored paths with clean energy' },
    { id: 'shops', name: 'Renovate Local Storefronts', icon: '🏪', cost: 980, note: 'Brings color and life back downtown' },
    { id: 'bikes', name: 'Build the Bike Plaza', icon: '🚲', cost: 1160, note: 'Creates a safe low-emission travel hub' },
    { id: 'rescue', name: 'Open the Pet Rescue Corner', icon: '🐾', cost: 1380, note: 'Gives the dog park a permanent community home' },
    { id: 'refill', name: 'Add Water Refill Stations', icon: '💧', cost: 1620, note: 'Reduces single-use bottles across every area' },
    { id: 'boardwalk', name: 'Restore the Wetland Boardwalk', icon: '🌾', cost: 1880, note: 'Reopens the river habitat to visitors' },
    { id: 'center', name: 'Open the Eco Learning Center', icon: '🏫', cost: 2200, note: 'Completes the city and unlocks Prestige' }
  ];
  const DAILY_REWARDS = [30, 40, 50, 60, 80, 100, 150];
  const SEASON_REWARDS = [50, 75, 90, 110, 140, 170, 210, 260, 320, 500];
  const SEASON_TIER_XP = 350;

  const state = {
    mode: 'start', width: 0, height: 0, dpr: 1, last: performance.now(), runLeft: 60,
    score: 0, earned: 0, sorted: 0, combo: 0, bestCombo: 0, comboExpires: 0, contractCount: 0, contractAwarded: false,
    wallet: 0, built: [], bestScore: 0, totalRuns: 0, doubled: false, magnetUntil: 0, keys: new Set(), pointerDown: false,
    paused: false, saveLoaded: false, firstFrameSent: false, gameReadySent: false, adBusy: false, lastRewardAt: 0,
    vipContract: false, tutorialSeen: false, guideUntil: 0, deposits: 0, levelIndex: 0, contractType: 'plastic', contractGoal: 8, rewardUsed: { bonus: false, magnet: false, recovery: false, supply: false },
    daily: { lastClaim: '', streak: 0, lastAmount: 0, doubleDate: '', setBonusDate: '', freezeUsed: false, cycleClaims: 0, progress: { date: '', sorted: 0, runs: 0, contracts: 0, bestCombo: 0, score: 0 }, claimed: [] },
    weekly: { id: '', runs: 0, sorted: 0, claimed: false, boostUsed: false },
    season: { id: '', xp: 0, claimed: [], boostDate: '' },
    cosmetics: { unlocked: ['antenna-none', 'wheels-blue', 'trail-white'], equipped: { antenna: 'antenna-none', wheels: 'wheels-blue', trail: 'trail-white' } },
    prestige: { unlocked: false, enabled: false, activeRun: false, runs: 0 },
    lostCargo: [], recoveryUntil: 0, lastHazardHit: 0, shakeUntil: 0, cargoBlockedUntil: 0, lastCargoBlockedAt: 0, audioEnabled: true, audioContext: null, trailTick: 0, frameId: 0, buildReveal: null,
    player: { x: .5, y: .7, tx: .5, ty: .7, r: 22, tier: 1, cargo: [], speed: .31 },
    trash: [], floaters: [], hazards: [], stations: [], nextSpawn: 0
  };

  const PHASE3 = (() => {
    const SAVE_VERSION = 7;
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
      if (whole(source.version) < 6) xp = Math.round(xp * .7);
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
    function cityDifficulty() {
      const stage = Math.min(projects.length, state.built.length);
      return {
        tier: Math.min(3, 1 + Math.floor(stage / 4)),
        goalBonus: Math.floor(stage / 3),
        hazardCount: Math.min(6, 3 + Math.floor(stage / 4)),
        hazardSpeed: 1 + Math.min(.24, stage * .02),
        comboScale: Math.max(.84, 1 - stage * .013),
        spawnDelay: Math.max(128, 180 - stage * 4),
        rewardScale: 1 + Math.min(.3, stage * .025)
      };
    }
    function scoreGain(base) { return Math.round(base * multiplier() * cityDifficulty().rewardScale); }
    function salvage(score, extras) { return Math.round(score + extras * multiplier() * cityDifficulty().rewardScale); }
    function comboWindow(base) { return Math.max(2200, Math.round(base * cityDifficulty().comboScale * (state.prestige.activeRun ? .75 : 1))); }
    function hazardSpeed() { return cityDifficulty().hazardSpeed * (state.prestige.activeRun ? 1.2 : 1); }
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
        section.innerHTML += `<article class="workshop-locked"><strong>🔒 COMPLETE ALL ${projects.length} CITY PROJECTS</strong><small>Prestige Mode and cosmetic upgrades unlock when the entire city restoration is complete.</small></article>`;
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

    return { SAVE_VERSION, SEASON_TOTAL_XP, importSave, exportSave, previewCheckin, claimCheckin, freezeLabel, challengeXp, addSeasonXp, awardRunXp, beginRun, completeRun, scoreGain, salvage, comboWindow, hazardSpeed, cityDifficulty, nextLevel, renderProgression, trailColor, drawRobotBack, drawRobotFront };
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
    const coreProjects = projects.slice(0, LEVELS.length);
    const firstUnrestored = coreProjects.findIndex((project) => !state.built.includes(project.id));
    const normal = firstUnrestored === -1 ? state.totalRuns % LEVELS.length : firstUnrestored;
    return PHASE3.nextLevel(normal);
  }

  function currentLevel() { return LEVELS[state.levelIndex] || LEVELS[0]; }

  function nextProject() { return projects.find((project) => !state.built.includes(project.id)); }

  function goalForLevel(level) { return level.goal + PHASE3.cityDifficulty().goalBonus; }

  function updateLevelCopy() {
    state.levelIndex = getLevelIndex();
    const level = currentLevel();
    const step = `AREA ${state.levelIndex + 1} OF ${LEVELS.length}`;
    ui.homeAreaLabel.textContent = `${step} · ${level.name.toUpperCase()}`;
    ui.missionName.textContent = level.mission;
    const difficulty = PHASE3.cityDifficulty();
    ui.missionSub.textContent = `60-second ${level.name.toLowerCase()} cleanup · city tier ${difficulty.tier}`;
    ui.briefAreaStep.textContent = `${step} · CLEANUP CONTRACT`;
    ui.briefTitle.innerHTML = level.title;
    ui.briefGoal.innerHTML = `<strong>GOAL:</strong> Sort ${goalForLevel(level)} ${level.target}. Collect any bright junk, then deliver it to the same-color depot.`;
    const difficultyNames = ['FRESH START', 'BUSY CITY', 'ECO EXPERT'];
    ui.difficultyBadge.textContent = `CITY TIER ${difficulty.tier} · ${difficultyNames[difficulty.tier - 1]}`;
    ui.difficultyBadge.className = `difficulty-badge${difficulty.tier > 1 ? ` tier-${difficulty.tier}` : ''}`;
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
    const inPlayables = isPlayables();
    if (!inPlayables) state.audioEnabled = true;
    if (inPlayables && window.ytgame?.system?.isAudioEnabled) {
      try { state.audioEnabled = window.ytgame.system.isAudioEnabled() !== false; } catch (_) { state.audioEnabled = true; }
    }
    audioDebug('setup', {
      inPlayables: window.ytgame?.IN_PLAYABLES_ENV === true,
      enabled: state.audioEnabled,
      constructor: !!(window.AudioContext || window.webkitAudioContext)
    });
    if (window.ytgame?.system?.onAudioEnabledChange) {
      window.ytgame.system.onAudioEnabledChange((enabled) => {
        if (!isPlayables()) {
          audioDebug('audio-change-ignored', { reason: 'outside-playables', value: String(enabled) });
          return;
        }
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
      start: [330, 494], pickup: [520], rare: [660, 990], blocked: [220, 277], sort: [390, 585],
      contract: [440, 660, 880], spill: [180, 120], reward: [523, 784, 1047],
      finish: [392, 523, 659], build: [330, 494, 659]
    }[name] || [440];
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * .065;
      oscillator.type = name === 'spill' ? 'sawtooth' : name === 'blocked' ? 'square' : 'sine';
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
    let debugScheduled = false;
    let scene = 'menu';

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
      debugScheduled = false;
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

    function scheduleStep(when, index, rush, menu) {
      const chord = CHORDS[Math.floor(index / 8) % CHORDS.length];
      const chordStep = index % 8;
      const stepLength = 60 / (menu ? 92 : rush ? 124 : 112) / 2;
      const arpTone = chord.tones[ARP[chordStep]];

      voice(frequency(chord.root, arpTone, 1), when, stepLength * .68, 'triangle', menu ? .034 : rush ? .052 : .045);
      if (chordStep % 2 === 0) voice(chord.root / 2, when, stepLength * 1.45, 'sine', menu ? .03 : .04, .02);
      if (chordStep === 3 || chordStep === 7) {
        voice(frequency(chord.root, chord.tones[(chordStep + 1) % 4], 2), when, stepLength * .42, 'sine', menu ? .012 : rush ? .022 : .018);
      }
      if (chordStep === 0) {
        chord.tones.slice(0, 3).forEach((tone, toneIndex) => {
          voice(frequency(chord.root, tone), when + toneIndex * .012, stepLength * 6.6, 'sine', menu ? .01 : .012, .16);
        });
      }
      return stepLength;
    }

    function start(nextScene = 'menu') {
      const normalizedScene = nextScene === 'run' ? 'run' : 'menu';
      if (active && scene !== normalizedScene) {
        stopVoices();
        nextStepAt = 0;
        step = 0;
        debugScheduled = false;
      }
      scene = normalizedScene;
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
      debugScheduled = false;
    }

    function update(runLeft) {
      if (!active || !audio || !musicBus || !state.audioEnabled || state.paused || audio.state !== 'running') return;
      const menu = scene === 'menu';
      const rush = !menu && runLeft <= 15;
      const now = audio.currentTime;
      if (!nextStepAt || nextStepAt < now - .1) nextStepAt = now + .05;
      const targetVolume = menu ? .17 : rush ? .32 : .25;
      if (targetVolume !== currentVolume) {
        musicBus.gain.cancelScheduledValues(now);
        musicBus.gain.setTargetAtTime(targetVolume, now, .18);
        currentVolume = targetVolume;
      }
      while (nextStepAt < now + .35) {
        if (!debugScheduled) {
          audioDebug('music-scheduled', { context: audio.state, scene, volume: targetVolume });
          debugScheduled = true;
        }
        nextStepAt += scheduleStep(nextStepAt, step, rush, menu);
        step = (step + 1) % 32;
      }
    }

    return { attach, start, stop, update };
  })();

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function monthKey() { return todayKey().slice(0, 7); }

  function weekKey() {
    const now = new Date();
    const day = now.getUTCDay() || 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
    return monday.toISOString().slice(0, 10);
  }

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
    if (!state.weekly || state.weekly.id !== weekKey()) state.weekly = { id: weekKey(), runs: 0, sorted: 0, claimed: false, boostUsed: false };
  }

  function projectedStreak() {
    return PHASE3.previewCheckin().streak;
  }

  function checkinReward() {
    return PHASE3.previewCheckin().reward;
  }

  function dailyChallenges() {
    const seed = Math.max(0, dayNumber(todayKey()));
    const cityStep = Math.floor(state.built.length / 4);
    const sortedTarget = [12, 15, 18][seed % 3] + cityStep * 2;
    const rotating = [
      { id: 'contract', icon: '🏆', title: 'Finish a color contract', key: 'contracts', target: 1, reward: 70 },
      { id: 'combo', icon: '⚡', title: `Reach a ×${3 + (seed % 2) + Math.min(2, cityStep)} chain`, key: 'bestCombo', target: 3 + (seed % 2) + Math.min(2, cityStep), reward: 70 },
      { id: 'score', icon: '⭐', title: `Earn ${180 + (seed % 3) * 20 + cityStep * 60} points`, key: 'score', target: 180 + (seed % 3) * 20 + cityStep * 60, reward: 70 }
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
      + SEASON_REWARDS.filter((_, index) => state.season.xp >= (index + 1) * SEASON_TIER_XP && !state.season.claimed.includes(index + 1)).length
      + (state.weekly.runs >= 10 && !state.weekly.claimed ? 1 : 0);
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
    const dailySetComplete = dailyChallenges().every((challenge) => state.daily.claimed.includes(challenge.id));
    ui.dailySetBonus.textContent = state.daily.setBonusDate === today ? 'DAILY SET COMPLETE ✓ · BONUS CLAIMED' : `DAILY SET BONUS · ${state.daily.claimed.length}/3 GOALS · ♻ 120 + 100 XP`;
    ui.dailySetBonus.classList.toggle('complete', dailySetComplete || state.daily.setBonusDate === today);

    const weeklyRuns = Math.min(10, state.weekly.runs);
    ui.weeklyProgressText.textContent = `${weeklyRuns} / 10`;
    ui.weeklyProgressFill.style.width = `${weeklyRuns * 10}%`;
    ui.weeklyClaimButton.disabled = weeklyRuns < 10 || state.weekly.claimed;
    ui.weeklyClaimButton.textContent = state.weekly.claimed ? 'WEEKLY GRANT CLAIMED ✓' : 'WEEKLY GRANT · ♻ 350 + 250 XP';
    ui.weeklyBoostButton.disabled = state.weekly.boostUsed || state.weekly.claimed;
    ui.weeklyBoostButton.querySelector('strong').textContent = state.weekly.boostUsed ? 'VOLUNTEER CREW USED ✓' : 'VOLUNTEER CREW';

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
    const allClaimed = dailyChallenges().every((item) => state.daily.claimed.includes(item.id));
    if (allClaimed && state.daily.setBonusDate !== todayKey()) {
      state.daily.setBonusDate = todayKey();
      state.wallet += 120;
      addSeasonXp(100);
    }
    sfx('reward');
    showToast(allClaimed ? `Daily set complete! +${challenge.reward + 120} salvage` : `Challenge complete: +${challenge.reward} salvage`);
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

  function claimWeekly() {
    ensureRetentionState();
    if (state.weekly.runs < 10 || state.weekly.claimed) return;
    state.weekly.claimed = true;
    state.wallet += 350;
    addSeasonXp(250);
    sfx('reward');
    showToast('Community goal complete! +350 salvage +250 XP');
    saveProgress();
    renderRewards();
  }

  function boostWeekly() {
    ensureRetentionState();
    if (state.weekly.boostUsed || state.weekly.claimed) return;
    requestReward('weekly-volunteer-crew-2-credits', () => {
      state.weekly.boostUsed = true;
      state.weekly.runs = Math.min(10, state.weekly.runs + 2);
      renderRewards();
    }, ui.weeklyBoostButton);
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
      setBonusDate: typeof daily.setBonusDate === 'string' ? daily.setBonusDate : '',
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
    const weekly = saved?.weekly || {};
    state.weekly = {
      id: typeof weekly.id === 'string' ? weekly.id : '',
      runs: Math.max(0, Math.floor(Number(weekly.runs) || 0)),
      sorted: Math.max(0, Math.floor(Number(weekly.sorted) || 0)),
      claimed: weekly.claimed === true,
      boostUsed: weekly.boostUsed === true
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
      weekly: {},
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
      weekly: state.weekly,
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
    BACKGROUND_MUSIC.start(playing ? 'run' : 'menu');
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
    state.contractGoal = goalForLevel(level);
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
    state.cargoBlockedUntil = 0;
    state.lastCargoBlockedAt = 0;
    state.player = { x: .5, y: .72, tx: .5, ty: .72, r: 22, tier: 1, cargo: [], speed: .31 };
    state.trash = [];
    PARTICLE_POOL.reset();
    state.floaters = [];
    const hazardTemplates = [
      { x: .27, y: .48, ox: .27, oy: .48, r: .065, phase: 0, label: level.hazard },
      { x: .72, y: .68, ox: .72, oy: .68, r: .07, phase: 2.1, label: level.hazard },
      { x: .54, y: state.width > state.height ? .34 : .54, ox: .54, oy: state.width > state.height ? .34 : .54, r: .052, phase: 4.4, label: level.hazard },
      { x: .38, y: .76, ox: .38, oy: .76, r: .048, phase: 1.4, label: level.hazard },
      { x: .82, y: .43, ox: .82, oy: .43, r: .046, phase: 3.6, label: level.hazard },
      { x: .18, y: .67, ox: .18, oy: .67, r: .044, phase: 5.3, label: level.hazard }
    ];
    state.hazards = hazardTemplates.slice(0, PHASE3.cityDifficulty().hazardCount);
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
    const kindPool = JUNK_CATALOG[currentLevel().world]?.[type] || JUNK_CATALOG.park[type];
    const kind = kindPool[Math.floor(Math.random() * kindPool.length)];
    let x, y;
    const minY = state.width > state.height ? .28 : .40;
    do {
      x = .12 + Math.random() * .76;
      y = minY + Math.random() * (.91 - minY);
    } while (Math.hypot(x - state.player.x, y - state.player.y) < .15);
    const size = Math.random() < .16 ? 2 : 1;
    const rare = Math.random() < .07;
    state.trash.push({ type, kind, x, y, size, rare, rot: Math.random() * Math.PI * 2, bob: Math.random() * 6.28 });
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
    state.weekly.runs += 1;
    state.weekly.sorted += state.sorted;
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
    updateResultProjectProgress();
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
      updateResultProjectProgress();
      $('doubleButton').disabled = true;
      $('doubleButton').style.opacity = '.55';
    }, $('doubleButton'));
  }

  function updateResultProjectProgress() {
    const project = nextProject();
    if (!project) {
      ui.resultProjectText.textContent = 'CITY RESTORATION COMPLETE';
      ui.resultProjectValue.textContent = 'PRESTIGE UNLOCKED ✓';
      ui.resultProjectFill.style.width = '100%';
      return;
    }
    ui.resultProjectText.textContent = `NEXT · ${project.name.toUpperCase()}`;
    ui.resultProjectValue.textContent = `♻ ${Math.min(project.cost, state.wallet)} / ${project.cost}`;
    ui.resultProjectFill.style.width = `${Math.min(100, state.wallet / project.cost * 100)}%`;
  }

  function supplyDropValue() { return 50 + Math.min(150, state.built.length * 15); }

  function renderProjects() {
    updateLevelCopy();
    ui.wallet.textContent = state.wallet;
    ui.supplyButton.disabled = state.rewardUsed.supply;
    ui.supplyButton.style.opacity = state.rewardUsed.supply ? '.55' : '1';
    ui.supplyButton.querySelector('small').textContent = `+${supplyDropValue()} salvage · optional rewarded ad`;
    const percent = Math.round(state.built.length / projects.length * 100);
    ui.cityStageLabel.textContent = state.built.length === projects.length ? 'CLEAN CITY COMPLETE · PRESTIGE READY' : `CITY RESTORATION · ${state.built.length} OF ${projects.length} PROJECTS`;
    ui.cityPercentLabel.textContent = `${percent}% RESTORED`;
    ui.cityVisualFill.style.width = `${percent}%`;
    ui.projectList.innerHTML = '';
    const currentProjectIndex = projects.findIndex((project) => !state.built.includes(project.id));
    projects.forEach((project, index) => {
      const complete = state.built.includes(project.id);
      const locked = index > 0 && !state.built.includes(projects[index - 1].id);
      const current = !complete && !locked && index === currentProjectIndex;
      const card = document.createElement('article');
      card.className = `project-card${complete ? ' complete' : ''}${locked ? ' locked' : ''}${current ? ' current' : ''}`;
      const buttonLabel = complete ? 'RESTORED ✓' : locked ? '🔒 LOCKED' : `♻ ${project.cost}`;
      card.innerHTML = `<div class="project-visual" aria-hidden="true">${project.icon}</div><div><small>CITY PROJECT ${index + 1}</small><strong>${project.name}</strong><small>${project.note}</small></div><button class="build-button" type="button" ${(locked || complete || state.wallet < project.cost) ? 'disabled' : ''}>${buttonLabel}</button>`;
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
    state.buildReveal = { index: projectIndex, start: performance.now() };
    const prestigeUnlocked = state.built.length === projects.length;
    state.prestige.unlocked = prestigeUnlocked;
    saveProgress();
    updateHomeProgress();
    renderProjects();
    ui.rebuild.classList.remove('building');
    void ui.rebuild.offsetWidth;
    ui.rebuild.classList.add('building');
    clearTimeout(buildProject.visualTimer);
    buildProject.visualTimer = setTimeout(() => ui.rebuild.classList.remove('building'), 700);
    burst(.5, .42, '#39d98a', 28);
    sfx('build');
    const nextLevel = LEVELS[projectIndex + 1];
    const message = prestigeUnlocked ? 'Clean City complete! Prestige and the Bot Workshop are unlocked!' : nextLevel && projectIndex < LEVELS.length ? `${nextLevel.name} unlocked!` : `${project.name} restored — the city looks better!`;
    showToast(message);
  }

  function activateSupplyDrop() {
    if (state.paused || state.rewardUsed.supply) return;
    requestReward('recycled-supply-drop-50-salvage', () => {
      state.rewardUsed.supply = true;
      state.wallet += supplyDropValue();
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
    const now = performance.now();
    const cargoLength = state.player.cargo.length;
    const cargoCapacity = capacity();
    const cargoFull = cargoLength >= cargoCapacity;
    const cargoBlocked = now < state.cargoBlockedUntil;
    ui.timer.textContent = Math.max(0, Math.ceil(state.runLeft));
    ui.runScore.textContent = state.score;
    ui.cargoCount.textContent = `${cargoLength}/${cargoCapacity}`;
    ui.cargoCount.setAttribute('aria-label', cargoFull ? `Cargo full: ${cargoLength} of ${cargoCapacity}. Sort at a matching depot.` : `Cargo ${cargoLength} of ${cargoCapacity}`);
    ui.cargoFill.style.width = `${Math.min(100, cargoLength / cargoCapacity * 100)}%`;
    ui.cargoChip.classList.toggle('full', cargoFull);
    ui.cargoChip.classList.toggle('blocked', cargoBlocked);
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
    updateGuide(now);
  }

  function updateGuide(now) {
    const cargoBlocked = now < state.cargoBlockedUntil;
    const visible = state.mode === 'playing' && (now < state.guideUntil || cargoBlocked);
    ui.guideBar.classList.toggle('hidden', !visible);
    if (!visible) return;
    ui.guideBar.classList.remove('sort', 'danger', 'cargo-warning');
    ui.guideIcon.style.background = '';
    if (state.lostCargo.length && now < state.recoveryUntil) {
      ui.guideBar.classList.add('danger');
      ui.guideIcon.textContent = '!';
      ui.guideText.textContent = `${currentLevel().hazard} SPILL — steer around dark hazards`;
      return;
    }
    if (cargoBlocked) {
      ui.guideBar.classList.add('sort', 'cargo-warning');
      ui.guideIcon.textContent = '!';
      ui.guideText.textContent = state.player.cargo.length >= capacity() ? 'CARGO FULL → sort at a matching depot' : 'NOT ENOUGH ROOM → sort cargo first';
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
      if (d < .035) {
        if (p.cargo.length + item.size <= capacity()) {
          for (let unit = 0; unit < item.size; unit++) p.cargo.push({ type: item.type, value: item.rare ? 2 : 1 });
          state.trash.splice(i, 1);
          burst(item.x, item.y, TYPES[item.type].color, 5);
          const itemName = JUNK_LABELS[item.kind] || TYPES[item.type].label;
          floater(item.x, item.y, item.rare ? `BONUS ${itemName} ×2` : `${itemName} +${item.size}`, item.rare ? '#9b6700' : TYPES[item.type].dark);
          sfx(item.rare ? 'rare' : 'pickup');
          if (p.cargo.length >= 6 && p.tier === 1) p.tier = 2;
          if (p.cargo.length >= 10 && p.tier === 2) p.tier = 3;
          if (p.cargo.length >= capacity()) signalCargoBlocked(item, now);
        } else {
          signalCargoBlocked(item, now);
        }
      }
    }

    state.stations.forEach((station) => {
      if (insideStation(p, station)) deposit(station.type);
    });
    if (state.trash.length < 27 && now > state.nextSpawn) {
      spawnTrash();
      state.nextSpawn = now + PHASE3.cityDifficulty().spawnDelay;
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

  function signalCargoBlocked(item, now) {
    if (now - state.lastCargoBlockedAt < 1400) return;
    const full = state.player.cargo.length >= capacity();
    state.lastCargoBlockedAt = now;
    state.cargoBlockedUntil = now + 2600;
    state.guideUntil = Math.max(state.guideUntil, state.cargoBlockedUntil);
    state.shakeUntil = Math.max(state.shakeUntil, now + 110);
    const x = item?.x ?? state.player.x;
    const y = item?.y ?? state.player.y;
    burst(x, y, '#ffd447', 6);
    floater(state.player.x, state.player.y, full ? 'CARGO FULL!' : `NEED ${item?.size || 1} SLOTS!`, '#8a5b00');
    sfx('blocked');
    showToast(full ? 'Cargo full — sort at a matching color depot!' : 'Not enough room — sort cargo to make space!');
  }

  function spillCargo(now) {
    const amount = Math.max(2, Math.floor(state.player.cargo.length / 2));
    state.lostCargo = state.player.cargo.splice(-amount);
    state.recoveryUntil = now + 6500;
    state.lastHazardHit = now;
    state.combo = 0;
    state.cargoBlockedUntil = 0;
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
    state.cargoBlockedUntil = 0;
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

  const restorationCtx = ui.restorationCanvas?.getContext?.('2d', { alpha: false }) || null;

  function sceneRounded(context, x, y, width, height, radius) {
    context.beginPath();
    if (context.roundRect) { context.roundRect(x, y, width, height, radius); return; }
    const r = Math.min(radius, width / 2, height / 2);
    context.moveTo(x + r, y); context.arcTo(x + width, y, x + width, y + height, r); context.arcTo(x + width, y + height, x, y + height, r); context.arcTo(x, y + height, x, y, r); context.arcTo(x, y, x + width, y, r); context.closePath();
  }

  function sceneTree(context, x, y, scale, healthy) {
    context.fillStyle = 'rgba(16,37,59,.18)'; context.beginPath(); context.ellipse(x + 3 * scale, y + 15 * scale, 13 * scale, 4 * scale, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = healthy ? '#7b5334' : '#665b50'; context.fillRect(x - 2 * scale, y, 4 * scale, 17 * scale);
    if (!healthy) { context.strokeStyle = '#665b50'; context.lineWidth = 2 * scale; context.beginPath(); context.moveTo(x, y + 3 * scale); context.lineTo(x - 7 * scale, y - 5 * scale); context.moveTo(x, y + 5 * scale); context.lineTo(x + 7 * scale, y - 3 * scale); context.stroke(); return; }
    context.fillStyle = '#257d4d';
    [[0,-5,10],[-7,0,8],[7,0,8]].forEach(([dx,dy,r]) => { context.beginPath(); context.arc(x + dx * scale, y + dy * scale, r * scale, 0, Math.PI * 2); context.fill(); });
    context.fillStyle = '#6dcc70'; context.beginPath(); context.arc(x - 4 * scale, y - 9 * scale, 4 * scale, 0, Math.PI * 2); context.fill();
  }

  function sceneBuilding(context, x, y, width, height, color, lively) {
    context.fillStyle = 'rgba(16,37,59,.2)'; context.fillRect(x + 5, y + 5, width, height);
    context.fillStyle = lively ? color : '#8e999b'; context.fillRect(x, y, width, height);
    context.fillStyle = lively ? '#f6f2df' : '#6d7778'; context.fillRect(x - 2, y, width + 4, 5);
    const columns = Math.max(2, Math.floor(width / 22));
    for (let col = 0; col < columns; col++) {
      context.fillStyle = lively ? (col % 2 ? '#bdebf1' : '#ffe69b') : '#586669';
      context.fillRect(x + 7 + col * (width - 12) / columns, y + 12, Math.max(7, width / columns - 9), 12);
      if (!lively) { context.strokeStyle = '#b8a98e'; context.lineWidth = 2; context.beginPath(); context.moveTo(x + 7 + col * (width - 12) / columns, y + 12); context.lineTo(x + 14 + col * (width - 12) / columns, y + 24); context.stroke(); }
    }
    if (lively) {
      context.fillStyle = '#fff4d8'; context.fillRect(x + 3, y + height - 15, width - 6, 11);
      context.fillStyle = color === '#f47764' ? '#ffd447' : '#f47764';
      for (let stripe = 0; stripe < 6; stripe++) context.fillRect(x + 4 + stripe * (width - 8) / 6, y + height - 15, (width - 8) / 12, 11);
    } else {
      context.fillStyle = '#675b4e'; context.fillRect(x + width * .36, y + height - 18, width * .28, 18);
    }
    context.strokeStyle = '#243d4b'; context.lineWidth = 2; context.strokeRect(x, y, width, height);
  }

  function drawRestorationScene(now) {
    if (!restorationCtx || state.mode !== 'rebuild') return;
    const canvas = ui.restorationCanvas, rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), pixelWidth = Math.round(rect.width * dpr), pixelHeight = Math.round(rect.height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    const context = restorationCtx, sx = rect.width / 720, sy = rect.height / 280;
    context.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);
    const built = (index) => state.built.includes(projects[index]?.id), count = state.built.length;
    const sky = context.createLinearGradient(0, 0, 0, 150); sky.addColorStop(0, count ? '#6fd3ea' : '#9baeb2'); sky.addColorStop(1, count ? '#e6faf4' : '#d4d3c9'); context.fillStyle = sky; context.fillRect(0, 0, 720, 280);
    context.fillStyle = count ? 'rgba(255,235,140,.86)' : 'rgba(226,220,190,.48)'; context.beginPath(); context.arc(645, 42, 22, 0, Math.PI * 2); context.fill();
    context.fillStyle = count ? 'rgba(255,255,255,.62)' : 'rgba(235,235,228,.4)';
    for (let i = 0; i < 4; i++) { const x = 80 + i * 185 + Math.sin(now / 4000 + i) * 8; context.beginPath(); context.ellipse(x, 48 + (i % 2) * 22, 34, 9, 0, 0, Math.PI * 2); context.fill(); }

    context.fillStyle = count ? '#9acb70' : '#a89e88'; context.fillRect(0, 88, 720, 192);
    context.fillStyle = '#314b59'; context.beginPath(); context.moveTo(0, 222); context.lineTo(720, 190); context.lineTo(720, 245); context.lineTo(0, 274); context.closePath(); context.fill();
    context.strokeStyle = 'rgba(255,240,180,.75)'; context.lineWidth = 3; context.setLineDash([18,16]); context.beginPath(); context.moveTo(0, 247); context.lineTo(720, 217); context.stroke(); context.setLineDash([]);
    context.strokeStyle = count ? '#e9e6dc' : '#736e65'; context.lineWidth = 2; context.beginPath(); context.moveTo(0, 217); context.lineTo(720, 185); context.stroke();

    const river = context.createLinearGradient(535, 0, 715, 0); river.addColorStop(0, built(3) ? '#4db6d2' : '#677f7e'); river.addColorStop(1, built(3) ? '#268bb7' : '#526967');
    context.fillStyle = river; context.beginPath(); context.moveTo(540, 88); context.bezierCurveTo(520, 140, 570, 190, 545, 280); context.lineTo(720, 280); context.lineTo(720, 88); context.closePath(); context.fill();
    context.strokeStyle = built(3) ? 'rgba(230,253,255,.68)' : 'rgba(210,215,205,.24)'; context.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = 112 + i * 29, shift = Math.sin(now / 600 + i) * 8; context.beginPath(); context.moveTo(560, y); context.quadraticCurveTo(610 + shift, y - 7, 690, y); context.stroke(); }
    if (!built(3)) {
      ['#c8bb8c','#d6d6cf','#ba765c'].forEach((color, i) => { context.fillStyle = color; context.fillRect(586 + i * 32, 126 + i * 38, 15, 8); });
    } else {
      context.strokeStyle = '#2e7949'; context.lineWidth = 4; for (let i = 0; i < 7; i++) { context.beginPath(); context.moveTo(550 + i * 22, 184 + (i % 2) * 48); context.lineTo(545 + i * 23, 166 + (i % 2) * 48); context.stroke(); }
    }

    const livelyStreet = built(1);
    sceneBuilding(context, 245, 92, 70, 70, '#f47764', livelyStreet); sceneBuilding(context, 318, 78, 82, 84, '#f4c753', livelyStreet); sceneBuilding(context, 403, 99, 74, 63, '#55c5d6', livelyStreet);
    if (built(6)) {
      context.fillStyle = '#eaf6f8'; context.fillRect(252, 105, 54, 17); context.fillRect(326, 94, 65, 18); context.fillRect(410, 111, 58, 16);
      context.fillStyle = '#ff7966'; for (let i = 0; i < 9; i++) context.fillRect(253 + i * 24, 105 + (i % 3 === 1 ? -11 : 0), 10, 11);
    }

    context.fillStyle = built(0) ? '#63b95b' : '#a79878'; sceneRounded(context, 22, 105, 194, 111, 24); context.fill(); context.strokeStyle = built(0) ? '#347d45' : '#726955'; context.lineWidth = 3; context.stroke();
    if (built(0)) {
      sceneTree(context, 52, 132, 1, true); sceneTree(context, 183, 133, .9, true); sceneTree(context, 72, 190, .78, true);
      context.strokeStyle = '#e3cb92'; context.lineWidth = 18; context.lineCap = 'round'; context.beginPath(); context.moveTo(25, 195); context.quadraticCurveTo(105, 152, 211, 190); context.stroke();
    } else {
      sceneTree(context, 52, 143, 1, false); sceneTree(context, 180, 144, .9, false);
      context.fillStyle = '#6f6759'; for (let i = 0; i < 11; i++) { context.beginPath(); context.arc(44 + (i * 37) % 148, 122 + (i * 29) % 75, 3 + i % 3, 0, Math.PI * 2); context.fill(); }
    }
    if (built(4)) {
      context.fillStyle = '#785533'; for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) { context.fillRect(100 + col * 26, 168 + row * 17, 21, 11); context.fillStyle = ['#ffd447','#ff7a85','#f5f2ff'][(row+col)%3]; context.beginPath(); context.arc(110 + col*26, 172 + row*17, 3, 0, Math.PI*2); context.fill(); context.fillStyle='#785533'; }
    }

    context.strokeStyle = built(2) ? '#f0e6cb' : '#796f5d'; context.lineWidth = 3; context.setLineDash(built(2) ? [] : [7,5]); sceneRounded(context, 286, 177, 198, 83, 13); context.stroke(); context.setLineDash([]);
    context.fillStyle = built(2) ? '#7fc55d' : '#9b8e72'; sceneRounded(context, 291, 182, 188, 73, 10); context.fill();
    if (built(2)) {
      context.strokeStyle = '#ff7565'; context.lineWidth = 6; context.beginPath(); context.arc(326, 225, 15, Math.PI, 0); context.stroke(); context.strokeStyle = '#2c90e6'; context.beginPath(); context.arc(450, 225, 15, Math.PI, 0); context.stroke();
    } else { context.fillStyle = '#6c6254'; context.fillRect(330, 227, 58, 5); context.fillRect(356, 213, 5, 24); }
    if (built(8)) {
      context.fillStyle = '#e8b454'; context.beginPath(); context.moveTo(376, 235); context.lineTo(402, 213); context.lineTo(428, 235); context.closePath(); context.fill(); context.fillStyle = '#6f4932'; sceneRounded(context, 382, 230, 40, 23, 5); context.fill(); context.fillStyle='#fff'; context.beginPath(); context.arc(412,240,3,0,Math.PI*2); context.fill();
    }

    if (built(5)) {
      [[225,194],[495,176],[82,230]].forEach(([x,y]) => { context.strokeStyle='#264654'; context.lineWidth=3; context.beginPath(); context.moveTo(x,y); context.lineTo(x,y-31); context.stroke(); context.fillStyle='#244457'; context.fillRect(x-7,y-36,14,6); context.fillStyle='#ffe577'; context.fillRect(x-5,y-35,10,4); });
    }
    if (built(7)) {
      context.strokeStyle='#d9edf0'; context.lineWidth=3; for(let i=0;i<4;i++){ context.beginPath(); context.arc(242+i*15,213,7,Math.PI,0); context.stroke(); }
      context.strokeStyle='#183e52'; context.beginPath(); context.arc(258,202,7,0,Math.PI*2); context.arc(277,202,7,0,Math.PI*2); context.moveTo(258,202); context.lineTo(266,190); context.lineTo(277,202); context.lineTo(263,202); context.stroke();
    }
    if (built(9)) {
      context.fillStyle='#2b88be'; sceneRounded(context,492,124,28,43,5); context.fill(); context.fillStyle='#eafcff'; context.fillRect(498,131,16,12); context.beginPath(); context.arc(506,154,4,0,Math.PI*2); context.fill();
    }
    if (built(10)) {
      context.fillStyle='#ad7845'; context.fillRect(520,174,151,21); context.strokeStyle='#6b4a30'; context.lineWidth=2; for(let i=0;i<9;i++){ context.beginPath(); context.moveTo(524+i*18,174); context.lineTo(524+i*18,195); context.stroke(); }
      context.strokeStyle='#e6d7b8'; context.lineWidth=3; context.beginPath(); context.moveTo(526,169); context.lineTo(665,169); context.stroke();
    }
    if (built(11)) {
      context.fillStyle='#f3f0df'; sceneRounded(context,486,69,69,77,8); context.fill(); context.strokeStyle='#254554'; context.lineWidth=3; context.stroke(); context.fillStyle='#39b983'; context.beginPath(); context.moveTo(480,78); context.lineTo(521,49); context.lineTo(561,78); context.closePath(); context.fill(); context.stroke(); context.fillStyle='#68d5e5'; context.fillRect(496,90,17,18); context.fillRect(528,90,17,18); context.fillStyle='#256d4a'; context.fillRect(514,115,15,31); context.fillStyle='#fff'; context.font='900 8px system-ui'; context.textAlign='center'; context.fillText('ECO',521,84);
    }

    if (!count) {
      context.fillStyle='#f4d267'; context.strokeStyle='#263f4d'; context.lineWidth=2; sceneRounded(context,267,188,137,31,5); context.fill(); context.stroke(); context.fillStyle='#263f4d'; context.font='1000 11px system-ui'; context.textAlign='center'; context.textBaseline='middle'; context.fillText('RESTORATION SITE',335,203);
    }

    if (state.buildReveal && now - state.buildReveal.start < 1500) {
      const zones = [[20,101,202,120],[232,70,257,102],[282,174,207,91],[530,85,180,190],[82,155,105,61],[200,133,320,108],[235,72,250,104],[225,180,80,55],[365,202,73,54],[482,116,49,58],[512,158,168,47],[475,45,92,111]];
      const zone = zones[state.buildReveal.index] || zones[0], progress = (now - state.buildReveal.start) / 1500;
      context.save(); context.globalAlpha = 1 - progress; context.strokeStyle='#fff'; context.lineWidth=5; context.setLineDash([10,7]); sceneRounded(context, zone[0]-5, zone[1]-5, zone[2]+10, zone[3]+10, 16); context.stroke(); context.setLineDash([]);
      for(let i=0;i<18;i++){ const px=zone[0]+((i*37)%zone[2]), py=zone[1]+zone[3]*.7- progress*85 + ((i*17)%25); context.fillStyle=['#39d98a','#ffd447','#5be7ef','#fff'][i%4]; context.beginPath(); context.arc(px,py,3+i%2,0,Math.PI*2); context.fill(); }
      context.restore();
    }
  }

  function draw(now) {
    const w = state.width, h = state.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (now < state.shakeUntil) ctx.translate((Math.random() - .5) * 9, (Math.random() - .5) * 7);
    drawWorld(now);
    if (state.mode === 'playing') {
      drawStations(now);
      drawHazards(now);
      state.trash.forEach((item) => drawTrash(item, now));
      drawParticles();
      drawRobot(now);
      drawFloaters();
    } else {
      drawCityBackdrop(now);
    }
    ctx.restore();
    drawRestorationScene(now);
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
    ctx.fillStyle = header; ctx.fillRect(0, 0, w, h * .26);
    ctx.fillStyle = 'rgba(255,239,166,.78)';
    ctx.beginPath(); ctx.arc(w * .84, h * .075, Math.max(16, Math.min(28, w * .04)), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.56)';
    for (let i = 0; i < 5; i++) {
      const x = ((i * .29 + now / 110000) % 1.3 - .15) * w;
      const y = h * (.075 + (i % 2) * .045), cloud = 22 + (i % 3) * 6;
      ctx.beginPath();
      ctx.ellipse(x, y, cloud * 1.5, cloud * .42, 0, 0, Math.PI * 2);
      ctx.ellipse(x - cloud * .55, y + 1, cloud * .72, cloud * .34, 0, 0, Math.PI * 2);
      ctx.ellipse(x + cloud * .62, y + 2, cloud * .82, cloud * .32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const ground = ctx.createLinearGradient(0, h * .18, 0, h);
    ground.addColorStop(0, colors.groundTop || colors.ground);
    ground.addColorStop(1, colors.ground);
    ctx.fillStyle = ground; ctx.fillRect(0, h * .19, w, h * .81);
    ctx.save();
    ctx.shadowColor = 'rgba(16,37,59,.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    const arena = ctx.createLinearGradient(0, h * .25, 0, h * .94);
    arena.addColorStop(0, colors.arenaTop || colors.arena);
    arena.addColorStop(1, colors.arena);
    ctx.fillStyle = arena; roundedRect(w * .06, h * .25, w * .88, h * .69, 28); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = colors.edge; ctx.lineWidth = 6; roundedRect(w * .06, h * .25, w * .88, h * .69, 28); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; roundedRect(w * .068, h * .258, w * .864, h * .674, 23); ctx.stroke();
  }

  function clipArena() {
    const w = state.width, h = state.height;
    roundedRect(w * .06, h * .25, w * .88, h * .69, 28); ctx.clip();
  }

  function drawTree(x, y, radius) {
    ctx.fillStyle = 'rgba(16,37,59,.18)'; ctx.beginPath(); ctx.ellipse(x + radius * .18, y + radius * .76, radius * .72, radius * .23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#785335'; roundedRect(x - radius * .17, y - radius * .05, radius * .34, radius * .92, radius * .12); ctx.fill();
    ctx.fillStyle = '#237b4c'; ctx.strokeStyle = '#145a3b'; ctx.lineWidth = 2.5;
    [[0,0,1],[-.48,.08,.72],[.46,.12,.68],[-.1,-.45,.72]].forEach(([dx, dy, scale]) => {
      ctx.beginPath(); ctx.arc(x + radius * dx, y + radius * dy, radius * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = 'rgba(139,231,132,.62)'; ctx.beginPath(); ctx.arc(x - radius * .32, y - radius * .42, radius * .28, 0, Math.PI * 2); ctx.fill();
  }

  function drawGrassTexture(count, color) {
    const w = state.width, h = state.height;
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const x = w * (.085 + ((i * 47) % 83) / 100), y = h * (.29 + ((i * 71) % 61) / 100);
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 2, y); ctx.moveTo(x, y + 4); ctx.lineTo(x + 2.5, y - 1); ctx.stroke();
    }
  }

  function drawFlowers(x, y, spread, count) {
    const petals = ['#fff4a8', '#ff8b9e', '#f7f5ff', '#8ce3ff'];
    for (let i = 0; i < count; i++) {
      const px = x + ((i * 17) % 13 - 6) * spread / 13, py = y + ((i * 23) % 9 - 4) * spread / 12;
      ctx.fillStyle = petals[i % petals.length];
      for (let p = 0; p < 4; p++) { const a = p * Math.PI / 2; ctx.beginPath(); ctx.arc(px + Math.cos(a) * 2.5, py + Math.sin(a) * 2.5, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#d79a27'; ctx.beginPath(); ctx.arc(px, py, 1.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBench(x, y, scale = 1) {
    ctx.fillStyle = 'rgba(16,37,59,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 13 * scale, 34 * scale, 7 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a3829'; ctx.lineWidth = 3 * scale;
    ctx.beginPath(); ctx.moveTo(x - 24 * scale, y + 4 * scale); ctx.lineTo(x - 22 * scale, y + 17 * scale); ctx.moveTo(x + 24 * scale, y + 4 * scale); ctx.lineTo(x + 22 * scale, y + 17 * scale); ctx.stroke();
    ctx.fillStyle = '#a86f3e';
    for (let i = 0; i < 3; i++) { roundedRect(x - 31 * scale, y - 10 * scale + i * 7 * scale, 62 * scale, 5 * scale, 2 * scale); ctx.fill(); }
    ctx.fillStyle = '#c78b4e'; roundedRect(x - 31 * scale, y + 10 * scale, 62 * scale, 6 * scale, 2 * scale); ctx.fill();
  }

  function drawLampPost(x, y, scale = 1) {
    ctx.strokeStyle = '#274354'; ctx.lineWidth = 4 * scale; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 42 * scale); ctx.stroke();
    ctx.fillStyle = '#315b6d'; ctx.beginPath(); ctx.ellipse(x, y + 1, 9 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe995'; ctx.strokeStyle = '#274354'; ctx.lineWidth = 2 * scale; ctx.beginPath(); ctx.arc(x, y - 45 * scale, 8 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,143,.13)'; ctx.beginPath(); ctx.moveTo(x, y - 42 * scale); ctx.lineTo(x - 22 * scale, y - 3 * scale); ctx.lineTo(x + 22 * scale, y - 3 * scale); ctx.closePath(); ctx.fill();
  }

  function drawParkWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#58cde9', bottom: '#d7f8f2', groundTop: '#ccec9f', ground: '#9fd272', arenaTop: '#a7dd77', arena: '#72bd59', edge: '#397c48' });
    ctx.save(); clipArena();
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    for (let i = 0; i < 9; i++) ctx.fillRect(w * .07, h * (.29 + i * .075), w * .86, h * .032);
    drawGrassTexture(64, 'rgba(38,110,55,.25)');
    ctx.strokeStyle = 'rgba(85,63,39,.18)'; ctx.lineWidth = Math.max(46, w * .084); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w * .1, h * .87); ctx.bezierCurveTo(w * .28, h * .7, w * .27, h * .48, w * .48, h * .44); ctx.bezierCurveTo(w * .66, h * .4, w * .72, h * .72, w * .91, h * .79); ctx.stroke();
    ctx.strokeStyle = '#ead19a'; ctx.lineWidth = Math.max(38, w * .075);
    ctx.beginPath(); ctx.moveTo(w * .1, h * .86); ctx.bezierCurveTo(w * .28, h * .7, w * .27, h * .48, w * .48, h * .44); ctx.bezierCurveTo(w * .66, h * .4, w * .72, h * .72, w * .91, h * .79); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 3; ctx.setLineDash([7, 16]); ctx.stroke(); ctx.setLineDash([]);
    drawFlowers(w * .18, h * .42, 54, 10); drawFlowers(w * .78, h * .84, 52, 9);
    ctx.restore();
    [0.032, .968].forEach((x) => [0.31, .5, .72, .9].forEach((y, i) => drawTree(w * x, h * y, 12 + (i % 2) * 3)));
    drawBench(w * .17, h * .91, Math.max(.62, Math.min(1, w / 760))); drawBench(w * .82, h * .91, Math.max(.62, Math.min(1, w / 760)));
    drawLampPost(w * .045, h * .87, .72); drawLampPost(w * .955, h * .62, .72);
  }

  function drawBuilding(x, baseline, width, height, color, index) {
    ctx.fillStyle = 'rgba(16,37,59,.18)'; ctx.fillRect(x + 5, baseline - height + 5, width, height);
    ctx.fillStyle = color; ctx.fillRect(x, baseline - height, width, height);
    ctx.fillStyle = index % 2 ? '#f6e2bd' : '#e9f2f4'; ctx.fillRect(x - 2, baseline - height, width + 4, 6);
    ctx.fillStyle = '#28495a';
    const columns = Math.max(2, Math.floor(width / 28));
    for (let col = 0; col < columns; col++) {
      ctx.fillStyle = col % 2 ? '#bfe9f1' : '#ffe2a3';
      ctx.fillRect(x + 8 + col * (width - 16) / columns, baseline - height + 14, Math.max(7, width / columns - 11), Math.max(10, height * .24));
    }
    ctx.fillStyle = '#f5f0df'; ctx.fillRect(x + 3, baseline - 17, width - 6, 12);
    ctx.fillStyle = ['#e85d5d', '#2a9d73', '#e8a62d'][index % 3];
    for (let stripe = 0; stripe < 6; stripe++) ctx.fillRect(x + 4 + stripe * (width - 8) / 6, baseline - 17, (width - 8) / 12, 12);
    ctx.strokeStyle = '#274354'; ctx.lineWidth = 1.5; ctx.strokeRect(x, baseline - height, width, height);
  }

  function drawStreetWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#65c8e5', bottom: '#e1f5f7', groundTop: '#e7e3da', ground: '#c2cbd0', arenaTop: '#647984', arena: '#3f5663', edge: '#213d4d' });
    ctx.save(); clipArena();
    ctx.fillStyle = '#d9d2c4'; ctx.fillRect(w * .06, h * .25, w * .88, h * .12); ctx.fillRect(w * .06, h * .85, w * .88, h * .09);
    ctx.strokeStyle = '#f3e9d7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .06, h * .37); ctx.lineTo(w * .94, h * .37); ctx.moveTo(w * .06, h * .85); ctx.lineTo(w * .94, h * .85); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,91,96,.24)'; ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) { const x = w * (.06 + i * .073); ctx.beginPath(); ctx.moveTo(x, h * .25); ctx.lineTo(x, h * .37); ctx.moveTo(x, h * .85); ctx.lineTo(x, h * .94); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,244,198,.92)'; ctx.lineWidth = 4; ctx.setLineDash([22, 24]);
    ctx.beginPath(); ctx.moveTo(w * .08, h * .61); ctx.lineTo(w * .92, h * .61); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.86)';
    for (let i = 0; i < 7; i++) ctx.fillRect(w * (.41 + i * .027), h * .43, w * .015, h * .35);
    ctx.fillStyle = 'rgba(23,45,57,.22)';
    [[.23,.55],[.74,.7]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(w*x,h*y,15,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(211,226,230,.3)'; ctx.stroke(); });
    ctx.restore();
    const buildingColors = ['#ff826d', '#ffd55a', '#54c6d8', '#879cf4'];
    const bw = Math.max(54, w * .125);
    for (let i = 0; i < Math.ceil(w / (bw + 5)); i++) drawBuilding(i * (bw + 5) - 4, h * .25, bw, h * (.08 + (i % 3) * .025), buildingColors[i % buildingColors.length], i);
    drawLampPost(w * .045, h * .88, .78); drawLampPost(w * .955, h * .57, .78);
  }

  function drawPaw(x, y, size) {
    ctx.beginPath(); ctx.ellipse(x, y + size * .22, size * .42, size * .34, 0, 0, Math.PI * 2); ctx.fill();
    [[-.38,-.2],[-.12,-.42],[.16,-.42],[.4,-.18]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(x + dx * size, y + dy * size, size * .14, 0, Math.PI * 2); ctx.fill(); });
  }

  function drawDogParkWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#68d0e7', bottom: '#e0f8ef', groundTop: '#e7edae', ground: '#bdcf75', arenaTop: '#acd878', arena: '#83bd5c', edge: '#456d3b' });
    ctx.save(); clipArena();
    ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 10; i++) ctx.fillRect(w * .06, h * (.28 + i * .07), w * .88, h * .035);
    drawGrassTexture(54, 'rgba(47,99,45,.24)');
    ctx.fillStyle = 'rgba(72,112,52,.15)';
    for (let i = 0; i < 12; i++) drawPaw(w * (.12 + ((i * 31) % 76) / 100), h * (.4 + ((i * 43) % 5) * .105), 12);
    ctx.strokeStyle = '#ff705f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(w * .15, h * .76, 24, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w * .15, h * .76, 24, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#238de0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(w * .84, h * .78, 24, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w * .84, h * .78, 24, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#f6d05d'; ctx.strokeStyle = '#6d5734'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const hx = w * (.42 + i * .075); roundedRect(hx, h * .82, 7, 34, 3); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#e8f2f4'; roundedRect(w * .4, h * .825, w * .22, 7, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#f2e6c9'; ctx.strokeStyle = '#765e42'; ctx.lineWidth = 2;
    for (let i = 0; i < 13; i++) { const x = w * (.06 + i * .0735); roundedRect(x, h * .918, 6, 25, 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(w * .06, h * .928); ctx.lineTo(w * .94, h * .928); ctx.stroke();
    drawTree(w * .035, h * .48, 13); drawTree(w * .965, h * .68, 13);
  }

  function drawRiverWorld(now) {
    const w = state.width, h = state.height;
    drawMapBase(now, { top: '#54c2e4', bottom: '#d4f2ef', groundTop: '#72cce2', ground: '#3d9fc2', arenaTop: '#e2c98f', arena: '#c99f62', edge: '#694e31' });
    ctx.save(); clipArena();
    const boards = ctx.createLinearGradient(w * .06, 0, w * .94, 0); boards.addColorStop(0, '#c59659'); boards.addColorStop(.5, '#e2c88e'); boards.addColorStop(1, '#b9854e');
    ctx.fillStyle = boards; ctx.fillRect(w * .06, h * .25, w * .88, h * .69);
    ctx.strokeStyle = 'rgba(91,59,31,.28)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const y = h * (.26 + i * .051); ctx.beginPath(); ctx.moveTo(w*.06,y); ctx.lineTo(w*.94,y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,242,202,.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) { const x = w * (.08 + i * .09); ctx.beginPath(); ctx.moveTo(x,h*.25); ctx.lineTo(x,h*.94); ctx.stroke(); }
    ctx.fillStyle = '#409fc0'; ctx.fillRect(w * .06, h * .25, w * .035, h * .69); ctx.fillRect(w * .905, h * .25, w * .035, h * .69);
    ctx.strokeStyle = 'rgba(221,250,255,.64)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const y = h * (.3 + i * .095), shift = Math.sin(now / 650 + i) * 5; ctx.beginPath(); ctx.moveTo(w*.061,y); ctx.quadraticCurveTo(w*.078+shift,y-4,w*.094,y); ctx.moveTo(w*.906,y+8); ctx.quadraticCurveTo(w*.922-shift,y+3,w*.939,y+8); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(235,253,255,.62)'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) { const y = h * (.28 + i*.1); ctx.beginPath(); ctx.arc(w*.975,y,16,0,Math.PI); ctx.stroke(); }
    ctx.strokeStyle = '#357c4d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) { const y = h * (.28 + i*.068); ctx.beginPath(); ctx.moveTo(w*.025,y+18); ctx.quadraticCurveTo(w*(.01 + (i%2)*.025),y+7,w*(.018 + (i%3)*.01),y); ctx.stroke(); }
    ctx.fillStyle = '#71835c';
    [[.03,.84],[.968,.48],[.025,.57]].forEach(([x,y],i) => { ctx.beginPath(); ctx.ellipse(w*x,h*y,10+i*2,6+i,0,0,Math.PI*2); ctx.fill(); });
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

  function drawRecycleMark(x, y, radius, color) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, radius * .2); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const start = -Math.PI * .76 + i * Math.PI * 2 / 3, end = start + Math.PI * .9;
      ctx.beginPath(); ctx.arc(0, 0, radius, start, end); ctx.stroke();
      const ex = Math.cos(end) * radius, ey = Math.sin(end) * radius, tangent = end + Math.PI / 2, length = radius * .54, width = radius * .32;
      ctx.beginPath(); ctx.moveTo(ex + Math.cos(tangent) * length, ey + Math.sin(tangent) * length);
      ctx.lineTo(ex - Math.cos(tangent) * length * .12 + Math.cos(tangent + Math.PI / 2) * width, ey - Math.sin(tangent) * length * .12 + Math.sin(tangent + Math.PI / 2) * width);
      ctx.lineTo(ex - Math.cos(tangent) * length * .12 + Math.cos(tangent - Math.PI / 2) * width, ey - Math.sin(tangent) * length * .12 + Math.sin(tangent - Math.PI / 2) * width); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawStations(now = performance.now()) {
    const w = state.width, h = state.height;
    state.stations.forEach((s) => {
      const x = s.x * w, y = s.y * h, sw = s.w * w, sh = s.h * h;
      const color = TYPES[s.type].color, dark = TYPES[s.type].dark, unit = Math.min(sw, sh), active = state.player.cargo.some((item) => item.type === s.type);
      const bx = x + sw * .12, by = y + sh * .16, bw = sw * .76, bh = sh * .7;
      if (active) {
        const pulse = .65 + Math.sin(now / 150) * .18;
        ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.shadowColor = color; ctx.shadowBlur = 14; roundedRect(x + 2, y + 2, sw - 4, sh - 4, Math.min(16, unit * .2)); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = 'rgba(16,37,59,.24)'; ctx.beginPath(); ctx.ellipse(x + sw * .53, y + sh * .91, sw * .4, sh * .09, 0, 0, Math.PI * 2); ctx.fill();
      const body = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      body.addColorStop(0, '#f8fbfc'); body.addColorStop(.09, color); body.addColorStop(1, dark);
      ctx.fillStyle = body; roundedRect(bx, by, bw, bh, Math.min(12, unit * .14)); ctx.fill();
      ctx.strokeStyle = '#10253b'; ctx.lineWidth = Math.max(2.2, unit * .045); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.24)'; roundedRect(bx + bw * .12, by + bh * .16, bw * .13, bh * .52, 4); ctx.fill();
      ctx.fillStyle = '#173246'; roundedRect(x + sw * .07, y + sh * .1, sw * .86, sh * .16, Math.min(8, unit * .09)); ctx.fill();
      ctx.fillStyle = '#071c2a'; roundedRect(x + sw * .22, y + sh * .135, sw * .56, Math.max(4, sh * .055), 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + sw * .13, y + sh * .12); ctx.lineTo(x + sw * .87, y + sh * .12); ctx.stroke();
      drawRecycleMark(x + sw * .5, y + sh * .49, Math.max(7, unit * .13), '#fff');
      ctx.fillStyle = 'rgba(10,31,45,.86)'; roundedRect(bx + bw * .05, by + bh * .69, bw * .9, bh * .23, Math.min(6, unit * .07)); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `1000 ${Math.max(8, Math.min(13, unit * .15))}px system-ui`;
      ctx.fillText(TYPES[s.type].label, x + sw / 2, by + bh * .81);
      ctx.fillStyle = '#18364a';
      [bx + bw * .23, bx + bw * .77].forEach((wheelX) => { ctx.beginPath(); ctx.arc(wheelX, by + bh * .99, Math.max(2.5, unit * .045), 0, Math.PI * 2); ctx.fill(); });
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

  function drawPaperJunk(kind, size) {
    ctx.strokeStyle = '#10253b';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    if (kind === 'newspaper' || kind === 'flyer') {
      const wide = kind === 'newspaper';
      const width = size * (wide ? 2.05 : 1.45);
      const height = size * (wide ? 1.35 : 1.8);
      ctx.fillStyle = '#eaf7ff';
      roundedRect(-width / 2, -height / 2, width, height, size * .12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.paper.color;
      roundedRect(-width * .38, -height * .34, width * .76, height * .24, 2); ctx.fill();
      ctx.strokeStyle = TYPES.paper.dark; ctx.lineWidth = 1.4;
      for (let line = 0; line < 3; line++) {
        const lineY = height * (.04 + line * .17);
        ctx.beginPath(); ctx.moveTo(-width * .35, lineY); ctx.lineTo(width * (.28 - line * .04), lineY); ctx.stroke();
      }
      return;
    }
    if (kind === 'paper-cup' || kind === 'coffee-cup') {
      ctx.fillStyle = '#eaf7ff';
      ctx.beginPath();
      ctx.moveTo(-size * .68, -size * .68); ctx.lineTo(size * .68, -size * .68);
      ctx.lineTo(size * .48, size * .82); ctx.lineTo(-size * .48, size * .82); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.paper.color; ctx.fillRect(-size * .56, -size * .05, size * 1.12, size * .42);
      ctx.fillStyle = '#d8e4eb';
      ctx.beginPath(); ctx.ellipse(0, -size * .72, size * .76, size * .19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      return;
    }
    if (kind === 'paper-bag') {
      ctx.fillStyle = '#d9b77e';
      roundedRect(-size * .72, -size * .58, size * 1.44, size * 1.45, size * .08); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -size * .54, size * .42, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = TYPES.paper.color; roundedRect(-size * .45, 0, size * .9, size * .34, 2); ctx.fill();
      return;
    }
    const drinkCarton = kind === 'drink-carton';
    ctx.fillStyle = drinkCarton ? '#f5f1dd' : '#e4c48a';
    roundedRect(-size * .72, -size * .62, size * 1.44, size * 1.48, size * .1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TYPES.paper.color; roundedRect(-size * .53, -size * .15, size * 1.06, size * .52, 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-size * .72, -size * .62); ctx.lineTo(-size * .2, -size * 1.02); ctx.lineTo(size * .72, -size * .62); ctx.closePath();
    ctx.fillStyle = '#f0d7a8'; ctx.fill(); ctx.stroke();
    if (drinkCarton) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(size * .32, -size * .61, size * .14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  function drawPlasticJunk(kind, size) {
    ctx.strokeStyle = '#10253b';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    if (kind === 'picnic-tub' || kind === 'takeout-tub') {
      ctx.fillStyle = '#fff7bf';
      roundedRect(-size, -size * .48, size * 2, size * 1.12, size * .22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.plastic.color;
      roundedRect(-size * 1.08, -size * .67, size * 2.16, size * .37, size * .16); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = TYPES.plastic.dark; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-size * .62, size * .12); ctx.lineTo(size * .62, size * .12); ctx.stroke();
      return;
    }
    if (kind === 'drink-cup') {
      ctx.fillStyle = '#fff6b3';
      ctx.beginPath(); ctx.moveTo(-size * .7, -size * .55); ctx.lineTo(size * .7, -size * .55); ctx.lineTo(size * .48, size * .83); ctx.lineTo(-size * .48, size * .83); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.plastic.color; roundedRect(-size * .78, -size * .72, size * 1.56, size * .27, size * .1); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e65c4f'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(size * .18, -size * .7); ctx.lineTo(size * .42, -size * 1.12); ctx.stroke();
      return;
    }
    if (kind === 'detergent-jug') {
      ctx.fillStyle = '#fff4a6';
      roundedRect(-size * .85, -size * .7, size * 1.7, size * 1.58, size * .25); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.plastic.color; roundedRect(-size * .22, -size * 1.02, size * .72, size * .38, size * .09); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eaf7ff'; ctx.beginPath(); ctx.arc(size * .35, -size * .3, size * .28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; roundedRect(-size * .58, size * .08, size * .9, size * .42, 2); ctx.fill();
      return;
    }
    const wide = kind === 'cleaner-bottle' || kind === 'shampoo-bottle';
    ctx.fillStyle = wide ? '#fff4a6' : '#fff8c9';
    ctx.beginPath();
    ctx.moveTo(-size * .28, -size * 1.02); ctx.lineTo(size * .28, -size * 1.02);
    ctx.lineTo(size * .3, -size * .72); ctx.quadraticCurveTo(size * (wide ? .78 : .58), -size * .56, size * (wide ? .74 : .58), -size * .18);
    ctx.lineTo(size * (wide ? .64 : .52), size * .82); ctx.quadraticCurveTo(0, size * 1.02, -size * (wide ? .64 : .52), size * .82);
    ctx.lineTo(-size * (wide ? .74 : .58), -size * .18); ctx.quadraticCurveTo(-size * (wide ? .78 : .58), -size * .56, -size * .3, -size * .72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TYPES.plastic.color; roundedRect(-size * .36, -size * 1.2, size * .72, size * .25, size * .08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; roundedRect(-size * .45, -size * .2, size * .9, size * .45, size * .08); ctx.fill();
    ctx.strokeStyle = TYPES.plastic.dark; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-size * .28, size * .02); ctx.lineTo(size * .28, size * .02); ctx.stroke();
  }

  function drawMetalJunk(kind, size) {
    ctx.strokeStyle = '#10253b';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    if (kind === 'food-tin' || kind === 'pet-food-can') {
      ctx.fillStyle = '#dce7ee';
      roundedRect(-size, -size * .5, size * 2, size, size * .2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = TYPES.metal.color;
      ctx.beginPath(); ctx.ellipse(0, -size * .48, size, size * .25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = TYPES.metal.dark; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-size * .82, size * .18); ctx.lineTo(size * .82, size * .18); ctx.stroke();
      if (kind === 'pet-food-can') {
        ctx.fillStyle = '#ff9a76'; ctx.beginPath(); ctx.arc(0, 0, size * .22, 0, Math.PI * 2); ctx.fill();
        [[-.2,-.23],[.2,-.23]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx * size, dy * size, size * .1, 0, Math.PI * 2); ctx.fill(); });
      }
      return;
    }
    ctx.fillStyle = '#dce7ee';
    roundedRect(-size * .58, -size, size * 1.16, size * 2, size * .28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TYPES.metal.color;
    ctx.beginPath(); ctx.ellipse(0, -size * .92, size * .55, size * .2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = TYPES.metal.dark; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, -size * .91, size * .2, size * .08, -.25, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; roundedRect(-size * .46, -size * .18, size * .92, size * .5, size * .08); ctx.fill();
  }

  function drawTrash(item, now) {
    const w = state.width, h = state.height, scale = Math.min(w, h);
    const x = item.x * w, y = item.y * h + Math.sin(now / 330 + item.bob) * 2;
    const size = (item.size === 2 ? 15 : 11) + Math.min(5, scale / 150);
    const fallbackKind = item.type === 'paper' ? 'newspaper' : item.type === 'plastic' ? 'water-bottle' : 'drink-can';
    const kind = item.kind || fallbackKind;
    ctx.save(); ctx.translate(x, y); ctx.rotate(item.rot);
    ctx.globalAlpha = .24 + Math.sin(now / 190 + item.bob) * .07;
    ctx.fillStyle = TYPES[item.type].color; ctx.beginPath(); ctx.arc(0, 0, size * 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (item.rare) {
      ctx.save(); ctx.rotate(-item.rot + now / 420); ctx.globalAlpha = .42;
      ctx.fillStyle = '#fff7a8'; ctx.strokeStyle = '#8a5b00'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let point = 0; point < 8; point++) {
        const radius = point % 2 ? size * .84 : size * 1.38;
        const angle = point * Math.PI / 4;
        point ? ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius) : ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (item.type === 'paper') drawPaperJunk(kind, size);
    if (item.type === 'plastic') drawPlasticJunk(kind, size);
    if (item.type === 'metal') drawMetalJunk(kind, size);
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
  window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });

  $('playButton').addEventListener('click', () => { unlockAudio(); state.tutorialSeen ? prepareBrief() : openTutorial(); });
  $('dailyButton').addEventListener('click', () => { unlockAudio(); openRewards(); });
  $('rewardsBackButton').addEventListener('click', closeRewards);
  $('rewardsHomeButton').addEventListener('click', closeRewards);
  $('dailyClaimButton').addEventListener('click', claimDaily);
  $('dailyDoubleButton').addEventListener('click', doubleDaily);
  $('weeklyClaimButton').addEventListener('click', claimWeekly);
  $('weeklyBoostButton').addEventListener('click', boostWeekly);
  $('seasonBoostButton').addEventListener('click', boostSeason);
  $('helpButton').addEventListener('click', () => { unlockAudio(); openTutorial(); });
  $('tutorialButton').addEventListener('click', () => { unlockAudio(); finishTutorial(); });
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
