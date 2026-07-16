-- Implements: MVP-03
-- PRD: §12-13 (03-nutrition-core.md)
--
-- BAŞLANGIÇ VERİSİ, ÜRETİM ÖLÇEĞİ DEĞİL.
--
-- §03 "Kaynak önceliği" hiyerarşisini uygulamak (doğrulanmış Calouch ->
-- Türk yemekleri -> güvenilir uluslararası -> markalı -> kullanıcı özel)
-- gerçek bir lisanslı besin veritabanı gerektirir (ör. USDA FoodData
-- Central, Türkiye'ye özgü bir kaynak). Bu dosya yalnız arama, manuel öğün
-- ve nutrition-engine akışlarını gerçek satırlarla test edebilmek için
-- ~15 yaygın besin içerir. Kaynak seçimi 14-open-decisions.md'de açık
-- karar olarak kayıtlı.
--
-- Ham ingredient'ler (tavuk göğsü, pirinç, muz, elma, süt, zeytinyağı,
-- yumurta, ekmek) 'international_reference' kaynağıyla ve yüksek
-- quality_score ile işaretli — bunlar iyi bilinen, stabil değerlerdir.
-- Hazır Türk yemekleri (mercimek çorbası, bulgur pilavı, köfte, sarma,
-- simit) 'turkish_dishes' kaynağıyla, DÜŞÜK quality_score ve
-- verification_status='unverified' ile işaretli — tarife göre değişen
-- tahminlerdir, dürüstçe böyle etiketlenir.

do $$
declare
  src_international uuid;
  src_turkish uuid;
