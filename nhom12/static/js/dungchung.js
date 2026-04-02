// Trong doannhom12/js/dungchung.js

// Thông tin admin mặc định
var adminInfo = [{
    "username": "admin",
    "pass": "adadad" // Mật khẩu này chỉ để demo, không nên dùng trong thực tế
}];
function getListAdmin() {
    return JSON.parse(window.localStorage.getItem('ListAdmin'));
}

function setListAdmin(l) {
    window.localStorage.setItem('ListAdmin', JSON.stringify(l));
}
var originalTaikhoanContent; // Lưu nội dung gốc của modal tài khoản
var list_products = []; // Danh sách sản phẩm toàn cục

// Hàm tiện ích cho localStorage
function getLocalStorageItem(key) {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Lỗi parse localStorage key "${key}":`, e);
        return null;
    }
}

function setLocalStorageItem(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Lỗi stringify localStorage key "${key}":`, e);
    }
}

// Hàm xử lý đường dẫn ảnh sản phẩm
function processProductImagePath(product) {
    if (product && product.img) {
        if (!product.img.startsWith('http') && !product.img.startsWith('/static/')) {
            // Nếu img chỉ là tên file hoặc đường dẫn tương đối cũ (ví dụ: "img/products/...")
            let imageName = product.img.includes('/') ? product.img.split('/').pop() : product.img;
            product.img = `/static/img/products/${imageName}`;
        }
        // Nếu đã là URL tuyệt đối hoặc đã đúng dạng /static/ thì giữ nguyên
    }
    return product;
}

async function khoiTao() {
    adminInfo = getLocalStorageItem('ListAdmin') || adminInfo;

    try {
        const response = await fetch('/api/products'); // SỬA ĐỔI: Đường dẫn API tương đối
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        let productsFromAPI = await response.json();

        if (Array.isArray(productsFromAPI)) {
            window.list_products = productsFromAPI.map(processProductImagePath);
        } else {
            window.list_products = [];
            console.warn("Dữ liệu sản phẩm từ API không phải là một mảng.");
        }

        setLocalStorageItem('ListProducts', window.list_products);
        console.log("Sản phẩm đã được tải từ API và đường dẫn ảnh đã được cập nhật.");

    } catch (error) {
        console.error("Không thể tải danh sách sản phẩm từ API:", error);
        let productsFromStorage = getLocalStorageItem('ListProducts');
        if (Array.isArray(productsFromStorage)) {
            window.list_products = productsFromStorage.map(processProductImagePath);
        } else {
            window.list_products = [];
        }

        if (window.list_products.length === 0) {
            if (typeof addAlertBox === "function") addAlertBox('Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối hoặc thử lại sau!', '#aa0000', '#fff', 10000);
        } else {
            if (typeof addAlertBox === "function") addAlertBox('Đang sử dụng dữ liệu offline. Một số thông tin có thể chưa được cập nhật.', '#ff8c00', '#fff', 5000);
        }
    }

    var taikhoanModalContentDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (taikhoanModalContentDiv && !originalTaikhoanContent) {
        originalTaikhoanContent = taikhoanModalContentDiv.innerHTML;
    }

    setupEventTaiKhoan();
    capNhat_ThongTin_CurrentUser();
    addEventCloseAlertButton();
}

// Hàm tìm kiếm theo tên
function timKiemTheoTen(list, ten) {
    if (!list || !Array.isArray(list) || !ten) return [];
    var tempList = copyObject(list);
    var result = [];
    var keywords = ten.toUpperCase().split(' ').filter(Boolean); // Lọc bỏ các chuỗi rỗng

    for (var sp of tempList) {
        if (!sp || !sp.name) continue;
        var nameUpperCase = sp.name.toUpperCase();
        var matchAllKeywords = true;
        for (var keyword of keywords) {
            if (!nameUpperCase.includes(keyword)) {
                matchAllKeywords = false;
                break;
            }
        }
        if (matchAllKeywords) {
            result.push(sp);
        }
    }
    return result;
}

// Hàm tìm kiếm theo mã sản phẩm
function timKiemTheoMa(list, ma) {
    if (!list || !Array.isArray(list) || !ma) return undefined;
    for (var l of list) {
        if (l && l.masp == ma) return l; // Kiểm tra l tồn tại
    }
    return undefined;
}

// Hàm sao chép đối tượng (deep copy dùng JSON)
function copyObject(o) {
    if (typeof o !== 'object' || o === null) return o;
    try {
        return JSON.parse(JSON.stringify(o));
    } catch (e) {
        console.error("Lỗi khi copy object:", o, e);
        return o;
    }
}

// Hàm hiển thị thông báo
// Hàm hiển thị thông báo
function addAlertBox(text, bgcolor, textcolor, time, size = 'small') { // Thêm tham số 'size' với giá trị mặc định là 'normal'
    var al = document.getElementById('alert');
    if (!al) {
        console.warn("Không tìm thấy phần tử #alert để hiển thị thông báo.");
        return;
    }

    var alertTextNode = al.firstChild;
    while (alertTextNode && alertTextNode.nodeType !== Node.TEXT_NODE && alertTextNode.id !== 'closebtn') {
        alertTextNode = alertTextNode.nextSibling;
    }
    if (alertTextNode && alertTextNode.id !== 'closebtn' && alertTextNode.nodeType === Node.TEXT_NODE) {
        alertTextNode.nodeValue = " " + text;
    } else {
        var closeBtn = document.getElementById('closebtn');
        var newTextNode = document.createTextNode(" " + text);
        if (closeBtn && closeBtn.nextSibling) {
            al.insertBefore(newTextNode, closeBtn.nextSibling);
        } else if (closeBtn) {
            al.appendChild(newTextNode);
        } else {
            al.insertBefore(newTextNode, al.firstChild);
        }
    }

    // Điều chỉnh style dựa trên tham số 'size'
    if (size === 'small') {
        al.style.padding = '10px 15px'; // Giảm padding cho thông báo nhỏ
        al.style.fontSize = '0.9em'; // Giảm kích thước font
        // Bạn có thể thêm min-width nếu muốn kiểm soát chiều rộng tối thiểu cho thông báo nhỏ
        // al.style.minWidth = '200px'; 
    } else {
        al.style.padding = '15px';   // Padding mặc định (như trong addFooter)
        al.style.fontSize = '1em';   // Kích thước font mặc định
        // al.style.minWidth = '250px'; // Chiều rộng tối thiểu mặc định (nếu có)
    }

    al.style.backgroundColor = bgcolor;
    al.style.opacity = 1;
    al.style.zIndex = 2000; // Tăng z-index để đảm bảo nó trên cùng
    al.style.display = 'block';

    if (textcolor) al.style.color = textcolor;
    if (time) {
        setTimeout(function () {
            al.style.opacity = 0;
            al.style.zIndex = -1;
            al.style.display = 'none';
        }, time);
    }
}

// Gán sự kiện cho nút đóng alert
function addEventCloseAlertButton() {
    var closeButton = document.getElementById('closebtn');
    if (closeButton) {
        closeButton.onclick = function (event) { // Sử dụng onclick
            if (event.target.parentElement) {
                event.target.parentElement.style.opacity = 0;
                event.target.parentElement.style.zIndex = -1;
                event.target.parentElement.style.display = 'none';
            }
        };
    }
}

