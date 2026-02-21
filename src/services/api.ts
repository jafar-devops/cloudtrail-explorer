import { AppSettings, CloudTrailEvent, ConnectResponse, EventsResponse, FoldersResponse } from "@/types/cloudtrail";
import { generateMockEvents, generateMockFolders } from "./mockData";

const SETTINGS_KEY = "cloudtrail-settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw) as AppSettings;
    }
  } catch {
    // Ignore malformed local storage values and fall back to defaults.
  }

  return {
    apiUrl: "",
    bucketName: "",
    useMockData: true,
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function apiFetch<T>(settings: AppSettings, path: string, options?: RequestInit): Promise<T> {
  const baseUrl = settings.apiUrl.replace(/\/$/, "");
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function connectToBucket(settings: AppSettings): Promise<ConnectResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: "Connected to mock bucket successfully" };
  }

  return apiFetch<ConnectResponse>(settings, "/connect", {
    method: "POST",
    body: JSON.stringify({ mode: "local" }),
  });
}

export async function fetchFolders(settings: AppSettings, prefix: string): Promise<FoldersResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 300));
    return { folders: generateMockFolders(prefix) };
  }

  const normalizedPrefix = prefix === "/" ? "" : prefix;
  return apiFetch<FoldersResponse>(
    settings,
    `/folders?prefix=${encodeURIComponent(normalizedPrefix)}`
  );
}

function mapBackendEvent(record: Record<string, unknown>, index: number): CloudTrailEvent {
  const userIdentity = (record.userIdentity as Record<string, unknown> | undefined) ?? {};
  const sessionContext = (userIdentity.sessionContext as Record<string, unknown> | undefined) ?? {};
  const sessionIssuer = (sessionContext.sessionIssuer as Record<string, unknown> | undefined) ?? {};

  const username =
    (record.username as string | undefined) ||
    (record.userName as string | undefined) ||
    (userIdentity.userName as string | undefined) ||
    (sessionIssuer.userName as string | undefined) ||
    (userIdentity.arn as string | undefined) ||
    "unknown";

  const resources = Array.isArray(record.resources) ? (record.resources as Record<string, unknown>[]) : [];
  const firstResource = resources[0] ?? {};

  const readOnlyValue = record.readOnly;

  return {
    eventId:
      (record.eventId as string | undefined) ||
      (record.eventID as string | undefined) ||
      `evt-${index}`,
    eventTime: (record.eventTime as string | undefined) || new Date().toISOString(),
    eventName: (record.eventName as string | undefined) || "UnknownEvent",
    eventSource: (record.eventSource as string | undefined) || "unknown.amazonaws.com",
    username,
    accountId:
      (record.accountId as string | undefined) ||
      (record.recipientAccountId as string | undefined) ||
      (userIdentity.accountId as string | undefined) ||
      "unknown",
    awsRegion: (record.awsRegion as string | undefined) || "unknown",
    sourceIPAddress: (record.sourceIPAddress as string | undefined) || "unknown",
    resourceName:
      (record.resourceName as string | undefined) ||
      (firstResource.resourceName as string | undefined) ||
      ((record.requestParameters as Record<string, unknown> | undefined)?.bucketName as string | undefined) ||
      "-",
    resourceType:
      (record.resourceType as string | undefined) ||
      (firstResource.resourceType as string | undefined) ||
      "Unknown",
    readOnly: readOnlyValue === true || readOnlyValue === "true",
    errorCode: (record.errorCode as string | undefined) || undefined,
    errorMessage: (record.errorMessage as string | undefined) || undefined,
    rawEvent: (record.rawEvent as Record<string, unknown> | undefined) || record,
  };
}

export async function fetchEvents(
  settings: AppSettings,
  prefix: string,
  page: number,
  pageSize: number
): Promise<EventsResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 500));
    const { events, totalCount } = generateMockEvents(prefix, page, pageSize);
    return { events, totalCount, page, pageSize };
  }

  const normalizedPrefix = prefix === "/" ? "" : prefix;
  const response = await apiFetch<EventsResponse>(
    settings,
    `/events?prefix=${encodeURIComponent(normalizedPrefix)}&page=${page}&pageSize=${pageSize}`
  );

  return {
    ...response,
    events: response.events.map((event, index) => mapBackendEvent(event as unknown as Record<string, unknown>, index)),
  };
}
