// Глобальні змінні
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('metaworks_sheet_metal_cart')) || [];
let currentUser = null;

// DOM елементи
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noProducts = document.getElementById('noProducts');
const resultsCount = document.getElementById('resultsCount');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartOverlay = document.getElementById('cartOverlay');
const toast = document.getElementById('toast');

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ініціалізація каталогу...');
    initializeAuth();
    loadProducts();
    setupEventListeners();
    updateCartUI();
});

// Налаштування обробників подій
function setupEventListeners() {
    // Пошук
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchProducts);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
        
        // Пошук при введенні (з затримкою)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchProducts, 500);
        });
    }

    // Фільтри
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Сортування
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortProducts);
    }

    // Кошик
    const cartIcon = document.getElementById('cartIcon');
    const cartClose = document.getElementById('cartClose');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    const continueShopping = document.getElementById('continueShopping');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', closeCart);
    }

    if (continueShopping) {
        continueShopping.addEventListener('click', closeCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }

    // Аутентифікація
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (userInfo) {
        userInfo.addEventListener('click', toggleUserMenu);
    }

    // Фільтри - автоматичне застосування при зміні
    const filterCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    const priceInputs = document.querySelectorAll('.price-range input');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    priceInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(applyFilters, 800);
        });
    });

    // Розгортання/згортання фільтрів
    const filterHeaders = document.querySelectorAll('.filter-header');
    filterHeaders.forEach(header => {
        header.addEventListener('click', toggleFilter);
    });
}

// Ініціалізація аутентифікації
function initializeAuth() {
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(user => {
            currentUser = user;
            updateUserUI(user);
            console.log('Стан користувача:', user ? 'Увійшов' : 'Не увійшов');
        });
    }
}

// Оновлення UI користувача
function updateUserUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

// Завантаження товарів з Firebase
async function loadProducts() {
    console.log('Завантаження товарів з Firebase...');
    try {
        showLoading(true);
        
        if (typeof db === 'undefined') {
            console.error('Firebase не ініціалізовано');
            showError('Помилка підключення до бази даних');
            return;
        }

        const snapshot = await db.collection('sheet_metal').orderBy('thickness').get();
        allProducts = [];
        
        if (snapshot.empty) {
            console.log('Колекція rebar порожня або не існує');
            showNoProducts();
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            allProducts.push({
            id: doc.id,
            name: data.name || `Лист ${data.thickness}×${data.width}×${data.length}мм`,
            thickness: data.thickness || 0,
            width: data.width || 1000,
            length: data.length || 2000,
            type: data.type || 'cold_rolled', // холоднокатаний, гарячекатаний
            steelGrade: data.steelGrade || '08kp',
            price: data.price || 0,
            weight: data.weight || null,
            minOrder: data.minOrder || 1,
            inStock: data.inStock !== false,
            image: data.image || '/img/sheet-metal/sheet-metal.jpg',
            description: data.description || '',
            badge: data.badge || null,
            category: 'sheet_metal',
            ...data // Додаємо інші поля, якщо є
            });
        });
        
        console.log(`Завантажено ${allProducts.length} товарів`);
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
        updateResultsCount(filteredProducts.length);
        showLoading(false);
        
    } catch (error) {
        console.error('Помилка завантаження товарів:', error);
        showError('Помилка завантаження товарів. Перевірте підключення до інтернету.');
        showLoading(false);
    }
}

// Відображення товарів
function displayProducts(products) {
    if (!products || products.length === 0) {
        showNoProducts();
        return;
    }

    if (productsGrid) {
        productsGrid.style.display = 'grid';
        productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
    }
    
    if (noProducts) {
        noProducts.style.display = 'none';
    }
}