// Hàm tạo hiệu ứng cho số lượng giỏ hàng
function animateCartNumber() {
    var cn = document.querySelector('.cart-number'); // Dùng querySelector
    if (!cn) return;
    cn.style.transform = 'scale(1.5)'; // Giảm scale một chút
    cn.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    cn.style.color = 'white';
    setTimeout(function () {
        cn.style.transform = 'scale(1)';
        cn.style.backgroundColor = ''; // Trả về CSS mặc định
        cn.style.color = ''; // Trả về CSS mặc định
    }, 1000); // Giảm thời gian
}

// Hàm thêm sản phẩm vào giỏ hàng
function themVaoGioHang(masp, tensp) {
    var user = getCurrentUser();
    if (!user) {
        addAlertBox('Bạn cần đăng nhập để mua hàng!', '#ff8c00', '#000', 3000, 'small');
        showTaiKhoan(true);
        return;
    }
    if (user.off) {
        addAlertBox('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!', '#aa0000', '#fff', 10000, 'small');
        return;
    }
    const productInStock = Array.isArray(window.list_products) ? timKiemTheoMa(window.list_products, masp) : null;
    if (productInStock && Number(productInStock.quantity) <= 0) {
        addAlertBox(`Sản phẩm ${tensp} đã hết hàng!`, '#ff0000', '#fff', 3500, 'small');
        return;
    }
    var t = new Date().toISOString();
    var daCoSanPham = false;

    if (!user.products) user.products = [];

    for (var i = 0; i < user.products.length; i++) {
        if (user.products[i].ma == masp) {
            user.products[i].soluong = Number(user.products[i].soluong) + 1;
            user.products[i].date = t;
            daCoSanPham = true;
            break;
        }
    }

    if (!daCoSanPham) {
        user.products.push({
            "ma": masp,
            "soluong": 1,
            "date": t
        });
    }

    animateCartNumber();
    addAlertBox(`Đã thêm ${tensp} vào giỏ.`, '#17c671', '#fff', 3500, 'small'); // <-- thêm 'small' ở đây

    setCurrentUser(user);
    updateListUser(user);
    capNhat_ThongTin_CurrentUser();
}

// Hàm lấy thông tin người dùng hiện tại từ localStorage
function getCurrentUser() {
    return getLocalStorageItem('CurrentUser');
}

// Hàm lưu thông tin người dùng hiện tại vào localStorage
function setCurrentUser(u) {
    setLocalStorageItem('CurrentUser', u);
}

// Hàm lấy danh sách người dùng từ localStorage
function getListUser() {
    return getLocalStorageItem('ListUser') || [];
}

// Hàm lưu danh sách người dùng vào localStorage
function setListUser(l) {
    setLocalStorageItem('ListUser', l);
}

// Hàm cập nhật thông tin người dùng trong danh sách
function updateListUser(u, newData) {
    if (!u || !u.username) return; // Không cập nhật nếu user không hợp lệ
    var list = getListUser();
    var updated = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].username === u.username) {
            list[i] = copyObject(newData || u);
            updated = true;
            break;
        }
    }
    if (!updated && !newData) {
        list.push(copyObject(u));
    }
    setListUser(list);
}

