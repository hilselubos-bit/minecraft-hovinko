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

        this.objects    = [];
        this.spawnCd    = Math.min(this.sharedPoopInt * 0.75, 1.0);
        this.spawnTimer = 0.6;

        // Player angle on tunnel circumference (π/2 = bottom)
        this.playerAngle = Math.PI / 2;
        this.angSpd      = 2.6; // radians / second

        // Tunnel animation
        this.tunnelRot = 0;

        // Touch input state
        this.touchDir = 0;

        this._buildBg();
        this._buildInput();
        this._buildHUD();

        // Tunnel rings drawn every frame
        this.tunnelGfx = this.add.graphics().setDepth(1);

        // Player sprite — start at bottom of ellipse
        const startPos = this._projectPos(this.playerAngle, 1);
        this.player = this.add.sprite(startPos.x, startPos.y, this.charKey)
            .setScale(1.25).setDepth(9);
        this.player.anims.play(`${this.charKey}_walk`);

        // Brief instruction that fades out
        const inst = this.add.text(this.W / 2, this.H / 2 - 70, '⬅  CATCH!  ➡', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: inst, alpha: 0, delay: 2500, duration: 1000,
            onComplete: () => inst.destroy() });
    }

    // ── Background ────────────────────────────────────────────────────────────
    _buildBg() {
        const W = this.W, H = this.H;
        this.add.image(W / 2, H / 2, 'stars_far').setDepth(0);
        this.add.image(W / 2, H / 2, 'stars_near').setAlpha(0.5).setDepth(0);

        // Pulsing portal glow at tunnel center
        this.portalGlow = this.add.image(W / 2, H / 2, 'powerup_portal')
            .setScale(4).setAlpha(0.32).setDepth(0.5);
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

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            this.hearts.push(
                this.add.image(13 + i * 28, 50, i < this.lives ? 'heart_full' : 'heart_empty')
                    .setScale(0.7).setDepth(25)
            );
        }
    }

    // ── Tunnel projection ─────────────────────────────────────────────────────
    // angle + z (0=center/far, 1=edge/near) → screen {x, y}
    _projectPos(angle, z) {
        const cx = this.W / 2, cy = this.H / 2;
        const rx = this.W * 0.43, ry = this.H * 0.30;
        return {
            x: cx + Math.cos(angle) * rx * z,
            y: cy + Math.sin(angle) * ry * z
        };
    }

    // ── Draw tunnel every frame ───────────────────────────────────────────────
    _drawTunnel(dt) {
        const g = this.tunnelGfx;
        g.clear();
        const cx = this.W / 2, cy = this.H / 2;
        const rx = this.W * 0.43, ry = this.H * 0.30;

        // Slowly rotating radial rails (warp-speed feel)
        this.tunnelRot += 0.16 * dt;
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2 + this.tunnelRot;
            g.lineStyle(1, 0x223366, 0.22);
            g.beginPath();
            g.moveTo(cx + Math.cos(a) * rx * 0.06, cy + Math.sin(a) * ry * 0.06);
            g.lineTo(cx + Math.cos(a) * rx,        cy + Math.sin(a) * ry);
            g.strokePath();
        }

        // Concentric ellipses (far → near, 10 rings)
        for (let i = 1; i <= 10; i++) {
            const t     = i / 10;
            const color = t > 0.8 ? 0xaa55ff : (t > 0.45 ? 0x4466ff : 0x2244cc);
            g.lineStyle(t > 0.85 ? 2.5 : 1.2, color, 0.08 + t * 0.46);
            g.strokeEllipse(cx, cy, rx * t * 2, ry * t * 2);
        }

        // Bright outer ring — near edge of tunnel
        g.lineStyle(4, 0xcc77ff, 0.78);
        g.strokeEllipse(cx, cy, rx * 2, ry * 2);

        // Soft outer glow halo
        g.lineStyle(12, 0x8844ff, 0.15);
        g.strokeEllipse(cx, cy, rx * 2 + 4, ry * 2 + 4);

        // Center portal core glow
        g.fillStyle(0x1133cc, 0.20);
        g.fillEllipse(cx, cy, 85, 52);
        g.fillStyle(0x4488ff, 0.12);
        g.fillEllipse(cx, cy, 40, 25);
    }

    // ── Spawn one object at a random angle, starting near center ─────────────
    _spawnObject() {
        const angle  = Math.random() * Math.PI * 2;
        const sprite = this.add.image(this.W / 2, this.H / 2, this.itemKey)
            .setScale(0.08).setAlpha(0.12).setDepth(2);
        this.objects.push({ angle, z: 0.04, sprite, speed: 0.20 + Math.random() * 0.10 });
    }

    // ── Main update ───────────────────────────────────────────────────────────
    update(_, delta) {
        if (this.isLeaving) return;
        const dt = delta / 1000;

        // Portal countdown
        this.portalSec -= dt;
        this.timeTxt.setText(Math.max(0, Math.ceil(this.portalSec)) + 's');
        if (this.portalSec <= 0) { this._leave(); return; }

        // ── Player movement (angular around tunnel circumference) ─────────────
        let va = 0;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) va = -this.angSpd;
        if (this.cursors.right.isDown || this.wasd.D.isDown) va =  this.angSpd;
        if (!va && this.touchDir) va = this.touchDir * this.angSpd;

        this.playerAngle = ((this.playerAngle + va * dt) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

        const pp = this._projectPos(this.playerAngle, 1);
        this.player.x = pp.x;
        this.player.y = pp.y;
        this.player.setFlipX(Math.cos(this.playerAngle) < 0);
        // Objects at top of tunnel render behind; player depth matches position
        this.player.setDepth(9 + Math.sin(this.playerAngle) * 3);

        // ── Spawn ─────────────────────────────────────────────────────────────
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this._spawnObject();
            // Spawn rate slowly increases as portal time runs out
            this.spawnTimer = Math.max(0.38, this.spawnCd - (30 - this.portalSec) * 0.014);
        }

        // ── Tunnel visual ─────────────────────────────────────────────────────
        this._drawTunnel(dt);

        // Portal center glow pulse + rotation
        this.portalGlow.rotation += 0.22 * dt;
        this.portalGlow.setScale(3.7 + Math.sin(this.time.now * 0.0022) * 0.35);

        // ── Objects ───────────────────────────────────────────────────────────
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const o   = this.objects[i];
            o.z      += o.speed * dt;

            const pos = this._projectPos(o.angle, o.z);
            o.sprite.x = pos.x;
            o.sprite.y = pos.y;
            o.sprite.setScale(0.16 + o.z * 1.0);
            o.sprite.setAlpha(0.18 + o.z * 0.82);
            // Depth: near objects in front; top-of-tunnel slightly behind
            o.sprite.setDepth(2 + o.z * 6 + Math.sin(o.angle) * 1.5);

            // ── Catch check ───────────────────────────────────────────────────
            if (o.z >= 0.80) {
                const diff = Math.abs(
                    ((o.angle - this.playerAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
                );
                if (diff < 0.40) { this._catch(o, i); continue; }
            }

            // ── Missed ────────────────────────────────────────────────────────
            if (o.z > 1.14) {
                o.sprite.destroy();
                this.objects.splice(i, 1);
                this._miss();
            }
        }
    }

    // ── Catch ─────────────────────────────────────────────────────────────────
    _catch(o, idx) {
        o.sprite.destroy();
        this.objects.splice(idx, 1);
        const pts = 5 * (this.sharedStar > 0 ? 2 : 1);
        this.score += pts;
        this.scoreTxt.setText(`Score: ${this.score}`);
        this.cameras.main.flash(90, 255, 215, 0, false);
    }

    // ── Miss ──────────────────────────────────────────────────────────────────
    _miss() {
        this.lives = Math.max(0, this.lives - 1);
        this.hearts.forEach((h, i) => h.setTexture(i < this.lives ? 'heart_full' : 'heart_empty'));
        this.cameras.main.shake(200, 0.012);
        if (this.lives <= 0) this._leave();
    }

    // ── Leave portal, return to GameScene ────────────────────────────────────
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
