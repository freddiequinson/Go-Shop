# GoShop Ghana Mobile App

React Native mobile application for GoShop Ghana e-commerce platform, built with Expo.

## 🚀 Features

### Core Features
- ✅ **Authentication**: Login, Register, Google OAuth
- ✅ **Shopping**: Browse products, search, categories, cart management
- ✅ **Orders**: Place orders, track deliveries, order history
- ✅ **Payments**: Wallet integration, Paystack payments
- ✅ **User Profile**: Manage profile, addresses, preferences
- ✅ **Notifications**: Push notifications for orders and updates

### Advanced Features
- ✅ **Bubbles**: Community shopping groups
- ✅ **Messaging**: In-app chat with sellers and groups
- ✅ **Reviews**: Product and seller ratings
- ✅ **Multi-Role Support**: Buyer, Seller, Supplier, Rider, Admin dashboards

### Mobile-Specific Features
- 📸 **Camera Integration**: Product image capture
- 📍 **Location Services**: Delivery address selection
- 🔔 **Push Notifications**: Real-time order updates
- 💾 **Offline Mode**: Basic functionality without internet
- 🎨 **Native UI**: Platform-specific design patterns

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Physical device or emulator

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_URL=https://your-backend-url.com
API_VERSION=/api/v1

# Payment Gateway (Paystack)
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Environment
APP_ENV=development
```

### 3. Update app.json

Update the `extra.eas.projectId` in `app.json` with your EAS project ID (get it by running `eas init`).

## 🏃 Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Using Expo Go App

1. Install Expo Go on your phone from App Store/Play Store
2. Run `npm start`
3. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

## 📱 Project Structure

```
mobile-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── shop/            # Shopping screens
│   │   ├── cart/            # Cart screens
│   │   ├── orders/          # Orders screens
│   │   ├── profile/         # Profile screens
│   │   └── _layout.tsx
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   ├── products/            # Product components
│   ├── cart/                # Cart components
│   └── orders/              # Order components
├── constants/               # App constants
│   └── theme.ts             # Theme configuration
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   ├── CartContext.tsx      # Cart state
│   └── ThemeContext.tsx     # Theme state
├── hooks/                   # Custom hooks
├── lib/                     # Utilities
│   └── api/                 # API client
├── services/                # API services
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   └── order.service.ts
├── types/                   # TypeScript types
│   └── index.ts
├── app.json                 # Expo configuration
├── package.json
└── tsconfig.json
```

## 🎨 Design System

The mobile app uses the same design system as the web app:

- **Colors**: OKLCH color space with light/dark mode support
- **Typography**: System fonts with consistent sizing
- **Spacing**: 4px base unit (xs: 4, sm: 8, md: 16, lg: 24, xl: 32)
- **Components**: Matching web app UI patterns

## 🔐 Authentication Flow

1. **Welcome Screen**: First-time user onboarding
2. **Login/Register**: Email/password or Google OAuth
3. **Role-Based Routing**: Automatic redirect based on user type
   - Buyer → Shop Tab
   - Seller → Seller Dashboard
   - Supplier → Supplier Portal
   - Rider → Rider Portal
   - Admin → Admin Dashboard

## 📦 Building for Production

### Android (APK/AAB)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production
```

### iOS (IPA)

```bash
# Build for iOS
eas build --platform ios --profile production
```

## 🚀 Deployment to Play Store

### 1. Prepare Assets

- App icon (1024x1024px)
- Feature graphic (1024x500px)
- Screenshots (phone and tablet)
- App description and metadata

### 2. Build Release AAB

```bash
eas build --platform android --profile production
```

### 3. Upload to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill in store listing details
5. Set up content rating
6. Submit for review

## 🔧 Configuration

### API Client

The API client is configured in `lib/api/client.ts`:

- Base URL from environment variables
- Automatic token injection
- Error handling and retry logic
- Request/response interceptors

### Push Notifications

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### Google OAuth

1. Create OAuth credentials in Google Cloud Console
2. Add authorized redirect URIs
3. Update `.env` with client ID

## 📝 Development Phases

### ✅ Phase 1: Project Setup (COMPLETED)
- Expo project initialization
- Dependencies installation
- TypeScript configuration
- Theme system setup

### 🔄 Phase 2: Core Configuration (IN PROGRESS)
- Navigation setup
- API client configuration
- Authentication context
- Environment variables

### 📋 Phase 3: Authentication (NEXT)
- Login screen
- Register screen
- Google OAuth integration
- Password reset

### 📋 Phase 4: UI Components
- Button, Input, Card components
- Product card component
- Cart item component
- Order card component

### 📋 Phase 5: Shopping Features
- Product listing
- Product details
- Search functionality
- Cart management
- Checkout flow

### 📋 Phase 6: User Features
- Profile management
- Order history
- Wallet integration
- Address management

### 📋 Phase 7: Advanced Features
- Bubbles (community groups)
- In-app messaging
- Reviews and ratings
- Real-time updates

### 📋 Phase 8: Role-Based Dashboards
- Supplier portal
- Rider portal
- Seller dashboard
- Admin dashboard

### 📋 Phase 9: Mobile-Specific Features
- Push notifications
- Camera integration
- Location services
- Offline mode

### 📋 Phase 10: Testing & Deployment
- Unit tests
- Integration tests
- E2E tests
- Play Store submission

## 🐛 Troubleshooting

### Common Issues

**1. Metro bundler not starting**
```bash
# Clear cache and restart
npx expo start -c
```

**2. Module not found errors**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**3. Android build fails**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
```

**4. iOS build fails (macOS)**
```bash
# Clean iOS build
cd ios
pod install
cd ..
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Router](https://expo.github.io/router/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Proprietary - GoShop Ghana

## 👥 Team

- **Backend API**: FastAPI (Python)
- **Web Frontend**: Next.js (TypeScript)
- **Mobile App**: Expo (React Native + TypeScript)

## 📞 Support

For issues or questions, contact the development team.
