"""
Logging configuration for the application
"""

import logging
import sys
import os
from typing import Literal

from typing_extensions import TypeAlias

from app.core.config import settings


class AnsiColorFormatter(logging.Formatter):
    _FormatStyle: TypeAlias = Literal["%", "{", "$"]

    def supports_ansi_simple(self):
        return sys.stdout.isatty() and os.name != "nt"

    def use_ansi_color(self) -> bool:
        match settings.LOG_USE_COLORED_OUTPUT:
            case False | True:
                return settings.LOG_USE_COLORED_OUTPUT
            case "Default":
                return self.supports_ansi_simple()

    def format(self, record: logging.LogRecord):
        no_style = "\033[0m" if self.use_ansi_color() else ""
        bold = "\033[91m"
        grey = "\033[90m"
        yellow = "\033[93m"
        red = "\033[31m"
        red_light = "\033[91m"
        start_style = (
            {
                "DEBUG": grey,
                "INFO": no_style,
                "WARNING": yellow,
                "ERROR": red,
                "CRITICAL": red_light + bold,
            }.get(record.levelname, no_style)
            if self.use_ansi_color()
            else ""
        )
        end_style = no_style
        return f"{start_style}{self.formatTime(record)} [{record.levelname}] {record.name}: {record.getMessage()}{end_style}"


def setup_logging() -> None:
    """Setup application logging configuration"""

    # Create formatters
    formatter = AnsiColorFormatter(
        fmt=settings.LOG_FORMAT, datefmt="%Y-%m-%d %H:%M:%S", style="{"
    )

    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel("INFO")

    # Delete default/other handlers so logging doesn't output multiple times
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)

    # Configure specific loggers
    loggers_config = {
        "uvicorn": {"level": "INFO"},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"level": "INFO" if settings.DEBUG else "WARNING"},
        "fastapi": {"level": "INFO"},
        "sqlalchemy": {"level": "WARNING"},
        "httpx": {"level": "WARNING"},
        "app": {"level": settings.LOG_LEVEL.upper()},
    }

    for logger_name, config in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, config["level"]))
