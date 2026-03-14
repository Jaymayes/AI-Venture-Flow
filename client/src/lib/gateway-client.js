/**
 * gateway-client.js — WebSocket client for the Clawbot Gateway Dashboard.
 *
 * Phase 11: Zero-Trust Token Provisioning + WebSocket Connection.
 *
 * Connection flow:
 *   1. POST /api/auth/gateway-token → receives short-lived HS256 JWT (15 min)
 *   2. new WebSocket(wsUrl, ['maf-a2a-v1', jwtToken])
 *   3. Gateway DO verifies JWT signature, accepts upgrade, sends clawbot.json
 *
 * Message protocol:
 *   Client → DO:  { type: "ping" }                → { type: "pong", ts }
 *   Client → DO:  { type: "get_config" }           → { type: "config", data }
 *   Client → DO:  { type: "update_config", data }  → { type: "config_updated", data }
 *   DO → Client:  { type: "config", data }         (on connect + on peer update)
 *   DO → Client:  { type: "error", message }       (on error)
 *
 * Authorization: Bearer session JWT from auth-store (Phase 91).
 * WebSocket auth: JWT delivered via Sec-WebSocket-Protocol sub-protocol.
 */

import { getAuthToken } from './auth-store';

const BASE = import.meta.env.VITE_TRIAGE_API_BASE || "";

const MAF_PROTOCOL = "maf-a2a-v1";

/**
 * Fetch a short-lived gateway JWT from the token minter endpoint.
 * @returns {Promise<string>} Signed JWT string
 */
export async function fetchGatewayToken() {
  const res = await fetch(`${BASE}/api/auth/gateway-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken() || ""}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Token mint failed: ${res.status} ${text}`);
  }

  const { token } = await res.json();
  if (!token) throw new Error("Token mint returned empty token");
  return token;
}

/**
 * Create an authenticated WebSocket connection to the Gateway DO.
 *
 * Handles the full pre-flight flow:
 *   1. Mints a gateway JWT via POST /api/auth/gateway-token
 *   2. Opens WebSocket with ['maf-a2a-v1', jwt] sub-protocols
 *   3. Returns the connected WebSocket instance
 *
 * @param {Object} [options]
 * @param {function} [options.onConfig]  - Called with clawbot.json config data
 * @param {function} [options.onMessage] - Called with parsed message objects
 * @param {function} [options.onClose]   - Called on WebSocket close (code, reason)
 * @param {function} [options.onError]   - Called on WebSocket error
 * @param {number}   [options.pingInterval=30000] - Ping interval in ms (0 to disable)
 * @returns {Promise<{ ws: WebSocket, close: function }>}
 */
export async function connectGateway(options = {}) {
  const {
    onConfig,
    onMessage,
    onClose,
    onError,
    pingInterval = 30000,
  } = options;

  // Step 1: Mint JWT
  const jwt = await fetchGatewayToken();

  // Step 2: Derive WebSocket URL from HTTP base
  const wsBase = BASE.replace(/^http/, "ws");
  const wsUrl = `${wsBase}/ws/gateway`;

  // Step 3: Open WebSocket with protocol-based auth
  const ws = new WebSocket(wsUrl, [MAF_PROTOCOL, jwt]);

  let pingTimer = null;

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      // Start ping heartbeat
      if (pingInterval > 0) {
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, pingInterval);
      }

      resolve({
        ws,
        close: () => {
          if (pingTimer) clearInterval(pingTimer);
          ws.close(1000, "Client disconnect");
        },
        sendConfig: (data) => {
          ws.send(JSON.stringify({ type: "update_config", data }));
        },
        requestConfig: () => {
          ws.send(JSON.stringify({ type: "get_config" }));
        },
      });
    };

    ws.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      if (parsed.type === "config" || parsed.type === "config_updated") {
        onConfig?.(parsed.data);
      }

      onMessage?.(parsed);
    };

    ws.onclose = (event) => {
      if (pingTimer) clearInterval(pingTimer);
      onClose?.(event.code, event.reason);
      // Reject if we never opened
      reject(new Error(`WebSocket closed before open: ${event.code} ${event.reason}`));
    };

    ws.onerror = (event) => {
      onError?.(event);
      reject(new Error("WebSocket connection error"));
    };
  });
}