// Створення картки товару
function createProductCard(product) {
    const isOutOfStock = !product.inStock;
    const badgeHtml = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
    
    return `
        <div class="product-card" data-id="${product.id}">
            ${badgeHtml}
            <div class="product-image-container">
                <img src="${product.image || '/img/sheet-metal/sheet-metal.jpg'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='/img/sheet-metal/sheet-metal.jpg'">
                <div class="quick-view" onclick="quickView('${product.id}')">
                    <i class="fas fa-eye"></i> Швидкий перегляд
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">Лист ${product.thickness}мм</div>
                <h4 class="product-title">${product.name}</h4>
                <div class="product-specs">
                    <div><strong>Товщина:</strong> ${product.thickness}мм</div>
                    <div><strong>Розміри:</strong> ${product.width}×${product.length}мм</div>
                    <div><strong>Тип:</strong> ${product.type === 'cold_rolled' ? 'Холоднокатаний' : 'Гарячекатаний'}</div>
                    <div><strong>Марка сталі:</strong> ${product.steelGrade}</div>
                    ${product.weight ? `<div><strong>Вага:</strong> ${product.weight} кг</div>` : ''}
                </div>
                <div class="product-price">
                    ₴${product.price.toFixed(2)} за лист
                    ${product.minOrder ? `<div style="font-size: 12px; color: #666;">Мін. замовлення: ${product.minOrder} шт</div>` : ''}
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}" 
                            onclick="addToCart('${product.id}')" 
                            ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> 
                        ${isOutOfStock ? 'Немає в наявності' : 'Додати в кошик'}
                    </button>
                    <button class="quick-view-btn" onclick="quickView('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Додавання товару в кошик
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.inStock) {
        showToast('Товар недоступний для замовлення', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    const quantity = product.minOrder || 1;
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image || '/img/sheet-metal/sheet-metal.jpg',
            thickness: product.thickness,
            width: product.width,
            length: product.length,
            type: product.type,
            steelGrade: product.steelGrade,
            weight: product.weight,
            minOrder: product.minOrder || 1,
            quantity: quantity
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.name} додано до кошика!`, 'success');
    
    // Анімація для кнопки
    const btn = document.querySelector(`[onclick="addToCart('${productId}')"]`);
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }
}

// Збереження кошика в localStorage
function saveCart() {
    localStorage.setItem('metaworks_sheet_metal_cart', JSON.stringify(cart));
}

// Оновлення UI кошика
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    const cartCountBadge = document.getElementById('cartCountBadge');
    
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    if (cartCountBadge) {
        cartCountBadge.textContent = totalItems;
    }
    
    updateCartModal();
}

