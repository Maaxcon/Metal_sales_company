// Глобальні змінні
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('metaworks_cart')) || [];
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

        // ВИПРАВЛЕНО: змінено з 'squares' на 'square_profiles'
        const snapshot = await db.collection('square_profiles').orderBy('profileNumber').get();
        allProducts = [];
        
        if (snapshot.empty) {
            console.log('Колекція square_profiles порожня або не існує');
            showNoProducts();
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            allProducts.push({
                id: doc.id,
                name: data.name || `Квадрат ${data.profileNumber}мм`,
                profileNumber: data.profileNumber || '10x10',
                steelGrade: data.steelGrade || 'ст1-3сп/пс',
                length: data.length || 6000,
                thickness: data.thickness || 10,
                width: data.width || 10,
                price: data.price || 0,
                weight: data.weight || null,
                minOrder: data.minOrder || 1,
                inStock: data.inStock !== false,
                image: data.image || '/img/img_home/square-default.jpg',
                description: data.description || '',
                badge: data.badge || null,
                ...data
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
                <img src="${product.image || '/img/img_home/rebar-default.jpg'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='/img/img_home/rebar-default.jpg'">
                <div class="quick-view" onclick="quickView('${product.id}')">
                    <i class="fas fa-eye"></i> Швидкий перегляд
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">Квадрат ${product.profileNumber}мм</div>
                <h4 class="product-title">${product.name}</h4>
                <div class="product-specs">
                    <div><strong>Профіль:</strong> ${product.profileNumber}мм</div>
                    <div><strong>Марка сталі:</strong> ${product.steelGrade}</div>
                    <div><strong>Довжина:</strong> ${product.length}мм</div>
                    <div><strong>Товщина:</strong> ${product.thickness}мм</div>
                    <div><strong>Ширина:</strong> ${product.width}мм</div>
                    ${product.weight ? `<div><strong>Вага:</strong> ${product.weight} кг/м</div>` : ''}
                </div>
                <div class="product-price">
                    ₴${product.price.toFixed(2)} за м
                    ${product.minOrder ? `<div style="font-size: 12px; color: #666;">Мін. замовлення: ${product.minOrder}м</div>` : ''}
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
            image: product.image || '/img/img_home/square-default.jpg',
            profileNumber: product.profileNumber,
            steelGrade: product.steelGrade,
            length: product.length,
            thickness: product.thickness,
            width: product.width,
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
    localStorage.setItem('metaworks_cart', JSON.stringify(cart));
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
                <img src="${item.image}" alt="${item.name}" onerror="this.src='/img/img_home/rebar-default.jpg'">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">₴${item.price.toFixed(2)} за м</div>
                <div class="cart-item-specs">${item.profileNumber}мм, ${item.steelGrade}</div>
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
// Виправлена функція сортування товарів
function sortProducts() {
    const sortValue = document.getElementById('sortSelect')?.value || 'default';
    console.log('Сортування:', sortValue);
    
    switch (sortValue) {
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
            // Сортування за замовчуванням (за профілем)
            filteredProducts.sort((a, b) => {
                // Безпечне отримання числового значення профілю
                const getProfileNumber = (profileNumber) => {
                    if (!profileNumber) return 0;
                    
                    // Якщо це рядок у форматі "10x10"
                    if (typeof profileNumber === 'string' && profileNumber.includes('x')) {
                        const parts = profileNumber.split('x');
                        return parseInt(parts[0]) || 0;
                    }
                    
                    // Якщо це просто число або рядок з числом
                    return parseInt(profileNumber) || 0;
                };
                
                const aProfile = getProfileNumber(a.profileNumber);
                const bProfile = getProfileNumber(b.profileNumber);
                
                if (aProfile !== bProfile) {
                    return aProfile - bProfile;
                }
                
                // Якщо профілі однакові, сортуємо за товщиною
                const aThickness = parseInt(a.thickness) || 0;
                const bThickness = parseInt(b.thickness) || 0;
                
                return aThickness - bThickness;
            });
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
            product.steelGrade.toLowerCase().includes(searchTerm) ||
            product.profileNumber.toLowerCase().includes(searchTerm) ||
            product.thickness.toString().includes(searchTerm) ||
            product.width.toString().includes(searchTerm)
        );
    }
    
    applyFilters(); // Застосовуємо фільтри після пошуку
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
                    <div class="product-category">Арматура ${product.diameter}мм</div>
                    <h2>${product.name}</h2>
                    <div class="product-specs">
                    <div><strong>Профіль:</strong> ${product.profileNumber}мм</div>
                    <div><strong>Марка сталі:</strong> ${product.steelGrade}</div>
                    <div><strong>Довжина:</strong> ${product.length}мм</div>
                    <div><strong>Товщина:</strong> ${product.thickness}мм</div>
                    <div><strong>Ширина:</strong> ${product.width}мм</div>
                    ${product.weight ? `<div><strong>Вага:</strong> ${product.weight} кг/м</div>` : ''}
                    <div><strong>Статус:</strong> ${product.inStock ? 'В наявності' : 'Під замовлення'}</div>
                </div>
                    ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                    <div class="product-price">₴${product.price.toFixed(2)} за м</div>
                    ${product.minOrder ? `<div class="min-order">Мінімальне замовлення: ${product.minOrder}м</div>` : ''}
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
    const favorites = JSON.parse(localStorage.getItem('metaworks_favorites')) || [];
    return favorites.includes(productId);
}

// Додавання/видалення з обраних
function toggleFavorite(productId) {
    let favorites = JSON.parse(localStorage.getItem('metaworks_favorites')) || [];
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Товар видалено з обраних', 'info');
    } else {
        favorites.push(productId);
        showToast('Товар додано до обраних', 'success');
    }
    
    localStorage.setItem('metaworks_favorites', JSON.stringify(favorites));
    
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
        .filter(p => p.steelGrade === currentProduct.steelGrade || 
            Math.abs(p.thickness - currentProduct.thickness) <= 2)
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
        'Діаметр (мм)': product.diameter,
        'Клас': product.class,
        'Довжина (м)': product.length,
        'Ціна (₴/м)': product.price,
        'Вага (кг/м)': product.weight || 'Н/Д',
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
        profileNumber: Array.from(document.querySelectorAll('#profileNumberFilter input:checked')).map(cb => cb.value),
        steelGrade: Array.from(document.querySelectorAll('#steelGradeFilter input:checked')).map(cb => cb.value),
        length: Array.from(document.querySelectorAll('#lengthFilter input:checked')).map(cb => cb.value),
        thickness: Array.from(document.querySelectorAll('#thicknessFilter input:checked')).map(cb => cb.value),
        width: Array.from(document.querySelectorAll('#widthFilter input:checked')).map(cb => cb.value),
        priceFrom: document.getElementById('priceFrom')?.value || '',
        priceTo: document.getElementById('priceTo')?.value || '',
        inStock: document.getElementById('inStock')?.checked || false,
        outStock: document.getElementById('outStock')?.checked || false,
        sortBy: document.getElementById('sortSelect')?.value || 'default',
        searchTerm: document.getElementById('searchInput')?.value || ''
    };
    
    localStorage.setItem('metaworks_catalog_filters', JSON.stringify(filtersState));
}

