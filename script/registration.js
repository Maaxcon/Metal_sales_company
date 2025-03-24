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

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    alert(data.message);
});
