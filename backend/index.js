const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const zlib = require('zlib');

const app = express();
app.use(cors());
app.use(express.json());

function sanitizePrefix(prefix) {
  const normalized = String(prefix || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    return '';
  }
  return normalized;
}

function toFsPath(basePath, prefix) {
  const parts = sanitizePrefix(prefix).split('/').filter(Boolean);
  return path.join(basePath, ...parts);
}

function inferType(parentPrefix, folderName) {
  const parts = sanitizePrefix(parentPrefix).split('/').filter(Boolean);

  if (/^\d{4}$/.test(folderName)) {
    return 'year';
  }

  if (/^\d{2}$/.test(folderName) && parts.length >= 1) {
    if (parts[parts.length - 1] && /^\d{4}$/.test(parts[parts.length - 1])) {
      return 'month';
    }

    if (parts.length >= 2 && /^\d{2}$/.test(parts[parts.length - 1]) && /^\d{4}$/.test(parts[parts.length - 2])) {
      return 'day';
    }
  }

  if (/^\d{12}$/.test(folderName)) {
    return 'account';
  }

  if (/^[a-z]{2}-[a-z]+-\d$/.test(folderName)) {
    return 'region';
  }

  return 'region';
}

function mapRecord(record, index) {
  const userIdentity = record.userIdentity || {};
  const sessionContext = userIdentity.sessionContext || {};
  const sessionIssuer = sessionContext.sessionIssuer || {};
  const resources = Array.isArray(record.resources) ? record.resources : [];
  const firstResource = resources[0] || {};

  return {
    eventId: record.eventID || `evt-${index}`,
    eventTime: record.eventTime || new Date().toISOString(),
    eventName: record.eventName || 'UnknownEvent',
    eventSource: record.eventSource || 'unknown.amazonaws.com',
    username:
      record.userName ||
      userIdentity.userName ||
      sessionIssuer.userName ||
      userIdentity.arn ||
      'unknown',
    accountId: record.recipientAccountId || userIdentity.accountId || 'unknown',
    awsRegion: record.awsRegion || 'unknown',
    sourceIPAddress: record.sourceIPAddress || 'unknown',
    resourceName:
      firstResource.resourceName ||
      (record.requestParameters && record.requestParameters.bucketName) ||
      '-',
    resourceType: firstResource.resourceType || 'Unknown',
    readOnly: Boolean(record.readOnly),
    errorCode: record.errorCode,
    errorMessage: record.errorMessage,
    rawEvent: record,
  };
}

app.post('/connect', async (req, res) => {
  try {
    const logPath = process.env.CLOUDTRAIL_LOG_PATH;

    if (!logPath) {
      return res.status(400).json({ success: false, message: 'CLOUDTRAIL_LOG_PATH is not configured' });
    }

    if (!fs.existsSync(logPath)) {
      return res.status(400).json({ success: false, message: `Local log path not found: ${logPath}` });
    }

    const stat = fs.statSync(logPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ success: false, message: `CLOUDTRAIL_LOG_PATH is not a directory: ${logPath}` });
    }

    return res.json({ success: true, message: `Connected to local CloudTrail path: ${logPath}` });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/folders', async (req, res) => {
  const logPath = process.env.CLOUDTRAIL_LOG_PATH;
  if (!logPath) {
    return res.status(500).json({ folders: [], error: 'CLOUDTRAIL_LOG_PATH is not configured' });
  }

  const prefix = sanitizePrefix(req.query.prefix);
  const dirPath = toFsPath(logPath, prefix);

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        prefix: prefix ? `${prefix}/${entry.name}/` : `${entry.name}/`,
        type: inferType(prefix, entry.name),
      }));

    return res.json({ folders });
  } catch (err) {
    return res.status(400).json({ folders: [], error: err.message });
  }
});

app.get('/events', async (req, res) => {
  const logPath = process.env.CLOUDTRAIL_LOG_PATH;
  if (!logPath) {
    return res.status(500).json({ events: [], totalCount: 0, page: 1, pageSize: 50, error: 'CLOUDTRAIL_LOG_PATH is not configured' });
  }

  const prefix = sanitizePrefix(req.query.prefix);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.max(Number(req.query.pageSize) || 50, 1);
  const dirPath = toFsPath(logPath, prefix);

  const records = [];

  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      if (!file.endsWith('.json') && !file.endsWith('.json.gz')) {
        return;
      }

      const filePath = path.join(dirPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      const content = file.endsWith('.gz')
        ? zlib.gunzipSync(fileBuffer).toString('utf-8')
        : fileBuffer.toString('utf-8');
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed.Records)) {
        records.push(...parsed.Records);
      }
    });

    records.sort((a, b) => String(b.eventTime || '').localeCompare(String(a.eventTime || '')));

    const totalCount = records.length;
    const start = (page - 1) * pageSize;
    const pagedEvents = records.slice(start, start + pageSize).map(mapRecord);

    return res.json({ events: pagedEvents, totalCount, page, pageSize });
  } catch (err) {
    return res.status(400).json({ events: [], totalCount: 0, page, pageSize, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
