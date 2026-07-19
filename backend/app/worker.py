import dramatiq
from dramatiq.brokers.redis import RedisBroker
from app.core.config import settings

broker = RedisBroker(url=settings.REDIS_URL)
dramatiq.set_broker(broker)

@dramatiq.actor
def example_task():
    print("Example task running")
