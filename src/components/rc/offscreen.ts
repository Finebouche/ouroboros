// Cours Reservoir computing : une animation lancée par le lecteur s'arrête quand le widget quitte l'écran et reprend à
// son retour (seulement si elle tournait). Hors de l'écran, elle ne coûte plus ni calcul ni batterie, et ne ralentit pas
// les autres widgets de la page.

// Appelle onChange(true / false) à chaque entrée ou sortie de l'écran (marge de 100 px).
export function watchVisible(el: Element, onChange: (visible: boolean) => void) {
  new IntersectionObserver((entries) => onChange(entries[entries.length - 1].isIntersecting), { rootMargin: '100px' }).observe(el);
}

export function pauseOffscreen(el: Element, o: { playing: () => boolean; pause: () => void; resume: () => void }) {
  let held = false;
  watchVisible(el, (visible) => {
    if (!visible && o.playing()) { held = true; o.pause(); }
    else if (visible && held) { held = false; o.resume(); }
  });
}
