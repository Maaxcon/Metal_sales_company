// profile-data.js - Скрипт для роботи з особистими даними користувача

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileForm = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        // Ініціалізація після завантаження DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.profileForm = document.getElementById('profileForm');
            this.setupEventListeners();
            this.checkAuthState();
        });
    }

    checkAuthState() {
        // Перевіряємо стан авторизації
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProfile();
            } else {
                console.log('Користувач не авторизований');
                // Перенаправлення на сторінку входу або показ повідомлення
                this.handleUnauthenticated();
            }
        });
    }

    setupEventListeners() {
        if (this.profileForm) {
            this.profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });

            // Кнопка скасування
            const cancelBtn = document.getElementById('cancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.loadUserProfile(); // Перезавантажуємо дані
                });
            }
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) {
            console.error('Користувач не авторизований');
            return;
        }

        try {
            this.setLoadingState(true);
            
            // Отримуємо документ користувача з Firestore
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                this.populateForm(userData);
                this.showAlert('success', 'Дані успішно завантажені');
            } else {
                // Якщо документа немає, створюємо новий з базовими даними
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Помилка завантаження профілю:', error);
            this.showAlert('error', 'Помилка завантаження даних: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    populateForm(userData) {
        // Заповнюємо форму даними користувача
        const fields = [
            'firstName',
            'lastName', 
            'email',
            'phone',
            'company',
            'position'
        ];

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && userData[field]) {
                input.value = userData[field];
            }
        });

        // Email завжди береться з Firebase Auth
        const emailInput = document.getElementById('email');
        if (emailInput && this.currentUser.email) {
            emailInput.value = this.currentUser.email;
        }
    }

    async createUserProfile() {
        if (!this.currentUser) return;

        const initialData = {
            email: this.currentUser.email,
            firstName: '',
            lastName: '',
            phone: '',
            company: '',
            position: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .set(initialData);
            
            this.populateForm(initialData);
            console.log('Профіль користувача створено');
        } catch (error) {
            console.error('Помилка створення профілю:', error);
            this.showAlert('error', 'Помилка створення профілю: ' + error.message);
        }
    }

    async saveProfile() {
        if (!this.currentUser || this.isLoading) return;

        try {
            this.setLoadingState(true);
            
            // Збираємо дані з форми
            const formData = this.getFormData();
            
            // Валідація
            if (!this.validateFormData(formData)) {
                return;
            }

            // Додаємо timestamp оновлення
            formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            // Зберігаємо в Firestore
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .update(formData);

            this.showAlert('success', 'Дані успішно збережені!');
            
        } catch (error) {
            console.error('Помилка збереження:', error);
            this.showAlert('error', 'Помилка збереження: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    getFormData() {
        const formData = {};
        const fields = ['firstName', 'lastName', 'phone', 'company', 'position'];

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                formData[field] = input.value.trim();
            }
        });

        return formData;
    }

    validateFormData(data) {
        // Перевіряємо обов'язкові поля
        if (!data.firstName) {
            this.showAlert('error', 'Поле "Ім\'я" є обов\'язковим');
            document.getElementById('firstName').focus();
            return false;
        }

        if (!data.lastName) {
            this.showAlert('error', 'Поле "Прізвище" є обов\'язковим');
            document.getElementById('lastName').focus();
            return false;
        }

        // Валідація телефону (якщо заповнений)
        if (data.phone && !this.validatePhone(data.phone)) {
            this.showAlert('error', 'Некоректний формат телефону');
            document.getElementById('phone').focus();
            return false;
        }

        return true;
    }

    validatePhone(phone) {
        // Простий регулярний вираз для українських номерів
        const phoneRegex = /^(\+380|380|0)[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const submitBtn = this.profileForm?.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Збереження...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Зберегти зміни';
            }
        }

        // Блокуємо/розблокуємо поля форми
        const inputs = this.profileForm?.querySelectorAll('input:not([readonly])');
        if (inputs) {
            inputs.forEach(input => {
                input.disabled = loading;
            });
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('profileAlert');
        if (!alertContainer) return;

        const alertClass = type === 'success' ? 'success' : 'error';
        const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        alertContainer.innerHTML = `
            <div class="alert alert-${alertClass}" style="
                padding: 15px;
                margin-bottom: 20px;
                border: 1px solid;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                ${type === 'success' 
                    ? 'background-color: #d4edda; border-color: #c3e6cb; color: #155724;' 
                    : 'background-color: #f8d7da; border-color: #f5c6cb; color: #721c24;'
                }
            ">
                <i class="fas ${iconClass}"></i>
                <span>${message}</span>
            </div>
        `;

        // Автоматично приховуємо повідомлення через 5 секунд
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    handleUnauthenticated() {
        // Показуємо повідомлення про необхідність авторизації
        this.showAlert('error', 'Для доступу до профілю необхідно увійти в систему');
        
        // Можна перенаправити на сторінку входу
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    // Додаткові методи для роботи з профілем

    async getUserProfile() {
        if (!this.currentUser) return null;

        try {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .get();

            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            console.error('Помилка отримання профілю:', error);
            return null;
        }
    }

    async updateUserField(field, value) {
        if (!this.currentUser) return false;

        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .update({
                    [field]: value,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            return true;
        } catch (error) {
            console.error(`Помилка оновлення поля ${field}:`, error);
            return false;
        }
    }

    formatPhone(phone) {
        // Форматування телефону для відображення
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('380')) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
        }
        return phone;
    }
}

// Ініціалізуємо менеджер профілю
const profileManager = new ProfileManager();

// Експортуємо для використання в інших скриптах
window.ProfileManager = ProfileManager;
window.profileManager = profileManager;