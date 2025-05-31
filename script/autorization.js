// Замініть ваш код авторизації на цей:
let login = document.querySelector(".have_account");

function loginUserSite(){
    window.location.href = "autorization.html"
}

login.addEventListener("click", loginUserSite)

const userName = document.querySelector(".username");
const password = document.querySelector(".password");
const button_autor = document.querySelector(".button_autor");
const remember = document.querySelector(".remember");

async function loginUser(event) {
    event.preventDefault(); 

    const email = userName.value; // Використовуємо email для входу
    const passwordValue = password.value;

    try {
        // Авторизація через Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, passwordValue);
        const user = userCredential.user;

        // Оновлюємо статус користувача в Firestore
        await db.collection('users').doc(user.uid).update({
            isOnline: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Зберігаємо дані локально якщо потрібно
        if (remember.checked) {
            const obj = {
                email: email,
                remember: true
            };
            localStorage.setItem('userData', JSON.stringify(obj));
        }

        alert('Успішний вхід!');
        window.location.href = "home_page.html";

    } catch (error) {
        console.error('Помилка авторизації:', error);
        alert('Помилка авторизації: ' + error.message);
    }
}

// Завантаження збережених даних
document.addEventListener("DOMContentLoaded", function () {
    const savedData = localStorage.getItem("userData");
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.remember) { 
            userName.value = parsedData.email;
        }
    }
});

button_autor.addEventListener("click", loginUser);