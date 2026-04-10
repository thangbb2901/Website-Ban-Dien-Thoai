import sqlite3
import sys

conn = sqlite3.connect('products.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Check admin user
cursor.execute('SELECT username, perm, off FROM users WHERE username=?', ('admin',))
user = cursor.fetchone()

if user:
    print(f"✓ Admin user found")
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
