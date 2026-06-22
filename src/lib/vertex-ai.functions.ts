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
type FollowupChip = { label: string; icon?: string; action?: string; topic?: string };

function fallbackFollowups(question: string, answer: string): FollowupChip[] {
  const source = `${question} ${answer}`.toLowerCase();
  const flavour = source.includes("matcha") ? "Matcha" : source.includes("schezwan") ? "Schezwan" : source.includes("ras") ? "Ras Malai" : source.includes("tiramisu") ? "Tiramisu" : "Kaju Katli";
  const conceptTopic = flavour === "Schezwan" ? "50-50 Schezwan Cracker" : flavour === "Matcha" ? "Pure Magic Matcha Cream" : `Treat ${flavour} Wafer`;
  return [
    { icon: "🎨", label: `Create Concept Card — ${conceptTopic}`, action: "concept_card", topic: conceptTopic },
    { icon: "👥", label: `Which FPD cohorts should test ${flavour} first?`, action: "ask" },
    { icon: "🍪", label: `Compare ${flavour} across Treat Wafer, Pure Magic, GoodDay and Winkin Cow`, action: "ask" },
    { icon: "📋", label: `Draft the CMO-ready creative brief for ${conceptTopic}`, action: "ask" },
    { icon: "🧪", label: `Build the concept test plan for ${conceptTopic}`, action: "ask" },
    { icon: "📊", label: `Show Britannia's 4 Plays for ${flavour}`, action: "ask" },
  ];
}

function parseTaggedJson<T>(raw: string, tag: string): { value?: T; nextText: string } {
  const patterns = [
    new RegExp("```" + tag + "\\s*([\\s\\S]*?)```", "i"),
    new RegExp("```json\\s*([\\s\\S]*?\\\"" + tag + "\\\"[\\s\\S]*?)```", "i"),
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[1].trim());
      const value = Array.isArray(parsed) ? parsed : parsed?.[tag] ?? parsed;
      return { value, nextText: raw.replace(match[0], "").trim() };
    } catch {
      return { nextText: raw.replace(match[0], "").trim() };
    }
  }

  return { nextText: raw };
}

