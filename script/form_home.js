// кнопка email

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

// кнопка авторизації

let register = document.querySelector(".login-btn");

function registerUserSite(){
    window.location.href = "registration.html"
}

register.addEventListener("click", registerUserSite)

// кнопка "Почати покупки" - прокручування до категорій

let star_shop_btn = document.querySelector(".btn.btn-primary");

star_shop_btn.addEventListener("click", function(){
    // Знаходимо секцію з категоріями продуктів
    const productCategoriesSection = document.querySelector(".product-categories");
    
    if (productCategoriesSection) {
        // Плавне прокручування до секції
        productCategoriesSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Альтернативно можна прокрутити до заголовка секції
        // const categoriesTitle = document.querySelector(".featured-title");
        // if (categoriesTitle) {
        //     categoriesTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // }
    }
});

// Обробники для кнопок категорій

// Функція для переходу на відповідну сторінку категорії
function handleCategoryClick(categoryId) {
    const categoryPages = {
        'armatura': 'products.html',
        'sheets': 'flat_products.html', 
        'pipes': 'products.html',        // або створіть окрему сторінку для труб
        'corners': 'products.html',      // або створіть окрему сторінку для кутків
        'square': 'square_products.html'
    };
    
    const targetPage = categoryPages[categoryId];
    if (targetPage) {
        window.location.href = targetPage;
    } else {
        // Якщо немає специфічної сторінки, переходимо на загальну сторінку продуктів
        window.location.href = 'products.html';
    }
}

// Додаємо обробники подій для всіх кнопок категорій
document.addEventListener('DOMContentLoaded', function() {
    
    // Обробник для кнопок "Переглянути" в категоріях
    const categoryViewButtons = document.querySelectorAll('.category-view-button');
    
    categoryViewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-category-id');
            handleCategoryClick(categoryId);
        });
    });
    
    // Обробник для кліку по всій картці категорії (опціонально)
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Перевіряємо, чи клік був не по кнопці "Переглянути"
            if (!e.target.classList.contains('category-view-button')) {
                const categoryId = this.getAttribute('data-category-id');
                handleCategoryClick(categoryId);
            }
        });
        
        // Додаємо hover ефект для кращого UX
        card.style.cursor = 'pointer';
    });
    
    // Якщо є кнопки постачальників (розкоментувати при потребі)
    /*
    const supplierViewButtons = document.querySelectorAll('.supplier-view-button');
    
    supplierViewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const supplierId = this.getAttribute('data-supplier-id');
            // Тут можна додати логіку для переходу на сторінку постачальника
            window.location.href = `supplier.html?id=${supplierId}`;
        });
    });
    */
});

const profileButton = document.querySelector(".profile-btn"); // або інший селектор для кнопки профілю

function openProfilePage() {
    window.location.href = "person.html";
}

// Перевіряємо, чи існує кнопка профілю на сторінці
if (profileButton) {
    profileButton.addEventListener("click", openProfilePage);
}
