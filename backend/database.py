import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.orm import Session

NEON_DB_URL = "postgresql://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

raw_db_url = os.getenv("DATABASE_URL", NEON_DB_URL)

# Force Neon Cloud DB URL whenever env DATABASE_URL uses default postgres user or render internal db
if not raw_db_url or any(term in str(raw_db_url).lower() for term in ["postgres", "render.com", "localhost", "127.0.0.1", "sqlite"]):
    DATABASE_URL = NEON_DB_URL
else:
    DATABASE_URL = raw_db_url

connect_args = {}
# Enforce SSL and query timeouts for PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    if "?ssl" not in DATABASE_URL and "&ssl" not in DATABASE_URL and "sslmode=" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&sslmode=require"
        else:
            DATABASE_URL += "?sslmode=require"
    
    # options parameter to set 30s statement statement_timeout
    connect_args = {
        "options": "-c statement_timeout=30000"
    }

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 12.1 PostgreSQL Row Level Security (RLS) Helper
def set_rls_context(session: Session, org_id: str):
    """Sets the app.current_org_id configuration parameter for PostgreSQL session.
    Safe fallback for SQLite/other dialects.
    """
    if session.bind.dialect.name == "postgresql":
        try:
            # Escape single quotes in org_id if any to avoid SQLi
            safe_org_id = org_id.replace("'", "''")
            session.execute(text(f"SET LOCAL app.current_org_id = '{safe_org_id}'"))
        except Exception as e:
            session.rollback()
            raise e
