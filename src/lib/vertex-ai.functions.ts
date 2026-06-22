import { createServerFn } from "@tanstack/react-start";

// ---------------------------------------------------------------------------
// Service-account auth (Web Crypto, edge-friendly)
// ---------------------------------------------------------------------------

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<{ token: string; projectId: string }> {
  const raw = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("VERTEX_AI_SERVICE_ACCOUNT_JSON not configured");
  const sa = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
    project_id: string;
    token_uri: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const signingInput = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(
    enc.encode(JSON.stringify(claims)),
  )}`;

  const keyData = pemToArrayBuffer(sa.private_key);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return { token: data.access_token, projectId: sa.project_id };
}

// ---------------------------------------------------------------------------
// Context loader — pulls Consuma + FPD data from Lovable Cloud tables
// ---------------------------------------------------------------------------

async function loadBritanniaContext(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [india, global, portfolio, fpd] = await Promise.all([
    supabaseAdmin.from("flavours_india").select("*").limit(120),
    supabaseAdmin.from("flavours_global").select("*").limit(60),
    supabaseAdmin.from("britannia_portfolio").select("*").limit(80),
    supabaseAdmin.from("fpd_volumes").select("*").order("volume", { ascending: false }),
  ]);

  const sections: string[] = [];

  if (india.data?.length) {
    sections.push(
      `## CONSUMA — Indian Flavour Signals (${india.data.length} rows)\n` +
        india.data
          .slice(0, 60)
          .map(
            (r) =>
              `- ${r.flavor} · trend=${r.trend ?? "—"} · conv_vol=${r.conv_volume ?? "—"} · eng_vol=${r.eng_volume ?? "—"} · conv_growth=${r.conv_growth ?? "—"} · eng_growth=${r.eng_growth ?? "—"} · DIY=${r.diy ?? "—"} · Shareability=${r.shareability ?? "—"} · Intent=${r.consumption_intent ?? "—"} · Health/Indulgence=${r.health_indulgence ?? "—"} · Gifting=${r.gifting ?? "—"}`,
          )
          .join("\n"),
    );
  }

  if (global.data?.length) {
    sections.push(
      `## CONSUMA — Global Flavour Signals (${global.data.length} rows)\n` +
        global.data
          .slice(0, 40)
          .map(
            (r) =>
              `- ${r.flavor} · trend=${r.trend ?? "—"} · conv_vol=${r.conv_volume ?? "—"} · eng_vol=${r.eng_volume ?? "—"} · conv_growth=${r.conv_growth ?? "—"} · DIY=${r.diy ?? "—"} · Shareability=${r.social_shareability ?? "—"} · Advocacy=${r.advocacy ?? "—"}`,
          )
          .join("\n"),
    );
  }

  if (portfolio.data?.length) {
    const byCat = new Map<string, string[]>();
    for (const r of portfolio.data) {
      const k = r.category ?? "Other";
      if (!byCat.has(k)) byCat.set(k, []);
      byCat.get(k)!.push(`${r.brand}${r.flavours ? ` (${r.flavours})` : ""}`);
    }
    sections.push(
      `## Britannia Full Portfolio\n` +
        Array.from(byCat.entries())
          .map(([cat, items]) => `- **${cat}**: ${items.join("; ")}`)
          .join("\n"),
    );
  }

  if (fpd.data?.length) {
    sections.push(
      `## First-Party Data — Base Brand Volumes\n` +
        fpd.data.map((r) => `- ${r.base_brand}: ${Number(r.volume).toLocaleString()}`).join("\n"),
    );
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Public server functions
// ---------------------------------------------------------------------------

export const testVertexConnection = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { token, projectId } = await getAccessToken();
    return {
      ok: true,
      projectId,
      tokenPreview: token.slice(0, 12) + "…",
      message: "Vertex AI service account authenticated successfully.",
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
});

type ChatTurn = { role: "user" | "model"; text: string };

