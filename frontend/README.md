# HealthChain Frontend

The decentralized application (dApp) interface for the HealthChain EHR system. Built with Next.js 15, it allows patients and doctors to interact securely with their medical records using threshold cryptography and decentralized storage.

## 🚀 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + Radix UI
- **Authentication:** SIWE (Sign-In with Ethereum)
- **State Management:** TanStack Query
- **Web3 Components:** RainbowKit, wagmi
- **Encryption:** Lit Protocol
- **Storage:** IPFS (via Pinata)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy the example file and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
   
   **Required Variables:**
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `PINATA_JWT`: Your Pinata JWT Token
   - `NEXT_PUBLIC_PINATA_GATEWAY`: Your Pinata Gateway URL

3. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🧪 Testing

This project includes a comprehensive suite of unit tests using Jest and React Testing Library.

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 📦 Build & Deploy

The application is optimized for deployment on Vercel.

```bash
# Build for production
npm run build

# Start production server
npm start
```

👉 **Live Demo:** [https://healthchain-fyp.vercel.app](https://healthchain-fyp.vercel.app)
