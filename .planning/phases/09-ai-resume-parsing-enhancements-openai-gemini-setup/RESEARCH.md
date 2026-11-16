# Phase 09: AI Resume Parsing Enhancements & Multi-Provider Setup — Research & Architecture

## 1. Document Extraction Technology Selection

### A. PDF Extraction
- **Option 1: `pdf-parse` (Selected)**
  - Standard pure-JavaScript Node.js library for extracting text streams from PDF buffers.
  - No native C++ bindings, python dependencies, or OS packages required.
  - Fast execution (<50ms on 1–3 page resumes).
  - Handles multi-page text concatenation cleanly.

### B. Word Document Extraction (.docx)
- **Option 1: `mammoth` (Selected)**
  - Fast, pure-JavaScript library designed specifically to extract plain text and HTML from `.docx` files.
  - Ignores bloated Word XML formatting styles and focuses on raw content text.
  - Zero native binary dependencies.

---

## 2. Multi-Provider AI Orchestration & Failover Pattern

### Provider Matrix

| Feature | Google Gemini Tier | OpenAI Tier | Heuristic Fallback Tier |
| :--- | :--- | :--- | :--- |
| **Model** | `gemini-2.5-flash` | `gpt-4o-mini` | Regex Heuristic |
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `https://api.openai.com/v1/chat/completions` | Local execution |
| **Auth Key** | `GEMINI_API_KEY` | `OPENAI_API_KEY` | None |
| **Format** | `response_format: { type: 'json_schema' }` | `response_format: { type: 'json_schema' }` | Deterministic Object |
| **Cost / Latency** | Low / ~1.2s | Low / ~1.1s | Zero / ~2ms |

### Failover Algorithm:
```javascript
export const callLlmWithFailover = async (promptPayload, schema) => {
  const providerOrder = resolveProviderOrder(); // e.g. ['gemini', 'openai'] or ['openai', 'gemini']
  
  for (const provider of providerOrder) {
    try {
      const result = await invokeProvider(provider, promptPayload, schema);
      if (result) return { ...result, providerUsed: provider };
    } catch (err) {
      if (isRateLimitOrQuota(err)) {
        logger.warn(`[AI Service] ${provider} rate limited / quota exhausted. Trying next provider...`);
        continue;
      }
      logger.error(`[AI Service] ${provider} error:`, err.message);
    }
  }

  // Fallback to local heuristic
  logger.warn('[AI Service] All cloud LLM providers failed or unconfigured. Using deterministic heuristic engine.');
  return { ...runHeuristic(promptPayload), providerUsed: 'heuristic' };
};
```

---

## 3. Redis Resume Cache Architecture

Key Structure:
- `recruitment:cv_parse:${sha256Hash}`: Stores JSON serialized `parsedProfile` with a 7-day TTL (`60 * 60 * 24 * 7`).
- In-memory fallback: If Redis is unavailable or unconfigured, an in-memory `Map` with 100-entry LRU eviction is used to prevent memory exhaustion.
