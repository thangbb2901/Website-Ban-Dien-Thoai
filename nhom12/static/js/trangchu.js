// Trong doannhom12/js/trangchu.js

const HOME_SCROLL_POSITION_KEY = 'homeScrollPosition';
const HOME_RECENTLY_VIEWED_KEY = 'homeRecentlyViewedProducts';
const HOMEPAGE_VISIBLE_PRODUCTS = 10;

function setupProductNavigationScrollState() {
    if (document.body.dataset.homeScrollTrackingAttached === 'true') return;
    document.body.dataset.homeScrollTrackingAttached = 'true';

    document.addEventListener('click', function (event) {
        const productLink = event.target.closest('a[href*="/chitietsanpham?masp="]');
        if (!productLink) return;
        sessionStorage.setItem(HOME_SCROLL_POSITION_KEY, String(window.scrollY || window.pageYOffset || 0));
    });
}

function restoreHomeScrollPosition() {
    const savedScroll = sessionStorage.getItem(HOME_SCROLL_POSITION_KEY);
    if (!savedScroll) return;

    const scrollY = parseInt(savedScroll, 10);
    if (isNaN(scrollY)) {
        sessionStorage.removeItem(HOME_SCROLL_POSITION_KEY);
        return;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
            setTimeout(() => window.scrollTo(0, scrollY), 120);
        });
    });

    sessionStorage.removeItem(HOME_SCROLL_POSITION_KEY);
}

function initProductResultsSlider() {
    const productsContainer = $('#products');
    if (!productsContainer.length || !productsContainer.children('li.sanpham').length) return;
    productsContainer.children('#khongCoSanPham').remove();

    const productFilterInput = document.querySelector('.contain-products .filterName');
    const pagination = document.querySelector('.contain-products .pagination');
    if (productFilterInput) productFilterInput.style.display = 'none';
    if (pagination) pagination.style.display = 'none';

    if (productsContainer.hasClass('owl-loaded')) {
        productsContainer.trigger('destroy.owl.carousel');
    }

    productsContainer.addClass('owl-carousel owl-theme product-results-slider');

    productsContainer.owlCarousel({
        loop: productsContainer.children('li.sanpham').length > 4,
        margin: 0,
        nav: true,
        dots: false,
        autoplay: false,
        responsive: {
            0: { items: 1.15 },
            520: { items: 2.15 },
            768: { items: 3.1 },
            992: { items: 4.1 },
            1200: { items: 5 }
        }
    });
}

function destroyProductResultsSlider() {
    const productsContainer = $('#products');
    const productFilterInput = document.querySelector('.contain-products .filterName');
    const pagination = document.querySelector('.contain-products .pagination');

    if (productFilterInput) productFilterInput.style.display = '';
    if (pagination) pagination.style.display = '';

    if (!productsContainer.length) return;
    if (productsContainer.hasClass('owl-loaded')) {
        productsContainer.trigger('destroy.owl.carousel');
    }
    productsContainer.removeClass('owl-carousel owl-theme product-results-slider owl-loaded');
}

