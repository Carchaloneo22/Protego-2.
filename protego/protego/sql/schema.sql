-- ===========================================================
-- PROTEGO · Matriz de Riesgos y Cobertura de EPP
-- Esquema PostgreSQL 13+
-- v1.1 · Matriz NP × NC (GTC 45 / SG-SST)
-- ===========================================================
-- Ejecutar:  psql -U <usuario> -d <basedatos> -f schema.sql
-- ===========================================================

-- ----- Limpieza idempotente -----
DROP VIEW  IF EXISTS v_matriz_np_nc       CASCADE;
DROP VIEW  IF EXISTS v_cobertura_epp      CASCADE;
DROP VIEW  IF EXISTS v_matriz_riesgos     CASCADE;
DROP TABLE IF EXISTS asignaciones_epp     CASCADE;
DROP TABLE IF EXISTS cargos_epps          CASCADE;
DROP TABLE IF EXISTS cargos_riesgos       CASCADE;
DROP TABLE IF EXISTS trabajadores         CASCADE;
DROP TABLE IF EXISTS epps                 CASCADE;
DROP TABLE IF EXISTS riesgos              CASCADE;
DROP TABLE IF EXISTS cargos               CASCADE;
DROP TYPE  IF EXISTS nivel_riesgo         CASCADE;
DROP TYPE  IF EXISTS probabilidad_t       CASCADE;
DROP TYPE  IF EXISTS consecuencia_t       CASCADE;

-- ----- Tipos enumerados -----
CREATE TYPE nivel_riesgo   AS ENUM ('I', 'II', 'III', 'IV');
CREATE TYPE probabilidad_t AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'MUY ALTA');
CREATE TYPE consecuencia_t AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'MUY GRAVE');

