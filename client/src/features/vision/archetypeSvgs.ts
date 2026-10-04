/**
 * Clinical Archetype SVG Visualizations for Netra AI
 * High-fidelity anatomical vectors representing diagnostic signs:
 * - JAUNDICE (Scleral Icterus)
 * - ANEMIA_PALLOR (Conjunctival Pallor)
 * - STROKE_DROOP (Unilateral Craniofacial Asymmetry)
 * - CYANOSIS (Circumoral & Lip Hypoxia)
 * - NORMAL (Clear Sclera & Bilateral Cranial Symmetry)
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
    <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="500" height="400" fill="url(#jaundiceBg)"/>

  <!-- Diagnostic Grid Lines -->
  <g stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.12">
    <line x1="0" y1="80" x2="500" y2="80"/>
    <line x1="0" y1="160" x2="500" y2="160"/>
    <line x1="0" y1="240" x2="500" y2="240"/>
    <line x1="0" y1="320" x2="500" y2="320"/>
    <line x1="125" y1="0" x2="125" y2="400"/>
    <line x1="250" y1="0" x2="250" y2="400" stroke="#eab308" stroke-opacity="0.3" stroke-dasharray="4,4"/>
    <line x1="375" y1="0" x2="375" y2="400"/>
  </g>

  <!-- HUD Telemetry Header -->
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#eab308" stroke-width="1"/>
  <circle cx="36" cy="34" r="5" fill="#eab308" filter="url(#glowYellow)"/>
  <text x="50" y="38" fill="#fef08a" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: SCLERAL ICTERUS (पीलिया / KAMALA)</text>
  <rect x="408" y="24" width="60" height="20" rx="4" fill="#eab308" fill-opacity="0.2"/>
  <text x="416" y="38" fill="#facc15" font-family="monospace" font-size="10" font-weight="bold">STAGE II</text>

  <!-- Anatomical Craniofacial Silhouette -->
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <!-- Cranial Oval -->
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#1e293b" fill-opacity="0.35"/>
    <!-- Nose Ridge -->
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
    <!-- Mouth Line -->
    <path d="M 220 260 Q 250 266 280 260" stroke="#e2e8f0" stroke-width="2"/>
  </g>

  <!-- Ocular Landmark Bounding Box - Right Eye -->
  <g>
    <rect x="180" y="145" width="58" height="34" rx="6" fill="#eab308" fill-opacity="0.12" stroke="#facc15" stroke-width="1.5"/>
    <!-- Sclera -->
    <ellipse cx="209" cy="162" rx="22" ry="11" fill="url(#icterusGlow)"/>
    <ellipse cx="209" cy="162" rx="8" ry="8" fill="#1e1b18"/>
    <circle cx="206" cy="159" r="2.5" fill="#ffffff"/>
    <!-- Target Marker -->
    <path d="M 180 152 L 180 145 L 187 145 M 238 152 L 238 145 L 231 145 M 180 172 L 180 179 L 187 179 M 238 172 L 238 179 L 231 179" stroke="#fef08a" stroke-width="2"/>
    <text x="184" y="140" fill="#facc15" font-family="monospace" font-size="9" font-weight="bold">R-SCLERA: +3.6</text>
  </g>

  <!-- Ocular Landmark Bounding Box - Left Eye -->
  <g>
    <rect x="262" y="145" width="58" height="34" rx="6" fill="#eab308" fill-opacity="0.12" stroke="#facc15" stroke-width="1.5"/>
    <!-- Sclera -->
    <ellipse cx="291" cy="162" rx="22" ry="11" fill="url(#icterusGlow)"/>
    <ellipse cx="291" cy="162" rx="8" ry="8" fill="#1e1b18"/>
    <circle cx="288" cy="159" r="2.5" fill="#ffffff"/>
    <!-- Target Marker -->
    <path d="M 262 152 L 262 145 L 269 145 M 320 152 L 320 145 L 313 145 M 262 172 L 262 179 L 269 179 M 320 172 L 320 179 L 313 179" stroke="#fef08a" stroke-width="2"/>
    <text x="266" y="140" fill="#facc15" font-family="monospace" font-size="9" font-weight="bold">L-SCLERA: +3.8</text>
  </g>

  <!-- Clinical Callout Badge -->
  <g>
    <line x1="322" y1="162" x2="375" y2="162" stroke="#facc15" stroke-width="1.5" stroke-dasharray="2,2"/>
    <circle cx="375" cy="162" r="3" fill="#facc15"/>
    <rect x="375" y="142" width="105" height="40" rx="6" fill="#0f172a" fill-opacity="0.95" stroke="#eab308" stroke-width="1"/>
    <text x="382" y="156" fill="#fef08a" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">Bilirubin Shift</text>
    <text x="382" y="172" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="8">λ = 574nm (Yellow)</text>
  </g>

  <!-- Bottom Telemetry Card -->
  <rect x="20" y="348" width="460" height="38" rx="8" fill="#0f172a" fill-opacity="0.95" stroke="#334155" stroke-width="1"/>
  <text x="32" y="371" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="10">
    <tspan fill="#facc15" font-weight="bold">FINDING:</tspan> Bilateral Scleral Icterus • Conjunctival Hyperbilirubinemia • Pitta Pitta Kamala
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
    <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="500" height="400" fill="url(#anemiaBg)"/>

  <!-- Grid Lines -->
  <g stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.12">
    <line x1="0" y1="80" x2="500" y2="80"/>
    <line x1="0" y1="160" x2="500" y2="160"/>
    <line x1="0" y1="240" x2="500" y2="240"/>
    <line x1="0" y1="320" x2="500" y2="320"/>
    <line x1="125" y1="0" x2="125" y2="400"/>
    <line x1="250" y1="0" x2="250" y2="400" stroke="#38bdf8" stroke-opacity="0.3" stroke-dasharray="4,4"/>
    <line x1="375" y1="0" x2="375" y2="400"/>
  </g>

  <!-- Header -->
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1"/>
  <circle cx="36" cy="34" r="5" fill="#38bdf8" filter="url(#glowCyan)"/>
  <text x="50" y="38" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: CONJUNCTIVAL PALLOR (एनीमिया / PANDU)</text>
  <rect x="408" y="24" width="60" height="20" rx="4" fill="#38bdf8" fill-opacity="0.2"/>
  <text x="416" y="38" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">LOW Hb</text>

  <!-- Craniofacial Silhouette -->
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#1e293b" fill-opacity="0.35"/>
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
    <!-- Pale Desaturated Lips -->
    <path d="M 220 260 Q 250 264 280 260" stroke="#94a3b8" stroke-width="2.5"/>
  </g>

  <!-- Ocular Landmark - Pale Conjunctival Rim Right -->
  <g>
    <rect x="180" y="145" width="58" height="36" rx="6" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="1.5"/>
    <ellipse cx="209" cy="161" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="209" cy="161" rx="7.5" ry="7.5" fill="#334155"/>
    <circle cx="206" cy="158" r="2" fill="#ffffff"/>
    <!-- Lower palpebral border (Blanched white) -->
    <path d="M 190 170 Q 209 176 228 170" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>
    <text x="183" y="140" fill="#38bdf8" font-family="monospace" font-size="9" font-weight="bold">PALLOR: 84%</text>
  </g>

  <!-- Ocular Landmark - Pale Conjunctival Rim Left -->
  <g>
    <rect x="262" y="145" width="58" height="36" rx="6" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="1.5"/>
    <ellipse cx="291" cy="161" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="291" cy="161" rx="7.5" ry="7.5" fill="#334155"/>
    <circle cx="288" cy="158" r="2" fill="#ffffff"/>
    <!-- Lower palpebral border (Blanched white) -->
    <path d="M 272 170 Q 291 176 310 170" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>
    <text x="265" y="140" fill="#38bdf8" font-family="monospace" font-size="9" font-weight="bold">PALLOR: 86%</text>
  </g>

  <!-- Pallor Marker Callout -->
  <g>
    <line x1="228" y1="172" x2="120" y2="200" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2"/>
    <circle cx="120" cy="200" r="3" fill="#38bdf8"/>
    <rect x="18" y="180" width="102" height="42" rx="6" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="1"/>
    <text x="26" y="196" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">Conjunctival Rim</text>
    <text x="26" y="212" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="8">Blanched Vascular Bed</text>
  </g>

  <!-- Bottom Telemetry Card -->
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
    <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="500" height="400" fill="url(#strokeBg)"/>

  <!-- Grid Lines -->
  <g stroke="#f43f5e" stroke-width="0.5" stroke-opacity="0.12">
    <line x1="0" y1="80" x2="500" y2="80"/>
    <line x1="0" y1="160" x2="500" y2="160"/>
    <line x1="0" y1="240" x2="500" y2="240"/>
    <line x1="0" y1="320" x2="500" y2="320"/>
    <line x1="125" y1="0" x2="125" y2="400"/>
    <line x1="375" y1="0" x2="375" y2="400"/>
  </g>

  <!-- Midline Cranial Deviation Axis (Red Dotted) -->
  <line x1="250" y1="55" x2="250" y2="340" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Header -->
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#1e101a" fill-opacity="0.95" stroke="#f43f5e" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#f43f5e" filter="url(#glowRed)"/>
  <text x="50" y="38" fill="#fecdd3" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CRANIOFACIAL ASYMMETRY: STROKE DROOP (FAST ALERT)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#f43f5e" fill-opacity="0.3"/>
  <text x="398" y="38" fill="#f43f5e" font-family="monospace" font-size="10" font-weight="bold">FAST: DROOP</text>

  <!-- Asymmetric Craniofacial Silhouette -->
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <!-- Unilateral asymmetry contour -->
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 215, 332 295, 250 330 C 176 305, 160 210, 160 110 Z" stroke="#fda4af" stroke-width="1.5" stroke-dasharray="6,3" fill="#2d1222" fill-opacity="0.4"/>
    <path d="M 250 170 L 244 215 L 254 215" stroke="#cbd5e1" stroke-width="1.5"/>
  </g>

  <!-- Eyes - Left normal, Right slight ptosis -->
  <g>
    <!-- Right Eye (Slight palpebral narrowing) -->
    <ellipse cx="209" cy="162" rx="20" ry="8" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
    <circle cx="209" cy="162" r="5" fill="#cbd5e1"/>
    <!-- Left Eye (Normal aperture) -->
    <ellipse cx="291" cy="160" rx="20" ry="10" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
    <circle cx="291" cy="160" r="5" fill="#cbd5e1"/>
  </g>

  <!-- Oral Angle Droop Vector (Critical Finding) -->
  <g>
    <!-- Normal horizontal mouth baseline -->
    <line x1="210" y1="258" x2="290" y2="258" stroke="#64748b" stroke-width="1" stroke-dasharray="2,2"/>
    <!-- Asymmetric Drooped Mouth Path -->
    <path d="M 215 258 Q 248 260 285 278" fill="none" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round"/>
    
    <!-- Droop Vector Arrow & Deviation angle indicator -->
    <line x1="285" y1="258" x2="285" y2="276" stroke="#f43f5e" stroke-width="2"/>
    <polygon points="285,280 281,272 289,272" fill="#f43f5e"/>
    <rect x="296" y="260" width="86" height="28" rx="4" fill="#1e101a" stroke="#f43f5e" stroke-width="1"/>
    <text x="302" y="274" fill="#fecdd3" font-family="monospace" font-size="9" font-weight="bold">Δy = -18px</text>
    <text x="302" y="284" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="8 font-bold">Unilateral Droop</text>
  </g>

  <!-- Symmetry Index Badge -->
  <g>
    <rect x="18" y="140" width="112" height="48" rx="6" fill="#1e101a" fill-opacity="0.95" stroke="#f43f5e" stroke-width="1.5"/>
    <text x="26" y="156" fill="#fecdd3" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">Symmetry Index</text>
    <text x="26" y="174" fill="#f43f5e" font-family="monospace" font-size="14" font-weight="black">68% [DEFICIT]</text>
  </g>

  <!-- Bottom Emergency Banner -->
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
    <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="500" height="400" fill="url(#cyanosisBg)"/>

  <!-- Grid Lines -->
  <g stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.12">
    <line x1="0" y1="80" x2="500" y2="80"/>
    <line x1="0" y1="160" x2="500" y2="160"/>
    <line x1="0" y1="240" x2="500" y2="240"/>
    <line x1="0" y1="320" x2="500" y2="320"/>
    <line x1="125" y1="0" x2="125" y2="400"/>
    <line x1="250" y1="0" x2="250" y2="400" stroke="#38bdf8" stroke-opacity="0.3" stroke-dasharray="4,4"/>
    <line x1="375" y1="0" x2="375" y2="400"/>
  </g>

  <!-- Header -->
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#38bdf8" filter="url(#glowBlue)"/>
  <text x="50" y="38" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL ARCHETYPE: CENTRAL CYANOSIS (नीलिमा / HYPOXIA)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#2563eb" fill-opacity="0.3"/>
  <text x="398" y="38" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">LOW SpO2</text>

  <!-- Craniofacial Silhouette -->
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,3" fill="#172554" fill-opacity="0.35"/>
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
  </g>

  <!-- Eyes -->
  <ellipse cx="209" cy="162" rx="20" ry="10" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="209" cy="162" r="5" fill="#cbd5e1"/>
  <ellipse cx="291" cy="162" rx="20" ry="10" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="291" cy="162" r="5" fill="#cbd5e1"/>

  <!-- Circumoral Cyanosis Region (Blue Halation) -->
  <ellipse cx="250" cy="265" rx="55" ry="32" fill="#1e3a8a" fill-opacity="0.45" filter="url(#glowBlue)"/>

  <!-- Cyanotic Blue Vermilion Lips -->
  <g>
    <rect x="210" y="244" width="80" height="42" rx="8" fill="#1e3a8a" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1.5"/>
    <path d="M 220 260 Q 250 252 280 260 Q 250 274 220 260 Z" fill="url(#cyanosisLips)" stroke="#60a5fa" stroke-width="2"/>
    <text x="215" y="238" fill="#38bdf8" font-family="monospace" font-size="9" font-weight="bold">CYANOSIS: +4.1</text>
  </g>

  <!-- Hypoxia Callout -->
  <g>
    <line x1="290" y1="265" x2="380" y2="265" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2"/>
    <circle cx="380" cy="265" r="3" fill="#38bdf8"/>
    <rect x="380" y="244" width="102" height="42" rx="6" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="1"/>
    <text x="388" y="260" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">Deoxygenated Hb</text>
    <text x="388" y="276" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="8">Central Perfusion Deficit</text>
  </g>

  <!-- Bottom Emergency Banner -->
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
    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="500" height="400" fill="url(#normalBg)"/>

  <!-- Grid Lines -->
  <g stroke="#10b981" stroke-width="0.5" stroke-opacity="0.12">
    <line x1="0" y1="80" x2="500" y2="80"/>
    <line x1="0" y1="160" x2="500" y2="160"/>
    <line x1="0" y1="240" x2="500" y2="240"/>
    <line x1="0" y1="320" x2="500" y2="320"/>
    <line x1="125" y1="0" x2="125" y2="400"/>
    <line x1="250" y1="0" x2="250" y2="400" stroke="#10b981" stroke-opacity="0.35" stroke-dasharray="4,4"/>
    <line x1="375" y1="0" x2="375" y2="400"/>
  </g>

  <!-- Header -->
  <rect x="20" y="16" width="460" height="36" rx="8" fill="#062e24" fill-opacity="0.95" stroke="#10b981" stroke-width="1.5"/>
  <circle cx="36" cy="34" r="5" fill="#10b981" filter="url(#glowGreen)"/>
  <text x="50" y="38" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="1">NETRA AI • CLINICAL BASELINE: NORMAL BIOMETRICS (प्राकृत समरूपता)</text>
  <rect x="390" y="24" width="78" height="20" rx="4" fill="#10b981" fill-opacity="0.25"/>
  <text x="404" y="38" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold">OPTIMAL</text>

  <!-- Craniofacial Silhouette -->
  <g fill="none" stroke="#64748b" stroke-width="1.5">
    <path d="M 160 110 C 160 60, 340 60, 340 110 C 340 210, 320 310, 250 330 C 180 310, 160 210, 160 110 Z" stroke="#34d399" stroke-width="1.5" stroke-dasharray="6,3" fill="#064e3b" fill-opacity="0.25"/>
    <path d="M 250 170 L 244 215 L 256 215" stroke="#cbd5e1" stroke-width="1.5"/>
    <!-- Healthy Pink Lips -->
    <path d="M 220 260 Q 250 265 280 260" stroke="#fb7185" stroke-width="2.5"/>
  </g>

  <!-- Clear Eyes Bilateral -->
  <g>
    <!-- Right Eye -->
    <rect x="180" y="145" width="58" height="34" rx="6" fill="#064e3b" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5"/>
    <ellipse cx="209" cy="162" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="209" cy="162" rx="7.5" ry="7.5" fill="#334155"/>
    <circle cx="206" cy="159" r="2.2" fill="#ffffff"/>
    <text x="184" y="140" fill="#34d399" font-family="monospace" font-size="9" font-weight="bold">SCLERA: CLEAR</text>

    <!-- Left Eye -->
    <rect x="262" y="145" width="58" height="34" rx="6" fill="#064e3b" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5"/>
    <ellipse cx="291" cy="162" rx="21" ry="10" fill="#f8fafc"/>
    <ellipse cx="291" cy="162" rx="7.5" ry="7.5" fill="#334155"/>
    <circle cx="288" cy="159" r="2.2" fill="#ffffff"/>
    <text x="266" y="140" fill="#34d399" font-family="monospace" font-size="9" font-weight="bold">SCLERA: CLEAR</text>
  </g>

  <!-- Verified Symmetry Callout -->
  <g>
    <rect x="18" y="240" width="115" height="46" rx="6" fill="#062e24" fill-opacity="0.95" stroke="#10b981" stroke-width="1"/>
    <text x="26" y="256" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">Bilateral Symmetry</text>
    <text x="26" y="274" fill="#34d399" font-family="monospace" font-size="14" font-weight="black">97.8% [PASS]</text>
  </g>

  <!-- Bottom Telemetry Card -->
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
