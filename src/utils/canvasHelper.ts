// Canvas Generator for Classic Bridal Invitation Cards (Wedding Planner Premium Designer Edition)
import { GroupMember, MenuType, PartyPreferences } from '../types';
// Logo oficial V & J (monograma dorado) — reemplaza las iniciales dibujadas
import logoUrl from '../assets/logo.png';

// Logo precargado para dibujarlo en el Canvas de las tarjetas
let logoImg: HTMLImageElement | null = null;

// Helper to wait until fonts are ready for standard drawing
export const ensureFontsReady = async () => {
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Error preloading fonts, using default serif/sans-serif', e);
    }
  }
};

// Asegura fuentes + logo listos antes de renderizar cualquier tarjeta
export const ensureAssetsReady = async () => {
  await ensureFontsReady();
  if (!logoImg) logoImg = await loadImageSafe(logoUrl);
};

interface RenderCardOptions {
  guestName: string;
  isAttending: boolean;
  index: number;
}

// Draw elegant high-detail gold corner ornaments with nested brackets and leafy loops
function drawClassicCorners(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gap: number,
  goldColor: string
) {
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1.0;

  // Coordinates of the 4 card frame corners
  const corners = [
    { x: gap, y: gap, dx: 1, dy: 1 }, // Top Left
    { x: w - gap, y: gap, dx: -1, dy: 1 }, // Top Right
    { x: gap, y: h - gap, dx: 1, dy: -1 }, // Bottom Left
    { x: w - gap, y: h - gap, dx: -1, dy: -1 } // Bottom Right
  ];

  corners.forEach(({ x, y, dx, dy }) => {
    // Nested outer thin bracket
    ctx.beginPath();
    ctx.moveTo(x + dx * 32, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * 32);
    ctx.stroke();

    // Nested inner elegant hairline bracket
    ctx.save();
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + dx * 38, y + dy * 6);
    ctx.lineTo(x + dx * 6, y + dy * 6);
    ctx.lineTo(x + dx * 6, y + dy * 38);
    ctx.stroke();
    ctx.restore();

    // Central elegant diamond center
    ctx.beginPath();
    ctx.moveTo(x + dx * 16, y + dy * 10);
    ctx.lineTo(x + dx * 22, y + dy * 16);
    ctx.lineTo(x + dx * 16, y + dy * 22);
    ctx.lineTo(x + dx * 10, y + dy * 16);
    ctx.closePath();
    ctx.fillStyle = goldColor;
    ctx.fill();

    // Small foliage flourish curves
    ctx.beginPath();
    ctx.arc(x + dx * 28, y + dy * 16, 1.5, 0, Math.PI * 2);
    ctx.arc(x + dx * 16, y + dy * 28, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = goldColor;
    ctx.fill();
  });
}