// Hàm đăng ký
async function signUp(form) {
    if (!form) return; // Bỏ return false
    var ho = form.ho.value.trim();
    var ten = form.ten.value.trim();
    var email = form.email.value.trim();
    var username = form.newUser.value.trim();
    var pass = form.newPass.value;

    if (!username || !pass || !ho || !ten || !email) {
        addAlertBox('Vui lòng điền đầy đủ thông tin bắt buộc (*).', '#ff8c00', '#000', 3000);
        return; // Bỏ return false
    }
    // ... (các validation khác giữ nguyên) ...
    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        addAlertBox('Tên đăng nhập phải có ít nhất 3 ký tự, chỉ chứa chữ, số và dấu gạch dưới.', '#ff8c00', '#000', 4000);
        return;
    }
    if (pass.length < 6) {
        addAlertBox('Mật khẩu phải có ít nhất 6 ký tự.', '#ff8c00', '#000', 3000);
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#ff8c00', '#000', 3000);
        return;
    }

    var newUser = { username, pass, ho, ten, email, products: [], off: false, perm: 0 };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Lỗi HTTP ${response.status}`);
        }

        const createdUser = data.user || data;
        setCurrentUser(createdUser);

        var listUser = getListUser();
        listUser.push(createdUser);
        setListUser(listUser);

        addAlertBox('Đăng ký thành công! Bạn sẽ được tự động đăng nhập.', '#17c671', '#fff', 4000,);
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        addAlertBox(`Lỗi đăng ký: ${error.message}`, '#aa0000', '#fff', 5000);
        console.error('Lỗi khi đăng ký:', error);
    }
    // Không cần return false
}

// Hàm đăng nhập (không cần `return false` ở cuối nữa)
// Hãy thay thế toàn bộ hàm logIn cũ của bạn bằng hàm này.
function logIn(form) {
    var username = form.username.value.trim();
    var pass = form.pass.value;

    // KHÔNG còn vòng lặp for để kiểm tra admin ở đây nữa.
    // Gửi yêu cầu POST đến /api/login cho MỌI TRƯỜNG HỢP (cả admin và user).
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pass })
    })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                // Nếu có lỗi, ném ra để khối .catch() bên dưới xử lý.
                throw new Error(data.error || 'Đăng nhập thất bại');
            }
            return data; // Chuyển dữ liệu (user hoặc thông báo admin) cho khối .then() tiếp theo.
        })
        .then(data => {
            // KIỂM TRA PHẢN HỒI TỪ MÁY CHỦ
            // Máy chủ sẽ cho biết đây có phải là admin hay không.
            if (data.is_admin) {
                alert('Xin chào admin!');
                window.location.assign('/admin'); // Chuyển hướng đến trang admin.
            } else {
                // Nếu là người dùng thường, lưu thông tin và tải lại trang.
                setCurrentUser(data);
                updateListUser(data);
                alert('Đăng nhập thành công!');
                location.reload();
            }
        })
        .catch(error => {
            // Hiển thị bất kỳ lỗi nào từ máy chủ hoặc lỗi mạng.
            alert('Lỗi đăng nhập: ' + error.message);
            console.error('Lỗi khi đăng nhập:', error);
            if (form.username) form.username.focus();
        });

    return false; // Luôn return false để ngăn form tự gửi đi.
}
function logOut() {
    window.localStorage.removeItem('CurrentUser');
    location.reload();
}

function showTaiKhoan(show) {
    var value = (show ? "scale(1)" : "scale(0)");
    var div = document.getElementsByClassName('containTaikhoan')[0];
    div.style.transform = value;

    if (show && originalTaikhoanContent) {
        var taikhoanDiv = document.querySelector('.taikhoan');
        taikhoanDiv.innerHTML = originalTaikhoanContent;
        setupEventTaiKhoan();
    }
}

function checkTaiKhoan() {
    if (!getCurrentUser()) {
        showTaiKhoan(true);
    }
}
//setupEventTaiKhoan() giúp thiết lập các sự kiện thao tác với tài khoản người dùng trên trang web.
function setupEventTaiKhoan() {
    var containTaikhoanDiv = document.querySelector('.containTaikhoan');
    if (!containTaikhoanDiv) return;
    var taikhoan = containTaikhoanDiv.querySelector('.taikhoan');
    if (!taikhoan) return;

    var listInputs = taikhoan.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');

    ['blur', 'focus'].forEach(function (evt) {
        listInputs.forEach(function (input) {
            // Loại bỏ event listener cũ nếu có để tránh gán nhiều lần
            // Tuy nhiên, với cách gán trực tiếp như addEventListener, không cần remove nếu hàm setupEventTaiKhoan chỉ chạy 1 lần
            // sau khi originalTaikhoanContent được tạo lại.
            input.addEventListener(evt, function (e) {
                var label = this.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    if (e.type === 'blur') {
                        if (this.value === '') {
                            label.classList.remove('active', 'highlight');
                        } else {
                            label.classList.remove('highlight');
                        }
                    } else if (e.type === 'focus') {
                        label.classList.add('active', 'highlight');
                    }
                }
            });
        });
    });

    var tabs = taikhoan.querySelectorAll('.tab-group .tab a');
    tabs.forEach(function (tabLink) {
        // Tương tự, nếu setupEventTaiKhoan được gọi nhiều lần trên cùng cấu trúc DOM mà không clear event cũ,
        // bạn có thể cần remove event listener cũ trước khi add cái mới.
        // Tuy nhiên, với việc taikhoanDiv.innerHTML = originalTaikhoanContent;
        // các event listener cũ trên các element con sẽ bị xóa.
        tabLink.addEventListener('click', function (e) {
            e.preventDefault();
            var currentTabLi = this.parentElement;
            if (!currentTabLi || !currentTabLi.parentElement) return;

            currentTabLi.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            currentTabLi.classList.add('active');

            var targetId = this.getAttribute('href').substring(1);
            var targetContent = document.getElementById(targetId);
            var tabContainer = taikhoan.querySelector('.tab-content');

            if (tabContainer && targetContent) {
                Array.from(tabContainer.children).forEach(contentDiv => {
                    if (contentDiv.id) contentDiv.style.display = 'none';
                });
                targetContent.style.display = 'block';
            }
        });
    });

    const defaultLoginTabLink = taikhoan.querySelector('.tab-group .tab a[href="#login"]');
    if (defaultLoginTabLink) {
        const isActiveTabPresent = taikhoan.querySelector('.tab-group .tab.active');
        if (!isActiveTabPresent) {
            defaultLoginTabLink.click();
        } else {
            const activeHref = isActiveTabPresent.querySelector('a')?.getAttribute('href'); // Thêm optional chaining
            if (activeHref) {
                const activeContentId = activeHref.substring(1);
                const activeContentDiv = document.getElementById(activeContentId);
                const tabContainer = taikhoan.querySelector('.tab-content');
                if (tabContainer && activeContentDiv) {
                    Array.from(tabContainer.children).forEach(contentDiv => {
                        if (contentDiv.id) contentDiv.style.display = 'none';
                    });
                    activeContentDiv.style.display = 'block';
                }
            }
        }
    }

    var forgotLink = taikhoan.querySelector('.forgot a');
    if (forgotLink) {
        // Gán sự kiện một lần hoặc đảm bảo gỡ bỏ listener cũ nếu gán lại
        if (!forgotLink.hasAttribute('data-event-forgot-attached')) {
            forgotLink.onclick = function (e) {
                e.preventDefault();
                showForgotPasswordForm();
            };
            forgotLink.setAttribute('data-event-forgot-attached', 'true');
        }
    }

    // SỬA ĐỔI: Gán sự kiện submit cho form đăng nhập và đăng ký
    const loginForm = taikhoan.querySelector('form[name="loginForm"]');
    const signupForm = taikhoan.querySelector('form[name="signupForm"]');

    if (loginForm && !loginForm.hasAttribute('data-event-attached')) {
        loginForm.addEventListener('submit', async function (event) { // Thêm event listener
            event.preventDefault(); // Ngăn chặn hành động submit mặc định
            await logIn(this);      // Gọi hàm logIn (async)
        });
        loginForm.setAttribute('data-event-attached', 'true');
    }
    if (signupForm && !signupForm.hasAttribute('data-event-attached')) {
        signupForm.addEventListener('submit', async function (event) { // Thêm event listener
            event.preventDefault(); // Ngăn chặn hành động submit mặc định
            await signUp(this);     // Gọi hàm signUp (async)
        });
        signupForm.setAttribute('data-event-attached', 'true');
    }
}



function capNhat_ThongTin_CurrentUser() {
    var u = getCurrentUser(); // Lấy thông tin người dùng hiện tại từ localStorage
    var cartNumberElement = document.getElementsByClassName('cart-number')[0];
    var memberLinkElement = document.querySelector('.member > a'); // Lấy thẻ <a> chứa tên tài khoản
    var menuMemberElement = document.getElementsByClassName('menuMember')[0]; // Lấy menu dropdown của tài khoản

    if (cartNumberElement) { // Kiểm tra xem phần tử cart-number có tồn tại không
        if (u) { // Nếu người dùng đã đăng nhập
            var soLuong = getTongSoLuongSanPhamTrongGioHang(u);
            cartNumberElement.innerHTML = soLuong; // Hiển thị số lượng sản phẩm

            if (soLuong > 0) {
                cartNumberElement.style.display = 'inline-block'; // Hiển thị nếu có sản phẩm
            } else {
                cartNumberElement.style.display = 'none'; // Ẩn nếu không có sản phẩm
            }

            // Cập nhật tên người dùng trên header
            if (memberLinkElement) {
                const iconUser = memberLinkElement.querySelector('i.fa-user');
                if (iconUser) {
                    // Giữ lại icon và cập nhật tên username
                    memberLinkElement.innerHTML = iconUser.outerHTML + ' ' + u.username;
                } else {
                    // Fallback nếu không tìm thấy icon (dù theo HTML gốc là có)
                    memberLinkElement.textContent = u.username;
                }
            }

            // Hiển thị menu người dùng (Trang người dùng, Đăng xuất)
            if (menuMemberElement) {
                menuMemberElement.classList.remove('hide');
            }

        } else { // Nếu người dùng chưa đăng nhập (u là null)
            cartNumberElement.innerHTML = '0'; // Đặt số lượng về 0
            cartNumberElement.style.display = 'none'; // Ẩn đi chấm đỏ/số lượng

            // Đặt lại tên thành "Đăng nhập"
            if (memberLinkElement) {
                const iconUser = memberLinkElement.querySelector('i.fa-user-circle-o') || memberLinkElement.querySelector('i.fa-user');
                if (iconUser) {
                    memberLinkElement.innerHTML = iconUser.outerHTML + ' Đăng nhập';
                } else {
                    memberLinkElement.textContent = ' Đăng nhập';
                }
            }

            // Ẩn menu người dùng
            if (menuMemberElement) {
                menuMemberElement.classList.add('hide');
            }
        }
    }
}

// Lấy tổng số lượng sản phẩm trong giỏ hàng của user
function getTongSoLuongSanPhamTrongGioHang(u) {
    if (!u || !u.products || !Array.isArray(u.products)) return 0;
    var soluong = 0;
    for (var p of u.products) {
        soluong += Number(p.soluong) || 0;
    }
    return soluong;
}

// Định dạng số sang chuỗi có dấu phân cách
function numToString(num, char) {
    if (typeof num !== 'number' && typeof num !== 'string') num = 0;
    num = Number(num) || 0;
    return num.toLocaleString('vi-VN').split(',').join(char || '.');
}

// Định dạng chuỗi (có dấu phân cách) sang số
function stringToNum(str, char) {
    if (typeof str !== 'string') return 0;
    return Number(str.split(char || '.').join(''));
}

// Hàm autocomplete cho ô tìm kiếm
function autocomplete(inp, arr) {
    if (!inp || !Array.isArray(arr)) return;
    var currentFocus;

    inp.addEventListener("input", function (e) { // Sử dụng "input" thay cho "keyup" để bắt cả paste
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;

        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);

        let count = 0;
        for (i = 0; i < arr.length && count < 7; i++) {
            if (arr[i] && arr[i].name && arr[i].name.toUpperCase().includes(val.toUpperCase())) {
                b = document.createElement("DIV");
                let matchIndex = arr[i].name.toUpperCase().indexOf(val.toUpperCase());
                b.innerHTML = arr[i].name.substring(0, matchIndex) +
                    "<strong>" + arr[i].name.substring(matchIndex, matchIndex + val.length) + "</strong>" +
                    arr[i].name.substring(matchIndex + val.length);
                b.innerHTML += `<input type='hidden' value='${arr[i].name.replace(/'/g, "&apos;")}'>`; // Escape '
                b.setAttribute('data-masp', arr[i].masp);

                b.addEventListener("click", function (e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    var masp = this.getAttribute('data-masp');
                    // SỬA ĐỔI: Chuyển đến route /chitietsanpham
                    if (masp) window.location.href = `/chitietsanpham?masp=${masp}`;
                });
                a.appendChild(b);
                count++;
            }
        }
    });

    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (!x || x.length === 0) return;

        if (e.keyCode == 40) { // Down
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // Up
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // Enter
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else {
                if (inp.form && typeof inp.form.submit === 'function') inp.form.submit();
            }
        } else if (e.keyCode === 27) { // Escape
            closeAllLists();
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        if (x[currentFocus]) x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var autocompleteItems = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < autocompleteItems.length; i++) {
            if (elmnt != autocompleteItems[i] && elmnt != inp) {
                autocompleteItems[i].parentNode.removeChild(autocompleteItems[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        if (e.target !== inp && !e.target.closest('.autocomplete-items')) {
            closeAllLists();
        }
    });
}

// Hàm thêm tags vào khung tìm kiếm
function addTags(nameTag, link) {
    var khung_tags = document.querySelector('.search-header .tags');
    if (khung_tags) {
        var firstChild = khung_tags.firstChild;
        // Nếu khung tags rỗng hoặc chỉ chứa text node là khoảng trắng, thì thêm "Từ khóa:"
        if (!firstChild || (firstChild.nodeType === Node.TEXT_NODE && firstChild.nodeValue.trim() === '')) {
            khung_tags.innerHTML = "<strong>Từ khóa: </strong>";
        } else if (firstChild.nodeType === Node.ELEMENT_NODE && firstChild.tagName === 'STRONG' && firstChild.textContent.includes('Từ khóa:')) {
            // Đã có "Từ khóa:", không cần làm gì thêm ở đây, chỉ nối thẻ a
        } else if (khung_tags.innerHTML.trim() === "") { // Trường hợp rỗng hoàn toàn
            khung_tags.innerHTML = "<strong>Từ khóa: </strong>";
        }


        var new_tag = `<a href="${link}">${nameTag}</a>`;
        khung_tags.innerHTML += new_tag;
    }
}

// Hàm thêm sản phẩm vào DOM (hoặc trả về chuỗi HTML)
// QUAN TRỌNG: p.img phải là đường dẫn đã được sửa bởi khoiTao()
function addProduct(p, ele, returnString) {
    if (!p || !p.masp) return '';

    // Giả định class Promo và Product đã được định nghĩa ở đâu đó (ví dụ: classes.js)
    var promo = (p.promo && typeof Promo === 'function') ? new Promo(p.promo.name, p.promo.value) : { name: p.promo && p.promo.name || '', value: p.promo && p.promo.value || '' };
    var product;
    if (typeof Product === 'function') {
        // p.img đã được xử lý trong khoiTao() để có đường dẫn đúng /static/img/products/...
        product = new Product(p.masp, p.name, p.img, p.price, p.star, p.rateCount, promo);
    } else {
        console.error("Class Product is not defined! Using raw product object.");
        product = p;
        product.img = product.img || '/static/img/default_product.png'; // Đảm bảo có ảnh default
    }

    // Nếu có hàm addToWeb, ưu tiên dùng nó
    if (typeof addToWeb === 'function') {
        return addToWeb(product, ele, returnString);
    }

    // Fallback HTML cơ bản nếu addToWeb không tồn tại
    console.warn("Hàm addToWeb chưa được định nghĩa. Sử dụng fallback HTML cơ bản.");

    // SỬA ĐỔI: Link chi tiết sản phẩm trỏ đến route
    const productDetailLink = `/chitietsanpham?masp=${product.masp}`;
    let starsHTML = '';
    if (typeof product.star === 'number') {
        for (let i = 0; i < 5; i++) {
            if (i < product.star) {
                starsHTML += '<i class="fa fa-star"></i>';
            } else {
                starsHTML += '<i class="fa fa-star-o"></i>'; // Sao rỗng
            }
        }
    }

    const stockQuantity = Number(p.quantity) || 0;
    const stockHtml = stockQuantity > 0
        ? `<div class="stock-info">Còn lại: <span class="stock-count" data-masp="${product.masp}">${stockQuantity}</span> máy</div>`
        : `<div class="stock-info" style="color:#dc2626; font-weight:700;">Hết hàng</div>`;

    const productHTML = `
        <li class="sanpham" data-masp="${product.masp}">
            <a href="${productDetailLink}">
                <img class="hinhanh" src="${product.img}" alt="${product.name || 'Sản phẩm'}">
                <h3 class="tensp">${product.name || 'N/A'}</h3>
                <div class="price"><strong>${product.price ? numToString(product.price) : '0'}₫</strong></div>
                <div class="ratingresult">${starsHTML}</div>
                ${product.promo && product.promo.name ? `<label class="itemlabel ${product.promo.name.toLowerCase()}">${product.promo.value || promoToString(product.promo.name)}</label>` : ''}
                ${stockHtml}
            </a>
        </li>`;

    if (returnString) {
        return productHTML;
    } else if (ele && typeof ele.appendChild === 'function') {
        // Tạo element từ chuỗi HTML và append
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = productHTML.trim();
        const liElement = tempDiv.firstChild;
        if (liElement) ele.appendChild(liElement);
    }
    return ''; // Trả về chuỗi rỗng nếu không returnString và không có ele
}

// Các hàm document.write nên được gọi trước khi DOMContentLoaded.
// Nếu dungchung.js được nạp ở <head>, chúng sẽ hoạt động.
// Tuy nhiên, thực hành tốt hơn là tạo các div container trong HTML
// và dùng JS để điền nội dung vào đó.
function addTopNav() {
    // Navbar dưới header: danh mục sản phẩm + link trang phụ
    document.write(`
    <nav class="main-navbar group">
        <div class="navbar-inner">
            <ul class="navbar-links">
                <li class="nav-brand-picker">
                    <a href="javascript:void(0);"><i class="fa fa-th-large"></i> Chọn hãng <i class="fa fa-angle-down"></i></a>
                    <div class="nav-brand-menu">
                        <a href="/?search=iPhone">iPhone</a>
                        <a href="/?search=Samsung">Samsung</a>
                        <a href="/?search=Oppo">Oppo</a>
                        <a href="/?search=Xiaomi">Xiaomi</a>
                        <a href="/?search=Huawei">Huawei</a>
                        <a href="/?search=Realme">Realme</a>
                        <a href="/?search=Vivo">Vivo</a>
                        <a href="/?search=Nokia">Nokia</a>
                        <a href="/?search=Itel">Itel</a>
                        <a href="/?search=HTC">HTC</a>
                        <a href="/?search=Motorola">Motorola</a>
                    </div>
                </li>
                <li><a href="/?search=Samsung"><i class="fa fa-mobile"></i> Samsung</a></li>
                <li><a href="/?search=iPhone"><i class="fa fa-apple"></i> iPhone</a></li>
                <li><a href="/?search=Xiaomi"><i class="fa fa-mobile"></i> Xiaomi</a></li>
                  <li><a href="/?search=Oppo"><i class="fa fa-mobile"></i> Oppo</a></li>
                  <li><a href="/?search=Laptop"><i class="fa fa-laptop"></i> Laptop</a></li>
                  <li><a href="/?search=Phu+kien"><i class="fa fa-headphones"></i> Phụ kiện</a></li>
                  <li><a href="/?search=Smartwatch"><i class="fa fa-clock-o"></i> Smartwatch</a></li>
              </ul>
          </div>
      </nav>`);
  }

function addHeader() {
    document.write(`
    <div class="header group">
        <div class="header-inner">
            <div class="logo">
                <a href="/">
                    <img src="/static/img/logo.svg" alt="Trang chủ Smartphone Store" title="Trang chủ Smartphone Store">
                </a>
            </div>

            <form class="input-search" method="get" action="/">
                <div class="autocomplete">
                    <input id="search-box" name="search" autocomplete="off" type="text" placeholder="Bạn tìm gì...">
                    <button type="submit">
                        <i class="fa fa-search"></i>
                    </button>
                </div>
            </form>

              <div class="tools-member">
                  <div class="member">
                      <a href="javascript:void(0);" onclick="checkTaiKhoan();">
                          <i class="fa fa-user-circle-o"></i>
                          Đăng nhập
                    </a>
                    <div class="menuMember hide">
                        <a href="/nguoidung">Trang người dùng</a>
                        <a href="javascript:void(0);" onclick="if(window.confirm('Xác nhận đăng xuất ?')) logOut();">Đăng xuất</a>
                    </div>
                </div>
                  <div class="cart">
                      <a href="/giohang">
                          <i class="fa fa-shopping-cart"></i>
                          <span>Giỏ hàng</span>
                          <span class="cart-number"></span>
                      </a>
                  </div>
                  <div class="header-location">
                      <a href="javascript:void(0);" onclick="toggleHeaderLocationMenu(event);">
                          <i class="fa fa-map-marker"></i>
                          <span id="header-location-label">Chọn vị trí</span>
                          <i class="fa fa-angle-right"></i>
                      </a>
                      <div class="header-location-menu" id="header-location-menu">
                          <div class="header-location-menu-inner">
                              <h4>Chọn tỉnh / thành phố</h4>
                              <select id="header-location-province" onchange="handleHeaderLocationChange(this)">
                                  <option value="" disabled selected hidden>Chọn tỉnh / thành phố</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>`);
  }
// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...
// Thêm CSS cho alert nhỏ gọn hơn

// Trong doannhom12/js/dungchung.js

// ... (các hàm khác của bạn) ...
// HÀM CẦN CẬP NHẬT 1
// HÀM CẦN CẬP NHẬT 2
function addFooter() {
    // Thêm nội dung HTML của footer và copyright
    document.write(`
    <div id="alert">
        <span id="closebtn">⊗</span>
    </div>
    
    <div class="footer-wrapper">
        <div class="footer-content-new">
            <div class="footer-col">
                <div class="footer-logo">
                    <img src="/static/img/logo.svg" alt="Phone Store"> 
                    <span>PHONE STORE</span>
                </div>
                <p class="footer-description">Hệ thống bán lẻ Smarthone, điện thoại di động, thiết bị công nghệ chính hãng với giá tốt, có trả góp 0%, giao hàng nhanh miễn phí.</p>
                <p><strong>Địa chỉ:</strong> 40 Phúc Diễn, Cầu Giấy, Bắc Từ Liêm, Hà Nội</p>
                <p><strong>Điện thoại:</strong> <a href="tel:0326732225">032 637 3225</a></p>
                <p><strong>Email:</strong> <a href="mailto:smartphone2025@gmail.com">smartphone2025@gmail.com</a></p>
            </div>

            <div class="footer-col">
                <h3 class="footer-title">Hỗ trợ khách hàng</h3>
                <div class="footer-contact-section">
                    <h4>MUA ONLINE (08:00 - 21:00 mỗi ngày)</h4>
                    <p class="contact-phone"><a href="tel:0397949363">03 9794 9363</a></p>
                    <p class="contact-note">Tất cả các ngày trong tuần (Trừ tết Âm Lịch)</p>
                </div>
                <div class="footer-contact-section">
                    <h4>GÓP Ý & KHIẾU NẠI (08:30 - 20:30)</h4>
                    <p class="contact-phone"><a href="tel:0397949363">03 9794 9363</a></p>
                    <p class="contact-note">Tất cả các ngày trong tuần (Trừ tết Âm Lịch)</p>
                </div>
            </div>

              <div class="footer-col">
                  <h3 class="footer-title">Liên kết sàn thương mại điện tử</h3>
                  <div class="social-links">
                      <a href="#" title="Shopee"><img src="/static/img/logoicon/shopee.png" alt="Shopee"></a>
                      <a href="#" title="Lazada"><img src="/static/img/logoicon/lazada.png" alt="Lazada"></a>
                      <a href="#" title="Tiki"><img src="/static/img/logoicon/tiki.png" alt="Tiki"></a>
                      <a href="#" title="Sendo"><img src="/static/img/logoicon/sendo.png" alt="Sendo"></a>
                  </div>
                  <h3 class="footer-title">Thông tin</h3>
                  <div class="footer-quick-links">
                      <a href="/tintuc">Tin tức</a>
                      <a href="/trungtambaohanh">Bảo hành</a>
                      <a href="/tuyendung">Tuyển dụng</a>
                      <a href="/lienhe">Liên hệ</a>
                  </div>
                  <h3 class="footer-title">Hình thức thanh toán</h3>
                  <div class="payment-methods">
                      <span class="payment-icon"><i class="fa fa-money"></i> Tiền mặt</span>
                    <span class="payment-icon"><i class="fa fa-exchange"></i> Chuyển khoản</span>
                    <span class="payment-icon"><i class="fa fa-cc-visa"></i> Visa</span>
                    <span class="payment-icon"><i class="fa fa-cc-mastercard"></i> Mastercard</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="copy-right">
        <p>Bản quyền thuộc về Phone Store. Cung cấp bởi Meta</p>
    </div>
    `);
}

// ... (Hàm addAlertBox và các hàm khác giữ nguyên như các lần chỉnh sửa trước) ...

function addContainTaiKhoan() {
    if (document.querySelector('.containTaikhoan')) return;

    const taiKhoanHTML = `
    <div class="containTaikhoan" style="transform: scale(0);">
        <span class="close" onclick="showTaiKhoan(false);">&times;</span>
        <div class="taikhoan">
            <ul class="tab-group">
                <li class="tab active"><a href="#login">Đăng nhập</a></li>
                <li class="tab"><a href="#signup">Đăng ký</a></li>
            </ul>
            <div class="tab-content">
                <div id="login" style="display:block;"> 
                    <h1>Đăng nhập</h1>
                    <form name="loginForm"> 
                        <div class="field-wrap">
                            <label>Tên đăng nhập <span class="req">*</span></label>
                            <input name="username" type="text" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Mật khẩu <span class="req">*</span></label>
                            <input name="pass" type="password" required autocomplete="off" />
                        </div>
                        <div class="forgot">
                            <a href="javascript:void(0);" onclick="showForgotPasswordForm();">Quên mật khẩu?</a>
                        </div>
                        <button type="submit" class="button">Tiếp tục</button>
                    </form>
                </div>
                <div id="signup" style="display:none;"> 
                    <h1>Đăng ký</h1>
                    <form name="signupForm"> 
                        <div class="top-row">
                            <div class="field-wrap">
                                <label>Họ <span class="req">*</span></label>
                                <input name="ho" type="text" required autocomplete="off" />
                            </div>
                            <div class="field-wrap">
                                <label>Tên <span class="req">*</span></label>
                                <input name="ten" type="text" required autocomplete="off" />
                            </div>
                        </div>
                        <div class="field-wrap">
                            <label>Địa chỉ Email <span class="req">*</span></label>
                            <input name="email" type="email" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Tên đăng nhập <span class="req">*</span></label>
                            <input name="newUser" type="text" required autocomplete="off" />
                        </div>
                        <div class="field-wrap">
                            <label>Mật khẩu <span class="req">*</span></label>
                            <input name="newPass" type="password" required autocomplete="off" />
                        </div>
                        <button type="submit" class="button">Tạo tài khoản</button>
                    </form>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', taiKhoanHTML);
    // Lưu lại nội dung gốc sau khi HTML được chèn vào DOM lần đầu
    var taikhoanModalContentDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (taikhoanModalContentDiv && !originalTaikhoanContent) {
        originalTaikhoanContent = taikhoanModalContentDiv.innerHTML;
    }
    setupEventTaiKhoan(); // Gọi lại để gán event cho các form và input mới
}

function addPlc() {
    document.write(`
    <div class="plc">
        <section>
            <ul class="flexContain">
                <li>Giao hàng hỏa tốc trong 1 giờ</li>
                <li>Thanh toán linh hoạt: tiền mặt, visa / master, trả góp</li>
                <li>Trải nghiệm sản phẩm tại nhà</li>
                <li>Lỗi đổi tại nhà trong 1 ngày</li>
                <li>Hỗ trợ suốt thời gian sử dụng.
                    <br>Hotline:
                    <a href="tel:12345678" style="color: #288ad6;">12345678</a>
                </li>
            </ul>
        </section>
    </div>`);
}

function addPlc() {

}

// Các hàm tiện ích khác
function shuffleArray(array) { /* ... Giữ nguyên ... */ return array; }
function checkLocalStorage() { /* ... Giữ nguyên ... */ }
function gotoTop() { /* ... Giữ nguyên ... */ }
function getRandomColor() { /* ... Giữ nguyên ... */ }
function auto_Get_Database() { /* ... Giữ nguyên, nhưng có thể không còn hữu ích ... */ }
function getThongTinSanPhamFrom_TheGioiDiDong() { /* ... Giữ nguyên, bookmarklet ... */ }

function ensureAIChatWidget() {
    if (!document.getElementById('ai-chat-widget')) {
        const widgetWrapper = document.createElement('div');
        widgetWrapper.innerHTML = `
            <div id="ai-chat-widget">
                <button id="chat-toggle-button">
                    <i class="fa fa-comments"></i> MI AI
                </button>
                <div id="chat-window" class="hidden">
                    <div id="chat-header">
                        <div class="header-info">
                            <i class="fa fa-robot"></i>
                            <span>MI AI</span>
                        </div>
                        <button id="chat-close-button">×</button>
                    </div>
                    <div id="chat-messages"></div>
                    <div id="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Bạn muốn tìm máy gì...">
                        <button id="chat-send-button"><i class="fa fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(widgetWrapper.firstElementChild);
    }

    if (!document.querySelector('link[data-ai-chat-style="true"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/ai-chat.css';
        cssLink.setAttribute('data-ai-chat-style', 'true');
        document.head.appendChild(cssLink);
    }

    if (!document.querySelector('script[data-ai-chat-script="true"]')) {
        const script = document.createElement('script');
        script.src = '/static/js/ai-chat.js';
        script.setAttribute('data-ai-chat-script', 'true');
        document.body.appendChild(script);
    } else if (typeof window.initAIChatWidget === 'function') {
        window.initAIChatWidget();
    }
}

document.addEventListener('DOMContentLoaded', ensureAIChatWidget);

function attachFloatingLabelEvents(inputs, focusFieldName = "") {
    ['blur', 'focus', 'input'].forEach(function (evt) {
        inputs.forEach(function (input) {
            input.addEventListener(evt, function (e) {
                var label = this.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    if (e.type === 'focus') {
                        label.classList.add('active', 'highlight');
                    } else if (e.type === 'blur') {
                        if (this.value.trim() === '') {
                            label.classList.remove('active', 'highlight');
                        } else {
                            label.classList.add('active');
                            label.classList.remove('highlight');
                        }
                    } else if (e.type === 'input') {
                        if (this.value.trim() === '') {
                            label.classList.remove('active');
                        } else {
                            label.classList.add('active');
                        }
                    }
                }
            });

            if (input.value.trim() !== '') {
                var label = input.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    label.classList.add('active');
                }
            }

            if (focusFieldName && input.name === focusFieldName) {
                input.focus();
            }
        });
    });
}


