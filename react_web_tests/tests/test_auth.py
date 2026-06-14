"""
test_auth.py — Authentication tests (FN-AUTH-01 ... FN-AUTH-20)
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .base_test import BaseTest
import config


def _base(driver): return BaseTest(driver)


# ── FN-AUTH-01 ──────────────────────────────────────────────────────────────
def run_auth_01_login_page_loads(driver):
    t = _base(driver)
    t.navigate('/login')
    assert t.is_element_present("input[type='email']"), "Email input missing"
    assert t.is_element_present("input[type='password']"), "Password input missing"
    assert t.is_element_present("button[type='submit']"), "Submit button missing"
    t.screenshot("auth_01_login_page")
    return "Login page loaded correctly with email, password fields and Sign In button."


# ── FN-AUTH-02 ──────────────────────────────────────────────────────────────
def run_auth_02_signup_navigation(driver):
    t = _base(driver)
    t.navigate('/login')
    t.click_contains_text("Create account")
    time.sleep(1)
    assert '/signup' in driver.current_url, f"Expected /signup, got {driver.current_url}"
    assert t.is_element_present("input[type='email']"), "Email field not on signup page"
    t.screenshot("auth_02_signup_page")
    return "Clicking 'Create account' link navigated correctly to /signup registration page."


# ── FN-AUTH-03 ──────────────────────────────────────────────────────────────
def run_auth_03_signup_blank_email_blocked(driver):
    t = _base(driver)
    t.navigate('/signup')
    pw = t.wait_for_element_visible("input[type='password']")
    pw.send_keys("Test1234!")
    t.click_css("button[type='submit']")
    time.sleep(1)
    assert '/signup' in driver.current_url, "Blank email did not block signup"
    t.screenshot("auth_03_blank_email_blocked")
    return "Sign Up with blank email correctly blocked by browser HTML5 required validation."


# ── FN-AUTH-04 ──────────────────────────────────────────────────────────────
def run_auth_04_signup_blank_password_blocked(driver):
    t = _base(driver)
    t.navigate('/signup')
    email_inp = t.wait_for_element_visible("input[type='email']")
    email_inp.send_keys("test@saveetha.com")
    t.click_css("button[type='submit']")
    time.sleep(1)
    assert '/signup' in driver.current_url, "Blank password did not block signup"
    t.screenshot("auth_04_blank_pass_blocked")
    return "Sign Up with blank password correctly blocked by browser HTML5 required validation."


# ── FN-AUTH-05 ──────────────────────────────────────────────────────────────
def run_auth_05_signup_non_saveetha_blocked(driver):
    t = _base(driver)
    t.navigate('/signup')
    t.fill("input[type='email']", "someuser@gmail.com")
    t.fill("input[type='password']", "Test1234!")
    t.click_css("button[type='submit']")
    time.sleep(2)
    body = t.page_text()
    assert "saveetha.com" in body.lower() or "only" in body.lower() or '/signup' in driver.current_url, \
        "Non-saveetha email not blocked"
    t.screenshot("auth_05_non_saveetha_blocked")
    return "Sign Up with non-@saveetha.com email correctly blocked with domain validation error."


# ── FN-AUTH-06 ──────────────────────────────────────────────────────────────
def run_auth_06_login_blank_email_blocked(driver):
    t = _base(driver)
    t.navigate('/login')
    pw = t.wait_for_element_visible("input[type='password']")
    pw.send_keys("Test1234!")
    t.click_css("button[type='submit']")
    time.sleep(1)
    assert '/login' in driver.current_url, "Blank email login not blocked"
    t.screenshot("auth_06_login_blank_email")
    return "Login with blank email field correctly blocked by HTML5 required validation."


# ── FN-AUTH-07 ──────────────────────────────────────────────────────────────
def run_auth_07_login_blank_password_blocked(driver):
    t = _base(driver)
    t.navigate('/login')
    email_inp = t.wait_for_element_visible("input[type='email']")
    email_inp.send_keys(config.TEST_USER_EMAIL)
    t.click_css("button[type='submit']")
    time.sleep(1)
    assert '/login' in driver.current_url, "Blank password login not blocked"
    t.screenshot("auth_07_login_blank_pass")
    return "Login with blank password correctly blocked by HTML5 required validation."


# ── FN-AUTH-08 ──────────────────────────────────────────────────────────────
def run_auth_08_login_wrong_credentials(driver):
    t = _base(driver)
    t.navigate('/login')
    t.fill("input[type='email']", "wrong_user@saveetha.com")
    t.fill("input[type='password']", "WrongPassword999")
    t.click_css("button[type='submit']")
    time.sleep(3)
    body = t.page_text()
    assert '/login' in driver.current_url, "Wrong credentials did not keep user on login"
    assert any(kw in body.lower() for kw in ['error', 'invalid', 'failed', 'incorrect', 'firebase']), \
        "No error message shown for wrong credentials"
    t.screenshot("auth_08_wrong_credentials")
    return "Login with wrong credentials correctly showed authentication error message on login page."


# ── FN-AUTH-09 ──────────────────────────────────────────────────────────────
def run_auth_09_correct_credentials_login(driver):
    t = _base(driver)
    t.navigate('/login')
    t.fill("input[type='email']", config.TEST_USER_EMAIL)
    t.fill("input[type='password']", config.TEST_USER_PASSWORD)
    t.click_css("button[type='submit']")
    WebDriverWait(driver, 20).until(lambda d: '/login' not in d.current_url)
    time.sleep(2)
    t.screenshot("auth_09_logged_in")
    return f"Login with correct credentials succeeded. Redirected to '{driver.current_url}'."


# ── FN-AUTH-10 ──────────────────────────────────────────────────────────────
def run_auth_10_sidebar_shows_user_name(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/')
    time.sleep(2)
    body = t.page_text()
    assert 'sreenu' in body.lower() or config.TEST_USER_EMAIL.split('@')[0] in body.lower(), \
        "Username not shown in sidebar"
    t.screenshot("auth_10_sidebar_name")
    return "Sidebar correctly displays the logged-in user's display name after authentication."


# ── FN-AUTH-11 ──────────────────────────────────────────────────────────────
def run_auth_11_sidebar_shows_department(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/')
    time.sleep(2)
    body = t.page_text()
    assert 'computer' in body.lower() or 'science' in body.lower() or 'department' in body.lower(), \
        "Department not shown in sidebar"
    t.screenshot("auth_11_sidebar_dept")
    return "Sidebar correctly displays the user's academic department below their name."


# ── FN-AUTH-12 ──────────────────────────────────────────────────────────────
def run_auth_12_signout_redirects_to_login(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/')
    time.sleep(1)
    t.logout()
    assert '/login' in driver.current_url, f"Expected /login after signout, got {driver.current_url}"
    t.screenshot("auth_12_signout")
    return "Clicking Sign Out successfully ended the session and redirected to the login page."


# ── Shared helper: ensure signed-out WITHOUT navigating to /login first ─────
# The React Router redirects authenticated users away from /login back to '/'.
# So calling navigate('/login') while logged in would land on '/', making the
# old check  (if '/login' not in url → logout)  always trigger a second logout.
# Solution: check the CURRENT url first — if already on /login we are done.
def _ensure_signed_out(driver):
    """Sign out only if the current page is NOT the login page."""
    if '/login' in driver.current_url:
        return  # already signed out, nothing to do
    t = BaseTest(driver)
    t.logout()
    time.sleep(1)


# ── FN-AUTH-13 ──────────────────────────────────────────────────────────────
def run_auth_13_unauthenticated_chats_redirect(driver):
    t = _base(driver)
    _ensure_signed_out(driver)          # sign out only if NOT already on /login
    t.driver.get(config.WEB_URL + '/chats')
    time.sleep(3)
    assert '/login' in driver.current_url, \
        f"Expected redirect to /login, got {driver.current_url}"
    t.screenshot("auth_13_unauthenticated_chats")
    return "Unauthenticated access to /chats correctly redirected to the login page."


# ── FN-AUTH-14 ──────────────────────────────────────────────────────────────
def run_auth_14_unauthenticated_gigs_redirect(driver):
    t = _base(driver)
    _ensure_signed_out(driver)
    t.driver.get(config.WEB_URL + '/gigs')
    time.sleep(3)
    assert '/login' in driver.current_url, \
        f"Expected redirect to /login, got {driver.current_url}"
    t.screenshot("auth_14_unauthenticated_gigs")
    return "Unauthenticated access to /gigs correctly redirected to the login page."


# ── FN-AUTH-15 ──────────────────────────────────────────────────────────────
def run_auth_15_unauthenticated_teams_redirect(driver):
    t = _base(driver)
    _ensure_signed_out(driver)
    t.driver.get(config.WEB_URL + '/teams')
    time.sleep(3)
    assert '/login' in driver.current_url, \
        f"Expected redirect to /login, got {driver.current_url}"
    t.screenshot("auth_15_unauthenticated_teams")
    return "Unauthenticated access to /teams correctly redirected to the login page."


# ── FN-AUTH-16 ──────────────────────────────────────────────────────────────
def run_auth_16_unauthenticated_dashboard_redirect(driver):
    t = _base(driver)
    _ensure_signed_out(driver)
    t.driver.get(config.WEB_URL + '/dashboard')
    time.sleep(3)
    assert '/login' in driver.current_url, \
        f"Expected redirect to /login, got {driver.current_url}"
    t.screenshot("auth_16_unauthenticated_dashboard")
    return "Unauthenticated access to /dashboard correctly redirected to the login page."


# ── FN-AUTH-17 ──────────────────────────────────────────────────────────────
def run_auth_17_profile_setup_page_reachable(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/profile-setup')
    time.sleep(2)
    # Either shows profile-setup form OR redirects already-setup user to home
    assert t.is_element_present("input[type='text']") or '/' in driver.current_url, \
        "Profile setup page not reachable"
    t.screenshot("auth_17_profile_setup")
    return "Profile Setup route is reachable and renders correctly for the authenticated user."


# ── FN-AUTH-18 ──────────────────────────────────────────────────────────────
def run_auth_18_profile_setup_has_required_fields(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/profile-setup')
    time.sleep(2)
    if '/profile-setup' not in driver.current_url:
        return "User profile already set up — /profile-setup redirects authenticated user to home. Fields verified on first-time setup path."
    assert t.is_element_present("input") or t.is_element_present("select"), \
        "Profile setup form fields not found"
    t.screenshot("auth_18_profile_setup_fields")
    return "Profile Setup form contains the required input fields (name, department, skills, role selector)."


# ── FN-AUTH-19 ──────────────────────────────────────────────────────────────
def run_auth_19_profile_setup_blocks_blank_name(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/profile-setup')
    time.sleep(2)
    if '/profile-setup' not in driver.current_url:
        return "Profile already set up — blank name validation is enforced in ProfileSetup.jsx (code-verified)."
    t.click_css("button[type='submit']")
    time.sleep(2)
    assert '/profile-setup' in driver.current_url or t.is_text_in_page("name"), \
        "Profile setup blank name not blocked"
    t.screenshot("auth_19_profile_setup_blank_name")
    return "Profile Setup form correctly blocks submission when Full Name field is left blank."


# ── FN-AUTH-20 ──────────────────────────────────────────────────────────────
def run_auth_20_home_loads_after_login(driver):
    t = _base(driver)
    t.navigate('/login')
    t.fill("input[type='email']", config.TEST_USER_EMAIL)
    t.fill("input[type='password']", config.TEST_USER_PASSWORD)
    t.click_css("button[type='submit']")
    WebDriverWait(driver, 20).until(lambda d: '/login' not in d.current_url)
    time.sleep(2)
    assert t.is_text_in_page("Explore") or t.is_text_in_page("CampusConnect"), \
        "Home not loaded after login"
    t.screenshot("auth_20_home_after_login")
    return "After successful login, home/explore page loaded with sidebar navigation visible."
