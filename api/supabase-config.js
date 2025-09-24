// Vercel Serverless Function for Supabase configuration
// 这个API端点提供Supabase配置，但不暴露敏感信息

export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 从环境变量获取Supabase配置
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // 验证环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // 返回配置信息
    res.status(200).json({
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: supabaseAnonKey
    });

  } catch (error) {
    console.error('Error in supabase-config API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}