// Оновлення модального вікна кошика
function updateCartModal() {
    const cartBody = document.getElementById('cartBody');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    
    if (!cartBody || !cartEmpty || !cartFooter) return;
    
    if (cart.length === 0) {
        cartBody.style.display = 'none';
        cartFooter.style.display = 'none';
        cartEmpty.style.display = 'flex';
        return;
    }
    
    cartBody.style.display = 'block';
    cartFooter.style.display = 'block';
    cartEmpty.style.display = 'none';
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 1000 ? 0 : 200; // Безкоштовна доставка від 1000 грн
    const total = subtotal + shipping;
    
    // Формування HTML для товарів у кошику
    const cartItemsHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='/img/sheet-metal/sheet-metal.jpg'">
        </div>
        <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">₴${item.price.toFixed(2)} за лист</div>
            <div class="cart-item-specs">${item.thickness}мм, ${item.width}×${item.length}мм</div>
            <div class="cart-item-type">${item.type === 'cold_rolled' ? 'Холоднокатаний' : 'Гарячекатаний'}</div>
            ${item.weight ? `<div class="cart-item-weight">Вага: ${(item.weight * item.quantity).toFixed(2)} кг</div>` : ''}
        </div>
        <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="changeQuantity('${item.id}', -${item.minOrder || 1})">
                <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" 
                   value="${item.quantity}" 
                   min="${item.minOrder || 1}" 
                   step="${item.minOrder || 1}"
                   onchange="updateQuantity('${item.id}', this.value)">
            <button class="quantity-btn" onclick="changeQuantity('${item.id}', ${item.minOrder || 1})">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <div class="cart-item-total">
            ₴${(item.price * item.quantity).toFixed(2)}
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
            <i class="fas fa-trash-alt"></i>
        </button>
    </div>
`).join('');
    
    cartBody.innerHTML = `
        <div class="cart-summary-top">
            <div class="cart-items-count">Товарів у кошику: ${cart.length}</div>
            <div class="cart-total-weight">
                ${cart.some(item => item.weight) ? 
                  `Загальна вага: ${cart.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0).toFixed(2)} кг` : ''}
            </div>
        </div>
        ${cartItemsHTML}
    `;
    
    // Оновлення підсумків
    const subtotalElement = document.getElementById('subtotal');
    const finalTotalElement = document.getElementById('finalTotal');
    
    if (subtotalElement) subtotalElement.textContent = `₴${subtotal.toFixed(2)}`;
    if (finalTotalElement) finalTotalElement.textContent = `₴${total.toFixed(2)}`;
    
    // Оновлення інформації про доставку
    const shippingElement = document.querySelector('.cart-footer .summary-row:nth-child(2) span:last-child');
    if (shippingElement) {
        shippingElement.textContent = shipping === 0 ? 'Безкоштовно' : `₴${shipping.toFixed(2)}`;
    }
}

// Зміна кількості товару
function changeQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    const minQuantity = item.minOrder || 1;
    
    if (newQuantity < minQuantity) {
        if (confirm(`Мінімальне замовлення ${minQuantity}м. Видалити товар з кошика?`)) {
            removeFromCart(productId);
        }
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

// Оновлення кількості товару
function updateQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    const item = cart.find(item => item.id === productId);
    
    if (!item) return;
    
    const minQuantity = item.minOrder || 1;
    
    if (quantity < minQuantity) {
        showToast(`Мінімальне замовлення: ${minQuantity}м`, 'warning');
        // Повертаємо попереднє значення
        const input = document.querySelector(`input[onchange*="${productId}"]`);
        if (input) input.value = item.quantity;
        return;
    }
    
    item.quantity = quantity;
    saveCart();
    updateCartUI();
}

// Видалення товару з кошика
function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    const itemName = item ? item.name : 'Товар';
    
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast(`${itemName} видалено з кошика`, 'info');
}



// Сортування товарів
function sortProducts() {
    const sortValue = document.getElementById('sortSelect')?.value || 'default';
    console.log('Сортування:', sortValue);
    
    switch (sortValue) {
        case 'thickness-asc':
            filteredProducts.sort((a, b) => a.thickness - b.thickness);
            break;
        case 'thickness-desc':
            filteredProducts.sort((a, b) => b.thickness - a.thickness);
            break;
        case 'size-asc':
            filteredProducts.sort((a, b) => (a.width * a.length) - (b.width * b.length));
            break;
        case 'size-desc':
            filteredProducts.sort((a, b) => (b.width * b.length) - (a.width * a.length));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name, 'uk'));
            break;
        default:
            // Сортування за замовчуванням (за товщиною)
            filteredProducts.sort((a, b) => a.thickness - b.thickness);
    }
    
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

// Пошук товарів
function searchProducts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    console.log('Пошук:', searchTerm);
    
    if (!searchTerm) {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            product.type.toLowerCase().includes(searchTerm) ||
            product.steelGrade.toLowerCase().includes(searchTerm) ||
            product.thickness.toString().includes(searchTerm) ||
            (product.width && product.width.toString().includes(searchTerm)) ||
            (product.length && product.length.toString().includes(searchTerm))
        );
    }
    
    applyFilters();
}

// Очищення фільтрів
function clearFilters() {
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    const priceFrom = document.getElementById('priceFrom');
    const priceTo = document.getElementById('priceTo');
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    
    if (priceFrom) priceFrom.value = '';
    if (priceTo) priceTo.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (searchInput) searchInput.value = '';
    
    filteredProducts = [...allProducts];
    sortProducts();
    showToast('Фільтри очищено', 'info');
}

// Швидкий перегляд товару
function quickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Створюємо модальне вікно для швидкого перегляду
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="quick-view-overlay" onclick="closeQuickView()"></div>
        <div class="quick-view-content">
            <button class="quick-view-close" onclick="closeQuickView()">
                <i class="fas fa-times"></i>
            </button>
            <div class="quick-view-body">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='/img/img_home/rebar-default.jpg'">
                </div>
                <div class="quick-view-details">
                    <div class="product-category">Лист ${product.thickness}мм</div>
                        <h2>${product.name}</h2>
                        <div class="product-specs">
                            <div><strong>Товщина:</strong> ${product.thickness}мм</div>
                            <div><strong>Розміри:</strong> ${product.width}×${product.length}мм</div>
                            <div><strong>Тип:</strong> ${product.type === 'cold_rolled' ? 'Холоднокатаний' : 'Гарячекатаний'}</div>
                            <div><strong>Марка сталі:</strong> ${product.steelGrade}</div>
                            ${product.weight ? `<div><strong>Вага:</strong> ${product.weight} кг</div>` : ''}
                            <div><strong>Статус:</strong> ${product.inStock ? 'В наявності' : 'Під замовлення'}</div>
                        </div>
                        ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                        <div class="product-price">₴${product.price.toFixed(2)} за лист</div>
                        ${product.minOrder ? `<div class="min-order">Мінімальне замовлення: ${product.minOrder} шт</div>` : ''}
                    <button class="add-to-cart-btn ${!product.inStock ? 'disabled' : ''}" 
                            onclick="addToCart('${product.id}'); closeQuickView();" 
                            ${!product.inStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> 
                        ${product.inStock ? 'Додати в кошик' : 'Немає в наявності'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Закриття швидкого перегляду
function closeQuickView() {
    const modal = document.querySelector('.quick-view-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Відкриття кошика
function openCart() {
    if (cartModal && cartOverlay) {
        cartModal.style.display = 'flex';
        cartOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateCartModal();
    }
}

// Закриття кошика
function closeCart() {
    if (cartModal && cartOverlay) {
        cartModal.style.display = 'none';
        cartOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Перехід до оформлення замовлення
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Кошик порожній', 'warning');
        return;
    }
    
    if (!currentUser) {
        if (confirm('Для оформлення замовлення потрібно увійти в акаунт. Перейти на сторінку входу?')) {
            window.location.href = '/login.html';
        }
        return;
    }
    
    // Тут можна додати логіку переходу на сторінку оформлення замовлення
    showToast('Переходимо до оформлення замовлення...', 'info');
    // window.location.href = '/checkout.html';
    setTimeout(() => {
        window.location.href = '/order.html';
    }, 500);
}

// Вихід з акаунта
function logout() {
    if (typeof auth !== 'undefined') {
        auth.signOut().then(() => {
            showToast('Ви вийшли з акаунта', 'info');
        }).catch((error) => {
            console.error('Помилка виходу:', error);
            showToast('Помилка виходу з акаунта', 'error');
        });
    }
}

// Перемикання меню користувача
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('active');
    }
}

// Розгортання/згортання фільтрів
function toggleFilter(event) {
    const header = event.currentTarget;
    const toggle = header.querySelector('.filter-toggle');
    const options = header.nextElementSibling;
    
    if (options && toggle) {
        if (options.style.display === 'none') {
            options.style.display = 'block';
            toggle.textContent = '−';
        } else {
            options.style.display = 'none';
            toggle.textContent = '+';
        }
    }
}

// Показ індикатора завантаження
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    if (productsGrid) {
        productsGrid.style.display = show ? 'none' : 'grid';
    }
}

// Показ повідомлення про відсутність товарів
function showNoProducts() {
    if (noProducts) {
        noProducts.style.display = 'block';
    }
    if (productsGrid) {
        productsGrid.style.display = 'none';
    }
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}


// Оновлення лічильника результатів
function updateResultsCount(count) {
    if (resultsCount) {
        resultsCount.textContent = `Знайдено ${count} товар${count === 1 ? '' : count < 5 ? 'и' : 'ів'}`;
    }
}

// Показ помилки
function showError(message) {
    console.error('Помилка:', message);
    if (noProducts) {
        noProducts.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Помилка завантаження</h3>
                <p>${message}</p>
                <button onclick="loadProducts()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Спробувати знову
                </button>
            </div>
        `;
        noProducts.style.display = 'block';
    }
    if (productsGrid) {
        productsGrid.style.display = 'none';
    }
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

