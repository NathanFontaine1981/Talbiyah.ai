-- Add Diagnostic Assessment subject for 20-minute assessment sessions
INSERT INTO subjects (name, description)
VALUES ('Diagnostic Assessment', 'Initial 20-minute assessment to evaluate student level and learning needs')
ON CONFLICT (name) DO NOTHING;
