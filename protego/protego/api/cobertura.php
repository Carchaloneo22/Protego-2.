<?php
/**
 * GET /api/cobertura.php
 * Semáforo de cobertura de EPP por trabajador.
 * Parámetros opcionales:
 *   ?cargo_id=<int>     Filtra por cargo
 *   ?semaforo=verde|amarillo|rojo
 */
require_once __DIR__ . '/../config/database.php';

$cargoId  = $_GET['cargo_id'] ?? null;
$semaforo = $_GET['semaforo'] ?? null;

$sql = "SELECT * FROM v_cobertura_epp WHERE 1=1";
$params = [];

if ($cargoId && ctype_digit((string)$cargoId)) {
    $sql .= " AND cargo_id = :cid";
    $params[':cid'] = (int)$cargoId;
}
if ($semaforo && in_array($semaforo, ['verde','amarillo','rojo'], true)) {
    $sql .= " AND semaforo = :sem";
    $params[':sem'] = $semaforo;
}

$sql .= " ORDER BY porcentaje_cobertura ASC, trabajador ASC";

try {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Resumen agregado (para tarjetas del dashboard)
    $resumen = [
        'verde'     => 0,
        'amarillo'  => 0,
        'rojo'      => 0,
        'promedio'  => 0,
        'total'     => count($rows),
    ];
    $acumulado = 0;
    foreach ($rows as &$r) {
        $r['porcentaje_cobertura'] = (int)$r['porcentaje_cobertura'];
        $r['requeridos']           = (int)$r['requeridos'];
        $r['asignados']            = (int)$r['asignados'];
        $resumen[$r['semaforo']]++;
        $acumulado += $r['porcentaje_cobertura'];
    }
    $resumen['promedio'] = $resumen['total'] ? round($acumulado / $resumen['total']) : 0;

    json_response([
        'ok'      => true,
        'data'    => $rows,
        'resumen' => $resumen,
    ]);
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
