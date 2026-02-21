import { CloudTrailEvent, FolderNode } from "@/types/cloudtrail";

const services = ["sts.amazonaws.com", "s3.amazonaws.com", "ec2.amazonaws.com", "iam.amazonaws.com", "lambda.amazonaws.com", "dynamodb.amazonaws.com", "cloudformation.amazonaws.com", "kms.amazonaws.com"];
const eventNames = ["AssumeRole", "GetObject", "PutObject", "DescribeInstances", "CreateFunction", "ListBuckets", "GetPolicy", "Decrypt", "RunInstances", "DeleteObject", "CreateStack", "PutItem", "GetItem", "ListFunctions", "DescribeKey"];
const users = ["admin", "deploy-bot", "jane.doe", "john.smith", "ci-runner", "lambda-exec", "root"];
const regions = ["us-east-1", "eu-west-1", "ap-southeast-1"];
const ips = ["203.0.113.50", "198.51.100.22", "192.0.2.100", "10.0.0.1", "172.16.0.5"];
const resourceTypes = ["AWS::S3::Bucket", "AWS::EC2::Instance", "AWS::IAM::Role", "AWS::Lambda::Function", "AWS::DynamoDB::Table", "AWS::KMS::Key"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent(i: number, day: string): CloudTrailEvent {
  const hasError = Math.random() < 0.08;
  const source = rand(services);
  return {
    eventId: `evt-${day.replace(/-/g, "")}-${String(i).padStart(4, "0")}`,
    eventTime: `${day}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}Z`,
    eventName: rand(eventNames),
    eventSource: source,
    username: rand(users),
    accountId: "059731868388",
    awsRegion: rand(regions),
    sourceIPAddress: rand(ips),
    resourceName: `${source.split(".")[0]}-resource-${Math.floor(Math.random() * 100)}`,
    resourceType: rand(resourceTypes),
    readOnly: Math.random() > 0.4,
    errorCode: hasError ? "AccessDenied" : undefined,
    errorMessage: hasError ? "User is not authorized to perform this action" : undefined,
    rawEvent: {
      eventVersion: "1.08",
      userIdentity: { type: "IAMUser", arn: `arn:aws:iam::059731868388:user/${rand(users)}` },
      eventSource: source,
      eventName: rand(eventNames),
      requestParameters: { key: "value" },
      responseElements: hasError ? null : { result: "success" },
    },
  };
}

export function generateMockEvents(prefix: string, page: number, pageSize: number): { events: CloudTrailEvent[]; totalCount: number } {
  const parts = prefix.split("/").filter(Boolean);
  const day = parts.length >= 5 ? `${parts[2]}-${parts[3]}-${parts[4]}` : "2025-11-09";
  const totalCount = 237;
  const events: CloudTrailEvent[] = [];
  const start = (page - 1) * pageSize;
  for (let i = start; i < Math.min(start + pageSize, totalCount); i++) {
    events.push(generateEvent(i, day));
  }
  events.sort((a, b) => b.eventTime.localeCompare(a.eventTime));
  return { events, totalCount };
}

export function generateMockFolders(prefix: string): FolderNode[] {
  if (!prefix || prefix === "/") {
    return [{ name: "059731868388", prefix: "AWSLogs/059731868388/CloudTrail/", type: "account" }];
  }
  const parts = prefix.split("/").filter(Boolean);
  if (parts.length === 3) {
    return regions.map((r) => ({ name: r, prefix: `${prefix}${r}/`, type: "region" as const }));
  }
  if (parts.length === 4) {
    return ["2024", "2025"].map((y) => ({ name: y, prefix: `${prefix}${y}/`, type: "year" as const }));
  }
  if (parts.length === 5) {
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, "0");
      return { name: m, prefix: `${prefix}${m}/`, type: "month" as const };
    });
  }
  if (parts.length === 6) {
    const daysInMonth = 28;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return { name: d, prefix: `${prefix}${d}/`, type: "day" as const };
    });
  }
  return [];
}
