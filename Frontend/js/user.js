const API_BASE = 'http://localhost:8080/api/books';
const ORDER_API = 'http://localhost:8080/api/orders';

let books = [];
let cart = [];

// DOM refs
const productsContainer = document.getElementById('products');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('search');
const cartItemsContainer = document.getElementById('cartItems');
const subtotalSpan = document.getElementById('subtotal');
const taxSpan = document.getElementById('tax');
const totalSpan = document.getElementById('total');
const receiptContainer = document.getElementById('receipt');

// Load books from backend
async function fetchBooks() {
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        books = await res.json();
        renderBooks(books);
    } catch (err) {
        console.error('Failed to load books:', err);
        productsContainer.innerHTML = `<p class="text-red-500">Failed to load books. Please try again later.</p>`;
    }
}

// Render book cards
function renderBooks(bookList) {
    productsContainer.innerHTML = '';
    bookList.forEach(book => {
        const card = document.createElement('div');
        card.className = 'bg-white shadow-md p-4 rounded-lg flex flex-col items-center';

        card.innerHTML = `
            <img src="images/${book.imageUrl}" alt="${book.title}" class="w-32 h-40 object-cover mb-4">
            <h3 class="text-lg font-semibold">${book.title}</h3>
            <p class="text-gray-500">${book.category}</p>
            <p class="text-blue-600 font-bold mt-2">Rs. ${book.price.toFixed(2)}</p>
            <button class="mt-4 bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition" onclick="addToCart(${book.id})">
                Add to Cart
            </button>
        `;
        productsContainer.appendChild(card);
    });
}

// Add to cart
window.addToCart = function (bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const existing = cart.find(item => item.bookId === bookId);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            bookId: book.id,
            title: book.title,
            price: book.price,
            quantity: 1
        });
    }
    renderCart();
}

// Render cart sidebar
function renderCart() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemEl = document.createElement('li');
        itemEl.className = 'flex justify-between items-center';
        itemEl.innerHTML = `
            <span>${item.title} x${item.quantity}</span>
            <span>Rs. ${(item.price * item.quantity).toFixed(2)}</span>
        `;
        cartItemsContainer.appendChild(itemEl);
        subtotal += item.price * item.quantity;
    });

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    subtotalSpan.textContent = subtotal.toFixed(2);
    taxSpan.textContent = tax.toFixed(2);
    totalSpan.textContent = total.toFixed(2);
}

// Category filter
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
        btn.classList.add('bg-blue-500', 'text-white');

        const category = btn.getAttribute('data-category');
        const filtered = category === 'all'
            ? books
            : books.filter(b => b.category.toLowerCase() === category.toLowerCase());

        renderBooks(filtered);
    });
});

// Search filter
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = books.filter(b => b.title.toLowerCase().includes(query));
    renderBooks(filtered);
});

// Clear cart
window.clearCart = function () {
    cart = [];
    renderCart();
    receiptContainer.classList.add('hidden');
}

// Checkout
window.checkout = async function () {
    if (cart.length === 0) return alert('Cart is empty!');

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const orderDTO = {
        customerName: "Walk-in Customer",
        subtotal,
        tax,
        total,
        orderDetails: cart.map(item => ({
            bookId: item.bookId,
            bookTitle: item.title,
            price: item.price,
            quantity: item.quantity
        }))
    };

    try {
        const res = await fetch(ORDER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderDTO)
        });

        if (!res.ok) throw new Error("Order failed");

        showReceipt(orderDTO);
        clearCart();
    } catch (err) {
        console.error("Checkout error:", err);
        alert("Failed to complete order.");
    }
}

// Show receipt
function showReceipt(order) {
    const time = new Date().toLocaleString();
    let html = `<h2 class="text-xl font-bold mb-4">Receipt</h2>`;
    html += `<p><strong>Date:</strong> ${time}</p>`;
    html += `<p><strong>Customer:</strong> ${order.customerName}</p>`;
    html += `<hr class="my-2">`;

    order.orderDetails.forEach(item => {
        html += `
        <div class="flex justify-between">
            <span>${item.bookTitle} (${item.quantity})</span>
            <span>Rs. ${(item.price * item.quantity).toFixed(2)}</span>
        </div>`;
    });

    html += `<hr class="my-2">`;
    html += `<div class="flex justify-between"><strong>Subtotal:</strong><span>Rs. ${order.subtotal.toFixed(2)}</span></div>`;
    html += `<div class="flex justify-between"><strong>Tax (10%):</strong><span>Rs. ${order.tax.toFixed(2)}</span></div>`;
    html += `<div class="flex justify-between text-lg font-bold"><strong>Total:</strong><span>Rs. ${order.total.toFixed(2)}</span></div>`;

    receiptContainer.innerHTML = html;
    receiptContainer.classList.remove('hidden');
}

// Initial load
fetchBooks();
