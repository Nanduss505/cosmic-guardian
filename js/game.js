// ==========================================================================
// SCREEN ELEMENTS
// ==========================================================================
const mainMenu = document.getElementById("mainMenu");
const modeScreen = document.getElementById("modeScreen");
const instructionScreen = document.getElementById("instructionScreen");
const usernameScreen = document.getElementById("usernameScreen");
const planetScreen = document.getElementById("planetScreen");
const settingsScreen = document.getElementById("settingsScreen");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const gameContainer = document.getElementById("gameContainer");
const gameOverPanel = document.getElementById("gameOverPanel");
const victoryPanel = document.getElementById("victoryPanel");

// HUD TEXTS & BARS
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const hudPilotName = document.getElementById("hudPilotName");
const hudRank = document.getElementById("hudRank");
const hpProgress = document.getElementById("hpProgress");
const levelProgressFill = document.getElementById("levelProgress");

// INPUTS & LABELS
const usernameInput = document.getElementById("usernameInput");
const charCounter = document.querySelector(".char-counter");
const controlBadge = document.getElementById("controlBadge");
const musicVolSlider = document.getElementById("musicVolSlider");
const sfxVolSlider = document.getElementById("sfxVolSlider");
const musicVolVal = document.getElementById("musicVolVal");
const sfxVolVal = document.getElementById("sfxVolVal");

// PREVIEW CANVAS
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas ? previewCanvas.getContext("2d") : null;
const previewControlLabel = document.getElementById("previewControlLabel");

// ==========================================================================
// CORE GAME VARIABLES
// ==========================================================================
let currentPlayer = "";
let score = 0;
let level = 1;
let health = 5; // Max 5 HP in this version
let gameRunning = false;
let gamePaused = false;
levelProgress = 0; // Declared in enemy.js, ranges 0 to 100

// Active selected stage in Planet Selection screen
let selectedPlanetStage = 1;

// Global canvas configuration
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let canvasSized = false;

// ==========================================================================
// STARFIELD SPACE EFFECTS (Arcade Backdrop)
// ==========================================================================
const starfieldContainer = document.getElementById("starfield");
let starfieldCanvas;
let starfieldCtx;
const stars = [];

function initStarfield() {
    starfieldCanvas = document.createElement("canvas");
    starfieldCanvas.style.position = "absolute";
    starfieldCanvas.style.top = "0";
    starfieldCanvas.style.left = "0";
    starfieldCanvas.style.width = "100%";
    starfieldCanvas.style.height = "100%";
    starfieldContainer.appendChild(starfieldCanvas);
    starfieldCtx = starfieldCanvas.getContext("2d");

    resizeStarfield();
    window.addEventListener("resize", () => {
        resizeStarfield();
        resizeCanvas();
    });

    // Populate stars
    stars.length = 0;
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * starfieldCanvas.width,
            y: Math.random() * starfieldCanvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.5 + 0.2,
            color: Math.random() < 0.2 ? "#00ffff" : (Math.random() < 0.1 ? "#7c3aed" : "#ffffff")
        });
    }

    animateStarfield();
}

function resizeStarfield() {
    if (starfieldCanvas) {
        starfieldCanvas.width = window.innerWidth;
        starfieldCanvas.height = window.innerHeight;
    }
}

function animateStarfield() {
    // Disabled falling-stars/snow effect to avoid visual clutter when shooting
    if (starfieldCtx && starfieldCanvas) {
        starfieldCtx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
    }
}

// Initialize on load
initStarfield();

// ==========================================================================
// RESIZE GAME CANVAS
// ==========================================================================
function resizeCanvas() {
    const previousWidth = canvas.width;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (typeof player !== "undefined") {
        if (canvasSized) {
            player.x = (player.x * canvas.width) / previousWidth;
        } else {
            player.x = canvas.width / 2 - player.width / 2;
        }
        player.y = canvas.height - player.height - 110;
        player.x = clamp(player.x, 0, canvas.width - player.width);
    }
    canvasSized = true;
}

// ==========================================================================
// PILOT RANKS / BADGES SYSTEM
// ==========================================================================
// ==========================================================================
// PILOT RANKS / BADGES SYSTEM
// ==========================================================================
function getPilotRank(score) {
    if (score >= 5000) {
        return { badge: "🏅 Legenda Kosmik", className: "badge-gold" };
    } else if (score >= 3000) {
        return { badge: "🏅 Pelindung Elit", className: "badge-purple" };
    } else if (score >= 1500) {
        return { badge: "🏅 Pembela Ulung", className: "badge-blue" };
    } else {
        return { badge: "🏅 Pilot Pemula", className: "badge-green" };
    }
}

