// PeerDrop - WebRTC P2P File Sharing Application
// Main JavaScript file

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const clearFileBtn = document.getElementById('clear-file');
const generateLinkBtn = document.getElementById('generate-link');
const connectionInfo = document.getElementById('connection-info');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link');
const qrcodeDiv = document.getElementById('qrcode');
const connectionStatus = document.getElementById('connection-status');
const progressBar = document.getElementById('progress-bar');
const receiverInfo = document.getElementById('receiver-info');
const receiverFileName = document.getElementById('receiver-file-name');
const receiverFileSize = document.getElementById('receiver-file-size');
const receiverStatus = document.getElementById('receiver-status');
const receiverProgressBar = document.getElementById('receiver-progress-bar');
const downloadFileBtn = document.getElementById('download-file');

// Helper functions
function showLoading() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');
}

// Global variables
let selectedFile = null;
let peerConnection = null;
let dataChannel = null;
let socket = null;
let roomId = null;
let isInitiator = false;
let receivedFile = null;
let receivedChunks = [];
let receivedSize = 0;
let fileSize = 0;
let chunkSize = 16384; // 16KB chunks

// Connect to signaling server using WebSockets
function connectToSignalingServer() {
    // Generate a random room ID if not joining an existing room
    if (!roomId) {
        roomId = generateRoomId();
    }

    // Connect to the signaling server using WebSockets
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/signal/${roomId}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('Connected to signaling server');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        switch (message.type) {
            case 'connected':
                console.log('Connected to signaling server with session ID:', message.sessionId);
                break;

            case 'created':
                console.log('Created room', message.roomId);
                roomId = message.roomId;
                isInitiator = true;

                // Generate and display sharing link
                const shareUrl = `${window.location.origin}?room=${roomId}`;
                shareLink.value = shareUrl;

                // Generate QR code
                QRCode.toCanvas(qrcodeDiv, shareUrl, { width: 200 }, (error) => {
                    if (error) console.error(error);
                });

                // Hide loading and show connection info
                hideLoading();
                connectionInfo.classList.remove('hidden');
                connectionInfo.classList.add('fade-in');
                break;

            case 'joined':
                console.log('Joined room', message.roomId);
                roomId = message.roomId;
                isInitiator = false;

                // Hide loading and show receiver info
                hideLoading();
                receiverInfo.classList.remove('hidden');
                receiverInfo.classList.add('fade-in');

                // Create peer connection as the joining peer
                createPeerConnection();
                break;

            case 'full':
                hideLoading();
                alert(`Room ${message.roomId} is full. Please try again later.`);
                break;

            case 'ready':
                console.log('Peer joined, creating connection...');
                if (isInitiator) {
                    createPeerConnection();
                }
                break;

            case 'offer':
                if (!isInitiator && peerConnection) {
                    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
                        .then(() => {
                            console.log('Setting remote description from offer');
                            return peerConnection.createAnswer();
                        })
                        .then(answer => {
                            console.log('Creating answer');
                            return peerConnection.setLocalDescription(answer);
                        })
                        .then(() => {
                            console.log('Sending answer');
                            socket.send(JSON.stringify({
                                type: 'answer',
                                sdp: peerConnection.localDescription,
                                roomId: roomId
                            }));
                        })
                        .catch(error => console.error('Error handling offer:', error));
                }
                break;

            case 'answer':
                if (isInitiator && peerConnection) {
                    console.log('Setting remote description from answer');
                    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
                        .catch(error => console.error('Error setting remote description:', error));
                }
                break;

            case 'candidate':
                if (peerConnection) {
                    console.log('Adding ICE candidate');
                    peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
                        .catch(error => console.error('Error adding ICE candidate:', error));
                }
                break;

            case 'disconnected':
                console.log('Peer disconnected');
                // Handle peer disconnection
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    };

    socket.onclose = () => {
        console.log('Disconnected from signaling server');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        hideLoading();
        alert('Error connecting to signaling server. Please try again later.');
    };
}

// Generate a random room ID
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create WebRTC peer connection
function createPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    peerConnection = new RTCPeerConnection(configuration);

    // Set up ICE candidate handling
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            socket.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                roomId: roomId
            }));
        }
    };

    peerConnection.onconnectionstatechange = event => {
        console.log('Connection state:', peerConnection.connectionState);

        if (peerConnection.connectionState === 'connected') {
            if (isInitiator) {
                connectionStatus.innerHTML = `
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <p class="font-medium text-green-600">Connected! Starting file transfer...</p>
                    </div>
                `;
            } else {
                receiverStatus.innerHTML = `
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <p class="font-medium text-green-600">Connected! Waiting for file...</p>
                    </div>
                `;
            }
        } else if (peerConnection.connectionState === 'disconnected' ||
                   peerConnection.connectionState === 'failed' ||
                   peerConnection.connectionState === 'closed') {
            hideLoading();

            const statusMessage = `
                <div class="flex items-center justify-center mb-4">
                    <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <p class="font-medium text-red-600">Connection lost. Please try again.</p>
                </div>
            `;

            if (isInitiator) {
                connectionStatus.innerHTML = statusMessage;
            } else {
                receiverStatus.innerHTML = statusMessage;
            }
        }
    };

    // If we're the initiator, create a data channel
    if (isInitiator) {
        console.log('Creating data channel');
        dataChannel = peerConnection.createDataChannel('fileTransfer');
        setupDataChannel();

        // Create and send an offer
        peerConnection.createOffer()
            .then(offer => {
                console.log('Setting local description from offer');
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log('Sending offer');
                socket.send(JSON.stringify({
                    type: 'offer',
                    sdp: peerConnection.localDescription,
                    roomId: roomId
                }));
            })
            .catch(error => console.error('Error creating offer:', error));
    } else {
        // If we're not the initiator, set up to receive the data channel
        peerConnection.ondatachannel = event => {
            console.log('Received data channel');
            dataChannel = event.channel;
            setupDataChannel();
        };
    }
}

