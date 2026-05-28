insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certification-photos',
  'certification-photos',
  false,
  5242880,
  array['image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The certification-photos bucket is private.
-- Next.js API routes issue signed URLs only after checking that the requester is
-- an approved member or an admin. Deleted records must not be exposed to members.
--
-- No anon/authenticated storage policies are added in the MVP because uploads,
-- signed URL generation, and delete-state changes are handled through server API
-- routes with SUPABASE_SERVICE_ROLE_KEY.