// ==========================================================================
// HUD UPDATES
// ==========================================================================
function updateHUD() {
    if (scoreElement) scoreElement.textContent = score;
    
    // Map current levels to planet names
    let stageName = "Sintarnus";
    if (level === 1) stageName = "Sintarnus";
    else if (level === 2) stageName = "Mukhsinus";
    else if (level === 3) stageName = "Rengasinus";
    else stageName = `Tahap ${level}`;
    
    if (levelElement) levelElement.textContent = stageName;
    
    let pilotText = currentPlayer ? currentPlayer.toUpperCase() : "TIDAK DIKENAL";
    if (player2.active) {
        pilotText += " & WINGMAN";
    }
    if (hudPilotName) hudPilotName.textContent = pilotText;
    
    // Update badge/rank
    const rankInfo = getPilotRank(score);
    if (hudRank) {
        hudRank.textContent = rankInfo.badge;
        hudRank.className = "hud-val " + rankInfo.className;
    }

    // Health Bar P1
    if (hpProgress) {
        const maxHP = player.maxHP || 5;
        const hpPercent = clamp((health / maxHP) * 100, 0, 100);
        hpProgress.style.width = `${hpPercent}%`;
    }

    // Health Bar P2
    const p2HPWrapper = document.getElementById("p2HPWrapper");
    const hpProgressP2 = document.getElementById("hpProgressP2");
    if (player2.active) {
        if (p2HPWrapper) p2HPWrapper.classList.remove("hidden");
        if (hpProgressP2) {
            const hpPercentP2 = clamp((player2.hp / 5) * 100, 0, 100);
            hpProgressP2.style.width = `${hpPercentP2}%`;
        }
    } else {
        if (p2HPWrapper) p2HPWrapper.classList.add("hidden");
    }

    // Level Progress Bar
    if (levelProgressFill) {
        levelProgressFill.style.width = `${levelProgress}%`;
    }

    // P1 Ult Bar
    const ultProgressP1 = document.getElementById("ultProgressP1");
    if (ultProgressP1) {
        ultProgressP1.style.width = `${player.ultMeter}%`;
    }

    // P2 Ult Bar
    const ultP2Wrapper = document.getElementById("ultP2Wrapper");
    const ultProgressP2 = document.getElementById("ultProgressP2");
    if (player2.active) {
        if (ultP2Wrapper) ultP2Wrapper.classList.remove("hidden");
        if (ultProgressP2) {
            ultProgressP2.style.width = `${player2.ultMeter}%`;
        }
    } else {
        if (ultP2Wrapper) ultP2Wrapper.classList.add("hidden");
    }
}

// ==========================================================================
// NAVIGATION SCREEN CONTROLLERS
// ==========================================================================
function showScreen(screen) {
    const screens = [mainMenu, modeScreen, instructionScreen, usernameScreen, planetScreen, settingsScreen, leaderboardScreen, gameContainer, gameOverPanel, victoryPanel];
    screens.forEach(s => {
        if (s) s.classList.add("hidden");
    });
    if (screen) screen.classList.remove("hidden");
    
    updateBodyBackground();
}

function updateBodyBackground() {
    // Remove all background classes first
    document.body.classList.remove("bg-main", "bg-stage1", "bg-stage2", "bg-stage3");
    
    const isPlaying = gameContainer && !gameContainer.classList.contains("hidden");
    if (gameRunning && isPlaying) {
        // Map current level to stage backgrounds
        if (level === 1) {
            document.body.classList.add("bg-stage1");
        } else if (level === 2) {
            document.body.classList.add("bg-stage2");
        } else if (level === 3) {
            document.body.classList.add("bg-stage3");
        } else {
            document.body.classList.add("bg-stage1");
        }
    } else {
        // Fallback to background_main for all menus and panels
        document.body.classList.add("bg-main");
    }
}

// Main Menu buttons
document.getElementById("startMenuBtn").onclick = () => {
    showScreen(modeScreen);
};

// ==========================================================================
// PLANE CAROUSEL DATA & SELECTION
// ==========================================================================
const planeData = [
    {
        id: "garuda",
        name: "Garuda Striker",
        desc: "Pesawat serang standar yang lincah dan seimbang.",
        speed: 8,
        hp: 5,
        img: "assets/images/player/pesawat_1.png",
        color: "#00ffff",
        secondaryColor: "#7c3aed"
    },
    {
        id: "kencana",
        name: "Kencana Defender",
        desc: "Lambat namun memiliki lambung baja yang sangat kuat.",
        speed: 6,
        hp: 7,
        img: "assets/images/player/pesawat_2.png",
        color: "#ffd700",
        secondaryColor: "#ef4444"
    },
    {
        id: "cendrawasih",
        name: "Cendrawasih Interceptor",
        desc: "Kecepatan sangat tinggi untuk menghindari tembakan musuh.",
        speed: 10,
        hp: 4,
        img: "assets/images/player/pesawat_3.png",
        color: "#a855f7",
        secondaryColor: "#00ffff"
    }
];

let currentPlaneIndex = 0;

