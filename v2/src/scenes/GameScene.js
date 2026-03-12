class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.W = this.scale.width;
        this.H = this.scale.height;

        // ── Herní stav ────────────────────────────────────────────────────────
        this.score     = 0;
        this.lives     = 3;
        this.level     = 1;
        this.isOver    = false;
        this.goDelay   = 0;

        // Poop spawner (čistě v update loopu)
        this.poopInt   = 1.2;   // interval spawn [s]
        this.poopCd    = 1.2;   // odpočet do spawnu
        this.dropSpeed = 160;   // základní rychlost pádu

        // Power-up stav (vše v update loopu — žádné Phaser timery)
        this.puCd          = 6;     // odpočet do prvního power-upu [s]
        this.puInterval    = 13;    // interval mezi spawny [s]
        this.shield        = false; // štít aktivní
        this.starSec       = 0;     // kolik sekund zbývá 2× bonus
        this.shieldPulse   = 0;

        // Tajný turbo boost
        this.boostSec      = 0;
        this._lastTapTime  = 0;
        this._lastKeyTime  = 0;
        this._lastKeyCode  = '';

        // Objekty
        this.poops    = [];
        this.powerups = [];

        this._buildBg();
        this._buildPlayer();
        this._buildFx();
        this._buildHUD();
        this._buildInput();
        this._audioCtx = null;
    }

    // ═══ POZADÍ ═══════════════════════════════════════════════════════════════
    _buildBg() {
        // Obloha
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, this.W, this.H);

        // Slunce
        this.add.image(75, 65, 'sun').setScale(1.2).setDepth(1);

        // Hory — pomalý parallax
        this.mtns = this.add.tileSprite(0, this.H - 222, this.W, 130, 'mountains')
            .setOrigin(0, 0).setAlpha(0.80).setDepth(2);

        // Mraky — 2 daleké (pomalé) + 2 blízké (rychlejší)
        this.cloudsF = [
            Object.assign(this.add.image( 80, 55, 'cloud').setAlpha(0.60).setScale(1.1).setDepth(3),  { spd: 0.11 }),
            Object.assign(this.add.image(300, 36, 'cloud').setAlpha(0.55).setScale(1.4).setDepth(3),  { spd: 0.07 }),
            Object.assign(this.add.image(500, 68, 'cloud').setAlpha(0.62).setScale(0.9).setDepth(3),  { spd: 0.09 }),
        ];
        this.cloudsN = [
            Object.assign(this.add.image(155, 82, 'cloud').setAlpha(0.88).setScale(0.72).setDepth(4), { spd: 0.24 }),
            Object.assign(this.add.image(390, 60, 'cloud').setAlpha(0.92).setScale(1.05).setDepth(4), { spd: 0.20 }),
        ];

        // Stromy
        this.add.image(24,        this.H - 128, 'tree').setDepth(5);
        this.add.image(this.W-24, this.H - 125, 'tree').setFlipX(true).setDepth(5);
        this.add.image(this.W-72, this.H - 118, 'tree').setScale(0.82).setDepth(5);

        // Země
        this.add.tileSprite(0, this.H - 100, this.W, 100, 'ground').setOrigin(0, 0).setDepth(5);
    }

    // ═══ HRÁČ ═════════════════════════════════════════════════════════════════
    _buildPlayer() {
        this.player = this.add.sprite(this.W / 2, this.H - 103, 'steve')
            .setScale(1.3).setDepth(6);
        this.player.anims.play('idle');
    }

    // ═══ EFEKTY ═══════════════════════════════════════════════════════════════
    _buildFx() {
        this.emitter = this.add.particles(0, 0, 'particle', {
            speed:    { min: 130, max: 310 },
            angle:    { min: 0, max: 360 },
            scale:    { start: 1.4, end: 0 },
            lifespan: 650,
            tint:     [0xFFD700, 0x8B4513, 0xFF6F00, 0xD2691E, 0xffffff],
            quantity: 0,
            emitting: false
        }).setDepth(12);

        // Kruh štítu (kreslí se každý frame)
        this.shieldGfx = this.add.graphics().setDepth(8);
    }

    // ═══ HUD ══════════════════════════════════════════════════════════════════
    _buildHUD() {
        const labelStyle = { fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700', stroke: '#000', strokeThickness: 3 };

        // Score
        this.add.text(13, 17, 'SK:', labelStyle).setDepth(20);
        this.scoreTxt = this.add.text(58, 17, '0', labelStyle).setDepth(20);

        // Životy — 3 samostatné text objekty, plain unicode ♥/♡
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            this.hearts.push(
                this.add.text(this.W - 18 - i * 28, 17, '\u2665', { ...labelStyle, fill: '#FF3B3B' }).setDepth(20)
            );
        }

        // Level
        this.levelTxt = this.add.text(this.W / 2, 16, '', { ...labelStyle, fontSize: '10px', fill: '#FF7043' })
            .setOrigin(0.5, 0).setDepth(20);

        // Power-up
        this.puTxt = this.add.text(this.W / 2, 54, '', { ...labelStyle, fontSize: '11px', fill: '#fff' })
            .setOrigin(0.5, 0).setAlpha(0).setDepth(20);
    }

    _hudUpdate() {
        this.scoreTxt.setText(`${this.score}`);
        this.hearts.forEach((h, i) => {
            h.setText(i < this.lives ? '\u2665' : '\u2661');
            h.setColor(i < this.lives ? '#FF3B3B' : '#888888');
        });
        if (this.level > 1) this.levelTxt.setText(`LVL ${this.level}`);

        if (this.shield) {
            this.puTxt.setText('STIT AKTIVNI').setColor('#00BFFF').setAlpha(1);
        } else if (this.starSec > 0) {
            this.puTxt.setText(`2x BODY (${Math.ceil(this.starSec)}s)`).setColor('#FFD700').setAlpha(1);
        } else {
            this.puTxt.setAlpha(0);
        }
    }

    // ═══ VSTUP ════════════════════════════════════════════════════════════════
    _buildInput() {
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.wasd     = this.input.keyboard.addKeys('A,D');
        this.touchDir = 0;

        this.input.on('pointerdown', p => {
            // Double-tap → turbo
            const now = this.time.now;
            if (now - this._lastTapTime < 300) this._activateBoost();
            this._lastTapTime = now;
            this.touchDir = p.x < this.player.x ? -1 : 1;
        });
        this.input.on('pointermove', p => { if (p.isDown) this.touchDir = p.x < this.player.x ? -1 : 1; });
        this.input.on('pointerup',   () => { this.touchDir = 0; });

        // Double-arrow → turbo
        this.input.keyboard.on('keydown', e => {
            const k = e.code;
            if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'KeyA' || k === 'KeyD') {
                const now = this.time.now;
                if (k === this._lastKeyCode && now - this._lastKeyTime < 300) this._activateBoost();
                this._lastKeyCode = k;
                this._lastKeyTime = now;
            }
        });
    }

    _activateBoost() {
        this.boostSec = 3.5;
        // Velmi jemný vizuální hint (světlý záblesk) — skoro tajný
        this.cameras.main.flash(120, 255, 255, 255, false);
        this._sound('boost');
    }

    // ═══ SPAWN ════════════════════════════════════════════════════════════════
    _spawnPoop() {
        const img = this.add.image(Phaser.Math.Between(40, this.W - 40), -42, 'poop')
            .setScale(0).setDepth(7);
        img.vy     = this.dropSpeed + Phaser.Math.Between(0, 55);
        img.vr     = Phaser.Math.FloatBetween(-1.8, 1.8);
        img.wobble = Math.random() * Math.PI * 2;
        this.poops.push(img);
        this.tweens.add({ targets: img, scale: 1, duration: 200, ease: 'Back.Out' });
    }

    _spawnPowerup() {
        const roll = Math.random();
        const type = roll < 0.34 ? 'shield' : roll < 0.67 ? 'star' : 'butt';
        const x    = Phaser.Math.Between(55, this.W - 55);
        const img  = this.add.image(x, -55, `powerup_${type}`).setScale(0).setDepth(7);
        img.vy     = 62 + Math.random() * 22;
        img.type   = type;
        this.powerups.push(img);

        // Pop-in (pouze scale — žádná animace y!)
        this.tweens.add({ targets: img, scale: 1.15, duration: 400, ease: 'Back.Out' });

        // Blikající upozornění nahoře
        const label = type === 'shield' ? 'STIT PADA!' : type === 'star' ? '2x BODY PADA!' : 'ZADEK PADA!';
        const color = type === 'shield' ? '#00BFFF' : type === 'star' ? '#FFD700' : '#FFAA88';
        const ann = this.add.text(x, 105, label, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px',
            fill: color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(22).setAlpha(0);
        this.tweens.add({
            targets: ann, alpha: 1, duration: 150,
            yoyo: true, hold: 1600, repeat: 1,
            onComplete: () => ann.destroy()
        });
    }

    // ═══ CHYCENÍ / ZTRÁTA ═════════════════════════════════════════════════════
    _catchPoop(p) {
        const x = p.x, y = p.y;
        p.destroy();
        this.poops.splice(this.poops.indexOf(p), 1);

        const pts = this.starSec > 0 ? 2 : 1;
        this.score += pts;
        this._sound('catch');

        this.emitter.setPosition(x, y);
        this.emitter.explode(pts === 2 ? 30 : 20);

        // Popup +1 / +2
        const pop = this.add.text(x, y - 10, `+${pts} 💩`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '15px',
            fill: pts === 2 ? '#FFD700' : '#ffffff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: pop, y: y - 85, alpha: 0, duration: 850, ease: 'Power2',
            onComplete: () => pop.destroy() });

        if (this.score % 10 === 0) this._levelUp();
        this._hudUpdate();
    }

    _catchPowerup(p) {
        const x = p.x, y = p.y;
        const type = p.type;
        p.destroy();
        this.powerups.splice(this.powerups.indexOf(p), 1);

        this.emitter.setPosition(x, y);
        this.emitter.explode(25);
        this._sound('powerup');

        if (type === 'shield') {
            this.shield = true;
            this._showMsg('STIT!', '#00BFFF', x, y);
        } else if (type === 'star') {
            this.starSec = 8;
            this._showMsg('2x BODY!', '#FFD700', x, y);
        } else {
            this._fartEffect();
        }
        this._hudUpdate();
    }

    _fartEffect() {
        const px = this.player.x, py = this.player.y - 20;
        const wasFlipped = this.player.flipX;

        // Steve se otočí zády
        this.player.setFlipX(!wasFlipped);
        this._sound('fart');
        this._showMsg('PRRRR!', '#90EE90', px, py - 30);

        // Fartový výtr — 3 kruhy letí do strany
        const dir = wasFlipped ? 1 : -1;
        [0, 180, 360].forEach(delay => {
            const g = this.add.graphics().setDepth(15);
            this.tweens.add({
                targets: { r: 10, ax: 0, alpha: 0.7 },
                r: 50, ax: 80, alpha: 0,
                delay, duration: 700,
                onUpdate: (tw, obj) => {
                    g.clear();
                    g.fillStyle(0x90EE90, obj.alpha);
                    g.fillCircle(px + dir * (30 + obj.ax), py + 20, obj.r);
                },
                onComplete: () => g.destroy()
            });
        });

        // Všechna hovínka odlítí nahoru
        this.poops.forEach(p => { p.vy = -420; p.vr *= -1; });

        // Po 650ms se Steve otočí zpět
        this.tweens.add({ targets: this.player, alpha: 1, delay: 650, duration: 1,
            onComplete: () => this.player.setFlipX(wasFlipped) });
    }

    _miss() {
        if (this.shield) {
            // Štít absorbuje zásah
            this.shield = false;
            this.cameras.main.flash(220, 0, 191, 255, false);
            this._sound('shieldBreak');
            this._showMsg('STIT ZLOMEN!', '#00BFFF', this.W / 2, this.H / 2 - 50);
            this._hudUpdate();
            return;
        }
        this.lives--;
        this.cameras.main.shake(280, 0.013);
        this.cameras.main.flash(180, 255, 0, 0, false);
        this._sound('miss');
        this.tweens.add({ targets: this.livesTxt, scaleX: 1.4, scaleY: 1.4, duration: 90, yoyo: true });
        this._hudUpdate();

        if (this.lives <= 0) {
            this.isOver  = true;
            this.goDelay = 0.9;
        }
    }

    _levelUp() {
        this.level++;
        this.dropSpeed += 28;
        this.poopInt    = Math.max(0.38, this.poopInt - 0.08);
        this._sound('levelup');

        const b = this.add.text(this.W / 2, this.H / 2 - 65,
            `LEVEL ${this.level}\nRYCHLEJI! 🚀`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '20px',
                fill: '#FFD700', stroke: '#E65100', strokeThickness: 4, align: 'center'
            }
        ).setOrigin(0.5).setScale(0.4).setAlpha(0).setDepth(30);
        this.tweens.chain({ targets: b, tweens: [
            { alpha: 1, scale: 1.05, duration: 280, ease: 'Back.Out' },
            { scale: 1, duration: 70 },
            { alpha: 0, y: b.y - 40, delay: 900, duration: 380, onComplete: () => b.destroy() }
        ]});
    }

    _showMsg(txt, color, x, y) {
        const m = this.add.text(x, y - 10, txt, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '14px',
            fill: color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(16);
        this.tweens.add({ targets: m, y: y - 90, alpha: 0, duration: 1100,
            onComplete: () => m.destroy() });
    }

    // ═══ ZVUK ═════════════════════════════════════════════════════════════════
    _sound(type) {
        if (!this._audioCtx) {
            try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
        }
        const ctx = this._audioCtx, t = ctx.currentTime;

        const osc = (freq, dur, wave = 'square', vol = 0.14, start = 0) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = wave; o.frequency.value = freq;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(vol, t + start);
            g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
            o.start(t + start); o.stop(t + start + dur);
        };

        if      (type === 'catch')      { osc(523,.08); osc(784,.12); }
        else if (type === 'miss')       { osc(280,.35,'sawtooth'); }
        else if (type === 'powerup')    { [523,784,1047,1318].forEach((f,i) => osc(f,.15,'square',.15,i*.08)); }
        else if (type === 'shieldBreak'){ [600,400,200].forEach((f,i) => osc(f,.12,'sawtooth',.15,i*.1)); }
        else if (type === 'levelup')    { [523,659,784,1047].forEach((f,i) => osc(f,.18,'square',.14,i*.1)); }
        else if (type === 'boost')      { osc(880,.06,'square',.08); osc(1200,.08,'square',.06,.05); }
        else if (type === 'fart') {
            // Šum (prd)
            const bufSize = Math.floor(ctx.sampleRate * 0.55);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.35, t);
            ng.gain.setValueAtTime(0.25, t + 0.15);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            noise.connect(ng); ng.connect(ctx.destination);
            noise.start(t);
            // Nízký bas pod šumem
            osc(70, 0.5, 'sawtooth', 0.2);
        }
    }

    // ═══ UPDATE ═══════════════════════════════════════════════════════════════
    update(_, delta) {
        const dt = delta / 1000;

        // ── Game over odpočet ────────────────────────────────────────────────
        if (this.isOver) {
            this.goDelay -= dt;
            if (this.goDelay <= 0)
                this.scene.start('GameOverScene', { score: this.score });
            return;
        }

        // ── Hráč ────────────────────────────────────────────────────────────
        if (this.boostSec > 0) this.boostSec -= dt;
        const spd = this.boostSec > 0 ? 560 : 310;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -spd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  spd;
        if (!vx && this.touchDir) vx = this.touchDir * spd;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);
        this.player.anims.play(vx ? 'walk' : 'idle', true);
        if (vx) this.player.setFlipX(vx < 0);

        // ── Spawn hovínek ────────────────────────────────────────────────────
        this.poopCd -= dt;
        if (this.poopCd <= 0) { this._spawnPoop(); this.poopCd = this.poopInt; }

        // ── Spawn power-upů ──────────────────────────────────────────────────
        this.puCd -= dt;
        if (this.puCd <= 0) { this._spawnPowerup(); this.puCd = this.puInterval; }

        // ── Star odpočet ─────────────────────────────────────────────────────
        if (this.starSec > 0) { this.starSec -= dt; if (this.starSec < 0) this.starSec = 0; }

        // ── Štít kruh ────────────────────────────────────────────────────────
        this.shieldGfx.clear();
        if (this.shield) {
            this.shieldPulse += 3.5 * dt;
            const alpha = 0.4 + Math.sin(this.shieldPulse) * 0.35;
            this.shieldGfx.lineStyle(5, 0x00BFFF, alpha);
            this.shieldGfx.strokeCircle(this.player.x, this.player.y - 36, 52);
        }

        // ── HUD ──────────────────────────────────────────────────────────────
        this._hudUpdate();

        const catchY = this.player.y - 46;

        // ── Hovínka ──────────────────────────────────────────────────────────
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const p = this.poops[i];
            p.y      += p.vy * dt;
            p.rotation += p.vr * dt;
            p.wobble += 2.0 * dt;
            p.x      += Math.sin(p.wobble) * 0.55;
            if (Math.abs(p.x - this.player.x) < 34 && Math.abs(p.y - catchY) < 36) {
                this._catchPoop(p); continue;
            }
            if (p.y > this.H + 50) { p.destroy(); this.poops.splice(i, 1); this._miss(); }
        }

        // ── Power-upy ────────────────────────────────────────────────────────
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y        += p.vy * dt;
            p.rotation += 1.2 * dt;     // pomalá rotace místo tweenu
            if (Math.abs(p.x - this.player.x) < 38 && Math.abs(p.y - catchY) < 40) {
                this._catchPowerup(p); continue;
            }
            if (p.y > this.H + 60) { p.destroy(); this.powerups.splice(i, 1); }
        }

        // ── Parallax ─────────────────────────────────────────────────────────
        this.mtns.tilePositionX += 0.06;
        this.cloudsF.forEach(c => { c.x -= c.spd; if (c.x < -150) c.x = this.W + 150; });
        this.cloudsN.forEach(c => { c.x -= c.spd; if (c.x < -150) c.x = this.W + 150; });
    }
}
