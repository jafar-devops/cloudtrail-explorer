# CloudTrail Explorer Backend

This backend is a Node.js Express server that integrates with AWS S3. It handles credentials securely via a .env file and exposes endpoints for connecting to a bucket, fetching folders, and fetching events.

## Features
- AWS credentials managed via .env
- Uses @aws-sdk/client-s3 for S3 access
- REST API endpoints for frontend integration

## Setup
1. Create a `.env` file in the backend directory with:
   ```env
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=your-region
   BUCKET_NAME=your-bucket-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Endpoints
- `POST /connect` — Connect to S3 bucket
- `GET /folders?prefix=...` — List folders
- `GET /events?prefix=...&page=...&pageSize=...` — List events

## Notes
- Ensure your AWS credentials are valid and have S3 access.
- Replace placeholder values in `.env` with your actual credentials.
