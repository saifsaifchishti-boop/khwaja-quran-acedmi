-- DEV ONLY. Courses are created UNPUBLISHED; admin decides what to publish. Remove before production if unwanted.
insert into courses(slug,title_en,title_ur,sort_order) values
('nazra','Quran Reading / Nazra','ناظرہ قرآن',1),('madani-qaida','Madani Qaida','مدنی قاعدہ',2),
('noorani-qaida','Noorani Qaida','نورانی قاعدہ',3),('tajweed','Quran with Tajweed','قرآن بمع تجوید',4),
('hifz','Quran Memorization / Hifz','حفظ القرآن',5),('translation','Quran Translation','ترجمۃ القرآن',6),
('tafseer','Quran Tafseer','تفسیر القرآن',7),('islamic-basics','Basic Islamic Education','بنیادی اسلامی تعلیم',8),
('hadith','Hadith Studies','مطالعۂ حدیث',9),('duas-sunnah','Daily Duas and Sunnah','روزمرہ دعائیں اور سنتیں',10),
('salah','Salah and Islamic Practices','نماز اور اسلامی احکام',11),('kids','Courses for Children','بچوں کے کورس',12),
('adults','Courses for Adults','بڑوں کے کورس',13),('one-to-one','Customized One-to-One Classes','انفرادی کلاسز',14)
on conflict do nothing;
insert into marquee_items(text,kind,sort_order) values ('بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ','bismillah',1) on conflict do nothing;
