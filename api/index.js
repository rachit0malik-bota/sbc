// =============================================================================
// Vercel Serverless Function Entry Point for Section-B Coffee (SBC)
// =============================================================================
const handleRequest = require('../serve');

module.exports = (req, res) => {
  return handleRequest(req, res);
};
