import json
import logging
import os
import re
import secrets
import shutil
import time
import uuid
from collections.abc import Mapping

import mysql.connector
from werkzeug.security import generate_password_hash


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_ROOT = os.environ.get('PHONE_STORE_UPLOAD_ROOT', os.path.join(BASE_DIR, 'static', 'img'))

MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', '3306'))
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'phone_store')

_DATABASE_READY = False


def _connect_server():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        connection_timeout=5,
    )


def _ensure_database_exists():
    global _DATABASE_READY
    if _DATABASE_READY:
        return

    last_error = None
    for attempt in range(30):
        try:
            conn = _connect_server()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE schema_name = %s",
                (MYSQL_DATABASE,),
            )
            if cursor.fetchone() is None:
                raise mysql.connector.Error(f"Database `{MYSQL_DATABASE}` chưa sẵn sàng.")
            cursor.close()
            conn.close()
            _DATABASE_READY = True
            logging.info(
                "Sử dụng database MySQL tại: %s@%s:%s/%s",
                MYSQL_USER,
                MYSQL_HOST,
                MYSQL_PORT,
                MYSQL_DATABASE,
            )
            return
        except mysql.connector.Error as exc:
            last_error = exc
            logging.warning(
                "Đang chờ MySQL sẵn sàng (lần %s/30): %s",
                attempt + 1,
                exc,
            )
            time.sleep(2)

    raise last_error


def _translate_query(query):
    if not isinstance(query, str):
        return query
    translated = query.replace('RANDOM()', 'RAND()')
    translated = translated.replace('REAL)', 'DECIMAL(20,0))')
    return translated.replace('?', '%s')


class DbRow(Mapping):
    def __init__(self, columns, values):
        self._columns = tuple(columns)
        self._values = tuple(values)
        self._data = {col: self._values[i] for i, col in enumerate(self._columns)}

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._data[key]

    def __iter__(self):
        return iter(self._columns)

    def __len__(self):
        return len(self._columns)

    def keys(self):
        return self._data.keys()

    def items(self):
        return self._data.items()

    def values(self):
        return self._data.values()

    def get(self, key, default=None):
        return self._data.get(key, default)

    def __repr__(self):
        return repr(self._data)


def _wrap_row(columns, row):
    if row is None:
        return None
    return DbRow(columns, row)


class CursorAdapter:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None, multi=False):
        query = _translate_query(query)
        if params is None:
            return self._cursor.execute(query)
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_params):
        return self._cursor.executemany(_translate_query(query), seq_params)

    def fetchone(self):
        row = self._cursor.fetchone()
        return _wrap_row(self._cursor.column_names, row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        return [_wrap_row(self._cursor.column_names, row) for row in rows]

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class ConnectionAdapter:
    def __init__(self, connection):
        self._connection = connection

    def cursor(self):
        return CursorAdapter(self._connection.cursor(buffered=True))

    def commit(self):
        return self._connection.commit()

    def rollback(self):
        return self._connection.rollback()

    def close(self):
        return self._connection.close()

    def __getattr__(self, name):
        return getattr(self._connection, name)


def get_db_connection():
    """Kết nối đến MySQL và trả về đối tượng kết nối tương thích."""
    _ensure_database_exists()

    last_error = None
    for attempt in range(30):
        try:
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                autocommit=False,
                charset='utf8mb4',
                use_unicode=True,
                connection_timeout=10,
            )
            return ConnectionAdapter(conn)
        except mysql.connector.Error as exc:
            last_error = exc
            logging.warning(
                "Đang kết nối MySQL (lần %s/30): %s",
                attempt + 1,
                exc,
            )
            time.sleep(2)

    raise last_error


def product_row_to_dict(row):
    """Chuyển đổi hàng sản phẩm từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    img_filename = row["img"]
    if not img_filename or img_filename == 'default.png':
        img_value = '/static/img/default.png'
    elif str(img_filename).startswith(('http://', 'https://', '/')):
        img_value = img_filename
    else:
        img_value = f"/static/img/products/{img_filename}"
    return {
        "masp": row["masp"], "name": row["name"], "company": row["company"],
        "img": img_value,
        "price": row["price"], "star": row["star"], "rateCount": row["rateCount"],
        "promo": {"name": row["promo_name"], "value": row["promo_value"]},
        "detail": {
            "screen": row["detail_screen"], "os": row["detail_os"],
            "camara": row["detail_camara"], "camaraFront": row["detail_camaraFront"],
            "cpu": row["detail_cpu"], "ram": row["detail_ram"], "rom": row["detail_rom"],
            "microUSB": row["detail_microUSB"], "memoryStick": row["detail_memoryStick"],
            "sim": row["detail_sim"], "battery": row["detail_battery"]
        },
        "quantity": row["quantity"]
    }


def user_row_to_dict(row):
    """Chuyển đổi hàng người dùng từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    return {
        "username": row["username"], "ho": row["ho"], "ten": row["ten"],
        "email": row["email"],
        "address": row["address"] if "address" in row.keys() else None,
        "products": json.loads(row["products"]) if row["products"] else [],
        "off": bool(row["off"]),
        "perm": row["perm"] if "perm" in row.keys() else 0
    }


