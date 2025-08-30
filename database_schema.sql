-- Chore Tracker Database Schema (PostgreSQL)
-- This file creates the database structure needed for the chore tracker application

-- Create the database (uncomment if you need to create the database)
-- CREATE DATABASE chore_tracker;
-- \c chore_tracker;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS chore_instances CASCADE;
DROP TABLE IF EXISTS chore_templates CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS frequency_type CASCADE;

-- Create custom ENUM type for frequency
CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'monthly', 'one-time');

-- Create chore_templates table
-- This stores the reusable chore definitions
CREATE TABLE chore_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID for the template
    title VARCHAR(255) NOT NULL,                   -- Chore description/title
    amount DECIMAL(10,2) NOT NULL,                 -- Amount earned for completing this chore
    frequency frequency_type NOT NULL,             -- How often this chore repeats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When this template was created
    is_active BOOLEAN DEFAULT TRUE,                -- Whether this template is currently active
    created_by VARCHAR(100) DEFAULT 'user',        -- Who created this template (for future multi-user support)
    
    -- Add constraints
    CONSTRAINT amount_positive CHECK (amount >= 0)  -- Amount cannot be negative
);

-- Create indexes for chore_templates
CREATE INDEX idx_chore_templates_frequency ON chore_templates(frequency);
CREATE INDEX idx_chore_templates_active ON chore_templates(is_active);
CREATE INDEX idx_chore_templates_created_at ON chore_templates(created_at);

-- Create chore_instances table
-- This stores individual instances of chores with due dates and completion status
CREATE TABLE chore_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID for the instance
    template_id UUID NOT NULL,                     -- Reference to the chore template
    title VARCHAR(255) NOT NULL,                   -- Chore title (denormalized for performance)
    amount DECIMAL(10,2) NOT NULL,                 -- Amount for this instance (denormalized)
    frequency frequency_type NOT NULL,             -- Frequency (denormalized)
    due_date DATE NOT NULL,                        -- When this chore is due
    completed BOOLEAN DEFAULT FALSE,               -- Whether this chore has been completed
    completed_at TIMESTAMP NULL,                   -- When this chore was completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When this instance was created
    
    -- Foreign key constraint
    CONSTRAINT fk_chore_instances_template 
        FOREIGN KEY (template_id) REFERENCES chore_templates(id) ON DELETE CASCADE,
    
    -- Add constraints
    CONSTRAINT amount_positive CHECK (amount >= 0), -- Amount cannot be negative
    CONSTRAINT completion_time_valid CHECK (completed_at IS NULL OR completed_at >= created_at) -- Completion time must be after creation
);

-- Create indexes for chore_instances
CREATE INDEX idx_chore_instances_template_id ON chore_instances(template_id);
CREATE INDEX idx_chore_instances_due_date ON chore_instances(due_date);
CREATE INDEX idx_chore_instances_completed ON chore_instances(completed);
CREATE INDEX idx_chore_instances_completed_at ON chore_instances(completed_at);
CREATE INDEX idx_chore_instances_due_completed ON chore_instances(due_date, completed);
CREATE INDEX idx_chore_instances_template_completed ON chore_instances(template_id, completed);

-- Create payouts table
-- This stores records of when money was paid out
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID for the payout
    amount DECIMAL(10,2) NOT NULL,                 -- Amount that was paid out
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- When the payout occurred
    created_by VARCHAR(100) DEFAULT 'user',        -- Who initiated the payout (for future multi-user support)
    notes TEXT NULL,                               -- Optional notes about the payout
    
    -- Add constraints
    CONSTRAINT payout_amount_positive CHECK (amount > 0) -- Payout amount must be positive
);

-- Create indexes for payouts
CREATE INDEX idx_payouts_date ON payouts(date);
CREATE INDEX idx_payouts_amount ON payouts(amount);

-- Create a view for easy access to chore statistics
CREATE VIEW chore_statistics AS
SELECT 
    ct.id as template_id,
    ct.title,
    ct.amount as template_amount,
    ct.frequency,
    ct.is_active,
    COUNT(ci.id) as total_instances,
    COUNT(CASE WHEN ci.completed = TRUE THEN 1 END) as completed_instances,
    COUNT(CASE WHEN ci.completed = FALSE THEN 1 END) as pending_instances,
    COALESCE(SUM(CASE WHEN ci.completed = TRUE THEN ci.amount ELSE 0 END), 0) as total_earned,
    MIN(ci.due_date) as first_due_date,
    MAX(ci.due_date) as last_due_date,
    MIN(CASE WHEN ci.completed = TRUE THEN ci.completed_at END) as first_completed,
    MAX(CASE WHEN ci.completed = TRUE THEN ci.completed_at END) as last_completed
FROM chore_templates ct
LEFT JOIN chore_instances ci ON ct.id = ci.template_id
GROUP BY ct.id, ct.title, ct.amount, ct.frequency, ct.is_active;

-- Create a view for daily chore summaries
CREATE VIEW daily_chore_summary AS
SELECT 
    ci.due_date::date as date,
    COUNT(ci.id) as total_chores,
    COUNT(CASE WHEN ci.completed = TRUE THEN 1 END) as completed_chores,
    COUNT(CASE WHEN ci.completed = FALSE THEN 1 END) as pending_chores,
    COALESCE(SUM(CASE WHEN ci.completed = TRUE THEN ci.amount ELSE 0 END), 0) as daily_earnings
FROM chore_instances ci
GROUP BY ci.due_date::date
ORDER BY date DESC;

-- Create a view for overdue chores
CREATE VIEW overdue_chores AS
SELECT 
    ci.id,
    ci.template_id,
    ci.title,
    ci.amount,
    ci.frequency,
    ci.due_date,
    CURRENT_DATE - ci.due_date as days_overdue
FROM chore_instances ci
WHERE ci.completed = FALSE 
    AND ci.due_date < CURRENT_DATE
ORDER BY ci.due_date ASC;
