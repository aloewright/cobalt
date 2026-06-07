interface Env {
  ASSETS: Fetcher;
  COBALT_API: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api") || url.pathname.startsWith("/tunnel")) {
      const apiPath = url.pathname.startsWith("/api")
        ? url.pathname.slice(4) || "/"
        : url.pathname;
      const apiUrl = new URL(`${apiPath}${url.search}`, "https://cobalt-api.internal");
      return env.COBALT_API.fetch(new Request(apiUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
