// ======================
// ENEMY VARIABLES & IMAGES
// ======================

const enemyNormalImage = new Image();
enemyNormalImage.src = "assets/images/enemies/musuh1-stage1.png"; // Default Stage 1 normal enemy

const enemyFastImage = new Image();
enemyFastImage.src = "assets/images/enemies/musuh2-stage1.png"; // Default Stage 1 fast enemy

const enemyTankImage = new Image();
enemyTankImage.src = "assets/images/enemies/musuh1-stage2.png"; // Default heavy/tank enemy

const bossImage = new Image();
bossImage.src = "assets/images/enemies/musuh2-stage2.png"; // Default boss fallback

const enemyBulletImage = new Image();
enemyBulletImage.src = "assets/images/bullets/enemy_bullet.png";

// Game State Arrays
const enemies = [];
const enemyBullets = [];
const explosions = [];
const asteroids = [];
const blackHoleParticles = [];

// Boss State
let boss = null;
let bossDefeated = false;
let phase1Triggered = false;
let phase2Triggered = false;
let phase3Triggered = false;
let bossLastShot = 0;
const bossShootDelay = 1800;

// Configurations
let activeLevelStage = 1;
let levelStageReady = false;
let levelStageCleared = false;
let nextDiveTime = 0;
let levelProgress = 0;
let currentWaveIndex = 0;
let stageIntroActive = false;
let stageIntroTimer = 0;
const diveDelayMin = 3000;
const diveDelayMax = 5000;

const enemyBulletSpeed = 1.3;
const enemyShootDelayMin = 2500;
const enemyShootDelayMax = 4500;

// Asteroid spawn timing
let lastAsteroidSpawn = 0;
const asteroidSpawnDelay = 1500;

// Explosion frames (4 images)
const explosionFrames = [];
for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `assets/images/effects/explosion_${i}.png`;
    explosionFrames.push(img);
}

// ======================
// ENEMY FORMATION STATUS
// ======================

function areEnemiesInFormation() {
    if (stageIntroActive) {
        return false;
    }
    if (boss && boss.entering) {
        return false;
    }
    if (enemies.length > 0 && enemies.some(e => e.entering)) {
        return false;
    }
    return true;
}

// ======================
// RESET STAGE
// ======================

function resetEnemyStage() {
    enemies.length = 0;
    enemyBullets.length = 0;
    explosions.length = 0;
    asteroids.length = 0;
    blackHoleParticles.length = 0;
    
    if (typeof bullets !== "undefined") {
        bullets.length = 0;
    }
    if (typeof items !== "undefined") {
        items.length = 0;
    }

    boss = null;
    bossDefeated = false;
    phase1Triggered = false;
    phase2Triggered = false;
    phase3Triggered = false;
    levelStageReady = false;
    levelStageCleared = false;
    levelProgress = 0;
    currentWaveIndex = 0;
}

// ======================
// PREPARE LEVEL
// ======================

function prepareLevelStage(stageLevel) {
    resetEnemyStage();
    activeLevelStage = stageLevel;
    levelStageReady = true;

    // Dynamically update image assets depending on the stage theme!
    if (stageLevel === 1) {
        enemyNormalImage.src = "assets/images/enemies/musuh1-stage1.png";
        enemyFastImage.src = "assets/images/enemies/musuh2-stage1.png";
        bossImage.src = "assets/images/enemies/bos-stage-1.png";
    } else if (stageLevel === 2) {
        enemyNormalImage.src = "assets/images/enemies/musuh1-stage2.png";
        enemyFastImage.src = "assets/images/enemies/musuh2-stage2.png";
        bossImage.src = "assets/images/enemies/bos-stage-2.png";
    } else if (stageLevel === 3) {
        enemyNormalImage.src = "assets/images/enemies/musuh1-stage3.png";
        enemyFastImage.src = "assets/images/enemies/musuh2-stage3.png";
        bossImage.src = "assets/images/enemies/bos-stage-3.png";
    }

    // Activate stage transition/intro announcement banner
    stageIntroActive = true;
    stageIntroTimer = Date.now() + 2500; // 2.5 seconds banner
}

