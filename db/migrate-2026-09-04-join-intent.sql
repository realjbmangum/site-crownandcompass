-- What a man is actually asking for when he fills in the join form.
--
-- Until this column existed the form asked nothing, so every applicant looked
-- identical and inviting one assigned him to the inviting admin's Watch. A man
-- who wanted to lead his own group got absorbed into someone else's without
-- either of them choosing it.
--
-- 'join' | 'start' | 'unsure'. Nullable on purpose: every row collected before
-- this was never asked, and guessing their answer now would be worse than
-- leaving it blank.
ALTER TABLE subscribers ADD COLUMN intent TEXT;
ALTER TABLE members ADD COLUMN intent TEXT;
