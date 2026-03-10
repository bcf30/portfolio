const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
process.env.POSTGRES_URL = process.env.DATABASE_URL;
const { sql } = require('@vercel/postgres');

async function setup() {
  try {
    console.log('Creating posts table...');
    const result = await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        cover_image VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Posts table created successfully!', result);
  } catch (error) {
    console.error('Error creating posts table:', error);
  }
}

setup();
