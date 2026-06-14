"""
run_tests.py — Master E2E test runner for CampusConnect React Web Platform.

Usage:
    python run_tests.py

Prerequisites:
    1. pip install selenium openpyxl
    2. Google Chrome installed (ChromeDriver auto-managed by Selenium 4.x)
    3. React frontend running:  cd web_platform/frontend && npm run dev
    4. Spring Boot backend running: cd web_platform/backend && mvn spring-boot:run

Output:
    - Console: live per-test results
    - react_web_tests/test_report.xlsx
    - react_web_tests/screenshots/
"""
import sys
import os
import time
import traceback

# ── Path bootstrap ────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from excel_reporter import ExcelReporter
from tests.base_test import BaseTest
import config

# ── Test function imports ─────────────────────────────────────────────────────
from tests.test_auth import (
    run_auth_01_login_page_loads,
    run_auth_02_signup_navigation,
    run_auth_03_signup_blank_email_blocked,
    run_auth_04_signup_blank_password_blocked,
    run_auth_05_signup_non_saveetha_blocked,
    run_auth_06_login_blank_email_blocked,
    run_auth_07_login_blank_password_blocked,
    run_auth_08_login_wrong_credentials,
    run_auth_09_correct_credentials_login,
    run_auth_10_sidebar_shows_user_name,
    run_auth_11_sidebar_shows_department,
    run_auth_12_signout_redirects_to_login,
    run_auth_13_unauthenticated_chats_redirect,
    run_auth_14_unauthenticated_gigs_redirect,
    run_auth_15_unauthenticated_teams_redirect,
    run_auth_16_unauthenticated_dashboard_redirect,
    run_auth_17_profile_setup_page_reachable,
    run_auth_18_profile_setup_has_required_fields,
    run_auth_19_profile_setup_blocks_blank_name,
    run_auth_20_home_loads_after_login,
)

from tests.test_explore import (
    run_exp_01_explore_loads,
    run_exp_02_current_user_excluded,
    run_exp_03_filter_buttons_present,
    run_exp_04_search_by_name,
    run_exp_05_clear_search_restores_list,
    run_exp_06_available_only_checkbox,
    run_exp_07_card_shows_name,
    run_exp_08_card_shows_department,
    run_exp_09_card_shows_skills,
    run_exp_10_card_shows_availability_badge,
    run_exp_11_click_card_navigates_to_profile,
    run_exp_12_profile_shows_name,
    run_exp_13_profile_shows_skills,
    run_exp_14_profile_hire_button_present,
    run_exp_15_back_returns_to_explore,
)

from tests.test_gigs import (
    run_gig_01_gigs_page_loads,
    run_gig_02_filter_chips_present,
    run_gig_03_gigs_list_shown,
    run_gig_04_filter_open,
    run_gig_05_filter_in_progress,
    run_gig_06_filter_completed,
    run_gig_07_post_gig_button_present,
    run_gig_08_create_gig_form_loads,
    run_gig_09_gig_title_field_present,
    run_gig_10_gig_description_field_present,
    run_gig_11_gig_budget_field_present,
    run_gig_12_gig_category_dropdown_present,
    run_gig_13_gig_deadline_field_present,
    run_gig_14_create_gig_blocks_blank_title,
    run_gig_15_new_gig_created,
    run_gig_16_gig_appears_in_listing,
    run_gig_17_click_gig_card_opens_detail,
    run_gig_18_gig_detail_shows_content,
    run_gig_19_delete_gig_icon_present,
    run_gig_20_delete_gig_removes_it,
)

from tests.test_teams import (
    run_team_01_teams_page_loads,
    run_team_02_team_list_or_empty_state,
    run_team_03_create_team_button_present,
    run_team_04_create_team_dialog_opens,
    run_team_05_team_name_field_in_dialog,
    run_team_06_team_description_field,
    run_team_07_blank_name_blocked,
    run_team_08_team_created_successfully,
    run_team_09_new_team_in_list,
    run_team_10_team_card_shows_name,
    run_team_11_team_card_shows_member_count,
    run_team_12_click_team_opens_detail,
    run_team_13_team_detail_shows_creator,
    run_team_14_team_detail_shows_members,
    run_team_15_delete_button_for_creator,
)

from tests.test_chats import (
    run_msg_01_chats_page_loads,
    run_msg_02_conversations_sidebar,
    run_msg_03_conversation_shows_name,
    run_msg_04_conversation_shows_last_message,
    run_msg_05_conversation_shows_timestamp,
    run_msg_06_click_conversation_opens_panel,
    run_msg_07_chat_panel_shows_recipient,
    run_msg_08_messages_render_in_panel,
    run_msg_11_typing_updates_input,
    run_msg_12_empty_message_not_sent,
    run_msg_13_sent_message_appears,
    run_msg_14_navigate_away_and_back,
    run_msg_15_open_chat_from_profile,
)

