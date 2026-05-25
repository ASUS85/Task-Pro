/**
 * ============================================================
 * TASKPRO - LOADERS.JS (VERSION 2.0)
 * Système UNIVERSEL de gestion des loaders avec support
 * de loaders sur sections précises sans rechargement page
 * ============================================================
 */

class LoaderManager {
    constructor() {
        this.mainOverlay = null;
        this.progressBar = null;
        this.toastContainer = null;
        this.loadingQueue = new Map();
        this.sectionLoaders = new Map();
        this.loadingCount = 0;
        this.init();
    }

    /**
     * Initialiser le système de loaders
     */
    init() {
        // Créer l'overlay principal
        if (!document.getElementById('loader-overlay')) {
            this.mainOverlay = document.createElement('div');
            this.mainOverlay.id = 'loader-overlay';
            this.mainOverlay.className = 'loader-overlay';
            this.mainOverlay.innerHTML = `
                <div class="loader-container">
                    <div class="spinner"></div>
                    <div class="loader-text">
                        Chargement<span class="loader-dots">.</span><span class="loader-dots">.</span><span class="loader-dots">.</span>
                    </div>
                </div>
            `;
            document.body.appendChild(this.mainOverlay);
        } else {
            this.mainOverlay = document.getElementById('loader-overlay');
        }

        // Créer la barre de progression
        if (!document.getElementById('progress-loader')) {
            this.progressBar = document.createElement('div');
            this.progressBar.id = 'progress-loader';
            this.progressBar.className = 'progress-loader';
            document.body.appendChild(this.progressBar);
        } else {
            this.progressBar = document.getElementById('progress-loader');
        }

        // Créer le conteneur de toast
        if (!document.getElementById('toast-container')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('toast-container');
        }
    }

    /**
     * Afficher le loader principal
     * @param {string} message - Message à afficher
     * @param {number} timeout - Temps d'auto-fermeture (0 = pas d'auto-fermeture)
     */
    show(message = 'Chargement', timeout = 0) {
        const container = this.mainOverlay.querySelector('.loader-container');
        const textElement = container.querySelector('.loader-text');
        
        if (message) {
            textElement.innerHTML = `${message}<span class="loader-dots">.</span><span class="loader-dots">.</span><span class="loader-dots">.</span>`;
        }
        
        this.mainOverlay.classList.add('active');

        if (timeout > 0) {
            setTimeout(() => this.hide(), timeout);
        }

        return this;
    }

    /**
     * Cacher le loader principal
     */
    hide() {
        this.mainOverlay.classList.remove('active');
        return this;
    }

    /**
     * Afficher le loader de section
     * @param {string} selector - Sélecteur CSS de la section
     * @param {string} message - Message optionnel
     */
    showSection(selector, message = 'Chargement') {
        const section = document.querySelector(selector);
        if (!section) return;

        let loader = section.querySelector('.section-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'section-loader';
            loader.innerHTML = `<div class="section-spinner"></div>`;
            section.appendChild(loader);
        }

        loader.classList.add('active');
        this.loadingQueue.set(selector, loader);
        return this;
    }

    /**
     * Cacher le loader de section
     * @param {string} selector - Sélecteur CSS de la section
     */
    hideSection(selector) {
        const loader = this.loadingQueue.get(selector);
        if (loader) {
            loader.classList.remove('active');
        }
        return this;
    }

    /**
     * Afficher la barre de progression
     */
    showProgress() {
        this.progressBar.classList.add('active');
        return this;
    }

    /**
     * Cacher la barre de progression
     */
    hideProgress() {
        this.progressBar.classList.remove('active');
        return this;
    }

    /**
     * Afficher un toast de notification avec loader
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (info, success, error, warning)
     * @param {number} duration - Durée d'affichage en ms
     */
    toast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-loader active`;
        
        const icon = type === 'success' ? '✓' : 
                    type === 'error' ? '✕' : 
                    type === 'warning' ? '!' : 'ⓘ';

        toast.innerHTML = `
            <div class="small-spinner"></div>
            <div class="message">${message}</div>
        `;

        if (type === 'success' || type === 'error' || type === 'warning') {
            toast.innerHTML = `
                <span style="color: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff5f5f' : '#ff9d00'}">${icon}</span>
                <div class="message">${message}</div>
            `;
        }

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return this;
    }

    /**
     * Créer un skeleton loader
     * @param {string} selector - Sélecteur CSS de la section
     * @param {number} lines - Nombre de lignes de skeleton
     */
    createSkeleton(selector, lines = 5) {
        const section = document.querySelector(selector);
        if (!section) return;

        let skeletonContainer = section.querySelector('.skeleton-container');
        if (!skeletonContainer) {
            skeletonContainer = document.createElement('div');
            skeletonContainer.className = 'skeleton-container';
            section.appendChild(skeletonContainer);
        }

        skeletonContainer.innerHTML = '';

        for (let i = 0; i < lines; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader skeleton-text' + (i === 0 ? ' large' : '');
            skeletonContainer.appendChild(skeleton);
        }

        return this;
    }

    /**
     * Créer un skeleton pour une table
     * @param {string} selector - Sélecteur CSS de la table
     * @param {number} rows - Nombre de rangées
     * @param {number} cols - Nombre de colonnes
     */
    createTableSkeleton(selector, rows = 5, cols = 5) {
        const section = document.querySelector(selector);
        if (!section) return;

        let skeletonContainer = section.querySelector('.skeleton-table-container');
        if (!skeletonContainer) {
            skeletonContainer = document.createElement('div');
            skeletonContainer.className = 'skeleton-table-container';
            section.appendChild(skeletonContainer);
        }

        let html = '<table class="skeleton-table">';
        for (let i = 0; i < rows; i++) {
            html += '<tr>';
            for (let j = 0; j < cols; j++) {
                html += '<td class="skeleton-loader"></td>';
            }
            html += '</tr>';
        }
        html += '</table>';

        skeletonContainer.innerHTML = html;
        return this;
    }

    /**
     * Wrapper pour requête API avec loader automatique
     * @param {Promise} promise - Promesse API
     * @param {object} options - Options {showMain, showProgress, message, sectionSelector}
     */
    async withLoader(promise, options = {}) {
        const {
            showMain = true,
            showProgress = false,
            message = 'Chargement',
            sectionSelector = null
        } = options;

        try {
            if (showMain) this.show(message);
            if (showProgress) this.showProgress();
            if (sectionSelector) this.showSection(sectionSelector);

            const result = await promise;

            if (showMain) this.hide();
            if (showProgress) this.hideProgress();
            if (sectionSelector) this.hideSection(sectionSelector);

            return result;
        } catch (error) {
            if (showMain) this.hide();
            if (showProgress) this.hideProgress();
            if (sectionSelector) this.hideSection(sectionSelector);

            throw error;
        }
    }

    /**
     * Helper pour injecter le CSS des loaders
     */
    static injectCSS() {
        if (!document.getElementById('loaders-css')) {
            const link = document.createElement('link');
            link.id = 'loaders-css';
            link.rel = 'stylesheet';
            link.href = '/Task-Pro/Frontend/assets/css/loaders.css';
            document.head.appendChild(link);
        }
    }
}

// Initialiser le gestionnaire de loaders globalement
const loaderManager = new LoaderManager();

// Injection du CSS au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    LoaderManager.injectCSS();
});

// Export pour utilisation en modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoaderManager;
}
