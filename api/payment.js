import crypto from 'crypto';

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

export default async function handler(request) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const { MAPAY_MERCHANT_ID, MAPAY_SECRET_KEY, MAPAY_API_URL } = process.env;
    
    console.log('Payment API called with method:', request.method);
    console.log('Environment variables check:', {
      MAPAY_MERCHANT_ID: !!MAPAY_MERCHANT_ID,
      MAPAY_SECRET_KEY: !!MAPAY_SECRET_KEY,
      MAPAY_API_URL: !!MAPAY_API_URL
    });
    
    if (!MAPAY_MERCHANT_ID || !MAPAY_SECRET_KEY || !MAPAY_API_URL) {
      console.error('Missing payment configuration:', {
        MAPAY_MERCHANT_ID: !!MAPAY_MERCHANT_ID,
        MAPAY_SECRET_KEY: !!MAPAY_SECRET_KEY,
        MAPAY_API_URL: !!MAPAY_API_URL
      });
      return new Response(JSON.stringify({ 
        success: false, 
        message: '支付配置未完成' 
      }), { status: 500, headers });
    }

    const secretKey = decodeSecretKey(MAPAY_SECRET_KEY);

    if (request.method === 'POST') {
      const body = await request.json();
      const { action, ...requestData } = body;
      
      console.log('POST request received:', { action, requestData });

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
          console.error('Missing required parameters:', { amount, out_trade_no });
          return new Response(JSON.stringify({
            success: false,
            message: '缺少必要参数'
          }), { status: 400, headers });
        }
        
        console.log('Creating payment order:', { amount, type, out_trade_no, name });

        // 获取origin，处理本地开发环境
        let origin = request.headers.get('origin');
        if (!origin) {
            const host = request.headers.get('host');
            if (host) {
                origin = `http://${host}`;
            } else {
                origin = 'http://localhost:8080';
            }
        }
        
        // 构建支付参数
        const paymentParams = {
          pid: MAPAY_MERCHANT_ID,
          type: type,
          out_trade_no: out_trade_no,
          notify_url: notify_url || `${origin}/api/payment-notify`,
          return_url: return_url || `${origin}/payment-success.html`,
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
        
        console.log('Payment URL constructed:', fullPaymentUrl);
        console.log('Payment parameters:', paymentParams);

        const responseData = {
          payment_url: fullPaymentUrl,
          order_id: out_trade_no,
          amount: amount,
          type: type
        };
        
        console.log('Returning payment response:', responseData);

        return new Response(JSON.stringify({
          success: true,
          data: responseData
        }), { status: 200, headers });

      } else if (action === 'query_order') {
        // 查询订单状态
        const { out_trade_no } = requestData;

        if (!out_trade_no) {
          return new Response(JSON.stringify({
            success: false,
            message: '缺少订单号'
          }), { status: 400, headers });
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

        return new Response(JSON.stringify({
          success: true,
          data: queryResult
        }), { status: 200, headers });

      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '不支持的操作'
        }), { status: 400, headers });
      }

    } else if (request.method === 'GET') {
      // 获取支付配置信息（仅返回非敏感信息）
      return new Response(JSON.stringify({
        success: true,
        data: {
          merchant_id: MAPAY_MERCHANT_ID,
          api_url: MAPAY_API_URL,
          supported_types: ['alipay', 'wxpay']
        }
      }), { status: 200, headers });

    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '不支持的请求方法'
      }), { status: 405, headers });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器内部错误'
    }), { status: 500, headers });
  }
}