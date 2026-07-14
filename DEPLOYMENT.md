# BuildAI Studio — Production Deployment Guide

This guide details the step-by-step process of deploying the BuildAI Studio Next.js application to a live production environment.

---

## 1. Setup Supabase (Database & Storage)

Since this app uses Supabase for database management and storage, you must configure a production Supabase instance.

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Configure the Project Name, Database Password, and Region.

### Set Up Schema
1. Open the **SQL Editor** on your Supabase dashboard.
2. Click **New query** and copy the contents of [supabase-schema.sql](file:///Users/it-004/Desktop/Planner/buildai-studio/supabase-schema.sql).
3. Click **Run** to execute the query. This sets up the `projects` table with Row Level Security (RLS) and real-time support.

---

## 2. Deploy the Frontend (Vercel)

Vercel is the recommended hosting platform for Next.js App Router applications as it supports zero-config deployments, edge networking, and serverless functions natively.

### Import Repository
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log into [vercel.com](https://vercel.com) using your Git provider.
3. Click **Add New > Project** and import your repository.

### Configure Environment Variables
In the Vercel project configuration, add your production environment variables:

* `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (from Supabase Dashboard under **Project Settings > API**).
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Public API Key (from Supabase Dashboard under **Project Settings > API**).
* `GEMINI_API_KEY`: Your Google Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/)). This enables the highly-functional AI command design assistant.

### Deploy
* Click **Deploy**. Vercel will automatically compile the Next.js app, perform TypeScript check, and host it live under a custom `.vercel.app` domain (or your own custom domain).

---

## 3. Storage Bucket Setup (Supabase Dashboard)

If your app saves layout snapshots or other design outputs:
1. Navigate to **Storage** on the Supabase Dashboard.
2. Click **New Bucket**, name it `thumbnails` or `projects`, and toggle **Public** if public access is needed.
3. Set RLS policies under **Storage > Policies** to restrict uploads to authenticated users (e.g. comparing user ID claims).

---

## 4. Production Environment Variables (.env.production)

When compiling Next.js apps, make sure you configure your `.env` securely. In production:
- Do not commit secrets to Git.
- Set variables in your host's platform (e.g. Vercel Project Settings) or use a `.env.production` file locally.
