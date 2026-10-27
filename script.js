/* =========================================================
   All Saints High School — Booking Form Logic
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — edit these values
   --------------------------------------------------------- */
const CONFIG = {
  // 👉 PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE
  //    (Deploy > Manage deployments > copy the URL ending in /exec)
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbymoybz314bfkpLcBqkvwzeKKKkK4Yrp-NKaMTSOI9aGeAhGw04pBOeLP_uxDOB_9UiNw/exec",

  // Messages shown to the user
  MESSAGES: {
    success: "✅ Your booking request was submitted! A confirmation email is on its way.",
    error: "⚠️ Something went wrong submitting your request. Please try again or email scott.jamieson@ocsb.ca.",
    notConfigured: "⚠️ The booking form isn't connected yet (missing Web App URL in script.js).",
    fixErrors: "Please fix the highlighted fields above.",
  },

  // Request timeout in milliseconds
  TIMEOUT_MS: 20000,
};

/* ---------------------------------------------------------
   VALIDATION RULES
   Each rule returns an error string, or "" if valid.
   To validate a new field, add an entry keyed by its input id.
   --------------------------------------------------------- */
const RULES = {
  fullName: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),

  email: (v) =>
    !v.trim()
      ? "Please enter your email address."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? "Please enter a valid email address."
      : "",

  eventName: (v) => (!v.trim() ? "Please enter the event name." : ""),

  eventDate: (v) => {
    if (!v) return "Please choose a date.";
    if (v < todayISO()) return "The event date can't be in the past.";
    return "";
  },

  startTime: (v) => (!v ? "Please choose a start time." : ""),

  endTime: (v) => {
    if (!v) return "Please choose an end time.";
    const start = el("startTime").value;
    if (start && v <= start) return "End time must be after the start time.";
    return "";
  },

  location: (v) => (!v ? "Please select a location." : ""),

  otherLocation: (v) =>
    el("location").value === "Other" && !v.trim() ? "Please specify the location." : "",
};

/* ---------------------------------------------------------
   HELPERS
   --------------------------------------------------------- */
const el = (id) => document.getElementById(id);

/** Today's date as YYYY-MM-DD in the user's local time zone */
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Show or clear an error on a single field. Returns true if valid. */
function validateField(id) {
  const input = el(id);
  const rule = RULES[id];
  if (!input || !rule) return true;

  const message = rule(input.value);
  const wrapper = input.closest(".field");
  wrapper.classList.toggle("invalid", Boolean(message));
  wrapper.querySelector(".error-msg").textContent = message;
  return !message;
}

/** Validate every field with a rule. Focuses the first invalid one. */
function validateForm() {
  let firstInvalid = null;
  Object.keys(RULES).forEach((id) => {
    if (!validateField(id) && !firstInvalid) firstInvalid = el(id);
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

/** Collect all form values into a plain object for the backend */
function collectData(form) {
  const fd = new FormData(form);
  const location = fd.get("location") === "Other"
    ? `Other: ${fd.get("otherLocation").trim()}`
    : fd.get("location");

  return {
    fullName: fd.get("fullName").trim(),
    email: fd.get("email").trim(),
    eventName: fd.get("eventName").trim(),
    eventDate: fd.get("eventDate"),
    startTime: fd.get("startTime"),
    endTime: fd.get("endTime"),
    location,
    equipment: fd.getAll("equipment"),            // array of checked items
    furniture: fd.get("furniture") || "None",
    notes: (fd.get("notes") || "").trim(),
    submittedAt: new Date().toISOString(),
  };
}

/** Status banner above the submit button */
function showStatus(type, message) {
  const box = el("formStatus");
  box.className = `form-status ${type}`;
  box.textContent = message;
  box.hidden = false;
}

function hideStatus() {
  el("formStatus").hidden = true;
}

/** Toggle the loading spinner / disabled state on the button */
function setLoading(isLoading) {
  const btn = el("submitBtn");
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
  btn.querySelector(".btn-label").textContent = isLoading ? "Submitting…" : "Submit Booking Request";
}

/* ---------------------------------------------------------
   API CALL
   --------------------------------------------------------- */
async function sendBooking(data) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    // NOTE: Content-Type is text/plain on purpose. Google Apps Script does not
    // answer CORS preflight requests, which "application/json" would trigger.
    // The body is still JSON and Code.gs parses it with JSON.parse().
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== "success") throw new Error(json.message || "Server error");
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------
   EVENT WIRING
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const form = el("bookingForm");

  // Footer year + no past dates in the picker
  el("year").textContent = new Date().getFullYear();
  el("eventDate").min = todayISO();

  // Show the "Other" location text box only when needed
  el("location").addEventListener("change", (e) => {
    const isOther = e.target.value === "Other";
    el("otherLocationWrap").hidden = !isOther;
    if (isOther) el("otherLocation").focus();
    else validateField("otherLocation"); // clears any stale error
  });

  // Live notes character counter
  el("notes").addEventListener("input", (e) => {
    el("notesCount").textContent = e.target.value.length;
  });

  // Validate on blur, and re-validate as the user fixes an invalid field
  Object.keys(RULES).forEach((id) => {
    const input = el(id);
    input.addEventListener("blur", () => validateField(id));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("invalid")) validateField(id);
    });
  });

  // Changing the start time affects whether the end time is valid
  el("startTime").addEventListener("change", () => {
    if (el("endTime").value) validateField("endTime");
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus();

    if (!validateForm()) {
      showStatus("error", CONFIG.MESSAGES.fixErrors);
      return;
    }

    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL.includes("PASTE_YOUR")) {
      showStatus("error", CONFIG.MESSAGES.notConfigured);
      return;
    }

    setLoading(true);
    try {
      await sendBooking(collectData(form));
      showStatus("success", CONFIG.MESSAGES.success);

      // Reset the form back to its defaults
      form.reset();
      el("otherLocationWrap").hidden = true;
      el("notesCount").textContent = "0";
    } catch (err) {
      console.error("Booking submission failed:", err);
      showStatus("error", CONFIG.MESSAGES.error);
    } finally {
      setLoading(false);
      el("formStatus").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});
