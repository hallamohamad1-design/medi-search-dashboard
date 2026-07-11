import psycopg2 
from psycopg2.extras import RealDictCursor


DB_CONFIG = {
    "host": "ep-wandering-hill-at0u1gzo-pooler.c-9.us-east-1.aws.neon.tech",
    "database": "neondb",
    "user": "neondb_owner",
    "password": "npg_i0N2XhQuEUYL",
    "port": "5432"
}



def get_connection():
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        database=DB_CONFIG["database"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        port=DB_CONFIG["port"],
        cursor_factory=RealDictCursor
    )

