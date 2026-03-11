import os
from sqlmodel import SQLModel, create_engine, Session

# 1. Tenta pegar a URL do banco das variáveis de ambiente (Nuvem)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Se for PostgreSQL (Render/Hostinger), ajusta a URL
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    connect_args = {} # PostgreSQL não precisa de argumentos extras
else:
    # 2. Se não tiver URL (Docker Local), usa o SQLite na pasta protegida
    os.makedirs("data", exist_ok=True)
    sqlite_file_name = "data/database.db"
    DATABASE_URL = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False} # Apenas para SQLite

# 3. Cria a Engine UMA única vez
engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# 4. Define o get_session UMA única vez
def get_session():
    with Session(engine) as session:
        yield session