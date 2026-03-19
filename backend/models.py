from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Barbershop(Base):
    __tablename__ = "barbershops"
    __table_args__ = {'extend_existing': True} # Previne erros de redefinição

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    slug = Column(String, unique=True, index=True)
    owner_email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    portfolio_images = Column(String, nullable=True)

    open_time = Column(String, default="09:00")
    close_time = Column(String, default="19:00")
    interval_start = Column(String, default="12:00")
    interval_end = Column(String, default="13:00")
    
    # Relações
    barbers = relationship("Barber", back_populates="barbershop")
    services = relationship("Service", back_populates="barbershop")
    products = relationship("Product", back_populates="barbershop")

class Barber(Base):
    __tablename__ = "barbers"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String, default="BARBER") # OWNER, MANAGER, BARBER
    pin = Column(String, unique=True) # PIN de 4 a 6 dígitos
    email = Column(String, nullable=True)
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    profile_image_url = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    barbershop = relationship("Barbershop", back_populates="barbers")

class Service(Base):
    __tablename__ = "services"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    duration = Column(Integer) # em minutos
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))

    barbershop = relationship("Barbershop", back_populates="services")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    stock_quantity = Column(Integer, default=0)
    price = Column(Float)
    cost_price = Column(Float, nullable=True) # Para cálculo de lucro futuro
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    
    barbershop = relationship("Barbershop", back_populates="products")

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String)
    client_phone = Column(String)
    date_time = Column(DateTime)
    service_id = Column(Integer, ForeignKey("services.id"))
    barber_id = Column(Integer, ForeignKey("barbers.id"))
    barbershop_id = Column(Integer, ForeignKey("barbershops.id"))
    status = Column(String, default="scheduled") # scheduled, completed, cancelled
    service_price = Column(Float, default=0.0)
    barbershop = relationship("Barbershop")
    barber = relationship("Barber")
    service = relationship("Service")