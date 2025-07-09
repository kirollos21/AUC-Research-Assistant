"""
Logging configuration for the application
"""

import logging
import sys
from typing import Dict, Any

from app.core.config import settings


def setup_logging() -> None:
    """Setup application logging configuration"""
    
    # Create formatters
    formatter = logging.Formatter(
        fmt=settings.LOG_FORMAT,
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    loggers_config = {
        "uvicorn": {"level": "INFO"},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"level": "INFO" if settings.DEBUG else "WARNING"},
        "fastapi": {"level": "INFO"},
        "sqlalchemy": {"level": "WARNING"},
        "httpx": {"level": "WARNING"},
    }
    
    for logger_name, config in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, config["level"]))


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(name) 