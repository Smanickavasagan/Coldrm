-- Add new columns to contacts table
ALTER TABLE contacts ADD COLUMN status VARCHAR(50) DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN tags TEXT[];
ALTER TABLE contacts ADD COLUMN last_contacted TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN follow_up_date DATE;
ALTER TABLE contacts ADD COLUMN follow_up_notes TEXT;

-- Add index for better search performance
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Update email_logs to track more info
ALTER TABLE email_logs ADD COLUMN opened BOOLEAN DEFAULT false;
ALTER TABLE email_logs ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE;