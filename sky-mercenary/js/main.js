const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ui = document.getElementById("ui");
const hudPlane = document.getElementById("hud-plane");
const hudMoney = document.getElementById("hud-money");
const hudScore = document.getElementById("hud-score");
const hpFill = document.getElementById("hp-fill");

const W = canvas.width;
const H = canvas.height;

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/** @type {'title'|'hangar'|'playing'|'paused'|'gameover'|'victory'} */
let state = "title";
let selectedPlaneIdx = 0;
let unlocked = new Set(["falcon"]);
let money = 0;
let highScore = Number(localStorage.getItem("skyContractHS") || 0);

const game = {
  plane: null,
  x: 160,
  y: H / 2,
  hp: 100,
  maxHp: 100,
  score: 0,
  fireCd: 0,
  specialCd: 0,
  power: 0,
  invuln: 0,
  parallax: 0,
  t: 0,
  wave: 0,
  spawnTimer: 0,
  bossSpawned: false,
  stageComplete: false,
  bullets: [],
  enemies: [],
  particles: [],
  powerups: [],
  messages: [],
  shake: 0,
};

function resetRun(planeId) {
  const plane = getPlane(planeId);
  game.plane = plane;
  game.x = 160;
  game.y = H / 2;
  game.hp = plane.hp;
  game.maxHp = plane.hp;
  game.score = 0;
  game.fireCd = 0;
  game.specialCd = 0;
  game.power = 0;
  game.invuln = 1.5;
  game.parallax = 0;
  game.t = 0;
  game.wave = 0;
  game.spawnTimer = 1;
  game.bossSpawned = false;
  game.stageComplete = false;
  game.bullets = [];
  game.enemies = [];
  game.particles = [];
  game.powerups = [];
  game.messages = [{ text: "CONTRATO ACTIVO — ZONA COSTERA", life: 3 }];
  game.shake = 0;
  ui.classList.remove("hidden");
  updateHud();
}

function updateHud() {
  if (!game.plane) return;
  hudPlane.textContent = game.plane.name;
  hudMoney.textContent = `$${money.toLocaleString("en-US")}`;
  hudScore.textContent = String(game.score);
  const pct = Math.max(0, (game.hp / game.maxHp) * 100);
  hpFill.style.width = `${pct}%`;
}

function spawnBurst(x, y, color, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 160;
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 2 + Math.random() * 4,
      life: 0.6 + Math.random() * 0.5,
      color,
    });
  }
}

function firePlayer(special = false) {
  const p = game.plane;
  const dmg = p.damage * (1 + game.power * 0.35);
  const col = p.color;

  if (special) {
    if (game.specialCd > 0) return;
    game.specialCd = p.specialCooldown;
    if (p.special === "burst") {
      for (let i = -2; i <= 2; i++) {
        game.bullets.push({
          x: game.x + 40,
          y: game.y + i * 10,
          vx: 720,
          vy: i * 40,
          r: 5,
          dmg,
          from: "player",
          color: col,
        });
      }
    } else if (p.special === "missiles") {
      for (let i = 0; i < 6; i++) {
        game.bullets.push({
          x: game.x + 20,
          y: game.y,
          vx: 400 + i * 30,
          vy: (i - 2.5) * 90,
          r: 6,
          dmg: dmg * 1.4,
          from: "player",
          color: "#6ea8ff",
          homing: true,
        });
      }
    } else if (p.special === "plasma") {
      game.bullets.push({
        x: game.x + 50,
        y: game.y,
        vx: 500,
        vy: 0,
        r: 18,
        dmg: dmg * 3,
        from: "player",
        color: "#f0c14b",
      });
    }
    spawnBurst(game.x + 30, game.y, col, 8);
    return;
  }

  if (game.fireCd > 0) return;
  game.fireCd = p.fireRate * (game.power >= 2 ? 0.75 : 1);
  const spread = game.power >= 1 ? 1 : 0;
  for (let i = -spread; i <= spread; i++) {
    game.bullets.push({
      x: game.x + 36,
      y: game.y + i * 8,
      vx: 780,
      vy: i * 30,
      r: 4 + game.power,
      dmg,
      from: "player",
      color: col,
    });
  }
}

