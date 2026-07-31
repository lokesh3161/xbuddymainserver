/**
 * XBuddy Per-Shop Apps Script Backend — Complete Schema & API Handler
 * Exposes doGet() and doPost() with standardized JSON response format.
 * 
 * Schema Tabs Managed:
 * - Orders (25 columns)
 * - Customers
 * - Pricing
 * - Shop Information
 * - Daily Summary
 * - Analytics
 * - Printer Queue
 * - System Logs
 * - License Cache
 */

const SHEET_ORDERS       = "Orders";
const SHEET_CUSTOMERS    = "Customers";
const SHEET_PRICING      = "Pricing";
const SHEET_SHOP_INFO    = "Shop Information";
const SHEET_DAILY_SUM    = "Daily Summary";
const SHEET_ANALYTICS    = "Analytics";
const SHEET_QUEUE        = "Printer Queue";
const SHEET_LOGS         = "System Logs";
const SHEET_LICENSE      = "License Cache";

function doGet(e) {
  try {
    const p = e ? (e.parameter || {}) : {};
    return handleRequest(p);
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
    return handleRequest(p);
  } catch (err) {
    return sendResponse(false, null, err.toString());
  }
}

function handleRequest(p) {
  const action = p.action || '';

  // Core Actions as per Section 6
  if (action === 'createOrder')         return createOrder(p);
  if (action === 'getOrder')            return getOrder(p);
  if (action === 'getAllOrders' || action === 'listOrders') return getAllOrders(p);
  if (action === 'updatePrintStatus')   return updatePrintStatus(p);
  if (action === 'updatePaymentStatus') return updatePaymentStatus(p);
  if (action === 'cancelOrder')         return cancelOrder(p);
  if (action === 'validateLicense')     return validateLicense(p);
  if (action === 'heartbeat')           return heartbeat(p);
  if (action === 'dailySummary')        return dailySummary(p);

  // Backward compatibility actions
  if (action === 'saveOrder')           return createOrder(p);
  if (action === 'updateStatus')        return updatePrintStatus(p);
  if (action === 'getOrderStatus')      return getOrder(p);
  if (action === 'getOrderForRelease')  return getOrder(p);
  if (action === 'saveChunk')           return saveChunk(p);
  if (action === 'assembleFile' || action === 'assemblePdf') return assembleFile(p);

  if (action === 'setTunnelUrl') {
    PropertiesService.getScriptProperties().setProperty('TUNNEL_URL', p.url || '');
    return sendResponse(true, { tunnelUrl: p.url || '' }, null);
  }
  if (action === 'ping')                return ping();
  if (action === 'getConfig')           return getConfig();

  return sendResponse(true, { message: "XBuddy Per-Shop Backend API is active!" }, null);
}

function ping() {
  return sendResponse(true, {
    app: "XBuddy Per-Shop Backend",
    status: "active",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  }, null);
}

