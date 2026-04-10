# Hướng dẫn Tạo Grafana Dashboard

## Bước 1: Truy cập Grafana
- URL: **http://localhost:3000**
- Username: `admin`
- Password: `admin`

---

## Dashboard 1: Main Overview (Tổng Quát)

### Bước tạo:
1. Nhấn **"+"** → **"Dashboard"** → **"New dashboard"**
2. Nhấn **"Add panel"**

### Panel 1: Total Requests (Stat Card)
```
Title: Total HTTP Requests
Query: sum(rate(http_requests_total[5m]))
Panel Type: Stat
Unit: reqpm
Thresholds: Green (0-100), Yellow (100-500), Red (500+)
```

### Panel 2: Failed Logins Alert (Stat Card) ⭐ Đã có Data
```
Title: Failed Login Attempts (5m)
Query: sum(increase(login_attempts_total{result="failed"}[5m]))
Panel Type: Stat
Unit: short
Thresholds: Green (0-5), Yellow (5-10), Red (10+)
Color: Red if > 10 (brute force risk!)
```

### Panel 3: Successful Logins (Stat Card) ⭐ Đã có Data
```
Title: Successful Logins (5m)
Query: sum(increase(login_attempts_total{result="success"}[5m]))
Panel Type: Stat
Unit: short
Thresholds: Green (0-100), Yellow (100-500), Red (500+)
```

### Panel 4: HTTP Traffic Timeline (Graph) ⭐ Đã có Data
```
Title: Web Traffic (GET vs POST)
Query A: rate(http_requests_total{method="GET"}[1m])  → Legend: GET Requests
Query B: rate(http_requests_total{method="POST"}[1m]) → Legend: POST Requests
Panel Type: Time Series
Y-axis: req/m
```

### Panel 5: Server Resources (Dual Y-axis) ⭐ Đã có Data
```
Title: System Resources
Query A: 100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))
         → Alias: CPU Usage (%)
Query B: 100 * (1 - (avg(node_memory_MemAvailable_bytes) / avg(node_memory_MemTotal_bytes)))
         → Alias: Memory Usage (%)
Panel Type: Time Series
Left Y-axis: 0-100 (%)
```

### Panel 6: API Response Latency (Stat) ⭐ Đã có Data
```
Title: Avg Response Time (p95)
Query: histogram_quantile(0.95, rate(http_request_duration_seconds[5m]))
Panel Type: Stat
Unit: s (seconds)
Decimals: 3
```


---

## Dashboard 2: Security & Attack Detection

### Bước tạo:
1. Tạo dashboard mới: **"+"** → **"Dashboard"** → **"New dashboard"**
2. Name: "Security Monitoring"

### Panel 1: Failed Login Timeline
```
Title: Failed Login Attempts (Real-time)
Query: increase(login_attempts_total{result="failed"}[1m])
Panel Type: Time Series
Alert Line: 5 (yellow), 10 (red) - Brute force threshold
```

### Panel 2: Security Events
```
Title: Security Events
Query: increase(security_events_total[1m])
Legend options:
  - By labels: event_type
Panel Type: Time Series
Thresholds:
  - failed_login: Yellow
  - banned_account: Red
```

### Panel 3: Active Users (Gauge)
```
Title: Active Users Right Now
Query: active_users_current
Panel Type: Gauge
Min: 0, Max: 1000
Thresholds: Green (0-100), Yellow (100-500), Red (500+)
```

### Panel 4: Login Success Rate (Stat)
```
Title: Login Success Rate (%)
Query: 100 * (sum(increase(login_attempts_total{result="success"}[1h])) / 
       sum(increase(login_attempts_total[1h])))
Panel Type: Stat
Unit: percent
```

### Panel 5: Brute Force Detection Alert (Alert List)
```
Title: ⚠️ Brute Force Alerts
Under "Alert" tab:
- Alert if: increase(login_attempts_total{result="failed"}[5m]) > 10
- Message: "Brute force attack detected! {value} failed attempts in last 5 minutes"
```

---

## Dashboard 3: Business Analytics

### Bước tạo:
1. Tạo dashboard mới
2. Name: "Business Metrics"

### Panel 1: Daily Revenue Trend
```
Title: Revenue Trend (Last 7 Days)
Query: revenue_total_vnd
Panel Type: Time Series
Y-axis: VND (₫)
Fill opacity: 30%
```

### Panel 2: Orders Status Distribution (Pie Chart)
```
Title: Orders by Status
Query: orders_created_total (need to track by status in Flask)
Alternative: sum(increase(orders_created_total[7d]))
Panel Type: Pie Chart
Legend: Show
Values: Show
```

### Panel 3: Products Sold by Company (Bar Chart)
```
Title: Products Sold by Company
Query: sum by (company) (increase(products_sold_total[7d]))
Panel Type: Bar Chart
X-axis: company
Y-axis: quantity
Sort: descending
```

