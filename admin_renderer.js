const fs = require('fs');
const path = require('path');

function renderAdminDashboard() {
  try {
    const filePath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (e) {}
  return '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/admin.html"></head><body>Redirecting to Desk 14 Portal...</body></html>';
}

module.exports = { renderAdminDashboard };
