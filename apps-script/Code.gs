/**
 * ===================================================================
 * UMSA - CENTRO MÉDICO INTEGRAL ("APOSTÁ A LA VIDA")
 * Servidor y Backend en Google Apps Script
 *
 * Hoja de cálculo de referencia:
 * https://docs.google.com/spreadsheets/d/e/2PACX-1vS24UmpDwnUUlUG927SQRjJlffIj5rtPB9ytlEBgnV9EoTxFTEJMAhLEJ4l9KNTSBNKKVAAbp08RRJ3/pubhtml?gid=0&single=true
 * ===================================================================
 */

const SHEET_NAME = "Turnos";
const USERS_SHEET_NAME = "Usuarios";

// Columnas exactas de la pestaña Turnos (A-J)
const TURNOS_HEADERS = [
  "REGISTRO",
  "ID TURNO",
  "NOMBRE",
  "DNI",
  "TELEFONO",
  "ESPECIALIDAD",
  "PROFESIONAL",
  "FECHA",
  "HORA",
  "ESTADO"
];

// Columnas de la pestaña Usuarios (A-G)
const USERS_HEADERS = [
  "EMAIL",
  "PASSWORD_HASH",
  "SALT",
  "ROL",
  "ESTADO",
  "CREADO",
  "ULTIMO_ACCESO"
];

// Duración de token de sesión en segundos (6 horas)
const SESSION_TTL_SECONDS = 21600;

/**
 * Manejador principal de peticiones HTTP POST
 */
function doPost(event) {
  try {
    const rawContent = event && event.postData ? event.postData.contents : "{}";
    const payload = JSON.parse(rawContent);

    ensureSheetsInitialized();

    const action = String(payload.action || "").trim();

    // 1. Acciones de Autenticación y Rol Kiosco
    if (action === "login") {
      return response(handleLogin(payload));
    }

    if (action === "verify_session") {
      return response(handleVerifySession(payload));
    }

    if (action === "update_status") {
      return response(handleUpdateStatus(payload));
    }

    // 2. Acciones Públicas de Turnos
    if (action === "create") {
      return response(handleCreateAppointment(payload));
    }

    if (action === "lookup") {
      return response(handleLookupAppointment(payload));
    }

    return response({ ok: false, message: "Acción no reconocida: " + action });
  } catch (error) {
    return response({
      ok: false,
      message: error.message || "Error interno al procesar la solicitud en Google Apps Script."
    });
  }
}

/**
 * Manejador para servir la interfaz web directamente como Web App de Google
 */
function doGet(e) {
  try {
    ensureSheetsInitialized();
    const template = HtmlService.createTemplateFromFile("index");
    const output = template.evaluate();
    output.setTitle("UMSA - Centro Médico");
    output.addMetaTag("viewport", "width=device-width, initial-scale=1.0");
    output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return output;
  } catch (err) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;padding:2rem;text-align:center;'>" +
      "<h2 style='color:#c92332;'>UMSA - Centro Médico</h2>" +
      "<p>Backend en Google Apps Script activo y listo para recibir solicitudes.</p>" +
      "</div>"
    );
  }
}

function handleLogin(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    return { ok: false, message: "Por favor completá correo y contraseña." };
  }

  const user = findUserByEmail(email);
  if (!user || user.estado !== "Activo") {
    return { ok: false, message: "Correo o contraseña incorrectos." };
  }

  const computedHash = computeHash(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return { ok: false, message: "Correo o contraseña incorrectos." };
  }

  const token = "umsa_tk_" + Utilities.getUuid().replace(/-/g, "");
  const sessionData = {
    email: user.email,
    rol: user.rol,
    createdAt: new Date().toISOString()
  };

  CacheService.getScriptCache().put(token, JSON.stringify(sessionData), SESSION_TTL_SECONDS);
  updateUserLastAccess(email);

  return {
    ok: true,
    token: token,
    user: {
      email: user.email,
      rol: user.rol
    }
  };
}

