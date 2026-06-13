import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GroupMember, 
  MenuType, 
  PartyPreferences, 
  WeddingConfig, 
  InvitationState 
} from './types';
import { drawIndividualCardToCanvas, drawCombinedFamilyCard, ensureAssetsReady } from './utils/canvasHelper';
import { weddingMusic } from './utils/audio';
import HostPanel from './components/HostPanel';
// Portada fija de la boda (no editable por nadie — queda fija en la página)
import portadaImg from './assets/portada.jpg';
// Logo oficial V & J (monograma dorado) para el header
import logoUrl from './assets/logo.png';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Gift, 
  Check, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Sparkles,
  Users,
  Settings,
  Clock, 
  Download,
  AlertCircle
} from 'lucide-react';

// Default initial config
const DEFAULT_CONFIG: WeddingConfig = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbzazB5Veps3MCfVvoZLbjazW3Dc4UJ8m9RjWmqNhQUQmAY9J3ggddmcVMM1d4J9n7k/exec',
  noviosEmail: 'valery_1980@yahoo.com.ar', // correo definitivo de los novios
  bankConfigured: true, // datos bancarios fijos en el código => no se muestra el botón de configurar
  bankInfo: {
    bank: 'Banco Santander',
    cbu: '0720026788000036011636',
    alias: 'vale-jona',
    titular: 'VALERIA ELIZABETH CASTRO SILVA'
  }
};

// Normaliza configs viejas guardadas en localStorage para que tengan los campos nuevos
function normalizeConfig(c: any): WeddingConfig {
  return {
    scriptUrl: c?.scriptUrl ?? '',
    noviosEmail: c?.noviosEmail ?? '',
    bankConfigured: c?.bankConfigured ?? false,
    bankInfo: {
      bank: c?.bankInfo?.bank ?? DEFAULT_CONFIG.bankInfo.bank,
      cbu: c?.bankInfo?.cbu ?? DEFAULT_CONFIG.bankInfo.cbu,
      alias: c?.bankInfo?.alias ?? DEFAULT_CONFIG.bankInfo.alias,
      titular: c?.bankInfo?.titular ?? DEFAULT_CONFIG.bankInfo.titular
    }
  };
}

