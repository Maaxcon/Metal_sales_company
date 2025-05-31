// Замініть ваш код реєстрації на цей:
document.querySelector('.form_reg').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('.username').value;
    const email = document.querySelector('.email').value;
    const password = document.querySelector('.password').value;
    const confirmPassword = document.querySelector('.confirm_password').value;

    if (password !== confirmPassword) {
        alert('Паролі не співпадають!');
        return;
    }

    try {
        // Створення користувача в Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Збереження додаткової інформації в Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true
        });

        // Оновлення профілю користувача
        await user.updateProfile({
            displayName: username
        });

        alert('Реєстрація успішна!');
        window.location.href = "home_page.html";

    } catch (error) {
        console.error('Помилка реєстрації:', error);
        alert('Помилка реєстрації: ' + error.message);
    }
});