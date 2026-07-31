/**
 * XBuddy Master Registry — Serverless API Layer (Google Apps Script)
 * Bound to: "XBuddy-Master-Registry" Google Sheet
 * 
 * Section 3 & Section 6 Standardized API Implementation
 */

const SHOPS_SHEET_NAME   = "Shops";
const ROLLUPS_SHEET_NAME = "Rollups";

function doGet(e) {
  try {
    const p = e ? (e.parameter || {}) : {};
    const action = p.action;
    if (action === 'validateLicense')  return validateLicense(p);
    if (action === 'getShop')           return getShop(p);
    if (action === 'listShops')          return listShops();
    if (action === 'updateShopStatus') return updateShopStatus(p);
    if (action === 'createShop')        return createShop(p);
    if (action === 'postHeartbeat')     return postHeartbeat(p);
    if (action === 'postRollup')        return postRollup(p);
    if (action === 'getAggregateStats') return getAggregateStats();

    return sendResponse(true, { message: "XBuddy Master Registry API is live!" }, null);
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
    const action = p.action;
    if (action === 'validateLicense')  return validateLicense(p);
    if (action === 'updateShopStatus') return updateShopStatus(p);
    if (action === 'createShop')        return createShop(p);
    if (action === 'postHeartbeat')     return postHeartbeat(p);
    if (action === 'postRollup')        return postRollup(p);

    return sendResponse(true, { message: "POST received" }, null);
  } catch (err) {
    return sendResponse(false, null, err.toString());
  }
}

function getShopsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHOPS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHOPS_SHEET_NAME);
    sheet.appendRow([
      "shop_id", "shop_name", "owner_name", "phone",
      "spreadsheet_id", "drive_folder_id", "gas_url",
      "license_key", "status", "created_date", "expiry_date", "last_seen"
    ]);
  }
  return sheet;
}

function getRollupsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ROLLUPS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ROLLUPS_SHEET_NAME);
    sheet.appendRow(["shop_id", "date", "order_count", "total_revenue", "timestamp"]);
  }
  return sheet;
}

function validateLicense(p) {
  const shopId = (p.shopId || p.shop_id || "").trim();
  const licenseKey = (p.licenseKey || p.license_key || "").trim();

  if (!shopId || !licenseKey) {
    return sendResponse(false, null, "Missing shopId or licenseKey");
  }

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = String(row[0] || "").trim();
    const lKey = String(row[7] || "").trim();

    if (sId.toLowerCase() === shopId.toLowerCase()) {
      if (lKey !== licenseKey) {
        return sendResponse(true, { valid: false, status: "invalid", message: "License key mismatch" }, null);
      }

      let status = String(row[8] || "trial").trim().toLowerCase();
      const expiryDateStr = row[10] ? String(row[10]) : "";
      
      if (expiryDateStr && status !== "suspended") {
        const expiryDate = new Date(expiryDateStr);
        if (!isNaN(expiryDate.getTime()) && new Date() > expiryDate) {
          status = "expired";
          sheet.getRange(i + 1, 9).setValue("expired");
        }
      }

      if (status === "suspended") {
        return sendResponse(true, { valid: false, status: "suspended", message: "Shop subscription is suspended" }, null);
      }
      if (status === "expired") {
        return sendResponse(true, { valid: false, status: "expired", message: "Shop subscription has expired" }, null);
      }

      return sendResponse(true, {
        valid: true,
        status: status,
        shopId: sId,
        shopName: row[1] || "",
        expiryDate: expiryDateStr,
        lastSeen: row[11] || ""
      }, null);
    }
  }

  return sendResponse(true, { valid: false, status: "not_found", message: "Shop ID not registered" }, null);
}

