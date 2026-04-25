// doannhom12/js/chitietsanpham.js

var nameProduct, maProduct, sanPhamHienTai; // Biến toàn cục
const HOME_RECENTLY_VIEWED_KEY = 'homeRecentlyViewedProducts';
let quickCheckoutProduct = null;

function getCheckoutUnitPrice(product) {
    if (!product) return 0;
    const promoNameLower = (product.promo && product.promo.name) ? product.promo.name.toLowerCase() : '';
    const basePrice = stringToNum(product.price);
    if (promoNameLower === 'giareonline' && product.promo && product.promo.value) {
        return stringToNum(product.promo.value);
    }
    return basePrice;
}

function updateQuickCheckoutSummary() {
    const nameEl = document.getElementById('quickOrderProductName');
    const quantityEl = document.getElementById('quickOrderQuantity');
    const totalEl = document.getElementById('quickOrderTotal');
    const quantityInput = document.getElementById('quickQuantity');

    if (!quickCheckoutProduct || !nameEl || !quantityEl || !totalEl) return;

    const quantity = Math.max(1, Number(quantityInput ? quantityInput.value : 1) || 1);
    const unitPrice = getCheckoutUnitPrice(quickCheckoutProduct);
    const total = unitPrice * quantity;

    nameEl.textContent = quickCheckoutProduct.name || '--';
    quantityEl.textContent = quantity;
    totalEl.textContent = `${numToString(total)} ₫`;
}

function hienThiChiTietThanhToanQuick() {
    const qrPaymentDiv = document.getElementById('quickQrPaymentDetails');
    const visaPaymentDiv = document.getElementById('quickVisaPaymentDetails');
    const selectedMethodElement = document.querySelector('#quickCheckoutForm input[name="paymentMethod"]:checked');

    if (!selectedMethodElement) return;
    const selectedMethod = selectedMethodElement.value;

    if (qrPaymentDiv) qrPaymentDiv.style.display = (selectedMethod === 'transfer') ? 'block' : 'none';
    if (visaPaymentDiv) {
        visaPaymentDiv.style.display = (selectedMethod === 'card') ? 'block' : 'none';
        const visaInputs = visaPaymentDiv.querySelectorAll('input');
        visaInputs.forEach(input => input.required = (selectedMethod === 'card'));
    }
}

