# things

A simple web app to track and manage your inventory of things. Built with Vue 3, Vite, and TypeScript.

<img width="1458" height="835" alt="CleanShot 2026-06-07 at 16 04 38" src="https://github.com/user-attachments/assets/d54ececb-1be9-4114-aae8-40105988780b" />

### A little backstory...

I initially built this for myself to keep track of my belongings, as I own lots of audio equipment and other bits and bobs that people usually borrow.

You can see this reflected in the design decisions such as categorisation, tagging, and the deployments section of each item. It helps keep track of who has what, when it was borrowed, and where it's located. I also wanted a clean, component-driven UI that I could easily extend as my needs evolve.

I hope you find it useful as well. It's a work in progress, so expect some rough edges and missing features. Feedback and contributions are welcome!

## Features

- Add, edit, and delete items in your inventory
- Track deployments (who has what and when)
- Categorise items and add tags for easy searching
- Search and filter items by name, category, or tags
- Responsive design for use on desktop and mobile
- Multi-language support (English and Indonesian for now)

## Tech stack

- Styled with shadcn/ui + Tailwind CSS
- Data stored on Supabase
- Built with Vue 3, Vite, and TypeScript

## Getting started

### Setting up for development

Prerequisites: Node.js 16+ and npm or pnpm.

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Don't forget to format your code:

```bash
npm run format
```

### Setting up the database

Create a new project on [Supabase](https://supabase.com/).

Get your Supabase URL and publishable key from the project settings and add them to a `.env` file in the root of the project. An example (`.env.example`) is provided for reference - simply copy it to `.env` and fill in the values.

Navigate to the database section of your supabase project and add the `pg_hashids` extension to your database. This will allow us to generate short, unique IDs for our items, categories, and tags.

#### Table Setup

**items**

- `id` (text, primary key, default: `generate_short_id()`)
- `created_at` (timestamptz, default: `now()`)
- `name` (text, not nullable)
- `category` (text)
- `tags` (json)
- `remarks` (text)
- `custom` (json)
- `deployed` (timestamptz)
- `deployed_at` (text)
- `person_responsible` (text)
- `weight` (float4, not nullable)
- `price` (int8, not nullable)

**categories**

- `id` (text, primary key, default: `generate_short_id()`)
- `created_at` (timestamptz, default: `now()`)
- `name` (text, not nullable)

**tags**

- `id` (text, primary key, default: `generate_short_id()`)
- `created_at` (timestamptz, default: `now()`)
- `name` (text, not nullable)

##### Policies

Enable RLS on all tables and create a policy to allow all operations for authenticated users. For example, for the `items` table:

```sql
create policy "Enable read for all users"
on "public"."items"
as PERMISSIVE
for SELECT
to public
with check (true);
```

```sql
create policy "Enable insert for authenticated users only"
on "public"."items"
as PERMISSIVE
for INSERT
to authenticated
with check (true);
```

```sql
create policy "Enable update for authenticated users only"
on "public"."items"
as PERMISSIVE
for UPDATE
to authenticated
using (true)
with check (true);
```

```sql
create policy "Enable delete for authenticated users only"
on "public"."items"
as PERMISSIVE
for DELETE
to authenticated
with check (true);
```

Rinse and repeat for the `categories` and `tags` tables.

#### Storage Setup

Create a new storage bucket named `items` with public access. This will be used to store item photos.

Create another storage bucket named `profile_pictures` with public access. This will be used to store user profile pictures.

##### Policies

On both buckets, create policies for `INSERT`, `SELECT`, `UPDATE`, and `DELETE` that allow authenticated users to perform these operations.

I used the following expression for all policies in the `items` bucket to allow all authenticated users to manage item photos:

```sql
(bucket_id = 'items'::text)
```

...and the following expression for all policies in the `profile_pictures` bucket to ensure that users can only manage their own profile pictures:

```sql
((bucket_id = 'profile_pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

## Contributing

PRs welcome. Please open issues for bugs or feature requests.

## License

MIT License. See LICENSE file for details.