// Các hàm quên mật khẩu
function showForgotPasswordForm() {
    var taikhoanDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (!taikhoanDiv) {
        console.error("Không tìm thấy .taikhoan div");
        return;
    }

    taikhoanDiv.innerHTML = `
        <h1>Đặt lại mật khẩu - Bước 1/3</h1>
        <form name="formForgotPasswordStep1">
            <div class="field-wrap">
                <label>Nhập địa chỉ Email đã đăng ký <span class="req">*</span></label>
                <input name="email" type="email" required autocomplete="off" />
            </div>
            <button type="submit" class="button">Tiếp tục</button>
        </form>
        <div class="back-to-login" style="text-align:center; margin-top:20px; font-size:14px;">
            <a href="javascript:void(0);" onclick="showTaiKhoan(true);">Quay lại đăng nhập</a>
        </div>
    `;
    const formStep1 = taikhoanDiv.querySelector('form[name="formForgotPasswordStep1"]');
    if (formStep1 && !formStep1.hasAttribute('data-event-attached')) {
        formStep1.onsubmit = function (e) { e.preventDefault(); handleForgotPassword_Step1(this); return false; };
        formStep1.setAttribute('data-event-attached', 'true');
        var listInputs = formStep1.querySelectorAll('input');
        attachFloatingLabelEvents(listInputs, 'email');
    }
}

