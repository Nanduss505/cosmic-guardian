// ======================
// BULLET IMAGE
// ======================

const bulletImage = new Image();
bulletImage.src = "assets/images/bullets/player_bullet.png";

// ======================
// BULLET ARRAY
// ======================

const bullets = [];

// ======================
// SHOOT SETTINGS
// ======================

let lastShot = 0;
const shootCooldown = 200;

// ======================
// SHOOT
// ======================

function shootBullet(playerObj) {
    if (typeof gameRunning === "undefined" || !gameRunning || gamePaused) {
        return;
    }

    // Prevent shooting if stage intro is active or enemies are still entering
    if (typeof areEnemiesInFormation === "function" && !areEnemiesInFormation()) {
        return;
    }

    const now = Date.now();
    playerObj.lastShot = playerObj.lastShot || 0;
    const cooldown = playerObj.rapidFireActive ? shootCooldown / 2 : shootCooldown;
    if (now - playerObj.lastShot < cooldown) {
        return;
    }
    playerObj.lastShot = now;

    const bWidth = 35;
    const bHeight = 70;
    const bulletSpeed = 12;
    const centerX = playerObj.x + (playerObj.width / 2);
    const startY = playerObj.y;
    const isPlayer2 = (playerObj === player2);

    if (playerObj.weaponLevel === 1) {
        // Single Shot
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth / 2,
            y: startY,
            speed: bulletSpeed,
            vx: 0,
            isPlayer2: isPlayer2
        });
    } else if (playerObj.weaponLevel === 2) {
        // Double Shot
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth - 5,
            y: startY,
            speed: bulletSpeed,
            vx: 0,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX + 5,
            y: startY,
            speed: bulletSpeed,
            vx: 0,
            isPlayer2: isPlayer2
        });
    } else if (playerObj.weaponLevel === 3) {
        // Triple Shot
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth / 2,
            y: startY,
            speed: bulletSpeed,
            vx: 0,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth - 10,
            y: startY,
            speed: bulletSpeed,
            vx: -2.5,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX + 10,
            y: startY,
            speed: bulletSpeed,
            vx: 2.5,
            isPlayer2: isPlayer2
        });
    } else if (playerObj.weaponLevel === 4) {
        // Spread Shot (5-way!)
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth / 2,
            y: startY,
            speed: bulletSpeed,
            vx: 0,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth - 5,
            y: startY,
            speed: bulletSpeed,
            vx: -1.5,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX + 5,
            y: startY,
            speed: bulletSpeed,
            vx: 1.5,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth * 1.5 - 10,
            y: startY,
            speed: bulletSpeed,
            vx: -3.5,
            isPlayer2: isPlayer2
        });
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX + bWidth * 0.5 + 10,
            y: startY,
            speed: bulletSpeed,
            vx: 3.5,
            isPlayer2: isPlayer2
        });
    } else {
        // Weapon Level 5: Rapid Fire Energy Bolts (Continuous high velocity)
        bullets.push({
            width: bWidth,
            height: bHeight,
            x: centerX - bWidth / 2,
            y: startY,
            speed: bulletSpeed * 1.5,
            vx: 0,
            isLaserBeam: true,
            isPlayer2: isPlayer2
        });
    }

    if (typeof playSFX === "function") {
        playSFX(shootSound);
    }
}

// ======================
// KEYDOWN PREVENT SCROLL
// ======================

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " " || event.code === "Enter") {
        if (typeof gameRunning !== "undefined" && gameRunning && !gamePaused) {
            event.preventDefault();
        }
    }
});

// ======================
// UPDATE BULLETS
// ======================

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].vx !== undefined) {
            bullets[i].x += bullets[i].vx;
        }
        bullets[i].y -= bullets[i].speed;

        // Splice if offscreen
        if (bullets[i].y + bullets[i].height < -50 || bullets[i].x + bullets[i].width < -50 || bullets[i].x > canvas.width + 50) {
            bullets.splice(i, 1);
        }
    }
}

// ======================
// DRAW BULLETS
// ======================

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();
        
        // Apply color filter based on selected plane for player 1 bullets
        if (!bullet.isPlayer2 && typeof selectedPlane !== "undefined") {
            if (selectedPlane === "kencana") {
                ctx.filter = 'hue-rotate(130deg) saturate(1.8) brightness(1.2)';
            } else if (selectedPlane === "cendrawasih") {
                ctx.filter = 'hue-rotate(240deg) saturate(1.8) brightness(1.2)';
            } else {
                ctx.filter = 'none';
            }
        }

        if (bullet.isDroneLaser) {
            ctx.save();
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.restore();
        } else if (bullet.isLaserBeam) {
            ctx.save();
            ctx.fillStyle = bullet.isPlayer2 ? "#ff7700" : "#00ffff";
            ctx.shadowBlur = 15;
            ctx.shadowColor = bullet.isPlayer2 ? "#ff7700" : "#00ffff";
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.restore();
        } else {
            if (bulletImage.complete && bulletImage.naturalWidth !== 0) {
                ctx.drawImage(
                    bulletImage,
                    bullet.x,
                    bullet.y,
                    bullet.width,
                    bullet.height
                );
            } else {
                ctx.save();
                ctx.fillStyle = bullet.isPlayer2 ? "#ff5500" : "#00ffff";
                ctx.shadowBlur = 8;
                ctx.shadowColor = bullet.isPlayer2 ? "#ff5500" : "#00ffff";
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                ctx.restore();
            }
        }
        
        ctx.restore();
    });
}