import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const pub = join(root, "public");
const read = (p) => readFileSync(join(root, p), "utf8");
const SITE = "https://horizonofoasis.com/";

const htmlPages = readdirSync(pub).filter((f) => f.endsWith(".html"));
const index = read("public/index.html");

// Every local src/href in a page, e.g. "/styles.css" or "/images/dome.webp".
function localRefs(html) {
  return [...html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== "/");
}

test("home page points search engines and link previews at the domain", () => {
  assert.match(index, /<link rel="canonical" href="https:\/\/horizonofoasis\.com\/">/);
  assert.match(index, /<meta property="og:url" content="https:\/\/horizonofoasis\.com\/">/);
  assert.match(index, /<meta property="og:image" content="https:\/\/horizonofoasis\.com\/images\/og\.jpg">/);
  assert.match(index, /<title>Horizon of Oasis[^<]*<\/title>/);
  assert.match(index, /<meta name="description" content="[^"]{50,160}">/);
});

for (const page of htmlPages) {
  test(`${page}: every local asset it references exists`, () => {
    for (const ref of localRefs(read(`public/${page}`))) {
      assert.ok(existsSync(join(pub, ref)), `${page} references missing file ${ref}`);
    }
  });

  test(`${page}: has lang, charset and viewport`, () => {
    const html = read(`public/${page}`);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport"/);
  });
}

test("every in-page anchor link has a matching section id", () => {
  for (const [, id] of index.matchAll(/href="#([^"]+)"/g)) {
    assert.match(index, new RegExp(`id="${id}"`), `missing id="${id}"`);
  }
});

test("every image has alt text and explicit dimensions", () => {
  for (const [tag] of index.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag, /\balt="/, `no alt: ${tag}`);
    assert.match(tag, /\bwidth="\d+"/, `no width: ${tag}`);
    assert.match(tag, /\bheight="\d+"/, `no height: ${tag}`);
  }
});

test("the name section explains Oasis, Horizon and On the horizon", () => {
  const section = index.match(/<section id="meaning"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, "no meaning section");
  for (const term of ["Oasis", "Horizon", "On the horizon"]) {
    assert.match(section, new RegExp(`<dt>${term}</dt>`));
  }
  assert.match(index, /href="#meaning"/, "meaning section is not in the nav");
});

test("inquiry links go to a real mailbox", () => {
  const mailtos = [...index.matchAll(/href="mailto:([^"?]+)/g)].map((m) => m[1]);
  assert.ok(mailtos.length > 0, "no mailto link on the page");
  for (const addr of mailtos) assert.match(addr, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
});

test("public page keeps investor-only material out", () => {
  const text = index.replace(/<[^>]+>/g, " ");
  for (const banned of [/\$\s?\d/, /EBITDA/i, /preferred return/i, /\bLandCo\b/, /\bOpCo\b/, /confidential/i, /helipad/i]) {
    assert.doesNotMatch(text, banned);
  }
});

test("robots.txt and sitemap.xml use the production domain", () => {
  assert.match(read("public/robots.txt"), /Sitemap: https:\/\/horizonofoasis\.com\/sitemap\.xml/);
  assert.match(read("public/sitemap.xml"), new RegExp(`<loc>${SITE}</loc>`));
});

test("wrangler config serves ./public on horizonofoasis.com", () => {
  // JSONC: drop full-line // comments before parsing.
  const cfg = JSON.parse(read("wrangler.jsonc").replace(/^\s*\/\/.*$/gm, ""));
  assert.equal(cfg.name, "horizon-of-oasis");
  assert.equal(cfg.assets.directory, "./public");
  assert.equal(cfg.assets.not_found_handling, "404-page");
  assert.ok(existsSync(join(pub, "404.html")));
  assert.deepEqual(cfg.routes, [{ pattern: "horizonofoasis.com", custom_domain: true }]);
  assert.match(cfg.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
});
