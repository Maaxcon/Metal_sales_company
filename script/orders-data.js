// orders-history.js - Покращена версія з обробкою помилок
class OrdersHistory {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.orders = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Статуси замовлень з перекладом
        this.statusTranslations = {
            'pending': { text: 'Очікує обробки', class: 'status-pending', icon: 'fas fa-clock' },
            'confirmed': { text: 'Підтверджено', class: 'status-confirmed', icon: 'fas fa-check-circle' },
            'processing': { text: 'В обробці', class: 'status-processing', icon: 'fas fa-cog' },
            'shipping': { text: 'Відправлено', class: 'status-shipping', icon: 'fas fa-truck' },
            'delivered': { text: 'Доставлено', class: 'status-delivered', icon: 'fas fa-box-open' },
            'cancelled': { text: 'Скасовано', class: 'status-cancelled', icon: 'fas fa-times-circle' }
        };

        // Методи оплати з перекладом
        this.paymentMethodTranslations = {
            'cash': 'Готівка при отриманні',
            'card': 'Банківська картка',
            'transfer': 'Банківський переказ',
            'online': 'Онлайн оплата'
        };

        // Типи доставки з перекладом
        this.deliveryTypeTranslations = {
            'nova-poshta': 'Нова Пошта',
            'ukrposhta': 'Укрпошта',
            'courier': 'Кур\'єрська доставка',
            'pickup': 'Самовивіз'
        };

