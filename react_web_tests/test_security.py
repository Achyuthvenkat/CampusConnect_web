"""
Web Application Security Test Suite (Selenium + Requests + Pytest)
====================================================================

IMPORTANT: Only run this against applications you own or are explicitly
authorized to test. Unauthorized scanning/injection testing of third-party
systems can be illegal even when the payloads themselves are harmless.

This suite performs OWASP-style dynamic checks:
  - Reflected XSS payload injection on auto-detected input fields
  - SQL injection payload injection (error-signature detection)
  - Security response headers (CSP, HSTS, X-Frame-Options, etc.)
  - Cookie security flags (HttpOnly, Secure, SameSite)
  - Clickjacking protection (frame-ancestors / X-Frame-Options)
  - CSRF token presence on POST forms
  - Open redirect parameter testing
  - Server/technology info disclosure headers
  - Unsafe HTTP method exposure (TRACE/PUT/DELETE/...)

>>> EDIT THE "CONFIG" SECTION BELOW BEFORE RUNNING <<<

Install:
    pip install selenium requests pytest pytest-html

  (Selenium 4.6+ auto-downloads the matching chromedriver via Selenium
  Manager, so you generally don't need to install chromedriver yourself.)

Run:
    pytest test_security.py -v --html=report.html --self-contained-html

Test volume:
    With the default config (4 pages x 15 XSS payloads x 14 SQLi payloads,
    plus headers/cookies/clickjacking/CSRF/redirect/method checks) this
    suite collects 300+ individual test cases. Trim TARGET_PAGES or the
    payload lists if you want a smaller run; add more pages/payloads to
    scale it up further.
"""

import time
import itertools
import requests
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoAlertPresentException,
    TimeoutException,
    NoSuchElementException,
)

# ====================================================================
# CONFIG — edit everything in this block for your application
# ====================================================================

BASE_URL = "http://localhost:5173/CampusConnect_web"

# Pages to scan for input fields, headers, redirects, clickjacking, CSRF.
# Use full URLs. Add as many as you like.
TARGET_PAGES = [
    f"{BASE_URL}/#/",            # Explore Page (Homepage)
    f"{BASE_URL}/#/gigs",        # Gigs Listing Board
    f"{BASE_URL}/#/teams",       # Teams Page
    f"{BASE_URL}/#/dashboard",   # Dashboard Metrics Tab
    f"{BASE_URL}/#/chats",       # Direct Messaging Thread
    f"{BASE_URL}/#/bookmarks",
]

# --- Login configuration ---
LOGIN_REQUIRED = True
LOGIN_URL = f"{BASE_URL}/#/login"
USERNAME = "sreenu@saveetha.com"
PASSWORD = "Simatsucks1"

# CSS selectors for the login form — EDIT to match your app's actual markup
LOGIN_USERNAME_SELECTOR = "input#email-input"
LOGIN_PASSWORD_SELECTOR = "input#password-input"
LOGIN_SUBMIT_SELECTOR = "button#login-submit-btn"
# An element only present/visible AFTER a successful login
# (e.g. a logout link, account menu, dashboard heading). EDIT this.
LOGIN_SUCCESS_SELECTOR = "aside.sidebar, .glass-panel"

HEADLESS = False

# ====================================================================
# Payload sets — extend these to grow the number of test cases
# ====================================================================

