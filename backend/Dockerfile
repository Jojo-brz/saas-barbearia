# Usa uma versão oficial e leve do Python
FROM python:3.11-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia apenas o arquivo de dependências primeiro (para usar o cache do Docker)
COPY requirements.txt .

# Instala as dependências sem guardar cache para economizar espaço
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o resto do código do backend para dentro do container
COPY . .

# Cria a pasta de uploads caso não exista
RUN mkdir -p uploads

# Expõe a porta que o FastAPI vai rodar
EXPOSE 8000

# Comando para rodar a aplicação quando o container ligar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]