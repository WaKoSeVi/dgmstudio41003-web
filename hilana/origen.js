// De dónde viene quien pulsa «Google Play» (25-11-2026). Al enlace de Play se le añade un
// «referrer» con utm_source, utm_medium y utm_campaign, que Play Console enseña en el informe de
// adquisición. No se guarda nada en el teléfono ni se manda nada a ningún sitio nuestro: sólo
// cambia el enlace, y Google ve la etiqueta al abrir la tienda, como cualquier enlace de campaña.
//
// El origen sale, por este orden, de:
//   ?o=tiktok (y &c=navidad para la campaña) en la dirección: los enlaces que ponemos nosotros
//   en perfiles, vídeos y pines, porque los navegadores de dentro de TikTok o Instagram no
//   siempre dicen de dónde vienen;
//   la página de la que viene (document.referrer), reducida a un nombre de red;
//   «directo» si no hay ninguna: QR del flyer, dirección escrita a mano o app que no lo dice.
(() => {
  const q = new URLSearchParams(location.search);
  const limpio = v => (v || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  let origen = limpio(q.get("o")), medio = "enlace";
  if (!origen) {
    let r = null;
    try { r = new URL(document.referrer); } catch (e) {}
    const red = r && ["tiktok", "instagram", "facebook", "pinterest", "youtube", "google", "bing",
      "duckduckgo", "ravelry", "reddit"].find(n => r.hostname.includes(n));
    [origen, medio] = !r ? ["directo", "ninguno"]
      : r.hostname.endsWith("dgmstudio41003.com") ? [/\/(guia|guide)\//.test(r.pathname) ? "guia" : "web", "web"]
      : [red || "otra-web", "referido"];
  }
  const ref = new URLSearchParams({ utm_source: origen, utm_medium: medio, utm_campaign: limpio(q.get("c")) || "hilana" });
  for (const a of document.querySelectorAll('a[href*="play.google.com/store/apps/details"]')) {
    const u = new URL(a.href);
    u.searchParams.set("referrer", ref.toString());
    a.href = u.toString();
  }
})();
