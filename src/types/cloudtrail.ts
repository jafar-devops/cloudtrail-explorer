export interface CloudTrailEvent {
  eventId: string;
  eventTime: string;
  eventName: string;
  eventSource: string;
  username: string;
  accountId: string;
  awsRegion: string;
  sourceIPAddress: string;
  resourceName: string;
  resourceType: string;
  readOnly: boolean;
  errorCode?: string;
  errorMessage?: string;
  rawEvent: Record<string, unknown>;
}

export interface FolderNode {
  name: string;
  prefix: string;
  type: "account" | "region" | "year" | "month" | "day";
  children?: FolderNode[];
  isLoaded?: boolean;
}

export interface EventsResponse {
  events: CloudTrailEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FoldersResponse {
  folders: FolderNode[];
}

export interface ConnectRequest {
  bucketName: string;
}

export interface ConnectResponse {
  success: boolean;
  message: string;
}

export interface AppSettings {
  apiUrl: string;
  bucketName: string;
  useMockData: boolean;
}

export type SortField = "eventTime" | "username" | "eventName";
export type SortDirection = "asc" | "desc";

export interface Filters {
  eventName: string;
  eventSource: string;
  username: string;
  resourceName: string;
  sourceIP: string;
  resourceType: string;
  accountId: string;
  region: string;
  readOnly: "all" | "yes" | "no";
  errorExists: "all" | "yes" | "no";
  dateFrom?: Date;
  dateTo?: Date;
}

export const emptyFilters: Filters = {
  eventName: "",
  eventSource: "",
  username: "",
  resourceName: "",
  sourceIP: "",
  resourceType: "",
  accountId: "",
  region: "",
  readOnly: "all",
  errorExists: "all",
};
