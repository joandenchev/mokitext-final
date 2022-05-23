const tokenA = localStorage.getItem('tokenA')
const tokenR = localStorage.getItem('tokenR')

if (tokenA == null) { window.location.href = "http://localhost:3000/login.html" }