// Показ toast повідомлення
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Встановлюємо повідомлення
    toastMessage.textContent = message;
    
    // Встановлюємо іконку в залежності від типу
    const icon = toast.querySelector('i');
    if (icon) {
        icon.className = 'fas ' + {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type];
    }
    
    // Встановлюємо клас для стилізації
    toast.className = `toast ${type}`;
    
    // Показуємо toast
    toast.style.display = 'flex';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // Автоматично приховуємо через 3 секунди
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3000);
}

// Перемикання виду відображення (сітка/список)
function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Оновлюємо активну кнопку
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Змінюємо вид сітки
            const grid = document.getElementById('productsGrid');
            if (grid) {
                grid.className = view === 'list' ? 'products-list' : 'products-grid';
            }
        });
    });
}

// Ініціалізація додаткових обробників після завантаження DOM
function initializeAdditionalFeatures() {
    setupViewToggle();
    
    // Закриття меню користувача при кліку поза межами
    document.addEventListener('click', function(event) {
        const userInfo = document.getElementById('userInfo');
        const userMenu = document.getElementById('userMenu');
        
        if (userInfo && userMenu && !userInfo.contains(event.target)) {
            userMenu.classList.remove('active');
        }
    });
    
    // Закриття швидкого перегляду клавішею Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const quickViewModal = document.querySelector('.quick-view-modal');
            if (quickViewModal) {
                closeQuickView();
            }
            
            // Також закриваємо кошик
            const cartModal = document.getElementById('cartModal');
            if (cartModal && cartModal.style.display === 'flex') {
                closeCart();
            }
        }
    });
    
    // Встановлюємо фокус на поле пошуку при натисканні Ctrl+F
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });
}

