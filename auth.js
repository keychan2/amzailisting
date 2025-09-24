// 安全的Supabase客户端初始化
let supabaseClient = null;

// 初始化Supabase客户端
async function initSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  try {
    // 首先尝试从后端API获取配置
    const response = await fetch('/api/supabase-config');
    if (!response.ok) {
      throw new Error(`Failed to get config: ${response.status}`);
    }
    
    const config = await response.json();
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabaseClient;
  } catch (error) {
    console.error('API配置获取失败，尝试使用静态配置:', error);
    
    // 备用方案：使用静态配置
    try {
      console.log('检查静态配置:', window.SUPABASE_CONFIG);
      if (window.SUPABASE_CONFIG) {
        console.log('找到静态配置，开始初始化Supabase客户端');
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        supabaseClient = createClient(window.SUPABASE_CONFIG.supabaseUrl, window.SUPABASE_CONFIG.supabaseAnonKey);
        console.log('使用静态配置成功初始化Supabase');
        return supabaseClient;
      } else {
        console.error('window.SUPABASE_CONFIG 未定义');
        throw new Error('静态配置未找到');
      }
    } catch (fallbackError) {
      console.error('静态配置初始化也失败:', fallbackError);
      throw new Error('无法连接到数据库服务');
    }
  }
}

// DOM 元素
const formTitle = document.getElementById('form-title');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const submitButton = document.getElementById('submit-button');
const toggleModeLink = document.getElementById('toggle-mode');
const messageContainer = document.getElementById('message-container');

let isLoginMode = true;

// 切换登录/注册模式
toggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    updateUI();
});

// 根据当前模式更新UI
function updateUI() {
    clearMessages();
    if (isLoginMode) {
        formTitle.textContent = '登录';
        submitButton.textContent = '登录';
        toggleModeLink.textContent = '还没有账户？立即注册';
        confirmPasswordGroup.style.display = 'none';
    } else {
        formTitle.textContent = '注册';
        submitButton.textContent = '注册';
        toggleModeLink.textContent = '已有账户？立即登录';
        confirmPasswordGroup.style.display = 'block';
    }
}

// 显示简单的文本提示信息
function showMessage(message, type = 'error') {
    clearMessages();
    const alertType = type === 'error' ? 'danger' : 'success';
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${alertType}`;
    messageDiv.setAttribute('role', 'alert');
    messageDiv.textContent = message;
    messageContainer.appendChild(messageDiv);
}

// 清除所有提示信息
function clearMessages() {
    messageContainer.innerHTML = '';
}

// 根据邮箱域名获取服务商链接
function getEmailProviderLink(email) {
    const domain = email.split('@')[1];
    if (!domain) return null;

    const providers = {
        'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
        'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
        'hotmail.com': { name: 'Hotmail', url: 'https://outlook.live.com' },
        'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
        'qq.com': { name: 'QQ邮箱', url: 'https://mail.qq.com' },
        '163.com': { name: '网易163邮箱', url: 'https://mail.163.com' },
        '126.com': { name: '网易126邮箱', url: 'https://mail.126.com' },
        'sina.com': { name: '新浪邮箱', url: 'https://mail.sina.com.cn' },
        'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' }
    };

    return providers[domain] || null;
}

// 提交表单
submitButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    clearMessages();

    if (!email || !password) {
        showMessage('请输入电子邮件和密码。');
        return;
    }

    try {
        await initSupabaseClient();
        
        if (isLoginMode) {
            // --- 登录逻辑 ---
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            showMessage(error.message === 'Email not confirmed' ? '您的邮箱尚未验证，请检查收件箱完成验证。' : `登录失败: ${error.message}`);
        } else {
            showMessage('登录成功！正在跳转...', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);
        }
    } else {
        // --- 注册逻辑 ---
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            showMessage('两次输入的密码不一致。');
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            // 捕获网络错误或其他意外错误
            showMessage(`注册失败: ${error.message}`, 'error');
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
            // 这是关键：如果 identities 数组为空，说明用户已存在
            showMessage('该邮箱已被注册，请直接登录或使用其他邮箱。', 'error');
        } else {
            // 只有当用户是全新的，才显示成功验证的界面
            const provider = getEmailProviderLink(email);
            let successHtml = `
                <div class="alert alert-success" role="alert">
                    <h4 class="alert-heading">注册成功！</h4>
                    <p>我们已向 <strong>${email}</strong> 发送了一封验证邮件。请点击邮件中的链接以激活您的账户。</p>
                    <hr>
                    <p class="mb-0">如果没有收到邮件，请检查您的垃圾邮件文件夹。</p>
                </div>
            `;

            if (provider) {
                successHtml += `
                    <div class="d-grid gap-2 mt-3">
                        <a href="${provider.url}" class="btn btn-primary" target="_blank">前往 ${provider.name} 查收邮件</a>
                    </div>
                `;
            }
            
            messageContainer.innerHTML = successHtml;

            // 禁用表单
            emailInput.disabled = true;
            passwordInput.disabled = true;
            confirmPasswordInput.disabled = true;
            submitButton.disabled = true;
            toggleModeLink.style.display = 'none';
        }
    }
    } catch (error) {
        console.error('Supabase初始化或操作失败:', error);
        showMessage('连接服务器失败，请稍后重试。');
    }
});

// 初始化UI
updateUI();