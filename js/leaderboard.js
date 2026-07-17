// ==========================================================================
// KREDENSIAL DATABASE ONLINE (SUPABASE)
// ==========================================================================
// PENTING: Gantilah teks di bawah ini dengan URL dan Key dari proyek Supabase Anda!
const SUPABASE_URL = "https://hjlqacmgkmfktmddsmzv.supabase.co/rest/v1/leaderboard"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHFhY21na21ma3RtZGRzbXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzM4ODEsImV4cCI6MjA5OTcwOTg4MX0.PYfInK0qh9Go3aNZsU-L3zMNCExIljwKULbArbFSrNQ";

// Fungsi pembantu untuk mendeteksi apakah Supabase sudah di-setting atau belum
function isOnlineDBReady() {
    return SUPABASE_URL && 
           SUPABASE_URL !== "" && 
           SUPABASE_KEY && 
           SUPABASE_KEY !== "";
}

// Fungsi untuk mendapatkan URL endpoint Supabase secara aman (menghindari double slash dan double path)
function getSupabaseEndpoint(path) {
    let baseUrl = SUPABASE_URL;
    
    // Jika user memasukkan URL lengkap sampai /leaderboard atau /rest/v1, kita bersihkan agar hanya menyisakan domain utamanya saja
    if (baseUrl.includes(".supabase.co")) {
        const parts = baseUrl.split(".supabase.co");
        baseUrl = parts[0] + ".supabase.co";
    }
    
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}/rest/v1${cleanPath}`;
}

// ==========================================================================
// FUNGSI MENYIMPAN SKOR (ONLINE DENGAN FALLBACK LOKAL)
// ==========================================================================
async function saveLeaderboard(name, score) {
    // 1. Simpan Lokal terlebih dahulu sebagai backup
    let board = JSON.parse(localStorage.getItem("galaxyLeaderboard")) || [];
    
    // Cari nama pilot (case-insensitive)
    const existingIndex = board.findIndex(entry => entry.name.toLowerCase() === name.toLowerCase());
    
    if (existingIndex !== -1) {
        // Update skor hanya jika skor baru lebih tinggi
        if (score > board[existingIndex].score) {
            board[existingIndex].score = score;
            board[existingIndex].date = new Date().toLocaleDateString();
        }
    } else {
        board.push({
            name: name,
            score: score,
            date: new Date().toLocaleDateString()
        });
    }
    
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    localStorage.setItem("galaxyLeaderboard", JSON.stringify(board));

    // 2. Jika Supabase siap, periksa dan simpan secara online
    if (isOnlineDBReady()) {
        try {
            // Cek apakah data pilot dengan nama tersebut sudah ada di database online
            const getEndpoint = getSupabaseEndpoint(`leaderboard?name=ilike.${encodeURIComponent(name)}`);
            const getResponse = await fetch(getEndpoint, {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            if (getResponse.ok) {
                const data = await getResponse.json();
                if (data && data.length > 0) {
                    // Pilot sudah ada online. Cek apakah skor baru lebih tinggi
                    const existingRecord = data[0];
                    if (score > existingRecord.score) {
                        const patchEndpoint = getSupabaseEndpoint(`leaderboard?name=eq.${encodeURIComponent(existingRecord.name)}`);
                        const patchResponse = await fetch(patchEndpoint, {
                            method: "PATCH",
                            headers: {
                                "apikey": SUPABASE_KEY,
                                "Authorization": `Bearer ${SUPABASE_KEY}`,
                                "Content-Type": "application/json",
                                "Prefer": "return=representation"
                            },
                            body: JSON.stringify({ score: score })
                        });
                        if (patchResponse.ok) {
                            console.log("Skor online berhasil diperbarui di Supabase!");
                        } else {
                            console.error("Gagal memperbarui skor di Supabase");
                        }
                    } else {
                        console.log("Skor baru tidak lebih tinggi dari skor terbaik online.");
                    }
                } else {
                    // Pilot belum ada online. Tambah baru via POST
                    const postEndpoint = getSupabaseEndpoint("leaderboard");
                    const postResponse = await fetch(postEndpoint, {
                        method: "POST",
                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Authorization": `Bearer ${SUPABASE_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ name: name, score: score })
                    });
                    if (postResponse.ok) {
                        console.log("Skor online baru berhasil disimpan ke Supabase!");
                    } else {
                        console.error("Gagal menyimpan skor baru ke Supabase");
                    }
                }
            }
        } catch (error) {
            console.error("Gagal menghubungi Supabase (Offline/Masalah Jaringan):", error);
        }
    } else {
        console.log("Supabase belum dikonfigurasi. Skor disimpan di LocalStorage.");
    }
}

