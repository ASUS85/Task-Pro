/* ============================================================
   TASKPRO - CREATE TASK JS (VERSION PRO + SIDEBAR AUTO)
   ============================================================ */

/* =========================
   INITIALISATION
========================= */

document.addEventListener("DOMContentLoaded", () => {
    initSidebar();
    initCreateTask();
    lucide.createIcons();
});

/* =========================
   SIDEBAR INTELLIGENTE
========================= */

function initSidebar() {

    const currentPage = document.body.dataset.page;
    const links = document.querySelectorAll(".side-nav a");

    links.forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add("active");
        }
    });
}

/* =========================
   LOGOUT GLOBAL
========================= */

function logout() {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        window.location.href = "login.html";
    }
}

/* =========================
   CREATE TASK LOGIC
========================= */

function initCreateTask() {

    /* =========================
       MOCK DATA
    ========================= */

    const mockTasks = [
        { id: 1, title: "Mettre en place l'authentification", date: "2026-04-28" },
        { id: 2, title: "Créer le dashboard admin", date: "2026-04-30" },
        { id: 3, title: "Design du système de paiement", date: "2026-05-03" }
    ];

    const mockUsers = [
        { id: 1, name: "Jean Claude", role: "developpeur" },
        { id: 2, name: "Marie Louise", role: "designer" },
        { id: 3, name: "Patrick Ngono", role: "manager" }
    ];

    /* =========================
       ELEMENTS DOM
    ========================= */

    const form = document.getElementById("createTaskForm");

    const fileInput = document.getElementById("taskFiles");
    const attachFileBtn = document.getElementById("attachFileBtn");
    const filePreview = document.getElementById("attachedFilesPreview");

    const parentModal = document.getElementById("parentTaskModal");
    const parentBtn = document.getElementById("selectParentTaskBtn");
    const parentList = document.getElementById("parentTaskList");
    const parentDisplay = document.getElementById("parentTaskDisplay");
    const searchParent = document.getElementById("searchParentTask");
    const clearParentTaskBtn = document.getElementById("clearParentTask");

    const userModal = document.getElementById("userSelectModal");
    const userBtn = document.getElementById("selectUserBtn");
    const userList = document.getElementById("userList");
    const userDisplay = document.getElementById("assignedUserDisplay");
    const searchUser = document.getElementById("searchUser");
    const filterRole = document.getElementById("filterRole");
    const clearUserSelectionBtn = document.getElementById("clearUserSelection");

    const confirmModal = document.getElementById("confirmModal");
    const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
    const confirmCreateBtn = document.getElementById("confirmCreateBtn");

    /* =========================
       ETAT GLOBAL
    ========================= */

    let selectedParentTask = null;
    let selectedUser = null;
    let selectedFiles = [];

    /* =========================
       FILE UPLOAD
    ========================= */

    attachFileBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        selectedFiles.push(...Array.from(e.target.files));
        renderFiles();
    });

    function renderFiles() {
        filePreview.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const div = document.createElement("div");
            div.classList.add("file-chip");

            div.innerHTML = `
                📎 ${file.name}
                <span data-index="${index}" style="cursor:pointer;">✖</span>
            `;

            div.querySelector("span").onclick = () => {
                selectedFiles.splice(index, 1);
                renderFiles();
            };

            filePreview.appendChild(div);
        });
    }

    /* =========================
       MODAL UTILS
    ========================= */

    const openModal = (m) => m.style.display = "flex";
    const closeModal = (m) => m.style.display = "none";

    window.addEventListener("click", (e) => {
        if (e.target === parentModal) closeModal(parentModal);
        if (e.target === userModal) closeModal(userModal);
        if (e.target === confirmModal) closeModal(confirmModal);
    });

    /* =========================
       TASK PARENT
    ========================= */

    parentBtn.onclick = () => {
        renderParentTasks(mockTasks);
        openModal(parentModal);
    };

    function renderParentTasks(tasks) {
        parentList.innerHTML = "";

        tasks
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(task => {

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${task.title}</td>
                    <td>${task.date}</td>
                    <td>${getRemainingTime(task.date)}</td>
                `;

                tr.onclick = () => {
                    selectedParentTask = task;
                    parentDisplay.value = task.title;
                    closeModal(parentModal);
                };

                parentList.appendChild(tr);
            });
    }

    function getRemainingTime(date) {
        const diff = new Date(date) - new Date();

        if (diff <= 0) return "Expiré";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        return `${days}j / ${hours}h`;
    }

    searchParent.oninput = (e) => {
        const value = e.target.value.toLowerCase();
        renderParentTasks(mockTasks.filter(t => t.title.toLowerCase().includes(value)));
    };

    clearParentTaskBtn.onclick = () => {
        selectedParentTask = null;
        parentDisplay.value = "";
        parentDisplay.placeholder = "Aucune tâche parent sélectionnée";
        closeModal(parentModal);
    };

    /* =========================
       USERS
    ========================= */

    userBtn.onclick = () => {
        renderUsers(mockUsers);
        openModal(userModal);
    };

    function renderUsers(users) {
        userList.innerHTML = "";

        users.forEach(user => {
            const div = document.createElement("div");
            div.classList.add("modal-item");

            div.textContent = `${user.name} (${user.role})`;

            div.onclick = () => {
                selectedUser = user;
                userDisplay.value = user.name;
                closeModal(userModal);
            };

            userList.appendChild(div);
        });
    }

    function filterUsers() {
        const text = searchUser.value.toLowerCase();
        const role = filterRole.value;

        const filtered = mockUsers.filter(u =>
            u.name.toLowerCase().includes(text) &&
            (!role || u.role === role)
        );

        renderUsers(filtered);
    }

    searchUser.oninput = filterUsers;
    filterRole.onchange = filterUsers;

    clearUserSelectionBtn.onclick = () => {
        selectedUser = null;
        userDisplay.value = "";
        userDisplay.placeholder = "Aucun utilisateur sélectionné";
        closeModal(userModal);
    };

    /* =========================
       VALIDATION FORM
    ========================= */

    form.onsubmit = (e) => {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value.trim();
        const date = document.getElementById("taskDate").value;
        const duration = document.getElementById("taskDurationHours").value;

        if (!title) return alert("Le libellé est obligatoire");
        if (!date) return alert("La date est obligatoire");
        if (!duration || duration <= 0) return alert("Durée invalide");

        if (new Date(date) < new Date().setHours(0,0,0,0)) {
            return alert("Date invalide");
        }

        openModal(confirmModal);
    };

    cancelConfirmBtn.onclick = () => closeModal(confirmModal);

    confirmCreateBtn.onclick = () => {

        const taskData = {
            title: taskTitle.value,
            description: taskDescription.value,
            startDate: taskDate.value,
            durationHours: taskDurationHours.value,
            parentTask: selectedParentTask,
            assignedUser: selectedUser,
            files: selectedFiles.map(f => f.name)
        };

        console.log("TASK CREATED:", taskData);

        alert("✅ Tâche créée avec succès");

        form.reset();
        selectedFiles = [];
        selectedParentTask = null;
        selectedUser = null;

        filePreview.innerHTML = "";
        parentDisplay.value = "";
        userDisplay.value = "";

        closeModal(confirmModal);
    };
}