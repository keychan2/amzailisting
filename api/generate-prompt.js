// Vercel Serverless Function for prompt generation
// 隐藏prompt模板和生成逻辑在后端

// 产品类别专用prompt模板 - 现在在后端安全存储
const promptTemplates = {
  electronics: {
    focus: ['技术规格', '兼容性', '性能优势', '安全认证', '用户体验'],
    keywords: ['smart', 'wireless', 'fast', 'compatible', 'certified'],
    tone: 'technical and professional'
  },
  'home-kitchen': {
    focus: ['实用性', '安全性', '易清洁', '空间节省', '家庭友好'],
    keywords: ['durable', 'safe', 'easy', 'space-saving', 'family'],
    tone: 'warm and practical'
  },
  clothing: {
    focus: ['舒适度', '时尚设计', '材质质量', '尺码适配', '搭配性'],
    keywords: ['comfortable', 'stylish', 'premium', 'fit', 'versatile'],
    tone: 'fashionable and appealing'
  },
  sports: {
    focus: ['性能表现', '耐用性', '运动支持', '透气性', '专业级'],
    keywords: ['performance', 'durable', 'athletic', 'breathable', 'professional'],
    tone: 'energetic and motivational'
  },
  beauty: {
    focus: ['效果显著', '温和配方', '适合肌肤', '持久效果', '天然成分'],
    keywords: ['effective', 'gentle', 'suitable', 'long-lasting', 'natural'],
    tone: 'elegant and trustworthy'
  },
  toys: {
    focus: ['安全性', '教育价值', '趣味性', '年龄适宜', '创造力'],
    keywords: ['safe', 'educational', 'fun', 'age-appropriate', 'creative'],
    tone: 'playful and safe'
  },
  automotive: {
    focus: ['兼容性', '安装简便', '耐用性', '性能提升', '安全保障'],
    keywords: ['compatible', 'easy-install', 'durable', 'performance', 'safety'],
    tone: 'reliable and technical'
  },
  health: {
    focus: ['健康效益', '科学验证', '安全性', '使用便捷', '专业推荐'],
    keywords: ['healthy', 'scientifically-proven', 'safe', 'convenient', 'recommended'],
    tone: 'professional and caring'
  },
  other: {
    focus: ['实用性', '质量保证', '用户友好', '性价比', '多功能'],
    keywords: ['practical', 'quality', 'user-friendly', 'value', 'versatile'],
    tone: 'balanced and appealing'
  }
};

