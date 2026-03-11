from .newsletter import SYSTEM_PROMPT as NEWSLETTER_PROMPT
from .youtube_script import SYSTEM_PROMPT as YOUTUBE_SCRIPT_PROMPT
from .social_media import SYSTEM_PROMPT as SOCIAL_MEDIA_PROMPT
from .blog_post import SYSTEM_PROMPT as BLOG_POST_PROMPT
from .research_report import SYSTEM_PROMPT as RESEARCH_REPORT_PROMPT
from .case_study import SYSTEM_PROMPT as CASE_STUDY_PROMPT
from .guide import SYSTEM_PROMPT as GUIDE_PROMPT
from .playbook import SYSTEM_PROMPT as PLAYBOOK_PROMPT
from .course_outline import SYSTEM_PROMPT as COURSE_OUTLINE_PROMPT
from .lead_magnet import SYSTEM_PROMPT as LEAD_MAGNET_PROMPT
from .landing_page import SYSTEM_PROMPT as LANDING_PAGE_PROMPT
from .email_sequence import SYSTEM_PROMPT as EMAIL_SEQUENCE_PROMPT
from .free_report import SYSTEM_PROMPT as FREE_REPORT_PROMPT

PROMPT_REGISTRY = {
    "newsletter": NEWSLETTER_PROMPT,
    "youtube_script": YOUTUBE_SCRIPT_PROMPT,
    "social_media": SOCIAL_MEDIA_PROMPT,
    "social_post": SOCIAL_MEDIA_PROMPT,
    "blog_post": BLOG_POST_PROMPT,
    "research_report": RESEARCH_REPORT_PROMPT,
    "case_study": CASE_STUDY_PROMPT,
    "guide": GUIDE_PROMPT,
    "playbook": PLAYBOOK_PROMPT,
    "course_outline": COURSE_OUTLINE_PROMPT,
    "course": COURSE_OUTLINE_PROMPT,
    "lead_magnet": LEAD_MAGNET_PROMPT,
    "landing_page": LANDING_PAGE_PROMPT,
    "email_sequence": EMAIL_SEQUENCE_PROMPT,
    "free_report": FREE_REPORT_PROMPT,
}
