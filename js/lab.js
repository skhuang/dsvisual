(function (global) {
  'use strict';
  function curLang() { return (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en'; }
  function t(k, fb) { return (global.I18N && I18N.t) ? I18N.t(k) : (fb || k); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function getClient() { return (global.cloudClient) ? global.cloudClient() : null; }

  function dsjudgeControlHtml(lab, client, user) {
    if (!lab.dsjudgeUrl) {
      return '<button type="button" class="btn secondary" data-testid="lab-dsjudge" aria-disabled="true" disabled>'
        + t('lab.dsjudgeSoon', 'Practice on dsjudge (coming soon)') + '</button>';
    }
    if (client && client.isConfigured && !user) {
      return '<button type="button" class="btn secondary" data-testid="lab-dsjudge-signin">'
        + t('lab.dsjudgeSignin', 'Sign in to practice on dsjudge') + '</button>';
    }
    return '<a class="btn secondary" data-testid="lab-dsjudge" href="' + lab.dsjudgeUrl + '" target="_blank" rel="noopener">'
      + t('lab.dsjudgePractice', 'Practice on dsjudge') + '</a>';
  }

  var overlay, body, lang, state = null;

  function ensureRefs() {
    overlay = document.getElementById('lab-viewer');
    body = document.getElementById('lab-viewer-body');
    if (overlay && !overlay._wired) {
      overlay._wired = true;
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || (e.target.closest && e.target.closest('[data-lab-close]'))) close();
      });
      document.addEventListener('keydown', function (e) { if (overlay && !overlay.hidden && e.key === 'Escape') close(); });
      var lt = document.getElementById('lab-lang-toggle');
      if (lt) lt.addEventListener('click', function () { lang = lang === 'zh' ? 'en' : 'zh'; render(); });
    }
  }

  function sampleBlock(s, i) {
    return '<div class="lab-sample"><div class="lab-sample-col"><strong>#' + (i + 1) + ' in</strong>'
      + '<pre><code>' + esc(s.in) + '</code></pre></div>'
      + '<div class="lab-sample-col"><strong>out</strong><pre><code>' + esc(s.out) + '</code></pre></div></div>';
  }

  function render() {
    if (!state) return;
    var lab = state.lab;
    var title = lang === 'zh' ? lab.titleZh : lab.titleEn;
    var stmt = (lab.statementHtml && lab.statementHtml[lang]) || lab.statementHtml.en;
    var meta = [];
    if (lab.difficulty) meta.push(t('lab.difficulty', 'Difficulty') + ' ' + '★'.repeat(lab.difficulty));
    if (lab.week) meta.push(t('lab.week', 'Week') + ' ' + lab.week);
    var client = getClient();
    var user = (client && client.getUser) ? client.getUser() : null;
    var dsjudgeControl = dsjudgeControlHtml(lab, client, user);
    body.innerHTML =
      '<div class="lab-head"><h3>' + esc(title) + '</h3><div class="lab-meta muted">' + meta.map(esc).join(' · ') + '</div></div>'
      + '<div class="lab-statement" data-testid="lab-statement">' + stmt + '</div>'
      + '<h4>' + t('lab.samples', 'Samples') + '</h4>'
      + '<div class="lab-samples" data-testid="lab-samples">' + lab.samples.map(sampleBlock).join('') + '</div>'
      + '<div class="lab-actions">'
      + '<a class="btn primary" data-testid="lab-open-repo" href="' + lab.repoUrl + '" target="_blank" rel="noopener">' + t('lab.openRepo', 'Open practice repo') + ' ↗</a> '
      + dsjudgeControl
      + '</div>';
    var signinBtn = body.querySelector('[data-testid="lab-dsjudge-signin"]');
    if (signinBtn) signinBtn.addEventListener('click', function () { var c = getClient(); if (c && c.signIn) c.signIn(); });
    var lt = document.getElementById('lab-lang-toggle'); if (lt) lt.textContent = lang === 'zh' ? 'EN' : '中';
  }

  function open(methodId) {
    ensureRefs();
    var arr = global.LAB_RENDERED && global.LAB_RENDERED[methodId];
    if (!arr || !arr.length || !overlay) return;
    if (state && state.unsub) { try { state.unsub(); } catch (e) { /* ignore */ } state.unsub = null; }
    lang = curLang();
    state = { methodId: methodId, lab: arr[0] }; // pilot: first problem; multi-problem picker is a later enhancement
    render();
    overlay.hidden = false; document.body.style.overflow = 'hidden';
    var panel = overlay.querySelector('.quizviewer-panel'); if (panel) panel.focus();
    var client = getClient();
    if (client && client.subscribeAuthState) {
      state.unsub = client.subscribeAuthState(function () { if (state) render(); });
    }
  }

  function close() {
    if (state && state.unsub) { try { state.unsub(); } catch (e) { /* ignore */ } state.unsub = null; }
    if (overlay) { overlay.hidden = true; document.body.style.overflow = ''; }
    state = null;
  }

  global.LabViewer = { open: open, close: close };
})(typeof window !== 'undefined' ? window : this);
