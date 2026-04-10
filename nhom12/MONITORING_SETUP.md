# Hướng dẫn Prometheus + Grafana Dashboard

## 1. Kiến trúc giám sát

```
┌─────────────────────────────────────────────────────────┐
│                   Ứng dụng Flask                         │
│  - /metrics endpoint (Prometheus client metrics)          │
│  - Tracking: login, orders, revenue, attacks            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │  Flask  │  │  Nginx   │  │  System  │
    │ :5000   │  │Exporter  │  │Exporter  │
    │/metrics │  │  :9113   │  │  :9100   │
    └────┬────┘  └────┬─────┘  └────┬─────┘
         │            │             │
         └────────────┼─────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  Prometheus      │
            │  :9090           │
            │ Scrapes every 5s │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Grafana         │
            │  :3000           │
            │  Dashboard       │
            └──────────────────┘
```

## 2. Chạy Docker Compose

```bash
docker-compose up -d
```

Services sẽ khởi động:
- **Flask App** (3 replicas): http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
- **Node Exporter**: http://localhost:9100
- **Nginx Exporter**: http://localhost:9113 (via Prometheus)

## 3. Generate dữ liệu mẫu

```bash
python3 generate_metrics_data.py
```

Script này sẽ:
- ✓ Tạo tài khoản test
- ✓ Simulate traffic (page visits)
- ✓ Simulate tấn công brute force
- ✓ Tạo sample orders
- ✓ Verify metrics endpoint

## 4. Prometheus Metrics được thu thập

### HTTP Traffic Metrics
```
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}
```

### Security Metrics (Phát hiện tấn công)
```
login_attempts_total{result="success|failed|banned"}
security_events_total{event_type="failed_login|banned_account"}
active_users_current
```

### Business Metrics
```
orders_created_total
products_sold_total{product_name, company}
revenue_total_vnd
```

### System Metrics (từ Node Exporter)
```
node_cpu_seconds_total
node_memory_MemFree_bytes
node_memory_MemTotal_bytes
node_disk_io_time_seconds_total
node_network_receive_bytes_total
```

### Nginx Metrics
```
nginx_connections_active
nginx_http_requests_total
```

## 5. Truy cập Grafana

1. Mở: http://localhost:3000
2. Login (default):
   - Username: `admin`
   - Password: `admin`
3. Nhấn "Add your first data source"
4. Chọn **Prometheus**
5. URL: `http://prometheus:9090`
6. Nhấn "Save & test"

## 6. Tạo Dashboard

### Option 1: Import Dashboard có sẵn
1. Vào **Dashboards** → **Browse**
2. Nhấn **Import** 
3. Sử dụng ID từ Grafana Hub (ví dụ: 1860 cho Node Exporter)

### Option 2: Tạo Dashboard tùy chỉnh

**Panel 1: HTTP Requests per second**
```
rate(http_requests_total[1m])
```

**Panel 2: Failed Login Attempts**
```
increase(login_attempts_total{result="failed"}[5m])
```

**Panel 3: Security Events**
```
increase(security_events_total[5m])
```

**Panel 4: Active Orders**
```
increase(orders_created_total[5m])
```

**Panel 5: Total Revenue**
```
revenue_total_vnd
```

**Panel 6: CPU Usage**
```
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Panel 7: Memory Usage**
```
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))
```

**Panel 8: Network Traffic**
```
rate(node_network_receive_bytes_total[5m])
```

## 7. Cảnh báo (Alerts) - Optional

Thêm các rule trong `prometheus.yml`:

```yaml
groups:
  - name: alerts
    rules:
      - alert: HighFailedLoginAttempts
        expr: increase(login_attempts_total{result="failed"}[5m]) > 10
        annotations:
          summary: "Tấn công brute force phát hiện!"
          
      - alert: HighCPU
        expr: (100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)) > 80
        annotations:
          summary: "CPU sử dụng quá 80%!"
```

## 8. Các Metrics quan trọng để theo dõi

| Metric | Ý nghĩa | Alert nếu |
|--------|---------|----------|
| `http_requests_total` | Số request tổng | N/A |
| `login_attempts_total[failed]` | Đăng nhập thất bại | > 10 trong 5 phút |
| `security_events_total[failed_login]` | Cố gắng tấn công | > 5 |
| `security_events_total[banned_account]` | Tài khoản bị khóa | > 0 |
| `orders_created_total` | Đơn hàng tạo | N/A (monitoring) |
| `revenue_total_vnd` | Tổng doanh thu | N/A |
| `node_cpu_seconds_total` | CPU usage | > 80% |
| `node_memory_MemAvailable_bytes` | Memory libre | < 20% |

## 9. Troubleshoot

### Prometheus không thấy metrics
```bash
curl http://localhost:8080/metrics
```
Nếu không trả về dữ liệu, kiểm tra Flask app logs.

### Grafana không kết nối Prometheus
- Kiểm tra: http://localhost:9090 có hoạt động
- Trong Prometheus datasource, dùng URL: `http://prometheus:9090` (internal)

### Để xem logs
```bash
docker-compose logs -f web
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

## 10. Stop Services

```bash
docker-compose down
```

## 11. Tài liệu tham khảo

- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/grafana/latest/
- prometheus_client Python: https://github.com/prometheus/client_python
- Node Exporter: https://github.com/prometheus/node_exporter