// 智能prompt生成函数 - 后端处理
function generateAdvancedPrompt(formData) {
  const category = formData.productCategory;
  const template = promptTemplates[category] || promptTemplates.other;
  
  // 构建基础prompt
  let prompt = `Create a compelling Amazon product title and 5 bullet points for a ${category} product based on the following information:\n\n`;
  
  // 产品基本信息
  prompt += `PRODUCT OVERVIEW:\n`;
  if (formData.productCategory) prompt += `- Category: ${formData.productCategory}\n`;
  if (formData.brandPositioning) prompt += `- Brand Positioning: ${formData.brandPositioning}\n`;
  if (formData.mainFunction) prompt += `- Main Function: ${formData.mainFunction}\n`;
  if (formData.uniqueSellingPoint) prompt += `- Unique Selling Point: ${formData.uniqueSellingPoint}\n`;
  
  // 目标市场信息
  if (formData.targetAudience || formData.usageScenario || formData.painPoints) {
    prompt += `\nTARGET MARKET:\n`;
    if (formData.targetAudience) prompt += `- Target Audience: ${formData.targetAudience}\n`;
    if (formData.usageScenario) prompt += `- Usage Scenario: ${formData.usageScenario}\n`;
    if (formData.painPoints) prompt += `- Pain Points Solved: ${formData.painPoints}\n`;
  }
  
  // 产品属性
  if (formData.material || formData.dimensions || formData.colors || formData.techSpecs) {
    prompt += `\nPRODUCT ATTRIBUTES:\n`;
    if (formData.material) prompt += `- Material: ${formData.material}\n`;
    if (formData.dimensions) prompt += `- Dimensions: ${formData.dimensions}\n`;
    if (formData.colors) prompt += `- Colors/Styles: ${formData.colors}\n`;
    if (formData.techSpecs) prompt += `- Technical Specifications: ${formData.techSpecs}\n`;
  }
  
  // 营销要素
  if (formData.coreKeywords || formData.competitiveAdvantage || formData.pricePositioning || formData.seasonality) {
    prompt += `\nMARKETING ELEMENTS:\n`;
    if (formData.coreKeywords) prompt += `- Core Keywords: ${formData.coreKeywords}\n`;
    if (formData.competitiveAdvantage) prompt += `- Competitive Advantage: ${formData.competitiveAdvantage}\n`;
    if (formData.pricePositioning) prompt += `- Price Positioning: ${formData.pricePositioning}\n`;
    if (formData.seasonality) prompt += `- Seasonality: ${formData.seasonality}\n`;
  }
  
  // 类别特定指导
  prompt += `\nCATEGORY-SPECIFIC GUIDELINES:\n`;
  prompt += `- Focus Areas: ${template.focus.join(', ')}\n`;
  prompt += `- Recommended Keywords: ${template.keywords.join(', ')}\n`;
  prompt += `- Tone: ${template.tone}\n`;
  
  // 生成指令
  prompt += `\nGENERATION INSTRUCTIONS:\n`;
  prompt += `- Create a compelling, keyword-optimized product title (max 200 characters)\n`;
  prompt += `- Generate 5 persuasive bullet points focusing on the category-specific focus areas\n`;
  prompt += `- Incorporate the provided keywords naturally\n`;
  prompt += `- Address the target audience and their pain points directly\n`;
  prompt += `- Highlight unique selling points and competitive advantages\n`;
  prompt += `- Use ${template.tone} tone suitable for Amazon customers\n`;
  prompt += `- Output both in English and Chinese translation\n`;
  prompt += `- For each part, first give the English version, then provide the corresponding Chinese translation below it\n`;
  prompt += `- 中文翻译要准确、自然，适合亚马逊中国站或跨境卖家参考\n\n`;
  
  prompt += `Focus on creating content that converts browsers into buyers by emphasizing benefits over features and addressing customer needs directly.`;
  
  return prompt;
}

// 生成简单prompt（基于参考内容）
function generateSimplePrompt(titles, bullets, features, keywords) {
  return `Based on the following reference Amazon titles and bullet points, generate a compelling, keyword-optimized product title and 5 persuasive bullet points.\n\nReference Titles:\n${titles}\n\nReference Bullets:\n${bullets}\n\nProduct Features:\n${features}\n\nTarget Keywords:\n${keywords}\n\nInstructions:\n- Output both in English and Chinese translation.\n- For each part, first give the English version, then provide the corresponding Chinese translation below it.\n- Title: concise, clear, max 200 characters\n- Bullet Points: focus on product benefits, features, and usability (5 points total)\n- Use professional, persuasive tone suitable for Amazon customers.\n- 中文翻译要准确、自然，适合亚马逊中国站或跨境卖家参考。`;
}

// Vercel Serverless Function 主函数
module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, formData, titles, bullets, features, keywords } = req.body;

    let prompt;

    if (type === 'advanced') {
      // 高级模式：使用表单数据生成prompt
      if (!formData) {
        return res.status(400).json({ error: 'Form data is required for advanced mode' });
      }
      prompt = generateAdvancedPrompt(formData);
    } else if (type === 'simple') {
      // 简单模式：基于参考内容生成prompt
      if (!titles || !bullets || !features || !keywords) {
        return res.status(400).json({ error: 'All reference data is required for simple mode' });
      }
      prompt = generateSimplePrompt(titles, bullets, features, keywords);
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "advanced" or "simple"' });
    }

    // 返回生成的prompt
    res.status(200).json({
      success: true,
      prompt: prompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prompt generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}