const SYSTEM_PROMPT = `You are **BritGPT FPD**, the AI strategist powering Britannia's "Many Indias" innovation flywheel. You combine three roles in every reply — **Marketing & Brand Manager**, **Audience Planner (FPD)**, and **Creative & Media Planner** — and answer as one unified expert.

# THE BRITGPT STRATEGIC FLYWHEEL (always reason along this loop)
1. **Many Indias Signal Capture** — Consuma surfaces what is emerging, where, the consumer interpretation, signal strength, scale potential.
2. **Portfolio / Brand / New-Space Fit** — decide if the signal fits an EXISTING Britannia brand, a PORTFOLIO ADJACENCY, or a NEW WHITESPACE. Always show ALL plausible brand routes, not one.
3. **Opportunity Mapping** — NPD, line extension / limited edition, communication, regional personalization, influencer route, commerce action, GEO/AEO fix.
4. **Concept / Action Definition** — name, claim, format, occasion, target market, creator route, commerce fix.
5. **Validation & Testing** — concept test, sampling, FPD cohort test, claim/pack/flavour test, commercial feasibility → Prioritize / Pilot / Watchlist / Drop.
6. **Activation Routes** — CRM, paid media, influencers, commerce, regional launch, product pipeline + Creative Studio brief.
7. **GEO / Commerce Feedback** — AI/search visibility, commerce ranking, OSA, reviews, competitor visibility, keyword gaps.
8. **Learning Loop** — engagement, conversion, market response, winning claim → sharper next cycle.

# PORTFOLIO CROSS-MAPPING (CRITICAL)
For ANY flavour/concept, surface EVERY relevant Britannia brand it could plug into across categories — biscuits (Bourbon, Marie, GoodDay, MarieGold, NutriChoice, 50-50, MilkBikis, Jim-Jam, Tiger, Treat, Pure Magic, Little Hearts), cream biscuits, wafers (Treat Crème Wafers), cakes (GoodDay Cake, Layerz, Winkin Cow), rusk (Toastea), dairy (Cheese, Winkin Cow), bread, croissants, healthy snacks (NutriChoice). Example: "Kaju Katli" → Pure Magic (premium cream), GoodDay festive cookie, Treat wafer cream, Winkin Cow shake, Toastea festive rusk, NutriChoice protein bar. ALWAYS show this multi-brand fan-out as a small table.

# RESPONSE STRUCTURE (mandatory)
Use rich markdown. Default skeleton for strategic questions:
\`\`\`
## 🎯 Signal Read
2-3 sentences quoting specific flavour rows, growth %, trend label, region.

## 🧭 Britannia's 4 Plays
| Play | Route | Why | Brands in scope |
|---|---|---|---|
| 1. NPD / Format | … | … | … |
| 2. Communication / Regional | … | … | … |
| 3. Influencer / Creator | … | … | … |
| 4. Commerce / GEO | … | … | … |

## 🏭 Portfolio Cross-Map
Table mapping the flavour/idea to EVERY plausible Britannia brand & category.

## 👥 FPD Cohorts to Activate
Bullet list tying to base-brand volumes (cite the actual numbers).

## 🚀 Recommended Next Move
One concrete first action (e.g. "WhatsApp poll to 2.5M Bourbon cohort").
\`\`\`
For concept cards, follow the Concept Card schema requested in the user prompt.

# GROUND RULES
- Quote real flavour names, trends, growth numbers, and FPD volumes from the supplied context. Never invent data.
- Always be specific to **Many Indias** — name states/regions, occasions, languages, creator archetypes.
- Be substantive: minimum ~250 words for strategic answers. No 2-line replies.
- End EVERY response with a fenced \`\`\`followups ... \`\`\` JSON array of 4-6 next-step chips: { "label": "...", "icon": "⚡|🎨|👥|🔍|🍪|🌐|❓", "action": "ask"|"concept_card", "topic"?: "..." }.
- When the user asks for a Concept Card, ALSO emit a fenced \`\`\`concept ... \`\`\` JSON block: { "product_name": "...", "format": "cream biscuit|wafer|cake|rusk|shake|cookie|cracker|...", "brand_route": "Bourbon|GoodDay|Pure Magic|Treat|Winkin Cow|Toastea|NutriChoice|...", "flavour": "...", "pack": "...", "occasion": "...", "image_prompt": "<rich photoreal PRODUCT PACKAGING prompt grounded in the chosen format & brand — e.g. 'A Britannia GoodDay festive cream cookie pack with Kaju-Katli-flavoured cream filling, gold foil pack mockup, cookies stacked beside pack, studio lighting, cream background'. Describe the ACTUAL product format, not generic Indian sweets.>" }.`;

export const askBritGPT = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { question: string; history?: ChatTurn[]; location?: string; model?: string }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const [{ token, projectId }, context] = await Promise.all([
        getAccessToken(),
        loadBritanniaContext(),
      ]);
      const location = data.location ?? "us-central1";
      const model = data.model ?? "gemini-2.5-flash";
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

      const history = (data.history ?? []).map((t) => ({
        role: t.role,
        parts: [{ text: t.text }],
      }));

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `${SYSTEM_PROMPT}\n\n# CONSUMA + FPD CONTEXT\n\n${context}` }],
          },
          contents: [
            ...history,
            { role: "user", parts: [{ text: data.question }] },
          ],
          generationConfig: { temperature: 0.65, maxOutputTokens: 4096 },
        }),
      });
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };
      if (!res.ok) {
        return { ok: false as const, message: json?.error?.message ?? `HTTP ${res.status}` };
      }
      const raw =
        json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

      let text = raw;
      let followups: Array<{ label: string; icon?: string; action?: string; topic?: string }> = [];
      let concept: { image_prompt?: string; product_name?: string; brand_route?: string; format?: string; flavour?: string; pack?: string; occasion?: string } | undefined;

      const fm = raw.match(/```followups\s*([\s\S]*?)```/i);
      if (fm) {
        try {
          const parsed = JSON.parse(fm[1].trim());
          if (Array.isArray(parsed)) followups = parsed;
        } catch { /* ignore */ }
        text = text.replace(fm[0], "").trim();
      }
      const cm = raw.match(/```concept\s*([\s\S]*?)```/i);
      if (cm) {
        try { concept = JSON.parse(cm[1].trim()); } catch { /* ignore */ }
        text = text.replace(cm[0], "").trim();
      }

      return { ok: true as const, text, followups, concept };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : String(err) };
    }
  });

export const generateConceptImage = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; location?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { token, projectId } = await getAccessToken();
      const location = data.location ?? "us-central1";
      const model = "imagen-3.0-fast-generate-001";
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: data.prompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1", safetySetting: "block_only_high" },
        }),
      });
      const json = (await res.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
        error?: { message?: string };
      };
      if (!res.ok) {
        return { ok: false as const, message: json?.error?.message ?? `HTTP ${res.status}` };
      }
      const b64 = json.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) return { ok: false as const, message: "No image returned" };
      const mime = json.predictions?.[0]?.mimeType ?? "image/png";
      return { ok: true as const, dataUrl: `data:${mime};base64,${b64}` };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : String(err) };
    }
  });

export const askVertexGemini = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; model?: string; location?: string }) => d)
  .handler(async ({ data }) => {
    const { token, projectId } = await getAccessToken();
    const location = data.location ?? "us-central1";
    const model = data.model ?? "gemini-2.5-flash";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: data.prompt }] }] }),
    });
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!res.ok) return { ok: false, message: json?.error?.message ?? `HTTP ${res.status}` };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { ok: true, text };
  });
