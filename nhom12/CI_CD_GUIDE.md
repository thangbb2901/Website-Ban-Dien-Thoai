# Hướng dẫn quy trình CI/CD với GitHub Actions

Tài liệu này mô tả chi tiết về quy trình Tự động hóa Tích hợp liên tục (Continuous Integration - CI) và Triển khai liên tục (Continuous Deployment - CD) được xây dựng cho hệ thống Website Bán Điện Thoại ứng dụng kiến trúc đa tầng (N-tier) trên Docker. Đi kèm với đó là hướng dẫn cấu hình chi tiết để có thể vận hành trơn tru.

## 1. Tổng quan Kiến trúc Pipeline
Quy trình CI/CD của dự án này sử dụng **GitHub Actions**, một công cụ mạnh mẽ được tích hợp trực tiếp trên GitHub, giúp tự động hóa khâu quản lý chất lượng mã nguồn (Quality Checks), đóng gói ứng dụng (Build), và triển khai lên máy chủ (Deploy) một cách nhanh chóng và an toàn.

Hệ thống CI/CD được chia thành 2 luồng công việc (Workflows) chính, được định nghĩa thông qua các file YAML trong thư mục `.github/workflows/`:
1. **CI Pipeline (`ci.yml`)**: Tự động kích hoạt khi có Pull Request hoặc Push code lên nhánh `main` và `develop`. Nhiệm vụ chính là kiểm tra lỗi mã nguồn (Linting/Syntax) và cấu hình để kiểm tra trước việc đóng gói (Build Docker Image).
2. **CD Pipeline (`cd.yml`)**: Tự động kích hoạt khi có Push code được hợp nhất thành công lên nhánh `main` hoặc chạy thủ công. Nhiệm vụ là tự động truy cập vào Server qua SSH, cập nhật source và triển khai lại toàn bộ cụm Container (Docker Compose).

---

## 2. Chi tiết CI Pipeline (Continuous Integration)

- **File cấu hình:** `.github/workflows/ci.yml`
- **Sự kiện kích hoạt (Trigger):** `push` hoặc `pull_request` vào `main`, `develop`.

### Các giai đoạn (Jobs):
1. **Python Quality Checks (`quality`):**
   - Checkout mã nguồn về máy trạm CI (Runner).
   - Thiết lập môi trường Python 3.11.
   - Cài đặt Dependencies từ file `requirements.txt`.
   - Chạy lệnh kiểm tra lỗi cú pháp mã nguồn (Syntax check) trên các tệp quan trọng (`app.py`, `model.py`, `check_db.py`). **Ngăn chặn lỗi code sơ đẳng được merge vào project.**

2. **Build Docker Image (`docker-build`):**
   - Chỉ chạy khi Test/Check Syntax thành công (Requires `quality` job).
   - Thiết lập Docker Buildx (công cụ build mạnh mẽ của Docker).
   - Tiến hành build thử nghiệm cấu trúc file `Dockerfile` của Flask App (không publish lên Docker Hub) để đảm bảo rằng Image có thể đóng gói thành công ở môi trường Production.

---

## 3. Chi tiết CD Pipeline (Continuous Deployment)

- **File cấu hình:** `.github/workflows/cd.yml`
- **Sự kiện kích hoạt (Trigger):** `push` vào nhánh `main` hoặc kích hoạt bằng tay (`workflow_dispatch`).

### Giai đoạn triển khai (Deploy):
- **Cơ chế hoạt động:** Sử dụng `appleboy/ssh-action` để SSH an toàn trực tiếp vào máy chủ Production.
- **Thực thi các lệnh (Script):**
  1. Di chuyển vào thư mục code ứng dụng (`cd ${{ secrets.DEPLOY_PATH }}`).
  2. Kéo mã nguồn mới nhất từ GitHub (`git pull --ff-only`).
  3. Tắt hệ thống Containers hiện tại (`docker compose down`).
  4. Build lại các Images và khởi động cấu trúc hạ tầng ngầm `docker compose up -d --build` với Zero/Low Downtime.
  5. Xóa bỏ hình ảnh cũ / dọn dẹp bộ nhớ máy chủ (`docker image prune -f`).

---

## 4. Hướng dẫn cấu hình CD Pipeline (Bắt buộc)

Để quá trình tự động Deploy **CD Pipeline** phía trên thành công, cấu hình liên kết đến máy chủ bằng GitHub Secrets là bắt buộc. Hệ thống cần các thông tin nhạy cảm để truy cập và chạy lệnh nội bộ nên KHÔNG ĐƯỢC để nội dung ngoài code.

**Các bước cấu hình GitHub Secrets:**

1. Truy cập vào **Repository** trên trình duyệt GitHub.
2. Điều hướng tới: **Settings** -> **Secrets and variables** -> **Actions**.
3. Chọn **New repository secret** và lần lượt cấu hình các biến sau:

| Tên biến (Secret Name) | Ý nghĩa mô tả | Ví dụ tham khảo |
| --- | --- | --- |
| `SSH_HOST` | Địa chỉ IP Public máy chủ Production Server của bạn. | `123.45.67.89` |
| `SSH_PORT` | Cổng SSH được cho phép mở trên máy chủ. Mặc định là `22`. | `22` |
| `SSH_USER` | Tên người dùng để kết nối SSH (thường là người dùng có quyền docker). | `root` hoặc `ubuntu` |
| `SSH_PRIVATE_KEY` | Mã RSA/ED25519 Private Key sinh ra từ máy trạm cho truy cập SSH. | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | Đường dẫn thư mục tuyệt đối chứa dự án gốc trên Server. | `/var/www/Website-Ban-Dien-Thoai/nhom12` |

> **Lưu ý:** Machine ảo (VPS/Server) bắt buộc phải cài đặt sẵn Git, Docker tĩnh và Docker Compose trước khi chạy CD.

## 5. Kết luận cho Đồ án (Luận văn)
Với cấu trúc CI/CD này, nhóm 12 đã hiện thực hoá một quy trình **DevOps hiện đại**, đáp ứng đúng mục tiêu đồ án. Việc tích hợp hai quy trình CI (Kiểm soát chất lượng liên tục) và CD (Triển khai liên tục) giải quyết triệt để vấn đề bằng cách:
- Tối thiểu hoá rủi ro do lỗi cú pháp code và môi trường không đồng nhất.
- Giảm thiểu hoàn toàn thời gian thao tác thủ công, tiết kiệm thời gian Release.
- Tự động hóa quá trình đóng gói và triển khai ứng dụng đa tầng một cách an toàn và bảo mật.
