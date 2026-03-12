class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.W = this.scale.width;
        this.H = this.scale.height;

        this.score      = 0;
        this.lives      = 3;
        this.dropSpeed  = 160;
        this.spawnDelay = 1200;
        this.level      = 1;
        this.gameOver   = false;

        this._buildBg();
        this._buildPlayer();
        this._buildParticles();
        this._buildPowerups();
        this._buildHUD();
        this._buildInput();
        this._startSpawner();

        this._audioCtx = null;
    }

    // ── Background (parallax layers) ─────────────────────────────────────────
    _buildBg() {
        // Sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, this.W, this.H);

        this.add.image(75, 65, 'sun').setScale(1.15).setDepth(0);

        // Mountains (slow parallax via tileSprite)
        this.mtns = this.add.tileSprite(0, this.H - 222, this.W, 130, 'mountains')
            .setOrigin(0, 0).setAlpha(0.78).setDepth(1);

        // Clouds — 2 far, 2 near at different speeds & alphas
        this.clouds = [
            Object.assign(this.add.image( 90, 58, 'cloud').setAlpha(0.65).setScale(0.9).setDepth(2), { spd: 0.10 }),
            Object.assign(this.add.image(310, 38, 'cloud').setAlpha(0.60).setScale(1.2).setDepth(2), { spd: 0.07 }),
            Object.assign(this.add.image(180, 78, 'cloud').setAlpha(0.90).setScale(0.75).setDepth(3), { spd: 0.22 }),
            Object.assign(this.add.image(420, 62, 'cloud').setAlpha(0.88).setScale(1.0).setDepth(3), { spd: 0.18 }),
        ];

        // Trees
        this.add.image(22,       this.H - 128, 'tree').setDepth(4);
        this.add.image(this.W-22,this.H - 125, 'tree').setFlipX(true).setDepth(4);
        this.add.image(this.W-68,this.H - 120, 'tree').setScale(0.85).setDepth(4);

        // Ground
        this.add.tileSprite(0, this.H - 100, this.W, 100, 'ground').setOrigin(0, 0).setDepth(4);
    }

    // ── Player ────────────────────────────────────────────────────────────────
    _buildPlayer() {
        this.player = this.add.sprite(this.W / 2, this.H - 103, 'steve')
            .setScale(1.3).setDepth(6);
        this.player.anims.play('idle');
    }

    // ── Particles ─────────────────────────────────────────────────────────────
    _buildParticles() {
        this.emitter = this.add.particles(0, 0, 'particle', {
            speed:    { min: 120, max: 300 },
            angle:    { min: 0, max: 360 },
            scale:    { start: 1.4, end: 0 },
            lifespan: 650,
            tint:     [0xFFD700, 0x8B4513, 0xFF6F00, 0xD2691E, 0xffffff],
            quantity: 0,
            emitting: false
        }).setDepth(12);
    }

    // ── Power-ups ─────────────────────────────────────────────────────────────
    _buildPowerups() {
        this.powerups    = [];
        this.shieldActive = false;
        this.starActive   = false;
        this.starEndTime  = 0;

        // Shield ring (redrawn each frame when active)
        this.shieldRing = this.add.graphics().setDepth(8);
        this.shieldPulse = 0;

        // První power-up za 5s, pak každých 12s
        this.time.delayedCall(5000, () => {
            this._spawnPowerup();
            this.time.addEvent({ delay: 12000, callback: this._spawnPowerup, callbackScope: this, loop: true });
        });
    }

    _spawnPowerup() {
        if (this.gameOver) return;
        const type = Math.random() < 0.5 ? 'shield' : 'star';
        const img = this.add.image(Phaser.Math.Between(50, this.W - 50), -50, `powerup_${type}`)
            .setScale(0).setDepth(5);
        img.vy   = 60 + Math.random() * 20;  // pomalejší pád
        img.vr   = Phaser.Math.FloatBetween(-1.0, 1.0);
        img.type = type;
        this.powerups.push(img);
        // Pop-in + scale pulse (nesmí animovat y — konflikt s p.y v update)
        this.tweens.add({ targets: img, scale: 1.1, duration: 350, ease: 'Back.Out',
            onComplete: () => this.tweens.add({ targets: img, scaleX: 1.3, scaleY: 1.3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
        });
        // Upozornění nahoře obrazovky
        const icon  = type === 'shield' ? '🛡️' : '⭐';
        const color = type === 'shield' ? '#00BFFF' : '#FFD700';
        const hint  = this.add.text(img.x, 108, `${icon} POWER-UP!`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px',
            fill: color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(22).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 200,
            yoyo: true, hold: 1400, onComplete: () => hint.destroy() });
    }

    _activatePowerup(type, x, y) {
        this.emitter.setPosition(x, y);
        this.emitter.explode(20);
        this._sound('powerup');

        const label = type === 'shield' ? '🛡️  ŠTÍT!' : '⭐  2× BODY!';
        const color = type === 'shield' ? '#00BFFF' : '#FFD700';
        const pop = this.add.text(x, y - 10, label, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px',
            fill: color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(16);
        this.tweens.add({ targets: pop, y: y - 80, alpha: 0, duration: 1100, onComplete: () => pop.destroy() });

        if (type === 'shield') {
            this.shieldActive = true;
            this.powerupTxt.setText('🛡️ ŠTÍT').setAlpha(1).setStyle({ fill: '#00BFFF' });
        } else {
            this.starActive  = true;
            this.starEndTime = this.time.now + 8000;
            this.powerupTxt.setStyle({ fill: '#FFD700' }).setAlpha(1);
            this.time.delayedCall(8000, () => { this.starActive = false; this.powerupTxt.setAlpha(0); });
        }
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    _buildHUD() {
        const s = { fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700', stroke: '#000', strokeThickness: 3 };
        this.scoreTxt   = this.add.text(16, 16, '💩 0', s).setDepth(20);
        this.livesTxt   = this.add.text(this.W - 16, 16, '❤️❤️❤️', { ...s, fill: '#ff4444' }).setOrigin(1, 0).setDepth(20);
        this.levelTxt   = this.add.text(this.W / 2, 16, '', { ...s, fontSize: '10px', fill: '#FF7043' }).setOrigin(0.5, 0).setDepth(20);
        this.powerupTxt = this.add.text(this.W / 2, 58, '', { ...s, fontSize: '11px', fill: '#00BFFF' }).setOrigin(0.5, 0).setAlpha(0).setDepth(20);
    }

    _refreshHUD() {
        this.scoreTxt.setText(`💩 ${this.score}`);
        this.livesTxt.setText([...Array(3)].map((_,i) => i < this.lives ? '❤️' : '🖤').join(''));
        if (this.level > 1) this.levelTxt.setText(`LVL ${this.level} 🚀`);
        if (this.starActive) {
            const rem = Math.max(0, Math.ceil((this.starEndTime - this.time.now) / 1000));
            this.powerupTxt.setText(`⭐  2× BODY  (${rem}s)`);
        }
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    _buildInput() {
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.wasd     = this.input.keyboard.addKeys('A,D');
        this.touchDir = 0;
        this.input.on('pointerdown', p => { this.touchDir = p.x < this.player.x ? -1 : 1; });
        this.input.on('pointermove', p => { if (p.isDown) this.touchDir = p.x < this.player.x ? -1 : 1; });
        this.input.on('pointerup',   () => { this.touchDir = 0; });
    }

    // ── Spawner ───────────────────────────────────────────────────────────────
    _startSpawner() {
        this.poops = [];
        this.spawnEvent = this.time.addEvent({
            delay: this.spawnDelay, callback: this._spawnPoop,
            callbackScope: this, loop: true
        });
    }

    _spawnPoop() {
        if (this.gameOver) return;
        const img = this.add.image(Phaser.Math.Between(40, this.W - 40), -40, 'poop')
            .setScale(0).setDepth(5);
        img.vy     = this.dropSpeed + Phaser.Math.Between(0, 60);
        img.vr     = Phaser.Math.FloatBetween(-1.8, 1.8);
        img.wobble = Math.random() * Math.PI * 2;
        this.poops.push(img);
        this.tweens.add({ targets: img, scale: 1, duration: 220, ease: 'Back.Out' });
    }

    // ── Catch / Miss / Level Up ───────────────────────────────────────────────
    _catch(poop) {
        const x = poop.x, y = poop.y;
        poop.destroy();
        this.poops.splice(this.poops.indexOf(poop), 1);

        this.emitter.setPosition(x, y);
        this.emitter.explode(this.starActive ? 30 : 20);

        const pts = this.starActive ? 2 : 1;
        this.score += pts;
        this._refreshHUD();
        this._sound('catch');

        // Score popup
        const pop = this.add.text(x, y - 10, `+${pts} 💩`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '15px',
            fill: this.starActive ? '#FFD700' : '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: pop, y: y - 80, alpha: 0, duration: 900, ease: 'Power2', onComplete: () => pop.destroy() });

        if (this.score % 10 === 0) this._levelUp();
    }

    _miss() {
        if (this.shieldActive) {
            // Shield absorbs the hit
            this.shieldActive = false;
            this.powerupTxt.setAlpha(0);
            this.cameras.main.flash(200, 0, 191, 255, false);
            this._sound('shieldBreak');
            const msg = this.add.text(this.W / 2, this.H / 2 - 40, '🛡️ ŠTÍT ZLOMEN!', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '14px',
                fill: '#00BFFF', stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(25);
            this.tweens.add({ targets: msg, alpha: 0, delay: 800, duration: 400, onComplete: () => msg.destroy() });
            return;
        }

        this.lives--;
        this._refreshHUD();
        this.cameras.main.shake(280, 0.013);
        this.cameras.main.flash(180, 255, 0, 0, false);
        this._sound('miss');

        // Lives pulse animation
        this.tweens.add({ targets: this.livesTxt, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });

        if (this.lives <= 0) {
            this.gameOver = true;
            this.spawnEvent.remove();
            this.time.delayedCall(900, () => this.scene.start('GameOverScene', { score: this.score }));
        }
    }

    _levelUp() {
        this.level++;
        this.dropSpeed  += 28;
        this.spawnDelay  = Math.max(380, this.spawnDelay - 80);
        this.spawnEvent.reset({ delay: this.spawnDelay, callback: this._spawnPoop, callbackScope: this, loop: true });
        this._sound('levelup');

        const banner = this.add.text(this.W / 2, this.H / 2 - 60,
            `LEVEL ${this.level}\nRYCHLEJI! 🚀`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '20px',
                fill: '#FFD700', stroke: '#E65100', strokeThickness: 4, align: 'center'
            }
        ).setOrigin(0.5).setScale(0.4).setAlpha(0).setDepth(30);

        this.tweens.chain({
            targets: banner,
            tweens: [
                { alpha: 1, scale: 1.05, duration: 300, ease: 'Back.Out' },
                { scale: 1, duration: 80 },
                { alpha: 0, y: banner.y - 40, delay: 900, duration: 400, onComplete: () => banner.destroy() }
            ]
        });
    }

    // ── Audio ─────────────────────────────────────────────────────────────────
    _sound(type) {
        if (!this._audioCtx) {
            try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
        }
        const ctx = this._audioCtx, t = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        const tone = (freq, dur, type = 'square', vol = 0.15) => {
            const o = ctx.createOscillator(); o.type = type; o.connect(gain);
            o.frequency.value = freq;
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.start(t); o.stop(t + dur);
        };

        if (type === 'catch') {
            const o = ctx.createOscillator(); o.connect(gain);
            o.frequency.setValueAtTime(523, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.1);
            gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.start(t); o.stop(t + 0.2);
        } else if (type === 'miss') {
            tone(280, 0.35, 'sawtooth');
        } else if (type === 'powerup') {
            [523, 784, 1047, 1318].forEach((f, i) => {
                const o = ctx.createOscillator(); const g2 = ctx.createGain();
                o.connect(g2); g2.connect(ctx.destination);
                o.frequency.value = f;
                const s = t + i * 0.08;
                g2.gain.setValueAtTime(0, s); g2.gain.linearRampToValueAtTime(0.18, s + 0.04);
                g2.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
                o.start(s); o.stop(s + 0.15);
            });
        } else if (type === 'shieldBreak') {
            [600, 400, 200].forEach((f, i) => {
                const o = ctx.createOscillator(); const g2 = ctx.createGain();
                o.type = 'sawtooth'; o.connect(g2); g2.connect(ctx.destination);
                o.frequency.value = f;
                const s = t + i * 0.1;
                g2.gain.setValueAtTime(0.15, s); g2.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
                o.start(s); o.stop(s + 0.12);
            });
        } else if (type === 'levelup') {
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator(); const g2 = ctx.createGain();
                o.connect(g2); g2.connect(ctx.destination);
                o.frequency.value = f;
                const s = t + i * 0.1;
                g2.gain.setValueAtTime(0, s); g2.gain.linearRampToValueAtTime(0.15, s + 0.05);
                g2.gain.exponentialRampToValueAtTime(0.001, s + 0.18);
                o.start(s); o.stop(s + 0.2);
            });
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    update(time, delta) {
        if (this.gameOver) return;
        const dt = delta / 1000;

        // Player
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -310;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  310;
        if (vx === 0 && this.touchDir !== 0) vx = this.touchDir * 310;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);
        if (vx !== 0) { this.player.anims.play('walk', true); this.player.setFlipX(vx < 0); }
        else            { this.player.anims.play('idle', true); }

        // Shield ring pulse
        if (this.shieldActive) {
            this.shieldPulse += 4 * dt;
            const a = 0.45 + Math.sin(this.shieldPulse) * 0.35;
            this.shieldRing.clear();
            this.shieldRing.lineStyle(4, 0x00BFFF, a);
            this.shieldRing.strokeCircle(this.player.x, this.player.y - 36, 50);
        } else {
            this.shieldRing.clear();
        }

        // Refresh HUD (star countdown)
        this._refreshHUD();

        const catchY = this.player.y - 46;

        // Poops
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const p = this.poops[i];
            p.y      += p.vy * dt;
            p.rotation += p.vr * dt;
            p.wobble += 2.2 * dt;
            p.x      += Math.sin(p.wobble) * 0.6;
            if (Math.abs(p.x - this.player.x) < 34 && Math.abs(p.y - catchY) < 36) { this._catch(p); continue; }
            if (p.y > this.H + 50) { p.destroy(); this.poops.splice(i, 1); this._miss(); }
        }

        // Power-ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y      += p.vy * dt;
            p.rotation += p.vr * dt;
            if (Math.abs(p.x - this.player.x) < 36 && Math.abs(p.y - catchY) < 38) {
                this._activatePowerup(p.type, p.x, p.y);
                p.destroy(); this.powerups.splice(i, 1); continue;
            }
            if (p.y > this.H + 60) { p.destroy(); this.powerups.splice(i, 1); }
        }

        // Parallax
        this.mtns.tilePositionX += 0.06;
        this.clouds.forEach(c => { c.x -= c.spd; if (c.x < -140) c.x = this.W + 140; });
    }
}
