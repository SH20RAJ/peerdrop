# PeerDrop 🌐💨

> A privacy-focused, peer-to-peer (P2P) file sharing app — fast, secure, and serverless.

PeerDrop lets you share large files **directly between devices** using WebRTC. No file ever touches a server. No storage. No spying. Just pure, encrypted transfer — from you to your peer.

![PeerDrop Screenshot](https://via.placeholder.com/800x400?text=PeerDrop+Screenshot)

## 🔧 Tech Stack

| Layer | Tech |
|------|------|
| Frontend | HTML, Tailwind CSS, JavaScript |
| Core Logic | WebRTC DataChannel |
| Signaling Server | Node.js + Express + Socket.io |
| TURN/STUN | Google STUN servers |

## 🛠 Features

- 🔒 **End-to-End Encrypted** via WebRTC
- 🚫 **No cloud storage**
- ⚡ **Instant connection** with QR code or sharing code
- 📁 **Unlimited file size** (limited by RAM + connection)
- 🌍 **Works across devices** (mobile to PC, etc.)

## 🚀 How It Works

1. Peer A opens the website and drops a file.
2. A WebRTC offer is created and shared via a **link or QR code**.
3. Peer B opens the link → signaling handshake via server.
4. Once connected, file is streamed from A to B via WebRTC.
5. File never touches a third-party server.

## 🏗️ Project Structure

```
peerdrop/
├── public/                # Static assets (icons, favicon, etc.)
├── src/
│   ├── index.html         # Entry HTML
│   ├── styles/            # CSS styles
│   │   └── main.css       # Tailwind CSS
│   └── js/                # JavaScript files
│       └── app.js         # Core WebRTC logic
├── server/
│   ├── index.js           # Express + Socket.io Signaling Server
│   └── config.js          # TURN/STUN configs
├── README.md
└── package.json
```

## 🧠 WebRTC Flow Summary

- `RTCPeerConnection` is used to create a connection.
- `createOffer()` and `createAnswer()` are exchanged via `Socket.io`.
- Files are streamed through `DataChannel`.

## 🧪 Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/peerdrop.git

# Install dependencies
cd peerdrop
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

Then open http://localhost:3000 in your browser.

## 🌐 Deployment

- Frontend & Backend: Deploy to Vercel, Netlify, Heroku, or any Node.js hosting service
- For production, consider setting up a dedicated TURN server for better NAT traversal

## 🤝 Contributing

Contributions are welcome! If you want to:
- Improve UI
- Add QR scan support
- Make a desktop/mobile app version
- Add password-protected file sharing

Fork the repo and open a PR 🚀

## 📜 License

MIT License

## 💡 Inspiration

Inspired by [ToffeeShare](https://toffeeshare.com), built with love and curiosity ❤️
