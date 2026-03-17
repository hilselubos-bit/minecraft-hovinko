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

        this.mtns = this.add.tileSprite(0, H - 222, W, 130, 'mountains')
            .setOrigin(0, 0).setAlpha(0.72);

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
        panel.fillRoundedRect(38, 78, W - 76, 175, 14);
        panel.lineStyle(4, 0x5a9e32, 1);
        panel.strokeRoundedRect(38, 78, W - 76, 175, 14);

        this.titleTxt = this.add.text(W / 2, 115, 'MyPoops', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px',
            fill: '#5a9e32', stroke: '#1b5e20', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, 163, 'Catch the falling poop!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px',
            fill: '#FFD700', stroke: '#5D4037', strokeThickness: 3
        }).setOrigin(0.5);

        // Powerup hints — ikony + popisky
        const puRow = [
            { key: 'powerup_shield', label: 'SHIELD' },
            { key: 'powerup_star',   label: '2x PTS' },
            { key: 'powerup_butt',   label: 'FART'   },
            { key: 'powerup_heart',  label: '+LIFE'  },
            { key: 'powerup_portal', label: 'PORTAL' },
        ];
        const step = (W - 60) / 5;
        puRow.forEach((pu, i) => {
            const x = 30 + step * i + step / 2;
            this.add.image(x, 210, pu.key).setScale(0.60).setDepth(1);
            this.add.text(x, 238, pu.label, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '7px', fill: '#cccccc'
            }).setOrigin(0.5).setDepth(1);
        });
    }

    // ── Buttons ───────────────────────────────────────────────────────────────
    _buildButtons(W) {
        this._makeBtn(W / 2, 352, 'PLAY',         0x4CAF50, 0x2e7d32, () => this.scene.start('GameScene'));
        this._makeBtn(W / 2, 408, 'LEADERBOARD', 0xFFC107, 0xF57F17, () => this._showBoard(W));
        this._makeBtn(W / 2, 464, 'SETTINGS',    0x7B1FA2, 0x4A148C, () => this._showSettings(W));
    }

    // ── Walking Steve ─────────────────────────────────────────────────────────
    _buildWalkingSteve(W, H) {
        const cfg = JSON.parse(localStorage.getItem('mc_hovinko_settings') || '{}');
        const validChars = ['toilet_char', 'bucket', 'broom', 'soap', 'shovel'];
        const charKey = validChars.includes(cfg.char) ? cfg.char : 'toilet_char';
        this.walkSteve = this.add.sprite(80, H - 130, charKey).setScale(1.3);
        this.walkSteve.anims.play(`${charKey}_walk`);

        this.tweens.add({
            targets: this.walkSteve, x: W - 80, duration: 4500,
            ease: 'Linear', yoyo: true, repeat: -1,
            onYoyo:   () => this.walkSteve.setFlipX(true),
            onRepeat: () => this.walkSteve.setFlipX(false)
        });
    }

    // ── Background falling poops ──────────────────────────────────────────────
    _startBgPoops(W, H) {
        this.time.addEvent({
            delay: 700, loop: true,
            callback: () => {
                const p = this.add.image(Phaser.Math.Between(20, W - 20), -30, 'poop')
                    .setScale(Phaser.Math.FloatBetween(0.5, 0.85)).setAlpha(0.35).setDepth(0.5);
                p.vy = Phaser.Math.Between(55, 110);
                p.vr = Phaser.Math.FloatBetween(-1.0, 1.0);
                this.bgPoops.push(p);
            }
        });
    }

    // ── Title pulse ───────────────────────────────────────────────────────────
    _animateTitle() {
        this.tweens.add({
            targets: this.titleTxt, scaleX: 1.04, scaleY: 1.04,
            duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut'
        });
    }

    // ── Update ────────────────────────────────────────────────────────────────
    update(_, delta) {
        const dt = delta / 1000;
        this.mtns.tilePositionX += 0.06;
        this.clouds.forEach(c => { c.x -= c.spd; if (c.x < -140) c.x = this.scale.width + 140; });
        for (let i = this.bgPoops.length - 1; i >= 0; i--) {
            const p = this.bgPoops[i];
            p.y += p.vy * dt; p.rotation += p.vr * dt;
            if (p.y > this.scale.height + 50) { p.destroy(); this.bgPoops.splice(i, 1); }
        }
    }

    // ── Leaderboard overlay ───────────────────────────────────────────────────
    _removeBoardDiv() {
        ['_boardDiv', '_boardScrollDiv'].forEach(key => {
            if (this[key]?.parentNode) { this[key].parentNode.removeChild(this[key]); this[key] = null; }
        });
    }

    _showBoard(W) {
        const H = this.scale.height;
        const tracked = [];
        const T = o => { tracked.push(o); return o; };
        let closed = false;

        this.input.setTopOnly(true);

        const close = () => {
            if (closed) return;
            closed = true;
            this.input.setTopOnly(false);
            tracked.forEach(o => { try { o.destroy(); } catch(e){} });
            this._removeBoardDiv();
            this.scene.restart();
        };

        const overlay = T(this.add.graphics().setDepth(50));
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRoundedRect(18, 15, W - 36, H - 30, 14);
        overlay.lineStyle(4, 0xFFD700);
        overlay.strokeRoundedRect(18, 15, W - 36, H - 30, 14);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(18, 15, W - 36, H - 30),
            Phaser.Geom.Rectangle.Contains
        );

        T(this.add.text(W / 2, 48, 'TOP PLAYERS', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700'
        }).setOrigin(0.5).setDepth(51));

        const canvas = this.game.canvas;
        const rect   = canvas.getBoundingClientRect();
        const sx = rect.width  / W;
        const sy = rect.height / H;

        // ── Tabs ──────────────────────────────────────────────────────────────
        let activeTab = 'global';
        let globalData = null;
        const localData = JSON.parse(localStorage.getItem('mc_hovinko_v2') || '[]');

        const tabsDiv = document.createElement('div');
        tabsDiv.style.cssText = `
            position:fixed;
            left:${rect.left + 26 * sx}px;
            top:${rect.top + 64 * sy}px;
            width:${(W - 52) * sx}px;
            display:flex; gap:6px; z-index:201;
        `;
        const tabStyle = (active) => `
            flex:1; padding:8px 0; cursor:pointer;
            font-family:'Press Start 2P',monospace; font-size:8px;
            border-radius:8px; text-align:center; border:none;
            background:${active ? '#FFD700' : 'rgba(255,215,0,0.08)'};
            color:${active ? '#111' : '#FFD700'};
            border:2px solid ${active ? '#FFD700' : 'rgba(255,215,0,0.3)'};
        `;
        tabsDiv.innerHTML = `
            <button id="tabGlobal" style="${tabStyle(true)}">🌍 GLOBAL</button>
            <button id="tabLocal"  style="${tabStyle(false)}">⭐ MY BEST</button>
        `;
        if (!closed) document.body.appendChild(tabsDiv);
        this._boardDiv = tabsDiv;

        // ── Scroll list ───────────────────────────────────────────────────────
        this._boardScrollDiv = document.createElement('div');
        const scrollDiv = this._boardScrollDiv;
        scrollDiv.style.cssText = `
            position:fixed;
            left:${rect.left + 26 * sx}px;
            top:${rect.top + 102 * sy}px;
            width:${(W - 52) * sx}px;
            height:${(H - 102 - 68) * sy}px;
            overflow-y:auto; -webkit-overflow-scrolling:touch;
            z-index:200; scrollbar-width:thin; scrollbar-color:#FFD700 #111;
        `;
        if (!closed) document.body.appendChild(scrollDiv);

        const renderRows = (board) => {
            scrollDiv.innerHTML = '';
            if (!board.length) {
                scrollDiv.innerHTML = `<div style="text-align:center;color:#aaa;font-family:'Press Start 2P',monospace;font-size:9px;padding:40px 0">No records yet!</div>`;
                return;
            }
            const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
            board.forEach((e, i) => {
                const top3 = i < 3;
                const col  = top3 ? ['#FFD700','#E0E0E0','#CD7F32'][i] : '#ccc';
                const bg   = top3 ? ['rgba(255,215,0,0.09)','rgba(192,192,192,0.09)','rgba(205,127,50,0.09)'][i] : 'transparent';
                const row  = document.createElement('div');
                row.style.cssText = `
                    display:flex; justify-content:space-between; align-items:center;
                    padding:${top3 ? 9 : 7}px 8px; margin-bottom:2px;
                    background:${bg}; border-radius:4px;
                    font-family:'Press Start 2P',monospace;
                    font-size:${top3 ? 10 : 9}px; color:${col};
                    ${top3 ? `border-left:3px solid ${col};` : ''}
                `;
                row.innerHTML = `<span>${i < 3 ? medals[i] : `${i+1}.`} ${e.name.substring(0,12)}</span><span style="color:#FFD700">${e.score} \uD83D\uDCA9</span>`;
                scrollDiv.appendChild(row);
            });
        };

        const personalBest = parseInt(localStorage.getItem('mc_best_score') || '0', 10);
        const switchTab = (tab) => {
            activeTab = tab;
            document.getElementById('tabGlobal').style.cssText = tabStyle(tab === 'global');
            document.getElementById('tabLocal').style.cssText  = tabStyle(tab === 'local');
            if (tab === 'global') {
                if (globalData) {
                    renderRows(globalData);
                } else {
                    scrollDiv.innerHTML = `<div style="text-align:center;color:#aaa;font-family:'Press Start 2P',monospace;font-size:9px;padding:40px 0">Loading...</div>`;
                }
            } else {
                scrollDiv.innerHTML = '';
                if (personalBest > 0) {
                    const pb = document.createElement('div');
                    pb.style.cssText = `
                        text-align:center; padding:10px 8px; margin-bottom:10px;
                        font-family:'Press Start 2P',monospace; font-size:9px;
                        background:rgba(255,215,0,0.1); border-radius:8px;
                        border:2px solid rgba(255,215,0,0.4); color:#FFD700;
                    `;
                    pb.innerHTML = `🏅 PERSONAL BEST<br><span style="font-size:12px;color:#fff">${personalBest} 💩</span>`;
                    scrollDiv.appendChild(pb);
                }
                renderRows(localData);
            }
        };

        document.getElementById('tabGlobal').addEventListener('click', () => switchTab('global'));
        document.getElementById('tabLocal').addEventListener('click',  () => switchTab('local'));

        // Načti global data
        scrollDiv.innerHTML = `<div style="text-align:center;color:#aaa;font-family:'Press Start 2P',monospace;font-size:9px;padding:40px 0">Loading...</div>`;
        window.dbGetTopScores().then(data => {
            if (closed) return;
            globalData = data || localData;
            if (activeTab === 'global') renderRows(globalData);
        }).catch(() => {
            if (closed) return;
            globalData = localData;
            if (activeTab === 'global') renderRows(globalData);
        });

        this._makeBtn(W / 2, H - 52, 'BACK', 0x4CAF50, 0x2e7d32, close, 51);
    }

    // ── Nastavení overlay ─────────────────────────────────────────────────────
    _showSettings(W, pending = null) {
        const H = this.scale.height;
        // pending = rozpracovaný stav; jinak načti uložený
        const saved = JSON.parse(localStorage.getItem('mc_hovinko_settings') || '{"char":"toilet_char","portalItem":"toilet"}');
        const s = pending ? { ...pending } : { ...saved };
        const D = 100;
        const track = [], T = o => { track.push(o); return o; };
        const close = () => track.forEach(o => { try { o.destroy(); } catch(e){} });

        const ov = T(this.add.graphics().setDepth(D));
        ov.fillStyle(0x000000, 0.93); ov.fillRoundedRect(18, 10, W - 36, H - 20, 14);
        ov.lineStyle(4, 0xCC88FF);    ov.strokeRoundedRect(18, 10, W - 36, H - 20, 14);

        T(this.add.text(W / 2, 50, 'SETTINGS', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '14px', fill: '#CC88FF'
        }).setOrigin(0.5).setDepth(D + 1));

        T(this.add.text(32, 94, 'CHARACTER:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#aaa'
        }).setOrigin(0, 0.5).setDepth(D + 1));

        const unlocks = JSON.parse(localStorage.getItem('mc_unlocks') || '{}');
        const chars = [
            { key: 'toilet_char', label: 'TOILET' },
            { key: 'bucket',      label: 'BUCKET'  },
            { key: 'broom',       label: 'BROOM'   },
            { key: 'soap',        label: 'SOAP',   special: true, unlockKey: 'soap',   unlockScore: 250, badge: '⚡ FASTER!'  },
            { key: 'shovel',      label: 'SHOVEL', special: true, unlockKey: 'shovel', unlockScore: 500, badge: '⚡⚡ TURBO!'  }
        ];
        chars.forEach((ch, i) => {
            const row1 = i < 3;
            const bx = row1 ? (144 + i * 96) : (192 + (i - 3) * 96);
            const by = row1 ? 168 : 296;
            const sel = s.char === ch.key;
            const locked = ch.special && !unlocks[ch.unlockKey];
            const bHalf = 40;
            const box = T(this.add.graphics().setDepth(D + 1));
            box.fillStyle(locked ? 0x181818 : (sel ? 0x4A148C : 0x1a1a1a), 1);
            box.fillRoundedRect(bx - bHalf, by - 62, bHalf * 2, 116, 8);
            box.lineStyle(3, locked ? 0x444444 : (sel ? 0xCC88FF : 0x444444), 1);
            box.strokeRoundedRect(bx - bHalf, by - 62, bHalf * 2, 116, 8);
            if (!locked) {
                box.setInteractive(new Phaser.Geom.Rectangle(bx - bHalf, by - 62, bHalf * 2, 116), Phaser.Geom.Rectangle.Contains);
                box.on('pointerdown', () => { close(); this._showSettings(W, { ...s, char: ch.key }); });
            }

            // Sprite posunut výše, texty pod ním
            T(this.add.image(bx, by - 22, ch.key, 0)
                .setScale(1.05)
                .setAlpha(locked ? 0.35 : 1)
                .setDepth(D + 2));

            if (locked) {
                // Zámek vpravo nahoře nad sprite
                T(this.add.text(bx + bHalf - 4, by - 62 + 4, '🔒', { fontSize: '15px' })
                    .setOrigin(1, 0).setDepth(D + 3));
                // Texty mimo orámování — pod boxem
                T(this.add.text(bx, by + 38, ch.label, {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '8px', fill: '#666'
                }).setOrigin(0.5).setDepth(D + 2));
                T(this.add.text(bx, by + 62, 'LOCKED', {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '10px', fill: '#aaa'
                }).setOrigin(0.5).setDepth(D + 2));
                T(this.add.text(bx, by + 79, `${ch.unlockScore} pts`, {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#999'
                }).setOrigin(0.5).setDepth(D + 2));
                T(this.add.text(bx, by + 95, '⚡ faster', {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#aa8800'
                }).setOrigin(0.5).setDepth(D + 2));
            } else {
                if (ch.special) {
                    const badge = T(this.add.graphics().setDepth(D + 2));
                    badge.fillStyle(0xFFAB00, 1);
                    badge.fillRoundedRect(bx - bHalf + 2, by - 62 + 2, bHalf * 2 - 4, 14, 4);
                    T(this.add.text(bx, by - 55, ch.badge, {
                        fontFamily: '"Press Start 2P", monospace', fontSize: '5px', fill: '#111'
                    }).setOrigin(0.5).setDepth(D + 3));
                }
                T(this.add.text(bx, by + 38, ch.label, {
                    fontFamily: '"Press Start 2P", monospace', fontSize: '8px',
                    fill: sel ? '#CC88FF' : '#aaa'
                }).setOrigin(0.5).setDepth(D + 2));
            }
        });

        // ── Co padá v portálu — s větší mezerou ───────────────────────────────
        T(this.add.text(32, 410, 'PORTAL DROPS:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '9px', fill: '#aaa'
        }).setOrigin(0, 0.5).setDepth(D + 1));

        [{ key: 'toilet', label: 'TOILET' }, { key: 'toilet_paper', label: 'PAPER' }, { key: 'toilet_brush', label: 'BRUSH' }]
        .forEach((it, i) => {
            const bx = 102 + i * 138, by = 500;
            const sel = s.portalItem === it.key;
            const box = T(this.add.graphics().setDepth(D + 1));
            box.fillStyle(sel ? 0x1A237E : 0x1a1a1a, 1);
            box.fillRoundedRect(bx - 52, by - 65, 104, 118, 8);
            box.lineStyle(3, sel ? 0x7986CB : 0x444444, 1);
            box.strokeRoundedRect(bx - 52, by - 65, 104, 118, 8);
            box.setInteractive(new Phaser.Geom.Rectangle(bx - 52, by - 65, 104, 118), Phaser.Geom.Rectangle.Contains);
            box.on('pointerdown', () => { close(); this._showSettings(W, { ...s, portalItem: it.key }); });
            T(this.add.image(bx, by - 10, it.key).setScale(0.85).setDepth(D + 2));
            T(this.add.text(bx, by + 44, it.label, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '8px',
                fill: sel ? '#7986CB' : '#aaa'
            }).setOrigin(0.5).setDepth(D + 2));
        });

        // ── Tlačítka ZPĚT + POTVRDIT ──────────────────────────────────────────
        const btnY = H - 38, bH = 40;

        // ZPĚT — zavře bez uložení
        const bBack = T(this.add.graphics().setDepth(D + 1));
        bBack.fillStyle(0x333333, 1); bBack.fillRoundedRect(30, btnY - bH/2, 160, bH, 10);
        bBack.lineStyle(3, 0x222222);  bBack.strokeRoundedRect(30, btnY - bH/2, 160, bH, 10);
        bBack.setInteractive(new Phaser.Geom.Rectangle(30, btnY - bH/2, 160, bH), Phaser.Geom.Rectangle.Contains);
        bBack.on('pointerdown', close);
        T(this.add.text(110, btnY, '< BACK', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', fill: '#aaa'
        }).setOrigin(0.5).setDepth(D + 2));

        // POTVRDIT — uloží a restartuje menu (walking char se aktualizuje)
        const bOk = T(this.add.graphics().setDepth(D + 1));
        bOk.fillStyle(0x4A148C, 1); bOk.fillRoundedRect(W - 190, btnY - bH/2, 160, bH, 10);
        bOk.lineStyle(3, 0xCC88FF);  bOk.strokeRoundedRect(W - 190, btnY - bH/2, 160, bH, 10);
        bOk.setInteractive(new Phaser.Geom.Rectangle(W - 190, btnY - bH/2, 160, bH), Phaser.Geom.Rectangle.Contains);
        bOk.on('pointerdown', () => {
            localStorage.setItem('mc_hovinko_settings', JSON.stringify(s));
            close();
            this.scene.restart();
        });
        T(this.add.text(W - 110, btnY, 'CONFIRM >', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px', fill: '#CC88FF'
        }).setOrigin(0.5).setDepth(D + 2));
    }

    shutdown() { this.input.setTopOnly(false); this._removeBoardDiv(); }

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