-- ===========================================================
-- 1. CARGOS
-- ===========================================================
CREATE TABLE cargos (
    id           SERIAL PRIMARY KEY,
    codigo       VARCHAR(20)  UNIQUE NOT NULL,
    nombre       VARCHAR(120) NOT NULL,
    area         VARCHAR(80),
    descripcion  TEXT,
    activo       BOOLEAN DEFAULT TRUE,
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- 2. RIESGOS
-- ===========================================================
CREATE TABLE riesgos (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    categoria     VARCHAR(60),
    descripcion   TEXT,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- 3. EPPs
-- ===========================================================
CREATE TABLE epps (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(120) NOT NULL,
    tipo         VARCHAR(60),
    norma        VARCHAR(60),
    stock        INT DEFAULT 0,
    creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- 4. CARGOS_RIESGOS  (evaluación con NP / NC)
-- ===========================================================
CREATE TABLE cargos_riesgos (
    id             SERIAL PRIMARY KEY,
    cargo_id       INT NOT NULL REFERENCES cargos(id)  ON DELETE CASCADE,
    riesgo_id      INT NOT NULL REFERENCES riesgos(id) ON DELETE CASCADE,
    probabilidad   probabilidad_t NOT NULL,      -- BAJA · MEDIA · ALTA · MUY ALTA
    consecuencia   consecuencia_t NOT NULL,      -- LEVE · MODERADA · GRAVE · MUY GRAVE
    nivel          nivel_riesgo   NOT NULL,      -- Derivado de NP × NC (I … IV)
    valoracion     INT NOT NULL,
    controlado     BOOLEAN DEFAULT FALSE,
    observaciones  TEXT,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cargo_id, riesgo_id)
);

-- ===========================================================
-- 5. CARGOS_EPPS
-- ===========================================================
CREATE TABLE cargos_epps (
    id          SERIAL PRIMARY KEY,
    cargo_id    INT NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
    epp_id      INT NOT NULL REFERENCES epps(id)   ON DELETE CASCADE,
    obligatorio BOOLEAN DEFAULT TRUE,
    UNIQUE(cargo_id, epp_id)
);

-- ===========================================================
-- 6. TRABAJADORES
-- ===========================================================
CREATE TABLE trabajadores (
    id            SERIAL PRIMARY KEY,
    documento     VARCHAR(20) UNIQUE NOT NULL,
    nombre        VARCHAR(160) NOT NULL,
    cargo_id      INT NOT NULL REFERENCES cargos(id),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    activo        BOOLEAN DEFAULT TRUE
);

-- ===========================================================
-- 7. ASIGNACIONES_EPP
-- ===========================================================
CREATE TABLE asignaciones_epp (
    id                SERIAL PRIMARY KEY,
    trabajador_id     INT NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    epp_id            INT NOT NULL REFERENCES epps(id),
    fecha_entrega     DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    estado            VARCHAR(20) DEFAULT 'activo',
    UNIQUE(trabajador_id, epp_id, fecha_entrega)
);

-- ===========================================================
-- ÍNDICES
-- ===========================================================
CREATE INDEX idx_cr_cargo   ON cargos_riesgos(cargo_id);
CREATE INDEX idx_cr_nivel   ON cargos_riesgos(nivel);
CREATE INDEX idx_cr_np_nc   ON cargos_riesgos(probabilidad, consecuencia);
CREATE INDEX idx_ce_cargo   ON cargos_epps(cargo_id);
CREATE INDEX idx_tr_cargo   ON trabajadores(cargo_id);
CREATE INDEX idx_as_trab    ON asignaciones_epp(trabajador_id);

-- ===========================================================
-- VISTA · Matriz consolidada (cargo + riesgo + EPPs)
-- ===========================================================
CREATE OR REPLACE VIEW v_matriz_riesgos AS
SELECT
    c.id            AS cargo_id,
    c.codigo        AS cargo_codigo,
    c.nombre        AS cargo,
    c.area,
    r.id            AS riesgo_id,
    r.nombre        AS riesgo,
    r.categoria     AS riesgo_categoria,
    cr.probabilidad,
    cr.consecuencia,
    cr.nivel        AS nivel,
    cr.valoracion,
    cr.controlado,
    COALESCE(
        (SELECT string_agg(e.nombre, ', ' ORDER BY e.nombre)
         FROM cargos_epps ce JOIN epps e ON e.id = ce.epp_id
         WHERE ce.cargo_id = c.id), ''
    ) AS epps_requeridos,
    CASE cr.nivel
        WHEN 'I'   THEN 'critico'
        WHEN 'II'  THEN 'alto'
        WHEN 'III' THEN 'medio'
        WHEN 'IV'  THEN 'bajo'
    END AS clasificacion
FROM cargos c
JOIN cargos_riesgos cr ON cr.cargo_id  = c.id
JOIN riesgos        r  ON r.id         = cr.riesgo_id
WHERE c.activo = TRUE;

-- ===========================================================
-- VISTA · Matriz NP × NC  (la cuadrícula 4×4 visual)
-- ===========================================================
CREATE OR REPLACE VIEW v_matriz_np_nc AS
WITH combinaciones AS (
    SELECT np::probabilidad_t AS probabilidad,
           nc::consecuencia_t AS consecuencia
    FROM unnest(ARRAY['MUY ALTA','ALTA','MEDIA','BAJA']) AS np
    CROSS JOIN unnest(ARRAY['LEVE','MODERADA','GRAVE','MUY GRAVE']) AS nc
)
SELECT
    cb.probabilidad,
    cb.consecuencia,
    -- Nivel derivado (matriz GTC 45 simplificada, coincide con la imagen)
    CASE
        WHEN cb.probabilidad='MUY ALTA' AND cb.consecuencia='LEVE'      THEN 'II'
        WHEN cb.probabilidad='MUY ALTA'                                 THEN 'I'
        WHEN cb.probabilidad='ALTA'     AND cb.consecuencia='LEVE'      THEN 'III'
        WHEN cb.probabilidad='ALTA'     AND cb.consecuencia='MODERADA'  THEN 'II'
        WHEN cb.probabilidad='ALTA'                                     THEN 'I'
        WHEN cb.probabilidad='MEDIA'    AND cb.consecuencia='LEVE'      THEN 'III'
        WHEN cb.probabilidad='MEDIA'    AND cb.consecuencia='MUY GRAVE' THEN 'I'
        WHEN cb.probabilidad='MEDIA'                                    THEN 'II'
        WHEN cb.probabilidad='BAJA'     AND cb.consecuencia='LEVE'      THEN 'IV'
        WHEN cb.probabilidad='BAJA'     AND cb.consecuencia='MUY GRAVE' THEN 'II'
        WHEN cb.probabilidad='BAJA'                                     THEN 'III'
    END::nivel_riesgo AS nivel,
    COUNT(cr.id)::int AS cantidad,
    COALESCE(
        json_agg(
            json_build_object(
                'cargo',      c.nombre,
                'riesgo',     r.nombre,
                'controlado', cr.controlado
            ) ORDER BY c.nombre
        ) FILTER (WHERE cr.id IS NOT NULL),
        '[]'::json
    ) AS detalle
FROM combinaciones cb
LEFT JOIN cargos_riesgos cr
       ON cr.probabilidad = cb.probabilidad
      AND cr.consecuencia = cb.consecuencia
LEFT JOIN cargos  c ON c.id = cr.cargo_id  AND c.activo
LEFT JOIN riesgos r ON r.id = cr.riesgo_id
GROUP BY cb.probabilidad, cb.consecuencia
ORDER BY
    CASE cb.probabilidad
        WHEN 'MUY ALTA' THEN 1 WHEN 'ALTA' THEN 2
        WHEN 'MEDIA'    THEN 3 WHEN 'BAJA' THEN 4 END,
    CASE cb.consecuencia
        WHEN 'LEVE'     THEN 1 WHEN 'MODERADA'  THEN 2
        WHEN 'GRAVE'    THEN 3 WHEN 'MUY GRAVE' THEN 4 END;

-- ===========================================================
-- VISTA · Cobertura EPP (semáforo por trabajador)
-- ===========================================================
CREATE OR REPLACE VIEW v_cobertura_epp AS
WITH requeridos AS (
    SELECT ce.cargo_id, COUNT(*) AS total_requeridos
    FROM cargos_epps ce
    WHERE ce.obligatorio = TRUE
    GROUP BY ce.cargo_id
),
asignados AS (
    SELECT t.id AS trabajador_id,
           COUNT(DISTINCT ae.epp_id) FILTER (
               WHERE ae.estado = 'activo'
               AND ae.epp_id IN (SELECT epp_id FROM cargos_epps WHERE cargo_id = t.cargo_id)
           ) AS total_asignados
    FROM trabajadores t
    LEFT JOIN asignaciones_epp ae ON ae.trabajador_id = t.id
    GROUP BY t.id
)
SELECT
    t.id                            AS trabajador_id,
    t.documento,
    t.nombre                        AS trabajador,
    c.id                            AS cargo_id,
    c.nombre                        AS cargo,
    COALESCE(r.total_requeridos, 0) AS requeridos,
    COALESCE(a.total_asignados, 0)  AS asignados,
    CASE
        WHEN COALESCE(r.total_requeridos,0) = 0 THEN 100
        ELSE ROUND( (COALESCE(a.total_asignados,0)::numeric
                    / r.total_requeridos::numeric) * 100 )
    END AS porcentaje_cobertura,
    CASE
        WHEN COALESCE(r.total_requeridos,0) = 0 THEN 'verde'
        WHEN COALESCE(a.total_asignados,0) >= r.total_requeridos THEN 'verde'
        WHEN COALESCE(a.total_asignados,0) >= r.total_requeridos * 0.7 THEN 'amarillo'
        ELSE 'rojo'
    END AS semaforo
FROM trabajadores t
JOIN cargos c  ON c.id = t.cargo_id
LEFT JOIN requeridos r ON r.cargo_id = c.id
LEFT JOIN asignados  a ON a.trabajador_id = t.id
WHERE t.activo = TRUE;


-- ===========================================================
-- DATOS DE EJEMPLO
-- ===========================================================

-- ----- Cargos -----
INSERT INTO cargos (codigo, nombre, area) VALUES
 ('OP-ALT', 'Operario de Alturas',           'Producción'),
 ('OP-MAQ', 'Operario de Maquinaria',        'Producción'),
 ('TC-ELE', 'Técnico Eléctrico',             'Mantenimiento'),
 ('OP-POL', 'Operario Expuesto a Polvo',     'Producción'),
 ('ADM-01', 'Oficinista / Administrativo',   'Administración'),
 ('OP-GEN', 'Operario General',              'Producción'),
 ('OP-EXT', 'Operario de Exteriores',        'Logística'),
 ('OP-PAR', 'Operario con Partículas',       'Producción');

-- ----- Riesgos -----
INSERT INTO riesgos (nombre, categoria) VALUES
 ('Caída de Alturas',        'locativo'),
 ('Ruido de Maquinaria',     'físico'),
 ('Atrapamiento',            'mecánico'),
 ('Contacto Eléctrico',      'eléctrico'),
 ('Inhalación de Polvo',     'químico'),
 ('Postura Prolongada',      'ergonómico'),
 ('Golpes por Objetos',      'mecánico'),
 ('Calor Extremo',           'físico'),
 ('Picaduras / Mordeduras',  'biológico'),
 ('Partículas en Ojos',      'físico'),
 ('Explosión / Incendio',    'físico-químico'),
 ('Fatiga Visual',           'ergonómico');

-- ----- EPPs -----
INSERT INTO epps (nombre, tipo, norma, stock) VALUES
 ('Arnés de seguridad',              'caída',        'ANSI Z359',   35),
 ('Casco de seguridad',              'cabeza',       'ANSI Z89.1', 120),
 ('Casco dieléctrico Clase E',       'cabeza',       'ANSI Z89.1',  40),
 ('Botas con puntera de acero',      'pies',         'ASTM F2413',  90),
 ('Botas dieléctricas',              'pies',         'ASTM F2413',  25),
 ('Línea de vida',                   'caída',        'ANSI Z359',   30),
 ('Protector auditivo',              'auditivo',     'ANSI S3.19', 200),
 ('Guantes de seguridad',            'manos',        'EN 388',     150),
 ('Guantes dieléctricos',            'manos',        'ASTM D120',   20),
 ('Gafas de seguridad',              'ocular',       'ANSI Z87.1', 180),
 ('Respirador N95',                  'respiratorio', 'NIOSH N95',  250),
 ('Soporte lumbar',                  'ergonómico',    NULL,          40),
 ('Silla ergonómica',                'ergonómico',    NULL,          30),
 ('Ropa térmica / alta visibilidad', 'cuerpo',       'ANSI 107',    60),
 ('Repelente de insectos',           'biológico',     NULL,          80),
 ('Ropa manga larga',                'cuerpo',        NULL,         110);

-- ----- Cargos × Riesgos (con NP / NC). Cuadrícula igual a la imagen -----
--   2 en MUY ALTA × MUY GRAVE
--   1 en ALTA × LEVE,  3 en ALTA × MODERADA, 1 en ALTA × GRAVE
--   3 en MEDIA × LEVE, 1 en MEDIA × GRAVE
--   1 en BAJA × LEVE
-- Total = 12 evaluaciones
INSERT INTO cargos_riesgos
    (cargo_id, riesgo_id, probabilidad, consecuencia, nivel, valoracion, controlado)
VALUES
 (1,  1,  'MUY ALTA', 'MUY GRAVE', 'I',   4000, TRUE),   -- Caída de Alturas
 (3, 11,  'MUY ALTA', 'MUY GRAVE', 'I',   3600, TRUE),   -- Explosión / Incendio
 (5, 12,  'ALTA',     'LEVE',      'III',   90, FALSE),  -- Fatiga Visual
 (2,  2,  'ALTA',     'MODERADA',  'II',   450, TRUE),   -- Ruido
 (2,  3,  'ALTA',     'MODERADA',  'II',   360, FALSE),  -- Atrapamiento
 (6,  7,  'ALTA',     'MODERADA',  'II',   300, TRUE),   -- Golpes por Objetos
 (3,  4,  'ALTA',     'GRAVE',     'I',    600, TRUE),   -- Contacto Eléctrico
 (5,  6,  'MEDIA',    'LEVE',      'III',   60, FALSE),  -- Postura Prolongada
 (7,  8,  'MEDIA',    'LEVE',      'III',   60, TRUE),   -- Calor Extremo
 (8, 10,  'MEDIA',    'LEVE',      'III',   80, TRUE),   -- Partículas en Ojos
 (4,  5,  'MEDIA',    'GRAVE',     'II',   180, TRUE),   -- Inhalación Polvo
 (7,  9,  'BAJA',     'LEVE',      'IV',    20, FALSE);  -- Picaduras

-- ----- Cargos_EPPs -----
INSERT INTO cargos_epps (cargo_id, epp_id) VALUES
 (1,1), (1,2), (1,4), (1,6),              -- Alturas
 (2,7), (2,8), (2,10), (2,4),             -- Maquinaria
 (3,9), (3,3), (3,5),                     -- Eléctrico
 (4,11), (4,10), (4,2),                   -- Polvo
 (5,12), (5,13),                          -- Oficinista
 (6,2), (6,4), (6,8),                     -- General
 (7,14), (7,15), (7,16),                  -- Exteriores
 (8,10), (8,2);                           -- Partículas

-- ----- Trabajadores -----
INSERT INTO trabajadores (documento, nombre, cargo_id) VALUES
 ('CC-1001', 'Carlos Pérez Márquez',     1),
 ('CC-1002', 'Luisa Gómez Ruiz',         2),
 ('CC-1003', 'Andrés Torres Silva',      3),
 ('CC-1004', 'María Herrera Vanegas',    5),
 ('CC-1005', 'Juan Castillo Ramírez',    6),
 ('CC-1006', 'Paola Jiménez Arce',       7);

-- ----- Asignaciones EPP -----
INSERT INTO asignaciones_epp (trabajador_id, epp_id, fecha_vencimiento) VALUES
 (1,1,'2027-01-01'), (1,2,'2027-01-01'), (1,4,'2027-01-01'), (1,6,'2027-01-01'),
 (2,7,'2027-01-01'), (2,8,'2027-01-01'),
 (3,9,'2027-01-01'), (3,3,'2027-01-01'), (3,5,'2027-01-01'),
 (5,2,'2027-01-01'), (5,4,'2027-01-01'), (5,8,'2027-01-01'),
 (6,14,'2027-01-01'), (6,16,'2027-01-01');

-- ===========================================================
-- FIN
-- ===========================================================