function spawnStageInitialWave(stageLevel) {
    if (stageLevel === 1) {
        // Formasi 1 (Wave 0): 1 baris musuh2-stage1
        // Pergerakan: Sinusoidal
        spawnHorizontalFormation([
            { image: enemyFastImage, hp: 1, score: 15, type: "fast", speed: 0.18, sinusoidal: true }
        ], "default");
    } else if (stageLevel === 2) {
        // Formasi 1 (Wave 0): 1 baris musuh2-stage2 (1 HP)
        // Pergerakan: Diving (canDive)
        spawnHorizontalFormation([
            { image: enemyFastImage, hp: 1, score: 15, type: "fast", speed: 0.18, canDive: true }
        ], "default");
    } else if (stageLevel === 3) {
        // Formasi 1 (Wave 0): 1 baris musuh2-stage3 (2 HP)
        // Pergerakan: Zigzag
        spawnHorizontalFormation([
            { image: enemyFastImage, hp: 2, score: 20, type: "fast", speed: 0.22, zigzag: true }
        ], "default");
    }
}

// ======================
// FORMATIONS
// ======================

function spawnHorizontalFormation(rowConfigs, patternType = "default") {
    const enemyWidth = 90;
    const enemyHeight = 90;
    const sideMargin = 50;
    const rowGap = 30;
    const colGap = 15;
    
    const columns = 7;
    const totalWidth = columns * enemyWidth + (columns - 1) * colGap;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = 60;

    rowConfigs.forEach((rowConfig, row) => {
        const spawnY = -((rowConfigs.length - row) * (enemyHeight + rowGap) + 100);

        for (let col = 0; col < columns; col++) {
            let targetY = startY + row * (enemyHeight + rowGap);
            
            // Custom patterns for grid variations!
            if (patternType === "V") {
                const centerCol = (columns - 1) / 2;
                targetY += Math.abs(col - centerCol) * 25;
            } else if (patternType === "diagonal") {
                targetY += col * 20;
            } else if (patternType === "inverted-V") {
                const centerCol = (columns - 1) / 2;
                targetY += (centerCol - Math.abs(col - centerCol)) * 25;
            }

            enemies.push({
                type: rowConfig.type,
                image: rowConfig.image,
                width: enemyWidth,
                height: enemyHeight,
                hp: rowConfig.hp,
                maxHp: rowConfig.hp,
                score: rowConfig.score,
                shoot: rowConfig.shoot !== undefined ? rowConfig.shoot : (rowConfig.type !== "normal"),
                zigzag: rowConfig.zigzag !== undefined ? rowConfig.zigzag : (rowConfig.type === "fast"),
                sinusoidal: rowConfig.sinusoidal || false,
                canDive: rowConfig.canDive || false,
                direction: Math.random() < 0.5 ? -1 : 1,
                x: startX + col * (enemyWidth + colGap),
                y: spawnY,
                targetY: targetY,
                entering: true,
                enterSpeed: 1.2,
                speed: rowConfig.speed || 0.6, // Default speed slightly slower (0.6) for smoother feel
                diving: false
            });
        }
    });
}

function spawnBoss() {
    let bossHp = 40;
    if (activeLevelStage === 2) bossHp = 70;
    else if (activeLevelStage === 3) bossHp = 100;

    boss = {
        image: bossImage,
        x: canvas.width / 2 - 150,
        y: -300,
        width: 300,
        height: 200,
        hp: bossHp,
        maxHp: bossHp,
        speed: 2.5,
        direction: 1,
        entering: true,
        spawnedThresholds: [false, false, false] // 75%, 50%, 25%
    };
}

