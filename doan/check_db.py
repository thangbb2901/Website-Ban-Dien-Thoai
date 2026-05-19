import os

import mysql.connector


DB_HOST = os.environ.get('MYSQL_HOST', 'localhost')
DB_PORT = int(os.environ.get('MYSQL_PORT', '3307'))
DB_USER = os.environ.get('MYSQL_USER', 'root')
DB_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
DB_NAME = os.environ.get('MYSQL_DATABASE', 'phone_store')

conn = mysql.connector.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
)
cursor = conn.cursor(dictionary=True)

# Check admin user
cursor.execute('SELECT username, perm, off FROM users WHERE username=%s', ('admin',))
user = cursor.fetchone()

if user:
    print("✓ Admin user found")
    print(f"  Username: {user['username']}")
    print(f"  Perm (is_admin): {user['perm']}")
    print(f"  Off (banned): {user['off']}")
else:
    print("✗ Admin user NOT found")

# Check total users
cursor.execute('SELECT COUNT(*) as count FROM users')
total = cursor.fetchone()
print(f"\nTotal users in DB: {total['count']}")

conn.close()
