// Корзина та кнопки додавання до корзини

let add_to_cart = document.querySelectorAll(".add-to-cart-btn"); 
let count_cart = document.querySelector(".cart-count");
let click_on_basket = document.querySelector(".cart-icon");
let cart_modal = document.querySelector(".cart-modal");
let count = 0;

function basket() {
    count++;
    count_cart.innerHTML = count;
}


click_on_basket.addEventListener("click", function() {
    cart_modal.classList.toggle("active");
});


// Кнопка до попередньої сторінки

let back = document.querySelector(".back-button");

back.addEventListener("click", function(){
    window.location.href = "home_page.html"
})





// Cума товарів підрахунок


let mas = [];

function extractNumberFromString(str) {
    let match = str.match(/\d+(\.\d+)?/); 
    return match ? parseFloat(match[0]) : 0; 
}

function suma_price_all() {
    mas = []; 
    let cartItems = document.querySelectorAll(".cart-item"); 

    cartItems.forEach(item => {
        let title = item.querySelector(".cart-item-title")?.innerText;
        let priceText = item.querySelector(".cart-item-price")?.innerText;
        let price = extractNumberFromString(priceText);
        mas.push({ title, price });
    });

    let suma_price = mas.reduce((total, item) => total + item.price, 0);
    let all_suma = document.querySelector(".allq_suma");
    all_suma.innerText = "Загальна сума товарів у кошику: " + suma_price + " $"
}


document.addEventListener("click", function(event) {
    if (event.target.closest(".add-to-cart-btn")) {
        setTimeout(suma_price_all, 0); 
    }
});




// Фільтрація пошуку продуктів 

let input_search = document.querySelector(".input_search");
let search_product_but = document.querySelector(".search_product_but");
let product_title = document.querySelectorAll(".product-title");
let product_card = document.querySelectorAll(".product-card");

search_product_but.addEventListener("click", function () {
    let input_search_value = input_search.value.toLowerCase().trim(); 

    product_title.forEach((title, index) => {
        let productText = title.textContent.toLowerCase(); 
        if (productText.includes(input_search_value)) {
            product_card[index].style.display = "block"; 
        } else {
            product_card[index].style.display = "none"; 
        }
    });
});


let quantity_btn_decrease = document.querySelectorAll(".quantity-btn.decrease");
let quantity_btn_increase = document.querySelectorAll(".quantity-btn.increase");
let quantity_inputs = document.querySelectorAll(".quantity-input");

// Додавання обробників подій для кнопок зменшення
function addQuantityEventListeners() {
    quantity_btn_decrease.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            let input = quantity_inputs[index];
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1; // зменшуємо кількість
                suma_price_all(); // Оновити суму товарів
            }
        });
    });

    // Додавання обробників подій для кнопок збільшення
    quantity_btn_increase.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            let input = quantity_inputs[index];
            let value = parseInt(input.value);
            input.value = value + 1; // збільшуємо кількість
            suma_price_all(); // Оновити суму товарів
        });
    });

    // Оновлення суми при ручному введенні кількості
    quantity_inputs.forEach(input => {
        input.addEventListener("input", () => {
            let value = parseInt(input.value);
            if (value < 1 || isNaN(value)) {
                input.value = 1; // Встановлюємо мінімум 1, якщо введено некоректне значення
            }
            suma_price_all(); // Оновити суму товарів
        });
    });
}

function newCardInBasket(title, price, imageSrc) {
    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    cartItem.innerHTML = `
        <div class="cart-item-image">
            <img src="${imageSrc}" alt="product">
        </div>
        <div class="cart-item-details">
            <h4 class="cart-item-title">${title}</h4>
            <div class="cart-item-price">${price}</div>
        </div>
        <div class="cart-item-quantity">
            <button class="quantity-btn decrease">
                <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="1" min="1">
            <button class="quantity-btn increase">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <button class="cart-item-remove">
            <i class="fas fa-trash-alt"></i>
        </button>
        
    `;
    document.querySelector('.cart-body').appendChild(cartItem);

    // Додавання подій для нових кнопок
    quantity_btn_decrease = document.querySelectorAll(".quantity-btn.decrease");
    quantity_btn_increase = document.querySelectorAll(".quantity-btn.increase");
    quantity_inputs = document.querySelectorAll(".quantity-input");

    addQuantityEventListeners(); // Переносимо додавання подій для нових елементів
}

add_to_cart.forEach(button => {
    button.addEventListener("click", function() {
        let productCard = this.closest(".product-card");
        let title = productCard.querySelector(".product-title").innerText;
        let price = productCard.querySelector(".price-per-unit").innerText;
        let imageSrc = productCard.querySelector(".product-image").src;

        basket();
        newCardInBasket(title, price, imageSrc);
    });
});



function closeCartModal(){
    cart_modal.classList.remove("active");
}
    

