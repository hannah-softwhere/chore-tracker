# Vercel Deployment Guide

This guide will help you deploy your chore tracker app to Vercel with the correct environment variable setup.

## Prerequisites

1. Your code is pushed to GitHub
2. You have a Vercel account
3. Your Neon PostgreSQL database is set up

## Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your chore tracker app

## Step 2: Configure Environment Variables

**This is the most important step!**

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following environment variable:

   **Name:** `DATABASE_URL`
   **Value:** `postgresql://neondb_owner:npg_j1u2vThSnJXe@ep-calm-pine-adjw40xq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   **Environment:** Select all environments (Production, Preview, Development)

3. Click **Save**

## Step 3: Deploy

1. Go to the **Deployments** tab
2. Click **Redeploy** to trigger a new deployment with the environment variables

## Step 4: Verify Deployment

1. Once deployed, visit your app URL
2. Test the API endpoints:
   - `https://your-app.vercel.app/api/chores`
   - `https://your-app.vercel.app/api/instances`
   - `https://your-app.vercel.app/api/payouts`

## Troubleshooting

### Build Errors

If you get build errors, check:

1. **Environment Variables**: Make sure `DATABASE_URL` is set correctly
2. **Database Connection**: Ensure your Neon database is accessible
3. **Dependencies**: All required packages are in `package.json`

### Common Issues

1. **"DATABASE_URL is not set"**: Add the environment variable in Vercel dashboard
2. **Connection timeout**: Check if your Neon database is running
3. **Authentication failed**: Verify your database credentials

### Debugging

1. Check Vercel build logs for specific error messages
2. Test database connection locally first
3. Verify environment variables are set correctly

## Environment Variable Format

Your `DATABASE_URL` should look like this:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Security Notes

- Never commit your `.env.local` file to Git
- Use Vercel's environment variable system for production
- Regularly rotate your database credentials
- Monitor your database usage and costs

## Next Steps

After successful deployment:

1. Update your React components to use the API endpoints
2. Test all functionality in the deployed environment
3. Set up monitoring and analytics
4. Consider adding authentication for production use
