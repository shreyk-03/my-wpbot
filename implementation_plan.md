# Implementation Plan: WhatsApp Collections Agent (Initial Milestone)

This plan details the implementation steps for building the project foundation and Excel upload system.

## 📋 Task List

### Phase 1: Project Setup & Package Initialization
- [x] Create parent directory `whatsapp-collections-agent/`
- [x] Initialize Node.js/Express backend in `backend/` and install:
  - `express`, `mongoose`, `cors`, `dotenv`, `multer`, `xlsx`, `nodemon`
- [x] Initialize React frontend with Vite in `frontend/` and install:
  - `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `axios`
- [x] Create basic `.env` configurations

### Phase 2: MongoDB Architecture & Schema setup
- [x] Create Mongoose schema for `Invoice` with fields:
  - `Customer` (String)
  - `SPOC` (String)
  - `Invoice No` (String, unique/indexed)
  - `Invoice Date` (Date)
  - `Due Date` (Date)
  - `Inv Amount` (Number)
  - `Received` (Number)
  - `Outstanding` (Number)

### Phase 3: Backend Business Services & Controllers
- [x] Setup Express `app.js` and `server.js` with DB connection and global middleware.
- [x] Setup `multer` middleware with limits (allow `xlsx` only, safe filename, file extension filter).
- [x] Create Excel parser service (`excelService.js`) using `xlsx` to parse sheets, format values, drop/replace collections in transactions or atomic insert.
- [x] Setup thin Upload Controller & Routes (`api/upload`).
- [x] Setup thin Read Controller & Routes (`api/invoices`) sorted by date descending.

### Phase 3.5: Ageing & Report Services (Business Logic Layer)
- [x] Create core Ageing classifier service (`ageingService.js`)
- [x] Implement weekly calendar dates calculation (`dateUtils.js`)
- [x] Build Weekly Payment Schedule aggregates (`paymentScheduleService.js`)
- [x] Create Daily Collection Schedule target values (`collectionService.js`)
- [x] Register API routes for payment & collection reports (`/api/reports/...`)

### Phase 4: Frontend Development
- [ ] Construct API client Layer in React using Axios (`src/services/api.js`).
- [ ] Build Material UI Theme Configuration and Design System.
- [ ] Structure modern, highly premium `UploadPage.jsx` containing:
  - Header / Hero Section
  - File Dropzone / Uploader card
  - Custom file picker Button
  - Upload submission handling
  - Linear Progress/Circular Loader
  - Success/Error Snackbars (alert notifications)
- [ ] Hook frontend components to Axios hooks, handling success state displaying `✓ Excel Uploaded Successfully` along with total imported rows count.

### Phase 5: Documentation & Verification
- [ ] Verify End-to-End upload capabilities.
- [ ] Write detailed `README.md` containing running instructions, folder mappings, API definitions, environment configuration keys, and Postman testing commands.
