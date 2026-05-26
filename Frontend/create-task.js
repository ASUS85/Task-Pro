/* ============================================================
   TASKPRO - CREATE TASK JS
   INTERACTIONS + MODALS + LOGIQUE METIER UI
   ============================================================ */

/* =========================
   DONNEES REELLES (depuis API)
========================= */

let realTasks = [];
let realUsers = [];

/* =========================
   ELEMENTS DOM
========================= */

const form = document.getElementById("createTaskForm");

// FILES
const fileInput = document.getElementById("taskFiles");
const attachFileBtn = document.getElementById("attachFileBtn");
const filePreview = document.getElementById("attachedFilesPreview");

// PARENT TASK
const clearParentTaskBtn = document.getElementById("clearParentTask");
const parentModal = document.getElementById("parentTaskModal");
const parentBtn = document.getElementById("selectParentTaskBtn");
const parentList = document.getElementById("parentTaskList");
const parentDisplay = document.getElementById("parentTaskDisplay");
const searchParent = document.getElementById("searchParentTask");
const parentSortFieldSelect = document.getElementById('parentSortField');
const parentSortOrderSelect = document.getElementById('parentSortOrder');
const parentPagination = document.getElementById('parentPagination');

let parentCurrentPage = 1;
const parentPageSize = 8;
let parentSortField = 'deadline';
let parentSortOrder = 'desc';

// USER
const clearUserSelectionBtn = document.getElementById("clearUserSelection");
const userModal = document.getElementById("userSelectModal");
const userBtn = document.getElementById("selectUserBtn");
const userList = document.getElementById("userList");
const userDisplay = document.getElementById("assignedUserDisplay");
const searchUser = document.getElementById("searchUser");
const filterRole = document.getElementById("filterRole");

// CONFIRM
const confirmModal = document.getElementById("confirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmCreateBtn = document.getElementById("confirmCreateBtn");
const durationType = document.getElementById("durationType");
const taskDuration = document.getElementById("taskDuration");
const taskDurationHint = document.getElementById("taskDurationHint");

/* =========================
   ETAT GLOBAL
========================= */

let selectedParentTask = null;
let selectedUser = null;
let selectedFiles = [];

function showToast(message, type = 'success') {
  if (window.loaderManager?.toast) {
    loaderManager.toast(message, type, 3000);
    return;
  }

  alert(message);
}

/* =========================
   FILE UPLOAD
========================= */

attachFileBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  files.forEach((file) => {
    selectedFiles.push(file);
  });

  renderFiles();
});

function renderFiles() {
  filePreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.classList.add("file-chip");
    div.innerHTML = `
            📎 ${file.name}
            <span style="cursor:pointer;margin-left:10px;" data-index="${index}">✖</span>
        `;

    div.querySelector("span").addEventListener("click", (e) => {
      const i = e.target.getAttribute("data-index");
      selectedFiles.splice(i, 1);
      renderFiles();
    });

    filePreview.appendChild(div);
  });
}

/* =========================
   MODAL GENERIQUE
========================= */

function openModal(modal) {
  modal.style.display = "flex";
}

function closeModal(modal) {
  modal.style.display = "none";
}

window.addEventListener("click", (e) => {
  if (e.target === parentModal) closeModal(parentModal);
  if (e.target === userModal) closeModal(userModal);
  if (e.target === confirmModal) closeModal(confirmModal);
});

durationType.addEventListener("change", updateDurationInput);
taskDuration.addEventListener("input", validateTaskDurationField);

function getDatetimeLocalMin() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISO = new Date(now - tzOffset).toISOString().slice(0, 16);
  return localISO;
}

