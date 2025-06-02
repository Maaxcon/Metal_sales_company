// Password change functionality
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordAlert = document.getElementById('passwordAlert');

    // Password validation function
    function validatePassword(password) {
        const minLength = 8;
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasLowerCase && hasUpperCase && hasNumbers,
            minLength: password.length >= minLength,
            hasLowerCase,
            hasUpperCase,
            hasNumbers,
            hasSpecialChar
        };
    }

    // Show alert function
    function showAlert(message, type = 'error') {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        passwordAlert.innerHTML = `
            <div class="alert ${alertClass}" style="
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 8px;
                border: 1px solid ${type === 'success' ? '#d4edda' : '#f8d7da'};
                background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
                color: ${type === 'success' ? '#155724' : '#721c24'};
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Auto hide after 5 seconds
        setTimeout(() => {
            passwordAlert.innerHTML = '';
        }, 5000);
    }

    // Re-authenticate user with current password
    async function reauthenticateUser(currentPassword) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Користувач не авторизований');
            }

            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await user.reauthenticateWithCredential(credential);
            return true;
        } catch (error) {
            console.error('Помилка реавторизації:', error);
            throw error;
        }
    }

    // Update password in Firebase Auth
    async function updateUserPassword(newPassword) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Користувач не авторизований');
            }

            await user.updatePassword(newPassword);
            return true;
        } catch (error) {
            console.error('Помилка оновлення паролю:', error);
            throw error;
        }
    }

    // Update user document in Firestore
    async function updateUserDocument() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const userRef = db.collection('users').doc(user.uid);
            await userRef.update({
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                passwordLastChanged: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Помилка оновлення документа користувача:', error);
            // Не кидаємо помилку, так як основна зміна паролю пройшла успішно
        }
    }

    // Main password change function
    async function changePassword(currentPassword, newPassword) {
        try {
            // Show loading state
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Зміна паролю...';

            // Step 1: Re-authenticate user
            await reauthenticateUser(currentPassword);

            // Step 2: Update password in Firebase Auth
            await updateUserPassword(newPassword);

            // Step 3: Update user document in Firestore
            await updateUserDocument();

            // Success
            showAlert('Пароль успішно змінено!', 'success');
            passwordForm.reset();

            // Restore button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;

            // Clear password strength indicator
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            if (strengthFill && strengthText) {
                strengthFill.style.width = '0%';
                strengthText.textContent = 'Введіть новий пароль';
                strengthText.style.color = '#6c757d';
            }

            return true;

        } catch (error) {
            // Restore button state
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-key"></i> Змінити пароль';

            // Handle specific error cases
            let errorMessage = 'Сталася помилка при зміні паролю';

            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Поточний пароль введено неправильно';
                    currentPasswordInput.focus();
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Новий пароль занадто слабкий. Використовуйте мінімум 6 символів';
                    newPasswordInput.focus();
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Для зміни паролю потрібно повторно увійти в систему';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Користувача не знайдено';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Занадто багато спроб. Спробуйте пізніше';
                    break;
                default:
                    if (error.message) {
                        errorMessage = error.message;
                    }
            }

            showAlert(errorMessage, 'error');
            return false;
        }
    }

    // Form submission handler
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPassword = currentPasswordInput.value.trim();
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // Clear previous alerts
            passwordAlert.innerHTML = '';

            // Validate form fields
            if (!currentPassword) {
                showAlert('Введіть поточний пароль', 'error');
                currentPasswordInput.focus();
                return;
            }

            if (!newPassword) {
                showAlert('Введіть новий пароль', 'error');
                newPasswordInput.focus();
                return;
            }

            if (!confirmPassword) {
                showAlert('Підтвердіть новий пароль', 'error');
                confirmPasswordInput.focus();
                return;
            }

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                showAlert('Паролі не співпадають', 'error');
                confirmPasswordInput.focus();
                return;
            }

            // Check if new password is different from current
            if (currentPassword === newPassword) {
                showAlert('Новий пароль повинен відрізнятися від поточного', 'error');
                newPasswordInput.focus();
                return;
            }

            // Validate new password strength
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                let errorMessage = 'Новий пароль не відповідає вимогам безпеки:\n';
                if (!passwordValidation.minLength) errorMessage += '• Мінімум 8 символів\n';
                if (!passwordValidation.hasLowerCase) errorMessage += '• Мінімум одна мала літера\n';
                if (!passwordValidation.hasUpperCase) errorMessage += '• Мінімум одна велика літера\n';
                if (!passwordValidation.hasNumbers) errorMessage += '• Мінімум одна цифра\n';
                
                showAlert(errorMessage.replace(/\n/g, '<br>'), 'error');
                newPasswordInput.focus();
                return;
            }

            // Check if user is authenticated
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                showAlert('Користувач не авторизований. Будь ласка, увійдіть в систему', 'error');
                return;
            }

            // Proceed with password change
            await changePassword(currentPassword, newPassword);
        });
    }

    // Real-time password confirmation validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = this.value;

            if (confirmPassword && newPassword !== confirmPassword) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            } else {
                this.style.borderColor = '#ddd';
                this.style.boxShadow = 'none';
            }
        });
    }

    // Clear form on cancel button click (if exists)
    const cancelButton = document.getElementById('cancelPasswordBtn');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            passwordForm.reset();
            passwordAlert.innerHTML = '';
            
            // Reset password strength indicator
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            if (strengthFill && strengthText) {
                strengthFill.style.width = '0%';
                strengthText.textContent = 'Введіть новий пароль';
                strengthText.style.color = '#6c757d';
            }
        });
    }

    // Add password visibility toggle functionality
    function addPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        toggleButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 4px;
            font-size: 14px;
        `;

        // Wrap input in relative container
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        wrapper.appendChild(toggleButton);

        toggleButton.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    // Add password visibility toggles
    addPasswordToggle('currentPassword');
    addPasswordToggle('newPassword');
    addPasswordToggle('confirmPassword');
});

// Export function for external use if needed
window.changeUserPassword = {
    validatePassword: function(password) {
        const minLength = 8;
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);

        return {
            isValid: password.length >= minLength && hasLowerCase && hasUpperCase && hasNumbers,
            minLength: password.length >= minLength,
            hasLowerCase,
            hasUpperCase,
            hasNumbers
        };
    }
};