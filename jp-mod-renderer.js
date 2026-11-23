// Antigravity Japanese Localization Mod - Advanced Renderer Engine
(function() {
  const MOD_DATA = __JP_MOD_DATA__;
  const dict = MOD_DATA.dict || {};
  const patterns = (MOD_DATA.patterns || []).map(p => ({
    regex: new RegExp(p.regex),
    replace: p.replace
  }));

  // Sort dictionary keys by length descending so longer phrases match first
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

  // Helper: check if element is protected from translation (chat messages, code, user input)
  function isProtected(node) {
    if (!node) return false;
    const parent = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!parent) return false;

    const tag = parent.tagName.toLowerCase();
    if (tag === 'pre' || tag === 'code' || tag === 'script' || tag === 'style' || tag === 'noscript') {
      return true;
    }

    if (parent.closest && (
      parent.closest('pre') ||
      parent.closest('code') ||
      parent.closest('.markdown-body') ||
      parent.closest('[data-message-id]') ||
      parent.closest('[contenteditable="true"]') ||
      parent.closest('.monaco-editor') ||
      parent.closest('.xterm')
    )) {
      return true;
    }

    return false;
  }

  // Normalize string for lookup (trim extra whitespace/newlines)
  function clean(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  // Translate string
  function translateString(text, allowPartial = true) {
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return null;

    const cleaned = clean(trimmed);

    // 1. Direct exact match (original or cleaned)
    if (dict[trimmed]) {
      return text.replace(trimmed, dict[trimmed]);
    }
    if (dict[cleaned]) {
      return text.replace(trimmed, dict[cleaned]);
    }

    // 2. Pattern regex match
    for (const p of patterns) {
      if (p.regex.test(cleaned)) {
        const replaced = cleaned.replace(p.regex, p.replace);
        return text.replace(trimmed, replaced);
      }
    }

    // 3. Partial phrase replacement for tooltips and longer explanations
    if (allowPartial && cleaned.length >= 8) {
      let result = text;
      let matched = false;
      for (const key of sortedKeys) {
        if (key.length >= 8 && result.includes(key)) {
          result = result.split(key).join(dict[key]);
          matched = true;
        }
      }
      if (matched) return result;
    }

    // Special model level suffix: "Flash High" -> "Flash (高)", "Pro High" -> "Pro (高)"
    if (/\bHigh$/.test(cleaned) && (cleaned.includes('Flash') || cleaned.includes('Pro') || cleaned.includes('Gemini'))) {
      return text.replace(/\bHigh$/, '(高)');
    }
    if (/\bLow$/.test(cleaned) && (cleaned.includes('Flash') || cleaned.includes('Pro') || cleaned.includes('Gemini'))) {
      return text.replace(/\bLow$/, '(低)');
    }
    if (/\bMedium$/.test(cleaned) && (cleaned.includes('Flash') || cleaned.includes('Pro') || cleaned.includes('Gemini'))) {
      return text.replace(/\bMedium$/, '(中)');
    }

    return null;
  }

  // Translate a single text node
  function translateTextNode(node) {
    if (isProtected(node)) return;
    const original = node.nodeValue;
    if (!original || !original.trim()) return;

    const translated = translateString(original, true);
    if (translated && translated !== original) {
      node.nodeValue = translated;
    }
  }

  // Translate element attributes (tooltips, placeholders, titles)
  function translateAttributes(el) {
    // Note: placeholders on inputs should be translated even if input is editable
    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-title', 'aria-description'];

    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val && val.trim()) {
        const tr = translateString(val, true);
        if (tr && tr !== val) {
          el.setAttribute(attr, tr);
        }
      }
    }
  }

  // Walk and translate a subtree
  function translateSubtree(root) {
    if (!root) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root);
      if (isProtected(root)) return;
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            translateAttributes(node);
            if (isProtected(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_SKIP;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            if (isProtected(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      },
      false
    );

    let n;
    while ((n = walker.nextNode())) {
      translateTextNode(n);
    }
  }

  // Handle dynamic tooltip and popup containers directly
  function scanPopups() {
    const popups = document.querySelectorAll(
      '[role="tooltip"], [data-radix-popper-content-wrapper], [data-floating-ui-portal], .popover, [role="menu"], [role="dialog"], [role="listbox"]'
    );
    popups.forEach(p => translateSubtree(p));
  }

  // Setup MutationObserver
  function setupObserver() {
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            translateSubtree(node);
          }
        } else if (m.type === 'characterData') {
          translateTextNode(m.target);
        } else if (m.type === 'attributes') {
          if (m.target && m.target.nodeType === Node.ELEMENT_NODE) {
            translateAttributes(m.target);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip']
    });
  }

  // Setup event listeners for hover and click to capture on-demand tooltips & info cards
  function setupInteractionListeners() {
    // When hovering or clicking anywhere, tooltips or popups might appear
    ['mouseover', 'pointerover', 'focusin', 'click'].forEach(evtType => {
      document.addEventListener(evtType, (e) => {
        // Immediate scan on hover/click target and active popups
        if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
          translateAttributes(e.target);
        }
        // Delayed scans to capture asynchronously rendered poppers/tooltips
        setTimeout(scanPopups, 20);
        setTimeout(scanPopups, 100);
        setTimeout(scanPopups, 300);
      }, { passive: true, capture: true });
    });
  }

  function init() {
    translateSubtree(document.body);
    setupObserver();
    setupInteractionListeners();
    console.log('[Antigravity-JP-Mod] Advanced Localization Active (Tooltips, Popups, and All UI).');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
