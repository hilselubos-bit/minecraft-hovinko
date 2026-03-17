// ─── Bucket (kbelík) character sheet ─────────────────────────────────────────
function buildBucketSheet() {
    const c = document.createElement('canvas');
    c.width = 208; c.height = 76;
    const g = c.getContext('2d');
    [0, 1, 2, 3].forEach(f => drawBucketFrame(g, f * 52, f));
    return c;
}

function drawBucketFrame(g, ox, fr) {
    const cx = ox + 26;
    const tilts = [0, 8, 0, -8];
    const tilt = tilts[fr] * Math.PI / 180;

    g.save();
    g.translate(cx, 70); g.rotate(tilt); g.translate(-cx, -70);

    // Wire handle (above rim)
    g.strokeStyle = '#7799BB'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, 33, 14, Math.PI, 2 * Math.PI); g.stroke();
    g.fillStyle = '#5577AA';
    g.beginPath(); g.arc(cx - 12, 33, 3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 12, 33, 3, 0, Math.PI * 2); g.fill();

    // Rim (top ellipse)
    g.fillStyle = '#5BAAD8';
    g.beginPath(); g.ellipse(cx, 33, 16, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2A6898';
    g.beginPath(); g.ellipse(cx, 33, 16, 4, 0, Math.PI, Math.PI * 2); g.fill();

    // Bucket body (trapezoid)
    g.fillStyle = '#3A88C0';
    g.beginPath();
    g.moveTo(cx - 14, 33); g.lineTo(cx + 14, 33);
    g.lineTo(cx + 19, 68); g.lineTo(cx - 19, 68);
    g.closePath(); g.fill();

    // Highlight stripe
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.beginPath();
    g.moveTo(cx - 13, 35); g.lineTo(cx - 7, 35);
    g.lineTo(cx - 12, 66); g.lineTo(cx - 17, 66);
    g.closePath(); g.fill();

    // Bottom disc
    g.fillStyle = '#2A6898';
    g.beginPath(); g.ellipse(cx, 68, 19, 4, 0, 0, Math.PI * 2); g.fill();

    // === Face ===
    const faceY = 50;
    // Cheeks
    g.fillStyle = 'rgba(255,120,100,0.3)';
    g.beginPath(); g.arc(cx - 8, faceY + 4, 5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 8, faceY + 4, 5, 0, Math.PI * 2); g.fill();

    // Eyebrows
    const eyeY = faceY - 5;
    g.strokeStyle = '#1A3A5A'; g.lineWidth = 1.5;
    if (fr === 1 || fr === 3) {
        g.beginPath(); g.moveTo(cx - 9, eyeY - 5); g.lineTo(cx - 3, eyeY - 7); g.stroke();
        g.beginPath(); g.moveTo(cx + 3, eyeY - 7); g.lineTo(cx + 9, eyeY - 5); g.stroke();
    } else if (fr === 2) {
        g.beginPath(); g.moveTo(cx - 9, eyeY - 6); g.lineTo(cx - 3, eyeY - 8); g.stroke();
        g.beginPath(); g.moveTo(cx + 3, eyeY - 8); g.lineTo(cx + 9, eyeY - 6); g.stroke();
    } else {
        g.beginPath(); g.moveTo(cx - 9, eyeY - 4); g.lineTo(cx - 3, eyeY - 4); g.stroke();
        g.beginPath(); g.moveTo(cx + 3, eyeY - 4); g.lineTo(cx + 9, eyeY - 4); g.stroke();
    }

    // Eyes
    const eyeH = fr === 2 ? 3.8 : fr === 0 ? 3.0 : 3.3;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(cx - 5, eyeY, 3.5, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 5, eyeY, 3.5, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1A2A3A';
    g.beginPath(); g.arc(cx - 4.5, eyeY + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 5.5, eyeY + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(cx - 3.8, eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 6.2, eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();

    // Mouth
    g.strokeStyle = '#1A3A5A'; g.lineWidth = 1.5;
    const mY = faceY + 9;
    if (fr === 2) {
        g.beginPath(); g.arc(cx, mY - 2, 5.5, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    } else if (fr === 1 || fr === 3) {
        g.beginPath(); g.arc(cx, mY, 2.8, 0, Math.PI * 2); g.stroke();
    } else {
        g.beginPath(); g.arc(cx, mY - 1, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    }

    // Water splash on moving frames
    if (fr === 1 || fr === 3) {
        g.fillStyle = 'rgba(120,200,255,0.65)';
        const sd = fr === 1 ? 1 : -1;
        g.beginPath(); g.arc(cx + sd * 13, 23, 4.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(cx + sd * 19, 28, 2.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(cx + sd * 15, 18, 2,   0, Math.PI * 2); g.fill();
    }

    g.restore();
}

// ─── Broom (koště) character sheet ───────────────────────────────────────────
function buildBroomSheet() {
    const c = document.createElement('canvas');
    c.width = 208; c.height = 76;
    const g = c.getContext('2d');
    [0, 1, 2, 3].forEach(f => drawBroomFrame(g, f * 52, f));
    return c;
}

function drawBroomFrame(g, ox, fr) {
    const cx = ox + 26;
    const tilts = [0, 10, 0, -10];
    const tilt = tilts[fr] * Math.PI / 180;

    g.save();
    g.translate(cx, 74); g.rotate(tilt); g.translate(-cx, -74);

    // === Handle stick (back layer) ===
    g.fillStyle = '#D4A060';
    g.fillRect(cx - 4, 5, 8, 54);
    g.fillStyle = '#B07030';
    g.fillRect(cx - 3, 5, 2, 54);
    g.fillStyle = '#E8C080';
    g.fillRect(cx, 5, 2, 54);

    // === Top knob ===
    g.fillStyle = '#A06030';
    g.beginPath(); g.arc(cx, 8, 6.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#D4A070';
    g.beginPath(); g.arc(cx - 1.5, 6, 2.5, 0, Math.PI * 2); g.fill();

    // === Face bulge (round section over handle) ===
    const faceY = 28;
    g.fillStyle = '#DEB887';
    g.beginPath(); g.arc(cx, faceY, 12, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#B07840'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, faceY, 12, 0, Math.PI * 2); g.stroke();

    // Cheeks
    g.fillStyle = 'rgba(255,110,100,0.32)';
    g.beginPath(); g.arc(cx - 7, faceY + 5, 4.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 7, faceY + 5, 4.5, 0, Math.PI * 2); g.fill();

    // Eyebrows
    const eyeYb = faceY - 3;
    g.strokeStyle = '#4A3010'; g.lineWidth = 1.5;
    if (fr === 1 || fr === 3) {
        g.beginPath(); g.moveTo(cx - 8, eyeYb - 5); g.lineTo(cx - 2, eyeYb - 7); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeYb - 7); g.lineTo(cx + 8, eyeYb - 5); g.stroke();
    } else if (fr === 2) {
        g.beginPath(); g.moveTo(cx - 8, eyeYb - 6); g.lineTo(cx - 2, eyeYb - 8); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeYb - 8); g.lineTo(cx + 8, eyeYb - 6); g.stroke();
    } else {
        g.beginPath(); g.moveTo(cx - 8, eyeYb - 4); g.lineTo(cx - 2, eyeYb - 4); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeYb - 4); g.lineTo(cx + 8, eyeYb - 4); g.stroke();
    }

    // Eyes
    const eyeHb = fr === 2 ? 3.8 : fr === 0 ? 3.0 : 3.3;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(cx - 5, eyeYb, 3.5, eyeHb, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 5, eyeYb, 3.5, eyeHb, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1A0A00';
    g.beginPath(); g.arc(cx - 4.5, eyeYb + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 5.5, eyeYb + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(cx - 3.8, eyeYb - 0.5, 0.8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 6.2, eyeYb - 0.5, 0.8, 0, Math.PI * 2); g.fill();

    // Mouth
    g.strokeStyle = '#4A3010'; g.lineWidth = 1.5;
    const mYb = faceY + 8;
    if (fr === 2) {
        g.beginPath(); g.arc(cx, mYb - 1, 5, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    } else if (fr === 1 || fr === 3) {
        g.beginPath(); g.arc(cx, mYb, 2.5, 0, Math.PI * 2); g.stroke();
    } else {
        g.beginPath(); g.arc(cx, mYb - 1, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    }

    // === Binding collar ===
    g.fillStyle = '#5A3A15';
    g.fillRect(cx - 7, 54, 14, 5);
    g.fillStyle = '#8B5E2A';
    g.fillRect(cx - 6, 55, 12, 2);

    // === Bristle base ellipse ===
    g.fillStyle = '#D4B050';
    g.beginPath(); g.ellipse(cx, 64, 18, 7, 0, 0, Math.PI * 2); g.fill();

    // === Bristle strands ===
    const spread = fr === 1 ? 7 : fr === 3 ? -7 : 0;
    g.strokeStyle = '#A07A18'; g.lineWidth = 1.8;
    for (let i = -5; i <= 5; i++) {
        g.beginPath();
        g.moveTo(cx + i * 3, 62);
        g.lineTo(cx + i * 3.5 + spread * 0.45, 74);
        g.stroke();
    }
    g.strokeStyle = '#7A5A10'; g.lineWidth = 1;
    for (const iv of [-7, 7]) {
        g.beginPath();
        g.moveTo(cx + iv * 2, 64);
        g.lineTo(cx + iv * 2.5 + spread * 0.7, 73);
        g.stroke();
    }

    g.restore();
}

// ─── Toilet character sheet — boční profil, animace zdvihání prkýnka ─────────
function buildToiletCharSheet() {
    const c = document.createElement('canvas');
    c.width = 208; c.height = 76;
    const g = c.getContext('2d');
    [0, 1, 2, 3].forEach(f => drawToiletCharFrame(g, f * 52, f));
    return c;
}

function drawToiletCharFrame(g, ox, fr) {
    // Úhly prkýnka: zavřeno → napůl → otevřeno → napůl
    const lidAngle = [0, -52, -100, -52][fr] * Math.PI / 180;
    // Závěs prkýnka — kde mísa navazuje na nádrž
    const hx = ox + 13, hy = 37;

    // ── Základna ──────────────────────────────────────────────────────────────
    g.fillStyle = '#DCDCDC';
    g.fillRect(ox + 3, 67, 46, 9);
    g.strokeStyle = '#BBBBBB'; g.lineWidth = 1.5; g.strokeRect(ox + 3, 67, 46, 9);

    // ── Mísa — boční D-profil ──────────────────────────────────────────────────
    g.fillStyle = '#F5F5F5';
    g.beginPath();
    g.moveTo(ox + 10, 38);
    g.lineTo(ox + 10, 67);
    g.lineTo(ox + 45, 67);
    g.quadraticCurveTo(ox + 52, 53, ox + 46, 38);
    g.closePath(); g.fill();
    g.strokeStyle = '#C4C4C4'; g.lineWidth = 1.5; g.stroke();

    // Spodní stín mísy
    g.fillStyle = 'rgba(0,0,0,0.05)';
    g.beginPath();
    g.moveTo(ox + 10, 57); g.lineTo(ox + 10, 67); g.lineTo(ox + 32, 67);
    g.closePath(); g.fill();

    // Voda v míse
    g.fillStyle = 'rgba(100, 195, 245, 0.45)';
    g.beginPath();
    g.moveTo(ox + 13, 55); g.lineTo(ox + 43, 55);
    g.quadraticCurveTo(ox + 47, 64, ox + 43, 66);
    g.lineTo(ox + 13, 66); g.closePath(); g.fill();

    // Vlnka vody (na liché snímky)
    if (fr === 1 || fr === 3) {
        g.strokeStyle = 'rgba(70, 160, 230, 0.45)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(ox + 18, 60); g.quadraticCurveTo(ox + 28, 57, ox + 38, 60); g.stroke();
    }

    // ── Nádrž — boční pohled (vzadu, užší) ────────────────────────────────────
    g.fillStyle = '#EFEFEF';
    g.fillRect(ox + 2, 9, 20, 30);
    g.strokeStyle = '#C4C4C4'; g.lineWidth = 1.5; g.strokeRect(ox + 2, 9, 20, 30);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(ox + 4, 12, 9, 5); // highlight

    // Tlačítko splachování nahoře
    g.fillStyle = '#BBBBBB'; g.fillRect(ox + 5, 5, 14, 6);
    g.fillStyle = '#D0D0D0'; g.fillRect(ox + 7, 7, 9, 2);

    // ── Obličej na nádrži ─────────────────────────────────────────────────────
    // Výraz závisí na snímku: 0=klid, 1=překvapení, 2=nadšení, 3=překvapení
    const eyeY   = 20;
    const mouthY = 30;

    // Tváře (červené)
    g.fillStyle = 'rgba(255, 100, 100, 0.25)';
    g.beginPath(); g.arc(ox + 6,  eyeY + 6, 4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(ox + 16, eyeY + 6, 4, 0, Math.PI * 2); g.fill();

    // Obočí
    g.strokeStyle = '#555555'; g.lineWidth = 1.5;
    if (fr === 1 || fr === 3) {
        // Překvapené — zvednuté obočí
        g.beginPath(); g.moveTo(ox + 4,  eyeY - 5); g.lineTo(ox + 9,  eyeY - 7); g.stroke();
        g.beginPath(); g.moveTo(ox + 13, eyeY - 7); g.lineTo(ox + 18, eyeY - 5); g.stroke();
    } else if (fr === 2) {
        // Nadšené — obočí nahoru a dovnitř
        g.beginPath(); g.moveTo(ox + 4,  eyeY - 6); g.lineTo(ox + 9,  eyeY - 8); g.stroke();
        g.beginPath(); g.moveTo(ox + 13, eyeY - 8); g.lineTo(ox + 18, eyeY - 6); g.stroke();
    } else {
        // Klidné rovné obočí
        g.beginPath(); g.moveTo(ox + 4,  eyeY - 4); g.lineTo(ox + 9,  eyeY - 4); g.stroke();
        g.beginPath(); g.moveTo(ox + 13, eyeY - 4); g.lineTo(ox + 18, eyeY - 4); g.stroke();
    }

    // Oči
    const eyeOpenY = fr === 2 ? 3.5 : fr === 0 ? 2.8 : 3.2; // výška oka
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(ox + 7,  eyeY, 3.2, eyeOpenY, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(ox + 15, eyeY, 3.2, eyeOpenY, 0, 0, Math.PI * 2); g.fill();
    // Zorničky
    g.fillStyle = '#222222';
    g.beginPath(); g.arc(ox + 7.5,  eyeY + 0.5, 1.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(ox + 15.5, eyeY + 0.5, 1.5, 0, Math.PI * 2); g.fill();
    // Odlesk v oku
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(ox + 8,  eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(ox + 16, eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();

    // Pusa
    g.strokeStyle = '#555555'; g.lineWidth = 1.5;
    if (fr === 2) {
        // Nadšený velký úsměv
        g.beginPath();
        g.arc(ox + 11, mouthY - 2, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        g.stroke();
    } else if (fr === 1 || fr === 3) {
        // Překvapené "O"
        g.beginPath(); g.arc(ox + 11, mouthY, 2.5, 0, Math.PI * 2); g.stroke();
    } else {
        // Klidný lehký úsměv
        g.beginPath();
        g.arc(ox + 11, mouthY - 1, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
    }

    // ── Prkýnko (sedátko) — otáčí se kolem závěsu ─────────────────────────────
    g.save();
    g.translate(hx, hy);
    g.rotate(lidAngle);

    g.fillStyle = '#E6E6E6';
    g.beginPath();
    g.moveTo(0, -5);
    g.lineTo(34, -5);
    g.quadraticCurveTo(38, 0, 34, 6);
    g.lineTo(0, 6);
    g.closePath(); g.fill();
    g.strokeStyle = '#C0C0C0'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(2, -4, 22, 2); // highlight

    g.restore();

    // Závěs (kolíček)
    g.fillStyle = '#AAAAAA';
    g.beginPath(); g.arc(hx, hy, 3, 0, Math.PI * 2); g.fill();
}

// ─── Soap dispenser (tekuté mýdlo) character sheet ───────────────────────────
function buildSoapSheet() {
    const c = document.createElement('canvas');
    c.width = 208; c.height = 76;
    const g = c.getContext('2d');
    [0, 1, 2, 3].forEach(f => drawSoapFrame(g, f * 52, f));
    return c;
}

function drawSoapFrame(g, ox, fr) {
    const cx = ox + 26;
    const tilts = [0, 8, 0, -8];
    const tilt = tilts[fr] * Math.PI / 180;

    g.save();
    g.translate(cx, 76); g.rotate(tilt); g.translate(-cx, -76);

    // === Bottle body ===
    const bW = 13;
    g.fillStyle = '#4FC3F7';
    g.beginPath();
    g.moveTo(cx - bW + 3, 28); g.lineTo(cx + bW - 3, 28);
    g.quadraticCurveTo(cx + bW, 28, cx + bW, 34);
    g.lineTo(cx + bW, 64);
    g.quadraticCurveTo(cx + bW, 70, cx + bW - 3, 70);
    g.lineTo(cx - bW + 3, 70);
    g.quadraticCurveTo(cx - bW, 70, cx - bW, 64);
    g.lineTo(cx - bW, 34);
    g.quadraticCurveTo(cx - bW, 28, cx - bW + 3, 28);
    g.closePath(); g.fill();

    // Bottle highlight
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.beginPath(); g.ellipse(cx - 4, 43, 4, 15, 0, 0, Math.PI * 2); g.fill();

    // Bottle outline
    g.strokeStyle = '#0288D1'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx - bW + 3, 28); g.lineTo(cx + bW - 3, 28);
    g.quadraticCurveTo(cx + bW, 28, cx + bW, 34);
    g.lineTo(cx + bW, 64);
    g.quadraticCurveTo(cx + bW, 70, cx + bW - 3, 70);
    g.lineTo(cx - bW + 3, 70);
    g.quadraticCurveTo(cx - bW, 70, cx - bW, 64);
    g.lineTo(cx - bW, 34);
    g.quadraticCurveTo(cx - bW, 28, cx - bW + 3, 28);
    g.closePath(); g.stroke();

    // White label
    g.fillStyle = 'rgba(255,255,255,0.88)';
    g.fillRect(cx - 9, 32, 18, 36);

    // === Pump collar ===
    g.fillStyle = '#78909C';
    g.beginPath(); g.ellipse(cx, 28, 10, 4, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#546E7A'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, 28, 10, 4, 0, 0, Math.PI * 2); g.stroke();

    // === Pump stick (pressed on moving frames) ===
    const pumpOff = (fr === 1 || fr === 3) ? 3 : 0;
    g.fillStyle = '#90A4AE';
    g.fillRect(cx - 2, 10 + pumpOff, 4, 18 - pumpOff);

    // === Pump head ===
    g.fillStyle = '#78909C';
    g.beginPath(); g.ellipse(cx, 10 + pumpOff, 8, 3.5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#546E7A'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, 10 + pumpOff, 8, 3.5, 0, 0, Math.PI * 2); g.stroke();

    // === Nozzle ===
    g.fillStyle = '#607D8B';
    g.fillRect(cx, 7 + pumpOff, 12, 4);
    g.beginPath(); g.arc(cx + 12, 9 + pumpOff, 2, 0, Math.PI * 2); g.fill();

    // Soap bubbles on moving frames
    if (fr === 1 || fr === 3) {
        g.fillStyle = 'rgba(178,235,242,0.85)';
        g.beginPath(); g.arc(cx + 15, 14 + pumpOff, 3.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(cx + 19, 19 + pumpOff, 2,   0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(cx + 12, 19 + pumpOff, 2.5, 0, Math.PI * 2); g.fill();
    }

    // === Base ===
    g.fillStyle = '#0288D1';
    g.beginPath(); g.ellipse(cx, 70, bW, 4, 0, 0, Math.PI * 2); g.fill();

    // === Face ===
    const faceY = 49;
    g.fillStyle = 'rgba(255,120,100,0.3)';
    g.beginPath(); g.arc(cx - 7, faceY + 5, 4.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 7, faceY + 5, 4.5, 0, Math.PI * 2); g.fill();

    const eyeY = faceY - 5;
    g.strokeStyle = '#1A3A5A'; g.lineWidth = 1.5;
    if (fr === 1 || fr === 3) {
        g.beginPath(); g.moveTo(cx - 8, eyeY - 5); g.lineTo(cx - 2, eyeY - 7); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeY - 7); g.lineTo(cx + 8, eyeY - 5); g.stroke();
    } else if (fr === 2) {
        g.beginPath(); g.moveTo(cx - 8, eyeY - 6); g.lineTo(cx - 2, eyeY - 8); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeY - 8); g.lineTo(cx + 8, eyeY - 6); g.stroke();
    } else {
        g.beginPath(); g.moveTo(cx - 8, eyeY - 4); g.lineTo(cx - 2, eyeY - 4); g.stroke();
        g.beginPath(); g.moveTo(cx + 2, eyeY - 4); g.lineTo(cx + 8, eyeY - 4); g.stroke();
    }

    const eyeH = fr === 2 ? 3.8 : fr === 0 ? 3.0 : 3.3;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(cx - 5, eyeY, 3.5, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 5, eyeY, 3.5, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1A2A3A';
    g.beginPath(); g.arc(cx - 4.5, eyeY + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 5.5, eyeY + 0.5, 1.7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(cx - 3.8, eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 6.2, eyeY - 0.5, 0.8, 0, Math.PI * 2); g.fill();

    g.strokeStyle = '#1A3A5A'; g.lineWidth = 1.5;
    const mY = faceY + 9;
    if (fr === 2) {
        g.beginPath(); g.arc(cx, mY - 2, 5, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    } else if (fr === 1 || fr === 3) {
        g.beginPath(); g.arc(cx, mY, 2.8, 0, Math.PI * 2); g.stroke();
    } else {
        g.beginPath(); g.arc(cx, mY - 1, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    }

    g.restore();
}

// ─── Shovel (lopatka) character sheet — turbo nozzles ────────────────────────
function buildShovelSheet() {
    const c = document.createElement('canvas');
    c.width = 208; c.height = 76;
    const g = c.getContext('2d');
    [0, 1, 2, 3].forEach(f => drawShovelFrame(g, f * 52, f));
    return c;
}

function drawShovelFrame(g, ox, fr) {
    const cx = ox + 26;
    const tilts = [0, 8, 0, -8];
    const tilt = tilts[fr] * Math.PI / 180;
    const hasFlame = fr === 1 || fr === 3;

    g.save();
    g.translate(cx, 76); g.rotate(tilt); g.translate(-cx, -76);

    // === Blade (drawn first — behind body) ===
    g.fillStyle = '#1976D2';
    g.beginPath();
    g.moveTo(cx - 22, 57); g.lineTo(cx + 22, 57);
    g.lineTo(cx + 25, 72); g.lineTo(cx - 25, 72);
    g.closePath(); g.fill();
    // Blade highlight
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath();
    g.moveTo(cx - 20, 58); g.lineTo(cx - 10, 58);
    g.lineTo(cx - 12, 70); g.lineTo(cx - 21, 70);
    g.closePath(); g.fill();
    // Blade rim
    g.fillStyle = '#42A5F5';
    g.fillRect(cx - 25, 71, 50, 3);
    g.strokeStyle = '#0D47A1'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx - 22, 57); g.lineTo(cx + 22, 57);
    g.lineTo(cx + 25, 72); g.lineTo(cx - 25, 72);
    g.closePath(); g.stroke();

    // === Handle body ===
    g.fillStyle = '#1E88E5';
    g.fillRect(cx - 7, 14, 14, 45);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(cx - 5, 16, 4, 41);
    g.strokeStyle = '#0D47A1'; g.lineWidth = 1.5;
    g.strokeRect(cx - 7, 14, 14, 45);

    // === Left thruster pod ===
    g.fillStyle = '#455A64';
    g.fillRect(cx - 21, 32, 12, 20);
    g.fillStyle = '#607D8B';
    g.fillRect(cx - 20, 33, 4, 18);
    g.strokeStyle = '#263238'; g.lineWidth = 1;
    g.strokeRect(cx - 21, 32, 12, 20);
    g.strokeStyle = '#546E7A'; g.lineWidth = 0.8;
    [36, 40, 44].forEach(y => { g.beginPath(); g.moveTo(cx - 21, y); g.lineTo(cx - 9, y); g.stroke(); });
    // Left nozzle
    g.fillStyle = '#263238';
    g.beginPath();
    g.moveTo(cx - 21, 38); g.lineTo(cx - 21, 46);
    g.lineTo(cx - 25, 45); g.lineTo(cx - 25, 39);
    g.closePath(); g.fill();

    // === Right thruster pod ===
    g.fillStyle = '#455A64';
    g.fillRect(cx + 9, 32, 12, 20);
    g.fillStyle = '#607D8B';
    g.fillRect(cx + 17, 33, 4, 18);
    g.strokeStyle = '#263238'; g.lineWidth = 1;
    g.strokeRect(cx + 9, 32, 12, 20);
    g.strokeStyle = '#546E7A'; g.lineWidth = 0.8;
    [36, 40, 44].forEach(y => { g.beginPath(); g.moveTo(cx + 9, y); g.lineTo(cx + 21, y); g.stroke(); });
    // Right nozzle
    g.fillStyle = '#263238';
    g.beginPath();
    g.moveTo(cx + 21, 38); g.lineTo(cx + 21, 46);
    g.lineTo(cx + 25, 45); g.lineTo(cx + 25, 39);
    g.closePath(); g.fill();

    // === Top cap + speed fins ===
    g.fillStyle = '#0D47A1';
    g.beginPath(); g.arc(cx, 14, 8, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#FFD700';
    g.beginPath(); g.moveTo(cx - 6, 11); g.lineTo(cx - 13, 4); g.lineTo(cx - 4, 10); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + 6, 11); g.lineTo(cx + 13, 4); g.lineTo(cx + 4, 10); g.closePath(); g.fill();
    g.fillStyle = '#42A5F5';
    g.beginPath(); g.arc(cx - 2, 12, 2.5, 0, Math.PI * 2); g.fill();

    // === Flames from side nozzles (walk frames) ===
    if (hasFlame) {
        // Left: glow + triangle
        g.fillStyle = 'rgba(255,120,0,0.45)';
        g.beginPath(); g.ellipse(cx - 22, 42, 4, 6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,200,0,0.92)';
        g.beginPath(); g.moveTo(cx - 21, 39); g.lineTo(cx - 21, 45); g.lineTo(cx - 25, 42); g.closePath(); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(cx - 25, 42, 1.2, 0, Math.PI * 2); g.fill();
        // Right: glow + triangle
        g.fillStyle = 'rgba(255,120,0,0.45)';
        g.beginPath(); g.ellipse(cx + 22, 42, 4, 6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,200,0,0.92)';
        g.beginPath(); g.moveTo(cx + 21, 39); g.lineTo(cx + 21, 45); g.lineTo(cx + 25, 42); g.closePath(); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(cx + 25, 42, 1.2, 0, Math.PI * 2); g.fill();
    }

    // === Face on handle ===
    const faceY = 36;
    g.fillStyle = 'rgba(255,120,100,0.3)';
    g.beginPath(); g.arc(cx - 5, faceY + 5, 4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 5, faceY + 5, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#0A2744'; g.lineWidth = 1.5;
    if (fr === 1 || fr === 3) {
        g.beginPath(); g.moveTo(cx - 6, faceY - 5); g.lineTo(cx - 1, faceY - 7); g.stroke();
        g.beginPath(); g.moveTo(cx + 1, faceY - 7); g.lineTo(cx + 6, faceY - 5); g.stroke();
    } else if (fr === 2) {
        g.beginPath(); g.moveTo(cx - 6, faceY - 6); g.lineTo(cx - 1, faceY - 8); g.stroke();
        g.beginPath(); g.moveTo(cx + 1, faceY - 8); g.lineTo(cx + 6, faceY - 6); g.stroke();
    } else {
        g.beginPath(); g.moveTo(cx - 6, faceY - 4); g.lineTo(cx - 1, faceY - 4); g.stroke();
        g.beginPath(); g.moveTo(cx + 1, faceY - 4); g.lineTo(cx + 6, faceY - 4); g.stroke();
    }
    const eyeH = fr === 2 ? 3.8 : fr === 0 ? 3.0 : 3.3;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(cx - 3.5, faceY, 2.8, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 3.5, faceY, 2.8, eyeH, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0A2744';
    g.beginPath(); g.arc(cx - 3, faceY + 0.5, 1.3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 4, faceY + 0.5, 1.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(cx - 2.5, faceY - 0.5, 0.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 4.5, faceY - 0.5, 0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#0A2744'; g.lineWidth = 1.5;
    const mY = faceY + 8;
    if (fr === 2) {
        g.beginPath(); g.arc(cx, mY - 2, 4.5, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    } else if (fr === 1 || fr === 3) {
        g.beginPath(); g.arc(cx, mY, 2.2, 0, Math.PI * 2); g.stroke();
    } else {
        g.beginPath(); g.arc(cx, mY - 1, 3, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    }

    g.restore();
}

// ─── BootScene ───────────────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this._makePoop();
        this._makeToiletChar();

        this._makeBucket();
        this._makeBroom();
        this._makeSoap();
        this._makeShovel();
        this._makeToilet();
        this._makeToiletPaper();
        this._makeGround();
        this._makeCloud();
        this._makeSun();
        this._makeParticle();
        this._makeTree();
        this._makeMountains();
        this._makePowerups();
        this._makeButt();
        this._makeHeart();
        this._makeHeartPowerup();
        this._makePortal();
        this._makeToiletBrush();
        this._makeStars();
        this._makePlanets();
        this._makeMagnet();
        document.fonts.load('10px "Press Start 2P"').finally(() => {
            this.scene.start('MenuScene');
        });
    }

    _makePoop() {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        g.font = '52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('💩', 32, 34);
        this.textures.addCanvas('poop', c);
    }

    _makeToiletChar() {
        const sheet = buildToiletCharSheet();
        this.textures.addSpriteSheet('toilet_char', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'toilet_char_idle', frames: [{ key: 'toilet_char', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'toilet_char_walk', frames: this.anims.generateFrameNumbers('toilet_char', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }


    _makeBucket() {
        const sheet = buildBucketSheet();
        this.textures.addSpriteSheet('bucket', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'bucket_idle', frames: [{ key: 'bucket', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'bucket_walk', frames: this.anims.generateFrameNumbers('bucket', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }

    _makeBroom() {
        const sheet = buildBroomSheet();
        this.textures.addSpriteSheet('broom', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'broom_idle', frames: [{ key: 'broom', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'broom_walk', frames: this.anims.generateFrameNumbers('broom', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }

    _makeSoap() {
        const sheet = buildSoapSheet();
        this.textures.addSpriteSheet('soap', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'soap_idle', frames: [{ key: 'soap', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'soap_walk', frames: this.anims.generateFrameNumbers('soap', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }

    _makeShovel() {
        const sheet = buildShovelSheet();
        this.textures.addSpriteSheet('shovel', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'shovel_idle', frames: [{ key: 'shovel', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'shovel_walk', frames: this.anims.generateFrameNumbers('shovel', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }

    _makeToilet() {
        const c = document.createElement('canvas');
        c.width = 56; c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = '#F0F0F0'; g.fillRect(10, 2, 36, 22);
        g.fillStyle = '#DCDCDC'; g.fillRect(10, 2, 36, 3);
        g.fillStyle = '#E8E8E8'; g.fillRect(12, 6, 7, 14);
        g.fillStyle = '#ccc';    g.fillRect(30, 8, 11, 8);
        g.fillStyle = '#aaa';    g.fillRect(33, 10, 5, 4);
        g.fillStyle = '#BDBDBD'; g.fillRect(10, 23, 36, 2);
        g.fillStyle = '#E0E0E0'; g.fillRect(18, 25, 20, 4);
        g.fillStyle = '#FAFAFA'; g.fillRect(5, 29, 46, 28);
        g.fillStyle = '#E8E8E8'; g.fillRect(5, 55, 46, 4);
        g.fillStyle = '#E0E0E0'; g.fillRect(3, 29, 50, 5);
        g.fillStyle = '#B3E5FC'; g.fillRect(11, 36, 34, 18);
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(15, 38, 14, 4);
        g.strokeStyle = '#BDBDBD'; g.lineWidth = 1.5;
        g.strokeRect(5, 29, 46, 30); g.strokeRect(10, 2, 36, 22);
        this.textures.addCanvas('toilet', c);
    }

    _makeToiletPaper() {
        const c = document.createElement('canvas');
        c.width = 52; c.height = 62;
        const g = c.getContext('2d');
        g.fillStyle = '#F5F5F5'; g.fillRect(6, 10, 40, 42);
        g.fillStyle = '#E0E0E0'; g.fillRect(6, 10, 7, 42);
        g.fillStyle = '#E8E8E8'; g.fillRect(39, 10, 7, 42);
        g.fillStyle = '#fff';    g.fillRect(15, 10, 9, 42);
        g.fillStyle = '#E0E0E0';
        for (let i = 0; i < 6; i++) g.fillRect(6, 10 + i * 8, 40, 1);
        g.fillStyle = '#EFEFEF'; g.fillRect(6, 5, 40, 10);
        g.fillStyle = '#D8D8D8'; g.fillRect(6, 5, 40, 2);
        g.fillStyle = '#A0724A'; g.fillRect(15, 6, 22, 8);
        g.fillStyle = '#C8956A'; g.fillRect(15, 6, 8, 8);
        g.fillStyle = '#E4E4E4'; g.fillRect(6, 48, 40, 8);
        g.fillStyle = '#F5F5F5'; g.fillRect(28, 52, 14, 12);
        g.fillStyle = '#E0E0E0'; g.fillRect(28, 52, 14, 1); g.fillRect(38, 52, 4, 12);
        this.textures.addCanvas('toilet_paper', c);
    }

    _makeGround() {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        // Grass top — gradient blades, no block grid
        g.fillStyle = '#5aaa30'; g.fillRect(0, 0, 32, 10);
        g.fillStyle = '#6abf38'; [1,5,9,13,17,21,25,29].forEach(x => g.fillRect(x, 0, 2, 5));
        g.fillStyle = '#3d8020'; [3,11,19,27].forEach(x => g.fillRect(x, 2, 2, 6));
        // Dirt — smooth, no tiles
        g.fillStyle = '#9c6b3c'; g.fillRect(0, 10, 32, 22);
        g.fillStyle = '#b07a48'; g.fillRect(0, 10, 32, 3);
        g.fillStyle = '#7a5030'; [2,14,24].forEach(x => g.fillRect(x, 15, 6, 3));
        this.textures.addCanvas('ground', c);
    }

    _makeCloud() {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 52;
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        [[22,38,20],[42,28,26],[68,32,22],[90,38,18],[55,22,18]].forEach(([x,y,r]) => {
            g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        });
        g.fillRect(10, 38, 100, 12);
        this.textures.addCanvas('cloud', c);
    }

    _makeSun() {
        const c = document.createElement('canvas');
        c.width = c.height = 88;
        const g = c.getContext('2d');
        const cx = 44, cy = 44;
        // Rays
        g.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
            g.save();
            g.translate(cx, cy);
            g.rotate(i * Math.PI / 4);
            g.fillRect(-4, -38, 8, 18);
            g.restore();
        }
        // Outer glow circle
        const grd = g.createRadialGradient(cx, cy, 14, cx, cy, 30);
        grd.addColorStop(0, '#FFE840');
        grd.addColorStop(1, '#FFD700');
        g.fillStyle = grd;
        g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.fill();
        // Inner bright centre
        g.fillStyle = '#FFF9C4';
        g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
        this.textures.addCanvas('sun', c);
    }

    _makeParticle() {
        const c = document.createElement('canvas');
        c.width = c.height = 10;
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, 10, 10);
        this.textures.addCanvas('particle', c);
    }

    _makeTree() {
        const c = document.createElement('canvas');
        c.width = 48; c.height = 80;
        const g = c.getContext('2d');
        g.fillStyle = '#5C4033'; g.fillRect(20, 50, 8, 30);
        g.fillStyle = '#4a3328'; g.fillRect(22, 54, 2, 22);
        [[24,38,32,'#2e7d32'],[24,26,26,'#388e3c'],[24,14,20,'#43a047']].forEach(([cx,y,w,col]) => {
            g.fillStyle = col; g.fillRect(cx - w/2, y, w, 18);
        });
        this.textures.addCanvas('tree', c);
    }

    _makeMountains() {
        const c = document.createElement('canvas');
        c.width = 480; c.height = 130;
        const g = c.getContext('2d');
        // Far mountains (lighter)
        [[60,95,100,35,'#7aac7a'],[170,70,120,60,'#6a9c6a'],[310,80,100,50,'#7aac7a'],[420,72,130,58,'#6a9c6a']].forEach(([cx,y,w,h,col]) => {
            g.fillStyle = col;
            for (let s = 0; s <= h; s += 8) {
                const rw = Math.max(8, w * (1 - (s / h) * 0.72));
                g.fillRect(cx - rw / 2, y + s, rw, 8);
            }
            // Snow cap
            g.fillStyle = 'rgba(220,235,220,0.9)';
            g.fillRect(cx - 16, y - 2, 32, 12); g.fillRect(cx - 10, y - 10, 20, 8);
        });
        // Near mountains (darker)
        [[0,108,80,22,'#4a7a4a'],[90,100,90,30,'#3d6b3d'],[200,105,80,25,'#4a7a4a'],[300,98,110,32,'#3d6b3d'],[430,103,100,27,'#4a7a4a']].forEach(([cx,y,w,h,col]) => {
            g.fillStyle = col;
            for (let s = 0; s <= h; s += 8) {
                const rw = Math.max(8, w * (1 - (s / h) * 0.65));
                g.fillRect(cx - rw / 2, y + s, rw, 8);
            }
        });
        this.textures.addCanvas('mountains', c);
    }

    _makePowerups() {
        // Shield — modrý štít (geometrický tvar, žádné emoji)
        const cs = document.createElement('canvas');
        cs.width = cs.height = 52;
        const gs = cs.getContext('2d');
        gs.fillStyle = '#00BFFF';
        gs.beginPath();
        gs.moveTo(26, 4);
        gs.lineTo(46, 12);
        gs.lineTo(46, 28);
        gs.quadraticCurveTo(46, 46, 26, 50);
        gs.quadraticCurveTo(6, 46, 6, 28);
        gs.lineTo(6, 12);
        gs.closePath();
        gs.fill();
        gs.fillStyle = '#ffffff';
        gs.beginPath();
        gs.moveTo(26, 12);
        gs.lineTo(38, 17);
        gs.lineTo(38, 27);
        gs.quadraticCurveTo(38, 38, 26, 42);
        gs.quadraticCurveTo(14, 38, 14, 27);
        gs.lineTo(14, 17);
        gs.closePath();
        gs.fill();
        this.textures.addCanvas('powerup_shield', cs);

        // Star — žlutá hvězda (5 cípů, geometricky)
        const ct = document.createElement('canvas');
        ct.width = ct.height = 52;
        const gt = ct.getContext('2d');
        gt.fillStyle = '#FFD700';
        gt.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const innerAngle = outerAngle + (2 * Math.PI / 10);
            const ox = 26 + 22 * Math.cos(outerAngle);
            const oy = 26 + 22 * Math.sin(outerAngle);
            const ix = 26 + 9 * Math.cos(innerAngle);
            const iy = 26 + 9 * Math.sin(innerAngle);
            i === 0 ? gt.moveTo(ox, oy) : gt.lineTo(ox, oy);
            gt.lineTo(ix, iy);
        }
        gt.closePath();
        gt.fill();
        gt.strokeStyle = '#E65100';
        gt.lineWidth = 2;
        gt.stroke();
        this.textures.addCanvas('powerup_star', ct);
    }

    _makeButt() {
        const c = document.createElement('canvas');
        c.width = c.height = 52;
        const g = c.getContext('2d');

        // Levá hýžď — bezier pro přirozenější tvar
        g.fillStyle = '#F4A574';
        g.beginPath();
        g.moveTo(26, 10);
        g.bezierCurveTo(26, 10, 5, 13, 4, 30);
        g.bezierCurveTo(3, 44, 11, 50, 22, 50);
        g.bezierCurveTo(25, 50, 26, 48, 26, 46);
        g.lineTo(26, 10);
        g.fill();

        // Pravá hýžď
        g.beginPath();
        g.moveTo(26, 10);
        g.bezierCurveTo(26, 10, 47, 13, 48, 30);
        g.bezierCurveTo(49, 44, 41, 50, 30, 50);
        g.bezierCurveTo(27, 50, 26, 48, 26, 46);
        g.lineTo(26, 10);
        g.fill();

        // Stín dole pro objem
        g.fillStyle = 'rgba(150,80,40,0.18)';
        g.beginPath();
        g.ellipse(17, 44, 11, 5, 0, 0, Math.PI * 2); g.fill();
        g.beginPath();
        g.ellipse(35, 44, 11, 5, 0, 0, Math.PI * 2); g.fill();

        // Světlo nahoře (highlight)
        g.fillStyle = 'rgba(255,255,255,0.32)';
        g.beginPath(); g.ellipse(16, 22, 5, 8, -0.2, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(36, 22, 5, 8,  0.2, 0, Math.PI * 2); g.fill();

        // Obrys
        g.strokeStyle = '#C07040'; g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(26, 10);
        g.bezierCurveTo(26, 10, 5, 13, 4, 30);
        g.bezierCurveTo(3, 44, 11, 50, 22, 50);
        g.bezierCurveTo(25, 50, 26, 48, 26, 46);
        g.stroke();
        g.beginPath();
        g.moveTo(26, 10);
        g.bezierCurveTo(26, 10, 47, 13, 48, 30);
        g.bezierCurveTo(49, 44, 41, 50, 30, 50);
        g.bezierCurveTo(27, 50, 26, 48, 26, 46);
        g.stroke();

        // Rýha
        g.strokeStyle = '#B06030'; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(26, 10);
        g.quadraticCurveTo(24, 28, 26, 46);
        g.stroke();

        this.textures.addCanvas('powerup_butt', c);
    }

    _makeHeart() {
        // Plné srdce (červené)
        const make = (color, key) => {
            const c = document.createElement('canvas');
            c.width = c.height = 32;
            const g = c.getContext('2d');
            g.fillStyle = color;
            g.beginPath();
            g.moveTo(16, 26);
            g.bezierCurveTo(16, 26,  4, 18,  4, 12);
            g.bezierCurveTo( 4,  6, 10,  4, 16, 10);
            g.bezierCurveTo(22,  4, 28,  6, 28, 12);
            g.bezierCurveTo(28, 18, 16, 26, 16, 26);
            g.closePath(); g.fill();
            this.textures.addCanvas(key, c);
        };
        make('#FF3B3B', 'heart_full');
        make('#444444', 'heart_empty');
    }

    _makeHeartPowerup() {
        const c = document.createElement('canvas');
        c.width = c.height = 52;
        const g = c.getContext('2d');
        // Záře
        const grad = g.createRadialGradient(26, 26, 4, 26, 26, 26);
        grad.addColorStop(0, 'rgba(255,60,60,0.45)');
        grad.addColorStop(1, 'transparent');
        g.fillStyle = grad; g.fillRect(0, 0, 52, 52);
        // Velké srdce
        g.fillStyle = '#FF3B3B';
        g.beginPath();
        g.moveTo(26, 42);
        g.bezierCurveTo(26, 42,  6, 30,  6, 19);
        g.bezierCurveTo( 6,  9, 14,  6, 26, 16);
        g.bezierCurveTo(38,  6, 46,  9, 46, 19);
        g.bezierCurveTo(46, 30, 26, 42, 26, 42);
        g.closePath(); g.fill();
        // Světlo
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.beginPath(); g.ellipse(19, 18, 5, 7, -0.4, 0, Math.PI * 2); g.fill();
        this.textures.addCanvas('powerup_heart', c);
    }

    _makeToiletBrush() {
        const c = document.createElement('canvas');
        c.width = 52; c.height = 72;
        const g = c.getContext('2d');
        const cx = 26;

        // Rukojeť — světle šedá s modrým akcentem
        g.fillStyle = '#D8E4F0';
        g.fillRect(cx - 3, 4, 6, 40);
        g.fillStyle = '#B0C4DC';
        g.fillRect(cx - 2, 4, 2, 40);
        g.fillStyle = '#EEF4FC';
        g.fillRect(cx + 1, 4, 1, 40);

        // Modrý pruh na rukojeti (rozpoznávací detail)
        g.fillStyle = '#3A8FE8';
        g.fillRect(cx - 3, 14, 6, 5);
        g.fillRect(cx - 3, 26, 6, 5);

        // Háček nahoře
        g.strokeStyle = '#8899BB'; g.lineWidth = 3;
        g.beginPath(); g.arc(cx, 7, 6.5, Math.PI, 2 * Math.PI); g.stroke();
        g.fillStyle = '#7A8CAA';
        g.beginPath(); g.arc(cx, 7, 3, 0, Math.PI * 2); g.fill();

        // Kovový kroužek (spoj)
        g.fillStyle = '#8899AA';
        g.fillRect(cx - 7, 40, 14, 6);
        g.fillStyle = '#AABBCC';
        g.fillRect(cx - 6, 41, 12, 2);

        // Záře kolem hlavy
        g.fillStyle = 'rgba(40,140,255,0.15)';
        g.beginPath(); g.arc(cx, 58, 18, 0, Math.PI * 2); g.fill();

        // Hlava štětky — bílý ovál (velký, jasně viditelný)
        g.fillStyle = '#F4F6FF';
        g.beginPath(); g.arc(cx, 58, 15, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#AABBDD'; g.lineWidth = 1;
        g.beginPath(); g.arc(cx, 58, 15, 0, Math.PI * 2); g.stroke();

        // Štětiny — výrazně modré čáry
        g.strokeStyle = '#1E7FE0'; g.lineWidth = 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
            g.beginPath();
            g.moveTo(cx + Math.cos(a) * 5, 58 + Math.sin(a) * 5);
            g.lineTo(cx + Math.cos(a) * 15, 58 + Math.sin(a) * 15);
            g.stroke();
        }

        // Delší štětiny dolů pro efekt záchodového kartáče
        g.strokeStyle = '#0E6FD0'; g.lineWidth = 1.5;
        for (let i = -4; i <= 4; i++) {
            g.beginPath();
            g.moveTo(cx + i * 3, 70);
            g.lineTo(cx + i * 4, 72);
            g.stroke();
        }

        // Střed — tmavě modrý
        g.fillStyle = '#2288DD';
        g.beginPath(); g.arc(cx, 58, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#0055BB';
        g.beginPath(); g.arc(cx, 58, 3, 0, Math.PI * 2); g.fill();

        this.textures.addCanvas('toilet_brush', c);
    }

    _makePortal() {
        const c = document.createElement('canvas');
        c.width = c.height = 80;
        const g = c.getContext('2d');
        const cx = 40, cy = 40;

        // Vnější corona záře
        const corona = g.createRadialGradient(cx, cy, 24, cx, cy, 40);
        corona.addColorStop(0,   'rgba(0, 180, 255, 0.55)');
        corona.addColorStop(0.5, 'rgba(0,  80, 255, 0.20)');
        corona.addColorStop(1,   'rgba(0,   0, 200, 0)');
        g.fillStyle = corona;
        g.beginPath(); g.arc(cx, cy, 40, 0, Math.PI * 2); g.fill();

        // Kamenný kruh — 3D gradient
        const ringGrad = g.createRadialGradient(cx - 5, cy - 5, 8, cx, cy, 36);
        ringGrad.addColorStop(0,   '#8A9BAC');
        ringGrad.addColorStop(0.5, '#506070');
        ringGrad.addColorStop(1,   '#2A3848');
        g.fillStyle = ringGrad;
        g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.fill();

        // Světlý okraj kruhu
        g.strokeStyle = 'rgba(180, 210, 230, 0.8)';
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.stroke();

        // Tmavý okraj vnitřní části kruhu
        g.strokeStyle = 'rgba(0, 0, 30, 0.6)';
        g.lineWidth = 1;
        g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.stroke();

        // 9 Stargate chevronů — 7 oranžových (aktivovaných), 2 tmavé
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
            const active = i < 7;
            g.save(); g.translate(cx, cy); g.rotate(angle);
            g.fillStyle = active ? '#CC4400' : '#445566';
            g.beginPath();
            g.moveTo(-4.5, -24); g.lineTo(4.5, -24);
            g.lineTo(5.5, -32);  g.lineTo(0, -36);
            g.lineTo(-5.5, -32); g.closePath(); g.fill();
            if (active) {
                g.fillStyle = '#FF8800';
                g.beginPath();
                g.moveTo(-2.5, -25); g.lineTo(2.5, -25);
                g.lineTo(3, -31);    g.lineTo(0, -34);
                g.lineTo(-3, -31);   g.closePath(); g.fill();
            }
            g.restore();
        }

        // Vnitřní otvor — portál
        g.fillStyle = '#000814';
        g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();

        // Vnitřní záře portálu (modro-fialový kawoosh)
        const inner = g.createRadialGradient(cx, cy - 4, 0, cx, cy, 26);
        inner.addColorStop(0,    'rgba(230, 250, 255, 1)');
        inner.addColorStop(0.18, 'rgba(80,  210, 255, 1)');
        inner.addColorStop(0.50, 'rgba(0,  130, 255, 0.95)');
        inner.addColorStop(0.80, 'rgba(70,   0, 200, 0.85)');
        inner.addColorStop(1,    'rgba(0,    0, 100, 0)');
        g.fillStyle = inner;
        g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();

        // Vlnky (vodní hladina portálu)
        g.strokeStyle = 'rgba(200, 238, 255, 0.38)';
        g.lineWidth = 1;
        for (let r = 4; r <= 23; r += 4) {
            g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
        }

        // Odraz světla uprostřed (kawoosh špička)
        const spot = g.createRadialGradient(cx, cy - 9, 0, cx, cy - 6, 11);
        spot.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        spot.addColorStop(1, 'rgba(180, 230, 255, 0)');
        g.fillStyle = spot;
        g.beginPath(); g.arc(cx, cy - 6, 11, 0, Math.PI * 2); g.fill();

        this.textures.addCanvas('powerup_portal', c);
    }

    _makeStars() {
        // Dvě vrstvy hvězd pro parallax
        [['stars_far', 180, 1.2], ['stars_near', 70, 2.2]].forEach(([key, count, maxR]) => {
            const c = document.createElement('canvas');
            c.width = 480; c.height = 640;
            const g = c.getContext('2d');
            g.fillStyle = '#000814'; g.fillRect(0, 0, 480, 640);
            for (let i = 0; i < count; i++) {
                const x = Math.random() * 480;
                const y = Math.random() * 640;
                const r = Math.random() * maxR + 0.5;
                const a = Math.random() * 0.5 + 0.5;
                g.fillStyle = `rgba(255,255,255,${a})`;
                g.fillRect(x, y, r, r);
            }
            this.textures.addCanvas(key, c);
        });
    }

    _makeMagnet() {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d');
        const cx = 32, cy = 34;
        // Outer horseshoe (U-shape)
        g.strokeStyle = '#00ddff'; g.lineWidth = 10; g.lineCap = 'round';
        g.beginPath(); g.arc(cx, cy, 18, Math.PI, 0); g.stroke();
        // Inner horseshoe
        g.strokeStyle = '#0088cc'; g.lineWidth = 4;
        g.beginPath(); g.arc(cx, cy, 18, Math.PI, 0); g.stroke();
        // Left pole (red)
        g.fillStyle = '#ff4444';
        g.fillRect(cx - 26, cy, 8, 14);
        g.fillRect(cx - 26, cy + 10, 12, 6);
        // Right pole (blue)
        g.fillStyle = '#4444ff';
        g.fillRect(cx + 18, cy, 8, 14);
        g.fillRect(cx + 16, cy + 10, 12, 6);
        // Pole tops (rounded caps matching horseshoe)
        g.fillStyle = '#00ddff';
        g.beginPath(); g.arc(cx - 22, cy, 4, 0, Math.PI*2); g.fill();
        g.beginPath(); g.arc(cx + 22, cy, 4, 0, Math.PI*2); g.fill();
        // Sparkle dots
        [[16,14,'#88eeff'],[48,14,'#88eeff'],[32,10,'#ffffff']].forEach(([x,y,col]) => {
            g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI*2); g.fill();
        });
        this.textures.addCanvas('powerup_magnet', c);
    }

    _makePlanets() {
        const mk = (key, w, h, fn) => {
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            fn(c.getContext('2d')); this.textures.addCanvas(key, c);
        };
        const ball = (g, cx, cy, r, fillFn) => {
            g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI*2); g.clip();
            fillFn(g);
            g.restore();
            g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
            g.beginPath(); g.arc(cx, cy, r, 0, Math.PI*2); g.stroke();
        };

        // Mercury — small, grey, cratered
        mk('planet_mercury', 48, 48, g => {
            ball(g, 24, 24, 20, g => {
                const gr = g.createRadialGradient(18, 18, 3, 24, 24, 20);
                gr.addColorStop(0, '#b0a898'); gr.addColorStop(1, '#6b6460');
                g.fillStyle = gr; g.fillRect(4, 4, 40, 40);
                // craters
                [[14,18,4],[30,14,3],[20,30,3.5],[28,28,2]].forEach(([x,y,r]) => {
                    g.fillStyle = 'rgba(80,70,65,0.6)';
                    g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill();
                });
            });
        });

        // Venus — cream/yellow, thick clouds
        mk('planet_venus', 60, 60, g => {
            ball(g, 30, 30, 26, g => {
                const gr = g.createRadialGradient(22, 20, 4, 30, 30, 26);
                gr.addColorStop(0, '#f5e8a0'); gr.addColorStop(0.6, '#e8c86a'); gr.addColorStop(1, '#c8a040');
                g.fillStyle = gr; g.fillRect(4, 4, 52, 52);
                // cloud swirls
                g.fillStyle = 'rgba(255,245,200,0.5)';
                g.beginPath(); g.ellipse(30, 20, 18, 5, 0.3, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(22, 32, 14, 4, -0.2, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(34, 40, 12, 3, 0.5, 0, Math.PI*2); g.fill();
            });
        });

        // Earth — blue ocean, green continents
        mk('planet_earth', 66, 66, g => {
            ball(g, 33, 33, 29, g => {
                g.fillStyle = '#1a6fa8'; g.fillRect(4, 4, 58, 58);
                g.fillStyle = '#2d8a3e';
                g.beginPath(); g.ellipse(30, 28, 8, 12, -0.3, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(18, 33, 5, 12, 0.2, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(42, 25, 12, 8, 0.4, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(38, 40, 7, 5, -0.2, 0, Math.PI*2); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.5)';
                g.beginPath(); g.ellipse(33, 14, 10, 3, 0.5, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(20, 48, 8, 3, -0.3, 0, Math.PI*2); g.fill();
            });
        });

        // Mars — rusty red, polar ice cap
        mk('planet_mars', 62, 62, g => {
            ball(g, 31, 31, 27, g => {
                const gr = g.createRadialGradient(24, 22, 4, 31, 31, 27);
                gr.addColorStop(0, '#d4603a'); gr.addColorStop(1, '#9a3a1a');
                g.fillStyle = gr; g.fillRect(4, 4, 54, 54);
                // Surface details
                g.fillStyle = 'rgba(180,80,40,0.5)';
                g.beginPath(); g.ellipse(36, 36, 9, 6, 0.5, 0, Math.PI*2); g.fill();
                g.beginPath(); g.ellipse(22, 28, 6, 4, -0.3, 0, Math.PI*2); g.fill();
                // Polar ice cap
                g.fillStyle = 'rgba(240,240,255,0.85)';
                g.beginPath(); g.ellipse(31, 10, 10, 5, 0, 0, Math.PI*2); g.fill();
            });
        });

        // Jupiter — large, orange/brown bands, Great Red Spot
        mk('planet_jupiter', 80, 80, g => {
            ball(g, 40, 40, 36, g => {
                g.fillStyle = '#d4a870'; g.fillRect(4, 4, 72, 72);
                const bands = [
                    [16,'rgba(160,90,50,0.65)',6],[24,'rgba(200,140,80,0.5)',4],
                    [32,'rgba(150,80,40,0.7)',7],[42,'rgba(195,130,70,0.55)',5],
                    [50,'rgba(155,85,45,0.6)',6],[58,'rgba(185,120,65,0.45)',4],
                ];
                bands.forEach(([y,col,h]) => { g.fillStyle=col; g.fillRect(4,y,72,h); });
                // Great Red Spot
                g.fillStyle = 'rgba(180,60,40,0.8)';
                g.beginPath(); g.ellipse(28, 44, 9, 6, 0.2, 0, Math.PI*2); g.fill();
                g.fillStyle = 'rgba(200,80,60,0.5)';
                g.beginPath(); g.ellipse(28, 44, 6, 4, 0.2, 0, Math.PI*2); g.fill();
            });
        });

        // Saturn — golden, rings
        mk('planet_saturn', 110, 72, g => {
            const cx = 55, cy = 36, r = 26;
            // Back ring
            g.strokeStyle = 'rgba(190,155,80,0.5)'; g.lineWidth = 8;
            g.beginPath(); g.ellipse(cx, cy+4, 46, 11, 0, Math.PI, Math.PI*2); g.stroke();
            g.strokeStyle = 'rgba(220,190,110,0.3)'; g.lineWidth = 14;
            g.beginPath(); g.ellipse(cx, cy+4, 46, 11, 0, Math.PI, Math.PI*2); g.stroke();
            // Body
            ball(g, cx, cy, r, g => {
                g.fillStyle = '#e8c85a'; g.fillRect(cx-r, cy-r, r*2, r*2);
                [[-9,'rgba(200,160,60,0.65)'],[-2,'rgba(215,175,70,0.45)'],[5,'rgba(195,155,55,0.6)'],[11,'rgba(210,170,65,0.45)']].forEach(([dy,col]) => {
                    g.fillStyle=col; g.fillRect(cx-r, cy+dy-2, r*2, 4);
                });
            });
            // Front ring
            g.strokeStyle = 'rgba(190,155,80,0.5)'; g.lineWidth = 8;
            g.beginPath(); g.ellipse(cx, cy+4, 46, 11, 0, 0, Math.PI); g.stroke();
            g.strokeStyle = 'rgba(220,190,110,0.3)'; g.lineWidth = 14;
            g.beginPath(); g.ellipse(cx, cy+4, 46, 11, 0, 0, Math.PI); g.stroke();
        });

        // Uranus — pale cyan, tilted rings
        mk('planet_uranus', 88, 72, g => {
            const cx = 44, cy = 36, r = 26;
            g.strokeStyle = 'rgba(100,225,225,0.35)'; g.lineWidth = 5;
            g.beginPath(); g.ellipse(cx, cy, 14, 40, 0.25, Math.PI*0.55, Math.PI*1.45); g.stroke();
            ball(g, cx, cy, r, g => {
                const gr = g.createRadialGradient(cx-7, cy-7, 3, cx, cy, r);
                gr.addColorStop(0, '#aaf0f0'); gr.addColorStop(0.5, '#5ecece'); gr.addColorStop(1, '#2a9a9a');
                g.fillStyle = gr; g.fillRect(cx-r, cy-r, r*2, r*2);
                g.fillStyle = 'rgba(170,240,240,0.3)'; g.fillRect(cx-r, cy-7, r*2, 4);
            });
            g.strokeStyle = 'rgba(100,225,225,0.35)'; g.lineWidth = 5;
            g.beginPath(); g.ellipse(cx, cy, 14, 40, 0.25, Math.PI*1.45, Math.PI*2.55); g.stroke();
        });

        // Neptune — deep blue, white storm
        mk('planet_neptune', 64, 64, g => {
            ball(g, 32, 32, 27, g => {
                const gr = g.createRadialGradient(24, 22, 3, 32, 32, 27);
                gr.addColorStop(0, '#5588ff'); gr.addColorStop(0.5, '#2244cc'); gr.addColorStop(1, '#0a1a88');
                g.fillStyle = gr; g.fillRect(5, 5, 54, 54);
                g.fillStyle = 'rgba(10,20,100,0.6)';
                g.beginPath(); g.ellipse(26, 36, 9, 5, -0.4, 0, Math.PI*2); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.65)';
                g.beginPath(); g.ellipse(36, 20, 7, 3, 0.3, 0, Math.PI*2); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.45)';
                g.beginPath(); g.ellipse(22, 44, 5, 2, -0.2, 0, Math.PI*2); g.fill();
            });
        });
    }
}
