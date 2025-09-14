# Go-Shop Authentication System

## Overview
A simple, lightweight authentication system using localStorage for client-side user management. No backend required!

## Features
- ✅ User Registration & Login
- ✅ Profile Management
- ✅ Session Persistence
- ✅ Order History Tracking
- ✅ Favorites Management
- ✅ Route Protection

## How to Test

### 1. Demo Account (Already Available)
- **Username:** `demo`
- **Password:** `demo123`
- **Email:** `demo@goshop.com`

### 2. Create New Account
1. Open `auth.html`
2. Click "Create Account"
3. Fill out the registration form
4. Submit to automatically login and redirect to profile

### 3. Sign In Flow
1. Open `auth.html`
2. Use demo credentials or your created account
3. Click "Sign In"
4. Automatically redirects to `profile.html`

## File Structure
```
src/
├── js/
│   └── auth.js          # Main authentication module
├── auth.html            # Login/Registration page
└── profile.html         # Protected profile page
```

## Authentication Methods

### GoShopAuth Class Methods
```javascript
// Registration
window.GoShopAuth.register({
    fullname: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    location: "Accra, Ghana",
    password: "password123",
    confirmPassword: "password123"
});

// Login
window.GoShopAuth.login({
    identifier: "johndoe", // username or email
    password: "password123"
});

// Check if logged in
window.GoShopAuth.isLoggedIn(); // true/false

// Get current user
window.GoShopAuth.getProfile();

// Update profile
window.GoShopAuth.updateProfile({
    fullname: "John Updated",
    email: "john.updated@example.com"
});

// Logout
window.GoShopAuth.logout();

// Protect page (redirect if not logged in)
window.GoShopAuth.requireAuth();
```

## Profile Page Features
- Displays user information
- Shows order history
- Edit profile functionality
- Logout capability
- Real-time data updates

## Data Storage
- Uses browser localStorage
- Data persists between sessions
- No server required
- Data structure:
  ```javascript
  {
    goshop_users: [...], // All registered users
    goshop_current_user: {...} // Current logged-in user
  }
  ```

## Security Notes
⚠️ **This is a demo system!** For production:
- Hash passwords
- Use HTTPS
- Implement proper session management
- Add CSRF protection
- Use a real database

## Alternative Options

### Firebase (Recommended for Production)
```html
<!-- Add to your HTML -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"></script>
```

### Supabase (Modern Alternative)
```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### Netlify Identity
```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

## Troubleshooting

### Common Issues
1. **Profile page shows login form**: Clear localStorage and try again
2. **Authentication not working**: Check browser console for errors
3. **Data not persisting**: Ensure localStorage is enabled

### Reset Data
```javascript
// Clear all auth data
localStorage.removeItem('goshop_users');
localStorage.removeItem('goshop_current_user');
// Reload page
location.reload();
```

## Next Steps
1. Test the authentication flow
2. Customize the profile page UI
3. Add shopping cart integration
4. Implement order management
5. Add product favorites functionality

## Demo Instructions
1. Open `auth.html` in a web browser
2. Try logging in with demo account (`demo` / `demo123`)
3. Check that you're redirected to `profile.html`
4. Test profile editing and logout
5. Try creating a new account
6. Verify data persistence by refreshing the page
