-- Implements: MVP-03
-- Supabase performans danışmanının işaret ettiği örtük foreign key
-- index'leri. catalog_foods.sql'de gözden kaçmış üçü:
create index food_versions_source_id_idx on catalog.food_versions (source_id);
create index foods_brand_id_idx on catalog.foods (brand_id) where brand_id is not null;
create index foods_current_version_id_idx
  on catalog.foods (current_version_id) where current_version_id is not null;
