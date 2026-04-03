import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const MAX_MATCH_ID = 1000000;
const MAX_MATCHES = 10000;
const MAX_SUBSCRIPTIONS_PER_SOCKET = 100;

const matchSubscribers = new Map();

function subscribe(matchId, socket) {
  if (!Number.isSafeInteger(matchId) || matchId < 1 || matchId > MAX_MATCH_ID) {
    return false;
  }

  if (!(socket && socket.subscriptions instanceof Set)) {
    return false;
  }

  if (
    socket.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_SOCKET &&
    !socket.subscriptions.has(matchId)
  ) {
    return false;
  }

  if (!matchSubscribers.has(matchId)) {
    if (matchSubscribers.size >= MAX_MATCHES) {
      return false;
    }
    matchSubscribers.set(matchId, new Set());
  }

  matchSubscribers.get(matchId).add(socket);
  return true;
}

function unsubscribe(matchId, socket) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanupSubscription(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function handleMessage(socket, data) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendJson(socket, { type: "error", message: "Invalid json" });
  }

  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    const ok = subscribe(message.matchId, socket);
    if (!ok) {
      sendJson(socket, {
        type: "error",
        message:
          "Subscription rejected: invalid matchId or subscription limits reached",
      });
      return;
    }

    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }

  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
  }
}

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
}

export function attachWebsocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Rate limit exceeded"
            : "Access denied.";
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error("ws connection error", error);
        socket.close(1011, "Server security error");
        return;
      }
    }
    socket.isAlive = true;

    socket.subscriptions = new Set();

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => handleMessage(socket, data));

    socket.on("error", (err) => {
      console.error("WebSocket error", err);
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscription(socket);
    });

    socket.on("pong", () => {
      socket.isAlive = true;
    });
  });

  // Heartbeat to detect and remove stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000); // Check every 30 seconds

  // Clean up interval when server closes
  wss.on("close", () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match) {
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(matchId, comment) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  return { broadcastMatchCreated, broadcastCommentary, wss };
}
