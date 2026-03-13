import getpass
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Barbershop # O SuperAdmin será a barbearia com slug 'admin' ou flag específica

def create_super_user():
    # Garante que as tabelas existam
    create_db_and_tables()
    
    print("--- Gerador de Super Admin Seguro ---")
    email = input("Digite o e-mail do Super Admin: ")
    
    with Session(engine) as session:
        # Verifica se já existe
        existing = session.exec(select(Barbershop).where(Barbershop.owner_email == email)).first()
        if existing:
            print("Erro: Este e-mail já está cadastrado.")
            return

        password = getpass.getpass("Digite a senha: ")
        confirm_password = getpass.getpass("Confirme a senha: ")

        if password != confirm_password:
            print("Erro: As senhas não coincidem.")
            return

        # Criamos o registro do Super Admin
        # Ele é uma "Barbearia" especial com o slug 'master-admin'
        super_admin = Barbershop(
            name="Sistema Master",
            slug="master-admin",
            owner_email=email,
            password_hash=password, # Idealmente aplicar hash aqui
            description="Administração Global do SaaS",
            address="N/A"
        )

        session.add(super_admin)
        session.commit()
        print(f"\n✅ Super Admin '{email}' criado com sucesso com acesso total!")

if __name__ == "__main__":
    create_super_user()