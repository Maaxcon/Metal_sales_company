// Глобальні змінні
let currentUser = null;

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    // Перевірка авторизації
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            loadUserProfile();
            setupEventListeners();
            loadOrdersAlternative(); // Використовуємо альтернативний метод
        } else {
            // Перенаправлення на сторінку входу, якщо користувач не авторизований
            window.location.href = 'login.html';
        }
    });
});

// Налаштування слухачів подій
function setupEventListeners() {
    // Навігація по секціях
    const navItems = document.querySelectorAll('.profile-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Форма профілю
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }

    // Форма зміни паролю
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }

    // Форма налаштувань
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }

    // Кнопка скасування
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', loadUserProfile);
    }

    // Вихід з системи
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Перевірка сили паролю
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    }
}

// Показ конкретної секції
function showSection(sectionName) {
    // Приховати всі секції
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Показати обрану секцію
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Оновити навігацію
    const navItems = document.querySelectorAll('.profile-nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });

    // Завантажити замовлення при переході на відповідну секцію
    if (sectionName === 'orders') {
        loadOrdersAlternative(); // Використовуємо альтернативний метод
    }
}

// Завантаження профілю користувача
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Заповнення форми
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('email').value = currentUser.email || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('company').value = userData.company || '';
            document.getElementById('position').value = userData.position || '';
            document.getElementById('address').value = userData.address || '';
            
            // Оновлення імені користувача в хедері
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = userData.firstName ? `${userData.firstName} ${userData.lastName}` : 'Користувач';
            }
        } else {
            // Якщо профіль не існує, створюємо базовий
            document.getElementById('email').value = currentUser.email || '';
        }
    } catch (error) {
        console.error('Помилка завантаження профілю:', error);
        showAlert('profileAlert', 'Помилка завантаження профілю', 'error');
    }
}

// Збереження профілю
async function saveProfile(e) {
    e.preventDefault();
    
    if (!currentUser) return;

    const formData = new FormData(e.target);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        position: formData.get('position'),
        address: formData.get('address'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('users').doc(currentUser.uid).set(profileData, { merge: true });
        showAlert('profileAlert', 'Профіль успішно оновлено!', 'success');
        
        // Оновлення імені в хедері
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `${profileData.firstName} ${profileData.lastName}`;
        }
    } catch (error) {
        console.error('Помилка збереження профілю:', error);
        showAlert('profileAlert', 'Помилка збереження профілю', 'error');
    }
}

// Завантаження замовлень
async function loadOrders() {
    if (!currentUser) return;

    const ordersLoading = document.getElementById('ordersLoading');
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    // Показати індикатор завантаження
    ordersLoading.style.display = 'block';
    ordersList.style.display = 'none';
    noOrders.style.display = 'none';

    try {
        // Спочатку пробуємо з сортуванням
        let ordersSnapshot;
        try {
            ordersSnapshot = await db.collection('orders')
                .where('userId', '==', currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
        } catch (indexError) {
            // Якщо індекс не створений, завантажуємо без сортування
            console.log('Індекс не знайдено, завантажуємо без сортування...');
            ordersSnapshot = await db.collection('orders')
                .where('userId', '==', currentUser.uid)
                .get();
        }

        ordersLoading.style.display = 'none';

        if (ordersSnapshot.empty) {
            noOrders.style.display = 'block';
        } else {
            ordersList.style.display = 'block';
            
            // Сортуємо вручну якщо потрібно
            const orders = ordersSnapshot.docs.sort((a, b) => {
                const aDate = a.data().createdAt?.toDate() || new Date(0);
                const bDate = b.data().createdAt?.toDate() || new Date(0);
                return bDate - aDate; // Сортування по спаданню (нові першими)
            });
            
            renderOrders(orders);
        }
    } catch (error) {
        console.error('Помилка завантаження замовлень:', error);
        ordersLoading.style.display = 'none';
        noOrders.style.display = 'block';
    }
}

// Завантаження замовлень (альтернативний метод)
async function loadOrdersAlternative() {
    if (!currentUser) return;

    const ordersLoading = document.getElementById('ordersLoading');
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    // Показати індикатор завантаження
    ordersLoading.style.display = 'block';
    ordersList.style.display = 'none';
    noOrders.style.display = 'none';

    try {
        // Завантажуємо всі замовлення і фільтруємо на клієнті
        const allOrdersSnapshot = await db.collection('orders').get();
        
        // Фільтруємо замовлення поточного користувача
        const userOrders = allOrdersSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.userId === currentUser.uid || data.userEmail === currentUser.email;
        });

        ordersLoading.style.display = 'none';

        if (userOrders.length === 0) {
            noOrders.style.display = 'block';
        } else {
            ordersList.style.display = 'block';
            
            // Сортуємо по даті створення (нові першими)
            const sortedOrders = userOrders.sort((a, b) => {
                const aDate = a.data().createdAt?.toDate() || new Date(0);
                const bDate = b.data().createdAt?.toDate() || new Date(0);
                return bDate - aDate;
            });
            
            renderOrders(sortedOrders);
        }
    } catch (error) {
        console.error('Помилка завантаження замовлень:', error);
        ordersLoading.style.display = 'none';
        
        // Показуємо повідомлення про помилку
        ordersList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                Помилка завантаження замовлень. Спробуйте пізніше.
            </div>
        `;
        ordersList.style.display = 'block';
    }
}
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    orders.forEach(orderDoc => {
        const order = { id: orderDoc.id, ...orderDoc.data() };
        const orderElement = createOrderElement(order);
        ordersList.appendChild(orderElement);
    });


// Створення елемента замовлення
function createOrderElement(order) {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    
    const createdAt = order.createdAt ? order.createdAt.toDate() : new Date();
    const formattedDate = createdAt.toLocaleDateString('uk-UA');
    
    const statusText = getStatusText(order.status);
    const statusClass = getStatusClass(order.status);

    orderDiv.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <h3 class="order-number">Замовлення №${order.orderNumber || order.id}</h3>
                <div class="order-meta">
                    <span class="order-date">
                        <i class="fas fa-calendar"></i>
                        ${formattedDate}
                    </span>
                    <span class="order-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusText}
                    </span>
                </div>
            </div>
            <div class="order-total">
                <span class="total-amount">${order.totals?.total?.toFixed(2) || '0.00'} ₴</span>
            </div>
        </div>
        
        <div class="order-items">
            ${order.items ? order.items.map(item => `
                <div class="order-item-row">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-details">
                            ${item.profileNumber ? `${item.profileNumber}, ` : ''}
                            ${item.length ? `${item.length}мм, ` : ''}
                            ${item.thickness ? `товщина ${item.thickness}мм` : ''}
                        </span>
                    </div>
                    <div class="item-quantity">×${item.quantity}</div>
                    <div class="item-price">${item.total?.toFixed(2) || item.price?.toFixed(2) || '0.00'} ₴</div>
                </div>
            `).join('') : ''}
        </div>
        
        ${order.delivery ? `
            <div class="order-delivery">
                <h4><i class="fas fa-truck"></i> Доставка</h4>
                <p>
                    ${order.delivery.type === 'nova-poshta' ? 'Нова Пошта' : 'Самовивіз'}
                    ${order.delivery.city ? `, ${order.delivery.city}` : ''}
                    ${order.delivery.warehouse ? `, відділення №${order.delivery.warehouse}` : ''}
                </p>
            </div>
        ` : ''}
        
        <div class="order-actions">
            <button class="btn btn-outline" onclick="viewOrderDetails('${order.id}')">
                <i class="fas fa-eye"></i>
                Детальніше
            </button>
            ${order.status === 'pending' ? `
                <button class="btn btn-danger" onclick="cancelOrder('${order.id}')">
                    <i class="fas fa-times"></i>
                    Скасувати
                </button>
            ` : ''}
        </div>
    `;

    return orderDiv;
}

