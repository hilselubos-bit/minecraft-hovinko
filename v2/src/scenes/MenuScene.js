class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = this.scale.width, H = this.scale.height;
        this.bgPoops = [];

        this._buildBg(W, H);
        this._buildPanel(W);
        this._buildButtons(W);
        this._buildWalkingSteve(W, H);
        this._startBgPoops(W, H);
        this._animateTitle();
    }

    // ── Background ────────────────────────────────────────────────────────────
    _buildBg(W, H) {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, W, H);

        this.add.image(75, 65, 'sun').setScale(1.1);

        // Mountains
        this.mtns = this.add.tileSprite(0, H - 222, W, 130, 'mountains')
            .setOrigin(0, 0).setAlpha(0.72);

        // Clouds
        this.clouds = [
            Object.assign(this.add.image( 90, 58, 'cloud').setAlpha(0.65).setScale(0.9), { spd: 0.10 }),
            Object.assign(this.add.image(310, 38, 'cloud').setAlpha(0.60).setScale(1.2), { spd: 0.07 }),
            Object.assign(this.add.image(180, 78, 'cloud').setAlpha(0.90).setScale(0.75),{ spd: 0.22 }),
            Object.assign(this.add.image(420, 62, 'cloud').setAlpha(0.88).setScale(1.0), { spd: 0.18 }),
        ];

        this.add.image(22,   H - 128, 'tree');
        this.add.image(W-22, H - 125, 'tree').setFlipX(true);
        this.add.image(W-68, H - 120, 'tree').setScale(0.85);
        this.add.tileSprite(0, H - 100, W, 100, 'ground').setOrigin(0, 0);
    }

    // ── Title panel ───────────────────────────────────────────────────────────
    _buildPanel(W) {
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.76);
        panel.fillRoundedRect(38, 78, W - 76, 232, 14);
        panel.lineStyle(4, 0x5a9e32, 1);
        panel.strokeRoundedRect(38, 78, W - 76, 232, 14);

        this.titleTxt = this.add.text(W / 2, 128, 'MINECRAFT', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px',
            fill: '#5a9e32', stroke: '#1b5e20', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, 165, 'Chytač Hovínek!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px',
            fill: '#FFD700', stroke: '#5D4037', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, 206, '💩💩💩', { fontSize: '32px' }).setOrigin(0.5);

        this.add.text(W / 2, 250, 'Chytej padající hovínka!\n← →  nebo  A / D', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px',
            fill: '#bbb', align: 'center', lineSpacing: 10
        }).setOrigin(0.5);

        // Power-up hints
        this.add.text(W / 2, 292, '🛡️ Štít  |  ⭐ 2× Body', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', fill: '#aaa'
        }).setOrigin(0.5);
    }

    // ── Buttons ───────────────────────────────────────────────────────────────
    _buildButtons(W) {
        this._makeBtn(W / 2, 352, '▶  HRÁT',         0x4CAF50, 0x2e7d32, () => this.scene.start('GameScene'));
        this._makeBtn(W / 2, 408, 'TABULKA VÍTĚZŮ', 0xFFC107, 0xF57F17, () => this._showBoard(W));
        this._makeBtn(W / 2, 464, 'NASTAVENÍ',       0x7B1FA2, 0x4A148C, () => this._showSettings(W));
    }

    // ── Walking Steve ─────────────────────────────────────────────────────────
    _buildWalkingSteve(W, H) {
        this.walkSteve = this.add.sprite(80, H - 130, 'steve').setScale(1.3);
        this.walkSteve.anims.play('walk');
        this._steveDir = 1;

        this.tweens.add({
            targets: this.walkSteve,
            x: W - 80,
            duration: 4500,
            ease: 'Linear',
            yoyo: true,
            repeat: -1,
            onYoyo: ()   => { this.walkSteve.setFlipX(true);  this._steveDir = -1; },
            onRepeat: ()  => { this.walkSteve.setFlipX(false); this._steveDir =  1; }
        });
    }

    // ── Background falling poops ──────────────────────────────────────────────
    _startBgPoops(W, H) {
        this.time.addEvent({
            delay: 700,
            loop: true,
            callback: () => {
                const p = this.add.image(Phaser.Math.Between(20, W - 20), -30, 'poop')
                    .setScale(Phaser.Math.FloatBetween(0.5, 0.85))
                    .setAlpha(0.35)
                    .setDepth(0.5);
                p.vy = Phaser.Math.Between(55, 110);
                p.vr = Phaser.Math.FloatBetween(-1.0, 1.0);
                this.bgPoops.push(p);
            }
        });
    }

    // ── Title pulse ───────────────────────────────────────────────────────────
    _animateTitle() {
        this.tweens.add({
            targets: this.titleTxt,
            scaleX: 1.04, scaleY: 1.04,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }

    // ── Update ────────────────────────────────────────────────────────────────
    update(time, delta) {
        const dt = delta / 1000;

        this.mtns.tilePositionX += 0.06;
        this.clouds.forEach(c => { c.x -= c.spd; if (c.x < -140) c.x = this.scale.width + 140; });

        for (let i = this.bgPoops.length - 1; i >= 0; i--) {
            const p = this.bgPoops[i];
            p.y        += p.vy * dt;
            p.rotation += p.vr * dt;
            if (p.y > this.scale.height + 50) {
                p.destroy();
                this.bgPoops.splice(i, 1);
            }
        }
    }

    // ── Leaderboard overlay ───────────────────────────────────────────────────
    _showBoard(W) {
        const H = this.scale.height;
        const board = JSON.parse(localStorage.getItem('mc_hovinko_v2') || '[]');

        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.88);
        overlay.fillRoundedRect(18, 15, W - 36, H - 30, 14);
        overlay.lineStyle(4, 0xFFD700);
        overlay.strokeRoundedRect(18, 15, W - 36, H - 30, 14);

        this.add.text(W / 2, 56, '🏆 NEJLEPŠÍ HRÁČI', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700'
        }).setOrigin(0.5).setDepth(51);

        const medals = ['🥇','🥈','🥉'];
        board.slice(0, 9).forEach((e, i) => {
            const y = 96 + i * 48, top = i < 3;
            const col = top ? ['#FFD700','#E0E0E0','#CD7F32'][i] : '#ddd';
            if (top) {
                const rb = this.add.graphics().setDepth(51);
                rb.fillStyle([0xFFD700,0xC0C0C0,0xCD7F32][i], 0.09);
                rb.fillRoundedRect(28, y - 6, W - 56, 38, 4);
            }
            this.add.text(40, y + 8, `${medals[i] ?? (i+1)+'.'} ${e.name.substring(0,11)}`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: top ? 11 : 10, fill: col
            }).setOrigin(0, 0.5).setDepth(51);
            this.add.text(W - 40, y + 8, `${e.score} 💩`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: 11, fill: '#FFD700'
            }).setOrigin(1, 0.5).setDepth(51);
        });
        if (!board.length) {
            this.add.text(W / 2, H / 2, 'Zatím žádné záznamy!\n🎮', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '11px', fill: '#aaa', align: 'center'
            }).setOrigin(0.5).setDepth(51);
        }

        this._makeBtn(W / 2, H - 52, '◀ ZPĚT', 0x4CAF50, 0x2e7d32, () => this.scene.restart(), 51);
    }

    // ── Nastavení overlay ─────────────────────────────────────────────────────
    _showSettings(W) {
        const H = this.scale.height;
        const s = JSON.parse(localStorage.getItem('mc_hovinko_settings') || '{"char":"steve","item":"poop"}');
        const D = 100;
        const track = [];
        const T = (o) => { track.push(o); return o; };
        const close = () => track.forEach(o => { try { o.destroy(); } catch(e){} });

        // Podklad
        const ov = T(this.add.graphics().setDepth(D));
        ov.fillStyle(0x000000, 0.93); ov.fillRoundedRect(18, 10, W - 36, H - 20, 14);
        ov.lineStyle(4, 0xCC88FF);    ov.strokeRoundedRect(18, 10, W - 36, H - 20, 14);

        T(this.add.text(W / 2, 50, 'NASTAVENÍ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '14px', fill: '#CC88FF'
        }).setOrigin(0.5).setDepth(D + 1));

        // ── Postavy ──────────────────────────────────────────────────────────
        T(this.add.text(32, 94, 'POSTAVA:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#aaa'
        }).setOrigin(0, 0.5).setDepth(D + 1));

        [{ key: 'steve', label: 'STEVE' }, { key: 'skeleton', label: 'KOSTLIVEC' }, { key: 'creeper', label: 'CREEPER' }]
        .forEach((ch, i) => {
            const bx = 102 + i * 138, by = 180;
            const sel = s.char === ch.key;
            const box = T(this.add.graphics().setDepth(D + 1));
            box.fillStyle(sel ? 0x4A148C : 0x1a1a1a, 1);
            box.fillRoundedRect(bx - 52, by - 62, 104, 116, 8);
            box.lineStyle(3, sel ? 0xCC88FF : 0x444444, 1);
            box.strokeRoundedRect(bx - 52, by - 62, 104, 116, 8);
            box.setInteractive(new Phaser.Geom.Rectangle(bx - 52, by - 62, 104, 116), Phaser.Geom.Rectangle.Contains);
            box.on('pointerdown', () => {
                s.char = ch.key; localStorage.setItem('mc_hovinko_settings', JSON.stringify(s));
                close(); this._showSettings(W);
            });
            T(this.add.image(bx, by - 8, ch.key, 0).setScale(1.05).setDepth(D + 2));
            T(this.add.text(bx, by + 46, ch.label, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '7px',
                fill: sel ? '#CC88FF' : '#777'
            }).setOrigin(0.5).setDepth(D + 2));
        });

        // ── Padající předměty ─────────────────────────────────────────────────
        T(this.add.text(32, 318, 'CO PADA:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#aaa'
        }).setOrigin(0, 0.5).setDepth(D + 1));

        [{ key: 'poop', label: 'HOVINKO' }, { key: 'toilet', label: 'ZACHOD' }, { key: 'toilet_paper', label: 'TL.PAPIR' }]
        .forEach((it, i) => {
            const bx = 102 + i * 138, by = 415;
            const sel = s.item === it.key;
            const box = T(this.add.graphics().setDepth(D + 1));
            box.fillStyle(sel ? 0x1A237E : 0x1a1a1a, 1);
            box.fillRoundedRect(bx - 52, by - 72, 104, 120, 8);
            box.lineStyle(3, sel ? 0x7986CB : 0x444444, 1);
            box.strokeRoundedRect(bx - 52, by - 72, 104, 120, 8);
            box.setInteractive(new Phaser.Geom.Rectangle(bx - 52, by - 72, 104, 120), Phaser.Geom.Rectangle.Contains);
            box.on('pointerdown', () => {
                s.item = it.key; localStorage.setItem('mc_hovinko_settings', JSON.stringify(s));
                close(); this._showSettings(W);
            });
            T(this.add.image(bx, by - 12, it.key).setScale(0.78).setDepth(D + 2));
            T(this.add.text(bx, by + 44, it.label, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '7px',
                fill: sel ? '#7986CB' : '#777'
            }).setOrigin(0.5).setDepth(D + 2));
        });

        // ── Zpět ─────────────────────────────────────────────────────────────
        const btnX = W / 2, btnY = H - 38, bW = 170, bH = 40;
        const btn = T(this.add.graphics().setDepth(D + 1));
        btn.fillStyle(0x444444, 1); btn.fillRoundedRect(btnX - bW/2, btnY - bH/2, bW, bH, 10);
        btn.lineStyle(3, 0x222222);  btn.strokeRoundedRect(btnX - bW/2, btnY - bH/2, bW, bH, 10);
        btn.setInteractive(new Phaser.Geom.Rectangle(btnX - bW/2, btnY - bH/2, bW, bH), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', close);
        T(this.add.text(btnX, btnY, '< ZPET', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px', fill: '#fff'
        }).setOrigin(0.5).setDepth(D + 2));
    }

    _makeBtn(x, y, label, fill, border, cb, depth = 0) {
        const bW = 192, bH = 46;
        const bg = this.add.graphics().setDepth(depth);
        bg.fillStyle(fill, 1);   bg.fillRoundedRect(x-bW/2, y-bH/2, bW, bH, 10);
        bg.lineStyle(3, border); bg.strokeRoundedRect(x-bW/2, y-bH/2, bW, bH, 10);
        bg.fillStyle(0xffffff, 0.22); bg.fillRoundedRect(x-bW/2+4, y-bH/2+4, bW-8, bH/2-4, 6);
        bg.setInteractive(new Phaser.Geom.Rectangle(x-bW/2, y-bH/2, bW, bH), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerover', () => bg.setAlpha(0.82));
        bg.on('pointerout',  () => bg.setAlpha(1));
        bg.on('pointerdown', cb);
        this.add.text(x, y, label, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px',
            fill: '#fff', stroke: 'rgba(0,0,0,0.4)', strokeThickness: 2
        }).setOrigin(0.5).setDepth(depth + 1);
    }
}
