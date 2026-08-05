// Estado da Aplicação
let allProducts = [];
let categories = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let searchQuery = '';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
});

// Carregar Produtos do Firebase
function loadProducts() {
    const productsRef = database.ref('products');
    
    productsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allProducts = Object.entries(data).map(([id, product]) => ({
                id,
                ...product
            }));
            
            // Extrair categorias únicas
            categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
            
            renderCategories();
            renderProducts();
        } else {
            allProducts = [];
            categories = [];
            document.getElementById('productsGrid').innerHTML = '';
            document.getElementById('noProducts').style.display = 'block';
        }
    }, (error) => {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('productsGrid').innerHTML = '';
        document.getElementById('errorMessage').style.display = 'block';
    });
}

// Renderizar Categorias
function renderCategories() {
    const categoryScroll = document.getElementById('categoryScroll');
    const menuCategories = document.getElementById('menuCategories');
    
    // Categorias na página principal
    categoryScroll.innerHTML = '<button class="category-chip active" onclick="filterProducts(\'all\')">Todos</button>';
    categories.forEach(category => {
        categoryScroll.innerHTML += `
            <button class="category-chip" onclick="filterProducts('${category}')">${category}</button>
        `;
    });
    
    // Categorias no menu
    menuCategories.innerHTML = categories.map(category => `
        <a href="#" class="menu-item" onclick="filterProducts('${category}'); toggleMenu();">${category}</a>
    `).join('');
}

// Filtrar Produtos
function filterProducts(category) {
    currentCategory = category;
    
    // Atualizar chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if ((category === 'all' && chip.textContent === 'Todos') || 
            chip.textContent === category) {
            chip.classList.add('active');
        }
    });
    
    renderProducts();
}

// Pesquisar Produtos
function searchProducts() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    renderProducts();
}

// Renderizar Produtos
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.style.display = 'none';
    
    let filteredProducts = allProducts;
    
    // Filtrar por categoria
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }
    
    // Filtrar por pesquisa
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchQuery)) ||
            (p.description && p.description.toLowerCase().includes(searchQuery)) ||
            (p.category && p.category.toLowerCase().includes(searchQuery))
        );
    }
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }
    
    noProducts.style.display = 'none';
    
    grid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Criar Card de Produto
function createProductCard(product) {
    const hasDiscount = product.oldPrice && product.oldPrice > product.price;
    const discountPercent = hasDiscount 
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;
    
    return `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.image || 'https://via.placeholder.com/300'}" 
                     alt="${product.name || 'Produto'}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300'">
                ${hasDiscount ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                ${product.stock === false ? '<span class="discount-badge" style="background: #ff4444;">Esgotado</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name || 'Produto sem nome'}</h3>
                ${hasDiscount ? `<p class="product-old-price">R$ ${product.oldPrice.toFixed(2)}</p>` : ''}
                <div class="product-price-container">
                    <span class="product-price-symbol">R$</span>
                    <span class="product-price">${product.price ? product.price.toFixed(2) : '0.00'}</span>
                </div>
                <p class="product-pix">
                    <i class="fas fa-qrcode"></i> À vista no PIX
                    ${product.pixPrice ? `R$ ${product.pixPrice.toFixed(2)}` : ''}
                </p>
                <button class="buy-button" onclick="addToCart('${product.id}')" ${product.stock === false ? 'disabled' : ''}>
                    ${product.stock === false ? 'Indisponível' : 'Comprar agora'}
                </button>
            </div>
        </div>
    `;
}

// Carrinho
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    renderCart();
    showToast('Produto adicionado ao carrinho!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Seu carrinho está vazio</p>';
        cartFooter.style.display = 'none';
        return;
    }
    
    cartFooter.style.display = 'block';
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/80'}" 
                 alt="${item.name}" 
                 class="cart-item-image"
                 onerror="this.src='https://via.placeholder.com/80'">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-price">R$ ${item.price.toFixed(2)}</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Checkout
function checkout() {
    if (cart.length === 0) return;
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <img src="${item.image || 'https://via.placeholder.com/60'}" 
                 alt="${item.name}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                 onerror="this.src='https://via.placeholder.com/60'">
            <div style="flex: 1;">
                <h4 style="font-size: 14px; margin-bottom: 4px;">${item.name}</h4>
                <p style="font-size: 12px; color: #a0a0a0;">Qtd: ${item.quantity}</p>
                <p style="font-size: 14px; color: #00e5a0; font-weight: 600;">R$ ${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    
    checkoutSubtotal.textContent = `R$ ${subtotal.toFixed(2)}`;
    checkoutTotal.textContent = `R$ ${subtotal.toFixed(2)}`;
    
    modal.classList.add('active');
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

// Toggle Functions
function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
    document.getElementById('menuOverlay').classList.toggle('active');
}

function toggleSearch() {
    document.getElementById('searchOverlay').classList.toggle('active');
    if (document.getElementById('searchOverlay').classList.contains('active')) {
        document.getElementById('searchInput').focus();
    } else {
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        renderProducts();
    }
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
    renderCart();
}

function toggleAccount() {
    document.getElementById('accountModal').classList.toggle('active');
}

function closeAccount() {
    document.getElementById('accountModal').classList.remove('active');
}

// Account Tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').style.display = 'block';
}

// Authentication (placeholder)
function login(event) {
    event.preventDefault();
    showToast('Funcionalidade em desenvolvimento');
}

function register(event) {
    event.preventDefault();
    showToast('Funcionalidade em desenvolvimento');
}

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Fechar modais com Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('searchOverlay').classList.remove('active');
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        renderProducts();
        
        document.getElementById('checkoutModal').classList.remove('active');
        document.getElementById('accountModal').classList.remove('active');
    }
});