function spawnWave() {
  game.wave++;
  const w = game.wave;

  if (w === 8 && !game.bossSpawned) {
    game.bossSpawned = true;
    game.enemies.push({
      kind: "boss",
      x: W + 100,
      y: H / 2,
      hp: 900,
      maxHp: 900,
      vx: -40,
      vy: 0,
      r: 70,
      score: 5000,
      money: 2000,
      fireCd: 1,
      pattern: 0,
      rot: 0,
    });
    game.messages.push({ text: "¡JEFE DETECTADO — ACORAZADO ROJO!", life: 3.5 });
    return;
  }

  if (game.bossSpawned) return;

  const count = 3 + Math.min(6, Math.floor(w / 2));
  for (let i = 0; i < count; i++) {
    const kind = w > 4 && Math.random() < 0.25 ? "bomber" : "fighter";
    const y = 80 + Math.random() * (H - 200);
    game.enemies.push({
      kind,
      x: W + 40 + i * 55,
      y,
      hp: kind === "bomber" ? 60 : 28,
      maxHp: kind === "bomber" ? 60 : 28,
      vx: kind === "bomber" ? -90 : -140 - w * 8,
      vy: (Math.random() - 0.5) * 40,
      r: kind === "bomber" ? 32 : 22,
      score: kind === "bomber" ? 250 : 100,
      money: kind === "bomber" ? 80 : 35,
      fireCd: 0.8 + Math.random(),
      phase: Math.random() * Math.PI * 2,
      rot: 0,
    });
  }

  if (w % 3 === 0) {
    game.enemies.push({
      kind: "turret",
      x: W + 20,
      y: H * 0.82,
      hp: 80,
      maxHp: 80,
      vx: -70,
      vy: 0,
      r: 28,
      score: 300,
      money: 100,
      fireCd: 1.2,
      rot: 0,
    });
  }
}

function nearestEnemy(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const e of game.enemies) {
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function hitTest(a, b, ar, br) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < (ar + br) ** 2;
}

function damagePlayer(amount) {
  if (game.invuln > 0) return;
  game.hp -= amount;
  game.invuln = 1.1;
  game.shake = 12;
  spawnBurst(game.x, game.y, "#ff6b3d", 16);
  updateHud();
  if (game.hp <= 0) {
    game.hp = 0;
    highScore = Math.max(highScore, game.score);
    localStorage.setItem("skyContractHS", String(highScore));
    money += Math.floor(game.score / 10);
    state = "gameover";
    ui.classList.add("hidden");
  }
}

