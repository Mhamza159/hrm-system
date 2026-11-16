# Phase 09: AI Resume Parsing Enhancements & Multi-Provider OpenAI/Gemini Setup — Context

## 1. Executive Intent & Problem Statement
The current recruitment AI screening service relies on `gemini-2.5-flash` with fallback to regex heuristics. However:
1. **Document Text Extraction Gap:** Digital PDFs currently bypass body text extraction because no binary stream extractor (`pdf-parse`) is installed. Instead, synthetic applicant form metadata is passed to the LLM. Word DOCX files are also unparsed.
2. **OpenAI Configuration Setup:** `OPENAI_API_KEY` is not configured in `backend/.env`, and there is no explicit provider selector (`AI_PROVIDER`) or automatic cross-provider failover when Gemini hits free-tier rate limits (HTTP 429).
3. **Redundant LLM Invocations:** Repeated candidate re-screenings invoke external APIs without caching, wasting tokens and exhausting quotas.

Phase 09 resolves these gaps by integrating robust document extractors, establishing a production-grade multi-provider AI setup (Gemini + OpenAI), and adding SHA-256 buffer caching.

---

## 2. Locked Technical Decisions

### Decision 1: Dedicated Document Extraction Service (`documentParser.service.js`)
- Install `pdf-parse` for digital PDF streams and `mammoth` for Word DOCX files.
- Guard against corrupt binary data, encrypted files, and excessive text length with a hard cap of 15,000 characters.
- Normalize whitespace and strip invisible non-printable Unicode characters.

### Decision 2: Multi-Provider AI Architecture with Cross-Provider Failover
- Support `AI_PROVIDER` environment variable with values:
  - `auto` (Default): Try Gemini first; if 429 / quota failure occurs, seamlessly retry with OpenAI before dropping to heuristic.
  - `gemini`: Force Google Gemini (`gemini-2.5-flash`).
  - `openai`: Force OpenAI (`gpt-4o-mini`).
- Configure `OPENAI_API_KEY` in `backend/.env` and `backend/src/config/env.js`.
- Maintain strict standard JSON schema output across both providers.

### Decision 3: SHA-256 Buffer Hash Caching
- Compute SHA-256 hash of the uploaded resume buffer: `hash = crypto.createHash('sha256').update(file.buffer).digest('hex')`.
- Cache parsed profile in Redis (`recruitment:resume_cache:${hash}`) with a 7-day TTL.
- For re-screening on the same resume against the same job, reuse cached parsing and avoid duplicate LLM costs.

---

## 3. Scope Boundaries & Constraints
- **Preserve Human-in-the-Loop:** AI must remain advisory (`BUILD-GUIDE` Row 15.13). AI never auto-rejects or auto-advances.
- **Maintain Ponytail Philosophy:** Minimal dependencies (`pdf-parse` and `mammoth` only). Zero heavy Python or microservice sidecars.
- **Backward Compatibility:** All existing tests in `tests/m15.recruitment.test.js` and `tests/m15.recruitment.security.test.js` must continue to pass 100% green.
