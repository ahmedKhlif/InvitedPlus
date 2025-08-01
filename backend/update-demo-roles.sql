-- Update demo account roles
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@invitedplus.com';
UPDATE "User" SET role = 'ORGANIZER' WHERE email = 'organizer@invitedplus.com';

-- Verify the updates
SELECT email, role, name FROM "User" WHERE email IN ('admin@invitedplus.com', 'organizer@invitedplus.com', 'guest@invitedplus.com');
