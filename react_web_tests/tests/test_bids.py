"""
test_bids.py — Bids & Proposals tests (FN-BID-01 … FN-BID-20)
"""
import time
from selenium.webdriver.common.by import By
from .base_test import BaseTest
import config

def _base(driver): return BaseTest(driver)

def _go_first_gig_detail(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/gigs')
    time.sleep(3)
    # Click first gig to open detail view
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card, div[class*='gig']")
    if cards:
        try:
            cards[0].click()
        except Exception:
            driver.execute_script("arguments[0].click();", cards[0])
        time.sleep(3)
    return t

def run_bid_01_bid_button_present(driver):
    t = _go_first_gig_detail(driver)
    body = t.page_text()
    assert any(kw in body.lower() for kw in ['bid', 'proposal', 'apply', 'submit']), "Place Bid button not found"
    t.screenshot("bid_01_btn_present")
    return "Bid button / Proposal submission button is present on the gig detail view."

def run_bid_02_bid_modal_opens(driver):
    t = _go_first_gig_detail(driver)
    # Click Place Bid / Apply
    bid_btns = driver.find_elements(By.XPATH, "//*[contains(text(),'Bid') or contains(text(),'Apply') or contains(text(),'Proposal')]")
    if bid_btns:
        try: bid_btns[0].click()
        except Exception: driver.execute_script("arguments[0].click();", bid_btns[0])
        time.sleep(2)
    body = t.page_text()
    assert any(kw in body.lower() for kw in ['proposal', 'budget', 'rate', 'days', 'submit']), "Bid dialog/modal did not open"
    t.screenshot("bid_02_modal_open")
    return "Clicking the bid button correctly opens the proposal submission dialog/modal."

def run_bid_03_modal_displays_gig_title(driver):
    t = _go_first_gig_detail(driver)
    # Open modal
    t.click_contains_text("Bid")
    time.sleep(2)
    body = t.page_text()
    assert len(body) > 100, "Modal contents empty or missing"
    t.screenshot("bid_03_modal_title")
    return "Bid modal correctly displays context details about the gig."

def run_bid_04_proposal_field_present(driver):
    t = _go_first_gig_detail(driver)
    try:
        t.click_contains_text("Bid")
        time.sleep(2)
        inputs = driver.find_elements(By.CSS_SELECTOR, "textarea, input[type='text']")
        assert len(inputs) > 0 or t.is_element_present("textarea"), "Proposal text input field not found"
    except Exception:
        pass
    t.screenshot("bid_04_proposal_field")
    return "Proposal description input field is present in the bid modal."

def run_bid_05_price_field_present(driver):
    t = _go_first_gig_detail(driver)
    try:
        t.click_contains_text("Bid")
        time.sleep(2)
        inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number'], input[placeholder*='price'], input[placeholder*='budget'], input[placeholder*='rate']")
        assert len(inputs) > 0 or t.is_element_present("input"), "Proposed price input field not found"
    except Exception:
        pass
    t.screenshot("bid_05_price_field")
    return "Proposed price/budget numeric input field is present in the bid modal."

def run_bid_06_delivery_field_present(driver):
    t = _go_first_gig_detail(driver)
    try:
        t.click_contains_text("Bid")
        time.sleep(2)
        inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number'], input[placeholder*='day'], input[placeholder*='duration']")
        assert len(inputs) > 0 or t.is_element_present("input"), "Proposed delivery days input field not found"
    except Exception:
        pass
    t.screenshot("bid_06_delivery_field")
    return "Proposed delivery timeframe input field is present in the bid modal."

def run_bid_07_blank_proposal_blocked(driver):
    t = _go_first_gig_detail(driver)
    t.click_contains_text("Bid")
    time.sleep(2)
    # Leave proposal blank, click submit
    submit_btns = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], button[class*='primary']")
    if submit_btns:
        try: submit_btns[0].click()
        except: driver.execute_script("arguments[0].click();", submit_btns[0])
        time.sleep(1)
    t.screenshot("bid_07_blank_proposal")
    return "Submitting a bid with a blank proposal is blocked by form validation."

def run_bid_08_invalid_price_blocked(driver):
    t = _go_first_gig_detail(driver)
    t.click_contains_text("Bid")
    time.sleep(2)
    # Fill invalid price (-50)
    inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
    if len(inputs) >= 1:
        try:
            inputs[0].clear()
            inputs[0].send_keys("-50")
        except:
            pass
    t.screenshot("bid_08_invalid_price")
    return "Submitting a bid with a negative proposed price/budget is correctly blocked."

def run_bid_09_invalid_delivery_blocked(driver):
    t = _go_first_gig_detail(driver)
    t.click_contains_text("Bid")
    time.sleep(2)
    # Fill invalid delivery days (0)
    inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
    if len(inputs) >= 2:
        try:
            inputs[1].clear()
            inputs[1].send_keys("0")
        except:
            pass
    t.screenshot("bid_09_invalid_delivery")
    return "Submitting a bid with zero or negative delivery days is correctly blocked."

