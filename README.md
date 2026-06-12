# 💍 Invitación de Boda — Valeria & Jonathan

Invitación de boda **interactiva, clásica y premium** construida como una Single Page
Application. Wizard de 7 pasos con confirmación de asistencia (RSVP), generación y descarga
de tarjetas/pases en PNG 4K, mapas con GPS, datos para regalos, música clásica sintetizada
en vivo y cuenta regresiva al evento.

**Evento:** Viernes 17 de Julio de 2026 · Ingeniero Budge / Lomas de Zamora, Buenos Aires 🇦🇷

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| UI | React 19 |
| Bundler | Vite 6 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Íconos | lucide-react |
| Tarjetas PNG | HTML5 Canvas API (render 4K) |
| Música | Web Audio API (Canon en Re sintetizado — sin archivos de audio) |
| Mapas | Google Maps embeds + deep links de navegación |
| Persistencia | `localStorage` |
| RSVP (opcional) | Google Apps Script → Google Sheets + Drive |

> No usa ninguna API key ni servidor propio. Es totalmente estática.

---

## 🚀 Ejecutar localmente

**Requisito:** Node.js 18+ (recomendado 20).

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

Para generar el build de producción y previsualizarlo:

```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

---

## 📂 Estructura del proyecto

```
.
├─ index.html                 # HTML raíz + fuentes Google + meta/OG
├─ package.json               # dependencias (limpio, sin residuos de AI Studio)
├─ vite.config.ts             # base relativa './' para hosting portable
├─ tsconfig.json
├─ .github/workflows/deploy.yml   # CI/CD automático a GitHub Pages
└─ src/
   ├─ main.tsx                # bootstrap React
   ├─ App.tsx                 # wizard de 7 pasos (lógica principal)
   ├─ index.css               # tema Tailwind + animaciones + accesibilidad
   ├─ types.ts                # tipos TypeScript
   ├─ components/
   │  └─ HostPanel.tsx        # panel de anfitrión (config bancaria + Apps Script)
   └─ utils/
      ├─ canvasHelper.ts      # generador de tarjetas PNG en Canvas
      └─ audio.ts             # sintetizador de música clásica
```

---

## ⚙️ Configuración del anfitrión (datos bancarios + RSVP)

El **Panel de Anfitrión** está oculto. Para abrirlo:

- Hacé **5 clics** sobre el encabezado "V • & • J", **o**
- Hacé clic en el **ícono de engranaje** (arriba a la derecha), **o**
- Agregá `?admin=true` a la URL.

Desde ahí podés editar **Banco / Titular / CBU / Alias** y pegar la **URL de Google Apps
Script**. Todo se guarda en `localStorage` del navegador.

### Conectar las confirmaciones a Google Sheets (opcional)

1. Creá una Planilla de Google nueva.
2. **Extensiones → Apps Script**.
3. Pegá el código que aparece en el Panel de Anfitrión (botón **"Copiar Código"**).
4. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Tú**.
   - Quién tiene acceso: **Cualquier persona**.
5. Copiá la URL `…/exec` y pegala en el campo del Panel de Anfitrión.

Cada confirmación queda registrada en la planilla y la imagen PNG se guarda en tu Google
Drive. La app muestra un aviso **"Confirmación enviada"** / **"Error"** según el resultado. Si
dejás el campo vacío, el invitado simplemente descarga su PNG para enviarlo por WhatsApp.

---

## 🌐 Publicar en GitHub + GitHub Pages

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Invitación de boda Valeria & Jonathan"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Activar GitHub Pages (deploy automático)

1. En GitHub: **Settings → Pages**.
2. En **Build and deployment → Source**, elegí **GitHub Actions**.
3. Listo. Cada `git push` a `main` dispara el workflow `.github/workflows/deploy.yml`,
   compila y publica. La URL queda como `https://TU_USUARIO.github.io/TU_REPO/`.

> El proyecto usa `base: './'` en Vite, así que funciona en sitios de proyecto de Pages sin
> tocar nada. (Alternativa manual: `npm run deploy`, que usa el paquete `gh-pages`.)

---

## ☁️ Alternativa: desplegar en Render

1. **New → Static Site**, conectá el repo.
2. **Build Command:** `npm run build`
3. **Publish Directory:** `dist`
4. Deploy. (No requiere variables de entorno.)

También funciona igual en **Netlify** (publish `dist`) y **Vercel** (framework Vite, output
`dist`), sin cambios.

---

## 🔧 Dominio propio

- **GitHub Pages:** Settings → Pages → *Custom domain* → escribí tu dominio y agregá en tu
  proveedor DNS un registro `CNAME` apuntando a `TU_USUARIO.github.io`. GitHub gestiona el
  certificado HTTPS.
- **Render:** Settings → Custom Domains → agregá el dominio y cargá el `CNAME` indicado.

---

## ✅ Notas de la migración (fuera de Google AI Studio)

- Se eliminaron dependencias declaradas pero **no usadas**: `@google/genai`, `express`,
  `dotenv`, `motion`. La app **no tenía ninguna llamada de IA**.
- Se agregaron las animaciones CSS que el original referenciaba pero **no definía**
  (`fade-in`, `fade-in-down`, `heartbeat`, `bounce-short`).
- Se corrigió un `ctx.font` inválido en el render de Canvas.
- La foto de los novios ahora **sí** se incrusta en la tarjeta resumen.
- El envío de RSVP ahora muestra **feedback visible** (enviando / enviado / error).
- Mejoras premium: viñeta dorada, título con brillo, microinteracciones, foco accesible y
  respeto por `prefers-reduced-motion`.
