// Shopping Cart Management
let cart = [];
let cartTotal = 0;

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartDisplay();
    
    // Add event listener for cart button
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }
});

// Add item to cart
function addToCart(productId) {
    const product = getProductById(productId);
    if (!product || !product.inStock) {
        alert('Sorry, this product is not available.');
        return;
    }

    // Check if item already exists in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    // Track add to cart event
    trackAddToCart(product);
    
    updateCartDisplay();
    saveCart();
    showAddToCartNotification(product.name);
}

// Remove item from cart
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        
        // Track remove from cart event
        trackRemoveFromCart(removedItem);
        
        updateCartDisplay();
        saveCart();
    }
}

// Update item quantity in cart
function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartDisplay();
            saveCart();
        }
    }
}

// Calculate cart total
function calculateCartTotal() {
    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    return cartTotal;
}

// Update cart display
function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartTotalElement = document.getElementById('cart-total');
    const cartItemsContainer = document.getElementById('cart-items');

    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Update cart total
    const total = calculateCartTotal();
    if (cartTotalElement) {
        cartTotalElement.textContent = total.toFixed(2);
    }

    // Update cart items display
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
        } else {
            cart.forEach(item => {
                const cartItemElement = createCartItemElement(item);
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
    }
}

// Create cart item element
function createCartItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex items-center space-x-4 bg-gray-50 p-4 rounded-lg';
    
    itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
        <div class="flex-1">
            <h4 class="font-semibold text-gray-900">${item.name}</h4>
            <p class="text-gray-600">$${item.price}</p>
        </div>
        <div class="flex items-center space-x-2">
            <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" 
                    class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                <i class="fas fa-minus text-xs"></i>
            </button>
            <span class="w-8 text-center font-semibold">${item.quantity}</span>
            <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" 
                    class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                <i class="fas fa-plus text-xs"></i>
            </button>
        </div>
        <button onclick="removeFromCart(${item.id})" 
                class="text-red-500 hover:text-red-700">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    return itemDiv;
}

// Open cart modal
function openCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.remove('hidden');
        trackCartView();
    }
}

// Close cart modal
function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.add('hidden');
    }
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Track begin checkout event
    trackBeginCheckout();
    
    // For demo purposes, simulate checkout process
    const total = calculateCartTotal();
    const orderSummary = cart.map(item => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    const confirmCheckout = confirm(`Order Summary:\n\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\n\nProceed with checkout?`);
    
    if (confirmCheckout) {
        // Simulate successful purchase
        setTimeout(() => {
            completePurchase();
        }, 1000);
    }
}

// Complete purchase
function completePurchase() {
    const orderId = generateOrderId();
    const total = calculateCartTotal();
    const purchaseData = {
        orderId: orderId,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total
    };

    // Track purchase event
    trackPurchase(purchaseData);
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    saveCart();
    closeCart();
    
    // Show success message
    alert(`Thank you for your purchase!\n\nOrder ID: ${orderId}\nTotal: $${total.toFixed(2)}\n\nYou will receive a confirmation email shortly.`);
}

// Generate order ID
function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('ecommerce_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Show add to cart notification
function showAddToCartNotification(productName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle"></i>
            <span>${productName} added to cart!</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Close cart modal when clicking outside
document.addEventListener('click', function(event) {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && !cartModal.classList.contains('hidden')) {
        if (event.target === cartModal) {
            closeCart();
        }
    }
}); 