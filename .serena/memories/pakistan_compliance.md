# HRM System — Pakistan Localization & Compliance

Key statutory and operational requirements specific to Pakistan:

1. **Currency & Financials:**
   - Default currency is Pakistani Rupee (PKR).
   - Bank transfer format: Generates bank advice sheets (Excel/CSV) formatted for Pakistani commercial banks (e.g., Meezan, HBL, UBL, Alfalah).

2. **Income Tax (FBR — Federal Board of Revenue):**
   - Annual salaried tax slabs (configurable in M2 Company Settings).
   - Monthly tax deduction calculation: `(Annual Tax calculated on Gross Annual Salary) / 12`.
   - Dynamic slab adjustments supported when tax year changes in Finance Act.

3. **EOBI (Employees' Old-Age Benefits Institution):**
   - Statutory monthly contribution split between employer and employee according to prevailing minimum wage rates.

4. **Identity & Data Protection:**
   - CNIC numbers (13 digits: `XXXXX-XXXXXXX-X`) encrypted at rest.
   - CNIC expiration alerts via automated background cron.
   - Bank account / IBAN details encrypted at rest.

5. **Work Timings & Calendars:**
   - Default timezone: `Asia/Karachi` (PKT, UTC+5).
   - Official Pakistani public holidays (Eid ul Fitr, Eid ul Adha, Ashura, Pakistan Day, Independence Day, Kashmir Day, Iqbal Day, Quaid-e-Azam Day).

Refer to `mem:tech_stack`, `mem:overview`, and `mem:phases_and_modules`.
