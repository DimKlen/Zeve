-- Météo visible (docs/06 F17) : météo du moment sur le jardin, minimale du jour dans le cache
-- (gel annoncé). Remplies par l'Edge Function garden-weather (Open-Meteo).
alter table public.gardens add column weather_now jsonb;      -- { temp, humidity }
alter table public.gardens add column weather_at timestamptz;
alter table public.garden_weather add column temp_min real;   -- °C
