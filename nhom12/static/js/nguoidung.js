// doannhom12/js/nguoidung.js

// Hàm chính được gọi khi trang tải xong
async function khoiTaoTrangNguoiDung() {
    try {
        await khoiTao(); // Đợi hàm khoiTao() từ dungchung.js hoàn thành
    } catch (error) {
        console.error("Lỗi khi khởi tạo dữ liệu chung:", error);
        if (typeof addAlertBox === "function") {
            addAlertBox('Không thể tải dữ liệu nền. Một số chức năng có thể không hoạt động.', '#aa0000', '#fff', 10000);
        }
    }
      // ===== THÊM ĐOẠN MÃ NÀY VÀO ĐÂY =====
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    if (typeof addTags === "function") {
        // Dùng URL gốc "/" để khi bấm vào tag sẽ tìm kiếm trên toàn bộ sản phẩm
        for (var t of tags) addTags(t, "/?search=" + t);
    }
    let user = getCurrentUser();
    if (!user) {
        if (typeof addAlertBox === "function") {
            addAlertBox('Bạn cần đăng nhập để truy cập trang này!', '#ff0000', '#fff', 5000);
        }
        const userContentDiv = document.getElementById('user-content');
        if (userContentDiv) {
            userContentDiv.innerHTML = `
                <div style="text-align:center; padding:30px;">
                    <h2>Vui lòng đăng nhập</h2>
                    <p>Bạn cần đăng nhập để xem thông tin tài khoản và lịch sử đơn hàng.</p>
                    <button class="button" style="margin-top:15px;" onclick="showTaiKhoan(true)">Đăng nhập / Đăng ký</button>
                </div>`;
        }
        const userNav = document.querySelector('.user-nav');
        if (userNav) userNav.style.display = 'none';
        return;
    }

    // LẤY LẠI THÔNG TIN USER MỚI NHẤT TỪ SERVER
    try {
        const response = await fetch(`/api/users/${user.username}`);
        if (response.ok) {
            user = await response.json();
            setCurrentUser(user); // Cập nhật lại localStorage
            if (typeof capNhat_ThongTin_CurrentUser === "function") capNhat_ThongTin_CurrentUser();
        }
    } catch (e) {
        // Nếu lỗi thì vẫn dùng localStorage
        console.warn("Không thể lấy thông tin mới nhất từ server, dùng localStorage.");
    }

    hienThiThongTinNguoiDung(user);
    setupEventNguoiDung();

    // Kích hoạt tab "Thông tin tài khoản" mặc định
    const defaultTabLink = document.querySelector('.user-nav a[href="#info"]');
    if (defaultTabLink) {
        defaultTabLink.click();
    } else {
        const infoSection = document.getElementById('info');
        if (infoSection) infoSection.classList.add('active');
    }
}

window.onload = khoiTaoTrangNguoiDung;

// Trong file: doannhom12/js/nguoidung.js

function hienThiThongTinNguoiDung(user) {
    const infoDiv = document.getElementById('info');
    if (!infoDiv || !user) return;

    const trangThai = user.off
        ? `<span style="color:#dc2626;"><i class="fa fa-lock"></i> Bị khóa</span>`
        : `<span style="color:#059669;"><i class="fa fa-check-circle"></i> Hoạt động</span>`;

    infoDiv.innerHTML = `
        <h2><i class="fa fa-id-card-o"></i> Thông tin tài khoản</h2>
        <div class="user-info-card">
            <div class="info-row">
                <div class="info-label"><i class="fa fa-user"></i> Tên đăng nhập</div>
                <div class="info-value">${user.username || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fa fa-font"></i> Họ và tên</div>
                <div class="info-value">${(user.ho || '') + ' ' + (user.ten || '') || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fa fa-envelope"></i> Gmail</div>
                <div class="info-value">${user.email || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fa fa-map-marker"></i> Địa chỉ</div>
                <div class="info-value">${user.address || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fa fa-shield"></i> Trạng thái</div>
                <div class="info-value">${trangThai}</div>
            </div>
        </div>
        <div class="user-action">
            <button class="button edit-info-btn" onclick="chinhSuaThongTin()">
                <i class="fa fa-pencil"></i> Chỉnh sửa thông tin
            </button>
            <button class="button edit-info-btn" onclick="openChangePasswordModal()">
                <i class="fa fa-lock"></i> Đổi mật khẩu
            </button>
        </div>
    `;
}
// Trong file: doannhom12/js/nguoidung.js