// Hàm window.onload cần được đánh dấu là async để có thể dùng await bên trong
window.onload = async function () {
    // Gọi và đợi hàm khoiTao (từ dungchung.js) hoàn tất việc tải dữ liệu
    await khoiTao();
    await loadBanners(); // Chỉ dùng API, không dùng addBanner thủ công nữa
    await loadTopProducts();
    // Sau khi khoiTao hoàn tất và window.list_products đã có dữ liệu từ API (hoặc localStorage)
    // thì mới tiếp tục thực hiện các hàm hiển thị của trang chủ.
    if (window.list_products && window.list_products.length > 0) {
        // autocomplete cho khung tìm kiếm
        autocomplete(document.getElementById('search-box'), window.list_products);

        var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
        for (var t of tags) addTags(t, "/?search=" + t);

        var sanPhamPhanTich;
        var sanPhamPhanTrang;

        var filters = getFilterFromURL();
        const homeFilterControls = document.getElementById('home-filter-controls');
        if (filters.length) {
            if (homeFilterControls) homeFilterControls.style.display = '';
            sanPhamPhanTich = phanTich_URL(filters, true);
            sanPhamPhanTrang = tinhToanPhanTrang(sanPhamPhanTich, filtersFromUrl.page || 1);
            if (!sanPhamPhanTrang.length) {
                alertNotHaveProduct(false);
            } else {
                addProductsFrom(sanPhamPhanTrang);
            }
            var productContainerElement = document.getElementsByClassName('contain-products')[0];
            if(productContainerElement) productContainerElement.style.display = '';
            initProductResultsSlider();
        } else {
            if (homeFilterControls) homeFilterControls.style.display = 'none';
            destroyProductResultsSlider();
            renderHomepageSections();
            loadInlineBanners();
        }

        // Thêm các lựa chọn filter vào dropdown
        addPricesRange(0, 2000000);
        addPricesRange(2000000, 4000000);
        addPricesRange(4000000, 7000000);
        addPricesRange(7000000, 13000000);
        addPricesRange(13000000, 0);

        addPromotion('giamgia');
        addPromotion('tragop');
        addPromotion('moiramat');
        addPromotion('giareonline');

        addStarFilter(3);
        addStarFilter(4);
        addStarFilter(5);

        addSortFilter('decrease', 'price', 'Giá giảm dần');
        addSortFilter('ascending', 'price', 'Giá tăng dần');
        addSortFilter('ascending', 'star', 'Sao tăng dần');
        addSortFilter('decrease', 'star', 'Sao giảm dần');
        addSortFilter('ascending', 'rateCount', 'Đánh giá tăng dần');
        addSortFilter('decrease', 'rateCount', 'Đánh giá giảm dần');
        addSortFilter('ascending', 'name', 'Tên A-Z');
        addSortFilter('decrease', 'name', 'Tên Z-A');

        addAllChoosedFilter();
        setupProductNavigationScrollState();
        restoreHomeScrollPosition();

    } else {
        console.error("Không có dữ liệu sản phẩm để hiển thị trên trang chủ.");
        let productContainer = document.getElementById('products');
        if (productContainer) {
            productContainer.innerHTML = `<div id="khongCoSanPham" style="display:block; opacity:1; margin: auto; width: auto; transition-duration: 0s;">
                                              <i class="fa fa-times-circle"></i>
                                              Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.
                                          </div>`;
        }
        let khungSanPhamContainer = document.getElementsByClassName('contain-khungSanPham')[0];
        if(khungSanPhamContainer) khungSanPhamContainer.innerHTML = '';
    }
};

var soLuongSanPhamMaxTrongMotTrang = 15;

var filtersFromUrl = { 
	company: '',
	search: '',
	price: '',
	promo: '',
	star: '',
	page: '',
	sort: {
		by: '',
		type: 'ascending'
	}
}

function getFilterFromURL() { 
	var fullLocation = window.location.href;
	fullLocation = decodeURIComponent(fullLocation);
	var dauHoi = fullLocation.split('?'); 

	if (dauHoi[1]) {
		var dauVa = dauHoi[1].split('&');
		return dauVa;
	}
	return [];
}

