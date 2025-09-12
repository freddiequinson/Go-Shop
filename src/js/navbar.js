/**
 * Go Shop Navbar Component JavaScript
 * Handles mobile menu toggle, dropdown functionality, and scroll effects
 */

class NavbarComponent {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollEffects();
    this.setupDropdowns();
    this.setupMobileMenu();
  }

  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.c-nav-btn');
    const mobileMenu = document.querySelector('.c-header-mobile');
    const closeBtn = document.querySelector('.c-nav-close');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (mobileMenu && mobileMenu.classList.contains('test') && 
          !mobileMenu.contains(e.target) && 
          !mobileMenuBtn.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('test')) {
        this.closeMobileMenu();
      }
    });
  }

  setupScrollEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('.c-header');
    const headerBg = document.querySelector('.c-header-bg');

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Add scrolled class when scrolled down
      if (scrollTop > 50) {
        header.classList.add('scrolled');
        if (headerBg) {
          headerBg.style.transform = 'translateY(0)';
        }
      } else {
        header.classList.remove('scrolled');
        if (headerBg) {
          headerBg.style.transform = 'translateY(-110%)';
        }
      }

      lastScrollTop = scrollTop;
    });
  }

  setupDropdowns() {
    const dropdownLinks = document.querySelectorAll('.c-dd-link');
    
    dropdownLinks.forEach(link => {
      const dropdown = link.querySelector('.c-dd-list');
      
      if (dropdown) {
        link.addEventListener('mouseenter', () => {
          this.showDropdown(dropdown);
        });

        link.addEventListener('mouseleave', () => {
          this.hideDropdown(dropdown);
        });

        // Touch events for mobile
        link.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.toggleDropdown(dropdown);
        });
      }
    });

    // Mobile dropdown functionality
    const mobileDropdownLinks = document.querySelectorAll('.c-dd-link-mobile');
    
    mobileDropdownLinks.forEach(link => {
      const dropdown = link.querySelector('.c-dd-list');
      
      if (dropdown) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleMobileDropdown(dropdown);
        });
      }
    });
  }

  setupMobileMenu() {
    // Handle mobile menu animations
    const mobileMenu = document.querySelector('.c-header-mobile');
    
    if (mobileMenu) {
      // Add transition classes for smooth animations
      mobileMenu.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.querySelector('.c-header-mobile');
    const body = document.body;
    
    if (mobileMenu) {
      if (mobileMenu.classList.contains('test')) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    }
  }

  openMobileMenu() {
    const mobileMenu = document.querySelector('.c-header-mobile');
    const body = document.body;
    
    if (mobileMenu) {
      mobileMenu.classList.add('test');
      mobileMenu.style.display = 'flex';
      body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Trigger reflow for animation
      mobileMenu.offsetHeight;
      mobileMenu.style.opacity = '1';
      mobileMenu.style.transform = 'translateY(0)';
    }
  }

  closeMobileMenu() {
    const mobileMenu = document.querySelector('.c-header-mobile');
    const body = document.body;
    
    if (mobileMenu) {
      mobileMenu.style.opacity = '0';
      mobileMenu.style.transform = 'translateY(-100%)';
      
      setTimeout(() => {
        mobileMenu.classList.remove('test');
        mobileMenu.style.display = 'none';
        body.style.overflow = ''; // Restore scrolling
      }, 300);
    }
  }

  showDropdown(dropdown) {
    if (dropdown) {
      dropdown.style.display = 'block';
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
    }
  }

  hideDropdown(dropdown) {
    if (dropdown) {
      dropdown.style.opacity = '0';
      dropdown.style.visibility = 'hidden';
      
      setTimeout(() => {
        if (dropdown.style.opacity === '0') {
          dropdown.style.display = 'none';
        }
      }, 300);
    }
  }

  toggleDropdown(dropdown) {
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      if (isVisible) {
        this.hideDropdown(dropdown);
      } else {
        this.showDropdown(dropdown);
      }
    }
  }

  toggleMobileDropdown(dropdown) {
    if (dropdown) {
      const isVisible = dropdown.style.display === 'grid' || dropdown.style.display === 'block';
      if (isVisible) {
        dropdown.style.display = 'none';
      } else {
        dropdown.style.display = 'grid';
      }
    }
  }

  // Public methods for external control
  openMobileMenu() {
    this.openMobileMenu();
  }

  closeMobileMenu() {
    this.closeMobileMenu();
  }

  // Method to update cart count
  updateCartCount(count) {
    const cartBadge = document.querySelector('.c-nav-shop_num');
    if (cartBadge) {
      if (count > 0) {
        cartBadge.textContent = count;
        cartBadge.classList.remove('hide');
      } else {
        cartBadge.classList.add('hide');
      }
    }
  }

  // Method to set active navigation item
  setActiveNavItem(href) {
    const navLinks = document.querySelectorAll('.c-nav-link');
    navLinks.forEach(link => {
      link.classList.remove('w--current');
      if (link.getAttribute('href') === href) {
        link.classList.add('w--current');
      }
    });
  }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navbarComponent = new NavbarComponent();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavbarComponent;
}