function updatePlaneSelection(index) {
    if (index < 0) index = planeData.length - 1;
    if (index >= planeData.length) index = 0;
    currentPlaneIndex = index;
    
    const activePlane = planeData[currentPlaneIndex];
    selectedPlane = activePlane.id;

    // Set active color CSS variable globally on document element for dynamic themed panel highlights
    const root = document.documentElement;
    root.style.setProperty("--active-color", activePlane.color);
    const rgb = activePlane.id === "kencana" ? "255, 215, 0" : (activePlane.id === "cendrawasih" ? "168, 85, 247" : "0, 255, 255");
    root.style.setProperty("--active-color-rgb", rgb);
    
    // Update playerImage src (defined globally in player.js)
    if (typeof playerImage !== "undefined") {
        playerImage.src = activePlane.img;
    }
    
    // Update showcase UI elements
    const planeImgEl = document.getElementById("carouselPlaneImg");
    const planeNameEl = document.getElementById("carouselPlaneName");
    const planeDescEl = document.getElementById("carouselPlaneDesc");
    const planeStatEl = document.getElementById("carouselPlaneStat");
    const pilotIconImg = document.getElementById("pilotIconImg");
    
    if (planeImgEl) planeImgEl.src = activePlane.img;
    if (planeNameEl) {
        planeNameEl.textContent = activePlane.name;
        planeNameEl.style.color = activePlane.color;
        planeNameEl.style.textShadow = `0 0 10px ${activePlane.color}`;
    }
    if (planeDescEl) planeDescEl.textContent = activePlane.desc;
    
    if (planeStatEl) {
        // Render beautiful progress bars
        planeStatEl.innerHTML = `
            <div class="stat-bar-row">
                <span class="stat-bar-label">KECEPATAN</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${activePlane.speed * 10}%; background-color: ${activePlane.color}; box-shadow: 0 0 10px ${activePlane.color};"></div>
                </div>
                <span class="stat-bar-value" style="color: ${activePlane.color}">${activePlane.speed}/10</span>
            </div>
            <div class="stat-bar-row">
                <span class="stat-bar-label">HP MAKSIMAL</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${activePlane.hp * 10}%; background-color: ${activePlane.color}; box-shadow: 0 0 10px ${activePlane.color};"></div>
                </div>
                <span class="stat-bar-value" style="color: ${activePlane.color}">${activePlane.hp}/10</span>
            </div>
        `;
    }
    
    // Update the pilot icon at the top of selection screen (replacing the old rocket emoji)
    if (pilotIconImg) {
        pilotIconImg.src = activePlane.img;
        pilotIconImg.style.filter = `drop-shadow(0 0 15px ${activePlane.color})`;
    }

    // Sync modern selector cards
    document.querySelectorAll(".plane-card-modern").forEach((card, idx) => {
        if (idx === currentPlaneIndex) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }
    });
}

// Attach arrow click events
document.getElementById("prevPlaneBtn").onclick = () => {
    updatePlaneSelection(currentPlaneIndex - 1);
    if (typeof playSFX === "function" && typeof shootSound !== "undefined") {
        playSFX(shootSound);
    }
};

document.getElementById("nextPlaneBtn").onclick = () => {
    updatePlaneSelection(currentPlaneIndex + 1);
    if (typeof playSFX === "function" && typeof shootSound !== "undefined") {
        playSFX(shootSound);
    }
};

// Bind modern card selection clicks
document.querySelectorAll(".plane-card-modern").forEach(card => {
    card.onclick = () => {
        const index = parseInt(card.getAttribute("data-plane-index"));
        updatePlaneSelection(index);
        if (typeof playSFX === "function" && typeof shootSound !== "undefined") {
            playSFX(shootSound);
        }
    };
});

// Initialize selection on load
setTimeout(() => {
    updatePlaneSelection(0);
}, 100);

document.getElementById("confirmPlaneBtn").onclick = () => {
    player2.active = false; // Always single-player in this mode
    showScreen(usernameScreen);
    usernameInput.value = "";
    charCounter.textContent = "0 / 12 Karakter Maksimal";
    usernameInput.focus();
    // Start drawing chosen plane in registration preview
    startRegPlanePreview(selectedPlane);
};

document.getElementById("modeBackBtn").onclick = () => {
    showScreen(mainMenu);
};

document.getElementById("howToPlayBtn").onclick = () => {
    showScreen(instructionScreen);
    startPreviewClip();
    
    // Highlight the active control scheme row
    const rowKeyboard = document.querySelector(".ctrl-row-keyboard");
    const rowMouse = document.querySelector(".ctrl-row-mouse");
    const rowGamepad = document.querySelector(".ctrl-row-gamepad");
    
    if (rowKeyboard) rowKeyboard.classList.remove("highlight-control");
    if (rowMouse) rowMouse.classList.remove("highlight-control");
    if (rowGamepad) rowGamepad.classList.remove("highlight-control");
    
    if (inputMode === "Gamepad") {
        if (rowGamepad) rowGamepad.classList.add("highlight-control");
    } else if (inputMode === "Mouse") {
        if (rowMouse) rowMouse.classList.add("highlight-control");
    } else {
        if (rowKeyboard) rowKeyboard.classList.add("highlight-control");
    }
};

document.getElementById("leaderboardMenuBtn").onclick = () => {
    loadLeaderboard();
    showScreen(leaderboardScreen);
};

