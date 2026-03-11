from .base import BaseAgent
from .research import ResearchAgent
from .case_study import CaseStudyAgent
from .content import ContentAgent
from .course_dev import CourseDevAgent
from .marketing import MarketingAgent
from .video import VideoAgent

AGENT_REGISTRY = {
    "research": ResearchAgent,
    "case_study": CaseStudyAgent,
    "content": ContentAgent,
    "course_dev": CourseDevAgent,
    "marketing": MarketingAgent,
    "video": VideoAgent,
}
