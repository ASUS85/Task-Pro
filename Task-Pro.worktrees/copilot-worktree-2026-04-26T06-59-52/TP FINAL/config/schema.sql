-- ========================================
-- SCHÉMA BD - TASK PRO
-- ========================================

-- Table Utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('SuperSuperAdmin', 'SuperAdmin', 'Administrateur', 'Employé') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Tâches
CREATE TABLE IF NOT EXISTS taches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    libelle VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status ENUM('non assigné', 'assigné', 'en cours', 'non terminé', 'terminé') NOT NULL DEFAULT 'non assigné',
    id_parent INT NULL,
    periode_realisation VARCHAR(50) NOT NULL,
    dateCreation DATETIME NOT NULL,
    dateDebutAssignation DATETIME,
    dateFinReelle DATETIME NULL,
    cheminFichier VARCHAR(500) NULL,
    id_responsable INT NOT NULL,
    id_createur INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_parent) REFERENCES taches(id) ON DELETE SET NULL,
    FOREIGN KEY (id_responsable) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_createur) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_responsable (id_responsable),
    INDEX idx_createur (id_createur),
    INDEX idx_parent (id_parent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    message LONGTEXT NOT NULL,
    id_tache INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tache) REFERENCES taches(id) ON DELETE SET NULL,
    INDEX idx_utilisateur (id_utilisateur),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Activity Logs (pour SuperAdmin)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    details LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (id_utilisateur),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DATA INIT: SuperSuperAdmin (invisible)
-- ========================================
INSERT IGNORE INTO utilisateurs 
(nom, prenom, sexe, email, password, role) 
VALUES 
('System', 'SuperSuperAdmin', 'N/A', 'supersuperadmin@system.local', 
 SHA2('SuperSuperAdmin_SecurePass_2026', 256), 'SuperSuperAdmin');
