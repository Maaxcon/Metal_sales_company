// ========== СКРИПТ ДЛЯ ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ==========

// Глобальні змінні
let cart = JSON.parse(localStorage.getItem('metaworks_cart')) || [];
let currentUser = null;

// ========== ІНІЦІАЛІЗАЦІЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    initializeCheckout();
    setupEventListeners();
});

// Ініціалізація авторизації
function initializeAuth() {
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            updateUserUI(user);
            // Заповнюємо форму даними користувача
            prefillUserData(user);
        } else {
            currentUser = null;
            // Перенаправляємо на сторінку входу якщо немає користувача
            if (confirm('Для оформлення замовлення потрібно увійти в акаунт. Перейти на сторінку входу?')) {
                window.location.href = '/login.html';
            } else {
                window.location.href = '/home_page.html';
            }
        }
    });
}

// Оновлення UI користувача
function updateUserUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (userName) userName.textContent = user.displayName || user.email;
}

// Заповнення форми даними користувача
async function prefillUserData(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Заповнюємо поля форми
            const customerName = document.getElementById('customerName');
            const customerPhone = document.getElementById('customerPhone');
            const customerEmail = document.getElementById('customerEmail');
            const city = document.getElementById('city');
            
            if (customerName && userData.fullName) customerName.value = userData.fullName;
            if (customerPhone && userData.phone) customerPhone.value = userData.phone;
            if (customerEmail) customerEmail.value = user.email;
            if (city && userData.city) city.value = userData.city;
        }
    } catch (error) {
        console.error('Помилка при завантаженні даних користувача:', error);
    }
}

// Ініціалізація сторінки оформлення
function initializeCheckout() {
    // Перевіряємо чи є товари в кошику
    if (!cart || cart.length === 0) {
        showToast('Кошик порожній. Перенаправляємо на головну сторінку...', 'warning');
        setTimeout(() => {
            window.location.href = '/home_page.html';
        }, 2000);
        return;
    }
    
    displayOrderItems();
    calculateTotals();
    updateCartCount();
}