function spawnBossMinions() {
    const enemyWidth = 90;
    const enemyHeight = 90;
    const yOffset = 80;
    
    // Spawn 2 normal and 2 fast stage-specific enemies
    const minionConfigs = [
        { type: "normal", image: enemyNormalImage, hp: (activeLevelStage === 2 ? 2 : (activeLevelStage === 3 ? 2 : 1)) },
        { type: "fast", image: enemyFastImage, hp: (activeLevelStage === 3 ? 2 : 1) }
    ];
    
    const positions = [
        { x: canvas.width * 0.2, y: yOffset },
        { x: canvas.width * 0.4, y: yOffset },
        { x: canvas.width * 0.6, y: yOffset },
        { x: canvas.width * 0.8, y: yOffset }
    ];

    positions.forEach((pos, idx) => {
        const config = minionConfigs[idx % 2];
        
        // Define motion flags depending on stage
        let sinusoidal = false;
        let zigzag = false;
        let canDive = false;
        if (activeLevelStage === 1) {
            sinusoidal = config.type === "normal";
            zigzag = config.type === "fast";
        } else if (activeLevelStage === 2) {
            canDive = config.type === "fast";
            zigzag = config.type === "normal";
        } else if (activeLevelStage === 3) {
            sinusoidal = true;
            zigzag = true;
        }

        enemies.push({
            type: config.type,
            image: config.image,
            width: enemyWidth,
            height: enemyHeight,
            hp: config.hp,
            maxHp: config.hp,
            score: config.type === "fast" ? 15 : 10,
            shoot: true,
            zigzag: zigzag,
            sinusoidal: sinusoidal,
            canDive: canDive,
            direction: Math.random() < 0.5 ? -1 : 1,
            x: pos.x,
            y: -80,
            targetY: pos.y,
            entering: true,
            enterSpeed: 1.2,
            speed: 0.5,
            diving: false
        });
    });
}

// ======================
// ASTEROIDS (STAGE 2)
// ======================

function spawnAsteroid() {
    const size = Math.random() * 50 + 30; // 30px to 80px size
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 3 + 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        hp: Math.ceil(size / 20), // bigger size = more hp
        score: Math.ceil(size / 10)
    });
}

function updateAsteroids() {
    const now = Date.now();
    // Spawn asteroid logic (only in Stage 2 / levels 3 and 4)
    if ((activeLevelStage === 3 || activeLevelStage === 4) && now - lastAsteroidSpawn > asteroidSpawnDelay) {
        spawnAsteroid();
        lastAsteroidSpawn = now;
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.speed;
        ast.rotation += ast.rotationSpeed;

        // Player 1 Collision
        if (health > 0 && collision(ast, player)) {
            createExplosion(ast.x, ast.y);
            asteroids.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player);
            }
            continue;
        }

        // Player 2 Collision
        if (player2.active && player2.hp > 0 && collision(ast, player2)) {
            createExplosion(ast.x, ast.y);
            asteroids.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player2);
            }
            continue;
        }

        // Offscreen
        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }
}

function drawAsteroids() {
    asteroids.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x + ast.width / 2, ast.y + ast.height / 2);
        ctx.rotate(ast.rotation);
        
        // Draw asteroid shape (vector rocks)
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Generate a jagged polygon shape based on width/height
        const points = 8;
        const radius = ast.width / 2;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const jag = radius * (0.8 + Math.sin(i * 1.7) * 0.15);
            const px = Math.cos(angle) * jag;
            const py = Math.sin(angle) * jag;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw craters
        ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
        ctx.beginPath();
        ctx.arc(-radius/3, -radius/3, radius/5, 0, Math.PI * 2);
        ctx.arc(radius/4, radius/3, radius/4, 0, Math.PI * 2);
        ctx.arc(radius/3, -radius/4, radius/6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

// ======================
// GRAVITY VORTEX (STAGE 3)
// ======================

function updateBlackHole() {
    if (activeLevelStage !== 5) return;

    // Spawn vortex particles
    if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 300 + 100;
        blackHoleParticles.push({
            x: canvas.width / 2 + Math.cos(angle) * radius,
            y: 180 + Math.sin(angle) * radius,
            targetX: canvas.width / 2,
            targetY: 180,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 3 + 1,
            color: Math.random() < 0.5 ? "#7c3aed" : "#06b6d4" // purple or cyan
        });
    }

    // Move particles towards center
    for (let i = blackHoleParticles.length - 1; i >= 0; i--) {
        const p = blackHoleParticles[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            blackHoleParticles.splice(i, 1);
            continue;
        }

        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
    }
}