async function handleForgotPassword_Step1(form) {
    if (!form) return false;
    var email = form.email.value.trim();
    if (!email) {
        addAlertBox('Vui lòng nhập địa chỉ email.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không hợp lệ.', '#ff0000', '#fff', 3000);
        return false;
    }

    try {
        const response = await fetch('/api/password-reset/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();

        if (!response.ok) {
            addAlertBox(data.error || 'Đã có lỗi xảy ra khi gửi email xác thực.', '#ff0000', '#fff', 6000);
            return false;
        }
        // Hiển thị thông báo thành công
        addAlertBox('Mã OTP đã được gửi! Vui lòng kiểm tra hộp thư (và cả mục Spam/Quảng cáo).', '#17c671', '#fff', 6000);
        showOTPVerificationForm(email);

    } catch (err) {
        console.error("Lỗi gọi API gửi email:", err);
        addAlertBox('Lỗi kết nối máy chủ gửi thư: ' + err.message, '#ff0000', '#fff', 7000);
    }

    return false;
}

function showOTPVerificationForm(emailForDisplay) {
    var taikhoanDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (!taikhoanDiv) return;

    taikhoanDiv.innerHTML = `
        <h1>Xác thực OTP - Bước 2/3</h1>
        <p style="text-align:center; margin-bottom:10px; color:#b0b0b0; font-size:0.9em;">Mã OTP (6 số) đã được gửi đến: <strong>${emailForDisplay}</strong></p>
        <form name="formOTPVerification">
            <div class="field-wrap">
                <label>Nhập mã OTP <span class="req">*</span></label>
                <input name="otpInput" type="text" required autocomplete="off" maxlength="6" />
            </div>
            <button type="submit" class="button">Xác nhận</button>
        </form>
        <div class="back-to-login" style="text-align:center; margin-top:20px; font-size:14px;">
            <a href="javascript:void(0);" onclick="showForgotPasswordForm();">Quay lại Bước 1</a>
        </div>
    `;
    const formOTP = taikhoanDiv.querySelector('form[name="formOTPVerification"]');
    if (formOTP && !formOTP.hasAttribute('data-event-attached')) {
        formOTP.onsubmit = function (e) { e.preventDefault(); handleOTPVerification_Step2(this, emailForDisplay); return false; };
        formOTP.setAttribute('data-event-attached', 'true');

        var listInputs = formOTP.querySelectorAll('input');
        attachFloatingLabelEvents(listInputs, 'otpInput');
    }
}

async function handleOTPVerification_Step2(form, emailForDisplay) {
    if (!form) return false;
    var otpInput = form.otpInput.value.trim();
    if (!otpInput) {
        addAlertBox('Vui lòng nhập mã OTP.', '#ff0000', '#fff', 3000);
        return false;
    }

    try {
        const response = await fetch('/api/password-reset/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailForDisplay, otp: otpInput })
        });
        const data = await response.json();
        if (!response.ok) {
            addAlertBox(data.error || 'Mã OTP không chính xác!', '#ff0000', '#fff', 3000);
            return false;
        }
        showSetNewPasswordForm(emailForDisplay);
    } catch (error) {
        addAlertBox('Không thể xác thực OTP lúc này.', '#ff0000', '#fff', 3000);
    }
    return false;
}

