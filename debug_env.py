import os
from dotenv import load_dotenv

print(f"CWD: {os.getcwd()}")
load_dotenv()
print(f"INACAP_DB_HOST: {os.getenv('INACAP_DB_HOST')}")