function triggerForgotPasswordModalFromUserInfo() {
    // 1. Lấy đối tượng div chứa toàn bộ modal tài khoản
    var containTaikhoanDiv = document.querySelector('.containTaikhoan');
    if (!containTaikhoanDiv) {
        console.error("Không tìm thấy container modal tài khoản (.containTaikhoan).");
        return;
    }

    // 2. Hiển thị modal tài khoản (lớp phủ)
    containTaikhoanDiv.style.transform = 'scale(1)';
    containTaikhoanDiv.classList.add('active'); // Đảm bảo modal được active nếu CSS dùng class này

    // 3. Gọi hàm showForgotPasswordForm (từ dungchung.js) để hiển thị form đặt lại mật khẩu
    if (typeof showForgotPasswordForm === 'function') {
        showForgotPasswordForm(); // Hàm này sẽ vẽ lại nội dung của div.taikhoan

        // 4. Sau khi form được vẽ, tìm và ẩn div chứa link "Quay lại đăng nhập"
        // Cần đảm bảo DOM đã cập nhật, có thể dùng một timeout nhỏ nếu cần, nhưng thường là không.
        var taikhoanModalContent = containTaikhoanDiv.querySelector('.taikhoan');
        if (taikhoanModalContent) {
            var backToLoginDiv = taikhoanModalContent.querySelector('.back-to-login');
            if (backToLoginDiv) {
                backToLoginDiv.style.display = 'none'; // Ẩn đi phần "Quay lại đăng nhập"
            }
        }

    } else {
        console.error("Hàm showForgotPasswordForm không được định nghĩa. Đảm bảo dungchung.js đã được tải.");
        // Fallback: Nếu hàm cụ thể không có, thử mở modal tài khoản chung
        if (typeof showTaiKhoan === 'function') {
            showTaiKhoan(true); // Mở modal đăng nhập/đăng ký mặc định
        }
    }
}
async function hienThiLichSuDonHang(user) {
    const orderDiv = document.getElementById('orders');
    let orderListTbody = document.getElementById('order-list');

    if (!orderDiv) {
        console.error("Không tìm thấy phần tử #orders");
        return;
    }

    // Tạo bảng nếu chưa có
    if (!orderListTbody) {
        orderDiv.innerHTML = `
            <h2><i class="fa fa-history"></i> Lịch sử đơn hàng</h2>
            <div style="overflow-x:auto;">
            <table>
                <thead>
                    <tr>
                        <th><i class="fa fa-hashtag"></i> Mã đơn</th>
                        <th><i class="fa fa-calendar"></i> Ngày mua</th>
                        <th><i class="fa fa-cube"></i> Sản phẩm</th>
                        <th><i class="fa fa-money"></i> Tổng tiền</th>
                        <th><i class="fa fa-info-circle"></i> Trạng thái</th>
                    </tr>
                </thead>
                <tbody id="order-list"></tbody>
            </table>
            </div>
        `;
        orderListTbody = document.getElementById('order-list');
    }

    if (!orderListTbody || !user) {
        console.error("Không thể hiển thị lịch sử đơn hàng: thiếu phần tử DOM hoặc user.");
        return;
    }

    try {
        // Gọi API để lấy danh sách đơn hàng
        const response = await fetch(`/api/orders?username=${user.username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Lỗi khi lấy danh sách đơn hàng: ${response.status}`);
        }

        const orders = await response.json();
        console.log("Orders from API:", orders);

        if (!orders || orders.length === 0) {
            orderListTbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding: 48px 20px;">
                        <div style="color:#94a3b8; font-size:1.1rem;">
                            <i class="fa fa-inbox" style="font-size:2.5rem; display:block; margin-bottom:12px;"></i>
                            Bạn chưa có đơn hàng nào!
                        </div>
                    </td>
                </tr>`;
            return;
        }

        if (!window.list_products || window.list_products.length === 0) {
            console.warn("window.list_products rỗng hoặc chưa được định nghĩa.");
            orderListTbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <h3 style="color:red; text-align:center; padding: 15px 0;">
                            Lỗi: Không thể tải thông tin chi tiết sản phẩm.
                        </h3>
                    </td>
                </tr>`;
            return;
        }

        let allOrdersHTML = "";
        // Sắp xếp đơn hàng theo ngày giảm dần
        const sortedOrders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        sortedOrders.forEach((order, index) => {
            if (!order || !order.products || !Array.isArray(order.products)) {
                console.warn("Đơn hàng không hợp lệ hoặc không có sản phẩm:", order);
                return;
            }

            const ngaymua = order.order_date ? new Date(order.order_date).toLocaleString('vi-VN') : 'Không rõ';
            const tinhTrang = order.status || 'Không rõ';
            const sanphamListTrongDon = order.products;

            let currentOrderTotalPrice = 0;
            let sanphamHtml = '';

            for (const itemTrongDon of sanphamListTrongDon) {
                if (!itemTrongDon || !itemTrongDon.product_masp) {
                    console.warn("Mục đơn hàng không hợp lệ:", itemTrongDon);
                    continue;
                }

                const productDetails = timKiemTheoMa(window.list_products, itemTrongDon.product_masp);
                if (productDetails) {
                    const priceString = itemTrongDon.price_at_purchase || productDetails.price;
                    console.log(`Price string for ${itemTrongDon.product_masp}:`, priceString);
                    const itemPrice = stringToNum(priceString);
                    console.log(`Converted price for ${itemTrongDon.product_masp}:`, itemPrice);
                    const soluong = Number(itemTrongDon.quantity) || 0;
                    const thanhTien = itemPrice * soluong;
                    currentOrderTotalPrice += thanhTien;
                    sanphamHtml += `<div>- ${productDetails.name || itemTrongDon.product_name || 'Sản phẩm không rõ tên'} (x${soluong})</div>`;
                } else {
                    sanphamHtml += `<div style="color:grey;">- Sản phẩm mã '${itemTrongDon.product_masp}' (x${itemTrongDon.quantity || 'N/A'}) - <i>Thông tin sản phẩm không có sẵn</i></div>`;
                    console.warn(`Không tìm thấy sản phẩm với mã ${itemTrongDon.product_masp}.`);
                }
            }

            const maDonHangDisplay = 'DH' + (order.order_id || (index + 1)).toString().padStart(4, '0');
            allOrdersHTML += `
                <tr>
                    <td>${maDonHangDisplay}</td>
                    <td>${ngaymua}</td>
                    <td style="text-align:left;">${sanphamHtml || 'Không có sản phẩm'}</td>
                    <td class="alignRight">${numToString(currentOrderTotalPrice)} ₫</td>
                    <td class="order-status ${tinhTrang.toLowerCase().replace(/\s+/g, '-')}">${tinhTrang}</td>
                </tr>
            `;
        });

        orderListTbody.innerHTML = allOrdersHTML;
    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
        orderListTbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <h3 style="color:red; text-align:center; padding: 15px 0;">
                        Lỗi: Không thể tải lịch sử đơn hàng.
                    </h3>
                </td>
            </tr>`;
        if (typeof addAlertBox === "function") {
            addAlertBox('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.', '#ff0000', '#fff', 5000);
        }
    }
}
function chinhSuaThongTin() {
    const user = getCurrentUser();
    const modal = document.getElementById('editInfoModal');
    if (!user || !modal) {
        console.error("Không thể chỉnh sửa thông tin: thiếu user hoặc modal.");
        if (typeof addAlertBox === "function") {
            addAlertBox('Lỗi hệ thống. Vui lòng thử lại sau.', '#ff0000', '#fff', 5000);
        }
        return;
    }

    const hoInput = document.getElementById('ho');
    const tenInput = document.getElementById('ten');
    const emailInput = document.getElementById('email');

    if (!hoInput || !tenInput || !emailInput) {
        console.error("Không tìm thấy các trường input trong modal.");
        if (typeof addAlertBox === "function") {
            addAlertBox('Lỗi giao diện. Vui lòng liên hệ hỗ trợ.', '#ff0000', '#fff', 5000);
        }
        return;
    }

    hoInput.value = user.ho || '';
    tenInput.value = user.ten || '';
    emailInput.value = user.email || '';

    // Khởi tạo bộ chọn địa chỉ và điền dữ liệu nếu có
    if (typeof loadProvinces === 'function') {
        loadProvinces('user-').then(() => {
            if (user.address) {
                const parts = user.address.split(', ').map(p => p.trim());
                if (parts.length >= 4) {
                    const street = parts[0];
                    const wardName = parts[1];
                    const districtName = parts[2];
                    const provinceName = parts[3];

                    document.getElementById('user-street').value = street;

                    // Tìm và chọn Tỉnh/Thành
                    const provinceSelect = document.getElementById('user-province');
                    for (let i = 0; i < provinceSelect.options.length; i++) {
                        if (provinceSelect.options[i].text === provinceName) {
                            provinceSelect.selectedIndex = i;
                            loadDistricts(provinceSelect.value, 'user-').then(() => {
                                // Tìm và chọn Quận/Huyện
                                const districtSelect = document.getElementById('user-district');
                                for (let j = 0; j < districtSelect.options.length; j++) {
                                    if (districtSelect.options[j].text === districtName) {
                                        districtSelect.selectedIndex = j;
                                        loadWards(districtSelect.value, 'user-').then(() => {
                                            // Tìm và chọn Phường/Xã
                                            const wardSelect = document.getElementById('user-ward');
                                            for (let k = 0; k < wardSelect.options.length; k++) {
                                                if (wardSelect.options[k].text === wardName) {
                                                    wardSelect.selectedIndex = k;
                                                    break;
                                                }
                                            }
                                        });
                                        break;
                                    }
                                }
                            });
                            break;
                        }
                    }
                }
            }
        });
    }

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeEditInfoModal() {
    const modal = document.getElementById('editInfoModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        const form = document.getElementById('editInfoForm');
        if (form) form.reset();
    }, 300); // Đợi animation hoàn tất
}

async function saveUserInfo(event) {
    event.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        addAlertBox('Bạn chưa đăng nhập!', '#ff0000', '#fff', 3000);
        return;
    }

    const hoInput = document.getElementById('ho');
    const tenInput = document.getElementById('ten');
    const emailInput = document.getElementById('email');

    // Validate dữ liệu nếu cần...

    // Thu thập địa chỉ
    let fullAddress = "";
    const p = document.getElementById('user-province');
    const d = document.getElementById('user-district');
    const w = document.getElementById('user-ward');
    const s = document.getElementById('user-street');
    
    if (p && p.value && d && d.value && w && w.value && s && s.value.trim()) {
        fullAddress = `${s.value.trim()}, ${w.options[w.selectedIndex].text}, ${d.options[d.selectedIndex].text}, ${p.options[p.selectedIndex].text}`;
    }

    const dataToUpdate = {
        ho: hoInput.value.trim(),
        ten: tenInput.value.trim(),
        email: emailInput.value.trim(),
        address: fullAddress
    };

    try {
        const response = await fetch(`/api/users/${user.username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToUpdate)
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || 'Cập nhật thất bại');
        }
        const updatedUser = responseData;

        setCurrentUser(updatedUser);
        hienThiThongTinNguoiDung(updatedUser);
        closeEditInfoModal();
        addAlertBox('Cập nhật thông tin thành công!', '#28a745', '#fff', 3000);
    } catch (error) {
        addAlertBox(error.message || 'Cập nhật thất bại!', '#ff0000', '#fff', 3000);
    }
}

