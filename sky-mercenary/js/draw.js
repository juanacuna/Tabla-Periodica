/** Render HD procedural — aviones, enemigos, FX. */

function drawSky(ctx, w, h, t, parallax) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0a1a33");
  g.addColorStop(0.45, "#12304f");
  g.addColorStop(0.72, "#1a4560");
  g.addColorStop(1, "#2a5a4a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Sol bajo
  const sunX = w * 0.78 + Math.sin(t * 0.05) * 8;
  const sunY = h * 0.28;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 180);
  sun.addColorStop(0, "rgba(255, 200, 120, 0.55)");
  sun.addColorStop(0.4, "rgba(255, 140, 80, 0.18)");
  sun.addColorStop(1, "rgba(255, 100, 60, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Nubes lejanas
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 220 - parallax * 0.15) % (w + 300)) - 100;
    const cy = 60 + (i % 4) * 40;
    drawCloud(ctx, cx, cy, 90 + (i % 3) * 30, 0.12 + (i % 3) * 0.04);
  }
  ctx.restore();

  // Cordillera / suelo
  drawTerrain(ctx, w, h, parallax);
}

function drawCloud(ctx, x, y, s, a) {
  ctx.fillStyle = `rgba(200, 220, 240, ${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.35, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.4, y - 8, s * 0.55, s * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.35, y + 4, s * 0.5, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTerrain(ctx, w, h, parallax) {
  const baseY = h * 0.78;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const n =
      Math.sin((x + parallax * 0.6) * 0.008) * 28 +
      Math.sin((x + parallax * 0.6) * 0.021) * 14 +
      Math.sin((x + parallax * 0.9) * 0.003) * 50;
    ctx.lineTo(x, baseY + n);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const tg = ctx.createLinearGradient(0, baseY - 40, 0, h);
  tg.addColorStop(0, "#1e4a3a");
  tg.addColorStop(0.5, "#143528");
  tg.addColorStop(1, "#0a1c14");
  ctx.fillStyle = tg;
  ctx.fill();

  // Silueta media
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 6) {
    const n =
      Math.sin((x + parallax) * 0.012) * 18 +
      Math.sin((x + parallax) * 0.035) * 10;
    ctx.lineTo(x, h * 0.88 + n);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "rgba(8, 24, 18, 0.85)";
  ctx.fill();
}

function drawPlayerPlane(ctx, x, y, plane, t, thrusting) {
  ctx.save();
  ctx.translate(x, y);
  const s = 1.15 * (plane.wingspan || 1);

  // Sombra de velocidad
  if (thrusting) {
    ctx.fillStyle = "rgba(61, 214, 198, 0.15)";
    ctx.beginPath();
    ctx.ellipse(-28 * s, 0, 40 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Estela
  const flame = 10 + Math.sin(t * 40) * 4 + (thrusting ? 8 : 0);
  const fg = ctx.createLinearGradient(-50 * s, 0, -50 * s - flame * 2, 0);
  fg.addColorStop(0, plane.color);
  fg.addColorStop(0.5, "rgba(255, 180, 80, 0.7)");
  fg.addColorStop(1, "rgba(255, 80, 40, 0)");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-42 * s, -4);
  ctx.lineTo(-42 * s - flame * 2.2, 0);
  ctx.lineTo(-42 * s, 4);
  ctx.closePath();
  ctx.fill();

  // Alas
  ctx.fillStyle = plane.accent;
  ctx.beginPath();
  ctx.moveTo(-8 * s, 0);
  ctx.lineTo(-18 * s, 28 * s);
  ctx.lineTo(8 * s, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8 * s, 0);
  ctx.lineTo(-18 * s, -28 * s);
  ctx.lineTo(8 * s, -4);
  ctx.closePath();
  ctx.fill();

  // Fuselaje
  const body = ctx.createLinearGradient(0, -12 * s, 0, 12 * s);
  body.addColorStop(0, "#e8f4ff");
  body.addColorStop(0.4, plane.color);
  body.addColorStop(1, plane.accent);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(38 * s, 0);
  ctx.quadraticCurveTo(20 * s, -10 * s, -10 * s, -9 * s);
  ctx.lineTo(-42 * s, -5 * s);
  ctx.lineTo(-42 * s, 5 * s);
  ctx.lineTo(-10 * s, 9 * s);
  ctx.quadraticCurveTo(20 * s, 10 * s, 38 * s, 0);
  ctx.closePath();
  ctx.fill();

  // Cabina
  ctx.fillStyle = "rgba(180, 230, 255, 0.85)";
  ctx.beginPath();
  ctx.ellipse(8 * s, -2 * s, 10 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Detalle borde
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(30 * s, 0);
  ctx.lineTo(-35 * s, 0);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx, e, t) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot || 0);

  if (e.kind === "fighter") {
    ctx.fillStyle = "#c45c5c";
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(18, -14);
    ctx.lineTo(10, 0);
    ctx.lineTo(18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8b3030";
    ctx.fillRect(-8, -3, 16, 6);
  } else if (e.kind === "bomber") {
    ctx.fillStyle = "#6b7a8a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a5560";
    ctx.fillRect(-20, -22, 40, 8);
    ctx.fillRect(-20, 14, 40, 8);
  } else if (e.kind === "turret") {
    ctx.fillStyle = "#5a6a4a";
    ctx.fillRect(-18, 8, 36, 20);
    ctx.fillStyle = "#8a9a6a";
    ctx.beginPath();
    ctx.arc(0, 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c8d8a0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-28, 6 + Math.sin(t * 2) * 4);
    ctx.stroke();
  } else if (e.kind === "boss") {
    const pulse = 1 + Math.sin(t * 3) * 0.03;
    ctx.scale(pulse, pulse);
    const g = ctx.createLinearGradient(-80, 0, 80, 0);
    g.addColorStop(0, "#4a1a2a");
    g.addColorStop(0.5, "#c04050");
    g.addColorStop(1, "#2a1020");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    ctx.lineTo(-20, -55);
    ctx.lineTo(90, -20);
    ctx.lineTo(70, 0);
    ctx.lineTo(90, 20);
    ctx.lineTo(-20, 55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 100, 80, 0.9)";
    ctx.beginPath();
    ctx.arc(20, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 200, 150, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-50, -12, 40, 24);
  }

  ctx.restore();
}

function drawBullet(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.from === "player") {
    const g = ctx.createLinearGradient(-8, 0, 12, 0);
    g.addColorStop(0, "rgba(61, 214, 198, 0)");
    g.addColorStop(0.4, b.color || "#3dd6c6");
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 2.2, b.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = b.color || "#ff6b3d";
    ctx.shadowColor = b.color || "#ff6b3d";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticle(ctx, p) {
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPowerup(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(t * 2);
  const colors = { money: "#f0c14b", heal: "#3dd6c6", power: "#ff6b3d" };
  ctx.fillStyle = colors[p.type] || "#fff";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 12 : 6;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
