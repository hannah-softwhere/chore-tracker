# Database Setup Guide for Chore Tracker

This guide will help you connect your chore tracker app to a Neon PostgreSQL database.

## Prerequisites

1. A Neon account (sign up at [neon.tech](https://neon.tech))
2. A Neon PostgreSQL database created
3. Your database connection string

## Step 1: Get Your Neon Database URL

1. Log into your Neon dashboard
2. Select your project
3. Go to the "Connection Details" section
4. Copy the connection string that looks like:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

## Step 2: Set Up Environment Variables

1. Create a `.env.local` file in your project root:
   ```bash
   touch .env.local
   ```

2. Add your database URL to the file:
   ```env
   DATABASE_URL="your_neon_connection_string_here"
   ```

## Step 3: Set Up the Database Schema

1. Run the database schema setup:
   ```bash
   # Generate the migration files
   npm run db:generate
   
   # Apply the migrations to your database
   npm run db:migrate
   ```

2. Alternatively, you can run the SQL schema directly in your Neon SQL editor:
   - Copy the contents of `database_schema.sql`
   - Paste it into your Neon SQL editor
   - Execute the script

## Step 4: Verify the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the API endpoints:
   - `GET /api/chores` - Should return an empty array `[]`
   - `GET /api/instances` - Should return an empty array `[]`
   - `GET /api/payouts` - Should return an empty array `[]`

## Step 5: Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variable in Vercel:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add `DATABASE_URL` with your Neon connection string
4. Deploy your application

## Database Schema Overview

The application uses three main tables:

### `chore_templates`
- Stores reusable chore definitions
- Fields: id, title, amount, frequency, created_at, is_active, created_by

### `chore_instances`
- Stores individual chore instances with due dates
- Fields: id, template_id, title, amount, frequency, due_date, completed, completed_at, created_at

### `payouts`
- Stores records of money paid out
- Fields: id, amount, date, created_by, notes

## API Endpoints

### Chores
- `GET /api/chores` - Get all chore templates
- `POST /api/chores` - Create a new chore template

### Instances
- `GET /api/instances` - Get all chore instances
- `GET /api/instances?date=2024-01-01` - Get chores for a specific date
- `GET /api/instances?due=true` - Get overdue chores
- `PATCH /api/instances` - Complete/uncomplete a chore
- `DELETE /api/instances` - Delete a chore instance

### Payouts
- `GET /api/payouts` - Get all payouts
- `POST /api/payouts` - Create a new payout

## Troubleshooting

### Common Issues

1. **Connection Error**: Make sure your `DATABASE_URL` is correct and includes `?sslmode=require`

2. **Migration Errors**: If you get migration errors, you can reset your database:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

3. **Type Errors**: Make sure all dependencies are installed:
   ```bash
   npm install
   ```

### Useful Commands

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables in production
- Consider using connection pooling for production applications
- Regularly rotate your database credentials

## Next Steps

Once your database is connected, you can:

1. Update your React components to use the API endpoints instead of localStorage
2. Add authentication to protect your data
3. Implement real-time updates using WebSockets
4. Add data validation and error handling
5. Set up automated backups for your database
