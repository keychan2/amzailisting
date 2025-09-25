import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 解码Base64编码的秘钥信息
function decodeSecretKey(encodedKey) {
  try {
    const decoded = Buffer.from(encodedKey, 'base64').toString('utf-8');
    const keyInfo = JSON.parse(decoded);
    return keyInfo.key;
  } catch (error) {
    console.error('Failed to decode secret key:', error);
    throw new Error('Invalid secret key format');
  }
}

// 生成签名
function generateSign(params, secretKey) {
  // 按键名排序并拼接参数
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + secretKey;
  
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 验证签名
function verifySign(params, secretKey) {
  const { sign, ...otherParams } = params;
  const calculatedSign = generateSign(otherParams, secretKey);
  return calculatedSign === sign;
}

export default async function handler(req, res) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { MAPAY_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    
    if (!MAPAY_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const secretKey = decodeSecretKey(MAPAY_SECRET_KEY);
    
    // 获取回调参数
    const notifyData = req.body;
    console.log('Payment notify received:', notifyData);

    // 验证签名
    if (!verifySign(notifyData, secretKey)) {
      console.error('Invalid signature:', notifyData);
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // 检查支付状态
    if (notifyData.trade_status !== 'TRADE_SUCCESS') {
      console.log('Payment not successful:', notifyData.trade_status);
      return res.status(200).send('success'); // 仍然返回成功，避免重复通知
    }

    // 初始化Supabase客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 解析订单号获取用户ID和订阅类型
    const { out_trade_no, money, trade_no } = notifyData;
    
    // 订单号格式: premium_monthly_{user_id}_{timestamp}
    const orderParts = out_trade_no.split('_');
    if (orderParts.length < 4 || orderParts[0] !== 'premium') {
      console.error('Invalid order format:', out_trade_no);
      return res.status(400).json({ message: 'Invalid order format' });
    }

    const subscriptionType = `${orderParts[0]}_${orderParts[1]}`; // premium_monthly
    const userId = orderParts[2];
    const amount = parseFloat(money);

    // 计算订阅结束时间
    let endDate = new Date();
    if (subscriptionType === 'premium_monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === 'premium_yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 检查是否已存在该订单的记录
    const { data: existingRecord } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('transaction_id', trade_no)
      .single();

    if (existingRecord) {
      console.log('Payment already processed:', trade_no);
      return res.status(200).send('success');
    }

    // 更新或插入用户订阅记录
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        subscription_type: subscriptionType,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        amount: amount,
        payment_method: notifyData.type || 'unknown',
        transaction_id: trade_no,
        order_id: out_trade_no,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log('Payment processed successfully:', {
      userId,
      subscriptionType,
      amount,
      transactionId: trade_no
    });

    // 返回成功响应给码支付
    return res.status(200).send('success');

  } catch (error) {
    console.error('Payment notify error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}