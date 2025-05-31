// Створіть новий файл auth.js та підключіть його на головній сторінці

// Перевірка стану авторизації при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async (user) => {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');

        if (user) {
            // Користувач увійшов
            try {
                // Отримуємо дані користувача з Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();

                // Показуємо профіль користувача
                loginBtn.style.display = 'none';
                userProfile.style.display = 'block';
                userName.textContent = userData.username || user.displayName || 'Користувач';

            } catch (error) {
                console.error('Помилка отримання даних користувача:', error);
                userName.textContent = user.displayName || 'Користувач';
                loginBtn.style.display = 'none';
                userProfile.style.display = 'block';
            }
        } else {
            // Користувач не увійшов
            loginBtn.style.display = 'block';
            userProfile.style.display = 'none';
        }
    });

    // Обробник кнопки входу
    document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = 'autorization.html';
    });

    // Обробник кнопки виходу
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            // Оновлюємо статус користувача в Firestore
            const user = auth.currentUser;
            if (user) {
                await db.collection('users').doc(user.uid).update({
                    isOnline: false,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await auth.signOut();
            localStorage.removeItem('userData');
            alert('Ви успішно вийшли з системи');
            
        } catch (error) {
            console.error('Помилка виходу:', error);
            alert('Помилка при виході з системи');
        }
    });

    // Обробник кнопки профілю
    document.getElementById('profileBtn').addEventListener('click', () => {
        // Тут можна додати перехід на сторінку профілю
        alert('Функція профілю буде додана пізніше');
    });
});

// Функція для отримання поточного користувача
function getCurrentUser() {
    return auth.currentUser;
}

// Функція для перевірки, чи користувач увійшов
function isUserLoggedIn() {
    return !!auth.currentUser;
}