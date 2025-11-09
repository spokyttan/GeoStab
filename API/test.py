# En main.py
from fastapi import FastAPI

# 1. Crear la instancia de la aplicación
app = FastAPI()

# 2. Definir una "operación de path" (un endpoint)
@app.get("/")
async def root():
    return {"message": "Hola Mundo"}