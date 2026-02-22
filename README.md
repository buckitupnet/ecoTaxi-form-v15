# EcoTaxi Form V15 - Source Code

**Development version** of the EcoTaxi order form with file upload functionality.

## 🔗 Repository Links

- **Source Code** (this repo): https://github.com/buckitupnet/ecoTaxi-form-v15
- **Bundled/Production Build**: https://github.com/buckitupnet/ecoTaxi-form-v15-bundled
- **Original Source**: https://github.com/Buckitup-chat/ecoTaxi-form

## 🚀 Features (V15)

- ✅ File upload to `eco-taxi.one` via GraphQL mutations
- ✅ WebAuthn-based user registration (automatic vault creation)
- ✅ Monday.com integration disabled
- ✅ Simplified form UI (comment field only for testing)
- ✅ ReCAPTCHA removed
- ✅ Chunked file upload (10MB chunks) via REST API

## 📦 Tech Stack

- **Build Tool**: Vite 5.4.21
- **CSS Framework**: Tailwind CSS v3
- **Crypto**: @lo-fi/local-vault, libsodium-wrappers
- **API**: GraphQL + REST endpoints at `eco-taxi.one`

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/buckitupnet/ecoTaxi-form-v15.git
cd ecoTaxi-form-v15

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── index.html              # Simplified form UI
├── main-simple.js         # Entry point (simplified)
├── modules/
│   ├── EcoTaxi.js         # API client + file upload methods
│   └── EcoTaxiFormHandler.js  # Form handling logic
└── public/
    └── js/
        └── walc-external-bundle.js  # Crypto libraries
```

## 🔧 Key Changes from Original

### 1. File Upload Implementation (`EcoTaxi.js`)

Added methods for file upload:

- `getUploadKey(myKeypair, destination, file)` - Request upload key via GraphQL
- `uploadFileChunked(file, uploadKey, onProgress)` - Upload file in chunks
- `sendFile(myKeypair, peerPublicKeyHex, uploadKey)` - Send file message
- `uploadMultipleFiles(...)` - Orchestrate multi-file uploads

### 2. Simplified UI (`index.html`)

- Removed all input fields except optional comment
- Added hidden fields with test values for validation
- Removed complex UI components (Choices.js, Google Maps, intlTelInput)

### 3. Form Handler Updates (`EcoTaxiFormHandler.js`)

- Disabled Monday.com integration
- Integrated file upload flow
- Bypassed ReCAPTCHA validation for testing

### 4. New Entry Point (`main-simple.js`)

- Simplified initialization without complex UI components
- Focus on core crypto and form handler setup

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://eco-taxi.one/naive_api` | POST | GraphQL mutations (uploadKey, chatSendFile, etc.) |
| `https://eco-taxi.one/upload_chunk/:key` | PUT | Chunked file upload |
| `https://eco-taxi.one/naive_api_console` | - | GraphiQL interface for testing |

## ⚠️ Known Issues

### `uploadKey` Mutation Returns 500 Error

The `uploadKey` GraphQL mutation consistently returns a `500 Internal Server Error` from `eco-taxi.one/naive_api`. This is a server-side issue documented in previous testing.

**Symptoms:**
```javascript
// Console output
eco-taxi.one/naive_api:1 Failed to load resource: the server responded with a status of 500 ()
EcoTaxi.js:272 ✅ Upload key received
// But uploadKey is actually undefined

// Error later:
TypeError: The first argument must be one of type string, Buffer, ArrayBuffer, Array...
Received type undefined
```

**Root Cause:** The `#graphqlRequest` method parses the JSON response even when HTTP status is 500, resulting in `response.data.uploadKey === undefined`.

**Test Page:** A dedicated test page is available in the source (`test-uploadkey.html`) for debugging GraphQL mutations.

## 📝 Testing

### Local Development

1. Start dev server: `npm run dev`
2. Open http://localhost:5173/
3. Fill optional comment, select file, submit
4. Check browser console for upload progress

### Production Build

```bash
npm run build
cd dist
npx serve .
```

## 📄 Documentation

- [PLAN.md](../PLAN.md) - Original implementation plan
- [FILE_UPLOAD_SETUP.md](../FILE_UPLOAD_SETUP.md) - Detailed file upload specifications

## 🤝 Contributing

This is a testing/development fork. For contributions to the original project, see [Buckitup-chat/ecoTaxi-form](https://github.com/Buckitup-chat/ecoTaxi-form).

## 📄 License

Based on the original [ecoTaxi-form](https://github.com/Buckitup-chat/ecoTaxi-form) project.

---

**Version**: V15  
**Branch**: feature/file-upload-v15  
**Build Date**: February 22, 2026