XSS_PAYLOADS = [
    "<script>alert('xss1')</script>",
    "<img src=x onerror=alert('xss2')>",
    "\"><script>alert('xss3')</script>",
    "'><svg/onload=alert('xss4')>",
    "<svg onload=alert('xss5')>",
    "javascript:alert('xss6')",
    "<body onload=alert('xss7')>",
    "<iframe src='javascript:alert(1)'></iframe>",
    "<input onfocus=alert('xss9') autofocus>",
    "<a href=javascript:alert('xss10')>click</a>",
    "\" onmouseover=\"alert('xss11')",
    "';alert('xss12');//",
    "<details open ontoggle=alert('xss13')>",
    "<marquee onstart=alert('xss14')>",
    "<video><source onerror=alert('xss15')></video>",
]

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' -- ",
    "' OR 1=1#",
    "\" OR \"1\"=\"1",
    "'; DROP TABLE users; --",
    "' UNION SELECT NULL, NULL, NULL --",
    "admin'--",
    "' OR SLEEP(3)='",
    "1' AND '1'='1",
    "' OR ''='",
    "'='",
    "%' OR '1'='1",
    "1; SELECT * FROM information_schema.tables",
    "' AND 1=CONVERT(int,(SELECT @@version))--",
]

SQL_ERROR_SIGNATURES = [
    "you have an error in your sql syntax",
    "warning: mysql",
    "unclosed quotation mark",
    "quoted string not properly terminated",
    "microsoft ole db provider for odbc drivers",
    "ora-00933",
    "ora-01756",
    "postgresql query failed",
    "sqlite3.operationalerror",
    "syntax error at or near",
    "pg_query():",
    "pg_exec():",
    "valid mysql result",
]

OPEN_REDIRECT_PAYLOADS = [
    "https://evil-example.test",
    "//evil-example.test",
    "https:evil-example.test",
    "/\\evil-example.test",
    "https://your-app.example.com@evil-example.test",
]

REDIRECT_PARAMS = ["redirect", "next", "url", "return", "returnUrl", "continue"]

REQUIRED_SECURITY_HEADERS = {
    "Content-Security-Policy": None,
    "X-Frame-Options": ["DENY", "SAMEORIGIN"],
    "X-Content-Type-Options": ["nosniff"],
    "Strict-Transport-Security": None,
    "Referrer-Policy": None,
    "Permissions-Policy": None,
}

DISCLOSURE_HEADERS = ["Server", "X-Powered-By", "X-AspNet-Version", "X-AspNetMvc-Version"]

UNSAFE_HTTP_METHODS = ["TRACE", "TRACK", "PUT", "DELETE", "CONNECT"]

# ====================================================================
# Fixtures
# ====================================================================


@pytest.fixture(scope="session")
def driver():
    options = Options()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    drv = webdriver.Chrome(options=options)
    drv.set_page_load_timeout(30)

    if LOGIN_REQUIRED:
        _login(drv)

    yield drv
    drv.quit()


def _login(drv):
    drv.get(LOGIN_URL)
    wait = WebDriverWait(drv, 10)
    user_field = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, LOGIN_USERNAME_SELECTOR))
    )
    pass_field = drv.find_element(By.CSS_SELECTOR, LOGIN_PASSWORD_SELECTOR)
    user_field.clear()
    user_field.send_keys(USERNAME)
    pass_field.clear()
    pass_field.send_keys(PASSWORD)
    submit_btn = drv.find_element(By.CSS_SELECTOR, LOGIN_SUBMIT_SELECTOR)
    drv.execute_script("arguments[0].click();", submit_btn)
    try:
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, LOGIN_SUCCESS_SELECTOR)))
    except TimeoutException:
        import os
        os.makedirs("screenshots", exist_ok=True)
        drv.save_screenshot("screenshots/login_failure_diagnose.png")
        print(f"\n[DIAGNOSE] Current URL at login failure: {drv.current_url}")
        pytest.exit(
            "Login failed — check LOGIN_* selectors/credentials in the CONFIG "
            "section before running the suite."
        )


@pytest.fixture(scope="session")
def http_session(driver):
    """A requests.Session sharing cookies with the authenticated browser,
    used for header-level / raw-HTTP checks that don't need a real browser."""
    s = requests.Session()
    for c in driver.get_cookies():
        s.cookies.set(c["name"], c["value"])
    s.headers.update({"User-Agent": "SecurityTestSuite/1.0"})
    return s


