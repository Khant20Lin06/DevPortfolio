import { io } from "socket.io-client";
import { API_BASE_URL } from "./apiBase";
import { getAuthToken } from "./authApi";
import { getDeviceId } from "./deviceId";
import { getGuestId } from "./guestId";

let socketInstance = null;
let socketIdentity = "";
const IS_DEV = process.env.NODE_ENV !== "production";

const buildSocketIdentity = ({ token, guestId, deviceId }) => {
  if (token) {
    return `token:${token}|device:${deviceId}`;
  }
  return `guest:${guestId}|device:${deviceId}`;
};

export const connectRealtime = () => {
  if (!API_BASE_URL) return null;

  const token = getAuthToken();
  const deviceId = getDeviceId();
  const guestId = !token ? getGuestId() : "";
  const nextIdentity = buildSocketIdentity({ token, guestId, deviceId });

  if (socketInstance && socketIdentity === nextIdentity) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
    timeout: 10000,
    auth: token
      ? { token, deviceId }
      : guestId
        ? { guestId, deviceId }
        : { deviceId },
  });

  if (IS_DEV) {
    socketInstance.on("connect", () => {
      console.info("[realtime] connected", {
        socketId: socketInstance?.id,
        transport: socketInstance?.io?.engine?.transport?.name,
      });
    });
    socketInstance.on("disconnect", (reason) => {
      console.info("[realtime] disconnected", { reason });
    });
    socketInstance.on("connect_error", (error) => {
      console.warn("[realtime] connect_error", {
        message: error?.message ?? "unknown",
      });
    });
    socketInstance.io.on("reconnect_attempt", (attempt) => {
      console.info("[realtime] reconnect_attempt", { attempt });
    });
  }

  socketIdentity = nextIdentity;

  return socketInstance;
};

export const getRealtimeSocket = () => socketInstance;

export const disconnectRealtime = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
  socketIdentity = "";
};
