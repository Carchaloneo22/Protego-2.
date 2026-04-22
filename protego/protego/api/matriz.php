<?php
/**
 * GET /api/matriz.php
 * Devuelve la matriz de riesgos: cargo + riesgo + EPPs requeridos.
 * Parámetros opcionales:
 *   ?nivel=I|II|III|IV   Filtra por nivel de riesgo
 *   ?cargo_id=<int>      Filtra por cargo
 *   ?q=<texto>           Búsqueda libre por cargo o riesgo
 */
require_once __DIR__ . '/../config/database.php';

$nivel    = $_GET['nivel']    ?? null;
$cargoId  = $_GET['cargo_id'] ?? null;
$q        = trim($_GET['q']   ?? '');

$sql = "SELECT * FROM v_matriz_riesgos WHERE 1=1";
$params = [];

if ($nivel && in_array($nivel, ['I','II','III','IV'], true)) {
    $sql .= " AND nivel = :nivel";
    $params[':nivel'] = $nivel;
}
if ($cargoId && ctype_digit((string)$cargoId)) {
    $sql .= " AND cargo_id = :cid";
    $params[':cid'] = (int)$cargoId;
}
if ($q !== '') {
    $sql .= " AND (LOWER(cargo) LIKE :q OR LOWER(riesgo) LIKE :q)";
    $params[':q'] = '%' . mb_strtolower($q) . '%';
}

$sql .= " ORDER BY
            CASE nivel WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 ELSE 4 END,
            valoracion DESC";

try {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Casting suave para JSON
    foreach ($rows as &$r) {
        $r['valoracion']     = (int)$r['valoracion'];
        $r['controlado']     = (bool)$r['controlado'];
        $r['epps_requeridos'] = $r['epps_requeridos']
            ? array_map('trim', explode(',', $r['epps_requeridos']))
            : [];
    }

    json_response(['ok' => true, 'data' => $rows, 'total' => count($rows)]);
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
