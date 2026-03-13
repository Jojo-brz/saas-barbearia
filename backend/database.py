from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Nome do arquivo do banco de dados
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"

# O connect_args é necessário apenas para o SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# É aqui que o erro acontecia: Precisamos definir o SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Função para as rotas do FastAPI obterem o banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()