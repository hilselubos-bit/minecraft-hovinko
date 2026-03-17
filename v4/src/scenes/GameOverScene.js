class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.submitted  = false;
        this.inputDiv   = null;

        // Personal best tracking
        const prevBest = parseInt(localStorage.getItem('mc_best_score') || '0', 10);
        if (this.finalScore > prevBest) {
            localStorage.setItem('mc_best_score', String(this.finalScore));
        }

        // Soap unlock at 250
        const unlocks = JSON.parse(localStorage.getItem('mc_unlocks') || '{}');
        this.newUnlock = false;
        if (this.finalScore >= 250 && !unlocks.soap) {
            unlocks.soap = true;
            localStorage.setItem('mc_unlocks', JSON.stringify(unlocks));
            this.newUnlock = true;
        }
    }

    create() {
        const W = this.scale.width, H = this.scale.height;

        // Background only — panel je v HTML modálu
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, W, H);
        this.add.tileSprite(0, H - 100, W, 100, 'ground').setOrigin(0, 0);

        // Uvolni Phaser keyboard capture aby HTML input dostal všechny klávesy
        this.input.keyboard.disableGlobalCapture();

        // HTML overlay input — position:fixed nepohne canvas při otevření klávesnice
        this._showInputOverlay();
    }

    // ── HTML input overlay ────────────────────────────────────────────────────
    _showInputOverlay() {
        const div = document.createElement('div');
        div.id = 'nameOverlay';
        div.style.cssText = `
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.72);
            z-index: 9999;
        `;

        div.innerHTML = `
            <div style="
                background: linear-gradient(160deg,#1a1a2e 0%,#111118 100%);
                border: 3px solid #FFD700;
                border-radius: 18px;
                padding: 28px 22px 22px;
                text-align: center;
                width: min(340px, 88vw);
                box-sizing: border-box;
                box-shadow: 0 0 40px rgba(255,215,0,0.18), 0 8px 32px rgba(0,0,0,0.7);
                position: relative;
            ">
                <div style="font-size:38px;margin-bottom:6px;line-height:1">💩</div>
                <div style="
                    font-family:'Press Start 2P',monospace;
                    font-size:13px;color:#FF5722;
                    margin-bottom:4px;
                    text-shadow:0 0 12px rgba(255,87,34,0.5);
                ">GAME OVER</div>
                <div style="
                    font-family:'Press Start 2P',monospace;
                    font-size:9px;color:#FFD700;
                    margin-bottom:${this.newUnlock ? '10px' : '20px'};
                    opacity:0.85;
                ">Score: ${this.finalScore}</div>

                ${this.newUnlock ? `
                <div style="
                    font-family:'Press Start 2P',monospace;
                    font-size:8px;color:#00E676;
                    background:rgba(0,230,118,0.1);
                    border:2px solid #00E676;
                    border-radius:8px;padding:8px 10px;
                    margin-bottom:12px;line-height:1.8;
                    text-shadow:0 0 8px rgba(0,230,118,0.5);
                ">🔓 SOAP UNLOCKED!<br><span style="font-size:7px;color:#aaa">New character in settings!</span></div>
                ` : ''}

                <div style="
                    width:100%;height:1px;
                    background:linear-gradient(90deg,transparent,#FFD700,transparent);
                    margin-bottom:18px;
                "></div>

                <p style="
                    font-family:'Press Start 2P',monospace;
                    font-size:8px;color:#aaa;
                    margin-bottom:12px;line-height:1.8;
                ">Enter your name for<br>the leaderboard:</p>

                <input id="nameInput" type="text" maxlength="12"
                    autocomplete="off" autocorrect="off" autocapitalize="characters"
                    spellcheck="false" placeholder="YOUR NAME..."
                    style="
                        width:100%; padding:13px 10px; font-size:14px;
                        font-family:'Press Start 2P',monospace;
                        background:#0d0d1a; color:#FFD700;
                        border:2px solid #FFD700; border-radius:10px;
                        box-sizing:border-box; text-align:center; outline:none;
                        letter-spacing:2px;
                        box-shadow:0 0 10px rgba(255,215,0,0.15) inset;
                    ">

                <button id="nameSubmit" style="
                    margin-top:14px; width:100%; padding:14px 0;
                    font-family:'Press Start 2P',monospace; font-size:11px;
                    background:linear-gradient(180deg,#4CAF50,#2e7d32);
                    color:#fff; border:2px solid #FFD700;
                    border-radius:10px; cursor:pointer; letter-spacing:1px;
                    box-shadow:0 4px 0 #1b5e20, 0 0 16px rgba(76,175,80,0.3);
                    position:relative; top:0; transition:top .08s,box-shadow .08s;
                ">✔ CONFIRM</button>

                <button id="nameSkip" style="
                    margin-top:10px; width:100%; padding:12px 0;
                    font-family:'Press Start 2P',monospace; font-size:10px;
                    background:transparent; color:#888;
                    border:2px solid #555; border-radius:10px; cursor:pointer;
                    transition:color .15s,border-color .15s;
                ">SKIP / MENU</button>
            </div>
        `;

        document.body.appendChild(div);
        this.inputDiv = div;

        // Button press effect
        const btn = document.getElementById('nameSubmit');
        btn.addEventListener('mousedown',  () => { btn.style.top = '3px'; btn.style.boxShadow = '0 1px 0 #1b5e20'; });
        btn.addEventListener('mouseup',    () => { btn.style.top = '0';   btn.style.boxShadow = '0 4px 0 #1b5e20, 0 0 16px rgba(76,175,80,0.3)'; });
        btn.addEventListener('touchstart', () => { btn.style.top = '3px'; btn.style.boxShadow = '0 1px 0 #1b5e20'; }, { passive: true });
        btn.addEventListener('touchend',   () => { btn.style.top = '0';   btn.style.boxShadow = '0 4px 0 #1b5e20, 0 0 16px rgba(76,175,80,0.3)'; });

        const skipBtn = document.getElementById('nameSkip');
        skipBtn.addEventListener('mouseenter', () => { skipBtn.style.color = '#ccc'; skipBtn.style.borderColor = '#888'; });
        skipBtn.addEventListener('mouseleave', () => { skipBtn.style.color = '#888'; skipBtn.style.borderColor = '#555'; });

        // Auto-focus after short delay (prevents iOS immediate keyboard quirks)
        setTimeout(() => document.getElementById('nameInput')?.focus(), 150);

        const BAD_WORDS = [
            'fuck','shit','cunt','bitch','asshole','nigger','faggot','retard',
            'nazi','hitler','penis','vagina','cock','dick','pussy','whore','slut',
            'kurva','pica','huj','kokot','pizda','jebat','debil','idiot','blbec'
        ];
        const showError = (msg) => {
            let err = document.getElementById('nameError');
            if (!err) {
                err = document.createElement('div');
                err.id = 'nameError';
                err.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:8px;color:#FF5722;margin-top:8px;line-height:1.6;';
                document.getElementById('nameInput').insertAdjacentElement('afterend', err);
            }
            err.textContent = msg;
        };

        const submit = () => {
            const val = document.getElementById('nameInput')?.value?.trim();
            if (!val) return;
            // Povolené znaky: písmena, čísla, mezera, _ -
            if (!/^[a-zA-Z0-9 _\-]+$/.test(val)) {
                showError('Only letters, numbers, _ and - allowed!');
                return;
            }
            const lower = val.toLowerCase();
            if (BAD_WORDS.some(w => lower.includes(w))) {
                showError('Please choose a different name.');
                return;
            }
            this._submit(val);
        };
        const skip = () => {
            this._removeOverlay();
            this.scene.start('MenuScene');
        };

        document.getElementById('nameSubmit').addEventListener('click', submit);
        document.getElementById('nameSkip').addEventListener('click', skip);
        document.getElementById('nameInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') skip();
        });
    }

    _removeOverlay() {
        if (this.inputDiv?.parentNode) {
            document.body.removeChild(this.inputDiv);
            this.inputDiv = null;
        }
    }

    // ── Submit + leaderboard ──────────────────────────────────────────────────
    _submit(name) {
        if (this.submitted) return;
        this.submitted = true;
        this._removeOverlay();

        // Lokální záloha vždy
        const lb = JSON.parse(localStorage.getItem('mc_hovinko_v2') || '[]');
        lb.push({ name, score: this.finalScore });
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem('mc_hovinko_v2', JSON.stringify(lb.slice(0, 10)));

        // Zobrazíme loading stav
        this._showLoading();

        // Pošleme do Supabase a načteme globální žebříček
        window.dbInsertScore(name, this.finalScore).then(() => {
            return window.dbGetTopScores();
        }).then(data => {
            if (data) {
                this._showLeaderboard(data, true);
            } else {
                this._showLeaderboard(lb.slice(0, 10), false);
            }
        }).catch(() => {
            this._showLeaderboard(lb.slice(0, 10), false);
        });
    }

    _showLoading() {
        const W = this.scale.width, H = this.scale.height;
        this.loadingTxt = this.add.text(W / 2, H / 2 + 100, 'Saving score...', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '10px',
            fill: '#aaa', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);
    }

    _showLeaderboard(board, isGlobal = false) {
        const W = this.scale.width, H = this.scale.height;
        this.children.removeAll(true);
        this._removeScrollDiv();

        // Background
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, W, H);
        this.add.tileSprite(0, H - 100, W, 100, 'ground').setOrigin(0, 0);
        this.add.graphics().fillStyle(0x000000, 0.82).fillRect(0, 0, W, H);

        // Panel — sahá až dolů aby pokryl i buttony
        const panel = this.add.graphics();
        panel.fillStyle(0x111111, 0.94);
        panel.fillRoundedRect(18, 15, W - 36, H - 22, 16);
        panel.lineStyle(4, 0xFFD700);
        panel.strokeRoundedRect(18, 15, W - 36, H - 22, 16);

        this.add.text(W / 2, 48, '🏆 TOP PLAYERS', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700'
        }).setOrigin(0.5);

        const canvas = this.game.canvas;
        const rect   = canvas.getBoundingClientRect();
        const sx = rect.width  / W;
        const sy = rect.height / H;

        const localData = JSON.parse(localStorage.getItem('mc_hovinko_v2') || '[]');
        const globalData = board;
        let activeTab = isGlobal ? 'global' : 'local';

        // Tabs
        const tabStyle = (active) => `
            flex:1; padding:8px 0; cursor:pointer;
            font-family:'Press Start 2P',monospace; font-size:8px;
            border-radius:8px; text-align:center; border:none;
            background:${active ? '#FFD700' : 'rgba(255,215,0,0.08)'};
            color:${active ? '#111' : '#FFD700'};
            border:2px solid ${active ? '#FFD700' : 'rgba(255,215,0,0.3)'};
        `;
        this.tabsDiv = document.createElement('div');
        this.tabsDiv.style.cssText = `
            position:fixed;
            left:${rect.left + 26 * sx}px; top:${rect.top + 64 * sy}px;
            width:${(W - 52) * sx}px; display:flex; gap:6px; z-index:201;
        `;
        this.tabsDiv.innerHTML = `
            <button id="goTabGlobal" style="${tabStyle(activeTab==='global')}">🌍 GLOBAL</button>
            <button id="goTabLocal"  style="${tabStyle(activeTab==='local')}">⭐ MY BEST</button>
        `;
        document.body.appendChild(this.tabsDiv);

        // Scroll list
        this.scrollDiv = document.createElement('div');
        this.scrollDiv.style.cssText = `
            position:fixed;
            left:${rect.left + 26 * sx}px; top:${rect.top + 102 * sy}px;
            width:${(W - 52) * sx}px; height:${(H - 102 - 100) * sy}px;
            overflow-y:auto; -webkit-overflow-scrolling:touch;
            z-index:200; scrollbar-width:thin; scrollbar-color:#FFD700 #111;
        `;
        document.body.appendChild(this.scrollDiv);

        const renderRows = (data) => {
            this.scrollDiv.innerHTML = '';
            if (!data.length) {
                this.scrollDiv.innerHTML = `<div style="text-align:center;color:#aaa;font-family:'Press Start 2P',monospace;font-size:9px;padding:40px 0">No records yet!</div>`;
                return;
            }
            const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
            data.forEach((e, i) => {
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
                this.scrollDiv.appendChild(row);
            });
        };

        const switchTab = (tab) => {
            activeTab = tab;
            document.getElementById('goTabGlobal').style.cssText = tabStyle(tab === 'global');
            document.getElementById('goTabLocal').style.cssText  = tabStyle(tab === 'local');
            renderRows(tab === 'global' ? globalData : localData);
        };

        document.getElementById('goTabGlobal').addEventListener('click', () => switchTab('global'));
        document.getElementById('goTabLocal').addEventListener('click',  () => switchTab('local'));
        renderRows(activeTab === 'global' ? globalData : localData);

        // Tlačítka
        this._makeBtn(W / 2, H - 76, '▶ PLAY AGAIN', 0x4CAF50, 0x2e7d32,
            () => { this._removeScrollDiv(); this.scene.start('GameScene'); }, W - 60);
        this._makeBtn(W / 2, H - 36, 'MENU', 0x1565C0, 0x0D47A1,
            () => { this._removeScrollDiv(); this.scene.start('MenuScene'); }, W - 60);
    }

    _removeScrollDiv() {
        ['scrollDiv', 'tabsDiv'].forEach(key => {
            if (this[key]?.parentNode) { this[key].parentNode.removeChild(this[key]); this[key] = null; }
        });
    }

    _makeBtn(x, y, label, fill, border, cb, bW = 210) {
        const bH = 38;
        const bg = this.add.graphics();
        bg.fillStyle(fill, 1);      bg.fillRoundedRect(x - bW/2, y - bH/2, bW, bH, 8);
        bg.lineStyle(2, 0xFFD700, 0.35); bg.strokeRoundedRect(x - bW/2, y - bH/2, bW, bH, 8);
        bg.fillStyle(0xffffff, 0.15); bg.fillRoundedRect(x - bW/2 + 3, y - bH/2 + 3, bW - 6, bH/2 - 3, 5);
        bg.setInteractive(new Phaser.Geom.Rectangle(x - bW/2, y - bH/2, bW, bH), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerover',  () => bg.setAlpha(0.82));
        bg.on('pointerout',   () => bg.setAlpha(1));
        bg.on('pointerdown',  cb);
        this.add.text(x, y, label, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '12px',
            fill: '#fff', stroke: 'rgba(0,0,0,0.4)', strokeThickness: 2
        }).setOrigin(0.5);
    }

    // Cleanup při opuštění scény
    shutdown() { this._removeOverlay(); this._removeScrollDiv(); }
    destroy()   { this._removeOverlay(); this._removeScrollDiv(); }
}
