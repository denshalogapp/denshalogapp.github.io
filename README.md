# Eki Story

## 🛠 Developer Setup Guide (Vite + Capacitor)

### 1. Clone & Initial Install

Open your terminal in VS Code and run:

Bash

```
git clone https://github.com/liam2503/eki-story.git
cd eki-story
npm install

```

_This installs Vite, Capacitor, and all project dependencies into your local `node_modules`._

### 2. Environment Configuration

Since API keys are kept out of GitHub for security, you must create a local environment file:

1.  Create a file named `.env` in the root directory.
    
2.  Add your Google Maps API key:
    
    Plaintext
    
    ```
    GOOGLE_MAPS_KEY=your_actual_key_here
    
    ```
    

_Vite will automatically inject this into your HTML wherever `%GOOGLE_MAPS_KEY%` is used._

----------

## 💻 Running the Project

### A. Web Development (VS Code)

To start the high-performance Vite development server with **Hot Module Replacement (HMR)**:

Bash

```
npm run dev

```

-   **Local URL:** `http://localhost:5173`.
    
-   **Live Updates:** Changes to your code are reflected instantly in the browser without a full page reload.
    

### B. iOS App Development (Simulator)

To test the app inside the iPhone simulator with Live Reload:

1.  Find your Mac's IP (Option + Click Wi-Fi icon).
    
2.  Ensure `capacitor.config.json` points to your IP and port `5173`.
    
3.  Run:
    

Bash

```
npx cap run ios --live-reload --host=YOUR_MAC_IP

```

----------

## 🏗 Building for Production

When you are ready to deploy to GitHub Pages or ship a final version of the app:

1.  **Build the Web Assets:**
    
    Bash
    
    ```
    npm run build
    
    ```
    
    _This creates a `dist/` folder containing optimized, minified code with your API keys injected._
    
2.  **Sync to iOS:**
    
    Bash
    
    ```
    npx cap sync
    
    ```
    
    _This copies the contents of `dist/` into the native iOS project._
