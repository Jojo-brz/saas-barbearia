from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import SuperAdmin
from passlib.context import CryptContext
from getpass import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_super_user():
    create_db_and_tables()
    print("\n--- 🔐 CONFIGURAR SUPER ADMIN ---")
    name = input("Seu Nome: ")
    email = input("Seu E-mail: ")
    password = getpass("Sua Senha: ")

    with Session(engine) as session:
        if session.exec(select(SuperAdmin).where(SuperAdmin.email == email)).first():
            print("❌ E-mail já existe.")
            return
        
        admin_user = SuperAdmin(name=name, email=email, password=pwd_context.hash(password))
        session.add(admin_user)
        session.commit()
        print(f"\n✅ Admin '{name}' criado!")

if __name__ == "__main__":
    create_super_user()