insert into public.categories(name,slug,description,sort_order) values
('Sembako','sembako','Bahan pokok dan kebutuhan dapur.',1),
('Sayur','sayur','Sayuran harian yang segar.',2),
('Buah','buah','Buah-buahan untuk kebutuhan rumah.',3),
('Telur & Protein','telur-protein','Telur dan bahan protein.',4),
('Minuman','minuman','Air, kopi, teh, dan minuman lain.',5),
('Kebutuhan Rumah','kebutuhan-rumah','Kebutuhan rumah sehari-hari.',6)
on conflict (slug) do nothing;

insert into public.products(category_id,sku,name,slug,description,short_description,price_idr,unit,stock_quantity,low_stock_threshold,is_featured)
select c.id,'BUAH-MANGGA','Mangga Harum Manis','mangga-harum-manis','Mangga segar untuk stok buah keluarga.','Mangga harum manis pilihan.',28000,'kg',25,5,true from public.categories c where c.slug='buah'
on conflict (slug) do nothing;
insert into public.products(category_id,sku,name,slug,description,short_description,price_idr,unit,stock_quantity,low_stock_threshold,is_featured)
select c.id,'SAYUR-JAGUNG','Jagung Manis','jagung-manis','Jagung manis untuk rebus, bakar, atau masakan rumahan.','Jagung manis segar.',12000,'kg',30,8,true from public.categories c where c.slug='sayur'
on conflict (slug) do nothing;
insert into public.products(category_id,sku,name,slug,description,short_description,price_idr,unit,stock_quantity,low_stock_threshold,is_featured)
select c.id,'TELUR-AYAM','Telur Ayam','telur-ayam','Telur ayam untuk kebutuhan harian.','Telur ayam segar.',30000,'kg',20,5,true from public.categories c where c.slug='telur-protein'
on conflict (slug) do nothing;
insert into public.products(category_id,sku,name,slug,description,short_description,price_idr,unit,stock_quantity,low_stock_threshold)
select c.id,'SEMBAKO-MINYAK','Minyak Goreng 1 L','minyak-goreng-1l','Minyak goreng untuk kebutuhan dapur.','Minyak goreng 1 liter.',20000,'botol',40,10,false from public.categories c where c.slug='sembako'
on conflict (slug) do nothing;
insert into public.products(category_id,sku,name,slug,description,short_description,price_idr,unit,stock_quantity,low_stock_threshold)
select c.id,'SEMBAKO-BERAS','Beras 5 kg','beras-5kg','Beras untuk stok rumah.', 'Beras 5 kilogram.',78000,'sak',12,3,false from public.categories c where c.slug='sembako'
on conflict (slug) do nothing;

insert into public.delivery_zones(name,delivery_fee_idr,min_order_idr,notes) values
('Sekitar Kedai Karuhun',5000,20000,'Sesuaikan area pengantaran di admin.'),
('Area lebih jauh',10000,30000,'Sesuaikan dengan jangkauan kurir.')
on conflict do nothing;
