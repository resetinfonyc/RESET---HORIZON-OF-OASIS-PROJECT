// Sends visitors on the old address to resethoasis.com, keeping the path and query.
const CANONICAL_HOST = "resethoasis.com";
const OLD_HOSTS = new Set(["horizonofoasis.com", "www.horizonofoasis.com"]);

export function redirectFor(requestUrl) {
  const url = new URL(requestUrl);
  if (!OLD_HOSTS.has(url.hostname)) return null;
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  return Response.redirect(url.toString(), 301);
}

export default {
  async fetch(request, env) {
    return redirectFor(request.url) ?? env.ASSETS.fetch(request);
  },
};
