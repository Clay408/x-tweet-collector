// Popup Script for X Tweet Collection Extension

(function() {
  'use strict';

  // DOM Elements
  const elements = {
    listView: document.getElementById('listView'),
    reportView: document.getElementById('reportView'),
    tweetList: document.getElementById('tweetList'),
    tweetCount: document.getElementById('tweetCount'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    backToListBtn: document.getElementById('backToListBtn'),
    copyReportBtn: document.getElementById('copyReportBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    reportContent: document.getElementById('reportContent'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
  };

  let currentReport = '';

  /**
   * Initialize the popup
   */
  function init() {
    loadTweets();
    attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    elements.generateReportBtn.addEventListener('click', handleGenerateReport);
    elements.backToListBtn.addEventListener('click', showListView);
    elements.copyReportBtn.addEventListener('click', handleCopyReport);
    elements.settingsBtn.addEventListener('click', openSettings);
  }

  /**
   * Load and display tweets
   */
  function loadTweets() {
    chrome.runtime.sendMessage({ action: 'getTweets' }, (tweets) => {
      displayTweets(tweets || []);
      updateTweetCount(tweets?.length || 0);
    });
  }

  /**
   * Display tweets grouped by date
   */
  function displayTweets(tweets) {
    if (tweets.length === 0) {
      elements.tweetList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
          </svg>
          <p>还没有收藏任何推文</p>
          <p class="hint">在X.com上点击收藏按钮来保存推文</p>
        </div>
      `;
      return;
    }

    // Group tweets by date
    const groupedTweets = groupTweetsByDate(tweets);

    // Build HTML
    let html = '';
    for (const [dateKey, dateTweets] of Object.entries(groupedTweets)) {
      html += `
        <div class="date-group">
          <h3 class="date-header">${dateKey}</h3>
          ${dateTweets.map(tweet => createTweetCard(tweet)).join('')}
        </div>
      `;
    }

    elements.tweetList.innerHTML = html;

    // Attach delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteTweet);
    });

    // Attach link click listeners
    document.querySelectorAll('.tweet-link').forEach(link => {
      link.addEventListener('click', handleTweetLinkClick);
    });
  }

  /**
   * Group tweets by date
   */
  function groupTweetsByDate(tweets) {
    const grouped = {};

    tweets.forEach(tweet => {
      const date = new Date(tweet.savedAt);
      const dateKey = formatDateKey(date);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(tweet);
    });

    return grouped;
  }

  /**
   * Format date key for grouping
   */
  function formatDateKey(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
      return '今天';
    } else if (isSameDay(date, yesterday)) {
      return '昨天';
    } else {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(date);
    }
  }

  /**
   * Check if two dates are the same day
   */
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Create tweet card HTML
   */
  function createTweetCard(tweet) {
    const time = new Date(tweet.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="tweet-card" data-tweet-id="${tweet.id}">
        <div class="tweet-header">
          <div class="tweet-author">
            <span class="author-name">${escapeHtml(tweet.author)}</span>
            <span class="author-handle">${escapeHtml(tweet.authorHandle)}</span>
          </div>
          <span class="tweet-time">${time}</span>
        </div>
        <div class="tweet-content">
          <a href="${tweet.url}" target="_blank" class="tweet-link" data-url="${tweet.url}">
            ${escapeHtml(tweet.content)}
          </a>
        </div>
        <div class="tweet-footer">
          <span class="save-time">收藏于 ${formatSaveTime(tweet.savedAt)}</span>
          <button class="delete-btn" data-tweet-id="${tweet.id}" title="删除">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Format save time
   */
  function formatSaveTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }

  /**
   * Handle delete tweet
   */
  function handleDeleteTweet(e) {
    const btn = e.currentTarget;
    const tweetId = btn.getAttribute('data-tweet-id');

    if (!confirm('确定要删除这条收藏吗？')) return;

    btn.disabled = true;

    chrome.runtime.sendMessage({
      action: 'deleteTweet',
      tweetId: tweetId
    }, (response) => {
      if (response.success) {
        const card = btn.closest('.tweet-card');
        card.style.animation = 'fadeOut 0.3s ease';

        setTimeout(() => {
          card.remove();
          loadTweets();
          showToast('已删除');

          // Refresh content script bookmarks
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('x.com')) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshBookmarks' });
            }
          });
        }, 300);
      } else {
        showToast('删除失败');
        btn.disabled = false;
      }
    });
  }

  /**
   * Handle tweet link click
   */
  function handleTweetLinkClick(e) {
    e.preventDefault();
    const url = e.currentTarget.getAttribute('data-url');
    chrome.tabs.create({ url });
  }

  /**
   * Handle generate report
   */
  function handleGenerateReport() {
    showLoading(true);

    chrome.runtime.sendMessage({ action: 'generateReport' }, (response) => {
      showLoading(false);

      if (response.success) {
        currentReport = response.report;
        displayReport(response.report);
        showReportView();
      } else {
        showToast(response.error || '生成日报失败');
      }
    });
  }

  /**
   * Display report
   */
  function displayReport(report) {
    elements.reportContent.innerHTML = `
      <div class="report-text">${formatReport(report)}</div>
    `;
  }

  /**
   * Format report for display
   */
  function formatReport(report) {
    return report
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
      .replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>');
  }

  /**
   * Handle copy report
   */
  async function handleCopyReport() {
    try {
      await navigator.clipboard.writeText(currentReport);
      showToast('已复制到剪贴板');
    } catch (error) {
      showToast('复制失败');
    }
  }

  /**
   * Show list view
   */
  function showListView() {
    elements.listView.classList.remove('hidden');
    elements.reportView.classList.add('hidden');
  }

  /**
   * Show report view
   */
  function showReportView() {
    elements.listView.classList.add('hidden');
    elements.reportView.classList.remove('hidden');
  }

  /**
   * Open settings
   */
  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Update tweet count
   */
  function updateTweetCount(count) {
    elements.tweetCount.textContent = `${count} 条收藏`;
  }

  /**
   * Show/hide loading overlay
   */
  function showLoading(show) {
    if (show) {
      elements.loadingOverlay.classList.remove('hidden');
    } else {
      elements.loadingOverlay.classList.add('hidden');
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
    }, 2000);
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  init();
})();