export default function App() {
  // Config & State Persistence via localStorage
  const [config, setConfig] = useState<WeddingConfig>(() => {
    const saved = localStorage.getItem('wedding_config_v2');
    return saved ? normalizeConfig(JSON.parse(saved)) : DEFAULT_CONFIG;
  });

  // Estrellas doradas + brillos animados de fondo (posiciones fijas calculadas una vez)
  const sparkles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
        dur: 3 + Math.random() * 4,
        isStar: Math.random() > 0.68
      })),
    []
  );

  // Pantalla independiente "Ubicación / Cómo llegar" (fuera del wizard de pasos)
  const [showDirections, setShowDirections] = useState(false);
  // Cierre del ciclo de carga (pantalla final tras "Finalizar")
  const [finished, setFinished] = useState(false);

  const [state, setState] = useState<InvitationState>(() => {
    return {
      step: 1,
      attending: null,
      groupSize: 1,
      members: [{ id: '1', name: '', downloaded: false }],
      preferences: {
        menuType: 'Principal',
        celiac: false,
        diabetic: false,
        lactoseIntolerant: false,
        peanutAllergy: false,
        extraDetails: ''
      },
      messageOnly: '',
      photoUrl: '', // Default placeholder
      groupCombinedDownloaded: false
    };
  });

  // Host Panel State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);

  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPromptDismissed, setAudioPromptDismissed] = useState(false);

  // Clipboard copies
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // RSVP submission feedback (reemplaza el envío "ciego" del original)
  // 'idle' | 'sending' | 'sent' | 'local' | 'error'
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'sending' | 'sent' | 'local' | 'error'>('idle');

  // Countdown State (evento) + Countdown límite de confirmación
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });
  const [deadlineCd, setDeadlineCd] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  // Paso 3: carga de invitados de a uno (índice del invitado actual)
  const [guestIndex, setGuestIndex] = useState(0);

  // Canvas refs for drawing
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const combinedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Host panel click tracker
  const handleTitleClick = () => {
    const nextCount = titleClickCount + 1;
    setTitleClickCount(nextCount);
    if (nextCount >= 5) {
      setIsAdminOpen(true);
      setTitleClickCount(0);
    }
  };

  // URL admin detection
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  // Save config to localStorage
  const handleSaveConfig = (newConfig: WeddingConfig) => {
    setConfig(newConfig);
    localStorage.setItem('wedding_config_v2', JSON.stringify(newConfig));
  };

  // Countdown logic towards: Viernes, 17 de Julio de 2026 a las 11:00 Hs
  useEffect(() => {
    const targetDate = new Date('2026-07-17T11:00:00-03:00').getTime(); // Argentina timezone proxy

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown(prev => ({ ...prev, isOver: true }));
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          isOver: false
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cuenta regresiva al límite de confirmación: 22 de Junio de 2026 (fin del día, hora AR)
  useEffect(() => {
    const targetDate = new Date('2026-06-22T23:59:59-03:00').getTime();
    const interval = setInterval(() => {
      const difference = targetDate - new Date().getTime();
      if (difference <= 0) {
        setDeadlineCd({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        clearInterval(interval);
      } else {
        setDeadlineCd({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          isOver: false
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Al entrar al paso 3, empezar siempre por el primer invitado
  useEffect(() => {
    if (state.step === 3) setGuestIndex(0);
  }, [state.step]);

  // Synthesizer controllers
  const toggleMusic = () => {
    if (isAudioPlaying) {
      weddingMusic.stop();
      setIsAudioPlaying(false);
    } else {
      weddingMusic.start();
      setIsAudioPlaying(true);
    }
    setAudioPromptDismissed(true);
  };

  const handleMusicConsent = (consent: boolean) => {
    setAudioPromptDismissed(true);
    if (consent) {
      weddingMusic.start();
      setIsAudioPlaying(true);
    }
  };

  // State updates
  const handleAttendingChange = (val: boolean) => {
    setState(prev => ({
      ...prev,
      attending: val
    }));
  };

  const handleGroupSizeChange = (size: number) => {
    const cleanSize = Math.max(1, Math.min(10, size));
    setState(prev => {
      const currentMembers = [...prev.members];
      let newMembers = [];
      for (let i = 0; i < cleanSize; i++) {
        if (currentMembers[i]) {
          newMembers.push(currentMembers[i]);
        } else {
          newMembers.push({ id: String(i + 1), name: '', downloaded: false });
        }
      }
      return {
        ...prev,
        groupSize: cleanSize,
        members: newMembers
      };
    });
  };

  const handleMemberNameChange = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, name } : m)
    }));
  };

  const handlePreferenceChange = (key: keyof PartyPreferences, value: any) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  // Card Download triggers
  const downloadIndividualCard = async (member: GroupMember, index: number) => {
    if (!cardCanvasRef.current) return;

    // Aseguramos fuentes + logo cargados antes de dibujar
    await ensureAssetsReady();

    // Draw card onto render canvas
    drawIndividualCardToCanvas(cardCanvasRef.current, {
      guestName: member.name || 'Invitado/a de Honor',
      isAttending: state.attending ?? true,
      index
    });

    // Extract base64 and auto download
    const dataUrl = cardCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Invitacion_Boda_${(member.name || 'Invitado').replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();

    // Mark as downloaded
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === member.id ? { ...m, downloaded: true } : m)
    }));
  };

  // Paso 3: carga de a UNO. Descarga la tarjeta del invitado actual y pasa al siguiente
  // (así evitamos el bloqueo de descargas múltiples simultáneas del navegador).
  const confirmAndDownloadGuest = async () => {
    const member = state.members[guestIndex];
    if (!member || !member.name.trim()) {
      alert('Por favor, escribí el nombre del invitado antes de continuar.');
      return;
    }
    await downloadIndividualCard(member, guestIndex);
    if (guestIndex < state.members.length - 1) {
      setGuestIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      goToStep(4);
    }
  };

  // Paso 4: el invitado NO descarga nada. Confirma sus preferencias y se envían a los novios
  // (la imagen con las tarjetas + el menú va a la planilla/Drive y al correo de los novios vía Apps Script).
  const handleConfirmAndContinue = async () => {
    if (!combinedCanvasRef.current) return;

    // Generamos la imagen combinada (tarjetas + resumen de menú) SOLO para enviarla a los novios.
    const base64Img = await drawCombinedFamilyCard(
      combinedCanvasRef.current,
      state.members,
      state.attending ?? true,
      state.preferences,
      state.messageOnly,
      portadaImg
    );

    setState(prev => ({ ...prev, groupCombinedDownloaded: true }));

    if (config.scriptUrl) {
      setRsvpStatus('sending');
      try {
        const payload = {
          representative: state.members[0]?.name || 'N/A',
          attending: state.attending,
          quantity: state.groupSize,
          membersList: state.members.map(m => m.name),
          menuType: state.preferences.menuType,
          celiac: state.preferences.celiac,
          diabetic: state.preferences.diabetic,
          lactoseIntolerant: state.preferences.lactoseIntolerant,
          peanutAllergy: state.preferences.peanutAllergy,
          extraDetails: state.preferences.extraDetails,
          messageOnly: state.messageOnly,
          noviosEmail: config.noviosEmail,
          imageBase64: base64Img
        };

        // Apps Script no expone CORS: usamos no-cors (respuesta opaca) + text/plain para evitar el preflight.
        await fetch(config.scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        setRsvpStatus('sent');
      } catch (e) {
        console.error('Error al enviar la confirmación: ', e);
        setRsvpStatus('error');
      }
    } else {
      setRsvpStatus('local');
    }

    setTimeout(() => setRsvpStatus('idle'), 6000);

    // Avanza a Ubicaciones (asiste) o Regalos (no asiste)
    goToStep(state.attending ? 5 : 6);
  };

  const goToStep = (stepNumber: number) => {
    // Validate Step 3 names completed before advancing
    if (state.step === 3 && stepNumber > 3) {
      const anyEmpty = state.members.some(m => !m.name.trim());
      if (anyEmpty) {
        alert('Por favor, completá los nombres de todos tus familiares o pases para continuar.');
        return;
      }
    }

    // Validate Step 4 message if not attending
    if (state.step === 4 && stepNumber > 4 && !state.attending) {
      if (!state.messageOnly.trim()) {
        alert('Por favor, dejanos tus buenos deseos antes de confirmar.');
        return;
      }
    }

    setState(prev => ({ ...prev, step: stepNumber }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Maps coordinates switcher
  const [selectedMap, setSelectedMap] = useState<'civil' | 'fiesta'>('civil');
  const mapUrl = selectedMap === 'civil' 
    ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.4870845308693!2d-58.45520852425407!3d-34.70548137291845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccbcfdfa6add9%3A0xcb13e8b7c7b270fd!2sCampana%201780%2C%20B1821%20Ingeniero%20Budge%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1700000000000"
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.2974241617!2d-58.4344079242539!3d-34.71025587291666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccbeeb02c98d7%3A0x2de78b9b46ef10c7!2sAv.%20Ant%C3%A1rtida%20Argentina%20602%2C%20B1832%20Lomas%20de%20Zamora%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1700000000001";

  const mapNavigationUrl = selectedMap === 'civil'
    ? "https://www.google.com/maps/search/?api=1&query=Campana+1780%2C+Ingeniero+Budge"
    : "https://www.google.com/maps/search/?api=1&query=Ant%C3%A1rtida+Argentina+602%2C+Lomas+de+Zamora";

  // Caja de cuenta regresiva reutilizable (mismo formato en paso 2 y final)
  type CD = { days: number; hours: number; minutes: number; seconds: number; isOver: boolean };
  const renderCountdown = (cd: CD, label: string, accent: 'gold' | 'rose' = 'gold') => (
    <div className={`p-4 bg-white border rounded-2xl space-y-3 shadow-sm mx-1 ${accent === 'rose' ? 'border-rose/40' : 'border-gold/30'}`}>
      <div className={`text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 text-center ${accent === 'rose' ? 'text-rose' : 'text-gold'}`}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { v: cd.days, l: 'Días', pad: false },
          { v: cd.hours, l: 'Horas', pad: true },
          { v: cd.minutes, l: 'Min.', pad: true },
          { v: cd.seconds, l: 'Seg.', pad: true }
        ].map((item) => (
          <div key={item.l} className="bg-[#FAF7F0] p-2 rounded-lg border border-gold/15">
            <span className="block font-sans text-xl font-bold text-charcoal leading-none">
              {item.pad ? String(item.v).padStart(2, '0') : item.v}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-topo block mt-1">{item.l}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Bloque de mapas reutilizable (usado en el paso 5 y en la pantalla "Ubicación")
  // A COLOR (sin escala de grises) para que se vea bien en el celular.
  const mapsInner = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 bg-beige rounded-xl border border-gold/10">
        <button
          onClick={() => setSelectedMap('civil')}
          className={`py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${
            selectedMap === 'civil' ? 'bg-gold text-charcoal shadow-sm' : 'text-topo hover:text-charcoal'
          }`}
        >
          Ceremonia Civil
        </button>
        <button
          onClick={() => setSelectedMap('fiesta')}
          className={`py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${
            selectedMap === 'fiesta' ? 'bg-gold text-charcoal shadow-sm' : 'text-topo hover:text-charcoal'
          }`}
        >
          La Fiesta
        </button>
      </div>

      <div className="bg-white p-3 border border-gold/20 rounded-xl space-y-2">
        {selectedMap === 'civil' ? (
          <div className="text-center">
            <p className="font-sans text-xs uppercase tracking-wider font-bold text-gold">Ceremonia Civil — 11:00 Hs</p>
            <p className="text-xs text-charcoal mt-1 font-medium">Campana 1780 y Guaminí, Ingeniero Budge</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-sans text-xs uppercase tracking-wider font-bold text-gold">Gran Fiestón — 13:00 a 20:00 Hs</p>
            <p className="text-xs text-charcoal mt-1 font-medium">Antártida Argentina 602, Lomas de Zamora</p>
          </div>
        )}

        <div className="w-full aspect-video rounded-lg overflow-hidden border border-gold/25 relative bg-white">
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Map"
          />
        </div>
      </div>

      <a
        href={mapNavigationUrl}
        target="_blank"
        rel="noreferrer"
        className="w-full py-3 border-2 border-dashed border-gold hover:bg-gold/5 text-gold rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
      >
        <MapPin className="w-4 h-4 text-gold animate-bounce" />
        <span>¿Cómo llegar con GPS?</span>
      </a>
    </div>
  );

  return (
    <div className="min-h-screen py-4 px-4 flex flex-col justify-between items-center relative paper-texture premium-stage selection:bg-gold/30 selection:text-charcoal">

      {/* Fondo animado: estrellas doradas + brillos */}
      <div className="sparkles" aria-hidden="true">
        {sparkles.map((s) =>
          s.isStar ? (
            <span
              key={s.id}
              className="sparkle-star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                fontSize: `${s.size * 4}px`,
                ['--delay' as any]: `${s.delay}s`,
                ['--dur' as any]: `${s.dur + 1}s`
              }}
            >
              ✦
            </span>
          ) : (
            <span
              key={s.id}
              className="sparkle-dot"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                ['--delay' as any]: `${s.delay}s`,
                ['--dur' as any]: `${s.dur}s`
              }}
            />
          )
        )}
      </div>

      {/* Hidden canvases for rendering */}
      <canvas ref={cardCanvasRef} className="hidden" />
      <canvas ref={combinedCanvasRef} className="hidden" />

      {/* Acceso al panel de anfitrión: oculto (5 clics en el logo del encabezado o ?admin=true).
          Sin botones de configuración visibles para los invitados. */}

      {/* Elegant Classical Banner Area (se oculta en la pantalla final) */}
      {!finished && (
        <header className="content-layer text-center max-w-lg mb-1 pt-0 cursor-pointer" onClick={handleTitleClick}>
          <div className="inline-block relative leading-none">
            {/* Logo oficial V & J (sello redondo, grande, pegado al cuadro) */}
            <img
              src={logoUrl}
              alt="Logo Valeria & Jonathan"
              className="h-44 w-auto mx-auto select-none drop-shadow-md"
              draggable={false}
              id="header_logo"
            />
          </div>
          <p className="font-serif-elegant italic text-topo text-xs tracking-wider -mt-3" id="wedding_title_paragraph">
            Nuestra historia de amor — 17.07.2026
          </p>
        </header>
      )}

      {/* Main Single Page Interaction Wizard Card */}
      <main className="content-layer w-full max-w-md bg-ivory border border-gold/40 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px] border-b-[6px] border-b-gold animate-rise-in">
        
        {/* ===== Pantalla final (cierre del ciclo) ===== */}
        {finished && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-5 animate-fade-in" id="finished_screen">
            <img
              src={logoUrl}
              alt="Logo Valeria & Jonathan"
              className="h-44 w-auto select-none drop-shadow-lg animate-heartbeat"
              draggable={false}
            />
            <h2 className="font-serif-elegant text-2xl text-charcoal font-medium">¡Gracias por confirmar! 💛</h2>
            <p className="text-xs text-topo px-4 leading-relaxed">
              Tu registro quedó completo. Ya podés cerrar esta página.<br />
              Para cargar otro grupo familiar, actualizá o refrescá la página.
            </p>
            <div className="italic font-script-title text-4xl gold-shimmer leading-[1.2] py-1">
              Valeria & Jonathan
            </div>
          </div>
        )}

        {/* ===== Pantalla independiente: Ubicación / Cómo llegar ===== */}
        {!finished && showDirections && (
          <div className="flex flex-col flex-1 animate-fade-in" id="directions_screen">
            <div className="bg-beige border-b border-gold/20 px-4 py-3 flex items-center justify-between">
              <span className="font-sans text-[11px] font-bold text-gold uppercase tracking-[0.15em]">
                Ubicación · Cómo llegar
              </span>
              <button
                onClick={toggleMusic}
                className="p-1 rounded-full text-gold hover:bg-gold/15 active:scale-90 transition-all flex items-center justify-center"
                aria-label={isAudioPlaying ? 'Silenciar música' : 'Activar música'}
                title={isAudioPlaying ? 'Silenciar música' : 'Activar música'}
              >
                {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">Ubicación</span>
                  <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">¿Cómo llegar al Evento?</h2>
                </div>
                {mapsInner}
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setShowDirections(false)}
                  className="w-full py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Wizard normal ===== */}
        {!finished && !showDirections && (
        <>
        {/* Step Progression Beads Header */}
        <div className="bg-beige border-b border-gold/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] font-bold text-gold uppercase tracking-[0.15em]" id="step_indicator">
              Paso 0{state.step} de 07
            </span>
            {/* Botón de mute/desmute fijo junto al indicador de paso */}
            <button
              onClick={toggleMusic}
              className="p-1 rounded-full text-gold hover:bg-gold/15 active:scale-90 transition-all flex items-center justify-center"
              aria-label={isAudioPlaying ? 'Silenciar música' : 'Activar música'}
              title={isAudioPlaying ? 'Silenciar música' : 'Activar música'}
            >
              {isAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  state.step === s 
                    ? 'w-6 bg-gold' 
                    : state.step > s 
                      ? 'w-2 bg-sage' 
                      : 'w-2 bg-gold/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Panel Content Area */}
        <div className="flex-1 p-5 flex flex-col justify-between" id="step_container">
          
          {/* STEP 1: WELCOME & PHOTO */}
          {state.step === 1 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step1_welcome">
              <div className="text-center space-y-4">
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-topo font-semibold block">
                  Te invitamos a celebrar con nosotros
                </span>
                
                <h1 className="font-script-title text-6xl gold-shimmer leading-[1.15] py-3 px-3">
                  Valeria & Jonathan
                </h1>
                
                <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent w-2/3 mx-auto" />
                
                <p className="font-serif-elegant italic text-charcoal text-base px-2">
                  "Hay momentos en la vida que son especiales por sí solos, pero compartirlos con quienes más amamos los hace inolvidables."
                </p>

                <div className="bg-beige rounded-lg p-3 inline-flex items-center gap-1.5 border border-gold/20">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="font-sans text-xs uppercase tracking-wider font-bold text-charcoal">
                    Viernes, 17 de Julio de 2026
                  </span>
                </div>
              </div>

              {/* Portada fija de los Novios (no editable) */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-topo block font-medium">
                    Valeria & Jonathan
                  </span>
                </div>

                <div
                  className="relative aspect-[16/10] bg-beige rounded-xl overflow-hidden border border-gold/30 shadow-md"
                  id="preview_photo_box"
                >
                  <img
                    src={portadaImg}
                    alt="Decoración elegante de la boda de Valeria & Jonathan"
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                  {/* Marco dorado sutil + leve degradé inferior para realce premium */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-gold/25" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Enter Button */}
              <div className="pt-4">
                <button
                  onClick={() => goToStep(2)}
                  className="btn-premium w-full py-3.5 bg-gold hover:bg-gold/90 text-charcoal rounded-xl text-xs uppercase tracking-[0.2em] font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <span>Ingresar / Comenzar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GROUP ATTENDANCE & SIZE */}
          {state.step === 2 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step2_attendance">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                    Confirmación de Presencia
                  </span>
                  <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">
                    ¿Asistirás a nuestra Boda?
                  </h2>
                </div>

                {/* Cuenta regresiva — fecha límite para confirmar */}
                {renderCountdown(deadlineCd, 'Fecha límite para confirmar · 22 de Junio 2026', 'rose')}
                <p className="text-[11px] italic text-topo text-center -mt-1">
                  Te pedimos confirmar tu asistencia antes de esa fecha 💛
                </p>

                {/* Yes / No selectors */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button
                    onClick={() => handleAttendingChange(true)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      state.attending === true
                        ? 'bg-sage/10 border-sage text-charcoal'
                        : 'bg-white border-gold/20 hover:border-gold/60 text-topo'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-[#3A3632]">
                        Sí, asistiremos con alegría
                      </p>
                      <p className="text-xs text-[#8A8175] mt-1">
                        Queremos compartir este gran día junto a ustedes.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      state.attending === true ? 'border-sage bg-sage text-white' : 'border-gold/30'
                    }`}>
                      {state.attending === true && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  <button
                    onClick={() => handleAttendingChange(false)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      state.attending === false
                        ? 'bg-rose/10 border-rose text-charcoal'
                        : 'bg-white border-gold/20 hover:border-gold/60 text-topo'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider text-[#3A3632]">
                        No podré asistir
                      </p>
                      <p className="text-xs text-[#8A8175] mt-1">
                        No podré ir, pero les deseo infinitas bendiciones.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      state.attending === false ? 'border-rose bg-rose text-white' : 'border-gold/30'
                    }`}>
                      {state.attending === false && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                </div>

                {/* Counter if attending */}
                {state.attending === true && (
                  <div className="pt-4 space-y-3 animate-fade-in-down">
                    <div className="flex items-center justify-between">
                      <label className="font-sans text-[11px] uppercase tracking-wider font-semibold text-topo">
                        Cantidad de pases a emitir (máx 10)
                      </label>
                      <span className="font-serif-elegant font-bold text-lg text-gold">{state.groupSize} {state.groupSize === 1 ? 'pase' : 'pases'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleGroupSizeChange(state.groupSize - 1)}
                        className="flex-1 py-2.5 bg-beige/60 hover:bg-gold/10 text-topo border border-gold/30 rounded-lg text-lg font-bold transition-all"
                        disabled={state.groupSize <= 1}
                      >
                        -
                      </button>
                      <span className="px-6 font-sans text-xl font-bold text-charcoal">{state.groupSize}</span>
                      <button
                        onClick={() => handleGroupSizeChange(state.groupSize + 1)}
                        className="flex-1 py-2.5 bg-beige/60 hover:bg-gold/10 text-topo border border-gold/30 rounded-lg text-lg font-bold transition-all"
                        disabled={state.groupSize >= 10}
                      >
                        +
                      </button>
                    </div>

                    <p className="text-[11px] italic text-topo text-center mt-2">
                      Emitiremos una tarjeta clásica descargable única e individual para cada uno de los integrantes.
                    </p>
                  </div>
                )}

                {state.attending === false && (
                  <div className="pt-4 p-4 bg-[#F0E9DD]/60 rounded-xl border border-gold/20 animate-fade-in-down">
                    <p className="text-xs text-charcoal leading-relaxed">
                      Lamentamos mucho que no puedas acompañarnos físicamente. En el paso siguiente podrás dejarnos un mensaje especial de felicitación y descargar una bella <strong className="text-gold">tarjeta conmemorativa</strong> con nuestro sincero agradecimiento.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(1)}
                  className="flex-1 py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>
                
                <button
                  onClick={() => {
                    if (state.attending === null) {
                      alert('Por favor, selecciona si asistirás o no para continuar.');
                      return;
                    }
                    goToStep(3);
                  }}
                  className="flex-1 py-3 bg-gold hover:bg-gold/90 text-[#3A3632] rounded-xl text-xs uppercase tracking-wider font-bold shadow transition-all flex items-center justify-center gap-1"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CARGA DE INVITADOS DE A UNO */}
          {state.step === 3 && (() => {
            const total = state.members.length;
            const current = state.members[guestIndex];
            const isLast = guestIndex >= total - 1;
            const doneCount = state.members.filter((m) => m.downloaded).length;
            return (
              <div className="space-y-5 flex flex-col justify-between h-full animate-fade-in" id="step3_cards">
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                      Generación de Tarjetas
                    </span>
                    <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">
                      {state.attending ? `Invitado ${guestIndex + 1} de ${total}` : 'Tu Nombre'}
                    </h2>
                    <p className="text-xs text-topo mt-1 px-2">
                      Escribí el nombre tal como querés que figure en la invitación. Al confirmar se
                      descarga su tarjeta{state.attending && !isLast ? ' y cargás al siguiente' : ''}.
                    </p>
                  </div>

                  {/* Progreso de pases (puntos) */}
                  {state.attending && total > 1 && (
                    <div className="flex items-center justify-center gap-1.5">
                      {state.members.map((m, i) => (
                        <div
                          key={m.id}
                          className={`h-1.5 rounded-full transition-all ${
                            i === guestIndex ? 'w-5 bg-gold' : m.downloaded ? 'w-2 bg-sage' : 'w-2 bg-gold/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Input del invitado actual */}
                  <div className="p-4 bg-white border border-gold/25 rounded-xl space-y-2 shadow-sm">
                    <label className="font-sans text-[10px] uppercase tracking-wider font-bold text-topo block">
                      {state.attending ? `Nombre del invitado ${guestIndex + 1}` : 'Tu nombre completo'}
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={current?.name || ''}
                      onChange={(e) => current && handleMemberNameChange(current.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmAndDownloadGuest(); }}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                    />
                  </div>

                  {/* Invitados ya descargados */}
                  {doneCount > 0 && (
                    <div className="bg-sage/5 border border-sage/20 rounded-lg p-3 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-sage block">
                        Invitaciones descargadas ({doneCount})
                      </span>
                      <div className="space-y-1">
                        {state.members.filter((m) => m.downloaded).map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5 text-xs text-charcoal">
                            <Check className="w-3 h-3 text-sage shrink-0" />
                            <span className="truncate">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => goToStep(2)}
                    className="flex-1 py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  <button
                    onClick={confirmAndDownloadGuest}
                    disabled={!current?.name.trim()}
                    className="btn-premium flex-1 py-3 bg-gold hover:bg-gold/90 disabled:opacity-50 text-charcoal rounded-xl text-xs uppercase tracking-wider font-bold shadow flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{state.attending && !isLast ? 'Descargar y siguiente' : 'Descargar y continuar'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* STEP 4: PREFERENCES & COMBINED CONFIRMATION */}
          {state.step === 4 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step4_preferences">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                    {state.attending ? 'Menú y Preferencias' : 'Mensaje Especial'}
                  </span>
                  <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">
                    {state.attending ? 'Detalles de la Fiesta' : 'Mensaje para los Novios'}
                  </h2>
                </div>

                {state.attending ? (
                  /* Form for attending */
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <label className="block font-sans text-[11px] uppercase tracking-wider font-semibold text-topo">
                        Tipo de Menú Principal
                      </label>
                      <select
                        value={state.preferences.menuType}
                        onChange={(e) => handlePreferenceChange('menuType', e.target.value as MenuType)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gold/30 rounded focus:outline-none focus:border-gold"
                      >
                        <option value="Principal">Principal (Tradicional)</option>
                        <option value="Vegetariano">Vegetariano</option>
                        <option value="Vegano">Vegano</option>
                        <option value="Celíaco-Sin TACC">Celíaco - Sin TACC</option>
                        <option value="Infantil">Menú Infantil</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-sans text-[11px] uppercase tracking-wider font-semibold text-topo">
                        Condiciones o Restricciones
                      </label>
                      <div className="grid grid-cols-1 gap-2 bg-white p-3 border border-gold/20 rounded-xl">
                        {[
                          { key: 'celiac', label: 'Celíaco (Sin TACC)' },
                          { key: 'diabetic', label: 'Diabético' },
                          { key: 'lactoseIntolerant', label: 'Intolerante a la Lactosa' },
                          { key: 'peanutAllergy', label: 'Alergia al Maní' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer text-xs text-charcoal">
                            <input
                              type="checkbox"
                              checked={(state.preferences as any)[item.key]}
                              onChange={(e) => handlePreferenceChange(item.key as keyof PartyPreferences, e.target.checked)}
                              className="accent-gold w-4 h-4"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-sans text-[11px] uppercase tracking-wider font-semibold text-topo">
                        Aclaraciones o Comentarios Adicionales
                      </label>
                      <textarea
                        value={state.preferences.extraDetails}
                        onChange={(e) => handlePreferenceChange('extraDetails', e.target.value)}
                        placeholder="Ej: Alergias específicas, intolerancias..."
                        className="w-full px-3 py-2 text-xs bg-white border border-gold/30 rounded h-16 focus:outline-none focus:border-gold resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* Form for not attending */
                  <div className="space-y-4 animate-fade-in-down">
                    <div className="space-y-1">
                      <label className="block font-sans text-[11px] uppercase tracking-wider font-semibold text-topo">
                        Tus Felicitaciones / Buenos Deseos *
                      </label>
                      <textarea
                        value={state.messageOnly}
                        onChange={(e) => setState(prev => ({ ...prev, messageOnly: e.target.value }))}
                        placeholder="Dejales un mensaje de bendición y cariño para este hermoso camino que comienzan juntos..."
                        className="w-full px-3 py-3 text-sm bg-white border border-gold/30 rounded h-40 focus:outline-none focus:border-gold resize-none"
                        required
                      />
                    </div>
                    <p className="text-[11px] italic text-topo">
                      * Este mensaje se guardará digitalmente en la carta de confirmaciones final que enviaremos a los novios.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar preferencias — el invitado NO descarga (la copia va a los novios) */}
              <div className="pt-4 space-y-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep(3)}
                    className="flex-1 py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>
                  <button
                    onClick={handleConfirmAndContinue}
                    disabled={rsvpStatus === 'sending'}
                    className="btn-premium flex-1 py-3 bg-sage hover:bg-sage/90 disabled:opacity-60 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-gold" />
                    <span>{state.attending ? 'Confirmar menú y continuar' : 'Confirmar y continuar'}</span>
                  </button>
                </div>
                {state.attending && (
                  <p className="text-[10px] italic text-topo text-center px-2">
                    Tus preferencias y la cantidad de pases se envían a los novios. Vos ya descargaste tus invitaciones en el paso anterior.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: EVENT MAPS & GPS DIRECTIONS */}
          {state.step === 5 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step5_maps">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                    Ubicaciones
                  </span>
                  <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">
                    ¿Cómo llegar al Evento?
                  </h2>
                </div>

                {mapsInner}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(4)}
                  className="flex-1 py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>

                <button
                  onClick={() => goToStep(6)}
                  className="flex-1 py-3 bg-gold hover:bg-gold/90 text-charcoal rounded-xl text-xs uppercase tracking-wider font-bold shadow transition-all flex items-center justify-center gap-1"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: GIFTS & ACCOUNT CHIPS */}
          {state.step === 6 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step6_gifts">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                    Presentes y Regalos
                  </span>
                  <h2 className="font-serif-elegant text-2xl text-charcoal font-medium mt-1">
                    Lluvia de Sobres
                  </h2>
                </div>

                <p className="text-xs text-topo text-center leading-relaxed font-serif-elegant italic">
                  "El mejor regalo es tu compañía en este momento tan especial. Pero si además deseás colaborar con nuestro comienzo y luna de miel, podés hacerlo desde aquí:"
                </p>

                {/* Collapsible/revealed Bank details */}
                <div className="bg-white p-4 border border-gold/35 rounded-xl space-y-3 relative" id="bank_details_box">
                  <div className="text-center border-b border-gold/20 pb-2">
                    <span className="font-sans text-[10px] uppercase tracking-wider font-bold text-gold">
                      Datos de la Cuenta Bancaria
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-[#FAF7F0] p-2 rounded">
                      <span className="text-topo">Banco:</span>
                      <strong className="text-charcoal">{config.bankInfo.bank}</strong>
                    </div>

                    <div className="flex justify-between items-center bg-[#FAF7F0] p-2 rounded">
                      <span className="text-topo">Titular:</span>
                      <strong className="text-charcoal">{config.bankInfo.titular}</strong>
                    </div>

                    <div className="flex justify-between items-center bg-[#FAF7F0] p-2 rounded">
                      <div>
                        <span className="text-topo block text-[10px]">CBU/CVU:</span>
                        <strong className="text-charcoal font-mono tracking-wider">{config.bankInfo.cbu}</strong>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.cbu, 'cbu')}
                        className="p-1 px-2.5 bg-gold/10 hover:bg-gold/20 text-gold rounded font-bold text-[10px] transition-all flex items-center gap-1.5"
                      >
                        {copiedField === 'cbu' ? 'Copiado' : <Copy className="w-3 h-3" />}
                        {copiedField === 'cbu' && <Check className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-[#FAF7F0] p-2 rounded">
                      <div>
                        <span className="text-topo block text-[10px]">Alias:</span>
                        <strong className="text-charcoal font-mono tracking-wider">{config.bankInfo.alias}</strong>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.bankInfo.alias, 'alias')}
                        className="p-1 px-2.5 bg-gold/10 hover:bg-gold/20 text-gold rounded font-bold text-[10px] transition-all flex items-center gap-1.5"
                      >
                        {copiedField === 'alias' ? 'Copiado' : <Copy className="w-3 h-3" />}
                        {copiedField === 'alias' && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón de configuración bancaria — visible solo hasta que el anfitrión lo configure */}
                {!config.bankConfigured && (
                  <button
                    onClick={() => setIsAdminOpen(true)}
                    className="w-full py-2.5 border border-dashed border-gold/50 hover:bg-gold/5 text-gold rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configurar datos bancarios</span>
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(state.attending ? 5 : 4)}
                  className="flex-1 py-3 border border-gold/40 hover:bg-gold/10 text-topo rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>
                
                <button
                  onClick={() => goToStep(7)}
                  className="flex-1 py-3 bg-gold hover:bg-gold/90 text-[#3A3632] rounded-xl text-xs uppercase tracking-wider font-bold shadow transition-all flex items-center justify-center gap-1"
                >
                  <span>Avanzar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: GENERAL THANK YOU COUNDTOWN */}
          {state.step === 7 && (
            <div className="space-y-6 flex flex-col justify-between h-full animate-fade-in" id="step7_thanks">
              <div className="text-center space-y-4">
                <img
                  src={logoUrl}
                  alt="Logo Valeria & Jonathan"
                  className="mx-auto h-20 w-auto select-none drop-shadow-md animate-heartbeat"
                  draggable={false}
                />

                <h2 className="font-serif-elegant text-2xl text-charcoal font-medium">
                  {state.attending ? '¡Nos vemos en la Boda!' : '¡Agradecemos tu Cariño!'}
                </h2>
                
                <p className="text-xs text-topo px-3 leading-relaxed">
                  {state.attending 
                    ? "Tus pases clásicos y preferencias gastronómicas han quedado registrados. ¡Tenemos muchísima felicidad de contar con vos en este nuevo paso!"
                    : "Hemos guardado tu sincera felicitación digital. Aunque no asistas físicamente, tu presencia de corazón estará con nosotros para siempre."}
                </p>

                {/* Countdown display */}
                {renderCountdown(countdown, 'Cuenta Regresiva al Civil', 'gold')}

                <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent w-full" />

                <div className="italic font-script-title text-4xl gold-shimmer leading-[1.2] py-2">
                  Valeria & Jonathan
                </div>
              </div>

              {/* Cierre del ciclo + Ubicación */}
              <div className="pt-4 space-y-2">
                {state.attending && (
                  <button
                    onClick={() => setShowDirections(true)}
                    className="w-full py-3 bg-beige hover:bg-gold/10 text-topo border border-gold/30 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>Ver Ubicación y cómo llegar</span>
                  </button>
                )}

                <button
                  onClick={() => setFinished(true)}
                  className="btn-premium w-full py-3.5 bg-gold hover:bg-gold/90 text-charcoal rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Finalizar</span>
                </button>
              </div>
            </div>
          )}

        </div>
        </>
        )}
      </main>

      {/* Audio Play Consent Notification Popover on First Step (arriba y centrado para mejor visibilidad) */}
      {!audioPromptDismissed && state.step === 1 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[60] bg-[#FAF7F0] border-2 border-gold rounded-xl shadow-2xl p-4 animate-fade-in-down">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-gold animate-pulse fill-gold/20" />
              <span className="font-sans text-xs uppercase tracking-wider font-bold text-charcoal">
                Música de la Boda
              </span>
            </div>
            <p className="text-[11px] text-topo leading-relaxed">
              ¿Querés activar la música de fondo mientras completás tu confirmación?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleMusicConsent(false)}
                className="flex-1 py-1.5 border border-gold/30 hover:bg-gold/10 text-topo rounded text-[10px] uppercase font-bold transition-all"
              >
                Silencio
              </button>
              <button
                onClick={() => handleMusicConsent(true)}
                className="flex-1 py-1.5 bg-gold hover:bg-gold/90 text-white rounded text-[10px] uppercase font-bold transition-all shadow-sm"
              >
                Sí, activar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de estado del envío de la confirmación (RSVP) */}
      {rsvpStatus !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[calc(100%-2rem)] animate-fade-in-down"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
            rsvpStatus === 'sending'
              ? 'bg-beige border-gold/40 text-charcoal'
              : rsvpStatus === 'error'
                ? 'bg-rose/15 border-rose text-charcoal'
                : 'bg-sage/15 border-sage text-charcoal'
          }`}>
            {rsvpStatus === 'sending' && (
              <>
                <Clock className="w-4 h-4 text-gold animate-spin" />
                <span>Enviando tus preferencias a los novios…</span>
              </>
            )}
            {rsvpStatus === 'sent' && (
              <>
                <Check className="w-4 h-4 text-sage" />
                <span>¡Confirmación enviada y registrada con éxito! Gracias 💛</span>
              </>
            )}
            {rsvpStatus === 'local' && (
              <>
                <Check className="w-4 h-4 text-sage" />
                <span>¡Preferencias confirmadas! 💛</span>
              </>
            )}
            {rsvpStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-rose" />
                <span>No pudimos enviarlo online. Avisale a los novios por las dudas.</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden/Secret Host config dashboard */}
      <HostPanel
        config={config}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSave={handleSaveConfig}
      />

      {/* Elegant Classical Footer Margin details */}
      <footer className="content-layer text-[10px] uppercase tracking-widest text-[#8A8175] mt-3 text-center select-none">
        <span>Diseño Exclusivo • Boda Valeria & Jonathan</span>
      </footer>

    </div>
  );
}
