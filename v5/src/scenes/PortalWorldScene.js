class PortalWorldScene extends Phaser.Scene {
    constructor() { super('PortalWorldScene'); }

    init(data) {
        this.sharedScore     = data.score      || 0;
        this.sharedLives     = data.lives      || 3;
        this.charKey         = data.charKey    || 'toilet_char';
        this.itemKey         = data.itemKey    || 'poop';
        this.sharedShield    = data.shield     || false;
        this.sharedStar      = data.starSec    || 0;
        this.sharedButt      = data.buttCount  || 0;
        this.sharedBoost     = data.boostSec   || 0;
        this.sharedDropSpeed = data.dropSpeed  || 160;
        this.sharedPoopInt   = data.poopInt    || 1.2;
    }

    create() {
        this.W = this.scale.width;
        this.H = this.scale.height;

        this.score     = this.sharedScore;
        this.lives     = this.sharedLives;
        this.shield    = this.sharedShield;
        this.portalSec = 30;
        this.isLeaving = false;

        this.objects    = [];
        this.magnets    = [];
        // Spawn interval: same as main game but not faster than 0.65s (was 0.42)
        this.spawnCd    = Math.min(this.sharedPoopInt * 0.80, 1.1);
        this.spawnTimer = 0.5;

        // Magnet power-up
        this.magnetSec      = 0;
        this.magnetSpawnCd  = 12 + Math.random() * 8;
        this._magnetTxt     = null;

        // Vanishing point — will oscillate to simulate tunnel turning
        this.vpTime  = 0;
        this.touchDir = 0;

        this._buildBg();
        this._buildInput();
        this._buildHUD();
        this._buildPlanets();

        // Tunnel graphics (redrawn every frame)
        this.tunnelGfx = this.add.graphics().setDepth(1);

        // Player at the bottom of the tunnel
        const playerY = this.H - 110;
        this.player = this.add.sprite(this.W / 2, playerY, this.charKey)
            .setScale(1.3).setDepth(9);
        this.player.anims.play(`${this.charKey}_walk`);
    }

    // ── Background ────────────────────────────────────────────────────────────
    _buildBg() {
        this.add.image(this.W / 2, this.H / 2, 'stars_far').setDepth(0);
        this.add.image(this.W / 2, this.H / 2, 'stars_near').setAlpha(0.5).setDepth(0);
    }

    // ── Planets drifting through space ────────────────────────────────────────
    _buildPlanets() {
        // Full solar system in order, staggered across ~6 screen widths so they arrive one by one
        // y kept in top 28% so they never overlap the tunnel gameplay area
        // Solar system in strict order — all same speed so ordering is preserved
        // Mercury starts just off-screen right so it appears within first seconds
        const SPD = 42;
        const defs = [
            { key: 'planet_mercury', label: 'Mercury', scale: 1.04, spd: SPD, y: 0.10, x0: 1.05 },
            { key: 'planet_venus',   label: 'Venus',   scale: 1.24, spd: SPD, y: 0.24, x0: 1.65 },
            { key: 'planet_earth',   label: 'Earth',   scale: 1.32, spd: SPD, y: 0.11, x0: 2.25 },
            { key: 'planet_mars',    label: 'Mars',    scale: 1.12, spd: SPD, y: 0.26, x0: 2.85 },
            { key: 'planet_jupiter', label: 'Jupiter', scale: 1.76, spd: SPD, y: 0.13, x0: 3.55 },
            { key: 'planet_saturn',  label: 'Saturn',  scale: 1.56, spd: SPD, y: 0.25, x0: 4.35 },
            { key: 'planet_uranus',  label: 'Uranus',  scale: 1.32, spd: SPD, y: 0.12, x0: 5.05 },
            { key: 'planet_neptune', label: 'Neptune', scale: 1.24, spd: SPD, y: 0.27, x0: 5.65 },
            { key: 'planet_pluto',   label: 'Pluto',   scale: 1.00, spd: SPD, y: 0.10, x0: 6.25 },
        ];
        const sty = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '6px', fill: '#aabbdd',
            stroke: '#000014', strokeThickness: 2
        };
        this._planets = defs.map(d => {
            const img = this.add.image(this.W * d.x0, this.H * d.y, d.key)
                .setScale(d.scale).setAlpha(0.55).setDepth(0.5);
            const lbl = this.add.text(img.x, img.y + img.displayHeight * 0.5 + 5, d.label, sty)
                .setOrigin(0.5, 0).setDepth(0.5).setAlpha(0.55);
            return { img, lbl, spd: d.spd };
        });
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    _buildInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd    = this.input.keyboard.addKeys({
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.on('pointerdown', p => { this.touchDir = p.x < this.W / 2 ? -1 : 1; });
        this.input.on('pointermove', p => { if (p.isDown) this.touchDir = p.x < this.W / 2 ? -1 : 1; });
        this.input.on('pointerup',   () => { this.touchDir = 0; });
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    _buildHUD() {
        const sty = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 3
        };
        // Score — left (same as main scene)
        this.add.text(13, 17, 'Score:', sty).setDepth(25);
        this.scoreTxt = this.add.text(108, 17, `${this.score}`, sty).setDepth(25);

        // Timer — center (where level txt is in main scene)
        this.timeTxt = this.add.text(this.W / 2, 16, '30s', {
            ...sty, fontSize: '10px', fill: '#FF7043'
        }).setOrigin(0.5, 0).setDepth(25);

        // Hearts — right (same as main scene)
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.text(this.W - 18 - i * 24, 17, '\u2665', {
                    ...sty, fontSize: '11px', fill: '#FF3B3B'
                }).setDepth(25)
            );
        }
    }

    // ── Draw tunnel every frame ───────────────────────────────────────────────
    _drawTunnel(vpX, vpY) {
        const g = this.tunnelGfx;
        g.clear();
        const W = this.W, H = this.H;

        // Magnet tint: tunnel turns cyan when magnet active
        const tunnelCol = this.magnetSec > 0 ? 0x0088cc : 0x3355aa;
        const ringNear  = this.magnetSec > 0 ? 0x00eeff : 0xcc77ff;
        const ringMid   = this.magnetSec > 0 ? 0x00aadd : 0x5577ff;
        const ringFar   = this.magnetSec > 0 ? 0x007799 : 0x3355cc;

        // Radial perspective lines
        const edgePts = [
            [0,   H], [W/4, H], [W/2, H], [3*W/4, H], [W, H],
            [0,   H * 0.7], [W, H * 0.7],
        ];
        edgePts.forEach(([ex, ey]) => {
            g.lineStyle(1, tunnelCol, 0.18);
            g.beginPath(); g.moveTo(vpX, vpY); g.lineTo(ex, ey); g.strokePath();
        });

        // Horizontal tunnel rings
        const rings = 9;
        for (let i = 1; i <= rings; i++) {
            const t     = i / rings;
            const ringY = vpY + t * (H - vpY);
            const hw    = (W / 2) * t;
            const rx    = vpX + (W / 2 - vpX) * t;
            const near  = t > 0.80;
            const color = near ? ringNear : (t > 0.45 ? ringMid : ringFar);
            g.lineStyle(near ? 3 : 1.2, color, 0.10 + t * 0.52);
            g.beginPath();
            g.moveTo(rx - hw, ringY); g.lineTo(rx + hw, ringY);
            g.strokePath();
        }

        // Bright bottom ring
        g.lineStyle(4, this.magnetSec > 0 ? 0x00eeff : 0xdd88ff, 0.70);
        g.beginPath(); g.moveTo(0, H - 80); g.lineTo(W, H - 80); g.strokePath();
        g.lineStyle(14, this.magnetSec > 0 ? 0x0066cc : 0x9944ff, 0.14);
        g.beginPath(); g.moveTo(0, H - 80); g.lineTo(W, H - 80); g.strokePath();

        // Center glow at vanishing point
        g.fillStyle(this.magnetSec > 0 ? 0x0066cc : 0x2244cc, 0.22);
        g.fillCircle(vpX, vpY, 28);
        g.fillStyle(this.magnetSec > 0 ? 0x00ddff : 0x88bbff, 0.15);
        g.fillCircle(vpX, vpY, 14);
    }

    // ── Spawn regular object near vanishing point ──────────────────────────────
    _spawnObject(vpX, vpY) {
        const targetX = 40 + Math.random() * (this.W - 80);
        const spriteKey = this.itemKey === 'poop' ? 'poop_ice' : this.itemKey;
        const sprite  = this.add.image(vpX, vpY, spriteKey)
            .setScale(0.10).setAlpha(0.15).setDepth(3);
        this.objects.push({
            startX: vpX, startY: vpY,
            targetX,
            y: vpY,
            // Portal speed = 75% of main-game speed, always slightly slower than main scene
            speed: this.sharedDropSpeed * 0.75 * (0.9 + Math.random() * 0.2),
            sprite
        });
    }

    // ── Spawn magnet power-up ──────────────────────────────────────────────────
    _spawnMagnet(vpX, vpY) {
        const targetX = 80 + Math.random() * (this.W - 160);
        const sprite  = this.add.image(vpX, vpY, 'powerup_magnet')
            .setScale(0.10).setAlpha(0.15).setDepth(6);
        this.magnets.push({
            startX: vpX, startY: vpY,
            targetX,
            y: vpY,
            speed: 120,   // slow and easy to spot
            sprite
        });
    }

    // ── Main update ───────────────────────────────────────────────────────────
    update(_, delta) {
        if (this.isLeaving) return;
        const dt = delta / 1000;

        // Countdown
        this.portalSec -= dt;
        this.timeTxt.setText(Math.max(0, Math.ceil(this.portalSec)) + 's');
        if (this.portalSec <= 0) { this._leave(); return; }

        // Vanishing point sways left/right
        this.vpTime += dt;
        const vpX = this.W / 2 + Math.sin(this.vpTime * 0.55) * this.W * 0.18;
        const vpY = this.H * 0.10;

        // ── Player movement ───────────────────────────────────────────────────
        const spd = this.charKey === 'shovel' ? 780 : this.charKey === 'soap' ? 650 : 560;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -spd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  spd;
        if (!vx && this.touchDir) vx = this.touchDir * spd;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);
        this.player.anims.play(vx ? `${this.charKey}_walk` : `${this.charKey}_idle`, true);
        if (vx) this.player.setFlipX(vx < 0);

        // ── Spawn regular objects ──────────────────────────────────────────────
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this._spawnObject(vpX, vpY);
            // Spawn gets faster over time but slower ramp than before (0.006 vs 0.012), min 0.65s
            this.spawnTimer = Math.max(0.65, this.spawnCd - (30 - this.portalSec) * 0.006);
        }

        // ── Spawn magnet ──────────────────────────────────────────────────────
        this.magnetSpawnCd -= dt;
        if (this.magnetSpawnCd <= 0) {
            this._spawnMagnet(vpX, vpY);
            this.magnetSpawnCd = 14 + Math.random() * 8;
        }

        // ── Magnet countdown & pull ───────────────────────────────────────────
        if (this.magnetSec > 0) {
            this.magnetSec -= dt;
            if (this.magnetSec < 0) this.magnetSec = 0;
            // Pull all object targetX toward player
            const pull = Math.min(1, dt * 5);
            this.objects.forEach(o => {
                o.targetX += (this.player.x - o.targetX) * pull;
            });
            // Update HUD label
            if (this._magnetTxt) {
                this._magnetTxt.setText(`🧲 ${Math.ceil(this.magnetSec)}s`);
                if (this.magnetSec <= 0) { this._magnetTxt.destroy(); this._magnetTxt = null; }
            }
        }

        // ── Planets ───────────────────────────────────────────────────────────
        const PLANET_GAP = 280;
        const maxPlanetX = Math.max(...this._planets.map(p => p.img.x));
        this._planets.forEach(p => {
            p.img.x -= p.spd * dt;
            p.lbl.x  = p.img.x;
            if (p.img.x < -160) {
                p.img.x = maxPlanetX + PLANET_GAP;
                p.lbl.x = p.img.x;
            }
        });

        // ── Tunnel visual ─────────────────────────────────────────────────────
        this._drawTunnel(vpX, vpY);

        // ── Regular objects ───────────────────────────────────────────────────
        const playerY  = this.player.y;
        const catchTop = playerY - 90;

        for (let i = this.objects.length - 1; i >= 0; i--) {
            const o = this.objects[i];
            o.y += o.speed * dt;

            const tDepth = Math.max(0, (o.y - o.startY) / (playerY - o.startY));
            const x      = o.startX + (o.targetX - o.startX) * tDepth;
            const sc     = 0.10 + tDepth * 1.25;
            const al     = 0.15 + tDepth * 0.85;

            o.sprite.x = x;
            o.sprite.y = o.y;
            o.sprite.setScale(sc).setAlpha(al).setDepth(3 + tDepth * 5);

            if (Math.abs(x - this.player.x) < 55 && o.y > catchTop && o.y < playerY + 10) {
                this._catch(o, i); continue;
            }
            if (o.y > this.H + 30) {
                o.sprite.destroy(); this.objects.splice(i, 1); this._miss();
            }
        }

        // ── Magnet items ──────────────────────────────────────────────────────
        for (let i = this.magnets.length - 1; i >= 0; i--) {
            const m = this.magnets[i];
            m.y += m.speed * dt;
            m.sprite.rotation += dt * 2;

            const tDepth = Math.max(0, (m.y - m.startY) / (playerY - m.startY));
            const x      = m.startX + (m.targetX - m.startX) * tDepth;
            const sc     = 0.10 + tDepth * 1.25;
            const al     = 0.2 + tDepth * 0.8;

            m.sprite.x = x;
            m.sprite.y = m.y;
            m.sprite.setScale(sc).setAlpha(al).setDepth(6 + tDepth * 5);

            // Catch magnet
            if (Math.abs(x - this.player.x) < 60 && m.y > catchTop && m.y < playerY + 10) {
                m.sprite.destroy(); this.magnets.splice(i, 1);
                this._activateMagnet();
                continue;
            }
            // Falls off screen — no penalty
            if (m.y > this.H + 30) { m.sprite.destroy(); this.magnets.splice(i, 1); }
        }
    }

    _activateMagnet() {
        this.magnetSec = 7;
        // Show HUD label
        if (this._magnetTxt) this._magnetTxt.destroy();
        this._magnetTxt = this.add.text(this.W / 2, 80, '🧲 7s', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px', fill: '#00eeff',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(26);
        // Shake briefly so player knows they got it
        this.cameras.main.shake(150, 0.006);
    }

    _catch(o, idx) {
        o.sprite.destroy();
        this.objects.splice(idx, 1);
        this.score += 5 * (this.sharedStar > 0 ? 2 : 1);
        this.scoreTxt.setText(`${this.score}`);
    }

    _miss() {
        this.lives = Math.max(0, this.lives - 1);
        this.hearts.forEach((h, i) => {
            h.setText(i < this.lives ? '\u2665' : '\u2661');
            h.setColor(i < this.lives ? '#FF3B3B' : '#888888');
        });
        this.cameras.main.shake(200, 0.012);
        if (this.lives <= 0) this._leave();
    }

    _leave() {
        if (this.isLeaving) return;
        this.isLeaving = true;
        this.objects.forEach(o => o.sprite.destroy()); this.objects = [];
        this.magnets.forEach(m => m.sprite.destroy()); this.magnets = [];
        this._planets.forEach(p => { p.img.destroy(); p.lbl.destroy(); }); this._planets = [];
        if (this._magnetTxt) { this._magnetTxt.destroy(); this._magnetTxt = null; }
        this.cameras.main.flash(500, 0, 180, 255, false);
        this.time.delayedCall(500, () => {
            this.scene.stop();
            this.scene.resume('GameScene', {
                fromPortal: true,
                score:      this.score,
                lives:      this.lives,
                buttCount:  this.sharedButt,
                shield:     this.shield,
                starSec:    this.sharedStar,
                boostSec:   this.sharedBoost
            });
        });
    }

    shutdown() {
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
    }
}
