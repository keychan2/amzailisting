class PaymentManager {
    constructor() {
        this.currentUser = null;
        this.subscription = null;
        this.dailyUsage = 0;
        this.init();
    }

    async init() {
        await this.loadUserAuth();
        await this.loadSubscription();
        await this.loadDailyUsage();
        this.updateUI();
    }

    // 加载用户认证信息
    async loadUserAuth() {
        // 方法1：检查全局的 currentUser (来自 Supabase 认证)
        if (window.currentUser) {
            this.currentUser = {
                id: window.currentUser.id,
                email: window.currentUser.email,
                token: window.currentUser.token || window.currentUser.id
            };
            console.log('PaymentManager: 从 window.currentUser 加载用户信息', this.currentUser);
            return;
        }

        // 方法2：尝试从 Supabase 直接获取会话信息
        try {
            if (window.supabase) {
                const { data: { session } } = await window.supabase.auth.getSession();
                if (session && session.user) {
                    this.currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        token: session.access_token || session.user.id
                    };
                    console.log('PaymentManager: 从 Supabase session 加载用户信息', this.currentUser);
                    return;
                }
            }
        } catch (error) {
            console.error('PaymentManager: 无法从 Supabase 获取会话信息:', error);
        }

        // 方法3：备用方案 - 检查 localStorage 中的 userToken
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                // 验证token并获取用户信息
                const response = await fetch('/api/subscription', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = { id: data.user_id, token };
                    console.log('PaymentManager: 从 localStorage token 加载用户信息', this.currentUser);
                }
            } catch (error) {
                console.error('PaymentManager: token 验证失败:', error);
                localStorage.removeItem('userToken');
            }
        }

        if (!this.currentUser) {
            console.log('PaymentManager: 未找到有效的用户认证信息');
        }
    }

    // 加载订阅信息
    async loadSubscription() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/subscription', {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.subscription = data.subscription;
            }
        } catch (error) {
            console.error('Failed to load subscription:', error);
        }
    }

    // 加载每日使用量
    async loadDailyUsage() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/usage', {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.dailyUsage = data.daily_usage || 0;
            }
        } catch (error) {
            console.error('Failed to load daily usage:', error);
        }
    }

    // 检查是否为高级用户
    isPremiumUser() {
        if (!this.subscription) return false;
        
        const now = new Date();
        const endDate = new Date(this.subscription.end_date);
        
        return this.subscription.status === 'active' && endDate > now;
    }

    // 检查是否可以生成
    canGenerate() {
        if (this.isPremiumUser()) {
            return true; // 高级用户无限制
        }
        
        return this.dailyUsage < 3; // 免费用户每日3次
    }

    // 获取剩余次数
    getRemainingGenerations() {
        if (this.isPremiumUser()) {
            return '无限制';
        }
        
        return Math.max(0, 3 - this.dailyUsage);
    }

    // 增加使用次数
    async incrementUsage() {
        if (!this.currentUser) return false;

        try {
            const response = await fetch('/api/usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            if (response.ok) {
                this.dailyUsage++;
                this.updateUI();
                return true;
            }
        } catch (error) {
            console.error('Failed to increment usage:', error);
        }
        
        return false;
    }

    // 创建支付订单
    async createPaymentOrder(planType = 'monthly', paymentMethod = 'alipay') {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return null;
        }

        const plans = {
            monthly: { amount: 18.88, name: '高级会员月卡' },
            yearly: { amount: 188.88, name: '高级会员年卡' }
        };

        const plan = plans[planType];
        if (!plan) {
            throw new Error('Invalid plan type');
        }

        const orderData = {
            action: 'create_order',
            amount: plan.amount,
            type: paymentMethod,
            out_trade_no: `premium_${planType}_${this.currentUser.id}_${Date.now()}`,
            name: plan.name,
            return_url: `${window.location.origin}/payment-success.html`
        };

        try {
            console.log('Creating payment order with data:', orderData);
            
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            console.log('Payment API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Payment API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Payment API result:', result);
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || '创建订单失败');
            }
        } catch (error) {
            console.error('Failed to create payment order:', error);
            
            // 提供更友好的错误信息
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('网络连接失败，请检查网络连接后重试');
            } else if (error.message.includes('HTTP 500')) {
                throw new Error('服务器配置错误，请联系管理员');
            } else {
                throw error;
            }
        }
    }

    // 查询订单状态
    async queryOrderStatus(outTradeNo) {
        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'query_order',
                    out_trade_no: outTradeNo
                })
            });

            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Failed to query order status:', error);
            return null;
        }
    }

    // 显示登录提示
    showLoginPrompt() {
        if (confirm('请先登录后再进行支付操作，是否跳转到登录页面？')) {
            window.location.href = 'auth.html';
        }
    }

    // 显示升级弹窗
    showUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // 隐藏升级弹窗
    hideUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 处理支付
    async handlePayment(planType, paymentMethod) {
        try {
            // 显示加载状态
            const payButton = document.querySelector('.pay-button');
            if (payButton) {
                payButton.textContent = '创建订单中...';
                payButton.disabled = true;
            }

            // 创建支付订单
            const orderData = await this.createPaymentOrder(planType, paymentMethod);
            
            if (orderData && orderData.payment_url) {
                // 跳转到支付页面
                window.open(orderData.payment_url, '_blank');
                
                // 开始轮询订单状态
                this.pollOrderStatus(orderData.order_id);
            }

        } catch (error) {
            alert('支付失败：' + error.message);
        } finally {
            // 恢复按钮状态
            const payButton = document.querySelector('.pay-button');
            if (payButton) {
                payButton.textContent = '立即支付';
                payButton.disabled = false;
            }
        }
    }

    // 轮询订单状态
    async pollOrderStatus(orderId, maxAttempts = 30) {
        let attempts = 0;
        
        const poll = async () => {
            if (attempts >= maxAttempts) {
                console.log('Order status polling timeout');
                return;
            }

            const status = await this.queryOrderStatus(orderId);
            
            if (status && status.status === 1) {
                // 支付成功
                await this.loadSubscription();
                this.updateUI();
                this.hideUpgradeModal();
                alert('支付成功！您已成为高级会员');
                return;
            }

            attempts++;
            setTimeout(poll, 3000); // 每3秒查询一次
        };

        poll();
    }

    // 更新UI显示
    updateUI() {
        this.updateSubscriptionStatus();
        this.updateUsageDisplay();
    }

    // 更新订阅状态显示
    updateSubscriptionStatus() {
        const statusElement = document.getElementById('subscriptionStatus');
        const upgradeButton = document.getElementById('upgradeButton');
        
        if (statusElement) {
            if (this.isPremiumUser()) {
                const endDate = new Date(this.subscription.end_date);
                statusElement.innerHTML = `
                    <span class="premium-badge">高级会员</span>
                    <span class="expire-date">到期时间：${endDate.toLocaleDateString()}</span>
                `;
                if (upgradeButton) upgradeButton.style.display = 'none';
            } else {
                statusElement.innerHTML = '<span class="free-badge">免费用户</span>';
                if (upgradeButton) upgradeButton.style.display = 'inline-block';
            }
        }
    }

    // 更新使用量显示
    updateUsageDisplay() {
        const usageElement = document.getElementById('usageDisplay');
        
        if (usageElement) {
            const remaining = this.getRemainingGenerations();
            usageElement.textContent = `今日剩余次数：${remaining}`;
        }
    }

    // 生成用户ID（临时方案，实际应该有完整的用户系统）
    generateUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userToken', userId); // 临时token
        }
        return userId;
    }

    // 确保用户已登录
    async ensureUserLoggedIn() {
        // 如果当前没有用户信息，尝试重新加载
        if (!this.currentUser) {
            console.log('PaymentManager: 当前无用户信息，尝试重新加载...');
            await this.loadUserAuth();
        }
        
        // 再次检查用户信息
        if (!this.currentUser) {
            console.log('PaymentManager: 重新加载后仍无用户信息，显示登录提示');
            this.showLoginPrompt();
            return false;
        }
        
        console.log('PaymentManager: 用户已登录，可以继续支付操作', this.currentUser);
        return true;
    }
}

// 全局实例
window.paymentManager = new PaymentManager();