function showSetNewPasswordForm(emailForDisplay) {
    var taikhoanDiv = document.querySelector('.containTaikhoan .taikhoan');
    if (!taikhoanDiv) return;

    taikhoanDiv.innerHTML = `
        <h1>Đặt lại mật khẩu - Bước 3/3</h1>
        <p style="text-align:center; margin-bottom:10px; color:#b0b0b0; font-size:0.9em;">Đặt mật khẩu mới cho Gmail: <strong>${emailForDisplay}</strong></p>
        <form name="formSetNewPassword">
            <div class="field-wrap">
                <label>Mật khẩu mới <span class="req">*</span></label>
                <input name="newPassword" type="password" required autocomplete="off" minlength="6" />
            </div>
            <div class="field-wrap">
                <label>Xác nhận mật khẩu mới <span class="req">*</span></label>
                <input name="confirmNewPassword" type="password" required autocomplete="off" minlength="6" />
            </div>
            <button type="submit" class="button">Hoàn tất & Đặt lại</button>
        </form>
        <div class="back-to-login" style="text-align:center; margin-top:20px; font-size:14px;">
            <a href="javascript:void(0);" onclick="showTaiKhoan(true);">Hủy & Quay lại đăng nhập</a>
        </div>
    `;
    const formStep3 = taikhoanDiv.querySelector('form[name="formSetNewPassword"]');
    if (formStep3 && !formStep3.hasAttribute('data-event-attached')) {
        formStep3.onsubmit = function (e) { e.preventDefault(); handleSetNewPassword_Step3(this); return false; };
        formStep3.setAttribute('data-event-attached', 'true');
        var listInputs = formStep3.querySelectorAll('input');
        attachFloatingLabelEvents(listInputs, 'newPassword');
    }
}

