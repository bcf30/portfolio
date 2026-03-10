Portfolio website for Ramiro Chen.

## Features

- Cinematic, dark-themed portfolio with custom frequency response scrollbar
- Projects, experience, bio, and interest gallery sections
- Blog system with admin interface for creating and managing posts
- Markdown support for blog posts with image uploads
- Real-time updates (on page load)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Vercel Postgres (database)
- Vercel Blob (image storage)
- Framer Motion (animations)

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Vercel Postgres locally)
- Vercel Blob token

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.example` to `.env.local` and fill in the values:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
ADMIN_PASSWORD=your_admin_password
```

3. Set up the database:

Run the SQL in `sql/schema.sql` on your PostgreSQL database to create the `posts` table.

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This portfolio is optimized for deployment on Vercel.

### Vercel Setup

1. Import the project into Vercel.
2. In the Vercel dashboard, create a Postgres database (or use an existing one) and a Blob storage.
3. Add the following environment variables in the Vercel project settings:
   - `DATABASE_URL` (provided by Vercel Postgres)
   - `BLOB_READ_WRITE_TOKEN` (provided by Vercel Blob)
   - `ADMIN_PASSWORD` (choose a secure password for the blog admin)
4. Deploy the project.

After deployment, run the `sql/schema.sql` script on your Vercel Postgres database (via the Vercel dashboard or psql) to create the table.

### Blog Admin

- Access the admin interface at `/admin/blog` on your deployed site.
- Enter the admin password set in `ADMIN_PASSWORD`.
- Create, edit, and delete blog posts. Images can be uploaded and embedded in posts.

### Blog Pages

- The blog listing page is available at `/blog`.
- Individual blog posts are accessible at `/blog/[slug]`.
- The home page displays the latest 3 blog posts in the "From the Blog" section.

## Notes

- The home page uses a custom scroll container; navigation links to sections (e.g., `/#contact`) work with smooth scrolling.
- The admin interface is protected by a shared password; for production, consider a more robust authentication method.
- Markdown content is styled via `globals.css` under the `.prose` class.

## Customization

- Colors and theming are defined using OKLCH values in the component styles.
- Fonts: Cormorant Garamond (headings) and Crimson Text (body) via Google Fonts.
- Adjust layout and styling in the respective component files under `src/app/`.
