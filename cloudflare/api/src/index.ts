import { CobaltApi } from "./container";

export { CobaltApi };

interface Env {
  COBALT_API: DurableObjectNamespace<CobaltApi>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = env.COBALT_API.getByName("production");
    return container.fetch(request);
  },
};