async function handleSetNewPassword_Step3(form) {
    if (!form) return false;
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;

    if (!newPassword || !confirmNewPassword) {
        addAlertBox('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (newPassword.length < 6) {
        addAlertBox('Mật khẩu mới phải có ít nhất 6 ký tự.', '#ff0000', '#fff', 3000);
        return false;
    }
    if (newPassword !== confirmNewPassword) {
        addAlertBox('Mật khẩu mới và xác nhận không khớp!', '#ff0000', '#fff', 3000);
        if (form.confirmNewPassword) {
            form.confirmNewPassword.value = "";
            form.confirmNewPassword.focus();
        }
        return false;
    }

    try {
        const response = await fetch('/api/password-reset/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pass: newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Lỗi HTTP ${response.status}`);
        }

        addAlertBox('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.', '#17c671', '#fff', 7000);
        showTaiKhoan(true);

    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        addAlertBox(`Lỗi khi đặt lại mật khẩu: ${error.message}`, '#ff0000', '#fff', 5000);
    }
    return false;
}

// Thêm đoạn mã này vào cuối file dungchung.js

// Lấy đối tượng nút "lên đầu trang"
var gotoTopButton = document.getElementById("goto-top-page");

// Hiển thị nút khi người dùng cuộn xuống 100px từ đầu trang
window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (gotoTopButton) { // Kiểm tra xem nút có tồn tại không
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            gotoTopButton.style.display = "block";
        } else {
            gotoTopButton.style.display = "none";
        }
    }
}

