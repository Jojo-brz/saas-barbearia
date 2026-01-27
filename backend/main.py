import json
import shutil
import os
import uuid
import smtplib
from typing import Optional, List
from datetime import datetime, timedelta, date
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from passlib.context import CryptContext
from jose import JWTError, jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Importamos 'engine' aqui para usar no startup
from database import create_db_and_tables, get_session, engine
from models import Barbershop, BookingBase, Service, ServiceCreate, Booking, BookingCreate, Barber, CashEntry, CashEntryCreate, SuperAdmin

# 1. CARREGAR VARIÁVEIS DE AMBIENTE
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "chave_fallback_insegura")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

# 2. CONFIGURAÇÃO DE SEGURANÇA
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, role: str, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta: expire = datetime.utcnow() + expires_delta
    else: expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire, "role": role})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- MODELOS DE ENTRADA (PYDANTIC) ---

class ShopUpdateAdmin(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class BarberInput(BaseModel):
    name: str
    photo_url: Optional[str] = None
    barbershop_id: int

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    image_url: Optional[str] = None

class HoursUpdate(BaseModel):
    hours_config: str

class LogoUpdate(BaseModel):
    logo_url: str

# --- STARTUP AUTOMÁTICO DO SUPER ADMIN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Cria tabelas
    create_db_and_tables()
    
    # 2. Verifica/Cria Admin baseado no .env
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_pass = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Super Admin")

    if admin_email and admin_pass:
        with Session(engine) as session:
            existing = session.exec(select(SuperAdmin).where(SuperAdmin.email == admin_email)).first()
            if not existing:
                print(f"--- 🚀 AUTO-SETUP: Criando Super Admin '{admin_email}' ---")
                hashed = get_password_hash(admin_pass)
                admin = SuperAdmin(name=admin_name, email=admin_email, password=hashed)
                session.add(admin)
                session.commit()
            else:
                print(f"--- ✅ AUTO-SETUP: Super Admin '{admin_email}' já existe. ---")
    
    yield

app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")

# --- DEPENDÊNCIAS DE SEGURANÇA ---

async def get_current_shop(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "shop": raise HTTPException(status_code=401, detail="Inválido")
    except JWTError: raise HTTPException(status_code=401, detail="Inválido")
    
    shop = session.exec(select(Barbershop).where(Barbershop.email == email)).first()
    if shop is None: raise HTTPException(status_code=401, detail="Não encontrado")
    return shop

async def get_current_super_admin(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "admin": raise HTTPException(status_code=401, detail="Requer Admin")
    except JWTError: raise HTTPException(status_code=401, detail="Inválido")
    
    admin = session.exec(select(SuperAdmin).where(SuperAdmin.email == email)).first()
    if admin is None: raise HTTPException(status_code=401, detail="Admin não encontrado")
    return admin

# --- LOGIN UNIFICADO ---

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # 1. Tenta Barbearia
    shop = session.exec(select(Barbershop).where(Barbershop.email == form_data.username)).first()
    if shop:
        if not verify_password(form_data.password, shop.password): raise HTTPException(400, "Senha incorreta")
        if not shop.is_active: raise HTTPException(400, "Conta suspensa")
        token = create_access_token(data={"sub": shop.email}, role="shop")
        return {"access_token": token, "token_type": "bearer", "slug": shop.slug, "role": "shop"}

    # 2. Tenta Super Admin
    admin = session.exec(select(SuperAdmin).where(SuperAdmin.email == form_data.username)).first()
    if admin:
        if not verify_password(form_data.password, admin.password): raise HTTPException(400, "Senha incorreta")
        token = create_access_token(data={"sub": admin.email}, role="admin")
        return {"access_token": token, "token_type": "bearer", "slug": "super-admin", "role": "admin"}

    raise HTTPException(400, "Usuário não encontrado")

# --- ROTAS DO SUPER ADMIN (PROTEGIDAS) ---

@app.post("/barbershops/", response_model=Barbershop)
def create_barbershop(barbershop: Barbershop, session: Session = Depends(get_session), admin: SuperAdmin = Depends(get_current_super_admin)):
    if session.exec(select(Barbershop).where(Barbershop.email == barbershop.email)).first(): raise HTTPException(400, "Email já existe")
    if session.exec(select(Barbershop).where(Barbershop.slug == barbershop.slug)).first(): raise HTTPException(400, "Slug já existe")
    barbershop.password = get_password_hash(barbershop.password)
    session.add(barbershop)
    session.commit()
    session.refresh(barbershop)
    return barbershop

@app.get("/admin/shops", response_model=List[Barbershop])
def list_all_shops(admin: SuperAdmin = Depends(get_current_super_admin), session: Session = Depends(get_session)):
    return session.exec(select(Barbershop)).all()

@app.post("/admin/toggle_status/{id}")
def toggle_status(id: int, admin: SuperAdmin = Depends(get_current_super_admin), session: Session = Depends(get_session)):
    shop = session.get(Barbershop, id)
    if not shop: raise HTTPException(404)
    shop.is_active = not shop.is_active
    session.add(shop)
    session.commit()
    return {"ok": True}

@app.delete("/admin/barbershops/{id}")
def delete_shop(id: int, admin: SuperAdmin = Depends(get_current_super_admin), session: Session = Depends(get_session)):
    shop = session.get(Barbershop, id)
    if not shop: raise HTTPException(404)
    for b in shop.bookings: session.delete(b)
    for s in shop.services: session.delete(s)
    for ba in shop.barbers: session.delete(ba)
    for c in shop.cash_entries: session.delete(c)
    session.delete(shop)
    session.commit()
    return {"ok": True}

@app.put("/admin/barbershops/{shop_id}")
def update_barbershop_admin(shop_id: int, data: ShopUpdateAdmin, session: Session = Depends(get_session), admin: SuperAdmin = Depends(get_current_super_admin)):
    shop = session.get(Barbershop, shop_id)
    if not shop: raise HTTPException(404, "Barbearia não encontrada")

    if data.name: shop.name = data.name
    
    if data.slug:
        existing = session.exec(select(Barbershop).where(Barbershop.slug == data.slug).where(Barbershop.id != shop_id)).first()
        if existing: raise HTTPException(400, "Slug já em uso")
        shop.slug = data.slug.lower().replace(" ", "-")
        
    if data.email:
        existing = session.exec(select(Barbershop).where(Barbershop.email == data.email).where(Barbershop.id != shop_id)).first()
        if existing: raise HTTPException(400, "Email já em uso")
        shop.email = data.email
        
    if data.password:
        shop.password = get_password_hash(data.password)

    session.add(shop)
    session.commit()
    session.refresh(shop)
    return shop

# --- ROTAS PÚBLICAS (Home e Agendamento) ---

@app.get("/barbershops/", response_model=List[Barbershop])
def read_barbershops_public(session: Session = Depends(get_session)):
    return session.exec(select(Barbershop).where(Barbershop.is_active == True)).all()

@app.get("/barbershops/{slug_url}", response_model=Barbershop)
def read_barbershop(slug_url: str, session: Session = Depends(get_session)):
    shop = session.exec(select(Barbershop).where(Barbershop.slug == slug_url)).first()
    if not shop: raise HTTPException(404)
    return shop

@app.get("/barbershops/{slug_url}/services", response_model=List[Service])
def read_services(slug_url: str, session: Session = Depends(get_session)):
    shop = session.exec(select(Barbershop).where(Barbershop.slug == slug_url)).first()
    if not shop: raise HTTPException(404)
    return shop.services

@app.get("/barbershops/{slug_url}/barbers", response_model=List[Barber])
def read_barbers(slug_url: str, session: Session = Depends(get_session)):
    shop = session.exec(select(Barbershop).where(Barbershop.slug == slug_url)).first()
    if not shop: raise HTTPException(404)
    return shop.barbers

# Rota Atualizada para fornecer dados completos ao Frontend
@app.get("/barbershops/{slug_url}/bookings", response_model=List[dict])
def read_bookings(slug_url: str, session: Session = Depends(get_session)):
    shop = session.exec(select(Barbershop).where(Barbershop.slug == slug_url)).first()
    if not shop: raise HTTPException(404)
    results = []
    for b in shop.bookings:
        service = session.get(Service, b.service_id)
        duration = service.duration if service else 30
        
        # Estrutura completa para o React não reclamar
        results.append({
            "id": b.id,
            "customer_name": b.customer_name,
            "customer_phone": b.customer_phone,
            "date_time": b.date_time,
            "service_id": b.service_id,
            "service_duration": duration,
            "barber_id": b.barber_id
        })
    return results

@app.post("/bookings/", response_model=Booking)
def create_booking(data: BookingCreate, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, data.barbershop_id)
    if not shop: raise HTTPException(404)
    barber = session.get(Barber, data.barber_id)
    if not barber: raise HTTPException(404)

    dt = datetime.fromisoformat(data.date_time)
    day_name = dt.strftime("%A").lower()
    time_str = dt.strftime("%H:%M")
    try: config = json.loads(shop.hours_config)
    except: config = {}
    day_config = config.get(day_name)
    
    if not day_config or not day_config.get("active"): raise HTTPException(400, "Fechado neste dia")
    if time_str < day_config["open"] or time_str >= day_config["close"]: raise HTTPException(400, "Fora do horário de funcionamento")
    if day_config.get("break_start") and day_config.get("break_end"):
        if time_str >= day_config["break_start"] and time_str < day_config["break_end"]: raise HTTPException(400, "No horário de intervalo")

    booking = Booking.model_validate(data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

@app.get("/barbershops/{slug_url}/cash_entries", response_model=List[CashEntry])
def read_cash_entries(slug_url: str, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if current_shop.slug != slug_url: raise HTTPException(403)
    return current_shop.cash_entries

# --- ROTAS PROTEGIDAS DA BARBEARIA (PAINEL CLIENTE) ---

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), current_shop: Barbershop = Depends(get_current_shop)):
    extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{extension}"
    file_path = f"uploads/{new_filename}"
    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    return {"url": f"http://127.0.0.1:8000/images/{new_filename}"}

@app.post("/services/", response_model=Service)
def create_service(data: ServiceCreate, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if data.barbershop_id != current_shop.id: raise HTTPException(403)
    service = Service.model_validate(data)
    session.add(service)
    session.commit()
    session.refresh(service)
    return service

@app.delete("/services/{service_id}")
def delete_service(service_id: int, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    service = session.get(Service, service_id)
    if not service or service.barbershop_id != current_shop.id: raise HTTPException(403)
    session.delete(service)
    session.commit()
    return {"ok": True}

@app.put("/services/{service_id}")
def update_service(service_id: int, data: ServiceUpdate, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    service = session.get(Service, service_id)
    if not service or service.barbershop_id != current_shop.id: raise HTTPException(403)
    if data.name: service.name = data.name
    if data.price: service.price = data.price
    if data.duration: service.duration = data.duration
    if data.image_url: service.image_url = data.image_url
    session.add(service)
    session.commit()
    return service

@app.post("/barbers/", response_model=Barber)
def create_barber(data: BarberInput, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if data.barbershop_id != current_shop.id: raise HTTPException(403)
    barber = Barber.model_validate(data)
    session.add(barber)
    session.commit()
    session.refresh(barber)
    return barber

@app.delete("/barbers/{barber_id}")
def delete_barber(barber_id: int, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    barber = session.get(Barber, barber_id)
    if not barber or barber.barbershop_id != current_shop.id: raise HTTPException(403)
    session.delete(barber)
    session.commit()
    return {"ok": True}

# ROTA PARA CANCELAR AGENDAMENTO
@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    booking = session.get(Booking, booking_id)
    if not booking or booking.barbershop_id != current_shop.id: raise HTTPException(403)
    session.delete(booking)
    session.commit()
    return {"ok": True}

@app.post("/cash_entries/", response_model=CashEntry)
def create_cash_entry(data: CashEntryCreate, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if data.barbershop_id != current_shop.id: raise HTTPException(403)
    entry = CashEntry.model_validate(data)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

# ROTA PARA CANCELAR CAIXA AVULSO
@app.delete("/cash_entries/{entry_id}")
def delete_cash_entry(entry_id: int, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    entry = session.get(CashEntry, entry_id)
    if not entry or entry.barbershop_id != current_shop.id: raise HTTPException(403)
    session.delete(entry)
    session.commit()
    return {"ok": True}

@app.put("/barbershops/{shop_id}/hours")
def update_hours(shop_id: int, data: HoursUpdate, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if shop_id != current_shop.id: raise HTTPException(403)
    current_shop.hours_config = data.hours_config
    session.add(current_shop)
    session.commit()
    return {"ok": True}

@app.put("/barbershops/{shop_id}/logo")
def update_logo(shop_id: int, data: LogoUpdate, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if shop_id != current_shop.id: raise HTTPException(403)
    current_shop.logo_url = data.logo_url
    session.add(current_shop)
    session.commit()
    return {"ok": True}

# --- ENVIO DE RELATÓRIO POR E-MAIL (REAL) ---

@app.post("/barbershops/{slug_url}/send_report")
def send_daily_report(slug_url: str, session: Session = Depends(get_session), current_shop: Barbershop = Depends(get_current_shop)):
    if current_shop.slug != slug_url: 
        raise HTTPException(403, "Acesso negado")

    today = date.today()
    today_str = today.isoformat()
    today_br = today.strftime("%d/%m/%Y")

    daily_bookings = []
    total_bookings = 0.0
    
    for b in current_shop.bookings:
        if b.date_time.startswith(today_str):
            service = session.get(Service, b.service_id)
            svc_name = service.name if service else "Serviço Excluído"
            svc_price = service.price if service else 0.0
            
            daily_bookings.append({
                "time": b.date_time.split("T")[1],
                "client": b.customer_name,
                "service": svc_name,
                "val": svc_price
            })
            total_bookings += svc_price

    daily_cash = []
    total_cash = 0.0
    
    for c in current_shop.cash_entries:
        if c.date == today_str:
            daily_cash.append({
                "desc": c.description,
                "val": c.value
            })
            total_cash += c.value

    total_day = total_bookings + total_cash

    def fmt(v): return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    html_content = f"""
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
                <h1 style="margin:0;">Resumo do Dia 💰</h1>
                <p style="margin:5px 0 0;">{current_shop.name} - {today_br}</p>
            </div>
            
            <div style="padding: 20px;">
                <h2 style="color: #166534; text-align: center; font-size: 28px; margin-bottom: 20px;">
                    {fmt(total_day)}
                </h2>
                
                <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">📅 Agendamentos ({len(daily_bookings)})</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="background-color: #f9fafb; text-align: left;">
                        <th style="padding: 8px;">Hora</th>
                        <th style="padding: 8px;">Cliente</th>
                        <th style="padding: 8px;">Serviço</th>
                        <th style="padding: 8px; text-align: right;">Valor</th>
                    </tr>
                    {''.join([f'<tr><td style="padding:8px; border-bottom:1px solid #eee;">{b["time"]}</td><td style="padding:8px; border-bottom:1px solid #eee;">{b["client"]}</td><td style="padding:8px; border-bottom:1px solid #eee;">{b["service"]}</td><td style="padding:8px; border-bottom:1px solid #eee; text-align: right;">{fmt(b["val"])}</td></tr>' for b in daily_bookings])}
                </table>
                
                <br>

                <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">💵 Entradas Avulsas ({len(daily_cash)})</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    {''.join([f'<tr><td style="padding:8px; border-bottom:1px solid #eee;">{c["desc"]}</td><td style="padding:8px; border-bottom:1px solid #eee; text-align: right;">{fmt(c["val"])}</td></tr>' for c in daily_cash])}
                </table>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                Enviado automaticamente pelo sistema <b>BarberSaaS</b> 💈
            </div>
        </div>
      </body>
    </html>
    """

    try:
        if not MAIL_USERNAME or not MAIL_PASSWORD:
            print("⚠️ Erro: Credenciais de e-mail não configuradas no .env")
            return {"status": "Erro: Email não configurado no servidor."}

        msg = MIMEMultipart()
        msg['From'] = f"BarberSaaS <{MAIL_USERNAME}>"
        msg['To'] = current_shop.email 
        msg['Subject'] = f"Fechamento de Caixa - {today_br}"
        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, current_shop.email, msg.as_string())
        server.quit()
        
        return {"status": "Relatório enviado com sucesso!"}
        
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        raise HTTPException(500, f"Falha no envio: {str(e)}")