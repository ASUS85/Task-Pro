/**
 * TASKMANAGER PRO - LOGIQUE CLIENT
 * Complémentaire au style Glassmorphism & Animations
 */

// =======================
// INITIALISATION & SESSION
// =======================
document.addEventListener("DOMContentLoaded", () => {
    // Animation d'entrée pour les éléments de la page
    document.body.style.opacity = "0";
    setTimeout(() => {
        document.body.style.transition = "opacity 0.6s ease";
        document.body.style.opacity = "1";
    }, 50);

    // Initialiser lucide icons si disponible
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Vérifier la page et initialiser
    initializePage();
});

function initializePage() {
    const isLoginPage = window.location.pathname.includes("login");
    const isInscriptionPage = window.location.pathname.includes("inscription");
    
    if (isLoginPage) {
        initializeLoginForm();
    } else if (isInscriptionPage) {
        initializeInscriptionForm();
    } else {
        checkUser();
        chargerTaches();
    }
}

function checkUser() {
    const user = getCurrentUserFromStorage();
    const isAuthPage = window.location.pathname.includes("login") || window.location.pathname.includes("inscription");

    if (!user && !isAuthPage) {
        window.location.href = "login.html";
        return;
    }

    const userNameEl = document.getElementById("userName");
    if (userNameEl && user) {
        userNameEl.innerHTML = `👋 <span style="color: var(--primary)">${user.nom} ${user.prenom || ''}</span>`;
    }
}

// =======================
// GESTION DU LOGIN
// =======================
function initializeLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const messageEl = document.getElementById("message");
    
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        await handleLogin(email, password, messageEl);
    });
}

async function handleLogin(email, password, messageEl) {
    const messageEl_actual = messageEl || document.getElementById("message");
    toggleLoader(true);

    try {
        const result = await apiLogin(email, password);
        
        if (result.success) {
            showMessage("Connexion réussie! Redirection...", "lightgreen", messageEl_actual);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            showMessage(result.message || "Erreur de connexion", "red", messageEl_actual);
        }
    } catch (error) {
        showMessage(error.message || "Erreur de connexion", "red", messageEl_actual);
    } finally {
        toggleLoader(false);
    }
}

// =======================
// GESTION DE L'INSCRIPTION
// =======================
function initializeInscriptionForm() {
    const registerForm = document.getElementById("registerForm");
    const messageEl = document.getElementById("message");
    
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const userData = {
            nom: document.getElementById("nom").value,
            prenom: document.getElementById("prenom").value,
            sexe: document.getElementById("sexe").value,
            poste: document.getElementById("poste").value || "",
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            confirm_password: document.getElementById("confirm_password").value
        };
        
        await handleInscription(userData, messageEl);
    });
}

async function handleInscription(userData, messageEl) {
    const messageEl_actual = messageEl || document.getElementById("message");
    toggleLoader(true);

    try {
        const result = await apiRegister(userData);
        
        if (result.success) {
            showMessage("Compte créé avec succès! Redirection vers connexion...", "lightgreen", messageEl_actual);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showMessage(result.message || "Erreur lors de l'inscription", "red", messageEl_actual);
        }
    } catch (error) {
        showMessage(error.message || "Erreur lors de l'inscription", "red", messageEl_actual);
    } finally {
        toggleLoader(false);
    }
}


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
// AFFICHAGE DES MESSAGES
// =======================
function showMessage(message, color, element) {
    const msgEl = element || document.getElementById("message");
    if (!msgEl) return;
    
    msgEl.textContent = message;
    msgEl.style.color = color;
    msgEl.style.animation = "none";
    void msgEl.offsetWidth; // Hack pour relancer l'animation
    msgEl.style.animation = "fadeIn 0.5s ease";
    
    if (!window.location.pathname.includes("login") && !window.location.pathname.includes("inscription")) {
        setTimeout(() => { msgEl.textContent = ""; }, 4000);
    }
}

function notify(txt, color) {
    const msgEl = document.getElementById("message");
    showMessage(txt, color, msgEl);
}

// =======================
// CHARGER & AFFICHER LES TÂCHES
// =======================
async function chargerTaches() {
    const liste = document.getElementById("listeTaches");
    if (!liste) return;

    // Vérifier que l'utilisateur est authentifié
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    toggleLoader(true);

    try {
        const taches = await apiListTasks();
        if (Array.isArray(taches)) {
            renderTaches(taches);
            updateStats(taches);
        }
    } catch (err) {
        notify("Erreur de chargement des tâches", "red");
        console.error(err);
    } finally {
        toggleLoader(false);
    }
}

