# HealthChain - Decentralized EHR System

A decentralized Electronic Health Record (EHR) system that enhances data privacy, security, and patient control through blockchain technology and threshold cryptography.

## 🎯 Project Objectives

1. **Data Privacy & Security** - End-to-end encryption via Lit Protocol's threshold cryptography
2. **Collaboration & Interoperability** - Doctor access request workflows and doctor-to-doctor transfers
3. **Patient-Centric Control** - Patients grant/revoke access to their health records

## 🏗️ Project Structure

```
HealthChain/
├── frontend/          # Next.js + TypeScript dApp
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Lit Protocol, IPFS, Supabase clients
│   │   └── utils/     # Validation utilities
│   └── src/__tests__/ # Jest unit tests (132 tests)
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Authentication** | RainbowKit, SIWE (Sign-In with Ethereum) |
| **Wallet Support** | MetaMask, Rainbow, WalletConnect, Base Account |
| **Encryption** | Lit Protocol (threshold cryptography, datil-dev network) |
| **Storage** | IPFS via Pinata |
| **Database** | Supabase (PostgreSQL with Row-Level Security) |
| **Testing** | Jest (132 unit tests, 100% pass rate) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible Web3 wallet
- Supabase account
- Pinata account

### Installation

```bash
# Clone the repository
git clone https://github.com/TeeHaoBin/HealthChain.git
cd HealthChain

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Pinata credentials

# Set up Supabase Database
# 1. Create a new project at https://supabase.com
# 2. Go to the SQL Editor
# 3. Copy contents of database/supabase_schema.sql
# 4. Paste and Run to create tables, functions, and policies

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your_pinata_gateway_url
```

### How to Get API Keys

| Service | Steps |
|---------|-------|
| **WalletConnect** | Create project at [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| **Supabase** | Create project at [supabase.com](https://supabase.com) → Settings → API |
| **Pinata** | Sign up at [pinata.cloud](https://pinata.cloud) → API Keys → Generate JWT |

## 🔐 Security Architecture

- **Lit Protocol** - Threshold cryptography for file encryption and decentralized access control
- **SIWE** - Wallet-based authentication (no passwords)
- **Supabase RLS** - Row-Level Security policies for database access control
- **IPFS** - Decentralized storage via Pinata

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Patient** | Upload records, grant/revoke doctor access, view access history |
| **Doctor** | Request patient access, view authorized records, transfer access to colleagues |
| **Admin** | Verify doctors, view system audit logs |

## 🧪 Testing

```bash
cd frontend
npm run test        # Run all 132 unit tests
npm run test:watch  # Watch mode
```

## 📄 License

This project is developed as a Final Year Project (FYP) for academic purposes.

## 🌍 SDG Alignment

This project contributes to **UN Sustainable Development Goal 9** by developing quality, reliable, and resilient digital healthcare infrastructure that promotes equitable access to health information.
