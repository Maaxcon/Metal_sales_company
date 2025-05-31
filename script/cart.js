// Модуль корзини для MetaWorks
// cart.js

class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('metaworks_cart')) || [];
        this.currentUser = null;
        this.initializeElements();
        this.setupEventListeners();
        this.updateCartUI();
    }

    // Ініціалізація DOM елементів
    initializeElements() {
        this.cartCount = document.getElementById('cartCount');
        this.cartCountBadge = document.getElementById('cartCountBadge');
        this.cartModal = document.getElementById('cartModal');
        this.cartOverlay = document.getElementById('cartOverlay');
        this.cartBody = document.getElementById('cartBody');
        this.cartEmpty = document.getElementById('cartEmpty');
        this.cartFooter = document.getElementById('cartFooter');
        this.toast = document.getElementById('toast');
    }

    // Налаштування обробників подій
    setupEventListeners() {
        // Кошик
        const cartIcon = document.getElementById('cartIcon');
        const cartClose = document.getElementById('cartClose');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        const continueShopping = document.getElementById('continueShopping');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.openCart());
        }
        
        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeCart());
        }
        
        if (this.cartOverlay) {
            this.cartOverlay.addEventListener('click', () => this.closeCart());
        }

        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => this.closeCart());
        }

        if (continueShopping) {
            continueShopping.addEventListener('click', () => this.closeCart());
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Закриття корзини клавішею Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const cartModal = document.getElementById('cartModal');
                if (cartModal && cartModal.style.display === 'flex') {
                    this.closeCart();
                }
            }
        });
    }

    // Додавання товару в кошик
    addToCart(product) {
        if (!product || !product.inStock) {
            this.showToast('Товар недоступний для замовлення', 'error');
            return false;
        }

        const existingItem = this.cart.find(item => item.id === product.id);
        const quantity = product.minOrder || 1;
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
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
        
        this.saveCart();
        this.updateCartUI();
        this.showToast(`${product.name} додано до кошика!`, 'success');
        
        // Анімація для кнопки
        const btn = document.querySelector(`[onclick*="addToCart"][onclick*="${product.id}"]`);
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        }

        return true;
    }

    // Зміна кількості товару
    changeQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        const minQuantity = item.minOrder || 1;
        
        if (newQuantity < minQuantity) {
            if (confirm(`Мінімальне замовлення ${minQuantity}м. Видалити товар з кошика?`)) {
                this.removeFromCart(productId);
            }
            return;
        }
        
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartUI();
    }

    // Оновлення кількості товару
    updateQuantity(productId, newQuantity) {
        const quantity = parseInt(newQuantity);
        const item = this.cart.find(item => item.id === productId);
        
        if (!item) return;
        
        const minQuantity = item.minOrder || 1;
        
        if (quantity < minQuantity) {
            this.showToast(`Мінімальне замовлення: ${minQuantity}м`, 'warning');
            // Повертаємо попереднє значення
            const input = document.querySelector(`input[onchange*="${productId}"]`);
            if (input) input.value = item.quantity;
            return;
        }
        
        item.quantity = quantity;
        this.saveCart();
        this.updateCartUI();
    }

    // Видалення товару з кошика
    removeFromCart(productId) {
        const item = this.cart.find(item => item.id === productId);
        const itemName = item ? item.name : 'Товар';
        
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showToast(`${itemName} видалено з кошика`, 'info');
    }

    // Очищення кошика
    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Ви впевнені, що хочете очистити кошик?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.showToast('Кошик очищено', 'info');
        }
    }

    // Збереження кошика в localStorage
    saveCart() {
        localStorage.setItem('metaworks_cart', JSON.stringify(this.cart));
    }

    // Оновлення UI кошика
    updateCartUI() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (this.cartCount) {
            this.cartCount.textContent = totalItems;
            this.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        if (this.cartCountBadge) {
            this.cartCountBadge.textContent = totalItems;
        }
        
        this.updateCartModal();
    }

    // Оновлення модального вікна кошика
    updateCartModal() {
        if (!this.cartBody || !this.cartEmpty || !this.cartFooter) return;
        
        if (this.cart.length === 0) {
            this.cartBody.style.display = 'none';
            this.cartFooter.style.display = 'none';
            this.cartEmpty.style.display = 'flex';
            return;
        }
        
        this.cartBody.style.display = 'block';
        this.cartFooter.style.display = 'block';
        this.cartEmpty.style.display = 'none';
        
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 1000 ? 0 : 200; // Безкоштовна доставка від 1000 грн
        const total = subtotal + shipping;
        
        // Формування HTML для товарів у кошику
        const cartItemsHTML = this.cart.map(item => `
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
                    <button class="quantity-btn" onclick="cartManager.changeQuantity('${item.id}', -${item.minOrder || 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" 
                           value="${item.quantity}" 
                           min="${item.minOrder || 1}" 
                           step="${item.minOrder || 1}"
                           onchange="cartManager.updateQuantity('${item.id}', this.value)">
                    <button class="quantity-btn" onclick="cartManager.changeQuantity('${item.id}', ${item.minOrder || 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    ₴${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="cart-item-remove" onclick="cartManager.removeFromCart('${item.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
        
        this.cartBody.innerHTML = `
            <div class="cart-summary-top">
                <div class="cart-items-count">Товарів у кошику: ${this.cart.length}</div>
                <div class="cart-total-weight">
                    ${this.cart.some(item => item.weight) ? 
                      `Загальна вага: ${this.cart.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0).toFixed(2)} кг` : ''}
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

    // Відкриття кошика
    openCart() {
        if (this.cartModal && this.cartOverlay) {
            this.cartModal.style.display = 'flex';
            this.cartOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.updateCartModal();
        }
    }

    // Закриття кошика
    closeCart() {
        if (this.cartModal && this.cartOverlay) {
            this.cartModal.style.display = 'none';
            this.cartOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Перехід до оформлення замовлення
    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showToast('Кошик порожній', 'warning');
            return;
        }
        
        if (!this.currentUser) {
            if (confirm('Для оформлення замовлення потрібно увійти в акаунт. Перейти на сторінку входу?')) {
                window.location.href = '/login.html';
            }
            return;
        }
        
        // Тут можна додати логіку переходу на сторінку оформлення замовлення
        this.showToast('Переходимо до оформлення замовлення...', 'info');
        // window.location.href = '/checkout.html';
    }

    // Отримання даних кошика
    getCartData() {
        return {
            items: this.cart,
            totalItems: this.cart.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            totalWeight: this.cart.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
        };
    }

    // Перевірка чи товар в кошику
    isInCart(productId) {
        return this.cart.some(item => item.id === productId);
    }

    // Отримання кількості товару в кошику
    getProductQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        return item ? item.quantity : 0;
    }

    // Встановлення поточного користувача
    setCurrentUser(user) {
        this.currentUser = user;
    }

    // Показ toast повідомлення
    showToast(message, type = 'success') {
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
}

// Глобальні функції для сумісності з існуючим кодом
let cartManager;

// Ініціалізація менеджера корзини
function initializeCart() {
    cartManager = new CartManager();
    return cartManager;
}

// Функції-обгортки для зворотної сумісності
function addToCart(productId, allProducts = []) {
    if (!cartManager) cartManager = new CartManager();
    
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        return cartManager.addToCart(product);
    } else {
        console.warn('Товар не знайдено:', productId);
        return false;
    }
}

function changeQuantity(productId, change) {
    if (!cartManager) cartManager = new CartManager();
    cartManager.changeQuantity(productId, change);
}

function updateQuantity(productId, quantity) {
    if (!cartManager) cartManager = new CartManager();
    cartManager.updateQuantity(productId, quantity);
}

function removeFromCart(productId) {
    if (!cartManager) cartManager = new CartManager();
    cartManager.removeFromCart(productId);
}

function updateCartUI() {
    if (!cartManager) cartManager = new CartManager();
    cartManager.updateCartUI();
}

function openCart() {
    if (!cartManager) cartManager = new CartManager();
    cartManager.openCart();
}

function closeCart() {
    if (!cartManager) cartManager = new CartManager();
    cartManager.closeCart();
}

function proceedToCheckout() {
    if (!cartManager) cartManager = new CartManager();
    cartManager.proceedToCheckout();
}

// Автоматична ініціалізація при завантаженні DOM
document.addEventListener('DOMContentLoaded', function() {
    if (!cartManager) {
        cartManager = initializeCart();
    }
});

// Експорт для використання як модуль
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartManager, initializeCart };
}