# OPC UA PLC Monitoring App

A production-ready React Native application for monitoring and controlling industrial PLCs via OPC UA protocol. Built with Expo, featuring real-time data monitoring, user authentication, and multi-platform support (iOS, Android, Web).

## 🚀 Features

- ✅ **OPC UA Integration** - Connect to industrial PLCs using OPC UA protocol
- ✅ **Real-time Monitoring** - Live data updates from PLC variables
- ✅ **User Authentication** - Secure login with Supabase
- ✅ **Multi-platform** - Runs on iOS, Android, and Web
- ✅ **Dark Mode** - Full dark/light theme support
- ✅ **Multilingual** - English and Turkish language support
- ✅ **Production Ready** - Optimized for deployment

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app (for mobile testing)

## 🔧 Installation

1. **Clone and navigate to the project:**
   ```bash
   cd expo-app
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_API_URL=https://opc.ozkanerozcan.com
   ```

## 🚀 Running the App

### Development

Start the development server:
```bash
npm start
```

### Platform-Specific

**Android:**
```bash
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## 🏭 OPC UA Configuration

The app connects to an OPC UA server at `https://opc.ozkanerozcan.com`.

### Connecting to PLC

1. Navigate to the PLC Connection screen
2. Enter your OPC UA endpoint (e.g., `opc.tcp://localhost:4840`)
3. Configure security settings:
   - Security Policy: None, Basic256, Basic256Sha256
   - Security Mode: None, Sign, SignAndEncrypt
   - Authentication: Anonymous or Username/Password
4. Tap "Connect"

### Reading/Writing Variables

Once connected, you can:
- Browse available OPC UA nodes
- Read variable values in real-time
- Write values to PLC variables
- Subscribe to variable changes

## 📱 App Structure

```
expo-app/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.js       # Home/Dashboard
│   │   ├── explore.js     # PLC Browser
│   │   ├── profile.js     # User Profile
│   │   └── settings.js    # App Settings
│   ├── login.js           # Login Screen
│   └── register.js        # Register Screen
├── contexts/              # State Management
│   ├── AuthContext.js     # Authentication
│   ├── ThemeContext.js    # Dark/Light Theme
│   ├── LanguageContext.js # i18n
│   └── PLCContext.js      # OPC UA Connection
├── services/              # API Services
│   └── plcApi.js          # OPC UA API Client
└── config.js              # App Configuration
```

## 🌐 API Endpoints

The app communicates with the following OPC UA API endpoints:

- `POST /api/opcua/connect` - Establish PLC connection
- `POST /api/opcua/disconnect` - Close PLC connection
- `GET /api/opcua/status` - Check connection status
- `POST /api/opcua/read` - Read variable value
- `POST /api/opcua/write` - Write variable value
- `POST /api/opcua/browse` - Browse OPC UA nodes
- `POST /api/opcua/subscribe` - Subscribe to variable changes

## 🎨 Customization

### Theme Colors

Edit `contexts/ThemeContext.js` to customize colors:
```javascript
colors: {
  primary: '#1173d4',  // Primary brand color
  background: '#ffffff', // Background color
  // ... other colors
}
```

### Language Support

Add translations in `contexts/LanguageContext.js`:
```javascript
const translations = {
  en: { welcome: 'Welcome' },
  tr: { welcome: 'Hoş geldiniz' },
};
```

## 🚀 Production Build

### Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Build:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

### Web Deployment

Build for web:
```bash
npx expo export:web
```

Deploy the `web-build` directory to your hosting service.

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- Implement proper authentication on the backend
- Use HTTPS for production deployments
- Validate all user inputs before sending to PLC

## 🐛 Troubleshooting

**Clear cache:**
```bash
npx expo start --clear
```

**Reset node modules:**
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

**Connection issues:**
- Verify API URL in `.env` file
- Check network connectivity
- Ensure OPC UA server is running
- Check firewall settings

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [OPC UA Specification](https://opcfoundation.org/)
- [Supabase Documentation](https://supabase.com/docs)

## 📝 License

This project is proprietary software.

## 🤝 Support

For technical support or questions, contact the development team.

---

Built with ❤️ for Industrial IoT
# rn-opc-client
