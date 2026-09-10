# UMSA - Centro Médico ("APOSTÁ A LA VIDA")

Sitio web oficial, moderno, responsive y accesible para **UMSA Centro Médico** (San Andrés de Giles), con sistema integrado de solicitud y consulta de turnos médicos, autenticación para rol **Kiosco** y persistencia en **Google Sheets** mediante **Google Apps Script**.

---

## 🏛️ Arquitectura del Sistema

```
Frontend Web (UMSA)
      │
      ▼
Sistema de Autenticación de Usuario Kiosco
      │
      ▼ (HTTP POST directo con JSON / text-plain)
Google Apps Script (Web App / doPost)
      │
      ▼
Google Sheets (Pestañas: "Turnos" y "Usuarios")
```

- **Sin intermediarios externos**: Conexión directa cliente-servidor sin servidores ni proxies de terceros.
- **Validación del lado del servidor**: Los tokens de sesión y permisos del rol `Kiosco` son comprobados de forma estricta por Google Apps Script en cada operación privada (`verify_session`, `update_status`).
- **Cero contraseñas en frontend**: No se almacenan contraseñas en texto plano ni dentro del código cliente.

---

## 📁 Estructura del Proyecto

```
umsa-centro-medico/
├── index.html               # Estructura semántica, accesible, modal de login y panel Kiosco
├── styles.css               # Diseño visual médico UMSA, paleta institucional y diseño responsive clamp()
├── app.js                   # Lógica interactiva, autocompletado médico, validaciones y cliente Kiosco
├── assets/
│   └── favicon.svg          # Favicon vectorial institucional UMSA
├── backend/
│   └── Code.gs              # Código del servidor para Google Apps Script
├── apps-script/
│   └── Code.gs              # Copia para implementación directa en Google Apps Script
└── README.md                # Documentación del sistema
```

---

## 🔑 Usuario Inicial Habilitado (Rol Kiosco)

El sistema cuenta con un usuario inicial configurado de forma segura en Google Apps Script:

- **Correo electrónico:** `valentinagalo12@gmail.com`
- **Contraseña inicial:** `1234`
- **Rol:** `Kiosco`
- **Seguridad:** La contraseña se almacena hasheada con **SHA-256 + Salt** en la pestaña `Usuarios` de Google Sheets. La contraseña `1234` se utiliza únicamente como clave inicial y no está escrita en el código frontend.

---

## 📊 Estructura de Google Sheets

Hoja de cálculo de referencia:
[https://docs.google.com/spreadsheets/d/e/2PACX-1vS24UmpDwnUUlUG927SQRjJlffIj5rtPB9ytlEBgnV9EoTxFTEJMAhLEJ4l9KNTSBNKKVAAbp08RRJ3/pubhtml?gid=0&single=true](https://docs.google.com/spreadsheets/d/e/2PACX-1vS24UmpDwnUUlUG927SQRjJlffIj5rtPB9ytlEBgnV9EoTxFTEJMAhLEJ4l9KNTSBNKKVAAbp08RRJ3/pubhtml?gid=0&single=true)

### 1. Pestaña `Turnos` (Columnas A - J)
| Columna | Campo | Descripción |
|---|---|---|
| **A** | REGISTRO | Marca temporal automática (yyyy-MM-dd HH:mm:ss) |
| **B** | ID TURNO | Identificador autogenerado (ej. `UMSA-123456`) |
| **C** | NOMBRE | Nombre y apellido del paciente |
| **D** | DNI | DNI numérico (7 u 8 dígitos) |
| **E** | TELEFONO | Teléfono de contacto |
| **F** | ESPECIALIDAD | Clínica Médica, Odontología, Reumatología, Neurología |
| **G** | PROFESIONAL | Médico asignado automáticamente |
| **H** | FECHA | Fecha seleccionada (actual o futura) |
| **I** | HORA | Horario del turno (08:00 a 19:00 hs.) |
| **J** | ESTADO | `Solicitud recibida`, `Presente en sala`, `Atendido` |

### 2. Pestaña `Usuarios` (Columnas A - G)
| Columna | Campo | Descripción |
|---|---|---|
| **A** | EMAIL | Correo del usuario (`valentinagalo12@gmail.com`) |
| **B** | PASSWORD_HASH | Hash criptográfico SHA-256 |
| **C** | SALT | Semilla criptográfica aleatoria |
| **D** | ROL | `Kiosco` |
| **E** | ESTADO | `Activo` |
| **F** | CREADO | Fecha de creación de la cuenta |
| **G** | ULTIMO_ACCESO | Registro del último inicio de sesión |

> **Nota:** Si las pestañas no existen en la hoja de cálculo, el script `Code.gs` las crea e inicializa automáticamente con sus encabezados rojos institucionales y el usuario Kiosco inicial en su primera ejecución.

---

## ⚙️ Cómo Implementar Google Apps Script

1. Entrá a tu planilla en [Google Sheets](https://sheets.new) o abrí tu hoja existente.
2. En el menú superior, hacé clic en **Extensiones** > **Apps Script**.
3. Borrá el código por defecto y pegá todo el contenido de [`backend/Code.gs`](backend/Code.gs).
4. Guardá los cambios (`Ctrl + S`).
5. Hacé clic en el botón azul superior **Implementar** > **Nueva implementación**.
6. En el engranaje ⚙️, seleccioná **Aplicación web**:
   - **Descripción:** `API UMSA Centro Médico`
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** `Cualquier usuario`
7. Hacé clic en **Implementar**, autorizá los permisos de Google y copiá la **URL de la aplicación web** generada (termina en `/exec`).
8. Pegá esa URL en `app.js` en la variable `APPS_SCRIPT_URL`, o definila globalmente en `window.UMSA_CONFIG`:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/TU_DEPLOY_ID/exec";
   ```

---

## 🖥️ Cómo Probar la Página Localmente

### Opción 1: Abrir directamente el archivo
Hacé doble clic en `index.html` en el explorador de archivos para abrirlo en cualquier navegador.

### Opción 2: Servidor local ligero
En PowerShell o terminal, ejecutá:
```powershell
python -m http.server 8080
```
Luego abrilo en tu navegador: [http://localhost:8080](http://localhost:8080).

---

## 🩺 Identidad Visual y Mapeo Médico

- **Rojo institucional:** `#c92332`
- **Rojo hover/error:** `#9e1825` / `#a81f2d`
- **Fondo suave:** `#f5f3ef`
- **Fondo oscuro de contacto:** `#252a2e`
- **Verde confirmación:** `#176b4d`
- **Tipografías Google Fonts:** *Libre Franklin* (títulos y marca UMSA) y *DM Sans* (textos y controles).

### Mapeo Automático de Profesionales
- **Clínica Médica** → `Dr. Lecouna`
- **Odontología** → `Dr. Ortega`
- **Reumatología** → `Dr. Fullop`
- **Neurología** → `Dr. Devechi`
