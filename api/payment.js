const crypto = require('crypto');

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

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { MAPAY_MERCHANT_ID, MAPAY_SECRET_KEY, MAPAY_API_URL } = process.env;
    
    if (!MAPAY_MERCHANT_ID || !MAPAY_SECRET_KEY || !MAPAY_API_URL) {
      return res.status(500).json({ 
        success: false, 
        message: '支付配置未完成' 
      });
    }

    const secretKey = decodeSecretKey(MAPAY_SECRET_KEY);

    if (req.method === 'POST') {
      const { action, ...requestData } = req.body;

      if (action === 'create_order') {
        // 创建支付订单
        const { 
          amount, 
          type = 'alipay', // alipay 或 wxpay
          out_trade_no,
          name = '高级会员订阅',
          notify_url,
          return_url 
        } = requestData;

        // 验证必要参数
        if (!amount || !out_trade_no) {
          return res.status(400).json({
            success: false,
            message: '缺少必要参数'
          });
        }

        // 构建支付参数
        const paymentParams = {
          pid: MAPAY_MERCHANT_ID,
          type: type,
          out_trade_no: out_trade_no,
          notify_url: notify_url || `${req.headers.origin}/api/payment-notify`,
          return_url: return_url || `${req.headers.origin}/payment-success.html`,
          name: name,
          money: amount,
          sitename: 'AI商品描述生成器'
        };

        // 生成签名
        paymentParams.sign = generateSign(paymentParams, secretKey);
        paymentParams.sign_type = 'MD5';

        // 构建支付URL
        const paymentUrl = `${MAPAY_API_URL}/submit.php`;
        const urlParams = new URLSearchParams(paymentParams);
        const fullPaymentUrl = `${paymentUrl}?${urlParams.toString()}`;

        return res.json({
          success: true,
          data: {
            payment_url: fullPaymentUrl,
            order_id: out_trade_no,
            amount: amount,
            type: type
          }
        });

      } else if (action === 'query_order') {
        // 查询订单状态
        const { out_trade_no } = requestData;

        if (!out_trade_no) {
          return res.status(400).json({
            success: false,
            message: '缺少订单号'
          });
        }

        const queryParams = {
          act: 'order',
          pid: MAPAY_MERCHANT_ID,
          key: secretKey,
          out_trade_no: out_trade_no
        };

        // 查询订单状态
        const queryUrl = `${MAPAY_API_URL}/api.php`;
        const queryResponse = await fetch(`${queryUrl}?${new URLSearchParams(queryParams)}`);
        const queryResult = await queryResponse.json();

        return res.json({
          success: true,
          data: queryResult
        });

      } else {
        return res.status(400).json({
          success: false,
          message: '不支持的操作'
        });
      }

    } else if (req.method === 'GET') {
      // 获取支付配置信息（仅返回非敏感信息）
      return res.json({
        success: true,
        data: {
          merchant_id: MAPAY_MERCHANT_ID,
          api_url: MAPAY_API_URL,
          supported_types: ['alipay', 'wxpay']
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        message: '不支持的请求方法'
      });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
}