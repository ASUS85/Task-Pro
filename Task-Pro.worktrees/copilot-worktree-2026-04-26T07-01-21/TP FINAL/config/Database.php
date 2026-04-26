<?php

/**
 * Classe Database - Gestion connexion PDO
 * Utilise le pattern Singleton pour une connexion unique
 */

class Database {
    private static ?PDO $instance = null;
    
    private const HOST = 'localhost';
    private const DB_NAME = 'task_pro_db';
    private const USER = 'root';
    private const PASSWORD = '';
    private const CHARSET = 'utf8mb4';

    /**
     * Retourne l'instance de connexion PDO (Singleton)
     */
    public static function getInstance(): PDO {
        if (self::$instance === null) {
            try {
                $dsn = 'mysql:host=' . self::HOST . ';dbname=' . self::DB_NAME . ';charset=' . self::CHARSET;
                
                self::$instance = new PDO($dsn, self::USER, self::PASSWORD, [
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