// ==========================================================================
// FUNGSI MEMUAT DAFTAR SKOR (ONLINE DENGAN FALLBACK LOKAL)
// ==========================================================================
async function loadLeaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;

    leaderboardList.innerHTML = "";

    // A. JIKA ONLINE READY: Ambil data dari Supabase
    if (isOnlineDBReady()) {
        try {
            const endpoint = getSupabaseEndpoint("leaderboard?select=name,score&order=score.desc&limit=5");
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const board = await response.json();
                renderLeaderboardList(board);
                return;
            } else {
                console.warn("Gagal mengambil data dari Supabase, memuat dari penyimpanan lokal...");
            }
        } catch (error) {
            console.error("Masalah koneksi ke Supabase, memuat dari penyimpanan lokal...", error);
        }
    }

    // B. JIKA OFFLINE / BELUM DI-SETTING: Ambil data dari LocalStorage
    console.log("Memuat papan peringkat dari penyimpanan lokal.");
    const board = JSON.parse(localStorage.getItem("galaxyLeaderboard")) || [];
    renderLeaderboardList(board);
}

// Fungsi pembantu untuk menggambar list di UI
function renderLeaderboardList(board) {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;

    for (let i = 0; i < 5; i++) {
        const player = board[i];
        const rankNum = `0${i + 1}`;
        let rankClass = i === 0 ? "rank-gold" : (i === 1 ? "rank-silver" : (i === 2 ? "rank-bronze" : "rank-normal"));

        if (player) {
            leaderboardList.innerHTML += `
            <li class="leaderboard-item ${rankClass}">
                <div class="rank-num">${rankNum}</div>
                <span class="pilot-name">${player.name}</span>
                <div class="leaderboard-divider"></div>
                <div class="pilot-score">${player.score} <span class="pts-lbl">PTS</span></div>
            </li>
            `;
        } else {
            leaderboardList.innerHTML += `
            <li class="leaderboard-item empty-rank">
                <div class="rank-num">${rankNum}</div>
                <span class="pilot-name">[ KOSONG ]</span>
                <div class="leaderboard-divider"></div>
                <div class="pilot-score">-</div>
            </li>
            `;
        }
    }
}

// ==========================================================================
// FUNGSI MEMERIKSA DUPLIKASI NAMA SECARA ONLINE (SUPABASE)
// ==========================================================================
async function checkPilotNameExists(name) {
    if (isOnlineDBReady()) {
        try {
            // Gunakan filter ilike (case-insensitive) untuk mencari pilot dengan nama tersebut
            const endpoint = getSupabaseEndpoint(`leaderboard?name=ilike.${encodeURIComponent(name)}`);
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Jika data yang dikembalikan memiliki panjang > 0, berarti nama sudah ada
                return data.length > 0;
            }
        } catch (error) {
            console.error("Gagal mengecek nama pilot di Supabase:", error);
        }
    }

    // Fallback: Jika database offline atau belum di-setting, cek di LocalStorage lokal
    const board = JSON.parse(localStorage.getItem("galaxyLeaderboard")) || [];
    return board.some(entry => entry.name.toLowerCase() === name.toLowerCase());
}