document.getElementById("settingsMenuBtn").onclick = () => {
    showScreen(settingsScreen);
    // Initialize volume values on labels
    musicVolVal.textContent = `${Math.round(musicVolume * 100)}%`;
    sfxVolVal.textContent = `${Math.round(sfxVolume * 100)}%`;
    musicVolSlider.value = musicVolume;
    sfxVolSlider.value = sfxVolume;
    
    // Highlight inputMode button
    document.querySelectorAll(".mode-btn[data-mode]").forEach(btn => {
        if (btn.getAttribute("data-mode") === inputMode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Highlight graphics quality button
    document.querySelectorAll(".graphics-btn").forEach(btn => {
        if (btn.getAttribute("data-graphics") === graphicsQuality) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    updateControlBadgeText();
};

// Back button handlers
document.getElementById("regBackBtn").onclick = () => showScreen(modeScreen); // Back to plane selection
document.getElementById("planetBackBtn").onclick = () => showScreen(usernameScreen);
document.getElementById("leaderboardBackBtn").onclick = () => showScreen(mainMenu);
document.getElementById("settingsBackBtn").onclick = () => {
    showScreen(mainMenu);
};
document.getElementById("instructionBtn").onclick = () => {
    stopPreviewClip();
    showScreen(mainMenu);
};

// ==========================================================================
// SYSTEM CUSTOM ALERT DIALOG POPUP
// ==========================================================================
function showCustomAlert(message) {
    const modal = document.getElementById("customAlertModal");
    const msgElem = document.getElementById("customAlertMessage");
    if (modal && msgElem) {
        msgElem.innerHTML = message;
        modal.classList.remove("hidden");
    }
}

// Handler tombol kembali pada modal kustom alert
const alertCloseBtn = document.getElementById("customAlertCloseBtn");
if (alertCloseBtn) {
    alertCloseBtn.onclick = () => {
        const modal = document.getElementById("customAlertModal");
        if (modal) {
            modal.classList.add("hidden");
        }
    };
}

// ==========================================================================
// PILOT USERNAME INPUT & REGISTRATION
// ==========================================================================
usernameInput.oninput = () => {
    const val = usernameInput.value;
    charCounter.textContent = `${val.length} / 12 Karakter Maksimal`;
};

document.getElementById("savePlayerBtn").onclick = async () => {
    const username = usernameInput.value.trim();
    
    // 1. Validasi: Tidak boleh kosong
    if (username === "") {
        showCustomAlert("⚠️ Nama Pilot tidak boleh kosong!");
        return;
    }
    
    // 2. Validasi: Maksimum 12 karakter
    if (username.length > 12) {
        showCustomAlert("⚠️ Nama Pilot tidak boleh lebih dari 12 karakter!");
        return;
    }
    
    // Ubah status tombol untuk memberi indikasi loading saat memproses data online
    const saveBtn = document.getElementById("savePlayerBtn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "MEMPROSES...";
    saveBtn.disabled = true;
    
    // 3. Validasi: Tidak boleh sama/duplikat (diperiksa secara online di Supabase & lokal)
    try {
        const isDuplicate = await checkPilotNameExists(username);
        if (isDuplicate) {
            showCustomAlert("⚠️ Nama Pilot ini sudah terdaftar di Papan Peringkat! Silakan gunakan Call Sign lain.");
            return;
        }
        
        currentPlayer = username;
        usernameInput.blur();
        showScreen(gameContainer); // Directly go to game container, bypassing planetScreen!
        startGameAtLevel(1);       // Start game at level 1 (Stage 1)
    } catch (error) {
        console.error("Gagal melakukan registrasi pilot:", error);
        showCustomAlert("⚠️ Terjadi kesalahan saat memeriksa nama. Coba lagi.");
    } finally {
        // Kembalikan tombol ke keadaan semula
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
};

// ==========================================================================
// REGISTRATION PLANE LIVE PREVIEW
// ==========================================================================
function startRegPlanePreview(planeType) {
    let primaryColor = "#00ffff";
    let planeName = "GARUDA STRIKER";
    let planeImg = "assets/images/player/pesawat_1.png";

    if (planeType === "kencana") {
        primaryColor = "#ffd700";
        planeName = "KENCANA DEFENDER";
        planeImg = "assets/images/player/pesawat_2.png";
    } else if (planeType === "cendrawasih") {
        primaryColor = "#a855f7";
        planeName = "CENDRAWASIH INTERCEPTOR";
        planeImg = "assets/images/player/pesawat_3.png";
    }

    const regPlaneNameEl = document.getElementById("regPlaneName");
    if (regPlaneNameEl) {
        regPlaneNameEl.textContent = planeName;
        regPlaneNameEl.style.color = primaryColor;
    }

    const pilotIconImg = document.getElementById("pilotIconImg");
    if (pilotIconImg) {
        pilotIconImg.src = planeImg;
        pilotIconImg.style.filter = `drop-shadow(0 0 15px ${primaryColor})`;
    }

    const usernamePanel = document.querySelector(".username-panel");
    if (usernamePanel) {
        usernamePanel.style.setProperty("--active-color", primaryColor);
        const rgb = planeType === "kencana" ? "255, 215, 0" : (planeType === "cendrawasih" ? "168, 85, 247" : "0, 255, 255");
        usernamePanel.style.setProperty("--active-color-rgb", rgb);
    }
}

// ==========================================================================
// PLANET SELECTION (Bypassed but kept for compatibility)
// ==========================================================================
const planetCards = document.querySelectorAll(".planet-card");
planetCards.forEach(card => {
    card.onclick = () => {
        planetCards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedPlanetStage = parseInt(card.getAttribute("data-stage"));
    };
});

document.getElementById("launchMissionBtn").onclick = () => {
    showScreen(gameContainer);
    startGameAtLevel(1);
};

// ==========================================================================
// SETTINGS SLIDERS & OPTIONS
// ==========================================================================
musicVolSlider.oninput = () => {
    const vol = parseFloat(musicVolSlider.value);
    setMusicVolume(vol);
    musicVolVal.textContent = `${Math.round(vol * 100)}%`;
};

sfxVolSlider.oninput = () => {
    const vol = parseFloat(sfxVolSlider.value);
    setSFXVolume(vol);
    sfxVolVal.textContent = `${Math.round(vol * 100)}%`;
    // Trigger sound sample to let user hear
    playSFX(shootSound);
};

document.querySelectorAll(".mode-btn[data-mode]").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".mode-btn[data-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        inputMode = btn.getAttribute("data-mode");
        localStorage.setItem("galaxyInputMode", inputMode);
        updateControlBadgeText();
        // Also update preview text label inside How To Play
        if (previewControlLabel) {
            previewControlLabel.textContent = controlBadge.textContent;
        }
    };
});

document.querySelectorAll(".graphics-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".graphics-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        graphicsQuality = btn.getAttribute("data-graphics");
        localStorage.setItem("galaxyGraphicsQuality", graphicsQuality);
        glowEnabled = (graphicsQuality === "high");
    };
});

function updateControlBadgeText() {
    if (inputMode === "WASD") {
        controlBadge.textContent = "[ WASD ]";
    } else if (inputMode === "Arrow") {
        controlBadge.textContent = "[ ↑ ↓ ← → ]";
    } else if (inputMode === "Gamepad") {
        controlBadge.textContent = "🎮";
    } else {
        controlBadge.textContent = "🖱";
    }
}

// ==========================================================================
// BRIEFING PREVIEW CLIP ANIMATION (Autopilot Simulation)
// ==========================================================================
let previewTimer = 0;
let previewShip = { x: 90, y: 90, dirX: 1, dirY: 0 };
let previewActive = false;
let previewBullets = [];

function startPreviewClip() {
    previewActive = true;
    previewTimer = 0;
    previewShip = { x: 90, y: 90, dirX: 1, dirY: 0 };
    previewBullets = [];
    if (previewControlLabel) {
        previewControlLabel.textContent = inputMode === "WASD" ? "[ WASD ]" : (inputMode === "Arrow" ? "[ ↑ ↓ ← → ]" : "🖱");
    }
    animatePreviewClip();
}

function stopPreviewClip() {
    previewActive = false;
}

function animatePreviewClip() {
    if (!previewActive || !previewCtx) return;

    previewCtx.fillStyle = "#020617";
    previewCtx.fillRect(0, 0, 180, 180);

    // Draw grid background
    previewCtx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    previewCtx.lineWidth = 1;
    for (let i = 20; i < 180; i += 20) {
        previewCtx.beginPath();
        previewCtx.moveTo(i, 0);
        previewCtx.lineTo(i, 180);
        previewCtx.moveTo(0, i);
        previewCtx.lineTo(180, i);
        previewCtx.stroke();
    }

    // Move preview ship automatically in 4 directions sequence
    previewTimer++;
    const step = 80;
    if (previewTimer % step === 0) {
        // Change direction every 80 frames
        const dirs = [
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 0, dy: -1 }  // Up
        ];
        const dirIndex = Math.floor(previewTimer / step) % dirs.length;
        previewShip.dirX = dirs[dirIndex].dx;
        previewShip.dirY = dirs[dirIndex].dy;
    }

    previewShip.x += previewShip.dirX * 0.8;
    previewShip.y += previewShip.dirY * 0.8;

    // Clamp
    previewShip.x = Math.max(20, Math.min(160, previewShip.x));
    previewShip.y = Math.max(20, Math.min(160, previewShip.y));

    // Spawn preview bullets
    if (previewTimer % 25 === 0) {
        previewBullets.push({ x: previewShip.x, y: previewShip.y - 12 });
    }

    // Update and draw preview bullets
    previewCtx.save();
    previewCtx.fillStyle = "#00ffff";
    previewCtx.shadowBlur = 8;
    previewCtx.shadowColor = "#00ffff";
    for (let i = previewBullets.length - 1; i >= 0; i--) {
        const b = previewBullets[i];
        b.y -= 4; // Move bullet upwards
        previewCtx.beginPath();
        previewCtx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        previewCtx.fill();
        if (b.y < 0) {
            previewBullets.splice(i, 1);
        }
    }
    previewCtx.restore();

    // Draw path visual trail
    previewCtx.save();
    previewCtx.shadowBlur = 10;
    previewCtx.shadowColor = "#00ffff";

    // Draw mini ship
    previewCtx.fillStyle = "#00ffff";
    previewCtx.beginPath();
    previewCtx.moveTo(previewShip.x, previewShip.y - 12);
    previewCtx.lineTo(previewShip.x - 10, previewShip.y + 10);
    previewCtx.lineTo(previewShip.x + 10, previewShip.y + 10);
    previewCtx.closePath();
    previewCtx.fill();

    // Draw little fire thrust
    if (previewShip.dirY <= 0) {
        previewCtx.fillStyle = "#ff007f";
        previewCtx.beginPath();
        previewCtx.arc(previewShip.x, previewShip.y + 12, 4 + Math.sin(previewTimer * 0.5) * 2, 0, Math.PI * 2);
        previewCtx.fill();
    }
    
    previewCtx.restore();

    requestAnimationFrame(animatePreviewClip);
}

// ==========================================================================
// START & RUN GAME CORE
// ==========================================================================
function startGameAtLevel(startingLevel) {
    if (gameRunning) return;

    if (document.activeElement) {
        document.activeElement.blur();
    }

    score = 0;
    level = startingLevel;
    levelProgress = 0;
    if (typeof playerFlyingUp !== "undefined") {
        playerFlyingUp = false;
    }

    let startingSpeed = 8;
    let startingMaxHP = 5;
    if (selectedPlane === "kencana") {
        startingSpeed = 6;
        startingMaxHP = 7;
    } else if (selectedPlane === "cendrawasih") {
        startingSpeed = 10;
        startingMaxHP = 4;
    }

    health = startingMaxHP;

    if (typeof player !== "undefined") {
        player.speed = startingSpeed;
        player.maxHP = startingMaxHP;
        player.weaponLevel = 1;
        player.shieldActive = false;
        player.shieldTimer = 0;
        player.rapidFireActive = false;
        player.rapidFireTimer = 0;
        player.doubleScoreActive = false;
        player.doubleScoreTimer = 0;
        player.tilt = 0;
        player.ultMeter = 0;
        player.droneActive = false;
        player.beamActive = false;
        player.novaActive = false;
    }

    if (typeof player2 !== "undefined") {
        player2.hp = 5;
        player2.weaponLevel = 1;
        player2.shieldActive = false;
        player2.shieldTimer = 0;
        player2.rapidFireActive = false;
        player2.rapidFireTimer = 0;
        player2.doubleScoreActive = false;
        player2.doubleScoreTimer = 0;
        player2.tilt = 0;
        player2.ultMeter = 0;
        player2.droneActive = false;
        player2.beamActive = false;
        player2.novaActive = false;
    }

    // Force WASD mode in Co-Op so Arrow keys can control Player 2
    if (player2.active) {
        inputMode = "WASD";
    }

    // Reset and prepare stages
    resetEnemyStage();
    prepareLevelStage(level);

    gameRunning = true;
    gamePaused = false;
    gpStartPressedLast = false;

    // Start background music and stop menu music
    try {
        if (typeof stopMenuMusic === "function") {
            stopMenuMusic();
        }
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("BG music play prevented:", e));
    } catch (e) {}

    updateHUD();
    updateBodyBackground();
    resizeCanvas();
    
    requestAnimationFrame(gameLoop);
}