// Функція для форматування ціни
function formatPrice(price) {
    return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        minimumFractionDigits: 2
    }).format(price).replace('UAH', '₴');
}

// Функція для перевірки чи товар в обраних
function isProductInFavorites(productId) {
    const favorites = JSON.parse(localStorage.getItem('metaworks_sheet_metal_favorites')) || [];
    return favorites.includes(productId);
}

// Додавання/видалення з обраних
function toggleFavorite(productId) {
    let favorites = JSON.parse(localStorage.getItem('metaworks_sheet_metal_favorites')) || [];
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Товар видалено з обраних', 'info');
    } else {
        favorites.push(productId);
        showToast('Товар додано до обраних', 'success');
    }
    
    localStorage.setItem('metaworks_sheet_metal_favorites', JSON.stringify(favorites));
    
    // Оновлюємо іконку в UI
    const heartIcon = document.querySelector(`[onclick="toggleFavorite('${productId}')"] i`);
    if (heartIcon) {
        heartIcon.className = isProductInFavorites(productId) ? 'fas fa-heart' : 'far fa-heart';
    }
}

// Функція для отримання рекомендованих товарів
function getRecommendedProducts(currentProductId, limit = 4) {
    const currentProduct = allProducts.find(p => p.id === currentProductId);
    if (!currentProduct) return [];
    
    // Рекомендуємо товари з тим же класом арматури або близьким діаметром
    return allProducts
        .filter(p => p.id !== currentProductId && p.inStock)
        .filter(p => p.class === currentProduct.class || 
                    Math.abs(p.diameter - currentProduct.diameter) <= 2)
        .sort((a, b) => {
            // Спочатку товари з тим же класом
            if (a.class === currentProduct.class && b.class !== currentProduct.class) return -1;
            if (b.class === currentProduct.class && a.class !== currentProduct.class) return 1;
            
            // Потім за близькістю діаметру
            const aDiff = Math.abs(a.diameter - currentProduct.diameter);
            const bDiff = Math.abs(b.diameter - currentProduct.diameter);
            return aDiff - bDiff;
        })
        .slice(0, limit);
}

