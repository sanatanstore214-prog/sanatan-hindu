from .campaign_agent import CampaignAgent
from .multi_platform_agent import MultiPlatformAgent
from .analytics_agent import AnalyticsAgent
from .lead_manager import LeadManager

# Instagram-dependent agents — optional (require instagrapi)
try:
    from .trend_agent import TrendAgent
    from .content_agent import ContentAgent
    from .design_agent import DesignAgent
    from .instagram_agent import InstagramAgent
    from .client_finder import ClientFinder
    from .dm_handler import DMHandler
except ImportError:
    pass

__all__ = [
    "CampaignAgent",
    "MultiPlatformAgent",
    "AnalyticsAgent",
    "LeadManager",
    "TrendAgent",
    "ContentAgent",
    "DesignAgent",
    "InstagramAgent",
    "ClientFinder",
    "DMHandler",
]
