/**
 * ==========================================================
 * XBuddy Master Registry — Serverless API Layer (Google Apps Script)
 * Bound to: "XBuddy-Master-Registry" Google Sheet
 * ==========================================================
 */

const APP = {
  NAME: "XBuddy Master Registry",
  VERSION: "1.0.0",
  CREATED_BY: "Creative Originals"
};

// =============================
// Sheet Names
// =============================

const SHEETS = {
  SHOPS: "Shops",
  SIGNUPS: "Pending Signups",
  REQUEST_LOGS: "Request Logs",
  DAILY_ROLLUPS: "Daily Rollups"
};

// =============================
// License Status
// =============================

const LICENSE_STATUS = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended"
};

// =============================
// Plans
// =============================

const PLANS = {
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise"
};

const SHOPS_SHEET_NAME    = SHEETS.SHOPS;
const SIGNUPS_SHEET_NAME  = SHEETS.SIGNUPS;
const ROLLUPS_SHEET_NAME  = SHEETS.DAILY_ROLLUPS;
const LOGS_SHEET_NAME     = SHEETS.REQUEST_LOGS;

function doGet(e) {
  try {
    const p = e ? (e.parameter || {}) : {};
    return handleMasterRequest(p);
  } catch (err) {
    return sendResponse(false, null, err.toString());
  }
}

function doPost(e) {
  try {
    let p = e ? (e.parameter || {}) : {};
    if (e && e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        p = Object.assign({}, p, body);
      } catch (err) {}
    }
    return handleMasterRequest(p);
  } catch (err) {
    return sendResponse(false, null, err.toString());
  }
}

function handleMasterRequest(p) {
  const action = p.action || '';

  if (action === 'registerCustomer')   return registerCustomer(p);
  if (action === 'getPendingSignups')  return getPendingSignups();
  if (action === 'validateLicense')    return validateLicense(p);
  if (action === 'provisionShop')      return provisionShop(p);
  if (action === 'registerShop')       return provisionShop(p); // Alias
  if (action === 'createShop')         return provisionShop(p); // Alias
  if (action === 'getShop')            return getShop(p);
  if (action === 'listShops')           return listShops();
  if (action === 'updateShopStatus')  return updateShopStatus(p);
  if (action === 'postHeartbeat' || action === 'heartbeat') return postHeartbeat(p);
  if (action === 'postRollup' || action === 'rollup')       return postRollup(p);
  if (action === 'getAggregateStats')  return getAggregateStats();

  return sendResponse(true, { message: "XBuddy Master Registry API is live!" }, null);
}

// --- SHEET GETTERS WITH AUTO-INITIALIZATION ---

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, headers) {
  const ss = getSS();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

function getShopsSheet() {
  return getOrCreateSheet(SHOPS_SHEET_NAME, [
    "Shop ID", "License Key", "Shop Name", "Owner Name", "Phone", "Email",
    "Google Sheet ID", "Google Apps Script URL", "Subscription Plan", 
    "License Status", "Activation Date", "Expiry Date", "Last Heartbeat", 
    "Current Version", "Provisioned Date", "Provisioned By"
  ]);
}

function getSignupsSheet() {
  return getOrCreateSheet(SIGNUPS_SHEET_NAME, [
    "Signup ID", "Shop Name", "Owner Name", "Phone", "Email", "Hashed Password", "Status", "Created Date"
  ]);
}

function getRollupsSheet() {
  return getOrCreateSheet(ROLLUPS_SHEET_NAME, [
    "Shop ID", "Date", "Orders", "Revenue", "Timestamp"
  ]);
}

function getLogsSheet() {
  return getOrCreateSheet(LOGS_SHEET_NAME, [
    "Timestamp", "Source Identifier", "Action", "Status"
  ]);
}

// --- API ACTIONS ---

function registerCustomer(p) {
  const shopName  = (p.shopName || '').trim();
  const ownerName = (p.ownerName || '').trim();
  const phone     = (p.phone || '').trim();
  const email     = (p.email || '').trim();
  const hashedPassword = (p.password || p.hashedPassword || '').trim();

  if (!shopName || !ownerName || !email || !hashedPassword) {
    return sendResponse(false, null, "Shop Name, Owner Name, Email, and Password are required.");
  }

  const sheet = getSignupsSheet();
  const data = sheet.getDataRange().getValues();

  // Check if Email already registered
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][4] || '').toLowerCase() === email.toLowerCase()) {
      return sendResponse(false, null, "An account with this email already exists.");
    }
  }

  const signupId = "SIGNUP-" + Date.now();
  const createdDate = new Date().toISOString();

  sheet.appendRow([
    signupId, shopName, ownerName, phone, email, hashedPassword, "Pending Setup", createdDate
  ]);

  logRequest(email, 'registerCustomer', 'SUCCESS');

  return sendResponse(true, {
    signupId: signupId,
    shopName: shopName,
    ownerName: ownerName,
    email: email,
    status: "Pending Setup",
    createdDate: createdDate
  }, null);
}