// Level system progression
function advanceLevel() {
    level++;
    if (level > 3) {
        // Complete the entire campaign (3 stages total)
        victoryGame();
        return;
    }

    if (typeof levelupSound !== "undefined") {
        playSFX(levelupSound);
    }

    // Reposition player(s) at the bottom center of the screen
    if (typeof player !== "undefined" && canvas) {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 110;
    }
    if (typeof player2 !== "undefined" && player2.active && canvas) {
        player2.x = canvas.width / 2 + 50;
        player2.y = canvas.height - player2.height - 110;
        player2.hp = 5; // Restore Player 2 HP
    }

    prepareLevelStage(level);
    updateHUD();
    updateBodyBackground();
}

let gpStartPressedLast = false;

function togglePause() {
    gamePaused = !gamePaused;
    const pauseBtn = document.getElementById("pauseBtn");
    if (gamePaused) {
        if (pauseBtn) pauseBtn.textContent = "LANJUTKAN";
        bgMusic.pause();
    } else {
        if (pauseBtn) pauseBtn.textContent = "JEDA";
        try {
            bgMusic.play().catch(e => {});
        } catch (e) {}
    }
    if (pauseBtn) pauseBtn.blur();
}

function pollGamepadPause() {
    if (inputMode !== "Gamepad") return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            gp = gamepads[i];
            break;
        }
    }

    if (gp && gp.buttons && gp.buttons[9]) {
        const startPressed = gp.buttons[9].pressed || gp.buttons[9].value > 0.5;
        // Edge trigger: toggle on not-pressed -> pressed transition
        if (startPressed && !gpStartPressedLast) {
            togglePause();
        }
        gpStartPressedLast = startPressed;
    } else {
        gpStartPressedLast = false;
    }
}

