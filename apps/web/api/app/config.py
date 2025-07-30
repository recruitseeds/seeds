from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Loads settings from .env file."""

    cloudflare_account_id: str
    r2_bucket_name: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_endpoint_url: str | None = None
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


settings = Settings()
