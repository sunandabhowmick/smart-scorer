"""
Central config — reads from .env
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    RESUME_STORAGE_BUCKET: str = os.getenv("RESUME_STORAGE_BUCKET", "resumes")

    # AI
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai")
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "1000"))
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.1"))

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")

    # Google
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini-1.5-flash")

    # Grok
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-beta")

    # Cleanup
    CLEANUP_AFTER_DAYS: int = int(os.getenv("CLEANUP_AFTER_DAYS", "7"))
    CLEANUP_SECRET: str = os.getenv("CLEANUP_SECRET", "")

settings = Settings()
