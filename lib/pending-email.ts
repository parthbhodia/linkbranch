// The address someone just signed up with, handed to /auth/check-email so the
// resend form does not ask them to type it a second time.
//
// sessionStorage rather than a query param on purpose: an email in the URL ends
// up in browser history, server access logs, and any Referer header the page
// emits. That is a lot of PII exhaust for a convenience prefill.

const PENDING_EMAIL_KEY = "cueful:pending-email";

export function stashPendingEmail(email: string) {
  try {
    window.sessionStorage.setItem(PENDING_EMAIL_KEY, email.trim());
  } catch {
    // Private browsing and storage-blocking extensions both throw here. The
    // form simply starts empty, which is the behaviour we had before.
  }
}

export function readPendingEmail() {
  try {
    return window.sessionStorage.getItem(PENDING_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}
