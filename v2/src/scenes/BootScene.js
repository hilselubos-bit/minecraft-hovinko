// ─── Steve sprite sheet (4 walk frames, 52×76 each) ─────────────────────────
function buildSteveSheet() {
    const FW = 52, FH = 76, FRAMES = 4;
    const c = document.createElement('canvas');
    c.width = FW * FRAMES; c.height = FH;
    const g = c.getContext('2d');
    [-22, 0, 22, 0].forEach((deg, i) => drawSteveFrame(g, i * FW, deg));
    return c;
}

function drawSteveFrame(g, ox, legDeg) {
    const A  = legDeg * Math.PI / 180;
    const aA = -A * 0.8;
    const cx = ox + 26, gy = 74;

    function rot(px, py, w, h, angle, color, startY = 0) {
        g.save();
        g.translate(px, py);
        g.rotate(angle);
        g.fillStyle = color;
        g.fillRect(-w / 2, startY, w, h);
        g.restore();
    }

    rot(cx - 6, gy - 22, 10, 22,  A, '#3949AB');
    rot(cx - 6, gy - 22, 13,  6,  A, '#3E2723', 22);
    rot(cx + 6, gy - 22, 10, 22, -A, '#3949AB');
    rot(cx + 6, gy - 22, 13,  6, -A, '#3E2723', 22);

    g.fillStyle = '#1565C0'; g.fillRect(cx - 12, gy - 44, 24, 22);
    g.fillStyle = '#0D47A1'; g.fillRect(cx - 12, gy - 44, 24,  4);
    g.fillStyle = '#1976D2'; g.fillRect(cx - 10, gy - 42,  7, 16);
    g.fillStyle = '#0D47A1'; g.fillRect(cx -  1, gy - 40,  2, 17);

    rot(cx - 17, gy - 44, 9, 16,  aA, '#1565C0');
    rot(cx - 17, gy - 44, 9,  6,  aA, '#C68642', 16);
    rot(cx + 17, gy - 44, 9, 16, -aA, '#1565C0');
    rot(cx + 17, gy - 44, 9,  6, -aA, '#C68642', 16);

    g.fillStyle = '#C68642'; g.fillRect(cx - 12, gy - 68, 24, 24);
    g.fillStyle = '#5D4037';
    g.fillRect(cx - 12, gy - 68, 24,  7);
    g.fillRect(cx - 12, gy - 61,  4,  4);
    g.fillRect(cx +  8, gy - 61,  4,  4);
    g.fillStyle = '#fff';
    g.fillRect(cx - 10, gy - 58, 7, 8); g.fillRect(cx + 3, gy - 58, 7, 8);
    g.fillStyle = '#42A5F5';
    g.fillRect(cx -  9, gy - 57, 5, 6); g.fillRect(cx + 4, gy - 57, 5, 6);
    g.fillStyle = '#000';
    g.fillRect(cx -  8, gy - 56, 3, 4); g.fillRect(cx + 5, gy - 56, 3, 4);
    g.fillStyle = '#B5651D'; g.fillRect(cx - 1, gy - 52, 3, 3);
    g.fillStyle = '#5D4037';
    g.fillRect(cx - 5, gy - 47, 2, 2); g.fillRect(cx - 3, gy - 45, 7, 2); g.fillRect(cx + 4, gy - 47, 2, 2);
    g.fillRect(cx - 10, gy - 62, 7, 2); g.fillRect(cx + 3, gy - 62, 7, 2);
}

