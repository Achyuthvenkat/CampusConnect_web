import os

# ── Target App URL ──────────────────────────────────────────────────────────
# The React/Vite app must be running on this URL before tests are executed.
WEB_URL = os.environ.get("CAMPUSCONNECT_WEB_URL", "http://localhost:5173")

# ── Test Credentials ────────────────────────────────────────────────────────
TEST_USER_EMAIL    = "sreenu@saveetha.com"
TEST_USER_PASSWORD = "Simatsucks1"

# ── Selenium Config ─────────────────────────────────────────────────────────
TIMEOUT          = 12   # Default WebDriverWait timeout (seconds)
PAGE_LOAD_WAIT   = 3    # Seconds to let a page settle after navigation
HEADLESS         = os.environ.get("HEADLESS_TESTS", "false").lower() == "true"
WINDOW_SIZE      = (1400, 900)

# ── Screenshot dir ──────────────────────────────────────────────────────────
SCREENSHOTS_DIR  = os.path.join(os.path.dirname(__file__), "screenshots")
REPORT_PATH      = os.path.join(os.path.dirname(__file__), "test_report.xlsx")
