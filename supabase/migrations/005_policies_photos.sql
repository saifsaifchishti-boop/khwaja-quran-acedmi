-- Run after 004. Adds the teacher-application photo column and writes the default policies (editable in Admin > Policies).
alter table teacher_applications add column if not exists photo_path text;

insert into pages(slug, title_en, title_ur, body_en, published) values
('privacy', 'Privacy Policy', 'رازداری کی پالیسی', $$Khwaja Quran Majeed Academy respects the privacy of every student, parent and teacher.

What we collect: the details you give in the registration or teacher form (name, father's name, date of birth, email, WhatsApp number, country, city, time zone, photo and documents), your attendance, homework, fee and payment records, and the messages you send inside the academy portal.

Why we collect it: to run classes, create your account, arrange timings, send fee and class notices, keep records, and keep students safe. We do not sell or rent personal information and we do not use it for advertising.

Who can see it: your teacher sees only the students assigned to them. Administrators see what they need to run the academy. Profile pictures and documents are private and can be opened only by signed-in members who are allowed to see them.

Calls and chat: video and audio classes are not recorded. Chat messages are stored securely so you can read them from any device. A message that is deleted for everyone is removed for all members.

Your choices: you may ask the administrator to correct your details or to close your account. Records needed for fees and safety may be kept for a reasonable period after that.

Security: passwords are stored in protected form, sign-in attempts are limited, and administrator areas need extra verification. Please keep your password private and change it if you think someone else knows it.

Contact the academy using the details at the bottom of the home page for any privacy question.$$, true),
('terms', 'Terms of Use', 'شرائطِ استعمال', $$By using this website and portal you agree to these terms.

Accounts: every account belongs to one person. Do not share your ID or password. You are responsible for what happens under your account. The academy may suspend an account that is misused.

Respect: this is a place of learning the Quran. Abuse, bad language, harassment, inappropriate pictures or messages, and any attempt to contact a student or teacher outside the academy for private purposes are not allowed.

Classes: classes are for enrolled students only. Do not record, photograph or share a class, a teacher or another student without written permission from the academy.

Content: lesson material, handouts and the website belong to the academy or their authors. Use them only for your own study.

Changes: the academy may update these terms and its fees. Important changes are announced on the website or the portal.

Questions about these terms can be sent to the academy through the contact details on the home page.$$, true),
('safeguarding', 'Child Safeguarding', 'بچوں کے تحفظ کی پالیسی', $$The safety of every child in our classes is the academy's first responsibility.

Teachers may talk to students only through the academy portal (chat and class calls). They must not ask for or give personal phone numbers, social media accounts or private meetings.

Teachers must dress and behave appropriately on camera, use a suitable background, and keep every conversation about the lesson.

Parents are welcome to sit near the student during class and to ask the administrator about any concern. Parents of younger children are encouraged to stay nearby.

Classes are not recorded. Students and teachers must never record or photograph a class.

Any message or behaviour that makes a student uncomfortable should be reported at once. Use the Report option on a chat message, or contact the administrator directly. Every report is read by the administrator and handled seriously and privately.

The academy may remove a teacher or student from classes immediately while a concern is being checked.$$, true),
('fees-refunds', 'Fee and Refund Policy', 'فیس اور واپسی کی پالیسی', $$Fees: the fee of each course is shown on the Courses page and on the registration form. After approval, your dashboard shows your fee card with the amount, the due date and the status.

How to pay: send the fee to one of the academy payment accounts shown on your Fees page. Then enter the transaction number (and receipt if asked) on the same page. The academy verifies the payment and marks the fee as paid.

Due dates: please pay by the due date on your fee card. If you need more time, tell the administrator before the date.

Missed payment: classes may be paused until an overdue fee is paid or an arrangement is agreed with the administrator.

Refunds: if you have paid and wish to leave, contact the administrator. Each request is reviewed fairly, taking into account the classes already taken. Approved refunds are returned through the same payment method where possible.

Changes in fee: the academy will announce any change in fees in advance. A change does not affect fees already paid.$$, true),
('admission-policy', 'Admission Policy', 'داخلہ پالیسی', $$Who can apply: anyone who wishes to learn the Quran, of any age. Younger students should have a parent or guardian nearby during class.

How we decide: the academy reviews every application personally. We may contact you on WhatsApp or email to ask questions or to suggest the best course and level.

After approval: you receive your Student ID and a temporary password by email. Please log in, change your password, add your profile photo and check your fee card.

Class timing: the academy arranges the class timing and the teacher. You will see it on your Classes page. If the time does not suit you, tell the administrator and a change will be considered.

Accurate information: please give true and complete details. The academy may cancel an admission that was based on false information.$$, true),
('class-rules', 'Class Rules and Attendance', 'کلاس کے قواعد اور حاضری', $$Be ready a few minutes before the class with your Quran, a quiet place and a working camera and microphone.

Join from the Classes page using your own account. Dress modestly and sit in a suitable place.

Attendance is marked for every class. If you cannot attend, please tell your teacher or the administrator in advance.

If a student is late by more than a short time, the teacher may shorten the lesson. Repeated absence may lead to the class being cancelled.

Do your homework and listen to your teacher. Respect the teacher and other students at all times.

Use the camera and microphone only for the class. Do not share the class link or let other people join.$$, true),
('teacher-conduct', 'Teacher Code of Conduct', 'اساتذہ کا ضابطۂ اخلاق', $$Teachers represent the Quran and the academy. They must be sincere, patient, punctual and respectful.

Begin and end classes on time and mark attendance and progress honestly.

Communicate with students and parents only through the academy portal. Never share personal contact details, never arrange private meetings, and never ask a student for money or gifts.

Keep the class focused on the lesson. Keep the camera background simple and appropriate.

Do not record or photograph classes or students.

Keep student information private. Do not share names, photos or records with anyone outside the academy.

Report any concern about a student's safety to the administrator immediately. Breaking this code may lead to removal from the academy.$$, true),
('chat-calls', 'Chat and Call Policy', 'چیٹ اور کال پالیسی', $$The portal chat and video calls are for learning and academy matters only.

Students may chat with their assigned teacher and the administrators. Teachers may chat with their assigned students and the administrators. Only administrators create groups and decide who is in them.

Be kind and respectful. Do not send inappropriate pictures, voice messages or links.

Calls are not recorded. Do not record, screenshot or share a call.

You can delete your own message for everyone. You can report a message using the Report option; administrators read every report.

Messages are stored securely and are visible only to the members of that chat. The academy may review a reported message to protect students.$$, true)
on conflict (slug) do update set
  body_en = case when pages.body_en = '' then excluded.body_en else pages.body_en end,
  title_ur = case when pages.title_ur = '' then excluded.title_ur else pages.title_ur end, published = true;