def order_row_to_dict(order_row, items_rows):
    """Chuyển đổi hàng đơn hàng và các mục đơn hàng thành dictionary."""
    if order_row is None:
        return None
    order_dict = dict(order_row)
    order_dict['shipping_info'] = json.loads(order_row["shipping_info"]) if order_row["shipping_info"] else {}
    order_dict['products'] = [dict(item_row) for item_row in items_rows]
    return order_dict


def banner_row_to_dict(row):
    """Chuyển đổi hàng banner từ cơ sở dữ liệu thành dictionary."""
    if row is None:
        return None
    return {
        "banner_id": row["banner_id"],
        "filename": row["filename"],
        "alt_text": row["alt_text"],
        "link_url": row["link_url"],
        "is_active": bool(row["is_active"]),
        "display_order": row["display_order"],
        "uploaded_at": row["uploaded_at"],
        "banner_type": row["banner_type"] if "banner_type" in row.keys() else "hero",
        "image_url": f"/static/img/banners/{row['filename']}"
    }


def generate_unique_masp_db(company_name="Unknown"):
    """Tạo mã sản phẩm duy nhất dựa trên tên công ty."""
    prefix = company_name[:3].upper() if company_name and isinstance(company_name, str) and len(company_name) >= 3 else "UNK"
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for _ in range(20):
            new_masp = f"{prefix}{uuid.uuid4().hex[:5].upper()}"
            cursor.execute("SELECT masp FROM products WHERE masp = ?", (new_masp,))
            if cursor.fetchone() is None:
                return new_masp
        logging.warning("Không thể tạo masp duy nhất sau nhiều lần thử.")
        return str(uuid.uuid4()).upper()
    except mysql.connector.Error as e:
        logging.error(f"Lỗi CSDL khi tạo masp: {e}")
        return str(uuid.uuid4()).upper()
    finally:
        if conn:
            conn.close()


def string_to_num(s, default_char='.'):
    """Chuyển đổi chuỗi thành số, bỏ các ký tự không phải số."""
    try:
        if s is None or str(s).strip() == '':
            return 0
        cleaned_s = "".join(filter(str.isdigit, str(s)))
        return float(cleaned_s) if cleaned_s else 0
    except Exception as e:
        logging.error(f"Lỗi khi chuyển đổi giá trị '{s}' sang số: {e}")
        return 0


def validate_username(username):
    """Kiểm tra tính hợp lệ của tên đăng nhập."""
    if not username or not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return False
    return True


def validate_email(email):
    """Kiểm tra tính hợp lệ của email."""
    if not email:
        return True
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))


def ensure_admin_account():
    """Đảm bảo tài khoản admin mặc định tồn tại."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        if not cursor.fetchone():
            default_admin_password = os.getenv('ADMIN_DEFAULT_PASSWORD') or secrets.token_urlsafe(12)
            cursor.execute('''
                INSERT INTO users (username, pass, ho, ten, email, products, off, perm)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', ('admin', generate_password_hash(default_admin_password), 'Admin', 'Account', 'admin@shop.com', '[]', 0, 1))
            conn.commit()
            if os.getenv('ADMIN_DEFAULT_PASSWORD'):
                logging.info("Đã tạo tài khoản admin mặc định từ biến môi trường ADMIN_DEFAULT_PASSWORD.")
            else:
                logging.warning(f"Đã tạo tài khoản admin mặc định. Mật khẩu tạm thời: {default_admin_password}")
        else:
            logging.info("Tài khoản admin đã tồn tại.")
    except mysql.connector.Error as e:
        logging.error(f"Lỗi CSDL khi đảm bảo tài khoản admin: {e}")
    finally:
        if conn:
            conn.close()


def get_top_products():
    """Lấy danh sách 5 sản phẩm bán chạy nhất."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT p.masp, p.name, p.price, p.img, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN products p ON oi.product_masp = p.masp
            WHERE o.status = 'Đã giao hàng'
            GROUP BY p.masp
            ORDER BY total_sold DESC, CAST(REPLACE(p.price, '.', '') AS DECIMAL(20,0)) DESC, p.name ASC
            LIMIT 10
        """)
        rows = cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "masp": row["masp"],
                "name": row["name"],
                "price": row["price"],
                "img": row["img"],
                "total_sold": row["total_sold"]
            })
        return result
    except mysql.connector.Error as e:
        logging.error(f"Lỗi CSDL khi lấy top sản phẩm: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_random_products(limit=2):
    """Lấy ngẫu nhiên một số sản phẩm từ cơ sở dữ liệu."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, masp FROM products ORDER BY RAND() LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [{"name": row["name"], "masp": row["masp"]} for row in rows]
    except mysql.connector.Error as e:
        logging.error(f"Lỗi CSDL khi lấy sản phẩm ngẫu nhiên: {e}")
        return []
    finally:
        if conn:
            conn.close()
