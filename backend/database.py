import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.orm import Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

connect_args = {}
# Enforce SSL and query timeouts for PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    if "?ssl" not in DATABASE_URL and "&ssl" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&ssl=require"
        else:
            DATABASE_URL += "?ssl=require"
    
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
