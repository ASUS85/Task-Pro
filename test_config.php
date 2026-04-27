<?php
/**
 * TEST - Vérification configuration Task-Pro
 * Accès: http://localhost/Task-Pro/test_config.php
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <title>Test Configuration Task-Pro</title>
    <style>
        body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        .test { 
            background: white; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px;
            border-left: 4px solid #ccc;
        }
        .pass { border-left-color: #4CAF50; }
        .fail { border-left-color: #f44336; }
        .pass::before { content: '✅ '; color: #4CAF50; font-weight: bold; }
        .fail::before { content: '❌ '; color: #f44336; font-weight: bold; }
        h1 { color: #333; }
        code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔍 Test Configuration Task-Pro</h1>";

// Test 1: PHP Version
echo "<div class='test " . (PHP_VERSION_ID >= 70400 ? 'pass' : 'fail') . "'>
    PHP Version >= 7.4: " . phpversion() . "
</div>";

// Test 2: PDO Extension
echo "<div class='test " . (extension_loaded('pdo') ? 'pass' : 'fail') . "'>
    Extension PDO: " . (extension_loaded('pdo') ? 'Activée' : 'Non activée') . "
</div>";

// Test 3: PDO MySQL
echo "<div class='test " . (extension_loaded('pdo_mysql') ? 'pass' : 'fail') . "'>
    Extension PDO MySQL: " . (extension_loaded('pdo_mysql') ? 'Activée' : 'Non activée') . "
</div>";

// Test 4: Database Connection
echo "<div class='test'>";
try {
    require_once __DIR__ . '/config/Database.php';
    $pdo = Database::getInstance();
    echo "<span class='pass'>✅ Connexion BD réussie</span>";
    
    // Test 5: Check tables
    $tables = ['utilisateurs', 'taches', 'notifications'];
    foreach ($tables as $table) {
        $result = $pdo->query("SHOW TABLES LIKE '$table'");
        $exists = $result->rowCount() > 0;
        echo "<br><span class='" . ($exists ? 'pass' : 'fail') . "'>Table <code>$table</code></span>";
    }
    
} catch (Exception $e) {
    echo "<span class='fail'>❌ Erreur: " . htmlspecialchars($e->getMessage()) . "</span>";
}
echo "</div>";

// Test 6: Session Support
echo "<div class='test " . (session_status() === PHP_SESSION_NONE ? 'pass' : 'fail') . "'>
    Support Sessions PHP: " . (ini_get('session.save_handler') === 'files' ? 'Files' : 'Autre') . "
</div>";

// Test 7: File Uploads
$upload_dir = sys_get_temp_dir();
$is_writable = is_writable($upload_dir);
echo "<div class='test " . ($is_writable ? 'pass' : 'fail') . "'>
    Dossier temp accessible: <code>" . $upload_dir . "</code>
</div>";

// Test 8: mod_rewrite
echo "<div class='test " . (function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'pass' : 'fail') . "'>
    Apache mod_rewrite: " . (function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'Actif' : 'Inactif (check manuellement)') . "
</div>";

// Test 9: API Endpoint
echo "<div class='test'>Test API Endpoint:<br>";
echo "<code>GET /Task-Pro/public/api.php</code><br>";
echo "<button onclick=\"fetch('/Task-Pro/public/api.php').then(r => r.json()).then(d => alert(JSON.stringify(d))).catch(e => alert('Erreur: ' + e.message))\">
    Tester API
</button>";
echo "</div>";

echo "</div>
</body>
</html>";
