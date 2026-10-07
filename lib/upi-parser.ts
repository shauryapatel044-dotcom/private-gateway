// Regex patterns for Indian UPI (OmniCard / Banking / UPI notifications)
// Matches keyword-prefixed IDs (10 to 24 chars, e.g. OmniCard 18-digit Transaction ID or 12-digit UTR)
const UTR_KEYWORD_REGEX =
  /(?:utr|rrn|upi\s*ref(?:erence)?|ref(?:\s*no\.?)?|txn(?:\s*id)?|transaction\s*id)[\s:#-]*([0-9a-zA-Z]{10,24})\b/gi;
const GENERAL_12_DIGIT_REGEX = /\b([0-9]{12})\b/g;

const AMOUNT_PATTERNS = [
  /(?:received|credited|added|amount(?: of)?|paid)\s*(?:of)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
  /(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
];

// Helper to extract transaction amounts from text (ignoring balance updates)
export function extractAmounts(text: string): number[] {
  // Strip out balance sentences like "Updated balance is Rs.0.00" so balance doesn't collide with transaction amount
  const cleanedText = text.replace(
    /(?:updated\s*balance|available\s*balance|balance\s*is|bal\b)[^0-9]*rs\.?\s*[0-9,]+(?:\.[0-9]{1,2})?/gi,
    ''
  );

  const found = new Set<number>();
  for (const pattern of AMOUNT_PATTERNS) {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        found.add(parsed);
      }
    }
  }
  return Array.from(found);
}

// Helper to extract UTRs or OmniCard Transaction IDs from text
export function extractUtrs(text: string): string[] {
  const utrs = new Set<string>();

  // 1. Try keyword-specific Transaction IDs / UTRs first
  let match;
  while ((match = UTR_KEYWORD_REGEX.exec(text)) !== null) {
    if (match[1] && match[1].length >= 10) {
      utrs.add(match[1]);
    }
  }

  // 2. Try general 12-digit sequences if none found
  if (utrs.size === 0) {
    while ((match = GENERAL_12_DIGIT_REGEX.exec(text)) !== null) {
      if (match[1] && match[1].length === 12) {
        utrs.add(match[1]);
      }
    }
  }

  return Array.from(utrs);
}
