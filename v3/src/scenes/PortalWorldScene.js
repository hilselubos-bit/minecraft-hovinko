class PortalWorldScene extends Phaser.Scene {
    constructor() { super('PortalWorldScene'); }

    init(data) {
        this.sharedScore  = data.score      || 0;
        this.sharedLives  = data.lives      || 3;
        this.charKey      = data.charKey    || 'steve';
        this.itemKey      = data.itemKey    || 'poop';
        this.sharedShield = data.shield     || false;
        this.sharedStar   = data.starSec    || 0;
        this.sharedButt   = data.buttCount  || 0;
        this.sharedBoost  = data.boostSec   || 0;
    }

    create() {
        this.W = this.scale.width;
        this.H = this.scale.height;

        this.score      = this.sharedScore;
        this.lives      = this.sharedLives;
        this.shield     = this.sharedShield;
        this.portalSec  = 30;
        this.isLeaving  = false;
        this.poops      = [];
        this.poopCd     = 1.5;
        this.poopInt    = 1.2;
        this.dropSpeed  = 130;
        this.touchDir   = 0;
        this.boostSec   = this.sharedBoost;
        this._lastTapTime  = 0;
        this._lastKeyTime  = 0;
        this._lastKeyCode  = '';
        this._audioCtx  = null;

        this._buildBg();
        this._buildPlayer();
        this._buildHUD();
        this._buildInput();
        this._playEntry();
    }

    // ═══ POZADÍ — VESMÍR ══════════════════════════════════════════════════════
    _buildBg() {
        // Tmavý vesmírný podklad
        const sky = this.add.graphics().setDepth(0);
        sky.fillStyle(0x000814, 1);
        sky.fillRect(0, 0, this.W, this.H);

        // Vzdálené hvězdy (pomalu scrollují)
        this.stars1 = this.add.tileSprite(0, 0, this.W, this.H, 'stars_far')
            .setOrigin(0, 0).setDepth(1);

        // Bližší hvězdy (rychleji scrollují)
        this.stars2 = this.add.tileSprite(0, 0, this.W, this.H, 'stars_near')
            .setOrigin(0, 0).setDepth(2);

        // Mlhoviny / planety — dekorace
        const neb = this.add.graphics().setDepth(1).setAlpha(0.18);
        neb.fillStyle(0x5500CC, 1); neb.fillCircle(this.W * 0.78, this.H * 0.25, 90);
        neb.fillStyle(0x0033BB, 1); neb.fillCircle(this.W * 0.15, this.H * 0.55, 65);
        neb.fillStyle(0xCC2200, 1); neb.fillCircle(this.W * 0.55, this.H * 0.78, 45);

        // Podlaha — průhledný pruh kde stojí hráč (je vidět kde je nebezpečná zóna)
        const floor = this.add.graphics().setDepth(5);
        floor.fillStyle(0x0044AA, 0.25);
        floor.fillRect(0, this.H - 90, this.W, 90);
        floor.lineStyle(2, 0x00AAFF, 0.6);
        floor.lineBetween(0, this.H - 90, this.W, this.H - 90);
    }

    // ═══ HRÁČ ═════════════════════════════════════════════════════════════════
    _buildPlayer() {
        this.player = this.add.sprite(this.W / 2, this.H - 60, this.charKey)
            .setScale(1.3).setDepth(10);
        this.player.anims.play(`${this.charKey}_idle`);

        // Štít grafika
        this.shieldGfx = this.add.graphics().setDepth(11);
        this.shieldPulse = 0;
    }

    // ═══ HUD ══════════════════════════════════════════════════════════════════
    _buildHUD() {
        const lS = { fontFamily: '"Press Start 2P", monospace', fontSize: '11px', fill: '#00CFFF', stroke: '#000', strokeThickness: 3 };

        // Score
        this.add.text(13, 17, 'SK:', lS).setDepth(20);
        this.scoreTxt = this.add.text(52, 17, `${this.score}`, lS).setDepth(20);

        // Životy
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.text(this.W - 18 - i * 24, 17, '\u2665', { ...lS, fontSize: '11px', fill: '#FF3B3B' }).setDepth(20)
            );
        }

        // Odpočet portálu — výrazně uprostřed nahoře
        this.timerBg = this.add.graphics().setDepth(19);
        this.timerTxt = this.add.text(this.W / 2, 14, '30s', {
            ...lS, fontSize: '16px', fill: '#00CFFF'
        }).setOrigin(0.5, 0).setDepth(20);

        // Label světa
        this.add.text(this.W / 2, 45, 'VYHYBEJ SE!', {
            ...lS, fontSize: '8px', fill: '#5599FF'
        }).setOrigin(0.5, 0).setDepth(20);
    }

    _hudUpdate() {
        this.scoreTxt.setText(`${this.score}`);
        this.hearts.forEach((h, i) => {
            h.setText(i < this.lives ? '\u2665' : '\u2661');
            h.setColor(i < this.lives ? '#FF3B3B' : '#444444');
        });
        const secs = Math.ceil(this.portalSec);
        this.timerTxt.setText(`${secs}s`);
        // Zbarvení odpočtu — čím méně tím červenější
        const col = secs <= 10 ? '#FF4444' : secs <= 20 ? '#FFAA00' : '#00CFFF';
        this.timerTxt.setColor(col);
    }

    // ═══ VSTUP ════════════════════════════════════════════════════════════════
    _buildInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd    = this.input.keyboard.addKeys('A,D');

        this.input.on('pointerdown', p => {
            const now = this.time.now;
            if (now - this._lastTapTime < 300) this.boostSec = 3.5;
            this._lastTapTime = now;
            this.touchDir = p.x < this.player.x ? -1 : 1;
        });
        this.input.on('pointermove', p => { if (p.isDown) this.touchDir = p.x < this.player.x ? -1 : 1; });
        this.input.on('pointerup',   () => { this.touchDir = 0; });

        this.input.keyboard.on('keydown', e => {
            const k = e.code;
            if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'KeyA' || k === 'KeyD') {
                const now = this.time.now;
                if (k === this._lastKeyCode && now - this._lastKeyTime < 300) this.boostSec = 3.5;
                this._lastKeyCode = k; this._lastKeyTime = now;
            }
        });
    }

    // ═══ EFEKTY PŘECHODU ══════════════════════════════════════════════════════
    _playEntry() {
        this.cameras.main.flash(500, 0, 180, 255, false);
        this.player.setScale(0);
        this.tweens.add({ targets: this.player, scaleX: 1.3, scaleY: 1.3, duration: 500, ease: 'Back.Out' });

        const txt = this.add.text(this.W / 2, this.H / 2, 'JINÝ SVĚT!\nVYHÝBEJ SE!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '16px',
            fill: '#00CFFF', stroke: '#000033', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(30).setAlpha(0);
        this.tweens.chain({ targets: txt, tweens: [
            { alpha: 1, scale: 1.05, duration: 350, ease: 'Back.Out' },
            { alpha: 0, y: txt.y - 50, delay: 1300, duration: 450, onComplete: () => txt.destroy() }
        ]});
    }

    _playExit(onDone) {
        this._sound('exit');
        this.cameras.main.flash(600, 0, 180, 255, false);

        const txt = this.add.text(this.W / 2, this.H / 2, 'NÁVRAT!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '22px',
            fill: '#00CFFF', stroke: '#000033', strokeThickness: 4
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: this.player, scaleX: 0, scaleY: 0, duration: 500, ease: 'Power2'
        });
        this.tweens.add({
            targets: txt, alpha: 0, y: txt.y - 60, delay: 600, duration: 400,
            onComplete: () => { txt.destroy(); onDone(); }
        });
    }

    // ═══ SPAWN ════════════════════════════════════════════════════════════════
    _spawnPoop() {
        const img = this.add.image(Phaser.Math.Between(40, this.W - 40), -42, this.itemKey)
            .setScale(0).setDepth(7);
        img.vy     = this.dropSpeed + Phaser.Math.Between(0, 45);
        img.vr     = Phaser.Math.FloatBetween(-1.5, 1.5);
        img.wobble = Math.random() * Math.PI * 2;
        img.passed = false;
        this.poops.push(img);
        this.tweens.add({ targets: img, scale: 1, duration: 180, ease: 'Back.Out' });
    }

    // ═══ ODESLAT ZPĚT DO GAMESCENE ════════════════════════════════════════════
    _leave() {
        if (this.isLeaving) return;
        this.isLeaving = true;

        this._playExit(() => {
            this.scene.resume('GameScene', {
                fromPortal: true,
                score:      this.score,
                lives:      this.lives,
                shield:     this.shield,
                starSec:    this.sharedStar,
                buttCount:  this.sharedButt
            });
            this.scene.stop('PortalWorldScene');
        });
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
        if (type === 'dodge') { osc(1047, 0.06, 'sine', 0.1); osc(1318, 0.08, 'sine', 0.08, 0.06); }
        if (type === 'hit')   { osc(180, 0.35, 'sawtooth', 0.15); }
        if (type === 'exit')  { [523, 784, 1047].forEach((f, i) => osc(f, 0.2, 'sine', 0.12, i * 0.12)); }
    }

    // ═══ UPDATE ═══════════════════════════════════════════════════════════════
    update(_, delta) {
        const dt = delta / 1000;
        if (this.isLeaving) return;

        // Odpočet portálu
        this.portalSec -= dt;
        if (this.portalSec <= 0) { this._leave(); return; }

        // Pohyb hráče
        if (this.boostSec > 0) this.boostSec -= dt;
        const spd = this.boostSec > 0 ? 560 : 310;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -spd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  spd;
        if (!vx && this.touchDir) vx = this.touchDir * spd;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);
        this.player.anims.play(vx ? `${this.charKey}_walk` : `${this.charKey}_idle`, true);
        if (vx) this.player.setFlipX(vx < 0);

        // Scrolling hvězd (iluzivní pohyb nahoru)
        this.stars1.tilePositionY -= 0.55;
        this.stars2.tilePositionY -= 1.4;

        // Štít vizuál
        this.shieldGfx.clear();
        if (this.shield) {
            this.shieldPulse += 3.5 * dt;
            const alpha = 0.4 + Math.sin(this.shieldPulse) * 0.35;
            this.shieldGfx.lineStyle(5, 0x00BFFF, alpha);
            this.shieldGfx.strokeCircle(this.player.x, this.player.y - 36, 52);
        }

        // Spawn hovínek
        this.poopCd -= dt;
        if (this.poopCd <= 0) { this._spawnPoop(); this.poopCd = this.poopInt; }

        // HUD
        this._hudUpdate();

        // Kolize a vyhnutí
        const dangerY = this.player.y - 40;
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const p = this.poops[i];
            p.y      += p.vy * dt;
            p.rotation += p.vr * dt;
            p.wobble += 2.0 * dt;
            p.x      += Math.sin(p.wobble) * 0.5;

            // Zásah hráče
            if (Math.abs(p.x - this.player.x) < 34 && Math.abs(p.y - dangerY) < 36) {
                p.destroy(); this.poops.splice(i, 1);
                if (this.shield) {
                    this.shield = false;
                    this.cameras.main.flash(220, 0, 191, 255, false);
                    continue;
                }
                this.lives--;
                this.cameras.main.shake(260, 0.013);
                this.cameras.main.flash(180, 255, 0, 0, false);
                this._sound('hit');

                // Zobraz zprávu o zásahu
                const hit = this.add.text(this.player.x, this.player.y - 50, 'AU!', {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '16px',
                    fill: '#FF4444', stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(25);
                this.tweens.add({ targets: hit, y: hit.y - 60, alpha: 0, duration: 700, onComplete: () => hit.destroy() });

                if (this.lives <= 0) {
                    this.isLeaving = true;
                    this.tweens.add({ targets: this.player, alpha: 0, duration: 400, onComplete: () => {
                        this.scene.stop('PortalWorldScene');
                        this.scene.stop('GameScene');
                        this.scene.start('GameOverScene', { score: this.score });
                    }});
                }
                continue;
            }

            // Hovínko minulo hráče → +1 bod
            if (!p.passed && p.y > this.player.y + 55) {
                p.passed = true;
                this.score++;
                this._sound('dodge');
                const pop = this.add.text(p.x, p.y - 10, '+1', {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '14px',
                    fill: '#00CFFF', stroke: '#000033', strokeThickness: 3
                }).setOrigin(0.5).setDepth(15);
                this.tweens.add({ targets: pop, y: pop.y - 55, alpha: 0, duration: 750, onComplete: () => pop.destroy() });
            }

            // Odstranit z obrazovky
            if (p.y > this.H + 60) { p.destroy(); this.poops.splice(i, 1); }
        }
    }
}
