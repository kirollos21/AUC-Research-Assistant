"""
Rate limiting service for API calls using token bucket algorithm
"""

import time
import asyncio
import logging
from typing import Dict, Optional
from threading import Lock


logger = logging.getLogger(__name__)


class TokenBucketRateLimiter:
    """Token bucket rate limiter for controlling API request rates"""

    def __init__(self, rate_per_minute: float, bucket_size: Optional[int] = None):
        """
        Initialize rate limiter

        Args:
            rate_per_minute: Number of requests allowed per minute (can be fractional)
            bucket_size: Maximum number of tokens in bucket (defaults to rate_per_minute)
        """
        self.rate_per_minute = rate_per_minute
        self.rate_per_second = rate_per_minute / 60.0
        self.bucket_size = bucket_size or max(1, int(rate_per_minute))
        self.tokens = self.bucket_size
        self.last_refill = time.time()
        self.lock = Lock()

        # Disable rate limiting if rate is 0
        self.enabled = rate_per_minute > 0

        logger.info(
            f"Initialized rate limiter: {rate_per_minute} req/min, bucket size: {self.bucket_size}"
        )

    async def acquire(self) -> bool:
        """
        Acquire permission to make a request

        Returns:
            True if request is allowed, False otherwise
        """
        if not self.enabled:
            return True

        with self.lock:
            now = time.time()

            # Refill tokens based on elapsed time
            elapsed = now - self.last_refill
            tokens_to_add = elapsed * self.rate_per_second
            self.tokens = min(self.bucket_size, self.tokens + tokens_to_add)
            self.last_refill = now

            # Check if we can consume a token
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            else:
                return False

    async def wait_for_token(self) -> None:
        """
        Wait until a token is available (blocking)
        """
        if not self.enabled:
            return

        while True:
            if await self.acquire():
                return

            # Calculate wait time until next token becomes available
            with self.lock:
                wait_time = (1 - self.tokens) / self.rate_per_second

            # Wait a bit before trying again
            await asyncio.sleep(min(wait_time, 1.0))

    def get_status(self) -> Dict[str, float]:
        """Get current rate limiter status"""
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            tokens_to_add = elapsed * self.rate_per_second
            current_tokens = min(self.bucket_size, self.tokens + tokens_to_add)

            return {
                "rate_per_minute": self.rate_per_minute,
                "bucket_size": self.bucket_size,
                "current_tokens": current_tokens,
                "enabled": self.enabled,
            }


class RateLimiterManager:
    """Manages rate limiters for different APIs"""

    def __init__(self):
        self.limiters: Dict[str, TokenBucketRateLimiter] = {}
        self.lock = Lock()

    def get_limiter(
        self, api_name: str, rate_per_minute: float
    ) -> TokenBucketRateLimiter:
        """
        Get or create rate limiter for an API

        Args:
            api_name: Name of the API
            rate_per_minute: Rate limit in requests per minute

        Returns:
            TokenBucketRateLimiter instance
        """
        with self.lock:
            if api_name not in self.limiters:
                self.limiters[api_name] = TokenBucketRateLimiter(rate_per_minute)
                logger.info(
                    f"Created rate limiter for {api_name}: {rate_per_minute} req/min"
                )
            return self.limiters[api_name]

    def get_all_status(self) -> Dict[str, Dict[str, float]]:
        """Get status of all rate limiters"""
        with self.lock:
            return {
                api_name: limiter.get_status()
                for api_name, limiter in self.limiters.items()
            }


# Global rate limiter manager instance
rate_limiter_manager = RateLimiterManager()
