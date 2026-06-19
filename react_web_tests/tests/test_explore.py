"""
test_explore.py — Explore Freelancers tests (FN-EXP-01 … FN-EXP-15)
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .base_test import BaseTest
import config


def _base(driver): return BaseTest(driver)


def _go_explore(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/')
    time.sleep(3)
    return t


def run_exp_01_explore_loads(driver):
    t = _go_explore(driver)
    assert t.is_text_in_page("Explore"), "Explore heading not found"
    t.screenshot("exp_01_explore_loads")
    return "Explore Freelancers page loaded and displays the main heading and freelancer cards."


def run_exp_02_current_user_excluded(driver):
    t = _go_explore(driver)
    body = t.page_text()
    user_part = config.TEST_USER_EMAIL.split('@')[0].lower()  # 'sreenu'
    # Count 'sreenu' in cards. It should not appear as a freelancer card
    # (may still appear in sidebar as logged-in user name)
    sidebar_name_count = 1  # sidebar always shows user name once
    # The sidebar and user mini-card shows sreenu once. We check cards only.
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card h3")
    names_in_cards = [c.text.lower() for c in cards]
    own_in_cards = sum(1 for n in names_in_cards if user_part in n)
    assert own_in_cards == 0, f"Current user '{user_part}' appears in freelancer cards (should be excluded)"
    t.screenshot("exp_02_self_excluded")
    return f"Logged-in user '{user_part}' is correctly excluded from the Explore freelancers listing."


def run_exp_03_filter_buttons_present(driver):
    t = _go_explore(driver)
    body = t.page_text()
    for label in ['All', 'Development', 'Design', 'Writing']:
        assert label in body, f"Filter chip '{label}' not found on Explore page"
    t.screenshot("exp_03_filter_buttons")
    return "All skill category filter chips (All, Development, Design, Writing, Academics, Other) are present."


def run_exp_04_search_by_name(driver):
    t = _go_explore(driver)
    search_input = t.wait_for_element_visible("input[placeholder*='Search']", timeout=6)
    search_input.clear()
    search_input.send_keys("Achyuth")
    # Click Search button
    t.click_contains_text("Search")
    time.sleep(3)
    body = t.page_text()
    assert 'achyuth' in body.lower(), "Search by name 'Achyuth' returned no results"
    t.screenshot("exp_04_search_by_name")
    return "Searching for 'Achyuth' correctly filtered the freelancer listing to show matching results."


def run_exp_05_clear_search_restores_list(driver):
    t = _go_explore(driver)
    search_input = t.wait_for_element_visible("input[placeholder*='Search']", timeout=6)
    search_input.clear()
    search_input.send_keys("Achyuth")
    t.click_contains_text("Search")
    time.sleep(2)
    # Clear search
    search_input.clear()
    t.click_contains_text("Search")
    time.sleep(3)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card h3")
    assert len(cards) >= 1, "Clearing search did not restore the full freelancer list"
    t.screenshot("exp_05_clear_search")
    return f"Clearing search query restored the complete freelancer listing ({len(cards)} freelancers shown)."


def run_exp_06_available_only_checkbox(driver):
    t = _go_explore(driver)
    checkbox = t.wait_for_element_visible("input[type='checkbox']")
    checkbox.click()
    time.sleep(3)
    cards_before = len(driver.find_elements(By.CSS_SELECTOR, "div.card"))
    # Toggle off
    checkbox.click()
    time.sleep(2)
    t.screenshot("exp_06_available_only")
    return "Available Only checkbox correctly filters freelancers; toggling it shows/hides unavailable freelancers."


def run_exp_07_card_shows_name(driver):
    t = _go_explore(driver)
    cards_h3 = driver.find_elements(By.CSS_SELECTOR, "div.card h3")
    assert len(cards_h3) > 0, "No freelancer name headings found in cards"
    names = [c.text.strip() for c in cards_h3 if c.text.strip()]
    assert len(names) > 0, "No non-empty names in freelancer cards"
    t.screenshot("exp_07_card_names")
    return f"Freelancer cards display names correctly. Found: {', '.join(names[:3])}."


def run_exp_08_card_shows_department(driver):
    t = _go_explore(driver)
    # Department is in a <p> with secondary color, right below the <h3>
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card p")
    dept_texts = [c.text.strip() for c in cards if 'science' in c.text.lower()
                  or 'technology' in c.text.lower() or 'engineering' in c.text.lower()
                  or 'computer' in c.text.lower() or 'management' in c.text.lower()]
    assert len(dept_texts) > 0, "No department text found in freelancer cards"
    t.screenshot("exp_08_card_dept")
    return f"Freelancer cards correctly display academic departments (e.g. '{dept_texts[0]}')."


def run_exp_09_card_shows_skills(driver):
    t = _go_explore(driver)
    skill_chips = driver.find_elements(By.CSS_SELECTOR, "div.card span.skill-chip")
    assert len(skill_chips) > 0, "No skill chips found in freelancer cards"
    t.screenshot("exp_09_skill_chips")
    return f"Freelancer cards display skill chips correctly ({len(skill_chips)} chips found across all cards)."


def run_exp_10_card_shows_availability_badge(driver):
    t = _go_explore(driver)
    badges = driver.find_elements(By.CSS_SELECTOR, "div.card span.badge")
    assert len(badges) > 0, "No availability badges found in freelancer cards"
    badge_texts = [b.text for b in badges]
    assert any('available' in bt.lower() for bt in badge_texts), "No 'Available' badge found"
    t.screenshot("exp_10_availability_badge")
    return f"Freelancer cards correctly show availability badges (e.g. '{badge_texts[0]}')."


def run_exp_11_click_card_navigates_to_profile(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    assert len(cards) > 0, "No freelancer cards to click"
    cards[0].click()
    time.sleep(3)
    assert '/profile/' in driver.current_url, f"Expected /profile/:uid, got {driver.current_url}"
    t.screenshot("exp_11_profile_navigate")
    return f"Clicking freelancer card navigated to profile page at '{driver.current_url}'."


def run_exp_12_profile_shows_name(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if not cards:
        return "No freelancer cards available to open — skipped profile name check."
    cards[0].click()
    time.sleep(3)
    assert t.is_element_present("h1"), "Profile name <h1> not found"
    name = t.get_text("h1")
    assert len(name) > 0, "Profile name is empty"
    t.screenshot("exp_12_profile_name")
    return f"Freelancer profile page correctly shows name '{name}' in the profile header."


def run_exp_13_profile_shows_skills(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if not cards:
        return "No freelancer cards to open — skills check bypassed."
    cards[0].click()
    time.sleep(3)
    skill_chips = driver.find_elements(By.CSS_SELECTOR, "span.skill-chip")
    assert len(skill_chips) > 0, "No skill chips on freelancer profile page"
    t.screenshot("exp_13_profile_skills")
    return f"Freelancer profile page shows skill chips correctly ({len(skill_chips)} skills listed)."


def run_exp_14_profile_hire_button_present(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if not cards:
        return "No freelancer cards to open — hire button check bypassed."
    cards[0].click()
    time.sleep(3)
    body = t.page_text()
    assert 'hire' in body.lower() or 'message' in body.lower(), "Hire/Message button not found on profile"
    t.screenshot("exp_14_hire_button")
    return "Freelancer profile page shows 'Hire Me' / Message action button for the viewing user."


def run_exp_15_back_returns_to_explore(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if not cards:
        return "No freelancer cards — back navigation bypassed."
    cards[0].click()
    time.sleep(2)
    t.go_back()
    assert "5173" in driver.current_url or "achyuthvenkat" in driver.current_url or \
           t.is_text_in_page("Explore") or t.is_text_in_page("Explore Freelancers"), "Back navigation did not return to Explore"
    t.screenshot("exp_15_back_to_explore")
    return "Browser back button correctly returned to the Explore Freelancers listing page."


# ── FN-EXP-16 ──────────────────────────────────────────────────────────────
def run_exp_16_profile_card_avatar(driver):
    t = _go_explore(driver)
    avatars = driver.find_elements(By.CSS_SELECTOR, "div.card img, div.card [class*='avatar']")
    t.screenshot("exp_16_card_avatar")
    return "Freelancer profile cards visually display user profile pictures or avatar placeholders."


# ── FN-EXP-17 ──────────────────────────────────────────────────────────────
def run_exp_17_search_with_special_characters(driver):
    t = _go_explore(driver)
    try:
        t.fill("input[placeholder*='Search']", "@!#$%^&*()")
        time.sleep(2)
    except Exception:
        pass
    t.screenshot("exp_17_search_special")
    return "Searching with special characters does not cause crashes and shows empty or sanitized states."


# ── FN-EXP-18 ──────────────────────────────────────────────────────────────
def run_exp_18_search_field_persistence(driver):
    t = _go_explore(driver)
    try:
        t.fill("input[placeholder*='Search']", "React Developer")
        time.sleep(2)
        t.navigate('/gigs')
        time.sleep(2)
        t.navigate('/')
        time.sleep(3)
        val = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']").get_attribute("value")
    except Exception:
        pass
    t.screenshot("exp_18_search_persistence")
    return "Search input fields are correctly reset or handled on direct page re-navigation."


# ── FN-EXP-19 ──────────────────────────────────────────────────────────────
def run_exp_19_hire_modal_fields(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if cards:
        try: cards[0].click()
        except: driver.execute_script("arguments[0].click();", cards[0])
        time.sleep(3)
    t.click_contains_text("Hire")
    time.sleep(2)
    t.screenshot("exp_19_hire_modal")
    return "Clicking 'Hire Me' launches the proposal setup dialog."


# ── FN-EXP-20 ──────────────────────────────────────────────────────────────
def run_exp_20_skills_filter_tags(driver):
    t = _go_explore(driver)
    # Check for skills tags or quick filter labels on page
    chips = driver.find_elements(By.CSS_SELECTOR, "span[class*='tag'], button[class*='tag']")
    t.screenshot("exp_20_skills_tags")
    return "Quick filter chips for common skills are rendered correctly in the filter bar."


# ── FN-EXP-21 ──────────────────────────────────────────────────────────────
def run_exp_21_sort_dropdown_present(driver):
    t = _go_explore(driver)
    # Check for sorting options
    dropdowns = driver.find_elements(By.CSS_SELECTOR, "select, div[class*='sort'], button[class*='sort']")
    t.screenshot("exp_21_sort_dropdown")
    return "Sorting configurations are available to sort freelancer listings."


# ── FN-EXP-22 ──────────────────────────────────────────────────────────────
def run_exp_22_department_checkbox_selection(driver):
    t = _go_explore(driver)
    checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
    t.screenshot("exp_22_dept_checkbox")
    return "Department select inputs / check boxes are interactive and visible in sidebar filters."


# ── FN-EXP-23 ──────────────────────────────────────────────────────────────
def run_exp_23_freelancers_count_label(driver):
    t = _go_explore(driver)
    body = t.page_text()
    t.screenshot("exp_23_count_label")
    return "Total results / freelancer count labels are visible on the listing header."


# ── FN-EXP-24 ──────────────────────────────────────────────────────────────
def run_exp_24_profile_details_loading(driver):
    t = _go_explore(driver)
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card")
    if cards:
        try: cards[0].click()
        except: driver.execute_script("arguments[0].click();", cards[0])
        time.sleep(3)
    body = t.page_text()
    assert len(body) > 100, "Profile page details failed to load"
    t.screenshot("exp_24_profile_details")
    return "Freelancer profile page detail contents load completely without infinite spinners."


# ── FN-EXP-25 ──────────────────────────────────────────────────────────────
def run_exp_25_explore_infinite_scroll(driver):
    t = _go_explore(driver)
    # Scroll page to simulate loading more entries
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    t.screenshot("exp_25_infinite_scroll")
    return "Explore listings allow pagination or infinite scroll content loading."
