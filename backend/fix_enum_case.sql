-- Fix existing data to use lowercase enum values
UPDATE users SET user_type = 'admin' WHERE user_type = 'ADMIN';
UPDATE users SET user_type = 'buyer' WHERE user_type = 'BUYER';
UPDATE users SET user_type = 'seller' WHERE user_type = 'SELLER';
UPDATE users SET user_type = 'supplier' WHERE user_type = 'SUPPLIER';
