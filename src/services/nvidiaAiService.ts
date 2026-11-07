import { UserProfile } from '../types/nutrition';

export interface AiAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  aiTip: string;
}

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const ACTIVE_TEXT_MODELS = [
  'google/gemma-3-12b-it',
  'deepseek-ai/deepseek-v4.1-flash',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'mistralai/mistral-large-4-1t-a52b',
  'google/gemma-4-31b-it',
  'nv-mistralai/mistral-nemo-12b-instruct',
];

export const ACTIVE_VISION_MODELS = [
  'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'google/gemma-3-12b-it',
  'meta/llama-3.2-90b-vision-instruct',
];

async function callNvidiaWithFallback(
  apiKey: string,
  candidates: string[],
  messages: any[],
  maxTokens = 400
): Promise<{ content: string; usedModel: string }> {
  const cleanKey = apiKey.trim();
  let lastError = '';

  for (const model of candidates) {
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.15,
          max_tokens: maxTokens,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          return { content, usedModel: model };
        }
      } else {
        const errText = await response.text();
        lastError = `(${response.status}) ${errText.slice(0, 140)}`;
        // If 401 Unauthorized, key itself is wrong, stop immediately
        if (response.status === 401 || response.status === 403) {
          throw new Error(`NVIDIA API Anahtarı Geçersiz (${response.status}). Lütfen anahtarınızı kontrol edin.`);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Anahtarı Geçersiz')) {
        throw err;
      }
      lastError = err?.message || 'Bilinmeyen hata';
    }
  }

  throw new Error(`NVIDIA Sunucu Hatası: ${lastError}`);
}

export async function testNvidiaApiKey(
  apiKey: string,
  preferredModel?: string
): Promise<{ ok: boolean; message: string; activeModel?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey || !cleanKey.startsWith('nvapi-')) {
    return {
      ok: false,
      message: 'Geçersiz format: NVIDIA API anahtarı "nvapi-" ile başlamalıdır.',
    };
  }

  const candidates = preferredModel
    ? [preferredModel, ...ACTIVE_TEXT_MODELS.filter((m) => m !== preferredModel)]
    : ACTIVE_TEXT_MODELS;

  try {
    const { content, usedModel } = await callNvidiaWithFallback(
      cleanKey,
      candidates,
      [{ role: 'user', content: 'Sadece "OK" yaz.' }],
      15
    );
    return {
      ok: true,
      activeModel: usedModel,
      message: `Bağlantı Başarılı! Aktif Model: ${usedModel} (Yanıt: ${content.trim()})`,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || 'Sunucuya ulaşılamadı',
    };
  }
}

export async function analyzeMealWithNvidiaText(
  description: string,
  apiKey: string,
  preferredModel?: string
): Promise<AiAnalysisResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey || !cleanKey.startsWith('nvapi-')) {
    throw new Error(
      'NVIDIA API Anahtarı eksik! Lütfen Profil & Ayarlar sekmesinden kendi "nvapi-..." anahtarınızı girin.'
    );
  }

  const prompt = `Sen klinik düzeyde hassas hesaplama yapan bir diyetisyen ve besin veritabanı motorusun.
Kullanıcının yediği yemek: "${description}".

Lütfen bu yemeğin gerçek besin değerlerini hesapla ve SADECE geçerli bir JSON objesi döndür (başka hiçbir açıklama yazma):
{
  "name": "Yemeğin düzgün Türkçe adı ve miktarı",
  "calories": toplam_kalori_tam_sayi,
  "protein": protein_gram_tam_sayi,
  "carbs": karbonhidrat_gram_tam_sayi,
  "fat": yag_gram_tam_sayi,
  "portion": "Tahmini gramaj ve porsiyon (örn: 1 porsiyon - 250g)",
  "aiTip": "Bu besinle ilgili 1 cümlelik bilimsel diyetisyen yorumu"
}`;

  const candidates = preferredModel
    ? [preferredModel, ...ACTIVE_TEXT_MODELS.filter((m) => m !== preferredModel)]
    : ACTIVE_TEXT_MODELS;

  const { content } = await callNvidiaWithFallback(
    cleanKey,
    candidates,
    [
      {
        role: 'system',
        content: 'Sadece saf JSON döndüren bir beslenme analiz motorusun. Gerçek USDA/Türkomp besin değerlerini baz al.',
      },
      { role: 'user', content: prompt },
    ],
    400
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('NVIDIA AI yanıtı JSON formatında ayrıştırılamadı.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    name: parsed.name || description,
    calories: Math.round(Number(parsed.calories) || 0),
    protein: Math.round(Number(parsed.protein) || 0),
    carbs: Math.round(Number(parsed.carbs) || 0),
    fat: Math.round(Number(parsed.fat) || 0),
    portion: parsed.portion || '1 porsiyon',
    aiTip: parsed.aiTip || '',
  };
}

