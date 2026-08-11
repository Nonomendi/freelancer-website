/* AI assistant widget.
   Conversation lives in sessionStorage — it is gone when the tab closes and
   is never sent anywhere except POST /api/chat on this origin. */
(function () {
  'use strict';

  var widget = document.getElementById('chatWidget');
  if (!widget) return;

  var launcher = document.getElementById('chatLauncher');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatClose');
  var log = document.getElementById('chatLog');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var send = document.getElementById('chatSend');
  var suggestions = document.getElementById('chatSuggestions');
  var unread = document.getElementById('chatUnread');

  var STORAGE_KEY = 'nolundi.chat.v1';
  var messages = [];
  var busy = false;

  /* --- storage ---------------------------------------------------------- */

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      messages = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(messages)) messages = [];
    } catch (e) {
      messages = [];
    }
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      /* private browsing or quota — the chat still works, just isn't kept */
    }
  }

  /* --- rendering -------------------------------------------------------- */

  function bubble(role, text) {
    var wrap = document.createElement('div');
    wrap.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

    var el = document.createElement('div');
    el.className =
      role === 'user'
        ? 'max-w-[85%] bg-brand-primary text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 leading-relaxed'
        : 'max-w-[85%] bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 leading-relaxed';

    // textContent, never innerHTML: model output is not trusted markup.
    el.textContent = text;
    wrap.appendChild(el);
    log.appendChild(wrap);
    scrollToEnd();
    return el;
  }

  function typingIndicator() {
    var wrap = document.createElement('div');
    wrap.className = 'flex justify-start';
    wrap.id = 'chatTyping';
    wrap.innerHTML =
      '<div class="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1">' +
      '<span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>' +
      '<span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>' +
      '<span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>' +
      '</div>';
    wrap.setAttribute('aria-label', 'Assistant is typing');
    log.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  function scrollToEnd() {
    log.scrollTop = log.scrollHeight;
  }

  function renderAll() {
    log.innerHTML = '';
    if (messages.length === 0) {
      bubble('assistant', widget.dataset.greeting);
      return;
    }
    messages.forEach(function (m) {
      bubble(m.role, m.content);
    });
  }

  /* --- open / close ----------------------------------------------------- */

  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.classList.remove('hidden');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.add('hidden');
    if (unread) unread.classList.add('hidden');
    renderAll();
    input.focus();
  }

  function close() {
    panel.classList.add('hidden');
    launcher.classList.remove('hidden');
    launcher.setAttribute('aria-expanded', 'false');
    (lastFocus === launcher || !lastFocus ? launcher : launcher).focus();
  }

  launcher.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
      close();
    }
  });

  /* --- composer --------------------------------------------------------- */

  // Enter sends, Shift+Enter makes a new line.
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });

  // Grow the textarea with its content, up to the max-height in CSS.
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  });

  if (suggestions) {
    suggestions.addEventListener('click', function (e) {
      var btn = e.target.closest('.chat-suggestion');
      if (!btn || busy) return;
      input.value = btn.textContent;
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
  }

  function setBusy(state) {
    busy = state;
    send.disabled = state;
    input.disabled = state;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;

    if (suggestions) suggestions.remove();

    messages.push({ role: 'user', content: text });
    save();
    bubble('user', text);

    input.value = '';
    input.style.height = 'auto';
    setBusy(true);

    ask();
  });

  /* --- request ---------------------------------------------------------- */

  function ask() {
    var typing = typingIndicator();
    var target = null;
    var answer = '';

    function ensureBubble() {
      if (!target) {
        if (typing) typing.remove();
        target = bubble('assistant', '');
      }
      return target;
    }

    function finish() {
      if (typing && typing.parentNode) typing.remove();
      if (answer) {
        messages.push({ role: 'assistant', content: answer });
        save();
      }
      setBusy(false);
      input.focus();
    }

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages })
    })
      .then(function (res) {
        var type = res.headers.get('content-type') || '';

        // Errors and the no-key fallback come back as plain JSON.
        if (type.indexOf('application/json') !== -1) {
          return res.json().then(function (data) {
            ensureBubble().textContent = data.text || 'Something went wrong.';
            answer = data.text || '';
            finish();
          });
        }

        if (!res.body) {
          ensureBubble().textContent = 'Something went wrong.';
          finish();
          return;
        }

        return readStream(res.body, ensureBubble, function (chunk) {
          answer += chunk;
        }).then(finish);
      })
      .catch(function () {
        ensureBubble().textContent =
          "I couldn't reach the server. Nolundi is on WhatsApp and email if you'd rather go direct.";
        answer = '';
        finish();
      });
  }

  /** Parse our SSE envelope: event: delta|fallback|error|done. */
  function readStream(body, ensureBubble, onChunk) {
    var reader = body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) return;

        buffer += decoder.decode(result.value, { stream: true });
        var frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || '';

        frames.forEach(function (frame) {
          var event = 'message';
          var data = '';

          frame.split(/\r?\n/).forEach(function (line) {
            if (line.indexOf('event:') === 0) event = line.slice(6).trim();
            else if (line.indexOf('data:') === 0) data += line.slice(5).trim();
          });

          if (!data) return;

          var payload;
          try {
            payload = JSON.parse(data);
          } catch (err) {
            return;
          }

          if (event === 'delta' && payload.text) {
            ensureBubble().textContent += payload.text;
            onChunk(payload.text);
            scrollToEnd();
          } else if (event === 'fallback' || event === 'error') {
            var el = ensureBubble();
            el.textContent = el.textContent ? el.textContent + '\n\n' + payload.text : payload.text;
            scrollToEnd();
          }
        });

        return pump();
      });
    }

    return pump();
  }

  /* --- init ------------------------------------------------------------- */

  load();
  // A conversation already in progress means the visitor has seen the
  // greeting; don't nag them with the unread dot again.
  if (messages.length && unread) unread.classList.add('hidden');
})();
