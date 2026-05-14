import { getApiKey } from './storage.js';

// All extraction uses Claude Vision via Anthropic API.
// API key must be set in Settings (stored in localStorage).

async function callVision(imageDataUrl, systemPrompt, userPrompt) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key. Set your Anthropic API key in Settings.');

  // Convert data URL to base64
  const base64 = imageDataUrl.split(',')[1];
  const mediaType = imageDataUrl.split(';')[0].split(':')[1] || 'image/jpeg';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: userPrompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0]); } catch { return {}; }
}

// ── WC/AC Chiller nameplate ───────────────────────────────────────────────────

export async function extractChillerNameplate(imageDataUrl, onProgress) {
  onProgress?.('Reading nameplate...');
  const sys = `You are an expert at reading industrial chiller nameplates. Extract data and return ONLY valid JSON. 
All temperatures in °C, capacity in TR, power in kW, flow in m³/hr.
Convert if needed: GPM × 0.2271 = m³/hr, tons (US) = TR, °F → °C = (F-32)/1.8.`;
  const prompt = `Extract from this chiller nameplate and return JSON:
{
  "makeModel": "brand and model number or null",
  "capTR": number or null,
  "ratedKW": number or null,
  "ratedCOP": number or null,
  "chwst": number or null,
  "chwrt": number or null,
  "chwFlow": number or null,
  "cwst": number or null,
  "cwrt": number or null,
  "cwFlow": number or null,
  "refrigerant": "e.g. R-134a or null",
  "yearMfg": "year or null",
  "designAmbient": number or null
}`;

  const text = await callVision(imageDataUrl, sys, prompt);
  onProgress?.('Parsing results...');
  const raw = parseJSON(text);
  // Clean: replace nulls with null (not string "null")
  const result = {};
  for (const [k, v] of Object.entries(raw)) {
    result[k] = (v === 'null' || v === '' || v === undefined) ? null : v;
  }
  return result;
}

// ── CPM / control panel display ───────────────────────────────────────────────

export async function extractCPMReadings(imageDataUrl, onProgress) {
  onProgress?.('Reading panel display...');
  const sys = `You are an expert at reading chiller control panel displays (CPM, microprocessor panels). 
Extract real-time operating data. Return ONLY valid JSON. Temperatures in °C, flow in m³/hr, power in kW.`;
  const prompt = `Extract operating data from this chiller control panel display:
{
  "chwst": number or null,
  "chwrt": number or null,
  "chwFlow": number or null,
  "cwEntering": number or null,
  "cwLeaving": number or null,
  "powerKW": number or null,
  "pf": number or null,
  "current": number or null,
  "suctionP": number or null,
  "suctionT": number or null,
  "dischP": number or null,
  "dischT": number or null,
  "faultCodes": "any fault codes visible or null"
}`;

  const text = await callVision(imageDataUrl, sys, prompt);
  onProgress?.('Parsing results...');
  const raw = parseJSON(text);
  const result = {};
  for (const [k, v] of Object.entries(raw)) {
    result[k] = (v === 'null' || v === '' || v === undefined) ? null : v;
  }
  return result;
}

// ── Pump nameplate ─────────────────────────────────────────────────────────────

export async function extractPumpNameplate(imageDataUrl, onProgress) {
  onProgress?.('Reading pump nameplate...');
  const sys = `You are an expert at reading pump motor nameplates. Extract data and return ONLY valid JSON.
Units: flow m³/hr (convert GPM × 0.2271), head in metres, power in kW, speed in RPM.`;
  const prompt = `Extract from this pump/motor nameplate:
{
  "makeModel": "brand and model or null",
  "ratedFlow": number in m3/hr or null,
  "ratedHead": number in metres or null,
  "ratedKW": number or null,
  "ratedEff": number as % e.g. 78.5 or null,
  "ratedRPM": number or null
}`;

  const text = await callVision(imageDataUrl, sys, prompt);
  onProgress?.('Parsing results...');
  const raw = parseJSON(text);
  const result = {};
  for (const [k, v] of Object.entries(raw)) {
    result[k] = (v === 'null' || v === '' || v === undefined) ? null : v;
  }
  return result;
}

// ── Cooling tower nameplate ────────────────────────────────────────────────────

export async function extractTowerNameplate(imageDataUrl, onProgress) {
  onProgress?.('Reading tower nameplate...');
  const sys = `You are an expert at reading cooling tower nameplates. Return ONLY valid JSON.`;
  const prompt = `Extract from this cooling tower nameplate:
{
  "makeModel": "brand and model or null",
  "capTR": number or null,
  "fanKW": "fan motor rated kW or null",
  "designApproach": number in °C or null,
  "designRange": number in °C or null
}`;

  const text = await callVision(imageDataUrl, sys, prompt);
  onProgress?.('Parsing results...');
  const raw = parseJSON(text);
  const result = {};
  for (const [k, v] of Object.entries(raw)) {
    result[k] = (v === 'null' || v === '' || v === undefined) ? null : v;
  }
  return result;
}
