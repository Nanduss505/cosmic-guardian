let graphicsQuality = localStorage.getItem("galaxyGraphicsQuality") || "high";
let glowEnabled = (graphicsQuality === "high");

// Global performance override: force shadowBlur to 0 when glow is disabled
try {
    const shadowBlurDescriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "shadowBlur");
    if (shadowBlurDescriptor) {
        Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {
            get: function() {
                return shadowBlurDescriptor.get.call(this);
            },
            set: function(value) {
                if (typeof glowEnabled !== "undefined" && !glowEnabled) {
                    shadowBlurDescriptor.set.call(this, 0);
                } else {
                    shadowBlurDescriptor.set.call(this, value);
                }
            },
            configurable: true
        });
    }
} catch (e) {
    console.warn("Failed to override canvas shadowBlur:", e);
}

function random(min, max){

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}

function collision(a, b){

    return(

        a.x < b.x + b.width &&

        a.x + a.width > b.x &&

        a.y < b.y + b.height &&

        a.y + a.height > b.y

    );
}

function clamp(value, min, max){

    return Math.max(
        min,
        Math.min(max, value)
    );
}

// ======================
// SCREEN SHAKE SYSTEM
// ======================
let shakeDuration = 0;
let shakeIntensity = 0;

function triggerScreenShake(intensity, duration = 10) {
    shakeIntensity = intensity;
    shakeDuration = duration;
}

// ======================
// PARTICLE ENGINE
// ======================
const particles = [];

function createParticle(x, y, color, sizeMultiplier = 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (Math.random() * 3 + 2) * sizeMultiplier,
        life: 0,
        maxLife: Math.random() * 20 + 15,
        color: color
    });
}

function createThrusterParticle(x, y, color) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2, // Flow downwards
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 15 + 10,
        color: color
    });
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        if (glowEnabled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}