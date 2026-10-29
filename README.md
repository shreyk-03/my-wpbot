# WhatsApp Collections Agent

An artificial intelligence-driven Accounts Receivable (AR) management module built on the MERN stack. The agent automates financial collections tracking by converting Excel spreadsheets into database-managed invoices, analyzing age-based debt buckets, displaying outstanding figures via a React UI, and serving payment schedule reports directly to clients over WhatsApp using Twilio Sandbox SMS APIs and Fuse.js fuzzy-matching queries.

---

## Features

### 📂 Excel Data Management
* **Excel Upload**: Single-file uploader component validating file constraints (`.xlsx`/`.xls` formats only).
* **Excel Parsing**: Dynamically parses the active sheet's rows using columns as arbitrary JSON objects. Does not require hardcoded schemas.
* **MongoDB Storage**: Stores parsed rows dynamically in MongoDB Atlas with `strict: false` mapping. If columns match the standard template, records auto-sync to the invoicing collection to update system reports.

### 📊 AR Dashboard
* **Dynamic Table Board**: Automatically extracts and maps database columns to screen grids.
* **Global Search Box**: Searches across customer fields and invoice numbers instantly with client-side reactive queries.
* **Ageing Buckets**: Generates age-based collections segments:
  * `Not Due`
  * `0-15 Days`
  * `16-30 Days`
  * `31-60 Days`
  * `61-90 Days`
  * `90+ Days`
* **Weekly Payment Schedule**: Aggregates target dues falling within the current calendar week (Monday to Friday) and outlines outstanding amounts.
* **Weekly Collection Follow-up**: Identifies debtor SPOC contacts, overdue accounts, and maps specific weekday collection targets (Monday to Friday).

### 💬 WhatsApp Integration
* **Natural Language Queries**: Interacts with users directly over SMS/sandbox messaging channels.
* **Twilio Webhook Parser**: Public endpoint consuming urlencoded Twilio notification payloads.
* **Fuzzy Customer Matching**: Implements `Fuse.js` fuzzy-matching indexes to resolve typos, abbreviations, or shorthand terms (e.g. mapping `Acme` or `acme pvt Ltd` to `Acme Corp`).
* **Dry-Run Mode Console**: Simulates WhatsApp message responses on the server terminal if Twilio API credentials are not active, enabling local testing.

---

## Tech Stack

### Frontend
* **Core Framework**: React (Vite environment)
* **Styling & Components**: Material UI (MUI v9)
* **HTTP Client**: Axios

### Backend
* **Environment**: Node.js
* **API Wrapper**: Express.js

### Database
* **Database Driver**: MongoDB Atlas (Cloud NoSQL)
* **Schema Wrapper**: Mongoose

### Libraries & Dependencies
* **Multer**: Multi-part binary uploader middleware
* **XLSX**: Binary spreadsheet worksheet parser
* **Fuse.js**: Fuzzy string search library
* **Twilio**: Twilio integration SDK
* **dotenv**: Environment variables configuration manager

---

## Project Structure

```text
whatsapp-collections-agent/
├── backend/
│   ├── config/             # DB Connectivity setup
│   ├── controllers/        # Express controllers endpoints
│   ├── middleware/         # Multer storage middleware
│   ├── models/             # Mongoose schemas (ExcelRecord, Invoice)
│   ├── routes/             # Route handler files
│   ├── services/           # Services (Ageing, Schedules, whatsappService, messageFormatter)
│   ├── uploads/            # Temporary disk storage area
│   ├── utils/              # Generic Excel conversion parser
│   ├── server.js           # Server entry point
│   ├── package.json        
│   └── .env.example        # Environment layout blueprint
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI widgets
│   │   ├── pages/          # Dashboard & Dynamic Explorer pages
│   │   ├── services/       # Axios API client hooks
│   │   ├── theme.js        # Theme configuration
│   │   ├── App.jsx         # App router and container tabs
│   │   └── main.jsx        
│   └── package.json
└── README.md               # Main instructions
```

---

## Installation

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **NPM** (v9.0.0 or higher)
* **MongoDB Atlas** Cloud Cluster

### Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-collections-agent
   ```

2. **Configure Backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Environment Variables

Create a `.env` file in the `backend/` directory by copying the `.env.example`:
```bash
cp backend/.env.example backend/.env
```

### Necessary Variables Guide
* `PORT`: Server Port listener (default: `5000`)
* `MONGODB_URI`: Cloud connection string for Atlas cluster MongoDB database.
* `TWILIO_ACCOUNT_SID`: API account SID from Twilio dashboard console.
* `TWILIO_AUTH_TOKEN`: API Auth token signature.
* `TWILIO_WHATSAPP`: Twilio assigned Sandbox WhatsApp sender phone number (`whatsapp:+14155238886`).
* `FRONTEND_URL`: Client-side address URL for CORS rules (`http://localhost:5173`).

### `.env.example` Blueprint

```ini
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whatsapp-collections
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP=whatsapp:+14155238886
FRONTEND_URL=http://localhost:5173
```

---

## Running the Application

### Launch Backend Server
From the `backend/` directory:
```bash
npm run dev
```
The console will log:
```text
🚀 Initializing WhatsApp Collections Agent Backend...
📡 MongoDB Connected: cluster.mongodb.net/whatsapp-collections
🌐 Server running in development mode on http://localhost:5000
```

