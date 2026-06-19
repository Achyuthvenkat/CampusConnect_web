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
    run_auth_21_signup_password_length,
    run_auth_22_signup_password_complexity,
    run_auth_23_signup_email_format,
    run_auth_24_terms_checkbox,
    run_auth_25_login_case_insensitive,
    run_auth_26_password_visibility_toggle,
    run_auth_27_login_error_display,
    run_auth_28_signup_error_display,
    run_auth_29_session_persistence,
    run_auth_30_unauth_general_redirect,
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
    run_exp_16_profile_card_avatar,
    run_exp_17_search_with_special_characters,
    run_exp_18_search_field_persistence,
    run_exp_19_hire_modal_fields,
    run_exp_20_skills_filter_tags,
    run_exp_21_sort_dropdown_present,
    run_exp_22_department_checkbox_selection,
    run_exp_23_freelancers_count_label,
    run_exp_24_profile_details_loading,
    run_exp_25_explore_infinite_scroll,
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
    run_gig_21_team_gig_checkbox,
    run_gig_22_required_roles_present,
    run_gig_23_category_dropdown_values,
    run_gig_24_attachments_field_present,
    run_gig_25_invalid_budget_blocked,
    run_gig_26_invalid_deadline_blocked,
    run_gig_27_gigs_search_filtering,
    run_gig_28_active_gig_details,
    run_gig_29_edit_gig_button_present,
    run_gig_30_archive_gig_button_present,
    run_gig_31_budget_currency_check,
    run_gig_32_gig_creation_cancel,
    run_gig_33_gig_owner_avatar,
    run_gig_34_status_badges_colored,
    run_gig_35_tags_chips_present,
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
    run_team_16_team_member_limit,
    run_team_17_team_categories,
    run_team_18_search_teams,
    run_team_19_leave_team_button,
    run_team_20_delete_own_team_action,
    run_team_21_team_bio_validation,
    run_team_22_edit_team_details,
    run_team_23_team_skills_tags,
    run_team_24_join_request_button,
    run_team_25_team_activity_log,
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
    run_msg_09_message_input_present,
    run_msg_10_send_button_present,
    run_msg_11_typing_updates_input,
    run_msg_12_empty_message_not_sent,
    run_msg_13_sent_message_appears,
    run_msg_14_navigate_away_and_back,
    run_msg_15_open_chat_from_profile,
    run_msg_16_unread_badge,
    run_msg_17_search_conversations,
    run_msg_18_system_messages,
    run_msg_19_message_scroll,
    run_msg_20_multiline_input,
    run_msg_21_offline_alert,
    run_msg_22_image_preview,
    run_msg_23_delete_conversation,
    run_msg_24_recipient_online_status,
    run_msg_25_attachment_button,
)

from tests.test_dashboard import (
    run_dash_01_dashboard_loads,
    run_dash_02_my_gigs_section_present,
    run_dash_03_posted_gig_shown,
    run_dash_04_my_bids_section_present,
    run_dash_05_stats_cards_present,
    run_dash_06_earnings_metric_present,
    run_dash_07_active_gigs_count,
    run_dash_08_completed_gigs_count,
    run_dash_09_reviews_section,
    run_dash_10_dashboard_refreshes,
    run_dash_11_profile_completeness,
    run_dash_12_quick_action_shortcuts,
    run_dash_13_notifications_list,
    run_dash_14_recent_activity,
    run_dash_15_support_shortcut,
)