export async function analyzeMealWithNvidiaVision(
  base64Image: string,
  apiKey: string,
  preferredVisionModel?: string
): Promise<AiAnalysisResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey || !cleanKey.startsWith('nvapi-')) {
    throw new Error(
      'Fotoğraf analizi için NVIDIA API Anahtarı gereklidir! Lütfen Profil & Ayarlar sekmesinden "nvapi-..." anahtarınızı girin.'
    );
  }

  const formattedDataUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const prompt = `Fotoğraftaki yiyeceği ve porsiyon miktarını dikkatlice incele.
Gerçekçi kalori ve makro değerlerini hesapla ve SADECE şu JSON yapısında yanıt ver (başka hiçbir metin yazma):
{
  "name": "Fotoğraftaki yemeğin Türkçe adı",
  "calories": toplam_kalori_tam_sayi,
  "protein": protein_gram_tam_sayi,
  "carbs": karbonhidrat_gram_tam_sayi,
  "fat": yag_gram_tam_sayi,
  "portion": "Tahmini porsiyon ve gramaj",
  "aiTip": "Fotoğraftaki tabak hakkında 1 cümlelik beslenme tavsiyesi"
}`;

  const candidates = preferredVisionModel
    ? [preferredVisionModel, ...ACTIVE_VISION_MODELS.filter((m) => m !== preferredVisionModel)]
    : ACTIVE_VISION_MODELS;

  const { content } = await callNvidiaWithFallback(
    cleanKey,
    candidates,
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: formattedDataUrl } },
        ],
      },
    ],
    450
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('NVIDIA Vision yanıtı ayrıştırılamadı: ' + content.slice(0, 100));
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    name: parsed.name || 'Analiz Edilen Yemek',
    calories: Math.round(Number(parsed.calories) || 0),
    protein: Math.round(Number(parsed.protein) || 0),
    carbs: Math.round(Number(parsed.carbs) || 0),
    fat: Math.round(Number(parsed.fat) || 0),
    portion: parsed.portion || '1 porsiyon',
    aiTip: parsed.aiTip || '',
  };
}

export async function askNvidiaDietitianCoach(
  question: string,
  profile: UserProfile,
  todayCalories: number,
  todayProtein: number,
  todayCarbs: number,
  todayFat: number,
  todayMealNames: string[]
): Promise<string> {
  const cleanKey = profile.nvidiaApiKey.trim();
  if (!cleanKey || !cleanKey.startsWith('nvapi-')) {
    throw new Error(
      'AI Koç ile konuşmak için lütfen Profil sekmesinden NVIDIA API Anahtarınızı (nvapi-...) kaydedin.'
    );
  }

  const goalText =
    profile.goalType === 'lose'
      ? 'Kilo Vermek'
      : profile.goalType === 'gain'
      ? 'Kas / Kilo Kazanmak'
      : 'Formu Korumak';

  const systemPrompt = `Sen Eatless uygulamasının uzman klinik diyetisyeni ve sporcu beslenme koçusun.
Karşındaki kullanıcının gerçek profili:
- İsim: ${profile.name}
- Yaş: ${profile.age}, Cinsiyet: ${profile.gender === 'male' ? 'Erkek' : 'Kadın'}
- Boy: ${profile.heightCm} cm, Mevcut Kilo: ${profile.currentWeightKg} kg, Hedef Kilo: ${profile.targetWeightKg} kg
- Hedef: ${goalText}
- Günlük Hedefleri: ${profile.targets.calories} kcal | Protein: ${profile.targets.protein}g | Karb: ${profile.targets.carbs}g | Yağ: ${profile.targets.fat}g
- Bugün Şu Ana Kadar Aldığı: ${todayCalories} kcal | Protein: ${todayProtein}g | Karb: ${todayCarbs}g | Yağ: ${todayFat}g
- Bugün Yediği Yemekler: ${todayMealNames.length > 0 ? todayMealNames.join(', ') : 'Henüz yemek girilmedi'}

Kullanıcıya ismiyle (${profile.name}) hitap et. Cevabın doğrudan onun gerçek verilerine dayansın, net, motive edici ve bilimsel olsun.`;

  const { content } = await callNvidiaWithFallback(
    cleanKey,
    ACTIVE_TEXT_MODELS,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    400
  );

  return content.trim() || 'Yanıt alınamadı.';
}