function getConfig() {
  const ss = getSS();
  const pricingSheet = getPricingSheet();
  const pricingData = pricingSheet.getDataRange().getValues();

  let bwPrice = 2.00;
  let colorPrice = 10.00;
  let a3Extra = 5.00;

  if (pricingData.length > 1) {
    bwPrice = parseFloat(pricingData[1][1] || '2.00');
    colorPrice = parseFloat(pricingData[1][2] || '10.00');
    a3Extra = parseFloat(pricingData[1][3] || '5.00');
  }

  const shopInfoSheet = getShopInfoSheet();
  const shopInfoData = shopInfoSheet.getDataRange().getValues();
  let shopName = "Xerox Shop";
  let ownerName = "Owner";

  if (shopInfoData.length > 1) {
    shopName = String(shopInfoData[1][1] || shopName);
    ownerName = String(shopInfoData[1][2] || ownerName);
  }

  return sendResponse(true, {
    shopName: shopName,
    ownerName: ownerName,
    version: "1.0.0",
    sheetId: ss.getId(),
    currency: "INR",
    pricing: {
      bwPrice: bwPrice,
      colorPrice: colorPrice,
      a3Extra: a3Extra,
      currency: "INR"
    },
    printSettings: {
      defaultPaperSize: "A4",
      duplexSupported: true
    }
  }, null);
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

function getOrdersSheet() {
  return getOrCreateSheet(SHEET_ORDERS, [
    "Order ID", "Customer Name", "Phone Number", "Email", "File Name", 
    "Drive File ID", "Drive URL", "Total Pages", "Selected Pages", "Copies", 
    "Print Type", "Paper Size", "Double Side", "Price Per Page", "Total Amount", 
    "Payment Method", "Transaction ID", "Payment Status", "Print Status", 
    "Assigned Printer", "Order Source", "Created Time", "Started Printing", 
    "Completed Time", "Remarks"
  ]);
}

function getCustomersSheet() {
  return getOrCreateSheet(SHEET_CUSTOMERS, [
    "Customer ID", "Name", "Phone Number", "Email", "Total Orders", "Total Spent", "Last Order Date", "Notes"
  ]);
}

function getPricingSheet() {
  return getOrCreateSheet(SHEET_PRICING, [
    "Black & White Price", "Color Price", "A3 Extra", "GST", "Currency"
  ]);
}

function getShopInfoSheet() {
  return getOrCreateSheet(SHEET_SHOP_INFO, [
    "Shop ID", "Shop Name", "Owner Name", "Phone", "Email", "Address", 
    "License Key", "License Status", "Plan", "Activation Date", "Expiry Date", 
    "Current Version", "Printer Name", "Master Registry GAS URL", "Shop GAS URL"
  ]);
}

function getDailySummarySheet() {
  return getOrCreateSheet(SHEET_DAILY_SUM, [
    "Date", "Orders", "Revenue", "Completed Prints", "Pending Prints", "Cancelled Orders"
  ]);
}

function getAnalyticsSheet() {
  return getOrCreateSheet(SHEET_ANALYTICS, [
    "Total Orders", "Today's Orders", "Completed Orders", "Pending Orders", 
    "Cancelled Orders", "Failed Orders", "Total Revenue", "Today's Revenue", 
    "Average Order Value", "Total Customers", "Total Pages Printed"
  ]);
}

function getPrinterQueueSheet() {
  return getOrCreateSheet(SHEET_QUEUE, [
    "Queue ID", "Order ID", "Printer", "Status", "Retries", "Added Time", "Completed Time"
  ]);
}

function getSystemLogsSheet() {
  return getOrCreateSheet(SHEET_LOGS, [
    "Timestamp", "Module", "Level", "Message", "Details"
  ]);
}

function getLicenseCacheSheet() {
  return getOrCreateSheet(SHEET_LICENSE, [
    "License Key", "Last Validation", "Valid Until", "Status"
  ]);
}

// --- API ACTIONS ---

function createOrder(p) {
  const sheet = getOrdersSheet();
  const orderId       = p.orderId || p.order_id || ("ORD-" + Date.now());
  const customerName  = p.name || p.customerName || '';
  const phone         = p.phone || p.phoneNumber || '';
  const email         = p.email || '';
  const fileName      = p.fileName || p.file_name || '';
  const driveFileId   = p.driveFileId || p.fileId || '';
  const driveUrl      = p.driveUrl || p.pdfUrl || '';
  const totalPages    = parseInt(p.totalPages || '1', 10);
  const selectedPages = p.selectedPages || 'All';
  const copies        = parseInt(p.copies || '1', 10);
  const printType     = p.printType || 'B&W';
  const paperSize     = p.paperSize || 'A4';
  const doubleSide    = p.doubleSide || 'No';
  const pricePerPage  = parseFloat(p.pricePerPage || '0');
  const totalAmount   = parseFloat(p.amount || p.totalAmount || '0');
  const paymentMethod = p.paymentMethod || 'UPI';
  const transactionId = p.transactionId || '';
  const paymentStatus = p.paymentStatus || 'Paid';
  const printStatus   = p.printStatus || 'Waiting';
  const assignedPrinter = p.assignedPrinter || '';
  const orderSource   = p.orderSource || 'Customer App';
  const createdTime   = p.createdTime || new Date().toISOString();
  const startedPrinting = '';
  const completedTime = '';
  const remarks       = p.remarks || '';

  sheet.appendRow([
    orderId, customerName, phone, email, fileName,
    driveFileId, driveUrl, totalPages, selectedPages, copies,
    printType, paperSize, doubleSide, pricePerPage, totalAmount,
    paymentMethod, transactionId, paymentStatus, printStatus,
    assignedPrinter, orderSource, createdTime, startedPrinting,
    completedTime, remarks
  ]);

  logSystem('Orders', 'INFO', 'Created order ' + orderId, JSON.stringify({ customerName, totalAmount }));

  return sendResponse(true, {
    orderId: orderId,
    paymentStatus: paymentStatus,
    printStatus: printStatus,
    createdTime: createdTime
  }, null);
}

function getOrder(p) {
  const targetId = (p.orderId || p.order_id || '').trim();
  if (!targetId) return sendResponse(false, null, "Missing orderId");

  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0] || '').trim() === targetId) {
      const order = mapOrderRow(row, i + 1);
      return sendResponse(true, { order: order }, null);
    }
  }

  return sendResponse(false, null, "Order not found");
}

