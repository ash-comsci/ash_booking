# All Saints HS — Tech & Venue Booking

| File | Where it goes |
|---|---|
| `index.html`, `styles.css`, `script.js` | Your GitHub Pages repo (same folder) |
| `Code.gs` | A Google Apps Script project (script.google.com) |

## 1. Set up the Apps Script backend
1. Go to https://script.google.com → **New project**. Name it "All Saints Booking".
2. Delete the starter code and paste in all of `Code.gs`.
3. (Optional) Add more admin emails to `ADMIN_EMAILS` at the top.
4. Choose `testBooking` in the function dropdown → **Run**. Approve the permission prompt
   (this lets the script send email as you). Check your inbox for two sample emails.
5. **Deploy → New deployment** → gear icon → **Web app**
   - Execute as: **Me (scott.jamieson@ocsb.ca)**
   - Who has access: **Anyone**
6. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

> If "Anyone" isn't offered (only "Anyone within OCSB"), your Workspace admin has
> restricted it. "Anyone within OCSB" will only work for people signed in to an OCSB
> Google account, and browser submissions from GitHub Pages will usually fail.
> Ask IT to allow external access for this script.

## 2. Connect the website
Open `script.js` and paste the URL here (line ~11):

```js
SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

Commit and push to GitHub Pages.

## 3. Updating the script later
After editing `Code.gs`, go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
This keeps the same URL. Using "New deployment" instead creates a **new** URL that you'd have to paste into `script.js` again.

## Quick edits
- **Add a location:** add an `<option>` in `index.html`.
- **Add equipment:** copy a `<label class="chip">` block in `index.html`.
- **Change colours:** edit the variables at the top of `styles.css`.
- **Change messages:** edit `CONFIG.MESSAGES` in `script.js`.
- **Add/remove email rows:** edit `EMAIL_FIELDS` in `Code.gs`.

## Notes
- `script.js` sends the JSON with `Content-Type: text/plain`. That's intentional:
  Apps Script can't handle the CORS preflight that `application/json` triggers.
- Free Google accounts can send about 100 emails/day via Apps Script; Workspace accounts about 1,500/day.
  Each booking uses 2+ emails.
