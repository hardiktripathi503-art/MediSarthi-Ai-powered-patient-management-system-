/**
 * Clinical Archetype SVG Visualizations for Netra AI (Server Service)
 */

export type ArchetypeKey = 'JAUNDICE' | 'ANEMIA_PALLOR' | 'STROKE_DROOP' | 'CYANOSIS' | 'NORMAL';

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

const JAUNDICE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="jaundiceBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#171e2e"/>
    </linearGradient>
    <radialGradient id="icterusGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#eab308" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ca8a04" stop-opacity="0.2"/>
    </radialGradient>
  </defs>
  <rect width="500" height="400" fill="url(#jaundiceBg)"/>
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#eab308" stroke-width="1"/>
  <circle cx="36" cy="34" r="5" fill="#eab308"/>
  <text x="50" y="38" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: SCLERAL ICTERUS (पीलिया / KAMALA)</text>
  <rect x="408" y="24" width="60" height="20" rx="4" fill="#eab308" fill-opacity="0.2"/>
  <text x="416" y="38" fill="#facc15" font-family="monospace" font-size="10" font-weight="bold">STAGE II</text>
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#1e293b" fill-opacity="0.35"/>
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M 220 260 Q 250 266 280 260" stroke="#e2e8f0" stroke-width="2"/>
  </g>
  <g>
    <rect x="180" y="145" width="58" height="34" rx="6" fill="#eab308" fill-opacity="0.12" stroke="#facc15" stroke-width="1.5"/>
    <ellipse cx="209" cy="162" rx="22" ry="11" fill="url(#icterusGlow)"/>
    <ellipse cx="209" cy="162" rx="8" ry="8" fill="#1e1b18"/>
    <circle cx="206" cy="159" r="2.5" fill="#ffffff"/>
  </g>
  <g>
    <rect x="262" y="145" width="58" height="34" rx="6" fill="#eab308" fill-opacity="0.12" stroke="#facc15" stroke-width="1.5"/>
    <ellipse cx="291" cy="162" rx="22" ry="11" fill="url(#icterusGlow)"/>
    <ellipse cx="291" cy="162" rx="8" ry="8" fill="#1e1b18"/>
    <circle cx="288" cy="159" r="2.5" fill="#ffffff"/>
  </g>
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#0f172a" fill-opacity="0.95" stroke="#334155" stroke-width="1"/>
  <text x="32" y="371" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#facc15" font-weight="bold">FINDING:</tspan> Bilateral Scleral Icterus • Conjunctival Hyperbilirubinemia • Pitta Kamala
  </text>
</svg>
`;

const ANEMIA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="anemiaBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#08101e"/>
      <stop offset="100%" stop-color="#111c2e"/>
    </linearGradient>
  </defs>
  <rect width="500" height="400" fill="url(#anemiaBg)"/>
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1"/>
  <circle cx="36" cy="34" r="5" fill="#38bdf8"/>
  <text x="50" y="38" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: CONJUNCTIVAL PALLOR (एनीमिया / PANDU)</text>
  <rect x="408" y="24" width="60" height="20" rx="4" fill="#38bdf8" fill-opacity="0.2"/>
  <text x="416" y="38" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">LOW Hb</text>
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#1e293b" fill-opacity="0.35"/>
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M 220 260 Q 250 264 280 260" stroke="#94a3b8" stroke-width="2.5"/>
  </g>
  <g>
    <rect x="180" y="145" width="58" height="36" rx="6" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="1.5"/>
    <ellipse cx="209" cy="161" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="209" cy="161" rx="7.5" ry="7.5" fill="#334155"/>
    <path d="M 190 170 Q 209 176 228 170" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <g>
    <rect x="262" y="145" width="58" height="36" rx="6" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="1.5"/>
    <ellipse cx="291" cy="161" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="291" cy="161" rx="7.5" ry="7.5" fill="#334155"/>
    <path d="M 272 170 Q 291 176 310 170" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#0f172a" fill-opacity="0.95" stroke="#334155" stroke-width="1"/>
  <text x="32" y="371" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#38bdf8" font-weight="bold">FINDING:</tspan> Conjunctival Pallor Bilateral • Mucosal Microvascular Depletion • Pandu Roga
  </text>
</svg>
`;