// Pause button
document.getElementById("pauseBtn").onclick = () => {
    togglePause();
};

// ==========================================================================
// DAMAGE PLAYER
// ==========================================================================
function damagePlayer(playerObj) {
    const isP2 = (playerObj === player2);

    // If player is already invulnerable, ignore damage
    if (playerObj.invulnerable) {
        return;
    }

    if (playerObj.shieldActive) {
        playerObj.shieldActive = false;
        playerObj.shieldTimer = 0;
        if (typeof playSFX === "function") {
            playSFX(damageSound);
        }
        // Give a short 0.8s grace period after shield breaks
        playerObj.invulnerable = true;
        playerObj.invulnerableTimer = Date.now() + 800;
        return;
    }

    if (!isP2) {
        health--;
    } else {
        playerObj.hp--;
    }

    // Grant 1.2 seconds of invulnerability
    playerObj.invulnerable = true;
    playerObj.invulnerableTimer = Date.now() + 1200;

    // Trigger Screen Shake (Feature 5)
    triggerScreenShake(12);

    if (typeof playSFX === "function") {
        playSFX(damageSound);
    }
    updateHUD();

    // Check game over condition
    if (!player2.active) {
        if (health <= 0) {
            gameOver();
        }
    } else {
        if (health <= 0 && player2.hp <= 0) {
            gameOver();
        }
    }
}

