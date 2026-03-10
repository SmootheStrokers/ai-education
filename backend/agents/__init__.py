from .base import BaseAgent
from .research import ResearchAgent
from .case_study import CaseStudyAgent
from .content import ContentAgent
from .course_dev import CourseDevAgent
from .marketing import MarketingAgent

AGENT_REGISTRY = {
    "research": ResearchAgent,
    "case_study": CaseStudyAgent,
    "content": ContentAgent,
    "course_dev": CourseDevAgent,
    "marketing": MarketingAgent,
}
