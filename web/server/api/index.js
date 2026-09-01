// Vercel serverless entry point.
// Vercel invokes this module per-request instead of running index.js —
// exporting the Express app (no app.listen) is the supported pattern.
// Local development still uses `npm run dev` → src/index.js.

import app from "../src/app.js";

export default app;
