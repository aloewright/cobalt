#!/usr/bin/env node
/**
 * Enable Cloudflare Access for cobalt-web on lazee.workers.dev and create a
 * service token for machine-to-machine calls (sidebar-api → cobalt).
 *
 * Auth (first match wins):
 *   CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY  (Global API Key — has Access API)
 *   CLOUDFLARE_API_TOKEN
 *
 * Usage:
 *   doppler run --project quickapp --config dev -- node cloudflare/scripts/enable-access.mjs
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? "85d376fc54617bcb57185547f08e528b";
const WEB_HOST = process.env.COBALT_WEB_HOST ?? "cobalt-web.lazee.workers.dev";
const ALLOW_EMAIL = process.env.COBALT_ACCESS_EMAIL ?? "aloew@pdx.edu";
const SERVICE_TOKEN_NAME =
  process.env.COBALT_ACCESS_SERVICE_TOKEN_NAME ?? "sidebar-api-cobalt";

const API = "https://api.cloudflare.com/client/v4";

function authHeaders() {
  if (process.env.CLOUDFLARE_EMAIL && process.env.CLOUDFLARE_API_KEY) {
    return {
      "X-Auth-Email": process.env.CLOUDFLARE_EMAIL,
      "X-Auth-Key": process.env.CLOUDFLARE_API_KEY,
    };
  }
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` };
  }
  throw new Error(
    "Set CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY or CLOUDFLARE_API_TOKEN",
  );
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") ?? res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return json.result;
}

async function lockDownApiWorker() {
  const result = await api(
    `/accounts/${ACCOUNT_ID}/workers/scripts/cobalt-api/subdomain`,
    { method: "POST", body: { enabled: false, previews_enabled: false } },
  );
  console.log(`cobalt-api workers.dev: enabled=${result.enabled}`);
}

async function findAccessApp() {
  const apps = await api(`/accounts/${ACCOUNT_ID}/access/apps?per_page=100`);
  return apps.find(
    (app) =>
      app.domain === WEB_HOST ||
      app.self_hosted_domains?.includes(WEB_HOST) ||
      app.name === "Cobalt (lazee.workers.dev)" ||
      app.name === "cobalt-web - Production",
  );
}

async function createOrUpdateAccessApp() {
  const existing = await findAccessApp();
  if (existing) {
    console.log(`Access app exists: ${existing.name} (${existing.id}) aud=${existing.aud}`);
    return existing;
  }

  const app = await api(`/accounts/${ACCOUNT_ID}/access/apps`, {
    method: "POST",
    body: {
      name: "Cobalt (lazee.workers.dev)",
      domain: WEB_HOST,
      type: "self_hosted",
      session_duration: "24h",
      auto_redirect_to_identity: false,
      app_launcher_visible: false,
      policies: [
        {
          precedence: 1,
          decision: "allow",
          name: `Allow ${ALLOW_EMAIL}`,
          include: [{ email: { email: ALLOW_EMAIL } }],
        },
      ],
    },
  });
  console.log(`Created Access app: ${app.name} (${app.id}) aud=${app.aud}`);
  return app;
}

async function findServiceToken() {
  const tokens = await api(
    `/accounts/${ACCOUNT_ID}/access/service_tokens?per_page=50`,
  );
  return tokens.find((t) => t.name === SERVICE_TOKEN_NAME);
}

async function ensureServiceToken() {
  let token = await findServiceToken();
  if (!token) {
    token = await api(`/accounts/${ACCOUNT_ID}/access/service_tokens`, {
      method: "POST",
      body: { name: SERVICE_TOKEN_NAME },
    });
    console.log(`Created service token: ${token.name} (${token.id})`);
  } else {
    console.log(`Service token exists: ${token.name} (${token.id})`);
  }

  if (process.env.ROTATE_COBALT_SERVICE_TOKEN === "1") {
    const rotated = await api(
      `/accounts/${ACCOUNT_ID}/access/service_tokens/${token.id}/rotate`,
      { method: "POST", body: {} },
    );
    return {
      id: rotated.client_id ?? token.client_id,
      secret: rotated.client_secret,
      tokenId: token.id,
    };
  }

  return {
    id: token.client_id,
    secret: process.env.COBALT_ACCESS_CLIENT_SECRET ?? "(set ROTATE_COBALT_SERVICE_TOKEN=1 to rotate)",
    tokenId: token.id,
  };
}

async function addServiceAuthPolicy(appId, serviceTokenId) {
  const app = await api(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`);
  const hasServiceAuth = app.some((p) =>
    p.include?.some((r) => r.service_token?.token_id === serviceTokenId),
  );
  if (hasServiceAuth) {
    console.log("Service Auth policy already present on Access app");
    return;
  }

  await api(`/accounts/${ACCOUNT_ID}/access/apps/${appId}/policies`, {
    method: "POST",
    body: {
      decision: "non_identity",
      name: "Service Auth (sidebar-api)",
      include: [{ service_token: { token_id: serviceTokenId } }],
      precedence: 2,
    },
  });
  console.log("Added Service Auth policy for sidebar-api");
}

async function enableWorkersDevAccessToggle() {
  const result = await api(
    `/accounts/${ACCOUNT_ID}/workers/scripts/cobalt-web/subdomain`,
    {
      method: "POST",
      body: {
        enabled: true,
        previews_enabled: false,
        access_protected: true,
      },
    },
  );
  console.log(
    `cobalt-web workers.dev: enabled=${result.enabled} previews=${result.previews_enabled}`,
  );
}

async function main() {
  console.log(`Account: ${ACCOUNT_ID}`);
  console.log(`Host: https://${WEB_HOST}\n`);

  await lockDownApiWorker();
  const app = await createOrUpdateAccessApp();
  const service = await ensureServiceToken();
  await addServiceAuthPolicy(app.id, service.tokenId);
  await enableWorkersDevAccessToggle();

  console.log("\n--- Service token (store in Doppler / wrangler secrets) ---");
  console.log(`COBALT_ACCESS_CLIENT_ID=${service.id}`);
  console.log(`COBALT_ACCESS_CLIENT_SECRET=${service.secret}`);
  console.log(`COBALT_API_URL=https://${WEB_HOST}/api/`);
  console.log(`POLICY_AUD=${app.aud}`);
  console.log("\nVerify: private window → https://" + WEB_HOST + " → Access login");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
