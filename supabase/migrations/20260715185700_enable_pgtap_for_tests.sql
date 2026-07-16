-- Implements: FND-04
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- pgTAP olmadan bu şart uygulanamaz. Uzantı yalnız test çalıştırmak için
-- gerekir ve istemciye açık değildir.
create extension if not exists pgtap with schema extensions;
