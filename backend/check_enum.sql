-- Check what values are in the usertype enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'usertype'::regtype ORDER BY enumsortorder;
