import React, { useState } from 'react';
import { WeddingConfig } from '../types';
import { X, Save, Copy, Check, ShieldAlert, Award } from 'lucide-react';

interface HostPanelProps {
  config: WeddingConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: WeddingConfig) => void;
}

export default function HostPanel({ config, isOpen, onClose, onSave }: HostPanelProps) {
  const [scriptUrl, setScriptUrl] = useState(config.scriptUrl);
  const [noviosEmail, setNoviosEmail] = useState(config.noviosEmail);
  const [bank, setBank] = useState(config.bankInfo.bank);
  const [cbu, setCbu] = useState(config.bankInfo.cbu);
  const [alias, setAlias] = useState(config.bankInfo.alias);
  const [titular, setTitular] = useState(config.bankInfo.titular);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      scriptUrl,
      noviosEmail,
      bankConfigured: true, // al guardar, se oculta el botón "Configurar datos bancarios" para los invitados
      bankInfo: {
        bank,
        cbu,
        alias,
        titular
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const appsScriptCode = `/*
  Google Apps Script para vincular tu Invitación de Boda a Google Sheets
  1. Creá una Planilla de Google nueva.
  2. En el menú, vas a Extensiones > Apps Script.
  3. Borrá todo el editor de código y pega ESTE código.
  4. Hacé clic en "Guardar" e "Implementar" (Esquina superior derecha) > "Nueva implementación".
  5. Tipo de implementación: "Aplicación web".
  6. Configurar:
     - Ejecutar como: "Tú" (tu mail).
     - Quién tiene acceso: "Cualquier persona" o "Anyone".
  7. Hacé clic en "Implementar" y autorizá los permisos.
  8. Copiá la URL de la aplicación web que te da y pegala en este panel de configuración.
*/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Si la hoja está vacía, genera cabeceras
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha Registro",
        "Referente",
        "Asiste",
        "Invitados (Nombres)",
        "Cantidad",
        "Menú Seleccionado",
        "Restricciones Celíaco",
        "Diabético",
        "Intolerante Lactosa",
        "Alergia Maní",
        "Detalles / Aclaraciones",
        "Mensaje de Deseos",
        "Link Imagen Combinada (Subida)"
      ]);
    }
    
    // Guardar imagen en Drive si está presente
    var fileUrl = "";
    if (data.imageBase64) {
      try {
        var folderName = "Fotos Confirmaciones Boda V&J";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder;
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        
        var base64Data = data.imageBase64.split(",")[1];
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, "image/png", "confirmacion_" + data.representative.replace(/\\s+/g, '_') + ".png");
        var file = folder.createFile(blob);
        fileUrl = file.getUrl();
      } catch (err) {
        fileUrl = "Error guardando imagen: " + err.toString();
      }
    }
    
    // Agregar fila
    sheet.appendRow([
      new Date(),
      data.representative,
      data.attending ? "SÍ" : "NO",
      data.membersList.join(", "),
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

    // Enviar copia por email a los novios (si se configuró un correo en el panel)
    if (data.noviosEmail) {
      try {
        var restric = [];
        if (data.celiac) restric.push("Celíaco (Sin TACC)");
        if (data.diabetic) restric.push("Diabético");
        if (data.lactoseIntolerant) restric.push("Intolerante a la lactosa");
        if (data.peanutAllergy) restric.push("Alergia al maní");

        var cuerpo =
          "Nueva confirmación recibida:\\n\\n" +
          "Referente: " + data.representative + "\\n" +
          "Asiste: " + (data.attending ? "SÍ" : "NO") + "\\n" +
          "Cantidad de pases: " + data.quantity + "\\n" +
          "Integrantes: " + data.membersList.join(", ") + "\\n" +
          "Menú: " + (data.menuType || "N/A") + "\\n" +
          "Restricciones: " + (restric.length ? restric.join(", ") : "Ninguna") + "\\n" +
          "Aclaraciones: " + (data.extraDetails || "-") + "\\n" +
          "Mensaje: " + (data.messageOnly || "-");

        var opciones = { name: "Invitacion Boda V&J" };
        if (data.imageBase64) {
          var emailB64 = data.imageBase64.split(",")[1];
          var emailBlob = Utilities.newBlob(
            Utilities.base64Decode(emailB64),
            "image/png",
            "tarjetas_" + data.representative.replace(/\\s+/g, '_') + ".png"
          );
          opciones.attachments = [emailBlob];
        }
        MailApp.sendEmail(data.noviosEmail, "Confirmacion de boda - " + data.representative, cuerpo, opciones);
      } catch (mailErr) {
        // Si falla el envío de email no interrumpimos el guardado en la planilla
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl: fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="host_panel_overlay">
      <div className="relative w-full max-w-2xl bg-[#FAF7F0] border-2 border-[#C2A878] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" id="host_panel">
        
        {/* Decorative Top Line */}
        <div className="h-1.5 bg-gradient-to-r from-gold via-ivory to-gold" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/20 bg-[#F0E9DD]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gold" />
            <span className="font-sans text-xs uppercase tracking-widest font-semibold text-charcoal">
              Panel de Anfitrión (Secret)
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gold/15 rounded-full transition-colors text-topo hover:text-charcoal"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="bg-sage/10 rounded-lg p-4 border border-sage/20 text-xs text-charcoal space-y-1">
            <h4 className="font-semibold text-sage flex items-center gap-2">
              <Award className="w-4 h-4" /> ¡Felicidades Valeria & Jonathan!
            </h4>
            <p>Desde este panel secreto podés configurar la planilla de Google Sheets y cambiar tus datos bancarios en tiempo real. Esta configuración se guarda en el navegador local.</p>
          </div>

          {/* Form Integrations */}
          <div className="space-y-4">
            <h3 className="font-serif-elegant text-lg text-charcoal font-medium border-b border-gold/20 pb-1">
              1. Conexión Google Sheets (Opcional)
            </h3>
            
            <div className="space-y-2">
              <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-topo">
                URL de Google Apps Script Web App
              </label>
              <input
                type="text"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full px-3 py-2 text-sm bg-white border border-gold/30 rounded focus:outline-none focus:border-gold"
              />
              <p className="text-[11px] text-topo italic">
                Dejalo vacío para simular el guardado local, o colocá la URL que te genera Apps Script para automatizar el ingreso a tu planilla.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-sans text-xs uppercase tracking-wider font-semibold text-topo">
                Correo de los Novios (recibe las confirmaciones)
              </label>
              <input
                type="email"
                value={noviosEmail}
                onChange={(e) => setNoviosEmail(e.target.value)}
                placeholder="novios@ejemplo.com"
                className="w-full px-3 py-2 text-sm bg-white border border-gold/30 rounded focus:outline-none focus:border-gold"
              />
              <p className="text-[11px] text-topo italic">
                A este correo llega cada confirmación con la imagen de las tarjetas y el detalle del menú (vía Apps Script).
              </p>
            </div>
          </div>

          {/* Bank Configuration */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif-elegant text-lg text-charcoal font-medium border-b border-gold/20 pb-1">
              2. Datos de Regalos Bancarios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-sans text-[10px] uppercase tracking-wider font-semibold text-topo">
                  Nombre del Banco
                </label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gold/30 rounded focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-sans text-[10px] uppercase tracking-wider font-semibold text-topo">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gold/30 rounded focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-sans text-[10px] uppercase tracking-wider font-semibold text-topo">
                  CBU / CVU (Clave Bancaria)
                </label>
                <input
                  type="text"
                  value={cbu}
                  onChange={(e) => setCbu(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gold/30 rounded font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-sans text-[10px] uppercase tracking-wider font-semibold text-topo">
                  Alias de Cuenta
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gold/30 rounded font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Google Apps Script instructions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gold/20 pb-1">
              <h3 className="font-serif-elegant text-lg text-charcoal font-medium">
                3. Código de Apps Script para Google Sheets
              </h3>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gold/10 hover:bg-gold/20 text-gold font-medium rounded border border-gold/30 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar Código'}
              </button>
            </div>
            <p className="text-xs text-topo">
              Copiá este código y seguí las instrucciones que figuran comentadas arriba para vincular automáticamente tus confirmaciones a una Google Sheet en tiempo real con descarga automática de imagen.
            </p>
            <div className="relative">
              <pre className="max-h-48 overflow-y-auto text-[10px] font-mono bg-white p-3 border border-gold/20 rounded shadow-inner text-charcoal whitespace-pre-wrap">
                {appsScriptCode}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#F0E9DD] border-t border-gold/20 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-sage font-medium animate-pulse">
              ¡Configuración guardada con éxito!
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gold/30 hover:bg-gold/10 rounded text-xs uppercase tracking-wider font-semibold text-topo hover:text-charcoal transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-gold hover:bg-gold/90 text-white rounded text-xs uppercase tracking-wider font-bold shadow transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
}
