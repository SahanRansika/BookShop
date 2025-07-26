document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "http://localhost:8080/api/books";

    // Elements
    const openAddBookBtn = document.getElementById('openAddBookBtn');
    const cancelAddBookBtn = document.getElementById('cancelAddBookBtn');
    const addBookModal = document.getElementById('addBookModal');
    const addBookForm = document.getElementById('addBookForm');
    const previewImage = document.getElementById('previewImage');
    const bookImageFile = document.getElementById('bookImageFile');
    const productsTbody = document.getElementById('products');
    const searchInput = document.getElementById('search');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const saveBtn = addBookForm.querySelector('button[type="submit"]');

    let booksData = [];
    let editBookId = null;  // null means create mode, else update mode

    // Show modal for create
    openAddBookBtn.addEventListener('click', () => {
        editBookId = null;
        resetForm();
        saveBtn.textContent = "Save";
        addBookModal.classList.remove('hidden');
    });

    // Hide modal and reset form
    cancelAddBookBtn.addEventListener('click', () => {
        addBookModal.classList.add('hidden');
        resetForm();
    });

    // Reset form helper
    function resetForm() {
        addBookForm.reset();
        previewImage.classList.add('hidden');
        previewImage.src = '#';
        editBookId = null;
    }

    // Image preview on file select
    bookImageFile.addEventListener('change', () => {
        const file = bookImageFile.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            previewImage.src = previewUrl;
            previewImage.classList.remove('hidden');
        } else {
            previewImage.src = '#';
            previewImage.classList.add('hidden');
        }
    });

    // Submit form (create or update)
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('bookName').value.trim();
        const category = document.getElementById('bookCategory').value;
        const qty = parseInt(document.getElementById('bookQty').value, 10);
        const price = parseFloat(document.getElementById('bookPrice').value);
        const imageFile = bookImageFile.files[0];

        if (!title || !category || !qty || isNaN(price)) {
            alert("Please fill in all required fields properly.");
            return;
        }

        // For create: imageFile is required
        if (!editBookId && !imageFile) {
            alert("Please select an image file.");
            return;
        }

        // Book data object without imageUrl (backend sets or updates)
        const book = { title, category, qty, price, imageUrl: "" };

        try {
            let response;

            if (editBookId) {
                // Update mode
                const formData = new FormData();
                formData.append("book", new Blob([JSON.stringify(book)], { type: "application/json" }));
                if (imageFile) {
                    formData.append("imageFile", imageFile);
                }

                response = await fetch(`${API_BASE}/${editBookId}`, {
                    method: "PUT",
                    body: formData,
                });
            } else {
                // Create mode
                const formData = new FormData();
                formData.append("book", new Blob([JSON.stringify(book)], { type: "application/json" }));
                formData.append("imageFile", imageFile);

                response = await fetch(API_BASE, {
                    method: "POST",
                    body: formData,
                });
            }

            if (!response.ok) {
                throw new Error(editBookId ? "Failed to update book" : "Failed to save book");
            }

            const savedBook = await response.json();
            alert(editBookId ? "Book updated successfully!" : "Book saved successfully!");

            resetForm();
            addBookModal.classList.add('hidden');
            loadBooks();
        } catch (error) {
            console.error(error);
            alert(editBookId ? "Error updating book." : "Error saving book.");
        }
    });

    // Load all books from backend
    async function loadBooks() {
        try {
            const response = await fetch(API_BASE);
            if (!response.ok) throw new Error("Failed to load books");
            booksData = await response.json();
            renderBooks(booksData);
        } catch (error) {
            console.error(error);
            productsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-600">Failed to load books.</td></tr>`;
        }
    }

    // Render books in the table
    function renderBooks(books) {
        if (books.length === 0) {
            productsTbody.innerHTML = `<tr><td colspan="7" class="text-center">No books found.</td></tr>`;
            return;
        }

        productsTbody.innerHTML = ""; // Clear table body

        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-200 hover:bg-gray-100";

            const imageSrc = book.imageUrl
                ? `http://localhost:8080/${book.imageUrl}`
                : 'https://via.placeholder.com/60x80?text=No+Image';

            tr.innerHTML = `
                <td class="py-3 px-6 text-left">${book.id ?? ''}</td>
                <td class="py-3 px-6 text-left">
                  <img src="${imageSrc}" alt="${book.title}" class="w-12 h-16 object-cover rounded" />
                </td>
                <td class="py-3 px-6 text-left">${book.title}</td>
                <td class="py-3 px-6 text-left">${book.category}</td>
                <td class="py-3 px-6 text-left">${book.qty}</td>
                <td class="py-3 px-6 text-left">Rs. ${book.price.toFixed(2)}</td>
                <td class="py-3 px-6 text-left space-x-2">
                  <button
                    class="bg-yellow-400 hover:bg-yellow-500 text-white py-1 px-3 rounded text-sm"
                    data-id="${book.id}"
                    data-action="edit"
                  >Edit</button>
                  <button
                    class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                    data-id="${book.id}"
                    data-action="delete"
                  >Delete</button>
                </td>
            `;

            productsTbody.appendChild(tr);
        });
    }

    // Filter books by search term
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        const filtered = booksData.filter(b => b.title.toLowerCase().includes(term));
        renderBooks(filtered);
    });

    // Category filter buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
            btn.classList.add('bg-blue-500', 'text-white');

            const category = btn.getAttribute('data-category');
            if (category === 'all') {
                renderBooks(booksData);
            } else {
                const filtered = booksData.filter(b => b.category === category);
                renderBooks(filtered);
            }
        });
    });

    // Event delegation for Edit/Delete buttons in table rows
    productsTbody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName !== 'BUTTON') return;

        const action = target.getAttribute('data-action');
        const bookId = target.getAttribute('data-id');

        if (!bookId) return;

        if (action === 'delete') {
            if (confirm("Are you sure you want to delete this book?")) {
                deleteBook(bookId);
            }
        } else if (action === 'edit') {
            openEditModal(bookId);
        }
    });

    // Open modal with book data for editing
    function openEditModal(bookId) {
        const book = booksData.find(b => b.id == bookId);
        if (!book) {
            alert("Book not found");
            return;
        }
        editBookId = book.id;

        document.getElementById('bookName').value = book.title;
        document.getElementById('bookCategory').value = book.category;
        document.getElementById('bookQty').value = book.qty;
        document.getElementById('bookPrice').value = book.price;

        if (book.imageUrl) {
            previewImage.src = `http://localhost:8080/${book.imageUrl}`;
            previewImage.classList.remove('hidden');
        } else {
            previewImage.src = '#';
            previewImage.classList.add('hidden');
        }

        // Clear file input so user can choose new image if they want
        bookImageFile.value = "";

        saveBtn.textContent = "Update";
        addBookModal.classList.remove('hidden');
    }

    // Delete book by id
    async function deleteBook(id) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete book');
            alert('Book deleted successfully');
            loadBooks();
        } catch (error) {
            console.error(error);
            alert('Error deleting book');
        }
    }

    // Initial load
    loadBooks();
});