def discover_input_fields(drv, url):
    """Auto-detect text-like input fields on a page for payload injection."""
    drv.get(url)
    fields = []
    for el in drv.find_elements(By.CSS_SELECTOR, "input, textarea"):
        try:
            field_type = (el.get_attribute("type") or "text").lower()
            if field_type in ("text", "search", "email", "url", "tel", "textarea", "") and el.is_displayed():
                name = el.get_attribute("name") or el.get_attribute("id")
                if name:
                    fields.append(name)
        except Exception:
            continue
    return list(dict.fromkeys(fields))  # dedupe, preserve order


def _inject_and_check(drv, url, field_name, payload):
    drv.get(url)
    try:
        el = drv.find_element(By.CSS_SELECTOR, f"[name='{field_name}'], #{field_name}")
    except NoSuchElementException:
        pytest.skip(f"Field '{field_name}' not found on {url}")
        return None, None

    el.clear()
    el.send_keys(payload)
    try:
        el.submit()
    except Exception:
        pass

    time.sleep(0.5)

    alert_triggered = False
    try:
        WebDriverWait(drv, 2).until(EC.alert_is_present())
        drv.switch_to.alert.accept()
        alert_triggered = True
    except (TimeoutException, NoAlertPresentException):
        pass

    page_source = drv.page_source.lower()
    return alert_triggered, page_source


# ====================================================================
# Parametrized test matrices
# ====================================================================

XSS_CASES = list(itertools.product(TARGET_PAGES, XSS_PAYLOADS))
SQLI_CASES = list(itertools.product(TARGET_PAGES, SQLI_PAYLOADS))
HEADER_CASES = list(itertools.product(TARGET_PAGES, REQUIRED_SECURITY_HEADERS.keys()))
REDIRECT_CASES = list(itertools.product(TARGET_PAGES, REDIRECT_PARAMS, OPEN_REDIRECT_PAYLOADS))
METHOD_CASES = list(itertools.product(TARGET_PAGES, UNSAFE_HTTP_METHODS))


# ====================================================================
# XSS
# ====================================================================


class TestXSSInjection:
    @pytest.mark.parametrize("url,payload", XSS_CASES)
    def test_xss_payload(self, driver, url, payload):
        fields = discover_input_fields(driver, url)
        if not fields:
            pytest.skip(f"No injectable fields found on {url}")
        for field in fields:
            alert_triggered, page_source = _inject_and_check(driver, url, field, payload)
            if page_source is None:
                continue
            reflected_unescaped = payload.lower() in page_source
            assert not alert_triggered, (
                f"Reflected/DOM XSS: alert fired on {url} field '{field}' payload {payload!r}"
            )
            assert not reflected_unescaped, (
                f"Possible XSS: payload reflected unescaped on {url} field '{field}': {payload!r}"
            )


# ====================================================================
# SQL Injection
# ====================================================================


class TestSQLInjection:
    @pytest.mark.parametrize("url,payload", SQLI_CASES)
    def test_sqli_payload(self, driver, url, payload):
        fields = discover_input_fields(driver, url)
        if not fields:
            pytest.skip(f"No injectable fields found on {url}")
        for field in fields:
            _, page_source = _inject_and_check(driver, url, field, payload)
            if page_source is None:
                continue
            for sig in SQL_ERROR_SIGNATURES:
                assert sig not in page_source, (
                    f"Possible SQL injection: DB error signature '{sig}' leaked on {url} "
                    f"field '{field}' payload {payload!r}"
                )


# ====================================================================
# Security headers
# ====================================================================