// Draw a highly detailed, super professional and detailed royal golden wreath (Master Designer Edition)
function drawGoldenWreath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  goldColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  
  // Outer delicate geometric dashed circle
  ctx.strokeStyle = 'rgba(188, 163, 116, 0.45)';
  ctx.lineWidth = 0.6;
  ctx.save();
  ctx.setLineDash([1.5, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Faint geometric double rings
  ctx.strokeStyle = 'rgba(188, 163, 114, 0.75)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, r - 3.5, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner hairline rings
  ctx.strokeStyle = 'rgba(188, 163, 114, 0.3)';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.arc(0, 0, r - 7, 0, Math.PI * 2);
  ctx.stroke();

  // Draw organic botanical leaves with stems and berry highlights
  ctx.fillStyle = goldColor;
  ctx.strokeStyle = goldColor;
  
  // Left Branch (Bottom-up flow)
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.stroke();

  for (let angle = Math.PI * 0.5; angle <= Math.PI * 1.48; angle += 0.14) {
    const rx = Math.cos(angle) * r;
    const ry = Math.sin(angle) * r;
    
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle + Math.PI / 2 + 0.35); // elegant outward tilt
    
    // Draw real leaf vectors using bezier curves for detailed high-resolution realism
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-2.5, -2, -5, -6, 0, -10); // Left leaf edge
    ctx.bezierCurveTo(5, -6, 2.5, -2, 0, 0); // Right leaf edge
    ctx.closePath();
    ctx.fillStyle = 'rgba(188, 163, 116, 0.9)';
    ctx.fill();

    // Leaf center vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -8);
    ctx.strokeStyle = '#FAF7F2';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    
    ctx.restore();
    
    // Detailed small botanical olive berries
    if (angle < Math.PI * 1.35) {
      const berryX = Math.cos(angle - 0.05) * (r + 4.5);
      const berryY = Math.sin(angle - 0.05) * (r + 4.5);
      ctx.beginPath();
      ctx.arc(berryX, berryY, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#967E56';
      ctx.fill();
    }
  }

  // Right Branch (Bottom-up flow)
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.5, -Math.PI * 0.48, true);
  ctx.stroke();

  for (let angle = Math.PI * 0.5; angle >= -Math.PI * 0.48; angle -= 0.14) {
    const rx = Math.cos(angle) * r;
    const ry = Math.sin(angle) * r;
    
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle - Math.PI / 2 - 0.35); // elegant outward tilt
    
    // Draw leaf vectors
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-2.5, -2, -5, -6, 0, -10);
    ctx.bezierCurveTo(5, -6, 2.5, -2, 0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(188, 163, 116, 0.9)';
    ctx.fill();

    // Leaf center vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -8);
    ctx.strokeStyle = '#FAF7F2';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    
    ctx.restore();
    
    // Detailed small botanical olive berries
    if (angle > -Math.PI * 0.35) {
      const berryX = Math.cos(angle + 0.05) * (r + 4.5);
      const berryY = Math.sin(angle + 0.05) * (r + 4.5);
      ctx.beginPath();
      ctx.arc(berryX, berryY, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#967E56';
      ctx.fill();
    }
  }

  // Draw procedural royal ribbon / tie bow ornament at bottom center (y = r)
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1.0;
  
  // Left loop
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(-15, r - 6, -15, r + 6, -3, r + 2);
  ctx.stroke();

  // Right loop
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(15, r - 6, 15, r + 6, 3, r + 2);
  ctx.stroke();

  // Hanging ribbon ends
  ctx.beginPath();
  ctx.moveTo(-1, r);
  ctx.quadraticCurveTo(-6, r + 7, -8, r + 12);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1, r);
  ctx.quadraticCurveTo(6, r + 7, 8, r + 12);
  ctx.stroke();

  // Small center elegant pearl ribbon node
  ctx.beginPath();
  ctx.arc(0, r, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = goldColor;
  ctx.fill();
  
  ctx.restore();
}

