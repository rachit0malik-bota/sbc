const fs = require('fs');
const path = require('path');

function renderAdminDashboard() {
  const filePath = path.join(__dirname, 'admin.html');
  return fs.readFileSync(filePath, 'utf-8');
}

module.exports = { renderAdminDashboard };
