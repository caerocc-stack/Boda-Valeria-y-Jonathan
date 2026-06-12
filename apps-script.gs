/**
 * Google Apps Script — Backend de confirmaciones de la boda Valeria & Jonathan
 *
 * QUÉ HACE cada vez que un invitado confirma:
 *  1) Agrega una fila a tu Google Sheet con todos los datos.
 *  2) Guarda la imagen (tarjetas + menú) en una carpeta de tu Google Drive.
 *  3) Envía un email a los novios con esa imagen adjunta y el resumen.
 *
 * CÓMO INSTALARLO (una sola vez):
 *  1. Creá una Planilla de Google nueva (sheets.new).
 *  2. Menú: Extensiones → Apps Script.
 *  3. Borrá todo el contenido y pegá ESTE archivo completo.
 *  4. Guardá (ícono de disquete).
 *  5. Implementar → Nueva implementación → Tipo: "Aplicación web".
 *       - Ejecutar como: "Yo" (tu cuenta).
 *       - Quién tiene acceso: "Cualquier persona".
 *  6. Implementar → Autorizar acceso (aceptá los permisos de Drive y Gmail).
 *  7. Copiá la URL que termina en /exec.
 *  8. Pasásela a Claude (junto con el correo de los novios) para dejarla fija en el código,
 *     o cargala en el Panel de Anfitrión de la web (engranaje arriba a la derecha).
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Cabeceras si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha Registro", "Referente", "Asiste", "Invitados (Nombres)", "Cantidad",
        "Menú Seleccionado", "Celíaco", "Diabético", "Intolerante Lactosa", "Alergia Maní",
        "Detalles / Aclaraciones", "Mensaje de Deseos", "Link Imagen (Drive)"
      ]);
    }

    // Guardar imagen en Drive
    var fileUrl = "";
    if (data.imageBase64) {
      try {
        var folderName = "Fotos Confirmaciones Boda V&J";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        var base64Data = data.imageBase64.split(",")[1];
        var blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data),
          "image/png",
          "confirmacion_" + String(data.representative).replace(/\s+/g, '_') + ".png"
        );
        fileUrl = folder.createFile(blob).getUrl();
      } catch (err) {
        fileUrl = "Error guardando imagen: " + err.toString();
      }
    }

    // Agregar fila
    sheet.appendRow([
      new Date(),
      data.representative,
      data.attending ? "SÍ" : "NO",
      (data.membersList || []).join(", "),
      data.quantity,
      data.menuType || "N/A",
      data.celiac ? "SÍ" : "NO",
      data.diabetic ? "SÍ" : "NO",
      data.lactoseIntolerant ? "SÍ" : "NO",
      data.peanutAllergy ? "SÍ" : "NO",
      data.extraDetails || "",
      data.messageOnly || "",
      fileUrl
    ]);

    // Enviar copia por email a los novios
    if (data.noviosEmail) {
      try {
        var restric = [];
        if (data.celiac) restric.push("Celíaco (Sin TACC)");
        if (data.diabetic) restric.push("Diabético");
        if (data.lactoseIntolerant) restric.push("Intolerante a la lactosa");
        if (data.peanutAllergy) restric.push("Alergia al maní");

        var cuerpo =
          "Nueva confirmación recibida:\n\n" +
          "Referente: " + data.representative + "\n" +
          "Asiste: " + (data.attending ? "SÍ" : "NO") + "\n" +
          "Cantidad de pases: " + data.quantity + "\n" +
          "Integrantes: " + (data.membersList || []).join(", ") + "\n" +
          "Menú: " + (data.menuType || "N/A") + "\n" +
          "Restricciones: " + (restric.length ? restric.join(", ") : "Ninguna") + "\n" +
          "Aclaraciones: " + (data.extraDetails || "-") + "\n" +
          "Mensaje: " + (data.messageOnly || "-");

        var opciones = { name: "Invitacion Boda V&J" };
        if (data.imageBase64) {
          var emailB64 = data.imageBase64.split(",")[1];
          opciones.attachments = [Utilities.newBlob(
            Utilities.base64Decode(emailB64),
            "image/png",
            "tarjetas_" + String(data.representative).replace(/\s+/g, '_') + ".png"
          )];
        }
        MailApp.sendEmail(data.noviosEmail, "Confirmacion de boda - " + data.representative, cuerpo, opciones);
      } catch (mailErr) {
        // Si falla el email, no interrumpimos el guardado en la planilla
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl: fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