// Hàm xử lý sự kiện khi nhấn nút để cuộn lên đầu trang
function gotoTop() {
    // Cho trình duyệt Chrome, Firefox, IE và Opera
    document.body.scrollTop = 0;
    // Cho Safari
    document.documentElement.scrollTop = 0;
}

// ================== REAL-TIME STOCK UPDATE (SOCKET.IO) ==================
var socket;
function initSocket() {
    if (typeof io !== 'undefined') {
        socket = io();
        socket.on('update_stock', function (data) {
            console.log("Real-time Stock Update:", data);
            updateQuantityInDOM(data.masp, data.new_quantity);
        });
    } else {
        console.warn("Socket.io client library not loaded yet.");
    }
}

function updateQuantityInDOM(masp, quantity) {
    // Cập nhật trong các thẻ sản phẩm (danh sách)
    const stockSpans = document.querySelectorAll(`.stock-count[data-masp="${masp}"]`);
    stockSpans.forEach(span => {
        span.textContent = quantity;

        // Hiệu ứng nháy màu khi cập nhật
        span.parentElement.style.transition = 'color 0.3s ease';
        span.parentElement.style.color = '#ff8c00';
        setTimeout(() => {
            span.parentElement.style.color = '';
        }, 1000);
    });

    // Cập nhật trong trang chi tiết sản phẩm (nếu đang mở đúng sp đó)
    const detailStock = document.querySelector(`.detail-stock-count[data-masp="${masp}"]`);
    if (detailStock) {
        detailStock.textContent = Number(quantity) > 0 ? `${quantity} máy` : 'Hết hàng';
        detailStock.style.color = Number(quantity) > 0 ? '#ff8c00' : '#ff0000';
    }
}

// Chạy khởi tạo socket sau khi trang load
window.addEventListener('DOMContentLoaded', initSocket);

const HEADER_LOCATION_STORAGE_KEY = 'headerSelectedLocation';

function updateHeaderLocationLabel(locationName) {
    const label = document.getElementById('header-location-label');
    if (!label) return;
    label.textContent = locationName || 'Chọn vị trí';
}

function toggleHeaderLocationMenu(event) {
    if (event) event.stopPropagation();
    const wrapper = document.querySelector('.header-location');
    if (!wrapper) return;
    wrapper.classList.toggle('open');
}

function closeHeaderLocationMenu() {
    const wrapper = document.querySelector('.header-location');
    if (!wrapper) return;
    wrapper.classList.remove('open');
}

function handleHeaderLocationChange(selectElement) {
    if (!selectElement) return;
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const locationName = selectedOption ? selectedOption.textContent.trim() : '';
    if (!locationName) return;

    localStorage.setItem(HEADER_LOCATION_STORAGE_KEY, locationName);
    updateHeaderLocationLabel(locationName);
    closeHeaderLocationMenu();
}

function initHeaderLocationPicker() {
    const provinceSelect = document.getElementById('header-location-province');
    if (!provinceSelect) return;

    const savedLocation = localStorage.getItem(HEADER_LOCATION_STORAGE_KEY);
    updateHeaderLocationLabel(savedLocation);
    loadProvinces('header-location-');

    document.addEventListener('click', function (event) {
        const wrapper = document.querySelector('.header-location');
        if (!wrapper) return;
        if (!wrapper.contains(event.target)) {
            closeHeaderLocationMenu();
        }
    });
}

// ================== ADDRESS PICKER LOGIC (SHARED) ==================
function getAddressFieldPrefix(elementId = "") {
    const match = elementId.match(/^(.*-)(province|district|ward)$/);
    return match ? match[1] : "";
}

async function loadProvinces(idPrefix = "") {
    const provinceSelect = document.getElementById(idPrefix + 'province');
    if (!provinceSelect) return;

    // Nếu đã có dữ liệu rồi thì không tải lại
    if (provinceSelect.options.length > 1) return;

    try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        const provinces = await response.json();

        provinces.sort((a, b) => a.name.localeCompare(b.name));

        provinces.forEach(p => {
            const option = document.createElement('option');
            option.value = p.code;
            option.textContent = p.name;
            provinceSelect.appendChild(option);
        });
    } catch (e) {
        console.error("Lỗi tải tỉnh thành:", e);
    }
}

async function loadDistricts(provinceCode, idPrefix = "") {
    const districtSelect = document.getElementById(idPrefix + 'district');
    const wardSelect = document.getElementById(idPrefix + 'ward');
    if (!districtSelect) return;

    districtSelect.innerHTML = '<option value="" disabled selected hidden>Chọn Quận / Huyện</option>';
    districtSelect.disabled = true;
    if (wardSelect) {
        wardSelect.innerHTML = '<option value="" disabled selected hidden>Chọn Phường / Xã</option>';
        wardSelect.disabled = true;
    }

    if (!provinceCode) return;

    try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await response.json();
        const districts = data.districts;

        districts.sort((a, b) => a.name.localeCompare(b.name));
        districts.forEach(d => {
            const option = document.createElement('option');
            option.value = d.code;
            option.textContent = d.name;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    } catch (e) {
        console.error("Lỗi tải quận huyện:", e);
    }
}

async function loadWards(districtCode, idPrefix = "") {
    const wardSelect = document.getElementById(idPrefix + 'ward');
    if (!wardSelect) return;

    wardSelect.innerHTML = '<option value="" disabled selected hidden>Chọn Phường / Xã</option>';
    wardSelect.disabled = true;

    if (!districtCode) return;

    try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await response.json();
        const wards = data.wards;

        wards.sort((a, b) => a.name.localeCompare(b.name));
        wards.forEach(w => {
            const option = document.createElement('option');
            option.value = w.code;
            option.textContent = w.name;
            wardSelect.appendChild(option);
        });
        wardSelect.disabled = false;
    } catch (e) {
        console.error("Lỗi tải phường xã:", e);
    }
}

// Lắng nghe sự kiện change trên toàn cục nhưng chỉ xử lý cho province/district
document.addEventListener('change', function (e) {
    const targetId = e.target.id || "";
    const idPrefix = getAddressFieldPrefix(targetId);

    if (targetId === 'province' || targetId.endsWith('-province')) {
        loadDistricts(e.target.value, idPrefix);
    } else if (targetId === 'district' || targetId.endsWith('-district')) {
        loadWards(e.target.value, idPrefix);
    }
});

window.addEventListener('DOMContentLoaded', initHeaderLocationPicker);