        this.init();
    }

    async init() {
        try {
            // Перевіряємо доступність Firebase
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK не завантажений');
            }

            // Перевіряємо інтернет-з\'єднання
            if (!navigator.onLine) {
                this.showError('Відсутнє інтернет-з\'єднання. Перевірте підключення до мережі.');
                return;
            }

            // Ініціалізуємо Firebase сервіси
            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Налаштовуємо offline persistence для Firestore
            try {
                await this.db.enablePersistence();
                console.log('Firestore offline persistence включено');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence не може бути включено (декілька вкладок)');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence не підтримується браузером');
                }
            }

            // Слухаємо зміни стану авторизації
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.loadOrders();
                } else {
                    this.currentUser = null;
                    this.showEmptyState();
                }
            });

            // Слухаємо зміни стану мережі
            window.addEventListener('online', () => {
                console.log('З\'єднання відновлено');
                if (this.currentUser) {
                    this.loadOrders();
                }
            });

            window.addEventListener('offline', () => {
                console.log('З\'єднання втрачено');
                this.showError('З\'єднання з інтернетом втрачено. Дані можуть бути застарілими.');
            });

        } catch (error) {
            console.error('Помилка ініціалізації:', error);
            this.showError('Помилка ініціалізації додатку: ' + error.message);
        }
    }

    async loadOrders() {
        const ordersLoading = document.getElementById('ordersLoading');
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');

        if (!ordersLoading || !ordersList || !noOrders) {
            console.error('Необхідні HTML елементи не знайдені');
            return;
        }

        try {
            // Показуємо завантаження
            ordersLoading.style.display = 'block';
            ordersList.style.display = 'none';
            noOrders.style.display = 'none';

            // Перевіряємо авторизацію
            if (!this.currentUser || !this.currentUser.email) {
                throw new Error('Користувач не авторизований');
            }

            console.log('Завантажуємо замовлення для:', this.currentUser.email);

            // Завантажуємо замовлення користувача з тайм-аутом
            const ordersQuery = await Promise.race([
                this.db.collection('orders')
                    .where('userEmail', '==', this.currentUser.email)
                    .orderBy('createdAt', 'desc')
                    .get(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Тайм-аут запиту')), 10000)
                )
            ]);

            this.orders = [];
            ordersQuery.forEach((doc) => {
                this.orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('Завантажено замовлень:', this.orders.length);

            // Приховуємо завантаження
            ordersLoading.style.display = 'none';

            if (this.orders.length > 0) {
                this.renderOrders();
                ordersList.style.display = 'block';
            } else {
                noOrders.style.display = 'block';
            }

            // Скидаємо лічильник повторних спроб
            this.retryCount = 0;

        } catch (error) {
            console.error('Помилка завантаження замовлень:', error);
            ordersLoading.style.display = 'none';
            
            // Обробляємо різні типи помилок
            let errorMessage = 'Не вдалося завантажити замовлення.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'Недостатньо прав для перегляду замовлень. Зверніться до адміністратора.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Сервіс тимчасово недоступний. Спробуйте пізніше.';
            } else if (error.message === 'Тайм-аут запиту') {
                errorMessage = 'Запит занадто довгий. Перевірте інтернет-з\'єднання.';
            } else if (!navigator.onLine) {
                errorMessage = 'Відсутнє інтернет-з\'єднання.';
            }

            // Спроба автоматичного повтору
            if (this.retryCount < this.maxRetries && navigator.onLine) {
                this.retryCount++;
                console.log(`Спроба повтору ${this.retryCount}/${this.maxRetries} через 2 секунди...`);
                setTimeout(() => this.loadOrders(), 2000);
                errorMessage += ` Автоматична спроба повтору ${this.retryCount}/${this.maxRetries}...`;
            } else {
                // Показуємо кнопку для ручного повтору
                this.showErrorWithRetry(errorMessage);
                return;
            }

            this.showError(errorMessage);
        }
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        
        if (!ordersList) {
            console.error('Елемент ordersList не знайдений');
            return;
        }
        
        ordersList.innerHTML = this.orders.map(order => this.createOrderCard(order)).join('');
        
        // Додаємо обробники подій для кнопок "Детальніше"
        this.addOrderDetailsListeners();
    }

    createOrderCard(order) {
        const createdAt = order.createdAt?.toDate ? 
            order.createdAt.toDate().toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Невідома дата';

        const status = this.statusTranslations[order.status] || this.statusTranslations['pending'];
        const paymentMethod = this.paymentMethodTranslations[order.payment?.method] || 'Невідомо';
        const deliveryType = this.deliveryTypeTranslations[order.delivery?.type] || 'Невідомо';

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-number">
                        <h4>Замовлення №${order.orderNumber || order.id}</h4>
                        <span class="order-date">${createdAt}</span>
                    </div>
                    <div class="order-status ${status.class}">
                        <i class="${status.icon}"></i>
                        ${status.text}
                    </div>
                </div>

                <div class="order-summary">
                    <div class="summary-item">
                        <span class="label">Товарів:</span>
                        <span class="value">${order.totals?.itemsCount || order.items?.length || 0} шт.</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Загальна вага:</span>
                        <span class="value">${(order.totals?.totalWeight || 0).toFixed(2)} кг</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Доставка:</span>
                        <span class="value">${deliveryType}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Оплата:</span>
                        <span class="value">${paymentMethod}</span>
                    </div>
                </div>

                <div class="order-total">
                    <div class="total-amount">
                        <span class="total-label">До сплати:</span>
                        <span class="total-value">${(order.totals?.total || 0).toFixed(2)} ₴</span>
                    </div>
                </div>

                <div class="order-items-preview">
                    <h5>Товари в замовленні:</h5>
                    <div class="items-list">
                        ${this.renderOrderItemsPreview(order.items || [])}
                    </div>
                </div>

                <div class="order-actions">
                    <button class="btn btn-outline btn-details" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i>
                        Детальніше
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-outline btn-cancel" data-order-id="${order.id}">
                            <i class="fas fa-times"></i>
                            Скасувати
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderOrderItemsPreview(items) {
        if (!items || items.length === 0) {
            return '<p class="no-items">Немає товарів</p>';
        }

        return items.slice(0, 3).map(item => `
            <div class="item-preview">
                <div class="item-info">
                    <span class="item-name">${item.name || 'Невідомий товар'}</span>
                    <span class="item-details">
                        ${item.quantity || 0} шт. × ${(item.price || 0).toFixed(2)} ₴
                    </span>
                </div>
                <div class="item-total">
                    ${(item.total || item.quantity * item.price || 0).toFixed(2)} ₴
                </div>
            </div>
        `).join('') + (items.length > 3 ? `<div class="more-items">... і ще ${items.length - 3} товар(ів)</div>` : '');
    }

    addOrderDetailsListeners() {
        // Обробник для кнопок "Детальніше"
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('.btn-details').dataset.orderId;
                this.showOrderDetails(orderId);
            });
        });

        // Обробник для кнопок "Скасувати"
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('.btn-cancel').dataset.orderId;
                this.cancelOrder(orderId);
            });
        });
    }

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showError('Замовлення не знайдено');
            return;
        }

        // Створюємо модальне вікно з деталями замовлення
        this.createOrderDetailsModal(order);
    }

    // ... (решта методів залишаються без змін)

    showEmptyState() {
        const ordersLoading = document.getElementById('ordersLoading');
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');

        if (ordersLoading) ordersLoading.style.display = 'none';
        if (ordersList) ordersList.style.display = 'none';
        if (noOrders) noOrders.style.display = 'block';
    }

    showError(message) {
        console.error(message);
        
        // Створюємо або оновлюємо елемент для показу помилок
        let errorElement = document.getElementById('errorMessage');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessage';
            errorElement.className = 'alert alert-danger';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f8d7da;
                border: 1px solid #f1b0b7;
                color: #721c24;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; 
                    border: none; 
                    color: #721c24; 
                    font-size: 16px; 
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
        `;

        // Автоматично приховуємо через 5 секунд
        setTimeout(() => {
            if (errorElement && errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    showErrorWithRetry(message) {
        console.error(message);
        
        // Створюємо елемент з кнопкою повтору
        let errorElement = document.getElementById('errorMessageRetry');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessageRetry';
            errorElement.className = 'alert alert-danger';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f8d7da;
                border: 1px solid #f1b0b7;
                color: #721c24;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1001;
                max-width: 400px;
            `;
            document.body.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
                <button onclick="window.ordersHistory.retryLoad()" style="
                    background-color: #721c24; 
                    border: none; 
                    color: white; 
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Спробувати знову</button>
            </div>
        `;
    }

    retryLoad() {
        // Приховуємо повідомлення про помилку
        const errorElement = document.getElementById('errorMessageRetry');
        if (errorElement) {
            errorElement.remove();
        }
        
        // Скидаємо лічильник і пробуємо знову
        this.retryCount = 0;
        this.loadOrders();
    }

    showSuccess(message) {
        console.log(message);
        
        // Створюємо елемент для показу успішних повідомлень
        const successElement = document.createElement('div');
        successElement.className = 'alert alert-success';
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            max-width: 400px;
        `;
        
        successElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; 
                    border: none; 
                    color: #155724; 
                    font-size: 16px; 
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(successElement);

        // Автоматично приховуємо через 3 секунди
        setTimeout(() => {
            if (successElement && successElement.parentNode) {
                successElement.remove();
            }
        }, 3000);
    }

    // Метод для діагностики
    async diagnose() {
        console.log('=== Діагностика Firebase ===');
        console.log('Navigator online:', navigator.onLine);
        console.log('Firebase доступний:', typeof firebase !== 'undefined');
        console.log('Firestore доступний:', this.db !== null);
        console.log('Auth доступний:', this.auth !== null);
        console.log('Поточний користувач:', this.currentUser);
        
        if (this.currentUser) {
            try {
                // Пробуємо простий запит до Firestore
                const testDoc = await this.db.collection('orders').limit(1).get();
                console.log('Тест підключення до Firestore: УСПІШНО');
                console.log('Кількість документів у тесті:', testDoc.size);
            } catch (error) {
                console.log('Тест підключення до Firestore: ПОМИЛКА');
                console.error(error);
            }
        }
    }
}

// Додаємо CSS для анімації
const additionalStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

if (!document.getElementById('additional-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'additional-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
}

// Глобальна змінна для доступу до екземпляра
let ordersHistory;

// Ініціалізуємо клас при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    ordersHistory = new OrdersHistory();
    window.ordersHistory = ordersHistory; // Для доступу з консолі
});

// Функція для закриття модального вікна
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.remove();
    }
}