function handleVerifySession(payload) {
  const token = String(payload.token || "").trim();
  if (!token) {
    return { ok: false, code: "UNAUTHORIZED", message: "Token no proporcionado." };
  }

  const session = getSession(token);
  if (!session) {
    return { ok: false, code: "UNAUTHORIZED", message: "Sesión inválida o expirada." };
  }

  const user = findUserByEmail(session.email);
  if (!user || user.estado !== "Activo") {
    CacheService.getScriptCache().remove(token);
    return { ok: false, code: "UNAUTHORIZED", message: "Usuario deshabilitado o inexistente." };
  }

  return {
    ok: true,
    valid: true,
    user: {
      email: user.email,
      rol: user.rol
    }
  };
}

function handleUpdateStatus(payload) {
  const token = String(payload.token || "").trim();
  const session = getSession(token);

  if (!session || session.rol !== "Kiosco") {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Operación restringida. Se requiere autorización con rol Kiosco."
    };
  }

  const idTurno = String(payload.idTurno || "").trim();
  const dni = String(payload.dni || "").replace(/\D/g, "");
  const nuevoEstado = String(payload.estado || "").trim();

  if (!nuevoEstado) {
    return { ok: false, message: "El nuevo estado no puede estar vacío." };
  }

  const sheet = getSheet(SHEET_NAME);
  const data = sheet.getDataRange().getDisplayValues();
  let rowUpdated = false;

  for (let i = data.length - 1; i >= 1; i--) {
    const rowId = String(data[i][1] || "").trim();
    const rowDni = String(data[i][3] || "").replace(/\D/g, "");

    if ((idTurno && rowId === idTurno) || (dni && rowDni === dni)) {
      sheet.getRange(i + 1, 10).setValue(nuevoEstado);
      rowUpdated = true;
      break;
    }
  }

  if (!rowUpdated) {
    return { ok: false, message: "No se encontró el turno especificado para actualizar." };
  }

  return { ok: true, message: "Estado de turno actualizado a: " + nuevoEstado };
}

function handleCreateAppointment(payload) {
  const sheet = getSheet(SHEET_NAME);

  const nombre = clean(payload.nombre);
  const dni = clean(payload.dni).replace(/\D/g, "");
  const telefono = clean(payload.telefono);
  const especialidad = clean(payload.especialidad);
  const profesional = clean(payload.profesional);
  const fecha = clean(payload.fecha);
  const hora = clean(payload.hora || payload.horario);
  const estado = "Solicitud recibida";

  if (!nombre || !dni || !telefono || !especialidad || !profesional || !fecha || !hora) {
    return { ok: false, message: "Completá correctamente todos los campos obligatorios." };
  }

  if (dni.length < 7 || dni.length > 8) {
    return { ok: false, message: "Ingresá un DNI válido de 7 u 8 números." };
  }

  const now = new Date();
  const registroStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT-3", "yyyy-MM-dd HH:mm:ss");
  const idTurno = "UMSA-" + ("" + now.getTime()).slice(-6);

  sheet.appendRow([
    registroStr,
    idTurno,
    nombre,
    dni,
    telefono,
    especialidad,
    profesional,
    fecha,
    hora,
    estado
  ]);

  return {
    ok: true,
    appointment: {
      idTurno: idTurno,
      nombre: nombre,
      dni: dni,
      telefono: telefono,
      especialidad: especialidad,
      profesional: profesional,
      fecha: fecha,
      hora: hora,
      horario: hora,
      estado: estado
    }
  };
}

