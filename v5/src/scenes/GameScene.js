class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.W = this.scale.width;
        this.H = this.scale.height;

        // ── Herní stav ────────────────────────────────────────────────────────
        this.score     = 0;
        this.lives     = 3;
        this.level     = 1;
        this.isOver        = false;
        this.goDelay       = 0;
        this.enteringPortal = false;

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

        this.isPaused  = false;
        this._pauseDiv = null;

        // Nasbírané zadky
        this.buttCount = 0;

        // Nastavení postavy a padajícího předmětu
        const cfg = JSON.parse(localStorage.getItem('mc_hovinko_settings') || '{}');
        const validChars      = ['toilet_char', 'bucket', 'broom', 'soap', 'shovel'];
        const validPortalItems = ['toilet', 'toilet_paper', 'toilet_brush'];
        this.charKey      = validChars.includes(cfg.char)             ? cfg.char        : 'toilet_char';
        this.itemKey      = 'poop'; // hlavní hra vždy hovínko
        this.portalItemKey = validPortalItems.includes(cfg.portalItem) ? cfg.portalItem : 'toilet';

        // Objekty
        this.poops    = [];
        this.powerups = [];

        this._buildBg();
        this._initWeather();
        this._buildPlayer();
        this._buildFx();
        this._buildHUD();
        this._buildInput();
        this._audioCtx = null;
        this._fartBuffer = null;
        this._fartAudioFallback = new Audio('/v5/src/apebble-fart-5-228245_edit.mp3');
        fetch('/v5/src/apebble-fart-5-228245_edit.mp3')
            .then(r => r.arrayBuffer())
            .then(buf => {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                this._audioCtx = ctx;
                return ctx.decodeAudioData(buf);
            })
            .then(decoded => { this._fartBuffer = decoded; })
            .catch(() => {});

        // Poslouchej návrat z portálového světa
        this.events.on('resume', (sys, data) => {
            if (data && data.fromPortal) {
                this.score          = data.score;
                this.lives          = data.lives;
                this.buttCount      = data.buttCount || 0;
                this.shield         = data.shield    || false;
                this.starSec        = data.starSec   || 0;
                this.boostSec       = data.boostSec  || 0;
                this.isOver         = false;
                this.enteringPortal = false;
                // Obnov hráče (byl zmenšen na 0 při vstupu do portálu)
                this.player.setScale(1.3).setAlpha(1);
                // Smažeme hovínka co spadla během portálu
                this.poops.forEach(p => p.destroy()); this.poops = [];
                this._hudUpdate();
                // Flash přechodu zpět
                this.cameras.main.flash(500, 0, 180, 255, false);
            }
        });
    }

    // ═══ POZADÍ ═══════════════════════════════════════════════════════════════
    _buildBg() {
        // Obloha
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, this.W, this.H);

        // Slunce
        this.sun = this.add.image(75, 65, 'sun').setScale(1.2).setDepth(1);

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
        this.player = this.add.sprite(this.W / 2, this.H - 103, this.charKey)
            .setScale(1.3).setDepth(6);
        this.player.anims.play(`${this.charKey}_idle`);
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
        this.add.text(13, 17, 'Score:', labelStyle).setDepth(20);
        this.scoreTxt = this.add.text(108, 17, '0', labelStyle).setDepth(20);

        // Životy — max 5, plain unicode ♥/♡
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.text(this.W - 18 - i * 24, 17, '\u2665', { ...labelStyle, fontSize: '11px', fill: '#FF3B3B' }).setDepth(20)
            );
        }

        // Level
        this.levelTxt = this.add.text(this.W / 2, 16, '', { ...labelStyle, fontSize: '10px', fill: '#FF7043' })
            .setOrigin(0.5, 0).setDepth(20);

        // Power-up
        this.puTxt = this.add.text(this.W / 2, 54, '', { ...labelStyle, fontSize: '11px', fill: '#fff' })
            .setOrigin(0.5, 0).setAlpha(0).setDepth(20);

        // Pause button — vpravo nahoře pod srdíčky
        const pauseBtn = this.add.text(this.W - 12, 38, '⏸', {
            fontSize: '30px', fill: '#FFD700', stroke: '#000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(25).setInteractive();
        pauseBtn.on('pointerdown', () => this._togglePause());

        // Butt inventář — vlevo dole nad zemí, klikatelný
        this.buttIcon = this.add.image(38, this.H / 2, 'powerup_butt')
            .setScale(0.9).setAlpha(0).setDepth(20).setInteractive();
        this.buttCountTxt = this.add.text(64, this.H / 2 - 10, '', { ...labelStyle, fontSize: '14px', fill: '#FFAA88' })
            .setAlpha(0).setDepth(20);
        this.buttIcon.on('pointerdown', () => this._useFart());
    }

    _hudUpdate() {
        this.scoreTxt.setText(`${this.score}`);
        this.hearts.forEach((h, i) => {
            h.setText(i < this.lives ? '\u2665' : '\u2661');
            h.setColor(i < this.lives ? '#FF3B3B' : '#888888');
        });
        if (this.level > 1) this.levelTxt.setText(`LVL ${this.level}`);

        if (this.shield) {
            this.puTxt.setText('SHIELD ACTIVE').setColor('#00BFFF').setAlpha(1);
        } else if (this.starSec > 0) {
            this.puTxt.setText(`2x POINTS (${Math.ceil(this.starSec)}s)`).setColor('#FFD700').setAlpha(1);
        } else {
            this.puTxt.setAlpha(0);
        }

        // Butt indikátor
        const hasBut = this.buttCount > 0;
        this.buttIcon.setAlpha(hasBut ? 1 : 0);
        this.buttCountTxt.setText(hasBut ? `x${this.buttCount}` : '').setAlpha(hasBut ? 1 : 0);
    }

    // ═══ VSTUP ════════════════════════════════════════════════════════════════
    _buildInput() {
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.wasd     = this.input.keyboard.addKeys('A,D');
        this.touchDir = 0;
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
            if (e.code === 'Space')  this._useFart();
            if (e.code === 'Escape') this._togglePause();
        });
    }

    _togglePause() {
        if (this.isOver || this.enteringPortal) return;
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
            background:rgba(0,0,0,0.78); z-index:9999;
        `;
        div.innerHTML = `
            <div style="
                background:linear-gradient(160deg,#1a1a2e,#111118);
                border:3px solid #FFD700; border-radius:18px;
                padding:32px 28px 24px; text-align:center;
                width:min(300px,82vw); box-sizing:border-box;
                box-shadow:0 0 40px rgba(255,215,0,0.18),0 8px 32px rgba(0,0,0,0.7);
            ">
                <div style="font-size:34px;margin-bottom:8px">⏸</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:14px;color:#FFD700;margin-bottom:24px;
                    text-shadow:0 0 12px rgba(255,215,0,0.4)">PAUSED</div>
                <button id="pauseResume" style="
                    width:100%;padding:14px 0;margin-bottom:10px;
                    font-family:'Press Start 2P',monospace;font-size:11px;
                    background:linear-gradient(180deg,#4CAF50,#2e7d32);
                    color:#fff;border:2px solid #FFD700;border-radius:10px;
                    cursor:pointer;letter-spacing:1px;
                    box-shadow:0 4px 0 #1b5e20,0 0 16px rgba(76,175,80,0.3);
                ">▶ RESUME</button>
                <button id="pauseMenu" style="
                    width:100%;padding:12px 0;
                    font-family:'Press Start 2P',monospace;font-size:10px;
                    background:transparent;color:#888;
                    border:2px solid #555;border-radius:10px;cursor:pointer;
                ">MENU</button>
            </div>
        `;
        document.body.appendChild(div);
        this._pauseDiv = div;

        document.getElementById('pauseResume').addEventListener('click', () => this._resume());
        document.getElementById('pauseMenu').addEventListener('click', () => {
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

    _useFart() {
        if (this.buttCount <= 0 || this.isOver) return;
        this.buttCount--;
        this._hudUpdate();
        this._fartEffect();
    }

    _activateBoost() {
        this.boostSec = 3.5;
        this._sound('boost');
    }

    // ═══ SPAWN ════════════════════════════════════════════════════════════════
    _spawnPoop() {
        const img = this.add.image(Phaser.Math.Between(40, this.W - 40), -42, this.itemKey)
            .setScale(0).setDepth(7);
        img.vy     = this.dropSpeed + Phaser.Math.Between(0, 55);
        img.vr     = Phaser.Math.FloatBetween(-1.8, 1.8);
        img.wobble = Math.random() * Math.PI * 2;
        this.poops.push(img);
        this.tweens.add({ targets: img, scale: 1, duration: 200, ease: 'Back.Out' });
    }

    _spawnPowerup() {
        const roll = Math.random();
        const type = roll < 0.20 ? 'shield' : roll < 0.38 ? 'star' : roll < 0.62 ? 'butt' : roll < 0.80 ? 'heart' : 'portal';
        const x    = Phaser.Math.Between(55, this.W - 55);
        const img  = this.add.image(x, -55, `powerup_${type}`).setScale(0).setDepth(7);
        img.vy     = 62 + Math.random() * 22;
        img.type   = type;
        this.powerups.push(img);

        // Pop-in (pouze scale — žádná animace y!)
        this.tweens.add({ targets: img, scale: 1.15, duration: 400, ease: 'Back.Out' });

        // Blikající upozornění nahoře
        const labels = { shield: 'SHIELD!', star: '2x POINTS!', butt: 'FART INCOMING!', heart: '+1 LIFE!', portal: 'PORTAL!' };
        const colors = { shield: '#00BFFF', star: '#FFD700', butt: '#FFAA88', heart: '#FF3B3B', portal: '#00CFFF' };
        const label = labels[type], color = colors[type];
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
            this._showMsg('SHIELD!', '#00BFFF', x, y);
        } else if (type === 'star') {
            this.starSec = 8;
            this._showMsg('2x POINTS!', '#FFD700', x, y);
        } else if (type === 'heart') {
            this.lives = Math.min(this.lives + 1, 5);
            this._showMsg('+1 LIFE!', '#FF3B3B', x, y);
        } else if (type === 'butt') {
            this.buttCount++;
            this._showMsg('FART +1!', '#FFAA88', x, y);
        } else {
            this._enterPortal();
        }
        this._hudUpdate();
    }

    _fartEffect() {
        const px = this.player.x, py = this.player.y - 20;
        const wasFlipped = this.player.flipX;

        // Steve se otočí zády
        this.player.setFlipX(!wasFlipped);

        // MP3 fart zvuk — přes AudioContext aby nekonkuroval oscillátor zvukům
        try {
            if (this._fartBuffer && this._audioCtx) {
                if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
                const src = this._audioCtx.createBufferSource();
                src.buffer = this._fartBuffer;
                src.connect(this._audioCtx.destination);
                src.start();
            } else {
                this._fartAudioFallback.currentTime = 0;
                this._fartAudioFallback.play().catch(() => {});
            }
        } catch(e) {}

        this._showMsg('PRRRR!', '#90EE90', px, py - 30);

        // Výtr — 7 vln zelených koulí letících do strany s rostoucím rozptylem
        const dir = wasFlipped ? 1 : -1;
        for (let i = 0; i < 7; i++) {
            const delay = i * 160;
            const gfx = this.add.graphics().setDepth(15);
            // Každá vlna má lehce jiný offset ve výšce
            const yOff = (i % 3 - 1) * 14;
            this.tweens.add({
                targets: { r: 8, ax: 0, alpha: 0.75 },
                r: 52 + i * 6, ax: 110 + i * 12, alpha: 0,
                delay, duration: 900 + i * 60,
                ease: 'Sine.Out',
                onUpdate: (tw, obj) => {
                    gfx.clear();
                    gfx.fillStyle(0x90EE90, obj.alpha);
                    gfx.fillCircle(px + dir * (28 + obj.ax), py + 18 + yOff, obj.r);
                },
                onComplete: () => gfx.destroy()
            });
        }

        // Všechna hovínka odlítí nahoru
        this.poops.forEach(p => { p.vy = -440; p.vr *= -1; });

        // Po 800ms se Steve otočí zpět
        this.tweens.add({ targets: this.player, alpha: 1, delay: 800, duration: 1,
            onComplete: () => this.player.setFlipX(wasFlipped) });
    }

    _enterPortal() {
        if (this.isOver || this.enteringPortal) return;
        this.enteringPortal = true;

        this._showMsg('PORTAL!', '#00CFFF', this.W / 2, this.H / 2 - 60); // EN already
        this.cameras.main.flash(600, 0, 180, 255, false);

        // Tweeny pro efekt — po 700ms přepni scénu
        this.tweens.add({
            targets: this.player, scaleX: 0, scaleY: 0,
            duration: 600, ease: 'Power2',
            onComplete: () => {
                this.scene.launch('PortalWorldScene', {
                    score:      this.score,
                    lives:      this.lives,
                    charKey:    this.charKey,
                    itemKey:    this.portalItemKey,
                    shield:     this.shield,
                    starSec:    this.starSec,
                    buttCount:  this.buttCount,
                    boostSec:   this.boostSec,
                    level:      this.level,
                    dropSpeed:  this.dropSpeed,
                    poopInt:    this.poopInt
                });
                this.scene.pause('GameScene');
            }
        });
    }

    _miss() {
        if (this.shield) {
            // Štít absorbuje zásah
            this.shield = false;
            this.cameras.main.flash(220, 0, 191, 255, false);
            this._sound('shieldBreak');
            this._showMsg('SHIELD BROKEN!', '#00BFFF', this.W / 2, this.H / 2 - 50);
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
            `LEVEL ${this.level}\nFASTER! 🚀`, {
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
        if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
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
    }

    // ═══ UPDATE ═══════════════════════════════════════════════════════════════
    update(_, delta) {
        const dt = delta / 1000;

        // ── Pauza / Game over ────────────────────────────────────────────────
        if (this.isPaused) return;
        if (this.enteringPortal) return;
        if (this.isOver) {
            this.goDelay -= dt;
            if (this.goDelay <= 0)
                this.scene.start('GameOverScene', { score: this.score });
            return;
        }

        // ── Hráč ────────────────────────────────────────────────────────────
        const spd = this.charKey === 'shovel' ? 780 : this.charKey === 'soap' ? 650 : 560;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -spd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  spd;
        if (!vx && this.touchDir) vx = this.touchDir * spd;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, this.W - 30);
        this.player.anims.play(vx ? `${this.charKey}_walk` : `${this.charKey}_idle`, true);
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
            // Velkorysý hitbox — chytání ze strany i shora
            if (Math.abs(p.x - this.player.x) < 55 && p.y > this.player.y - 95 && p.y < this.player.y + 10) {
                this._catchPoop(p); continue;
            }
            if (p.y > this.H + 50) { p.destroy(); this.poops.splice(i, 1); this._miss(); }
        }

        // ── Power-upy ────────────────────────────────────────────────────────
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y        += p.vy * dt;
            p.rotation += 1.2 * dt;     // pomalá rotace místo tweenu
            if (Math.abs(p.x - this.player.x) < 55 && p.y > this.player.y - 95 && p.y < this.player.y + 10) {
                this._catchPowerup(p); continue;
            }
            if (p.y > this.H + 60) { p.destroy(); this.powerups.splice(i, 1); }
        }

        // ── Počasí ───────────────────────────────────────────────────────────
        this._updateWeather(dt);

        // ── Parallax ─────────────────────────────────────────────────────────
        this.mtns.tilePositionX += 0.06;
        const cm = this._cloudMult;
        this.cloudsF.forEach(c => { c.x -= c.spd * cm; if (c.x < -150) c.x = this.W + 150; });
        this.cloudsN.forEach(c => { c.x -= c.spd * cm; if (c.x < -150) c.x = this.W + 150; });
    }

    // ═══ POČASÍ ═══════════════════════════════════════════════════════════════
    _initWeather() {
        const W = this.W, H = this.H;
        this._weatherType  = 'sunny';
        this._weatherTimer = 30;
        this._cloudMult    = 1;
        this._wState       = { rainAlpha: 0, windAlpha: 0 };

        // Sky darkening overlay
        this._skyOverlay = this.add.graphics().setDepth(0.5);
        this._skyOverlay.fillStyle(0x0a1428, 1);
        this._skyOverlay.fillRect(0, 0, W, H);
        this._skyOverlay.setAlpha(0);

        // Rainbow arc (pre-drawn, hidden by default)
        this._rainbowGfx = this.add.graphics().setDepth(1.5).setAlpha(0);
        const rbCX = W / 2, rbCY = H + 80;
        const rbBands = [
            [0xFF2222, 380], [0xFF8800, 357], [0xFFEE00, 334],
            [0x22CC22, 311], [0x2277FF, 288], [0x9922EE, 265]
        ];
        rbBands.forEach(([col, r]) => {
            this._rainbowGfx.lineStyle(22, col, 0.22);
            this._rainbowGfx.beginPath();
            this._rainbowGfx.arc(rbCX, rbCY, r, Math.PI, 0, false);
            this._rainbowGfx.strokePath();
        });

        // Rain particles
        this._rainGfx = this.add.graphics().setDepth(4.5);
        this._drops = Array.from({ length: 160 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            spd: 460 + Math.random() * 200
        }));

        // Wind streaks
        this._windGfx = this.add.graphics().setDepth(4.5);
        this._streaks = Array.from({ length: 80 }, () => ({
            x: Math.random() * W,
            y: 20 + Math.random() * (H - 220),
            len: 28 + Math.random() * 60,
            spd: 280 + Math.random() * 380,
            a:   0.12 + Math.random() * 0.35
        }));

        // Lightning flash overlay
        this._ltFlashGfx = this.add.graphics().setDepth(15);
        this._ltFlashGfx.fillStyle(0xffffff, 1);
        this._ltFlashGfx.fillRect(0, 0, W, H);
        this._ltFlashGfx.setAlpha(0);

        // Lightning bolt
        this._ltBoltGfx  = this.add.graphics().setDepth(14);
        this._ltTimer    = 5 + Math.random() * 7;
        this._ltPhase    = 0;   // 0=idle 1=flash 2=bolt
        this._ltTime     = 0;
        this._ltBoltPts  = [];
    }

    _changeWeather() {
        const all  = ['sunny', 'rain', 'storm', 'rainbow', 'wind'];
        const next = all.filter(t => t !== this._weatherType)[Math.floor(Math.random() * 4)];
        this._weatherType = next;

        // Cloud speed
        this._cloudMult = { sunny: 1, rain: 1.8, storm: 3, rainbow: 0.45, wind: 6 }[next] || 1;

        // Sky overlay alpha
        const ovAlpha = { sunny: 0, rain: 0.14, storm: 0.26, rainbow: 0, wind: 0.04 }[next] || 0;
        this.tweens.add({ targets: this._skyOverlay, alpha: ovAlpha, duration: 2500, ease: 'Sine.InOut' });

        // Sun
        const sunAlpha = (next === 'rain' || next === 'storm') ? 0.2 : 1;
        this.tweens.add({ targets: this.sun, alpha: sunAlpha, duration: 2000, ease: 'Sine.InOut' });

        // Rainbow
        this.tweens.add({ targets: this._rainbowGfx, alpha: next === 'rainbow' ? 0.30 : 0, duration: 2500, ease: 'Sine.InOut' });

        // Rain alpha (via wState wrapper so tween works reliably)
        const rainTarget = next === 'rain' ? 0.30 : next === 'storm' ? 0.45 : 0;
        this.tweens.add({ targets: this._wState, rainAlpha: rainTarget, duration: 2000, ease: 'Sine.InOut' });

        // Wind alpha
        this.tweens.add({ targets: this._wState, windAlpha: next === 'wind' ? 0.45 : 0, duration: 1500, ease: 'Sine.InOut' });

        // Reset lightning timer when entering storm
        if (next === 'storm') this._ltTimer = 3 + Math.random() * 5;
    }

    _updateWeather(dt) {
        // Countdown to next weather change
        this._weatherTimer -= dt;
        if (this._weatherTimer <= 0) {
            this._changeWeather();
            this._weatherTimer = 30;
        }

        const W = this.W, H = this.H;
        const ra = this._wState.rainAlpha;
        const wa = this._wState.windAlpha;

        // ── Déšť ─────────────────────────────────────────────────────────────
        this._rainGfx.clear();
        if (ra > 0.01) {
            this._rainGfx.setAlpha(ra);
            this._drops.forEach(d => {
                d.x -= 28 * dt;
                d.y += d.spd * dt;
                if (d.y > H + 12) { d.y = -12; d.x = Math.random() * W; }
                if (d.x < -6)     { d.x = W + 6; }
                this._rainGfx.lineStyle(1, 0xaacce8, 0.6);
                this._rainGfx.beginPath();
                this._rainGfx.moveTo(d.x, d.y);
                this._rainGfx.lineTo(d.x - 5, d.y - 13);
                this._rainGfx.strokePath();
            });
        }

        // ── Vítr ─────────────────────────────────────────────────────────────
        this._windGfx.clear();
        if (wa > 0.01) {
            this._windGfx.setAlpha(wa);
            this._streaks.forEach(s => {
                s.x -= s.spd * dt;
                if (s.x + s.len < 0) { s.x = W + s.len; s.y = 20 + Math.random() * (H - 220); }
                this._windGfx.lineStyle(1.5, 0xddeeff, s.a);
                this._windGfx.beginPath();
                this._windGfx.moveTo(s.x, s.y);
                this._windGfx.lineTo(s.x + s.len, s.y);
                this._windGfx.strokePath();
            });
        }

        // ── Blesk ─────────────────────────────────────────────────────────────
        if (this._weatherType === 'storm' && this._ltPhase === 0) {
            this._ltTimer -= dt;
            if (this._ltTimer <= 0) {
                // Generate bolt path once
                this._ltPhase = 1; this._ltTime = 0;
                const bx = 70 + Math.random() * (W - 140);
                this._ltBoltPts = [[bx, 0]];
                let cy = 0;
                while (cy < H * 0.68) {
                    cy += 18 + Math.random() * 28;
                    this._ltBoltPts.push([bx + (Math.random() - 0.5) * 44, cy]);
                }
                this._ltTimer = 5 + Math.random() * 9;
            }
        }

        this._ltFlashGfx.setAlpha(0);
        this._ltBoltGfx.clear();

        if (this._ltPhase === 1) {
            this._ltTime += dt;
            if (this._ltTime < 0.07)       { this._ltFlashGfx.setAlpha(0.22); }
            else if (this._ltTime < 0.12)  { this._ltFlashGfx.setAlpha(0.08); }
            else                           { this._ltPhase = 2; this._ltTime = 0; }
        }

        if (this._ltPhase === 2) {
            this._ltTime += dt;
            if (this._ltTime < 0.28) {
                const pts = this._ltBoltPts;
                // Glow
                this._ltBoltGfx.lineStyle(7, 0x88bbff, 0.14);
                this._ltBoltGfx.beginPath();
                pts.forEach((p, i) => i === 0 ? this._ltBoltGfx.moveTo(p[0], p[1]) : this._ltBoltGfx.lineTo(p[0], p[1]));
                this._ltBoltGfx.strokePath();
                // Core
                this._ltBoltGfx.lineStyle(2, 0xeef8ff, 0.60);
                this._ltBoltGfx.beginPath();
                pts.forEach((p, i) => i === 0 ? this._ltBoltGfx.moveTo(p[0], p[1]) : this._ltBoltGfx.lineTo(p[0], p[1]));
                this._ltBoltGfx.strokePath();
            } else {
                this._ltPhase = 0; this._ltTime = 0;
            }
        }
    }

    shutdown() { this._removePauseDiv(); }
}
