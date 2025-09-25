const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables
require('dotenv').config();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/supabase-config' && req.method === 'GET') {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        supabaseUrl,
        supabaseAnonKey
      }));
      return;
    }

    if (pathname === '/api/payment' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          // Import the payment handler dynamically
          const paymentHandler = await import('./api/payment.js');
          
          // Create a mock request/response object for the handler
          const mockReq = {
            method: 'POST',
            body: JSON.parse(body),
            ...JSON.parse(body)
          };
          
          const mockRes = {
            status: (code) => ({
              json: (data) => {
                res.writeHead(code, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
              },
              end: () => {
                res.writeHead(code);
                res.end();
              }
            }),
            setHeader: (name, value) => res.setHeader(name, value),
            json: (data) => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            }
          };
          
          await paymentHandler.default(mockReq, mockRes);
        } catch (error) {
          console.error('Payment API error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: '支付服务暂时不可用: ' + error.message 
          }));
        }
      });
      return;
    }

    if (pathname === '/api/generate-prompt' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          // Simple prompt generation logic
          const prompt = `Generate a compelling product listing for: ${data.product || 'Unknown Product'}`;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ prompt }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    // API route not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Handle static files
  const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  }[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Development server running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  GET /api/supabase-config');
  console.log('  POST /api/generate-prompt');
  console.log('  POST /api/payment');
});