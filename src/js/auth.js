/**
 * Simple Authentication System using LocalStorage
 * Go-Shop Authentication Module
 */

class GoShopAuth {
    constructor() {
        this.users = this.getUsers();
        this.currentUser = this.getCurrentUser();
        // Cleanup any previously seeded demo favorites so users don't see hardcoded saved items
        this.cleanSeededFavorites();
    }

    // Get users from localStorage
    getUsers() {
        const users = localStorage.getItem('goshop_users');
        return users ? JSON.parse(users) : [];
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem('goshop_users', JSON.stringify(users));
        this.users = users;
    }

    // Get current logged-in user
    getCurrentUser() {
        const user = localStorage.getItem('goshop_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Set current user
    setCurrentUser(user) {
        localStorage.setItem('goshop_current_user', JSON.stringify(user));
        this.currentUser = user;

        // Dispatch auth state change event
        this.dispatchAuthEvent();
    }

    // Clear current user (logout)
    clearCurrentUser() {
        localStorage.removeItem('goshop_current_user');
        this.currentUser = null;

        // Dispatch auth state change event
        this.dispatchAuthEvent();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Dispatch authentication state change event
    dispatchAuthEvent() {
        // Dispatch event to notify other parts of the app
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: {
                    isLoggedIn: this.isLoggedIn(),
                    user: this.currentUser
                }
            }));
        }
    }

    // Remove previously seeded demo favorites from existing users
    cleanSeededFavorites() {
        try {
            const seededIds = new Set(['item-1', 'item-2', 'tomato-1', 'banana-1']);
            const seededNames = new Set(['Organic Spinach', 'Fresh Avocados']);

            let changed = false;
            const users = this.getUsers().map(u => {
                if (!Array.isArray(u.favorites) || u.favorites.length === 0) return u;

                const filtered = u.favorites.filter(fav => {
                    if (typeof fav === 'string') return !seededIds.has(fav);
                    if (fav && typeof fav === 'object') {
                        return !(seededIds.has(fav.id) || seededNames.has(fav.name));
                    }
                    return true;
                });

                if (filtered.length !== u.favorites.length) {
                    u.favorites = filtered;
                    changed = true;
                }
                return u;
            });

            if (changed) {
                this.saveUsers(users);
                if (this.currentUser) {
                    const updated = users.find(u => u.id === this.currentUser.id);
                    if (updated) {
                        const sessionUser = { ...updated };
                        delete sessionUser.password;
                        this.setCurrentUser(sessionUser);
                    }
                }
            }
        } catch (_) {
            // silently ignore cleanup errors
        }
    }

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        return password && password.length >= 6;
    }

    // Check if username already exists
    usernameExists(username) {
        return this.users.some(user => user.username.toLowerCase() === username.toLowerCase());
    }

    // Check if email already exists
    emailExists(email) {
        return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Register new user
    register(userData) {
        const { fullname, username, email, location, password, confirmPassword } = userData;

        // Validation
        if (!fullname || !fullname.trim()) {
            throw new Error('Full name is required');
        }

        if (!username || !username.trim()) {
            throw new Error('Username is required');
        }

        if (!email || !this.validateEmail(email)) {
            throw new Error('Valid email is required');
        }

        if (!location || !location.trim()) {
            throw new Error('Location is required');
        }

        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Check for existing user
        if (this.usernameExists(username)) {
            throw new Error('Username already exists');
        }

        if (this.emailExists(email)) {
            throw new Error('Email already registered');
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullname: fullname.trim(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            location: location.trim(),
            password: password, // In production, you'd hash this
            createdAt: new Date().toISOString(),
            orders: [],
            favorites: [],
            addresses: [
                {
                    id: 'default-address',
                    label: 'Home',
                    type: 'home',
                    street: location.trim(),
                    city: 'Accra',
                    region: 'Greater Accra',
                    phone: '+233 24 123 4567',
                    isDefault: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'office-address',
                    label: 'Office',
                    type: 'office',
                    street: 'Ring Road Central, East Legon',
                    city: 'Accra',
                    region: 'Greater Accra',
                    phone: '+233 24 123 4567',
                    isDefault: false,
                    createdAt: new Date().toISOString()
                }
            ],
            paymentMethods: [],
            preferences: {
                notifications: {
                    orderUpdates: true,
                    promotionalEmails: true,
                    newsletter: false
                },
                shopping: {
                    savePaymentInfo: false,
                    rememberAddress: true
                }
            },
            profile: {
                firstName: fullname.trim().split(' ')[0] || fullname.trim(),
                lastName: fullname.trim().split(' ').slice(1).join(' ') || '',
                phone: '',
                dateOfBirth: '',
                gender: ''
            }
        };

        // Add to users array
        this.users.push(newUser);
        this.saveUsers(this.users);

        // Auto-login after registration
        const userForSession = { ...newUser };
        delete userForSession.password; // Don't store password in session
        this.setCurrentUser(userForSession);

        return userForSession;
    }

    // Login user
    login(credentials) {
        const { identifier, password } = credentials; // identifier can be username or email

        if (!identifier || !identifier.trim()) {
            throw new Error('Username or email is required');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        // Find user by username or email
        const user = this.users.find(u =>
            u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase()
        );

        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        // Login successful
        const userForSession = { ...user };
        delete userForSession.password; // Don't store password in session
        this.setCurrentUser(userForSession);

        return userForSession;
    }

    // Logout user
    logout() {
        // Clear admin session flag as well
        try { localStorage.removeItem('goshop_admin'); } catch (e) {}
        this.clearCurrentUser();
        // Redirect to auth page
        window.location.href = 'auth.html';
    }

    // Update user profile
    updateProfile(updates) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Update user data
        const updatedUser = { ...this.users[userIndex], ...updates };

        // If location is updated, sync with default address
        if (updates.location) {
            this.syncProfileLocationWithDefaultAddress(updatedUser, updates.location);
        }

        this.users[userIndex] = updatedUser;
        this.saveUsers(this.users);

        // Update current user session (excluding password)
        const userForSession = { ...updatedUser };
        delete userForSession.password;
        this.setCurrentUser(userForSession);

        return userForSession;
    }

    syncProfileLocationWithDefaultAddress(user, newLocation) {
        if (!user.addresses) user.addresses = [];

        // Find default address
        let defaultAddress = user.addresses.find(addr => addr.isDefault);

        if (defaultAddress) {
            // Update existing default address
            defaultAddress.fullAddress = newLocation;
            // Try to parse location for better display if it contains comma-separated parts
            const locationParts = newLocation.split(',').map(part => part.trim());
            if (locationParts.length >= 2) {
                defaultAddress.city = locationParts[0];
                defaultAddress.state = locationParts[1];
                if (locationParts.length >= 3) {
                    defaultAddress.country = locationParts[2];
                }
            }
        } else {
            // Create new default address if none exists
            const newDefaultAddress = {
                id: 'default-' + Date.now(),
                type: 'home',
                name: 'Home',
                fullAddress: newLocation,
                isDefault: true,
                createdAt: new Date().toISOString()
            };

            // Parse location for better display
            const locationParts = newLocation.split(',').map(part => part.trim());
            if (locationParts.length >= 2) {
                newDefaultAddress.city = locationParts[0];
                newDefaultAddress.state = locationParts[1];
                if (locationParts.length >= 3) {
                    newDefaultAddress.country = locationParts[2];
                }
            }

            user.addresses.push(newDefaultAddress);
        }
    }

    // Get user profile
    getProfile() {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }
        return this.currentUser;
    }

    // Add item to favorites
    addToFavorites(productId) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user.favorites) user.favorites = [];

        if (!user.favorites.includes(productId)) {
            user.favorites.push(productId);
            this.saveUsers(this.users);
            this.currentUser.favorites = user.favorites;
            this.setCurrentUser(this.currentUser);
        }
    }

    // Remove from favorites
    removeFromFavorites(productId) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (user.favorites) {
            user.favorites = user.favorites.filter(id => id !== productId);
            this.saveUsers(this.users);
            this.currentUser.favorites = user.favorites;
            this.setCurrentUser(this.currentUser);
        }
    }

    // Add order to user history
    addOrder(order) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user.orders) user.orders = [];

        const newOrder = {
            id: Date.now().toString(),
            ...order,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        user.orders.unshift(newOrder); // Add to beginning
        this.saveUsers(this.users);
        this.currentUser.orders = user.orders;
        this.setCurrentUser(this.currentUser);

        return newOrder;
    }

    // Protect page (redirect if not logged in)
    requireAuth(redirectUrl = 'auth.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Address management
    addAddress(addressData) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user.addresses) user.addresses = [];

        // If this is marked as default, unset other defaults
        if (addressData.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        const newAddress = {
            id: Date.now().toString(),
            ...addressData,
            createdAt: new Date().toISOString()
        };

        user.addresses.push(newAddress);
        this.saveUsers(this.users);
        this.currentUser.addresses = user.addresses;
        this.setCurrentUser(this.currentUser);

        return newAddress;
    }

    updateAddress(addressId, updates) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        const addressIndex = user.addresses.findIndex(a => a.id === addressId);

        if (addressIndex === -1) {
            throw new Error('Address not found');
        }

        // If setting as default, unset other defaults
        if (updates.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...updates };
        this.saveUsers(this.users);
        this.currentUser.addresses = user.addresses;
        this.setCurrentUser(this.currentUser);

        return user.addresses[addressIndex];
    }

    deleteAddress(addressId) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        const addressToDelete = user.addresses.find(a => a.id === addressId);

        if (!addressToDelete) {
            throw new Error('Address not found');
        }

        if (addressToDelete.isDefault) {
            throw new Error('Cannot delete the default address. Please set another address as default first.');
        }

        user.addresses = user.addresses.filter(a => a.id !== addressId);
        this.saveUsers(this.users);
        this.currentUser.addresses = user.addresses;
        this.setCurrentUser(this.currentUser);
    }

    setDefaultAddress(addressId) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        const address = user.addresses.find(a => a.id === addressId);

        if (!address) {
            throw new Error('Address not found');
        }

        // Unset all default addresses
        user.addresses.forEach(addr => addr.isDefault = false);

        // Set this address as default
        address.isDefault = true;

        // Update profile location to match default address
        user.location = address.fullAddress;

        this.saveUsers(this.users);
        this.currentUser.addresses = user.addresses;
        this.currentUser.location = user.location;
        this.setCurrentUser(this.currentUser);

        return address;
    }

    // Payment method management
    addPaymentMethod(paymentData) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user.paymentMethods) user.paymentMethods = [];

        const newPayment = {
            id: Date.now().toString(),
            ...paymentData,
            createdAt: new Date().toISOString()
        };

        user.paymentMethods.push(newPayment);
        this.saveUsers(this.users);
        this.currentUser.paymentMethods = user.paymentMethods;
        this.setCurrentUser(this.currentUser);

        return newPayment;
    }

    deletePaymentMethod(paymentId) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        user.paymentMethods = user.paymentMethods.filter(p => p.id !== paymentId);
        this.saveUsers(this.users);
        this.currentUser.paymentMethods = user.paymentMethods;
        this.setCurrentUser(this.currentUser);
    }

    // Preferences management
    updatePreferences(preferences) {
        if (!this.isLoggedIn()) {
            throw new Error('User not logged in');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        user.preferences = { ...user.preferences, ...preferences };
        this.saveUsers(this.users);
        this.currentUser.preferences = user.preferences;
        this.setCurrentUser(this.currentUser);

        return user.preferences;
    }

    // Initialize demo data (for testing)
    initDemoData() {
        if (this.users.length === 0) {
            const demoUser = {
                id: 'demo-user-1',
                fullname: 'John Demo',
                username: 'demo',
                email: 'demo@goshop.com',
                location: 'Accra, Ghana',
                password: 'demo123',
                createdAt: new Date().toISOString(),
                orders: [
                    {
                        id: 'order-1',
                        items: [
                            { name: 'Fresh Tomatoes', quantity: 2, price: 15.00 },
                            { name: 'Organic Bananas', quantity: 1, price: 8.50 }
                        ],
                        total: 23.50,
                        status: 'delivered',
                        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 'order-2',
                        items: [
                            { name: 'Fresh Herbs', quantity: 1, price: 3.99 },
                            { name: 'Organic Rice', quantity: 2, price: 12.50 }
                        ],
                        total: 16.49,
                        status: 'pending',
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                favorites: [],
                addresses: [
                    {
                        id: 'address-1',
                        type: 'home',
                        name: 'Home',
                        fullAddress: 'Accra, Ghana',
                        street: '123 Main Street',
                        city: 'Accra',
                        state: 'Greater Accra',
                        zipCode: '00233',
                        country: 'Ghana',
                        isDefault: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'address-2',
                        type: 'work',
                        name: 'Office',
                        fullAddress: 'Osu, Accra, Ghana',
                        street: '456 Business Ave',
                        city: 'Accra',
                        state: 'Greater Accra',
                        zipCode: '00233',
                        country: 'Ghana',
                        isDefault: false,
                        createdAt: new Date().toISOString()
                    }
                ],
                paymentMethods: [
                    {
                        id: 'payment-1',
                        type: 'card',
                        cardType: 'Visa',
                        lastFour: '1234',
                        expiryMonth: '12',
                        expiryYear: '25',
                        isDefault: true,
                        createdAt: new Date().toISOString()
                    }
                ],
                preferences: {
                    notifications: {
                        orderUpdates: true,
                        promotionalEmails: true,
                        newsletter: false
                    },
                    shopping: {
                        savePaymentInfo: false,
                        rememberAddress: true
                    }
                },
                profile: {
                    firstName: 'John',
                    lastName: 'Demo',
                    phone: '+233 24 123 4567',
                    dateOfBirth: '1990-01-01',
                    gender: 'male'
                }
            };

            this.users.push(demoUser);
            this.saveUsers(this.users);
        }
    }
}

// Create global auth instance
window.GoShopAuth = new GoShopAuth();

// Initialize demo data if needed
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.GoShopAuth.initDemoData();
}