function handleLookupAppointment(payload) {
  const sheet = getSheet(SHEET_NAME);
  const dniBuscado = String(payload.dni || "").replace(/\D/g, "");

  if (dniBuscado.length < 7 || dniBuscado.length > 8) {
    return { ok: false, message: "Ingresá un DNI válido de 7 u 8 números." };
  }

  const values = sheet.getDataRange().getDisplayValues();
  let foundRow = null;

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
    const rowDni = String(values[rowIndex][3] || "").replace(/\D/g, "");
    if (rowDni === dniBuscado) {
      foundRow = values[rowIndex];
      break;
    }
  }

  if (!foundRow) {
    return { ok: true, found: false };
  }

  return {
    ok: true,
    found: true,
    appointment: {
      registro: foundRow[0] || "",
      idTurno: foundRow[1] || "",
      nombre: foundRow[2] || "",
      dni: foundRow[3] || "",
      telefono: foundRow[4] || "",
      especialidad: foundRow[5] || "",
      profesional: foundRow[6] || "",
      fecha: foundRow[7] || "",
      hora: foundRow[8] || "",
      horario: foundRow[8] || "",
      estado: foundRow[9] || "Solicitud recibida"
    }
  };
}

function getSession(token) {
  try {
    const raw = CacheService.getScriptCache().get(token);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function computeHash(password, salt) {
  const combined = String(password) + ":" + String(salt);
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);
  let hexString = "";
  for (let i = 0; i < signature.length; i++) {
    let byteVal = signature[i];
    if (byteVal < 0) byteVal += 256;
    const byteHex = byteVal.toString(16);
    hexString += (byteHex.length === 1 ? "0" : "") + byteHex;
  }
  return hexString;
}

function findUserByEmail(email) {
  const sheet = getSheet(USERS_SHEET_NAME);
  const data = sheet.getDataRange().getDisplayValues();

  for (let i = 1; i < data.length; i++) {
    const rowEmail = String(data[i][0] || "").trim().toLowerCase();
    if (rowEmail === email) {
      return {
        rowIndex: i + 1,
        email: rowEmail,
        passwordHash: data[i][1],
        salt: data[i][2],
        rol: data[i][3],
        estado: data[i][4]
      };
    }
  }
  return null;
}

function updateUserLastAccess(email) {
  const user = findUserByEmail(email);
  if (user) {
    const sheet = getSheet(USERS_SHEET_NAME);
    sheet.getRange(user.rowIndex, 7).setValue(new Date().toISOString());
  }
}

function ensureSheetsInitialized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let turnosSheet = ss.getSheetByName(SHEET_NAME);
  if (!turnosSheet) {
    turnosSheet = ss.insertSheet(SHEET_NAME);
    turnosSheet.appendRow(TURNOS_HEADERS);
    styleHeaderRow(turnosSheet, TURNOS_HEADERS.length);
  } else if (turnosSheet.getLastRow() === 0) {
    turnosSheet.appendRow(TURNOS_HEADERS);
    styleHeaderRow(turnosSheet, TURNOS_HEADERS.length);
  }

  let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET_NAME);
    usersSheet.appendRow(USERS_HEADERS);
    styleHeaderRow(usersSheet, USERS_HEADERS.length);
    seedInitialUser(usersSheet);
  } else if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(USERS_HEADERS);
    styleHeaderRow(usersSheet, USERS_HEADERS.length);
    seedInitialUser(usersSheet);
  } else if (usersSheet.getLastRow() === 1) {
    seedInitialUser(usersSheet);
  }
}

function seedInitialUser(usersSheet) {
  const initialEmail = "valentinagalo12@gmail.com";
  const initialPassword = "1234";
  const initialRole = "Kiosco";

  const salt = Utilities.getUuid().replace(/-/g, "").slice(0, 16);
  const hash = computeHash(initialPassword, salt);

  usersSheet.appendRow([
    initialEmail,
    hash,
    salt,
    initialRole,
    "Activo",
    new Date().toISOString(),
    ""
  ]);
}

function styleHeaderRow(sheet, cols) {
  try {
    const range = sheet.getRange(1, 1, 1, cols);
    range.setBackground("#c92332");
    range.setFontColor("#ffffff");
    range.setFontWeight("bold");
    sheet.setFrozenRows(1);
  } catch (e) {}
}

function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`La pestaña "${name}" no fue encontrada en la planilla de Google Sheets.`);
  }
  return sheet;
}

function clean(val) {
  return String(val || "").trim();
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
