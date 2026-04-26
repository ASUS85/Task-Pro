/**
 * TASKMANAGER PRO - LOGIQUE CLIENT
 * Complémentaire au style Glassmorphism & Animations
 */

const API = "http://localhost/tp_final/php/proxy.php";

// =======================
// INITIALISATION & SESSION
// =======================
 /*document.addEventListener("DOMContentLoaded", () => {
      checkUser();
     chargerTaches();
    
    // Animation d'entrée pour les éléments de la page
    document.body.style.opacity = "0";
    setTimeout(() => {
        document.body.style.transition = "opacity 0.6s ease";
        document.body.style.opacity = "1";
    }, 50);
});

 function checkUser() {
    const user = JSON.parse(localStorage.getItem("user"));
    const isAuthPage = window.location.pathname.includes("login") || window.location.pathname.includes("inscription");

    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    }

    const userNameEl = document.getElementById("userName");
    if (userNameEl && user) {
        userNameEl.innerHTML = `👋 <span style="color: var(--primary)">${user.nom}</span>`;
    }
}
 */

// =======================
// GESTION DU LOADER (ANIMÉ)
// =======================
function toggleLoader(show) {
    const loader = document.getElementById("loader");
    if (!loader) return;
    
    if (show) {
        loader.classList.remove("hidden");
        loader.style.animation = "fadeIn 0.3s ease forwards";
    } else {
        loader.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => loader.classList.add("hidden"), 300);
    }
}

// =======================
// CHARGER & AFFICHER LES TÂCHES
// =======================
async function chargerTaches() {
    const liste = document.getElementById("listeTaches");
    if (!liste) return;

    toggleLoader(true);

    try {
        const res = await fetch(API);
        const data = await res.json();

        if (Array.isArray(data)) {
            renderTaches(data);
            updateStats(data);
        }
    } catch (err) {
        notify("Erreur de connexion au serveur", "red");
    } finally {
        toggleLoader(false);
    }
}

function renderTaches(data) {
    const liste = document.getElementById("listeTaches");
    const filter = document.getElementById("filterStatus")?.value || "";
    const search = document.getElementById("search")?.value.toLowerCase() || "";

    liste.innerHTML = "";

    const tachesFiltrees = data.filter(t => 
        (!filter || t.statut === filter) && 
        (t.titre.toLowerCase().includes(search) || t.description.toLowerCase().includes(search))
    );

    if (tachesFiltrees.length === 0) {
        liste.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim)">Aucune tâche trouvée 🛸</td></tr>`;
        return;
    }

    tachesFiltrees.forEach((t, index) => {
        const tr = document.createElement("tr");
        tr.style.animation = `slideUp 0.4s ease forwards ${index * 0.05}s`; // Animation en cascade
        tr.style.opacity = "0";

        tr.innerHTML = `
            <td>#${t.id}</td>
            <td style="font-weight:bold">${t.titre}</td>
            <td style="color:var(--text-dim); font-size:0.9rem">${t.description}</td>
            <td><span class="status-${t.statut}">${t.statut.replace('_', ' ')}</span></td>
            <td>${t.assignee || "-"}</td>
            <td>${t.date_echeance || "-"}</td>
            <td>
                <button class="btn-icon" onclick="editTask(${t.id}, \`${t.titre}\`, \`${t.description}\`, \`${t.statut}\`)">✏️</button>
                <button class="btn-icon" onclick="deleteTask(${t.id})" style="background:rgba(255,0,0,0.1)">🗑️</button>
            </td>
        `;
        liste.appendChild(tr);
    });
}

// =======================
// ACTIONS (CRUD)
// =======================
const taskForm = document.getElementById("taskForm");
if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        toggleLoader(true);

        const id = document.getElementById("taskId").value;
        const payload = {
            action: id ? "update" : "create",
            id: id,
            titre: document.getElementById("titre").value,
            description: document.getElementById("description").value,
            statut: document.getElementById("statut").value,
            date_echeance: document.getElementById("date_echeance").value,
            assignee: document.getElementById("assignee").value
        };

        try {
            const res = await fetch(API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success || res.ok) {
                notify(id ? "Tâche mise à jour ✨" : "Tâche créée avec succès 🚀", "lightgreen");
                taskForm.reset();
                document.getElementById("taskId").value = ""; // Clear ID
                chargerTaches();
            }
        } catch {
            notify("Erreur lors de l'enregistrement", "red");
        } finally {
            toggleLoader(false);
        }
    });
}

async function deleteTask(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    toggleLoader(true);
    try {
        await fetch(API, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "delete", id: id })
        });
        notify("Tâche supprimée", "orange");
        chargerTaches();
    } catch {
        notify("Erreur de suppression", "red");
    } finally {
        toggleLoader(false);
    }
}

// =======================
// UTILITAIRES & NOTIFICATIONS
// =======================
function notify(txt, color) {
    const msgEl = document.getElementById("message");
    if (!msgEl) return;
    
    msgEl.textContent = txt;
    msgEl.style.color = color;
    msgEl.style.animation = "none";
    void msgEl.offsetWidth; // Hack pour relancer l'animation
    msgEl.style.animation = "fadeIn 0.5s ease";
    
    setTimeout(() => { msgEl.textContent = ""; }, 4000);
}

function updateStats(data) {
    const total = data.length;
    const pending = data.filter(t => t.statut === "en_cours").length;
    const done = data.filter(t => t.statut === "terminee").length;

    animateValue("totalTasks", total);
    animateValue("pendingTasks", pending);
    animateValue("doneTasks", done);
}

// Animation fluide des chiffres
function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = parseInt(el.textContent) || 0;
    if (start === value) return;
    
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * (value - start) + start);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Remplissage du formulaire pour édition
function editTask(id, titre, description, statut) {
    document.getElementById("taskId").value = id;
    document.getElementById("titre").value = titre;
    document.getElementById("description").value = description;
    document.getElementById("statut").value = statut;
    
    // Scroll fluide vers le formulaire
    document.querySelector(".form-section").scrollIntoView({ behavior: 'smooth' });
    
    // Petit flash visuel pour indiquer l'édition
    const formSection = document.querySelector(".form-section");
    formSection.style.borderColor = "var(--primary)";
    setTimeout(() => formSection.style.borderColor = "var(--card-border)", 1000);
}

function logout() {
    document.body.style.opacity = "0"; // Transition de sortie
    setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }, 400);
}

// Event Listeners pour filtres en temps réel
document.getElementById("search")?.addEventListener("input", () => {
    // Debounce pour ne pas surcharger le filtrage
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(chargerTaches, 300);
});
document.getElementById("filterStatus")?.addEventListener("change", chargerTaches);