// Функція для відновлення стану фільтрів
function restoreFiltersState() {
    const saved = localStorage.getItem('metaworks_catalog_filters');
    if (!saved) return;
    
    try {
        const filtersState = JSON.parse(saved);
        
        // Відновлюємо профілі
        filtersState.profileNumber?.forEach(value => {
            const checkbox = document.querySelector(`#profileNumberFilter input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Відновлюємо марки сталі
        filtersState.steelGrade?.forEach(value => {
            const checkbox = document.querySelector(`#steelGradeFilter input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Відновлюємо довжини
        filtersState.length?.forEach(value => {
            const checkbox = document.querySelector(`#lengthFilter input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Відновлюємо товщини
        filtersState.thickness?.forEach(value => {
            const checkbox = document.querySelector(`#thicknessFilter input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Відновлюємо ширини
        filtersState.width?.forEach(value => {
            const checkbox = document.querySelector(`#widthFilter input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
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
// Фільтрація товарів
function applyFilters() {
    console.log('Застосування фільтрів...');
    let filtered = [...allProducts];
    
    // Фільтр по номеру профілю
    const profileFilters = Array.from(document.querySelectorAll('#profileNumberFilter input:checked'))
        .map(cb => cb.value);
    if (profileFilters.length > 0) {
        filtered = filtered.filter(product => profileFilters.includes(product.profileNumber));
        console.log('Фільтр по профілю:', profileFilters);
    }
    
    // Фільтр по марці сталі
    const steelGradeFilters = Array.from(document.querySelectorAll('#steelGradeFilter input:checked'))
        .map(cb => cb.value);
    if (steelGradeFilters.length > 0) {
        filtered = filtered.filter(product => steelGradeFilters.includes(product.steelGrade));
        console.log('Фільтр по марці сталі:', steelGradeFilters);
    }
    
    // Фільтр по довжині
    const lengthFilters = Array.from(document.querySelectorAll('#lengthFilter input:checked'))
        .map(cb => parseInt(cb.value));
    if (lengthFilters.length > 0) {
        filtered = filtered.filter(product => lengthFilters.includes(product.length));
        console.log('Фільтр по довжині:', lengthFilters);
    }
    
    // Фільтр по товщині
    const thicknessFilters = Array.from(document.querySelectorAll('#thicknessFilter input:checked'))
        .map(cb => parseInt(cb.value));
    if (thicknessFilters.length > 0) {
        filtered = filtered.filter(product => thicknessFilters.includes(product.thickness));
        console.log('Фільтр по товщині:', thicknessFilters);
    }
    
    // Фільтр по ширині
    const widthFilters = Array.from(document.querySelectorAll('#widthFilter input:checked'))
        .map(cb => parseInt(cb.value));
    if (widthFilters.length > 0) {
        filtered = filtered.filter(product => widthFilters.includes(product.width));
        console.log('Фільтр по ширині:', widthFilters);
    }
    
    // Фільтр по ціні (залишається без змін)
    const priceFrom = parseFloat(document.getElementById('priceFrom')?.value || 0);
    const priceTo = parseFloat(document.getElementById('priceTo')?.value || 0);
    
    if (!isNaN(priceFrom) && priceFrom > 0) {
        filtered = filtered.filter(product => product.price >= priceFrom);
    }
    if (!isNaN(priceTo) && priceTo > 0) {
        filtered = filtered.filter(product => product.price <= priceTo);
    }
    
    // Фільтр по наявності (залишається без змін)
    const inStockChecked = document.getElementById('inStock')?.checked;
    const outStockChecked = document.getElementById('outStock')?.checked;
    
    if (inStockChecked && !outStockChecked) {
        filtered = filtered.filter(product => product.inStock);
    } else if (outStockChecked && !inStockChecked) {
        filtered = filtered.filter(product => !product.inStock);
    }
    
    filteredProducts = filtered;
    console.log(`Після фільтрації залишилось ${filteredProducts.length} товарів`);
    
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
    localStorage.removeItem('metaworks_catalog_filters');
    
    filteredProducts = [...allProducts];
    sortProducts();
    showToast('Фільтри очищено', 'info');
}

// Функція пошуку квадратних труб
function searchProducts(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery === '') {
        // Якщо пошуковий запит порожній, показати всі товари
        loadProducts();
        return;
    }
    
    // Фільтрація квадратних труб за назвою, описом або характеристиками
    const filteredProducts = allProducts.filter(product => {
        return product.name.toLowerCase().includes(normalizedQuery) ||
               (product.description && product.description.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за номером профілю (розмір квадрата)
               (product.profileNumber && product.profileNumber.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за товщиною стінки
               product.thickness.toString().includes(normalizedQuery) ||
               // Пошук за шириною/висотою квадрата
               product.width.toString().includes(normalizedQuery) ||
               // Пошук за довжиною
               product.length.toString().includes(normalizedQuery) ||
               // Пошук за маркою сталі
               (product.steelGrade && product.steelGrade.toLowerCase().includes(normalizedQuery)) ||
               // Пошук за розміром профілю (наприклад "20x20", "40x40")
               `${product.width}x${product.width}`.includes(normalizedQuery) ||
               // Пошук за розміром з товщиною (наприклад "20x20x2")
               `${product.width}x${product.width}x${product.thickness}`.includes(normalizedQuery) ||
               // Пошук за розмірами з пробілами
               `${product.width} x ${product.width}`.includes(normalizedQuery) ||
               `${product.width} x ${product.width} x ${product.thickness}`.includes(normalizedQuery) ||
               // Пошук за окремими розмірами з "мм"
               `${product.width}мм`.includes(normalizedQuery) ||
               `${product.thickness}мм`.includes(normalizedQuery) ||
               `${product.length}мм`.includes(normalizedQuery) ||
               // Пошук за терміном "квадрат"
               normalizedQuery.includes('квадрат') ||
               normalizedQuery.includes('труба квадратна') ||
               // Пошук за загальними термінами
               normalizedQuery.includes('профіль') ||
               normalizedQuery.includes('труба');
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
        resultsCount.textContent = 'Квадратні труби не знайдені';
    } else if (count === 1) {
        resultsCount.textContent = 'Знайдено 1 квадратну трубу';
    } else if (count < 5) {
        resultsCount.textContent = `Знайдено ${count} квадратні труби`;
    } else {
        resultsCount.textContent = `Знайдено ${count} квадратних труб`;
    }
}

// Додаткова функція для пошуку за розмірами квадратних труб
function searchBySquareDimensions(width, thickness, length) {
    const filteredProducts = allProducts.filter(product => {
        let match = true;
        
        if (width && width !== '') {
            match = match && product.width.toString() === width.toString();
        }
        if (thickness && thickness !== '') {
            match = match && product.thickness.toString() === thickness.toString();
        }
        if (length && length !== '') {
            match = match && product.length.toString() === length.toString();
        }
        
        return match;
    });
    
    displayProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
}

// Функція для швидкого пошуку популярних розмірів квадратних труб
function quickSearch(searchTerm) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = searchTerm;
    searchProducts(searchTerm);
}

// Функція для пошуку за стандартними розмірами
function searchStandardSizes() {
    const standardSizes = ['15x15', '20x20', '25x25', '30x30', '40x40', '50x50', '60x60', '80x80', '100x100', '120x120'];
    return standardSizes;
}

// Допоміжна функція для парсингу розмірів з пошукового запиту
function parseSquareDimensions(query) {
    const sizePattern = /(\d+)x(\d+)(?:x(\d+(?:\.\d+)?))?/;
    const match = query.match(sizePattern);
    
    if (match) {
        return {
            width: match[1],
            height: match[2], // для квадратних труб width = height
            thickness: match[3] || null
        };
    }
    
    return null;
}