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

export async function testNvidiaApiKey(
  apiKey: string,
  model = 'meta/llama-3.1-70b-instruct'
): Promise<{ ok: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey || !cleanKey.startsWith('nvapi-')) {
    return {
      ok: false,
      message: 'Geçersiz format: NVIDIA API anahtarı "nvapi-" ile başlamalıdır.',
    };
  }

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Sadece "OK" yaz.' }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        message: `NVIDIA Sunucu Hatası (${response.status}): ${errText.slice(0, 120)}`,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return {
      ok: true,
      message: `Bağlantı Başarılı! NVIDIA NIM (${model}) aktif. Yanıt: ${reply.trim()}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Ağ hatası: ${error?.message || 'Sunucuya ulaşılamadı'}`,
    };
  }
}

export async function analyzeMealWithNvidiaText(
  description: string,
  apiKey: string,
  model = 'meta/llama-3.1-70b-instruct'
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

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Sadece saf JSON döndüren bir beslenme analiz motorusun. Asla rastgele veri üretme, gerçek USDA/Türkomp besin değerlerini baz al.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA API Hatası (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
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
  visionModel = 'meta/llama-3.2-11b-vision-instruct'
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

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: formattedDataUrl } },
          ],
        },
      ],
      max_tokens: 450,
      temperature: 0.15,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA Vision Hatası (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
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

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: profile.nvidiaTextModel || 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      max_tokens: 400,
      temperature: 0.35,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA API Hatası (${response.status}): ${errText.slice(0, 120)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Yanıt alınamadı.';
}
