# envault

> A CLI tool for securely managing and syncing `.env` files across team members using encrypted storage.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize envault in your project, then push and pull `.env` files securely with your team.

```bash
# Initialize a new vault for your project
envault init

# Push your local .env to the encrypted vault
envault push --env .env

# Pull the latest .env from the vault
envault pull --env .env

# Invite a team member
envault invite teammate@example.com
```

Team members authenticate once and gain access to the shared encrypted environment variables — no plaintext secrets ever leave your machine unencrypted.

---

## How It Works

1. **Encrypt** — Your `.env` file is encrypted locally before upload using AES-256.
2. **Sync** — Encrypted secrets are stored in a remote vault tied to your project.
3. **Decrypt** — Authorized team members pull and decrypt secrets using their personal key.

---

## Requirements

- Node.js >= 18
- An envault account (run `envault login` to authenticate)

---

## License

MIT © envault contributors