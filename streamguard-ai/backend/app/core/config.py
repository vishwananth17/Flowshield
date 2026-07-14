from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Flowshield AI"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    database_url: str = Field(
        default="postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require",
        alias="DATABASE_URL",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and "+asyncpg" not in v:
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    redis_url: str = Field(default="redis://localhost:6380/0", alias="REDIS_URL")

    secret_key: str = Field(
        default="local-dev-secret-key-must-be-32-chars!!",
        alias="SECRET_KEY",
        min_length=32,
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )

    kafka_bootstrap_servers: str = Field(
        default="localhost:9092",
        alias="KAFKA_BOOTSTRAP_SERVERS",
    )

    resend_api_key: str | None = Field(default=None, alias="RESEND_API_KEY")
    
    razorpay_key_id: str | None = Field(default=None, alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str | None = Field(default=None, alias="RAZORPAY_KEY_SECRET")
    razorpay_plan_basic_monthly: str | None = Field(default=None, alias="RAZORPAY_PLAN_BASIC_MONTHLY")
    razorpay_plan_basic_annual: str | None = Field(default=None, alias="RAZORPAY_PLAN_BASIC_ANNUAL")
    razorpay_plan_growth_monthly: str | None = Field(default=None, alias="RAZORPAY_PLAN_GROWTH_MONTHLY")
    razorpay_plan_growth_annual: str | None = Field(default=None, alias="RAZORPAY_PLAN_GROWTH_ANNUAL")
    razorpay_plan_premium_monthly: str | None = Field(default=None, alias="RAZORPAY_PLAN_PREMIUM_MONTHLY")
    razorpay_plan_premium_annual: str | None = Field(default=None, alias="RAZORPAY_PLAN_PREMIUM_ANNUAL")
    razorpay_webhook_secret: str | None = Field(default=None, alias="RAZORPAY_WEBHOOK_SECRET")

    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    cookie_domain: str | None = Field(default=None, alias="COOKIE_DOMAIN")

    @field_validator("secret_key")
    @classmethod
    def strip_secret(cls, v: str) -> str:
        return v.strip()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()
