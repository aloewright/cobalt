import { Container } from "@cloudflare/containers";

export class CobaltApi extends Container {
  defaultPort = 9000;
  sleepAfter = "30m";
  enableInternet = true;
  envVars = {
    API_URL: "https://cobalt-web.lazee.workers.dev/api/",
  };
}
