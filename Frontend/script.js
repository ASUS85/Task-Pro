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

            //recuperation des roles depuuis l'objet utilisateur
            const userRole = result.user.role;

            setTimeout(() => {
                if (userRole === 'SuperAdmin') {
                    window.location.href = "dashboard.html";
                } else {
                    window.location.href = "dashbordUser.html";
                }
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


    const tasksSection = document.getElementById("tasks-section");
    if (!tasksSection) return;

    // Rendre la section visible si elle était cachée
    tasksSection.style.display = "block";
    toggleLoader(true);

    try {
        // 1. Récupération via le service API (apiClient.js)
        const taches = await apiListTasks(); 
        
        if (Array.isArray(taches)) {
            // 2. Mise à jour du tableau
            renderTaches(taches);
            // 3. Mise à jour des compteurs en haut de page
            updateStats(taches);
        }
    } catch (err) {
        notify("Erreur lors du chargement des tâches", "red");
        console.error("Fetch Error:", err);
    } finally {
        toggleLoader(false);
    }

    // const liste = document.getElementById("listeTaches");
    // if (!liste) return;

    // // Vérifier que l'utilisateur est authentifié
    // if (!isAuthenticated()) {
    //     window.location.href = "login.html";
    //     return;
    // }

    // toggleLoader(true);

    // try {
    //     const taches = await apiListTasks();
    //     if (Array.isArray(taches)) {
    //         renderTaches(taches);
    //         updateStats(taches);
    //     }
    // } catch (err) {
    //     notify("Erreur de chargement des tâches", "red");
    //     console.error(err);
    // } finally {
    //     toggleLoader(false);
    // }
}

function renderTaches(data) {
    const tableBody = document.getElementById("task-table-body");
    const tasksSection = document.getElementById("tasks-section");

    if (!tableBody) return;

    // 1. On vide le tableau (supprime les lignes statiques de l'exemple HTML)
    tableBody.innerHTML = "";

    // 2. On rend la section visible dès qu'on tente d'afficher
    if (tasksSection) tasksSection.style.display = "block";

    // 3. Gestion du cas : Aucune tâche trouvée
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px; color:var(--text-dim)">
                    <div style="opacity: 0.6;">
                        <i data-lucide="ghost" style="width:48px; height:48px; margin-bottom:10px"></i>
                        <p style="font-size: 1.1rem;">Aucune tâche assignée pour le moment.</p>
                    </div>
                </td>
            </tr>`;
        
        // Réinitialiser les icônes Lucide pour faire apparaître le petit fantôme
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return; 
    }

    // 4. Si des tâches existent, on les affiche
    data.forEach((t, index) => {
        const tr = document.createElement("tr");
        tr.className = "task-row";

        // Animation d'entrée progressive
        tr.style.animation = `slideUp 0.4s ease forwards ${index * 0.05}s`;
        tr.style.opacity = "0";

        // Extraction sécurisée des données (selon les noms possibles dans votre BD)
        const id = t.id || "N/A";
        const titre = t.libelle || t.titre || "Sans titre";
        const debut = t.date_creation || t.dateDebutReelle || "-";
        const fin = t.date_echeance || t.dateFinReelle || "-";
        const statusRaw = (t.status || t.statut || "en attente").toLowerCase();
        
        // Formatage du statut pour l'affichage (ex: "en_cours" -> "en cours")
        const statusClean = statusRaw.replace(/_/g, ' ');

        // Action au clic
        tr.onclick = () => {
            if (typeof openTaskModal === 'function') {
                openTaskModal(id, titre, debut, fin, statusRaw);
            }
        };

        tr.innerHTML = `
            <td>#${id}</td>
            <td>${titre}</td>
            <td>${debut}</td>
            <td>${fin}</td>
            <td><strong class="status-badge ${statusRaw}">${statusClean}</strong></td>
        `;
        
        tableBody.appendChild(tr);
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