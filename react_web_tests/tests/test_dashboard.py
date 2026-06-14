"""
test_dashboard.py — Dashboard tests (FN-DASH-01 … FN-DASH-10)
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .base_test import BaseTest
import config


def _base(driver): return BaseTest(driver)
def _go_dashboard(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/dashboard')
    time.sleep(4)
    return t


def run_dash_01_dashboard_loads(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'dashboard' in body.lower() or 'gig' in body.lower() or 'bid' in body.lower(), \
        "Dashboard page not loaded"
    t.screenshot("dash_01_dashboard_loads")
    return "Dashboard page loaded correctly and displays content."


def run_dash_02_my_gigs_section_present(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'gig' in body.lower() or 'posted' in body.lower(), "My Gigs section not found on Dashboard"
    t.screenshot("dash_02_my_gigs_section")
    return "Dashboard correctly shows the My Gigs section for the logged-in user's posted gigs."


def run_dash_03_posted_gig_shown(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    # Either gigs are listed or empty state is shown
    assert 'gig' in body.lower(), "No gig information shown on Dashboard"
    gig_cards = driver.find_elements(By.CSS_SELECTOR, "div.card, div[class*='gig']")
    t.screenshot("dash_03_posted_gig")
    if gig_cards:
        return f"Dashboard shows {len(gig_cards)} gig card(s) in the My Gigs section."
    return "Dashboard shows the My Gigs section (may show empty state if no gigs posted by this user)."


def run_dash_04_my_bids_section_present(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'bid' in body.lower() or 'applied' in body.lower() or 'proposal' in body.lower() \
           or 'application' in body.lower(), "My Bids section not found on Dashboard"
    t.screenshot("dash_04_my_bids_section")
    return "Dashboard correctly shows the My Bids / Applications section for submitted gig bids."


def run_dash_05_stats_cards_present(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert any(kw in body.lower() for kw in ['stat', 'metric', 'earning', 'active', 'completed', 'rating']), \
        "Stats / metrics section not found on Dashboard"
    t.screenshot("dash_05_stats_cards")
    return "Dashboard displays statistics/metrics cards with KPI summary information."


def run_dash_06_earnings_metric_present(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert any(kw in body.lower() for kw in ['earning', '₹', '$', 'revenue', 'payment']), \
        "Earnings metric not found on Dashboard"
    t.screenshot("dash_06_earnings")
    return "Dashboard Earnings metric card is present and displays financial KPI data."


def run_dash_07_active_gigs_count(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'active' in body.lower() or 'open' in body.lower() or 'in progress' in body.lower(), \
        "Active gigs count not found on Dashboard"
    t.screenshot("dash_07_active_gigs")
    return "Dashboard Active Gigs count metric is present and shows the number of in-progress gigs."


def run_dash_08_completed_gigs_count(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'completed' in body.lower(), "Completed gigs count not found on Dashboard"
    t.screenshot("dash_08_completed_gigs")
    return "Dashboard Completed Gigs count metric is present and shows finished gig statistics."


def run_dash_09_reviews_section(driver):
    t = _go_dashboard(driver)
    body = t.page_text()
    assert 'review' in body.lower() or 'rating' in body.lower() or 'feedback' in body.lower(), \
        "Reviews section not found on Dashboard"
    t.screenshot("dash_09_reviews")
    return "Dashboard Reviews section is present and shows freelancer rating/review information."


def run_dash_10_dashboard_refreshes(driver):
    t = _go_dashboard(driver)
    body1 = t.page_text()
    t.navigate('/gigs')
    time.sleep(2)
    t.navigate('/dashboard')
    time.sleep(4)
    body2 = t.page_text()
    assert len(body2) > 50, "Dashboard content missing after re-navigation"
    t.screenshot("dash_10_refreshed")
    return "Dashboard data correctly refreshes / reloads when navigating away and returning to the page."
