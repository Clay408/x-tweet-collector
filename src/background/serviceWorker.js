// Service Worker for X Tweet Collection Extension
// Handles data storage and AI API calls

/**
 * Initialize default settings
 */
function initializeSettings() {
  chrome.storage.local.get(['settings', 'tweets'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          apiEndpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: '',
          model: 'gpt-4',
          systemPrompt: '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报，按主题分类，提取关键信息和洞察。'
        }
      });
    }

    if (!result.tweets) {
      chrome.storage.local.set({ tweets: [] });
    }
  });
}

/**
 * Detect API provider from endpoint
 */
function detectApiProvider(endpoint) {
  if (endpoint.includes('bigmodel.cn')) {
    return 'bigmodel';
  } else if (endpoint.includes('anthropic.com')) {
    return 'anthropic';
  } else {
    return 'openai';
  }
}

/**
 * Build request body based on API provider
 */
function buildRequestBody(provider, settings, systemPrompt, prompt) {
  const baseBody = {
    model: settings.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  if (provider === 'bigmodel') {
    return {
      ...baseBody,
      temperature: 0.7,
      top_p: 0.7,
      max_tokens: 2000
    };
  } else if (provider === 'anthropic') {
    return {
      model: settings.model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000
    };
  } else {
    // OpenAI compatible
    return {
      ...baseBody,
      temperature: 0.7,
      max_tokens: 2000
    };
  }
}

/**
 * Build request headers based on API provider
 */
function buildRequestHeaders(provider, apiKey) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (provider === 'bigmodel') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}

/**
 * Extract response content based on API provider
 */
function extractResponseContent(provider, data) {
  if (provider === 'anthropic') {
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }
  } else {
    // OpenAI and BigModel compatible
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
  }

  throw new Error('无法解析API响应');
}

/**
 * Generate AI daily report
 */
async function generateDailyReport(tweets, settings) {
  try {
    // Validate settings
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    if (!settings.apiEndpoint) {
      throw new Error('请先在设置中配置API端点');
    }

    // Detect API provider
    const provider = detectApiProvider(settings.apiEndpoint);

    // Validate endpoint URL
    let apiUrl = settings.apiEndpoint.trim();
    if (!apiUrl.startsWith('https://')) {
      throw new Error('API端点必须以https://开头');
    }

    // Ensure endpoint has proper path for common providers
    if (provider === 'bigmodel' && !apiUrl.includes('/chat/completions')) {
      if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl + 'chat/completions';
      } else {
        apiUrl = apiUrl + '/chat/completions';
      }
    } else if (provider === 'openai' && !apiUrl.includes('/chat/completions')) {
      if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl + 'chat/completions';
      } else {
        apiUrl = apiUrl + '/chat/completions';
      }
    }

    // Build prompt
    const prompt = `请将以下 ${tweets.length} 条推文整理成一份日报，要求：
1. 按主题分类
2. 提取关键信息和洞察
3. 使用清晰的标题和结构
4. 保持简洁但信息丰富

推文内容：
${tweets.map(t => `[@${t.authorHandle}] ${t.author}\n${t.content}\n链接: ${t.url}`).join('\n\n---\n\n')}`;

    const systemPrompt = settings.systemPrompt || '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报。';

    // Build request based on provider
    const requestBody = buildRequestBody(provider, settings, systemPrompt, prompt);
    const requestHeaders = buildRequestHeaders(provider, settings.apiKey);

    console.log('[AI Report] Calling API:', apiUrl);
    console.log('[AI Report] Provider:', provider);
    console.log('[AI Report] Model:', settings.model);

    // Call AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Report] API Error:', response.status, errorText);

      let errorMessage = `API调用失败 (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If parse fails, use status text
        errorMessage = `API调用失败: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[AI Report] API Response:', data);

    // Extract response content
    const reportContent = extractResponseContent(provider, data);

    return {
      success: true,
      report: reportContent,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[AI Report] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get today's tweets
 */
async function getTodaysTweets() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tweets'], (result) => {
      const tweets = result.tweets || [];

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter tweets saved today
      const todaysTweets = tweets.filter(tweet => {
        const savedDate = new Date(tweet.savedAt);
        return savedDate >= today && savedDate < tomorrow;
      });

      resolve(todaysTweets);
    });
  });
}

/**
 * Get tweets by date range
 */
async function getTweetsByDateRange(startDate, endDate) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tweets'], (result) => {
      const tweets = result.tweets || [];

      const filteredTweets = tweets.filter(tweet => {
        const savedDate = new Date(tweet.savedAt);
        return savedDate >= startDate && savedDate < endDate;
      });

      resolve(filteredTweets);
    });
  });
}

/**
 * Delete tweet
 */
async function deleteTweet(tweetId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tweets'], (result) => {
      const tweets = result.tweets || [];
      const filteredTweets = tweets.filter(t => t.id !== tweetId);

      chrome.storage.local.set({ tweets: filteredTweets }, () => {
        resolve({ success: true });
      });
    });
  });
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'generateReport':
      // Generate report for today's tweets
      getTodaysTweets().then(tweets => {
        chrome.storage.local.get(['settings'], (result) => {
          const settings = result.settings || {};

          if (tweets.length === 0) {
            sendResponse({
              success: false,
              error: '今天还没有收藏任何推文'
            });
            return;
          }

          generateDailyReport(tweets, settings).then(sendResponse);
        });
      });
      return true; // Keep message channel open for async response

    case 'generateReportForDate':
      // Generate report for specific date
      const startDate = new Date(message.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      getTweetsByDateRange(startDate, endDate).then(tweets => {
        chrome.storage.local.get(['settings'], (result) => {
          const settings = result.settings || {};

          if (tweets.length === 0) {
            sendResponse({
              success: false,
              error: '该日期没有收藏的推文'
            });
            return;
          }

          generateDailyReport(tweets, settings).then(sendResponse);
        });
      });
      return true;

    case 'deleteTweet':
      deleteTweet(message.tweetId).then(sendResponse);
      return true;

    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse(result.settings || {});
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.get(['settings'], (result) => {
        const currentSettings = result.settings || {};
        const newSettings = { ...currentSettings, ...message.settings };
        chrome.storage.local.set({ settings: newSettings }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case 'getTweets':
      chrome.storage.local.get(['tweets'], (result) => {
        sendResponse(result.tweets || []);
      });
      return true;
  }
});

/**
 * Listen for extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeSettings();
  }
});

/**
 * Initialize on startup
 */
initializeSettings();
