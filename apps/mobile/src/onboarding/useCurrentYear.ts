import { useState } from 'react';

/**
 * Onboarding oturumu boyunca sabit "şimdiki yıl".
 *
 * nutrition-engine `new Date()` çağırmaz (deterministik kalması için,
 * bkz. paket testleri); yıl argüman olarak verilir. Bu hook o argümanın
 * TEK kaynağıdır — doğum yılı adımındaki canlı doğrulama ile özet ekranındaki
 * `calculateGoals` çağrısı aynı yılı kullanır, gece yarısı geçişinde bile
 * tutarsızlık olmaz.
 */
export function useCurrentYear(): number {
  const [year] = useState(() => new Date().getFullYear());
  return year;
}
