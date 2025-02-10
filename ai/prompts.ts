import { Database } from '@/lib/supabase/types';

type PromptConfig = Database['public']['Tables']['prompt_config']['Row'];

// types.ts
export interface SystemConfig {
  tone: 1 | 2 | 3 | 4 | 5;
  technicalDepth: 1 | 2 | 3 | 4 | 5;
  responseLength: 1 | 2 | 3 | 4 | 5;
  language: 'en' | 'es';
  empathyLevel: 1 | 2 | 3 | 4 | 5;
  urgencyEmphasis: 1 | 2 | 3 | 4 | 5;
}

export interface BusinessRules {
  minQuoteAmount: number;
  maxQuoteAmount: number;
  warrantyPeriod: number;
  maxShopOptions: number;
  priceRangeBuffer: number;
}

// prompts.ts
export const greetingTemplates = {
  1: "Hey! I'm here to help you with your car!",
  2: "Hi there! I'm your friendly auto repair assistant.",
  3: "Welcome! I'm your Siblignk auto repair assistant.",
  4: "Greetings, I'm your professional Siblignk automotive assistant.",
  5: "Welcome to Siblignk. I'm your dedicated automotive service consultant.",
};

interface ShopQuote {
  totalMin: number;
  totalMax: number;
  partsMin: number;
  partsMax: number;
  laborMin: number;
  laborMax: number;
  shopName: string;
}

function calculatePriceRanges(basePrice: number, buffer: number): ShopQuote {
  const bufferMultiplier = 1 + buffer / 100;
  return {
    totalMin: Math.round(basePrice * 0.8),
    totalMax: Math.round(basePrice * bufferMultiplier),
    partsMin: Math.round(basePrice * 0.4),
    partsMax: Math.round(basePrice * 0.6),
    laborMin: Math.round(basePrice * 0.4),
    laborMax: Math.round(basePrice * 0.5),
    shopName: 'Auto Shop',
  };
}

function generateShopList(
  maxOptions: number,
  buffer: number,
  basePrice: number
): string {
  let list = '';
  for (let i = 1; i <= maxOptions; i++) {
    const quote = calculatePriceRanges(basePrice, buffer);
    list += `• ${quote.shopName} ${i}: $${quote.totalMin}-${quote.totalMax} (${buffer}% market rate)\n`;
  }
  return list;
}

function generatePriceRanges(min: number, max: number, buffer: number): string {
  return `
• Basic Service: $${min}-${min * 2}
• Intermediate Service: $${min * 2}-${max / 2}
• Complex Service: $${max / 2}-${max}
(Prices include ${buffer}% market adjustment)`;
}

export function createPrompts(config: PromptConfig): string {
  const { system_config, business_rules } = config;

  return `You are Siblignk AI, a professional automotive service assistant. Your responses should follow these configurations:

Language: ${system_config.language === 'es' ? 'Spanish' : 'English'}
Tone Level: ${system_config.tone} (1: Casual - 5: Very Professional)
Technical Depth: ${system_config.technicalDepth} (1: Basic - 5: Very Technical)
Response Length: ${system_config.responseLength} (1: Concise - 5: Detailed)
Empathy Level: ${system_config.empathyLevel} (1: Direct - 5: Very Empathetic)
Urgency Emphasis: ${system_config.urgencyEmphasis} (1: Relaxed - 5: Very Urgent)

Business Rules:
- Quote Range: $${business_rules.minQuoteAmount} - $${business_rules.maxQuoteAmount}
- Warranty Period: ${business_rules.warrantyPeriod} months
- Max Shop Options: ${business_rules.maxShopOptions}
- Price Buffer: ${business_rules.priceRangeBuffer}%

You should:
1. Always respond in ${system_config.language === 'es' ? 'Spanish' : 'English'}
2. Maintain the specified tone level
3. Use technical terms appropriate for the technical depth level
4. Keep responses at the specified length level
5. Show empathy according to the empathy level
6. Emphasize urgency based on the urgency level
7. Stay within the business rules for quotes and options

Remember to:
- Be helpful and professional
- Focus on automotive service needs
- Provide accurate information
- Stay within the configured parameters`;
}

// Ejemplo de configuración por defecto
export const defaultConfig: PromptConfig = {
  id: 'default',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  system_config: {
    tone: 3,
    technicalDepth: 3,
    responseLength: 3,
    language: 'es',
    empathyLevel: 4,
    urgencyEmphasis: 3,
  },
  business_rules: {
    minQuoteAmount: 50,
    maxQuoteAmount: 1000,
    warrantyPeriod: 12,
    maxShopOptions: 3,
    priceRangeBuffer: 10,
  },
  is_active: true,
};
