// ======================
// PLAYER IMAGE
// ======================

const playerImage = new Image();
playerImage.src = "assets/images/player/pesawat_1.png"; // Default to Garuda Striker

// ======================
// PLAYER OBJECT
// ======================

let selectedPlane = "garuda"; // "garuda", "kencana", "cendrawasih"
let playerFlyingUp = false; // Transition cutscene trigger

const player = {
    width: 90,
    height: 90,
    x: 455,
    y: 490,
    speed: 8,
    maxHP: 5, // Dynamic based on plane selection
    weaponLevel: 1, // 1: Single, 2: Double, 3: Triple, 4: Spread, 5: Laser Beam!
    shieldActive: false,
    shieldTimer: 0,
    rapidFireActive: false,
    rapidFireTimer: 0,
    doubleScoreActive: false,
    doubleScoreTimer: 0,
    tilt: 0,
    invulnerable: false,
    invulnerableTimer: 0,
    ultMeter: 0,
    droneActive: false,
    droneAngle: 0,
    beamActive: false
};

const player2 = {
    active: false,
    width: 90,
    height: 90,
    x: 555,
    y: 490,
    speed: 8,
    maxHP: 5,
    weaponLevel: 1,
    shieldActive: false,
    shieldTimer: 0,
    rapidFireActive: false,
    rapidFireTimer: 0,
    doubleScoreActive: false,
    doubleScoreTimer: 0,
    hp: 5,
    tilt: 0,
    invulnerable: false,
    invulnerableTimer: 0,
    ultMeter: 0,
    droneActive: false,
    droneAngle: 0,
    beamActive: false
};

// ======================
// INPUT HANDLING
// ======================

const keys = {};
let inputMode = localStorage.getItem("galaxyInputMode") || "WASD"; // "WASD", "Arrow", "Mouse"

let targetX = player.x;
let targetY = player.y;

// KEY DOWN
document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
    keys[event.code] = true;
});

// KEY UP
document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
    keys[event.code] = false;
});

// MOUSE & TOUCH LISTENERS
document.addEventListener("mousemove", (event) => {
    if (inputMode === "Mouse" && typeof canvas !== "undefined") {
        const rect = canvas.getBoundingClientRect();
        targetX = event.clientX - rect.left - player.width / 2;
        targetY = event.clientY - rect.top - player.height / 2;
    }
});

document.addEventListener("touchmove", (event) => {
    if (inputMode === "Mouse" && typeof canvas !== "undefined" && event.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        targetX = event.touches[0].clientX - rect.left - player.width / 2;
        targetY = event.touches[0].clientY - rect.top - player.height / 2;
    }
}, { passive: true });



// ======================
// UPDATE PLAYER
// ======================