from tests.test_dashboard import (
    run_dash_01_dashboard_loads,
    run_dash_02_my_gigs_section_present,
    run_dash_03_posted_gig_shown,
    run_dash_04_my_bids_section_present,
    run_dash_05_stats_cards_present,
    run_dash_06_earnings_metric_present,
    run_dash_07_active_gigs_count,
    run_dash_09_reviews_section,
    run_dash_10_dashboard_refreshes,
)

from tests.test_profile import (
    run_prof_01_profile_page_loads,
    run_prof_02_shows_own_name,
    run_prof_03_shows_department,
    run_prof_04_shows_bio,
    run_prof_05_shows_skills,
    run_prof_07_availability_toggle_present,
    run_prof_08_toggle_availability,
    run_prof_09_bookmarks_page_loads,
    run_prof_10_bookmarked_user_appears,
    run_prof_11_bookmark_icon_on_profile,
    run_prof_12_toggle_bookmark,
    run_prof_13_signout_in_sidebar,
    run_prof_15_profile_url_has_uid,
)

from tests.test_navigation import (
    run_nav_01_sidebar_explore_link,
    run_nav_02_sidebar_gigs_link,
    run_nav_03_sidebar_teams_link,
    run_nav_04_sidebar_dashboard_link,
    run_nav_05_sidebar_messages_link,
    run_nav_06_sidebar_bookmarks_link,
    run_nav_07_sidebar_my_profile_link,
    run_nav_08_active_nav_highlighted,
    run_nav_09_404_redirects,
    run_nav_10_browser_back_button,
)


