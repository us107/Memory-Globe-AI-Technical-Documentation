
# 🌐 Memory Globe AI

<div align="center">

### Transform Your Memories into an Interactive 3D Neural Matrix

An immersive, gesture-controlled 3D visualization platform that turns your photos into a celestial sphere navigable through AI-powered hand tracking.

[Live Demo](https://memory-globe-ai-technical-documenta.vercel.app/) • [Documentation](#documentation) • [Features](#core-features)

</div>

---

## 📹 Demo

<!-- Add your demo video here -->
https://github.com/user-attachments/assets/your-video-file.mp4

*Experience zero-touch navigation through your memory sphere using AI hand tracking*

---

## 🎯 Overview

**Memory Globe AI** reimagines how we interact with personal photos by creating an immersive 3D "Neural Matrix" where up to 100 images float in space, forming a celestial globe controlled entirely by hand gestures. No mouse, no keyboard—just your hands and your memories.

### ✨ Key Highlights

- 🤖 **AI-Powered Hand Tracking** - Real-time gesture recognition using Google MediaPipe
- 🎨 **WebGL 3D Rendering** - High-performance Three.js visualization with 18,000 procedural stars
- 🔒 **Privacy-First** - All processing happens locally in your browser
- 📱 **Fully Responsive** - Optimized for desktop, laptop, tablet, and mobile devices
- 🎭 **Zero-Touch Interface** - Navigate entirely through physical gestures

---

## 🚀 Core Features

### 🖐️ Neural Hand Interface

Control the memory sphere with intuitive hand gestures:

| Gesture | Action | Result |
|---------|--------|--------|
| **Right Hand Pinch + Move** | Rotate Globe | Spin and tilt the memory sphere with physics-based inertia |
| **Left Hand Pinch + Vertical** | Zoom Control | Travel deeper into or away from the matrix |
| **Open/Closed Palm** | Flow Speed | Adjust rotation intensity dynamically |
| **Double Pinch** | Reset View | Instantly center the globe |

### 🎨 Visual Experience

- **Fibonacci Sphere Distribution** - Perfect equidistant spacing of memories
- **Aspect Ratio Preservation** - Dynamic geometry scaling prevents image distortion
- **Procedural Starfield** - 18,000+ particles creating a sense of infinite space
- **Glassmorphic UI** - Futuristic HUD with real-time telemetry
- **Batch Loading Engine** - Smooth 60FPS performance with opacity fade-ins

### 🔐 Privacy & Security

- ✅ Client-side processing only
- ✅ Camera feed processed in browser RAM
- ✅ No data transmission to servers
- ✅ Ephemeral storage cleared on tab close

---

## 🛠️ Tech Stack

Frontend Framework:    React 19 (Hooks, Concurrent Rendering)
3D Graphics:          Three.js (WebGL, Custom Shaders)
AI Vision:            Google MediaPipe Hands (21-point tracking)
Styling:              Tailwind CSS (Atomic CSS, Glassmorphism)
Icons:                Lucide React
Audio:                Web Audio API (Procedural Synthesis)
```


## 📦 Installation


# Clone the repository
git clone https://github.com/yourusername/memory-globe-ai.git

# Navigate to project directory
cd memory-globe-ai

# Install dependencies
npm install

# Start development server
npm run dev
```


## 🎮 Usage

1. **Grant Camera Access** - Allow browser to access your webcam for hand tracking
2. **Upload Images** - Add up to 100 photos to create your memory sphere
3. **Use Hand Gestures** - Navigate using the gesture controls
4. **Explore** - Immerse yourself in your 3D memory matrix

### Gesture Controls

- **Rotation**: Pinch right thumb + index finger, move hand to rotate
- **Zoom**: Pinch left thumb + index finger, move vertically
- **Speed**: Open palm (faster) / Closed fist (slower)
- **Reset**: Double-pinch with right hand

---

## 📱 Device Support

| Device | Optimization |
|--------|-------------|
| 🖥️ **Desktop/PC** | Maximum fidelity, high star density, optimal MediaPipe performance |
| 💻 **Laptops** | Power-optimized camera usage |
| 📱 **Mobile/Tablet** | Responsive UI, repositioned HUD, scaled video feed |

---

## Architecture

### Key Components

- **Hand Tracking Engine** - MediaPipe integration for gesture recognition
- **Memory Sphere Renderer** - Three.js scene with custom shaders
- **Image Processing Pipeline** - Async batch loading with aspect ratio analysis
- **Physics Simulation** - Inertia-based rotation and momentum
- **Telemetry System** - Real-time HUD with depth and flow metrics

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Google MediaPipe](https://developers.google.com/mediapipe) - Hand tracking solution
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---



**Project Link:** [https://memory-globe-ai-technical-documenta.vercel.app/](https://memory-globe-ai-technical-documenta.vercel.app/)

---

<div align="center">

⭐ Star this repo if you find it interesting!

</div>
```