### Panel 4: Orders/Hour (Heatmap)
```
Title: Order Distribution by Hour
Query: sum(increase(orders_created_total[1h]))
Panel Type: Time Series
Bucket size: 1h
```

### Panel 5: Average Order Value
```
Title: Average Order Value (₫)
Query: revenue_total_vnd / orders_created_total
Panel Type: Stat
Unit: VND
```

---

## Dashboard 4: Infrastructure Health

### Bước tạo:
1. Tạo dashboard mới
2. Name: "Infrastructure"

### Panel 1: Flask Replicas Status
```
Title: Backend Health (3 Replicas)
Query: up{job="flask_app"}
Panel Type: Stat
Legend: Show (by instance)
Color: Green (1 = up), Red (0 = down)
```

### Panel 2: Response Time
```
Title: API Response Time (p95)
Query: histogram_quantile(0.95, http_request_duration_seconds)
Legend: {endpoint}
Panel Type: Time Series
Y-axis: seconds (ms)
```

### Panel 3: Nginx Connections
```
Title: Active Connections
Query: nginx_connections_active
Panel Type: Stat (Gauge also works)
Thresholds: Green (0-100), Yellow (100-500), Red (500+)
```

### Panel 4: Disk Usage
```
Title: Disk Space Usage
Query: 100 * (1 - (node_filesystem_avail_bytes{mountpoint="/"} / 
       node_filesystem_size_bytes{mountpoint="/"}))
Panel Type: Gauge
Min: 0, Max: 100
Unit: percent
Thresholds: Green (0-70), Yellow (70-85), Red (85+)
```

### Panel 5: Network Traffic
```
Title: Network I/O
Query A: rate(node_network_receive_bytes_total[1m])
         → Alias: Incoming
Query B: rate(node_network_transmit_bytes_total[1m])
         → Alias: Outgoing
Panel Type: Time Series
Y-axis: Bytes/sec
```

---

## Cách Thêm PromQL Query vào Panel:

1. **Click panel** → **"Edit"**
2. Dưới **"Query"** section:
   - Chọn **"Prometheus"** data source
   - Paste PromQL query vào ô **"Query"**
   - Nhấn **Ctrl+Enter** để execute
3. **Customize** panel:
   - Title, Unit, Thresholds, Colors
   - Legend options, Refresh rate
4. **Save** dashboard

---

## Các PromQL Query Hữu Ích:

### HTTP Traffic
```
# Total requests per second
rate(http_requests_total[1m])

# Requests by method
rate(http_requests_total{method="GET"}[1m])
rate(http_requests_total{method="POST"}[1m])

# 404 errors
rate(http_requests_total{status="404"}[1m])

# Average response time
avg(http_request_duration_seconds)
```

### Security
```
# Failed logins last 5 minutes
increase(login_attempts_total{result="failed"}[5m])

# Successful logins
increase(login_attempts_total{result="success"}[1h])

# Banned accounts
increase(security_events_total{event_type="banned_account"}[1d])
```

### Business
```
# Total orders
sum(increase(orders_created_total[1d]))

# Products sold
sum(increase(products_sold_total[1d]))

# Revenue
revenue_total_vnd

# Avg order value
revenue_total_vnd / orders_created_total
```

### System
```
# CPU usage %
100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))

# Memory usage %
100 * (1 - (avg(node_memory_MemAvailable_bytes) / avg(node_memory_MemTotal_bytes)))

# Disk usage %
100 * (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes))

# Network incoming
rate(node_network_receive_bytes_total[1m])
```

---

## Tips & Tricks:

1. **Auto-refresh**: Set refresh rate to 5s hoặc 10s
2. **Time range**: Nhấn clock icon → Chọn "Last 1 hour", "Last 24 hours", etc.
3. **Variable**: Tạo variable để filter (company, endpoint, etc.)
4. **Alert Rules**: Setup alerts cho critical metrics
5. **Annotations**: Thêm event markers (deployments, incidents)
6. **Share**: Export dashboard như JSON để backup hoặc share

---

## Troubleshoot:

- **Không có data?** → Kiểm tra:
  - Prometheus scraping metrics: http://localhost:9090
  - Data source connection: Grafana → Settings → Data sources
  - PromQL query syntax

- **Query error?** → Vào Prometheus explore → test query trước

- **Performance chậm?** → Reduce time range, increase scrape interval

---

## Next Steps:
- ✓ Tạo 4 dashboards chính (Main, Security, Business, Infrastructure)
- ✓ Setup alerts cho critical metrics
- ✓ Generate sample data bằng real traffic
- ✓ Monitor 24/7 production metrics

**Good luck! 🚀**