// Ajusta el tamaño de fuente para que el texto entre en maxWidth. Devuelve el font final.
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  buildFont: (size: number) => string,
  startSize: number,
  minSize: number,
  maxWidth: number
): string {
  let size = startSize;
  while (size > minSize) {
    ctx.font = buildFont(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return ctx.font;
}

// Envuelve un texto en varias líneas según maxWidth.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Generate an individual card canvas — formato VERTICAL para celular
export function drawIndividualCardToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderCardOptions
) {
  const { guestName, isAttending, index } = options;
  const ctx = canvas.getContext('2d')!;

  // 1. Formato VERTICAL para celular (proporción tipo tarjeta/postal vertical)
  // Logical layout: 600 x 880 px.  4K Rendering Scale: 2x (1200 x 1760 px)
  const logicalW = 600;
  const logicalH = 880;
  
  canvas.width = logicalW * 2;
  canvas.height = logicalH * 2;
  
  // Set real element CSS size to remain logical for crisp browser display
  canvas.style.width = `${logicalW}px`;
  canvas.style.height = `${logicalH}px`;

  // Scale context to achieve 100% vector-sharp 4K text and graphics
  ctx.scale(2, 2);
  
  // Enable text antialiasing
  ctx.textBaseline = 'alphabetic';

  // 2. Background: Luxurious Warm French Ivory Paper Feel
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, logicalW, logicalH);

  // Exquisite fiber speckling overlay for organic linen paper realism
  for (let i = 0; i < 3500; i++) {
    const rx = Math.random() * logicalW;
    const ry = Math.random() * logicalH;
    ctx.fillStyle = `rgba(191, 163, 114, ${Math.random() * 0.05})`;
    ctx.fillRect(rx, ry, 1, 1);
  }

  // Pure Classic Designer Colors
  const premiumGold = '#BCA374'; // Stunning warm custom gold
  const deepGold = '#967E56';    // Slightly deeper shaded gold text
  const slateInk = '#1F1E1C';    // Luxurious non-harsh pure coal label
  const mutedTaupe = '#7A756C';  // Subdued secondary details and captions

  // 3. Luxurious Nested Golden Frame Lines
  // Line A: Outer thin golden border
  ctx.strokeStyle = premiumGold;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(12, 12, logicalW - 24, logicalH - 24);

  // Line B: Dotted accent spacer
  ctx.save();
  ctx.strokeStyle = 'rgba(191, 163, 114, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 5]);
  ctx.strokeRect(20, 20, logicalW - 40, logicalH - 40);
  ctx.restore();

  // Line C: Stronger inward frame border
  ctx.strokeStyle = premiumGold;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(26, 26, logicalW - 52, logicalH - 52);

  // Classic corner brackets
  drawClassicCorners(ctx, logicalW, logicalH, 26, premiumGold);

  // 4. Center Top — Logo oficial V & J (sello redondo)
  if (logoImg) {
    const maxH = 150;
    const maxW = 220;
    const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
    const lw = logoImg.width * scale;
    const lh = logoImg.height * scale;
    ctx.drawImage(logoImg, logicalW / 2 - lw / 2, 46, lw, lh);
  }

  // 5. Section Header
  ctx.font = '500 12px Montserrat, sans-serif';
  ctx.fillStyle = deepGold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('I N V I T A C I Ó N   F O R M A L', logicalW / 2, 236);

  // Diamond flourish rule
  ctx.beginPath();
  ctx.moveTo(logicalW / 2 - 28, 248);
  ctx.lineTo(logicalW / 2, 246);
  ctx.lineTo(logicalW / 2 + 28, 248);
  ctx.lineTo(logicalW / 2, 250);
  ctx.closePath();
  ctx.fillStyle = premiumGold;
  ctx.fill();

  // 6. Novios Names — tipografía caligráfica producida (Great Vibes)
  ctx.fillStyle = slateInk;
  ctx.font = fitFont(ctx, 'Valeria & Jonathan',
    (s) => `400 ${s}px "Great Vibes", "Brush Script MT", cursive`, 66, 40, logicalW - 110);
  ctx.fillText('Valeria & Jonathan', logicalW / 2, 314);

  // Elegant phrase (envuelta en varias líneas)
  ctx.font = 'italic 15px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = mutedTaupe;
  const phrase = isAttending
    ? 'Con gran emoción de celebrar nuestro amor, te esperamos para vivir un día inolvidable.'
    : 'Agradecemos infinitamente tu cariño, cercanía y bendiciones en esta etapa tan hermosa.';
  let py = 350;
  for (const ln of wrapLines(ctx, phrase, logicalW - 130)) {
    ctx.fillText(ln, logicalW / 2, py);
    py += 22;
  }

  // Thin separator divider
  ctx.strokeStyle = 'rgba(191, 163, 114, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(logicalW / 2 - 140, py + 6);
  ctx.lineTo(logicalW / 2 + 140, py + 6);
  ctx.stroke();

  // 7. Guest name (cursiva dorada)
  ctx.font = '500 10px Montserrat, sans-serif';
  ctx.fillStyle = premiumGold;
  ctx.fillText(isAttending ? 'P A S E   P E R S O N A L   D E   H O N O R' : 'C A R I Ñ O S   Y   V Í N C U L O   E T E R N O', logicalW / 2, py + 34);

  ctx.fillStyle = deepGold;
  ctx.font = fitFont(ctx, guestName || 'Invitado Especial',
    (s) => `400 ${s}px "Great Vibes", "Brush Script MT", cursive`, 46, 26, logicalW - 110);
  ctx.fillText(guestName || 'Invitado Especial', logicalW / 2, py + 84);

  // Cursor vertical para el bloque de información
  py += 116;

  // 8. Information Block — formato vertical, una sola columna
  if (isAttending) {
    const boxX = 48;
    const boxW = logicalW - 96;
    const boxTop = py;
    const boxH = 250;

    ctx.strokeStyle = 'rgba(191, 163, 114, 0.30)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(boxX, boxTop, boxW, boxH);

    ctx.textAlign = 'center';

    // Ceremonia Civil
    ctx.font = 'bold 11px Montserrat, sans-serif';
    ctx.fillStyle = deepGold;
    ctx.fillText('C E R E M O N I A   C I V I L', logicalW / 2, boxTop + 36);

    ctx.font = '500 13px Montserrat, sans-serif';
    ctx.fillStyle = slateInk;
    ctx.fillText('Viernes 17 de Julio • 11:00 Hs', logicalW / 2, boxTop + 60);

    ctx.font = '12px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = mutedTaupe;
    ctx.fillText('Campana 1780 y Guaminí, Ing. Budge', logicalW / 2, boxTop + 82);
    ctx.fillText('Lomas de Zamora, Buenos Aires', logicalW / 2, boxTop + 100);

    // Divisor central
    ctx.strokeStyle = 'rgba(191, 163, 114, 0.35)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(logicalW / 2 - 70, boxTop + 120);
    ctx.lineTo(logicalW / 2 + 70, boxTop + 120);
    ctx.stroke();

    // Fiesta y Celebración
    ctx.font = 'bold 11px Montserrat, sans-serif';
    ctx.fillStyle = deepGold;
    ctx.fillText('F I E S T A   Y   C E L E B R A C I Ó N', logicalW / 2, boxTop + 148);

    ctx.font = '500 13px Montserrat, sans-serif';
    ctx.fillStyle = slateInk;
    ctx.fillText('13:00 Hs a 20:00 Hs', logicalW / 2, boxTop + 172);

    ctx.font = '12px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = mutedTaupe;
    ctx.fillText('Av. Antártida Argentina 602, Lomas de Zamora', logicalW / 2, boxTop + 194);
    ctx.fillText('Estacionamiento Privado Incorporado', logicalW / 2, boxTop + 212);

    // Dresscode (debajo del recuadro)
    ctx.font = 'italic 12px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = mutedTaupe;
    ctx.fillText('Código de Vestimenta: Elegante / Elegante Sport', logicalW / 2, boxTop + boxH + 28);
  } else {
    // Bloque conmemorativo (no asiste)
    ctx.textAlign = 'center';
    ctx.font = 'italic 17px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = slateInk;
    let qy = py + 26;
    for (const ln of wrapLines(ctx, '"Aunque la distancia nos separe hoy, vuestro afecto nos guiará siempre."', logicalW - 120)) {
      ctx.fillText(ln, logicalW / 2, qy);
      qy += 26;
    }

    ctx.font = '500 12px Montserrat, sans-serif';
    ctx.fillStyle = mutedTaupe;
    ctx.fillText('Celebrando de Corazón', logicalW / 2, qy + 22);
    ctx.fillText('Viernes, 17 de Julio de 2026', logicalW / 2, qy + 42);
  }

  // 9. Pie de tarjeta — limpio (a pedido se quitaron el N° de invitación y el © del pie)
}

