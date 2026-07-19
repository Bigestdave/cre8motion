import os
import sys

# Add current directory to path so imports work
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.providers.qwen import plan_production

print("Testing Qwen Live Integration...")
print(f"Base URL: {settings.QWEN_BASE_URL}")

script = "The sun rises over the cyberpunk city. A flying car zooms past the neon signs."
result = plan_production("test_prod_123", script)

print("Result:")
print(result)