function parseDurationToSeconds(value) {
  const match = value.match(/^\s*(\d+):(\d{2}):(\d{2})\s*$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseServerDate(value) {
  if (!value) return new Date('');
  return new Date(value.replace(' ', 'T'));
}

function getTaskDeadlineTimestamp(task) {
  if (!task || !task.periode_realisation) return null;
  const raw = String(task.periode_realisation).trim();
  const durationSeconds = parseDurationToSeconds(raw);
  if (durationSeconds !== null) {
    const startRaw = task.dateDebutAssignation || task.dateCreation;
    const startDate = parseServerDate(startRaw);
    if (Number.isNaN(startDate.getTime())) return null;
    return startDate.getTime() + durationSeconds * 1000;
  }
  const absoluteDate = parseServerDate(raw);
  return Number.isNaN(absoluteDate.getTime()) ? null : absoluteDate.getTime();
}

function getParentDeadlineTimestamp() {
  return selectedParentTask ? getTaskDeadlineTimestamp(selectedParentTask) : null;
}

function isAfterParentDeadline(value) {
  const parentDeadline = getParentDeadlineTimestamp();
  if (!parentDeadline) return false;
  const candidate = parseServerDate(value);
  return !Number.isNaN(candidate.getTime()) && candidate.getTime() > parentDeadline;
}

function formatDateTimeForDisplay(date) {
  if (!date || Number.isNaN(date.getTime())) return "Date invalide";
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDurationFromMs(ms) {
  if (ms <= 0) {
    return "Expirée";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatTaskRemaining(task) {
  const deadlineTs = getTaskDeadlineTimestamp(task);
  if (!deadlineTs) {
    return "Date limite non disponible";
  }
  return formatDurationFromMs(deadlineTs - Date.now());
}

function formatDateTimeForBackend(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function isFutureDateTime(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function updateDurationInput() {
  if (!taskDuration || !durationType) return;

  if (durationType.value === "hours") {
    taskDuration.type = "text";
    taskDuration.placeholder = "HH:mm:ss";
    taskDuration.value = taskDuration.value ? taskDuration.value : "";
    taskDuration.min = "";
    taskDurationHint.textContent = selectedParentTask
      ? "La durée sera ajoutée à l'échéance de la tâche parente pour calculer l'échéance enfant."
      : "Format requis : HH:mm:ss (durée positive).";
  } else {
    taskDuration.type = "datetime-local";
    taskDuration.placeholder = "";
    taskDuration.min = getDatetimeLocalMin();
    taskDurationHint.textContent = selectedParentTask
      ? "Choisissez une date/heure après l'échéance de la tâche parente."
      : "Choisissez une date/heure future.";
  }

  validateTaskDurationField();
}

function validateTaskDurationField() {
  if (!taskDuration || !durationType) return;

  const value = taskDuration.value.trim();
  let valid = true;
  let message = "";

  if (!value) {
    valid = false;
    message = "La durée ou l'échéance est obligatoire.";
  } else if (durationType.value === "hours") {
    const seconds = parseDurationToSeconds(value);
    if (seconds === null || seconds <= 0) {
      valid = false;
      message = "La durée doit être au format HH:mm:ss et supérieure à 00:00:00.";
    }
  } else {
    if (!isFutureDateTime(value)) {
      valid = false;
      message = "La date/heure doit être dans le futur.";
    }
  }

  if (valid && selectedParentTask && durationType.value === "date") {
    if (!isAfterParentDeadline(value)) {
      valid = false;
      message = "L'échéance doit être postérieure à celle de la tâche parente.";
    }
  }

  if (!valid) {
    taskDuration.classList.add("invalid-input");
    taskDurationHint.textContent = message;
  } else {
    taskDuration.classList.remove("invalid-input");
    if (selectedParentTask && durationType.value === "hours") {
      taskDurationHint.textContent = "La date limite de la tâche enfant sera calculée à partir de la tâche parente.";
    } else if (durationType.value === "hours") {
      taskDurationHint.textContent = "Format requis : HH:mm:ss (durée positive).";
    } else {
      taskDurationHint.textContent = "Choisissez une date/heure future.";
    }
  }

  return valid;
}

updateDurationInput();

/* =========================
   MODAL TASK PARENT
========================= */

parentBtn.addEventListener("click", async () => {
  try {
    console.log("[MODAL] Ouverture modal tâches parentes...");
    
    if (realTasks.length === 0) {
      console.warn("[MODAL] Aucune tâche en mémoire, rechargement...");
      realTasks = await apiListTasks();
    }
    
    if (realTasks.length === 0) {
      showToast("Aucune tâche disponible", "error");
      return;
    }
    
    parentCurrentPage = 1;
    renderParentTasks(realTasks);
    openModal(parentModal);
  } catch (error) {
    console.error("Erreur chargement tâches:", error);
    showToast("Erreur lors du chargement des tâches parentes: " + error.message, "error");
  }
});

function sortParentTasks(tasks) {
  const sortField = parentSortField;
  const sortDirection = parentSortOrder === 'asc' ? 1 : -1;

  return [...tasks].sort((a, b) => {
    if (sortField === 'name') {
      const nameA = (a.libelle || a.title || '').toLowerCase();
      const nameB = (b.libelle || b.title || '').toLowerCase();
      if (nameA < nameB) return -1 * sortDirection;
      if (nameA > nameB) return 1 * sortDirection;
      return 0;
    }

    const aDeadline = getTaskDeadlineTimestamp(a) || 0;
    const bDeadline = getTaskDeadlineTimestamp(b) || 0;
    if (aDeadline < bDeadline) return -1 * sortDirection;
    if (aDeadline > bDeadline) return 1 * sortDirection;
    return 0;
  });
}

function renderParentTasks(tasks) {
  const allowedStatuses = new Set(['assigné', 'en cours']);
  const filterText = searchParent.value.trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    const title = (task.libelle || task.title || '').toLowerCase();
    return allowedStatuses.has(task.status) && title.includes(filterText);
  });

  const sorted = sortParentTasks(filtered);
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / parentPageSize));
  if (parentCurrentPage > totalPages) {
    parentCurrentPage = totalPages;
  }

  const start = (parentCurrentPage - 1) * parentPageSize;
  const pageItems = sorted.slice(start, start + parentPageSize);

  parentList.innerHTML = "";

  if (pageItems.length === 0) {
    parentList.innerHTML = `<tr><td colspan="4" style="padding:18px; text-align:center; color:rgba(255,255,255,0.7);">Aucune tâche eligible. Seules les tâches en statut 'assigné' ou 'en cours' peuvent être parentes.</td></tr>`;
    parentPagination.innerHTML = '';
    return;
  }

  pageItems.forEach((task) => {
    const deadlineTs = getTaskDeadlineTimestamp(task);
    const deadline = deadlineTs ? formatDateTimeForDisplay(new Date(deadlineTs)) : 'Non définie';
    const remaining = formatTaskRemaining(task);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.libelle || task.title}</td>
      <td class="status">${task.status}</td>
      <td>${deadline}</td>
      <td>${remaining}</td>
    `;

    row.addEventListener('click', () => {
      selectedParentTask = task;
      parentDisplay.value = task.libelle || task.title;
      closeModal(parentModal);
      validateTaskDurationField();
    });

    parentList.appendChild(row);
  });

  renderParentPagination(totalPages);
}

function renderParentPagination(totalPages) {
  parentPagination.innerHTML = '';

  const pageInfo = document.createElement('span');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `Page ${parentCurrentPage} / ${totalPages}`;

  if (totalPages <= 1) {
    parentPagination.appendChild(pageInfo);
    return;
  }

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.textContent = 'Précédent';
  prevBtn.disabled = parentCurrentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (parentCurrentPage > 1) {
      parentCurrentPage -= 1;
      renderParentTasks(realTasks);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.textContent = 'Suivant';
  nextBtn.disabled = parentCurrentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (parentCurrentPage < totalPages) {
      parentCurrentPage += 1;
      renderParentTasks(realTasks);
    }
  });

  parentPagination.appendChild(prevBtn);
  parentPagination.appendChild(pageInfo);
  parentPagination.appendChild(nextBtn);
}

parentSortFieldSelect && parentSortFieldSelect.addEventListener('change', () => {
  parentCurrentPage = 1;
  parentSortField = parentSortFieldSelect.value;
  renderParentTasks(realTasks);
});

parentSortOrderSelect && parentSortOrderSelect.addEventListener('change', () => {
  parentCurrentPage = 1;
  parentSortOrder = parentSortOrderSelect.value;
  renderParentTasks(realTasks);
});

// SEARCH PARENT
searchParent.addEventListener("input", () => {
  parentCurrentPage = 1;
  renderParentTasks(realTasks);
});

/* =========================
   MODAL USERS
========================= */

userBtn.addEventListener("click", async () => {
  try {
    console.log("[MODAL] Ouverture modal utilisateurs...");
    
    if (realUsers.length === 0) {
      console.warn("[MODAL] Aucun utilisateur en mémoire, rechargement...");
      realUsers = await apiListUsers();
    }
    
    if (realUsers.length === 0) {
      showToast("Aucun utilisateur disponible pour assignation. Assurez-vous d'être connecté en tant qu'Administrateur.", "error");
      return;
    }
    
    renderUsers(realUsers);
    openModal(userModal);
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error);
    showToast("Erreur lors du chargement des utilisateurs: " + error.message, "error");
  }
});

function renderUsers(users) {
  // TRI par poste
  const postOrder = {
    "Administrateur": 1,
    "Employe": 2,
  };

  users.sort((a, b) => {
    const orderA = postOrder[a.role] || postOrder[a.poste] || 99;
    const orderB = postOrder[b.role] || postOrder[b.poste] || 99;
    return orderA - orderB;
  });

  userList.innerHTML = "";

  if (users.length === 0) {
    userList.innerHTML = "<p style='padding:10px; text-align:center;'>Aucun utilisateur disponible</p>";
    return;
  }

  users.forEach((user) => {
    const div = document.createElement("div");
    div.classList.add("modal-item");
    const userName = `${user.prenom} ${user.nom}`;
    const userRole = user.role || user.poste || 'Non spécifié';
    div.textContent = `${userName} (${userRole})`;

    div.addEventListener("click", () => {
      selectedUser = user;
      userDisplay.value = userName;
      closeModal(userModal);
    });

    userList.appendChild(div);
  });
}

// SEARCH USER
searchUser.addEventListener("input", filterUsers);
filterRole.addEventListener("change", filterUsers);

function filterUsers() {
  const text = searchUser.value.toLowerCase();
  const role = filterRole.value;

  const filtered = realUsers.filter((u) => {
    const fullName = `${u.prenom} ${u.nom}`.toLowerCase();
    const matchName = fullName.includes(text);
    const userRole = u.role || u.poste || '';
    const matchRole = role ? userRole === role : true;
    return matchName && matchRole;
  });

  renderUsers(filtered);
}
function resetField(input) {
  input.value = "";
  input.classList.add("reset-effect");

  setTimeout(() => {
    input.classList.remove("reset-effect");
  }, 300);
}

/* =========================
   VALIDATION FORM
========================= */

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const duration = taskDuration.value.trim();

  // VALIDATION MINIMALE
  if (!title) {
    showToast("Le libellé est obligatoire", "error");
    return;
  }

  if (!description) {
    showToast("La description est obligatoire", "error");
    return;
  }

  if (!duration) {
    showToast("La durée ou échéance est obligatoire", "error");
    taskDuration.classList.add("invalid-input");
    taskDurationHint.textContent = "La durée ou l'échéance est obligatoire.";
    return;
  }

  if (!validateTaskDurationField()) {
    showToast(taskDurationHint.textContent, "error");
    return;
  }

  // OUVRIR CONFIRMATION
  openModal(confirmModal);
});

/* =========================
   CONFIRMATION CREATION
========================= */

cancelConfirmBtn.addEventListener("click", () => {
  closeModal(confirmModal);
});

confirmCreateBtn.addEventListener("click", async () => {

    try {
        const rawDuration = document.getElementById("taskDuration").value.trim();
        let periode_realisation = rawDuration;

        if (selectedParentTask) {
          const parentDeadlineTs = getParentDeadlineTimestamp();
          if (!parentDeadlineTs) {
            throw new Error("Impossible de récupérer l'échéance de la tâche parente.");
          }

          if (durationType.value === "hours") {
            const seconds = parseDurationToSeconds(rawDuration);
            if (seconds === null || seconds <= 0) {
              throw new Error("La durée doit être au format HH:mm:ss et supérieure à 00:00:00.");
            }
            periode_realisation = formatDateTimeForBackend(new Date(parentDeadlineTs + seconds * 1000));
          } else {
            if (!isAfterParentDeadline(rawDuration)) {
              throw new Error("La date/heure doit être postérieure à l'échéance de la tâche parente.");
            }
            const selectedDate = parseServerDate(rawDuration);
            if (Number.isNaN(selectedDate.getTime())) {
              throw new Error("La date/heure sélectionnée est invalide.");
            }
            periode_realisation = formatDateTimeForBackend(selectedDate);
          }
        } else if (durationType.value === "date") {
          const selectedDate = parseServerDate(rawDuration);
          if (Number.isNaN(selectedDate.getTime())) {
            throw new Error("La date/heure sélectionnée est invalide.");
          }
          periode_realisation = formatDateTimeForBackend(selectedDate);
        }

        const taskData = {
          libelle: document.getElementById("taskTitle").value.trim(),
          description: document.getElementById("taskDescription").value.trim(),

          id_parent: selectedParentTask ? selectedParentTask.id : null,

          id_responsable: selectedUser ? selectedUser.id : null,

          periode_realisation,

          cheminFichier: selectedFiles.length
            ? selectedFiles.map(f => f.name).join(', ')
            : null
        };

        const response = await apiCreateTask(taskData);

        if (!response.success) {
            throw new Error(response.message || "Erreur création tâche");
        }

        closeModal(confirmModal);

        showToast("Tâche créée avec succès !", "success");

        // Réinitialiser le formulaire
        form.reset();

        selectedFiles = [];
        selectedParentTask = null;
        selectedUser = null;

        filePreview.innerHTML = "";
        parentDisplay.value = "";
        userDisplay.value = "";
        // statut initial déterminé côté serveur

    } catch (error) {

        console.error(error);

        showToast("Erreur: " + error.message, "error");
    }
});

/* =========================
   LOGIQUE DYNAMIQUE STATUT
========================= */

// Le statut est désormais déterminé côté serveur selon les règles métier

// Garde défensive : récupérer la référence si elle existe
const taskStatusElement = document.getElementById('taskStatus');

/* =========================
   INIT UI
========================= */

// Initialiser au chargement de la page
async function initializePage() {
  try {
    // Vérifier d'abord que l'utilisateur est authentifié
    const currentUser = getCurrentUserFromStorage();
    console.log("[AUTH] Utilisateur actuel:", currentUser);
    
    if (!currentUser) {
      console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ - Redirection vers login");
      showToast("Vous devez être connecté pour créer une tâche", "error");
      window.location.href = 'login.html';
      return;
    }
    
    console.log("[INIT] Démarrage du chargement des données pour", currentUser.prenom, currentUser.nom);
    
    // Charger les utilisateurs pour la modal
    console.log("[API] Appel GET /users...");
    const usersResponse = await apiListUsers();
    console.log("[API] Réponse utilisateurs:", usersResponse);
    
    if (Array.isArray(usersResponse)) {
      realUsers = usersResponse.filter((user) => (user.disponibilite || 'oui') === 'oui');
    } else {
      console.warn("[WARN] apiListUsers() n'a pas retourné un tableau, reçu:", usersResponse);
      realUsers = [];
    }
    
    // Charger les tâches pour les tâches parentes
    console.log("[API] Appel GET /taches/list...");
    const tasksResponse = await apiListTasks();
    console.log("[API] Réponse tâches:", tasksResponse);
    
    if (Array.isArray(tasksResponse)) {
      realTasks = tasksResponse;
    } else {
      console.warn("[WARN] apiListTasks() n'a pas retourné un tableau, reçu:", tasksResponse);
      realTasks = [];
    }
    
    console.log("✅ TaskPRO Create Task JS chargé et données initialisées");
    console.log("📊 Utilisateurs disponibles:", realUsers.length);
    console.log("📊 Tâches disponibles:", realTasks.length);
    
    if (realUsers.length === 0) {
      console.warn("⚠️ AUCUN UTILISATEUR DISPONIBLE CHARGÉ - Vérifiez les droits (doit être Administrateur) ou qu'aucun utilisateur n'est actuellement disponible.");
    }
    if (realTasks.length === 0) {
      console.warn("⚠️ AUCUNE TÂCHE CHARGÉE - C'est normal si c'est la première fois");
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    console.error("Stack:", error.stack);
    showToast("⚠️ Erreur de chargement des données: " + error.message, "error");
  }
}

// Appeler l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// Boutons de réinitialisation
clearParentTaskBtn.addEventListener("click", () => {
  selectedParentTask = null;
  parentDisplay.value = "";
  closeModal(parentModal);
  validateTaskDurationField();
});

clearUserSelectionBtn.addEventListener("click", () => {
  selectedUser = null;
  resetField(userDisplay);
  closeModal(userModal);
});