function updatePlayer() {
    if (typeof canvas === "undefined") return;

    // Update invulnerability states
    if (player.invulnerable && Date.now() > player.invulnerableTimer) {
        player.invulnerable = false;
    }
    if (player2.active && player2.invulnerable && Date.now() > player2.invulnerableTimer) {
        player2.invulnerable = false;
    }

    // Update weapon upgrade duration timers (5 seconds duration)
    if (player.weaponLevel > 1 && player.weaponTimer && Date.now() > player.weaponTimer) {
        player.weaponLevel = 1;
    }
    if (player2.active && player2.weaponLevel > 1 && player2.weaponTimer && Date.now() > player2.weaponTimer) {
        player2.weaponLevel = 1;
    }

    // Block movement during stage intro banner
    if (typeof stageIntroActive !== "undefined" && stageIntroActive) {
        player.tilt = 0;
        if (player2.active) {
            player2.tilt = 0;
        }
        return;
    }

    // Cutscene auto-pilot flight upon defeating boss
    if (playerFlyingUp) {
        player.y -= 3.5;
        player.tilt = 0;
        if (player2.active && player2.hp > 0) {
            player2.y -= 3.5;
            player2.tilt = 0;
        }

        // Trigger next level when players fly off-screen
        const p1Off = player.y + player.height < 0;
        const p2Off = !player2.active || player2.hp <= 0 || player2.y + player2.height < 0;
        
        if (p1Off && p2Off) {
            playerFlyingUp = false;
            if (typeof advanceLevel === "function") {
                advanceLevel();
            }
        }
        return; // Skip normal boundaries clamping and input checks
    }

    const minY = canvas.height / 2;
    const maxY = canvas.height - player.height - 100;

    // Poll gamepad input for movement
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const activeGps = [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            activeGps.push(gamepads[i]);
        }
    }
    const gp1 = activeGps[0] || null;
    const gp2 = activeGps[1] || null;

    let gp1MoveX = 0, gp1MoveY = 0;
    if (gp1) {
        const deadzone = 0.15;
        if (Math.abs(gp1.axes[0]) > deadzone) gp1MoveX = gp1.axes[0];
        if (Math.abs(gp1.axes[1]) > deadzone) gp1MoveY = gp1.axes[1];
    }

    let gp2MoveX = 0, gp2MoveY = 0;
    if (gp2) {
        const deadzone = 0.15;
        if (Math.abs(gp2.axes[0]) > deadzone) gp2MoveX = gp2.axes[0];
        if (Math.abs(gp2.axes[1]) > deadzone) gp2MoveY = gp2.axes[1];
    }

    // P1 Movement & Tilt Target
    let targetTilt1 = 0;
    if (health > 0) {
        if (inputMode === "Gamepad") {
            // Gamepad Analog control
            if (gp1MoveX !== 0 || gp1MoveY !== 0) {
                player.x += gp1MoveX * player.speed;
                player.y += gp1MoveY * player.speed;
                targetTilt1 = gp1MoveX * 0.25;
            }
        } else {
            // Keyboard movement checks (allowing both WASD and Arrows in single-player for convenience)
            const moveUp = keys["w"] || keys["W"] || (keys["ArrowUp"] && !player2.active && inputMode !== "Mouse");
            const moveDown = keys["s"] || keys["S"] || (keys["ArrowDown"] && !player2.active && inputMode !== "Mouse");
            const moveLeft = keys["a"] || keys["A"] || (keys["ArrowLeft"] && !player2.active && inputMode !== "Mouse");
            const moveRight = keys["d"] || keys["D"] || (keys["ArrowRight"] && !player2.active && inputMode !== "Mouse");

            if (inputMode === "Mouse") {
                // Smoothly follow mouse
                const dx = targetX - player.x;
                player.x += dx * 0.15;
                player.y += (targetY - player.y) * 0.15;
                if (Math.abs(dx) > 5) {
                    targetTilt1 = clamp(dx * 0.015, -0.25, 0.25);
                }
            } else {
                // Keyboard control schema
                if (moveUp) player.y -= player.speed;
                if (moveDown) player.y += player.speed;
                if (moveLeft) {
                    player.x -= player.speed;
                    targetTilt1 = -0.25;
                }
                if (moveRight) {
                    player.x += player.speed;
                    targetTilt1 = 0.25;
                }
            }
        }

        // Limit screen boundaries (P1)
        player.x = clamp(player.x, 0, canvas.width - player.width);
        player.y = clamp(player.y, minY, maxY);

        // Emit P1 Thruster Particles
        if (typeof createThrusterParticle === "function" && Math.random() < 0.4) {
            createThrusterParticle(player.x + player.width / 2, player.y + player.height - 10, "#00ffff");
        }
    }

    player.tilt = player.tilt || 0;
    player.tilt += (targetTilt1 - player.tilt) * 0.1;

    // P2 Movement & Tilt Target
    if (player2.active && player2.hp > 0) {
        let targetTilt2 = 0;
        if (inputMode === "Gamepad" && (gp2MoveX !== 0 || gp2MoveY !== 0)) {
            // Gamepad Analog control
            player2.x += gp2MoveX * player2.speed;
            player2.y += gp2MoveY * player2.speed;
            targetTilt2 = gp2MoveX * 0.25;
        } else {
            if (keys["ArrowUp"]) player2.y -= player2.speed;
            if (keys["ArrowDown"]) player2.y += player2.speed;
            if (keys["ArrowLeft"]) {
                player2.x -= player2.speed;
                targetTilt2 = -0.25;
            }
            if (keys["ArrowRight"]) {
                player2.x += player2.speed;
                targetTilt2 = 0.25;
            }
        }

        // Limit screen boundaries (P2)
        player2.x = clamp(player2.x, 0, canvas.width - player2.width);
        player2.y = clamp(player2.y, minY, maxY);

        player2.tilt = player2.tilt || 0;
        player2.tilt += (targetTilt2 - player2.tilt) * 0.1;

        // Emit P2 Thruster Particles
        if (typeof createThrusterParticle === "function" && Math.random() < 0.4) {
            createThrusterParticle(player2.x + player2.width / 2, player2.y + player2.height - 10, "#ff7700");
        }
    }
}