function drawBlackHole() {
    if (activeLevelStage !== 5) return;

    // Draw central black hole glow
    const cx = canvas.width / 2;
    const cy = 180;

    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
    grad.addColorStop(0, "black");
    grad.addColorStop(0.3, "rgba(124, 58, 237, 0.8)"); // purple
    grad.addColorStop(0.7, "rgba(6, 182, 212, 0.4)"); // cyan
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw particles
    blackHoleParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ======================
// ENEMY SHOOT & MOVEMENT
// ======================

function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 8,
        y: enemy.y + enemy.height,
        width: 16,
        height: 32,
        speed: enemyBulletSpeed
    });
}

function bossShoot() {
    if (!boss) return;
    
    // Triple bullet pattern
    enemyBullets.push({
        x: boss.x + 50 - 10,
        y: boss.y + boss.height,
        width: 20,
        height: 40,
        speed: 1.8
    });
    enemyBullets.push({
        x: boss.x + boss.width / 2 - 10,
        y: boss.y + boss.height,
        width: 20,
        height: 40,
        speed: 1.8
    });
    enemyBullets.push({
        x: boss.x + boss.width - 50 - 10,
        y: boss.y + boss.height,
        width: 20,
        height: 40,
        speed: 1.8
    });
}

function updateDivingEnemy(enemy) {
    const targetX = player.x + player.width / 2 - enemy.width / 2;
    enemy.x += clamp(targetX - enemy.x, -enemy.diveHorizontalSpeed, enemy.diveHorizontalSpeed);
    enemy.x = clamp(enemy.x, 0, canvas.width - enemy.width);
    enemy.y += enemy.diveSpeed;
}

// ======================
// COLLISIONS
// ======================

function checkBulletCollision() {
    // Check bullets vs standard enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (collision(bullets[j], enemies[i])) {
                const isP2Bullet = bullets[j].isPlayer2;
                const bulletX = bullets[j].x + bullets[j].width / 2;
                const bulletY = bullets[j].y;
                
                enemies[i].hp--;

                // Hit sparks
                if (typeof createParticle === "function") {
                    for (let k = 0; k < 5; k++) {
                        createParticle(bulletX, bulletY, isP2Bullet ? "#ff5500" : "#00ffff");
                    }
                }

                bullets.splice(j, 1);

                if (enemies[i].hp <= 0) {
                    createExplosion(enemies[i].x, enemies[i].y);
                    if (typeof playSFX === "function") {
                        playSFX(explosionSound);
                    }

                    const shooter = isP2Bullet ? player2 : player;
                    const points = shooter.doubleScoreActive ? enemies[i].score * 2 : enemies[i].score;
                    score += points;

                    // Ult charge
                    if (shooter.ultMeter < 100) {
                        shooter.ultMeter = Math.min(100, shooter.ultMeter + 8);
                    }

                    // Progress level (not for Boss stage)
                    if (activeLevelStage < 5 && typeof levelProgress !== "undefined") {
                        levelProgress += 8; // approx 13 enemies to level up
                    }

                    // Item Drops
                    if (typeof spawnItem === "function") {
                        spawnItem(enemies[i].x + enemies[i].width/2 - 17, enemies[i].y + enemies[i].height/2 - 17);
                    }

                    enemies.splice(i, 1);
                    updateHUD();
                }
                break;
            }
        }
    }

    // Check bullets vs asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (collision(bullets[j], asteroids[i])) {
                const isP2Bullet = bullets[j].isPlayer2;
                const bulletX = bullets[j].x + bullets[j].width / 2;
                const bulletY = bullets[j].y;
                
                asteroids[i].hp--;

                // Hit sparks
                if (typeof createParticle === "function") {
                    for (let k = 0; k < 5; k++) {
                        createParticle(bulletX, bulletY, isP2Bullet ? "#ff5500" : "#00ffff");
                    }
                }

                bullets.splice(j, 1);

                if (asteroids[i].hp <= 0) {
                    createExplosion(asteroids[i].x, asteroids[i].y);
                    if (typeof playSFX === "function") {
                        playSFX(explosionSound);
                    }

                    const shooter = isP2Bullet ? player2 : player;
                    const points = shooter.doubleScoreActive ? asteroids[i].score * 2 : asteroids[i].score;
                    score += points;
                    updateHUD();

                    if (typeof spawnItem === "function") {
                        spawnItem(asteroids[i].x + asteroids[i].width/2 - 17, asteroids[i].y + asteroids[i].height/2 - 17);
                    }

                    asteroids.splice(i, 1);
                }
                break;
            }
        }
    }
}