# ── 120 Test Case Registry ────────────────────────────────────────────────────
TEST_MODULES = [
    # ── Category 1: Authentication - Part A (Login, Name, Department, Profile Setup, Home Loads) ─
    ("FN-AUTH-01 — Login Page Loads Correctly",           run_auth_01_login_page_loads),
    ("FN-AUTH-02 — Create Account Navigation",            run_auth_02_signup_navigation),
    ("FN-AUTH-03 — Signup Blank Email Blocked",           run_auth_03_signup_blank_email_blocked),
    ("FN-AUTH-04 — Signup Blank Password Blocked",        run_auth_04_signup_blank_password_blocked),
    ("FN-AUTH-05 — Signup Non-Saveetha Domain Blocked",   run_auth_05_signup_non_saveetha_blocked),
    ("FN-AUTH-06 — Login Blank Email Blocked",            run_auth_06_login_blank_email_blocked),
    ("FN-AUTH-07 — Login Blank Password Blocked",         run_auth_07_login_blank_password_blocked),
    ("FN-AUTH-08 — Login Wrong Credentials Error",        run_auth_08_login_wrong_credentials),
    ("FN-AUTH-09 — Correct Credentials Login Succeeds",   run_auth_09_correct_credentials_login),
    ("FN-AUTH-10 — Sidebar Displays User Name",           run_auth_10_sidebar_shows_user_name),
    ("FN-AUTH-11 — Sidebar Displays Department",          run_auth_11_sidebar_shows_department),
    ("FN-AUTH-17 — Profile Setup Route Reachable",        run_auth_17_profile_setup_page_reachable),
    ("FN-AUTH-18 — Profile Setup Required Fields",        run_auth_18_profile_setup_has_required_fields),
    ("FN-AUTH-19 — Profile Setup Blank Name Blocked",     run_auth_19_profile_setup_blocks_blank_name),
    ("FN-AUTH-20 — Home Loads After Login",               run_auth_20_home_loads_after_login),

    # ── Category 2: Explore Freelancers (15) ──────────────────────────────────
    ("FN-EXP-01 — Explore Page Loads",                    run_exp_01_explore_loads),
    ("FN-EXP-02 — Current User Excluded from List",       run_exp_02_current_user_excluded),
    ("FN-EXP-03 — Filter Category Chips Present",         run_exp_03_filter_buttons_present),
    ("FN-EXP-04 — Search by Name Filters Results",        run_exp_04_search_by_name),
    ("FN-EXP-05 — Clear Search Restores Full List",       run_exp_05_clear_search_restores_list),
    ("FN-EXP-06 — Available Only Checkbox Filters",       run_exp_06_available_only_checkbox),
    ("FN-EXP-07 — Freelancer Card Shows Name",            run_exp_07_card_shows_name),
    ("FN-EXP-08 — Freelancer Card Shows Department",      run_exp_08_card_shows_department),
    ("FN-EXP-09 — Freelancer Card Shows Skill Chips",     run_exp_09_card_shows_skills),
    ("FN-EXP-10 — Freelancer Card Shows Availability",    run_exp_10_card_shows_availability_badge),
    ("FN-EXP-11 — Card Click Navigates to Profile",       run_exp_11_click_card_navigates_to_profile),
    ("FN-EXP-12 — Profile Page Shows Name",               run_exp_12_profile_shows_name),
    ("FN-EXP-13 — Profile Page Shows Skills",             run_exp_13_profile_shows_skills),
    ("FN-EXP-14 — Profile Hire/Message Button Present",   run_exp_14_profile_hire_button_present),
    ("FN-EXP-15 — Back Navigation Returns to Explore",    run_exp_15_back_returns_to_explore),

    # ── Category 3: Gigs Board (20) ───────────────────────────────────────────
    ("FN-GIG-01 — Gigs Page Loads",                       run_gig_01_gigs_page_loads),
    ("FN-GIG-02 — Filter Chips Present",                  run_gig_02_filter_chips_present),
    ("FN-GIG-03 — Gigs Listing Shown",                    run_gig_03_gigs_list_shown),
    ("FN-GIG-04 — Filter Open Gigs",                      run_gig_04_filter_open),
    ("FN-GIG-05 — Filter In Progress Gigs",               run_gig_05_filter_in_progress),
    ("FN-GIG-06 — Filter Completed Gigs",                 run_gig_06_filter_completed),
    ("FN-GIG-07 — Post New Gig Button Present",           run_gig_07_post_gig_button_present),
    ("FN-GIG-08 — Create Gig Form Loads",                 run_gig_08_create_gig_form_loads),
    ("FN-GIG-09 — Gig Title Field Present",               run_gig_09_gig_title_field_present),
    ("FN-GIG-10 — Gig Description Field Present",         run_gig_10_gig_description_field_present),
    ("FN-GIG-11 — Gig Budget Field Present",              run_gig_11_gig_budget_field_present),
    ("FN-GIG-12 — Gig Category Dropdown Present",         run_gig_12_gig_category_dropdown_present),
    ("FN-GIG-13 — Gig Deadline Date Picker Present",      run_gig_13_gig_deadline_field_present),
    ("FN-GIG-14 — Create Gig Blocks Blank Title",         run_gig_14_create_gig_blocks_blank_title),
    ("FN-GIG-15 — New Gig Created Successfully",          run_gig_15_new_gig_created),
    ("FN-GIG-16 — New Gig Appears in Listing",            run_gig_16_gig_appears_in_listing),
    ("FN-GIG-17 — Click Gig Card Opens Detail",           run_gig_17_click_gig_card_opens_detail),
    ("FN-GIG-18 — Gig Detail Shows Content",              run_gig_18_gig_detail_shows_content),
    ("FN-GIG-19 — Delete Gig Icon Present",               run_gig_19_delete_gig_icon_present),
    ("FN-GIG-20 — Delete Gig Removes It",                 run_gig_20_delete_gig_removes_it),

    # ── Category 4: Teams (15) ────────────────────────────────────────────────
    ("FN-TEAM-01 — Teams Page Loads",                     run_team_01_teams_page_loads),
    ("FN-TEAM-02 — Team List or Empty State Shown",       run_team_02_team_list_or_empty_state),
    ("FN-TEAM-03 — Create Team Button Present",           run_team_03_create_team_button_present),
    ("FN-TEAM-04 — Create Team Dialog Opens",             run_team_04_create_team_dialog_opens),
    ("FN-TEAM-05 — Team Name Field in Dialog",            run_team_05_team_name_field_in_dialog),
    ("FN-TEAM-06 — Team Description Field Present",       run_team_06_team_description_field),
    ("FN-TEAM-07 — Blank Team Name Blocked",              run_team_07_blank_name_blocked),
    ("FN-TEAM-08 — Team Created Successfully",            run_team_08_team_created_successfully),
    ("FN-TEAM-09 — New Team Appears in List",             run_team_09_new_team_in_list),
    ("FN-TEAM-10 — Team Card Shows Name",                 run_team_10_team_card_shows_name),
    ("FN-TEAM-11 — Team Card Shows Member Count",         run_team_11_team_card_shows_member_count),
    ("FN-TEAM-12 — Click Team Opens Detail",              run_team_12_click_team_opens_detail),
    ("FN-TEAM-13 — Team Detail Shows Creator",            run_team_13_team_detail_shows_creator),
    ("FN-TEAM-14 — Team Detail Shows Members List",       run_team_14_team_detail_shows_members),
    ("FN-TEAM-15 — Delete Button Shown for Creator",      run_team_15_delete_button_for_creator),

    # ── Category 6: Dashboard (10) ────────────────────────────────────────────
    ("FN-DASH-01 — Dashboard Page Loads",                 run_dash_01_dashboard_loads),
    ("FN-DASH-02 — My Gigs Section Present",              run_dash_02_my_gigs_section_present),
    ("FN-DASH-03 — Posted Gig Shown in Dashboard",        run_dash_03_posted_gig_shown),
    ("FN-DASH-04 — My Bids Section Present",              run_dash_04_my_bids_section_present),
    ("FN-DASH-05 — Stats / Metrics Cards Present",        run_dash_05_stats_cards_present),
    ("FN-DASH-06 — Earnings Metric Card Present",         run_dash_06_earnings_metric_present),
    ("FN-DASH-07 — Active Gigs Count Displayed",          run_dash_07_active_gigs_count),
    ("FN-DASH-09 — Reviews Section Present",              run_dash_09_reviews_section),
    ("FN-DASH-10 — Dashboard Refreshes on Re-navigate",   run_dash_10_dashboard_refreshes),

    # ── Category 5: Messages / Chats (15) ────────────────────────────────────
    ("FN-MSG-01 — Chats Page Loads",                      run_msg_01_chats_page_loads),
    ("FN-MSG-02 — Conversations Sidebar Rendered",        run_msg_02_conversations_sidebar),
    ("FN-MSG-03 — Conversation Card Shows Name",          run_msg_03_conversation_shows_name),
    ("FN-MSG-04 — Conversation Card Shows Last Message",  run_msg_04_conversation_shows_last_message),
    ("FN-MSG-05 — Conversation Card Shows Timestamp",     run_msg_05_conversation_shows_timestamp),
    ("FN-MSG-06 — Click Conversation Opens Panel",        run_msg_06_click_conversation_opens_panel),
    ("FN-MSG-07 — Chat Panel Header Shows Name",          run_msg_07_chat_panel_shows_recipient),
    ("FN-MSG-08 — Messages Render in Chat Panel",         run_msg_08_messages_render_in_panel),
    ("FN-MSG-11 — Typing Updates Input Value",            run_msg_11_typing_updates_input),
    ("FN-MSG-12 — Empty Message Not Sent",                run_msg_12_empty_message_not_sent),
    ("FN-MSG-13 — Sent Message Appears in Thread",        run_msg_13_sent_message_appears),
    ("FN-MSG-14 — Navigate Away and Back Reloads Chats",  run_msg_14_navigate_away_and_back),
    ("FN-MSG-15 — Open Chat from Freelancer Profile",     run_msg_15_open_chat_from_profile),

    # ── Category 7: Profile & Bookmarks (15) ─────────────────────────────────
    ("FN-PROF-01 — Profile Page Loads",                   run_prof_01_profile_page_loads),
    ("FN-PROF-02 — Profile Shows Own Name",               run_prof_02_shows_own_name),
    ("FN-PROF-03 — Profile Shows Department",             run_prof_03_shows_department),
    ("FN-PROF-04 — Profile Shows Bio",                    run_prof_04_shows_bio),
    ("FN-PROF-05 — Profile Shows Skills",                 run_prof_05_shows_skills),
    ("FN-PROF-07 — Availability Toggle Present",          run_prof_07_availability_toggle_present),
    ("FN-PROF-08 — Toggle Availability Updates Badge",    run_prof_08_toggle_availability),
    ("FN-PROF-09 — Bookmarks Page Loads",                 run_prof_09_bookmarks_page_loads),
    ("FN-PROF-10 — Bookmarked User Appears in List",      run_prof_10_bookmarked_user_appears),
    ("FN-PROF-11 — Bookmark Icon on Freelancer Profile",  run_prof_11_bookmark_icon_on_profile),
    ("FN-PROF-12 — Toggle Bookmark Adds/Removes User",    run_prof_12_toggle_bookmark),
    ("FN-PROF-13 — Sign Out Button in Sidebar",           run_prof_13_signout_in_sidebar),
    ("FN-PROF-15 — Profile URL Contains User UID",        run_prof_15_profile_url_has_uid),

    # ── Category 8: Navigation & Routing (10) ────────────────────────────────
    ("FN-NAV-01 — Sidebar Has Explore Link",              run_nav_01_sidebar_explore_link),
    ("FN-NAV-02 — Sidebar Has Gigs Link",                 run_nav_02_sidebar_gigs_link),
    ("FN-NAV-03 — Sidebar Has Teams Link",                run_nav_03_sidebar_teams_link),
    ("FN-NAV-04 — Sidebar Has Dashboard Link",            run_nav_04_sidebar_dashboard_link),
    ("FN-NAV-05 — Sidebar Has Messages Link",             run_nav_05_sidebar_messages_link),
    ("FN-NAV-06 — Sidebar Has Bookmarks Link",            run_nav_06_sidebar_bookmarks_link),
    ("FN-NAV-07 — Sidebar Has My Profile Link",           run_nav_07_sidebar_my_profile_link),
    ("FN-NAV-08 — Active Nav Item Is Highlighted",        run_nav_08_active_nav_highlighted),
    ("FN-NAV-09 — 404 Route Handled Correctly",           run_nav_09_404_redirects),
    ("FN-NAV-10 — Browser Back Button Navigates Correctly", run_nav_10_browser_back_button),

    # ── Category 1: Authentication - Part B (Sign Out & Unauthenticated Guards) ─
    ("FN-AUTH-12 — Sign Out Redirects to Login",          run_auth_12_signout_redirects_to_login),
    ("FN-AUTH-13 — Unauthenticated /chats Redirect",      run_auth_13_unauthenticated_chats_redirect),
    ("FN-AUTH-14 — Unauthenticated /gigs Redirect",       run_auth_14_unauthenticated_gigs_redirect),
    ("FN-AUTH-15 — Unauthenticated /teams Redirect",      run_auth_15_unauthenticated_teams_redirect),
    ("FN-AUTH-16 — Unauthenticated /dashboard Redirect",  run_auth_16_unauthenticated_dashboard_redirect),
]