// Отримання тексту статусу
function getStatusText(status) {
    const statusMap = {
        'pending': 'Очікує обробки',
        'processing': 'Обробляється',
        'shipped': 'Відправлено',
        'delivered': 'Доставлено',
        'cancelled': 'Скасовано'
    };
    return statusMap[status] || 'Невідомий статус';
}

// Отримання CSS класу для статусу
function getStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classMap[status] || 'status-unknown';
}

// Перегляд деталей замовлення
function viewOrderDetails(orderId) {
    // Тут можна реалізувати модальне вікно з деталями
    alert(`Перегляд замовлення ${orderId}`);
}

// Скасування замовлення
async function cancelOrder(orderId) {
    if (!confirm('Ви впевнені, що хочете скасувати це замовлення?')) {
        return;
    }

    try {
        await db.collection('orders').doc(orderId).update({
            status: 'cancelled',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('ordersAlert', 'Замовлення скасовано', 'success');
        loadOrders(); // Перезавантажити список
    } catch (error) {
        console.error('Помилка скасування замовлення:', error);
        showAlert('ordersAlert', 'Помилка скасування замовлення', 'error');
    }
}

// Зміна паролю
async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showAlert('passwordAlert', 'Паролі не співпадають', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('passwordAlert', 'Пароль повинен містити мінімум 6 символів', 'error');
        return;
    }

    try {
        // Переавторизація користувача
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        
        await currentUser.reauthenticateWithCredential(credential);
        
        // Оновлення паролю
        await currentUser.updatePassword(newPassword);
        
        showAlert('passwordAlert', 'Пароль успішно змінено!', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        console.error('Помилка зміни паролю:', error);
        let errorMessage = 'Помилка зміни паролю';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Неправильний поточний пароль';
        }
        
        showAlert('passwordAlert', errorMessage, 'error');
    }
}

// Перевірка сили паролю
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    let strength = 0;
    let text = '';
    let color = '';
    
    if (password.length >= 6) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    
    switch (strength) {
        case 0:
        case 1:
            text = 'Слабкий пароль';
            color = '#ff4757';
            break;
        case 2:
        case 3:
            text = 'Середній пароль';
            color = '#ffa502';
            break;
        case 4:
        case 5:
            text = 'Сильний пароль';
            color = '#2ed573';
            break;
    }
    
    strengthFill.style.width = (strength * 20) + '%';
    strengthFill.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

// Збереження налаштувань
async function saveSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        notifications: formData.get('notifications') === 'on',
        newsletter: formData.get('newsletter') === 'on',
        language: formData.get('language')
    };

    try {
        await db.collection('users').doc(currentUser.uid)
            .set({ settings }, { merge: true });
            
        showAlert('settingsAlert', 'Налаштування збережено!', 'success');
    } catch (error) {
        console.error('Помилка збереження налаштувань:', error);
        showAlert('settingsAlert', 'Помилка збереження налаштувань', 'error');
    }
}

// Вихід з системи
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Помилка виходу:', error);
    }
}

// Показ сповіщень
function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alertClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 'alert-info';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                               type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    
    // Автоматично приховати через 5 секунд
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}