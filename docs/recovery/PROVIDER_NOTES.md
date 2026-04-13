# Provider Notes

## 2026-04-13

- `sociosim-adk-agent` uses `GOOGLE_API_KEY` for real persona replies.
- `cauldron` uses `OPENROUTER_API_KEY` for prompt validation.
- The original local Cauldron model was `google/gemini-2.5-flash`.
- That model returned `402 Payment Required` on the current OpenRouter account.
- Temporary local recovery change: `cauldron/.env.local` now uses `OPENROUTER_MODEL=openrouter/free`.
- This is a recovery/testing choice, not a final product decision.
- Later, we should re-evaluate the final Cauldron model for quality, cost, and reliability.
