# Go Shop Navbar Component

A reusable, responsive navbar component extracted from the Go Shop website. This component includes desktop and mobile navigation with dropdown menus, cart functionality, and smooth animations.

## Files Structure

```
src/
├── components/
│   ├── navbar.html          # HTML component
│   └── README.md           # This documentation
├── css/
│   └── navbar.css          # Component-specific styles
└── js/
    └── navbar.js           # Component functionality
```

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Mobile Menu**: Collapsible mobile navigation with smooth animations
- **Dropdown Menus**: Hover-activated dropdowns for Orders and About sections
- **Cart Integration**: Shopping cart icon with badge for item count
- **Scroll Effects**: Header background appears on scroll
- **Accessibility**: Keyboard navigation and ARIA labels
- **Smooth Animations**: CSS transitions and JavaScript animations

## Usage

### Basic Implementation

1. **Include the CSS file** in your HTML head:
```html
<link rel="stylesheet" href="src/css/navbar.css">
```

2. **Include the JavaScript file** before closing body tag:
```html
<script src="src/js/navbar.js"></script>
```

3. **Insert the navbar HTML** where you want the navigation:
```html
<!-- Include the navbar component -->
<div id="navbar-container"></div>

<script>
  // Load navbar HTML
  fetch('src/components/navbar.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('navbar-container').innerHTML = html;
    });
</script>
```

### Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go Shop - Example Page</title>
    
    <!-- Include navbar styles -->
    <link rel="stylesheet" href="src/css/navbar.css">
    
    <!-- Your other styles -->
    <style>
        body {
            margin: 0;
            padding-top: 4.5em; /* Account for fixed navbar */
        }
    </style>
</head>
<body>
    <!-- Navbar will be inserted here -->
    <div id="navbar-container"></div>
    
    <!-- Your page content -->
    <main>
        <h1>Welcome to Go Shop</h1>
        <p>Your content goes here...</p>
    </main>
    
    <!-- Include navbar JavaScript -->
    <script src="src/js/navbar.js"></script>
    
    <!-- Load navbar component -->
    <script>
        // Load navbar HTML
        fetch('src/components/navbar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('navbar-container').innerHTML = html;
                
                // Initialize navbar after loading
                if (window.navbarComponent) {
                    // Set active navigation item
                    window.navbarComponent.setActiveNavItem('index.html');
                    
                    // Update cart count (example)
                    window.navbarComponent.updateCartCount(3);
                }
            })
            .catch(error => console.error('Error loading navbar:', error));
    </script>
</body>
</html>
```

## Customization

### Updating Links

Edit the `src/components/navbar.html` file to update navigation links:

```html
<!-- Update shop link -->
<a href="your-shop-page.html" class="c-nav-link w-inline-block">
    <!-- ... existing content ... -->
    <div z-5="">Shop</div>
</a>

<!-- Update logo link -->
<a aria-label="Go Shop Logo" href="/" class="c-logo-link w-inline-block">
    <!-- ... existing content ... -->
</a>
```

### Styling Customization

Modify `src/css/navbar.css` to customize colors, fonts, and layout:

```css
/* Update brand colors */
:root {
  --clr-yellow-01: #YOUR_COLOR;
  --clr-blurple-01: #YOUR_COLOR;
  /* ... other variables ... */
}

/* Customize header height */
.c-header {
  height: 5em; /* Change from 4.5em */
}
```

### JavaScript API

The navbar component provides several methods for programmatic control:

```javascript
// Get navbar instance
const navbar = window.navbarComponent;

// Update cart count
navbar.updateCartCount(5);

// Set active navigation item
navbar.setActiveNavItem('shop.html');

// Open mobile menu programmatically
navbar.openMobileMenu();

// Close mobile menu programmatically
navbar.closeMobileMenu();
```

## Responsive Breakpoints

- **Desktop**: 992px and above
- **Tablet**: 768px - 991px
- **Mobile**: Below 768px

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- No external dependencies required
- Uses modern CSS features (CSS Grid, Flexbox, CSS Variables)
- Vanilla JavaScript (ES6+)

## Accessibility Features

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure
- High contrast support

## Performance Notes

- CSS and JavaScript are optimized for performance
- Smooth 60fps animations
- Minimal DOM manipulation
- Efficient event handling

## Troubleshooting

### Common Issues

1. **Navbar not appearing**: Check file paths and ensure all files are loaded
2. **Mobile menu not working**: Verify JavaScript is loaded and no console errors
3. **Styling issues**: Ensure CSS file is loaded before other stylesheets
4. **Dropdown not working**: Check for JavaScript errors in console

### Debug Mode

Enable debug logging by adding this to your page:

```javascript
// Enable debug mode
localStorage.setItem('navbar-debug', 'true');
```

## License

This component is part of the Go Shop project. Please refer to the main project license for usage terms.

## Support

For issues or questions regarding this navbar component, please refer to the main Go Shop project documentation or create an issue in the project repository.
