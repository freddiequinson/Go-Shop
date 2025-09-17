/**
 * Guest CTA Module
 * Shows persistent "Create Account" CTA for guests across all pages
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        ctaId: 'guest-cta-banner',
        ctaClass: 'guest-cta-banner',
        authStateClass: 'auth-state-changed',
        pages: ['index.html', 'shop.html', 'cart.html', 'order-success.html']
    };

    // CTA HTML template
    const CTA_TEMPLATE = `
        <div id="${CONFIG.ctaId}" class="${CONFIG.ctaClass}" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: linear-gradient(135deg, #FED141 0%, #f7c52d 100%);
            padding: 12px 20px;
            box-shadow: 0 2px 10px rgba(254, 209, 65, 0.3);
            transform: translateY(-100%);
            transition: transform 0.3s ease-in-out;
            border-bottom: 1px solid rgba(48, 58, 77, 0.1);
        ">
            <div style="
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: rgba(48, 58, 77, 0.15);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: #303A4D;">
                            <path d="M12 2C13.1 2 14 2.9 14 4C13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 8.3 14.3 9 13.5 9H10.5C9.7 9 9 8.3 9 7.5V6.5L3 7V9H21ZM6 10H18V20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20V10Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div style="color: #303A4D; font-weight: 600; font-size: 14px;">
                        <strong>Join Go-Shop today!</strong> Save your favorites, track orders, and get exclusive deals.
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <a href="auth.html" style="
                        background: #303A4D;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                    " onmouseover="this.style.background='#253142'" onmouseout="this.style.background='#303A4D'">
                        Create Account
                    </a>
                    <button onclick="hideGuestCTA()" style="
                        background: none;
                        border: none;
                        color: #303A4D;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background-color 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseover="this.style.backgroundColor='rgba(48, 58, 77, 0.1)'" onmouseout="this.style.backgroundColor='transparent'" title="Dismiss">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Initialize the module
    function initGuestCTA() {
        if (typeof window.GoShopAuth === 'undefined') {
            setTimeout(initGuestCTA, 100);
            return;
        }

        // Check if we should show the CTA
        if (shouldShowCTA()) {
            createCTA();
            showCTA();
        }

        // Listen for auth state changes
        setupAuthStateListener();
    }

    // Check if we should show the CTA
    function shouldShowCTA() {
        // Don't show on auth page
        if (window.location.pathname.includes('auth.html')) {
            return false;
        }

        // Don't show if user is logged in
        if (window.GoShopAuth.isLoggedIn()) {
            return false;
        }

        // Don't show if user has dismissed it on this specific page load
        if (window.goshopCtaDismissed) {
            return false;
        }

        return true;
    }

    // Create the CTA element
    function createCTA() {
        // Remove existing CTA if any
        const existingCTA = document.getElementById(CONFIG.ctaId);
        if (existingCTA) {
            existingCTA.remove();
        }

        // Create new CTA
        const ctaElement = document.createElement('div');
        ctaElement.innerHTML = CTA_TEMPLATE;
        const cta = ctaElement.firstElementChild;

        // Insert at the beginning of body
        document.body.insertBefore(cta, document.body.firstChild);

        // Add global hide function
        window.hideGuestCTA = function() {
            hideCTA();
            window.goshopCtaDismissed = true;
        };
    }

    // Show the CTA with animation
    function showCTA() {
        const cta = document.getElementById(CONFIG.ctaId);
        if (cta) {
            // Add body class for spacing
            document.body.classList.add('has-guest-cta');
            
            // Add a small delay to ensure smooth animation
            setTimeout(() => {
                cta.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // Hide the CTA with animation
    function hideCTA() {
        const cta = document.getElementById(CONFIG.ctaId);
        if (cta) {
            cta.style.transform = 'translateY(-100%)';
            // Remove body class for spacing
            document.body.classList.remove('has-guest-cta');
            // Remove after animation
            setTimeout(() => {
                if (cta.parentNode) {
                    cta.parentNode.removeChild(cta);
                }
            }, 300);
        }
    }

    // Setup auth state listener
    function setupAuthStateListener() {
        // Listen for auth state changes
        window.addEventListener('authStateChanged', function(event) {
            const isLoggedIn = event.detail.isLoggedIn;
            
            if (isLoggedIn) {
                // User logged in - hide CTA
                hideCTA();
            } else {
                // User logged out - show CTA if conditions are met
                if (shouldShowCTA()) {
                    createCTA();
                    showCTA();
                }
            }
        });

        // Listen for storage changes (when user logs in/out from another tab)
        window.addEventListener('storage', function(e) {
            if (e.key === 'goshop_current_user') {
                const isLoggedIn = e.newValue !== null;
                
                if (isLoggedIn) {
                    hideCTA();
                } else {
                    if (shouldShowCTA()) {
                        createCTA();
                        showCTA();
                    }
                }
            }
        });
    }

    // Add CSS for mobile responsiveness and body spacing
    function addResponsiveCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Body spacing when CTA is visible */
            body.has-guest-cta {
                padding-top: 60px !important;
            }
            
            @media only screen and (max-width: 768px) {
                body.has-guest-cta {
                    padding-top: 80px !important;
                }
                
                .${CONFIG.ctaClass} {
                    padding: 10px 16px !important;
                }
                
                .${CONFIG.ctaClass} > div {
                    flex-direction: column !important;
                    gap: 12px !important;
                    text-align: center !important;
                }
                
                .${CONFIG.ctaClass} > div > div:first-child {
                    flex-direction: column !important;
                    gap: 8px !important;
                    text-align: center !important;
                }
                
                .${CONFIG.ctaClass} > div > div:last-child {
                    justify-content: center !important;
                }
                
                .${CONFIG.ctaClass} > div > div:first-child > div:last-child {
                    font-size: 13px !important;
                }
            }
            
            @media only screen and (max-width: 480px) {
                body.has-guest-cta {
                    padding-top: 90px !important;
                }
                
                .${CONFIG.ctaClass} {
                    padding: 8px 12px !important;
                }
                
                .${CONFIG.ctaClass} > div > div:first-child > div:last-child {
                    font-size: 12px !important;
                }
                
                .${CONFIG.ctaClass} a[href="auth.html"] {
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addResponsiveCSS();
            initGuestCTA();
        });
    } else {
        addResponsiveCSS();
        initGuestCTA();
    }

    // Expose functions globally for manual control
    window.GuestCTA = {
        show: function() {
            if (shouldShowCTA()) {
                createCTA();
                showCTA();
            }
        },
        hide: function() {
            hideCTA();
        },
        reset: function() {
            window.goshopCtaDismissed = false;
            if (shouldShowCTA()) {
                createCTA();
                showCTA();
            }
        }
    };

})();