function checkBossCollision() {
    if (!boss) return;

    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!boss) break;
        if (collision(bullets[i], boss)) {
            const isP2Bullet = bullets[i].isPlayer2;
            const bulletX = bullets[i].x + bullets[i].width / 2;
            const bulletY = bullets[i].y;
            
            boss.hp--;

            // Check health drop milestones to spawn minions (Exactly 3 times at 75%, 50%, 25%)
            const hpPercentage = boss.hp / boss.maxHp;
            if (hpPercentage <= 0.75 && !boss.spawnedThresholds[0]) {
                boss.spawnedThresholds[0] = true;
                spawnBossMinions();
            }
            if (hpPercentage <= 0.50 && !boss.spawnedThresholds[1]) {
                boss.spawnedThresholds[1] = true;
                spawnBossMinions();
            }
            if (hpPercentage <= 0.25 && !boss.spawnedThresholds[2]) {
                boss.spawnedThresholds[2] = true;
                spawnBossMinions();
            }

            if (typeof createParticle === "function") {
                for (let k = 0; k < 5; k++) {
                    createParticle(bulletX, bulletY, isP2Bullet ? "#ff5500" : "#00ffff");
                }
            }

            bullets.splice(i, 1);

            if (boss.hp <= 0) {
                const shooter = isP2Bullet ? player2 : player;
                const points = shooter.doubleScoreActive ? 500 * 2 : 500;
                score += points;
                levelProgress = 100;
                updateHUD();
                createExplosion(boss.x + boss.width / 2 - 40, boss.y + boss.height / 2 - 40);
                if (typeof playSFX === "function") {
                    playSFX(explosionSound);
                }
                bossDefeated = true;
                boss = null;
            }
        }
    }
}

function checkPlayerCollision() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        // Player 1 Collision
        if (health > 0 && collision(player, enemies[i])) {
            createExplosion(enemies[i].x, enemies[i].y);
            enemies.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player);
            }
            continue;
        }

        // Player 2 Collision
        if (player2.active && player2.hp > 0 && collision(player2, enemies[i])) {
            createExplosion(enemies[i].x, enemies[i].y);
            enemies.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player2);
            }
            continue;
        }
    }

    if (boss) {
        if (health > 0 && collision(player, boss)) {
            if (typeof damagePlayer === "function") {
                damagePlayer(player);
            }
        }
        if (player2.active && player2.hp > 0 && collision(player2, boss)) {
            if (typeof damagePlayer === "function") {
                damagePlayer(player2);
            }
        }
    }
}

// ======================
// EXPLOSION CONTROL
// ======================

function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        frame: 0,
        timer: 0
    });

    // Particle sparks
    if (typeof createParticle === "function") {
        for (let i = 0; i < 15; i++) {
            createParticle(x + 40, y + 40, Math.random() < 0.5 ? "#ffaa00" : (Math.random() < 0.5 ? "#ff3300" : "#ffcc00"), 1.8);
        }
    }
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer++;
        if (explosions[i].timer % 5 === 0) {
            explosions[i].frame++;
        }
        if (explosions[i].frame >= 4) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions() {
    explosions.forEach(exp => {
        ctx.drawImage(
            explosionFrames[exp.frame],
            exp.x,
            exp.y,
            80,
            80
        );
    });
}

// ======================
// UPDATE GAME ELEMENTS
// ======================

