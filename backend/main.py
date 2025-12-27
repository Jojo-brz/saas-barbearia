from pydantic import BaseModel
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Barbershop, Service, ServiceCreate
from models import Barbershop, Service, ServiceCreate, Booking, BookingCreate

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Configuração do CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensagem": "API SaaS Barbearia Online"}

# --- ROTAS BARBEARIA ---

@app.post("/barbershops/", response_model=Barbershop)
def create_barbershop(barbershop: Barbershop, session: Session = Depends(get_session)):
    session.add(barbershop)
    session.commit()
    session.refresh(barbershop)
    return barbershop

@app.get("/barbershops/", response_model=list[Barbershop])
def read_barbershops(session: Session = Depends(get_session)):
    barbershops = session.exec(select(Barbershop)).all()
    return barbershops

@app.get("/barbershops/{slug_url}", response_model=Barbershop)
def read_single_barbershop(slug_url: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    return barbershop

# --- ROTAS SERVIÇOS ---

# AQUI ESTAVA O SEGREDO: Usar ServiceCreate na entrada
@app.post("/services/", response_model=Service)
def create_service(service_data: ServiceCreate, session: Session = Depends(get_session)):
    # Valida e converte
    service = Service.model_validate(service_data)
    session.add(service)
    session.commit()
    session.refresh(service)
    return service

@app.get("/barbershops/{slug_url}/services", response_model=list[Service])
def read_barbershop_services(slug_url: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    return barbershop.services

# --- ROTAS DE AGENDAMENTO ---

@app.post("/bookings/", response_model=Booking)
def create_booking(booking_data: BookingCreate, session: Session = Depends(get_session)):
    # 1. Validar se a barbearia e o serviço existem
    # (Poderíamos adicionar validações extras aqui, como checar horário livre)
    
    # 2. Salvar o agendamento
    booking = Booking.model_validate(booking_data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking

@app.get("/barbershops/{slug_url}/bookings", response_model=list[Booking])
def read_barbershop_bookings(slug_url: str, session: Session = Depends(get_session)):
    # Busca a barbearia
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
        
    return barbershop.bookings

# Classe para receber os dados do Login
class LoginData(BaseModel):
    email: str
    password: str

# --- ROTA DE LOGIN ---
@app.post("/login")
def login(data: LoginData, session: Session = Depends(get_session)):
    # Busca a barbearia pelo e-mail
    statement = select(Barbershop).where(Barbershop.email == data.email)
    shop = session.exec(statement).first()

    # 1. Verifica se existe e se a senha bate
    if not shop or shop.password != data.password:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    # 2. Verifica se você (Super Admin) bloqueou por falta de pagamento
    if not shop.is_active:
        raise HTTPException(status_code=403, detail="Conta suspensa. Contate o suporte financeiro.")

    # Se tudo ok, retorna o SLUG para o frontend redirecionar
    return {"slug": shop.slug, "name": shop.name}

# --- ROTAS DO SUPER ADMIN (VOCÊ) ---

# 1. Bloquear/Desbloquear Barbearia (Toggle)
@app.post("/admin/toggle_status/{barbershop_id}")
def toggle_status(barbershop_id: int, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    # Inverte o status (Se tá ativo, bloqueia. Se tá bloqueado, ativa)
    shop.is_active = not shop.is_active
    session.add(shop)
    session.commit()
    return {"status": "Updated", "is_active": shop.is_active}