function getAllOrders(p) {
  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();
  const orders = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      orders.push(mapOrderRow(data[i], i + 1));
    }
  }

  return sendResponse(true, { orders: orders }, null);
}

function updatePrintStatus(p) {
  const orderId = (p.orderId || p.order_id || '').trim();
  const status  = p.printStatus || p.status || '';
  const releaseStatus = p.releaseStatus || '';

  if (!orderId) return sendResponse(false, null, "Missing orderId");

  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() === orderId) {
      if (status) sheet.getRange(i + 1, 19).setValue(status);
      if (status === 'Printing') sheet.getRange(i + 1, 23).setValue(new Date().toISOString());
      if (status === 'Printed' || status === 'Completed') sheet.getRange(i + 1, 24).setValue(new Date().toISOString());
      
      logSystem('Orders', 'INFO', 'Updated order ' + orderId + ' print status to ' + status, releaseStatus);

      return sendResponse(true, { orderId: orderId, printStatus: status }, null);
    }
  }

  return sendResponse(false, null, "Order not found");
}

function updatePaymentStatus(p) {
  const orderId = (p.orderId || p.order_id || '').trim();
  const status  = p.paymentStatus || p.status || '';

  if (!orderId) return sendResponse(false, null, "Missing orderId");

  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() === orderId) {
      sheet.getRange(i + 1, 18).setValue(status);
      return sendResponse(true, { orderId: orderId, paymentStatus: status }, null);
    }
  }

  return sendResponse(false, null, "Order not found");
}

function cancelOrder(p) {
  const orderId = (p.orderId || p.order_id || '').trim();
  const remarks = p.remarks || 'Cancelled by user/owner';

  if (!orderId) return sendResponse(false, null, "Missing orderId");

  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim() === orderId) {
      sheet.getRange(i + 1, 19).setValue('Cancelled');
      sheet.getRange(i + 1, 25).setValue(remarks);
      return sendResponse(true, { orderId: orderId, printStatus: 'Cancelled' }, null);
    }
  }

  return sendResponse(false, null, "Order not found");
}

function validateLicense(p) {
  const sheet = getLicenseCacheSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    const row = data[data.length - 1];
    return sendResponse(true, {
      licenseKey: row[0],
      lastValidation: row[1],
      validUntil: row[2],
      status: row[3] || 'active'
    }, null);
  }
  return sendResponse(true, { status: 'unconfigured', valid: true }, null);
}

function heartbeat(p) {
  const printerStatus = p.printerStatus || 'online';
  logSystem('Agent', 'INFO', 'Heartbeat received', 'Printer status: ' + printerStatus);
  return sendResponse(true, { timestamp: new Date().toISOString(), printerStatus: printerStatus }, null);
}