from tests.test_profile import (
    run_prof_01_profile_page_loads,
    run_prof_02_shows_own_name,
    run_prof_03_shows_department,
    run_prof_04_shows_bio,
    run_prof_05_shows_skills,
    run_prof_06_shows_hourly_rate,
    run_prof_07_availability_toggle_present,
    run_prof_08_toggle_availability,
    run_prof_09_bookmarks_page_loads,
    run_prof_10_bookmarked_user_appears,
    run_prof_11_bookmark_icon_on_profile,
    run_prof_12_toggle_bookmark,
    run_prof_13_signout_in_sidebar,
    run_prof_14_reviews_on_profile,
    run_prof_15_profile_url_has_uid,
    run_prof_16_edit_profile_button,
    run_prof_17_edit_profile_dialog,
    run_prof_18_save_profile_updates,
    run_prof_19_avatar_change_field,
    run_prof_20_skills_count_limit,
    run_prof_21_contact_email_link,
    run_prof_22_social_links,
    run_prof_23_portfolio_section,
    run_prof_24_resume_download,
    run_prof_25_tabs_switching,
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
    run_nav_11_logo_redirect,
    run_nav_12_sidebar_collapsible,
    run_nav_13_active_highlight_subroute,
    run_nav_14_footer_links,
    run_nav_15_external_social_redirection,
)

from tests.test_bids import (
    run_bid_01_bid_button_present,
    run_bid_02_bid_modal_opens,
    run_bid_03_modal_displays_gig_title,
    run_bid_04_proposal_field_present,
    run_bid_05_price_field_present,
    run_bid_06_delivery_field_present,
    run_bid_07_blank_proposal_blocked,
    run_bid_08_invalid_price_blocked,
    run_bid_09_invalid_delivery_blocked,
    run_bid_10_submit_valid_bid,
    run_bid_11_bid_appears_on_gig,
    run_bid_12_bidder_avatar_present,
    run_bid_13_dashboard_bids_count,
    run_bid_14_accept_button_for_owner,
    run_bid_15_accept_button_hidden_for_nonowner,
    run_bid_16_accept_bid_succeeds,
    run_bid_17_status_updates_inprogress,
    run_bid_18_accepted_bid_marked,
    run_bid_19_other_bids_marked,
    run_bid_20_dashboard_active_gig_updated,
)

from tests.test_reviews import (
    run_rev_01_reviews_tab_on_profile,
    run_rev_02_rating_stars_present,
    run_rev_03_rating_value_shown,
    run_rev_04_review_text_present,
    run_rev_05_add_review_button_present,
    run_rev_06_review_modal_opens,
    run_rev_07_rating_selection_interactive,
    run_rev_08_empty_review_blocked,
    run_rev_09_submit_valid_review,
    run_rev_10_average_rating_updated,
)


