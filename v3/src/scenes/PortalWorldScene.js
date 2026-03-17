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
        // Rychlost a obtížnost přebíráme z GameScene (kontinuita)
        this.sharedDropSpeed = data.dropSpeed  || 160;
        this.sharedPoopInt   = data.poopInt    || 1.2;
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
        // Přebíráme rychlost z GameScene + mírně těžší než hlavní hra
        this.dropSpeed  = Math.max(this.sharedDropSpeed + 10, 170);
        this.poopInt    = Math.min(this.sharedPoopInt * 0.80, 1.1);
        this.poopCd     = this.poopInt;
        this.touchDir   = 0;
        this.boostSec   = this.sharedBoost;
        this._lastTapTime  = 0;
        this._lastKeyTime  = 0;
        this._lastKeyCode  = '';
        this._audioCtx  = null;
        this.isPaused   = false;
        this._pauseDiv  = null;

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

    // ═══ HRÁČ (prd v portálu = hovínko) ══════════════════════════════════════
    _buildPlayer() {
        // Hráč je nyní hovínko — větší, bez animace
        this.player = this.add.image(this.W / 2, this.H - 60, 'poop')
            .setScale(1.7).setDepth(10);

        // Štít grafika
        this.shieldGfx = this.add.graphics().setDepth(11);
        this.shieldPulse = 0;
    }

    // ═══ HUD ══════════════════════════════════════════════════════════════════
    _buildHUD() {
        const lS = { fontFamily: '"Press Start 2P", monospace', fontSize: '11px', fill: '#FFD700', stroke: '#000', strokeThickness: 3 };

        // Score
        this.add.text(13, 17, 'SC:', lS).setDepth(20);
        this.scoreTxt = this.add.text(52, 17, `${this.score}`, lS).setDepth(20);

        // Životy
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.text(this.W - 18 - i * 24, 17, '\u2665', { ...lS, fontSize: '11px', fill: '#FF4466' }).setDepth(20)
            );
        }

        // Odpočet portálu — výrazně uprostřed nahoře + progress bar
        this.timerBg  = this.add.graphics().setDepth(19);
        this.timerBar = this.add.graphics().setDepth(19);
        this.timerTxt = this.add.text(this.W / 2, 10, '30s', {
            ...lS, fontSize: '18px', fill: '#FFD700'
        }).setOrigin(0.5, 0).setDepth(20);

        // Label světa
        this.add.text(this.W / 2, 46, 'DODGE!', {
            ...lS, fontSize: '8px', fill: '#88AAFF'
        }).setOrigin(0.5, 0).setDepth(20);

        // Pause button — vpravo nahoře
        const pauseBtn = this.add.text(this.W - 12, 38, '⏸', {
            fontSize: '30px', fill: '#FFD700', stroke: '#000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(25).setInteractive();
        pauseBtn.on('pointerdown', () => this._togglePause());
    }

    _hudUpdate() {
        this.scoreTxt.setText(`${this.score}`);
        this.hearts.forEach((h, i) => {
            h.setText(i < this.lives ? '\u2665' : '\u2661');
            h.setColor(i < this.lives ? '#FF4466' : '#444444');
        });
        const secs = Math.ceil(this.portalSec);
        const frac = this.portalSec / 30; // 0..1 remaining

        // Timer text — barva a velikost podle zbývajícího času
        const col = secs <= 5 ? '#FF3333' : secs <= 10 ? '#FF6600' : secs <= 20 ? '#FFB800' : '#FFD700';
        const sz  = secs <= 5 ? '22px' : secs <= 10 ? '20px' : '18px';
        this.timerTxt.setText(`${secs}s`).setFontSize(sz).setColor(col);

        // Progress bar pod časem
        this.timerBar.clear();
        const bw = 120, bh = 5, bx = this.W / 2 - bw / 2, by = 38;
        this.timerBar.fillStyle(0x222244, 0.8);
        this.timerBar.fillRoundedRect(bx, by, bw, bh, 2);
        const barCol = secs <= 5 ? 0xFF3333 : secs <= 10 ? 0xFF6600 : secs <= 20 ? 0xFFB800 : 0xFFD700;
        this.timerBar.fillStyle(barCol, 1);
        this.timerBar.fillRoundedRect(bx, by, Math.max(4, bw * frac), bh, 2);
    }

    // ═══ VSTUP ════════════════════════════════════════════════════════════════
    _buildInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd    = this.input.keyboard.addKeys('A,D');

        this._touches = new Map();
        this.input.addPointer(3);

        const syncDir = () => {
            if (this._touches.size === 0) { this.touchDir = 0; return; }
            const lastX = [...this._touches.values()].at(-1);
            this.touchDir = lastX < this.player.x ? -1 : 1;
        };

        this.input.on('pointerdown', p => { this._touches.set(p.id, p.x); syncDir(); });
        this.input.on('pointermove', p => { if (this._touches.has(p.id)) { this._touches.set(p.id, p.x); syncDir(); } });
        this.input.on('pointerup',   p => { this._touches.delete(p.id); syncDir(); });
        this.input.on('gameout',     () => { this._touches.clear(); this.touchDir = 0; });

        this.input.keyboard.on('keydown', e => {
            if (e.code === 'Escape') this._togglePause();
        });
    }

    _togglePause() {
        if (this.isLeaving) return;
        this.isPaused ? this._resume() : this._pause();
    }

    _pause() {
        this.isPaused = true;
        this.time.timeScale = 0;
        this.tweens.timeScale = 0;
        this._touches.clear();
        this.touchDir = 0;

        const div = document.createElement('div');
        div.style.cssText = `
            position:fixed; inset:0; display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            background:rgba(0,0,20,0.85); z-index:9999;
        `;
        div.innerHTML = `
            <div style="
                background:linear-gradient(160deg,#0a0a1e,#050510);
                border:3px solid #FFD700; border-radius:18px;
                padding:32px 28px 24px; text-align:center;
                width:min(300px,82vw); box-sizing:border-box;
                box-shadow:0 0 40px rgba(255,215,0,0.18),0 8px 32px rgba(0,0,0,0.8);
            ">
                <div style="font-size:34px;margin-bottom:8px">⏸</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:14px;color:#FFD700;margin-bottom:6px;
                    text-shadow:0 0 12px rgba(255,215,0,0.4)">PAUSED</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#88AAFF;margin-bottom:24px">PORTAL WORLD</div>
                <button id="portalResume" style="
                    width:100%;padding:14px 0;margin-bottom:10px;
                    font-family:'Press Start 2P',monospace;font-size:11px;
                    background:linear-gradient(180deg,#4CAF50,#2e7d32);
                    color:#fff;border:2px solid #FFD700;border-radius:10px;
                    cursor:pointer;letter-spacing:1px;
                    box-shadow:0 4px 0 #1b5e20,0 0 16px rgba(76,175,80,0.3);
                ">▶ RESUME</button>
                <button id="portalMenu" style="
                    width:100%;padding:12px 0;
                    font-family:'Press Start 2P',monospace;font-size:10px;
                    background:transparent;color:#888;
                    border:2px solid #555;border-radius:10px;cursor:pointer;
                ">MENU</button>
            </div>
        `;
        document.body.appendChild(div);
        this._pauseDiv = div;

        document.getElementById('portalResume').addEventListener('click', () => this._resume());
        document.getElementById('portalMenu').addEventListener('click', () => {
            this._removePauseDiv();
            this.scene.start('MenuScene');
        });
    }

    _resume() {
        this.isPaused = false;
        this.time.timeScale = 1;
        this.tweens.timeScale = 1;
        this._removePauseDiv();
    }

    _removePauseDiv() {
        if (this._pauseDiv?.parentNode) {
            this._pauseDiv.parentNode.removeChild(this._pauseDiv);
            this._pauseDiv = null;
        }
    }

    // ═══ EFEKTY PŘECHODU ══════════════════════════════════════════════════════
    _playEntry() {
        this.cameras.main.flash(500, 0, 180, 255, false);
        this.player.setScale(0);
        this.tweens.add({ targets: this.player, scaleX: 1.3, scaleY: 1.3, duration: 500, ease: 'Back.Out' });

        // Tmavé pozadí za výzvou
        const ov = this.add.graphics().setDepth(29).setAlpha(0);
        ov.fillStyle(0x000022, 0.78);
        ov.fillRoundedRect(this.W / 2 - 168, this.H / 2 - 72, 336, 144, 16);
        this.tweens.add({ targets: ov, alpha: 1, duration: 280, yoyo: true, hold: 1550, onComplete: () => ov.destroy() });

        const txt = this.add.text(this.W / 2, this.H / 2 - 22, '⚠ WARNING! ⚠', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '15px',
            fill: '#FFD700', stroke: '#000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        const txt2 = this.add.text(this.W / 2, this.H / 2 + 24, 'DODGE THE\nFALLING OBJECTS!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px',
            fill: '#00EEFF', stroke: '#000033', strokeThickness: 3, align: 'center', lineSpacing: 6
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        this.tweens.chain({ targets: txt, tweens: [
            { alpha: 1, scaleX: 1.08, scaleY: 1.08, duration: 300, ease: 'Back.Out' },
            { alpha: 0, y: txt.y - 40, delay: 1500, duration: 380, onComplete: () => txt.destroy() }
        ]});
        this.tweens.chain({ targets: txt2, tweens: [
            { alpha: 1, duration: 350, delay: 100 },
            { alpha: 0, y: txt2.y - 40, delay: 1400, duration: 380, onComplete: () => txt2.destroy() }
        ]});
    }

    _playExit(onDone) {
        this._sound('exit');
        this.cameras.main.flash(600, 0, 180, 255, false);

        const txt = this.add.text(this.W / 2, this.H / 2, 'RETURN!', {
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
        this._spawnSingle();
        // Při skóre > 5: šance na druhý záchod
        if (this.score > 5 && Math.random() < 0.35) this._spawnSingle();
        // Při skóre > 12: šance na třetí záchod
        if (this.score > 12 && Math.random() < 0.20) this._spawnSingle();
    }

    _spawnSingle() {
        // Záchody padají shora rovně — žádná rotace, žádný wobble
        // Spawn pokrývá celou šířku včetně krajů (žádný edge exploit)
        const img = this.add.image(Phaser.Math.Between(20, this.W - 20), -55, this.itemKey)
            .setScale(0).setDepth(7);
        img.vy     = this.dropSpeed + Phaser.Math.Between(0, 70);
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
                buttCount:  this.sharedButt,
                boostSec:   this.boostSec
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
        if (this.isPaused || this.isLeaving) return;

        // Odpočet portálu
        this.portalSec -= dt;
        if (this.portalSec <= 0) { this._leave(); return; }

        // Pohyb hráče
        const spd = this.charKey === 'soap' ? 650 : 560;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -spd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  spd;
        if (!vx && this.touchDir) vx = this.touchDir * spd;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);

        // Scrolling hvězd (iluzivní pohyb nahoru)
        this.stars1.tilePositionY -= 0.55;
        this.stars2.tilePositionY -= 1.4;

        // Štít vizuál
        this.shieldGfx.clear();
        if (this.shield) {
            this.shieldPulse += 3.5 * dt;
            const alpha = 0.4 + Math.sin(this.shieldPulse) * 0.35;
            this.shieldGfx.lineStyle(5, 0x00BFFF, alpha);
            this.shieldGfx.strokeCircle(this.player.x, this.player.y, 42);
        }

        // Spawn hovínek
        this.poopCd -= dt;
        if (this.poopCd <= 0) { this._spawnPoop(); this.poopCd = this.poopInt; }

        // HUD
        this._hudUpdate();

        // Kolize a vyhnutí
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const p = this.poops[i];
            p.y += p.vy * dt;

            // Zásah hráče (hovínko je centrované)
            if (Math.abs(p.x - this.player.x) < 32 && Math.abs(p.y - this.player.y) < 34) {
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
                const hit = this.add.text(this.player.x, this.player.y - 50, 'OUCH!', {
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

            // Záchod minul hovínko → +1 bod
            if (!p.passed && p.y > this.player.y + 50) {
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

    shutdown() { this._removePauseDiv(); }
}