function renderTaches(data) {
    const liste = document.getElementById("listeTaches");
    if (!liste) return;
    
    const filter = document.getElementById("filterStatus")?.value || "";
    const search = document.getElementById("search")?.value.toLowerCase() || "";

    liste.innerHTML = "";

    const tachesFiltrees = data.filter(t => 
        (!filter || (t.status || t.statut) === filter) && 
        ((t.libelle || t.titre || "").toLowerCase().includes(search) || 
         (t.description || "").toLowerCase().includes(search))
    );

    if (tachesFiltrees.length === 0) {
        liste.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim)">Aucune tâche trouvée 🛸</td></tr>`;
        return;
    }

    tachesFiltrees.forEach((t, index) => {
        const tr = document.createElement("tr");
        tr.style.animation = `slideUp 0.4s ease forwards ${index * 0.05}s`;
        tr.style.opacity = "0";

        const id = t.id;
        const titre = t.libelle || t.titre || "Sans titre";
        const description = t.description || "";
        const status = t.status || t.statut || "non assigné";

        tr.innerHTML = `
            <td>#${id}</td>
            <td style="font-weight:bold">${titre}</td>
            <td style="color:var(--text-dim); font-size:0.9rem">${description.substring(0, 50)}...</td>
            <td><span class="status-${status}">${status.replace(/_/g, ' ')}</span></td>
            <td>${t.assignee || t.responsable || "-"}</td>
            <td>${t.date_echeance || t.dateFinReelle || "-"}</td>
            <td>
                <button class="btn-icon" onclick="editTask(${id}, '${titre}', '${description}', '${status}')">✏️</button>
                <button class="btn-icon" onclick="deleteTask(${id})" style="background:rgba(255,0,0,0.1)">🗑️</button>
            </td>
        `;
        liste.appendChild(tr);
    });
}

function updateStats(data) {
    const total = data.length;
    const pending = data.filter(t => (t.status || t.statut) === "en cours").length;
    const done = data.filter(t => (t.status || t.statut) === "terminé").length;

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

// =======================
// GESTION DES TÂCHES
// =======================
const taskForm = document.getElementById("taskForm");
if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        toggleLoader(true);

        const id = document.getElementById("taskId")?.value;
        const payload = {
            libelle: document.getElementById("titre")?.value || "",
            description: document.getElementById("description")?.value || "",
            status: document.getElementById("statut")?.value || "non assigné",
            periode_realisation: document.getElementById("date_echeance")?.value || ""
        };

        try {
            let result;
            if (id) {
                // Update
                result = await apiUpdateTaskStatus(id, payload.status);
                notify("Tâche mise à jour ✨", "lightgreen");
            } else {
                // Create
                result = await apiCreateTask(payload);
                notify("Tâche créée avec succès 🚀", "lightgreen");
            }
            
            taskForm.reset();
            if (document.getElementById("taskId")) {
                document.getElementById("taskId").value = "";
            }
            chargerTaches();
        } catch (err) {
            notify("Erreur lors de l'enregistrement: " + err.message, "red");
        } finally {
            toggleLoader(false);
        }
    });
}

function editTask(id, titre, description, statut) {
    if (document.getElementById("taskId")) {
        document.getElementById("taskId").value = id;
    }
    if (document.getElementById("titre")) {
        document.getElementById("titre").value = titre;
    }
    if (document.getElementById("description")) {
        document.getElementById("description").value = description;
    }
    if (document.getElementById("statut")) {
        document.getElementById("statut").value = statut;
    }
    
    const formSection = document.querySelector(".form-section");
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
        formSection.style.borderColor = "var(--primary)";
        setTimeout(() => formSection.style.borderColor = "var(--card-border)", 1000);
    }
}

async function deleteTask(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    toggleLoader(true);
    try {
        await apiDeleteTask(id);
        notify("Tâche supprimée", "orange");
        chargerTaches();
    } catch (err) {
        notify("Erreur de suppression: " + err.message, "red");
    } finally {
        toggleLoader(false);
    }
}

// =======================
// DÉCONNEXION
// =======================
async function logout() {
    try {
        await apiLogout();
    } finally {
        window.location.href = "login.html";
    }
}

// =======================
// EVENT LISTENERS DYNAMIQUES
// =======================
document.getElementById("search")?.addEventListener("input", () => {
    // Debounce pour ne pas surcharger le filtrage
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(chargerTaches, 300);
});

document.getElementById("filterStatus")?.addEventListener("change", chargerTaches);
