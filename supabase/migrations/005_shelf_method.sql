-- Allow method='shelf' on scans rows so the shelf scanner can persist
-- one aggregate row per photo (the photo identified N items; we save
-- the rolled-up cost/sell/profit + the per-item breakdown in
-- comps_data). The original constraint only allowed 'barcode' and
-- 'vision'; this drop+recreate keeps the existing values valid.
alter table public.scans drop constraint if exists scans_method_check;

alter table public.scans
  add constraint scans_method_check
  check (method in ('barcode', 'vision', 'shelf'));
