// Content Script for X.com Tweet Collection
// Handles tweet detection and bookmark button injection

(function() {
  'use strict';

  // Track processed tweets to avoid duplicates
  const processedTweets = new Set();
  let observer = null;

  /**
   * Extract tweet data from tweet element
   */
  function extractTweetData(tweetElement) {
    try {
      // Get tweet ID from URL
      const linkElement = tweetElement.querySelector('a[href*="/status/"]');
      if (!linkElement) return null;

      const tweetUrl = linkElement.href;
      const tweetIdMatch = tweetUrl.match(/\/status\/(\d+)/);
      if (!tweetIdMatch) return null;

      const tweetId = tweetIdMatch[1];

      // Get tweet text
      const testId = tweetElement.querySelector('[data-testid="tweetText"]');
      const tweetText = testId ? testId.innerText.trim() : '';

      // Get author info
      const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
      let authorName = '';
      let authorUsername = '';

      if (authorElement) {
        // Author display name
        const nameSpan = authorElement.querySelector('span');
        authorName = nameSpan ? nameSpan.innerText.trim() : '';

        // Author username (handle)
        const usernameLinks = authorElement.querySelectorAll('a');
        usernameLinks.forEach(link => {
          const text = link.innerText.trim();
          if (text.startsWith('@')) {
            authorUsername = text;
          }
        });
      }

      // Get timestamp
      const timeElement = tweetElement.querySelector('time');
      const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();

      return {
        id: tweetId,
        content: tweetText,
        author: authorName,
        authorHandle: authorUsername,
        timestamp: timestamp,
        url: tweetUrl,
        savedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  /**
   * Create bookmark button element
   */
  function createBookmarkButton(tweetId) {
    const button = document.createElement('button');
    button.setAttribute('data-tweet-id', tweetId);
    button.className = 'x-bookmark-btn';
    button.setAttribute('aria-label', '收藏推文');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
    `;

    // Check if already bookmarked
    chrome.storage.local.get(['tweets'], (result) => {
      const tweets = result.tweets || [];
      const isBookmarked = tweets.some(t => t.id === tweetId);
      if (isBookmarked) {
        button.classList.add('bookmarked');
      }
    });

    return button;
  }

  /**
   * Handle bookmark button click
   */
  function handleBookmarkClick(e) {
    const button = e.currentTarget;
    const tweetId = button.getAttribute('data-tweet-id');
    const tweetElement = button.closest('[data-testid="tweet"]');

    if (!tweetElement) return;

    const tweetData = extractTweetData(tweetElement);
    if (!tweetData) return;

    chrome.storage.local.get(['tweets'], (result) => {
      const tweets = result.tweets || [];
      const existingIndex = tweets.findIndex(t => t.id === tweetId);

      if (existingIndex >= 0) {
        // Remove bookmark
        tweets.splice(existingIndex, 1);
        button.classList.remove('bookmarked');
        showNotification('已取消收藏');
      } else {
        // Add bookmark
        tweets.push(tweetData);
        button.classList.add('bookmarked');
        showNotification('收藏成功');
      }

      chrome.storage.local.set({ tweets }, () => {
        // Notify popup to refresh
        chrome.runtime.sendMessage({ action: 'tweetsUpdated' });
      });
    });
  }

  /**
   * Show notification to user
   */
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'x-bookmark-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /**
   * Inject bookmark button into tweet action bar
   */
  function injectBookmarkButton(tweetElement) {
    try {
      const tweetIdMatch = tweetElement.querySelector('a[href*="/status/"]');
      if (!tweetIdMatch) {
        console.log('[X Bookmark] No status link found in tweet');
        return false;
      }

      const tweetId = tweetIdMatch.href.match(/\/status\/(\d+)/)?.[1];
      if (!tweetId) {
        console.log('[X Bookmark] Could not extract tweet ID');
        return false;
      }

      if (processedTweets.has(tweetId)) {
        return false;
      }

      // Find action bar - try multiple selectors
      let actionBar = tweetElement.querySelector('[role="group"]');
      if (!actionBar) {
        // Try alternative selector for X.com's new structure
        actionBar = tweetElement.querySelector('[data-testid="tweet-actions"]');
      }

      if (!actionBar) {
        console.log('[X Bookmark] No action bar found for tweet:', tweetId);
        return false;
      }

      // Check if button already exists
      if (actionBar.querySelector('.x-bookmark-btn')) {
        return false;
      }

      // Create and insert button
      const button = createBookmarkButton(tweetId);
      button.addEventListener('click', handleBookmarkClick);

      // Insert button in action bar
      actionBar.appendChild(button);

      console.log('[X Bookmark] Button injected for tweet:', tweetId);
      processedTweets.add(tweetId);
      return true;
    } catch (error) {
      console.error('[X Bookmark] Error injecting button:', error);
      return false;
    }
  }

  /**
   * Process all tweets on the page
   */
  function processTweets() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    console.log('[X Bookmark] Found tweets:', tweets.length);

    let injectedCount = 0;
    tweets.forEach(tweet => {
      if (injectBookmarkButton(tweet)) {
        injectedCount++;
      }
    });

    if (injectedCount > 0) {
      console.log('[X Bookmark] Injected buttons for', injectedCount, 'new tweets');
    }
  }

  /**
   * Initialize observer to watch for new tweets
   */
  function initObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          processTweets();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize the content script
   */
  function init() {
    console.log('[X Bookmark] Content script loaded');

    // Process existing tweets
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[X Bookmark] DOM loaded, processing tweets');
        processTweets();
        initObserver();
      });
    } else {
      console.log('[X Bookmark] Document ready, processing tweets immediately');
      // Small delay to ensure X.com has rendered tweets
      setTimeout(() => {
        processTweets();
        initObserver();
      }, 1000);
    }

    // Also try processing on window load for safety
    window.addEventListener('load', () => {
      console.log('[X Bookmark] Window loaded, processing tweets again');
      setTimeout(() => {
        processTweets();
      }, 500);
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[X Bookmark] Received message:', message.action);

      if (message.action === 'refreshBookmarks') {
        // Update button states
        chrome.storage.local.get(['tweets'], (result) => {
          const tweets = result.tweets || [];
          const tweetIds = new Set(tweets.map(t => t.id));

          document.querySelectorAll('.x-bookmark-btn').forEach(button => {
            const tweetId = button.getAttribute('data-tweet-id');
            if (tweetIds.has(tweetId)) {
              button.classList.add('bookmarked');
            } else {
              button.classList.remove('bookmarked');
            }
          });
        });
      } else if (message.action === 'toggleCurrentTweet') {
        // Find the current/centered tweet and toggle it
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        let currentTweet = null;

        // Try to find the tweet that's most visible/centered
        let maxVisibility = 0;
        tweets.forEach(tweet => {
          const rect = tweet.getBoundingClientRect();
          const centerY = window.innerHeight / 2;
          const distance = Math.abs(rect.top + rect.height / 2 - centerY);
          const visibility = 1 - (distance / window.innerHeight);

          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            currentTweet = tweet;
          }
        });

        if (currentTweet) {
          const button = currentTweet.querySelector('.x-bookmark-btn');
          if (button) {
            button.click();
            showNotification('已切换收藏状态');
            sendResponse({ success: true });
          } else {
            showNotification('未找到收藏按钮');
            sendResponse({ success: false });
          }
        } else {
          showNotification('未找到推文');
          sendResponse({ success: false });
        }
      }

      return true; // Keep message channel open
    });
  }

  // Start the script
  init();
})();
