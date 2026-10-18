-- Easy-to-remember IDs: students S1001, teachers T101. Existing accounts are renamed; login accepts the ID in any letter case.
create or replace function next_student_code() returns text language sql security definer set search_path=public as
$$ select 'S' || nextval('student_code_seq')::text $$;
create or replace function next_teacher_code() returns text language sql security definer set search_path=public as
$$ select 'T' || nextval('teacher_code_seq')::text $$;
update students set student_code = 'S' || regexp_replace(student_code, '^KQ-[0-9]+-', '') where student_code like 'KQ-%';
update teachers set teacher_code = 'T' || regexp_replace(teacher_code, '^TQ-[0-9]+-', '') where teacher_code like 'TQ-%';