// Відображення товарів замовлення
function displayOrderItems() {
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) return;
    
    const itemsHTML = cart.map(item => `
        <div class="order-item">
            <div class="item-image">
                <img src="${item.image || '/img/img_home/square-default.jpg'}" alt="${item.name || 'Товар'}" onerror="this.src='/img/img_home/square-default.jpg'">
            </div>
            <div class="item-details">
                <h4 class="item-name">${item.name || 'Товар'}</h4>
                <div class="item-specs">
                    <span class="spec">${item.profileNumber || 0}мм</span>
                    <span class="spec">${item.steelGrade || 'Не вказано'}</span>
                    ${item.length ? `<span class="spec">L: ${item.length}м</span>` : ''}
                </div>
                <div class="item-quantity">Кількість: ${item.quantity || 0}м</div>
                ${item.weight ? `<div class="item-weight">Вага: ${(item.weight * item.quantity).toFixed(2)} кг</div>` : ''}
            </div>
            <div class="item-price">
                <div class="unit-price">₴${(item.price || 0).toFixed(2)}/м</div>
                <div class="total-price">₴${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
    
    orderItemsContainer.innerHTML = itemsHTML;
}

// Розрахунок підсумків
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const deliveryCost = subtotal > 1000 ? 0 : 200; // Безкоштовна доставка від 1000 грн
    const total = subtotal + deliveryCost;
    
    const subtotalEl = document.getElementById('orderSubtotal');
    const deliveryEl = document.getElementById('deliveryCost');
    const totalEl = document.getElementById('orderTotal');
    
    if (subtotalEl) subtotalEl.textContent = `₴${subtotal.toFixed(2)}`;
    if (deliveryEl) deliveryEl.textContent = deliveryCost === 0 ? 'Безкоштовно' : `₴${deliveryCost.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₴${total.toFixed(2)}`;
}

// Оновлення лічильника кошика
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ========== ОБРОБКА ФОРМИ ==========

// Обробка зміни способу доставки
function handleDeliveryTypeChange() {
    const deliveryType = document.getElementById('deliveryType').value;
    const warehouseGroup = document.getElementById('warehouseGroup');
    const addressGroup = document.getElementById('addressGroup');
    const warehouseInput = document.getElementById('warehouse');
    const addressInput = document.getElementById('address');
    
    // Скидаємо обов'язковість полів
    if (warehouseInput) warehouseInput.removeAttribute('required');
    if (addressInput) addressInput.removeAttribute('required');
    
    // Приховуємо всі поля адреси
    if (warehouseGroup) warehouseGroup.style.display = 'none';
    if (addressGroup) addressGroup.style.display = 'none';
    
    switch (deliveryType) {
        case 'nova-poshta':
        case 'ukrposhta':
            if (warehouseGroup) warehouseGroup.style.display = 'block';
            if (warehouseInput) warehouseInput.setAttribute('required', '');
            break;
        case 'courier':
            if (addressGroup) addressGroup.style.display = 'block';
            if (addressInput) addressInput.setAttribute('required', '');
            break;
        case 'pickup':
            // Для самовивозу не потрібні додаткові поля
            break;
    }
}

// Валідація форми
function validateForm(formData) {
    const errors = [];
    
    if (!formData.customerName || !formData.customerName.trim()) {
        errors.push('Введіть прізвище та ім\'я');
    }
    
    if (!formData.customerPhone || !formData.customerPhone.trim()) {
        errors.push('Введіть номер телефону');
    } else if (!/^\+380\d{9}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
        errors.push('Номер телефону має бути у форматі +380XXXXXXXXX');
    }
    
    if (!formData.deliveryType) {
        errors.push('Оберіть спосіб доставки');
    }
    
    if (!formData.city || !formData.city.trim()) {
        errors.push('Введіть місто');
    }
    
    if (formData.deliveryType === 'nova-poshta' || formData.deliveryType === 'ukrposhta') {
        if (!formData.warehouse || !formData.warehouse.trim()) {
            errors.push('Введіть відділення для доставки');
        }
    }
    
    if (formData.deliveryType === 'courier') {
        if (!formData.address || !formData.address.trim()) {
            errors.push('Введіть адресу для кур\'єрської доставки');
        }
    }
    
    if (!formData.paymentMethod) {
        errors.push('Оберіть спосіб оплати');
    }
    
    return errors;
}

// Обробка відправки форми
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Конвертуємо FormData в об'єкт
    const orderData = {
        customerName: formData.get('customerName') || '',
        customerPhone: formData.get('customerPhone') || '',
        customerEmail: formData.get('customerEmail') || '',
        deliveryType: formData.get('deliveryType') || '',
        city: formData.get('city') || '',
        warehouse: formData.get('warehouse') || '',
        address: formData.get('address') || '',
        paymentMethod: formData.get('paymentMethod') || '',
        orderComment: formData.get('orderComment') || ''
    };
    
    // Валідація
    const errors = validateForm(orderData);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }
    
    // Показуємо індикатор завантаження
    showLoading(true);
    
    try {
        await createOrder(orderData);
        showLoading(false);
        showSuccessModal();
        
        // Очищуємо кошик після успішного замовлення
        clearCart();
        
    } catch (error) {
        console.error('Помилка при створенні замовлення:', error);
        showLoading(false);
        showToast('Помилка при оформленні замовлення. Спробуйте ще раз.', 'error');
    }
}

// Створення замовлення в Firebase
async function createOrder(orderData) {
    if (!currentUser) {
        throw new Error('Користувач не авторизований');
    }
    
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const deliveryCost = subtotal > 1000 ? 0 : 200;
    const total = subtotal + deliveryCost;
    const totalWeight = cart.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 0)), 0);
    
    // Генеруємо номер замовлення
    const orderNumber = 'MW' + Date.now().toString().slice(-8);
    
    const order = {
        orderNumber: orderNumber,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending', // pending, confirmed, processing, shipped, delivered, cancelled
        
        // Контактна інформація
        customer: {
            name: orderData.customerName || '',
            phone: orderData.customerPhone || '',
            email: orderData.customerEmail || ''
        },
        
        // Доставка
        delivery: {
            type: orderData.deliveryType || '',
            city: orderData.city || '',
            warehouse: orderData.warehouse || null,
            address: orderData.address || null,
            cost: deliveryCost
        },
        
        // Оплата
        payment: {
            method: orderData.paymentMethod || '',
            status: 'pending' // pending, paid, failed
        },
        
        // Товари
        items: cart.map(item => ({
            id: item.id || '',
            name: item.name || '',
            profileNumber: item.profileNumber || 0,
            steelGrade: item.steelGrade || '',
            length: item.length || 0,
            thickness: item.thickness || 0,
            width: item.width || 0,
            weight: item.weight || 0,
            price: item.price || 0,
            quantity: item.quantity || 0,
            total: (item.price || 0) * (item.quantity || 0)
        })),
        
        // Підсумки
        totals: {
            subtotal: subtotal,
            delivery: deliveryCost,
            total: total,
            totalWeight: totalWeight,
            itemsCount: cart.length,
            totalQuantity: cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
        },
        
        // Додаткова інформація
        comment: orderData.orderComment || null,
        
        // Дати
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Додаткова перевірка на undefined значення
    const cleanOrder = cleanUndefinedValues(order);
    
    // Зберігаємо замовлення
    const orderRef = await db.collection('orders').add(cleanOrder);
    
    // Оновлюємо номер замовлення в документі
    await orderRef.update({
        id: orderRef.id
    });
    
    // Показуємо номер замовлення в модальному вікні
    const orderNumberEl = document.getElementById('orderNumber');
    if (orderNumberEl) {
        orderNumberEl.textContent = '#' + orderNumber;
    }
    
    return orderRef.id;
}

// Функція для очищення об'єкта від undefined значень
function cleanUndefinedValues(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = cleanUndefinedValues(value);
        }
    }
    return cleaned;
}

// ========== ДОПОМІЖНІ ФУНКЦІЇ ==========

// Очищення кошика
function clearCart() {
    cart = [];
    localStorage.removeItem('metaworks_cart');
    updateCartCount();
}

// Показ/приховування індикатора завантаження
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Показ модального вікна успіху
function showSuccessModal() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Приховування модального вікна успіху
function hideSuccessModal() {
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Показ toast повідомлення
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Повернення до кошика
function backToCart() {
    window.history.back();
}

// Вихід з акаунта
function logout() {
    auth.signOut().then(() => {
        window.location.href = '/home_page.html';
    }).catch((error) => {
        console.error('Помилка при виході:', error);
        showToast('Помилка при виході з акаунта', 'error');
    });
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Форма оформлення замовлення
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Зміна способу доставки
    const deliveryType = document.getElementById('deliveryType');
    if (deliveryType) {
        deliveryType.addEventListener('change', handleDeliveryTypeChange);
    }
    
    // Кнопка повернення до кошика
    const backToCartBtn = document.getElementById('backToCartBtn');
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', backToCart);
    }
    
    // Кнопка продовжити покупки (з модального вікна успіху)
    const continueShoppingFromSuccess = document.getElementById('continueShoppingFromSuccess');
    if (continueShoppingFromSuccess) {
        continueShoppingFromSuccess.addEventListener('click', () => {
            hideSuccessModal();
            window.location.href = '/home_page.html';
        });
    }
    
    // Кнопка виходу
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Кнопка профілю
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            // Тут можна додати перехід на сторінку профілю
            showToast('Сторінка профілю в розробці', 'info');
        });
    }
    
    // Клік по overlay успішного замовлення
    const successOverlay = document.getElementById('successOverlay');
    if (successOverlay) {
        successOverlay.addEventListener('click', (e) => {
            if (e.target === successOverlay) {
                hideSuccessModal();
                window.location.href = '/home_page.html';
            }
        });
    }
    
    // Валідація телефону в реальному часі
    const customerPhone = document.getElementById('customerPhone');
    if (customerPhone) {
        customerPhone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('380')) {
                value = '+' + value;
            } else if (value.startsWith('0')) {
                value = '+38' + value;
            } else if (value.length > 0 && !value.startsWith('380')) {
                value = '+380' + value;
            }
            
            // Обмежуємо довжину
            if (value.length > 13) {
                value = value.substring(0, 13);
            }
            
            e.target.value = value;
        });
    }
}