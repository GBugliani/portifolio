import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// index.html remains the source for the shared layout and content.
// Each route is exported with its own visible section and metadata before JS runs.
const root = new URL("./", import.meta.url);
const output = new URL("./dist/", root);
const origin = "https://guilhermebugliani-dev.vercel.app";
const source = await readFile(new URL("index.html", root), "utf8");
const routes = JSON.parse(source.match(/<script type="application\/json" id="site-pages">([\s\S]*?)<\/script>/)[1]);
const structuredData = JSON.parse(source.match(/<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/)[1]);
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

await mkdir(output, { recursive: true });

for (const [sectionId, page] of Object.entries(routes)) {
  const url = `${origin}${page.path}`;
  let html = source.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(page.title)}</title>`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  for (const [attribute, key, value] of [
    ["name", "description", page.description],
    ["property", "og:title", page.title],
    ["property", "og:description", page.description],
    ["property", "og:url", url],
    ["name", "twitter:title", page.title],
    ["name", "twitter:description", page.description],
  ]) {
    const tag = new RegExp(`<meta ${attribute}="${key}" content="[^"]*" \\/>`);
    html = html.replace(tag, `<meta ${attribute}="${key}" content="${escapeAttribute(value)}" />`);
  }

  html = html.replace(/<section class="page(?: active)?" id="([^"]+)"([^>]*)>/g, (_, id, attributes) => {
    attributes = attributes.replace(/\s+hidden\b/g, "");
    return `<section class="page${id === sectionId ? " active" : ""}" id="${id}"${attributes}${id === sectionId ? "" : " hidden"}>`;
  });
  html = html.replace(/<(h[12]) id="(home|projects|info|contact)-title"([^>]*)>([\s\S]*?)<\/\1>/g, (_, originalTag, id, attributes, content) => {
    const tag = id === sectionId ? "h1" : "h2";
    return `<${tag} id="${id}-title"${attributes}>${content}</${tag}>`;
  });
  html = html.replace(/<nav class="navigation"[\s\S]*?<\/nav>/, (nav) => nav.replace(/<a\b[^>]*data-section="([^"]+)"[^>]*>/g, (tag, id) => {
    tag = tag.replace(/ class="active"/, "").replace(/ aria-current="page"/, "");
    return id === sectionId ? tag.replace(/>$/, ' class="active" aria-current="page">') : tag;
  }));

  const data = structuredClone(structuredData);
  const webpage = data["@graph"].find((item) => item["@id"].endsWith("#webpage"));
  Object.assign(webpage, { "@type": page.type, "@id": `${url}#webpage`, url, name: page.title, description: page.description });
  html = html.replace(/(<script type="application\/ld\+json" id="structured-data">)[\s\S]*?(<\/script>)/, (_, start, end) => `${start}\n${JSON.stringify(data, null, 2)}\n${end}`);

  const filename = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`;
  await writeFile(new URL(filename, output), html);
  console.log(`${page.path} → ${filename}`);
}

for (const asset of ["styles.css", "script.js", "favicon.svg", "robots.txt", "sitemap.xml"]) {
  await copyFile(new URL(asset, root), new URL(asset, output));
}
console.log(`Site exportado para ${fileURLToPath(output)}`);