function getPendingSignups() {
  const sheet = getSignupsSheet();
  const data = sheet.getDataRange().getValues();
  const signups = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[6] || '').trim() === "Pending Setup") {
      signups.push({
        signupId: String(row[0]),
        shopName: String(row[1] || ''),
        ownerName: String(row[2] || ''),
        phone: String(row[3] || ''),
        email: String(row[4] || ''),
        status: String(row[6] || 'Pending Setup'),
        createdDate: row[7] ? String(row[7]) : ''
      });
    }
  }

  return sendResponse(true, { signups: signups }, null);
}

function validateLicense(p) {
  const shopId     = (p.shopId || p.shop_id || '').trim();
  const licenseKey = (p.licenseKey || p.license_key || '').trim();
  const sourceId   = (p.sourceId || shopId || 'anonymous').trim();

  // Generic anti-enumeration error response
  const genericError = "Invalid Shop ID or License Key";

  if (!shopId || !licenseKey) {
    logRequest(sourceId, 'validateLicense', 'FAILED_MISSING_INPUT');
    return sendResponse(false, null, genericError);
  }

  // Rate Limiting Check: Maximum 10 validation attempts per source in 5 minutes
  if (isRateLimited(sourceId)) {
    logRequest(sourceId, 'validateLicense', 'BLOCKED_RATE_LIMIT');
    return sendResponse(false, null, "Too many validation attempts. Please try again later.");
  }

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId  = String(row[0] || '').trim();
    const lKey = String(row[1] || '').trim();

    if (sId.toLowerCase() === shopId.toLowerCase()) {
      if (lKey !== licenseKey) {
        logRequest(sourceId, 'validateLicense', 'FAILED_MISMATCH');
        return sendResponse(false, null, genericError);
      }

      let status = String(row[9] || 'Trial').trim().toLowerCase();
      const expiryDateStr = row[11] ? String(row[11]) : '';
      
      if (expiryDateStr && status !== 'suspended') {
        const expiryDate = new Date(expiryDateStr);
        if (!isNaN(expiryDate.getTime()) && new Date() > expiryDate) {
          status = 'expired';
          sheet.getRange(i + 1, 10).setValue('Expired');
        }
      }

      if (status === 'suspended') {
        logRequest(sourceId, 'validateLicense', 'SUSPENDED');
        return sendResponse(false, null, "Shop subscription is suspended");
      }
      if (status === 'expired') {
        logRequest(sourceId, 'validateLicense', 'EXPIRED');
        return sendResponse(false, null, "Shop subscription has expired");
      }

      logRequest(sourceId, 'validateLicense', 'SUCCESS');

      return sendResponse(true, {
        valid: true,
        shopName: row[2] || '',
        plan: row[8] || 'Standard',
        status: status,
        sheetId: row[6] || '',
        gasUrl: row[7] || '',
        pricing: {
          bwPrice: 2.00,
          colorPrice: 10.00,
          a3Extra: 5.00,
          currency: 'INR'
        },
        licenseValidUntil: expiryDateStr,
        heartbeatInterval: 300,
        // Backward compatibility properties
        licenseStatus: status,
        shopId: sId,
        ownerName: row[3] || '',
        expiryDate: expiryDateStr
      }, null);
    }
  }

  logRequest(sourceId, 'validateLicense', 'FAILED_NOT_FOUND');
  return sendResponse(false, null, genericError);
}