// Set up the data channel event handlers
function setupDataChannel() {
    dataChannel.onopen = () => {
        console.log('Data channel opened');

        if (isInitiator && selectedFile) {
            // Send file metadata
            const metadata = {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
            };
            dataChannel.send(JSON.stringify({ type: 'metadata', data: metadata }));

            // Start sending the file
            sendFile();
        }
    };

    dataChannel.onclose = () => {
        console.log('Data channel closed');
    };

    dataChannel.onerror = error => {
        console.error('Data channel error:', error);
    };

    dataChannel.onmessage = event => {
        const message = event.data;

        // Handle string messages (metadata, etc.)
        if (typeof message === 'string') {
            try {
                const parsedMessage = JSON.parse(message);

                if (parsedMessage.type === 'metadata') {
                    // Received file metadata
                    const metadata = parsedMessage.data;
                    fileSize = metadata.size;

                    // Display file info
                    receiverFileName.textContent = metadata.name;
                    receiverFileSize.textContent = formatBytes(metadata.size);

                    // Reset received data
                    receivedChunks = [];
                    receivedSize = 0;

                    console.log('Receiving file:', metadata.name, formatBytes(metadata.size));
                } else if (parsedMessage.type === 'done') {
                    // File transfer complete
                    console.log('File transfer complete');

                    // Combine chunks to create the file
                    const blob = new Blob(receivedChunks);
                    receivedFile = blob;

                    // Update UI
                    receiverStatus.innerHTML = `
                        <div class="flex items-center justify-center mb-4">
                            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <p class="font-medium text-green-600">File received successfully!</p>
                        </div>
                    `;
                    downloadFileBtn.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        } else {
            // Handle binary data (file chunks)
            receivedChunks.push(message);
            receivedSize += message.size;

            // Update progress
            const progress = Math.floor((receivedSize / fileSize) * 100);
            receiverProgressBar.style.width = `${progress}%`;

            console.log(`Received chunk: ${formatBytes(receivedSize)} / ${formatBytes(fileSize)} (${progress}%)`);
        }
    };
}

// Send the file in chunks
function sendFile() {
    const fileReader = new FileReader();
    let offset = 0;

    fileReader.onload = event => {
        if (dataChannel.readyState === 'open') {
            dataChannel.send(event.target.result);
            offset += event.target.result.byteLength;

            // Update progress
            const progress = Math.floor((offset / selectedFile.size) * 100);
            progressBar.style.width = `${progress}%`;

            // Check if the file has been fully sent
            if (offset < selectedFile.size) {
                readSlice(offset);
            } else {
                // File transfer complete
                console.log('File sent successfully');
                connectionStatus.innerHTML = `
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <p class="font-medium text-green-600">File sent successfully!</p>
                    </div>
                `;

                // Send completion message
                dataChannel.send(JSON.stringify({ type: 'done' }));
            }
        }
    };

    const readSlice = o => {
        const slice = selectedFile.slice(o, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };

    readSlice(0);
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking on a link
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
    // Check if we're joining a room
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');

    if (room) {
        // We're joining an existing room
        showLoading();
        roomId = room;

        // Connect to signaling server with the room ID
        connectToSignalingServer();

        // Hide loading after a timeout if something goes wrong
        setTimeout(() => {
            hideLoading();
        }, 10000);
    } else {
        // We're creating a new room
        generateLinkBtn.disabled = true;
    }

    // File selection via drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            handleFiles(files);
        }
    }

    // File selection via file input
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });

    function handleFiles(files) {
        selectedFile = files[0];

        // Display file info
        fileName.textContent = selectedFile.name;
        fileSize.textContent = formatBytes(selectedFile.size);

        // Show file info and enable generate link button
        fileInfo.classList.remove('hidden');
        generateLinkBtn.disabled = false;
    }

    // Clear selected file
    clearFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        generateLinkBtn.disabled = true;
    });

    // Generate sharing link
    generateLinkBtn.addEventListener('click', () => {
        if (selectedFile) {
            showLoading();
            // Connect to signaling server to create a new room
            connectToSignalingServer();

            // Hide loading after a timeout if something goes wrong
            setTimeout(() => {
                hideLoading();
            }, 10000);
        } else {
            dropArea.classList.add('shake');
            setTimeout(() => {
                dropArea.classList.remove('shake');
            }, 500);
        }
    });

    // Copy link to clipboard
    copyLinkBtn.addEventListener('click', () => {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareLink.value)
                .then(() => {
                    // Show feedback
                    const originalHTML = copyLinkBtn.innerHTML;
                    copyLinkBtn.innerHTML = `
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                    `;
                    setTimeout(() => {
                        copyLinkBtn.innerHTML = originalHTML;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    // Fallback to old method
                    fallbackCopy();
                });
        } else {
            // Fallback for older browsers
            fallbackCopy();
        }

        function fallbackCopy() {
            shareLink.select();
            document.execCommand('copy');

            // Show feedback
            const originalHTML = copyLinkBtn.innerHTML;
            copyLinkBtn.innerHTML = `
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            `;
            setTimeout(() => {
                copyLinkBtn.innerHTML = originalHTML;
            }, 2000);
        }
    });

    // Download received file
    downloadFileBtn.addEventListener('click', () => {
        if (receivedFile) {
            const a = document.createElement('a');
            const url = URL.createObjectURL(receivedFile);
            a.href = url;
            a.download = receiverFileName.textContent;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    });
});
