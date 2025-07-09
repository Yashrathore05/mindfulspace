# 🌿 Mindful Space - Your Personal Wellness Companion

<div align="center">

![Mindful Space Logo](assets/logo.png)

[![React Native](https://img.shields.io/badge/React%20Native-0.76.7-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52.0.27-black.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.2.0-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-0BSD-green.svg)](LICENSE)

**Transform your mental wellness journey with AI-powered therapy, guided meditation, and personalized wellness tools.**

[🌐 **Download APK**](https://mw-var3.vercel.app/) | [📱 **Features**](#features) | [🚀 **Getting Started**](#getting-started) | [🛠️ **Tech Stack**](#tech-stack)

</div>

---

## ✨ Overview

**Mindful Space** is a comprehensive mental wellness application designed to help users achieve better mental health through AI-powered therapy, guided breathing exercises, mindfulness practices, and personalized wellness tracking. Built with React Native and Expo, it offers a seamless cross-platform experience with beautiful animations and intuitive user interfaces.

### 🎯 Mission
To provide accessible, evidence-based mental health tools that empower individuals to take control of their emotional well-being through technology and AI-driven insights.

---

## 🌟 Key Features

### 🧠 **AI-Powered Mental Health Assistant**
- **Intelligent Chatbot**: 24/7 mental health support with context-aware responses
- **Mood Assessment**: Comprehensive mood tracking with personalized insights
- **Conversation History**: Save and review your therapy sessions
- **Personalized Recommendations**: AI-driven wellness suggestions based on your patterns

### 🫁 **Guided Breathing & Meditation**
- **Breathing Techniques**: Multiple breathing patterns for stress relief
- **Video Guides**: High-quality instructional videos for proper technique
- **Progress Tracking**: Monitor your breathing practice consistency
- **Customizable Sessions**: Adjust duration and intensity to your needs

### 🌱 **Mindfulness & Wellness Tools**
- **Daily Affirmations**: Positive affirmations to boost mental health
- **Mindfulness Exercises**: Guided sessions for present-moment awareness
- **Sleep Wellness**: Tools and tips for better sleep quality
- **Healthy Eating**: Nutrition guidance for mental wellness

### 📊 **Comprehensive Wellness Dashboard**
- **Mood Garden**: Visual mood tracking with beautiful animations
- **Progress Analytics**: Track your wellness journey over time
- **Goal Setting**: Set and achieve mental health milestones
- **Personalized Insights**: Data-driven recommendations

### 👨‍⚕️ **Professional Consultation**
- **Therapist Booking**: Connect with licensed mental health professionals
- **Voice Therapy Sessions**: AI-powered voice therapy with real-time feedback
- **Session Management**: Easy booking and appointment tracking
- **Secure Communication**: Encrypted chat with healthcare providers

### 🔐 **Security & Privacy**
- **Firebase Authentication**: Secure user authentication with Google Sign-In
- **Data Encryption**: All sensitive data is encrypted in transit and at rest
- **Privacy-First**: User data is protected and never shared without consent
- **GDPR Compliant**: Full compliance with data protection regulations

---

## 🛠️ Tech Stack

### **Frontend & Mobile**
- **React Native 0.76.7**: Cross-platform mobile development
- **Expo 52.0.27**: Development platform and build tools
- **React Navigation 7.x**: Navigation and routing
- **React Native Reanimated**: Smooth animations and gestures
- **React Native Paper**: Material Design components

### **Backend & Services**
- **Firebase 11.2.0**: Authentication, database, and cloud services
- **Firestore**: NoSQL database for real-time data
- **Firebase Auth**: User authentication and session management
- **Firebase Storage**: Media file storage and management

### **AI & Machine Learning**
- **Google Gemini API**: Advanced AI for mental health conversations
- **Natural Language Processing**: Context-aware responses
- **Sentiment Analysis**: Mood assessment and tracking
- **Personalization Engine**: AI-driven recommendations

### **Development Tools**
- **Expo CLI**: Development and build management
- **AsyncStorage**: Local data persistence
- **Axios**: HTTP client for API communications
- **React Native Vector Icons**: Beautiful iconography

---

## 📱 Screenshots

<div align="center">

| Dashboard | AI Chat | Breathing Exercises |
|-----------|---------|-------------------|
| ![Dashboard](assets/images/dashboard.png) | ![AI Chat](assets/images/chat.png) | ![Breathing](assets/images/breathing.png) |

| Mood Garden | Consultation | Settings |
|-------------|--------------|----------|
| ![Mood Garden](assets/images/mood-garden.png) | ![Consultation](assets/images/consultation.png) | ![Settings](assets/images/settings.png) |

</div>

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mindfulspace.git
   cd mindfulspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories
   - Update Firebase configuration in `services/firebaseConfig.js`

4. **Set up environment variables**
   ```bash
   # Create .env file
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

### Building for Production

1. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

2. **Build for Android**
   ```bash
   eas build --platform android
   ```

3. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

---

## 📦 Project Structure

```
mindfulspace/
├── assets/                 # Images, videos, and static assets
│   ├── images/            # App images and icons
│   ├── audio/             # Audio files for meditation
│   └── videos/            # Instructional videos
├── components/            # Reusable React components
├── screens/              # App screens and pages
│   ├── Dashboard.js      # Main dashboard
│   ├── ChatbotScreen.js  # AI chat interface
│   ├── Breathing.js      # Breathing exercises
│   ├── Mindfulness.js    # Mindfulness tools
│   └── ...              # Other screens
├── services/             # API services and configurations
│   ├── firebaseConfig.js # Firebase setup
│   ├── chatService.js    # Chat functionality
│   └── subscriptionService.js
├── store/               # State management
├── utils/               # Utility functions
├── App.js              # Main app component
└── package.json        # Dependencies and scripts
```

---

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Google Sign-In)
3. Create a Firestore database
4. Set up security rules
5. Configure storage for media files

### API Keys
- **Google Gemini API**: For AI chat functionality
- **Firebase Config**: For authentication and database
- **Expo Push Tokens**: For notifications

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service testing
- **E2E Tests**: User flow testing with Detox
- **Performance Tests**: App performance and memory usage

---

## 📈 Performance Optimization

### React Native Optimizations
- **Hermes Engine**: JavaScript engine for better performance
- **Fabric Renderer**: New rendering system for improved performance
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compressed images and lazy loading

### Memory Management
- **Component Memoization**: Prevent unnecessary re-renders
- **Image Caching**: Efficient image loading and caching
- **Background Processing**: Optimized background tasks
- **Memory Leak Prevention**: Proper cleanup of event listeners

---

## 🔒 Security Features

### Data Protection
- **End-to-End Encryption**: All sensitive data is encrypted
- **Secure Storage**: Encrypted local storage with AsyncStorage
- **API Security**: HTTPS-only communications
- **Input Validation**: Comprehensive input sanitization

### Authentication Security
- **Multi-Factor Authentication**: Enhanced security for user accounts
- **Session Management**: Secure session handling
- **Token Refresh**: Automatic token refresh for continuous security
- **Biometric Authentication**: Fingerprint and face ID support

---

## 📊 Analytics & Monitoring

### User Analytics
- **User Engagement**: Track feature usage and user behavior
- **Performance Metrics**: Monitor app performance and crashes
- **A/B Testing**: Test different features and UI elements
- **User Feedback**: In-app feedback collection

### Error Monitoring
- **Crash Reporting**: Automatic crash detection and reporting
- **Performance Monitoring**: Real-time performance tracking
- **User Journey Tracking**: Complete user flow analysis
- **Custom Events**: Track specific user actions and behaviors

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **0BSD License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Native Community** for the amazing framework
- **Expo Team** for the development platform
- **Firebase Team** for the backend services
- **Google Gemini Team** for AI capabilities
- **All Contributors** who helped make this project possible

---

## 📞 Support

- **Email**: contact@theyashrathore.in

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/mindfulspace&type=Date)](https://star-history.com/#yourusername/mindfulspace&Date)

---

<div align="center">

**Made with ❤️ for better mental health**

[🌐 **Download APK**](https://mw-var3.vercel.app/) | [📖 **Documentation**](https://docs.mindfulspace.app) | [🐛 **Report Issues**](https://github.com/yourusername/mindfulspace/issues)

</div> 