async function openQuickCheckout() {
    const user = getCurrentUser();
    if (!user) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng đăng nhập để thanh toán!', '#ff0000', '#fff', 5000);
        if (typeof showTaiKhoan === "function") showTaiKhoan(true);
        return;
    }
    if (user.off) {
        if (typeof addAlertBox === "function") addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }
    if (!sanPhamHienTai) {
        if (typeof addAlertBox === "function") addAlertBox('Không tìm thấy thông tin sản phẩm.', '#ff0000', '#fff', 4000);
        return;
    }

    const stock = Number(sanPhamHienTai.quantity) || 0;
    if (stock <= 0) {
        if (typeof addAlertBox === "function") addAlertBox('Sản phẩm này đã hết hàng.', '#ff0000', '#fff', 4000);
        return;
    }

    quickCheckoutProduct = sanPhamHienTai;
    const modal = document.getElementById('quickCheckoutForm');
    if (!modal) return;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const fullNameInput = modal.querySelector('input[name="fullName"]');
    const emailInput = modal.querySelector('input[name="email"]');
    const streetInput = modal.querySelector('input[name="street"]');
    const phoneInput = modal.querySelector('input[name="phone"]');
    const quantityInput = modal.querySelector('input[name="quantity"]');

    if (fullNameInput && user.ho && user.ten) fullNameInput.value = `${user.ho} ${user.ten}`;
    if (emailInput && user.email) emailInput.value = user.email;
    if (streetInput && user.address) {
        const parts = user.address.split(', ').map(p => p.trim());
        if (parts.length >= 1) streetInput.value = parts[0];
    }
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (quantityInput) {
        quantityInput.max = String(stock);
        quantityInput.value = 1;
    }

    await loadProvinces('quick');
    if (user.address) {
        const parts = user.address.split(', ').map(p => p.trim());
        if (parts.length >= 4) {
            const street = parts[0];
            const wardName = parts[1];
            const districtName = parts[2];
            const provinceName = parts[3];

            if (streetInput) streetInput.value = street;

            const provinceSelect = document.getElementById('quickProvince');
            for (let i = 0; i < provinceSelect.options.length; i++) {
                if (provinceSelect.options[i].text === provinceName) {
                    provinceSelect.selectedIndex = i;
                    await loadDistricts(provinceSelect.value, 'quick');
                    const districtSelect = document.getElementById('quickDistrict');
                    for (let j = 0; j < districtSelect.options.length; j++) {
                        if (districtSelect.options[j].text === districtName) {
                            districtSelect.selectedIndex = j;
                            await loadWards(districtSelect.value, 'quick');
                            const wardSelect = document.getElementById('quickWard');
                            for (let k = 0; k < wardSelect.options.length; k++) {
                                if (wardSelect.options[k].text === wardName) {
                                    wardSelect.selectedIndex = k;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }

    hienThiChiTietThanhToanQuick();
    updateQuickCheckoutSummary();
}

function closeQuickCheckout() {
    const modal = document.getElementById('quickCheckoutForm');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function submitQuickCheckout(form) {
    if (!form || !quickCheckoutProduct) return false;

    const user = getCurrentUser();
    if (!user) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng đăng nhập để thanh toán!', '#ff0000', '#fff', 5000);
        if (typeof showTaiKhoan === "function") showTaiKhoan(true);
        return false;
    }
    if (user.off) {
        if (typeof addAlertBox === "function") addAlertBox('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!', '#aa0000', '#fff', 10000);
        return false;
    }

    const quantityInput = form.elements.quantity;
    const quantity = Math.max(1, Number(quantityInput ? quantityInput.value : 1) || 1);
    const stock = Number(quickCheckoutProduct.quantity) || 0;
    if (quantity > stock) {
        if (typeof addAlertBox === "function") addAlertBox(`Chỉ còn ${stock} máy trong kho.`, '#ff0000', '#fff', 4000);
        return false;
    }

    const tenNguoiNhan = form.elements.fullName.value.trim();
    const sdtNguoiNhan = form.elements.phone.value.trim();
    const emailNguoiNhan = form.elements.email.value.trim();
    const selectedMethodElement = form.querySelector('input[name="paymentMethod"]:checked');
    const phuongThucTT = selectedMethodElement ? selectedMethodElement.value : 'cash';

    const streetInput = form.elements.street.value.trim();
    const provinceSelect = document.getElementById('quickProvince');
    const districtSelect = document.getElementById('quickDistrict');
    const wardSelect = document.getElementById('quickWard');

    const provinceText = provinceSelect.options[provinceSelect.selectedIndex].text;
    const districtText = districtSelect.options[districtSelect.selectedIndex].text;
    const wardText = wardSelect.options[wardSelect.selectedIndex].text;

    if (!tenNguoiNhan || !sdtNguoiNhan || !emailNguoiNhan || !provinceSelect.value || !districtSelect.value || !wardSelect.value || !streetInput) {
        if (typeof addAlertBox === "function") addAlertBox('Vui lòng điền đầy đủ và chọn đủ thông tin địa chỉ.', '#ff0000', '#fff', 4000);
        return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(sdtNguoiNhan)) {
        if (typeof addAlertBox === "function") addAlertBox('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số.', '#ff0000', '#fff', 4000);
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNguoiNhan)) {
        if (typeof addAlertBox === "function") addAlertBox('Email không hợp lệ. Vui lòng kiểm tra lại.', '#ff0000', '#fff', 4000);
        return false;
    }

    let paymentSpecificDetails = {};
    if (phuongThucTT === 'card') {
        const cardNumber = form.elements.cardNumber.value.trim();
        const expiryDate = form.elements.expiryDate.value.trim();
        const cvv = form.elements.cvv.value.trim();
        const cardHolderName = form.elements.cardHolderName.value.trim();
        if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
            if (typeof addAlertBox === "function") addAlertBox('Vui lòng nhập đầy đủ thông tin thẻ tín dụng.', '#ff0000', '#fff', 4000);
            return false;
        }
        paymentSpecificDetails = { type: 'card', cardHolder: cardHolderName };
    } else if (phuongThucTT === 'transfer') {
        paymentSpecificDetails = { type: 'transfer' };
    } else {
        paymentSpecificDetails = { type: 'cash_on_delivery' };
    }

    const diaChiNhan = `${streetInput}, ${wardText}, ${districtText}, ${provinceText}`;
    const unitPrice = getCheckoutUnitPrice(quickCheckoutProduct);
    const orderData = {
        username: user.username,
        products: [{
            product_masp: quickCheckoutProduct.masp,
            quantity: quantity,
            price_at_purchase: unitPrice
        }],
        shipping_info: {
            name: tenNguoiNhan,
            phone: sdtNguoiNhan,
            email: emailNguoiNhan,
            address: diaChiNhan,
            payment_method: phuongThucTT,
            payment_details: paymentSpecificDetails
        }
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || `Lỗi ${response.status} khi gửi đơn hàng`);
        }

        if (typeof addAlertBox === "function") addAlertBox('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.', '#17c671', '#fff', 4000);
        closeQuickCheckout();
        form.reset();
        quickCheckoutProduct = null;
        return false;
    } catch (error) {
        console.error('Lỗi khi thanh toán nhanh:', error);
        if (typeof addAlertBox === "function") addAlertBox('Lỗi khi thanh toán: ' + error.message, '#ff0000', '#fff', 5000);
        return false;
    }
}

window.onload = async function () { 
    try {
        await khoiTao(); // Đợi khoiTao() (từ dungchung.js) hoàn thành
    } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo trang chi tiết sản phẩm:", error);
        khongTimThaySanPham(); 
        if(typeof addAlertBox === "function") addAlertBox('Không thể tải dữ liệu cần thiết cho trang. Vui lòng thử lại!', '#aa0000', '#fff', 10000);
        return; 
    }

    // Thêm tags (từ khóa) vào khung tìm kiếm
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    if (typeof addTags === "function") {
        // SỬA ĐỔI ĐƯỜNG DẪN Ở ĐÂY:
        for (var t of tags) addTags(t, "/?search=" + t); 
    }


    if (window.list_products && window.list_products.length > 0) {
        phanTich_URL_chiTietSanPham(); 

        if (document.getElementById('search-box') && typeof autocomplete === "function") { 
            autocomplete(document.getElementById('search-box'), window.list_products);
        }

        if (sanPhamHienTai) { 
            suggestion(); 
        }
    } else {
        khongTimThaySanPham();
        console.error("Lỗi: Không thể tải danh sách sản phẩm cho trang chi tiết.");
    }
}

function khongTimThaySanPham() {
    const productNotFoundDiv = document.getElementById('productNotFound');
    const chiTietSanPhamDiv = document.querySelector('.chitietSanpham'); // Dùng querySelector

    if (productNotFoundDiv) productNotFoundDiv.style.display = 'block';
    if (chiTietSanPhamDiv) chiTietSanPhamDiv.style.display = 'none';
}

function saveRecentlyViewedProduct(masp) {
    if (!masp) return;
    try {
        const viewed = JSON.parse(localStorage.getItem(HOME_RECENTLY_VIEWED_KEY)) || [];
        const normalized = viewed.filter(id => id !== masp);
        normalized.unshift(masp);
        localStorage.setItem(HOME_RECENTLY_VIEWED_KEY, JSON.stringify(normalized.slice(0, 12)));
    } catch (error) {
        console.error('Không thể lưu sản phẩm đã xem:', error);
    }
}

function phanTich_URL_chiTietSanPham() {
    const urlParams = new URLSearchParams(window.location.search);
    let paramValue = urlParams.get('masp'); 
    let timTheo = 'masp';

    if (!paramValue) {
        paramValue = urlParams.get('name'); 
        timTheo = 'name';
        if (paramValue) {
            nameProduct = paramValue.split('-').join(' '); 
        }
    } else {
        maProduct = paramValue; 
    }

    if (!paramValue) { 
        const query = window.location.href.split('?')[1];
        if (query) {
            timTheo = 'name_fallback';
            nameProduct = query.split('-').join(' ');
            paramValue = nameProduct;
        } else {
            return khongTimThaySanPham(); 
        }
    }

    let foundProduct = null;
    if (window.list_products) {
        if (timTheo === 'masp' && maProduct) { // Thêm kiểm tra maProduct
            foundProduct = timKiemTheoMa(window.list_products, maProduct); 
            if (foundProduct) nameProduct = foundProduct.name; 
        } else if ((timTheo === 'name' || timTheo === 'name_fallback') && nameProduct) { // Thêm kiểm tra nameProduct
            for (var p of window.list_products) {
                if (p && p.name && p.name.toLowerCase() === nameProduct.toLowerCase()) { // Thêm kiểm tra p và p.name
                    foundProduct = p;
                    if (p.masp) maProduct = p.masp; 
                    break;
                }
            }
        }
    }
    sanPhamHienTai = foundProduct;

    if (!sanPhamHienTai) {
        return khongTimThaySanPham();
    }

    saveRecentlyViewedProduct(sanPhamHienTai.masp);

    var divChiTiet = document.querySelector('.chitietSanpham'); // Dùng querySelector
    if (!divChiTiet) {
        console.error("Không tìm thấy div 'chitietSanpham'");
        return;
    }
    divChiTiet.style.display = 'block';
    const productNotFoundDiv = document.getElementById('productNotFound');
    if (productNotFoundDiv) productNotFoundDiv.style.display = 'none';

    document.title = (sanPhamHienTai.name || 'Sản phẩm') + ' - Thế giới điện thoại';

    var h1 = divChiTiet.querySelector('h1'); // Dùng querySelector
    if (h1) {
        const baseH1Text = "Điện thoại ";
        h1.textContent = baseH1Text + (sanPhamHienTai.name || '');
    }

    var ratingDiv = divChiTiet.querySelector('.rating'); // Dùng querySelector
    var ratingHTML = "";
    if (sanPhamHienTai.rateCount && Number(sanPhamHienTai.rateCount) > 0) { // Kiểm tra và chuyển sang số
        let starCount = Number(sanPhamHienTai.star) || 0;
        for (var i = 1; i <= 5; i++) {
            if (i <= starCount) {
                ratingHTML += `<i class="fa fa-star"></i>`;
            } else {
                ratingHTML += `<i class="fa fa-star-o"></i>`;
            }
        }
        ratingHTML += `<span> ${sanPhamHienTai.rateCount} đánh giá</span>`;
    }
    if (ratingDiv) ratingDiv.innerHTML = ratingHTML;

    // Cập nhật trạng thái kho
    var stockCountElement = divChiTiet.querySelector('.detail-stock-count');
    if (stockCountElement) {
        stockCountElement.setAttribute('data-masp', sanPhamHienTai.masp);
        stockCountElement.textContent = (sanPhamHienTai.quantity > 0) ? `${sanPhamHienTai.quantity} máy` : 'Hết hàng';
        stockCountElement.style.color = (sanPhamHienTai.quantity > 0) ? '#ff8c00' : '#ff0000';
    }

    const buyNowButton = divChiTiet.querySelector('.buy_now');
    if (buyNowButton) {
        if (Number(sanPhamHienTai.quantity) > 0) {
            buyNowButton.classList.remove('disabled');
            buyNowButton.style.pointerEvents = 'auto';
            buyNowButton.innerHTML = `<b>MUA NGAY</b><p>Giao tận nơi hoặc nhận tại cửa hàng</p>`;
        } else {
            buyNowButton.classList.add('disabled');
            buyNowButton.style.pointerEvents = 'none';
            buyNowButton.innerHTML = `<b>HẾT HÀNG</b><p>Sản phẩm hiện không thể đặt mua</p>`;
        }
    }

    var priceDiv = divChiTiet.querySelector('.price_sale .area_price'); // Dùng querySelector
    if (priceDiv) {
        priceDiv.innerHTML = ''; 
        let promoNameLower = (sanPhamHienTai.promo && sanPhamHienTai.promo.name) ? sanPhamHienTai.promo.name.toLowerCase() : "";
        let currentPrice = sanPhamHienTai.price ? numToString(stringToNum(sanPhamHienTai.price)) : '0'; // Định dạng giá gốc

        if (promoNameLower === 'giareonline' && sanPhamHienTai.promo.value) {
            const shipDiv = divChiTiet.querySelector('.price_sale .ship'); // Dùng querySelector
            if (shipDiv) shipDiv.style.display = 'block'; 
            priceDiv.innerHTML = `<strong>${numToString(stringToNum(sanPhamHienTai.promo.value))}₫</strong>
                                <span style="text-decoration: line-through; color: grey; margin-left: 10px;">${currentPrice}₫</span>`;
        } else {
            priceDiv.innerHTML = `<strong>${currentPrice}₫</strong>`;
            if (sanPhamHienTai.promo && sanPhamHienTai.promo.name && typeof Promo === 'function') { 
                 priceDiv.innerHTML += new Promo(sanPhamHienTai.promo.name, sanPhamHienTai.promo.value).toWeb(); 
            }
            const shipDiv = divChiTiet.querySelector('.price_sale .ship');
            if (shipDiv) shipDiv.style.display = 'none'; 
        }
    }

    const detailPromoDiv = document.getElementById('detailPromo');
    if (detailPromoDiv) detailPromoDiv.innerHTML = getDetailPromo(sanPhamHienTai);

    var infoUl = divChiTiet.querySelector('.info_product .info'); // Dùng querySelector
    if (infoUl && sanPhamHienTai.detail) { 
        var thongSoHTML = addThongSo('Màn hình', sanPhamHienTai.detail.screen);
        thongSoHTML += addThongSo('Hệ điều hành', sanPhamHienTai.detail.os);
        thongSoHTML += addThongSo('Camera sau', sanPhamHienTai.detail.camara);
        thongSoHTML += addThongSo('Camera trước', sanPhamHienTai.detail.camaraFront);
        thongSoHTML += addThongSo('CPU', sanPhamHienTai.detail.cpu);
        thongSoHTML += addThongSo('RAM', sanPhamHienTai.detail.ram);
        thongSoHTML += addThongSo('Bộ nhớ trong', sanPhamHienTai.detail.rom);
        thongSoHTML += addThongSo('Thẻ nhớ', sanPhamHienTai.detail.microUSB || sanPhamHienTai.detail.memoryStick); // Thêm memoryStick làm fallback
        thongSoHTML += addThongSo('SIM', sanPhamHienTai.detail.sim);
        thongSoHTML += addThongSo('Dung lượng pin', sanPhamHienTai.detail.battery);
        infoUl.innerHTML = thongSoHTML;
    }

    var pictureDiv = divChiTiet.querySelector('.picture'); // Dùng querySelector
    if (pictureDiv) {
        var hinhChinh = pictureDiv.querySelector('img'); // Dùng querySelector
        if (hinhChinh) {
             // QUAN TRỌNG: sanPhamHienTai.img phải là đường dẫn đúng từ khoiTao()
             // Ví dụ: /static/img/products/ten_file.jpg
             // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH Ở ĐÂY:
             hinhChinh.src = normalizeImageUrl(sanPhamHienTai.img, 'product') || '/static/img/default.png'; 
             hinhChinh.alt = sanPhamHienTai.name || 'Hình sản phẩm';
        }
    }
    const bigImg = document.getElementById('bigimg');
    if (bigImg) {
        // SỬA ĐỔI ĐƯỜNG DẪN ẢNH MẶC ĐỊNH Ở ĐÂY:
        bigImg.src = normalizeImageUrl(sanPhamHienTai.img, 'product') || '/static/img/default.png';
        bigImg.alt = sanPhamHienTai.name || 'Hình sản phẩm';
    }

    const smallImgContainer = document.querySelector('.div_smallimg.owl-carousel');
    if (smallImgContainer) {
        smallImgContainer.innerHTML = ''; 
        
        // Thêm ảnh chính vào gallery trước
        if (sanPhamHienTai.img) addSmallImgToOwl(normalizeImageUrl(sanPhamHienTai.img, 'product'), $(smallImgContainer));

        // Kiểm tra và thêm các ảnh gallery khác nếu có (ví dụ: sanPhamHienTai.detail.imgSmall là một mảng)
        if (sanPhamHienTai.detail && Array.isArray(sanPhamHienTai.detail.imgSmall)) {
            sanPhamHienTai.detail.imgSmall.forEach(imgName => {
                // Giả sử imgName chỉ là tên file, cần thêm tiền tố
                addSmallImgToOwl(normalizeImageUrl(`/static/img/products/${imgName}`, 'product'), $(smallImgContainer));
            });
        } else {
            // Fallback nếu không có gallery cụ thể (nên lấy ảnh liên quan nếu có)
            // SỬA ĐỔI ĐƯỜNG DẪN ẢNH GALLERY FALLBACK Ở ĐÂY:
            // Cần thay thế bằng logic lấy ảnh liên quan hoặc bỏ đi nếu không có
            // Ví dụ tạm thời giữ lại các ảnh cũ đã sửa:
            addSmallImgToOwl(normalizeImageUrl("/static/img/products/samsung-galaxy-j4-plus-pink-400x400.jpg", 'product'), $(smallImgContainer));
            addSmallImgToOwl(normalizeImageUrl("/static/img/products/xiaomi-mi-8-lite-black-1-600x600.jpg", 'product'), $(smallImgContainer));
            addSmallImgToOwl(normalizeImageUrl("/static/img/products/oppo-f9-red-600x600.jpg", 'product'), $(smallImgContainer));
        }

        var owl = $(smallImgContainer);
        if (owl.data('owl.carousel')) { 
            owl.trigger('destroy.owl.carousel'); // Hủy carousel cũ
            // Không cần .removeClass('owl-loaded owl-hidden') vì destroy đã làm
            // Không cần owl.html('') vì đã clear ở trên và addSmallImgToOwl thêm lại
        }

        let itemCount = $(smallImgContainer).children().length;
        if (itemCount > 0) { // Chỉ khởi tạo nếu có items
             owl.owlCarousel({ 
                items: Math.min(5, itemCount), // Hiển thị tối đa 5 ảnh, hoặc ít hơn nếu có ít item
                loop: itemCount >= 5, // Loop nếu có từ 5 ảnh trở lên
                center: true,
                margin: 10,
                smartSpeed: 450,
                nav: true, 
                dots: false
            });
        }
    }
}

function addSmallImgToOwl(imgSrc, owlContainerjQuery) { // owlContainerjQuery là đối tượng jQuery
    // QUAN TRỌNG: imgSrc truyền vào đây phải là đường dẫn đúng
    // Ví dụ: /static/img/products/ten_file.jpg
    var newDiv = `<div class='item'>
                        <a>
                            <img src="${imgSrc}" onclick="changepic(this.src)">
                        </a>
                    </div>`;
    owlContainerjQuery.append(newDiv); 
}

function getDetailPromo(sp) {
    if (!sp || !sp.promo || !sp.promo.name) { 
        return "Hiện chưa có thông tin khuyến mãi đặc biệt cho sản phẩm này. Vui lòng xem các ưu đãi chung của cửa hàng.";
    }
    switch (sp.promo.name.toLowerCase()) { 
        case 'tragop':
            var span = `<span style="font-weight: bold"> lãi suất ${sp.promo.value || '0'}% </span>`;
            return `Khách hàng có thể mua trả góp sản phẩm với ${span} với thời hạn 6 tháng kể từ khi mua hàng.`;
        case 'giamgia':
            var span = `<span style="font-weight: bold">${numToString(stringToNum(sp.promo.value))}</span>`; // Định dạng số
            return `Khách hàng sẽ được giảm ${span}₫ khi tới mua trực tiếp tại cửa hàng.`;
        case 'moiramat':
            return `Sản phẩm mới ra mắt! Khách hàng sẽ được thử máy miễn phí tại cửa hàng. Có thể đổi trả lỗi trong vòng 2 tháng.`;
        case 'giareonline':
            var priceNum = stringToNum(sp.price);
            var promoValueNum = stringToNum(sp.promo.value);
            if (isNaN(priceNum) || isNaN(promoValueNum)) {
                return `Giá rẻ online đặc biệt! Vui lòng liên hệ để biết thêm chi tiết.`;
            }
            var del = priceNum - promoValueNum;
            var span = `<span style="font-weight: bold">${numToString(del)}</span>`;
            return `Sản phẩm sẽ được giảm ${span}₫ khi mua hàng online bằng thẻ VPBank hoặc tin nhắn SMS.`;
        default:
            return `Khuyến mãi: ${sp.promo.name} - ${sp.promo.value || ''}. Liên hệ để biết thêm chi tiết.`;
    }
}

function addThongSo(ten, giatri) {
    return `<li>
                <p>${ten}</p>
                <div>${giatri || 'Đang cập nhật'}</div>
            </li>`;
}

// Hàm addSmallImg không còn được dùng trực tiếp để thêm vào DOM, thay bằng addSmallImgToOwl
// function addSmallImg(img) { ... } 

function opencertain() {
    const overlay = document.getElementById("overlaycertainimg");
    if (overlay) {
        overlay.style.transform = "scale(1)";
        overlay.style.opacity = "1"; // Thêm để đảm bảo hiển thị
    }
}

function closecertain() {
    const overlay = document.getElementById("overlaycertainimg");
    if (overlay) {
        overlay.style.transform = "scale(0)";
        overlay.style.opacity = "0"; // Thêm để ẩn đi
    }
}

function changepic(src) {
    const bigImg = document.getElementById("bigimg");
    if (bigImg) bigImg.src = src;
}

// Hàm addKhungSanPham này dùng để hiển thị sản phẩm gợi ý
// QUAN TRỌNG: list_sanpham truyền vào đây phải có product.img là đường dẫn đúng
function addKhungSanPham(list_sanpham, tenKhung, color, ele) {
    if (!ele || !list_sanpham || list_sanpham.length === 0) {
        // console.warn("Không thể thêm khung sản phẩm gợi ý do thiếu element hoặc danh sách sản phẩm rỗng.");
        if(ele) ele.innerHTML = '<p style="text-align:center; color:grey; margin: 20px;">Không có gợi ý nào.</p>';
        return;
    }
    var gradient = `background-image: linear-gradient(120deg, ${color[0]} 0%, ${color[1]} 50%, ${color[0]} 100%);`;
    var borderColor = `border-color: ${color[0]}`;
    // var borderA = `border-left: 2px solid ${color[0]}; border-right: 2px solid ${color[0]};`; // Không cần nút "Xem tất cả"

    var s = `<div class="khungSanPham" style="${borderColor}">
                <h3 class="tenKhung" style="${gradient}">* ${tenKhung} *</h3>
                <div class="listSpTrongKhung flexContain">`;

    for (var i = 0; i < list_sanpham.length; i++) {
        // addProduct (từ dungchung.js) sẽ tạo HTML.
        // Đảm bảo list_sanpham[i].img đã được xử lý đường dẫn đúng bởi khoiTao()
        s += addProduct(list_sanpham[i], null, true); 
    }

    s += `  </div>
        </div>`; 
    ele.innerHTML += s;
}

function suggestion() {
    if (!sanPhamHienTai || !window.list_products || window.list_products.length === 0) {
        // console.log("Không đủ dữ liệu để tạo gợi ý (suggestion).");
        const divGoiYSanPham = document.getElementById('goiYSanPham');
        if (divGoiYSanPham) divGoiYSanPham.innerHTML = ''; // Xóa nội dung cũ nếu không có gợi ý
        return;
    }

    const giaSanPhamHienTai = stringToNum(sanPhamHienTai.price);
    const sanPhamTuongTu = window.list_products
        .filter((sp) => sp && sp.masp !== sanPhamHienTai.masp && sp.name && sp.price && sp.detail) // Thêm kiểm tra sp tồn tại
        .map(sanPham => {
            if (!sanPham) return null; // Bỏ qua nếu sản phẩm null/undefined
            const giaSanPham = stringToNum(sanPham.price);
            let giaTienGanGiong = Math.abs(giaSanPham - giaSanPhamHienTai) < 3000000; // Nới rộng khoảng giá hơn chút

            let soLuongChiTietGiongNhau = 0;
            if (sanPham.detail && sanPhamHienTai.detail) {
                for (let key in sanPham.detail) {
                    if (sanPham.detail.hasOwnProperty(key) && sanPhamHienTai.detail.hasOwnProperty(key)) {
                        if (sanPham.detail[key] == sanPhamHienTai.detail[key]) soLuongChiTietGiongNhau++;
                    }
                }
            }
            let giongThongSoKyThuat = soLuongChiTietGiongNhau >= 1; // Giảm yêu cầu xuống 1 chi tiết giống nhau
            let cungHangSanXuat = (sanPham.company && sanPhamHienTai.company) ? (sanPham.company === sanPhamHienTai.company) : false;
            let cungLoaiKhuyenMai = (sanPham.promo && sanPham.promo.name && sanPhamHienTai.promo && sanPhamHienTai.promo.name) ? (sanPham.promo.name === sanPhamHienTai.promo.name) : false;

            let soDanhGia = Number(sanPham.rateCount) || 0; // Chuyển sang số
            let soSao = Number(sanPham.star) || 0; // Chuyển sang số

            let diem = 0;
            if (giaTienGanGiong) diem += 15;
            if (giongThongSoKyThuat) diem += soLuongChiTietGiongNhau * 3;
            if (cungHangSanXuat) diem += 25; // Tăng điểm ưu tiên cùng hãng
            if (cungLoaiKhuyenMai) diem += 5;
            if (soDanhGia > 5) diem += Math.min(5, Math.floor(soDanhGia / 5)); // Điều chỉnh ngưỡng đánh giá
            diem += soSao * 2.5; // Điều chỉnh trọng số sao

            return { ...sanPham, diem: diem };
        })
        .filter(sp => sp !== null && sp.diem > 10) // Lọc bỏ sản phẩm null và có điểm thấp
        .sort((a, b) => b.diem - a.diem)
        .slice(0, 5); 

    const divGoiYSanPham = document.getElementById('goiYSanPham');
    if (divGoiYSanPham) {
        divGoiYSanPham.innerHTML = ''; 
        if (sanPhamTuongTu.length > 0) {
            // SỬA ĐỔI: Dùng owl-carousel thay vì grid tĩnh
            let html = `<div class="khungSanPham" style="border-color: #0f172a">
                <h3 class="tenKhung" style="background: linear-gradient(135deg, #0f172a, #1e293b); font-size: 20px; font-weight: 700; color: #fff; padding: 15px; margin: 0; text-align: center;">* SẢN PHẨM TƯƠNG TỰ *</h3>
                <ul class="listSpTrongKhung owl-carousel owl-theme" id="goiY-carousel" style="padding: 20px 10px; margin: 0;">`;
            
            sanPhamTuongTu.forEach(sp => {
                html += addProduct(sp, null, true);
            });

            html += `</ul></div>`;
            divGoiYSanPham.innerHTML = html;

            // Kích hoạt thanh trượt
            setTimeout(() => {
                $('#goiY-carousel').owlCarousel({
                    loop: sanPhamTuongTu.length > 5,
                    margin: 15,
                    nav: true,
                    dots: false,
                    responsive: {
                        0: { items: 2 },
                        600: { items: 3 },
                        1000: { items: 5 }
                    }
                });
            }, 100);

        } else {
            // Không có gợi ý
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const quickQuantityInput = document.getElementById('quickQuantity');
    if (quickQuantityInput) {
        quickQuantityInput.addEventListener('input', updateQuickCheckoutSummary);
        quickQuantityInput.addEventListener('change', updateQuickCheckoutSummary);
    }

    const quickCheckoutModal = document.getElementById('quickCheckoutForm');
    if (quickCheckoutModal) {
        quickCheckoutModal.addEventListener('click', function(event) {
            if (event.target === quickCheckoutModal) {
                closeQuickCheckout();
            }
        });
    }
});
