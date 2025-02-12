-- Drop suggestions and documents tables
drop policy if exists "Users can read suggestions" on suggestions;
drop policy if exists "Users can create suggestions" on suggestions;
drop policy if exists "Users can update suggestions" on suggestions;
drop policy if exists "Users can delete suggestions" on suggestions;

drop policy if exists "Users can read documents" on documents;
drop policy if exists "Users can create documents" on documents;
drop policy if exists "Users can update documents" on documents;
drop policy if exists "Users can delete documents" on documents;

drop table if exists suggestions;
drop table if exists documents; 