# 🚀 Cómo usar Google Apps Script como HOSTING GRATUITO para tu página web

Con esta configuración, **Google aloja tu página web gratis** con certificado SSL (HTTPS), diseño responsive y conecta los formularios en tiempo real con una planilla de Google Sheets.

---

## ⚡ Opción Rápida (Recomendada: Solo 2 archivos)

Carpeta de origen: [`apps-script/version-un-solo-archivo/`](version-un-solo-archivo/)

### Paso 1: Crear la Hoja de Cálculo en Google Drive
1. Entrá a [Google Sheets](https://sheets.new) (creará una planilla nueva en blanco).
2. Ponéle de título a la planilla: **"UMSA - Base de Turnos"** (o el nombre que prefieras).
3. *(Opcional)* No hace falta crear columnas ni renombrar la hoja: **el script crea la pestaña "Turnos" y las cabeceras rojas automáticamente en tu primer uso**.

---

### Paso 2: Abrir el editor de Apps Script
1. En el menú superior de tu planilla, hacé clic en **Extensiones** > **Apps Script**.
2. Se abrirá una pestaña nueva con el editor de código de Google.

---

### Paso 3: Pegar los 2 archivos

#### Archivo 1: `Código.gs`
1. En el editor verás un archivo llamado `Código.gs`. Borrá lo que tenga adentro.
2. Abrí [`apps-script/version-un-solo-archivo/Code.gs`](version-un-solo-archivo/Code.gs), copiá todo su contenido y pegalo en `Código.gs`.

#### Archivo 2: `index.html`
1. En el panel izquierdo de Apps Script, hacé clic en el botón **+** (junto a "Archivos").
2. Elegí **HTML**.
3. Escribí exactamente el nombre: `index` (Google le agregará `.html` automáticamente).
4. Borrá el código que aparece por defecto.
5. Abrí [`apps-script/version-un-solo-archivo/index.html`](version-un-solo-archivo/index.html), copiá todo su contenido y pegalo.

Hacé clic en el ícono de **Guardar** (el disquete 💾) o presioná `Ctrl + S`.

---

### Paso 4: Publicar la página web (Implementar)

1. En la esquina superior derecha hacé clic en el botón azul **Implementar** (Deploy) > **Nueva implementación**.
2. Al lado de "Seleccionar tipo", hacé clic en el ícono del **Engranaje ⚙️** y elegí **Aplicación web**.
3. Completá la ventana:
   - **Descripción:** *Web UMSA v1*
   - **Ejecutar como:** **Yo (tu correo de Google)**
   - **Quién tiene acceso:** **Cualquier usuario** *(Imprescindible para que los pacientes puedan entrar sin que les pida login)*.
4. Hacé clic en **Implementar**.
5. Google te pedirá autorizar permisos una sola vez:
   - Hacé clic en **Revisar permisos** (o *Authorize access*).
   - Elegí tu cuenta de Google.
   - Si te muestra "Google no verificó esta app", hacé clic abajo en **Avanzado** (o *Advanced*) y luego en **Ir a Proyecto (no seguro)**.
   - Hacé clic en **Permitir**.
6. ¡Listo! Te mostrará una ventana con la **URL de la aplicación web**:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## 📱 ¿Cómo se usa?

- Copiá esa URL y abrila en tu navegador, mandátela por WhatsApp al celular o abrila en una tablet.
- Verás el diseño completo idéntico de UMSA:
  1. Hacé clic en **Solicitar turno**, elegí una especialidad (notarás que completa automáticamente el médico asignado).
  2. Confirmá el turno.
  3. Andá a tu Google Sheet: ¡el turno aparecerá registrado al instante!
  4. Probá el botón **Consultar turno**, poné el DNI del paciente y verás los datos recuperados en vivo desde Google Sheets.

---

## 🔄 ¿Cómo actualizar la página si hacés cambios en el código?
Cada vez que modifiques el código en Apps Script:
1. Hacé clic en **Implementar** > **Gestionar implementaciones**.
2. Hacé clic en el ícono del **Lápiz ✏️** (Editar).
3. En "Versión", elegí **Nueva versión**.
4. Hacé clic en **Implementar**. Tu enlace seguirá siendo el mismo y mostrará los cambios actualizados.