# ── 120 Test Case Registry ────────────────────────────────────────────────────
TEST_MODULES = [
    # ── Category 1: Authentication - Part A ──────────────────────────────────
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
    ("FN-AUTH-21 — Signup Short Password Blocked",        run_auth_21_signup_password_length),
    ("FN-AUTH-22 — Signup Password Complexity Blocked",   run_auth_22_signup_password_complexity),
    ("FN-AUTH-23 — Signup Email Format Blocked",          run_auth_23_signup_email_format),
    ("FN-AUTH-24 — Signup Terms Checkbox Present",        run_auth_24_terms_checkbox),
    ("FN-AUTH-25 — Login Case Insensitive Verification",  run_auth_25_login_case_insensitive),
    ("FN-AUTH-26 — Password Visibility Toggle Interactive", run_auth_26_password_visibility_toggle),
    ("FN-AUTH-27 — Login Error Message Displayed",        run_auth_27_login_error_display),
    ("FN-AUTH-28 — Signup Existing Email Error Displayed", run_auth_28_signup_error_display),
    ("FN-AUTH-29 — Session Persists Across Refreshes",    run_auth_29_session_persistence),
    ("FN-AUTH-30 — Unauthenticated General Pages Redirected", run_auth_30_unauth_general_redirect),

    # ── Category 2: Explore Freelancers (25) ──────────────────────────────────
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
    ("FN-EXP-16 — Freelancer Card Avatar Present",        run_exp_16_profile_card_avatar),
    ("FN-EXP-17 — Search with Special Characters Sanitized", run_exp_17_search_with_special_characters),
    ("FN-EXP-18 — Search Input Resets on Re-navigate",    run_exp_18_search_field_persistence),
    ("FN-EXP-19 — Hire Modal Opens with Fields",          run_exp_19_hire_modal_fields),
    ("FN-EXP-20 — Skills Tag Chips Displayed",            run_exp_20_skills_filter_tags),
    ("FN-EXP-21 — Sort Dropdown Options Present",         run_exp_21_sort_dropdown_present),
    ("FN-EXP-22 — Department Checkboxes Functional",      run_exp_22_department_checkbox_selection),
    ("FN-EXP-23 — Results Count Label Present",           run_exp_23_freelancers_count_label),
    ("FN-EXP-24 — Profile Detail Views Load Safely",      run_exp_24_profile_details_loading),
    ("FN-EXP-25 — Listing Support Pagination Scroll",     run_exp_25_explore_infinite_scroll),

    # ── Category 3: Gigs Board (35) ───────────────────────────────────────────
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
    ("FN-GIG-21 — Team Gig Toggle Checkbox Present",      run_gig_21_team_gig_checkbox),
    ("FN-GIG-22 — Required Roles/Tags Input Present",     run_gig_22_required_roles_present),
    ("FN-GIG-23 — Categories Populated in Create Form",   run_gig_23_category_dropdown_values),
    ("FN-GIG-24 — File Attachment Fields Present",        run_gig_24_attachments_field_present),
    ("FN-GIG-25 — Negative Budgets Rejected",             run_gig_25_invalid_budget_blocked),
    ("FN-GIG-26 — Date Selection in Past Blocked",        run_gig_26_invalid_deadline_blocked),
    ("FN-GIG-27 — Gigs Search Filters Listings",          run_gig_27_gigs_search_filtering),
    ("FN-GIG-28 — Gig Details View Renders Active Info",  run_gig_28_active_gig_details),
    ("FN-GIG-29 — Dashboard Lists Edit Option",           run_gig_29_edit_gig_button_present),
    ("FN-GIG-30 — Dashboard Lists Archive Option",        run_gig_30_archive_gig_button_present),
    ("FN-GIG-31 — Budgets Display Correct Currency symbol", run_gig_31_budget_currency_check),
    ("FN-GIG-32 — Create Gig Form Handles Cancellation",  run_gig_32_gig_creation_cancel),
    ("FN-GIG-33 — Card displays Owner/Creator avatar",    run_gig_33_gig_owner_avatar),
    ("FN-GIG-34 — Badges color match status codes",       run_gig_34_status_badges_colored),
    ("FN-GIG-35 — Skill chips display on gig lists",      run_gig_35_tags_chips_present),

    # ── Category 4: Teams (25) ────────────────────────────────────────────────
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
    ("FN-TEAM-16 — Member Limits Setup Interactive",      run_team_16_team_member_limit),
    ("FN-TEAM-17 — Categories Dropdown Selection Present", run_team_17_team_categories),
    ("FN-TEAM-18 — Searching for Teams Filters list",     run_team_18_search_teams),
    ("FN-TEAM-19 — Option to Leave Team Present",         run_team_19_leave_team_button),
    ("FN-TEAM-20 — Creator Action for Deletion Present",  run_team_20_delete_own_team_action),
    ("FN-TEAM-21 — Description Length Validation Active", run_team_21_team_bio_validation),
    ("FN-TEAM-22 — Edit Settings Button Interactive",     run_team_22_edit_team_details),
    ("FN-TEAM-23 — Card list features skill highlights",  run_team_23_team_skills_tags),
    ("FN-TEAM-24 — Request/Join Button Functional",       run_team_24_join_request_button),
    ("FN-TEAM-25 — Activities Feed Renders Correctly",    run_team_25_team_activity_log),

    # ── Category 5: Messages / Chats (25) ────────────────────────────────────
    ("FN-MSG-01 — Chats Page Loads",                      run_msg_01_chats_page_loads),
    ("FN-MSG-02 — Conversations Sidebar Rendered",        run_msg_02_conversations_sidebar),
    ("FN-MSG-03 — Conversation Card Shows Name",          run_msg_03_conversation_shows_name),
    ("FN-MSG-04 — Conversation Card Shows Last Message",  run_msg_04_conversation_shows_last_message),
    ("FN-MSG-05 — Conversation Card Shows Timestamp",     run_msg_05_conversation_shows_timestamp),
    ("FN-MSG-06 — Click Conversation Opens Panel",        run_msg_06_click_conversation_opens_panel),
    ("FN-MSG-07 — Chat Panel Header Shows Name",          run_msg_07_chat_panel_shows_recipient),
    ("FN-MSG-08 — Messages Render in Chat Panel",         run_msg_08_messages_render_in_panel),
    ("FN-MSG-09 — Chat Panel Features Input box",         run_msg_09_message_input_present),
    ("FN-MSG-10 — Send Message Action Button Present",    run_msg_10_send_button_present),
    ("FN-MSG-11 — Typing Updates Input Value",            run_msg_11_typing_updates_input),
    ("FN-MSG-12 — Empty Message Not Sent",                run_msg_12_empty_message_not_sent),
    ("FN-MSG-13 — Sent Message Appears in Thread",        run_msg_13_sent_message_appears),
    ("FN-MSG-14 — Navigate Away and Back Reloads Chats",  run_msg_14_navigate_away_and_back),
    ("FN-MSG-15 — Open Chat from Freelancer Profile",     run_msg_15_open_chat_from_profile),
    ("FN-MSG-16 — Unread Badge counter displayed",        run_msg_16_unread_badge),
    ("FN-MSG-17 — Filter Chats by Search Term",           run_msg_17_search_conversations),
    ("FN-MSG-18 — System messages render in thread",      run_msg_18_system_messages),
    ("FN-MSG-19 — Thread container supports scrolling",   run_msg_19_message_scroll),
    ("FN-MSG-20 — Text area accepts multiline messages",  run_msg_20_multiline_input),
    ("FN-MSG-21 — Reconnecting alerts displayed",         run_msg_21_offline_alert),
    ("FN-MSG-22 — Media/image attachments previewable",   run_msg_22_image_preview),
    ("FN-MSG-23 — Delete chat history button present",    run_msg_23_delete_conversation),
    ("FN-MSG-24 — online presence badge displayed",       run_msg_24_recipient_online_status),
    ("FN-MSG-25 — Attachment pin icon interactive",       run_msg_25_attachment_button),

    # ── Category 6: Dashboard (15) ────────────────────────────────────────────
    ("FN-DASH-01 — Dashboard Page Loads",                 run_dash_01_dashboard_loads),
    ("FN-DASH-02 — My Gigs Section Present",              run_dash_02_my_gigs_section_present),
    ("FN-DASH-03 — Posted Gig Shown in Dashboard",        run_dash_03_posted_gig_shown),
    ("FN-DASH-04 — My Bids Section Present",              run_dash_04_my_bids_section_present),
    ("FN-DASH-05 — Stats / Metrics Cards Present",        run_dash_05_stats_cards_present),
    ("FN-DASH-06 — Earnings Metric Card Present",         run_dash_06_earnings_metric_present),
    ("FN-DASH-07 — Active Gigs Count Displayed",          run_dash_07_active_gigs_count),
    ("FN-DASH-08 — Completed Gigs KPI displayed",         run_dash_08_completed_gigs_count),
    ("FN-DASH-09 — Reviews Section Present",              run_dash_09_reviews_section),
    ("FN-DASH-10 — Dashboard Refreshes on Re-navigate",   run_dash_10_dashboard_refreshes),
    ("FN-DASH-11 — Completeness progress tracker present", run_dash_11_profile_completeness),
    ("FN-DASH-12 — Quick action buttons displayed",       run_dash_12_quick_action_shortcuts),
    ("FN-DASH-13 — Header features notifications bell",   run_dash_13_notifications_list),
    ("FN-DASH-14 — Recent activity history card shown",   run_dash_14_recent_activity),
    ("FN-DASH-15 — Helpdesk shortcuts rendered",          run_dash_15_support_shortcut),

    # ── Category 7: Profile & Bookmarks (25) ─────────────────────────────────
    ("FN-PROF-01 — Profile Page Loads",                   run_prof_01_profile_page_loads),
    ("FN-PROF-02 — Profile Shows Own Name",               run_prof_02_shows_own_name),
    ("FN-PROF-03 — Profile Shows Department",             run_prof_03_shows_department),
    ("FN-PROF-04 — Profile Shows Bio",                    run_prof_04_shows_bio),
    ("FN-PROF-05 — Profile Shows Skills",                 run_prof_05_shows_skills),
    ("FN-PROF-06 — Hourly Rate value is visible",         run_prof_06_shows_hourly_rate),
    ("FN-PROF-07 — Availability Toggle Present",          run_prof_07_availability_toggle_present),
    ("FN-PROF-08 — Toggle Availability Updates Badge",    run_prof_08_toggle_availability),
    ("FN-PROF-09 — Bookmarks Page Loads",                 run_prof_09_bookmarks_page_loads),
    ("FN-PROF-10 — Bookmarked User Appears in List",      run_prof_10_bookmarked_user_appears),
    ("FN-PROF-11 — Bookmark Icon on Freelancer Profile",  run_prof_11_bookmark_icon_on_profile),
    ("FN-PROF-12 — Toggle Bookmark Adds/Removes User",    run_prof_12_toggle_bookmark),
    ("FN-PROF-13 — Sign Out Button in Sidebar",           run_prof_13_signout_in_sidebar),
    ("FN-PROF-14 — Feedback list shown on public profile", run_prof_14_reviews_on_profile),
    ("FN-PROF-15 — Profile URL Contains User UID",        run_prof_15_profile_url_has_uid),
    ("FN-PROF-16 — Settings offers update details",       run_prof_16_edit_profile_button),
    ("FN-PROF-17 — Update popup renders form controls",   run_prof_17_edit_profile_dialog),
    ("FN-PROF-18 — Save form triggers updates flow",      run_prof_18_save_profile_updates),
    ("FN-PROF-19 — profile picture upload interactive",   run_prof_19_avatar_change_field),
    ("FN-PROF-20 — Skill tag chips can be updated",       run_prof_20_skills_count_limit),
    ("FN-PROF-21 — Sidebar links include mailto option",  run_prof_21_contact_email_link),
    ("FN-PROF-22 — Social handle links are interactive",  run_prof_22_social_links),
    ("FN-PROF-23 — Portfolio timeline list present",      run_prof_23_portfolio_section),
    ("FN-PROF-24 — Resume/CV files linked for download",  run_prof_24_resume_download),
    ("FN-PROF-25 — Tab selectors route sub-menus",        run_prof_25_tabs_switching),

    # ── Category 8: Navigation & Routing (15) ────────────────────────────────
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
    ("FN-NAV-11 — Brand Logo navigates to homepage",      run_nav_11_logo_redirect),
    ("FN-NAV-12 — Layout menu handles scaling views",     run_nav_12_sidebar_collapsible),
    ("FN-NAV-13 — details routes highlight parent tabs",  run_nav_13_active_highlight_subroute),
    ("FN-NAV-14 — footer copyrights rendered on base",     run_nav_14_footer_links),
    ("FN-NAV-15 — social connections support target links", run_nav_15_external_social_redirection),

    # ── Category 1: Authentication - Part B ──────────────────────────────────
    ("FN-AUTH-12 — Sign Out Redirects to Login",          run_auth_12_signout_redirects_to_login),
    ("FN-AUTH-13 — Unauthenticated /chats Redirect",      run_auth_13_unauthenticated_chats_redirect),
    ("FN-AUTH-14 — Unauthenticated /gigs Redirect",       run_auth_14_unauthenticated_gigs_redirect),
    ("FN-AUTH-15 — Unauthenticated /teams Redirect",      run_auth_15_unauthenticated_teams_redirect),
    ("FN-AUTH-16 — Unauthenticated /dashboard Redirect",  run_auth_16_unauthenticated_dashboard_redirect),

    # ── Category 9: Bids & Proposals (20) ────────────────────────────────────
    ("FN-BID-01 — Place Bid button present on open gig",  run_bid_01_bid_button_present),
    ("FN-BID-02 — Clicking Place Bid opens bid modal",    run_bid_02_bid_modal_opens),
    ("FN-BID-03 — Bid modal displays correct gig title",  run_bid_03_modal_displays_gig_title),
    ("FN-BID-04 — Proposal text description input present", run_bid_04_proposal_field_present),
    ("FN-BID-05 — Proposed budget price numeric field present", run_bid_05_price_field_present),
    ("FN-BID-06 — Proposed delivery days numeric field present", run_bid_06_delivery_field_present),
    ("FN-BID-07 — Blank proposal description blocked",    run_bid_07_blank_proposal_blocked),
    ("FN-BID-08 — Negative price proposal rejected",      run_bid_08_invalid_price_blocked),
    ("FN-BID-09 — Zero or negative delivery days rejected", run_bid_09_invalid_delivery_blocked),
    ("FN-BID-10 — Submitting valid proposal succeeds",    run_bid_10_submit_valid_bid),
    ("FN-BID-11 — Submitted proposal increment gig counts", run_bid_11_bid_appears_on_gig),
    ("FN-BID-12 — Bidder profile photo visible in bids list", run_bid_12_bidder_avatar_present),
    ("FN-BID-13 — User dashboard count updates for bids", run_bid_13_dashboard_bids_count),
    ("FN-BID-14 — Action selection controls visible to owner", run_bid_14_accept_button_for_owner),
    ("FN-BID-15 — Accept button hidden to non-gig owners", run_bid_15_accept_button_hidden_for_nonowner),
    ("FN-BID-16 — Clicking accept starts selection flow", run_bid_16_accept_bid_succeeds),
    ("FN-BID-17 — Accepted bids update gig status codes", run_bid_17_status_updates_inprogress),
    ("FN-BID-18 — Accepted badge visually highlighted",  run_bid_18_accepted_bid_marked),
    ("FN-BID-19 — Secondary proposals auto close on assign", run_bid_19_other_bids_marked),
    ("FN-BID-20 — Dashboard KPIs list active projects count", run_bid_20_dashboard_active_gig_updated),

    # ── Category 10: Ratings & Reviews (10) ──────────────────────────────────
    ("FN-REV-01 — Profile page hosts reviews section",    run_rev_01_reviews_tab_on_profile),
    ("FN-REV-02 — Rating components render star shapes",   run_rev_02_rating_stars_present),
    ("FN-REV-03 — Overall rating average score shown",    run_rev_03_rating_value_shown),
    ("FN-REV-04 — Comments list reviews descriptions",    run_rev_04_review_text_present),
    ("FN-REV-05 — Write feedback button option available", run_rev_05_add_review_button_present),
    ("FN-REV-06 — Write review button opens popup form",  run_rev_06_review_modal_opens),
    ("FN-REV-07 — Rating stars are interactive on click", run_rev_07_rating_selection_interactive),
    ("FN-REV-08 — Blank comment validation blocks submit", run_rev_08_empty_review_blocked),
    ("FN-REV-09 — Submitting feedback closes modal popup", run_rev_09_submit_valid_review),
    ("FN-REV-10 — Average profile scores refresh on save", run_rev_10_average_rating_updated),
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
