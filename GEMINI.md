# Antigravity Workspace Guidelines — Passive Income Suite

## 1. Multi-Task Directory Isolation (Strict Monorepo Rule)
- The `passive-income` repository contains multiple independent projects/tasks corresponding to different prompts/modules from the course curriculum.
- **DO NOT** scaffold, build, or write application files directly in the repository root (`passive-income/`).
- Each task MUST be developed strictly within its own isolated subfolder:
  - `task-1/`: Privacy-First Web Utility Suite (ClientCraft)
  - `task-2/`: Flat-file Developer Directory & Resource Catalog (DevStack)
  - `task-3/`, `task-4/`, etc.: Future tasks as assigned.
- When working on a task, ensure all terminal commands, package installations, and file modifications use the appropriate working directory (e.g., `cd task-1`, `npm --prefix task-1 ...`).
- Never overwrite or modify files in other task directories.

## 2. Strict Monetization Policy (Override All Other Methods)
Regardless of what payment methods are requested in original task descriptions (e.g., Lemon Squeezy, Stripe, PayPal, USDT/Crypto, Gumroad, Patreon):
**OVERRIDE THEM TO THE FOLLOWING TWO METHODS ONLY:**

1. **Domestic Vietnamese Customers:**
   - **Method**: Techcombank VietQR (Napas247)
   - **Bank Name**: Techcombank (Ngân hàng TMCP Kỹ thương Việt Nam)
   - **Account Number**: `19027557341011`
   - **UI**: Provide QR code display and one-click copy buttons for Bank Name and STK.

2. **Foreign & International Customers:**
   - **Method**: Buy Me a Coffee
   - **URL/Target**: Buy Me a Coffee integration (Visa/Mastercard/Apple Pay)
   - **Note**: Connected to Payoneer for payouts to Vietnamese bank account.

**Prohibited Methods**: NEVER use or include Lemon Squeezy, Stripe, PayPal, or Crypto (USDT-TRC20, BTC, ETH) unless explicitly commanded by the user in a follow-up. Always replace them with Techcombank VietQR and Buy Me a Coffee.
