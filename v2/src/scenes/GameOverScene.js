class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.submitted  = false;
        this.inputDiv   = null;
    }

    create() {
        const W = this.scale.width, H = this.scale.height;

        // Background
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, W, H);
        this.add.tileSprite(0, H - 100, W, 100, 'ground').setOrigin(0, 0);
        this.add.graphics().fillStyle(0x000000, 0.72).fillRect(0, 0, W, H);

        // Panel
        const panel = this.add.graphics();
        panel.fillStyle(0x111111, 0.9);
        panel.fillRoundedRect(30, 100, W - 60, H - 200, 16);
        panel.lineStyle(4, 0xFFD700, 1);
        panel.strokeRoundedRect(30, 100, W - 60, H - 200, 16);

        this.add.text(W / 2, 148, 'HRA SKONČILA!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '18px',
            fill: '#FF5722', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, 200, '😢', { fontSize: '44px' }).setOrigin(0.5);

        this.add.text(W / 2, 260, `Skóre: ${this.finalScore} 💩`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px',
            fill: '#FFD700', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);

        // HTML overlay input — position:fixed nepohne canvas při otevření klávesnice
        this._showInputOverlay();
    }

    // ── HTML input overlay ────────────────────────────────────────────────────
    _showInputOverlay() {
        const div = document.createElement('div');
        div.id = 'nameOverlay';
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10,10,10,0.96);
            border: 3px solid #5a9e32;
            border-radius: 14px;
            padding: 24px 20px 20px;
            text-align: center;
            z-index: 9999;
            width: min(340px, 88vw);
            box-sizing: border-box;
        `;

        div.innerHTML = `
            <p style="font-family:'Press Start 2P',monospace;font-size:10px;color:#ccc;margin-bottom:14px;line-height:1.6">
                Zadej své jméno:
            </p>
            <input id="nameInput" type="text" maxlength="12" autocomplete="off" autocorrect="off"
                spellcheck="false" placeholder="Tvoje jméno..."
                style="
                    width:100%; padding:12px 10px; font-size:16px;
                    font-family:'Press Start 2P',monospace;
                    background:#fff; color:#000;
                    border:3px solid #5a9e32; border-radius:8px;
                    box-sizing:border-box; text-align:center; outline:none;
                ">
            <button id="nameSubmit"
                style="
                    margin-top:14px; width:100%; padding:13px 0;
                    font-family:'Press Start 2P',monospace; font-size:12px;
                    background:#4CAF50; color:#fff; border:3px solid #2e7d32;
                    border-radius:8px; cursor:pointer; letter-spacing:1px;
                ">
                POTVRDIT ✓
            </button>
        `;

        document.body.appendChild(div);
        this.inputDiv = div;

        // Auto-focus after short delay (prevents iOS immediate keyboard quirks)
        setTimeout(() => document.getElementById('nameInput')?.focus(), 150);

        const submit = () => {
            const val = document.getElementById('nameInput')?.value?.trim();
            if (val) this._submit(val);
        };

        document.getElementById('nameSubmit').addEventListener('click', submit);
        document.getElementById('nameInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
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

        const lb = JSON.parse(localStorage.getItem('mc_hovinko_v2') || '[]');
        lb.push({ name, score: this.finalScore });
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem('mc_hovinko_v2', JSON.stringify(lb.slice(0, 10)));

        this._showLeaderboard(lb.slice(0, 10));
    }

    _showLeaderboard(board) {
        const W = this.scale.width, H = this.scale.height;
        this.children.removeAll(true);

        // Background
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x5BB8FF, 0x5BB8FF, 0xB8E4FF, 0xB8E4FF, 1);
        sky.fillRect(0, 0, W, H);
        this.add.tileSprite(0, H - 100, W, 100, 'ground').setOrigin(0, 0);
        this.add.graphics().fillStyle(0x000000, 0.82).fillRect(0, 0, W, H);

        // Panel
        const panel = this.add.graphics();
        panel.fillStyle(0x111111, 0.94);
        panel.fillRoundedRect(18, 15, W - 36, H - 30, 16);
        panel.lineStyle(4, 0xFFD700);
        panel.strokeRoundedRect(18, 15, W - 36, H - 30, 16);

        this.add.text(W / 2, 55, '🏆 NEJLEPŠÍ HRÁČI', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '13px', fill: '#FFD700'
        }).setOrigin(0.5);

        // Divider
        const div = this.add.graphics();
        div.lineStyle(2, 0xFFD700, 0.6);
        div.lineBetween(36, 74, W - 36, 74);

        const medals = ['🥇', '🥈', '🥉'];
        board.forEach((e, i) => {
            const y   = 90 + i * 46;
            const top = i < 3;
            const col = top ? ['#FFD700', '#E0E0E0', '#CD7F32'][i] : '#ddd';

            // Row highlight for top 3
            if (top) {
                const rowBg = this.add.graphics();
                rowBg.fillStyle(
                    [0xFFD700, 0xC0C0C0, 0xCD7F32][i], 0.08
                );
                rowBg.fillRoundedRect(28, y - 6, W - 56, 38, 4);
            }

            this.add.text(38, y + 8, `${medals[i] ?? (i + 1) + '.'}  ${e.name.substring(0, 11)}`, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: top ? 11 : 10, fill: col
            }).setOrigin(0, 0.5);

            this.add.text(W - 38, y + 8, `${e.score} 💩`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: 11, fill: '#FFD700'
            }).setOrigin(1, 0.5);
        });

        if (!board.length) {
            this.add.text(W / 2, H / 2, 'Zatím žádné záznamy!\n🎮', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '11px',
                fill: '#aaa', align: 'center'
            }).setOrigin(0.5);
        }

        // Play again button
        this._makeBtn(W / 2, H - 55, '▶ HRÁT ZNOVU', 0x4CAF50, 0x2e7d32,
            () => this.scene.start('GameScene'));
    }

    _makeBtn(x, y, label, fill, border, cb) {
        const bW = 210, bH = 46;
        const bg = this.add.graphics();
        bg.fillStyle(fill, 1);   bg.fillRoundedRect(x - bW/2, y - bH/2, bW, bH, 10);
        bg.lineStyle(3, border); bg.strokeRoundedRect(x - bW/2, y - bH/2, bW, bH, 10);
        bg.fillStyle(0xffffff, 0.22); bg.fillRoundedRect(x - bW/2 + 4, y - bH/2 + 4, bW - 8, bH/2 - 4, 6);
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
    shutdown() { this._removeOverlay(); }
    destroy()   { this._removeOverlay(); }
}