function phanTich_URL(filters, saveFilter) {
	var result = copyObject(window.list_products); 

	for (var i = 0; i < filters.length; i++) {
		var dauBang = filters[i].split('=');
        if (dauBang.length < 2) continue; // Bỏ qua nếu param không hợp lệ

		switch (dauBang[0]) {
			case 'search':
				dauBang[1] = dauBang[1].split('+').join(' ');
				result = timKiemTheoTen(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.search = dauBang[1];
				break;
			case 'price':
				if (saveFilter) filtersFromUrl.price = dauBang[1];
				var prices = dauBang[1].split('-');
                prices[0] = Number(prices[0]) || 0;
				prices[1] = Number(prices[1]) || Infinity; // Dùng Infinity cho không giới hạn
				result = timKiemTheoGiaTien(result, prices[0], prices[1]);
				break;
			case 'company':
				result = timKiemTheoCongTySanXuat(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.company = dauBang[1];
				break;
			case 'star':
                var starVal = parseInt(dauBang[1]) || 0;
				result = timKiemTheoSoLuongSao(result, starVal);
				if (saveFilter) filtersFromUrl.star = starVal.toString();
				break;
			case 'promo':
				result = timKiemTheoKhuyenMai(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.promo = dauBang[1];
				break;
			case 'page': 
				if (saveFilter) filtersFromUrl.page = parseInt(dauBang[1]) || 1;
				break;
			case 'sort':
				var s = dauBang[1].split('-');
                if (s.length < 1) continue;
				var tenThanhPhanCanSort = s[0];

				switch (tenThanhPhanCanSort) {
					case 'price':
						if (saveFilter) filtersFromUrl.sort.by = 'price';
						result.sort(function (a, b) {
							var giaA = parseInt(a.price.split('.').join(''));
							var giaB = parseInt(b.price.split('.').join(''));
							return giaA - giaB;
						});
						break;
					case 'star':
						if (saveFilter) filtersFromUrl.sort.by = 'star';
						result.sort(function (a, b) {
							return parseFloat(a.star) - parseFloat(b.star);
						});
						break;
					case 'rateCount':
						if (saveFilter) filtersFromUrl.sort.by = 'rateCount';
						result.sort(function (a, b) {
							return parseInt(a.rateCount) - parseInt(b.rateCount);
						});
						break;
					case 'name':
						if (saveFilter) filtersFromUrl.sort.by = 'name';
						result.sort(function (a, b) {
							return a.name.localeCompare(b.name);
						});
						break;
				}
				if (s[1] == 'decrease') {
					if (saveFilter) filtersFromUrl.sort.type = 'decrease';
					result.reverse();
				} else {
                    if (saveFilter) filtersFromUrl.sort.type = 'ascending'; // Mặc định
                }
				break;
		}
	}
	return result;
}

function addProductsFrom(list, vitri, soluong) {
	var start = vitri || 0;
	var end = (soluong ? start + soluong : list.length);
	for (var i = start; i < end; i++) {
		addProduct(list[i]); // addProduct này nằm ở dungchung.js
	}
}

function clearAllProducts() {
    var productsUl = document.getElementById('products');
	if(productsUl) productsUl.innerHTML = "";
}

function getStoredViewedProducts() {
    try {
        const ids = JSON.parse(localStorage.getItem(HOME_RECENTLY_VIEWED_KEY)) || [];
        if (!Array.isArray(ids)) return [];
        return ids;
    } catch (error) {
        console.error('Không đọc được danh sách sản phẩm đã xem:', error);
        return [];
    }
}

function getProductPriceValue(product) {
    if (!product) return Number.MAX_SAFE_INTEGER;
    const onlinePromoPrice = product.promo && product.promo.name && product.promo.name.toLowerCase() === 'giareonline'
        ? stringToNum(product.promo.value || '0')
        : null;
    return onlinePromoPrice && onlinePromoPrice > 0 ? onlinePromoPrice : stringToNum(product.price || '0');
}

function normalizeProductList(list) {
    return Array.isArray(list) ? list.filter(Boolean) : [];
}

function pickProducts(list, limit) {
    return normalizeProductList(list).slice(0, limit || HOMEPAGE_VISIBLE_PRODUCTS);
}

function getViewedProducts() {
    const ids = getStoredViewedProducts();
    const result = [];
    ids.forEach(id => {
        const product = timKiemTheoMa(window.list_products, id);
        if (product) result.push(product);
    });
    return result;
}

function clearViewedProducts() {
    localStorage.removeItem(HOME_RECENTLY_VIEWED_KEY);
    renderHomepageSections();
}

function removeViewedProduct(masp) {
    if (!masp) return;
    const ids = getStoredViewedProducts().filter(id => id !== masp);
    localStorage.setItem(HOME_RECENTLY_VIEWED_KEY, JSON.stringify(ids));
    renderHomepageSections();
}

function getPromoProducts() {
    const source = normalizeProductList(window.list_products);
    return source
        .filter(p => p.quantity > 0 && p.promo && p.promo.name && ['giareonline', 'giamgia', 'tragop'].includes(p.promo.name.toLowerCase()))
        .sort((a, b) => getProductPriceValue(a) - getProductPriceValue(b));
}

function getSuggestedProducts() {
    const source = normalizeProductList(window.list_products);
    return source
        .filter(p => Number(p.quantity) > 0)
        .sort((a, b) => {
            const starDiff = (Number(b.star) || 0) - (Number(a.star) || 0);
            if (starDiff !== 0) return starDiff;
            return (Number(b.rateCount) || 0) - (Number(a.rateCount) || 0);
        });
}

function getNewArrivalProducts() {
    const source = normalizeProductList(window.list_products);
    const featured = source.filter(p => p.promo && p.promo.name && p.promo.name.toLowerCase() === 'moiramat');
    if (featured.length) return featured;
    return source.slice().reverse();
}

function renderSmallViewedItem(product) {
    const priceValue = getProductPriceValue(product);
    return `
        <a class="viewed-product-item" href="/chitietsanpham?masp=${product.masp}">
            <button class="viewed-remove-btn" type="button" onclick="event.preventDefault(); event.stopPropagation(); removeViewedProduct('${product.masp}')">
                <i class="fa fa-times"></i>
            </button>
            <div class="viewed-thumb">
                <img src="${product.img}" alt="${product.name}">
            </div>
            <div class="viewed-info">
                <h4>${product.name}</h4>
                <strong>${numToString(priceValue)}₫</strong>
            </div>
        </a>
    `;
}

function renderProductGridSection(options) {
    const title = options.title || '';
    const products = pickProducts(options.products, options.limit);
    if (!products.length) return '';

    const pills = Array.isArray(options.pills) && options.pills.length
        ? `<div class="homepage-section-pills">${options.pills.map(pill => `<a href="${pill.href}">${pill.label}</a>`).join('')}</div>`
        : '';

    const cta = options.ctaHref
        ? `<a class="homepage-section-cta" href="${options.ctaHref}">${options.ctaLabel || 'Xem thêm'} <i class="fa fa-angle-right"></i></a>`
        : '';

    return `
        <div class="homepage-section-card">
            <div class="homepage-section-header">
                <div>
                    <h2>${title}</h2>
                    ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
                </div>
                ${cta}
            </div>
            ${pills}
            <ul class="homeproduct homepage-product-grid">
                ${products.map(product => addProduct(product, null, true)).join('')}
            </ul>
        </div>
    `;
}

function renderInlineBanners() {
    return `
        <div class="homepage-inline-banners" id="inline-banners"></div>
    `;
}

async function loadInlineBanners() {
    const container = document.getElementById('inline-banners');
    if (!container) return;
    try {
        const response = await fetch('/api/banners?type=inline');
        if (!response.ok) {
            container.style.display = 'none';
            return;
        }
        const banners = await response.json();
        const activeBanners = Array.isArray(banners)
            ? banners.filter(b => b.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            : [];
        if (!activeBanners.length) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';
        container.innerHTML = activeBanners.map(banner => `
            <a href="${banner.link_url || '#'}" class="inline-banner-card inline-banner-warm" ${banner.link_url ? 'target="_blank"' : ''}>
                <img src="${banner.image_url}" alt="${banner.alt_text || 'Banner'}">
            </a>
        `).join('');
    } catch (error) {
        container.style.display = 'none';
        console.error("Lỗi khi tải inline banners:", error);
    }
}

function renderHomepageSections() {
    const container = document.getElementById('homepage-sections') || document.getElementsByClassName('contain-khungSanPham')[0];
    if (!container) return;

    const viewedProducts = getViewedProducts();
    const shouldUseViewedSlider = viewedProducts.length > 5;
    const promoProducts = pickProducts(getPromoProducts(), HOMEPAGE_VISIBLE_PRODUCTS);
    const suggestedProducts = pickProducts(getSuggestedProducts(), 10);
    const newArrivalProducts = pickProducts(getNewArrivalProducts(), 10);

    const brandPills = [
        { label: 'Điện thoại', href: '/?search=Dien+Thoai' },
        { label: 'Apple', href: '/?search=iPhone' },
        { label: 'Samsung', href: '/?search=Samsung' },
        { label: 'Xiaomi', href: '/?search=Xiaomi' },
        { label: 'Laptop', href: '/?search=Laptop' },
        { label: 'Phụ kiện', href: '/?search=Phu+kien' }
    ];

    const promoPills = [
        { label: 'Flash sale', href: '/?promo=giamgia' },
        { label: 'Giảm đến 50%', href: '/?promo=giareonline' },
        { label: 'Online giá rẻ', href: '/?promo=giareonline' },
        { label: 'Trả góp', href: '/?promo=tragop' }
    ];

    const viewedHtml = viewedProducts.length
        ? `
            <div class="recently-viewed-strip">
                <div class="homepage-section-header">
                    <div>
                        <h2>Sản phẩm đã xem</h2>
                        <p>Quay lại nhanh các sản phẩm bạn vừa xem gần đây.</p>
                    </div>
                    <button class="homepage-clear-button" type="button" onclick="clearViewedProducts()">
                        <i class="fa fa-trash-o"></i> Xóa đã xem
                    </button>
                </div>
                <div class="viewed-products-row${shouldUseViewedSlider ? ' owl-carousel owl-theme viewed-products-slider' : ''}">
                    ${viewedProducts.map(renderSmallViewedItem).join('')}
                </div>
            </div>
        `
        : '';

    container.innerHTML = `
        ${viewedHtml}
        ${renderProductGridSection({
            title: 'Khuyến mãi online',
            subtitle: 'Chọn nhanh deal nổi bật đang có giá tốt trên cửa hàng.',
            products: promoProducts,
            ctaHref: '/?promo=giareonline',
            ctaLabel: 'Xem thêm ưu đãi',
            pills: promoPills
        })}
        ${renderInlineBanners()}
        ${renderProductGridSection({
            title: 'Gợi ý cho bạn',
            subtitle: 'Những sản phẩm được xem nhiều, đánh giá tốt và còn hàng.',
            products: suggestedProducts,
            ctaHref: '/?sort=rateCount-decrease',
            ctaLabel: 'Xem thêm 12 sản phẩm'
        })}
        ${renderProductGridSection({
            title: 'Mua online - Hàng chuẩn, giá mê',
            subtitle: 'Danh mục nổi bật được gom lại để bạn duyệt nhanh giống trang chủ siêu thị điện máy.',
            products: newArrivalProducts,
            ctaHref: '/?promo=moiramat',
            ctaLabel: 'Xem thêm hàng mới',
            pills: brandPills
        })}
    `;

    if (shouldUseViewedSlider) {
        const viewedSlider = $('.viewed-products-slider');
        if (viewedSlider.length) {
            viewedSlider.owlCarousel({
                loop: viewedProducts.length > 5,
                margin: 10,
                nav: true,
                dots: false,
                autoplay: false,
                responsive: {
                    0: { items: 1.1 },
                    520: { items: 2.1 },
                    768: { items: 3.1 },
                    992: { items: 4.1 },
                    1200: { items: 5 }
                }
            });
        }
    }
}

function addKhungSanPham(tenKhung, color, filter, len, ele) {
    if (!ele) return; // Kiểm tra xem ele có tồn tại không
    // convert color to code
    var gradient = `background-image: linear-gradient(120deg, ${color[0]} 0%, ${color[1]} 50%, ${color[0]} 100%);`;
    var borderColor = `border-color: ${color[0]};`;
    var borderA = `border-left: 2px solid ${color[0]}; border-right: 2px solid ${color[0]};`;

    // mở tag
    var s = `<div class='khungSanPham' style='${borderColor}'>
                <h3 class='tenKhung' style='${gradient}'>* ${tenKhung} *</h3>
                <div class='listSpTrongKhung flexContain'>`;

    var spResult = phanTich_URL(filter, false);
    if (spResult.length < len) len = spResult.length;

    for (var i = 0; i < len; i++) {
        s += addProduct(spResult[i], null, true); // addProduct này nằm ở dungchung.js, true để trả về chuỗi
    }

    // Thẻ <a> này sẽ có href dạng "/?filterKey=filterValue"
    s += `    </div>
              <a class='xemTatCa' href='${createLinkFilter('addMultiple', filter)}' style='${borderA}'> 
                Xem tất cả ${spResult.length} sản phẩm
              </a>
            </div> 
            <hr>`; 
    ele.innerHTML += s;
}

function themNutPhanTrang(soTrang, trangHienTai) {
	var divPhanTrang = document.getElementsByClassName('pagination')[0];
    if (!divPhanTrang) return;
	divPhanTrang.innerHTML = ""; 

	var k = createLinkFilter('remove', 'page'); 
    // Không cần thêm '&' hay '?' ở đây nữa vì createLinkFilter sẽ xử lý

	if (trangHienTai > 1) 
		divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${trangHienTai - 1}"><i class="fa fa-angle-left"></i></a>`;

	if (soTrang > 1) 
		for (var i = 1; i <= soTrang; i++) {
			if (i == trangHienTai) {
				divPhanTrang.innerHTML += `<a href="javascript:;" class="current">${i}</a>`
			} else {
				divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${i}">${i}</a>`
			}
		}

	if (trangHienTai < soTrang) { 
		divPhanTrang.innerHTML += `<a href="${k}${k.includes('?') ? '&' : '?'}page=${trangHienTai + 1}"><i class="fa fa-angle-right"></i></a>`
	}
}

function tinhToanPhanTrang(list, vitriTrang) {
    if (!list) return [];
	var sanPhamDu = list.length % soLuongSanPhamMaxTrongMotTrang;
	var soTrang = parseInt(list.length / soLuongSanPhamMaxTrongMotTrang) + (sanPhamDu ? 1 : 0);
	var trangHienTai = parseInt(vitriTrang);

    if (isNaN(trangHienTai) || trangHienTai < 1) trangHienTai = 1;
    if (trangHienTai > soTrang && soTrang > 0) trangHienTai = soTrang;
    else if (soTrang === 0) trangHienTai = 0;


	themNutPhanTrang(soTrang, trangHienTai);
    if(trangHienTai === 0 || list.length === 0) return []; 

	var start = soLuongSanPhamMaxTrongMotTrang * (trangHienTai - 1);
	var temp = copyObject(list);
	return temp.splice(start, soLuongSanPhamMaxTrongMotTrang);
}

function timKiemTheoCongTySanXuat(list, tenCongTy) {
	var result = [];
	for (var i = 0; i < list.length; i++) {
		if (list[i].company.toUpperCase().includes(tenCongTy.toUpperCase())) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoSoLuongSao(list, soLuongSaoToiThieu) {
	var result = [];
    soLuongSaoToiThieu = parseFloat(soLuongSaoToiThieu);
	for (var i = 0; i < list.length; i++) {
		if (parseFloat(list[i].star) >= soLuongSaoToiThieu) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoGiaTien(list, giaMin, giaMax) {
	var result = [];
    giaMin = Number(giaMin);
    giaMax = Number(giaMax);
	for (var i = 0; i < list.length; i++) {
		var gia = parseInt(list[i].price.split('.').join(''));
		if (gia >= giaMin && gia <= giaMax) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoKhuyenMai(list, tenKhuyenMai) {
	var result = [];
	for (var i = 0; i < list.length; i++) {
		if (list[i].promo.name == tenKhuyenMai) {
			result.push(list[i]);
		}
	}
	return result;
}

function timKiemTheoRAM(list, luongRam) {
	var result = [];
    luongRam = parseInt(luongRam);
	for (var i = 0; i < list.length; i++) {
		if (list[i].detail && list[i].detail.ram && parseInt(list[i].detail.ram) == luongRam) {
			result.push(list[i]);
		}
	}
	return result;
}

function addChoosedFilter(type, textInside) {
	var link = createLinkFilter('remove', type);
	var tag_a = `<a href="${link}"><h3>${textInside} <i class="fa fa-close"></i> </h3></a>`;

	var divChoosedFilter = document.getElementsByClassName('choosedFilter')[0];
    if(divChoosedFilter) divChoosedFilter.innerHTML += tag_a;

	var deleteAll = document.getElementById('deleteAllFilter');
    if(deleteAll) {
        deleteAll.style.display = "block";
        deleteAll.href = "/"; // Link xóa tất cả trỏ về trang gốc không có filter
    }
}

function addAllChoosedFilter() {
	if (filtersFromUrl.company)
		addChoosedFilter('company', filtersFromUrl.company);
	if (filtersFromUrl.search)
		addChoosedFilter('search', `"${filtersFromUrl.search}"`);
	if (filtersFromUrl.price) {
		var prices = filtersFromUrl.price.split('-');
		addChoosedFilter('price', priceToString(prices[0], prices[1]));
	}
	if (filtersFromUrl.promo)
		addChoosedFilter('promo', promoToString(filtersFromUrl.promo));
	if (filtersFromUrl.star)
		addChoosedFilter('star', starToString(filtersFromUrl.star));
	if (filtersFromUrl.sort.by) {
		var sortBy = sortToString(filtersFromUrl.sort.by);
		var kieuSapXep = (filtersFromUrl.sort.type == 'decrease' ? 'giảm dần' : 'tăng dần');
		addChoosedFilter('sort', `${sortBy} ${kieuSapXep}`);
	}
}

function createLinkFilter(type, nameFilter, valueAdd) {
    var o = copyObject(filtersFromUrl);
    o.page = ''; // Reset phân trang khi thay đổi filter

    if (type === 'addMultiple' && Array.isArray(nameFilter)) { // Xử lý cho addKhungSanPham
        nameFilter.forEach(filterPair => {
            const [key, value] = filterPair.split('=');
            if (key === 'sort') {
                const [sortBy, sortType] = value.split('-');
                o.sort.by = sortBy;
                o.sort.type = sortType || 'ascending';
            } else {
                o[key] = value;
            }
        });
    } else if (nameFilter == 'sort') {
        if (type == 'add') {
            if (valueAdd && typeof valueAdd.by !== 'undefined' && typeof valueAdd.type !== 'undefined') {
                o.sort.by = valueAdd.by;
                o.sort.type = valueAdd.type;
            }
        } else if (type == 'remove') {
            o.sort.by = '';
            o.sort.type = 'ascending'; // Reset về mặc định
        }
    } else {
        if (type == 'add') {
            o[nameFilter] = valueAdd;
        } else if (type == 'remove') {
            o[nameFilter] = '';
        }
    }

    var link = '/'; // Luôn bắt đầu từ root path
    var params = [];

    for (var key in o) {
        if (key !== 'sort' && key !== 'page' && o[key]) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(o[key]));
        }
    }

    if (o.sort.by) {
        params.push('sort=' + encodeURIComponent(o.sort.by + '-' + o.sort.type));
    }
    
    // Không thêm 'page' vào đây, nó sẽ được thêm riêng bởi hàm themNutPhanTrang nếu cần

    if (params.length > 0) {
        link += '?' + params.join('&');
    }

    return link;
}


function alertNotHaveProduct(coSanPham) {
	var thongbao = document.getElementById('khongCoSanPham');
    if (!thongbao) return;
	if (!coSanPham) {
		thongbao.style.display = "block"; // Hiện thông báo
		thongbao.style.width = "auto";
		thongbao.style.opacity = "1";
		thongbao.style.margin = "auto"; 
		thongbao.style.transitionDuration = "1s"; 
	} else {
		thongbao.style.display = "none"; // Ẩn thông báo
		thongbao.style.opacity = "0";
		thongbao.style.transitionDuration = "0s"; 
	}
}

function showLi(li) {
    if(li && typeof li.style !== 'undefined') {
        li.style.opacity = 1;
        li.style.width = ""; // Để CSS quản lý width, hoặc đặt giá trị cụ thể nếu cần
        li.style.borderWidth = ""; // Để CSS quản lý
        li.style.display = ""; // Hiện lại li
    }
}
function hideLi(li) {
    if(li && typeof li.style !== 'undefined') {
        li.style.width = "0"; // Thu nhỏ
        li.style.opacity = 0;
        li.style.borderWidth = "0";
        li.style.display = "none"; // Ẩn li khỏi layout
    }
}

function getLiArray() {
	var ul = document.getElementById('products');
    if (!ul) return [];
	return Array.from(ul.getElementsByTagName('li')); // Chuyển HTMLCollection thành Array
}

function getNameFromLi(li) {
    if (!li) return "";
	var a = li.getElementsByTagName('a')[0];
    if (!a) return "";
	var h3 = a.getElementsByTagName('h3')[0];
    if (!h3) return "";
	return h3.innerHTML;
}

function filterProductsName(ele) {
    if (!ele) return;
	var filter = ele.value.toUpperCase();
	var listLi = getLiArray();
	var coSanPham = false;
	var soLuongHienThi = 0;

	listLi.forEach(function(li) {
		if (getNameFromLi(li).toUpperCase().includes(filter)) {
            if (soLuongHienThi < soLuongSanPhamMaxTrongMotTrang) {
			    showLi(li);
			    coSanPham = true;
                soLuongHienThi++;
            } else {
                hideLi(li); 
            }
		} else {
			hideLi(li);
		}
	});
	alertNotHaveProduct(coSanPham);
}

function getStarFromLi(li) {
    if (!li) return 0;
	var a = li.getElementsByTagName('a')[0];
	if (!a) return 0;
	var divRate = a.getElementsByClassName('ratingresult');
	if (!divRate || divRate.length === 0) return 0; 
	var starCount = divRate[0].getElementsByClassName('fa-star').length;
	return starCount;
}

function filterProductsStar(num) { // Hàm này có vẻ không được gọi, nếu dùng cần test
	var listLi = getLiArray();
	var coSanPham = false;
    num = parseFloat(num);

	listLi.forEach(function(li) {
		if (getStarFromLi(li) >= num) {
			showLi(li);
			coSanPham = true;
		} else {
			hideLi(li);
		}
	});
	alertNotHaveProduct(coSanPham);
}

function addBanner(img, link) {
    var newDiv = `<div class='item'><a target='_blank' href='${link}'><img src='${img}'></a></div>`;
    var bannerContainer = document.querySelector('.owl-carousel'); // Sửa lại selector cho đúng
    if (bannerContainer) bannerContainer.innerHTML += newDiv;
}

// Thêm hàm mới này để tải banner từ API
async function loadBanners() {
    try {
        const response = await fetch('/api/banners?type=hero');
        if (!response.ok) {
            console.error("Lỗi khi tải banner: " + response.status);
            return;
        }
        const banners = await response.json();
        
        // Sử dụng jQuery selector vì bạn đang dùng Owl Carousel (plugin của jQuery)
        const owlContainer = $('.owl-carousel');

        // Xóa các banner cũ và hủy instance carousel hiện tại để tạo lại
        owlContainer.trigger('destroy.owl.carousel').empty(); 

        // Lọc ra các banner đang được kích hoạt và sắp xếp theo display_order
        const activeBanners = banners
            .filter(b => b.is_active)
            .sort((a, b) => a.display_order - b.display_order);

        if (activeBanners.length > 0) {
            activeBanners.forEach(banner => {
                const bannerHTML = `
                    <div class='item'>
                        <a href='${banner.link_url || '#'}' target='_blank'>
                            <img src='${banner.image_url}' alt='${banner.alt_text || 'Banner'}'>
                        </a>
                    </div>`;
                owlContainer.append(bannerHTML); // Thêm banner vào container
            });
        } else {
            // Hiển thị một banner mặc định nếu không có banner nào trong CSDL
            const defaultBanner = `<div class='item'><img src='/static/img/banners/banner0.gif'></div>`;
            owlContainer.append(defaultBanner);
        }

        // ----> PHẦN QUAN TRỌNG: KHỞI TẠO LẠI OWL CAROUSEL <----
        // Mã này chỉ chạy sau khi các banner đã được thêm vào HTML
        owlContainer.owlCarousel({
            items: 1.5,
            margin: 100,
            center: true,
            loop: activeBanners.length > 1, // Chỉ lặp (loop) khi có nhiều hơn 1 banner
            smartSpeed: 450,
            autoplay: true,
            autoplayTimeout: 3500,
            nav: false, // Tắt nút điều hướng mặc định nếu muốn
            dots: true  // Bật dấu chấm điều hướng
        });

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi tải và hiển thị banners:", error);
    }
}

function addCompany(img, nameCompany) {
	var link = createLinkFilter('add', 'company', nameCompany);
	var new_tag = `<a href="${link}"><img src="${img}"></a>`;
	var companyMenu = document.getElementsByClassName('companyMenu')[0];
    if(companyMenu) companyMenu.innerHTML += new_tag;
}

function addPricesRange(min, max) {
	var text = priceToString(min, max);
	var link = createLinkFilter('add', 'price', `${min}-${max === Infinity ? 0 : max}`); // 0 cho max không giới hạn
	var mucgia = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.pricesRangeFilter .dropdown-content');
    if (dropdownContent) dropdownContent.innerHTML += mucgia;
}

function addPromotion(name) {
	var link = createLinkFilter('add', 'promo', name);
	var text = promoToString(name);
	var promo = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.promosFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += promo;
}

function addStarFilter(value) {
	var link = createLinkFilter('add', 'star', value);
	var text = starToString(value);
	var star = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.starFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += star;
}

function addSortFilter(type, nameFilter, text) {
	var link = createLinkFilter('add', 'sort', { by: nameFilter, type: type });
	var sortTag = `<a href="${link}">${text}</a>`;
    var dropdownContent = document.querySelector('.sortFilter .dropdown-content');
	if (dropdownContent) dropdownContent.innerHTML += sortTag;
}

function priceToString(min, max) {
	min = Number(min); 
    max = Number(max);
    if (min === 0 && (max === 0 || max === Infinity)) return 'Tất cả mức giá';
	if (min === 0) return 'Dưới ' + (max / 1E6).toLocaleString('vi-VN') + ' triệu';
	if (max === 0 || max === Infinity) return 'Trên ' + (min / 1E6).toLocaleString('vi-VN') + ' triệu';
	return 'Từ ' + (min / 1E6).toLocaleString('vi-VN') + ' - ' + (max / 1E6).toLocaleString('vi-VN') + ' triệu';
}

function promoToString(name) {
	switch (name) {
		case 'tragop': return 'Trả góp';
		case 'giamgia': return 'Giảm giá';
		case 'giareonline': return 'Giá rẻ online';
		case 'moiramat': return 'Mới ra mắt';
	}
	return name; 
}

function starToString(star) {
	star = Number(star); 
	if (star === 0) return "Tất cả đánh giá"; 
    if (star === 5) return "5 sao";
	return `Từ ${star} sao`; 
}

function sortToString(sortBy) {
	switch (sortBy) {
		case 'price': return 'Giá ';
		case 'star': return 'Sao ';
		case 'rateCount': return 'Đánh giá ';
		case 'name': return 'Tên ';
		default: return '';
	}
}

function hideSanPhamKhongThuoc(list) { // Hàm này có vẻ không được dùng và có thể không cần thiết
	var allLi = getLiArray();
	allLi.forEach(function(li) {
		var hide = true;
		for (var j = 0; j < list.length; j++) {
			if (getNameFromLi(li) == list[j].name) {
				hide = false;
				break;
			}
		}
		if (hide) hideLi(li);
	});
}
async function loadTopProducts() {
    try {
        const response = await fetch('/api/top-products');
        if (!response.ok) return;
        const topProducts = await response.json();
        const container = document.getElementById('top-products-container');
        if (!container) return;

        if (topProducts.length === 0) {
            container.innerHTML = '';
            return;
        }

        let html = `
        <div class="khungSanPham top-products-section">
            <h3 class="tenKhung top-products-title">
                <i class="fa fa-trophy"></i> SẢN PHẨM BÁN CHẠY
            </h3>
            <div class="top-products-slider owl-carousel owl-theme" id="top-products-carousel">`;

        topProducts.forEach((sp, idx) => {
            let imgSrc = sp.img && !sp.img.startsWith('http') ? `/static/img/products/${sp.img}` : sp.img;
            let priceNum = Number(String(sp.price).replace(/\D/g, ''));
            let detailLink = `/chitietsanpham?masp=${sp.masp}`;

            html += `
                <div class="item">
                    <a href="${detailLink}" class="top-product-card-modern">
                        <div class="rank-badge rank-${idx+1}">#${idx+1}</div>
                        <div class="img-wrap">
                            <img src="${imgSrc}" alt="${sp.name}">
                        </div>
                        <div class="info">
                            <h4 title="${sp.name}">${sp.name}</h4>
                            <div class="sold-count">Đã bán: <b>${sp.total_sold}</b></div>
                            <div class="price">${priceNum.toLocaleString('vi-VN')}₫</div>
                        </div>
                    </a>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;

        // Kích hoạt slider
        setTimeout(() => {
            $('#top-products-carousel').owlCarousel({
                loop: false, // Tắt vòng lặp để giữ đúng thứ tự #1 #2 #3...
                margin: 15,
                nav: true,
                dots: false,
                autoplay: false, // Tắt tự động chạy để người dùng tự xem rank
                responsive: {
                    0: { items: 2 },
                    600: { items: 3 },
                    1000: { items: 5 }
                }
            });
        }, 100);

    } catch (e) {
        console.error('Lỗi khi tải top sản phẩm:', e);
    }
}