function provisionShop(p) {
  let shopId          = (p.shopId || p.shop_id || '').trim();
  let licenseKey      = (p.licenseKey || p.license_key || '').trim();
  const shopName      = p.shopName || 'Xerox Shop';
  const ownerName     = p.ownerName || 'Owner';
  const phone         = p.phone || '';
  const email         = p.email || '';
  const sheetId       = p.sheetId || p.spreadsheetId || '';
  const gasUrl        = p.gasUrl || '';
  const plan          = p.plan || p.subscriptionPlan || 'Standard';
  const status        = p.status || p.licenseStatus || 'Active';
  const expiryDays    = parseInt(p.expiryDays || '30', 10);
  const provisionedBy = p.provisionedBy || 'Founder Admin';

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  if (!shopId) {
    let maxNum = 0;
    for (let i = 1; i < data.length; i++) {
      const match = String(data[i][0] || '').match(/SHOP(\d+)/i);
      if (match && match[1]) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    }
    shopId = "SHOP" + String(maxNum + 1).padStart(4, '0');
  }

  if (!licenseKey) {
    licenseKey = generateLicenseKey();
  }

  // Check if shopId already exists -> update existing record
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === shopId.toLowerCase()) {
      sheet.getRange(i + 1, 2).setValue(licenseKey);
      sheet.getRange(i + 1, 3).setValue(shopName);
      sheet.getRange(i + 1, 7).setValue(sheetId);
      sheet.getRange(i + 1, 8).setValue(gasUrl);
      sheet.getRange(i + 1, 10).setValue(status);
      const updatedShop = {
        shopId: shopId,
        licenseKey: licenseKey,
        shopName: shopName,
        ownerName: ownerName,
        phone: phone,
        email: email,
        sheetId: sheetId,
        gasUrl: gasUrl,
        plan: plan,
        status: status
      };
      return sendResponse(true, { shop: updatedShop, shopId: shopId, licenseKey: licenseKey, status: status }, null);
    }
  }

  const now = new Date();
  const activationDate = now.toISOString().split('T')[0];
  const expiryDateObj  = new Date(now.getTime() + (expiryDays * 86400000));
  const expiryDate     = expiryDateObj.toISOString().split('T')[0];
  const provisionedDate = now.toISOString();

  sheet.appendRow([
    shopId,
    licenseKey,
    shopName,
    ownerName,
    phone,
    email,
    sheetId,
    gasUrl,
    plan,
    status,
    activationDate,
    expiryDate,
    now.toISOString(),
    "1.0.0",
    provisionedDate,
    provisionedBy
  ]);

  // Update Signup Status to Provisioned if matching Email exists
  if (email) {
    const signupSheet = getSignupsSheet();
    const sData = signupSheet.getDataRange().getValues();
    for (let i = 1; i < sData.length; i++) {
      if (String(sData[i][4] || '').toLowerCase() === email.toLowerCase()) {
        signupSheet.getRange(i + 1, 7).setValue("Provisioned");
        break;
      }
    }
  }

  logRequest(provisionedBy, 'provisionShop', 'SUCCESS');

  return sendResponse(true, {
    shop: {
      shopId: shopId,
      licenseKey: licenseKey,
      shopName: shopName,
      ownerName: ownerName,
      phone: phone,
      email: email,
      sheetId: sheetId,
      gasUrl: gasUrl,
      plan: plan,
      status: status,
      activationDate: activationDate,
      expiryDate: expiryDate,
      provisionedDate: provisionedDate,
      provisionedBy: provisionedBy
    }
  }, null);
}

function getShop(p) {
  const shopId = (p.shopId || p.shop_id || '').trim();
  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0] || '').trim().toLowerCase() === shopId.toLowerCase()) {
      return sendResponse(true, {
        shop: mapShopRow(row)
      }, null);
    }
  }
  return sendResponse(false, null, "Shop not found");
}

function listShops() {
  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();
  const shops = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    shops.push(mapShopRow(row));
  }

  return sendResponse(true, { shops: shops }, null);
}

function updateShopStatus(p) {
  const shopId = (p.shopId || p.shop_id || '').trim();
  const newStatus = (p.status || '').trim();

  if (!shopId || !newStatus) {
    return sendResponse(false, null, "Missing shopId or status");
  }

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === shopId.toLowerCase()) {
      sheet.getRange(i + 1, 10).setValue(newStatus);
      return sendResponse(true, { shopId: shopId, status: newStatus }, null);
    }
  }

  return sendResponse(false, null, "Shop ID not found");
}