function openChangePasswordModal() {
    const user = getCurrentUser();
    const modal = document.getElementById('changePasswordModal');
    const verifyEmailInput = document.getElementById('verifyEmail');
    if (!user || !modal || !verifyEmailInput) return;

    if (!user.email) {
        addAlertBox('Bạn cần cập nhật Gmail trước khi đổi mật khẩu.', '#ff0000', '#fff', 4000);
        return;
    }

    resetChangePasswordForm();
    verifyEmailInput.value = user.email || '';
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        resetChangePasswordForm();
    }, 300);
}

function resetChangePasswordForm() {
    const form = document.getElementById('changePasswordForm');
    const otpInput = document.getElementById('emailOtp');
    const newPasswordInput = document.getElementById('changeNewPassword');
    const confirmPasswordInput = document.getElementById('confirmChangeNewPassword');

    if (form) form.reset();
    [otpInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        if (input) {
            input.disabled = true;
            input.value = '';
        }
    });
}

async function sendPasswordChangeOtp() {
    const user = getCurrentUser();
    const verifyEmailInput = document.getElementById('verifyEmail');
    const otpInput = document.getElementById('emailOtp');
    const newPasswordInput = document.getElementById('changeNewPassword');
    const confirmPasswordInput = document.getElementById('confirmChangeNewPassword');

    if (!user || !verifyEmailInput) return;

    const enteredEmail = verifyEmailInput.value.trim().toLowerCase();
    const currentEmail = (user.email || '').trim().toLowerCase();

    if (!currentEmail) {
        addAlertBox('Tài khoản này chưa có Gmail để xác thực.', '#ff0000', '#fff', 4000);
        return;
    }

    if (!enteredEmail) {
        addAlertBox('Bạn phải nhập Gmail hiện tại để nhận mã xác thực.', '#ff0000', '#fff', 4000);
        return;
    }

    if (enteredEmail !== currentEmail) {
        addAlertBox('Gmail nhập vào không khớp với Gmail hiện tại của tài khoản.', '#ff0000', '#fff', 4000);
        return;
    }

    try {
        const response = await fetch(`/api/users/${user.username}/password-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: enteredEmail })
        });
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'Không gửi được mã xác thực.');
        }

        [otpInput, newPasswordInput, confirmPasswordInput].forEach(input => {
            if (input) input.disabled = false;
        });

        if (otpInput) otpInput.focus();
        addAlertBox('Mã xác thực đã được gửi về Gmail của bạn.', '#28a745', '#fff', 4000);
    } catch (error) {
        addAlertBox(error.message || 'Không gửi được mã xác thực.', '#ff0000', '#fff', 4000);
    }
}

async function submitPasswordChange(event) {
    event.preventDefault();

    const user = getCurrentUser();
    const verifyEmailInput = document.getElementById('verifyEmail');
    const otpInput = document.getElementById('emailOtp');
    const newPasswordInput = document.getElementById('changeNewPassword');
    const confirmPasswordInput = document.getElementById('confirmChangeNewPassword');

    if (!user || !verifyEmailInput || !otpInput || !newPasswordInput || !confirmPasswordInput) return;

    const enteredEmail = verifyEmailInput.value.trim().toLowerCase();
    const enteredOtp = otpInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (newPassword.length < 6) {
        addAlertBox('Mật khẩu mới phải có ít nhất 6 ký tự.', '#ff0000', '#fff', 4000);
        return;
    }

    if (newPassword !== confirmPassword) {
        addAlertBox('Xác nhận mật khẩu không khớp.', '#ff0000', '#fff', 4000);
        return;
    }

    try {
        const response = await fetch(`/api/users/${user.username}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: enteredEmail,
                otp: enteredOtp,
                pass: newPassword
            })
        });
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || 'Đổi mật khẩu thất bại.');
        }

        closeChangePasswordModal();
        addAlertBox('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', '#28a745', '#fff', 4000);
        setTimeout(() => {
            logOut();
        }, 1200);
    } catch (error) {
        addAlertBox(error.message || 'Đổi mật khẩu thất bại.', '#ff0000', '#fff', 4000);
    }
}

function setupEventNguoiDung() {
    const navLinks = document.querySelectorAll('.user-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const sectionId = this.getAttribute('href').substring(1);
            document.querySelectorAll('#user-content > div').forEach(section => {
                section.classList.remove('active');
            });

            const activeSection = document.getElementById(sectionId);
            if (!activeSection) return;

            activeSection.classList.add('active');
            const user = getCurrentUser();
            if (!user) return;

            if (sectionId === 'orders') {
                if (window.list_products && window.list_products.length > 0) {
                    hienThiLichSuDonHang(user);
                } else {
                    const orderListTbody = document.getElementById('order-list') || activeSection.querySelector('table > tbody');
                    if (orderListTbody) {
                        orderListTbody.innerHTML = `
                            <tr><td colspan="5" style="text-align:center; color:grey;">
                                Đang tải dữ liệu sản phẩm... Vui lòng chờ hoặc thử lại.
                            </td></tr>`;
                    }
                    console.warn("Chưa thể hiển thị lịch sử đơn hàng do list_products chưa sẵn sàng.");
                }
            } else if (sectionId === 'info') {
                hienThiThongTinNguoiDung(user);
            }
        });
    });
}
