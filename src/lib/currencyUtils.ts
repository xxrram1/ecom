// Assume base currency is THB (Thai Baht)
const BASE_CURRENCY_CODE = 'THB';

// Hardcoded conversion rates for demonstration (อัตราแลกเปลี่ยนจริง ณ เวลาปัจจุบัน)
const CONVERSION_RATES: { [key: string]: number } = {
  'THB': 1,        // Thai Baht (ฐาน)
  'USD': 0.027,    // US Dollar
  'EUR': 0.025,    // Euro
  'GBP': 0.021,    // British Pound (เพิ่มใหม่)
  'JPY': 4.3,      // Japanese Yen
  'AUD': 0.040,    // Australian Dollar
};

export const formatCurrency = (amountInBase: number, targetCurrency: string): string => {
  const rate = CONVERSION_RATES[targetCurrency] || 1;
  const convertedAmount = amountInBase * rate;

  // ปรับการจัดรูปแบบให้เหมาะสมกับแต่ละสกุลเงิน
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  // สำหรับเงินเยนไม่แสดงทศนิยม
  if (targetCurrency === 'JPY') {
    formatOptions.minimumFractionDigits = 0;
    formatOptions.maximumFractionDigits = 0;
  }

  // ใช้ locale ที่เหมาะสมสำหรับแต่ละสกุลเงิน
  let locale = 'en-US';
  switch (targetCurrency) {
    case 'THB':
      locale = 'th-TH';
      break;
    case 'EUR':
      locale = 'de-DE';
      break;
    case 'GBP':
      locale = 'en-GB';
      break;
    case 'JPY':
      locale = 'ja-JP';
      break;
    case 'AUD':
      locale = 'en-AU';
      break;
    default:
      locale = 'en-US';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(convertedAmount / 100);
};