### Launch Frontend Server
From the `frontend/` directory in a new terminal window:
```bash
npm run dev
```
The console will log:
```text
  VITE v8.1.3  ready in 349 ms
  ➜  Local:   http://localhost:5173/
```

Access the page on your browser: **[http://localhost:5173](http://localhost:5173)**

---

## API Endpoints

### 💾 File Ingestion
* **`POST /api/upload`**
  * Description: Accepts an Excel spreadsheet file, parses it dynamically, and stores details inside the target Mongo database.
  * Request Body: `multipart/form-data` with file key `file`.
  * Response Model:
    ```json
    {
      "success": true,
      "message": "Excel uploaded successfully",
      "recordsInserted": 500
    }
    ```

### 📄 Invoices Data
* **`GET /api/invoices`**
  * Description: Resolves sorted collections database invoices array.
  * Response Model:
    ```json
    {
      "success": true,
      "count": 500,
      "data": [ ... ]
    }
    ```

### 📋 Reports Engine
* **`GET /api/reports/payment/:customer`**
  * Description: Compiles overdue total, current-week payment targets, and detailed ageing breakdowns.
* **`GET /api/reports/collection/:customer`**
  * Description: Renders customer debtor SPOC, weekly schedule breakdowns (Mon-Fri) and daily collection targets.

### 💬 Webhook Gateway
* **`POST /api/whatsapp/webhook`**
  * Description: Twilio webhook notifications endpoint.
  * Request Body: `application/x-www-form-urlencoded` containing `Body` and `From`.

### 🩺 System Diagnostics
* **`GET /api/health`**
  * Description: Connection heartbeat test checking database readiness. Returns `200` when MongoDB is connected and `503` when it is unavailable, including `dbState` and `lastDbError` diagnostics.
  * Tip: append `?check=1` to trigger one background reconnect attempt.

---

## Testing

### **1. Upload Excel**
* Open the **Excel Explorer** tab on the React client.
* Select or drop your spreadsheet. Click **Upload File**.
* Verify a success message is displayed detailing the imported row count.

### **2. Search Invoices**
* Navigate to the **Accounts Receivable Board**.
* Use the search bar to query by Customer Name or Invoice Number. The grid updates reactively.

### **3. Test Bucket Filters**
* Click on age-based filter tabs (`Not Due`, `0-15`, `31-60`, etc.) to filter invoices dynamically.

### **4. Test Report APIs**
* Send a raw `GET` request using Postman or your browser:
  * Payment Schedule: `http://localhost:5000/api/reports/payment/Acme%20Corp`
  * Collection Follow-up: `http://localhost:5000/api/reports/collection/Acme%20Corp`

### **5. Test WhatsApp integration & Dry-Run Mode**
* If Twilio credentials are not set, a **Dry-Run mode** logs message responses directly in the terminal command window.
* Emulate Twilio webhook payloads using PowerShell:
  ```powershell
  Invoke-RestMethod -Method POST -Uri http://localhost:5000/api/whatsapp/webhook -Body @{
    Body = "Weekly payment schedule for Acme"
    From = "whatsapp:+919876543210"
  }
  ```
* Review the backend terminal console logs to verify the WhatsApp-formatted message was generated correctly.

---

## Error Handling

The application handles edge cases gracefully, responding with descriptive status alerts:

* **Customer Not Found**: If fuzzy lookup scores fall below the target limit, the webhook responds suggesting the closest matches in the database:
  > *❌ Customer "Microsoft" not found. Did you mean one of these: Acme Corp, Beta LLC?*
* **Missing Due Date**: Mapped correctly to the `Unknown` ageing bucket, avoiding date conversion exceptions.
* **Zero Outstanding balance**: Returns a helpful warning response:
  > *⚠️ Zero Outstanding Invoices: Customer "Beta LLC" has no unpaid outstanding balance.*
* **Invalid Excel / Corrupted formatting**: Multer and XLSX middleware catch and reject invalid payloads, returning `400 Bad Request` alerts.
* **Empty Upload**: Catches physical files with 0 bytes size and returns validation errors.
* **Invalid WhatsApp Request**: Returns intent warning cards to guide user requests:
  > *⚠️ Intent not recognized. Supported formats are: "Payment schedule for [Customer]" or "Collection follow-up for [Customer]"*

---

## Security

* **Secrets Isolation**: API tokens, mongodb passcodes, and twilio account SIDs are isolated inside `.env` configurations to prevent leakage of credentials.
* **Git Excludes**: The `.gitignore` file excludes `.env` variables from the repository, protecting production database secrets from being pushed to public GitHub logs.

---

## Future Improvements

1. **Active Twilio Request Verification**: Implement signature validation middleware (`twilio.webhook()`) in production to block spoofed webhook attacks.
2. **Context-Aware Dialogue (Conversation State)**: Keep users' target customer selections cached inside memory indexes so they don't have to specify target customer names in consecutive messages.
3. **Queue Slicing Ingestion**: Implement stream-based chunk processors to upload spreadsheets with over 100,000 invoices without risking server memory overflows.

---

## Screenshots

### 📊 Accounts Receivable Dashboard
![Accounts Receivable Board Placeholder](https://placehold.co/800x400/png?text=Accounts+Receivable+Board+UI+Mockup)

### 📂 Dynamic Excel Explorer Board
![Excel Explorer Board Placeholder](https://placehold.co/800x400/png?text=Dynamic+Excel+Explorer+UI+Mockup)

---

## License

Subject to the **[MIT License](LICENSE)** code terms.