// ======================
// VECTOR SHIP RENDERING
// ======================

function drawVectorShip(ctx, x, y, width, height, primaryColor, secondaryColor, tilt) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(tilt);

    // Glowing effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = primaryColor;

    // Thruster flame
    const flameHeight = 15 + Math.random() * 10;
    const flameGrad = ctx.createLinearGradient(0, height/2 - 10, 0, height/2 + flameHeight);
    flameGrad.addColorStop(0, "#ffffff");
    flameGrad.addColorStop(0.3, secondaryColor);
    flameGrad.addColorStop(1, "transparent");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-10, height/2 - 10);
    ctx.lineTo(0, height/2 + flameHeight);
    ctx.lineTo(10, height/2 - 10);
    ctx.closePath();
    ctx.fill();

    // Main Ship Body
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(width / 2, height / 3);
    ctx.lineTo(width / 4, height / 4);
    ctx.lineTo(0, height / 2);
    ctx.lineTo(-width / 4, height / 4);
    ctx.lineTo(-width / 2, height / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.moveTo(0, -height / 4);
    ctx.lineTo(width / 8, 0);
    ctx.lineTo(0, height / 6);
    ctx.lineTo(-width / 8, 0);
    ctx.closePath();
    ctx.fill();

    // Wing panel highlights
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-width / 3, height / 4);
    ctx.lineTo(-width / 8, height / 8);
    ctx.moveTo(width / 3, height / 4);
    ctx.lineTo(width / 8, height / 8);
    ctx.stroke();

    ctx.restore();
}

// ======================
// DRONE SUPPORT
// ======================

