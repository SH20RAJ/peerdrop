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

```bash
peerdrop/
├── public/                # Static assets (icons, favicon, etc.)
├── src/
│   ├── index.html         # Entry HTML
│   ├── 404.html           # 404 error page
│   ├── styles/            # CSS styles
│   │   └── main.css       # Tailwind CSS
│   └── js/                # JavaScript files
│       └── app.js         # Core WebRTC logic
├── server/
│   ├── index.js           # Express + Socket.io Signaling Server
│   └── config.js          # TURN/STUN configs
├── workers-site/          # Cloudflare Workers configuration
│   ├── index.js           # Worker script
│   └── package.json       # Worker dependencies
├── wrangler.toml          # Cloudflare Wrangler config
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
git clone https://github.com/sh20raj/peerdrop.git

# Install dependencies
cd peerdrop
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Cloudflare Pages Deployment

#### Method 1: Using Wrangler CLI

1\. Install dependencies:

```bash
npm install
```

2\. Authenticate with Cloudflare:

```bash
npx wrangler login
```

3\. Update your Cloudflare account details in `wrangler.toml`:

```toml
account_id = "your-account-id" # Replace with your Cloudflare account ID
zone_id = "your-zone-id"       # Replace with your Cloudflare zone ID (if applicable)
```

4\. Build the project:

```bash
npm run build
```

5\. Deploy to Cloudflare Workers:

```bash
npx wrangler deploy
```

#### Method 2: Using Cloudflare Dashboard

1\. Build the project:

```bash
npm run build
```

2\. Go to the [Cloudflare Pages dashboard](https://dash.cloudflare.com/?to=/:account/pages)

3\. Click "Create a project"

4\. Connect your GitHub repository

5\. Configure your build settings:

- Build command: `npm run build`
- Build output directory: `src`
- Root directory: `/`

6\. Click "Save and Deploy"

### Signaling Server Deployment

With our updated implementation, the signaling server is now integrated into the Cloudflare Worker using Durable Objects for WebSocket support:

1\. Make sure your Cloudflare account has access to Durable Objects (available on the Workers Paid plan)

2\. Update your `wrangler.toml` with your Cloudflare account ID:

```toml
account_id = "your-account-id" # Replace with your Cloudflare account ID
```

3\. Deploy the worker with Durable Objects:

```bash
npx wrangler deploy
```

The Durable Objects migration will be automatically applied during deployment.

4\. For production with high traffic, consider setting up a dedicated TURN server for better NAT traversal

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
