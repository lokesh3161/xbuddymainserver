# XBuddy Shop Package — Onboarding & Operations Guide

Welcome to **XBuddy SaaS**! This package enables automated, instant shop onboarding with zero coding required.

---

## Quick Start (3-Minute Setup)

1. **Extract** the `XBuddy Shop Package.zip` folder on your shop computer.
2. **Double-click `START.bat`**.
3. **Setup Wizard**:
   - Enter your **Shop Name**, **Owner Name**, **Phone Number**, and **Email**.
   - Click **Sign in with Google & Copy Template** to duplicate the **XBuddy Master Template** into your Google Drive as `XBuddy - <Shop Name>`.
   - In your Google Sheet, click **Extensions → Apps Script → Deploy → New Deployment**.
   - Select **Web app**, set **Execute as: Me**, **Who has access: Anyone**, then click **Deploy**.
   - Copy your **Web App URL**, paste it into the Setup Wizard, and click **Verify & Connect**.
   - Select your connected **Printer**.
4. Click **Complete Setup**. The wizard will save your configuration and automatically start the **XBuddy Print Agent**.

---

## How It Works

```
Customer Web App
      │
      ▼
Google Apps Script (Web App URL)
      │
      ▼
Google Sheets Database (XBuddy - <Shop Name>)
      │
      ▼
XBuddy Print Agent (Runs in Background)
      │
      ▼
Thermal / Document Printer
```

---

## Directory Overview

- `START.bat`: One-click startup script.
- `install.bat`: Dependency installer script.
- `index.js`: Main print agent & setup launcher.
- `wizard/`: Interactive onboarding wizard.
- `config/`: Configuration folder (`shop-config.json`).
- `printer/`: Printer management utilities.
- `repositories/`: Data access repositories.
- `services/`: Core background services.
- `pending/`: Temporary storage for incoming print jobs.
- `printed/`: Archive of printed documents.
- `logs/`: Diagnostic system logs.

---

## Troubleshooting & Support

- **No Printer Detected**: Ensure your USB/Network printer is powered on and installed in Windows Settings before starting the wizard.
- **Web App Connection Error**: Verify that the Google Apps Script Web App access permission is set to **Anyone**.
- **Heartbeat & Status**: Check `logs/` for detailed operational logs.
