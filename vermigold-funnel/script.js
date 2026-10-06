// Shared helpers used by every page in this funnel.
window.VG = (function(){
  // ---- Email capture config ---------------------------------------------
  // Every signup (almanac, print reserve, course waitlist) goes to the
  // "Vermigold Almanac Signups" Google Sheet via a small Apps Script Web
  // App bound to that sheet (see vermigold-signups-script.gs). Paste the
  // Web App URL you get after deploying it below.
  var EMAIL_CAPTURE_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

  async function captureEmail(email, extra){
    if (EMAIL_CAPTURE_ENDPOINT && EMAIL_CAPTURE_ENDPOINT.indexOf("PASTE_") !== 0){
      try {
        var payload = Object.assign({ email: email }, extra || {});
        await fetch(EMAIL_CAPTURE_ENDPOINT, {
          method: "POST",
          headers: {"Content-Type":"text/plain;charset=utf-8"}, // avoids a CORS preflight to Apps Script
          body: JSON.stringify(payload)
        });
      } catch (err) {
        // Network hiccup: the visitor still sees success in the UI; the
        // signup just won't be in the sheet. Fine for a marketing funnel.
      }
    }
    return true;
  }

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Email is carried between pages as a query param (?email=...) since
  // this is a set of plain static pages, not a single-page app.
  function getQueryEmail(){
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    } catch (err) {
      return '';
    }
  }

  function withEmail(url, email){
    if (!email) return url;
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    return url + sep + 'email=' + encodeURIComponent(email);
  }

  // Downloads: inside the Claude Artifact viewer a plain <a download>
  // does nothing, so this checks for the `downloads` capability and
  // falls back to a normal same-origin open on any other host.
  async function downloadFile(path, filename, btn){
    var original = btn ? btn.textContent : '';
    if (btn) { btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Preparing…'; }
    try {
      var downloads = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null;
      if (downloads) {
        var resp = await fetch(path);
        var blob = await resp.blob();
        await downloads.save({ filename: filename, data: blob });
        if (btn) btn.textContent = 'Downloaded ✓';
        setTimeout(function(){ if (btn) btn.textContent = original; }, 2500);
        return;
      }
    } catch (err) {
      if (err && err.code === 'declined'){
        if (btn) btn.textContent = original;
        return;
      }
      // fall through to plain open on any other failure
    }
    window.open(path, '_blank');
    if (btn) btn.textContent = original;
  }

  return {
    captureEmail: captureEmail,
    isValidEmail: isValidEmail,
    getQueryEmail: getQueryEmail,
    withEmail: withEmail,
    downloadFile: downloadFile
  };
})();
