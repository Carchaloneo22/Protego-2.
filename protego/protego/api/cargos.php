<?php
/**
 * GET /api/cargos.php
 * Lista todos los cargos activos con contadores.
 */
require_once __DIR__ . '/../config/database.php';

$sql = "
    SELECT
        c.id, c.codigo, c.nombre, c.area,
        (SELECT COUNT(*) FROM cargos_riesgos cr WHERE cr.cargo_id = c.id) AS total_riesgos,
        (SELECT COUNT(*) FROM cargos_epps    ce WHERE ce.cargo_id = c.id) AS total_epps,
        (SELECT COUNT(*) FROM trabajadores   t  WHERE t.cargo_id  = c.id AND t.activo) AS total_trabajadores
    FROM cargos c
    WHERE c.activo = TRUE
    ORDER BY c.nombre
";

try {
    $rows = db()->query($sql)->fetchAll();
    foreach ($rows as &$r) {
        $r['total_riesgos']      = (int)$r['total_riesgos'];
        $r['total_epps']         = (int)$r['total_epps'];
        $r['total_trabajadores'] = (int)$r['total_trabajadores'];
    }
    json_response(['ok' => true, 'data' => $rows]);
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
