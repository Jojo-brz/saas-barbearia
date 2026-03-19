from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import extract
from sqlalchemy.orm import Session
import httpx # Para falar com o N8N
import datetime
import os
import uuid
import base64
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import extract

from database import engine, get_db, Base
from models import Appointment, Barbershop, Barber, Product, Service
# IMPORTANTE: Importando a fechadura (get_current_user)
from auth import hash_password, verify_password, create_access_token, get_current_user

load_dotenv()

app = FastAPI(title="SaaS Barbearia - Backend Pro")

# --- 1. CONFIGURAÇÃO DE UPLOADS DE IMAGEM ---
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class BarberPhotoUpdate(BaseModel):
    photo_base64: str

# Modelos para as novas rotas de Login
class ShopLogin(BaseModel):
    email: str
    password: str

class PinLogin(BaseModel):
    shop_id: int
    pin: str

class BarbershopProfileUpdate(BaseModel):
    description: str | None = None
    address: str | None = None
    logo_base64: str | None = None
    portfolio_base64: list[str] | None = None  # Lista de strings (base64)
    open_time: str | None = None
    close_time: str | None = None
    interval_start: str | None = None
    interval_end: str | None = None

def save_base64_image(base64_string: str) -> str:
    if not base64_string: return ""
    try:
        if not base64_string.startswith("data:image"): return base64_string
        
        format, imgstr = base64_string.split(';base64,') 
        ext = format.split('/')[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        
        img_data = base64.b64decode(imgstr)
        with open(f"uploads/{filename}", "wb") as f:
            f.write(img_data)
        
        # IMPORTANTE: Retorna apenas o caminho relativo
        return f"/uploads/{filename}" 
    except:
        return ""

# Criar tabelas
Base.metadata.create_all(bind=engine)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SuperAdminLogin(BaseModel):
    email: str
    password: str

# ==========================================
# 1. ROTAS DE AUTENTICAÇÃO E LOGIN (PORTAS ABERTAS)
# ==========================================

@app.post("/auth/login-super")
def login_superadmin(data: SuperAdminLogin):
    env_email = os.getenv("SUPERADMIN_EMAIL")
    env_pass = os.getenv("SUPERADMIN_PASSWORD")

    if data.email == env_email and data.password == env_pass:
        access_token = create_access_token(data={"sub": "ceo", "role": "SUPERADMIN"})
        return {"access_token": access_token, "user": {"name": "CEO SaaS", "role": "SUPERADMIN"}}
    raise HTTPException(status_code=401, detail="Credenciais de SuperAdmin inválidas")

from pydantic import BaseModel

# Modelos para as novas rotas de Login
class ShopLogin(BaseModel):
    email: str
    password: str

class PinLogin(BaseModel):
    shop_id: int
    pin: str

# ==========================================
# ROTAS DE AUTENTICAÇÃO (NOVO FLUXO PDV)
# ==========================================

@app.post("/auth/verify-shop")
def verify_shop(data: ShopLogin, db: Session = Depends(get_db)):
    """Passo 1: Valida o E-mail e Senha da Barbearia"""
    shop = db.query(Barbershop).filter(Barbershop.owner_email == data.email).first()
    
    if not shop or not verify_password(data.password, shop.password_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha da barbearia inválidos")
        
    return {"shop_id": shop.id, "shop_name": shop.name, "slug": shop.slug}

@app.post("/auth/login-pin")
def login_pin(data: PinLogin, db: Session = Depends(get_db)):
    """Passo 2: Entra no sistema usando o PIN do funcionário"""
    barber = db.query(Barber).filter(
        Barber.barbershop_id == data.shop_id,
        Barber.pin == data.pin
    ).first()
    
    if not barber:
        raise HTTPException(status_code=401, detail="PIN incorreto. Tente novamente.")
        
    # Gera o Token JWT para ESTE barbeiro específico
    token_data = {"sub": str(barber.id), "role": barber.role, "shop_id": barber.barbershop_id}
    token = create_access_token(token_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": barber.id,
            "name": barber.name,
            "role": barber.role,
            "barbershop_id": barber.barbershop_id
        }
    }

# ==========================================
# 2. ROTAS DO SUPERADMIN (TRANCADAS 🔒)
# ==========================================

@app.get("/superadmin/barbershops")
def list_all_barbershops(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado!")
    return db.query(Barbershop).all()

@app.post("/superadmin/barbershops")
async def create_barbershop(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado!")

    if db.query(Barbershop).filter(Barbershop.owner_email == data.get("owner_email")).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    if db.query(Barbershop).filter(Barbershop.slug == data.get("slug")).first():
        raise HTTPException(status_code=400, detail="URL já em uso.")

    try:
        new_shop = Barbershop(
            name=data.get("name"), slug=data.get("slug"), owner_email=data.get("owner_email"),
            password_hash=hash_password(str(data.get("password")))
        )
        db.add(new_shop)
        db.flush()

        new_ceo = Barber(name=data.get("owner_name", "Gerente"), role="OWNER", pin=data.get("initial_pin", "1234"), barbershop_id=new_shop.id)
        db.add(new_ceo)
        db.commit()
        db.refresh(new_shop)

        webhook_url = os.getenv("N8N_WEBHOOK_URL")
        if webhook_url:
            async with httpx.AsyncClient() as client:
                try:
                    await client.post(webhook_url, json={"event": "new_barbershop", "shop_name": new_shop.name, "email": new_shop.owner_email})
                except Exception: pass
        return new_shop
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/superadmin/barbershops/{shop_id}")
def update_shop_super(shop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": raise HTTPException(status_code=403, detail="Acesso negado!")
    shop = db.query(Barbershop).filter(Barbershop.id == shop_id).first()
    if not shop: raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    shop.name = data.get("name", shop.name)
    shop.slug = data.get("slug", shop.slug)
    db.commit()
    return {"message": "Dados atualizados com sucesso!"}

# --- NOVAS ROTAS PARA O PAINEL SUPERADMIN GERENCIAR A EQUIPE ---

@app.put("/super/barbershops/{shop_id}")
def update_shop_super(shop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": 
        raise HTTPException(status_code=403, detail="Acesso negado!")
    
    shop = db.query(Barbershop).filter(Barbershop.id == shop_id).first()
    if not shop: 
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    shop.name = data.get("name", shop.name)
    shop.slug = data.get("slug", shop.slug)
    shop.owner_email = data.get("owner_email", shop.owner_email)
    
    # Lógica de Troca de Senha Opcional
    nova_senha = data.get("password")
    if nova_senha and len(str(nova_senha).strip()) > 0:
        shop.password_hash = hash_password(str(nova_senha))
        
    db.commit()
    return {"message": "Dados atualizados com sucesso!"}

@app.delete("/super/barbershops/{shop_id}")
def delete_shop_super(shop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": 
        raise HTTPException(status_code=403, detail="Acesso negado!")
    
    shop = db.query(Barbershop).filter(Barbershop.id == shop_id).first()
    if not shop: 
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    # Limpeza de segurança: remove dependências antes de apagar a loja
    db.query(Barber).filter(Barber.barbershop_id == shop_id).delete()
    db.query(Service).filter(Service.barbershop_id == shop_id).delete()
    db.query(Appointment).filter(Appointment.barbershop_id == shop_id).delete()
    
    db.delete(shop)
    db.commit()
    return {"message": "Barbearia removida permanentemente."}

@app.post("/super/barbers")
def add_barber_super(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": raise HTTPException(status_code=403, detail="Acesso negado!")
    new_barber = Barber(
        name=data.get("name"), 
        role=data.get("role"), 
        pin=data.get("pin"), 
        barbershop_id=data.get("barbershop_id")
    )
    db.add(new_barber)
    db.commit()
    return new_barber

@app.put("/super/barbers/{barber_id}")
def update_barber_super(barber_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": raise HTTPException(status_code=403, detail="Acesso negado!")
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber: raise HTTPException(status_code=404, detail="Não encontrado")
    
    barber.role = data.get("role", barber.role)
    barber.name = data.get("name", barber.name)
    barber.pin = data.get("pin", barber.pin)
    db.commit()
    return {"message": "Atualizado"}

@app.delete("/super/barbers/{barber_id}")
def delete_barber_super(barber_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SUPERADMIN": raise HTTPException(status_code=403, detail="Acesso negado!")
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if barber:
        db.delete(barber)
        db.commit()
    return {"message": "Deletado"}

@app.put("/admin/barbers/{barber_id}/photo")
def update_barber_photo(
    barber_id: int, 
    data: BarberPhotoUpdate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    # 1. Busca o barbeiro no banco
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    
    if not barber:
        raise HTTPException(status_code=404, detail="Barbeiro não encontrado")

    # 2. Segurança: Verifica se o barbeiro pertence à barbearia do usuário logado
    if barber.barbershop_id != current_user.get("shop_id"):
        raise HTTPException(status_code=403, detail="Não autorizado")

    # 3. Salva a imagem (reutilizando sua função save_base64_image que já existe no main.py)
    try:
        image_url = save_base64_image(data.photo_base64)
        barber.profile_image_url = image_url
        db.commit()
        return {"image_url": image_url}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar imagem: {str(e)}")

# ==========================================
# 3. ROTAS DE EQUIPE E SERVIÇOS (TRANCADAS 🔒)
# ==========================================
@app.put("/admin/barbers/{barber_id}/toggle")
def toggle_barber_status(barber_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Apenas Gestão pode ocultar/mostrar funcionários
    if current_user.get("role") not in ["OWNER", "GERENTE", "CEO"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    barber = db.query(Barber).filter(
        Barber.id == barber_id, 
        Barber.barbershop_id == current_user.get("shop_id")
    ).first()
    
    if not barber:
        raise HTTPException(status_code=404, detail="Barbeiro não encontrado")
    
    # Inverte o status atual (Se está True, vira False e vice-versa)
    barber.is_active = not getattr(barber, 'is_active', True)
    db.commit()
    
    return {"message": "Status atualizado", "is_active": barber.is_active}

@app.post("/admin/{barbershop_id}/barbers")
def create_barber(barbershop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["OWNER", "GERENTE"]: raise HTTPException(status_code=403, detail="Sem permissão")
    pin = str(data.get("pin"))
    if pin == os.getenv("CEO_PIN", "0000") or db.query(Barber).filter(Barber.pin == pin).first():
        raise HTTPException(status_code=400, detail="PIN em uso.")

    new_barber = Barber(name=data.get("name"), role=data.get("role", "BARBER"), pin=pin, barbershop_id=barbershop_id)
    db.add(new_barber)
    db.commit()
    return new_barber

@app.get("/admin/barbershops/{barbershop_id}/team-stats")
def get_team_stats(barbershop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    barbers = db.query(Barber).filter(Barber.barbershop_id == barbershop_id).all()
    return [{"id": b.id, "name": b.name, "role": b.role, "pin": b.pin} for b in barbers]

@app.post("/admin/services")
def add_service(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["OWNER", "GERENTE"]: raise HTTPException(status_code=403, detail="Sem permissão")
    new_service = Service(name=data.get("name"), price=float(data.get("price")), duration=int(data.get("duration")), barbershop_id=data.get("barbershop_id"))
    db.add(new_service)
    db.commit()
    return new_service

@app.post("/admin/venda-balcao")
def registrar_venda_balcao(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # 1. Pega os dados de quem está logado
    shop_id = current_user.get("shop_id")
    user_id = int(current_user.get("sub")) # ID de quem está a fazer a venda agora
    
    # 2. Descobre se é "produto" ou "servico" (por padrão, assume produto se o front não enviar)
    tipo = data.get("tipo", "produto")
    
    # 3. A MÁGICA DA COMISSÃO:
    # Se for serviço, a venda pertence a quem a registou. Se for produto, vai para a loja (None).
    barber_id = user_id if tipo == "servico" else None
    
    # 4. Um toque visual para o seu Dashboard Financeiro ficar organizado
    prefixo = "✂️ Corte Avulso:" if tipo == "servico" else "🛍️ Produto:"
    
    nova_venda = Appointment(
        barbershop_id=shop_id,
        barber_id=barber_id, # <--- Agora o ID entra aqui se for serviço!
        client_name=f"{prefixo} {data.get('item', 'Venda')}", 
        client_phone="000000000",
        service_id=None,
        service_price=float(data.get("valor", 0)),
        date_time=datetime.now(),
        status="concluido" 
    )
    
    try:
        db.add(nova_venda)
        db.commit()
        return {"message": "Venda registrada com sucesso!"}
    except Exception as e:
        db.rollback()
        print(f"Erro ao salvar venda: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar no banco")

# ==========================================
# 4. ROTAS DE ESTOQUE E INVENTÁRIO (TRANCADAS 🔒)
# ==========================================

@app.get("/admin/{barbershop_id}/products")
def list_products(barbershop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return db.query(Product).filter(Product.barbershop_id == barbershop_id).all()

@app.post("/admin/{barbershop_id}/products")
def add_product(barbershop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["OWNER", "GERENTE"]: raise HTTPException(status_code=403, detail="Sem permissão")
    new_item = Product(name=data.get("name"), price=data.get("price"), stock_quantity=data.get("stock_quantity", 0), barbershop_id=barbershop_id)
    db.add(new_item)
    db.commit()
    return new_item

@app.patch("/admin/products/{product_id}/sell")
def quick_sell_product(product_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or product.stock_quantity <= 0: raise HTTPException(status_code=400, detail="Estoque esgotado")
    product.stock_quantity -= 1
    db.commit()
    return {"message": "Venda realizada", "new_qty": product.stock_quantity}

@app.delete("/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Apenas OWNER ou GERENTE podem apagar itens do estoque
    if current_user.get("role") not in ["OWNER", "GERENTE"]:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir produtos")
    
    item = db.query(Product).filter(Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(item)
    db.commit()
    return {"message": "Produto removido com sucesso!"}

# ==========================================
# REPOSIÇÃO DE ESTOQUE (ADICIONAR UNIDADES)
# ==========================================

@app.patch("/admin/products/{product_id}/restock")
def restock_product(product_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Apenas OWNER ou GERENTE podem adicionar estoque
    if current_user.get("role") not in ["OWNER", "GERENTE"]:
        raise HTTPException(status_code=403, detail="Sem permissão para repor estoque")
    
    item = db.query(Product).filter(Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    quantidade = data.get("quantity", 0)
    if quantidade <= 0:
        raise HTTPException(status_code=400, detail="Quantidade inválida")
        
    # Soma a nova quantidade ao estoque atual
    item.stock_quantity += quantidade
    db.commit()
    
    return {"message": "Estoque atualizado com sucesso!", "new_quantity": item.stock_quantity}

# ==========================================
# 5. ROTAS DE AGENDAMENTOS E CLIENTES
# ==========================================
@app.get("/api/public/barbershops/{slug}")
def get_public_barbershop(slug: str, db: Session = Depends(get_db)):
    """Rota PÚBLICA para a página do cliente carregar a loja, portfólio, equipe e serviços"""
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    # Busca a equipe e os serviços desta barbearia
    barbers = db.query(Barber).filter(Barber.barbershop_id == shop.id).all()
    services = db.query(Service).filter(Service.barbershop_id == shop.id).all()

    return {
        "id": shop.id,
        "name": shop.name,
        "description": shop.description,
        "address": shop.address,
        "logo_url": shop.logo_url,
        "portfolio_images": shop.portfolio_images,
        "barbers": [{"id": b.id, "name": b.name, "role": b.role, "profile_image_url": b.profile_image_url} for b in barbers],
        "services": [{"id": s.id, "name": s.name, "price": s.price, "duration": s.duration} for s in services]
    }

@app.post("/appointments")
async def create_appointment(data: dict, db: Session = Depends(get_db)):
    """PORTA ABERTA: Clientes agendam sem token"""
    try:
        # 1. Processamento dos dados básicos
        appo_date = datetime.fromisoformat(data.get("date_time"))
        service_id = data.get("service_id")
        shop_id = data.get("barbershop_id")
        
        # Busca o serviço e a barbearia para ter dados reais no banco e no Whats
        service = db.query(Service).filter(Service.id == service_id).first()
        shop = db.query(Barbershop).filter(Barbershop.id == shop_id).first()
        
        price = service.price if service else 0.0
        shop_name = shop.name if shop else "Barbearia"

        # 2. Salva no Banco de Dados
        new_appo = Appointment(
            client_name=data.get("client_name"), 
            client_phone=data.get("client_phone"), 
            date_time=appo_date, 
            barbershop_id=shop_id,
            barber_id=data.get("barber_id"),
            service_id=service_id,
            service_price=price 
        )
        db.add(new_appo)
        db.commit()

        # 3. Disparo para o N8N (Bloco corrigido)
        try:
            n8n_webhook_url = os.getenv("N8N_WHATSAPP_WEBHOOK")
            
            if n8n_webhook_url:
                payload_n8n = {
                    "event": "new_appointment",
                    "client_name": data.get("client_name"),
                    "client_phone": data.get("client_phone"),
                    "date": data.get("date_time").split("T")[0],
                    "time": data.get("date_time").split("T")[1][:5],
                    "barbershop_name": shop_name 
                }

                async with httpx.AsyncClient() as client:
                    # Usamos .post mas sem esperar a resposta travar o fluxo
                    await client.post(n8n_webhook_url, json=payload_n8n)
                    
        except Exception as e:
            # Se o N8N falhar, apenas logamos o erro. O agendamento já foi salvo!
            print(f"Erro ao avisar o N8N: {e}")

        return {"message": "Agendado com sucesso!", "id": new_appo.id}

    except Exception as e:
        db.rollback()
        print(f"Erro geral no agendamento: {e}")
        raise HTTPException(status_code=400, detail="Erro ao processar agendamento")

@app.post("/admin/venda-balcao")
def registrar_venda_balcao(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Venda avulsa direto do dashboard do barbeiro"""
    item = data.get("item")
    valor = data.get("valor")
    
    barber_id = current_user.get("sub")
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber: raise HTTPException(status_code=404, detail="Barbeiro não encontrado")
        
    nova_venda = Appointment(
        client_name=f"Balcão: {item}", 
        client_phone="00000000000",
        date_time=datetime.datetime.now(),
        barber_id=barber.id,
        barbershop_id=barber.barbershop_id,
        service_price=float(valor),
        status="concluido" # A venda de balcão já entra como concluída/paga!
    )
    
    db.add(nova_venda)
    db.commit()
    return {"message": "Venda registada!"}

@app.get("/admin/{barbershop_id}/appointments")
def get_agenda(barbershop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")

    # FILTRO ESSENCIAL: Só traz o que ainda está agendado (scheduled)
    query = db.query(Appointment).filter(
        Appointment.barbershop_id == barbershop_id,
        Appointment.status == "scheduled"
    )

    # REGRA DE VISIBILIDADE: Barbeiro só vê o dele, Gestor vê tudo
    if user_role == "BARBER":
        query = query.filter(Appointment.barber_id == user_id)

    return query.order_by(Appointment.date_time.asc()).all()

@app.patch("/admin/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    appo = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appo: raise HTTPException(status_code=404, detail="Não encontrado")
    
    new_status = data.get("status")
    if new_status in ["concluido", "cancelado"]:
        appo.status = new_status
        db.commit()
        return {"message": f"Agendamento {new_status}"}
    raise HTTPException(status_code=400, detail="Status inválido")

@app.get("/barbershops/{slug}/available-times")
def get_available_times(slug: str, barber_id: int, service_id: int, date: str, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    # 1. Pega a duração real do serviço
    service = db.query(Service).filter(Service.id == service_id).first()
    duracao_servico = service.duration if service else 30

    abertura = datetime.strptime(f"{date} {shop.open_time or '09:00'}", "%Y-%m-%d %H:%M")
    fechamento = datetime.strptime(f"{date} {shop.close_time or '19:00'}", "%Y-%m-%d %H:%M")
    almoco_inicio = datetime.strptime(f"{date} {shop.interval_start or '12:00'}", "%Y-%m-%d %H:%M")
    almoco_fim = datetime.strptime(f"{date} {shop.interval_end or '13:00'}", "%Y-%m-%d %H:%M")

    # Busca os agendamentos e ORDENA por hora (Crucial para a lógica inteligente)
    agendamentos = db.query(Appointment).filter(
        Appointment.barbershop_id == shop.id,
        Appointment.barber_id == barber_id,
        extract('year', Appointment.date_time) == abertura.year,
        extract('month', Appointment.date_time) == abertura.month,
        extract('day', Appointment.date_time) == abertura.day,
    ).order_by(Appointment.date_time).all()

    horarios_ocupados = []
    for app in agendamentos:
        app_service = db.query(Service).filter(Service.id == app.service_id).first()
        app_dur = app_service.duration if app_service else 30
        inicio_ocup = app.date_time
        fim_ocup = inicio_ocup + timedelta(minutes=app_dur)
        horarios_ocupados.append((inicio_ocup, fim_ocup))

    horarios_disponiveis = []
    atual = abertura

    # 2. O Loop Inteligente
    while atual + timedelta(minutes=duracao_servico) <= fechamento:
        fim_estimado = atual + timedelta(minutes=duracao_servico)
        cai_no_almoco = (atual < almoco_fim) and (fim_estimado > almoco_inicio)
        
        conflito = False
        proximo_livre = None

        # Verifica bloqueios
        for inicio_ocup, fim_ocup in horarios_ocupados:
            if (atual < fim_ocup) and (fim_estimado > inicio_ocup):
                conflito = True
                proximo_livre = fim_ocup # Descobre a exata hora que o barbeiro fica livre
                break
        
        passou_da_hora = atual < datetime.now()

        # 3. Tratamento de Pulos (A Mágica da Organização)
        if passou_da_hora:
            atual += timedelta(minutes=15) # Se for passado, anda 15 min pra tentar de novo
        elif cai_no_almoco:
            atual = max(atual + timedelta(minutes=15), almoco_fim) # Pula pro fim do almoço
        elif conflito:
            atual = proximo_livre # Pula EXATAMENTE para o minuto em que o corte atual termina!
        else:
            # Achou um horário perfeito! Adiciona na tela.
            horarios_disponiveis.append(atual.strftime("%H:%M"))
            
            # O SEGREDO CONTRA A POLUIÇÃO VISUAL:
            # Se o serviço for de 5 min, ele pula 30 min pro próximo botão.
            # Se o serviço for de 45 min, ele pula 45 min pro próximo botão.
            # Isso garante que a tela fique sempre limpa e os botões bem espaçados!
            salto_limpo = max(duracao_servico, 30)
            atual += timedelta(minutes=salto_limpo)

    return horarios_disponiveis

# ==========================================
# 6. ROTAS FINANCEIRAS E DASHBOARD (TRANCADAS 🔒)
# ==========================================

@app.get("/admin/{barbershop_id}/financeiro")
def get_financial_dashboard(barbershop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")
    hoje = datetime.today().date()

    # 1. Busca todos os agendamentos concluídos DESTE MÊS nesta barbearia
    query = db.query(Appointment).filter(
        Appointment.barbershop_id == barbershop_id, 
        Appointment.status == "concluido",
        extract('year', Appointment.date_time) == hoje.year,
        extract('month', Appointment.date_time) == hoje.month
    )

    # 2. Se for BARBEIRO, filtra SÓ as vendas e cortes dele
    if user_role == "BARBER":
        query = query.filter(Appointment.barber_id == user_id)

    concluidos = query.all()

    # 3. Calcula os ganhos usando os PREÇOS REAIS do banco
    faturamento_total = sum(c.service_price for c in concluidos)
    dias_passados = hoje.day
    media_diaria = faturamento_total / dias_passados if dias_passados > 0 else 0

    # 4. Se for Gestor/CEO, constrói a lista detalhada
    barbeiros_stats = []
    if user_role in ["OWNER", "GERENTE", "CEO"]:
        barbeiros = db.query(Barber).filter(Barber.barbershop_id == barbershop_id).all()
        
        # --- CÁLCULO PARA CADA BARBEIRO ---
        for b in barbeiros:
            total_barbeiro = sum(c.service_price for c in concluidos if c.barber_id == b.id)
            if total_barbeiro > 0:
                barbeiros_stats.append({"name": b.name, "total": total_barbeiro})
        
        # --- CÁLCULO EXCLUSIVO PARA VENDAS DE BALCÃO (LOJA) ---
        # Somamos tudo o que está concluído mas NÃO tem barbeiro associado
        total_balcao = sum(c.service_price for c in concluidos if c.barber_id is None)
        
        if total_balcao > 0:
            barbeiros_stats.append({"name": "🛍️ Vendas de Balcão", "total": total_balcao})
                
        # Ordena para o maior faturamento ficar no topo
        barbeiros_stats.sort(key=lambda x: x["total"], reverse=True)

    return {
        "faturamento_total": faturamento_total, 
        "media_diaria": media_diaria, 
        "total_cortes": len(concluidos), 
        "barbeiros": barbeiros_stats
    }

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import extract
from datetime import datetime
import os
from fastapi import Depends, HTTPException

@app.post("/admin/{barbershop_id}/close-register")
async def close_register(barbershop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    target_email = data.get("email")
    observations = data.get("observations", "Nenhuma")
    incidentes = data.get("incidentes", "Nenhum")
    tipo_fechamento = data.get("tipo_fechamento", "diario") # <-- Recebemos o tipo do frontend
    role = current_user.get("role")
    user_id = current_user.get("sub")

    # 1. Credenciais de E-mail (do ficheiro .env)
    remetente = os.getenv("EMAIL_SENDER")
    senha = os.getenv("EMAIL_PASSWORD")

    if not remetente or not senha:
        raise HTTPException(status_code=500, detail="E-mail do sistema não configurado no servidor.")
    if not target_email:
        raise HTTPException(status_code=400, detail="E-mail de destino não fornecido.")

    # 2. Lógica Financeira Inteligente (Diário ou Mensal)
    hoje = datetime.now()
    
    # Filtro base: barbearia e status concluído
    base_query = db.query(Appointment).filter(
        Appointment.barbershop_id == barbershop_id,
        Appointment.status == "concluido",
        extract('year', Appointment.date_time) == hoje.year,
        extract('month', Appointment.date_time) == hoje.month
    )

    # Se for diário, adicionamos o filtro do dia. Se for mensal, o filtro acima (ano/mês) já resolve.
    if tipo_fechamento == "diario":
        appointments_query = base_query.filter(extract('day', Appointment.date_time) == hoje.day)
        periodo_texto = f"do Dia {hoje.strftime('%d/%m/%Y')}"
    else:
        appointments_query = base_query
        periodo_texto = f"do Mês de {hoje.strftime('%m/%Y')}"
    
    # Se for barbeiro, pega só os cortes dele. Se for Gestão, pega todos.
    if role == "BARBER":
        appointments = [a for a in appointments_query.all() if str(a.barber_id) == str(user_id)]
        tipo_relatorio = f"Ganhos Pessoais - {periodo_texto}"
    else:
        appointments = appointments_query.all()
        tipo_relatorio = f"Fechamento da Loja - {periodo_texto}"

    total_faturado = sum(a.service_price or 0.0 for a in appointments)
    qtd_cortes = len(appointments)

    # 3. Montar o E-mail em HTML
    assunto = tipo_relatorio
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden;">
                <div style="background-color: #18181b; padding: 24px; text-align: center;">
                    <h2 style="color: #f59e0b; margin: 0; text-transform: uppercase;">Relatório Financeiro</h2>
                    <p style="color: #a1a1aa; margin: 5px 0 0 0;">{tipo_relatorio}</p>
                </div>
                <div style="padding: 32px; background-color: #fafafa;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e4e4e7; text-align: center; margin-bottom: 24px;">
                        <p style="font-size: 14px; color: #71717a; text-transform: uppercase; font-weight: bold; margin: 0;">Faturamento {tipo_fechamento}</p>
                        <h1 style="color: #10b981; font-size: 36px; margin: 8px 0;">R$ {total_faturado:.2f}</h1>
                        <p style="margin: 0; color: #52525b; font-size: 14px;">Total de Serviços Concluídos: <strong>{qtd_cortes}</strong></p>
                    </div>
                    
                    <h4 style="color: #3f3f46; margin-bottom: 8px;">Observações da Equipa:</h4>
                    <div style="background-color: #f4f4f5; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                        <p style="margin: 0; font-size: 14px;">{observations}</p>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart()
    msg["From"] = remetente
    msg["To"] = target_email
    msg["Subject"] = assunto
    msg.attach(MIMEText(html, "html"))

    # 4. Envio direto pelo Python
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(remetente, senha)
        server.sendmail(remetente, target_email, msg.as_string())
        server.quit()
    except Exception as e:
        print("Erro ao enviar email de fechamento:", e)
        raise HTTPException(status_code=500, detail="O fechamento foi salvo, mas houve uma falha técnica ao enviar o e-mail.")

    return {"message": f"Relatório {tipo_fechamento} enviado com sucesso!", "total": total_faturado}

# ==========================================
# ROTAS DE PERFIL (IMAGENS E DESCRIÇÃO)
# ==========================================
@app.get("/admin/barbershops/{shop_id}/team-earnings")
def get_team_earnings(shop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Retorna a equipa com o cálculo de quanto cada um faturou no mês atual"""
    if current_user.get("role") not in ["OWNER", "GERENTE"]:
        raise HTTPException(status_code=403, detail="Apenas gerentes podem ver o faturamento da equipa")
        
    hoje = datetime.today().date()
    barbers = db.query(Barber).filter(Barber.barbershop_id == shop_id).all()
    
    resultados = []
    for b in barbers:
        # Filtra os cortes apenas deste mês e deste barbeiro
        cortes_mes = db.query(Appointment).filter(
            Appointment.barber_id == b.id,
            extract('year', Appointment.date_time) == hoje.year,
            extract('month', Appointment.date_time) == hoje.month
        ).all()
        
        total_mes = sum(c.service_price for c in cortes_mes)
        resultados.append({
            "id": b.id,
            "name": b.name,
            "role": b.role,
            "profile_image_url": b.profile_image_url,
            "ganho_mensal": total_mes
        })
        
    return resultados

@app.put("/admin/barbershops/{shop_id}/profile")
def update_barbershop_profile(
    shop_id: int, 
    data: BarbershopProfileUpdate, # Aqui usamos a classe nova
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Busca a barbearia no banco
    shop = db.query(Barbershop).filter(Barbershop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    # 1. Salva Descrição e Endereço
    shop.description = data.description
    shop.address = data.address
    
    # 2. Salva Horários
    shop.open_time = data.open_time
    shop.close_time = data.close_time
    shop.interval_start = data.interval_start
    shop.interval_end = data.interval_end

    # 3. Processa a Logo (se houver novo upload)
    if data.logo_base64 and data.logo_base64.startswith("data:image"):
        shop.logo_url = save_base64_image(data.logo_base64)

    # 4. Processa o Portfólio (converte lista em string separada por vírgula)
    if data.portfolio_base64 is not None:
        final_images = []
        for img in data.portfolio_base64:
            if img.startswith("data:image"):
                final_images.append(save_base64_image(img))
            else:
                # Se já for um nome de arquivo (não mudou), mantém
                name = img.split("/")[-1]
                final_images.append(name)
        
        shop.portfolio_images = ",".join(final_images)

    db.commit()
    return {"message": "Perfil atualizado com sucesso!"}

    db.commit()
    return {"message": "Perfil limpo e guardado!"}

@app.get("/admin/barbershops/{barbershop_id}/profile")
def get_profile(barbershop_id: int, db: Session = Depends(get_db)):
    """Retorna os dados atuais para o formulário no Frontend"""
    shop = db.query(Barbershop).filter(Barbershop.id == barbershop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    return {
        "description": shop.description,
        "address": shop.address,
        "logo_url": shop.logo_url,
        "portfolio_images": shop.portfolio_images.split(";") if shop.portfolio_images else []
    }

@app.get("/admin/barbershops/{barbershop_id}/profile")
def get_profile(barbershop_id: int, db: Session = Depends(get_db)):
    """Retorna os dados atuais para o formulário no Frontend"""
    shop = db.query(Barbershop).filter(Barbershop.id == barbershop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    return {
        "description": shop.description,
        "address": shop.address,
        "logo_url": shop.logo_url,
        "portfolio_images": shop.portfolio_images.split(";") if shop.portfolio_images else []
    }

@app.put("/admin/barbers/{barber_id}/profile")
def update_barber_profile(barber_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Atualiza a foto de perfil do barbeiro"""
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barbeiro não encontrado")

    is_manager = current_user.get("role") in ["OWNER", "GERENTE"]
    is_self = str(current_user.get("sub")) == str(barber.id)

    if not is_manager and not is_self:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar este perfil.")

    if "profile_image_url" in data and data["profile_image_url"]: 
        barber.profile_image_url = save_base64_image(data["profile_image_url"])
    
    db.commit()
    return {"message": "Foto de perfil atualizada!"}

# ==========================================
# 7. GESTÃO DE SERVIÇOS
# ==========================================

# ROTA PÚBLICA: Lista serviços pelo ID da barbearia
@app.get("/barbershops/{shop_id}/services")
def list_services_by_id(shop_id: int, db: Session = Depends(get_db)):
    services = db.query(Service).filter(Service.barbershop_id == shop_id).all()
    return services

# ROTA PRIVADA: Criar novo serviço
@app.post("/admin/services")
async def create_service(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Apenas Gestores/CEOs podem criar serviços
    if current_user.get("role") == "BARBER":
        raise HTTPException(status_code=403, detail="Acesso negado")

    new_service = Service(
        name=data.get("name"),
        price=data.get("price"),
        duration=data.get("duration"),
        barbershop_id=data.get("barbershop_id")
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

# ROTA PRIVADA: Editar serviço existente
@app.put("/admin/services/{service_id}")
async def update_service(service_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "BARBER":
        raise HTTPException(status_code=403, detail="Acesso negado")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    service.name = data.get("name", service.name)
    service.price = data.get("price", service.price)
    service.duration = data.get("duration", service.duration)
    
    db.commit()
    return {"message": "Serviço atualizado com sucesso"}

# ROTA PRIVADA: Eliminar serviço
@app.delete("/admin/services/{service_id}")
async def delete_service(service_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "BARBER":
        raise HTTPException(status_code=403, detail="Acesso negado")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    db.delete(service)
    db.commit()
    return {"message": "Serviço removido"}

# ==========================================
# GESTÃO DA AGENDA
# ==========================================

@app.get("/admin/{barbershop_id}/appointments")
def get_agenda(barbershop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = int(current_user.get("sub"))
    user_role = current_user.get("role")

    # 1. Filtro base: Apenas agendamentos que ainda NÃO foram concluídos ou cancelados
    query = db.query(Appointment).filter(
        Appointment.barbershop_id == barbershop_id,
        Appointment.status == "scheduled" 
    )

    # 2. Se for BARBEIRO, ele só vê os agendamentos DELE
    if user_role == "BARBER":
        query = query.filter(Appointment.barber_id == user_id)
    
    # Se for CEO/GERENTE/OWNER, a query continua com todos da barbearia
    
    return query.order_by(Appointment.date_time.asc()).all()

@app.put("/admin/appointments/{appo_id}/conclude")
def conclude_appointment(appo_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    shop_id = current_user.get("shop_id")
    
    # Busca o agendamento garantindo que ele pertence à barbearia do usuário
    appo = db.query(Appointment).filter(
        Appointment.id == appo_id,
        Appointment.barbershop_id == shop_id # Segurança extra
    ).first()
    
    if not appo:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado nesta barbearia")
    
    if appo.status == "concluido":
        return {"message": "Este atendimento já estava concluído."}
    
    appo.status = "concluido"
    db.commit()
    
    return {"message": "Atendimento concluído com sucesso!"}

# ==========================================
# FECHAMENTO DE CAIXA (NOVO)
# ==========================================
@app.post("/admin/{barbershop_id}/close-register")
async def close_register(barbershop_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    target_email = data.get("email")
    observations = data.get("observations", "Nenhuma")
    incidentes = data.get("incidentes", "Nenhum")
    role = current_user.get("role")
    user_id = current_user.get("sub")

    # 1. Credenciais de E-mail (do ficheiro .env)
    remetente = os.getenv("EMAIL_SENDER")
    senha = os.getenv("EMAIL_PASSWORD")

    if not remetente or not senha:
        raise HTTPException(status_code=500, detail="E-mail do sistema não configurado no servidor.")
    if not target_email:
        raise HTTPException(status_code=400, detail="E-mail de destino não fornecido.")

    # 2. Lógica Financeira Correta (Apenas os cortes concluídos de HOJE)
    hoje = datetime.now()
    
    appointments_query = db.query(Appointment).filter(
        Appointment.barbershop_id == barbershop_id,
        Appointment.status == "concluido", # Conta apenas os que pagaram
        extract('year', Appointment.date_time) == hoje.year,
        extract('month', Appointment.date_time) == hoje.month,
        extract('day', Appointment.date_time) == hoje.day
    )
    
    # Se for barbeiro, pega só os cortes dele. Se for Gestão, pega todos.
    if role == "BARBER":
        appointments = [a for a in appointments_query.all() if str(a.barber_id) == str(user_id)]
        tipo_relatorio = "Faturamento Pessoal (Barbeiro)"
    else:
        appointments = appointments_query.all()
        tipo_relatorio = "Faturamento Global (Loja)"

    total_faturado = sum(a.service_price or 0.0 for a in appointments)
    qtd_cortes = len(appointments)

    # 3. Montar o E-mail em HTML
    assunto = f"Fechamento de Caixa - {hoje.strftime('%d/%m/%Y')} - {tipo_relatorio}"
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden;">
                <div style="background-color: #18181b; padding: 24px; text-align: center;">
                    <h2 style="color: #f59e0b; margin: 0; text-transform: uppercase;">Relatório de Fechamento</h2>
                    <p style="color: #a1a1aa; margin: 5px 0 0 0;">{tipo_relatorio}</p>
                </div>
                <div style="padding: 32px; background-color: #fafafa;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e4e4e7; text-align: center; margin-bottom: 24px;">
                        <p style="font-size: 14px; color: #71717a; text-transform: uppercase; font-weight: bold; margin: 0;">Faturamento do Dia</p>
                        <h1 style="color: #10b981; font-size: 36px; margin: 8px 0;">R$ {total_faturado:.2f}</h1>
                        <p style="margin: 0; color: #52525b; font-size: 14px;">Total de Serviços: <strong>{qtd_cortes}</strong></p>
                    </div>
                    
                    <h4 style="color: #3f3f46; margin-bottom: 8px;">Observações da Equipa:</h4>
                    <div style="background-color: #f4f4f5; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                        <p style="margin: 0; font-size: 14px;">{observations}</p>
                    </div>

                    <h4 style="color: #ef4444; margin-bottom: 8px;">Incidentes Registados:</h4>
                    <div style="background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fca5a5;">
                        <p style="margin: 0; font-size: 14px; color: #991b1b;">{incidentes}</p>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart()
    msg["From"] = remetente
    msg["To"] = target_email
    msg["Subject"] = assunto
    msg.attach(MIMEText(html, "html"))

    # 4. Envio direto pelo Python
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(remetente, senha)
        server.sendmail(remetente, target_email, msg.as_string())
        server.quit()
    except Exception as e:
        print("Erro ao enviar email de fechamento:", e)
        raise HTTPException(status_code=500, detail="O fechamento foi salvo, mas houve uma falha técnica ao enviar o e-mail.")

    return {"message": "Fechamento concluído e enviado para o e-mail!", "total": total_faturado}

@app.get("/barbershops/by-slug/{slug}")
def get_shop_by_slug(slug: str, db: Session = Depends(get_db)):
    # Busca a barbearia pelo slug
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    # Já retorna os serviços e barbeiros vinculados a ela
    # O SQLAlchemy faz isso automaticamente se as relationships estiverem no models.py
    active_barbers = [b for b in shop.barbers if getattr(b, 'is_active', True)]

    return {
        "id": shop.id,
        "name": shop.name,
        "slug": shop.slug,
        "logo_url": shop.logo_url,
        "portfolio_images": shop.portfolio_images,
        "description": shop.description,
        "address": shop.address,
        "services": shop.services,
        "barbers": shop.barbers,
        "barbers": active_barbers
    }

# ==========================================
# LISTAR MEMBROS DE UMA BARBEARIA (SUPERADMIN)
# ==========================================

@app.get("/super/barbershops/{shop_id}/barbers")
def get_barbers_for_super(shop_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Segurança: Apenas o SuperAdmin pode usar esta rota
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Acesso negado!")

    # Procura todos os barbeiros que pertencem a esta shop_id
    barbers = db.query(Barber).filter(Barber.barbershop_id == shop_id).all()
    
    return barbers

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)