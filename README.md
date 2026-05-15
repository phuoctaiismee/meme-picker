# 🚀 Meme Shelf - AI Powered Meme Picker

A premium, professional browser extension designed to revolutionize how you use memes. Integrated with AI suggestions and a sleek "Soft Zinc" design system.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Plasmo](https://img.shields.io/badge/Framework-Plasmo-purple.svg)

---

## ✨ Key Features

- **🤖 AI-Powered Suggestions**: Describe the meme you need, and let our AI find the perfect match for your context.
- **⚡ Supercharged Performance**: Near-instant loading using `chrome.storage.local` with a Stale-While-Revalidate (SWR) strategy.
- **🌍 Multi-Language Support**: Fully localized in **English** and **Vietnamese**, automatically adapting to your browser settings.
- **🎯 Smart Auto-Paste**: Automatically detects comment boxes on platforms like Facebook, Discord, and more to "paste" your chosen meme instantly.
- **🖱️ Advanced Drag & Drop**: Seamlessly drag memes from the shelf directly into any website's upload area.
- **🎨 Premium Zinc Aesthetic**: A modern, responsive UI built with Vanilla CSS and Shadow DOM isolation to prevent style conflicts with host websites.

---

## 🛠️ Tech Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) (The Browser Extension Framework)
- **UI Logic**: React 18
- **State Management**: TanStack Query (React Query) v5
- **Styling**: Vanilla CSS with Shadow DOM encapsulation
- **Storage**: Chrome Storage API for persistent caching

---

## 📦 Installation (Developer Mode)

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd meme-picker
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Build the production bundle**:
   ```bash
   pnpm run build
   # or
   npm run build
   ```

4. **Load into Chrome**:
   - Open Chrome and go to `chrome://extensions`.
   - Enable **Developer Mode** (top right).
   - Click **Load unpacked** and select the `build/chrome-mv3-prod` folder.

---

## 📖 Usage

1. Click the subtle **Marker** on the right side of your browser to open the **Meme Shelf**.
2. Search for memes or select from the suggested categories.
3. **To Upload**: 
   - Simply **click** a meme (ensure you have focused a comment box first).
   - Or **drag and drop** the meme directly into the website.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Developed with ❤️ by the Meme Shelf Team.*
