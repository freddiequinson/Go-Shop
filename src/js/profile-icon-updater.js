/**
 * Profile Icon Updater
 * Updates profile icons across all pages to reflect authentication status
 */

(function () {
    'use strict';

    // Wait for auth system to be loaded
    function initProfileIconUpdater() {
        if (typeof window.GoShopAuth === 'undefined') {
            setTimeout(initProfileIconUpdater, 100);
            return;
        }

        updateProfileIcons();
    }

    function updateProfileIcons() {
        const isLoggedIn = window.GoShopAuth.isLoggedIn();
        const user = isLoggedIn ? window.GoShopAuth.getProfile() : null;

        // Find all profile icons (both desktop and mobile)
        const profileLinks = document.querySelectorAll('a[aria-label="Profile"]');

        profileLinks.forEach(link => {
            if (isLoggedIn) {
                // User is logged in - update icon and link
                updateSignedInProfileIcon(link, user);
            } else {
                // User is not logged in - ensure link goes to auth page
                updateSignedOutProfileIcon(link);
            }
        });

        // Update mobile sign-in buttons
        updateMobileSignInButtons(isLoggedIn, user);
    }

    function updateSignedInProfileIcon(link, user) {
        // Update href to go to profile page
        link.href = 'profile.html';

        // Update aria-label
        link.setAttribute('aria-label', `Profile - ${user.fullname || user.username}`);

        // Find the icon container
        const iconContainer = link.querySelector('.c-icon');
        if (!iconContainer) return;

        // Create signed-in profile icon with user indicator
        iconContainer.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <!-- Profile Icon -->
                <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <!-- Online indicator -->
                <div style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: #28a745;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                "></div>
            </div>
        `;

        // Add hover tooltip with user info
        link.title = `Signed in as ${user.fullname || user.username}`;

        // Add signed-in styling
        link.style.color = '#28a745'; // Green color to indicate signed in
    }

    function updateSignedOutProfileIcon(link) {
        // Update href to go to auth page
        link.href = 'auth.html';

        // Update aria-label
        link.setAttribute('aria-label', 'Profile - Sign In');

        // Find the icon container
        const iconContainer = link.querySelector('.c-icon');
        if (!iconContainer) return;

        // Check if this is mobile (smaller) version
        const isMobile = link.classList.contains('mobile');
        const iconSize = isMobile ? '16' : '1.5em';
        const iconHeight = isMobile ? '17' : '1.5em';

        // Reset to default profile icon
        if (isMobile) {
            iconContainer.innerHTML = `
                <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.8094 13.7145V12.7622C11.8094 12.257 11.6087 11.7725 11.2515 11.4153C10.8943 11.0581 10.4098 10.8574 9.90468 10.8574H6.09518C5.59001 10.8574 5.10553 11.0581 4.74832 11.4153C4.39111 11.7725 4.19043 12.257 4.19043 12.7622V13.7145" stroke="#303A4D" stroke-width="1.42857" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7.99996 8.95256C9.05193 8.95256 9.90471 8.09978 9.90471 7.04781C9.90471 5.99585 9.05193 5.14307 7.99996 5.14307C6.948 5.14307 6.09521 5.99585 6.09521 7.04781C6.09521 8.09978 6.948 8.95256 7.99996 8.95256Z" stroke="#303A4D" stroke-width="1.42857" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7.98075 15.3175C11.9256 15.3175 15.1236 12.1195 15.1236 8.1746C15.1236 4.2297 11.9256 1.03174 7.98075 1.03174C4.03586 1.03174 0.837891 4.2297 0.837891 8.1746C0.837891 12.1195 4.03586 15.3175 7.98075 15.3175Z" stroke="#303A4D" stroke-width="1.42857" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else {
            iconContainer.innerHTML = `
                <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.3333 20V18.6666C17.3333 17.9594 17.0524 17.2811 16.5523 16.781C16.0522 16.281 15.3739 16 14.6667 16H9.3334C8.62616 16 7.94788 16.281 7.44779 16.781C6.9477 17.2811 6.66675 17.9594 6.66675 18.6666V20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 13.3333C13.4728 13.3333 14.6667 12.1394 14.6667 10.6666C14.6667 9.1939 13.4728 8 12 8C10.5273 8 9.33337 9.1939 9.33337 10.6666C9.33337 12.1394 10.5273 13.3333 12 13.3333Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11.973 22.2441C17.4959 22.2441 21.973 17.767 21.973 12.2441C21.973 6.72129 17.4959 2.24414 11.973 2.24414C6.45017 2.24414 1.97302 6.72129 1.97302 12.2441C1.97302 17.767 6.45017 22.2441 11.973 22.2441Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }

        // Reset styling
        link.style.color = '';
        link.title = 'Sign in to your account';
    }

    // Listen for auth state changes
    function setupAuthStateListener() {
        // Listen for storage changes (when user logs in/out from another tab)
        window.addEventListener('storage', function (e) {
            if (e.key === 'goshop_current_user') {
                updateProfileIcons();
            }
        });

        // Listen for custom auth events
        window.addEventListener('authStateChanged', function () {
            updateProfileIcons();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfileIconUpdater);
    } else {
        initProfileIconUpdater();
    }

    // Setup listeners
    setupAuthStateListener();

    function updateMobileSignInButtons(isLoggedIn, user) {
        // Find all mobile sign-in buttons
        const mobileAuthContainers = document.querySelectorAll('.c-mobile-auth');

        mobileAuthContainers.forEach(container => {
            if (isLoggedIn) {
                // User is logged in - show logout button and user info
                updateSignedInMobileAuth(container, user);
            } else {
                // User is not logged in - show original sign-in buttons
                updateSignedOutMobileAuth(container);
            }
        });
    }

    function updateSignedInMobileAuth(container, user) {
        // Replace the mobile auth container content with user info and logout
        container.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #FED141 0%, #f7c52d 100%);
                border-radius: 1em;
                padding: 1.5em;
                margin-bottom: 1em;
                color: #303A4D;
                text-align: center;
                box-shadow: 0 4px 15px rgba(254, 209, 65, 0.3);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1em;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: rgba(48, 58, 77, 0.15);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 1em;
                    ">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: #303A4D;">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.25em;">
                            ${user.fullname || user.username}
                        </div>
                        <div style="font-size: 0.9em; opacity: 0.9;">
                            ${user.email}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1em;">
                    <a href="profile.html" class="c-btn is-large w-inline-block" style="
                        flex: 1;
                        background: rgba(48, 58, 77, 0.15);
                        border: 2px solid rgba(48, 58, 77, 0.2);
                        border-radius: 0.75em;
                        text-decoration: none;
                        transition: all 0.2s ease;
                        padding: 0.75em 1em;
                        display: block;
                        text-align: center;
                    " onmouseover="this.style.background='rgba(48, 58, 77, 0.25)'" onmouseout="this.style.background='rgba(48, 58, 77, 0.15)'">
                        <div style="color: #303A4D; font-weight: 600; font-size: 0.95em;">
                            View Profile
                        </div>
                    </a>
                    
                    <button onclick="handleMobileLogout()" class="c-btn is-large is-secondary" style="
                        flex: 1;
                        background: #303A4D;
                        border: none;
                        border-radius: 0.75em;
                        color: white;
                        font-weight: 600;
                        font-size: 0.95em;
                        padding: 0.75em 1em;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='#253142'" onmouseout="this.style.background='#303A4D'">
                        Logout
                    </button>
                </div>
            </div>
        `;
    }

    function updateSignedOutMobileAuth(container) {
        // Restore original sign-in buttons if they were replaced
        // Check if container already has the correct structure
        const signInBtn = container.querySelector('.c-btn-label');
        if (!signInBtn || signInBtn.textContent.trim() !== 'Sign in') {
            // Restore original mobile auth buttons
            container.innerHTML = `
                <a href="auth.html" class="c-btn is-large w-inline-block">
                    <div class="c-btn-bg"></div>
                    <div class="c-btn-inner">
                        <div class="c-btn-txt">
                            <div class="c-btn-label line-1">Sign in</div>
                            <div class="c-btn-label line-2">Sign in</div>
                        </div>
                    </div>
                </a>
                <a href="auth.html" class="c-btn is-large is-secondary w-inline-block">
                    <div class="c-btn-inner">
                        <div class="c-btn-txt">
                            <div class="c-btn-label line-1">Create account</div>
                            <div class="c-btn-label line-2">Create account</div>
                        </div>
                    </div>
                </a>
            `;
        }
    }

    // Global function to handle mobile logout
    window.handleMobileLogout = function () {
        if (window.GoShopAuth && window.GoShopAuth.logout) {
            window.GoShopAuth.logout();
            // Redirect to home page after logout
            window.location.href = 'index.html';
        }
    };

    // Expose function globally for manual updates
    window.updateProfileIcons = updateProfileIcons;

})();