const STROKE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="strokeBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#140b12"/>
      <stop offset="100%" stop-color="#24111d"/>
    </linearGradient>
  </defs>
  <rect width="500" height="400" fill="url(#strokeBg)"/>
  <line x1="250" y1="55" x2="250" y2="340" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4,4"/>
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#1e101a" fill-opacity="0.95" stroke="#f43f5e" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#f43f5e"/>
  <text x="50" y="38" fill="#fecdd3" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CRANIOFACIAL ASYMMETRY: STROKE DROOP (FAST ALERT)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#f43f5e" fill-opacity="0.3"/>
  <text x="398" y="38" fill="#f43f5e" font-family="monospace" font-size="10" font-weight="bold">FAST: DROOP</text>
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 215, 332 295, 250 330 C 176 305, 160 210, 160 110 Z" stroke="#fda4af" stroke-width="1.5" stroke-dasharray="6,3" fill="#2d1222" fill-opacity="0.4"/>
  </g>
  <g>
    <path d="M 215 258 Q 248 260 285 278" fill="none" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="285" y1="258" x2="285" y2="276" stroke="#f43f5e" stroke-width="2"/>
    <polygon points="285,280 281,272 289,272" fill="#f43f5e"/>
  </g>
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#1e101a" fill-opacity="0.98" stroke="#f43f5e" stroke-width="1.5"/>
  <text x="32" y="371" fill="#fecdd3" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#f43f5e" font-weight="bold">RED FLAG ALERT:</tspan> Hemifacial Asymmetry • Seventh Cranial Nerve Paresis • Pakshaghata
  </text>
</svg>
`;

const CYANOSIS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="cyanosisBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1020"/>
      <stop offset="100%" stop-color="#101a36"/>
    </linearGradient>
    <radialGradient id="cyanosisLips" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#1d4ed8" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.2"/>
    </radialGradient>
  </defs>
  <rect width="500" height="400" fill="url(#cyanosisBg)"/>
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#38bdf8"/>
  <text x="50" y="38" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: CENTRAL CYANOSIS (नीलिमा / HYPOXIA)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#2563eb" fill-opacity="0.3"/>
  <text x="398" y="38" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">LOW SpO2</text>
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#172554" fill-opacity="0.35"/>
  </g>
  <ellipse cx="250" cy="265" rx="55" ry="32" fill="#1e3a8a" fill-opacity="0.45"/>
  <path d="M 220 260 Q 250 252 280 260 Q 250 274 220 260 Z" fill="url(#cyanosisLips)" stroke="#60a5fa" stroke-width="2"/>
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#0f172a" fill-opacity="0.98" stroke="#38bdf8" stroke-width="1.5"/>
  <text x="32" y="371" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#38bdf8" font-weight="bold">URGENT EVALUATION:</tspan> Central Cyanosis • Reduced Oxygen Saturation • Nilima Oshtha
  </text>
</svg>
`;

const NORMAL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="normalBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#061814"/>
      <stop offset="100%" stop-color="#0d2b24"/>
    </linearGradient>
  </defs>
  <rect width="500" height="400" fill="url(#normalBg)"/>
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#062e24" fill-opacity="0.95" stroke="#10b981" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#10b981"/>
  <text x="50" y="38" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL BASELINE: NORMAL BIOMETRICS (प्राकृत समरूपता)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#10b981" fill-opacity="0.25"/>
  <text x="404" y="38" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold">OPTIMAL</text>
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#34d399" stroke-width="1.5" stroke-dasharray="6,3" fill="#064e3b" fill-opacity="0.25"/>
    <path d="M 220 260 Q 250 265 280 260" stroke="#fb7185" stroke-width="2.5"/>
  </g>
  <g>
    <rect x="180" y="145" width="58" height="34" rx="6" fill="#064e3b" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5"/>
    <ellipse cx="209" cy="162" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="209" cy="162" rx="7.5" ry="7.5" fill="#334155"/>
    <rect x="262" y="145" width="58" height="34" rx="6" fill="#064e3b" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5"/>
    <ellipse cx="291" cy="162" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="291" cy="162" rx="7.5" ry="7.5" fill="#334155"/>
  </g>
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#062e24" fill-opacity="0.95" stroke="#047857" stroke-width="1"/>
  <text x="32" y="371" fill="#d1fae5" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#34d399" font-weight="bold">NORMAL BASELINE:</tspan> Clear Sclera Bilateral • Intact 7th Nerve Symmetry • Prasanna Netra
  </text>
</svg>
`;

export const CLINICAL_ARCHETYPE_SVGS: Record<ArchetypeKey, string> = {
  JAUNDICE: svgToDataUri(JAUNDICE_SVG),
  ANEMIA_PALLOR: svgToDataUri(ANEMIA_SVG),
  STROKE_DROOP: svgToDataUri(STROKE_SVG),
  CYANOSIS: svgToDataUri(CYANOSIS_SVG),
  NORMAL: svgToDataUri(NORMAL_SVG),
};
