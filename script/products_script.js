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
