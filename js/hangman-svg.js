// ============================================================
// LE PENDU — Dessin du pendu en SVG, style "marqueur à main levée"
// stages: 0=potence seule ... 6=perdu (corps complet)
// ============================================================

function renderGallows(errors) {
  const stages = [
    // tete
    `<circle cx="150" cy="118" r="22" class="pendu-line" />`,
    // corps
    `<line x1="150" y1="140" x2="150" y2="205" class="pendu-line" />`,
    // bras gauche
    `<line x1="150" y1="155" x2="118" y2="185" class="pendu-line" />`,
    // bras droit
    `<line x1="150" y1="155" x2="182" y2="185" class="pendu-line" />`,
    // jambe gauche
    `<line x1="150" y1="205" x2="122" y2="245" class="pendu-line" />`,
    // jambe droite
    `<line x1="150" y1="205" x2="178" y2="245" class="pendu-line" />`
  ];

  const visible = stages.slice(0, Math.min(errors, stages.length)).join("\n");

  return `
  <svg viewBox="0 0 320 300" class="gallows-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="sketchy" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="noise" seed="7"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <g filter="url(#sketchy)">
      <!-- base -->
      <line x1="40" y1="270" x2="180" y2="270" class="gibbet-line" />
      <!-- poteau -->
      <line x1="70" y1="270" x2="70" y2="40" class="gibbet-line" />
      <!-- traverse -->
      <line x1="70" y1="40" x2="150" y2="40" class="gibbet-line" />
      <!-- soutien diagonal -->
      <line x1="70" y1="72" x2="102" y2="40" class="gibbet-line" />
      <!-- corde -->
      <line x1="150" y1="40" x2="150" y2="96" class="gibbet-line" />
      ${visible}
    </g>
  </svg>`;
}

window.PenduSVG = { renderGallows };
