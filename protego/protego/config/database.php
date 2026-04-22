<?php
/**
 * PROTEGO · Configuración de conexión a PostgreSQL
 * --------------------------------------------------
 * Ajusta las credenciales a tu entorno.  En producción
 * léelas desde variables de entorno (getenv).
 */

// En producción usa variables de entorno:
//   putenv('DB_HOST=...');  o configúralas en Apache/Nginx
$DB_CONFIG = [
    'host'     => getenv('PG_HOST') ?: 'localhost',
    'port'     => getenv('PG_PORT') ?: '5432',
    'dbname'   => getenv('PG_NAME') ?: 'protego',
    'user'     => getenv('PG_USER') ?: 'postgres',
    'password' => getenv('PG_PASS') ?: 'postgres',
];

function db(): PDO {
    static $pdo = null;
    global $DB_CONFIG;

    if ($pdo === null) {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            $DB_CONFIG['host'],
            $DB_CONFIG['port'],
            $DB_CONFIG['dbname']
        );
        try {
            $pdo = new PDO($dsn, $DB_CONFIG['user'], $DB_CONFIG['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok'    => false,
                'error' => 'No fue posible conectar a la base de datos.',
                'detalle' => $e->getMessage(),
            ]);
            exit;
        }
    }
    return $pdo;
}

/** Envía una respuesta JSON estandarizada y termina la ejecución. */
function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/** Manejo global de OPTIONS para CORS pre-flight */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_response(['ok' => true]);
}
