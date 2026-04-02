# Sử dụng một image Python chính thức làm base image
FROM python:3.9-slim

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép file requirements vào thư mục làm việc
COPY requirements.txt .

# Cài đặt các thư viện cần thiết
# --no-cache-dir để không lưu cache, giúp image nhẹ hơn
# psycopg2-binary là driver cho PostgreSQL
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn của dự án vào thư mục làm việc
COPY . .

# Expose port 5000 để container có thể nhận request từ bên ngoài
EXPOSE 5000

# Lệnh để chạy ứng dụng khi container khởi động
# Gunicorn sẽ là WSGI server, sử dụng eventlet để hộ trợ Socket.IO mượt mà
# app:app chỉ đến đối tượng 'app' trong file 'app.py'
CMD ["gunicorn", "-k", "eventlet", "--workers", "1", "--bind", "0.0.0.0:5000", "app:app"]