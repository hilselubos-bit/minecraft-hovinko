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

        this.objects   = [];
        this.spawnCd   = Math.min(this.sharedPoopInt * 0.80, 1.1);
        this.spawnTimer = 0.5;

        // Vanishing point — will oscillate to simulate tunnel turning
        this.vpTime  = 0;
        this.touchDir = 0;

        this._buildBg();
        this._buildInput();
        this._buildHUD();

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
            fontSize: '11px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 3
        };
        this.scoreTxt = this.add.text(13, 17, `Score: ${this.score}`, sty).setDepth(25);
        this.timeTxt  = this.add.text(this.W - 13, 17, '30s', sty).setOrigin(1, 0).setDepth(25);
        this.hearts   = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.image(13 + i * 28, 50, i < this.lives ? 'heart_full' : 'heart_empty')
                    .setScale(0.7).setDepth(25)
            );
        }
    }

    // ── Draw tunnel every frame ───────────────────────────────────────────────
    // Vanishing point hovers at top-center and sways gently — "tunnel turning"
    _drawTunnel(vpX, vpY) {
        const g = this.tunnelGfx;
        g.clear();
        const W = this.W, H = this.H;

        // Radial perspective lines (vp → bottom / side edges)
        const edgePts = [
            [0,   H],       // bottom-left
            [W/4, H],
            [W/2, H],
            [3*W/4, H],
            [W,   H],       // bottom-right
            [0,   H * 0.7],
            [W,   H * 0.7],
        ];
        edgePts.forEach(([ex, ey]) => {
            g.lineStyle(1, 0x3355aa, 0.18);
            g.beginPath();
            g.moveTo(vpX, vpY);
            g.lineTo(ex, ey);
            g.strokePath();
        });

        // Horizontal tunnel rings at increasing depths
        const rings = 9;
        for (let i = 1; i <= rings; i++) {
            const t     = i / rings;           // 0 = vp (top), 1 = bottom
            const ringY = vpY + t * (H - vpY);
            // Ring width expands from 0 at vp to full W at bottom
            const hw    = (W / 2) * t;
            const rx    = vpX + (W / 2 - vpX) * t; // x center of ring at this depth
            const near  = t > 0.80;
            const color = near ? 0xcc77ff : (t > 0.45 ? 0x5577ff : 0x3355cc);
            g.lineStyle(near ? 3 : 1.2, color, 0.10 + t * 0.52);
            g.beginPath();
            g.moveTo(rx - hw, ringY);
            g.lineTo(rx + hw, ringY);
            g.strokePath();
        }

        // Bright bottom ring (player's plane)
        g.lineStyle(4, 0xdd88ff, 0.70);
        g.beginPath();
        g.moveTo(0, H - 80);
        g.lineTo(W, H - 80);
        g.strokePath();
        // Subtle glow
        g.lineStyle(14, 0x9944ff, 0.14);
        g.beginPath();
        g.moveTo(0, H - 80);
        g.lineTo(W, H - 80);
        g.strokePath();

        // Tunnel center glow at vanishing point
        g.fillStyle(0x2244cc, 0.22);
        g.fillCircle(vpX, vpY, 28);
        g.fillStyle(0x88bbff, 0.15);
        g.fillCircle(vpX, vpY, 14);
    }

    // ── Spawn object near vanishing point ─────────────────────────────────────
    _spawnObject(vpX, vpY) {
        // Target x at the player level (random across tunnel width)
        const targetX = 40 + Math.random() * (this.W - 80);
        const sprite  = this.add.image(vpX, vpY, this.itemKey)
            .setScale(0.10).setAlpha(0.15).setDepth(3);
        this.objects.push({
            startX: vpX, startY: vpY,
            targetX,
            y: vpY,
            speed: (this.sharedDropSpeed + 60) * (0.9 + Math.random() * 0.3),
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

        // Vanishing point sways left/right (tunnel turns)
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

        // ── Spawn ─────────────────────────────────────────────────────────────
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this._spawnObject(vpX, vpY);
            this.spawnTimer = Math.max(0.42, this.spawnCd - (30 - this.portalSec) * 0.012);
        }

        // ── Tunnel visual ─────────────────────────────────────────────────────
        this._drawTunnel(vpX, vpY);

        // ── Objects ───────────────────────────────────────────────────────────
        const playerY  = this.player.y;
        const catchTop = playerY - 90;

        for (let i = this.objects.length - 1; i >= 0; i--) {
            const o = this.objects[i];
            o.y += o.speed * dt;

            // Perspective: x interpolates from start (near vp) toward targetX
            const tDepth = Math.max(0, (o.y - o.startY) / (playerY - o.startY));
            const x      = o.startX + (o.targetX - o.startX) * tDepth;
            const sc     = 0.10 + tDepth * 1.25;
            const al     = 0.15 + tDepth * 0.85;

            o.sprite.x = x;
            o.sprite.y = o.y;
            o.sprite.setScale(sc).setAlpha(al).setDepth(3 + tDepth * 5);

            // Catch
            if (Math.abs(x - this.player.x) < 55 && o.y > catchTop && o.y < playerY + 10) {
                this._catch(o, i);
                continue;
            }
            // Miss
            if (o.y > this.H + 30) {
                o.sprite.destroy();
                this.objects.splice(i, 1);
                this._miss();
            }
        }
    }

    _catch(o, idx) {
        o.sprite.destroy();
        this.objects.splice(idx, 1);
        this.score += 5 * (this.sharedStar > 0 ? 2 : 1);
        this.scoreTxt.setText(`Score: ${this.score}`);
    }

    _miss() {
        this.lives = Math.max(0, this.lives - 1);
        this.hearts.forEach((h, i) => h.setTexture(i < this.lives ? 'heart_full' : 'heart_empty'));
        this.cameras.main.shake(200, 0.012);
        if (this.lives <= 0) this._leave();
    }

    _leave() {
        if (this.isLeaving) return;
        this.isLeaving = true;
        this.objects.forEach(o => o.sprite.destroy());
        this.objects = [];
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