// Carga segura de una imagen (foto de los novios) desde dataURL/URL
function loadImageSafe(src?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Draw the combined family canvas, outputting 4K ultra-nitido multi-card layout
export function drawCombinedFamilyCard(
  canvas: HTMLCanvasElement,
  members: GroupMember[],
  isAttending: boolean,
  preferences: PartyPreferences,
  messageOnly: string,
  photoUrl?: string
): Promise<string> {
  return new Promise(async (resolve) => {
    await ensureAssetsReady();

    // Premium: incrustamos la foto de los novios como medallón circular en el encabezado.
    const photo = await loadImageSafe(photoUrl);
    const photoOffset = photo ? 150 : 0;

    const ctx = canvas.getContext('2d')!;
    const cardW = 600;   // Coincide con la tarjeta vertical individual
    const cardH = 880;

    // Header size + stacked cards + footer preferences summary
    const headerH = 160 + photoOffset;
    const footerH = isAttending ? 280 : 220;
    const combinedW = cardW + 40; // 840px wide for margins
    const gap = 35; // space between stacked cards
    
    // Total height calculation
    const cardsSpace = members.length * cardH + (members.length - 1) * gap;
    const combinedH = headerH + cardsSpace + footerH + 60;

    // Output with double resolution for crisp 4K png print/share quality
    canvas.width = combinedW * 2;
    canvas.height = combinedH * 2;
    
    canvas.style.width = `${combinedW}px`;
    canvas.style.height = `${combinedH}px`;

    // Scale context directly
    ctx.scale(2, 2);

    // 1. Fill global warm french ivory linen paper background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, combinedW, combinedH);

    // Fiber speckling for maximum realism
    for (let i = 0; i < 6000; i++) {
      const rx = Math.random() * combinedW;
      const ry = Math.random() * combinedH;
      ctx.fillStyle = `rgba(191, 163, 114, ${Math.random() * 0.045})`;
      ctx.fillRect(rx, ry, 1, 1);
    }

    const goldColor = '#BCA374';
    const deepGold = '#967E56';
    const darkInk = '#1F1E1C';
    const solidTaupe = '#7A756C';

    // Outer nested royal frame
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(14, 14, combinedW - 28, combinedH - 28);

    ctx.save();
    ctx.strokeStyle = 'rgba(191, 163, 114, 0.35)';
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2, 5]);
    ctx.strokeRect(20, 20, combinedW - 40, combinedH - 40);
    ctx.restore();

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = solidTaupe;
    ctx.strokeRect(24, 24, combinedW - 48, combinedH - 48);

    // 2. HEADER

    // Medallón circular con la foto de los novios (premium — el original nunca la incrustaba)
    if (photo) {
      const cx = combinedW / 2;
      const cy = 30 + photoOffset / 2;
      const pr = photoOffset / 2 - 14;

      // Anillo dorado exterior
      ctx.beginPath();
      ctx.arc(cx, cy, pr + 6, 0, Math.PI * 2);
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Recorte circular y dibujo de la foto cubriendo el círculo (object-fit: cover)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.clip();
      const ar = photo.width / photo.height;
      let dw = pr * 2;
      let dh = pr * 2;
      if (ar > 1) dw = dh * ar; else dh = dw / ar;
      ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();

      // Brillo sutil interior
      ctx.beginPath();
      ctx.arc(cx, cy, pr - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = 'italic 15px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = solidTaupe;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Nuestra Unión Maravillosa — 17 de Julio de 2026', combinedW / 2, 52 + photoOffset);

    ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = darkInk;
    ctx.fillText('Valeria & Jonathan', combinedW / 2, 98 + photoOffset);

    ctx.font = 'bold 11px Montserrat, sans-serif';
    ctx.fillStyle = goldColor;
    ctx.fillText(isAttending ? 'C O N F I R M A C I Ó N   F O R M A L   D E   A S I S T E N C I A' : 'A G R A D E C I M I E N T O   D E   C O R A Z Ó N', combinedW / 2, 126 + photoOffset);

    // Line separator flourish
    ctx.strokeStyle = 'rgba(191, 163, 114, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(combinedW / 2 - 180, 136 + photoOffset);
    ctx.lineTo(combinedW / 2 + 180, 136 + photoOffset);
    ctx.stroke();

    // 3. RENDER ALL INDIVIDUAL CARDS SCALED AT HIGH DPI AND DOCK
    const tempCanvas = document.createElement('canvas');
    let currentY = headerH + 15;

    members.forEach((member, idx) => {
      // Draw actual card at 1600x1040 layout internally
      drawIndividualCardToCanvas(tempCanvas, {
        guestName: member.name,
        isAttending,
        index: idx
      });

      // Render scaled image from temp canvas safely onto our container
      // Because tempCanvas is 1600x1040, we draw it at 800x520 bounding boxes inside context
      ctx.drawImage(tempCanvas, 20, currentY, cardW, cardH);
      currentY += cardH + gap;
    });

    // 4. SUMMARY BOX - FOOTER
    const footerY = currentY + 5;
    
    ctx.save();
    ctx.translate(20, footerY);

    // Box fill
    ctx.fillStyle = '#F5F1E9';
    ctx.fillRect(0, 0, cardW, footerH);

    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(6, 6, cardW - 12, footerH - 12);

    // Noble wax stamp representation
    ctx.beginPath();
    ctx.arc(cardW - 95, footerH / 2, 42, 0, Math.PI * 2);
    // Classical muted Green for attending, Rosy Slate for not
    ctx.fillStyle = isAttending ? '#7E8F75' : '#BC9390'; 
    ctx.fill();

    // Wax inner string border
    ctx.beginPath();
    ctx.arc(cardW - 95, footerH / 2, 35, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Inner letters
    ctx.font = 'bold 8.5px Montserrat, sans-serif';
    ctx.fillStyle = '#FAF7F2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BODA 2026', cardW - 95, footerH / 2 - 12);
    
    ctx.font = 'italic 15px "Cormorant Garamond", serif';
    ctx.fillText(isAttending ? 'Asistiremos' : 'No Asisto', cardW - 95, footerH / 2 + 3);
    
    ctx.font = '7px Montserrat, sans-serif';
    ctx.fillText('VALERIA & JONA', cardW - 95, footerH / 2 + 18);

    // Confirmation details
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 11px Montserrat, sans-serif';
    ctx.fillStyle = darkInk;
    ctx.fillText('R E S U M E N   O F I C I A L   D E   C O N F I R M A C I Ó N', 30, 26);

    ctx.font = '12px Montserrat, sans-serif';
    ctx.fillStyle = solidTaupe;
    const repName = members[0]?.name || 'N/A';
    ctx.fillText(`Titular / Referente: ${repName}`, 30, 52);
    ctx.fillText(`Pases Reservados: ${members.length} persona(s)`, 30, 72);

    if (isAttending) {
      ctx.font = 'bold 11.5px Montserrat, sans-serif';
      ctx.fillStyle = deepGold;
      ctx.fillText(`Tipo de Menú: ${preferences.menuType}`, 30, 96);

      // Constraints
      const list = [];
      if (preferences.celiac) list.push('Celiaquía (Sin TACC)');
      if (preferences.diabetic) list.push('Diabetes');
      if (preferences.lactoseIntolerant) list.push('Intolerancia a la Lactosa');
      if (preferences.peanutAllergy) list.push('Alergia al Maní');

      const textList = list.length > 0 ? list.join(', ') : 'Ninguna declarada';
      ctx.font = '11.5px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = solidTaupe;
      ctx.fillText(`Restricciones especiales: ${textList}`, 30, 118);

      const notes = preferences.extraDetails.trim() || 'Ninguna aclaración extra.';
      ctx.fillText(`Notas aclaratorias: ${notes}`, 30, 140);
    } else {
      ctx.font = 'bold 11.5px Montserrat, sans-serif';
      ctx.fillStyle = deepGold;
      ctx.fillText('Tus felicitaciones enviadas a los Novios:', 30, 96);

      // Paragraph word wrapping helper
      ctx.font = 'italic 13.5px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = darkInk;
      const msg = messageOnly || '¡Les deseamos un hermoso camino lleno de luz y felicidad infinita!';
      const words = msg.split(' ');
      let currentLine = '';
      let textY = 118;
      const maxTextW = cardW - 220;

      for (let n = 0; n < words.length; n++) {
        const test = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(test);
        if (metrics.width > maxTextW && n > 0) {
          ctx.fillText(currentLine, 30, textY);
          currentLine = words[n] + ' ';
          textY += 18;
        } else {
          currentLine = test;
        }
      }
      ctx.fillText(currentLine, 30, textY);
    }

    ctx.font = 'italic 10.5px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = solidTaupe;
    ctx.fillText('* Este resumen y firmas digitales quedan archivados de manera segura en el registro.', 30, footerH - 30);

    ctx.restore();

    // 5. Final quote centered
    ctx.font = 'italic 15px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = goldColor;
    ctx.textAlign = 'center';
    ctx.fillText('¡Gracias por formar parte del acontecimiento más mágico de nuestras vidas!', combinedW / 2, combinedH - 35);

    // Resolve with base64 print data
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}
