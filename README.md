# 🛠️ OX Cloner - Discord Server Cloner

![Version](https://img.shields.io/badge/version-1.3.0-white?style=for-the-badge)
![Tech](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Design](https://img.shields.io/badge/Design-Brutalist-white?style=for-the-badge)

**OX Cloner** is a professional cloning engine with a modern brutalist interface, designed to replicate Discord servers down to the last pixel. It combines security, speed, and ease of use to take server management to the next level.

---

## ✨ Key Features

- **🎯 Flawless Replication**: Seamlessly copies Channels, Categories, Roles, Permissions, and Emojis.
- **⚡ Smart Delay & Fast Mode**: 
  - **Safe Mode (1000ms)**: Balanced mode prioritizing account safety.
  - **Fast Mode (500ms)**: Optimized high-speed cloning for speed enthusiasts.
- **🛡️ Advanced Security Layer**:
  - **Pre-Flight Check**: Validates Token and Administrator permissions before starting.
  - **Smart Skip**: Automatically skips problematic steps (after 3 consecutive errors) and continues the process.
- **📱 Ultra-Responsive Design**: A sleek, eye-pleasing brutalist UI that works perfectly on both desktop and mobile devices.
- **🌍 11 Language Support**: Global accessibility with TR, EN, ES, FR, DE, PT, IT, RU, JA, AR, ID support.
- **📡 Live Log System**: Terminal-style log screen to monitor every step in real-time.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- Discord User Token (Compliance with Self-Bot policies is required)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OxironDev/OX-Cloner.git
   cd OX-Cloner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create `.env.local`):
   ```env
   NEXT_PUBLIC_API_PASSWORD=your_secure_password
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

---

## 🛠️ Technical Overview

- **Framework**: Next.js 16 (App Router)
- **Discord Lib**: Eris
- **Styling**: Vanilla CSS (Custom Brutalist Design System)
- **API Security**: Token validation & Admin permission checks

---

## ⚠️ Disclaimer

This tool is developed for educational purposes. Violating Discord's "Self-Bot" policies may lead to account termination. The responsibility for its use lies entirely with the user.

---

## 🤝 Contributing

If you'd like to contribute, feel free to open a *Pull Request* or report a bug. All improvements are welcome!

---

<p align="center">
  <b>© 2026 Oxiron Development • Premium Cloner Engine</b>
</p>
