from sqlmodel import SQLModel, create_engine, Session

# Nome do arquivo do banco de dados que será criado
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Cria o "motor" de conexão
engine = create_engine(sqlite_url)

# Função para criar as tabelas (roda quando o app inicia)
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Função para pegar uma sessão do banco (usaremos nas rotas)
def get_session():
    with Session(engine) as session:
        yield session