// ======================
// ITEM IMAGES
// ======================

const itemShieldImage = new Image();
itemShieldImage.src = "assets/images/powerups/shield.png";

const itemHeartImage = new Image();
itemHeartImage.src = "assets/images/ui/heart.png";

const itemWeaponImage = new Image();
itemWeaponImage.src = "assets/images/powerups/rapid_fire.png";

// ======================
// ITEMS ARRAY
// ======================

const items = [];

// ======================
// SPAWN ITEM
// ======================

function spawnItem(x, y) {
    // 30% chance to drop an item (increased for smoother, easier progression)
    if (Math.random() > 0.30) return;

    const r = Math.random();
    let type;
    let image;

    if (r < 0.35) {
        type = "health";
        image = itemHeartImage;
    } else if (r < 0.70) {
        type = "shield";
        image = itemShieldImage;
    } else {
        type = "weapon";
        image = itemWeaponImage;
    }

    items.push({
        x: x,
        y: y,
        width: 35,
        height: 35,
        type: type,
        image: image,
        speed: 2.5
    });
}

// ======================
// UPDATE ITEMS
// ======================

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Collision with player 1
        if (collision(item, player)) {
            applyItemEffect(item.type, player);
            items.splice(i, 1);
            continue;
        }

        // Collision with player 2
        if (player2.active && player2.hp > 0 && collision(item, player2)) {
            applyItemEffect(item.type, player2);
            items.splice(i, 1);
            continue;
        }

        // Off-screen check
        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }
}

// ======================
// APPLY ITEM EFFECT
// ======================

function applyItemEffect(type, playerObj) {
    if (typeof playSFX === "function") {
        playSFX(levelupSound);
    }

    if (type === "health") {
        // Medical Kit: increases health up to maxHP
        if (playerObj === player) {
            const maxHP = player.maxHP || 5;
            if (health < maxHP) {
                health++;
                updateHUD();
            }
        } else {
            const maxHP = player2.maxHP || 5;
            if (player2.hp < maxHP) {
                player2.hp++;
                updateHUD();
            }
        }
    } else if (type === "shield") {
        // Shield: invulnerable for 7 seconds
        playerObj.shieldActive = true;
        playerObj.shieldTimer = Date.now() + 7000;
    } else if (type === "weapon") {
        // Weapon Upgrade: upgrade weapon level for 5 seconds! (Capped at level 3, which is 3 bullets)
        if (playerObj.weaponLevel < 3) {
            playerObj.weaponLevel++;
        }
        playerObj.weaponTimer = Date.now() + 5000;
    }
}

// ======================
// DRAW ITEMS
// ======================

function drawItems() {
    items.forEach(item => {
        // Draw item image
        ctx.drawImage(item.image, item.x, item.y, item.width, item.height);

        // Draw outer glow based on type
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2 + 3, 0, Math.PI * 2);
        
        if (item.type === "health") {
            ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red
            ctx.shadowColor = "#ef4444";
        } else if (item.type === "shield") {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.7)"; // Cyan
            ctx.shadowColor = "#06b6d4";
        } else {
            ctx.strokeStyle = "rgba(234, 179, 8, 0.7)"; // Yellow
            ctx.shadowColor = "#eab308";
        }
        
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
    });
}