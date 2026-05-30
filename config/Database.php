<?php

date_default_timezone_set('Africa/Algiers');

require_once __DIR__ . '/ConfigManager.php';

/**
 * Classe Database - Gestion connexion PDO
 * Utilise le pattern Singleton pour une connexion unique
 */

class Database {
    private static ?PDO $instance = null;

    private const CHARSET = 'utf8mb4';

    /**
     * Retourne l'instance de connexion PDO (Singleton)
     */
    public static function getInstance(): PDO {
        if (self::$instance === null) {
            try {
                $db = ConfigManager::getInstance()->getDatabaseConfig();
                $dsn = 'mysql:host=' . $db['host'] . ';port=' . $db['port'] . ';dbname=' . $db['name'] . ';charset=' . self::CHARSET;
                
                self::$instance = new PDO($dsn, $db['user'], $db['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                die('Erreur connexion BD: ' . $e->getMessage());
            }
        }
        return self::$instance;
    }

    /**
     * Empêche l'instanciation directe
     */
    private function __construct() {}
    private function __clone() {}
}
