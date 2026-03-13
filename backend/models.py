from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Barbershop(Base):
    __tablename__ = "barbershops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    owner_email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    
    # Novos campos para compatibilidade com o Frontend
    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # CAMPO DE SEGURANÇA MESTRE
    is_superadmin = Column(Boolean, default=False)
    
    # Configuração de horários (Armazenado como JSON string)
    hours_config = Column(Text, nullable=True)

    # Relacionamentos
    barbers = relationship("Barber", back_populates="barbershop", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="barbershop", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="barbershop", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="barbershop", cascade="all, delete-orphan")

class Barber(Base):
    __tablename__ = "barbers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    role = Column(String, default="BARBER") # OWNER ou BARBER
    
    # CAMPO PARA LOGIN DE EQUIPE
    pin = Column(String, nullable=True) # Senha de 4 dígitos

    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    barbershop = relationship("Barbershop", back_populates="barbers")
    appointments = relationship("Appointment", back_populates="barber")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False) # minutos
    image_url = Column(String, nullable=True)
    
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    barbershop = relationship("Barbershop", back_populates="services")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    time = Column(DateTime, nullable=False) # Data e Hora combinados
    price = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)
    status = Column(String, default="confirmed") # confirmed, completed, cancelled

    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    barber_id = Column(Integer, ForeignKey("barbers.id"))

    barbershop = relationship("Barbershop", back_populates="appointments")
    barber = relationship("Barber", back_populates="appointments")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # "IN" ou "OUT"
    category = Column(String, nullable=False) # Ex: "Corte", "Aluguel", "Produtos"
    date = Column(DateTime, default=datetime.datetime.utcnow)
    
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    barbershop = relationship("Barbershop", back_populates="transactions")