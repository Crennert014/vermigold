/**
 * Vermigold Almanac — signup receiver
 *
 * Paste this into the Apps Script editor bound to the
 * "Vermigold Almanac Signups" Google Sheet, then deploy it as a Web App
 * (see the deployment steps sent alongside this file). Once deployed,
 * put the resulting Web App URL into EMAIL_CAPTURE_ENDPOINT in script.js.
 *
 * Sheet columns:
 *   A: Email
 *   B: Submitted At (UTC)
 *   C: Source
 *   D: Wants Print Copy   (YES / blank)
 *   E: Wants Course       (YES / blank)
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  var email = '';
  var wantsPrint = false;
  var wantsCourse = false;
  try {
    var body = JSON.parse(e.postData.contents);
    email = (body.email || '').toString().trim();
    wantsPrint = !!body.wantsPrint;
    wantsCourse = !!body.wantsCourse;
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'invalid_json' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'invalid_email' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (wantsPrint || wantsCourse) {
    // A later call for an email already on the sheet (e.g. they reserved a
    // print copy or joined the course waitlist from a different page):
    // flag the existing row instead of adding a duplicate.
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === email) {
        if (wantsPrint) sheet.getRange(i + 1, 4).setValue('YES');
        if (wantsCourse) sheet.getRange(i + 1, 5).setValue('YES');
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // No existing row found (shouldn't normally happen) — fall through
    // and add a fresh one below.
  }

  sheet.appendRow([
    email,
    new Date().toISOString(),
    'vermigold-almanac-funnel',
    wantsPrint ? 'YES' : '',
    wantsCourse ? 'YES' : ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