# ── Main Runner ───────────────────────────────────────────────────────────────

def main():
    BANNER = "=" * 72
    print(f"\n{BANNER}")
    print("  CampusConnect React Web Platform — Selenium E2E Test Runner")
    print(f"  Target App:  {config.WEB_URL}")
    print(f"  Total Cases: {len(TEST_MODULES)}")
    print(f"{BANNER}\n")

    reporter = ExcelReporter()
    base     = BaseTest()
    driver   = None
    chrome_ok = True
    chrome_err = ""

    # ── Start Chrome ──────────────────────────────────────────────────────────
    try:
        driver = base.setup_driver()
        print(f"[OK] Chrome WebDriver started - browser window open.\n")
    except Exception as e:
        chrome_ok = False
        chrome_err = str(e)
        print(f"[!]  Chrome WebDriver could not start: {e}")
        print("   Tests will be recorded as FAILED with detailed error.\n")

    # ── Execute Tests ─────────────────────────────────────────────────────────
    pass_count = 0
    fail_count = 0

    for idx, (name, fn) in enumerate(TEST_MODULES, 1):
        start = time.time()
        bar   = f"[{idx:>3}/{len(TEST_MODULES)}]"
        print(f"{bar} {name} ...", end="", flush=True)

        if not chrome_ok:
            dur     = 0.0
            remarks = f"FAILED - Chrome WebDriver unavailable. Error: {chrome_err}"
            reporter.add_result(name, "FAILED", remarks, dur)
            fail_count += 1
            print(f" [FAIL]  ({dur:.2f}s)")
            continue

        try:
            remarks  = fn(driver)
            dur      = time.time() - start
            status   = "PASSED"
            pass_count += 1
            print(f" [PASS]  ({dur:.2f}s)")
        except Exception as exc:
            dur     = time.time() - start
            tb      = traceback.format_exc()
            remarks = f"FAILED - {str(exc)}"
            status  = "FAILED"
            fail_count += 1
            print(f" [FAIL]  ({dur:.2f}s)")
            print(f"       Error: {str(exc)[:120]}")

        reporter.add_result(name, status, remarks, dur)

    # ── Teardown ──────────────────────────────────────────────────────────────
    if driver:
        try:
            base.teardown_driver()
        except Exception:
            pass

    # ── Summary ───────────────────────────────────────────────────────────────
    total    = len(TEST_MODULES)
    rate     = pass_count / total * 100 if total > 0 else 0
    print(f"\n{BANNER}")
    print(f"  RESULTS: {pass_count}/{total} PASSED  ({rate:.1f}%)  |  {fail_count} FAILED")
    print(f"{BANNER}")

    # ── Save Report ───────────────────────────────────────────────────────────
    reporter.save(config.REPORT_PATH)
    print(f"\n[REPORT] Excel Report -> {config.REPORT_PATH}")
    print(f"[SHOTS]  Screenshots  -> {config.SCREENSHOTS_DIR}/\n")


if __name__ == "__main__":
    main()
