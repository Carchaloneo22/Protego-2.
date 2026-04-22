<?php
/**
 * POST /api/evaluacion.php
 * Actualiza el estado "controlado" de un par cargo-riesgo.
 * Body JSON: { "cargo_id": 1, "riesgo_id": 2, "controlado": true }
 */
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'Método no permitido'], 405);
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    json_response(['ok' => false, 'error' => 'JSON inválido'], 400);
}

$cargoId    = filter_var($body['cargo_id']   ?? null, FILTER_VALIDATE_INT);
$riesgoId   = filter_var($body['riesgo_id']  ?? null, FILTER_VALIDATE_INT);
$controlado = filter_var($body['controlado'] ?? null, FILTER_VALIDATE_BOOLEAN,
              FILTER_NULL_ON_FAILURE);

if (!$cargoId || !$riesgoId || $controlado === null) {
    json_response(['ok' => false, 'error' => 'Parámetros incompletos'], 400);
}

try {
    $stmt = db()->prepare("
        UPDATE cargos_riesgos
        SET controlado = :c, actualizado_en = CURRENT_TIMESTAMP
        WHERE cargo_id = :cg AND riesgo_id = :rg
    ");
    $stmt->execute([
        ':c'  => $controlado ? 'true' : 'false',
        ':cg' => $cargoId,
        ':rg' => $riesgoId,
    ]);
    json_response(['ok' => true, 'afectados' => $stmt->rowCount()]);
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
