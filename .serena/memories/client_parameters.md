# HRM System — Confirmed Client Operational Parameters

Following the interview-me discovery session, the 5 previously open parameters from `docs/FRD.md` are locked:

1. **Headcount:**
   - Current: 10–30 employees (agile software house / startup).
   - 2-Year Projection: ~50–80 employees.
   - Design impact: Lean initial seedings, optimized pagination (`limit: 10/25/50`), lightweight worker concurrency.

2. **Office Locations / Branches:**
   - Single main office building only (no physical branches in other cities).
   - Single office geo-fence coordinates (latitude, longitude, radius in meters).
   - Hybrid and remote employees supported with manager-approved WFH status.

3. **Payroll Bank Transfer Format:**
   - Standard Generic Pakistani Corporate Bank Advice Excel Sheet:
     - Columns: `Employee Code`, `Account Title`, `IBAN / Account Number`, `CNIC`, `Net Salary (PKR)`.
     - Tested/Compatible with major corporate banking portals (Meezan Bank, HBL, Bank Alfalah, MCB, UBL).

4. **Payslip Delivery Channels:**
   - Primary Channels: Direct Email with attached branded PDF (via Nodemailer) + Employee Self-Service in-app portal download.
   - WhatsApp Cloud API: Kept optional and toggleable via M2 Company Settings to prevent mandatory third-party messaging costs.

5. **AI Service Provider:**
   - Primary: OpenAI API (`gpt-4o-mini` / `gpt-4o`).
   - Implementation: Clean service adapter pattern in backend (`src/services/ai/ai.service.js`) allowing easy model switching or local LLM fallback via `.env`.

Refer to `mem:overview`, `mem:tech_stack`, `mem:pakistan_compliance`, and `mem:build_order`.
