const userName = document.querySelector(".username");
const password = document.querySelector(".password");
const button_autor = document.querySelector(".button_autor");
const remember = document.querySelector(".remember");

function localStorageFormAut(event) {

    event.preventDefault(); 

    const obj = {
        name: userName.value,
        password: password.value,
        remember:remember.checked
    };

    localStorage.setItem('userData', JSON.stringify(obj));
}

    let key_local_st = localStorage.getItem("userData");
    let parse_key_local_st = JSON.parse(key_local_st);



document.addEventListener("DOMContentLoaded", function () {
    if (parse_key_local_st.remember) { 
        userName.value = parse_key_local_st.name;
        password.value = parse_key_local_st.password;
    }
});

function open_new_window(){
     window.location.href = "home_page.html"
}
button_autor.addEventListener("click", localStorageFormAut);
button_autor.addEventListener("click", open_new_window);


