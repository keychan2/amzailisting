// 安全的Supabase客户端初始化
// 通过后端API获取配置，避免在前端暴露敏感信息

let supabaseClient = null;

// 初始化Supabase客户端
async function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // 从后端API获取Supabase配置
    const response = await fetch('/api/supabase-config');
    
    if (!response.ok) {
      throw new Error(`Failed to get Supabase config: ${response.status}`);
    }

    const config = await response.json();
    
    // 动态导入Supabase客户端
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    
    // 创建Supabase客户端
    supabaseClient = createClient(config.url, config.anonKey);
    
    return supabaseClient;
    
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw new Error('无法连接到数据库服务');
  }
}

// 获取Supabase客户端实例
async function getSupabase() {
  if (!supabaseClient) {
    await initSupabase();
  }
  return supabaseClient;
}

// 导出函数供其他脚本使用
window.getSupabase = getSupabase;
window.initSupabase = initSupabase;