function postHeartbeat(p) {
  const shopId = (p.shopId || p.shop_id || '').trim();
  const printerStatus = p.printerStatus || 'online';
  const currentVersion = p.currentVersion || '1.0.0';
  const pendingJobs = parseInt(p.pendingJobs || '0', 10);

  if (!shopId) return sendResponse(false, null, "Missing shopId");

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();
  const nowStr = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === shopId.toLowerCase()) {
      sheet.getRange(i + 1, 13).setValue(nowStr);
      sheet.getRange(i + 1, 14).setValue(currentVersion);
      logRequest(shopId, 'postHeartbeat', 'Printer: ' + printerStatus + ', Pending: ' + pendingJobs);
      return sendResponse(true, {
        lastHeartbeat: nowStr,
        currentVersion: currentVersion,
        printerStatus: printerStatus,
        pendingJobs: pendingJobs
      }, null);
    }
  }

  return sendResponse(false, null, "Shop not found");
}

function postRollup(p) {
  const shopId = (p.shopId || p.shop_id || '').trim();
  const dateStr = p.date || new Date().toISOString().split('T')[0];
  const orderCount = parseInt(p.orderCount || '0', 10);
  const totalRevenue = parseFloat(p.totalRevenue || '0');

  if (!shopId) return sendResponse(false, null, "Missing shopId");

  const sheet = getRollupsSheet();
  sheet.appendRow([shopId, dateStr, orderCount, totalRevenue, new Date().toISOString()]);

  return sendResponse(true, { shopId: shopId, date: dateStr, orderCount: orderCount, totalRevenue: totalRevenue }, null);
}

function getAggregateStats() {
  const rollupsSheet = getRollupsSheet();
  const rData = rollupsSheet.getDataRange().getValues();

  const todayStr = new Date().toISOString().split('T')[0];
  let todayOrders = 0;
  let todayRevenue = 0;

  for (let i = 1; i < rData.length; i++) {
    const rowDate = String(rData[i][1] || '');
    if (rowDate === todayStr) {
      todayOrders += parseInt(rData[i][2] || '0', 10);
      todayRevenue += parseFloat(rData[i][3] || '0');
    }
  }

  const shopsSheet = getShopsSheet();
  const totalShops = Math.max(0, shopsSheet.getLastRow() - 1);

  return sendResponse(true, {
    totalShops: totalShops,
    todayOrders: todayOrders,
    todayRevenue: todayRevenue,
    date: todayStr
  }, null);
}

// --- HELPER & RATE LIMITING FUNCTIONS ---

function mapShopRow(row) {
  return {
    shopId:          String(row[0] || ''),
    licenseKey:      String(row[1] || ''),
    shopName:        String(row[2] || ''),
    ownerName:       String(row[3] || ''),
    phone:           String(row[4] || ''),
    email:           String(row[5] || ''),
    sheetId:         String(row[6] || ''),
    gasUrl:          String(row[7] || ''),
    subscriptionPlan: String(row[8] || 'Standard'),
    plan:            String(row[8] || 'Standard'),
    licenseStatus:   String(row[9] || 'Active'),
    status:          String(row[9] || 'Active'),
    activationDate:  row[10] ? String(row[10]) : '',
    expiryDate:      row[11] ? String(row[11]) : '',
    lastHeartbeat:   row[12] ? String(row[12]) : '',
    lastSeen:        row[12] ? String(row[12]) : '',
    currentVersion:  String(row[13] || '1.0.0'),
    provisionedDate: row[14] ? String(row[14]) : '',
    provisionedBy:   String(row[15] || 'Founder Admin')
  };
}

function logRequest(sourceId, action, status) {
  try {
    const sheet = getLogsSheet();
    sheet.appendRow([new Date().toISOString(), sourceId, action, status]);
  } catch (e) {}
}

function isRateLimited(sourceId) {
  try {
    const sheet = getLogsSheet();
    const data = sheet.getDataRange().getValues();
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    let attempts = 0;

    for (let i = data.length - 1; i >= 1; i--) {
      const timeStr = data[i][0];
      const src = data[i][1];
      const logTime = new Date(timeStr);
      if (logTime < cutoff) break;
      if (src === sourceId) {
        attempts++;
        if (attempts >= 10) return true;
      }
    }
  } catch (e) {}
  return false;
}

function sendResponse(success, data, errorMsg) {
  const res = {
    success: success,
    data: data,
    error: errorMsg
  };
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key) && !Object.prototype.hasOwnProperty.call(res, key)) {
        res[key] = data[key];
      }
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