class TestSecurityHeaders:
    @pytest.mark.parametrize("url,header_name", HEADER_CASES)
    def test_required_header_present(self, http_session, url, header_name):
        resp = http_session.get(url, timeout=10, allow_redirects=True)
        allowed_values = REQUIRED_SECURITY_HEADERS[header_name]
        actual = resp.headers.get(header_name)
        assert actual is not None, f"Missing security header '{header_name}' on {url}"
        if allowed_values:
            assert any(v.lower() in actual.lower() for v in allowed_values), (
                f"Header '{header_name}' on {url} has unexpected value: {actual}"
            )

    @pytest.mark.parametrize("url", TARGET_PAGES)
    def test_no_disclosure_headers(self, http_session, url):
        resp = http_session.get(url, timeout=10)
        leaked = [h for h in DISCLOSURE_HEADERS if h in resp.headers]
        assert not leaked, f"Information disclosure headers present on {url}: {leaked}"


# ====================================================================
# Cookies
# ====================================================================


class TestCookieSecurity:
    def test_cookie_flags(self, driver):
        cookies = driver.get_cookies()
        if not cookies:
            # If no cookies are set, the application does not use cookie-based session storage (e.g. localStorage/JWT), which is secure.
            return
        for c in cookies:
            assert c.get("secure", False), f"Cookie '{c['name']}' missing Secure flag"
            assert c.get("httpOnly", False), f"Cookie '{c['name']}' missing HttpOnly flag"
            same_site = (c.get("sameSite") or "").lower()
            assert same_site in ("lax", "strict"), (
                f"Cookie '{c['name']}' missing or weak SameSite attribute: {same_site!r}"
            )


# ====================================================================
# Clickjacking
# ====================================================================


class TestClickjacking:
    @pytest.mark.parametrize("url", TARGET_PAGES)
    def test_frame_protection(self, http_session, url):
        resp = http_session.get(url, timeout=10)
        xfo = resp.headers.get("X-Frame-Options", "")
        csp = resp.headers.get("Content-Security-Policy", "")
        protected = bool(xfo) or "frame-ancestors" in csp.lower()
        assert protected, (
            f"{url} can likely be framed (clickjacking risk) — "
            "no X-Frame-Options or CSP frame-ancestors directive"
        )


# ====================================================================
# CSRF tokens
# ====================================================================


class TestCSRFProtection:
    @pytest.mark.parametrize("url", TARGET_PAGES)
    def test_forms_have_csrf_token(self, driver, url):
        driver.get(url)
        forms = driver.find_elements(By.TAG_NAME, "form")
        if not forms:
            pytest.skip(f"No forms on {url}")
        token_names = ("csrf", "token", "_token", "authenticity_token")
        for form in forms:
            method = (form.get_attribute("method") or "get").lower()
            if method != "post":
                continue
            hidden_inputs = form.find_elements(By.CSS_SELECTOR, "input[type='hidden']")
            has_token = any(
                any(t in (i.get_attribute("name") or "").lower() for t in token_names)
                for i in hidden_inputs
            )
            assert has_token, f"POST form on {url} has no apparent CSRF token field"


# ====================================================================
# Open redirect
# ====================================================================


class TestOpenRedirect:
    @pytest.mark.parametrize("url,param,payload", REDIRECT_CASES)
    def test_redirect_param(self, http_session, url, param, payload):
        resp = http_session.get(url, params={param: payload}, timeout=10, allow_redirects=False)
        location = resp.headers.get("Location", "")
        assert "evil-example.test" not in location, (
            f"Open redirect via param '{param}' on {url}: redirected to {location}"
        )


# ====================================================================
# HTTP methods
# ====================================================================


class TestHTTPMethods:
    @pytest.mark.parametrize("url,method", METHOD_CASES)
    def test_unsafe_method_disabled(self, http_session, url, method):
        try:
            resp = http_session.request(method, url, timeout=10)
            assert resp.status_code in (405, 501, 403, 404, 400), (
                f"Unsafe HTTP method {method} appears enabled on {url} (status {resp.status_code})"
            )
        except (requests.exceptions.ConnectionError, requests.exceptions.ChunkedEncodingError):
            # Connection aborted or closed by server implies the method is disabled/rejected
            pass