function updateAndDrawDrone(playerObj, color) {
    playerObj.droneAngle = (playerObj.droneAngle || 0) + 0.05;
    const distance = 65;
    const droneX = playerObj.x + playerObj.width / 2 + Math.cos(playerObj.droneAngle) * distance;
    const droneY = playerObj.y + playerObj.height / 2 + Math.sin(playerObj.droneAngle) * distance;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(droneX, droneY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(droneX, droneY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(" + (color === "#00ffff" ? "0,255,255" : "255,119,0") + ",0.15)";
    ctx.beginPath();
    ctx.moveTo(playerObj.x + playerObj.width/2, playerObj.y + playerObj.height/2);
    ctx.lineTo(droneX, droneY);
    ctx.stroke();
    ctx.restore();

    // Drone Shoot logic
    const now = Date.now();
    playerObj.lastDroneShot = playerObj.lastDroneShot || 0;
    const canShoot = (typeof areEnemiesInFormation === "function") ? areEnemiesInFormation() : true;
    if (canShoot && (now - playerObj.lastDroneShot > 600)) {
        bullets.push({
            width: 10,
            height: 25,
            x: droneX - 5,
            y: droneY - 15,
            speed: 12,
            vx: 0,
            isDroneLaser: true,
            color: color,
            isPlayer2: (playerObj === player2)
        });
        playerObj.lastDroneShot = now;
        if (typeof playSFX === "function") {
            playSFX(shootSound);
        }
    }
}

// ======================
// DRAW PLAYER
// ======================

function drawPlayer() {
    updatePlayer();

    // Draw P1 if alive
    if (health > 0) {
        ctx.save();
        
        // Blink effect if invulnerable
        if (player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        
        // Apply color filter based on chosen plane (only for vector ship fallback)
        const isUsingImage = playerImage.complete && playerImage.naturalWidth !== 0;
        if (!isUsingImage) {
            if (selectedPlane === "kencana") {
                ctx.filter = 'hue-rotate(130deg) saturate(1.8) brightness(1.2)';
            } else if (selectedPlane === "cendrawasih") {
                ctx.filter = 'hue-rotate(240deg) saturate(1.8) brightness(1.2)';
            } else {
                ctx.filter = 'none';
            }
        } else {
            ctx.filter = 'none';
        }

        if (player.shieldActive) {
            ctx.save();
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00ffff";
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            if (Date.now() > player.shieldTimer) {
                player.shieldActive = false;
            }
        }
        
        // Draw primary neon ship
        if (playerImage.complete && playerImage.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            ctx.rotate(player.tilt);
            
            // Add blue neon glow outline around the plane image!
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00ffff";
            
            ctx.drawImage(playerImage, -player.width/2, -player.height/2, player.width, player.height);
            ctx.restore();
        } else {
            const primaryColor = selectedPlane === "kencana" ? "#ffd700" : (selectedPlane === "cendrawasih" ? "#a855f7" : "#00ffff");
            const secondaryColor = selectedPlane === "kencana" ? "#ef4444" : (selectedPlane === "cendrawasih" ? "#00ffff" : "#7c3aed");
            drawVectorShip(ctx, player.x, player.y, player.width, player.height, primaryColor, secondaryColor, player.tilt);
        }
        
        // Restore filter context
        ctx.restore();

        // Draw Orbiting Drone
        if (player.droneActive) {
            const droneColor = selectedPlane === "kencana" ? "#ffd700" : (selectedPlane === "cendrawasih" ? "#a855f7" : "#00ffff");
            updateAndDrawDrone(player, droneColor);
        }
    }

    // Draw P2 if active and alive
    if (player2.active && player2.hp > 0) {
        ctx.save();
        
        // Blink effect if invulnerable
        if (player2.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        if (player2.shieldActive) {
            ctx.strokeStyle = "#ff7700";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ff7700";
            ctx.beginPath();
            ctx.arc(player2.x + player2.width/2, player2.y + player2.height/2, player2.width/2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            if (Date.now() > player2.shieldTimer) {
                player2.shieldActive = false;
            }
        }

        // Draw secondary neon ship
        if (typeof player2Image !== "undefined" && player2Image.complete && player2Image.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(player2.x + player2.width/2, player2.y + player2.height/2);
            ctx.rotate(player2.tilt);
            
            // Add blue neon glow outline around the player 2 plane image!
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00ffff";
            
            ctx.drawImage(player2Image, -player2.width/2, -player2.height/2, player2.width, player2.height);
            ctx.restore();
        } else {
            drawVectorShip(ctx, player2.x, player2.y, player2.width, player2.height, "#ff7700", "#ef4444", player2.tilt);
        }

        // Draw Orbiting Drone
        if (player2.droneActive) {
            updateAndDrawDrone(player2, "#ff7700");
        }
    }
}

// ======================
// PLAYER CENTER
// ======================

function getPlayerCenter() {
    return {
        x: player.x + player.width / 2,
        y: player.y
    };
}