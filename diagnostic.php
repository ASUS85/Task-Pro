<?php
/**
 * DIAGNOSTIC - Identification erreur
 * Accès: http://localhost/Task-Pro/diagnostic.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Task-Pro</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .ok { color: green; }
        .error { color: red; }
        .warn { color: orange; }
        pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Diagnostic Task-Pro</h1>";

// Test 1: PHP Version
echo "<p class='ok'><strong>PHP Version:</strong> " . phpversion() . "</p>";

// Test 2: Current Directory
echo "<p><strong>Current Directory:</strong> " . getcwd() . "</p>";

// Test 3: Load Database Config
echo "<hr>";
echo "<h2>Database Connection Test</h2>";
try {
    require_once __DIR__ . '/config/Database.php';
    $pdo = Database::getInstance();
    echo "<p class='ok'><strong>✅ Database Connected Successfully</strong></p>";
    
    // Check tables
    $tables = ['utilisateurs', 'taches', 'notifications'];
    foreach ($tables as $table) {
        try {
            $result = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $row = $result->fetch();
            echo "<p class='ok'>✅ Table <strong>$table</strong> exists (" . $row['count'] . " rows)</p>";
        } catch (Exception $e) {
            echo "<p class='error'>❌ Table <strong>$table</strong> error: " . $e->getMessage() . "</p>";
        }
    }
} catch (Exception $e) {
    echo "<p class='error'><strong>❌ Database Error:</strong></p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}

// Test 3: Load includes
echo "<hr>";
echo "<h2>Includes Test</h2>";

$files = [
    'Models/Personne.php',
    'Models/Administrateur.php',
    'Models/Employe.php',
    'DAOs/UtilisateurDAO.php',
    'Services/AuthServices.php'
];

foreach ($files as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        echo "<p class='ok'>✅ $file exists</p>";
        try {
            require_once $path;
            echo "<p class='ok'>✅ $file loaded successfully</p>";
        } catch (Exception $e) {
            echo "<p class='error'>❌ $file load error: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p class='error'>❌ $file NOT FOUND</p>";
    }
}

// Test 4: Check mod_rewrite
echo "<hr>";
echo "<h2>Apache Module Check</h2>";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "<p class='ok'>✅ mod_rewrite is ENABLED</p>";
    } else {
        echo "<p class='error'>❌ mod_rewrite is DISABLED</p>";
    }
} else {
    echo "<p class='warn'>⚠️ Cannot check Apache modules (not available)</p>";
}

// Test 5: Test API endpoint
echo "<hr>";
echo "<h2>API Test</h2>";
echo "<p><a href='public/api.php' target='_blank'>[Test Direct API Access]</a></p>";
echo "<p><a href='test_config.php' target='_blank'>[Full Config Test]</a></p>";

// Test 6: Sessions
echo "<hr>";
echo "<h2>Session Test</h2>";
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
echo "<p class='ok'>✅ Sessions are working</p>";
$_SESSION['test'] = 'ok';
echo "<p>Session Test Value: " . $_SESSION['test'] . "</p>";

echo "</body>
</html>";
