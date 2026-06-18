import axios from "axios";
import { getToken, getUser } from "./tokenStorage";

const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://placements.bsms.ac.uk/api";
const authType = process.env.EXPO_PUBLIC_AUTH_TYPE ?? "bearer";

//process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.148:8000/api";
// Auth type: 'bearer' for Laravel Sanctum, 'token' for Django DRF
//const authType = process.env.EXPO_PUBLIC_AUTH_TYPE ?? "token";

//process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
//process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
//process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://0.0.0.0:8000/";

//process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/";
const axiosConfig = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const truncateText = (value: string, max = 500) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

const summarizeData = (value: unknown) => {
  if (value === undefined || value === null) return value;

  if (typeof value === "string") {
    return {
      type: "string",
      length: value.length,
      preview: truncateText(value, 140),
    };
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      preview: truncateText(JSON.stringify(value.slice(0, 3)), 200),
    };
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    return {
      type: "object",
      keys,
      keyCount: keys.length,
    };
  }

  return {
    type: typeof value,
    value,
  };
};

const nextRequestId = () => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}`;
};

const setHeader = (config: any, key: string, value: string | undefined) => {
  if (!value) return;

  if ((config.headers as any)?.set) {
    (config.headers as any).set(key, value);
    return;
  }

  config.headers = {
    ...(config.headers ?? {}),
    [key]: value,
  } as any;
};

const getHeaderValue = (headers: any, key: string) =>
  headers?.get?.(key) ?? headers?.[key];

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" ? (value as Record<string, unknown>) : {};
};

const firstDefinedString = (...values: unknown[]) => {
  const matched = values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );
  return matched === undefined || matched === null
    ? undefined
    : String(matched);
};

axiosConfig.interceptors.request.use(async (config) => {
  const dataRecord = toRecord(config.data);
  const paramsRecord = toRecord(config.params);
  const sessionId = firstDefinedString(
    dataRecord.session_id,
    dataRecord.sessionId,
    paramsRecord.session_id,
    paramsRecord.sessionId,
  );
  const bsmsId = firstDefinedString(
    dataRecord.bsms_id,
    dataRecord.bsmsId,
    paramsRecord.bsms_id,
    paramsRecord.bsmsId,
  );
  const sessionDate = firstDefinedString(
    dataRecord.session_date,
    dataRecord.sessionDate,
    paramsRecord.session_date,
    paramsRecord.sessionDate,
  );
  const localRequestId = firstDefinedString(
    dataRecord.local_id,
    dataRecord.localId,
    paramsRecord.local_id,
    paramsRecord.localId,
  );

  const meta = ((config as any).meta ?? {}) as Record<string, unknown>;
  const requestId = String(meta.requestId ?? localRequestId ?? nextRequestId());
  (config as any).meta = {
    ...meta,
    requestId,
    startedAt: Date.now(),
  };

  const [token, storedUser] = await Promise.all([getToken(), getUser()]);
  const userRecord = toRecord(storedUser);
  const userId = firstDefinedString(
    userRecord.id,
    userRecord.user_id,
    userRecord.bsms_id,
    userRecord.bsmsId,
    bsmsId,
  );
  const sessionMetadata = {
    session_id: sessionId,
    session_date: sessionDate,
    bsms_id: bsmsId,
  };
  const hasSessionMetadata = Object.values(sessionMetadata).some(
    (value) => value !== undefined,
  );

  if (token) {
    setHeader(config, "Authorization", getAuthHeader(token));
  }

  setHeader(config, "X-Request-ID", requestId);
  setHeader(config, "X-User-ID", userId);
  setHeader(config, "X-Session-ID", sessionId);
  setHeader(config, "X-Session-Date", sessionDate);
  setHeader(config, "X-BSMS-ID", bsmsId);
  setHeader(
    config,
    "X-Session-Metadata",
    hasSessionMetadata ? JSON.stringify(sessionMetadata) : undefined,
  );

  const fullUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;
  const outboundAuthorizationHeader = getHeaderValue(
    config.headers,
    "Authorization",
  );
  const outboundRequestId = getHeaderValue(config.headers, "X-Request-ID");
  const outboundUserId = getHeaderValue(config.headers, "X-User-ID");
  const outboundSessionId = getHeaderValue(config.headers, "X-Session-ID");
  const loggedHeaders = {
    ...(outboundAuthorizationHeader
      ? { Authorization: outboundAuthorizationHeader }
      : {}),
    ...(outboundRequestId ? { "X-Request-ID": outboundRequestId } : {}),
    ...(outboundUserId ? { "X-User-ID": outboundUserId } : {}),
    ...(outboundSessionId ? { "X-Session-ID": outboundSessionId } : {}),
  };

  console.log("[api]", config.method?.toUpperCase(), fullUrl, {
    requestId,
    headers: loggedHeaders,
    timeoutMs: config.timeout,
    params: summarizeData(config.params),
    data: summarizeData(config.data),
  });
  return config;
});

axiosConfig.interceptors.response.use(
  (response) => {
    const method = response?.config?.method?.toUpperCase?.() ?? "";
    const base = response?.config?.baseURL ?? "";
    const url = response?.config?.url ?? "";
    const fullUrl = `${base}${url}`;
    const startedAt = Number(
      (response?.config as any)?.meta?.startedAt ?? Date.now(),
    );
    const requestId = (response?.config as any)?.meta?.requestId ?? "unknown";
    const durationMs = Date.now() - startedAt;

    console.log("[api]", method, fullUrl, "->", response.status, {
      requestId,
      durationMs,
    });

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid");
    }

    const method = error?.config?.method?.toUpperCase?.() ?? "";
    const base = error?.config?.baseURL ?? "";
    const url = error?.config?.url ?? "";
    const fullUrl = `${base}${url}`;
    const startedAt = Number(error?.config?.meta?.startedAt ?? Date.now());
    const durationMs = Date.now() - startedAt;
    const requestId = error?.config?.meta?.requestId ?? "unknown";

    if (error?.response) {
      const backendRequestId =
        error.response.headers?.["x-request-id"] ??
        error.response.headers?.["x-correlation-id"];

      console.error(
        "[api:error]",
        `${method} ${fullUrl} -> ${error.response.status}`,
        { requestId, backendRequestId },
      );

      console.error("[api]", method, fullUrl, "->", error.response.status, {
        requestId,
        durationMs,
        backendRequestId,
        data: summarizeData(error.response.data),
      });
    } else {
      console.error(
        "[api]",
        method,
        fullUrl,
        "->",
        "NETWORK_ERROR",
        error?.message,
        {
          requestId,
          durationMs,
          code: error?.code,
          params: summarizeData(error?.config?.params),
          data: summarizeData(error?.config?.data),
        },
      );
    }

    return Promise.reject(error);
  },
);

export const getAuthHeader = (token: string) => {
  const prefix = authType === "bearer" ? "Bearer" : "Token";
  return `${prefix} ${token}`;
};

export default axiosConfig;