// Функція для валідації кількості при введенні
function validateQuantityInput(input, minOrder) {
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < minOrder) {
        input.value = minOrder;
        showToast(`Мінімальна кількість: ${minOrder}м`, 'warning');
        return false;
    }
    
    // Перевіряємо що кількість кратна мінімальному замовленню
    if (value % minOrder !== 0) {
        const correctedValue = Math.ceil(value / minOrder) * minOrder;
        input.value = correctedValue;
        showToast(`Кількість скоригована до ${correctedValue}м`, 'info');
        return false;
    }
    
    return true;
}

// Функція для експорту списку товарів
function exportProductsList(format = 'csv') {
    if (filteredProducts.length === 0) {
        showToast('Немає товарів для експорту', 'warning');
        return;
    }
    
    const data = filteredProducts.map(product => ({
    'Назва': product.name,
    'Товщина (мм)': product.thickness,
    'Ширина (мм)': product.width,
    'Довжина (мм)': product.length,
    'Тип': product.type === 'cold_rolled' ? 'Холоднокатаний' : 'Гарячекатаний',
    'Марка сталі': product.steelGrade,
    'Ціна (₴/лист)': product.price,
    'Вага (кг)': product.weight || 'Н/Д',
    'Наявність': product.inStock ? 'В наявності' : 'Під замовлення'
}));
    
    if (format === 'csv') {
        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `catalog_rebar_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showToast('Список експортовано в CSV', 'success');
    }
}

// Функція для збереження стану фільтрів
function saveFiltersState() {
    const filtersState = {
        // ЗАМІНИТИ diameter НА thickness:
        thickness: Array.from(document.querySelectorAll('#thicknessFilter input:checked')).map(cb => cb.value),
        
        // ЗАМІНИТИ class НА type (і виправити селектор):
        type: Array.from(document.querySelectorAll('#typeFilter input:checked')).map(cb => cb.value),
        
        // ДОДАТИ всі інші фільтри:
        width: Array.from(document.querySelectorAll('#widthFilter input:checked')).map(cb => cb.value),
        length: Array.from(document.querySelectorAll('#lengthFilter input:checked')).map(cb => cb.value),
        steelGrade: Array.from(document.querySelectorAll('#steelGradeFilter input:checked')).map(cb => cb.value),
        class: Array.from(document.querySelectorAll('#classFilter input:checked')).map(cb => cb.value),
        profile: Array.from(document.querySelectorAll('#profileFilter input:checked')).map(cb => cb.value),
        
        priceFrom: document.getElementById('priceFrom')?.value || '',
        priceTo: document.getElementById('priceTo')?.value || '',
        inStock: document.getElementById('inStock')?.checked || false,
        outStock: document.getElementById('outStock')?.checked || false,
        sortBy: document.getElementById('sortSelect')?.value || 'default',
        searchTerm: document.getElementById('searchInput')?.value || ''
    };
    
    localStorage.setItem('metaworks_sheet_metal_filters', JSON.stringify(filtersState));
}

// Функція для відновлення стану фільтрів
function restoreFiltersState() {
    const saved = localStorage.getItem('metaworks_sheet_metal_filters');
    if (!saved) return;
    
    try {
        const filtersState = JSON.parse(saved);
        
        // Відновлюємо товщину (замість діаметру)
        if (filtersState.thickness) {
            filtersState.thickness.forEach(value => {
                const checkbox = document.querySelector(`#thicknessFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Відновлюємо тип (замість класу)
        if (filtersState.type) {
            filtersState.type.forEach(value => {
                const checkbox = document.querySelector(`#typeFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // ДОДАТИ відновлення всіх інших фільтрів:
        if (filtersState.width) {
            filtersState.width.forEach(value => {
                const checkbox = document.querySelector(`#widthFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (filtersState.length) {
            filtersState.length.forEach(value => {
                const checkbox = document.querySelector(`#lengthFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (filtersState.steelGrade) {
            filtersState.steelGrade.forEach(value => {
                const checkbox = document.querySelector(`#steelGradeFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (filtersState.class) {
            filtersState.class.forEach(value => {
                const checkbox = document.querySelector(`#classFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (filtersState.profile) {
            filtersState.profile.forEach(value => {
                const checkbox = document.querySelector(`#profileFilter input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Відновлюємо ціни
        const priceFrom = document.getElementById('priceFrom');
        const priceTo = document.getElementById('priceTo');
        if (priceFrom) priceFrom.value = filtersState.priceFrom;
        if (priceTo) priceTo.value = filtersState.priceTo;
        
        // Відновлюємо наявність
        const inStock = document.getElementById('inStock');
        const outStock = document.getElementById('outStock');
        if (inStock) inStock.checked = filtersState.inStock;
        if (outStock) outStock.checked = filtersState.outStock;
        
        // Відновлюємо сортування
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = filtersState.sortBy;
        
        // Відновлюємо пошук
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = filtersState.searchTerm;
        
    } catch (error) {
        console.warn('Помилка відновлення фільтрів:', error);
    }
}

// Оновлена ініціалізація з відновленням фільтрів
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ініціалізація каталогу...');
    initializeAuth();
    loadProducts();
    setupEventListeners();
    updateCartUI();
    initializeAdditionalFeatures();
    
    // Відновлюємо стан фільтрів після короткої затримки
    setTimeout(() => {
        restoreFiltersState();
        if (document.getElementById('searchInput')?.value) {
            searchProducts();
        } else {
            applyFilters();
        }
    }, 500);
});

// Збереження фільтрів при їх зміні
function applyFilters() {
    console.log('Застосування фільтрів...');
    let filtered = [...allProducts];
    
    // Фільтр по діаметру
    const thicknessFilters = Array.from(document.querySelectorAll('#thicknessFilter input:checked'))
    .map(cb => parseFloat(cb.value));
if (thicknessFilters.length > 0) {
    filtered = filtered.filter(product => thicknessFilters.includes(product.thickness));
    console.log('Фільтр по товщині:', thicknessFilters);
}
    
    // Фільтр по класу
    const typeFilters = Array.from(document.querySelectorAll('#typeFilter input:checked'))
    .map(cb => cb.value);
        if (typeFilters.length > 0) {
            filtered = filtered.filter(product => typeFilters.includes(product.type));
            console.log('Фільтр по типу:', typeFilters);
        }

    

    
    // Фільтр по марці сталі
        const steelGradeFilters = Array.from(document.querySelectorAll('#steelGradeFilter input:checked'))
            .map(cb => cb.value);
        if (steelGradeFilters.length > 0) {
            filtered = filtered.filter(product => steelGradeFilters.includes(product.steelGrade));
            console.log('Фільтр по марці сталі:', steelGradeFilters);
        }

        // Фільтр по ширині
        const widthFilters = Array.from(document.querySelectorAll('#widthFilter input:checked'))
            .map(cb => parseInt(cb.value));
        if (widthFilters.length > 0) {
            filtered = filtered.filter(product => widthFilters.includes(product.width));
        }

        // Фільтр по довжині
        const lengthFilters = Array.from(document.querySelectorAll('#lengthFilter input:checked'))
            .map(cb => parseInt(cb.value));
        if (lengthFilters.length > 0) {
            filtered = filtered.filter(product => lengthFilters.includes(product.length));
        }

        // Фільтр по класу (якщо є)
        const classFilters = Array.from(document.querySelectorAll('#classFilter input:checked'))
            .map(cb => cb.value);
        if (classFilters.length > 0) {
            filtered = filtered.filter(product => product.class && classFilters.includes(product.class));
        }

        // Фільтр по профілю (якщо є)
        const profileFilters = Array.from(document.querySelectorAll('#profileFilter input:checked'))
            .map(cb => cb.value);
        if (profileFilters.length > 0) {
            filtered = filtered.filter(product => product.profile && profileFilters.includes(product.profile));
        }
        // Фільтр по ціні
    const priceFrom = parseFloat(document.getElementById('priceFrom')?.value || 0);
    const priceTo = parseFloat(document.getElementById('priceTo')?.value || 0);
    
    if (!isNaN(priceFrom) && priceFrom > 0) {
        filtered = filtered.filter(product => product.price >= priceFrom);
    }
    if (!isNaN(priceTo) && priceTo > 0) {
        filtered = filtered.filter(product => product.price <= priceTo);
    }
    
    // Фільтр по наявності
    const inStockChecked = document.getElementById('inStock')?.checked;
    const outStockChecked = document.getElementById('outStock')?.checked;
    
    if (inStockChecked && !outStockChecked) {
        filtered = filtered.filter(product => product.inStock);
    } else if (outStockChecked && !inStockChecked) {
        filtered = filtered.filter(product => !product.inStock);
    }
    
    filteredProducts = filtered;
    console.log(`Після фільтрації залишилось ${filteredProducts.length} товарів`);
    
    // Зберігаємо стан фільтрів
    saveFiltersState();
    
    sortProducts();
}

// Очищення фільтрів з очищенням збережених даних
function clearFilters() {
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    const priceFrom = document.getElementById('priceFrom');
    const priceTo = document.getElementById('priceTo');
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    
    if (priceFrom) priceFrom.value = '';
    if (priceTo) priceTo.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (searchInput) searchInput.value = '';
    
    // Очищуємо збережені фільтри
    localStorage.removeItem('metaworks_sheet_metal_filters');
    
    filteredProducts = [...allProducts];
    sortProducts();
    showToast('Фільтри очищено', 'info');
}

// Додайте цей код в ваш файл products_script.js

// Функція пошуку товарів
// Функція пошуку листів
function searchProducts(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery === '') {
        // Якщо пошуковий запит порожній, показати всі товари
        loadProducts();
        return;
    }
    
    // Фільтрація листів за назвою, описом або характеристиками
    const filteredProducts = allProducts.filter(product => {
        return product.name.toLowerCase().includes(normalizedQuery) ||
               (product.description && product.description.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за типом листа
               (product.type && product.type.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за товщиною
               product.thickness.toString().includes(normalizedQuery) ||
               // Пошук за шириною
               product.width.toString().includes(normalizedQuery) ||
               // Пошук за довжиною
               product.length.toString().includes(normalizedQuery) ||
               // Пошук за маркою сталі
               (product.steelGrade && product.steelGrade.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за класом
               (product.class && product.class.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за номером профілю
               (product.profile && product.profile.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за розмірами (формат "товщина x ширина x довжина")
               `${product.thickness}x${product.width}x${product.length}`.includes(normalizedQuery) ||
               // Пошук за розмірами з пробілами
               `${product.thickness} x ${product.width} x ${product.length}`.includes(normalizedQuery) ||
               // Пошук за окремими розмірами з "мм"
               `${product.thickness}мм`.includes(normalizedQuery) ||
               `${product.width}мм`.includes(normalizedQuery) ||
               `${product.length}мм`.includes(normalizedQuery);
    });
    
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

// Обробник для кнопки пошуку
document.getElementById('searchBtn').addEventListener('click', function() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value;
    searchProducts(query);
});

// Обробник для натискання Enter в пошуковому полі
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = this.value;
        searchProducts(query);
    }
});

// Пошук в реальному часі з оптимізацією
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value;
    
    // Додати затримку для оптимізації
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
        searchProducts(query);
    }, 300);
});

// Функція для оновлення кількості результатів
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (count === 0) {
        resultsCount.textContent = 'Листи не знайдені';
    } else if (count === 1) {
        resultsCount.textContent = 'Знайдено 1 лист';
    } else if (count < 5) {
        resultsCount.textContent = `Знайдено ${count} листи`;
    } else {
        resultsCount.textContent = `Знайдено ${count} листів`;
    }
}

// Додаткова функція для пошуку за розмірами
function searchByDimensions(thickness, width, length) {
    const filteredProducts = allProducts.filter(product => {
        let match = true;
        
        if (thickness && thickness !== '') {
            match = match && product.thickness.toString() === thickness.toString();
        }
        if (width && width !== '') {
            match = match && product.width.toString() === width.toString();
        }
        if (length && length !== '') {
            match = match && product.length.toString() === length.toString();
        }
        
        return match;
    });
    
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

// Функція для швидкого пошуку популярних розмірів
function quickSearch(searchTerm) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = searchTerm;
    searchProducts(searchTerm);
}