function dailySummary(p) {
  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();
  const today = new Date().toISOString().split('T')[0];

  let totalOrders = 0;
  let revenue = 0;
  let completed = 0;
  let pending = 0;
  let cancelled = 0;

  for (let i = 1; i < data.length; i++) {
    const created = String(data[i][21] || '');
    if (created.startsWith(today)) {
      totalOrders++;
      const amt = parseFloat(String(data[i][14] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      revenue += amt;
      const status = String(data[i][18] || 'Waiting');
      if (status === 'Printed' || status === 'Completed') completed++;
      else if (status === 'Cancelled') cancelled++;
      else pending++;
    }
  }

  const sumSheet = getDailySummarySheet();
  sumSheet.appendRow([today, totalOrders, revenue, completed, pending, cancelled]);

  return sendResponse(true, {
    date: today,
    orders: totalOrders,
    revenue: revenue,
    completedPrints: completed,
    pendingPrints: pending,
    cancelledOrders: cancelled
  }, null);
}

// --- HELPER FUNCTIONS ---

function mapOrderRow(row, rowIndex) {
  return {
    rowIndex:      rowIndex,
    orderId:       row[0]  || '',
    customerName:  row[1]  || '',
    name:          row[1]  || '',
    phoneNumber:   row[2]  || '',
    email:         row[3]  || '',
    fileName:      row[4]  || '',
    driveFileId:   row[5]  || '',
    driveUrl:      row[6]  || '',
    pdfUrl:        row[6]  || '',
    totalPages:    parseInt(row[7]  || '1', 10) || 1,
    selectedPages: row[8]  || 'All',
    copies:        parseInt(row[9]  || '1', 10) || 1,
    printType:     row[10] || 'B&W',
    paperSize:     row[11] || 'A4',
    doubleSide:    row[12] || 'No',
    pricePerPage:  parseFloat(row[13] || '0') || 0,
    amount:        parseFloat(String(row[14] || '0').replace(/[^0-9.-]+/g, '')) || 0,
    totalAmount:   parseFloat(String(row[14] || '0').replace(/[^0-9.-]+/g, '')) || 0,
    paymentMethod: row[15] || 'UPI',
    transactionId: row[16] || '',
    paymentStatus: row[17] || 'Paid',
    printStatus:   row[18] || 'Waiting',
    assignedPrinter: row[19] || '',
    orderSource:   row[20] || 'App',
    createdTime:   row[21] ? String(row[21]) : '',
    timestamp:     row[21] ? String(row[21]) : '',
    startedPrinting: row[22] ? String(row[22]) : '',
    completedTime: row[23] ? String(row[23]) : '',
    remarks:       row[24] || ''
  };
}

function saveChunk(p) {
  const store = PropertiesService.getScriptProperties();
  const key   = p.fileId + '_' + p.fileType + '_' + p.index;
  store.setProperty(key, p.chunk);
  store.setProperty(p.fileId + '_' + p.fileType + '_total', String(p.total));
  return sendResponse(true, { savedChunk: p.index }, null);
}

function assembleFile(p) {
  const store = PropertiesService.getScriptProperties();
  const total = parseInt(store.getProperty(p.fileId + '_' + p.fileType + '_total') || '0', 10);
  if (total === 0) return sendResponse(false, null, "No chunks found");

  let base64 = '';
  for (let i = 0; i < total; i++) {
    const key = p.fileId + '_' + p.fileType + '_' + i;
    base64 += store.getProperty(key) || '';
    store.deleteProperty(key);
  }
  store.deleteProperty(p.fileId + '_' + p.fileType + '_total');

  const folderId = p.folderId || 'root';
  const fileUrl  = uploadFileBlob(base64, p.fileName, p.mimeType, folderId);

  return sendResponse(true, { fileUrl: fileUrl }, null);
}

function uploadFileBlob(base64Data, fileName, mimeType, folderId) {
  const parts  = base64Data.split(',');
  const clean  = parts.length > 1 ? parts[1] : parts[0];
  const bytes  = Utilities.base64Decode(clean);
  const blob   = Utilities.newBlob(bytes, mimeType, fileName);
  const folder = folderId === 'root' ? DriveApp.getRootFolder() : DriveApp.getFolderById(folderId);
  const file   = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function logSystem(moduleName, level, message, details) {
  try {
    const sheet = getSystemLogsSheet();
    sheet.appendRow([new Date().toISOString(), moduleName, level, message, details || '']);
  } catch (e) {}
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
