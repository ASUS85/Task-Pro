function callAPI($method, $url, $data = false) {
    $curl = curl_init();

    switch ($method) {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);
            if ($data)
                curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
            break;
        case "GET":
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
            break;
    }

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($curl, CURLOPT_COOKIEJAR, 'cookie.txt');
    curl_setopt($curl, CURLOPT_COOKIEFILE, 'cookie.txt');

    $result = curl_exec($curl);
    curl_close($curl);

    return $result;
}

// 🔐 LOGIN
echo "LOGIN...\n";
$response = callAPI("POST", "http://localhost/Task-Pro/public/api.php/auth/login", [
    "email" => "admin@test.com",
    "password" => "123"
]);
echo $response . "\n\n";

// 📋 GET TASKS
echo "GET TASKS...\n";
$response = callAPI("GET", "http://localhost/Task-Pro/public/api.php/taches/list");
echo $response . "\n";