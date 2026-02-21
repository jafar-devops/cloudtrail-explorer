

# CloudTrail Log Analyzer — Frontend Web App

## Overview
A modern, production-ready React frontend for browsing and analyzing AWS CloudTrail logs stored in S3. Designed to connect to your own backend API (Python/Node.js) via a configurable base URL. Ships with mock data so you can explore the UI immediately.

---

## Page 1: Settings / Connection Page
- Form to configure **Backend API URL**
- Pre-configured AWS credentials are managed server-side (your backend)
- **Bucket Name** input field
- "Connect" button that validates the connection by calling the backend
- Error handling for invalid URL or unreachable backend
- Settings stored in localStorage for persistence

## Page 2: Folder Explorer (Sidebar + Main Area)
- **Left sidebar** showing a collapsible tree of CloudTrail log folders:
  - Account ID → Region → Year → Month → Day
- Folders load dynamically as you expand them (lazy loading from your API)
- Clicking a **Day** folder loads all logs for that day
- Breadcrumb navigation showing current selection (Account > Region > Date)
- Top bar showing: Selected Account, Selected Date, Total Events Count

## Page 3: Log Event Table (Main View)
- **Table columns**: Event Time, Event Name, Event Source, Username, Account ID, Region, Source IP, Resource Name, Resource Type, Event ID, Read Only
- **Expandable rows** — click to reveal full JSON event details with syntax highlighting
- **Pagination**: 50 records per page with total count display
- **Sorting**: Click column headers to sort by Event Time, Username, Event Name
- **Global search bar**: Search across all visible fields instantly

## Left Sidebar Filters (persistent alongside table)
- **Text filters**: Event Name, Event Source, Username, Resource Name, Source IP
- **Date filter**: Calendar date picker + time range selector
- **Dropdown filters**: Resource Type, Account ID, Region
- **Boolean filters**: Read Only (Yes/No), Error Code Exists (Yes/No)
- All filters work together (combination-based), client-side, instant response
- "Clear all filters" button

## Export Feature
- Export button in the toolbar
- Export filtered results to **CSV** or **JSON**
- Downloads file to user's device

## Dashboard View
- Toggle between Table view and Dashboard view
- **Bar chart**: Event count by service
- **Pie chart**: Event count by user
- **Stat cards**: Total events, Failed events count, Most used API calls
- Uses Recharts (already installed)

## Design & UX
- Modern light SaaS design (clean white background, subtle blue accents)
- Responsive layout with collapsible sidebar
- Loading skeletons while data fetches
- Toast notifications for errors (invalid credentials, bucket not found, no logs, corrupted files)
- Proper empty states ("No logs found for this day")

## API Service Layer
- Centralized API service module with configurable base URL
- Mock data mode for development/demo
- Endpoints expected from your backend:
  - `GET /folders?prefix=...` — list folder structure
  - `GET /events?prefix=...&page=...&pageSize=...` — fetch parsed events
  - `POST /connect` — validate bucket connection
- Clean TypeScript interfaces for all API responses

## Error Handling
- Invalid/unreachable backend URL
- Bucket not found
- No logs found for selected day
- Network errors with retry option
- All errors shown as user-friendly toast messages

