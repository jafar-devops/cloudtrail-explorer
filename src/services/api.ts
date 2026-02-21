import { AppSettings, ConnectResponse, EventsResponse, FoldersResponse } from "@/types/cloudtrail";
import { generateMockEvents, generateMockFolders } from "./mockData";

const SETTINGS_KEY = "cloudtrail-settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { apiUrl: "", bucketName: "", useMockData: true };
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function apiFetch<T>(settings: AppSettings, path: string, options?: RequestInit): Promise<T> {
  const url = `${settings.apiUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function connectToBucket(settings: AppSettings): Promise<ConnectResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: "Connected to mock bucket successfully" };
  }
  return apiFetch<ConnectResponse>(settings, "/connect", {
    method: "POST",
    body: JSON.stringify({ bucketName: settings.bucketName }),
  });
}

export async function fetchFolders(settings: AppSettings, prefix: string): Promise<FoldersResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 300));
    return { folders: generateMockFolders(prefix) };
  }
  return apiFetch<FoldersResponse>(settings, `/folders?prefix=${encodeURIComponent(prefix)}`);
}

export async function fetchEvents(settings: AppSettings, prefix: string, page: number, pageSize: number): Promise<EventsResponse> {
  if (settings.useMockData) {
    await new Promise((r) => setTimeout(r, 500));
    const { events, totalCount } = generateMockEvents(prefix, page, pageSize);
    return { events, totalCount, page, pageSize };
  }
  return apiFetch<EventsResponse>(settings, `/events?prefix=${encodeURIComponent(prefix)}&page=${page}&pageSize=${pageSize}`);
}