function getShop(p) {
  const shopId = (p.shopId || p.shop_id || "").trim();
  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0] || "").trim().toLowerCase() === shopId.toLowerCase()) {
      return sendResponse(true, {
        shop: {
          shopId: row[0],
          shopName: row[1],
          ownerName: row[2],
          phone: row[3],
          spreadsheetId: row[4],
          driveFolderId: row[5],
          gasUrl: row[6],
          licenseKey: row[7],
          status: row[8],
          createdDate: row[9],
          expiryDate: row[10],
          lastSeen: row[11]
        }
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
    shops.push({
      shopId: String(row[0]),
      shopName: String(row[1] || ""),
      ownerName: String(row[2] || ""),
      phone: String(row[3] || ""),
      spreadsheetId: String(row[4] || ""),
      driveFolderId: String(row[5] || ""),
      gasUrl: String(row[6] || ""),
      licenseKey: String(row[7] || ""),
      status: String(row[8] || "trial"),
      createdDate: row[9] ? String(row[9]) : "",
      expiryDate: row[10] ? String(row[10]) : "",
      lastSeen: row[11] ? String(row[11]) : ""
    });
  }

  return sendResponse(true, { shops: shops }, null);
}

function updateShopStatus(p) {
  const shopId = (p.shopId || p.shop_id || "").trim();
  const newStatus = (p.status || "").trim().toLowerCase();

  if (!shopId || !newStatus) {
    return sendResponse(false, null, "Missing shopId or status");
  }

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim().toLowerCase() === shopId.toLowerCase()) {
      sheet.getRange(i + 1, 9).setValue(newStatus);
      return sendResponse(true, { shopId: shopId, status: newStatus }, null);
    }
  }

  return sendResponse(false, null, "Shop ID not found");
}

function createShop(p) {
  const shopName = p.shopName || "Xerox Shop";
  const ownerName = p.ownerName || "Owner";
  const phone = p.phone || "";
  const spreadsheetId = p.spreadsheetId || "";
  const driveFolderId = p.driveFolderId || "";
  const gasUrl = p.gasUrl || "";
  const status = p.status || "trial";
  const expiryDays = parseInt(p.expiryDays || "14", 10);

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();

  let nextNum = data.length;
  let shopId = "XB-" + String(nextNum).padStart(3, '0');
  const licenseKey = generateLicenseKey();

  const now = new Date();
  const createdDate = now.toISOString().split('T')[0];
  const expiryDateObj = new Date(now.getTime() + (expiryDays * 86400000));
  const expiryDate = expiryDateObj.toISOString().split('T')[0];

  sheet.appendRow([
    shopId,
    shopName,
    ownerName,
    phone,
    spreadsheetId,
    driveFolderId,
    gasUrl,
    licenseKey,
    status,
    createdDate,
    expiryDate,
    now.toISOString()
  ]);

  return sendResponse(true, {
    shop: {
      shopId: shopId,
      shopName: shopName,
      ownerName: ownerName,
      phone: phone,
      licenseKey: licenseKey,
      status: status,
      createdDate: createdDate,
      expiryDate: expiryDate
    }
  }, null);
}

function postHeartbeat(p) {
  const shopId = (p.shopId || p.shop_id || "").trim();
  if (!shopId) return sendResponse(false, null, "Missing shopId");

  const sheet = getShopsSheet();
  const data = sheet.getDataRange().getValues();
  const nowStr = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim().toLowerCase() === shopId.toLowerCase()) {
      sheet.getRange(i + 1, 12).setValue(nowStr);
      return sendResponse(true, { lastSeen: nowStr }, null);
    }
  }

  return sendResponse(false, null, "Shop not found");
}

function postRollup(p) {
  const shopId = (p.shopId || p.shop_id || "").trim();
  const dateStr = p.date || new Date().toISOString().split('T')[0];
  const orderCount = parseInt(p.orderCount || "0", 10);
  const totalRevenue = parseFloat(p.totalRevenue || "0");

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
    const rowDate = String(rData[i][1] || "");
    if (rowDate === todayStr) {
      todayOrders += parseInt(rData[i][2] || "0", 10);
      todayRevenue += parseFloat(rData[i][3] || "0");
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

function generateLicenseKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function randSeg(len) {
    let res = "";
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
  return "XB-" + randSeg(4) + "-" + randSeg(4) + "-" + randSeg(4);
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
