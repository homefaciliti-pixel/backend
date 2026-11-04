import mysql.connector
import os
from deep_translator import GoogleTranslator
from dotenv import load_dotenv
import time

load_dotenv('../.env')

def get_connection():
    return mysql.connector.connect(
        host=os.getenv('MYSQL_HOST'),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DATABASE')
    )

conn = get_connection()
cursor = conn.cursor(dictionary=True)

langs = ['hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as']

def safe_translate(text, target_lang):
    if not text: return None
    try:
        translated = GoogleTranslator(source='en', target=target_lang).translate(text)
        return translated
    except Exception as e:
        print(f"Error translating '{text}' to {target_lang}: {e}")
        time.sleep(2)
        return None

print("Starting categories...")
cursor.execute("SELECT id, title FROM node_categories")
categories = cursor.fetchall()
conn.close()

for cat in categories:
    c_id = cat['id']
    title = cat['title']
    
    conn = get_connection()
    c = conn.cursor(dictionary=True)
    c.execute("SELECT * FROM node_categories WHERE id=%s", (c_id,))
    row = c.fetchone()
    
    updates = []
    values = []
    
    for lang in langs:
        t_col = f"title_{lang}"
        if not row.get(t_col) and title:
            trans_title = safe_translate(title, lang)
            if trans_title:
                updates.append(f"{t_col} = %s")
                values.append(trans_title)

    if updates:
        values.append(c_id)
        q = f"UPDATE node_categories SET {', '.join(updates)} WHERE id = %s"
        c.execute(q, tuple(values))
        conn.commit()
        print(f"Updated category {c_id}")
    conn.close()

print("Starting services...")
conn = get_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT id, title, description FROM node_services")
services = cursor.fetchall()
conn.close()

for srv in services:
    s_id = srv['id']
    title = srv['title']
    desc = srv['description']
    
    conn = get_connection()
    c = conn.cursor(dictionary=True)
    c.execute("SELECT * FROM node_services WHERE id=%s", (s_id,))
    row = c.fetchone()
    conn.close()
    
    updates = []
    values = []
    
    for lang in langs:
        t_col = f"title_{lang}"
        d_col = f"description_{lang}"
        
        if not row.get(t_col) and title:
            trans_title = safe_translate(title, lang)
            if trans_title:
                updates.append(f"{t_col} = %s")
                values.append(trans_title)
                
        if not row.get(d_col) and desc:
            trans_desc = safe_translate(desc, lang)
            if trans_desc:
                updates.append(f"{d_col} = %s")
                values.append(trans_desc)

    if updates:
        values.append(s_id)
        q = f"UPDATE node_services SET {', '.join(updates)} WHERE id = %s"
        conn = get_connection()
        c = conn.cursor(dictionary=True)
        c.execute(q, tuple(values))
        conn.commit()
        print(f"Updated service {s_id}")
        conn.close()

print("Done translating everything!")

