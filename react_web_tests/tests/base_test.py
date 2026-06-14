"""
base_test.py — BaseTest helper class for CampusConnect React E2E tests.

Provides:
- Chrome WebDriver setup / teardown
- Common DOM interaction helpers (wait, click, fill, assert text)
- Screenshot capture
- Login / logout helpers
"""
import os
import sys
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# Allow importing config from parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class BaseTest:
    """Selenium helper utilities for the React CampusConnect web app."""

    def __init__(self, driver=None):
        self.driver = driver

    # ─── Driver Lifecycle ────────────────────────────────────────────────────

    def setup_driver(self):
        """Create a Chrome WebDriver session and load the app URL."""
        opts = webdriver.ChromeOptions()
        opts.add_argument(f"--window-size={config.WINDOW_SIZE[0]},{config.WINDOW_SIZE[1]}")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-extensions")
        if config.HEADLESS:
            opts.add_argument("--headless=new")
        opts.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

        print("Starting Chrome WebDriver...")
        self.driver = webdriver.Chrome(options=opts)
        self.driver.implicitly_wait(2)
        
        # Load the base URL
        self.driver.get(config.WEB_URL)
        print(f"Opened: {config.WEB_URL}")
        time.sleep(config.PAGE_LOAD_WAIT)
        return self.driver

    def teardown_driver(self):
        """Quit the WebDriver session."""
        if self.driver:
            self.driver.quit()
            self.driver = None

    # ─── Wait helpers ────────────────────────────────────────────────────────

    def wait_for_url_contains(self, fragment, timeout=None):
        t = timeout or config.TIMEOUT
        WebDriverWait(self.driver, t).until(
            EC.url_contains(fragment)
        )

    def wait_for_element(self, css_selector, timeout=None):
        t = timeout or config.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, css_selector))
        )

    def wait_for_element_visible(self, css_selector, timeout=None):
        t = timeout or config.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector))
        )

    def wait_for_xpath_visible(self, xpath, timeout=None):
        t = timeout or config.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located((By.XPATH, xpath))
        )

    def wait_for_text_in_page(self, text, timeout=None):
        t = timeout or config.TIMEOUT
        WebDriverWait(self.driver, t).until(
            EC.text_to_be_present_in_element((By.TAG_NAME, "body"), text)
        )

    # ─── Navigation helpers ──────────────────────────────────────────────────

    def navigate(self, path):
        """Navigate to an app path."""
        # Convert path to HashRouter format if it doesn't already contain #
        if not path.startswith('/#'):
            hash_path = '/#' + path if path.startswith('/') else '/#/' + path
        else:
            hash_path = path
        
        url = config.WEB_URL.rstrip('/') + hash_path
        self.driver.get(url)
        time.sleep(config.PAGE_LOAD_WAIT)

    def current_path(self):
        """Return just the pathname part of the current URL."""
        from urllib.parse import urlparse
        return urlparse(self.driver.current_url).path

    def go_back(self):
        self.driver.back()
        time.sleep(config.PAGE_LOAD_WAIT)

    # ─── Interaction helpers ─────────────────────────────────────────────────

    def click_css(self, css_selector, timeout=None):
        """Wait for element and click it."""
        el = self.wait_for_element_visible(css_selector, timeout)
        try:
            el.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", el)
        return el

    def click_text(self, text, timeout=None):
        """Click the first visible element whose text matches."""
        t = timeout or config.TIMEOUT
        xpath = f"//*[normalize-space(text())='{text}' and not(self::script)]"
        el = WebDriverWait(self.driver, t).until(
            EC.element_to_be_clickable((By.XPATH, xpath))
        )
        try:
            el.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", el)
        return el

    def click_contains_text(self, text, timeout=None):
        """Click first element containing given text."""
        t = timeout or config.TIMEOUT
        xpath = f"//*[contains(text(),'{text}') and not(self::script)]"
        try:
            el = WebDriverWait(self.driver, t).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            try:
                el.click()
            except Exception:
                self.driver.execute_script("arguments[0].click();", el)
            return el
        except Exception:
            return None

    def fill(self, css_selector, text, clear=True):
        """Type text into an input field."""
        el = self.wait_for_element_visible(css_selector)
        if clear:
            el.clear()
        el.send_keys(text)
        return el

    def fill_by_placeholder(self, placeholder, text, clear=True):
        """Type text into an input field found by placeholder attribute."""
        xpath = f"//input[@placeholder='{placeholder}'] | //textarea[@placeholder='{placeholder}']"
        el = self.wait_for_xpath_visible(xpath)
        if clear:
            el.clear()
        el.send_keys(text)
        return el

    def get_text(self, css_selector):
        el = self.wait_for_element_visible(css_selector)
        return el.text.strip()

    def is_element_present(self, css_selector, timeout=3):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, css_selector))
            )
            return True
        except Exception:
            return False

    def is_xpath_present(self, xpath, timeout=3):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return True
        except Exception:
            return False

    def is_text_in_page(self, text, timeout=3):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.text_to_be_present_in_element((By.TAG_NAME, "body"), text)
            )
            return True
        except Exception:
            return self.driver.find_element(By.TAG_NAME, "body").text.find(text) >= 0

    def page_text(self):
        return self.driver.find_element(By.TAG_NAME, "body").text

    def page_source(self):
        return self.driver.page_source

    def count_elements(self, css_selector):
        return len(self.driver.find_elements(By.CSS_SELECTOR, css_selector))

    # ─── Login / Logout ──────────────────────────────────────────────────────

    def login(self, email=None, password=None):
        """Login to the application and wait for redirect."""
        email    = email    or config.TEST_USER_EMAIL
        password = password or config.TEST_USER_PASSWORD

        self.navigate('/login')
        time.sleep(1)

        email_input = self.wait_for_element_visible("input[type='email']")
        email_input.clear()
        email_input.send_keys(email)

        pw_input = self.wait_for_element_visible("input[type='password']")
        pw_input.clear()
        pw_input.send_keys(password)

        self.click_css("button[type='submit']")
        # Wait until we leave /login
        WebDriverWait(self.driver, 15).until(
            lambda d: '/login' not in d.current_url
        )
        time.sleep(config.PAGE_LOAD_WAIT)

    def logout(self):
        """Click Sign Out in the sidebar."""
        try:
            signout = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//*[normalize-space(text())='Sign Out']"))
            )
            try:
                signout.click()
            except Exception:
                self.driver.execute_script("arguments[0].click();", signout)
            WebDriverWait(self.driver, 8).until(EC.url_contains('/login'))
            time.sleep(1)
        except Exception:
            self.navigate('/login')

    def ensure_logged_in(self):
        """Login if not already authenticated."""
        if '/login' in self.driver.current_url or self.current_path() == '/login':
            self.login()

    # ─── Screenshot ──────────────────────────────────────────────────────────

    def screenshot(self, name):
        """Save a screenshot to the screenshots directory."""
        os.makedirs(config.SCREENSHOTS_DIR, exist_ok=True)
        ts = int(time.time())
        path = os.path.join(config.SCREENSHOTS_DIR, f"{name}_{ts}.png")
        try:
            self.driver.save_screenshot(path)
            print(f"  Screenshot: {path}")
        except Exception as e:
            print(f"  Screenshot failed: {e}")
        return path

    # ─── Browser Logs ────────────────────────────────────────────────────────

    def get_console_errors(self):
        """Return list of SEVERE browser console messages."""
        try:
            logs = self.driver.get_log('browser')
            return [l['message'] for l in logs if l['level'] == 'SEVERE']
        except Exception:
            return []