function updatePlaying(dt) {
  game.t += dt;
  game.parallax += 180 * dt;
  game.fireCd = Math.max(0, game.fireCd - dt);
  game.specialCd = Math.max(0, game.specialCd - dt);
  game.invuln = Math.max(0, game.invuln - dt);
  game.shake = Math.max(0, game.shake - dt * 40);

  const speed = game.plane.speed * 60;
  let mx = 0;
  let my = 0;
  if (keys["KeyW"] || keys["ArrowUp"]) my -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) my += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) mx -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    game.x += (mx / len) * speed * dt;
    game.y += (my / len) * speed * dt;
  }
  game.x = Math.max(50, Math.min(W * 0.55, game.x));
  game.y = Math.max(40, Math.min(H - 60, game.y));

  const thrusting = mx > 0 || keys["Space"];
  if (keys["Space"]) firePlayer(false);
  if (keys["ShiftLeft"] || keys["ShiftRight"]) firePlayer(true);

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 && !game.bossSpawned) {
    spawnWave();
    game.spawnTimer = 3.2 - Math.min(1.5, game.wave * 0.12);
  }

  // Enemies
  for (const e of game.enemies) {
    e.x += e.vx * dt;
    if (e.kind === "fighter") {
      e.phase = (e.phase || 0) + dt;
      e.y += Math.sin(e.phase * 2.5) * 50 * dt;
    } else if (e.kind === "boss") {
      if (e.x > W - 180) e.x += e.vx * dt;
      else {
        e.y += Math.sin(game.t * 1.2) * 70 * dt;
        e.y = Math.max(100, Math.min(H - 100, e.y));
      }
      e.fireCd -= dt;
      if (e.fireCd <= 0) {
        e.pattern = (e.pattern + 1) % 3;
        e.fireCd = e.pattern === 2 ? 1.4 : 0.55;
        if (e.pattern === 0) {
          for (let i = -3; i <= 3; i++) {
            game.bullets.push({
              x: e.x - 40,
              y: e.y,
              vx: -220,
              vy: i * 55,
              r: 6,
              dmg: 12,
              from: "enemy",
              color: "#ff6b3d",
            });
          }
        } else if (e.pattern === 1) {
          const ang = Math.atan2(game.y - e.y, game.x - e.x);
          for (let i = 0; i < 5; i++) {
            const a = ang + (i - 2) * 0.12;
            game.bullets.push({
              x: e.x - 30,
              y: e.y,
              vx: Math.cos(a) * 280,
              vy: Math.sin(a) * 280,
              r: 5,
              dmg: 10,
              from: "enemy",
              color: "#ff4d6d",
            });
          }
        } else {
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + game.t;
            game.bullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 160,
              vy: Math.sin(a) * 160,
              r: 5,
              dmg: 8,
              from: "enemy",
              color: "#ffaa66",
            });
          }
        }
      }
    } else {
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.x < W) {
        e.fireCd = e.kind === "bomber" ? 1.8 : 1.4;
        const ang = Math.atan2(game.y - e.y, game.x - e.x);
        game.bullets.push({
          x: e.x - 10,
          y: e.y,
          vx: Math.cos(ang) * 240,
          vy: Math.sin(ang) * 240,
          r: 5,
          dmg: e.kind === "bomber" ? 14 : 10,
          from: "enemy",
          color: "#ff8a5c",
        });
      }
    }

    if (hitTest(game, e, 18, e.r * 0.7)) {
      damagePlayer(e.kind === "boss" ? 25 : 15);
      if (e.kind !== "boss") e.hp = 0;
    }
  }

  // Bullets
  for (const b of game.bullets) {
    if (b.homing) {
      const target = nearestEnemy(b.x, b.y);
      if (target) {
        const ang = Math.atan2(target.y - b.y, target.x - b.x);
        b.vx += Math.cos(ang) * 600 * dt;
        b.vy += Math.sin(ang) * 600 * dt;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const max = 520;
        if (sp > max) {
          b.vx = (b.vx / sp) * max;
          b.vy = (b.vy / sp) * max;
        }
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // Collisions player bullets → enemies
  for (const b of game.bullets) {
    if (b.from !== "player" || b.dead) continue;
    for (const e of game.enemies) {
      if (e.hp <= 0) continue;
      if (hitTest(b, e, b.r, e.r)) {
        e.hp -= b.dmg;
        b.dead = true;
        spawnBurst(b.x, b.y, b.color, 4);
        if (e.hp <= 0) {
          game.score += e.score;
          money += e.money;
          spawnBurst(e.x, e.y, "#ffaa66", e.kind === "boss" ? 40 : 18);
          game.shake = e.kind === "boss" ? 20 : 6;
          if (Math.random() < 0.35 || e.kind === "boss") {
            const types = ["money", "heal", "power"];
            game.powerups.push({
              x: e.x,
              y: e.y,
              type: e.kind === "boss" ? "money" : types[(Math.random() * 3) | 0],
              life: 8,
            });
          }
          if (e.kind === "boss") {
            game.score += 2000;
            money += 1500;
            highScore = Math.max(highScore, game.score);
            localStorage.setItem("skyContractHS", String(highScore));
            game.stageComplete = true;
            game.messages.push({ text: "CONTRATO CUMPLIDO", life: 2 });
            setTimeout(() => {
              state = "victory";
              ui.classList.add("hidden");
            }, 2000);
          }
        }
        break;
      }
    }
  }

  // Enemy bullets → player
  for (const b of game.bullets) {
    if (b.from !== "enemy" || b.dead) continue;
    if (hitTest(b, game, b.r, 16)) {
      b.dead = true;
      damagePlayer(b.dmg);
    }
  }

  // Powerups
  for (const p of game.powerups) {
    p.life -= dt;
    p.x -= 40 * dt;
    if (hitTest(p, game, 14, 20)) {
      p.life = 0;
      if (p.type === "money") {
        money += 200;
        game.score += 100;
      } else if (p.type === "heal") {
        game.hp = Math.min(game.maxHp, game.hp + 30);
      } else if (p.type === "power") {
        game.power = Math.min(3, game.power + 1);
      }
      spawnBurst(p.x, p.y, "#f0c14b", 10);
    }
  }

  game.bullets = game.bullets.filter(
    (b) => !b.dead && b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40
  );
  game.enemies = game.enemies.filter((e) => e.hp > 0 && e.x > -120);
  game.powerups = game.powerups.filter((p) => p.life > 0);
  game.particles = game.particles.filter((p) => {
    p.life -= dt * 1.4;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    return p.life > 0;
  });
  game.messages = game.messages.filter((m) => {
    m.life -= dt;
    return m.life > 0;
  });

  updateHud();
  drawPlaying(thrusting);
}

function drawPlaying(thrusting) {
  const sx = (Math.random() - 0.5) * game.shake;
  const sy = (Math.random() - 0.5) * game.shake;
  ctx.save();
  ctx.translate(sx, sy);

  drawSky(ctx, W, H, game.t, game.parallax);

  for (const p of game.powerups) drawPowerup(ctx, p, game.t);
  for (const e of game.enemies) {
    drawEnemy(ctx, e, game.t);
    if (e.kind === "boss") {
      const bw = 160;
      const bh = 8;
      const pct = e.hp / e.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(e.x - bw / 2, e.y - 80, bw, bh);
      ctx.fillStyle = "#ff4d6d";
      ctx.fillRect(e.x - bw / 2, e.y - 80, bw * pct, bh);
    }
  }
  for (const b of game.bullets) drawBullet(ctx, b);
  for (const p of game.particles) drawParticle(ctx, p);

  if (game.invuln <= 0 || Math.floor(game.t * 20) % 2 === 0) {
    drawPlayerPlane(ctx, game.x, game.y, game.plane, game.t, thrusting);
  }

  // Special cooldown ring
  if (game.specialCd > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      game.x,
      game.y + 40,
      10,
      -Math.PI / 2,
      -Math.PI / 2 + (1 - game.specialCd / game.plane.specialCooldown) * Math.PI * 2
    );
    ctx.stroke();
  }

  for (const m of game.messages) {
    ctx.font = "700 22px Orbitron, sans-serif";
    ctx.fillStyle = `rgba(232, 240, 247, ${Math.min(1, m.life)})`;
    ctx.textAlign = "center";
    ctx.fillText(m.text, W / 2, 80);
  }

  ctx.restore();
}

/* ---------- Menús ---------- */

let titlePulse = 0;
let hangarCursorBlink = 0;

function drawTitle(dt) {
  titlePulse += dt;
  drawSky(ctx, W, H, titlePulse, titlePulse * 40);

  // Overlay
  ctx.fillStyle = "rgba(4, 10, 18, 0.35)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#3dd6c6";
  ctx.font = "500 14px Orbitron, sans-serif";
  ctx.letterSpacing = "0.4em";
  ctx.fillText("MERCENARY AIR COMBAT", W / 2, H * 0.28);

  ctx.fillStyle = "#e8f0f7";
  ctx.font = "900 64px Orbitron, sans-serif";
  ctx.fillText("SKY CONTRACT", W / 2, H * 0.4);

  ctx.fillStyle = "#8aa0b5";
  ctx.font = "400 20px Rajdhani, sans-serif";
  ctx.fillText(
    "Inspirado en el género de UN Squadron / Area 88 — IP original",
    W / 2,
    H * 0.48
  );

  const blink = 0.55 + Math.sin(titlePulse * 3) * 0.45;
  ctx.fillStyle = `rgba(240, 193, 75, ${blink})`;
  ctx.font = "700 22px Rajdhani, sans-serif";
  ctx.fillText("Pulsa ENTER o ESPACIO — Hangar", W / 2, H * 0.62);

  ctx.fillStyle = "#8aa0b5";
  ctx.font = "400 16px Rajdhani, sans-serif";
  ctx.fillText(`Récord: ${highScore.toLocaleString("en-US")}  ·  Crédito: $${money}`, W / 2, H * 0.72);

  // Avión decorativo
  drawPlayerPlane(ctx, W * 0.5, H * 0.85, PLANES[0], titlePulse, true);
}

function drawHangar(dt) {
  hangarCursorBlink += dt;
  drawSky(ctx, W, H, hangarCursorBlink, hangarCursorBlink * 20);
  ctx.fillStyle = "rgba(4, 10, 18, 0.72)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#3dd6c6";
  ctx.font = "700 28px Orbitron, sans-serif";
  ctx.fillText("HANGAR — ELIGE TU MÁQUINA", W / 2, 70);

  ctx.fillStyle = "#f0c14b";
  ctx.font = "600 18px Rajdhani, sans-serif";
  ctx.fillText(`Crédito disponible: $${money.toLocaleString("en-US")}`, W / 2, 105);

  const cardW = 280;
  const gap = 40;
  const total = PLANES.length * cardW + (PLANES.length - 1) * gap;
  const startX = (W - total) / 2;

  PLANES.forEach((plane, i) => {
    const x = startX + i * (cardW + gap);
    const y = 160;
    const selected = i === selectedPlaneIdx;
    const owned = unlocked.has(plane.id);

    ctx.fillStyle = selected ? "rgba(61, 214, 198, 0.15)" : "rgba(255,255,255,0.04)";
    ctx.strokeStyle = selected ? plane.color : "rgba(138,160,181,0.35)";
    ctx.lineWidth = selected ? 2.5 : 1;
    roundRect(ctx, x, y, cardW, 420, 8);
    ctx.fill();
    ctx.stroke();

    drawPlayerPlane(ctx, x + cardW / 2, y + 90, plane, hangarCursorBlink + i, selected);

    ctx.textAlign = "center";
    ctx.fillStyle = plane.color;
    ctx.font = "700 20px Orbitron, sans-serif";
    ctx.fillText(plane.name, x + cardW / 2, y + 170);

    ctx.fillStyle = "#8aa0b5";
    ctx.font = "400 15px Rajdhani, sans-serif";
    wrapText(ctx, plane.tagline, x + cardW / 2, y + 198, cardW - 36, 20);

    ctx.fillStyle = "#e8f0f7";
    ctx.font = "600 15px Rajdhani, sans-serif";
    const stats = [
      `Blindaje  ${plane.hp}`,
      `Velocidad  ${plane.speed.toFixed(1)}`,
      `Cadencia  ${(1 / plane.fireRate).toFixed(1)}/s`,
      `Daño  ${plane.damage}`,
      `Especial  ${plane.special.toUpperCase()}`,
    ];
    stats.forEach((s, si) => {
      ctx.fillText(s, x + cardW / 2, y + 255 + si * 22);
    });

    ctx.font = "700 16px Orbitron, sans-serif";
    if (owned) {
      ctx.fillStyle = "#3dd6c6";
      ctx.fillText(selected ? "► LISTO" : "DESBLOQUEADO", x + cardW / 2, y + 390);
    } else {
      ctx.fillStyle = money >= plane.price ? "#f0c14b" : "#ff4d6d";
      ctx.fillText(`COMPRAR $${plane.price}`, x + cardW / 2, y + 390);
    }
  });

  ctx.fillStyle = "#8aa0b5";
  ctx.font = "400 16px Rajdhani, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "← → elegir  ·  ENTER despegar / comprar  ·  ESC menú",
    W / 2,
    H - 40
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

function drawEndScreen(victory) {
  drawSky(ctx, W, H, game.t || 1, game.parallax || 100);
  ctx.fillStyle = "rgba(4, 10, 18, 0.75)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = victory ? "#3dd6c6" : "#ff4d6d";
  ctx.font = "900 48px Orbitron, sans-serif";
  ctx.fillText(victory ? "MISIÓN CUMPLIDA" : "DERRIBADO", W / 2, H * 0.35);

  ctx.fillStyle = "#e8f0f7";
  ctx.font = "600 24px Rajdhani, sans-serif";
  ctx.fillText(`Puntos: ${game.score.toLocaleString("en-US")}`, W / 2, H * 0.48);
  ctx.fillText(`Crédito total: $${money.toLocaleString("en-US")}`, W / 2, H * 0.54);
  ctx.fillStyle = "#8aa0b5";
  ctx.font = "400 18px Rajdhani, sans-serif";
  ctx.fillText("ENTER — Hangar   ·   ESC — Título", W / 2, H * 0.68);
}

/* ---------- Input menús ---------- */

const justPressed = Object.create(null);
window.addEventListener("keydown", (e) => {
  if (justPressed[e.code]) return;
  justPressed[e.code] = true;

  if (state === "title") {
    if (e.code === "Enter" || e.code === "Space") {
      state = "hangar";
    }
  } else if (state === "hangar") {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      selectedPlaneIdx = (selectedPlaneIdx + PLANES.length - 1) % PLANES.length;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      selectedPlaneIdx = (selectedPlaneIdx + 1) % PLANES.length;
    }
    if (e.code === "Escape") state = "title";
    if (e.code === "Enter" || e.code === "Space") {
      const plane = PLANES[selectedPlaneIdx];
      if (!unlocked.has(plane.id)) {
        if (money >= plane.price) {
          money -= plane.price;
          unlocked.add(plane.id);
        }
      } else {
        resetRun(plane.id);
        state = "playing";
      }
    }
  } else if (state === "playing") {
    if (e.code === "Escape") {
      state = "paused";
    }
  } else if (state === "paused") {
    if (e.code === "Escape" || e.code === "Enter") state = "playing";
  } else if (state === "gameover" || state === "victory") {
    if (e.code === "Enter" || e.code === "Space") state = "hangar";
    if (e.code === "Escape") state = "title";
  }
});

window.addEventListener("keyup", (e) => {
  justPressed[e.code] = false;
});

/* ---------- Loop ---------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (state === "title") drawTitle(dt);
  else if (state === "hangar") drawHangar(dt);
  else if (state === "playing") updatePlaying(dt);
  else if (state === "paused") {
    drawPlaying(false);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8f0f7";
    ctx.font = "700 36px Orbitron, sans-serif";
    ctx.fillText("PAUSA", W / 2, H / 2);
  } else if (state === "gameover") drawEndScreen(false);
  else if (state === "victory") drawEndScreen(true);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
