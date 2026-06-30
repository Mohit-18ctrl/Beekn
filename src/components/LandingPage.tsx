import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  Camera,
  LayoutDashboard,
} from "lucide-react";
import appIcon from "../assets/icon-beekn.jpeg";

/* ─── Types ─── */
interface LandingPageProps {
  onGetStarted: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  issuesCount?: number;
  resolvedCount?: number;
}

/* ─── Animation presets ─── */
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.9, ease },
  }),
};

const cardFade = {
  hidden: { opacity: 0, y: 44 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.12, duration: 0.8, ease },
  }),
};

/* ══════════════════════════════════════════════════════════════
   IMMERSIVE CINEMATIC CITY BACKGROUND
   Full-hero background SVG — layered city with beacon beams
   ═══════════════════════════════════════════════════════════ */
function CityBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* ── Sky gradient ── */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#030712" />
            <stop offset="40%" stopColor="#070d1c" />
            <stop offset="75%" stopColor="#0c1629" />
            <stop offset="100%" stopColor="#111d33" />
          </linearGradient>

          {/* ── Street haze ── */}
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111d33" stopOpacity="0" />
            <stop offset="40%" stopColor="#111d33" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f1a2e" stopOpacity="0.7" />
          </linearGradient>

          {/* ── Beacon beam gradients — fanning out, shining ── */}
          <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.38" />
            <stop offset="40%" stopColor="#FACC15" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamSoft" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.26" />
            <stop offset="45%" stopColor="#FACC15" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
          </linearGradient>
          {/* ── Sky glow behind icon to illuminate the background area ── */}
          <radialGradient id="skyGlow" cx="56.5%" cy="34.4%" r="45%">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#EAB308" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>
          <filter id="clampBlack" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix type="matrix" values="
              1.1 0 0 0 -0.06
              0 1.1 0 0 -0.06
              0 0 1.1 0 -0.06
              0 0 0 1 0
            " />
          </filter>
          <clipPath id="iconClip">
            <rect x="800" y="190" width="210" height="125" />
          </clipPath>

          {/* ── Icon halo ── */}
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#EAB308" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>

          {/* ── Rim light color for rooftop edges ── */}
          <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a4a6e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2a4a6e" stopOpacity="0" />
          </linearGradient>

          {/* ── Filters ── */}
          <filter id="glow8" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="glow4" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="glow2" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* ═══ SKY ═══ */}
        <rect width="1600" height="900" fill="url(#sky)" />

        {/* ═══ SKY GLOW ═══ */}
        <circle cx="905" cy="310" r="450" fill="url(#skyGlow)" />

        {/* ═══ STARS ═══ */}
        <g opacity="0.6">
          <circle cx="120" cy="80" r="1" fill="#fff" opacity="0.5" />
          <circle cx="280" cy="45" r="1.2" fill="#fff" opacity="0.4" />
          <circle cx="420" cy="95" r="0.8" fill="#fff" opacity="0.6" />
          <circle cx="560" cy="35" r="1.1" fill="#fff" opacity="0.35" />
          <circle cx="700" cy="70" r="0.9" fill="#fff" opacity="0.5" />
          <circle cx="880" cy="50" r="1" fill="#fff" opacity="0.4" />
          <circle cx="1020" cy="85" r="0.7" fill="#fff" opacity="0.55" />
          <circle cx="1150" cy="40" r="1.2" fill="#fff" opacity="0.3" />
          <circle cx="1300" cy="75" r="0.8" fill="#fff" opacity="0.45" />
          <circle cx="1450" cy="55" r="1" fill="#fff" opacity="0.4" />
          <circle cx="200" cy="140" r="0.6" fill="#fff" opacity="0.3" />
          <circle cx="600" cy="120" r="0.7" fill="#fff" opacity="0.25" />
          <circle cx="1000" cy="130" r="0.8" fill="#fff" opacity="0.3" />
          <circle cx="1380" cy="110" r="0.6" fill="#fff" opacity="0.35" />
        </g>

        {/* ═══ LAYER 1 — FAR BACKGROUND SKYLINE ═══
            Illuminated tall buildings, silhouettes against the glowing sky */}
        <g opacity="0.32" fill="#121e35">
          <rect x="20"   y="340" width="55"  height="560" />
          <rect x="90"   y="300" width="45"  height="600" />
          <rect x="150"  y="370" width="60"  height="530" />
          <rect x="230"  y="280" width="40"  height="620" />
          <rect x="290"  y="350" width="55"  height="550" />
          <rect x="370"  y="310" width="48"  height="590" />
          <rect x="440"  y="380" width="52"  height="520" />
          <rect x="510"  y="290" width="44"  height="610" />
          <rect x="580"  y="340" width="60"  height="560" />
          <rect x="660"  y="360" width="50"  height="540" />
          <rect x="730"  y="300" width="55"  height="600" />
          <rect x="810"  y="330" width="42"  height="570" />
          <rect x="870"  y="270" width="58"  height="630" />
          <rect x="950"  y="350" width="50"  height="550" />
          <rect x="1020" y="310" width="46"  height="590" />
          <rect x="1090" y="360" width="54"  height="540" />
          <rect x="1160" y="290" width="48"  height="610" />
          <rect x="1230" y="340" width="56"  height="560" />
          <rect x="1310" y="320" width="42"  height="580" />
          <rect x="1370" y="370" width="50"  height="530" />
          <rect x="1440" y="280" width="54"  height="620" />
          <rect x="1520" y="350" width="80"  height="550" />
          {/* Faint far windows */}
          <g fill="#FBBF24" opacity="0.25">
            <rect x="237" y="310" width="3" height="3" />
            <rect x="245" y="310" width="3" height="3" />
            <rect x="237" y="330" width="3" height="3" />
            <rect x="517" y="320" width="3" height="3" />
            <rect x="525" y="320" width="3" height="3" />
            <rect x="880" y="300" width="3" height="3" />
            <rect x="888" y="300" width="3" height="3" />
            <rect x="880" y="315" width="3" height="3" />
            <rect x="1168" y="320" width="3" height="3" />
            <rect x="1176" y="320" width="3" height="3" />
            <rect x="1448" y="310" width="3" height="3" />
            <rect x="1456" y="310" width="3" height="3" />
          </g>
        </g>

        {/* ═══ LAYER 2 — MIDGROUND BUILDINGS ═══
            Neighborhood blocks, medium visibility, rim-lit edges */}
        <g opacity="0.65">
          {/* Buildings */}
          <g fill="#16233d" stroke="#233a5f" strokeWidth="0.5">
            <rect x="0"    y="480" width="75"  height="420" />
            <rect x="85"   y="450" width="70"  height="450" />
            <rect x="170"  y="470" width="80"  height="430" />
            <rect x="270"  y="440" width="65"  height="460" />
            <rect x="350"  y="465" width="75"  height="435" />
            <rect x="440"  y="450" width="70"  height="450" />
            <rect x="530"  y="475" width="60"  height="425" />
            <rect x="610"  y="445" width="75"  height="455" />
            <rect x="700"  y="460" width="65"  height="440" />
            <rect x="780"  y="440" width="80"  height="460" />
            <rect x="880"  y="455" width="70"  height="445" />
            <rect x="965"  y="470" width="65"  height="430" />
            <rect x="1050" y="445" width="75"  height="455" />
            <rect x="1140" y="465" width="70"  height="435" />
            <rect x="1225" y="450" width="65"  height="450" />
            <rect x="1310" y="475" width="75"  height="425" />
            <rect x="1400" y="455" width="70"  height="445" />
            <rect x="1490" y="470" width="110" height="430" />
          </g>
          {/* Rim lighting — moonlit rooftop edges */}
          <g stroke="#3b6899" strokeWidth="1.6" opacity="0.6">
            <line x1="0"    y1="480" x2="75"   y2="480" />
            <line x1="85"   y1="450" x2="155"  y2="450" />
            <line x1="170"  y1="470" x2="250"  y2="470" />
            <line x1="270"  y1="440" x2="335"  y2="440" />
            <line x1="350"  y1="465" x2="425"  y2="465" />
            <line x1="440"  y1="450" x2="510"  y2="450" />
            <line x1="610"  y1="445" x2="685"  y2="445" />
            <line x1="780"  y1="440" x2="860"  y2="440" />
            <line x1="1050" y1="445" x2="1125" y2="445" />
            <line x1="1225" y1="450" x2="1290" y2="450" />
            <line x1="1400" y1="455" x2="1470" y2="455" />
          </g>
          {/* Rooftop details — water tanks, antennas */}
          <g stroke="#1a2d48" strokeWidth="0.8" fill="#0b1420">
            <rect x="105" y="440" width="12" height="10" />
            <line x1="290" y1="440" x2="290" y2="420" />
            <rect x="630" y="435" width="10" height="10" />
            <line x1="810" y1="440" x2="810" y2="418" />
            <rect x="1070" y="435" width="12" height="10" />
            <line x1="1430" y1="455" x2="1430" y2="432" />
          </g>
          {/* Mid-layer windows — flicker group A */}
          <g fill="#FBBF24" className="animate-[windowFlickerA_5s_ease-in-out_infinite]">
            <rect x="15"   y="500" width="4" height="5" opacity="0.5" />
            <rect x="30"   y="500" width="4" height="5" opacity="0.35" />
            <rect x="45"   y="500" width="4" height="5" opacity="0.6" />
            <rect x="15"   y="520" width="4" height="5" opacity="0.3" />
            <rect x="45"   y="520" width="4" height="5" opacity="0.5" />
            <rect x="100"  y="470" width="4" height="5" opacity="0.55" />
            <rect x="115"  y="470" width="4" height="5" opacity="0.4" />
            <rect x="130"  y="470" width="4" height="5" opacity="0.6" />
            <rect x="100"  y="490" width="4" height="5" opacity="0.45" />
            <rect x="130"  y="490" width="4" height="5" opacity="0.5" />
            <rect x="190"  y="490" width="4" height="5" opacity="0.4" />
            <rect x="210"  y="490" width="4" height="5" opacity="0.55" />
            <rect x="230"  y="490" width="4" height="5" opacity="0.35" />
            <rect x="285"  y="460" width="4" height="5" opacity="0.5" />
            <rect x="305"  y="460" width="4" height="5" opacity="0.6" />
            <rect x="285"  y="480" width="4" height="5" opacity="0.4" />
            <rect x="370"  y="485" width="4" height="5" opacity="0.55" />
            <rect x="390"  y="485" width="4" height="5" opacity="0.45" />
          </g>
          {/* Mid-layer windows — flicker group B */}
          <g fill="#FBBF24" className="animate-[windowFlickerB_6s_ease-in-out_infinite]">
            <rect x="455"  y="470" width="4" height="5" opacity="0.5" />
            <rect x="475"  y="470" width="4" height="5" opacity="0.6" />
            <rect x="490"  y="470" width="4" height="5" opacity="0.35" />
            <rect x="455"  y="490" width="4" height="5" opacity="0.45" />
            <rect x="625"  y="465" width="4" height="5" opacity="0.55" />
            <rect x="645"  y="465" width="4" height="5" opacity="0.4" />
            <rect x="665"  y="465" width="4" height="5" opacity="0.6" />
            <rect x="625"  y="485" width="4" height="5" opacity="0.5" />
            <rect x="715"  y="480" width="4" height="5" opacity="0.45" />
            <rect x="735"  y="480" width="4" height="5" opacity="0.55" />
            <rect x="800"  y="460" width="4" height="5" opacity="0.5" />
            <rect x="820"  y="460" width="4" height="5" opacity="0.65" />
            <rect x="840"  y="460" width="4" height="5" opacity="0.4" />
            <rect x="800"  y="480" width="4" height="5" opacity="0.55" />
            <rect x="895"  y="475" width="4" height="5" opacity="0.5" />
            <rect x="915"  y="475" width="4" height="5" opacity="0.6" />
            <rect x="935"  y="475" width="4" height="5" opacity="0.35" />
          </g>
          {/* Mid-layer windows — flicker group C */}
          <g fill="#FBBF24" className="animate-[windowFlickerC_7s_ease-in-out_infinite]">
            <rect x="980"  y="490" width="4" height="5" opacity="0.45" />
            <rect x="1000" y="490" width="4" height="5" opacity="0.6" />
            <rect x="1070" y="465" width="4" height="5" opacity="0.5" />
            <rect x="1090" y="465" width="4" height="5" opacity="0.55" />
            <rect x="1110" y="465" width="4" height="5" opacity="0.4" />
            <rect x="1070" y="485" width="4" height="5" opacity="0.6" />
            <rect x="1155" y="485" width="4" height="5" opacity="0.45" />
            <rect x="1175" y="485" width="4" height="5" opacity="0.55" />
            <rect x="1195" y="485" width="4" height="5" opacity="0.35" />
            <rect x="1240" y="470" width="4" height="5" opacity="0.5" />
            <rect x="1260" y="470" width="4" height="5" opacity="0.6" />
            <rect x="1240" y="490" width="4" height="5" opacity="0.45" />
            <rect x="1325" y="495" width="4" height="5" opacity="0.5" />
            <rect x="1345" y="495" width="4" height="5" opacity="0.55" />
            <rect x="1415" y="475" width="4" height="5" opacity="0.6" />
            <rect x="1435" y="475" width="4" height="5" opacity="0.4" />
            <rect x="1455" y="475" width="4" height="5" opacity="0.5" />
            <rect x="1505" y="490" width="4" height="5" opacity="0.55" />
            <rect x="1525" y="490" width="4" height="5" opacity="0.45" />
          </g>
        </g>

        {/* ═══ LAYER 3 — FOREGROUND BUILDINGS ═══
            Closest buildings with bright windows, balconies, rooftop clutter */}
        <g opacity="0.95">
          {/* Building bodies */}
          <g fill="#1b2a47" stroke="#2b426f" strokeWidth="0.7">
            <rect x="-10"  y="600" width="95"  height="300" />
            <rect x="100"  y="580" width="85"  height="320" />
            {/* Balcony indent on building 2 */}
            <rect x="110"  y="620" width="15"  height="3" fill="#2b426f" stroke="none" />
            <rect x="160"  y="620" width="15"  height="3" fill="#2b426f" stroke="none" />
            <rect x="200"  y="595" width="100" height="305" />
            <rect x="320"  y="610" width="80"  height="290" />
            {/* Pitched roof hint */}
            <polygon points="320,610 400,610 360,585" fill="#1b2a47" stroke="#2b426f" strokeWidth="0.5" />
            <rect x="420"  y="590" width="90"  height="310" />
            <rect x="530"  y="605" width="75"  height="295" />
            <rect x="625"  y="585" width="95"  height="315" />
            <rect x="740"  y="600" width="80"  height="300" />
            {/* Pitched roof */}
            <polygon points="740,600 820,600 780,575" fill="#1b2a47" stroke="#2b426f" strokeWidth="0.5" />
            <rect x="840"  y="590" width="85"  height="310" />
            <rect x="945"  y="605" width="75"  height="295" />
            <rect x="1040" y="585" width="90"  height="315" />
            <rect x="1150" y="600" width="80"  height="300" />
            <rect x="1250" y="595" width="85"  height="305" />
            <polygon points="1250,595 1335,595 1292,570" fill="#1b2a47" stroke="#2b426f" strokeWidth="0.5" />
            <rect x="1355" y="605" width="75"  height="295" />
            <rect x="1450" y="590" width="90"  height="310" />
            <rect x="1555" y="600" width="55"  height="300" />
          </g>

          {/* Rim lighting — brighter for foreground */}
          <g stroke="#3f75b0" strokeWidth="2.0" opacity="0.65">
            <line x1="-10"  y1="600" x2="85"   y2="600" />
            <line x1="100"  y1="580" x2="185"  y2="580" />
            <line x1="200"  y1="595" x2="300"  y2="595" />
            <line x1="420"  y1="590" x2="510"  y2="590" />
            <line x1="530"  y1="605" x2="605"  y2="605" />
            <line x1="625"  y1="585" x2="720"  y2="585" />
            <line x1="840"  y1="590" x2="925"  y2="590" />
            <line x1="1040" y1="585" x2="1130" y2="585" />
            <line x1="1450" y1="590" x2="1540" y2="590" />
          </g>

          {/* Rooftop clutter — AC units, tanks, chimneys, antennas */}
          <g fill="#0e1828" stroke="#1a2d48" strokeWidth="0.6">
            {/* AC units */}
            <rect x="20"  y="590" width="14" height="10" />
            <rect x="230" y="585" width="12" height="10" />
            <rect x="470" y="580" width="14" height="10" />
            <rect x="870" y="580" width="12" height="10" />
            <rect x="1280" y="585" width="14" height="10" />
            {/* Water tanks */}
            <rect x="135" y="568" width="16" height="12" />
            <rect x="660" y="573" width="16" height="12" />
            <rect x="1080" y="573" width="16" height="12" />
            <rect x="1480" y="578" width="16" height="12" />
            {/* Antennas */}
            <line x1="50"   y1="600" x2="50"   y2="575" strokeWidth="1" />
            <line x1="370"  y1="585" x2="370"  y2="560" strokeWidth="1" />
            <line x1="770"  y1="575" x2="770"  y2="550" strokeWidth="1" />
            <line x1="1190" y1="600" x2="1190" y2="575" strokeWidth="1" />
            {/* Chimneys */}
            <rect x="330" y="600" width="8" height="18" rx="1" />
            <rect x="950" y="595" width="8" height="18" rx="1" />
            <rect x="1370" y="595" width="8" height="18" rx="1" />
          </g>

          {/* Foreground bright windows — flicker group A */}
          <g fill="#FBBF24" className="animate-[windowFlickerA_5s_ease-in-out_infinite]">
            <rect x="10"  y="625" width="6" height="8" opacity="0.7" />
            <rect x="30"  y="625" width="6" height="8" opacity="0.5" />
            <rect x="50"  y="625" width="6" height="8" opacity="0.75" />
            <rect x="10"  y="650" width="6" height="8" opacity="0.45" />
            <rect x="50"  y="650" width="6" height="8" opacity="0.6" />
            <rect x="10"  y="675" width="6" height="8" opacity="0.55" />
            <rect x="30"  y="675" width="6" height="8" opacity="0.7" />
            <rect x="115" y="605" width="6" height="8" opacity="0.65" />
            <rect x="140" y="605" width="6" height="8" opacity="0.5" />
            <rect x="165" y="605" width="6" height="8" opacity="0.7" />
            <rect x="115" y="630" width="6" height="8" opacity="0.55" />
            <rect x="165" y="630" width="6" height="8" opacity="0.65" />
            <rect x="115" y="655" width="6" height="8" opacity="0.4" />
            <rect x="140" y="655" width="6" height="8" opacity="0.7" />
            <rect x="220" y="618" width="6" height="8" opacity="0.6" />
            <rect x="245" y="618" width="6" height="8" opacity="0.75" />
            <rect x="270" y="618" width="6" height="8" opacity="0.5" />
            <rect x="220" y="645" width="6" height="8" opacity="0.65" />
            <rect x="270" y="645" width="6" height="8" opacity="0.55" />
            <rect x="220" y="672" width="6" height="8" opacity="0.5" />
            <rect x="245" y="672" width="6" height="8" opacity="0.7" />
            <rect x="270" y="672" width="6" height="8" opacity="0.4" />
          </g>
          {/* Foreground bright windows — flicker group B */}
          <g fill="#FBBF24" className="animate-[windowFlickerB_6s_ease-in-out_infinite]">
            <rect x="338" y="632" width="6" height="8" opacity="0.6" />
            <rect x="365" y="632" width="6" height="8" opacity="0.75" />
            <rect x="338" y="658" width="6" height="8" opacity="0.5" />
            <rect x="385" y="658" width="6" height="8" opacity="0.65" />
            <rect x="440" y="615" width="6" height="8" opacity="0.7" />
            <rect x="465" y="615" width="6" height="8" opacity="0.55" />
            <rect x="490" y="615" width="6" height="8" opacity="0.65" />
            <rect x="440" y="640" width="6" height="8" opacity="0.5" />
            <rect x="490" y="640" width="6" height="8" opacity="0.7" />
            <rect x="440" y="665" width="6" height="8" opacity="0.55" />
            <rect x="465" y="665" width="6" height="8" opacity="0.75" />
            <rect x="545" y="628" width="6" height="8" opacity="0.6" />
            <rect x="570" y="628" width="6" height="8" opacity="0.5" />
            <rect x="590" y="628" width="6" height="8" opacity="0.7" />
            <rect x="545" y="655" width="6" height="8" opacity="0.55" />
            <rect x="590" y="655" width="6" height="8" opacity="0.65" />
          </g>
          {/* Foreground bright windows — flicker group C */}
          <g fill="#FBBF24" className="animate-[windowFlickerC_7s_ease-in-out_infinite]">
            <rect x="645" y="610" width="6" height="8" opacity="0.7" />
            <rect x="670" y="610" width="6" height="8" opacity="0.55" />
            <rect x="695" y="610" width="6" height="8" opacity="0.65" />
            <rect x="645" y="635" width="6" height="8" opacity="0.5" />
            <rect x="695" y="635" width="6" height="8" opacity="0.7" />
            <rect x="645" y="660" width="6" height="8" opacity="0.55" />
            <rect x="670" y="660" width="6" height="8" opacity="0.75" />
            <rect x="695" y="660" width="6" height="8" opacity="0.45" />
            <rect x="755" y="625" width="6" height="8" opacity="0.6" />
            <rect x="780" y="625" width="6" height="8" opacity="0.7" />
            <rect x="800" y="625" width="6" height="8" opacity="0.5" />
            <rect x="755" y="650" width="6" height="8" opacity="0.55" />
            <rect x="800" y="650" width="6" height="8" opacity="0.65" />
            <rect x="860" y="615" width="6" height="8" opacity="0.7" />
            <rect x="885" y="615" width="6" height="8" opacity="0.55" />
            <rect x="910" y="615" width="6" height="8" opacity="0.6" />
            <rect x="860" y="640" width="6" height="8" opacity="0.5" />
            <rect x="910" y="640" width="6" height="8" opacity="0.75" />
            <rect x="860" y="665" width="6" height="8" opacity="0.55" />
            <rect x="885" y="665" width="6" height="8" opacity="0.7" />
          </g>
          {/* Foreground bright windows — static always-on */}
          <g fill="#FBBF24">
            <rect x="960"  y="630" width="6" height="8" opacity="0.65" />
            <rect x="985"  y="630" width="6" height="8" opacity="0.5" />
            <rect x="960"  y="655" width="6" height="8" opacity="0.6" />
            <rect x="1060" y="610" width="6" height="8" opacity="0.7" />
            <rect x="1085" y="610" width="6" height="8" opacity="0.55" />
            <rect x="1110" y="610" width="6" height="8" opacity="0.65" />
            <rect x="1060" y="635" width="6" height="8" opacity="0.5" />
            <rect x="1110" y="635" width="6" height="8" opacity="0.75" />
            <rect x="1060" y="660" width="6" height="8" opacity="0.6" />
            <rect x="1085" y="660" width="6" height="8" opacity="0.7" />
            <rect x="1165" y="625" width="6" height="8" opacity="0.55" />
            <rect x="1190" y="625" width="6" height="8" opacity="0.7" />
            <rect x="1215" y="625" width="6" height="8" opacity="0.5" />
            <rect x="1165" y="650" width="6" height="8" opacity="0.65" />
            <rect x="1215" y="650" width="6" height="8" opacity="0.6" />
            <rect x="1270" y="618" width="6" height="8" opacity="0.7" />
            <rect x="1295" y="618" width="6" height="8" opacity="0.55" />
            <rect x="1320" y="618" width="6" height="8" opacity="0.65" />
            <rect x="1270" y="645" width="6" height="8" opacity="0.5" />
            <rect x="1320" y="645" width="6" height="8" opacity="0.7" />
            <rect x="1370" y="628" width="6" height="8" opacity="0.6" />
            <rect x="1395" y="628" width="6" height="8" opacity="0.5" />
            <rect x="1415" y="628" width="6" height="8" opacity="0.7" />
            <rect x="1470" y="615" width="6" height="8" opacity="0.65" />
            <rect x="1495" y="615" width="6" height="8" opacity="0.55" />
            <rect x="1520" y="615" width="6" height="8" opacity="0.7" />
            <rect x="1470" y="640" width="6" height="8" opacity="0.5" />
            <rect x="1520" y="640" width="6" height="8" opacity="0.65" />
            <rect x="1570" y="625" width="6" height="8" opacity="0.6" />
            <rect x="1590" y="625" width="6" height="8" opacity="0.5" />
          </g>
        </g>

        {/* ═══ ATMOSPHERIC STREET HAZE ═══ */}
        <rect x="0" y="720" width="1600" height="180" fill="url(#haze)" />
        {/* Faint ambient light at street level */}
        <rect x="0" y="850" width="1600" height="4" fill="#EAB308" opacity="0.04" />

        {/* ═══ DIVERGING BEACON BEAMS — light fans out from phone sources to meet at the icon ═══ */}
        <g>
          {/* Beam 1 — far left phone, thinned down, converging to (905, 310) */}
          <polygon points="48,620 52,620 945,305 865,315" fill="url(#beam)"
            className="animate-[beamShimmer_4s_ease-in-out_infinite]" />
          {/* Beam 2 — left-mid phone */}
          <polygon points="249,610 251,610 935,296 875,324" fill="url(#beamSoft)"
            className="animate-[beamShimmer_3.5s_ease-in-out_0.5s_infinite]" />
          {/* Beam 3 — center-left phone */}
          <polygon points="459,600 461,600 932,291 878,329" fill="url(#beam)"
            className="animate-[beamShimmer_4.5s_ease-in-out_1s_infinite]" />
          {/* Beam 4 — center phone */}
          <polygon points="679,595 681,595 925,286 885,334" fill="url(#beamSoft)"
            className="animate-[beamShimmer_3.8s_ease-in-out_0.3s_infinite]" />
          {/* Beam 5 — center-right phone */}
          <polygon points="1059,595 1061,595 925,334 885,286" fill="url(#beam)"
            className="animate-[beamShimmer_4.2s_ease-in-out_0.8s_infinite]" />
          {/* Beam 6 — right phone */}
          <polygon points="1269,605 1271,605 932,329 878,291" fill="url(#beamSoft)"
            className="animate-[beamShimmer_3.6s_ease-in-out_1.2s_infinite]" />
          {/* Beam 7 — far right phone */}
          <polygon points="1489,600 1491,600 935,324 875,296" fill="url(#beam)"
            className="animate-[beamShimmer_4.8s_ease-in-out_0.6s_infinite]" />
        </g>

        {/* ═══ PHONE LIGHT SOURCES — simple, non-glowing dots (no shine) ═══ */}
        <g>
          <circle cx="50"   cy="620" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="250"  cy="610" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="460"  cy="600" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="680"  cy="595" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="1060" cy="595" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="1270" cy="605" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="1490" cy="600" r="1.5" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* ═══ BEEKN ICON — showing only the golden 'b' logo (enlarged, no halo) ═══ */}
        <g>
          {/* Render the new app icon cropped to the 'b' with screen blend mode and black-level clamping filter */}
          <image
            href={appIcon}
            x="835"
            y="210"
            width="140"
            height="140"
            clipPath="url(#iconClip)"
            filter="url(#clampBlack)"
            style={{ mixBlendMode: "screen" }}
          />
        </g>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function LandingPage({
  onGetStarted,
  issuesCount = 4,
  resolvedCount = 1,
}: LandingPageProps) {
  const checks = [
    "Verified local reports",
    "AI department routing",
    "Authority status tracking",
  ];

  const howItWorks = [
    {
      icon: Camera,
      title: "Capture",
      desc: "Snap a photo or video of the issue. Beekn tags your location automatically.",
    },
    {
      icon: Sparkles,
      title: "AI Analyzes",
      desc: "Gemini AI categorizes severity, suggests the right department, and generates an action summary.",
    },
    {
      icon: CheckCircle2,
      title: "City Resolves",
      desc: "Authorities receive routed reports. Track progress from reported to resolved.",
    },
  ];

  const stats = [
    { value: String(issuesCount), label: "Reports Filed" },
    { value: String(resolvedCount), label: "Issues Resolved" },
    { value: String(Math.max(0, issuesCount - resolvedCount)), label: "Active Signals" },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Routing",
      desc: "Gemini AI analyzes every report — categorizing severity, suggesting departments, and generating citizen safety tips.",
    },
    {
      icon: MapPin,
      title: "Proximity Verification",
      desc: "Only people physically near an issue can verify it. Eliminates fake reports and builds community trust.",
    },
    {
      icon: LayoutDashboard,
      title: "Authority Dashboard",
      desc: "Government departments get a dedicated console with filtered views, status controls, and resolution tracking.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050a15] text-[#F0F0F5] overflow-x-hidden">
      {/* ─── Header — mobile only (static), hidden on desktop for immersive hero ─── */}
      <header className="lg:hidden bg-[#050a15] border-b border-white/[0.04] z-40">
        <div className="flex items-center gap-3 px-5 py-3">
          <img src={appIcon} alt="Beekn Logo" className="w-9 h-9 rounded-xl shadow-lg object-cover" />
          <div>
            <span className="font-display font-bold text-base tracking-tight block leading-tight text-[#F0F0F5]">
              Beekn
            </span>
            <span className="text-[10px] text-[#64748B] leading-none">
              Local issues, faster action
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════
           HERO — IMMERSIVE CITY
         ══════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Full-bleed city background */}
        <CityBackground />

        {/* Left scrim gradient — desktop: horizontal, mobile: vertical */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none hidden lg:block"
          style={{
            background: "linear-gradient(to right, #050a15 0%, rgba(5,10,21,0.95) 20%, rgba(5,10,21,0.6) 35%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 z-[1] pointer-events-none lg:hidden"
          style={{
            background: "linear-gradient(to bottom, rgba(5,10,21,0.92) 0%, rgba(5,10,21,0.75) 45%, rgba(5,10,21,0.3) 70%, transparent 100%)",
          }}
        />

        {/* Desktop brand mark — floating logo, no bar */}
        <div className="hidden lg:flex absolute top-6 left-8 z-20 items-center gap-2.5">
          <img src={appIcon} alt="Beekn Logo" className="w-9 h-9 rounded-xl shadow-lg object-cover" />
          <div>
            <span className="font-display font-bold text-base tracking-tight block leading-tight text-white">
              Beekn
            </span>
            <span className="text-[10px] text-[#64748B] leading-none">
              Local issues, faster action
            </span>
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 min-h-screen flex items-center pt-24 lg:pt-28 pb-12 px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-xl lg:max-w-lg xl:max-w-xl space-y-7">
              {/* Badge */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/20 bg-[#EAB308]/[0.08] px-3.5 py-1.5 text-xs font-bold text-[#FACC15]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Summoning Solutions — Powered by Gemini AI
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-white"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
              >
                Be the{" "}
                <span className="text-gradient-coral">signal</span>
                <br />
                your community needs.
              </motion.h1>

              {/* Supporting copy */}
              <motion.p
                className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-md"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                Beekn helps citizens report civic issues with location proof,
                media evidence, and automated department dispatching.
              </motion.p>

              {/* CTA */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#F59E0B] px-7 py-4 text-base font-black text-[#050a15] shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-yellow-500/35 active:scale-[0.97]"
                >
                  Get Started for Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Feature bullets */}
              <motion.div
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
              >
                {checks.map((text) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#EAB308]" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.h2
          className="font-display text-3xl font-bold text-center mb-12 text-[#F0F0F5]"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease }}
        >
          How Beekn works
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {howItWorks.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-white/[0.06] bg-[#0a1020]/80 backdrop-blur-sm p-6 space-y-4"
                variants={cardFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-[#F0F0F5]">{item.title}</h3>
                <p className="text-sm text-[#8B96B0] leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <section className="py-16 bg-gradient-to-r from-[#EAB308] to-[#F59E0B]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease }}
            >
              <div className="font-display text-4xl font-bold text-[#050a15]">{s.value}</div>
              <div className="text-sm font-medium text-[#050a15]/70 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.h2
          className="font-display text-3xl font-bold text-center mb-12 text-[#F0F0F5]"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease }}
        >
          Built for impact
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-white/[0.06] bg-[#0a1020]/80 backdrop-blur-sm p-6 space-y-4"
                variants={cardFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-[#F0F0F5]">{item.title}</h3>
                <p className="text-sm text-[#8B96B0] leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section className="py-24 text-center max-w-2xl mx-auto px-4">
        <motion.h2
          className="font-display text-4xl font-bold text-[#F0F0F5]"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease }}
        >
          Your neighborhood is waiting.
        </motion.h2>
        <motion.p
          className="text-lg text-[#94A3B8] mt-4 mb-8"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          Join thousands of citizens making their communities better, one report
          at a time.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#F59E0B] px-7 py-4 text-base font-black text-[#050a15] shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-yellow-500/35 active:scale-[0.97]"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 border-t border-white/[0.04] text-center text-xs text-[#475569]">
        © 2025 Beekn — Built for Vibe2Ship Hackathon
      </footer>
    </div>
  );
}
