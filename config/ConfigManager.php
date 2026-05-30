<?php

/**
 * ============================================================
 * TASKPRO - CONFIG MANAGER
 * Gestion sécurisée de la configuration
 * ============================================================
 */

class ConfigManager {
    private static $instance = null;
    private $config = [];
    private $envFile;

    private function __construct() {
        $this->envFile = dirname(dirname(__FILE__)) . '/.env';
        $this->loadEnvironment();
    }

    /**
     * Obtenir l'instance singleton
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Charger les variables d'environnement de manière robuste
     */
    private function loadEnvironment() {
        if (file_exists($this->envFile)) {
            // file() peut garder les \r de Windows, on applique un nettoyage rigoureux
            $lines = file($this->envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                $line = trim($line); // Nettoie les espaces et \r invisibles en début/fin de ligne
                
                if ($line === '' || strpos($line, '#') === 0) continue;
                if (strpos($line, '=') === false) continue;

                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // CORRECTION : Nettoyage safe des guillemets doubles ou simples entourant la valeur
                if (preg_match('/^"([^"]*)"$/', $value, $matches) || preg_match('/^\'([^\']*)\'$/', $value, $matches)) {
                    $value = $matches[1];
                }

                $this->config[$key] = $value;
                putenv("$key=$value");
            }
        }

        // Valeurs par défaut si non définies
        $this->setDefaults();
    }

    /**
     * Définir les valeurs par défaut
     */
    private function setDefaults() {
        $defaults = [
            'DB_HOST' => 'localhost',
            'DB_PORT' => '3306',
            'DB_NAME' => 'task_pro_db',
            'DB_USER' => 'root',
            'DB_PASS' => '',
            'APP_ENV' => 'development',
            'APP_DEBUG' => 'true',
            'SESSION_TIMEOUT' => '3600',
            'SESSION_SECURE' => 'false',
            'SESSION_HTTPONLY' => 'true',
            'MAX_UPLOAD_SIZE' => '10485760',
        ];

        foreach ($defaults as $key => $value) {
            if (!isset($this->config[$key])) {
                $this->config[$key] = $value;
            }
        }
    }

    /**
     * Obtenir une valeur de configuration
     */
    public function get($key, $default = null) {
        return $this->config[$key] ?? $default;
    }

    /**
     * Définir une valeur de configuration
     */
    public function set($key, $value) {
        $this->config[$key] = $value;
        return $this;
    }

    /**
     * Vérifier si une clé existe
     */
    public function has($key) {
        return isset($this->config[$key]);
    }

    /**
     * Obtenir toutes les configurations
     */
    public function all() {
        return $this->config;
    }

    /**
     * Vérifier si on est en développement
     */
    public function isDevelopment() {
        return $this->get('APP_ENV') === 'development';
    }

    /**
     * Vérifier si le debug est activé
     */
    public function isDebug() {
        return $this->get('APP_DEBUG') === 'true';
    }

    /**
     * Obtenir les paramètres de base de données
     */
    public function getDatabaseConfig() {
        return [
            'host' => $this->get('DB_HOST'),
            'port' => $this->get('DB_PORT'),
            'name' => $this->get('DB_NAME'),
            'user' => $this->get('DB_USER'),
            'pass' => $this->get('DB_PASS'),
        ];
    }

    /**
     * Obtenir les paramètres SMTP
     */
    public function getMailConfig() {
        return [
            'host' => $this->get('MAIL_HOST'),
            'port' => $this->get('MAIL_PORT'),
            'username' => $this->get('MAIL_USERNAME'),
            'password' => $this->get('MAIL_PASSWORD'),
            'from' => $this->get('MAIL_FROM'),
            'encryption' => $this->get('MAIL_ENCRYPTION'),
        ];
    }

    /**
     * Obtenir les paramètres de session
     */
    public function getSessionConfig() {
        return [
            'timeout' => (int)$this->get('SESSION_TIMEOUT'),
            'secure' => $this->get('SESSION_SECURE') === 'true',
            'httponly' => $this->get('SESSION_HTTPONLY') === 'true',
            'samesite' => $this->get('SESSION_SAMESITE', 'Lax'),
        ];
    }
}

// Alias court pour accès facile
function config($key = null, $default = null) {
    $config = ConfigManager::getInstance();
    if ($key === null) return $config;
    return $config->get($key, $default);
}

?>
