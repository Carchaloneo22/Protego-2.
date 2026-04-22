<?php
/**
 * GET /api/matriz_grid.php
 * Devuelve la matriz visual 4×4 (NP × NC) con conteos por celda.
 *
 * Respuesta:
 * {
 *   ok: true,
 *   grid: [ { probabilidad, consecuencia, nivel, cantidad, detalle[] }, ... 16 celdas ],
 *   totales: { 'I': n, 'II': n, 'III': n, 'IV': n },
 *   total: n
 * }
 */
require_once __DIR__ . '/../config/database.php';

$sql = "SELECT probabilidad, consecuencia, nivel, cantidad, detalle
        FROM v_matriz_np_nc";

try {
    $rows = db()->query($sql)->fetchAll();

    $totales = ['I' => 0, 'II' => 0, 'III' => 0, 'IV' => 0];
    $grid    = [];
    $total   = 0;

    foreach ($rows as $r) {
        $cantidad = (int)$r['cantidad'];
        $grid[] = [
            'probabilidad' => $r['probabilidad'],
            'consecuencia' => $r['consecuencia'],
            'nivel'        => $r['nivel'],
            'cantidad'     => $cantidad,
            'detalle'      => json_decode($r['detalle'] ?? '[]', true),
        ];
        $totales[$r['nivel']] += $cantidad;
        $total += $cantidad;
    }

    json_response([
        'ok'      => true,
        'grid'    => $grid,
        'totales' => $totales,
        'total'   => $total,
    ]);
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
