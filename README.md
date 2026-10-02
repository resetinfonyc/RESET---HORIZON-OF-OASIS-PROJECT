# Horizon of Oasis

The website for [horizonofoasis.com](https://horizonofoasis.com): a private 40-acre estate retreat in Pennsylvania, about two hours from New York City.

Right now it's a single home page. It runs on Cloudflare Workers as a static site, so a full site can grow out of it by adding pages to `public/`.

## Layout

```
public/          everything served on the site
  index.html     home page
  styles.css     shared styles for every page
  404.html       not-found page
  images/        site images (WebP, plus og.jpg for link previews)
  _headers       security and cache headers
wrangler.jsonc   Cloudflare config, including the horizonofoasis.com custom domain
tests/           checks for broken links, SEO tags and leaked investor material
```

## Work on it locally

```sh
npm install
npm run dev    # http://localhost:8787
npm test
```

## Deploy

Pushes to `main` deploy automatically once the repo is connected in Cloudflare (Workers & Pages → Create → Import a repository). Deploy command: `npx wrangler deploy`.

To deploy by hand: `npm run deploy`.

`wrangler.jsonc` attaches `horizonofoasis.com` as a custom domain on deploy, so the domain must be added to the same Cloudflare account first.