// ==========================================================================
// GAME OVER & VICTORY SCREEN TRIGGERS
// ==========================================================================
function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    playSFX(gameoverSound);
    saveLeaderboard(currentPlayer, score);
    
    const rank = getPilotRank(score).badge;
    
    document.getElementById("gameOverStatsCard").innerHTML = `
        <div class="stats-row">
            <span class="stats-label">NAMA PILOT</span>
            <span class="stats-value highlight-blue">${currentPlayer.toUpperCase()}</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">SEKTOR TERCAPAI</span>
            <span class="stats-value highlight-purple">TAHAP ${level}</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">SKOR AKHIR</span>
            <span class="stats-value highlight-gold">${score.toLocaleString()} POIN</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">PANGKAT KOSMIS</span>
            <span class="stats-value highlight-green">${rank}</span>
        </div>
    `;
    
    showScreen(gameOverPanel);
}

function victoryGame() {
    gameRunning = false;
    bgMusic.pause();
    playSFX(victorySound);
    saveLeaderboard(currentPlayer, score);

    const rank = getPilotRank(score).badge;

    document.getElementById("victoryStatsCard").innerHTML = `
        <div class="stats-row">
            <span class="stats-label">NAMA PILOT</span>
            <span class="stats-value highlight-blue">${currentPlayer.toUpperCase()}</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">KAMPANYE STAGE</span>
            <span class="stats-value highlight-green">BERHASIL DIBERSIHKAN</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">SKOR AKHIR</span>
            <span class="stats-value highlight-gold">${score.toLocaleString()} POIN</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">PANGKAT KOSMIS</span>
            <span class="stats-value highlight-purple">${rank}</span>
        </div>
    `;
    
    showScreen(victoryPanel);
}

// Panel Button handlers
document.getElementById("restartBtn").onclick = () => {
    if (typeof stopResultSounds === "function") stopResultSounds();
    showScreen(gameContainer);
    startGameAtLevel(1); // Direct restart at Stage 1 (Level 1)
};

document.getElementById("menuBtn").onclick = () => {
    if (typeof stopResultSounds === "function") stopResultSounds();
    showScreen(mainMenu);
    if (typeof playMenuMusic === "function") playMenuMusic();
};

document.getElementById("victoryRestartBtn").onclick = () => {
    if (typeof stopResultSounds === "function") stopResultSounds();
    showScreen(gameContainer);
    startGameAtLevel(1); // Direct restart at Stage 1 (Level 1)
};

document.getElementById("victoryMenuBtn").onclick = () => {
    if (typeof stopResultSounds === "function") stopResultSounds();
    showScreen(mainMenu);
    if (typeof playMenuMusic === "function") playMenuMusic();
};

// ==========================================================================
// MAIN GAME LOOP
// ==========================================================================
// ==========================================================================
// SPECIAL WEAPON: HYPER BEAM & ULTIMATE BOMB SYSTEMS (Feature 2 & 4)
// ==========================================================================

