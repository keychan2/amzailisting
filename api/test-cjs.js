export default async function handler(request) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  return new Response(JSON.stringify({
    message: 'CommonJS Test API is working!',
    timestamp: new Date().toISOString(),
    method: request.method
  }), { status: 200, headers });
}