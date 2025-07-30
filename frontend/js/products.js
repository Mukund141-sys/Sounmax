// Product Data
const products = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        price: 999,
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center",
        category: "smartphones",
        description: "Latest iPhone with titanium design and advanced camera system",
        inStock: true,
        rating: 4.8,
        reviews: 1234
    },
    {
        id: 2,
        name: "MacBook Pro 16\"",
        price: 2499,
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop&crop=center",
        category: "laptops",
        description: "Professional laptop with M3 chip and stunning Liquid Retina XDR display",
        inStock: true,
        rating: 4.9,
        reviews: 856
    },
    {
        id: 3,
        name: "AirPods Pro",
        price: 249,
        image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&h=400&fit=crop&crop=center",
        category: "accessories",
        description: "Active noise cancellation and spatial audio",
        inStock: true,
        rating: 4.7,
        reviews: 2341
    },
    {
        id: 4,
        name: "Samsung Galaxy S24 Ultra",
        price: 1199,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&crop=center",
        category: "smartphones",
        description: "Ultimate Android experience with S Pen and AI features",
        inStock: true,
        rating: 4.6,
        reviews: 987
    },
    {
        id: 5,
        name: "Dell XPS 13",
        price: 1299,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&crop=center",
        category: "laptops",
        description: "Ultrabook with 13.4-inch InfinityEdge display",
        inStock: true,
        rating: 4.5,
        reviews: 654
    },
    {
        id: 6,
        name: "Sony WH-1000XM5",
        price: 399,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop&crop=center",
        category: "accessories",
        description: "Industry-leading noise canceling wireless headphones",
        inStock: true,
        rating: 4.8,
        reviews: 1543
    },
    {
        id: 7,
        name: "iPad Pro 12.9\"",
        price: 1099,
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop&crop=center",
        category: "tablets",
        description: "Most advanced iPad with M2 chip and Liquid Retina XDR display",
        inStock: true,
        rating: 4.7,
        reviews: 876
    },
    {
        id: 8,
        name: "Apple Watch Series 9",
        price: 399,
        image: "https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=400&h=400&fit=crop&crop=center",
        category: "accessories",
        description: "Advanced health monitoring and fitness tracking",
        inStock: false,
        rating: 4.6,
        reviews: 1987
    }
];

// Render products on page load
document.addEventListener('DOMContentLoaded', function() {
    renderProducts(products);
    trackPageView();
});

// Render products function
function renderProducts(productsToRender) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    productsToRender.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const productDiv = document.createElement('div');
    productDiv.className = 'bg-white rounded-lg shadow-lg overflow-hidden product-card cursor-pointer';
    productDiv.onclick = () => viewProduct(product);

    const stockBadge = product.inStock 
        ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">In Stock</span>'
        : '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Out of Stock</span>';

    productDiv.innerHTML = `
        <div class="relative">
            <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover">
            <div class="absolute top-4 right-4">
                ${stockBadge}
            </div>
        </div>
        <div class="p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">${product.name}</h3>
            <p class="text-gray-600 mb-4 line-clamp-2">${product.description}</p>
            <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                    ${generateStars(product.rating)}
                </div>
                <span class="text-gray-500 text-sm ml-2">(${product.reviews} reviews)</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-purple-600">$${product.price}</span>
                <button 
                    onclick="addToCart(${product.id}); event.stopPropagation();" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-300 ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${!product.inStock ? 'disabled' : ''}
                >
                    ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `;

    return productDiv;
}

// Generate star rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// View product (track product view)
function viewProduct(product) {
    trackProductView(product);
    
    // For now, just show an alert. In a real app, this would navigate to product page
    alert(`Viewing ${product.name}\n\nPrice: $${product.price}\nDescription: ${product.description}`);
}

// Get product by ID
function getProductById(id) {
    return products.find(product => product.id === id);
}

// Filter products by category
function filterProducts(category) {
    if (category === 'all') {
        renderProducts(products);
    } else {
        const filteredProducts = products.filter(product => product.category === category);
        renderProducts(filteredProducts);
    }
}

// Search products
function searchProducts(query) {
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filteredProducts);
} 