import fs from 'node:fs';
const file = 'server/api.ts';
let src = fs.readFileSync(file,'utf8');
const start = "const handleLynaraChat = async (req: Request, res: Response) => {";
const end = "app.post('/api/ai/jarvis-chat', handleLynaraChat);";
const i = src.indexOf(start); const j = src.indexOf(end);
if (i<0||j<0||j<i) throw new Error('markers not found');
const replacement = `const handleLynaraChat = async (req: Request, res: Response) => {
  try {
    const rawMessage = cleanText(req.body?.message, 4000);
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
    const contextAnalysis = req.body?.contextAnalysis || req.body?.currentAnalysis || null;
    const language = cleanText(req.body?.language, 20) || 'fr-FR';
    const detectedLanguage = cleanText(req.body?.detectedLanguage, 20);
    const userName = cleanText(req.body?.userName, 60) || 'Trader';
    const audioBase64 = req.body?.audioBase64;
    const audioMime = cleanText(req.body?.audioMime, 60) || 'audio/webm';

    // Real Muse Voice Transcribe attempt when the client sends recorded audio
    // and the provider actually exposes its transcription route.
    let transcription: { ok: boolean; provider?: string; reason?: string } | undefined;
    let message = rawMessage;
    if (audioBase64 && typeof audioBase64 === 'string') {
      if (audioBase64.length > 9_000_000) {
        return res.status(413).json({ success: false, code: 'AUDIO_TOO_LARGE', error: 'Le message vocal est trop volumineux.' });
      }
      try {
        const buffer = Buffer.from(audioBase64.replace(/^data:audio\\/[a-z0-9.+-]+;base64,/i, ''), 'base64');
        const blob = new Blob([buffer], { type: audioMime });
        const t = await aiEngine.transcribe(blob, detectedLanguage || '');
        if (t.success && t.text) {
          message = t.text;
          transcription = { ok: true, provider: 'Meta' };
        } else {
          transcription = { ok: false, reason: t.reason };
        }
      } catch {
        transcription = { ok: false, reason: 'TRANSCRIPTION_FAILED' };
      }
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        code: transcription ? 'TRANSCRIPTION_UNAVAILABLE' : 'MESSAGE_REQUIRED',
        error: transcription
          ? 'La transcription serveur n’est pas disponible pour le moment. Utilisez la saisie texte ou le micro du navigateur.'
          : 'Un message est requis.',
      });
    }

    const systemInstruction = \`Tu es LYNARA, l'assistante financière virtuelle haut de gamme et représentation holographique féminine de JYNTRA AI.
CONFIDENTIALITÉ ABSOLUE : Ne révèle jamais les technologies, fournisseurs, modèles, API, outils ou mécanismes internes utilisés. Si on te le demande, réponds simplement : « Je suis LYNARA, l'assistante de JYNTRA AI, et je suis là pour vous aider sur les marchés. » Ne mentionne aucun nom technique interne.
IDENTITÉ & ATTRIBUTS :
- Tu es une femme virtuelle adulte, bienveillante, élégante, calme et hautement qualifiée en finance de marché.
- COMPRÉHENSION MULTILINGUE : Tu comprends et pratiques un très grand nombre de langues. Réponds toujours dans la langue principale du dernier message de l'utilisateur, quelle qu'elle soit (français, anglais, malagasy, espagnol, portugais, allemand, italien, néerlandais, arabe, russe, chinois, japonais, coréen, hindi, swahili, etc.).
  * Détecte la langue toi-même à partir du message, sans attendre qu'on te la nomme.
  * Si le message mélange plusieurs langues, réponds dans la langue dominante et reprends naturellement les termes de l'autre langue quand c'est plus clair.
  * Si un passage est trop ambigu ou dans une écriture que tu ne reconnais pas, dis-le honnêtement et demande une reformulation au lieu d'inventer une signification.
  * Ne force jamais une langue : si l'utilisateur change de langue en cours de conversation, suis-le immédiatement.
- MÉMOIRE : Tiens compte de l'historique fourni pour garder le fil de la conversation (symboles, niveaux, décisions déjà évoqués).
- EXPERTISE : Price Action, Order Blocks, Fair Value Gaps (FVG), Break of Structure (BOS), Change of Character (CHoCH), calcul de ratio Risque/Rendement, et gestion du capital.
- HONNÊTETÉ : Si une information n'est pas vérifiable ou dépasse tes connaissances, dis-le clairement. Ne prétends jamais avoir exécuté un ordre, consulté un compte réel ou obtenu un résultat garanti. Toute projection est une hypothèse, jamais une certitude.
- FORMATAGE : Rédige des phrases claires et naturelles, fluides pour la synthèse vocale. Évite les accumulations de markdown brut ou de symboles parasites. Sois concise, percutante et pédagogique.
- RÈGLE D'OR : La protection du capital et la gestion du risque sont toujours prioritaires.\`;

    const chatMessages: AiMessage[] = [{ role: 'system', content: systemInstruction }];
    for (const item of history) {
      const content = cleanText(item?.content ?? item?.text, 2000);
      if (!content) continue;
      chatMessages.push({ role: item?.role === 'user' ? 'user' : 'assistant', content });
    }

    let userContent = message;
    if (contextAnalysis && typeof contextAnalysis === 'object') {
      const ctx = {
        symbol: cleanText(contextAnalysis.symbol, 24),
        timeframe: cleanText(contextAnalysis.timeframe, 8),
        trend: cleanText(contextAnalysis.visualObservations?.trend, 24),
        recommendation: cleanText(contextAnalysis.recommendation, 16),
      };
      userContent += \`\\n[Contexte analyse active: Symbole \${ctx.symbol || 'N/A'}, Unité \${ctx.timeframe || 'N/A'}, Tendance \${ctx.trend || 'N/A'}, Recommandation \${ctx.recommendation || 'N/A'}]\`;
    }
    chatMessages.push({ role: 'user', content: userContent });

    const safeRequested = (detectedLanguage || language).replace(/[^A-Za-z-]/g, '').slice(0, 16);
    const langInstruction = safeRequested
      ? \`\\nLANGUE DE RÉPONSE : la langue principale détectée du dernier message utilisateur est « \${safeRequested} ». Réponds intégralement et naturellement dans cette langue. Si le message mélange plusieurs langues, suis la langue dominante et conserve les termes techniques dans leur langue d'origine lorsqu'ils sont plus précis. Si le message n'est pas compréhensible, dis-le honnêtement et demande une reformulation.\`
      : \`\\nLANGUE DE RÉPONSE : détecte toi-même la langue du dernier message utilisateur et réponds dans cette langue.\`;
    chatMessages[0] = { role: 'system', content: systemInstruction + langInstruction };

    const chained = await aiEngine.runChat(chatMessages, { temperature: 0.55, task: 'reasoning', maxTokens: 2200 });
    if (!chained.success || !chained.text) {
      return res.status(503).json({ success: false, code: chained.reason || 'AI_NOT_CONFIGURED', error: SERVICE_UNAVAILABLE });
    }

    return res.json({
      success: true,
      reply: chained.text,
      engineLabel: 'JYNTRA',
      provider: providerLabel(chained.tier),
      model: chained.model || (chained.tier === 'FREE' ? freeAiModel : undefined),
      latencyMs: chained.latencyMs,
      transcription: transcription ? { attempted: true, success: transcription.ok, provider: transcription.ok ? transcription.provider : 'navigateur' } : { attempted: false },
      trace: buildTrace({
        isAudio: !!transcription,
        transcription: transcription ? { ok: transcription.ok, provider: transcription.provider } : undefined,
        task: 'reasoning',
        result: chained,
        usedSearch: false,
        hasImage: false,
      }),
      timestamp: Date.now(),
    });
  } catch {
    res.status(500).json({ success: false, error: SERVICE_UNAVAILABLE });
  }
};

app.post('/api/ai/lynara-chat', chatLimit, noStore, handleLynaraChat);
app.post('/api/ai/jarvis-chat', chatLimit, noStore, handleLynaraChat);

// ---------------------------------------------------------------------------
// 5B. API: Muse Voice Transcribe (real provider route, honest when absent)
// ---------------------------------------------------------------------------
app.post('/api/ai/transcribe', audioLimit, noStore, async (req: Request, res: Response) => {
  try {
    const audioBase64 = req.body?.audioBase64;
    const mime = cleanText(req.body?.mimeType, 60) || 'audio/webm';
    const language = cleanText(req.body?.language, 20);
    if (typeof audioBase64 !== 'string' || !audioBase64.length) {
      return res.status(400).json({ success: false, error: 'Aucun audio fourni.' });
    }
    if (audioBase64.length > 9_000_000) {
      return res.status(413).json({ success: false, error: 'Audio trop volumineux (max ~6 Mo).' });
    }
    const buffer = Buffer.from(audioBase64.replace(/^data:audio\\/[a-z0-9.+-]+;base64,/i, ''), 'base64');
    const result = await aiEngine.transcribe(new Blob([buffer], { type: mime }), language);
    if (!result.success) {
      return res.status(503).json({
        success: false,
        code: result.reason,
        error: 'Transcription serveur indisponible. La reconnaissance vocale du navigateur reste utilisable.',
      });
    }
    return res.json({ success: true, text: result.text, provider: 'Meta', model: result.model });
  } catch {
    return res.status(500).json({ success: false, error: SERVICE_UNAVAILABLE });
  }
});`;
src = src.slice(0,i) + replacement + src.slice(j + end.length);
fs.writeFileSync(file, src);
console.log('lynara replaced');