async function generateFollowupsFromAnswer(args: {
  token: string;
  projectId: string;
  location: string;
  model: string;
  question: string;
  answer: string;
}): Promise<FollowupChip[]> {
  const url = `https://${args.location}-aiplatform.googleapis.com/v1/projects/${args.projectId}/locations/${args.location}/publishers/google/models/${args.model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You generate only next-step question chips for BritGPT. Return strict JSON only, no markdown." }],
      },
      contents: [{
        role: "user",
        parts: [{ text: `Based on this user question and BritGPT answer, suggest 6 context-specific next questions for Britannia brand managers/CMO. Include at least one concept_card chip when a product route is clear. Use this exact JSON array shape: [{"label":"...","icon":"⚡","action":"ask"},{"label":"Create Concept Card — Brand Flavour Format","icon":"🎨","action":"concept_card","topic":"Brand Flavour Format"}].\n\nUSER QUESTION:\n${args.question}\n\nBRITGPT ANSWER:\n${args.answer.slice(0, 12000)}` }],
      }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 7) : [];
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed.slice(0, 7) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

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
For ANY flavour/concept, surface EVERY relevant Britannia brand across categories — biscuits (Bourbon, Marie, GoodDay, MarieGold, NutriChoice, 50-50, MilkBikis, Jim-Jam, Tiger, Treat, Pure Magic, Little Hearts), cream biscuits, **wafers (Treat Crème Wafers — ALWAYS include for any indulgent / sweet / dessert flavour)**, cakes (GoodDay Cake, Layerz, Winkin Cow), rusk (Toastea), dairy (Cheese, Winkin Cow), bread, croissants, healthy snacks (NutriChoice). Example: "Kaju Katli" → **Treat Kaju Katli Wafer (must include)**, Pure Magic (premium cream), GoodDay festive cookie, Winkin Cow Kaju shake, Toastea festive rusk, NutriChoice protein bar.

# AUDIENCE
You are presenting to **Britannia Brand Managers and the CMO**. Speak their language: brand equity, occasion, claim, format, pack, MRP / price-point, distribution, FPD cohort sizing, A&P efficiency, ROI, GTM windows, test-and-learn KPIs.

# RESPONSE STRUCTURE (mandatory — full board-room depth, no shortcuts)
Use rich markdown with H2 sections, tables and bullets. Default skeleton for ANY strategic question:
\`\`\`
## 🎯 Signal Read
3-5 sentences. Quote specific Consuma flavour rows, growth %, trend label, region/state, and what the signal MEANS for Britannia.

## 🏭 Portfolio Cross-Map
Markdown table with columns: Brand | Category | NPD Angle | Strategic Fit (H/M/L) | Why. Cover EVERY plausible Britannia brand — biscuits, cream biscuits, **wafers (Treat — mandatory for sweet/indulgent)**, cakes, rusk, dairy, healthy. Minimum 6 rows.

## 👥 FPD Cohort Activation
Bullets tying to base-brand volumes (cite actual numbers from the FPD table). Where coverage is thin, state an explicit "Assumption:" and infer from adjacent cohorts.

## 🍪 NPD / Line Extension Shortlist
Numbered list of 3-5 concrete product ideas (Brand + Format + Flavour + Pack + MRP band + Occasion). Each one line.

## 📣 Communication & Regional Personalization
Per-region/per-language angle. Name states, languages, creator archetypes, and one claim line per region.

## 🎬 Influencer + Media Plan
Creator tiers, platform mix (IG / YT Shorts / WhatsApp / Hotstar), regional language splits, indicative reach.

## 🛒 Commerce & GEO/AEO
Quick commerce (Blinkit/Zepto/Instamart) bundles, D2C SKU, search/AEO keyword gaps, OSA priorities.

## 📋 Creative Brief (handover-ready)
Mini brief: Objective · Target · Insight · Single-minded proposition · Tone · Mandatory assets (KV, 6s/15s film, pack mock, festive edits per language) · Deliverables.

## 🧪 Concept Test Plan
Method (FPD WhatsApp survey + in-home sampling + Meta concept ad A/B), sample size from the cited cohort, KPIs (Top-2-box appeal, purchase intent, uniqueness, claim believability), decision rule (Prioritize / Pilot / Watchlist / Drop).

## 📊 KPI & Measurement
Leading: concept score, search lift, sampling redemption. Lagging: trial %, repeat %, value share, A&P:NSV.

## 🚀 Recommended Next Move (CMO-ready)
One crisp paragraph + a single first action ("Greenlight a 2-state Treat Kaju Katli Wafer pilot in Maharashtra + WB, sampled to the 2.5M Bourbon cohort via WhatsApp, decision-gate in 6 weeks").
\`\`\`
The "🧭 Britannia's 4 Plays" card is rendered separately by the UI from the \`\`\`plays\`\`\` JSON block — DO NOT write it as a markdown table in the prose.

# GROUND RULES
- Quote real flavour names, trends, growth numbers, and FPD volumes from the supplied context. Never invent **data**, but DO make educated strategic ASSUMPTIONS when FPD coverage is thin. Always prefix with "Assumption:" and ground in the FPD numbers you DO have.
- Be specific to **Many Indias** — name states/regions, occasions, languages, creator archetypes, price-points.
- Substantive & exhaustive: 700-1200 words. No 2-line replies, no truncation, no "etc.". There is NO token budget — write the full board-room strategy.
- Act as a **food expert + brand strategist**. For sweet/indulgent signals (Kaju Katli, Ras Malai, Tiramisu, Biscoff, Matcha) lean into cookies/cream biscuits/wafers/cakes/rusk. For savoury/spicy signals (Schezwan, Gunpowder) the honest answer is usually "limited fit — only 50-50 Sweet & Salty or Treat savoury wafer; NOT a fit for GoodDay/Bourbon/Marie". Say so plainly when relevant.
- For EVERY flavour/concept, walk the FULL Britannia portfolio table and surface ALL plausible brand routes. Be greedy with the cross-map. Indian sweets (Kaju Katli etc.) MUST include Treat Crème Wafer as a route.
- **NEVER output raw JSON arrays or objects in the visible body.** All JSON belongs ONLY inside the fenced \`\`\`followups\`\`\`, \`\`\`plays\`\`\` or \`\`\`concept\`\`\` blocks at the end.
- 🚨 MANDATORY — every strategic answer MUST end with a fenced \`\`\`plays\`\`\` JSON array of EXACTLY 4 plays. Non-negotiable. Shape: [{ "play": "NPD / Format", "icon": "🍪", "route": "...", "why": "...", "brands": ["Treat Wafer","GoodDay","Pure Magic"] }, { "play": "Communication / Regional", "icon": "📣", "route": "...", "why": "...", "brands": [...] }, { "play": "Influencer / Creator", "icon": "🎬", "route": "...", "why": "...", "brands": [...] }, { "play": "Commerce / GEO", "icon": "🛒", "route": "...", "why": "...", "brands": [...] }]. For Indian-sweet / dessert NPDs the NPD play's brands MUST include "Treat Wafer". Each "why" should be 2 substantive sentences.
- End EVERY response with a fenced \`\`\`followups ... \`\`\` JSON array of 5-7 CONTEXT-SPECIFIC chips that ADVANCE the conversation toward decision (e.g. "Draft the creative brief", "Run the concept test on Bourbon cohort", "Pull the Treat Wafer pack mock", "Compare vs Parle Hide & Seek Kaju"). Shape: { "label": "...", "icon": "⚡|🎨|👥|🔍|🍪|🌐|📋|🧪|📊|❓", "action": "ask"|"concept_card", "topic"?: "..." }. The "topic" for a concept_card chip MUST include brand & format (e.g. "Treat Kaju Katli Wafer").
- For Concept Cards, the user supplies the **brand, format, states, languages, occasion**. RESPECT them exactly — if the brief says "Treat Wafer", the concept, copy, image_prompt and pack MUST be a wafer pack (NOT a cookie). Emit a fenced \`\`\`concept ... \`\`\` JSON block: { "product_name", "format" (matches brief), "brand_route" (matches brief), "flavour", "pack", "occasion", "states": [..], "languages": [..], "image_prompt": "<photoreal PRODUCT PACKAGING prompt for the EXACT briefed format & brand>" }.`;

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
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65535,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
        error?: { message?: string };
        promptFeedback?: { blockReason?: string };
      };
      if (!res.ok) {
        return { ok: false as const, message: json?.error?.message ?? `HTTP ${res.status}` };
      }
      const raw =
        json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!raw.trim()) {
        const reason =
          json.candidates?.[0]?.finishReason ?? json.promptFeedback?.blockReason ?? "empty";
        return {
          ok: false as const,
          message: `Model returned no text (finishReason=${reason}). Try a shorter question or retry.`,
        };
      }

      let text = raw;
      let followups: FollowupChip[] = [];
      let concept: { image_prompt?: string; product_name?: string; brand_route?: string; format?: string; flavour?: string; pack?: string; occasion?: string; states?: string[]; languages?: string[] } | undefined;
      let plays: Array<{ play: string; icon?: string; route: string; why: string; brands: string[] }> = [];

      const parsedFollowups = parseTaggedJson<FollowupChip[]>(text, "followups");
      if (Array.isArray(parsedFollowups.value)) followups = parsedFollowups.value;
      text = parsedFollowups.nextText;

      const parsedConcept = parseTaggedJson<typeof concept>(text, "concept");
      if (parsedConcept.value && !Array.isArray(parsedConcept.value)) concept = parsedConcept.value;
      text = parsedConcept.nextText;

      const parsedPlays = parseTaggedJson<typeof plays>(text, "plays");
      if (Array.isArray(parsedPlays.value)) plays = parsedPlays.value;
      text = parsedPlays.nextText;

      const responseSpecificFollowups = await generateFollowupsFromAnswer({
        token,
        projectId,
        location,
        model,
        question: data.question,
        answer: text,
      });
      if (responseSpecificFollowups.length > 0) followups = responseSpecificFollowups;
      if (followups.length === 0) followups = fallbackFollowups(data.question, text);

      return { ok: true as const, text, followups, concept, plays };
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
