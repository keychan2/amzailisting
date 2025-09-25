import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Helper function to adapt Web standard API functions to Node.js req/res
async function callWebStandardAPI(apiPath, req, res) {
  try {
    // Import the API handler dynamically
    const apiHandler = await import(apiPath);
    
    // Read request body
    let body = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      await new Promise((resolve) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }
    
    // Create Web standard Request object
    const url = `http://localhost:8080${req.url}`;
    const requestInit = {
      method: req.method,
      headers: req.headers,
    };
    
    if (body) {
      requestInit.body = body;
    }
    
    const request = new Request(url, requestInit);
    
    // Call the Web standard API handler
    const response = await apiHandler.default(request);
    
    // Convert Web standard Response back to Node.js response
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    
    if (response.body) {
      const responseText = await response.text();
      res.end(responseText);
    } else {
      res.end();
    }
  } catch (error) {
    console.error(`API error for ${apiPath}:`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      message: 'API服务暂时不可用: ' + error.message 
    }));
  }
}

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

    // Handle test-cjs endpoint using Web standard API
    if (pathname === '/api/test-cjs') {
      await callWebStandardAPI('./api/test-cjs.js', req, res);
      return;
    }

    // Handle payment endpoint using Web standard API
    if (pathname === '/api/payment') {
      await callWebStandardAPI('./api/payment.js', req, res);
      return;
    }

    // Handle payment-notify endpoint using Web standard API
    if (pathname === '/api/payment-notify') {
      await callWebStandardAPI('./api/payment-notify.js', req, res);
      return;
    }

    if (pathname === '/api/payment-old' && req.method === 'POST') {
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
            headers: {
              origin: `http://localhost:${PORT}`,
              'content-type': 'application/json'
            }
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
  console.log('  GET /api/test-cjs (Web Standard API)');
  console.log('  POST /api/payment (Web Standard API)');
  console.log('  POST /api/payment-notify (Web Standard API)');
  console.log('  POST /api/generate-prompt');
});