// ─── BootScene ───────────────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this._makePoop();
        this._makeSteve();
        this._makeGround();
        this._makeCloud();
        this._makeSun();
        this._makeParticle();
        this._makeTree();
        this._makeMountains();
        this._makePowerups();
        this._makeHeart();
        this.scene.start('MenuScene');
    }

    _makePoop() {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        g.font = '52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('💩', 32, 34);
        this.textures.addCanvas('poop', c);
    }

    _makeSteve() {
        const sheet = buildSteveSheet();
        this.textures.addSpriteSheet('steve', sheet, { frameWidth: 52, frameHeight: 76 });
        this.anims.create({ key: 'idle', frames: [{ key: 'steve', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('steve', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
    }

    _makeGround() {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        g.fillStyle = '#5a9e32'; g.fillRect(0, 0, 32, 10);
        g.fillStyle = '#4a8c28'; [2, 8, 16, 22].forEach(x => g.fillRect(x, 0, 3, 4));
        g.fillStyle = '#8B6347'; g.fillRect(0, 10, 32, 22);
        g.fillStyle = '#7a5337'; g.fillRect(4, 14, 10, 4); g.fillRect(18, 22, 10, 4);
        g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 31, 31);
        this.textures.addCanvas('ground', c);
    }

    _makeCloud() {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 48;
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        [[16,32],[32,32],[48,32],[64,32],[80,32],[16,16],[32,16],[48,16],[64,16],[32,0],[48,0],[64,0]].forEach(([x,y]) => g.fillRect(x,y,16,16));
        this.textures.addCanvas('cloud', c);
    }

    _makeSun() {
        const c = document.createElement('canvas');
        c.width = c.height = 88;
        const g = c.getContext('2d');
        g.fillStyle = '#FFD700';
        g.fillRect(20, 20, 48, 48);
        [[32,0,24,18],[32,70,24,18],[0,32,18,24],[70,32,18,24],[8,8,16,16],[64,8,16,16],[8,64,16,16],[64,64,16,16]].forEach(([x,y,w,h]) => g.fillRect(x,y,w,h));
        g.fillStyle = '#FFF9C4'; g.fillRect(30, 30, 28, 28);
        this.textures.addCanvas('sun', c);
    }

    _makeParticle() {
        const c = document.createElement('canvas');
        c.width = c.height = 10;
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, 10, 10);
        this.textures.addCanvas('particle', c);
    }

    _makeTree() {
        const c = document.createElement('canvas');
        c.width = 48; c.height = 80;
        const g = c.getContext('2d');
        g.fillStyle = '#5C4033'; g.fillRect(20, 50, 8, 30);
        g.fillStyle = '#4a3328'; g.fillRect(22, 54, 2, 22);
        [[24,38,32,'#2e7d32'],[24,26,26,'#388e3c'],[24,14,20,'#43a047']].forEach(([cx,y,w,col]) => {
            g.fillStyle = col; g.fillRect(cx - w/2, y, w, 18);
        });
        this.textures.addCanvas('tree', c);
    }

    _makeMountains() {
        const c = document.createElement('canvas');
        c.width = 480; c.height = 130;
        const g = c.getContext('2d');
        // Far mountains (lighter)
        [[60,95,100,35,'#7aac7a'],[170,70,120,60,'#6a9c6a'],[310,80,100,50,'#7aac7a'],[420,72,130,58,'#6a9c6a']].forEach(([cx,y,w,h,col]) => {
            g.fillStyle = col;
            for (let s = 0; s <= h; s += 8) {
                const rw = Math.max(8, w * (1 - (s / h) * 0.72));
                g.fillRect(cx - rw / 2, y + s, rw, 8);
            }
            // Snow cap
            g.fillStyle = 'rgba(220,235,220,0.9)';
            g.fillRect(cx - 16, y - 2, 32, 12); g.fillRect(cx - 10, y - 10, 20, 8);
        });
        // Near mountains (darker)
        [[0,108,80,22,'#4a7a4a'],[90,100,90,30,'#3d6b3d'],[200,105,80,25,'#4a7a4a'],[300,98,110,32,'#3d6b3d'],[430,103,100,27,'#4a7a4a']].forEach(([cx,y,w,h,col]) => {
            g.fillStyle = col;
            for (let s = 0; s <= h; s += 8) {
                const rw = Math.max(8, w * (1 - (s / h) * 0.65));
                g.fillRect(cx - rw / 2, y + s, rw, 8);
            }
        });
        this.textures.addCanvas('mountains', c);
    }

    _makePowerups() {
        ['🛡️', '⭐'].forEach((emoji, i) => {
            const c = document.createElement('canvas');
            c.width = c.height = 52;
            const g = c.getContext('2d');
            const grad = g.createRadialGradient(26, 26, 4, 26, 26, 26);
            grad.addColorStop(0, i === 0 ? 'rgba(0,191,255,0.5)' : 'rgba(255,215,0,0.5)');
            grad.addColorStop(1, 'transparent');
            g.fillStyle = grad; g.fillRect(0, 0, 52, 52);
            g.font = '36px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(emoji, 26, 28);
            this.textures.addCanvas(['powerup_shield','powerup_star'][i], c);
        });
    }

    _makeHeart() {
        // Plné srdce (červené)
        const make = (color, key) => {
            const c = document.createElement('canvas');
            c.width = c.height = 32;
            const g = c.getContext('2d');
            g.fillStyle = color;
            g.beginPath();
            g.moveTo(16, 26);
            g.bezierCurveTo(16, 26,  4, 18,  4, 12);
            g.bezierCurveTo( 4,  6, 10,  4, 16, 10);
            g.bezierCurveTo(22,  4, 28,  6, 28, 12);
            g.bezierCurveTo(28, 18, 16, 26, 16, 26);
            g.closePath(); g.fill();
            this.textures.addCanvas(key, c);
        };
        make('#FF3B3B', 'heart_full');
        make('#444444', 'heart_empty');
    }
}
