CREATE TYPE roles AS ENUM ('student', 'employer', 'admin');

CREATE TABLE IF NOT EXISTS users (
    user_id UUID NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    mobile_number VARCHAR(15) NOT NULL,
    password_hash TEXT NOT NULL,
    role roles NOT NULL DEFAULT 'student',
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);