begin
  select id into src_international from catalog.food_sources where key = 'international_reference';
  select id into src_turkish from catalog.food_sources where key = 'turkish_dishes';

  -- 1. Tavuk göğsü (ızgara)
  insert into catalog.foods (id, category, country_code) values
    ('10000000-0000-0000-0000-000000000001', 'meat', null);
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000001';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000001', 165, 31, 0, 3.6, 1.0, 0, 74);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000001', 'tr', 'Tavuk göğsü (ızgara)'),
    ('10000000-0000-0000-0000-000000000001', 'en', 'Chicken breast (grilled)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000001', 'tr', 'tavuk'),
    ('10000000-0000-0000-0000-000000000001', 'en', 'chicken');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000001', '1 porsiyon (150 g)', 150, true);

  -- 2. Beyaz pirinç (pişmiş)
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000002', 'grain');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000002' where id = '10000000-0000-0000-0000-000000000002';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000002', 130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 1);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000002', 'tr', 'Beyaz pirinç (pişmiş)'),
    ('10000000-0000-0000-0000-000000000002', 'en', 'White rice (cooked)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000002', 'tr', 'pirinç'),
    ('10000000-0000-0000-0000-000000000002', 'en', 'rice');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000002', '1 su bardağı (150 g)', 150, true);

  -- 3. Yumurta (haşlanmış)
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000003', 'dairy_egg');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000003' where id = '10000000-0000-0000-0000-000000000003';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000003', 155, 13, 1.1, 11, 3.3, 0, 124);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000003', 'tr', 'Yumurta (haşlanmış)'),
    ('10000000-0000-0000-0000-000000000003', 'en', 'Egg (boiled)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000003', 'tr', 'yumurta'),
    ('10000000-0000-0000-0000-000000000003', 'en', 'egg');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000003', '1 adet (50 g)', 50, true);

  -- 4. Muz
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000004', 'fruit');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000004' where id = '10000000-0000-0000-0000-000000000004';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000004', 89, 1.1, 23, 12, 0.3, 2.6, 1);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000004', 'tr', 'Muz'),
    ('10000000-0000-0000-0000-000000000004', 'en', 'Banana');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000004', '1 orta boy (118 g)', 118, true);

  -- 5. Elma
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000005', 'fruit');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000005' where id = '10000000-0000-0000-0000-000000000005';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000005', 52, 0.3, 14, 10, 0.2, 2.4, 1);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000005', 'tr', 'Elma'),
    ('10000000-0000-0000-0000-000000000005', 'en', 'Apple');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000005', '1 orta boy (182 g)', 182, true);

  -- 6. Zeytinyağı
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000006', 'fat_oil');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 1, src_international, 'verified', 0.95);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000006' where id = '10000000-0000-0000-0000-000000000006';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000006', 884, 0, 0, 100, 14, 0, 2);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000006', 'tr', 'Zeytinyağı'),
    ('10000000-0000-0000-0000-000000000006', 'en', 'Olive oil');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000006', '1 yemek kaşığı (13.5 g)', 13.5, true);

  -- 7. Süt (tam yağlı)
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000007', 'dairy_egg');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 1, src_international, 'verified', 0.90);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000007' where id = '10000000-0000-0000-0000-000000000007';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000007', 61, 3.2, 4.8, 4.8, 3.3, 1.9, 0, 43);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000007', 'tr', 'Süt (tam yağlı)'),
    ('10000000-0000-0000-0000-000000000007', 'en', 'Milk (whole)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000007', 'tr', 'süt'),
    ('10000000-0000-0000-0000-000000000007', 'en', 'milk');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000007', '1 su bardağı (240 g)', 240, true);

  -- 8. Ekmek (beyaz)
  insert into catalog.foods (id, category) values ('10000000-0000-0000-0000-000000000008', 'grain');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 1, src_international, 'verified', 0.85);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000008' where id = '10000000-0000-0000-0000-000000000008';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000008', 265, 9, 49, 5, 3.2, 0.7, 2.7, 491);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000008', 'tr', 'Ekmek (beyaz)'),
    ('10000000-0000-0000-0000-000000000008', 'en', 'Bread (white)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000008', 'tr', 'ekmek'),
    ('10000000-0000-0000-0000-000000000008', 'en', 'bread');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000008', '1 dilim (30 g)', 30, true);

  -- 9. Yoğurt (sade, tam yağlı)
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000009', 'dairy_egg', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 1, src_international, 'verified', 0.85);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000009' where id = '10000000-0000-0000-0000-000000000009';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000009', 61, 3.5, 4.7, 4.7, 3.3, 2.1, 0, 46);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000009', 'tr', 'Yoğurt (sade)'),
    ('10000000-0000-0000-0000-000000000009', 'en', 'Yogurt (plain)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000009', 'tr', 'yoğurt'),
    ('10000000-0000-0000-0000-000000000009', 'en', 'yogurt');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000009', '1 kase (200 g)', 200, true);

  -- 10. Beyaz peynir
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000010', 'dairy_egg', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 1, src_turkish, 'unverified', 0.70);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000010' where id = '10000000-0000-0000-0000-000000000010';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000010', 264, 14, 4, 4, 21, 15, 0, 917);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000010', 'tr', 'Beyaz peynir'),
    ('10000000-0000-0000-0000-000000000010', 'en', 'Turkish white cheese');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000010', 'tr', 'peynir'),
    ('10000000-0000-0000-0000-000000000010', 'en', 'feta');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000010', '1 dilim (30 g)', 30, true);

  -- 11. Mercimek çorbası (kırmızı mercimek)
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000011', 'prepared_dish', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 1, src_turkish, 'unverified', 0.60);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000011' where id = '10000000-0000-0000-0000-000000000011';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000011', 90, 5, 14, 2, 3, 300);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000011', 'tr', 'Mercimek çorbası'),
    ('10000000-0000-0000-0000-000000000011', 'en', 'Red lentil soup');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000011', 'tr', 'çorba'),
    ('10000000-0000-0000-0000-000000000011', 'en', 'lentil soup');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000011', '1 kase (250 g)', 250, true);

  -- 12. Bulgur pilavı
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000012', 'prepared_dish', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 1, src_turkish, 'unverified', 0.60);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000012' where id = '10000000-0000-0000-0000-000000000012';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000012', 150, 4.5, 28, 3, 4, 200);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000012', 'tr', 'Bulgur pilavı'),
    ('10000000-0000-0000-0000-000000000012', 'en', 'Bulgur pilaf');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000012', 'tr', 'pilav'),
    ('10000000-0000-0000-0000-000000000012', 'en', 'bulgur');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000012', '1 porsiyon (150 g)', 150, true);

  -- 13. Izgara köfte
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000013', 'prepared_dish', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000013', 1, src_turkish, 'unverified', 0.55);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000013' where id = '10000000-0000-0000-0000-000000000013';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, saturated_fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000013', 250, 20, 5, 17, 7, 0.5, 400);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000013', 'tr', 'Izgara köfte'),
    ('10000000-0000-0000-0000-000000000013', 'en', 'Grilled meatball (köfte)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000013', 'tr', 'köfte'),
    ('10000000-0000-0000-0000-000000000013', 'en', 'kofte');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000013', '1 porsiyon (150 g)', 150, true);

  -- 14. Zeytinyağlı yaprak sarma
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000014', 'prepared_dish', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014', 1, src_turkish, 'unverified', 0.50);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000014' where id = '10000000-0000-0000-0000-000000000014';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000014', 180, 3, 22, 9, 3, 350);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000014', 'tr', 'Zeytinyağlı yaprak sarma'),
    ('10000000-0000-0000-0000-000000000014', 'en', 'Stuffed vine leaves (olive oil)');
  insert into catalog.food_aliases (food_id, locale, alias) values
    ('10000000-0000-0000-0000-000000000014', 'tr', 'sarma'),
    ('10000000-0000-0000-0000-000000000014', 'en', 'dolma');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000014', '5 adet (150 g)', 150, true);

  -- 15. Simit
  insert into catalog.foods (id, category, country_code) values ('10000000-0000-0000-0000-000000000015', 'grain', 'TR');
  insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status, quality_score) values
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000015', 1, src_turkish, 'unverified', 0.55);
  update catalog.foods set current_version_id = '20000000-0000-0000-0000-000000000015' where id = '10000000-0000-0000-0000-000000000015';
  insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g, fiber_g, sodium_mg) values
    ('20000000-0000-0000-0000-000000000015', 275, 9, 52, 3, 4, 2.5, 500);
  insert into catalog.food_translations (food_id, locale, name) values
    ('10000000-0000-0000-0000-000000000015', 'tr', 'Simit'),
    ('10000000-0000-0000-0000-000000000015', 'en', 'Simit (sesame bread ring)');
  insert into catalog.food_portions (food_id, label, grams, is_default) values
    ('10000000-0000-0000-0000-000000000015', '1 adet (110 g)', 110, true);

end $$;
