// Pasa un .md (una política, unas condiciones) a una página de la web con el aspecto de index.html:
//
//   node tools/pagina.js <origen.md> <destino.html> [idioma]
//   node tools/pagina.js ../Costura/docs/privacidad.md hilana/privacidad.html
//
// El original vive en el repositorio de cada app (Hilana: Costura/docs/privacidad.md) y aquí sólo se
// publica: se cambia allí y se vuelve a pasar. GitHub Pages sirve hilana/privacidad.html también como
// /hilana/privacidad, que es la dirección que va en las tiendas.
//
// El Markdown lo convierte la API de GitHub (`gh api markdown`, modo «markdown», el de los ficheros del
// repositorio: el «gfm» es el de los comentarios y convierte cada salto de línea en un <br>) para no
// meter dependencias en una web que no tiene ninguna. Hace falta `gh` con sesión.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [src, dest, lang = 'es'] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Uso: node tools/pagina.js <origen.md> <destino.html> [idioma]');
  process.exit(1);
}

let md = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
let title = '';
// La cabecera de Jekyll (`---\ntitle: …\n---`) no es contenido; su título va a la pestaña.
const front = md.match(/^---\n([\s\S]*?)\n---\n/);
if (front) {
  title = (front[1].match(/^title:\s*(.+)$/m) || [])[1] || '';
  md = md.slice(front[0].length);
}
if (!title) title = (md.match(/^#\s+(.+)$/m) || [])[1] || path.basename(dest, '.html');

// Por la entrada estándar y no como argumento: una política entera pasa del límite de la línea de
// órdenes de Windows (unos 32 000 caracteres).
const html = execFileSync('gh', ['api', 'markdown', '--input', '-'], {
  input: JSON.stringify({ text: md, mode: 'markdown' }), encoding: 'utf8',
});

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const page = fs.readFileSync(path.join(__dirname, 'plantilla.html'), 'utf8')
  .replace('{{lang}}', lang)
  .replace('{{title}}', esc(title.replace(/^["']|["']$/g, '')))
  .replace('{{source}}', esc(path.basename(path.dirname(path.resolve(src))) + '/' + path.basename(src)))
  // Con función y no con la cadena: un «$&» o un «$1» del texto se tomaría por patrón.
  .replace('{{body}}', () => html.trim());

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, page);
console.log(`${dest} (${page.length} bytes)`);
