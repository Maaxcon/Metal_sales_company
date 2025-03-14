const buttonSendEmailHome = document.querySelector(".button_send_email_home");

function closeErrorWindow() {
    document.getElementById('errorWindow').classList.remove('show');
}

function showErrorWindow(message) {
    const errorMessageElement = document.querySelector(".error_message");
    errorMessageElement.textContent = message || "Ви некоректно заповнили поле вводу. Будь ласка, перевірте дані та спробуйте знову.";
    document.getElementById('errorWindow').classList.add('show');
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

const funButtonSendEmailHome = function() {
    const emailInput = document.querySelector(".email_send_home");
    const emailSendHome = emailInput.value.trim();
    
    if(emailSendHome === "") {
        showErrorWindow("Будь ласка, введіть електронну адресу.");
        return;
    }
    
    if(!validateEmail(emailSendHome)) {
        showErrorWindow("Будь ласка, введіть коректну електронну адресу.");
        return;
    }
    

    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailSendHome }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            
            emailInput.value = '';
            alert("Дякуємо! Вашу електронну адресу успішно додано до розсилки.");
        } else {
            showErrorWindow(data.message || "Виникла помилка при відправці. Спробуйте пізніше.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorWindow("Виникла помилка при відправці. Перевірте підключення до інтернету та спробуйте знову.");
    });
};

buttonSendEmailHome.addEventListener("click", funButtonSendEmailHome);