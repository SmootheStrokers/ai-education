INDUSTRY_PRESETS = [
    {
        "id": "contractor",
        "label": "Contractors & Trades",
        "description": "Plumbers, electricians, HVAC techs, general contractors, and tradespeople",
        "quick_runs": [
            {
                "label": "AI Tools for Contractors",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for contractors and tradespeople in 2026",
                    "industry": "construction and trades",
                    "focus": "tools",
                },
            },
            {
                "label": "Contractor AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in the construction and trades industry",
                    "industry": "construction and trades",
                    "focus": "trends",
                },
            },
            {
                "label": "Contractor Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "construction",
                    "business_type": "general contractor",
                    "pain_points": "estimating and bidding, scheduling crews, client communication, invoicing and payments",
                },
            },
            {
                "label": "Contractor Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Contractors Are Using AI to Win More Bids and Save 20+ Hours Per Week",
                },
            },
            {
                "label": "Contractor YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "5 AI Tools Every Contractor Needs in 2026 (That Cost Less Than Your Morning Coffee)",
                },
            },
            {
                "label": "Contractor AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Contractor's AI Playbook",
                    "target_audience": "contractors and tradespeople",
                    "depth": "beginner",
                },
            },
            {
                "label": "Contractor Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "contractors and tradespeople",
                    "key_benefit": "save 20 hours per week on estimating, scheduling, and client communication with AI",
                },
            },
        ],
        "pipeline_template": {
            "name": "Contractor Content Package",
            "description": "Research \u2192 Case Study \u2192 Newsletter \u2192 Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for contractors and tradespeople in 2026",
                        "industry": "construction and trades",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "construction",
                        "business_type": "general contractor",
                        "pain_points": "estimating, scheduling, client communication",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Contractors Are Using AI to Win More Bids",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every contractor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "realtor",
        "label": "Real Estate Agents",
        "description": "Realtors, brokers, property managers, and real estate professionals",
        "quick_runs": [
            {
                "label": "AI Tools for Realtors",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for real estate agents and brokers in 2026",
                    "industry": "real estate",
                    "focus": "tools",
                },
            },
            {
                "label": "Real Estate AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in residential real estate",
                    "industry": "real estate",
                    "focus": "trends",
                },
            },
            {
                "label": "Realtor Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "real estate",
                    "business_type": "residential realtor",
                    "pain_points": "lead generation, listing descriptions, client follow-up, market analysis, scheduling showings",
                },
            },
            {
                "label": "Realtor Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Top Realtors Are Using AI to Close More Deals in Half the Time",
                },
            },
            {
                "label": "Realtor YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "AI for Real Estate: How I Write Perfect Listing Descriptions in 30 Seconds",
                },
            },
            {
                "label": "Realtor AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Realtor's AI Playbook",
                    "target_audience": "real estate agents and brokers",
                    "depth": "beginner",
                },
            },
            {
                "label": "Realtor Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "real estate agents",
                    "key_benefit": "write listing descriptions, follow up with leads, and analyze markets 10x faster with AI",
                },
            },
        ],
        "pipeline_template": {
            "name": "Realtor Content Package",
            "description": "Research \u2192 Case Study \u2192 Newsletter \u2192 Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for real estate agents in 2026",
                        "industry": "real estate",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "real estate",
                        "business_type": "residential realtor",
                        "pain_points": "lead generation, listing descriptions, client follow-up",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Top Realtors Are Using AI to Close More Deals",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every realtor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "service_pro",
        "label": "Service Professionals",
        "description": "Insurance agents, financial advisors, consultants, coaches, and freelancers",
        "quick_runs": [
            {
                "label": "AI Tools for Service Pros",
                "agent_type": "research",
                "params": {
                    "topic": "AI tools for service professionals, consultants, and advisors in 2026",
                    "industry": "professional services",
                    "focus": "tools",
                },
            },
            {
                "label": "Service Pro AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends in professional services and consulting",
                    "industry": "professional services",
                    "focus": "trends",
                },
            },
            {
                "label": "Service Pro Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "professional services",
                    "business_type": "independent consultant",
                    "pain_points": "client acquisition, proposal writing, scheduling, invoicing, content creation",
                },
            },
            {
                "label": "Service Pro Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "How Service Professionals Are Using AI to Double Their Client Base Without Working More Hours",
                },
            },
            {
                "label": "Service Pro YouTube Script",
                "agent_type": "content",
                "params": {
                    "content_type": "youtube_script",
                    "topic": "AI for Consultants: Automate Your Admin Work and Focus on What You Do Best",
                },
            },
            {
                "label": "Service Business AI Playbook",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "playbook",
                    "topic": "The Service Business AI Playbook",
                    "target_audience": "insurance agents, financial advisors, consultants, and coaches",
                    "depth": "beginner",
                },
            },
            {
                "label": "Service Pro Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "service professionals and consultants",
                    "key_benefit": "automate client follow-ups, proposals, and scheduling to reclaim 15+ hours per week",
                },
            },
        ],
        "pipeline_template": {
            "name": "Service Pro Content Package",
            "description": "Research \u2192 Case Study \u2192 Newsletter \u2192 Social Posts",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "AI tools for service professionals and consultants in 2026",
                        "industry": "professional services",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "professional services",
                        "business_type": "independent consultant",
                        "pain_points": "client acquisition, proposal writing, scheduling",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "How Service Professionals Are Using AI to Work Smarter",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "social_post",
                        "topic": "AI tools every consultant and advisor needs in 2026",
                    },
                },
            ],
        },
    },
    {
        "id": "small_biz",
        "label": "Small Business Owners",
        "description": "General small business owners across all industries",
        "quick_runs": [
            {
                "label": "AI Tools for Small Business",
                "agent_type": "research",
                "params": {
                    "topic": "Best AI tools for small business owners in 2026",
                    "industry": "small business",
                    "focus": "tools",
                },
            },
            {
                "label": "Small Business AI Trends",
                "agent_type": "research",
                "params": {
                    "topic": "AI adoption trends among small businesses in America",
                    "industry": "small business",
                    "focus": "trends",
                },
            },
            {
                "label": "Small Business Case Study",
                "agent_type": "case_study",
                "params": {
                    "industry": "small business",
                    "business_type": "small business owner",
                    "pain_points": "marketing, customer service, bookkeeping, hiring, time management",
                },
            },
            {
                "label": "Small Business Newsletter",
                "agent_type": "content",
                "params": {
                    "content_type": "newsletter",
                    "topic": "5 AI Tools That Save Small Business Owners 20+ Hours Per Month",
                },
            },
            {
                "label": "AI Starter Kit Guide",
                "agent_type": "course_dev",
                "params": {
                    "product_type": "guide",
                    "topic": "The AI Starter Kit for Small Business Owners",
                    "target_audience": "small business owners with no technical background",
                    "depth": "beginner",
                },
            },
            {
                "label": "Small Business Lead Magnet",
                "agent_type": "marketing",
                "params": {
                    "asset_type": "lead_magnet",
                    "target_audience": "small business owners",
                    "key_benefit": "save 20+ hours per month with 5 free AI tools you can set up in 15 minutes",
                },
            },
        ],
        "pipeline_template": {
            "name": "Small Business Content Package",
            "description": "Research \u2192 Case Study \u2192 Newsletter \u2192 Lead Magnet",
            "steps": [
                {
                    "agent_type": "research",
                    "params": {
                        "topic": "Best AI tools for small business owners in 2026",
                        "industry": "small business",
                        "focus": "tools",
                    },
                },
                {
                    "agent_type": "case_study",
                    "params": {
                        "industry": "small business",
                        "business_type": "small business owner",
                        "pain_points": "marketing, customer service, bookkeeping, time management",
                    },
                },
                {
                    "agent_type": "content",
                    "params": {
                        "content_type": "newsletter",
                        "topic": "5 AI Tools That Save Small Business Owners 20+ Hours Per Month",
                    },
                },
                {
                    "agent_type": "marketing",
                    "params": {
                        "asset_type": "lead_magnet",
                        "target_audience": "small business owners",
                        "key_benefit": "save 20+ hours per month with free AI tools",
                    },
                },
            ],
        },
    },
]


def get_all_presets() -> list[dict]:
    return INDUSTRY_PRESETS


def get_preset_by_id(preset_id: str) -> dict | None:
    for preset in INDUSTRY_PRESETS:
        if preset["id"] == preset_id:
            return preset
    return None
