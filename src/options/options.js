// Options Script for X Tweet Collection Extension

(function() {
  'use strict';

  // DOM Elements
  const elements = {
    settingsForm: document.getElementById('settingsForm'),
    apiEndpoint: document.getElementById('apiEndpoint'),
    apiKey: document.getElementById('apiKey'),
    model: document.getElementById('model'),
    systemPrompt: document.getElementById('systemPrompt'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    testApiBtn: document.getElementById('testApiBtn'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    toast: document.getElementById('toast')
  };

  // API Presets
  const presets = {
    bigmodel: {
      apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4',
      systemPrompt: '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报，按主题分类，提取关键信息和洞察。'
    },
    openai: {
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4',
      systemPrompt: '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报，按主题分类，提取关键信息和洞察。'
    },
    anthropic: {
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-sonnet-20240229',
      systemPrompt: '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报，按主题分类，提取关键信息和洞察。'
    },
    custom: {
      apiEndpoint: '',
      model: '',
      systemPrompt: '你是一个专业的内容整理助手。请将用户收藏的推文整理成一份结构清晰的日报，按主题分类，提取关键信息和洞察。'
    }
  };

  /**
   * Initialize the options page
   */
  function init() {
    loadSettings();
    attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    elements.settingsForm.addEventListener('submit', handleSaveSettings);
    elements.toggleApiKey.addEventListener('click', handleToggleApiKey);
    elements.testApiBtn.addEventListener('click', handleTestApi);

    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => handlePresetSelect(btn));
    });
  }

  /**
   * Load settings from storage
   */
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
      if (settings && Object.keys(settings).length > 0) {
        elements.apiEndpoint.value = settings.apiEndpoint || '';
        elements.apiKey.value = settings.apiKey || '';
        elements.model.value = settings.model || '';
        elements.systemPrompt.value = settings.systemPrompt || '';
      }
    });
  }

  /**
   * Handle save settings
   */
  function handleSaveSettings(e) {
    e.preventDefault();

    const settings = {
      apiEndpoint: elements.apiEndpoint.value.trim(),
      apiKey: elements.apiKey.value.trim(),
      model: elements.model.value.trim(),
      systemPrompt: elements.systemPrompt.value.trim()
    };

    // Validate
    if (!settings.apiEndpoint) {
      showToast('请输入API Endpoint');
      return;
    }

    if (!settings.apiKey) {
      showToast('请输入API Key');
      return;
    }

    if (!settings.model) {
      showToast('请输入Model名称');
      return;
    }

    // Save settings
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: settings
    }, (response) => {
      if (response.success) {
        showToast('设置已保存');
      } else {
        showToast('保存失败');
      }
    });
  }

  /**
   * Handle toggle API key visibility
   */
  function handleToggleApiKey() {
    const input = elements.apiKey;
    const isPassword = input.type === 'password';

    input.type = isPassword ? 'text' : 'password';

    // Update icon
    elements.toggleApiKey.classList.toggle('visible', isPassword);
  }

  /**
   * Handle test API connection
   */
  async function handleTestApi() {
    const apiEndpoint = elements.apiEndpoint.value.trim();
    const apiKey = elements.apiKey.value.trim();
    const model = elements.model.value.trim();

    // Validate
    if (!apiEndpoint) {
      showToast('请先输入API Endpoint');
      return;
    }

    if (!apiKey) {
      showToast('请先输入API Key');
      return;
    }

    if (!model) {
      showToast('请先输入Model名称');
      return;
    }

    // Detect provider and prepare URL
    let apiUrl = apiEndpoint;
    let headers = {
      'Content-Type': 'application/json'
    };
    let body = {};

    if (apiEndpoint.includes('bigmodel.cn')) {
      // BigModel/智谱AI
      if (!apiEndpoint.includes('/chat/completions')) {
        apiUrl = apiEndpoint.endsWith('/')
          ? apiEndpoint + 'chat/completions'
          : apiEndpoint + '/chat/completions';
      }
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: model,
        messages: [
          { role: 'user', content: '你好' }
        ],
        max_tokens: 10
      };
    } else if (apiEndpoint.includes('anthropic.com')) {
      // Anthropic
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
      body = {
        model: model,
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10
      };
    } else {
      // OpenAI compatible
      if (!apiEndpoint.includes('/chat/completions')) {
        apiUrl = apiEndpoint.endsWith('/')
          ? apiEndpoint + 'chat/completions'
          : apiEndpoint + '/chat/completions';
      }
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: model,
        messages: [
          { role: 'system', content: 'Test' },
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10
      };
    }

    // Show loading state
    elements.testApiBtn.disabled = true;
    elements.testApiBtn.innerHTML = `
      <span class="spinner"></span>
      测试中...
    `;

    try {
      console.log('[Test API] Calling:', apiUrl);
      console.log('[Test API] Body:', body);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showToast('连接成功！配置有效');
      } else {
        const errorText = await response.text();
        console.error('[Test API] Error:', response.status, errorText);

        let errorMsg = `连接失败 (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMsg = errorData.error.message;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          errorMsg = `连接失败: ${response.status} ${response.statusText}`;
        }

        showToast(errorMsg);
      }
    } catch (error) {
      console.error('[Test API] Exception:', error);
      showToast(`连接失败: ${error.message}`);
    } finally {
      // Reset button
      elements.testApiBtn.disabled = false;
      elements.testApiBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        测试连接
      `;
    }
  }

  /**
   * Handle preset selection
   */
  function handlePresetSelect(btn) {
    const preset = btn.getAttribute('data-preset');
    const config = presets[preset];

    if (config) {
      // 移除所有按钮的选中状态
      elements.presetBtns.forEach(b => b.classList.remove('active'));

      // 添加当前按钮的选中状态
      btn.classList.add('active');

      elements.apiEndpoint.value = config.apiEndpoint;
      elements.model.value = config.model;
      elements.systemPrompt.value = config.systemPrompt;

      showToast(`已应用${btn.textContent.trim()}配置`);
    }
  }

  /**
   * Show toast message
   */
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3000);
  }

  // Initialize
  init();
})();