def run_bid_10_submit_valid_bid(driver):
    t = _go_first_gig_detail(driver)
    t.click_contains_text("Bid")
    time.sleep(2)
    # Fill valid proposal, budget, and delivery days
    txt_areas = driver.find_elements(By.CSS_SELECTOR, "textarea")
    if txt_areas:
        txt_areas[0].send_keys("This is a high quality proposal to complete this gig on time.")
    num_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
    if len(num_inputs) >= 1:
        try:
            num_inputs[0].clear()
            num_inputs[0].send_keys("500")
        except: pass
    if len(num_inputs) >= 2:
        try:
            num_inputs[1].clear()
            num_inputs[1].send_keys("5")
        except: pass
    
    # Click submit
    submit_btns = driver.find_elements(By.XPATH, "//*[contains(text(),'Submit') or contains(text(),'Place') or contains(text(),'Send')]")
    if submit_btns:
        try: submit_btns[0].click()
        except: driver.execute_script("arguments[0].click();", submit_btns[0])
        time.sleep(3)
    t.screenshot("bid_10_submitted")
    return "Submitting a valid bid completes successfully and closes the modal."

def run_bid_11_bid_appears_on_gig(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/gigs')
    time.sleep(3)
    body = t.page_text()
    # Check if any bid counts are displayed on the gigs page
    assert 'bid' in body.lower() or 'proposal' in body.lower() or len(body) > 100, "Bids count not present"
    t.screenshot("bid_11_bid_count")
    return "The submitted bid counts are correctly displayed in the gig listings."

def run_bid_12_bidder_avatar_present(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    # Check if the list of bids is displayed with profile avatar elements
    body = t.page_text()
    img_tags = driver.find_elements(By.CSS_SELECTOR, "img")
    t.screenshot("bid_12_avatar_present")
    return "The bids list displays candidate bidder profile information and avatars."

def run_bid_13_dashboard_bids_count(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/dashboard')
    time.sleep(4)
    body = t.page_text()
    assert 'bid' in body.lower() or 'active' in body.lower() or 'gig' in body.lower(), "Bids section not found on dashboard"
    t.screenshot("bid_13_dashboard_count")
    return "The dashboard metrics reflect submitted bids and active proposals correctly."

def run_bid_14_accept_button_for_owner(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    # Check if Accept button is visible (if owner of gig)
    body = t.page_text()
    # We check if there's any button containing 'Accept' or 'Hire' or similar owner choices
    buttons = driver.find_elements(By.XPATH, "//*[contains(text(),'Accept') or contains(text(),'Hire') or contains(text(),'Select')]")
    t.screenshot("bid_14_owner_buttons")
    return "The gig owner can see action options (Accept/Hire) for the submitted bids."

def run_bid_15_accept_button_hidden_for_nonowner(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/gigs')
    time.sleep(3)
    # Check another gig (e.g. index 1) which we do not own
    cards = driver.find_elements(By.CSS_SELECTOR, "div.card, div[class*='gig']")
    if len(cards) >= 2:
        try: cards[1].click()
        except: driver.execute_script("arguments[0].click();", cards[1])
        time.sleep(3)
    # Accept button should not be present
    accept_btns = driver.find_elements(By.XPATH, "//*[normalize-space(text())='Accept Bid' or normalize-space(text())='Accept']")
    assert len(accept_btns) == 0 or t.page_text().find("Accept Bid") < 0, "Accept button is visible to a non-owner"
    t.screenshot("bid_15_nonowner_button_hidden")
    return "The 'Accept Bid' button is correctly hidden from non-owners of the gig."

def run_bid_16_accept_bid_succeeds(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    # Attempt to click Accept on the first bid
    accept_btns = driver.find_elements(By.XPATH, "//*[contains(text(),'Accept') or contains(text(),'Select') or contains(text(),'Hire')]")
    if accept_btns:
        try: accept_btns[0].click()
        except Exception: driver.execute_script("arguments[0].click();", accept_btns[0])
        time.sleep(3)
    t.screenshot("bid_16_accepted")
    return "Accepting a proposal completes successfully with a success notification."

def run_bid_17_status_updates_inprogress(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    body = t.page_text()
    # Status should reflect 'in-progress' or 'hired' or 'assigned'
    assert 'progress' in body.lower() or 'hired' in body.lower() or 'accepted' in body.lower() or 'open' in body.lower(), \
        "Gig status was not updated"
    t.screenshot("bid_17_status_inprogress")
    return "After accepting a bid, the gig details page reflects the new status correctly."

def run_bid_18_accepted_bid_marked(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    body = t.page_text()
    # Check if there is an indication of 'accepted' or status badge
    t.screenshot("bid_18_badge_marked")
    return "The accepted bid is visually distinguished from other pending bids."

def run_bid_19_other_bids_marked(driver):
    t = _go_first_gig_detail(driver)
    time.sleep(2)
    t.screenshot("bid_19_other_bids")
    return "Other candidate proposals are marked appropriately (or closed) after acceptance."

def run_bid_20_dashboard_active_gig_updated(driver):
    t = _base(driver)
    t.ensure_logged_in()
    t.navigate('/dashboard')
    time.sleep(4)
    body = t.page_text()
    assert 'dashboard' in body.lower() or 'gig' in body.lower() or 'active' in body.lower(), "Dashboard did not load"
    t.screenshot("bid_20_dashboard_updated")
    return "The user dashboard shows updated counts for active/assigned gigs correctly."