function updateAndDrawBeams() {
    [player, player2].forEach(p => {
        if (p.active !== false && p.beamActive && (p === player ? health > 0 : player2.hp > 0)) {
            const beamWidth = 24;
            const beamX = p.x + p.width / 2 - beamWidth / 2;
            const color = (p === player) ? "#00ffff" : "#ff7700";
            
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            
            // Outer laser glow
            ctx.fillStyle = "rgba(" + (p === player ? "0,255,255" : "255,119,0") + ", 0.4)";
            ctx.fillRect(beamX - 6, 0, beamWidth + 12, p.y);
            
            // Inner core
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(beamX, 0, beamWidth, p.y);
            
            // Source energy flares
            ctx.fillStyle = color;
            for (let i = 0; i < 3; i++) {
                const rx = beamX + Math.random() * beamWidth;
                const ry = p.y - Math.random() * 20;
                ctx.beginPath();
                ctx.arc(rx, ry, Math.random() * 4 + 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Collision check: Laser beam vs Standard Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const en = enemies[i];
                if (en.x + en.width > beamX - 6 && en.x < beamX + beamWidth + 6 && en.y < p.y) {
                    en.hp -= 0.15;
                    if (en.hp <= 0) {
                        createExplosion(en.x, en.y);
                        score += en.score;
                        
                        // Ultimate charge
                        const shooter = p;
                        if (shooter.ultMeter < 100) {
                            shooter.ultMeter = Math.min(100, shooter.ultMeter + 8);
                        }

                        if (typeof spawnItem === "function") {
                            spawnItem(en.x + en.width/2 - 17, en.y + en.height/2 - 17);
                        }
                        enemies.splice(i, 1);
                        updateHUD();
                    }
                }
            }

            // Laser beam vs Asteroids
            for (let i = asteroids.length - 1; i >= 0; i--) {
                const ast = asteroids[i];
                if (ast.x + ast.width > beamX - 6 && ast.x < beamX + beamWidth + 6 && ast.y < p.y) {
                    ast.hp -= 0.2;
                    if (ast.hp <= 0) {
                        createExplosion(ast.x, ast.y);
                        score += ast.score;
                        if (typeof spawnItem === "function") {
                            spawnItem(ast.x + ast.width/2 - 17, ast.y + ast.height/2 - 17);
                        }
                        asteroids.splice(i, 1);
                        updateHUD();
                    }
                }
            }

            // Laser beam vs Boss
            if (boss && boss.x + boss.width > beamX - 6 && boss.x < beamX + beamWidth + 6 && boss.y < p.y) {
                boss.hp -= 0.08;
                if (boss.hp <= 0) {
                    score += 500;
                    createExplosion(boss.x + boss.width/2 - 130, boss.y + boss.height/2 - 130, 260);
                    bossDefeated = true;
                    boss = null;
                }
            }

            // Laser beam vs Enemy Bullets (vaporize them)
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const eb = enemyBullets[i];
                if (eb.x + eb.width > beamX && eb.x < beamX + beamWidth && eb.y < p.y) {
                    enemyBullets.splice(i, 1);
                }
            }
        }
    });
}



function gameLoop() {
    if (!gameRunning) return;

    pollGamepadPause();

    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Apply Screen Shake transformation (Feature 5)
    ctx.save();
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeDuration--;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Poll gamepad input for shooting
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const activeGps = [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) activeGps.push(gamepads[i]);
    }
    const gp1 = activeGps[0] || null;
    const gp2 = activeGps[1] || null;

    let gp1Shoot = false;
    if (inputMode === "Gamepad" && gp1 && gp1.buttons) {
        // PlayStation X is Button 0, Xbox X is Button 2
        gp1Shoot = (gp1.buttons[0] && (gp1.buttons[0].pressed || gp1.buttons[0].value > 0.5)) ||
                   (gp1.buttons[2] && (gp1.buttons[2].pressed || gp1.buttons[2].value > 0.5));
    }

    let gp2Shoot = false;
    if (inputMode === "Gamepad" && gp2 && gp2.buttons) {
        gp2Shoot = (gp2.buttons[0] && (gp2.buttons[0].pressed || gp2.buttons[0].value > 0.5)) ||
                   (gp2.buttons[2] && (gp2.buttons[2].pressed || gp2.buttons[2].value > 0.5));
    }

    // Continuous Shoot Key checking (moving and shooting simultaneously)
    const canPlayerShoot = (typeof areEnemiesInFormation === "function") ? areEnemiesInFormation() : true;

    if (health > 0) {
        player.beamActive = false;
        if (canPlayerShoot && (keys["Space"] || keys[" "] || gp1Shoot)) {
            if (player.weaponLevel >= 5) {
                player.beamActive = true;
            } else {
                shootBullet(player);
            }
        }
    }

    if (player2.active && player2.hp > 0) {
        player2.beamActive = false;
        if (canPlayerShoot && (keys["Enter"] || gp2Shoot)) {
            if (player2.weaponLevel >= 5) {
                player2.beamActive = true;
            } else {
                shootBullet(player2);
            }
        }
    }

    // Draw entities
    drawPlayer();
    updateBullets();
    drawBullets();
    updateEnemies();
    drawEnemies();
    updateItems();
    drawItems();
    
    // Laser update/draw
    updateAndDrawBeams();
    
    // Draw visual particles
    if (typeof updateAndDrawParticles === "function") {
        updateAndDrawParticles();
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// ==========================================================================
// LEVEL BOUNDARIES (clamp function)
// ==========================================================================
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Page load initialization
resizeCanvas();
updateHUD();
showScreen(mainMenu);