function spawnNextWave() {
    currentWaveIndex++;
    
    if (activeLevelStage === 1) {
        if (currentWaveIndex === 1) {
            levelProgress = 33;
            // Formasi 2: depan musuh2-stage1 (1 HP), belakang musuh1-stage1 (1 HP)
            spawnHorizontalFormation([
                { image: enemyFastImage, hp: 1, score: 15, type: "fast", speed: 0.18, zigzag: true },
                { image: enemyNormalImage, hp: 1, score: 10, type: "normal", speed: 0.18, sinusoidal: true }
            ], "default");
        } else if (currentWaveIndex === 2) {
            levelProgress = 66;
            // Formasi 3: Boss stage 1
            spawnBoss();
        }
    } else if (activeLevelStage === 2) {
        if (currentWaveIndex === 1) {
            levelProgress = 33;
            // Formasi 2: depan musuh2-stage2 (1 HP), belakang musuh1-stage2 (2 HP)
            spawnHorizontalFormation([
                { image: enemyFastImage, hp: 1, score: 15, type: "fast", speed: 0.18, canDive: true },
                { image: enemyNormalImage, hp: 2, score: 15, type: "normal", speed: 0.18, zigzag: true }
            ], "default");
        } else if (currentWaveIndex === 2) {
            levelProgress = 66;
            // Formasi 3: Boss stage 2
            spawnBoss();
        }
    } else if (activeLevelStage === 3) {
        if (currentWaveIndex === 1) {
            levelProgress = 33;
            // Formasi 2: depan musuh2-stage3 (2 HP), belakang musuh1-stage3 (2 HP)
            spawnHorizontalFormation([
                { image: enemyFastImage, hp: 2, score: 20, type: "fast", speed: 0.22, sinusoidal: true },
                { image: enemyNormalImage, hp: 2, score: 20, type: "normal", speed: 0.18, zigzag: true }
            ], "default");
        } else if (currentWaveIndex === 2) {
            levelProgress = 66;
            // Formasi 3: Boss stage 3
            spawnBoss();
        }
    }
}

function updateEnemies() {
    if (!levelStageReady) {
        prepareLevelStage(activeLevelStage);
    }

    if (stageIntroActive) {
        if (Date.now() > stageIntroTimer) {
            stageIntroActive = false;
            spawnStageInitialWave(activeLevelStage);
        }
        // Skip updating standard enemies during the stage title card
        enemyBullets.length = 0;
        updateAsteroids();
        updateExplosions();
        return;
    }

    // Wave Spawning: Spawn a new wave if standard enemies are cleared
    if (activeLevelStage <= 3 && enemies.length === 0 && !boss && !bossDefeated) {
        spawnNextWave();
    }

    // Update normal enemies
    enemies.forEach(enemy => {
        if (enemy.diving) {
            updateDivingEnemy(enemy);
        } else if (enemy.entering) {
            enemy.y += enemy.enterSpeed;
            if (enemy.y >= enemy.targetY) {
                enemy.y = enemy.targetY;
                enemy.entering = false;
            }
        } else {
            enemy.y += enemy.speed;
        }

        // Sinusoidal movement (sways left & right smoothly)
        if (enemy.sinusoidal && !enemy.entering && !enemy.diving) {
            if (enemy.baseX === undefined) {
                enemy.baseX = enemy.x;
                enemy.sinePhase = 0;
            }
            enemy.sinePhase += 0.03; // Smooth progression
            enemy.x = enemy.baseX + Math.sin(enemy.sinePhase) * 60;
        }

        // Zigzag side-to-side movement
        if (enemy.zigzag && !enemy.entering && !enemy.diving && !enemy.sinusoidal) {
            enemy.x += enemy.direction * 1.2;
            if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
                enemy.direction *= -1;
            }
        }

        // Periodic tactical dive towards player
        if (enemy.canDive && !enemy.entering && !enemy.diving) {
            const now = Date.now();
            if (enemy.nextDiveTime === undefined) {
                // Initialize first dive in 5-10 seconds
                enemy.nextDiveTime = now + random(5000, 10000);
            }
            if (now >= enemy.nextDiveTime) {
                enemy.diving = true;
                enemy.diveSpeed = 2.2;
                enemy.diveHorizontalSpeed = 1.0;
            }
        }

        // Shooting intervals
        if (enemy.shoot && !enemy.entering) {
            const now = Date.now();
            if (enemy.nextShotTime === undefined) {
                enemy.nextShotTime = now + random(enemyShootDelayMin, enemyShootDelayMax);
            }
            if (now >= enemy.nextShotTime) {
                enemyShoot(enemy);
                enemy.nextShotTime = now + random(enemyShootDelayMin, enemyShootDelayMax);
            }
        }
    });

    // Update boss
    if (boss) {
        if (boss.entering) {
            boss.y += 1.5;
            if (boss.y >= 50) {
                boss.y = 50;
                boss.entering = false;
            }
        } else {
            boss.x += boss.speed * boss.direction;
            if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
                boss.direction *= -1;
            }

            const now = Date.now();
            if (now - bossLastShot > bossShootDelay) {
                bossShoot();
                bossLastShot = now;
            }

        }
    }

    // Update projectiles
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.y += bullet.speed;

        // Player 1 Collision
        if (health > 0 && collision(bullet, player)) {
            enemyBullets.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player);
            }
            continue;
        }

        // Player 2 Collision
        if (player2.active && player2.hp > 0 && collision(bullet, player2)) {
            enemyBullets.splice(i, 1);
            if (typeof damagePlayer === "function") {
                damagePlayer(player2);
            }
            continue;
        }

        // Offscreen
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }

    // Call updates of other subsystems
    updateAsteroids();
    updateBlackHole();
    updateExplosions();
    
    // Check collisions
    checkBulletCollision();
    checkBossCollision();
    checkPlayerCollision();

    // Clean up enemies that fell offscreen
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].y > canvas.height + 100) {
            enemies.splice(i, 1);
        }
    }

    // Trigger fly-up cutscene only when boss is defeated and all minions/small enemies are cleared
    if (bossDefeated && enemies.length === 0 && !playerFlyingUp) {
        playerFlyingUp = true;
    }
}

