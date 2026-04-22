[README.md](https://github.com/user-attachments/files/26950740/README.md)
# PROTEGO · Matriz de Riesgos & Cobertura de EPP

Sistema web responsivo para gestión de **riesgos laborales (SG-SST)**
con:
- **Matriz por cargo** (cargo + riesgo + EPP + controlado ✅/❌)
- **Matriz visual NP × NC** (cuadrícula 4×4 estilo GTC 45)
- **Semáforo de cobertura** de EPP por trabajador

Stack: **HTML + CSS + JavaScript (vanilla) + PHP + PostgreSQL**.

---

## 1 · Estructura del proyecto

```
protego/
├── sql/
│   └── schema.sql           ← esquema PostgreSQL + vistas + seed
├── config/
│   └── database.php         ← conexión PDO
├── api/
│   ├── matriz.php           ← GET  matriz completa
│   ├── matriz_grid.php      ← GET  cuadrícula 4×4 NP × NC
│   ├── cobertura.php        ← GET  semáforo por trabajador
│   ├── cargos.php           ← GET  catálogo de cargos
│   └── evaluacion.php       ← POST actualizar estado controlado
├── assets/
│   ├── css/styles.css
│   └── js/app.js
├── index.html
└── README.md
```

---

## 2 · Puesta en marcha

### 2.1 · Base de datos

```bash
createdb protego
psql -U postgres -d protego -f sql/schema.sql
```

El esquema crea 3 vistas pre-calculadas:
- `v_matriz_riesgos`  — matriz tabular
- `v_matriz_np_nc`    — cuadrícula 4×4 (una fila por celda, con JSON de detalle)
- `v_cobertura_epp`   — semáforo por trabajador

### 2.2 · Configurar credenciales

Variables de entorno o edita `config/database.php`:

```bash
export PG_HOST=localhost   PG_PORT=5432
export PG_NAME=protego     PG_USER=postgres   PG_PASS=••••
```

### 2.3 · Servidor PHP

Requisito: **PHP 8.0+** con `pdo_pgsql`.

```bash
php -S localhost:8000 -t /ruta/a/protego
```

### 2.4 · Activar conexión real

En `assets/js/app.js`:

```js
const CONFIG = {
  useDemo: false,   // ← antes: true
  ...
};
```

---

## 3 · Endpoints

| Método | Ruta                    | Descripción                                   |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/api/matriz.php`       | Matriz tabular. Filtros: `?nivel`, `?cargo_id`, `?q` |
| GET    | `/api/matriz_grid.php`  | Cuadrícula 4×4 con conteos y detalle por celda |
| GET    | `/api/cobertura.php`    | Semáforo EPP por trabajador                  |
| GET    | `/api/cargos.php`       | Catálogo de cargos                           |
| POST   | `/api/evaluacion.php`   | Toggle "controlado" de un par cargo-riesgo   |

Ejemplo:

```bash
curl http://localhost:8000/api/matriz_grid.php | jq .grid[0]
```

---

## 4 · Matriz NP × NC

**Ejes:**
- Probabilidad (NP): `BAJA`, `MEDIA`, `ALTA`, `MUY ALTA`
- Consecuencia (NC): `LEVE`, `MODERADA`, `GRAVE`, `MUY GRAVE`

**Clasificación derivada** (regla `v_matriz_np_nc`):

|             | LEVE | MODERADA | GRAVE | MUY GRAVE |
|-------------|:----:|:--------:|:-----:|:---------:|
| **MUY ALTA**| II   | I        | I     | I         |
| **ALTA**    | III  | II       | I     | I         |
| **MEDIA**   | III  | II       | II    | I         |
| **BAJA**    | IV   | III      | III   | II        |

- 🟢 **IV (Bajo)**
- 🟡 **III (Medio)**
- 🟠 **II (Alto)**
- 🔴 **I (Muy Alto)**

La vista muestra el **número de riesgos en cada celda** con un tooltip
interactivo (hover) que lista los pares cargo–riesgo correspondientes.

---

## 5 · Semáforo de cobertura EPP

```
%   = (EPP asignados activos  ÷  EPP requeridos del cargo) × 100

🟢 Verde     → 100 %
🟡 Amarillo  → ≥ 70 %  y < 100 %
🔴 Rojo      → < 70 %
```

---

## 6 · Flujo recomendado (Protego)

1. **Definir cargos** → módulo "Cargos" → tabla `cargos`
2. **Catalogar riesgos y EPPs** → `riesgos`, `epps`
3. **Evaluar cargo ↔ riesgo** con NP/NC → `cargos_riesgos`
4. **Asociar EPP mínimo por cargo** → `cargos_epps`
5. **Registrar trabajadores y entregar EPP** → `trabajadores`, `asignaciones_epp`
6. **Monitorear** las tres pestañas:
   - *Matriz de riesgos* — qué controlar
   - *Matriz NP × NC* — dónde están concentrados los peligros
   - *Semáforo de cobertura* — quién tiene EPP completo

---

## 7 · Responsive

| Pantalla                  | Matriz tabular       | Matriz NP × NC                |
|---------------------------|----------------------|-------------------------------|
| ≥ 1024 px (desktop)       | Tabla 6 columnas     | Cuadrícula 4×4 con tooltips   |
| 768 – 1023 px (tablet)    | Tabla compacta       | Cuadrícula 4×4 ajustada       |
| ≤ 768 px (móvil)          | Cards apiladas       | Cuadrícula 4×4 compacta       |
| ≤ 420 px (móvil pequeño)  | KPIs en 2 columnas   | Celdas mínimas 48 × 48 px     |

---

## 8 · Seguridad recomendada

- Proteger `/api/*` con sesión y roles.
- HTTPS en producción.
- CORS cerrado — ajustar en `config/database.php`.
- Usar sentencias preparadas con PDO (ya aplicado).

---

## 9 · Próximos pasos sugeridos

- Exportar matriz a Excel / PDF.
- Notificaciones cuando la cobertura baje de umbral.
- Historial de cambios (auditoría).
- Edición de NP/NC desde la UI (modal).
- Integración con capacitaciones.