// ======================
// DRAW GAME ELEMENTS
// ======================

function drawEnemies() {
    // Draw background blackhole vortex first
    drawBlackHole();

    // Draw normal enemies
    enemies.forEach(enemy => {
        ctx.save();
        // Add red neon glow outline around the enemy image!
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ef4444";
        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.restore();
    });

    // Draw boss
    if (boss) {
        ctx.save();
        // Add red neon glow outline around the boss image!
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ef4444";
        ctx.drawImage(boss.image, boss.x, boss.y, boss.width, boss.height);
        ctx.restore();

        // Draw Boss HP bar
        const hpBarX = canvas.width / 2 - 250;
        const hpBarY = 25;
        const hpBarWidth = 500;
        const hpBarHeight = 15;

        // Backbar
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Fillbar
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(hpBarX, hpBarY, (boss.hp / boss.maxHp) * hpBarWidth, hpBarHeight);

        // Border outline
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        // Text label
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 12px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText("HP ULTIMATE BOSS", canvas.width / 2, hpBarY - 6);
    }

    // Draw other entities
    drawAsteroids();
    drawEnemyBullets();
    drawExplosions();

    // Draw Stage Intro Banner overlay
    if (stageIntroActive) {
        ctx.save();
        
        // Dark horizontal stripe overlay
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 160);
        
        // Top and bottom border lines
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ffff";
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2 - 80);
        ctx.lineTo(canvas.width, canvas.height / 2 - 80);
        ctx.moveTo(0, canvas.height / 2 + 80);
        ctx.lineTo(canvas.width, canvas.height / 2 + 80);
        ctx.stroke();
        
        // Large Title Text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 44px Orbitron";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`TAHAP 0${activeLevelStage}`, canvas.width / 2, canvas.height / 2 - 15);
        
        // Subtitle Text
        let subtitle = "MEMASUKI ZONA NEBULA";
        let subColor = "#00ffff";
        if (activeLevelStage === 2) {
            subtitle = "SABUK ASTEROID BERBAHAYA";
            subColor = "#ffd700";
        } else if (activeLevelStage === 3) {
            subtitle = "PUSARAN ULTIMATE BOSS - PERTEMPURAN TERAKHIR";
            subColor = "#a855f7";
        }
        
        ctx.fillStyle = subColor;
        ctx.shadowColor = subColor;
        ctx.font = "bold 16px Orbitron";
        ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 25);
        
        ctx.restore();
    }
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.drawImage(enemyBulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
    });
}
